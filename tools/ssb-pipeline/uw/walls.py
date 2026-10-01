"""Reference specimen, stage C1: tissue compartments and named walls (bone resection units).

    .venv/bin/python tools/ssb-pipeline/uw/walls.py [--png-dir DIR]     # after specimen.py

Reads the committed volume (ssb/ct/ct.u8.gz, labels.u16.gz, ssb/geometry/labels.json) and writes:
  ssb/ct/labels.u16.gz, ssb/geometry/labels.json   walls and turbinates added on voxels that were 0
                                                   (never over an air label; the table stays append-only)
  incoming/uw-sinusanatomy2/_recon/walls-grid.npz  compartments + wall labels, for sweeps.py / relate3d.py
and the "walls" section of registration.json (method, voxel counts, what is a proxy). meshes.py then
turns the new labels into ssb/models/walls.glb.gz.

Method.
1. Compartments. Every voxel that is not bone (display < BT) is assigned to one compartment by marker
   watershed on the negated distance to bone (6-connected), so compartments meet where bone is, or at the
   narrowest neck where the bone is too thin to see (lamina papyracea, cribriform plate, fissures).
   Markers: every named air space of stage B (its air floods its own mucosa); orbit (UW "orbit" tips);
   intracranial (soft tissue >= 6 mm from bone above the orbital roofs, and the middle cranial fossae
   behind the greater wings); exterior (the masked face, display 0, and soft tissue lateral to the skull);
   retromaxillary (UW "pterygopalatine fossa", "pterygomaxillary fissure", "retroantral fat pad" tips);
   pharynx/prevertebral and oral (soft tissue far from bone behind the nasopharynx / below the palate).
2. Walls. A wall is the bone shared by two compartments: bone (display >= BT) or, where the bone is too
   thin to show, the interface voxels between the two compartments. Each candidate voxel takes its two
   nearest distinct compartments; it belongs to wall (A, B) when those are A and B and d_A + d_B <= T
   (T per wall: thin plates ~4 mm, tables and floors more). Walls that split one interface by orientation
   (fovea vs lateral lamella, sphenoid face vs floor vs lateral wall vs planum) use the direction from A to
   B (gradient of d_A - d_B).
3. Septum and turbinates from the nasal airway itself (air-label distances, not compartments):
   septum = tissue whose two nearest air spaces are the right and left nasal cavity, within 12 mm total;
   turbinates = tissue enclosed by one side's nasal airway (inside the 2D closing of that airway in each
   coronal slice), split by marker watershed on tissue thickness from UW's inferior / middle turbinate tips.
"""
import argparse, gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi
from skimage.segmentation import watershed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import CACHE, read_results, write_results  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
BT = 120            # display level above soft tissue (~111) where thin bone starts to read
AIR = 78
ETH = ('s.anterior-ethmoid-cells', 's.posterior-ethmoid-cells', 's.ethmoid-bulla', 's.agger-nasi-cell',
       's.frontal-recess')
ANT_ETH = ('s.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess')


def read_volume():
    hdr = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    nx, ny, nz = hdr['dims']
    ct = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct/ct.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
    lab = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct/labels.u16.gz')).read(), '<u2').reshape(nz, ny, nx).copy()
    table = json.load(open(os.path.join(REPO, 'ssb/geometry/labels.json')))['labels']
    return hdr, ct, lab, table


class Grid:
    def __init__(self, hdr):
        self.aff = np.array(hdr['affine'], float)
        self.step = hdr['spacing'][0]
        nx, ny, nz = hdr['dims']
        self.shape = (nz, ny, nx)
        self.r = self.aff[0, 3] + np.arange(nx) * self.step
        self.a = self.aff[1, 3] + np.arange(ny) * self.step
        self.s = self.aff[2, 3] + np.arange(nz) * self.step
        self.R = self.r[None, None, :]; self.A = self.a[None, :, None]; self.S = self.s[:, None, None]

    def idx(self, p):
        return np.array([(p[2] - self.s[0]) / self.step, (p[1] - self.a[0]) / self.step, (p[0] - self.r[0]) / self.step])

    def ras(self, kji):
        kji = np.asarray(kji, float)
        return np.stack([self.r[0] + kji[..., 2] * self.step, self.a[0] + kji[..., 1] * self.step,
                         self.s[0] + kji[..., 0] * self.step], -1)

    def inside(self, q):
        return np.all(q >= 0) and np.all(q < np.array(self.shape))


def tips(res, *terms):
    P = res['labels']['points_ras_mm']
    return [p for t in terms for pl in ('axial', 'sagittal') for p in P.get(t, {}).get(pl, [])]


def snap_soft(g, p, soft, dist, radius=4.0):
    """Tip -> the soft-tissue voxel farthest from bone within `radius` mm (tips are drawn on edges)."""
    c = np.round(g.idx(p)).astype(int)
    rv = int(radius / g.step)
    lo = np.maximum(c - rv, 0); hi = np.minimum(c + rv + 1, g.shape)
    if np.any(lo >= hi):
        return None
    sub = np.where(soft[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], dist[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], -1)
    if sub.max() <= 0:
        return None
    return np.array(np.unravel_index(np.argmax(sub), sub.shape)) + lo


# ---------------------------------------------------------------- compartments
def compartments(g, ct, lab, table, res):
    names = {int(k): v for k, v in table.items()}
    air_lab = lab > 0
    bone = (ct >= BT) & ~air_lab
    nonbone = ~bone
    soft = nonbone & ~air_lab & (ct > 0)
    dist = ndi.distance_transform_edt(nonbone, sampling=g.step)      # mm to the nearest bone voxel
    comp_names = {}
    markers = np.zeros(g.shape, np.int32)

    def cid(name):
        if name not in comp_names:
            comp_names[name] = len(comp_names) + 1
        return comp_names[name]
    # stage B air spaces: their air is the marker (they flood their own mucosa)
    for v, n in names.items():
        if n.rsplit('.', 1)[0].startswith('s.'):
            markers[lab == v] = cid(n)
    report = {}
    # orbits from UW tips (side from the tip's r)
    # UW labels one orbit only; its tips mirrored through the midsagittal plane (x = 0 by
    # construction of the frame) seed the other side - a seed only, the watershed finds the walls
    P = tips(res, 'orbit')
    used = {'R': 0, 'L': 0}
    for p in P + [[-p[0], p[1], p[2]] for p in P]:
        q = snap_soft(g, p, soft, dist)
        if q is None or dist[tuple(q)] < 2.0:
            continue
        side = 'R' if p[0] > 0 else 'L'
        k, j, i = q
        markers[k - 1:k + 2, j - 1:j + 2, i - 1:i + 2] = np.where(soft[k - 1:k + 2, j - 1:j + 2, i - 1:i + 2], cid('orbit.' + side),
                                                                 markers[k - 1:k + 2, j - 1:j + 2, i - 1:i + 2])
        used[side] += 1
    report['orbit_seeds_used'] = used
    report['orbit_tips_by_side'] = {'R': sum(p[0] > 0 for p in P), 'L': sum(p[0] <= 0 for p in P)}
    # retromaxillary soft tissue (pterygopalatine fossa + pterygomaxillary fissure + retroantral fat)
    used = {'R': 0, 'L': 0}
    Q = tips(res, 'pterygopalatine fossa', 'pterygomaxillary fissure', 'retroantral fat pad')
    for p in Q + [[-p[0], p[1], p[2]] for p in Q]:
        q = snap_soft(g, p, soft, dist, 3.0)
        if q is None:
            continue
        side = 'R' if p[0] > 0 else 'L'
        if markers[tuple(q)] == 0:
            markers[tuple(q)] = cid('retromaxillary.' + side)
            used[side] += 1
    report['retromaxillary_seeds_used'] = used
    report['retromaxillary_tips_by_side'] = {'R': sum(p[0] > 0 for p in Q), 'L': sum(p[0] <= 0 for p in Q)}
    # intracranial: far from bone, above the orbital roofs (frontal lobes) or behind the greater
    # wings above the skull base (temporal lobes); exterior: masked face and lateral soft tissue
    orb_top = max(p[2] for p in P) if P else 45.0
    ic = soft & (dist >= 6.0) & (((g.S > orb_top + 12) & (g.A < -20)) |
                                 ((g.S > 12) & (g.S < 40) & (np.abs(g.R) > 22) & (np.abs(g.R) < 45) & (g.A < -72)))
    markers[ic & (markers == 0)] = cid('intracranial')
    ext = (ct == 0) & ~air_lab
    markers[ext] = cid('exterior')
    lat = soft & (dist >= 3.0) & (np.abs(g.R) > 46) & (g.A > -60) & (g.S < 40)
    markers[lat & (markers == 0)] = cid('exterior')
    # deep soft tissue of the face far from any air space: behind the maxilla laterally
    # (infratemporal / masticator space) and behind the nasopharynx (prevertebral)
    dair = ndi.distance_transform_edt(~air_lab, sampling=g.step)
    deep = soft & (dist >= 4.0) & (dair >= 6.0) & (g.S < 25)
    for sd, sg in (('R', 1), ('L', -1)):
        itf = deep & (g.A < -40) & (g.A > -75) & (sg * g.R > 12) & (sg * g.R < 48)
        markers[itf & (markers == 0)] = cid('retromaxillary.' + sd)
    phar = soft & (dist >= 3.0) & (dair >= 4.0) & (np.abs(g.R) < 12) & (g.A < -70) & (g.S < 10)
    markers[phar & (markers == 0)] = cid('pharynx')
    oral = soft & (dist >= 2.0) & (np.abs(g.R) < 20) & (g.A > -45) & (g.A < -10) & (g.S < -8)
    markers[oral & (markers == 0)] = cid('oral')
    ws = watershed(-dist, markers, mask=nonbone, connectivity=1)
    comp = {n: v for n, v in comp_names.items()}
    report['compartments_cm3'] = {n: round(float((ws == v).sum()) * g.step ** 3 / 1000, 2) for n, v in comp.items()
                                  if not n.startswith('s.')}
    return ws, comp, bone, soft, dist, report


# ---------------------------------------------------------------- walls
# name, A (compartment names or id prefixes), B, max d_A + d_B (mm), side rule
def wall_specs():
    S = []
    for sd in ('R', 'L'):
        S += [
            ('s.lamina-papyracea.' + sd, [e + '.' + sd for e in ETH], ['orbit.' + sd], 4.0),
            ('s.orbital-floor.' + sd, ['s.maxillary-sinus.' + sd], ['orbit.' + sd], 5.0),
            ('s.maxillary-medial-wall.' + sd, ['s.maxillary-sinus.' + sd], ['s.nasal-cavity.' + sd], 6.0),
            ('s.maxillary-anterior-wall.' + sd, ['s.maxillary-sinus.' + sd], ['exterior'], 8.0),
            ('s.maxillary-posterior-wall.' + sd, ['s.maxillary-sinus.' + sd], ['retromaxillary.' + sd], 6.0),
            ('s.maxillary-sinus-floor.' + sd, ['s.maxillary-sinus.' + sd], ['oral'], 16.0),
            ('s.nasal-floor.' + sd, ['s.nasal-cavity.' + sd], ['oral'], 16.0),
            ('s.basal-lamella.' + sd, [e + '.' + sd for e in ANT_ETH], ['s.posterior-ethmoid-cells.' + sd], 3.0),
            ('ethmoid-roof.' + sd, [e + '.' + sd for e in ETH], ['intracranial'], 5.0),
            ('s.cribriform-plate.' + sd, ['s.nasal-cavity.' + sd], ['intracranial'], 5.0),
            ('s.frontal-sinus-anterior-table.' + sd, ['s.frontal-sinus.' + sd], ['exterior'], 14.0),
            ('s.frontal-sinus-posterior-table.' + sd, ['s.frontal-sinus.' + sd], ['intracranial'], 10.0),
            ('s.frontal-sinus-floor.' + sd, ['s.frontal-sinus.' + sd], ['orbit.' + sd], 8.0),
        ]
    S += [
        ('s.intersinus-septum.M', ['s.sphenoid-sinus.R'], ['s.sphenoid-sinus.L'], 4.0),
        ('s.frontal-intersinus-septum.M', ['s.frontal-sinus.R'], ['s.frontal-sinus.L'], 6.0),
        ('sphenoid-front', ['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'],
         ['s.nasal-cavity.R', 's.nasal-cavity.L', 's.posterior-ethmoid-cells.R', 's.posterior-ethmoid-cells.L'], 5.0),
        ('sphenoid-below', ['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'], ['s.nasopharynx.M', 'pharynx'], 8.0),
        ('sphenoid-ic', ['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'], ['intracranial'], 5.0),
    ]
    return S


def nearest_two(g, ws, comp, cand, names_needed):
    """For every candidate voxel: nearest and second-nearest compartment (distinct) and distances."""
    d1 = np.full(g.shape, np.inf, np.float32); d2 = np.full(g.shape, np.inf, np.float32)
    c1 = np.zeros(g.shape, np.int16); c2 = np.zeros(g.shape, np.int16)
    dists = {}
    for n in names_needed:
        v = comp.get(n)
        if v is None:
            continue
        m = ws == v
        if not m.any():
            continue
        d = ndi.distance_transform_edt(~m, sampling=g.step).astype(np.float32)
        dists[n] = d
        better1 = d < d1
        better2 = ~better1 & (d < d2)
        d2 = np.where(better1, d1, np.where(better2, d, d2)); c2 = np.where(better1, c1, np.where(better2, v, c2))
        d1 = np.where(better1, d, d1); c1 = np.where(better1, v, c1)
    return d1, c1, d2, c2, dists


def local_fields(dA, dB, m, pad=4):
    """Inside the padded bounding box of m: unit direction from A towards B (gradient of d_A - d_B,
    lightly smoothed) and the cosine between grad d_A and grad d_B (-1 = A and B on opposite sides)."""
    kk, jj, ii = np.nonzero(m)
    lo = np.maximum([kk.min() - pad, jj.min() - pad, ii.min() - pad], 0)
    hi = np.minimum([kk.max() + pad + 1, jj.max() + pad + 1, ii.max() + pad + 1], m.shape)
    sl = tuple(slice(a, b) for a, b in zip(lo, hi))
    a, b = dA[sl].astype(np.float32), dB[sl].astype(np.float32)
    f = ndi.gaussian_filter(a - b, 1.0)
    gk, gj, gi = np.gradient(f)
    n = np.sqrt(gk ** 2 + gj ** 2 + gi ** 2) + 1e-6
    ak, aj, ai = np.gradient(ndi.gaussian_filter(a, 0.7)); bk, bj, bi = np.gradient(ndi.gaussian_filter(b, 0.7))
    cos = (ak * bk + aj * bj + ai * bi) / (np.sqrt(ak ** 2 + aj ** 2 + ai ** 2) * np.sqrt(bk ** 2 + bj ** 2 + bi ** 2) + 1e-6)
    q = (kk - lo[0], jj - lo[1], ii - lo[2])
    return gi[q] / n[q], gj[q] / n[q], gk[q] / n[q], cos[q]


def walls(g, ct, lab, table, ws, comp, bone, res):
    specs = wall_specs()
    needed = sorted({n for _, A, B, _ in specs for n in A + B})
    # candidates: bone that is not air, plus the interface voxels between two compartments of a wall
    # pair where no bone shows (both outside any air label)
    free = lab == 0
    edge = np.zeros(g.shape, bool)
    for ax in range(3):
        a = np.swapaxes(ws, 0, ax)
        e = np.zeros(a.shape, bool)
        e[1:] |= (a[1:] != a[:-1]) & (a[:-1] > 0) & (a[1:] > 0)
        e[:-1] |= (a[1:] != a[:-1]) & (a[:-1] > 0) & (a[1:] > 0)
        edge |= np.swapaxes(e, 0, ax)
    cand = free & (bone | edge)
    d1, c1, d2, c2, dists = nearest_two(g, ws, comp, cand, needed)
    out = np.zeros(g.shape, np.int32)
    names = {}
    report = {}
    lm = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
    se = lm.get('lm.sella-floor-center.M')
    for name, A, B, T in specs:
        av = [comp[n] for n in A if n in comp]; bv = [comp[n] for n in B if n in comp]
        if not av or not bv:
            report[name] = {'voxels': 0, 'why': 'a compartment is missing: ' + ', '.join(n for n in A + B if n not in comp)}
            continue
        m = cand & (((np.isin(c1, av) & np.isin(c2, bv)) | (np.isin(c1, bv) & np.isin(c2, av))) & (d1 + d2 <= T))
        if not m.any():
            report[name] = {'voxels': 0}
            continue
        dA = np.min([dists[n] for n in A if n in dists], axis=0)
        dB = np.min([dists[n] for n in B if n in dists], axis=0)
        nr, na, ns, cos = local_fields(dA, dB, m)
        kk, jj, ii = np.nonzero(m)
        # between: A and B lie on opposite sides of the voxel (or the voxel touches one of them)
        betw = (dA[m] <= g.step) | (dB[m] <= g.step) | (cos < -0.1)
        kk, jj, ii, nr, na, ns = kk[betw], jj[betw], ii[betw], nr[betw], na[betw], ns[betw]
        rr, aa, sv = g.r[ii], g.a[jj], g.s[kk]
        parts = {}
        if name.startswith('ethmoid-roof'):
            sd = name[-1]
            # A->B horizontal and pointing to the midline (ethmoid cells lateral, olfactory fossa medial): the
            # vertical lateral lamella; everything else on this interface is the fovea (roof)
            lat = (np.abs(nr) > np.abs(ns)) & (nr * np.sign(rr) < 0)
            parts['s.lateral-lamella.' + sd] = lat
            parts['s.fovea-ethmoidalis.' + sd] = ~lat
        elif name == 'sphenoid-front':
            front = np.abs(na) >= np.abs(ns)
            for sd, sg in (('R', 1), ('L', -1)):
                parts['s.sphenoid-face.' + sd] = front & (np.sign(rr) == sg)
                parts['s.sphenoid-floor.' + sd + '#front'] = ~front & (ns < 0) & (np.sign(rr) == sg)
        elif name == 'sphenoid-below':
            for sd, sg in (('R', 1), ('L', -1)):
                parts['s.sphenoid-floor.' + sd] = np.sign(rr) == sg
        elif name == 'sphenoid-ic':
            a_tub = tuberculum_a(g, ct, lm)
            lateral = (np.abs(nr) > np.maximum(np.abs(ns), np.abs(na))) | (np.abs(rr) >= 12)
            parts['s.planum-sphenoidale.M'] = ~lateral & (ns > 0) & (aa > a_tub)
            s_fl = se[2] if se else 30.0
            post = ~lateral & (aa <= a_tub)
            parts['s.sella-turcica.M'] = post & (sv >= s_fl - 3.0)
            parts['s.clivus.M'] = post & (sv < s_fl - 3.0)
            for sd, sg in (('R', 1), ('L', -1)):
                parts['s.sphenoid-lateral-wall.' + sd] = lateral & (np.sign(rr) == sg)
            report['tuberculum_a_mm'] = a_tub
        else:
            parts[name] = np.ones(len(kk), bool)
        for pn, sel in parts.items():
            key = pn.split('#')[0]
            if not sel.any():
                continue
            if key not in names:
                names[key] = len(names) + 1
            cur = out[kk[sel], jj[sel], ii[sel]]
            out[kk[sel], jj[sel], ii[sel]] = np.where(cur == 0, names[key], cur)
        report[name] = {'voxels': int(betw.sum()), 'dropped_not_between': int((~betw).sum()), 'T_mm': T,
                        'bone_fraction': round(float(bone[kk, jj, ii].mean()), 2)}
    return out, names, report


def tuberculum_a(g, ct, lm):
    """Tuberculum sellae, AP position (mm): on the midsagittal band (|r| <= 2 mm), scanning forward
    from the sella floor, the first level where the highest bone of the fossa's anterior wall comes
    within 2 mm of the planum height - i.e. where the sellar wall has climbed to the planum."""
    se = lm.get('lm.sella-floor-center.M')
    if not se:
        return -62.0
    band = np.abs(g.r) <= 2.0
    js = np.nonzero((g.a >= se[1]) & (g.a <= se[1] + 20))[0]
    top = []
    for j in js:
        col = (ct[:, j, band] >= BT).any(axis=1) & (g.s >= se[2] - 2) & (g.s <= se[2] + 20)
        k = np.nonzero(col)[0]
        top.append(g.s[k.max()] if len(k) else np.nan)
    top = np.array(top)
    planum = np.nanmedian(top[-8:])
    ok = np.nonzero(top >= planum - 2.0)[0]
    return float(g.a[js[ok[0]]]) if len(ok) else float(se[1]) + 6.0


# ---------------------------------------------------------------- nasal septum and turbinates
def septum_turbinates(g, ct, lab, table, res, walls_lab):
    from skimage.morphology import convex_hull_image
    byname = {v: int(k) for k, v in table.items()}
    nR = lab == byname['s.nasal-cavity.R']; nL = lab == byname['s.nasal-cavity.L']
    tissue = (lab == 0) & (ct >= AIR) & (walls_lab == 0)
    dR = ndi.distance_transform_edt(~nR, sampling=g.step); dL = ndi.distance_transform_edt(~nL, sampling=g.step)
    other = (lab > 0) & ~nR & ~nL
    dO = ndi.distance_transform_edt(~other, sampling=g.step)
    # septum: tissue between the two airways (their distance gradients point opposite ways), nearer
    # to both airways than to any sinus, within 10 mm in total (bone, cartilage and mucosa)
    zone = tissue & (dR + dL <= 10.0) & (dO > np.maximum(dR, dL)) & (np.abs(g.R) < 10)
    kk, jj, ii = np.nonzero(zone)
    gR = np.gradient(ndi.gaussian_filter(dR.astype(np.float32), 0.7)); gL = np.gradient(ndi.gaussian_filter(dL.astype(np.float32), 0.7))
    cos = sum(gR[c][kk, jj, ii] * gL[c][kk, jj, ii] for c in range(3)) / (
        np.sqrt(sum(gR[c][kk, jj, ii] ** 2 for c in range(3))) * np.sqrt(sum(gL[c][kk, jj, ii] ** 2 for c in range(3))) + 1e-6)
    del gR, gL
    sept = np.zeros(g.shape, bool)
    sept[kk[cos < -0.5], jj[cos < -0.5], ii[cos < -0.5]] = True
    cl, n = ndi.label(sept)
    if n:
        sizes = np.bincount(cl.ravel()); sizes[0] = 0
        sept = cl == np.argmax(sizes)
    out = {'s.nasal-septum.M': sept}
    rep = {'septum_voxels': int(sept.sum())}
    # turbinates: tissue inside the per-coronal-slice convex hull of one side's airway (what projects
    # into the airway), split by marker watershed on tissue thickness: UW inferior / middle turbinate
    # tips against "lateral wall" markers (tissue touching a sinus or a named wall) and the septum
    near_other = ndi.distance_transform_edt(~(other | (walls_lab > 0) | sept), sampling=g.step) <= 1.0
    for sd, air in (('R', nR), ('L', nL)):
        hull = np.zeros(g.shape, bool)
        for j in range(g.shape[1]):
            sl = air[:, j, :]
            if sl.sum() >= 20:
                hull[:, j, :] = convex_hull_image(sl)
        cand = hull & tissue & ~sept
        thick = ndi.distance_transform_edt(cand, sampling=g.step)
        mk = np.zeros(g.shape, np.int32)
        mk[cand & near_other] = 3
        used = {}
        for code, term in ((1, 'inferior turbinate'), (2, 'middle turbinate')):
            used[term] = 0
            for p in tips(res, term):
                if (p[0] > 0) != (sd == 'R'):
                    continue
                q = snap_soft(g, p, cand, thick, 3.0)
                if q is None:
                    continue
                mk[tuple(q)] = code; used[term] += 1
        tw = watershed(-thick, mk, mask=cand, connectivity=1)
        for code, nm in ((1, 's.inferior-turbinate.' + sd), (2, 's.middle-turbinate.' + sd)):
            m = tw == code
            cl, n = ndi.label(m)
            if n:
                sizes = np.bincount(cl.ravel()); sizes[0] = 0
                m = cl == np.argmax(sizes)
            out[nm] = m
            rep[nm] = {'voxels': int(m.sum()), 'cm3': round(float(m.sum()) * g.step ** 3 / 1000, 2),
                       'a_range_mm': [float(g.a[np.nonzero(m.any(axis=(0, 2)))[0]].min()),
                                      float(g.a[np.nonzero(m.any(axis=(0, 2)))[0]].max())] if m.any() else None}
        rep['tips_used.' + sd] = used
    return out, rep


# ---------------------------------------------------------------- main
PROXY = {
    's.basal-lamella': 'PROXY: bone within 3 mm of both the anterior and the posterior ethmoid labels, whose '
                       'boundary is stage B\'s coronal proxy plane (specimen.py), not the traced lamella; the '
                       'real basal lamella is not continuous at this resolution and UW\'s 8 tips sit at the roof',
    's.lateral-lamella': 'ethmoid-cells | intracranial bone split from the fovea by orientation (A->B mostly '
                         'horizontal and towards the midline); the junction is a threshold, not a suture',
    's.fovea-ethmoidalis': 'ethmoid-cells | intracranial bone whose A->B direction is mostly vertical',
    's.planum-sphenoidale': 'sphenoid | intracranial, upward-facing, |r| < 12 mm, anterior to the tuberculum '
                            '(found on the midsagittal bone profile)',
    's.sella-turcica': 'sphenoid | intracranial behind the tuberculum, from 3 mm below the sella floor up: the '
                       'sellar floor and anterior wall as seen from the sinus, not the whole saddle',
    's.clivus': 'sphenoid | intracranial behind the tuberculum more than 3 mm below the sella floor: the clival '
                'recess wall only, not the clivus',
    's.sphenoid-lateral-wall': 'sphenoid | intracranial facing sideways, plus the roof of a lateral recess '
                               '(|r| >= 12 mm) under the middle cranial fossa',
    's.sphenoid-face': 'sphenoid | nasal cavity or posterior ethmoid, A->B mostly anteroposterior; side = r sign',
    's.sphenoid-floor': 'sphenoid | nasopharynx or prevertebral soft tissue, and downward-facing sphenoid | nasal; '
                        'side = r sign',
    's.maxillary-anterior-wall': 'maxillary | exterior (the face): the facial and anterolateral wall',
    's.maxillary-posterior-wall': 'maxillary | retromaxillary soft tissue (PPF, retroantral fat, infratemporal fossa)',
    's.maxillary-sinus-floor': 'maxillary | oral soft tissue, up to 16 mm of alveolar bone',
    's.nasal-floor': 'nasal cavity | oral soft tissue (hard palate), up to 16 mm',
    's.nasal-septum': 'bone, cartilage and mucosa between the right and left airways (not split into '
                      'perpendicular plate / vomer / cartilage: their junctions are not visible)',
    's.inferior-turbinate': 'tissue (bone + mucosa) inside the coronal convex hull of the airway, grown from UW '
                            'tips against lateral-wall and septum markers',
    's.middle-turbinate': 'as the inferior turbinate; its vertical attachment to the skull base is too thin to '
                          'follow and is not included',
    's.orbit': 'orbital soft tissue (globe, fat, muscles, nerve) by watershed from UW orbit tips (one side\'s tips, '
               'mirrored for the other); the anterior limit is where it meets the masked face, so the lids are in',
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--png-dir', default=CACHE)
    args = ap.parse_args()
    res = read_results()
    hdr, ct, lab0, table = read_volume()
    g = Grid(hdr)
    # restart from the stage B air labels (a rerun must not see its own walls as compartments)
    base = {k: v for k, v in table.items() if v.rsplit('.', 1)[0] in AIR_IDS}
    lab = np.where(np.isin(lab0, [int(k) for k in base]), lab0, 0).astype(np.uint16)
    ws, comp, bone, soft, dist, rep_c = compartments(g, ct, lab, base, res)
    wl, wnames, rep_w = walls(g, ct, lab, base, ws, comp, bone, res)
    st, rep_t = septum_turbinates(g, ct, lab, base, res, wl)
    # compose: walls first, then septum and turbinates, then the orbits; only on voxels no air label holds
    new = {}
    for n, v in wnames.items():
        new[n] = wl == v
    for n, m in st.items():
        new[n] = m
    for sd in ('R', 'L'):
        if 'orbit.' + sd in comp:
            new['s.orbit.' + sd] = ws == comp['orbit.' + sd]
    by_name = {v: int(k) for k, v in table.items()}
    out = lab.copy()
    counts = {}
    for n in [n for n in new if not n.startswith('s.orbit.')] + [n for n in new if n.startswith('s.orbit.')]:
        m = new[n] & (out == 0)
        if m.sum() < 30:
            continue
        if n not in by_name:
            by_name[n] = max(by_name.values()) + 1
        out[m] = by_name[n]
        counts[n] = int(m.sum())
    assert np.array_equal(out[lab > 0], lab[lab > 0]), 'an air label was overwritten'
    table = {str(i): k for k, i in sorted(by_name.items(), key=lambda kv: kv[1])}
    with gzip.GzipFile(os.path.join(REPO, 'ssb/ct/labels.u16.gz'), 'wb', compresslevel=9, mtime=0) as f:
        f.write(np.ascontiguousarray(out).astype('<u2').tobytes())
    json.dump({'version': 1, 'labels': table}, open(os.path.join(REPO, 'ssb/geometry/labels.json'), 'w'), indent=2)
    np.savez_compressed(os.path.join(CACHE, 'walls-grid.npz'), ws=ws, comp=json.dumps(comp), labels=out,
                        table=json.dumps(table))
    report = {
        'method': __doc__.split('Method.')[1].strip(),
        'thresholds_display': {'bone_thin': BT, 'air': AIR},
        'compartments': rep_c, 'walls': rep_w, 'septum_turbinates': rep_t,
        'voxels_written': counts,
        'cm3': {n: round(c * g.step ** 3 / 1000, 2) for n, c in counts.items()},
        'notes': PROXY,
        'not_derived': {
            's.superior-turbinate': 'no UW tips; not separable from the middle turbinate here',
            's.uncinate-process': 'UW has 6 sagittal tips but the process is a sub-millimetre hook fused to the '
                                  'lateral wall at this resolution; left in the lateral wall',
            's.bullar-lamella': 'no tips; bulla seeded on the right only (stage B)',
            's.perpendicular-plate / s.vomer': 'inside s.nasal-septum.M, junctions not visible',
        },
    }
    write_results('walls', report)
    overlays(g, ct, out, table, args.png_dir)
    print(json.dumps({'compartments': rep_c['compartments_cm3'], 'cm3': report['cm3']}, indent=1))


def overlays(g, ct, labels, table, png_dir):
    from PIL import Image, ImageDraw
    import colorsys
    names = sorted(v for v in table.values() if v.rsplit('.', 1)[0] not in AIR_IDS)
    col = {}
    for i, n in enumerate(names):
        col[n] = np.array(colorsys.hsv_to_rgb((i * 0.618) % 1, 0.85, 1.0)) * 255
    idx_col = {int(k): col[v] for k, v in table.items() if v in col}

    def blend(gray, lab):
        rgb = np.dstack([gray] * 3).astype(np.float32)
        for v, c in idx_col.items():
            m = lab == v
            if m.any():
                a = 0.25 if table[str(v)].startswith('s.orbit.') else 0.65
                rgb[m] = (1 - a) * rgb[m] + a * c
        return rgb.clip(0, 255).astype(np.uint8)
    rows = []
    for av in (-15, -25, -35, -45, -55, -65):
        j = int(np.argmin(np.abs(g.a - av)))
        rows.append(('coronal a=%g (R on image left)' % av, blend(ct[::-1, j, ::-1], labels[::-1, j, ::-1])))
    for sv in (10, 25, 38, 55):
        k = int(np.argmin(np.abs(g.s - sv)))
        rows.append(('axial s=%g (R on image left)' % sv, blend(ct[k][::-1, ::-1], labels[k][::-1, ::-1])))
    for rv in (8, -8, 20, -20):
        i = int(np.argmin(np.abs(g.r - rv)))
        rows.append(('sagittal r=%g (anterior left)' % rv, blend(ct[::-1, ::-1, i], labels[::-1, ::-1, i])))
    for name, group in (('coronal', rows[:6]), ('axial', rows[6:10]), ('sagittal', rows[10:])):
        ims = [Image.fromarray(v).resize((v.shape[1] * 2, v.shape[0] * 2), Image.NEAREST) for _, v in group]
        per = 3 if len(ims) > 4 else len(ims)
        W = max(sum(im.width for im in ims[r:r + per]) + 6 * (per - 1) for r in range(0, len(ims), per))
        H = sum(max(im.height for im in ims[r:r + per]) + 16 for r in range(0, len(ims), per))
        canvas = Image.new('RGB', (W, H), (20, 20, 20)); y = 0
        for r0 in range(0, len(ims), per):
            x = 0
            for (title, _), im in zip(group[r0:r0 + per], ims[r0:r0 + per]):
                canvas.paste(im, (x, y + 16)); ImageDraw.Draw(canvas).text((x + 3, y + 2), title, fill=(255, 255, 0))
                x += im.width + 6
            y += max(im.height for im in ims[r0:r0 + per]) + 16
        canvas.save(os.path.join(png_dir, f'reconC-walls-{name}.png'))
    leg = Image.new('RGB', (330, 14 * len(names) + 8), (20, 20, 20)); d = ImageDraw.Draw(leg)
    for i, n in enumerate(names):
        d.rectangle([6, 5 + 14 * i, 16, 15 + 14 * i], fill=tuple(int(c) for c in col[n])); d.text((22, 5 + 14 * i), n, fill=(230, 230, 230))
    leg.save(os.path.join(png_dir, 'reconC-walls-legend.png'))


AIR_IDS = ('s.agger-nasi-cell', 's.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess', 's.frontal-sinus',
           's.maxillary-sinus', 's.nasal-cavity', 's.nasopharynx', 's.posterior-ethmoid-cells', 's.sphenoid-sinus')

if __name__ == '__main__':
    main()
