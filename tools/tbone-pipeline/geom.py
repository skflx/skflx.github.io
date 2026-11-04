"""Geometry shared by scale.py, landmarks.py and sweeps.py: UW tips -> axial voxel space -> OLSB mm.

Axial voxel space = (x, y, n): image column, image row, fractional 0-based slice index of the axial stack.
OLSB frame (mm; a right ear): x lateral (image left), y anterior (image up), z superior (lower slice index);
origin = centre of the oval window, found by scale.py and stored in work/frame.json.
"""
import json, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import vocab  # noqa: E402

REG = C.ssb('register')
EYE = (np.array([1., 0, 0]), np.array([0, 1., 0]), np.array([0, 0, 1.]))
PNAMES = ['ox', 'oy', 'oz', 'rx_deg', 'ry_deg', 'rz_deg', 's', 'wx', 'wy', 'wz', 'dz']


def slices():
    return {p: json.load(open(os.path.join(C.WORK, f'slices-{p}.json'))) for p in C.PLANES}


def reg_params(plane):
    d = json.load(open(os.path.join(C.WORK, f'registration-{plane}.json')))
    return [d['params'][k] for k in PNAMES]


def to_axial(plane, u, v, k0, params=None):
    """Plane pixel (u, v) on 0-based slice k0 -> axial (x, y, n)."""
    if plane == 'axial':
        return float(u), float(v), float(k0)
    p = params or reg_params(plane)
    P, dz = REG.points('x', p, k0, np.array([[u]], float), np.array([[v]], float), EYE)
    return float(P[0][0, 0]), float(P[1][0, 0]), float(P[2][0, 0] / dz)


def grouped_tips(sl=None):
    """Every distinct (plane, canon id, tip pixel) once. UW keeps a label on a run of slices; a run with the
    same tip pixel is one tip seen on slices n_first..n_last (a vertical structure such as the petrous ICA
    shows as the same pixel on many slices). Returns dicts: plane, text, canon, g, tip (u, v),
    n_first, n_last (1-based UW slice numbers), conf, n_tips_on_label."""
    sl = sl or slices()
    out = []
    for plane, rows in sl.items():
        open_runs = {}
        for r in rows:
            seen = set()
            for t in r['labels']:
                cid, gid = vocab.canon(t['text'])
                for tip in t['tips']:
                    key = (cid, t['text'], tuple(tip))
                    seen.add(key)
                    if key in open_runs and open_runs[key]['n_last'] == r['n'] - 1:
                        open_runs[key]['n_last'] = r['n']
                    else:
                        rec = {'plane': plane, 'text': t['text'], 'canon': cid, 'g': gid, 'tip': list(tip),
                               'n_first': r['n'], 'n_last': r['n'], 'conf': t['conf'], 'n_tips_on_label': len(t['tips'])}
                        open_runs[key] = rec
                        out.append(rec)
    return out


def frame():
    return json.load(open(os.path.join(C.WORK, 'frame.json')))


def px_to_mm(x, y, n, fr=None):
    fr = fr or frame()
    ox, oy, on = fr['origin_px']
    s, dz = fr['s_mm_per_px'], fr['dz_mm']
    return [(ox - x) * s, (oy - y) * s, (on - n) * dz]


def mm_to_px(X, Y, Z, fr=None):
    fr = fr or frame()
    ox, oy, on = fr['origin_px']
    s, dz = fr['s_mm_per_px'], fr['dz_mm']
    return ox - X / s, oy - Y / s, on - Z / dz


def tip_axial(rec, params_cache={}):
    """Axial (x, y, n) of a grouped tip, at the middle of its slice run."""
    plane = rec['plane']
    if plane not in params_cache and plane != 'axial':
        params_cache[plane] = reg_params(plane)
    k0 = (rec['n_first'] + rec['n_last']) / 2 - 1
    return to_axial(plane, rec['tip'][0], rec['tip'][1], k0, params_cache.get(plane))
