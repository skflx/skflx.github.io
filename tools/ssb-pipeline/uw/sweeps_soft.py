"""Reference specimen, stage D2: vessels that run on a mucosal surface, generated from waypoints.

    .venv/bin/python tools/ssb-pipeline/uw/sweeps_soft.py [--selftest]     # after sweeps.py and softtissue.py

Anatomy is data here: every sweep is an entry in sweeps-soft.json, and this script only turns waypoints
into a centreline. Nothing is hand-placed in 3D. Per entry, keyed "<id>.<side>" (a graph id):

  surface    a surface id with a chart in ssb/geometry/charts.json (e.g. "s.septal-mucosa.R")
  waypoints  at least two, each either {"lm": "<landmark key>", "offset": [dr, da, ds]} (a point in
             landmarks.json plus an optional RAS mm offset; only the A and S parts place it on the chart) or
             {"chart": [a, s]} (chart mm; chart (a, s) = RAS (A, S))
  depth      mm below the surface along its normal, toward tissue (the normals in charts.json point from
             the airway into the tissue)
  radius     mm, one number or one per waypoint (interpolated along the path)
  src        graph source ids, as in the content files
  variable   optional note, set when the vessel's course varies between people
  notes      optional text

Generate: waypoints -> chart polyline (straight in chart mm between waypoints) -> r and the normal by
bilinear lookup in the chart's 1 mm grid -> point = (r, a, s) + depth * normal -> resampled every 1 mm of
3D arclength. Every point is marked `inferred` (the bone-window CT shows no mucosal vessels). The result
is merged into ssb/geometry/sweeps.json and recorded in sweeps.meta.json (with the spec entry); keys
written by sweeps.py are never touched. An empty spec changes nothing. A waypoint off the chart is an error
(it names the entry and the waypoint). Deterministic: no randomness, rounding as sweeps.py (0.1 mm).

--selftest builds a straight chart line on each side's septal surface in memory (nothing is written) and
checks that every point lies `depth` mm below the surface mesh within 0.5 mm, and that two runs are
identical. softtissue.py runs this stage after it has written the charts.
"""
import argparse, gzip, json, os, struct, sys
import numpy as np
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SPEC = os.path.join(HERE, 'sweeps-soft.json')
CHARTS = os.path.join(REPO, 'ssb/geometry/charts.json')
STEP_MM = 1.0
DENSE_MM = 0.25
TOL_MM = 0.5


class Chart:
    def __init__(self, entry):
        g = entry['grid']
        self.a0, self.s0 = g['origin']
        self.step = g['step']
        self.na, self.ns = g['dims']
        self.r = g['r']
        self.n = g['normal']
        self.bad = {(int(round(a - self.a0)), int(round(s - self.s0))) for a, s in entry.get('unreliable', {}).get('cells', [])}

    def _cells(self, a, s):
        x, y = (a - self.a0) / self.step, (s - self.s0) / self.step
        i0, j0 = int(np.floor(x)), int(np.floor(y))
        out = []
        for di in (0, 1):
            for dj in (0, 1):
                i, j = i0 + di, j0 + dj
                if 0 <= i < self.na and 0 <= j < self.ns and self.r[i][j] is not None:
                    out.append((i, j, (1 - abs(x - i)) * (1 - abs(y - j))))
        return out

    def unreliable(self, a, s):
        """True when any of the four cells the lookup reads is flagged (the surface folds there)."""
        return any((i, j) in self.bad for i, j, _ in self._cells(a, s))

    def at(self, a, s):
        """(r, unit normal) at chart (a, s), or None when no occupied cell is near."""
        cells = self._cells(a, s)
        den = sum(w for _, _, w in cells)
        if den < 1e-9:
            return None
        r = sum(self.r[i][j] * w for i, j, w in cells) / den
        n = np.sum([np.array(self.n[i][j]) * w for i, j, w in cells], axis=0)
        return r, n / max(np.linalg.norm(n), 1e-12)


def waypoint_chart(wp, landmarks, where):
    if 'chart' in wp:
        a, s = wp['chart']
        return float(a), float(s)
    if 'lm' in wp:
        if wp['lm'] not in landmarks:
            raise SystemExit(f'{where}: landmark {wp["lm"]} is not in landmarks.json')
        p = np.array(landmarks[wp['lm']], float) + np.array(wp.get('offset', [0, 0, 0]), float)
        return float(p[1]), float(p[2])
    raise SystemExit(f'{where}: a waypoint needs "lm" or "chart"')


def resample(P, step):
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    n = max(1, int(round(s[-1] / step)))
    t = np.linspace(0, s[-1], n + 1)
    return np.stack([np.interp(t, s, P[:, c]) for c in range(3)], axis=1), t / max(s[-1], 1e-9)


def generate(key, entry, chart, landmarks):
    where = f'{key}'
    wps = entry['waypoints']
    if len(wps) < 2:
        raise SystemExit(f'{where}: needs at least two waypoints')
    cw = [waypoint_chart(w, landmarks, f'{where} waypoint {i}') for i, w in enumerate(wps)]
    poly, wp_at = [], []                     # dense chart path, and each waypoint's arclength fraction
    for k in range(len(cw) - 1):
        a, b = np.array(cw[k]), np.array(cw[k + 1])
        n = max(1, int(np.ceil(np.linalg.norm(b - a) / DENSE_MM)))
        for t in np.linspace(0, 1, n + 1)[:-1 if k < len(cw) - 2 else None]:
            poly.append(a + t * (b - a))
    depth = float(entry.get('depth', 0))
    pts = []
    folded = 0
    for q in poly:
        hit = chart.at(*q)
        if hit is None:
            bad = min(range(len(cw)), key=lambda i: np.hypot(cw[i][0] - q[0], cw[i][1] - q[1]))
            raise SystemExit(f'{where}: the path leaves the surface chart near waypoint {bad} (chart a={q[0]:.1f}, s={q[1]:.1f})')
        r, n = hit
        folded += chart.unreliable(*q)
        pts.append(np.array([r, q[0], q[1]]) + depth * n)
    pts = np.array(pts)
    P, frac = resample(pts, STEP_MM)
    # per-waypoint radii, interpolated over arclength fraction of the waypoints
    rad = entry.get('radius', 0.4)
    cum = np.concatenate([[0], np.cumsum([np.linalg.norm(np.array(cw[i + 1]) - np.array(cw[i])) for i in range(len(cw) - 1)])])
    wfrac = cum / max(cum[-1], 1e-9)
    radius = np.interp(frac, wfrac, rad) if isinstance(rad, list) else np.full(len(P), float(rad))
    if isinstance(rad, list) and len(rad) != len(cw):
        raise SystemExit(f'{where}: radius list has {len(rad)} values for {len(cw)} waypoints')
    return P, radius, folded / max(len(poly), 1)


def length(P):
    return float(np.linalg.norm(np.diff(P, axis=0), axis=1).sum())


def run(spec_path=SPEC, write=True):
    spec = json.load(open(spec_path))
    entries = spec.get('sweeps', {})
    if not entries or not write:
        return {}
    charts = json.load(open(CHARTS))['surfaces']
    landmarks = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
    sp = os.path.join(REPO, 'ssb/geometry/sweeps.json')
    mp = os.path.join(REPO, 'ssb/geometry/sweeps.meta.json')
    sweeps, meta = json.load(open(sp)), json.load(open(mp))
    out = {}
    for key in sorted(entries):
        e = entries[key]
        if e['surface'] not in charts:
            raise SystemExit(f'{key}: surface {e["surface"]} has no chart in charts.json')
        P, rad, fold = generate(key, e, Chart(charts[e['surface']]), landmarks)
        out[key] = (P, rad)
        if fold:
            print(f'WARNING {key}: {fold:.0%} of the path lies on chart cells flagged unreliable (the surface folds there)', flush=True)
        sweeps[key] = {'pts': [[round(float(x), 1) for x in p] for p in P], 'radius': [round(float(x), 2) for x in rad]}
        meta['sweeps'][key] = {
            'confidence': 'low', 'length_mm': round(length(P), 1), 'status_fraction': {'inferred': 1.0}, 'status': ['inferred'] * len(P),
            'radius_source': 'sweeps-soft.json (stated, not measured)', 'source': 'sweeps_soft.py',
            'chart_unreliable_fraction': round(fold, 2), 'notes': e.get('notes', ''), **({'variable': e['variable']} if e.get('variable') else {}),
            'spec': {k: e[k] for k in ('surface', 'waypoints', 'depth', 'radius', 'src') if k in e}}
    json.dump(sweeps, open(sp, 'w'), indent=1)
    json.dump(meta, open(mp, 'w'), indent=1)
    for k, (P, _) in out.items():
        print(k, len(P), 'points', round(length(P), 1), 'mm', flush=True)
    return out


# ---------------------------------------------------------------- selftest
def read_glb_nodes(path):
    raw = gzip.open(path).read()
    jl, = struct.unpack_from('<I', raw, 12)
    doc = json.loads(raw[20:20 + jl])
    off = 20 + jl + 8
    binary = raw[off:]
    out = {}
    for node in doc['nodes']:
        prim = doc['meshes'][node['mesh']]['primitives'][0]
        pa, ia = doc['accessors'][prim['attributes']['POSITION']], doc['accessors'][prim['indices']]
        pv, iv = doc['bufferViews'][pa['bufferView']], doc['bufferViews'][ia['bufferView']]
        q = np.frombuffer(binary, np.int16, pa['count'] * 4, pv['byteOffset']).reshape(-1, 4)[:, :3].astype(np.float64)
        dt = np.uint16 if ia['componentType'] == 5123 else np.uint32
        f = np.frombuffer(binary, dt, ia['count'], iv['byteOffset']).reshape(-1, 3).astype(np.int64)
        out[node['name']] = (q * np.array(node['scale']) + np.array(node['translation']), f)
    return out


def selftest():
    from softtissue import dense  # noqa: E402  (shares the barycentric sampler)
    charts = json.load(open(CHARTS))['surfaces']
    landmarks = {}
    meshes = read_glb_nodes(os.path.join(REPO, 'ssb/models/soft.glb.gz'))
    ok = True
    for name, ch in sorted(charts.items()):
        chart = Chart(ch)
        # a straight chart line along the longest unbroken run of occupied, reliable cells (none flagged
        # within a cell of it) at constant s: the machinery is exact where the chart is single-valued
        best, run_lo, run_len = 0, 0, 0
        for j in range(chart.ns):
            i = 0
            while i < chart.na:
                if chart.r[i][j] is None or any((i + d, j + e) in chart.bad for d in (-1, 0, 1) for e in (-1, 0, 1)):
                    i += 1
                    continue
                k = i
                while k < chart.na and chart.r[k][j] is not None and not any((k + d, j + e) in chart.bad for d in (-1, 0, 1) for e in (-1, 0, 1)):
                    k += 1
                if k - i > run_len:
                    best, run_lo, run_len = j, i, k - i
                i = k
        a_lo, a_hi = chart.a0 + run_lo + 2, chart.a0 + run_lo + run_len - 3
        s = chart.s0 + best
        entry = {'surface': name, 'depth': 1.0, 'radius': 0.4, 'waypoints': [{'chart': [a_lo, s]}, {'chart': [a_hi, s]}]}
        P1, _, _ = generate(name, entry, chart, landmarks)
        P2, _, _ = generate(name, entry, chart, landmarks)
        v, f = meshes[name]
        pts, _ = dense(v, f, 0.25)
        d, _ = cKDTree(pts).query(P1)
        err = float(np.abs(d - entry['depth']).max())
        same = np.array_equal(P1, P2)
        print(f'{name}: {len(P1)} points over {length(P1):.1f} mm, max |distance - depth| {err:.3f} mm, rerun identical: {same}')
        ok &= err <= TOL_MM and same
    print('selftest', 'OK' if ok else 'FAILED')
    return ok


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--selftest', action='store_true')
    args = ap.parse_args()
    sys.path.insert(0, HERE)
    if args.selftest:
        sys.exit(0 if selftest() else 1)
    run()
