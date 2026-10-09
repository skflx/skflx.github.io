/* =============================================================
   dioramas/ethmoid-roof.js — coronal slab through the anterior ethmoid.

   Both sides of the anterior skull base at the level where the anterior
   ethmoidal artery crosses the roof: crista galli and perpendicular plate
   (midline), cribriform plate, lateral lamella, fovea ethmoidalis, the
   olfactory fossa (space) with its dura, the middle turbinate's vertical
   attachment, a representative anterior ethmoid cell column, the lamina
   papyracea and the orbit (a simple volume), and the AEA with its canal.

   Every danger-relevant dimension follows directly from a parameter:
   - lateral lamella height = olfactory fossa depth (Keros), per side
     (c.keros: depth measured cribriform plate -> fovea; m.keros-depth).
     The cribriform plate is level on both sides; the asymmetry parameter
     lowers or raises the LEFT roof, and with it the left fossa depth, as
     v.asymmetric-ethmoid-roof defines ("with corresponding differences in
     olfactory fossa depth").
   - lateral lamella angle to the cribriform plane = Gera angle (c.gera);
     the lamella runs laterally by depth / tan(angle), so a deep, flat
     lamella extends under the ethmoid, as c.gera class III says. The fovea
     keeps at least 3 mm; if the lamella would reach closer than that to
     the lamina, the labyrinth is widened to fit and the readout says so.
   - AEA drop = vertical distance from the roof's underside to the canal's
     centre (m.aea-mesentery-drop; its note says studies differ on centre vs
     upper edge — this model uses the centre). 0 = canal in the roof.
   - Supraorbital ethmoid cell: pneumatizes over the orbit, and the AEA
     then hangs at least 3.7 mm below the roof — the mean drop measured in
     sides with a large supraorbital cell (m.aea-mesentery-drop; in that
     cadaver series the artery hung below the roof in all 10 such sides,
     v.aea-in-mesentery).

   Fixed, schematic scale (the graph is silent; these make no claim):
   cribriform plate 4 mm wide per side (m.cribriform-length says "only a
   few millimetres"), lamina 15 mm from the midline, crista galli apex 22 mm
   above the cribriform plate, slab 14 mm thick, drawn bone thicknesses
   ordered as the graph describes them (lateral lamella thinnest,
   s.lateral-lamella; fovea thicker, s.fovea-ethmoidalis) but sized to be
   visible, not measured.

   Local frame: RAS mm, x = 0 midsagittal, z = 0 the upper surface of the
   cribriform plate, y = 0 the slab's mid-plane. The cell column fills the
   back half of the slab and the AEA crosses the front half obliquely, from
   posterolateral to anteromedial (s.anterior-ethmoidal-artery), so the
   artery and its drop are seen through the cut face rather than hidden in
   the cells.
   ============================================================= */
import { band, superellipse, rasRoot, geometry, tubeGeometry, ribbonGeometry, mesh, tag } from './kit.js?v=aace6cfc';

export const TITLE = 'Ethmoid roof';

export const PARAMS = [
    { key: 'keros', label: 'Olfactory fossa depth (Keros)', unit: 'mm', min: 1, max: 16, step: 0.5, default: 5.5, from: 'c.keros' },
    /* c.gera gives >80, 45–80 and <45 degrees and no lower bound; 25 keeps the
       slider in a range where the lamella still fits the labyrinth. */
    { key: 'gera', label: 'Lateral lamella angle (Gera)', unit: '°', min: 25, max: 90, step: 0.5, default: 62.5, from: 'c.gera' },
    /* v.asymmetric-ethmoid-roof gives a prevalence, not a magnitude; the range
       spans a Keros class either way. Positive = left roof lower. */
    { key: 'asym', label: 'Left roof lower than right', unit: 'mm', min: -6, max: 6, step: 0.5, default: 0, from: 'v.asymmetric-ethmoid-roof' },
    { key: 'aea', label: 'AEA below the roof (0 = in the roof canal)', unit: 'mm', min: 0, max: 8, step: 0.5, default: 0, from: 'm.aea-mesentery-drop' },
    { key: 'soec', label: 'Supraorbital ethmoid cell', unit: '', min: 0, max: 1, step: 1, default: 0, from: 'v.supraorbital-ethmoid-cell', type: 'toggle' },
];

/* Class boundaries, read from the graph's criteria:
   c.keros  I 1–3 mm, II 4–7 mm, III 8–16 mm (whole millimetres, as measured)
   c.gera   I > 80°, II 45–80°, III < 45° */
export const KEROS = [{ code: 'I', lo: 1, hi: 3 }, { code: 'II', lo: 4, hi: 7 }, { code: 'III', lo: 8, hi: 16 }];
export const GERA = [{ code: 'I', above: 80 }, { code: 'II', from: 45, to: 80 }, { code: 'III', below: 45 }];

export function kerosClass(depth) {
    const mm = Math.round(depth);
    return mm <= 3 ? 'I' : mm <= 7 ? 'II' : 'III';
}
export function geraClass(angle) {
    return angle > 80 ? 'I' : angle >= 45 ? 'II' : 'III';
}

/* Presets: the middle of each class's criterion range (Gera I: 80–90, the
   vertical being the geometric limit; Gera III: below 45 with no published
   floor, so 35). A preset sets only its own classification's parameter. */
export const PRESETS = {
    'c.keros': { I: { keros: 2 }, II: { keros: 5.5 }, III: { keros: 12 } },
    'c.gera': { I: { gera: 85 }, II: { gera: 62.5 }, III: { gera: 35 } },
};

/* Camera views, RAS direction from the target to the camera, in the
   radiological conventions: coronal seen from in front (patient's right on
   screen left), sagittal from the patient's left (anterior on screen left),
   axial from below (anterior up). Default: a true coronal view — the plane
   Keros and Gera are measured on. */
export const VIEWS = {
    coronal: { dir: [0, 1, 0], up: [0, 0, 1] },
    sagittal: { dir: [-1, 0, 0], up: [0, 0, 1] },
    axial: { dir: [0, 0, -1], up: [0, 1, 0] },
    oblique: { dir: [0.35, 1, -0.28], up: [0, 0, 1] },
};
export const VIEW_DEFAULT = 'coronal';

/* ---------------- fixed scale (mm) ---------------- */

const SLAB = 7;              /* half-thickness of the coronal slab */
const CG_HALF = 1.5;         /* crista galli half-width at its base */
const CG_APEX = 22;
const CRIB_W = 4;            /* cribriform plate width per side */
const X_LP = 15;             /* lamina papyracea, from the midline */
const FOVEA_MIN = 3;
const T_CRIB = 1;
const T_LAM = 0.9;
const T_FOV = 1.6;
const T_LP = 0.7;
const T_DURA = 0.35;
const LP_H = 26;             /* lamina drawn below the roof */
const SOEC_W = 11;           /* supraorbital cell's reach over the orbit */
const SOEC_H = 7;
const AEA_R = 0.55;
const CELL_Y = [-SLAB + 0.6, -1.2]; /* the cell column: back half of the slab */
const AEA_Y = [-0.4, 5.6];          /* the AEA crosses the front half, lamina -> lamella */
const CANAL_R = 1.1;
export const AEA_DROP_WITH_SOEC = 3.7;   /* m.aea-mesentery-drop, mean */

const XC = CG_HALF + CRIB_W; /* cribriform plate's lateral edge = lamella foot = MT attachment */

/* Every derived dimension, per side. Pure; build() and the readout use it. */
export function derive(params) {
    const rad = (params.gera * Math.PI) / 180;
    const cot = Math.abs(Math.cos(rad)) < 1e-9 ? 0 : Math.cos(rad) / Math.sin(rad);
    const drop = params.soec === 1 ? Math.max(params.aea, AEA_DROP_WITH_SOEC) : params.aea;
    const sides = {};
    for (const [side, depth] of [['R', params.keros], ['L', params.keros - params.asym]]) {
        const h = Math.min(16, Math.max(1, depth));
        const run = h * cot;                        /* lamella's lateral run */
        const w = T_LAM / Math.sin(rad);            /* its horizontal thickness */
        const xTop = XC + run;
        const xLP = Math.max(X_LP, xTop + w + FOVEA_MIN + T_LP);
        const roofUnder = h - T_FOV;                /* underside of the fovea */
        sides[side] = {
            depth: h, run, w, sin: Math.sin(rad), xTop, xLP, roofUnder, widened: xLP > X_LP + 1e-6,
            aeaZ: roofUnder - drop,                  /* canal centre */
        };
    }
    return { angle: params.gera, drop, soec: params.soec === 1, sides, xc: XC };
}

/* ---------------- readouts ---------------- */

export function classify(params) {
    const d = derive(params);
    return [
        { cls: 'c.keros', side: 'R', code: kerosClass(d.sides.R.depth), value: d.sides.R.depth, unit: 'mm' },
        { cls: 'c.keros', side: 'L', code: kerosClass(d.sides.L.depth), value: d.sides.L.depth, unit: 'mm' },
        { cls: 'c.gera', code: geraClass(params.gera), value: params.gera, unit: '°' },
    ];
}

/* HUD lines: segments are text, { ref, text? } (a graph link) or { strong }.
   `names` resolves class labels from the graph. */
export function readout(params, data, names) {
    const d = data.derived || derive(params);
    const n = (v) => String(Number(v.toFixed(1)));
    const lines = classify(params).map((c) => [
        { ref: c.cls, text: names.shortName(c.cls) }, c.side ? ` ${c.side}` : '',
        `: ${n(c.value)}${c.unit === '°' ? '°' : ' ' + c.unit} → `, { strong: `${c.code} ${names.classLabel(c.cls, c.code)}` },
    ]);
    lines.push(d.drop > 0
        ? [{ ref: 's.anterior-ethmoidal-artery', text: 'AEA' }, ` ${n(d.drop)} mm below the roof, in a `, { ref: 'v.aea-in-mesentery', text: 'mesentery' },
            d.soec && params.aea < AEA_DROP_WITH_SOEC ? ' (held down by the supraorbital cell)' : '']
        : [{ ref: 's.anterior-ethmoidal-artery', text: 'AEA' }, ' in its canal in the roof']);
    if (d.sides.R.widened || d.sides.L.widened) lines.push(['Labyrinth widened so this deep, flat lamella fits (schematic)']);
    return lines;
}

/* ---------------- build ---------------- */

export function build(THREE, params) {
    const d = derive(params);
    const root = rasRoot(THREE);
    const slab = (poly) => ({ kind: 'prism', axis: 'y', from: -SLAB, to: SLAB, poly });
    const bone = { kind: 'bone', cut: true };
    const add = (obj) => { root.add(obj); return obj; };

    /* Midline: crista galli above, perpendicular plate below. */
    add(mesh(THREE, geometry(THREE, slab([[-CG_HALF, -T_CRIB], [CG_HALF, -T_CRIB], [CG_HALF, 0], [0.45, CG_APEX - 0.6],
        [0, CG_APEX], [-0.45, CG_APEX - 0.6], [-CG_HALF, 0]])), 's.crista-galli', 'M', bone));
    add(mesh(THREE, geometry(THREE, slab([[-0.6, -24], [0.6, -24], [0.6, -T_CRIB], [-0.6, -T_CRIB]])), 's.perpendicular-plate', 'M', bone));

    for (const side of ['R', 'L']) buildSide(THREE, add, d, side, slab, bone);

    root.userData.derived = d;
    /* Frame the roof, not the orbits: centre between plate and roof. */
    const top = Math.max(d.sides.R.depth, d.sides.L.depth);
    root.userData.focus = { center: [0, 0, top / 2 - 4], radius: Math.max(d.sides.R.xLP, d.sides.L.xLP) + 4 };
    return root;
}

function buildSide(THREE, add, d, side, slab, bone) {
    const s = d.sides[side];
    const k = side === 'R' ? 1 : -1;               /* RAS x of the right side is positive */
    const X = (pts) => pts.map(([x, z]) => [k * x, z]);
    const cot = s.run / s.depth;
    const cgAt = (z) => CG_HALF * (1 - z / CG_APEX);   /* crista half-width at height z */

    /* Cribriform plate: from the crista to the lamella foot. */
    add(mesh(THREE, geometry(THREE, slab(X([[CG_HALF, -T_CRIB], [XC, -T_CRIB], [XC, 0], [CG_HALF, 0]]))),
        's.cribriform-plate', side, bone));

    /* Lateral lamella: its intracranial face passes through (XC, 0) at the
       Gera angle and rises exactly to the fovea (height = Keros depth). A
       hazard site: hatched, carrying the graph's hazard ids. */
    const footX = XC - T_CRIB * cot;
    add(mesh(THREE, geometry(THREE, slab(X([[footX, -T_CRIB], [s.xTop, s.depth], [s.xTop + s.w, s.depth], [footX + s.w, -T_CRIB]]))),
        's.lateral-lamella', side, bone, { hazards: ['h.lateral-lamella-perforation'] }));

    /* Fovea ethmoidalis: lamella top to the lamina (over the supraorbital
       cell too, when present — the cell pneumatizes under the orbital roof). */
    const xRoofEnd = d.soec ? s.xLP + SOEC_W + 1 : s.xLP;
    add(mesh(THREE, geometry(THREE, slab(X([[s.xTop + s.w, s.roofUnder], [s.xTop + s.w, s.depth], [xRoofEnd, s.depth], [xRoofEnd, s.roofUnder]]))),
        's.fovea-ethmoidalis', side, bone));

    /* Dura lining the anterior cranial fossa over roof, lamella, plate, crista. */
    const surface = [[xRoofEnd, s.depth], [s.xTop, s.depth], [XC, 0], [CG_HALF, 0], [cgAt(Math.min(s.depth + 4, CG_APEX - 2)), Math.min(s.depth + 4, CG_APEX - 2)]];
    /* (band's side -1 is the intracranial side for this lateral-to-medial walk) */
    add(mesh(THREE, geometry(THREE, slab(X(band(surface, T_DURA, -1)))), 's.anterior-cranial-fossa-dura', side, { kind: 'dura' }));

    /* Olfactory fossa: the trough over the plate, inside the dura-lined lamella, up to the roof level. */
    const zf = T_DURA + 0.05;
    const inner = (z) => XC + z * cot - T_DURA / s.sin - 0.05;
    const fossa = [[cgAt(zf) + T_DURA, zf], [inner(zf), zf], [inner(s.depth), s.depth], [cgAt(s.depth) + T_DURA, s.depth]];
    add(mesh(THREE, geometry(THREE, slab(X(fossa))), 's.olfactory-fossa', side, { kind: 'space', space: true }));

    /* Middle turbinate's vertical attachment at the plate/lamella junction. */
    const mt = [[XC, -T_CRIB], [XC + 0.3, -9], [XC + 1.2, -16], [XC + 3, -21]];
    add(mesh(THREE, geometry(THREE, slab(X(band(mt, 1, 1)))), 's.middle-turbinate', side, bone));

    /* Lamina papyracea: its top is the frontoethmoidal suture at the roof. */
    const soecBottom = s.roofUnder - SOEC_H;
    const lpTop = d.soec ? soecBottom : s.roofUnder;
    add(mesh(THREE, geometry(THREE, slab(X([[s.xLP - T_LP, s.roofUnder - LP_H], [s.xLP, s.roofUnder - LP_H], [s.xLP, lpTop], [s.xLP - T_LP, lpTop]]))),
        's.lamina-papyracea', side, bone));

    /* Orbit, below the roof (below the supraorbital cell when present). */
    const orbitTop = (d.soec ? soecBottom : s.roofUnder) - 0.6;
    add(mesh(THREE, geometry(THREE, slab(X(superellipse(s.xLP + 17.5, orbitTop - 16.5, 17, 16.5, 2.6, 56)))), 's.orbit', side, { kind: 'fat' }));

    /* A representative anterior ethmoid cell column under the roof, between
       the MT/lamella and the lamina. The AEA's canal runs in a septum between
       two cells (or in the roof), never through a cell. */
    const cells = new THREE.Group();
    const zTop = s.roofUnder - 0.35;
    const zBottom = s.roofUnder - 22;
    const septum = [s.aeaZ - CANAL_R - 0.35, s.aeaZ + CANAL_R + 0.35];
    const spans = [];
    if (septum[1] < zTop - 2.5) spans.push([zTop, septum[1]]);
    const below = Math.min(zTop, septum[0]);
    const nBelow = Math.max(1, Math.round((below - zBottom) / 7));
    for (let n = 0; n < nBelow; n++) {
        const t0 = below - ((below - zBottom) * n) / nBelow;
        spans.push([t0, below - ((below - zBottom) * (n + 1)) / nBelow + 0.6]);
    }
    const lamOuter = (z) => (z >= 0 ? XC + Math.min(z, s.depth) * cot + s.w : XC);
    for (const [top, bottom] of spans) {
        if (top - bottom < 2) continue;
        const x0 = Math.max(XC + 1.3, lamOuter(top) + 0.4);
        const x1 = d.soec && top > soecBottom ? s.xLP - 4.5 : s.xLP - T_LP - 0.35;
        if (x1 - x0 < 1.5) continue;
        cells.add(new THREE.Mesh(geometry(THREE, { kind: 'super', c: [k * (x0 + x1) / 2, CELL_Y[0] / 2 + CELL_Y[1] / 2, (top + bottom) / 2],
            r: [(x1 - x0) / 2, (CELL_Y[1] - CELL_Y[0]) / 2, (top - bottom) / 2], n: 5 })));
    }
    add(tag(cells, 's.anterior-ethmoid-cells', side, { kind: 'air-cell', tint: 'cell-ethmoid' }));

    /* Supraorbital ethmoid cell over the orbit. */
    if (d.soec) {
        const x0 = s.xLP - 4;
        const x1 = s.xLP + SOEC_W;
        add(mesh(THREE, geometry(THREE, { kind: 'super', c: [k * (x0 + x1) / 2, 0, (s.roofUnder - 0.35 + soecBottom) / 2],
            r: [(x1 - x0) / 2, SLAB - 0.8, (SOEC_H - 0.35) / 2], n: 5 }), 'v.supraorbital-ethmoid-cell', side,
        /* translucent: the cell pneumatizes around the AEA, which stays visible */
        { kind: 'air-cell', tint: 'cell-soec', translucent: true }));
    }

    /* AEA: from the orbit through the anterior ethmoidal foramen at the lamina,
       across the roof (in its canal, or hanging in a mesentery), through the
       lateral lamella into the olfactory fossa, then down beside the crista.
       Oblique: posterolateral to anteromedial across the slab. */
    const zc = s.aeaZ;
    const zEntry = Math.min(s.depth - 0.3, Math.max(zc, 1));     /* it must pierce the lamella above the plate */
    const xEntry = XC + zEntry * cot + s.w / 2;
    const cross = [];
    const nCross = 7;
    for (let i = 0; i <= nCross; i++) {
        const t = i / nCross;
        const x = s.xLP - T_LP / 2 + (xEntry + 0.6 - (s.xLP - T_LP / 2)) * t;
        const zz = t < 0.8 ? zc : zc + (zEntry - zc) * ((t - 0.8) / 0.2);
        cross.push([k * x, AEA_Y[0] + (AEA_Y[1] - AEA_Y[0]) * t, zz]);
    }
    const artery = [
        [k * (s.xLP + 7), AEA_Y[0] - 2.4, zc - 2.2],
        [k * (s.xLP + 2.5), AEA_Y[0] - 1, zc - 0.4],
        ...cross,
        [k * (xEntry - 0.8), AEA_Y[1] + 0.3, Math.min(zEntry, s.depth - 0.5)],
        [k * (XC - 0.8), AEA_Y[1] + 0.5, 0.9],
        [k * (CG_HALF + 0.9), AEA_Y[1] + 0.7, 0.6],
        [k * (CG_HALF + 0.9), AEA_Y[1] + 0.8, -3],
    ];
    const hanging = d.drop > 0;
    add(mesh(THREE, tubeGeometry(THREE, artery, AEA_R), 's.anterior-ethmoidal-artery', side, { kind: 'artery' },
        hanging ? { hazards: ['h.aea-transection'] } : {}));
    add(mesh(THREE, tubeGeometry(THREE, cross.slice(0, -1), CANAL_R), 's.anterior-ethmoidal-canal', side, { kind: 'bone', ghost: true }));
    if (hanging) {
        const mid = cross.slice(0, -1);
        add(mesh(THREE, ribbonGeometry(THREE, mid, mid.map(() => s.roofUnder + 0.1), mid.map((p) => p[2] + CANAL_R * 0.6)),
            'v.aea-in-mesentery', side, { kind: 'mucosa', doubleSide: true }));
    }
}
