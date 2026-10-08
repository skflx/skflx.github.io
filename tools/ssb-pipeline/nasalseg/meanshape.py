"""Mean shape of NasalSeg's five structures in the specimen's frame (WP POP2b; owner decision O9; docs/ssb.md 5.10).

    .venv/bin/python -I tools/ssb-pipeline/nasalseg/meanshape.py [--data DIR]

Input: the NasalSeg drop zone of stats.py (tools/ssb-pipeline/incoming/nasalseg/data/, gitignored) and the clear
subjects stats.py's `profiles` run recorded in ssb/anatomy/population/nasalseg.json. Output: ssb/models/population.glb.gz
(geometry only, no image data) and its entry in ssb/models/packs.json.

Method.
  * Subjects: the clear subset (profiles.subjects.clearIds), labels at our air threshold (display 78, the `restricted`
    convention of stats.py), read and side-assigned exactly as stats.py does (its read_nrrd, side_map, air_level).
  * Fit, per subject: a rigid transform (rotation + translation, no scale; Kabsch with a determinant guard) of the
    subject's four label centroids (nasal cavity R/L, maxillary sinus R/L; subject LPS taken to RAS) onto the standard
    specimen's four (cavity + vestibule labels, which is NasalSeg's cavity convention, and the maxillary sinuses).
    The per-subject RMS of the four residuals is reported. Four near-coplanar points fix a rotation poorly about
    their own plane's normal; that is the fit the WP specifies, and the RMS says how well it holds.
  * Mean shape, per structure and side: the signed distance field (mm, negative inside) of each aligned subject's
    mask is sampled on the specimen's own 0.5 mm grid over the structure's box (the specimen's labels dilated by 20 mm)
    and averaged; the zero iso-surface of the mean is the shape. The nasopharynx is built from the subjects whose
    nasopharynx label does not touch the crop's edge; with fewer than MIN_NP of them it is left out.
  * An averaged SDF shrinks thin parts (it is not a volume-preserving mean); the volume of the mean shape is reported
    beside the population median volume of the same structure and side (same threshold), and the gap is left as it is.
  * Surfaces: marching cubes on the mean SDF, Taubin smoothing, quadric decimation, area-weighted normals, all
    from meshes.py; nodes `<graph id>.<side>@nasalseg-mean` with extras.kind = "ghost"; the pack is not loaded at
    boot (packs.json "population": true), the Population panel's toggle asks for it.

Deterministic: no randomness; the pack is gzipped with mtime 0.
"""
import argparse, gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi
from skimage.measure import marching_cubes
import fast_simplification

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'uw'))
import stats                                    # noqa: E402  (reader, header fixes, side assignment, the clear subset)
import meshes                                   # noqa: E402

REPO = stats.REPO
POP_JSON = stats.OUT
PACK = 'population'
CUT = 'nasalseg-mean'
MIN_NP = 20
ROI_MM = 20.0
PAD_VOX = 20                                    # subject SDF crop margin (voxels)
BUDGET = {'s.nasal-cavity': 4500, 's.maxillary-sinus': 3500, 's.nasopharynx': 2000}
GRAPH = stats.GRAPH
# NasalSeg part -> the specimen label names whose union is the same structure by NasalSeg's convention
SPEC = {('cavity', 'R'): ['s.nasal-cavity.R', 's.nasal-vestibule.R'], ('cavity', 'L'): ['s.nasal-cavity.L', 's.nasal-vestibule.L'],
        ('maxillary', 'R'): ['s.maxillary-sinus.R'], ('maxillary', 'L'): ['s.maxillary-sinus.L'],
        ('nasopharynx', 'M'): ['s.nasopharynx.M']}
FIT = [('cavity', 'R'), ('cavity', 'L'), ('maxillary', 'R'), ('maxillary', 'L')]
meshes.KIND.update({gid: 'ghost' for gid in GRAPH.values()})     # write_glb puts these in each node's extras.kind
FLIP = np.array([-1.0, -1.0, 1.0])              # LPS <-> RAS


def kabsch(src, dst):
    """Rigid (R, t) with dst ~ src @ R.T + t, least squares, proper rotation."""
    cs, cd = src.mean(0), dst.mean(0)
    u, _, vt = np.linalg.svd((src - cs).T @ (dst - cd))
    d = np.sign(np.linalg.det(vt.T @ u.T))
    R = vt.T @ np.diag([1, 1, d]) @ u.T
    return R, cd - R @ cs


def specimen():
    img, lab, table, A, vox, ct = stats.load_head_a(None)
    by_name = {v: int(k) for k, v in table.items()}
    nz, ny, nx = lab.shape
    cent, box = {}, {}
    for key, names in SPEC.items():
        m = np.isin(lab, [by_name[n] for n in names])
        kji = np.argwhere(m)
        ijk = kji[:, ::-1].astype(float)
        ras = ijk @ A[:3, :3].T + A[:3, 3]
        cent[key] = ras.mean(0)
        lo, hi = ijk.min(0) - ROI_MM / ct['spacing'][0], ijk.max(0) + ROI_MM / ct['spacing'][0]
        box[key] = (np.maximum(np.floor(lo), 0).astype(int), np.minimum(np.ceil(hi), [nx - 1, ny - 1, nz - 1]).astype(int))
    return A, ct, cent, box


def subject_sdf(mask, dirs):
    """Signed distance (mm, negative inside) of `mask` over a crop around it, plus the crop's index origin."""
    idx = np.argwhere(mask)
    lo = np.maximum(idx.min(0) - PAD_VOX, 0)
    hi = np.minimum(idx.max(0) + PAD_VOX + 1, mask.shape)
    crop = mask[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]]
    sampling = [float(np.linalg.norm(dirs[k])) for k in range(3)]
    sdf = ndi.distance_transform_edt(~crop, sampling=sampling) - ndi.distance_transform_edt(crop, sampling=sampling)
    return sdf.astype(np.float32), lo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', default=stats.DATA)
    args = ap.parse_args()
    pop = json.load(open(POP_JSON))
    clear = pop['profiles']['subjects']['clearIds']
    _, thr_hu = stats.air_level(stats.load_head_a(None)[5])
    A, ct, target, boxes = specimen()
    nx, ny, nz = ct['dims']
    print(f'{len(clear)} clear subjects; threshold {thr_hu:.1f} HU; specimen grid {nx}x{ny}x{nz} at {ct["spacing"][0]} mm')

    acc = {k: None for k in SPEC}               # key -> [sum of sdf over the box, n]
    vols = {k: [] for k in SPEC}                # restricted volume (mL) per subject
    rms, skipped_np = [], 0
    for c in clear:
        img, d, o = stats.read_nrrd(os.path.join(args.data, 'images', f'{c}_img.nrrd'))
        lab, _, _ = stats.read_nrrd(os.path.join(args.data, 'labels', f'{c}_seg.nrrd'))
        mapping, _ = stats.side_map(lab, d, o)
        vox_ml = abs(np.linalg.det(d)) / 1000.0
        masks, cent = {}, {}
        for v, key in mapping.items():
            m = (lab == v) & (img < thr_hu)
            if key[0] == 'nasopharynx' and ((np.argwhere(lab == v).min(0) == 0).any() or (np.argwhere(lab == v).max(0) == np.array(lab.shape) - 1).any()):
                skipped_np += 1
                continue
            if m.sum() < 50:
                raise SystemExit(f'ESCALATE: {c} {key} has {int(m.sum())} voxels at our threshold')
            masks[key] = m
            cent[key] = stats.world(np.argwhere(m).astype(float), d, o).mean(0) * FLIP        # RAS
        R, t = kabsch(np.array([cent[k] for k in FIT]), np.array([target[k] for k in FIT]))
        res = np.array([cent[k] @ R.T + t - target[k] for k in FIT])
        rms.append(float(np.sqrt((res ** 2).sum(1).mean())))
        inv_d = np.linalg.inv(d)
        for key, m in masks.items():
            vols[key].append(float(m.sum()) * vox_ml)
            sdf, lo = subject_sdf(m, d)
            b0, b1 = boxes[key]
            gi, gj, gk = np.meshgrid(*[np.arange(b0[a], b1[a] + 1) for a in range(3)], indexing='ij')
            ras = np.stack([gi, gj, gk], -1).reshape(-1, 3).astype(float) @ A[:3, :3].T + A[:3, 3]
            subj_ras = (ras - t) @ R                                   # = R.T (q - t) for each row
            idx = ((subj_ras * FLIP) - o) @ inv_d - lo                 # subject voxel index within the crop
            val = ndi.map_coordinates(sdf, idx.T, order=1, mode='nearest').reshape(gi.shape)
            if acc[key] is None:
                acc[key] = [np.zeros(gi.shape, np.float64), 0]
            acc[key][0] += val
            acc[key][1] += 1
        print(c, f'rms {rms[-1]:.2f} mm', file=sys.stderr, flush=True)

    # ---- report
    r = np.array(rms)
    print(f'centroid-fit RMS over {len(r)} subjects (mm): median {np.median(r):.2f}, 95th percentile {np.percentile(r, 95):.2f}, max {r.max():.2f}')
    built, report, ns = [], [], {}
    for key, (part, side) in zip(SPEC, SPEC):
        n = len(vols[key])
        ns[key] = n
        if key == ('nasopharynx', 'M') and n < MIN_NP:
            print(f'nasopharynx: {n} subjects not cut by the crop (of {len(clear)}), fewer than {MIN_NP}: left out')
            continue
        total, count = acc[key]
        mean = (total / count).astype(np.float32)
        b0, _ = boxes[key]
        m = np.pad(mean, 2, mode='constant', constant_values=5.0)
        v, f, _, _ = marching_cubes(m, 0.0, allow_degenerate=False)
        # volume: voxels with mean SDF < 0 (exact count on the grid), times 0.125 mm3
        vol_ml = float((mean < 0).sum()) * float(np.prod(ct['spacing'])) / 1000.0
        med = float(np.median(vols[key]))
        gap = 100.0 * (vol_ml - med) / med
        print(f'{GRAPH[part]}.{side}: n {n}, mean-shape volume {vol_ml:.2f} mL, population median {med:.2f} mL, gap {gap:+.1f} %')
        report.append((key, gap))
        v = v - 2 + b0[::-1]                                                   # (k, j, i) within the box -> whole grid
        ijk = v[:, ::-1]
        ras = ijk @ A[:3, :3].T + A[:3, 3]
        ras = meshes.taubin(ras, f)
        if len(f) > BUDGET[GRAPH[part]]:
            ras, f = fast_simplification.simplify(ras.astype(np.float32), f.astype(np.int32), 1 - BUDGET[GRAPH[part]] / len(f))
        ras = np.asarray(ras, np.float64); f = np.asarray(f, np.int64)
        built.append((f'{GRAPH[part]}.{side}@{CUT}', ras, f, meshes.normals(ras, f)))
    worst = max(abs(g) for _, g in report)
    esc = []
    if np.percentile(r, 95) > 6.0:
        esc.append('the centroid fit\'s 95th percentile RMS exceeds 6 mm')
    if worst > 15.0:
        esc.append(f'a mean shape\'s volume differs from the population median by {worst:.1f} % (> 15 %)')
    if esc:                                                    # the WP's Escalate lines: report, write nothing
        raise SystemExit('ESCALATE (nothing written): ' + '; '.join(esc))

    path = os.path.join(REPO, 'ssb', 'models', f'{PACK}.glb.gz')
    raw, gz = meshes.write_glb(path, built)
    print(f'{PACK}.glb.gz: {len(built)} nodes, {sum(len(f) for _, _, f, _ in built)} triangles, {gz} bytes ({raw} uncompressed)')

    pj = os.path.join(REPO, 'ssb', 'models', 'packs.json')
    manifest = json.load(open(pj))
    manifest['packs'][PACK] = {'file': f'{PACK}.glb.gz', 'population': True, 'bytes': gz, 'bytes_uncompressed': raw,
                               'triangles': int(sum(len(f) for _, _, f, _ in built)),
                               'nodes': {name: {'triangles': int(len(f)), 'vertices': int(len(v))} for name, v, f, _ in built}}
    manifest['notes']['population'] = ('the mean shape of the clear NasalSeg subjects\' nasal cavities, maxillary sinuses and nasopharynx '
                                       '(tools/ssb-pipeline/nasalseg/meanshape.py, POP2b): population truth in the specimen\'s frame, drawn as a ghost on '
                                       'request by the Population panel, never at boot and never a head')
    json.dump(manifest, open(pj, 'w'), indent=1)


if __name__ == '__main__':
    main()
