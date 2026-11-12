"""Write the committed OpenEar display volume openear/<name>/ (owner decision 2026-11-11, docs/decisions.md §11:
a derived, resampled, cropped volume may be committed with attribution; raw NRRD/DICOM and donor metadata never).

    python3 -I tools/tbone-pipeline/openear-export.py ZETA

Reads the git-ignored incoming/ products: zeta-0.3/ (ingest.py --spacing 0.3 --out incoming/zeta-0.3), zeta-frame/
(frame.py --out incoming/zeta-frame) and openear/ZETA/Segmentation.seg.nrrd (the source segmentation). Writes, in OLSB's
frame (mm, right ear, x lateral, y anterior, z superior, origin at the stapes footplate), on a 0.3 mm grid cropped to the
specimen's temporal-bone box (its Bone bounding box plus a 2 mm margin):
    ct.u8.gz       display volume, [z][y][x], x fastest; 0 = outside the scan, 1..255 = the fixed WINDOW
    ct.json        ct.json v1 header; only the keys in ALLOW reach it
    geometry.json  per structure (glossary id only): voxel count, volume, centroid, bounding box, in OLSB mm
    frame.json     numbers only (plus glossary ids as keys): placement matrix, residuals, conditioning
openear/LICENSE-data.md carries the attribution; this script does not write it. Nothing is copied from a NRRD header
except the geometry allowlist of ingest.geometry() (B-6). Refuses a reflected fit. numpy, scipy.
"""
import argparse, gzip, json, math, os, re, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ingest as I  # noqa: E402
import frame as F  # noqa: E402

INC = os.path.join(HERE, 'incoming')
REPO = os.path.join(HERE, '..', '..')
OUT = os.path.join(REPO, 'openear')
GLOSSARY = os.path.join(REPO, 'js', 'olsb', 'glossary.js')
STEP = 0.3
MARGIN = 2.0                          # mm around the frame.json Bone bounding box
WINDOW = (-500.0, 2500.0)             # scanner grey values -> display levels 1..255, linear, clipped
# glossary id -> specimen segments (the union is one structure); a fixed set, never segment names in the output
LABELS = [('malleus', ('Malleus',)), ('incus', ('Incus',)), ('stapes', ('Stapes',)),
          ('cochlea', ('Scala Tympani', 'Scala Vestibuli')), ('tm', ('Tympanic Membrane',)),
          ('eac', ('External Auditory Canal',)), ('fn', ('Facial Nerve',)), ('chorda', ('Chorda Tympani',)),
          ('cn8', ('Cochleovestibular nerve',)), ('ica', ('Carotis Interna',))]
# the only ct.json keys that may be written (check-data.mjs checkOpenear holds the same list)
ALLOW = ['version', 'dims', 'dims_order', 'spacing', 'origin', 'affine', 'affineNote', 'frame', 'dtype', 'window',
         'method', 'source', 'attribution']
ATTRIBUTION = ('Temporal bone CT derived from the OpenEar library (Sieber et al., Sci Data 2019, '
               'doi:10.1038/sdata.2018.297; data doi:10.5281/zenodo.1473724), CC BY 4.0; resampled and cropped.')


def gz(path, arr):
    with gzip.GzipFile(path, 'wb', 9, mtime=0) as f:
        f.write(arr.tobytes())
    return os.path.getsize(path)


def glossary_ids():
    return set(re.findall(r'^ {8}"([a-z0-9-]+)": \{', open(GLOSSARY, encoding='utf8').read(), re.M))


def main(argv=None):
    ap = argparse.ArgumentParser(description='Write openear/<name>/ (derived display volume in OLSB frame).')
    ap.add_argument('name')
    a = ap.parse_args(argv)
    key = a.name.lower()
    known = glossary_ids()
    bad = [g for g, _ in LABELS if g not in known]
    if bad:
        raise SystemExit(f'refused: not glossary ids: {bad}')
    d_in = os.path.join(INC, f'{key}-0.3')
    meta = json.load(open(os.path.join(d_in, 'meta.json')))
    fj = json.load(open(os.path.join(INC, f'{key}-frame', 'frame.json')))
    if fj['det_unconstrained'] <= 0:
        raise SystemExit('refused: the fit needs a reflection (a left ear); mirror first')
    g = meta['geometry']
    d = g['dims']
    ct = np.frombuffer(gzip.open(os.path.join(d_in, 'volume.i16.gz')).read(), '<i2') \
        .reshape(d[2], d[1], d[0]).transpose(2, 1, 0).astype(np.float32)
    loaded = I.read_nrrd(os.path.join(INC, 'openear', a.name, 'Segmentation.seg.nrrd'))
    segg = I.geometry(loaded[1])
    segs = I.read_segments(None, loaded)
    del loaded
    r = np.array(fj['matrix'])[:3, :3]
    origin = np.array(fj['origin_ras'])

    # temporal-bone box in OLSB mm: the Bone bounding box plus a margin, on the 0.3 mm grid
    bb = fj['bone_bbox_mm']
    lo = np.array([math.floor((m - MARGIN) / STEP) * STEP for m in bb['min']])
    hi = np.array([m + MARGIN for m in bb['max']])
    dims = [int(math.ceil((hi[i] - lo[i]) / STEP)) + 1 for i in range(3)]
    box_min = [round(float(v), 3) for v in lo]
    box_max = [round(float(lo[i] + STEP * (dims[i] - 1)), 3) for i in range(3)]
    nx, ny, nz = dims
    xs = lo[0] + STEP * np.arange(nx)
    ys = lo[1] + STEP * np.arange(ny)
    gy, gx = np.meshgrid(ys, xs, indexing='ij')
    cto = np.zeros((nz, ny, nx), np.uint8)
    stats = {gid: {'n': 0, 'sum': np.zeros(3), 'lo': np.full(3, np.inf), 'hi': np.full(3, -np.inf)} for gid, _ in LABELS}
    cover = 0
    for k in range(nz):
        z = lo[2] + STEP * k
        p = np.stack([gx.ravel(), gy.ravel(), np.full(gx.size, z)], 1)
        ras = origin + p @ r
        ci = F.ras_to_grid(g, ras)
        inside = ((ci >= -0.5) & (ci <= np.array(d) - 0.5)).all(1)
        v = ndi.map_coordinates(ct, ci.T, order=1, mode='nearest')
        u = np.clip(1 + (v - WINDOW[0]) / (WINDOW[1] - WINDOW[0]) * 254, 1, 255)
        u[~inside] = 0
        cto[k] = np.rint(u).astype(np.uint8).reshape(ny, nx)
        cover += int(inside.sum())
        si = np.rint(F.ras_to_grid(segg, ras)).astype(np.int64)
        sin = ((si >= 0) & (si < np.array(segg['dims']))).all(1)
        si = np.where(sin[:, None], si, 0)
        for gid, names in LABELS:
            m = np.zeros(len(si), bool)
            for n in names:
                m |= segs[n][tuple(si.T)]
            m &= sin
            if not m.any():
                continue
            pts = p[m]
            s = stats[gid]
            s['n'] += int(m.sum())
            s['sum'] += pts.sum(0)
            s['lo'] = np.minimum(s['lo'], pts.min(0))
            s['hi'] = np.maximum(s['hi'], pts.max(0))
    del segs
    out = os.path.join(OUT, key)
    os.makedirs(out, exist_ok=True)
    n_ct = gz(os.path.join(out, 'ct.u8.gz'), cto)
    affine = [[STEP, 0, 0, box_min[0]], [0, STEP, 0, box_min[1]], [0, 0, STEP, box_min[2]], [0, 0, 0, 1]]
    header = {
        'version': 1, 'dims': dims, 'dims_order': 'x fastest; array index [k][j][i] = z, y, x',
        'spacing': [STEP] * 3, 'origin': box_min, 'affine': affine,
        'affineNote': 'voxel (i,j,k,1) -> frame mm (x lateral, y anterior, z superior; origin = stapes footplate; a right ear), row-major; origin is the frame position of voxel [0,0,0]',
        'frame': 'OLSB (js/olsb/volume.js): mm, a right ear, x lateral, y anterior, z superior; (0,0,0) = the stapes footplate of this specimen (OLSB places its origin at the centre of the oval window; they differ by about 1 mm)',
        'dtype': 'uint8',
        'window': {'kind': 'display', 'scanner_min': WINDOW[0], 'scanner_max': WINDOW[1],
                   'note': 'linear display levels over cone-beam CT grey values (not HU): level = 1 + 254 * (value - scanner_min) / (scanner_max - scanner_min), clipped to 1..255; 0 = outside the scan'},
        'method': (f'trilinear resampling of the source to a {STEP} mm grid, then sampling into the OLSB-frame box through the '
                   f'rotation of frame.json; box = the Bone bounding box of frame.json plus {MARGIN} mm; no other processing'),
        'source': {'library': 'OpenEar', 'record': 'doi:10.5281/zenodo.1473724', 'paper': 'doi:10.1038/sdata.2018.297',
                   'modality': 'cone-beam CT', 'source_spacing_mm': meta['source_spacing_mm']},
        'attribution': ATTRIBUTION,
    }
    assert set(header) <= set(ALLOW), set(header) - set(ALLOW)
    json.dump(header, open(os.path.join(out, 'ct.json'), 'w'), indent=1)

    geo = {}
    for gid, _ in LABELS:
        s = stats[gid]
        if s['n'] == 0:
            continue
        geo[gid] = {'voxels': s['n'], 'volume_mm3': round(s['n'] * STEP ** 3, 2),
                    'centroid_mm': [round(float(x), 3) for x in s['sum'] / s['n']],
                    'bbox_min_mm': [round(float(x), 3) for x in s['lo']],
                    'bbox_max_mm': [round(float(x), 3) for x in s['hi']],
                    'fitted': gid in fj['fitted']}
    json.dump({'frame': header['frame'], 'grid': 'ct.json', 'structures': geo,
               'note': 'glossary ids (js/olsb/glossary.js); cochlea = the two cochlear scalae together; '
                       'computed from the segmentation sampled on the ct grid, before any display rounding; the specimen supplies no vestibule, canals, IAC or Eustachian tube'},
              open(os.path.join(out, 'geometry.json'), 'w'), indent=1)

    res = {r_['id']: {'transformed_mm': r_['transformed'], 'ref_mm': r_['ref'], 'diff_mm': r_['diff'],
                      'distance_mm': r_['distance_mm'], 'landmark_distance_mm': r_.get('landmark_distance_mm')}
           for r_ in fj['residuals'] if r_['id'] in known}
    json.dump({'matrix': fj['matrix'], 'origin_ras': fj['origin_ras'], 'det': fj['det_unconstrained'],
               'rms_fit_mm': fj['rms_fit_mm'], 'fit_singular_values': fj['fit_singular_values'],
               'loo_max_angle_deg': fj['loo_max_angle_deg'], 'loo_angles_deg': fj['loo_angles_deg'],
               'bone_bbox_mm': bb, 'residuals': res},
              open(os.path.join(out, 'frame.json'), 'w'), indent=1)
    print(f'ct.u8.gz {n_ct} bytes; dims {dims}; scan coverage of the box {cover / (nx * ny * nz):.3f}')
    for gid, s in geo.items():
        print(f"  {gid:8s} {s['voxels']:9d} voxels  centroid {s['centroid_mm']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
