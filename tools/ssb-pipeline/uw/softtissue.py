"""Reference specimen, stage D: soft-tissue surfaces, charts and landmarks, from the committed volume.

    .venv/bin/python tools/ssb-pipeline/uw/softtissue.py     # after specimen.py, walls.py, meshes.py
    .venv/bin/python tools/ssb-pipeline/uw/softtissue.py --per-side   # a head that is not mirrored (normalize.py --base scanned)

Reads only ssb/ (ct.u8.gz, labels.u16.gz, ct.json, geometry/labels.json), so any session can rerun it;
nothing here needs the raw UW crawl. The specimen is a bone-window CT: soft tissue is not segmented,
it is derived (docs/ssb.md 5.7). Writes:

  ssb/models/soft.glb.gz        the septal mucosa, one open surface per side (s.septal-mucosa.R / .L).
                                Same encoding and budget rules as the walls pack. Listed in packs.json
                                under "packs" (s.septal-mucosa is a graph id since ST0; check-data fails a
                                packs.json name that is not one).
  ssb/geometry/charts.json      per surface: the RAS -> chart rule, the bounding polygon in chart mm,
                                and a 1 mm (a, s) -> r lookup grid (null where the surface is absent),
                                with the surface normal per cell (unit, pointing into the tissue).
  ssb/geometry/landmarks.json   merged (never drops a key): lm.choanal-arch.M, lm.incisive-canal.M
                                (incisive_canal()), lm.middle-turbinate-head.R / .L (turbinate_heads()), and the
                                sphenoid ostium's inferior_margin_s_mm in the meta (ostium_margin()); lm.naris is
                                nose.py's (E1b), not written here; landmarks.meta.json
                                the method per point.

Method. The septal mucosa of side X is the lining of nasal-cavity.X where it faces the septum wall unit
(s.nasal-septum.M, walls.py): marching cubes on the air space, Taubin smoothing, and the triangles whose
centroid lies within 1 mm of a septum voxel, largest connected patch only. Normals are the air space's
outward normals, i.e. they point from the airway into the septum. The chart is the sagittal projection:
chart (a, s) = RAS (A, S) in mm, and r = the surface's R coordinate, so a flap outlined on the chart
lands on the surface by lookup. Chart round-trip error is printed and bounded on the interior, reliable cells (an edge cell is only partly covered, so its centre is extrapolated; a flagged cell is flagged); the all-cell maximum is reported beside it.
The nasal floor mucosa (ST2c) is built on the right and mirrored for the left, because the standard specimen is
symmetric; with --per-side (the scanned base, RA3b) each side's floor is its own surface from its own cavity and floor
bone, charted in |R| (the left surface reflected through the frame's R = 0 plane, as the right chart's convention says
"lateral to the midline"), and each junction is judged against that side's septal chart.
Finally runs sweeps_soft.py (vessel sweeps snapped to these charts; a no-op while sweeps-soft.json is empty).
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
FILL_R_MM = 8.0               # hole fill: no further than this from the midsagittal plane
BUDGET = 5000                 # triangles per side (walls.s.nasal-septum is 6000)
NEAR_MM = 1.0                 # a triangle belongs to the septal surface if its centroid is this close to septum voxels
GRID_MM = 1.0
FOLD_MM = 1.0                 # a cell whose samples span more than this in R is flagged unreliable
ROUNDTRIP_MAX_MM = 1.0


def fill_holes(v, f, near, sg):
    """The septum wall unit (walls.py) is capped at 10 mm between the airways, so where the septum is
    thicker (a spur, a deviation) or a turbinate abuts it the label-based patch has holes. Inside the
    patch's own outline, those cells take the medial-most sheet of the airway's lining instead: per
    1 mm (a, s) cell the triangles facing the midline whose R is within 1 mm of the cell's most medial
    one, no more than FILL_R_MM from the midline plane. Returns the new triangle mask and the filled
    cells' centres [[a, s]...] (the chart marks them `filled`: lower confidence)."""
    tri = v[f]
    cen = tri.mean(1)
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
    cell = np.round(cen[:, 1:3]).astype(int)
    a0, s0 = cell[near].min(0) - 2
    shape = tuple(cell[near].max(0) - cell[near].min(0) + 5)
    have = np.zeros(shape, bool)
    have[cell[near, 0] - a0, cell[near, 1] - s0] = True
    outline = ndi.binary_fill_holes(ndi.binary_closing(have, iterations=2))
    inside = (cell[:, 0] - a0 >= 0) & (cell[:, 0] - a0 < shape[0]) & (cell[:, 1] - s0 >= 0) & (cell[:, 1] - s0 < shape[1])
    medial = (fn[:, 0] * sg < -0.3) & (sg * cen[:, 0] <= FILL_R_MM) & inside
    key = (cell[:, 0] - a0) * shape[1] + (cell[:, 1] - s0)
    rmin = {}
    for i in np.flatnonzero(medial):
        rmin[key[i]] = min(rmin.get(key[i], 1e9), sg * cen[i, 0])
    sheet = np.zeros(len(f), bool)
    for i in np.flatnonzero(medial):
        if sg * cen[i, 0] <= rmin[key[i]] + 1.0 and outline[cell[i, 0] - a0, cell[i, 1] - s0] and not have[cell[i, 0] - a0, cell[i, 1] - s0]:
            sheet[i] = True
    cells = sorted({(int(c[0]), int(c[1])) for c in cell[sheet]})
    return near | sheet, [[float(a), float(s)] for a, s in cells]


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
    near, filled = fill_holes(v, f, near, 1 if side == 'R' else -1)
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
    return v, f, M.normals(v, f), filled


FLOOR = 's.nasal-floor-mucosa'
FLOOR_ABOVE_MM = 6.0          # ST2c: a lining triangle belongs to the floor if it lies within this of a floor-bone voxel
FLOOR_COS = float(np.cos(np.pi / 4))
PNS_A_MM = -50.0              # the PNS plane: the posterior bound
FLOOR_MIN_CM2 = 2.0           # Escalate below this; also a second component over FLOOR_SECOND_CM2
FLOOR_SECOND_CM2 = 0.5
FLOOR_RULE_STD = ('axial chart: chart (a, r) mm = (RAS A, |RAS R|), r >= 0 lateral to the midline on either side; s = RAS S of the surface at that (a, r). '
                  'The left chart is the right one (the standard specimen is symmetric); its RAS R is -r. Normals (RAS order; R negated on the left) point from the airway into the tissue')
FLOOR_RULE_MIRROR = FLOOR_RULE_STD
FLOOR_RULE_SIDE = ('axial chart: chart (a, r) mm = (RAS A, |RAS R|), r >= 0 lateral to the frame\'s R = 0 plane on either side; s = RAS S of the surface at that (a, r). '
                   'Each side is its own surface from its own cavity and floor bone (the head is not mirrored); the left surface is reflected through R = 0 to be charted, '
                   'so its RAS R is -r. Normals (RAS order) point from the airway into the tissue')
JUNCTION_PNS_MM = -47.0       # the junction is judged from here forward (the septal chart's PNS-end cells are partly covered)


def tri_components(f):
    """Connected components of triangles (linked by shared vertices): labels per triangle."""
    used, inverse = np.unique(f.ravel(), return_inverse=True)
    g = inverse.reshape(-1, 3)
    e = np.concatenate([g[:, [0, 1]], g[:, [1, 2]]])
    adj = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(len(used), len(used)))
    _, comp = sparse.csgraph.connected_components(adj, directed=False)
    return comp[g[:, 0]]


PER_SIDE = '--per-side' in sys.argv


def floor_surface(lab, table, aff, spacing, side='R'):
    """s.nasal-floor-mucosa.<side> (ST2c). The floor bone (s.nasal-floor.<side>) is separated from the cavity air by
    1-3 mm of unlabelled soft tissue: the floor mucosa. Its surface is the airway lining itself (marching
    cubes on s.nasal-cavity.R, Taubin, as for the septal surface): the triangles whose normal (airway into
    tissue) has S <= -cos 45 deg, whose centroid is within FLOOR_ABOVE_MM of a floor-bone voxel, at or behind
    A = -50 (the PNS plane); the lateral edge is the normal rule (the floor turning into the inferior meatus
    wall), the medial edge is the septal junction. Largest component. Returns v, f, normals, report."""
    by = {v: int(k) for k, v in table.items()}
    air = lab == by[f's.nasal-cavity.{side}']
    bone = lab == by[f's.nasal-floor.{side}']
    v, f = M.surface(air, aff)
    v = M.taubin(v, f)
    tri = v[f]
    cen = tri.mean(1)
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
    d = ndi.distance_transform_edt(~bone, sampling=spacing)
    inv = np.linalg.inv(np.array(aff))
    ijk = cen @ inv[:3, :3].T + inv[:3, 3]
    dist = ndi.map_coordinates(d, [ijk[:, 2], ijk[:, 1], ijk[:, 0]], order=1, mode='nearest')
    keep = (fn[:, 2] <= -FLOOR_COS) & (dist <= FLOOR_ABOVE_MM) & (cen[:, 1] >= PNS_A_MM)
    f = f[keep]
    comp = tri_components(f)
    areas = np.array([area_mm2(v, f[comp == c]) / 100 for c in range(comp.max() + 1)])
    order = np.argsort(areas)[::-1]
    f = f[comp == order[0]]
    used, inv2 = np.unique(f.ravel(), return_inverse=True)
    v, f = v[used], inv2.reshape(-1, 3)
    if len(f) > BUDGET:
        v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), 1 - BUDGET / len(f))
        v, f = np.asarray(v, np.float64), np.asarray(f, np.int64)
    return v, f, M.normals(v, f), {'components_cm2': [round(float(a), 2) for a in areas[order]]}


def floor_chart(v, f, nrm):
    """The axial chart (a, r) -> s: chart_of() on the coordinates reordered (S, A, R), so its value is S
    and its grid axes are A and R. Cell normals keep the RAS order."""
    w = v[:, [2, 1, 0]]
    return chart_of(w, f, nrm)


def junction(ch, septal, v, f):
    """The septal chart's bottom(a) (the lowest occupied s at each a, as a RAS point) against the floor surface:
    per a, [a, r_septal, s_septal, r_floor_medial, s_floor_medial, d], where d is the 3D distance from the
    bottom(a) point to the floor surface and (r, s)_floor_medial is the floor chart's medial-most cell at that
    a (the polyline the chart records). Over the A range both cover."""
    g = septal['grid']
    sr = np.array([[np.nan if x is None else x for x in row] for row in g['r']])
    a0, s0 = g['origin']
    pts, _ = dense(v, f, 0.3)
    tree = cKDTree(pts)
    rows = []
    for i in range(ch['na']):
        a = ch['a0'] + i
        occ = np.nonzero(ch['occ'][i])[0]
        k = int(round(a - a0))
        if not len(occ) or not 0 <= k < sr.shape[0] or np.isnan(sr[k]).all():
            continue
        js = np.nonzero(~np.isnan(sr[k]))[0][0]
        r_b, s_b = float(sr[k, js]), s0 + js
        d, _ = tree.query([r_b, a, s_b])
        j = occ[0]                                      # grid axis 1 is r: the smallest is the medial edge
        rows.append([a, r_b, s_b, ch['s0'] + j, float(ch['r'][i, j]), float(d)])
    return rows


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
    rmax = np.full((na, ns), -np.inf); rmin = np.full((na, ns), np.inf)
    np.maximum.at(rmax, (ia, js), pts[:, 0]); np.minimum.at(rmin, (ia, js), pts[:, 0])
    unreliable = occ & ((rmax - rmin) > FOLD_MM)       # the surface folds across the cell: a sagittal chart is not single-valued there
    r = np.where(occ, rsum / np.maximum(cnt, 1), np.nan)
    # r at the cell CENTRE, not the cell mean: a plane fitted to the cell's samples (the surface slopes
    # across a 1 mm cell, and a bilinear lookup reads the grid as values at the centres)
    order = np.lexsort((js, ia))
    key = ia[order] * ns + js[order]
    cuts = np.flatnonzero(np.diff(key)) + 1
    for grp in np.split(order, cuts):
        i, j = ia[grp[0]], js[grp[0]]
        if len(grp) < 4:
            continue
        da, ds = pts[grp, 1] - (a0 + i * GRID_MM), pts[grp, 2] - (s0 + j * GRID_MM)
        A = np.c_[np.ones(len(grp)), da, ds]
        if np.linalg.matrix_rank(A) < 3:
            continue
        coef = np.linalg.lstsq(A, pts[grp, 0], rcond=None)[0]
        if abs(coef[0] - r[i, j]) < 1.5:
            r[i, j] = coef[0]
    nn = nsum / np.maximum(np.linalg.norm(nsum, axis=2, keepdims=True), 1e-12)
    # polygon: outer contour of the filled occupancy mask, in chart mm
    filled = ndi.binary_fill_holes(ndi.binary_closing(occ, iterations=2))
    cs = find_contours(np.pad(filled.astype(float), 1), 0.5)
    c = max(cs, key=len) - 1
    c = approximate_polygon(c, 0.5)
    poly = [[round(float(a0 + p[0] * GRID_MM), 2), round(float(s0 + p[1] * GRID_MM), 2)] for p in c[:-1]]
    return {'a0': float(a0), 's0': float(s0), 'na': na, 'ns': ns, 'r': r, 'n': nn, 'occ': occ, 'polygon': poly, 'unreliable': unreliable,
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


def roundtrip(ch, v, f, skip=None):
    """chart -> surface -> chart. For sample chart points (a, s): P = (lookup r, a, s); error =
    distance from P to the surface (nearest dense sample) in 3D, and the chart shift of that
    nearest surface point. Returns (max 3D mm, max chart mm, n)."""
    pts, _ = dense(v, f, 0.3)
    tree = cKDTree(pts)
    rng = np.random.default_rng(7)
    ii, jj = np.nonzero(ch['occ'] if skip is None else ch['occ'] & ~skip)
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


BONE_LEVEL = 150              # display value of dense bone (meshes.BONE_LEVEL)
CANAL_BOX = {'r': (-4.0, 4.0), 'a': (-24.0, -8.0), 's': (-14.0, -1.0)}
CANAL_BONE_WITHIN_MM = 2.0
CANAL_MIN_RUN_MM = 5.0
OSTIUM_NEAR_MM = 6.0
OSTIUM_MAX_HEIGHT_MM = 8.0


def _ras_grids(shape, aff):
    kk, jj, ii = np.indices(shape)
    A = np.array(aff)
    return A[0, 3] + A[0, 0] * ii, A[1, 3] + A[1, 1] * jj, A[2, 3] + A[2, 2] * kk


def incisive_canal(ct, aff, spacing):
    """lm.incisive-canal.M (ST2b): inside CANAL_BOX, the voxels of display 78-150 (a channel, not air, not bone)
    with bone (>= 150) within 2 mm on both sides along R, or on both sides along A; 26-connected components
    that run at least 5 mm in S are candidates. The canal is a midline structure, so the candidate whose
    centroid is nearest the midsagittal plane (R = 0) is taken; the landmark is its topmost point (mean of the
    voxels of its top S layer). NB the box's top edge (S -1) clips the candidate, so S is a lower bound."""
    R, A, S = _ras_grids(ct.shape, aff)
    bone = ct >= BONE_LEVEL
    reach = int(round(CANAL_BONE_WITHIN_MM / spacing))

    def both(axis):
        lo = np.zeros_like(bone); hi = np.zeros_like(bone)
        for k in range(1, reach + 1):
            lo |= np.roll(bone, k, axis); hi |= np.roll(bone, -k, axis)
        return lo & hi

    box = ((R >= CANAL_BOX['r'][0]) & (R <= CANAL_BOX['r'][1]) & (A >= CANAL_BOX['a'][0]) & (A <= CANAL_BOX['a'][1])
           & (S >= CANAL_BOX['s'][0]) & (S <= CANAL_BOX['s'][1]))
    m = (ct >= 78) & (ct < BONE_LEVEL) & (both(2) | both(1)) & box
    lab, n = ndi.label(m, structure=np.ones((3, 3, 3)))
    cands = []
    for c in range(1, n + 1):
        q = lab == c
        run = float(S[q].max() - S[q].min() + spacing)
        if run >= CANAL_MIN_RUN_MM:
            cands.append((abs(float(R[q].mean())), c, run))
    assert cands, 'no bone-bounded channel runs 5 mm in S inside the incisive-canal box'
    cands.sort()
    q = lab == cands[0][1]
    top = q & (S >= S[q].max() - 1e-6)
    p = [round(float(g[top].mean()), 2) for g in (R, A, S)]
    return p, {'run_s_mm': round(cands[0][2], 1), 'n_voxels': int(q.sum()), 'n_candidates': len(cands),
               'candidate_centroid_abs_r_mm': [round(c[0], 2) for c in sorted(cands)],
               'a_range_mm': [round(float(A[q].min()), 1), round(float(A[q].max()), 1)],
               's_range_mm': [round(float(S[q].min()), 1), round(float(S[q].max()), 1)]}


def ostium_margin(lab, ct, table, aff, lm, side):
    """The sphenoid ostium's inferior margin (S, mm), O5: the lowest S of the s.nasal-cavity.<side> |
    s.sphenoid-sinus.<side> label interface within 6 mm of lm.sphenoid-ostium.<side>. Where there is no
    interface (the ostium is closed by mucosa in the scan), the set of display < 150 voxels of
    s.sphenoid-face.<side> within 6 mm of the landmark that touches both airways; refuses if it is taller than
    8 mm. Returns (S, info) or (None, info) when the fallback refuses."""
    by = {v: int(k) for k, v in table.items()}
    R, A, S = _ras_grids(ct.shape, aff)
    p = np.array(lm[f'lm.sphenoid-ostium.{side}'])
    near = np.linalg.norm(np.stack([R - p[0], A - p[1], S - p[2]]), axis=0) <= OSTIUM_NEAR_MM
    cav = lab == by[f's.nasal-cavity.{side}']; sin = lab == by[f's.sphenoid-sinus.{side}']
    iface = ((ndi.binary_dilation(cav) & sin) | (ndi.binary_dilation(sin) & cav)) & near
    if iface.any():
        return float(S[iface].min()), {'source': 'cavity | sinus label interface', 'n_voxels': int(iface.sum()),
                                       's_range_mm': [float(S[iface].min()), float(S[iface].max())]}
    opening = (lab == by[f's.sphenoid-face.{side}']) & (ct < BONE_LEVEL) & near
    comp, n = ndi.label(opening, structure=np.ones((3, 3, 3)))
    keep = np.zeros_like(opening)
    for c in range(1, n + 1):
        q = comp == c
        grown = ndi.binary_dilation(q, iterations=2)
        if (grown & cav).any() and (grown & sin).any():
            keep |= q
    if not keep.any():
        return None, {'source': 'closed-wall fallback', 'refused': 'no opening touches both airways'}
    lo, hi = float(S[keep].min()), float(S[keep].max())
    info = {'source': 'closed-wall fallback (display < 150 opening of s.sphenoid-face)', 'n_voxels': int(keep.sum()),
            's_range_mm': [lo, hi], 'height_mm': hi - lo + 0.5}
    if hi - lo + 0.5 > OSTIUM_MAX_HEIGHT_MM:
        info['refused'] = f'opening is {hi - lo + 0.5:.1f} mm tall (> {OSTIUM_MAX_HEIGHT_MM} mm)'
        return None, info
    return lo, info


def turbinate_heads(lab, table, aff):
    """lm.middle-turbinate-head.<side>: the anterior end of the middle turbinate wall unit (walls.py): the
    centroid of its voxels within 1 mm (A) of the anterior-most one. A proxy for the axilla, the turbinate's
    attachment to the lateral wall, which a bone-window CT does not resolve. Used by the septal flap overlay
    (short-flap anterior cut) and by the AEA septal-branch waypoints."""
    by = {v: int(k) for k, v in table.items()}
    A = np.array(aff)
    out, info = {}, {}
    for side in 'RL':
        kk, jj, ii = np.nonzero(lab == by[f's.middle-turbinate.{side}'])
        a = A[1, 1] * jj + A[1, 3]
        front = a >= a.max() - 1.0
        r = A[0, 0] * ii + A[0, 3]
        sv = A[2, 2] * kk + A[2, 3]
        out[f'lm.middle-turbinate-head.{side}'] = [round(float(r[front].mean()), 2), round(float(a[front].mean()), 2), round(float(sv[front].mean()), 2)]
        info[f'lm.middle-turbinate-head.{side}'] = {'n_front_voxels': int(front.sum()), 'a_range_mm': [round(float(a.min()), 1), round(float(a.max()), 1)]}
    return out, info


def main():
    hdr, ct, lab, table = M.read_volume()
    aff, spacing = hdr['affine'], hdr['spacing'][0]
    built, charts, report = {}, {}, {}
    all_pts = []
    for side in 'RL':
        name = f'{SURFACE}.{side}'
        v, f, nrm, filled = septal_surface(lab, table, aff, side, spacing)
        built[name] = (v, f, nrm)
        ch = chart_of(v, f, nrm)
        flagged = ch['unreliable'].copy()                  # the round trip is judged where the chart claims to be single-valued
        for a, s_ in filled:
            flagged[int(round(a - ch['a0'])), int(round(s_ - ch['s0']))] = True
        interior = ndi.binary_erosion(ch['occ'], structure=np.ones((3, 3), bool))     # edge cells are partly covered: their centre is extrapolated
        e3, ec, n = roundtrip(ch, v, f, ndi.binary_dilation(flagged) | ~interior)
        e3_all, _, _ = roundtrip(ch, v, f)
        area = area_mm2(v, f)
        mid = float(np.abs(v[:, 0]).max())
        report[name] = {'triangles': int(len(f)), 'area_cm2': round(area / 100, 2), 'chart_bbox_mm': {
            'a': [round(ch['a0'], 1), round(ch['a0'] + ch['na'], 1)], 's': [round(ch['s0'], 1), round(ch['s0'] + ch['ns'], 1)]},
            'max_abs_r_mm': round(mid, 2), 'roundtrip_max_3d_mm': round(e3, 3), 'roundtrip_max_3d_mm_all_cells': round(e3_all, 3), 'roundtrip_max_chart_mm': round(ec, 3), 'roundtrip_samples': n,
                        'cells': int(ch['occ'].sum()), 'unreliable_cells': int(ch['unreliable'].sum()), 'filled_cells': len(filled)}
        print(name, json.dumps(report[name]), flush=True)
        assert e3 <= ROUNDTRIP_MAX_MM and ec <= ROUNDTRIP_MAX_MM, f'{name}: chart round-trip error over {ROUNDTRIP_MAX_MM} mm'
        assert mid <= 15.0, f'{name}: reaches {mid} mm from the midsagittal plane'
        rows = [[None if np.isnan(ch['r'][i, j]) else round(float(ch['r'][i, j]), 2) for j in range(ch['ns'])] for i in range(ch['na'])]
        nrows = [[None if not ch['occ'][i, j] else [round(float(x), 2) for x in ch['n'][i, j]] for j in range(ch['ns'])] for i in range(ch['na'])]
        charts[name] = {'rule': 'chart (a, s) mm = RAS (A, S); r = RAS R of the surface at that (a, s); sagittal projection',
                        'polygon': ch['polygon'], 'grid': {'origin': [ch['a0'], ch['s0']], 'step': GRID_MM, 'dims': [ch['na'], ch['ns']],
                                                           'r': rows, 'normal': nrows},
                        'area_cm2': report[name]['area_cm2'],
                        'filled': {'rule': f'chart cells with no septum-unit surface (a septum thicker than the unit\'s 10 mm cap: a spur or deviation; or a turbinate abutting it) taken instead from the medial-most sheet of the airway lining within {FILL_R_MM} mm of the midline plane; lower confidence',
                                   'cells': filled},
                        'unreliable': {'rule': f'chart cells whose surface samples span more than {FOLD_MM} mm in R (the surface folds across the cell: '
                                               'a spur, a deviation or a steep edge); a lookup there is approximate',
                                       'cells': [[round(ch['a0'] + int(i), 1), round(ch['s0'] + int(j), 1)] for i, j in zip(*np.nonzero(ch['unreliable']))]}}
        all_pts.append(v)

    # ST2c: the nasal floor mucosa, from the airway lining. The standard specimen is symmetric after N1, so its floor is built
    # once on the right and the left is the mirror; --per-side (a head that is not mirrored) builds each side from its own air
    # and floor bone and charts the left in |R| (reflected through the frame's R = 0 plane, winding reversed)
    for side, sg in (('R', 1), ('L', -1)):
        if side == 'L' and not PER_SIDE:
            name = f'{FLOOR}.L'
            built[name] = (fv * np.array([-1, 1, 1]), ff[:, ::-1], fnrm * np.array([-1, 1, 1]))
            report[name] = {**report[f'{FLOOR}.R']}
            print(name, json.dumps(report[name]), flush=True)
            charts[name] = {**charts[f'{FLOOR}.R'], 'rule': FLOOR_RULE_MIRROR}
            continue
        fv, ff, fnrm, frep = floor_surface(lab, table, aff, spacing, side)
        assert frep['components_cm2'][0] >= FLOOR_MIN_CM2, f'{FLOOR}.{side} area {frep["components_cm2"][0]} cm2 under {FLOOR_MIN_CM2}: escalate'
        assert frep['components_cm2'][1] <= FLOOR_SECOND_CM2, f'a second {FLOOR}.{side} component of {frep["components_cm2"][1]} cm2: escalate'
        cv, cf, cn = (fv, ff, fnrm) if sg == 1 else (fv * np.array([-1, 1, 1]), ff[:, ::-1], fnrm * np.array([-1, 1, 1]))
        ch = floor_chart(cv, cf, cn)
        interior = ndi.binary_erosion(ch['occ'], structure=np.ones((3, 3), bool))
        w = cv[:, [2, 1, 0]]
        e3, ec, n = roundtrip(ch, w, cf, ndi.binary_dilation(ch['unreliable']) | ~interior)
        e3_all, _, _ = roundtrip(ch, w, cf)
        area = area_mm2(cv, cf)
        sept = charts[f'{SURFACE}.{side}']
        if sg == -1:       # the junction is judged in the chart frame: the left septal chart's r is negative, the reflected floor's positive
            sept = {'grid': {**sept['grid'], 'r': [[None if x is None else -x for x in row] for row in sept['grid']['r']]}}
        jr = junction(ch, sept, cv, cf)
        jmax = max(r[-1] for r in jr if r[0] >= JUNCTION_PNS_MM)   # the septal chart's own edge cells (the PNS end) are partly covered
        jall = max(r[-1] for r in jr)
        rows = [[None if np.isnan(ch['r'][i, j]) else round(float(ch['r'][i, j]), 2) for j in range(ch['ns'])] for i in range(ch['na'])]
        name = f'{FLOOR}.{side}'
        built[name] = (fv, ff, fnrm)
        report[name] = {'triangles': int(len(ff)), 'area_cm2': round(area / 100, 2), 'components_cm2': frep['components_cm2'][:3],
                        'chart_bbox_mm': {'a': [round(ch['a0'], 1), round(ch['a0'] + ch['na'], 1)], 'r': [round(ch['s0'], 1), round(ch['s0'] + ch['ns'], 1)]},
                        'roundtrip_max_3d_mm': round(e3, 3), 'roundtrip_max_3d_mm_all_cells': round(e3_all, 3), 'roundtrip_max_chart_mm': round(ec, 3),
                        'roundtrip_samples': n, 'cells': int(ch['occ'].sum()), 'junction_max_mm': round(jmax, 2),
                        'junction_max_mm_incl_pns_end': round(jall, 2), 'junction_cells': len(jr)}
        print(name, json.dumps(report[name]), flush=True)
        charts[name] = {'rule': FLOOR_RULE_SIDE if PER_SIDE else FLOOR_RULE_MIRROR if side == 'L' else FLOOR_RULE_STD,
                        'polygon': ch['polygon'],
                        'grid': {'origin': [ch['a0'], ch['s0']], 'step': GRID_MM, 'dims': [ch['na'], ch['ns']], 's': rows},
                        'area_cm2': report[name]['area_cm2'],
                        'junction': {'rule': f'per a: the septal chart\'s bottom(a), the lowest occupied s of {SURFACE}.{side} at that a; '
                                             'rows are [a, r_septal, s_septal, r_floor_medial, s_floor_medial, distance mm from the septal point to the floor surface]; the PNS end (a < -47) is the septal chart\'s partly covered edge',
                                     'rows': [[round(x, 2) for x in r] for r in jr]}}
        assert e3 <= ROUNDTRIP_MAX_MM and ec <= ROUNDTRIP_MAX_MM, f'{name}: chart round-trip error over {ROUNDTRIP_MAX_MM} mm'
        assert jmax <= 1.0, f'{name}: the floor meets the septal chart\'s bottom(a) only within {jmax:.2f} mm'

    # pack
    items = [(k, *built[k]) for k in sorted(built)]
    raw, gz = M.write_glb(os.path.join(REPO, 'ssb/models/soft.glb.gz'), items)
    entry = {'file': 'soft.glb.gz', 'bytes': gz, 'bytes_uncompressed': raw, 'triangles': int(sum(len(f) for _, _, f, _ in items)),
             'nodes': {k: {'triangles': int(len(f)), 'vertices': int(len(v))} for k, v, f, _ in items}}
    pj = os.path.join(REPO, 'ssb/models/packs.json')
    man = json.load(open(pj))
    man['packs']['soft'] = entry
    for stale in ('pendingPacks', 'proposedIds'):       # transitional keys: every pack node is a graph id now
        man.pop(stale, None)
    man['totals'] = {'bytes': int(sum(p['bytes'] for p in man['packs'].values())), 'triangles': int(sum(p['triangles'] for p in man['packs'].values()))}
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
    canal, cinfo = incisive_canal(ct, aff, spacing)
    lm['lm.incisive-canal.M'] = canal
    mm['landmarks']['lm.incisive-canal.M'] = {
        'method': 'topmost point of the midline-most bone-bounded display 78-150 channel (>= 5 mm in S) in |R| <= 4, A -24..-8, S -14..-1; '
                  'the box top clips it, so S is a lower bound (softtissue.py, ST2b)', **cinfo}
    json.dump(dict(sorted(lm.items())), open(lp, 'w'), indent=1)
    margins = {}
    for side in 'RL':
        key = f'lm.sphenoid-ostium.{side}'
        sm, minfo = ostium_margin(lab, ct, table, aff, lm, side)
        print(key, 'inferior margin S', sm, minfo)
        if sm is not None:
            mm['landmarks'][key]['inferior_margin_s_mm'] = sm
            mm['landmarks'][key]['inferior_margin_method'] = ('lowest S of the cavity | sinus label interface within 6 mm of the landmark'
                                                              if minfo['source'].startswith('cavity') else minfo['source'])
            margins[side] = sm
    json.dump(mm, open(mp, 'w'), indent=1)
    print('lm.incisive-canal.M', canal, cinfo)
    heads, hinfo = turbinate_heads(lab, table, aff)
    lm.update(heads)
    json.dump(dict(sorted(lm.items())), open(lp, 'w'), indent=1)
    for k, v in heads.items():
        mm['landmarks'][k] = {'method': 'centroid of the middle-turbinate wall unit within 1 mm (A) of its anterior-most voxel (proxy for the axilla; softtissue.py)', **hinfo[k]}
    json.dump(mm, open(mp, 'w'), indent=1)
    print(heads, hinfo)
    import sweeps_soft
    sweeps_soft.run()                  # surface-snapped vessel sweeps from sweeps-soft.json (no-op while it is empty)
    write_results('softtissue', {'surfaces': report, 'choanal_arch': arch, 'incisive_canal': canal, 'ostium_inferior_margin_s_mm': margins, 'pack_bytes': gz})


if __name__ == '__main__':
    main()
