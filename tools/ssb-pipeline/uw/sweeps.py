"""Reference specimen, stage C2: neurovascular sweeps (centrelines + radius) found in the CT.

    .venv/bin/python tools/ssb-pipeline/uw/sweeps.py [--png-dir DIR]     # after walls.py

Writes ssb/geometry/sweeps.json ({"<id>.<side>": {"pts": [[r, a, s]...], "radius": [mm...]}}, RAS mm,
proximal -> distal) and ssb/geometry/sweeps.meta.json (method, confidence and per-point status for each
sweep), plus the "sweeps" section of registration.json.

Point status, per point of every sweep:
  detected  found in this CT: a canal lumen (bone all round), or the optic nerve in orbital fat
  labelled  a UW arrow tip for the structure (an expert's point on these images)
  inferred  not seen in the data: placed by a stated rule between detected / labelled points
A sweep's confidence is "high" when every point is detected, "medium" when its course is detected
and only short ends are inferred, "low" when most of it is inferred.

The CT is a bone-window display volume without contrast, so vessels show only where bone encloses them
(the petrous carotid canal) and nerves only where a canal encloses them or orbital fat outlines them.

Detectors (all on the committed 0.5 mm volume):
  canal tracker   step 0.5 mm along the canal, re-centre each step on the point farthest from bone in
                  the plane across the canal, stop when fewer than 60 % of 24 rays in that plane meet
                  bone within 4 mm (enclosure)
  ring chain      slice by slice along a grid axis: lumen pixels with bone in >= 85 % of 16 directions
                  within 3 mm, linked to the nearest component within 1.5 mm of the previous slice
  necks           where two tissue compartments of walls.py meet through a gap in bone (optic canal:
                  orbit | intracranial; sphenopalatine foramen: retromaxillary | nasal cavity)
  optic nerve     per coronal slice, the brightest soft-tissue point (soft window) in the central part
                  of the orbit's cross-section (inside the muscle cone), kept while it is >= 4 display
                  levels brighter than the fat around it and moves <= 2 mm per slice
Radii: the graph has no vessel or nerve calibre measurements yet, so radii are stated defaults
(DEFAULT_RADIUS), except where a canal lumen is detected and the structure fills it (petrous ICA).
"""
import argparse, json, os, sys
import numpy as np
from scipy import ndimage as ndi
from skimage.graph import MCP_Geometric

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import CACHE, read_results, write_results  # noqa: E402
from walls import read_volume, Grid, BT, tips  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
# mm; defaults, not graph values (no calibre measurement exists in ssb/content yet)
DEFAULT_RADIUS = {
    's.internal-carotid-artery': 2.3, 's.optic-nerve': 1.6, 's.maxillary-nerve': 1.2, 's.vidian-nerve': 0.6,
    's.infraorbital-nerve': 1.1, 's.anterior-ethmoidal-artery': 0.5, 's.posterior-ethmoidal-artery': 0.4,
    's.sphenopalatine-artery': 0.8, 's.nasolacrimal-duct': 1.5,
}
SIDES = (('R', 1), ('L', -1))


class Vol:
    def __init__(self):
        self.hdr, self.ct, self.lab, self.table = read_volume()
        self.g = Grid(self.hdr)
        self.ctf = self.ct.astype(np.float32)
        self.bone = self.ct >= BT
        self.dbone = ndi.distance_transform_edt(~self.bone, sampling=self.g.step).astype(np.float32)
        self.vsm = ndi.gaussian_filter(self.ctf, 1.0)
        w = np.load(os.path.join(CACHE, 'walls-grid.npz'))
        self.ws = w['ws']; self.comp = json.loads(str(w['comp']))
        self.labels = w['labels']; self.ltable = json.loads(str(w['table']))
        self.byname = {v: int(k) for k, v in self.ltable.items()}

    def samp(self, vol, P, order=1):
        g = self.g
        P = np.atleast_2d(np.asarray(P, float))
        k = (P[:, 2] - g.s[0]) / g.step; j = (P[:, 1] - g.a[0]) / g.step; i = (P[:, 0] - g.r[0]) / g.step
        return ndi.map_coordinates(vol, [k, j, i], order=order, mode='nearest')

    def label_mask(self, name):
        return self.labels == self.byname[name] if name in self.byname else np.zeros(self.labels.shape, bool)


def basis(t):
    t = t / np.linalg.norm(t)
    h = np.array([1.0, 0, 0]) if abs(t[0]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(t, h); u /= np.linalg.norm(u)
    return u, np.cross(t, u)


ANG = np.linspace(0, 2 * np.pi, 24, endpoint=False)


def enclosure(V, p, t, R=4.0):
    u, v = basis(t)
    rad = np.arange(0.25, R + 1e-6, 0.25)
    dirs = np.cos(ANG)[:, None] * u + np.sin(ANG)[:, None] * v
    P = p + dirs[:, None, :] * rad[None, :, None]
    vals = V.samp(V.ctf, P.reshape(-1, 3)).reshape(len(ANG), len(rad))
    return float((vals >= BT).any(axis=1).mean())


def recenter(V, p, t, search=1.5, pull=0.4):
    u, v = basis(t)
    o = np.arange(-search, search + 1e-6, 0.25)
    U, W = np.meshgrid(o, o)
    P = p + U.ravel()[:, None] * u + W.ravel()[:, None] * v
    d = V.samp(V.dbone, P); c = V.samp(V.ctf, P)
    score = np.where(c < BT, d - pull * np.hypot(U.ravel(), W.ravel()), -1e9)
    b = int(np.argmax(score))
    return P[b], float(d[b])


def track(V, seed, t0, max_len=30.0, step=0.5, min_encl=0.6, patience=4, inertia=0.85):
    """Canal tracker (module docstring). Returns points ordered along -t0 ... seed ... +t0, lumen
    radius (mm to bone) and enclosure per point."""
    t0 = np.asarray(t0, float); t0 /= np.linalg.norm(t0)
    p0, d0 = recenter(V, np.asarray(seed, float), t0)
    out = {}
    for sgn in (1, -1):
        p = p0.copy(); t = sgn * t0; pts = []; miss = 0; L = 0.0
        while L < max_len:
            q, d = recenter(V, p + t * step, t, search=1.0)
            e = enclosure(V, q, t)
            pts.append((q, d, e))
            miss = miss + 1 if e < min_encl else 0
            if miss >= patience:
                pts = pts[:-patience]
                break
            nt = q - p; nt /= (np.linalg.norm(nt) + 1e-9)
            t = inertia * t + (1 - inertia) * nt; t /= np.linalg.norm(t)
            p = q; L += step
        out[sgn] = pts
    seq = list(reversed(out[-1])) + [(p0, d0, enclosure(V, p0, t0))] + out[1]
    return (np.array([x[0] for x in seq]), np.array([x[1] for x in seq]), np.array([x[2] for x in seq]))


DIRS16 = [(np.cos(t), np.sin(t)) for t in np.linspace(0, 2 * np.pi, 16, endpoint=False)]


def ring2d(bone2d, R=3.0, step=0.5):
    H, W = bone2d.shape
    hit = np.zeros((16, H, W), bool)
    for n, (dy, dx) in enumerate(DIRS16):
        for m in range(1, int(R / step) + 1):
            oy, ox = int(round(m * dy)), int(round(m * dx))
            sh = np.zeros_like(bone2d)
            sh[max(0, -oy):H - max(0, oy), max(0, -ox):W - max(0, ox)] = bone2d[max(0, oy):H - max(0, -oy), max(0, ox):W - max(0, -ox)]
            hit[n] |= sh
    return hit.mean(0)


def ring_chain(V, seed, axis, n_back, n_fwd, window=3.0, drift=1.5, rmin=0.4, rmax=3.0, gap=2, min_ring=0.85):
    """Ring chain (module docstring) along grid axis 0 (s), 1 (a) or 2 (r)."""
    g = V.g
    k0 = int(round(g.idx(seed)[axis]))
    axes = [x for x in range(3) if x != axis]
    sp = g.idx(seed)

    def best_near(idx, p2, rad):
        b = np.take(V.bone, idx, axis=axis)
        d = ndi.distance_transform_edt(~b, sampling=g.step)
        rg = ring2d(b)
        cand = (rg >= min_ring) & ~b & (d >= rmin) & (d <= rmax)
        if not cand.any():
            return None
        cl, n = ndi.label(cand)
        best = None
        for c in range(1, n + 1):
            yy, xx = np.nonzero(cl == c)
            w = d[yy, xx]
            cy, cx = (yy * w).sum() / w.sum(), (xx * w).sum() / w.sum()
            dd = np.hypot(cy - p2[0], cx - p2[1]) * g.step
            if dd <= rad and (best is None or dd < best[0]):
                best = (dd, cy, cx, float(w.max()), float(rg[yy, xx].mean()))
        return best
    res = {}
    for sgn, nmax in ((1, n_fwd), (-1, n_back)):
        p2 = np.array([sp[axes[0]], sp[axes[1]]]); miss = 0; k = k0; first = True; out = []
        for _ in range(nmax + 1):
            bst = best_near(k, p2, window if first else drift)
            if bst is None:
                miss += 1
                if miss > gap:
                    break
            else:
                miss = 0; first = False; p2 = np.array([bst[1], bst[2]])
                kji = [0.0, 0.0, 0.0]; kji[axis] = k; kji[axes[0]] = bst[1]; kji[axes[1]] = bst[2]
                out.append((g.ras(np.array(kji)), bst[3], bst[4]))
            k += sgn
            if not 0 <= k < g.shape[axis]:
                break
        res[sgn] = out
    seq = list(reversed(res[-1])) + res[1][1:] if res[-1] else res[1]
    if len(seq) < 2:
        return None
    return np.array([x[0] for x in seq]), np.array([x[1] for x in seq]), np.array([x[2] for x in seq])


def refine_on_tips(V, pts, axis=1, search=1.5, min_ring=0.8):
    """Each point -> the non-bone voxel farthest from bone within `search` mm in the grid slice across `axis`;
    returns points and whether bone encloses each (ring score >= min_ring, lumen radius 0.4-3 mm)."""
    g = V.g
    out, ok = [], []
    cache = {}
    for p in pts:
        kji = np.round(g.idx(p)).astype(int)
        idx = int(np.clip(kji[axis], 0, g.shape[axis] - 1))
        if idx not in cache:
            b = np.take(V.bone, idx, axis=axis)
            cache[idx] = (b, ndi.distance_transform_edt(~b, sampling=g.step), ring2d(b))
        b, d, rg = cache[idx]
        other = [x for x in range(3) if x != axis]
        c0, c1 = kji[other[0]], kji[other[1]]
        n = int(search / g.step)
        lo0, hi0 = max(0, c0 - n), min(b.shape[0], c0 + n + 1); lo1, hi1 = max(0, c1 - n), min(b.shape[1], c1 + n + 1)
        sub = np.where(~b[lo0:hi0, lo1:hi1], d[lo0:hi0, lo1:hi1], -1)
        y, x = np.unravel_index(np.argmax(sub), sub.shape)
        q = [0.0, 0.0, 0.0]; q[axis] = idx; q[other[0]] = y + lo0; q[other[1]] = x + lo1
        out.append(g.ras(np.array(q, float)))
        dd, rr = d[y + lo0, x + lo1], rg[y + lo0, x + lo1]
        ok.append(bool(rr >= min_ring and 0.4 <= dd <= 3.0))
    return np.array(out), np.array(ok)


def necks(V, A, B, min_vox=4):
    """Clusters of compartment-A voxels touching compartment B: [(n, centroid RAS)], largest first."""
    a = V.ws == V.comp[A]; b = V.ws == V.comp[B]
    m = a & ndi.binary_dilation(b, ndi.generate_binary_structure(3, 1))
    cl, n = ndi.label(m, ndi.generate_binary_structure(3, 3))
    out = []
    for c in range(1, n + 1):
        kk, jj, ii = np.nonzero(cl == c)
        if len(kk) >= min_vox:
            out.append((len(kk), V.g.ras(np.stack([kk, jj, ii], 1)).mean(0)))
    return sorted(out, key=lambda x: -x[0])


def hug_path(V, A, C, allowed, d_target=2.5, pad=6.0):
    """Minimal path A -> C through `allowed` non-bone voxels that prefers to stay d_target mm from bone
    (a vessel lying in a bony sulcus). Used only for inferred segments."""
    g = V.g
    lo = np.minimum(A, C) - pad; hi = np.maximum(A, C) + pad
    i0, j0, k0 = [max(0, int((lo[0] - g.r[0]) / g.step)), max(0, int((lo[1] - g.a[0]) / g.step)), max(0, int((lo[2] - g.s[0]) / g.step))]
    i1, j1, k1 = [min(g.shape[2] - 1, int((hi[0] - g.r[0]) / g.step) + 1), min(g.shape[1] - 1, int((hi[1] - g.a[0]) / g.step) + 1),
                  min(g.shape[0] - 1, int((hi[2] - g.s[0]) / g.step) + 1)]
    sl = (slice(k0, k1 + 1), slice(j0, j1 + 1), slice(i0, i1 + 1))
    cost = 1.0 + ((V.dbone[sl] - d_target) / 1.0) ** 2
    cost[~allowed[sl]] = np.inf
    a_ = tuple(np.clip(np.round(g.idx(A)).astype(int) - [k0, j0, i0], 0, np.array(cost.shape) - 1))
    c_ = tuple(np.clip(np.round(g.idx(C)).astype(int) - [k0, j0, i0], 0, np.array(cost.shape) - 1))
    cost[a_] = 1.0; cost[c_] = 1.0
    m = MCP_Geometric(cost)
    costs, _ = m.find_costs([a_], [c_])
    if not np.isfinite(costs[c_]):
        return None
    return g.ras(np.array(m.traceback(c_)) + [k0, j0, i0])


def resample(P, step=1.0, sigma=1.0):
    """Arc-length resample at `step` mm after light Gaussian smoothing (ends kept)."""
    P = np.asarray(P, float)
    if len(P) < 2:
        return P
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    if d[-1] < 1e-6:
        return P[:1]
    t = np.linspace(0, d[-1], max(2, int(np.ceil(d[-1] / 0.25)) + 1))
    Q = np.stack([np.interp(t, d, P[:, c]) for c in range(3)], 1)
    if sigma > 0 and len(Q) > 4:
        Qs = np.stack([ndi.gaussian_filter1d(Q[:, c], sigma / 0.25, mode='nearest') for c in range(3)], 1)
        Qs[0], Qs[-1] = Q[0], Q[-1]
        Q = Qs
    d2 = np.r_[0, np.cumsum(np.linalg.norm(np.diff(Q, axis=0), axis=1))]
    t2 = np.linspace(0, d2[-1], max(2, int(round(d2[-1] / step)) + 1))
    return np.stack([np.interp(t2, d2, Q[:, c]) for c in range(3)], 1)


def length(P):
    return float(np.sum(np.linalg.norm(np.diff(P, axis=0), axis=1))) if len(P) > 1 else 0.0


class Sweep:
    """Pieces with a status each; joined proximal -> distal, resampled, status carried per point."""

    def __init__(self, sid, side):
        self.sid, self.side = sid, side
        self.pieces = []           # (points, status, radius or array)
        self.notes = []
        self.points = {}           # named points for the meta (landmark candidates)

    def add(self, P, status, radius=None):
        P = np.atleast_2d(np.asarray(P, float))
        if len(P):
            self.pieces.append((P, status, radius))

    def build(self, step=1.0):
        pts, st, rad = [], [], []
        for P, status, radius in self.pieces:
            if len(P) == 1 and pts:
                k = int(np.argmin(np.linalg.norm(np.array(pts) - P[0], axis=1)))
                if np.linalg.norm(pts[k] - P[0]) < 1.0:
                    st[k] = status
                    continue
            Q = resample(P, step, sigma=1.0 if status != 'inferred' else 0.5) if len(P) > 1 else P
            if pts and np.linalg.norm(Q[0] - pts[-1]) < 0.5:
                if len(Q) == 1:                        # a single point on the previous piece's end: it names it
                    st[-1] = status if status != 'inferred' else st[-1]
                    continue
                Q = Q[1:]
            r = DEFAULT_RADIUS[self.sid] if radius is None else radius
            r = np.interp(np.linspace(0, 1, len(Q)), np.linspace(0, 1, len(np.atleast_1d(r))), np.atleast_1d(r)) if np.ndim(r) else np.full(len(Q), r)
            pts += list(Q); st += [status] * len(Q); rad += list(r)
        return np.array(pts), st, np.array(rad)


# ---------------------------------------------------------------- the sweeps
def optic_nerves(V, res, out):
    g = V.g
    for sd, sg in SIDES:
        sw = Sweep('s.optic-nerve', sd)
        nk = necks(V, 'orbit.' + sd, 'intracranial')[:3]
        # the optic canal is the superomedial orbit | intracranial neck (the other large one is the SOF)
        cand = [c for _, c in nk if c[2] > 37]
        if not cand:
            sw.notes.append('optic canal neck not found'); out.append(sw); continue
        N = min(cand, key=lambda c: abs(c[0]))
        P, D, E = track(V, N, [sg * 0.4, 1, 0], max_len=8.0, min_encl=0.5)
        P = P[np.argsort(P[:, 1])]                     # posterior (cranial) -> anterior (orbital)
        sw.add(P, 'detected')
        sw.points['lm.optic-canal-cranial-opening'] = P[0]; sw.points['lm.optic-canal-orbital-opening'] = P[-1]
        sw.canal = {'length_mm': round(length(P), 1), 'lumen_radius_mm_median': round(float(np.median(D)), 2),
                    'enclosure_median': round(float(np.median(E)), 2), 'neck_ras': [round(float(x), 1) for x in N]}
        # intraorbital nerve in orbital fat
        orb = V.ws == V.comp['orbit.' + sd]
        A16 = np.linspace(0, 2 * np.pi, 16, endpoint=False)
        nerve, prev = [], P[-1]
        for av in np.arange(P[-1][1] + 0.5, -18.0, 0.5):
            j = int(round((av - g.a[0]) / g.step))
            om = orb[:, j, :] & (V.ct[:, j, :] < BT)
            if om.sum() < 40:
                break
            cl, n = ndi.label(om)
            if n > 1:
                sizes = np.bincount(cl.ravel()); sizes[0] = 0; om = cl == np.argmax(sizes)
            inner = ndi.distance_transform_edt(om, sampling=g.step)
            v = V.vsm[:, j, :]
            sc = np.where((inner >= 0.55 * inner.max()) & (v < 118), v, -1)
            k, i = np.unravel_index(np.argmax(sc), sc.shape)
            q = np.array([g.r[i], av, g.s[k]])
            ring = V.samp(V.vsm, np.stack([q[0] + 3.0 * np.cos(A16), np.full(16, av), q[2] + 3.0 * np.sin(A16)], 1))
            con = float(v[k, i] - np.percentile(ring, 25))
            step = np.hypot(q[0] - prev[0], q[2] - prev[2])
            if con < 4.0 or (nerve and step > 2.0):
                if av > -36:                           # the globe's posterior pole: stop
                    break
                continue
            nerve.append(q); prev = q
        if len(nerve) >= 6:
            sw.add(np.array(nerve), 'detected', 2.0)
            sw.notes.append(f'intraorbital nerve followed in orbital fat to a = {nerve[-1][1]:.1f} mm (globe)')
        out.append(sw)


def carotids(V, res, out):
    g = V.g
    ic = V.ws == V.comp['intracranial']
    pet = tips(res, 'petrous carotid canal')
    clin_found = {}
    for sd, sg in SIDES:
        sw = Sweep('s.internal-carotid-artery', sd)
        own = [p for p in pet if np.sign(p[0]) == sg]
        seed = np.median(own, 0) if own else np.array([sg * 22.3, -77.0, 20.0])
        sw.notes.append(f'petrous canal seeded from {"UW petrous carotid canal tips" if own else "the mirrored right-side tips"}')
        P, D, E = track(V, seed, [-sg * 0.85, 0.53, 0], max_len=25.0, min_encl=0.6)
        if length(P) < 10:
            sw.notes.append('petrous canal not tracked'); out.append(sw); continue
        # orient proximal (vertical petrous segment, inferior) -> distal (petrous apex)
        if P[0][2] > P[-1][2] and abs(P[0][0]) < abs(P[-1][0]):
            P, D, E = P[::-1], D[::-1], E[::-1]
        rad = np.clip(ndi.gaussian_filter1d(D, 3), 1.6, 2.8)
        sw.add(P, 'detected', rad)
        sw.canal = {'length_mm': round(length(P), 1), 'lumen_radius_mm_median': round(float(np.median(D)), 2),
                    'enclosure_median': round(float(np.median(E)), 2)}
        A = P[-1]
        # clinoid segment: the soft-tissue point farthest from bone beneath the anterior clinoid,
        # lateral to the sphenoid body (clinoid found as the bone ring above the sinus in each side's box)
        C = clinoid_carotid_space(V, sd, sg)
        if C is None and clin_found:
            m = np.array(next(iter(clin_found.values()))) * [-1, 1, 1]
            C = clinoid_carotid_space(V, sd, sg, near=m)
            if C is not None:
                sw.notes.append('this side\'s anterior clinoid ring was not found; the other side\'s, mirrored, set '
                                'the search box')
        if C is not None:
            clin_found[sd] = C
        if C is None:
            sw.notes.append('clinoid space not found; cavernous segment omitted'); out.append(sw); continue
        allowed = ~V.bone & ~(V.labels > 0) & (ic | (V.ws == V.comp.get('retromaxillary.' + sd, -1)))
        H = hug_path(V, A, C, allowed)
        if H is None:
            sw.notes.append('no soft-tissue path from the canal to the clinoid space'); out.append(sw); continue
        sw.add(H, 'inferred')
        sw.notes.append('cavernous course inferred: shortest soft-tissue path from the end of the bony canal to the '
                        'space beneath the anterior clinoid that keeps ~2.5 mm from bone (it hugs the carotid sulcus '
                        'of the sphenoid body); no contrast, so the vessel itself is not seen there')
        sw.points['canal_end'] = A; sw.points['clinoid_space'] = C
        out.append(sw)


def clinoid_carotid_space(V, sd, sg, near=None):
    g = V.g
    best = None
    if near is not None:                               # mirrored other-side carotid space: use its level
        best = np.array([near[0], near[1], near[2] + 5.0])
    for av in (np.arange(-64, -55.9, 0.5) if near is None else []):
        j = int(round((av - g.a[0]) / g.step))
        rr = sg * g.r
        box = (rr[None, :] > 8) & (rr[None, :] < 24) & (g.s[:, None] > 37) & (g.s[:, None] < 46)
        b = V.bone[:, j, :] & box & (V.labels[:, j, :] == 0)
        cl, n = ndi.label(b)
        for c in range(1, n + 1):
            kk, ii = np.nonzero(cl == c)
            if 6 <= len(kk) <= 120 and (kk.max() - kk.min()) * g.step < 7:      # a small ring, not the wing
                filled = ndi.binary_fill_holes(cl == c)
                if filled.sum() > len(kk) + 2:                                  # it encloses something
                    cen = np.array([g.r[ii].mean(), av, g.s[kk].mean()])
                    if best is None or abs(cen[0]) < abs(best[0]):
                        best = cen
        if best is not None:
            break
    if best is None:
        return None
    # soft tissue under the clinoid, lateral to the sphenoid body: farthest from bone in that box
    j = int(round((best[1] - g.a[0]) / g.step))
    rr = sg * g.r
    box = (rr[None, :] > sg * best[0] - 6) & (rr[None, :] < sg * best[0] + 1) & (g.s[:, None] > best[2] - 8) & (g.s[:, None] < best[2] - 2)
    d = np.where(box & ~V.bone[:, j, :] & (V.labels[:, j, :] == 0), V.dbone[:, j, :], -1)
    k, i = np.unravel_index(np.argmax(d), d.shape)
    return np.array([g.r[i], best[1], g.s[k]]) if d[k, i] > 0.5 else None


def maxillary_nerves(V, res, out):
    rot = tips(res, 'foramen rotundum')
    found = {}
    for sd, sg in SIDES:
        own = [p for p in rot if np.sign(p[0]) == sg]
        seeds = [np.median(own, 0)] if own else []
        found[sd] = None
        for s0 in seeds:
            ch = ring_chain(V, s0, 1, 12, 12)
            if ch is not None and 2.5 <= length(ch[0]) <= 9:
                found[sd] = (ch, 'UW foramen rotundum tips')
                break
    for sd, sg in SIDES:
        if found[sd] is None:
            other = found['L' if sd == 'R' else 'R']
            if other is not None:
                m = other[0][0].copy(); m[:, 0] *= -1
                ch = ring_chain(V, m.mean(0), 1, 12, 12, window=4.0)
                if ch is not None and 2.5 <= length(ch[0]) <= 9 and np.linalg.norm(ch[0].mean(0) - m.mean(0)) < 5:
                    found[sd] = (ch, 'the other side\'s canal, mirrored, as the search seed')
    for sd, sg in SIDES:
        sw = Sweep('s.maxillary-nerve', sd)
        if found[sd] is None:
            sw.notes.append('foramen rotundum canal not detected'); out.append(sw); continue
        (P, D, E), how = found[sd]
        P = P[np.argsort(P[:, 1])]                     # posterior (middle cranial fossa) -> anterior (PPF)
        t = P[-1] - P[0]; t /= np.linalg.norm(t)
        sw.add([P[0] - 3 * t, P[0]], 'inferred')
        sw.add(P, 'detected')
        sw.add([P[-1], P[-1] + 4 * t], 'inferred')
        sw.canal = {'length_mm': round(length(P), 1), 'seed': how}
        sw.notes.append('canal detected (ring chain); 3 mm behind (towards the trigeminal ganglion) and 4 mm in front '
                        '(into the pterygopalatine fossa) continue the canal axis and are inferred')
        out.append(sw)


def floor_s(V, p):
    """Height (mm) of the lowest sphenoid-sinus air voxel at (r, a) of p, or None."""
    g = V.g
    i = int(round((p[0] - g.r[0]) / g.step)); j = int(round((p[1] - g.a[0]) / g.step))
    sph = [V.byname[n] for n in V.byname if n.startswith('s.sphenoid-sinus.')]
    col = np.isin(V.labels[:, j, i], sph)
    ks = np.nonzero(col)[0]
    return float(g.s[ks.min()]) if len(ks) else None


def vidian_nerves(V, res, out, prior):
    """Inferred apart from the UW-labelled point: the canal is ~1-2 mm and partial-volumed (its lumen reads
    above the bone threshold), and neither detector follows it. Ends from detected neighbours: posterior at the
    coronal level where this side's petrous carotid canal ends (foramen lacerum), anterior at the level of this
    side's detected foramen rotundum anterior opening (both open on the posterior wall of the PPF)."""
    vt = tips(res, 'vidian canal')
    anchor_ref = np.median(vt, 0) if vt else None
    depth = None
    for sd, sg in sorted(SIDES, key=lambda x: -sum(np.sign(p[0]) == x[1] for p in vt)):   # labelled side first
        sw = Sweep('s.vidian-nerve', sd)
        own = [p for p in vt if np.sign(p[0]) == sg]
        anchor = np.median(own, 0) if own else (np.median(vt, 0) * [-1, 1, 1] if vt else None)
        ica = next((x for x in prior if x.sid == 's.internal-carotid-artery' and x.side == sd and x.pieces), None)
        v2 = next((x for x in prior if x.sid == 's.maxillary-nerve' and x.side == sd and x.pieces), None)
        if anchor is None or ica is None or v2 is None:
            sw.notes.append('missing anchor, petrous canal or foramen rotundum on this side'); out.append(sw); continue
        a_back = float(ica.pieces[0][0][-1][1])
        a_front = float(next(P for P, st, _ in v2.pieces if st == 'detected')[-1][1])
        # depth: the labelled point's depth below the sphenoid floor (air bottom at its r, a), kept at every point
        # of the line, so the drawn canal stays in the floor and never crosses sinus air
        if depth is None:
            depth = floor_s(V, anchor_ref) - anchor_ref[2] if anchor_ref is not None and floor_s(V, anchor_ref) else 2.0
        line = []
        for av in np.arange(a_back, a_front + 1e-6, 1.0):
            q = np.array([anchor[0], av, anchor[2]])
            fs = floor_s(V, q)
            if fs is not None:
                q[2] = min(q[2], fs - depth)
            line.append(q)
        line = np.array(line)
        line[:, 2] = ndi.gaussian_filter1d(line[:, 2], 2.0, mode='nearest')
        sw.add(line, 'inferred')
        if own:
            sw.add([anchor], 'labelled')
        sw.points['lm.vidian-canal-posterior-end'] = [anchor[0], a_back, anchor[2]]
        sw.notes.append(('UW vidian canal tips (median) are the one labelled point; ' if own else
                         'mirrored from the other side\'s UW tips; ') +
                        f'course drawn straight (AP) at that point\'s depth below the sphenoid floor ({depth:.1f} mm) '
                        f'and side, from the level of the petrous '
                        f'canal\'s end (a = {a_back:.1f}) to the level of the foramen rotundum\'s anterior opening '
                        f'(a = {a_front:.1f}); the canal itself is not resolved by the detectors')
        out.append(sw)


def infraorbital_nerves(V, res, out):
    g = V.g
    ioft = tips(res, 'inferior orbital foramen')
    chains = {}
    for sd, sg in SIDES:
        own = [p for p in ioft if np.sign(p[0]) == sg]
        ref = np.array(own if own else [[-p[0], p[1], p[2]] for p in ioft])
        ref = ref[np.lexsort((-ref[:, 2], ref[:, 1]))]
        ch = None
        for seed in [np.median(ref, 0)] + list(ref):    # the median first, then each tip as the seed
            ch = ring_chain(V, seed, 1, 60, 10, window=3.0)
            if ch is not None and length(ch[0]) >= 4:
                break
        chains[sd] = (ch, bool(own), ref)
    for sd, sg in SIDES:
        sw = Sweep('s.infraorbital-nerve', sd)
        ch, own, ref = chains[sd]
        if ch is not None and length(ch[0]) >= 4:
            P = ch[0][np.argsort(ch[0][:, 1])]         # posterior -> anterior (foramen)
            how = 'ring chain'
            pieces = [(P, 'detected')]
        else:
            # the tips trace the canal from the foramen up and back: refine each onto the lumen
            Q, ok = refine_on_tips(V, ref, axis=1)
            if ok.sum() < 3:
                sw.notes.append('infraorbital canal not detected'); out.append(sw); continue
            P = Q
            how = f'UW tips{"" if own else " (mirrored)"} refined onto the lumen; {int(ok.sum())}/{len(ok)} enclosed by bone'
            pieces = [(Q, 'detected' if ok.mean() >= 0.6 else ('labelled' if own else 'inferred'))]
        # posterior: along the orbital floor to the inferior orbital fissure (orbit | retromaxillary neck nearest
        # to the canal's backward extension), inferred - the open groove is not resolved
        nk = necks(V, 'orbit.' + sd, 'retromaxillary.' + sd)
        t = P[0] - P[-1]; t /= np.linalg.norm(t)
        back = None
        if nk:
            back = min((c for _, c in nk), key=lambda c: np.linalg.norm(np.cross(c - P[0], t)) + 0.2 * np.linalg.norm(c - P[0]))
        if back is not None:
            floor = V.label_mask('s.orbital-floor.' + sd)
            seg = np.linspace(back, P[0], 12)
            # keep the inferred groove on top of the orbital floor: lift each point to 1 mm above the floor label
            for n in range(1, len(seg) - 1):
                kji = np.round(g.idx(seg[n])).astype(int)
                col = floor[:, kji[1], kji[2]]
                ks = np.nonzero(col)[0]
                if len(ks):
                    seg[n][2] = g.s[ks.max()] + 1.0
            sw.add(seg, 'inferred')
        for Pp, stt in pieces:
            sw.add(Pp, stt)
        sw.points['canal_posterior'] = P[0]; sw.points['lm.infraorbital-foramen'] = P[-1]
        sw.canal = {'length_mm': round(length(P), 1), 'method': how, 'seed': 'UW inferior orbital foramen tips' if own else
                    'the other side\'s UW tips, mirrored'}
        sw.notes.append('canal detected (ring chain) from the foramen back; the groove behind it and the course to '
                        'the inferior orbital fissure are inferred along the top of the labelled orbital floor')
        out.append(sw)


def nasolacrimal_ducts(V, res, out):
    nt = [p for p in tips(res, 'nasolacrimal duct')]
    for sd, sg in SIDES:
        sw = Sweep('s.nasolacrimal-duct', sd)
        own = [p for p in nt if np.sign(p[0]) == sg]
        ref = own if own else [[-p[0], p[1], p[2]] for p in nt]
        ref = np.array(ref)
        med = np.median(ref, 0)
        ref = ref[np.abs(ref[:, 0] - med[0]) < 5]      # drop tips far off the duct's track (2 tips at r ~ 30)
        seed = ref[np.argmin(np.abs(ref[:, 2] - 20.4))]
        ch = ring_chain(V, seed, 0, 40, 30, window=3.0 if own else 4.0)
        if ch is None or length(ch[0]) < 6:
            sw.notes.append('nasolacrimal canal not detected'); out.append(sw); continue
        P, D, E = ch
        P = P[np.argsort(-P[:, 2])]                    # top (lacrimal sac) -> bottom (inferior meatus)
        sw.add(P, 'detected', np.clip(np.median(D), 1.0, 2.2))
        sw.points['lm.nasolacrimal-duct-top'] = P[0]; sw.points['lm.hasner-valve'] = P[-1]
        sw.canal = {'length_mm': round(length(P), 1), 'lumen_radius_mm_median': round(float(np.median(D)), 2),
                    'seed': 'UW nasolacrimal duct tips' if own else 'the other side\'s UW tips, mirrored',
                    'tip_track_distance_mm_median': round(float(np.median([np.min(np.linalg.norm(P - q, axis=1)) for q in ref])), 2)}
        sw.notes.append('bony nasolacrimal canal detected (ring chain, axial slices); the sac above and the meatal '
                        'opening below are where bone stops enclosing the lumen')
        out.append(sw)


def sphenopalatine_arteries(V, res, out):
    g = V.g
    for sd, sg in SIDES:
        sw = Sweep('s.sphenopalatine-artery', sd)
        nk = necks(V, 'retromaxillary.' + sd, 's.nasal-cavity.' + sd)
        if not nk:
            sw.notes.append('sphenopalatine foramen not found'); out.append(sw); continue
        F = nk[0][1]
        # PPF side: soft tissue farthest from bone within 8 mm lateral of the foramen, in the retromaxillary
        # compartment; nasal side: 4 mm medial of the foramen
        ret = (V.ws == V.comp['retromaxillary.' + sd]) & ~V.bone
        kji = np.round(g.idx(F)).astype(int)
        lo = np.maximum(kji - [6, 8, 0], 0); hi = np.minimum(kji + [7, 9, 17], g.shape)
        if sg < 0:
            lo[2], hi[2] = max(0, kji[2] - 16), kji[2] + 1
        else:
            lo[2], hi[2] = kji[2], min(g.shape[2], kji[2] + 17)
        sub = np.where(ret[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], V.dbone[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], -1)
        q = np.array(np.unravel_index(np.argmax(sub), sub.shape)) + lo
        Pp = g.ras(q)
        Pn = F + np.array([-sg * 4.0, -1.0, -1.0])
        sw.add([Pp, F], 'inferred'); sw.add([F], 'detected'); sw.add([F, Pn], 'inferred')
        sw.points['lm.sphenopalatine-foramen'] = F
        sw.notes.append('the foramen is detected (where the retromaxillary and nasal compartments meet through the '
                        'lateral nasal wall); the vessel is not visible without contrast: its course from the '
                        'centre of the pterygopalatine fossa through the foramen to 4 mm onto the nasal side is inferred')
        out.append(sw)


def ethmoidal_arteries(V, res, out, optic):
    g = V.g
    roof_ids = ('s.fovea-ethmoidalis', 's.lateral-lamella', 's.cribriform-plate', 's.planum-sphenoidale')
    at = tips(res, 'anterior ethmoidal artery canal')
    for sd, sg in SIDES:
        roof = np.zeros(g.shape, bool)
        for rid in roof_ids:
            roof |= V.label_mask(f'{rid}.{sd}') | V.label_mask(f'{rid}.M')
        lam = V.label_mask('s.lamina-papyracea.' + sd)

        def across(p_orbit):
            # straight from the medial orbital wall to where the vessel enters the olfactory fossa: the top of the
            # labelled lateral lamella at that coronal level (+-1.5 mm), else the most medial labelled roof voxel
            j = int(round((p_orbit[1] - g.a[0]) / g.step))
            js = slice(max(0, j - 3), j + 4)
            ll = (V.label_mask('s.lateral-lamella.' + sd))[:, js, :]
            if ll.any():
                kk, jj, ii = np.nonzero(ll)
                n = int(np.argmax(g.s[kk]))
            else:
                kk, jj, ii = np.nonzero(roof[:, js, :])
                if not len(kk):
                    return None
                n = int(np.argmin(np.abs(g.r[ii])))
            end = np.array([g.r[ii[n]], g.a[jj[n] + js.start], g.s[kk[n]]])
            return np.linspace(p_orbit, end, 6)
        # AEA
        sw = Sweep('s.anterior-ethmoidal-artery', sd)
        own = [p for p in at if np.sign(p[0]) == sg]
        anchor = np.median(own, 0) if own else (np.median(at, 0) * [-1, 1, 1] if at else None)
        if anchor is not None:
            # snap the anchor to the nearest lamina papyracea voxel (the canal leaves the orbit through it)
            kk, jj, ii = np.nonzero(lam)
            if len(kk):
                L = g.ras(np.stack([kk, jj, ii], 1))
                anchor_s = L[np.argmin(np.linalg.norm(L - anchor, axis=1))]
            else:
                anchor_s = anchor
            line = across(anchor_s)
            if line is not None:
                sw.add(line[:1], 'labelled' if own else 'inferred')
                sw.add(line, 'inferred')
                sw.points['lm.anterior-ethmoidal-foramen'] = line[0]; sw.points['lm.aea-lateral-lamella-entry'] = line[-1]
                sw.notes.append(('the one UW "anterior ethmoidal artery canal" tip, snapped to the lamina papyracea, is '
                                 'the labelled point' if own else 'mirrored from the other side\'s UW tip') +
                                '; the course across the ethmoid roof to the lateral lamella is inferred: 1 mm under the '
                                'labelled roof at the same coronal level (a canal in a mesentery below the roof would '
                                'not be found by this rule)')
        out.append(sw)
        # PEA: graph measurement m.pea-to-optic-canal (population mean 6 mm) in front of the optic canal's orbital
        # opening, on the medial orbital wall at roof height
        sw = Sweep('s.posterior-ethmoidal-artery', sd)
        oc = next((o for o in optic if o.side == sd and 'lm.optic-canal-orbital-opening' in o.points), None)
        if oc is not None:
            ref = oc.points['lm.optic-canal-orbital-opening']
            a_pea = ref[1] + 6.0
            j = int(round((a_pea - g.a[0]) / g.step))
            kk, ii = np.nonzero(lam[:, j, :])
            if len(kk):
                top = np.argmax(g.s[kk])
                p0 = np.array([g.r[ii[top]], a_pea, g.s[kk[top]]])
                line = across(p0)
                if line is not None:
                    sw.add(line, 'inferred')
                    sw.points['lm.posterior-ethmoidal-foramen'] = line[0]
                    sw.notes.append('inferred: foramen placed 6 mm in front of the detected optic canal orbital opening '
                                    '(m.pea-to-optic-canal, population mean) at the top of the labelled lamina '
                                    'papyracea; course 1 mm under the labelled roof to its medial edge')
        out.append(sw)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--png-dir', default=CACHE)
    args = ap.parse_args()
    res = read_results()
    V = Vol()
    sweeps = []
    optic = []
    optic_nerves(V, res, optic); sweeps += optic
    carotids(V, res, sweeps)
    maxillary_nerves(V, res, sweeps)
    vidian_nerves(V, res, sweeps, list(sweeps))
    infraorbital_nerves(V, res, sweeps)
    nasolacrimal_ducts(V, res, sweeps)
    sphenopalatine_arteries(V, res, sweeps)
    ethmoidal_arteries(V, res, sweeps, optic)
    js, meta = {}, {}
    order = {'R': 0, 'L': 1}
    for sw in sorted(sweeps, key=lambda s: (s.sid, order[s.side])):
        key = f'{sw.sid}.{sw.side}'
        if not sw.pieces:
            meta[key] = {'status': 'not found', 'notes': sw.notes}
            continue
        P, st, rad = sw.build()
        js[key] = {'pts': [[round(float(x), 1) for x in p] for p in P],
                   'radius': [round(float(x), 2) for x in rad]}
        n = len(st)
        frac = {s: round(st.count(s) / n, 2) for s in ('detected', 'labelled', 'inferred') if st.count(s)}
        conf = 'high' if frac.get('detected', 0) == 1 else ('medium' if frac.get('detected', 0) >= 0.6 else 'low')
        meta[key] = {'confidence': conf, 'length_mm': round(length(P), 1), 'status_fraction': frac,
                     'status': st, 'radius_source': 'default (DEFAULT_RADIUS in sweeps.py; the graph has no calibre '
                     'measurement)' if sw.sid != 's.internal-carotid-artery' else
                     'petrous: detected canal lumen (clamped 1.6-2.8 mm); cavernous: default 2.3 mm',
                     'notes': sw.notes,
                     **({'canal': sw.canal} if hasattr(sw, 'canal') else {}),
                     'points': {k: [round(float(x), 1) for x in v] for k, v in sw.points.items()}}
    json.dump(js, open(os.path.join(REPO, 'ssb/geometry/sweeps.json'), 'w'), indent=1)
    json.dump({'frame': 'RAS mm (docs/ssb.md section 4); points ordered proximal -> distal (arteries from the heart, '
                        'nerves from the brain, the duct from the sac down)',
               'specimen': 'uw-axial-sagittal', 'method': __doc__.split('Point status')[1].strip(),
               'default_radius_mm': DEFAULT_RADIUS, 'sweeps': meta},
              open(os.path.join(REPO, 'ssb/geometry/sweeps.meta.json'), 'w'), indent=1)
    write_results('sweeps', {k: {kk: vv for kk, vv in v.items() if kk != 'status'} for k, v in meta.items()})
    for k, v in meta.items():
        print(k, v.get('confidence', v.get('status')), v.get('length_mm'), v.get('status_fraction'), v.get('canal', ''))
    overlays(V, js, meta, args.png_dir)


def overlays(V, js, meta, png_dir):
    """Each sweep drawn on the CT: a straightened (curved planar) reslice along it plus its projection on the
    nearest axial, coronal and sagittal slices of its mid-point."""
    from PIL import Image, ImageDraw
    g = V.g
    col = {'detected': (60, 255, 60), 'labelled': (255, 220, 0), 'inferred': (255, 60, 60)}
    tiles = []
    for key, sw in js.items():
        P = np.array(sw['pts']); st = meta[key]['status']
        mid = P[len(P) // 2]
        views = []
        for plane in ('ax', 'cor', 'sag'):
            if plane == 'ax':
                k = int(round((mid[2] - g.s[0]) / g.step)); img = V.ct[k]; U, W = P[:, 0], P[:, 1]; uax, wax = g.r, g.a
            elif plane == 'cor':
                j = int(round((mid[1] - g.a[0]) / g.step)); img = V.ct[:, j, :]; U, W = P[:, 0], P[:, 2]; uax, wax = g.r, g.s
            else:
                i = int(round((mid[0] - g.r[0]) / g.step)); img = V.ct[:, :, i]; U, W = P[:, 1], P[:, 2]; uax, wax = g.a, g.s
            u0, u1 = U.min() - 12, U.max() + 12; w0, w1 = W.min() - 12, W.max() + 12     # the sweep + 12 mm
            iu = np.nonzero((uax >= u0) & (uax <= u1))[0]; iw = np.nonzero((wax >= w0) & (wax <= w1))[0]
            sub = img[np.ix_(iw, iu)].astype(float)[::-1, ::-1]            # W up; R / anterior on the left
            im = Image.fromarray(np.clip((sub - 40) / 180 * 255, 0, 255).astype(np.uint8)).convert('RGB')
            sc = 4
            im = im.resize((im.width * sc, im.height * sc), Image.BICUBIC)
            d = ImageDraw.Draw(im)
            for n in range(len(P)):
                x = (uax[iu][-1] - U[n]) / g.step * sc; y = (wax[iw][-1] - W[n]) / g.step * sc
                d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=col[st[n]])
            d.text((3, 3), f'{key} {plane} through mid', fill=(255, 255, 0))
            views.append(im)
        H = max(v.height for v in views); Wd = sum(v.width for v in views) + 8
        t = Image.new('RGB', (Wd, H), (20, 20, 20)); x = 0
        for v in views:
            t.paste(v, (x, 0)); x += v.width + 4
        tiles.append(t)
    # pack tiles in rows, several images
    for n0 in range(0, len(tiles), 6):
        grp = tiles[n0:n0 + 6]
        W = max(t.width for t in grp); H = sum(t.height + 6 for t in grp)
        c = Image.new('RGB', (W, H), (20, 20, 20)); y = 0
        for t in grp:
            c.paste(t, (0, y)); y += t.height + 6
        c.save(os.path.join(png_dir, f'reconC-sweeps-{n0 // 6 + 1}.png'))


if __name__ == '__main__':
    main()
