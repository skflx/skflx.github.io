#!/usr/bin/env node
/* =============================================================
   ssb-fixture-ct.mjs — a small synthetic CT volume in exactly the format
   CT mode reads (docs/ssb.md 5.3), for tests.

   It is a phantom, not anatomy: an ellipsoidal "head" (soft tissue, a bone
   shell, air outside) with a few air cavities carrying labels that use real
   graph ids, so tests can click a cavity and expect the graph's entity:

     1  s.maxillary-sinus.R     large     (patient right: +x)
     2  s.maxillary-sinus.L     smaller   (the asymmetry shows which side is which)
     3  s.agger-nasi-cell.R     a small IFAC cell (its own --ssb-cell-* hue)
     4  s.nasopharynx.M         midline
     5  s.fixture-unknown.R     an id that is not in the graph
     6  (no table entry)        a label index the table does not name

   The grid is anisotropic with one flipped axis (spacing 0.75 x 0.75 x 1.0 mm;
   j runs toward posterior), so a viewer that assumes an identity-like affine
   fails on it. The windows, toHU and file names are the format's own.

   Nothing is written into the repo: writeFixture(dir) fills a directory with
   the same layout the site serves (<dir>/ssb/ct/*, <dir>/ssb/geometry/labels.json),
   and tools/test-ssb.mjs routes the page's requests to it.

   buildFixture({ dtype: 'int16' }) is the same phantom as a 16-bit head (WP IN1): every display value mapped linearly
   (0 -> -1000, 255 -> 1500) into int16 HU (ct.i16.gz, values.kind HU, windows and `levels` in HU, no toHU table), so
   a test can run on either and expect the same picture and the same collision. fx.ct stays the u8 array; fx.ct16 is the HU array.

   Usage:  node tools/ssb-fixture-ct.mjs [dir] [--int16]   # default: a fresh temp dir; prints it
   Pure Node, zero dependencies.
   ============================================================= */
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

export const DIMS = [64, 56, 48];
export const SPACING = [0.75, 0.75, 1.0];
/* voxel (i, j, k, 1) -> RAS mm: x = 0.75 i - 24, y = 20.25 - 0.75 j (flipped), z = k - 18 */
export const AFFINE = [[0.75, 0, 0, -24], [0, -0.75, 0, 20.25], [0, 0, 1, -18], [0, 0, 0, 1]];

const AIR = 0;
const SOFT = 60;
const MUCOSA = 72;
const BONE = 235;

/* label index, graph label name, centre (RAS mm), radii (mm) */
export const SITES = [
    { index: 1, name: 's.maxillary-sinus.R', center: [10, 3, -4], radii: [6, 6, 5] },
    { index: 2, name: 's.maxillary-sinus.L', center: [-10, 3, -4], radii: [4, 5, 4] },
    { index: 3, name: 's.agger-nasi-cell.R', center: [4, 14, 8], radii: [2.5, 2.5, 2.5] },
    { index: 4, name: 's.nasopharynx.M', center: [0, -6, -12], radii: [3, 4, 3] },
    { index: 5, name: 's.fixture-unknown.R', center: [-10, -10, 12], radii: [2, 2, 2] },
    { index: 6, name: null, center: [6, -12, 14], radii: [1.5, 1.5, 1.5] },
];
/* One distance field for the endoscope's proximity HUD (E3): the distance to the surface of a sphere, so a test
   can compare it with the analytic value. 1 mm grid, value * scale = mm, 0 inside, clampMm and beyond = 250. */
export const SDF_SPHERE = { id: 's.orbit', center: [12, 8, 6], radius: 3 };
export const SDF_GRID = { dims: [51, 45, 51], origin: [-25, -22, -20], scale: 0.1, clampMm: 25 };
const HEAD = { center: [0, 0, 5], radii: [22, 19, 22] };
const SHELL = 2;   /* mm of bone */

const norm = (p, e) => Math.hypot(...[0, 1, 2].map((n) => (p[n] - e.center[n]) / e.radii[n]));

/* a tiny deterministic generator (mulberry32), so the fixture never changes */
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* u8 display value -> HU: linear over the whole byte (0 -> -1000, 255 -> 1500), so a window, a LUT and a level map
   exactly and the page renders the same picture on either head. (The u8 header's own toHU table is clamped and only
   approximate, display values not being HU; a 16-bit head has no such table.) */
export const displayToHU = (v) => -1000 + (v * 2500) / 255;
/* scope.js's constants (BONE_LEVEL 150, air 78) in HU, so collision matches the u8 head */
export const LEVELS_HU = { air: displayToHU(78), bone: displayToHU(150) };

export function buildFixture({ dtype = 'uint8' } = {}) {
    const [nx, ny, nz] = DIMS;
    const ct = new Uint8Array(nx * ny * nz);
    const labels = new Uint16Array(nx * ny * nz);
    const rand = rng(20260930);
    const inner = { center: HEAD.center, radii: HEAD.radii.map((r) => r - SHELL) };
    let n = 0;
    for (let k = 0; k < nz; k++) {
        for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++, n++) {
                const p = [AFFINE[0][0] * i + AFFINE[0][3], AFFINE[1][1] * j + AFFINE[1][3], AFFINE[2][2] * k + AFFINE[2][3]];
                let v = AIR;
                if (norm(p, HEAD) <= 1) v = norm(p, inner) <= 1 ? SOFT + Math.floor(rand() * 5) - 2 : BONE;
                /* a thin midline bony septum between the two sinuses */
                if (Math.abs(p[0]) < 0.6 && p[1] > -2 && p[1] < 18 && p[2] > -14 && p[2] < 10) v = BONE;
                for (const s of SITES) {
                    const d = norm(p, { center: s.center, radii: s.radii });
                    if (d <= 1) { v = AIR; labels[n] = s.index; } else if (d <= 1 + 1 / Math.min(...s.radii) && v !== AIR) v = MUCOSA;
                }
                ct[n] = v;
            }
        }
    }

    const [sx, sy, sz] = SDF_GRID.dims;
    const sdf = new Uint8Array(sx * sy * sz);
    let at = 0;
    for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++, at++) {
        const d = Math.hypot(i + SDF_GRID.origin[0] - SDF_SPHERE.center[0], j + SDF_GRID.origin[1] - SDF_SPHERE.center[1], k + SDF_GRID.origin[2] - SDF_SPHERE.center[2]) - SDF_SPHERE.radius;
        sdf[at] = Math.min(250, Math.max(0, Math.round(d / SDF_GRID.scale)));
    }
    const meta = {
        version: 1,
        dims: DIMS,
        spacing: SPACING,
        affine: AFFINE,
        affineNote: 'voxel (i,j,k,1) -> RAS mm (docs/ssb.md §4); row-major',
        dtype: 'uint8',
        values: {
            kind: 'display',
            note: 'bone-window display level from the source images, not HU',
            toHU: [[0, -1000], [45, -1000], [226, 1500], [255, 1500]],
        },
        windows: { bone: { center: 128, width: 255 }, soft: { center: 60, width: 40 } },
        labels: { file: 'labels.u16.gz', dtype: 'uint16', table: '../geometry/labels.json' },
        sdf: {
            dims: SDF_GRID.dims, spacing: [1, 1, 1],
            affine: [[1, 0, 0, SDF_GRID.origin[0]], [0, 1, 0, SDF_GRID.origin[1]], [0, 0, 1, SDF_GRID.origin[2]], [0, 0, 0, 1]],
            dtype: 'uint8', scale: SDF_GRID.scale, clampMm: SDF_GRID.clampMm,
            fields: { [SDF_SPHERE.id]: { file: `sdf-${SDF_SPHERE.id}.u8.gz`, hud: 'sphere' } },
        },
        specimen: 'synthetic-fixture',
        license: 'none (synthetic phantom for tests)',
    };
    let ct16 = null;
    if (dtype === 'int16') {
        ct16 = Int16Array.from(ct, (v) => Math.round(displayToHU(v)));
        const slope = 2500 / 255;
        meta.dtype = 'int16';
        meta.values = { kind: 'HU', note: 'Hounsfield units (the u8 phantom mapped linearly, 0 -> -1000, 255 -> 1500)' };
        meta.windows = Object.fromEntries(Object.entries(meta.windows).map(([k, w]) => [k, { center: Math.round(displayToHU(w.center)), width: Math.round(w.width * slope) }]));
        meta.levels = { air: Math.round(LEVELS_HU.air), bone: Math.round(LEVELS_HU.bone) };
    }
    const table = { version: 1, labels: Object.fromEntries(SITES.filter((s) => s.name).map((s) => [String(s.index), s.name])) };
    const raw16 = Buffer.alloc(labels.length * 2);
    labels.forEach((v, at) => raw16.writeUInt16LE(v, at * 2));
    return {
        meta, table, ct, ct16, labels,
        ct16Gz: ct16 ? zlib.gzipSync(Buffer.from(ct16.buffer, ct16.byteOffset, ct16.byteLength), { level: 9 }) : null,
        ctGz: zlib.gzipSync(Buffer.from(ct.buffer, ct.byteOffset, ct.byteLength), { level: 9 }),
        labelsGz: zlib.gzipSync(raw16, { level: 9 }),
        sites: SITES,
        sdfGz: zlib.gzipSync(Buffer.from(sdf.buffer, sdf.byteOffset, sdf.byteLength), { level: 9 }),
        sdf,
    };
}

/* ---------------- procedure states (WP P2, docs/ssb.md 5.8) ----------------

   A dissected-state fixture over the same phantom: one procedure (a real graph id, so its steps, `see` and `risk` are
   the graph's own) of three indexed steps. The phantom's one bony plate between two air labels is the septum between the
   two maxillary sinuses (|x| < 0.6 mm), so the holes are cylinders through it along the scope's shaft:

     step 1  a hole through the plate along the shaft of POSE (state A)
     step 2  nothing (the same state A)
     step 3  a second hole higher up the plate (state B = both holes)

   Each hole is the plate's bone voxels within HOLE_RADIUS_MM of its axis; a carved voxel takes the label of the sinus on its
   side (+x is label 1, the right sinus). A hole is 4 mm across, so it passes the 2.7 mm telescope and not the 4 mm one
   (the ring of the shaft's collision test is wider than the hole): the page tests switch to 2.7 mm. The scope's fulcrum is routed to FULCRUM (a `lm.naris.R` inside the phantom) and the
   choanal arch to a point that exempts the whole phantom from the midline rule (scope.js shaftClearance), so the only thing
   that stops POSE at step 0 is the bone plate. Nothing is written into the repo; test-ssb.mjs routes these in. */
export const PROC = {
    id: 'p.anterior-ethmoidectomy',
    keys: { a: '1a2b3c4d5e', b: '6f7a8b9c0d' },
    corridor: 'fixture-corridor',
    holes: [{ center: [0, 8, -4] }, { center: [0, 12, 4] }],
    dir: [-Math.SQRT1_2, -Math.SQRT1_2, 0],
    halfLength: 6,
    fulcrum: [4, 12, -4],
    arch: [0, 30, 30],
    pose: { side: 'R', depth: 5.5, yaw: -45, pitch: 0, roll: 0, lens: 0 },
    station: { side: 'R', depth: 5.5, yaw: -45, pitch: 0, roll: 0, lens: 30 },
};
export const HOLE_RADIUS_MM = 2.0;

/* The voxels a set of holes carves from the base: [{ index, i, j, k, label }] over the phantom. */
export function carveHoles(fx, holes) {
    const [nx, ny, nz] = DIMS;
    const out = [];
    const d = PROC.dir;
    for (let k = 0; k < nz; k++) {
        for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
                const n = (k * ny + j) * nx + i;
                if (fx.ct[n] < 150) continue;
                const p = [AFFINE[0][0] * i + AFFINE[0][3], AFFINE[1][1] * j + AFFINE[1][3], AFFINE[2][2] * k + AFFINE[2][3]];
                for (const h of holes) {
                    const q = [p[0] - h.center[0], p[1] - h.center[1], p[2] - h.center[2]];
                    const along = q[0] * d[0] + q[1] * d[1] + q[2] * d[2];
                    const r = Math.hypot(q[0] - along * d[0], q[1] - along * d[1], q[2] - along * d[2]);
                    if (Math.abs(along) <= PROC.halfLength && r <= HOLE_RADIUS_MM) { out.push({ index: n, i, j, k, label: p[0] >= 0 ? 1 : 2 }); break; }
                }
            }
        }
    }
    return out;
}

/* A patch (docs/ssb.md 5.8: u32 header length, JSON header, one u16 box) from carved voxels, as gzip bytes. `mutate` may
   change the header (tests use it to make bad patches). */
export function patchBytes(voxels, { state = 'fixture', base = 'synthetic-fixture', ctFill = 48, mutate = null, gz = true } = {}) {
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (const v of voxels) for (const [a, c] of [[0, v.i], [1, v.j], [2, v.k]]) { lo[a] = Math.min(lo[a], c); hi[a] = Math.max(hi[a], c); }
    const dims = voxels.length ? [0, 1, 2].map((a) => hi[a] - lo[a] + 1) : [1, 1, 1];
    const ijk0 = voxels.length ? lo : [0, 0, 0];
    const data = Buffer.alloc(dims[0] * dims[1] * dims[2] * 2);
    for (const v of voxels) data.writeUInt16LE(v.label, (((v.k - ijk0[2]) * dims[1] + (v.j - ijk0[1])) * dims[0] + (v.i - ijk0[0])) * 2);
    const header = { version: 1, base, state, units: [`fixture.${state}`], ctFill, boxes: [{ ijk0, dims }] };
    if (mutate) mutate(header);
    const json = Buffer.from(JSON.stringify(header));
    const len = Buffer.alloc(4);
    len.writeUInt32LE(json.length, 0);
    const raw = Buffer.concat([len, json, data]);
    return gz ? zlib.gzipSync(raw, { level: 9, mtime: 0 }) : raw;
}

/* The routed files of the procedure fixture, as { 'ssb/states/index.json': Buffer, ... }. */
export function procedureFiles(fx = buildFixture()) {
    const a = carveHoles(fx, [PROC.holes[0]]);
    const b = carveHoles(fx, PROC.holes);
    const index = {
        version: 1,
        base: 'synthetic-fixture',
        states: {
            [PROC.keys.a]: { units: ['fixture.a'], usedBy: [`${PROC.id}#1`], patch: `${PROC.keys.a}.ssbp.gz`, lining: null, hides: [], remnants: [], measured: { carved: a.length } },
            [PROC.keys.b]: { units: ['fixture.a', 'fixture.b'], usedBy: [`${PROC.id}#3`], patch: `${PROC.keys.b}.ssbp.gz`, lining: null, hides: [], remnants: [], measured: { carved: b.length } },
        },
        procedures: { [PROC.id]: { 1: PROC.keys.a, 2: PROC.keys.a, 3: PROC.keys.b } },
        corridors: { [PROC.corridor]: { name: 'Fixture corridor', procedures: [PROC.id], positions: { [`${PROC.id}#1`]: PROC.keys.b } } },
    };
    const stations = { version: 1, stations: {}, byState: { [PROC.keys.a]: { 't.medial-orbital-floor-30.R': { pose: PROC.station } } } };
    const landmarks = { 'lm.naris.R': PROC.fulcrum, 'lm.choanal-arch.M': PROC.arch };
    return {
        voxels: { a, b },
        files: {
            'ssb/states/index.json': Buffer.from(JSON.stringify(index)),
            [`ssb/states/${PROC.keys.a}.ssbp.gz`]: patchBytes(a, { state: 'a' }),
            [`ssb/states/${PROC.keys.b}.ssbp.gz`]: patchBytes(b, { state: 'b' }),
            'ssb/geometry/stations.json': Buffer.from(JSON.stringify(stations)),
            'ssb/geometry/landmarks.json': Buffer.from(JSON.stringify(landmarks)),
        },
    };
}

/* The files as { 'ssb/ct/ct.json': Buffer, ... }. */
export function fixtureFiles(fx = buildFixture()) {
    return {
        'ssb/ct/ct.json': Buffer.from(JSON.stringify(fx.meta, null, 2)),
        ...(fx.ct16 ? { 'ssb/ct/ct.i16.gz': fx.ct16Gz } : { 'ssb/ct/ct.u8.gz': fx.ctGz }),
        'ssb/ct/labels.u16.gz': fx.labelsGz,
        [`ssb/ct/sdf-${SDF_SPHERE.id}.u8.gz`]: fx.sdfGz,
        'ssb/geometry/labels.json': Buffer.from(JSON.stringify(fx.table, null, 2)),
    };
}

export function writeFixture(dir, { int16 = false } = {}) {
    const files = fixtureFiles(buildFixture({ dtype: int16 ? 'int16' : 'uint8' }));
    for (const [rel, data] of Object.entries(files)) {
        const abs = path.join(dir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, data);
    }
    return { dir, files: Object.keys(files) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const rest = process.argv.slice(2).filter((a) => !a.startsWith('--'));
    const dir = rest[0] || fs.mkdtempSync(path.join(os.tmpdir(), 'ssb-fixture-ct-'));
    const out = writeFixture(dir, { int16: process.argv.includes('--int16') });
    console.log(`wrote ${out.files.length} files under ${out.dir}`);
    for (const f of out.files) console.log('  ' + f);
}
