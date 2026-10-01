"""Spatial claims of the graph tested against the reference specimen in 3D (docs/ssb.md section 9).

    .venv/bin/python tools/ssb-pipeline/uw/relate3d.py     # after walls.py and sweeps.py (needs only ssb/)

For every spatial rel (medial-to, lateral-to, anterior-to, posterior-to, superior-to, inferior-to) in
ssb/content whose two ends both have geometry - label voxels in ssb/ct/labels.u16.gz, a sweep in
ssb/geometry/sweeps.json, or a landmark in ssb/geometry/landmarks.json (in that order of preference) -
the claim is tested per side (R, L; a midline structure pairs with either side) on regions, not centroids:

  The two point sets are binned on the two axes the claim does not test (2 mm cells). In every cell that
  holds both, the medians along the tested axis are compared (for medial / lateral: the median distance
  from the midsagittal plane, |r|, so "medial-to" means "closer to the midline at the same height and
  depth"). A cell votes only when the medians differ by more than 0.5 mm. The claim agrees on a side when
  >= 70 % of the votes agree, contradicts when <= 30 % do, and is mixed in between. With fewer than 3
  voting cells (the structures do not overlap in projection), the whole sets are compared instead: agree
  if A's 25th-75th percentile range along the axis lies wholly on the claimed side of B's, contradict if
  wholly on the other, otherwise untestable. A side whose sweep is mostly inferred (sweeps.meta.json) is
  marked "weak": its agreement partly restates the rule that placed it.

Writes ssb/reference/specimen-relations.json. Points are data; a contradiction is either a geometry
error (segmentation, sweep) or a graph error, and needs a person to say which.
"""
import gzip, json, os, glob
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
AXIS = {'medial-to': (0, -1), 'lateral-to': (0, 1), 'anterior-to': (1, 1), 'posterior-to': (1, -1),
        'superior-to': (2, 1), 'inferior-to': (2, -1)}          # (axis, +1 = A has the larger value)
CELL, MARGIN, AGREE, MIN_CELLS = 2.0, 0.5, 0.7, 3
MAX_PTS = 30000


def geometry():
    H = json.load(open(os.path.join(REPO, 'ssb/ct/ct.json')))
    nx, ny, nz = H['dims']
    lab = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct', H['labels']['file'])).read(), '<u2').reshape(nz, ny, nx)
    table = json.load(open(os.path.join(REPO, 'ssb/geometry/labels.json')))['labels']
    A = np.array(H['affine'], float)
    geo = {}
    rng = np.random.default_rng(0)
    idx = np.nonzero(lab.ravel())[0]
    vals = lab.ravel()[idx]
    order = np.argsort(vals, kind='stable'); idx, vals = idx[order], vals[order]
    bounds = np.searchsorted(vals, np.arange(1, int(vals.max()) + 2))
    for k, name in table.items():
        k = int(k)
        if k > vals.max():
            continue
        sel = idx[bounds[k - 1]:bounds[k]]
        if not len(sel):
            continue
        if len(sel) > MAX_PTS:
            sel = rng.choice(sel, MAX_PTS, replace=False)
        kk, jj, ii = np.unravel_index(sel, (nz, ny, nx))
        P = (A[:3, :3] @ np.stack([ii, jj, kk]).astype(float) + A[:3, 3:4]).T
        geo[name] = ('label', P)
    sw = json.load(open(os.path.join(REPO, 'ssb/geometry/sweeps.json')))
    for name, s in sw.items():
        P = np.array(s['pts'], float)
        d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
        t = np.arange(0, d[-1] + 1e-6, 0.5)
        geo.setdefault(name, ('sweep', np.stack([np.interp(t, d, P[:, c]) for c in range(3)], 1)))
    for name, p in json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json'))).items():
        geo.setdefault(name, ('landmark', np.array([p], float)))
    return geo


def instances(geo, gid):
    return {n.rsplit('.', 1)[1]: v for n, v in geo.items() if n.rsplit('.', 1)[0] == gid}


def test(PA, PB, rel):
    ax, sg = AXIS[rel]
    other = [c for c in range(3) if c != ax]
    val = (lambda P: np.abs(P[:, 0])) if ax == 0 else (lambda P: P[:, ax])
    va, vb = val(PA), val(PB)
    ka = [tuple(x) for x in np.floor(PA[:, other] / CELL).astype(int)]
    kb = [tuple(x) for x in np.floor(PB[:, other] / CELL).astype(int)]
    from collections import defaultdict
    ca, cb = defaultdict(list), defaultdict(list)
    for key, v in zip(ka, va):
        ca[key].append(v)
    for key, v in zip(kb, vb):
        cb[key].append(v)
    agree = disagree = 0
    for key in set(ca) & set(cb):
        dv = np.median(ca[key]) - np.median(cb[key])
        if abs(dv) <= MARGIN:
            continue
        if np.sign(dv) == np.sign(sg):
            agree += 1
        else:
            disagree += 1
    n = agree + disagree
    ev = {'cells_voting': n, 'cells_agree': agree,
          'median_delta_mm': round(float((np.median(va) - np.median(vb)) * (1 if sg > 0 else -1)), 1)}
    if n >= MIN_CELLS:
        f = agree / n
        ev['fraction_agree'] = round(f, 2)
        return ('agree' if f >= AGREE else 'contradict' if f <= 1 - AGREE else 'mixed'), ev
    qa, qb = np.percentile(va, [25, 75]), np.percentile(vb, [25, 75])
    ev['basis'] = 'whole sets (no overlap in projection)'
    if sg > 0:
        st = 'agree' if qa[0] > qb[1] else 'contradict' if qa[1] < qb[0] else 'untestable'
    else:
        st = 'agree' if qa[1] < qb[0] else 'contradict' if qa[0] > qb[1] else 'untestable'
    return st, ev


def main():
    geo = geometry()
    smeta = json.load(open(os.path.join(REPO, 'ssb/geometry/sweeps.meta.json')))['sweeps']
    weak = {k for k, v in smeta.items() if v.get('status_fraction', {}).get('inferred', 0) >= 0.5}
    results = []
    for f in sorted(glob.glob(os.path.join(REPO, 'ssb/content/*.json'))):
        doc = json.load(open(f))
        for coll, ents in doc.items():
            for e in ents:
                for rr in e.get('rel', []) or []:
                    if rr.get('r') not in AXIS:
                        continue
                    A, B = instances(geo, e['id']), instances(geo, rr['to'])
                    rec = {'id': e['id'], 'r': rr['r'], 'to': rr['to'], 'note': rr.get('note'), 'file': os.path.basename(f)}
                    if not A or not B:
                        rec['status'] = 'no-geometry'
                        rec['missing'] = [x for x, g in ((e['id'], A), (rr['to'], B)) if not g]
                        results.append(rec); continue
                    sides = {}
                    for sd in ('R', 'L'):
                        a = A.get(sd) or A.get('M'); b = B.get(sd) or B.get('M')
                        if a is None or b is None or (sd == 'L' and 'M' in A and 'M' in B and not (A.get('L') or B.get('L'))):
                            continue
                        st, ev = test(a[1], b[1], rr['r'])
                        sides[sd] = {'status': st, 'kinds': [a[0], b[0]], **ev}
                        inf = [f'{x}.{sd2}' for x, G in ((e['id'], A), (rr['to'], B)) for sd2 in (sd, 'M')
                               if f'{x}.{sd2}' in weak and G.get(sd2) is not None and G.get(sd2)[0] == 'sweep']
                        if inf:
                            sides[sd]['weak'] = 'mostly inferred sweep: ' + ', '.join(inf)
                    if not sides:
                        rec['status'] = 'no-geometry'; rec['missing'] = ['no shared side']
                        results.append(rec); continue
                    sts = {v['status'] for v in sides.values()}
                    rec['status'] = (sts.pop() if len(sts) == 1 else
                                     'mixed' if 'agree' in sts and 'contradict' in sts else
                                     'agree' if 'agree' in sts else 'contradict' if 'contradict' in sts else 'untestable')
                    rec['sides'] = sides
                    results.append(rec)
    counts = {}
    for r in results:
        counts[r['status']] = counts.get(r['status'], 0) + 1
    out = {
        'method': __doc__.split('the claim is tested')[1].split('Writes')[0].strip(),
        'params': {'cell_mm': CELL, 'margin_mm': MARGIN, 'agree_fraction': AGREE, 'min_cells': MIN_CELLS},
        'specimen': 'uw-axial-sagittal', 'counts': counts,
        'tests': [r for r in results if r['status'] != 'no-geometry'],
        'no_geometry': [{k: r[k] for k in ('id', 'r', 'to', 'missing')} for r in results if r['status'] == 'no-geometry'],
    }
    json.dump(out, open(os.path.join(REPO, 'ssb/reference/specimen-relations.json'), 'w'), indent=1)
    print(counts)
    for r in out['tests']:
        if r['status'] in ('contradict', 'mixed'):
            print(r['status'], r['id'], r['r'], r['to'], json.dumps(r['sides']), '|', r.get('note'))


if __name__ == '__main__':
    main()
