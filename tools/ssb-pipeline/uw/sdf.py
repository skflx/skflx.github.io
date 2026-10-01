"""Reference specimen, stage C3: distance fields for the endoscope proximity HUD (docs/ssb.md section 3).

    .venv/bin/python tools/ssb-pipeline/uw/sdf.py     # after walls.py and sweeps.py

Writes ssb/ct/sdf-<graph id>.u8.gz (gzip of raw uint8, x fastest, then y, then z - the CT's layout) and
the "sdf" key of ssb/ct/ct.json: grid (1 mm, same box as the CT), affine, value scale, and per field what
it measures and how much of it is inferred.

Value: mm from the voxel centre to the nearest surface of the structure, 0 inside it, = value * scale
(scale 0.1 mm per level), clamped at 25 mm (value 250). Unsigned: the scope tip is never inside these.

Fields (the HUD's five structures):
  s.internal-carotid-artery   tube around both ICA sweeps (centreline distance - radius)
  s.optic-nerve               tube around both optic nerve sweeps
  s.anterior-ethmoidal-artery tube around both AEA sweeps - an INFERRED course (sweeps.meta.json)
  s.anterior-cranial-fossa    the skull base seen from the nose: walls.py's fovea ethmoidalis, lateral lamella,
                              cribriform plate and planum sphenoidale labels (both sides)
  s.orbit                     the orbital contents and the bone between them and the sinuses: walls.py's
                              s.orbit labels plus lamina papyracea, orbital floor and frontal sinus floor
"""
import gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import CACHE, write_results  # noqa: E402
from walls import read_volume, Grid  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
STEP = 1.0
SCALE = 0.1
CLAMP = 25.0
LABEL_FIELDS = {
    's.anterior-cranial-fossa': {'units': ['s.fovea-ethmoidalis', 's.lateral-lamella', 's.cribriform-plate',
                                           's.planum-sphenoidale'],
                                 'hud': 'skull base', 'what': 'nearest skull-base bone of the anterior cranial fossa floor '
                                 '(ethmoid roof, lateral lamella, cribriform plate, planum)'},
    's.orbit': {'units': ['s.orbit', 's.lamina-papyracea', 's.orbital-floor', 's.frontal-sinus-floor'],
                'hud': 'orbit', 'what': 'nearest orbital wall (lamina papyracea, orbital floor, frontal sinus floor) or '
                'orbital contents'},
}
SWEEP_FIELDS = {
    's.internal-carotid-artery': {'hud': 'ICA', 'what': 'surface of the ICA tube'},
    's.optic-nerve': {'hud': 'optic nerve', 'what': 'surface of the optic nerve tube'},
    's.anterior-ethmoidal-artery': {'hud': 'AEA', 'what': 'surface of the AEA tube'},
}


def main():
    hdr, ct, lab, table = read_volume()
    g = Grid(hdr)
    sub = int(round(STEP / g.step))
    shape = tuple(int(np.ceil(n / sub)) for n in g.shape)          # (nz, ny, nx) on the 1 mm grid
    r = g.r[::sub]; a = g.a[::sub]; s = g.s[::sub]
    P = np.stack(np.meshgrid(r, a, s, indexing='ij'), -1)            # (nx, ny, nz, 3) RAS
    P = P.transpose(2, 1, 0, 3).reshape(-1, 3)                       # z, y, x order
    sweeps = json.load(open(os.path.join(REPO, 'ssb/geometry/sweeps.json')))
    smeta = json.load(open(os.path.join(REPO, 'ssb/geometry/sweeps.meta.json')))['sweeps']
    fields, report = {}, {}
    for fid, spec in LABEL_FIELDS.items():
        idx = [int(k) for k, v in table.items() if v.rsplit('.', 1)[0] in spec['units']]
        m = np.isin(lab, idx)
        d = ndi.distance_transform_edt(~m, sampling=g.step)[::sub, ::sub, ::sub]
        fields[fid] = d
        report[fid] = {'source': 'labels (walls.py)', 'voxels': int(m.sum())}
    for fid, spec in SWEEP_FIELDS.items():
        pts, rad, inferred = [], [], []
        for key, sw in sweeps.items():
            if key.rsplit('.', 1)[0] != fid:
                continue
            Q = np.array(sw['pts']); R = np.atleast_1d(sw['radius']) * np.ones(len(Q))
            st = smeta[key]['status']
            for n in range(len(Q) - 1):                              # dense samples along each segment
                k = max(2, int(np.ceil(np.linalg.norm(Q[n + 1] - Q[n]) / 0.1)))
                t = np.linspace(0, 1, k, endpoint=False)[:, None]
                pts.append(Q[n] + t * (Q[n + 1] - Q[n])); rad.append(R[n] + t[:, 0] * (R[n + 1] - R[n]))
                inferred.append(np.full(k, st[n] == 'inferred' and st[n + 1] == 'inferred'))
            pts.append(Q[-1:]); rad.append(R[-1:]); inferred.append(np.array([st[-1] == 'inferred']))
        pts = np.concatenate(pts); rad = np.concatenate(rad); inferred = np.concatenate(inferred)
        dist, nn = cKDTree(pts).query(P, distance_upper_bound=CLAMP + 4)
        dd = np.where(np.isfinite(dist), dist - rad[np.minimum(nn, len(rad) - 1)], CLAMP)
        fields[fid] = dd.reshape(shape)
        report[fid] = {'source': 'sweeps.json', 'inferred_fraction_of_centreline': round(float(inferred.mean()), 2)}
    out = {}
    for fid, d in fields.items():
        v = np.clip(np.round(np.clip(d, 0, CLAMP) / SCALE), 0, 255).astype(np.uint8)
        fn = f'sdf-{fid}.u8.gz'
        with gzip.GzipFile(os.path.join(REPO, 'ssb/ct', fn), 'wb', compresslevel=9, mtime=0) as f:
            f.write(np.ascontiguousarray(v).tobytes())
        size = os.path.getsize(os.path.join(REPO, 'ssb/ct', fn))
        spec = LABEL_FIELDS.get(fid) or SWEEP_FIELDS[fid]
        out[fid] = {'file': fn, 'hud': spec['hud'], 'what': spec['what'],
                    **({'units': spec['units']} if 'units' in spec else {}), **report[fid]}
        report[fid]['bytes'] = size
    hdr_path = os.path.join(REPO, 'ssb/ct/ct.json')
    H = json.load(open(hdr_path))
    H['sdf'] = {
        'dims': [shape[2], shape[1], shape[0]],
        'spacing': [STEP, STEP, STEP],
        'affine': [[STEP, 0, 0, float(g.r[0])], [0, STEP, 0, float(g.a[0])], [0, 0, STEP, float(g.s[0])], [0, 0, 0, 1]],
        'affineNote': 'voxel (i,j,k,1) -> RAS mm, row-major; a 1 mm grid over the CT box (every second CT voxel centre)',
        'dtype': 'uint8',
        'scale': SCALE,
        'clampMm': CLAMP,
        'note': 'mm to the nearest surface of the structure = value * scale; 0 inside; 250 = 25 mm or farther. '
                'Built by tools/ssb-pipeline/uw/sdf.py from walls.py labels and sweeps.json; '
                'what is inferred is in ssb/geometry/sweeps.meta.json',
        'fields': out,
    }
    json.dump(H, open(hdr_path, 'w'), indent=2, ensure_ascii=False)
    total = sum(v['bytes'] for v in report.values())
    budget = {'ct': os.path.getsize(os.path.join(REPO, 'ssb/ct/ct.u8.gz')),
              'labels': os.path.getsize(os.path.join(REPO, 'ssb/ct/labels.u16.gz')), 'sdf': total}
    budget['total'] = sum(budget.values()); budget['limit'] = 6_000_000
    write_results('sdf', {'fields': report, 'budget_bytes': budget})
    print(json.dumps(report, indent=1)); print(budget)


if __name__ == '__main__':
    main()
