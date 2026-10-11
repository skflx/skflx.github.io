"""Reference specimen, stage N: the standard specimen (owner decision O6, docs/ssb.md 5.1; roadmap WP N1).

    .venv/bin/python tools/ssb-pipeline/uw/normalize.py [all|volume|labels|sides]
    .venv/bin/python tools/ssb-pipeline/uw/normalize.py --base scanned      # RA3b: head A as scanned -> ssb/anatomy/scanned/

The page serves a symmetric, standard head: the as-scanned UW head's RIGHT half mirrored onto the left, the
nasal septum centred (keeping its measured thickness), and a thin midline plate wherever a paired air space
would otherwise cross the midline. The as-scanned volume stays this stage's input and is not served.

Input (step 0): the as-scanned files, read with `git show <AS_SCANNED_COMMIT>:<path>` and cached under
incoming/_recon/as-scanned/ (gitignored). `normalize.py` never reads the committed ssb/ct as input, so a rerun
is idempotent.

Stages (`all` runs them in this order, with the pipeline stages between them, and dissect.py, the dissection states, last):

  volume   ST6 steps 1-2 (the external nose: unmask it from the raw UW stack, centre it; nose.py), then steps 1-5: midline
           check, septum centring, mirror, midline plates, then ST6 steps 3-4 (the internal valve landmark and the
           s.nasal-vestibule labels; nose.py), ct.json "standard".
           Writes ssb/ct/ct.u8.gz, labels.u16.gz, ct.json, ssb/geometry/labels.json (append only), the valve landmark
           s.internal-nasal-valve.R (stage `sides` mirrors it), and incoming/_recon/nose-region.npz (the standard
           specimen's nose region, for nose.py pack).
  -        walls.py   (re-derives the wall units from the mirrored air labels)
  labels   re-mirrors the label volume from the right half after walls.py, so the symmetry is exact (a
           marker watershed breaks ties by scan order); the air labels and the CT do not change.
  -        sweeps mirrored (below) so sdf.py sees symmetric tubes, then meshes.py, sdf.py, softtissue.py
           (which runs sweeps_soft.py), lining.py (the open airway lining, ST1b), nose.py pack (the nose pack, ST6)
  sides    step 6: every paired landmark .L := .R with R negated, .M R := 0; sweeps.json .L := mirrored .R;
           s.septal-mucosa.L's chart := .R's with r negated. The as-scanned landmarks stay in the meta files
           under `asScanned`. Unpaired landmarks (one side only) stay as scanned and are listed.

Deterministic: gzip mtime 0, no randomness.

--base scanned (WP RA3b, docs/realistic-anatomy.md 6.2): the same stages minus the mirror and the centring. It starts from the
same as-scanned input, runs ST6 step 1 (the nose unmasked) but not step 2 (no centring), step 1 above (the midline check, printed),
then skips steps 2-5 and the sides stage: the septum stays where it was scanned, the left half is the head's own, and nothing is
mirrored. The valve and the vestibule (ST6 steps 3-4) are computed on each side from that side's own naris; walls.py, meshes.py,
sdf.py, softtissue.py --per-side (each floor from its own cavity), lining.py and nose.py pack then run on the scanned volume.
The stage scripts write to ssb/ct, ssb/geometry and ssb/models of the repository root they live in, so `--base scanned` runs them
from a COPY of this directory under incoming/_recon/scanned-root/ (gitignored): the standard specimen's files are never read
or written by those stages, and ssb/anatomy/scanned/ is copied out of that root at the end. The label table starts as the
standard one (same names, same indices, append only), so an index means the same name on every base. Nothing is hand-edited:
ssb/anatomy/scanned/ is regenerated in full by this command, and ssb/anatomy/index.json's `scanned` entry is written from
the numbers it prints (volumes, asymmetry indices, NasalSeg percentiles).

Owner decisions of 2026-10-05 that shape this script (the first run escalated, docs/ssb-roadmap.md N1):
  * The midline gate is the fitted plane's R at the septum centroid and over its extent, not its extrapolation to
    the origin; the tilt is printed, not gated. The mirror plane is R = 0, not the fitted plane.
  * Mirror at R = 0 plainly. The right frontal tables cross R = 0 by up to 5 mm in the as-scanned head; the two
    frontal table units are exempt from the "right-labelled structure left of R = 0" check, and the part of
    them (and of the right frontal sinus air) left of R = 0 is simply replaced by the mirror.
  * Landmarks that exist on one side only stay as scanned and are listed.
"""
import gzip, json, os, subprocess, sys, warnings
import numpy as np
from scipy import ndimage as ndi
from skimage.measure import points_in_poly

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import CACHE  # noqa: E402
import nose  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
PY = sys.executable
AS_SCANNED_COMMIT = '37fa476240afb7568d652814e82801e7f1cb7c97'     # master just before N1
AS_SCANNED_FILES = ['ct/ct.json', 'ct/ct.u8.gz', 'ct/labels.u16.gz', 'geometry/labels.json', 'geometry/landmarks.json',
                    'geometry/landmarks.meta.json', 'geometry/charts.json', 'geometry/sweeps.json',
                    'geometry/sweeps.meta.json']
CACHE_AS = os.path.abspath(os.path.join(HERE, '..', 'incoming', '_recon', 'as-scanned'))
SEPTUM = 's.nasal-septum.M'
CAVITY = 's.nasal-cavity'
FIT_S_MIN = 20.0          # perpendicular plate only (mm)
GATE_MM = 1.5             # septum-centroid / extent gate on the fitted plane
TAPER_MM = 3.0
PLATE_DILATE_MM = 1.0
PLATE_HALF_MM = 0.5
# air spaces: a label of one of these ids is "air" (walls.AIR_IDS)
AIR_IDS = ('s.agger-nasi-cell', 's.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess', 's.frontal-sinus',
           's.maxillary-sinus', 's.nasal-cavity', 's.nasal-vestibule', 's.nasopharynx', 's.posterior-ethmoid-cells', 's.sphenoid-sinus')
# right-labelled non-air units allowed to reach more than 2 mm left of R = 0 in the as-scanned head (owner, 2026-10-05)
CROSSING_OK = ('s.frontal-sinus-anterior-table.R', 's.frontal-sinus-posterior-table.R')
PLATE_LABEL = {'s.sphenoid-sinus': 's.intersinus-septum.M', 's.frontal-sinus': 's.frontal-intersinus-septum.M'}
PLATE_DEFAULT = SEPTUM     # the nasal cavity (olfactory cleft) and anything else that touches


def say(*a, **kw):
    print(*a, flush=True, **kw)


# ---------------------------------------------------------------- step 0: input
def ensure_as_scanned():
    for f in AS_SCANNED_FILES:
        p = os.path.join(CACHE_AS, 'ssb', f)
        if os.path.exists(p):
            continue
        os.makedirs(os.path.dirname(p), exist_ok=True)
        blob = subprocess.run(['git', 'show', f'{AS_SCANNED_COMMIT}:ssb/{f}'], cwd=REPO, check=True,
                              capture_output=True).stdout
        open(p, 'wb').write(blob)


def asc(path):
    return os.path.join(CACHE_AS, 'ssb', path)


def read_as_scanned():
    ensure_as_scanned()
    hdr = json.load(open(asc('ct/ct.json')))
    nx, ny, nz = hdr['dims']
    ct = np.frombuffer(gzip.open(asc('ct/ct.u8.gz')).read(), np.uint8).reshape(nz, ny, nx).copy()
    lab = np.frombuffer(gzip.open(asc('ct/labels.u16.gz')).read(), '<u2').reshape(nz, ny, nx).copy()
    table = {int(k): v for k, v in json.load(open(asc('geometry/labels.json')))['labels'].items()}
    return hdr, ct, lab, table


def gz_write(path, arr, dtype):
    with gzip.GzipFile(path, 'wb', compresslevel=9, mtime=0) as f:
        f.write(np.ascontiguousarray(arr).astype(dtype).tobytes())


def is_air(name):
    return name.rsplit('.', 1)[0] in AIR_IDS


def stem(name):
    return name.rsplit('.', 1)[0]


def side(name):
    return name.rsplit('.', 1)[1]


class Frame:
    def __init__(self, hdr):
        self.nx, self.ny, self.nz = hdr['dims']
        self.step = hdr['spacing'][0]
        aff = hdr['affine']
        self.r = aff[0][3] + np.arange(self.nx) * self.step
        self.a = aff[1][3] + np.arange(self.ny) * self.step
        self.s = aff[2][3] + np.arange(self.nz) * self.step
        self.mid = int(round(-self.r[0] / self.step))            # voxel column of R = 0
        assert abs(self.r[self.mid]) < 1e-9 and self.mid * 2 == self.nx - 1, 'frame is not mirror-centred on R = 0'


# ---------------------------------------------------------------- step 1: midline check
def fit_plane(R, A, S):
    X = np.c_[np.ones_like(R), A, S]
    c, *_ = np.linalg.lstsq(X, R, rcond=None)
    return c, float(np.degrees(np.arctan(np.hypot(c[1], c[2]))))


def midline_check(fr, lab, by_name, landmarks):
    k, j, i = np.nonzero(lab == by_name[SEPTUM])
    S, A, R = fr.s[k], fr.a[j], fr.r[i]
    m = S >= FIT_S_MIN
    L = np.array([v for key, v in landmarks.items() if key.endswith('.M')])
    c, tilt = fit_plane(np.r_[R[m], L[:, 0]], np.r_[A[m], L[:, 1]], np.r_[S[m], L[:, 2]])
    X = np.c_[np.ones(m.sum()), A[m], S[m]]
    on_ext = X @ c
    centroid = float(c @ [1, A[m].mean(), S[m].mean()])
    out = {'fit': 'R = %.3f + %.4f A + %.4f S' % tuple(c), 'septumVoxels': int(m.sum()), 'landmarksM': int(len(L)),
           'offsetAtOriginMm': round(float(c[0]), 2), 'tiltDeg': round(tilt, 2),
           'offsetAtSeptumCentroidMm': round(centroid, 2),
           'extentMm': [round(float(on_ext.min()), 2), round(float(on_ext.max()), 2)]}
    say('1. midline fit (septum S >= %g mm + every .M landmark):' % FIT_S_MIN, json.dumps(out))
    say('   gate (owner 2026-10-05): |R| at the septum centroid and over its extent <= %g mm -> ' % GATE_MM, end='')
    ok = abs(centroid) <= GATE_MM and max(abs(on_ext.min()), abs(on_ext.max())) <= GATE_MM
    say('PASS' if ok else 'FAIL')
    if not ok:
        raise SystemExit('ESCALATE: the midline fit is more than %g mm off R = 0 at the septum' % GATE_MM)
    say('   tilt %.2f deg and the offset at the origin %.2f mm are printed, not gated; the mirror plane is R = 0'
        % (tilt, c[0]))
    return out


def crossing_check(fr, lab, table):
    """Escalate: a right-labelled structure other than an air space (and the frontal tables) > 2 mm left of R = 0."""
    rows = {}
    for v, n in table.items():
        if side(n) != 'R' or is_air(n):
            continue
        ii = np.nonzero((lab == v).any(axis=(0, 1)))[0]
        if len(ii) and fr.r[ii].min() < -2.0:
            rows[n] = round(float(fr.r[ii].min()), 1)
    bad = {n: r for n, r in rows.items() if n not in CROSSING_OK}
    say('   right-labelled non-air units reaching > 2 mm left of R = 0 (as scanned):', rows or 'none',
        '- exempt (frontal tables, owner):', sorted(set(rows) & set(CROSSING_OK)))
    if bad:
        raise SystemExit('ESCALATE: a right-labelled structure other than an air space reaches > 2 mm left: %s' % bad)
    return rows


# ---------------------------------------------------------------- step 2: centre the septum
def chart_grid(surface):
    g = surface['grid']
    r = np.array([[np.nan if v is None else v for v in row] for row in g['r']], float)     # r[ia][is]
    a0, s0 = g['origin']
    bad = np.zeros(r.shape, bool)
    for key in ('filled', 'unreliable'):
        for a, s in surface[key]['cells']:
            bad[int(round(a - a0)), int(round(s - s0))] = True
    return r, bad, a0, s0, surface['polygon']


def septal_offsets(fr, charts):
    """c (mm) for each (A, S) voxel column, and the right surface r_R where the chart has it."""
    PAD = 4
    R, L = charts['s.septal-mucosa.R'], charts['s.septal-mucosa.L']
    rR, badR, aR, sR, polyR = chart_grid(R)
    rL, badL, aL, sL, polyL = chart_grid(L)
    a0, s0 = min(aR, aL) - PAD, min(sR, sL) - PAD
    na = int(max(aR + rR.shape[0], aL + rL.shape[0]) - a0) + PAD
    ns = int(max(sR + rR.shape[1], sL + rL.shape[1]) - s0) + PAD
    RR = np.full((na, ns), np.nan); RL = np.full((na, ns), np.nan)
    badR_u = np.zeros((na, ns), bool); badL_u = np.zeros((na, ns), bool)
    for src, dst, bd, bdst, a_, s_ in ((rR, RR, badR, badR_u, aR, sR), (rL, RL, badL, badL_u, aL, sL)):
        ia, js = int(a_ - a0), int(s_ - s0)
        dst[ia:ia + src.shape[0], js:js + src.shape[1]] = src
        bdst[ia:ia + src.shape[0], js:js + src.shape[1]] = bd
    ga, gs = np.meshgrid(a0 + np.arange(na), s0 + np.arange(ns), indexing='ij')
    pts = np.c_[ga.ravel(), gs.ravel()]
    outline = (points_in_poly(pts, np.array(polyR)) | points_in_poly(pts, np.array(polyL))).reshape(na, ns)
    outline |= ~np.isnan(RR) | ~np.isnan(RL)
    outline = ndi.binary_closing(outline, iterations=1) | outline
    valid = ~np.isnan(RR) & ~np.isnan(RL) & ~badR_u & ~badL_u
    c_raw = np.where(valid, (RR + RL) / 2, np.nan)
    T = np.where(valid, RR - RL, np.nan)
    # cells in one chart only, filled, unreliable, or in a hole: the nearest valid cell
    idx = ndi.distance_transform_edt(~valid, return_distances=False, return_indices=True)
    c_fill = c_raw[idx[0], idx[1]]
    c = np.where(outline, c_fill, np.nan)
    # 3x3 median over the union outline
    pad = np.pad(c, 1, constant_values=np.nan)
    win = np.stack([pad[1 + di:1 + di + na, 1 + dj:1 + dj + ns] for di in (-1, 0, 1) for dj in (-1, 0, 1)])
    with np.errstate(all="ignore"), warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        med = np.nanmedian(win, axis=0)
    c_med = np.where(outline, med, np.nan)
    # outside the outline: the nearest outline cell's offset, tapering linearly to 0 over 3 mm
    d, idx2 = ndi.distance_transform_edt(~outline, return_indices=True)
    c_all = np.where(outline, c_med, c_med[idx2[0], idx2[1]] * np.clip(1 - d / TAPER_MM, 0, 1))
    stats = {'validCells': int(valid.sum()), 'outlineCells': int(outline.sum()),
             'cellsFromNearest': int((outline & ~valid).sum())}
    # per voxel column (k, j): nearest chart cell
    jj = np.floor(fr.a - a0 + 0.5).astype(int); kk = np.floor(fr.s - s0 + 0.5).astype(int)
    inj = (jj >= 0) & (jj < na); ink = (kk >= 0) & (kk < ns)
    jjc = np.clip(jj, 0, na - 1); kkc = np.clip(kk, 0, ns - 1)
    col_c = c_all[np.ix_(jjc, kkc)].T.copy()               # [k, j]
    col_c[~ink, :] = 0; col_c[:, ~inj] = 0
    col_rR = RR[np.ix_(jjc, kkc)].T.copy()
    col_rR[~ink, :] = np.nan; col_rR[:, ~inj] = np.nan
    col_in = outline[np.ix_(jjc, kkc)].T & ink[:, None] & inj[None, :]
    absc = np.abs(c_med[valid])
    report = {'median': round(float(np.median(absc)), 2), 'max': round(float(absc.max()), 2)}
    # interior check cells for the test: both charts valid, T/2 vs r_R - c
    return col_c, col_rR, col_in, report, stats, T


def centre_septum(fr, ct, lab, table, by_name, charts):
    col_c, col_rR, col_in, rep, stats, _ = septal_offsets(fr, charts)
    cav = by_name[CAVITY + '.R']
    cavL = by_name[CAVITY + '.L']
    air_disp = int(np.median(ct[lab == cav]))
    say('2. septum centring: offset |c| median %.2f mm, max %.2f mm over %d chart cells (%d cells from the nearest valid, '
        'union outline %d cells); right-cavity air display = %d (median of as-scanned %s.R)'
        % (rep['median'], rep['max'], stats['validCells'], stats['cellsFromNearest'], stats['outlineCells'], air_disp, CAVITY))
    # right surface: the chart's where it has one, else the medial-most right-cavity air voxel of the column
    X = fr.r[None, None, :]
    is_cav = lab == cav
    first = np.where(is_cav.any(axis=2), fr.r[np.argmax(is_cav, axis=2)] - fr.step / 2, np.nan)   # [k, j]
    rR = np.where(np.isnan(col_rR), first, col_rR)
    c = np.where(np.isnan(rR), 0.0, col_c)
    rRb = np.nan_to_num(rR)[:, :, None]; cb = c[:, :, None]
    eps = 1e-6
    half = X >= -eps
    new_air = half & (cb > 0) & (X > rRb - cb + eps) & (X <= rRb + eps)
    src = half & (cb < 0) & (X >= rRb - eps) & (X < rRb - cb - eps)
    # a column whose septum lies wholly right of R = 0: left-cavity air in 0 <= x <= r_R - c is septal tissue
    left_air = half & (cb > 0) & (X <= rRb - cb + eps) & (lab == cavL)
    ct2, lab2 = ct.copy(), lab.copy()
    ct2[new_air] = air_disp; lab2[new_air] = cav
    idx = np.clip(np.floor((X + cb - fr.r[0]) / fr.step + 0.5).astype(int), 0, fr.nx - 1)
    take = src | left_air
    kk, jj, ii = np.nonzero(take)
    si = idx[kk, jj, ii]
    ct2[kk, jj, ii] = ct[kk, jj, si]; lab2[kk, jj, ii] = lab[kk, jj, si]
    say('   voxels -> right-cavity air: %d; septal tissue extended: %d; left-cavity air right of R = 0 turned to septum: %d'
        % (int(new_air.sum()), int(src.sum()), int(left_air.sum())))
    rep.update({'columnsChanged': int((new_air | take).any(axis=2).sum()), 'voxelsToAir': int(new_air.sum()),
                'voxelsToTissue': int(src.sum()), 'leftAirToTissue': int(left_air.sum()), 'airDisplay': air_disp})
    return ct2, lab2, rep


# ---------------------------------------------------------------- step 3: mirror
def side_map(table, by_name):
    """index -> index of the same id's other side (.R -> .L); .M and unnamed unchanged. Appends missing .L entries."""
    appended = []
    for v, n in sorted(table.items()):
        if side(n) == 'R' and stem(n) + '.L' not in by_name:
            idx = max(by_name.values()) + 1
            by_name[stem(n) + '.L'] = idx
            table[idx] = stem(n) + '.L'
            appended.append((idx, stem(n) + '.L'))
    n = max(table) + 1
    r2l = np.arange(n, dtype=np.uint16); l2r = np.arange(n, dtype=np.uint16)
    for v, name in table.items():
        if side(name) == 'R':
            r2l[v] = by_name[stem(name) + '.L']
        elif side(name) == 'L' and stem(name) + '.R' in by_name:
            l2r[v] = by_name[stem(name) + '.R']
    return r2l, l2r, appended


def mirror(fr, ct, lab, r2l, l2r, table):
    m = fr.mid
    right = lab[:, :, m:]
    relabelled = {}
    nz_L = np.isin(right, [v for v, nm in table.items() if side(nm) == 'L'])
    for v in np.unique(right[nz_L]):
        relabelled[table[int(v)]] = int((right == v).sum())
    lab2 = lab.copy()
    lab2[:, :, m:] = l2r[right]
    say('3. mirror: right-half (x >= 0) .L voxels relabelled to .R, per id:', relabelled or 'none')
    ct2 = ct.copy()
    lab2[:, :, :m] = r2l[lab2[:, :, m + 1:][:, :, ::-1]]
    ct2[:, :, :m] = ct[:, :, m + 1:][:, :, ::-1]
    return ct2, lab2, relabelled


# ---------------------------------------------------------------- step 4: midline plates
def plates(fr, ct, lab, table, by_name, bone_disp):
    m = fr.mid
    air_R = {v for v, n in table.items() if side(n) == 'R' and is_air(n)}
    air_L = {v for v, n in table.items() if side(n) == 'L' and is_air(n)}
    isR = np.isin(lab, list(air_R)); isL = np.isin(lab, list(air_L))
    cols = slice(m - 1, m + 2)
    out_ct, out_lab = ct.copy(), lab.copy()
    stem_of = {v: stem(n) for v, n in table.items()}
    stems_present = {}
    for x0 in (m - 1, m):
        for a, b in ((x0, x0 + 1), (x0 + 1, x0)):
            ra = np.where(isR[:, :, a], lab[:, :, a], 0); lb = np.where(isL[:, :, b], lab[:, :, b], 0)
            both = (ra > 0) & (lb > 0)
            for v in np.unique(ra[both]):
                stems_present.setdefault(stem_of[int(v)], np.zeros(lab.shape[:2], bool))
                stems_present[stem_of[int(v)]] |= both & (ra == v)
    dil = int(round(PLATE_DILATE_MM / fr.step))
    info = {}
    total_patch = np.zeros(lab.shape[:2], bool)
    assigned = np.zeros(lab.shape[:2], bool)
    order = ['s.sphenoid-sinus', 's.frontal-sinus'] + sorted(k for k in stems_present if k not in PLATE_LABEL)
    for st in order:
        if st not in stems_present:
            continue
        patch = stems_present[st] & ~assigned
        if not patch.any():
            continue
        grown = ndi.binary_dilation(patch, structure=np.ones((3, 3), bool), iterations=dil) & ~assigned
        label_name = PLATE_LABEL.get(st, PLATE_DEFAULT)
        li = by_name[label_name]
        sel = np.zeros(lab.shape, bool)
        sel[:, :, cols] = grown[:, :, None]
        out_ct[sel] = bone_disp; out_lab[sel] = li
        area_patch = float(patch.sum()) * fr.step ** 2
        area_plate = float(grown.sum()) * fr.step ** 2
        info[st] = {'label': label_name, 'contactMm2': round(area_patch, 1), 'plateMm2': round(area_plate, 1)}
        assigned |= grown
    say('4. midline plates (bone display %d = median of as-scanned s.sphenoid-face): %s' % (bone_disp, json.dumps(info)))
    # acceptance: no .R air voxel touches a .L air voxel
    aR = np.isin(out_lab, list(air_R)); aL = np.isin(out_lab, list(air_L))
    bad = 0
    for ax in (0, 1, 2):
        sl_a = [slice(None)] * 3; sl_b = [slice(None)] * 3
        sl_a[ax] = slice(0, -1); sl_b[ax] = slice(1, None)
        bad += int((aR[tuple(sl_a)] & aL[tuple(sl_b)]).sum() + (aL[tuple(sl_a)] & aR[tuple(sl_b)]).sum())
    say('   .R air voxels touching .L air voxels after the plates (face-adjacent pairs): %d' % bad)
    if bad:
        raise SystemExit('a .R air voxel still touches a .L air voxel (%d face pairs)' % bad)
    return out_ct, out_lab, info


# ---------------------------------------------------------------- ST6 steps 3-4: valve landmark, vestibule labels
def mirror_mask(M, mid):
    """A mask of the right half (columns > mid) -> the same mask mirrored onto the left half (columns < mid)."""
    out = np.zeros_like(M)
    out[:, :, :mid] = M[:, :, mid + 1:][:, :, ::-1]
    return out


def nose_labels(fr, ct, lab, table, by_name):
    """Append s.nasal-vestibule.R/.L to the label table and write the valve landmark (right). Returns (labels, report)."""
    lm = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
    meta = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.meta.json')))
    naris = lm['lm.naris.R']
    s_lo = meta['landmarks']['lm.naris.R']['band_s_mm'][0]
    res = nose.valve_and_vestibule(ct, lab, by_name, fr.r, fr.a, fr.s, naris, s_lo)
    nose.say_vestibule(res['report'])
    names = {}
    for sd in ('R', 'L'):
        name = '%s.%s' % (nose.VESTIBULE, sd)
        if name not in by_name:
            idx = max(by_name.values()) + 1
            by_name[name] = idx
            table[idx] = name
        names[sd] = by_name[name]
    say('   appended label indices:', {k: v for k, v in names.items()})
    out = lab.copy()
    cav = {sd: by_name['%s.%s' % (nose.CAVITY, sd)] for sd in 'RL'}
    out[res['join']] = cav['R']
    out[mirror_mask(res['join'], fr.mid)] = cav['L']
    out[res['vest']] = names['R']
    out[mirror_mask(res['vest'], fr.mid)] = names['L']
    # acceptance: lm.naris lies in the vestibule's air; the valve landmark lies in air
    k, j, i = (int(round(v)) for v in ((naris[2] - fr.s[0]) / fr.step, (naris[1] - fr.a[0]) / fr.step, (naris[0] - fr.r[0]) / fr.step))
    say('   lm.naris.R %s: label %s, display %d' % (naris, table[int(out[k, j, i])], ct[k, j, i]))
    vc = res['valve']['centroid']
    k, j, i = (int(round(v)) for v in ((vc[2] - fr.s[0]) / fr.step, (vc[1] - fr.a[0]) / fr.step, (vc[0] - fr.r[0]) / fr.step))
    v_label, v_disp = table.get(int(out[k, j, i]), '-'), int(ct[k, j, i])
    say('   valve landmark %s: label %s, display %d (%s)' % (vc, v_label, v_disp, 'in air' if 0 < v_disp < nose.AIR else 'NOT in air'))
    v = res['valve']
    lm['s.internal-nasal-valve.R'] = vc
    lm['s.internal-nasal-valve.L'] = [-vc[0], vc[1], vc[2]]       # stage `sides` mirrors only landmarks that already have both sides
    meta['landmarks']['s.internal-nasal-valve.R'] = {
        'method': 'centroid of the right airway\'s coronal section of smallest area (3 mm moving mean) over A from lm.naris - 25 to - 10 mm: '
                  'the airway is the air connected to lm.naris among the right nasal cavity and the unlabelled air in front of it (tools/ssb-pipeline/uw/nose.py, ST6); '
                  'the left point is its mirror (N1)',
        'a_mm': v['a'], 'section_area_mm2': round(v['area_mm2'], 1), 'smoothed_area_mm2': round(v['smoothed_area_mm2'], 1),
        'window_a_mm': v['window_a'], 'in_air': bool(0 < v_disp < nose.AIR)}
    json.dump(dict(sorted(lm.items())), open(os.path.join(REPO, 'ssb/geometry/landmarks.json'), 'w'), indent=1)
    json.dump(meta, open(os.path.join(REPO, 'ssb/geometry/landmarks.meta.json'), 'w'), indent=1)
    return out, res['report']


# ---------------------------------------------------------------- volume stage
def stage_volume():
    hdr, ct, lab, table = read_as_scanned()
    fr = Frame(hdr)
    by_name = {v: k for k, v in table.items()}
    landmarks = json.load(open(asc('geometry/landmarks.json')))
    charts = json.load(open(asc('geometry/charts.json')))['surfaces']
    say('0. input: as-scanned ssb/ct + ssb/geometry at %s (cached under tools/ssb-pipeline/incoming/_recon/as-scanned)'
        % AS_SCANNED_COMMIT[:8])
    ct, region, nose_rep = nose.unmask_stage(hdr, ct)                   # ST6 steps 1-2: the nose is unmasked and centred
    fit = midline_check(fr, lab, by_name, landmarks)
    crossing = crossing_check(fr, lab, table)
    bone_disp = int(np.median(ct[np.isin(lab, [by_name['s.sphenoid-face.R'], by_name['s.sphenoid-face.L']])]))
    ct1, lab1, sep = centre_septum(fr, ct, lab, table, by_name, charts)
    r2l, l2r, appended = side_map(table, by_name)
    say('   appended .L label indices:', appended or 'none')
    ct2, lab2, relabelled = mirror(fr, ct1, lab1, r2l, l2r, table)
    ct3, lab3, plate_info = plates(fr, ct2, lab2, table, by_name, bone_disp)
    region_std = np.zeros_like(region)
    region_std[:, :, fr.mid:] = region[:, :, fr.mid:]
    region_std[:, :, :fr.mid] = region[:, :, fr.mid + 1:][:, :, ::-1]
    lab3, vrep = nose_labels(fr, ct3, lab3, table, by_name)  # ST6 steps 3-4: the internal valve, the vestibule
    os.makedirs(os.path.dirname(nose.REGION_FILE), exist_ok=True)
    np.savez_compressed(nose.REGION_FILE, region=region_std.astype(np.uint8))
    gz_write(os.path.join(REPO, 'ssb/ct/ct.u8.gz'), ct3, np.uint8)
    gz_write(os.path.join(REPO, 'ssb/ct/labels.u16.gz'), lab3, '<u2')
    json.dump({'version': 1, 'labels': {str(k): v for k, v in sorted(table.items())}},
              open(os.path.join(REPO, 'ssb/geometry/labels.json'), 'w'), indent=2)
    H = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    H['standard'] = {
        'method': 'right half mirrored onto the left (R = 0); septum centred keeping its measured thickness; '
                  'a thin midline plate wherever a paired air space would cross the midline (tools/ssb-pipeline/uw/normalize.py)',
        'asScannedCommit': AS_SCANNED_COMMIT, 'sourceSide': 'R',
        'septumOffsetMm': {'median': sep['median'], 'max': sep['max']},
        'plates': {st: p['plateMm2'] for st, p in plate_info.items()},
        'nose': {'method': 'the external nose unmasked from the UW axial stack between the alar-facial grooves (subnasale - 2 mm to the soft-tissue '
                           'nasion; above S 28 |R| <= 12), each (S, A) row centred on R = 0, the internal valve at the narrowest coronal section of the '
                           'airway, the vestibule labelled in front of it (tools/ssb-pipeline/uw/nose.py, ST6)',
                 'centreOffsetMm': {'median': nose_rep['centre']['median_abs_mm'], 'max': nose_rep['centre']['max_abs_mm']},
                 'regionVoxels': nose_rep['unmask']['voxels'],
                 'valve': {'aMm': vrep['valve']['a'], 'areaMm2': vrep['valve']['area_mm2']},
                 'vestibuleMm3': vrep['vestibule_mm3'],
                 'note': 'the vestibule | cavity boundary is the valve plane (the limen nasi): a proxy for the mucocutaneous junction, which CT does not show'},
        'note': 'Standardized specimen: one head\'s right half, mirrored, with the septum centred - symmetric by '
                'construction, not a real head.'}
    json.dump(H, open(os.path.join(REPO, 'ssb/ct/ct.json'), 'w'), indent=2, ensure_ascii=False)
    os.makedirs(CACHE, exist_ok=True)
    json.dump({'midline': fit, 'crossing': crossing, 'septum': sep, 'relabelled': relabelled, 'plates': plate_info},
              open(os.path.join(CACHE, 'normalize-volume.json'), 'w'), indent=1)
    say('   wrote ssb/ct/{ct.u8.gz,labels.u16.gz,ct.json} and ssb/geometry/labels.json')


# ---------------------------------------------------------------- labels stage (after walls.py)
def read_current():
    hdr = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    nx, ny, nz = hdr['dims']
    ct = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct/ct.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
    lab = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct/labels.u16.gz')).read(), '<u2').reshape(nz, ny, nx).copy()
    table = {int(k): v for k, v in json.load(open(os.path.join(REPO, 'ssb/geometry/labels.json')))['labels'].items()}
    return hdr, ct, lab, table


def stage_labels():
    hdr, ct, lab, table = read_current()
    fr = Frame(hdr)
    by_name = {v: k for k, v in table.items()}
    r2l, l2r, appended = side_map(table, by_name)
    assert not appended, 'labels stage appended a label'
    m = fr.mid
    before = lab.copy()
    right = lab[:, :, m:]
    lab[:, :, m:] = l2r[right]
    lab[:, :, :m] = r2l[lab[:, :, m + 1:][:, :, ::-1]]
    changed = int((lab != before).sum())
    air = np.isin(before, [v for v, n in table.items() if is_air(n)]) | np.isin(lab, [v for v, n in table.items() if is_air(n)])
    air_changed = int(((lab != before) & air).sum())
    say('labels: re-mirrored from the right half after walls.py: %d voxels changed (%d of them air labels)' % (changed, air_changed))
    if air_changed:
        raise SystemExit('re-mirroring changed an air label')
    gz_write(os.path.join(REPO, 'ssb/ct/labels.u16.gz'), lab, '<u2')


# ---------------------------------------------------------------- sides stage (step 6)
def mirrored(p):
    return [round(-p[0], 4) if p[0] else 0.0, p[1], p[2]]


def mirror_sweeps():
    sp = os.path.join(REPO, 'ssb/geometry/sweeps.json'); mp = os.path.join(REPO, 'ssb/geometry/sweeps.meta.json')
    sw = json.load(open(sp)); doc = json.load(open(mp)); meta = doc['sweeps']
    ascm = json.load(open(asc('geometry/sweeps.meta.json')))['sweeps']
    done = []
    for key in sorted(sw):
        if not key.endswith('.R') or key[:-2] + '.L' not in sw:
            continue
        lk = key[:-2] + '.L'
        sw[lk] = {**{k: v for k, v in sw[key].items() if k != 'pts'},
                  'pts': [[(-p[0] if p[0] else 0.0), p[1], p[2]] for p in sw[key]['pts']]}
        if key in meta:
            was = ascm.get(lk, {})
            meta[lk] = {**json.loads(json.dumps(meta[key])), 'mirrored_from': key,
                        'method': 'mirrored from .R (N1)',
                        'asScanned': {k: was[k] for k in ('confidence', 'length_mm', 'status_fraction') if k in was}}
        done.append(lk)
    unpaired = sorted(k for k in sw if (k[:-2] + ('.L' if k.endswith('.R') else '.R')) not in sw)
    json.dump(sw, open(sp, 'w'), indent=1); json.dump(doc, open(mp, 'w'), indent=1)
    say('sweeps: .L := mirrored .R for %d sweeps; unpaired: %s' % (len(done), unpaired or 'none'))


def mirror_landmarks():
    lp = os.path.join(REPO, 'ssb/geometry/landmarks.json'); mp = os.path.join(REPO, 'ssb/geometry/landmarks.meta.json')
    lm = json.load(open(lp)); meta = json.load(open(mp))
    lmeta = meta['landmarks']
    # the as-scanned points: kept once, under asScanned, from the first run
    ascl = json.load(open(asc('geometry/landmarks.json')))
    paired, unpaired, mids = [], [], []
    for key in sorted(lm):
        if key.endswith('.R') and key[:-2] + '.L' in lm:
            lk = key[:-2] + '.L'
            lm[lk] = mirrored(lm[key])
            entry = {'method': 'mirrored from .R (N1)', 'asScanned': ascl.get(lk, lmeta.get(lk, {}).get('asScanned'))}
            if 'inferior_margin_s_mm' in lmeta.get(key, {}):
                entry['inferior_margin_s_mm'] = lmeta[key]['inferior_margin_s_mm']
                entry['inferior_margin_method'] = lmeta[key].get('inferior_margin_method')
            lmeta[lk] = entry
            paired.append(key[:-2])
        elif key.endswith('.M'):
            old = lmeta.get(key, {})
            lm[key] = [0.0, lm[key][1], lm[key][2]]
            lmeta[key] = {**old, 'method': 'R := 0 (N1); %s' % old.get('sourceMethod', old.get('method', '')),
                          'sourceMethod': old.get('sourceMethod', old.get('method')), 'asScanned': ascl.get(key, old.get('asScanned'))}
            mids.append(key)
    unpaired = sorted(k for k in lm if k[-2:] in ('.R', '.L') and k[:-2] + ('.L' if k.endswith('.R') else '.R') not in lm)
    json.dump(dict(sorted(lm.items())), open(lp, 'w'), indent=1)
    json.dump(meta, open(mp, 'w'), indent=1)
    say('landmarks: %d pairs mirrored (.L := .R, R negated), %d .M set to R = 0; kept as scanned (one side only): %s'
        % (len(paired), len(mids), unpaired))
    return unpaired


def mirror_chart():
    p = os.path.join(REPO, 'ssb/geometry/charts.json')
    c = json.load(open(p))
    R = c['surfaces']['s.septal-mucosa.R']
    L = json.loads(json.dumps(R))
    g = L['grid']
    g['r'] = [[None if v is None else (-v if v else 0.0) for v in row] for row in g['r']]
    g['normal'] = [[None if n is None else [(-n[0] if n[0] else 0.0), n[1], n[2]] for n in row] for row in g['normal']]
    L['rule'] = R['rule'] + ' (the left chart is the right chart mirrored: r negated, normals mirrored; N1)'
    c['surfaces']['s.septal-mucosa.L'] = L
    c['note'] = c.get('note', '') + ('' if 'N1' in c.get('note', '') else
                                     '; the standard specimen\'s left chart is the right one mirrored (tools/ssb-pipeline/uw/normalize.py)')
    json.dump(c, open(p, 'w'), separators=(',', ':'))
    say('chart: s.septal-mucosa.L := s.septal-mucosa.R with r negated')


def stage_sides():
    unpaired = mirror_landmarks()
    mirror_sweeps()
    mirror_chart()
    return unpaired


# ---------------------------------------------------------------- all
def run(*cmd):
    say('$', ' '.join(os.path.relpath(c, REPO) if os.path.isabs(c) and c.startswith(REPO) else c for c in cmd))
    subprocess.run(list(cmd), cwd=REPO, check=True)


def chart_edges(doc):
    """{surface: (anterior A of the chart's last occupied row, area cm2)} for the septal charts."""
    out = {}
    for name in ('s.septal-mucosa.R', 's.septal-mucosa.L'):
        s = doc['surfaces'][name]
        g = s['grid']
        rows = [i for i, row in enumerate(g['r']) if any(v is not None for v in row)]
        out[name] = (g['origin'][0] + max(rows), s['area_cm2'])
    return out


def report_nose():
    """ST6 step 7 and the budgets: the septal charts' new anterior edge against HEAD's, and the packs against 5.4."""
    def head(path):
        return json.loads(subprocess.run(['git', 'show', 'HEAD:' + path], cwd=REPO, check=True, capture_output=True).stdout)
    new = chart_edges(json.load(open(os.path.join(REPO, 'ssb/geometry/charts.json'))))
    old = chart_edges(head('ssb/geometry/charts.json'))
    for name in new:
        say('ST6 7. %s: anterior edge A %.1f mm (was %.1f), area %.2f cm2 (was %.2f, %+.2f)'
            % (name, new[name][0], old[name][0], new[name][1], old[name][1], new[name][1] - old[name][1]))
    man = json.load(open(os.path.join(REPO, 'ssb/models/packs.json')))
    was = head('ssb/models/packs.json')
    tot, wtot = man['totals'], was['totals']
    say('   packs: %d bytes, %d triangles (HEAD: %d, %d; 5.4 budgets: 12 MB, 400k triangles); new/changed: %s'
        % (tot['bytes'], tot['triangles'], wtot['bytes'], wtot['triangles'],
           {k: (p['bytes'], p['triangles']) for k, p in man['packs'].items() if k not in was['packs'] or was['packs'][k]['bytes'] != p['bytes']}))
    core = man['packs']['core']
    say('   first render (graph + core): core %d bytes (HEAD %d; 5.4 budget 2.5 MB)' % (core['bytes'], was['packs']['core']['bytes']))
    ctb = sum(os.path.getsize(os.path.join(REPO, 'ssb/ct', f)) for f in os.listdir(os.path.join(REPO, 'ssb/ct')) if f.endswith('.gz'))
    ctw = 0
    for f in os.listdir(os.path.join(REPO, 'ssb/ct')):
        if f.endswith('.gz'):
            ctw += len(subprocess.run(['git', 'show', 'HEAD:ssb/ct/' + f], cwd=REPO, check=True, capture_output=True).stdout)
    say('   CT + labels + distance fields: %d bytes (HEAD %d; 5.4 budget 6 MB)' % (ctb, ctw))


def stage_all():
    os.makedirs(CACHE, exist_ok=True)
    stage_volume()
    run(PY, os.path.join(HERE, 'walls.py'))
    stage_labels()
    mirror_sweeps()
    run(PY, os.path.join(HERE, 'meshes.py'))
    run(PY, os.path.join(HERE, 'sdf.py'))
    run(PY, os.path.join(HERE, 'softtissue.py'))
    run(PY, os.path.join(HERE, 'lining.py'))
    run(PY, os.path.join(HERE, 'nose.py'), 'pack')
    stage_sides()
    report_nose()
    run(PY, os.path.join(HERE, 'dissect.py'))      # last: the dissection states read the finished base (P1b)


# ---------------------------------------------------------------- --base scanned (WP RA3b)
SCANNED_ROOT = os.path.abspath(os.path.join(HERE, '..', 'incoming', '_recon', 'scanned-root'))   # gitignored (incoming/)
SCANNED_OUT = os.path.join(REPO, 'ssb', 'anatomy', 'scanned')
ANATOMY_INDEX = os.path.join(REPO, 'ssb', 'anatomy', 'index.json')
NASALSEG = os.path.join(REPO, 'ssb', 'anatomy', 'population', 'nasalseg.json')
STAGE_SCRIPTS = ('walls.py', 'meshes.py', 'sdf.py', 'softtissue.py', 'lining.py', 'nose.py')


def build_scanned_root():
    """A scratch repository root holding a copy of this directory: the stage scripts find ssb/ by their own location, so run
    from here they read and write this root's ssb/ct, ssb/geometry and ssb/models and the standard specimen's are untouched."""
    import shutil
    if os.path.isdir(SCANNED_ROOT):
        shutil.rmtree(SCANNED_ROOT)
    uw = os.path.join(SCANNED_ROOT, 'tools', 'ssb-pipeline', 'uw')
    os.makedirs(uw)
    for f in sorted(os.listdir(HERE)):
        if f.endswith(('.py', '.json')):
            shutil.copy2(os.path.join(HERE, f), uw)
    inc = os.path.join(SCANNED_ROOT, 'tools', 'ssb-pipeline', 'incoming')
    os.makedirs(os.path.join(inc, '_recon'))
    os.symlink(os.path.abspath(os.path.join(HERE, '..', 'incoming', 'uw-sinusanatomy2')), os.path.join(inc, 'uw-sinusanatomy2'))
    for d in ('ct', 'geometry', 'models'):
        os.makedirs(os.path.join(SCANNED_ROOT, 'ssb', d))
    return SCANNED_ROOT


def side_swap(table, by_name):
    """index -> index of the same id's other side (R <-> L), .M and unnamed unchanged: a volume flipped along R then reads its
    left side as a right one, so a rule written for the right can be run on the left without a second copy of it."""
    swap = np.arange(max(table) + 1, dtype=np.uint16)
    for v, n in table.items():
        if side(n) == 'R' and stem(n) + '.L' in by_name:
            swap[v] = by_name[stem(n) + '.L']; swap[by_name[stem(n) + '.L']] = v
    return swap


VEST_SMALL_MAX = 0.02      # RA3b ruling: components other than the largest may total at most this fraction of it (a speck, not a leak)


def largest_vestibule(fr, res, sd):
    """RA3b ruling on the vestibule rule: keep this side's largest component; the smaller ones go back to s.nasal-cavity (their voxel
    count is printed) and the stage still fails when they total more than 2 % of the largest. The leak check (nose.VEST_LIMITS) is
    judged on the kept component. Mutates and returns res: res['vest'] is the kept component, res['join'] gains the rest."""
    from scipy import ndimage as ndi_
    cc, n = ndi_.label(res['vest'])
    sizes = np.bincount(cc.ravel())[1:]
    big = int(np.argmax(sizes)) + 1
    small = res['vest'] & (cc != big)
    n_small, n_big = int(small.sum()), int(sizes.max())
    say('   side %s: vestibule components %d (voxels %s); kept the largest (%d voxels); %d voxels (%.2f %% of it) of the smaller ones go back to the cavity'
        % (sd, n, sorted(int(x) for x in sizes)[::-1], n_big, n_small, 100.0 * n_small / n_big))
    if n_small > VEST_SMALL_MAX * n_big:
        raise SystemExit('ESCALATE: side %s: the smaller vestibule components total %d voxels, more than %g %% of the largest (%d)' % (sd, n_small, 100 * VEST_SMALL_MAX, n_big))
    res['vest'] = cc == big
    res['join'] = res['join'] | small
    kk, jj, ii = np.nonzero(res['vest'])
    ext = {'abs_r_mm': float(np.abs(fr.r[ii]).max()), 'max_a_mm': float(fr.a[jj].max()), 'min_a_mm': float(fr.a[jj].min()), 's_mm': [float(fr.s[kk].min()), float(fr.s[kk].max())]}
    leak = ext['abs_r_mm'] > nose.VEST_LIMITS['abs_r_mm'] or ext['max_a_mm'] > nose.VEST_LIMITS['max_a_mm']
    rep = res['report']
    rep.update({'vestibule_voxels': n_big, 'vestibule_mm3': round(n_big * nose.STEP ** 3, 1), 'components': 1, 'extent': ext, 'leak': bool(leak),
                'returned_to_cavity_voxels': n_small, 'join_voxels': int(res['join'].sum())})
    return res


def scanned_nose(fr, ct, lab, table, by_name, V):
    """ST6 for a head that is not mirrored: lm.naris, the internal valve and the vestibule on EACH side from that side's own
    airway (nose.valve_and_vestibule is written for the right; the left is run on the volume flipped along R with the sides
    swapped, and its masks flipped back). Returns (labels, landmarks, meta, report)."""
    A, dz, _ = nose.sp.frame()
    D = nose.sp.resample(V, A, dz, box=nose.BOX, step=nose.STEP)
    swap = side_swap(table, by_name)
    ct_f, lab_f = ct[:, :, ::-1], swap[lab[:, :, ::-1]]
    out = lab.copy()
    lm, meta, rep = {}, {}, {}
    cav = {sd: by_name['%s.%s' % (nose.CAVITY, sd)] for sd in 'RL'}
    ves = {sd: by_name['%s.%s' % (nose.VESTIBULE, sd)] for sd in 'RL'}
    joins, vests = {}, {}
    for sd, sg in (('R', 1), ('L', -1)):
        f = nose.locate(D, sg)
        if f is None:
            raise SystemExit('ESCALATE: no enclosed vestibule lumen on side ' + sd)
        naris, s_lo = f['p'], f['band_s'][0]
        lm['lm.naris.' + sd] = naris
        meta['lm.naris.' + sd] = {
            'method': ('vestibule lumen of the unmasked axial stack: air (0 < display < 78) on this side of the midline with tissue (>= 78) within 12 mm '
                       'medially and laterally on the same row, A -2..16, S 0..10; centroid of the lumen voxels in the 3 mm S band of largest lumen area, '
                       'found on this side itself (tools/ssb-pipeline/uw/nose.py, E1b; the scanned base is not mirrored, RA3b)'),
            'band_s_mm': f['band_s'], 'lumen_area_mm2': f['lumen_area_mm2'], 'n_voxels': f['n_voxels']}
        if sd == 'R':
            res = nose.valve_and_vestibule(ct, lab, by_name, fr.r, fr.a, fr.s, naris, s_lo)
        else:
            res = nose.valve_and_vestibule(ct_f, lab_f, by_name, fr.r, fr.a, fr.s, [-naris[0], naris[1], naris[2]], s_lo)
            res['vest'] = res['vest'][:, :, ::-1]; res['join'] = res['join'][:, :, ::-1]
            res['valve']['centroid'] = [round(-res['valve']['centroid'][0], 2) or 0.0, res['valve']['centroid'][1], res['valve']['centroid'][2]]
        say('   side %s (%s):' % (sd, 'as scanned' if sd == 'R' else 'run on the volume flipped along R'))
        res = largest_vestibule(fr, res, sd)
        nose.say_vestibule(res['report'])
        rep[sd] = res['report']
        joins[sd], vests[sd] = res['join'], res['vest']
        v = res['valve']
        vc = v['centroid']
        lm['s.internal-nasal-valve.' + sd] = vc
        k, j, i = (int(round(x)) for x in ((vc[2] - fr.s[0]) / fr.step, (vc[1] - fr.a[0]) / fr.step, (vc[0] - fr.r[0]) / fr.step))
        in_air = bool(0 < ct[k, j, i] < nose.AIR)
        meta['s.internal-nasal-valve.' + sd] = {
            'method': 'centroid of this side\'s coronal section of smallest area (3 mm moving mean) over A from lm.naris - 25 to - 10 mm: the airway is the air connected to '
                      'lm.naris among this side\'s nasal cavity and the unlabelled air in front of it (tools/ssb-pipeline/uw/nose.py, ST6; computed on each side, RA3b)',
            'a_mm': v['a'], 'section_area_mm2': round(v['area_mm2'], 1), 'smoothed_area_mm2': round(v['smoothed_area_mm2'], 1),
            'window_a_mm': v['window_a'], 'in_air': in_air}
        say('   valve landmark %s %s: label %s, display %d (%s)' % (sd, vc, table.get(int(out[k, j, i]), '-'), int(ct[k, j, i]), 'in air' if in_air else 'NOT in air'))
    both = joins['R'] & joins['L']
    both |= vests['R'] & vests['L']
    both |= (vests['R'] | joins['R']) & (vests['L'] | joins['L'])
    if both.any():
        raise SystemExit('ESCALATE: the two sides\' vestibule/cavity masks overlap (%d voxels): the airways meet across the midline' % int(both.sum()))
    for sd in 'RL':
        out[joins[sd]] = cav[sd]
    for sd in 'RL':
        out[vests[sd]] = ves[sd]
    return out, lm, meta, rep


def stage_scanned_volume(root):
    hdr, ct, lab, table_as = read_as_scanned()
    fr = Frame(hdr)
    table = {int(k): v for k, v in json.load(open(os.path.join(REPO, 'ssb/geometry/labels.json')))['labels'].items()}
    bad = {k: (v, table.get(k)) for k, v in table_as.items() if table.get(k) != v}
    if bad:
        raise SystemExit('ESCALATE: the standard label table does not extend the as-scanned one (append only was broken): %s' % bad)
    by_name = {v: k for k, v in table.items()}
    landmarks = json.load(open(asc('geometry/landmarks.json')))
    say('0. input: as-scanned ssb/ct + ssb/geometry at %s; label table = the standard one (append only), so an index means one name on every base'
        % AS_SCANNED_COMMIT[:8])
    fit = midline_check(fr, lab, by_name, landmarks)
    # ST6 step 1 only: the nose unmasked. Step 2 (centring each row on R = 0) is a normalization and is skipped.
    r, a, s = fr.r, fr.a, fr.s
    V = nose.load('axial')
    A, dz, _ = nose.sp.frame()
    U = nose.sp.resample(V.astype(np.float32), A, dz, box={'r': (r[0], r[-1]), 'a': (a[0], a[-1]), 's': (s[0], s[-1])}, step=nose.STEP)
    region, patch, nrep = nose.unmask(hdr, ct, U)
    nose.say_unmask(nrep)
    ct1 = np.where(region, patch, ct).astype(np.uint8)
    say('ST6 2. skipped (scanned base): the nose is not centred; the region is the unmasked skin as scanned (%d voxels)' % int(region.sum()))
    lab1, nlm, nmeta, vrep = scanned_nose(fr, ct1, lab, table, by_name, V)
    lm = json.load(open(asc('geometry/landmarks.json')))
    meta = json.load(open(asc('geometry/landmarks.meta.json')))
    for k, v in nlm.items():
        was = lm.get(k)
        lm[k] = v
        meta['landmarks'][k] = {**nmeta[k], **({'superseded': {'value': was, 'reason': 'as-scanned value before E1b (the left point lay inside the caudal septum, verification 2026-10-03)'}}
                                                if k.startswith('lm.naris') and was and was != v else {})}
    R_ = os.path.join(root, 'ssb')
    gz_write(os.path.join(R_, 'ct/ct.u8.gz'), ct1, np.uint8)
    gz_write(os.path.join(R_, 'ct/labels.u16.gz'), lab1, '<u2')
    H = dict(hdr)
    H['scanned'] = {
        'method': 'head A as scanned: the same stages as the standard head without the septum centring, the mirror, the midline plates, the nose centring and the '
                  'landmark/sweep/chart mirroring (tools/ssb-pipeline/uw/normalize.py --base scanned, WP RA3b); the nose is unmasked from the UW axial stack as for the standard head',
        'asScannedCommit': AS_SCANNED_COMMIT,
        'midline': fit,
        'nose': {'regionVoxels': nrep['voxels'], 'centred': False,
                 'valve': {sd: {'aMm': vrep[sd]['valve']['a'], 'areaMm2': vrep[sd]['valve']['area_mm2']} for sd in 'RL'},
                 'vestibuleMm3': {sd: vrep[sd]['vestibule_mm3'] for sd in 'RL'}}}
    json.dump(H, open(os.path.join(R_, 'ct/ct.json'), 'w'), indent=2, ensure_ascii=False)
    json.dump({'version': 1, 'labels': {str(k): v for k, v in sorted(table.items())}}, open(os.path.join(R_, 'geometry/labels.json'), 'w'), indent=2)
    json.dump(dict(sorted(lm.items())), open(os.path.join(R_, 'geometry/landmarks.json'), 'w'), indent=1)
    json.dump(meta, open(os.path.join(R_, 'geometry/landmarks.meta.json'), 'w'), indent=1)
    for f in ('charts.json', 'sweeps.json', 'sweeps.meta.json'):
        open(os.path.join(R_, 'geometry', f), 'wb').write(open(asc('geometry/' + f), 'rb').read())
    os.makedirs(os.path.join(root, 'tools', 'ssb-pipeline', 'incoming', '_recon'), exist_ok=True)
    np.savez_compressed(os.path.join(root, 'tools', 'ssb-pipeline', 'incoming', '_recon', 'nose-region.npz'), region=region.astype(np.uint8))
    np.save(os.path.join(root, 'tools', 'ssb-pipeline', 'incoming', '_recon', 'labels-after-nose.npy'), lab1)     # for the transition table
    say('   wrote the scanned volume and as-scanned geometry under', os.path.relpath(R_, REPO))


def export_scanned(root):
    import shutil
    if os.path.isdir(SCANNED_OUT):
        shutil.rmtree(SCANNED_OUT)
    for d, keep in (('ct', None), ('geometry', ('labels.json', 'landmarks.json', 'landmarks.meta.json', 'charts.json', 'sweeps.json', 'sweeps.meta.json')),
                    ('models', None)):
        os.makedirs(os.path.join(SCANNED_OUT, d))
        for f in sorted(os.listdir(os.path.join(root, 'ssb', d))):
            if keep is None or f in keep:
                shutil.copyfile(os.path.join(root, 'ssb', d, f), os.path.join(SCANNED_OUT, d, f))
    say('exported ssb/anatomy/scanned/{ct,geometry,models}')


def ai_pct(r, l):
    return 100.0 * (r - l) / ((r + l) / 2.0)


def percentile_of(value, dist):
    d = np.asarray(dist, float)
    return round(100.0 * float((d < value).mean() + 0.5 * (d == value).mean()), 1)


def scanned_report():
    """Volumes and asymmetry indices of the scanned base, from its own labels, beside the right's, the as-scanned (pre-N1) labels' and the NasalSeg
    percentiles (same AI and percentile conventions as tools/ssb-pipeline/nasalseg/stats.py). Returns the dict index.json records."""
    hdr = json.load(open(os.path.join(SCANNED_OUT, 'ct/ct.json')))
    nx, ny, nz = hdr['dims']
    lab = np.frombuffer(gzip.open(os.path.join(SCANNED_OUT, 'ct/labels.u16.gz')).read(), '<u2').reshape(nz, ny, nx)
    table = {int(k): v for k, v in json.load(open(os.path.join(SCANNED_OUT, 'geometry/labels.json')))['labels'].items()}
    _, _, lab_as, table_as = read_as_scanned()
    ml = (hdr['spacing'][0] / 10.0) ** 3
    cnt = np.bincount(lab.ravel(), minlength=max(table) + 1)
    cnt_as = np.bincount(lab_as.ravel(), minlength=max(table_as) + 1)
    by = {v: k for k, v in table.items()}
    by_as = {v: k for k, v in table_as.items()}
    vol = lambda n: round(float(cnt[by[n]]) * ml, 3)
    vol_as = lambda n: round(float(cnt_as[by_as[n]]) * ml, 3) if n in by_as else None
    rows = {}
    for key, name in (('cavity', 's.nasal-cavity'), ('vestibule', 's.nasal-vestibule'), ('inferiorTurbinate', 's.inferior-turbinate'), ('maxillary', 's.maxillary-sinus')):
        rows[key] = {'R': vol(name + '.R'), 'L': vol(name + '.L'), 'asScannedLabelsR': vol_as(name + '.R'), 'asScannedLabelsL': vol_as(name + '.L')}
    rows['cavityPlusVestibule'] = {sd: round(rows['cavity'][sd] + rows['vestibule'][sd], 3) for sd in 'RL'}
    ns = json.load(open(NASALSEG))
    clear = [r for r in ns['subjects'] if r.get('review') == {'R': 'clear', 'L': 'clear'} and not r.get('labelDefect')]
    dist = {'cavity': [abs(ai_pct(r['cavity.R']['ml'], r['cavity.L']['ml'])) for r in clear],
            'maxillary': [abs(ai_pct(r['maxillary.R']['ml'], r['maxillary.L']['ml'])) for r in clear]}
    assert len(clear) == ns['summary']['clear']['cavity']['absAI']['n'], 'the clear subjects of nasalseg.json are not the 88 its summary counts'
    out = {'volumesMl': rows, 'nasalSeg': {'clearSubjects': len(clear)}, 'asymmetryIndex': {}}
    say('\nRA3b volumes (mL, air or wall-unit hull by label; scanned base | the as-scanned labels of the same head):')
    for key in ('cavity', 'vestibule', 'cavityPlusVestibule', 'inferiorTurbinate', 'maxillary'):
        r = rows[key]
        was = ('   as-scanned labels R %s L %s' % (r.get('asScannedLabelsR'), r.get('asScannedLabelsL'))) if 'asScannedLabelsR' in r else ''
        say('  %-20s R %7.3f   L %7.3f   L/R %.3f%s' % (key, r['R'], r['L'], r['L'] / r['R'] if r['R'] else float('nan'), was))
    for key, label in (('cavity', 'cavity'), ('cavityPlusVestibule', 'cavity+vestibule'), ('maxillary', 'maxillary')):
        r = rows[key]
        ai = round(ai_pct(r['R'], r['L']), 2)
        d = dist['maxillary' if key == 'maxillary' else 'cavity']
        pct = percentile_of(abs(ai), d)
        p = ns['summary']['clear']['maxillary' if key == 'maxillary' else 'cavity']['absAI']
        beyond = bool(abs(ai) > max(d))
        out['asymmetryIndex'][key] = {'ai': ai, 'absAiPercentileClear': pct, 'clearAbsAiMax': round(max(d), 2), 'beyondAllClear': beyond,
                                      'clearAbsAi': {k: p[k] for k in ('p25', 'p50', 'p75', 'p95')}}
        say('  AI %-17s %+7.2f %%  |AI| at the %5.1f th percentile of the %d clear NasalSeg subjects (p50 %.1f, p75 %.1f, p95 %.1f, max %.1f)%s'
            % (label, ai, pct, len(clear), p['p50'], p['p75'], p['p95'], max(d), '  - BEYOND EVERY CLEAR SUBJECT' if beyond else ''))
    ha = ns['headA']
    out['nasalSegHeadA'] = {'cavityAI': ha['AI']['cavity'], 'maxillaryAI': ha['AI']['maxillary'],
                            'cavityMl': {'R': ha['cavity.R'], 'L': ha['cavity.L']}, 'percentileAbsAIClear': ha['percentileAbsAI_clear']}
    say('  nasalseg.json head A (as-scanned labels): cavity R %.3f L %.3f mL, AI %+.2f %% (percentile %.1f); maxillary AI %+.2f %% (percentile %.1f)'
        % (ha['cavity.R'], ha['cavity.L'], ha['AI']['cavity'], ha['percentileAbsAI_clear']['cavity'], ha['AI']['maxillary'], ha['percentileAbsAI_clear']['maxillary']))
    return out


TRANSITION_MIN = 20        # pairs under this many voxels are summed into one row per step


def scanned_transitions(root):
    """RA3b ruling 2: exact accounting of every label the scanned base changed against the as-scanned labels, per step, by voxel counts.
    Steps own pairs by construction (the label volume at the end of each): `ST6 vestibule + valve` (as-scanned -> after normalize.py's
    nose step: may only move unlabelled or cavity voxels into the vestibule or the cavity) and `wall units` (after the nose step -> final,
    after walls.py re-derived the wall units: may not touch an air label). The nose unmask changes the display values of its region and no
    label. ESCALATE when a tissue voxel (display >= 78) became an air label, an air-valued voxel left an air label, or a pair is owned
    by the wrong step. Prints the table; returns what index.json records."""
    hdr, ct0, lab0, _ = read_as_scanned()
    nz, ny, nx = ct0.shape
    R_ = os.path.join(SCANNED_OUT, 'ct')
    lab2 = np.frombuffer(gzip.open(os.path.join(R_, 'labels.u16.gz')).read(), '<u2').reshape(nz, ny, nx)
    ct2 = np.frombuffer(gzip.open(os.path.join(R_, 'ct.u8.gz')).read(), np.uint8).reshape(nz, ny, nx)
    lab1 = np.load(os.path.join(root, 'tools', 'ssb-pipeline', 'incoming', '_recon', 'labels-after-nose.npy'))
    table = {int(k): v for k, v in json.load(open(os.path.join(SCANNED_OUT, 'geometry/labels.json')))['labels'].items()}
    table[0] = '(unlabelled)'
    air = np.zeros(max(table) + 1, bool)
    for k, v in table.items():
        if k and is_air(v):
            air[k] = True
    ml = (hdr['spacing'][0] / 10.0) ** 3

    def step(name, a, b, owns):
        ch = a != b
        pairs, cnt = np.unique(np.stack([a[ch], b[ch]], 1), axis=0, return_counts=True)
        rows = sorted(((table[int(x)], table[int(y)], int(c)) for (x, y), c in zip(pairs, cnt)), key=lambda r: -r[2])
        wrong = [r for r in rows if not owns(r[0], r[1])]
        big = [r for r in rows if r[2] >= TRANSITION_MIN]
        rest = sum(r[2] for r in rows if r[2] < TRANSITION_MIN)
        say('\nRA3b label transitions - %s: %d voxels change label (%.3f mL), %d (from, to) pairs' % (name, int(ch.sum()), ch.sum() * ml, len(rows)))
        for f, t, c in big:
            say('  %-34s -> %-34s %7d  (%.3f mL)' % (f, t, c, c * ml))
        if rest:
            say('  %d smaller pairs (< %d voxels each) %s %d' % (len(rows) - len(big), TRANSITION_MIN, ' ' * 30, rest))
        if wrong:
            raise SystemExit('ESCALATE: %s owns a label change it should not: %s' % (name, wrong[:6]))
        return {'voxels': int(ch.sum()), 'pairs': [{'from': f, 'to': t, 'voxels': c} for f, t, c in big], 'smallerPairsVoxels': int(rest), 'pairCount': len(rows)}
    cav_like = lambda n: n.startswith(('s.nasal-cavity.', 's.nasal-vestibule.', '(unlabelled)'))
    s1 = step('ST6 vestibule + valve (normalize.py)', lab0, lab1, lambda f, t: cav_like(f) and cav_like(t) and f != t)
    s2 = step('wall units (walls.py re-run on the labels after the vestibule step)', lab1, lab2,
              lambda f, t: not (f != '(unlabelled)' and is_air(f)) and not (t != '(unlabelled)' and is_air(t)))
    nose_ct = int((ct0 != ct2).sum())
    labs_in_nose = int(((ct0 != ct2) & (lab0 != lab1)).sum())
    say('\nRA3b nose unmask (ST6 step 1; no centring): %d voxels change display value; %d of them take a label in the vestibule step above (the unmasked airway is what the vestibule is labelled on)' % (nose_ct, labs_in_nose))
    a0, a2 = air[lab0], air[lab2]
    ch = lab0 != lab2
    t2a = int((ch & ~a0 & a2 & (ct2 >= 78)).sum())
    a2n = int((ch & a0 & ~a2).sum())
    say('RA3b tissue <-> air: tissue voxels (display >= 78) that became an air label: %d; voxels that left an air label for a non-air label: %d' % (t2a, a2n))
    if t2a or a2n:
        raise SystemExit('ESCALATE: tissue became an air label (%d voxels) or an air label was lost (%d voxels)' % (t2a, a2n))
    net = {}
    for name in ('s.nasal-cavity', 's.nasal-vestibule', 's.inferior-turbinate', 's.middle-turbinate', 's.nasal-septum', 's.maxillary-sinus'):
        for sd in ('R', 'L', 'M'):
            n = '%s.%s' % (name, sd)
            ids = [k for k, v in table.items() if v == n]
            if not ids:
                continue
            was, now = int((lab0 == ids[0]).sum()), int((lab2 == ids[0]).sum())
            net[n] = {'asScannedVoxels': was, 'scannedVoxels': now, 'asScannedMl': round(was * ml, 3), 'scannedMl': round(now * ml, 3)}
            say('  net %-26s as scanned %8d voxels (%.3f mL) -> %8d (%.3f mL), %+d' % (n, was, was * ml, now, now * ml, now - was))
    return {'noseUnmask': {'displayChangedVoxels': nose_ct, 'labelledInVestibuleStep': labs_in_nose}, 'vestibuleAndValve': s1, 'wallUnits': s2,
            'tissueBecameAirLabel': t2a, 'airLabelLost': a2n, 'net': net}


def write_index(report, absent, transitions):
    """The `scanned` entry of ssb/anatomy/index.json: written, never typed. It keeps every other key of the file."""
    idx = json.load(open(ANATOMY_INDEX)) if os.path.exists(ANATOMY_INDEX) else {'version': 1}
    idx.setdefault('bases', {}); idx.setdefault('variants', {}); idx.setdefault('conditions', {}); idx.setdefault('compat', [])
    cav, mx = report['asymmetryIndex']['cavity'], report['asymmetryIndex']['maxillary']
    cvs = report['asymmetryIndex']['cavityPlusVestibule']
    vols = report['volumesMl']
    n_clear = report['nasalSeg']['clearSubjects']
    where = ('|AI| beyond all %d clear NasalSeg subjects (95th percentile %.0f %%, maximum %.0f %%)' % (n_clear, cvs['clearAbsAi']['p95'], cvs['clearAbsAiMax']) if cvs['beyondAllClear']
             else '|AI| at the %.0fth percentile of the %d clear NasalSeg subjects' % (cvs['absAiPercentileClear'], n_clear))
    note = ('Head A as scanned (not mirrored, septum not centred). The closest comparison with NasalSeg\'s nasal cavity, which includes the vestibule, is cavity + vestibule: '
            'asymmetry %+.0f %%, %s; the cavity label alone is %+.0f %%. Maxillary asymmetry %+.0f %% (|AI| at the %.0fth percentile). '
            'The comparison is not like for like: NasalSeg labels CT at its HU threshold, this head\'s labels sit on display levels of a screen capture (ssb/LICENSE-data.md). '
            '%s'
            'Part of the cavity and turbinate asymmetry may be physiological, consistent with the nasal cycle in undecongested mucosa. '
            'Charts and soft products that failed their gate on this head are absent, not loosened (see absent).'
            % (cvs['ai'], where, cav['ai'], mx['ai'], mx['absAiPercentileClear'],
               ('The left side may be genuinely extreme (septal bow, a congested left inferior turbinate) or the labels may give left meatal air to other compartments; '
                'the numbers are consistent with either, and the resegmentation (RS) is to separate them. ' if cvs['beyondAllClear'] else '')))
    idx['bases']['scanned'] = {
        'label': 'Normal asymmetry (head A as scanned)',
        'root': 'ssb/anatomy/scanned',
        'truth': 'specimen',
        'note': note,
        'generatedBy': 'tools/ssb-pipeline/uw/normalize.py --base scanned',
        'volumesMl': vols,
        'asymmetryIndex': report['asymmetryIndex'],
        'population': 'ssb/anatomy/population/nasalseg.json',
        'absent': absent,
        'labelTransitions': transitions,
    }
    json.dump(idx, open(ANATOMY_INDEX, 'w'), indent=2, ensure_ascii=False)
    open(ANATOMY_INDEX, 'a').write('\n')
    say('wrote', os.path.relpath(ANATOMY_INDEX, REPO))


def stage_scanned():
    ensure_as_scanned()
    root = build_scanned_root()
    stage_scanned_volume(root)
    uw = os.path.join(root, 'tools', 'ssb-pipeline', 'uw')

    def run_in(*cmd):
        say('$ (scanned-root)', ' '.join(os.path.basename(c) if os.path.isabs(c) else c for c in cmd))
        subprocess.run(list(cmd), cwd=root, check=True)
    run_in(PY, os.path.join(uw, 'walls.py'))
    run_in(PY, os.path.join(uw, 'meshes.py'))
    run_in(PY, os.path.join(uw, 'sdf.py'))
    run_in(PY, os.path.join(uw, 'softtissue.py'), '--per-side')
    run_in(PY, os.path.join(uw, 'lining.py'))
    run_in(PY, os.path.join(uw, 'nose.py'), 'pack')
    export_scanned(root)
    absent = json.load(open(os.path.join(root, 'ssb', 'geometry', 'absent.json')))
    say('absent on the scanned base (RA3b ruling: a stage-D product that fails its gate is left out, never loosened):', json.dumps(absent, indent=1))
    write_index(scanned_report(), absent, scanned_transitions(root))


if __name__ == '__main__':
    if sys.argv[1:] == ['--base', 'scanned']:
        stage_scanned()
        sys.exit(0)
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    {'all': stage_all, 'volume': stage_volume, 'labels': stage_labels, 'sides': stage_sides}[what]()
