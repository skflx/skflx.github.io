/* =============================================================
   dioramas/frontal-recess.js — the IFAC building blocks (docs/ssb.md 6).

   One (right) frontal recess as Wormald's building blocks: a simplified
   frontal sinus and ostium above, the recess below, with the middle
   turbinate (medial wall), lamina papyracea (lateral wall), skull base
   (posterosuperior), frontal beak (anterior), ethmoid bulla, uncinate
   process, and the seven IFAC cells as superellipsoid blocks, each on/off
   with a size.

   The frontal drainage pathway is COMPUTED, not drawn: the recess is
   voxelized at 0.5 mm from the very solids that are rendered (kit.inside),
   the cells present are subtracted, and the path from the frontal sinus
   through the ostium to the middle meatus / ethmoid infundibulum is the
   shortest path on that grid (Dijkstra, 26-neighbour, step cost weighted
   by 1 + W/clearance^2 so it runs down the middle of the channel the cells
   leave rather than scraping a wall). It is smoothed inside free space and
   drawn as a tube with slow particles. Nothing about direction is written
   in: the IFAC rules (anterior cells push the pathway back, suprabullar
   cells push it forward, a frontal septal cell pushes it lateral, the
   uncinate's superior attachment decides medial vs lateral drainage) come
   out of the geometry, and tools/test-ssb.mjs checks each one.

   Local frame: RAS mm, right side (x = 0 midsagittal, x > 0 lateral),
   origin at the frontal ostium's level (z = 0 at the sinus floor) and the
   ostium's AP position (y = 0 near its centre). Standalone, not registered
   to the specimen — the stage badge says "schematic".

   Proportions. The graph gives almost no frontal recess dimensions, so the
   fixed scale is schematic and stated here, not borrowed:
   - AP scale: the agger nasi cell centre sits about 15 mm in front of the
     AEA's crossing, which is consistent with m.alc-to-aea (24 mm from the
     anterior lacrimal crest, which lies a few mm in front of the agger
     nasi) and with pr.aea-frontal-recess-limit (the AEA is the recess's
     posterior limit).
   - Ethmoid half-width (MT to lamina 8.5 mm), sinus and cell sizes,
     skull-base slope (the graph says only that it slopes down posteriorly,
     s.fovea-ethmoidalis) and wall thicknesses: schematic; graph silent.
   ============================================================= */
import { inside, bounds, band, superellipse, rasRoot, geometry, tubeGeometry, mesh, tag } from './kit.js?v=aace6cfc';
import { CELL_TINT } from '../materials.js?v=34e04a58';

export const TITLE = 'Frontal recess';
export const SIDE = 'R';

/* The seven IFAC cells: toggle key, graph id, IFAC code (c.ifac), size range.
   Sizes are the cell's extent along the axis its class is defined by: for
   the supra agger frontal and suprabullar frontal cells, how far they rise
   above the sinus floor (IFAC: small ones reach the floor, large ones the
   roof); for the frontal septal cell, its lateral reach from the septum;
   otherwise its AP (anterior/posterior cells) or height. Ranges are
   schematic (the graph gives prevalence, not size). */
const CELLS = [
    { key: 'anc', id: 's.agger-nasi-cell', code: 'ANC', label: 'Agger nasi cell', size: [4, 9, 5] },
    { key: 'sac', id: 'v.supra-agger-cell', code: 'SAC', label: 'Supra agger cell', size: [3, 7, 5] },
    { key: 'safc', id: 'v.supra-agger-frontal-cell', code: 'SAFC', label: 'Supra agger frontal cell', size: [2, 16, 7] },
    { key: 'sbc', id: 'v.suprabullar-cell', code: 'SBC', label: 'Suprabullar cell', size: [4, 12, 9.5] },
    { key: 'sbfc', id: 'v.suprabullar-frontal-cell', code: 'SBFC', label: 'Suprabullar frontal cell', size: [2, 14, 6] },
    { key: 'soec', id: 'v.supraorbital-ethmoid-cell', code: 'SOEC', label: 'Supraorbital ethmoid cell', size: [6, 12, 9] },
    { key: 'fsc', id: 'v.frontal-septal-cell', code: 'FSC', label: 'Frontal septal cell', size: [6, 11, 9.5] },
];

/* Uncinate superior attachment: the Landsberg–Friedman code itself
   (c.uncinate-superior-attachment). Types 1, 5 and 6 are the three sites the
   classification's caveat names (lamina papyracea, skull base, MT) and have
   variants in the graph; type 2 (agger nasi posteromedial wall) drains like 1
   and type 4 (MT–cribriform junction) like 5–6 per the same caveat, and the
   graph states no drainage for type 3 (dual insertion) — so 2–4 are not
   modelled rather than guessed. */
const UNCINATE = [
    { value: 1, code: '1', id: 'v.uncinate-insertion-lamina-papyracea' },
    { value: 5, code: '5', id: 'v.uncinate-insertion-skull-base' },
    { value: 6, code: '6', id: 'v.uncinate-insertion-middle-turbinate' },
];

export const PARAMS = [
    ...CELLS.flatMap((c) => [
        { key: c.key, label: c.label, unit: '', min: 0, max: 1, step: 1, default: c.key === 'anc' ? 1 : 0, from: c.id, type: 'toggle' },
        { key: c.key + '-size', label: 'size', unit: 'mm', min: c.size[0], max: c.size[1], step: 0.5, default: c.size[2], from: c.id, requires: c.key },
    ]),
    { key: 'uncinate', label: 'Uncinate superior attachment', unit: '', min: 1, max: 6, step: 1, default: 1,
        from: 'c.uncinate-superior-attachment', type: 'choice', options: UNCINATE.map((u) => ({ value: u.value, code: u.code })) },
];

const ALL_OFF = Object.fromEntries(CELLS.map((c) => [c.key, 0]));
/* One IFAC class per preset: that cell alone, plus the agger nasi cell for
   the two classes IFAC defines relative to it ("above the agger nasi cell").
   Uncinate presets: the attachment alone. */
export const PRESETS = {
    'c.ifac': {
        ANC: { ...ALL_OFF, anc: 1 },
        SAC: { ...ALL_OFF, anc: 1, sac: 1 },
        SAFC: { ...ALL_OFF, anc: 1, safc: 1 },
        SBC: { ...ALL_OFF, sbc: 1 },
        SBFC: { ...ALL_OFF, sbfc: 1 },
        SOEC: { ...ALL_OFF, soec: 1 },
        FSC: { ...ALL_OFF, fsc: 1 },
    },
    'c.uncinate-superior-attachment': {
        1: { uncinate: 1 },
        5: { uncinate: 5 },
        6: { uncinate: 6 },
    },
};

/* Camera views, RAS direction from the target to the camera, in the
   radiological conventions (see ethmoid-roof.js). Default: parasagittal from
   the medial side (the nasal cavity), as the recess is read on sagittal CT —
   anterior on screen left, so the pathway's anteroposterior shifts read
   directly as the cells are toggled. */
export const VIEWS = {
    sagittal: { dir: [-1, 0, 0], up: [0, 0, 1] },
    coronal: { dir: [0, 1, 0], up: [0, 0, 1] },
    axial: { dir: [0, 0, -1], up: [0, 1, 0] },
    oblique: { dir: [-1, 0.45, 0.35], up: [0, 0, 1] },
};
export const VIEW_DEFAULT = 'sagittal';

/* ---------------- fixed anatomy (mm, right side) ---------------- */

const X_MT = 3.5;              /* MT lateral face = medial wall of the recess */
const X_UNC = [6.3, 7.0];      /* uncinate plate */
const X_LP = 12;               /* lamina papyracea medial face = lateral wall */
const FLOOR = [-1, 0.5];       /* frontal sinus floor (z) */
const OSTIUM = { c: [9.5, -0.5], r: [2.5, 3] };   /* ellipse in the floor (x, y) */
const Y_FRONT = 6;             /* anterior wall of the recess below the beak */
const Y_BACK = -18;            /* posterior end of the model (toward the basal lamella) */
const Z_BOTTOM = -26;
const Z_CAP = [-13.6, -12.8];  /* the uncinate's bend (types 1 and 6) */
const Y_UNC = [-5, Y_FRONT];   /* uncinate: free posterior edge -> anterior attachment */
const Z_OUT = -19;             /* the outlet level: middle meatus / infundibulum */
const roofZ = (y) => -1 + 0.35 * (y + 3.5);   /* skull base behind the ostium, sloping down */
const Y_AEA = -12;

/* The sinus lumen: a rounded box whose lower part is cut flat by the floor,
   so the whole ostium opens into it. */
const SINUS = { kind: 'super', c: [10, 3, 8], r: [9, 6.5, 14], n: 4, zMin: 0.5 };
const BEAK_POLY = [[2.5, 0.5], [11, 0.5], [11, -7], [6, -4.5], [2.5, -3]];
const X_BEAK = 8.5;            /* the beak is the medial part of the ostium's anterior margin */
const BULLA = { kind: 'super', c: [8.3, -12.5, -18], r: [4.2, 5.5, 6.3], n: 5 };

function cellSolid(key, size) {
    switch (key) {
        case 'anc': /* above the MT's anterior insertion, under the beak, MT to lamina */
            return { kind: 'super', c: [8, Y_FRONT - size / 2 + 0.2, -9], r: [4.4, size / 2, 3.8], n: 4 };
        case 'sac': /* anterolateral, above the agger nasi, below the sinus floor */
            return { kind: 'super', c: [10, Y_FRONT - size / 2 + 0.2, -3.2], r: [2.3, size / 2, 1.9], n: 4 };
        case 'safc': { /* anterolateral, from above the agger nasi up into the sinus */
            const lo = -5;
            const hi = FLOOR[1] + size;
            return { kind: 'super', c: [10.3, 1.5, (lo + hi) / 2], r: [2.3, 2.6, (hi - lo) / 2], n: 4 };
        }
        case 'sbc': /* above the bulla, under the skull base, below the ostium */
            return { kind: 'super', c: [8.3, -10 + size / 2, -8], r: [4.4, size / 2, 3], n: 4 };
        case 'sbfc': { /* from the suprabullar region up along the skull base into the
                          posterior sinus: a fixed base and lean, growing upward with size */
            const lean = (25 * Math.PI) / 180;
            const base = [-6, -6];
            const len = (FLOOR[1] + size - base[1]) / Math.cos(lean);
            return { kind: 'super', c: [9.3, base[0] + (len / 2) * Math.sin(lean), base[1] + (len / 2) * Math.cos(lean)],
                r: [3.8, 3.2, len / 2], n: 4, tilt: -lean };
        }
        case 'soec': /* over the orbit, posterolateral; its medial part bulges into the recess */
            return { kind: 'super', c: [X_LP + size / 2 - 3, -10, -7.5], r: [size / 2, 4, 2.6], n: 4 };
        case 'fsc': /* medially based on the intersinus septum, around the ostium level */
            return { kind: 'super', c: [0.2 + size / 2, -0.3, 0.8], r: [size / 2, 3.2, 3.4], n: 4 };
        default:
            return null;
    }
}

/* The uncinate as solids, by attachment. */
function uncinateSolids(type, ancOn) {
    const out = [];
    if (type === 5) {
        /* Straight up to the ceiling over its whole length (medial to the
           ostium, which opens lateral to it). With an agger nasi cell present
           the plate's anterosuperior part ends at the cell. */
        const top = [];
        for (let y = Y_UNC[0]; y <= Y_UNC[1] + 1e-9; y += 0.5) {
            const ceiling = y < -3.5 ? roofZ(y) : y <= 2.5 ? FLOOR[0] : -3.2;
            top.push([y, ancOn && y > -0.5 ? Math.min(ceiling, -12.3) : ceiling + 0.2]);
        }
        out.push({ kind: 'prism', axis: 'x', from: X_UNC[0], to: X_UNC[1],
            poly: [[Y_UNC[0], Z_BOTTOM], [Y_UNC[1], Z_BOTTOM], ...top.reverse()] });
    } else {
        out.push({ kind: 'box', min: [X_UNC[0], Y_UNC[0], Z_BOTTOM], max: [X_UNC[1], Y_UNC[1], Z_CAP[1]] });
        /* The bend: laterally to the lamina (1, closing a terminal recess) or
           medially to the MT (6). It runs back onto the bulla so the closed
           compartment is sealed (the bulla is the infundibulum's back wall). */
        out.push(type === 1
            ? { kind: 'box', min: [X_UNC[0], -9, Z_CAP[0]], max: [X_LP + 0.2, Y_UNC[1], Z_CAP[1]] }
            : { kind: 'box', min: [X_MT - 0.2, -9, Z_CAP[0]], max: [X_UNC[1], Y_UNC[1], Z_CAP[1]] });
    }
    return out;
}

/* Everything the pathway must go around, as { part, solid } pairs. */
export function model(params) {
    const p = params;
    const unc = UNCINATE.some((u) => u.value === p.uncinate) ? p.uncinate : 1;
    const cells = CELLS.filter((c) => p[c.key] === 1).map((c) => ({ ...c, solid: cellSolid(c.key, p[c.key + '-size']) }));
    return { uncinate: unc, cells, uncinateSolids: uncinateSolids(unc, p.anc === 1) };
}

/* ---------------- the free space and the pathway ---------------- */

const VOX = 0.5;
const DOMAIN = { min: [0.5, Y_BACK, Z_BOTTOM], max: [20, 10, 14] };

/* Free (air) at an RAS point, before cells: sinus lumen above the floor,
   the ostium through it, the recess below, bounded by bone. */
function recessAir(x, y, z) {
    if (z >= FLOOR[1]) return x >= 1 && inside(SINUS, x, y, z);
    if (z >= FLOOR[0]) {
        const dx = (x - OSTIUM.c[0]) / OSTIUM.r[0];
        const dy = (y - OSTIUM.c[1]) / OSTIUM.r[1];
        return dx * dx + dy * dy <= 1;
    }
    if (x <= X_MT || x >= X_LP) return false;
    if (y < -3.5 && z > roofZ(y)) return false;                          /* skull base */
    if (x < X_BEAK && y >= 2.5 && inPoly(y, z, BEAK_POLY)) return false; /* frontal beak */
    if (y > Y_FRONT) return false;                                        /* anterior wall */
    return !inside(BULLA, x, y, z);
}
const inPoly = (u, v, poly) => inside({ kind: 'prism', axis: 'x', poly, from: -1e9, to: 1e9 }, 0, u, v);

let cache = { key: '', result: null };

/* params -> { points: [[r,a,s]…] (smoothed, RAS mm), outlet: 'middle-meatus' |
   'infundibulum', id: pw.* graph id, length, voxels, ms }. Deterministic;
   memoized on the parameter values. */
export function solvePathway(params) {
    const key = JSON.stringify(PARAMS.map((q) => params[q.key]));
    if (cache.key === key) return cache.result;
    const t0 = typeof performance === 'object' ? performance.now() : Date.now();
    const m = model(params);
    const obstacles = [...m.uncinateSolids, ...m.cells.map((c) => c.solid)].map((s) => ({ s, b: bounds(s) }));

    const nx = Math.round((DOMAIN.max[0] - DOMAIN.min[0]) / VOX);
    const ny = Math.round((DOMAIN.max[1] - DOMAIN.min[1]) / VOX);
    const nz = Math.round((DOMAIN.max[2] - DOMAIN.min[2]) / VOX);
    const N = nx * ny * nz;
    const at = (i, j, k) => i + nx * (j + ny * k);
    const cx = (i) => DOMAIN.min[0] + (i + 0.5) * VOX;
    const cy = (j) => DOMAIN.min[1] + (j + 0.5) * VOX;
    const cz = (k) => DOMAIN.min[2] + (k + 0.5) * VOX;

    const free = new Uint8Array(N);
    for (let k = 0; k < nz; k++) {
        const z = cz(k);
        for (let j = 0; j < ny; j++) {
            const y = cy(j);
            for (let i = 0; i < nx; i++) {
                const x = cx(i);
                if (!recessAir(x, y, z)) continue;
                let blocked = false;
                for (const o of obstacles) {
                    if (x < o.b.min[0] || x > o.b.max[0] || y < o.b.min[1] || y > o.b.max[1] || z < o.b.min[2] || z > o.b.max[2]) continue;
                    if (inside(o.s, x, y, z)) { blocked = true; break; }
                }
                if (!blocked) free[at(i, j, k)] = 1;
            }
        }
    }

    /* Clearance: 6-neighbour BFS distance (voxels) from any solid, capped. */
    const CAP = 12;
    const clear = new Uint8Array(N).fill(CAP);
    const queue = new Int32Array(N);
    let qh = 0;
    let qt = 0;
    for (let n = 0; n < N; n++) if (!free[n]) { clear[n] = 0; queue[qt++] = n; }
    const step6 = [1, -1, nx, -nx, nx * ny, -nx * ny];
    while (qh < qt) {
        const n = queue[qh++];
        const d = clear[n] + 1;
        if (d >= CAP) continue;
        const i = n % nx;
        for (let s = 0; s < 6; s++) {
            if ((s === 0 && i === nx - 1) || (s === 1 && i === 0)) continue;
            const q = n + step6[s];
            if (q < 0 || q >= N) continue;
            if (clear[q] > d) { clear[q] = d; queue[qt++] = q; }
        }
    }

    /* Start: the sinus lumen above the cells (nearest free voxel to a point
       high in the sinus). Outlet: any free voxel at or below Z_OUT in front of
       the bulla — medial to the uncinate is the middle meatus, lateral the
       infundibulum. */
    const startAt = nearestFree(free, nx, ny, nz, [9.5, 1.5, 9], cx, cy, cz);
    const kOut = Math.floor((Z_OUT - DOMAIN.min[2]) / VOX);
    const jOut = Math.ceil((Y_UNC[0] - DOMAIN.min[1]) / VOX);

    const dist = new Float64Array(N).fill(Infinity);
    const prev = new Int32Array(N).fill(-1);
    const heap = new Heap();
    const W = 10;
    const nb = [];
    for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (di || dj || dk) nb.push([di, dj, dk, Math.hypot(di, dj, dk) * VOX]);
    }
    let goal = -1;
    if (startAt >= 0) {
        dist[startAt] = 0;
        heap.push(startAt, 0);
    }
    while (heap.size) {
        const [n, d] = heap.pop();
        if (d > dist[n]) continue;
        const i = n % nx;
        const j = Math.floor(n / nx) % ny;
        const k = Math.floor(n / (nx * ny));
        if (k <= kOut && j >= jOut) { goal = n; break; }
        for (const [di, dj, dk, len] of nb) {
            const a = i + di;
            const b = j + dj;
            const c = k + dk;
            if (a < 0 || b < 0 || c < 0 || a >= nx || b >= ny || c >= nz) continue;
            const q = at(a, b, c);
            if (!free[q]) continue;
            const cl = clear[q];
            const nd = d + len * (1 + W / (cl * cl));
            if (nd < dist[q]) { dist[q] = nd; prev[q] = n; heap.push(q, nd); }
        }
    }

    let result;
    if (goal < 0) {
        result = { points: [], outlet: null, id: null, length: 0, blocked: true };
    } else {
        const raw = [];
        for (let n = goal; n >= 0; n = prev[n]) {
            raw.push([cx(n % nx), cy(Math.floor(n / nx) % ny), cz(Math.floor(n / (nx * ny)))]);
        }
        raw.reverse();
        const isFree = (p) => {
            const i = Math.floor((p[0] - DOMAIN.min[0]) / VOX);
            const j = Math.floor((p[1] - DOMAIN.min[1]) / VOX);
            const k = Math.floor((p[2] - DOMAIN.min[2]) / VOX);
            return i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && free[at(i, j, k)] === 1;
        };
        const points = smooth(raw, isFree);
        const end = points[points.length - 1];
        const medial = end[0] < (X_UNC[0] + X_UNC[1]) / 2;
        let length = 0;
        for (let n = 1; n < points.length; n++) length += Math.hypot(...points[n].map((v, a) => v - points[n - 1][a]));
        result = {
            points,
            outlet: medial ? 'middle-meatus' : 'infundibulum',
            outletId: medial ? 's.middle-meatus' : 's.ethmoid-infundibulum',
            id: medial ? 'pw.frontal-drainage' : 'pw.frontal-drainage-infundibular',
            length,
            blocked: false,
        };
    }
    result.voxels = N;
    result.uncinateX = (X_UNC[0] + X_UNC[1]) / 2;
    result.ms = (typeof performance === 'object' ? performance.now() : Date.now()) - t0;
    cache = { key, result };
    return result;
}

function nearestFree(free, nx, ny, nz, p, cx, cy, cz) {
    let best = -1;
    let bestD = Infinity;
    for (let n = 0; n < free.length; n++) {
        if (!free[n]) continue;
        const d = (cx(n % nx) - p[0]) ** 2 + (cy(Math.floor(n / nx) % ny) - p[1]) ** 2 + (cz(Math.floor(n / (nx * ny))) - p[2]) ** 2;
        if (d < bestD) { bestD = d; best = n; }
    }
    return best;
}

/* Laplacian smoothing with fixed ends; a point that would leave free space
   stays where it was. Then resampled to ~0.75 mm. */
function smooth(raw, isFree) {
    let pts = raw.map((p) => p.slice());
    for (let it = 0; it < 40; it++) {
        const next = pts.map((p) => p.slice());
        for (let n = 1; n < pts.length - 1; n++) {
            const cand = [0, 1, 2].map((a) => pts[n][a] + 0.5 * ((pts[n - 1][a] + pts[n + 1][a]) / 2 - pts[n][a]));
            if (isFree(cand)) next[n] = cand;
        }
        pts = next;
    }
    const out = [pts[0]];
    let acc = 0;
    for (let n = 1; n < pts.length; n++) {
        acc += Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1], pts[n][2] - pts[n - 1][2]);
        if (acc >= 0.75 || n === pts.length - 1) { out.push(pts[n]); acc = 0; }
    }
    return out.map((p) => p.map((v) => Math.round(v * 1000) / 1000));
}

/* Binary min-heap of (index, key). */
class Heap {
    constructor() { this.i = []; this.k = []; }
    get size() { return this.i.length; }
    push(i, k) {
        const I = this.i;
        const K = this.k;
        let n = I.length;
        I.push(i); K.push(k);
        while (n > 0) {
            const p = (n - 1) >> 1;
            if (K[p] <= k) break;
            I[n] = I[p]; K[n] = K[p]; n = p;
        }
        I[n] = i; K[n] = k;
    }
    pop() {
        const I = this.i;
        const K = this.k;
        const top = [I[0], K[0]];
        const li = I.pop();
        const lk = K.pop();
        if (I.length) {
            let n = 0;
            const len = I.length;
            for (;;) {
                const l = 2 * n + 1;
                if (l >= len) break;
                const r = l + 1;
                const c = r < len && K[r] < K[l] ? r : l;
                if (K[c] >= lk) break;
                I[n] = I[c]; K[n] = K[c]; n = c;
            }
            I[n] = li; K[n] = lk;
        }
        return top;
    }
}

/* ---------------- readouts ---------------- */

/* The classification state of these parameters, in graph terms. */
export function classify(params) {
    const out = CELLS.filter((c) => params[c.key] === 1).map((c) => ({ cls: 'c.ifac', code: c.code, id: c.id }));
    const u = UNCINATE.find((x) => x.value === params.uncinate);
    if (u) out.push({ cls: 'c.uncinate-superior-attachment', code: u.code, id: u.id });
    return out;
}

/* HUD lines: segments are text, { ref, text? } (a graph link) or { strong }. */
export function readout(params, data, names) {
    const cells = classify(params);
    const ifac = cells.filter((c) => c.cls === 'c.ifac');
    const line = [{ ref: 'c.ifac', text: 'IFAC' }, ': '];
    if (!ifac.length) line.push('no frontal recess cells');
    ifac.forEach((c, i) => { if (i) line.push(', '); line.push({ ref: c.id, text: c.code }); });
    const lines = [line];
    const u = cells.find((c) => c.cls === 'c.uncinate-superior-attachment');
    if (u) lines.push([{ ref: u.cls, text: names.shortName(u.cls) }, ` ${u.code}: `, { ref: u.id, text: names.classLabel(u.cls, u.code) }]);
    const path = data.pathway;
    if (path && !path.blocked) {
        lines.push(['Drains ', { strong: path.outlet === 'middle-meatus' ? 'medial' : 'lateral' }, ' to the uncinate into the ',
            { ref: path.outletId }, ' · ', { ref: path.id, text: `computed path ${Math.round(path.length)} mm` }]);
    } else if (path) {
        lines.push(['No open path from the ostium: the cells close the recess']);
    }
    return lines;
}

/* ---------------- build ---------------- */

export function build(THREE, params) {
    const m = model(params);
    const root = rasRoot(THREE);
    const R = SIDE;
    const bone = { kind: 'bone', cut: true };
    const add = (obj) => { root.add(obj); return obj; };

    /* Frontal sinus: the lumen (space) above a floor pierced by the ostium. */
    add(mesh(THREE, geometry(THREE, SINUS), 's.frontal-sinus', R, { kind: 'space', space: true }));
    const floorPoly = superellipse(10, 2, 9.2, 7.2, 4, 64);
    const ostiumPoly = superellipse(OSTIUM.c[0], OSTIUM.c[1], OSTIUM.r[0], OSTIUM.r[1], 2, 40);
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'z', from: FLOOR[0], to: FLOOR[1],
        poly: clipPoly(floorPoly, 1), holes: [ostiumPoly] }), 's.frontal-sinus-floor', R, bone));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 10, 48));
    ring.scale.set(OSTIUM.r[0], OSTIUM.r[1], 1);
    ring.position.set(OSTIUM.c[0], OSTIUM.c[1], (FLOOR[0] + FLOOR[1]) / 2);
    add(tag(ring, 's.frontal-ostium', R, { kind: 'bone-cut' }));
    /* Medial walls are ghosted: the camera looks in from the nasal side. */
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [0, -3.5, FLOOR[0]], max: [1, 9.5, 21] }), 's.frontal-intersinus-septum', 'M', { kind: 'bone', ghost: true }));
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'x', from: 1, to: 19,
        poly: [[-3.5, FLOOR[0]], [-3.5, 17], [-5, 17], [-5, FLOOR[0]]] }), 's.frontal-sinus-posterior-table', R, { kind: 'bone', ghost: true }));
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'x', from: 1, to: X_BEAK, poly: BEAK_POLY }), 's.frontal-beak', R, bone));

    /* Skull base behind the ostium, sloping down posteriorly. */
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'x', from: X_MT - 1, to: X_LP + 0.8,
        poly: band([[-3.5, roofZ(-3.5)], [Y_BACK, roofZ(Y_BACK)]], 1.3, -1) }), 's.fovea-ethmoidalis', R, bone));

    /* Walls: MT medially, lamina laterally (ghosted: the camera looks through them). */
    add(mesh(THREE, geometry(THREE, { kind: 'prism', axis: 'x', from: X_MT - 1, to: X_MT,
        poly: [[Y_BACK, Z_BOTTOM], [Y_FRONT - 1, Z_BOTTOM], [Y_FRONT - 1, -6], [2.5, -3], [-3.5, FLOOR[0]], [Y_BACK, roofZ(Y_BACK)]] }),
    's.middle-turbinate', R, { kind: 'bone', ghost: true }));
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [X_LP, Y_BACK, Z_BOTTOM], max: [X_LP + 0.8, Y_FRONT, FLOOR[0]] }),
        's.lamina-papyracea', R, { kind: 'bone', ghost: true }));

    /* Bulla, uncinate, infundibulum. */
    add(mesh(THREE, geometry(THREE, BULLA), 's.ethmoid-bulla', R, { kind: 'air-cell', tint: 'cell-ethmoid' }));
    const unc = new THREE.Group();
    for (const s of m.uncinateSolids) unc.add(new THREE.Mesh(geometry(THREE, s)));
    add(tag(unc, 's.uncinate-process', R, { kind: 'bone', cut: true }, { attachment: m.uncinate }));
    add(mesh(THREE, geometry(THREE, { kind: 'box', min: [X_UNC[1] + 0.1, Y_UNC[0] + 0.1, Z_BOTTOM + 0.5],
        max: [X_LP - 0.1, Y_FRONT - 0.2, m.uncinate === 1 ? Z_CAP[0] - 0.1 : -9] }),
    's.ethmoid-infundibulum', R, { kind: 'space', space: true }));

    /* The AEA along the skull base: the posterior limit of the recess
       (pr.aea-frontal-recess-limit), in its canal in the roof. */
    const za = roofZ(Y_AEA) - 0.9;
    add(mesh(THREE, tubeGeometry(THREE, [[X_LP + 4, Y_AEA - 2.5, za - 1.2], [X_LP, Y_AEA - 1.5, za], [8, Y_AEA - 0.3, za + 0.4], [X_MT - 0.5, Y_AEA + 1, za + 0.8]], 0.55),
        's.anterior-ethmoidal-artery', R, { kind: 'artery' }));

    /* IFAC cells, each hued by identity. */
    for (const c of m.cells) {
        add(mesh(THREE, geometry(THREE, c.solid), c.id, R, { kind: 'air-cell', tint: CELL_TINT[c.id] }, { code: c.code }));
    }

    /* The computed pathway. */
    const path = solvePathway(params);
    if (path.points.length > 1) {
        const tube = mesh(THREE, tubeGeometry(THREE, path.points, 0.5, 10), path.id, R, { kind: 'flow' });
        add(tube);
        const curve = new THREE.CatmullRomCurve3(path.points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
        const count = Math.max(4, Math.round(path.length / 2.5));
        const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 10, 8), undefined, count);
        tag(dots, path.id, R, { kind: 'flow-particle' }, { particles: true });
        const tmp = new THREE.Matrix4();
        const place = (t) => {
            for (let n = 0; n < count; n++) {
                const u = (((n / count) + t) % 1 + 1) % 1;
                const p = curve.getPointAt(u);
                tmp.makeTranslation(p.x, p.y, p.z);
                dots.setMatrixAt(n, tmp);
            }
            dots.instanceMatrix.needsUpdate = true;
        };
        place(0);
        /* ~3 mm/s along the path: slow enough to read as flow. */
        dots.userData.animate = (seconds) => place((seconds * 3) / path.length);
        add(dots);
    }

    root.userData.pathway = path;
    root.userData.focus = { center: [9, -3, -2.5], radius: 19.5 };
    root.userData.derived = { uncinate: m.uncinate, cells: m.cells.map((c) => ({ key: c.key, code: c.code, id: c.id, solid: c.solid })) };
    return root;
}

/* Clip a polygon (u, v) to u >= lo (the floor stops at the septum). */
function clipPoly(poly, lo) {
    const out = [];
    for (let n = 0; n < poly.length; n++) {
        const a = poly[n];
        const b = poly[(n + 1) % poly.length];
        if (a[0] >= lo) out.push(a);
        if ((a[0] >= lo) !== (b[0] >= lo)) {
            const t = (lo - a[0]) / (b[0] - a[0]);
            out.push([lo, a[1] + t * (b[1] - a[1])]);
        }
    }
    return out;
}
