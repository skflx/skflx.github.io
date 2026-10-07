"""Population asymmetry statistics from NasalSeg (docs/realistic-anatomy.md section 4.4; owner decision RA-O6; WP POP0).

    .venv/bin/python -I tools/ssb-pipeline/nasalseg/stats.py [--data DIR] [--png-dir DIR]

Input: the NasalSeg archive (Zenodo record 13893419, CC BY 4.0), extracted to
tools/ssb-pipeline/incoming/nasalseg/data/{images,labels}/ (gitignored; download NasalSeg.zip from
https://zenodo.org/records/13893419 and unzip it there). Output: ssb/anatomy/population/nasalseg.json, numbers
only (per-subject values and summaries); no image data leaves the drop zone.

Method.
  * Archive integrity (found 2026-10-07): the archive's 130 cases hold byte-identical duplicates (same image and
    label arrays under different ids); each duplicate group is measured once, under its lowest id, and listed. In
    some cases the label file's header disagrees with its image's (z direction flipped against the uncropped frame,
    or 1.0 mm instead of 1.5 mm slices) while the arrays are voxel-aligned; geometry is therefore taken from the
    image header, and the alignment is checked (the labelled voxels must be mostly air, HU < -400, as stored and
    clearly less so flipped). Each correction is listed.
  * Label map, from the labels' world positions (LPS: +x is patient left, +y posterior): 1 right maxillary sinus,
    2 left maxillary sinus, 3 right nasal cavity, 4 left nasal cavity, 5 nasopharynx. Within each pair the side is
    assigned by position (the more +x label is left); a case whose integers disagree with that is listed as
    swapped. Checked per case: the maxillary labels lateral to the cavity labels, the nasopharynx posterior; a case
    that fails is listed and left out. The nasopharynx is cut by the published crop in most cases, so it is not
    measured.
  * Volumes in mL from voxel counts times the voxel volume (|det| of the direction matrix). The labels are AIR
    (the dataset's authors segmented by an air threshold), so a sinus with thickened mucosa or fluid has a smaller
    label than its bony cavity.
  * Apparent lining thickness (mm), per maxillary sinus: soft-tissue voxels (-50..150 HU, unlabelled) reachable
    from the air label within ~4.7 mm in plane (8 in-plane geodesic steps per slice; bone stops it), divided by the
    air label's in-plane boundary area. A clear sinus reads about the mucosa plus partial volume; thickened mucosa,
    fluid or a cyst raise it. It cannot see a sinus that is almost entirely opacified (the air label is then a
    small pocket that may sit in fluid of other density), nor tell hypoplasia from opacification.
  * Label completeness, per maxillary sinus: `unlabelledAir` = unlabelled air voxels (< -400 HU) reachable from the
    label through air within 3 face-connected steps, over (those + the label). Every label misses some (the
    annotators' boundary sits about a voxel inside the air; the median is printed), so absolute volumes run low by
    about that fraction while left/right indices barely move. A label that stops at a flat cut where air
    continues scores high; sinuses above the Tukey upper fence (Q3 + 1.5 IQR, printed) are left out of `clear`.
  * Every case is also reviewed by eye (review.json beside this script: per maxillary sinus `clear`,
    `thickening` (mucosal thickening, cyst or polyp with air still filling most of the sinus), `opacified` (most
    of the sinus without air), or `unsure`, from a coronal and an axial slice through it; the reviewer and date
    are recorded there). The `clear` subset, from which the normal-asymmetry statistics are taken, is the cases
    whose two maxillary sinuses are both `clear`. The review is one look at two slices, not a read of the scan.
  * Extents (mm) of each maxillary air label along the world axes: transverse (x), anteroposterior (y),
    craniocaudal (z), each the 2nd..98th percentile span of the voxel coordinates.
  * Asymmetry index AI = 100 * (R - L) / ((R + L) / 2). Laterality rests on the file headers (the anatomy cannot
    verify left from right), so summaries lead with |AI|; the signed mean is a sanity check (expected near 0).
  * Head A (the UW specimen as scanned, before N1's mirroring) is measured the same way from its committed labels
    at normalize.py's AS_SCANNED_COMMIT, and placed as a percentile in the NasalSeg distribution. Its label
    boundaries are SSB's own (e.g. the cavity ends at the PNS plane), so compare indices, not volumes.

Deterministic: no randomness; JSON written with sorted keys.
"""
import argparse, gzip, hashlib, json, os, re, subprocess, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
DATA = os.path.join(HERE, '..', 'incoming', 'nasalseg', 'data')
OUT = os.path.join(REPO, 'ssb', 'anatomy', 'population', 'nasalseg.json')
AS_SCANNED_COMMIT = '37fa476240afb7568d652814e82801e7f1cb7c97'   # tools/ssb-pipeline/uw/normalize.py
LABELS = {1: ('maxillary', 'R'), 2: ('maxillary', 'L'), 3: ('cavity', 'R'), 4: ('cavity', 'L'), 5: ('nasopharynx', 'M')}
GRAPH = {'maxillary': 's.maxillary-sinus', 'cavity': 's.nasal-cavity', 'nasopharynx': 's.nasopharynx'}
SOFT = (-50, 150)
BONE = 200
STEPS = 8
REVIEW = os.path.join(HERE, 'review.json')
VERDICTS = ('clear', 'thickening', 'opacified', 'unsure')


def read_nrrd(path):
    blob = open(path, 'rb').read()
    cut = blob.index(b'\n\n')
    head = blob[:cut].decode('ascii')
    kv = dict(l.split(': ', 1) for l in head.splitlines()[1:] if ': ' in l and not l.startswith('#'))
    if kv.get('type') != 'int16' or kv.get('encoding') != 'gzip' or kv.get('space') != 'left-posterior-superior':
        raise ValueError(f'{path}: unexpected header {kv}')
    sizes = [int(s) for s in kv['sizes'].split()]
    dirs = np.array([[float(v) for v in t.strip('()').split(',')] for t in re.findall(r'\([^)]*\)', kv['space directions'])])
    origin = np.array([float(v) for v in kv['space origin'].strip('()').split(',')])
    arr = np.frombuffer(gzip.decompress(blob[cut + 2:]), dtype='<i2').reshape(sizes[::-1]).transpose(2, 1, 0)
    return arr, dirs, origin


def world(idx, dirs, origin):
    return origin + idx @ dirs


def lining_mm(img, lab, value, slice_axis, dx):
    """Soft-tissue voxels reachable in plane from the air label, per in-plane boundary area of the label (mm)."""
    air = lab == value
    domain = (lab == 0) & (img >= SOFT[0]) & (img <= SOFT[1])
    grown = air.copy()
    st = ndi.generate_binary_structure(3, 1)
    # in-plane only: zero the structuring element along the slice axis
    sl = [slice(None)] * 3
    for k in (0, 2):
        sl[slice_axis] = k
        st[tuple(sl)] = False
    for _ in range(STEPS):
        grown = ndi.binary_dilation(grown, st) & (domain | air)
    rim = int((grown & ~air).sum())
    faces = 0
    for ax in range(3):
        if ax == slice_axis:
            continue
        a = np.moveaxis(air, ax, 0)
        faces += int((a[1:] != a[:-1]).sum() + a[0].sum() + a[-1].sum())
    return round(rim * dx / faces, 3) if faces else None


def unlabelled_air(img, lab, value):
    m = lab == value
    free = (lab == 0) & (img < -400)
    st = ndi.generate_binary_structure(3, 1)
    g = m.copy()
    for _ in range(3):
        g = ndi.binary_dilation(g, st) & (free | m)
    miss = int((g & ~m).sum())
    return round(miss / (miss + int(m.sum())), 4)


def side_map(lab, dirs, origin):
    """Label value -> (part, side), sides assigned by world x within each pair; plus whether that swaps the integers."""
    cx = {}
    for v in LABELS:
        idx = np.argwhere(lab == v)
        if len(idx):
            cx[v] = float(world(idx.astype(float), dirs, origin)[:, 0].mean())
    mapping, swapped = dict(LABELS), []
    for a, b, part in ((1, 2, 'maxillary'), (3, 4, 'cavity')):
        if a in cx and b in cx and cx[a] > cx[b]:          # +x is patient left: label a should be the right one
            mapping[a], mapping[b] = (part, 'L'), (part, 'R')
            swapped.append(part)
    return mapping, swapped


def measure_case(img, lab, dirs, origin, mapping):
    vox_ml = abs(np.linalg.det(dirs)) / 1000.0
    slice_axis = int(np.argmax(np.linalg.norm(dirs, axis=1)))       # the 1.5 mm axis
    out, cent = {}, {}
    inv = {ps: v for v, ps in mapping.items()}
    for v, (part, side) in mapping.items():
        idx = np.argwhere(lab == v)
        if not len(idx):
            out[f'{part}.{side}'] = None
            continue
        w = world(idx.astype(float), dirs, origin)
        cent[v] = w.mean(0)
        rec = {'ml': round(len(idx) * vox_ml, 3)}
        if part == 'maxillary':
            lo, hi = np.percentile(w, 2, axis=0), np.percentile(w, 98, axis=0)
            rec['extentMm'] = {'transverse': round(float(hi[0] - lo[0]), 1), 'ap': round(float(hi[1] - lo[1]), 1),
                               'cc': round(float(hi[2] - lo[2]), 1)}
            inplane = [float(np.linalg.norm(dirs[k])) for k in range(3) if k != slice_axis]
            rec['liningMm'] = lining_mm(img, lab, v, slice_axis, float(np.mean(inplane)))
            rec['unlabelledAir'] = unlabelled_air(img, lab, v)
        if part == 'nasopharynx':
            rec['truncated'] = bool((idx.min(0) == 0).any() or (idx.max(0) == np.array(lab.shape) - 1).any())
        out[f'{part}.{side}'] = rec
    # laterality / identity check in world coordinates (LPS: +x left, +y posterior)
    mR, mL, cR, cL, nP = (inv[('maxillary', 'R')], inv[('maxillary', 'L')], inv[('cavity', 'R')], inv[('cavity', 'L')],
                          inv[('nasopharynx', 'M')])
    ok = all(k in cent for k in (mR, mL, cR, cL, nP))
    if ok:
        ok = (cent[mR][0] < cent[cR][0] < cent[cL][0] < cent[mL][0]) and cent[nP][1] > max(cent[cR][1], cent[cL][1])
    return out, ok


def ai(r, l):
    return None if not r or not l else 100.0 * (r - l) / ((r + l) / 2.0)


def pct(a, qs=(5, 25, 50, 75, 95)):
    a = np.asarray([x for x in a if x is not None], float)
    return {f'p{q}': round(float(np.percentile(a, q)), 2) for q in qs} | {'n': int(len(a))}


def spearman(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    rx, ry = x.argsort().argsort(), y.argsort().argsort()
    return round(float(np.corrcoef(rx, ry)[0, 1]), 3)


def summarize(rows):
    s = {}
    for part in ('maxillary', 'cavity'):
        R = [r[f'{part}.R']['ml'] for r in rows]
        L = [r[f'{part}.L']['ml'] for r in rows]
        a = [ai(x, y) for x, y in zip(R, L)]
        s[part] = {'mlR': pct(R), 'mlL': pct(L), 'absAI': pct([abs(v) for v in a]),
                   'signedAI': {'mean': round(float(np.mean(a)), 2), 'sd': round(float(np.std(a, ddof=1)), 2)}}
    s['maxillary']['extentMm'] = {ax: pct([r[f'maxillary.{sd}']['extentMm'][ax] for r in rows for sd in 'RL'])
                                 for ax in ('transverse', 'ap', 'cc')}
    am = [ai(r['maxillary.R']['ml'], r['maxillary.L']['ml']) for r in rows]
    ac = [ai(r['cavity.R']['ml'], r['cavity.L']['ml']) for r in rows]
    s['spearmanCavityVsMaxillaryAI'] = spearman(ac, am)
    return s


def head_a():
    def show(path):
        return subprocess.run(['git', 'show', f'{AS_SCANNED_COMMIT}:{path}'], cwd=REPO, check=True, capture_output=True).stdout
    table = json.loads(show('ssb/geometry/labels.json'))['labels']
    ct = json.loads(show('ssb/ct/ct.json'))
    lab = np.frombuffer(gzip.decompress(show('ssb/ct/labels.u16.gz')), dtype='<u2')
    vox_ml = float(np.prod(ct['spacing'])) / 1000.0
    counts = np.bincount(lab, minlength=max(int(k) for k in table) + 1)
    vol = {name: round(float(counts[int(k)]) * vox_ml, 3) for k, name in table.items()}
    out = {'maxillary.R': vol['s.maxillary-sinus.R'], 'maxillary.L': vol['s.maxillary-sinus.L'],
           'cavity.R': vol['s.nasal-cavity.R'], 'cavity.L': vol['s.nasal-cavity.L']}
    out['AI'] = {'maxillary': round(ai(out['maxillary.R'], out['maxillary.L']), 2),
                 'cavity': round(ai(out['cavity.R'], out['cavity.L']), 2)}
    return out


def percentile_of(value, dist):
    d = np.asarray(dist, float)
    return round(100.0 * float((d < value).mean() + 0.5 * (d == value).mean()), 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', default=DATA)
    ap.add_argument('--png-dir')
    args = ap.parse_args()
    cases = sorted(f[:4] for f in os.listdir(os.path.join(args.data, 'labels')) if f.endswith('_seg.nrrd'))
    rows, rejected, nonstd, header_fixed, swaps, seen, dups = [], [], [], [], [], {}, {}
    for c in cases:
        img, d1, o1 = read_nrrd(os.path.join(args.data, 'images', f'{c}_img.nrrd'))
        lab, d2, o2 = read_nrrd(os.path.join(args.data, 'labels', f'{c}_seg.nrrd'))
        key = hashlib.sha256(img.tobytes() + lab.tobytes()).hexdigest()
        if key in seen:
            dups.setdefault(seen[key], [seen[key]]).append(c)
            continue
        seen[key] = c
        if img.shape != lab.shape:
            rejected.append({'id': c, 'why': 'image and label arrays differ in shape'})
            continue
        if not np.allclose(d1, d2) or not np.allclose(o1, o2):
            m = lab > 0
            as_is, flipped = float((img[m] < -400).mean()), float((img[:, :, ::-1][m] < -400).mean())
            if not (as_is >= 0.8 and as_is - flipped >= 0.2):
                rejected.append({'id': c, 'why': f'label header differs and alignment unclear (air {as_is:.2f} as stored, {flipped:.2f} flipped)'})
                continue
            header_fixed.append({'id': c, 'airAsStored': round(as_is, 3), 'airFlipped': round(flipped, 3)})
        if not np.allclose(d1, np.diag(np.diag(d1))) or (np.diag(d1) <= 0).any():
            nonstd.append(c)
        mapping, swapped = side_map(lab, d1, o1)
        if swapped:
            swaps.append({'id': c, 'pairs': swapped})
        m, ok = measure_case(img, lab, d1, o1, mapping)
        if not ok or any(m[k] is None for k in ('maxillary.R', 'maxillary.L', 'cavity.R', 'cavity.L')):
            rejected.append({'id': c, 'why': 'label positions disagree with the label map, or a label is empty'})
            continue
        m['id'] = c
        rows.append(m)
        print(c, {k: (v['ml'] if isinstance(v, dict) else v) for k, v in m.items() if k != 'id'},
              'liningMm', m['maxillary.R']['liningMm'], m['maxillary.L']['liningMm'], file=sys.stderr)

    review = json.load(open(REVIEW)) if os.path.exists(REVIEW) else None
    if review:
        for r in rows:
            v = review['cases'].get(r['id'])
            if not v or v.get('R') not in VERDICTS or v.get('L') not in VERDICTS:
                raise SystemExit(f"review.json: no valid verdict for {r['id']}")
            r['review'] = {'R': v['R'], 'L': v['L']}
        ua = np.array([r[f'maxillary.{s}']['unlabelledAir'] for r in rows for s in 'RL'], float)
        q1, q3 = np.percentile(ua, [25, 75])
        ua_fence = round(float(q3 + 1.5 * (q3 - q1)), 4)
        for r in rows:
            r['labelDefect'] = sorted(s for s in 'RL' if r[f'maxillary.{s}']['unlabelledAir'] > ua_fence)
        clear = [r for r in rows if r['review'] == {'R': 'clear', 'L': 'clear'} and not r['labelDefect']]
    else:
        print('review.json missing: summaries use every case, unscreened', file=sys.stderr)
        clear = rows

    ha = head_a()
    all_am = [abs(ai(r['maxillary.R']['ml'], r['maxillary.L']['ml'])) for r in clear]
    all_ac = [abs(ai(r['cavity.R']['ml'], r['cavity.L']['ml'])) for r in clear]
    ha['percentileAbsAI_clear'] = {'maxillary': percentile_of(abs(ha['AI']['maxillary']), all_am),
                                   'cavity': percentile_of(abs(ha['AI']['cavity']), all_ac)}

    doc = {
        'version': 1,
        'source': {
            'name': 'NasalSeg', 'licence': 'CC BY 4.0',
            'cite': 'Zhang Y, Wang J, Pan T, Jiang Q, Ge J, Guo X, Jiang C, Lu J, Zhang J, Liu X, Tian M, Qi Y, Cheng Y, '
                    'Zuo C. NasalSeg Dataset for Nasal Cavity and Paranasal Sinuses Segmentation from CT Images '
                    '[dataset], v2. Zenodo; 2024 Oct 5. doi:10.5281/zenodo.13893419. Described in Sci Data (2024), '
                    'doi:10.1038/s41597-024-04176-1.',
            'doi': '10.5281/zenodo.13893419', 'paperDoi': '10.1038/s41597-024-04176-1',
            'url': 'https://zenodo.org/records/13893419',
            'population': '130 adults (74 male, 56 female; age 24-82, mean 54.6 +/- 12.1), CT of PET/CT on one '
                          'scanner (Siemens Biograph 64) at one Shanghai nuclear medicine centre; 0.586 x 0.586 mm '
                          'in plane, 1.5 mm slices; no sinus-disease exclusion stated (read 2026-10-07)',
            'labels': 'air spaces, threshold-based (per the dataset paper); the archive is cropped to the region',
        },
        'method': (__doc__.split('Method.')[1].split('Deterministic')[0]).strip(),
        'unlabelledAir': ({'median': round(float(np.median(ua)), 4), 'fence': ua_fence,
                           'sinusesAboveFence': int(sum(len(r['labelDefect']) for r in rows))} if review else None),
        'review': ({'by': review['by'], 'date': review['date'], 'method': review['method'],
                    'counts': {v: sum(1 for r in rows for s in 'RL' if r['review'][s] == v) for v in VERDICTS}}
                   if review else None),
        'liningMmBySinusReview': ({v: pct([r[f'maxillary.{s}']['liningMm'] for r in rows for s in 'RL'
                                           if r['review'][s] == v]) for v in VERDICTS
                                   if any(r['review'][s] == v for r in rows for s in 'RL')} if review else None),
        'labelMap': {str(k): f'{GRAPH[p]}.{s}' for k, (p, s) in LABELS.items()},
        'checks': {'cases': len(cases), 'unique': len(seen), 'measured': len(rows), 'rejected': rejected,
                   'duplicateGroups': sorted(dups.values()), 'labelHeaderCorrected': header_fixed,
                   'labelsSwappedBySide': swaps, 'nonStandardOrientation': nonstd,
                   'nasopharynxTruncated': sum(1 for r in rows if r['nasopharynx.M'] and r['nasopharynx.M']['truncated'])},
        'summary': {'all': summarize(rows), 'clear': summarize(clear),
                    'clearCount': len(clear), 'flaggedCount': len(rows) - len(clear)},
        'headA': ha,
        'subjects': [{k: v for k, v in r.items() if k != 'nasopharynx.M'} for r in rows],
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(doc, f, indent=1, sort_keys=True)
        f.write('\n')
    s = doc['summary']
    print(json.dumps({'checks': {k: (len(v) if isinstance(v, list) else v) for k, v in doc['checks'].items()},
                      'review': doc['review'], 'liningMm': doc['liningMmBySinusReview'], 'clear': len(clear),
                      'clear.maxillary': s['clear']['maxillary'], 'clear.cavity': s['clear']['cavity'],
                      'all.absAI.max': s['all']['maxillary']['absAI'], 'spearman': s['clear']['spearmanCavityVsMaxillaryAI'],
                      'headA': ha}, indent=1))

    if args.png_dir:
        render_review(args, rows)


def render_review(args, rows):
    """Review sheets: per case a coronal slice through the maxillary sinuses (mid-AP of both labels) and an axial
    slice at their mid-height, bone-ish window, air labels outlined (maxillary red, cavity cyan)."""
    from PIL import Image, ImageDraw
    os.makedirs(args.png_dir, exist_ok=True)

    def tile(sl, m_max, m_cav, sx, sy):
        g = np.clip((sl.astype(float) + 1000) / 2000 * 255, 0, 255)
        rgb = np.stack([g, g, g], -1)
        for m, col in ((m_cav, (60, 220, 255)), (m_max, (255, 60, 60))):
            rgb[m & ~ndi.binary_erosion(m)] = col
        return Image.fromarray(rgb.astype(np.uint8)).resize((int(sl.shape[1] * sx), int(sl.shape[0] * sy)))

    per = 20
    for sheet_no in range(0, len(rows), per):
        tiles = []
        for r in rows[sheet_no:sheet_no + per]:
            img, d, o = read_nrrd(os.path.join(args.data, 'images', f"{r['id']}_img.nrrd"))
            lab, _, _ = read_nrrd(os.path.join(args.data, 'labels', f"{r['id']}_seg.nrrd"))
            mx = (lab == 1) | (lab == 2)
            cav = (lab == 3) | (lab == 4)
            idx = np.argwhere(mx)
            y, z = int(np.median(idx[:, 1])), int(np.median(idx[:, 2]))
            fz = -1 if d[2, 2] > 0 else 1                     # superior up
            cor = tile(img[:, y, :].T[::fz], mx[:, y, :].T[::fz], cav[:, y, :].T[::fz], 1.6, 1.6 * 1.5 / 0.586)
            ax = tile(img[:, :, z].T, mx[:, :, z].T, cav[:, :, z].T, 1.6, 1.6)
            txt = f"{r['id']}  R {r['maxillary.R']['ml']:.1f} mL {r['maxillary.R']['liningMm']}  L {r['maxillary.L']['ml']:.1f} mL {r['maxillary.L']['liningMm']}"
            tiles.append((txt, cor, ax))
        W = max(c.width + a.width for _, c, a in tiles) + 6
        H = max(max(c.height, a.height) for _, c, a in tiles) + 14
        sheet = Image.new('RGB', (W * 4, H * ((len(tiles) + 3) // 4)))
        dr = ImageDraw.Draw(sheet)
        for i, (txt, c, a) in enumerate(tiles):
            x, y0 = (i % 4) * W, (i // 4) * H
            sheet.paste(c, (x, y0 + 14)); sheet.paste(a, (x + c.width + 2, y0 + 14))
            dr.text((x + 2, y0 + 1), txt, fill=(255, 255, 0))
        sheet.save(os.path.join(args.png_dir, f'nasalseg-review-{sheet_no // per + 1}.png'))


if __name__ == '__main__':
    main()
