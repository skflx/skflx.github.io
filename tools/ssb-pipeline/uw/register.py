"""Register UW's sagittal and coronal stacks to the axial volume (reconstruction stage A).

    .venv/bin/python tools/ssb-pipeline/uw/register.py [--refit] [--png-dir DIR]

Model, per reformat stack (units: axial display pixels; Z = axial slice index * dz):
    P(u, v, k) = O + u*e1 + v*e2 + k*w
e1, e2 = s * R(rx, ry, rz) * (base axes); square in-plane pixels of size s; w = slice step
(free 3-vector, so a stack that is not stepped along its normal shows up); dz = axial slice
spacing, fitted independently by each stack. The axial volume is sampled at
(n = Z/dz, y = Y, x = X). Similarity = mean NCC of bone-edge images (gradient magnitude
of per-stack "boneness", volume.boneness) over a subset of slices.

Writes the "registration" section of registration.json and, with --png-dir, the
reslice | UW | overlay figures. Fitted parameters are reused unless --refit.
"""
import argparse, os, sys, time
import numpy as np
from scipy import ndimage as ndi, optimize
from scipy.spatial.transform import Rotation

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from volume import load, boneness, read_results, write_results, axial_fov, CACHE  # noqa: E402

NAMES = ['ox', 'oy', 'oz', 'rx_deg', 'ry_deg', 'rz_deg', 's', 'wx', 'wy', 'wz', 'dz']
# base axes (image u, image v, slice k) in axial (x, y, Z); coronal u runs toward axial -x
# (the stacks are mirrored relative to each other; the fit decides, see coronal_candidates)
BASE = {'coronal': (np.array([-1., 0, 0]), np.array([0, 0, 1.]), np.array([0, 1., 0])),
        'sagittal': (np.array([0, 1., 0]), np.array([0, 0, 1.]), np.array([1., 0, 0]))}
ROWS = {'coronal': (10, 428), 'sagittal': (4, 398)}   # non-black rows (volume.py "content_rows")


class Axial:
    def __init__(self):
        V = load('axial')
        self.B = boneness(V)
        C = axial_fov(V[:3])
        self.fov = (float(C[:, 0].mean()), float(C[:, 1].mean()), float(C[:, 2].mean()))
        self.shape = self.B.shape

    def sample(self, P, dz, vol=None):
        X, Y, Z = P
        n = Z / dz
        vol = self.B if vol is None else vol
        N, H, W = self.shape
        val = ndi.map_coordinates(vol, [n, Y, X], order=1, cval=0.0)
        ok = ((n >= 0) & (n <= N - 1) & (Y >= 0) & (Y <= H - 1) & (X >= 0) & (X <= W - 1)
              & (np.hypot(X - self.fov[0], Y - self.fov[1]) < self.fov[2] - 3))
        return val, ok


def frame(plane, p, base=None):
    R = Rotation.from_rotvec(np.deg2rad(p[3:6])).as_matrix()
    b1, b2, _ = base or BASE[plane]
    return np.asarray(p[0:3], float), p[6] * (R @ b1), p[6] * (R @ b2), np.asarray(p[7:10], float), p[10]


def points(plane, p, k, uu, vv, base=None):
    O, e1, e2, w, dz = frame(plane, p, base)
    return O[:, None, None] + e1[:, None, None] * uu + e2[:, None, None] * vv + w[:, None, None] * k, dz


def ncc(a, b, m):
    a = a[m]; b = b[m]
    if a.size < 500:
        return 0.0
    a = a - a.mean(); b = b - b.mean()
    return float((a * b).sum() / np.sqrt((a * a).sum() * (b * b).sum() + 1e-12))


class Stack:
    def __init__(self, ax, plane, ds=2, sigma=1.5, base=None):
        self.ax, self.plane, self.ds, self.sigma, self.base = ax, plane, ds, sigma, base
        self.B = boneness(load(plane))
        r0, r1 = ROWS[plane]
        self.vv, self.uu = np.mgrid[r0:r1:ds, 0:self.B.shape[2]:ds].astype(np.float32)
        self._E = {}

    def edges(self, k):
        if k not in self._E:
            r0, r1 = ROWS[self.plane]
            self._E[k] = ndi.gaussian_gradient_magnitude(self.B[k][r0:r1:self.ds, ::self.ds], self.sigma / self.ds)
        return self._E[k]

    def reslice(self, p, k):
        P, dz = points(self.plane, p, k, self.uu, self.vv, self.base)
        return self.ax.sample(P, dz)

    def slice_ncc(self, p, k):
        val, ok = self.reslice(p, k)
        Er = ndi.gaussian_gradient_magnitude(val, self.sigma / self.ds)
        return ncc(Er, self.edges(k), ndi.binary_erosion(ok, iterations=3))

    def score(self, p, ks):
        return float(np.mean([self.slice_ncc(p, k) for k in ks]))


def powell(f, p0, maxfev=3000):
    r = optimize.minimize(lambda p: -f(p), p0, method='Powell', options={'maxfev': maxfev, 'xtol': 1e-3, 'ftol': 1e-5})
    return r.x, -r.fun


# ---------------------------------------------------------------- initial guesses
def projection_init(ax, plane):
    """Axial-view projections (mean boneness over the vertical axis of each stack) matched by
    template search over scale -> in-plane scale, slice step, offsets. Vertical mapping: the
    reformat's non-black rows span the axial slab (checked by the fit, not assumed after)."""
    from skimage.feature import match_template
    Pax = ax.B.mean(0)
    B = boneness(load(plane))
    r0, r1 = ROWS[plane]
    P = B[:, r0:r1, :].mean(1)            # (slice, u)
    best = []
    if plane == 'sagittal':
        Q0 = P.T                          # rows = u (-> axial y), cols = slice (-> axial x)
        grid_r, grid_c = np.arange(0.66, 0.95, 0.02), np.arange(2.4, 4.2, 0.05)
    else:
        Q0 = P                            # rows = slice (-> axial y), cols = u (-> axial x)
        grid_r, grid_c = np.arange(2.2, 3.4, 0.05), np.arange(0.58, 0.95, 0.02)
    for flip in (1, -1):
        Q = Q0[:, ::flip] if plane == 'sagittal' else Q0[:, ::flip]
        for sr in grid_r:
            for sc in grid_c:
                Z = ndi.zoom(Q, (sr, sc), order=1)
                dr = max(0, Z.shape[0] - Pax.shape[0]); dc = max(0, Z.shape[1] - Pax.shape[1])
                Z = Z[dr // 2:Z.shape[0] - (dr - dr // 2), dc // 2:Z.shape[1] - (dc - dc // 2)]
                r = match_template(Pax, Z)
                i = np.unravel_index(np.argmax(r), r.shape)
                best.append((float(r[i]), flip, sr, sc, i, (dr // 2, dc // 2)))
    best.sort(key=lambda t: -t[0])
    return best


def sagittal_p0(ax):
    b = projection_init(ax, 'sagittal')[0]
    ncc0, flip, s, step, (i0, j0), (cr, cc) = b
    r0, r1 = ROWS['sagittal']
    dz = (r1 - 1 - r0) * s / (ax.shape[0] - 1)            # non-black rows span the slab
    nj = load('sagittal').shape[0]
    ox = j0 - cc + (0 if flip == 1 else (nj - 1) * step)  # x of slice 0
    oy = i0 - cr                                          # y of u = 0
    oz = -r0 * s
    return [ox, oy, oz, 0, 0, 0, s, flip * step, 0, 0, dz], b


def coronal_candidates(ax):
    """Starting points for the coronal fit: both mirror conventions x a range of tilts about
    the left-right axis (coronal reformats are often angled to the hard palate)."""
    b = projection_init(ax, 'coronal')
    out = []
    for flip in (-1, 1):
        cand = [t for t in b if t[1] == flip][0]
        ncc0, _, step, s, (i0, j0), (cr, cc) = cand
        base = (np.array([-1., 0, 0]) if flip == -1 else np.array([1., 0, 0]), np.array([0, 0, 1.]), np.array([0, 1., 0]))
        W = load('coronal').shape[2]
        ox = j0 - cc + ((W - 1) * s if flip == -1 else 0)
        oy = i0 - cr
        r0, r1 = ROWS['coronal']
        dz = 1.8                                           # refined by the fit
        for tilt in (16.0,):   # tilt 0 starts converged to the same basin in development
            out.append(dict(flip=flip, base=base, proj_ncc=ncc0,
                            p0=[ox, oy, -r0 * s, tilt, 0, 0, s, 0, step, 0, dz]))
    return out


# ---------------------------------------------------------------- fitting
def fit_stack(ax, plane, p0, base=None, blur_first=False, log=print):
    ks = list(range(5, load(plane).shape[0] - 3, 7))
    if blur_first:
        # wide capture range: NCC of heavily blurred boneness (intensity, not edges)
        vol = ndi.gaussian_filter(ax.B, (1.5, 4, 4))
        B = boneness(load(plane))
        r0, r1 = ROWS[plane]; ds = 4
        vv, uu = np.mgrid[r0:r1:ds, 0:B.shape[2]:ds].astype(np.float32)
        T = {k: ndi.gaussian_filter(B[k], 4)[r0:r1:ds, ::ds] for k in ks}

        def fb(p):
            s = []
            for k in ks:
                P, dz = points(plane, p, k, uu, vv, base)
                v, ok = ax.sample(P, dz, vol)
                s.append(ncc(v, T[k], ok))
            return float(np.mean(s))
        p0, sc = powell(fb, p0, 2500)
        log(f'  {plane} blurred-intensity stage ncc={sc:.4f}')
    S2 = Stack(ax, plane, ds=2, sigma=2.0, base=base)
    p1, sc1 = powell(lambda p: S2.score(p, ks), p0)
    log(f'  {plane} edge stage (sigma 2) ncc={sc1:.4f}')
    S1 = Stack(ax, plane, ds=2, sigma=1.5, base=base)
    p2, sc2 = powell(lambda p: S1.score(p, ks), p1, 2000)
    log(f'  {plane} edge stage (sigma 1.5) ncc={sc2:.4f}')
    return p2, sc2


# ---------------------------------------------------------------- diagnostics
def per_slice(ax, plane, p, base=None, every=3):
    """Full-resolution NCC of every slice at the global solution, plus a free per-slice
    offset (along w, and in-plane du, dv) on every `every`-th slice to expose uneven
    spacing or framing drift."""
    S = Stack(ax, plane, ds=1, sigma=1.5, base=base)
    S2 = Stack(ax, plane, ds=2, sigma=1.5, base=base)
    O, e1, e2, w, dz = frame(plane, p, base)
    nccs, offs = [], []
    for k in range(load(plane).shape[0]):
        c0 = S.slice_ncc(p, k)
        nccs.append(round(c0, 4))
        if k % every or c0 < 0.2:
            continue

        def f(q):
            pq = np.array(p, float).copy()
            pq[0:3] = O + q[0] * w + q[1] * e1 + q[2] * e2
            return S2.slice_ncc(pq, k)
        c00 = f([0.0, 0.0, 0.0])
        q, c1 = powell(f, [0.0, 0.0, 0.0], 250)
        offs.append([k, round(float(q[0]), 3), round(float(q[1]), 2), round(float(q[2]), 2), round(c1 - c00, 4)])
    return nccs, offs


def air_projection_identity(ax):
    """Specimen-identity test independent of any registration: a coronal-view projection
    of intracranial/sinus air (frontal sinus outline is individual, as in forensic ID).
    Axial-derived vs sagittal-derived (same scan: control) and vs the coronal stack.
    Scale and offset are searched; mirror both ways for the coronal."""
    from skimage.feature import match_template

    def air(V, air_thr, soft_thr):
        out = np.zeros(V.shape, bool)
        for i, g in enumerate(V):
            body = ndi.binary_fill_holes(ndi.binary_closing(g > soft_thr, iterations=3))
            out[i] = ndi.binary_erosion(body, iterations=4) & (g < air_thr)
        return out
    A = air(load('axial'), 75, 95)                 # (n, y, x)
    Pa = A[:, 30:230, :].sum(1).astype(float)      # (n, x): anterior 200 rows = frontal..sphenoid face
    sag = read_results().get('registration', {}).get('sagittal')
    S = air(load('sagittal'), 30, 60)              # sagittal air ~4, soft ~80
    Cc = air(load('coronal'), 15, 30)              # coronal air ~0, soft ~41
    p = [sag['params'][n] for n in NAMES]
    dz = p[10]
    # sagittal: project over u where axial y in [30, 230]: y = oy + s*u (rotation ~1 deg ignored)
    u0 = int(round((30 - p[1]) / p[6])); u1 = int(round((230 - p[1]) / p[6]))
    Ps = S[:, 4:398, max(0, u0):u1].sum(2).T.astype(float) * p[6]   # (v, j), air thickness in axial px
    Ps = ndi.zoom(Ps, (p[6] / dz, p[7]), order=1)                  # -> (axial slice, axial x)
    x0 = int(round(p[0]))
    H = min(Pa.shape[0], Ps.shape[0]); W = min(Pa.shape[1] - x0, Ps.shape[1])
    ctrl = ncc(Pa[:H, x0:x0 + W], Ps[:H, :W], np.ones((H, W), bool))
    Pc = Cc[:60, 10:428].sum(0).astype(float)                       # (v, u) over the anterior 60 coronal slices
    best = (-1, None)
    for mirror in (False, True):
        Q = Pc[:, ::-1] if mirror else Pc
        for sv in np.arange(0.30, 0.46, 0.01):                      # coronal rows -> axial slices
            for su in np.arange(0.55, 0.80, 0.01):                  # coronal cols -> axial x
                Z = ndi.zoom(Q, (sv, su), order=1)
                if Z.shape[0] > Pa.shape[0] or Z.shape[1] > Pa.shape[1]:
                    continue
                r = match_template(Pa, Z)
                c = float(r.max())
                if c > best[0]:
                    best = (c, dict(mirror=mirror, rows_per_slice=round(1 / sv, 3), col_scale=round(su, 3)))
    return {'control_axial_vs_sagittal_ncc': round(ctrl, 4), 'axial_vs_coronal_best_ncc': round(best[0], 4),
            'coronal_best_fit': best[1],
            'note': 'coronal-view projection of air inside the head; the sagittal control uses the fitted '
                    'registration, the coronal gets a free scale/offset/mirror search'}


def landmark_residuals(ax, plane, p, base=None, ks=None, patch=15, search=6):
    """Residual misalignment at bony landmarks: strongest, well-separated bone-edge points
    of each UW slice; local shift maximising patch NCC between reslice and UW image."""
    S = Stack(ax, plane, ds=1, sigma=1.2, base=base)
    r0, r1 = ROWS[plane]
    out = []
    ks = ks or list(range(8, load(plane).shape[0] - 8, 8))
    for k in ks:
        val, ok = S.reslice(p, k)
        Er = ndi.gaussian_gradient_magnitude(val, 1.2)
        E = S.edges(k)
        okm = ndi.binary_erosion(ok, iterations=patch + search + 2)
        cand = np.where(okm, E, 0)
        pts = []
        for _ in range(30):
            i = np.unravel_index(np.argmax(cand), cand.shape)
            if cand[i] <= 0.05:
                break
            pts.append(i)
            cand[max(0, i[0] - 25):i[0] + 26, max(0, i[1] - 25):i[1] + 26] = 0
        for (y, x) in pts:
            A = E[y - patch:y + patch + 1, x - patch:x + patch + 1]
            best = (-2, 0, 0)
            grid = {}
            for dy in range(-search, search + 1):
                for dx in range(-search, search + 1):
                    Bp = Er[y + dy - patch:y + dy + patch + 1, x + dx - patch:x + dx + patch + 1]
                    c = ncc(A, Bp, np.ones_like(A, bool))
                    grid[(dy, dx)] = c
                    if c > best[0]:
                        best = (c, dy, dx)
            c, dy, dx = best
            if c < 0.6 or abs(dy) == search or abs(dx) == search:
                continue
            # parabolic sub-pixel refinement
            def sub(a, b0, cc):
                den = a - 2 * b0 + cc
                return 0.0 if den >= 0 else 0.5 * (a - cc) / den
            sy = sub(grid[(dy - 1, dx)], c, grid[(dy + 1, dx)])
            sx = sub(grid[(dy, dx - 1)], c, grid[(dy, dx + 1)])
            out.append((k, x, y + r0, dx + sx, dy + sy, c))
    d = np.array([np.hypot(o[3], o[4]) for o in out]) if out else np.array([np.nan])
    return {'n_points': len(out), 'n_slices': len(ks), 'median_px': round(float(np.median(d)), 3),
            'p90_px': round(float(np.percentile(d, 90)), 3), 'max_px': round(float(d.max()), 3),
            'frac_within_2px': round(float((d <= 2).mean()), 3),
            'mean_shift_uv_px': [round(float(np.mean([o[3] for o in out])), 3), round(float(np.mean([o[4] for o in out])), 3)],
            'note': 'UW image pixels; bone-edge points with patch NCC >= 0.6 (a point that finds no match is dropped, so read n_points too)'}


def overlay_png(ax, plane, p, ks, path, base=None):
    from PIL import Image, ImageDraw
    B = boneness(load(plane))
    H, W = B.shape[1:]
    vv, uu = np.mgrid[0:H, 0:W].astype(np.float32)
    rows = []
    for k in ks:
        P, dz = points(plane, p, k, uu, vv, base)
        val, ok = ax.sample(P, dz)
        a = (np.clip(val, 0, 1) * 255).astype(np.uint8)
        b = (np.clip(B[k], 0, 1) * 255).astype(np.uint8)
        sep = np.full((H, 4, 3), 90, np.uint8)
        over = np.dstack([b, a, b])        # green = reslice only, magenta = UW only, white = both
        row = np.hstack([np.dstack([a] * 3), sep, np.dstack([b] * 3), sep, over])
        im = Image.fromarray(row); d = ImageDraw.Draw(im)
        d.text((6, 6), f'{plane} img{k + 1:03d}: reslice of axial | UW | overlay (green=reslice, magenta=UW)', fill=(255, 255, 0))
        rows.append(np.asarray(im))
    img = np.vstack(rows)
    Image.fromarray(img).resize((img.shape[1] // 2, img.shape[0] // 2), Image.LANCZOS).save(path)


def summarize(plane, p, base, sc, ax, log):
    O, e1, e2, w, dz = frame(plane, p, base)
    nrm = np.cross(e1, e2); nrm /= np.linalg.norm(nrm)
    wn = float(w @ nrm)
    info = {'params': dict(zip(NAMES, [round(float(v), 5) for v in p])),
            'mirror': bool(base is not None and base[0][0] > 0) if plane == 'coronal' else False,
            'fit_ncc_sigma1.5': round(sc, 4),
            'pixel_axial_px': round(float(p[6]), 5),
            'slice_step_axial_px': round(float(np.linalg.norm(w)), 4),
            'slice_step_along_normal_axial_px': round(abs(wn), 4),
            'step_off_normal_deg': round(float(np.degrees(np.arccos(min(1.0, abs(wn) / np.linalg.norm(w))))), 3),
            'plane_tilt_deg': [round(float(v), 3) for v in p[3:6]],
            'axial_dz_axial_px': round(float(dz), 5)}
    log(f'{plane}: {info}')
    return info


def axial_from_sagittal(ax, p, ns, png=None):
    """Reverse check: rebuild UW axial slices from the sagittal stack alone (inverting the fitted
    sagittal model) and compare with the UW axial images. x resolution is one sagittal step."""
    from PIL import Image, ImageDraw
    Bs = boneness(load('sagittal'))
    O, e1, e2, w, dz = frame('sagittal', p)
    Minv = np.linalg.inv(np.c_[e1, e2, w])
    N, H, W = ax.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    out, rows = [], []
    for n in ns:
        P = np.stack([xx, yy, np.full_like(xx, n * dz)]) - O[:, None, None]
        u, v, j = np.tensordot(Minv, P, axes=1)
        val = ndi.map_coordinates(Bs, [j, v, u], order=1, cval=0.0)
        ok = (j >= 0) & (j <= Bs.shape[0] - 1) & (v >= 4) & (v <= 397) & (u >= 0) & (u <= Bs.shape[2] - 1)
        ok &= np.hypot(xx - ax.fov[0], yy - ax.fov[1]) < ax.fov[2] - 3
        E1 = ndi.gaussian_gradient_magnitude(val, 1.5); E2 = ndi.gaussian_gradient_magnitude(ax.B[n], 1.5)
        out.append(round(ncc(E1, E2, ndi.binary_erosion(ok, iterations=3)), 4))
        if png:
            a = (np.clip(val, 0, 1) * 255).astype(np.uint8); b = (np.clip(ax.B[n], 0, 1) * 255).astype(np.uint8)
            sep = np.full((H, 4, 3), 90, np.uint8)
            row = np.hstack([np.dstack([a] * 3), sep, np.dstack([b] * 3), sep, np.dstack([b, a, b])])
            im = Image.fromarray(row); ImageDraw.Draw(im).text((6, 6), f'axial img{n + 1:03d}: rebuilt from UW sagittal stack | UW | overlay', fill=(255, 255, 0))
            rows.append(np.asarray(im))
    if png:
        img = np.vstack(rows)
        Image.fromarray(img).resize((img.shape[1] // 2, img.shape[0] // 2), Image.LANCZOS).save(png)
    return out


def free_offset_summary(offs):
    o = np.array(offs)
    return {'n_slices': len(offs),
            'along_step_median_abs_steps': round(float(np.median(np.abs(o[:, 1]))), 4),
            'along_step_max_abs_steps': round(float(np.abs(o[:, 1]).max()), 4),
            'du_dv_median_abs_px': [round(float(np.median(np.abs(o[:, 2]))), 3), round(float(np.median(np.abs(o[:, 3]))), 3)],
            'du_dv_max_abs_px': [round(float(np.abs(o[:, 2]).max()), 3), round(float(np.abs(o[:, 3]).max()), 3)],
            'ncc_gain_median': round(float(np.median(o[:, 4])), 4), 'ncc_gain_max': round(float(o[:, 4].max()), 4),
            'note': 'each tested slice gets its own extra shift (slice steps along w; UW pixels du, dv) with '
                    'the global model fixed; near-zero shifts and gains = even spacing and no framing drift'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--refit', action='store_true')
    ap.add_argument('--png-dir', default=CACHE)
    a = ap.parse_args()
    log = lambda *m: print(*m, flush=True)
    ax = Axial()
    prev = read_results().get('registration', {})
    reg = {'model': __doc__.split('\n\n')[1].strip(), 'units': 'axial display pixels (see scale.py for mm)'}

    # ---- sagittal
    if not a.refit and 'sagittal' in prev:
        p = [prev['sagittal']['params'][n] for n in NAMES]; sc = prev['sagittal']['fit_ncc_sigma1.5']
    else:
        p0, b = sagittal_p0(ax)
        log('sagittal projection init', b[:4], np.round(p0, 3).tolist())
        p, sc = fit_stack(ax, 'sagittal', p0, log=log)
    info = summarize('sagittal', p, None, sc, ax, log)
    nccs, offs = per_slice(ax, 'sagittal', p)
    info['ncc_per_slice'] = nccs
    info['ncc_summary'] = {'median': round(float(np.median(nccs)), 4), 'min': round(float(np.min(nccs)), 4),
                           'p10': round(float(np.percentile(nccs, 10)), 4),
                           'slices_below_0.95': [i + 1 for i, c in enumerate(nccs) if c < 0.95]}
    info['per_slice_free_offset'] = free_offset_summary(offs)
    info['landmarks'] = landmark_residuals(ax, 'sagittal', p)
    log('sagittal', info['ncc_summary'], info['per_slice_free_offset'], info['landmarks'])
    ns = [60, 85, 105, 125, 150]
    info['axial_rebuilt_from_sagittal_ncc'] = dict(zip([n + 1 for n in ns], axial_from_sagittal(
        ax, p, ns, os.path.join(a.png_dir, 'recon-axial.png'))))
    overlay_png(ax, 'sagittal', p, [20, 50, 68, 90, 118], os.path.join(a.png_dir, 'recon-sagittal.png'))
    reg['sagittal'] = info
    write_results('registration', {**prev, **reg})

    # ---- coronal
    if not a.refit and 'coronal' in prev and 'params' in prev['coronal']:
        c = prev['coronal']
        base = (np.array([1., 0, 0]) if c['mirror'] else np.array([-1., 0, 0]), np.array([0, 0, 1.]), np.array([0, 1., 0]))
        best = ([c['params'][n] for n in NAMES], c['fit_ncc_sigma1.5'], base)
        tried = c.get('starts', [])
    else:
        tried, best = [], None
        for cnd in coronal_candidates(ax):
            log('coronal start', cnd['flip'], np.round(cnd['p0'], 3).tolist())
            p, sc = fit_stack(ax, 'coronal', cnd['p0'], base=cnd['base'], blur_first=True, log=log)
            tried.append({'mirror': cnd['flip'] == 1, 'tilt0_deg': cnd['p0'][3], 'ncc': round(sc, 4),
                          'params': [round(float(v), 4) for v in p]})
            if best is None or sc > best[1]:
                best = (p, sc, cnd['base'])
    p, sc, base = best
    info = summarize('coronal', p, base, sc, ax, log)
    info['starts'] = tried
    nccs, offs = per_slice(ax, 'coronal', p, base, every=6)
    info['ncc_per_slice'] = nccs
    info['ncc_summary'] = {'median': round(float(np.median(nccs)), 4), 'min': round(float(np.min(nccs)), 4),
                           'max': round(float(np.max(nccs)), 4)}
    info['per_slice_free_offset'] = free_offset_summary(offs)
    info['landmarks'] = landmark_residuals(ax, 'coronal', p, base)
    log('coronal', info['ncc_summary'], info['landmarks'])
    overlay_png(ax, 'coronal', p, [20, 35, 50, 70, 95], os.path.join(a.png_dir, 'recon-coronal.png'), base)
    reg['coronal'] = info
    write_results('registration', {**prev, **reg})
    reg['specimen_identity'] = air_projection_identity(ax)
    log('identity', reg['specimen_identity'])
    write_results('registration', {**prev, **reg})


if __name__ == '__main__':
    main()
