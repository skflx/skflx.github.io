"""Held-out arrow-tip split and label scorer (docs/realistic-anatomy.md section 7.1; work package RS0).

    python3 tools/ssb-pipeline/uw/score.py split            # write ssb/reference/uw-sinusanatomy2/split.json (once)
    python3 tools/ssb-pipeline/uw/score.py                  # score today's labels: the as-scanned head AND the served one
    python3 tools/ssb-pipeline/uw/score.py --labels DIR     # any labels: DIR holds ct.json, labels.u16.gz, labels.json
    python3 tools/ssb-pipeline/uw/score.py --labels as-scanned|served [--set heldout|seed|all] [--tol 1] [--json OUT]

Needs numpy and scipy only (no fetched images): the tips are read from split.json, which `split` builds from
slices.json + crosswalk.json + vocab-extra.json and the axial/sagittal tip positions in registration.json.

Ground truth. The UW teaching pages' arrow tips on the head-A stacks (axial, sagittal; the coronal stack is another
head and is not mapped, labels3d.py). Each tip whose term the crosswalk maps to graph ids (exact or synonym) is a
scorable tip; its structure is the set of ids. The split is stratified by structure, then by region (plane x tercile
of S), fixed seed, 70 % seed / 30 % held-out; every structure keeps at least one seed tip. Segmentation may read
seed tips only; the score reads held-out tips only (`--set seed` / `all` are for diagnostics).

Identity metric. A tip hits when a voxel within +-`tol` voxels (default 1, Chebyshev) carries a label whose graph id is
one of the tip's ids. Side is not tested: laterality of the as-scanned head is an assumption (labels3d.py). Tips
outside the label volume's box are not scored (reported). Wilson 95 % CIs throughout.

Which labels. The tips live in the as-scanned frame, so `as-scanned` (the labels at normalize.py's AS_SCANNED_COMMIT,
read with `git show`) is the headline. The served labels are the standard head (right half mirrored, septum centred);
there only tips with R > 0 are scored, because the left half is a mirror of the right and a left tip has no
counterpart in it.

Caveats the numbers carry (read before comparing):
  * Today's labels were grown FROM these tips (specimen.py seeds, walls.py orbit seeds), held-out ones included, so the
    baseline is a resubstitution score, optimistic by construction. The `seeded` column marks terms specimen.py or
    walls.py used. A resegmentation that never saw the held-out tips is scored on honest ground and may rank lower.
  * Tips are single points inside extended structures and carry registration error (sagittal through a fitted model);
    +-1 voxel is 0.5 mm. Compare `--tol 1` with `--tol 6` to see how much of a miss is placement noise.
  * Tips on adjacent slices of one structure are spatially correlated, so held-out tips are not independent of seed
    tips; the CIs treat tips as independent and are therefore too narrow. Small n is flagged, never smoothed over.

Topology (section 7.1), on the same labels: air labels single-component; sinus / cell reaches the nasal cavity of its
side through air; air labels in face contact with the orbit label; bone-unit thickness distribution. Two checks are
reported as NOT EVALUABLE where the data to define them does not exist yet (see the output).
"""
import argparse, ast, gzip, hashlib, json, math, os, subprocess, sys
from collections import defaultdict
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
REF = os.path.join(REPO, 'ssb/reference/uw-sinusanatomy2')
SPLIT = os.path.join(REF, 'split.json')
AS_SCANNED_COMMIT = '37fa476240afb7568d652814e82801e7f1cb7c97'     # normalize.py's input (master just before N1)
SEED, FRACTION = 20261009, 0.30
# terms that grew today's labels (specimen.py SEED_TERMS; walls.py: orbit, pterygopalatine fossa, retroantral fat pad)
SEEDED_TERMS = {'maxillary sinus', 'frontal sinus', 'sphenoid sinus', 'frontal recess', 'frontal sinus drainage pathway',
                'agger nasi cell', 'ethmoid bulla', 'anterior ethmoid', 'anterior ethmoid sinus', 'posterior ethmoid',
                'posterior ethmoid air cells', 'ethmoid sinus', 'nasopharynx', 'inferior turbinate', 'middle turbinate',
                'nasal septum', 'middle meatus', 'hiatus semilunaris', 'orbit', 'pterygopalatine fossa',
                'pterygomaxillary fissure', 'retroantral fat pad'}
AIR_IDS = ('s.agger-nasi-cell', 's.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess', 's.frontal-sinus',
           's.maxillary-sinus', 's.nasal-cavity', 's.nasal-vestibule', 's.nasopharynx', 's.posterior-ethmoid-cells',
           's.sphenoid-sinus')
CAVITY = 's.nasal-cavity'
ORBIT = 's.orbit'
NOT_BONE = AIR_IDS + (ORBIT,)       # label ids that are not bone units; units = every other id (walls.py names them)


def sha8(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()[:8]


def wilson(k, n, z=1.959964):
    if n == 0:
        return (float('nan'), float('nan'))
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


# ---------------------------------------------------------------- tips and the split
def canon_and_ids():
    """relate.py's canon() and term_ids, without running its analysis (its module body writes files)."""
    path = os.path.join(HERE, 'relate.py')
    tree = ast.parse(open(path).read())
    body = []
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', None) == 'votes' for t in node.targets):
            break
        body.append(node)
    ns = {'__file__': path}
    exec(compile(ast.Module(body=body, type_ignores=[]), path, 'exec'), ns)
    return ns['canon'], ns['term_ids']


def build_split(seed=SEED, fraction=FRACTION):
    canon, term_ids = canon_and_ids()
    slices = json.load(open(os.path.join(REF, 'slices.json')))
    reg = json.load(open(os.path.join(HERE, 'registration.json')))['labels']['points_ras_mm']
    nxt = defaultdict(int)
    tips, unmapped, no_ids = [], defaultdict(int), defaultdict(int)
    for plane in ('axial', 'sagittal'):          # coronal: a different head (labels3d.py)
        for row in slices[plane]:
            for li, lab in enumerate(row['labels']):
                term = canon(lab['text'], lab['conf'])
                if not term:
                    continue
                for ti, _ in enumerate(lab['tips']):
                    k = (term, plane)
                    pts = reg.get(term, {}).get(plane, [])
                    if nxt[k] >= len(pts):
                        raise SystemExit('registration.json has fewer %s %s tips than slices.json: rerun labels3d.py' % (term, plane))
                    ras = pts[nxt[k]]; nxt[k] += 1
                    ids = term_ids.get(term)
                    if not ids:
                        no_ids[term] += 1
                        continue
                    tips.append({'term': term, 'ids': sorted(ids), 'plane': plane, 'n': row['n'], 'label': li, 'tip': ti,
                                 'ras': [round(float(x), 2) for x in ras]})
    for term, by in reg.items():
        for plane, pts in by.items():
            if nxt[(term, plane)] != len(pts):
                raise SystemExit('registration.json holds %d %s %s tips, slices.json yields %d: rerun labels3d.py'
                                 % (len(pts), term, plane, nxt[(term, plane)]))
    S = np.array([t['ras'][2] for t in tips])
    lo, hi = np.percentile(S, [100 / 3, 200 / 3])
    for t in tips:
        band = 'I' if t['ras'][2] < lo else ('M' if t['ras'][2] < hi else 'S')
        t['region'] = t['plane'][0] + band
        t['structure'] = '+'.join(t['ids'])
    rng = np.random.default_rng(seed)
    by_struct = defaultdict(list)
    for t in tips:
        by_struct[t['structure']].append(t)
    for key in sorted(by_struct):
        grp = by_struct[key]
        grp.sort(key=lambda t: (t['plane'], t['n'], t['label'], t['tip']))        # canonical order, then seeded shuffle
        order = rng.permutation(len(grp))
        grp[:] = [grp[i] for i in order]
        grp.sort(key=lambda t: t['region'])          # stable: regions contiguous, random within
        n = len(grp)
        k = min(max(int(round(fraction * n)), 0), n - 1)
        u = rng.random()
        held = {int(math.floor((j + u) * n / k)) for j in range(k)} if k else set()
        for i, t in enumerate(grp):
            t['set'] = 'heldout' if i in held else 'seed'
    tips.sort(key=lambda t: (t['plane'], t['n'], t['label'], t['tip']))
    return {
        'version': 1, 'seed': seed, 'fraction': fraction,
        'method': 'tips of the axial and sagittal stacks (head A) whose canonical term the crosswalk maps to graph ids; '
                  'stratified by structure (id set) then region (plane x tercile of S); per structure round(fraction*n) '
                  'held out (at least one seed kept), chosen by systematic sampling over the region-ordered, seeded-shuffled tips',
        'regionBandsS_mm': [round(float(lo), 2), round(float(hi), 2)],
        'inputs': {'slices.json': sha8(os.path.join(REF, 'slices.json')), 'crosswalk.json': sha8(os.path.join(REF, 'crosswalk.json')),
                   'vocab-extra.json': sha8(os.path.join(HERE, 'vocab-extra.json')), 'frame': 'as-scanned RAS mm (registration.json labels.points_ras_mm)'},
        'unscorable': {'no graph id': dict(sorted(no_ids.items()))},
        'counts': {'scorable': len(tips), 'heldout': sum(t['set'] == 'heldout' for t in tips)},
        'tips': tips,
    }


# ---------------------------------------------------------------- labels
def read_git(path):
    return subprocess.run(['git', 'show', '%s:%s' % (AS_SCANNED_COMMIT, path)], cwd=REPO, check=True, capture_output=True).stdout


def load_labels(which):
    if which == 'as-scanned':
        hdr = json.loads(read_git('ssb/ct/ct.json')); raw = gzip.decompress(read_git('ssb/ct/labels.u16.gz'))
        table = json.loads(read_git('ssb/geometry/labels.json'))['labels']
    else:
        d = os.path.join(REPO, 'ssb/ct') if which == 'served' else which
        hdr = json.load(open(os.path.join(d, 'ct.json')))
        raw = gzip.open(os.path.join(d, 'labels.u16.gz')).read()
        tp = os.path.join(d, 'labels.json')
        if not os.path.exists(tp):
            tp = os.path.join(REPO, 'ssb/geometry/labels.json')
        table = json.load(open(tp))['labels']
    nx, ny, nz = hdr['dims']
    lab = np.frombuffer(raw, '<u2').reshape(nz, ny, nx)
    aff = np.array(hdr['affine'], float)
    return lab, aff, hdr['spacing'][0], {int(k): v for k, v in table.items()}


# ---------------------------------------------------------------- identity metric
def score_tips(split, lab, aff, step, table, which, tol, subset, rmin=None):
    base = {k: v.rsplit('.', 1)[0] for k, v in table.items()}
    labeled = set(base.values())
    rows = defaultdict(lambda: {'n': 0, 'hit': 0, 'out': 0, 'seeded': set(), 'terms': set()})
    nz, ny, nx = lab.shape
    for t in split['tips']:
        if subset != 'all' and t['set'] != subset:
            continue
        if rmin is not None and t['ras'][0] <= rmin:
            continue
        r = rows[t['structure']]
        r['seeded'].add(t['term'] in SEEDED_TERMS); r['terms'].add(t['term'])
        i, j, k = [int(round(x)) for x in (np.array(t['ras']) - aff[:3, 3]) / step]
        if not (0 <= i < nx and 0 <= j < ny and 0 <= k < nz):
            r['out'] += 1
            continue
        blk = lab[max(k - tol, 0):k + tol + 1, max(j - tol, 0):j + tol + 1, max(i - tol, 0):i + tol + 1]
        r['n'] += 1
        r['hit'] += any(base.get(int(v)) in t['ids'] for v in np.unique(blk) if v)
    out = []
    for key in sorted(rows):
        r = rows[key]
        ids = key.split('+')
        out.append({'structure': key, 'terms': sorted(r['terms']), 'n': r['n'], 'hit': r['hit'], 'outside': r['out'],
                    'labeled': any(i in labeled for i in ids), 'seeded': (None if not r['seeded'] else (all(r['seeded']) if len(r['seeded']) == 1 else 'mixed')),
                    'ci': wilson(r['hit'], r['n'])})
    return out


def print_identity(rows, label, subset):
    print('\n== identity: %s labels, %s tips ==' % (label, subset))
    print('%-46s %4s %4s %7s  %-15s %-8s %s' % ('structure (graph ids)', 'n', 'hit', 'rate', 'Wilson 95 % CI', 'labeled', 'seeded'))
    for r in sorted(rows, key=lambda r: (-r['n'], r['structure'])):
        if r['n'] == 0 and not r['outside']:
            continue
        rate = (r['hit'] / r['n']) if r['n'] else float('nan')
        flag = '' if r['n'] >= 10 else '  n<10: too few to tell'
        print('%-46s %4d %4d %6.1f%%  [%5.1f, %5.1f]  %-8s %s%s' % (
            r['structure'][:46], r['n'], r['hit'], 100 * rate, 100 * r['ci'][0], 100 * r['ci'][1],
            'yes' if r['labeled'] else 'NO', {True: 'yes', False: 'no', None: '-', 'mixed': 'mixed'}[r['seeded']], flag))
    for name, sel in (('all scorable', rows), ('structures with a label today', [r for r in rows if r['labeled']])):
        n = sum(r['n'] for r in sel); k = sum(r['hit'] for r in sel); lo, hi = wilson(k, n)
        print('overall, %-30s %d / %d = %.1f %%  [%.1f, %.1f]' % (name, k, n, 100 * k / max(n, 1), 100 * lo, 100 * hi))
    big = [r for r in rows if r['n'] >= 10]
    below = [r for r in big if r['hit'] / r['n'] < 0.90]
    print('structures with n >= 10: %d, of which below the 90 %% target: %d; with n < 10 (cannot tell): %d' % (
        len(big), len(below), sum(1 for r in rows if 0 < r['n'] < 10)))
    out = sum(r['outside'] for r in rows)
    if out:
        print('not scored (outside the label volume box): %d tips' % out)


# ---------------------------------------------------------------- topology
def topology(lab, aff, step, table):
    names = {k: v for k, v in table.items()}
    base = {k: v.rsplit('.', 1)[0] for k, v in names.items()}
    res = {}
    print('\n== topology ==')
    # 1. air labels: one component each
    bad = []
    air_vals = [k for k, b in base.items() if b in AIR_IDS and (lab == k).any()]
    st26 = np.ones((3, 3, 3), int)
    for k in sorted(air_vals, key=lambda k: names[k]):
        cc, n = ndi.label(lab == k, structure=st26)
        if n > 1:
            sizes = np.bincount(cc.ravel())[1:]
            bad.append((names[k], n, int(sizes.max()), int(sizes.sum() - sizes.max())))
    print('air labels in one component (26-connected): %d / %d' % (len(air_vals) - len(bad), len(air_vals)))
    for nm, n, big, rest in bad:
        print('  FAIL %-34s %d components; largest %d voxels, %d voxels outside it' % (nm, n, big, rest))
    res['air_single_component'] = {'pass': len(air_vals) - len(bad), 'of': len(air_vals), 'fail': [b[0] for b in bad]}
    # 2. each sinus / cell reaches the nasal cavity of its side through air
    air = np.isin(lab, air_vals)
    cc, _ = ndi.label(air)          # 6-connected
    cav = {names[k].rsplit('.', 1)[1]: k for k in air_vals if base[k] == CAVITY}
    miss = []
    chk = [k for k in air_vals if base[k] not in (CAVITY, 's.nasopharynx', 's.nasal-vestibule')]
    for k in sorted(chk, key=lambda k: names[k]):
        side = names[k].rsplit('.', 1)[1]
        comps = set(np.unique(cc[lab == k])) - {0}
        cavc = set(np.unique(cc[lab == cav[side]])) - {0} if side in cav else set()
        if not (comps & cavc):
            miss.append(names[k])
    print('sinus / cell instances joined to the nasal cavity of their side through air (6-connected): %d / %d' % (len(chk) - len(miss), len(chk)))
    for m in miss:
        print('  FAIL %s' % m)
    print('  (reaching the EXPECTED meatus through its ostium, by shortest path, is NOT EVALUABLE: the meatus and ostium sub-labels')
    print('   are RS work, section 7.2 step 4; the joined-to-cavity test above is its weaker precursor)')
    res['reaches_nasal_cavity'] = {'pass': len(chk) - len(miss), 'of': len(chk), 'fail': miss}
    # 3. air in direct contact with the orbit label (no bone label between)
    orb = np.isin(lab, [k for k, b in base.items() if b == ORBIT])
    touch = {}
    if orb.any():
        near = ndi.binary_dilation(orb, structure=ndi.generate_binary_structure(3, 1))
        for k in air_vals:
            c = int(((lab == k) & near).sum())
            if c:
                touch[names[k]] = c
    print('air-label voxels face-adjacent to the orbit label: %s' % (', '.join('%s %d' % kv for kv in sorted(touch.items())) or 'none'))
    print('  (a thin lamina papyracea can be unlabeled as bone, so contact is a flag for review, not an automatic failure)')
    print('air labels crossing the anterior cranial fossa: NOT EVALUABLE (the intracranial compartment is not in the served labels;')
    print('   it exists only in walls.py\'s offline grid. Opus to say how to test it.)')
    res['air_touches_orbit_voxels'] = touch
    # 4. bone-unit thickness (twice the local maximum of the distance transform inside each unit)
    units = sorted({k for k, b in base.items() if b not in NOT_BONE and (lab == k).any()}, key=lambda k: names[k])
    th = []
    for k in units:
        full = lab == k
        m = full[ndi.find_objects(full.astype(np.uint8))[0]]
        d = ndi.distance_transform_edt(np.pad(m, 1), sampling=step)[1:-1, 1:-1, 1:-1]
        ridge = (d == ndi.maximum_filter(d, size=3)) & m
        v = 2 * d[ridge]
        th.append((names[k], int(full.sum()), float(np.median(v)), float(np.percentile(v, 95))))
    print('bone units: %d with voxels; thickness (2 x ridge of the distance transform, mm): median over units %.1f, '
          'per-unit medians %.1f..%.1f' % (len(th), float(np.median([t[2] for t in th])), min(t[2] for t in th), max(t[2] for t in th)))
    print('  thicker than 0: %d / %d. Upper limits: NOT EVALUABLE (section 7.1 says "stated limits"; none are stated in the docs).' % (
        sum(t[2] > 0 for t in th), len(th)))
    res['bone_units'] = {'n': len(th), 'thinnest_median_mm': round(min(t[2] for t in th), 2), 'thickest_median_mm': round(max(t[2] for t in th), 2)}
    return res


def graph_consistency():
    p = os.path.join(REF, 'specimen-relations.json')
    if not os.path.exists(p):
        return None
    c = json.load(open(p)).get('counts')
    print('\n== graph consistency (relate3d.py, committed run on the specimen) ==\n%s\n'
          'rerun relate3d.py on candidate labels and compare; the IFAC drainage rules are pinned by tools/test-ssb.mjs' % c)
    return c


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('cmd', nargs='?', default='score', choices=['score', 'split'])
    ap.add_argument('--labels', default='both', help='as-scanned | served | both (default) | a directory')
    ap.add_argument('--set', dest='subset', default='heldout', choices=['heldout', 'seed', 'all'])
    ap.add_argument('--tol', type=int, default=1, help='voxel tolerance (Chebyshev), default 1')
    ap.add_argument('--json', help='also write the results here')
    ap.add_argument('--seed', type=int, default=SEED)
    a = ap.parse_args()
    if a.cmd == 'split':
        s = build_split(a.seed)
        json.dump(s, open(SPLIT, 'w'), indent=0, separators=(',', ':'))
        open(SPLIT, 'a').write('\n')
        print('wrote %s: %d scorable tips, %d held out; unscorable (no graph id): %d' % (
            os.path.relpath(SPLIT, REPO), s['counts']['scorable'], s['counts']['heldout'], sum(s['unscorable']['no graph id'].values())))
        return
    split = json.load(open(SPLIT))
    for f, h in split['inputs'].items():
        p = {'slices.json': os.path.join(REF, f), 'crosswalk.json': os.path.join(REF, f), 'vocab-extra.json': os.path.join(HERE, f)}.get(f)
        if p and sha8(p) != h:
            print('WARNING: %s changed since the split was made; rerun `score.py split` only if the ground truth is meant to move' % f)
    targets = ['as-scanned', 'served'] if a.labels == 'both' else [a.labels]
    results = {}
    for which in targets:
        lab, aff, step, table = load_labels(which)
        right_only = which == 'served'
        title = which + (' (standard head: tips with R > 0 only)' if right_only else '')
        rows = score_tips(split, lab, aff, step, table, which, a.tol, a.subset, rmin=0.0 if right_only else None)
        print_identity(rows, title, '%s (tol %d voxel = %.1f mm)' % (a.subset, a.tol, a.tol * step))
        results[which] = {'identity': rows, 'topology': topology(lab, aff, step, table)}
    results['graph'] = graph_consistency()
    reg = json.load(open(os.path.join(HERE, 'registration.json')))['labels']['axial_vs_sagittal']
    print('context: axial-vs-sagittal tip disagreement, median %.2f mm all tips, %.2f mm point-like structures (labels3d.py)' % (
        reg['median_mm_all_tips'], reg['median_mm_pointlike']))
    if a.json:
        json.dump(results, open(a.json, 'w'), indent=1, default=lambda o: sorted(o) if isinstance(o, set) else str(o))


if __name__ == '__main__':
    main()
