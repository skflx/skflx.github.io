"""Endoscope station poses on the dissected states (WP P3): `byState` in ssb/geometry/stations.json, and the two
2.7 mm poses on the intact specimen.

Why a committed script. E5's poses were solved by a scratch script; after a regeneration of the states (dissect.py,
a new base, DC1's decongested volume) the poses must be re-checkable and re-posable by one command.

Rule (E5's, from the `rule` string of stations.json): a pose is free under js/ssb/scope.js shaftClearance (the shaft's
radius, the E3b midline rule, lm.choanal-arch.M), its tip lies in an airway label of THAT state's volume (not
s.nasal-vestibule: mucosa, not a space the scope sits in), and its target is inside the field. This file ports
scope.js (shaft_dir, frame_of, clearance) and checks it against the committed poses (`check`).

Method. Each row of TABLE (P3's table in docs/ssb-roadmap.md: station, state reached at, P1's prototype pose,
lens, target, what should fill the image) is solved on the state's volume (the base with its patch applied):
  1. the prototype pose is tested first; if it is free, the tip is in air and the target is within OFF_MAX of the
     view axis it is kept (its numbers are re-measured here);
  2. otherwise (or with --search) a grid over depth, yaw and pitch (2-unit steps) keeps the poses that are free with
     the tip in air, rolls (15 degree steps) keep the target in view, a stride-thinned shortlist is ray-cast, and the
     best five are refined on the scope's own grid (depth 0.5, yaw and pitch 1). Rank: the share of the 161 rays that first hit a wanted label or pass
     through a wanted air label, then the shorter mucosal contact.
A station that cannot be posed is reported with its best candidate's numbers, never forced.
Left = right mirrored (the same depth, yaw, pitch, lens; roll -> 360 - roll); the mirrored pose is CHECKED on the same
state's volume, not assumed. A midline station is posed from the right nostril; a station posed through the
contralateral nostril is keyed by its target's side.

    python3 tools/ssb-pipeline/uw/stations.py check            # re-test every committed pose, change nothing
    python3 tools/ssb-pipeline/uw/stations.py solve            # print the table, write nothing
    python3 tools/ssb-pipeline/uw/stations.py write [--search] # rewrite byState and the 2.7 mm poses in stations.json
"""
import gzip, json, math, os, struct, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import meshes as M  # noqa: E402
from walls import read_volume  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
STATIONS = os.path.join(REPO, 'ssb/geometry/stations.json')
INDEX = os.path.join(REPO, 'ssb/states/index.json')

# scope.js constants
BONE, SOFT, STEP, START = 150, 78, 0.5, 2.0
RADII = {'4': 2.0, '2.7': 1.35}
FOV = 70.0
OFF_MAX = 30.0          # the search's bound on the target's angle from the view axis; the page test allows FOV / 2
NRAYS = 161
RAY_MM = 70.0


def say(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------------------------------------- the volumes
class Vol:
    """A CT display array and its label array with scope.js's sampling: trilinear display (0 outside the volume),
    nearest-voxel labels (0 outside)."""

    def __init__(self, hdr, ct, lab, names):
        self.ct, self.lab = ct, lab
        self.names = names                                  # label index -> name
        self.o = np.array([hdr['affine'][0][3], hdr['affine'][1][3], hdr['affine'][2][3]], float)
        self.step = float(hdr['spacing'][0])
        self.dims = hdr['dims']
        self.ctf = ct.astype(np.float32)

    def ijk(self, p):
        p = np.asarray(p, float)
        return ((p - self.o) / self.step)

    def level(self, p):
        v = self.ijk(p).reshape(-1, 3)
        out = ndi.map_coordinates(self.ctf, [v[:, 2], v[:, 1], v[:, 0]], order=1, mode='constant', cval=0.0)
        return out.reshape(np.asarray(p).shape[:-1])

    def label(self, p):
        v = np.floor(self.ijk(p).reshape(-1, 3) + 0.5).astype(int)
        nx, ny, nz = self.dims
        ok = (v[:, 0] >= 0) & (v[:, 0] < nx) & (v[:, 1] >= 0) & (v[:, 1] < ny) & (v[:, 2] >= 0) & (v[:, 2] < nz)
        out = np.zeros(len(v), np.uint16)
        out[ok] = self.lab[v[ok, 2], v[ok, 1], v[ok, 0]]
        return out.reshape(np.asarray(p).shape[:-1])


def load_base():
    hdr, ct, lab, table = read_volume()
    names = {int(k): v for k, v in table.items()}
    return hdr, Vol(hdr, ct, lab, names)


def read_patch(path):
    raw = gzip.open(path).read()
    n = struct.unpack('<I', raw[:4])[0]
    head = json.loads(raw[4:4 + n])
    pos = 4 + n
    boxes = []
    for b in head['boxes']:
        i0, j0, k0 = b['ijk0']
        nx, ny, nz = b['dims']
        arr = np.frombuffer(raw[pos:pos + nx * ny * nz * 2], '<u2').reshape(nz, ny, nx)
        pos += nx * ny * nz * 2
        boxes.append((i0, j0, k0, arr))
    return head, boxes


def state_vol(hdr, base, key):
    head, boxes = read_patch(os.path.join(REPO, 'ssb/states', f'{key}.ssbp.gz'))
    ct, lab = base.ct.copy(), base.lab.copy()
    for i0, j0, k0, arr in boxes:
        nz, ny, nx = arr.shape
        sl = (slice(k0, k0 + nz), slice(j0, j0 + ny), slice(i0, i0 + nx))
        m = arr != 0
        ct[sl][m] = head['ctFill']
        lab[sl][m] = arr[m]
    return Vol(hdr, ct, lab, base.names)


def airway_ids(names):
    """The labels a scope tip may lie in: every air-space label (meshes.AIR_PACKED), except the vestibule."""
    return {i for i, n in names.items() if n.rsplit('.', 1)[0] in M.AIR_PACKED and n.rsplit('.', 1)[0] != 's.nasal-vestibule'}


# ---------------------------------------------------------------------------------------------- scope.js, ported
def unit(a):
    return a / np.maximum(np.linalg.norm(a, axis=-1, keepdims=True), 1e-12)


def perp(a, n):
    return unit(a - (a * n).sum(-1, keepdims=True) * n)


def shaft_dir(side, yaw, pitch):
    y, p = np.radians(yaw), np.radians(pitch)
    sg = -1.0 if side == 'L' else 1.0
    return np.stack([np.cos(p) * np.sin(y) * sg, -np.cos(p) * np.cos(y), np.sin(p)], -1)


def frame_of(side, yaw, pitch, roll, lens):
    """scope.js frameOf: the view v and the image's up and right."""
    d = shaft_dir(side, yaw, pitch)
    S = np.broadcast_to(np.array([0.0, 0, 1]), d.shape)
    A = np.broadcast_to(np.array([0.0, 1, 0]), d.shape)
    vertical = np.abs((d * S).sum(-1, keepdims=True)) > 0.99
    u0 = perp(np.where(vertical, A, S), d)
    w = np.cross(d, u0)
    r, l = np.radians(roll)[..., None], np.radians(lens)[..., None]
    o = np.cos(r) * u0 + np.sin(r) * w
    v = unit(np.cos(l) * d + np.sin(l) * o)
    n = np.cross(d, o)
    up = unit((np.cos(l) * o - np.sin(l) * d) * np.cos(r) - n * np.sin(r))
    right = unit(np.cross(v, up))
    return d, v, up, right


def clearance(vol, fulcrum, side, depth, yaw, pitch, radius, arch):
    """scope.js shaftClearance over arrays of poses: (free, contactMm). Sampled every 0.5 mm from START to the depth on
    the axis and a ring of four points; blocked by display >= BONE or by the midline rule."""
    depth, yaw, pitch = (np.atleast_1d(np.asarray(x, float)) for x in (depth, yaw, pitch))
    n = len(depth)
    d = shaft_dir(side, yaw, pitch)
    S = np.broadcast_to(np.array([0.0, 0, 1]), d.shape)
    A = np.broadcast_to(np.array([0.0, 1, 0]), d.shape)
    vertical = np.abs((d * S).sum(-1, keepdims=True)) > 0.99
    e1 = perp(np.where(vertical, A, S), d)
    e2 = np.cross(d, e1)
    ring = [e1 * radius, e2 * radius, -e1 * radius, -e2 * radius]
    sg = -1.0 if side == 'L' else 1.0
    F = np.asarray(fulcrum, float)
    free = np.ones(n, bool)
    contact = np.zeros(n)
    top = int(np.floor((depth.max() - START) / STEP + 1e-9)) + 1
    for k in range(top + 1):
        at = START + k * STEP
        live = depth >= at - 1e-9
        if not live.any():
            break
        c = F + d * at
        axis = vol.level(c)
        bone = axis >= BONE
        crossed = (sg * c[:, 0] < 0) & ~((c[:, 1] < arch[0]) & (c[:, 2] < arch[1]))
        for e in ring:
            q = c + e
            bone |= vol.level(q) >= BONE
            crossed |= (sg * q[:, 0] < 0) & ~((q[:, 1] < arch[0]) & (q[:, 2] < arch[1]))
        free &= ~((bone | crossed) & live)
        contact += np.where(live & (axis >= SOFT), STEP, 0.0)
    # a depth between two grid steps: its own point (scope.js' final sample)
    off = np.abs(((depth - START) / STEP) - np.round((depth - START) / STEP)) > 1e-9
    if off.any():
        idx = np.nonzero(off)[0]
        c = F + d[idx] * depth[idx, None]
        blocked = vol.level(c) >= BONE
        crossed = (sg * c[:, 0] < 0) & ~((c[:, 1] < arch[0]) & (c[:, 2] < arch[1]))
        for e in ring:
            q = c + e[idx]
            blocked |= vol.level(q) >= BONE
            crossed |= (sg * q[:, 0] < 0) & ~((q[:, 1] < arch[0]) & (q[:, 2] < arch[1]))
        free[idx] &= ~(blocked | crossed)
    return free, contact


def tip_of(fulcrum, side, depth, yaw, pitch):
    return np.asarray(fulcrum, float) + shaft_dir(side, np.asarray(yaw, float), np.asarray(pitch, float)) * np.asarray(depth, float)[..., None]


def off_axis(v, tip, target):
    t = unit(np.asarray(target, float) - tip)
    return np.degrees(np.arccos(np.clip((v * t).sum(-1), -1, 1)))


# ---------------------------------------------------------------------------------------------- the image
def fibonacci_dirs(v, up, right):
    """NRAYS directions evenly over the FOV disk about the view v (a Fibonacci disk: deterministic)."""
    i = np.arange(NRAYS)
    theta = np.radians(FOV / 2) * np.sqrt((i + 0.5) / NRAYS)
    phi = i * 2.399963229728653
    return unit(v * np.cos(theta)[:, None] + (right * np.cos(phi)[:, None] + up * np.sin(phi)[:, None]) * np.sin(theta)[:, None])


PROMINENCE_S = 24.0     # a sphenoid lateral wall hit above this S is the carotid prominence (WP P4, `prominence` rows)


def cast(vol, tip, v, up, right, air, prominence=False):
    """What a cone of NRAYS rays sees: ({label name or 'tissue': %}, {air label name: % of rays through it}).
    First hit = the first sample with display >= SOFT; an unlabelled hit takes a labelled wall within 8 mm behind it,
    else 'tissue' (E5's definition). With `prominence`, a hit on s.sphenoid-lateral-wall.* above S = PROMINENCE_S is
    counted as 'carotid-prominence' (the wall's upper part, where the carotid and optic canals bulge into the sinus)."""
    dirs = fibonacci_dirs(v, up, right)
    ts = np.arange(STEP, RAY_MM + 1e-9, STEP)
    pts = tip[None, None, :] + dirs[:, None, :] * ts[None, :, None]
    lev = vol.level(pts)
    lab = vol.label(pts)
    solid = lev >= SOFT
    first = np.where(solid.any(1), solid.argmax(1), -1)
    shares, through = {}, {}
    nm = vol.names
    for r in range(NRAYS):
        f = first[r]
        stop = f if f >= 0 else lab.shape[1]
        for lid in set(lab[r, :stop].tolist()) & air:
            through[nm[lid]] = through.get(nm[lid], 0) + 1
        if f < 0:
            key = 'open'
        else:
            lid = int(lab[r, f])
            if lid == 0:
                ahead = lab[r, f:f + int(8 / STEP)]
                ahead = ahead[(ahead != 0) & ~np.isin(ahead, list(air))]
                lid = int(ahead[0]) if len(ahead) else 0
            key = nm.get(lid, 'tissue') if lid else 'tissue'
            if prominence and key.rsplit('.', 1)[0] == 's.sphenoid-lateral-wall' and tip[2] + dirs[r][2] * ts[f] > PROMINENCE_S:
                key = 'carotid-prominence.' + key.rsplit('.', 1)[1]
        shares[key] = shares.get(key, 0) + 1
    pct = lambda d: {k: int(round(100 * c / NRAYS)) for k, c in sorted(d.items(), key=lambda kv: -kv[1]) if round(100 * c / NRAYS) >= 1}
    return pct(shares), pct(through)


# ---------------------------------------------------------------------------------------------- the rows
# Targets are as P1 used them (docs/ssb-roadmap.md P3, "Targets"): a graph id, or a label's voxel centroid with a
# bound on A / S / R. `side` is the target's side; `via` the nostril when it is not the target's own.
def _bounded(label, **b):
    return {'label': label, **b}


TABLE = [
    # The order is the order of a state's views: the first is what the state opens, where the player lands (WP P4).
    # station, state reached at, prototype pose (depth, yaw, pitch, roll, lens), target, wanted (hit) labels, wanted (air passed)
    dict(id='t.infundibulum-45', at='p.uncinectomy#1', proto=(32, 4, 30, 270, 45), target=_bounded('s.maxillary-medial-wall', a=(-31, -19), s=(18, None)),
         want=['s.maxillary-medial-wall'], air=[]),
    dict(id='t.ethmoid-bulla-0', at='p.uncinectomy#1', proto=(36, 4, 38, 0, 0), target=_bounded('s.ethmoid-bulla'),
         want=['s.ethmoid-bulla', 's.lamina-papyracea', 's.basal-lamella'], air=['s.ethmoid-bulla']),
    dict(id='t.maxillary-antrum-70', at='p.maxillary-antrostomy#1', proto=(30, 4, 28, 240, 70), target=_bounded('s.maxillary-sinus'),
         want=['s.maxillary-medial-wall', 's.maxillary-posterior-wall', 's.orbital-floor'], air=['s.maxillary-sinus']),
    dict(id='t.medial-orbital-floor-30', at='p.maxillary-antrostomy#1', proto=(30, 6, 34, 270, 30), target=_bounded('s.orbital-floor', r=(None, 22)),
         want=['s.orbital-floor', 's.lamina-papyracea'], air=['s.maxillary-sinus']),
    dict(id='t.basal-lamella-0', at='p.anterior-ethmoidectomy#1', proto=(48, 2, 40, 0, 0), target=_bounded('s.basal-lamella', inView=True),
         want=['s.lamina-papyracea', 's.fovea-ethmoidalis', 's.basal-lamella'], air=[]),
    dict(id='t.ethmoid-roof-30', at='p.anterior-ethmoidectomy#4', proto=(44, -2, 44, 15, 30), target=_bounded('s.fovea-ethmoidalis', a=(-40, None)),
         want=['s.lateral-lamella', 's.fovea-ethmoidalis'], air=[]),
    dict(id='t.posterior-ethmoid-roof-0', at='p.posterior-ethmoidectomy#1', proto=(58, 0, 34, 0, 0), target=_bounded('s.fovea-ethmoidalis', a=(None, -40)),
         want=['s.fovea-ethmoidalis', 's.sphenoid-face'], air=[]),
    dict(id='t.optic-canal-0', at='p.transethmoidal-sphenoidotomy#2', proto=(62, 4, 24, 0, 0), target=_bounded('s.sphenoid-lateral-wall', s=(28, None)),
         want=['s.sphenoid-lateral-wall', 's.planum-sphenoidale', 's.sella-turcica'], air=[]),
    dict(id='t.medial-orbital-wall-0', at='p.transethmoidal-sphenoidotomy#2', proto=(38, 4, 38, 0, 0), target=_bounded('s.lamina-papyracea'),
         want=['s.lamina-papyracea', 's.fovea-ethmoidalis', 's.lateral-lamella'], air=[]),
    dict(id='t.frontal-recess-45', at='p.draf-i#1', proto=(34, 2, 42, 0, 45), target={'id': 'lm.frontal-ostium'},
         want=['s.middle-turbinate', 's.lamina-papyracea'], air=['s.agger-nasi-cell', 's.frontal-recess']),
    dict(id='t.frontal-sinus-70', at='p.draf-iia#2', proto=(42, -4, 44, 0, 70), target=_bounded('s.frontal-sinus'),
         want=[], air=['s.frontal-sinus', 's.frontal-recess']),
    # P4 re-poses both sphenoid-face rows for a recognizable posterior wall: target the sella floor, ranked by the share of rays that hit
    # the sella, planum, clivus and carotid prominences together, then by lower mucosal contact (CP-3 finding 3).
    dict(id='t.sphenoid-face-0', at='p.transsellar-approach#2', proto=(62, -2, 24, 0, 0), target={'lm': 'lm.sella-floor-center.M'}, side='M',
         want=['s.sella-turcica', 's.planum-sphenoidale', 's.clivus', 'carotid-prominence'], air=[], prominence=True, both=3, search=True, tipIn=['s.sphenoid-sinus']),
    dict(id='t.sphenoid-face-0', at='p.sphenoidotomy#4', proto=(72, -2, 20, 0, 0), target={'lm': 'lm.sella-floor-center.M'},
         want=['s.sella-turcica', 's.planum-sphenoidale', 's.clivus', 'carotid-prominence'], air=[], prominence=True, search=True, tipIn=['s.sphenoid-sinus']),
    dict(id='t.sphenoid-lateral-recess-45', at='p.transsellar-approach#2', proto=(62, -4, 14, 60, 45), target=_bounded('s.sphenoid-lateral-wall'), side='L', via='R',
         want=['s.sphenoid-lateral-wall', 's.sella-turcica'], air=[]),
    dict(id='t.sella-open-30', at='p.transsellar-approach#4', proto=(74, -2, 20, 60, 30), target={'id': 'lm.sella-floor-center'}, side='M',
         want=['s.sella-turcica', 'tissue'], air=[]),
    dict(id='t.cavernous-sinus-30', at='p.transsellar-approach#4', proto=(68, 2, 16, 300, 30), target=_bounded('s.sphenoid-lateral-wall', s=(24, None), a=(None, -62)),
         want=['s.sphenoid-lateral-wall'], air=[]),
    # P4: the four corridor positions that had no view of their own. The agger uncapped (Draf I step 3), the posterior ethmoid through the
    # perforated basal lamella, the rostrum out and the sphenoid face widened, the clival recess drilled (both the EEA corridor's state and
    # the standalone transclival procedure's).
    dict(id='t.frontal-recess-45', at='p.draf-i#2', proto=(34, 2, 42, 0, 45), target={'id': 'lm.frontal-ostium'},
         want=['s.middle-turbinate', 's.lamina-papyracea'], air=['s.agger-nasi-cell', 's.frontal-recess']),
    dict(id='t.posterior-ethmoid-roof-0', at='p.posterior-ethmoidectomy#0', proto=(58, 0, 34, 0, 0), target=_bounded('s.fovea-ethmoidalis', a=(None, -40)),
         want=['s.fovea-ethmoidalis', 's.sphenoid-face'], air=[]),
    dict(id='t.ser-0', at='p.transsellar-approach#1', proto=(49, -3, 18, 0, 0), target={'id': 'lm.sphenoid-ostium'},
         want=['s.sphenoid-floor', 's.sella-turcica', 's.clivus', 's.sphenoid-lateral-wall'], air=['s.sphenoid-sinus']),
    dict(id='t.clivus-0', at='eea-sellar-clival:p.transclival-approach#2', proto=(68, 2, 16, 0, 0), side='M',
         target={'carvedDiff': ('eea-sellar-clival:p.transclival-approach#2', 'eea-sellar-clival:p.transclival-approach#0')},
         note='centroid of the voxels s.clivus.M@clival-recess carves (the extradural part of the clival opening; the prepontine cistern behind it is intradural and not in the specimen)',
         want=['s.clivus', 's.dorsum-sellae', 'tissue'], air=[], tipIn=['s.sphenoid-sinus']),
    dict(id='t.clivus-0', at='p.transclival-approach#2', proto=(68, 2, 16, 0, 0), side='M',
         target={'carvedDiff': ('p.transclival-approach#2', 'p.transclival-approach#0')},
         note='centroid of the voxels s.clivus.M@clival-recess carves (the extradural part of the clival opening; the prepontine cistern behind it is intradural and not in the specimen)',
         want=['s.clivus', 's.dorsum-sellae', 'tissue'], air=[], tipIn=['s.sphenoid-sinus']),
    dict(id='t.olfactory-cleft-0', at=None, shaft='2.7', proto=(48, -8, 40, 0, 0), target=_bounded('s.cribriform-plate'),
         want=['s.cribriform-plate'], air=[]),
    dict(id='t.inferior-meatus-45', at=None, shaft='2.7', proto=(22, 6, -4, 300, 45), target={'point': (12, -25, 6)},
         want=['s.nasal-floor', 's.inferior-turbinate', 's.maxillary-medial-wall'], air=[]),
]


def mirror(p):
    return (-p[0], p[1], p[2])


class Solver:
    def __init__(self):
        self.hdr, self.base = load_base()
        self.names = self.base.names
        self.ids = {n: i for i, n in self.names.items()}
        self.index = json.load(open(INDEX))
        self.lm = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
        self.arch = (self.lm['lm.choanal-arch.M'][1], self.lm['lm.choanal-arch.M'][2])
        self.vols = {}
        self.air = airway_ids(self.names)
        self.ras = None

    def volume(self, key):
        if key is None:
            return self.base
        if key not in self.vols:
            self.vols[key] = state_vol(self.hdr, self.base, key)
        return self.vols[key]

    def state_key(self, at):
        """`p.<id>#<n>` (the procedure alone) or `<corridor>:p.<id>#<n>` (that position of a corridor) -> a state key."""
        if at is None:
            return None
        cor, _, pos = at.rpartition(':')
        proc, step = pos.split('#')
        if cor:
            for q in self.index['corridors'][cor]['positions']:
                if q['procedure'] == proc and q['step'] == step:
                    return q['state']
            raise SystemExit(f'{at}: not a position of corridor {cor}')
        steps = self.index['procedures'][proc]['steps']
        if step not in steps:
            raise SystemExit(f'{at}: not a step with a state in ssb/states/index.json')
        return steps[step]

    def carved(self, key):
        """The voxels a state's patch carves (a boolean array on the base grid)."""
        m = np.zeros(self.base.lab.shape, bool)
        for i0, j0, k0, arr in read_patch(os.path.join(REPO, 'ssb/states', f'{key}.ssbp.gz'))[1]:
            nz, ny, nx = arr.shape
            m[k0:k0 + nz, j0:j0 + ny, i0:i0 + nx] |= arr != 0
        return m

    def centroid(self, spec, side):
        """The target point of a row for `side` (R, L or M): a graph id's landmark, a label centroid within bounds, or a fixed point."""
        if 'point' in spec:
            p = np.array(spec['point'], float)
            return p if side != 'L' else np.array(mirror(p))
        if 'lm' in spec:                                    # an exact landmark id, whatever the row's side
            return np.array(self.lm[spec['lm']], float)
        if 'carvedDiff' in spec:                            # the centroid of what a state carves beyond an earlier one
            a, b = (self.state_key(x) for x in spec['carvedDiff'])
            k, j, i = np.nonzero(self.carved(a) & ~self.carved(b))
            o = self.base.o
            return np.array([o[0] + i.mean() * 0.5, o[1] + j.mean() * 0.5, o[2] + k.mean() * 0.5])
        if 'id' in spec:
            ident = spec['id'] + ('.M' if side == 'M' else f'.{side}')
            return np.array(self.lm.get(ident) or self.lm[spec['id'] + '.R' if side != 'L' else spec['id'] + '.L'], float)
        sfx = 'M' if side == 'M' else side
        ids = [i for n, i in self.ids.items() if n == f"{spec['label']}.{sfx}"]
        lab = self.base.lab
        m = np.isin(lab, ids)
        k, j, i = np.nonzero(m)
        o = self.base.o
        r, a, s = o[0] + i * 0.5, o[1] + j * 0.5, o[2] + k * 0.5
        keep = np.ones(len(r), bool)
        sg = 1.0 if side != 'L' else -1.0
        for name, arr in (('r', r * sg), ('a', a), ('s', s)):
            lo, hi = spec.get(name, (None, None))
            if lo is not None:
                keep &= arr > lo
            if hi is not None:
                keep &= arr < hi
        return np.array([r[keep].mean(), a[keep].mean(), s[keep].mean()])

    def tip_ids(self, row):
        """The labels the tip may lie in: every airway label, or the row's `tipIn` structures only."""
        if not row.get('tipIn'):
            return self.air
        return {i for i in self.air if self.names[i].rsplit('.', 1)[0] in row['tipIn']}

    def evaluate(self, vol, side, pose, target, shaft, row):
        depth, yaw, pitch, roll, lens = pose
        F = self.lm[f'lm.naris.{side}']
        free, contact = clearance(vol, F, side, [depth], [yaw], [pitch], RADII[shaft], self.arch)
        tip = tip_of(F, side, np.array([depth]), np.array([yaw]), np.array([pitch]))[0]
        lab = int(vol.label(tip[None])[0])
        d, v, up, right = frame_of(side, np.array([yaw], float), np.array([pitch], float), np.array([roll], float), np.array([lens], float))
        off = float(off_axis(v, tip[None], target)[0])
        shares, through = cast(vol, tip, v[0], up[0], right[0], self.air, row.get('prominence', False))
        want = set(row['want']) | set()
        w = sum(c for k, c in shares.items() if k.rsplit('.', 1)[0] in want or k in want)
        a = sum(c for k, c in through.items() if k.rsplit('.', 1)[0] in set(row['air']))
        if row.get('both') and min(shares.get('carotid-prominence.R', 0), shares.get('carotid-prominence.L', 0)) < row['both']:
            w -= 100            # the view must show both prominences (at least `both` rays each): a view without them ranks last
        return dict(free=bool(free[0]), contact=float(contact[0]), tip=tip, tipIn=self.names.get(lab), tipAir=lab in self.tip_ids(row),
                    off=off, shares=shares, through=through, score=max(w, a) / 100.0 if (row['want'] or row['air']) else 0.0)

    def search(self, vol, side, lens, target, shaft, row, log=say):
        """depth/yaw/pitch (2-unit grid), roll (15 degrees): the best free pose with the tip in air and the target within OFF_MAX."""
        F = np.array(self.lm[f'lm.naris.{side}'], float)
        cands = []
        for pitch in range(-44, 45, 2):
            D, Y = np.meshgrid(np.arange(12, 91, 2.0), np.arange(-44, 45, 2.0), indexing='ij')
            D, Y = D.ravel(), Y.ravel()
            P = np.full(len(D), float(pitch))
            tips = tip_of(F, side, D, Y, P)
            labs = vol.label(tips)
            inair = np.isin(labs, list(self.tip_ids(row)))
            if not inair.any():
                continue
            free, _ = clearance(vol, F, side, D[inair], Y[inair], P[inair], RADII[shaft], self.arch)
            for dd, yy in zip(D[inair][free], Y[inair][free]):
                cands.append((dd, yy, float(pitch)))
        log(f'    {len(cands)} free poses with the tip in air')
        if not cands:
            return None
        c = np.array(cands)
        keep = []
        for roll in ([0] if lens == 0 else range(0, 360, 15)):         # a 0 degree lens only turns the image about the view: keep it upright
            _, v, _, _ = frame_of(side, c[:, 1], c[:, 2], np.full(len(c), float(roll)), np.full(len(c), float(lens)))
            off = off_axis(v, tip_of(F, side, c[:, 0], c[:, 1], c[:, 2]), target)
            for idx in np.nonzero(off <= OFF_MAX)[0]:
                keep.append((c[idx, 0], c[idx, 1], c[idx, 2], float(roll), float(off[idx])))
        log(f'    {len(keep)} with the target within {OFF_MAX:.0f} degrees')
        if not keep:
            return None
        keep.sort(key=lambda t: (t[0], t[1], t[2], t[3]))
        stride = max(1, len(keep) // 1500)
        short = keep[::stride]
        scored = []
        for depth, yaw, pitch, roll, _ in short:
            e = self.evaluate(vol, side, (depth, yaw, pitch, roll, lens), target, shaft, row)
            scored.append((-e['score'], e['contact'], (depth, yaw, pitch, roll)))
        scored.sort()
        best = []
        for _, _, (depth, yaw, pitch, roll) in scored[:5]:
            local = None
            for dd in (-1, -0.5, 0, 0.5, 1):
                for yy in (-1, 0, 1):             # yaw and pitch step 1 degree in scope.js RANGES (depth 0.5): a pose must be whole
                    for pp in (-1, 0, 1):
                        pose = (depth + dd, yaw + yy, pitch + pp, roll, lens)
                        if not (0 <= pose[0] <= 120 and -45 <= pose[1] <= 45 and -45 <= pose[2] <= 45):
                            continue
                        e = self.evaluate(vol, side, pose, target, shaft, row)
                        if not (e['free'] and e['tipAir'] and e['off'] <= OFF_MAX):
                            continue
                        k = (-e['score'], e['contact'])
                        if local is None or k < local[0]:
                            local = (k, pose, e)
            if local:
                best.append(local)
        best.sort(key=lambda t: t[0])
        return best[0] if best else None

    def visible_centroid(self, spec, tside, nostril, pose):
        """For a plate-like target whose label centroid lies off the plate (the basal lamella: a coronal plate the scope looks
        up at from in front), the centroid of the label's voxels inside the field of the pose: the part of the structure the
        pose images. None when no voxel of the label is inside the field."""
        ids = [self.ids[f"{spec['label']}.{tside}"]]
        k, j, i = np.nonzero(np.isin(self.base.lab, ids))
        P = np.stack([self.base.o[0] + i * 0.5, self.base.o[1] + j * 0.5, self.base.o[2] + k * 0.5], 1)
        depth, yaw, pitch, roll, lens = pose
        F = self.lm[f'lm.naris.{nostril}']
        tip = tip_of(F, nostril, np.array([float(depth)]), np.array([float(yaw)]), np.array([float(pitch)]))[0]
        _, v, _, _ = frame_of(nostril, np.array([float(yaw)]), np.array([float(pitch)]), np.array([float(roll)]), np.array([float(lens)]))
        off = off_axis(np.repeat(v, len(P), 0), np.repeat(tip[None], len(P), 0), P)
        inside = off < FOV / 2
        return P[inside].mean(0) if inside.any() else None

    def solve_row(self, row, force_search=False, log=say):
        """-> (state key, {target side: (nostril, pose, target, evaluation, ok, how)}). A sided row is solved for its first
        target side and mirrored for the other, which is verified on its own side; a midline row has one entry."""
        shaft = row.get('shaft', '4')
        skey = self.state_key(row['at'])
        vol = self.volume(skey)
        first = row.get('side', 'R')
        sides = ['M'] if first == 'M' else [first, 'L' if first == 'R' else 'R']
        nostril0 = 'R' if first == 'M' else row.get('via', first)
        results = {}
        for n, tside in enumerate(sides):
            nostril = nostril0 if n == 0 else ('L' if nostril0 == 'R' else 'R')
            target = self.centroid(row['target'], tside)
            if n == 0:
                pose = row['proto']
                if row['target'].get('inView'):
                    target = self.visible_centroid(row['target'], tside, nostril, pose)
                    if target is None:
                        results[tside] = (nostril, pose, None, dict(free=False, tipAir=False, off=999.0, contact=0.0, tip=np.zeros(3), tipIn=None, shares={}, through={}, score=0.0), False, 'prototype')
                        continue
                e = self.evaluate(vol, nostril, pose, target, shaft, row)
                ok = e['free'] and e['tipAir'] and e['off'] <= OFF_MAX
                how = 'prototype'
                if (not ok) or force_search or row.get('search'):
                    log(f"  {row['id']} {tside}: " + ('prototype failed ' + str({k: e[k] for k in ('free', 'tipAir', 'off')}) if not ok else 'search requested'))
                    hit = None if row['target'].get('inView') else self.search(vol, nostril, row['proto'][4], target, shaft, row, log)
                    if hit:
                        pose, e, how = hit[1], hit[2], 'search'
                        ok = True
                results[tside] = (nostril, pose, target, e, ok, how)
            else:
                nostril_, pose0, _, _, ok0, _ = results[sides[0]]
                depth, yaw, pitch, roll, lens = pose0
                pose = (depth, yaw, pitch, (360 - roll) % 360, lens)
                if row['target'].get('inView'):
                    target = self.visible_centroid(row['target'], tside, nostril, pose)
                    if target is None:
                        results[tside] = (nostril, pose, None, dict(free=False, tipAir=False, off=999.0, contact=0.0, tip=np.zeros(3), tipIn=None, shares={}, through={}, score=0.0), False, 'mirror')
                        continue
                e = self.evaluate(vol, nostril, pose, target, shaft, row)
                ok = ok0 and e['free'] and e['tipAir'] and e['off'] <= OFF_MAX
                results[tside] = (nostril, pose, target, e, ok, 'mirror')
        return skey, results


def measured(e):
    tip = [round(float(x), 1) for x in e['tip']]
    return {'tip': tip, 'tipIn': e['tipIn'], 'targetOffAxisDeg': round(e['off'], 1), 'contactMm': round(e['contact'], 1),
            'imageShare': e['shares'], 'raysThrough': e['through']}


def entry(nostril, pose, target, e, row, tside):
    depth, yaw, pitch, roll, lens = pose
    num = lambda x: int(x) if float(x).is_integer() else round(float(x), 1)
    st = {'pose': {'side': nostril, 'depth': num(depth), 'yaw': num(yaw), 'pitch': num(pitch), 'roll': num(roll), 'lens': int(lens)}}
    if row.get('shaft'):
        st['shaft'] = row['shaft']
    t = row['target']
    if 'lm' in t:
        st['target'] = {'id': t['lm']}
    elif 'carvedDiff' in t:
        st['target'] = {'at': [round(float(x), 2) for x in target], 'note': row['note']}
    elif 'id' in t:
        st['target'] = {'id': f"{t['id']}.{tside}"}
    elif 'label' in t and not any(k in t for k in ('r', 'a', 's', 'inView')):
        st['target'] = {'id': f"{t['label']}.{tside}"}
    else:
        st['target'] = {'at': [round(float(x), 2) for x in target]}
        if t.get('inView'):
            st['target']['note'] = f"the part of {t['label']}.{tside} the pose images: the centroid of its voxels inside the {FOV / 2:.0f} degree half field (the label's own centroid lies off the plate, below the view)"
        elif 'label' in t:
            st['target']['note'] = f"voxel centroid of {t['label']}.{tside} with " + ', '.join(f'{k.upper()} in {v}' for k, v in t.items() if k in ('r', 'a', 's'))
    st['measured'] = measured(e)
    return st


def report(s, rows, force=False):
    table = {}
    for row in rows:
        say(f"{row['id']} @ {row['at'] or 'intact'}")
        skey, res = s.solve_row(row, force)
        for tside, (nost, pose, target, e, ok, src) in res.items():
            say(f"  {tside}: {src:9s} {'OK ' if ok else 'FAIL'} {nost},{','.join(str(round(x, 1)) for x in pose)}  off {e['off']:.1f}  free {e['free']}  tipIn {e['tipIn']}  contact {e['contact']:.1f}  hit {dict(list(e['shares'].items())[:4])}  through {dict(list(e['through'].items())[:3])}")
            table.setdefault(skey, {})[(row['id'], tside)] = (row, nost, pose, target, e, ok)
    return table


RULE_P3 = ("WP P3 (2026-10): `byState` holds poses for dissected states, key = a state of ssb/states/index.json, then \"t.<id>.<side>\" "
           "as above; each is held to this rule on THAT state's volume (the base with its patch applied), and its tip lies in an airway "
           "label of the state (s.nasal-cavity, s.nasopharynx, a sinus, an ethmoid cell, the frontal recess; not s.nasal-vestibule). "
           "`shaft`: \"2.7\" when the pose is free only for the 2.7 mm telescope (the olfactory cleft, the inferior meatus); absent = 4 mm. "
           "A station posed through the contralateral nostril is keyed by its target's side. Solved by tools/ssb-pipeline/uw/stations.py "
           "(prototype pose first, then a search), left = right mirrored and verified on the mirrored state.")


def write(table, doc):
    by = {}
    stations = doc['stations']
    unc = doc['uncovered']
    for skey, items in table.items():
        for (sid, tside), (row, nost, pose, target, e, ok) in items.items():
            if not ok:
                continue
            ent = entry(nost, pose, target, e, row, tside)
            if skey is None:
                stations[f'{sid}.{tside}'] = ent
            else:
                by.setdefault(skey, {})[f'{sid}.{tside}'] = ent
            unc.pop(sid, None)
    doc['byState'] = {k: v for k, v in sorted(by.items())}      # a state's views stay in TABLE order: the first is what the state opens (WP P4)
    if RULE_P3 not in doc['rule']:
        doc['rule'] = doc['rule'].rstrip() + ' ' + RULE_P3
    return doc


def check_committed(s):
    """Re-test every committed pose: the intact `stations` on the base (their own shaft), every `byState` pose on its state."""
    doc = json.load(open(STATIONS))
    bad = 0
    groups = [(None, doc['stations'])] + list(doc.get('byState', {}).items())
    for skey, table in groups:
        if skey is not None and skey not in s.index['states']:
            say(f'FAIL byState key {skey} is not a state'); bad += 1; continue
        vol = s.volume(skey)
        for key, st in table.items():
            p = st['pose']
            F = s.lm[f"lm.naris.{p['side']}"]
            free, _ = clearance(vol, F, p['side'], [p['depth']], [p['yaw']], [p['pitch']], RADII[st.get('shaft', '4')], s.arch)
            tip = tip_of(F, p['side'], np.array([p['depth']], float), np.array([p['yaw']], float), np.array([p['pitch']], float))[0]
            tair = int(vol.label(tip[None])[0]) in s.air or s.names.get(int(vol.label(tip[None])[0])) in ('s.nasal-vestibule',)
            if not (free[0] and tair):
                bad += 1
                say(f'FAIL {skey} {key}: free {bool(free[0])}, tip in air {tair}')
    say('committed poses: ' + ('all pass the port' if not bad else f'{bad} fail'))
    return bad


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'solve'
    force = '--search' in sys.argv
    s = Solver()
    if cmd == 'check':
        sys.exit(1 if check_committed(s) else 0)
    only = [a.split('=', 1)[1] for a in sys.argv if a.startswith('--only=')]
    rows = [r for r in TABLE if not only or r['id'] in only]
    table = report(s, rows, force)
    if cmd == 'write':
        doc = json.load(open(STATIONS))
        write(table, doc)
        with open(STATIONS, 'w') as fh:
            json.dump(doc, fh, indent=1, ensure_ascii=False)
            fh.write('\n')
        say('wrote', STATIONS)


if __name__ == '__main__':
    main()
