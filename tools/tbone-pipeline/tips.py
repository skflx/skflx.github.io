"""Arrow tips by arrowhead, not by shaft ends (WP T1; replaces the shaft-end rule of the SSB extractor
for this atlas).

Why: the temporal-bone slices carry many arrows that converge on the middle ear and touch each other, so
connected components merge and the SSB rule (two most distant skeleton ends of a component) returned
points part-way along a shaft, tens of pixels from the arrowhead (checked by eye on axial slice 39).

Method.
  1. A = white annotation pixels (SSB annotation_mask) minus the text boxes.
  2. Arrowheads = what survives a morphological opening of A with a disc of radius 3: the shafts are
     ~3 px wide and the glyph strokes thinner, the filled triangular heads are ~9 px wide.
  3. Per head, the principal axis; the narrow end is the tip, the wide end the base. The tip is the
     extreme head pixel along the axis, extended along the axis while A stays on (<= 4 px).
  4. The shaft runs from the base backwards along the axis. For each text box: perpendicular distance
     of the box (grown by 8 px) from that ray <= 6 px and A on along >= 90 % of the ray up to it
     (other arrows crossing the shaft are tolerated since they are also A). The nearest such box owns the head.
Heads that no box claims are returned as orphans (counted; never silently attached).
"""
import numpy as np
from scipy import ndimage as ndi
from skimage.morphology import disk


def heads(A):
    op = ndi.binary_opening(A, structure=disk(2))
    lab, k = ndi.label(op, structure=np.ones((3, 3)))
    out = []
    for i in range(1, k + 1):
        ys, xs = np.nonzero(lab == i)
        if len(xs) < 10 or len(xs) > 220:
            continue
        pts = np.c_[xs, ys].astype(float)
        c = pts.mean(0)
        w, v = np.linalg.eigh(np.cov((pts - c).T))
        ax = v[:, 1]                      # major axis
        pr = (pts - c) @ ax
        perp = np.abs((pts - c) @ v[:, 0])
        lo = pr < np.percentile(pr, 30); hi = pr > np.percentile(pr, 70)
        wl, wh = perp[lo].mean(), perp[hi].mean()
        d = ax if wh < wl else -ax        # unit vector from base to tip (tip = narrow end)
        tipp = pts[np.argmax((pts - c) @ d)]
        # grow the tip along d while A stays on
        t = tipp.copy()
        for _ in range(4):
            q = t + d
            xi, yi = int(round(q[0])), int(round(q[1]))
            if 0 <= yi < A.shape[0] and 0 <= xi < A.shape[1] and A[yi, xi]:
                t = q
            else:
                break
        out.append({'tip': t, 'dir': d, 'n': int(len(xs)), 'elong': float(np.sqrt(w[1] / max(w[0], 1e-6)))})
    return out


def ray_run(A3, tip, u, maxlen=450, gap=3):
    """Length of the run of mask pixels from the tip along unit vector u (gaps <= `gap` px bridged); also the
    end point of that run."""
    last, g = 0, 0
    for sstep in range(3, maxlen):
        q = tip + u * sstep
        xi, yi = int(round(q[0])), int(round(q[1]))
        if not (0 <= yi < A3.shape[0] and 0 <= xi < A3.shape[1]):
            break
        if A3[yi, xi]:
            last, g = sstep, 0
        else:
            g += 1
            if g > gap:
                break
    return last


def assign(A, boxes, grow=10, window=80):
    """-> (list of tips per box index, orphans). A is the arrow mask (text already removed).
    A shaft is a straight run of the mask from the tip that ends at its own label. Per head, rays are cast
    backwards from the tip over +-`window` degrees about the head's axis (the axis of a head touching other
    arrows is unreliable, so the shaft itself decides); the longest run whose end lies within `grow` px of a
    text box claims the head for that box. A head with no such run is an orphan (returned, never attached)."""
    A3 = ndi.binary_dilation(A, iterations=1)
    per = [[] for _ in boxes]
    orphans = []
    for h in heads(A):
        tip, d = h['tip'], h['dir']
        best = None
        base = np.degrees(np.arctan2(-d[1], -d[0]))
        for th in range(-window, window + 1):
            a = np.radians(base + th)
            u = np.array([np.cos(a), np.sin(a)])
            r = ray_run(A3, tip, u)
            if r < 12:
                continue
            E = tip + u * r
            for bi, (x0, y0, x1, y1) in enumerate(boxes):
                dx = max(x0 - E[0], 0, E[0] - x1); dy = max(y0 - E[1], 0, E[1] - y1)
                dist = np.hypot(dx, dy)
                if dist <= grow:
                    sc = r - 0.5 * abs(th) - 3.0 * dist
                    if best is None or sc > best[0]:
                        best = (sc, bi)
        if best:
            per[best[1]].append([int(round(tip[0])), int(round(tip[1]))])
        else:
            orphans.append([int(round(tip[0])), int(round(tip[1]))])
    return per, orphans
