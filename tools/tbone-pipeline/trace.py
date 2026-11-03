"""Centreline tracing on the committed display volume (tbone/ct), in OLSB mm. Used by sweeps.py.

Display levels (8-bit, not HU): air ~ 43 (the window floor; 0 only where there is no data), soft tissue / fluid ~ 110, dense bone ~ 245; BONE = 185 is
the level above which a voxel counts as bone wall (cancellous bone and thin walls blur below it).

Status of a sweep point (the SSB meaning, tools/ssb-pipeline/uw/sweeps.py):
  detected  found in this CT: the path point lies in a lumen (not bone) and is enclosed by bone (kind
            'enclosed'), or lies in air (kind 'air'), or in soft tissue bounded by bone (kind 'soft')
  labelled  a UW arrow tip (an expert's point on these images), possibly snapped to the nearest lumen
            voxel within SNAP mm (the snap distance is recorded)
  inferred  neither: placed by a stated rule between detected / labelled points (straight interpolation)
"""
import numpy as np
from scipy import ndimage as ndi
from skimage.graph import route_through_array

BONE = 185.0
SNAP = 0.8


class Vol:
    def __init__(self, V, spacing, origin):
        self.V = V.astype(np.float32)
        self.h = float(spacing)
        self.o = np.asarray(origin, float)
        self.Vs = ndi.gaussian_filter(self.V, 0.4 / self.h)
        self.bone = self.Vs >= BONE
        self.dbone = ndi.distance_transform_edt(~self.bone, sampling=self.h).astype(np.float32)
        self.shape = self.V.shape   # (nz, ny, nx)

    def idx(self, P):
        P = np.atleast_2d(np.asarray(P, float))
        return np.stack([(P[:, 2] - self.o[2]) / self.h, (P[:, 1] - self.o[1]) / self.h, (P[:, 0] - self.o[0]) / self.h])

    def samp(self, P, vol=None, order=1):
        vol = self.Vs if vol is None else vol
        return ndi.map_coordinates(vol, self.idx(P), order=order, mode='nearest')

    def inside(self, P):
        i = self.idx(P)
        return ((i >= 0) & (i <= np.array(self.shape)[:, None] - 1)).all(0)


def basis(t):
    t = np.asarray(t, float) / np.linalg.norm(t)
    h = np.array([1.0, 0, 0]) if abs(t[0]) < 0.9 else np.array([0, 1.0, 0])
    u = np.cross(t, h); u /= np.linalg.norm(u)
    return u, np.cross(t, u)


ANG = np.linspace(0, 2 * np.pi, 16, endpoint=False)


def enclosure(V, p, t, R=2.5):
    """Fraction of 16 rays in the plane across t that meet bone within R mm."""
    u, v = basis(t)
    rad = np.arange(0.2, R + 1e-6, 0.2)
    dirs = np.cos(ANG)[:, None] * u + np.sin(ANG)[:, None] * v
    P = p + dirs[:, None, :] * rad[None, :, None]
    vals = V.samp(P.reshape(-1, 3)).reshape(len(ANG), len(rad))
    return float((vals >= BONE).any(axis=1).mean())


def snap(V, p, r=SNAP, kind='enclosed'):
    """Nearest lumen voxel to a tip: the lowest smoothed level within r mm among points still enclosed by bone
    (kind 'enclosed') or simply the lowest (kind 'soft' / 'air'). Returns (point, moved mm)."""
    g = np.arange(-r, r + 1e-6, V.h)
    X, Y, Z = np.meshgrid(g, g, g, indexing='ij')
    off = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    off = off[np.linalg.norm(off, axis=1) <= r]
    P = p + off
    lv = V.samp(P)
    d = np.linalg.norm(off, axis=1)
    score = lv + 30.0 * d                       # a pull toward the tip: stay near it unless the lumen is clearly elsewhere
    if kind == 'enclosed':
        score = score + 60.0 * (V.samp(P, V.dbone) > 1.6)   # not inside a lumen wider than the canal: prefer thin, bone-adjacent
    b = int(np.argmin(score))
    return P[b], float(d[b])


def cost_path(V, a, b, rc=2.2, kind='enclosed'):
    """Minimal-cost path a -> b through the volume, confined to a tube of radius rc mm round the segment.
    Cost 1 in lumen, up to 26 in bone ('enclosed' / 'soft': soft tissue is lumen; 'air': soft tissue also costs)."""
    a = np.asarray(a, float); b = np.asarray(b, float)
    pad = rc + 0.9
    lo = np.minimum(a, b) - pad; hi = np.maximum(a, b) + pad
    ilo = np.floor(V.idx(lo)[:, 0]).astype(int).clip(0); ihi = np.ceil(V.idx(hi)[:, 0]).astype(int)
    ihi = np.minimum(ihi, np.array(V.shape) - 1)
    sl = tuple(slice(int(ilo[k]), int(ihi[k]) + 1) for k in range(3))
    sub = V.Vs[sl]
    kk, jj, ii = np.meshgrid(*[np.arange(sl[k].start, sl[k].stop) for k in range(3)], indexing='ij')
    P = np.stack([ii * V.h + V.o[0], jj * V.h + V.o[1], kk * V.h + V.o[2]], -1)
    ab = b - a
    L2 = float(ab @ ab) or 1.0
    tt = np.clip(((P - a) @ ab) / L2, 0, 1)
    dist = np.linalg.norm(P - (a + tt[..., None] * ab), axis=-1)
    if kind == 'air':
        pen = np.clip((sub - 20.0) / 60.0, 0, 1) * 25.0
    else:
        pen = 1.0 / (1.0 + np.exp(-(sub - 150.0) / 10.0)) * 25.0
    cost = 1.0 + pen
    cost[dist > rc] = 1e4
    s0 = tuple(np.round(V.idx(a)[:, 0]).astype(int) - ilo); s1 = tuple(np.round(V.idx(b)[:, 0]).astype(int) - ilo)
    path, _ = route_through_array(cost, s0, s1, fully_connected=True, geometric=True)
    path = np.array(path)
    return np.stack([(path[:, 2] + sl[2].start) * V.h + V.o[0], (path[:, 1] + sl[1].start) * V.h + V.o[1],
                     (path[:, 0] + sl[0].start) * V.h + V.o[2]], 1)


def resample(P, step=0.4):
    P = np.asarray(P, float)
    if len(P) < 2:
        return P
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.r_[0, np.cumsum(seg)]
    n = max(2, int(round(s[-1] / step)) + 1)
    t = np.linspace(0, s[-1], n)
    return np.stack([np.interp(t, s, P[:, k]) for k in range(3)], 1)


def smooth(P, w=5):
    if len(P) < w + 2:
        return P
    k = np.ones(w) / w
    pad = w // 2
    Q = np.pad(P, ((pad, pad), (0, 0)), mode='edge')
    out = np.stack([np.convolve(Q[:, c], k, mode='valid') for c in range(3)], 1)
    out[0] = P[0]; out[-1] = P[-1]
    return out


def tangent(P, i):
    a = P[max(0, i - 2)]; b = P[min(len(P) - 1, i + 2)]
    t = b - a
    n = np.linalg.norm(t)
    return t / n if n else np.array([1.0, 0, 0])


def ring_contrast(V, p, t, r=1.3):
    """(ring mean - centre) of the smoothed level in the plane across t: a lumen narrower than the blur still
    reads as a dip against its bone walls."""
    u, v = basis(t)
    dirs = np.cos(ANG)[:, None] * u + np.sin(ANG)[:, None] * v
    ring = V.samp(p + dirs * r).mean()
    cen = V.samp(p[None] + (np.stack([u, v, -u, -v]) * 0.3)).min()
    return float(ring - cen), float(cen), float(ring)


def is_lumen(V, p, t, kind):
    lv = float(V.samp(p[None])[0])
    if kind == 'air':
        return lv < 70.0, lv, None
    e = enclosure(V, p, t)
    if kind == 'soft':
        return (lv < 150.0 and e >= 0.25), lv, e
    con, cen, ring = ring_contrast(V, p, t)
    # a lumen in bone: darker than the ring round it by >= 30 levels, the ring itself bone-like (>= 150), bone encloses it
    return (con >= 30.0 and ring >= 150.0 and cen < 175.0 and e >= 0.5), lv, e


def recenter(V, P, kind, search=0.6, step=0.15, fixed=None):
    """Shift each point within +-search mm across the path toward the lumen (kind 'enclosed'/'air': lowest
    smoothed level; 'soft': farthest from bone), with a pull to stay put, then smooth the shifts along the
    path so the line does not jitter. Points in `fixed` (bool mask) stay."""
    P = P.copy()
    sh = np.zeros_like(P)
    for i in range(1, len(P) - 1):
        t = tangent(P, i)
        u, v = basis(t)
        o = np.arange(-search, search + 1e-6, step)
        U, W = np.meshgrid(o, o)
        Q = P[i] + U.ravel()[:, None] * u + W.ravel()[:, None] * v
        if kind == 'soft':
            pen = -12.0 * V.samp(Q, V.dbone) + 8.0 * np.hypot(U.ravel(), W.ravel())
        else:
            pen = V.samp(Q) + 25.0 * np.hypot(U.ravel(), W.ravel())
        sh[i] = Q[int(np.argmin(pen))] - P[i]
    for c in range(3):
        sh[:, c] = np.convolve(np.pad(sh[:, c], 3, mode='edge'), np.ones(7) / 7, mode='valid')
    if fixed is not None:
        sh[fixed] = 0
    P[1:-1] += sh[1:-1]
    return P


def classify(V, P, kind, tips, tip_r, fixed_status=None):
    """Per-point status: 'labelled' within tip_r mm of a UW tip; else 'detected' in lumen; else 'inferred'."""
    st = []
    lev = np.zeros(len(P)); enc = np.zeros(len(P))
    for i in range(len(P)):
        t = tangent(P, i)
        ok, lv, e = is_lumen(V, P[i], t, kind)
        lev[i] = lv; enc[i] = e if e is not None else -1
        if fixed_status and fixed_status.get(i):
            st.append(fixed_status[i])
        elif len(tips) and np.min(np.linalg.norm(tips - P[i], axis=1)) <= tip_r:
            st.append('labelled')
        else:
            st.append('detected' if ok else 'inferred')
    return st, lev, enc


def fit_curve(V, tips, a, b, kind='enclosed', deg=2, fix_a=True, fix_b=True, step=0.4, tip_r=1.0, search=0.6,
              w_end=8.0, rule_ends=False, span_from_tips=False):
    """Smoothing curve fitted to the UW tips of a structure (the tips scatter by ~1.5 mm between planes, so
    interpolating them zigzags): parameter s = projection on a->b, a robust (Huber IRLS) polynomial of degree
    `deg` per coordinate, ends pulled to a and b when fixed. The curve is sampled every `step` mm, re-centred
    on the lumen within `search` mm, and each point is classified (labelled within `tip_r` of a tip, else
    detected / inferred by the lumen test). `rule_ends` marks the end points (a, b) 'inferred' (a rule
    point, not a tip). span_from_tips: use the tips' own extent along a->b instead of a..b."""
    tips = np.asarray(tips, float)
    a = np.asarray(a, float); b = np.asarray(b, float)
    d = b - a; Ld = np.linalg.norm(d); d = d / Ld
    s = ((tips - a) @ d) / Ld
    s0, s1 = (min(0.0, s.min()), max(1.0, s.max())) if not span_from_tips else (s.min(), s.max())
    if span_from_tips:
        pass
    sa, sb = (0.0 if fix_a else s0), (1.0 if fix_b else s1)
    if span_from_tips:
        sa, sb = s.min(), s.max()
    X = np.concatenate([s, [0.0] if fix_a else [], [1.0] if fix_b else []])
    wend = np.concatenate([np.ones(len(s)), [w_end] if fix_a else [], [w_end] if fix_b else []])
    Y = np.concatenate([tips, a[None] if fix_a else np.zeros((0, 3)), b[None] if fix_b else np.zeros((0, 3))])
    dg = int(min(deg, max(1, len(X) - 1)))
    coef = []
    for c in range(3):
        w = wend.copy()
        for _ in range(6):
            cf = np.polyfit(X, Y[:, c], dg, w=np.sqrt(w))
            r = Y[:, c] - np.polyval(cf, X)
            sc = max(1.4826 * np.median(np.abs(r)), 0.4)
            w = wend / np.maximum(1.0, np.abs(r) / (1.5 * sc))
        coef.append(cf)
    ss = np.linspace(sa, sb, 400)
    C0 = np.stack([np.polyval(cf, ss) for cf in coef], 1)
    P = resample(C0, step)
    if fix_a:
        P[0] = a
    if fix_b:
        P[-1] = b
    fixed = np.zeros(len(P), bool)
    fixed[0] = fix_a; fixed[-1] = fix_b
    P = recenter(V, P, kind, search=search, fixed=fixed)
    fs = {}
    if rule_ends:
        fs = {0: 'inferred', len(P) - 1: 'inferred'}
    st, lev, enc = classify(V, P, kind, tips, tip_r, fs)
    return {'pts': P, 'status': st, 'lumen_level': lev, 'enclosure': enc}


def trace(V, anchors, kind='enclosed', rc=2.2, step=0.4, snap_anchors=True, mode='spline'):
    """anchors: ordered list of dicts {p, src, tip, fixed}. Anchors that are UW tips (tip=True) are snapped to
    the nearest lumen voxel within SNAP mm (unless fixed) and are `labelled`; rule anchors (tip=False) are
    `inferred`. mode 'spline' (default): a smoothing curve through the anchors (the CT is too blurred and the
    slices too thick for a free path to beat the tips), then re-centred on the lumen within 0.6 mm and
    classified point by point. mode 'path': minimal-cost path between anchors (used where the lumen is wide)."""
    anc = []
    for a in anchors:
        p = np.asarray(a['p'], float)
        mv = 0.0
        if a.get('tip', True) and snap_anchors and not a.get('fixed'):
            p, mv = snap(V, p, kind=kind)
        anc.append({'p': p, 'tip': a.get('tip', True), 'src': a.get('src', ''), 'snap_mm': round(mv, 2)})
    pts = []; kindp = []
    for i, a in enumerate(anc):
        if i == 0:
            pts.append(a['p']); kindp.append(i); continue
        if mode == 'path':
            seg = resample(cost_path(V, anc[i - 1]['p'], a['p'], rc=rc, kind=kind), step)
        else:
            seg = resample(np.array([anc[i - 1]['p'], a['p']]), step)
        for q in seg[1:-1]:
            pts.append(q); kindp.append(-1)
        pts.append(a['p']); kindp.append(i)
    P = np.array(pts)
    isanc = np.array([k >= 0 for k in kindp])
    # smooth the polyline (anchors stay: they are re-imposed after smoothing)
    Ps = smooth(smooth(P, 7), 7)
    Ps[isanc] = P[isanc]
    Ps = smooth(Ps, 3); Ps[isanc] = P[isanc]
    if mode == 'spline':
        R = recenter(V, Ps, kind)
        R[isanc] = Ps[isanc]
        Ps = R
    P = Ps
    st = []
    lev = np.zeros(len(P)); enc = np.zeros(len(P))
    for i in range(len(P)):
        t = tangent(P, i)
        ok, lv, e = is_lumen(V, P[i], t, kind)
        lev[i] = lv; enc[i] = e if e is not None else -1
        if kindp[i] >= 0:
            st.append('labelled' if anc[kindp[i]]['tip'] else 'inferred')
        else:
            st.append('detected' if ok else 'inferred')
    return {'pts': P, 'status': st, 'lumen_level': lev, 'enclosure': enc, 'anchors': anc}


def radius_of(V, P, default, lo, hi, status):
    """Lumen radius: distance to bone at detected points (clipped to [lo, hi]); the default elsewhere."""
    d = V.samp(P, V.dbone)
    r = np.where(np.array(status) == 'detected', np.clip(d, lo, hi), default)
    return r
