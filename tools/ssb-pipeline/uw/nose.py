"""The external nose from the UNMASKED axial stack (E1b, ST6; ssb-roadmap.md).

    .venv/bin/python tools/ssb-pipeline/uw/nose.py [--write]     # E1b: the nostril fulcrum lm.naris
    .venv/bin/python tools/ssb-pipeline/uw/nose.py unmask         # ST6 step 1: the region to unmask

The face mask (specimen.py) zeroes soft tissue outside a dilated bone hull, so the committed volume has
no nose. Both commands resample the raw display volume in memory.

Lumen rule (E1b; used by every step here). A run of a row (constant A, constant S) is a vestibule lumen
when it is air (0 < display < 78) and has tissue (display >= 78) within 12 mm of both its medial and
lateral ends on the same row (columella and ala). Outside air reads exactly 0 (the source's no-data
value), so it is never a lumen.

lm.naris (default command): per side, on axial levels S 0..10, the alar-rim band is the 3 mm of S where
the lumen area is largest; lm.naris.<side> is the centroid of the lumen voxels in that band. Without
--write it only prints.

unmask (ST6 step 1): the region of the masked face that the standard specimen gets back. Per axial level S
from subnasale - 2 mm to the soft-tissue nasion, the voxels that the face mask zeroed (display 0 in the
as-scanned volume, non-zero in the unmasked resample) between that level's two alar-facial grooves; above
S 28 also |R| <= 12 (the medial canthi stay masked). The midline landmarks (pronasale, subnasale, nasion)
are read off the skin profile at R = 0. A groove is where the skin profile A(R) stops falling toward the
cheek: the minimum of A(R) + 0.25 R (5-point smoothed) within the corridor |R| 19..24 mm that the
checkpoint measured (the profile is monotone at most levels, so "the lowest point" alone has no
position). Writes incoming/_recon/nose-patch.npz on the ssb/ct grid.
"""
import json, os, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import load  # noqa: E402
import specimen as sp  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
GEO = os.path.join(REPO, 'ssb', 'geometry')
BOX = {'r': (-30.0, 30.0), 'a': (-30.0, 45.0), 's': (-20.0, 40.0)}
STEP = 0.5
AIR = sp.AIR                    # display < 78: air; >= 78: tissue
A_RANGE, S_RANGE = (-2.0, 16.0), (0.0, 10.0)
TISSUE_WITHIN_MM = 12.0
BAND_MM = 3.0


def lumen_runs(row, r, side=0):
    """The lumen runs [(lo, hi)] (inclusive indices) of one row (constant A and S): air (0 < display < 78)
    with tissue (>= 78) within 12 mm of both ends on the same row, on side +1 (right), -1 (left) or 0 (either)."""
    reach = int(TISSUE_WITHIN_MM / STEP)
    lab, n = ndi.label((row > 0) & (row < AIR))
    out = []
    for m in range(1, n + 1):
        idx = np.where(lab == m)[0]
        lo, hi = int(idx[0]), int(idx[-1])
        if side and side * r[(lo + hi) // 2] <= 0:
            continue
        ok = True
        for end, direction in ((hi, 1), (lo, -1)):
            rng = range(end + direction, end + direction * (reach + 1), direction)
            ok &= any(0 <= q < len(row) and row[q] >= AIR for q in rng)
        if ok:
            out.append((lo, hi))
    return out


def lumen_mask(D, side):
    """Boolean (k, j, i) mask of vestibule-lumen voxels for side (+1 right, -1 left)."""
    r, a, s = sp.grid_axes(BOX, STEP)
    out = np.zeros(D.shape, bool)
    for k in np.where((s >= S_RANGE[0]) & (s <= S_RANGE[1]))[0]:
        for j in np.where((a >= A_RANGE[0]) & (a <= A_RANGE[1]))[0]:
            for lo, hi in lumen_runs(D[k, j], r, side):
                out[k, j, lo:hi + 1] = True
    return out


def locate(D, side):
    r, a, s = sp.grid_axes(BOX, STEP)
    M = lumen_mask(D, side)
    # keep the largest 3D component (the vestibule), not stray row artefacts
    lab, n = ndi.label(M)
    if n == 0:
        return None
    sizes = ndi.sum(M, lab, range(1, n + 1))
    M = lab == (1 + int(np.argmax(sizes)))
    area = M.sum(axis=(1, 2)) * STEP * STEP
    w = int(round(BAND_MM / STEP))
    best, k0 = -1.0, 0
    for k in range(len(s) - w + 1):
        t = area[k:k + w].sum()
        if t > best:
            best, k0 = t, k
    B = np.zeros_like(M)
    B[k0:k0 + w] = M[k0:k0 + w]
    kk, jj, ii = np.nonzero(B)
    p = [float(r[ii].mean()), float(a[jj].mean()), float(s[kk].mean())]
    return {'p': [round(v, 2) for v in p], 'band_s': [float(s[k0]), float(s[k0 + w - 1])],
            'lumen_area_mm2': round(float(area[k0:k0 + w].mean()), 1),
            'n_voxels': int(B.sum())}


# ---------------------------------------------------------------- ST6 step 1: the region to unmask
PATCH_FILE = os.path.join(HERE, '..', 'incoming', '_recon', 'nose-patch.npz')     # gitignored (incoming/)
REGION_FILE = os.path.join(HERE, '..', 'incoming', '_recon', 'nose-region.npz')   # the standard specimen's region (normalize.py)
SUBNASALE_MARGIN_MM = 2.0       # the region starts this far below subnasale
CORRIDOR_MM = (19.0, 24.0)      # where the checkpoint measured the alar-facial grooves (|R|, S -6..26)
KNEE_SLOPE = 0.25               # mm of A per mm of R: a groove is where the skin profile flattens below this
CANTHUS_S, CANTHUS_R = 28.0, 12.0
FRAME_GAP_MM = 1.0              # a skin column this close to the source image's anterior border is flattened by it


def skin_profile(U, a, k, cols):
    """The most anterior tissue (display >= 78) A of axial level k, per column of cols; nan where none."""
    out = np.full(len(cols), np.nan)
    for n, i in enumerate(cols):
        idx = np.nonzero(U[k, :, i] >= AIR)[0]
        if len(idx):
            out[n] = a[idx.max()]
    return out


def midline_landmarks(U, r, a, s):
    """Pronasale, subnasale, soft-tissue nasion from the skin profile on the column R = 0; each is the lowest S of
    its extremum (the profile has plateaus: the tip is cut flat by the source image's border)."""
    col = [int(np.argmin(np.abs(r)))]
    prof = np.array([skin_profile(U, a, k, col)[0] for k in range(len(s))])

    def pick(lo, hi, fn):
        w = np.nonzero((s >= lo) & (s <= hi) & np.isfinite(prof))[0]
        return int(w[fn(prof[w])])
    kp = pick(-5.0, 20.0, np.argmax)                       # pronasale: the most anterior point
    ks = pick(-12.0, float(s[kp]) - 3.0, np.argmin)        # subnasale: the columella meets the lip
    kn = pick(30.0, 50.0, np.argmin)                       # nasion: the deepest point of the root
    pts = {name: [0.0, float(prof[k]), float(s[k])] for name, k in (('pronasale', kp), ('subnasale', ks), ('nasion', kn))}
    return pts, prof


def grooves(U, r, a, s, levels):
    """Per axial level, the alar-facial groove |R| on the right and the left (see the module docstring)."""
    out = np.zeros((len(levels), 2))
    for n, k in enumerate(levels):
        for m, side in enumerate((1, -1)):
            cols = np.nonzero((side * r >= 10.0) & (side * r <= 30.0))[0]
            cols = cols[np.argsort(side * r[cols])]
            y = skin_profile(U, a, k, cols)
            y = np.where(np.isfinite(y), y, np.nanmin(y) if np.isfinite(y).any() else 0.0)
            y = ndi.uniform_filter1d(y, 5, mode='nearest')
            x = side * r[cols]
            w = (x >= CORRIDOR_MM[0]) & (x <= CORRIDOR_MM[1])
            out[n, m] = x[w][int(np.argmin(y[w] + KNEE_SLOPE * x[w]))]
    return out


def frame_edge_a(r, s):
    """A (mm) of the source image's anterior border (pixel row -0.5) at each (S, R): the A beyond which the
    unmasked stack has no data. Shape (len(s), len(r))."""
    A, _, _ = sp.frame()
    c = np.linalg.inv(A)[1]
    return (-0.5 - c[0] * r[None, :] - c[2] * s[:, None] - c[3]) / c[1]


def unmask(hdr, ct0, U):
    """ST6 step 1 on the ssb/ct grid: returns (region bool (k, j, i), display uint8, report)."""
    r, a, s = (hdr['affine'][n][3] + np.arange(hdr['dims'][n]) * hdr['spacing'][0] for n in (0, 1, 2))
    lm, _ = midline_landmarks(U, r, a, s)
    s0, s1 = lm['subnasale'][2] - SUBNASALE_MARGIN_MM, lm['nasion'][2]
    levels = np.nonzero((s >= s0 - 1e-6) & (s <= s1 + 1e-6))[0]
    G = grooves(U, r, a, s, levels)
    disp = np.clip(np.round(U), 0, 255).astype(np.uint8)
    cand = (ct0 == 0) & (disp > 0)
    region = np.zeros(ct0.shape, bool)
    for n, k in enumerate(levels):
        lim = np.where(r >= 0, G[n, 0], G[n, 1])
        keep = np.abs(r) <= lim
        if s[k] > CANTHUS_S:
            keep &= np.abs(r) <= CANTHUS_R
        region[k] = cand[k] & keep[None, :]
    patch = np.where(region, disp, 0).astype(np.uint8)
    kk, jj, ii = np.nonzero(region)
    # the source image's anterior border: columns whose skin lies within FRAME_GAP_MM of it are flattened by it
    edge = frame_edge_a(r, s)
    touch = []
    for n, k in enumerate(levels):
        cols = np.nonzero(np.abs(r) <= (np.where(r >= 0, G[n, 0], G[n, 1])))[0]
        y = skin_profile(U, a, k, cols)
        flat = np.isfinite(y) & (edge[k, cols] - y < FRAME_GAP_MM)
        if flat.any():
            touch.append((float(s[k]), int(flat.sum())))
    rep = {'landmarks': lm, 'levels': [float(s[levels[0]]), float(s[levels[-1]])], 'n_levels': int(len(levels)),
           'grooves': {float(s[k]): [float(G[n, 0]), float(G[n, 1])] for n, k in enumerate(levels)},
           'voxels': int(region.sum()), 'a_mm': [float(a[jj.min()]), float(a[jj.max()])],
           'r_mm': [float(r[ii.min()]), float(r[ii.max()])], 's_mm': [float(s[kk.min()]), float(s[kk.max()])],
           'frame_touch': touch}
    return region, patch, rep


def say_unmask(rep):
    lm = rep['landmarks']
    print('ST6 1. nose unmask: midline skin profile (A, S): pronasale %s, subnasale %s, soft-tissue nasion %s  [checkpoint: (18.0, 4.5), (7.0, -6.5), (-5.5, 41.5), +-1.5]'
          % tuple('(%.1f, %.1f)' % (lm[n][1], lm[n][2]) for n in ('pronasale', 'subnasale', 'nasion')))
    print('   levels S %.1f..%.1f (subnasale - %g mm to nasion), %d levels; groove |R| (right/left) per level, mm:'
          % (rep['levels'][0], rep['levels'][1], SUBNASALE_MARGIN_MM, rep['n_levels']))
    items = ['%.1f: %.1f/%.1f' % (s, g[0], g[1]) for s, g in rep['grooves'].items()]
    for i in range(0, len(items), 6):
        print('     ' + '   '.join(items[i:i + 6]))
    gr = np.array(list(rep['grooves'].values()))
    print('   groove |R| over S -6..26: %.1f..%.1f  [checkpoint: ~19..24]' % tuple(
        (lambda m: (gr[m].min(), gr[m].max()))((np.array(list(rep['grooves'])) >= -6) & (np.array(list(rep['grooves'])) <= 26))))
    print('   region: %d voxels, A %.1f..%.1f, |R| <= %.1f, S %.1f..%.1f'
          % (rep['voxels'], rep['a_mm'][0], rep['a_mm'][1], max(abs(rep['r_mm'][0]), abs(rep['r_mm'][1])), rep['s_mm'][0], rep['s_mm'][1]))
    t = rep['frame_touch']
    print('   skin within %g mm of the source image\'s anterior border (flattened by it): %s'
          % (FRAME_GAP_MM, ('S %.1f..%.1f (%d levels, %d columns)' % (t[0][0], t[-1][0], len(t), sum(c for _, c in t))) if t else 'none'))


# ---------------------------------------------------------------- ST6 step 2: patch and centre
TAPER_MM = 3.0                  # the shift fades to 0 over this distance at the region's edge (inside it)
C_ESCALATE_MM = 2.0


def row_midline(row, r):
    """R (mm) of the nose's midline on one row of the patched display, or nan. Where a lumen lies on each
    side, the midpoint of the tissue run between the two lumens (caudal septum / columella); else the
    midpoint of the skin's two edges: the tissue run nearest R = 0, when air that is not a lumen (outside
    air, 0 < display < 78) flanks it on both sides."""
    lum = lumen_runs(row, r)
    right = [h for h in lum if r[(h[0] + h[1]) // 2] > 0]
    left = [h for h in lum if r[(h[0] + h[1]) // 2] < 0]
    if right and left:
        mr = min(h[0] for h in right)              # medial end of the right lumen
        ml = max(h[1] for h in left)               # medial end of the left lumen
        if mr - ml >= 2 and (row[ml + 1:mr] >= AIR).all():
            return float((r[ml + 1] + r[mr - 1]) / 2)
        return np.nan
    lab, n = ndi.label(row >= AIR)
    if n == 0:
        return np.nan
    near = lab[np.argmin(np.abs(r) + 1e6 * (lab == 0))]
    idx = np.nonzero(lab == near)[0]
    lo, hi = int(idx[0]), int(idx[-1])
    if lo == 0 or hi == len(row) - 1:
        return np.nan
    inside_lumen = np.zeros(len(row), bool)
    for a_, b_ in lum:
        inside_lumen[a_:b_ + 1] = True
    for q in (lo - 1, hi + 1):
        if not (0 < row[q] < AIR) or inside_lumen[q]:
            return np.nan
    return float((r[lo] + r[hi]) / 2)


def centre_offsets(D, region, r):
    """c (mm) per (S, A) row of the region's footprint: nan outside it. Raw, filled from the nearest valid row,
    3x3 median, then tapered to 0 over TAPER_MM at the footprint's edge. Returns (c_taper, report)."""
    foot = region.any(axis=2)
    raw = np.full(foot.shape, np.nan)
    for k, j in zip(*np.nonzero(foot)):
        raw[k, j] = row_midline(D[k, j], r)
    valid = np.isfinite(raw)
    idx = ndi.distance_transform_edt(~valid, return_distances=False, return_indices=True)
    fill = np.where(foot, raw[idx[0], idx[1]], np.nan)
    pad = np.pad(fill, 1, constant_values=np.nan)
    win = np.stack([pad[1 + di:1 + di + fill.shape[0], 1 + dj:1 + dj + fill.shape[1]] for di in (-1, 0, 1) for dj in (-1, 0, 1)])
    with np.errstate(all='ignore'):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            med = np.nanmedian(win, axis=0)
    med = np.where(foot, med, np.nan)
    d_in = ndi.distance_transform_edt(np.pad(foot, 1), sampling=STEP)[1:-1, 1:-1]
    c = np.where(foot, med * np.clip(d_in / TAPER_MM, 0, 1), np.nan)
    absc = np.abs(med[valid & foot])
    rep = {'rows': int(foot.sum()), 'rows_measured': int(valid.sum()),
           'median_abs_mm': round(float(np.median(absc)), 2), 'max_abs_mm': round(float(np.abs(med[foot]).max()), 2),
           'max_abs_measured_mm': round(float(absc.max()), 2)}
    return c, rep


def patch_and_centre(ct0, region, patch, r):
    """ST6 step 2 on the ssb/ct grid: the display inside the region takes the unmasked value, then each (S, A) row of
    the region is shifted by -c along R so the nose's midline lies on R = 0. Only region voxels move, and only
    to region voxels: the as-scanned head (bone, hull, labels) is untouched. Returns (display, report)."""
    D = np.where(region, patch, ct0).astype(np.uint8)
    c, rep = centre_offsets(D, region, r)
    shift = np.where(np.isfinite(c), np.round(c / STEP), 0).astype(int)
    out = D.copy()
    n = len(r)
    ii = np.arange(n)
    moved = 0
    for k, j in zip(*np.nonzero(shift)):
        src = ii + shift[k, j]
        ok = (src >= 0) & (src < n)
        ok[ok] &= region[k, j, src[ok]]
        take = region[k, j] & ok
        out[k, j, take] = D[k, j, src[take]]
        moved += int(take.sum())
    rep['voxels_moved'] = moved
    rep['rows_shifted'] = int((shift != 0).sum())
    res, _ = centre_offsets(out, region, r)
    rep['residual_median_abs_mm'] = round(float(np.nanmedian(np.abs(res))), 2)
    return out, rep


def say_centre(rep):
    print('ST6 2. nose patch and centre: |c| median %.2f mm, max %.2f mm (%.2f over the rows measured directly) over %d rows of the region (%d measured: '
          'lumen pair or skin edges; the rest filled from the nearest, 3x3 median, tapered to 0 over %g mm at the edge); %d rows shifted, %d voxels moved; '
          'residual median |c| after the shift %.2f mm'
          % (rep['median_abs_mm'], rep['max_abs_mm'], rep['max_abs_measured_mm'], rep['rows'], rep['rows_measured'], TAPER_MM, rep['rows_shifted'],
             rep['voxels_moved'], rep['residual_median_abs_mm']))
    if rep['max_abs_mm'] > C_ESCALATE_MM:
        raise SystemExit('ESCALATE: the nose centring offset reaches %.2f mm (> %g mm)' % (rep['max_abs_mm'], C_ESCALATE_MM))


# ---------------------------------------------------------------- ST6 steps 3-4: the internal valve and the vestibule
VALVE_WINDOW_MM = (-25.0, -10.0)    # A, relative to lm.naris
VALVE_SMOOTH_MM = 3.0
NARIS_SEED_MM = 3.0                 # the naris point must lie this close to an air voxel of the airway
VESTIBULE = 's.nasal-vestibule'
CAVITY = 's.nasal-cavity'
VEST_LIMITS = {'abs_r_mm': 20.0, 'max_a_mm': 18.5}      # the vestibule stays inside the nose (the escalation leak check)


def nearest_true(mask, p_kji, radius_vox):
    """The index (k, j, i) of the True voxel of mask nearest to p_kji within radius_vox, or None."""
    c = np.round(p_kji).astype(int)
    lo = np.maximum(c - radius_vox, 0)
    hi = np.minimum(c + radius_vox + 1, mask.shape)
    sub = mask[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]]
    if not sub.any():
        return None
    kk, jj, ii = np.nonzero(sub)
    d = (kk + lo[0] - p_kji[0]) ** 2 + (jj + lo[1] - p_kji[1]) ** 2 + (ii + lo[2] - p_kji[2]) ** 2
    n = int(np.argmin(d))
    return (kk[n] + lo[0], jj[n] + lo[1], ii[n] + lo[2])


def valve_and_vestibule(ct, lab, by_name, r, a, s, naris, s_lo):
    """ST6 steps 3-4 on the standard volume, computed on the right side (R > 0) and mirrored by the caller.
    naris: lm.naris.R (R, A, S); s_lo: the alar-rim band's lower S.
    Returns a dict: valve {a, area_mm2, centroid, profile}, masks vest (bool: becomes s.nasal-vestibule.R)
    and join (bool: unlabelled air that joins s.nasal-cavity.R), and the report."""
    kji = lambda p: np.array([(p[2] - s[0]) / STEP, (p[1] - a[0]) / STEP, (p[0] - r[0]) / STEP])
    Rg = (r > 0)[None, None, :]
    Aj = a[None, :, None]
    cav = lab == by_name[CAVITY + '.R']
    airv = (ct > 0) & (ct < AIR)
    # step 3: the airway component connected to lm.naris (the right nasal cavity's own air and the unlabelled air of the
    # vestibule: the sinuses are other labels, so the ostia do not let the component run into them)
    airway = airv & Rg & ((lab == 0) | cav)
    seed = nearest_true(airway, kji(naris), int(NARIS_SEED_MM / STEP))
    if seed is None:
        raise SystemExit('ESCALATE: lm.naris.R is not within %g mm of the right airway' % NARIS_SEED_MM)
    ccl, _ = ndi.label(airway)
    comp = ccl == ccl[seed]
    area = comp.sum(axis=(0, 2)) * STEP * STEP
    sm = ndi.uniform_filter1d(area.astype(float), size=int(round(VALVE_SMOOTH_MM / STEP)), mode='nearest')
    j0 = int(np.argmin(np.abs(a - (naris[1] + VALVE_WINDOW_MM[0]))))
    j1 = int(np.argmin(np.abs(a - (naris[1] + VALVE_WINDOW_MM[1]))))
    jv = j0 + int(np.argmin(sm[j0:j1 + 1]))
    if jv in (j0, j1):
        raise SystemExit('ESCALATE: the valve minimum lies at an end of its window (A %.1f; window %.1f..%.1f)' % (a[jv], a[j0], a[j1]))
    sec = comp[:, jv, :]
    kk, ii = np.nonzero(sec)
    cen = [float(r[ii].mean()), float(a[jv]), float(s[kk].mean())]
    valve = {'a': float(a[jv]), 'area_mm2': float(area[jv]), 'smoothed_area_mm2': float(sm[jv]), 'centroid': [round(v, 2) for v in cen],
             'window_a': [float(a[j0]), float(a[j1])], 'profile': [(float(a[j]), float(area[j]), float(sm[j])) for j in range(j0, j1 + 1)]}
    # step 4: the vestibule. Air anterior to the valve plane, connected to lm.naris, enclosed (the lumen rule), from the
    # alar-rim band's lower S up; the cavity's own air in front of the plane. The airway component's unlabelled air
    # behind the plane (the lower anterior airway that fell outside the specimen's bone hull) joins the cavity.
    ant = Aj > a[jv] + STEP / 2
    cand = np.zeros(ct.shape, bool)
    for k in np.nonzero(s >= s_lo - 1e-6)[0]:
        for j in np.nonzero(a > a[jv] + STEP / 2)[0]:
            for lo, hi in lumen_runs(ct[k, j], r, +1):
                cand[k, j, lo:hi + 1] = True
    cand &= airv & ((lab == 0) | cav)
    lc, _ = ndi.label(cand)
    seed2 = nearest_true(cand, kji(naris), int(NARIS_SEED_MM / STEP))
    if seed2 is None:
        raise SystemExit('ESCALATE: no enclosed vestibule lumen within %g mm of lm.naris.R' % NARIS_SEED_MM)
    vest = (lc == lc[seed2]) | (cav & ant)
    join = comp & (lab == 0) & ~ant        # the airway component's unlabelled air behind the plane: it touches the cavity
    kk, jj, ii = np.nonzero(vest)
    ext = {'abs_r_mm': float(np.abs(r[ii]).max()), 'max_a_mm': float(a[jj].max()), 'min_a_mm': float(a[jj].min()),
           's_mm': [float(s[kk].min()), float(s[kk].max())]}
    leak = ext['abs_r_mm'] > VEST_LIMITS['abs_r_mm'] or ext['max_a_mm'] > VEST_LIMITS['max_a_mm']
    nc = ndi.label(vest)[1]
    rep = {'valve': valve, 'vestibule_voxels': int(vest.sum()), 'vestibule_mm3': round(float(vest.sum()) * STEP ** 3, 1),
           'from_cavity_voxels': int((cav & ant).sum()), 'from_unlabelled_voxels': int((vest & ~cav).sum()),
           'join_voxels': int(join.sum()), 'components': int(nc), 'extent': ext, 'leak': bool(leak), 's_lo': float(s_lo)}
    return {'valve': valve, 'vest': vest, 'join': join, 'report': rep}


def say_vestibule(rep):
    v = rep['valve']
    print('ST6 3. internal valve (right, mirrored): the coronal plane of smallest area (3 mm moving mean) of the airway component connected to lm.naris, '
          'A %.1f..%.1f: A = %.1f mm, section %.1f mm2 (smoothed %.1f), centroid (R, A, S) = %s' % (v['window_a'][0], v['window_a'][1], v['a'], v['area_mm2'], v['smoothed_area_mm2'], v['centroid']))
    e = rep['extent']
    print('ST6 4. vestibule (right, mirrored): %d voxels (%.0f mm3; %d from the cavity label in front of the valve plane, %d from unlabelled air), %d component(s); '
          'A %.1f..%.1f, |R| <= %.1f, S %.1f..%.1f; unlabelled airway air behind the plane that joins the cavity: %d voxels'
          % (rep['vestibule_voxels'], rep['vestibule_mm3'], rep['from_cavity_voxels'], rep['from_unlabelled_voxels'], rep['components'],
             e['min_a_mm'], e['max_a_mm'], e['abs_r_mm'], e['s_mm'][0], e['s_mm'][1], rep['join_voxels']))
    if rep['leak'] or rep['components'] != 1:
        raise SystemExit('ESCALATE: the vestibule rule leaks into the outside air or splits (components %d, extent %s)' % (rep['components'], e))


def unmask_stage(hdr, ct):
    """Steps 1 and 2 for normalize.py: returns (ct patched and centred, region mask, reports)."""
    r = hdr['affine'][0][3] + np.arange(hdr['dims'][0]) * hdr['spacing'][0]
    a = hdr['affine'][1][3] + np.arange(hdr['dims'][1]) * hdr['spacing'][0]
    s = hdr['affine'][2][3] + np.arange(hdr['dims'][2]) * hdr['spacing'][0]
    V = load('axial')
    A, dz, _ = sp.frame()
    U = sp.resample(V.astype(np.float32), A, dz, box={'r': (r[0], r[-1]), 'a': (a[0], a[-1]), 's': (s[0], s[-1])}, step=STEP)
    region, patch, rep = unmask(hdr, ct, U)
    say_unmask(rep)
    os.makedirs(os.path.dirname(PATCH_FILE), exist_ok=True)
    np.savez_compressed(PATCH_FILE, region=region.astype(np.uint8), display=patch)
    out, crep = patch_and_centre(ct, region, patch, r)
    say_centre(crep)
    return out, region, {'unmask': rep, 'centre': crep}


# ---------------------------------------------------------------- ST6 step 5: the nose pack (the external skin)
SKIN = 's.external-nose.M'
SKIN_BUDGET = 8000
SKIN_BYTES = 400_000
AIR_FACE_MM = 0.75      # how far along a triangle's outward normal to look for the air voxel it faces


def cmd_pack():
    """Marching cubes on the standard volume's tissue (display >= 78) against outside air, inside the standard region
    only: a triangle is kept when its centre lies within one voxel of the region and the air voxel it faces is
    unlabelled air (the vestibule and the cavity are other nodes) that has a value, so the face mask's cut faces and the source
    image's border are no surface (their other side reads 0). Largest
    connected piece, decimated to SKIN_BUDGET. Writes ssb/models/nose.glb.gz and lists it in packs.json as "nose"."""
    import meshes as M
    from scipy import sparse
    import fast_simplification
    from volume import write_results
    hdr, ct, lab, table = M.read_volume()
    aff = np.array(hdr['affine'], float)
    reg = np.load(REGION_FILE)['region'].astype(bool)
    kk, jj, ii = np.nonzero(reg)
    lo = np.maximum([kk.min(), jj.min(), ii.min()] - np.array(8), 0)
    hi = np.minimum([kk.max(), jj.max(), ii.max()] + np.array(9), ct.shape)
    sl = tuple(slice(int(a_), int(b_)) for a_, b_ in zip(lo, hi))
    c = ct[sl]
    solid = c >= AIR                                   # tissue; the no-data (display 0) counts as air, so the source image's border is no surface
    caff = aff.copy()
    caff[:3, 3] = aff[:3, :3] @ np.array([lo[2], lo[1], lo[0]], float) + aff[:3, 3]
    v, f = M.surface(solid, caff)
    v = M.taubin(v, f)
    nrm = M.normals(v, f)
    tri = v[f]
    cen = tri.mean(1)
    tn = nrm[f].mean(1)
    tn /= np.maximum(np.linalg.norm(tn, axis=1, keepdims=True), 1e-12)
    inv = np.linalg.inv(aff[:3, :3])

    def at(p, vol):
        ijk = (p - aff[:3, 3]) @ inv.T
        q = np.clip(np.rint(ijk[:, ::-1]).astype(int), 0, np.array(vol.shape) - 1)
        return vol[q[:, 0], q[:, 1], q[:, 2]]
    near = ndi.binary_dilation(reg, structure=np.ones((3, 3, 3), bool))
    in_region = at(cen, near)
    face = cen + tn * AIR_FACE_MM
    faces_air = (at(face, lab) == 0) & (at(face, ct) > 0) & (at(face, ct) < AIR)
    keep = in_region & faces_air
    f = f[keep]
    comp = np.zeros(len(f), int)
    used, inverse = np.unique(f.ravel(), return_inverse=True)
    g = inverse.reshape(-1, 3)
    e = np.concatenate([g[:, [0, 1]], g[:, [1, 2]]])
    adj = sparse.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(len(used), len(used)))
    _, cc = sparse.csgraph.connected_components(adj, directed=False)
    comp = cc[g[:, 0]]
    sizes = np.bincount(comp)
    big = int(np.argmax(sizes))
    f = f[comp == big]
    used, inverse = np.unique(f.ravel(), return_inverse=True)
    v, f = v[used], inverse.reshape(-1, 3)
    n_full = len(f)
    if len(f) > SKIN_BUDGET:
        v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), 1 - SKIN_BUDGET / len(f))
        v, f = np.asarray(v, np.float64), np.asarray(f, np.int64)
    n = M.normals(v, f)
    raw, gz = M.write_glb(os.path.join(REPO, 'ssb/models/nose.glb.gz'), [(SKIN, v, f, n)])
    area = float(np.linalg.norm(np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]]), axis=1).sum() / 2) / 100
    lo_, hi_ = v.min(0), v.max(0)
    print('ST6 5. nose pack: %s, %d triangles (%d before decimation; %d pieces dropped), %d bytes, %.1f cm2; RAS box R %.1f..%.1f A %.1f..%.1f S %.1f..%.1f'
          % (SKIN, len(f), n_full, int(len(sizes)) - 1, gz, area, lo_[0], hi_[0], lo_[1], hi_[1], lo_[2], hi_[2]))
    assert len(f) <= SKIN_BUDGET + 50 and gz <= SKIN_BYTES, 'the nose pack breaks its budget'
    pj = os.path.join(REPO, 'ssb/models/packs.json')
    man = json.load(open(pj))
    man['packs']['nose'] = {'file': 'nose.glb.gz', 'bytes': gz, 'bytes_uncompressed': raw, 'triangles': int(len(f)),
                            'nodes': {SKIN: {'triangles': int(len(f)), 'vertices': int(len(v))}}}
    man.setdefault('notes', {})['nose'] = ('the external nose (tools/ssb-pipeline/uw/nose.py, ST6): the skin of the specimen\'s own nose, unmasked from the '
                                           'UW axial stack between the alar-facial grooves, one open surface (s.external-nose.M, extras.kind "skin"); '
                                           'the vestibule is s.nasal-vestibule in the core pack, also drawn as skin')
    man['totals'] = {'bytes': int(sum(p['bytes'] for p in man['packs'].values())),
                     'triangles': int(sum(p['triangles'] for p in man['packs'].values()))}
    json.dump(man, open(pj, 'w'), indent=1)
    write_results('nose', {'triangles': int(len(f)), 'bytes': gz, 'area_cm2': round(area, 1)})
    print('   all packs %s' % json.dumps(man['totals']))


def cmd_unmask():
    """`nose.py unmask`: step 1 alone, for inspection (normalize.py runs it as part of `all`)."""
    import normalize
    hdr, ct, lab, table = normalize.read_as_scanned()
    r, a, s = (hdr['affine'][n][3] + np.arange(hdr['dims'][n]) * hdr['spacing'][0] for n in (0, 1, 2))
    V = load('axial')
    A, dz, _ = sp.frame()
    U = sp.resample(V.astype(np.float32), A, dz, box={'r': (r[0], r[-1]), 'a': (a[0], a[-1]), 's': (s[0], s[-1])}, step=STEP)
    region, patch, rep = unmask(hdr, ct, U)
    say_unmask(rep)
    os.makedirs(os.path.dirname(PATCH_FILE), exist_ok=True)
    np.savez_compressed(PATCH_FILE, region=region.astype(np.uint8), display=patch)
    print('   wrote', os.path.relpath(PATCH_FILE, REPO))


def main():
    V = load('axial')
    A, dz, _ = sp.frame()
    D = sp.resample(V, A, dz, box=BOX, step=STEP)
    found = {}
    for side, tag in ((1, 'R'), (-1, 'L')):
        f = locate(D, side)
        if f is None:
            sys.exit('no enclosed lumen on side ' + tag)
        r, a, s = f['p']
        k, j, i = (int(round(v)) for v in sp.ras_to_index(f['p'], BOX, STEP))
        f['in_air'] = bool(0 < D[k, j, i] < AIR)
        found[tag] = f
        print(tag, f)
    if '--write' not in sys.argv:
        return
    lm = json.load(open(os.path.join(GEO, 'landmarks.json')))
    meta = json.load(open(os.path.join(GEO, 'landmarks.meta.json')))
    for tag, f in found.items():
        key = 'lm.naris.' + tag
        old = meta['landmarks'].get(key, {})
        entry = {'method': ('vestibule lumen of the unmasked axial stack: air (0 < display < 78) on this side of the '
                            'midline with tissue (>= 78) within 12 mm medially and laterally on the same row, A -2..16, '
                            'S 0..10; centroid of the lumen voxels in the 3 mm S band of largest lumen area '
                            '(tools/ssb-pipeline/uw/nose.py, E1b)'),
                 'band_s_mm': f['band_s'], 'lumen_area_mm2': f['lumen_area_mm2'], 'n_voxels': f['n_voxels'],
                 'superseded': {'value': lm[key], 'meta': old,
                                'reason': 'E1: internal-valve level; left point inside the caudal septum - verification 2026-10-03'}}
        lm[key] = f['p']
        meta['landmarks'][key] = entry
    json.dump(lm, open(os.path.join(GEO, 'landmarks.json'), 'w'), indent=1)
    json.dump(meta, open(os.path.join(GEO, 'landmarks.meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'pack':
        cmd_pack()
    elif len(sys.argv) > 1 and sys.argv[1] == 'unmask':
        cmd_unmask()
    else:
        main()
