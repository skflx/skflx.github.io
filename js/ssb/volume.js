/* =============================================================
   volume.js — the CT and label volumes as typed arrays (docs/ssb.md 5.6).

   Loads ssb/ct/ct.json + ct.u8.gz (or ct.i16.gz, a 16-bit head in HU, WP IN1)
   + labels.u16.gz (+ the label table), format in docs/ssb.md 5.3. Everything after the download is plain CPU
   arithmetic, so it needs no WebGL and no 3D textures:

   - voxel <-> RAS mm through the file's affine and its inverse (RAS is
     x right, y anterior, z superior; docs/ssb.md 4);
   - trilinear CT sampling, nearest-voxel label lookup, the approximate
     value -> HU table (display only);
   - slices: axial / coronal / sagittal in the radiological convention
     (patient right on the image's left), and an arbitrary oblique plane
     given as an origin and two in-plane unit vectors.

   The files are gzip, decoded with the browser's DecompressionStream, but
   only when the bytes start with the gzip magic 1f 8b: GitHub Pages may or
   may not send Content-Encoding, and when it does the browser has already
   decoded the body (docs/ssb.md 5.3). Volume files are data, never
   executed and never reaching markup.

   Imports stamps.js only; no DOM is touched, so the tests run this module
   in plain Node.
   ============================================================= */
import { STAMPS } from './stamps.js?v=2aa7b8f2';

export const CT_META = 'ssb/ct/ct.json';
export const CT_DATA = 'ssb/ct/ct.u8.gz';
export const CT_DATA_I16 = 'ssb/ct/ct.i16.gz';
/* the value range a head spans: display levels, or HU for a 16-bit head (the CT stage's window and LUT bounds) */
export const VALUE_RANGE = Object.freeze({ uint8: Object.freeze([0, 255]), int16: Object.freeze([-1024, 3071]) });

const DIM_MAX = 2048;
const VOXELS_MAX = 1 << 28;
const PIXELS_MAX = 4096;

export class VolumeError extends Error {
    /* code: 'absent' (no ct.json), 'unsupported', 'invalid', 'network'. */
    constructor(code, message) {
        super(message);
        this.name = 'VolumeError';
        this.code = code;
    }
}

const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/* The URL a data file is fetched from: stamped when stamps.js knows the file
   (it lists what is on disk), else as it is. */
export function stamped(file) {
    return own(STAMPS, file) ? `${file}?v=${STAMPS[file]}` : file;
}

/* ---------------- gzip ---------------- */

export function isGzip(bytes) {
    return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/* ArrayBuffer -> ArrayBuffer of the decoded bytes. Already-decoded bytes
   (the server sent Content-Encoding) pass through untouched. */
export async function decode(buf, expectedBytes = -1) {
    if (!isGzip(new Uint8Array(buf, 0, Math.min(2, buf.byteLength)))) return buf;
    if (typeof DecompressionStream !== 'function') {
        throw new VolumeError('unsupported', 'This browser cannot decompress the CT volume (DecompressionStream is missing).');
    }
    try {
        const stream = new Response(buf).body.pipeThrough(new DecompressionStream('gzip'));
        return await new Response(stream).arrayBuffer();
    } catch (e) {
        /* raw data that merely begins with the magic bytes */
        if (buf.byteLength === expectedBytes) return buf;
        throw new VolumeError('invalid', 'A CT data file is damaged (gzip could not be decoded).');
    }
}

/* ---------------- header ---------------- */

function matrix(m) {
    if (!Array.isArray(m) || m.length < 3) return null;
    const rows = [];
    for (let r = 0; r < 3; r++) {
        if (!Array.isArray(m[r]) || m[r].length !== 4 || !m[r].every(finite)) return null;
        rows.push(m[r].slice());
    }
    return rows;
}

/* Inverse of the affine's 3x3 part (adjugate / determinant), or null. */
function invert3(a) {
    const [[a0, a1, a2], [b0, b1, b2], [c0, c1, c2]] = a;
    const d0 = b1 * c2 - b2 * c1;
    const d1 = b2 * c0 - b0 * c2;
    const d2 = b0 * c1 - b1 * c0;
    const det = a0 * d0 + a1 * d1 + a2 * d2;
    if (!finite(det) || Math.abs(det) < 1e-12) return null;
    return [
        [d0 / det, (a2 * c1 - a1 * c2) / det, (a1 * b2 - a2 * b1) / det],
        [d1 / det, (a0 * c2 - a2 * c0) / det, (a2 * b0 - a0 * b2) / det],
        [d2 / det, (a1 * c0 - a0 * c1) / det, (a0 * b1 - a1 * b0) / det],
    ];
}

/* Validate ct.json -> the fields the volume uses; throws VolumeError('invalid'). */
export function parseHeader(meta) {
    const bad = (why) => new VolumeError('invalid', `ct.json: ${why}.`);
    if (!meta || typeof meta !== 'object') throw bad('not an object');
    if (meta.version !== 1) throw new VolumeError('unsupported', `ct.json: unsupported version ${String(meta.version)}.`);
    if (meta.dtype !== 'uint8' && meta.dtype !== 'int16') throw bad('dtype must be uint8 or int16');
    if (meta.dtype === 'int16' && !(meta.values && meta.values.kind === 'HU')) throw bad('an int16 volume needs values.kind "HU"');
    const dims = meta.dims;
    if (!Array.isArray(dims) || dims.length !== 3 || !dims.every((n) => Number.isInteger(n) && n >= 1 && n <= DIM_MAX)) throw bad('dims must be three integers');
    if (dims[0] * dims[1] * dims[2] > VOXELS_MAX) throw bad('volume too large');
    const spacing = meta.spacing;
    if (!Array.isArray(spacing) || spacing.length !== 3 || !spacing.every((s) => finite(s) && s > 0)) throw bad('spacing must be three positive numbers');
    const affine = matrix(meta.affine);
    if (!affine) throw bad('affine must be a 4x4 matrix of numbers');
    const inverse = invert3(affine.map((row) => row.slice(0, 3)));
    if (!inverse) throw bad('affine is singular');

    let toHU = null;
    const t = meta.values && meta.values.toHU;
    if (Array.isArray(t) && t.length >= 2 && t.every((p) => Array.isArray(p) && p.length === 2 && finite(p[0]) && finite(p[1]))) {
        toHU = t.map((p) => [p[0], p[1]]).sort((p, q) => p[0] - q[0]);
    }
    const windows = {};
    if (meta.windows && typeof meta.windows === 'object') {
        for (const [name, w] of Object.entries(meta.windows)) {
            if (/^[a-z][a-z0-9-]{0,23}$/.test(name) && w && finite(w.center) && finite(w.width) && w.width > 0) windows[name] = { center: w.center, width: w.width };
        }
    }
    /* per-head collision levels in the volume's own values: { soft: the air threshold, bone }, or null (scope.js defaults) */
    const lv = meta.levels;
    const levels = lv && typeof lv === 'object' && finite(lv.air) && finite(lv.bone) && lv.air < lv.bone ? { soft: lv.air, bone: lv.bone } : null;
    let labels = null;
    const l = meta.labels;
    if (l && typeof l === 'object' && typeof l.file === 'string' && /^[A-Za-z0-9._-]+$/.test(l.file) && (l.dtype === undefined || l.dtype === 'uint16')) {
        let table = null;
        if (typeof l.table === 'string') {
            if (/^[A-Za-z0-9._-]+\.json$/.test(l.table)) table = `ssb/ct/${l.table}`;
            else if (/^\.\.\/geometry\/[A-Za-z0-9._-]+\.json$/.test(l.table)) table = `ssb/geometry/${l.table.slice(12)}`;
        }
        labels = { file: `ssb/ct/${l.file}`, table };
    }
    return {
        dtype: meta.dtype, range: VALUE_RANGE[meta.dtype].slice(), levels,
        dims: dims.slice(), spacing: spacing.slice(), affine, inverse, toHU, windows, labels,
        values: meta.values && typeof meta.values === 'object' ? { kind: String(meta.values.kind || ''), note: String(meta.values.note || '') } : { kind: '', note: '' },
        specimen: typeof meta.specimen === 'string' ? meta.specimen : '',
    };
}

/* The RAS box of a parsed header's voxel centres: { min, max } in mm. The
   specimen stage reads it from the header alone, to clamp its 3D cursor
   before the volume itself has been downloaded. */
export function headerBounds(header) {
    const [nx, ny, nz] = header.dims;
    const A = header.affine;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const i of [0, nx - 1]) {
        for (const j of [0, ny - 1]) {
            for (const k of [0, nz - 1]) {
                for (let n = 0; n < 3; n++) {
                    const v = A[n][0] * i + A[n][1] * j + A[n][2] * k + A[n][3];
                    min[n] = Math.min(min[n], v);
                    max[n] = Math.max(max[n], v);
                }
            }
        }
    }
    return { min, max };
}

/* { "labels": { "1": "s.maxillary-sinus.R" } } -> Map(index -> name). */
export function parseTable(doc) {
    const out = new Map();
    const src = doc && typeof doc === 'object' ? doc.labels : null;
    if (!src || typeof src !== 'object') return out;
    for (const [key, name] of Object.entries(src)) {
        const i = Number(key);
        if (Number.isInteger(i) && i > 0 && i <= 65535 && typeof name === 'string' && /^[A-Za-z0-9._-]{1,120}$/.test(name)) out.set(i, name);
    }
    return out;
}

/* ---------------- planes ---------------- */

/* Radiological display: patient right on the image's left. u = the RAS
   direction of increasing image x, v = of increasing image y (downward).
   `normal` is the RAS axis a slice is perpendicular to; `sign` names that
   axis's positive and negative ends (S/I, A/P, R/L) and `letters` the
   orientation letters at the image's four edges. */
export const PLANES = Object.freeze({
    axial: Object.freeze({ title: 'Axial', normal: 2, uAxis: 0, vAxis: 1, u: [-1, 0, 0], v: [0, -1, 0],
        sign: ['S', 'I'], letters: Object.freeze({ left: 'R', right: 'L', top: 'A', bottom: 'P' }) }),
    coronal: Object.freeze({ title: 'Coronal', normal: 1, uAxis: 0, vAxis: 2, u: [-1, 0, 0], v: [0, 0, -1],
        sign: ['A', 'P'], letters: Object.freeze({ left: 'R', right: 'L', top: 'S', bottom: 'I' }) }),
    sagittal: Object.freeze({ title: 'Sagittal', normal: 0, uAxis: 1, vAxis: 2, u: [0, -1, 0], v: [0, 0, -1],
        sign: ['R', 'L'], letters: Object.freeze({ left: 'A', right: 'P', top: 'S', bottom: 'I' }) }),
});

const LITTLE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/* ---------------- the volume ---------------- */

/* header: parseHeader(); ct: Uint8Array, or Int16Array for an int16 head (x fastest); labels: Uint16Array or null;
   table: Map(index -> label name) or null. Throws VolumeError('invalid') on a
   size mismatch. */
export function createVolume({ header, ct, labels = null, table = null }) {
    const [nx, ny, nz] = header.dims;
    const count = nx * ny * nz;
    if (!(ct instanceof (header.dtype === 'int16' ? Int16Array : Uint8Array)) || ct.length !== count) throw new VolumeError('invalid', 'The CT data does not match the dimensions in ct.json.');
    if (labels !== null && (!(labels instanceof Uint16Array) || labels.length !== count)) labels = null;
    const A = header.affine;
    const B = header.inverse;
    const nameOf = table || new Map();

    /* RAS <-> voxel */
    const toRAS = (i, j, k) => [
        A[0][0] * i + A[0][1] * j + A[0][2] * k + A[0][3],
        A[1][0] * i + A[1][1] * j + A[1][2] * k + A[1][3],
        A[2][0] * i + A[2][1] * j + A[2][2] * k + A[2][3],
    ];
    const toVoxel = (r, a, s) => {
        const x = r - A[0][3];
        const y = a - A[1][3];
        const z = s - A[2][3];
        return [
            B[0][0] * x + B[0][1] * y + B[0][2] * z,
            B[1][0] * x + B[1][1] * y + B[1][2] * z,
            B[2][0] * x + B[2][1] * y + B[2][2] * z,
        ];
    };
    /* the linear part only: a RAS displacement -> a voxel displacement */
    const linear = (d) => [
        B[0][0] * d[0] + B[0][1] * d[1] + B[0][2] * d[2],
        B[1][0] * d[0] + B[1][1] * d[1] + B[1][2] * d[2],
        B[2][0] * d[0] + B[2][1] * d[1] + B[2][2] * d[2],
    ];

    /* RAS box of the voxel centres (where a cursor may sit). */
    const bounds = headerBounds(header);
    const { min, max } = bounds;
    const center = [0, 1, 2].map((n) => (min[n] + max[n]) / 2);
    /* voxel size along each RAS axis (the step of a scroll) */
    const axisStep = [0, 1, 2].map((n) => 1 / Math.hypot(B[0][n], B[1][n], B[2][n]));
    const step = Math.min(header.spacing[0], header.spacing[1], header.spacing[2]);

    const clampRAS = (p) => [0, 1, 2].map((n) => Math.min(max[n], Math.max(min[n], p[n])));

    /* trilinear, in voxel coordinates; NaN outside the volume (half a voxel of margin) */
    function trilinear(i, j, k) {
        if (!(i >= -0.5 && i < nx - 0.5 && j >= -0.5 && j < ny - 0.5 && k >= -0.5 && k < nz - 0.5)) return NaN;
        const ci = i < 0 ? 0 : i > nx - 1 ? nx - 1 : i;
        const cj = j < 0 ? 0 : j > ny - 1 ? ny - 1 : j;
        const ck = k < 0 ? 0 : k > nz - 1 ? nz - 1 : k;
        const i0 = Math.floor(ci);
        const j0 = Math.floor(cj);
        const k0 = Math.floor(ck);
        const i1 = i0 + 1 < nx ? i0 + 1 : i0;
        const j1 = j0 + 1 < ny ? j0 + 1 : j0;
        const k1 = k0 + 1 < nz ? k0 + 1 : k0;
        const fx = ci - i0;
        const fy = cj - j0;
        const fz = ck - k0;
        const r00 = j0 * nx;
        const r10 = j1 * nx;
        const s0 = k0 * nx * ny;
        const s1 = k1 * nx * ny;
        const c00 = ct[s0 + r00 + i0] * (1 - fx) + ct[s0 + r00 + i1] * fx;
        const c10 = ct[s0 + r10 + i0] * (1 - fx) + ct[s0 + r10 + i1] * fx;
        const c01 = ct[s1 + r00 + i0] * (1 - fx) + ct[s1 + r00 + i1] * fx;
        const c11 = ct[s1 + r10 + i0] * (1 - fx) + ct[s1 + r10 + i1] * fx;
        return (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz;
    }

    /* nearest voxel's label; 0 outside */
    function labelVoxel(i, j, k) {
        if (!labels || !(i >= -0.5 && i < nx - 0.5 && j >= -0.5 && j < ny - 0.5 && k >= -0.5 && k < nz - 0.5)) return 0;
        return labels[Math.floor(k + 0.5) * nx * ny + Math.floor(j + 0.5) * nx + Math.floor(i + 0.5)];
    }

    /* the approximate value -> HU inverse (display only); null without a table */
    const hu = header.toHU;
    function toHU(v) {
        if (header.dtype === 'int16') return finite(v) ? v : null;      /* already HU */
        if (!hu || !finite(v)) return null;
        if (v <= hu[0][0]) return hu[0][1];
        for (let n = 1; n < hu.length; n++) {
            if (v <= hu[n][0]) {
                const [x0, y0] = hu[n - 1];
                const [x1, y1] = hu[n];
                return x1 === x0 ? y1 : y0 + ((v - x0) / (x1 - x0)) * (y1 - y0);
            }
        }
        return hu[hu.length - 1][1];
    }

    /* ---- label names ---- */

    /* index -> { index, name: 's.maxillary-sinus.R', id: 's.maxillary-sinus', side: 'R' | 'L' | 'M' | '' }, or null */
    function describe(index) {
        const name = nameOf.get(index);
        if (name === undefined) return null;
        const m = /^(.+)\.(R|L|M)$/.exec(name);
        return { index, name, id: m ? m[1] : name, side: m ? m[2] : '' };
    }

    /* ---- slices ---- */

    /* The grid of an axis-aligned slice through `at` (RAS mm along the plane's
       normal axis): origin = RAS of the top-left pixel's centre, u / v = the
       per-pixel unit directions, step = mm per pixel. */
    function planeGeometry(plane, at, pixel = step) {
        const p = PLANES[plane];
        if (!p) throw new VolumeError('invalid', `Unknown plane '${String(plane)}'.`);
        const origin = [0, 0, 0];
        origin[p.normal] = Math.min(max[p.normal], Math.max(min[p.normal], finite(at) ? at : center[p.normal]));
        origin[p.uAxis] = p.u[p.uAxis] < 0 ? max[p.uAxis] : min[p.uAxis];
        origin[p.vAxis] = p.v[p.vAxis] < 0 ? max[p.vAxis] : min[p.vAxis];
        const width = Math.floor((max[p.uAxis] - min[p.uAxis]) / pixel + 1e-6) + 1;
        const height = Math.floor((max[p.vAxis] - min[p.vAxis]) / pixel + 1e-6) + 1;
        return { plane, normal: p.normal, at: origin[p.normal], origin, u: p.u.slice(), v: p.v.slice(), width, height, step: pixel };
    }

    /* RAS <-> the pixel grid of a slice (pixel centres at integers). */
    const pixelToRAS = (g, px, py) => [0, 1, 2].map((n) => g.origin[n] + g.u[n] * px * g.step + g.v[n] * py * g.step);
    const rasToPixel = (g, p) => {
        const d = [p[0] - g.origin[0], p[1] - g.origin[1], p[2] - g.origin[2]];
        return [
            (d[0] * g.u[0] + d[1] * g.u[1] + d[2] * g.u[2]) / g.step,
            (d[0] * g.v[0] + d[1] * g.v[1] + d[2] * g.v[2]) / g.step,
        ];
    };

    /* Resample the plane `geom` ({ origin, u, v, width, height, step }) into
       { geom, ct: Float32Array (NaN outside the volume), labels: Uint16Array }.
       Each row is a straight line in voxel space, so the voxel coordinates
       advance by a constant increment per pixel. */
    function resample(geom, wantCt, wantLabels) {
        const { width, height } = geom;
        const n = width * height;
        const out = wantCt ? new Float32Array(n) : null;
        const lab = wantLabels ? new Uint16Array(n) : null;
        const o = toVoxel(geom.origin[0], geom.origin[1], geom.origin[2]);
        const du = linear([geom.u[0] * geom.step, geom.u[1] * geom.step, geom.u[2] * geom.step]);
        const dv = linear([geom.v[0] * geom.step, geom.v[1] * geom.step, geom.v[2] * geom.step]);
        let at = 0;
        for (let y = 0; y < height; y++) {
            let i = o[0] + dv[0] * y;
            let j = o[1] + dv[1] * y;
            let k = o[2] + dv[2] * y;
            for (let x = 0; x < width; x++) {
                if (out) out[at] = trilinear(i, j, k);
                if (lab) lab[at] = labelVoxel(i, j, k);
                at += 1;
                i += du[0];
                j += du[1];
                k += du[2];
            }
        }
        return { geom, ct: out, labels: lab };
    }

    /* axial (at = z), coronal (at = y) or sagittal (at = x) slice, in mm. */
    function slice(plane, at, { pixel = step, ct: wantCt = true, labels: wantLabels = true } = {}) {
        return resample(planeGeometry(plane, at, pixel), wantCt, wantLabels);
    }

    /* Any plane: a pixel (x, y) is at origin + u x step + v y step (RAS mm);
       u and v are in-plane directions (normalized here; they need not be
       perpendicular to each other, only not parallel). */
    function obliqueSlice({ origin, u, v, width, height, pixel = step, ct: wantCt = true, labels: wantLabels = true }) {
        const unit = (d) => {
            if (!Array.isArray(d) || d.length !== 3 || !d.every(finite)) throw new VolumeError('invalid', 'An oblique plane needs two finite 3-vectors.');
            const len = Math.hypot(d[0], d[1], d[2]);
            if (len < 1e-9) throw new VolumeError('invalid', 'An oblique plane direction has zero length.');
            return [d[0] / len, d[1] / len, d[2] / len];
        };
        if (!Array.isArray(origin) || origin.length !== 3 || !origin.every(finite)) throw new VolumeError('invalid', 'An oblique plane needs a finite origin.');
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > PIXELS_MAX || height > PIXELS_MAX) {
            throw new VolumeError('invalid', 'An oblique plane needs an integer width and height in 1..4096.');
        }
        if (!(pixel > 0) || !finite(pixel)) throw new VolumeError('invalid', 'An oblique plane needs a positive pixel size.');
        return resample({ plane: 'oblique', origin: origin.slice(), u: unit(u), v: unit(v), width, height, step: pixel }, wantCt, wantLabels);
    }

    return {
        header, dims: header.dims, spacing: header.spacing, affine: A, ct, labels, count,
        step, axisStep, bounds, center, windows: header.windows, hasLabels: !!labels, dtype: header.dtype, range: header.range, levels: header.levels,
        labelIndices: () => [...nameOf.keys()],
        table: nameOf,
        toRAS, toVoxel, clampRAS, toHU, describe,
        value: (i, j, k) => (i >= 0 && i < nx && j >= 0 && j < ny && k >= 0 && k < nz ? ct[k * nx * ny + j * nx + i] : NaN),
        sample: (r, a, s) => { const v = toVoxel(r, a, s); return trilinear(v[0], v[1], v[2]); },
        labelAt: (r, a, s) => { const v = toVoxel(r, a, s); return labelVoxel(v[0], v[1], v[2]); },
        planeGeometry, pixelToRAS, rasToPixel, slice, obliqueSlice,
    };
}

/* ---------------- dissection patches (docs/ssb.md 5.8) ---------------- */

const PATCH_HEADER_MAX = 1 << 16;
const PATCH_BOXES_MAX = 16;
const BAD_PATCH = (why) => new VolumeError('invalid', `A dissection patch is not usable: ${why}.`);

/* The bytes of a patch (gzip or already decoded) -> { state, units, ctFill, boxes: [{ ijk0, dims, data: Uint16Array }] }.
   Layout: u32 header length, a JSON header { version: 1, base, state, units, ctFill, boxes: [{ ijk0, dims }] }, then per
   box one u16 array, x fastest: 0 = unchanged, else the voxel's new label (its CT display becomes ctFill). Refused with a
   VolumeError('invalid') unless the base is `expectedBase` (the state index's `base`: P1b writes the first 10 hex of the SHA-256
   of the specimen's raw CT and label arrays, and check-data pins it to the committed volume) or, with none given, this volume's
   specimen name; every box lies inside the volume, every label is in its table and the body is exactly the boxes' size;
   version 2 or any other is 'unsupported'. Pure: touches no volume. */
export async function parsePatch(bytes, volume, expectedBase = '') {
    const raw = bytes instanceof ArrayBuffer ? bytes : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const buf = await decode(raw);
    if (buf.byteLength < 4) throw BAD_PATCH('it is shorter than its header length');
    const view = new DataView(buf);
    const headLen = view.getUint32(0, true);
    if (headLen < 2 || headLen > PATCH_HEADER_MAX || 4 + headLen > buf.byteLength) throw BAD_PATCH('its header length is wrong');
    let head;
    try { head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, headLen))); } catch (e) { throw BAD_PATCH('its header is not JSON'); }
    if (!head || typeof head !== 'object') throw BAD_PATCH('its header is not an object');
    if (head.version !== 1) throw new VolumeError('unsupported', `A dissection patch has an unsupported version (${String(head.version)}).`);
    const want = typeof expectedBase === 'string' && expectedBase ? expectedBase : (volume && volume.header ? volume.header.specimen : '');
    if (typeof head.base !== 'string' || !want || head.base !== want) throw BAD_PATCH('it was made for a different specimen');
    if (!Number.isInteger(head.ctFill) || head.ctFill < 0 || head.ctFill > 255) throw BAD_PATCH('ctFill must be an integer in 0..255');
    if (!Array.isArray(head.boxes) || head.boxes.length > PATCH_BOXES_MAX) throw BAD_PATCH('its box list is missing or too long');
    const dims = volume.dims;
    let total = 0;
    const spec = head.boxes.map((b) => {
        const ok = b && Array.isArray(b.ijk0) && Array.isArray(b.dims) && b.ijk0.length === 3 && b.dims.length === 3
            && b.ijk0.every((n, a) => Number.isInteger(n) && n >= 0 && Number.isInteger(b.dims[a]) && b.dims[a] >= 1 && n + b.dims[a] <= dims[a]);
        if (!ok) throw BAD_PATCH('a box lies outside the volume');
        total += b.dims[0] * b.dims[1] * b.dims[2];
        return { ijk0: b.ijk0.slice(), dims: b.dims.slice() };
    });
    if (buf.byteLength !== 4 + headLen + total * 2) throw BAD_PATCH('its body is not the size of its boxes');
    let at = 4 + headLen;
    const boxes = spec.map((b) => {
        const n = b.dims[0] * b.dims[1] * b.dims[2];
        const data = new Uint16Array(n);
        for (let i = 0; i < n; i++) data[i] = view.getUint16(at + i * 2, true);
        at += n * 2;
        for (let i = 0; i < n; i++) if (data[i] !== 0 && !volume.table.has(data[i])) throw BAD_PATCH(`label ${data[i]} is not in the label table`);
        return { ...b, data };
    });
    return {
        state: typeof head.state === 'string' ? head.state.slice(0, 40) : '',
        units: Array.isArray(head.units) ? head.units.filter((u) => typeof u === 'string').slice(0, 64) : [],
        ctFill: head.ctFill, boxes,
    };
}

/* A volume with the patch applied: the same API, new arrays (the base is not touched), plus `carvedAt(r, a, s)` (does the
   patch change the voxel nearest that point?), `carvedVoxels` and `base`. Pure; Node-testable. */
export function applyPatch(volume, patch) {
    const [nx, ny] = volume.dims;
    const ct = volume.ct.slice();
    const labels = volume.labels ? volume.labels.slice() : new Uint16Array(volume.count);
    let carved = 0;
    for (const b of patch.boxes) {
        const [i0, j0, k0] = b.ijk0;
        const [bx, by, bz] = b.dims;
        let n = 0;
        for (let k = 0; k < bz; k++) {
            for (let j = 0; j < by; j++) {
                const row = (k0 + k) * nx * ny + (j0 + j) * nx + i0;
                for (let i = 0; i < bx; i++, n++) {
                    const v = b.data[n];
                    if (v !== 0) { ct[row + i] = patch.ctFill; labels[row + i] = v; carved += 1; }
                }
            }
        }
    }
    const derived = createVolume({ header: volume.header, ct, labels, table: volume.table });
    const carvedAt = (r, a, s) => {
        const v = volume.toVoxel(r, a, s);
        const i = Math.round(v[0]);
        const j = Math.round(v[1]);
        const k = Math.round(v[2]);
        for (const b of patch.boxes) {
            const x = i - b.ijk0[0];
            const y = j - b.ijk0[1];
            const z = k - b.ijk0[2];
            if (x >= 0 && y >= 0 && z >= 0 && x < b.dims[0] && y < b.dims[1] && z < b.dims[2] && b.data[(z * b.dims[1] + y) * b.dims[0] + x] !== 0) return true;
        }
        return false;
    };
    return Object.assign(derived, { carvedAt, carvedVoxels: carved, base: volume, meta: volume.meta, state: patch.state });
}

/* ---------------- loading ---------------- */

/* Fetch and decode the volume. fetchFn is injectable for tests. Missing
   ct.json -> VolumeError('absent'); missing labels -> a volume without
   them (CT mode then has no overlay). */
export async function loadVolume({ fetchFn = (url) => fetch(url) } = {}) {
    let res;
    try {
        res = await fetchFn(stamped(CT_META));
    } catch (e) {
        throw new VolumeError('network', 'The CT header could not be fetched.');
    }
    if (res.status === 404) throw new VolumeError('absent', 'ssb/ct/ct.json was not found.');
    if (!res.ok) throw new VolumeError('network', `ct.json: HTTP ${res.status}.`);
    let meta;
    try { meta = await res.json(); } catch (e) { throw new VolumeError('invalid', 'ct.json is not valid JSON.'); }
    const header = parseHeader(meta);
    const count = header.dims[0] * header.dims[1] * header.dims[2];

    const binary = async (file, expected, required) => {
        let r;
        try { r = await fetchFn(stamped(file)); } catch (e) { r = null; }
        if (!r || !r.ok) {
            if (required) throw new VolumeError('invalid', `${file} could not be fetched${r ? ` (HTTP ${r.status})` : ''}.`);
            return null;
        }
        const raw = await r.arrayBuffer();
        const buf = await decode(raw, expected);
        if (buf.byteLength !== expected) {
            if (required) throw new VolumeError('invalid', `${file} has ${buf.byteLength} bytes; ct.json implies ${expected}.`);
            return null;
        }
        return buf;
    };
    const json = async (file) => {
        try {
            const r = await fetchFn(stamped(file));
            return r.ok ? await r.json() : null;
        } catch (e) { return null; }
    };

    const i16 = header.dtype === 'int16';
    const [ctBuf, labBuf, tableDoc] = await Promise.all([
        binary(i16 ? CT_DATA_I16 : CT_DATA, i16 ? count * 2 : count, true),
        header.labels ? binary(header.labels.file, count * 2, false) : null,
        header.labels && header.labels.table ? json(header.labels.table) : null,
    ]);

    let labels = null;
    if (labBuf) {
        if (LITTLE) labels = new Uint16Array(labBuf);
        else {
            const view = new DataView(labBuf);
            labels = new Uint16Array(count);
            for (let n = 0; n < count; n++) labels[n] = view.getUint16(n * 2, true);
        }
    }
    let ct;
    if (!i16) ct = new Uint8Array(ctBuf);
    else if (LITTLE) ct = new Int16Array(ctBuf);
    else {
        const view = new DataView(ctBuf);
        ct = new Int16Array(count);
        for (let n = 0; n < count; n++) ct[n] = view.getInt16(n * 2, true);
    }
    const vol = createVolume({ header, ct, labels, table: parseTable(tableDoc) });
    vol.meta = meta;                     /* the raw header, for optional blocks (the endoscope's `sdf`) */
    return vol;
}

/* One volume per page: CT mode and the endoscope share it, and nothing is fetched until one of them asks
   (about 4 MB transferred, 27 MB decoded). A failed load is forgotten, so the next ask retries. */
let shared = null;
export function sharedVolume() {
    if (!shared) shared = loadVolume().catch((e) => { shared = null; throw e; });
    return shared;
}
