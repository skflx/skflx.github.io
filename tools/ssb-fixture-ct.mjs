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

   Usage:  node tools/ssb-fixture-ct.mjs [dir]   # default: a fresh temp dir; prints it
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

export function buildFixture() {
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
    const table = { version: 1, labels: Object.fromEntries(SITES.filter((s) => s.name).map((s) => [String(s.index), s.name])) };
    const raw16 = Buffer.alloc(labels.length * 2);
    labels.forEach((v, at) => raw16.writeUInt16LE(v, at * 2));
    return {
        meta, table, ct, labels,
        ctGz: zlib.gzipSync(Buffer.from(ct.buffer, ct.byteOffset, ct.byteLength), { level: 9 }),
        labelsGz: zlib.gzipSync(raw16, { level: 9 }),
        sites: SITES,
        sdfGz: zlib.gzipSync(Buffer.from(sdf.buffer, sdf.byteOffset, sdf.byteLength), { level: 9 }),
        sdf,
    };
}

/* The files as { 'ssb/ct/ct.json': Buffer, ... }. */
export function fixtureFiles(fx = buildFixture()) {
    return {
        'ssb/ct/ct.json': Buffer.from(JSON.stringify(fx.meta, null, 2)),
        'ssb/ct/ct.u8.gz': fx.ctGz,
        'ssb/ct/labels.u16.gz': fx.labelsGz,
        [`ssb/ct/sdf-${SDF_SPHERE.id}.u8.gz`]: fx.sdfGz,
        'ssb/geometry/labels.json': Buffer.from(JSON.stringify(fx.table, null, 2)),
    };
}

export function writeFixture(dir) {
    const files = fixtureFiles();
    for (const [rel, data] of Object.entries(files)) {
        const abs = path.join(dir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, data);
    }
    return { dir, files: Object.keys(files) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const dir = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'ssb-fixture-ct-'));
    const out = writeFixture(dir);
    console.log(`wrote ${out.files.length} files under ${out.dir}`);
    for (const f of out.files) console.log('  ' + f);
}
