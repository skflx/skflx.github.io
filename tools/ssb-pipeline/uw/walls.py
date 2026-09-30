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
    P = tips(res, 'orbit')
    used = {'R': 0, 'L': 0}
    for p in P:
        q = snap_soft(g, p, soft, dist)
        if q is None or dist[tuple(q)] < 2.0:
            continue
        side = 'R' if p[0] > 0 else 'L'
        k, j, i = q
        markers[k - 1:k + 2, j - 1:j + 2, i - 1:i + 2] = np.where(soft[k - 1:k + 2, j - 1:j + 2, i - 1:i + 2], cid('orbit.' + side),
                                                                 markers[k - 1:k + 2, j - 1:j + 2, i - 1:i + 2])
        used[side] += 1
    report['orbit_tips_used'] = used
    # retromaxillary soft tissue (pterygopalatine fossa + pterygomaxillary fissure + retroantral fat)
    used = {'R': 0, 'L': 0}
    for p in tips(res, 'pterygopalatine fossa', 'pterygomaxillary fissure', 'retroantral fat pad'):
        q = snap_soft(g, p, soft, dist, 3.0)
        if q is None:
            continue
        side = 'R' if p[0] > 0 else 'L'
        if markers[tuple(q)] == 0:
            markers[tuple(q)] = cid('retromaxillary.' + side)
            used[side] += 1
    report['retromaxillary_tips_used'] = used
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
    phar = soft & (dist >= 3.0) & (np.abs(g.R) < 12) & (g.A < -80) & (g.S < 2)
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


def direction(dA, dB, mask):
    """Unit vector field (r, a, s components) pointing from A towards B, evaluated where mask."""
    f = ndi.gaussian_filter((dA - dB).astype(np.float32), 1.0)
    gk, gj, gi = np.gradient(f)
    n = np.sqrt(gk ** 2 + gj ** 2 + gi ** 2) + 1e-6
    return gi[mask] / n[mask], gj[mask] / n[mask], gk[mask] / n[mask]


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
    inv = {v: n for n, v in comp.items()}
    lm = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
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
        nr, na, ns = direction(dA, dB, m)
        kk, jj, ii = np.nonzero(m)
        rr = g.r[ii]
        parts = {}
        if name.startswith('ethmoid-roof'):
            sd = name[-1]
            lat = np.abs(nr) > np.abs(ns)          # A->B horizontal: the vertical lateral lamella
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
            a_tub = tuberculum_a(g, lm)
            lateral = np.abs(nr) > np.maximum(np.abs(ns), np.abs(na))
            up = ~lateral & (ns > 0)
            parts['s.planum-sphenoidale.M'] = up & (g.a[jj] > a_tub)
            parts['s.sella-turcica.M'] = ~lateral & (g.a[jj] <= a_tub) & (np.abs(rr) < 12)
            for sd, sg in (('R', 1), ('L', -1)):
                parts['s.sphenoid-lateral-wall.' + sd] = lateral & (np.sign(rr) == sg)
            report['tuberculum_a_mm'] = a_tub
        else:
            parts[name] = np.ones(len(kk), bool)
        for pn, sel in parts.items():
            key = pn.split('#')[0]
            if key not in names:
                names[key] = len(names) + 1
            out[kk[sel], jj[sel], ii[sel]] = np.where(out[kk[sel], jj[sel], ii[sel]] == 0, names[key],
                                                      out[kk[sel], jj[sel], ii[sel]])
        report[name] = {'voxels': int(m.sum()), 'T_mm': T, 'bone_fraction': round(float(bone[m].mean()), 2)}
    return out, names, report


def tuberculum_a(g, lm):
    """Tuberculum sellae (a, mm): on the midsagittal band, the anterior edge of the pituitary fossa -
    the most anterior point, above the sella floor, where the intracranial floor drops below the planum."""
    se = lm.get('lm.sella-floor-center.M') or lm.get('s.sella-turcica.M')
    return float(se[1]) + 6.0 if se else -62.0


# ---------------------------------------------------------------- nasal septum and turbinates
def septum_turbinates(g, ct, lab, table, res, ws, comp):
    byname = {v: int(k) for k, v in table.items()}
    nR = lab == byname['s.nasal-cavity.R']; nL = lab == byname['s.nasal-cavity.L']
    tissue = (lab == 0) & (ct >= AIR)
    dR = ndi.distance_transform_edt(~nR, sampling=g.step); dL = ndi.distance_transform_edt(~nL, sampling=g.step)
    other = (lab > 0) & ~nR & ~nL
    dO = ndi.distance_transform_edt(~other, sampling=g.step)
    sept = tissue & (dR + dL <= 12.0) & (dO > np.maximum(dR, dL)) & (np.abs(g.R) < 8)
    # keep the largest connected piece (the septum is one plate)
    cl, n = ndi.label(sept)
    if n:
        sizes = np.bincount(cl.ravel()); sizes[0] = 0
        sept = cl == np.argmax(sizes)
    out = {'s.nasal-septum.M': sept}
    rep = {'septum_voxels': int(sept.sum())}
    # turbinates: tissue enclosed by one side's airway in each coronal slice
    disk = np.zeros((17, 17), bool)
    yy, xx = np.mgrid[-8:9, -8:9]; disk[(yy ** 2 + xx ** 2) <= 64] = True       # 4 mm radius
    for sd, air in (('R', nR), ('L', nL)):
        enc = np.zeros(g.shape, bool)
        for j in range(g.shape[1]):
            sl = air[:, j, :]
            if sl.sum() < 20:
                continue
            enc[:, j, :] = ndi.binary_closing(sl, disk, iterations=1, border_value=0)
        cand = enc & tissue & ~sept
        # markers from UW tips inside the candidate tissue (snap to the thickest tissue within 3 mm)
        thick = ndi.distance_transform_edt(cand, sampling=g.step)
        mk = np.zeros(g.shape, np.int32)
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
        if not mk.any():
            continue
        tw = watershed(-thick, mk, mask=cand, connectivity=1)
        for code, nm in ((1, 's.inferior-turbinate.' + sd), (2, 's.middle-turbinate.' + sd)):
            m = tw == code
            cl, n = ndi.label(m)
            if n:
                sizes = np.bincount(cl.ravel()); sizes[0] = 0
                m = cl == np.argmax(sizes)
            out[nm] = m
        rep['turbinate_tips_used.' + sd] = used
    return out, rep


# ---------------------------------------------------------------- main
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
    st, rep_t = septum_turbinates(g, ct, lab, base, res, ws, comp)
    np.savez_compressed(os.path.join(CACHE, 'walls-grid.npz'), ws=ws, comp=json.dumps(comp), walls=wl,
                        wall_names=json.dumps(wnames), **{'st_' + k: v for k, v in st.items()})
    print(json.dumps(rep_c, indent=1)); print(json.dumps(rep_w, indent=1)); print(json.dumps(rep_t, indent=1))


AIR_IDS = ('s.agger-nasi-cell', 's.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess', 's.frontal-sinus',
           's.maxillary-sinus', 's.nasal-cavity', 's.nasopharynx', 's.posterior-ethmoid-cells', 's.sphenoid-sinus')

if __name__ == '__main__':
    main()
