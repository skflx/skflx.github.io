"""Reference specimen, stage D: soft-tissue surfaces, charts and landmarks, from the committed volume.

    .venv/bin/python tools/ssb-pipeline/uw/softtissue.py     # after specimen.py, walls.py, meshes.py

Reads only ssb/ (ct.u8.gz, labels.u16.gz, ct.json, geometry/labels.json), so any session can rerun it;
nothing here needs the raw UW crawl. The specimen is a bone-window CT: soft tissue is not segmented,
it is derived (docs/ssb.md 5.7). Writes:

  ssb/models/soft.glb.gz        the septal mucosa, one open surface per side (s.septal-mucosa.R / .L).
                                Same encoding and budget rules as the walls pack. Listed in packs.json
                                under "pendingPacks" (and "proposedIds"), not "packs": the viewer loads
                                only "packs", and the graph has no s.septal-mucosa yet (ST0 adds it;
                                check-data fails a packs.json name that is not a graph id). When it does,
                                move the entry into "packs" with its nodes keyed "<id>.<side>".
  ssb/geometry/charts.json      per surface: the RAS -> chart rule, the bounding polygon in chart mm,
                                and a 1 mm (a, s) -> r lookup grid (null where the surface is absent),
                                with the surface normal per cell (unit, pointing into the tissue).
  ssb/geometry/landmarks.json   merged (never drops a key): lm.choanal-arch.M, and
                                landmarks.meta.json the method per point.

Method. The septal mucosa of side X is the lining of nasal-cavity.X where it faces the septum wall unit
(s.nasal-septum.M, walls.py): marching cubes on the air space, Taubin smoothing, and the triangles whose
centroid lies within 1 mm of a septum voxel, largest connected patch only. Normals are the air space's
outward normals, i.e. they point from the airway into the septum. The chart is the sagittal projection:
chart (a, s) = RAS (A, S) in mm, and r = the surface's R coordinate, so a flap outlined on the chart
lands on the surface by lookup. Chart round-trip error is printed and bounded (see check()).
Deterministic: gzip with mtime 0, no randomness other than a seeded sample.
"""
import gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi, sparse
from scipy.spatial import cKDTree
from skimage.measure import find_contours, approximate_polygon
import fast_simplification

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import meshes as M  # noqa: E402
from volume import write_results  # noqa: E402

REPO = M.REPO
SURFACE = 's.septal-mucosa'
BUDGET = 5000                 # triangles per side (walls.s.nasal-septum is 6000)
NEAR_MM = 1.0                 # a triangle belongs to the septal surface if its centroid is this close to septum voxels
GRID_MM = 1.0
ROUNDTRIP_MAX_MM = 1.0


def septal_surface(lab, table, aff, side, spacing):
    by = {v: int(k) for k, v in table.items()}
    sept = lab == by['s.nasal-septum.M']
    air = lab == by[f's.nasal-cavity.{side}']
    v, f = M.surface(air, aff)                                   # RAS mm, outward winding
    v = M.taubin(v, f)
    # voxel (i, j, k) of every centroid -> distance to the septum voxels
    d = ndi.distance_transform_edt(~sept, sampling=spacing)
    inv = np.linalg.inv(np.array(aff))
    cen = v[f].mean(1)
    ijk = cen @ inv[:3, :3].T + inv[:3, 3]
    near = ndi.map_coordinates(d, [ijk[:, 2], ijk[:, 1], ijk[:, 0]], order=1, mode='nearest') <= NEAR_MM
    f = f[near]
    # largest connected patch (triangles linked by shared vertices)
    used, inverse = np.unique(f.ravel(), return_inverse=True)
    g = inverse.reshape(-1, 3)
    n = len(used)
    e = np.concatenate([g[:, [0, 1]], g[:, [1, 2]]])
    adj = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n))
    _, comp = sparse.csgraph.connected_components(adj, directed=False)
    big = np.argmax(np.bincount(comp))
    f = g[comp[g[:, 0]] == big]
    v = v[used]
    used2, inv2 = np.unique(f.ravel(), return_inverse=True)
    v, f = v[used2], inv2.reshape(-1, 3)
    if len(f) > BUDGET:
        v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), 1 - BUDGET / len(f))
        v, f = np.asarray(v, np.float64), np.asarray(f, np.int64)
    # orient the normals from the airway into the septum (they are the air space's outward ones already)
    return v, f, M.normals(v, f)


def area_mm2(v, f):
    return float(np.linalg.norm(np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]]), axis=1).sum() / 2)


def dense(v, f, step=0.4):
    """Surface samples (points, normals-by-triangle) at ~`step` mm, barycentric."""
    pts, tri = [], []
    for t, (a, b, c) in enumerate(f):
        A, B, C = v[a], v[b], v[c]
        longest = max(np.linalg.norm(B - A), np.linalg.norm(C - B), np.linalg.norm(A - C))
        n = max(1, int(np.ceil(longest / step)))
        for i in range(n + 1):
            for j in range(n + 1 - i):
                u, w = i / n, j / n
                pts.append(A + u * (B - A) + w * (C - A)); tri.append(t)
    return np.array(pts), np.array(tri)


def chart_of(v, f, nrm):
    """The sagittal chart: 1 mm (a, s) -> r grid, normal grid, bounding polygon."""
    pts, tri = dense(v, f)
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
    a0, s0 = np.floor(pts[:, 1].min()) - 1, np.floor(pts[:, 2].min()) - 1
    na, ns = int(np.ceil(pts[:, 1].max() - a0)) + 2, int(np.ceil(pts[:, 2].max() - s0)) + 2
    ia = np.clip(np.round(pts[:, 1] - a0).astype(int), 0, na - 1)
    js = np.clip(np.round(pts[:, 2] - s0).astype(int), 0, ns - 1)
    cnt = np.zeros((na, ns)); rsum = np.zeros((na, ns)); nsum = np.zeros((na, ns, 3))
    np.add.at(cnt, (ia, js), 1); np.add.at(rsum, (ia, js), pts[:, 0]); np.add.at(nsum, (ia, js), fn[tri])
    occ = cnt > 0
    r = np.where(occ, rsum / np.maximum(cnt, 1), np.nan)
    nn = nsum / np.maximum(np.linalg.norm(nsum, axis=2, keepdims=True), 1e-12)
    # polygon: outer contour of the filled occupancy mask, in chart mm
    filled = ndi.binary_fill_holes(ndi.binary_closing(occ, iterations=2))
    cs = find_contours(np.pad(filled.astype(float), 1), 0.5)
    c = max(cs, key=len) - 1
    c = approximate_polygon(c, 0.5)
    poly = [[round(float(a0 + p[0] * GRID_MM), 2), round(float(s0 + p[1] * GRID_MM), 2)] for p in c[:-1]]
    return {'a0': float(a0), 's0': float(s0), 'na': na, 'ns': ns, 'r': r, 'n': nn, 'occ': occ, 'polygon': poly,
            'area_chart_cm2': float(filled.sum() * GRID_MM ** 2 / 100)}


def lookup(ch, a, s):
    """Chart point (a, s) -> r, by bilinear interpolation over occupied neighbours; None if off the surface."""
    x, y = (a - ch['a0']) / GRID_MM, (s - ch['s0']) / GRID_MM
    i0, j0 = int(np.floor(x)), int(np.floor(y))
    num = den = 0.0
    for di in (0, 1):
        for dj in (0, 1):
            i, j = i0 + di, j0 + dj
            if 0 <= i < ch['na'] and 0 <= j < ch['ns'] and ch['occ'][i, j]:
                w = (1 - abs(x - i)) * (1 - abs(y - j))
                num += w * ch['r'][i, j]; den += w
    return num / den if den > 1e-9 else None


def roundtrip(ch, v, f):
    """chart -> surface -> chart. For sample chart points (a, s): P = (lookup r, a, s); error =
    distance from P to the surface (nearest dense sample) in 3D, and the chart shift of that
    nearest surface point. Returns (max 3D mm, max chart mm, n)."""
    pts, _ = dense(v, f, 0.3)
    tree = cKDTree(pts)
    rng = np.random.default_rng(7)
    ii, jj = np.nonzero(ch['occ'])
    pick = rng.choice(len(ii), size=min(400, len(ii)), replace=False)
    e3 = ec = 0.0
    n = 0
    for p in pick:
        a = ch['a0'] + ii[p] + rng.uniform(-0.4, 0.4)
        s = ch['s0'] + jj[p] + rng.uniform(-0.4, 0.4)
        r = lookup(ch, a, s)
        if r is None:
            continue
        d, k = tree.query([r, a, s])
        e3 = max(e3, float(d)); ec = max(ec, float(np.hypot(pts[k][1] - a, pts[k][2] - s))); n += 1
    return e3, ec, n


def point_in_poly(p, poly):
    x, y = p
    inside = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def choanal_arch(lab, table, aff, sept_pts):
    """lm.choanal-arch.M: the highest point of the nasal cavity | nasopharynx boundary, within 4 mm
    (R) of the septum's mean R. specimen.py cuts that boundary at the PNS plane."""
    by = {v: int(k) for k, v in table.items()}
    npx = lab == by['s.nasopharynx.M']
    cav = (lab == by['s.nasal-cavity.R']) | (lab == by['s.nasal-cavity.L'])
    edge = npx & ndi.binary_dilation(cav)
    kk, jj, ii = np.nonzero(edge)
    ras = np.c_[ii, jj, kk] @ np.array(aff)[:3, :3].T + np.array(aff)[:3, 3]
    mid = float(np.mean(sept_pts[:, 0]))
    ras = ras[np.abs(ras[:, 0] - mid) <= 4.0]
    top = ras[:, 2].max()
    at = ras[ras[:, 2] >= top - 0.01]
    p = np.median(at, axis=0)
    return [round(float(x), 2) for x in p], {'n_boundary_voxels': int(len(ras)), 'septum_mean_r': round(mid, 2)}


def main():
    hdr, ct, lab, table = M.read_volume()
    aff, spacing = hdr['affine'], hdr['spacing'][0]
    built, charts, report = {}, {}, {}
    all_pts = []
    for side in 'RL':
        name = f'{SURFACE}.{side}'
        v, f, nrm = septal_surface(lab, table, aff, side, spacing)
        built[name] = (v, f, nrm)
        ch = chart_of(v, f, nrm)
        e3, ec, n = roundtrip(ch, v, f)
        area = area_mm2(v, f)
        mid = float(np.abs(v[:, 0]).max())
        report[name] = {'triangles': int(len(f)), 'area_cm2': round(area / 100, 2), 'chart_bbox_mm': {
            'a': [round(ch['a0'], 1), round(ch['a0'] + ch['na'], 1)], 's': [round(ch['s0'], 1), round(ch['s0'] + ch['ns'], 1)]},
            'max_abs_r_mm': round(mid, 2), 'roundtrip_max_3d_mm': round(e3, 3), 'roundtrip_max_chart_mm': round(ec, 3), 'roundtrip_samples': n}
        print(name, json.dumps(report[name]), flush=True)
        assert e3 <= ROUNDTRIP_MAX_MM and ec <= ROUNDTRIP_MAX_MM, f'{name}: chart round-trip error over {ROUNDTRIP_MAX_MM} mm'
        assert mid <= 15.0, f'{name}: reaches {mid} mm from the midsagittal plane'
        rows = [[None if np.isnan(ch['r'][i, j]) else round(float(ch['r'][i, j]), 2) for j in range(ch['ns'])] for i in range(ch['na'])]
        nrows = [[None if not ch['occ'][i, j] else [round(float(x), 2) for x in ch['n'][i, j]] for j in range(ch['ns'])] for i in range(ch['na'])]
        charts[name] = {'rule': 'chart (a, s) mm = RAS (A, S); r = RAS R of the surface at that (a, s); sagittal projection',
                        'polygon': ch['polygon'], 'grid': {'origin': [ch['a0'], ch['s0']], 'step': GRID_MM, 'dims': [ch['na'], ch['ns']],
                                                           'r': rows, 'normal': nrows},
                        'area_cm2': report[name]['area_cm2']}
        all_pts.append(v)

    # pack
    items = [(k, *built[k]) for k in sorted(built)]
    raw, gz = M.write_glb(os.path.join(REPO, 'ssb/models/soft.glb.gz'), items)
    # node names are written as id + sides here, not "<id>.<side>": check-data fails a packs.json key that is not
    # a graph id yet; the move into "packs" (nodes keyed by name) happens when the graph has the id
    entry = {'file': 'soft.glb.gz', 'bytes': gz, 'bytes_uncompressed': raw, 'triangles': int(sum(len(f) for _, _, f, _ in items)),
             'id': SURFACE, 'sides': sorted(k.rsplit('.', 1)[1] for k in built),
             'trianglesBySide': {k.rsplit('.', 1)[1]: int(len(f)) for k, _, f, _ in items},
             'verticesBySide': {k.rsplit('.', 1)[1]: int(len(v)) for k, v, _, _ in items}}
    pj = os.path.join(REPO, 'ssb/models/packs.json')
    man = json.load(open(pj))
    man.setdefault('pendingPacks', {})['soft'] = entry
    man['pendingPacks']['_note'] = ('written by softtissue.py; the graph has no s.septal-mucosa yet (ST0 adds it). '
                                    'Move the "soft" entry into "packs" when it does.')
    man.setdefault('proposedIds', {})[SURFACE] = ('lining of the nasal cavity where it faces the septum wall unit; one open surface per '
                                                   'side from the specimen air space (softtissue.py); add to the graph before the viewer loads the pack')
    json.dump(man, open(pj, 'w'), indent=1)

    cj = os.path.join(REPO, 'ssb/geometry/charts.json')
    json.dump({'version': 1, 'frame': 'RAS millimetres (docs/ssb.md section 4); chart units are millimetres',
               'note': 'written by tools/ssb-pipeline/uw/softtissue.py; normals point from the airway into the tissue',
               'surfaces': charts}, open(cj, 'w'), separators=(',', ':'))

    # landmarks (merge, never drop keys)
    arch, meta = choanal_arch(lab, table, aff, np.concatenate(all_pts))
    lp = os.path.join(REPO, 'ssb/geometry/landmarks.json')
    lm = json.load(open(lp)); lm['lm.choanal-arch.M'] = arch
    json.dump(dict(sorted(lm.items())), open(lp, 'w'), indent=1)
    mp = os.path.join(REPO, 'ssb/geometry/landmarks.meta.json')
    mm = json.load(open(mp))
    mm.setdefault('landmarks', {})['lm.choanal-arch.M'] = {
        'method': 'highest point (median of the top voxel row) of the nasal cavity | nasopharynx boundary within 4 mm (R) of the septum\'s mean R; '
                  'specimen.py cuts that boundary at the PNS plane (softtissue.py)', **meta}
    json.dump(mm, open(mp, 'w'), indent=1)
    print('lm.choanal-arch.M', arch, meta)
    write_results('softtissue', {'surfaces': report, 'choanal_arch': arch, 'pack_bytes': gz})


if __name__ == '__main__':
    main()
