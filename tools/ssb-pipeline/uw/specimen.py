"""Reference specimen, stage B: CT volume in the RAS frame, named air spaces, landmarks.

    .venv/bin/python tools/ssb-pipeline/uw/specimen.py [--png-dir DIR]

Needs volume.py / register.py / scale.py / labels3d.py to have run (registration.json).
Writes (formats: ssb/ct/ct.json header; binding spec in the CT-mode handoff):
  ssb/ct/ct.u8.gz, ssb/ct/labels.u16.gz, ssb/ct/ct.json   0.5 mm RAS grid, cropped, face masked
  ssb/geometry/labels.json                                 append-only index -> <id>.<side>
  ssb/geometry/landmarks.json (+ landmarks.meta.json)      {"<id>.<side>": [r, a, s]}
  incoming/uw-sinusanatomy2/_recon/specimen-native.npz     native-resolution masked copy (gitignored)
and the "specimen" section of registration.json (volumes, tip-hit rates, seeds, proxies).

Method (each step's limits are in the report it writes):
1. Resample the axial display volume (trilinear) on a 0.5 mm grid in RAS (frame from
   labels3d.py: origin ANS, x = 0 on the midsagittal plane, axial parallel to Frankfort).
2. Face mask: per axial slice, the convex hull of bone (display >= 150, ~ +650 HU) dilated
   3 mm; soft tissue outside it is set to 0 (the source's own "no data" value).
3. Air = display < 78 (~ -480 HU) inside the undilated hull. Named compartments grow from
   UW arrow tips (axial + sagittal, mapped through register.py's model; terms -> graph ids
   through crosswalk.json / vocab-extra.json) by marker watershed on the negated distance
   to the air boundary, 6-connected, so compartments meet at the narrowest necks (ostia).
   A tip is snapped to the most interior air voxel within 3 mm (a tip drawn on a wall would
   otherwise land on the wrong side of it).
4. Anatomical cuts the tips cannot give: nasal cavity | nasopharynx at the coronal plane of
   the posterior nasal spine (choanae); anterior | posterior ethmoid at a per-side coronal
   plane midway between the anterior- and posterior-ethmoid tips - a PROXY for the basal
   lamella, which this bone-window, 0.6 mm data does not show as a continuous plate.
   Unseeded air inside the ethmoid box joins the ethmoid compartment of its side and half.
"""
import argparse, ast, gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi
from skimage.morphology import convex_hull_image
from skimage.segmentation import watershed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import load, read_results, write_results, CACHE  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
STEP = 0.5                      # mm, output grid
BONE, AIR = 150, 78             # display thresholds (~ +650 HU, ~ -480 HU)
# crop (RAS mm): lateral orbital walls; nasal bones to dorsum sellae/upper clivus; maxillary
# floor (below the hard palate: the alveolar recess must stay whole) to the frontal sinus top
BOX = {'r': (-52.0, 52.0), 'a': (-90.0, 22.0), 's': (-16.0, 80.0)}

# UW term -> compartment graph id (the compartments this stage names). Nasal-cavity seeds come
# from structures that sit in or on the nasal airway (turbinates, septum, middle meatus).
SEED_TERMS = {
    'maxillary sinus': 's.maxillary-sinus', 'frontal sinus': 's.frontal-sinus',
    'sphenoid sinus': 's.sphenoid-sinus', 'frontal recess': 's.frontal-recess',
    'frontal sinus drainage pathway': 's.frontal-recess', 'agger nasi cell': 's.agger-nasi-cell',
    'ethmoid bulla': 's.ethmoid-bulla', 'anterior ethmoid': 's.anterior-ethmoid-cells',
    'anterior ethmoid sinus': 's.anterior-ethmoid-cells', 'posterior ethmoid': 's.posterior-ethmoid-cells',
    'posterior ethmoid air cells': 's.posterior-ethmoid-cells', 'ethmoid sinus': 'ethmoid',
    'nasopharynx': 's.nasopharynx', 'inferior turbinate': 's.nasal-cavity', 'middle turbinate': 's.nasal-cavity',
    'nasal septum': 's.nasal-cavity', 'middle meatus': 's.nasal-cavity', 'hiatus semilunaris': 's.nasal-cavity',
}
MIDLINE_IDS = {'s.nasopharynx'}
ETHMOID = ('s.anterior-ethmoid-cells', 's.posterior-ethmoid-cells')
# published adult volumes, per side unless stated (cm3): the sanity check, not a target
VOLUME_REFS = {
    's.maxillary-sinus': {'range': [8, 25], 'cite': 'Sahlstrand-Johnson 2011 doi:10.1186/1471-2342-11-8: 15.7 +/- 5.3; '
                                                    'Pirner 2009 doi:10.1007/s00405-008-0777-7: 17.4 / 17.9'},
    's.frontal-sinus': {'range': [0.5, 11], 'cite': 'Pirner 2009: 4.2 / 4.0; Sanchez Fernandez 2000 doi:10.1080/000164800750001080: '
                                                   '3.7 (SD 3.6)'},
    's.sphenoid-sinus': {'range': [1, 11], 'cite': 'Pirner 2009: 5.3 / 5.5; Sanchez Fernandez 2000: 3.5 (SD 2.6)'},
    'ethmoid': {'range': [2.5, 9], 'cite': 'Sanchez Fernandez 2000: 5.5 (SD 2.0); Park 2010 doi:10.1016/j.ijporl.2010.08.018: '
                                           '4.5 +/- 0.9 (anterior + posterior ethmoid, incl. agger, bulla, recess cells)'},
}


# ---------------------------------------------------------------- frame and grid
def frame():
    res = read_results()
    A = np.array(res['frame']['axial_px_to_ras_mm_affine'])
    dz = res['registration']['sagittal']['params']['dz']
    return A, dz, res


def grid_axes(box=BOX, step=STEP):
    return [np.arange(box[k][0], box[k][1] + 1e-6, step) for k in ('r', 'a', 's')]


def resample(vol, A, dz, box=BOX, step=STEP, order=1):
    """vol[n, y, x] (axial) -> out[k, j, i] on the RAS grid (i -> r, j -> a, k -> s)."""
    r, a, s = grid_axes(box, step)
    Ainv = np.linalg.inv(A)
    out = np.zeros((len(s), len(a), len(r)), vol.dtype if order == 0 else np.float32)
    R, Aa = np.meshgrid(r, a, indexing='xy')          # (ny, nx)
    for k, sv in enumerate(s):
        P = np.stack([R.ravel(), Aa.ravel(), np.full(R.size, sv), np.ones(R.size)])
        x, y, Z, _ = Ainv @ P
        out[k] = ndi.map_coordinates(vol, [Z / dz, y, x], order=order, cval=0).reshape(R.shape)
    return out


def ras_to_index(p, box=BOX, step=STEP):
    return np.array([(p[2] - box['s'][0]) / step, (p[1] - box['a'][0]) / step, (p[0] - box['r'][0]) / step])


def index_to_ras(kji, box=BOX, step=STEP):
    k, j, i = kji
    return np.array([box['r'][0] + i * step, box['a'][0] + j * step, box['s'][0] + k * step])


# ---------------------------------------------------------------- masks
def envelopes(ct):
    bone = ct >= BONE
    hull = np.zeros_like(bone)
    for k in range(ct.shape[0]):
        if bone[k].sum() > 20:
            hull[k] = convex_hull_image(bone[k])
    disk = ndi.generate_binary_structure(2, 1)
    keep = np.stack([ndi.binary_dilation(h, disk, iterations=int(3 / STEP)) for h in hull])
    return bone, hull, keep


# ---------------------------------------------------------------- seeds
def load_canon():
    import labels3d
    return labels3d.load_canon()


def tips_by_term(res):
    return res['labels']['points_ras_mm']


def snap(p, air, dist, radius_mm=3.0):
    c = np.round(ras_to_index(p)).astype(int)
    rv = int(radius_mm / STEP)
    lo = np.maximum(c - rv, 0); hi = np.minimum(c + rv + 1, air.shape)
    if np.any(lo >= hi):
        return None
    sub = np.where(air[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], dist[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], -1)
    kk, jj, ii = np.mgrid[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]]
    sub = np.where((kk - c[0]) ** 2 + (jj - c[1]) ** 2 + (ii - c[2]) ** 2 <= rv * rv, sub, -1)
    if sub.max() <= 0:
        return None
    return np.array(np.unravel_index(np.argmax(sub), sub.shape)) + lo


def side_of(r, cid):
    return 'M' if cid in MIDLINE_IDS else ('R' if r > 0 else 'L')


def find_pns(ct):
    """Posterior nasal spine: posterior end of the hard palate on the midsagittal band
    (|r| <= 2 mm, s in [-8, 3] mm), scanning back from the ANS while bone continues."""
    r, a, s = grid_axes()
    ir = np.nonzero(np.abs(r) <= 2)[0]; ks = np.nonzero((s >= -8) & (s <= 3))[0]
    band = ct[ks][:, :, ir] >= BONE                      # (k, j, i)
    col = band.any(axis=(0, 2))                          # bone present at each a
    j0 = int(np.argmin(np.abs(a - (-5.0))))
    j = j0
    gap = 0
    while j > 0:
        if col[j]:
            gap = 0; last = j
        else:
            gap += 1
            if gap > int(2 / STEP):
                break
        j -= 1
    return float(a[last])


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--png-dir', default=CACHE)
    args = ap.parse_args()
    A, dz, res = frame()
    V = load('axial')
    # the bone hull is taken over the whole head section (the skull ring must close round the
    # brain), then cropped to BOX
    big = {'r': (-78.0, 78.0), 'a': (-136.0, BOX['a'][1]), 's': BOX['s']}
    ctb = resample(V.astype(np.float32), A, dz, big)
    _, hull_b, keep_b = envelopes(ctb)
    i0 = int(round((BOX['r'][0] - big['r'][0]) / STEP)); j0 = int(round((BOX['a'][0] - big['a'][0]) / STEP))
    nr, na = len(grid_axes()[0]), len(grid_axes()[1])
    ct = ctb[:, j0:j0 + na, i0:i0 + nr]
    hull = hull_b[:, j0:j0 + na, i0:i0 + nr]; keep = keep_b[:, j0:j0 + na, i0:i0 + nr]
    del ctb, hull_b, keep_b
    ct_out = np.where(keep, np.clip(np.round(ct), 0, 255), 0).astype(np.uint8)
    air = (ct < AIR) & hull
    dist = ndi.distance_transform_edt(air, sampling=STEP)

    # seeds
    tips = tips_by_term(res)
    s_frontal_floor = min(p[2] for pl in ('axial', 'sagittal') for p in tips['frontal sinus'].get(pl, [])) - 3.0
    comps = {}                                           # '<id>.<side>' -> watershed label
    markers = np.zeros(ct.shape, np.int32)
    seeds_used, seeds_dropped = {}, {}
    for term, cid in SEED_TERMS.items():
        for pl in ('axial', 'sagittal'):
            for p in tips.get(term, {}).get(pl, []):
                if cid == 's.frontal-recess' and p[2] > s_frontal_floor:
                    seeds_dropped[term + ' (above the frontal sinus floor)'] = seeds_dropped.get(term + ' (above the frontal sinus floor)', 0) + 1
                    continue
                q = snap(p, air, dist)
                if q is None:
                    seeds_dropped[term] = seeds_dropped.get(term, 0) + 1
                    continue
                key = f'{cid}.{side_of(p[0], cid)}'
                if key not in comps:
                    comps[key] = len(comps) + 1
                k, j, i = q
                markers[max(0, k - 1):k + 2, max(0, j - 1):j + 2, max(0, i - 1):i + 2] = comps[key]
                seeds_used.setdefault(key, []).append(term)
    ws = watershed(-dist, markers, mask=air, connectivity=1)
    names = {v: k for k, v in comps.items()}
    r_ax, a_ax, s_ax = grid_axes()
    J = a_ax[None, :, None]; Rr = r_ax[None, None, :]; Ss = s_ax[:, None, None]
    lab = np.zeros(ct.shape, np.int32)
    out = {}

    def put(mask, key):
        if key not in out:
            out[key] = len(out) + 1
        lab[mask] = out[key]

    def union(cid):
        return np.isin(ws, [v for v, k in names.items() if k.rsplit('.', 1)[0] == cid])
    for v, key in names.items():
        if key.rsplit('.', 1)[0] not in ('s.nasal-cavity', 's.nasopharynx', 's.sphenoid-sinus', 's.frontal-sinus', 's.frontal-recess'):
            put(ws == v, key)

    # nasal cavity | nasopharynx: behind the PNS coronal plane and below the sphenoid floor
    # (the choanal arch) is nasopharynx; the sphenoethmoidal recess above it stays nasal cavity
    a_pns = find_pns(ct)
    sph = union('s.sphenoid-sinus')
    mid = np.abs(Rr) < 5
    s_arch = float(Ss.ravel()[np.nonzero((sph & mid).any(axis=(1, 2)))[0].min()]) - 1.0
    nas = union('s.nasal-cavity') | union('s.nasopharynx')
    npx = nas & (J < a_pns) & (Ss < s_arch)
    put(npx, 's.nasopharynx.M')
    put(nas & ~npx & (Rr > 0), 's.nasal-cavity.R'); put(nas & ~npx & (Rr <= 0), 's.nasal-cavity.L')

    # sphenoid R | L at the intersinus septum: erode 1 mm so septal gaps open, keep the large
    # pieces, name each by the side of the sphenoid tips it holds, regrow within the sinus
    def split_by_septum(m, cid, min_cm3=0.3):
        er = ndi.binary_erosion(m, iterations=2)
        cl, n = ndi.label(er)
        sizes = np.bincount(cl.ravel()); sizes[0] = 0
        seeds = np.zeros(m.shape, np.int32)
        sides = {}
        for c in np.nonzero(sizes * STEP ** 3 / 1000 >= min_cm3)[0]:
            votes = [np.sign(p[0]) for pl in ('axial', 'sagittal') for p in tips.get(cid_terms[cid], {}).get(pl, [])
                     if cl[tuple(np.clip(np.round(ras_to_index(p)).astype(int), 0, np.array(m.shape) - 1))] == c]
            side = 'R' if (np.mean(votes) if votes else np.sign(r_ax[np.nonzero(cl == c)[2]].mean())) > 0 else 'L'
            sides[c] = side
            seeds[cl == c] = 1 if side == 'R' else 2
        if len(set(sides.values())) < 2:
            return None, sides
        grown = watershed(-dist, seeds, mask=m, connectivity=1)
        return grown, sides
    cid_terms = {'s.sphenoid-sinus': 'sphenoid sinus', 's.frontal-sinus': 'frontal sinus'}
    sph_split, sph_sides = split_by_septum(sph, 's.sphenoid-sinus')
    if sph_split is None:                                  # no septum found: keep the tip-seeded watershed
        for v, key in names.items():
            if key.startswith('s.sphenoid-sinus'):
                put(ws == v, key)
        sph_method = 'tip-seeded watershed (no complete septum found)'
    else:
        put(sph_split == 1, 's.sphenoid-sinus.R'); put(sph_split == 2, 's.sphenoid-sinus.L')
        sph_method = f'septum: {len(sph_sides)} pieces after 1 mm erosion, sides {sorted(sph_sides.values())}'

    # frontal sinus | frontal recess at the ostium (narrowest cross-section of the outflow)
    fr = union('s.frontal-sinus') | union('s.frontal-recess')
    fs_split, fs_sides = split_by_septum(union('s.frontal-sinus'), 's.frontal-sinus', 0.05)
    ostia = {}
    for side, sgn in (('R', 1), ('L', -1)):
        m = fr & (((Rr > 0) == (sgn > 0))) if fs_split is None else None
        if fs_split is not None:
            fs_side = fs_split == (1 if side == 'R' else 2)
            m = fs_side | (union('s.frontal-recess') & (((Rr > 0) == (sgn > 0))))
        area = ndi.uniform_filter1d(m.sum(axis=(1, 2)).astype(float), 3)
        # ostium: from the widest level of the sinus body walk down while the cross-section
        # keeps shrinking; the first minimum is the narrowest point of the outflow
        body = np.nonzero((s_ax >= s_frontal_floor - 2) & (s_ax <= s_frontal_floor + 15))[0]
        if not len(body) or area[body].max() == 0:
            continue
        k_os = int(body[np.argmax(area[body])])
        while k_os > 0 and s_ax[k_os - 1] >= 30 and area[k_os - 1] > 0 and area[k_os - 1] <= area[k_os] * 1.02:
            k_os -= 1
        above = m & (Ss > s_ax[k_os]); below = m & (Ss <= s_ax[k_os])
        put(above, f's.frontal-sinus.{side}')
        put(below, f's.frontal-recess.{side}')
        kk, jj, ii = np.nonzero(m[k_os:k_os + 1])
        ostia[side] = {'s_mm': float(s_ax[k_os]), 'area_mm2': float(area[k_os] * STEP ** 2),
                       'centre_ras': [float(r_ax[ii].mean()), float(a_ax[jj].mean()), float(s_ax[k_os])]}

    # ethmoid anterior | posterior: per-side coronal plane midway between the anterior- and
    # posterior-ethmoid tips (PROXY for the basal lamella)
    split = {}
    for side, sgn in (('R', 1), ('L', -1)):
        ant = [p[1] for t in ('anterior ethmoid', 'anterior ethmoid sinus') for pl in ('axial', 'sagittal')
               for p in tips.get(t, {}).get(pl, []) if np.sign(p[0]) == sgn]
        post = [p[1] for t in ('posterior ethmoid', 'posterior ethmoid air cells') for pl in ('axial', 'sagittal')
                for p in tips.get(t, {}).get(pl, []) if np.sign(p[0]) == sgn]
        split[side] = {'n_anterior_tips': len(ant), 'n_posterior_tips': len(post),
                       'a_mm': (min(ant) + max(post)) / 2 if ant and post else None}
    both = [v['a_mm'] for v in split.values() if v['a_mm'] is not None]
    for v in split.values():
        if v['a_mm'] is None:
            v['a_mm'] = float(np.mean(both)); v['borrowed'] = True
    bl = [p for pl in ('axial', 'sagittal') for p in tips.get('basal lamella middle turbinate', {}).get(pl, [])]
    eth_box = (np.abs(Rr) < 20) & (J > -62) & (J < -8) & (Ss > 12) & (Ss < 55)
    eth_keys = [k for k in out if k.rsplit('.', 1)[0] in ETHMOID + ('ethmoid',)]
    free = (lab == 0) & air & eth_box
    cl, _ = ndi.label(free)
    free &= np.bincount(cl.ravel())[cl] >= int(0.02 / STEP ** 3 * 1000)     # < 0.02 cm3: noise, leave
    eth = np.isin(lab, [out[k] for k in eth_keys]) | free
    for key in eth_keys:
        lab[lab == out[key]] = 0
    for side, sgn in (('R', 1), ('L', -1)):
        m = eth & (((Rr > 0) == (sgn > 0)))
        put(m & (J >= split[side]['a_mm']), f's.anterior-ethmoid-cells.{side}')
        put(m & (J < split[side]['a_mm']), f's.posterior-ethmoid-cells.{side}')
    for key in list(out):
        if not (lab == out[key]).any():
            out.pop(key)

    # stable index table (append-only): reuse existing indices, add new at the end
    lpath = os.path.join(REPO, 'ssb/geometry/labels.json')
    table = json.load(open(lpath))['labels'] if os.path.exists(lpath) else {}
    by_name = {v: int(k) for k, v in table.items()}
    labels = np.zeros(ct.shape, np.uint16)
    vox_ml = STEP ** 3 / 1000.0
    volumes = {}
    for key, v in sorted(out.items(), key=lambda kv: kv[0]):
        n = int((lab == v).sum())
        if n == 0:
            continue
        if key not in by_name:
            by_name[key] = max(by_name.values(), default=0) + 1
        labels[lab == v] = by_name[key]
        volumes[key] = round(n * vox_ml, 2)
    table = {str(i): k for k, i in sorted(by_name.items(), key=lambda kv: kv[1])}

    # tip-hit check: % of each term's tips (axial + sagittal) inside the compartment named for it
    hits = {}
    for term, cid in SEED_TERMS.items():
        if cid in ('s.nasal-cavity', 'ethmoid'):
            continue
        n = h = 0
        for pl in ('axial', 'sagittal'):
            for p in tips.get(term, {}).get(pl, []):
                idx = np.round(ras_to_index(p)).astype(int)
                if np.any(idx < 0) or np.any(idx >= labels.shape):
                    continue
                n += 1
                name = table.get(str(int(labels[tuple(idx)])), '')
                if name.rsplit('.', 1)[0] == cid:
                    h += 1
        if n:
            hits[term] = {'id': cid, 'n': n, 'hit_pct': round(100 * h / n, 1)}
    # the same allowing 1.5 mm (a tip drawn on the wall of its cavity)
    for term, rec in hits.items():
        n = h = 0
        for pl in ('axial', 'sagittal'):
            for p in tips.get(term, {}).get(pl, []):
                c = np.round(ras_to_index(p)).astype(int)
                lo = np.maximum(c - 3, 0); hi = np.minimum(c + 4, labels.shape)
                if np.any(lo >= hi):
                    continue
                n += 1
                sub = labels[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]]
                if any(table.get(str(int(u)), '').rsplit('.', 1)[0] == rec['id'] for u in np.unique(sub) if u):
                    h += 1
        rec['hit_pct_within_1.5mm'] = round(100 * h / max(1, n), 1)

    # sanity volumes
    eth_tot = {s: round(sum(v for k, v in volumes.items() if k.endswith('.' + s) and
                            k.rsplit('.', 1)[0] in ETHMOID + ('s.agger-nasi-cell', 's.ethmoid-bulla', 's.frontal-recess')), 2)
               for s in ('R', 'L')}
    sanity = {}
    for key, v in list(volumes.items()) + [(f'ethmoid complex.{s}', t) for s, t in eth_tot.items()]:
        cid = key.rsplit('.', 1)[0]
        ref = VOLUME_REFS.get('ethmoid' if cid == 'ethmoid complex' else cid)
        if ref:
            sanity[key] = {'cm3': v, 'ref_range': ref['range'], 'outlier': not (ref['range'][0] <= v <= ref['range'][1])}

    write_outputs(ct_out, labels, table, A)
    np.savez_compressed(os.path.join(CACHE, 'specimen-grid.npz'), ct=ct_out, labels=labels, air=air, hull=hull)
    native_copy(V, A, dz)
    lm, meta = landmarks(ct_out, labels, table, tips, a_pns)
    for side, o in ostia.items():
        lm[f'lm.frontal-ostium.{side}'] = [round(v, 2) for v in o['centre_ras']]
        meta[f'lm.frontal-ostium.{side}'] = {'method': 'centroid of the narrowest cross-section of the frontal outflow (axial '
                                                       'level) below the sinus body', 'area_mm2': o['area_mm2']}
    json.dump(dict(sorted(lm.items())), open(os.path.join(REPO, 'ssb/geometry/landmarks.json'), 'w'), indent=1)
    json.dump({'frame': 'RAS mm, origin ANS projected on the midsagittal plane, axial parallel to Frankfort '
                        '(tools/ssb-pipeline/uw/registration.json "frame")',
               'specimen': 'uw-axial-sagittal', 'landmarks': dict(sorted(meta.items()))},
              open(os.path.join(REPO, 'ssb/geometry/landmarks.meta.json'), 'w'), indent=1)
    report = {'grid': {'box_mm': BOX, 'step_mm': STEP, 'dims_xyz': [ct.shape[2], ct.shape[1], ct.shape[0]]},
              'thresholds_display': {'bone': BONE, 'air': AIR},
              'seeds_used': {k: len(v) for k, v in seeds_used.items()}, 'seeds_dropped': seeds_dropped,
              'pns_a_mm': a_pns, 'choanal_arch_s_mm': s_arch, 'sphenoid_split': sph_method,
              'frontal_ostia': ostia, 'ethmoid_split_proxy': split,
              'basal_lamella_tips_a_mm': [round(p[1], 1) for p in bl],
              'volumes_cm3': volumes, 'ethmoid_complex_total_cm3': eth_tot, 'volume_refs': VOLUME_REFS,
              'sanity': sanity, 'tip_hits': hits,
              'unassigned_air_cm3': round(float(((labels == 0) & air).sum()) * vox_ml, 2),
              'landmarks': meta}
    write_results('specimen', report)
    overlays(ct_out, labels, table, args.png_dir)
    print(json.dumps({k: report[k] for k in ('seeds_used', 'seeds_dropped', 'pns_a_mm', 'choanal_arch_s_mm', 'sphenoid_split',
                                             'frontal_ostia', 'ethmoid_split_proxy', 'volumes_cm3',
                                             'ethmoid_complex_total_cm3', 'tip_hits', 'unassigned_air_cm3')}, indent=1))


# ---------------------------------------------------------------- writers
def write_outputs(ct, labels, table, A):
    os.makedirs(os.path.join(REPO, 'ssb/ct'), exist_ok=True)
    os.makedirs(os.path.join(REPO, 'ssb/geometry'), exist_ok=True)
    nz, ny, nx = ct.shape
    with gzip.GzipFile(os.path.join(REPO, 'ssb/ct/ct.u8.gz'), 'wb', compresslevel=9, mtime=0) as f:
        f.write(np.ascontiguousarray(ct).tobytes())
    with gzip.GzipFile(os.path.join(REPO, 'ssb/ct/labels.u16.gz'), 'wb', compresslevel=9, mtime=0) as f:
        f.write(np.ascontiguousarray(labels).astype('<u2').tobytes())
    aff = [[STEP, 0, 0, BOX['r'][0]], [0, STEP, 0, BOX['a'][0]], [0, 0, STEP, BOX['s'][0]], [0, 0, 0, 1]]
    # display -> HU: air (display 45) = -1000 and soft tissue (111) = +35 HU fix a linear window
    # (~15.7 HU per level; W ~4000, L ~300); 0 is the source's no-data value (outside the
    # reconstruction circle, and the masked face), so it reads as air too
    slope = (35 + 1000) / (111 - 45)

    def hu(d):
        return int(round(-1000 + (d - 45) * slope))
    header = {
        'version': 1,
        'dims': [nx, ny, nz],
        'spacing': [STEP, STEP, STEP],
        'affine': aff,
        'affineNote': 'voxel (i,j,k,1) -> RAS mm (docs/ssb.md §4); row-major',
        'dtype': 'uint8',
        'values': {
            'kind': 'display',
            'note': 'bone-window display level from the source images, not HU. toHU assumes a linear window through '
                    'air = 45 -> -1000 HU and brain = 111 -> +35 HU (about 15.7 HU per level, W ~4000 / L ~300); '
                    'uncertain by roughly +/-50 HU in soft tissue and more near saturation. 0 = no data '
                    '(outside the reconstruction circle, and the masked face).',
            'toHU': [[0, -1000], [45, -1000], [226, hu(226)], [255, hu(255)]],
        },
        'windows': {
            'bone': {'center': 128, 'width': 255},
            'sinus': {'center': 96, 'width': 128},
            'soft': {'center': 111, 'width': 26},
        },
        'labels': {'file': 'labels.u16.gz', 'dtype': 'uint16', 'table': '../geometry/labels.json'},
        'specimen': 'uw-axial-sagittal',
        'license': 'ssb/LICENSE-data.md',
    }
    json.dump(header, open(os.path.join(REPO, 'ssb/ct/ct.json'), 'w'), indent=2, ensure_ascii=False)
    json.dump({'version': 1, 'labels': table}, open(os.path.join(REPO, 'ssb/geometry/labels.json'), 'w'), indent=2)


def native_copy(V, A, dz):
    """Offline, gitignored: the axial display volume at native resolution with the axial-px ->
    RAS affine, for re-segmentation at full resolution later."""
    np.savez_compressed(os.path.join(CACHE, 'specimen-native.npz'), axial=V, axial_px_to_ras=A, dz=dz,
                        note='axial[n, y, x]; RAS = A @ [x, y, n*dz, 1]')


# ---------------------------------------------------------------- landmarks
def landmarks(ct, labels, table, tips, a_pns):
    """Only ids that exist in ssb/content. Tip medians per side where UW labels a point-like
    structure; defined image points (ANS, crista galli apex, sella floor, dorsum tip, PNS-free)
    by search near the tips on the midsagittal band."""
    import glob
    ids = set()
    for f in glob.glob(os.path.join(REPO, 'ssb/content/*.json')):
        d = json.load(open(f))
        for k in ('structures', 'landmarks'):
            ids |= {e['id'] for e in d.get(k, [])}
    res = read_results()
    fr = res['frame']
    out, meta = {}, {}

    def add(key, p, method, n=None, spread=None):
        cid = key.rsplit('.', 1)[0]
        if cid not in ids:
            return
        out[key] = [round(float(v), 2) for v in p]
        meta[key] = {'method': method, **({'n_tips': n} if n is not None else {}),
                     **({'spread_mm': round(float(spread), 2)} if spread is not None else {})}

    add('lm.anterior-nasal-spine.M', fr['landmarks_ras_mm']['ans'], 'image search: anterior-most bone within 7 px of the '
        'midsagittal plane at the nasal floor (labels3d.find_ans)')
    # tip medians for point-like structures, per side
    point_terms = {'greater palatine foramen': 'lm.greater-palatine-foramen', 'foramen rotundum': 'lm.foramen-rotundum-anterior',
                   'vidian canal': 'lm.vidian-canal-anterior', 'foramen ovale': 's.foramen-ovale',
                   'sphenopalatine foramen': 'lm.sphenopalatine-foramen', 'inferior orbital foramen': 'lm.infraorbital-foramen',
                   'sphenoid sinus ostium': 'lm.sphenoid-ostium', 'foramen lacerum': 's.foramen-lacerum',
                   'anterior clinoid': 's.anterior-clinoid-process', 'superior orbital fissure': 's.superior-orbital-fissure',
                   'petrous apex': 's.petrous-apex'}
    for term, lid in point_terms.items():
        P = np.array([p for pl in ('axial', 'sagittal') for p in tips.get(term, {}).get(pl, [])
                      if not (term == 'greater palatine foramen' and p[2] > 6)])   # higher tips mark the canal
        if not len(P):
            continue
        for side, sgn in (('R', 1), ('L', -1)):
            Q = P[np.sign(P[:, 0]) == sgn]
            if len(Q) >= 2:
                med = np.median(Q, 0)
                add(f'{lid}.{side}', med, 'median of UW arrow tips (axial + sagittal)', len(Q),
                    np.median(np.linalg.norm(Q - med, axis=1)))
    # midline structures from tips
    for term, lid in {'sella': 's.sella-turcica', 'dorsum sella': 's.dorsum-sellae', 'crista galli': 's.crista-galli',
                      'clivus': 's.clivus', 'vomer': 's.vomer'}.items():
        P = np.array([p for pl in ('axial', 'sagittal') for p in tips.get(term, {}).get(pl, [])])
        if len(P) >= 2:
            med = np.median(P, 0)
            add(f'{lid}.M', med, 'median of UW arrow tips (axial + sagittal)', len(P), np.median(np.linalg.norm(P - med, axis=1)))
    # defined points by image search on the midsagittal band (|r| <= 3 mm)
    r, a, s = grid_axes()
    band = np.abs(r) <= 3.0
    B = ct[:, :, band] >= 125                                # thin midline bone (dorsum, crista) reads below BONE

    def top_bone(a_lo, a_hi, s_lo, s_hi):
        ks = np.nonzero((s >= s_lo) & (s <= s_hi))[0]; js = np.nonzero((a >= a_lo) & (a <= a_hi))[0]
        sub = B[np.ix_(ks, js, np.arange(B.shape[2]))]
        kk, jj, ii = np.nonzero(sub)
        if not len(kk):
            return None
        t = np.argmax(kk)
        return np.array([r[band][ii[t]], a[js[jj[t]]], s[ks[kk[t]]]])
    cg = out.get('s.crista-galli.M')
    if cg:
        p = top_bone(cg[1] - 6, cg[1] + 6, cg[2] - 5, cg[2] + 20)
        if p is not None:
            add('lm.crista-galli-apex.M', p, 'highest bone (display >= 125) within 3 mm of the MSP and 6 mm (AP) of the '
                'crista galli tips')
    ds = out.get('s.dorsum-sellae.M')
    if ds:
        p = top_bone(ds[1] - 5, ds[1] + 5, ds[2] - 10, ds[2] + 20)
        if p is not None:
            add('lm.dorsum-sellae-tip.M', p, 'highest bone (display >= 125) within 3 mm of the MSP and 5 mm (AP) of the '
                'dorsum tips')
    se = out.get('s.sella-turcica.M')
    if se:
        # floor: brightest (bone) level between the fossa and the sphenoid air below it, on the
        # midline column through the tips' AP position (the floor is too thin for a fixed threshold)
        j = int(np.argmin(np.abs(a - se[1])))
        prof = ct[:, max(0, j - 1):j + 2, band].mean(axis=(1, 2))
        k0 = int(np.argmin(np.abs(s - se[2])))
        ks = list(range(k0, max(0, k0 - 40), -1))
        k_air = next((k for k in ks if prof[k] < AIR), None)
        if k_air is not None:
            # the floor is thinner than the voxel: take the half-level crossing between the fossa
            # contents (above) and the sphenoid air (below)
            half = (np.median(prof[k0 - 4:k0 + 1]) + prof[k_air]) / 2
            kf = next(k for k in ks if prof[k] < half)
            sf = s[kf] + STEP * (half - prof[kf]) / max(1e-6, prof[kf + 1] - prof[kf])
            add('lm.sella-floor-center.M', [0.0, se[1], sf], 'half-level crossing between the fossa contents and the '
                'sphenoid air below the sella tips, on the midline at the tips\' AP position')
    return out, meta


# ---------------------------------------------------------------- overlays
def overlays(ct, labels, table, png_dir):
    from PIL import Image, ImageDraw
    rng = np.random.default_rng(3)
    pal = {int(k): tuple(int(c) for c in rng.integers(60, 255, 3)) for k in table}
    r, a, s = grid_axes()

    def blend(g, l):
        rgb = np.dstack([g] * 3).astype(np.float32)
        rgb[(g < AIR) & (l == 0) & (g > 0)] = rgb[(g < AIR) & (l == 0) & (g > 0)] * 0.3 + np.array([90, 0, 0])   # unassigned air
        for v, c in pal.items():
            m = l == v
            if m.any():
                rgb[m] = 0.45 * rgb[m] + 0.55 * np.array(c)
                edge = m & ~ndi.binary_erosion(m)
                rgb[edge] = c
        return rgb.clip(0, 255).astype(np.uint8)
    views = []
    for sv in (8, 25, 40, 55):                               # axial (flip so anterior is up, patient right on image left)
        k = int(np.argmin(np.abs(s - sv)))
        views.append(('axial s=%g' % sv, blend(ct[k][::-1, ::-1], labels[k][::-1, ::-1])))
    for av in (-10, -25, -40, -60):                          # coronal (superior up, radiological)
        j = int(np.argmin(np.abs(a - av)))
        views.append(('coronal a=%g' % av, blend(ct[::-1, j, ::-1], labels[::-1, j, ::-1])))
    for rv in (-20, -8, 0.5, 8, 20):                         # sagittal (anterior left)
        i = int(np.argmin(np.abs(r - rv)))
        views.append(('sagittal r=%g' % rv, blend(ct[::-1, ::-1, i], labels[::-1, ::-1, i])))
    for name, group in (('axial', views[:4]), ('coronal', views[4:8]), ('sagittal', views[8:])):
        ims = [Image.fromarray(v).resize((v.shape[1] * 2, v.shape[0] * 2), Image.NEAREST) for _, v in group]
        W = sum(im.width for im in ims) + 6 * (len(ims) - 1); H = max(im.height for im in ims)
        canvas = Image.new('RGB', (W, H + 16), (20, 20, 20)); x = 0
        for (title, _), im in zip(group, ims):
            canvas.paste(im, (x, 16)); ImageDraw.Draw(canvas).text((x + 3, 2), title, fill=(255, 255, 0)); x += im.width + 6
        canvas.save(os.path.join(png_dir, f'reconB-labels-{name}.png'))
    # legend
    leg = Image.new('RGB', (360, 16 * len(pal) + 8), (20, 20, 20)); d = ImageDraw.Draw(leg)
    for n, (v, c) in enumerate(sorted(pal.items())):
        d.rectangle([6, 6 + 16 * n, 18, 18 + 16 * n], fill=c); d.text((24, 6 + 16 * n), f'{v}: {table[str(v)]}', fill=(230, 230, 230))
    leg.save(os.path.join(png_dir, 'reconB-labels-legend.png'))


if __name__ == '__main__':
    main()
