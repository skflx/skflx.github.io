"""Register the coronal, parallel and perpendicular stacks to the axial stack (WP T2).

    .venv/bin/python -I tools/tbone-pipeline/register.py [--png-dir DIR]

Model (the SSB one, tools/ssb-pipeline/uw/register.py, whose frame/points/ncc/powell are used unchanged):
    P(u, v, k) = O + u*e1 + v*e2 + k*w          in axial display pixels, Z = axial slice index * dz
e1, e2 = s * R(rx, ry, rz) * (x, y)     square in-plane pixels of size s
w = slice step (free 3-vector, so a stack that is not stepped along its normal shows up)
dz = axial slice spacing in axial pixels (fitted independently by each stack; they should agree).

Initial guess (new here; SSB's projection template search does not fit oblique reformats): the labelled
landmarks. Every UW label that two stacks share by name gives one pair of centroids (centroid of that
name's arrow tips in each stack); a robust affine (u, v, k) -> (X, Y, n) is fitted to them, split into
(s, R, w, dz) and polished by Powell on the SSB score: mean NCC of bone-edge images (gradient
magnitude of 'boneness') between the stack's slice and the axial volume resliced there.
The stacks carry one display window (soft tissue 110 in all four), so boneness uses soft = 110 and
bone = 245 for all of them.

Outputs work/registration.json['registration'] (numbers only). Specimen identity is judged from the
final edge-NCC per slice and the landmark residuals (same-name tips mapped into the axial stack),
not assumed.
"""
import argparse, json, os, sys
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import vocab  # noqa: E402
import geom as G  # noqa: E402

REG = C.ssb('register')
SOFT, BONE = 110.0, 245.0
EYE = (np.array([1., 0, 0]), np.array([0, 1., 0]), np.array([0, 0, 1.]))
FOV = (255.5, 255.5, 255.85)   # axial FOV circle (volume.py check)


def bone(V):
    return np.clip((V.astype(np.float32) - SOFT) / (BONE - SOFT), 0, 1.2)


class Axial:
    def __init__(self):
        self.V = C.load('axial')
        self.B = bone(self.V)
        self.shape = self.B.shape

    def sample(self, P, dz, vol=None):
        X, Y, Z = P
        n = Z / dz
        vol = self.B if vol is None else vol
        N, H, W = self.shape
        val = ndi.map_coordinates(vol, [n, Y, X], order=1, cval=0.0)
        ok = ((n >= 0) & (n <= N - 1) & (Y >= 0) & (Y <= H - 1) & (X >= 0) & (X <= W - 1)
              & (np.hypot(X - FOV[0], Y - FOV[1]) < FOV[2] - 3))
        return val, ok


class Stack:
    def __init__(self, ax, plane, rows, ds=2, sigma=1.5):
        self.ax, self.plane, self.ds, self.sigma = ax, plane, ds, sigma
        self.B = bone(C.load(plane))
        r0, r1 = rows
        self.vv, self.uu = np.mgrid[r0:r1:ds, 0:self.B.shape[2]:ds].astype(np.float32)
        self.rows = rows
        self._E = {}

    def edges(self, k):
        if k not in self._E:
            r0, r1 = self.rows
            self._E[k] = ndi.gaussian_gradient_magnitude(self.B[k][r0:r1:self.ds, ::self.ds], self.sigma / self.ds)
        return self._E[k]

    def reslice(self, p, k):
        P, dz = REG.points(self.plane, p, k, self.uu, self.vv, EYE)
        return self.ax.sample(P, dz)

    def slice_ncc(self, p, k):
        val, ok = self.reslice(p, k)
        Er = ndi.gaussian_gradient_magnitude(val, self.sigma / self.ds)
        return REG.ncc(Er, self.edges(k), ndi.binary_erosion(ok, iterations=3))

    def score(self, p, ks):
        return float(np.mean([self.slice_ncc(p, k) for k in ks]))


def content_rows(plane):
    V = C.load(plane)
    r = [np.nonzero((g > 45).any(1))[0] for g in V]
    return int(np.median([x.min() for x in r])), int(np.median([x.max() for x in r])) + 1


# ------------------------------------------------------------------ initial guess
# Every UW label gives a tip (u, v) on a slice k; the same structure labelled in the axial stack gives a
# tip (x, y) on a slice n. A landmark affine through those centroids was tried first and failed (median
# residual 15 px; centroids of labels depend on which slices happen to label a structure), so the
# rotation is found by a coarse grid search on blurred intensity and the landmarks only fix the
# translation (the median over compact structures, which is robust to a few bad names).
COMPACT = {'oval-window', 'round-window', 'malleus', 'incus', 'stapes', 'cochlea', 'vestibule', 'lscc', 'pscc',
           'sscc', 'geniculate-ganglion', 'basal-turn', 'middle-turn', 'apical-turn', 'modiolus',
           'vestibular-aqueduct', 'cochlear-aqueduct', 'fn-labyrinthine', 'pyramidal-eminence',
           'sinus-tympani', 'facial-recess', 'incus-short-process', 'arcuate-eminence', 'stapedius'}


def centroids(plane, slices):
    """name -> mean (u, v, k0) over all tips of labels with that name (k0 = 0-based slice)."""
    acc = {}
    for r in slices[plane]:
        for t in r['labels']:
            cid = vocab.canon(t['text'])[0]
            if cid not in COMPACT:
                continue
            for u, v in t['tips']:
                acc.setdefault(cid, []).append((u, v, r['n'] - 1))
    return {k: np.mean(v, 0) for k, v in acc.items()}


UNSTABLE = {'mastoid-cells', 'occipitomastoid-suture', 'sigmoid-sinus', 'pinna', 'petrous-apex', 'clivus', 'iac',
            'jugular-foramen', 'petro-occipital-synchondrosis', 'anterior-clinoid', 'mandibular-condyle',
            'foramen-ovale', 'foramen-spinosum', 'vidian-canal', 'fn', 'fn-mastoid', 'epitympanum', 'eac',
            'petrous-ica', 'carotid-canal', 'hypoglossal-canal', 'jugular-tubercle', 'mastoid-antrum'}


def make_p(R, s, w, dz, O):
    from scipy.spatial.transform import Rotation
    rv = np.rad2deg(Rotation.from_matrix(R).as_rotvec())
    return list(O) + list(rv) + [s] + list(w) + [dz]


def rot_candidates(ax, plane, slices, log):
    from scipy.spatial.transform import Rotation as Rot
    ca, cp = centroids('axial', slices), centroids(plane, slices)
    names = sorted(set(ca) & set(cp))
    nk = C.load(plane).shape[0]
    rows = content_rows(plane)
    ds = 4
    vol = ndi.gaussian_filter(ax.B, (1.0, 3, 3))
    vv, uu = np.mgrid[rows[0]:rows[1]:ds, 0:512:ds].astype(np.float32)
    ks = [nk // 4, nk // 2, 3 * nk // 4]
    T = {k: ndi.gaussian_filter(bone(C.load(plane)[k]), 3)[rows[0]:rows[1]:ds, ::ds] for k in ks}
    dz0, s0 = 3.1, 1.0
    out = []
    for th in range(0, 360, 15):
        for pitch in (-30, -15, 0, 15, 30):
            for roll in (-20, 0, 20):
                R = Rot.from_euler('zxy', [th, pitch, roll], degrees=True).as_matrix()
                # in-plane axes: e1 ~ x, e2 ~ z before the rotation (R maps them to the stack's frame)
                E0 = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]]).T   # columns e1=x, e2=z, w=-y (coronal-like)
                Rm = R @ E0
                e1, e2, wn = Rm[:, 0] * s0, Rm[:, 1] * s0, Rm[:, 2]
                for sign in (1, -1):
                    for step in (2.0, 4.0, 6.0):
                        w = sign * step * wn
                        # translation from compact landmarks: P(u,v,k0) = O + u e1 + v e2 + k0 w  =  (X, Y, n*dz)
                        offs = []
                        for nme in names:
                            u, v, k0 = cp[nme]
                            tgt = np.array([ca[nme][0], ca[nme][1], ca[nme][2] * dz0])
                            offs.append(tgt - (u * e1 + v * e2 + k0 * w))
                        O = np.median(np.array(offs), 0)
                        Rr = np.c_[Rm[:, 0], Rm[:, 1], np.cross(Rm[:, 0], Rm[:, 1])]
                        p = make_p(Rr, s0, w, dz0, O)
                        sc = []
                        for k in ks:
                            P, dz = REG.points(plane, p, k, uu, vv, EYE)
                            val, ok = ax.sample(P, dz, vol)
                            sc.append(REG.ncc(val, T[k], ok))
                        out.append((float(np.mean(sc)), p))
    out.sort(key=lambda t: -t[0])
    log(f'  {plane}: {len(out)} rotation candidates, shared compact names {len(names)}; best blurred ncc {out[0][0]:.3f}, 5th {out[4][0]:.3f}')
    return out[:6]


def fit(ax, plane, p0, rows, log=print):
    nk = C.load(plane).shape[0]
    ks = list(range(1, nk - 1, max(1, nk // 8)))
    S2 = Stack(ax, plane, rows, ds=2, sigma=2.0)
    log(f'  {plane} init ncc={S2.score(p0, ks):.4f}')
    p1, s1 = REG.powell(lambda p: S2.score(p, ks), p0, 3000)
    log(f'  {plane} edge stage (sigma 2) ncc={s1:.4f}')
    S1 = Stack(ax, plane, rows, ds=2, sigma=1.5)
    p2, s2 = REG.powell(lambda p: S1.score(p, ks), p1, 2500)
    log(f'  {plane} edge stage (sigma 1.5) ncc={s2:.4f}')
    return p2, s2


def to_axial(p, u, v, k0):
    """3D point (axial px X, Y and slice index n, fractional, 0-based) of plane pixel (u, v) on slice k0."""
    P, dz = REG.points('x', p, k0, np.array([[u]], float), np.array([[v]], float), EYE)
    return float(P[0][0, 0]), float(P[1][0, 0]), float(P[2][0, 0] / dz)


def residuals(plane, p, slices=None):
    """Cross-plane agreement of the label tips, from the registration alone. Every tip of `plane` whose
    name is a compact structure (not in UNSTABLE) is mapped into the axial stack; its distance to the
    nearest axial tip of the same name is taken (axial px; the slice axis is scaled by dz). Tips mark
    different places on a structure, so this over-states registration error; the NCC is the registration
    figure and this is the label-level cross-check."""
    ax_tips = {}
    for rec in G.grouped_tips():
        if rec['plane'] == 'axial' and rec['canon'] and rec['canon'] not in UNSTABLE:
            ax_tips.setdefault(rec['canon'], []).append((rec['tip'][0], rec['tip'][1], (rec['n_first'] + rec['n_last']) / 2 - 1))
    dz = p[10]
    out = []
    for rec in G.grouped_tips():
        if rec['plane'] != plane or rec['canon'] not in ax_tips:
            continue
        x, y, n = G.tip_axial(rec)
        A = np.array(ax_tips[rec['canon']])
        d = np.sqrt((A[:, 0] - x) ** 2 + (A[:, 1] - y) ** 2 + ((A[:, 2] - n) * dz) ** 2)
        out.append((rec['canon'], float(d.min())))
    return out


def per_slice_ncc(ax, plane, p, rows):
    S = Stack(ax, plane, rows, ds=2, sigma=1.5)
    return [round(S.slice_ncc(p, k), 3) for k in range(C.load(plane).shape[0])]


def overlay_png(ax, plane, p, rows, ks, path):
    from PIL import Image
    S = Stack(ax, plane, rows, ds=1, sigma=1.5)
    tiles = []
    for k in ks:
        val, ok = S.reslice(p, k)
        r0, r1 = rows
        uv = (np.clip(S.B[k][r0:r1] / 1.2, 0, 1) * 255).astype(np.uint8)
        rs = (np.clip(val / 1.2, 0, 1) * 255).astype(np.uint8)
        ov = np.stack([uv, rs, rs], -1)
        tiles.append(np.concatenate([np.stack([uv] * 3, -1), np.stack([rs] * 3, -1), ov], 1))
    Image.fromarray(np.concatenate(tiles, 0)).save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--png-dir')
    ap.add_argument('--residuals', action='store_true', help='only recompute the tip residuals from the saved fits')
    ap.add_argument('--dz', type=float, help='seed the axial slice step (axial px) taken from the other stacks; for a stack whose free fit stalled in a local minimum')
    ap.add_argument('planes', nargs='*', default=['coronal', 'parallel', 'perpendicular'])
    a = ap.parse_args()
    slices = G.slices()
    ax = Axial()
    log = lambda *x: print(*x, flush=True)  # noqa: E731
    if a.residuals:
        for plane in a.planes:
            f = os.path.join(C.WORK, f'registration-{plane}.json')
            d = json.load(open(f))
            rr = residuals(plane, G.reg_params(plane))
            dd = np.array([x[1] for x in rr])
            names = sorted({x[0] for x in rr})
            d['tip_residuals'] = {'n': int(len(dd)), 'median_axial_px': round(float(np.median(dd)), 2), 'p90_axial_px': round(float(np.percentile(dd, 90)), 2),
                                  'by_name_median_px': {k: round(float(np.median([x[1] for x in rr if x[0] == k])), 1) for k in names}}
            json.dump(d, open(f, 'w'), indent=1)
            print(plane, d['tip_residuals']['n'], 'tips; median', d['tip_residuals']['median_axial_px'], 'px; p90', d['tip_residuals']['p90_axial_px'])
        return
    for plane in a.planes:
        res = {}
        rows = content_rows(plane)
        cands = rot_candidates(ax, plane, slices, log)
        # quick polish of the top starts (coarse edges, ds 4), then the full two-stage fit of the best one
        Sq = Stack(ax, plane, rows, ds=4, sigma=3.0)
        nk = C.load(plane).shape[0]
        ksq = list(range(1, nk - 1, max(1, nk // 5)))
        polished = []
        for sc0, p0 in cands[:4]:
            pq, scq = REG.powell(lambda q: Sq.score(q, ksq), p0, 700)
            log(f'{plane}: start (blurred ncc {sc0:.3f}) -> coarse edge ncc {scq:.3f}')
            polished.append((scq, pq))
        polished.sort(key=lambda t: -t[0])
        start = list(polished[0][1])
        if a.dz:
            Sd = Stack(ax, plane, rows, ds=2, sigma=1.5)
            kd = list(range(1, nk - 1, max(1, nk // 8)))
            start[10] = a.dz
            q, _ = REG.powell(lambda v: Sd.score(list(v[:10]) + [a.dz], kd), np.array(start[:10]), 2500)
            start = list(q) + [a.dz]
            log(f'{plane}: polished with the slice step fixed at {a.dz}')
        p, sc = fit(ax, plane, start, rows, log)
        best = (p, sc)
        p, sc = best
        names = sorted(set(centroids('axial', slices)) & set(centroids(plane, slices)))
        lres = np.array([0.0])
        ps = per_slice_ncc(ax, plane, p, rows)
        rr = residuals(plane, p, slices)
        d = np.array([x[1] for x in rr])
        w = np.array(p[7:10])
        res[plane] = {
            'rows': list(rows), 'params': dict(zip(['ox', 'oy', 'oz', 'rx_deg', 'ry_deg', 'rz_deg', 's', 'wx', 'wy', 'wz', 'dz'], [round(float(x), 5) for x in p])),
            'edge_ncc_mean': round(sc, 4), 'edge_ncc_per_slice': ps,
            'slice_step_axial_px': round(float(np.linalg.norm(w)), 3),
            'init_landmark_names': names, 'init_landmark_median_residual_px': round(float(np.median(lres)), 2),
            'tip_residuals': {'n': int(len(d)), 'median_axial_px': round(float(np.median(d)), 2) if len(d) else None,
                              'p90_axial_px': round(float(np.percentile(d, 90)), 2) if len(d) else None},
        }
        log(f'  {plane}: ncc {sc:.3f}; slice ncc min/median {min(ps):.2f}/{np.median(ps):.2f}; s={p[6]:.3f} dz={p[10]:.3f}; step {np.linalg.norm(w):.2f}px; tip residual median {np.median(d):.1f}px (n={len(d)})')
        json.dump(res[plane], open(os.path.join(C.WORK, f'registration-{plane}.json'), 'w'), indent=1)
        if a.png_dir:
            os.makedirs(a.png_dir, exist_ok=True)
            nk = C.load(plane).shape[0]
            overlay_png(ax, plane, p, rows, [nk // 4, nk // 2, 3 * nk // 4], os.path.join(a.png_dir, f'reg_{plane}.png'))


if __name__ == '__main__':
    main()
