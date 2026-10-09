"""Resegmentation harness, work package RS1 (docs/realistic-anatomy.md section 7.2 step 1, section 10).

    .venv/bin/python -I tools/ssb-pipeline/uw/reseg.py all        # work, air, export, score
    .venv/bin/python -I tools/ssb-pipeline/uw/reseg.py work|air|export|score|selftest

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

The ground truth's integrity. split.json marks each tip `seed` or `heldout`. This file reads only `seed` rows
(`seed_tips`: a held-out row is dropped as it is met, its coordinates never read) and `guard` raises on any tip that
is not one of them; `selftest` feeds it a held-out tip and a forged one. Held-out tips are read by score.py alone.

What differs from specimen.py, and why. Distances, radii and plane positions are in mm, so the same rule applies on
the anisotropic grid; the 1 mm septal erosion is a Euclidean one; the PNS search, the ostium search and the noise floor
are the same rules in mm. The basal lamella is still the PROXY plane (RS2 replaces it). Landmarks are not rebuilt
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


def stage_export():
    g, ct, hull, keep = load_work()
    rep = json.load(open(os.path.join(RS, 'air-report.json')))
    lab = np.load(os.path.join(RS, 'air.npz'))['labels']
    r, a, s = S.grid_axes()
    origin = (S.BOX['r'][0], S.BOX['a'][0], S.BOX['s'][0])
    out_lab = regrid_labels(lab, g, (r, a, s), origin, S.STEP)
    # CT on the served grid (trilinear at the output nodes), masked like ssb/ct
    R, A_, Z = np.meshgrid(r, a, s, indexing='ij')
    idx = np.stack([(Z - g.origin[2]) / g.sp[2], (A_ - g.origin[1]) / g.sp[1], (R - g.origin[0]) / g.sp[0]])
    ct_o = ndi.map_coordinates(ct, idx, order=1, cval=0).transpose(2, 1, 0)
    keep_o = ndi.map_coordinates(keep.astype(np.uint8), idx, order=0, cval=0).transpose(2, 1, 0).astype(bool)
    ct_out = np.where(keep_o, np.clip(np.round(ct_o), 0, 255), 0).astype(np.uint8)
    os.makedirs(CAND, exist_ok=True)
    write_gz(os.path.join(CAND, 'ct.u8.gz'), np.ascontiguousarray(ct_out).tobytes())
    write_gz(os.path.join(CAND, 'labels.u16.gz'), np.ascontiguousarray(out_lab).astype('<u2').tobytes())
    served_hdr = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    nz, ny, nx = out_lab.shape
    hdr = {k: served_hdr[k] for k in ('version', 'spacing', 'affine', 'affineNote', 'dtype', 'values', 'windows')}
    hdr.update({'dims': [nx, ny, nz], 'labels': {'file': 'labels.u16.gz', 'dtype': 'uint16', 'table': 'labels.json'},
                'specimen': 'uw-axial-sagittal', 'candidate': 'RS1: seed-tip-only native-grid air labels (as-scanned frame); not served',
                'license': 'ssb/LICENSE-data.md'})
    assert nx == served_hdr['dims'][0] and ny == served_hdr['dims'][1] and nz == served_hdr['dims'][2], 'grid differs from ssb/ct'
    write_json(os.path.join(CAND, 'ct.json'), hdr)
    used = sorted(int(v) for v in np.unique(out_lab) if v)
    byidx = {v: k for k, v in rep['index'].items()}
    write_json(os.path.join(CAND, 'labels.json'), {'version': 1, 'labels': {str(v): byidx[v] for v in used}})
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
    write_json(os.path.join(RS, 'export-report.json'), {'labels_used': {byidx[v]: int((out_lab == v).sum()) for v in used},
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
    print('selftest ok: guard refuses a held-out and a forged tip; %d seed tips; regrid rule; %d declared entries' % (len(seeds), len(dec['ids'])))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('stage', choices=['work', 'air', 'export', 'score', 'all', 'selftest'])
    a = ap.parse_args()
    os.makedirs(RS, exist_ok=True)
    stages = {'work': stage_work, 'air': stage_air, 'export': stage_export, 'score': stage_score, 'selftest': selftest}
    for st in (['work', 'air', 'export', 'score'] if a.stage == 'all' else [a.stage]):
        print('== %s ==' % st)
        stages[st]()


if __name__ == '__main__':
    main()
