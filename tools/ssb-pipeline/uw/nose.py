"""Nostril fulcrum landmarks from the UNMASKED axial stack (E1b; ssb-roadmap.md).

    .venv/bin/python tools/ssb-pipeline/uw/nose.py [--write]

ssb/ct/ keeps the face masked (ST6 unmasks it), so this resamples the raw display volume in
memory. Per side, on axial levels S 0..10, a row (constant A) holds a vestibule lumen run when
the run is air (0 < display < 78), lies on that side of the midline, and has tissue (display
>= 78) within 12 mm of both its medial and lateral ends on the same row (columella and ala).
The alar-rim band is the 3 mm of S where the lumen area is largest;
lm.naris.<side> is the centroid of the lumen voxels in that band. Without --write it only prints.
"""
import json, os, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import load  # noqa: E402
import specimen as sp  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
GEO = os.path.join(REPO, 'ssb', 'geometry')
BOX = {'r': (-30.0, 30.0), 'a': (-30.0, 45.0), 's': (-20.0, 40.0)}
STEP = 0.5
AIR = sp.AIR                    # display < 78: air; >= 78: tissue
A_RANGE, S_RANGE = (-2.0, 16.0), (0.0, 10.0)
TISSUE_WITHIN_MM = 12.0
BAND_MM = 3.0


def lumen_mask(D, side):
    """Boolean (k, j, i) mask of vestibule-lumen voxels for side (+1 right, -1 left)."""
    r, a, s = sp.grid_axes(BOX, STEP)
    reach = int(TISSUE_WITHIN_MM / STEP)
    out = np.zeros(D.shape, bool)
    for k in np.where((s >= S_RANGE[0]) & (s <= S_RANGE[1]))[0]:
        for j in np.where((a >= A_RANGE[0]) & (a <= A_RANGE[1]))[0]:
            row = D[k, j]
            air = (row > 0) & (row < AIR)
            lab, n = ndi.label(air)
            for m in range(1, n + 1):
                idx = np.where(lab == m)[0]
                lo, hi = idx[0], idx[-1]
                if side * r[(lo + hi) // 2] <= 0:
                    continue
                # medial/lateral = toward/away from the midline on this side
                med, lat = (lo, hi) if side < 0 else (hi, lo)
                step = -1 if side > 0 else 1        # medial direction in index
                ok = True
                for end, direction in ((med, step), (lat, -step)):
                    rng = range(end + direction, end + direction * (reach + 1), direction)
                    ok &= any(0 <= q < len(row) and row[q] >= AIR for q in rng)
                if ok:
                    out[k, j, idx] = True
    return out


def locate(D, side):
    r, a, s = sp.grid_axes(BOX, STEP)
    M = lumen_mask(D, side)
    # keep the largest 3D component (the vestibule), not stray row artefacts
    lab, n = ndi.label(M)
    if n == 0:
        return None
    sizes = ndi.sum(M, lab, range(1, n + 1))
    M = lab == (1 + int(np.argmax(sizes)))
    area = M.sum(axis=(1, 2)) * STEP * STEP
    w = int(round(BAND_MM / STEP))
    best, k0 = -1.0, 0
    for k in range(len(s) - w + 1):
        t = area[k:k + w].sum()
        if t > best:
            best, k0 = t, k
    B = np.zeros_like(M)
    B[k0:k0 + w] = M[k0:k0 + w]
    kk, jj, ii = np.nonzero(B)
    p = [float(r[ii].mean()), float(a[jj].mean()), float(s[kk].mean())]
    return {'p': [round(v, 2) for v in p], 'band_s': [float(s[k0]), float(s[k0 + w - 1])],
            'lumen_area_mm2': round(float(area[k0:k0 + w].mean()), 1),
            'n_voxels': int(B.sum())}


def main():
    V = load('axial')
    A, dz, _ = sp.frame()
    D = sp.resample(V, A, dz, box=BOX, step=STEP)
    found = {}
    for side, tag in ((1, 'R'), (-1, 'L')):
        f = locate(D, side)
        if f is None:
            sys.exit('no enclosed lumen on side ' + tag)
        r, a, s = f['p']
        k, j, i = (int(round(v)) for v in sp.ras_to_index(f['p'], BOX, STEP))
        f['in_air'] = bool(0 < D[k, j, i] < AIR)
        found[tag] = f
        print(tag, f)
    if '--write' not in sys.argv:
        return
    lm = json.load(open(os.path.join(GEO, 'landmarks.json')))
    meta = json.load(open(os.path.join(GEO, 'landmarks.meta.json')))
    for tag, f in found.items():
        key = 'lm.naris.' + tag
        old = meta['landmarks'].get(key, {})
        entry = {'method': ('vestibule lumen of the unmasked axial stack: air (0 < display < 78) on this side of the '
                            'midline with tissue (>= 78) within 12 mm medially and laterally on the same row, A -2..16, '
                            'S 0..10; centroid of the lumen voxels in the 3 mm S band of largest lumen area '
                            '(tools/ssb-pipeline/uw/nose.py, E1b)'),
                 'band_s_mm': f['band_s'], 'lumen_area_mm2': f['lumen_area_mm2'], 'n_voxels': f['n_voxels'],
                 'superseded': {'value': lm[key], 'meta': old,
                                'reason': 'E1: internal-valve level; left point inside the caudal septum - verification 2026-10-03'}}
        lm[key] = f['p']
        meta['landmarks'][key] = entry
    json.dump(lm, open(os.path.join(GEO, 'landmarks.json'), 'w'), indent=1)
    json.dump(meta, open(os.path.join(GEO, 'landmarks.meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
