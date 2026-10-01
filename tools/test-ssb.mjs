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
   - zero real console errors throughout.

   Usage:  node tools/test-ssb.mjs [--base <url>] [--headed] [--shots <dir>] [--only ct|specimen]
           --shots writes desktop + phone screenshots of each diorama, of
           CT mode (ct-*.png) and of the Specimen stage (spec-*.png).
   Exits nonzero on any failed check.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { startServer, launchBrowser, collectErrors, ROOT } from './smoke-lib.mjs';
import { validate, contentFiles } from './ssb-content.mjs';
import { buildFixture, fixtureFiles } from './ssb-fixture-ct.mjs';

/* The browser modules under js/ have no package "type", so Node would reparse
   them and warn. Import them as data: URLs instead. The three below need
   neither three.js nor a DOM; their tables are pinned in section 6. */
const dataUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sourceOf = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { KINDS, TISSUE_KINDS, GRAPH_KINDS, TOKENS, kindForGraph, detectQuality } = await import(dataUrl(sourceOf('js/ssb/materials.js')));
const { parseHash, formatHash, clampQuality, createStore, normalizeCt } = await import(dataUrl(sourceOf('js/ssb/state.js')));
const { rasToScene, sceneToRas } = await import(dataUrl(sourceOf('js/ssb/frame.js')));
const kit = await import(dataUrl(sourceOf('js/ssb/dioramas/kit.js')
  .replace(/from '\.\.\/frame\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/frame.js'))}'`)
  .replace(/from '\.\.\/materials\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/materials.js'))}'`)));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const SHOTS = opt('--shots', null);
const ONLY = opt('--only', null);   /* --only ct | specimen: just that section (development) */

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
const { createVolume, parseHeader, parseTable, loadVolume, decode, isGzip, PLANES, VolumeError } = await import(dataUrl(
  sourceOf('js/ssb/volume.js').replace(/from '\.\/stamps\.js[^']*'/, `from '${dataUrl('export const STAMPS = {};')}'`)));
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
      nodes.set(`${n.extras.id}.${n.extras.side}`, { id: n.extras.id, side: n.extras.side, pack: name, pts, idx, box: { min: lo, max: hi }, tris: ia.count / 3 });
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
  const listed = Object.entries(doc.packs).flatMap(([name, def]) => Object.keys(def.nodes).map((k) => [name, k]));
  check('specimen packs: every pack is a glTF 2.0 binary whose length field is true, with KHR_mesh_quantization required',
    Object.values(files).every((f) => f.magic === 0x46546c67 && f.version === 2 && f.length === f.size && (f.json.extensionsRequired || []).includes('KHR_mesh_quantization')),
    JSON.stringify(Object.entries(files).map(([k, f]) => [k, f.magic, f.version, f.length, f.size])));
  check('specimen packs: the nodes in each file are exactly the nodes packs.json lists for it',
    listed.length === nodes.size && listed.every(([name, key]) => nodes.has(key) && nodes.get(key).pack === name), `${listed.length} listed, ${nodes.size} read`);
  const unknown = [...nodes.values()].filter((n) => !GRAPH.has(n.id));
  check('specimen packs: every node id is a graph entity', unknown.length === 0, unknown.map((n) => n.id).join(', '));
  const named = [...nodes].filter(([key, n]) => key !== `${n.id}.${n.side}` || !['R', 'L', 'M'].includes(n.side));
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
    const own = nodes.get(`${PAIRS[m[1]]}.${m[2]}`);
    const other = nodes.get(`${PAIRS[m[1]]}.${m[2] === 'R' ? 'L' : 'R'}`);
    if (!own || !other) continue;
    rows.push({ k, own: nearestVertex(own, p), other: nearestVertex(other, p) });
  }
  check('landmarks vs meshes (data): each paired landmark lies within 4 mm of its own side\'s mesh and nearer it than the other side\'s',
    rows.length >= 8 && rows.every((r) => r.own <= 4 && r.own < r.other), JSON.stringify(rows.map((r) => [r.k, r2(r.own), r2(r.other)])));

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
async function openSpecimen(browser, base, hash = '', { viewport = { width: 1280, height: 800 }, reducedMotion = 'no-preference', webgl = true, routes = null, wait = 'settled', track = true } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: viewport.width < 600 ? 2 : 1 });
  if (!webgl) {
    await context.addInitScript(() => {
      const real = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return typeof type === 'string' && /webgl/i.test(type) ? null : real.call(this, type, ...rest); };
    });
  }
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
  const { nodes: truth } = readPacks();

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
    check('specimen: every pack packs.json lists is loaded, node for node as listed (core first)',
      listed.every((n) => info.packs[n] && info.packs[n].state === 'loaded' && info.packs[n].nodes.length === info.packs[n].expected.length && info.packs[n].expected.every((k) => info.packs[n].nodes.includes(k))), JSON.stringify(info.packs).slice(0, 400));
    const nodes = await specNodes(page);
    const keys = nodes.map((n) => n.key).sort();
    check('specimen: the registry is exactly what the data holds (node keys match an independent read of the packs)', keys.join() === [...truth.keys()].sort().join(), `${keys.length} vs ${truth.size}`);
    check('specimen: every registry id is in the knowledge graph', nodes.every((n) => GRAPH.has(n.id)), nodes.filter((n) => !GRAPH.has(n.id)).map((n) => n.id).join());
    const off = [];
    for (const n of nodes) {
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
      const own = await spec(page, ([key, p]) => window.__ssb.specimen.nearest(key, p), [`${PAIRS[m[1]]}.${m[2]}`, ras]);
      const far = await spec(page, ([key, p]) => window.__ssb.specimen.nearest(key, p), [`${PAIRS[m[1]]}.${other}`, ras]);
      if (own && far) rows.push({ k, own: own.distance, other: far.distance });
    }
    check('frame: in the scene every sided landmark lies within 4 mm of its own side\'s mesh and nearer it than the other side\'s (the loader, the root transform and the landmark file agree)',
      rows.length >= 8 && rows.every((x) => x.own <= 4 && x.own < x.other), JSON.stringify(rows.map((x) => [x.k, r2(x.own), r2(x.other)])));
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
    const wantRegions = [...new Set(nodes0.filter((n) => n.group !== 'bone').map((n) => n.region || 'other'))].sort();
    check('layers: one toggle per region that holds air spaces or soft tissue, built from the loaded packs', regionBoxes.slice().sort().join() === wantRegions.join(), regionBoxes.join() + ' vs ' + wantRegions.join());
    await page.click('#ssb-spec input[data-region="maxillary"]');
    await nextFrames(page, 2);
    const after = await specNodes(page);
    check('layers: unchecking a region hides exactly its nodes', after.filter((n) => n.region === 'maxillary' && n.group !== 'bone').every((n) => !n.visible)
      && after.filter((n) => n.region !== 'maxillary' || n.group === 'bone').every((n) => n.visible), JSON.stringify(after.filter((n) => !n.visible).map((n) => n.key)));
    await page.click('#ssb-spec input[data-region="maxillary"]');

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
    const mine = nodes.filter((n) => n.id === 's.maxillary-sinus');
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
  if (ONLY === 'specimen') {
    await specimenUnitTests();
    await specimenTests(browser, base);
    return finish(browser, server);
  }

  /* ===== 1. each diorama loads; parts resolve in the graph ===== */
  const REQUIRED = {
    'ethmoid-roof': ['s.cribriform-plate.R', 's.lateral-lamella.R', 's.lateral-lamella.L', 's.fovea-ethmoidalis.R', 's.crista-galli.M',
      's.lamina-papyracea.R', 's.anterior-ethmoid-cells.R', 's.middle-turbinate.R', 's.orbit.R', 's.olfactory-fossa.R', 's.anterior-ethmoidal-artery.R'],
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
  await specimenTests(browser, base);

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
