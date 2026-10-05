"""Reference specimen, stage N: the standard specimen (owner decision O6, docs/ssb.md 5.1; roadmap WP N1).

    .venv/bin/python tools/ssb-pipeline/uw/normalize.py [all|volume|labels|sides]

The page serves a symmetric, standard head: the as-scanned UW head's RIGHT half mirrored onto the left, the
nasal septum centred (keeping its measured thickness), and a thin midline plate wherever a paired air space
would otherwise cross the midline. The as-scanned volume stays this stage's input and is not served.

Input (step 0): the as-scanned files, read with `git show <AS_SCANNED_COMMIT>:<path>` and cached under
incoming/_recon/as-scanned/ (gitignored). `normalize.py` never reads the committed ssb/ct as input, so a rerun
is idempotent.

Stages (`all` runs them in this order, with the pipeline stages between them):

  volume   steps 1-5: midline check, septum centring, mirror, midline plates, ct.json "standard".
           Writes ssb/ct/ct.u8.gz, labels.u16.gz, ct.json, ssb/geometry/labels.json (append only).
  -        walls.py   (re-derives the wall units from the mirrored air labels)
  labels   re-mirrors the label volume from the right half after walls.py, so the symmetry is exact (a
           marker watershed breaks ties by scan order); the air labels and the CT do not change.
  -        sweeps mirrored (below) so sdf.py sees symmetric tubes, then meshes.py, sdf.py, softtissue.py
           (which runs sweeps_soft.py)
  sides    step 6: every paired landmark .L := .R with R negated, .M R := 0; sweeps.json .L := mirrored .R;
           s.septal-mucosa.L's chart := .R's with r negated. The as-scanned landmarks stay in the meta files
           under `asScanned`. Unpaired landmarks (one side only) stay as scanned and are listed.

Deterministic: gzip mtime 0, no randomness.

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
           's.maxillary-sinus', 's.nasal-cavity', 's.nasopharynx', 's.posterior-ethmoid-cells', 's.sphenoid-sinus')
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


# ---------------------------------------------------------------- volume stage
def stage_volume():
    hdr, ct, lab, table = read_as_scanned()
    fr = Frame(hdr)
    by_name = {v: k for k, v in table.items()}
    landmarks = json.load(open(asc('geometry/landmarks.json')))
    charts = json.load(open(asc('geometry/charts.json')))['surfaces']
    say('0. input: as-scanned ssb/ct + ssb/geometry at %s (cached under tools/ssb-pipeline/incoming/_recon/as-scanned)'
        % AS_SCANNED_COMMIT[:8])
    fit = midline_check(fr, lab, by_name, landmarks)
    crossing = crossing_check(fr, lab, table)
    bone_disp = int(np.median(ct[np.isin(lab, [by_name['s.sphenoid-face.R'], by_name['s.sphenoid-face.L']])]))
    ct1, lab1, sep = centre_septum(fr, ct, lab, table, by_name, charts)
    r2l, l2r, appended = side_map(table, by_name)
    say('   appended .L label indices:', appended or 'none')
    ct2, lab2, relabelled = mirror(fr, ct1, lab1, r2l, l2r, table)
    ct3, lab3, plate_info = plates(fr, ct2, lab2, table, by_name, bone_disp)
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


def stage_all():
    os.makedirs(CACHE, exist_ok=True)
    stage_volume()
    run(PY, os.path.join(HERE, 'walls.py'))
    stage_labels()
    mirror_sweeps()
    run(PY, os.path.join(HERE, 'meshes.py'))
    run(PY, os.path.join(HERE, 'sdf.py'))
    run(PY, os.path.join(HERE, 'softtissue.py'))
    stage_sides()


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    {'all': stage_all, 'volume': stage_volume, 'labels': stage_labels, 'sides': stage_sides}[what]()
