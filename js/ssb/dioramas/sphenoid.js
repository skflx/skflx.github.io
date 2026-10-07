/* =============================================================
   dioramas/sphenoid.js — the sphenoid sinus and its neighbours (docs/ssb.md 6.1).

   One standalone, bilateral model. The sinus is a pair of superellipsoids
   (Wormald's building blocks) clipped by a flat roof and floor, a lateral
   wall and the lateral-recess line; the sella is a bone bulge in its roof;
   the ICAs, optic nerves and vidian canals are cylinders in bone canals;
   the intersinus septum is a thin prism. Nothing about exposure is written
   in: how much of a canal faces sinus air, how far the air reaches behind
   the sella, whether the septum touches a carotid canal, how high the
   vidian ridge stands — every one of those is READ OFF the solids that are
   drawn (kit.inside), and tools/test-ssb.mjs reads them off the same way
   (rules 0-9 of docs/ssb.md 6.1).

   Local frame: RAS mm, x = 0 midsagittal (x > 0 the patient's right),
   origin on the sphenoid face at the midline and the ostium height, y
   negative posteriorly, z up. Standalone, not registered to the specimen —
   the stage badge says "schematic".

   Every proportion below is SCHEMATIC unless it names a graph id; the
   graph gives classes and ranges, not a sphenoid's dimensions:
   - sinus: 1.5 mm behind the face, floor 12 mm and roof 9 mm from the
     ostium level; lateral limit 16 mm; posterior end per class (conchal
     -8, presellar -17.2, sellar -29, postsellar -40 mm);
   - sella: bulge 10 mm wide, anterior wall plane y = -18, posterior wall
     plane y = -30 (12 mm AP), floor underside 5.5 mm above the ostium
     level (so it stands 3.5 mm into the sinus); thickness 1.5 mm;
   - ICA: artery radius 2.3 mm, canal wall 0.6 mm; parasellar segment at
     y = -24, paraclival segment behind it; the optic nerve radius 1.7 mm,
     canal wall 0.5 mm; the vidian canal 1.1 mm nerve, 0.6 mm wall.
   The thresholds in the readout are conventions, not measurements:
   "protruding" is a canal with at least half of its circumference facing
   sinus air (DeLano's type 3 criterion carried over to the ICA, matching
   v.ica-protrusion's "often defined as more than half"); an indenting
   optic canal faces air over more than none and less than half.
   Impossible combinations degrade by the table in degrade() (rule 9).
   ============================================================= */
import { inside, band, superellipse, rasRoot, geometry, tubeGeometry, mesh, tag } from './kit.js?v=fa39e9b8';
import { CELL_TINT } from '../materials.js?v=b121b3b4';

export const TITLE = 'Sphenoid sinus';

/* ---------------- parameters ---------------- */

const PNEUM = [
    { value: 1, code: 'conchal' }, { value: 2, code: 'presellar' },
    { value: 3, code: 'sellar' }, { value: 4, code: 'postsellar' },
];
const OPTIC = [1, 2, 3, 4].map((v) => ({ value: v, code: String(v) }));
const VIDIAN = [1, 2, 3].map((v) => ({ value: v, code: String(v) }));

export const PARAMS = [
    { key: 'pneum', label: 'Pneumatization', unit: '', min: 1, max: 4, step: 1, default: 3, from: 'c.sphenoid-pneumatization', type: 'choice', options: PNEUM },
    { key: 'lateral_recess', label: 'Lateral recess', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.lateral-recess-pneumatization', type: 'toggle' },
    { key: 'lr_extent', label: 'extent lateral to the vidian–rotundum line', unit: 'mm', min: 0, max: 15, step: 0.5, default: 6, from: 'v.lateral-recess-pneumatization', requires: 'lateral_recess' },
    { key: 'clinoid_pneum', label: 'Pneumatized anterior clinoid', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.pneumatized-anterior-clinoid', type: 'toggle' },
    { key: 'septum_on_ica', label: 'Septum inserts on the ICA', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.intersinus-septum-on-ica', type: 'toggle' },
    { key: 'septum_shift', label: 'Septum shift from the midline (+ right)', unit: 'mm', min: -8, max: 8, step: 0.5, default: 0, from: 's.intersinus-septum' },
    { key: 'ica_protrusion', label: 'Protruding carotid prominence', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.ica-protrusion', type: 'toggle' },
    { key: 'ica_dehiscence', label: 'Dehiscent ICA', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.ica-dehiscence', type: 'toggle' },
    { key: 'intercarotid', label: 'Intercarotid distance', unit: 'mm', min: 4, max: 18, step: 0.5, default: 12, from: 'm.intercarotid-distance-narrowest' },
    { key: 'optic_type', label: 'Optic nerve (DeLano)', unit: '', min: 1, max: 4, step: 1, default: 1, from: 'c.delano-optic-nerve', type: 'choice', options: OPTIC },
    { key: 'optic_dehiscence', label: 'Dehiscent optic canal', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.optic-canal-dehiscence', type: 'toggle' },
    { key: 'onodi', label: 'Sphenoethmoidal (Onodi) cell', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.sphenoethmoidal-cell', type: 'toggle' },
    { key: 'vidian_type', label: 'Vidian canal', unit: '', min: 1, max: 3, step: 1, default: 2, from: 'c.vidian-canal-type', type: 'choice', options: VIDIAN },
];

/* Presets: one parameter each (the graph is silent on joint configurations). */
export const PRESETS = {
    'c.sphenoid-pneumatization': { conchal: { pneum: 1 }, presellar: { pneum: 2 }, sellar: { pneum: 3 }, postsellar: { pneum: 4 } },
    'c.delano-optic-nerve': { 1: { optic_type: 1 }, 2: { optic_type: 2 }, 3: { optic_type: 3 }, 4: { optic_type: 4, onodi: 1 } },
    'c.vidian-canal-type': { 1: { vidian_type: 1 }, 2: { vidian_type: 2 }, 3: { vidian_type: 3 } },
};

/* Camera views (RAS direction from the target to the camera, radiological
   conventions as in ethmoid-roof.js). Default: sagittal, which reads the
   pneumatization against the sella. */
export const VIEWS = {
    sagittal: { dir: [-1, 0, 0], up: [0, 0, 1] },
    axial: { dir: [0, 0, -1], up: [0, 1, 0] },
    coronal: { dir: [0, 1, 0], up: [0, 0, 1] },
    oblique: { dir: [-1, 0.5, 0.45], up: [0, 0, 1] },
};
export const VIEW_DEFAULT = 'sagittal';

/* ---------------- fixed schematic scale (mm) ---------------- */

const Y0 = -1.5;                          /* the lumen starts behind the anterior face */
const ZB = -12;                           /* floor plane */
const ZR = 9;                             /* roof plane */
const XSH = 16;                           /* lateral limit above the carotid band */
const ZL = 4;                             /* top of the carotid band (the lateral wall steps out above it) */
const YW = -19.5;                         /* the carotid band starts behind this */
const Y_END = { 1: -8, 2: -17.2, 3: -29, 4: -40 };
const SELLA = { x: 5, y: [-30, -18], z: [5.5, 24] };
const R_ICA = 2.3;
const T_ICA = 0.6;
const RC_ICA = R_ICA + T_ICA;
const Y_PARASELLAR = -24;
const R_NERVE = 1.7;
const T_NERVE = 0.5;
const RC_NERVE = R_NERVE + T_NERVE;
const OPTIC_A = [5.5, -17.5];             /* intracranial end of the canal (x, y) */
const OPTIC_B = [9.8, -9.5];              /* orbital end */
const R_VID = 1.1;
const T_VID = 0.6;
const RC_VID = R_VID + T_VID;
const VID_A = [11, -9];
const VID_B = [9.5, -27];
const ROTUNDUM = [16.5, -13, 4];          /* (x, y, z) */
const LINE_V = [VID_A[0], ZB + 1.5];      /* the vidian-rotundum line, in the (x, z) plane */
const LINE_R = [ROTUNDUM[0], ROTUNDUM[2]];
const N_SUPER = 4;
export const PROBE = 0.5;                 /* rule 0: the air must lie within the wall + this */
export const SEGMENTS = 9;                /* rule 0: cross sections per segment */
export const ANGLES = 64;                 /* rule 0: samples round each section */

const unit2 = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
const DL = unit2(LINE_V, LINE_R);
const LINE_N = [DL[1], -DL[0]];           /* lateral-and-down normal of the line */
/* s > 0: lateral to the vidian-rotundum line. */
export const lineSide = (x, z) => (Math.abs(x) - LINE_V[0]) * LINE_N[0] + (z - LINE_V[1]) * LINE_N[1];

/* ---------------- impossible combinations (rule 9) ---------------- */

/* One table: with pneum = conchal the later parameters have no effect (they
   take their defaults); with presellar, ica_protrusion and ica_dehiscence
   likewise; optic type 3 needs at least sellar (below it, type
   2 is drawn). Returns the parameters actually drawn and what was degraded. */
export function degrade(params) {
    const p = { ...params };
    const notes = [];
    const def = (k) => PARAMS.find((x) => x.key === k).default;
    if (p.pneum === 1) {
        for (const k of ['ica_protrusion', 'ica_dehiscence', 'optic_dehiscence', 'clinoid_pneum', 'septum_on_ica', 'lateral_recess']) {
            if (p[k] !== def(k)) { notes.push(k); p[k] = def(k); }
        }
        if (p.lateral_recess === 0) p.lr_extent = def('lr_extent');
        if (p.optic_type === 2 || p.optic_type === 3) { notes.push('optic_type'); p.optic_type = 1; }
        if (p.vidian_type === 1) { notes.push('vidian_type'); p.vidian_type = def('vidian_type'); }
    } else if (p.pneum === 2) {
        /* presellar: the air ends in front of the sella, so it never reaches the parasellar carotid */
        for (const k of ['ica_protrusion', 'ica_dehiscence']) {
            if (p[k] !== def(k)) { notes.push(k); p[k] = def(k); }
        }
        if (p.optic_type === 3) { notes.push('optic_type'); p.optic_type = 2; }
    } else if (p.optic_type === 3 && p.pneum < 3) {
        notes.push('optic_type');
        p.optic_type = 2;
    }
    if (p.optic_type === 4) p.onodi = 1;
    if (p.lateral_recess === 0) p.lr_extent = def('lr_extent');
    return { p, notes };
}

/* ---------------- the model: solids and the tests over them ---------------- */

const sgn = (side) => (side === 'R' ? 1 : -1);

/* Optic canal height by DeLano type (rule 4): the canal axis sits so that
   the share of its circumference facing the sinus is 0 (1, 4), a third
   (2, indenting) or two thirds (3, traversing). The probe lies WALL + 0.5
   mm out, so for a flat roof at ZR the share is 1 - acos(t) / pi with
   t = (ZR - z) / (radius + wall + 0.5). */
function opticHeight(type) {
    const reach = RC_NERVE + PROBE;
    if (type === 2) return ZR + 0.5 * reach;
    if (type === 3) return ZR - 0.5 * reach;
    return ZR + reach + 0.3;
}

/* Carotid canal wall plane: same relation, with t = +-0.5 (protruding or not). */
function carotidWallX(xa, protruding) {
    return xa + (protruding ? 0.5 : -0.5) * (RC_ICA + PROBE);
}

/* The lateral recess superellipsoid, placed so its lateral support is `lr`
   mm beyond the vidian-rotundum line (the support function of a
   superellipsoid of exponent n is the dual (n/(n-1)) norm of n . r). */
function recessSolid(lr, side) {
    const k = sgn(side);
    const r = [6.5, 5, 5.5];
    const q = N_SUPER / (N_SUPER - 1);
    const h = (Math.abs(LINE_N[0] * r[0]) ** q + Math.abs(LINE_N[1] * r[2]) ** q) ** (1 / q);
    const sc = lr - h;                                   /* wanted signed distance of the centre */
    const zc = -2;
    /* the point of the line at height zc, then out along the normal by sc */
    const t = (zc - LINE_V[1]) / DL[1];
    const base = [LINE_V[0] + DL[0] * t, LINE_V[1] + DL[1] * t];
    return { kind: 'super', c: [k * (base[0] + LINE_N[0] * sc), -8.5, base[1] + LINE_N[1] * sc], r, n: N_SUPER };
}

export function model(params) {
    const { p, notes } = degrade(params);
    const solids = [];                                   /* { id, side, role, shape, ... } */
    const add = (e) => { solids.push(e); return e; };

    const yEnd = Y_END[p.pneum];
    const xa = p.intercarotid / 2 + R_ICA;
    const xw = carotidWallX(xa, p.ica_protrusion === 1);
    const cy = (Y0 + yEnd) / 2;
    const ry = (Y0 - yEnd) / 2;
    const lumens = [];
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        const shape = { kind: 'super', c: [k * 8.25, cy, -1.5], r: [8.75, ry, 12.5], n: N_SUPER, zMin: ZB, zMax: ZR };
        lumens.push(shape);
        add({ id: 's.sphenoid-sinus', side, role: 'air', shape });
    }

    /* The lateral-recess line is a plane: the main lumen never crosses it. */
    const mainLumen = (x, y, z) => {
        if (!(inside(lumens[0], x, y, z) || inside(lumens[1], x, y, z))) return false;
        if (lineSide(x, z) > 0) return false;
        const ax = Math.abs(x);
        if (y < YW && z < ZL) return ax <= xw;
        return ax <= XSH;
    };

    /* ----- bone that excludes air ----- */
    add({ id: 's.sella-turcica', side: 'M', role: 'bone', shape: { kind: 'box', min: [-SELLA.x, SELLA.y[0], SELLA.z[0]], max: [SELLA.x, SELLA.y[1], SELLA.z[1]] } });

    /* septum: midline at the rostrum, deviating (and, optionally, running onto the ICA canal) */
    const shift = p.septum_shift;
    const sg = shift >= 0 ? 1 : -1;
    const onIca = p.septum_on_ica === 1 && p.pneum >= 3;
    const yS = Math.max(-19, yEnd + 3);
    const end = onIca ? [sg * (xa - RC_ICA + 0.3), Y_PARASELLAR] : [shift, yS];
    const mid = [shift, Y0 + 0.4 * (end[1] - Y0)];
    const septumPoly = band([[0, Y0], mid, end], 0.8, 1);
    const septum = { kind: 'prism', axis: 'z', poly: septumPoly, from: ZB, to: ZR };
    add({ id: 's.intersinus-septum', side: 'M', role: 'bone', shape: septum });

    /* ICA: artery + canal wall (a dehiscence is a gap in the wall facing the sinus), per side */
    const ica = {};
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        const d = [-k, 0, 0];                                   /* the sinus lies medial to the canal */
        const segs = {
            parasellar: { a: [k * xa, Y_PARASELLAR, -8], b: [k * xa, Y_PARASELLAR, 3.5] },
            paraclival: { a: [k * xa, -38, -6.5], b: [k * xa, Y_PARASELLAR + 3, -6.5] },
        };
        ica[side] = {};
        for (const [name, s] of Object.entries(segs)) {
            const artery = { kind: 'cyl', a: s.a, b: s.b, r: R_ICA };
            const wall = { kind: 'cyl', a: s.a, b: s.b, r: RC_ICA, ...(p.ica_dehiscence === 1 ? { arc: { d, half: Math.PI / 2 } } : {}) };
            add({ id: 's.internal-carotid-artery', side, role: 'artery', shape: artery, seg: name });
            add({ id: 's.carotid-prominence', side, role: 'bone', shape: wall, seg: name, canal: { artery, dehiscent: p.ica_dehiscence === 1, d } });
            ica[side][name] = { artery, wall };
        }
    }

    /* optic nerve in its canal; type 4: the canal runs in the lateral wall of the Onodi cell */
    const zo = opticHeight(p.optic_type === 4 ? 1 : p.optic_type);
    const onodi = p.onodi === 1;
    const optic = {};
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        const a = [k * OPTIC_A[0], OPTIC_A[1], zo];
        const b = [k * OPTIC_B[0], OPTIC_B[1], zo];
        const dir = p.optic_type === 4 ? [-k * 0.6, 0, 0.8] : [0, 0, -1];
        const artery = { kind: 'cyl', a, b, r: R_NERVE };
        const wall = { kind: 'cyl', a, b, r: RC_NERVE, ...(p.optic_dehiscence === 1 ? { arc: { d: dir, half: Math.PI / 2 } } : {}) };
        add({ id: 's.optic-nerve', side, role: 'nerve', shape: artery });
        add({ id: 's.optic-canal', side, role: 'bone', shape: wall, canal: { artery, dehiscent: p.optic_dehiscence === 1, d: dir } });
        optic[side] = { artery, wall };
    }

    /* Onodi cell: medial and superior to the nerve, which runs in its lateral wall */
    const cells = {};
    if (onodi) {
        for (const side of ['R', 'L']) {
            const k = sgn(side);
            const shape = { kind: 'super', c: [k * 4.2, -13.5, opticHeight(1) + 2.2], r: [4, 6, 3.4], n: 3 };
            cells[side] = shape;
            add({ id: 'v.sphenoethmoidal-cell', side, role: 'air', shape, cell: true });
        }
    }

    /* vidian canal: a ridge over the floor by type (1 above it, 2 on it, 3 embedded) */
    const zv = ZB + { 1: 3.4 - RC_VID, 2: 1.5 - RC_VID, 3: -1 - RC_VID }[p.vidian_type];
    const vidian = {};
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        const shape = { kind: 'cyl', a: [k * VID_A[0], VID_A[1], zv], b: [k * VID_B[0], VID_B[1], zv], r: RC_VID };
        add({ id: 's.vidian-canal', side, role: 'bone', shape });
        vidian[side] = shape;
    }

    /* anterior clinoid with its optic strut; pneumatized: air inside, through a channel in the strut */
    const clin = {};
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        const bone = { kind: 'super', c: [k * 8.5, -20.5, 13], r: [3, 3.5, 2.5], n: 3 };
        const strut = { kind: 'cyl', a: [k * 8, -19.5, ZR + 0.2], b: [k * 8.5, -20.5, 12.5], r: 1.3 };
        add({ id: 's.anterior-clinoid-process', side, role: 'bone', shape: bone });
        add({ id: 's.optic-strut', side, role: 'bone', shape: strut });
        clin[side] = { bone, strut };
        if (p.clinoid_pneum === 1) {
            const air = { kind: 'super', c: [k * 8.5, -20.5, 13], r: [2, 2.5, 1.5], n: 3 };
            const channel = { kind: 'cyl', a: [k * 8, -19.5, ZR - 0.5], b: [k * 8.5, -20.5, 12.5], r: 0.8 };
            add({ id: 'v.pneumatized-anterior-clinoid', side, role: 'air', shape: air });
            add({ id: 'v.pneumatized-anterior-clinoid', side, role: 'carve', shape: channel });
            clin[side].air = air;
            clin[side].channel = channel;
        }
    }

    /* lateral recess */
    const recess = {};
    if (p.lateral_recess === 1) {
        for (const side of ['R', 'L']) {
            const shape = recessSolid(p.lr_extent, side);
            recess[side] = shape;
            add({ id: 's.sphenoid-lateral-recess', side, role: 'air', shape, recess: true });
        }
    }

    /* ----- the implicit tests ----- */
    const bones = solids.filter((s) => s.role === 'bone');
    const carves = solids.filter((s) => s.role === 'carve');
    const extraAir = solids.filter((s) => s.role === 'air' && (s.cell || s.recess || s.id === 'v.pneumatized-anterior-clinoid'));
    const isBone = (x, y, z) => {
        if (!bones.some((s) => inside(s.shape, x, y, z))) return false;
        return !carves.some((s) => inside(s.shape, x, y, z));
    };
    /* 'sinus' | 'cell' | 'recess' | 'clinoid' | null: which air space holds a point */
    const which = (x, y, z) => {
        if (isBone(x, y, z)) return null;
        if (mainLumen(x, y, z)) return 'sinus';
        for (const s of extraAir) if (inside(s.shape, x, y, z)) return s.cell ? 'cell' : s.recess ? 'recess' : 'clinoid';
        return null;
    };
    const air = (x, y, z) => which(x, y, z) !== null;

    return { p, notes, solids, air, which, isBone, geometry: { xa, xw, yEnd, septum, onIca, end, zo, zv }, ica, optic, vidian, clin, recess, cells, onodi };
}

/* ---------------- rule 0: facing air ---------------- */

/* The share of a canal segment's circumference whose outward normal reaches
   sinus air within the canal wall's thickness + PROBE, at SEGMENTS cross
   sections along it, ANGLES samples each. A dehiscence sets the wall to 0 on
   the arc it spans. `kinds` restricts which air counts ('sinus', 'cell', …). */
export function facing(m, seg, kinds = null) {
    const { artery, dehiscent, d, wallT } = seg;
    const u = [artery.b[0] - artery.a[0], artery.b[1] - artery.a[1], artery.b[2] - artery.a[2]];
    const len = Math.hypot(...u);
    u[0] /= len; u[1] /= len; u[2] /= len;
    /* two unit vectors across the axis */
    const ref = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const e1 = cross(u, ref);
    const l1 = Math.hypot(...e1);
    e1[0] /= l1; e1[1] /= l1; e1[2] /= l1;
    const e2 = cross(u, e1);
    const dl = d ? Math.hypot(...d) : 1;
    let hits = 0;
    let n = 0;
    for (let i = 0; i < SEGMENTS; i++) {
        const t = ((i + 0.5) / SEGMENTS) * len;
        const c = [artery.a[0] + u[0] * t, artery.a[1] + u[1] * t, artery.a[2] + u[2] * t];
        for (let j = 0; j < ANGLES; j++) {
            const th = (j / ANGLES) * Math.PI * 2;
            const nrm = [0, 1, 2].map((q) => e1[q] * Math.cos(th) + e2[q] * Math.sin(th));
            const exposed = dehiscent && d && (nrm[0] * d[0] + nrm[1] * d[1] + nrm[2] * d[2]) / dl > 0;
            const reach = (exposed ? 0 : wallT) + PROBE;
            const rr = artery.r + reach;
            const w = m.which(c[0] + nrm[0] * rr, c[1] + nrm[1] * rr, c[2] + nrm[2] * rr);
            n++;
            if (w && (!kinds || kinds.includes(w))) hits++;
        }
    }
    return hits / n;
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/* The canals, each with its wall thickness, for rule 0 and the readout. */
export function canals(m) {
    const out = [];
    for (const side of ['R', 'L']) {
        for (const seg of ['parasellar', 'paraclival']) {
            const s = m.solids.find((x) => x.id === 's.carotid-prominence' && x.side === side && x.seg === seg);
            out.push({ id: 'ica', side, seg, ...s.canal, wallT: T_ICA });
        }
        const o = m.solids.find((x) => x.id === 's.optic-canal' && x.side === side);
        out.push({ id: 'optic', side, seg: 'canal', ...o.canal, wallT: T_NERVE });
    }
    return out;
}

/* Everything the HUD and the hazards need, computed once per build. */
function exposures(m) {
    const out = { ica: {}, optic: {} };
    for (const c of canals(m)) {
        if (c.id === 'ica') out.ica[c.side + c.seg] = facing(m, c, ['sinus']);
        else out.optic[c.side] = { sinus: facing(m, c, ['sinus']), cell: facing(m, c, ['cell']) };
    }
    return out;
}

/* ---------------- classification and readout ---------------- */

export function classify(params) {
    const { p } = degrade(params);
    return [
        { cls: 'c.sphenoid-pneumatization', code: PNEUM[p.pneum - 1].code },
        { cls: 'c.delano-optic-nerve', code: String(p.optic_type) },
        { cls: 'c.vidian-canal-type', code: String(p.vidian_type) },
    ];
}

/* HUD lines: segments are text, { ref, text? } (a graph link) or { strong }. */
export function readout(params, data, names) {
    const d = data.derived;
    const lines = classify(params).map((c) => [
        { ref: c.cls, text: names.shortName(c.cls) }, ': ', { strong: `${c.code} ${names.classLabel(c.cls, c.code)}` },
    ]);
    const n = (v) => String(Number(v.toFixed(1)));
    lines.push([{ ref: 'v.intersinus-septum-on-ica', text: 'Septum meets the ICA prominence' }, ': ', { strong: d.septumOnIca ? 'yes' : 'no' }]);
    lines.push([{ ref: 'm.intercarotid-distance-narrowest', text: 'Intercarotid window' }, `: ${n(d.intercarotid)} mm`]);
    const worst = Math.max(d.icaFacing, 0);
    lines.push([{ ref: 's.carotid-prominence', text: 'ICA' }, ': ',
        { strong: d.icaDehiscent ? 'dehiscent' : worst >= 0.5 ? 'protruding' : worst > 0 ? 'indenting the sinus' : 'not in the sinus wall' },
        d.icaDehiscent ? [' · ', { ref: 'v.ica-dehiscence', text: 'no bone over it' }] : '']);
    if (d.notes.length) lines.push([`Not drawn together with this pneumatization/optic type, so left at its default: ${d.notes.join(', ')}`]);
    return lines.map((l) => l.flat());
}

/* ---------------- build ---------------- */

export function build(THREE, params) {
    const m = model(params);
    const { p } = m;
    const root = rasRoot(THREE);
    const add = (obj) => { root.add(obj); return obj; };
    const bone = { kind: 'bone', cut: true };
    const ghost = { kind: 'bone', ghost: true };
    const g = m.geometry;
    const ex = exposures(m);

    const sol = (id, side) => m.solids.filter((s) => s.id === id && s.side === side);

    /* the sinus */
    for (const side of ['R', 'L']) {
        add(mesh(THREE, geometry(THREE, sol('s.sphenoid-sinus', side)[0].shape), 's.sphenoid-sinus', side, { kind: 'space', space: true }));
    }

    /* anterior face with the two ostia, and the rostrum */
    const face = { kind: 'prism', axis: 'y', from: Y0, to: 0, poly: [[-17, ZB - 2], [17, ZB - 2], [17, ZR + 4], [-17, ZR + 4]],
        holes: [superellipse(-4.5, 0, 1.6, 2, 2, 28), superellipse(4.5, 0, 1.6, 2, 2, 28)] };
    add(mesh(THREE, geometry(THREE, face), 's.sphenoid-face', 'M', ghost));
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [-0.8, 0, ZB], max: [0.8, 4, ZR + 2] }), 's.sphenoid-rostrum', 'M', bone));
    for (const side of ['R', 'L']) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 10, 40));
        ring.scale.set(1.7, 2.1, 1);
        ring.position.set(sgn(side) * 4.5, Y0 / 2, 0);
        add(tag(ring, 's.sphenoid-ostium', side, { kind: 'bone-cut' }));
    }

    /* floor, roof (planum + tuberculum), sella, dorsum, clivus: walls, drawn see-through */
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [-17, -46, ZB - 4], max: [17, Y0, ZB] }), 's.sphenoid-floor', 'M', ghost));
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'x', from: -17, to: 17,
        poly: band([[Y0, ZR], [-14, ZR], [-18, ZR + 1.5]], 1.5, 1) }), 's.planum-sphenoidale', 'M', ghost));
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [-SELLA.x, -19.5, ZR], max: [SELLA.x, -17.5, ZR + 8] }), 's.tuberculum-sellae', 'M', bone));
    add(mesh(THREE, geometry(THREE, m.solids.find((s) => s.id === 's.sella-turcica').shape), 's.sella-turcica', 'M', bone));
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [-SELLA.x, -31.5, SELLA.z[0]], max: [SELLA.x, -30, 22] }), 's.dorsum-sellae', 'M', ghost));
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'x', from: -9, to: 9,
        poly: [[-31.5, 22], [-31.5, ZB - 4], [-46, ZB - 4], [-46, -8]] }), 's.clivus', 'M', ghost));

    /* lateral walls: the carotid band steps out above the ICA */
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        const wall = new THREE.Group();
        wall.add(new THREE.Mesh(geometry(THREE, { kind: 'box', min: [Math.min(k * g.xw, k * (g.xw + 1)), -46, ZB - 4], max: [Math.max(k * g.xw, k * (g.xw + 1)), YW, ZL] })));
        wall.add(new THREE.Mesh(geometry(THREE, { kind: 'box', min: [Math.min(k * XSH, k * (XSH + 1)), YW, ZL], max: [Math.max(k * XSH, k * (XSH + 1)), Y0, ZR + 2] })));
        wall.add(new THREE.Mesh(geometry(THREE, { kind: 'box', min: [Math.min(k * XSH, k * (XSH + 1)), -46, ZL], max: [Math.max(k * XSH, k * (XSH + 1)), YW, ZR + 2] })));
        add(tag(wall, 's.sphenoid-lateral-wall', side, ghost));
    }

    /* septum */
    add(mesh(THREE, geometry(THREE, g.septum), 's.intersinus-septum', 'M', bone,
        g.onIca ? { hazards: ['h.septum-avulsion-ica'] } : {}));

    /* ICAs */
    for (const side of ['R', 'L']) {
        const haz = [];
        const share = Math.max(ex.ica[side + 'parasellar'], ex.ica[side + 'paraclival']);
        if (share > 0 || p.ica_dehiscence === 1) haz.push('h.ica-injury-sphenoidotomy');
        if (g.onIca && side === (g.end[0] >= 0 ? 'R' : 'L')) haz.push('h.septum-avulsion-ica');
        const arteries = new THREE.Group();
        const walls = new THREE.Group();
        for (const s of sol('s.internal-carotid-artery', side)) arteries.add(new THREE.Mesh(geometry(THREE, s.shape)));
        for (const s of sol('s.carotid-prominence', side)) walls.add(new THREE.Mesh(geometry(THREE, s.shape)));
        add(tag(arteries, 's.internal-carotid-artery', side, { kind: 'artery' }, haz.length ? { hazards: haz } : {}));
        add(tag(walls, 's.carotid-prominence', side, { kind: 'bone', ghost: true, doubleSide: true }));
    }

    /* optic nerves and canals */
    for (const side of ['R', 'L']) {
        const haz = [];
        const o = ex.optic[side];
        if (o.sinus > 0 || (p.optic_dehiscence === 1 && p.optic_type !== 4)) haz.push('h.optic-nerve-injury-sphenoid');
        if (m.onodi) haz.push('h.optic-nerve-injury-onodi');
        add(mesh(THREE, geometry(THREE, sol('s.optic-nerve', side)[0].shape), 's.optic-nerve', side, { kind: 'nerve' }, haz.length ? { hazards: haz } : {}));
        add(mesh(THREE, geometry(THREE, sol('s.optic-canal', side)[0].shape), 's.optic-canal', side, { kind: 'bone', ghost: true, doubleSide: true }));
    }

    /* Onodi cell */
    for (const side of ['R', 'L']) {
        const c = sol('v.sphenoethmoidal-cell', side)[0];
        if (c) add(mesh(THREE, geometry(THREE, c.shape), 'v.sphenoethmoidal-cell', side, { kind: 'air-cell', tint: CELL_TINT['v.sphenoethmoidal-cell'] || 'cell-ethmoid', translucent: true }));
    }

    /* vidian canal (hatched where it stands in the sinus: the ICA lies at its end), V2 and the rotundum */
    for (const side of ['R', 'L']) {
        const k = sgn(side);
        add(mesh(THREE, geometry(THREE, sol('s.vidian-canal', side)[0].shape), 's.vidian-canal', side, bone,
            p.vidian_type <= 2 ? { hazards: ['h.ica-injury-vidian'] } : {}));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 10, 36));
        ring.scale.set(1.3, 1.3, 1);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(k * ROTUNDUM[0], ROTUNDUM[1], ROTUNDUM[2]);
        add(tag(ring, 's.foramen-rotundum', side, { kind: 'bone-cut' }));
        add(mesh(THREE, tubeGeometry(THREE, [[k * ROTUNDUM[0], ROTUNDUM[1], ROTUNDUM[2]], [k * (ROTUNDUM[0] + 2.5), ROTUNDUM[1] + 4, ROTUNDUM[2] + 1], [k * (ROTUNDUM[0] + 4), ROTUNDUM[1] + 9, ROTUNDUM[2] - 1]], 0.8),
            's.maxillary-nerve', side, { kind: 'nerve' }));
    }

    /* lateral recess */
    for (const side of ['R', 'L']) {
        const r = sol('s.sphenoid-lateral-recess', side)[0];
        if (r) add(mesh(THREE, geometry(THREE, r.shape), 's.sphenoid-lateral-recess', side, { kind: 'space', space: true }));
    }

    /* anterior clinoid, strut, and its air */
    for (const side of ['R', 'L']) {
        add(mesh(THREE, geometry(THREE, m.clin[side].bone), 's.anterior-clinoid-process', side, ghost));
        add(mesh(THREE, geometry(THREE, m.clin[side].strut), 's.optic-strut', side, ghost));
        if (m.clin[side].air) {
            add(mesh(THREE, geometry(THREE, m.clin[side].air), 'v.pneumatized-anterior-clinoid', side, { kind: 'space', space: true }));
        }
    }

    const icaFacing = Math.max(...Object.values(ex.ica));
    root.userData.derived = {
        notes: m.notes, intercarotid: p.intercarotid, septumOnIca: g.onIca, icaFacing, icaDehiscent: p.ica_dehiscence === 1,
        exposure: ex, yEnd: g.yEnd,
    };
    root.userData.focus = { center: [0, -17, 0], radius: 31 };
    return root;
}
