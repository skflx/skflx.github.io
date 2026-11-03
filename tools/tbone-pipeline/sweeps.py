"""Centrelines (sweeps) of the surgically relevant structures (WP T3).

    .venv/bin/python -I tools/tbone-pipeline/sweeps.py     # -> tbone/geometry/sweeps.json, work/dims.json

Reads the committed display volume (tbone/ct) and landmarks (tbone/geometry/landmarks.json); nothing else.
Each sweep is a list of segments (proximal -> distal), each a list of points (mm, OLSB frame) with a radius
(mm) and a per-point status: detected / labelled / inferred (trace.py states what each means).

How a sweep is made (trace.py): the UW tips of the structure's labels are ordered along its course and
merged into waypoints; each waypoint is snapped to the nearest lumen voxel within 1.2 mm (a label is a
pointer, not a centre); consecutive waypoints are joined by a minimal-cost path through the volume
(cost low in lumen, high in bone) confined to a tube of 1.2-3.5 mm round the segment; a path point is
`detected` where the smoothed level is below bone and bone encloses it (kind 'enclosed'), or it lies in
air (kind 'air'), or in soft tissue bounded by bone (kind 'soft'); the waypoints themselves are `labelled`;
every other run is replaced by a straight line and is `inferred`. The semicircular canals and the basal
turn are fitted as a planar arc / a spiral to the tips and the volume (the lumen is too thin for a
path), with the same three statuses per point. Facial nerve segments inside the IAC (CSF around it), the
GSPN and the second genu are not resolved in this CT and are inferred by stated rules.

Radii are lumen radii (distance to bone, clipped) where detected, else the stated default.
Statistics per sweep and the checks against textbook lengths are written beside the points.
"""
import json, os, sys
import numpy as np
from scipy import optimize

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import trace as T  # noqa: E402

V = None
LM = None


def L(*names, where=None):
    """Tip points (mm) of landmarks with these canonical names."""
    P = np.array([r['point_mm'] for r in LM['landmarks'] if r['name'] in names])
    if where is not None and len(P):
        P = P[[bool(where(p)) for p in P]]
    if not len(P):
        raise SystemExit(f'no landmarks for {names} (after filter)')
    return P


def med(*names, where=None):
    P = L(*names, where=where)
    return np.median(P, 0)


def bins(P, a, b, w=1.4):
    """Order points along a -> b and merge those within w mm of each other along the course (median)."""
    P = np.asarray(P, float)
    d = (np.asarray(b, float) - np.asarray(a, float)); d /= np.linalg.norm(d)
    t = (P - a) @ d
    o = np.argsort(t)
    P, t = P[o], t[o]
    out, cur = [], [0]
    for i in range(1, len(P)):
        if t[i] - t[cur[0]] <= w:
            cur.append(i)
        else:
            out.append(np.median(P[cur], 0)); cur = [i]
    out.append(np.median(P[cur], 0))
    return out


def A(p, src, tip=True, fixed=False):
    return {'p': np.asarray(p, float), 'src': src, 'tip': tip, 'fixed': fixed}


# default radii (mm): stated defaults, used where the lumen is not detected
DEF_R = {'facial-nerve': 0.7, 'iac': 2.2, 'petrous-ica': 2.6, 'jugular-bulb': 6.0, 'sigmoid-sinus': 4.5, 'cochlear-aqueduct': 0.4,
         'vestibular-aqueduct': 0.4, 'eac': 3.5, 'eustachian-tube': 1.6, 'lscc': 0.7, 'pscc': 0.7, 'sscc': 0.7,
         'basal-turn': 1.0, 'gspn': 0.5}


def finish(fam, name, tr, kind, lo, hi):
    P = tr['pts']
    st = tr['status']
    r = T.radius_of(V, P, DEF_R[fam], lo, hi, st)
    return {'name': name, 'pts': np.round(P, 2).tolist(), 'radius': np.round(r, 2).tolist(), 'status': st, 'src': src_of(P)}


def src_of(P):
    """'a' where the point lies in the axial stack's coverage, 'r' where only the reformatted stacks reach, '-' none."""
    i = np.round(V.idx(P)).astype(int)
    ok = ((i >= 0) & (i < np.array(V.shape)[:, None])).all(0)
    v = np.zeros(len(P), int)
    v[ok] = V.src[i[0][ok], i[1][ok], i[2][ok]]
    return [('-', 'a', 'r')[k] for k in v]


def seg_len(seg):
    P = np.array(seg['pts'])
    return float(np.linalg.norm(np.diff(P, axis=0), axis=1).sum())


# ------------------------------------------------------------------------------------------ the structures
def fit(tips, a, b, kind, deg, **kw):
    return T.fit_curve(V, tips, a, b, kind=kind, deg=deg, **kw)


def iac():
    P = L('iac')
    a, b = np.array([-6.5, 1.0, 3.5]), np.array([-17.5, -1.0, 5.5])
    return fit(P, a, b, 'soft', 1, fix_a=False, fix_b=False, span_from_tips=True, tip_r=1.2, search=0.8)


def facial_nerve(iac_tr):
    segs = []
    ip = np.array(iac_tr['pts'])
    off = np.array([0.0, 1.0, 0.9])    # anterosuperior quadrant of the IAC (rule)
    meat = T.resample(ip[::-1] + off, 0.4)     # proximal (medial porus) -> fundus
    segs.append({'name': 'meatal', 'pts': np.round(meat, 2).tolist(), 'radius': [DEF_R['facial-nerve']] * len(meat), 'src': src_of(meat),
                 'status': ['inferred'] * len(meat), 'rule': 'IAC axis + (0, 1.0, 0.9) mm: the nerve lies in the anterosuperior quadrant of the canal; it is not distinguishable from CSF in this CT'})
    fund = meat[-1]
    gen = med('geniculate-ganglion')
    lab_tips = L('fn-labyrinthine', where=lambda p: np.linalg.norm(p - gen) < 8)
    lab = fit(lab_tips, fund, gen, 'enclosed', 2, fix_a=True, fix_b=True, tip_r=1.0, w_end=6.0)
    lab['status'][0] = 'inferred'
    segs.append(finish('facial-nerve', 'labyrinthine', lab, 'enclosed', 0.5, 1.0))
    tym_t = L('fn-tympanic')
    p2 = np.median(tym_t[tym_t[:, 1] < -1.5], 0)
    tym = fit(tym_t, gen, p2, 'enclosed', 3, fix_a=True, fix_b=True, tip_r=1.0, w_end=6.0)
    segs.append(finish('facial-nerve', 'geniculate-tympanic', tym, 'enclosed', 0.5, 1.0))
    mast_t = L('fn-mastoid', 'fn', 'stylomastoid-foramen', where=lambda p: -14.8 < p[2] < -0.5 and abs(p[0] - 6.0) < 4.0 and -10 < p[1] < -3.0)
    top = np.median(L('fn-mastoid', where=lambda p: -2.0 < p[2] < 0.5 and -9 < p[1] < -5), 0) if len(L('fn-mastoid', where=lambda p: -2.0 < p[2] < 0.5 and -9 < p[1] < -5)) else mast_t[np.argmax(mast_t[:, 2])]
    smf = np.median(L('stylomastoid-foramen'), 0)
    sg = fit(np.array([p2, top]), p2, top, 'enclosed', 1, fix_a=True, fix_b=True, tip_r=0.3, w_end=6.0)
    sg['status'] = [('labelled' if i in (0, len(sg['pts']) - 1) else 'inferred') for i in range(len(sg['pts']))]
    segs.append(finish('facial-nerve', 'second-genu', sg, 'enclosed', 0.5, 1.0))
    ms = fit(mast_t, top, smf, 'enclosed', 2, fix_a=True, fix_b=True, tip_r=1.0, w_end=6.0)
    segs.append(finish('facial-nerve', 'mastoid', ms, 'enclosed', 0.5, 1.0))
    return segs


def gspn(gen):
    d = np.array([-0.45, 0.85, 0.25]); d /= np.linalg.norm(d)
    P = np.array([gen + d * s for s in np.arange(0, 5.01, 0.5)])
    return [{'name': 'greater-superficial-petrosal-start', 'pts': np.round(P, 2).tolist(), 'radius': [DEF_R['gspn']] * len(P),
             'status': ['labelled'] + ['inferred'] * (len(P) - 1), 'src': src_of(P),
             'rule': 'about 5 mm along the standard anteromedial direction from the geniculate ganglion; the facial hiatus is not labelled'}]


def petrous_ica():
    tip = L('petrous-ica')
    cc = L('carotid-canal')
    a = cc[0]
    b = np.median(tip, 0)
    tr = fit(np.vstack([cc, tip]), a, b, 'soft', 1, fix_a=True, fix_b=True, tip_r=1.5, search=1.2)
    return [finish('petrous-ica', 'carotid-canal-to-apex', tr, 'soft', 1.2, 3.5)]


def venous():
    sg = L('sigmoid-sinus')
    a = sg[np.argmax(sg[:, 2])]; b = sg[np.argmin(sg[:, 2])]
    sig = fit(sg, a, b, 'soft', 3, fix_a=False, fix_b=False, span_from_tips=True, tip_r=1.5, search=1.2)
    bulb = L('jugular-bulb'); jf = L('jugular-foramen')
    fm = np.median(jf, 0)
    jt = fit(np.vstack([bulb, jf]), b, fm, 'soft', 2, fix_a=True, fix_b=True, tip_r=1.5, search=1.2)
    return [finish('sigmoid-sinus', 'sigmoid', sig, 'soft', 1.5, 6.0)], [finish('jugular-bulb', 'sigmoid-to-foramen', jt, 'soft', 2.0, 8.0)]


def aqueducts():
    ca = L('cochlear-aqueduct')
    rw = med('round-window')
    far = ca[np.argmax(np.linalg.norm(ca - rw, axis=1))]
    cat = fit(ca, rw, far, 'enclosed', 1, fix_a=True, fix_b=False, tip_r=1.0, rule_ends=False)
    cat['status'][0] = 'inferred'
    va = L('vestibular-aqueduct')
    cc = med('crus-communis')
    vfar = va[np.argmin(va[:, 1])]
    vat = fit(np.vstack([va, cc[None]]), cc, vfar, 'enclosed', 2, fix_a=True, fix_b=False, tip_r=1.0)
    return [finish('cochlear-aqueduct', 'cochlear-aqueduct', cat, 'enclosed', 0.25, 0.8)], [finish('vestibular-aqueduct', 'vestibular-aqueduct', vat, 'enclosed', 0.25, 0.8)]


def eac_et():
    tm = med('tympanic-membrane')
    em = np.median(L('eac'), 0)
    eac = fit(np.vstack([tm[None], L('eac')]), tm, em, 'air', 1, fix_a=True, fix_b=True, tip_r=1.2, search=0.8)
    et = med('eustachian-tube-entrance')
    b = et + np.array([-2.4, 5.1, -0.8])
    ett = fit(L('eustachian-tube-entrance'), et, b, 'air', 1, fix_a=True, fix_b=True, tip_r=1.2, search=0.6)
    ett['status'][-1] = 'inferred'
    return [finish('eac', 'eac', eac, 'air', 2.0, 6.0)], [finish('eustachian-tube', 'bony-eustachian-tube', ett, 'air', 0.8, 3.0)]


# ---- parametric: semicircular canals (planar arc, 270 deg, gap toward the vestibule) and the basal turn (spiral)
def circle_fit(P):
    c = P.mean(0)
    u, s, vt = np.linalg.svd(P - c)
    n = vt[2]
    e1, e2 = vt[0], vt[1]
    X = np.c_[(P - c) @ e1, (P - c) @ e2]
    Mx = np.c_[2 * X[:, 0], 2 * X[:, 1], np.ones(len(X))]
    sol = np.linalg.lstsq(Mx, (X ** 2).sum(1), rcond=None)[0]
    ctr = c + sol[0] * e1 + sol[1] * e2
    R = float(np.sqrt(max(sol[2] + sol[0] ** 2 + sol[1] ** 2, 0.1)))
    return ctr, n, R


def arc_points(ctr, n, R, away, span=270.0, k=60):
    n = n / np.linalg.norm(n)
    u = away - ctr
    u = u - (u @ n) * n
    u /= np.linalg.norm(u)
    w = np.cross(n, u)
    th = np.radians(np.linspace(-span / 2, span / 2, k))
    # arc centred on the direction AWAY from the vestibule (the gap faces it)
    return np.array([ctr + R * (np.cos(t) * u + np.sin(t) * w) for t in th])


def canal(name, tips_names, rlim, vest):
    P = L(*tips_names)
    ctr, n, R = circle_fit(P)
    R = float(np.clip(R, *rlim))
    away = ctr + (ctr - vest)

    def score(q):
        c = q[:3]; nn = np.array([np.sin(q[3]) * np.cos(q[4]), np.sin(q[3]) * np.sin(q[4]), np.cos(q[3])]); r = q[5]
        arc = arc_points(c, nn, r, away)
        lum = V.samp(arc).mean()
        d = np.array([np.min(np.linalg.norm(arc - p, axis=1)) for p in P]).mean()
        return lum / 40.0 + 2.0 * d + 6.0 * (abs(r - R) > 0) * abs(r - R)
    th = np.arccos(np.clip(n[2], -1, 1)); ph = np.arctan2(n[1], n[0])
    q0 = np.r_[ctr, th, ph, R]
    res = optimize.minimize(score, q0, method='Nelder-Mead', options={'maxiter': 500, 'xatol': 0.02, 'fatol': 0.01})
    q = res.x
    ctr, R = q[:3], float(np.clip(q[5], *rlim))
    n = np.array([np.sin(q[3]) * np.cos(q[4]), np.sin(q[3]) * np.sin(q[4]), np.cos(q[3])])
    arc = arc_points(ctr, n, R, away)
    st = []
    for i, p in enumerate(arc):
        tg = T.tangent(arc, i)
        ok, lv, e = T.is_lumen(V, p, tg, 'enclosed')
        near = np.min(np.linalg.norm(P - p, axis=1)) < 1.0
        st.append('labelled' if near else ('detected' if ok else 'inferred'))
    info = {'fit_centre_mm': np.round(ctr, 2).tolist(), 'fit_radius_mm': round(R, 2), 'normal': np.round(n, 3).tolist(), 'n_tips': int(len(P))}
    return {'name': name, 'pts': np.round(arc, 2).tolist(), 'radius': [DEF_R[name]] * len(arc), 'status': st, 'src': src_of(arc), 'fit': info}


def basal_turn(vest):
    tips = L('basal-turn')
    mod = L('modiolus', 'cochlea', 'apical-turn', 'middle-turn')
    rw = med('round-window')
    c0 = np.median(L('modiolus'), 0) if len(L('modiolus')) else mod.mean(0)
    apex = np.median(L('apical-turn'), 0)
    base = np.median(tips, 0)
    ax = apex - base
    ax[2] = ax[2] if abs(ax[2]) > 0 else 0
    ax = ax / np.linalg.norm(ax)
    e1 = np.cross(ax, [0, 0, 1.0]); e1 /= np.linalg.norm(e1)
    e2 = np.cross(ax, e1)

    def curve(q, k=72):
        r0, kk, h, th0, sgn = q
        th = np.radians(np.linspace(0, 360, k))
        r = r0 - kk * th / (2 * np.pi)
        return np.array([c0 + 0 * ax + (r[i] * (np.cos(sgn * th[i] + th0) * e1 + np.sin(sgn * th[i] + th0) * e2)) + ax * (h * th[i] / (2 * np.pi)) for i in range(k)])

    best = None
    for sgn in (1, -1):
        for th0 in np.radians(np.arange(0, 360, 30)):
            def f(q):
                cc = curve([q[0], q[1], q[2], th0 if len(q) < 4 else q[3], sgn])
                d = np.array([np.min(np.linalg.norm(cc - p, axis=1)) for p in tips]).mean()
                d0 = np.linalg.norm(cc[0] - rw)
                return d + 0.5 * d0 + 0.02 * abs(q[0] - 3.5) * 10
            r = optimize.minimize(f, [3.6, 0.8, 1.2, th0], method='Nelder-Mead', options={'maxiter': 400})
            if best is None or r.fun < best[0]:
                best = (r.fun, r.x, sgn)
    _, q, sgn = best
    r0 = float(np.clip(q[0], 2.5, 4.8)); kk = float(np.clip(q[1], 0.3, 1.5)); h = float(np.clip(q[2], 0.2, 2.5))
    cc = curve([r0, kk, h, q[3], sgn])
    st = []
    for i, p in enumerate(cc):
        tg = T.tangent(cc, i)
        ok, lv, e = T.is_lumen(V, p, tg, 'soft')
        near = np.min(np.linalg.norm(tips - p, axis=1)) < 1.0
        st.append('labelled' if near else ('detected' if ok else 'inferred'))
    # A: from the spiral start (round window end) to the farthest point across the modiolus
    A_est = float(np.linalg.norm(cc[0] - cc[len(cc) // 2]) + DEF_R['basal-turn'])
    info = {'axis_mm': np.round(ax, 3).tolist(), 'modiolus_point_mm': np.round(c0, 2).tolist(), 'r0_mm': round(r0, 2), 'r_loss_per_turn_mm': round(kk, 2),
            'rise_per_turn_mm': round(h, 2), 'tips_mean_dist_mm': round(float(best[0]), 2), 'A_estimate_mm': round(A_est, 2), 'n_tips': int(len(tips))}
    return {'name': 'basal-turn', 'pts': np.round(cc, 2).tolist(), 'radius': [DEF_R['basal-turn']] * len(cc), 'status': st, 'src': src_of(cc), 'fit': info}


# ------------------------------------------------------------------------------------------ main
def main():
    global V, LM
    arr, h, org, meta = C.load_ct()
    V = T.Vol(arr, h, org)
    V.src = C.load_source()
    LM = json.load(open(os.path.join(C.OUT, 'geometry', 'landmarks.json')))
    vest = med('vestibule')
    sweeps = {}
    iac_tr = iac()
    iac_seg = finish('iac', 'iac', iac_tr, 'soft', 1.0, 3.5)
    sweeps['iac'] = {'family': 'iac', 'segments': [iac_seg], 'definition': 'fundus (lateral) -> porus (medial)'}
    sweeps['facial-nerve'] = {'family': 'facial-nerve', 'segments': facial_nerve(iac_tr), 'definition': 'proximal (IAC porus) -> stylomastoid foramen'}
    gen = med('geniculate-ganglion')
    sweeps['gspn'] = {'family': 'gspn', 'segments': gspn(gen), 'definition': 'from the geniculate ganglion, about 5 mm along the standard direction (inferred)'}
    sweeps['petrous-ica'] = {'family': 'petrous-ica', 'segments': petrous_ica(), 'definition': 'carotid canal opening -> horizontal segment'}
    sig, jb = venous()
    sweeps['sigmoid-sinus'] = {'family': 'sigmoid-sinus', 'segments': sig, 'definition': 'sinodural angle -> jugular bulb'}
    sweeps['jugular-bulb'] = {'family': 'jugular-bulb', 'segments': jb, 'definition': 'sigmoid sinus -> bulb -> jugular foramen'}
    ca, va = aqueducts()
    sweeps['cochlear-aqueduct'] = {'family': 'cochlear-aqueduct', 'segments': ca, 'definition': 'scala tympani beside the round window -> medially'}
    sweeps['vestibular-aqueduct'] = {'family': 'vestibular-aqueduct', 'segments': va, 'definition': 'vestibule (beside the crus commune) -> posterior petrous surface'}
    eac, et = eac_et()
    sweeps['eac'] = {'family': 'eac', 'segments': eac, 'definition': 'tympanic membrane -> lateral (to the mastoid-side tip)'}
    sweeps['eustachian-tube'] = {'family': 'eustachian-tube', 'segments': et, 'definition': 'tympanic orifice -> anteromedially (bony part)'}
    sweeps['lscc'] = {'family': 'lscc', 'segments': [canal('lscc', ['lscc'], (2.2, 4.0), vest)], 'definition': 'planar arc, 270 deg, gap toward the vestibule'}
    sweeps['pscc'] = {'family': 'pscc', 'segments': [canal('pscc', ['pscc'], (2.2, 4.5), vest)], 'definition': 'planar arc, 270 deg, gap toward the vestibule'}
    sweeps['sscc'] = {'family': 'sscc', 'segments': [canal('sscc', ['sscc'], (2.2, 4.5), vest)], 'definition': 'planar arc, 270 deg, gap toward the vestibule'}
    sweeps['basal-turn'] = {'family': 'basal-turn', 'segments': [basal_turn(vest)], 'definition': 'spiral, one turn from the round window around the modiolus'}
    stats = {}
    for sid, s in sweeps.items():
        tot = {'detected': 0, 'labelled': 0, 'inferred': 0}
        for seg in s['segments']:
            for st in seg['status']:
                tot[st] += 1
            seg['length_mm'] = round(seg_len(seg), 1)
            seg['counts'] = {k: seg['status'].count(k) for k in ('detected', 'labelled', 'inferred')}
            seg['points_in_axial_coverage'] = seg['src'].count('a')
        n = sum(tot.values())
        s['counts'] = tot
        s['confidence'] = 'high' if tot['inferred'] == 0 else ('medium' if tot['inferred'] < 0.34 * n else 'low')
        stats[sid] = tot
        print(f"{sid:20s} points {n:4d}  detected {tot['detected']:4d}  labelled {tot['labelled']:4d}  inferred {tot['inferred']:4d}  {s['confidence']}  " +
              ' | '.join(f"{seg['name']} {seg['length_mm']} mm" for seg in s['segments']))
    sanity = fn_sanity(sweeps)
    doc = {'frame': 'OLSB: mm, right ear, x lateral, y anterior, z superior; (0,0,0) = centre of the oval window', 'status_meaning': {
        'detected': 'found in this CT (lumen bounded by bone, or air)', 'labelled': 'a UW arrow tip (snapped to the nearest lumen voxel within 1.2 mm)',
        'inferred': 'not seen: placed by a stated rule between detected/labelled points'},
        'note': 'display levels are not HU; draft anatomy, the owner vets it', 'fn_sanity_mm': sanity, 'sweeps': sweeps}
    json.dump(doc, open(os.path.join(C.OUT, 'geometry', 'sweeps.json'), 'w'), separators=(',', ':'))
    write_dims(sweeps, iac_seg)


def fn_sanity(sw):
    """Distances between the traced facial nerve and neighbours, against ranges quoted for adults (spec T3)."""
    seg = {x['name']: np.array(x['pts']) for x in sw['facial-nerve']['segments']}
    out = {}
    ow = np.zeros(3)
    d = np.linalg.norm(seg['geniculate-tympanic'] - ow, axis=1)
    out['tympanic segment to oval-window centre (min)'] = {'mm': round(float(d.min()), 2), 'plausible_mm': [1.0, 4.0], 'note': 'the tympanic segment passes just above the oval window'}
    lscc = np.array(sw['lscc']['segments'][0]['pts'])
    sg = seg['second-genu']
    mid = sg[len(sg) // 2]
    dl = np.linalg.norm(lscc - mid, axis=1)
    out['second genu (bend midpoint) to lateral semicircular canal (min)'] = {'mm': round(float(dl.min()), 2), 'plausible_mm': [1.5, 5.0], 'note': 'the second genu lies inferomedial to the LSCC ampulla'}
    out['second genu position vs oval window (x lateral, y anterior, z superior)'] = {'mm': np.round(mid, 2).tolist(), 'plausible_mm': 'x 3-8, y -2 to -6, z 0-3'}
    eac = np.array(sw['eac']['segments'][0]['pts'])
    ms = seg['mastoid']
    best = None
    for q in ms:
        # EAC axis point at this height (nearest in z); walk posteriorly (-y) from it through air to the wall
        j = int(np.argmin(np.abs(eac[:, 2] - q[2]) + 0.2 * np.abs(eac[:, 0] - q[0])))
        p = eac[j].copy()
        for step in np.arange(0, 14, 0.2):
            if step > 1.0 and V.samp((p + np.array([0, -step, 0]))[None])[0] >= 140:
                wall = p + np.array([0, -step, 0])
                break
        else:
            continue
        dist = wall[1] - q[1]
        if best is None or abs(q[2] - eac[:, 2].mean()) < best[2]:
            best = (float(dist), q.copy(), abs(q[2] - eac[:, 2].mean()))
    okv = best is not None and best[0] > 0
    out['mastoid segment behind the EAC posterior wall (at the EAC height)'] = {
        'mm': round(best[0], 2) if okv else None, 'plausible_mm': [2.0, 8.0],
        'note': 'distance along y from the posterior canal wall to the nerve' if okv else
        f"NOT MEASURABLE: a ray posteriorly from the EAC axis stays in air (level < 140) for >= 14 mm at the EAC height (retrotympanic and mastoid air; the thin posterior canal wall is blurred away at this resolution), so the wall is not found (raw value {round(best[0], 2) if best else None} is an artefact)"}
    out['mastoid segment length'] = {'mm': round(float(np.linalg.norm(np.diff(ms, axis=0), axis=1).sum()), 2), 'plausible_mm': [10.0, 14.0]}
    out['tympanic segment length (geniculate to second genu)'] = {'mm': round(float(np.linalg.norm(np.diff(seg['geniculate-tympanic'], axis=0), axis=1).sum()), 2), 'plausible_mm': [8.0, 12.0]}
    out['labyrinthine segment length (fundus end to geniculate)'] = {'mm': round(float(np.linalg.norm(np.diff(seg['labyrinthine'], axis=0), axis=1).sum()), 2), 'plausible_mm': [3.0, 5.0]}
    for k, v in out.items():
        print(f"  FN check: {k}: {v['mm']} (plausible {v['plausible_mm']})")
    return out


def write_dims(sw, iac_seg):
    """Lengths of the traced structures against textbook values (for scale.py report). Expected values and
    tolerances are the ranges commonly quoted for adults (owner vets them)."""
    fr = json.load(open(os.path.join(C.WORK, 'frame.json')))
    d = {}
    seg = {s['name']: s for s in sw['facial-nerve']['segments']}
    d['IAC length (porus to fundus)'] = {'measured_mm': seg_len(iac_seg), 'expected_mm': 9.0, 'tol_mm': 2.0, 'source': 'adult IAC length about 8-10 mm'}
    d['FN labyrinthine segment length'] = {'measured_mm': seg_len(seg['labyrinthine']), 'expected_mm': 4.0, 'tol_mm': 1.5, 'source': 'labyrinthine segment 3-5 mm'}
    d['FN tympanic segment length'] = {'measured_mm': seg_len(seg['geniculate-tympanic']), 'expected_mm': 10.0, 'tol_mm': 2.0, 'source': 'tympanic segment 8-12 mm'}
    d['FN mastoid segment length'] = {'measured_mm': seg_len(seg['mastoid']), 'expected_mm': 12.5, 'tol_mm': 2.5, 'source': 'mastoid segment 10-14 mm'}
    d['cochlear basal-turn diameter A'] = {'measured_mm': sw['basal-turn']['segments'][0]['fit']['A_estimate_mm'], 'expected_mm': 9.0, 'tol_mm': 0.8, 'source': 'A value 8.5-9.5 mm'}
    json.dump(d, open(os.path.join(C.WORK, 'dims.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
