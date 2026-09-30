"""UW arrow tips -> 3D, cross-plane agreement, and the proposed RAS frame (stage A).

    .venv/bin/python tools/ssb-pipeline/uw/labels3d.py     # after volume.py, register.py, scale.py

Writes the "labels" and "frame" sections of registration.json.

Axial tips map directly (x, y, Z = (n-1)*dz); sagittal tips through the fitted sagittal model.
Coronal tips are NOT mapped: register.py shows the coronal stack is not a reslice of this
volume (specimen_identity), so its arrow tips live in another head.

Agreement: for every tip of a term in one plane, the distance to the nearest tip of the same
term in the other plane, same side of the midsagittal plane unless the term is midline.
An arrow tip is one point chosen inside an extended structure (README of the crawl), so for a
sinus or a bone this measures label habit as much as geometry; point-like structures
(foramina, canals, sella) are the fair test and are reported separately.

Frame (docs/ssb.md section 4): midsagittal plane by reflection symmetry of the bone volume,
checked against the midline labels; origin anterior nasal spine (image search near the MSP at
the nasal floor); axial plane parallel to Frankfort horizontal through both porions (roof of
the bony external canal) and both orbitales (lowest point of the infraorbital margin).
Laterality: the axial images are taken as radiological (image left = patient right). No UW
label names a side, so this rests on display convention and on the hover map of the AP scout
(sagittal img001 sits at the scout's viewer-left) agreeing with the registration.
"""
import ast, json, os, sys
from collections import defaultdict
import numpy as np
from scipy import ndimage as ndi, optimize
from scipy.spatial.transform import Rotation

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import load, boneness, read_results, write_results  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
MIDLINE = {'nasal septum', 'crista galli', 'vomer', 'sella', 'dorsum sella', 'clivus', 'nasopalatine foramen',
           'sphenoid rostrum', 'perpendicular plate'}
POINTLIKE = {'greater palatine foramen', 'foramen rotundum', 'foramen ovale', 'vidian canal', 'sella', 'dorsum sella',
             'crista galli', 'ossicles', 'cochlea', 'sphenoid sinus ostium', 'inferior orbital fissure',
             'superior orbital fissure', 'nasolacrimal duct', 'sphenopalatine foramen', 'optic canal',
             'pterygopalatine fossa', 'internal auditory canal'}


def load_canon():
    """relate.py's canon() without running relate.py's analysis (its module body writes files)."""
    path = os.path.join(HERE, 'relate.py')
    tree = ast.parse(open(path).read())
    body = []
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', None) == 'votes' for t in node.targets):
            break
        body.append(node)
    ns = {'__file__': path}
    exec(compile(ast.Module(body=body, type_ignores=[]), path, 'exec'), ns)
    return ns['canon']


def sagittal_frame(reg):
    p = reg['sagittal']['params']
    R = Rotation.from_rotvec(np.deg2rad([p['rx_deg'], p['ry_deg'], p['rz_deg']])).as_matrix()
    O = np.array([p['ox'], p['oy'], p['oz']])
    e1 = p['s'] * (R @ np.array([0, 1., 0])); e2 = p['s'] * (R @ np.array([0, 0, 1.]))
    w = np.array([p['wx'], p['wy'], p['wz']])
    return O, e1, e2, w, p['dz']


# ---------------------------------------------------------------- midsagittal plane
def symmetry_plane(dz):
    """Plane x = x0 rotated by (yaw about Z, roll about y) maximising the NCC between the bone
    volume and its reflection."""
    B = ndi.gaussian_filter(boneness(load('axial')), (0.7, 1.5, 1.5))
    N, H, W = B.shape
    n_, y_, x_ = np.mgrid[0:N:3, 0:H:4, 0:W:4].astype(np.float32)
    P = np.stack([x_, y_, n_ * dz]).reshape(3, -1)
    v0 = ndi.map_coordinates(B, [P[2] / dz, P[1], P[0]], order=1)
    keep = v0 > 0.05
    P, v0 = P[:, keep], v0[keep]
    c = np.array([0, H / 2, N * dz / 2])

    def normal(p):
        a, b = np.deg2rad(p[1]), np.deg2rad(p[2])
        return np.array([np.cos(a) * np.cos(b), np.sin(a) * np.cos(b), np.sin(b)])

    def score(p):
        nrm = normal(p); c[0] = p[0]
        d = (P - c[:, None]).T @ nrm
        Q = P - 2 * d[None, :] * nrm[:, None]
        v = ndi.map_coordinates(B, [Q[2] / dz, Q[1], Q[0]], order=1, cval=0)
        a = v0 - v0.mean(); b = v - v.mean()
        return float((a * b).sum() / np.sqrt((a * a).sum() * (b * b).sum()))
    x0 = max(range(W // 2 - 16, W // 2 + 17, 4), key=lambda x: score([x, 0, 0]))
    r = optimize.minimize(lambda p: -score(p), [x0, 0, 0], method='Powell', options={'xtol': 1e-3, 'ftol': 1e-6})
    c[0] = r.x[0]
    return {'point': c.tolist(), 'normal': normal(r.x).tolist(), 'yaw_deg': round(float(r.x[1]), 3),
            'roll_deg': round(float(r.x[2]), 3), 'reflection_ncc': round(-float(r.fun), 4)}


def plane_dist(P, plane):
    return (np.asarray(P) - np.array(plane['point'])) @ np.array(plane['normal'])


# ---------------------------------------------------------------- landmarks
def find_ans(plane, dz, thr=0.15):
    """Anterior-most bone within 7 px of the MSP between axial slices 126 and 146 (the nasal
    floor band above the alveolus, located on the midsagittal reslice)."""
    B = boneness(load('axial'))
    nrm, c = np.array(plane['normal']), np.array(plane['point'])
    best = None
    for n in range(125, 146):
        g = ndi.gaussian_filter(B[n], 0.7)
        for y in range(30, 120):
            xm = c[0] - ((y - c[1]) * nrm[1] + (n * dz - c[2]) * nrm[2]) / nrm[0]
            xs = np.arange(int(xm) - 7, int(xm) + 8)
            if (g[y, xs] > thr).any():
                if best is None or y < best[1]:
                    best = (n, y, int(xs[np.argmax(g[y, xs])]))
                break
    n, y, x = best
    return [float(x), float(y), float(n * dz)]


def find_porion(dz):
    """Roof of each bony external acoustic canal: first slice (from above) where the canal
    ROI holds air, interpolated between slices on the air-pixel count; x, y = air centroid a
    few slices lower. ROIs placed on the lateral bony canal of each side (axial px)."""
    A = load('axial').astype(np.float32)
    out = {}
    for side, (ys, xs) in (('image_left', (slice(300, 330), slice(70, 105))), ('image_right', (slice(290, 322), slice(400, 435)))):
        counts = [int((ndi.gaussian_filter(A[n], 0.8)[ys, xs] < 80).sum()) for n in range(108, 126)]
        # skip air present from the top of the range (mastoid cells inside the ROI above the canal)
        start = next(i for i in range(len(counts)) if counts[i] <= 5)
        i = next(i for i in range(start, len(counts)) if counts[i] >= 40)
        a, b = counts[i - 1], counts[i]
        frac = (40 - a) / max(1, b - a)
        n_roof = 108 + i - 1 + frac
        m = ndi.gaussian_filter(A[108 + i + 1], 0.8)[ys, xs] < 80
        yy, xx = np.nonzero(m)
        out[side] = [float(xs.start + xx.mean()), float(ys.start + yy.mean()), float(n_roof * dz)]
    return out


def find_orbitale(dz, centres):
    """Per sagittal plane across each orbit: rim corner = most anterior-superior bone point
    below the globe (min y + Z); orbitale = the lowest corner (max Z), taken as the middle of
    the plateau within 0.5 px of the maximum."""
    B = ndi.gaussian_filter(boneness(load('axial')), (0.5, 0.8, 0.8))
    out = {}
    for side, (xc, yc, Zc) in centres.items():
        rows = []
        for x in np.arange(xc - 30, xc + 31, 2.0):
            yy, ZZ = np.mgrid[yc - 70:yc + 10:0.5, Zc + 15:Zc + 90:0.5]
            v = ndi.map_coordinates(B, [ZZ / dz, yy, np.full_like(yy, x)], order=1)
            s = np.where(v > 0.35, yy + ZZ, np.inf)
            if np.isfinite(s).any():
                i = np.unravel_index(np.argmin(s), s.shape)
                rows.append((x, yy[i], ZZ[i]))
        rows = np.array(rows)
        top = rows[rows[:, 2] >= rows[:, 2].max() - 0.5]
        out[side] = [float(np.median(top[:, 0])), float(np.median(top[:, 1])), float(rows[:, 2].max())]
    return out


def fit_plane(P):
    P = np.asarray(P, float)
    c = P.mean(0)
    u, s, vt = np.linalg.svd(P - c)
    nrm = vt[-1]
    return c, nrm, (P - c) @ nrm


# ---------------------------------------------------------------- main
def main():
    res = read_results()
    reg, scale = res['registration'], res['scale']
    mm = scale['adopted_mm_per_px']
    O, e1, e2, w, dz = sagittal_frame(reg)
    canon = load_canon()
    S = json.load(open(os.path.join(REPO, 'ssb/reference/uw-sinusanatomy2/slices.json')))

    pts = defaultdict(lambda: defaultdict(list))   # term -> plane -> [(xyz axial px), ...]
    n_coronal = 0
    for plane, rows in S.items():
        for r in rows:
            for t in r['labels']:
                c = canon(t['text'], t['conf'])
                if not c:
                    continue
                for (u, v) in t['tips']:
                    if plane == 'axial':
                        pts[c]['axial'].append([u, v, (r['n'] - 1) * dz])
                    elif plane == 'sagittal':
                        pts[c]['sagittal'].append((O + u * e1 + v * e2 + (r['n'] - 1) * w).tolist())
                    else:
                        n_coronal += 1

    msp = symmetry_plane(dz)
    mids = [p for t in MIDLINE for pl in ('axial', 'sagittal') for p in pts[t][pl]]
    md = plane_dist(mids, msp) * mm

    agree = {}
    allpairs, pointpairs = [], []
    for term, by in pts.items():
        a, s = np.array(by['axial']), np.array(by['sagittal'])
        if not len(a) or not len(s):
            continue
        ds = []
        for P, Q in ((a, s), (s, a)):
            for p in P:
                q = Q
                if term not in MIDLINE:
                    side = np.sign(plane_dist(p, msp))
                    q = Q[np.sign(plane_dist(Q, msp)) == side]
                if len(q):
                    ds.append(float(np.min(np.linalg.norm(q - p, axis=1))) * mm)
        if not ds:
            continue
        agree[term] = {'n_axial': len(a), 'n_sagittal': len(s), 'median_mm': round(float(np.median(ds)), 2),
                       'p90_mm': round(float(np.percentile(ds, 90)), 2), 'pointlike': term in POINTLIKE}
        allpairs += ds
        if term in POINTLIKE:
            pointpairs += ds

    # landmarks and frame
    ans = find_ans(msp, dz)
    por = find_porion(dz)
    cen = {'image_left': (164.6, 108.3, 74 * dz), 'image_right': (334.6, 99.8, 76 * dz)}
    orb = find_orbitale(dz, cen)
    fh_pts = [por['image_left'], por['image_right'], orb['image_left'], orb['image_right']]
    fh_c, fh_n, fh_res = fit_plane(np.array(fh_pts))
    # raw patient-frame axes from axial pixels (radiological): +x image = patient left, +y = posterior, +Z = inferior
    flip = np.diag([-1.0, -1.0, -1.0])
    Rax = flip @ np.array(msp['normal']); Rax *= np.sign(Rax[0]) if Rax[0] else 1   # points to patient right
    Sax = flip @ fh_n; Sax *= np.sign(Sax[2])                                        # points superior
    Sax -= (Sax @ Rax) * Rax; Sax /= np.linalg.norm(Sax)
    Aax = np.cross(Sax, Rax)
    M = np.vstack([Rax, Aax, Sax]) @ flip * mm            # axial px -> RAS mm (rotation * sign flip * scale)
    ans_on_msp = np.array(ans) - plane_dist(ans, msp) * np.array(msp['normal'])
    t = -M @ ans_on_msp
    affine = np.eye(4); affine[:3, :3] = M; affine[:3, 3] = t

    def ras(p):
        return (M @ np.asarray(p, float) + t).round(2).tolist()

    fh_angle = float(np.degrees(np.arccos(abs(fh_n[2]))))
    frame = {
        'units_in': 'axial px (x = column, y = row, Z = (slice-1)*dz), dz = %.5f' % dz,
        'mm_per_px': mm,
        'axial_px_to_ras_mm_affine': affine.round(6).tolist(),
        'laterality': 'radiological assumed (image left = patient right); no lateralized UW label exists to verify it',
        'midsagittal_plane': {**msp, 'midline_label_tips': len(mids),
                              'midline_tip_distance_mm_median_abs': round(float(np.median(np.abs(md))), 2),
                              'midline_tip_distance_mm_p90_abs': round(float(np.percentile(np.abs(md), 90)), 2)},
        'landmarks_axial_px': {'ans': ans, 'porion': por, 'orbitale': orb},
        'landmarks_ras_mm': {'ans': ras(ans), 'ans_off_msp_mm': round(float(plane_dist(ans, msp)) * mm, 2),
                             **{f'porion_{k}': ras(v) for k, v in por.items()},
                             **{f'orbitale_{k}': ras(v) for k, v in orb.items()}},
        'frankfort': {'fit_residuals_mm': (fh_res * mm).round(2).tolist(),
                      'tilt_from_axial_deg': round(fh_angle, 2),
                      'note': '4-point least-squares plane through both porions and both orbitales'},
        'substitutes': 'none needed: ANS, porion and orbitale were all identifiable; each is an image search with '
                       'about +/-1 slice (0.6 mm) vertical and +/-3 px in-plane uncertainty',
    }
    labels = {
        'mapped': {'axial': sum(len(v['axial']) for v in pts.values()), 'sagittal': sum(len(v['sagittal']) for v in pts.values())},
        'coronal_tips_not_mapped': n_coronal,
        'axial_vs_sagittal': {'terms': len(agree), 'median_mm_all_tips': round(float(np.median(allpairs)), 2),
                              'median_mm_pointlike': round(float(np.median(pointpairs)), 2) if pointpairs else None,
                              'per_term': dict(sorted(agree.items(), key=lambda kv: kv[1]['median_mm']))},
        'points_ras_mm': {term: {pl: [ras(p) for p in v] for pl, v in by.items() if v} for term, by in sorted(pts.items())},
    }
    print(json.dumps({k: v for k, v in frame.items() if k != 'axial_px_to_ras_mm_affine'}, indent=1))
    print('agreement', labels['axial_vs_sagittal']['terms'], labels['axial_vs_sagittal']['median_mm_all_tips'],
          labels['axial_vs_sagittal']['median_mm_pointlike'])
    for k, v in labels['axial_vs_sagittal']['per_term'].items():
        print(' ', k, v)
    write_results('frame', frame)
    write_results('labels', labels)


if __name__ == '__main__':
    main()
