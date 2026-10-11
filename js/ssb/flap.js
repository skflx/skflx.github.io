/* =============================================================
   flap.js — the nasoseptal flap overlay's geometry (docs/ssb.md 5.7, "Flap
   overlay contract"; roadmap ST5). Pure: no DOM, no three.js, no imports, so
   Node tests it (tools/test-ssb.mjs) and the page, the URL codec (state.js)
   and the tests share one definition of the parameters.

   Everything is drawn on a chart (ssb/geometry/charts.json): the septal
   chart is (a, s) = RAS (A, S) in mm, the floor chart is (a, r) with
   r = |RAS R|. Charts hold cell centres on a 1 mm grid; an outline lives on
   cell EDGES (half a step beyond the outermost occupied cell), so the
   triangles of the outermost cells are inside it.

   Inputs for one side (`inputs`, built by the caller from the data files):
     side            'R' | 'L'
     septal, floor   that side's chart documents (charts.json "surfaces")
     ostium          lm.sphenoid-ostium.<side>  [r, a, s]
     arch            lm.choanal-arch.M          [r, a, s]
     mtHead          lm.middle-turbinate-head.<side>  [r, a, s]
     sf              the ostium's inferior margin S (landmarks.meta.json
                     inferior_margin_s_mm)
   Nothing here types an anatomical position: every number is read from
   those inputs or is a slider default the contract marks schematic.
   ============================================================= */

export const DESIGNS = Object.freeze(['short', 'full', 'extended', 'rescue']);
export const DESIGN_DEFAULT = 'full';
export const DESIGN_LABEL = Object.freeze({ short: 'Short (A)', full: 'Full (B)', extended: 'Extended (C)', rescue: 'Rescue' });
export const SIDES = Object.freeze(['R', 'L']);

/* Sliders. `hash` is the URL key; `designs` the designs it applies to; `from` the graph entry its range comes from (every
   default that is not a cited graph value is schematic: the contract's table). `floor_width` is a width from the
   septum-floor junction, capped by what the floor chart holds, so its maximum is only a ceiling. */
export const PARAMS = Object.freeze([
    { key: 'top_margin', hash: 'top', label: 'Superior margin', unit: 'mm below the top of the septum', min: 5, max: 20, step: 1, default: 15, designs: ['full', 'extended'], from: 'm.nsf-superior-incision' },
    { key: 'anterior_margin', hash: 'ant', label: 'Anterior margin', unit: 'mm behind the anterior edge', min: 0, max: 10, step: 1, default: 0, designs: ['full', 'extended'], from: 'p.nasoseptal-flap' },
    { key: 'floor_width', hash: 'fw', label: 'Floor width', unit: 'mm lateral to the junction', min: 0, max: 20, step: 1, default: 20, designs: ['extended'], from: 'm.nsf-extended-gain' },
    { key: 'window', hash: 'win', label: 'Contralateral window', unit: 'mm square', min: 3, max: 8, step: 1, default: 5, designs: ['rescue'], from: 'p.nasoseptal-flap' },
]);
export const OLFACTORY_RISK_MM = 10;     /* below this a superior margin is flagged (the range's lower half; contract table) */

export const PARAM_DEFAULTS = Object.freeze(Object.fromEntries(PARAMS.map((p) => [p.key, p.default])));

/* A design's own sliders. */
export const paramsFor = (design) => PARAMS.filter((p) => p.designs.includes(design));

/* ---------------- charts ---------------- */

const has = (g, ia, is) => !!g.r && !!g.r[ia] && g.r[ia][is] !== null && g.r[ia][is] !== undefined;

/* Septal chart -> its profile: per column the top and bottom edge (S), per row the posterior edge (A), the anterior edge.
   `top` is interpolated linearly across columns with no data that lie between occupied ones. */
export function septalProfile(chart) {
    const g = chart.grid;
    const [a0, s0] = g.origin;
    const step = g.step;
    const [na, ns] = g.dims;
    const half = step / 2;
    const top = new Array(na).fill(null);
    const bottom = new Array(na).fill(null);
    const post = new Array(ns).fill(null);
    let aAnt = -Infinity;
    let aPost = Infinity;
    for (let ia = 0; ia < na; ia++) {
        for (let is = 0; is < ns; is++) {
            if (!has(g, ia, is)) continue;
            const a = a0 + ia * step;
            const s = s0 + is * step;
            if (top[ia] === null || s + half > top[ia]) top[ia] = s + half;
            if (bottom[ia] === null || s - half < bottom[ia]) bottom[ia] = s - half;
            if (post[is] === null || a - half < post[is]) post[is] = a - half;
            aAnt = Math.max(aAnt, a + half);
            aPost = Math.min(aPost, a - half);
        }
    }
    const first = top.findIndex((v) => v !== null);
    const last = na - 1 - [...top].reverse().findIndex((v) => v !== null);
    for (let ia = first + 1; ia < last; ia++) {
        if (top[ia] !== null) continue;
        let lo = ia - 1;
        let hi = ia + 1;
        while (top[lo] === null) lo--;
        while (top[hi] === null) hi++;
        top[ia] = top[lo] + (top[hi] - top[lo]) * ((ia - lo) / (hi - lo));
    }
    return { a0, s0, step, na, ns, top, bottom, post, first, last, aAnt, aPost };
}

const colA = (p, ia) => p.a0 + ia * p.step;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Linear interpolation of a per-column array at A (clamped to the occupied columns). */
function atColumns(p, arr, a) {
    const x = clamp((a - p.a0) / p.step, p.first, p.last);
    let lo = Math.floor(x);
    let hi = Math.ceil(x);
    while (lo > p.first && arr[lo] === null) lo--;
    while (hi < p.last && arr[hi] === null) hi++;
    if (arr[lo] === null || arr[hi] === null) return arr[lo] !== null ? arr[lo] : arr[hi];
    return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * ((x - lo) / (hi - lo));
}
export const topAt = (p, a) => atColumns(p, p.top, a);
export const bottomAt = (p, a) => atColumns(p, p.bottom, a);

/* The posterior edge of the chart at S (A of the first occupied cell's edge in that row), interpolated between rows. */
export function postAt(p, s) {
    const x = clamp((s - p.s0) / p.step, 0, p.ns - 1);
    let lo = Math.floor(x);
    let hi = Math.ceil(x);
    while (lo > 0 && p.post[lo] === null) lo--;
    while (hi < p.ns - 1 && p.post[hi] === null) hi++;
    if (p.post[lo] === null || p.post[hi] === null) return p.post[lo] !== null ? p.post[lo] : p.post[hi];
    return lo === hi ? p.post[lo] : p.post[lo] + (p.post[hi] - p.post[lo]) * ((x - lo) / (hi - lo));
}

/* The floor chart per column: the occupied r range, and the junction rows by a. */
export function floorProfile(chart) {
    const g = chart.grid;
    const [a0] = g.origin;
    const step = g.step;
    const [na, nr] = g.dims;
    const cols = [];
    for (let ia = 0; ia < na; ia++) {
        let lo = null;
        let hi = null;
        for (let ir = 0; ir < nr; ir++) {
            const v = g.s[ia] && g.s[ia][ir];
            if (v === null || v === undefined) continue;
            if (lo === null) lo = ir;
            hi = ir;
        }
        cols.push(lo === null ? null : { a: a0 + ia * step, rMin: lo * step - step / 2, rMax: hi * step + step / 2 });
    }
    const junction = new Map();
    for (const row of (chart.junction && chart.junction.rows) || []) junction.set(row[0], { a: row[0], rSeptal: row[1], sSeptal: row[2], rFloor: row[3], sFloor: row[4] });
    return { a0, step, na, nr, cols, junction };
}

/* ---------------- point in polygon ---------------- */

/* Even-odd crossing test; a point exactly on an edge counts as inside. */
export function inPolygon(poly, x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const cross = (xj - xi) * (y - yi) - (yj - yi) * (x - xi);
        if (Math.abs(cross) < 1e-9 && x >= Math.min(xi, xj) - 1e-9 && x <= Math.max(xi, xj) + 1e-9 && y >= Math.min(yi, yj) - 1e-9 && y <= Math.max(yi, yj) + 1e-9) return true;
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

/* Distance from a point to a polygon's boundary (mm); for tests that allow the chart polygon's own simplification. */
export function distToPolygon(poly, x, y) {
    let best = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const dx = xj - xi;
        const dy = yj - yi;
        const t = dx === 0 && dy === 0 ? 0 : clamp(((x - xi) * dx + (y - yi) * dy) / (dx * dx + dy * dy), 0, 1);
        best = Math.min(best, Math.hypot(x - (xi + t * dx), y - (yi + t * dy)));
    }
    return best;
}

/* ---------------- the outline ---------------- */

const r3 = (v) => Math.round(v * 1000) / 1000;
const pt = (a, s) => [r3(a), r3(s)];

/* Columns' A strictly between lo and hi (ascending). */
function columnsBetween(p, lo, hi) {
    const out = [];
    for (let ia = Math.ceil((lo - p.a0) / p.step + 1e-9); ia <= Math.floor((hi - p.a0) / p.step - 1e-9); ia++) {
        if (ia >= p.first && ia <= p.last) out.push(colA(p, ia));
    }
    return out;
}

/* The superior incision from (aFrom, sf) forward to aTo. A: level at sf (the contract's min(sf, top - margin) cannot be
   level and stay at or above sf at once when the ostium sits within `margin` of the septum's top, which it does at the
   sphenoid; see docs/ssb.md 5.7), clipped to the septum's top. B, C: max(sf, top - margin), with a vertex where the rising
   line crosses sf, so every point of the polyline satisfies the rule exactly. */
function superior(p, design, sf, margin, aFrom, aTo) {
    const f = design === 'short' || design === 'rescue'
        ? (a) => Math.min(sf, topAt(p, a))
        : (a) => Math.min(topAt(p, a), Math.max(sf, topAt(p, a) - margin));
    const cuts = [aFrom, ...columnsBetween(p, aFrom, aTo), aTo];
    const out = [];
    for (let i = 0; i < cuts.length; i++) {
        if (i > 0 && design !== 'short' && design !== 'rescue') {
            const l = topAt(p, cuts[i - 1]) - margin - sf;
            const r = topAt(p, cuts[i]) - margin - sf;
            if (l * r < 0) {
                const a = cuts[i - 1] + (cuts[i] - cuts[i - 1]) * (l / (l - r));
                out.push(pt(a, f(a)));
            }
        }
        out.push(pt(cuts[i], f(cuts[i])));
    }
    return out;
}

const length = (poly) => { let n = 0; for (let i = 0; i < poly.length; i++) n += Math.hypot(poly[i][0] - poly[(i + 1) % poly.length][0], poly[i][1] - poly[(i + 1) % poly.length][1]); return n; };

/* The longest chord between two vertices (mm): the outline's length along its long axis. */
function diameter(poly) {
    let best = 0;
    for (let i = 0; i < poly.length; i++) for (let j = i + 1; j < poly.length; j++) best = Math.max(best, Math.hypot(poly[i][0] - poly[j][0], poly[i][1] - poly[j][1]));
    return best;
}

/* FNV-1a over the rounded coordinates: the determinism test and a cheap change signal. */
function hashOf(parts) {
    let h = 2166136261;
    for (const c of parts.flat(3)) {
        const v = Math.round(c * 1000);
        for (const b of [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255]) { h ^= b; h = Math.imul(h, 16777619); }
    }
    return (h >>> 0).toString(16).padStart(8, '0');
}

/* Share (0..1) of an outline's length that lies on `unreliable` or `filled` chart cells (by the cell under each segment's midpoint). */
function approximateShare(chart, poly, closed = true) {
    const bad = new Set();
    for (const key of ['unreliable', 'filled']) for (const c of (chart[key] && chart[key].cells) || []) bad.add(`${c[0]},${c[1]}`);
    if (!bad.size) return 0;
    const step = chart.grid.step;
    let total = 0;
    let on = 0;
    for (let i = 0; i < poly.length - (closed ? 0 : 1); i++) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % poly.length];
        const len = Math.hypot(x2 - x1, y2 - y1);
        total += len;
        const cx = chart.grid.origin[0] + Math.round(((x1 + x2) / 2 - chart.grid.origin[0]) / step) * step;
        const cy = chart.grid.origin[1] + Math.round(((y1 + y2) / 2 - chart.grid.origin[1]) / step) * step;
        if (bad.has(`${cx},${cy}`)) on += len;
    }
    return total ? on / total : 0;
}

/* The flap for one side and design -> {
     design, side, params (the clamped values actually used), valid (false when the inputs lack what the construction needs),
     septal: polygon [[a, s]...] | null, floor: polygon [[a, r]...] | null, pedicle: [[a, s]...] (the attached edge),
     superior: [[a, s]...], window: { side, polygon } | null,
     pedicleHeight (mm), length (mm, long axis), approx (0..1), notes: [text...], hash } */
export function computeFlap(inputs, design, rawParams = {}) {
    const params = {};
    for (const p of PARAMS) {
        const v = Number(rawParams[p.key]);
        params[p.key] = Number.isFinite(v) ? clamp(p.min + Math.round((clamp(v, p.min, p.max) - p.min) / p.step) * p.step, p.min, p.max) : p.default;
    }
    const out = { design, side: inputs.side, params, valid: false, septal: null, floor: null, pedicle: [], superior: [], window: null, pedicleHeight: 0, length: 0, approx: 0, notes: [], hash: '' };
    if (!DESIGNS.includes(design) || !inputs.septal || !inputs.septal.grid) return out;
    const p = septalProfile(inputs.septal);
    const sf = inputs.sf;
    const sc = inputs.arch && inputs.arch[2];
    if (!Number.isFinite(sf) || !Number.isFinite(sc) || !inputs.mtHead || p.first > p.last) return out;
    out.valid = true;
    out.pedicleHeight = r3(sf - sc);

    /* the pedicle: the posterior edge from the choanal arch up to the ostium's inferior margin */
    const rows = (lo, hi) => {      /* the chart's posterior edge between two S, one vertex per row */
        const pts = [pt(postAt(p, lo), lo)];
        for (let s = Math.ceil((lo - p.s0) / p.step + 1e-9) * p.step + p.s0; s < hi - 1e-9; s += p.step) pts.push(pt(postAt(p, s), s));
        pts.push(pt(postAt(p, hi), hi));
        return pts;
    };
    out.pedicle = rows(sc, sf);
    const aStart = postAt(p, sf);
    const designAnt = design === 'short' || design === 'rescue' ? inputs.mtHead[1] : p.aAnt - params.anterior_margin;
    const aCut = clamp(designAnt, aStart + p.step, p.aAnt);
    out.superior = superior(p, design, sf, params.top_margin, aStart, aCut);

    if (design === 'rescue') {
        const w = params.window;
        const a0 = postAt(p, sf);
        out.window = { side: inputs.side === 'R' ? 'L' : 'R', polygon: [pt(a0, sf), pt(a0 + w, sf), pt(a0 + w, sf + w), pt(a0, sf + w)], note: 'placed with its inferior-posterior corner at the pedicle top (schematic)' };
        out.notes.push('Rescue: the superior incision only; no flap is raised, so the area is 0.');
        out.length = r3(diameter(out.superior));
        out.hash = hashOf([out.pedicle, out.superior, out.window.polygon]);
        return out;
    }

    /* the closed outline: pedicle -> superior -> anterior cut -> inferior (the septum-floor junction) -> posteroinferior cut */
    const bottomA = [];
    const aBottomPost = Math.max(colA(p, p.first), postAt(p, bottomAt(p, aStart)));
    for (const a of [aCut, ...columnsBetween(p, aBottomPost, aCut).reverse(), aBottomPost]) bottomA.push(pt(a, bottomAt(p, a)));
    const sBottom = bottomA[bottomA.length - 1][1];
    const posteroInferior = rows(sBottom, sc).slice(0, -1);
    const septal = [...out.pedicle, ...out.superior.slice(1), pt(aCut, bottomAt(p, aCut)), ...bottomA.slice(1), ...posteroInferior];
    out.septal = dedupe(septal);
    out.length = r3(diameter(out.septal));
    out.approx = r3(approximateShare(inputs.septal, out.septal));

    if (design === 'extended' && inputs.floor && inputs.floor.grid) {
        const fp = floorProfile(inputs.floor);
        const med = [];
        const lat = [];
        for (const [a, j] of [...fp.junction].sort((x, y) => x[0] - y[0])) {
            const col = fp.cols[Math.round((a - fp.a0) / fp.step)];
            if (!col || a < -47 || a > aCut) continue;     /* the junction rows' own rule: the PNS end (a < -47) is a partly covered edge */
            const rMed = Math.max(col.rMin, j.rFloor);       /* the strip is exactly `floor_width` wide, from the junction */
            const rLat = Math.min(col.rMax, j.rFloor + params.floor_width);
            if (rLat - rMed < 1e-6) continue;
            med.push(pt(a, rMed));
            lat.push(pt(a, rLat));
        }
        if (med.length > 1) {
            out.floor = dedupe([...med, ...lat.reverse()]);
            out.approx = r3(Math.max(out.approx, 0));
        } else out.notes.push('The floor chart holds no strip at this width.');
    }
    if (inputs.septal.grid && p.aAnt - aCut < 1e-6 + params.anterior_margin) out.notes.push('B and C end at the internal valve plane, the proxy for the mucocutaneous junction, which CT does not show.');
    if (design !== 'short' && params.top_margin < OLFACTORY_RISK_MM) out.notes.push('Olfactory risk: the superior incision is under the contract\'s 10 mm.');
    out.hash = hashOf([out.pedicle, out.superior, out.septal, out.floor || []]);
    return out;
}

function dedupe(poly) {
    const out = [];
    for (const q of poly) if (!out.length || Math.hypot(q[0] - out[out.length - 1][0], q[1] - out[out.length - 1][1]) > 1e-6) out.push(q);
    if (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-6) out.pop();
    return out;
}

/* ---------------- areas ---------------- */

/* mesh = { pts: flat RAS xyz, idx: triangle indices }; project(x, y, z) -> [u, v] on the chart. The 3-D area (mm²) of the
   triangles whose centroid projects inside the polygon, and their indices (the page draws them). */
export function meshArea(mesh, project, polygon) {
    const { pts, idx } = mesh;
    let mm2 = 0;
    const tris = [];
    for (let t = 0; t < idx.length; t += 3) {
        const i = idx[t] * 3;
        const j = idx[t + 1] * 3;
        const k = idx[t + 2] * 3;
        const cx = (pts[i] + pts[j] + pts[k]) / 3;
        const cy = (pts[i + 1] + pts[j + 1] + pts[k + 1]) / 3;
        const cz = (pts[i + 2] + pts[j + 2] + pts[k + 2]) / 3;
        const [u, v] = project(cx, cy, cz);
        if (!inPolygon(polygon, u, v)) continue;
        const ux = pts[j] - pts[i]; const uy = pts[j + 1] - pts[i + 1]; const uz = pts[j + 2] - pts[i + 2];
        const vx = pts[k] - pts[i]; const vy = pts[k + 1] - pts[i + 1]; const vz = pts[k + 2] - pts[i + 2];
        mm2 += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
        tris.push(t / 3);
    }
    return { mm2, tris };
}

export const projectSeptal = (x, y, z) => [y, z];
export const projectFloor = (x, y) => [y, Math.abs(x)];

/* ---------------- chart -> RAS (drawing) ---------------- */

/* The septal chart's surface point at (a, s): [r, a, s] from the nearest occupied cell within 3 cells, or null. */
export function septalPoint(chart, a, s) {
    const g = chart.grid;
    const ia0 = Math.round((a - g.origin[0]) / g.step);
    const is0 = Math.round((s - g.origin[1]) / g.step);
    let best = null;
    for (let d = 0; d <= 3 && !best; d++) {
        let bd = Infinity;
        for (let da = -d; da <= d; da++) {
            for (let ds = -d; ds <= d; ds++) {
                if (Math.max(Math.abs(da), Math.abs(ds)) !== d || !has(g, ia0 + da, is0 + ds)) continue;
                const dist = Math.hypot(da, ds);
                if (dist < bd) { bd = dist; best = { r: g.r[ia0 + da][is0 + ds], n: g.normal && g.normal[ia0 + da] && g.normal[ia0 + da][is0 + ds] }; }
            }
        }
    }
    return best ? { ras: [best.r, a, s], normal: best.n || null } : null;
}

/* The floor chart's surface point at (a, r) for a side: nearest occupied cell within 3 cells, or null. */
export function floorPoint(chart, side, a, r) {
    const g = chart.grid;
    const ia0 = Math.round((a - g.origin[0]) / g.step);
    const ir0 = Math.round(r / g.step);
    let best = null;
    for (let d = 0; d <= 3 && best === null; d++) {
        let bd = Infinity;
        for (let da = -d; da <= d; da++) {
            for (let dr = -d; dr <= d; dr++) {
                if (Math.max(Math.abs(da), Math.abs(dr)) !== d) continue;
                const v = g.s[ia0 + da] && g.s[ia0 + da][ir0 + dr];
                if (v === null || v === undefined) continue;
                const dist = Math.hypot(da, dr);
                if (dist < bd) { bd = dist; best = v; }
            }
        }
    }
    return best === null ? null : { ras: [side === 'R' ? r : -r, a, best], normal: [0, 0, -1] };     /* the tissue is below the floor's lining */
}

/* A polygon / polyline densified to at most `step` mm between vertices. */
export function densify(poly, step = 1, closed = true) {
    const out = [];
    const n = closed ? poly.length : poly.length - 1;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % poly.length];
        const k = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
        for (let m = 0; m < k; m++) out.push([x1 + ((x2 - x1) * m) / k, y1 + ((y2 - y1) * m) / k]);
    }
    if (!closed) out.push(poly[poly.length - 1].slice());
    return out;
}
