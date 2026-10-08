"""Reference specimen, stage E: dissection states for procedure mode (WP P1b; contract docs/ssb.md 5.8).

    python3 tools/ssb-pipeline/uw/dissect.py [--no-lining]     # after lining.py (and walls.py, sdf.py): reads ssb/ only

Evaluates tools/ssb-pipeline/uw/dissection.json (Opus's data: units are rules over the base's own labels, landmarks
and distance fields) on the standard specimen and writes, for every state the procedures and corridors reach:

  ssb/states/<key>.ssbp.gz         the patch: u32 header length, JSON header, one u16 box per side (R, L, midline)
  ssb/models/lining-<key>.glb.gz   the airway lining of the state's air, plus a remnant mesh <id>.<side>@<cut> for
                                   every wall label the state cuts partly (hides: the wall nodes it removes entirely)
  ssb/states/index.json            states (units, usedBy, files, hides, remnants, measured), procedures, corridors

A state is the cumulative unit list at a procedure step (the `entry` chain, then the steps up to it) or at a
corridor position (the earlier procedures' units instead of `entry`), `.R` and `.M` units only, identical lists
being one state; its key is the first 10 hex of the SHA-256 of the list (application order, one unit per line).

Method (docs/ssb.md 5.8). Every operator acts on a working copy of the CT display and labels, only on voxels with
display >= air.level, outside the unit's keep list and inside the guard (>= marginMm from the ICA, optic nerve and
AEA fields, resampled trilinearly from the 1 mm grid, and from the orbit labels). A carved voxel takes display
air.fill and the label of the nearest voxel of the unit's own air sets. A right-side unit is computed on r >= 0 and
mirrored at R = 0 (labels .R -> .L), the guard applied again on the mirrored voxels (a rejected voxel stays as it
was); a midline unit is computed whole. Anchors read voxel centres. The distance fields are not recomputed.

Every mesh of a lining pack (the lining and the remnants) is cleaned before it is written (meshes.py clean_lining, WP P4): a
zero-thickness fin, two faces on the same three vertices, cancels its vertices' area-weighted normals to zero and
is drawn black, so both of its faces go and a vertex left with no normal gets one back from its faces or neighbours.

Deterministic: gzip is written with mtime 0, and a rerun is byte-identical.
"""
import argparse, gzip, hashlib, json, os, re, struct, sys, time
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import meshes as M  # noqa: E402
import lining as L  # noqa: E402
from walls import Grid, read_volume  # noqa: E402
from volume import write_results  # noqa: E402

REPO = M.REPO
DISSECTION = os.path.join(HERE, 'dissection.json')
OUT = os.path.join(REPO, 'ssb/states')
STATE_BUDGET = 33000            # triangles in one state's lining pack (lining + remnants): 350 kB gzip at about 9.5 B per triangle
STATE_LINING_BYTES = 350_000
ALL_STATES_BYTES = 6_000_000
PATCH_BYTES = 100_000
NEAREST_PAD_MM = 20.0           # how far past a unit's box the fill label is looked for
MUCOSA = 255                    # `owner` of a voxel the mucosal state (mucosa.py) changed: not one of the units
ERECTILE_REMNANT = 0.5          # scale of the budget of an erectile wall's remnant (turbinates, septum): they change in every mucosal state
MIN_REMNANT = 50                # voxels: fewer remaining and the wall node is hidden (meshes.py skips the same)
SIDES = ('R', 'L', 'M')
AXES = ('r', 'a', 's')          # box axes, in the order of a voxel index's (i, j, k)
ANCHOR = re.compile(r'^(?P<id>.+)\.(?P<ext>rmin|rmax|amin|amax|smin|smax|r|a|s)\s*(?:(?P<sign>[+-])\s*(?P<mm>[0-9.]+))?$')


def say(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------- the base
class Base:
    def __init__(self):
        hdr, ct, lab, table = read_volume()
        self.hdr, self.table = hdr, table
        self.ct, self.lab = ct.copy(), lab.copy()
        self.g = Grid(hdr)
        self.step = self.g.step
        self.nz, self.ny, self.nx = self.g.shape
        self.mid = int(round(-self.g.r[0] / self.step))               # the i of R = 0
        assert abs(self.g.r[self.mid]) < 1e-9 and self.nx == 2 * self.mid + 1, 'the specimen is not centred on R = 0'
        self.index = {v: int(k) for k, v in table.items()}
        self.landmarks = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
        h = hashlib.sha256()
        h.update(np.ascontiguousarray(self.ct).tobytes()); h.update(np.ascontiguousarray(self.lab).tobytes())
        self.hash = h.hexdigest()[:10]
        self._ext = {}
        self.guard_fields = {}
        self.guard_ok = None
        self.air_ids = [int(k) for k, v in table.items() if v.rsplit('.', 1)[0] in M.AIR_PACKED]
        self.mirror_label = np.arange(max(self.index.values()) + 1, dtype=np.uint16)
        for name, idx in self.index.items():
            if name.endswith('.R') and name[:-2] + '.L' in self.index:
                self.mirror_label[idx] = self.index[name[:-2] + '.L']

    # --- label sets
    def ids(self, spec, unit_side):
        """Label indices an id stands for: an id with a side suffix is exactly that label; without one it is the
        unit's own side (.R and .M for a right unit) or every side (a midline unit). Missing labels are skipped."""
        out = []
        for s in spec:
            last = s.rsplit('.', 1)[-1]
            names = [s] if last in SIDES else [s + '.' + x for x in (('R', 'M') if unit_side == 'R' else SIDES)]
            out += [self.index[n] for n in names if n in self.index]
        return out

    def label_ids(self, ident):
        """All of an id's labels (an id without a side is .R, .L and .M), for keep lists."""
        last = ident.rsplit('.', 1)[-1]
        names = [ident] if last in SIDES else [ident + '.' + x for x in SIDES]
        return [self.index[n] for n in names if n in self.index]

    # --- anchors
    def extent(self, ident, unit_side):
        """(rmin, rmax, amin, amax, smin, smax) of the voxel centres of the label the unit's side picks."""
        if unit_side == 'R':
            order = ('R', 'M')
        else:
            order = ('M', 'R')
        for sd in order:
            n = ident + '.' + sd
            if n in self.index:
                key = n
                break
        else:
            raise KeyError('anchor label %s has no .%s/.%s label' % (ident, *order))
        if key not in self._ext:
            k, j, i = np.nonzero(self.lab == self.index[key])
            assert len(i), key + ' is empty'
            self._ext[key] = (self.g.r[i].min(), self.g.r[i].max(), self.g.a[j].min(), self.g.a[j].max(),
                              self.g.s[k].min(), self.g.s[k].max())
        return self._ext[key]

    def anchor(self, expr, unit_side):
        if isinstance(expr, (int, float)):
            return float(expr)
        m = ANCHOR.match(expr.strip())
        assert m, 'cannot read the anchor "%s"' % expr
        ident, ext = m.group('id'), m.group('ext')
        if ident.startswith('lm.'):
            for sd in (('R', 'M', 'L') if unit_side == 'R' else ('M', 'R', 'L')):
                p = self.landmarks.get(ident + '.' + sd)
                if p is not None:
                    break
            else:
                raise KeyError('landmark ' + ident)
            v = p['position'][AXES.index(ext)] if isinstance(p, dict) else p[AXES.index(ext)]
        else:
            v = self.extent(ident, unit_side)[('rmin', 'rmax', 'amin', 'amax', 'smin', 'smax').index(ext)]
        if m.group('sign'):
            v += (1 if m.group('sign') == '+' else -1) * float(m.group('mm'))
        return float(v)

    def box(self, spec, unit_side):
        """Index slices (k, j, i) of the unit's box (inclusive of voxel centres); an absent axis is unbounded, and a
        right unit never reaches r < 0 (the left is its mirror)."""
        lo_hi = []
        for ax, n, coords in (('s', self.nz, self.g.s), ('a', self.ny, self.g.a), ('r', self.nx, self.g.r)):
            b = (spec.get('box') or {}).get(ax)
            if b is None:
                lo, hi = -np.inf, np.inf
            else:
                lo, hi = self.anchor(b[0], unit_side), self.anchor(b[1], unit_side)
            if ax == 'r' and unit_side == 'R':
                lo = max(lo, 0.0)
            ok = np.flatnonzero((coords >= lo - 1e-9) & (coords <= hi + 1e-9))
            lo_hi.append((int(ok[0]), int(ok[-1]) + 1) if len(ok) else (0, 0))
        return tuple(slice(*x) for x in lo_hi)

    # --- the guard
    def build_guard(self, spec):
        """Boolean volume: True where a voxel may be carved."""
        ok = np.ones(self.g.shape, bool)
        margin = spec['marginMm']
        self.guard_fields = {}
        ct_hdr = self.hdr['sdf']
        for fid in spec['fields']:
            f = ct_hdr['fields'][fid]
            nz, ny, nx = ct_hdr['dims'][2], ct_hdr['dims'][1], ct_hdr['dims'][0]
            a = np.frombuffer(gzip.open(os.path.join(REPO, 'ssb/ct', f['file'])).read(), np.uint8).reshape(nz, ny, nx).astype(np.float32)
            for ax in range(3):                                   # the 1 mm grid onto the 0.5 mm one: exact trilinear, every second centre
                n = a.shape[ax]
                lo = np.take(a, range(n - 1), axis=ax); hi = np.take(a, range(1, n), axis=ax)
                mid = (lo + hi) / 2
                shape = list(a.shape); shape[ax] = 2 * n - 1
                out = np.empty(shape, np.float32)
                sl = [slice(None)] * 3
                sl[ax] = slice(0, None, 2); out[tuple(sl)] = a
                sl[ax] = slice(1, None, 2); out[tuple(sl)] = mid
                a = out
            assert a.shape == self.g.shape, (a.shape, self.g.shape)
            mm = a * ct_hdr['scale']
            self.guard_fields[fid] = mm
            ok &= mm >= margin - 1e-6
        for lid in spec.get('labels', []):
            m = np.isin(self.lab, self.label_ids(lid))
            d = ndi.distance_transform_edt(~m, sampling=self.step)
            self.guard_fields[lid] = d
            ok &= d >= margin - 1e-6
        self.guard_ok = ok


# ---------------------------------------------------------------- one working state
class State:
    def __init__(self, base):
        self.base = base
        self.ct = base.ct.copy()
        self.lab = base.lab.copy()
        self.owner = np.zeros(base.g.shape, np.uint8)           # 1 + the unit's number in the data file's order; MUCOSA for the mucosal state
        self.mucosa = None                                      # 'decongested' | 'congested' | None: the cut name of a wall only the mucosal state changed

    def copy(self):
        s = State.__new__(State)
        s.base, s.ct, s.lab, s.owner, s.mucosa = self.base, self.ct.copy(), self.lab.copy(), self.owner.copy(), self.mucosa
        return s


def crop_of(box, pad, shape):
    return tuple(slice(max(0, b.start - pad), min(n, b.stop + pad)) for b, n in zip(box, shape))


def nearest_label(air, lab, sampling):
    """Label of the nearest True voxel of `air` for every voxel of the (crop) array: (labels, distance)."""
    d, idx = ndi.distance_transform_edt(~air, sampling=sampling, return_indices=True)
    return lab[idx[0], idx[1], idx[2]], d


def apply_unit(st, name, spec, data, uno, stats):
    """Apply one unit to the working state in place (right side or midline, then the mirror). Returns the voxel
    count the unit carved on its own side, and fills `stats`."""
    b = st.base
    side = name.split('@')[0].rsplit('.', 1)[1]
    assert side in ('R', 'M'), name
    step = b.step
    box = b.box(spec, side)
    keep_spec = data['keep'][spec['keep']] if spec.get('keep') else []
    keep_ids = set()
    for k in list(keep_spec) + list(spec.get('keepAlso', [])):
        keep_ids |= set(b.label_ids(k))
    for k in spec.get('keepExcept', []):
        keep_ids -= set(b.label_ids(k))
    level = data['air']['level']; fill = data['air']['fill']
    ops = spec['op'].split('+')
    total = 0
    rejected = 0
    candidates = 0
    carved = np.zeros(b.g.shape, bool)
    for op in ops:
        sumMm = spec.get('sumMm', 0.0)
        close_r = int(round(spec['closeMm'] / step)) if 'closeMm' in spec else 0
        pad = int(np.ceil(max(sumMm, spec.get('nearAirMm', 0.0)) / step)) + 2
        if op == 'exenterate':
            pad = 2 * close_r + 3
        crop = crop_of(box, pad, b.g.shape)
        full_box = np.zeros(b.g.shape, bool); full_box[box] = True
        inbox = full_box[crop]
        lab, ct = st.lab[crop], st.ct[crop]
        if op == 'window':
            a_ids, b_ids = b.ids(spec['a'], side), b.ids(spec['b'], side)
            A, B = np.isin(lab, a_ids), np.isin(lab, b_ids)
            da = ndi.distance_transform_edt(~A, sampling=step); db = ndi.distance_transform_edt(~B, sampling=step)
            cand = (da + db <= sumMm + 1e-9)
            for sid, mm in (spec.get('shell') or {}).items():
                dist = ndi.distance_transform_edt(~np.isin(lab, b.ids([sid], side)), sampling=step)
                cand &= dist > mm + 1e-9
            own = A | B
        elif op == 'exenterate':
            G = np.isin(lab, b.ids(spec['group'], side))
            dil = ndi.distance_transform_edt(~G) <= close_r + 1e-9
            cand = ndi.distance_transform_edt(dil) > close_r + 1e-9
            cand &= dil                                           # the closing: inside the dilation and farther than r from outside it
            cand &= ~G
            own = G
        elif op == 'region':
            labels = spec.get('labels')
            cand = np.ones(lab.shape, bool) if labels is None else np.isin(lab, b.ids(labels, side))
            if spec.get('nearAir'):
                air = np.isin(lab, b.ids(spec['nearAir'], side))
                cand &= ndi.distance_transform_edt(~air, sampling=step) <= spec['nearAirMm'] + 1e-9
            own = np.isin(lab, b.ids(spec['into'], side))
        else:
            raise ValueError('unknown op ' + op)
        cand &= inbox & (ct >= level)
        cand &= ~np.isin(lab, list(keep_ids)) if keep_ids else True
        candidates += int(cand.sum())
        ok = cand & b.guard_ok[crop]
        rejected += int(cand.sum() - ok.sum())
        cand = ok
        if not cand.any():
            continue
        # the fill label: the nearest voxel of the unit's own air (within NEAREST_PAD_MM of the box, else the whole crop)
        sub = np.argwhere(cand)
        lo, hi = sub.min(0), sub.max(0) + 1
        fp = int(np.ceil(NEAREST_PAD_MM / step))
        fc = tuple(slice(max(0, l - fp), min(n, h + fp)) for l, h, n in zip(lo, hi, cand.shape))
        newlab, dist = nearest_label(own[fc], lab[fc], step)
        assert own[fc].any(), name + ': no air of its own near the carve'
        if spec.get('split') == 'side':
            Rg = b.g.r[crop[2]][None, None, :][..., fc[2]]
            into = b.ids(spec['into'], side)
            assert len(into) == 2
            newlab = np.where(np.broadcast_to(Rg, newlab.shape) >= 0, into[0], into[1]).astype(np.uint16)
        pos = np.argwhere(cand[fc]) + np.array([s.start for s in fc])
        kk, jj, ii = pos[:, 0], pos[:, 1], pos[:, 2]
        newl = newlab[kk - fc[0].start, jj - fc[1].start, ii - fc[2].start]
        gk, gj, gi = kk + crop[0].start, jj + crop[1].start, ii + crop[2].start
        st.ct[gk, gj, gi] = fill
        st.lab[gk, gj, gi] = newl
        st.owner[gk, gj, gi] = uno
        carved[gk, gj, gi] = True
        total += len(gk)
    stats['voxels'] = int(carved.sum())
    stats['candidates'], stats['rejected'] = candidates, rejected
    # guard minima of what was carved, per field, on the unit's own side
    if carved.any():
        stats['minima'] = {f: float(v[carved].min()) for f, v in b.guard_fields.items()}
    else:
        stats['minima'] = {}
    # the mirror: a right unit's carve at r > 0 reflected onto r < 0
    stats['mirrorRejected'] = 0
    if side == 'R':
        k, j, i = np.nonzero(carved)
        sel = i > b.mid
        k, j, i = k[sel], j[sel], i[sel]
        mi = 2 * b.mid - i
        keep_here = b.guard_ok[k, j, mi] & (b.ct[k, j, mi] >= level)
        if keep_ids:
            keep_here &= ~np.isin(b.lab[k, j, mi], list(keep_ids))
        stats['mirrorRejected'] = int((~keep_here).sum())
        k, j, i, mi = k[keep_here], j[keep_here], i[keep_here], mi[keep_here]
        st.ct[k, j, mi] = fill
        st.lab[k, j, mi] = b.mirror_label[st.lab[k, j, i]]
        st.owner[k, j, mi] = uno
        stats['mirrored'] = int(len(k))
    return stats['voxels']


# ---------------------------------------------------------------- states
def unit_list(data, procs, corridor_before=None):
    """Ordered, de-duplicated unit names."""
    out = []
    for u in procs:
        if u not in out:
            out.append(u)
    return out


def chain(data, proc, seen=None):
    """The units of a procedure's entry chain, complete procedures in order."""
    out = []
    for e in data['procedures'][proc]['entry']:
        out += chain(data, e) + steps_units(data, e, None)
    return out


def steps_units(data, proc, upto):
    steps = data['procedures'][proc]['steps']
    out = []
    for s in sorted(steps, key=int):
        if upto is not None and int(s) > upto:
            break
        out += steps[s]
    return out


def enumerate_states(data):
    """-> (states {key: {'units': [...], 'usedBy': [...]}}, procedures {p: {'entry': key|None, 'steps': {step: key}}},
    corridors {c: {...positions...}}). `sides` filtering: only .R and .M units exist in the data."""
    states, procedures, corridors = {}, {}, {}

    def reg(units, used):
        units = unit_list(data, units)
        for u in units:
            assert u.rsplit('@', 1)[0].rsplit('.', 1)[1] in ('R', 'M'), 'only .R and .M units are written: ' + u
        key = hashlib.sha256('\n'.join(units).encode()).hexdigest()[:10] if units else None
        if key:
            s = states.setdefault(key, {'units': units, 'usedBy': []})
            if used not in s['usedBy']:
                s['usedBy'].append(used)
        return key

    for p, pd in data['procedures'].items():
        base = chain(data, p)
        entry = reg(base, p + '#entry') if base else None
        if entry:
            states[entry]['usedBy'].remove(p + '#entry')
        procedures[p] = {'entry': entry, 'steps': {}}
        for s in sorted(pd['steps'], key=int):
            procedures[p]['steps'][s] = reg(base + steps_units(data, p, int(s)), '%s#%s' % (p, s))
    for c, cd in data['corridors'].items():
        positions = []
        done = []
        for p in cd['procedures']:
            for s in sorted(data['procedures'][p]['steps'], key=int):
                key = reg(done + steps_units(data, p, int(s)), '%s:%s#%s' % (c, p, s))
                positions.append({'procedure': p, 'step': s, 'state': key})
            done += steps_units(data, p, None)
        corridors[c] = {k: v for k, v in cd.items() if k != 'procedures'}
        corridors[c]['procedures'] = cd['procedures']
        corridors[c]['positions'] = positions
    return states, procedures, corridors


def compute_states(base, data, states, root=None):
    """DFS over the prefix trie of the states' unit lists; the working copy is cloned only at a branch."""
    order = {n: i + 1 for i, n in enumerate(data['units'])}
    trie = {}
    for key, s in states.items():
        node = trie
        for u in s['units']:
            node = node.setdefault(u, {})
        node['\0'] = key
    results, unit_stats = {}, []

    def walk(node, st, prefix):
        kids = [(u, c) for u, c in node.items() if u != '\0']
        if '\0' in node:
            results[node['\0']] = st if not kids else st.copy()
        for n, (u, child) in enumerate(kids):
            cur = st.copy() if n < len(kids) - 1 or '\0' in node and False else st
            if n < len(kids) - 1:
                cur = st.copy()
            t0 = time.time()
            stats = {'unit': u, 'after': list(prefix)}
            apply_unit(cur, u, data['units'][u], data, order[u], stats)
            stats['seconds'] = round(time.time() - t0, 1)
            unit_stats.append(stats)
            say('  %-46s after %-2d units: %6d voxels (candidates %d, guard rejected %d, mirror rejected %d) %.1fs'
                % (u, len(prefix), stats['voxels'], stats['candidates'], stats['rejected'], stats['mirrorRejected'], stats['seconds']))
            walk(child, cur, prefix + [u])
    walk(trie, root or State(base), [])
    return results, unit_stats


# ---------------------------------------------------------------- outputs
def write_patch(path, base, st, key, units, fill, extra=None):
    changed = (st.lab != base.lab) | (st.ct != base.ct)
    newlab = np.where(changed, st.lab, 0).astype(np.uint16)
    mid = base.mid
    parts = (('R', slice(mid + 1, None)), ('L', slice(0, mid)), ('M', slice(mid, mid + 1)))
    boxes, blobs = [], []
    for side, isl in parts:
        sub = np.zeros_like(changed); sub[:, :, isl] = changed[:, :, isl]
        if not sub.any():
            continue
        k, j, i = np.nonzero(sub)
        lo, hi = (int(i.min()), int(j.min()), int(k.min())), (int(i.max()) + 1, int(j.max()) + 1, int(k.max()) + 1)
        arr = np.where(sub, newlab, 0)[lo[2]:hi[2], lo[1]:hi[1], lo[0]:hi[0]]
        boxes.append({'side': side, 'ijk0': list(lo), 'dims': [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]]})
        blobs.append(np.ascontiguousarray(arr).astype('<u2').tobytes())
    head = {'version': 1, 'base': base.hash, 'state': key, 'units': units, 'ctFill': fill, 'boxes': boxes}
    head.update(extra or {})
    hdr = json.dumps(head, separators=(',', ':')).encode()
    raw = struct.pack('<I', len(hdr)) + hdr + b''.join(blobs)
    with gzip.GzipFile(path, 'wb', compresslevel=9, mtime=0) as fh:
        fh.write(raw)
    return int(changed.sum()), os.path.getsize(path), changed


ERECTILE_WALLS = ('s.inferior-turbinate', 's.middle-turbinate', 's.nasal-septum')


def wall_nodes(base):
    """Wall label index -> node name, for the walls pack."""
    walls = set(M.PACKS['walls'])
    return {idx: n for n, idx in base.index.items() if n.rsplit('.', 1)[0] in walls and n.rsplit('.', 1)[0] != 's.orbit'}


def write_lining(base, st, key, data, with_lining):
    """The state's lining pack with its remnants: (file, bytes, triangles, hides, remnants)."""
    owner_cut = {}
    names = list(data['units'])
    walls = wall_nodes(base)
    hides, remnants, items = [], {}, []
    rem_tris = 0
    for idx, name in sorted(walls.items(), key=lambda x: x[1]):
        before, after = int((base.lab == idx).sum()), int((st.lab == idx).sum())
        diff = (base.lab == idx) != (st.lab == idx)
        if not diff.any():
            continue
        cid = name.rsplit('.', 1)[0]
        if after < MIN_REMNANT:
            hides.append(name)
            continue
        vals = st.owner[diff]
        units_only = vals[vals != MUCOSA]
        cut = names[int(units_only.max()) - 1].split('@')[1] if units_only.size else st.mucosa
        scale = ERECTILE_REMNANT if cid in ERECTILE_WALLS else 1.0
        budget = max(300, int(round(M.WALL_BUDGET.get(cid, 2000) * min(1.0, after / before) * scale)))
        v, f, n = M.mesh_node(cid, st.lab == idx, base.hdr['affine'], budget)
        rn = '%s@%s' % (name, cut)
        items.append((rn, v, f, n))
        remnants[name] = rn
        rem_tris += len(f)
    items, fins, rebuilt = M.clean_lining(items)                 # the remnants too: a fin cancels a vertex normal in any area-weighted mesh
    rep = {}
    if with_lining:
        lin, rep = L.build_lining(st.lab, base.table, base.hdr['affine'], base.step, max(8000, STATE_BUDGET - rem_tris))
        lin, f2, r2 = M.clean_lining(lin)
        rep.update({'finFaces': fins + f2, 'normalsRebuilt': rebuilt + r2})
        items = lin + items
    path = os.path.join(REPO, 'ssb/models/lining-%s.glb.gz' % key)
    raw, gz = M.write_glb(path, items) if with_lining else (0, 0)
    return {'file': os.path.basename(path), 'bytes': gz, 'bytes_uncompressed': raw,
            'triangles': int(sum(len(f) for _, _, f, _ in items)), 'remnantTriangles': rem_tris,
            'hides': hides, 'remnants': remnants, 'report': rep,
            'nodes': {k: {'triangles': int(len(f)), 'vertices': int(len(v))} for k, v, f, _ in items}}


def antrostomy_window(base, data, results, states):
    """The sagittal extent of s.posterior-fontanelle.R@antrostomy after the uncinectomy: the medial-wall voxels it
    carves, and the longest A and S spans of that carve (mm)."""
    name = 's.posterior-fontanelle.R@antrostomy'
    for key, s in states.items():
        if s['units'] == ['s.uncinate-process.R@uncinectomy', name]:
            st = results[key]
            m = (st.owner == list(data['units']).index(name) + 1) & (base.g.r[None, None, :] > 0)
            medial = m & (base.lab == base.index['s.maxillary-medial-wall.R'])
            out = {}
            for tag, mask in (('carved', m), ('medialWall', medial)):
                if not mask.any():
                    out[tag] = {'voxels': 0}
                    continue
                k, j, i = np.nonzero(mask)
                out[tag] = {'voxels': int(mask.sum()), 'A': float((j.max() - j.min() + 1) * base.step),
                            'S': float((k.max() - k.min() + 1) * base.step), 'R': float((i.max() - i.min() + 1) * base.step)}
            return out
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scanned', action='store_true', help='development: build the states on the as-scanned mucosa (the index is then not for commit)')
    ap.add_argument('--no-lining', action='store_true', help='development: skip the lining packs (patches and index only; the index is then not for commit)')
    args = ap.parse_args()
    t0 = time.time()
    data = json.load(open(DISSECTION))
    base = Base()
    base.build_guard(data['guard'])
    say('base %s: %s voxels, mid i=%d' % (base.hash, 'x'.join(str(n) for n in base.g.shape), base.mid))
    states, procedures, corridors = enumerate_states(data)
    say('%d states' % len(states))
    # the mucosal state is the base of every dissection state: procedure mode plays on the decongested mucosa (docs/ssb.md 5.9)
    import mucosa as MU
    rec = MU.load_record()
    root = None
    if 'decongested' in rec and not args.scanned:
        assert rec['base'] == base.hash, 'ssb/states/mucosa.json is for another base: rerun mucosa.py'
        root = State(base)
        say('mucosa: decongested, d = %.2f mm, %d voxels' % (rec['decongested']['d'], MU.apply_decongested(root, base, rec['decongested']['d'])))
        root.mucosa = 'decongested'
    results, unit_stats = compute_states(base, data, states, root)
    os.makedirs(OUT, exist_ok=True)

    # per unit against `measured`
    say('\nunit                                           voxels   measured   delta')
    worst = 0.0
    seen = {}
    for s in unit_stats:
        seen.setdefault(s['unit'], []).append(s)
    unit_report = {}
    for u in data['units']:
        meas = data['units'][u]['measured']['voxels']
        meas = meas if isinstance(meas, list) else [meas]
        got = sorted({s['voxels'] for s in seen.get(u, []) if s['voxels']})
        unit_report[u] = {'voxels': got, 'measured': meas}
        for v in got:
            best = min(meas, key=lambda m: abs(v - m))
            worst = max(worst, abs(v - best) / best)
        say('%-46s %-12s %-12s %s' % (u, got, meas, ['%+.1f%%' % (100 * (v - min(meas, key=lambda m: abs(v - m))) / min(meas, key=lambda m: abs(v - m))) for v in got]))
    say('worst unit deviation: %.1f %%' % (100 * worst))

    index_states = {}
    total_lining = 0
    say('\nstate        units  carved   patch B  lining B   tris  guard min R/L (ICA, optic, AEA, orbit)  keep violations')
    keep_viol_total = 0
    for key in sorted(states, key=lambda k: (len(states[k]['units']), k)):
        st = results[key]
        s = states[key]
        n, pbytes, changed = write_patch(os.path.join(OUT, key + '.ssbp.gz'), base, st, key, s['units'], data['air']['fill'], {'mucosa': 'dec'} if root else None)
        assert pbytes <= PATCH_BYTES, '%s: patch %d bytes' % (key, pbytes)
        # keep: no voxel a unit carved had a label its keep list protects (on either side)
        viol = 0
        for uno, u in enumerate(data['units'], 1):
            sp = data['units'][u]
            ks = set()
            for k in list(data['keep'][sp['keep']] if sp.get('keep') else []) + list(sp.get('keepAlso', [])):
                ks |= set(base.label_ids(k))
            for k in sp.get('keepExcept', []):
                ks -= set(base.label_ids(k))
            if ks:
                viol += int((changed & (st.owner == uno) & np.isin(base.lab, list(ks))).sum())
        keep_viol_total += viol
        minima = {}
        for side, isl in (('R', base.g.r > 0), ('L', base.g.r < 0)):
            m = changed & isl[None, None, :]
            minima[side] = {f: (round(float(v[m].min()), 2) if m.any() else None) for f, v in base.guard_fields.items()}
        lin = write_lining(base, st, key, data, not args.no_lining)
        total_lining += lin['bytes']
        index_states[key] = {'units': s['units'], 'usedBy': s['usedBy'], 'mucosa': 'dec' if root else 'scan', 'patch': key + '.ssbp.gz', 'lining': lin['file'],
                             'hides': lin['hides'], 'remnants': lin['remnants'],
                             'measured': {'carvedVoxels': n, 'patchBytes': pbytes, 'liningBytes': lin['bytes'],
                                          'liningTriangles': lin['triangles'], 'remnantTriangles': lin['remnantTriangles'],
                                          'guardMinimaMm': minima, 'keepViolations': viol,
                                          'symmetry': None}}
        say('%s %5d %7d %9d %9d %6d  R %s L %s  %d' % (key, len(s['units']), n, pbytes, lin['bytes'], lin['triangles'],
                                                       list(minima['R'].values()), list(minima['L'].values()), viol))
        assert lin['bytes'] <= STATE_LINING_BYTES, '%s: state lining %d bytes breaks its %d budget' % (key, lin['bytes'], STATE_LINING_BYTES)
    assert total_lining <= ALL_STATES_BYTES, 'state linings total %d bytes' % total_lining

    # the post-mirror guard: voxels a mirror would have carved that the guard rejected, against what was carved
    st_post = {}
    for key, s in states.items():
        rej = 0; car = 0
        for i, u in enumerate(s['units']):
            hit = next(x for x in unit_stats if x['unit'] == u and x['after'] == s['units'][:i])
            rej += hit['mirrorRejected']; car += hit['voxels'] + hit.get('mirrored', 0)
        st_post[key] = (rej, car)
        index_states[key]['measured']['postMirrorGuard'] = {'rejected': rej, 'carved': car, 'share': round(rej / car, 6) if car else 0.0}
        # symmetry: the carved volume's mirror agreement, midline units aside
        st = results[key]
        a = st.lab[:, :, base.mid + 1:]
        b_ = base.mirror_label[st.lab[:, :, :base.mid][:, :, ::-1]]
        index_states[key]['measured']['symmetry'] = {'asymmetricVoxels': int((a != b_).sum()), 'of': int(a.size)}
    say('\npost-mirror guard (rejected mirror voxels / carved): ' + ', '.join('%s %d/%d' % (k, *v) for k, v in sorted(st_post.items())))

    aw = antrostomy_window(base, data, results, states)
    say('antrostomy window (s.posterior-fontanelle.R@antrostomy after the uncinectomy): ' + json.dumps(aw))

    mucosal = {}
    for kind, mode in (('decongested', 'dec'), ('congested', 'cong')):
        e = rec.get(kind)
        if not e:
            continue
        index_states[e['key']] = {'units': [], 'usedBy': ['mu=' + mode], 'mucosa': mode, 'patch': e['patch'], 'lining': e['lining'], 'hides': e['hides'],
                                  'remnants': e['remnants'], 'measured': e['measured']}
        mucosal[mode] = {'state': e['key'], 'd': e['d'], 'ratio': e['ratio'], 'target': e['target'], 'erectileLabels': e['erectileLabels'], 'ctFill': e['ctFill']}
        total_lining += e['measured']['liningBytes']
    assert total_lining <= ALL_STATES_BYTES, 'state linings total %d bytes with the mucosal ones' % total_lining
    doc = {'version': 1, 'base': base.hash, 'ctFill': data['air']['fill'], 'mucosa': mucosal, 'states': index_states,
           'procedures': procedures, 'corridors': corridors,
           'units': {u: {'voxels': r['voxels'], 'measured': r['measured']} for u, r in unit_report.items()},
           'antrostomyWindow': aw,
           'note': 'tools/ssb-pipeline/uw/dissect.py output (docs/ssb.md 5.8). usedBy: "<procedure>#<step>" or "<corridor>:<procedure>#<step>". '
                   'remnants maps a wall node to the remnant node that replaces it in the state lining pack; hides lists wall nodes the state removes entirely. '
                   'The state lining packs are not listed in packs.json: they are loaded on demand from "lining".'}
    with open(os.path.join(OUT, 'index.json'), 'w') as fh:
        json.dump(doc, fh, indent=1)
        fh.write('\n')
    write_results('dissect', {'states': len(states), 'worstUnitDeviation': round(worst, 4), 'liningBytes': total_lining,
                              'keepViolations': keep_viol_total, 'antrostomy': aw})
    say('\n%d states, state linings %d bytes in all, keep violations %d, worst unit deviation %.1f %%, %.0fs'
        % (len(states), total_lining, keep_viol_total, 100 * worst, time.time() - t0))


if __name__ == '__main__':
    main()
