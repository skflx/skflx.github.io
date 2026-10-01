"""Reference specimen, stage D: endoscope geometry - the nostril fulcrum and the station poses (docs/ssb.md section 3).

    .venv/bin/python tools/ssb-pipeline/uw/stations.py [--png-dir DIR]     # after walls.py, sweeps.py, sdf.py

Writes ssb/geometry/endoscope.json (fulcrum per side, the collision rule, the pose conventions),
ssb/geometry/stations.json (one pose per station and side) and ssb/geometry/stations.meta.json (per pose:
reachable or not and why, shaft clearance, which `shows` structures the view actually sees, confidence).
With --png-dir it renders every reachable view (a raycast through the label volume) and CT overlays.

Fulcrum (scope physics, not anatomy - no graph id).
  The published volume is defaced, so the nostril is not in it. The piriform aperture is: on each axial level
  the rim is the anterior-most bone lateral to the open nasal airway (the columns with no bone in front of
  the airway); the aperture runs from the lowest open level (nasal floor) to the highest (where the nasal
  bones close over). Its inferior half is the lower half of that height; the centre is the mean height of
  those levels, the mean rim depth (a), and halfway between the septal edge of the opening and the rim (r).
  The fulcrum is that centre moved anteriorly by the vestibule depth. The depth is measured on this
  specimen's own unmasked source images (incoming/, offline - only the two points are published): the
  nostril lumen is the air the soft tissue encloses in each coronal plane in front of the aperture, the
  naris its lowest 2 mm, and the depth the distance in a from the aperture centre to the naris centroid.
  Without incoming/ the committed fulcrum is reused.

Collision (shared with the runtime; endoscope.json "collision").
  A point is passable when its display value is 0 < v < 78 (air, about -480 HU), or it lies in the footprint
  of a unit the dissection removed: a wall label (19-64) plus the unlabelled voxels within 1.5 mm of it (its
  mucosa), or for an air-cell id (an opened cell) the unlabelled voxels within 2.5 mm of its air (partitions
  and mucosa - named walls stay). Anterior to the piriform rim (the vestibule and cartilaginous nose, defaced)
  nothing is checked except that the shaft stays on its own side. The shaft centreline must be passable from
  the rim to the tip, and a 2 mm sphere round the tip wholly passable (a 4 mm telescope).

Stations.
  Every station with a scope gets a pose per side (`either` -> R and L, `midline` -> the side its `where`
  implies, else R); overviews get eye / target / up (`midline` overviews are keyed .M). For each, the
  station's `where` is read into a tip region (an anchor point built from the specimen's labels and
  landmarks, plus a search radius) and an aim (the `shows` structures that have geometry, taken within
  25 mm of the anchor, or the subset the `where` names). Every air voxel in the region with >= 2 mm clearance
  is a candidate tip; the shaft is fixed by the fulcrum and the tip, so a candidate is kept only if the
  shaft passes, and the lens's view cone (half-angle = lens angle around the shaft) is turned (roll) to the
  side nearest the aim. The pose that best balances aim error, distance from the anchor and shaft clearance
  wins. A station whose region holds no candidate that passes, or whose best aim error leaves the target
  outside the central field (> 25 deg), is reported unreachable with what blocked it - never forced.
  `requires` comes from the procedures whose steps name the station (the cumulative `removes` up to that
  step); where the `where` text itself states a dissection ("opened bulla", "after uncinectomy") the
  corresponding id is added and marked as read from the text in the meta.
"""
import argparse, gzip, json, os, sys
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from volume import CACHE  # noqa: E402
from walls import read_volume, Grid, BT, AIR  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT_ENDO = os.path.join(REPO, 'ssb/geometry/endoscope.json')
OUT_ST = os.path.join(REPO, 'ssb/geometry/stations.json')
OUT_META = os.path.join(REPO, 'ssb/geometry/stations.meta.json')
SIDES = (('R', 1), ('L', -1))
FOV = 75.0                 # deg, full field of the rendered check views (Hopkins rod telescopes ~70-80 deg)
TIP_R = 2.0                # mm, tip sphere (4 mm telescope)
CONN6 = ndi.generate_binary_structure(3, 1)
WALL_STEPS, CELL_STEPS, MUCOSA_STEPS = 3, 5, 3        # 6-connected dilation steps of 0.5 mm voxels
SOFT_UNITS = ('s.nasal-septum.M', 's.inferior-turbinate.R', 's.inferior-turbinate.L', 's.middle-turbinate.R',
              's.middle-turbinate.L')
AIM_MAX = 30.0             # deg off the view axis: still well inside the 37.5 deg half-field
VIEW_R = 25.0              # mm, shows geometry taken within this of the anchor
CELL_IDS = ('s.agger-nasi-cell', 's.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess',
            's.posterior-ethmoid-cells')


# ---------------------------------------------------------------- the specimen
class Specimen:
    def __init__(self):
        self.hdr, self.ct, self.lab, table = read_volume()
        self.g = Grid(self.hdr)
        self.table = {int(k): v for k, v in table.items()}
        self.index = {v: k for k, v in self.table.items()}
        self.landmarks = json.load(open(os.path.join(REPO, 'ssb/geometry/landmarks.json')))
        self.sweeps = json.load(open(os.path.join(REPO, 'ssb/geometry/sweeps.json')))
        self.graph, self.stations, self.procedures = {}, [], []
        for fn in sorted(os.listdir(os.path.join(REPO, 'ssb/content'))):
            if fn.endswith('.json'):
                d = json.load(open(os.path.join(REPO, 'ssb/content', fn)))
                for k, v in d.items():
                    if isinstance(v, list):
                        for e in v:
                            if isinstance(e, dict) and 'id' in e:
                                self.graph[e['id']] = e
                self.stations += d.get('stations', [])
                self.procedures += d.get('procedures', [])
        self.lm_of = {}
        for e in self.graph.values():
            if e['id'].startswith('lm.') and e.get('of'):
                self.lm_of.setdefault(e['of'], []).append(e['id'])
        self.air = (self.ct > 0) & (self.ct < AIR)
        self._pass, self._clear, self._pts = {}, {}, {}

    # voxel <-> RAS
    def kji(self, P):
        P = np.atleast_2d(P)
        g = self.g
        return np.stack([(P[:, 2] - g.s[0]) / g.step, (P[:, 1] - g.a[0]) / g.step, (P[:, 0] - g.r[0]) / g.step], 1)

    def near(self, vol, P):
        q = np.round(self.kji(P)).astype(int)
        q = np.clip(q, 0, np.array(vol.shape) - 1)
        return vol[q[:, 0], q[:, 1], q[:, 2]]

    def lin(self, vol, P):
        return ndi.map_coordinates(vol, self.kji(P).T, order=1, mode='nearest')

    def label_pts(self, name):
        if name not in self._pts:
            k = self.index.get(name)
            if k is None:
                self._pts[name] = np.zeros((0, 3))
            else:
                self._pts[name] = self.g.ras(np.stack(np.nonzero(self.lab == k), -1))
        return self._pts[name]

    def geometry(self, gid, side):
        """Points of a graph id on a side: label voxels, sweep centreline, landmark, or landmarks `of` it.
        A midline (.M) instance serves either side. Returns (points, kind) or (None, None)."""
        for sd in (side, 'M'):
            key = f'{gid}.{sd}'
            if key in self.index:
                return self.label_pts(key), 'label'
            if key in self.sweeps:
                P = np.array(self.sweeps[key]['pts'], float)
                d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
                t = np.arange(0, d[-1] + 1e-6, 0.5)
                return np.stack([np.interp(t, d, P[:, c]) for c in range(3)], 1), 'sweep'
            if key in self.landmarks:
                return np.array([self.landmarks[key]], float), 'landmark'
        pts = [self.landmarks[f'{lm}.{sd}'] for lm in self.lm_of.get(gid, []) for sd in (side, 'M')
               if f'{lm}.{sd}' in self.landmarks]
        if pts:
            return np.array(pts, float), 'landmark'
        return None, None

    # collision (module docstring; endoscope.json "collision" states the same rule for the runtime)
    def grow(self, m, steps):
        return ndi.binary_dilation(m, structure=CONN6, iterations=steps)

    def removed(self, requires):
        """Voxels the dissection `requires` clears: a wall unit's label plus the unlabelled voxels within
        WALL_STEPS 6-connected steps of it; an opened air cell's unlabelled voxels within CELL_STEPS steps."""
        m = np.zeros(self.ct.shape, bool)
        unl = self.lab == 0
        for sid in requires:
            ks = [k for k, v in self.table.items() if v.rsplit('.', 1)[0] == sid]
            if not ks:
                continue
            u = np.isin(self.lab, ks)
            if sid in CELL_IDS:
                m |= unl & self.grow(u, CELL_STEPS)
            else:
                m |= u | (unl & self.grow(u, WALL_STEPS))
        return m

    def allowance(self):
        """Mucosal allowance: soft tissue (0 < display < BT) that is unlabelled or septum / turbinate, within
        MUCOSA_STEPS 6-connected steps of air - decongested, gently displaced mucosa. Never bone, never a
        named wall, never the orbit."""
        if '_allow' not in self.__dict__:
            soft = (self.ct > 0) & (self.ct < BT) & np.isin(self.lab, [0] + [self.index[n] for n in SOFT_UNITS if n in self.index])
            self._allow = soft & self.grow(self.air, MUCOSA_STEPS)
        return self._allow

    def passable(self, requires=()):
        key = tuple(sorted(requires))
        if key not in self._pass:
            self._pass[key] = self.air | self.allowance() | self.removed(key)
        return self._pass[key]

    def clearance(self, requires=()):
        key = tuple(sorted(requires))
        if key not in self._clear:
            self._clear[key] = ndi.distance_transform_edt(self.passable(key), sampling=self.g.step).astype(np.float32)
        return self._clear[key]

    def blockers(self, P, requires):
        """Names of what sits on the non-passable samples P (label, or unlabelled tissue/bone)."""
        out = {}
        for v, c in zip(self.near(self.lab, P), self.near(self.ct, P)):
            n = self.table.get(int(v)) or ('unlabelled bone' if c >= BT else 'unlabelled soft tissue')
            out[n] = out.get(n, 0) + 1
        return out


# ---------------------------------------------------------------- fulcrum
RIM_BONE = 150             # display level of the aperture rim (dense cortical bone, ~ +650 HU)


def aperture(sp, side, sg):
    """Piriform aperture on one side: per-level rim and the centre of the inferior half (module docstring)."""
    g, bone = sp.g, sp.ct >= RIM_BONE
    front = (g.a > -40) & (g.a < g.a[-1] - 1)
    cols = [int(round((sg * rr - g.r[0]) / g.step)) for rr in np.arange(1.0, 22.01, g.step)]
    absr = np.arange(1.0, 22.01, g.step)
    levels = []
    for k, s in enumerate(g.s):
        if s < -6 or s > 45:
            continue
        B = bone[k][:, cols] & front[:, None]                     # (a, column)
        has = B.any(0)
        af = np.where(has, g.a[np.where(has, B.shape[0] - 1 - np.argmax(B[::-1], 0), 0)], -np.inf)
        open_ = ~has
        if not open_.any():
            continue
        # the opening: the longest open run of columns that starts within 6 mm of the midline
        runs_c, i = [], 0
        while i < len(open_):
            if open_[i]:
                j0 = i
                while i + 1 < len(open_) and open_[i + 1]:
                    i += 1
                runs_c.append((j0, i))
            i += 1
        runs_c = [(j0, j1) for j0, j1 in runs_c if absr[j0] <= 6.0 and absr[j1] - absr[j0] >= 2.0]
        if not runs_c:
            continue
        i0, i1 = max(runs_c, key=lambda x: x[1] - x[0])
        lat = slice(i1 + 1, min(len(absr), i1 + 1 + int(4 / g.step)))
        if not np.isfinite(af[lat]).any():
            continue
        j = i1 + 1 + int(np.nanargmax(np.where(np.isfinite(af[lat]), af[lat], -1e9)))
        levels.append({'s': float(s), 'r_med': float(sg * absr[i0]), 'r_rim': float(sg * absr[j]), 'a_rim': float(af[j])})
    # one contiguous run of levels (the aperture), the longest
    runs, cur = [], []
    for L in levels:
        if cur and L['s'] - cur[-1]['s'] > 2.0:
            runs.append(cur); cur = []
        cur.append(L)
    runs.append(cur)
    run = max(runs, key=len)
    s0, s1 = run[0]['s'], run[-1]['s']
    low = [L for L in run if L['s'] <= (s0 + s1) / 2]
    c = [float(np.mean([(L['r_med'] + L['r_rim']) / 2 for L in low])), float(np.mean([L['a_rim'] for L in low])),
         float(np.mean([L['s'] for L in low]))]
    rim = [[L['s'], L['a_rim'], L['r_rim']] for L in run]
    return {'centre': c, 'floor_s': s0, 'apex_s': s1, 'width_mm': float(max(abs(L['r_rim'] - L['r_med']) for L in run)),
            'rim': rim}


def naris(ap, side, sg):
    """Vestibule depth from the unmasked source images (offline): see the module docstring."""
    from specimen import frame, resample, grid_axes
    from volume import load
    A, dz, _ = frame()
    a0 = round(ap['centre'][1] * 2) / 2
    box = {'r': (-25.0, 25.0), 'a': (a0, 30.0), 's': (-10.0, 30.0)}
    V = resample(load('axial').astype(np.float32), A, dz, box)
    r, a, s = grid_axes(box)
    tissue = V >= AIR
    tissue[:, 0, :] = True                                   # close the vestibule at the aperture plane
    for k, sv in enumerate(s):
        if sv < ap['floor_s'] - 2:
            continue
        hole = ndi.binary_fill_holes(tissue[k]) & ~tissue[k] & (sg * r[None, :] > 0.5)
        lab, n = ndi.label(hole)
        if not n:
            continue
        sizes = ndi.sum(hole, lab, range(1, n + 1))
        reach = ndi.maximum(np.broadcast_to(a[:, None], hole.shape), lab, range(1, n + 1))
        ok = [q for q in range(n) if sizes[q] * 0.25 >= 30.0 and reach[q] >= a0 + 15.0]
        if not ok:                                           # the nostril: >= 30 mm2, reaching 15 mm forward
            continue
        big = max(ok, key=lambda q: sizes[q])
        jj, ii = np.nonzero(lab == big + 1)
        nar = np.array([r[ii].mean(), a[jj].mean(), sv])
        break
    else:
        return None
    depth = float(nar[1] - ap['centre'][1])
    f = np.array(ap['centre']) + [0, depth, 0]
    j = int(round((f[1] - a[0]) / 0.5)); kf = int(round((f[2] - s[0]) / 0.5)); i_ = int(round((f[0] - r[0]) / 0.5))
    return {'depth': round(depth, 1), 'naris': [round(float(x), 1) for x in nar],
            'naris_area_mm2': round(float(sizes[big] * 0.25), 1),
            'fulcrum_display': float(V[kf, j, i_])}


# ---------------------------------------------------------------- pose conventions
def frame_of(u):
    """Shaft frame: e_up = patient superior made perpendicular to the shaft axis u, e_right = u x e_up
    (screen right; patient left when looking back along the nose)."""
    u = u / np.linalg.norm(u)
    up = np.array([0, 0, 1.0]) - u[2] * u
    if np.linalg.norm(up) < 1e-3:                            # shaft vertical: anterior is up
        up = np.array([0, 1.0, 0]) - u[1] * u
    up /= np.linalg.norm(up)
    return u, up, np.cross(u, up)


def view_of(u, lens, roll):
    """View direction and image basis for lens angle and roll (deg; 0 = deflected toward screen-up,
    +90 = toward screen-right). The image basis is the shaft frame rotated by the lens angle about u x d,
    so the camera head stays level while the telescope turns (endoscope.json "conventions")."""
    u, eu, er = frame_of(u)
    p, a = np.radians(roll), np.radians(lens)
    d = np.cos(p) * eu + np.sin(p) * er
    v = np.cos(a) * u + np.sin(a) * d
    k = np.cross(u, d)

    def rot(x):                                              # Rodrigues about k by the lens angle
        return x * np.cos(a) + np.cross(k, x) * np.sin(a) + k * np.dot(k, x) * (1 - np.cos(a))
    return v, rot(eu), rot(er)


def aim_roll(u, w, lens):
    """Best roll for a lens so the view is nearest the direction w; returns (roll deg, error deg)."""
    u, eu, er = frame_of(u)
    w = w / np.linalg.norm(w)
    th = np.degrees(np.arccos(np.clip(np.dot(u, w), -1, 1)))
    perp = w - np.dot(w, u) * u
    roll = 0.0 if np.linalg.norm(perp) < 1e-6 else float(np.degrees(np.arctan2(np.dot(perp, er), np.dot(perp, eu))))
    return (roll if lens else 0.0), abs(th - lens)


# ---------------------------------------------------------------- shaft
N_SHAFT = 320


class Shaft:
    def __init__(self, sp, side, fulcrum, rim):
        self.sp, self.side, self.f = sp, side, np.asarray(fulcrum, float)
        self.sg = 1 if side == 'R' else -1
        rim = np.array(rim, float)
        self.rim_s, self.rim_a = rim[:, 0], rim[:, 1]

    def unchecked(self, P):
        """Samples anterior to the piriform rim (defaced vestibule / cartilaginous nose)."""
        return P[..., 1] > np.interp(P[..., 2], self.rim_s, self.rim_a)

    def evaluate(self, T, requires):
        """For tips T (n, 3): shaft passes, min clearance on the checked part, first blocked point."""
        sp = self.sp
        T = np.atleast_2d(T)
        t = np.linspace(0, 1, N_SHAFT)[None, :, None]
        P = self.f[None, None, :] + t * (T[:, None, :] - self.f[None, None, :])       # (n, N, 3)
        flat = P.reshape(-1, 3)
        ok = sp.near(sp.passable(requires), flat).reshape(P.shape[:2])
        cl = sp.lin(sp.clearance(requires), flat).reshape(P.shape[:2])
        unc = self.unchecked(P)
        own = (self.sg * P[..., 0] > -0.5) | ~unc                                    # vestibule stays on its side
        good = (ok | unc) & own
        passes = good.all(1)
        cl = np.where(unc, np.inf, cl)
        first = np.where(~good.all(1), np.argmax(~good, 1), -1)
        return passes, cl.min(1), first, P

    def length_checked(self, T):
        T = np.asarray(T, float)
        t = np.linspace(0, 1, N_SHAFT)[:, None]
        P = self.f + t * (T - self.f)
        unc = self.unchecked(P)
        return float(np.linalg.norm(T - self.f) * (1 - unc.mean()))


# ---------------------------------------------------------------- station specs
# Shows ids with no geometry of their own whose position a geometric neighbour stands for (stated per id).
PROXY = {
    's.optic-canal': 's.optic-nerve', 's.optic-prominence': 's.optic-nerve',       # the canal holds the nerve
    's.carotid-prominence': 's.internal-carotid-artery',                           # the bone over the ICA
    's.lateral-opticocarotid-recess': 's.optic-nerve',
    's.hiatus-semilunaris': 's.ethmoid-bulla', 's.retrobullar-recess': 's.ethmoid-bulla',
    's.sphenoethmoidal-recess': 's.sphenoid-ostium',
}
AIR_IDS = ('s.agger-nasi-cell', 's.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.frontal-recess', 's.frontal-sinus',
           's.maxillary-sinus', 's.nasal-cavity', 's.nasopharynx', 's.posterior-ethmoid-cells', 's.sphenoid-sinus')
ETHMOIDECTOMY = ['s.ethmoid-bulla', 's.anterior-ethmoid-cells', 's.basal-lamella', 's.posterior-ethmoid-cells']


class Ctx:
    """Geometry questions a station spec asks, on one side."""

    def __init__(self, sp, side):
        self.sp, self.side, self.sg = sp, side, (1 if side == 'R' else -1)

    def P(self, gid, side=None):
        P, _ = self.sp.geometry(gid, side or self.side)
        return P

    def c(self, gid, side=None):
        return self.P(gid, side).mean(0)

    def band(self, gid, axis, ext, mm=3.0, side=None):
        """Centroid of the part of gid within mm of its extreme along axis (0 r, 1 a, 2 s; ext +1 max, -1 min);
        on r, ext +1 means lateral (away from the midline on this side)."""
        P = self.P(gid, side)
        v = P[:, axis] * (self.sg if axis == 0 else 1) * ext
        return P[v >= v.max() - mm].mean(0)

    def lat(self, p, mm):
        return np.asarray(p, float) + [self.sg * mm, 0, 0]

    def has(self, gid, side=None):
        return self.sp.geometry(gid, side or self.side)[0] is not None

    def air(self, *gids):
        return [f'{g}.{self.side}' if g != 's.nasopharynx' else 's.nasopharynx.M' for g in gids]


def mt_axilla(x):
    """The MT's anterosuperior attachment: its anterior 6 mm, top 4 mm of that."""
    P = x.P('s.middle-turbinate')
    P = P[P[:, 1] >= P[:, 1].max() - 6]
    return P[P[:, 2] >= P[:, 2].max() - 4].mean(0)


def mt_head(x):
    """The free anterior end of the MT, below the axilla: its anterior 6 mm, lower half of that."""
    P = x.P('s.middle-turbinate')
    P = P[P[:, 1] >= P[:, 1].max() - 6]
    return P[P[:, 2] <= np.median(P[:, 2])].mean(0)


def mt_tail(x):
    return x.band('s.middle-turbinate', 1, -1, 5)


def antrostomy(x):
    """Centre of the medial maxillary wall's upper posterior part, where a middle meatal antrostomy is made
    (behind the nasolacrimal duct, below the orbital floor)."""
    P = x.P('s.maxillary-medial-wall')
    a0, a1 = np.percentile(P[:, 1], [25, 60])
    P = P[(P[:, 1] >= a0) & (P[:, 1] <= a1)]
    return P[P[:, 2] >= np.percentile(P[:, 2], 70)].mean(0)


def S(**k):
    return k


def specs(x):
    """t-id -> spec on side x.side. Keys: anchor, radius, inside (air ids for the tip), aim (ids; default the
    station's shows), aim_pt (an explicit point, with aim_desc), where_req (ids the where-text's own
    dissection implies), nostril ('same' or 'contra'), aim_max, unreachable (a reason, decided up front)."""
    sd = x.side
    sph = x.band('s.sphenoid-face', 1, -1, 2.0)              # just behind the sphenoid face on this side
    out = {
        't.septum-anterior': S(
            anchor=np.array([x.sg * 3.0, -16.0, 9.0]), radius=4, inside=x.air('s.nasal-cavity'),
            aim_pt=lambda: septum_surface(x, -30, -14), aim_desc='septal surface 14-30 mm behind the aperture',
            note='shows (valve, cartilage, Kiesselbach area, swell body, crest) have no geometry; aimed along the septum'),
        't.first-pass-floor': S(
            anchor=floor_choana(x), radius=6, inside=x.air('s.nasal-cavity', 's.nasopharynx'),
            aim=['s.nasopharynx', 's.vomer']),
        't.nasopharynx-lateral': S(
            anchor=floor_choana(x) + [0, -2, 3], radius=6, inside=x.air('s.nasal-cavity', 's.nasopharynx'),
            aim_pt=lambda: nph_lateral(x),
            aim_desc='lateral nasopharyngeal wall (torus / fossa of Rosenmuller region) of this side',
            note='shows have no geometry; aimed at the lateral wall of the nasopharynx label'),
        't.second-pass-ser': S(
            anchor=x.lat(mt_tail(x), -4) + [0, 4, 0], radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.sphenoid-ostium']),
        't.third-pass-middle-meatus': S(
            anchor=x.lat(mt_head(x), 4), radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.ethmoid-bulla'] if x.has('s.ethmoid-bulla') else ['s.anterior-ethmoid-cells'],
            note=None if x.has('s.ethmoid-bulla') else 'no bulla label on this side: aimed at the anterior ethmoid'),
        't.ethmoid-bulla-0': S(
            anchor=x.lat(mt_head(x), 3), radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.ethmoid-bulla'] if x.has('s.ethmoid-bulla') else ['s.anterior-ethmoid-cells'],
            where_req=['s.uncinate-process'],
            note=None if x.has('s.ethmoid-bulla') else 'no bulla label on this side: aimed at the anterior ethmoid'),
        't.infundibulum-45': S(
            anchor=x.lat(mt_head(x), 3), radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.lamina-papyracea', 's.nasolacrimal-duct', 's.ethmoid-bulla'], where_req=['s.uncinate-process']),
        't.lacrimal-sac-0': S(
            anchor=mt_axilla(x) + [-x.sg * 2, 8, -6], radius=7, inside=x.air('s.nasal-cavity'),
            aim_pt=lambda: (mt_axilla(x) + x.c('s.agger-nasi-cell')) / 2, aim_desc='MT axilla and agger nasi'),
        't.frontal-recess-45': S(
            anchor=x.lat(mt_axilla(x), 2) + [0, -2, -6], radius=6, inside=x.air('s.nasal-cavity', 's.frontal-recess'),
            aim=['s.agger-nasi-cell', 's.frontal-recess']),
        't.frontal-recess-70': S(
            anchor=x.band('s.frontal-recess', 2, -1, 3) + [0, 0, -5], radius=7,
            inside=x.air('s.nasal-cavity', 's.frontal-recess'), aim=['lm.frontal-ostium', 's.frontal-recess']),
        't.frontal-sinus-70': S(
            anchor=x.c('lm.frontal-ostium') + [0, 0, -3], radius=5,
            inside=x.air('s.frontal-recess', 's.frontal-sinus', 's.agger-nasi-cell'),
            aim=['s.frontal-sinus'], where_req=['s.agger-nasi-cell', 's.frontal-recess']),
        't.inferior-meatus-45': S(
            anchor=x.lat(x.band('s.inferior-turbinate', 1, 1, 8), 2) + [0, -4, -4], radius=6,
            inside=x.air('s.nasal-cavity'), aim_pt=lambda: x.band('s.nasolacrimal-duct', 2, -1, 2),
            aim_desc='lower end of the nasolacrimal duct (valve of Hasner)'),
        't.medial-orbital-floor-30': S(
            anchor=antrostomy(x), radius=6, inside=x.air('s.nasal-cavity', 's.maxillary-sinus'),
            aim_pt=lambda: medial_floor(x), aim_desc='medial third of the orbital floor (the Casiano reference)',
            where_req=['s.maxillary-medial-wall'],
            note='a wide antrostomy is approximated by the whole medial-wall unit (walls.py has no finer one)'),
        't.maxillary-antrum-70': S(
            anchor=antrostomy(x), radius=6, inside=x.air('s.nasal-cavity', 's.maxillary-sinus'),
            aim=['s.maxillary-anterior-wall', 's.maxillary-sinus', 's.infraorbital-nerve'],
            where_req=['s.maxillary-medial-wall'],
            note='a wide antrostomy is approximated by the whole medial-wall unit (walls.py has no finer one)'),
        't.spf-crista': S(
            anchor=x.lat(x.c('s.sphenopalatine-artery'), -5) + [0, 3, 0], radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.sphenopalatine-artery', 's.sphenopalatine-foramen']),
        't.ser-0': S(
            anchor=x.lat(mt_tail(x), -3) + [0, 6, 4], radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.sphenoid-ostium', 's.sphenoid-face']),
        't.nsf-pedicle': S(
            anchor=x.lat(mt_tail(x), -3) + [0, 8, 0], radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.sphenoid-ostium', 's.vomer']),
        't.olfactory-cleft-0': S(
            anchor=x.c('s.cribriform-plate') + [x.sg * 1.5, 6, -6], radius=6, inside=x.air('s.nasal-cavity'),
            aim=['s.cribriform-plate']),
        't.basal-lamella-0': S(
            anchor=x.band('s.ethmoid-bulla', 1, 1, 4) if x.has('s.ethmoid-bulla') else x.band('s.anterior-ethmoid-cells', 1, -1, 5),
            radius=5, inside=x.air('s.ethmoid-bulla', 's.anterior-ethmoid-cells'), aim=['s.basal-lamella'],
            where_req=['s.ethmoid-bulla', 's.uncinate-process']),
        't.posterior-ethmoid-roof-0': S(
            anchor=x.c('s.posterior-ethmoid-cells'), radius=6, inside=x.air('s.posterior-ethmoid-cells'),
            aim=['s.fovea-ethmoidalis', 's.posterior-ethmoidal-artery', 's.sphenoid-sinus'],
            where_req=['s.uncinate-process'] + ETHMOIDECTOMY[:3]),
        't.ethmoid-roof-30': S(
            anchor=x.c('s.basal-lamella') + [0, 0, 2], radius=7,
            inside=x.air('s.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.posterior-ethmoid-cells'),
            aim=['s.anterior-ethmoidal-artery', 's.fovea-ethmoidalis'],
            where_req=['s.uncinate-process'] + ETHMOIDECTOMY),
        't.medial-orbital-wall-0': S(
            anchor=x.lat(x.c('s.basal-lamella'), -2), radius=7,
            inside=x.air('s.anterior-ethmoid-cells', 's.ethmoid-bulla', 's.posterior-ethmoid-cells'),
            aim=['s.lamina-papyracea'], aim_max=32,
            where_req=['s.uncinate-process'] + ETHMOIDECTOMY + ['s.agger-nasi-cell', 's.frontal-recess', 's.sphenoid-face'],
            note='a 0 deg scope from the nostril meets the lamina obliquely: the wall fills one side of the field'),
        't.optic-canal-0': S(
            anchor=x.band('s.posterior-ethmoid-cells', 1, -1, 5), radius=7,
            inside=x.air('s.posterior-ethmoid-cells', 's.sphenoid-sinus'),
            aim_pt=lambda: optic_canal(x), aim_desc='optic canal (the optic nerve sweep between a = -56 and -46 mm)',
            where_req=['s.uncinate-process'] + ETHMOIDECTOMY + ['s.sphenoid-face']),
        't.sphenoid-face-0': S(
            anchor=np.array([0.0, sph[1] - 6, 27.0]), radius=7, inside=['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'],
            aim_pt=lambda: (x.c('lm.sella-floor-center') + x.c('s.clivus')) / 2,
            aim_desc='posterior sphenoid wall in the midline (between the sellar floor and the clival recess)',
            where_req=['s.sphenoid-face']),
        't.sphenoid-lateral-recess-45': S(
            nostril='contra', anchor=np.array([0.0, sph[1] - 6, 25.0]), radius=7,
            inside=['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'],
            aim_pt=lambda: x.band('s.sphenoid-sinus', 0, 1, 4), aim_desc='lateral recess (lateral 4 mm of this side\'s sphenoid)',
            where_req=['s.sphenoid-face', 's.intersinus-septum', 's.nasal-septum'],
            note='posterior septectomy approximated by the whole septum unit'),
        't.sella-open-30': S(
            anchor=x.c('lm.sella-floor-center') + [0, 7, -4], radius=6, inside=['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'],
            aim_pt=lambda: x.c('lm.sella-floor-center') + [0, -3, 3], aim_desc='the opened sella (above the floor centre)',
            where_req=['s.sphenoid-face', 's.sella-turcica'],
            note='pituitary, diaphragma, intercavernous sinus are not in the specimen: the view shows the sellar contents as one soft-tissue surface'),
        't.cavernous-sinus-30': S(
            anchor=x.lat(x.c('lm.sella-floor-center') + [0, 7, -4], 5), radius=6,
            inside=['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'],
            aim_pt=lambda: ica_near(x, x.c('lm.sella-floor-center')), aim_desc='parasellar ICA (nearest part of the sweep to the sella)',
            where_req=['s.sphenoid-face', 's.sella-turcica'],
            note='cavernous-sinus contents are not in the specimen: the view shows the carotid prominence with the ICA sweep behind it'),
        't.clivus-0': S(
            anchor=np.array([0.0, x.c('s.clivus')[1] + 8, x.c('s.clivus')[2] - 4]), radius=6,
            inside=['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'], aim_pt=lambda: x.c('s.clivus') + [0, -6, 0],
            aim_desc='behind the clival recess', where_req=['s.sphenoid-face', 's.clivus'],
            note='the prepontine cistern and its contents are not in the specimen: the view ends on the soft tissue behind the removed clivus'),
        't.petrous-apex-45': S(
            nostril='contra', anchor=np.array([0.0, x.c('s.clivus')[1] + 8, x.c('s.clivus')[2] - 2]), radius=6,
            inside=['s.sphenoid-sinus.R', 's.sphenoid-sinus.L'],
            aim=['s.petrous-apex', 's.internal-carotid-artery'] if x.has('s.petrous-apex') else ['s.internal-carotid-artery'],
            where_req=['s.sphenoid-face', 's.nasal-septum'],
            note='posterior septectomy approximated by the whole septum unit; the petrous apex lies behind bone the view does not remove'),
        't.cvj-0': S(
            anchor=np.array([x.sg * 3.0, -52.0, 2.0]), radius=7, inside=x.air('s.nasal-cavity', 's.nasopharynx'),
            aim_pt=lambda: nph_posterior_inferior(x), aim_desc='posteroinferior nasopharyngeal wall over the lower clivus / C1',
            note='lower clivus, C1 and dens are below or behind the specimen box: the view shows the posterior nasopharyngeal wall'),
        't.ppf-transmaxillary': S(
            anchor=ppf_window(x), radius=6,
            inside=x.air('s.maxillary-sinus'), aim=['s.maxillary-nerve', 's.sphenopalatine-artery', 's.vidian-nerve'],
            where_req=['s.maxillary-medial-wall', 's.maxillary-posterior-wall'],
            note='the PPF fat and its vessels are not segmented: the view ends on the soft tissue behind the removed posterior wall'),
        't.quadrangular-space-0': S(
            anchor=ppf_window(x) + [0, -3, 0], radius=6, inside=x.air('s.maxillary-sinus'),
            aim=['s.maxillary-nerve', 's.vidian-nerve', 's.internal-carotid-artery'],
            where_req=['s.maxillary-medial-wall', 's.maxillary-posterior-wall'],
            note='the pterygoid base is not drilled in the specimen (no unit): the view shows the soft tissue in front of it'),
        't.draf-iii-0': S(
            anchor=np.array([x.sg * 2.0, x.c('lm.frontal-ostium')[1] - 2, x.c('lm.frontal-ostium')[2] - 9]), radius=6,
            inside=x.air('s.nasal-cavity', 's.frontal-recess', 's.agger-nasi-cell'),
            aim_pt=lambda: (x.c('lm.frontal-ostium', 'R') + x.c('lm.frontal-ostium', 'L')) / 2, aim_desc='both frontal ostia',
            where_req=['s.agger-nasi-cell', 's.frontal-recess', 's.frontal-sinus-floor', 's.frontal-intersinus-septum']),
        't.suprasellar-0': S(unreachable='the dissection it needs (tuberculum sellae, limbus, dura) has no resection unit in the '
                             'specimen, and the suprasellar cistern and its contents are not segmented; the view cannot '
                             'show what the station names'),
    }
    return out


def septum_surface(x, a0, a1):
    P = x.sp.label_pts('s.nasal-septum.M')
    P = P[(P[:, 1] >= a0) & (P[:, 1] <= a1) & (P[:, 2] > 3) & (P[:, 2] < 20)]
    v = x.sg * P[:, 0]
    return P[v >= np.percentile(v, 90)].mean(0)


def floor_choana(x):
    """Choana on this side, low: the posterior end of the nasal airway in its lower third."""
    P = x.P('s.nasal-cavity')
    P = P[P[:, 2] <= np.percentile(P[:, 2], 30)]
    return P[P[:, 1] <= P[:, 1].min() + 6].mean(0)


def nph_lateral(x):
    P = x.sp.label_pts('s.nasopharynx.M')
    P = P[x.sg * P[:, 0] > 0]
    v = x.sg * P[:, 0]
    return P[v >= v.max() - 4].mean(0)


def nph_posterior_inferior(x):
    P = x.sp.label_pts('s.nasopharynx.M')
    P = P[np.abs(P[:, 0]) < 6]
    P = P[P[:, 1] <= P[:, 1].min() + 6]
    return P[P[:, 2] <= np.percentile(P[:, 2], 40)].mean(0)


def ppf_window(x):
    """In the antrum just lateral to the (removed) medial wall, 6 mm in front of the posterior wall's medial
    part at mid-height - the straightest line from the nostril."""
    P = x.P('s.maxillary-posterior-wall')
    P = P[(x.sg * P[:, 0] <= np.percentile(x.sg * P[:, 0], 20)) & (P[:, 2] > 8) & (P[:, 2] < 22)]
    return P.mean(0) + [0, 6, 0]


def medial_floor(x):
    P = x.P('s.orbital-floor')
    return P[x.sg * P[:, 0] <= np.percentile(x.sg * P[:, 0], 25)].mean(0)


def optic_canal(x):
    P = x.P('s.optic-nerve')
    return P[(P[:, 1] >= -56) & (P[:, 1] <= -46)].mean(0)


def ica_near(x, p):
    P = x.P('s.internal-carotid-artery')
    d = np.linalg.norm(P - p, axis=1)
    return P[d <= d.min() + 4].mean(0)


# ---------------------------------------------------------------- requires
def requires_of(sp, st, extra):
    """Cumulative `removes` of every procedure step naming the station (up to and including it), plus the
    dissection its `where` states, minus what the station shows (a structure on view was not removed)."""
    proc = set()
    for p in sp.procedures:
        acc = []
        for step in p['steps']:
            acc += step.get('removes') or []
            if step.get('station') == st['id']:
                proc |= set(acc)
    shows = set(st['shows'])
    req = (proc | set(extra or [])) - shows
    return sorted(req), {'from_procedures': sorted(proc), 'from_where_text': sorted(set(extra or []) - proc),
                         'kept_because_shown': sorted((proc | set(extra or [])) & shows)}


# ---------------------------------------------------------------- placement
def aim_point(x, spec, st):
    """Default aim: the shows (or the spec's aim ids) that have geometry, each taken within VIEW_R of the
    anchor (or its nearest 10 % when none is that close), centroid of their centroids."""
    if spec.get('aim_pt'):
        return spec['aim_pt'](), [spec.get('aim_desc', 'explicit point')]
    ids = spec.get('aim') or st['shows']
    cs, used = [], []
    for gid in ids:
        g = PROXY.get(gid, gid) if x.sp.geometry(gid, x.side)[0] is None else gid
        P, _ = x.sp.geometry(g, x.side)
        if P is None:
            continue
        d = np.linalg.norm(P - spec['anchor'], axis=1)
        Q = P[d <= VIEW_R] if (d <= VIEW_R).any() else P[d <= np.percentile(d, 10)]
        cs.append(Q.mean(0)); used.append(gid if g == gid else f'{gid} (as {g})')
    if not cs:
        return None, []
    return np.mean(cs, 0), used


def place(sp, x, sh, spec, st, req):
    lens = st['scope']
    anchor = np.asarray(spec['anchor'], float)
    aim, aim_used = aim_point(x, spec, st)
    if aim is None:
        return None, {'reason': 'no shows structure has geometry to aim at'}
    clear = sp.clearance(req)
    g = sp.g
    c = np.round(sp.kji(anchor)[0]).astype(int)
    rv = int(np.ceil(spec['radius'] / g.step))
    lo = np.maximum(c - rv, 0); hi = np.minimum(c + rv + 1, g.shape)
    sub = np.stack(np.meshgrid(*[np.arange(lo[i], hi[i]) for i in range(3)], indexing='ij'), -1).reshape(-1, 3)
    P = g.ras(sub)
    keep = np.linalg.norm(P - anchor, axis=1) <= spec['radius']
    inside = spec.get('inside')
    labs = sp.lab[sub[:, 0], sub[:, 1], sub[:, 2]]
    if inside:
        ks = [sp.index[n] for n in inside if n in sp.index]
        keep &= np.isin(labs, ks)
    n_region = int(keep.sum())
    keep &= clear[sub[:, 0], sub[:, 1], sub[:, 2]] >= TIP_R + 0.25
    n_room = int(keep.sum())
    P = P[keep]
    info = {'anchor': anchor.round(1).tolist(), 'aim': np.round(aim, 1).tolist(), 'aim_ids': aim_used,
            'region_voxels': n_region, 'tip_candidates_with_room': n_room}
    if not len(P):
        info['reason'] = (f'no air in the tip region ({spec["radius"]} mm round the anchor'
                          + (f', inside {", ".join(inside)}' if inside else '') + f') has {TIP_R} mm clearance for the tip'
                          + ('' if n_region else ' - the region holds no such air at all'))
        return None, info
    if len(P) > 6000:
        P = P[np.random.default_rng(0).choice(len(P), 6000, replace=False)]
    passes, mincl, first, Ps = sh.evaluate(P, req)
    U = P - sh.f; U /= np.linalg.norm(U, axis=1)[:, None]
    W = aim - P; dist_aim = np.linalg.norm(W, axis=1); W /= dist_aim[:, None]
    th = np.degrees(np.arccos(np.clip((U * W).sum(1), -1, 1)))
    err = np.abs(th - lens)
    dist = np.linalg.norm(P - anchor, axis=1)
    score = err + 1.0 * dist + 6.0 * np.clip(1.5 - mincl, 0, None)
    amax = spec.get('aim_max', AIM_MAX)
    ok = passes & (err <= amax) & (dist_aim >= 4.0)
    info.update({'tips_shaft_clear': int(passes.sum()), 'tips_on_aim': int((err <= amax).sum())})
    if not ok.any():
        # what blocks: the candidates nearest the aim
        best = np.argsort(err + 0.5 * dist)[:40]
        blk = {}
        for b in best:
            if first[b] >= 0:
                q = Ps[b, first[b]:first[b] + 8]
                for k, v in sp.blockers(q[~sp.near(sp.passable(req), q)] if (~sp.near(sp.passable(req), q)).any() else q[:1], req).items():
                    blk[k] = blk.get(k, 0) + v
        info['best_aim_error_deg'] = round(float(err.min()), 1)
        info['best_aim_error_with_clear_shaft_deg'] = round(float(err[passes].min()), 1) if passes.any() else None
        info['blocked_by'] = dict(sorted(blk.items(), key=lambda kv: -kv[1])[:6])
        if not passes.any():
            info['reason'] = 'every shaft from the nostril to the tip region crosses tissue the dissection has not removed'
        else:
            info['reason'] = (f'a clear shaft leaves the aim {info["best_aim_error_with_clear_shaft_deg"]} deg off the '
                              f'{lens} deg view axis (limit {amax})')
        return None, info
    i = int(np.argmin(np.where(ok, score, np.inf)))
    tip = P[i]
    roll, e = aim_roll(U[i], W[i], lens)
    v, iu, ir = view_of(U[i], lens, roll)
    info.update({'aim_error_deg': round(float(e), 1), 'shaft_clearance_mm': round(float(mincl[i]), 2),
                 'tip_clearance_mm': round(float(sp.lin(clear, tip[None])[0]), 2),
                 'tip_from_anchor_mm': round(float(dist[i]), 1), 'tip_to_aim_mm': round(float(dist_aim[i]), 1),
                 'depth_mm': round(float(np.linalg.norm(tip - sh.f)), 1)})
    return {'tip': tip, 'u': U[i], 'look': v, 'roll': roll, 'img_up': iu, 'img_right': ir, 'aim': aim}, info


# ---------------------------------------------------------------- overviews
OV_FOV = 45.0


def overview(x, st):
    """eye / target / up (+ an optional section `cut` and `ghost` ids) for a scope-less station."""
    sg, tid = x.sg, st['id']
    pts = [P for gid in st['shows'] for P in [x.sp.geometry(gid, x.side)[0]] if P is not None]
    if tid in ('t.olfactory-fossa-coronal', 't.acf-overview', 't.central-skull-base-overview'):
        pts = [P for gid in st['shows'] for sd in ('R', 'L') for P in [x.sp.geometry(gid, sd)[0]] if P is not None]
    allp = np.concatenate([P if len(P) < 4000 else P[::len(P) // 4000] for P in pts])
    target = np.mean([P.mean(0) for P in pts], 0)
    rad = float(np.percentile(np.linalg.norm(allp - target, axis=1), 90))
    D = 1.15 * rad / np.tan(np.radians(OV_FOV / 2)) + 10
    up = [0, 0, 1.0]
    out = {}
    if tid == 't.frontal-recess-sagittal':                   # parasagittal cut through the recess, from medial
        fr = x.c('s.frontal-recess')
        eye = target + [-sg * D, 0, 0]
        out['cut'] = {'point': np.round(fr, 1).tolist(), 'normal': [sg * 1.0, 0, 0]}
    elif tid == 't.nasal-cavity-overview':                   # lateral wall from medial (see the meta note)
        eye = target + [-sg * D, 0, 0]
        out['cut'] = {'point': [sg * 2.0, 0, 0], 'normal': [sg * 1.0, 0, 0]}
    elif tid == 't.olfactory-fossa-coronal':                 # coronal cut at the AEA, from in front
        aea = np.mean([x.c('s.anterior-ethmoidal-artery', 'R'), x.c('s.anterior-ethmoidal-artery', 'L')], 0)
        target = np.array([0.0, aea[1], target[2]])
        eye = target + [0, D, 0]
        out['cut'] = {'point': [0, round(float(aea[1]), 1), 0], 'normal': [0, -1.0, 0]}
    elif tid == 't.acf-overview':                            # from above, anterior at the top
        target = np.array([0.0, target[1], target[2]])
        eye = target + [0, 0, D]; up = [0, 1.0, 0]
    elif tid == 't.central-skull-base-overview':             # midsagittal cutaway, from the left
        target = np.array([0.0, target[1], target[2]])
        eye = target + [-D, 0, 0]
        out['cut'] = {'point': [0, 0, 0], 'normal': [1.0, 0, 0]}
    elif tid == 't.ppf-itf-overview':                        # anterolateral, maxilla see-through
        d = np.array([sg * 0.6, 0.8, 0.0]); eye = target + D * d / np.linalg.norm(d)
        out['ghost'] = ['s.maxillary-anterior-wall', 's.maxillary-sinus', 's.maxillary-posterior-wall']
    else:
        raise KeyError(tid)
    return {'eye': np.round(eye, 1).tolist(), 'target': np.round(target, 1).tolist(), 'up': up, 'fov': OV_FOV, **out}


# ---------------------------------------------------------------- verification render
KIND_RGB = {'cell': (0.86, 0.62, 0.60), 'wall': (0.93, 0.89, 0.78), 'soft': (0.80, 0.45, 0.45),
            'orbit': (0.95, 0.80, 0.35), 'bone': (0.90, 0.88, 0.80), 'tissue': (0.75, 0.50, 0.48)}
SWEEP_RGB = {'s.internal-carotid-artery': (0.9, 0.1, 0.1), 's.optic-nerve': (1.0, 0.9, 0.1),
             's.anterior-ethmoidal-artery': (1.0, 0.3, 0.6), 's.posterior-ethmoidal-artery': (1.0, 0.3, 0.6),
             's.sphenopalatine-artery': (1.0, 0.3, 0.6), 's.maxillary-nerve': (1.0, 0.95, 0.4),
             's.vidian-nerve': (1.0, 0.95, 0.4), 's.infraorbital-nerve': (1.0, 0.95, 0.4),
             's.nasolacrimal-duct': (0.3, 0.8, 1.0)}


def render(sp, tip, v, iu, ir, req, n=160, fov=FOV, far=60.0):
    """Raycast through the passable volume from the tip: first non-passable voxel = surface. Returns the
    image (spotlight at the tip, inverse-square falloff, circular field), per-pixel hit label and depth."""
    h = np.tan(np.radians(fov / 2))
    xs = np.linspace(-1, 1, n)
    X, Y = np.meshgrid(xs, -xs)
    inside = X ** 2 + Y ** 2 <= 1
    D = v[None, None] + h * (X[..., None] * ir + Y[..., None] * iu)
    D /= np.linalg.norm(D, axis=-1, keepdims=True)
    pas = sp.passable(req)
    depth = np.full(X.shape, np.inf); hitp = np.zeros(X.shape + (3,))
    alive = inside.copy()
    for tt in np.arange(0.25, far, 0.25):
        if not alive.any():
            break
        P = tip + tt * D[alive]
        blocked = ~sp.near(pas, P)
        idx = np.argwhere(alive)[blocked]
        depth[idx[:, 0], idx[:, 1]] = tt
        hitp[idx[:, 0], idx[:, 1]] = P[blocked]
        alive[idx[:, 0], idx[:, 1]] = False
    hit = np.isfinite(depth)
    H = hitp[hit]
    lab = sp.near(sp.lab, H).astype(int)
    for dd in (0.5, 1.0):                                     # mucosa over a labelled wall: look a little deeper
        z = lab == 0
        if z.any():
            lab[z] = sp.near(sp.lab, H[z] + dd * D[hit][z]).astype(int)
    L = np.zeros(X.shape, int); L[hit] = lab
    g = np.stack(np.gradient(ndi.gaussian_filter(sp.ct.astype(np.float32), 1.0)), -1)
    q = np.round(sp.kji(H)).astype(int); q = np.clip(q, 0, np.array(sp.ct.shape) - 1)
    nk = g[q[:, 0], q[:, 1], q[:, 2]]                           # (dk, dj, di) -> RAS (di, dj, dk)
    nrm = nk[:, ::-1]; nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6
    lam = np.abs((nrm * D[hit]).sum(1))
    img = np.zeros(X.shape + (3,))
    cols = np.array([kind_rgb(sp, k, c) for k, c in zip(lab, sp.near(sp.ct, H))])
    fall = 1.0 / (1.0 + (depth[hit] / 18.0) ** 2)
    img[hit] = cols * (0.25 + 0.75 * lam)[:, None] * (0.15 + 0.85 * fall)[:, None] * 1.25
    return np.clip(img, 0, 1), L, depth, inside, (h, X, Y)


def kind_rgb(sp, k, c):
    n = sp.table.get(int(k))
    if n is None:
        return KIND_RGB['bone' if c >= BT else 'tissue']
    gid = n.rsplit('.', 1)[0]
    if k <= 18:
        return KIND_RGB['cell']
    if gid == 's.orbit':
        return KIND_RGB['orbit']
    if gid in [s.rsplit('.', 1)[0] for s in SOFT_UNITS]:
        return KIND_RGB['soft']
    return KIND_RGB['wall']


def project(tip, v, iu, ir, h, P):
    d = P - tip
    z = d @ v
    with np.errstate(divide='ignore', invalid='ignore'):
        xs, ys = (d @ ir) / (z * h), (d @ iu) / (z * h)
    return xs, ys, np.linalg.norm(d, axis=1), z > 0


def seen(sp, x, st, tip, v, iu, ir, L, depth, inside, h):
    """Which `shows` (or their proxies) the view sees: a label hit by >= 0.5 % of the field's rays, or a sweep /
    landmark point in the field no more than 3 mm behind the visible surface there."""
    n = L.shape[0]
    counts = np.bincount(L[inside].ravel(), minlength=max(sp.table) + 1)
    tot = inside.sum()
    out = {}
    for gid in st['shows']:
        g = gid if x.sp.geometry(gid, x.side)[0] is not None else PROXY.get(gid)
        if g is None or x.sp.geometry(g, x.side)[0] is None:
            continue
        P, kind = x.sp.geometry(g, x.side)
        if kind == 'label':
            ks = [k for k, nm in sp.table.items() if nm.rsplit('.', 1)[0] == g]
            frac = counts[ks].sum() / tot
            out[gid] = 'seen' if frac >= 0.005 else 'not seen'
        else:
            xs, ys, dist, front = project(tip, v, iu, ir, h, P)
            inf = front & (xs ** 2 + ys ** 2 <= 1)
            if not inf.any():
                out[gid] = 'out of field'
                continue
            px = np.clip(((xs[inf] + 1) / 2 * (n - 1)).round().astype(int), 0, n - 1)
            py = np.clip(((1 - ys[inf]) / 2 * (n - 1)).round().astype(int), 0, n - 1)
            vis = dist[inf] <= depth[py, px] + 3.0
            out[gid] = 'seen' if vis.any() else 'behind the surface'
    return out
