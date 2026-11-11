"""Place an OpenEar segmentation in OLSB's frame (WP B4; spec plans/2026-11-04-tbone-sources.md B-3; issue #301).

    python3 tools/tbone-pipeline/frame.py <seg.nrrd> --ct <ct.nrrd> --ref tools/tbone-pipeline/incoming/olsb-centroids.json \
        --source <id> --out <dir inside tools/tbone-pipeline/incoming/>

The reference file is OLSB's voxel-model centroids, made once by:
    node tools/tbone-pipeline/olsb-centroids.mjs . > tools/tbone-pipeline/incoming/olsb-centroids.json

The rotation is a Kabsch fit (proper rotation, no scale) on the centroids of every segment whose id is also in the
reference file; the origin is the stapes footplate, and the Kabsch translation is discarded.

Writes <out>/frame.json (matrix RAS mm -> OLSB mm, residuals, Bone bounding box, conditioning numbers of the fit:
singular values, unconstrained determinant, leave-one-out rotation angles). Numbers and fixed rule strings only:
segment names are printed for local reading and never stored (ingest.py's rule, B-6).
numpy and scipy only.
"""
import argparse, json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ingest as I  # noqa: E402

LANDMARKS = os.path.join(HERE, '..', '..', 'tbone', 'geometry', 'landmarks.json')
SEED = 0
SAMPLE = 200_000
FOOTPLATE_RADIUS_MM = 0.5
COCHLEA = ('Scala Tympani', 'Scala Vestibuli')           # union -> glossary id `cochlea`
# (segment, glossary id) for the residual table; every row whose id is in the reference drives the rotation
ROWS = [('Malleus', 'malleus'), ('Incus', 'incus'), ('Stapes', 'stapes'), ('cochlea', 'cochlea'),
        ('Tympanic Membrane', 'tm'), ('External Auditory Canal', 'eac'), ('Carotis Interna', 'ica'),
        ('Facial Nerve', 'fn'), ('Chorda Tympani', 'chorda'), ('Cochleovestibular nerve', 'cn8')]
ORIGIN_RULE = ('stapes footplate: first PCA axis of Stapes voxel centres (mm); the footplate is the axis end farther from '
               'the Incus centroid; origin = centroid of Stapes voxels within 0.5 mm of that end')
ROTATION_RULE = ('Kabsch on centred centroids of every segment whose id is in olsb-centroids (ROWS ids); rotation only '
                 '(det +1); no scale; the Kabsch translation is discarded')
LIMITS = ("rotation is fitted to every shared structure of OLSB's procedural model, so residuals against OLSB understate "
          "disagreement; one specimen")
MIN_SHARED = 3


def _flip(geo):
    """True for LPS (negate x and y to reach RAS); RAS is used as is; the other two spaces are refused."""
    if geo['space'] == 'left-posterior-superior':
        return True
    if geo['space'] == 'right-anterior-superior':
        return False
    raise ValueError(f"space {geo['space']} is not LPS or RAS; refused")


def grid_to_ras(geo, idx):
    """NRRD indices (N,3) -> RAS mm: origin + sum_i index_i * spacing_i * direction_i, then LPS -> RAS."""
    flip = _flip(geo)
    d = np.asarray(geo['direction'], float)
    s = np.asarray(geo['spacing_mm'], float)
    p = np.asarray(geo['origin'], float) + (np.asarray(idx, float) * s) @ d
    if flip:
        p[:, :2] *= -1
    return p


def ras_to_grid(geo, p):
    """RAS mm (N,3) -> fractional NRRD indices of the grid (inverse of grid_to_ras)."""
    flip = _flip(geo)
    p = np.array(p, float)
    if flip:
        p[:, :2] *= -1
    m = np.asarray(geo['spacing_mm'], float)[:, None] * np.asarray(geo['direction'], float)
    return (p - np.asarray(geo['origin'], float)) @ np.linalg.inv(m)


def mask_ras(geo, mask):
    """RAS mm of every voxel centre in a boolean mask (N,3)."""
    return grid_to_ras(geo, np.stack(np.nonzero(mask), 1))


def _kabsch(src, tgt, reflect=False):
    """(R, rms, det_raw): as kabsch, and det_raw is the determinant of the orthogonal fit before the sign fix."""
    ps, pt = src.mean(0), tgt.mean(0)
    u, _, vt = np.linalg.svd((src - ps).T @ (tgt - pt))
    r = vt.T @ u.T
    det_raw = float(np.linalg.det(r))
    if not reflect:
        r = vt.T @ np.diag([1.0, 1.0, 1.0 if np.linalg.det(r) >= 0 else -1.0]) @ u.T
    res = (src - ps) @ r.T - (tgt - pt)
    return r, float(np.sqrt((res ** 2).sum(1).mean())), det_raw


def kabsch(src, tgt, reflect=False):
    """(R, rms): R maps centred src onto centred tgt (R @ (s - mean_s) ~ t - mean_t); det +1 unless reflect."""
    r, rms, _ = _kabsch(src, tgt, reflect)
    return r, rms


def rot_angle_deg(a, b):
    """Rotation angle (degrees) of a^T b."""
    return float(np.degrees(np.arccos(np.clip((np.trace(a.T @ b) - 1) / 2, -1.0, 1.0))))


def loo_angles(src, tgt, r):
    """Leave-one-out: angle (degrees) between the full fit r and the fit without each point, in point order."""
    out = []
    for k in range(len(src)):
        keep = np.arange(len(src)) != k
        out.append(rot_angle_deg(kabsch(src[keep], tgt[keep])[0], r))
    return out


def footplate_origin(stapes_pts, incus_c):
    """Origin = centroid of the Stapes voxels within 0.5 mm of the footplate end (the end farther from the Incus)."""
    c = stapes_pts.mean(0)
    _, v = np.linalg.eigh(np.cov((stapes_pts - c).T))
    axis = v[:, -1]
    t = (stapes_pts - c) @ axis
    d_lo = np.linalg.norm(c + t.min() * axis - incus_c)
    d_hi = np.linalg.norm(c + t.max() * axis - incus_c)
    t_end = t.min() if d_lo > d_hi else t.max()
    near = np.abs(t - t_end) <= FOOTPLATE_RADIUS_MM
    return stapes_pts[near].mean(0), {'footplate_end': 'low' if d_lo > d_hi else 'high', 'n_within_0_5mm': int(near.sum()),
                                      'dist_low_mm': float(d_lo), 'dist_high_mm': float(d_hi)}


def _mask(masks, name):
    if name == 'cochlea':
        return masks[COCHLEA[0]] | masks[COCHLEA[1]]
    if name not in masks:
        raise ValueError(f'segment {name!r} is missing from the segmentation')
    return masks[name]


def sanity(masks, seg_geo, ct, ct_geo):
    """Bone voxels should sample brighter CT than non-Bone voxels; positions outside the CT are skipped."""
    bone = masks['Bone']
    rng = np.random.default_rng(SEED)
    nz = np.nonzero(bone)
    sel = rng.choice(len(nz[0]), min(SAMPLE, len(nz[0])), replace=False)
    b_idx = np.stack([a[sel] for a in nz], 1)
    cand = np.stack([rng.integers(0, n, 2 * SAMPLE) for n in bone.shape], 1)
    b_idx_nb = cand[~bone[tuple(cand.T)]][:SAMPLE]
    out = {}
    for label, idx in (('Bone', b_idx), ('non-Bone', b_idx_nb)):
        ci = np.rint(ras_to_grid(ct_geo, grid_to_ras(seg_geo, idx))).astype(np.int64)
        inside = ((ci >= 0) & (ci < np.array(ct.shape))).all(1)
        vals = ct[tuple(ci[inside].T)].astype(float)
        out[label] = (float(vals.mean()) if vals.size else float('nan'), float(inside.mean()), int(len(idx)))
    (mb, fb, nb), (mn, fn, nn) = out['Bone'], out['non-Bone']
    print(f'sanity: Bone mean CT {mb:.1f} (fraction of {nb} samples inside CT {fb:.3f}); '
          f'non-Bone mean CT {mn:.1f} (inside {fn:.3f} of {nn})')
    if not mb > mn:
        raise ValueError('Bone samples are not brighter than non-Bone in the CT: the frame or the CT is wrong')


def fmt(v):
    return '(' + ' '.join(f'{x:9.3f}' for x in v) + ')'


def run(a):
    out = I.out_dir_inside(a.out)
    ref = json.load(open(a.ref))
    shared = [(name, gid) for name, gid in ROWS if gid in ref]
    if len(shared) < MIN_SHARED:
        raise ValueError(f'reference shares {len(shared)} ids with the segmentation; need at least {MIN_SHARED}')
    loaded = I.read_nrrd(a.seg)
    seg_geo = I.geometry(loaded[1])
    masks = I.read_segments(a.seg, loaded)
    del loaded
    ct, ct_hdr = I.read_nrrd(a.ct)
    ct_geo = I.geometry(ct_hdr)
    if ct_geo['dims'] != list(ct.shape):
        raise ValueError('CT geometry disagrees with its array shape')
    print(f'seg: {seg_geo["space"]} dims {seg_geo["dims"]} spacing {seg_geo["spacing_mm"]}')
    print(f'ct:  {ct_geo["space"]} dims {ct_geo["dims"]} spacing {ct_geo["spacing_mm"]}')
    sanity(masks, seg_geo, ct, ct_geo)
    del ct

    cent = {}
    print('segment centroids (RAS mm):')
    for name in masks:
        pts = mask_ras(seg_geo, masks[name])
        cent[name] = pts.mean(0)
        print(f'  {name:26s} n={len(pts):9d} {fmt(cent[name])}')
    cent['cochlea'] = mask_ras(seg_geo, _mask(masks, 'cochlea')).mean(0)
    print(f'  {"cochlea (union)":26s} {fmt(cent["cochlea"])}')

    stapes = mask_ras(seg_geo, _mask(masks, 'Stapes'))
    origin, fp = footplate_origin(stapes, cent['Incus'])
    print(f'origin (footplate): {fmt(origin)}  end={fp["footplate_end"]} n={fp["n_within_0_5mm"]} '
          f'dist low {fp["dist_low_mm"]:.3f} high {fp["dist_high_mm"]:.3f} mm')

    src = np.array([cent[name] for name, _ in shared])
    tgt = np.array([ref[gid] for _, gid in shared], float)
    r, rms_fit, det_raw = _kabsch(src, tgt)
    _, rms_refl = kabsch(src, tgt, reflect=True)
    sv = np.linalg.svd(src - src.mean(0), compute_uv=False)
    loo = {gid: ang for (_, gid), ang in zip(shared, loo_angles(src, tgt, r))}
    loo_max = max(loo.values())
    print(f'fitted on {len(shared)} ids: {[gid for _, gid in shared]}')
    print(f'rotation (det +1): rms_fit {rms_fit:.4f} mm; with reflection allowed rms {rms_refl:.4f} mm')
    print(f'conditioning: singular values {fmt(sv)}; det before sign fix {det_raw:.6f}; '
          f'leave-one-out max angle {loo_max:.3f} deg')
    print('  leave-one-out angle (deg): ' + ', '.join(f'{gid} {ang:.3f}' for gid, ang in loo.items()))
    print('rotation matrix:')
    for row in r:
        print('  ' + fmt(row))

    m = np.eye(4)
    m[:3, :3] = r
    m[:3, 3] = -r @ origin

    def to_olsb(p):
        return (np.asarray(p, float) - origin) @ r.T

    lm = json.load(open(LANDMARKS))['landmarks']
    lm_med = {}
    for g in {x['g'] for x in lm if x['g'] is not None}:
        lm_med[g] = np.median([x['point_mm'] for x in lm if x['g'] == g], axis=0)

    print('residuals (OLSB mm; * = fitted):  T = transformed centroid, D = T - ref, d = |D|')
    rows = []
    for name, gid in ROWS:
        if gid not in ref:
            print(f'  {name}: id {gid} absent from the reference, skipped')
            continue
        t = to_olsb(cent[name])
        rf = np.asarray(ref[gid], float)
        diff = t - rf
        row = {'id': gid, 'fitted': True, 'transformed': t.tolist(), 'ref': rf.tolist(),
               'diff': diff.tolist(), 'distance_mm': float(np.linalg.norm(diff)),
               'landmark_median': None, 'landmark_distance_mm': None}
        line = (f'  {"*" if row["fitted"] else " "} {gid:8s} {name:26s} T={fmt(t)} ref={fmt(rf)} '
                f'D={fmt(diff)} d={row["distance_mm"]:7.3f}')
        if gid in lm_med:
            row['landmark_median'] = lm_med[gid].tolist()
            row['landmark_distance_mm'] = float(np.linalg.norm(t - lm_med[gid]))
            line += f' | landmarks.json median {fmt(lm_med[gid])} d={row["landmark_distance_mm"]:7.3f}'
        print(line)
        rows.append(row)

    bone_olsb = to_olsb(mask_ras(seg_geo, masks['Bone']))
    bbox = {'min': bone_olsb.min(0).tolist(), 'max': bone_olsb.max(0).tolist()}
    print('Bone bounding box (OLSB mm): min ' + fmt(bbox['min']) + ' max ' + fmt(bbox['max']))
    print('Sinus Dura centroid (OLSB mm): ' + fmt(to_olsb(cent['Sinus Dura'])))

    frame = {'source': a.source, 'method': {'origin': ORIGIN_RULE, 'rotation': ROTATION_RULE},
             'matrix': m.tolist(), 'origin_ras': origin.tolist(), 'fitted': [gid for _, gid in shared],
             'rms_fit_mm': rms_fit, 'rms_reflected_mm': rms_refl,
             'fit_singular_values': sv.tolist(), 'det_unconstrained': det_raw,
             'loo_max_angle_deg': loo_max, 'loo_angles_deg': loo, 'residuals': rows,
             'bone_bbox_mm': bbox, 'limits': LIMITS}
    os.makedirs(out, exist_ok=True)
    json.dump(frame, open(os.path.join(out, 'frame.json'), 'w'), indent=1)
    print('wrote', os.path.join(out, 'frame.json'))


def main(argv=None):
    ap = argparse.ArgumentParser(description='Place a segmentation in OLSB frame (writes frame.json under incoming/).')
    ap.add_argument('seg', help='Slicer .seg.nrrd (RAS or LPS)')
    ap.add_argument('--ct', required=True, help='CT NRRD (LPS or RAS)')
    ap.add_argument('--ref', required=True, help='olsb-centroids.json')
    ap.add_argument('--source', required=True, help='source id, written to frame.json')
    ap.add_argument('--out', required=True, help='output folder inside tools/tbone-pipeline/incoming/')
    a = ap.parse_args(argv)
    try:
        run(a)
    except ValueError as e:
        print(f'frame: refused: {e}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
