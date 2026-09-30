#!/usr/bin/env node
/* =============================================================
   test-ssb.mjs — SSB behavior tests (docs/ssb.md 9): the variant lab
   (phase 2) and CT mode (phase 5).

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
   - zero real console errors throughout.

   Usage:  node tools/test-ssb.mjs [--base <url>] [--headed] [--shots <dir>] [--only ct]
           --shots writes desktop + phone screenshots of each diorama and of
           CT mode (ct-*.png).
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
const kit = await import(dataUrl(sourceOf('js/ssb/dioramas/kit.js')
  .replace(/from '\.\.\/frame\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/frame.js'))}'`)
  .replace(/from '\.\.\/materials\.js[^']*'/, `from '${dataUrl(sourceOf('js/ssb/materials.js'))}'`)));

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const SHOTS = opt('--shots', null);
const ONLY = opt('--only', null);   /* --only ct: just the CT section (development) */

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
    /* radiological convention: the big right sinus is on the left half of the axial image, the small left one on the right */
    const halves = await ct(page, () => {
      const c = document.querySelector('.ssb-ct-view[data-plane="axial"] canvas');
      const b = window.__ssb.ct.crosshair('axial').box;
      const darkIn = (x0, x1) => {
        const d = c.getContext('2d').getImageData(x0, b.y, x1 - x0, b.h).data;
        let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 45) n++;
        return n;
      };
      const mid = b.x + b.w / 2;
      return { left: darkIn(b.x + b.w * 0.1, mid - 4), right: darkIn(mid + 4, b.x + b.w * 0.9) };
    });
    check('CT: radiological display — the larger right maxillary sinus is on the image LEFT (more air in the left half)', halves.left > halves.right * 1.5, JSON.stringify(halves));
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
    await page.click('#ssb-ct button[data-preset="soft"]');
    await settle(page);
    const soft = await canvasStats(page, 'axial');
    const w = await page.evaluate(() => window.__ssb.ct.window);
    check('CT: the soft window (centre 60, width 40) changes what is drawn and is recorded', w.name === 'soft' && w.center === 60 && w.width === 40 && Math.abs(soft.mean - bone.mean) > 8 && soft.bright > bone.bright + 0.1, JSON.stringify({ w, bone, soft }));
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
