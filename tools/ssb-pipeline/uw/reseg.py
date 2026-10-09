"""Resegmentation harness, work packages RS1 and RS2 (docs/realistic-anatomy.md section 7.2 steps 1-2, section 10).

    .venv/bin/python -I tools/ssb-pipeline/uw/reseg.py all        # work, air, export, score (RS1), then sheets, export2, score2 (RS2)
    .venv/bin/python -I tools/ssb-pipeline/uw/reseg.py work|air|export|score|sheets|export2|score2|rs2|selftest [--rules ALT.json]

Rebuilds specimen.py's air compartments on the NATIVE grid (0.3437 x 0.3437 x 0.625 mm, RAS) from the SEED arrow
tips only, then exports a candidate on the served 0.5 mm grid for `score.py --labels`. Everything it writes is a
candidate under the gitignored tools/ssb-pipeline/incoming/_rs/; nothing in ssb/ is touched.

  work    specimen-native.npz (or, if absent, the fetched axial stack: the same array) -> the working volume in the
          as-scanned RAS frame at native spacing, with specimen.py's face/hull masks    -> _rs/work.npz
  air     specimen.py steps 3-4 on the working volume (marker watershed on the distance to the air boundary, the
          choanal cut, the sphenoid septum, the frontal ostium, the basal-lamella PROXY plane) seeded from
          split.json's SEED tips                                                         -> _rs/air.npz, air-report.json
  export  resample to the served grid (label = the native label covering most of the output voxel, ties to the
          lower index) and lay out like ssb/ct + ssb/geometry/labels.json               -> _rs/candidate/
  score   score.py (a subprocess: this file never reads a held-out tip) at --tol 1 and --tol 6 on the candidate and on
          today's as-scanned labels, coverage of rs/declared.json                       -> _rs/score-RS1.json
  sheets  RS2. Multiscale Hessian sheetness of the working volume, its medial surface cut into planar, orientation-coherent
          candidates (rs/sheets.json "filter"), the sphenoid face and intersinus septum, then the four ethmoid lamellae, each
          NAMED only when exactly one candidate per side meets every rule of rs/sheets.json (else unassigned, per-rule scores
          written out). The face decides which air is sphenoid, the septum splits it R | L, a named basal lamella splits the
          ethmoid air. Candidates only: _rs/air2.npz, sheets-report.json, review/*.png (never committed)
  export2 the same regridding for the RS2 labels                                        -> _rs/candidate-RS2/, export-report-RS2.json
  score2  RS2 against RS1's candidate and today's labels at --tol 1 and --tol 6          -> _rs/score-RS2.json

The ground truth's integrity. split.json marks each tip `seed` or `heldout`. This file reads only `seed` rows
(`seed_tips`: a held-out row is dropped as it is met, its coordinates never read) and `guard` raises on any tip that
is not one of them; `selftest` feeds it a held-out tip and a forged one. Held-out tips are read by score.py alone.

What differs from specimen.py, and why. Distances, radii and plane positions are in mm, so the same rule applies on
the anisotropic grid; the 1 mm septal erosion is a Euclidean one; the PNS search, the ostium search and the noise floor
are the same rules in mm. Until the RS2 sheets stage names a basal lamella, the ethmoid split is still the PROXY plane. Landmarks are not rebuilt
(RS6). Deterministic: no randomness, zip/gzip timestamps fixed.
"""
import argparse, gzip, hashlib, io, json, math, os, subprocess, sys, zipfile
import numpy as np
from scipy import ndimage as ndi
from skimage.morphology import convex_hull_image
from skimage.segmentation import watershed

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import specimen as S  # noqa: E402  (constants only: thresholds, box, seed terms, volume refs)
from volume import CACHE, load as load_stack, read_results  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
INC = os.path.join(REPO, 'tools', 'ssb-pipeline', 'incoming')
RS = os.path.join(INC, '_rs')
NATIVE = os.path.join(CACHE, 'specimen-native.npz')
SPLIT = os.path.join(REPO, 'ssb/reference/uw-sinusanatomy2/split.json')
DECLARED = os.path.join(HERE, 'rs', 'declared.json')
SCORE_PY = os.path.join(HERE, 'score.py')
CAND = os.path.join(RS, 'candidate')
AS_SCANNED_COMMIT = '37fa476240afb7568d652814e82801e7f1cb7c97'     # score.py's input; the frame check reads its CT
MARGIN_MM = 1.0                                                     # working box = served box + this, so no output cell leaves it
BIG_PAD_MM = {'r': (25.0, 25.0), 'a': (45.0, 0.0)}                  # the hull is taken over the whole head section (specimen.py)
AIR_STEP = 'RS1'


# ---------------------------------------------------------------- the held-out guard
class HeldOutError(RuntimeError):
    pass


def tip_key(t):
    return (t['plane'], t['n'], t['label'], t['tip'])


def seed_tips(path=SPLIT):
    """The seed tips of split.json, in its canonical order. A held-out row is skipped as soon as its `set` is read; no
    held-out coordinate, term or id is looked at, kept or counted beyond the file's own `counts` header."""
    split = json.load(open(path))
    seeds = [t for t in split['tips'] if t.get('set') == 'seed']
    others = [t for t in split['tips'] if t.get('set') not in ('seed', 'heldout')]
    if others:
        raise HeldOutError('split.json has tips that are neither seed nor heldout: %d' % len(others))
    if len(seeds) != split['counts']['scorable'] - split['counts']['heldout']:
        raise HeldOutError('seed count %d disagrees with split.json counts' % len(seeds))
    return guard(seeds, frozenset(tip_key(t) for t in seeds))


def guard(tips, seed_keys):
    """Raise unless every tip is a seed tip of the split (marked `seed` and one of the keys read from it)."""
    for t in tips:
        if t.get('set') != 'seed' or tip_key(t) not in seed_keys:
            raise HeldOutError('refusing a tip that is not a seed tip of split.json: %s' % (tip_key(t),))
    return tips


def tips_by_term(tips):
    out = {}
    for t in tips:
        out.setdefault(t['term'], []).append(np.array(t['ras'], float))
    return out


# ---------------------------------------------------------------- grid
class Grid:
    """RAS lattice: voxel (k, j, i) is at origin + (i * dx, j * dy, k * dz), array order [k, j, i]."""

    def __init__(self, origin, sp, shape):
        self.origin = np.array(origin, float)       # (r, a, s)
        self.sp = np.array(sp, float)               # (dx, dy, dz)
        self.shape = tuple(int(n) for n in shape)   # (nk, nj, ni)

    def axes(self):
        nk, nj, ni = self.shape
        return (self.origin[0] + self.sp[0] * np.arange(ni), self.origin[1] + self.sp[1] * np.arange(nj),
                self.origin[2] + self.sp[2] * np.arange(nk))

    def to_json(self):
        return {'origin_ras_mm': [round(float(v), 6) for v in self.origin], 'spacing_mm': [round(float(v), 6) for v in self.sp],
                'shape_kji': list(self.shape)}

    @staticmethod
    def from_json(d):
        return Grid(d['origin_ras_mm'], d['spacing_mm'], d['shape_kji'])

    def index(self, p):
        """RAS point -> fractional (k, j, i)."""
        return np.array([(p[2] - self.origin[2]) / self.sp[2], (p[1] - self.origin[1]) / self.sp[1],
                         (p[0] - self.origin[0]) / self.sp[0]])


def working_grid(px, dz_mm):
    sp = (px, px, dz_mm)
    lo = {k: S.BOX[k][0] - MARGIN_MM for k in 'ras'}
    hi = {k: S.BOX[k][1] + MARGIN_MM for k in 'ras'}
    shape = [int(math.floor((hi[k] - lo[k]) / s + 1e-9)) + 1 for k, s in zip('sar', (dz_mm, px, px))]
    return Grid((lo['r'], lo['a'], lo['s']), sp, shape)


def big_grid(g, px):
    pr, pa = BIG_PAD_MM['r'], BIG_PAD_MM['a']
    ir0, ir1 = int(math.ceil(pr[0] / px)), int(math.ceil(pr[1] / px))
    ia0, ia1 = int(math.ceil(pa[0] / px)), int(math.ceil(pa[1] / px))
    nk, nj, ni = g.shape
    big = Grid(g.origin - np.array([ir0 * px, ia0 * px, 0.0]), g.sp, (nk, nj + ia0 + ia1, ni + ir0 + ir1))
    return big, (ia0, ir0)


def resample(V, A, dz_px, g):
    """V[n, y, x] (axial display, native) -> out[k, j, i] on grid g, trilinear; RAS = A @ [x, y, n * dz_px, 1]."""
    r, a, s = g.axes()
    Ainv = np.linalg.inv(A)
    out = np.zeros(g.shape, np.float32)
    R, Aa = np.meshgrid(r, a, indexing='xy')
    for k, sv in enumerate(s):
        P = np.stack([R.ravel(), Aa.ravel(), np.full(R.size, sv), np.ones(R.size)])
        x, y, Z, _ = Ainv @ P
        out[k] = ndi.map_coordinates(V, [Z / dz_px, y, x], order=1, cval=0).reshape(R.shape)
    return out


# ---------------------------------------------------------------- deterministic containers
def save_npz(path, **arrays):
    """np.savez_compressed with a fixed entry timestamp, so a rerun is byte-identical."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name in sorted(arrays):
            buf = io.BytesIO()
            np.lib.format.write_array(buf, np.asanyarray(arrays[name]), allow_pickle=False)
            zi = zipfile.ZipInfo(name + '.npy', date_time=(1980, 1, 1, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o600 << 16
            z.writestr(zi, buf.getvalue())


def write_gz(path, data):
    with gzip.GzipFile(path, 'wb', compresslevel=9, mtime=0) as f:
        f.write(data)


def write_json(path, obj, **kw):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(obj, f, indent=1, sort_keys=True, **kw)
        f.write('\n')


def sha8(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()[:8]


# ---------------------------------------------------------------- stage: work
def load_native():
    if os.path.exists(NATIVE):
        z = np.load(NATIVE)
        return z['axial'], z['axial_px_to_ras'], float(z['dz']), 'specimen-native.npz'
    res = read_results()
    A = np.array(res['frame']['axial_px_to_ras_mm_affine'])
    return load_stack('axial'), A, res['registration']['sagittal']['params']['dz'], 'fetched axial stack (same array specimen.py saves)'


def stage_work():
    V, A, dz_px, src = load_native()
    px = float(read_results()['frame']['mm_per_px'])
    g = working_grid(px, dz_px * px)
    big, (ia0, ir0) = big_grid(g, px)
    print('working grid (k, j, i) %s, spacing %s mm, source %s' % (g.shape, np.round(g.sp, 4), src))
    ctb = resample(V.astype(np.float32), A, dz_px, big)
    bone = ctb >= S.BONE
    hull_b = np.zeros_like(bone)
    for k in range(ctb.shape[0]):
        if bone[k].sum() > 20:
            hull_b[k] = convex_hull_image(bone[k])
    disk = ndi.generate_binary_structure(2, 1)
    it = int(round(3.0 / px))                       # the 3 mm face margin of specimen.py, in native in-plane voxels
    keep_b = np.stack([ndi.binary_dilation(h, disk, iterations=it) for h in hull_b])
    nk, nj, ni = g.shape
    sl = (slice(0, nk), slice(ia0, ia0 + nj), slice(ir0, ir0 + ni))
    ct, hull, keep = ctb[sl], hull_b[sl], keep_b[sl]
    save_npz(os.path.join(RS, 'work.npz'), ct=ct, hull=hull, keep=keep)
    write_json(os.path.join(RS, 'work.json'), {'grid': g.to_json(), 'source': src, 'mm_per_px': px, 'dz_px': dz_px,
                                               'thresholds_display': {'bone': S.BONE, 'air': S.AIR}, 'face_margin_vox': it,
                                               'note': 'as-scanned RAS frame (registration.json frame); hull over the whole head '
                                                       'section, cropped to the working box'})
    print('wrote work.npz')


def load_work():
    g = Grid.from_json(json.load(open(os.path.join(RS, 'work.json')))['grid'])
    z = np.load(os.path.join(RS, 'work.npz'))
    return g, z['ct'], z['hull'], z['keep']


# ---------------------------------------------------------------- stage: air
def stage_air():
    g, ct, hull, _ = load_work()
    tips = tips_by_term(seed_tips())
    dx, dy, dz = g.sp
    samp = (dz, dy, dx)
    r_ax, a_ax, s_ax = g.axes()
    vox_mm3 = dx * dy * dz
    vox_ml = vox_mm3 / 1000.0
    air = (ct < S.AIR) & hull
    dist = ndi.distance_transform_edt(air, sampling=samp)

    def snap(p, radius=3.0):
        c = np.round(g.index(p)).astype(int)
        hw = np.ceil(radius / np.array([dz, dy, dx])).astype(int)
        lo = np.maximum(c - hw, 0); hi = np.minimum(c + hw + 1, ct.shape)
        if np.any(lo >= hi):
            return None
        kk, jj, ii = np.mgrid[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]]
        d2 = ((kk - c[0]) * dz) ** 2 + ((jj - c[1]) * dy) ** 2 + ((ii - c[2]) * dx) ** 2
        sub = np.where(air[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], dist[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]], -1)
        sub = np.where(d2 <= radius * radius, sub, -1)
        if sub.max() <= 0:
            return None
        return np.array(np.unravel_index(np.argmax(sub), sub.shape)) + lo

    frontal = [p for p in tips.get('frontal sinus', [])]
    s_frontal_floor = min(p[2] for p in frontal) - 3.0
    comps = {}
    markers = np.zeros(ct.shape, np.int32)
    seeds_used, seeds_dropped = {}, {}
    for term, cid in S.SEED_TERMS.items():
        for p in tips.get(term, []):
            if cid == 's.frontal-recess' and p[2] > s_frontal_floor:
                k_ = term + ' (above the frontal sinus floor)'
                seeds_dropped[k_] = seeds_dropped.get(k_, 0) + 1
                continue
            q = snap(p)
            if q is None:
                seeds_dropped[term] = seeds_dropped.get(term, 0) + 1
                continue
            key = f'{cid}.{S.side_of(p[0], cid)}'
            if key not in comps:
                comps[key] = len(comps) + 1
            k, j, i = q
            markers[max(0, k - 1):k + 2, max(0, j - 2):j + 3, max(0, i - 2):i + 3] = comps[key]     # ~ the 1.5 mm cube, in native voxels
            seeds_used.setdefault(key, []).append(term)
    ws = watershed(-dist, markers, mask=air, connectivity=1)
    names = {v: k for k, v in comps.items()}
    J = a_ax[None, :, None]; Rr = r_ax[None, None, :]; Ss = s_ax[:, None, None]
    lab = np.zeros(ct.shape, np.int32)
    out = {}

    def put(mask, key):
        if key not in out:
            out[key] = len(out) + 1
        lab[mask] = out[key]

    def union(cid):
        return np.isin(ws, [v for v, k in names.items() if k.rsplit('.', 1)[0] == cid])
    for v, key in names.items():
        if key.rsplit('.', 1)[0] not in ('s.nasal-cavity', 's.nasopharynx', 's.sphenoid-sinus', 's.frontal-sinus', 's.frontal-recess'):
            put(ws == v, key)

    # nasal cavity | nasopharynx (choanae): behind the PNS coronal plane and below the sphenoid floor
    a_pns = find_pns(ct, g)
    sph = union('s.sphenoid-sinus')
    mid = np.abs(Rr) < 5
    s_arch = float(Ss.ravel()[np.nonzero((sph & mid).any(axis=(1, 2)))[0].min()]) - 1.0
    nas = union('s.nasal-cavity') | union('s.nasopharynx')
    npx = nas & (J < a_pns) & (Ss < s_arch)
    put(npx, 's.nasopharynx.M')
    put(nas & ~npx & (Rr > 0), 's.nasal-cavity.R'); put(nas & ~npx & (Rr <= 0), 's.nasal-cavity.L')

    cid_terms = {'s.sphenoid-sinus': 'sphenoid sinus', 's.frontal-sinus': 'frontal sinus'}

    def split_by_septum(m, cid, min_cm3=0.3):
        """Erode 1 mm so septal gaps open, keep the large pieces, name each by the side of the seed tips it holds,
        regrow within the sinus."""
        er = ndi.distance_transform_edt(m, sampling=samp) > 1.0
        cl, n = ndi.label(er)
        sizes = np.bincount(cl.ravel()); sizes[0] = 0
        seeds = np.zeros(m.shape, np.int32)
        sides = {}
        for c in np.nonzero(sizes * vox_ml >= min_cm3)[0]:
            votes = [np.sign(p[0]) for p in tips.get(cid_terms[cid], [])
                     if cl[tuple(np.clip(np.round(g.index(p)).astype(int), 0, np.array(m.shape) - 1))] == c]
            side = 'R' if (np.mean(votes) if votes else np.sign(r_ax[np.nonzero(cl == c)[2]].mean())) > 0 else 'L'
            sides[c] = side
            seeds[cl == c] = 1 if side == 'R' else 2
        if len(set(sides.values())) < 2:
            return None, sides
        return watershed(-dist, seeds, mask=m, connectivity=1), sides
    sph_split, sph_sides = split_by_septum(sph, 's.sphenoid-sinus')
    if sph_split is None:
        for v, key in names.items():
            if key.startswith('s.sphenoid-sinus'):
                put(ws == v, key)
        sph_method = 'tip-seeded watershed (no complete septum found)'
    else:
        put(sph_split == 1, 's.sphenoid-sinus.R'); put(sph_split == 2, 's.sphenoid-sinus.L')
        sph_method = f'septum: {len(sph_sides)} pieces after 1 mm erosion, sides {sorted(sph_sides.values())}'

    # frontal sinus | frontal recess at the ostium (narrowest cross-section of the outflow)
    fr = union('s.frontal-sinus') | union('s.frontal-recess')
    fs_split, fs_sides = split_by_septum(union('s.frontal-sinus'), 's.frontal-sinus', 0.05)
    ostia = {}
    for side, sgn in (('R', 1), ('L', -1)):
        if fs_split is None:
            m = fr & ((Rr > 0) == (sgn > 0))
        else:
            m = (fs_split == (1 if side == 'R' else 2)) | (union('s.frontal-recess') & ((Rr > 0) == (sgn > 0)))
        area = ndi.uniform_filter1d(m.sum(axis=(1, 2)).astype(float), 3)
        body = np.nonzero((s_ax >= s_frontal_floor - 2) & (s_ax <= s_frontal_floor + 15))[0]
        if not len(body) or area[body].max() == 0:
            continue
        k_os = int(body[np.argmax(area[body])])
        while k_os > 0 and s_ax[k_os - 1] >= 30 and area[k_os - 1] > 0 and area[k_os - 1] <= area[k_os] * 1.02:
            k_os -= 1
        put(m & (Ss > s_ax[k_os]), f's.frontal-sinus.{side}')
        put(m & (Ss <= s_ax[k_os]), f's.frontal-recess.{side}')
        kk, jj, ii = np.nonzero(m[k_os:k_os + 1])
        ostia[side] = {'s_mm': float(s_ax[k_os]), 'area_mm2': float(area[k_os] * dx * dy),
                       'centre_ras': [float(r_ax[ii].mean()), float(a_ax[jj].mean()), float(s_ax[k_os])]}

    # ethmoid anterior | posterior: per-side coronal plane midway between the anterior and posterior ethmoid seed tips
    # (the PROXY for the basal lamella, replaced by RS2)
    split = {}
    for side, sgn in (('R', 1), ('L', -1)):
        ant = [p[1] for t in ('anterior ethmoid', 'anterior ethmoid sinus') for p in tips.get(t, []) if np.sign(p[0]) == sgn]
        post = [p[1] for t in ('posterior ethmoid', 'posterior ethmoid air cells') for p in tips.get(t, []) if np.sign(p[0]) == sgn]
        split[side] = {'n_anterior_tips': len(ant), 'n_posterior_tips': len(post),
                       'a_mm': (min(ant) + max(post)) / 2 if ant and post else None}
    both = [v['a_mm'] for v in split.values() if v['a_mm'] is not None]
    for v in split.values():
        if v['a_mm'] is None:
            v['a_mm'] = float(np.mean(both)); v['borrowed'] = True
    eth_box = (np.abs(Rr) < 20) & (J > -62) & (J < -8) & (Ss > 12) & (Ss < 55)
    eth_keys = [k for k in out if k.rsplit('.', 1)[0] in S.ETHMOID + ('ethmoid',)]
    free = (lab == 0) & air & eth_box
    cl, _ = ndi.label(free)
    free &= np.bincount(cl.ravel())[cl] >= int(round(0.02 * 1000 / vox_mm3))      # < 0.02 cm3: noise, leave
    eth = np.isin(lab, [out[k] for k in eth_keys]) | free
    for key in eth_keys:
        lab[lab == out[key]] = 0
    for side, sgn in (('R', 1), ('L', -1)):
        m = eth & ((Rr > 0) == (sgn > 0))
        put(m & (J >= split[side]['a_mm']), f's.anterior-ethmoid-cells.{side}')
        put(m & (J < split[side]['a_mm']), f's.posterior-ethmoid-cells.{side}')
    for key in list(out):
        if not (lab == out[key]).any():
            out.pop(key)

    # stable index table: the served table's indices where a name exists there, new names appended
    table_path = os.path.join(REPO, 'ssb/geometry/labels.json')
    served = {v: int(k) for k, v in json.load(open(table_path))['labels'].items()}
    nxt = max(served.values()) + 1
    labels = np.zeros(ct.shape, np.uint16)
    volumes, index = {}, {}
    for key in sorted(out):
        n = int((lab == out[key]).sum())
        if key not in served:
            served[key] = nxt; nxt += 1
        index[key] = served[key]
        labels[lab == out[key]] = served[key]
        volumes[key] = round(n * vox_ml, 2)
    eth_tot = {s: round(sum(v for k, v in volumes.items() if k.endswith('.' + s) and
                            k.rsplit('.', 1)[0] in S.ETHMOID + ('s.agger-nasi-cell', 's.ethmoid-bulla', 's.frontal-recess')), 2)
               for s in ('R', 'L')}
    sanity = {}
    for key, v in list(volumes.items()) + [(f'ethmoid complex.{s}', t) for s, t in eth_tot.items()]:
        cid = key.rsplit('.', 1)[0]
        ref = S.VOLUME_REFS.get('ethmoid' if cid == 'ethmoid complex' else cid)
        if ref:
            sanity[key] = {'cm3': v, 'ref_range': ref['range'], 'outlier': not (ref['range'][0] <= v <= ref['range'][1])}
    save_npz(os.path.join(RS, 'air.npz'), labels=labels)
    write_json(os.path.join(RS, 'air-report.json'), {
        'grid': g.to_json(), 'seed_tips_used': 'split.json set == seed only', 'n_seed_tips': sum(len(v) for v in tips.values()),
        'index': index, 'seeds_used': {k: len(v) for k, v in sorted(seeds_used.items())}, 'seeds_dropped': seeds_dropped,
        'pns_a_mm': a_pns, 'choanal_arch_s_mm': s_arch, 'sphenoid_split': sph_method, 'frontal_ostia': ostia,
        'ethmoid_split_PROXY_for_basal_lamella': split, 'volumes_cm3': volumes, 'ethmoid_complex_total_cm3': eth_tot,
        'sanity': sanity, 'unassigned_air_cm3': round(float(((labels == 0) & air).sum()) * vox_ml, 2)})
    print(json.dumps({'seeds_used': {k: len(v) for k, v in sorted(seeds_used.items())}, 'seeds_dropped': seeds_dropped,
                      'volumes_cm3': volumes, 'sphenoid_split': sph_method}, indent=1))


def find_pns(ct, g):
    """specimen.find_pns in mm: posterior end of the hard palate on the midsagittal band (|r| <= 2, s in [-8, 3]),
    scanning back from a = -5 while bone continues (a gap of 2 mm ends it)."""
    r, a, s = g.axes()
    ir = np.nonzero(np.abs(r) <= 2)[0]; ks = np.nonzero((s >= -8) & (s <= 3))[0]
    col = (ct[ks][:, :, ir] >= S.BONE).any(axis=(0, 2))
    j = int(np.argmin(np.abs(a - (-5.0))))
    gap, last = 0, j
    while j > 0:
        if col[j]:
            gap = 0; last = j
        else:
            gap += 1
            if gap > int(2 / g.sp[1]):
                break
        j -= 1
    return float(a[last])


# ---------------------------------------------------------------- stage: export
def overlap_matrix(o_origin, o_step, o_n, n_origin, n_step, n_n):
    """W[c, i] = length of the overlap of output cell c and native cell i along one axis (cells centred on their node)."""
    o_lo = o_origin + (np.arange(o_n) - 0.5) * o_step; o_hi = o_lo + o_step
    n_lo = n_origin + (np.arange(n_n) - 0.5) * n_step; n_hi = n_lo + n_step
    return np.clip(np.minimum(o_hi[:, None], n_hi[None, :]) - np.maximum(o_lo[:, None], n_lo[None, :]), 0, None)


def regrid_labels(lab, g, out_axes, out_origin, out_step):
    """Native labels -> the output grid; each output voxel takes the label covering most of its volume, ties to the
    lower label value. Exact box overlaps (separable), per label, over that label's bounding box."""
    on = [len(a) for a in out_axes]                       # (ni, nj, nk)
    Wk = overlap_matrix(out_origin[2], out_step, on[2], g.origin[2], g.sp[2], g.shape[0])
    Wj = overlap_matrix(out_origin[1], out_step, on[1], g.origin[1], g.sp[1], g.shape[1])
    Wi = overlap_matrix(out_origin[0], out_step, on[0], g.origin[0], g.sp[0], g.shape[2])
    best = np.full((on[2], on[1], on[0]), -1.0); res = np.zeros(best.shape, lab.dtype)
    for v in np.unique(lab):                              # ascending: a tie keeps the lower value
        m = lab == v
        bb = ndi.find_objects(m.astype(np.uint8))[0]
        sub = m[bb].astype(np.float64)
        wk, wj, wi = Wk[:, bb[0]], Wj[:, bb[1]], Wi[:, bb[2]]
        ok = np.nonzero(wk.sum(1) > 0)[0]; oj = np.nonzero(wj.sum(1) > 0)[0]; oi = np.nonzero(wi.sum(1) > 0)[0]
        if not (len(ok) and len(oj) and len(oi)):
            continue
        c = np.tensordot(wk[ok], sub, axes=(1, 0))
        c = np.tensordot(wj[oj], c, axes=(1, 1))             # (oj, ok, i)
        c = np.tensordot(wi[oi], c, axes=(1, 2))             # (oi, oj, ok)
        c = c.transpose(2, 1, 0)
        ix = np.ix_(ok, oj, oi)
        upd = c > best[ix]
        best[ix] = np.where(upd, c, best[ix])
        res[ix] = np.where(upd, v, res[ix])
    return res


def stage_export(npz='air.npz', report='air-report.json', cand=None, note='RS1: seed-tip-only native-grid air labels (as-scanned frame); not served',
                 report_out='export-report.json'):
    cand = cand or CAND
    g, ct, hull, keep = load_work()
    rep = json.load(open(os.path.join(RS, report)))
    lab = np.load(os.path.join(RS, npz))['labels']
    r, a, s = S.grid_axes()
    origin = (S.BOX['r'][0], S.BOX['a'][0], S.BOX['s'][0])
    out_lab = regrid_labels(lab, g, (r, a, s), origin, S.STEP)
    # CT on the served grid (trilinear at the output nodes), masked like ssb/ct
    R, A_, Z = np.meshgrid(r, a, s, indexing='ij')
    idx = np.stack([(Z - g.origin[2]) / g.sp[2], (A_ - g.origin[1]) / g.sp[1], (R - g.origin[0]) / g.sp[0]])
    ct_o = ndi.map_coordinates(ct, idx, order=1, cval=0).transpose(2, 1, 0)
    keep_o = ndi.map_coordinates(keep.astype(np.uint8), idx, order=0, cval=0).transpose(2, 1, 0).astype(bool)
    ct_out = np.where(keep_o, np.clip(np.round(ct_o), 0, 255), 0).astype(np.uint8)
    os.makedirs(cand, exist_ok=True)
    write_gz(os.path.join(cand, 'ct.u8.gz'), np.ascontiguousarray(ct_out).tobytes())
    write_gz(os.path.join(cand, 'labels.u16.gz'), np.ascontiguousarray(out_lab).astype('<u2').tobytes())
    served_hdr = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    nz, ny, nx = out_lab.shape
    hdr = {k: served_hdr[k] for k in ('version', 'spacing', 'affine', 'affineNote', 'dtype', 'values', 'windows')}
    hdr.update({'dims': [nx, ny, nz], 'labels': {'file': 'labels.u16.gz', 'dtype': 'uint16', 'table': 'labels.json'},
                'specimen': 'uw-axial-sagittal', 'candidate': note,
                'license': 'ssb/LICENSE-data.md'})
    assert nx == served_hdr['dims'][0] and ny == served_hdr['dims'][1] and nz == served_hdr['dims'][2], 'grid differs from ssb/ct'
    write_json(os.path.join(cand, 'ct.json'), hdr)
    used = sorted(int(v) for v in np.unique(out_lab) if v)
    byidx = {v: k for k, v in rep['index'].items()}
    write_json(os.path.join(cand, 'labels.json'), {'version': 1, 'labels': {str(v): byidx[v] for v in used}})
    # frame check against the as-scanned head's own CT: same grid, so a laterality or frame error shows as a low correlation
    frame = {}
    try:
        raw = gzip.decompress(subprocess.run(['git', 'show', '%s:ssb/ct/ct.u8.gz' % AS_SCANNED_COMMIT], cwd=REPO, check=True,
                                             capture_output=True).stdout)
        ref = np.frombuffer(raw, np.uint8).reshape(ct_out.shape)
        both = (ref > 0) & (ct_out > 0)
        fx = np.fliplr(ref.transpose(2, 1, 0)).transpose(2, 1, 0)      # a mirrored copy, to show the check can tell
        frame = {'voxels_compared': int(both.sum()),
                 'mean_abs_display_diff': round(float(np.abs(ref[both].astype(float) - ct_out[both]).mean()), 3),
                 'corr_with_as_scanned_ct': round(float(np.corrcoef(ref[both], ct_out[both])[0, 1]), 5),
                 'corr_with_mirrored_as_scanned_ct': round(float(np.corrcoef(fx[both], ct_out[both])[0, 1]), 5),
                 'ref': 'ssb/ct/ct.u8.gz at %s' % AS_SCANNED_COMMIT[:8]}
    except subprocess.CalledProcessError as e:
        frame = {'skipped': 'git show failed: %s' % e}
    # agreement of each air label with today's (as-scanned) label of the same name: Dice on the shared 0.5 mm grid
    dice = {}
    try:
        gitb = lambda f: subprocess.run(['git', 'show', '%s:%s' % (AS_SCANNED_COMMIT, f)], cwd=REPO, check=True, capture_output=True).stdout
        today = np.frombuffer(gzip.decompress(gitb('ssb/ct/labels.u16.gz')), '<u2').reshape(out_lab.shape)
        ttab = {v: int(k) for k, v in json.loads(gitb('ssb/geometry/labels.json'))['labels'].items()}
        for v in used:
            name = byidx[v]
            a_, b_ = out_lab == v, today == ttab.get(name, -1)
            dice[name] = round(float(2 * (a_ & b_).sum() / max(1, a_.sum() + b_.sum())), 3)
    except subprocess.CalledProcessError as e:
        dice = {'skipped': 'git show failed: %s' % e}
    write_json(os.path.join(RS, report_out), {'labels_used': {byidx[v]: int((out_lab == v).sum()) for v in used},
                                                        'frame_check': frame, 'dice_vs_today_as_scanned': dice})
    print('wrote candidate/ (%d labels); frame check: %s' % (len(used), frame))


# ---------------------------------------------------------------- stage: score
def run_score(labels, tol, out):
    cmd = [sys.executable, '-I', SCORE_PY, '--labels', labels, '--tol', str(tol), '--json', out]
    cmd += ['--declared', DECLARED]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode:
        sys.exit(p.stderr)
    return p.stdout


def stage_score():
    parts = {}
    for name, labels in (('candidate', CAND), ('baseline_as_scanned', 'as-scanned')):
        for tol in (1, 6):
            out = os.path.join(RS, 'score-%s-tol%d.json' % (name, tol))
            txt = run_score(labels, tol, out)
            open(os.path.join(RS, 'score-%s-tol%d.txt' % (name, tol)), 'w').write(txt)
            d = json.load(open(out))
            parts.setdefault(name, {})['tol%d' % tol] = d[labels]
            if name == 'candidate':
                parts['coverage'] = d.get('coverage')
    cmp = []
    for tol in (1, 6):
        base = {r['structure']: r for r in parts['baseline_as_scanned']['tol%d' % tol]['identity']}
        for r in parts['candidate']['tol%d' % tol]['identity']:
            b = base.get(r['structure'])
            if not b or not r['labeled'] and not b['labeled']:
                continue
            if r['n'] == 0:
                continue
            rate = r['hit'] / r['n']
            cmp.append({'tol': tol, 'structure': r['structure'], 'n': r['n'], 'candidate_hit': r['hit'], 'candidate_rate': round(rate, 3),
                        'baseline_hit': b['hit'], 'baseline_rate': round(b['hit'] / b['n'], 3) if b['n'] else None,
                        'baseline_ci': [round(x, 3) for x in b['ci']],
                        'candidate_labeled': r['labeled'], 'baseline_labeled': b['labeled'],
                        'within_baseline_ci_or_better': bool(b['n'] and (rate >= b['ci'][0]))})
    write_json(os.path.join(RS, 'score-RS1.json'), {'candidate': parts['candidate'], 'baseline_as_scanned': parts['baseline_as_scanned'],
                                                    'coverage': parts['coverage'], 'comparison': cmp})
    print(open(os.path.join(RS, 'score-candidate-tol1.txt')).read())
    print('wrote score-RS1.json')


# ---------------------------------------------------------------- stage: sheets (RS2, section 7.2.2)
SHEETS = os.path.join(HERE, 'rs', 'sheets.json')
AXES = {'r': 0, 'a': 1, 's': 2}


def sheet_config():
    return json.load(open(SHEETS))


def sheetness(ct, g, F):
    """Multiscale Hessian plate measure of the working volume (scale-normalised, in mm). Only voxels whose smoothed
    intensity reaches `min_peak_display` are evaluated: a lamella is a ridge of tissue between two air spaces. For each
    voxel, l1, l2, l3 are the Hessian eigenvalues sorted by |value|; a bright plate has l1 << 0 and |l2|, |l3| small:
    response = exp(-(|l2|/|l1|)^2 / 2 alpha^2) * (1 - exp(-(l1^2 + l2^2 + l3^2) / 2 c^2)), max over scales.
    Returns the response (dense) and the plate normal (z, y, x components, float16) at the winning scale."""
    samp = (g.sp[2], g.sp[1], g.sp[0])
    sm = ndi.gaussian_filter(ct, [min(F['sigmas_mm']) / h for h in samp])
    idx = np.flatnonzero(sm >= F['min_peak_display'])
    R = np.zeros(ct.size, np.float32)
    N = np.zeros((ct.size, 3), np.float16)
    for sig in F['sigmas_mm']:
        H = np.empty((len(idx), 3, 3), np.float32)
        for a in range(3):
            for b in range(a, 3):
                o = [0, 0, 0]; o[a] += 1; o[b] += 1
                d = ndi.gaussian_filter(ct, [sig / h for h in samp], order=o, mode='nearest') * (sig ** 2 / (samp[a] * samp[b]))
                H[:, a, b] = H[:, b, a] = d.ravel()[idx]
        w, v = np.linalg.eigh(H)
        order = np.argsort(-np.abs(w), axis=1)
        w = np.take_along_axis(w, order, 1)
        v1 = v[np.arange(len(idx)), :, order[:, 0]]
        rs = np.abs(w[:, 1]) / (np.abs(w[:, 0]) + 1e-6)
        s2 = (w ** 2).sum(1)
        resp = np.where(w[:, 0] < 0, np.exp(-rs ** 2 / (2 * F['alpha_plate'] ** 2)) * (1 - np.exp(-s2 / (2 * F['c_display'] ** 2))), 0)
        better = resp > R[idx]
        R[idx[better]] = resp[better]
        N[idx[better]] = v1[better]
    return R.reshape(ct.shape), N.reshape(ct.shape + (3,))


def _offsets(samp, link_mm):
    reach = np.ceil(link_mm / samp).astype(int)
    d = [np.array(o) - reach for o in np.ndindex(*(2 * reach + 1))]
    return [x for x in d if x.any() and np.linalg.norm(x * samp) <= link_mm]


def _nbr(vox, nid, shape, d):
    """Indices (i, j) of the voxel pairs (vox[i], vox[i] + d = vox[j]) that are both in the set `nid` indexes."""
    q = vox + d
    j = np.full(len(vox), -1)
    inb = np.all((q >= 0) & (q < np.array(shape)), axis=1)
    j[inb] = nid[tuple(q[inb].T)]
    ii = np.nonzero(j >= 0)[0]
    return ii, j[ii]


def split_patches(vox, nv, comp, R, g, F):
    """A component larger than `patch_split_min_area_mm2` is a shell (the skull base, a sinus wall chain that runs round
    its own corners), not a lamella: it is split into planar patches, each grown from its strongest voxel over `link_mm`
    neighbours while the plate normal stays within `patch_angle_deg` of the patch's own running mean. Smaller components
    (the lamellae) are left whole. Deterministic: seeds in order of response, ties by voxel index."""
    from scipy import sparse
    samp = np.array([g.sp[2], g.sp[1], g.sp[0]])
    cell = float(np.prod(g.sp)) ** (2.0 / 3.0)
    sizes = np.bincount(comp)
    big = np.nonzero(sizes * cell >= F['patch_split_min_area_mm2'])[0]
    if not len(big):
        return comp
    sel = np.nonzero(np.isin(comp, big))[0]
    v, n, c = vox[sel], nv[sel], comp[sel]
    nid = -np.ones(R.shape, np.int64); nid[tuple(v.T)] = np.arange(len(v))
    rows, cols = [], []
    for d in _offsets(samp, F['link_mm']):
        ii, jj = _nbr(v, nid, R.shape, d)
        same = c[ii] == c[jj]
        rows.append(ii[same]); cols.append(jj[same])
    rows = np.concatenate(rows); cols = np.concatenate(cols)
    A = sparse.csr_matrix((np.ones(2 * len(rows), np.int8), (np.concatenate([rows, cols]), np.concatenate([cols, rows]))), shape=(len(v), len(v)))
    ptr, ind = A.indptr, A.indices
    cosT = math.cos(math.radians(F['patch_angle_deg']))
    resp = R[tuple(v.T)]
    order = np.lexsort((np.arange(len(v)), -resp))
    patch = -np.ones(len(v), np.int64)
    nxt = int(comp.max()) + 1
    for s0 in order:
        if patch[s0] >= 0:
            continue
        acc = n[s0].astype(np.float64).copy(); ref = acc.copy(); cnt = 1
        patch[s0] = nxt; stack = [s0]
        while stack:
            u = stack.pop()
            for w in ind[ptr[u]:ptr[u + 1]]:
                if patch[w] >= 0:
                    continue
                dot = float(n[w] @ ref)
                if abs(dot) >= cosT:
                    patch[w] = nxt; stack.append(w)
                    acc += n[w] * (1.0 if dot > 0 else -1.0); cnt += 1
                    ref = acc / np.linalg.norm(acc)
        nxt += 1
    comp = comp.copy(); comp[sel] = patch
    return comp


def ridge_components(R, N, g, F):
    """Medial surface (non-maximum suppression of R along the plate normal, hysteresis on 26-connected components), cut
    where the local orientation tensor is not planar (junctions, T-meetings), then split into components that are
    orientation-coherent (neighbours within `link_mm` whose normals differ by < `max_normal_angle_deg`)."""
    from scipy import sparse
    from scipy.sparse.csgraph import connected_components
    samp = np.array([g.sp[2], g.sp[1], g.sp[0]])
    cand = np.argwhere(R >= F['hysteresis_low'])
    nn = N[tuple(cand.T)].astype(np.float32)
    nn /= np.maximum(np.linalg.norm(nn, axis=1, keepdims=True), 1e-9)
    keep = np.ones(len(cand), bool)
    for sgn in (1, -1):
        v = ndi.map_coordinates(R, (cand + sgn * F['nms_step_mm'] * nn / samp).T, order=1, mode='nearest')
        keep &= R[tuple(cand.T)] >= v
    ridge = np.zeros(R.shape, bool)
    ridge[tuple(cand[keep].T)] = True
    cl, n = ndi.label(ridge, np.ones((3, 3, 3), bool))
    mx = ndi.maximum(R, cl, np.arange(1, n + 1))
    ok = np.zeros(n + 1, bool); ok[1:] = mx >= F['hysteresis_high']
    ridge &= ok[cl]
    vox = np.argwhere(ridge)
    nv = N[tuple(vox.T)].astype(np.float32)
    nv /= np.maximum(np.linalg.norm(nv, axis=1, keepdims=True), 1e-9)
    hw = [max(1, int(round(F['junction_radius_mm'] / h))) for h in samp]
    size = [2 * w + 1 for w in hw]
    cnt = np.maximum(ndi.uniform_filter(ridge.astype(np.float32), size, mode='constant'), 1e-6)
    M = np.zeros((len(vox), 3, 3), np.float32)
    for a in range(3):
        for b in range(a, 3):
            f = np.zeros(R.shape, np.float32); f[tuple(vox.T)] = nv[:, a] * nv[:, b]
            M[:, a, b] = M[:, b, a] = (ndi.uniform_filter(f, size, mode='constant') / cnt)[tuple(vox.T)]
    lam2 = np.linalg.eigvalsh(M)[:, 1]
    keepv = lam2 <= F['junction_lambda2']
    n_junction = int((~keepv).sum())
    vox_all, nv_all = vox, nv
    vox, nv = vox[keepv], nv[keepv]
    nid = -np.ones(R.shape, np.int64); nid[tuple(vox.T)] = np.arange(len(vox))
    offs = _offsets(samp, F['link_mm'])
    cosT = math.cos(math.radians(F['max_normal_angle_deg']))
    rows, cols = [], []
    for d in offs:
        if tuple(d) > (0, 0, 0):
            ii, jj = _nbr(vox, nid, R.shape, d)
            c = np.abs((nv[ii] * nv[jj]).sum(1)) >= cosT
            rows.append(ii[c]); cols.append(jj[c])
    rows = np.concatenate(rows); cols = np.concatenate(cols)
    _, comp = connected_components(sparse.coo_matrix((np.ones(len(rows), np.int8), (rows, cols)), shape=(len(vox), len(vox))), directed=False)
    # a cut voxel rejoins the component of its best-aligned non-cut neighbour within link_mm (when the normals differ by
    # less than junction_attach_angle_deg): a lamella keeps its own junction voxels, two lamellae are still not merged
    cut = np.nonzero(~keepv)[0]
    best = np.full(len(cut), -1, np.int64); bestd = np.full(len(cut), math.cos(math.radians(F['junction_attach_angle_deg'])))
    for d in offs:
        ii, jj = _nbr(vox_all[cut], nid, R.shape, d)
        dot = np.abs((nv_all[cut][ii] * nv[jj]).sum(1))
        up = dot > bestd[ii]
        bestd[ii[up]] = dot[up]; best[ii[up]] = comp[jj[up]]
    vox = np.concatenate([vox, vox_all[cut][best >= 0]]); nv = np.concatenate([nv, nv_all[cut][best >= 0]])
    comp = np.concatenate([comp, best[best >= 0]])
    comp = split_patches(vox, nv, comp, R, g, F)
    return vox, nv, comp, n_junction


class Comp:
    """One sheet component: voxel indices, RAS points (mm), the plate normal axis (r, a, s) and bookkeeping."""

    def __init__(self, cid, vox, nv, g, area_mm2_per_vox):
        self.id = cid
        self.g = g
        self.merged_ids = [int(cid)]
        self.vox = vox
        self.p = np.column_stack([g.origin[0] + g.sp[0] * vox[:, 2], g.origin[1] + g.sp[1] * vox[:, 1], g.origin[2] + g.sp[2] * vox[:, 0]])
        self.n = nv[:, ::-1]                                  # (z, y, x) -> (r, a, s)
        t = (self.n[:, :, None] * self.n[:, None, :]).mean(0)
        w, v = np.linalg.eigh(t)
        self.axis_vec = v[:, -1]                              # the mean plate normal (sign arbitrary)
        self.axis = np.abs(v[:, -1])                          # |r|, |a|, |s| of the mean plate normal
        self.apv = area_mm2_per_vox
        self.area = len(vox) * area_mm2_per_vox
        self.centroid = self.p.mean(0)
        self.side = 'R' if self.centroid[0] > 0 else 'L'

    @staticmethod
    def merge(cs):
        """One object from touching components (the patches of one wall): the largest one's id."""
        top = max(cs, key=lambda c: len(c.vox))
        m = Comp(top.id, np.concatenate([c.vox for c in cs]), np.concatenate([c.n[:, ::-1] for c in cs]), top.g, top.apv)
        m.merged_ids = sorted(int(c.id) for c in cs)
        return m

    def extent(self, ax):
        c = self.p[:, AXES[ax]]
        return float(np.percentile(c, 98) - np.percentile(c, 2))

    def end_mask(self, end, frac):
        """The voxels in the extreme `frac` of the component along `end` (lateral/medial use the side's sign)."""
        sg = 1.0 if self.side == 'R' else -1.0
        c = {'lateral': sg * self.p[:, 0], 'medial': -sg * self.p[:, 0], 'superior': self.p[:, 2], 'inferior': -self.p[:, 2],
             'anterior': self.p[:, 1], 'posterior': -self.p[:, 1]}[end]
        return c >= np.percentile(c, 100 * (1 - frac))

    def end(self, end, frac):
        return self.p[self.end_mask(end, frac)]

    def row(self):
        return {'id': int(self.id), 'merged_ids': self.merged_ids, 'side': self.side, 'n_vox': int(len(self.vox)), 'area_mm2': round(float(self.area), 1),
                'centroid_ras': [round(float(x), 1) for x in self.centroid], 'normal_abs_ras': [round(float(x), 2) for x in self.axis],
                'extent_mm': {k: round(self.extent(k), 1) for k in 'ras'}}


def assemble(comps, F, g, cell):
    """Fragments of one lamella (cut at a junction, or broken where the plate is thinner than the voxel) are rejoined: two
    components within `assemble_gap_mm` of each other whose plate normals differ by < `assemble_angle_deg` become one
    candidate. Smaller than the patch angle, so the patches of a bent shell are not glued back together."""
    from scipy.spatial import cKDTree
    pts = np.concatenate([c.p for c in comps]); cid = np.concatenate([np.full(len(c.p), i) for i, c in enumerate(comps)])
    pairs = cKDTree(pts).query_pairs(F['assemble_gap_mm'], output_type='ndarray')
    a, b = cid[pairs[:, 0]], cid[pairs[:, 1]]
    m = a != b
    ab = np.unique(np.sort(np.stack([a[m], b[m]], 1), axis=1), axis=0)
    ax = np.stack([c.axis_vec for c in comps])
    cosT = math.cos(math.radians(F['assemble_angle_deg']))
    par = list(range(len(comps)))
    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]; x = par[x]
        return x
    for i, j in ab:
        if abs(float(ax[i] @ ax[j])) >= cosT:
            par[find(i)] = find(j)
    groups = {}
    for i in range(len(comps)):
        groups.setdefault(find(i), []).append(comps[i])
    return [v[0] if len(v) == 1 else Comp.merge(v) for _, v in sorted(groups.items())]


class Ctx:
    """Everything a rule may look at: the working CT, RS1's air labels, the SEED tips, and the sheets named so far."""

    def __init__(self, g, ct, lab, index, tips):
        self.g, self.ct, self.lab, self.index, self.tips = g, ct, lab, index, tips
        self.samp = np.array([g.sp[2], g.sp[1], g.sp[0]])
        self.air = ct < S.AIR
        self.named = {}                  # (sheet, side) -> Comp
        self.ridge_pts = None; self.ridge_tree = None   # every ridge voxel, for targets that are 'whatever sheet is near X'
        self.best = {}                   # (sheet, side) -> the best-scoring candidate object, for the review sheet
        self.extra = {}                  # masks and point sets added by later steps (sphenoid air after the face, ...)
        self._c = {}

    def ras(self, vox):
        return np.column_stack([self.g.origin[0] + self.g.sp[0] * vox[:, 2], self.g.origin[1] + self.g.sp[1] * vox[:, 1],
                                self.g.origin[2] + self.g.sp[2] * vox[:, 0]])

    def label_mask(self, ids, side=None):
        side = None if side == '*' else side
        sides = (side,) if side else ('R', 'L', 'M')
        keys = ['%s.%s' % (i, sd) for i in ids for sd in sides]
        vals = [self.index[k] for k in keys if k in self.index]
        return np.isin(self.lab, vals) if vals else np.zeros(self.lab.shape, bool)

    def mask(self, name, side=None):
        side = None if side == '*' else side
        key = ('mask', name, side)
        if key in self.extra:
            return self.extra[key]
        if key not in self._c:
            if name == 'air':
                m = self.air
            elif name.startswith('labels:'):
                m = self.label_mask(name[7:].split(','), side)
            elif name in ('sphenoid_body_air', 'not_sphenoid_body_air'):
                m = self.label_mask(['s.sphenoid-sinus']) | self.sinus_only_pe()
                m = m if name == 'sphenoid_body_air' else self.air & ~m
            else:
                raise KeyError(name)
            self._c[key] = m
        return self._c[key]

    def sinus_only_pe(self):
        """Posterior-ethmoid-labelled air components that no air label but the sphenoid's and the posterior ethmoid's touches."""
        fam = [self.index[k] for k in ('s.sphenoid-sinus.R', 's.sphenoid-sinus.L', 's.posterior-ethmoid-cells.R', 's.posterior-ethmoid-cells.L')]
        pe = self.label_mask(['s.posterior-ethmoid-cells'])
        cl, n = ndi.label(pe)
        out = np.zeros(pe.shape, bool)
        for v in range(1, n + 1):
            m = cl == v
            if set(np.unique(self.lab[ndi.binary_dilation(m) & ~m]).tolist()) - {0} <= set(fam):
                out |= m
        return out

    def seeds(self, term, side=None):
        side = None if side == '*' else side
        pts = [p for p in self.tips.get(term, []) if side is None or (p[0] > 0) == (side == 'R')]
        return np.array(pts).reshape(-1, 3)

    def tree(self, spec, side):
        """cKDTree over a target point set (RAS mm), or None when the set is empty."""
        from scipy.spatial import cKDTree
        key = ('tree', spec, side)
        if key not in self._c:
            pts = self.points(spec, side)
            self._c[key] = cKDTree(pts) if len(pts) else None
        return self._c[key]

    def points(self, spec, side):
        side = None if side == '*' else side
        sg = 1 if side == 'R' else -1
        kind, _, arg = spec.partition(':')
        if kind == 'seed':
            return self.seeds(arg, side)
        if kind == 'air':                                         # the surface of the union of these RS1 labels, this side
            m = self.label_mask(arg.split(','), side)
            return self.ras(np.argwhere(m & ~ndi.binary_erosion(m)))
        if kind == 'ridge_near_seed':                              # every ridge voxel (any component) within r mm of this term's seed tips
            term, _, rad = arg.rpartition(':')
            sd = self.seeds(term, side)
            if not len(sd):
                return np.zeros((0, 3))
            near = np.unique(np.concatenate(self.ridge_tree.query_ball_point(sd, float(rad)))).astype(int)
            return self.ridge_pts[near]
        if kind == 'sheet':
            return np.concatenate([c.p for (n, sd), c in sorted(self.named.items()) if n == arg and (side is None or sd == side)] or [np.zeros((0, 3))])
        if spec == 'lamina_papyracea' or spec == 'skull_base':    # the lateral / upper limit of this side's ethmoid air
            m = self.mask('labels:s.anterior-ethmoid-cells,s.posterior-ethmoid-cells,s.ethmoid-bulla,s.agger-nasi-cell,s.frontal-recess', side)
            if spec == 'lamina_papyracea':
                ii = np.arange(m.shape[2])[None, None, :]
                key = np.where(m, ii * sg, -10 ** 6)
                sel = key.argmax(axis=2)
                kk, jj = np.nonzero(m.any(axis=2))
                return self.ras(np.column_stack([kk, jj, sel[kk, jj]]))
            kk = np.arange(m.shape[0])[:, None, None]
            sel = np.where(m, kk, -1).max(axis=0)
            jj, ii = np.nonzero(m.any(axis=0))
            return self.ras(np.column_stack([sel[jj, ii], jj, ii]))
        if spec in self.extra:
            return self.extra[spec]
        raise KeyError(spec)


def in_mask(ctx, m, idx):
    c = np.clip(np.rint(idx).astype(int), 0, np.array(m.shape) - 1)
    return m[tuple(c.T)]


def eval_rule(rule, c, ctx, sheet_side=None):
    """-> (ok, measured value, what was needed). Every number is a parameter of the rule in sheets.json."""
    t, side = rule['type'], sheet_side or c.side
    F = ctx.F
    if t == 'any_of':
        res = [eval_rule(r, c, ctx, side) for r in rule['rules']]
        return any(r[0] for r in res), [r[1] for r in res], 'any of %d' % len(res)
    if t == 'area_min_mm2':
        return c.area >= rule['value'], round(float(c.area), 1), '>= %g mm2' % rule['value']
    if t == 'extent_min_mm':
        v = c.extent(rule['axis']); return v >= rule['value'], round(v, 1), '%s extent >= %g mm' % (rule['axis'], rule['value'])
    if t == 'normal_abs':
        v = float(c.axis[AXES[rule['axis']]])
        ok = (v >= rule['min']) if 'min' in rule else (v <= rule['max'])
        return ok, round(v, 2), '|n_%s| %s %g' % (rule['axis'], '>=' if 'min' in rule else '<=', rule.get('min', rule.get('max')))
    if t == 'reaches':
        e = c.end(rule['end'], F['end_fraction'])
        tr = ctx.tree(rule['target'], side)
        if tr is None:
            return False, None, 'target %s empty on side %s' % (rule['target'], side)
        d = float(tr.query(e)[0].min())
        return d <= rule['within_mm'], round(d, 2), '%s end within %g mm of %s' % (rule['end'], rule['within_mm'], rule['target'])
    if t == 'abs_r_vs_seed':
        pts = ctx.seeds(rule['term'], side)
        if not len(pts):
            return False, None, 'no seed tips of %s on side %s' % (rule['term'], side)
        ref = float(np.median(np.abs(pts[:, 0]))); v = float(np.median(np.abs(c.p[:, 0])))
        ok = v >= ref + rule['margin_mm'] if rule['relation'] == 'greater' else v <= ref - rule['margin_mm']
        return ok, round(v - ref, 1), 'median |r| %s the %s seeds by %g mm' % (rule['relation'], rule['term'], rule['margin_mm'])
    if t == 'abs_r_vs_air_band':
        m = ctx.label_mask([rule['label']], side)
        if not m.any():
            return False, None, 'no %s air on side %s' % (rule['label'], side)
        top = np.nonzero(m.any(axis=(1, 2)))[0].max()
        k0 = max(0, top - int(round(rule['band_mm'] / ctx.samp[0])))
        ref = float(np.median(np.abs(ctx.ras(np.argwhere(m[k0:top + 1]) + [k0, 0, 0])[:, 0])))
        v = float(np.median(np.abs(c.p[:, 0])))
        return v <= ref - rule['margin_mm'], round(v - ref, 1), 'median |r| less than the top %g mm of %s by %g mm' % (rule['band_mm'], rule['label'], rule['margin_mm'])
    if t == 'relative_to_sheet':
        o = ctx.named.get((rule['sheet'], side))
        if o is None:
            return False, None, 'depends on %s, not named on side %s' % (rule['sheet'], side)
        gap = float(o.centroid[1] - c.centroid[1])
        return gap >= rule['min_gap_mm'], round(gap, 1), 'centroid posterior to %s by >= %g mm' % (rule['sheet'], rule['min_gap_mm'])
    if t == 'probe':
        pts, nrm = c.vox, c.n
        if rule['points'].startswith('end:'):
            m = c.end_mask(rule['points'][4:], F['end_fraction'])
            pts, nrm = pts[m], nrm[m]
        if rule.get('interior_mm'):       # the sheet's interior: farther than interior_mm from any ridge voxel of another sheet
            own = np.isin(ctx.ridge_flat, np.ravel_multi_index(c.vox.T, ctx.lab.shape))
            from scipy.spatial import cKDTree
            far = cKDTree(ctx.ridge_pts[~own]).query(ctx.ras(pts))[0] > rule['interior_mm']
            pts, nrm = pts[far], nrm[far]
        nz = nrm[:, ::-1] / ctx.samp
        mk = ctx.mask(rule['in'], side if rule.get('sided') else None)
        steps = np.arange(0.35, rule['probe_mm'] + 1e-6, 0.35)
        sgn_a = np.where(nrm[:, 1] > 0, -1.0, 1.0)[:, None]        # +1 points posteriorly (decreasing a)

        def ray(direction):                       # any sample within probe_mm along the plate normal lies in the mask
            hit = np.zeros(len(pts), bool)
            for st in steps:
                hit |= in_mask(ctx, mk, pts + direction * st * nz)
            return hit
        if rule['dir'] == 'both':
            hit = ray(1.0) & ray(-1.0)
        else:
            hit = ray(sgn_a if rule['dir'] == 'posterior' else -sgn_a)
        v = float(hit.mean()) if len(hit) else 0.0
        return v >= rule['min_fraction'], round(v, 2), 'fraction of %s points (interior only: %s) with %s within %g mm along the normal (%s) >= %g' % (rule['points'], rule.get('interior_mm'), rule['in'], rule['probe_mm'], rule['dir'], rule['min_fraction'])
    if t == 'inside_mask':
        m = ctx.mask(rule['mask'], side if rule.get('sided') else None)
        key = ('dil', rule['mask'], rule['dilate_mm'])
        if key not in ctx._c:
            ctx._c[key] = ndi.distance_transform_edt(~m, sampling=tuple(ctx.samp)) <= rule['dilate_mm']
        v = float(in_mask(ctx, ctx._c[key], c.vox).mean())
        return v >= rule['min_fraction'], round(v, 2), 'fraction within %g mm of %s >= %g' % (rule['dilate_mm'], rule['mask'], rule['min_fraction'])
    if t == 'separates_air':
        return separates(rule, c, ctx, side)
    raise KeyError(t)


def eth_refs(ctx, side, R):
    """RS1's anterior and posterior ethmoid air of this side, and the reference voxels on each side of the basal lamella:
    anterior = air touching the agger, bulla and frontal-recess labels or within `ref_mm` of an anterior ethmoid seed tip,
    posterior = within `ref_mm` of a posterior ethmoid seed tip. SEED tips only."""
    E = ctx.mask('labels:s.anterior-ethmoid-cells,s.posterior-ethmoid-cells', side)
    near = lambda pts: (np.zeros(E.shape, bool) if not len(pts) else _near_pts(ctx, pts, R['ref_mm']))
    ant_air = ctx.mask('labels:s.agger-nasi-cell,s.ethmoid-bulla,s.frontal-recess', side)
    ant = (E & ndi.binary_dilation(ant_air, iterations=2)) | (E & near(np.concatenate([ctx.seeds(t, side) for t in R['anterior_terms']])))
    post = E & near(np.concatenate([ctx.seeds(t, side) for t in R['posterior_terms']]))
    return E, ant, post


def _near_pts(ctx, pts, r_mm):
    m = np.zeros(ctx.lab.shape, bool)
    for p in pts:
        c = np.round(ctx.g.index(p)).astype(int)
        hw = np.ceil(r_mm / ctx.samp).astype(int)
        lo = np.maximum(c - hw, 0); hi = np.minimum(c + hw + 1, m.shape)
        if np.any(lo >= hi):
            continue
        kk, jj, ii = np.mgrid[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]]
        d2 = ((kk - c[0]) * ctx.samp[0]) ** 2 + ((jj - c[1]) * ctx.samp[1]) ** 2 + ((ii - c[2]) * ctx.samp[2]) ** 2
        m[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]] |= d2 <= r_mm * r_mm
    return m


def barrier_of(ctx, c, vox_dilate):
    b = np.zeros(ctx.lab.shape, bool); b[tuple(c.vox.T)] = True
    return ndi.binary_dilation(b, iterations=vox_dilate) if vox_dilate else b


def separates(rule, c, ctx, side):
    """No 6-connected air path between the anterior and the posterior ethmoid references avoids the sheet (dilated by
    `barrier_vox`); reported with whether the two were connected WITHOUT it, so a vacuous pass shows."""
    E, ant, post = eth_refs(ctx, side, rule)
    if not ant.any() or not post.any():
        return False, None, 'a reference set is empty (anterior %d, posterior %d voxels)' % (ant.sum(), post.sum())
    def joined(mask):
        cl, _ = ndi.label(mask)
        return bool(set(np.unique(cl[ant & mask])) & set(np.unique(cl[post & mask])) - {0})
    before = joined(E)
    after = joined(E & ~barrier_of(ctx, c, rule['barrier_vox']))
    return (not after), {'joined_without_sheet': before, 'joined_with_sheet': after}, 'anterior and posterior ethmoid references not joined with the sheet in place'


def in_roi(c, roi):
    ar = abs(c.centroid[0])
    return (roi['abs_r'][0] <= ar <= roi['abs_r'][1] and roi['a'][0] <= c.centroid[1] <= roi['a'][1] and roi['s'][0] <= c.centroid[2] <= roi['s'][1])


def candidates_for(spec, fragments, assembled, ctx):
    """The candidate list of one sheet: the globally assembled components, or, when the sheet names its own `clip_to_mask` /
    `assemble_gap_mm`, the fragments clipped to that region and assembled with the sheet's own gap and angle (a septum is
    a part of a longer plate: the nasal septum and the rostrum continue it)."""
    if 'clip_to_mask' not in spec and 'assemble_gap_mm' not in spec:
        return assembled
    cs = []
    for c in fragments:
        if 'clip_to_mask' in spec:
            cm = spec['clip_to_mask']
            m = ctx.mask(cm['mask'])
            key = ('dil', cm['mask'], cm['dilate_mm'])
            if key not in ctx._c:
                ctx._c[key] = ndi.distance_transform_edt(~m, sampling=tuple(ctx.samp)) <= cm['dilate_mm']
            ok = in_mask(ctx, ctx._c[key], c.vox)
            if ok.sum() < ctx.F['min_component_vox']:
                continue
            c = Comp(c.id, c.vox[ok], c.n[ok][:, ::-1], c.g, c.apv)
        cs.append(c)
    if not cs:
        return []
    F2 = dict(ctx.F, **{k: spec[k] for k in ('assemble_gap_mm', 'assemble_angle_deg') if k in spec})
    return assemble(cs, F2, ctx.g, None) if len(cs) > 1 else cs


def evaluate_sheet(name, spec, comps, ctx, side):
    """One object of sheets.json, one side. A component is NAMED only when exactly one candidate meets every rule
    (`dominance_ratio`, where given, is the one extra condition: the largest passing candidate must be that many times the
    next one's area, else none is named). Otherwise nothing is named and every candidate's per-rule scores are returned."""
    comps = candidates_for(spec, ctx.fragments, comps, ctx)
    pool = [c for c in comps if (side in (None, '*') or c.side == side) and in_roi(c, spec['roi']) and c.area >= spec['pool_min_area_mm2']]
    rows = []
    for c in pool:
        res, alive = [], True
        for rule in spec['rules']:
            if rule.get('late') and not alive:
                res.append({'rule': rule['name'], 'ok': None, 'value': None, 'need': 'not evaluated: an earlier rule failed'}); continue
            ok, val, need = eval_rule(rule, c, ctx, side)
            res.append({'rule': rule['name'], 'ok': bool(ok), 'value': val, 'need': need})
            alive &= bool(ok)
        rows.append({'comp': c, 'rules': res, 'passed': alive, 'n_ok': sum(1 for r in res if r['ok'])})
    passing = [r for r in rows if r['passed']]
    named = None
    groups = [[r['comp']] for r in passing]
    if 'merge_gap_mm' in spec and len(passing) > 1:      # patches of one wall that each pass touch: they are one lamella
        from scipy.spatial import cKDTree
        trees = [cKDTree(r['comp'].p) for r in passing]
        par = list(range(len(passing)))
        def find(x):
            while par[x] != x:
                par[x] = par[par[x]]; x = par[x]
            return x
        for i in range(len(passing)):
            for j in range(i + 1, len(passing)):
                if trees[i].query(passing[j]['comp'].p)[0].min() <= spec['merge_gap_mm']:
                    par[find(i)] = find(j)
        by = {}
        for i, r in enumerate(passing):
            by.setdefault(find(i), []).append(r['comp'])
        groups = list(by.values())
    if len(groups) == 1:
        named = groups[0][0] if len(groups[0]) == 1 else Comp.merge(groups[0])
    elif len(passing) > 1 and 'dominance_ratio' in spec:
        a = sorted(passing, key=lambda r: -r['comp'].area)
        if a[0]['comp'].area >= spec['dominance_ratio'] * a[1]['comp'].area:
            named = a[0]['comp']
    rows.sort(key=lambda r: (-r['n_ok'], -r['comp'].area))
    ctx.best[(name, side)] = rows[0]['comp'] if rows else None
    top = [{'comp': r['comp'].row(), 'n_rules_ok': r['n_ok'], 'of': len(spec['rules']), 'passed_all': r['passed'], 'rules': r['rules']}
           for r in rows[:spec.get('report_top', 6)]]
    return named, {'sheet': name, 'side': side, 'candidates_in_pool': len(pool), 'passing_all_rules': len(passing),
                   'passing_groups_after_touching_merge': len(groups) if passing else 0,
                   'named_component': named.row() if named else None,
                   'status': 'named' if named else ('unassigned: %s' % ('no candidate meets every rule' if not passing else 'more than one candidate meets every rule')),
                   'top_candidates': top}, rows


def fit_surface(p, dep, deg):
    """Least-squares height field dep = f(x, y) of a named sheet's points, degree 1 or 2 (`dep` is the axis letter)."""
    xs = [k for k in 'ras' if k != dep]
    X, Y, Z = p[:, AXES[xs[0]]], p[:, AXES[xs[1]]], p[:, AXES[dep]]
    def cols(x, y):
        x, y = np.broadcast_arrays(x, y)
        return np.stack([np.ones_like(x), x, y] + ([x * x, x * y, y * y] if deg == 2 else []), -1)
    beta = np.linalg.lstsq(cols(X, Y), Z, rcond=None)[0]
    return (lambda x, y: cols(np.asarray(x, float), np.asarray(y, float)) @ beta), [round(float(b), 5) for b in beta]


def vol_cm3(ctx, m):
    return round(float(m.sum()) * float(np.prod(ctx.g.sp)) / 1000.0, 3)


def sphenoid_steps(cfg, comps, ctx, rep, lab2, index, out):
    """Sphenoid face -> everything posterior to it within the body is sphenoid; intersinus septum -> the R/L split."""
    g = ctx.g
    r_ax, a_ax, s_ax = g.axes()
    Rr, Aa, Ss = r_ax[None, None, :], a_ax[None, :, None], s_ax[:, None, None]
    sph_ids = [index['s.sphenoid-sinus.R'], index['s.sphenoid-sinus.L']]
    pe_ids = [index['s.posterior-ethmoid-cells.R'], index['s.posterior-ethmoid-cells.L']]
    spec = cfg['sheets']['sphenoid-face']
    fc, info, _ = evaluate_sheet('sphenoid-face', spec, comps, ctx, '*')
    out['sheets']['sphenoid-face.M'] = info
    rule = cfg['rules']['sphenoid_body']
    s_arch = rep['choanal_arch_s_mm']
    sph0 = np.isin(lab2, sph_ids); pe0 = np.isin(lab2, pe_ids)
    moved = np.zeros(lab2.shape, bool); moved_side = np.zeros(lab2.shape, np.int8); onodi, kept = [], []
    anterior_sph = np.zeros(lab2.shape, bool); post = np.zeros(lab2.shape, bool); fcols = None
    if fc is not None:
        ctx.named[('sphenoid-face', 'M')] = fc
        # the face as a height field a = f(r, s): the mean a of its voxels in each (s, r) column, filled from the nearest column
        # within face_fill_mm (the ostium and the gaps between patches); no plane is extended beyond what the sheet covers
        acc = np.zeros((len(s_ax), len(r_ax))); cnt = np.zeros(acc.shape)
        np.add.at(acc, (fc.vox[:, 0], fc.vox[:, 2]), fc.p[:, 1]); np.add.at(cnt, (fc.vox[:, 0], fc.vox[:, 2]), 1)
        has = cnt > 0
        d, (ik, ii0) = ndi.distance_transform_edt(~has, sampling=(g.sp[2], g.sp[0]), return_indices=True)
        fv = np.where(has, acc / np.maximum(cnt, 1), (acc / np.maximum(cnt, 1))[ik, ii0])
        f = np.where(d <= rule['face_fill_mm'], fv, np.nan)[:, None, :]
        ok = ~np.isnan(f)
        post = ok & (Aa < f - rule['face_gap_mm']) & (Ss >= s_arch)
        anterior_sph = sph0 & ok & (Aa >= f - rule['face_gap_mm'])
        fcols = {'columns_on_the_sheet': int(has.sum()), 'columns_filled_within_face_fill_mm': int(((d <= rule['face_fill_mm']) & ~has).sum())}
        pe_cl, n = ndi.label(pe0)
        sinus_family = set(sph_ids) | set(pe_ids)
        for v in range(1, n + 1):
            m = pe_cl == v
            nb = set(np.unique(lab2[ndi.binary_dilation(m) & ~m]).tolist()) - {0}
            sinus_only = nb <= sinus_family            # no air label but the sphenoid's and the posterior ethmoid's touches it
            defined = m & ok
            cover = float(defined.sum()) / float(m.sum())
            fr = float((post & m).sum()) / float(max(1, defined.sum()))
            kk, jj, ii = np.nonzero(m)
            row = {'cm3': vol_cm3(ctx, m), 'side': 'R' if r_ax[ii].mean() > 0 else 'L', 'face_defined_over_fraction': round(cover, 3), 'fraction_posterior_where_defined': round(fr, 3),
                   'touches_only_sphenoid_or_posterior_ethmoid_air': sinus_only, 'neighbour_air_labels': sorted(k for k, vv in index.items() if vv in nb and vv not in sinus_family),
                   'centroid_ras': [round(float(r_ax[ii].mean()), 1), round(float(a_ax[jj].mean()), 1), round(float(s_ax[kk].mean()), 1)]}
            if sinus_only and cover >= rule['min_cover_fraction'] and fr >= rule['posterior_fraction']:
                moved |= m; moved_side[m] = 1 if r_ax[ii].mean() > 0 else -1     # the side of the component's centroid, until a septum decides
                row['decision'] = 'moved to s.sphenoid-sinus (posterior to the face, reached only through the sinus)'; kept.append(row)
            elif (post & m).sum() * np.prod(g.sp) / 1000.0 >= rule['report_min_cm3']:
                row['posterior_to_face_cm3'] = vol_cm3(ctx, post & m)
                row['decision'] = 'reported for RS3; not decided here (ruling: a cell that crosses the face is not RS2\'s call)'; onodi.append(row)
    lab2[moved & (moved_side > 0)] = index['s.sphenoid-sinus.R']; lab2[moved & (moved_side < 0)] = index['s.sphenoid-sinus.L']
    pe_after = np.isin(lab2, pe_ids)
    out['sphenoid_face'] = {'named': fc is not None, 'height_field': fcols, 'face_gap_mm': rule['face_gap_mm'], 'face_fill_mm': rule['face_fill_mm'],
                            'moved_posterior_ethmoid_to_sphenoid_cm3': vol_cm3(ctx, moved), 'moved_components': kept,
                            'sphenoid_air_anterior_to_face_cm3': vol_cm3(ctx, anterior_sph),
                            'posterior_ethmoid_air_posterior_to_face_after_cm3': vol_cm3(ctx, pe_after & post),
                            'cells_crossing_the_face_reported_not_decided': onodi}
    sph_all = np.isin(lab2, sph_ids)
    ctx.lab = lab2; ctx._c = {}
    ctx.extra[('mask', 'sphenoid_air', None)] = sph_all
    kk, jj, ii = np.nonzero(sph_all)
    pw = np.full((len(s_ax), len(r_ax)), 10 ** 6); np.minimum.at(pw, (kk, ii), jj)
    k2, i2 = np.nonzero(pw < 10 ** 6)
    ctx.extra['sphenoid_posterior_wall'] = ctx.ras(np.column_stack([k2, pw[k2, i2], i2]))
    sw = np.full((len(a_ax), len(r_ax)), -1); np.maximum.at(sw, (jj, ii), kk)
    j2, i2 = np.nonzero(sw >= 0)
    ctx.extra['sphenoid_superior_wall'] = ctx.ras(np.column_stack([sw[j2, i2], j2, i2]))
    # the intersinus septum: the dominant sagittal sheet inside the body; accessory septa are the other passers
    sspec = cfg['sheets']['intersinus-septum']
    sep, info, rows = evaluate_sheet('intersinus-septum', sspec, comps, ctx, '*')
    out['sheets']['intersinus-septum.M'] = info
    acc = [r['comp'] for r in rows if r['passed'] and r['comp'] is not sep] if sep is not None else []     # accessory: besides a named main septum
    out['accessory_septa'] = [c.row() for c in acc]
    ssp = cfg['rules']['sphenoid_septum']
    if sep is not None:
        ctx.named[('intersinus-septum', 'M')] = sep
        fn, beta = fit_surface(sep.p, 'r', ssp['fit_degree'])
        hs = np.full((len(s_ax), len(a_ax)), np.nan)
        cnt = np.zeros(hs.shape); acc_r = np.zeros(hs.shape)
        np.add.at(cnt, (sep.vox[:, 0], sep.vox[:, 1]), 1); np.add.at(acc_r, (sep.vox[:, 0], sep.vox[:, 1]), sep.p[:, 0])
        has = cnt > 0; hs[has] = acc_r[has] / cnt[has]
        d, (ik, ij) = ndi.distance_transform_edt(~has, sampling=(g.sp[2], g.sp[1]), return_indices=True)
        near = d <= ssp['extend_near_mm']
        K, J = np.meshgrid(np.arange(len(s_ax)), np.arange(len(a_ax)), indexing='ij')
        plane = fn(a_ax[J], s_ax[K])
        h = np.where(has, hs, np.where(near, hs[ik, ij], plane))
        col_has = sph_all.any(axis=2)
        n_sheet, n_near, n_plane = int((col_has & has).sum()), int((col_has & ~has & near).sum()), int((col_has & ~has & ~near).sum())
        side_R = Rr > h[:, :, None]
        for side, sel in (('R', side_R), ('L', ~side_R)):
            lab2[sph_all & sel] = index['s.sphenoid-sinus.' + side]
        out['sphenoid_septum'] = {'named': True, 'method': 'the sheet\'s own surface where it exists, nearest sheet column within extend_near_mm, '
                                  'else the plane fit of the sheet extended', 'plane_fit_r_of_a_s': beta, 'extend_near_mm': ssp['extend_near_mm'],
                                  'sphenoid_columns_(k,j)': {'on_the_sheet': n_sheet, 'nearest_sheet_column': n_near, 'plane_extension_beyond': n_plane,
                                                              'fraction_extended_by_plane': round(n_plane / max(1, n_sheet + n_near + n_plane), 3),
                                                              'fraction_not_on_sheet': round((n_near + n_plane) / max(1, n_sheet + n_near + n_plane), 3)},
                                  'dominance_ratio': sspec['dominance_ratio']}
    else:
        # no septum: RS1's tip-seeded split stays for RS1's voxels; a moved component keeps the side of its centroid
        out['sphenoid_septum'] = {'named': False, 'split': 'RS1 tip-seeded watershed kept (front/back, not left/right); a moved component takes the side of its centroid'}
    return fc, sep, acc



def split_ethmoid(ctx, side, c, rule, lab2, index):
    """Replace the proxy plane on this side: anterior | posterior ethmoid air split at the NAMED basal lamella."""
    E, ant, post = eth_refs(ctx, side, rule)
    barrier = barrier_of(ctx, c, rule['barrier_vox'])
    free = E & ~barrier
    markers = np.zeros(E.shape, np.int32); markers[ant & free] = 1; markers[post & free & ~ant] = 2
    dist = ndi.distance_transform_edt(ctx.air, sampling=tuple(ctx.samp))
    ws = watershed(-dist, markers, mask=free, connectivity=1)
    ws = watershed(-dist, ws, mask=E, connectivity=1)
    a_i, p_i = index['s.anterior-ethmoid-cells.' + side], index['s.posterior-ethmoid-cells.' + side]
    before = (lab2 == a_i), (lab2 == p_i)
    lab2[(ws == 1)] = a_i; lab2[(ws == 2)] = p_i
    return {'side': side, 'anterior_cm3': [vol_cm3(ctx, before[0]), vol_cm3(ctx, lab2 == a_i)],
            'posterior_cm3': [vol_cm3(ctx, before[1]), vol_cm3(ctx, lab2 == p_i)],
            'unreached_kept_proxy_label_cm3': vol_cm3(ctx, E & (ws == 0)),
            'barrier_vox': rule['barrier_vox'], 'reference_voxels': {'anterior': int(ant.sum()), 'posterior': int(post.sum())}}


def load_sheetness(ct, g, F):
    """The sheetness field is a cache (incoming/_rs/sheet.npz) keyed by the filter parameters; quantised to float16 so a
    rerun with and without the cache sees identical numbers."""
    key = hashlib.sha256(json.dumps({k: F[k] for k in ('sigmas_mm', 'alpha_plate', 'c_display', 'min_peak_display')}, sort_keys=True).encode()).hexdigest()[:12]
    path = os.path.join(RS, 'sheet.npz')
    if os.path.exists(path):
        z = np.load(path)
        if str(z['key']) == key:
            return z['R'].astype(np.float32), z['N']
    R, N = sheetness(ct, g, F)
    R16 = R.astype(np.float16)
    save_npz(path, R=R16, N=N, key=np.array(key))
    return R16.astype(np.float32), N


def stage_sheets():
    cfg = sheet_config(); F = cfg['filter']
    g, ct, hull, keep = load_work()
    rep = json.load(open(os.path.join(RS, 'air-report.json')))
    lab2 = np.load(os.path.join(RS, 'air.npz'))['labels'].copy()
    index = dict(rep['index'])
    tips = tips_by_term(seed_tips())
    R, N = load_sheetness(ct, g, F)
    vox, nv, comp, n_junction = ridge_components(R, N, g, F)
    cell = float(np.prod(g.sp)) ** (2.0 / 3.0)
    sizes = np.bincount(comp)
    order = np.argsort(comp, kind='stable')
    starts = np.concatenate([[0], np.cumsum(sizes)])
    comps = []
    for cid in np.nonzero(sizes >= F['min_component_vox'])[0]:
        sel = order[starts[cid]:starts[cid + 1]]
        comps.append(Comp(cid, vox[sel], nv[sel], g, cell))
    comps = [c for c in comps if c.area >= F['min_component_area_mm2']]
    n_fragments = len(comps)
    ctx_fragments = comps
    comps = assemble(comps, F, g, cell)
    ctx = Ctx(g, ct, lab2, index, tips); ctx.F = F
    from scipy.spatial import cKDTree
    ctx.ridge_flat = np.ravel_multi_index(vox.T, ct.shape); ctx.ridge_pts = ctx.ras(vox); ctx.ridge_tree = cKDTree(ctx.ridge_pts); ctx.fragments = ctx_fragments
    out = {'filter': {k: F[k] for k in F}, 'ridge_voxels_after_junction_cut': int(len(vox)), 'junction_voxels_cut': n_junction,
           'components_total': int(comp.max() + 1), 'fragments_kept': n_fragments, 'components_kept': len(comps), 'cell_area_mm2_per_voxel': round(cell, 4),
           'seed_tips_only': True, 'sheets': {}}
    named = []

    face, sep, acc = sphenoid_steps(cfg, comps, ctx, rep, lab2, index, out)
    if face is not None:
        named.append(('sphenoid-face', 'M', face))
    if sep is not None:
        named.append(('intersinus-septum', 'M', sep))
    named += [('accessory-sphenoid-septum', c.side, c) for c in sorted(acc, key=lambda c: -c.area)]
    ctx.lab = lab2; ctx._c = {k: v for k, v in ctx._c.items() if k[0] == 'xx'}
    out['basal_lamella_split'] = {}
    for sh in ('basal-lamella', 'uncinate', 'bullar-lamella', 'ground-lamella'):
        for side in 'RL':
            c, info, _ = evaluate_sheet(sh, cfg['sheets'][sh], comps, ctx, side)
            out['sheets']['%s.%s' % (sh, side)] = info
            if c is not None:
                ctx.named[(sh, side)] = c; named.append((sh, side, c))
                if sh == 'basal-lamella':
                    out['basal_lamella_split'][side] = split_ethmoid(ctx, side, c, cfg['sheets'][sh]['split'], lab2, index)
                    ctx._c = {}
            elif sh == 'basal-lamella':
                out['basal_lamella_split'][side] = {'side': side, 'kept': 'RS1 proxy plane (a = %.2f mm, midway between the seed tips%s)' % (
                    rep['ethmoid_split_PROXY_for_basal_lamella'][side]['a_mm'], '; borrowed from the other side' if rep['ethmoid_split_PROXY_for_basal_lamella'][side].get('borrowed') else '')}
    # the sheets themselves become labels (tissue voxels within label_dilate_mm of the ridge, on voxels no label holds)
    served = {v: int(k) for k, v in json.load(open(os.path.join(REPO, 'ssb/geometry/labels.json')))['labels'].items()}
    nxt = max(list(served.values()) + list(index.values())) + 1
    reach = np.ceil(cfg['rules']['label_dilate_mm'] / ctx.samp).astype(int)
    kz = np.mgrid[tuple(slice(-int(r), int(r) + 1) for r in reach)]
    struct = ((kz / reach.reshape(3, 1, 1, 1)) ** 2).sum(0) <= 1.0
    lab_names = {}
    r_ax = g.axes()[0][None, None, :]
    for sh, side, c in named:
        b = np.zeros(lab2.shape, bool); b[tuple(c.vox.T)] = True
        m0 = ndi.binary_dilation(b, struct) & ~ctx.air & (lab2 == 0)
        parts = [('R', m0 & (r_ax > 0)), ('L', m0 & (r_ax <= 0))] if sh == 'sphenoid-face' else [(side, m0)]    # the face crosses the midline
        for sd, m in parts:
            nm = '%s.%s' % (cfg['sheets'][sh]['label'], sd)
            if nm not in index:
                index[nm] = served.get(nm) or nxt
                nxt += 0 if nm in served else 1
            lab2[m] = index[nm]
            lab_names['%s.%s#%d' % (sh, sd, c.id)] = {'label': nm, 'voxels': int(m.sum())}
    out['labels'] = lab_names
    out['volumes_cm3'] = {k: vol_cm3(ctx, lab2 == v) for k, v in sorted(index.items()) if (lab2 == v).any()}
    out['index'] = {k: v for k, v in sorted(index.items()) if (lab2 == v).any()}
    save_npz(os.path.join(RS, 'air2.npz'), labels=lab2.astype(np.uint16))
    write_json(os.path.join(RS, 'sheets-report.json'), out)
    review(cfg, ctx, comps, out, {(sh, side + ('' if sh != 'accessory-sphenoid-septum' else str(c.id))): c for sh, side, c in named})
    print(json.dumps({'components_kept': len(comps), 'sheets': {k: v['status'] for k, v in out['sheets'].items()}, 'labels': lab_names,
                      'sphenoid_face': out['sphenoid_face'], 'sphenoid_septum': out['sphenoid_septum'],
                      'basal_lamella_split': out['basal_lamella_split']}, indent=1)[:6000])


def review(cfg, ctx, comps, out, named):
    """incoming/_rs/review/<sheet>.<side>.png: the sheet (for an unassigned lamella, its best-scoring candidate, said so in the
    title) over the working volume in three planes through its centroid; below, over the UW axial stack frame nearest it (the
    stack head A is built from) and beside the FG1 figure(s) to compare it with. A figure's pose in head A's frame is FG2's,
    so a figure is shown beside the sheet, not registered under it."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from PIL import Image
    g, rd = ctx.g, os.path.join(RS, 'review')
    os.makedirs(rd, exist_ok=True)
    for f in os.listdir(rd):
        os.remove(os.path.join(rd, f))
    res = read_results()
    Ainv = np.linalg.inv(np.array(res['frame']['axial_px_to_ras_mm_affine']))
    dz_px, px, stack = res['registration']['sagittal']['params']['dz'], float(res['frame']['mm_per_px']), load_stack('axial')
    pairs = {(sh, sd): (c, 'named') for (sh, sd), c in named.items()}
    for key, info in out['sheets'].items():
        sh, sd = key.rsplit('.', 1)
        if (sh, sd) not in pairs and info['top_candidates']:
            t = info['top_candidates'][0]
            pairs[(sh, sd)] = (ctx.best[(sh, '*' if sd == 'M' else sd)], 'UNASSIGNED: best candidate, %d of %d rules' % (t['n_rules_ok'], t['of']))
    half, listing = cfg['rules']['review_halfwidth_mm'], {}
    for (sh, sd), (c, status) in sorted(pairs.items()):
        spec = cfg['sheets'][sh]
        fig, ax = plt.subplots(2, 3, figsize=(18, 12))
        cx, cy, cz = c.centroid
        k, j, i = [int(round(v)) for v in ((cz - g.origin[2]) / g.sp[2], (cy - g.origin[1]) / g.sp[1], (cx - g.origin[0]) / g.sp[0])]
        o, sp = g.origin, g.sp
        views = (('axial', ctx.ct[k], [o[0], o[0] + sp[0] * ctx.ct.shape[2], o[1], o[1] + sp[1] * ctx.ct.shape[1]], sp[1] / sp[0], c.vox[:, 0] == k, 0, 1, (cx, cy)),
                 ('coronal', ctx.ct[:, j, :], [o[0], o[0] + sp[0] * ctx.ct.shape[2], o[2], o[2] + sp[2] * ctx.ct.shape[0]], sp[2] / sp[0], np.abs(c.vox[:, 1] - j) <= 1, 0, 2, (cx, cz)),
                 ('sagittal', ctx.ct[:, :, i], [o[1], o[1] + sp[1] * ctx.ct.shape[1], o[2], o[2] + sp[2] * ctx.ct.shape[0]], sp[2] / sp[1], np.abs(c.vox[:, 2] - i) <= 1, 1, 2, (cy, cz)))
        for a_, (name, img, ext, asp, near, ax0, ax1, ctr) in zip(ax[0], views):
            a_.imshow(img, cmap='gray', origin='lower', extent=ext, aspect=asp, vmin=0, vmax=255)
            a_.plot(c.p[near, ax0], c.p[near, ax1], 's', ms=3, color='#ff3030', alpha=0.9)
            a_.set_xlim(ctr[0] - half, ctr[0] + half); a_.set_ylim(ctr[1] - half, ctr[1] + half)
            a_.set_title('working volume, %s through the centroid (%.1f, %.1f, %.1f) mm' % (name, cx, cy, cz), fontsize=9)
        P = np.column_stack([c.p, np.ones(len(c.p))]) @ Ainv.T
        n_c = min(max(int(round(float(np.median(P[:, 2])) / dz_px)), 0), stack.shape[0] - 1)
        sel = np.abs(P[:, 2] / dz_px - n_c) <= 0.5
        ax[1][0].imshow(stack[n_c], cmap='gray', origin='upper')
        ax[1][0].plot(P[sel, 0], P[sel, 1], 's', ms=2.5, color='#ff3030', alpha=0.9)
        xc, yc, hw = float(np.median(P[:, 0])), float(np.median(P[:, 1])), half / px
        ax[1][0].set_xlim(xc - hw, xc + hw); ax[1][0].set_ylim(yc + hw, yc - hw)
        ax[1][0].set_title('UW axial stack frame n=%d (the stack head A is built from)' % n_c, fontsize=9)
        figs = [f for f in spec.get('figure_ids', []) if os.path.exists(os.path.join(INC, 'uw-sinusanatomy2', 'images', f + '.jpg'))]
        for a_, fid in zip(ax[1][1:], figs + [None, None]):
            a_.axis('off')
            if fid:
                a_.imshow(Image.open(os.path.join(INC, 'uw-sinusanatomy2', 'images', fid + '.jpg')).convert('L'), cmap='gray')
                a_.set_title('UW figure %s (compare by eye; its pose in head A is FG2)' % fid, fontsize=9)
        fig.suptitle('%s.%s  [%s]   component %d (merged %s), %d voxels, %.0f mm2' % (sh, sd, status, c.id, c.merged_ids, len(c.vox), c.area), fontsize=12)
        fn = '%s.%s.png' % (sh, sd)
        fig.tight_layout(); fig.savefig(os.path.join(rd, fn), dpi=55); plt.close(fig)
        listing[fn] = {'status': status, 'uw_axial_stack_frame_n': n_c, 'uw_figures_to_compare': figs}
    write_json(os.path.join(rd, 'index.json'), listing)
    out['review'] = listing
    write_json(os.path.join(RS, 'sheets-report.json'), out)


CAND2 = os.path.join(RS, 'candidate-RS2')


def stage_export2():
    stage_export('air2.npz', 'sheets-report.json', CAND2, 'RS2: RS1 air + sphenoid face, intersinus septum and ethmoid lamella sheets (as-scanned frame); not served',
                 'export-report-RS2.json')


def stage_score2():
    """RS2 against RS1's candidate (before) and today's as-scanned labels, at --tol 1 and --tol 6."""
    parts = {}
    for name, labels in (('rs2', CAND2), ('rs1', CAND), ('baseline_as_scanned', 'as-scanned')):
        for tol in (1, 6):
            out = os.path.join(RS, 'score-%s-tol%d.json' % (name, tol))
            txt = run_score(labels, tol, out)
            open(os.path.join(RS, 'score-%s-tol%d.txt' % (name, tol)), 'w').write(txt)
            parts.setdefault(name, {})['tol%d' % tol] = json.load(open(out))[labels]
            if name == 'rs2':
                parts['coverage'] = json.load(open(out)).get('coverage')
    cmp = []
    for tol in (1, 6):
        rows = {n: {r['structure']: r for r in parts[n]['tol%d' % tol]['identity']} for n in ('rs2', 'rs1', 'baseline_as_scanned')}
        for st, r in rows['rs2'].items():
            if not r['n'] or not (r['labeled'] or rows['rs1'][st]['labeled']):
                continue
            cmp.append({'tol': tol, 'structure': st, 'n': r['n'], 'rs2_hit': r['hit'], 'rs1_hit': rows['rs1'][st]['hit'],
                        'baseline_hit': rows['baseline_as_scanned'][st]['hit'], 'rs2_labeled': r['labeled'], 'rs1_labeled': rows['rs1'][st]['labeled'],
                        'rs2_not_below_rs1_ci_lower_bound': bool(r['hit'] / r['n'] >= rows['rs1'][st]['ci'][0])})
    write_json(os.path.join(RS, 'score-RS2.json'), {'rs2': parts['rs2'], 'rs1': parts['rs1'], 'baseline_as_scanned': parts['baseline_as_scanned'],
                                                    'coverage': parts['coverage'], 'comparison': cmp})
    print(open(os.path.join(RS, 'score-rs2-tol6.txt')).read())
    print('wrote score-RS2.json')


# ---------------------------------------------------------------- selftest
def selftest():
    seeds = seed_tips()
    keys = frozenset(tip_key(t) for t in seeds)
    assert seeds and all(t['set'] == 'seed' for t in seeds)
    forged = dict(seeds[0], set='heldout')
    try:
        guard([forged], keys)
    except HeldOutError:
        pass
    else:
        raise AssertionError('a tip marked heldout was accepted')
    forged = dict(seeds[0], n=-1)                     # marked seed, but not one of the file's seed tips
    try:
        guard([forged], keys)
    except HeldOutError:
        pass
    else:
        raise AssertionError('a tip that is not in the seed set was accepted')
    # the loader refuses a split whose counts do not add up (a held-out row relabelled seed, or the reverse)
    tmp = os.path.join(RS, 'selftest-split.json')
    d = json.load(open(SPLIT))
    for t in d['tips']:
        if t['set'] == 'heldout':
            t['set'] = 'seed'; break
    write_json(tmp, d)
    try:
        seed_tips(tmp)
    except HeldOutError:
        pass
    else:
        raise AssertionError('a split with a relabelled held-out row was accepted')
    os.remove(tmp)
    # regridding: majority label, ties to the lower value
    g = Grid((0.0, 0.0, 0.0), (1.0, 1.0, 1.0), (4, 4, 4))
    lab = np.zeros((4, 4, 4), np.uint16); lab[:, :, 2:] = 5; lab[:, :, 1] = 3
    o = regrid_labels(lab, g, (np.array([0.5, 2.5]), np.array([0.5, 2.5]), np.array([0.5, 2.5])), (0.5, 0.5, 0.5), 2.0)
    # output cells span x [-0.5, 1.5] and [1.5, 3.5]: first holds x=0 (0), x=1 (3) -> tie -> lower; second x=2,3 (5)
    assert (o[:, :, 0] == 0).all() and (o[:, :, 1] == 5).all(), o
    # declared.json: every id is in the graph or null with a term
    import glob
    ids = set()
    for f in glob.glob(os.path.join(REPO, 'ssb/content/*.json')):
        dd = json.load(open(f))
        for v in dd.values():
            if isinstance(v, list):
                ids |= {e['id'] for e in v if isinstance(e, dict) and 'id' in e}
    dec = json.load(open(DECLARED))
    for e in dec['ids']:
        assert e.get('step') and e.get('term'), e
        assert (e['id'] is None) or (e['id'] in ids), 'declared id not in the graph: %s' % e['id']
    # sheets: a synthetic 2-voxel bright plate in air is found as ONE component whose normal is the plate's; sheets.json parses
    cfg = sheet_config(); Fc = cfg['filter']
    gg = Grid((0.0, 0.0, 0.0), (0.34366, 0.34366, 0.625), (40, 60, 60))
    vol = np.zeros(gg.shape, np.float32); vol[:, :, 29:31] = 200.0
    Rr_, Nn_ = sheetness(vol, gg, Fc)
    vx, nvx, cmp_, _ = ridge_components(Rr_, Nn_, gg, Fc)
    big = np.bincount(cmp_).argmax()
    assert (cmp_ == big).sum() >= 0.8 * 40 * 60, 'the plate is not one component'
    cc = Comp(0, vx[cmp_ == big], nvx[cmp_ == big], gg, 0.1)
    assert cc.axis[0] > 0.95 and np.abs(cc.p[:, 0] - 30 * 0.34366).max() < 0.8, (cc.axis, np.abs(cc.p[:, 0] - 10.3).max())
    for nm, sp_ in cfg['sheets'].items():
        for rl in sp_.get('rules', []):
            assert rl['name'] and rl['type'] in ('area_min_mm2', 'extent_min_mm', 'normal_abs', 'reaches', 'abs_r_vs_seed', 'abs_r_vs_air_band',
                                                 'relative_to_sheet', 'probe', 'inside_mask', 'separates_air', 'any_of'), (nm, rl)
        assert sp_['label'] in ids, 'sheets.json names an id the graph does not have: %s' % sp_['label']
    # the basal-lamella machinery on a synthetic box: a complete coronal sheet separates the two references, a holed one does not
    g3 = Grid((0.0, 0.0, 0.0), (1.0, 1.0, 1.0), (20, 20, 20))
    lab3 = np.zeros(g3.shape, np.uint16); lab3[:, :10, :] = 2; lab3[:, 10:, :] = 1
    ix3 = {'s.anterior-ethmoid-cells.R': 1, 's.posterior-ethmoid-cells.R': 2}
    tip3 = {'anterior ethmoid': [np.array([10.0, 15.0, 10.0])], 'posterior ethmoid': [np.array([10.0, 4.0, 10.0])]}
    c3 = Ctx(g3, np.zeros(g3.shape, np.float32), lab3, ix3, tip3); c3.F = Fc
    kk, ii = np.meshgrid(np.arange(20), np.arange(20), indexing='ij')
    nrm3 = np.tile([0.0, 1.0, 0.0], (400, 1))
    rule3 = {'ref_mm': 2.0, 'anterior_terms': ['anterior ethmoid'], 'posterior_terms': ['posterior ethmoid'], 'barrier_vox': 0}
    plate = Comp(1, np.column_stack([kk.ravel(), np.full(400, 10), ii.ravel()]), nrm3, g3, 1.0)
    assert separates(rule3, plate, c3, 'R')[0], 'a complete sheet does not separate'
    holed = Comp(2, plate.vox[~((plate.vox[:, 0] == 10) & (plate.vox[:, 2] == 10))], nrm3[:-1], g3, 1.0)
    assert not separates(rule3, holed, c3, 'R')[0], 'a holed sheet separates'
    lab_s = lab3.copy(); lab_s[:, :, :] = 1
    split_ethmoid(c3, 'R', plate, rule3, lab_s, ix3)
    assert (lab_s[:, 11:, :] == 1).all() and (lab_s[:, :9, :] == 2).all(), 'split_ethmoid misplaces the sides'
    print('selftest ok (sheets): synthetic plate = one component, normal along r; a complete sheet separates the ethmoid references and a holed one does not; sheets.json ids in the graph')
    print('selftest ok: guard refuses a held-out and a forged tip; %d seed tips; regrid rule; %d declared entries' % (len(seeds), len(dec['ids'])))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--rules', help='an alternative sheets.json (a what-if for review; the default is rs/sheets.json)')
    ap.add_argument('stage', choices=['work', 'air', 'export', 'score', 'sheets', 'export2', 'score2', 'rs2', 'all', 'selftest'])
    a = ap.parse_args()
    if a.rules:
        global SHEETS
        SHEETS = os.path.abspath(a.rules)
    os.makedirs(RS, exist_ok=True)
    stages = {'work': stage_work, 'air': stage_air, 'export': stage_export, 'score': stage_score, 'sheets': stage_sheets,
              'export2': stage_export2, 'score2': stage_score2, 'selftest': selftest}
    seq = {'all': ['work', 'air', 'export', 'score', 'sheets', 'export2', 'score2'], 'rs2': ['sheets', 'export2', 'score2']}
    for st in seq.get(a.stage, [a.stage]):
        print('== %s ==' % st)
        stages[st]()


if __name__ == '__main__':
    main()
