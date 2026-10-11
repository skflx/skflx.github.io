"""The population maxillary sinus in the specimen's frame (WP POP2b, re-scoped at CP-POP2b; owner decision O9; docs/ssb.md 5.10).

    .venv/bin/python -I tools/ssb-pipeline/nasalseg/meanshape.py [--data DIR]

Input: the NasalSeg drop zone of stats.py (tools/ssb-pipeline/incoming/nasalseg/data/, gitignored) and the clear
subjects stats.py's `profiles` run recorded in ssb/anatomy/population/nasalseg.json. Output: ssb/models/population.glb.gz
(geometry only, no image data), its entry in ssb/models/packs.json, and the `meanShape` key of nasalseg.json.

Method.
  * Subjects: the clear subset (profiles.subjects.clearIds), labels at our air threshold (display 78, the `restricted`
    convention of stats.py), read and side-assigned exactly as stats.py does (its read_nrrd, side_map, air_level).
  * Fit, per subject: a rigid transform (rotation + translation, no scale; Kabsch with a determinant guard) of the
    subject's four label centroids (nasal cavity R/L, maxillary sinus R/L; subject LPS taken to RAS) onto the standard
    specimen's four (cavity + vestibule labels, which is NasalSeg's cavity convention, and the maxillary sinuses).
    The per-subject RMS of the four residuals is reported.
  * Population sinus, per side: each aligned subject's maxillary mask (restricted to our threshold) is sampled on the
    specimen's own 0.5 mm grid over the sinus's box (the specimen's label dilated by 20 mm); the occupancy is the mean
    over subjects, and its 0.5 iso-surface (a majority vote) is the shape. Its volume (grid cells at occupancy >= 0.5)
    is reported beside the population median of the same side (same threshold).
  * No cavity and no nasopharynx (CP-POP2b): a rigid fit cannot register a thin convoluted passage, and the crop cuts
    the nasopharynx, so an averaged cavity is not a population fact. No deformable registration.
  * Surfaces: marching cubes, Taubin smoothing, quadric decimation, area-weighted normals, all from meshes.py; nodes
    `s.maxillary-sinus.<side>@nasalseg-majority` with extras.kind = "ghost"; the pack is not loaded at boot
    (packs.json "population": true), the Population panel's toggle asks for it.

Deterministic: no randomness; the pack is gzipped with mtime 0; JSON written with sorted keys.
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
CUT = 'nasalseg-majority'
ROI_MM = 20.0
BUDGET = 3500                                   # triangles per side
SHOWN = ('maxillary',)                          # the structures that ship (CP-POP2b); the cavity only anchors the fit
GRAPH = stats.GRAPH
# NasalSeg part -> the specimen label names whose union is the same structure by NasalSeg's convention
SPEC = {('cavity', 'R'): ['s.nasal-cavity.R', 's.nasal-vestibule.R'], ('cavity', 'L'): ['s.nasal-cavity.L', 's.nasal-vestibule.L'],
        ('maxillary', 'R'): ['s.maxillary-sinus.R'], ('maxillary', 'L'): ['s.maxillary-sinus.L']}
FIT = [('cavity', 'R'), ('cavity', 'L'), ('maxillary', 'R'), ('maxillary', 'L')]
meshes.KIND.update({GRAPH['maxillary']: 'ghost'})     # write_glb puts these in each node's extras.kind
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

    acc = {}                                    # shown key -> [sum of occupancy over the box, n]
    vols = {k: [] for k in SPEC}                # restricted volume (mL) per subject
    rms = []
    for c in clear:
        img, d, o = stats.read_nrrd(os.path.join(args.data, 'images', f'{c}_img.nrrd'))
        lab, _, _ = stats.read_nrrd(os.path.join(args.data, 'labels', f'{c}_seg.nrrd'))
        mapping, _ = stats.side_map(lab, d, o)
        vox_ml = abs(np.linalg.det(d)) / 1000.0
        masks, cent = {}, {}
        for v, key in mapping.items():
            if key not in FIT:
                continue
            m = (lab == v) & (img < thr_hu)
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
            if key[0] not in SHOWN:
                continue
            b0, b1 = boxes[key]
            gi, gj, gk = np.meshgrid(*[np.arange(b0[a], b1[a] + 1) for a in range(3)], indexing='ij')
            ras = np.stack([gi, gj, gk], -1).reshape(-1, 3).astype(float) @ A[:3, :3].T + A[:3, 3]
            subj_ras = (ras - t) @ R                                   # = R.T (q - t) for each row
            idx = ((subj_ras * FLIP) - o) @ inv_d                      # subject voxel index (k, j, i order of the array)
            val = ndi.map_coordinates(m.astype(np.float32), idx.T, order=1, mode='constant', cval=0.0).reshape(gi.shape)
            if key not in acc:
                acc[key] = [np.zeros(gi.shape, np.float64), 0]
            acc[key][0] += val
            acc[key][1] += 1
        print(c, f'rms {rms[-1]:.2f} mm', file=sys.stderr, flush=True)

    # ---- report
    r = np.array(rms)
    rms_doc = {'median': round(float(np.median(r)), 2), 'p95': round(float(np.percentile(r, 95)), 2), 'max': round(float(r.max()), 2)}
    print(f'centroid-fit RMS over {len(r)} subjects (mm): median {rms_doc["median"]:.2f}, 95th percentile {rms_doc["p95"]:.2f}, max {rms_doc["max"]:.2f}')
    built, report, sides = [], [], {}
    for key in acc:
        part, side = key
        total, count = acc[key]
        occ = (total / count).astype(np.float32)
        b0, _ = boxes[key]
        m = np.pad(occ.transpose(2, 1, 0), 2, mode='constant', constant_values=0.0)      # (i, j, k) -> (k, j, i), the array order of meshes.surface
        v, f, _, _ = marching_cubes(m, 0.5, allow_degenerate=False)
        vol_ml = float((occ >= 0.5).sum()) * float(np.prod(ct['spacing'])) / 1000.0
        med = float(np.median(vols[key]))
        gap = 100.0 * (vol_ml - med) / med
        print(f'{GRAPH[part]}.{side}: n {count}, majority volume {vol_ml:.2f} mL, population median {med:.2f} mL, gap {gap:+.1f} %')
        report.append(gap)
        sides[side] = {'majorityVolumeMl': round(vol_ml, 2), 'medianVolumeMl': round(med, 2), 'gapPercent': round(gap, 1), 'n': int(count)}
        v = v - 2 + b0[::-1]                                                   # (k, j, i) within the box -> whole grid
        ijk = v[:, ::-1]
        ras = ijk @ A[:3, :3].T + A[:3, 3]
        ras = meshes.taubin(ras, f)
        if len(f) > BUDGET:
            ras, f = fast_simplification.simplify(ras.astype(np.float32), f.astype(np.int32), 1 - BUDGET / len(f))
        ras = np.asarray(ras, np.float64); f = np.asarray(f, np.int64)
        built.append((f'{GRAPH[part]}.{side}@{CUT}', ras, f, meshes.normals(ras, f)))
    worst = max(abs(g) for g in report)
    esc = []
    if rms_doc['p95'] > 6.0:
        esc.append('the centroid fit\'s 95th percentile RMS exceeds 6 mm')
    if worst > 15.0:
        esc.append(f'a majority volume differs from the population median by {worst:.1f} % (> 15 %)')
    if esc:                                                    # the WP's Escalate lines: report, write nothing
        raise SystemExit('ESCALATE (nothing written): ' + '; '.join(esc))

    path = os.path.join(REPO, 'ssb', 'models', f'{PACK}.glb.gz')
    raw, gz = meshes.write_glb(path, built)
    print(f'{PACK}.glb.gz: {len(built)} nodes, {sum(len(f) for _, _, f, _ in built)} triangles, {gz} bytes ({raw} uncompressed)')
    if gz > 300_000:
        raise SystemExit(f'ESCALATE: pack is {gz} bytes (> 300 kB)')

    pj = os.path.join(REPO, 'ssb', 'models', 'packs.json')
    manifest = json.load(open(pj))
    manifest['packs'][PACK] = {'file': f'{PACK}.glb.gz', 'population': True, 'bytes': gz, 'bytes_uncompressed': raw,
                               'triangles': int(sum(len(f) for _, _, f, _ in built)),
                               'nodes': {name: {'triangles': int(len(f)), 'vertices': int(len(v))} for name, v, f, _ in built}}
    manifest['notes']['population'] = ('the region at least half of the aligned clear NasalSeg subjects\' maxillary sinuses occupy '
                                       '(tools/ssb-pipeline/nasalseg/meanshape.py, POP2b): population truth in the specimen\'s frame, drawn as a ghost on '
                                       'request by the Population panel, never at boot and never a head')
    json.dump(manifest, open(pj, 'w'), indent=1)

    doc = json.load(open(POP_JSON))
    doc['meanShape'] = {'method': 'rigid four-centroid alignment, no scale; occupancy vote >= 0.5 of the maxillary labels at our air threshold on the specimen grid',
                        'n': len(clear), 'alignRmsMm': rms_doc, 'sides': sides, 'node': f'{GRAPH["maxillary"]}.<side>@{CUT}'}
    with open(POP_JSON, 'w') as fh:
        json.dump(doc, fh, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
