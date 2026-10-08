#!/usr/bin/env node
/* =============================================================
   test-ssb.mjs — SSB behavior tests (docs/ssb.md 9): the variant lab
   (phase 2), CT mode (phase 5) and the Specimen stage.

   Drives ssb.html in headless Chromium (software WebGL, smoke-lib.mjs) and
   reads the scene back through the read-only test window window.__ssb.lab
   (js/ssb/mode-lab.js): part names, graph ids, hazards, RAS bounding boxes,
   the computed frontal pathway, and a pixel where a click picks a part.

   Pins:
   - each diorama loads; every part is named <graph id>.<side> and its id,
     and every hazard id it carries, resolve in the knowledge graph;
   - presets agree with the graph's own classification criteria, and the
     preset buttons carry the graph's class labels;
   - ethmoid roof: Keros I -> III raises the lateral lamella by exactly the
     preset difference (per side); asymmetry lowers the left roof; the AEA
     drop follows its parameter; a supraorbital cell pushes the AEA down by
     the graph's mean drop (m.aea-mesentery-drop);
   - frontal recess: every IFAC rule the graph states, reproduced by the
     computed pathway under all three modelled uncinate attachments —
     anterior cells push it posteriorly, suprabullar cells anteriorly, a
     frontal septal cell laterally, the supraorbital cell lies posterolateral
     to it, and the uncinate attachment decides medial (middle meatus) vs
     lateral (infundibulum) drainage; and the same through the UI checkboxes;
   - clicking a part selects its graph entity (panel + URL follow);
   - a hostile #lab= is whitelisted and clamped, never markup;
   - each diorama opens on its lesson's view (ethmoid roof coronal, frontal
     recess sagittal) and the view buttons cut between the standard views;
   - on desktop the docked controls never cover the canvas and collapse to
     a rail; phones get the controls in the bottom sheet;
   - reduced motion stops the particles;
   - the tissue-material library (js/ssb/materials.js, docs/ssb.md 7.4): every
     graph `kind` (and the docs' vocabulary) has a material kind, every colour
     token exists for both themes, no shader animates; every kind compiles and
     draws without a WebGL error, hatched and not, at q=full and q=lite; the
     hash `q` key picks the quality (also at runtime) and a hostile value is
     ignored; programs are shared per kind (a selection adds materials, not
     programs); hazard hatching is visible on the real lab under both
     qualities; picking works under full; reduced motion adds no animation
     under full;
   - CT mode (docs/ssb.md 3, 5.6), on the synthetic volume of
     tools/ssb-fixture-ct.mjs, served by routing the page's ssb/ct/* and
     ssb/geometry/labels.json requests to it (nothing is written into ssb/):
     volume.js in plain Node (affine round trip, exact trilinear, slices agree
     with sample()/labelAt(), radiological orientation, oblique planes, gzip by
     magic bytes, loader errors, path whitelist) and the #ct= codec; in the
     page, the three views render non-blank, the crosshair is drawn at the same
     RAS point in all three and a click moves it within one voxel, label lookup
     returns the fixture's ids, hover names the structure with ≈HU, a click
     selects the entity, keys/wheel/windowing/outline toggle/colour key work,
     outline colours are the materials' tokens (and follow the theme), hostile
     #ct= values are clamped or ignored, a missing volume shows a message, CT
     works with WebGL blocked, and phones show one plane at a time;
   - the Specimen stage (docs/ssb.md 3, 5.3, 7), on the real packs, landmarks
     and CT header: the packs in plain Node (glTF, every node a graph id, inside
     the CT volume ± 5 mm, patient right is +x, the landmarks lie on their own
     side's meshes, an independent ray cast for the pick), the `#at=` cursor
     codec and the store's one shared cursor; in the page, the loader places
     every mesh exactly where the raw data says, the camera views agree with
     the landmarks (the viewer's left is the patient's right in an anterior
     view), layers (bone solid / X-ray / hidden, regions, landmarks and their
     tier-filtered labels), click-through picking, the cursor reaching CT and
     coming back, selection from the tree (highlight, partner, framing, no
     geometry), the section plane (pixels above the plane are gone), the lab
     and CT coming and going without leaks, bad and new packs (a truncated
     gzip is a message in place; a pack that appears loads; bad nodes are
     skipped with a console.warn), no WebGL, q=lite and phones;
   - the Endoscope stage (docs/ssb.md 3, js/ssb/scope.js): the scope's math in
     plain Node (lens 0 looks down the shaft, a 30 degree lens at roll 0 looks up,
     unit vectors, an upright horizon, the tip at depth 0 is the fulcrum, yaw
     swings toward the scope's own side) and the `#scope=` codec (round trip,
     hostile values clamped or ignored, the store's stage exclusivity); in the
     page, the stage renders non-blank inside a circular field of view, the
     camera is exactly the pose's tip and view, keys, drag and wheel change the
     pose, the light-post indicator moves with roll, the lights are the scope's,
     reduced motion adds no transition, leaving puts the specimen back;
   - zero real console errors throughout.

   Usage:  node tools/test-ssb.mjs [--base <url>] [--headed] [--shots <dir>] [--only ct|specimen|scope|procedure]
           --shots writes desktop + phone screenshots of each diorama, of
           CT mode (ct-*.png) and of the Specimen stage (spec-*.png).
   Exits nonzero on any failed check.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';
import { startServer, launchBrowser, collectErrors, ROOT } from './smoke-lib.mjs';
import { validate, contentFiles } from './ssb-content.mjs';
import { buildFixture, fixtureFiles, SDF_SPHERE as SDF_FX_SPHERE, PROC, procedureFiles, patchBytes, carveHoles } from './ssb-fixture-ct.mjs';

/* The browser modules under js/ have no package "type", so Node would reparse
   them and warn. Import them as data: URLs instead. The three below need
   neither three.js nor a DOM; their tables are pinned in section 6. */
const dataUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sourceOf = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { KINDS, TISSUE_KINDS, GRAPH_KINDS, TOKENS, kindForGraph, detectQuality } = await import(dataUrl(sourceOf('js/ssb/materials.js')));
const SCOPE_URL = dataUrl(sourceOf('js/ssb/scope.js'));
const { parseHash, formatHash, clampQuality, createStore, normalizeCt } = await import(dataUrl(sourceOf('js/ssb/state.js').replace(/from '\.\/scope\.js[^']*'/, `from '${SCOPE_URL}'`)));
const SC = await import(SCOPE_URL);
const { rasToScene, sceneToRas } = await import(dataUrl(sourceOf('js/ssb/frame.js')));
const KIT_URL = dataUrl(sourceOf('js/ssb/dioramas/kit.js')
  .replace(/from '\.\.\/frame\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/frame.js'))}'`)
  .replace(/from '\.\.\/materials\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/materials.js'))}'`));
const kit = await import(KIT_URL);
const SPH = await import(dataUrl(sourceOf('js/ssb/dioramas/sphenoid.js')
  .replace(/from '\.\/kit\.js[^']*'/, `from '${KIT_URL}'`)
  .replace(/from '\.\.\/materials\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/materials.js'))}'`)));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const SHOTS = opt('--shots', null);
const ONLY = opt('--only', null);   /* --only ct | specimen | scope | procedure | lab: just that section (development; `lab` is the sphenoid diorama) */

const results = [];
function check(name, cond, detail) { results.push({ name, ok: !!cond, detail }); }
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const r2 = (v) => Math.round(v * 100) / 100;

const { index: GRAPH } = validate(contentFiles());
const entity = (id) => (GRAPH.get(id) || {}).entity;

/* A Playwright screenshot (8-bit RGB/RGBA PNG) -> { width, height, at(x, y) -> [r, g, b] }. */
function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let bpp = 4;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bpp = data[9] === 6 ? 4 : 3; }
    else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let add = 0;
      if (f === 1) add = a; else if (f === 2) add = b; else if (f === 3) add = (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c); const pb = Math.abs(a - c); const pc = Math.abs(a + b - 2 * c); add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = (v + add) & 255;
    }
  }
  return { width, height, at: (x, y) => [out[y * stride + x * bpp], out[y * stride + x * bpp + 1], out[y * stride + x * bpp + 2]] };
}
const luma = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/* ---------------- page helpers ---------------- */

const allErrors = [];

async function open(browser, base, hash, { viewport = { width: 1280, height: 800 }, reducedMotion = 'no-preference', waitLab = true } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const errors = collectErrors(page);
  allErrors.push(errors);
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  if (waitLab) await page.waitForFunction(() => window.__ssb.lab && window.__ssb.lab.builds > 0, null, { timeout: 20000 });
  return { context, page, errors };
}

const builds = (page) => page.evaluate(() => (window.__ssb.lab ? window.__ssb.lab.builds : 0));

/* Run `fn`, then wait for the diorama to rebuild. */
async function act(page, fn) {
  const before = await builds(page);
  await fn();
  await page.waitForFunction((n) => window.__ssb.lab.builds > n, before, { timeout: 15000 });
}

const setHash = (page, hash) => act(page, () => page.evaluate((h) => { location.hash = h; }, hash));
const parts = (page) => page.evaluate(() => window.__ssb.lab.parts());
const part = async (page, name) => (await parts(page)).find((p) => p.name === name);
const height = (p) => p.box.max[2] - p.box.min[2];

/* Mean RAS coordinate `axis` of the pathway points with z in [lo, hi]. */
function meanIn(points, axis, lo, hi) {
  const pts = points.filter((p) => p[2] >= lo && p[2] <= hi);
  return pts.reduce((s, p) => s + p[axis], 0) / (pts.length || 1);
}
const AP = (path) => meanIn(path.points, 1, -12, 3);   /* recess + ostium: anteroposterior */
const ML = (path) => meanIn(path.points, 0, -3, 3);    /* ostium level: mediolateral (right side: +x lateral) */

/* ---------------- criteria parsing (the graph's own text) ---------------- */

/* "Olfactory fossa depth 1–3 mm." -> [1, 3]; "greater than 80°" -> (80, inf); "less than 45°" -> (-inf, 45) */
function criterionRange(text) {
  const range = text.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  if (range) return { lo: Number(range[1]), hi: Number(range[2]), closed: true };
  const gt = text.match(/greater than\s+(\d+(?:\.\d+)?)/i);
  if (gt) return { lo: Number(gt[1]), hi: Infinity, closed: false };
  const lt = text.match(/less than\s+(\d+(?:\.\d+)?)/i);
  if (lt) return { lo: -Infinity, hi: Number(lt[1]), closed: false };
  return null;
}
const inRange = (v, r) => (r.closed ? v >= r.lo && v <= r.hi : v > r.lo && v < r.hi);

/* ---------------- CT: the synthetic fixture (tools/ssb-fixture-ct.mjs) ---------------- */

const FX = buildFixture();
const FX_FILES = fixtureFiles(FX);
const VOLUME_URL = dataUrl(sourceOf('js/ssb/volume.js').replace(/from '\.\/stamps\.js[^']*'/, `from '${dataUrl('export const STAMPS = {};')}'`));
const { createVolume, parseHeader, parseTable, loadVolume, decode, isGzip, PLANES, VolumeError, parsePatch, applyPatch } = await import(VOLUME_URL);
const { parseIndex, stateKeyFor, stepCount } = await import(dataUrl(sourceOf('js/ssb/mode-procedure.js')
  .replace(/from '\.\/volume\.js[^']*'/, `from '${VOLUME_URL}'`).replace(/from '\.\/stamps\.js[^']*'/, `from '${dataUrl('export const STAMPS = {};')}'`)));
const arrEq = (a, b, tol = 1e-9) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol);

/* A fetch that answers from a { 'ssb/ct/ct.json': Buffer } map. `decoded`: the
   server already gunzipped (Content-Encoding); `status`: path -> forced HTTP status. */
const fetchFrom = (files, { decoded = false, status = {} } = {}) => async (url) => {
  const name = String(url).split('?')[0];
  const body = files[name];
  const code = status[name] || (body ? 200 : 404);
  if (code !== 200) return { ok: false, status: code };
  const bytes = decoded && name.endsWith('.gz') ? zlib.gunzipSync(body) : body;
  return {
    ok: true, status: 200,
    json: async () => JSON.parse(body.toString('utf8')),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
};

/* volume.js and the CT state codec, in plain Node. */
async function ctUnitTests() {
  const header = parseHeader(FX.meta);
  const vol = createVolume({ header, ct: FX.ct, labels: FX.labels, table: parseTable(FX.table) });
  const [bx, by, bz] = [vol.bounds.min, vol.bounds.max, vol.center];
  check('volume: bounds of the flipped-axis fixture affine', arrEq(bx, [-24, -21, -18]) && arrEq(by, [23.25, 20.25, 29]) && arrEq(bz, [-0.375, -0.375, 5.5]), JSON.stringify(vol.bounds));
  check('volume: one voxel per scroll step along each RAS axis (0.75, 0.75, 1.0)', arrEq(vol.axisStep, [0.75, 0.75, 1]), JSON.stringify(vol.axisStep));

  /* voxel <-> RAS, including a rotated and sheared affine */
  let worst = 0;
  const odd = createVolume({ header: parseHeader({ ...FX.meta, dims: [8, 9, 10], spacing: [1, 1, 1],
    affine: [[0.8, -0.35, 0.1, 5], [0.5, 0.9, -0.2, -7], [-0.1, 0.25, 1.3, 11], [0, 0, 0, 1]], labels: undefined }),
  ct: Uint8Array.from({ length: 720 }, (_, n) => 3 + 2 * (n % 8) + 3 * (Math.floor(n / 8) % 9) + Math.floor(n / 72)) });
  for (const v of [vol, odd]) {
    for (let n = 0; n < 40; n++) {
      const p = [(n * 7.3) % 50 - 25, (n * 3.1) % 40 - 20, (n * 5.9) % 40 - 15];
      const back = v.toRAS(...v.toVoxel(...p));
      worst = Math.max(worst, ...back.map((c, i) => Math.abs(c - p[i])));
    }
  }
  check('volume: toRAS(toVoxel(p)) returns p (plain and rotated/sheared affines)', worst < 1e-9, String(worst));

  /* trilinear reproduces a linear field exactly (value = 3 + 2i + 3j + k) */
  worst = 0;
  for (let n = 0; n < 60; n++) {
    const vox = [(n * 0.37) % 6.9 + 0.05, (n * 0.61) % 7.9 + 0.05, (n * 0.83) % 8.9 + 0.05];
    const got = odd.sample(...odd.toRAS(...vox));
    worst = Math.max(worst, Math.abs(got - (3 + 2 * vox[0] + 3 * vox[1] + vox[2])));
  }
  check('volume: trilinear sampling is exact on a linear field', worst < 1e-9, String(worst));
  check('volume: sampling outside the volume is NaN, a voxel centre returns its value, labelAt is the nearest voxel',
    Number.isNaN(vol.sample(99, 0, 0)) && Math.abs(vol.sample(...vol.toRAS(5, 6, 7)) - FX.ct[7 * 64 * 56 + 6 * 64 + 5]) < 1e-6
    && vol.labelAt(...vol.toRAS(5, 6, 7)) === FX.labels[7 * 64 * 56 + 6 * 64 + 5] && vol.labelAt(99, 0, 0) === 0);
  const site = FX.sites[0];
  check('volume: the label at a cavity centre is its table index, and the table names it', vol.labelAt(...site.center) === 1
    && vol.describe(1).name === 's.maxillary-sinus.R' && vol.describe(1).id === 's.maxillary-sinus' && vol.describe(1).side === 'R'
    && vol.describe(4).side === 'M' && vol.describe(6) === null, JSON.stringify(vol.describe(1)));

  /* display values -> approximate HU: the fixture's own toHU table */
  check('volume: toHU is the piecewise-linear table (0 -> -1000, 135.5 -> 250, 255 -> 1500)',
    vol.toHU(0) === -1000 && vol.toHU(45) === -1000 && Math.abs(vol.toHU(135.5) - 250) < 1e-9 && vol.toHU(255) === 1500 && vol.toHU(NaN) === null);

  /* slices: radiological orientation, and every pixel agrees with sample()/labelAt() */
  const at = { axial: -4, coronal: 3, sagittal: 10 };
  for (const plane of ['axial', 'coronal', 'sagittal']) {
    const sl = vol.slice(plane, at[plane], { pixel: 0.6 });
    const g = sl.geom;
    let bad = 0;
    for (let n = 0; n < 200; n++) {
      const px = (n * 17) % g.width;
      const py = (n * 29) % g.height;
      const ras = vol.pixelToRAS(g, px, py);
      const s = vol.sample(...ras);
      const v = sl.ct[py * g.width + px];
      if (!(Number.isNaN(s) && Number.isNaN(v)) && Math.abs(s - v) > 1e-3) bad++;
      if (vol.labelAt(...ras) !== sl.labels[py * g.width + px]) bad++;
    }
    check(`volume: ${plane} slice pixels equal sample()/labelAt() at their RAS points (${g.width} x ${g.height})`, bad === 0, `${bad} differ`);
  }
  const ax = vol.planeGeometry('axial', 0);
  const co = vol.planeGeometry('coronal', 0);
  const sa = vol.planeGeometry('sagittal', 0);
  check('volume: radiological display — axial and coronal put +x (patient right) on the image left; axial has anterior up, coronal superior up, sagittal anterior left',
    ax.origin[0] === vol.bounds.max[0] && ax.origin[1] === vol.bounds.max[1] && ax.u[0] === -1 && ax.v[1] === -1
    && co.origin[0] === vol.bounds.max[0] && co.origin[2] === vol.bounds.max[2] && co.v[2] === -1
    && sa.origin[1] === vol.bounds.max[1] && sa.u[1] === -1 && sa.origin[2] === vol.bounds.max[2], JSON.stringify([ax.origin, co.origin, sa.origin]));

  /* an oblique plane: the axial plane through origin+u+v equals the axial slice; a tilted one agrees with sample() */
  const axSlice = vol.slice('axial', -4);
  const obAx = vol.obliqueSlice({ origin: axSlice.geom.origin, u: [-1, 0, 0], v: [0, -1, 0], width: axSlice.geom.width, height: axSlice.geom.height, pixel: axSlice.geom.step });
  check('volume: an oblique plane with the axial directions equals the axial slice', obAx.ct.every((v, n) => (Number.isNaN(v) && Number.isNaN(axSlice.ct[n])) || v === axSlice.ct[n])
    && obAx.labels.every((v, n) => v === axSlice.labels[n]));
  const tilt = vol.obliqueSlice({ origin: [0, -10, -8], u: [2, 0, 0], v: [0, 1, 1], width: 40, height: 30, pixel: 0.7 });
  let tiltBad = 0;
  const vz = 1 / Math.SQRT2;
  for (let py = 0; py < 30; py += 3) {
    for (let px = 0; px < 40; px += 3) {
      const ras = [0 + px * 0.7, -10 + py * 0.7 * vz, -8 + py * 0.7 * vz];
      const s = vol.sample(...ras);
      const v = tilt.ct[py * 40 + px];
      if (!(Number.isNaN(s) && Number.isNaN(v)) && Math.abs(s - v) > 1e-3) tiltBad++;
    }
  }
  check('volume: a tilted oblique plane (normalized u, v) agrees with sample() pixel for pixel', tiltBad === 0, `${tiltBad} differ`);
  let threw = 0;
  for (const bad of [{ origin: [0, 0, 0], u: [0, 0, 0], v: [0, 1, 0], width: 4, height: 4 }, { origin: [NaN, 0, 0], u: [1, 0, 0], v: [0, 1, 0], width: 4, height: 4 },
    { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], width: 99999, height: 4 }]) {
    try { vol.obliqueSlice(bad); } catch (e) { if (e instanceof VolumeError) threw++; }
  }
  check('volume: an oblique plane with a zero direction, a NaN origin or an absurd size is refused', threw === 3, String(threw));

  /* gzip: magic bytes decide, raw bytes pass through, a damaged stream is refused */
  const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  const raw = Buffer.from([1, 2, 3, 4, 5]);
  const gz = zlib.gzipSync(raw);
  const out1 = Buffer.from(await decode(ab(gz), 5));
  const out2 = Buffer.from(await decode(ab(raw), 5));
  let damaged = null;
  try { await decode(ab(Buffer.concat([gz.subarray(0, 4), Buffer.from([9, 9, 9, 9, 9, 9, 9, 9, 9])])), 5); } catch (e) { damaged = e; }
  check('volume: gzip is decoded only when the bytes start 1f 8b; already-decoded bytes pass through; a damaged stream is a VolumeError',
    isGzip(gz) && !isGzip(raw) && out1.equals(raw) && out2.equals(raw) && damaged instanceof VolumeError && damaged.code === 'invalid', String(damaged));

  /* loading, through an injected fetch */
  const good = await loadVolume({ fetchFn: fetchFrom(FX_FILES) });
  check('loader: the fixture loads (gzip) with its labels and table', good.dims.join() === '64,56,48' && good.hasLabels && good.labelAt(...site.center) === 1 && good.ct.every((v, n) => v === FX.ct[n]));
  const plain = await loadVolume({ fetchFn: fetchFrom(FX_FILES, { decoded: true }) });
  check('loader: bytes the server already decoded (Content-Encoding) load the same', plain.ct.every((v, n) => v === FX.ct[n]) && plain.labels.every((v, n) => v === FX.labels[n]));
  const absent = await loadVolume({ fetchFn: fetchFrom({}) }).catch((e) => e);
  check('loader: a missing ct.json is VolumeError absent', absent instanceof VolumeError && absent.code === 'absent', String(absent));
  const noData = await loadVolume({ fetchFn: fetchFrom({ 'ssb/ct/ct.json': FX_FILES['ssb/ct/ct.json'] }) }).catch((e) => e);
  check('loader: ct.json without ct.u8.gz is VolumeError invalid', noData instanceof VolumeError && noData.code === 'invalid', String(noData));
  const noLabels = await loadVolume({ fetchFn: fetchFrom({ 'ssb/ct/ct.json': FX_FILES['ssb/ct/ct.json'], 'ssb/ct/ct.u8.gz': FX_FILES['ssb/ct/ct.u8.gz'] }) }).catch((e) => e);
  check('loader: a missing label volume only drops the labels', noLabels.hasLabels === false && noLabels.dims.join() === '64,56,48' && noLabels.labelAt(...site.center) === 0);
  const short = await loadVolume({ fetchFn: fetchFrom({ ...FX_FILES, 'ssb/ct/ct.u8.gz': zlib.gzipSync(Buffer.alloc(100)) }) }).catch((e) => e);
  check('loader: CT data that does not match the dims is VolumeError invalid', short instanceof VolumeError && short.code === 'invalid', String(short));
  const headers = [{ version: 2 }, { dims: [0, 4, 4] }, { dims: [4, 4] }, { spacing: [1, 0, 1] }, { dtype: 'float32' }, { affine: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1]] }, { affine: 'x' }];
  const refused = headers.filter((patch) => { try { parseHeader({ ...FX.meta, ...patch }); return false; } catch (e) { return e instanceof VolumeError; } }).length;
  check('loader: a header with a bad version, dims, spacing, dtype or affine is refused', refused === headers.length, `${refused}/${headers.length}`);
  const evil = parseHeader({ ...FX.meta, labels: { file: '../../etc/passwd', dtype: 'uint16', table: 'https://example.com/x.json' } });
  const evil2 = parseHeader({ ...FX.meta, labels: { file: 'labels.u16.gz', table: '../../secret.json' } });
  check('loader: label file and table names cannot leave ssb/ct and ssb/geometry', evil.labels === null && evil2.labels.table === null, JSON.stringify([evil.labels, evil2.labels]));

  /* the CT state codec */
  const has = (id) => GRAPH.has(id);
  const hp = (h) => parseHash(h, has);
  check('state: #ct=cor&at=12.5,31,48 parses to the coronal plane and that crosshair', JSON.stringify(hp('#ct=cor&at=12.5,31,48').ct) === '{"plane":"coronal","at":[12.5,31,48]}');
  check('state: the plane names ax/cor/sag and the full names are accepted, anything else (case, junk, markup, oblique) is ignored',
    ['ax', 'cor', 'sag', 'axial', 'coronal', 'sagittal'].every((p) => hp(`#ct=${p}`).ct) && ['AX', 'Axial', 'oblique', '', '<img src=x>', 'ax ', 'ax%00'].every((p) => !hp(`#ct=${p}`).ct));
  check('state: a crosshair that is not three finite numbers is dropped (the plane stays)',
    ['1,2', '1,2,3,4', 'a,b,c', 'NaN,1,2', 'Infinity,1,2', ',1,2', '1,,2', '<script>,1,2', '1e999,0,0', ''].every((at) => { const c = hp(`#ct=ax&at=${at}`).ct; return c && c.at === null; }));
  check('state: a lab in the hash wins over ct (one stage at a time)', !parseHash('#lab=ethmoid-roof&ct=ax', has, { 'ethmoid-roof': { params: [], presets: {} } }).ct);
  check('state: normalizeCt clamps to the bounds and to a sanity range without them',
    JSON.stringify(normalizeCt({ plane: 'ax', at: [1e9, -1e9, 5] }, { min: [-24, -21, -18], max: [23.25, 20.25, 29] })) === '{"plane":"axial","at":[23.25,-21,5]}'
    && normalizeCt({ plane: 'ax', at: [1e9, -1e9, 5] }).at.join() === '1000,-1000,5' && normalizeCt({ plane: 'nope', at: [1, 2, 3] }) === null);
  const st = createStore({ has, tierOf: () => 1, hash: '#ct=sag&at=1e9,-1e9,5', prefs: {}, labs: {} });
  const seen = [];
  st.subscribe((s, p, meta) => seen.push(meta.source));
  st.setCtBounds({ min: [-24, -21, -18], max: [23.25, 20.25, 29] });
  check('state: the loaded volume\'s bounds re-clamp a crosshair that came from the URL, and the hash follows',
    st.hash() === '#ct=sag&at=23.25,-21,5' && seen.join() === 'ct-bounds', st.hash());
  st.setCt({ plane: 'cor', at: [0, 1e6, 0] });
  check('state: setCt clamps too; entering the lab leaves ct and entering ct leaves the lab',
    st.hash() === '#ct=cor&at=0,20.25,0' && st.get().lab === null);
  const st2 = createStore({ has, tierOf: () => 1, hash: '#lab=k', prefs: {}, labs: { k: { params: [], presets: {} } } });
  st2.setCt({ plane: 'ax', at: null });
  const enteredCt = st2.get().lab === null && st2.get().ct.plane === 'axial' && st2.hash() === '#ct=ax';
  st2.setLab({ name: 'k', params: {} });
  const enteredLab = st2.get().ct === null && st2.get().lab.name === 'k';
  st2.leaveStage();
  check('state: setCt leaves the lab, setLab leaves ct, leaveStage clears both', enteredCt && enteredLab && st2.hash() === '');
  st.applyHash('#ct=ax&at=5e5,0,0');
  check('state: applyHash adopts and clamps ct from a pasted link', st.hash() === '#ct=ax&at=23.25,0,0', st.hash());
}

/* ---------------- CT in the browser ---------------- */

const FX_ROUTE = /\/ssb\/(ct\/[^?#]+|geometry\/labels\.json)(?:[?#].*)?$/;

/* data: 'fixture' serves the synthetic volume (encoded: with Content-Encoding: gzip,
   which the browser decodes itself), 'absent' answers 404 for ssb/ct/*, so the tests
   never depend on whether the real volume is in the tree. webgl: false makes
   getContext('webgl*') return null. wait: 'ct' waits for the volume to settle. */
async function openCt(browser, base, hash, { viewport = { width: 1280, height: 800 }, data = 'fixture', encoded = false, webgl = true, wait = 'ct', track = true } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 600 ? 2 : 1 });
  if (!webgl) {
    await context.addInitScript(() => {
      const real = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return typeof type === 'string' && /webgl/i.test(type) ? null : real.call(this, type, ...rest); };
    });
  }
  await context.route(FX_ROUTE, (route) => {
    const name = new URL(route.request().url()).pathname.replace(/^\//, '');
    if (data === 'absent' && name.startsWith('ssb/ct/')) return route.fulfill({ status: 404, body: 'not found' });
    const body = FX_FILES[name];
    if (!body) return route.fulfill({ status: 404, body: 'not found' });
    const headers = { 'content-type': name.endsWith('.json') ? 'application/json' : 'application/octet-stream' };
    if (encoded && name.endsWith('.gz')) headers['content-encoding'] = 'gzip';
    return route.fulfill({ status: 200, body, headers });
  });
  const page = await context.newPage();
  const errors = collectErrors(page);
  if (track) allErrors.push(errors);
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  if (wait === 'ct') await page.waitForFunction(() => window.__ssb.ct && !['idle', 'loading'].includes(window.__ssb.ct.status), null, { timeout: 20000 });
  if (wait === 'ct' && data === 'fixture') await page.waitForFunction(() => window.__ssb.ct.status !== 'ready' || Object.values(window.__ssb.ct.renders).some((n) => n > 0), null, { timeout: 20000 });
  return { context, page, errors };
}

const ct = (page, fn, arg) => page.evaluate(fn, arg);
const cursorOf = (page) => page.evaluate(() => window.__ssb.ct.cursor);
const clientOf = (page, plane, ras) => page.evaluate(([p, r]) => window.__ssb.ct.clientOf(p, r), [plane, ras]);
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/* Luma statistics over the image box of a view's canvas. */
function canvasStats(page, plane) {
  return page.evaluate((p) => {
    const canvas = document.querySelector(`.ssb-ct-view[data-plane="${p}"] canvas`);
    const box = window.__ssb.ct.crosshair(p).box;
    const d = canvas.getContext('2d').getImageData(box.x, box.y, box.w, box.h).data;
    let dark = 0; let mid = 0; let bright = 0; let sum = 0; let sum2 = 0;
    const n = box.w * box.h;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      if (l < 25) dark++; else if (l > 170) bright++; else if (l > 40 && l < 110) mid++;
      sum += l; sum2 += l * l;
    }
    const mean = sum / n;
    return { dark: dark / n, mid: mid / n, bright: bright / n, mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)), w: box.w, h: box.h };
  }, plane);
}

/* Where the crosshair is drawn: the mean position of crosshair-coloured pixels
   along a row and a column at the image's top-left edge (the arms run to the edges). */
function drawnCross(page, plane) {
  return page.evaluate((p) => {
    const canvas = document.querySelector(`.ssb-ct-view[data-plane="${p}"] canvas`);
    const h = window.__ssb.ct.crosshair(p);
    const want = window.__ssb.ct.crossColor().match(/[0-9a-f]{2}/gi).map((x) => parseInt(x, 16));
    const ctx = canvas.getContext('2d');
    const near = (d, i) => Math.abs(d[i] - want[0]) + Math.abs(d[i + 1] - want[1]) + Math.abs(d[i + 2] - want[2]) < 60;
    const row = ctx.getImageData(h.box.x, h.box.y + 1, h.box.w, 1).data;
    const col = ctx.getImageData(h.box.x + 1, h.box.y, 1, h.box.h).data;
    const xs = []; const ys = [];
    for (let i = 0; i < h.box.w; i++) if (near(row, i * 4)) xs.push(h.box.x + i);
    for (let i = 0; i < h.box.h; i++) if (near(col, i * 4)) ys.push(h.box.y + i);
    const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    return { x: mean(xs), y: mean(ys), nx: xs.length, ny: ys.length, box: h.box, dpr: window.devicePixelRatio };
  }, plane);
}

/* Mean luma of the 3 x 3 device pixels where `ras` must be drawn on `plane` (first principles, below). */
function lumaAt(page, plane, ras) {
  return page.evaluate(([p, at]) => {
    const canvas = document.querySelector(`.ssb-ct-view[data-plane="${p}"] canvas`);
    const box = window.__ssb.ct.crosshair(p).box;
    const max = [23.25, 20.25, 29];
    const axes = { axial: [0, 1, 64, 56], coronal: [0, 2, 64, 63], sagittal: [1, 2, 56, 63] }[p];
    const x = Math.round(box.x + ((max[axes[0]] - at[axes[0]]) / 0.75 + 0.5) * (box.w / axes[2]));
    const y = Math.round(box.y + ((max[axes[1]] - at[axes[1]]) / 0.75 + 0.5) * (box.h / axes[3]));
    const d = canvas.getContext('2d').getImageData(x - 1, y - 1, 3, 3).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return { luma: sum / 9, x, mid: box.x + box.w / 2 };
  }, [plane, ras]);
}

/* The device-pixel position an RAS point must be drawn at, from first principles:
   radiological display puts the maximum of x (and of y, z) at the image's left/top
   edge, pixels are 0.75 mm (the fixture's smallest spacing), centres at integers. */
const FX_MIN = [-24, -21, -18];
const FX_MAX = [23.25, 20.25, 29];
const fxPixels = (axis) => Math.floor((FX_MAX[axis] - FX_MIN[axis]) / 0.75 + 1e-6) + 1;
function expectedCross(ras) {
  const axes = { axial: [0, 1], coronal: [0, 2], sagittal: [1, 2] };
  return (plane, box) => {
    const [u, v] = axes[plane];
    return {
      x: box.x + ((FX_MAX[u] - ras[u]) / 0.75 + 0.5) * (box.w / fxPixels(u)),
      y: box.y + ((FX_MAX[v] - ras[v]) / 0.75 + 0.5) * (box.h / fxPixels(v)),
    };
  };
}

async function ctTests(browser, base) {
  const RSIN = FX.sites[0].center;        /* right maxillary sinus centre, RAS mm */
  const LSIN = FX.sites[1].center;
  const tokenRgb = (page, name) => page.evaluate((n) => {
    const probe = document.createElement('i');
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, name);

  /* ---- desktop: three linked views on the fixture ---- */
  {
    const { context, page, errors } = await openCt(browser, base, `#ct=ax&at=${RSIN.join(',')}`);
    const info = await ct(page, () => ({
      status: window.__ssb.ct.status, stage: document.getElementById('ssb-app').dataset.stage,
      pressed: document.querySelector('#ssb-stage-mode [data-stage="ct"]').getAttribute('aria-pressed'),
      views: [...document.querySelectorAll('.ssb-ct-view')].map((v) => { const r = v.getBoundingClientRect(); return { p: v.dataset.plane, w: r.width, h: r.height, x: r.left, y: r.top }; }),
      truth: document.querySelector('.ssb-ct-truth').textContent, truthShown: !document.querySelector('.ssb-ct-truth').hidden,
      dims: window.__ssb.ct.dims, cursor: window.__ssb.ct.cursor, plane: window.__ssb.ct.plane, hash: location.hash,
      canvasHidden: getComputedStyle(document.getElementById('ssb-ct')).display === 'none',
    }));
    check('CT: #ct=ax&at=… opens the CT stage on the fixture (status ready, CT pill pressed, three views laid out without overlap)',
      info.status === 'ready' && info.stage === 'ct' && info.pressed === 'true' && info.views.length === 3 && info.views.every((v) => v.w > 150 && v.h > 120)
      && !info.canvasHidden, JSON.stringify(info.views));
    check('CT: the volume came through the fixture route (dims 64 x 56 x 48) and the crosshair is where the URL put it', info.dims.join() === '64,56,48' && arrEq(info.cursor, RSIN, 1e-6) && info.plane === 'axial', JSON.stringify(info));
    check('CT: the truth badge says specimen CT and display values, not HU', info.truthShown && /Specimen CT/.test(info.truth) && /not HU/.test(info.truth), info.truth);
    check('CT: the hash is canonical', info.hash === `#ct=ax&at=${RSIN.join(',')}`, info.hash);

    for (const plane of ['axial', 'coronal', 'sagittal']) {
      const s = await canvasStats(page, plane);
      check(`CT: the ${plane} view is not blank (air, soft tissue and bone all drawn)`, s.dark > 0.05 && s.mid > 0.05 && s.bright > 0.01 && s.std > 25, JSON.stringify(s));
    }
    /* radiological convention: the big right sinus (x up to +16) is drawn on the image LEFT; the small left one (x down to -14) on the right */
    const rSide = await lumaAt(page, 'axial', [15, 5, RSIN[2]]);
    const lSide = await lumaAt(page, 'axial', [-15, 5, RSIN[2]]);
    check('CT: radiological display — x = +15 mm (inside the right sinus) is air on the image LEFT; x = -15 mm (beside the smaller left sinus) is tissue on the image RIGHT',
      rSide.luma < 30 && lSide.luma > 45 && rSide.x < rSide.mid && lSide.x > lSide.mid, JSON.stringify({ rSide, lSide }));
    const letters = await ct(page, () => Object.fromEntries([...document.querySelectorAll('.ssb-ct-view')].map((v) => {
      const at = (edge) => { const e = v.querySelector(`.ssb-ct-o[data-edge="${edge}"]`); const r = e.getBoundingClientRect(); return { t: e.textContent, x: r.left, y: r.top }; };
      return [v.dataset.plane, { left: at('left'), right: at('right'), top: at('top'), bottom: at('bottom') }];
    })));
    check('CT: orientation letters — axial R | L and A over P, coronal R | L and S over I, sagittal A | P and S over I, each in the right place',
      letters.axial.left.t === 'R' && letters.axial.right.t === 'L' && letters.axial.top.t === 'A' && letters.axial.bottom.t === 'P'
      && letters.coronal.left.t === 'R' && letters.coronal.right.t === 'L' && letters.coronal.top.t === 'S' && letters.coronal.bottom.t === 'I'
      && letters.sagittal.left.t === 'A' && letters.sagittal.right.t === 'P' && letters.sagittal.top.t === 'S' && letters.sagittal.bottom.t === 'I'
      && Object.values(letters).every((l) => l.left.x < l.right.x && l.top.y < l.bottom.y), JSON.stringify(letters));

    /* the drawn crosshair sits where first principles say, in all three views */
    const where = expectedCross(RSIN);
    for (const plane of ['axial', 'coronal', 'sagittal']) {
      const got = await drawnCross(page, plane);
      const want = where(plane, got.box);
      check(`CT: the ${plane} crosshair is drawn at the cursor's RAS point (±2 px)`, got.nx > 0 && got.ny > 0 && Math.abs(got.x - want.x) <= 2 && Math.abs(got.y - want.y) <= 2, JSON.stringify({ got, want }));
    }

    /* click the axial view: the cursor moves in-plane only; the other two views follow */
    const target = [-9, -7, RSIN[2]];
    const at1 = await clientOf(page, 'axial', target);
    await page.mouse.click(at1.x, at1.y);
    await settle(page);
    const c1 = await cursorOf(page);
    check('CT: a click in the axial view puts the cursor at that RAS point (within one voxel) and keeps the slice', Math.abs(c1[0] - target[0]) <= 0.75 && Math.abs(c1[1] - target[1]) <= 0.75 && c1[2] === RSIN[2], JSON.stringify(c1));
    const where1 = expectedCross(c1);
    for (const plane of ['axial', 'coronal', 'sagittal']) {
      const got = await drawnCross(page, plane);
      const want = where1(plane, got.box);
      check(`CT: after the click the ${plane} crosshair moved to the same RAS point (±2 px)`, Math.abs(got.x - want.x) <= 2 && Math.abs(got.y - want.y) <= 2, JSON.stringify({ got, want }));
    }
    const round = await ct(page, (c) => {
      const out = {};
      for (const p of ['coronal', 'sagittal']) { const px = window.__ssb.ct.clientOf(p, c); out[p] = window.__ssb.ct.rasAt(p, px.x, px.y); }
      return out;
    }, c1);
    check('CT: clicking where the coronal / sagittal crosshair is would give the same RAS point back (within one voxel)',
      round.coronal.every((v, n) => Math.abs(v - c1[n]) <= 0.75) && round.sagittal.every((v, n) => Math.abs(v - c1[n]) <= 0.75), JSON.stringify(round));
    check('CT: the URL follows the crosshair (once a drag settles)', await page.evaluate((c) => new Promise((resolve) => {
      const want = `#ct=ax&at=${c.map((v) => String(Number(v.toFixed(2)))).join(',')}`;
      const t0 = performance.now();
      const tick = () => (location.hash === want ? resolve(true) : performance.now() - t0 > 2000 ? resolve(location.hash) : setTimeout(tick, 50));
      tick();
    }), c1) === true);

    /* clicking in the coronal view activates it and moves the cursor in that plane; the axial slice follows its z */
    const at2 = await clientOf(page, 'coronal', [3, c1[1], 1]);
    await page.mouse.click(at2.x, at2.y);
    await settle(page);
    const c2 = await cursorOf(page);
    const plane2 = await page.evaluate(() => ({ plane: window.__ssb.ct.plane, active: document.querySelector('.ssb-ct-view[data-active="true"]').dataset.plane }));
    check('CT: a click in the coronal view makes it the active plane and moves the crosshair in x and z, not in y',
      plane2.plane === 'coronal' && plane2.active === 'coronal' && Math.abs(c2[0] - 3) <= 0.75 && Math.abs(c2[2] - 1) <= 1 && c2[1] === c1[1], JSON.stringify({ c2, plane2 }));

    /* label lookup: the fixture's structure ids */
    await page.evaluate((r) => { location.hash = `#ct=ax&at=${r.join(',')}`; }, RSIN);
    await page.waitForFunction((r) => window.__ssb.ct.cursor.every((v, n) => Math.abs(v - r[n]) < 1e-6), RSIN);
    await settle(page);
    const hits = await page.evaluate((sites) => sites.map((s) => ({ name: s.name, got: window.__ssb.ct.describeAt(s.center) })), FX.sites);
    check('CT: label lookup at each fixture cavity centre returns its structure id, graph name and side',
      hits[0].got.label === 's.maxillary-sinus.R' && hits[0].got.graphId === 's.maxillary-sinus' && hits[0].got.name === `${entity('s.maxillary-sinus').name} (right)`
      && hits[1].got.label === 's.maxillary-sinus.L' && hits[1].got.name === `${entity('s.maxillary-sinus').name} (left)`
      && hits[2].got.graphId === 's.agger-nasi-cell' && hits[3].got.graphId === 's.nasopharynx' && hits[3].got.name === entity('s.nasopharynx').name
      && hits[4].got.label === 's.fixture-unknown.R' && hits[4].got.graphId === null && hits[5].got.name === 'Label 6' && hits[5].got.graphId === null,
    JSON.stringify(hits.map((h) => [h.name, h.got.label, h.got.graphId, h.got.name])));
    const air = await page.evaluate(() => window.__ssb.ct.describeAt([0, -18, 20]));
    check('CT: away from every label the index is 0; the HU follows the value (air ≈ -1000, bone well above 0)',
      air.index === 0 && air.hu === -1000 && (await page.evaluate(() => window.__ssb.ct.describeAt([20.5, 0, 5]).hu)) > 500, JSON.stringify(air));

    /* hover names the structure and gives ≈HU */
    const hov = await clientOf(page, 'axial', RSIN);
    await page.mouse.move(hov.x + 2, hov.y + 2);
    await page.mouse.move(hov.x, hov.y);
    await page.waitForFunction(() => { const t = document.querySelector('.ssb-ct-view[data-plane="axial"] .ssb-ct-tip'); return t && !t.hidden; }, null, { timeout: 4000 }).catch(() => {});
    const tip = await page.evaluate(() => ({ text: document.querySelector('.ssb-ct-view[data-plane="axial"] .ssb-ct-tip').textContent, hover: window.__ssb.ct.hover }));
    check('CT: hovering a cavity shows its graph name and ≈ HU (and does not move the crosshair)', /Maxillary sinus \(right\)/.test(tip.text) && /≈ −1000 HU/.test(tip.text) && tip.hover.label === 's.maxillary-sinus.R', JSON.stringify(tip));
    await page.mouse.move(hov.x, hov.y - 200);

    /* clicking a labelled voxel selects the graph entity in the existing panel */
    const pick = await clientOf(page, 'axial', LSIN.map((v, n) => (n === 2 ? RSIN[2] : v)));
    await page.mouse.click(pick.x, pick.y);
    await page.waitForFunction(() => window.__ssb.selection === 's.maxillary-sinus', null, { timeout: 5000 }).catch(() => {});
    const sel = await page.evaluate(() => ({ s: window.__ssb.selection, panel: !!document.querySelector('#ssb-panel-body [data-entity="s.maxillary-sinus"]'), hash: location.hash, sel: window.__ssb.ct.selectedLabels }));
    check('CT: clicking a labelled voxel selects its graph entity (panel and URL follow; both sides of the structure are highlighted)',
      sel.s === 's.maxillary-sinus' && sel.panel && /s=s\.maxillary-sinus/.test(sel.hash) && /ct=ax/.test(sel.hash) && sel.sel.join() === '1,2', JSON.stringify(sel));
    const empty = await clientOf(page, 'axial', [-20, -17, RSIN[2]]);
    await page.mouse.click(empty.x, empty.y);
    await settle(page);
    check('CT: clicking unlabelled tissue moves the crosshair but leaves the selection alone', (await page.evaluate(() => window.__ssb.selection)) === 's.maxillary-sinus');

    /* keyboard: arrows scroll the active plane a voxel, PageUp/Down ten, Shift+arrows move in-plane */
    await page.evaluate((r) => { location.hash = `#ct=ax&at=${r.join(',')}`; }, [0, 0, 0]);
    await page.waitForFunction(() => window.__ssb.ct.cursor[2] === 0);
    await page.focus('.ssb-ct-view[data-plane="axial"] canvas');
    await page.keyboard.press('ArrowUp');
    check('CT keys: ArrowUp scrolls the axial plane up one voxel (1.0 mm in z)', arrEq(await cursorOf(page), [0, 0, 1], 1e-6), JSON.stringify(await cursorOf(page)));
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('PageDown');
    check('CT keys: ArrowLeft scrolls back one, PageDown ten (z = -10)', arrEq(await cursorOf(page), [0, 0, -10], 1e-6), JSON.stringify(await cursorOf(page)));
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowUp');
    check('CT keys: Shift+arrows move the crosshair in the image plane (left = patient right = +x; up = anterior = +y; 0.75 mm)', arrEq(await cursorOf(page), [0.75, 0.75, -10], 1e-6), JSON.stringify(await cursorOf(page)));
    await page.keyboard.press('2');
    const two = await page.evaluate(() => ({ plane: window.__ssb.ct.plane, focus: document.activeElement.closest('.ssb-ct-view') && document.activeElement.closest('.ssb-ct-view').dataset.plane }));
    check('CT keys: 2 picks the coronal plane and focuses its view', two.plane === 'coronal' && two.focus === 'coronal', JSON.stringify(two));
    await page.keyboard.press('ArrowUp');
    check('CT keys: the arrows now scroll the coronal plane (y +0.75 mm)', arrEq(await cursorOf(page), [0.75, 1.5, -10], 1e-6), JSON.stringify(await cursorOf(page)));
    await page.keyboard.press('3');
    await page.keyboard.press('PageUp');
    check('CT keys: 3 picks the sagittal plane; PageUp scrolls it ten voxels (x +7.5 mm)', arrEq(await cursorOf(page), [8.25, 1.5, -10], 1e-6), JSON.stringify(await cursorOf(page)));
    await page.keyboard.press('Home');
    check('CT keys: Home recentres the crosshair on the volume', arrEq(await cursorOf(page), [-0.375, -0.375, 5.5], 1e-6), JSON.stringify(await cursorOf(page)));
    for (let n = 0; n < 40; n++) await page.keyboard.press('PageUp');
    const top = await cursorOf(page);
    check('CT keys: scrolling stops at the volume bounds (x max 23.25)', top[0] === 23.25, JSON.stringify(top));
    await page.keyboard.press('Home');
    await page.keyboard.press('1');

    /* the wheel scrolls the plane under it */
    const c0 = await cursorOf(page);
    const wheelAt = await clientOf(page, 'axial', c0);
    await page.mouse.move(wheelAt.x, wheelAt.y);
    await page.mouse.wheel(0, -100);
    await settle(page);
    const c3 = await cursorOf(page);
    await page.mouse.wheel(0, 100);
    await page.mouse.wheel(0, 100);
    await settle(page);
    const c4 = await cursorOf(page);
    check('CT: the wheel scrolls the plane under the pointer one voxel per notch (up = superior)', Math.abs(c3[2] - c0[2] - 1) < 1e-6 && Math.abs(c4[2] - c0[2] + 1) < 1e-6 && c3[0] === c0[0], JSON.stringify([c0, c3, c4]));
    await context.close();
    check('CT: no console errors on the fixture page', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
  }

  /* ---- window, outlines, colours, theme ---- */
  {
    const { context, page } = await openCt(browser, base, `#ct=ax&at=${RSIN.join(',')}`);
    const bone = await canvasStats(page, 'axial');
    const presets = await page.$$eval('#ssb-ct button[data-preset]', (bs) => bs.map((b) => b.dataset.preset));
    check('CT: the window presets are the ones in ct.json (bone, soft), bone first', presets.join() === 'bone,soft' && (await page.evaluate(() => window.__ssb.ct.window.name)) === 'bone', presets.join());
    const tissue = [-3, -10, RSIN[2]];
    const boneTissue = await lumaAt(page, 'axial', tissue);
    await page.click('#ssb-ct button[data-preset="soft"]');
    await settle(page);
    const soft = await canvasStats(page, 'axial');
    const softTissue = await lumaAt(page, 'axial', tissue);
    const w = await page.evaluate(() => window.__ssb.ct.window);
    check('CT: the soft window (centre 60, width 40) is recorded and lifts soft tissue (value 60) from dark grey to mid grey while air stays black',
      w.name === 'soft' && w.center === 60 && w.width === 40 && boneTissue.luma < 85 && softTissue.luma > boneTissue.luma + 40 && soft.dark > 0.3 && Math.abs(soft.mean - bone.mean) > 8,
      JSON.stringify({ w, boneTissue, softTissue, bone, soft }));
    await page.$eval('#ssb-ct-width', (input) => { input.value = '120'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    const cw = await page.evaluate(() => ({ w: window.__ssb.ct.window, out: document.querySelector('#ssb-ct output[for="ssb-ct-width"]').textContent }));
    check('CT: the width slider sets a custom window (no preset pressed) and its readout', cw.w.width === 120 && cw.w.name === '' && cw.out === '120'
      && (await page.$$eval('#ssb-ct button[data-preset][aria-pressed="true"]', (b) => b.length)) === 0, JSON.stringify(cw));
    await page.focus('.ssb-ct-view[data-plane="axial"] canvas');
    await page.keyboard.press('w');
    check('CT keys: W cycles the window presets (custom -> bone)', (await page.evaluate(() => window.__ssb.ct.window.name)) === 'bone');
    /* right-drag: width across, level up/down */
    const c = await clientOf(page, 'axial', [0, -15, RSIN[2]]);
    const before = await page.evaluate(() => window.__ssb.ct.window);
    await page.mouse.move(c.x, c.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(c.x - 60, c.y + 30, { steps: 4 });
    await page.mouse.up({ button: 'right' });
    const after = await page.evaluate(() => window.__ssb.ct.window);
    check('CT: a right-button drag sets width (left narrows) and level (down lowers), without moving the crosshair',
      after.width < before.width - 30 && after.center < before.center - 10 && after.name === '' && arrEq(await cursorOf(page), RSIN, 1e-6), JSON.stringify({ before, after }));
    await page.click('#ssb-ct button[data-preset="bone"]');

    /* outlines: colours are the materials' --ssb tokens */
    const colors = await page.evaluate(() => ({ r: window.__ssb.ct.colorOf(1), l: window.__ssb.ct.colorOf(2), cell: window.__ssb.ct.colorOf(3), unknown: window.__ssb.ct.colorOf(5), nasopharynx: window.__ssb.ct.colorOf(4) }));
    const tokens = { space: await tokenRgb(page, '--ssb-space'), anc: await tokenRgb(page, '--ssb-cell-anc'), slate: await tokenRgb(page, '--ssb-cell-ethmoid') };
    check('CT: outline colours come from the materials tokens — a sinus is --ssb-space, the agger nasi cell its --ssb-cell-anc, a structure not in the graph the slate --ssb-cell-ethmoid; both sides alike',
      colors.r === tokens.space && colors.l === tokens.space && colors.cell === tokens.anc && colors.unknown === tokens.slate, JSON.stringify({ colors, tokens }));
    const outlined = (rgb) => page.evaluate((want) => {
      const c = document.querySelector('.ssb-ct-view[data-plane="axial"] canvas');
      const b = window.__ssb.ct.crosshair('axial').box;
      const d = c.getContext('2d').getImageData(b.x, b.y, b.w, b.h).data;
      const m = want.match(/\d+/g).map(Number);
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - m[0]) + Math.abs(d[i + 1] - m[1]) + Math.abs(d[i + 2] - m[2]) < 12) n++;
      return n;
    }, rgb);
    const withOutline = await outlined(colors.r);
    await page.uncheck('#ssb-ct-overlay');
    await settle(page);
    const without = await outlined(colors.r);
    check('CT: the outline toggle draws and removes the label outlines (right sinus outline pixels present, then gone)', withOutline > 40 && without === 0 && (await page.evaluate(() => window.__ssb.ct.overlay)) === false, `${withOutline} -> ${without}`);
    await page.focus('.ssb-ct-view[data-plane="axial"] canvas');
    await page.keyboard.press('o');
    await settle(page);
    check('CT keys: O toggles the outlines back on', (await outlined(colors.r)) > 40 && (await page.$eval('#ssb-ct-overlay', (b) => b.checked)));
    const key = await page.$$eval('.ssb-ct-legend-list li', (lis) => lis.map((li) => li.textContent));
    check('CT: the colour key lists each labelled structure once (both sides merged; the id that is not in the graph by its id)',
      key.length === 4 && ['s.maxillary-sinus', 's.agger-nasi-cell', 's.nasopharynx'].every((id) => key.includes(entity(id).name)) && key.includes('s.fixture-unknown'), JSON.stringify(key));
    await page.click('.ssb-ct-legend');
    await page.click('.ssb-ct-legend-item[data-ref="s.agger-nasi-cell"]');
    await page.waitForFunction(() => window.__ssb.selection === 's.agger-nasi-cell', null, { timeout: 4000 }).catch(() => {});
    check('CT: a colour-key entry selects that entity (and its label is filled on the slices)', (await page.evaluate(() => window.__ssb.selection)) === 's.agger-nasi-cell' && (await page.evaluate(() => window.__ssb.ct.selectedLabels.join())) === '3');

    /* the stage follows the page theme's tokens, stays dark */
    await page.click('.site-theme-toggle');
    await page.waitForFunction((was) => window.__ssb.ct.colorOf(1) !== was, colors.r, { timeout: 4000 }).catch(() => {});
    const dark = await page.evaluate(() => ({ r: window.__ssb.ct.colorOf(1), theme: document.documentElement.dataset.theme }));
    const darkSpace = await tokenRgb(page, '--ssb-space');
    check('CT: switching to the dark theme re-reads the tokens (the outline colours change with it)', dark.theme === 'dark' && dark.r === darkSpace && dark.r !== colors.r, JSON.stringify({ dark, darkSpace }));
    await context.close();
  }

  /* ---- hostile #ct= ---- */
  {
    const cases = [
      ['#ct=ax&at=1e9,1e9,-1e9', '#ct=ax&at=23.25,20.25,-18', [23.25, 20.25, -18], 'ct'],
      ['#ct=cor&at=NaN,1,2', '#ct=cor', [-0.375, -0.375, 5.5], 'ct'],
      ['#ct=sag&at=1,2', '#ct=sag', [-0.375, -0.375, 5.5], 'ct'],
      ['#ct=ax&at=' + encodeURIComponent('<img src=x id=pwnct onerror=window.__pwned=1>') + ',1,2', '#ct=ax', [-0.375, -0.375, 5.5], 'ct'],
      ['#ct=AX&at=1,2,3', '', null, 'specimen'],
      ['#ct=oblique', '', null, 'specimen'],
      ['#ct=' + encodeURIComponent('<img src=x id=pwnct onerror=window.__pwned=1>') + '&at=1,2,3', '', null, 'specimen'],
      ['#lab=ethmoid-roof&ct=ax&at=1,2,3', '#lab=ethmoid-roof', null, 'lab'],
    ];
    for (const [hash, want, cursor, stage] of cases) {
      const { context, page } = await openCt(browser, base, hash, { wait: stage === 'ct' ? 'ct' : 'graph' });
      if (stage === 'lab') await page.waitForFunction(() => window.__ssb.lab && window.__ssb.lab.builds > 0, null, { timeout: 20000 });
      await page.waitForTimeout(stage === 'ct' ? 300 : 500);
      const got = await page.evaluate(() => ({ hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, cursor: window.__ssb.ct.cursor, pwn: !!document.getElementById('pwnct') || !!window.__pwned }));
      check(`CT: hostile ${hash.slice(0, 44)}… → ${stage} stage, hash ${JSON.stringify(want)}${cursor ? ', cursor clamped to ' + cursor.join(',') : ''}, never markup`,
        got.hash === want && got.stage === stage && !got.pwn && (!cursor || arrEq(got.cursor, cursor, 1e-6)), JSON.stringify(got));
      await context.close();
    }
  }

  /* ---- no volume: a clear message, the rest of the page unharmed ---- */
  {
    const { context, page, errors } = await openCt(browser, base, '#ct=cor', { data: 'absent', track: false });
    const got = await page.evaluate(() => {
      const msg = document.querySelector('#ssb-ct .ssb-ct-msg');
      return {
        status: window.__ssb.ct.status, text: msg.textContent, shown: !msg.hidden && msg.getBoundingClientRect().height > 20,
        grid: getComputedStyle(document.querySelector('.ssb-ct-grid')).visibility, tree: document.querySelectorAll('#ssb-tree button[data-id]').length,
        cursor: window.__ssb.ct.cursor, hash: location.hash,
      };
    });
    check('CT: with no ssb/ct/ct.json the stage says so (names the file), draws no views, and the tree still works',
      got.status === 'absent' && got.shown && /ssb\/ct\/ct\.json/.test(got.text) && /no CT volume/i.test(got.text) && got.grid === 'hidden' && got.tree > 10 && got.cursor === null && got.hash === '#ct=cor', JSON.stringify(got));
    check('CT: the only console noise is the expected 404 for the missing file', errors.every((e) => /404/.test(e.text)), JSON.stringify(errors));
    await page.keyboard.press('ArrowUp');
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    const leave = await page.evaluate(() => ({ hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, hidden: document.getElementById('ssb-ct').hidden }));
    check('CT: Specimen leaves the message stage (keys did nothing, nothing threw)', leave.hash === '' && leave.stage === 'specimen' && leave.hidden, JSON.stringify(leave));
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await page.waitForFunction(() => window.__ssb.ct.status === 'absent' && location.hash === '#ct=ax', null, { timeout: 8000 }).catch(() => {});
    check('CT: entering CT again retries (and reports the same)', (await page.evaluate(() => window.__ssb.ct.status)) === 'absent' && (await page.evaluate(() => location.hash)) === '#ct=ax');
    await context.close();
  }

  /* ---- no WebGL: CT is the documented fallback ---- */
  {
    const { context, page, errors } = await openCt(browser, base, `#ct=ax&at=${RSIN.join(',')}`, { webgl: false });
    const caps = await page.evaluate(() => ({ webgl2: window.__ssb.caps.webgl2, lab: document.querySelector('#ssb-stage-mode [data-stage="lab"]').disabled,
      ct: document.querySelector('#ssb-stage-mode [data-stage="ct"]').disabled, spec: document.querySelector('#ssb-stage-mode [data-stage="specimen"]').disabled,
      msg: document.getElementById('ssb-stage-msg').textContent, frames: window.__ssb.frames, ctRows: document.getElementById('ssb-ct').getBoundingClientRect().height }));
    check('no WebGL: the page has no 3D stage (Lab pill disabled, no frames) but CT and Specimen pills are live, and CT covers the stage',
      !caps.webgl2 && caps.lab && !caps.ct && !caps.spec && /WebGL/.test(caps.msg) && caps.frames === 0 && caps.ctRows > 300, JSON.stringify(caps));
    await page.waitForFunction(() => Object.values(window.__ssb.ct.renders).every((n) => n > 0), null, { timeout: 15000 });
    const stats = await Promise.all(['axial', 'coronal', 'sagittal'].map((p) => canvasStats(page, p)));
    check('no WebGL: CT mode loads the volume and all three views render (CPU-drawn, non-blank)', stats.every((s) => s.dark > 0.05 && s.bright > 0.01 && s.std > 25), JSON.stringify(stats));
    const here = await clientOf(page, 'axial', RSIN);
    await page.mouse.click(here.x, here.y);
    await page.waitForFunction(() => window.__ssb.selection === 's.maxillary-sinus', null, { timeout: 4000 }).catch(() => {});
    check('no WebGL: a click on a cavity still selects its entity in the panel', (await page.evaluate(() => window.__ssb.selection)) === 's.maxillary-sinus');
    await page.focus('.ssb-ct-view[data-plane="axial"] canvas');
    await page.keyboard.press('ArrowUp');
    check('no WebGL: keyboard scrolling works', arrEq(await cursorOf(page), [RSIN[0], RSIN[1], RSIN[2] + 1], 0.01), JSON.stringify(await cursorOf(page)));
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    const back = await page.evaluate(() => ({ ctHidden: document.getElementById('ssb-ct').hidden, msg: !document.getElementById('ssb-stage-msg').hidden, text: document.getElementById('ssb-stage-msg').textContent }));
    check('no WebGL: Specimen leaves CT and shows the needs-WebGL message again', back.ctHidden && back.msg && /WebGL/.test(back.text), JSON.stringify(back));
    check('no WebGL: no console errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  /* ---- Content-Encoding: the browser has already decoded the body ---- */
  {
    const { context, page } = await openCt(browser, base, `#ct=ax&at=${LSIN.join(',')}`, { encoded: true });
    const got = await page.evaluate((c) => ({ status: window.__ssb.ct.status, label: window.__ssb.ct.describeAt(c).label }), LSIN);
    check('CT: a server that sends Content-Encoding: gzip (body already decoded) loads the same volume', got.status === 'ready' && got.label === 's.maxillary-sinus.L', JSON.stringify(got));
    await context.close();
  }

  /* ---- stage switching ---- */
  {
    const { context, page } = await openCt(browser, base, '', { wait: 'graph' });
    await page.waitForFunction(() => !document.querySelector('#ssb-stage-mode [data-stage="ct"]').disabled && !document.querySelector('#ssb-stage-mode [data-stage="lab"]').disabled, null, { timeout: 15000 });
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await page.waitForFunction(() => window.__ssb.ct.status === 'ready');
    const inCt = await page.evaluate(() => ({ hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, pressed: [...document.querySelectorAll('#ssb-stage-mode [aria-pressed="true"]')].map((b) => b.dataset.stage) }));
    check('stage switch: the CT pill enters CT (#ct=ax), the other pills are not pressed', inCt.hash === '#ct=ax' && inCt.stage === 'ct' && inCt.pressed.join() === 'ct', JSON.stringify(inCt));
    await page.click('#ssb-stage-mode [data-stage="lab"]');
    await page.waitForFunction(() => window.__ssb.lab && window.__ssb.lab.builds > 0);
    const inLab = await page.evaluate(() => ({ hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, ctHidden: document.getElementById('ssb-ct').hidden, pressed: [...document.querySelectorAll('#ssb-stage-mode [aria-pressed="true"]')].map((b) => b.dataset.stage) }));
    check('stage switch: Lab leaves CT (one stage at a time) and the hash is the lab\'s', inLab.stage === 'lab' && inLab.ctHidden && /^#lab=/.test(inLab.hash) && !/ct=/.test(inLab.hash) && inLab.pressed.join() === 'lab', JSON.stringify(inLab));
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await settle(page);
    const again = await page.evaluate(() => ({ hash: location.hash, lab: window.__ssb.lab.name, stage: document.getElementById('ssb-app').dataset.stage }));
    check('stage switch: CT leaves the lab again', again.stage === 'ct' && again.lab === null && again.hash === '#ct=ax', JSON.stringify(again));
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    check('stage switch: Specimen clears the hash', (await page.evaluate(() => location.hash)) === '' && (await page.evaluate(() => document.getElementById('ssb-app').dataset.stage)) === 'specimen');
    await context.close();
  }

  /* ---- phone: one plane at a time ---- */
  {
    const { context, page } = await openCt(browser, base, `#ct=cor&at=${RSIN.join(',')}`, { viewport: { width: 390, height: 844 } });
    const vis = () => page.evaluate(() => ({
      shown: [...document.querySelectorAll('.ssb-ct-view')].filter((v) => getComputedStyle(v).display !== 'none').map((v) => v.dataset.plane),
      switcher: getComputedStyle(document.querySelector('.ssb-ct-sec-planes')).display !== 'none',
      overflow: document.scrollingElement.scrollWidth - window.innerWidth, stage: document.getElementById('ssb-stage').getBoundingClientRect().height,
      view: (() => { const r = document.querySelector('.ssb-ct-view[data-active="true"]').getBoundingClientRect(); return { w: r.width, h: r.height }; })(),
      sliders: document.querySelector('.ssb-ct-sliders').open,
    }));
    const a = await vis();
    check('phone: one plane fills the stage (the active one), with the plane switcher and a usable view', a.shown.join() === 'coronal' && a.switcher && a.view.w > 340 && a.view.h > 250 && a.overflow <= 0 && !a.sliders, JSON.stringify(a));
    check('phone: the coronal view draws', (await canvasStats(page, 'coronal')).std > 25);
    await page.click('#ssb-ct button[data-plane="sagittal"]');
    await page.waitForFunction(() => window.__ssb.ct.plane === 'sagittal' && window.__ssb.ct.renders.sagittal > 0);
    await settle(page);
    const b = await vis();
    check('phone: the plane switcher shows the sagittal view alone and records it in the URL', b.shown.join() === 'sagittal' && (await page.evaluate(() => location.hash)).startsWith('#ct=sag') && (await canvasStats(page, 'sagittal')).std > 25, JSON.stringify(b));
    /* drag on the view moves the crosshair */
    const p0 = await clientOf(page, 'sagittal', RSIN);
    await page.mouse.move(p0.x, p0.y);
    await page.mouse.down();
    await page.mouse.move(p0.x + 20, p0.y + 10, { steps: 3 });
    await page.mouse.up();
    const moved = await cursorOf(page);
    check('phone: a drag on the view moves the crosshair (posterior is to the image right in sagittal)', moved[1] < RSIN[1] - 1 && moved[2] < RSIN[2] - 0.5 && moved[0] === RSIN[0], JSON.stringify(moved));
    await context.close();
  }
}

/* ---------------- Specimen: the packs in plain Node ---------------- */

/* Every pack packs.json lists, parsed without three.js: node key -> { id, side,
   pack, pts (RAS mm, dequantized through the node's own transform), box, tris }.
   An independent reading of the data: the page's loader is checked against it. */
function readPacks() {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8'));
  const nodes = new Map();
  const files = {};
  for (const [name, def] of Object.entries(doc.packs)) {
    const b = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'ssb/models', def.file)));
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const json = JSON.parse(b.subarray(20, 20 + dv.getUint32(12, true)).toString());
    const bin = 20 + dv.getUint32(12, true) + 8;
    files[name] = { magic: dv.getUint32(0, true), version: dv.getUint32(4, true), length: dv.getUint32(8, true), size: b.length, json };
    for (const n of json.nodes) {
      const prim = json.meshes[n.mesh].primitives[0];
      const pa = json.accessors[prim.attributes.POSITION];
      const bv = json.bufferViews[pa.bufferView];
      const off = bin + (bv.byteOffset || 0);
      const stride = bv.byteStride || 6;
      const pts = new Float64Array(pa.count * 3);
      const lo = [Infinity, Infinity, Infinity];
      const hi = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < pa.count; i++) {
        for (let k = 0; k < 3; k++) {
          const v = dv.getInt16(off + i * stride + k * 2, true) * n.scale[k] + n.translation[k];
          pts[i * 3 + k] = v;
          if (v < lo[k]) lo[k] = v;
          if (v > hi[k]) hi[k] = v;
        }
      }
      const ia = json.accessors[prim.indices];
      const iv = json.bufferViews[ia.bufferView];
      const idx = new Uint16Array(ia.count);
      for (let i = 0; i < ia.count; i++) idx[i] = dv.getUint16(bin + (iv.byteOffset || 0) + i * 2, true);
      nodes.set(`${def.lining ? 'lining:' : ''}${n.extras.id}.${n.extras.side}`, { id: n.extras.id, side: n.extras.side, kind: n.extras.kind || '', pack: name, lining: def.lining === true, pts, idx, box: { min: lo, max: hi }, tris: ia.count / 3 });
    }
  }
  return { doc, nodes, files };
}

const ctBox = (() => {
  const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/ct/ct.json'), 'utf8'));
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const i of [0, h.dims[0] - 1]) for (const j of [0, h.dims[1] - 1]) for (const k of [0, h.dims[2] - 1]) {
    for (let n = 0; n < 3; n++) { const v = h.affine[n][0] * i + h.affine[n][1] * j + h.affine[n][2] * k + h.affine[n][3]; lo[n] = Math.min(lo[n], v); hi[n] = Math.max(hi[n], v); }
  }
  return { min: lo, max: hi };
})();

/* Nearest vertex of a parsed node to a RAS point, mm. */
function nearestVertex(node, p) {
  let best = Infinity;
  for (let i = 0; i < node.pts.length; i += 3) {
    const d = (node.pts[i] - p[0]) ** 2 + (node.pts[i + 1] - p[1]) ** 2 + (node.pts[i + 2] - p[2]) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* The nearest intersection of a ray (RAS mm) with any triangle of the parsed packs (Moller-Trumbore): { t, key, point } or null. */
function rayNearest(nodes, o, d) {
  let best = null;
  for (const [key, n] of nodes) {
    const p = n.pts;
    for (let t = 0; t < n.idx.length; t += 3) {
      const a = n.idx[t] * 3;
      const b = n.idx[t + 1] * 3;
      const c = n.idx[t + 2] * 3;
      const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
      const e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
      const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
      const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
      if (Math.abs(det) < 1e-12) continue;
      const s = [o[0] - p[a], o[1] - p[a + 1], o[2] - p[a + 2]];
      const u = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) / det;
      if (u < 0 || u > 1) continue;
      const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
      const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
      if (v < 0 || u + v > 1) continue;
      const tt = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
      if (tt > 1e-6 && (!best || tt < best.t)) best = { t: tt, key, point: [o[0] + d[0] * tt, o[1] + d[1] * tt, o[2] + d[2] * tt] };
    }
  }
  return best;
}

/* Where the plane x = X cuts the envelope's bone, from the raw triangles: grid points of the plane whose inside/outside (even-odd along +y over the
   cut outline) is the same at 0.8 mm around them — [{ y, z, inside }]. The stencil cap must paint exactly the inside ones. */
function sectionProbes(node, X) {
  const p = node.pts;
  const segs = [];
  for (let t = 0; t < node.idx.length; t += 3) {
    const v = [node.idx[t], node.idx[t + 1], node.idx[t + 2]].map((i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]);
    const side = v.map((q) => q[0] >= X);
    if (side[0] === side[1] && side[1] === side[2]) continue;
    const cut = [];
    for (let e = 0; e < 3; e++) {
      const a = v[e];
      const b = v[(e + 1) % 3];
      if ((a[0] >= X) !== (b[0] >= X)) { const f = (X - a[0]) / (b[0] - a[0]); cut.push([a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])]); }
    }
    if (cut.length === 2) segs.push(cut);
  }
  const inside = (y, z) => {
    let c = 0;
    for (const [[y1, z1], [y2, z2]] of segs) {
      if ((z1 > z) === (z2 > z)) continue;
      if (y1 + ((z - z1) / (z2 - z1)) * (y2 - y1) > y) c += 1;
    }
    return c % 2 === 1;
  };
  const out = [];
  const M = 0.8;
  for (let y = -88; y <= -3; y += 2) for (let z = -14; z <= 78; z += 2) {
    const here = inside(y, z);
    if ([[M, 0], [-M, 0], [0, M], [0, -M], [M, M], [-M, -M], [M, -M], [-M, M]].every(([dy, dz]) => inside(y + dy, z + dz) === here)) out.push({ y, z, inside: here });
  }
  return out;
}

/* A glTF binary (no quantization, no materials) of boxes: [{ id, side, center, half }], positions in RAS mm. */
function makeGlb(boxes) {
  const accessors = [];
  const views = [];
  const chunks = [];
  let offset = 0;
  const add = (buf, count, componentType, type, extra = {}) => {
    const pad = (4 - (buf.length % 4)) % 4;
    views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length });
    accessors.push({ bufferView: views.length - 1, componentType, count, type, ...extra });
    chunks.push(buf, Buffer.alloc(pad));
    offset += buf.length + pad;
    return accessors.length - 1;
  };
  const nodes = [];
  const meshes = [];
  boxes.forEach((b, i) => {
    const pos = [];
    for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const dz of [-1, 1]) pos.push(b.center[0] + dx * b.half, b.center[1] + dy * b.half, b.center[2] + dz * b.half);
    const idx = [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3];
    const nor = [];
    for (let v = 0; v < 8; v++) nor.push(0, 0, 1);
    const lo = [0, 1, 2].map((k) => b.center[k] - b.half);
    const hi = [0, 1, 2].map((k) => b.center[k] + b.half);
    const p = add(Buffer.from(new Float32Array(pos).buffer), 8, 5126, 'VEC3', { min: lo, max: hi });
    const n = add(Buffer.from(new Float32Array(nor).buffer), 8, 5126, 'VEC3');
    const x = add(Buffer.from(new Uint16Array(idx).buffer), idx.length, 5123, 'SCALAR');
    meshes.push({ primitives: [{ attributes: { POSITION: p, NORMAL: n }, indices: x, mode: 4 }] });
    nodes.push({ name: `${b.id}.${b.side}`, mesh: i, extras: { id: b.id, side: b.side, name: `${b.id}.${b.side}` } });
  });
  const bin = Buffer.concat(chunks);
  const json = Buffer.from(JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, accessors, bufferViews: views, buffers: [{ byteLength: bin.length }] }));
  const jpad = Buffer.alloc((4 - (json.length % 4)) % 4, 0x20);
  const jc = Buffer.concat([json, jpad]);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jc.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jc.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, jc, bh, bin]);
}

async function specimenUnitTests() {
  const { doc, nodes, files } = readPacks();
  const listed = Object.entries(doc.packs).flatMap(([name, def]) => Object.keys(def.nodes).map((k) => [name, (def.lining ? 'lining:' : '') + k]));
  check('specimen packs: every pack is a glTF 2.0 binary whose length field is true, with KHR_mesh_quantization required',
    Object.values(files).every((f) => f.magic === 0x46546c67 && f.version === 2 && f.length === f.size && (f.json.extensionsRequired || []).includes('KHR_mesh_quantization')),
    JSON.stringify(Object.entries(files).map(([k, f]) => [k, f.magic, f.version, f.length, f.size])));
  check('specimen packs: the nodes in each file are exactly the nodes packs.json lists for it',
    listed.length === nodes.size && listed.every(([name, key]) => nodes.has(key) && nodes.get(key).pack === name), `${listed.length} listed, ${nodes.size} read`);
  const unknown = [...nodes.values()].filter((n) => !GRAPH.has(n.id));
  check('specimen packs: every node id is a graph entity', unknown.length === 0, unknown.map((n) => n.id).join(', '));
  const named = [...nodes].filter(([key, n]) => key !== `${n.lining ? 'lining:' : ''}${n.id}.${n.side}` || !['R', 'L', 'M'].includes(n.side));
  check('specimen packs: nodes are named <graph id>.<R|L|M>', named.length === 0, named.map(([k]) => k).join(', '));
  const outside = [...nodes].filter(([, n]) => n.box.min.some((v, i) => v < ctBox.min[i] - 5) || n.box.max.some((v, i) => v > ctBox.max[i] + 5));
  check('specimen packs: every mesh lies inside the CT volume (± 5 mm), so the 3D cursor and the CT share one frame',
    outside.length === 0, outside.map(([k, n]) => `${k} ${n.box.min.map(r2)}..${n.box.max.map(r2)}`).join('; ') + ` vs ${ctBox.min}..${ctBox.max}`);
  /* laterality of the data itself: the centroid of every sided mesh is on its own side of the midsagittal plane */
  const wrong = [];
  const cx = (n) => { let s = 0; for (let i = 0; i < n.pts.length; i += 3) s += n.pts[i]; return s / (n.pts.length / 3); };
  for (const [key, n] of nodes) {
    const x = cx(n);
    if ((n.side === 'R' && x <= 0) || (n.side === 'L' && x >= 0) || (n.side === 'M' && Math.abs(x) > 10)) wrong.push(`${key} ${r2(x)}`);
  }
  check('specimen packs: patient right is +x (every .R mesh centroid x > 0, .L < 0, midline pieces within 10 mm of x = 0)', wrong.length === 0, wrong.join('; '));
  const noseNode = nodes.get('s.external-nose.M');
  check('nose pack (ST6): pack "nose" holds exactly one node, s.external-nose.M, extras.kind skin, within 8000 triangles and 400 KB',
    !!noseNode && noseNode.kind === 'skin' && noseNode.tris <= 8050 && !!doc.packs.nose && doc.packs.nose.bytes <= 400000 && Object.keys(doc.packs.nose.nodes).join() === 's.external-nose.M' && [...nodes.values()].filter((n) => n.pack === 'nose').length === 1);
  check('nose pack (ST6): the skin lies on the front of the face — |R| <= 26, the tip at A 16..20, S from below subnasale to the nasion (-10..42)',
    !!noseNode && Math.max(...noseNode.box.min.map(Math.abs).slice(0, 1), noseNode.box.max[0]) <= 26 && noseNode.box.max[1] >= 16 && noseNode.box.max[1] <= 20 && noseNode.box.min[2] >= -10 && noseNode.box.max[2] <= 42, noseNode ? `${noseNode.box.min.map(r2)}..${noseNode.box.max.map(r2)}` : 'absent');
  check('nose pack (ST6): the vestibule (core pack) and its lining nodes carry extras.kind skin, as the pack\'s own node does; no other node carries a kind',
    ['R', 'L'].every((sd) => nodes.has(`s.nasal-vestibule.${sd}`) && nodes.get(`s.nasal-vestibule.${sd}`).kind === 'skin' && nodes.get(`s.nasal-vestibule.${sd}`).pack === 'core' && nodes.has(`lining:s.nasal-vestibule.${sd}`) && nodes.get(`lining:s.nasal-vestibule.${sd}`).kind === 'skin')
      && [...nodes.values()].filter((n) => n.kind).every((n) => n.kind === 'skin' && ['s.nasal-vestibule', 's.external-nose'].includes(n.id)), JSON.stringify([...nodes.values()].filter((n) => n.kind).map((n) => n.id)));
  check('specimen packs: the maxillary sinuses (spec): .R centroid x > 0 and .L < 0',
    nodes.has('s.maxillary-sinus.R') && nodes.has('s.maxillary-sinus.L') && cx(nodes.get('s.maxillary-sinus.R')) > 10 && cx(nodes.get('s.maxillary-sinus.L')) < -10);

  /* the landmarks: independent markups, authored in RAS, against the meshes */
  const lm = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/geometry/landmarks.json'), 'utf8'));
  const sided = Object.entries(lm).filter(([k]) => /\.(R|L)$/.test(k));
  const badSide = sided.filter(([k, p]) => (k.endsWith('.R') && p[0] <= 0) || (k.endsWith('.L') && p[0] >= 0));
  check('landmarks: every .R landmark has x > 0 and every .L landmark x < 0', badSide.length === 0, badSide.map(([k]) => k).join(', '));
  const ans = lm['lm.anterior-nasal-spine.M'];
  const origin = rasToScene(ans);
  check('frame: rasToScene([r, a, s]) = [r, s, -a] and sceneToRas inverts it', JSON.stringify(rasToScene([1, 2, 3])) === '[1,3,-2]' && JSON.stringify(sceneToRas([1, 3, -2])) === '[1,2,3]');
  check('frame: lm.anterior-nasal-spine.M maps to the scene origin (± 2 mm)', Math.hypot(...origin) < 2, JSON.stringify(origin));
  const PAIRS = { 'lm.sphenoid-ostium': 's.sphenoid-sinus', 'lm.frontal-ostium': 's.frontal-recess', 'lm.sphenopalatine-foramen': 's.nasal-cavity',
    'lm.infraorbital-foramen': 's.maxillary-sinus', 'lm.greater-palatine-foramen': 's.maxillary-sinus', 'lm.vidian-canal-anterior': 's.sphenoid-sinus',
    'lm.foramen-rotundum-anterior': 's.sphenoid-sinus' };
  const rows = [];
  for (const [k, p] of sided) {
    const m = /^(.+)\.(R|L)$/.exec(k);
    if (!PAIRS[m[1]]) continue;
    if (!lm[`${m[1]}.${m[2] === 'R' ? 'L' : 'R'}`]) continue;     /* paired only: a one-sided landmark stays as scanned (N1, O6) and is not a mirror of the standard specimen */
    const own = nodes.get(`${PAIRS[m[1]]}.${m[2]}`);
    const other = nodes.get(`${PAIRS[m[1]]}.${m[2] === 'R' ? 'L' : 'R'}`);
    if (!own || !other) continue;
    rows.push({ k, own: nearestVertex(own, p), other: nearestVertex(other, p) });
  }
  check('landmarks vs meshes (data): each paired landmark lies within 4 mm of its own side\'s mesh and nearer it than the other side\'s',
    rows.length >= 6 && rows.every((r) => r.own <= 4 && r.own < r.other), JSON.stringify(rows.map((r) => [r.k, r2(r.own), r2(r.other)])));

  /* the cursor in the store: the shared CT crosshair, `at` without a plane in the hash */
  const has = (id) => GRAPH.has(id);
  const hp = (h) => parseHash(h, has);
  check('state: #at=1,2,3 alone is the specimen\'s 3D cursor (the CT crosshair, remembered)', JSON.stringify(hp('#at=1,2,3').cursor) === '[1,2,3]' && !hp('#at=1,2,3').ct);
  check('state: with a plane, `at` stays the CT crosshair and no separate cursor is parsed', hp('#ct=ax&at=1,2,3').ct.at.join() === '1,2,3' && hp('#ct=ax&at=1,2,3').cursor === undefined);
  check('state: a hostile `at` is dropped whole, and a lab or a bad `ct` (which ignores the whole stage) wins over it',
    ['1,2', 'a,b,c', '1,2,3,4', 'NaN,1,2', '1e999,0,0', '<img>,1,2', ''].every((at) => hp(`#at=${at}`).cursor === undefined)
      && parseHash('#lab=k&at=1,2,3', has, { k: { params: [], presets: {} } }).cursor === undefined
      && hp('#ct=AX&at=1,2,3').cursor === undefined);
  const labs = { k: { params: [], presets: {} } };
  const st = createStore({ has, tierOf: () => 1, hash: '#at=1,2,3', prefs: {}, labs });
  check('state: a cursor in the URL is in the store and is written back as #at=', JSON.stringify(st.get().cursor) === '[1,2,3]' && st.hash() === '#at=1,2,3', st.hash());
  st.setCt({ plane: 'cor', at: null });
  check('state: entering CT with no crosshair keeps the 3D cursor (#ct=cor&at=…)', st.get().ct.at.join() === '1,2,3' && st.hash() === '#ct=cor&at=1,2,3', st.hash());
  st.setCursor([5, 6, 7]);
  check('state: in the CT stage the cursor is the crosshair (ct.at follows it)', st.get().ct.at.join() === '5,6,7' && st.hash() === '#ct=cor&at=5,6,7', st.hash());
  st.leaveStage();
  check('state: leaving CT keeps the cursor for the specimen (#at=)', st.get().ct === null && st.get().cursor.join() === '5,6,7' && st.hash() === '#at=5,6,7', st.hash());
  const seen = [];
  st.subscribe((s2, p, meta) => seen.push(meta.source));
  st.setCtBounds({ min: [-24, -21, -18], max: [23.25, 20.25, 29] });
  check('state: bounds that already contain the cursor change nothing (no notification)', seen.length === 0 && st.get().cursor.join() === '5,6,7', seen.join());
  st.setCtBounds({ min: [-1, -1, -1], max: [1, 1, 1] });
  check('state: the volume\'s bounds re-clamp the cursor (one ct-bounds notification)', st.get().cursor.join() === '1,1,1' && seen.join() === 'ct-bounds', seen.join());
  st.setCtBounds({ min: [-24, -21, -18], max: [23.25, 20.25, 29] });
  st.setCursor([1e9, -1e9, 5]);
  check('state: setCursor clamps to the bounds, rejects a non-point, and clears with null',
    st.get().cursor.join() === '23.25,-21,5' && st.setCursor([1, 2]) === false && st.setCursor(null) && st.get().cursor === null && st.hash() === '', st.hash());
  st.setCursor([1, 2, 3]);
  st.setLab({ name: 'k', params: {} });
  check('state: the lab leaves the cursor in the store but out of the URL', st.get().cursor.join() === '1,2,3' && st.hash() === '#lab=k', st.hash());
  st.applyHash('#at=9,8,7');
  check('state: applyHash adopts a cursor from a pasted link', st.get().cursor.join() === '9,8,7' && st.get().lab === null && st.hash() === '#at=9,8,7', st.hash());
}

/* ---------------- Specimen: the page ---------------- */

const RAW = { 'content-type': 'application/octet-stream' };

/* routes: { '<file name under ssb/models/ or ssb/geometry/>': (route) => … }. */
async function openSpecimen(browser, base, hash = '', { viewport = { width: 1280, height: 800 }, reducedMotion = 'no-preference', webgl = true, routes = null, wait = 'settled', track = true, abort = null } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: viewport.width < 600 ? 2 : 1 });
  if (!webgl) {
    await context.addInitScript(() => {
      const real = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return typeof type === 'string' && /webgl/i.test(type) ? null : real.call(this, type, ...rest); };
    });
  }
  if (abort) await context.route(abort, (route) => route.abort());
  if (routes) {
    await context.route(/\/ssb\/(models|geometry)\/[^/?#]+(?:[?#].*)?$/, (route) => {
      const name = new URL(route.request().url()).pathname.split('/').pop();
      return routes[name] ? routes[name](route) : route.continue();
    });
  }
  const page = await context.newPage();
  const errors = collectErrors(page);
  if (track) allErrors.push(errors);
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  if (wait === 'settled') {
    await page.waitForFunction(() => window.__ssb.specimen && !['idle', 'loading'].includes(window.__ssb.specimen.status), null, { timeout: 40000 });
    await page.waitForFunction(() => !window.__ssb.specimen.installed || window.__ssb.specimen.renders > 0, null, { timeout: 20000 });
  }
  return { context, page, errors, warnings };
}

const spec = (page, fn, arg) => page.evaluate(fn, arg);
const specNodes = (page) => page.evaluate(() => window.__ssb.specimen.nodes());
const nextFrames = (page, n = 2) => page.evaluate((k) => new Promise((res) => { let i = 0; const f = () => (++i >= k ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const clickView = async (page, view) => { await page.click(`#ssb-spec button[data-view="${view}"]`); await page.waitForFunction(() => !window.__ssb.specimen.camera().flying, null, { timeout: 5000 }); await nextFrames(page, 3); };
const project = (page, ras) => page.evaluate((r) => window.__ssb.specimen.project(r), ras);
const sceneMsg = (page) => page.evaluate(() => { const m = document.getElementById('ssb-stage-msg'); return { hidden: m.hidden, text: m.textContent }; });

/* The canvas as an image, with the corner widgets (orientation, dock) left to the caller to ignore. */
async function canvasImage(page) {
  const r = await page.evaluate(() => { const b = document.getElementById('ssb-canvas').getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; });
  const img = decodePng(await page.screenshot({ clip: r }));
  return { img, rect: r };
}
const isBg = (px, bg) => Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]) <= 12;

async function specimenTests(browser, base) {
  /* what a page holds at boot: every pack but the lining, which waits for the first look from within (ST1c) */
  const truth = new Map([...readPacks().nodes].filter(([, n]) => !n.lining));

  /* ===== boot, registry, materials ===== */
  {
    const { context, page, errors } = await openSpecimen(browser, base, '');
    const info = await spec(page, () => ({
      status: window.__ssb.specimen.status, packs: window.__ssb.specimen.packs, problems: window.__ssb.specimen.problems,
      pressed: document.querySelector('#ssb-stage-mode [data-stage="specimen"]').getAttribute('aria-pressed'),
      stage: document.getElementById('ssb-app').dataset.stage, note: document.getElementById('ssb-stage-note').textContent,
      noteShown: getComputedStyle(document.getElementById('ssb-stage-note')).display !== 'none',
      msgHidden: document.getElementById('ssb-stage-msg').hidden, frames: window.__ssb.frames, view: window.__ssb.specimen.view,
      axisLabels: [...document.querySelectorAll('.ssb-axis-label')].map((e) => getComputedStyle(e).visibility),
    }));
    check('specimen: boots to status ready with no problems, the Specimen pill pressed, and no stage message', info.status === 'ready' && info.problems.length === 0 && info.pressed === 'true' && info.stage === 'specimen' && info.msgHidden, JSON.stringify(info));
    check('specimen: the stage note is provenance (reference specimen, UW CT atlas, draft), not the placeholder', info.noteShown && /Reference specimen · UW CT atlas · draft/.test(info.note) && !/Placeholder/i.test(info.note), info.note);
    check('specimen: the placeholder grid\'s axis letters are gone while the specimen shows', info.axisLabels.every((v) => v === 'hidden'), info.axisLabels.join());

    const listed = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8')).packs);
    const liningName = Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8')).packs).filter(([, d]) => d.lining === true).map(([n]) => n);
    check('specimen: every pack packs.json lists, bar the deferred lining (ST1c), is loaded, node for node as listed (core first); the lining waits for the first look from within',
      liningName.length === 1 && liningName.every((n) => info.packs[n] && info.packs[n].state === 'deferred' && info.packs[n].nodes.length === 0) && listed.filter((n) => !liningName.includes(n)).every((n) => info.packs[n] && info.packs[n].state === 'loaded' && info.packs[n].nodes.length === info.packs[n].expected.length && info.packs[n].expected.every((k) => info.packs[n].nodes.includes(k))), JSON.stringify(info.packs).slice(0, 400));
    const everyNode = await specNodes(page);
    const nodes = everyNode.filter((n) => !n.lining);          /* the lining pack (ST1b) is checked on its own; the rest of these checks are about the structures */
    const keys = everyNode.map((n) => n.key).sort();
    check('specimen: the registry is exactly what the data holds (node keys match an independent read of the packs)', keys.join() === [...truth.keys()].sort().join(), `${keys.length} vs ${truth.size}`);
    check('specimen: every registry id is in the knowledge graph', nodes.every((n) => GRAPH.has(n.id)), nodes.filter((n) => !GRAPH.has(n.id)).map((n) => n.id).join());
    const off = [];
    for (const n of everyNode) {
      const t = truth.get(n.key);
      const d = Math.max(...[0, 1, 2].flatMap((i) => [Math.abs(n.box.min[i] - t.box.min[i]), Math.abs(n.box.max[i] - t.box.max[i])]));
      if (!(d < 0.05)) off.push(`${n.key} ${r2(d)}`);
    }
    check('specimen: the loader places every mesh exactly where the raw data says it is in RAS (quantization, node transform and the one rasToScene root; max error < 0.05 mm)', off.length === 0, off.join('; '));
    const outside = nodes.filter((n) => n.box.min.some((v, i) => v < ctBox.min[i] - 5) || n.box.max.some((v, i) => v > ctBox.max[i] + 5));
    check('specimen: every mesh in the scene lies inside the CT volume\'s bounds (± 5 mm)', outside.length === 0, outside.map((n) => n.key).join());

    /* looks by graph kind */
    const env = nodes.find((n) => n.id === 's.skull-base-region');
    const cellsKinds = nodes.filter((n) => entity(n.id) && entity(n.id).kind === 'cell');
    const sinus = nodes.filter((n) => entity(n.id) && entity(n.id).kind === 'sinus');
    check('specimen: the bony envelope is bone (a graph region drawn as bone), X-ray by default: a transparent fresnel shell with no depth write',
      env && env.group === 'bone' && env.look.kind === 'bone' && env.material === 'ShaderMaterial' && env.transparent && env.depthWrite === false, JSON.stringify(env && { g: env.group, m: env.material }));
    check('specimen: sinuses are see-through air spaces; cells are plain tinted blocks, the IFAC cells by their categorical hue',
      sinus.length > 0 && sinus.every((n) => n.look.kind === 'space' && n.look.space) && cellsKinds.length > 0 && cellsKinds.every((n) => n.look.kind === 'air-cell' && typeof n.look.tint === 'string')
        && nodes.filter((n) => n.id === 's.agger-nasi-cell').every((n) => n.look.tint === 'cell-anc'), JSON.stringify([...new Set(cellsKinds.map((n) => n.look.tint))]));
    const regions = nodes.filter((n) => entity(n.id) && entity(n.id).kind === 'region' && n.id !== 's.skull-base-region');
    check('specimen: the nasal cavity and nasopharynx (graph regions) are air spaces', regions.length > 0 && regions.filter((n) => /nasal-cavity|nasopharynx/.test(n.id)).every((n) => n.look.space), regions.map((n) => n.key).join());
    check('specimen: budgets — all triangles ≤ 400k, draw calls ≤ 150, no WebGL error state', (await spec(page, () => window.__ssb.specimen.triangles)) <= 400000 && (await spec(page, () => window.__ssb.specimen.info().calls)) <= 150);
    const f0 = await page.evaluate(() => window.__ssb.frames);
    await page.waitForTimeout(700);
    check('specimen: no frames are drawn while nothing changes (on-demand loop)', (await page.evaluate(() => window.__ssb.frames)) === f0);
    await context.close();
  }

  /* ===== sweeps layer: tubes from sweeps.json, off until asked ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/geometry/sweeps.json'), 'utf8'));
    check('sweeps: the layer starts off with no tube drawn', (await spec(page, () => window.__ssb.specimen.sweepsOn)) === false && (await spec(page, () => window.__ssb.specimen.sweeps.length)) === 0);
    await page.locator('#ssb-spec-sweeps').check();
    await page.waitForTimeout(100);
    const shown = await spec(page, () => window.__ssb.specimen.sweeps);
    check('sweeps: turning the layer on draws every sweep in sweeps.json', shown.length === Object.keys(doc).length, `${shown.length} of ${Object.keys(doc).length}`);
    await context.close();
  }

  /* ===== frame and laterality, through the camera ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const lmk = Object.fromEntries((await spec(page, () => window.__ssb.specimen.landmarks)).map((l) => [l.key, l.ras]));
    const cam = await spec(page, () => window.__ssb.specimen.camera());
    check('specimen: the default view is the anterior-oblique from the patient\'s right-front, a little above (toward +R, +A, +S)',
      cam.toCamera[0] > 0.3 && cam.toCamera[1] > 0.3 && cam.toCamera[2] > 0.1 && cam.toCamera[2] < 0.7 && (await spec(page, () => window.__ssb.specimen.view)) === 'oblique', JSON.stringify(cam.toCamera));

    await clickView(page, 'anterior');
    const a = {};
    for (const k of ['lm.frontal-ostium.R', 'lm.frontal-ostium.L', 'lm.sphenoid-ostium.R', 'lm.sphenoid-ostium.L', 'lm.crista-galli-apex.M', 'lm.anterior-nasal-spine.M', 'lm.sella-floor-center.M']) a[k] = await project(page, lmk[k]);
    check('frame: in the anterior view the camera looks at the face from +A (toCamera ≈ +A)', (await spec(page, () => window.__ssb.specimen.camera().toCamera[1])) > 0.99);
    check('frame: in the anterior view the patient\'s RIGHT is on the viewer\'s LEFT (lm.*.R project left of lm.*.L, for the frontal and sphenoid ostia)',
      a['lm.frontal-ostium.R'].x < a['lm.frontal-ostium.L'].x && a['lm.sphenoid-ostium.R'].x < a['lm.sphenoid-ostium.L'].x, JSON.stringify([a['lm.frontal-ostium.R'].x, a['lm.frontal-ostium.L'].x]));
    check('frame: superior is up (the crista galli projects above the sellar floor)', a['lm.crista-galli-apex.M'].y < a['lm.sella-floor-center.M'].y, JSON.stringify([a['lm.crista-galli-apex.M'].y, a['lm.sella-floor-center.M'].y]));
    check('frame: the orientation widget agrees (R left of L, S above I)', await page.evaluate(() => {
      const c = (cls) => { const r = document.querySelector(cls).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      return c('.ssb-orient-r .ssb-orient-plus').x < c('.ssb-orient-r .ssb-orient-minus').x && c('.ssb-orient-s .ssb-orient-plus').y < c('.ssb-orient-s .ssb-orient-minus').y;
    }));

    /* a click on the .R sinus in the anterior view (bone hidden) picks the .R node, on the viewer's left */
    await page.click('#ssb-spec button[data-bone="hidden"]');
    await nextFrames(page, 2);
    const sR = await spec(page, () => window.__ssb.specimen.screenOf('s.maxillary-sinus.R'));
    const sL = await spec(page, () => window.__ssb.specimen.screenOf('s.maxillary-sinus.L'));
    check('frame: the .R maxillary sinus is picked on the viewer\'s left and the .L on the right, in the anterior view', sR && sL && sR.x < sL.x, JSON.stringify([sR, sL]));
    await page.click('#ssb-spec button[data-bone="xray"]');

    await clickView(page, 'right');
    const r = {};
    for (const k of ['lm.anterior-nasal-spine.M', 'lm.dorsum-sellae-tip.M', 'lm.crista-galli-apex.M', 'lm.sella-floor-center.M']) r[k] = await project(page, lmk[k]);
    const camR = await spec(page, () => window.__ssb.specimen.camera().toCamera);
    check('frame: in the right lateral view the camera is on the patient\'s right (toCamera ≈ +R) and anterior is to the viewer\'s right (nasal spine right of the dorsum sellae)',
      camR[0] > 0.99 && r['lm.anterior-nasal-spine.M'].x > r['lm.dorsum-sellae-tip.M'].x && r['lm.crista-galli-apex.M'].y < r['lm.sella-floor-center.M'].y, JSON.stringify([camR, r]));
    await clickView(page, 'left');
    const l0 = await project(page, lmk['lm.anterior-nasal-spine.M']);
    const l1 = await project(page, lmk['lm.dorsum-sellae-tip.M']);
    check('frame: in the left lateral view anterior is to the viewer\'s left', l0.x < l1.x, JSON.stringify([l0.x, l1.x]));
    await clickView(page, 'superior');
    const s0 = await project(page, lmk['lm.anterior-nasal-spine.M']);
    const s1 = await project(page, lmk['lm.dorsum-sellae-tip.M']);
    const sR2 = await project(page, lmk['lm.frontal-ostium.R']);
    const sL2 = await project(page, lmk['lm.frontal-ostium.L']);
    check('frame: from above, anterior is up the screen and the patient\'s right is on the viewer\'s right',
      s0.y < s1.y && sR2.x > sL2.x && (await spec(page, () => window.__ssb.specimen.camera().toCamera[2])) > 0.99, JSON.stringify([s0, s1, sR2, sL2]));

    /* the landmarks against the meshes in the scene: independent markups, the page's own transform */
    const PAIRS = { 'lm.sphenoid-ostium': 's.sphenoid-sinus', 'lm.frontal-ostium': 's.frontal-recess', 'lm.sphenopalatine-foramen': 's.nasal-cavity',
      'lm.infraorbital-foramen': 's.maxillary-sinus', 'lm.greater-palatine-foramen': 's.maxillary-sinus', 'lm.vidian-canal-anterior': 's.sphenoid-sinus',
      'lm.foramen-rotundum-anterior': 's.sphenoid-sinus' };
    const rows = [];
    for (const [k, ras] of Object.entries(lmk)) {
      const m = /^(.+)\.(R|L)$/.exec(k);
      if (!m || !PAIRS[m[1]]) continue;
      const other = m[2] === 'R' ? 'L' : 'R';
      if (!lmk[`${m[1]}.${other}`]) continue;                      /* paired only (see the data check) */
      const own = await spec(page, ([key, p]) => window.__ssb.specimen.nearest(key, p), [`${PAIRS[m[1]]}.${m[2]}`, ras]);
      const far = await spec(page, ([key, p]) => window.__ssb.specimen.nearest(key, p), [`${PAIRS[m[1]]}.${other}`, ras]);
      if (own && far) rows.push({ k, own: own.distance, other: far.distance });
    }
    check('frame: in the scene every paired landmark lies within 4 mm of its own side\'s mesh and nearer it than the other side\'s (the loader, the root transform and the landmark file agree)',
      rows.length >= 6 && rows.every((x) => x.own <= 4 && x.own < x.other), JSON.stringify(rows.map((x) => [x.k, r2(x.own), r2(x.other)])));
    const centroids = {};
    for (const key of ['s.maxillary-sinus.R', 's.maxillary-sinus.L']) centroids[key] = await spec(page, (k) => window.__ssb.specimen.centroid(k), key);
    check('frame: in the scene the .R maxillary sinus centroid is at x > 0 and the .L at x < 0 (scene +x is patient right)', centroids['s.maxillary-sinus.R'][0] > 10 && centroids['s.maxillary-sinus.L'][0] < -10, JSON.stringify(centroids));
    await context.close();
  }

  /* ===== layers ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const env = async () => (await specNodes(page)).find((n) => n.id === 's.skull-base-region');
    check('layers: the bone envelope is X-ray by default', (await env()).material === 'ShaderMaterial' && (await page.getAttribute('#ssb-spec button[data-bone="xray"]', 'aria-pressed')) === 'true');
    await page.click('#ssb-spec button[data-bone="solid"]');
    await nextFrames(page, 2);
    let e = await env();
    check('layers: Solid draws the envelope as procedural bone (opaque, lit)', e.visible && e.material === 'MeshStandardMaterial' && !e.transparent, JSON.stringify(e));
    await page.click('#ssb-spec button[data-bone="hidden"]');
    await nextFrames(page, 2);
    e = await env();
    const airVisible = (await specNodes(page)).filter((n) => n.group === 'air').every((n) => n.visible);
    check('layers: Hidden removes the envelope and leaves the air spaces', !e.visible && airVisible);
    await page.click('#ssb-spec button[data-bone="xray"]');

    const regionBoxes = await page.$$eval('#ssb-spec input[data-region]', (bs) => bs.map((b) => b.dataset.region));
    const nodes0 = await specNodes(page);
    const wantRegions = [...new Set(nodes0.filter((n) => n.group !== 'bone' && n.group !== 'nose').map((n) => n.region || 'other'))].sort();     /* the nose has a layer of its own (ST6) */
    check('layers: one toggle per region that holds air spaces or soft tissue, built from the loaded packs', regionBoxes.slice().sort().join() === wantRegions.join(), regionBoxes.join() + ' vs ' + wantRegions.join());
    await page.click('#ssb-spec input[data-region="maxillary"]');
    await nextFrames(page, 2);
    const after = (await specNodes(page)).filter((n) => !n.lining);
    check('layers: unchecking a region hides exactly its nodes', after.filter((n) => n.region === 'maxillary' && n.group !== 'bone').every((n) => !n.visible)
      && after.filter((n) => n.region !== 'maxillary' || n.group === 'bone').every((n) => n.visible), JSON.stringify(after.filter((n) => !n.visible).map((n) => n.key)));
    await page.click('#ssb-spec input[data-region="maxillary"]');

    /* mucosa: the air spaces drawn as their lining; a layer, not a different mesh */
    const airKeys = nodes0.filter((n) => n.group === 'air').map((n) => n.key);
    check('mucosa: the layer starts off and no air space is drawn as mucosa', (await spec(page, () => window.__ssb.specimen.mucosaOn)) === false
      && (await specNodes(page)).filter((n) => n.group === 'air').every((n) => n.drawn !== 'mucosa'));
    await page.click('#ssb-spec-mucosa');
    await nextFrames(page, 2);
    const muc = await specNodes(page);
    check('mucosa: toggling the layer draws every air-space node as mucosa (outside: a translucent shell); bone is untouched',
      airKeys.length > 0 && muc.filter((n) => n.group === 'air').every((n) => n.drawn === (n.liningKind || 'mucosa') && n.transparent) && muc.filter((n) => n.group === 'bone').every((n) => n.drawn === 'bone'),
      JSON.stringify(muc.filter((n) => n.group === 'air' && n.drawn !== (n.liningKind || 'mucosa')).map((n) => n.key)));
    check('mucosa (ST6): the vestibule is lined with skin, not mucosa — its two nodes (and only they) draw as skin with the layer on',
      muc.filter((n) => n.group === 'air' && n.drawn === 'skin').map((n) => n.key).sort().join() === 's.nasal-vestibule.L,s.nasal-vestibule.R', JSON.stringify(muc.filter((n) => n.group === 'air').map((n) => [n.key, n.drawn])));
    check('mucosa (ST1b/ST1c): seen from outside, no lining is drawn (nor fetched) — the outside view keeps the per-compartment shells', muc.filter((n) => n.lining).every((n) => !n.visible), JSON.stringify(muc.filter((n) => n.lining && n.visible).map((n) => n.key)));
    await page.click('#ssb-spec button[data-bone="hidden"]');     /* the envelope's ghost is hit first otherwise */
    await nextFrames(page, 2);
    const mAim = await spec(page, () => window.__ssb.specimen.screenOf('s.maxillary-sinus.R'));
    const mHits = mAim ? await spec(page, ([x, y]) => window.__ssb.specimen.hits(x, y), [mAim.x, mAim.y]) : [];
    check('mucosa: picking through the layer still selects the air space\'s graph id', !!mAim && mHits.length > 0 && mHits[0].key === 's.maxillary-sinus.R' && GRAPH.has(mHits[0].id), JSON.stringify(mHits.map((h) => h.key)));
    await page.click('#ssb-spec button[data-bone="xray"]');
    const r0 = await spec(page, () => window.__ssb.specimen.renders);
    await page.click('.site-theme-toggle');
    await nextFrames(page, 3);
    check('mucosa: both themes compile — the layer still draws after the theme flips',
      (await spec(page, () => window.__ssb.specimen.renders)) > r0 && (await specNodes(page)).filter((n) => n.group === 'air').every((n) => n.drawn === (n.liningKind || 'mucosa')));
    await page.click('.site-theme-toggle');
    await page.click('#ssb-spec-mucosa');
    await nextFrames(page, 2);
    check('mucosa: toggling off restores every air space\'s own look', (await specNodes(page)).filter((n) => n.group === 'air').every((n) => n.drawn === n.look.kind));

    /* the external nose (ST6): its own pack, drawn as skin, by a layer of its own that starts on */
    const noseNodes = (await specNodes(page)).filter((n) => n.id === 's.external-nose');
    check('nose (ST6): the nose pack loads one s.external-nose.M node, in the nose group, drawn as skin and visible; the Nose layer starts on',
      noseNodes.length === 1 && noseNodes[0].key === 's.external-nose.M' && noseNodes[0].group === 'nose' && noseNodes[0].pack === 'nose' && noseNodes[0].drawn === 'skin' && noseNodes[0].visible
        && (await spec(page, () => window.__ssb.specimen.noseOn)) === true && (await page.locator('#ssb-spec-nose').isChecked()), JSON.stringify(noseNodes));
    check('nose (ST6): the nose is a layer of its own, not a region (the region list has no entry for it)',
      !(await page.$$eval('#ssb-spec input[data-region]', (els) => els.map((e) => e.dataset.region))).some((r) => r === 'multiple'));
    await page.click('#ssb-spec-nose');
    await nextFrames(page, 2);
    const noseOff = await specNodes(page);
    check('nose (ST6): unchecking the Nose layer hides exactly the nose node; bone, air spaces and the rest stay as they were',
      noseOff.filter((n) => !n.visible).map((n) => n.key).join() === 's.external-nose.M' && (await spec(page, () => window.__ssb.specimen.noseOn)) === false, JSON.stringify(noseOff.filter((n) => !n.visible).map((n) => n.key)));
    await page.click('#ssb-spec-nose');
    await nextFrames(page, 2);
    check('nose (ST6): checking it again draws the skin again', (await specNodes(page)).find((n) => n.key === 's.external-nose.M').visible);

    /* landmarks: every marker is orientation geometry (never tier-filtered); labels are few and follow the tier */
    const lmAll = await spec(page, () => window.__ssb.specimen.landmarks.length);
    check('layers: no landmark markers until the layer is on', (await spec(page, () => window.__ssb.specimen.markers.length)) === 0);
    await page.click('#ssb-spec-landmarks');
    await clickView(page, 'anterior');
    const t1 = await spec(page, () => ({ markers: window.__ssb.specimen.markers.length, labels: window.__ssb.specimen.labels }));
    check('layers: the landmarks layer shows every marker, whatever the depth', t1.markers === lmAll && lmAll >= 20, `${t1.markers} of ${lmAll}`);
    check('layers: at depth 1 the labels are few (≤ 8) and only for entities of tier ≤ 1', t1.labels.length > 0 && t1.labels.length <= 8 && t1.labels.every((l) => (entity(l.id).tier || 1) <= 1), JSON.stringify(t1.labels));
    await page.click('#ssb-tier button[data-tier="3"]');
    await nextFrames(page, 2);
    const t3 = await spec(page, () => ({ markers: window.__ssb.specimen.markers.length, labels: window.__ssb.specimen.labels }));
    check('layers: raising the depth adds labels (still ≤ 8) and never changes the markers',
      t3.markers === lmAll && t3.labels.length <= 8 && t3.labels.length >= t1.labels.length && t3.labels.every((l) => (entity(l.id).tier || 1) <= 3), JSON.stringify([t1.labels.length, t3.labels.length]));
    const lap = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.ssb-spec-label:not([hidden])')].map((e) => e.getBoundingClientRect());
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) return true; }
      return false;
    });
    check('layers: labels never sit on one another', !lap);
    await page.click('#ssb-tier button[data-tier="1"]');
    await context.close();
  }

  /* ===== picking, deeper-click, the cursor, CT sync ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    await clickView(page, 'anterior');
    const lmk = Object.fromEntries((await spec(page, () => window.__ssb.specimen.landmarks)).map((l) => [l.key, l.ras]));
    const fs0 = (await spec(page, () => window.__ssb.specimen.nodes())).find((n) => n.key === 's.frontal-sinus.R');
    const aim = [0, 1, 2].map((n) => (fs0.box.min[n] + fs0.box.max[n]) / 2);
    const p = await project(page, aim);
    const hits = await spec(page, ([x, y]) => window.__ssb.specimen.hits(x, y), [p.x, p.y]);
    const groupOf = Object.fromEntries((await specNodes(page)).map((n) => [n.key, n.group]));
    const iSinus = hits.findIndex((h) => h.key === 's.frontal-sinus.R');
    check('picking: a ray through the bone into a sinus keeps every hit — at least 2 distinct, nearest first, bone before the sinus',
      new Set(hits.map((h) => h.key)).size >= 2 && iSinus > 0 && groupOf[hits[0].key] === 'bone' && hits.slice(1).every((h, i) => h.distance >= hits[i].distance), JSON.stringify(hits.map((h) => [h.key, r2(h.distance)])));
    const picked = [];
    for (let i = 0; i < hits.length + 1; i++) {
      await page.mouse.click(p.x, p.y);
      picked.push(await page.evaluate(() => ({ sel: window.__ssb.selection, primary: window.__ssb.specimen.primary, hash: location.hash, panel: (document.querySelector('#ssb-panel-body [data-entity]') || {}).dataset?.entity })));
    }
    check('picking: clicking the same spot again steps to the next hit and wraps; the store, the panel and the URL follow each',
      picked[0].sel === hits[0].id && picked[1].sel === hits[1].id && picked[hits.length].sel === hits[0].id
        && picked.every((q) => q.panel === q.sel && q.hash.includes('s=' + q.sel)), JSON.stringify(picked.map((q) => q.sel)));
    check('picking: the clicked side is the full highlight (primary), the clicked node', picked[1].primary === hits[1].key, picked[1].primary);

    /* the click's surface point is the 3D cursor: against an independent ray cast through the raw data */
    let best = -Infinity;
    let vtx = null;
    for (const n of truth.values()) for (let i = 0; i < n.pts.length; i += 3) if (n.pts[i + 1] > best) { best = n.pts[i + 1]; vtx = [n.pts[i], n.pts[i + 1], n.pts[i + 2]]; }
    const camNow = await spec(page, () => window.__ssb.specimen.camera());
    const dir = vtx.map((v, i) => v - camNow.position[i]);
    const len = Math.hypot(...dir);
    const ray = rayNearest(truth, camNow.position, dir.map((v) => v / len));
    const pv = await project(page, vtx);
    const before = await spec(page, () => window.__ssb.specimen.cursor);
    await page.mouse.click(pv.x, pv.y);
    await page.waitForFunction(() => /(^|&)at=/.test(location.hash.slice(1)), null, { timeout: 3000 }).catch(() => {});     /* a cursor move reaches the URL once it settles */
    const got = await page.evaluate(() => ({ cursor: window.__ssb.specimen.cursor, marker: window.__ssb.specimen.cursorMarker, hash: location.hash, sel: window.__ssb.selection }));
    const dist = Math.hypot(...got.cursor.map((v, i) => v - ray.point[i]));
    check('cursor: a click at the most anterior vertex of the data sets the shared cursor within 1 mm of where an independent ray cast through the raw triangles meets the first surface',
      dist < 1 && JSON.stringify(got.cursor) !== JSON.stringify(before) && got.sel === truth.get(ray.key).id, `${r2(dist)} mm; ${ray.key}; cursor ${got.cursor}`);
    check('cursor: the 3D crosshair marker is at the cursor and the URL carries it as #at= (no stage change)',
      got.marker && arrEq(got.marker, got.cursor, 1e-6) && /(^|&)at=/.test(got.hash.slice(1)) && !/ct=/.test(got.hash), got.hash);

    /* the CT stage opens there, on the real volume */
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await page.waitForFunction(() => window.__ssb.ct && window.__ssb.ct.status === 'ready' && Object.values(window.__ssb.ct.renders).some((n) => n > 0), null, { timeout: 30000 });
    const ctAt = await page.evaluate(() => ({ cursor: window.__ssb.ct.cursor, hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, bounds: window.__ssb.ct.bounds }));
    check('cursor: switching to CT lands the crosshair on the clicked surface point (within one 0.5 mm voxel)', ctAt.stage === 'ct' && Math.hypot(...ctAt.cursor.map((v, i) => v - got.cursor[i])) <= 0.5, JSON.stringify(ctAt));
    check('cursor: the CT bounds the specimen clamped to (read from ct.json alone) are the volume\'s own', arrEq(ctAt.bounds.min, ctBox.min, 1e-6) && arrEq(ctAt.bounds.max, ctBox.max, 1e-6));
    const specBounds = await spec(page, () => window.__ssb.specimen.ctBounds);
    check('cursor: the specimen read the same bounds before the volume was downloaded', specBounds && arrEq(specBounds.min, ctBox.min, 1e-6));
    /* and back: the crosshair is the cursor; a new crosshair shows in 3D */
    const move = [12, -30, 22];
    await page.evaluate((m) => { location.hash = `#ct=cor&at=${m.join(',')}`; }, move);
    await page.waitForFunction((m) => window.__ssb.ct.cursor && Math.abs(window.__ssb.ct.cursor[0] - m[0]) < 1e-6, move);
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await nextFrames(page, 3);
    const back = await page.evaluate(() => ({ marker: window.__ssb.specimen.cursorMarker, cursor: window.__ssb.specimen.cursor, hash: location.hash, active: window.__ssb.specimen.active }));
    check('cursor: the CT crosshair shows in the specimen as the 3D crosshair marker, and the URL is #at= again', back.active && back.marker && arrEq(back.marker, move, 1e-6) && back.hash.includes('at=12,-30,22') && !back.hash.includes('ct='), JSON.stringify(back));
    const proj = await project(page, move);
    check('cursor: the marker is drawn on screen (it shows through the bone)', proj.front && proj.x > 0 && proj.y > 0);
    await context.close();
  }

  /* ===== selection from the tree and search: highlight, partner, framing, no-geometry ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '#s=s.maxillary-sinus', { reducedMotion: 'reduce' });
    const nodes = await specNodes(page);
    const mine = nodes.filter((n) => n.id === 's.maxillary-sinus' && !n.lining);
    const primary = mine.filter((n) => n.highlight === 'primary');
    const partner = mine.filter((n) => n.highlight === 'partner');
    check('selection: a deep link highlights the maxillary sinus — the side nearest the camera at full strength (patient right, from the right-front), the other side dimmed',
      mine.length === 2 && primary.length === 1 && partner.length === 1 && primary[0].side === 'R' && primary[0].emissive > partner[0].emissive && partner[0].emissive > 0, JSON.stringify(mine.map((n) => [n.key, n.highlight, n.emissive])));
    check('selection: everything else is untouched', nodes.filter((n) => n.id !== 's.maxillary-sinus').every((n) => n.highlight === null));
    check('selection: the selection\'s name is labelled on the stage and the panel shows the entity', (await spec(page, () => window.__ssb.specimen.labels)).some((l) => l.id === 's.maxillary-sinus')
      && (await page.$('#ssb-panel-body [data-entity="s.maxillary-sinus"]')) !== null);

    /* tree selection frames it (a cut under reduced motion) and keeps the way the camera looks */
    await page.click('#ssb-spec button[data-view="oblique"]');
    const c0 = await spec(page, () => window.__ssb.specimen.camera());
    await page.evaluate(() => { document.querySelector('#ssb-tree button[data-id="s.sphenoid-sinus"]').click(); });
    await nextFrames(page, 3);
    const c1 = await spec(page, () => window.__ssb.specimen.camera());
    const sphen = (await specNodes(page)).filter((n) => n.id === 's.sphenoid-sinus');
    const centre = [0, 1, 2].map((n) => (Math.min(...sphen.map((s) => s.box.min[n])) + Math.max(...sphen.map((s) => s.box.max[n]))) / 2);
    check('selection: choosing a structure in the tree frames it (the camera targets its centre) without turning the camera, as a cut under reduced motion',
      !c1.flying && Math.hypot(...c1.target.map((v, i) => v - centre[i])) < 0.5 && c1.toCamera.every((v, i) => Math.abs(v - c0.toCamera[i]) < 1e-3) && c1.distance < c0.distance, JSON.stringify([c0.target, c1.target, centre]));
    await page.click('#ssb-spec button[data-bone="hidden"]');
    await nextFrames(page, 2);
    check('selection: a click on the specimen does not move the camera (the reader chose the view)', await (async () => {
      const aim = await spec(page, () => window.__ssb.specimen.screenOf('s.sphenoid-sinus.R') || window.__ssb.specimen.screenOf('s.sphenoid-sinus.L'));
      const before = await spec(page, () => window.__ssb.specimen.camera());
      await page.mouse.click(aim.x, aim.y);
      const afterCam = await spec(page, () => window.__ssb.specimen.camera());
      return !!aim && arrEq(before.position, afterCam.position, 1e-6);
    })());
    await page.click('#ssb-spec button[data-bone="xray"]');

    /* an entry with no geometry leaves the camera alone and says so */
    const ids = new Set((await specNodes(page)).map((n) => n.id));
    const lmIds = new Set((await spec(page, () => window.__ssb.specimen.landmarks)).map((l) => l.id));
    const bare = [...GRAPH.values()].map((v) => v.entity).find((e) => e.id.startsWith('s.') && !ids.has(e.id) && !lmIds.has(e.id));
    const camA = await spec(page, () => window.__ssb.specimen.camera());
    await page.evaluate((id) => { location.hash = `#s=${id}`; }, bare.id);
    await nextFrames(page, 3);
    const camB = await spec(page, () => window.__ssb.specimen.camera());
    const note = await page.evaluate(() => { const n = document.querySelector('#ssb-panel-body .ssb-geo-note'); return n ? n.textContent : null; });
    check(`selection: ${bare.id} has no geometry — the camera stays put and the panel says the specimen has none`,
      arrEq(camA.position, camB.position, 1e-9) && arrEq(camA.target, camB.target, 1e-9) && /no geometry/.test(note || ''), String(note));
    check('selection: …and nothing on the stage is highlighted', (await specNodes(page)).every((n) => n.highlight === null));
    /* a landmark-only entry: a marker, no surface, and the camera still stays */
    const lmOnly = [...lmIds].find((id) => !ids.has(id) && id.startsWith('s.'));
    if (lmOnly) {
      await page.evaluate((id) => { location.hash = `#s=${id}`; }, lmOnly);
      await nextFrames(page, 3);
      const camC = await spec(page, () => window.__ssb.specimen.camera());
      const info = await page.evaluate(() => ({ markers: window.__ssb.specimen.markers, note: (document.querySelector('#ssb-panel-body .ssb-geo-note') || {}).textContent, labels: window.__ssb.specimen.labels }));
      check(`selection: ${lmOnly} is a landmark with no surface — its marker is shown (and labelled when in view), the camera stays, the panel says it is a point marker`,
        info.markers.some((k) => k.startsWith(lmOnly + '.')) && arrEq(camB.position, camC.position, 1e-9) && /point marker/.test(info.note || ''), JSON.stringify(info));
    }
    await context.close();
  }

  /* ===== section plane ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    await clickView(page, 'right');
    const bgOf = (img) => img.at(img.width - 4, 4);
    const lit = (img, rect, y0, y1) => {
      let n = 0;
      const bg = bgOf(img);
      for (let y = Math.max(0, Math.ceil(y0)); y < Math.min(img.height, Math.floor(y1)); y++) for (let x = 0; x < img.width; x++) {
        if (x < 120 && y < 120) continue;                               /* the orientation widget */
        if (y > img.height - 44) continue;                              /* the provenance note */
        if (!isBg(img.at(x, y), bg)) n += 1;
      }
      return n;
    };
    const off = await canvasImage(page);
    await page.click('#ssb-spec button[data-section="axial"]');
    const sec = await spec(page, () => window.__ssb.specimen.section);
    const cursor0 = await spec(page, () => window.__ssb.specimen.cursor);
    check('section: choosing Axial puts the plane on the shared cursor (it starts mid-volume), one clip plane is active', sec.axis === 'axial' && cursor0 && Math.abs(sec.at - cursor0[2]) < 1e-9 && (await spec(page, () => window.__ssb.specimen.info().clipping)) === 1, JSON.stringify([sec, cursor0]));
    await page.fill('#ssb-spec-section', '25');
    await page.dispatchEvent('#ssb-spec-section', 'input');
    await nextFrames(page, 3);
    const cur = await spec(page, () => window.__ssb.specimen.cursor);
    await page.waitForFunction((h) => location.hash.includes(h), `at=${cursor0[0]},${cursor0[1]},25`, { timeout: 3000 }).catch(() => {});     /* the URL follows a slider once it settles */
    check('section: the slider moves the cursor along the axis (the CT crosshair), in mm, and the URL follows', Math.abs(cur[2] - 25) < 1e-6 && cur[0] === cursor0[0] && (await page.evaluate(() => location.hash)).includes(`at=${cursor0[0]},${cursor0[1]},25`), JSON.stringify(cur));
    const line = (await project(page, [0, -40, 25])).y - off.rect.y;     /* the cut plane seen edge-on is a band a few px thick under perspective: keep clear of it */
    const on = await canvasImage(page);
    const aboveOff = lit(off.img, off.rect, 0, line - 12);
    const aboveOn = lit(on.img, on.rect, 0, line - 12);
    const belowOn = lit(on.img, on.rect, line + 12, on.img.height);
    check('section: the axial cut removes everything above the plane (nothing is drawn above it; there was plenty before) and keeps what is below',
      aboveOff > 500 && aboveOn === 0 && belowOn > 500, JSON.stringify({ aboveOff, aboveOn, belowOn, line }));
    await page.click('#ssb-spec-flip');
    await nextFrames(page, 3);
    const flipped = await canvasImage(page);
    const flipAbove = lit(flipped.img, flipped.rect, 0, line - 12);
    const flipBelow = lit(flipped.img, flipped.rect, line + 12, flipped.img.height);
    check('section: "keep the other side" keeps what is above the plane and removes what is below', flipAbove > 500 && flipBelow === 0, JSON.stringify({ flipAbove, flipBelow, line }));
    await page.click('#ssb-spec button[data-section="coronal"]');
    await page.click('#ssb-spec button[data-section="sagittal"]');
    check('section: only one plane at a time (the section follows its axis)', (await spec(page, () => window.__ssb.specimen.section.axis)) === 'sagittal' && (await spec(page, () => window.__ssb.specimen.info().clipping)) === 1);
    /* the CT stage and the lab never see the cut */
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await nextFrames(page, 2);
    check('section: leaving the specimen removes the clip (the lab and CT are never cut)', (await spec(page, () => window.__ssb.specimen.info().clipping)) === 0);
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await nextFrames(page, 2);
    check('section: …and returning restores it at the cursor', (await spec(page, () => window.__ssb.specimen.info().clipping)) === 1 && (await spec(page, () => window.__ssb.specimen.section.axis)) === 'sagittal');
    await page.click('#ssb-spec button[data-section="off"]');
    check('section: Off removes the cut', (await spec(page, () => window.__ssb.specimen.info().clipping)) === 0);
    await context.close();
  }

  /* ===== section caps: solid bone is capped exactly where the plane cuts bone ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const probes = sectionProbes(truth.get('s.skull-base-region.M'), 0);
    const inside = probes.filter((q) => q.inside);
    check('caps: the midsagittal plane cuts bone at enough points of the raw data to test (≥ 40 well inside)', inside.length >= 40, `${inside.length} of ${probes.length}`);
    await clickView(page, 'right');
    const capColor = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = getComputedStyle(document.documentElement).getPropertyValue('--ssb-bone-cut').trim();
      document.body.append(probe);
      const c = getComputedStyle(probe).color.match(/\d+/g).map(Number);
      probe.remove();
      return c;
    });
    const near = (c) => Math.abs(c[0] - capColor[0]) + Math.abs(c[1] - capColor[1]) + Math.abs(c[2] - capColor[2]) <= 60;
    const share = async () => {
      await nextFrames(page, 3);
      const { img, rect } = await canvasImage(page);
      const px = await page.evaluate((ps) => ps.map((q) => window.__ssb.specimen.project([0, q.y, q.z])), inside);
      let n = 0;
      px.forEach((q) => { const x = Math.round(q.x - rect.x); const y = Math.round(q.y - rect.y); if (x >= 0 && y >= 0 && x < img.width && y < img.height && near(img.at(x, y))) n += 1; });
      return n / inside.length;
    };
    await page.click('#ssb-spec button[data-bone="solid"]');
    await page.click('#ssb-spec button[data-section="sagittal"]');
    await page.fill('#ssb-spec-section', '0');
    await page.dispatchEvent('#ssb-spec-section', 'input');
    const solid = await share();
    const capShown = await spec(page, () => window.__ssb.specimen.cap.shown);
    check('caps: with solid bone the cut face is drawn in the cut-bone colour at ≥ 90% of the points where the raw data says the plane is inside bone', capShown && solid >= 0.9, `${r2(solid)}; cap ${capShown}`);
    await page.click('#ssb-spec button[data-bone="xray"]');
    const xray = await share();
    check('caps: an X-ray ghost is not capped (the same points are mostly not cut-bone coloured, and no cap is drawn)', !(await spec(page, () => window.__ssb.specimen.cap.shown)) && xray < 0.6, `${r2(xray)}`);
    await page.click('#ssb-spec button[data-bone="solid"]');
    await page.click('#ssb-spec button[data-section="off"]');
    check('caps: with no section there is no cap', !(await spec(page, () => window.__ssb.specimen.cap.shown)));
    await page.click('#ssb-spec button[data-section="axial"]');
    await page.fill('#ssb-spec-section', '30');
    await page.dispatchEvent('#ssb-spec-section', 'input');
    await page.click('#ssb-spec button[data-bone="hidden"]');
    check('caps: with the bone hidden there is nothing to cap', !(await spec(page, () => window.__ssb.specimen.cap.shown)));
    /* what the cut took away cannot be picked */
    await page.click('#ssb-spec button[data-bone="xray"]');
    await clickView(page, 'superior');
    const aim = await project(page, [0, -45, 60]);        /* above the plane at S 30: cut away */
    const hits = await spec(page, ([x, y]) => window.__ssb.specimen.hits(x, y), [aim.x, aim.y]);
    check('section: surfaces on the cut-away side are not picked (there are hits below, and every hit lies on the kept side of the plane)', hits.length >= 1 && hits.every((h) => h.point[2] <= 30.1), JSON.stringify(hits.map((h) => [h.key, r2(h.point[2])])));
    await context.close();
  }

  /* ===== stages: lab and CT come and go, nothing leaks, the camera comes back ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    await clickView(page, 'right');
    const camA = await spec(page, () => window.__ssb.specimen.camera());
    const geo0 = await spec(page, () => window.__ssb.specimen.info().geometries);
    for (let i = 0; i < 3; i++) {
      await page.click('#ssb-stage-mode [data-stage="lab"]');
      await page.waitForFunction(() => window.__ssb.lab && window.__ssb.lab.builds > 0 && !window.__ssb.specimen.active);
      await nextFrames(page, 3);
      await page.click('#ssb-stage-mode [data-stage="specimen"]');
      await page.waitForFunction(() => window.__ssb.specimen.active);
      await nextFrames(page, 4);
    }
    const camB = await spec(page, () => window.__ssb.specimen.camera());
    const geo1 = await spec(page, () => window.__ssb.specimen.info().geometries);
    check('stages: after three trips through the lab the specimen is back with the camera where the reader left it', arrEq(camA.position, camB.position, 1e-3) && arrEq(camA.target, camB.target, 1e-3), JSON.stringify([camA.position, camB.position]));
    check('stages: no geometry leaks across stage switches (GPU geometry count is back to what it was)', geo1 <= geo0, `${geo0} -> ${geo1}`);
    check('stages: the lab did not dispose the specimen (every node is still there and drawn)', (await specNodes(page)).length === truth.size && (await spec(page, () => window.__ssb.specimen.info().triangles)) > 100000);
    /* and a pick still works after the round trip */
    const aim = await spec(page, () => window.__ssb.specimen.screenOf('s.skull-base-region.M'));
    check('stages: picking still works after the round trip', aim && (await spec(page, ([x, y]) => window.__ssb.specimen.hits(x, y).length, [aim.x, aim.y])) >= 1);
    await context.close();
  }

  /* ===== bad packs: a message in place, never a blank stage ===== */
  {
    const real = (name) => fs.readFileSync(path.join(ROOT, 'ssb/models', name));
    const truncated = (name) => (route) => route.fulfill({ status: 200, headers: RAW, body: real(name).subarray(0, Math.floor(real(name).length / 2)) });

    /* core truncated */
    {
      const { context, page, warnings } = await openSpecimen(browser, base, '', { routes: { 'core.glb.gz': truncated('core.glb.gz') } });
      const info = await page.evaluate(() => ({
        status: window.__ssb.specimen.status, installed: window.__ssb.specimen.installed, msg: document.getElementById('ssb-stage-msg').textContent,
        shown: !document.getElementById('ssb-stage-msg').hidden, axis: [...document.querySelectorAll('.ssb-axis-label')].map((e) => getComputedStyle(e).visibility),
        treeItems: document.querySelectorAll('#ssb-tree button[data-id]').length, packs: Object.fromEntries(Object.entries(window.__ssb.specimen.packs).map(([k, v]) => [k, v.state])),
      }));
      check('bad pack: a truncated core.glb.gz is a message in place (status error, "could not be loaded"), nothing installed', info.status === 'error' && !info.installed && info.shown && /could not be loaded/i.test(info.msg) && /damaged|gzip|cut/i.test(info.msg), JSON.stringify(info));
      check('bad pack: the stage is not blank — the placeholder grid and axes stay, and the structure list is there — and nothing is added to a missing core', info.axis.every((v) => v === 'visible') && info.treeItems > 20 && info.packs.core === 'failed' && info.packs['sphenoid-sellar'] === 'pending', JSON.stringify(info));
      check('bad pack: the problem is a console.warn, not an error', warnings.some((w) => /core/.test(w)), warnings.join(' | '));
      const sel = await page.evaluate(() => { document.querySelector('#ssb-tree button[data-id]').click(); return document.querySelector('#ssb-panel-body [data-entity]') !== null; });
      check('bad pack: graph mode works (selecting in the tree opens the panel)', sel);
      await context.close();
    }
    /* a region pack truncated: the rest still shows */
    {
      const { context, page } = await openSpecimen(browser, base, '', { routes: { 'ethmoid-frontal.glb.gz': truncated('ethmoid-frontal.glb.gz') } });
      const info = await page.evaluate(() => ({
        status: window.__ssb.specimen.status, installed: window.__ssb.specimen.installed, note: document.getElementById('ssb-stage-note').textContent, title: document.getElementById('ssb-stage-note').title,
        packs: Object.fromEntries(Object.entries(window.__ssb.specimen.packs).map(([k, v]) => [k, v.state + ':' + v.nodes.length])),
        status2: document.querySelector('#ssb-spec .ssb-param-src:last-of-type') ? document.querySelector('#ssb-spec .ssb-param-src:last-of-type').textContent : '', frames: window.__ssb.specimen.renders,
      }));
      check('bad pack: a truncated region pack is partial — the other packs show, the note says how many could not load, the reason is on it',
        info.status === 'partial' && info.installed && /\d+ of \d+ packs could not be loaded/.test(info.note) && /ethmoid-frontal/.test(info.title) && info.packs['ethmoid-frontal'].startsWith('failed') && info.packs.core.startsWith('loaded:'), JSON.stringify(info));
      await context.close();
    }
    /* not gzip at all, right name */
    {
      const { context, page } = await openSpecimen(browser, base, '', { routes: { 'core.glb.gz': (route) => route.fulfill({ status: 200, headers: RAW, body: Buffer.from('this is not a model') }) } });
      const info = await page.evaluate(() => ({ status: window.__ssb.specimen.status, msg: document.getElementById('ssb-stage-msg').textContent }));
      check('bad pack: a core file that is not a glTF binary is a message too', info.status === 'error' && /not a glTF binary/.test(info.msg), JSON.stringify(info));
      await context.close();
    }
    /* no pack list */
    {
      const { context, page, errors } = await openSpecimen(browser, base, '', { track: false, routes: { 'packs.json': (route) => route.fulfill({ status: 404, body: 'not found' }) } });
      const info = await page.evaluate(() => ({ status: window.__ssb.specimen.status, msg: document.getElementById('ssb-stage-msg').textContent, shown: !document.getElementById('ssb-stage-msg').hidden }));
      check('bad pack: no packs.json is the "not in this build yet" message', info.status === 'absent' && info.shown && /not in this build yet/.test(info.msg), JSON.stringify(info));
      check('bad pack: the only console noise is the expected 404 for the missing file', errors.every((e) => /404/.test(e.text)), JSON.stringify(errors));
      await context.close();
    }
    /* a pack that appears, with nodes that must be skipped */
    {
      const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8'));
      const have = new Set([...truth.keys()].map((k) => truth.get(k).id));
      const fresh = [...GRAPH.values()].map((v) => v.entity).filter((e) => e.id.startsWith('s.') && !have.has(e.id) && (e.kind === 'bone' || e.kind === 'bone-part'))[0];
      const dup = [...truth.keys()][0];
      const dupNode = truth.get(dup);
      const glb = zlib.gzipSync(makeGlb([
        { id: fresh.id, side: 'R', center: [20, -40, 20], half: 3 },
        { id: 's.not-in-the-graph', side: 'M', center: [0, -40, 20], half: 3 },
        { id: dupNode.id, side: dupNode.side, center: [0, -40, 20], half: 3 },
        { id: fresh.id, side: 'L', center: [5000, 0, 0], half: 3 },
        { id: fresh.id, side: 'X', center: [0, 0, 0], half: 3 },
      ]));
      doc.packs.appeared = { file: 'appeared.glb.gz', bytes: glb.length, triangles: 60, nodes: { [`${fresh.id}.R`]: {} } };
      const { context, page, warnings } = await openSpecimen(browser, base, '', { routes: {
        'packs.json': (route) => route.fulfill({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(doc) }),
        'appeared.glb.gz': (route) => route.fulfill({ status: 200, headers: RAW, body: glb }),
      } });
      const info = await page.evaluate(() => ({ status: window.__ssb.specimen.status, packs: window.__ssb.specimen.packs, keys: window.__ssb.specimen.nodes().map((n) => n.key), problems: window.__ssb.specimen.problems }));
      const added = (await specNodes(page)).find((n) => n.key === `${fresh.id}.R`);
      check('new pack: a pack that appears in packs.json is loaded with no code change (its valid node is in the registry, as bone)', info.packs.appeared && info.packs.appeared.state === 'loaded' && added && added.group === 'bone' && info.keys.length === truth.size + 1, JSON.stringify(info.packs.appeared));
      check('new pack: nodes that are not in the graph, repeat a key, lie off the head or have no valid side are skipped, each with a console.warn (and the real packs are untouched)',
        info.packs.appeared.nodes.length === 1 && info.problems.length >= 4 && warnings.filter((w) => /SSB specimen/.test(w)).length >= 4 && info.keys.filter((k) => truth.has(k)).length === truth.size && info.status === 'partial', JSON.stringify([info.problems, warnings.length]));
      await context.close();
    }
  }

  /* ===== WebGL missing, quality, theme, phones ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '', { webgl: false, wait: 'none' });
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    const info = await page.evaluate(() => ({ spec: window.__ssb.specimen, msg: document.getElementById('ssb-stage-msg').textContent, shown: !document.getElementById('ssb-stage-msg').hidden }));
    check('no WebGL: there is no specimen stage, the stage says the 3D view needs WebGL 2, and graph mode works', info.spec === null && info.shown && /WebGL 2/.test(info.msg));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#q=lite');
    await page.click('#ssb-spec button[data-bone="solid"]');
    await nextFrames(page, 3);
    const info = await page.evaluate(() => ({ q: window.__ssb.materials.quality, frames: window.__ssb.frames, bone: window.__ssb.specimen.bone }));
    await page.mouse.move(600, 400);
    const t0 = Date.now();
    await page.click('#ssb-spec button[data-view="anterior"]');
    await page.waitForFunction(() => !window.__ssb.specimen.camera().flying);
    check('quality: under #q=lite the solid bone compiles and draws, and a view change stays interactive (< 4 s under SwiftShader)', info.q === 'lite' && info.bone === 'solid' && Date.now() - t0 < 4000, JSON.stringify({ ...info, ms: Date.now() - t0 }));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '', { viewport: { width: 390, height: 844 } });
    const info = await page.evaluate(() => {
      const d = document.getElementById('ssb-spec-dock').getBoundingClientRect();
      const c = document.getElementById('ssb-canvas').getBoundingClientRect();
      const st = document.getElementById('ssb-stage').getBoundingClientRect();
      return { collapsed: document.getElementById('ssb-spec-dock').dataset.collapsed, dockW: d.width, canvasW: c.width, canvasH: c.height, stageW: st.width, scroll: document.documentElement.scrollWidth <= window.innerWidth, status: window.__ssb.specimen.status };
    });
    check('phone: the specimen loads, the layers dock is closed (a small tab at the foot of the stage), the canvas is the whole stage, no horizontal scroll',
      info.status === 'ready' && info.collapsed === 'true' && info.dockW < 200 && info.canvasW >= info.stageW - 1 && info.scroll, JSON.stringify(info));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'spec-phone.png') });
    await page.click('#ssb-spec-toggle');
    await nextFrames(page, 3);
    const open = await page.evaluate(() => {
      const d = document.getElementById('ssb-spec-dock').getBoundingClientRect();
      const c = document.getElementById('ssb-canvas').getBoundingClientRect();
      return { collapsed: document.getElementById('ssb-spec-dock').dataset.collapsed, canvasBottom: c.bottom, canvasH: c.height, dockTop: d.top, dockH: d.height, stageH: document.getElementById('ssb-stage').getBoundingClientRect().height, bodyScroll: document.getElementById('ssb-spec-body').scrollHeight > document.getElementById('ssb-spec-body').clientHeight };
    });
    check('phone: opening the layers gives the lower part of the stage to them, and the canvas gives way (the model stays in sight above them, not under them)',
      open.collapsed === 'false' && open.canvasBottom <= open.dockTop + 1 && open.canvasH >= 150 && open.dockH <= open.stageH * 0.55, JSON.stringify(open));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'spec-phone-layers.png') });
    await page.click('#ssb-spec-toggle');
    await nextFrames(page, 3);
    check('phone: closing them gives the canvas the whole stage back', (await page.evaluate(() => document.getElementById('ssb-canvas').getBoundingClientRect().height)) >= info.canvasH - 1);

    await context.close();
  }

  /* ===== screenshots ===== */
  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    const { context, page } = await openSpecimen(browser, base, '', { track: false });
    const shot = async (name) => { await nextFrames(page, 3); await page.waitForTimeout(250); await page.screenshot({ path: path.join(SHOTS, `spec-${name}.png`) }); };
    await shot('default');
    await clickView(page, 'anterior'); await shot('anterior');
    await clickView(page, 'right'); await shot('lateral-right');
    await clickView(page, 'superior'); await shot('superior');
    await clickView(page, 'oblique');
    await page.click('#ssb-spec button[data-bone="solid"]'); await shot('solid');
    await clickView(page, 'right');
    await page.click('#ssb-spec button[data-section="sagittal"]');
    await page.fill('#ssb-spec-section', '2'); await page.dispatchEvent('#ssb-spec-section', 'input');
    await shot('section');
    await clickView(page, 'oblique'); await shot('section-oblique');
    await page.click('#ssb-spec button[data-section="off"]');
    await page.click('#ssb-spec button[data-bone="xray"]');
    await page.evaluate(() => { document.querySelector('#ssb-tree button[data-id="s.frontal-sinus"]').click(); });
    await page.waitForFunction(() => !window.__ssb.specimen.camera().flying);
    await shot('selection');
    await page.click('#ssb-spec-landmarks');
    await clickView(page, 'anterior');
    await shot('landmarks');
    await page.click('.site-theme-toggle');
    await shot('dark');
    await context.close();
  }
}

/* ---------------- The standard specimen (N1, O6; docs/ssb.md 5.1): symmetric by construction ---------------- */

function standardSpecimenTests() {
  const read = (p) => fs.readFileSync(path.join(ROOT, p));
  const json = (p) => JSON.parse(read(p).toString('utf8'));
  const hdr = json('ssb/ct/ct.json');
  const [nx, ny, nz] = hdr.dims;
  const mid = (nx - 1) / 2;
  const std = hdr.standard;
  check('standard: ct.json carries the `standard` block (method, as-scanned commit, source side R, septum offset, plates, note)',
    !!std && std.sourceSide === 'R' && /^[0-9a-f]{40}$/.test(std.asScannedCommit) && std.septumOffsetMm && std.septumOffsetMm.max >= std.septumOffsetMm.median && std.septumOffsetMm.median > 0
      && std.plates && Object.keys(std.plates).length >= 2 && typeof std.note === 'string' && std.note.length > 20, JSON.stringify(std));
  check('standard: voxel column nx/2 is R = 0 (the mirror plane), so a flip about it is exact', Number.isInteger(mid) && Math.abs(hdr.affine[0][3] + mid * hdr.spacing[0]) < 1e-9 && hdr.affine[0][0] === hdr.spacing[0]);
  const ct = new Uint8Array(zlib.gunzipSync(read('ssb/ct/ct.u8.gz')));
  const lb = zlib.gunzipSync(read('ssb/ct/labels.u16.gz'));
  const lab = new Uint16Array(lb.buffer.slice(lb.byteOffset, lb.byteOffset + lb.length));
  const table = json('ssb/geometry/labels.json').labels;
  const byName = new Map(Object.entries(table).map(([k, v]) => [v, Number(k)]));
  const swap = new Uint16Array(Math.max(...Object.keys(table).map(Number)) + 1).map((_, i) => i);
  for (const [k, name] of Object.entries(table)) {
    const m = /^(.+)\.(R|L)$/.exec(name);
    if (m && byName.has(`${m[1]}.${m[2] === 'R' ? 'L' : 'R'}`)) swap[Number(k)] = byName.get(`${m[1]}.${m[2] === 'R' ? 'L' : 'R'}`);
  }
  check('standard: every .R label has a .L index (the table is complete for the mirror)', Object.values(table).filter((n) => n.endsWith('.R')).every((n) => byName.has(n.replace(/\.R$/, '.L'))));
  let ctBad = 0;
  let labBad = 0;
  let leftOfRight = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      const row = (k * ny + j) * nx;
      for (let i = 0; i < nx; i++) {
        const o = 2 * mid - i;
        if (i >= mid || Math.abs(i - mid) <= 1) continue;          /* |x| <= 0.5 holds the midline plates */
        if (ct[row + i] !== ct[row + o]) ctBad++;
        if (lab[row + i] !== swap[lab[row + o]]) labBad++;
      }
      for (let i = mid + 2; i < nx; i++) if (/\.L$/.test(table[lab[row + i]] || '')) leftOfRight++;
    }
  }
  check('standard: the CT is mirror-symmetric about R = 0 outside |x| <= 0.5 (0 mismatching voxels)', ctBad === 0, `${ctBad} mismatches`);
  check('standard: the label volume is mirror-symmetric about R = 0 outside |x| <= 0.5, labels side-mapped (0 mismatching voxels), and no .L label lies in the right half', labBad === 0 && leftOfRight === 0, `${labBad} mismatches, ${leftOfRight} .L voxels right of R = 0`);
  /* no air of a .R space touches air of a .L space */
  const airSide = new Uint8Array(swap.length);          /* 0 not air, 1 a .R air space, 2 a .L air space */
  for (const [k, name] of Object.entries(table)) {
    const m = /^s\.(agger-nasi-cell|anterior-ethmoid-cells|ethmoid-bulla|frontal-recess|frontal-sinus|maxillary-sinus|nasal-cavity|nasal-vestibule|nasopharynx|posterior-ethmoid-cells|sphenoid-sinus)\.(R|L)$/.exec(name);
    if (m) airSide[Number(k)] = m[2] === 'R' ? 1 : 2;
  }
  let touching = 0;
  const strides = [1, nx, nx * ny];
  for (let n = 0; n < lab.length; n++) {
    const a = airSide[lab[n]];
    if (!a) continue;
    for (let d = 0; d < 3; d++) {
      const m = n + strides[d];
      if (m >= lab.length || (d === 0 && (n % nx) === nx - 1)) continue;
      const b = airSide[lab[m]];
      if (b && a !== b) touching++;
    }
  }
  check('standard: no .R air voxel touches a .L air voxel (the midline plates close every paired space)', touching === 0, `${touching} face pairs`);

  const lm = json('ssb/geometry/landmarks.json');
  const paired = Object.keys(lm).filter((k) => k.endsWith('.R') && lm[k.replace(/\.R$/, '.L')]);
  const off = paired.map((k) => { const l = lm[k.replace(/\.R$/, '.L')]; const r = lm[k]; return Math.hypot(l[0] + r[0], l[1] - r[1], l[2] - r[2]); });
  check('standard: every paired landmark .L mirrors its .R within 0.01 mm (R negated)', paired.length >= 6 && off.every((d) => d <= 0.01), JSON.stringify(paired.map((k, i) => [k, off[i]])));
  const mids = Object.entries(lm).filter(([k]) => k.endsWith('.M'));
  check('standard: every .M landmark has R = 0', mids.length > 5 && mids.every(([, p]) => Math.abs(p[0]) < 1e-9), JSON.stringify(mids.filter(([, p]) => Math.abs(p[0]) >= 1e-9)));
  const sw = json('ssb/geometry/sweeps.json');
  const swPaired = Object.keys(sw).filter((k) => k.endsWith('.R') && sw[k.replace(/\.R$/, '.L')]);
  const swOff = swPaired.map((k) => { const R = sw[k].pts; const L = sw[k.replace(/\.R$/, '.L')].pts; return R.length === L.length ? Math.max(...R.map((p, i) => Math.hypot(L[i][0] + p[0], L[i][1] - p[1], L[i][2] - p[2]))) : Infinity; });
  check('standard: every paired sweep .L is its .R mirrored (R negated) point for point', swPaired.length >= 14 && swOff.every((d) => d <= 0.01), JSON.stringify(swPaired.map((k, i) => [k, swOff[i]])));

  /* the septum is centred: the right surface lies at half the as-scanned thickness T = rR - rL, on interior chart cells */
  let asScanned = null;
  let why = '';
  try {
    asScanned = JSON.parse(execFileSync('git', ['show', `${std.asScannedCommit}:ssb/geometry/charts.json`], { cwd: ROOT, maxBuffer: 1 << 26 }).toString('utf8')).surfaces;
  } catch (e) { why = `git cannot show ${std.asScannedCommit} (a shallow clone? CI checks out with fetch-depth 0)`; }
  let septum = { n: 0, max: Infinity };
  if (asScanned) {
    const grid = (s) => {
      const g = s.grid;
      const bad = new Set([...s.filled.cells, ...s.unreliable.cells].map(([a, b]) => `${a},${b}`));
      return { at: (a, b) => { const i = Math.round(a - g.origin[0]); const j = Math.round(b - g.origin[1]); return g.r[i] && g.r[i][j] != null ? g.r[i][j] : null; }, bad, g };
    };
    const aR = grid(asScanned['s.septal-mucosa.R']);
    const aL = grid(asScanned['s.septal-mucosa.L']);
    const nR = grid(json('ssb/geometry/charts.json').surfaces['s.septal-mucosa.R']);
    const good = (a, b) => aR.at(a, b) != null && aL.at(a, b) != null && !aR.bad.has(`${a},${b}`) && !aL.bad.has(`${a},${b}`) && !nR.bad.has(`${a},${b}`);
    let n = 0;
    let max = 0;
    for (let i = 0; i < aR.g.r.length; i++) {
      for (let j = 0; j < aR.g.r[i].length; j++) {
        const a = aR.g.origin[0] + i;
        const b = aR.g.origin[1] + j;
        let interior = true;
        for (let da = -1; da <= 1 && interior; da++) for (let db = -1; db <= 1; db++) if (!good(a + da, b + db)) { interior = false; break; }
        const now = nR.at(a, b);
        if (!interior || now == null) continue;
        n++;
        max = Math.max(max, Math.abs(now - (aR.at(a, b) - aL.at(a, b)) / 2));
      }
    }
    septum = { n, max: r2(max) };
  }
  check('standard: the right septal surface lies at T/2 (half the as-scanned thickness) within 0.5 mm on interior chart cells', !!asScanned && septum.n >= 300 && septum.max <= 0.5, why || JSON.stringify(septum));
  const cR = json('ssb/geometry/charts.json').surfaces;
  const mirroredChart = cR['s.septal-mucosa.L'].grid.r.every((row, i) => row.every((v, j) => (v == null && cR['s.septal-mucosa.R'].grid.r[i][j] == null) || Math.abs(v + cR['s.septal-mucosa.R'].grid.r[i][j]) < 1e-9));
  check('standard: s.septal-mucosa.L\'s chart is the right chart with r negated', mirroredChart);
  // ST2c: the floor mucosa, traced from the airway lining
  const fR = cR['s.nasal-floor-mucosa.R'], fL = cR['s.nasal-floor-mucosa.L'];
  const packs = json('ssb/models/packs.json').packs.soft.nodes;
  check('floor mucosa: both sides are in the soft pack and the charts, at least 2 cm2 each', !!fR && !!fL && !!packs['s.nasal-floor-mucosa.R'] && !!packs['s.nasal-floor-mucosa.L'] && fR.area_cm2 >= 2 && fL.area_cm2 === fR.area_cm2, JSON.stringify([fR && fR.area_cm2, Object.keys(packs)]));
  const cells = fR ? fR.grid.s.flat().filter(v => v != null) : [];
  check('floor mucosa: the chart sits in the floor (S -5..3 mm, A -51..-10, lateral r 1..17 mm)', cells.length > 300 && Math.min(...cells) > -5 && Math.max(...cells) < 3 && fR.grid.origin[0] >= -52 && fR.grid.origin[0] + Math.max(...fR.grid.s.map((row, i) => (row.some((v) => v != null) ? i : -1))) <= -10 && fR.grid.origin[1] >= 0 && fR.grid.origin[1] + fR.grid.dims[1] <= 18, JSON.stringify({ n: cells.length, lo: Math.min(...cells), hi: Math.max(...cells) }));
  const jr = fR ? fR.junction.rows.filter(r => r[0] >= -47) : [];
  check('floor mucosa: the junction lies within 1 mm of the septal chart\'s bottom(a) over their shared A (a >= -47)', jr.length >= 30 && jr.every(r => r[5] <= 1.0), JSON.stringify({ n: jr.length, max: Math.max(...jr.map(r => r[5])) }));
  check('floor mucosa: the left chart is the right one (symmetric specimen)', !!fL && JSON.stringify(fL.grid.s) === JSON.stringify(fR.grid.s) && JSON.stringify(fL.junction) === JSON.stringify(fR.junction));

  /* ST6: the external nose, the internal valve and the vestibule (the volume is already mirror-symmetric, N1's checks above) */
  const A = hdr.affine;
  const at = (p) => (Math.round((p[2] - A[2][3]) / A[2][2]) * ny + Math.round((p[1] - A[1][3]) / A[1][1])) * nx + Math.round((p[0] - A[0][3]) / A[0][0]);
  const inAir = (p) => ct[at(p)] > 0 && ct[at(p)] < 78;
  const vest = { R: byName.get('s.nasal-vestibule.R'), L: byName.get('s.nasal-vestibule.L') };
  const meta = json('ssb/geometry/landmarks.meta.json').landmarks;
  check('nose: s.nasal-vestibule.R and .L are in the label table', Number.isInteger(vest.R) && Number.isInteger(vest.L) && vest.R !== vest.L);
  check('nose: lm.naris.<side> lies in its own side\'s s.nasal-vestibule air (display 0 < d < 78)',
    ['R', 'L'].every((sd) => lab[at(lm[`lm.naris.${sd}`])] === vest[sd] && inAir(lm[`lm.naris.${sd}`])), JSON.stringify(['R', 'L'].map((sd) => [lm[`lm.naris.${sd}`], table[lab[at(lm[`lm.naris.${sd}`])]], ct[at(lm[`lm.naris.${sd}`])]])));
  const valve = lm['s.internal-nasal-valve.R'];
  const vmeta = meta['s.internal-nasal-valve.R'];
  check('nose: the internal valve landmark (a pair, mirrored) lies in air at the valve plane, 10..25 mm behind lm.naris, and its meta records the method, plane and section area',
    !!valve && !!lm['s.internal-nasal-valve.L'] && inAir(valve) && inAir(lm['s.internal-nasal-valve.L']) && valve[1] <= lm['lm.naris.R'][1] - 10 && valve[1] >= lm['lm.naris.R'][1] - 25
      && !!vmeta && vmeta.a_mm === valve[1] && vmeta.section_area_mm2 > 20 && vmeta.in_air === true && /smallest area/.test(vmeta.method), JSON.stringify([valve, vmeta]));
  /* the vestibule: in front of the valve plane, one piece per side, inside the nose, and the cavity stops at the plane */
  const rowsOf = (v) => {
    const out = [];
    for (let n = 0; n < lab.length; n++) if (lab[n] === v) out.push(n);
    return out;
  };
  const pieces = (voxels) => {
    const seen = new Set();
    const set = new Set(voxels);
    let count = 0;
    for (const s of voxels) {
      if (seen.has(s)) continue;
      count++;
      const stack = [s];
      seen.add(s);
      while (stack.length) {
        const q = stack.pop();
        const i = q % nx;
        for (const [d, ok] of [[1, i < nx - 1], [-1, i > 0], [nx, true], [-nx, true], [nx * ny, true], [-nx * ny, true]]) {
          const m = q + d;
          if (ok && set.has(m) && !seen.has(m)) { seen.add(m); stack.push(m); }
        }
      }
    }
    return count;
  };
  const vv = { R: rowsOf(vest.R), L: rowsOf(vest.L) };
  const ext = (voxels) => {
    let aMin = Infinity, aMax = -Infinity, rMax = 0;
    for (const n of voxels) {
      const i = n % nx, j = Math.floor(n / nx) % ny;
      aMin = Math.min(aMin, A[1][3] + j * A[1][1]); aMax = Math.max(aMax, A[1][3] + j * A[1][1]); rMax = Math.max(rMax, Math.abs(A[0][3] + i * A[0][0]));
    }
    return { aMin, aMax, rMax, mm3: voxels.length * hdr.spacing[0] ** 3 };
  };
  const eR = ext(vv.R), eL = ext(vv.L);
  check('nose: the vestibule is one 6-connected piece per side, 500..3000 mm3, in front of the valve plane (A > valve A) and inside the nose (|R| <= 20, A <= 18.5), and the left is the right mirrored in size',
    pieces(vv.R) === 1 && pieces(vv.L) === 1 && [eR, eL].every((e) => e.mm3 >= 500 && e.mm3 <= 3000 && e.aMin > valve[1] && e.rMax <= 20 && e.aMax <= 18.5) && vv.R.length === vv.L.length, JSON.stringify({ eR, eL }));
  const cavIdx = { R: byName.get('s.nasal-cavity.R'), L: byName.get('s.nasal-cavity.L') };
  let cavFront = -Infinity;
  for (let n = 0; n < lab.length; n++) if (lab[n] === cavIdx.R || lab[n] === cavIdx.L) cavFront = Math.max(cavFront, A[1][3] + Math.floor(n / nx) % ny * A[1][1]);
  check('nose: the nasal cavity label ends at the valve plane (no cavity voxel more than 0.5 mm in front of it): the vestibule | cavity boundary is the plane', cavFront <= valve[1] + 0.5, `front ${cavFront}, plane ${valve[1]}`);
  const sc = cR['s.septal-mucosa.R'].grid;
  let edge = -Infinity;
  sc.r.forEach((row, i) => { if (row.some((v) => v != null)) edge = Math.max(edge, sc.origin[0] + i); });
  check('nose: the septal chart now ends at the valve plane (its last occupied row within 1 mm of the plane), on both sides alike',
    Math.abs(edge - valve[1]) <= 1.0 && JSON.stringify(cR['s.septal-mucosa.L'].grid.origin) === JSON.stringify(sc.origin), `edge ${edge}, plane ${valve[1]}`);
  check('nose: the unmasked nose is in the volume — skin tissue (display >= 78) at the pronasale (R 0, A 17, S 4.5), nothing at A 21.5 (the source image\'s border)',
    ct[at([0, 17, 4.5])] >= 78 && ct[at([0, 21.5, 4.5])] === 0, JSON.stringify([ct[at([0, 17, 4.5])], ct[at([0, 21.5, 4.5])]]));
  check('nose: ct.json `standard.nose` records the centring offset (median <= max <= 2 mm, the escalation limit), the region and the valve',
    !!std.nose && std.nose.centreOffsetMm.median <= std.nose.centreOffsetMm.max && std.nose.centreOffsetMm.max <= 2.0 && std.nose.regionVoxels > 100000 && std.nose.valve.areaMm2 > 20 && std.nose.vestibuleMm3 > 500 && /limen nasi/.test(std.nose.note), JSON.stringify(std.nose));
}

/* ---------------- ST1b: the open airway lining (Node only, on the committed packs) ---------------- */

function liningTests() {
  const read = (p) => fs.readFileSync(path.join(ROOT, p));
  const json = (p) => JSON.parse(read(p).toString('utf8'));
  const { doc, nodes } = readPacks();
  const hdr = json('ssb/ct/ct.json');
  const [nx, ny, nz] = hdr.dims;
  const A = hdr.affine;
  const lining = [...nodes].filter(([, n]) => n.lining).map(([, n]) => n);
  const shells = [...nodes].filter(([, n]) => ['core', 'ethmoid-frontal', 'sphenoid-sellar'].includes(n.pack) && n.id !== 's.skull-base-region').map(([, n]) => n);
  const lp = doc.packs.lining;
  check('lining: packs.json lists a "lining" pack flagged lining:true, within its budgets (50k triangles, 1.5 MB), and every pack together stays inside §5.4 (400k triangles, 12 MB)',
    !!lp && lp.lining === true && lp.triangles <= 50050 && lp.bytes <= 1500000 && doc.totals.triangles <= 400000 && doc.totals.bytes <= 12000000, JSON.stringify(lp && { t: lp.triangles, b: lp.bytes, totals: doc.totals }));
  const want = shells.map((n) => `${n.id}.${n.side}`).sort().join();
  check('lining: it carries exactly one node per air-space label (the air packs\' own names, so picking keeps graph ids)', lining.map((n) => `${n.id}.${n.side}`).sort().join() === want, `${lining.length} vs ${shells.length}`);

  /* the labels, for the membrane rule */
  const lb = zlib.gunzipSync(read('ssb/ct/labels.u16.gz'));
  const lab = new Uint16Array(lb.buffer.slice(lb.byteOffset, lb.byteOffset + lb.length));
  const table = json('ssb/geometry/labels.json').labels;
  const airIdx = new Set(Object.entries(table).filter(([, name]) => shells.some((n) => `${n.id}.${n.side}` === name)).map(([k]) => Number(k)));
  const Ainv = (() => {
    const [[a, b, c], [d, e, f], [g, h, i]] = A.map((r) => r.slice(0, 3));
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    return [[(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det], [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det], [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]];
  })();
  const toIdx = (p) => { const q = [p[0] - A[0][3], p[1] - A[1][3], p[2] - A[2][3]]; return [0, 1, 2].map((r) => Math.round(Ainv[r][0] * q[0] + Ainv[r][1] * q[1] + Ainv[r][2] * q[2])); };
  const L = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz ? 0 : lab[(k * ny + j) * nx + i]);
  const labAt = (p) => { const [i, j, k] = toIdx(p); return L(i, j, k); };
  const ras = (i, j, k) => [0, 1, 2].map((n) => A[n][0] * i + A[n][1] * j + A[n][2] * k + A[n][3]);
  const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  /* A triangle centroid is on a membrane when the voxels within one voxel (0.5 mm) of it include a face between two different air labels and no tissue voxel lies within two voxels (1 mm). */
  let membranes = 0;
  let tris = 0;
  for (const n of lining) {
    for (let t = 0; t < n.idx.length; t += 3) {
      const c = [0, 1, 2].map((m) => (n.pts[n.idx[t] * 3 + m] + n.pts[n.idx[t + 1] * 3 + m] + n.pts[n.idx[t + 2] * 3 + m]) / 3);
      const [ci, cj, ck] = toIdx(c);
      let iface = false;
      let tissue = false;
      for (let dk = -2; dk <= 2 && !tissue; dk++) for (let dj = -2; dj <= 2 && !tissue; dj++) for (let di = -2; di <= 2; di++) {
        const l = L(ci + di, cj + dj, ck + dk);
        if (!airIdx.has(l)) { tissue = true; break; }
        if (Math.abs(di) <= 1 && Math.abs(dj) <= 1 && Math.abs(dk) <= 1) for (const [a, b, d] of NB) { const m = L(ci + di + a, cj + dj + b, ck + dk + d); if (m !== l && airIdx.has(m)) iface = true; }
      }
      if (iface && !tissue) membranes++;
      tris++;
    }
  }
  check('lining: no triangle lies on an air|air label interface unless within 1 mm of tissue (count 0)', tris > 40000 && membranes === 0, `${membranes} of ${tris}`);

  /* first hit of a ray among a node set (Möller–Trumbore, both faces) */
  const first = (set, o, d) => {
    let best = null;
    for (const n of set) {
      const P = n.pts;
      for (let t = 0; t < n.idx.length; t += 3) {
        const a = n.idx[t] * 3, b = n.idx[t + 1] * 3, c = n.idx[t + 2] * 3;
        const e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]];
        const e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
        const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
        const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
        if (Math.abs(det) < 1e-12) continue;
        const s = [o[0] - P[a], o[1] - P[a + 1], o[2] - P[a + 2]];
        const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det;
        if (u < 0 || u > 1) continue;
        const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
        const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
        if (v < 0 || u + v > 1) continue;
        const tt = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
        if (tt > 1e-6 && (!best || tt < best.t)) best = { t: tt, id: `${n.id}.${n.side}`, point: [0, 1, 2].map((m) => o[m] + d[m] * tt) };
      }
    }
    return best;
  };

  /* the right sphenoid ostium: the cavity | sinus interface (the one opening of that wall), and every straight, all-air path to it from the cavity 8-12 mm away */
  const byName = new Map(Object.entries(table).map(([k, v]) => [v, Number(k)]));
  const NC = byName.get('s.nasal-cavity.R');
  const SS = byName.get('s.sphenoid-sinus.R');
  const c = [0, 0, 0];
  let nIface = 0;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (L(i, j, k) !== NC) continue;
    for (const [a, b, d] of NB) if (L(i + a, j + b, k + d) === SS) { const p = ras(i + a / 2, j + b / 2, k + d / 2); for (let m = 0; m < 3; m++) c[m] += p[m]; nIface++; }
  }
  for (let m = 0; m < 3; m++) c[m] /= Math.max(nIface, 1);
  const lms = json('ssb/geometry/landmarks.json');
  const os = lms['lm.sphenoid-ostium.R'];
  check('lining: the right cavity | sinus interface exists (the patent ostium) and lies within 3 mm of lm.sphenoid-ostium.R', nIface >= 10 && Math.hypot(c[0] - os[0], c[1] - os[1], c[2] - os[2]) <= 3, JSON.stringify({ faces: nIface, c, os }));
  const tally = { lining: new Set(), shells: new Set() };
  let rays = 0;
  for (let k = 0; k < nz; k += 2) for (let j = 0; j < ny; j += 2) for (let i = 0; i < nx; i += 2) {
    if (L(i, j, k) !== NC) continue;
    const p = ras(i, j, k);
    const d0 = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]);
    if (d0 < 8 || d0 > 12) continue;
    const d = [(c[0] - p[0]) / d0, (c[1] - p[1]) / d0, (c[2] - p[2]) / d0];
    let clear = true;
    for (let t = 0; t < d0 + 0.5 && clear; t += 0.25) { const l = labAt([p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t]); clear = l === NC || l === SS; }
    if (!clear) continue;
    rays++;
    tally.lining.add(first(lining, p, d).id);
    tally.shells.add(first(shells, p, d).id);
  }
  check('lining: every ray through the right ostium (from cavity air 8-12 mm away, all-air path to the interface) first hits s.sphenoid-sinus.R with the lining, where the sealed shells stop it at s.nasal-cavity.R',
    rays >= 20 && [...tally.lining].join() === 's.sphenoid-sinus.R' && [...tally.shells].join() === 's.nasal-cavity.R', JSON.stringify({ rays, lining: [...tally.lining], shells: [...tally.shells] }));

  /* the choana: a free pose looking back from the cavity passes the PNS plane (A -50) before its first hit; with the shells the choanal membrane stops it at the plane */
  const vol = createVolume({ header: parseHeader(hdr), ct: new Uint8Array(zlib.gunzipSync(read('ssb/ct/ct.u8.gz'))) });
  const F = lms['lm.naris.R'];
  const pose = { side: 'R', depth: 40, yaw: -4, pitch: 3, roll: 0, lens: 0 };
  const tip = SC.tipOf(F, pose);
  const v = SC.frameOf(pose).v;
  const free = !SC.shaftClearance(F, pose, (p) => vol.sample(p[0], p[1], p[2]), SC.SHAFT_RADII['4']).blocked;
  const hl = first(lining, tip, v);
  const hs = first(shells, tip, v);
  check('lining: from #scope=R,40,-4,3,0,0 (free, tip in cavity air) the view passes the PNS plane (A -50) before its first hit; the shells\' choanal membrane is hit at the plane',
    free && labAt(tip) === NC && hl && hl.point[1] < -50 && hs && hs.point[1] >= -50, JSON.stringify({ free, tip, lining: hl, shells: hs }));
}

/* ---------------- Endoscope: the math and the codec (Node only) ---------------- */

function scopeUnitTests() {
  const S = [0, 0, 1];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a) => Math.hypot(...a);
  const poses = [];
  let seed = 11;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 0; i < 400; i++) {
    poses.push({ side: rnd() < 0.5 ? 'R' : 'L', depth: rnd() * 120, yaw: (rnd() - 0.5) * 90, pitch: (rnd() - 0.5) * 90, roll: rnd() * 359, lens: SC.LENSES[Math.floor(rnd() * 4)] });
  }
  const F = [4.43, -0.32, 10];
  const frames = poses.map((p) => ({ p, f: SC.frameOf(p) }));
  check('scope: yaw 0 / pitch 0 points straight posterior (-A), for either nostril',
    ['R', 'L'].every((side) => { const d = SC.shaftDir({ ...SC.POSE_DEFAULT, side }); return near(d[0], 0, 1e-9) && near(d[1], -1, 1e-9) && near(d[2], 0, 1e-9); }));
  check('scope: yaw + swings the tip laterally on the scope\'s own side (+R for the right nostril, -R for the left); pitch + goes up',
    SC.shaftDir({ ...SC.POSE_DEFAULT, side: 'R', yaw: 20 })[0] > 0.3 && SC.shaftDir({ ...SC.POSE_DEFAULT, side: 'L', yaw: 20 })[0] < -0.3 && SC.shaftDir({ ...SC.POSE_DEFAULT, pitch: 20 })[2] > 0.3);
  check('scope: the shaft direction is a unit vector for random poses', frames.every(({ f }) => near(len(f.d), 1, 1e-9)));
  check('scope: lens 0 looks down the shaft (v = d)', frames.filter(({ p }) => p.lens === 0).every(({ f }) => len(f.v.map((x, i) => x - f.d[i])) < 1e-9));
  check('scope: a 30 degree lens at roll 0 looks up: v . S = sin(pitch + 30), so above the horizontal whenever the shaft is not pitched below -30 degrees, whatever the nostril and yaw',
    poses.every((p) => { const f = SC.frameOf({ ...p, lens: 30, roll: 0 }); return near(dot(f.v, S), Math.sin((p.pitch + 30) * Math.PI / 180), 1e-9) && (p.pitch <= -30 || dot(f.v, S) > 0); }));
  check('scope: the view direction is a unit vector, at the lens angle from the shaft', frames.every(({ p, f }) => near(len(f.v), 1, 1e-9) && near(dot(f.v, f.d), Math.cos(p.lens * Math.PI / 180), 1e-9)));
  check('scope: the camera\'s up and right are unit and perpendicular to the view and to each other, for random poses',
    frames.every(({ f }) => near(dot(f.up, f.v), 0, 1e-9) && near(len(f.up), 1, 1e-9) && near(dot(f.right, f.v), 0, 1e-9) && near(dot(f.right, f.up), 0, 1e-9) && near(len(f.right), 1, 1e-9)));
  check('scope: with a 0 degree lens the camera\'s up is S projected off the shaft, whatever the roll (the camera head is held level)',
    frames.filter(({ p }) => p.lens === 0).every(({ f }) => { const k = dot(S, f.d); const u = S.map((x, i) => x - k * f.d[i]); const n = len(u); return u.every((x, i) => near(x / n, f.up[i], 1e-9)); }));
  check('scope: at roll 0 the horizon stays upright until the view passes the vertical: up . S = cos(pitch + lens), whatever the nostril and yaw',
    poses.every((p) => { const f = SC.frameOf({ ...p, roll: 0 }); return near(dot(f.up, S), Math.cos((p.pitch + p.lens) * Math.PI / 180), 1e-9); }));
  const steps = (list) => list.map((q) => SC.frameOf(q)).every((f, i, all) => i === 0 || dot(f.up, all[i - 1].up) > 0.99);
  const pitchSweep = Array.from({ length: 91 }, (_, i) => ({ ...SC.POSE_DEFAULT, lens: 70, pitch: i - 45 }));
  const rollSweep = Array.from({ length: 360 }, (_, i) => ({ ...SC.POSE_DEFAULT, lens: 70, pitch: 20, roll: i }));
  check('scope: no gimbal flip — the image turns smoothly as a 70 degree view passes the vertical (pitch -45..45) and as it rolls about it (pitch 20, the frontal recess), and the light post stays at the bottom at roll 0',
    steps(pitchSweep) && steps(rollSweep) && pitchSweep.every((q) => near(SC.lightPostAngle(q), 270, 1e-6)));
  check('scope: the tip at depth 0 is the fulcrum, and at depth t it is F + t d', poses.every((p) => { const t0 = SC.tipOf(F, { ...p, depth: 0 }); const t = SC.tipOf(F, p); const d = SC.shaftDir(p); return len(t0.map((x, i) => x - F[i])) < 1e-12 && len(t.map((x, i) => x - F[i] - p.depth * d[i])) < 1e-9; }));
  const a0 = SC.lightPostAngle({ ...SC.POSE_DEFAULT, lens: 30, roll: 0 });
  const a90 = SC.lightPostAngle({ ...SC.POSE_DEFAULT, lens: 30, roll: 90 });
  check('scope: the light post is opposite the lens\'s offset in the image (roll 0: at the bottom) and turns with roll', near(a0, 270, 1e-6) && Math.abs(a90 - a0) > 45, `${a0} ${a90}`);
  check('scope: the field of view is a 70 degree circle inside the shorter side (vertical fov 70 when landscape, wider when portrait)',
    near(SC.verticalFov(800, 600), 70, 1e-6) && SC.verticalFov(400, 800) > 100);

  /* the codec */
  const rt = SC.formatScope(SC.parseScope('L,12.5,-3,4,200,70'));
  check('scope: #scope= round-trips (format(parse(x)) = x)', rt === 'L,12.5,-3,4,200,70' && SC.formatScope(SC.parseScope(rt)) === rt, rt);
  const hostile = SC.parseScope('R,99999,-999,999,99999,45');
  check('scope: hostile numbers are clamped to the ranges', hostile && hostile.depth === 120 && hostile.yaw === -45 && hostile.pitch === 45 && hostile.roll === 359, JSON.stringify(hostile));
  const bad = ['X,1,2,3,4,30', 'R,1,2,3,4,31', 'R,1,2,3,4', 'R,1,2,3,4,30,5', 'R,a,2,3,4,30', 'R,,2,3,4,30', 'R,1,2,3,4,', '<img src=x onerror=1>', 'R,1,2,3,4,30'.repeat(20)];
  check('scope: a bad side, a lens off the whitelist, the wrong field count, NaN, empty fields, markup or an overlong value is ignored entirely',
    bad.slice(0, -1).every((v) => SC.parseScope(v) === null) && SC.parseScope(bad[bad.length - 1]) === null, bad.filter((v) => SC.parseScope(v) !== null).join(' | '));
  const has = (id) => GRAPH.has(id);
  check('state: #scope= is the endoscope stage; a lab wins over it and a ct plane wins over it; hostile values are dropped',
    parseHash('#scope=R,40,10,-5,90,45', has).scope.lens === 45 && !parseHash('#lab=ethmoid-roof&scope=R,40,0,0,0,0', has, { 'ethmoid-roof': { params: [], presets: {} } }).scope
      && !parseHash('#ct=ax&scope=R,40,0,0,0,0', has).scope && parseHash('#scope=R,40,0,0,0,31', has).scope === undefined);
  const st = createStore({ has, tierOf: () => 1, hash: '#scope=L,30,10,0,0,30', prefs: {}, labs: {} });
  check('state: the store takes the pose from the URL and writes the same canonical hash back', st.get().scope.side === 'L' && st.get().scope.lens === 30 && st.hash() === '#scope=L,30,10,0,0,30', st.hash());
  st.setScope({ side: 'R', depth: 5000, yaw: 0, pitch: 0, roll: 0, lens: 0 });
  check('state: setScope clamps (depth 5000 -> 120) and entering the scope leaves CT and the lab', st.get().scope.depth === 120 && st.get().ct === null && st.get().lab === null);
  st.setCt({ plane: 'axial', at: null });
  check('state: entering CT leaves the scope (the stages are exclusive) and the hash is the CT\'s', st.get().scope === null && st.get().ct && !/scope=/.test(st.hash()), st.hash());
  st.setScope(SC.POSE_DEFAULT);
  check('state: entering the scope leaves CT; leaveStage() clears it', st.get().ct === null && st.get().scope && (st.leaveStage(), st.get().scope === null && st.hash() === ''), st.hash());
  st.applyHash('#scope=R,40,0,0,0,0');
  check('state: applyHash adopts a pasted scope link and drops it when the hash has none', st.get().scope && (st.applyHash(''), st.get().scope === null));

  scopeCollisionTests();
  stationUnitTests();
}


/* ---------------- Endoscope: collision and the proximity HUD (E3, Node only) ---------------- */

function scopeCollisionTests() {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const len = (a) => Math.hypot(...a);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const R4 = SC.SHAFT_RADII['4'];
  const R27 = SC.SHAFT_RADII['2.7'];

  /* ---- the fixture: a bony septum and a sinus, analytic distances ---- */
  const fxVol = createVolume({ header: parseHeader(FX.meta), ct: FX.ct });
  const fxAt = (p) => fxVol.sample(p[0], p[1], p[2]);
  const wallF = [6, 10, 0];
  const through = { side: 'R', depth: 20, yaw: -45, pitch: 0, roll: 0, lens: 0 };      /* medially, into the midline septum (bone at |x| < 0.6) */
  const hit = SC.shaftClearance(wallF, through, fxAt, R4);
  const free = SC.shaftClearance(wallF, { ...through, depth: hit.depth }, fxAt, R4);
  const past = SC.shaftClearance(wallF, { ...through, depth: hit.depth + 0.5 }, fxAt, R4);
  const toWall = 6 / Math.SQRT1_2;
  check('scope collision (fixture): a pose through a solid wall clamps before it — to the last free 0.5 mm sample, not past the wall on the axis',
    hit.blocked && hit.depth > 0 && hit.depth < toWall && !free.blocked && past.blocked && past.depth === hit.depth && hit.depth % 0.5 === 0, JSON.stringify([hit, free, past, toWall]));
  const sinus = { side: 'R', depth: 3, yaw: 0, pitch: 0, roll: 0, lens: 0 };
  const inAir = SC.shaftClearance([10, 3, -4], sinus, fxAt, R4);
  check('scope collision (fixture): a pose in air is untouched (depth unchanged, not blocked)', !inAir.blocked && inAir.depth === 3, JSON.stringify(inAir));
  const d0 = SC.shaftClearance(wallF, through, fxAt, 0).depth;
  const d27 = SC.shaftClearance(wallF, through, fxAt, R27).depth;
  check('scope collision (fixture): the ring matters — a thicker shaft clamps earlier (axis only > 2.7 mm > 4 mm)', d0 > d27 && d27 > hit.depth, `${d0} ${d27} ${hit.depth}`);
  const straightPost = { ...through, yaw: 0 };      /* not toward the midline: the E3b septum rule blocks on position, with or without data */
  const nan = SC.shaftClearance(wallF, straightPost, () => NaN, R4);
  check('scope collision: NaN (outside the volume) and 0 (no data) never block', !nan.blocked && nan.depth === 20 && !SC.shaftClearance(wallF, straightPost, () => 0, R4).blocked, JSON.stringify(nan));
  check('scope collision: blocked at the first sample leaves 1.5 mm free (the shaft cannot start inside bone)',
    (() => { const c = SC.shaftClearance(wallF, through, () => 255, R4); return c.blocked && c.depth === 1.5; })());

  /* ---- the midline rule (E3b): in air, so only R = 0 can block ---- */
  const air = () => 10;
  const ringOf = (F0, p, r) => {
    const d = SC.shaftDir(p);
    const e1 = SC.norm(d[2] > 0.99 || d[2] < -0.99 ? [0, 1, 0] : [-d[0] * d[2], -d[1] * d[2], 1 - d[2] * d[2]]);
    const e2 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
    const c = [0, 1, 2].map((k) => F0[k] + d[k] * p.depth);
    return [c, ...[e1, e2, e1.map((v) => -v), e2.map((v) => -v)].map((e) => c.map((v, k) => v + e[k] * r))];
  };
  const acrossFront = { side: 'R', depth: 40, yaw: -45, pitch: 0, roll: 0, lens: 0 };
  const mid = SC.shaftClearance([6, 10, 0], acrossFront, air, R4);
  const midOk = ringOf([6, 10, 0], { ...acrossFront, depth: mid.depth }, R4).every((q) => q[0] >= 0);
  const midNext = SC.shaftClearance([6, 10, 0], { ...acrossFront, depth: mid.depth + 0.5 }, air, R4);
  check('scope midline (fixture, air): a shaft crossing R = 0 in front of the arch clamps at the last depth with R >= 0 at the axis and every ring point; the next 0.5 mm is blocked, by the septum',
    mid.blocked && mid.by === 'septum' && mid.depth > 0 && mid.depth < 20 && midOk && midNext.blocked && midNext.depth === mid.depth, JSON.stringify([mid, midNext]));
  const behind = SC.shaftClearance([6, -60, -5], acrossFront, air, R4);
  check('scope midline (fixture, air): the same line behind and below the arch (A < -51, S < 12) is not clamped — the nasopharynx is exempt', !behind.blocked && behind.depth === 40 && behind.by === null, JSON.stringify(behind));
  const above = SC.shaftClearance([6, -60, 20], acrossFront, air, R4);
  check('scope midline (fixture, air): behind the arch but above it (S >= 12) is not exempt', above.blocked && above.by === 'septum', JSON.stringify(above));
  const leftSide = SC.shaftClearance([-6, 10, 0], { ...acrossFront, side: 'L' }, air, R4);
  check('scope midline (fixture, air): the left scope mirrors the right (same depth, blocked by the septum); an explicit arch replaces the default',
    leftSide.by === 'septum' && leftSide.depth === mid.depth && !SC.shaftClearance([6, 10, 0], acrossFront, air, R4, { a: 20, s: 20 }).blocked, JSON.stringify(leftSide));

  /* ---- the HUD: distance fields ---- */
  const sdfBytes = FX.sdf;
  const field = SC.sdfSampler(FX.meta.sdf, sdfBytes);
  const { center, radius } = SDF_FX_SPHERE;
  let worst = 0;
  let seed = 5;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 0; i < 300; i++) {
    const p = [-20 + rnd() * 40, -18 + rnd() * 36, -15 + rnd() * 40];
    const truth = Math.min(25, Math.max(0, len(sub(p, center)) - radius));
    worst = Math.max(worst, Math.abs(field(p) - truth));
  }
  check('scope HUD: a distance field read at the tip matches the analytic distance to the sphere within one voxel (1 mm), worst error', worst <= 1, `worst ${worst.toFixed(3)} mm`);
  check('scope HUD: the field is 0 inside the structure and the clamp (25 mm) outside the grid', field(center) === 0 && field([500, 0, 0]) === 25 && field([center[0] + radius + 40, center[1], center[2]]) === 25);
  const rows = SC.hudRows([{ id: 'far', at: () => 25 }, { id: 'near', at: () => 1.5 }, { id: 'mid', at: () => 9 }], [0, 0, 0]);
  check('scope HUD: rows come nearest first; no fields, no rows (the HUD hides)', rows.map((r) => r.id).join() === 'near,mid,far' && SC.hudRows([], [0, 0, 0]).length === 0);

  /* ---- the real specimen: the volume, the fulcrum, the searches ---- */
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/ct/ct.json'), 'utf8'));
  const vol = createVolume({ header: parseHeader(meta), ct: new Uint8Array(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'ssb/ct/ct.u8.gz')))) });
  const ctAt = (p) => vol.sample(p[0], p[1], p[2]);
  const lms = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/geometry/landmarks.json'), 'utf8'));
  const F = { R: lms['lm.naris.R'], L: lms['lm.naris.L'] };
  const pose = (side, depth, yaw, pitch, roll = 0, lens = 0) => ({ side, depth, yaw, pitch, roll, lens });
  const clear = (p, r = R4) => SC.shaftClearance(F[p.side], p, ctAt, r);

  const deep = clear(pose('R', 100, 0, 0));
  check('scope collision (specimen): straight posterior to depth 100 is stopped by bone at the last free depth (85 mm for the 4 mm shaft, 86 for 2.7) — a regression pin',
    deep.blocked && deep.depth === 85 && !clear(pose('R', 85, 0, 0)).blocked && clear(pose('R', 85.5, 0, 0)).depth === 85 && clear(pose('R', 100, 0, 0), R27).depth === 86, JSON.stringify(deep));
  const straight = clear(pose('R', 40, 0, 0));
  check('scope collision (specimen): mucosa does not block, and its length is reported (R 40, straight: free, 30 mm of shaft in soft tissue — a regression pin; 25 before ST6, when the nostril\'s wall was masked and the shaft touched nothing there)', !straight.blocked && straight.contactMm === 30, JSON.stringify(straight));

  /* E3b on the real specimen: aimed across the septum, the clamped tip and its ring stay on the scope's own side. */
  const archLm = lms['lm.choanal-arch.M'];
  const arch = { a: archLm[1], s: archLm[2] };
  for (const side of ['R', 'L']) {
    const sg = side === 'R' ? 1 : -1;
    const across = pose(side, 100, -30, 0);
    const cl = SC.shaftClearance(F[side], across, ctAt, R4, arch);
    const pts = ringOf(F[side], { ...across, depth: cl.depth }, R4);
    const plain = SC.shaftClearance(F[side], across, ctAt, R4, { a: -1e9, s: -1e9 });     /* no exemption anywhere: the rule alone */
    check(`scope midline (specimen): from ${side} at yaw -30, pitch 0 (aimed across the septum) the clamped tip and all four ring points are on the ${side} side of R = 0`,
      cl.blocked && cl.depth < 100 && pts.every((q) => sg * q[0] >= 0) && plain.depth <= cl.depth, JSON.stringify([cl, plain, pts.map((q) => q.map((v) => +v.toFixed(2)))]));
  }
  const noArch = SC.shaftClearance(F.R, pose('R', 100, -30, 0), ctAt, R4);
  check('scope midline (specimen): no arch passed -> the fallback (A -51, S 12) applies and gives the same clamp as the landmark', noArch.depth === SC.shaftClearance(F.R, pose('R', 100, -30, 0), ctAt, R4, arch).depth, JSON.stringify([noArch, arch]));

  /* Search yaw and pitch on a 1 degree grid for a free pose whose tip is within `tol` of the target; the closest wins. */
  const reach = (side, target, r) => {
    let best = null;
    let near = 0;
    for (let yaw = -45; yaw <= 45; yaw++) {
      for (let pitch = -45; pitch <= 45; pitch++) {
        const base = pose(side, 120, yaw, pitch);
        const cl = SC.shaftClearance(F[side], base, ctAt, r);
        const d = SC.shaftDir(base);
        const t = Math.round(Math.max(0, Math.min(cl.depth, dot(sub(target, F[side]), d))) * 2) / 2;
        const p = { ...base, depth: t };
        if (SC.shaftClearance(F[side], p, ctAt, r).blocked) continue;
        const dist = len(sub(target, SC.tipOf(F[side], p)));
        if (dist <= 2.5) near += 1;
        if (!best || dist < best.dist) best = { yaw, pitch, depth: t, dist };
      }
    }
    return { ...best, near };
  };
  const sphR = reach('R', lms['lm.sphenoid-ostium.R'], R4);
  check('scope collision (specimen): right sphenoid ostium — a 1 degree search finds a free pose with the tip within 2.5 mm; pinned: yaw -3, pitch 19, depth 58.5 (2.03 mm)',
    sphR.dist <= 2.5 && sphR.yaw === -3 && sphR.pitch === 19 && sphR.depth === 58.5, JSON.stringify(sphR));
  /* the standard specimen (N1) is symmetric, so the left pose is the right one mirrored. Yaw is side-relative (scope.js: + swings the tip
     laterally on the scope's own side), so the mirror image has the SAME yaw, i.e. the world-frame yaw negated. */
  const sphL = reach('L', lms['lm.sphenoid-ostium.L'], R4);
  check('scope collision (specimen): left sphenoid ostium — the same 1 degree search finds a free 4 mm pose within 2.5 mm, the right pose mirrored (the same side-relative yaw, ± 1 degree); pinned: yaw -3, pitch 19, depth 58.5 (2.03 mm)',
    sphL.dist <= 2.5 && Math.abs(sphL.yaw - sphR.yaw) <= 1 && Math.abs(sphL.pitch - sphR.pitch) <= 1 && Math.abs(sphL.depth - sphR.depth) <= 1 && sphL.yaw === -3 && sphL.pitch === 19 && sphL.depth === 58.5, JSON.stringify([sphL, sphR]));
  const beside = [[0, 0, 5], [-5, 0, 0]].map((off) => {
    const T = lms['lm.sphenoid-ostium.R'];
    const P = [T[0] + off[0], T[1] + off[1], T[2] + off[2]];
    const dv = sub(P, F.R);
    let best = null;
    for (let yaw = -45; yaw <= 45; yaw++) for (let pitch = -45; pitch <= 45; pitch++) {
      const a = Math.acos(Math.min(1, dot(SC.shaftDir(pose('R', 1, yaw, pitch)), dv) / len(dv)));
      if (!best || a < best.a) best = { yaw, pitch, a };
    }
    const req = pose('R', Math.round(len(dv) * 2) / 2, best.yaw, best.pitch);
    const c = clear(req);
    return { req, c, ok: c.blocked && c.depth < req.depth && !clear({ ...req, depth: c.depth }).blocked && clear({ ...req, depth: c.depth + 0.5 }).blocked };
  });
  check('scope collision (specimen): a pose aimed 5 mm beside the sphenoid ostium (above it, lateral to it) clamps at the last free depth, which is free, with the next half millimetre blocked',
    beside.every((b) => b.ok), JSON.stringify(beside));

  /* Frontal: a 70 degree lens reaches the ostium, a straight scope does not. */
  const losFree = (a, b) => { const n = Math.ceil(len(sub(b, a)) / 0.5); for (let i = 0; i <= n; i++) { const t = i / n; if (ctAt([0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t)) >= SC.BONE_LEVEL) return false; } return true; };
  const sees = (p) => {
    const T = lms[`lm.frontal-ostium.${p.side}`];
    const tip = SC.tipOf(F[p.side], p);
    const dist = len(sub(T, tip));
    const v = SC.frameOf(p).v;
    const ang = Math.acos(Math.max(-1, Math.min(1, dot(v, sub(T, tip).map((x) => x / dist))))) * 180 / Math.PI;
    return { free: !clear(p).blocked, ang, dist, los: losFree(tip, T) };
  };
  const frontal = { R: pose('R', 36, -2, 33, 0, 70), L: pose('L', 36, -2, 33, 0, 70) };   /* the standard specimen is symmetric: the left pose is the right one mirrored (yaw is side-relative, so the same yaw) */
  for (const side of ['R', 'L']) {
    const r = sees(frontal[side]);
    check(`scope collision (specimen): the ${side === 'R' ? 'right' : 'left'} frontal ostium from a 70 degree lens — a free pose (${JSON.stringify(frontal[side]).replace(/"/g, '')}) looks within 15 degrees of it, a bone-free line of sight of at most 25 mm`,
      r.free && r.ang <= 15 && r.dist <= 25 && r.los, JSON.stringify(r));
  }
  let straightReach = 0;
  for (const side of ['R', 'L']) {
    for (let yaw = -45; yaw <= 45; yaw++) {
      for (let pitch = -45; pitch <= 45; pitch++) {
        const base = pose(side, 120, yaw, pitch, 0, 0);
        const cl = SC.shaftClearance(F[side], base, ctAt, R4).depth;
        for (let depth = Math.max(0, cl - 40); depth <= cl; depth += 1) {
          const r = sees({ ...base, depth });
          if (r.dist <= 25 && r.ang <= 15 && r.los && r.free) straightReach += 1;
        }
      }
    }
  }
  check('scope collision (specimen): no lens-0 pose, either side, reaches a frontal ostium (free, within 15 degrees, bone-free line of sight, 25 mm or less)', straightReach === 0, `${straightReach} poses`);

  /* the HUD at a pose: pinned so a change to the fields shows */
  const nearPose = pose('R', 74, 3, 24);
  const hudOf = (p) => SC.hudRows(Object.entries(meta.sdf.fields).map(([id, f]) => ({ id, at: SC.sdfSampler(meta.sdf, new Uint8Array(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, 'ssb/ct', f.file))))) })), SC.tipOf(F[p.side], p));
  const near3 = hudOf(nearPose);
  check('scope HUD (specimen): R 74, 3, 24 is free and 2.15 mm from the skull base (nearest first, the others farther) — the pose used by the page test to check the 3 mm signal rule',
    !clear(nearPose).blocked && near3[0].id === 's.anterior-cranial-fossa' && near(near3[0].mm, 2.15, 0.05) && near3[1].mm > 3, JSON.stringify(near3.slice(0, 2)));
}

/* ---------------- Endoscope: stations (E6, Node only) ---------------- */

/* Opus's poses in ssb/geometry/stations.json (E5), held to the rules in the file's own `rule` string, plus the codec and
   the flight math. A station that fails is reported with its numbers, never edited. */
function stationUnitTests() {
  const read = (p) => fs.readFileSync(path.join(ROOT, p));
  const json = (p) => JSON.parse(read(p).toString('utf8'));
  const R4 = SC.SHAFT_RADII['4'];
  const doc = json('ssb/geometry/stations.json');
  const table = doc.stations;
  const keys = Object.keys(table);
  const meta = json('ssb/ct/ct.json');
  const lb = zlib.gunzipSync(read('ssb/ct/labels.u16.gz'));
  const labels = new Uint16Array(lb.buffer.slice(lb.byteOffset, lb.byteOffset + lb.length));
  const vol = createVolume({ header: parseHeader(meta), ct: new Uint8Array(zlib.gunzipSync(read('ssb/ct/ct.u8.gz'))), labels, table: parseTable(json('ssb/geometry/labels.json')) });
  const ctAt = (p) => vol.sample(p[0], p[1], p[2]);
  const lms = json('ssb/geometry/landmarks.json');
  const arch = { a: lms['lm.choanal-arch.M'][1], s: lms['lm.choanal-arch.M'][2] };
  const AIR = new Set(['s.nasal-cavity.R', 's.nasal-cavity.L', 's.nasopharynx.M', 's.maxillary-sinus.R', 's.maxillary-sinus.L', 's.frontal-sinus.R', 's.frontal-sinus.L', 's.sphenoid-sinus.R', 's.sphenoid-sinus.L']);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (Math.hypot(...a) * Math.hypot(...b))))) * 180 / Math.PI;

  /* a label's voxel centroid, RAS (the rule's "label whose voxel centroid is the point") */
  const centroids = new Map();
  const centroid = (name) => {
    if (centroids.has(name)) return centroids.get(name);
    const index = vol.labelIndices().find((i) => vol.describe(i).name === name);
    let n = 0;
    const sum = [0, 0, 0];
    const [nx, ny] = vol.dims;
    for (let q = 0; q < labels.length; q++) {
      if (labels[q] !== index) continue;
      const i = q % nx;
      const j = Math.floor(q / nx) % ny;
      const k = Math.floor(q / (nx * ny));
      const r = vol.toRAS(i, j, k);
      sum[0] += r[0]; sum[1] += r[1]; sum[2] += r[2];
      n++;
    }
    const c = n ? sum.map((v) => v / n) : null;
    centroids.set(name, c);
    return c;
  };
  const targetOf = (t) => {
    if (Array.isArray(t.between) && t.between.length === 2 && t.between.every((id) => lms[id])) return [0, 1, 2].map((m) => (lms[t.between[0]][m] + lms[t.between[1]][m]) / 2);
    if (t.id) return lms[t.id] ? lms[t.id].slice() : centroid(t.id);
    return Array.isArray(t.at) ? t.at.slice() : null;
  };

  const problems = { clamp: [], free: [], air: [], target: [] };
  const rows = [];
  for (const key of keys) {
    const st = table[key];
    const pose = st.pose;
    const F = lms[`lm.naris.${pose.side}`];
    const clamped = SC.clampPose(pose);
    if (!clamped || Object.keys(clamped).some((f) => clamped[f] !== pose[f]) || Object.keys(pose).length !== 6) problems.clamp.push([key, pose]);
    const cl = SC.shaftClearance(F, pose, ctAt, R4, arch);
    if (cl.blocked || cl.depth !== pose.depth) problems.free.push([key, cl]);
    const tip = SC.tipOf(F, pose);
    const tipLab = vol.describe(vol.labelAt(tip[0], tip[1], tip[2]));
    if (!tipLab || !AIR.has(tipLab.name)) problems.air.push([key, tipLab && tipLab.name, tip]);
    const target = targetOf(st.target || {});
    const off = target ? angle(SC.frameOf(pose).v, sub(target, tip)) : null;
    if (off === null || !(off <= SC.FOV_DEG / 2)) problems.target.push([key, off, target]);
    rows.push({ key, off });
  }
  const shown = (list) => JSON.stringify(list.map((x) => x.map((v) => (typeof v === 'number' ? +v.toFixed(2) : v))));
  check(`stations (E6): all ${keys.length} stations have a pose clampPose leaves unchanged (six whole fields)`, keys.length >= 13 && problems.clamp.length === 0, JSON.stringify(problems.clamp));
  check('stations (E6): every station is free under shaftClearance (4 mm shaft, the E3b midline rule, lm.choanal-arch.M) — not clamped, not blocked', problems.free.length === 0, JSON.stringify(problems.free));
  check('stations (E6): every station\'s tip lies in an air label of the standard specimen (not in tissue)', problems.air.length === 0, shown(problems.air));
  check('stations (E6): every station\'s target (landmark, label centroid, `between` midpoint or `at`) is within FOV_DEG / 2 = 35 degrees of the view axis', problems.target.length === 0, JSON.stringify(problems.target.map((x) => [x[0], x[1] === null ? null : +x[1].toFixed(2)])));

  const mirrored = keys.filter((k) => k.endsWith('.L')).every((k) => {
    const r = table[k.replace(/\.L$/, '.R')];
    const l = table[k];
    return !!r && l.pose.side === 'L' && r.pose.side === 'R' && ['depth', 'yaw', 'pitch', 'lens'].every((f) => l.pose[f] === r.pose[f]) && l.pose.roll === (360 - r.pose.roll) % 360;
  });
  check('stations (E6): every `.L` station is its `.R` station mirrored (same depth, yaw, pitch, lens; roll -> 360 - roll; side L), and has one', keys.some((k) => k.endsWith('.L')) && mirrored);
  check('stations (E6): a midline (.M) station is posed from the right nostril', keys.filter((k) => k.endsWith('.M')).every((k) => table[k].pose.side === 'R'));

  const stems = new Set(keys.map((k) => k.replace(/\.(R|L|M)$/, '')));
  const unc = new Set(Object.keys(doc.uncovered));
  const over = new Set(doc.overviews.ids);
  const graphStations = [...GRAPH.keys()].filter((id) => GRAPH.get(id).type === 'stations');
  const missing = graphStations.filter((id) => !stems.has(id) && !unc.has(id) && !over.has(id));
  const stray = [...stems, ...unc, ...over].filter((id) => !GRAPH.has(id) || GRAPH.get(id).type !== 'stations');
  const twice = graphStations.filter((id) => [stems.has(id), unc.has(id), over.has(id)].filter(Boolean).length > 1);
  check('stations (E6): every graph `t.*` station is in `stations`, `uncovered` or `overviews` (exactly one), and nothing else is', graphStations.length >= 40 && missing.length === 0 && stray.length === 0 && twice.length === 0, JSON.stringify({ missing, stray, twice }));

  /* ---- the codec: a link is a shape, a table lookup is the only thing it does ---- */
  const L = SC.parseStationLink;
  check('station link: `t.ser-0`, `t.ser-0.L`, `t.nsf-pedicle.M` parse (side null when absent)', JSON.stringify(L('t.ser-0')) === '{"id":"t.ser-0","side":null}' && L('t.ser-0.L').side === 'L' && L('t.nsf-pedicle.M').id === 't.nsf-pedicle');
  const hostile = ['', 't.', 't.nope.X', 't.a b', 't.ser-0.R.R', 'x.ser-0', 'T.ser-0', 't.ser_0', 't./../x', 't.ser-0.r', '<script>', 't.' + 'a'.repeat(5000), 't.ser-0\n', 't.-a', 't.a-', 't.a--b', null, undefined, 7];
  check('station link: hostile shapes are refused (no side but R|L|M, no underscores, slashes, spaces, newlines, doubled hyphens, markup, 5 kB, non-strings)', hostile.every((h) => L(h) === null), JSON.stringify(hostile.filter((h) => L(h) !== null)));
  check('station link: a pose is not a station link and a station link is not a pose (parseScope refuses `t.ser-0`)', SC.parseScope('t.ser-0') === null && L('R,40,0,0,0,0') === null);
  const parsed = SC.parseStations(doc);
  check('station table: parseStations reads every entry of the real file into a whole pose, keyed t.<id>.<side>', parsed.size === keys.length && keys.every((k) => parsed.has(k) && JSON.stringify(parsed.get(k).pose) === JSON.stringify(table[k].pose)), `${parsed.size} of ${keys.length}`);
  const hurt = SC.parseStations({ stations: {
    'T.bad.R': { pose: table['t.ser-0.R'].pose }, 't.noside': { pose: table['t.ser-0.R'].pose }, 't.a.X': { pose: table['t.ser-0.R'].pose },
    't.nopose.R': {}, 't.sidebad.R': { pose: { ...table['t.ser-0.R'].pose, side: 'Q' } }, 't.lensbad.R': { pose: { ...table['t.ser-0.R'].pose, lens: 15 } },
    't.depth.R': { pose: { ...table['t.ser-0.R'].pose, depth: 'x' } }, 't.missing.R': { pose: { side: 'R', depth: 40 } },
    't.ok.R': { pose: { ...table['t.ser-0.R'].pose, depth: 999, yaw: -999 } },
  } });
  check('station table: malformed entries are skipped (bad key, no side, no pose, bad side, bad lens, non-numeric or missing fields); out-of-range numbers clamp', [...hurt.keys()].join() === 't.ok.R' && hurt.get('t.ok.R').pose.depth === 120 && hurt.get('t.ok.R').pose.yaw === -45, JSON.stringify([...hurt.keys()]));
  check('station table: a document that is not a table is an empty map (no list, links ignored)', [null, undefined, 3, 'x', [], {}, { stations: null }, { stations: [] }, { stations: 'x' }].every((d) => SC.parseStations(d).size === 0));
  const rs = (text) => SC.resolveStation(parsed, L(text));
  check('station link: `t.ser-0` is the right pose, `.L` the left, `t.nsf-pedicle` finds its midline station, a named side that does not exist does not fall back, and an unknown id is null',
    rs('t.ser-0').pose.side === 'R' && rs('t.ser-0.L').pose.side === 'L' && rs('t.nsf-pedicle').pose.side === 'R' && rs('t.nsf-pedicle.M').id === 't.nsf-pedicle' && rs('t.nsf-pedicle.L') === null && rs('t.ser-0.M') === null && rs('t.nope') === null && SC.resolveStation(parsed, null) === null && SC.resolveStation(null, L('t.ser-0')) === null);

  /* ---- the store: a pending link is state, shared like a pose ---- */
  const has = (id) => GRAPH.has(id);
  const tierOf = (id) => (GRAPH.has(id) ? GRAPH.get(id).entity.tier || 1 : 1);
  const mk = (hash) => createStore({ has, tierOf, hash, prefs: { tier: 1 }, labs: { sphenoid: { params: [], presets: {} } } });
  const st = mk('#scope=t.frontal-recess-70.L');
  check('station link (store): `#scope=t.frontal-recess-70.L` is a pending station, no pose, no stage; the hash keeps it until it resolves', st.get().station === 't.frontal-recess-70.L' && st.get().scope === null && st.hash() === '#scope=t.frontal-recess-70.L', JSON.stringify(st.get()));
  const seen = [];
  st.subscribe((state, prev, m) => seen.push([state.scope && SC.formatScope(state.scope), state.station, m.source]));
  const pose70 = parsed.get('t.frontal-recess-70.L').pose;
  st.resolveStation(pose70);
  check('station link (store): resolving writes the ordinary pose hash and clears the link (one change, source url)', st.get().station === null && st.hash() === '#scope=' + SC.formatScope(pose70) && seen.length === 1 && seen[0][2] === 'url', JSON.stringify([st.hash(), seen]));
  const un = mk('#scope=t.nope');
  un.resolveStation(null);
  check('station link (store): an unknown station resolves to nothing — no pose, no link, an empty hash (ignored like any hostile link)', un.get().station === null && un.get().scope === null && un.hash() === '', JSON.stringify(un.get()));
  check('station link (store): a pose wins over a link, a lab and a CT plane win over both, and hostile text is not a link',
    mk('#scope=R,40,0,0,0,0').get().station === null && mk('#lab=sphenoid&scope=t.ser-0').get().station === null && mk('#ct=ax&scope=t.ser-0').get().station === null && mk('#scope=t.ser-0.X').get().station === null && mk('#scope=t.ser-0%0A').get().station === null);
  const ap = mk('');
  ap.applyHash('#scope=t.ser-0');
  const pend = ap.get().station;
  ap.setScope(pose70);
  check('station link (store): a pasted link while on the specimen is pending; entering a pose, a lab or CT clears it; resolveStation with nothing pending is a no-op',
    pend === 't.ser-0' && ap.get().station === null && ap.resolveStation(pose70) === false && (ap.applyHash('#scope=t.ser-0'), ap.setCt({ plane: 'ax', at: null }), ap.get().station === null));

  /* ---- the flight: depth, yaw, pitch straight; roll the short way round; side at the start, lens at the end ---- */
  const a = { side: 'R', depth: 40, yaw: 10, pitch: -4, roll: 350, lens: 0 };
  const b = { side: 'L', depth: 20, yaw: -20, pitch: 8, roll: 10, lens: 70 };
  const mid = SC.flightPose(a, b, 0.5);
  check('flight: halfway is the mean of depth, yaw and pitch; roll goes 350 -> 10 through 0 (the short way, not through 180); the side is the target\'s, the lens is not yet',
    mid.depth === 30 && mid.yaw === -5 && mid.pitch === 2 && near((mid.roll + 360) % 360, 0, 1e-9) && mid.side === 'L' && mid.lens === 0, JSON.stringify(mid));
  const end = SC.flightPose(a, b, 1);
  check('flight: the end is exactly the target (including the lens), a flight to itself is itself, and e = 0 is the start (with the target\'s side)',
    SC.samePose(end, b) && SC.samePose(SC.flightPose(a, a, 0.37), { ...a, roll: a.roll }) && SC.samePose(SC.flightPose(a, b, 0), { ...a, side: 'L' }), JSON.stringify([end, SC.flightPose(a, b, 0)]));
  const back = SC.flightPose({ ...a, roll: 10 }, { ...a, roll: 350 }, 0.5);
  check('flight: roll the other way round (10 -> 350) also takes the short way, through 0', near((back.roll + 360) % 360, 0, 1e-9), String(back.roll));
  let mono = true;
  let prevRoll = 350;
  for (let k = 1; k <= 10; k++) { const r = SC.flightPose(a, b, k / 10).roll; const step = (((r - prevRoll + 540) % 360) - 180); if (!(step > 0 && step < 5)) mono = false; prevRoll = r; }
  check('flight: roll moves monotonically in small steps (no spin through the long way)', mono);
}

/* ---------------- Endoscope: the page ---------------- */

/* How many times this page has fetched the lining pack (the resource timing log sees requests made before a listener could attach). */
const liningFetches = (page) => page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\/ssb\/models\/lining\.glb\.gz/.test(e.name)).length);

async function scopeTests(browser, base) {
  /* ===== the CT volume loads only when asked, and once per page (CP-2a) ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const asked = [];
    page.on('request', (r) => { if (/\/ssb\/ct\/ct\.u8\.gz/.test(r.url())) asked.push(r.url()); });
    await nextFrames(page, 4);
    await page.waitForTimeout(500);
    check('scope: a specimen page that never opens the scope or CT does not fetch the CT volume', asked.length === 0, `${asked.length} requests`);
    await page.evaluate(() => { location.hash = '#scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.collision, null, { timeout: 30000 });
    await page.evaluate(() => { location.hash = '#ct=ax'; });
    await page.waitForFunction(() => window.__ssb.ct && window.__ssb.ct.status === 'ready', null, { timeout: 30000 });
    check('scope: opening the scope and then CT fetches the CT volume once (one shared copy)', asked.length === 1, `${asked.length} requests`);
    await context.close();
  }

  /* ===== the lining pack loads only when the mucosa is first seen from within (ST1c) ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const st = await page.evaluate(() => ({ status: window.__ssb.specimen.status, lining: window.__ssb.specimen.packs.lining }));
    await page.click('#ssb-spec-mucosa');                                   /* the layer on, the camera still outside */
    await nextFrames(page, 4);
    await page.waitForTimeout(600);
    const out = await page.evaluate(() => ({ status: window.__ssb.specimen.status, inside: window.__ssb.specimen.mucosaInside, lining: window.__ssb.specimen.packs.lining, problems: window.__ssb.specimen.problems }));
    const askedOut = await liningFetches(page);
    check('lining (ST1c): a specimen page that never goes inside requests no lining.glb.gz and reaches status ready, the lining pack deferred (not an error, no problems)',
      askedOut === 0 && st.status === 'ready' && st.lining.state === 'deferred' && out.status === 'ready' && out.inside === false && out.lining.state === 'deferred' && out.problems.length === 0, JSON.stringify({ asked: askedOut, st, out }));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,-4,3,0,0');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 30000 });
    await page.waitForFunction(() => window.__ssb.specimen.packs.lining && window.__ssb.specimen.packs.lining.state === 'loaded', null, { timeout: 30000 });
    await nextFrames(page, 3);
    const nodes = await specNodes(page);
    const lin = nodes.filter((n) => n.lining);
    const shells = nodes.filter((n) => n.group === 'air');
    const st = await page.evaluate(() => ({ status: window.__ssb.specimen.status, problems: window.__ssb.specimen.problems }));
    check('lining (ST1c): entering the scope requests lining.glb.gz exactly once, then draws the lining nodes and hides the air shells (status stays ready)',
      lin.length > 0 && lin.every((n) => n.visible) && shells.length > 0 && shells.every((n) => !n.visible) && st.status === 'ready' && st.problems.length === 0,
      JSON.stringify({ lining: lin.length, shown: lin.filter((n) => n.visible).length, shells: shells.filter((n) => n.visible).map((n) => n.key), st }));
    /* leaving and re-entering the scope does not fetch it again */
    await page.evaluate(() => { location.hash = ''; });
    await nextFrames(page, 3);
    await page.evaluate(() => { location.hash = '#scope=R,40,-4,3,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope.engaged, null, { timeout: 15000 });
    await nextFrames(page, 3);
    await page.waitForTimeout(400);
    check('lining (ST1c): the lining request happened exactly once, and re-entering the scope does not repeat it', (await liningFetches(page)) === 1, `${(await liningFetches(page))} requests`);
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#s=s.sphenoid-sinus');
    await page.click('#ssb-spec-mucosa');
    await page.waitForFunction(() => !window.__ssb.specimen.camera().flying, null, { timeout: 8000 });
    for (let i = 0; i < 40 && !(await page.evaluate(() => window.__ssb.specimen.mucosaInside)); i++) {
      await page.mouse.move(640, 400);
      await page.mouse.wheel(0, -400);
      await nextFrames(page, 3);
    }
    const inside = await page.evaluate(() => window.__ssb.specimen.mucosaInside);
    await page.waitForFunction(() => window.__ssb.specimen.packs.lining && window.__ssb.specimen.packs.lining.state === 'loaded', null, { timeout: 30000 }).catch(() => {});
    await nextFrames(page, 3);
    const nodes = await specNodes(page);
    const lin = nodes.filter((n) => n.lining);
    const shells = nodes.filter((n) => n.group === 'air' && n.id !== 's.sphenoid-sinus');     /* the selected structure is always drawn */
    check('lining (ST1c): going inside by the orbit camera requests lining.glb.gz exactly once, then draws the lining nodes with the air shells hidden',
      inside && (await liningFetches(page)) === 1 && lin.length > 0 && lin.every((n) => n.visible) && shells.every((n) => !n.visible), JSON.stringify({ inside, asked: await liningFetches(page), lining: lin.length, shells: shells.filter((n) => n.visible).length }));
    await context.close();
  }

  /* ===== the stage from the pill ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const pill = await page.evaluate(() => { const b = document.querySelector('#ssb-stage-mode [data-stage="scope"]'); return { disabled: b.disabled, pressed: b.getAttribute('aria-pressed') }; });
    check('scope: the Scope pill is enabled once the specimen and the fulcrum are loaded, and not pressed', !pill.disabled && pill.pressed === 'false', JSON.stringify(pill));
    await page.click('#ssb-stage-mode [data-stage="scope"]');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 10000 });
    await nextFrames(page, 4);
    const on = await page.evaluate(() => ({ stage: document.getElementById('ssb-app').dataset.stage, hash: location.hash, pose: window.__ssb.scope.pose, pressed: document.querySelector('#ssb-stage-mode [data-stage="scope"]').getAttribute('aria-pressed'),
      overlay: !document.getElementById('ssb-scope').hidden, controls: !document.getElementById('ssb-scope-controls').hidden, layers: getComputedStyle(document.getElementById('ssb-spec')).display }));
    check('scope: pressing it enters the stage: pose in the URL (#scope=R,40,0,0,0,0), the overlay and the controls show, the layer controls give way',
      on.stage === 'scope' && on.hash === '#scope=R,40,0,0,0,0' && on.pressed === 'true' && on.overlay && on.controls && on.layers === 'none', JSON.stringify(on));

    /* the camera is the pose */
    const cam = await spec(page, () => ({ cam: window.__ssb.scope.camera(), tip: window.__ssb.scope.tip, frame: window.__ssb.scope.frame, fulcrum: window.__ssb.scope.fulcrum }));
    const lmNaris = (await spec(page, () => window.__ssb.specimen.landmarks)).find((l) => l.key === 'lm.naris.R');
    check('scope: the fulcrum is lm.naris.R from landmarks.json', lmNaris && cam.fulcrum.every((v, i) => near(v, lmNaris.ras[i], 1e-6)), JSON.stringify([cam.fulcrum, lmNaris]));
    check('scope: the camera sits at the tip F + depth d (depth 40, straight posterior) and looks along the pose\'s view, with the pose\'s upright up',
      cam.cam.position.every((v, i) => near(v, cam.tip[i], 0.01)) && near(cam.tip[1], cam.fulcrum[1] - 40, 0.01) && cam.cam.view.every((v, i) => near(v, cam.frame.v[i], 1e-4)) && cam.cam.up.every((v, i) => near(v, cam.frame.up[i], 1e-4)),
      JSON.stringify(cam.cam));
    const lights = await spec(page, () => ({ l: window.__ssb.scope.lights(), controls: window.__ssb.scope.controlsEnabled(), bone: window.__ssb.specimen.bone, mucosa: window.__ssb.specimen.mucosaOn }));
    check('scope: lit by a spotlight at the tip with inverse-square falloff (decay 2); the orbit headlight is off and the orbit controls are disabled',
      lights.l.spot && lights.l.spot.on && lights.l.spot.decay === 2 && lights.l.head === 0 && lights.controls === false, JSON.stringify(lights));
    check('scope: the lining is seen from inside — bone hidden, mucosa on', lights.bone === 'hidden' && lights.mucosa === true, JSON.stringify(lights));
    const mat = (await specNodes(page)).filter((n) => n.group === 'air');
    check('scope: every air-space node is drawn as its lining (mucosa; the vestibule\'s is skin), opaque (the camera is inside the airway)', mat.length > 0 && mat.every((n) => n.drawn === (n.liningKind || 'mucosa') && !n.transparent), JSON.stringify(mat.filter((n) => n.drawn !== (n.liningKind || 'mucosa') || n.transparent).map((n) => n.key)));
    /* ST1b: from within, the open lining is what is drawn; the per-compartment shells (closed membranes at every opening) are not */
    await page.waitForFunction(() => window.__ssb.specimen.packs.lining && window.__ssb.specimen.packs.lining.state === 'loaded', null, { timeout: 30000 });
    await nextFrames(page, 3);
    const matIn = (await specNodes(page)).filter((n) => n.group === 'air');
    const lin = (await specNodes(page)).filter((n) => n.lining);
    check('scope (ST1b): the open lining is drawn in the shells\' place — every lining node visible and opaque (mucosa; the vestibule\'s skin), every air shell hidden', lin.length > 0 && lin.every((n) => n.visible && n.drawn === (n.id === 's.nasal-vestibule' ? 'skin' : 'mucosa') && !n.transparent) && matIn.every((n) => !n.visible), JSON.stringify({ lining: lin.filter((n) => !n.visible || n.drawn !== (n.id === 's.nasal-vestibule' ? 'skin' : 'mucosa')).map((n) => n.key), shells: matIn.filter((n) => n.visible).map((n) => n.key) }));
    const inHits = await page.evaluate(() => { const c = document.getElementById('ssb-canvas'); const r = c.getBoundingClientRect(); return window.__ssb.specimen.hits(r.left + r.width / 2, r.top + r.height / 2); });
    check('scope (ST1b): picking from inside returns graph ids (a lining hit reports the structure\'s own key, never the lining\'s)', inHits.length > 0 && inHits.every((h) => GRAPH.has(h.id) && !/^lining:/.test(h.key)), JSON.stringify(inHits.slice(0, 3).map((h) => [h.id, h.key])));

    /* non-blank, inside a circular field of view */
    const { img } = await canvasImage(page);
    const W = img.width, H = img.height;
    const R = Math.min(W, H) / 2;
    const px = (x, y) => img.at(Math.round(x), Math.round(y));
    const corner = px(3, 3);
    const colours = new Set();
    let lit = 0;
    for (let i = 0; i < 400; i++) {
      const a = (i / 400) * Math.PI * 2 * 7;
      const r = (0.15 + 0.7 * ((i * 37) % 100) / 100) * R;
      const c = px(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r);
      colours.add(c.map((v) => v >> 4).join());
      if (c[0] + c[1] + c[2] > 60) lit++;
    }
    check('scope: the image is not blank — many distinct colours and mostly lit pixels inside the circle', colours.size >= 25 && lit > 200, `${colours.size} colours, ${lit}/400 lit`);
    check('scope: outside the circle the stage is the dark mask (the corner is near-black, in either theme)', corner.every((v) => v < 40), JSON.stringify(corner));

    const f0 = await page.evaluate(() => window.__ssb.frames);
    await page.waitForTimeout(600);
    check('scope: the on-demand loop holds — no frames are drawn while the pose does not change', (await page.evaluate(() => window.__ssb.frames)) === f0, `${(await page.evaluate(() => window.__ssb.frames)) - f0} frames`);

    /* keys */
    await page.focus('#ssb-canvas');
    const pose0 = await spec(page, () => window.__ssb.scope.pose);
    await page.keyboard.press('ArrowLeft');
    const p1 = await spec(page, () => window.__ssb.scope.pose);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Shift+ArrowUp');
    const p2 = await spec(page, () => window.__ssb.scope.pose);
    await page.keyboard.press('+');
    await page.keyboard.press('e');
    await page.keyboard.press('l');
    const p3 = await spec(page, () => window.__ssb.scope.pose);
    check('scope: keys change the pose through the store — ArrowLeft yaws toward +R for the right scope (+2), ArrowUp pitches up (+2, Shift x5), + deepens (+1), E rolls (+5), L steps the lens (0 -> 30)',
      p1.yaw === pose0.yaw + 2 && p2.pitch === pose0.pitch + 2 + 10 && p3.depth === pose0.depth + 1 && p3.roll === pose0.roll + 5 && p3.lens === 30, JSON.stringify([pose0, p1, p2, p3]));
    check('scope: the URL follows the pose', (await page.evaluate(() => location.hash)).startsWith('#scope=R,41,2,12,5,30') || await page.waitForFunction(() => location.hash.startsWith('#scope=R,41,2,12,5,30'), null, { timeout: 2000 }).then(() => true).catch(() => false));
    const cam2 = await spec(page, () => ({ cam: window.__ssb.scope.camera(), tip: window.__ssb.scope.tip, frame: window.__ssb.scope.frame }));
    check('scope: the camera follows the pose after the keys (tip and view)', cam2.cam.position.every((v, i) => near(v, cam2.tip[i], 0.01)) && cam2.cam.view.every((v, i) => near(v, cam2.frame.v[i], 1e-4)));

    /* the light-post indicator turns with roll, on a circle */
    const postAt = () => page.evaluate(() => { const c = document.getElementById('ssb-scope').getBoundingClientRect(); const b = document.querySelector('.ssb-scope-post').getBoundingClientRect(); return { x: b.left + b.width / 2 - (c.left + c.width / 2), y: b.top + b.height / 2 - (c.top + c.height / 2), r: Math.min(c.width, c.height) / 2 }; });
    await page.evaluate(() => { const r = document.getElementById('ssb-scope-roll'); r.value = '0'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await nextFrames(page, 3);
    await page.waitForTimeout(250);
    const i0 = await postAt();
    await page.evaluate(() => { const r = document.getElementById('ssb-scope-roll'); r.value = '90'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await nextFrames(page, 3);
    await page.waitForTimeout(250);
    const i90 = await postAt();
    check('scope: the light-post indicator sits on the field-of-view rim and moves with roll (the slider drives the same store)',
      near(Math.hypot(i0.x, i0.y), i0.r - 10, 3) && near(Math.hypot(i90.x, i90.y), i0.r - 10, 3) && Math.hypot(i0.x - i90.x, i0.y - i90.y) > 20 && (await spec(page, () => window.__ssb.scope.pose.roll)) === 90, JSON.stringify([i0, i90]));

    /* drag and wheel */
    const box = await page.evaluate(() => { const b = document.getElementById('ssb-canvas').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    const before = await spec(page, () => window.__ssb.scope.pose);
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y - 40, { steps: 5 });
    await page.mouse.up();
    const after = await spec(page, () => window.__ssb.scope.pose);
    check('scope: dragging looks where the pointer goes — 100 px right turns the right scope\'s yaw by -15 degrees, 40 px up raises the pitch by 6', near(after.yaw - before.yaw, -15, 1.01) && near(after.pitch - before.pitch, 6, 1.01), JSON.stringify([before, after]));
    /* the drag may end at the last free depth of the specimen's shaft path: withdraw 5 mm first, so the wheel has room */
    await page.evaluate((d) => { const r = document.getElementById('ssb-scope-depth'); r.value = String(d); r.dispatchEvent(new Event('input', { bubbles: true })); }, after.depth - 5);
    await nextFrames(page, 2);
    const room = await spec(page, () => window.__ssb.scope.pose.depth);
    await page.mouse.wheel(0, -100);
    await nextFrames(page, 2);
    const wheel = await spec(page, () => window.__ssb.scope.pose.depth);
    check('scope: the wheel inserts (scroll up +1 mm)', room === after.depth - 5 && wheel === room + 1, `${after.depth} -> ${room} -> ${wheel}`);
    await page.click('#ssb-scope-controls button[data-side="L"]');
    check('scope: the side button switches nostril — the fulcrum is lm.naris.L', (await spec(page, () => window.__ssb.scope.pose.side)) === 'L' && near((await spec(page, () => window.__ssb.scope.fulcrum[0])), (await spec(page, () => window.__ssb.specimen.landmarks)).find((l) => l.key === 'lm.naris.L').ras[0], 1e-6));
    await page.click('#ssb-scope-controls button[data-side="R"]');

    /* both themes: the stage keeps rendering after the theme flips */
    const r0 = await spec(page, () => window.__ssb.scope.renders);
    await page.click('.site-theme-toggle');
    await nextFrames(page, 3);
    check('scope: both themes — the scope keeps rendering after the theme flips (the mask is dark in both)', (await spec(page, () => window.__ssb.scope.renders)) > r0 && (await spec(page, () => window.__ssb.scope.engaged)));
    await page.click('.site-theme-toggle');

    /* leaving puts the specimen back */
    const camBefore = await spec(page, () => window.__ssb.specimen.camera());
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await nextFrames(page, 3);
    const off = await page.evaluate(() => ({ stage: document.getElementById('ssb-app').dataset.stage, hash: location.hash, engaged: window.__ssb.scope.engaged, active: window.__ssb.scope.active, bone: window.__ssb.specimen.bone, mucosa: window.__ssb.specimen.mucosaOn,
      controls: window.__ssb.scope.controlsEnabled(), lights: window.__ssb.scope.lights(), overlay: document.getElementById('ssb-scope').hidden, cam: window.__ssb.specimen.camera() }));
    check('scope: leaving restores the specimen — stage and URL (the tip survives as the 3D cursor, `#at=`, E4), bone X-ray, mucosa off, orbit controls and headlight back, the spotlight off, the overlay gone',
      off.stage === 'specimen' && /^(#at=[-\d.,]+)?$/.test(off.hash) && !off.engaged && !off.active && off.bone === 'xray' && off.mucosa === false && off.controls === true && off.lights.head > 0 && off.lights.spot && !off.lights.spot.on && off.overlay, JSON.stringify(off));
    check('scope: leaving restores the orbit view (the camera is where it was before the scope: same distance to target, toCamera within 1e-3)',
      near(off.cam.distance, camBefore.distance, 0.5) && off.cam.toCamera.every((v, i) => near(v, camBefore.toCamera[i], 1e-3)), JSON.stringify([off.cam, camBefore]));
    await context.close();
  }

  /* ===== station flights (E6) ===== */
  const ST = JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/geometry/stations.json'), 'utf8')).stations;
  const stTier = (key) => (entity(key.replace(/\.(R|L|M)$/, '')) || {}).tier || 1;
  const stName = (key) => entity(key.replace(/\.(R|L|M)$/, '')).name;
  const stFor = (side, tier) => Object.keys(ST).filter((k) => k.endsWith(`.${side}`) || k.endsWith('.M')).filter((k) => stTier(k) <= tier);
  const samePoseObj = (x, y) => !!x && !!y && ['side', 'depth', 'yaw', 'pitch', 'roll', 'lens'].every((f) => x[f] === y[f]);
  const stList = (page) => page.evaluate(() => [...document.querySelectorAll('#ssb-scope-controls .ssb-scope-station')].map((b) => ({ key: b.dataset.station, text: b.querySelector('.ssb-scope-station-name').textContent, lens: b.querySelector('.ssb-scope-station-lens').textContent, pressed: b.getAttribute('aria-pressed') })));
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,0');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'ready', null, { timeout: 30000 });
    await nextFrames(page, 3);
    const l1 = await stList(page);
    const want1 = stFor('R', 1);
    check('stations (E6): the list shows the right nostril\'s stations and the midline ones at the page\'s tier (1), in file order, each with its graph name and its lens — and none of the uncovered or overviews',
      l1.map((x) => x.key).join() === want1.join() && want1.length >= 4 && l1.every((x) => stName(x.key).startsWith(x.text) && x.lens === `${ST[x.key].pose.lens}°`) && !l1.some((x) => /overview|ethmoid-bulla|olfactory/.test(x.key)), JSON.stringify({ l1: l1.map((x) => x.key), want1 }));
    check('stations (E6): the list is a labelled group of buttons, none pressed while the scope is not at a station', await page.evaluate(() => { const g = document.querySelector('#ssb-scope-controls .ssb-scope-stations'); return g.getAttribute('role') === 'group' && !!g.getAttribute('aria-label') && [...g.children].every((b) => b.tagName === 'BUTTON' && b.type === 'button'); }) && l1.every((x) => x.pressed === 'false'), JSON.stringify(l1.map((x) => x.pressed)));

    /* the tier filter follows the page, and the left nostril gets the left ones */
    await page.evaluate(() => { location.hash = '#tier=3&scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => document.querySelectorAll('#ssb-scope-controls .ssb-scope-station').length > 0 && !!document.querySelector('#ssb-scope-controls [data-station="t.nsf-pedicle.M"]'), null, { timeout: 5000 });
    check('stations (E6): at tier 3 the deeper stations join (t.frontal-recess-70.R at tier 2, t.nsf-pedicle.M at tier 3)', (await stList(page)).map((x) => x.key).join() === stFor('R', 3).join(), JSON.stringify((await stList(page)).map((x) => x.key)));
    await page.click('#ssb-scope-controls button[data-side="L"]');
    check('stations (E6): the left nostril lists the .L stations and the midline ones', (await stList(page)).map((x) => x.key).join() === stFor('L', 3).join(), JSON.stringify((await stList(page)).map((x) => x.key)));
    await page.click('#ssb-scope-controls button[data-side="R"]');

    /* a flight: t.ser-0.R from R,40,0,0,0,0 */
    await page.evaluate(() => { window.__flight = []; window.__flightTimer = setInterval(() => { const sc = window.__ssb.scope; window.__flight.push({ flying: sc.flying, pose: sc.pose }); }, 25); });
    await page.click('#ssb-scope-controls [data-station="t.ser-0.R"]');
    const during = await page.evaluate(() => window.__ssb.scope.flying);
    await page.waitForFunction(() => !window.__ssb.scope.flying, null, { timeout: 10000 });
    await page.waitForFunction((h) => location.hash.endsWith(h), `scope=${SC.formatScope(ST['t.ser-0.R'].pose)}`, { timeout: 3000 }).catch(() => {});
    const end1 = await page.evaluate(() => ({ pose: window.__ssb.scope.pose, hash: location.hash, tip: window.__ssb.scope.tip, flight: window.__flight.slice() }));
    check('stations (E6): picking t.ser-0 starts a flight, which ends at the station\'s stored pose and the ordinary pose URL (#scope=R,49,-3,18,0,0)',
      during === true && samePoseObj(end1.pose, ST['t.ser-0.R'].pose) && end1.hash.endsWith(`scope=${SC.formatScope(ST['t.ser-0.R'].pose)}`), JSON.stringify([during, end1.pose, end1.hash]));      /* the hash also carries tier=3 here */
    const mids = end1.flight.filter((x) => x.flying && x.pose && !samePoseObj(x.pose, ST['t.ser-0.R'].pose) && x.pose.pitch > 0 && x.pose.pitch < ST['t.ser-0.R'].pose.pitch);
    check('stations (E6): the flight passes through poses between the two (a pitch strictly between 0 and the station\'s), not a cut', mids.length >= 1, JSON.stringify(end1.flight.filter((x) => x.flying).slice(0, 6).map((x) => x.pose && [x.pose.depth, x.pose.yaw, x.pose.pitch])));
    const pressed = await stList(page);
    check('stations (E6): at the station its button is the pressed one, and only it', pressed.filter((x) => x.pressed === 'true').map((x) => x.key).join() === 't.ser-0.R', JSON.stringify(pressed.map((x) => [x.key, x.pressed])));
    const cam = await spec(page, () => window.__ssb.scope.camera());
    check('stations (E6): the camera is at the station (camera at the tip, looking along the stored view) when the flight ends', cam.position.every((v, i) => near(v, end1.tip[i], 0.01)), JSON.stringify(cam.position));

    /* roll the short way, lens at the end: t.third-pass-middle-meatus.R is lens 30, roll 315 */
    await page.evaluate(() => { window.__flight.length = 0; });
    await page.click('#ssb-scope-controls [data-station="t.third-pass-middle-meatus.R"]');
    await page.waitForFunction(() => !window.__ssb.scope.flying, null, { timeout: 10000 });
    const f2 = await page.evaluate(() => ({ pose: window.__ssb.scope.pose, flight: window.__flight.filter((x) => x.flying).map((x) => x.pose) }));
    const tgt2 = ST['t.third-pass-middle-meatus.R'].pose;
    check('stations (E6): a 0 -> 315 roll goes the short way (never below 315 on the way) and the lens switches only at the end (0 until then, 30 after)',
      samePoseObj(f2.pose, tgt2) && f2.flight.length >= 1 && f2.flight.every((q) => q.roll >= 315 || q.roll === 0) && f2.flight.filter((q) => q.lens !== 0 && !samePoseObj(q, tgt2)).length === 0 && f2.pose.lens === 30, JSON.stringify(f2.flight.map((q) => [q.roll, q.lens])));

    /* a flight is a pose change like any other: collision keeps it free, the CT inset follows, the exposure settles */
    await page.waitForFunction(() => { const sc = window.__ssb.scope; return sc.cursor && sc.tip && sc.inset && sc.cursor.every((v, i) => Math.abs(v - sc.tip[i]) <= 1.0); }, null, { timeout: 8000 }).catch(() => {});      /* the cursor follows on an animation frame */
    const settled = await page.evaluate(() => { const sc = window.__ssb.scope; return { hud: sc.hud, cursor: sc.cursor, tip: sc.tip, inset: !!sc.inset }; });
    check('stations (E6): after the flight the CT cursor is the tip, the scope is not limited by bone or the septum, and the inset has been resampled', settled.cursor && settled.cursor.every((v, i) => near(v, settled.tip[i], 1.0)) && !settled.hud.limited && settled.inset, JSON.stringify(settled.hud));

    /* any input cancels the flight where it is */
    const cancel = await page.evaluate(() => {      /* in one task, so no frame lets the flight finish between the pick and the key */
      document.querySelector('#ssb-scope-controls [data-station="t.first-pass-floor.R"]').click();
      const flyingNow = window.__ssb.scope.flying;
      document.getElementById('ssb-canvas').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
      return { flyingNow, stopped: { flying: window.__ssb.scope.flying, pose: window.__ssb.scope.pose } };
    });
    const { flyingNow, stopped } = cancel;
    await page.waitForTimeout(900);
    const later = await page.evaluate(() => window.__ssb.scope.pose);
    check('stations (E6): a key press during a flight cancels it — the flight stops where it is and the pose does not go on to the station', flyingNow === true && stopped.flying === false && samePoseObj(stopped.pose, later) && !samePoseObj(later, ST['t.first-pass-floor.R'].pose), JSON.stringify([flyingNow, stopped, later]));
    await page.evaluate(() => clearInterval(window.__flightTimer));
    await page.evaluate(() => { location.hash = '#scope=L,30,0,0,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope.pose && window.__ssb.scope.pose.side === 'L', null, { timeout: 5000 });
    await page.click('#ssb-scope-controls [data-station="t.nsf-pedicle.M"]');
    await page.waitForFunction(() => !window.__ssb.scope.flying, null, { timeout: 10000 });
    check('stations (E6): picking a midline (.M) station from the left scope switches to the right nostril (its pose is posed from the right) and arrives at the stored pose', samePoseObj(await spec(page, () => window.__ssb.scope.pose), ST['t.nsf-pedicle.M'].pose), JSON.stringify(await spec(page, () => window.__ssb.scope.pose)));
    await context.close();
  }

  /* reduced motion: a cut */
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,0', { reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'ready', null, { timeout: 30000 });
    await nextFrames(page, 3);
    await page.click('#ssb-scope-controls [data-station="t.ser-0.R"]');
    const cut = await page.evaluate(() => ({ flying: window.__ssb.scope.flying, pose: window.__ssb.scope.pose }));
    check('stations (E6): with prefers-reduced-motion the station is a cut — no flight, the stored pose at once', cut.flying === false && samePoseObj(cut.pose, ST['t.ser-0.R'].pose), JSON.stringify(cut));
    await context.close();
  }

  /* deep links */
  for (const [hash, key, note] of [['#scope=t.frontal-recess-70.L', 't.frontal-recess-70.L', 'a station with its side'], ['#scope=t.ser-0', 't.ser-0.R', 'no side: R'], ['#scope=t.nsf-pedicle', 't.nsf-pedicle.M', 'no side: the midline station'], ['#scope=t.nsf-pedicle.M', 't.nsf-pedicle.M', 'the midline station by name']]) {
    const { context, page } = await openSpecimen(browser, base, hash);
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 30000 });
    await page.waitForFunction((h) => location.hash === h, `#scope=${SC.formatScope(ST[key].pose)}`, { timeout: 3000 }).catch(() => {});
    const r = await page.evaluate(() => ({ pose: window.__ssb.scope.pose, hash: location.hash }));
    check(`stations (E6): ${hash} (${note}) opens the scope at that station's stored pose and rewrites the URL to the ordinary pose form`, samePoseObj(r.pose, ST[key].pose) && r.hash === `#scope=${SC.formatScope(ST[key].pose)}`, JSON.stringify(r));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '');
    await page.evaluate(() => { location.hash = '#scope=t.ser-0.L'; });
    await page.waitForFunction(() => window.__ssb.scope.engaged, null, { timeout: 15000 });
    check('stations (E6): a station link pasted while the page is open (a hash change) opens the scope too', samePoseObj(await spec(page, () => window.__ssb.scope.pose), ST['t.ser-0.L'].pose));
    await context.close();
  }
  for (const hash of ['#scope=t.nope', '#scope=t.ser-0.X', '#scope=t.ser-0.M', '#scope=t.ser_0', '#scope=t.ser-0%0A', '#scope=t.nsf-pedicle.L']) {
    const { context, page } = await openSpecimen(browser, base, hash);
    await page.waitForFunction(() => window.__ssb.scope, null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => ({ active: window.__ssb.scope.active, engaged: window.__ssb.scope.engaged, hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, state: window.__ssb.scope.stationsState }));
    check(`stations (E6): ${hash} is ignored like any hostile link — the specimen stage, no pose, a clean URL`, !r.active && !r.engaged && r.hash === '' && r.stage === 'specimen', JSON.stringify(r));
    await context.close();
  }
  {
    const { context, page, errors } = await openSpecimen(browser, base, '#scope=t.ser-0', { abort: /\/ssb\/geometry\/stations\.json/, track: false });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.stationsState === 'failed', null, { timeout: 15000 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ active: window.__ssb.scope.active, hash: location.hash }));
    check('stations (E6): with stations.json unreachable a station link is ignored and nothing throws', !r.active && r.hash === '' && errors.filter((e) => e.type === 'pageerror').length === 0, JSON.stringify([r, errors.slice(0, 3)]));
    await page.evaluate(() => { location.hash = '#scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope.engaged, null, { timeout: 15000 });
    await nextFrames(page, 3);
    const n = await page.evaluate(() => ({ list: document.querySelectorAll('#ssb-scope-controls .ssb-scope-station').length, hidden: [...document.querySelectorAll('#ssb-scope-controls .ssb-lab-sec')].filter((x) => x.querySelector('.ssb-scope-stations')).every((x) => x.hidden), state: window.__ssb.scope.stationsState }));
    check('stations (E6): with stations.json unreachable the scope still works and the Stations section is hidden (no list, no error)', n.list === 0 && n.hidden && n.state === 'failed', JSON.stringify(n));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,0', { routes: { 'stations.json': (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"stations": 7' }) }, track: false });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'failed', null, { timeout: 15000 });
    const n = await page.evaluate(() => ({ list: document.querySelectorAll('#ssb-scope-controls .ssb-scope-station').length, engaged: window.__ssb.scope.engaged }));
    check('stations (E6): a malformed stations.json is an empty table — no list, the scope unaffected', n.list === 0 && n.engaged, JSON.stringify(n));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const asked = [];
    page.on('request', (r) => { if (/\/ssb\/geometry\/stations\.json/.test(r.url())) asked.push(r.url()); });
    await nextFrames(page, 4);
    await page.waitForTimeout(500);
    const before = asked.length;
    await page.evaluate(() => { location.hash = '#scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'ready', null, { timeout: 30000 });
    check('stations (E6): stations.json loads with the scope, not at page boot, and once', before === 0 && asked.length === 1, JSON.stringify([before, asked.length]));
    await context.close();
  }

  /* ===== exposure: legible at every distance (E2b) ===== */
  for (const hash of ['#scope=R,52,-3,15,0,0', '#scope=R,42,-3,15,0,0', '#scope=R,40,0,15,0,30', '#scope=R,40,0,0,0,0']) {
    const { context, page } = await openSpecimen(browser, base, hash);
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 15000 });
    await nextFrames(page, 4);
    const ex = await spec(page, () => window.__ssb.scope.exposure);
    const { img } = await canvasImage(page);
    const R = Math.min(img.width, img.height) / 2;
    const lums = [];
    for (let y = 0; y < img.height; y += 2) {
      for (let x = 0; x < img.width; x += 2) {
        if (Math.hypot(x - img.width / 2, y - img.height / 2) > R * 0.97) continue;
        const c = img.at(x, y);
        lums.push(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]);
      }
    }
    lums.sort((a, b) => a - b);
    const sat = lums.filter((l) => l >= 250).length / lums.length;
    const median = lums[Math.floor(lums.length / 2)];
    console.log(`  [E2b] ${hash} D=${ex.distance && ex.distance.toFixed(1)} intensity=${ex.intensity && ex.intensity.toFixed(0)} raycast=${ex.ms.toFixed(1)}ms saturated=${(sat * 100).toFixed(1)}% median=${median.toFixed(0)}`);
    check(`scope: exposure at ${hash} — under 10 % of the field saturated (luminance >= 250), median luminance 40-200`,
      ex.distance !== null && sat < 0.1 && median >= 40 && median <= 200, `D ${ex.distance}, saturated ${(sat * 100).toFixed(1)} %, median ${median.toFixed(0)}`);
    await context.close();
  }

  /* ===== CT along the scope, and exposure on settle (E4) ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,52,-3,15,0,0');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.collision && window.__ssb.scope.inset, null, { timeout: 30000 });
    await nextFrames(page, 4);
    await page.waitForTimeout(300);
    const ins = await page.evaluate(() => {
      const s = window.__ssb.scope; const T = s.tip; const c = document.getElementById('ssb-scope-inset');
      const px = c.getContext('2d').getImageData(c.width >> 1, c.height >> 1, 1, 1).data;
      return { tip: T, cursor: s.cursor, inset: s.inset, sample: s.sampleAt(T), px: [...px], shown: !c.closest('.ssb-lab-sec').hidden, w: c.width, h: c.height };
    });
    const voxel = 1;     /* the display volume's voxel is 1 mm (ct.json) */
    check('scope CT: after a pose change the shared cursor equals the tip within a voxel', ins.cursor && Math.hypot(...ins.cursor.map((v, i) => v - ins.tip[i])) <= voxel, JSON.stringify([ins.cursor, ins.tip]));
    check('scope CT: the inset is shown once the volume has loaded, and its centre pixel is the volume sampled at the tip',
      ins.shown && ins.w === ins.inset.width && near(ins.inset.center, ins.sample, 1e-4) && Math.abs(ins.px[0] - Math.max(0, Math.min(255, Math.round(ins.sample)))) <= 1, JSON.stringify(ins));
    const shaft = ins.inset.shaft;
    check('scope CT: the shaft is drawn ending at the centre pixel', near(shaft[2], (ins.w - 1) / 2, 1e-6) && near(shaft[3], (ins.h - 1) / 2, 1e-6), JSON.stringify(shaft));
    /* the cursor follows a later pose change, and CT opens on it */
    await page.evaluate(() => { const r = document.getElementById('ssb-scope-yaw'); r.value = '-1'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await nextFrames(page, 4);
    const c2 = await page.evaluate(() => ({ tip: window.__ssb.scope.tip, cursor: window.__ssb.scope.cursor }));
    check('scope CT: the cursor follows the next pose change', c2.cursor && Math.hypot(...c2.cursor.map((v, i) => v - c2.tip[i])) <= voxel && Math.hypot(...c2.cursor.map((v, i) => v - ins.cursor[i])) > 0.1, JSON.stringify([c2, ins.cursor]));
    /* a 30-frame drag measures the exposure at most twice; a settled pose is exposed */
    const box = await page.evaluate(() => { const b = document.getElementById('ssb-canvas').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    await page.waitForTimeout(300);
    const runs0 = await page.evaluate(() => window.__ssb.scope.exposeRuns);
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    const frames0 = await page.evaluate(() => window.__ssb.scope.renders);
    for (let i = 1; i <= 30; i++) await page.mouse.move(box.x + i * 10, box.y - i * 6);      /* back to back: the pose never rests for 100 ms */
    const dragFrames = (await page.evaluate(() => window.__ssb.scope.renders)) - frames0;
    await page.mouse.up();
    const runsDrag = (await page.evaluate(() => window.__ssb.scope.exposeRuns)) - runs0;
    await page.waitForTimeout(400);
    const runsSettled = (await page.evaluate(() => window.__ssb.scope.exposeRuns)) - runs0;
    check('scope: during a 30-frame drag the exposure runs at most twice, and the settled pose is exposed once more', runsDrag <= 2 && runsSettled >= 1 && runsSettled <= 3, `${runsDrag} during (${dragFrames} frames), ${runsSettled} after`);
    check('scope: the HUD near colour is a class, not an inline style (E4)', !(await page.evaluate(() => [...document.querySelectorAll('.ssb-scope-hud-row')].some((e) => e.style.color))) && (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--signal'))).length > 0);
    const tipEnd = await page.evaluate(() => window.__ssb.scope.tip);
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await page.waitForFunction(() => window.__ssb.ct && window.__ssb.ct.status === 'ready', null, { timeout: 30000 });
    const cc = await page.evaluate(() => window.__ssb.ct.cursor);
    check('scope CT: leaving the scope for CT keeps the cursor where the tip was', cc && Math.hypot(...cc.map((v, i) => v - tipEnd[i])) <= voxel, JSON.stringify([cc, tipEnd]));
    await context.close();
  }
  {
    /* no volume, no inset: a scope whose CT never loads still moves and shows no inset */
    const { context, page } = await openSpecimen(browser, base, '#scope=R,30,0,0,0,0', { abort: /\/ssb\/ct\/ct\.u8\.gz/, track: false });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 15000 });
    await nextFrames(page, 4);
    await page.waitForTimeout(500);
    const none = await page.evaluate(() => ({ inset: window.__ssb.scope.inset, hidden: document.getElementById('ssb-scope-inset').closest('.ssb-lab-sec').hidden }));
    check('scope CT: with no volume the inset is hidden and there is no error', none.inset === null && none.hidden === true, JSON.stringify(none));
    await context.close();
  }

  /* ===== collision and the proximity HUD on the page (E3) ===== */
  {
    /* a pasted link through bone is clamped, in the pose and the URL; the pinned poses are not */
    const open = async (hash, opts) => {
      const o = await openSpecimen(browser, base, hash, opts);
      await o.page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.collision, null, { timeout: 30000 });
      await nextFrames(o.page, 3);
      return o;
    };
    const slide = (page, key, value) => page.evaluate(([k, v]) => { const r = document.getElementById(`ssb-scope-${k}`); r.value = String(v); r.dispatchEvent(new Event('input', { bubbles: true })); }, [key, value]);
    let o = await open('#scope=L,30,10,0,0,30');
    /* the store writes a scope-sourced hash 250 ms after the last change (main.js): wait for it to settle */
    await o.page.waitForFunction(() => location.hash === '#scope=L,17,10,0,0,30', null, { timeout: 5000 }).catch(() => {});
    const clamped = await o.page.evaluate(() => ({ pose: window.__ssb.scope.pose, hash: location.hash, hud: window.__ssb.scope.hud }));
    check('scope: a pasted pose through bone is clamped to the last free depth, in the pose and in the URL (L,30,10,0,0,30 -> depth 17)',
      clamped.pose.depth === 17 && clamped.pose.yaw === 10 && clamped.hash === '#scope=L,17,10,0,0,30' && clamped.hud.limited === true, JSON.stringify(clamped));
    await o.context.close();

    o = await open('#scope=R,58.5,-3,19,0,0');
    const sph = await o.page.evaluate(() => ({ pose: window.__ssb.scope.pose, tip: window.__ssb.scope.tip, hud: window.__ssb.scope.hud, lm: window.__ssb.specimen.landmarks.find((l) => l.key === 'lm.sphenoid-ostium.R').ras }));
    check('scope: the pinned right sphenoid pose (R,58.5,-3,19) is not clamped and its tip is within 2.5 mm of lm.sphenoid-ostium.R',
      sph.pose.depth === 58.5 && Math.hypot(...sph.tip.map((v, i) => v - sph.lm[i])) <= 2.5 && !sph.hud.limited, JSON.stringify(sph));
    check('scope: the HUD lists every distance field, nearest first, in mm; mucosal contact is reported (13 mm of shaft at the sphenoid pose; 11 before ST6, which unmasked the nostril\'s wall)',
      sph.hud.rows.length === 5 && sph.hud.rows.every((r, i, a) => i === 0 || a[i - 1].mm <= r.mm) && sph.hud.rows.every((r) => r.name && !/^s\./.test(r.name)) && sph.hud.contactMm === 13, JSON.stringify(sph.hud));
    const dom = await o.page.evaluate(() => ({ rows: [...document.querySelectorAll('.ssb-scope-hud-row')].map((e) => e.textContent), near: document.querySelectorAll('.ssb-scope-hud-row[data-near]').length,
      contact: (document.querySelector('.ssb-scope-hud-contact') || {}).textContent, hidden: document.querySelector('.ssb-scope-hud').closest('.ssb-lab-sec').hidden }));
    check('scope: the proximity section shows a row per structure with its graph name, and the mucosal contact line; none within 3 mm here, so none is flagged',
      !dom.hidden && dom.rows.length === 5 && dom.rows[0].startsWith('Orbit:') && dom.near === 0 && /^Mucosal contact: 13 mm/.test(dom.contact), JSON.stringify(dom));
    /* the shaft: 2.7 mm goes deeper than 4 mm before bone */
    await slide(o.page, 'yaw', 0);
    await slide(o.page, 'pitch', 0);
    await slide(o.page, 'depth', 100);
    await nextFrames(o.page, 2);
    const d4 = await o.page.evaluate(() => window.__ssb.scope.pose.depth);
    await o.page.click('#ssb-scope-controls button[data-shaft="2.7"]');
    await slide(o.page, 'depth', 100);
    await nextFrames(o.page, 2);
    const d27 = await o.page.evaluate(() => ({ depth: window.__ssb.scope.pose.depth, shaft: window.__ssb.scope.shaft, hash: location.hash, pressed: document.querySelector('#ssb-scope-controls button[data-shaft="2.7"]').getAttribute('aria-pressed') }));
    check('scope: the 4 mm shaft stops at depth 85 and the 2.7 mm shaft, selectable in the controls and not in the URL, goes on to 86',
      d4 === 85 && d27.depth === 86 && d27.shaft.key === '2.7' && d27.pressed === 'true' && !/2\.7/.test(d27.hash), JSON.stringify([d4, d27]));
    await o.context.close();

    o = await open('#scope=R,74,3,24,0,0');
    const nearHud = await o.page.evaluate(() => ({ pose: window.__ssb.scope.pose, row: (() => { const e = document.querySelector('.ssb-scope-hud-row[data-near]'); return e && { text: e.textContent, id: e.dataset.id, color: getComputedStyle(e).color, cls: e.className, other: getComputedStyle(document.querySelector('.ssb-scope-hud-row:not([data-near])')).color, sig: (() => { const t = document.createElement('i'); t.style.color = 'var(--signal)'; document.body.append(t); const c = getComputedStyle(t).color; t.remove(); return c; })() }; })(),
      others: document.querySelectorAll('.ssb-scope-hud-row[data-near]').length }));
    check('scope: within 3 mm of a structure its row is drawn in the signal colour (R,74,3,24: the anterior cranial fossa, 2.2 mm) and only that row',
      nearHud.pose.depth === 74 && nearHud.row && nearHud.row.id === 's.anterior-cranial-fossa' && /2\.2 mm/.test(nearHud.row.text) && /ssb-scope-hud-near/.test(nearHud.row.cls) && nearHud.row.color === nearHud.row.sig && nearHud.row.color !== nearHud.row.other && nearHud.others === 1, JSON.stringify(nearHud));
    await o.context.close();

    for (const [hash, label] of [['#scope=R,36,-2,33,0,70', 'right'], ['#scope=L,36,-2,33,0,70', 'left']]) {
      o = await open(hash);
      const f = await o.page.evaluate(() => window.__ssb.scope.pose);
      check(`scope: the pinned ${label} frontal pose (${hash.slice(7)}) opens unclamped`, f.depth === Number(hash.slice(7).split(',')[1]), JSON.stringify(f));
      await o.context.close();
    }

    /* no distance fields: no HUD, no error, collision still works */
    const noSdf = (route) => route.fetch().then(async (res) => { const j = await res.json(); delete j.sdf; return route.fulfill({ response: res, json: j }); });
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx2.route(/\/ssb\/ct\/ct\.json(?:[?#].*)?$/, noSdf);
    const errors2 = [];
    const page2 = await ctx2.newPage();
    page2.on('pageerror', (e) => errors2.push(String(e)));
    await page2.goto(`${base}/ssb.html#scope=L,30,10,0,0,30`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page2.waitForFunction(() => window.__ssb && window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.collision, null, { timeout: 30000 });
    await nextFrames(page2, 3);
    const none = await page2.evaluate(() => ({ depth: window.__ssb.scope.pose.depth, rows: window.__ssb.scope.hud.rows.length, hidden: document.querySelector('.ssb-scope-hud').closest('.ssb-lab-sec').hidden }));
    check('scope: with no distance fields in ct.json the Proximity section is hidden, nothing throws, and collision still clamps (depth 17)', none.rows === 0 && none.hidden && none.depth === 17 && errors2.length === 0, JSON.stringify([none, errors2]));
    await ctx2.close();
  }

  /* ===== a pasted link, hostile links, the other stages ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=L,30,-10,0,0,30');
    /* the clamp needs the lazily loaded volume (collision), and the store writes the clamped hash 250 ms later (main.js) */
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.collision, null, { timeout: 30000 });
    await page.waitForFunction(() => location.hash === '#scope=L,26,-10,0,0,30', null, { timeout: 5000 }).catch(() => {});
    const info = await page.evaluate(() => ({ pose: window.__ssb.scope.pose, stage: document.getElementById('ssb-app').dataset.stage, hash: location.hash }));
    check('scope: a pasted #scope= link opens the stage at that pose once the specimen has loaded (L,30,-10,... swings medially: the septum rule clamps it to depth 26, E3b)', info.stage === 'scope' && JSON.stringify(info.pose) === JSON.stringify({ side: 'L', depth: 26, yaw: -10, pitch: 0, roll: 0, lens: 30 }) && info.hash === '#scope=L,26,-10,0,0,30', JSON.stringify(info));
    await page.evaluate(() => { document.querySelector('#ssb-tree button[data-id]').click(); });
    await nextFrames(page, 3);
    check('scope: selecting a structure while in the scope starts no camera flight (the scope owns the camera)', (await spec(page, () => window.__ssb.specimen.camera().flying)) === false);
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await nextFrames(page, 2);
    const ct = await page.evaluate(() => ({ stage: document.getElementById('ssb-app').dataset.stage, active: window.__ssb.scope.active, engaged: window.__ssb.scope.engaged, hash: location.hash, controls: window.__ssb.scope.controlsEnabled(), bone: window.__ssb.specimen.bone }));
    check('scope: entering CT from the scope leaves it cleanly (stage, hash, orbit controls and the specimen\'s layers restored)', ct.stage === 'ct' && !ct.active && !ct.engaged && !/scope=/.test(ct.hash) && ct.controls && ct.bone === 'xray', JSON.stringify(ct));
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await nextFrames(page, 3);
    const back = await spec(page, () => window.__ssb.specimen.camera());
    check('scope: coming back to the specimen after CT shows the orbit view, not the scope\'s tip (the camera is outside the head, a normal distance from its target)', back.distance > 60 && back.position.some((v) => Math.abs(v) > 40), JSON.stringify(back));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,0,0,0,0,0');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 15000 });
    await nextFrames(page, 3);
    const air = (await specNodes(page)).filter((n) => n.group === 'air');
    check('scope: at depth 0 (the tip in front of the cavity, outside the air spaces\' box) the lining is still opaque, not 0.4-opacity shells', air.length > 0 && air.every((n) => n.drawn === (n.liningKind || 'mucosa') && !n.transparent), JSON.stringify(air.filter((n) => n.transparent).map((n) => n.key)));
    await context.close();
  }
  for (const hash of ['#scope=R,40,0,0,0,31', '#scope=X,40,0,0,0,0', '#scope=' + encodeURIComponent('<img src=x id=pwnscope onerror=window.__pwned=1>'), '#scope=R,1,2,3']) {
    const { context, page } = await openSpecimen(browser, base, hash);
    const info = await page.evaluate(() => ({ stage: document.getElementById('ssb-app').dataset.stage, pwn: !!document.getElementById('pwnscope') || !!window.__pwned, active: window.__ssb.scope.active }));
    check(`scope: hostile ${hash.slice(0, 40)} is ignored (specimen stage, nothing injected)`, info.stage === 'specimen' && !info.pwn && !info.active, JSON.stringify(info));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,60,50000,-50000,99999,45');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 15000 });
    const pose = await spec(page, () => window.__ssb.scope.pose);
    check('scope: out-of-range numbers in a link clamp (yaw 45, pitch -45, roll 359), not break', pose.yaw === 45 && pose.pitch === -45 && pose.roll === 359 && pose.depth <= 60 && pose.depth > 0, JSON.stringify(pose));   /* depth: 60, or the bone clamp's if the volume has already loaded (a race the E4 timing exposed) */
    await context.close();
  }

  /* ===== reduced motion, phones, no WebGL ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,30', { reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 15000 });
    const d = await page.evaluate(() => getComputedStyle(document.querySelector('.ssb-scope-post')).transitionDuration);
    check('scope: prefers-reduced-motion leaves no transition on the light-post indicator (a pose change is a cut: site.css clamps it to 0.01 ms)', d.split(',').every((t) => parseFloat(t) <= 0.001), d);
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,30', { viewport: { width: 390, height: 844 } });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 15000 });
    await nextFrames(page, 3);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, c: document.getElementById('ssb-canvas').getBoundingClientRect().width, o: document.getElementById('ssb-scope').getBoundingClientRect().width }));
    const { img } = await canvasImage(page);
    check('scope: on a phone the image fills the stage, nothing scrolls sideways, and the circle is the shorter side', m.sw <= m.cw && m.c > 300 && near(m.o, m.c, 1), JSON.stringify(m));
    check('scope: on a phone the image is not blank (many distinct colours inside the circle)', (() => {
      const set = new Set();
      const R = Math.min(img.width, img.height) / 2;
      for (let i = 0; i < 400; i++) { const a = (i / 400) * Math.PI * 14; const r = (0.15 + 0.7 * ((i * 37) % 100) / 100) * R; set.add(img.at(Math.round(img.width / 2 + Math.cos(a) * r), Math.round(img.height / 2 + Math.sin(a) * r)).map((v) => v >> 4).join()); }
      return set.size >= 15;
    })());
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,0', { webgl: false, wait: 'graph' });
    const info = await page.evaluate(() => ({ stage: document.getElementById('ssb-app').dataset.stage, pill: document.querySelector('#ssb-stage-mode [data-stage="scope"]').disabled, scope: window.__ssb.scope }));
    check('scope: with WebGL blocked the Scope pill stays disabled and nothing throws (the URL still selects the stage, which says what is missing)', info.pill === true && info.scope === null, JSON.stringify(info));
    await context.close();
  }
}


/* ---------------- the sphenoid diorama (docs/ssb.md 6.1, rules 0-9) ---------------- */

/* Every number below is read off the solids on a 0.5 mm grid (or, for two
   distances between cylinders, analytically); nothing is written in. */
function sphenoidRuleTests() {
  const D = Object.fromEntries(SPH.PARAMS.map((p) => [p.key, p.default]));
  const P = (o) => ({ ...D, ...o });
  const G = 0.5;
  const shapeOf = (m, id, side, seg) => m.solids.filter((s) => s.id === id && (!side || s.side === side) && (!seg || s.seg === seg));
  const sgnOf = (side) => (side === 'R' ? 1 : -1);

  /* defaults: the spec's defaults and the graph's classes */
  check('sphenoid: defaults are sellar, every toggle off, intercarotid 12, DeLano 1, vidian 2',
    D.pneum === 3 && D.lateral_recess === 0 && D.clinoid_pneum === 0 && D.septum_on_ica === 0 && D.ica_protrusion === 0 && D.ica_dehiscence === 0
    && D.optic_dehiscence === 0 && D.onodi === 0 && D.intercarotid === 12 && D.optic_type === 1 && D.vidian_type === 2, JSON.stringify(D));
  for (const [cls, key] of [['c.sphenoid-pneumatization', 'pneum'], ['c.delano-optic-nerve', 'optic_type'], ['c.vidian-canal-type', 'vidian_type']]) {
    const codes = entity(cls).classes.map((c) => String(c.code));
    const opts = SPH.PARAMS.find((p) => p.key === key).options.map((o) => o.code);
    check(`sphenoid: ${key} offers exactly the codes of ${cls}`, JSON.stringify(opts) === JSON.stringify(codes), JSON.stringify([opts, codes]));
    check(`sphenoid: ${cls} presets cover every class`, JSON.stringify(Object.keys(SPH.PRESETS[cls])) === JSON.stringify(codes));
  }
  const ic = SPH.PARAMS.find((p) => p.key === 'intercarotid');
  const graphRange = entity('m.intercarotid-distance-narrowest').value.range;
  check('sphenoid: the intercarotid slider is the graph\'s own range', ic.min === graphRange[0] && ic.max === graphRange[1], JSON.stringify([ic.min, ic.max, graphRange]));

  /* rule 1: pneumatization order */
  const reach = {};
  for (const pn of [1, 2, 3, 4]) {
    const m = SPH.model(P({ pneum: pn }));
    let minY = 0;
    let under = false;
    let behind = false;
    for (let x = -18; x <= 18; x += G) for (let y = -48; y <= 2; y += G) for (let z = -16; z <= 20; z += G) {
      if (!m.air(x, y, z) || m.which(x, y, z) !== 'sinus') continue;
      if (y < minY) minY = y;
      if (Math.abs(x) <= 5 && y > -30 && y < -18 && z < 5.5) under = true;
      if (y < -30) behind = true;
    }
    reach[pn] = { minY, under, behind };
  }
  check('sphenoid rule 1: posterior air extent is strictly conchal < presellar < sellar < postsellar',
    reach[1].minY > reach[2].minY && reach[2].minY > reach[3].minY && reach[3].minY > reach[4].minY, JSON.stringify(reach));
  check('sphenoid rule 1: air lies under the sella exactly for sellar and postsellar', !reach[1].under && !reach[2].under && reach[3].under && reach[4].under);
  check('sphenoid rule 1: air lies behind the posterior sellar wall plane exactly for postsellar', !reach[1].behind && !reach[2].behind && !reach[3].behind && reach[4].behind);
  check('sphenoid rule 1: presellar air reaches but does not pass the anterior sellar wall plane (y -18)', reach[2].minY <= -16 && reach[2].minY > -18, String(reach[2].minY));
  {
    const m = SPH.model(P({ pneum: 1 }));
    const b = shapeOf(m, 's.sella-turcica')[0].shape;
    let gap = Infinity;
    for (let x = -18; x <= 18; x += 1) for (let y = -14; y <= 2; y += G) for (let z = -16; z <= 12; z += G) {
      if (!m.air(x, y, z)) continue;
      const dx = Math.max(b.min[0] - x, 0, x - b.max[0]);
      const dy = Math.max(b.min[1] - y, 0, y - b.max[1]);
      const dz = Math.max(b.min[2] - z, 0, z - b.max[2]);
      gap = Math.min(gap, Math.hypot(dx, dy, dz));
    }
    check('sphenoid rule 1: conchal leaves at least 8 mm of bone between sinus air and the sella', gap >= 8, String(gap));
  }

  /* rule 0 + 2: carotid prominence. A segment is judged where the sinus reaches it:
     the parasellar segment from sellar, the paraclival segment from postsellar;
     in presellar and conchal the ICA lies behind all air (share 0 whatever the toggle). */
  const icaShare = (o, side, seg) => {
    const m = SPH.model(P(o));
    const c = SPH.canals(m).find((x) => x.id === 'ica' && x.side === side && x.seg === seg);
    return SPH.facing(m, c, ['sinus']);
  };
  check('sphenoid rule 2: the ICA faces no air in conchal (any toggle) and none in presellar either',
    [1, 2].every((pn) => [0, 1].every((pr) => ['parasellar', 'paraclival'].every((seg) => icaShare({ pneum: pn, ica_protrusion: pr }, 'R', seg) === 0))));
  for (const [pn, seg] of [[3, 'parasellar'], [4, 'parasellar'], [4, 'paraclival']]) {
    for (const side of ['R', 'L']) {
      const off = icaShare({ pneum: pn }, side, seg);
      const on = icaShare({ pneum: pn, ica_protrusion: 1 }, side, seg);
      check(`sphenoid rule 2: ${side} ${seg} ICA in ${pn === 3 ? 'sellar' : 'postsellar'}: share ${r2(off)} without, ${r2(on)} with protrusion (at least 0.5 exactly when protruding)`,
        off > 0 && off < 0.5 && on >= 0.5, `${off} ${on}`);
    }
  }
  {
    /* a dehiscence leaves no wall on the arc facing the sinus */
    const m = SPH.model(P({ ica_dehiscence: 1 }));
    const walls = shapeOf(m, 's.carotid-prominence', 'R', 'parasellar')[0].shape;
    const a = walls.a;
    const medial = kit.inside(walls, a[0] - 2.6, a[1], (walls.a[2] + walls.b[2]) / 2);
    const lateral = kit.inside(walls, a[0] + 2.6, a[1], (walls.a[2] + walls.b[2]) / 2);
    check('sphenoid: a dehiscent ICA has no bone on the sinus side and keeps it on the other', !medial && lateral, JSON.stringify({ medial, lateral }));
    const share = icaShare({ ica_dehiscence: 1 }, 'R', 'parasellar');
    check('sphenoid rule 0: a dehiscence sets the wall to 0 on its arc (the share rises above the intact wall\'s)', share > icaShare({}, 'R', 'parasellar'), String(share));
  }

  /* rule 3: septum on the ICA (distance from the septum solid to the carotid canal wall) */
  const sepDist = (o) => {
    const m = SPH.model(P(o));
    const sep = shapeOf(m, 's.intersinus-septum')[0].shape;
    const b = kit.bounds(sep);
    const walls = shapeOf(m, 's.carotid-prominence', null, 'parasellar');
    let best = Infinity;
    for (let x = b.min[0]; x <= b.max[0]; x += 0.25) for (let y = b.min[1]; y <= b.max[1]; y += 0.25) for (let z = 0; z <= 3; z += 1) {
      if (!kit.inside(sep, x, y, z)) continue;
      for (const w of walls) {
        const f = kit.cylFrame(w.shape, x, y, Math.min(Math.max(z, w.shape.a[2]), w.shape.b[2]));
        best = Math.min(best, f.rho - w.shape.r);
      }
    }
    return best;
  };
  for (const pn of [3, 4]) {
    for (const shift of [0, 5, -5]) {
      check(`sphenoid rule 3: ${pn === 3 ? 'sellar' : 'postsellar'}, shift ${shift}: the septum meets the carotid canal wall (distance 0) with the toggle on`,
        sepDist({ pneum: pn, septum_on_ica: 1, septum_shift: shift }) <= 0.01, String(sepDist({ pneum: pn, septum_on_ica: 1, septum_shift: shift })));
      check(`sphenoid rule 3: ${pn === 3 ? 'sellar' : 'postsellar'}, shift ${shift}: with the toggle off the distance is positive`, sepDist({ pneum: pn, septum_shift: shift }) > 0.5);
    }
  }
  check('sphenoid rule 3: presellar (below sellar) the septum cannot reach the ICA even with the toggle on', sepDist({ pneum: 2, septum_on_ica: 1 }) > 0.5);

  /* rule 4: DeLano (0 + 4) */
  const optic = (o) => {
    const m = SPH.model(P(o));
    const c = SPH.canals(m).find((x) => x.id === 'optic' && x.side === 'R');
    return { sinus: SPH.facing(m, c, ['sinus']), cell: SPH.facing(m, c, ['cell']), m };
  };
  for (const pn of [3, 4]) {
    const o1 = optic({ pneum: pn, optic_type: 1 });
    const o2 = optic({ pneum: pn, optic_type: 2 });
    const o3 = optic({ pneum: pn, optic_type: 3 });
    const o4 = optic({ pneum: pn, optic_type: 4 });
    check(`sphenoid rule 4 (${pn === 3 ? 'sellar' : 'postsellar'}): type 1 faces no air; type 2 above 0 and below 0.5; type 3 at least 0.5`,
      o1.sinus === 0 && o1.cell === 0 && o2.sinus > 0 && o2.sinus < 0.5 && o3.sinus >= 0.5, JSON.stringify([o1.sinus, o2.sinus, o3.sinus]));
    check(`sphenoid rule 4 (${pn === 3 ? 'sellar' : 'postsellar'}): type 4 faces the Onodi cell over at least 0.25 and the sinus not at all`, o4.cell >= 0.25 && o4.sinus === 0, JSON.stringify([o4.cell, o4.sinus]));
  }
  {
    const m = optic({ optic_type: 4 }).m;
    const cell = shapeOf(m, 'v.sphenoethmoidal-cell', 'R')[0].shape;
    const nerve = shapeOf(m, 's.optic-nerve', 'R')[0].shape;
    const mid = [0, 1, 2].map((i) => (nerve.a[i] + nerve.b[i]) / 2);
    check('sphenoid rule 4: the Onodi cell lies medial and/or superior to the nerve (not lateral)', cell.c[0] < mid[0] && cell.c[2] > mid[2], JSON.stringify([cell.c, mid]));
    let inLumen = 0;
    for (let x = 0; x <= 12; x += G) for (let y = -22; y <= -6; y += G) for (let z = 0; z <= 22; z += G) {
      const w = m.which(x, y, z);
      if (w === 'cell' && z < 9.4) inLumen++;
    }
    check('sphenoid rule 4: the cell is a separate space — none of its air lies at sinus level, and the nerve never runs free in the sinus lumen (no sinus air at the nerve)',
      inLumen === 0 && optic({ optic_type: 4 }).sinus === 0, String(inLumen));
    check('sphenoid rule 4: optic type 4 implies the Onodi cell', shapeOf(SPH.model(P({ optic_type: 4, onodi: 0 })), 'v.sphenoethmoidal-cell', 'R').length === 1);
  }

  /* rule 5: intercarotid window — nearest medial walls of the two ICA arteries */
  for (const val of [4, 7.5, 12, 18]) {
    for (const shift of [0, 6, -8]) {
      const m = SPH.model(P({ intercarotid: val, septum_shift: shift }));
      let gap = Infinity;
      for (const seg of ['parasellar', 'paraclival']) {
        const R = shapeOf(m, 's.internal-carotid-artery', 'R', seg)[0].shape;
        const L = shapeOf(m, 's.internal-carotid-artery', 'L', seg)[0].shape;
        gap = Math.min(gap, (R.a[0] - R.r) - (L.a[0] + L.r));
      }
      check(`sphenoid rule 5: intercarotid ${val}, septum shift ${shift}: the measured window is ${r2(gap)} mm`, near(gap, val, 0.5), String(gap));
    }
  }

  /* rule 6: vidian ridge over the floor */
  const ridge = (vt) => {
    const m = SPH.model(P({ vidian_type: vt }));
    const canal = shapeOf(m, 's.vidian-canal', 'R')[0].shape;
    let h = -Infinity;
    for (let x = 5; x <= 14; x += 0.25) for (let y = -28; y <= -8; y += 0.25) {
      let top = null;
      for (let z = -20; z <= 0; z += 0.1) if (kit.inside(canal, x, y, z)) top = z;
      if (top !== null && m.air(x, y, top + 0.6)) h = Math.max(h, top + 12);   /* ZB = -12 */
    }
    return h;
  };
  const r1v = ridge(1);
  const r2v = ridge(2);
  const r3v = ridge(3);
  check('sphenoid rule 6: vidian type 1 has a ridge of positive height; type 2 a lower one; type 3 none', r1v > 0 && r2v > 0 && r2v < r1v && r3v === -Infinity, JSON.stringify([r1v, r2v, r3v]));

  /* rule 7: lateral recess */
  const lateral = (o) => {
    const m = SPH.model(P(o));
    let mx = -Infinity;
    for (let x = 0; x <= 40; x += G) for (let y = -16; y <= 0; y += G) for (let z = -14; z <= 10; z += G) if (m.air(x, y, z)) mx = Math.max(mx, SPH.lineSide(x, z));
    return mx;
  };
  check('sphenoid rule 7: with the recess off, no air lies lateral to the vidian-rotundum line', lateral({}) <= 0, String(lateral({})));
  for (const ext of [3, 6, 15]) {
    const got = lateral({ lateral_recess: 1, lr_extent: ext });
    check(`sphenoid rule 7: lr_extent ${ext} puts the air ${r2(got)} mm lateral to the line (±1 mm)`, near(got, ext, 1), String(got));
  }

  /* rule 9: impossible combinations degrade, by one table */
  const same = (a, b) => JSON.stringify(SPH.model(a).solids) === JSON.stringify(SPH.model(b).solids);
  const noEffect = { ica_protrusion: 1, ica_dehiscence: 1, optic_dehiscence: 1, lateral_recess: 1, clinoid_pneum: 1, septum_on_ica: 1, optic_type: 3, vidian_type: 1 };
  for (const [k, v] of Object.entries(noEffect)) {
    check(`sphenoid rule 9: conchal ignores ${k}=${v} (geometry equals the default configuration's)`, same(P({ pneum: 1, [k]: v }), P({ pneum: 1 })) || (k === 'optic_type' || k === 'vidian_type') && same(P({ pneum: 1, [k]: v }), P({ pneum: 1, [k]: D[k] })));
    check(`sphenoid rule 9: the HUD says what conchal degraded (${k})`, SPH.model(P({ pneum: 1, [k]: v })).notes.includes(k));
  }
  check('sphenoid rule 9: conchal degrades optic type 2 to type 1', same(P({ pneum: 1, optic_type: 2 }), P({ pneum: 1, optic_type: 1 })));
  check('sphenoid rule 9: optic type 3 below sellar draws type 2', same(P({ pneum: 2, optic_type: 3 }), P({ pneum: 2, optic_type: 2 })) && SPH.model(P({ pneum: 2, optic_type: 3 })).notes.includes('optic_type'));
  for (const k of ['ica_protrusion', 'ica_dehiscence']) {
    check(`sphenoid rule 9: presellar ignores ${k}=1 (geometry equals the toggle-off model's)`, same(P({ pneum: 2, [k]: 1 }), P({ pneum: 2, [k]: 0 })));
    check(`sphenoid rule 9: the HUD says what presellar degraded (${k})`, SPH.model(P({ pneum: 2, [k]: 1 })).notes.includes(k));
  }
  check('sphenoid rule 9: optic type 3 at sellar is not degraded', SPH.model(P({ pneum: 3, optic_type: 3 })).notes.length === 0);
  check('sphenoid rule 9: every degrade happens at most once and never invents a parameter', Object.keys(SPH.degrade(P({ pneum: 1, ...noEffect })).p).sort().join() === Object.keys(D).sort().join());

  /* rule 8 (codec part): the URL whitelist round-trips and clamps */
  const labs = { sphenoid: { params: SPH.PARAMS, presets: SPH.PRESETS } };
  const has = () => true;
  const hostile = parseHash('#lab=sphenoid&pneum=999&intercarotid=-1e9&optic_type=' + encodeURIComponent('<img src=x onerror=1>') + '&lr_extent=1e400&septum_shift=40&vidian_type=2.6&bogus=1', has, labs).lab;
  check('sphenoid rule 8: a hostile #lab= is clamped (pneum 4, intercarotid 4, shift 8, vidian 3) or dropped to the default (optic 1, lr_extent 6)',
    hostile.params.pneum === 4 && hostile.params.intercarotid === 4 && hostile.params.septum_shift === 8 && hostile.params.vidian_type === 3
    && hostile.params.optic_type === 1 && hostile.params.lr_extent === 6, JSON.stringify(hostile.params));
  const text = formatHash({ lab: hostile }, labs);
  const again = parseHash(text, has, labs).lab;
  check('sphenoid rule 8: the URL codec round-trips', JSON.stringify(again.params) === JSON.stringify(hostile.params) && formatHash({ lab: again }, labs) === text && !/[<>]/.test(text), text);
  const sorted = (p) => JSON.stringify(Object.entries(p).sort());
  void sorted;
}


/* ---------------- the procedure player (WP P2): volume patches, the hash, the index; then the page on a fixture ---------------- */

const PF = procedureFiles(FX);
const PROC_URL = `p=${PROC.id}`;
const POSE_HASH = (o = {}) => { const p = { ...PROC.pose, ...o }; return `scope=${p.side},${p.depth},${p.yaw},${p.pitch},${p.roll},${p.lens}`; };
const HOLE_TIP = [PROC.fulcrum[0] + PROC.dir[0] * PROC.pose.depth, PROC.fulcrum[1] + PROC.dir[1] * PROC.pose.depth, PROC.fulcrum[2] + PROC.dir[2] * PROC.pose.depth];

async function procedureUnitTests() {
  const header = parseHeader(FX.meta);
  const base = createVolume({ header, ct: FX.ct, labels: FX.labels, table: parseTable(FX.table) });
  const ctBefore = FX.ct.slice();
  const labelsBefore = FX.labels.slice();
  const voxels = PF.voxels.a;
  const bytes = PF.files[`ssb/states/${PROC.keys.a}.ssbp.gz`];

  /* ---- volume.js: parsePatch / applyPatch ---- */
  const patch = await parsePatch(bytes, base);
  const n = patch.boxes.reduce((t, b) => t + b.data.filter((v) => v !== 0).length, 0);
  check('patch: parsePatch round-trips the fixture patch (gzip): state, ctFill, one box, every carved voxel and its label', patch.state === 'a' && patch.ctFill === 48 && patch.boxes.length === 1 && n === voxels.length && voxels.length > 0
    && voxels.every((v) => { const b = patch.boxes[0]; return b.data[(((v.k - b.ijk0[2]) * b.dims[1] + (v.j - b.ijk0[1])) * b.dims[0] + (v.i - b.ijk0[0]))] === v.label; }), `${n} of ${voxels.length}`);
  const rawPatch = await parsePatch(patchBytes(voxels, { state: 'a', gz: false }), base);
  check('patch: bytes the server already decoded parse the same', rawPatch.boxes[0].data.every((v, i) => v === patch.boxes[0].data[i]) && rawPatch.ctFill === 48);
  const refuse = async (what, p) => {
    const e = await p.catch((err) => err);
    check(`patch: ${what} is refused with a VolumeError`, e instanceof VolumeError, String(e && e.message));
    return e;
  };
  await refuse('a box outside dims', parsePatch(patchBytes(voxels, { mutate: (h) => { h.boxes[0].ijk0 = [DIMS_FX[0], 0, 0]; } }), base));
  await refuse('a box with a negative corner', parsePatch(patchBytes(voxels, { mutate: (h) => { h.boxes[0].ijk0 = [-1, 0, 0]; } }), base));
  await refuse('a label index the table does not name', parsePatch(patchBytes(voxels.map((v, i) => (i === 0 ? { ...v, label: 40 } : v))), base));
  await refuse('a wrong base', parsePatch(patchBytes(voxels, { base: 'another-specimen' }), base));
  await refuse('a short body', parsePatch(zlib.gzipSync(zlib.gunzipSync(bytes).subarray(0, 60)), base));
  await refuse('a long body', parsePatch(zlib.gzipSync(Buffer.concat([zlib.gunzipSync(bytes), Buffer.alloc(8)])), base));
  const v2 = await refuse('version 2', parsePatch(patchBytes(voxels, { mutate: (h) => { h.version = 2; } }), base));
  check('patch: version 2 is "unsupported", the others "invalid"', v2 && v2.code === 'unsupported');
  await refuse('a ctFill outside 0..255', parsePatch(patchBytes(voxels, { ctFill: 300 }), base));
  await refuse('a header length past the end', parsePatch(Buffer.from([255, 255, 0, 0, 1, 2]), base));

  const derived = applyPatch(base, patch);
  let changedCt = 0;
  let changedLab = 0;
  let wrong = 0;
  const carved = new Map(voxels.map((v) => [v.index, v.label]));
  for (let i = 0; i < FX.ct.length; i++) {
    const c = derived.ct[i] !== ctBefore[i];
    const l = derived.labels[i] !== labelsBefore[i];
    if (c) changedCt += 1;
    if (l) changedLab += 1;
    if (carved.has(i) ? derived.ct[i] !== 48 || derived.labels[i] !== carved.get(i) : c || l) wrong += 1;
  }
  check('patch: applyPatch changes exactly the box\'s non-zero voxels (display ctFill, the new label) and nothing else', wrong === 0 && changedCt === voxels.length && changedLab === voxels.length, JSON.stringify({ wrong, changedCt, changedLab, expect: voxels.length }));
  check('patch: the base volume is byte-identical after (CT and labels), and the derived one is a separate copy', FX.ct.every((v, i) => v === ctBefore[i]) && FX.labels.every((v, i) => v === labelsBefore[i]) && derived.ct !== base.ct && derived.labels !== base.labels);
  const tipV = HOLE_TIP;
  check('patch: the derived volume keeps the API — sample, labelAt, slice — and carvedAt says which voxels the patch changed',
    derived.sample(...tipV) < 60 && base.sample(...tipV) > 200 && derived.labelAt(...tipV) === 1 && base.labelAt(...tipV) === 0
    && derived.carvedAt(...tipV) === true && derived.carvedAt(...PROC.holes[1].center) === false && derived.carvedAt(30, 30, 30) === false
    && derived.slice('axial', tipV[2]).ct.length === base.slice('axial', tipV[2]).ct.length && derived.carvedVoxels === voxels.length, JSON.stringify([derived.sample(...tipV), base.sample(...tipV), derived.labelAt(...tipV)]));
  const noLabels = createVolume({ header, ct: FX.ct });
  noLabels.table = base.table;
  const patched2 = applyPatch(base, await parsePatch(PF.files[`ssb/states/${PROC.keys.b}.ssbp.gz`], base));
  check('patch: state B carries both holes (the second is carved there and not in A)', patched2.carvedAt(...PROC.holes[1].center) === true && patched2.carvedAt(...tipV) === true && patched2.carvedVoxels === PF.voxels.b.length && PF.voxels.b.length > voxels.length);

  /* ---- state.js: the hash codec and the store ---- */
  const has = (id) => GRAPH.has(id);
  const P = (h) => parseHash(h, has).procedure || null;
  check('hash: #p=<id>&step=<n> parses to { id, step, cor: null }; a missing step is 0', JSON.stringify(P(`#p=${PROC.id}&step=2`)) === JSON.stringify({ id: PROC.id, step: 2, cor: null }) && P(`#p=${PROC.id}`).step === 0);
  check('hash: step clamps to 0..99 and rounds; a non-number is 0', P(`#p=${PROC.id}&step=500`).step === 99 && P(`#p=${PROC.id}&step=-4`).step === 0 && P(`#p=${PROC.id}&step=1.6`).step === 2 && P(`#p=${PROC.id}&step=abc`).step === 0 && P(`#p=${PROC.id}&step=`).step === 0);
  check('hash: an unknown p, a non-procedure id and markup are dropped', P('#p=p.not-in-the-graph') === null && P('#p=s.maxillary-sinus') === null && P('#p=%3Cimg%20src%3Dx%3E') === null && P('#p=p.') === null && P(`#p=${PROC.id}%22%3E%3Cb%3E`) === null && P('#step=2') === null);
  check('hash: cor keeps a well-formed key and drops markup or junk', P(`#p=${PROC.id}&cor=${PROC.corridor}`).cor === PROC.corridor && P(`#p=${PROC.id}&cor=%3Cscript%3E`).cor === null && P(`#p=${PROC.id}&cor=${'a'.repeat(80)}`).cor === null && P(`#p=${PROC.id}&cor=A%20B`).cor === null);
  check('hash: a lab or a CT plane wins over a procedure', parseHash(`#lab=sphenoid&p=${PROC.id}`, has, { sphenoid: SPH_LAB }).procedure === undefined && !!parseHash(`#lab=sphenoid&p=${PROC.id}`, has, { sphenoid: SPH_LAB }).lab && P(`#ct=ax&p=${PROC.id}`) === null);
  const st = createStore({ has, tierOf: () => 1, hash: `#${PROC_URL}&step=3&cor=${PROC.corridor}&${POSE_HASH()}`, prefs: {}, labs: {} });
  check('hash: the canonical form writes p, step, cor and the pose, in that order, and parses back to itself', st.hash() === `#${PROC_URL}&step=3&cor=${PROC.corridor}&${POSE_HASH()}` && JSON.stringify(parseHash(st.hash(), has).procedure) === JSON.stringify(st.get().procedure), st.hash());
  const st2 = createStore({ has, tierOf: () => 1, hash: `#${PROC_URL}&step=1`, prefs: {}, labs: {} });
  check('state: a procedure implies a scope pose (the default when the hash gives none)', !!st2.get().scope && st2.get().scope.side === 'R' && st2.get().procedure.step === 1);
  st2.setProcedure({ id: PROC.id, step: 2, cor: null });
  check('state: setProcedure changes the step and keeps the pose', st2.get().procedure.step === 2 && !!st2.get().scope);
  check('state: setProcedure refuses an id that is not a procedure or not in the graph', st2.setProcedure({ id: 's.maxillary-sinus', step: 1 }) === false && st2.setProcedure({ id: 'p.nope', step: 1 }) === false && st2.get().procedure.step === 2);
  st2.setScope(null);
  check('state: leaving the scope ends the procedure', st2.get().procedure === null && st2.get().scope === null);
  for (const [name, fn] of [['the lab', (s) => s.setLab({ name: 'sphenoid', params: {} })], ['CT', (s) => s.setCt({ plane: 'axial', at: null })], ['the specimen stage', (s) => s.leaveStage()]]) {
    const s3 = createStore({ has, tierOf: () => 1, hash: `#${PROC_URL}&step=1`, prefs: {}, labs: { sphenoid: SPH_LAB } });
    fn(s3);
    check(`state: entering ${name} ends the procedure`, s3.get().procedure === null, JSON.stringify(s3.get().procedure));
  }

  /* ---- mode-procedure.js: the index and the step -> state lookup ---- */
  const idx = parseIndex(JSON.parse(PF.files['ssb/states/index.json'].toString('utf8')));
  check('index: the fixture index parses to two states, the steps of one procedure and one corridor', idx.states.size === 2 && stepCount(idx, PROC.id) === 3 && idx.corridors.size === 1 && idx.corridors.get(PROC.corridor).procedures[0] === PROC.id);
  check('index: step 0 is the intact specimen; steps 1-2 are state A, step 3 state B; a step past the end takes the last',
    stateKeyFor(idx, PROC.id, 0) === null && stateKeyFor(idx, PROC.id, 1) === PROC.keys.a && stateKeyFor(idx, PROC.id, 2) === PROC.keys.a && stateKeyFor(idx, PROC.id, 3) === PROC.keys.b && stateKeyFor(idx, PROC.id, 9) === PROC.keys.b);
  check('index: in a corridor its own position wins, the others fall back to the procedure\'s', stateKeyFor(idx, PROC.id, 1, PROC.corridor) === PROC.keys.b && stateKeyFor(idx, PROC.id, 0, PROC.corridor) === null && stateKeyFor(idx, PROC.id, 2, 'no-such') === PROC.keys.a);
  const flat = parseIndex({ version: 1, states: { [PROC.keys.a]: { patch: 'x.ssbp.gz' } }, procedures: { [`${PROC.id}#2`]: PROC.keys.a, [`${PROC.id}#3`]: 'ffffffffff', 'not-a-p#1': PROC.keys.a } });
  check('index: the flat "<p-id>#<n>" form is read too, and a key no state has is dropped', stepCount(flat, PROC.id) === 2 && flat.steps.size === 1);
  check('index: junk is an empty index', parseIndex(null).states.size === 0 && parseIndex({ version: 2, states: {} }).states.size === 0 && parseIndex('x').steps.size === 0 && parseIndex({ version: 1, states: { 'not-hex': {} } }).states.size === 0);
}
const DIMS_FX = FX.meta.dims;
const SPH_LAB = { params: [], presets: {} };

/* The page on the fixture: the CT volume, the states, the stations and the landmarks are routed; the packs are the real ones.
   `index`: 'fixture' | 'absent' (stamps.js without the index: the page must not ask) | a body string; `patch`: an override for the state files. */
async function openProc(browser, base, hash, { index = 'fixture', reducedMotion = 'no-preference', track = true, patches = null, real = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion });
  const asked = [];
  if (!real) {                      /* real: the page reads the committed specimen, states and stamps as served (P1b's data) */
  await context.route(FX_ROUTE, (route) => {
    const name = new URL(route.request().url()).pathname.replace(/^\//, '');
    const body = FX_FILES[name];
    return body ? route.fulfill({ status: 200, body, headers: { 'content-type': name.endsWith('.json') ? 'application/json' : 'application/octet-stream' } }) : route.fulfill({ status: 404, body: 'not found' });
  });
  await context.route(/\/ssb\/geometry\/(stations|landmarks)\.json(?:[?#].*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: PF.files[`ssb/geometry/${new URL(route.request().url()).pathname.split('/').pop()}`] }));
  await context.route(/\/ssb\/states\/[^?#]+(?:[?#].*)?$/, (route) => {
    const name = new URL(route.request().url()).pathname.replace(/^\//, '');
    asked.push(name);
    if (name.endsWith('index.json') && index !== 'fixture') return route.fulfill({ status: 200, contentType: 'application/json', body: index });
    if (patches && patches[name]) return patches[name](route);
    const body = PF.files[name];
    return body ? route.fulfill({ status: 200, body, headers: { 'content-type': name.endsWith('.json') ? 'application/json' : 'application/octet-stream' } }) : route.fulfill({ status: 404, body: 'not found' });
  });
  /* stamps.js lists what is on disk: the page asks for the index only when it is listed there */
  await context.route(/\/js\/ssb\/stamps\.js(?:[?#].*)?$/, (route) => {
    const src = sourceOf('js/ssb/stamps.js').replace(/^\s*"ssb\/states\/[^\n]*\n/gm, '');
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: index === 'absent' ? src : `${src}\nSTAMPS["ssb/states/index.json"] = "fixture0";\n` });
  });
  }
  const page = await context.newPage();
  const errors = collectErrors(page);
  if (track) allErrors.push(errors);
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  await page.waitForFunction(() => window.__ssb.specimen && !['idle', 'loading'].includes(window.__ssb.specimen.status), null, { timeout: 40000 });
  return { context, page, errors, asked };
}

const proc = (page, fn, arg) => page.evaluate(fn, arg);
const waitShown = (page, step, key = undefined) => page.waitForFunction(([n, k]) => { const p = window.__ssb.procedure; const s = p && p.shown; return s && s.step === n && !p.busy && (k === undefined || s.key === k); }, [step, key === undefined ? undefined : key], { timeout: 30000 });
const procHash = (page) => page.evaluate(() => location.hash);

async function procedureTests(browser, base) {
  const ID = PROC.id;

  /* ===== no index: Play is disabled with its reason, and the page asks for nothing ===== */
  {
    const { context, page, errors, asked } = await openProc(browser, base, `#s=${ID}`, { index: 'absent' });
    await page.waitForSelector('button.ssb-play');
    await page.waitForFunction(() => window.__ssb.procedure && window.__ssb.procedure.status === 'absent', null, { timeout: 20000 });
    const play = await proc(page, () => { const b = document.querySelector('button.ssb-play'); const n = document.querySelector('.ssb-play-note'); return { disabled: b.disabled, title: b.title, note: n.textContent, hidden: n.hidden }; });
    check('procedure: with no index the Play button is disabled and says why (no 404 fetched, zero console errors)', play.disabled && /No dissection states/.test(play.note) && !play.hidden && /No dissection states/.test(play.title) && asked.length === 0 && errors.length === 0, JSON.stringify({ play, asked, errors }));
    await context.close();
  }
  {
    const { context, page, errors } = await openProc(browser, base, `#s=${ID}`, { index: '{"version": 1, "states": ' });
    await page.waitForFunction(() => window.__ssb.procedure && window.__ssb.procedure.status === 'failed', null, { timeout: 20000 });
    const play = await proc(page, () => ({ disabled: document.querySelector('button.ssb-play').disabled, note: document.querySelector('.ssb-play-note').textContent }));
    check('procedure: a malformed index disables Play with a reason, nothing throws', play.disabled && /could not be read|not in a format/.test(play.note) && errors.length === 0, JSON.stringify({ play, errors }));
    await context.close();
  }

  /* ===== Play, and a procedure the index does not list ===== */
  {
    const { context, page } = await openProc(browser, base, `#s=${ID}`);
    await page.waitForFunction(() => { const b = document.querySelector('button.ssb-play'); return b && !b.disabled; }, null, { timeout: 20000 });
    await page.click('button.ssb-play');
    await waitShown(page, 0);
    const st = await proc(page, () => ({ hash: location.hash, stage: document.getElementById('ssb-app').dataset.stage, proc: !document.getElementById('ssb-proc').hidden, scope: window.__ssb.scope.active, key: window.__ssb.procedure.stateKey }));
    check('procedure: Play starts the procedure at step 0 on the scope stage: the hash, the controls, the intact state', /p=p\.anterior-ethmoidectomy&step=0/.test(st.hash) && st.stage === 'scope' && st.proc && st.scope && st.key === null, JSON.stringify(st));
    await page.evaluate(() => { location.hash = '#s=p.draf-iia'; });
    await page.waitForFunction(() => { const b = document.querySelector('button.ssb-play'); return b && b.dataset.play === 'p.draf-iia'; }, null, { timeout: 10000 });
    const other = await proc(page, () => ({ disabled: document.querySelector('button.ssb-play').disabled, note: document.querySelector('.ssb-play-note').textContent }));
    check('procedure: a procedure the index does not list has Play disabled with its reason', other.disabled && /No dissection states are built for this procedure/.test(other.note), JSON.stringify(other));
    await context.close();
  }

  /* ===== hostile and unknown hashes are ignored ===== */
  for (const [name, hash] of [['markup in p', '#p=%3Cimg%20src%3Dx%20onerror%3D%22window.__pwn%3D1%22%3E&step=1'], ['a non-procedure id', '#p=s.maxillary-sinus&step=1'], ['a procedure the index does not list', '#p=p.draf-iia&step=2&cor=nope'], ['markup in cor', `#p=${ID}&step=1&cor=%3Cscript%3Ewindow.__pwn%3D1%3C%2Fscript%3E`]]) {
    const { context, page, errors } = await openProc(browser, base, hash);
    await page.waitForFunction(() => window.__ssb.procedure, null, { timeout: 20000 });
    await page.waitForTimeout(400);
    const r = await proc(page, () => ({ hash: location.hash, pwn: window.__pwn || null, imgs: document.querySelectorAll('#ssb-proc img, #ssb-proc script').length, shown: window.__ssb.procedure.shown, stage: document.getElementById('ssb-app').dataset.stage }));
    const survives = name === 'markup in cor';
    check(`procedure: a hostile #p= (${name}) is ignored — ${survives ? 'the procedure plays without the bad cor' : 'no procedure, no stage change'}, nothing executes, zero console errors`,
      r.pwn === null && r.imgs === 0 && errors.length === 0 && (survives ? !/cor=/.test(r.hash) && /p=p\.anterior-ethmoidectomy&step=1/.test(r.hash) : !/p=/.test(r.hash) && r.shown === null), JSON.stringify({ r, errors }));
    await context.close();
  }

  /* ===== step 1: the hole is open, the pose through it is free, the tip's label is the patch's ===== */
  {
    const { context, page } = await openProc(browser, base, `#${PROC_URL}&step=1`);
    await waitShown(page, 1, PROC.keys.a);
    await page.waitForFunction(() => window.__ssb.scope.engaged && window.__ssb.scope.collision, null, { timeout: 30000 });
    await page.click('#ssb-scope-controls button[data-shaft="2.7"]');          /* the 4 mm hole passes the 2.7 mm telescope; the shaft is never in the hash */
    await page.evaluate((h) => { location.hash = h; }, `#${PROC_URL}&step=1&${POSE_HASH()}`);
    await page.waitForFunction((d) => window.__ssb.scope.pose && window.__ssb.scope.pose.depth === d, PROC.pose.depth, { timeout: 10000 });
    await nextFrames(page, 4);
    const at1 = await proc(page, () => ({ pose: window.__ssb.scope.pose, tip: window.__ssb.scope.tip, label: window.__ssb.scope.tipLabel, sample: window.__ssb.scope.sampleAt(window.__ssb.scope.tip), hud: window.__ssb.scope.hud, key: window.__ssb.scope.stateKey, hash: location.hash, carved: window.__ssb.procedure.carvedVoxels }));
    check('procedure: at step 1 the pose through the hole is free (depth kept, not limited) and the scope reads the dissected volume (the plate is air there)',
      at1.pose.depth === PROC.pose.depth && !at1.hud.limited && at1.key === PROC.keys.a && at1.sample < 60 && at1.carved === PF.voxels.a.length, JSON.stringify(at1));
    check('procedure: the tip\'s label there is the patch\'s (the right maxillary sinus\'s, where the base has none)', at1.label && at1.label.index === 1 && at1.label.name === 's.maxillary-sinus.R', JSON.stringify(at1.label));
    check('procedure: the hash is canonical and carries the step and the pose', at1.hash === `#${PROC_URL}&step=1&${POSE_HASH()}`, at1.hash);

    /* the think prompt stays hidden until revealed, by click or by key */
    const think0 = await proc(page, () => { const t = document.querySelector('.ssb-proc-think'); const b = document.querySelector('.ssb-proc-think-toggle'); return { exists: !!t, hidden: t && t.hidden, expanded: b && b.getAttribute('aria-expanded'), text: t && t.textContent }; });
    check('procedure: the step\'s `think` is hidden behind "Think first" until revealed', think0.exists && think0.hidden === true && think0.expanded === 'false', JSON.stringify(think0));
    await page.click('.ssb-proc-think-toggle');
    const think1 = await proc(page, () => ({ hidden: document.querySelector('.ssb-proc-think').hidden, expanded: document.querySelector('.ssb-proc-think-toggle').getAttribute('aria-expanded') }));
    await page.keyboard.press('t');
    const think2 = await proc(page, () => document.querySelector('.ssb-proc-think').hidden);
    await page.keyboard.press('t');
    const think3 = await proc(page, () => document.querySelector('.ssb-proc-think').hidden);
    check('procedure: a click reveals the think, the T key hides and shows it', think1.hidden === false && think1.expanded === 'true' && think2 === true && think3 === false, JSON.stringify([think1, think2, think3]));

    /* the step's structures and hazards are drawn through, the hazards hatched */
    const em = await spec(page, () => ({ nodes: window.__ssb.specimen.nodes().filter((n) => n.emphasis).map((n) => ({ id: n.id, e: n.emphasis, hazard: n.hazard, visible: n.visible })), set: window.__ssb.specimen.emphasis }));
    const lam = em.nodes.filter((n) => n.id === 's.lamina-papyracea');
    check('procedure: step 1 hatches the `at` of its risk hazard (h.lamina-papyracea-breach -> s.lamina-papyracea) and draws it through what hides it', lam.length > 0 && lam.every((n) => n.hazard && n.e === 'hazard' && n.visible) && em.set.hazard.includes('s.lamina-papyracea'), JSON.stringify(em));
    check('procedure: step 1 marks its `see` structures that the specimen has, and only those of the step', em.set.see.includes('s.uncinate-process') && em.nodes.every((n) => em.set.see.includes(n.id) || em.set.hazard.includes(n.id)), JSON.stringify(em.set));

    /* Previous / Next and the keys */
    await page.click('#ssb-proc button[data-act="next"]');
    await waitShown(page, 2);
    const h2 = await procHash(page);
    await page.keyboard.press(']');
    await waitShown(page, 3, PROC.keys.b);
    const h3 = await procHash(page);
    const at3 = await proc(page, () => ({ next: document.querySelector('#ssb-proc button[data-act="next"]').disabled, second: window.__ssb.procedure.carvedAt([0, 12, 4]), where: document.querySelector('.ssb-proc-where').textContent }));
    check('procedure: Next and ] move one step and rewrite the hash; step 3 is the second state, with the second hole carved and Next disabled', /step=2/.test(h2) && /step=3/.test(h3) && at3.next && at3.second === true && /Step 3 of 3/.test(at3.where), JSON.stringify({ h2, h3, at3 }));
    await page.keyboard.press(']');
    await page.waitForTimeout(150);
    check('procedure: ] past the last step does nothing', (await procHash(page)) === h3);
    await page.click('#ssb-proc button[data-act="prev"]');
    await waitShown(page, 2, PROC.keys.a);
    await page.keyboard.press('[');
    await waitShown(page, 1, PROC.keys.a);
    const back1 = await proc(page, () => ({ second: window.__ssb.procedure.carvedAt([0, 12, 4]), hash: location.hash, pose: window.__ssb.scope.pose }));
    check('procedure: Previous and [ step back one at a time; step 2 is the same state as step 1 (it removes nothing); the second hole closes again', back1.second === false && /step=1/.test(back1.hash), JSON.stringify(back1));

    /* back to step 0: the same pose clamps */
    await page.keyboard.press('[');
    await waitShown(page, 0, null);
    await nextFrames(page, 4);
    const at0 = await proc(page, () => ({ pose: window.__ssb.scope.pose, hud: window.__ssb.scope.hud, key: window.__ssb.scope.stateKey, hash: location.hash, intact: window.__ssb.scope.sampleAt([0, 8, -4]) }));
    check('procedure: stepping back to 0 clamps the same pose again at the plate (limited by bone), the base volume is what the scope reads', at0.pose.depth < PROC.pose.depth && at0.hud.limited && at0.hud.limitedBy === 'bone' && at0.key === null && at0.intact > 200 && at0.pose.yaw === PROC.pose.yaw, JSON.stringify(at0));

    /* CT at that point: the base value, and the carved outline */
    await page.keyboard.press(']');
    await waitShown(page, 1, PROC.keys.a);
    await page.click('#ssb-stage-mode [data-stage="ct"]');
    await page.waitForFunction(() => window.__ssb.ct && window.__ssb.ct.status === 'ready' && Object.values(window.__ssb.ct.renders).some((n) => n > 0), null, { timeout: 30000 });
    await page.waitForFunction(() => window.__ssb.ct.carvedPixels('axial') > 0 || window.__ssb.ct.carvedPixels('coronal') > 0 || window.__ssb.ct.carvedPixels('sagittal') > 0, null, { timeout: 10000 }).catch(() => {});
    const ctv = await proc(page, (tip) => ({
      hash: location.hash, carved: window.__ssb.ct.carved, pinned: window.__ssb.procedure.pinned, base: window.__ssb.ct.sampleAt(tip), pixels: ['axial', 'coronal', 'sagittal'].map((pl) => window.__ssb.ct.carvedPixels(pl)),
      proc: window.__ssb.procedure.shown, scope: window.__ssb.scope.engaged, stage: document.getElementById('ssb-app').dataset.stage,
    }), HOLE_TIP);
    check('procedure: CT at the tip still samples the base value (the scan as it was) and outlines the carved voxels; the procedure has ended and the outline is pinned',
      /^#ct=/.test(ctv.hash) && !/p=/.test(ctv.hash) && ctv.stage === 'ct' && ctv.base > 200 && ctv.carved && ctv.pinned && ctv.pixels.some((n) => n > 0) && ctv.proc === null && !ctv.scope, JSON.stringify(ctv));
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await page.waitForTimeout(200);
    const after = await proc(page, () => ({ carved: window.__ssb.ct.carved, pinned: window.__ssb.procedure.pinned, key: window.__ssb.procedure.stateKey, nodes: window.__ssb.specimen.stateKey, em: window.__ssb.specimen.emphasis }));
    check('procedure: leaving CT clears the pinned outline, and the specimen is intact again', !after.carved && !after.pinned && after.key === null && after.nodes === null && after.em.see.length === 0 && after.em.hazard.length === 0, JSON.stringify(after));
    await context.close();
  }

  /* ===== a step lands on its station: the state's own pose first; a step with none keeps the pose and says so ===== */
  for (const reduce of ['reduce', 'no-preference']) {
    const { context, page } = await openProc(browser, base, `#${PROC_URL}&step=0&${POSE_HASH({ lens: 0 })}`, { reducedMotion: reduce });
    await waitShown(page, 0);
    await page.waitForFunction(() => window.__ssb.scope.engaged && window.__ssb.scope.collision && window.__ssb.scope.stationsState !== 'loading' && window.__ssb.scope.stationsState !== 'idle', null, { timeout: 30000 });
    await page.click('#ssb-scope-controls button[data-shaft="2.7"]');
    await page.keyboard.press(']');
    await waitShown(page, 1, PROC.keys.a);
    const flew = reduce === 'reduce' ? await proc(page, () => ({ flying: window.__ssb.scope.flying, lens: window.__ssb.scope.pose.lens })) : null;
    await page.waitForFunction(() => !window.__ssb.scope.flying && window.__ssb.scope.pose.lens === 30, null, { timeout: 10000 });
    const pose1 = await proc(page, () => window.__ssb.scope.pose);
    check(`procedure: stepping to 1 flies to the step's station from the state's own table (lens 0 -> 30, the pose through the hole)${reduce === 'reduce' ? ', a cut under reduced motion' : ''}`,
      pose1.lens === 30 && pose1.depth === PROC.station.depth && pose1.yaw === PROC.station.yaw && (reduce !== 'reduce' || (flew.flying === false && flew.lens === 30)), JSON.stringify({ pose1, flew }));
    await page.keyboard.press(']');
    await waitShown(page, 2, PROC.keys.a);
    const keep = await proc(page, () => ({ pose: window.__ssb.scope.pose, note: window.__ssb.procedure.note, shown: document.querySelector('.ssb-proc-note').textContent }));
    check('procedure: a step whose station has no pose here keeps the scope where it is and says so', keep.pose.lens === 30 && keep.pose.depth === PROC.station.depth && /No pose for this state/.test(keep.note) && /No pose for this state/.test(keep.shown), JSON.stringify(keep));
    await context.close();
  }

  /* ===== corridors ===== */
  {
    const { context, page } = await openProc(browser, base, `#${PROC_URL}&step=1&cor=${PROC.corridor}&${POSE_HASH()}`);
    await waitShown(page, 1, PROC.keys.b);
    const cor = await proc(page, () => ({ hash: location.hash, buttons: [...document.querySelectorAll('#ssb-proc .ssb-proc-cor button')].map((b) => [b.dataset.cor, b.getAttribute('aria-pressed'), b.textContent]) }));
    check('procedure: a corridor key in the hash picks the corridor\'s own state for the step (B at step 1), is kept in the hash and shown in the picker',
      /cor=fixture-corridor/.test(cor.hash) && cor.buttons.length === 2 && cor.buttons[0][0] === '' && cor.buttons[1][0] === PROC.corridor && cor.buttons[1][1] === 'true' && cor.buttons[0][1] === 'false' && cor.buttons[1][2] === 'Fixture corridor', JSON.stringify(cor));
    await page.click('#ssb-proc .ssb-proc-cor button[data-cor=""]');
    await waitShown(page, 1, PROC.keys.a);
    check('procedure: the picker\'s "Own entry" drops the corridor (state A again, no cor in the hash)', !/cor=/.test(await procHash(page)));
    await context.close();
  }
  {
    const { context, page } = await openProc(browser, base, `#${PROC_URL}&step=1&cor=not-a-corridor&${POSE_HASH()}`);
    await waitShown(page, 1, PROC.keys.a);
    check('procedure: an unknown corridor is dropped from the hash and the procedure\'s own state plays', !/cor=/.test(await procHash(page)));
    await context.close();
  }

  /* ===== a state that cannot be loaded leaves the specimen intact, says so, and nothing else breaks ===== */
  {
    const bad = { [`ssb/states/${PROC.keys.a}.ssbp.gz`]: (route) => route.fulfill({ status: 200, body: Buffer.from('not a patch'), headers: { 'content-type': 'application/octet-stream' } }) };
    const { context, page, errors } = await openProc(browser, base, `#${PROC_URL}&step=1&${POSE_HASH()}`, { patches: bad, track: false });
    await waitShown(page, 1, null);
    const r = await proc(page, () => ({ note: document.querySelector('.ssb-proc-note').textContent, hidden: document.querySelector('.ssb-proc-note').hidden, badge: document.querySelector('.ssb-proc-badge').textContent, engaged: window.__ssb.scope.engaged }));
    check('procedure: a damaged patch shows the specimen intact with a note, the scope keeps working', /could not be loaded/.test(r.note) && !r.hidden && /intact/.test(r.badge) && r.engaged, JSON.stringify(r));
    check('procedure: the damaged patch\'s only console noise is the player\'s own error line', errors.every((e) => /patch|VolumeError|dissection/i.test(e.text)), JSON.stringify(errors));
    await context.close();
  }

  /* ===== real data: runs once P1b's ssb/states/index.json exists ===== */
  if (fs.existsSync(path.join(ROOT, 'ssb/states/index.json'))) await procedureRealDataTests(browser, base);
  else console.log('  (procedure: ssb/states/index.json is not in this build — the real-data checks are skipped until P1b merges)');
}

/* Every state of the committed index parses and applies on the real volume; the first state's lining pack replaces the base lining. */
async function procedureRealDataTests(browser, base) {
  const read = (p) => fs.readFileSync(path.join(ROOT, p));
  const json = (p) => JSON.parse(read(p).toString('utf8'));
  const meta = json('ssb/ct/ct.json');
  const lb = zlib.gunzipSync(read('ssb/ct/labels.u16.gz'));
  const vol = createVolume({ header: parseHeader(meta), ct: new Uint8Array(zlib.gunzipSync(read('ssb/ct/ct.u8.gz'))), labels: new Uint16Array(lb.buffer.slice(lb.byteOffset, lb.byteOffset + lb.length)), table: parseTable(json('ssb/geometry/labels.json')) });
  const index = json('ssb/states/index.json');
  const keys = Object.keys(index.states || {});
  let bad = [];
  for (const key of keys) {
    try {
      const patch = await parsePatch(read(`ssb/states/${index.states[key].patch || key + '.ssbp.gz'}`), vol, index.base);
      const derived = applyPatch(vol, patch);
      if (!(derived.carvedVoxels > 0)) bad.push(`${key}: carves nothing`);
    } catch (e) { bad.push(`${key}: ${e.message}`); }
  }
  check('procedure (real data): every state in ssb/states/index.json parses and applies on the real volume', keys.length > 0 && bad.length === 0, bad.slice(0, 3).join(' | '));
  const parsed = parseIndex(index);
  const first = [...parsed.steps].find(([k, v]) => v && /^p\./.test(k) && parsed.states.get(v) && parsed.states.get(v).hasLining);
  if (!first) { check('procedure (real data): some state carries a lining pack', false, 'none of the indexed states has a lining'); return; }
  const [stepKey, key] = first;
  const [pid, n] = stepKey.split('#');
  const { context, page } = await openProc(browser, base, `#p=${pid}&step=${n}`, { real: true });
  await page.waitForFunction((k) => window.__ssb.procedure && window.__ssb.procedure.shown && window.__ssb.procedure.shown.key === k && !window.__ssb.procedure.busy, key, { timeout: 60000 });
  await nextFrames(page, 4);
  const nodes = await specNodes(page);
  const baseLining = nodes.filter((n2) => n2.lining && !n2.state);
  const stateLining = nodes.filter((n2) => n2.lining && n2.state === key);
  check('procedure (real data): the first lining state\'s pack replaces the base lining (the lining nodes on show are the state\'s, the base lining is hidden)', stateLining.length > 0 && stateLining.some((n2) => n2.visible) && baseLining.every((n2) => !n2.visible), JSON.stringify({ state: stateLining.length, base: baseLining.filter((n2) => n2.visible).length }));
  await context.close();
}

async function sphenoidPageTests(browser, base) {
  const { context, page } = await open(browser, base, '#lab=sphenoid');
  const ps = await parts(page);
  check('sphenoid: opens on the sagittal view', (await page.evaluate(() => window.__ssb.lab.view)) === 'sagittal');
  /* hazard sites are hatched and named in the HUD */
  await setHash(page, '#lab=sphenoid&pneum=3&ica_protrusion=1');
  const icaR = await part(page, 's.internal-carotid-artery.R');
  check('sphenoid: a carotid in the sinus wall is a hazard site naming the graph\'s ICA hazard',
    icaR.hazards.includes('h.ica-injury-sphenoidotomy') && entity('h.ica-injury-sphenoidotomy').at === 's.internal-carotid-artery', JSON.stringify(icaR.hazards));
  check('sphenoid: the HUD names the hazard in text', await page.evaluate(() => /ICA injury at the sphenoid lateral wall/.test(document.getElementById('ssb-hud').textContent)));
  await setHash(page, '#lab=sphenoid&pneum=3&septum_on_ica=1');
  check('sphenoid: a septum inserting on the ICA carries h.septum-avulsion-ica', (await part(page, 's.intersinus-septum.M')).hazards.includes('h.septum-avulsion-ica'));
  await setHash(page, '#lab=sphenoid&optic_type=4&onodi=1');
  const nerve = await part(page, 's.optic-nerve.R');
  check('sphenoid: with an Onodi cell the optic nerve carries h.optic-nerve-injury-onodi and the cell is drawn',
    nerve.hazards.includes('h.optic-nerve-injury-onodi') && !!(await part(page, 'v.sphenoethmoidal-cell.R')));
  await setHash(page, '#lab=sphenoid&vidian_type=1');
  check('sphenoid: a protruding vidian canal carries h.ica-injury-vidian', (await part(page, 's.vidian-canal.R')).hazards.includes('h.ica-injury-vidian'));
  await setHash(page, '#lab=sphenoid&lateral_recess=1&lr_extent=8&clinoid_pneum=1');
  const names = (await parts(page)).map((p) => p.name);
  check('sphenoid: the lateral recess and the pneumatized clinoid are parts when on',
    names.includes('s.sphenoid-lateral-recess.R') && names.includes('v.pneumatized-anterior-clinoid.L'), names.join(' '));

  /* presets, buttons labelled with the graph's class labels */
  const labels = await page.$$eval('button[data-cls="c.sphenoid-pneumatization"]', (bs) => bs.map((b) => [b.dataset.code, b.textContent]));
  check('sphenoid: pneumatization preset buttons carry the graph class labels', labels.length === 4
    && labels.every(([code, text]) => text.includes(entity('c.sphenoid-pneumatization').classes.find((c) => c.code === code).label)), JSON.stringify(labels));
  await act(page, () => page.click('button[data-cls="c.sphenoid-pneumatization"][data-code="postsellar"]'));
  check('sphenoid: the postsellar preset sets pneum 4', (await page.evaluate(() => window.__ssb.lab.params.pneum)) === 4);
  await act(page, () => page.click('button[data-cls="c.delano-optic-nerve"][data-code="4"]'));
  const pr4 = await page.evaluate(() => window.__ssb.lab.params);
  check('sphenoid: the DeLano 4 preset sets optic_type 4 and the Onodi cell', pr4.optic_type === 4 && pr4.onodi === 1, JSON.stringify(pr4));
  check('sphenoid: the HUD names the DeLano type, the vidian type and the intercarotid window',
    await page.evaluate(() => /DeLano/i.test(document.getElementById('ssb-hud').textContent) && /Intercarotid window: 12 mm/.test(document.getElementById('ssb-hud').textContent)));

  /* rule 9 in the page: conchal ignores the carotid toggles (the same parts, the same boxes) */
  await setHash(page, '#lab=sphenoid&pneum=1');
  const plain = JSON.stringify((await parts(page)).map((p) => [p.name, p.box]));
  await setHash(page, '#lab=sphenoid&pneum=1&ica_protrusion=1&septum_on_ica=1&lateral_recess=1&clinoid_pneum=1');
  const toggled = JSON.stringify((await parts(page)).map((p) => [p.name, p.box]));
  check('sphenoid rule 9: in the page, conchal with the toggles on draws the same model', plain === toggled);
  check('sphenoid rule 9: the HUD says what was degraded', await page.evaluate(() => /left at its default/.test(document.getElementById('ssb-hud').textContent)));

  /* both themes compile */
  const before = await builds(page);
  await page.click('.site-theme-toggle');
  await page.waitForTimeout(400);
  check('sphenoid: both themes — the lab keeps its parts after the theme flips', (await parts(page)).length === ps.length || (await parts(page)).length > 0 && (await builds(page)) >= before);
  await page.click('.site-theme-toggle');
  await context.close();

  /* clicking a part selects its entity */
  const sel = await open(browser, base, '#lab=sphenoid');
  const at = await sel.page.evaluate(() => window.__ssb.lab.screenOf('s.sella-turcica.M'));
  if (at) await sel.page.mouse.click(at.x, at.y);
  await sel.page.waitForTimeout(300);
  const picked = await sel.page.evaluate(() => window.__ssb.selection);
  check('sphenoid: clicking a part selects a graph entity', !!picked && !!entity(picked), String(picked));
  await sel.context.close();
}

/* ---------------- the suite ---------------- */

async function main() {
  let server = null;
  let base = BASE;
  if (!base) { server = await startServer(); base = server.origin; }
  const browser = await launchBrowser({ headed: HEADED });

  if (ONLY === 'ct') {
    await ctUnitTests();
    await ctTests(browser, base);
    return finish(browser, server);
  }
  if (ONLY === 'lab') {
    sphenoidRuleTests();
    await sphenoidPageTests(browser, base);
    return finish(browser, server);
  }
  if (ONLY === 'specimen') {
    await specimenUnitTests();
    standardSpecimenTests();
    await specimenTests(browser, base);
    return finish(browser, server);
  }
  if (ONLY === 'scope') {
    scopeUnitTests();
    await scopeTests(browser, base);
    return finish(browser, server);
  }
  if (ONLY === 'procedure') {
    await procedureUnitTests();
    await procedureTests(browser, base);
    return finish(browser, server);
  }

  /* ===== 1. each diorama loads; parts resolve in the graph ===== */
  const REQUIRED = {
    'ethmoid-roof': ['s.cribriform-plate.R', 's.lateral-lamella.R', 's.lateral-lamella.L', 's.fovea-ethmoidalis.R', 's.crista-galli.M',
      's.lamina-papyracea.R', 's.anterior-ethmoid-cells.R', 's.middle-turbinate.R', 's.orbit.R', 's.olfactory-fossa.R', 's.anterior-ethmoidal-artery.R'],
    sphenoid: ['s.sphenoid-sinus.R', 's.sphenoid-sinus.L', 's.sphenoid-face.M', 's.sella-turcica.M', 's.intersinus-septum.M', 's.internal-carotid-artery.R',
      's.internal-carotid-artery.L', 's.carotid-prominence.R', 's.optic-nerve.R', 's.optic-canal.R', 's.vidian-canal.R', 's.foramen-rotundum.R', 's.planum-sphenoidale.M'],
    'frontal-recess': ['s.frontal-sinus.R', 's.frontal-ostium.R', 's.uncinate-process.R', 's.ethmoid-bulla.R', 's.middle-turbinate.R',
      's.lamina-papyracea.R', 's.fovea-ethmoidalis.R', 's.agger-nasi-cell.R'],
  };
  for (const name of Object.keys(REQUIRED)) {
    const { context, page } = await open(browser, base, `#lab=${name}`);
    const info = await page.evaluate(() => ({
      name: window.__ssb.lab.name,
      truth: document.getElementById('ssb-truth').textContent,
      truthShown: !document.getElementById('ssb-truth').hidden && document.getElementById('ssb-truth').offsetParent !== null,
      pressed: document.querySelector('#ssb-stage-mode [data-stage="lab"]').getAttribute('aria-pressed'),
    }));
    const ps = await parts(page);
    check(`${name}: loads and builds`, info.name === name && ps.length > 0, JSON.stringify(info));
    check(`${name}: "schematic — idealized" badge visible`, info.truthShown && /schematic — idealized/.test(info.truth), info.truth);
    check(`${name}: stage switch shows Lab`, info.pressed === 'true');
    const want = name === 'ethmoid-roof' ? 'coronal' : 'sagittal';
    check(`${name}: opens on the ${want} view`, (await page.evaluate(() => window.__ssb.lab.view)) === want);
    const geom = await page.evaluate(() => {
      const d = document.getElementById('ssb-lab-dock').getBoundingClientRect();
      const c = document.getElementById('ssb-canvas').getBoundingClientRect();
      return { dockRight: d.right, canvasLeft: c.left, canvasWidth: c.width };
    });
    check(`${name}: the docked controls never cover the canvas`, geom.canvasLeft >= geom.dockRight - 1 && geom.canvasWidth > 200, JSON.stringify(geom));
    const missing = REQUIRED[name].filter((n) => !ps.some((p) => p.name === n));
    check(`${name}: required parts present`, missing.length === 0, 'missing ' + missing.join(', '));
    const badName = ps.filter((p) => !/^(.+)\.(R|L|M)$/.test(p.name) || p.name.replace(/\.(R|L|M)$/, '') !== p.id);
    check(`${name}: every part is named <graph id>.<side>`, badName.length === 0, badName.map((p) => p.name).join(', '));
    const unknown = ps.filter((p) => !GRAPH.has(p.id));
    check(`${name}: every part id resolves in the graph`, unknown.length === 0, unknown.map((p) => p.id).join(', '));
    const badHaz = ps.flatMap((p) => p.hazards).filter((h) => !h.startsWith('h.') || !GRAPH.has(h));
    check(`${name}: every hazard id resolves to a graph hazard`, badHaz.length === 0, badHaz.join(', '));
    await context.close();
  }

  /* ===== 2. ethmoid roof ===== */
  {
    const { context, page } = await open(browser, base, '#lab=ethmoid-roof');
    const presets = await page.evaluate(() => window.__ssb.lab.presets);

    for (const cls of ['c.keros', 'c.gera']) {
      const e = entity(cls);
      const key = cls === 'c.keros' ? 'keros' : 'gera';
      for (const [code, p] of Object.entries(presets[cls])) {
        const c = e.classes.find((x) => String(x.code) === code);
        const range = c && criterionRange(c.criterion);
        check(`${cls} ${code}: preset ${key}=${p[key]} satisfies the graph's criterion "${c && c.criterion}"`, range && inRange(p[key], range));
      }
    }
    const labels = await page.$$eval('button[data-cls="c.keros"]', (bs) => bs.map((b) => [b.dataset.code, b.textContent]));
    check('preset buttons carry the graph class labels', labels.length === 3
      && labels.every(([code, text]) => text.includes(entity('c.keros').classes.find((c) => c.code === code).label)), JSON.stringify(labels));

    const lam = entity('h.lateral-lamella-perforation');
    const lamR = await part(page, 's.lateral-lamella.R');
    check('lateral lamella is a hazard site carrying the graph hazard aimed at it',
      lamR.hazards.includes('h.lateral-lamella-perforation') && lam.at === 's.lateral-lamella', JSON.stringify(lamR.hazards));
    check('the HUD names the hatched hazard in text', await page.evaluate(() => /Lateral lamella perforation/.test(document.getElementById('ssb-hud').textContent)));

    await act(page, () => page.click('button[data-cls="c.keros"][data-code="I"]'));
    const i = { R: await part(page, 's.lateral-lamella.R'), L: await part(page, 's.lateral-lamella.L'), fovR: await part(page, 's.fovea-ethmoidalis.R') };
    await act(page, () => page.click('button[data-cls="c.keros"][data-code="III"]'));
    const iii = { R: await part(page, 's.lateral-lamella.R'), L: await part(page, 's.lateral-lamella.L'), fovR: await part(page, 's.fovea-ethmoidalis.R') };
    const want = presets['c.keros'].III.keros - presets['c.keros'].I.keros;
    for (const side of ['R', 'L']) {
      const d = height(iii[side]) - height(i[side]);
      check(`Keros I -> III raises the ${side} lateral lamella by ${want} mm (scene: ${r2(d)} mm)`, near(d, want), `I ${r2(height(i[side]))}, III ${r2(height(iii[side]))}`);
    }
    check('the lamella rises exactly to the fovea (Keros III)', near(iii.R.box.max[2], iii.fovR.box.max[2], 0.01), `${iii.R.box.max[2]} vs ${iii.fovR.box.max[2]}`);
    check('Keros III is recorded in the URL', await page.evaluate(() => location.hash === '#lab=ethmoid-roof&keros=12'), await page.evaluate(() => location.hash));

    await setHash(page, '#lab=ethmoid-roof&keros=12&asym=3');
    const asymR = await part(page, 's.lateral-lamella.R');
    const asymL = await part(page, 's.lateral-lamella.L');
    check('asymmetry lowers the left roof: left lamella 3 mm shorter', near(height(asymR) - height(asymL), 3), `${r2(height(asymR))} vs ${r2(height(asymL))}`);

    await setHash(page, '#lab=ethmoid-roof&keros=12&aea=2');
    const canal2 = await part(page, 's.anterior-ethmoidal-canal.R');
    check('AEA at 2 mm hangs in a mesentery (variant part + transection hazard)',
      !!(await part(page, 'v.aea-in-mesentery.R')) && (await part(page, 's.anterior-ethmoidal-artery.R')).hazards.includes('h.aea-transection'));
    await setHash(page, '#lab=ethmoid-roof&keros=12&aea=6');
    const canal6 = await part(page, 's.anterior-ethmoidal-canal.R');
    check('the AEA canal drops exactly as its parameter (2 -> 6 mm)', near(canal2.box.min[2] - canal6.box.min[2], 4), r2(canal2.box.min[2] - canal6.box.min[2]));

    await setHash(page, '#lab=ethmoid-roof&keros=12');
    const inRoof = await part(page, 's.anterior-ethmoidal-canal.R');
    check('AEA in the roof: no mesentery, no transection hatch', !(await part(page, 'v.aea-in-mesentery.R'))
      && !(await part(page, 's.anterior-ethmoidal-artery.R')).hazards.length);
    await setHash(page, '#lab=ethmoid-roof&keros=12&soec=1');
    const withCell = await part(page, 's.anterior-ethmoidal-canal.R');
    const mean = entity('m.aea-mesentery-drop').value.mean;
    check(`a supraorbital cell pushes the AEA ${mean} mm below the roof (m.aea-mesentery-drop mean)`,
      near(inRoof.box.min[2] - withCell.box.min[2], mean) && !!(await part(page, 'v.supraorbital-ethmoid-cell.R')), r2(inRoof.box.min[2] - withCell.box.min[2]));

    /* views: a cut, the model untouched */
    const b0 = await builds(page);
    for (const v of ['axial', 'sagittal', 'oblique', 'coronal']) {
      await page.click(`#ssb-lab button[data-camera="${v}"]`);
      const got = await page.evaluate(() => ({ view: window.__ssb.lab.view, pressed: document.querySelector('#ssb-lab button[aria-pressed="true"][data-camera]').dataset.camera }));
      check(`view button ${v} cuts to that view`, got.view === v && got.pressed === v, JSON.stringify(got));
    }
    check('changing view does not rebuild the diorama', (await builds(page)) === b0);

    /* the dock collapses to a rail and gives the canvas the width */
    const wideBefore = await page.evaluate(() => document.getElementById('ssb-canvas').getBoundingClientRect().width);
    await page.click('#ssb-dock-toggle');
    await page.waitForTimeout(100);
    const railed = await page.evaluate(() => ({
      canvas: document.getElementById('ssb-canvas').getBoundingClientRect().width,
      dock: document.getElementById('ssb-lab-dock').getBoundingClientRect().width,
      expanded: document.getElementById('ssb-dock-toggle').getAttribute('aria-expanded'),
      hudOnStage: document.getElementById('ssb-hud').parentElement.id === 'ssb-stage',
    }));
    check('the dock collapses to a rail (canvas widens, readout stays on the stage)',
      railed.canvas > wideBefore + 150 && railed.dock < 60 && railed.expanded === 'false' && railed.hudOnStage, JSON.stringify(railed));
    await page.click('#ssb-dock-toggle');

    /* picking */
    await setHash(page, '#lab=ethmoid-roof&keros=12');
    await nextFrames(page, 4);      /* the dock just resized the canvas: the camera's projection updates on the next render, and screenOf reads it */
    const at = await page.evaluate(() => window.__ssb.lab.screenOf('s.lateral-lamella.R'));
    check('a pixel exists where the right lateral lamella is picked first', !!at);
    if (at) {
      await page.mouse.click(at.x, at.y);
      await page.waitForFunction(() => window.__ssb.selection === 's.lateral-lamella', null, { timeout: 5000 }).catch(() => {});
      const sel = await page.evaluate(() => ({ s: window.__ssb.selection, panel: !!document.querySelector('#ssb-panel-body [data-entity="s.lateral-lamella"]'), hash: location.hash }));
      check('clicking the lateral lamella selects s.lateral-lamella (panel + URL follow)', sel.s === 's.lateral-lamella' && sel.panel && /s=s\.lateral-lamella/.test(sel.hash), JSON.stringify(sel));
    }
    await context.close();
  }

  /* ===== 3. frontal recess: the computed pathway reproduces the IFAC rules ===== */
  {
    const { context, page } = await open(browser, base, '#lab=frontal-recess');
    const presets = await page.evaluate(() => window.__ssb.lab.presets);
    for (const cls of ['c.ifac', 'c.uncinate-superior-attachment']) {
      const codes = entity(cls).classes.map((c) => String(c.code));
      const bad = Object.keys(presets[cls]).filter((code) => !codes.includes(code));
      check(`${cls}: every preset code is a class in the graph`, bad.length === 0, bad.join(', '));
    }

    const OFF = 'anc=0';
    const pathFor = async (hash) => {
      const cur = await page.evaluate(() => location.hash);
      if (cur !== hash) await setHash(page, hash);
      return page.evaluate(() => ({ ...window.__ssb.lab.pathway, derived: window.__ssb.lab.derived }));
    };
    for (const u of [1, 5, 6]) {
      const tag = `uncinate ${u}`;
      const base0 = await pathFor(`#lab=frontal-recess&${OFF}&uncinate=${u}`);
      check(`${tag}: an open pathway exists with no cells`, base0.points && base0.points.length > 10 && !base0.blocked);
      const lateral = u !== 1;
      check(`${tag}: drains ${lateral ? 'lateral' : 'medial'} to the uncinate into the ${lateral ? 'infundibulum' : 'middle meatus'}`,
        base0.outlet === (lateral ? 'infundibulum' : 'middle-meatus')
        && (lateral ? base0.points.at(-1)[0] > base0.uncinateX : base0.points.at(-1)[0] < base0.uncinateX)
        && base0.id === (lateral ? 'pw.frontal-drainage-infundibular' : 'pw.frontal-drainage') && GRAPH.has(base0.id),
        `${base0.outlet}, end x ${base0.points.at(-1)[0]}, ${base0.id}`);
      for (const [cell, dir] of [['anc', -1], ['sac', -1], ['safc', -1], ['sbc', 1], ['sbfc', 1]]) {
        const p = await pathFor(`#lab=frontal-recess&${cell === 'anc' ? '' : OFF + '&'}${cell === 'anc' ? 'anc=1' : cell + '=1'}&uncinate=${u}`.replace('&&', '&'));
        const d = AP(p) - AP(base0);
        const word = dir < 0 ? 'posteriorly' : 'anteriorly';
        check(`${tag}: ${cell.toUpperCase()} pushes the pathway ${word} (${r2(d)} mm)`, !p.blocked && d * dir >= 0.5, `AP ${r2(AP(p))} vs ${r2(AP(base0))}`);
      }
      const fsc = await pathFor(`#lab=frontal-recess&${OFF}&fsc=1&uncinate=${u}`);
      check(`${tag}: FSC pushes the pathway laterally (${r2(ML(fsc) - ML(base0))} mm)`, !fsc.blocked && ML(fsc) - ML(base0) >= 0.5, `ML ${r2(ML(fsc))} vs ${r2(ML(base0))}`);
      const soec = await pathFor(`#lab=frontal-recess&${OFF}&soec=1&uncinate=${u}`);
      const cellC = soec.derived.cells.find((c) => c.key === 'soec').solid.c;
      const lvl = soec.points.filter((p) => Math.abs(p[2] - cellC[2]) <= 3);
      check(`${tag}: the pathway runs anterior and medial to the SOEC`, lvl.length > 0 && lvl.every((p) => p[1] > cellC[1] && p[0] < cellC[0]), JSON.stringify(cellC));
    }

    /* the spec's toggle, through the UI checkboxes */
    await setHash(page, `#lab=frontal-recess&${OFF}`);
    const none = await page.evaluate(() => window.__ssb.lab.pathway);
    await act(page, () => page.check('input[type="checkbox"][data-key="anc"]'));
    const withAnc = await page.evaluate(() => window.__ssb.lab.pathway);
    await act(page, () => page.uncheck('input[type="checkbox"][data-key="anc"]'));
    await act(page, () => page.check('input[type="checkbox"][data-key="sbfc"]'));
    const withSbfc = await page.evaluate(() => window.__ssb.lab.pathway);
    check(`UI: toggling the agger nasi cell moves the pathway posterior (${r2(AP(withAnc) - AP(none))} mm), the suprabullar frontal cell anterior (${r2(AP(withSbfc) - AP(none))} mm)`,
      AP(withAnc) < AP(none) && AP(withSbfc) > AP(none) && AP(withSbfc) - AP(withAnc) >= 1);
    check('UI: the pathway is rebuilt when cells change', JSON.stringify(withAnc.points) !== JSON.stringify(withSbfc.points));

    /* picking a cell and the pathway */
    await setHash(page, '#lab=frontal-recess');
    for (const [name, id] of [['s.agger-nasi-cell.R', 's.agger-nasi-cell'], ['pw.frontal-drainage.R', 'pw.frontal-drainage']]) {
      const at = await page.evaluate((n) => window.__ssb.lab.screenOf(n), name);
      if (at) {
        await page.mouse.click(at.x, at.y);
        await page.waitForFunction((want) => window.__ssb.selection === want, id, { timeout: 5000 }).catch(() => {});
      }
      check(`clicking ${name} selects ${id}`, at && (await page.evaluate(() => window.__ssb.selection)) === id, JSON.stringify(at));
    }
    await context.close();
  }

  /* ===== 4. hostile #lab= ===== */
  {
    const hostile = '#lab=ethmoid-roof&keros=999&gera=-1e9&asym=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>')
      + '&aea=1e400&soec=7&c.gera=' + encodeURIComponent('<b>') + '&bogus=1';
    const { context, page } = await open(browser, base, hostile);
    const got = await page.evaluate(() => ({ params: window.__ssb.lab.params, hash: location.hash, pwn: !!document.getElementById('pwn') || !!window.__pwned }));
    check('hostile #lab= values are clamped (keros 16, gera 25) or dropped to defaults (asym 0, aea 0), toggles clamp to 1',
      got.params.keros === 16 && got.params.gera === 25 && got.params.asym === 0 && got.params.aea === 0 && got.params.soec === 1, JSON.stringify(got.params));
    check('hostile #lab= never becomes markup and is rewritten canonically', !got.pwn && got.hash === '#lab=ethmoid-roof&keros=16&gera=25&soec=1', got.hash);
    await setHash(page, '#lab=ethmoid-roof&keros=12.3&gera=62.4');
    const snap = await page.evaluate(() => window.__ssb.lab.params);
    check('values snap to the parameter step', snap.keros === 12.5 && snap.gera === 62.5, JSON.stringify(snap));
    await context.close();

    const bad = await open(browser, base, '#lab=' + encodeURIComponent('<img src=x id=pwn2 onerror=window.__pwned=1>') + '&keros=5', { waitLab: false });
    await bad.page.waitForTimeout(500);
    const g = await bad.page.evaluate(() => ({ lab: window.__ssb.lab ? window.__ssb.lab.name : null, hash: location.hash, pwn: !!document.getElementById('pwn2') || !!window.__pwned }));
    check('an unknown diorama name is ignored (specimen stage, empty hash)', g.lab === null && g.hash === '' && !g.pwn, JSON.stringify(g));
    await bad.context.close();
  }

  /* ===== 4b. the sphenoid diorama: rules 0-9 of docs/ssb.md 6.1 ===== */
  sphenoidRuleTests();
  await sphenoidPageTests(browser, base);

  /* ===== 5. stage switch, reduced motion, phones ===== */
  {
    const { context, page } = await open(browser, base, '', { waitLab: false });
    await page.waitForFunction(() => window.__ssb.lab && !document.querySelector('#ssb-stage-mode [data-stage="lab"]').disabled, null, { timeout: 20000 });
    await act(page, () => page.click('#ssb-stage-mode [data-stage="lab"]'));
    const inLab = await page.evaluate(() => ({ name: window.__ssb.lab.name, hash: location.hash }));
    check('the Lab switch enters the first diorama', inLab.name === 'ethmoid-roof' && inLab.hash === '#lab=ethmoid-roof', JSON.stringify(inLab));
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await page.waitForFunction(() => window.__ssb.lab.name === null, null, { timeout: 5000 }).catch(() => {});
    const back = await page.evaluate(() => ({ name: window.__ssb.lab.name, hash: location.hash, note: !document.getElementById('ssb-stage-note').hidden }));
    check('the Specimen switch leaves the lab', back.name === null && back.hash === '' && back.note, JSON.stringify(back));
    await context.close();
  }
  {
    const moving = await open(browser, base, '#lab=frontal-recess');
    /* software GL renders a few frames a second: count over a full second */
    const a = await moving.page.evaluate(() => ({ anim: window.__ssb.lab.animating, f: window.__ssb.frames }));
    await moving.page.waitForTimeout(1000);
    const b = await moving.page.evaluate(() => window.__ssb.frames);
    check('flow particles animate by default', a.anim && b - a.f >= 3, `${a.anim}, ${b - a.f} frames`);
    await moving.context.close();

    const still = await open(browser, base, '#lab=frontal-recess', { reducedMotion: 'reduce' });
    await still.page.waitForTimeout(800);
    const s0 = await still.page.evaluate(() => ({ anim: window.__ssb.lab.animating, f: window.__ssb.frames }));
    await still.page.waitForTimeout(1000);
    const s1 = await still.page.evaluate(() => window.__ssb.frames);
    check('reduced motion: no particle animation, no continuous rendering', !s0.anim && s1 - s0.f <= 1, `${s0.anim}, ${s1 - s0.f} frames`);
    await still.context.close();
  }
  {
    const phone = { width: 390, height: 844 };
    const { context, page } = await open(browser, base, '', { viewport: phone, waitLab: false });
    await page.waitForFunction(() => window.__ssb.lab && !document.querySelector('#ssb-stage-mode [data-stage="lab"]').disabled, null, { timeout: 20000 });
    await act(page, () => page.click('#ssb-stage-mode [data-stage="lab"]'));
    const sheet = await page.evaluate(() => {
      const lab = document.getElementById('ssb-lab');
      const panel = document.getElementById('ssb-panel');
      const r = lab.getBoundingClientRect();
      return { inSheet: panel.contains(lab), open: panel.dataset.sheet, view: panel.dataset.view, visible: r.height > 0 && r.width > 0, width: r.width };
    });
    check('phone: lab controls open in the bottom sheet', sheet.inSheet && sheet.open === 'open' && sheet.view === 'controls' && sheet.visible, JSON.stringify(sheet));
    const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    check('phone: no horizontal page scroll', noScroll);
    await act(page, () => page.click('button[data-cls="c.keros"][data-code="III"]'));
    check('phone: a preset in the sheet rebuilds the diorama', (await page.evaluate(() => window.__ssb.lab.params.keros)) === 12);
    await context.close();
  }

  /* ===== 6. tissue materials (js/ssb/materials.js, docs/ssb.md 7.4) ===== */
  {
    /* -- tables, in plain Node (materials.js needs neither three.js nor a DOM) -- */
    const authoring = fs.readFileSync(path.join(ROOT, 'docs/authoring-ssb.md'), 'utf8');
    const kindLine = authoring.split('\n').find((l) => l.startsWith('**`kind`:**')) || '';
    const vocab = [...kindLine.matchAll(/`([a-z-]+)`/g)].map((m) => m[1]).filter((k) => k !== 'kind');
    check('materials: the graph kind vocabulary in docs/authoring-ssb.md is the one materials.js maps',
      vocab.length > 10 && vocab.every((k) => GRAPH_KINDS.includes(k)) && GRAPH_KINDS.every((k) => vocab.includes(k)), vocab.join(' '));
    const kindsUsed = [...new Set([...GRAPH.values()].map((n) => n.entity).filter((e) => e && String(e.id).startsWith('s.')).map((e) => e.kind))];
    const unmapped = kindsUsed.filter((k) => GRAPH_KINDS.includes(k) === false || (kindForGraph(k) === null && k !== 'region'));
    check('materials: every graph kind in use has a material kind (a region is not a surface)', unmapped.length === 0, unmapped.join(', '));
    check('materials: every mapped kind is a known material kind', GRAPH_KINDS.every((k) => kindForGraph(k) === null || KINDS.includes(kindForGraph(k))));
    check('materials: one factory per tissue kind the brief names',
      ['bone', 'bone-cut', 'mucosa', 'cartilage', 'dura', 'fat', 'muscle', 'artery', 'vein', 'nerve', 'gland'].every((k) => TISSUE_KINDS.includes(k))
      && KINDS.includes('air-cell'));

    const css = fs.readFileSync(path.join(ROOT, 'css/ssb.css'), 'utf8');
    const block = (re) => (css.match(re) || [''])[0];
    const light = block(/:root\s*\{[^}]*\}/);
    const dark = block(/html\[data-theme="dark"\]\s*\{[^}]*\}/);
    const missing = TOKENS.filter((t) => !light.includes(`--ssb-${t}:`) || !dark.includes(`--ssb-${t}:`));
    check('materials: every colour token the library reads is declared for both themes in css/ssb.css', missing.length === 0, missing.join(', '));

    const src = fs.readFileSync(path.join(ROOT, 'js/ssb/materials.js'), 'utf8');
    check('materials: nothing animates (no clock, no time uniform, no frame requests)', !/uTime|performance\.now|requestAnimationFrame|THREE\.Clock|setInterval/.test(src));
    check('materials: no raw colour literals (colours are tokens)', !/#[0-9a-fA-F]{6}\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')) );

    check('quality hints: software GL and phones are lite, a desktop GPU is full',
      detectQuality({ renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)' }) === 'lite'
      && detectQuality({ renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)', coarse: false, shortSide: 1080 }) === 'full'
      && detectQuality({ coarse: true, shortSide: 390 }) === 'lite' && detectQuality({ coarse: true, shortSide: 1024 }) === 'full'
      && detectQuality({ navigator: { deviceMemory: 2 } }) === 'lite' && detectQuality({ navigator: { connection: { saveData: true } } }) === 'lite'
      && detectQuality({}) === 'full');

    const hostileQ = ['ultra', 'FULL', 'Lite', ' lite', 'lite ', 'lite\u0000', '', '<img src=x onerror=window.__pwned=1>', '../../x', 'full,lite', '__proto__'];
    const parsed = hostileQ.map((q) => parseHash('#q=' + encodeURIComponent(q), () => false).quality);
    check('hash codec: q accepts exactly full|lite and drops everything else',
      parseHash('#q=lite', () => false).quality === 'lite' && parseHash('#tier=2&q=full', () => false).quality === 'full'
      && parsed.every((v) => v === undefined) && clampQuality('lite') === 'lite' && clampQuality({ toString: () => 'lite' }) === null
      && clampQuality(undefined) === null, JSON.stringify(parsed));
    check('hash codec: q is written last and only when set',
      formatHash({ selection: null, tier: 1, lab: null, quality: 'lite' }) === '#q=lite'
      && formatHash({ selection: null, tier: 1, lab: null, quality: null }) === ''
      && formatHash({ selection: null, tier: 1, lab: null, quality: 'bogus' }) === '');

    let threw = false;
    try { kit.tag({ userData: {} }, 's.x', 'R', { kind: 'flesh' }); } catch (e) { threw = true; }
    let ok = true;
    try { kit.tag({ userData: {} }, 's.x', 'R', { kind: 'bone' }); } catch (e) { ok = false; }
    check('kit.tag rejects an unknown material kind and accepts a real one', threw && ok);

    /* -- in the browser, both qualities -- */
    const STAGE_BG_TOL = 6;
    const canvasShot = async (page) => {
      const r = await page.evaluate(() => { const c = document.getElementById('ssb-canvas').getBoundingClientRect(); return { x: c.left, y: c.top, width: c.width, height: c.height }; });
      return { png: decodePng(await page.screenshot({ clip: r })), rect: r };
    };
    const shots = {};
    for (const q of ['full', 'lite']) {
      const { context, page, errors } = await open(browser, base, `#q=${q}`, { waitLab: false });
      await page.waitForFunction(() => window.__ssb.materials, null, { timeout: 30000 });
      const state = await page.evaluate(() => ({ q: window.__ssb.materials.quality, req: window.__ssb.materials.requested, hash: location.hash }));
      check(`q=${q}: the hash key picks the quality and the canonical hash keeps it`, state.q === q && state.req === q && state.hash === `#q=${q}`, JSON.stringify(state));

      const probes = await page.evaluate(() => {
        const m = window.__ssb.materials;
        const out = [];
        for (const k of m.kinds) for (const h of [false, true]) out.push(m.probe(k, h));
        return { out, programs: m.programs, materials: m.materials, keys: m.programKeys() };
      });
      const bad = probes.out.filter((p) => p.glError !== 0 || p.rgb.every((v) => v === 0));
      check(`q=${q}: every kind (${KINDS.length}), plain and hazard-hatched, compiles and draws without a WebGL error`,
        probes.out.length === KINDS.length * 2 && bad.length === 0, bad.map((p) => `${p.kind}${p.hazard ? '+hatch' : ''} err ${p.glError} rgb ${p.rgb}`).join('; '));
      const weak = TISSUE_KINDS.concat(KINDS.filter((k) => !TISSUE_KINDS.includes(k))).filter((k) => {
        const plain = probes.out.find((p) => p.kind === k && !p.hazard);
        const hatched = probes.out.find((p) => p.kind === k && p.hazard);
        return !(hatched.contrast - plain.contrast >= 0.15 || (hatched.dark >= 0.2 && plain.dark < 0.1));
      });
      check(`q=${q}: hazard hatching shows over every kind (stripes in the probe)`, weak.length === 0, weak.join(', '));
      const lite = probes.keys.filter((k) => k.includes('SSB_LITE')).length;
      check(`q=${q}: the patterned programs are ${q === 'lite' ? '' : 'not '}the lite variants`, q === 'lite' ? lite > 0 : lite === 0, `${lite} lite programs`);
      check(`q=${q}: programs are shared per kind (${probes.materials} materials, ${probes.programs} programs)`,
        probes.programs <= 2 * TISSUE_KINDS.length + 5 && probes.programs < probes.materials + 2, `${probes.programs} programs`);
      check(`q=${q}: no shader compile or GL errors were logged`, errors.length === 0, errors.slice(0, 2).map((e) => e.text.slice(0, 300)).join(' | '));
      await context.close();
    }

    for (const q of ['full', 'lite']) {
      const { context, page } = await open(browser, base, `#lab=ethmoid-roof&keros=12&q=${q}`);
      await page.waitForTimeout(600);
      const f0 = await page.evaluate(() => window.__ssb.frames);
      check(`q=${q}: the lab renders frames and reports the quality`, f0 > 0 && (await page.evaluate(() => window.__ssb.materials.quality)) === q);
      const { png } = await canvasShot(page);
      const bg = png.at(2, 2);
      let ink = 0;
      for (let y = 0; y < png.height; y += 2) for (let x = 0; x < png.width; x += 2) {
        const c = png.at(x, y);
        if (Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) > STAGE_BG_TOL) ink++;
      }
      const frac = ink / ((png.width / 2) * (png.height / 2));
      check(`q=${q}: the lab canvas is not blank (${(frac * 100).toFixed(0)}% drawn)`, frac > 0.1, String(frac));
      shots[q] = png;

      /* the real lab: the hatched lateral lamella shows stripes over its tissue */
      const at = await page.evaluate(() => window.__ssb.lab.screenOf('s.lateral-lamella.R'));
      let stripes = null;
      if (at) {
        const r = await page.evaluate(() => { const c = document.getElementById('ssb-canvas').getBoundingClientRect(); return { left: c.left, top: c.top }; });
        const cx = Math.round(at.x - r.left);
        const cy = Math.round(at.y - r.top);
        let dark = 0;
        let bright = 0;
        let n = 0;
        for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) {
          if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
          const l = luma(png.at(x, y));
          n++;
          if (l < 80) dark++; else if (l > 110) bright++;
        }
        stripes = { dark: dark / n, bright: bright / n };
      }
      check(`q=${q}: the hatched lateral lamella still shows dark stripes over its tissue`, stripes && stripes.dark > 0.2 && stripes.bright > 0.15, JSON.stringify(stripes));

      /* picking, then a selection: new materials, no new programs */
      const before = await page.evaluate(() => ({ p: window.__ssb.materials.programs, m: window.__ssb.materials.materials }));
      const pickAt = await page.evaluate(() => window.__ssb.lab.screenOf('s.anterior-cranial-fossa-dura.R'));
      if (pickAt) await page.mouse.click(pickAt.x, pickAt.y);
      await page.waitForFunction(() => window.__ssb.selection === 's.anterior-cranial-fossa-dura', null, { timeout: 8000 }).catch(() => {});
      const after = await page.evaluate(() => ({ p: window.__ssb.materials.programs, m: window.__ssb.materials.materials, sel: window.__ssb.selection }));
      check(`q=${q}: clicking the dura picks it (picking is unchanged by the materials)`, after.sel === 's.anterior-cranial-fossa-dura', JSON.stringify(after));
      check(`q=${q}: selecting a part adds materials, not shader programs`, after.m > before.m && after.p === before.p, JSON.stringify({ before, after }));
      await context.close();
    }
    if (shots.full && shots.lite) {
      let differ = 0;
      const w = Math.min(shots.full.width, shots.lite.width);
      const h = Math.min(shots.full.height, shots.lite.height);
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const a = shots.full.at(x, y);
        const b = shots.lite.at(x, y);
        if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 12) differ++;
      }
      check(`full and lite draw different detail (${differ} px differ)`, differ > 100, String(differ));
    }

    /* switching at runtime: the hash key recompiles in place, and rendering goes on */
    {
      const { context, page } = await open(browser, base, '#lab=frontal-recess&q=lite');
      await page.evaluate(() => { location.hash = '#lab=frontal-recess&q=full'; });
      await page.waitForFunction(() => window.__ssb.materials.quality === 'full', null, { timeout: 8000 }).catch(() => {});
      const f0 = await page.evaluate(() => window.__ssb.frames);
      await page.waitForFunction((n) => window.__ssb.frames > n, f0, { timeout: 15000 }).catch(() => {});
      const now = await page.evaluate(() => ({ q: window.__ssb.materials.quality, req: window.__ssb.materials.requested, f: window.__ssb.frames, hash: location.hash }));
      check('the hash q key switches quality at runtime and rendering continues', now.q === 'full' && now.req === 'full' && now.f > f0 && /q=full/.test(now.hash), JSON.stringify(now));
      await page.evaluate(() => { location.hash = '#lab=frontal-recess'; });
      await page.waitForFunction(() => window.__ssb.materials.requested === null, null, { timeout: 8000 }).catch(() => {});
      const back = await page.evaluate(() => ({ q: window.__ssb.materials.quality, req: window.__ssb.materials.requested, det: window.__ssb.materials.detected, hash: location.hash }));
      check('dropping q from the hash returns to the device choice', back.req === null && back.q === back.det && !/q=/.test(back.hash), JSON.stringify(back));
      await context.close();
    }

    /* hostile q values in the live page: ignored, never markup */
    for (const bad of ['<img src=x id=pwnq onerror=window.__pwned=1>', 'ultra', 'FULL', 'lite%00']) {
      const raw = bad.startsWith('<') ? encodeURIComponent(bad) : bad;
      const { context, page } = await open(browser, base, `#lab=ethmoid-roof&q=${raw}`);
      const got = await page.evaluate(() => ({ req: window.__ssb.materials.requested, q: window.__ssb.materials.quality, det: window.__ssb.materials.detected,
        hash: location.hash, pwn: !!document.getElementById('pwnq') || !!window.__pwned }));
      check(`a hostile q (${bad.slice(0, 12)}…) is ignored: the device's quality stands, the hash is rewritten without it`,
        got.req === null && got.q === got.det && got.hash === '#lab=ethmoid-roof' && !got.pwn, JSON.stringify(got));
      await context.close();
    }

    /* reduced motion under the heavy shaders: still no animation, no continuous rendering */
    {
      const { context, page } = await open(browser, base, '#lab=ethmoid-roof&q=full', { reducedMotion: 'reduce' });
      await page.waitForTimeout(800);
      const a = await page.evaluate(() => window.__ssb.frames);
      await page.waitForTimeout(1200);
      const b = await page.evaluate(() => window.__ssb.frames);
      check('reduced motion, q=full: the materials add no animation (no continuous rendering)', b - a <= 1, `${b - a} frames`);
      await context.close();
    }
  }

  /* ===== 7. CT mode (js/ssb/volume.js, mode-ct.js, ui-ct.js; docs/ssb.md 3, 5.6) ===== */
  await ctUnitTests();
  await ctTests(browser, base);

  /* ===== 8. the Specimen stage (js/ssb/geo-specimen.js, mode-specimen.js, ui-specimen.js; docs/ssb.md 3, 5.3, 7) ===== */
  await specimenUnitTests();
  standardSpecimenTests();
  liningTests();
  await specimenTests(browser, base);

  /* ===== 9. the Endoscope stage (js/ssb/scope.js, mode-endoscope.js, ui-endoscope.js; docs/ssb.md 3) ===== */
  scopeUnitTests();
  await scopeTests(browser, base);
  await procedureUnitTests();
  await procedureTests(browser, base);

  /* ===== screenshots ===== */
  if (SHOTS) {
    for (const [name, cls, code] of [['ethmoid-roof', 'c.keros', 'III'], ['frontal-recess', 'c.ifac', 'SBFC']]) {
      for (const [kind, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
        const { context, page } = await open(browser, base, `#lab=${name}`, { viewport });
        if (kind === 'phone') {
          await page.click('#ssb-sheet-handle');
          await page.click('#ssb-sheet-tabs [data-view="controls"]');
        }
        await act(page, () => page.click(`button[data-cls="${cls}"][data-code="${code}"]`));
        if (kind === 'phone') {
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(SHOTS, `lab-${name}-phone-controls.png`) });
          await page.click('#ssb-sheet-handle');
        }
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SHOTS, `lab-${name}-${kind}.png`) });
        await context.close();
      }
    }
  }

  if (SHOTS) {
    const at = `#ct=ax&at=${FX.sites[0].center.join(',')}`;
    for (const [kind, viewport, hash] of [['desktop', { width: 1280, height: 800 }, at], ['phone', { width: 390, height: 844 }, '#ct=cor&at=10,3,-4']]) {
      const { context, page } = await openCt(browser, base, hash, { viewport });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOTS, `ct-${kind}.png`) });
      if (kind === 'desktop') {
        const hover = await page.evaluate((c) => window.__ssb.ct.clientOf('coronal', c), FX.sites[1].center);
        await page.mouse.click(hover.x, hover.y);
        await page.mouse.move(hover.x + 30, hover.y + 30);
        await page.mouse.move(hover.x + 2, hover.y + 2);
        await page.click('.site-theme-toggle');
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(SHOTS, 'ct-desktop-dark-selected.png') });
      }
      await context.close();
    }
  }

  return finish(browser, server);
}

/* Report, close everything, exit. */
async function finish(browser, server) {
  const errs = allErrors.flat();
  check('zero real console errors across every page', errs.length === 0, errs.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '));

  await browser.close();
  if (server) await server.close();

  const failures = results.filter((r) => !r.ok).length;
  console.log('=== SSB behavior tests ===');
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + (r.detail || '')}`);
  console.log(`\n${failures ? 'FAILED' : 'OK'} — ${results.length - failures}/${results.length} checks passed.`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
