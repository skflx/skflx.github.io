"""Reference specimen, stage E: the mucosal state, decongested and congested (WP DC1; contract docs/ssb.md 5.9).

    python3 tools/ssb-pipeline/uw/mucosa.py decongested [--no-lining]   # after lining.py and walls.py: reads ssb/ only
    python3 tools/ssb-pipeline/uw/mucosa.py congested   [--no-lining]
    python3 tools/ssb-pipeline/uw/dissect.py                            # then: the dissection states, built on the decongested patch

The two states are patches on the as-scanned base (the format of docs/ssb.md 5.8, one constant display per patch), plus a
lining pack, written to ssb/states/<key>.ssbp.gz and ssb/models/lining-<key>.glb.gz, and recorded with the calibration in
ssb/states/mucosa.json (dissect.py copies them into ssb/states/index.json, the one writer of that file).

Operator. The erectile tissue is the soft tissue (display air.level <= v < bone) of the side's inferior and middle
turbinate and of the septum's half on that side, between the choanal arch (A of lm.choanal-arch.M) and the internal
valve (A of s.internal-nasal-valve), never closer than 0.5 mm to bone (display >= 120). The septum's midplane (R = 0) is
never changed, so decongestion cannot perforate it.

  decongested  the tissue within d mm of that side's nasal-cavity air recedes to air (display air.fill, label the side's
               nasal cavity). d is the smallest 0.25 mm step whose mean per-side cross-section over the span below is
               at least 3.8 / 2.8 times the as-scanned one (Xiao et al. 2021, a ratio: the specimen's label is a CT
               threshold and Xiao's an MRI segmentation).
  congested    the same tissue advances by d into that side's nasal-cavity air (display = the median of the erectile soft
               tissue, label the nearest erectile label), never within 0.5 mm of the other side's air. The target is the
               median of POP1's more-congested-side mean over the subject's two-side mean, read from
               ssb/anatomy/population/nasalseg.json (profiles.summary.restricted["10-90"].moreCongestedOverMean.p50); d is the
               0.1 mm step whose ratio is closest to it.

The cross-section is the count of the side's nasal-cavity air voxels (label and display < air.level) in each coronal
section A in [lm.middle-turbinate-head.a - 3, lm.choanal-arch.a + 1], averaged over the sections. The right side is
computed and mirrored (the specimen is the standardized head, symmetric by construction). Deterministic: a rerun is
byte-identical.
"""
import argparse, hashlib, json, os, sys, time
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dissect as D  # noqa: E402

REPO = D.REPO
OUT = D.OUT
RECORD = os.path.join(OUT, 'mucosa.json')
NASALSEG = os.path.join(REPO, 'ssb/anatomy/population/nasalseg.json')
BONE_LEVEL = 120                 # display: soft tissue is air.level <= v < BONE_LEVEL (docs/ssb.md 5.9)
BONE_GAP_MM = 0.5                # an operator never changes a voxel this close to bone
SEPTUM_GAP_MM = 0.5              # a congested voxel is never this close to the other side's air
XIAO_RATIO = 3.8 / 2.8           # mean cross-section after / before xylometazoline (Xiao 2021)
CONG_GROUP = 'turbinates'
DEC_STEP, CONG_STEP = 0.25, 0.1
DEC_MAX, CONG_MAX = 3.0, 1.5
ERECTILE_GROUPS = {'all': ('s.inferior-turbinate.R', 's.middle-turbinate.R', 's.nasal-septum.M'),
                   'turbinates': ('s.inferior-turbinate.R', 's.middle-turbinate.R')}
NAMES = {'decongested': 'dec', 'congested': 'cong'}
CUT = {'dec': 'decongested', 'cong': 'congested'}
TIGHT = {'decongested': (1.35, 1.45), 'congested': None}
MODE_KEY = {m: hashlib.sha256(('mucosa.' + m).encode()).hexdigest()[:10] for m in ('dec', 'cong')}
say = D.say


class Side:
    """The right side's masks and distance fields, computed once: both operators read them."""

    def __init__(self, base, level):
        b = base
        self.base, self.level = b, level
        r_pos = (b.g.r > 0)[None, None, :]
        self.r_pos = np.broadcast_to(r_pos, b.g.shape)
        cav = b.index['s.nasal-cavity.R']
        self.cav_label = cav
        self.air = (b.lab == cav) & (b.ct < level)
        self.air_other = (b.lab == b.index['s.nasal-cavity.L']) & (b.ct < level)
        self.erectile = np.isin(b.lab, [b.index['s.inferior-turbinate.R'], b.index['s.middle-turbinate.R'], b.index['s.nasal-septum.M']]) & self.r_pos
        self.soft = self.erectile & (b.ct >= level) & (b.ct < BONE_LEVEL)
        lo = b.landmarks['lm.choanal-arch.M'][1]
        hi = b.landmarks['s.internal-nasal-valve.R'][1]
        a = b.g.a
        self.span_cavity = (a >= lo - 1e-9) & (a <= hi + 1e-9)                                       # where the operator acts
        mt = b.landmarks['lm.middle-turbinate-head.R'][1]
        self.span_csa = (a >= lo + 1.0 - 1e-9) & (a <= mt - 3.0 + 1e-9)                                # where the ratio is measured
        self.in_span = self.span_cavity[None, :, None]
        self.d_air = ndi.distance_transform_edt(~self.air, sampling=b.step)
        self.d_bone = ndi.distance_transform_edt(~(b.ct >= BONE_LEVEL), sampling=b.step)
        self.s_bands = self.thirds_s()
        self._src, self._d_other, self._group = {}, None, 'all'

    def thirds_s(self):
        k = np.nonzero(self.air.any(axis=(1, 2)))[0]
        lo, hi = self.base.g.s[k.min()], self.base.g.s[k.max()]
        cut = [lo + (hi - lo) * f for f in (0, 1 / 3, 2 / 3, 1)]
        return cut

    # --- the cross-section
    def csa(self, air):
        """Mean coronal cross-section (cm^2) of an air mask over the measured span."""
        per = air.sum(axis=(0, 2)).astype(np.float64) * self.base.step ** 2 / 100.0
        return float(per[self.span_csa].mean())

    def csa_bands(self, air, bands):
        """Mean cross-section (cm^2) in each band of S, over the measured span; sums to csa()."""
        out = []
        s = self.base.g.s
        for n in range(3):
            sel = (s >= bands[n]) & ((s < bands[n + 1]) if n < 2 else (s <= bands[n + 1] + 1e-9))
            per = air[sel].sum(axis=(0, 2)).astype(np.float64) * self.base.step ** 2 / 100.0
            out.append(float(per[self.span_csa].mean()))
        return out

    def csa_thirds_a(self, air):
        """Mean cross-section (cm^2) in each third of the span along A (anterior first)."""
        per = air.sum(axis=(0, 2)).astype(np.float64) * self.base.step ** 2 / 100.0
        idx = np.nonzero(self.span_csa)[0][::-1]                       # anterior (high A) first
        parts = np.array_split(idx, 3)
        return [float(per[p].sum() / len(idx)) for p in parts]        # each third's share of the mean: they sum to csa()

    # --- the operators
    def decongest_mask(self, d):
        cand = self.soft & (self.d_air <= d + 1e-9) & (self.d_bone >= BONE_GAP_MM - 1e-9) & self.in_span
        cand &= (self.base.g.r > 0)[None, None, :]                    # the midplane stays
        return cand

    def congest_mask(self, d, group='all'):
        b = self.base
        if group not in self._src:
            names = ERECTILE_GROUPS[group]
            src = np.isin(b.lab, [b.index[n] for n in names]) & self.r_pos & (b.ct >= self.level)
            self._src[group] = ndi.distance_transform_edt(~src, sampling=b.step, return_indices=True)
        if self._d_other is None:
            self._d_other = ndi.distance_transform_edt(~self.air_other, sampling=b.step)
        self._group = group
        cand = self.air & (self._src[group][0] <= d + 1e-9) & (self._d_other > SEPTUM_GAP_MM + 1e-9) & self.in_span
        cand &= (b.g.r > 0)[None, None, :]
        return cand

    def congest_labels(self, cand):
        idx = self._src[self._group][1]
        k, j, i = np.nonzero(cand)
        return k, j, i, self.base.lab[idx[0][k, j, i], idx[1][k, j, i], idx[2][k, j, i]]


def target_ratio():
    doc = json.load(open(NASALSEG))
    return float(doc['profiles']['summary']['restricted']['10-90']['moreCongestedOverMean']['p50'])


def thirds_text(vals):
    return ' / '.join('%+.3f' % v for v in vals)


def calibrate(sd, kind, group='all'):
    base_air = sd.air
    csa0 = sd.csa(base_air)
    bands = sd.s_bands
    b0, a0 = sd.csa_bands(base_air, bands), sd.csa_thirds_a(base_air)
    say('as scanned: mean cross-section %.3f cm^2 per side over A %.1f..%.1f (%d sections); S thirds of the cavity %.1f..%.1f mm: %s cm^2; A thirds: %s'
        % (csa0, sd.base.g.a[sd.span_csa].min(), sd.base.g.a[sd.span_csa].max(), int(sd.span_csa.sum()), bands[0], bands[3],
           ' / '.join('%.3f' % v for v in b0), ' / '.join('%.3f' % v for v in a0)))
    rows = []
    if kind == 'decongested':
        goal, step, top = XIAO_RATIO, DEC_STEP, DEC_MAX
    else:
        goal, step, top = target_ratio(), CONG_STEP, CONG_MAX
    say('target ratio %.4f (%s)' % (goal, 'Xiao 2021, 3.8 / 2.8' if kind == 'decongested' else 'POP1 moreCongestedOverMean p50, 10-90 %'))
    say('\n    d mm   voxels   ratio    gain S thirds (inferior / middle / superior) cm^2      A thirds (anterior / middle / posterior) cm^2')
    n = 1
    while True:
        d = round(n * step, 4)
        if d > top + 1e-9:
            break
        if kind == 'decongested':
            m = sd.decongest_mask(d)
            air = sd.air | m
        else:
            m = sd.congest_mask(d, group)
            air = sd.air & ~m
        ratio = sd.csa(air) / csa0
        sb = [x - y for x, y in zip(sd.csa_bands(air, bands), b0)]
        at = [x - y for x, y in zip(sd.csa_thirds_a(air), a0)]
        rows.append({'d': d, 'voxels': int(m.sum()), 'ratio': round(ratio, 4), 'gainSThirds': [round(x, 3) for x in sb], 'gainAThirds': [round(x, 3) for x in at]})
        say('%7.2f %8d  %.4f   %s      %s' % (d, int(m.sum()), ratio, thirds_text(sb), thirds_text(at)))
        n += 1
    if kind == 'decongested':
        pick = next((r for r in rows if r['ratio'] >= goal - 1e-12), None)
    else:
        pick = min(rows, key=lambda r: (abs(r['ratio'] - goal), r['d']))
    return goal, csa0, pick, rows, b0, a0


def build_state(base, sd, kind, d, level, fill, group='all'):
    """The working state of the mucosal operator on both sides (the right computed, the left its mirror), and its labels."""
    st = D.State(base)
    if kind == 'decongested':
        m = sd.decongest_mask(d)
        st.ct[m] = fill
        st.lab[m] = sd.cav_label
    else:
        m = sd.congest_mask(d, group)
        k, j, i, lab = sd.congest_labels(m)
        st.ct[k, j, i] = fill
        st.lab[k, j, i] = lab
    k, j, i = np.nonzero(m)
    mi = 2 * base.mid - i
    st.ct[k, j, mi] = fill
    st.lab[k, j, mi] = base.mirror_label[st.lab[k, j, i]]
    st.owner[k, j, i] = D.MUCOSA
    st.owner[k, j, mi] = D.MUCOSA
    st.mucosa = CUT[NAMES[kind]]
    return st, m


def apply_decongested(st, base, d):
    """dissect.py: the decongested working state as the first thing a dissection state is built on."""
    level = int(json.load(open(D.DISSECTION))['air']['level'])
    fill = int(json.load(open(D.DISSECTION))['air']['fill'])
    sd = Side(base, level)
    m = sd.decongest_mask(d)
    st.ct[m] = fill
    st.lab[m] = sd.cav_label
    k, j, i = np.nonzero(m)
    mi = 2 * base.mid - i
    st.ct[k, j, mi] = fill
    st.lab[k, j, mi] = base.mirror_label[st.lab[k, j, i]]
    st.owner[k, j, i] = D.MUCOSA
    st.owner[k, j, mi] = D.MUCOSA
    return int(m.sum()) * 2


def load_record():
    return json.load(open(RECORD)) if os.path.exists(RECORD) else {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('kind', choices=('decongested', 'congested'))
    ap.add_argument('--group', choices=sorted(ERECTILE_GROUPS), default=CONG_GROUP, help='congested: which erectile labels advance (default: %s)' % CONG_GROUP)
    ap.add_argument('--no-lining', action='store_true', help='development: no lining pack (the record is then not for commit)')
    args = ap.parse_args()
    t0 = time.time()
    kind = args.kind
    mode = NAMES[kind]
    data = json.load(open(D.DISSECTION))
    level, air_fill = int(data['air']['level']), int(data['air']['fill'])
    base = D.Base()
    sd = Side(base, level)
    say('base %s, mid i=%d; %d erectile soft voxels on the right, %d cavity air voxels' % (base.hash, base.mid, int(sd.soft.sum()), int(sd.air.sum())))
    goal, csa0, pick, rows, b0, a0 = calibrate(sd, kind, args.group)
    assert pick is not None, 'no d within %.2f mm reaches the target ratio' % (DEC_MAX if kind == 'decongested' else CONG_MAX)
    d = pick['d']
    fill = air_fill if kind == 'decongested' else int(np.median(base.ct[sd.soft]))
    st, m = build_state(base, sd, kind, d, level, fill, args.group)
    air_after = sd.air | m if kind == 'decongested' else sd.air & ~m
    ratio = sd.csa(air_after) / csa0

    # --- invariants on what was changed (both sides, after the mirror)
    changed = (st.lab != base.lab) | (st.ct != base.ct)
    bone_changed = int((changed & (base.ct >= BONE_LEVEL)).sum())
    near_bone = ndi.distance_transform_edt(~(base.ct >= BONE_LEVEL), sampling=base.step) < BONE_GAP_MM - 1e-9
    near_changed = int((changed & near_bone).sum())
    other_labels = sorted({base.table[str(x)] for x in np.unique(base.lab[changed])})
    say('\n%s: d = %.2f mm, ratio %.4f (target %.4f), %d voxels changed (%d on the right), fill display %d' % (kind, d, ratio, goal, int(changed.sum()), int(m.sum()), fill))
    say('bone voxels changed: %d; voxels changed within %.1f mm of bone: %d; labels changed from: %s' % (bone_changed, BONE_GAP_MM, near_changed, ', '.join(other_labels)))
    sb = [x - y for x, y in zip(sd.csa_bands(air_after, sd.s_bands), b0)]
    at = [x - y for x, y in zip(sd.csa_thirds_a(air_after), a0)]
    say('S thirds (inferior / middle / superior): %s cm^2; A thirds (anterior / middle / posterior): %s cm^2' % (thirds_text(sb), thirds_text(at)))
    if kind == 'decongested':
        lo, hi = TIGHT[kind]
        assert lo <= ratio <= hi, 'ratio %.3f outside %.2f..%.2f (escalate)' % (ratio, lo, hi)
        assert d <= 2.0, 'd = %.2f mm: the escalation line is d > 2 mm' % d
        assert sb[2] == min(sb), 'the superior third does not gain least'
    else:
        assert abs(ratio - goal) <= 0.04, 'ratio %.3f is not within 0.04 of the target %.3f (escalate)' % (ratio, goal)
        assert at[1] == min(at), 'the largest loss is not in the middle third along A'
    assert bone_changed == 0 and near_changed == 0

    # --- outputs
    key = MODE_KEY[mode]
    os.makedirs(OUT, exist_ok=True)
    n, pbytes, ch = D.write_patch(os.path.join(OUT, key + '.ssbp.gz'), base, st, key, [], fill, {'mucosa': mode})
    assert pbytes <= D.PATCH_BYTES, 'patch %d bytes' % pbytes
    lin = D.write_lining(base, st, key, data, not args.no_lining)
    if not args.no_lining:
        assert lin['bytes'] <= D.STATE_LINING_BYTES, 'lining %d bytes' % lin['bytes']
    say('patch %d bytes; lining %d bytes, %d triangles (remnants %d: %s)'
        % (pbytes, lin['bytes'], lin['triangles'], lin['remnantTriangles'], ', '.join(sorted(lin['remnants'].values()))))
    entry = {'key': key, 'mode': mode, 'd': d, 'erectileLabels': (list(ERECTILE_GROUPS['all']) if kind == 'decongested' else list(ERECTILE_GROUPS[args.group])), 'ratio': round(ratio, 4), 'target': round(goal, 4), 'ctFill': fill, 'changedVoxels': int(changed.sum()),
             'boneVoxelsChanged': bone_changed, 'meanCsaCm2AsScanned': round(csa0, 3),
             'gainSThirdsCm2': [round(x, 3) for x in sb], 'deltaAThirdsCm2': [round(x, 3) for x in at],
             'table': rows, 'patch': key + '.ssbp.gz', 'lining': lin['file'], 'hides': lin['hides'], 'remnants': lin['remnants'],
             'measured': {'carvedVoxels': n, 'patchBytes': pbytes, 'liningBytes': lin['bytes'], 'liningTriangles': lin['triangles'], 'remnantTriangles': lin['remnantTriangles']}}
    rec = load_record()
    rec.update({'version': 1, 'base': base.hash, 'span': {'aMm': [round(float(base.g.a[sd.span_csa].min()), 2), round(float(base.g.a[sd.span_csa].max()), 2)],
                                                           'operatorAMm': [round(float(base.g.a[sd.span_cavity].min()), 2), round(float(base.g.a[sd.span_cavity].max()), 2)]},
                'note': 'tools/ssb-pipeline/uw/mucosa.py output (docs/ssb.md 5.9); dissect.py copies the states into index.json'})
    rec[kind] = entry
    with open(RECORD, 'w') as fh:
        json.dump(rec, fh, indent=1, sort_keys=True)
        fh.write('\n')
    say('%s done in %.0fs' % (kind, time.time() - t0))


if __name__ == '__main__':
    main()
