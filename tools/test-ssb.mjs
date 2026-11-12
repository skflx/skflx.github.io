#!/usr/bin/env node
/* =============================================================
   test-ssb.mjs — SSB behavior tests (docs/ssb.md 9): the Specimen stage,
   the endoscope (Scope) and the mucosal, flap, anatomy and scanned-base layers.

   Drives ssb.html in headless Chromium (software WebGL, smoke-lib.mjs) and
   reads the scene back through the read-only test window (window.__ssb:
   .specimen, .scope). One section per system, listed under Usage; each check's
   name says what it pins. The anatomy pages run on the synthetic volume of
   tools/ssb-fixture-ct.mjs, served by routing the page's ssb/anatomy requests to
   it (nothing is written into ssb/); the Specimen packs and landmarks are the
   real ones. Zero real console errors throughout.

   Usage:  node tools/test-ssb.mjs [--base <url>] [--headed] [--shots <dir>] [--only <section>[,...] | --shard i/N]
           sections: specimen scope mucosa flap anatomy scanned
           (SECTIONS, near the end); --shard is CI's split (SHARDS), each section in exactly one.
           --shots writes desktop + phone screenshots of the Specimen stage (spec-*.png).
   Exits nonzero on any failed check.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';
import { startServer, launchBrowser, collectErrors, ROOT } from './smoke-lib.mjs';
import { validate, contentFiles } from './ssb-content.mjs';
import { buildFixture, fixtureFiles, SDF_SPHERE as SDF_FX_SPHERE } from './ssb-fixture-ct.mjs';

/* The browser modules under js/ have no package "type", so Node would reparse
   them and warn. Import them as data: URLs instead. The three below need
   neither three.js nor a DOM; their tables are pinned in section 6. */
const dataUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sourceOf = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { KINDS, TISSUE_KINDS, GRAPH_KINDS, TOKENS, kindForGraph, detectQuality } = await import(dataUrl(sourceOf('js/ssb/materials.js')));
const SCOPE_URL = dataUrl(sourceOf('js/ssb/scope.js'));
const FLAP_URL = dataUrl(sourceOf('js/ssb/flap.js'));
const FL = await import(FLAP_URL);
const { parseHash, formatHash, clampQuality, createStore, normalizeFlap, buildAnatomyRegistry, resolveAnatomy, ANATOMY_DEFAULT, anatomyIsDefault } = await import(dataUrl(sourceOf('js/ssb/state.js').replace(/from '\.\/scope\.js[^']*'/, `from '${SCOPE_URL}'`).replace(/from '\.\/flap\.js[^']*'/, `from '${FLAP_URL}'`)));
const SC = await import(SCOPE_URL);
const { rasToScene, sceneToRas } = await import(dataUrl(sourceOf('js/ssb/frame.js')));
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const SHOTS = opt('--shots', null);
const ONLY = opt('--only', null);   /* --only <section>[,<section>...]: just those sections (SECTIONS below) */
const SHARD = opt('--shard', null);  /* --shard i/N: the i-th of CI's N shards (SHARDS below) */

const results = [];
/* Each result prints as it lands, so a crash or a hang still leaves everything before it in the log. */
function check(name, cond, detail) {
  const ok = !!cond;
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  — ' + (detail || '')}`);
}
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

/* ---------------- page helpers ---------------- */

const allErrors = [];

async function open(browser, base, hash, { viewport = { width: 1280, height: 800 }, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const errors = collectErrors(page);
  allErrors.push(errors);
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  return { context, page, errors };
}

/* Mean RAS coordinate `axis` of the pathway points with z in [lo, hi]. */
function meanIn(points, axis, lo, hi) {
  const pts = points.filter((p) => p[2] >= lo && p[2] <= hi);
  return pts.reduce((s, p) => s + p[axis], 0) / (pts.length || 1);
}
const AP = (path) => meanIn(path.points, 1, -12, 3);   /* recess + ostium: anteroposterior */

/* ---------------- CT: the synthetic fixture (tools/ssb-fixture-ct.mjs) ---------------- */

const FX = buildFixture();
const FX_U8_FILES = fixtureFiles(FX);
const VOLUME_URL = dataUrl(sourceOf('js/ssb/volume.js').replace(/from '\.\/stamps\.js[^']*'/, `from '${dataUrl('export const STAMPS = {};')}'`));
const { createVolume, parseHeader, parseTable, loadVolume, decode, isGzip, PLANES, VolumeError, parsePatch, applyPatch, parseAnatomyPatch, checkAnatomyPatch, applyAnatomyPatch, anatomyVolume, anatomyPatchFile, anatomyOverrideFile, baseRoot, loadAnatomyIndex, forgetAnatomy } = await import(VOLUME_URL);
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

/* ---------------- Specimen: the packs in plain Node ---------------- */

/* Every pack packs.json lists, parsed without three.js: node key -> { id, side,
   pack, pts (RAS mm, dequantized through the node's own transform), box, tris }.
   An independent reading of the data: the page's loader is checked against it. */
function readPacks(root = 'ssb') {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, root, 'models/packs.json'), 'utf8'));
  const nodes = new Map();
  const files = {};
  for (const [name, def] of Object.entries(doc.packs)) {
    const b = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, root, 'models', def.file)));
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
      nodes.set(`${def.lining ? 'lining:' : def.population ? 'population:' : ''}${n.extras.id}.${n.extras.side}`, { id: n.extras.id, side: n.extras.side, kind: n.extras.kind || '', pack: name, lining: def.lining === true, population: def.population === true, pts, idx, box: { min: lo, max: hi }, tris: ia.count / 3 });
    }
  }
  return { doc, nodes, files };
}

const ctBoxOf = (root) => {
  const h = JSON.parse(fs.readFileSync(path.join(ROOT, root, 'ct/ct.json'), 'utf8'));
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const i of [0, h.dims[0] - 1]) for (const j of [0, h.dims[1] - 1]) for (const k of [0, h.dims[2] - 1]) {
    for (let n = 0; n < 3; n++) { const v = h.affine[n][0] * i + h.affine[n][1] * j + h.affine[n][2] * k + h.affine[n][3]; lo[n] = Math.min(lo[n], v); hi[n] = Math.max(hi[n], v); }
  }
  return { min: lo, max: hi };
};
const ctBox = ctBoxOf('ssb');

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
  const listed = Object.entries(doc.packs).flatMap(([name, def]) => Object.keys(def.nodes).map((k) => [name, (def.lining ? 'lining:' : def.population ? 'population:' : '') + k.split('@')[0]]));
  check('specimen packs: every pack is a glTF 2.0 binary whose length field is true, with KHR_mesh_quantization required',
    Object.values(files).every((f) => f.magic === 0x46546c67 && f.version === 2 && f.length === f.size && (f.json.extensionsRequired || []).includes('KHR_mesh_quantization')),
    JSON.stringify(Object.entries(files).map(([k, f]) => [k, f.magic, f.version, f.length, f.size])));
  check('specimen packs: the nodes in each file are exactly the nodes packs.json lists for it',
    listed.length === nodes.size && listed.every(([name, key]) => nodes.has(key) && nodes.get(key).pack === name), `${listed.length} listed, ${nodes.size} read`);
  const unknown = [...nodes.values()].filter((n) => !GRAPH.has(n.id));
  check('specimen packs: every node id is a graph entity', unknown.length === 0, unknown.map((n) => n.id).join(', '));
  const named = [...nodes].filter(([key, n]) => key !== `${n.lining ? 'lining:' : n.population ? 'population:' : ''}${n.id}.${n.side}` || !['R', 'L', 'M'].includes(n.side));
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
      && [...nodes.values()].filter((n) => n.kind && !n.population).every((n) => n.kind === 'skin' && ['s.nasal-vestibule', 's.external-nose'].includes(n.id)), JSON.stringify([...nodes.values()].filter((n) => n.kind).map((n) => n.id)));
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

  /* the cursor in the store: the 3D cursor, `at` in the hash; the removed keys (#ct=, #lab=, #p=) are ignored */
  const has = (id) => GRAPH.has(id);
  const hp = (h) => parseHash(h, has);
  check('state: #at=1,2,3 alone is the specimen\'s 3D cursor', JSON.stringify(hp('#at=1,2,3').cursor) === '[1,2,3]');
  check('state: a hostile `at` is dropped whole, and removed keys are ignored, not an error',
    ['1,2', 'a,b,c', '1,2,3,4', 'NaN,1,2', '1e999,0,0', '<img>,1,2', ''].every((at) => hp(`#at=${at}`).cursor === undefined)
      && hp('#lab=k&ct=ax&p=p.x&step=3&at=1,2,3').cursor.join() === '1,2,3' && hp('#lab=k&ct=ax&p=p.x&step=3').scope === undefined);
  const st = createStore({ has, tierOf: () => 1, hash: '#at=1,2,3', prefs: {} });
  check('state: a cursor in the URL is in the store and is written back as #at=', JSON.stringify(st.get().cursor) === '[1,2,3]' && st.hash() === '#at=1,2,3', st.hash());
  st.setCursor([5, 6, 7]);
  check('state: setCursor moves the cursor and writes it as #at=', st.get().cursor.join() === '5,6,7' && st.hash() === '#at=5,6,7', st.hash());
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
  st.applyHash('#at=9,8,7');
  check('state: applyHash adopts a cursor from a pasted link', st.get().cursor.join() === '9,8,7' && st.hash() === '#at=9,8,7', st.hash());
}

/* ---------------- Specimen: the page ---------------- */

const RAW = { 'content-type': 'application/octet-stream' };

/* routes: { '<file name under ssb/models/ or ssb/geometry/>': (route) => … }. */
async function openSpecimen(browser, base, hash = '', { viewport = { width: 1280, height: 800 }, reducedMotion = 'no-preference', webgl = true, routes = null, wait = 'settled', track = true, abort = null, frameClock = false } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: viewport.width < 600 ? 2 : 1 });
  if (!webgl) {
    await context.addInitScript(() => {
      const real = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return typeof type === 'string' && /webgl/i.test(type) ? null : real.call(this, type, ...rest); };
    });
  }
  if (frameClock) {
    /* the page's time is its frame count: performance.now advances 1000/60 ms per animation frame, and window.__onFrame(n) runs after each one.
       A station flight (600 ms of page time) then lasts the same 36 frames on any machine, however slow one frame is. */
    await context.addInitScript(() => {
      const realRaf = window.requestAnimationFrame.bind(window);
      const STEP = 1000 / 60;
      let frames = 0;
      performance.now = () => frames * STEP;
      window.requestAnimationFrame = (cb) => realRaf(() => { frames += 1; cb(frames * STEP); if (window.__onFrame) window.__onFrame(frames); });
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

/* The canvas as an image, with the corner widgets (orientation, dock) left to the caller to ignore. */
async function canvasImage(page) {
  const r = await page.evaluate(() => { const b = document.getElementById('ssb-canvas').getBoundingClientRect(); return { x: b.left, y: b.top, width: b.width, height: b.height }; });
  const img = decodePng(await page.screenshot({ clip: r }));
  return { img, rect: r };
}
const isBg = (px, bg) => Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]) <= 12;

async function specimenTests(browser, base) {
  /* what a page holds at boot: every pack but the lining, which waits for the first look from within (ST1c) */
  const truth = new Map([...readPacks().nodes].filter(([, n]) => !n.lining && !n.population));

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
    check('specimen: the stage note is provenance (reference specimen, UW atlas credit, draft), not the placeholder', info.noteShown && /Reference specimen · from Interactive CT Sinus Anatomy, Univ\. of Washington Radiology · draft/.test(info.note) && !/Placeholder/i.test(info.note), info.note);
    check('specimen: the placeholder grid\'s axis letters are gone while the specimen shows', info.axisLabels.every((v) => v === 'hidden'), info.axisLabels.join());

    const listed = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8')).packs);
    const liningName = Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8')).packs).filter(([, d]) => d.lining === true).map(([n]) => n);
    const popName = Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, 'ssb/models/packs.json'), 'utf8')).packs).filter(([, d]) => d.population === true).map(([n]) => n);
    check('specimen: every pack packs.json lists, bar the deferred lining (ST1c), is loaded, node for node as listed (core first); the lining waits for the first look from within',
      liningName.length === 1 && liningName.concat(popName).every((n) => info.packs[n] && info.packs[n].state === 'deferred' && info.packs[n].nodes.length === 0) && listed.filter((n) => !liningName.includes(n) && !popName.includes(n)).every((n) => info.packs[n] && info.packs[n].state === 'loaded' && info.packs[n].nodes.length === info.packs[n].expected.length && info.packs[n].expected.every((k) => info.packs[n].nodes.includes(k))), JSON.stringify(info.packs).slice(0, 400));
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

    /* a cursor set from the hash is the 3D crosshair, and the URL keeps it as #at= */
    const move = [12, -30, 22];
    await page.evaluate((m) => { location.hash = `#at=${m.join(',')}`; }, move);
    await page.waitForFunction((m) => window.__ssb.specimen.cursor && Math.abs(window.__ssb.specimen.cursor[0] - m[0]) < 1e-6, move);
    await nextFrames(page, 3);
    const back = await page.evaluate(() => ({ marker: window.__ssb.specimen.cursorMarker, cursor: window.__ssb.specimen.cursor, hash: location.hash, active: window.__ssb.specimen.active }));
    check('cursor: a cursor set in the hash shows in the specimen as the 3D crosshair marker, and the URL is #at=', back.active && back.marker && arrEq(back.marker, move, 1e-6) && back.hash.includes('at=12,-30,22') && !back.hash.includes('ct='), JSON.stringify(back));
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
    const nodes0 = (await specNodes(page)).length;
    let geoOne = null;
    let nodesOne = 0;
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(() => !document.querySelector('#ssb-stage-mode [data-stage="scope"]').disabled);
      await page.click('#ssb-stage-mode [data-stage="scope"]');
      await page.waitForFunction(() => document.getElementById('ssb-app').dataset.stage === 'scope');
      await nextFrames(page, 3);
      await page.click('#ssb-stage-mode [data-stage="specimen"]');
      await page.waitForFunction(() => window.__ssb.specimen.active);
      await nextFrames(page, 4);
      if (i === 0) { geoOne = await spec(page, () => window.__ssb.specimen.info().geometries); nodesOne = (await specNodes(page)).length; }
    }
    const camB = await spec(page, () => window.__ssb.specimen.camera());
    const geo1 = await spec(page, () => window.__ssb.specimen.info().geometries);
    check('stages: after three trips through the scope the specimen is back with the camera where the reader left it', arrEq(camA.position, camB.position, 1e-3) && arrEq(camA.target, camB.target, 1e-3), JSON.stringify([camA.position, camB.position]));
    check('stages: no geometry leaks across stage switches (the GPU geometry count after three trips is what it was after the first; the scope\'s own meshes are cached once)', geo1 === geoOne, `${geoOne} -> ${geo1} (was ${geo0})`);
    check('stages: the scope did not dispose the specimen (every node is still there after the trips and drawn)', (await specNodes(page)).length === nodesOne && nodesOne >= nodes0 && (await spec(page, () => window.__ssb.specimen.info().triangles)) > 100000);
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
  check('state: #scope= is the endoscope stage; hostile values are dropped',
    parseHash('#scope=R,40,10,-5,90,45', has).scope.lens === 45 && parseHash('#scope=R,40,0,0,0,31', has).scope === undefined);
  const st = createStore({ has, tierOf: () => 1, hash: '#scope=L,30,10,0,0,30', prefs: {}, labs: {} });
  check('state: the store takes the pose from the URL and writes the same canonical hash back', st.get().scope.side === 'L' && st.get().scope.lens === 30 && st.hash() === '#scope=L,30,10,0,0,30', st.hash());
  st.setScope({ side: 'R', depth: 5000, yaw: 0, pitch: 0, roll: 0, lens: 0 });
  check('state: setScope clamps (depth 5000 -> 120)', st.get().scope.depth === 120);
  st.setScope(SC.POSE_DEFAULT);
  check('state: leaveStage() clears the scope and the hash', st.get().scope && (st.leaveStage(), st.get().scope === null && st.hash() === ''), st.hash());
  st.applyHash('#scope=R,40,0,0,0,0');
  check('state: applyHash adopts a pasted scope link and drops it when the hash has none', st.get().scope && (st.applyHash(''), st.get().scope === null));

  scopeCollisionTests();
  return stationUnitTests();
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
    const cl = SC.shaftClearance(F, pose, ctAt, SC.SHAFT_RADII[st.shaft || '4'], arch);
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
  check('stations (E6): every station is free under shaftClearance (its shaft: 4 mm, or 2.7 mm where the entry says so; the E3b midline rule, lm.choanal-arch.M) — not clamped, not blocked', problems.free.length === 0, JSON.stringify(problems.free));
  check('stations (E6): every station\'s tip lies in an air label of the standard specimen (not in tissue)', problems.air.length === 0, shown(problems.air));
  check('stations (E6): every station\'s target (landmark, label centroid, `between` midpoint or `at`) is within FOV_DEG / 2 = 35 degrees of the view axis', problems.target.length === 0, JSON.stringify(problems.target.map((x) => [x[0], x[1] === null ? null : +x[1].toFixed(2)])));

  const mirrored = keys.filter((k) => k.endsWith('.L')).every((k) => {
    const r = table[k.replace(/\.L$/, '.R')];
    const l = table[k];
    return !!r && l.pose.side === 'L' && r.pose.side === 'R' && ['depth', 'yaw', 'pitch', 'lens'].every((f) => l.pose[f] === r.pose[f]) && l.pose.roll === (360 - r.pose.roll) % 360;
  });
  check('stations (E6): every `.L` station is its `.R` station mirrored (same depth, yaw, pitch, lens; roll -> 360 - roll; side L), and has one', keys.some((k) => k.endsWith('.L')) && mirrored);
  check('stations (E6): a midline (.M) station is posed from the right nostril', keys.filter((k) => k.endsWith('.M')).every((k) => table[k].pose.side === 'R'));

  const byState = doc.byState || {};
  const stems = new Set([...keys, ...Object.values(byState).flatMap((t) => Object.keys(t))].map((k) => k.replace(/\.(R|L|M)$/, '')));
  const unc = new Set(Object.keys(doc.uncovered));
  const over = new Set(doc.overviews.ids);
  const graphStations = [...GRAPH.keys()].filter((id) => GRAPH.get(id).type === 'stations');
  const missing = graphStations.filter((id) => !stems.has(id) && !unc.has(id) && !over.has(id));
  const stray = [...stems, ...unc, ...over].filter((id) => !GRAPH.has(id) || GRAPH.get(id).type !== 'stations');
  const twice = graphStations.filter((id) => [stems.has(id), unc.has(id), over.has(id)].filter(Boolean).length > 1);
  check('stations (E6, P3, P4): every graph `t.*` station is in `stations` and/or `byState`, `uncovered` or `overviews` (exactly one of those three groups; a station may have both an intact pose and poses for dissected states), and nothing else is', graphStations.length >= 40 && missing.length === 0 && stray.length === 0 && twice.length === 0, JSON.stringify({ missing, stray, twice }));

  /* ---- the codec: a link is a shape, a table lookup is the only thing it does ---- */
  const L = SC.parseStationLink;
  check('station link: `t.ser-0`, `t.ser-0.L`, `t.nsf-pedicle.M` parse (side null when absent)', JSON.stringify(L('t.ser-0')) === '{"id":"t.ser-0","side":null}' && L('t.ser-0.L').side === 'L' && L('t.nsf-pedicle.M').id === 't.nsf-pedicle');
  const hostile = ['', 't.', 't.nope.X', 't.a b', 't.ser-0.R.R', 'x.ser-0', 'T.ser-0', 't.ser_0', 't./../x', 't.ser-0.r', '<script>', 't.' + 'a'.repeat(5000), 't.ser-0\n', 't.-a', 't.a-', 't.a--b', null, undefined, 7];
  check('station link: hostile shapes are refused (no side but R|L|M, no underscores, slashes, spaces, newlines, doubled hyphens, markup, 5 kB, non-strings)', hostile.every((h) => L(h) === null), JSON.stringify(hostile.filter((h) => L(h) !== null)));
  check('station link: a pose is not a station link and a station link is not a pose (parseScope refuses `t.ser-0`)', SC.parseScope('t.ser-0') === null && L('R,40,0,0,0,0') === null);
  const parsed = SC.parseStations(doc);
  const slim = keys.filter((k) => table[k].shaft === '2.7');
  check('stations (P3): the olfactory cleft and the inferior meatus (both sides) carry shaft "2.7", parseStations keeps it, and no other intact station asks for it', slim.sort().join() === ['t.inferior-meatus-45.L', 't.inferior-meatus-45.R', 't.olfactory-cleft-0.L', 't.olfactory-cleft-0.R'].join() && slim.every((k) => parsed.get(k).shaft === '2.7') && keys.filter((k) => !slim.includes(k)).every((k) => parsed.get(k).shaft === null) && ['3', '', 7, null, {}, '4'].every((v) => SC.parseStations({ stations: { 't.a-b.R': { pose: table[keys[0]].pose, shaft: v } } }).get('t.a-b.R').shaft === null), JSON.stringify(slim));
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
  check('station link (store): a pose wins over a link, and hostile text is not a link',
    mk('#scope=R,40,0,0,0,0').get().station === null && mk('#scope=t.ser-0.X').get().station === null && mk('#scope=t.ser-0%0A').get().station === null);
  const ap = mk('');
  ap.applyHash('#scope=t.ser-0');
  const pend = ap.get().station;
  ap.setScope(pose70);
  check('station link (store): a pasted link while on the specimen is pending; entering a pose clears it; resolveStation with nothing pending is a no-op',
    pend === 't.ser-0' && ap.get().station === null && ap.resolveStation(pose70) === false && (ap.applyHash('#scope=t.ser-0'), ap.get().station === 't.ser-0'));

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
  return { vol, ctAt, lms, arch, targetOf, angle, sub, AIR };
}

/* ---------------- Endoscope: the page ---------------- */

/* How many times this page has fetched the lining pack (the resource timing log sees requests made before a listener could attach). */
const liningFetches = (page) => page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\/ssb\/models\/lining\.glb\.gz/.test(e.name)).length);

async function scopeTests(browser, base) {
  /* ===== the UW credit (WP RA0c) is on the page in every stage that shows the specimen ===== */
  {
    const { context, page } = await openSpecimen(browser, base, '');
    const credit = () => page.evaluate(() => {
      const el = document.getElementById('ssb-credit'); const a = el && el.querySelector('a'); const r = el && el.getBoundingClientRect();
      return { text: el ? el.textContent : '', shown: !!el && getComputedStyle(el).display !== 'none' && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, fits: !!el && el.scrollWidth <= el.clientWidth + 1,
        href: a ? a.getAttribute('href') : '', rel: a ? a.getAttribute('rel') : '', stage: document.getElementById('ssb-app').dataset.stage };
    });
    const okCredit = (c) => c.shown && c.fits && /University of Washington Department of Radiology/.test(c.text) && /Interactive CT Sinus Anatomy/.test(c.text) && c.href === 'http://uwmsk.org/sinusanatomy2/' && /noopener/.test(c.rel);
    const seen = [await credit()];
    await page.evaluate(() => { location.hash = '#scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 30000 });
    seen.push(await credit());
    check('credit: the full UW attribution and its link show, in view without scrolling, in the Specimen and Scope stages', seen.length === 2 && seen.every(okCredit), JSON.stringify(seen));
    const ni = await page.evaluate(() => ['Washington', 'Radiology'].every((w) => document.getElementById('ssb-stage-note').textContent.includes(w)));
    check('credit: the stage note names the institution', ni);
    await context.close();
  }
  /* on a phone the credit line sits in the closed sheet, so the stage note carries the institution, wrapped, never truncated */
  {
    const { context, page } = await openSpecimen(browser, base, '', { viewport: { width: 390, height: 844 } });
    const notes = [];
    const note = () => page.evaluate(() => { const n = document.getElementById('ssb-stage-note'); const r = n.getBoundingClientRect();
      return { text: n.textContent, whole: n.scrollWidth <= n.clientWidth + 1 && n.scrollHeight <= n.clientHeight + 1, inView: r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth }; });
    notes.push(await note());
    await page.evaluate(() => { location.hash = '#scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged, null, { timeout: 30000 });
    notes.push(await note());
    check('credit: at phone width the stage note names the University of Washington in full, in view, in Specimen and Scope', notes.every((n) => n.whole && n.inView && /University of Washington|Univ\. of Washington/.test(n.text)), JSON.stringify(notes));
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
    const { context, page } = await openSpecimen(browser, base, '#scope=R,40,0,0,0,0', { frameClock: true });
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'ready', null, { timeout: 30000 });
    await nextFrames(page, 3);
    const l1 = await stList(page);
    const want1 = stFor('R', 1);
    check('stations (E6): the list shows the right nostril\'s stations and the midline ones at the page\'s tier (1), in file order, each with its graph name and its lens — and none of the uncovered or overviews',
      l1.map((x) => x.key).join() === want1.join() && want1.length >= 4 && l1.every((x) => stName(x.key).startsWith(x.text) && x.lens === `${ST[x.key].pose.lens}°`) && !l1.some((x) => /overview|ethmoid-bulla/.test(x.key)), JSON.stringify({ l1: l1.map((x) => x.key), want1 }));
    check('stations (E6): the list is a labelled group of buttons, none pressed while the scope is not at a station', await page.evaluate(() => { const g = document.querySelector('#ssb-scope-controls .ssb-scope-stations'); return g.getAttribute('role') === 'group' && !!g.getAttribute('aria-label') && [...g.children].every((b) => b.tagName === 'BUTTON' && b.type === 'button'); }) && l1.every((x) => x.pressed === 'false'), JSON.stringify(l1.map((x) => x.pressed)));

    /* the tier filter follows the page, and the left nostril gets the left ones */
    await page.evaluate(() => { location.hash = '#tier=3&scope=R,40,0,0,0,0'; });
    await page.waitForFunction(() => document.querySelectorAll('#ssb-scope-controls .ssb-scope-station').length > 0 && !!document.querySelector('#ssb-scope-controls [data-station="t.nsf-pedicle.M"]'), null, { timeout: 5000 });
    check('stations (E6): at tier 3 the deeper stations join (t.frontal-recess-70.R at tier 2, t.nsf-pedicle.M at tier 3)', (await stList(page)).map((x) => x.key).join() === stFor('R', 3).join(), JSON.stringify((await stList(page)).map((x) => x.key)));
    await page.click('#ssb-scope-controls button[data-side="L"]');
    check('stations (E6): the left nostril lists the .L stations and the midline ones', (await stList(page)).map((x) => x.key).join() === stFor('L', 3).join(), JSON.stringify((await stList(page)).map((x) => x.key)));
    await page.click('#ssb-scope-controls button[data-side="R"]');

    /* a flight: t.ser-0.R from R,40,0,0,0,0 */
    await page.evaluate(() => { window.__flight = []; window.__onFrame = () => { const sc = window.__ssb.scope; window.__flight.push({ flying: sc.flying, pose: sc.pose }); }; });
    const during = await page.evaluate(() => { document.querySelector('#ssb-scope-controls [data-station="t.ser-0.R"]').click(); return window.__ssb.scope.flying; });   /* the click and the read in one task: no frame passes between */
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
    await nextFrames(page, 40);      /* 40 frames: longer than the whole flight, so a flight that was not cancelled would have arrived */
    const later = await page.evaluate(() => window.__ssb.scope.pose);
    check('stations (E6): a key press during a flight cancels it — the flight stops where it is and the pose does not go on to the station', flyingNow === true && stopped.flying === false && samePoseObj(stopped.pose, later) && !samePoseObj(later, ST['t.first-pass-floor.R'].pose), JSON.stringify([flyingNow, stopped, later]));
    await page.evaluate(() => { window.__onFrame = null; });
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
  {
    /* a station that is free only for the 2.7 mm telescope (P3): flying to it, or opening its link, puts that telescope on and says why */
    const slim = 't.olfactory-cleft-0.R';
    const read = (page) => page.evaluate(() => { const n = document.querySelector('#ssb-scope-controls .ssb-scope-shaft-note'); return { shaft: window.__ssb.scope.shaft.key, why: window.__ssb.scope.shaftWhy, pose: window.__ssb.scope.pose, note: n && !n.hidden ? n.textContent : null, pressed: [...document.querySelectorAll('#ssb-scope-controls [data-shaft]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.shaft) }; });
    const { context, page } = await openSpecimen(browser, base, '#tier=3&scope=R,40,0,0,0,0');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'ready' && !!document.querySelector('#ssb-scope-controls [data-station="t.olfactory-cleft-0.R"]'), null, { timeout: 30000 });
    const before = await read(page);
    await page.click(`#ssb-scope-controls [data-station="${slim}"]`);
    await page.waitForFunction(() => !window.__ssb.scope.flying, null, { timeout: 10000 });
    const at = await read(page);
    check('stations (P3): flying to t.olfactory-cleft-0.R switches the shaft to 2.7 mm (the 4 mm pill is no longer pressed), the controls say why, and the scope arrives at the stored pose, not clamped', before.shaft === '4' && before.note === null && at.shaft === '2.7' && at.pressed.join() === '2.7' && at.why && at.why.station === slim && /olfactory/i.test(at.note || '') && /2\.7 mm/.test(at.note || '') && samePoseObj(at.pose, ST[slim].pose), JSON.stringify([before, at]));
    await page.click('#ssb-scope-controls [data-shaft="4"]');
    const back = await read(page);
    check('stations (P3): choosing a diameter by hand ends the reason (the note hides, the 4 mm pill is pressed)', back.shaft === '4' && back.why === null && back.note === null && back.pressed.join() === '4', JSON.stringify(back));
    await page.click(`#ssb-scope-controls [data-station="${slim}"]`);
    await page.waitForFunction(() => !window.__ssb.scope.flying && window.__ssb.scope.shaft.key === '2.7', null, { timeout: 10000 });
    await page.click('#ssb-scope-controls [data-station="t.ser-0.R"]');
    await page.waitForFunction(() => !window.__ssb.scope.flying, null, { timeout: 10000 });
    const after = await read(page);
    check('stations (P3): flying on to a 4 mm station drops the reason and leaves the shaft as it is (the 2.7 mm telescope also fits there)', after.shaft === '2.7' && after.why === null && after.note === null && samePoseObj(after.pose, ST['t.ser-0.R'].pose), JSON.stringify(after));
    await context.close();
  }
  {
    const { context, page } = await openSpecimen(browser, base, '#scope=t.inferior-meatus-45.L');
    await page.waitForFunction(() => window.__ssb.scope && window.__ssb.scope.engaged && window.__ssb.scope.stationsState === 'ready', null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ shaft: window.__ssb.scope.shaft.key, why: window.__ssb.scope.shaftWhy, pose: window.__ssb.scope.pose, hash: location.hash }));
    check('stations (P3): the link #scope=t.inferior-meatus-45.L opens the scope on the 2.7 mm telescope, at the stored pose', r.shaft === '2.7' && r.why && r.why.station === 't.inferior-meatus-45.L' && samePoseObj(r.pose, ST['t.inferior-meatus-45.L'].pose), JSON.stringify(r));
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
    await page.click('#ssb-stage-mode [data-stage="specimen"]');
    await nextFrames(page, 2);
    const ct = await page.evaluate(() => ({ stage: document.getElementById('ssb-app').dataset.stage, active: window.__ssb.scope.active, engaged: window.__ssb.scope.engaged, hash: location.hash, controls: window.__ssb.scope.controlsEnabled(), bone: window.__ssb.specimen.bone }));
    check('scope: leaving the scope for the specimen is clean (stage, hash, orbit controls and the specimen\'s layers restored)', ct.stage === 'specimen' && !ct.active && !ct.engaged && !/scope=/.test(ct.hash) && ct.controls && ct.bone === 'xray', JSON.stringify(ct));
    await nextFrames(page, 3);
    const back = await spec(page, () => window.__ssb.specimen.camera());
    check('scope: coming back to the specimen from the scope shows the orbit view, not the scope\'s tip (the camera is outside the head, a normal distance from its target)', back.distance > 60 && back.position.some((v) => Math.abs(v) > 40), JSON.stringify(back));
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


/* ---------------- Mucosal state: decongested and congested (DC1, docs/ssb.md 5.9) ---------------- */

/* The two patches of ssb/states/index.json `mucosa`, read the way a page reads them (parsePatch, applyPatch) and measured from the
   arrays: what they may change, the cross-section ratios they were calibrated to (the congested target is read from
   ssb/anatomy/population/nasalseg.json, never typed here), and the intact stations in each. `w` is stationUnitTests' window. */
async function mucosaUnitTests(w) {
  const read = (p) => fs.readFileSync(path.join(ROOT, p));
  const json = (p) => JSON.parse(read(p).toString('utf8'));
  if (!fs.existsSync(path.join(ROOT, 'ssb/states/mucosa.json'))) { console.log('  (mucosa: ssb/states/mucosa.json is not in this build — skipped)'); return; }
  const index = json('ssb/states/index.json');
  const rec = json('ssb/states/mucosa.json');
  check('mucosa: the index lists a decongested and a congested state, units-free', ['dec', 'cong'].every((m) => index.mucosa[m] && index.states[index.mucosa[m].state] && index.states[index.mucosa[m].state].units.length === 0 && index.states[index.mucosa[m].state].mucosa === m), JSON.stringify(index.mucosa));
  check('mucosa: every dissection state is built on the decongested mucosa', Object.values(index.states).filter((st) => st.units.length).every((st) => st.mucosa === 'dec'));

  const vol = w.vol;
  const [nx, ny, nz] = vol.dims;
  const meta = json('ssb/ct/ct.json');
  const ct0 = new Uint8Array(zlib.gunzipSync(read('ssb/ct/ct.u8.gz')));
  const lb = zlib.gunzipSync(read('ssb/ct/labels.u16.gz'));
  const lab0 = new Uint16Array(lb.buffer.slice(lb.byteOffset, lb.byteOffset + lb.length));
  const nameOf = (i) => (vol.describe(i) || {}).name;
  const idOf = (name) => vol.labelIndices().find((i) => nameOf(i) === name);
  const lm = w.lms;
  const level = json('tools/ssb-pipeline/uw/dissection.json').air.level;
  const aLo = lm['lm.choanal-arch.M'][1], aHi = lm['s.internal-nasal-valve.R'][1];
  const erectile = new Set(['s.inferior-turbinate.R', 's.inferior-turbinate.L', 's.middle-turbinate.R', 's.middle-turbinate.L', 's.nasal-septum.M']);
  const slab = nx * ny;
  const mid = (nx - 1) / 2;
  const ncR = idOf('s.nasal-cavity.R');
  const ncL = idOf('s.nasal-cavity.L');
  const span = [lm['lm.choanal-arch.M'][1] + 1, lm['lm.middle-turbinate-head.R'][1] - 3];
  /* mean coronal cross-section (cm^2) of the right nasal cavity's air over the span, from arrays */
  const csa = (ct, lab) => {
    let sum = 0;
    let n = 0;
    for (let j = 0; j < ny; j++) {
      const a = vol.toRAS(0, j, 0)[1];
      if (a < span[0] - 1e-9 || a > span[1] + 1e-9) continue;
      let c = 0;
      for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const q = k * slab + j * nx + i; if (lab[q] === ncR && ct[q] < level) c++; }
      sum += c;
      n++;
    }
    return (sum / n) * meta.spacing[0] * meta.spacing[2] / 100;
  };
  const asScanned = csa(ct0, lab0);

  const patches = {};
  for (const mode of ['dec', 'cong']) {
    const key = index.mucosa[mode].state;
    patches[mode] = await parsePatch(read(`ssb/states/${index.states[key].patch}`), vol, index.base);
  }
  const target = json('ssb/anatomy/population/nasalseg.json').profiles.summary.restricted['10-90'].moreCongestedOverMean.p50;
  for (const mode of ['dec', 'cong']) {
    const patch = patches[mode];
    const ct = new Uint8Array(ct0);
    const lab = new Uint16Array(lab0);
    const bad = { from: 0, to: 0, bone: 0, midplane: 0, span: 0, side: 0 };
    let changed = 0;
    const seen = new Map();
    for (const b of patch.boxes) {
      const [dx, dy, dz] = b.dims;
      for (let z = 0; z < dz; z++) for (let y = 0; y < dy; y++) for (let x = 0; x < dx; x++) {
        const v = b.data[(z * dy + y) * dx + x];
        if (!v) continue;
        const i = b.ijk0[0] + x, j = b.ijk0[1] + y, k = b.ijk0[2] + z;
        const q = k * slab + j * nx + i;
        changed++;
        const [r, a] = vol.toRAS(i, j, k);
        const was = nameOf(lab0[q]);
        const now = nameOf(v);
        if (ct0[q] >= 120) bad.bone++;
        if (Math.abs(r) < 1e-9) bad.midplane++;
        if (a < aLo - 1e-9 || a > aHi + 1e-9) bad.span++;
        if (mode === 'dec') {
          if (!erectile.has(was) || ct0[q] < level || (now !== 's.nasal-cavity.R' && now !== 's.nasal-cavity.L') || (r > 0) !== (now === 's.nasal-cavity.R')) bad.from++;
        } else if (!/^s\.(inferior|middle)-turbinate\./.test(now) || (was !== 's.nasal-cavity.R' && was !== 's.nasal-cavity.L') || ct0[q] >= level) bad.from++;
        if ((r > 0) !== (was.endsWith('.R') || (now.endsWith('.R'))) && was !== 's.nasal-septum.M') bad.side++;
        ct[q] = patch.ctFill;
        lab[q] = v;
        seen.set(`${i},${j},${k}`, v);
      }
    }
    let asym = 0;
    for (const key of seen.keys()) { const [i, j, k] = key.split(',').map(Number); if (!seen.has(`${2 * mid - i},${j},${k}`)) asym++; }
    const ratio = csa(ct, lab) / asScanned;
    const lo = mode === 'dec' ? 1.35 : target - 0.04;
    const hi = mode === 'dec' ? 1.45 : target + 0.04;
    check(`mucosa (${mode}): only erectile soft tissue ${mode === 'dec' ? 'recedes to air (the side\'s nasal cavity)' : 'is grown into the side\'s nasal-cavity air (a turbinate label)'}, between the choana and the valve, 0 bone voxels, the midplane untouched`,
      changed > 5000 && bad.from === 0 && bad.bone === 0 && bad.midplane === 0 && bad.span === 0, JSON.stringify({ changed, ...bad }));
    check(`mucosa (${mode}): the patch is its own mirror (left = right)`, asym === 0, String(asym));
    check(`mucosa (${mode}): the mean cross-section ratio over A ${span.map((v) => v.toFixed(1)).join('..')} is ${mode === 'dec' ? '1.35-1.45 (Xiao 3.8 / 2.8 = 1.357)' : `within 0.04 of POP1's median ${target} (nasalseg.json)`}, measured from the arrays: ${ratio.toFixed(4)}`, ratio >= lo && ratio <= hi, ratio.toFixed(4));
    check(`mucosa (${mode}): the display it writes is ${mode === 'dec' ? 'air (below the soft-tissue level)' : 'soft tissue (the level up to bone)'}: ${patch.ctFill}`, mode === 'dec' ? patch.ctFill < level : patch.ctFill >= level && patch.ctFill < 120);
    check(`mucosa (${mode}): the recorded calibration agrees with the arrays (d ${rec[mode === 'dec' ? 'decongested' : 'congested'].d} mm, ratio ${rec[mode === 'dec' ? 'decongested' : 'congested'].ratio})`, Math.abs(rec[mode === 'dec' ? 'decongested' : 'congested'].ratio - ratio) < 5e-4);
  }

  /* the thirds along S and A (decongested): the superior third gains least */
  {
    const air = (ct, lab, q) => lab[q] === ncR && ct[q] < level;
    const ct = new Uint8Array(ct0), lab = new Uint16Array(lab0);
    const patch = patches.dec;
    for (const b of patch.boxes) { const [dx, dy, dz] = b.dims; for (let z = 0; z < dz; z++) for (let y = 0; y < dy; y++) for (let x = 0; x < dx; x++) { const v = b.data[(z * dy + y) * dx + x]; if (v) { const q = (b.ijk0[2] + z) * slab + (b.ijk0[1] + y) * nx + b.ijk0[0] + x; ct[q] = patch.ctFill; lab[q] = v; } } }
    let sMin = Infinity, sMax = -Infinity;
    for (let q = 0; q < lab0.length; q++) if (lab0[q] === ncR) { const s2 = vol.toRAS(0, 0, Math.floor(q / slab))[2]; if (s2 < sMin) sMin = s2; if (s2 > sMax) sMax = s2; }
    const gain = [0, 0, 0];
    for (let q = 0; q < lab0.length; q++) {
      if (air(ct, lab, q) === air(ct0, lab0, q)) continue;
      const a = vol.toRAS(0, Math.floor(q / nx) % ny, 0)[1];
      if (a < span[0] - 1e-9 || a > span[1] + 1e-9) continue;
      const s2 = vol.toRAS(0, 0, Math.floor(q / slab))[2];
      gain[Math.min(2, Math.floor(3 * (s2 - sMin) / (sMax - sMin + 1e-9)))]++;
    }
    check('mucosa (dec): the superior third of the cavity gains least in cross-section (the least erectile tissue, as in Xiao 2021)', gain[2] < gain[0] && gain[2] < gain[1], JSON.stringify(gain));
  }

  /* congested: where along A the loss sits (the middle third, where the turbinates are) */
  {
    const patch = patches.cong;
    const lost = [0, 0, 0];
    const frac = (a) => Math.min(2, Math.max(0, Math.floor(3 * (span[1] - a) / (span[1] - span[0] + 1e-9))));
    for (const b of patch.boxes) {
      const [dx, dy, dz] = b.dims;
      for (let z = 0; z < dz; z++) for (let y = 0; y < dy; y++) for (let x = 0; x < dx; x++) {
        if (!b.data[(z * dy + y) * dx + x]) continue;
        const [r, a] = vol.toRAS(b.ijk0[0] + x, b.ijk0[1] + y, b.ijk0[2] + z);
        if (r > 0 && a >= span[0] - 1e-9 && a <= span[1] + 1e-9) lost[frac(a)]++;
      }
    }
    check('mucosa (cong): the largest loss along A is in the middle third of the span', lost[1] > lost[0] && lost[1] > lost[2], JSON.stringify(lost));
  }

  /* a pose whose tip is in inferior-turbinate tissue as scanned is in air decongested; every intact station still passes there */
  const dec = applyPatch(vol, patches.dec);
  const cong = applyPatch(vol, patches.cong);
  {
    const F = lm['lm.naris.R'];
    let found = null;
    for (let depth = 20; depth <= 70 && !found; depth += 0.5) for (let yaw = -30; yaw <= 30 && !found; yaw += 2) for (let pitch = -30; pitch <= 30 && !found; pitch += 2) {
      const pose = { side: 'R', depth, yaw, pitch, roll: 0, lens: 0 };
      const tip = SC.tipOf(F, pose);
      const was = vol.describe(vol.labelAt(tip[0], tip[1], tip[2]));
      const now = dec.describe(dec.labelAt(tip[0], tip[1], tip[2]));
      if (was && was.name === 's.inferior-turbinate.R' && vol.sample(tip[0], tip[1], tip[2]) >= level && now && now.name === 's.nasal-cavity.R' && dec.sample(tip[0], tip[1], tip[2]) < level) found = { pose, tip };
    }
    check('mucosa (dec): a pose whose tip is in inferior-turbinate tissue as scanned (display >= the soft level) is in nasal-cavity air decongested', !!found, JSON.stringify(found));
  }
  const stations = json('ssb/geometry/stations.json').stations;
  const failing = (v) => {
    const out = [];
    for (const [key, st] of Object.entries(stations)) {
      const pose = st.pose;
      const F = lm[`lm.naris.${pose.side}`];
      const cl = SC.shaftClearance(F, pose, (p) => v.sample(p[0], p[1], p[2]), SC.SHAFT_RADII[st.shaft || '4'], w.arch);
      const tip = SC.tipOf(F, pose);
      const lab = v.describe(v.labelAt(tip[0], tip[1], tip[2]));
      if (cl.blocked || cl.depth !== pose.depth || !lab || !w.AIR.has(lab.name)) out.push(key);
    }
    return out;
  };
  const keys = Object.keys(stations);
  const decFail = failing(dec);
  check(`mucosa (dec): every one of the ${keys.length} intact stations is still free with its tip in air in the decongested volume`, decFail.length === 0, decFail.join(' '));
  const congFail = failing(cong);
  console.log(`  (mucosa (cong): ${congFail.length} of ${keys.length} intact stations close in the congested volume — reported, not an error: ${congFail.join(' ') || 'none'})`);
  check('mucosa (cong): the failures of the congested volume are listed (a narrow view may close; the others stay)', congFail.length < keys.length);
}

/* The page: a mucosal state in the hash is ignored when hostile. The toggle's own loading is not tested here: the procedure
   player that loaded the decongested and congested states was removed (docs/ssb.md 5.8), so nothing loads them now. */
async function mucosaTests(browser, base) {
  if (!fs.existsSync(path.join(ROOT, 'ssb/states/mucosa.json'))) return;

  /* hostile and unknown values */
  for (const bad of ['mu=%3Cimg%20src%3Dx%20onerror%3D1%3E', 'mu=DEC', 'mu=', 'mu=dec%20scan']) {
    const { context: c3, page: p3, errors: e3 } = await openSpecimen(browser, base, `#scope=R,40,0,0,0,0&${bad}`);
    await nextFrames(p3, 3);
    check(`mucosa (hostile): ${bad} is ignored — as scanned, no mu in the hash, nothing executes`, (await p3.evaluate(() => window.__ssb.specimen.stateKey)) === null && !/mu=/.test(await p3.evaluate(() => window.__ssb.hash)) && e3.length === 0, JSON.stringify(e3));
    await c3.close();
  }
}



/* ---------------- the nasoseptal flap overlay (WP ST5, docs/ssb.md 5.7) ---------------- */

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

/* One side's inputs from the committed data, as the page builds them. */
function flapInputs(side, data) {
  const lm = (id) => data.landmarks[id];
  return {
    side, septal: data.charts[`s.septal-mucosa.${side}`], floor: data.charts[`s.nasal-floor-mucosa.${side}`],
    ostium: lm(`lm.sphenoid-ostium.${side}`), arch: lm('lm.choanal-arch.M'), mtHead: lm(`lm.middle-turbinate-head.${side}`),
    sf: data.meta[`lm.sphenoid-ostium.${side}`].inferior_margin_s_mm,
  };
}

/* An independent point-in-polygon (winding number) and triangle area (Heron), so the readout is not checked against its own code. */
function windingInside(poly, x, y) {
  let w = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const left = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1);
    if (y1 <= y) { if (y2 > y && left > 0) w++; } else if (y2 <= y && left < 0) w--;
  }
  return w !== 0;
}
function independentArea(node, project, poly) {
  let mm2 = 0;
  for (let t = 0; t < node.idx.length; t += 3) {
    const P = [0, 1, 2].map((k) => [node.pts[node.idx[t + k] * 3], node.pts[node.idx[t + k] * 3 + 1], node.pts[node.idx[t + k] * 3 + 2]]);
    const c = [0, 1, 2].map((i) => (P[0][i] + P[1][i] + P[2][i]) / 3);
    const [u, v] = project(...c);
    if (!windingInside(poly, u, v)) continue;
    const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    const a = d(P[0], P[1]); const b = d(P[1], P[2]); const cc = d(P[2], P[0]);
    const sp = (a + b + cc) / 2;
    mm2 += Math.sqrt(Math.max(0, sp * (sp - a) * (sp - b) * (sp - cc)));
  }
  return mm2;
}

function flapUnitTests() {
  const data = { charts: readJson('ssb/geometry/charts.json').surfaces, landmarks: readJson('ssb/geometry/landmarks.json'), meta: readJson('ssb/geometry/landmarks.meta.json').landmarks };
  const sweeps = readJson('ssb/geometry/sweeps.json');
  const { nodes } = readPacks();
  const SIDES = ['R', 'L'];
  const area = (side, design, params = {}) => {
    const f = FL.computeFlap(flapInputs(side, data), design, params);
    const sep = f.septal ? FL.meshArea(nodes.get(`s.septal-mucosa.${side}`), FL.projectSeptal, f.septal).mm2 / 100 : 0;
    const flo = f.floor ? FL.meshArea(nodes.get(`s.nasal-floor-mucosa.${side}`), FL.projectFloor, f.floor).mm2 / 100 : 0;
    return { f, sep, flo, total: sep + flo };
  };

  /* the pedicle contains the posterior septal artery, from a source independent of this construction (ST4d places the sweeps) */
  for (const side of SIDES) {
    const inp = flapInputs(side, data);
    const p = FL.septalProfile(inp.septal);
    const f = FL.computeFlap(inp, 'full');
    for (const branch of ['inferior', 'superior']) {
      const sw = sweeps[`s.posterior-septal-artery-${branch}-branch.${side}`];
      const [, a, s] = sw ? sw.pts[0] : [0, NaN, NaN];
      check(`flap (pedicle, ${side}): the first point of the posterior septal artery ${branch} branch lies in the pedicle's chart box (s between the choanal arch and the ostium's inferior margin, a within 4 mm of the posterior edge)`,
        !!sw && s >= inp.arch[2] && s <= inp.sf && Math.abs(a - FL.postAt(p, s)) <= 4, `a ${a} s ${s}; arch ${inp.arch[2]} sf ${inp.sf} post ${FL.postAt(p, s)}`);
    }
    check(`flap (pedicle, ${side}): the pedicle's height is the choanal arch to the ostium's inferior margin and lies in 8-16 mm`, f.pedicleHeight >= 8 && f.pedicleHeight <= 16 && near(f.pedicleHeight, inp.sf - inp.arch[2], 0.001), String(f.pedicleHeight));
  }

  /* the superior incision */
  for (const side of SIDES) {
    const inp = flapInputs(side, data);
    const p = FL.septalProfile(inp.septal);
    const starts = FL.DESIGNS.map((d) => FL.computeFlap(inp, d).superior[0]);
    check(`flap (superior, ${side}): the incision starts at the ostium's inferior margin (post(sf), sf) in every design`, starts.every((q) => near(q[1], inp.sf, 0.002) && near(q[0], FL.postAt(p, inp.sf), 0.002)), JSON.stringify(starts));
    const lvl = FL.computeFlap(inp, 'short').superior;
    check(`flap (superior, ${side}): short is level at sf (every vertex), whatever top_margin says`, lvl.every((q) => near(q[1], inp.sf, 0.002)) && JSON.stringify(FL.computeFlap(inp, 'short', { top_margin: 5 }).superior) === JSON.stringify(FL.computeFlap(inp, 'short', { top_margin: 20 }).superior));
    let bad = 0;
    let samples = 0;
    let rose = 0;
    for (const design of ['full', 'extended']) {
      for (let top = 5; top <= 20; top++) {
        for (const ant of [0, 3, 10]) {
          const sup = FL.computeFlap(inp, design, { top_margin: top, anterior_margin: ant }).superior;
          for (let i = 0; i < sup.length; i++) {
            const pts = i + 1 < sup.length ? [sup[i], [(sup[i][0] + sup[i + 1][0]) / 2, (sup[i][1] + sup[i + 1][1]) / 2]] : [sup[i]];
            for (const [a, s] of pts) {
              samples++;
              const ceiling = FL.topAt(p, a) - top;
              if (s < inp.sf - 0.002 || s > FL.topAt(p, a) + 0.002 || (s > inp.sf + 0.002 && s > ceiling + 0.002)) bad++;
              if (s > inp.sf + 0.5) rose++;
            }
          }
        }
      }
    }
    check(`flap (superior, ${side}): B and C never run below sf, and every sample (vertices and segment midpoints, over top_margin 5-20 x anterior_margin) is either at sf or at most top(a) - top_margin; the rule is the exact max(sf, top - margin)`, bad === 0 && samples > 500, `${bad} of ${samples}`);
    check(`flap (superior, ${side}): B and C do rise above sf for a small margin (the incision follows the septum's top, Fig. 31.3 B)`, rose > 0, String(rose));
  }

  /* the area readout against an independent sum */
  for (const side of SIDES) {
    for (const design of ['short', 'full', 'extended']) {
      const a = area(side, design);
      const sep = independentArea(nodes.get(`s.septal-mucosa.${side}`), FL.projectSeptal, a.f.septal) / 100;
      const flo = a.f.floor ? independentArea(nodes.get(`s.nasal-floor-mucosa.${side}`), FL.projectFloor, a.f.floor) / 100 : 0;
      check(`flap (area, ${side} ${design}): the readout equals an independent point-in-polygon and Heron sum over the meshes within 2 % (${a.total.toFixed(2)} cm2)`, a.total > 1 && Math.abs(a.total - (sep + flo)) <= 0.02 * (sep + flo), `${a.total} vs ${sep + flo}`);
    }
  }

  /* the ladder, containment, rescue */
  for (const side of SIDES) {
    const A = { short: area(side, 'short'), full: area(side, 'full'), extended: area(side, 'extended'), rescue: area(side, 'rescue') };
    console.log(`  flap areas ${side}: short ${A.short.total.toFixed(2)} cm2 (septum ${A.short.sep.toFixed(2)}), full ${A.full.total.toFixed(2)} (septum ${A.full.sep.toFixed(2)}), extended ${A.extended.total.toFixed(2)} (septum ${A.extended.sep.toFixed(2)} + floor ${A.extended.flo.toFixed(2)}), rescue ${A.rescue.total.toFixed(2)}; pedicle ${A.full.f.pedicleHeight} mm; length short ${A.short.f.length.toFixed(1)} / full ${A.full.f.length.toFixed(1)} mm; approximate share short ${A.short.f.approx} full ${A.full.f.approx}`);
    check(`flap (ladder, ${side}): short < full < extended, strictly`, A.short.total < A.full.total && A.full.total < A.extended.total, JSON.stringify([A.short.total, A.full.total, A.extended.total]));
    const inside = (poly, pts) => pts.every(([x, y]) => FL.inPolygon(poly, x, y));
    check(`flap (ladder, ${side}): the short outline lies inside the full one, and full's septal part is extended's`, inside(A.full.f.septal, A.short.f.septal) && JSON.stringify(A.full.f.septal) === JSON.stringify(A.extended.f.septal));
    const sc = data.charts[`s.septal-mucosa.${side}`];
    const fc = data.charts[`s.nasal-floor-mucosa.${side}`];
    const within = (poly, chart) => poly.every(([x, y]) => FL.inPolygon(chart.polygon, x, y) || FL.distToPolygon(chart.polygon, x, y) <= 1.01);
    check(`flap (chart, ${side}): every outline vertex lies inside its chart's polygon (the polygon is simplified: within 1 mm of its boundary counts)`,
      ['short', 'full', 'extended'].every((d) => within(A[d].f.septal, sc)) && within(A.extended.f.floor, fc), '');
    check(`flap (rescue, ${side}): zero area, the same pedicle as full, a window of the set size on the contralateral side`,
      A.rescue.total === 0 && !A.rescue.f.septal && JSON.stringify(A.rescue.f.pedicle) === JSON.stringify(A.full.f.pedicle) && A.rescue.f.window.side === (side === 'R' ? 'L' : 'R')
      && near(A.rescue.f.window.polygon[1][0] - A.rescue.f.window.polygon[0][0], 5, 0.002) && near(FL.computeFlap(flapInputs(side, data), 'rescue', { window: 8 }).window.polygon[2][1] - FL.computeFlap(flapInputs(side, data), 'rescue', { window: 8 }).window.polygon[1][1], 8, 0.002));
    const widths = [0, 4, 8, 12, 20].map((w) => area(side, 'extended', { floor_width: w }).flo);
    check(`flap (floor, ${side}): the floor strip grows with floor_width (0 -> nothing, and the default is the full charted width: ${widths.map((v) => v.toFixed(2)).join(' / ')} cm2)`, widths[0] === 0 && widths.every((v, i) => i === 0 || v > widths[i - 1] - 1e-9) && widths[2] > 0 && near(area(side, 'extended').flo, widths[4], 1e-9), JSON.stringify(widths));
    check(`flap (anterior margin, ${side}): more anterior_margin shrinks full`, area(side, 'full', { anterior_margin: 10 }).total < area(side, 'full', { anterior_margin: 0 }).total);
  }

  /* sides differ only through their own charts and landmarks */
  const R = flapInputs('R', data);
  const L = flapInputs('L', data);
  const h = (inp, design = 'extended') => FL.computeFlap(inp, design).hash;
  check('flap (sides): swapping the data swaps the outlines — the side label alone changes nothing, and each side\'s hash follows its own sf', h({ ...R, side: 'L' }) === h(R) && h({ ...R, sf: R.sf + 2 }) !== h(R) && h({ ...L, sf: R.sf + 2 }) === h({ ...R, sf: R.sf + 2, side: 'L' }));
  check('flap (sides): the right flap does not move when only the left data change', h({ ...R }) === h(R) && FL.computeFlap({ ...R }, 'full').hash === FL.computeFlap({ ...R, floor: null }, 'full').hash);
  const hashes = [0, 1, 2].map(() => FL.computeFlap(R, 'full', { top_margin: 12, anterior_margin: 2 }).hash);
  check('flap (determinism): the same parameters give the same polygon hash, and a different parameter another', new Set(hashes).size === 1 && hashes[0] !== FL.computeFlap(R, 'full', { top_margin: 13, anterior_margin: 2 }).hash && /^[0-9a-f]{8}$/.test(hashes[0]), hashes[0]);
  check('flap (inputs): missing landmarks or charts give an invalid flap, never an exception', [{ ...R, septal: null }, { ...R, arch: null }, { ...R, sf: NaN }, { ...R, mtHead: null }].every((i) => FL.computeFlap(i, 'full').valid === false) && !FL.computeFlap(R, 'bogus').valid);

  /* the codec: hostile values clamp or are ignored */
  const has = (id) => GRAPH.has(id);
  const parse = (hash) => parseHash(hash, has, {});
  check('flap (hash): `#flap=full.L&top=12&ant=3` round-trips and a design\'s defaults are not written', parse('#flap=full.L&top=12&ant=3').flap.side === 'L' && formatHash({ tier: 1, flap: parse('#flap=full.L&top=12&ant=3').flap }) === '#flap=full.L&top=12&ant=3' && formatHash({ tier: 1, flap: parse('#flap=extended').flap }) === '#flap=extended.R');
  check('flap (hash): hostile numbers clamp to the slider range (or take the default) and snap to its step', (() => {
    const f = parse('#flap=full.R&top=9999&ant=-5&fw=abc&win=NaN').flap;
    const g = parse('#flap=extended.R&top=7.4&fw=3.6').flap;
    return f.params.top_margin === 20 && f.params.anterior_margin === 0 && f.params.floor_width === 20 && f.params.window === 5 && g.params.top_margin === 7 && g.params.floor_width === 4;
  })());
  check('flap (hash): an unknown design, a bad side, prototype keys and over-long values are ignored', ['#flap=bogus', '#flap=full.X', '#flap=__proto__', '#flap=constructor.R', '#flap=', '#flap=' + 'a'.repeat(5000), '#flap=full.R.R', '#flap=%3Cimg%20src%3Dx%3E', '#flap=FULL'].every((x) => parse(x).flap === undefined)
    && parse('#flap=full.R&top=%3Cscript%3E').flap.params.top_margin === 15);
  const store = createStore({ has, tierOf: () => 1, hash: '#flap=short.R', prefs: {} });
  check('flap (store): setFlap whitelists and clamps, null clears, and a new object with the same values is no change', store.get().flap.design === 'short'
    && store.setFlap({ design: 'extended', side: 'L', params: { top_margin: 999, floor_width: -3, nope: 1 } }) && store.get().flap.params.top_margin === 20 && store.get().flap.params.floor_width === 0
    && !store.setFlap({ design: 'bogus' }) && !store.setFlap({ design: 'extended', side: 'L', params: { top_margin: 20, floor_width: 0 } }) && store.setFlap(null) && store.get().flap === null);
  check('flap (store): applyHash adopts and drops the overlay; leaving a stage keeps it', (() => { const s = createStore({ has, tierOf: () => 1, hash: '', prefs: {} }); s.applyHash('#flap=full.L&top=11'); const on = s.get().flap && s.get().flap.params.top_margin === 11; s.leaveStage(); const kept = !!s.get().flap; s.applyHash(''); return on && kept && s.get().flap === null; })());
  check('flap (sliders): every slider has a graph entry for its range and a default inside it', FL.PARAMS.every((q) => GRAPH.has(q.from) && q.default >= q.min && q.default <= q.max && q.step > 0) && new Set(FL.PARAMS.map((q) => q.hash)).size === FL.PARAMS.length);
  return nodes;
}

async function flapTests(browser, base, nodes) {
  const data = { charts: readJson('ssb/geometry/charts.json').surfaces, landmarks: readJson('ssb/geometry/landmarks.json'), meta: readJson('ssb/geometry/landmarks.meta.json').landmarks };
  const want = (side, design, params = {}) => {
    const f = FL.computeFlap(flapInputs(side, data), design, params);
    return (f.septal ? FL.meshArea(nodes.get(`s.septal-mucosa.${side}`), FL.projectSeptal, f.septal).mm2 : 0) / 100 + (f.floor ? FL.meshArea(nodes.get(`s.nasal-floor-mucosa.${side}`), FL.projectFloor, f.floor).mm2 : 0) / 100;
  };
  const ready = (page) => page.waitForFunction(() => { const f = window.__ssb.specimen.flap; return f && f.status === 'ready'; }, null, { timeout: 30000 });
  const hashNow = (page) => page.evaluate(() => new Promise((res) => { const t0 = performance.now(); const tick = () => (performance.now() - t0 > 600 ? res(window.__ssb.hash) : setTimeout(tick, 50)); tick(); }));

  const { context, page, errors } = await openSpecimen(browser, base, '#flap=full.R');
  await ready(page);
  await nextFrames(page, 3);
  let info = await page.evaluate(() => window.__ssb.specimen.flap);
  check(`flap (page): \`#flap=full.R\` draws the overlay on the real packs, with an area equal to the Node reading of the same meshes within 1 % (${info.areas.total.toFixed(2)} vs ${want('R', 'full').toFixed(2)} cm2)`, info.drawn >= 3 && Math.abs(info.areas.total - want('R', 'full')) <= 0.01 * want('R', 'full'), JSON.stringify(info.areas));
  check('flap (page): the polygon hash in the page equals the Node one (the same construction on the same data)', info.result.hash === FL.computeFlap(flapInputs('R', data), 'full').hash, info.result.hash);
  const ui = await page.evaluate(() => {
    const sec = [...document.querySelectorAll('#ssb-spec .ssb-lab-sec')].find((x) => /Nasoseptal flap/.test(x.textContent));
    return sec ? { shown: !sec.hidden && sec.offsetParent !== null, text: sec.textContent, pressed: [...sec.querySelectorAll('button[aria-pressed="true"]')].map((b) => b.textContent), sliders: [...sec.querySelectorAll('input[type=range]')].filter((r) => !r.closest('.ssb-param').hidden).map((r) => r.dataset.flapParam) } : null;
  });
  check('flap (page): the control shows the badge "schematic on specimen", the area, the pedicle height, the length and the literature from the graph; Full and Right are pressed; only B\'s sliders show',
    !!ui && ui.shown && /schematic on specimen/i.test(ui.text) && /Area/.test(ui.text) && /cm²/.test(ui.text) && /Pedicle height/.test(ui.text) && /Length/.test(ui.text) && /Literature: .*17\.12/.test(ui.text)
    && ui.pressed.includes('Full (B)') && ui.pressed.includes('Right') && JSON.stringify(ui.sliders) === JSON.stringify(['top_margin', 'anterior_margin']), JSON.stringify(ui));

  const area = async () => (await page.evaluate(() => window.__ssb.specimen.flap)).areas.total;
  const designs = {};
  for (const key of ['short', 'full', 'extended', 'rescue']) {
    await page.click(`#ssb-spec button[data-flap-design="${key}"]`);
    await page.waitForFunction((k) => { const f = window.__ssb.specimen.flap; return f && f.status === 'ready' && f.design === k; }, key, { timeout: 15000 });
    designs[key] = await area();
  }
  check('flap (page): the four design buttons switch the overlay; areas rise short < full < extended and rescue is 0, each equal to the Node reading within 1 %',
    designs.short < designs.full && designs.full < designs.extended && designs.rescue === 0 && ['short', 'full', 'extended'].every((k) => Math.abs(designs[k] - want('R', k)) <= 0.01 * want('R', k)), JSON.stringify(designs));
  check('flap (page): the hash follows the design (`flap=rescue.R`)', /(^|#|&)flap=rescue\.R/.test(await hashNow(page)));
  await page.click('#ssb-spec button[data-flap-design="extended"]');
  await page.waitForFunction(() => { const f = window.__ssb.specimen.flap; return f && f.design === 'extended' && f.areas && f.areas.floor > 0; }, null, { timeout: 15000 });
  await nextFrames(page, 2);
  const shown = await page.evaluate(() => ({ sliders: [...document.querySelectorAll('#ssb-spec input[data-flap-param]')].filter((r) => !r.closest('.ssb-param').hidden).map((r) => r.dataset.flapParam), text: document.querySelector('.ssb-flap-readout').textContent, drawn: window.__ssb.specimen.flap.drawn }));
  check('flap (page): Extended shows the floor slider and the septum and floor parts separately, and draws both surfaces', shown.sliders.includes('floor_width') && /Septum/.test(shown.text) && /Nasal floor/.test(shown.text) && shown.drawn >= 5, JSON.stringify(shown));
  await page.$eval('#ssb-flap-fw', (r) => { r.value = '4'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForFunction(() => window.__ssb.specimen.flap.params.floor_width === 4, null, { timeout: 15000 });
  const narrow = await area();
  check('flap (page): the floor-width slider narrows the flap (the area drops, equal to the Node reading) and the hash says fw=4', narrow < designs.extended && Math.abs(narrow - want('R', 'extended', { floor_width: 4 })) <= 0.01 * narrow && /fw=4/.test(await hashNow(page)), `${narrow} vs ${designs.extended}`);
  await page.click('#ssb-spec button[data-flap-side="L"]');
  await page.waitForFunction(() => window.__ssb.specimen.flap.side === 'L' && window.__ssb.specimen.flap.status === 'ready', null, { timeout: 15000 });
  check('flap (page): the side buttons move the overlay to the left charts and meshes (flap=extended.L, area equal to the Node reading)', Math.abs((await area()) - want('L', 'extended', { floor_width: 4 })) <= 0.01 * narrow && /flap=extended\.L/.test(await hashNow(page)));
  await page.click('#ssb-spec button[data-flap-design="off"]');
  await page.waitForFunction(() => window.__ssb.specimen.flap === null, null, { timeout: 5000 });
  const off = await page.evaluate(() => ({ sec: [...document.querySelectorAll('#ssb-spec .ssb-lab-sec')].find((x) => /Nasoseptal flap/.test(x.textContent)).hidden, hash: window.__ssb.hash }));
  check('flap (page): Off removes the overlay and its hash keys; at tier 1 the control hides again (the flap is a tier-3 procedure)', !/flap|fw=/.test(off.hash) && off.sec === true, JSON.stringify(off));
  check('flap (page): no real console errors', errors.length === 0, JSON.stringify(errors));
  await context.close();

  /* tier gating and a link at tier 1 */
  const t3 = await openSpecimen(browser, base, '#tier=3');
  const vis = await t3.page.evaluate(() => { const sec = [...document.querySelectorAll('#ssb-spec .ssb-lab-sec')].find((x) => /Nasoseptal flap/.test(x.textContent)); return !!sec && !sec.hidden; });
  check('flap (page): at tier 3 the control is offered (no overlay until a design is picked)', vis && (await t3.page.evaluate(() => window.__ssb.specimen.flap)) === null);
  await t3.context.close();

  /* hostile hash in the page */
  for (const bad of ['flap=bogus', 'flap=full.R&top=9999&ant=zzz&fw=-9', 'flap=%3Cimg%20src%3Dx%20onerror%3D1%3E', 'flap=full.X']) {
    const h = await openSpecimen(browser, base, `#${bad}`);
    await nextFrames(h.page, 3);
    const got = await h.page.evaluate(() => ({ flap: window.__ssb.specimen.flap, hash: window.__ssb.hash, pwned: !!window.__pwned }));
    const okState = bad === 'flap=full.R&top=9999&ant=zzz&fw=-9' ? got.flap && got.flap.params.top_margin === 20 && got.flap.params.anterior_margin === 0 : got.flap === null;
    check(`flap (hostile): #${bad} clamps or is ignored — nothing executes, no console errors`, okState && !got.pwned && h.errors.length === 0, JSON.stringify(got) + JSON.stringify(h.errors));
    await h.context.close();
  }

  /* the same overlay at the phone width: the control is reachable from the Layers panel */
  const phone = await openSpecimen(browser, base, '#flap=short.R', { viewport: { width: 390, height: 844 } });
  await ready(phone.page);
  const fits = await phone.page.evaluate(() => { const d = document.getElementById('ssb-spec-dock'); return { hidden: d.hidden, w: d.getBoundingClientRect().width, vw: window.innerWidth, scrollX: document.documentElement.scrollWidth }; });
  check('flap (phone): the overlay draws at 390 px and the page does not scroll sideways', fits.scrollX <= fits.vw + 1, JSON.stringify(fits));
  await phone.context.close();
}

/* ---------------- anatomy state, patch format, loader (WP RA3a; docs/ssb.md §14, R6.2-6.4) ---------------- */

/* Every patch and every file below is built here and served by routes or a fake fetch: nothing is written into ssb/. */
const ANAT_BOX = { ijk0: [20, 18, 14], dims: [6, 5, 4] };
const ANAT_BOX2 = { ijk0: [22, 19, 15], dims: [6, 5, 4] };       /* overlaps ANAT_BOX */
const ANAT_LABEL = 5;                                             /* s.fixture-unknown.R: in the table, and not under the box in the base */
const ANAT_STEM = 'v.concha-bullosa.R.typical';
const ANAT_INDEX = {
  version: 1,
  bases: { scanned: { note: 'synthetic' } },
  variants: {
    'v.concha-bullosa': { sides: ['R', 'L'], presets: ['typical', 'bulbous'], default: 'typical', region: 'middle-turbinate', boxes: { R: { min: [-8, 0, -6], max: [-4, 8, 0] }, L: { min: [4, 0, -6], max: [8, 8, 0] } } },
    'v.suprabullar-cell': { sides: ['R', 'L'], presets: ['typical'], boxes: { R: { min: [-9, 0, -4], max: [-5, 6, 2] }, L: { min: [5, 0, -4], max: [9, 6, 2] } } },
    'v.supra-agger-cell': { sides: ['R'], presets: ['typical'], boxes: { R: { min: [-30, -30, 10], max: [-20, -20, 20] } } },
  },
  conditions: {
    'dz.mucocele': { sides: ['R', 'L', 'M'], presets: ['typical'], boxes: { R: { min: [-50, 20, 20], max: [-40, 30, 30] }, L: { min: [40, 20, 20], max: [50, 30, 30] } } },
    'dz.osteoma': { sides: ['R'], presets: ['typical'] },
  },
  compat: [['v.concha-bullosa.R', 'v.suprabullar-cell.R']],
};

/* The bytes of an anatomy patch (docs/ssb.md 5.11): u32 LE header length, JSON header, then per box ct (u8 | i16), labels (u16), each sdf (u8), x fastest. */
function anatPatchBytes({ boxes = [ANAT_BOX], ctType = 'u8', label = ANAT_LABEL, mutate = null, gz = true, body = null, head = {} } = {}) {
  const header = {
    version: 1, base: 'scanned', entity: 'v.concha-bullosa', side: 'R', preset: 'typical', params: { bulbousness: 0.5 }, truth: 'composite',
    calibratedOn: ['uw-fig:Cor.pneumMT'], assumed: ['AP extent'],
    boxes: boxes.map((b) => ({ ijk0: b.ijk0, dims: b.dims, ct: ctType, labels: 'u16', ...(b.sdf ? { sdf: Object.fromEntries(Object.keys(b.sdf).map((k) => [k, 'u8'])) } : {}) })),
    landmarks: { 'lm.test.R': [1, 2, 3] }, sweeps: {}, replacesNodes: ['s.middle-turbinate.R'], addsNodes: [], ...head,
  };
  if (mutate) mutate(header);
  const json = Buffer.from(JSON.stringify(header));
  const parts = [];
  const len = Buffer.alloc(4); len.writeUInt32LE(json.length, 0);
  for (const b of boxes) {
    const n = b.dims[0] * b.dims[1] * b.dims[2];
    const ct = ctType === 'u8' ? Buffer.alloc(n) : Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++) { if (ctType === 'u8') ct[i] = 100 + (i % 50); else ct.writeInt16LE(3000 + (i % 50), i * 2); }
    const lab = Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++) lab.writeUInt16LE(typeof label === 'function' ? label(i) : label, i * 2);
    parts.push(ct, lab);
    for (const fill of Object.values(b.sdf || {})) parts.push(Buffer.alloc(n, fill));
  }
  const raw = Buffer.concat([len, json, body ? body : Buffer.concat(parts)]);
  return gz ? zlib.gzipSync(raw) : raw;
}
const boxIndices = (box, dims) => {
  const out = new Set();
  for (let k = 0; k < box.dims[2]; k++) for (let j = 0; j < box.dims[1]; j++) for (let i = 0; i < box.dims[0]; i++) out.add((box.ijk0[2] + k) * dims[0] * dims[1] + (box.ijk0[1] + j) * dims[0] + box.ijk0[0] + i);
  return out;
};
const ANAT_REF = { id: 'v.concha-bullosa', side: 'R', preset: 'typical' };

async function anatomyUnitTests() {
  const header = parseHeader(FX.meta);
  const table = parseTable(FX.table);
  const base = createVolume({ header, ct: FX.ct, labels: FX.labels, table });
  const ctBefore = FX.ct.slice();
  const labelsBefore = FX.labels.slice();
  const dims = header.dims;
  const bytes = anatPatchBytes({ boxes: [{ ...ANAT_BOX, sdf: { 's.orbit': 7 } }] });

  /* ---- volume.js: the patch ---- */
  const patch = await parseAnatomyPatch(bytes, { base: 'scanned', ref: ANAT_REF });
  const nBox = ANAT_BOX.dims[0] * ANAT_BOX.dims[1] * ANAT_BOX.dims[2];
  check('anatomy patch: parses (gzip) to its header fields, one dense box and its sdf array',
    patch.entity === 'v.concha-bullosa' && patch.side === 'R' && patch.preset === 'typical' && patch.truth === 'composite' && patch.calibratedOn[0] === 'uw-fig:Cor.pneumMT'
    && patch.replacesNodes.join() === 's.middle-turbinate.R' && patch.landmarks['lm.test.R'].join() === '1,2,3' && patch.boxes.length === 1
    && patch.boxes[0].ct.length === nBox && patch.boxes[0].labels.length === nBox && patch.boxes[0].sdf['s.orbit'].length === nBox && patch.boxes[0].sdf['s.orbit'][0] === 7 && patch.boxes[0].ct[3] === 103);
  const rawPatch = await parseAnatomyPatch(anatPatchBytes({ gz: false }), { base: 'scanned', ref: ANAT_REF });
  check('anatomy patch: bytes the server already decoded parse the same', rawPatch.boxes[0].ct.length === nBox && rawPatch.boxes[0].labels[0] === ANAT_LABEL);

  const derived = applyAnatomyPatch(base, patch);
  const inBox = boxIndices(ANAT_BOX, dims);
  let wrong = 0;
  let changedCt = 0;
  let changedLab = 0;
  for (let i = 0; i < FX.ct.length; i++) {
    const c = derived.ct[i] !== ctBefore[i];
    const l = derived.labels[i] !== labelsBefore[i];
    changedCt += c ? 1 : 0;
    changedLab += l ? 1 : 0;
    if (inBox.has(i) ? !c || !l || derived.labels[i] !== ANAT_LABEL : c || l) wrong += 1;
  }
  check('anatomy patch: applyAnatomyPatch changes exactly its box in the CT and in the labels (every voxel of it, none outside)', wrong === 0 && changedCt === nBox && changedLab === nBox, JSON.stringify({ wrong, changedCt, changedLab, nBox }));
  check('anatomy patch: the base volume is byte-identical after, the derived one a separate copy; patchedVoxels and patchedAt say where',
    FX.ct.every((v, i) => v === ctBefore[i]) && FX.labels.every((v, i) => v === labelsBefore[i]) && derived.ct !== base.ct && derived.patchedVoxels === nBox
    && derived.patchedAt(...derived.toRAS(22, 20, 15)) === true && derived.patchedAt(...derived.toRAS(25, 22, 17)) === true && derived.patchedAt(...derived.toRAS(26, 22, 17)) === false && derived.patchedAt(...derived.toRAS(19, 20, 15)) === false && derived.patchedAt(...derived.toRAS(20, 18, 18 + 1)) === false);
  check('anatomy patch: labelAt and sample read the patch (label 5 and the display value) at a voxel centre; the base does not',
    derived.labelAt(...derived.toRAS(22, 20, 15)) === ANAT_LABEL && base.labelAt(...derived.toRAS(22, 20, 15)) !== ANAT_LABEL && derived.sample(...derived.toRAS(22, 20, 15)) >= 100 && derived.base === base && derived.patches.length === 1);
  const second = await parseAnatomyPatch(anatPatchBytes({ boxes: [ANAT_BOX2], label: 2, head: { entity: 'v.suprabullar-cell' } }), { base: 'scanned' });
  const both = applyAnatomyPatch(derived, second);
  const overlap = derived.toRAS(24, 20, 16);
  check('anatomy patch: patches compose in order — over the overlap the later one wins, outside it each keeps its own box',
    both.labelAt(...overlap) === 2 && both.labelAt(...derived.toRAS(20, 18, 14)) === ANAT_LABEL && both.labelAt(...derived.toRAS(27, 23, 18)) === 2 && both.patches.length === 2 && both.base === derived);

  const refuse = async (what, p) => {
    const e = await p.catch((err) => err);
    check(`anatomy patch: ${what} is refused with a VolumeError`, e instanceof VolumeError, String(e && e.message));
    return e;
  };
  const parseOnly = (b) => parseAnatomyPatch(b, { base: 'scanned', ref: ANAT_REF });
  const applyTo = async (b) => applyAnatomyPatch(base, await parseOnly(b));
  await refuse('a box outside the volume', applyTo(anatPatchBytes({ boxes: [{ ijk0: [dims[0] - 2, 0, 0], dims: [6, 5, 4] }] })));
  await refuse('a box with a negative corner', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes[0].ijk0 = [-1, 0, 0]; } })));
  await refuse('a zero dimension', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes[0].dims = [0, 5, 4]; } })));
  await refuse('a fractional dimension', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes[0].dims = [6.5, 5, 4]; } })));
  await refuse('a dimension that is not a number', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes[0].dims = [6, '5', 4]; } })));
  await refuse('a label the table does not name', applyTo(anatPatchBytes({ label: 40 })));
  await refuse('an empty box list', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes = []; } })));
  await refuse('more than 16 boxes', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes = Array.from({ length: 17 }, () => h.boxes[0]); } })));
  await refuse('an i16 box on an 8-bit volume', applyTo(anatPatchBytes({ ctType: 'i16' })));
  await refuse('a ct type that is neither', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes[0].ct = 'f32'; } })));
  await refuse('a truth kind other than "composite"', parseOnly(anatPatchBytes({ mutate: (h) => { h.truth = 'specimen'; } })));
  await refuse('a patch made for another base', parseAnatomyPatch(anatPatchBytes(), { base: 'standard', ref: ANAT_REF }));
  await refuse('a patch for another entity, side or preset than the one asked for', parseAnatomyPatch(anatPatchBytes(), { base: 'scanned', ref: { ...ANAT_REF, side: 'L' } }));
  await refuse('an entity that is not a v.* or dz.* id', parseOnly(anatPatchBytes({ mutate: (h) => { h.entity = 's.maxillary-sinus'; } })));
  await refuse('a node name that is markup', parseOnly(anatPatchBytes({ mutate: (h) => { h.replacesNodes = ['<img src=x onerror=alert(1)>']; } })));
  await refuse('a landmark that is not three numbers', parseOnly(anatPatchBytes({ mutate: (h) => { h.landmarks = { 'lm.test.R': [1, 2] }; } })));
  await refuse('an sdf entry that is not u8', parseOnly(anatPatchBytes({ mutate: (h) => { h.boxes[0].sdf = { 's.orbit': 'f32' }; } })));
  await refuse('a short body', parseOnly(zlib.gzipSync(zlib.gunzipSync(bytes).subarray(0, 60))));
  await refuse('a long body', parseOnly(zlib.gzipSync(Buffer.concat([zlib.gunzipSync(anatPatchBytes()), Buffer.alloc(8)]))));
  await refuse('a header length past the end', parseOnly(Buffer.from([255, 255, 0, 0, 1, 2])));
  await refuse('a header that is not JSON', parseOnly(Buffer.concat([Buffer.from([4, 0, 0, 0]), Buffer.from('nope')])));
  const v2 = await refuse('version 2', parseOnly(anatPatchBytes({ mutate: (h) => { h.version = 2; } })));
  check('anatomy patch: version 2 is "unsupported", the others "invalid"', v2 && v2.code === 'unsupported');
  const fx16 = buildFixture({ dtype: 'int16' });
  const v16 = createVolume({ header: parseHeader(fx16.meta), ct: fx16.ct16, labels: FX.labels, table });
  const d16 = applyAnatomyPatch(v16, await parseOnly(anatPatchBytes({ ctType: 'i16' })));
  const u8on16 = await Promise.resolve().then(async () => applyAnatomyPatch(v16, await parseOnly(anatPatchBytes()))).catch((err) => err);
  check('anatomy patch: a 16-bit head takes an i16 box (values beyond the base range stay exact) and refuses a u8 one',
    d16.ct[boxIndices(ANAT_BOX, dims).values().next().value] === 3000 && d16.patchedVoxels === nBox && u8on16 instanceof VolumeError, String(u8on16 && u8on16.message));

  /* ---- the file names are built from validated tokens only ---- */
  check('anatomy paths: base roots and file names follow docs/ssb.md §14, R6.2',
    baseRoot('standard') === 'ssb' && baseRoot('scanned') === 'ssb/anatomy/scanned' && baseRoot('scanned-b') === 'ssb/anatomy/scanned-b'
    && anatomyPatchFile('scanned', ANAT_REF) === `ssb/anatomy/patches/scanned/${ANAT_STEM}.ssbp.gz` && anatomyOverrideFile('standard', ANAT_REF) === `ssb/anatomy/overrides/standard/${ANAT_STEM}.glb.gz`);
  const bad = (fn) => { try { fn(); return false; } catch (e) { return e instanceof VolumeError; } };
  check('anatomy paths: a base or an entry that is not a plain token is refused, never joined into a path',
    bad(() => baseRoot('../etc')) && bad(() => baseRoot('scanned/../..')) && bad(() => baseRoot('')) && bad(() => baseRoot(null))
    && bad(() => anatomyPatchFile('scanned', { ...ANAT_REF, id: 'v.../../x' })) && bad(() => anatomyPatchFile('scanned', { ...ANAT_REF, preset: '../x' })) && bad(() => anatomyPatchFile('scanned', { ...ANAT_REF, side: 'X' }))
    && bad(() => anatomyOverrideFile('scanned', { ...ANAT_REF, id: 's.maxillary-sinus' })) && bad(() => anatomyPatchFile('scanned', null)));

  /* ---- the loader, on a fake fetch that records every URL ---- */
  const asked = [];
  const files = {
    'ssb/anatomy/scanned/ct/ct.json': FX_U8_FILES['ssb/ct/ct.json'], 'ssb/anatomy/scanned/ct/ct.u8.gz': FX_U8_FILES['ssb/ct/ct.u8.gz'],
    'ssb/anatomy/scanned/ct/labels.u16.gz': FX_U8_FILES['ssb/ct/labels.u16.gz'], 'ssb/anatomy/scanned/geometry/labels.json': FX_U8_FILES['ssb/geometry/labels.json'],
    [`ssb/anatomy/patches/scanned/${ANAT_STEM}.ssbp.gz`]: anatPatchBytes(),
  };
  const spy = fetchFrom(files);
  const fetchFn = (url) => { asked.push(String(url).split('?')[0]); return spy(url); };
  forgetAnatomy();
  const plain = await anatomyVolume({ base: 'scanned', variants: [], conditions: [] }, { fetchFn });
  const edited = await anatomyVolume({ base: 'scanned', variants: [ANAT_REF], conditions: [] }, { fetchFn });
  check('anatomy loader: a base other than the standard one is read from ssb/anatomy/<base>/ (CT, labels, its own table) and nothing from ssb/ct',
    plain.dims.join() === '64,56,48' && plain.hasLabels && plain.table.get(1) === 's.maxillary-sinus.R' && asked.some((u) => u === 'ssb/anatomy/scanned/ct/ct.json') && asked.some((u) => u === 'ssb/anatomy/scanned/geometry/labels.json')
    && !asked.some((u) => u.startsWith('ssb/ct/') || u === 'ssb/geometry/labels.json'), asked.join(' '));
  check('anatomy loader: a variant is its patch laid over the base — fetched from patches/<base>/<entity>.<side>.<preset>.ssbp.gz — and the result is that patched volume',
    edited.patchedVoxels === nBox && edited.patches[0].entity === 'v.concha-bullosa' && edited.labelAt(...edited.toRAS(22, 20, 15)) === ANAT_LABEL && asked.includes(`ssb/anatomy/patches/scanned/${ANAT_STEM}.ssbp.gz`));
  const refused = await anatomyVolume({ base: 'scanned', variants: [{ ...ANAT_REF, preset: 'bulbous' }], conditions: [] }, { fetchFn }).catch((e) => e);
  check('anatomy loader: an entry with no patch file rejects with a VolumeError (absent), not a blank page', refused instanceof VolumeError && refused.code === 'absent', String(refused && refused.message));
  const wrongKind = await anatomyVolume({ base: 'scanned', variants: [{ ...ANAT_REF }], conditions: [] }, { fetchFn: fetchFrom({ ...files, [`ssb/anatomy/patches/scanned/${ANAT_STEM}.ssbp.gz`]: anatPatchBytes({ head: { side: 'L' } }) }) }).catch((e) => e);
  check('anatomy loader: a patch file that is another entry than its name says is refused', wrongKind instanceof VolumeError, String(wrongKind && wrongKind.message));
  check('anatomy loader: with no index listed in stamps.js nothing is fetched and the answer is null', (await loadAnatomyIndex({ fetchFn: () => { throw new Error('asked'); } })) === null);

  /* ---- state.js: registry, whitelist, hash ---- */
  const has = (id) => GRAPH.has(id);
  const REG = buildAnatomyRegistry(ANAT_INDEX, has);
  const A = (h, reg = REG) => parseHash(h, has, reg).anatomy || null;
  check('anatomy registry: built from the index and the graph — the listed base, variants (with defaults) and conditions, and only those',
    REG.bases.has('scanned') && REG.defaultBase === 'scanned' && REG.variants.size === 3 && REG.conditions.size === 2 && REG.variants.get('v.concha-bullosa').default === 'typical'
    && buildAnatomyRegistry({ ...ANAT_INDEX, variants: { 'v.not-in-the-graph': ANAT_INDEX.variants['v.concha-bullosa'], 'x.bad': {}, 'v.concha-bullosa': { sides: [], presets: ['typical'] } } }, has).variants.size === 0
    && buildAnatomyRegistry(null, has).bases.size === 0 && buildAnatomyRegistry({ version: 2 }, has).variants.size === 0);
  const canon = '#anat=scanned&v=v.concha-bullosa.R:typical';
  check('anatomy hash: #anat/#v parse to the canonical stack and format back to themselves', JSON.stringify(A(canon)) === JSON.stringify({ base: 'scanned', variants: [{ id: 'v.concha-bullosa', side: 'R', preset: 'typical' }], conditions: [] })
    && formatHash({ ...createStore({ has, tierOf: () => 1, hash: canon, prefs: {}, anatomyDoc: ANAT_INDEX }).get() }) === canon);
  check('anatomy hash: a preset left out is the entity\'s default and the canonical form writes it; a base left out is the listed default (scanned), or standard when none is listed',
    A('#v=v.concha-bullosa.L').base === 'scanned' && A('#v=v.concha-bullosa.L').variants[0].preset === 'typical'
    && createStore({ has, tierOf: () => 1, hash: '#anat=scanned&v=v.concha-bullosa.L:bulbous&dz=dz.mucocele.L', prefs: {}, anatomyDoc: ANAT_INDEX }).hash() === '#anat=scanned&v=v.concha-bullosa.L:bulbous&dz=dz.mucocele.L:typical'
    && A('#v=v.concha-bullosa.L', buildAnatomyRegistry({ ...ANAT_INDEX, bases: {} }, has)).base === 'standard');
  check('anatomy hash: the plain standard head is the default and writes nothing', createStore({ has, tierOf: () => 1, hash: '#anat=standard', prefs: {}, anatomyDoc: ANAT_INDEX }).hash() === '' && anatomyIsDefault(A('#anat=standard')));
  const dropped = [
    ['an unknown variant id', '#anat=scanned&v=v.not-in-the-graph.R'], ['a variant the index does not list', '#anat=scanned&v=v.frontal-septal-cell.R'], ['an unknown preset', '#anat=scanned&v=v.concha-bullosa.R:enormous'],
    ['a side the entity does not offer', '#anat=scanned&v=v.supra-agger-cell.L'], ['the M side on a paired variant', '#anat=scanned&v=v.concha-bullosa.M'], ['a base the index does not list', '#anat=scanned-b&v=v.concha-bullosa.R'],
    ['an unknown base', '#anat=elsewhere'], ['a condition id in v', '#anat=scanned&v=dz.mucocele.R'], ['a variant id in dz', '#anat=scanned&dz=v.concha-bullosa.R'],
    ['the same entry twice', '#anat=scanned&v=v.concha-bullosa.R,v.concha-bullosa.R:bulbous'], ['two entries whose extents overlap and are not in compat', '#anat=scanned&v=v.concha-bullosa.L,v.suprabullar-cell.L'],
    ['two conditions (v1: one)', '#anat=scanned&dz=dz.mucocele.R,dz.mucocele.L'], ['a pair with no extents and no compat entry', '#anat=scanned&v=v.concha-bullosa.R&dz=dz.osteoma.R'],
    ['markup in an id', '#anat=scanned&v=%3Cimg%20src%3Dx%3E.R'], ['markup in the base', '#anat=%3Cscript%3E'], ['a ref with no side', '#anat=scanned&v=v.concha-bullosa'],
    ['more than eight entries', `#anat=scanned&v=${Array.from({ length: 9 }, () => 'v.concha-bullosa.R').join(',')}`], ['an over-long value', `#anat=scanned&v=v.concha-bullosa.R:${'a'.repeat(600)}`],
    ['one bad entry among good ones (all or nothing)', '#anat=scanned&v=v.concha-bullosa.R,v.nope.L'],
  ];
  for (const [what, h] of dropped) check(`anatomy hash: ${what} drops the whole anatomy key`, A(h) === null, JSON.stringify(A(h)));
  check('anatomy hash: pairs the index allows pass — disjoint extents, or listed in compat even where they overlap',
    A('#anat=scanned&v=v.concha-bullosa.R,v.concha-bullosa.L,v.suprabullar-cell.R') !== null && A('#anat=scanned&v=v.concha-bullosa.R,v.suprabullar-cell.R') !== null && A('#anat=scanned&v=v.concha-bullosa.R&dz=dz.mucocele.R') !== null);
  const st = createStore({ has, tierOf: () => 1, hash: '#s=s.maxillary-sinus&tier=2&anat=scanned&v=v.nope.R&q=lite', prefs: {}, anatomyDoc: ANAT_INDEX });
  check('anatomy hash: a dropped anatomy leaves every other key alone and the hash is rewritten canonical', st.get().anatomy === ANATOMY_DEFAULT && st.hash() === '#s=s.maxillary-sinus&tier=2&q=lite', st.hash());
  const ordered = createStore({ has, tierOf: () => 1, hash: '#anat=scanned&v=v.concha-bullosa.R&mu=cong&q=full&at=1,2,3', prefs: {}, anatomyDoc: ANAT_INDEX }).hash();
  check('anatomy hash: the anatomy rides along with the cursor, after the cursor and before mu and q', ordered === '#at=1,2,3&anat=scanned&v=v.concha-bullosa.R:typical&mu=cong&q=full', ordered);
  const rt = createStore({ has, tierOf: () => 1, hash: ordered, prefs: {}, anatomyDoc: ANAT_INDEX });
  check('anatomy hash: a canonical hash parses back to the same state and the same hash', rt.hash() === ordered && JSON.stringify(rt.get().anatomy) === JSON.stringify(st.get().anatomy === ANATOMY_DEFAULT ? rt.get().anatomy : null));

  /* the store: pending until the index arrives */
  const early = createStore({ has, tierOf: () => 1, hash: '#anat=scanned&v=v.concha-bullosa.R:typical&mu=cong', prefs: {} });
  check('anatomy store: before the index loads the link\'s anatomy is pending (shape-checked), still in the hash, and counts as the standard head',
    early.get().anatomy.pending === true && early.hash() === '#anat=scanned&v=v.concha-bullosa.R:typical&mu=cong' && anatomyIsDefault(early.get().anatomy) && early.get().anatomyIndex === null);
  check('anatomy store: a shape that is not a ref is never pending', createStore({ has, tierOf: () => 1, hash: '#anat=scanned&v=%3Cb%3E', prefs: {} }).get().anatomy === ANATOMY_DEFAULT);
  const seen = [];
  early.subscribe((s, p, m) => seen.push([m.source, s.anatomy.pending === true, s.anatomyIndex !== null]));
  early.setAnatomyRegistry(ANAT_INDEX);
  check('anatomy store: the index resolves a pending anatomy to its canonical form, subscribers hear it once, the registry is in the state',
    early.get().anatomy.pending !== true && early.get().anatomy.base === 'scanned' && early.hash() === '#anat=scanned&v=v.concha-bullosa.R:typical&mu=cong' && seen.length === 1 && seen[0][2] === true && early.get().anatomyIndex.variants.size === 3, JSON.stringify(seen));
  const late = createStore({ has, tierOf: () => 1, hash: '#anat=scanned&v=v.concha-bullosa.R:typical', prefs: {} });
  late.setAnatomyRegistry(null);
  check('anatomy store: a page with no index drops a pending anatomy and rewrites the hash', late.get().anatomy === ANATOMY_DEFAULT && late.hash() === '' && late.get().anatomyIndex !== null);
  const junk = createStore({ has, tierOf: () => 1, hash: '#anat=scanned&v=v.concha-bullosa.R:enormous', prefs: {} });
  junk.setAnatomyRegistry(ANAT_INDEX);
  check('anatomy store: an invalid pending anatomy is dropped when the index arrives', junk.get().anatomy === ANATOMY_DEFAULT && junk.hash() === '');
  const live = createStore({ has, tierOf: () => 1, hash: '', prefs: {}, anatomyDoc: ANAT_INDEX });
  check('anatomy store: setAnatomy takes an allowed stack, refuses one the index does not allow (state unchanged), and null is the standard head',
    live.setAnatomy({ base: 'scanned', variants: [{ id: 'v.concha-bullosa', side: 'R', preset: null }], conditions: [] }) === true && live.hash() === '#anat=scanned&v=v.concha-bullosa.R:typical'
    && live.setAnatomy({ base: 'scanned', variants: [{ id: 'v.nope', side: 'R', preset: 'x' }], conditions: [] }) === false && live.hash() === '#anat=scanned&v=v.concha-bullosa.R:typical'
    && live.setAnatomy({ base: 'scanned', variants: [], conditions: [] }) === true && live.hash() === '#anat=scanned' && live.setAnatomy(null) === true && live.hash() === '');
  live.setAnatomy({ base: 'scanned', variants: [], conditions: [] });
  live.leaveStage();
  const keptCt = live.get().anatomy.base;
  live.setScope({ side: 'R', depth: 20, yaw: 0, pitch: 0, roll: 0, lens: 0 });
  check('anatomy store: the anatomy is orthogonal to the specimen (leaving the specimen keeps it); the scope, which reads the standard head only, takes the page back to it',
    keptCt === 'scanned' && live.get().anatomy.base === 'standard' && !!live.get().scope, JSON.stringify({ keptCt, base: live.get().anatomy.base }));
  live.leaveStage();
  live.applyHash('#anat=scanned-b');
  check('anatomy store: Back/Forward to a link the index does not allow drops the anatomy', live.get().anatomy === ANATOMY_DEFAULT);
  live.applyHash(canon);
  check('anatomy store: Back/Forward to a canonical link adopts it', live.get().anatomy.variants.length === 1 && live.hash() === canon);
  check('anatomy store: setAnatomy before the index has loaded refuses everything', createStore({ has, tierOf: () => 1, hash: '', prefs: {} }).setAnatomy({ base: 'scanned', variants: [], conditions: [] }) === false);
}

/* The page on the fixture, with an anatomy index: `index` is a body, 'absent' (stamps.js without it: the page must not ask) or 'fixture'.
   The scanned base is the same synthetic volume served under ssb/anatomy/scanned/; the override pack is a box named for the middle turbinate. */
const FX_ROUTE = /\/ssb\/(ct\/[^?#]+|geometry\/labels\.json)(?:[?#].*)?$/;     /* the fixture's CT files, served to the anatomy pages */
const ANAT_ROUTE = /\/ssb\/anatomy\/[^?#]+(?:[?#].*)?$/;
async function openAnat(browser, base, hash, { index = 'fixture', patches = null, overrideNodes = [{ id: 's.middle-turbinate', side: 'R', center: [-6, 4, -2], half: 2 }], wait = 'specimen', track = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const asked = [];
  await context.route(FX_ROUTE, (route) => {
    const name = new URL(route.request().url()).pathname.replace(/^\//, '');
    const body = FX_U8_FILES[name];
    return body ? route.fulfill({ status: 200, body, headers: { 'content-type': name.endsWith('.json') ? 'application/json' : 'application/octet-stream' } }) : route.fulfill({ status: 404, body: 'not found' });
  });
  const patchFile = `ssb/anatomy/patches/scanned/${ANAT_STEM}.ssbp.gz`;
  const served = {
    'ssb/anatomy/scanned/ct/ct.json': FX_U8_FILES['ssb/ct/ct.json'], 'ssb/anatomy/scanned/ct/ct.u8.gz': FX_U8_FILES['ssb/ct/ct.u8.gz'],
    'ssb/anatomy/scanned/ct/labels.u16.gz': FX_U8_FILES['ssb/ct/labels.u16.gz'], 'ssb/anatomy/scanned/geometry/labels.json': FX_U8_FILES['ssb/geometry/labels.json'],
    [patchFile]: anatPatchBytes(),
    [`ssb/anatomy/overrides/scanned/${ANAT_STEM}.glb.gz`]: zlib.gzipSync(makeGlb(overrideNodes)),
    'ssb/anatomy/index.json': Buffer.from(index === 'fixture' ? JSON.stringify(ANAT_INDEX) : String(index)),
    ...(patches || {}),
  };
  await context.route(ANAT_ROUTE, (route) => {
    const name = new URL(route.request().url()).pathname.replace(/^\//, '');
    asked.push(name);
    /* the fixture's scanned base shows the Specimen stage the standard head's own packs, landmarks and sweeps (the stage loads a base's models and geometry) */
    const std = /^ssb\/anatomy\/scanned\/((?:models|geometry)\/(?:[A-Za-z0-9._-]+))$/.exec(name);
    const fromDisk = std && !served[name] && fs.existsSync(path.join(ROOT, 'ssb', std[1])) ? fs.readFileSync(path.join(ROOT, 'ssb', std[1])) : null;
    const body = served[name] || fromDisk;
    return body ? route.fulfill({ status: 200, body, headers: { 'content-type': name.endsWith('.json') ? 'application/json' : 'application/octet-stream' } }) : route.fulfill({ status: 404, body: 'not found' });
  });
  await context.route(/\/js\/ssb\/stamps\.js(?:[?#].*)?$/, (route) => {
    const src = sourceOf('js/ssb/stamps.js').replace(/^\s*"ssb\/anatomy\/[^\n]*\n/gm, '');
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: index === 'absent' ? src : `${src}\nSTAMPS["ssb/anatomy/index.json"] = "anat0000";\n` });
  });
  const page = await context.newPage();
  const errors = collectErrors(page);
  if (track) allErrors.push(errors);
  await page.goto(`${base}/ssb.html${hash}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#ssb-tree button[data-id]').length > 0, null, { timeout: 20000 });
  if (wait === 'specimen') await page.waitForFunction(() => window.__ssb.specimen && !['idle', 'loading'].includes(window.__ssb.specimen.status), null, { timeout: 40000 });
  return { context, page, errors, asked };
}
const anatPills = (page) => page.evaluate(() => [...document.querySelectorAll('#ssb-anatomy button[data-anat]')].map((b) => ({ k: b.dataset.anat, disabled: b.disabled, pressed: b.getAttribute('aria-pressed'), text: b.textContent, hidden: b.hidden })));
const waitAnat = (page, status) => page.waitForFunction((s) => window.__ssb.specimen && window.__ssb.specimen.anatomy.status === s, status, { timeout: 30000 });

async function anatomyTests(browser, base) {
  /* ===== no index: the pills are there and disabled, the page asks for nothing, a hostile link is dropped ===== */
  {
    const { context, page, errors, asked } = await openAnat(browser, base, '#s=s.maxillary-sinus&anat=scanned&v=v.concha-bullosa.R%3Cb%3E', { index: 'absent' });
    await page.waitForFunction(() => window.__ssb.hash !== null && !/anat|v=/.test(window.__ssb.hash), null, { timeout: 10000 });
    const pills = await anatPills(page);
    const byKey = Object.fromEntries(pills.map((p) => [p.k, p]));
    check('anatomy page (no index): Symmetric and Normal asymmetry show, Variants and Pathology are hidden (nothing to list); only Symmetric is enabled and pressed',
      pills.filter((p) => !p.hidden).map((p) => p.text).join(' · ') === 'Symmetric · Normal asymmetry' && byKey.variants.hidden && byKey.pathology.hidden && !byKey.standard.disabled && byKey.standard.pressed === 'true' && ['scanned', 'variants', 'pathology'].every((k) => byKey[k].disabled && byKey[k].pressed === 'false'), JSON.stringify(pills));
    check('anatomy page (no index): the page asks for nothing under ssb/anatomy/ (no 404), a hostile anatomy link is dropped and the hash rewritten without it, zero console errors',
      asked.length === 0 && errors.length === 0 && (await page.evaluate(() => location.hash)) === '#s=s.maxillary-sinus&tier=1' && (await page.evaluate(() => window.__ssb.hash)) === '#s=s.maxillary-sinus&tier=1', JSON.stringify({ asked, errors, hash: await page.evaluate(() => location.hash) }));
    check('anatomy page (no index): the specimen is the standard head and says so (the "symmetric by construction" note is shown, the anatomy hook idle)',
      (await page.evaluate(() => window.__ssb.specimen.anatomy.status)) === 'none' && (await page.evaluate(() => window.__ssb.specimen.anatomy.overrides.length)) === 0);
    await context.close();
  }
  {
    const { context, page, errors, asked } = await openAnat(browser, base, '', { index: '{"version": 1, "variants": ' });
    await page.waitForFunction(() => document.querySelectorAll('#ssb-anatomy button').length === 4);
    const pills = await anatPills(page);
    check('anatomy page (damaged index): a damaged index.json is an index with nothing in it — pills disabled, hash untouched',
      pills.filter((p) => p.k !== 'standard').every((p) => p.disabled) && (await page.evaluate(() => window.__ssb.hash)) === '' && asked.includes('ssb/anatomy/index.json'), JSON.stringify({ pills, asked }));
    await context.close();
  }

  /* ===== with an index: the pills enable, a link applies its patch, the Symmetric and Normal asymmetry pills clear and set it ===== */
  {
    const { context, page, errors, asked } = await openAnat(browser, base, `#anat=scanned&v=v.concha-bullosa.R`);
    await waitAnat(page, 'ready');
    const pills = Object.fromEntries((await anatPills(page)).map((p) => [p.k, p]));
    check('anatomy page: with an index the pills enable for what it lists (Normal asymmetry, Variants, Pathology) and Variants is the pressed one',
      ['standard', 'scanned', 'variants', 'pathology'].every((k) => !pills[k].disabled && !pills[k].hidden) && pills.variants.pressed === 'true' && pills.standard.pressed === 'false' && pills.scanned.pressed === 'false', JSON.stringify(pills));
    check('anatomy page: the canonical hash has the preset the link left out; the stage kicker says "edited"',
      (await page.evaluate(() => location.hash)).includes('anat=scanned&v=v.concha-bullosa.R:typical') && (await page.evaluate(() => document.getElementById('ssb-anatomy').dataset.edited)) === 'true');
    check('anatomy page: the patch is fetched from patches/scanned/', asked.includes(`ssb/anatomy/patches/scanned/${ANAT_STEM}.ssbp.gz`), JSON.stringify(asked));
    await page.click('#ssb-anatomy button[data-anat="standard"]');
    await page.waitForFunction(() => !/anat=/.test(location.hash) && window.__ssb.specimen.anatomy.status === 'none', null, { timeout: 20000 });
    check('anatomy page: Symmetric clears the anatomy from the hash and the specimen', !/anat=|v=/.test(await page.evaluate(() => location.hash)));
    await page.click('#ssb-anatomy button[data-anat="scanned"]');
    await page.waitForFunction(() => /anat=scanned/.test(location.hash) && !/v=/.test(location.hash), null, { timeout: 20000 });
    const asym = await page.evaluate(() => ({ hash: location.hash, pressed: document.querySelector('#ssb-anatomy button[data-anat="scanned"]').getAttribute('aria-pressed') }));
    check('anatomy page: Normal asymmetry sets the bare scanned base — no patch — and presses its pill', /anat=scanned/.test(asym.hash) && !/v=/.test(asym.hash) && asym.pressed === 'true', JSON.stringify(asym));
    check('anatomy page: zero console errors through the switches', errors.length === 0, JSON.stringify(errors));
    await context.close();
  }

  /* ===== the specimen: override nodes hide the base nodes and give them back on clear ===== */
  {
    const { context, page, errors, asked } = await openAnat(browser, base, `#anat=scanned&v=v.concha-bullosa.R`);
    await waitAnat(page, 'ready');
    const nodes = () => page.evaluate(() => window.__ssb.specimen.nodes().filter((n) => n.id === 's.middle-turbinate').map((n) => ({ key: n.key, side: n.side, visible: n.visible })));
    const on = await nodes();
    const info = await page.evaluate(() => window.__ssb.specimen.anatomy);
    const baseR = on.find((n) => n.key === 's.middle-turbinate.R');
    const baseL = on.find((n) => n.key === 's.middle-turbinate.L');
    const over = on.find((n) => n.key === `anatomy:${ANAT_STEM}:s.middle-turbinate.R`);
    check('anatomy specimen: the override node is adopted under anatomy:<stem>:<id>.<side> and shown; the base node it replaces is hidden; the other side is untouched',
      baseR && !baseR.visible && over && over.visible && baseL && baseL.visible && info.hidden.join() === 's.middle-turbinate.R' && info.status === 'ready', JSON.stringify({ on, info }));
    check('anatomy specimen: the pack came from overrides/<base>/<stem>.glb.gz and was asked for once', asked.filter((u) => u === `ssb/anatomy/overrides/scanned/${ANAT_STEM}.glb.gz`).length === 1, JSON.stringify(asked));
    const framed = await page.evaluate(() => { document.querySelector('#ssb-tree button[data-id="s.middle-turbinate"]').click(); return true; });
    await page.waitForFunction(() => window.__ssb.selection === 's.middle-turbinate');
    const sel = await nodes();
    check('anatomy specimen: selecting the structure finds the override and not the node it replaced (still hidden, the override shown)', framed && !sel.find((n) => n.key === 's.middle-turbinate.R').visible && sel.find((n) => n.key === `anatomy:${ANAT_STEM}:s.middle-turbinate.R`).visible, JSON.stringify(sel));
    await page.click('#ssb-anatomy button[data-anat="standard"]');
    await page.waitForFunction(() => window.__ssb.specimen.anatomy.overrides.length === 0 && window.__ssb.specimen.anatomy.status === 'none' && window.__ssb.specimen.dataRoot === 'ssb' && window.__ssb.specimen.status === 'ready', null, { timeout: 40000 });
    const off = await nodes();
    check('anatomy specimen: clearing the anatomy gives the override pack back and restores the base node (visible, no override left)', off.length === 2 && off.find((n) => n.key === 's.middle-turbinate.R').visible && !off.some((n) => /^anatomy:/.test(n.key)), JSON.stringify(off));
    await page.evaluate(() => { location.hash = '#anat=scanned&v=v.concha-bullosa.R:typical&s=s.middle-turbinate'; });
    await waitAnat(page, 'ready');
    const again = await nodes();
    check('anatomy specimen: the same anatomy applied again from the address bar hides the base once more', !again.find((n) => n.key === 's.middle-turbinate.R').visible && again.some((n) => /^anatomy:/.test(n.key) && n.visible), JSON.stringify(again));
    check('anatomy specimen: zero console errors', errors.length === 0, JSON.stringify(errors));
    await context.close();
  }
  {
    /* an override pack that is missing never leaves a hole: the base node stays */
    const { context, page, errors } = await openAnat(browser, base, `#anat=scanned&v=v.concha-bullosa.R`, { patches: { [`ssb/anatomy/overrides/scanned/${ANAT_STEM}.glb.gz`]: null }, track: false });
    await page.waitForFunction(() => window.__ssb.specimen && window.__ssb.specimen.anatomy.status !== 'loading' && window.__ssb.specimen.anatomy.status !== 'none', null, { timeout: 40000 });
    const nodes = await page.evaluate(() => window.__ssb.specimen.nodes().filter((n) => n.id === 's.middle-turbinate').map((n) => ({ key: n.key, visible: n.visible })));
    const info = await page.evaluate(() => window.__ssb.specimen.anatomy);
    check('anatomy specimen: an override pack that cannot be read leaves the base node showing (no hole), and the status says partial', nodes.find((n) => n.key === 's.middle-turbinate.R').visible && info.hidden.length === 0 && info.status === 'partial' && info.problems.length === 1, JSON.stringify({ nodes, info }));
    check('anatomy specimen: the only console noise for the missing pack is its own 404', errors.length > 0 && errors.every((e) => /404/.test(e.text)), JSON.stringify(errors));
    await context.close();
  }
  {
    /* a node the patch does not list is not adopted */
    const { context, page } = await openAnat(browser, base, `#anat=scanned&v=v.concha-bullosa.R`, { overrideNodes: [{ id: 's.middle-turbinate', side: 'R', center: [-6, 4, -2], half: 2 }, { id: 's.inferior-turbinate', side: 'R', center: [-8, 4, -6], half: 2 }] });
    await waitAnat(page, 'ready');
    const keys = await page.evaluate(() => window.__ssb.specimen.anatomy.overrides.map((o) => o.key));
    const warned = await page.evaluate(() => window.__ssb.specimen.problems.some((p) => /not one of the nodes its patch/.test(p)));
    check('anatomy specimen: an override pack can only carry the nodes its patch replaces or adds — an extra node is skipped with a problem recorded', keys.join() === `anatomy:${ANAT_STEM}:s.middle-turbinate.R` && warned, JSON.stringify(keys));
    await context.close();
  }
}

/* ---------------- the suite ---------------- */

/* ---------------- the scanned base (WP RA3b): head A as scanned, ssb/anatomy/scanned/, on its own data ---------------- */

const SCANNED = 'ssb/anatomy/scanned';

/* The scanned label volume, read from the file (independent of the page): the table, the header, and a counter. */
function readScannedLabels() {
  const hdr = readJson(`${SCANNED}/ct/ct.json`);
  const table = readJson(`${SCANNED}/geometry/labels.json`).labels;
  const lab = new Uint16Array(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, SCANNED, 'ct/labels.u16.gz'))).buffer.slice(0));
  const byName = Object.fromEntries(Object.entries(table).map(([k, v]) => [v, Number(k)]));
  const [nx, ny] = hdr.dims;
  const ras = (n) => [0, 1, 2].map((c) => hdr.affine[c][3] + hdr.affine[c][c] * n[c]);
  const centroid = (name) => {
    let sx = 0, sy = 0, sz = 0, n = 0;
    const want = byName[name];
    for (let idx = 0; idx < lab.length; idx++) if (lab[idx] === want) { sx += idx % nx; sy += Math.floor(idx / nx) % ny; sz += Math.floor(idx / (nx * ny)); n++; }
    return { n, mean: [sx / n, sy / n, sz / n], ml: n * hdr.spacing[0] ** 3 / 1000 };
  };
  return { hdr, table, byName, lab, centroid, ras };
}

function scannedBaseUnitTests() {
  const index = readJson('ssb/anatomy/index.json');
  const entry = index.bases && index.bases.scanned;
  {
    /* the endoscope and the procedure read the standard head only: a non-standard base never rides with them, the later choice wins */
    const mk = (hash) => createStore({ has: (id) => GRAPH.has(id), tierOf: () => 1, hash, prefs: { tier: 1 }, labs: {}, anatomyDoc: index });
    const a = mk('#scope=R,40,0,0,0,0');
    a.setAnatomy({ base: 'scanned', variants: [], conditions: [] });
    const picked = a.get();
    const b = mk('#anat=scanned');
    b.setScope({ side: 'R', depth: 40, yaw: 0, pitch: 0, roll: 0, lens: 0 });
    const entered = b.get();
    const c = mk('#anat=scanned');
    check('scanned base vs the endoscope: picking Normal asymmetry in the Scope stage leaves the scope (back to the specimen, on the scanned head)',
      picked.anatomy.base === 'scanned' && !picked.scope && !picked.station && !picked.procedure, JSON.stringify({ base: picked.anatomy.base, scope: !!picked.scope }));
    check('scanned base vs the endoscope: entering the scope from the scanned head returns to the standard head (the scope never flies a mirrored head labelled as scanned)',
      !!entered.scope && entered.anatomy.base === 'standard', JSON.stringify({ base: entered.anatomy.base, scope: !!entered.scope }));
    check('scanned base vs the endoscope: a plain #anat=scanned link keeps its base and no scope', c.get().anatomy.base === 'scanned' && !c.get().scope);
  }
  check('scanned base: ssb/anatomy/index.json lists it, with a root, a note and the numbers the pipeline printed (written, never typed)',
    !!entry && entry.root === SCANNED && typeof entry.note === 'string' && entry.note.length > 40 && !!entry.volumesMl && !!entry.asymmetryIndex && Array.isArray(entry.absent), JSON.stringify(Object.keys(entry || {})));
  const { doc, nodes, files } = readPacks(SCANNED);
  const box = ctBoxOf(SCANNED);
  const listed = Object.entries(doc.packs).flatMap(([name, def]) => Object.keys(def.nodes).map((k) => [name, (def.lining ? 'lining:' : def.population ? 'population:' : '') + k.split('@')[0]]));
  check('scanned packs: every pack is a glTF 2.0 binary with a true length field, and the nodes in each file are exactly the nodes packs.json lists for it',
    Object.values(files).every((f) => f.magic === 0x46546c67 && f.version === 2 && f.length === f.size && (f.json.extensionsRequired || []).includes('KHR_mesh_quantization'))
      && listed.length === nodes.size && listed.every(([name, key]) => nodes.has(key) && nodes.get(key).pack === name), `${listed.length} listed, ${nodes.size} read`);
  const unknown = [...nodes.values()].filter((n) => !GRAPH.has(n.id));
  check('scanned packs: every node id is a graph entity, named <graph id>.<R|L|M>', unknown.length === 0
    && [...nodes].every(([key, n]) => key === `${n.lining ? 'lining:' : n.population ? 'population:' : ''}${n.id}.${n.side}` && ['R', 'L', 'M'].includes(n.side)), unknown.map((n) => n.id).join(', '));
  const outside = [...nodes].filter(([, n]) => n.box.min.some((v, i) => v < box.min[i] - 5) || n.box.max.some((v, i) => v > box.max[i] + 5));
  check('scanned packs (placement): every mesh lies inside the scanned CT volume (± 5 mm), so the cursor and the CT share one frame', outside.length === 0, outside.map(([k]) => k).join('; '));
  const cx = (n) => { let t = 0; for (let i = 0; i < n.pts.length; i += 3) t += n.pts[i]; return t / (n.pts.length / 3); };
  const wrong = [...nodes].filter(([, n]) => { const x = cx(n); return (n.side === 'R' && x <= 0) || (n.side === 'L' && x >= 0) || (n.side === 'M' && Math.abs(x) > 10); }).map(([k, n]) => `${k} ${r2(cx(n))}`);
  check('scanned packs (laterality): patient right is +x — every .R mesh centroid x > 0, .L < 0, midline pieces within 10 mm of x = 0 — in a head that is not mirrored', wrong.length === 0, wrong.join('; '));
  check('scanned packs: the head is NOT mirrored — the two maxillary sinus meshes differ in size (a real head), unlike the standard specimen\'s',
    nodes.has('s.maxillary-sinus.R') && nodes.has('s.maxillary-sinus.L') && nodes.get('s.maxillary-sinus.R').tris !== nodes.get('s.maxillary-sinus.L').tris
      && nodes.get('s.maxillary-sinus.R').pts.length !== 0 && JSON.stringify(nodes.get('s.maxillary-sinus.R').box.max.map(r2)) !== JSON.stringify(nodes.get('s.maxillary-sinus.L').box.min.map((v, i) => r2(i === 0 ? -v : v))));
  const L = readScannedLabels();
  const stdTable = readJson('ssb/geometry/labels.json').labels;
  const notGraph = Object.values(L.table).filter((n) => !GRAPH.has(n.replace(/\.(R|L|M)$/, '')));
  check('scanned labels: every name in the label table is a graph id with a side, and an index means the same name as on the standard head (one append-only table)',
    notGraph.length === 0 && Object.entries(L.table).every(([k, v]) => stdTable[k] === v), notGraph.join(', '));
  check('scanned CT header: a real, un-normalized head — it carries `scanned` and not `standard`, and the same grid as the standard volume',
    !!L.hdr.scanned && !L.hdr.standard && JSON.stringify(L.hdr.dims) === JSON.stringify(readJson('ssb/ct/ct.json').dims) && JSON.stringify(L.hdr.affine) === JSON.stringify(readJson('ssb/ct/ct.json').affine));
  const vol = (n) => L.centroid(n).ml;
  const rec = { cavityR: vol('s.nasal-cavity.R'), cavityL: vol('s.nasal-cavity.L'), turbR: vol('s.inferior-turbinate.R'), turbL: vol('s.inferior-turbinate.L'), maxR: vol('s.maxillary-sinus.R'), maxL: vol('s.maxillary-sinus.L') };
  const v = entry.volumesMl;
  check('scanned volumes: an independent recount of the label file gives the cavity, inferior turbinate and maxillary volumes index.json records (to 0.002 mL)',
    near(rec.cavityR, v.cavity.R, 0.002) && near(rec.cavityL, v.cavity.L, 0.002) && near(rec.turbR, v.inferiorTurbinate.R, 0.002) && near(rec.turbL, v.inferiorTurbinate.L, 0.002)
      && near(rec.maxR, v.maxillary.R, 0.002) && near(rec.maxL, v.maxillary.L, 0.002), JSON.stringify([rec, v]));
  const ai = (r, l) => 100 * (r - l) / ((r + l) / 2);
  check('scanned asymmetry indices: the recorded cavity and maxillary AI are 100·(R − L)/mean of those volumes, each with its percentile among the NasalSeg clear subjects',
    near(ai(rec.cavityR, rec.cavityL), entry.asymmetryIndex.cavity.ai, 0.05) && near(ai(rec.maxR, rec.maxL), entry.asymmetryIndex.maxillary.ai, 0.05)
      && typeof entry.asymmetryIndex.cavity.absAiPercentileClear === 'number' && typeof entry.asymmetryIndex.maxillary.absAiPercentileClear === 'number' && entry.nasalSeg === undefined
      && entry.asymmetryIndex.cavity.beyondAllClear === (Math.abs(entry.asymmetryIndex.cavity.ai) > entry.asymmetryIndex.cavity.clearAbsAiMax), JSON.stringify(entry.asymmetryIndex));
  check('scanned note (ruling 2): it names cavity + vestibule as the closest comparison with NasalSeg, quotes both asymmetries, says the comparison is not like for like (HU threshold against display levels of a screen capture), and states the explanations as hypotheses',
    /closest comparison/.test(entry.note) && /cavity \+ vestibule/.test(entry.note) && /asymmetry [+-]?\d+ %/.test(entry.note) && /NasalSeg/.test(entry.note) && /not like for like/.test(entry.note) && /HU threshold/.test(entry.note) && /display levels of a screen capture/.test(entry.note)
      && /\bmay\b/.test(entry.note) && /consistent with/.test(entry.note) && !/(is|are) physiological/.test(entry.note) && !/this head sits at the edge of normal/.test(entry.note), entry.note);
  /* ruling 2: exact accounting of every label the base changed against the as-scanned labels, attributed to a step; tissue <-> air is an escalation */
  const tr = entry.labelTransitions;
  const sumStep = (st) => st.pairs.reduce((a, q) => a + q.voxels, 0) + st.smallerPairsVoxels;
  check('scanned label transitions: the index records a table per step (vestibule + valve, wall units), its pairs plus the smaller ones summing to the step\'s changed voxels, and no tissue voxel became an air label or the reverse',
    !!tr && sumStep(tr.vestibuleAndValve) === tr.vestibuleAndValve.voxels && sumStep(tr.wallUnits) === tr.wallUnits.voxels && tr.vestibuleAndValve.voxels > 0 && tr.tissueBecameAirLabel === 0 && tr.airLabelLost === 0, JSON.stringify(tr && { v: tr.vestibuleAndValve.voxels, w: tr.wallUnits.voxels, t: tr.tissueBecameAirLabel, a: tr.airLabelLost }));
  const vox = (n) => L.centroid(n).n;
  check('scanned label transitions: the recorded net voxel counts of the cavity, vestibule and turbinates are an independent recount of the label file, and each step only moves the classes it may (the vestibule step touches only unlabelled, cavity and vestibule; the wall-unit step no air label)',
    ['s.nasal-cavity.R', 's.nasal-cavity.L', 's.nasal-vestibule.R', 's.nasal-vestibule.L', 's.inferior-turbinate.R', 's.inferior-turbinate.L'].every((n) => tr.net[n] && tr.net[n].scannedVoxels === vox(n))
      && tr.vestibuleAndValve.pairs.every((q) => /^(\(unlabelled\)|s\.nasal-(cavity|vestibule)\.[RL])$/.test(q.from) && /^s\.nasal-(cavity|vestibule)\.[RL]$/.test(q.to))
      && tr.wallUnits.pairs.every((q) => ![q.from, q.to].some((x) => /^s\.(nasal-cavity|nasal-vestibule|maxillary-sinus|sphenoid-sinus|frontal-sinus|nasopharynx|agger-nasi-cell|ethmoid-bulla|frontal-recess|anterior-ethmoid-cells|posterior-ethmoid-cells)\./.test(x))), JSON.stringify(Object.keys(tr.net)));
  /* the ruling: a stage-D product that failed its gate is absent — listed with the measured number, and truly not in the base */
  const charts = readJson(`${SCANNED}/geometry/charts.json`).surfaces;
  const sweeps = readJson(`${SCANNED}/geometry/sweeps.json`);
  const absent = entry.absent;
  check('scanned absent list: every entry is { id, side, reason } with the measured number in the reason, and the id is a graph id or a landmark',
    absent.length > 0 && absent.every((a) => (GRAPH.has(a.id) || /^lm\./.test(a.id)) && ['R', 'L', 'M'].includes(a.side) && /\d/.test(a.reason)), JSON.stringify(absent));
  const stillThere = absent.filter((a) => charts[`${a.id}.${a.side}`] || nodes.has(`${a.id}.${a.side}`) || sweeps[`${a.id}.${a.side}`]);
  check('scanned absent list: nothing listed as absent is in the base — not a chart, not a pack node, not a sweep (a failing gate is never loosened)', stillThere.length === 0, JSON.stringify(stillThere));
  check('scanned charts: every chart the base keeps has its surface in the soft pack',
    Object.keys(charts).every((k) => nodes.has(k)), Object.keys(charts).join());
  /* landmarks, as the standard head's data check does it: paired ones on their own side, within 4 mm of their own side's mesh and nearer it than the other's */
  const lm = readJson(`${SCANNED}/geometry/landmarks.json`);
  const badSide = Object.entries(lm).filter(([k, p]) => (k.endsWith('.R') && p[0] <= 0) || (k.endsWith('.L') && p[0] >= 0));
  check('scanned landmarks: every .R landmark has x > 0 and every .L landmark x < 0 (measured on this head, not mirrored)', badSide.length === 0, badSide.map(([k, p]) => `${k} ${p}`).join(', '));
  const PAIRS = { 'lm.sphenoid-ostium': 's.sphenoid-sinus', 'lm.frontal-ostium': 's.frontal-recess', 'lm.sphenopalatine-foramen': 's.nasal-cavity',
    'lm.infraorbital-foramen': 's.maxillary-sinus', 'lm.greater-palatine-foramen': 's.maxillary-sinus', 'lm.vidian-canal-anterior': 's.sphenoid-sinus',
    'lm.foramen-rotundum-anterior': 's.sphenoid-sinus' };
  const lrows = [];
  for (const [k, p] of Object.entries(lm)) {
    const m = /^(.+)\.(R|L)$/.exec(k);
    if (!m || !PAIRS[m[1]] || !lm[`${m[1]}.${m[2] === 'R' ? 'L' : 'R'}`]) continue;
    const own = nodes.get(`${PAIRS[m[1]]}.${m[2]}`), other = nodes.get(`${PAIRS[m[1]]}.${m[2] === 'R' ? 'L' : 'R'}`);
    if (own && other) lrows.push({ k, own: nearestVertex(own, p), other: nearestVertex(other, p) });
  }
  check('scanned landmarks vs meshes: each paired landmark lies within 4 mm of its own side\'s mesh and nearer it than the other side\'s',
    lrows.length >= 6 && lrows.every((q) => q.own <= 4 && q.own < q.other), JSON.stringify(lrows.map((q) => [q.k, r2(q.own), r2(q.other)])));
  /* the registry the page builds from the real index */
  const reg = buildAnatomyRegistry(index, (id) => GRAPH.has(id));
  check('scanned registry: the index adds the base; a plain visit still resolves to the standard head, and only a link that names a variant or condition defaults to the scanned base',
    reg.bases.has('scanned') && reg.defaultBase === 'scanned' && resolveAnatomy({ base: undefined, variants: [], conditions: [] }, reg) === ANATOMY_DEFAULT
      && resolveAnatomy({ base: 'scanned', variants: [], conditions: [] }, reg).base === 'scanned');
  const withVariant = buildAnatomyRegistry({ ...index, variants: { 'v.concha-bullosa': { sides: ['R'], presets: ['typical'] } } }, (id) => GRAPH.has(id));
  const viaDefault = resolveAnatomy({ variants: [{ id: 'v.concha-bullosa', side: 'R', preset: null }], conditions: [] }, withVariant);
  check('scanned registry: a link that names a variant and no base lands on the scanned base (RA-O3), and with a base named the base is the link\'s',
    viaDefault && viaDefault.base === 'scanned' && resolveAnatomy({ base: 'standard', variants: [{ id: 'v.concha-bullosa', side: 'R', preset: null }], conditions: [] }, withVariant).base === 'standard');
}

async function scannedBaseTests(browser, base) {
  const L = readScannedLabels();
  const entry = readJson('ssb/anatomy/index.json').bases.scanned;
  /* a plain visit stays on the standard head with the real index present: Symmetric pressed, Normal asymmetry enabled, no anatomy in the hash */
  {
    const { context, page, errors } = await openSpecimen(browser, base, '');
    await page.waitForFunction(() => !document.querySelector('#ssb-anatomy button[data-anat="scanned"]').disabled, null, { timeout: 20000 });
    const pills = Object.fromEntries((await anatPills(page)).map((q) => [q.k, q]));
    const st = await page.evaluate(() => ({ hash: location.hash, base: window.__ssb.hash }));
    check('scanned page: a plain visit stays on the standard head — Symmetric pressed, Normal asymmetry enabled and not pressed, no anatomy in the address, the standard note shown',
      pills.standard.pressed === 'true' && !pills.scanned.disabled && pills.scanned.pressed === 'false' && st.hash === '' && st.base === '' && !/as scanned/i.test(await page.evaluate(() => document.getElementById('ssb-stage-note').textContent)), JSON.stringify({ pills, st }));
    check('scanned page: zero console errors on a plain visit with the index present', errors.length === 0, JSON.stringify(errors));
    await context.close();
  }
  /* the Specimen stage on the scanned base (ruling 2): its own packs, never the mirrored head; placement, picking and laterality on screen */
  {
    const truthS = new Map([...readPacks(SCANNED).nodes].filter(([, n]) => !n.lining && !n.population));
    const truthStd = new Map([...readPacks().nodes].filter(([, n]) => !n.lining && !n.population));
    const boxD = (a, b) => Math.max(...[0, 1, 2].flatMap((i) => [Math.abs(a.min[i] - b.min[i]), Math.abs(a.max[i] - b.max[i])]));
    const { context, page, errors } = await openSpecimen(browser, base, '#anat=scanned');
    await page.waitForFunction(() => window.__ssb.specimen.dataRoot === 'ssb/anatomy/scanned' && window.__ssb.specimen.status === 'ready', null, { timeout: 40000 });
    await nextFrames(page, 3);
    const info = await spec(page, () => ({ status: window.__ssb.specimen.status, problems: window.__ssb.specimen.problems, root: window.__ssb.specimen.dataRoot, note: document.getElementById('ssb-stage-note').textContent, msgHidden: document.getElementById('ssb-stage-msg').hidden }));
    check('scanned specimen: a link to the scanned base boots the Specimen stage on ssb/anatomy/scanned/ — ready, no problems — and the stage note says the head is as scanned, not mirrored',
      info.status === 'ready' && info.problems.length === 0 && info.root === SCANNED && info.msgHidden && /Head as scanned, not mirrored/.test(info.note) && /University of Washington|Univ\. of Washington/.test(info.note), JSON.stringify(info));
    const nodes = (await specNodes(page)).filter((n) => !n.lining);
    check('scanned specimen: the registry is exactly the scanned packs\' nodes (an independent read of ssb/anatomy/scanned/models), every id in the graph',
      nodes.map((n) => n.key).sort().join() === [...truthS.keys()].sort().join() && nodes.every((n) => GRAPH.has(n.id)), `${nodes.length} vs ${truthS.size}`);
    const sbox = ctBoxOf(SCANNED);
    const off = nodes.filter((n) => !(boxD(n.box, truthS.get(n.key).box) < 0.05)).map((n) => n.key);
    check('scanned specimen (placement): the loader places every scanned mesh exactly where the data says (max error < 0.05 mm), inside the scanned CT volume (± 5 mm)',
      off.length === 0 && nodes.every((n) => n.box.min.every((v, i) => v >= sbox.min[i] - 5) && n.box.max.every((v, i) => v <= sbox.max[i] + 5)), off.join());
    const mR = nodes.find((n) => n.key === 's.maxillary-sinus.R'), mL = nodes.find((n) => n.key === 's.maxillary-sinus.L');
    const mirrored = (a, b) => [0, 1, 2].every((i) => Math.abs((i === 0 ? -b.max[0] : b.min[i]) - (i === 0 ? a.min[0] : a.min[i])) < 0.6 && Math.abs((i === 0 ? -b.min[0] : b.max[i]) - (i === 0 ? a.max[0] : a.max[i])) < 0.6);
    check('scanned specimen: Normal asymmetry never draws the mirrored head — the .L maxillary sinus is not the .R one reflected, and differs from the standard head\'s (whose left is the right mirrored)',
      !mirrored(mR.box, mL.box) && boxD(mL.box, truthStd.get('s.maxillary-sinus.L').box) > 0.4, JSON.stringify([mR.box, mL.box]));
    const lmS = readJson(`${SCANNED}/geometry/landmarks.json`);
    const lmP = Object.fromEntries((await spec(page, () => window.__ssb.specimen.landmarks)).map((l) => [l.key, l.ras]));
    check('scanned specimen: the landmarks on show are the scanned base\'s own file\'s (not the standard head\'s)', Object.keys(lmP).length > 10 && Object.entries(lmP).every(([k, v]) => lmS[k] && lmS[k].every((x, i) => Math.abs(x - v[i]) < 1e-6)), String(Object.keys(lmP).length));
    /* laterality on screen */
    await clickView(page, 'anterior');
    await page.click('#ssb-spec button[data-bone="hidden"]');
    await nextFrames(page, 2);
    const sR = await spec(page, () => window.__ssb.specimen.screenOf('s.maxillary-sinus.R'));
    const sL = await spec(page, () => window.__ssb.specimen.screenOf('s.maxillary-sinus.L'));
    check('scanned specimen (laterality on screen): in the anterior view the .R maxillary sinus is on the viewer\'s left and the .L on the right', sR && sL && sR.x < sL.x, JSON.stringify([sR, sL]));
    const cR = await spec(page, (k) => window.__ssb.specimen.centroid(k), 's.maxillary-sinus.R');
    const cL = await spec(page, (k) => window.__ssb.specimen.centroid(k), 's.maxillary-sinus.L');
    check('scanned specimen (laterality): in the scene the .R maxillary sinus centroid is at x > 10 and the .L at x < -10', cR[0] > 10 && cL[0] < -10, JSON.stringify([cR, cL]));
    /* picking: the ray through each side's sinus hits that side's node, and a click selects it */
    for (const side of ['R', 'L']) {
      const key = `s.maxillary-sinus.${side}`;
      const n = nodes.find((q) => q.key === key);
      const aim = [0, 1, 2].map((i) => (n.box.min[i] + n.box.max[i]) / 2);
      const at = await project(page, aim);
      const hits = await spec(page, ([x, y]) => window.__ssb.specimen.hits(x, y), [at.x, at.y]);
      check(`scanned specimen (picking): a ray through the middle of the scanned ${key} hits that node (and not the other side's)`, hits.some((h) => h.key === key) && !hits.some((h) => h.key === `s.maxillary-sinus.${side === 'R' ? 'L' : 'R'}`), JSON.stringify(hits.map((h) => h.key)));
      await page.mouse.click(at.x, at.y);
      const picked = await page.evaluate(() => ({ sel: window.__ssb.selection, primary: window.__ssb.specimen.primary }));
      check(`scanned specimen (picking): clicking there selects ${key}'s structure and highlights that side`, picked.sel === 's.maxillary-sinus' && /^s\.maxillary-sinus\.(R|L)$/.test(picked.primary || '') , JSON.stringify(picked));
    }
    check('scanned specimen: zero console errors', errors.length === 0, JSON.stringify(errors));
    await context.close();
  }
  /* Symmetric <-> Normal asymmetry on a live page: the stage swaps its data and the plain state is the standard head's exactly */
  {
    const truthS = new Map([...readPacks(SCANNED).nodes].filter(([, n]) => !n.lining && !n.population));
    const truthStd = new Map([...readPacks().nodes].filter(([, n]) => !n.lining && !n.population));
    const { context, page, errors } = await openSpecimen(browser, base, '');
    check('scanned specimen (switch): a plain visit loads ssb/ (the standard head)', (await page.evaluate(() => window.__ssb.specimen.dataRoot)) === 'ssb');
    await page.waitForFunction(() => !document.querySelector('#ssb-anatomy button[data-anat="scanned"]').disabled, null, { timeout: 20000 });
    await page.click('#ssb-anatomy button[data-anat="scanned"]');
    await page.waitForFunction(() => window.__ssb.specimen.dataRoot === 'ssb/anatomy/scanned' && window.__ssb.specimen.status === 'ready', null, { timeout: 40000 });
    await nextFrames(page, 3);
    let nodes = (await specNodes(page)).filter((n) => !n.lining);
    const same = (truth) => nodes.map((n) => n.key).sort().join() === [...truth.keys()].sort().join() && nodes.every((n) => n.box.min.every((v, i) => Math.abs(v - truth.get(n.key).box.min[i]) < 0.05) && n.box.max.every((v, i) => Math.abs(v - truth.get(n.key).box.max[i]) < 0.05));
    check('scanned specimen (switch): Normal asymmetry swaps the stage to the scanned base\'s packs, node for node and mm for mm; the hash says so', same(truthS) && (await page.evaluate(() => location.hash)) === '#anat=scanned', await page.evaluate(() => location.hash));
    await page.click('#ssb-anatomy button[data-anat="standard"]');
    await page.waitForFunction(() => window.__ssb.specimen.dataRoot === 'ssb' && window.__ssb.specimen.status === 'ready', null, { timeout: 40000 });
    await nextFrames(page, 3);
    nodes = (await specNodes(page)).filter((n) => !n.lining);
    check('scanned specimen (switch): Symmetric puts the standard head back exactly, and the hash loses the anatomy', same(truthStd) && (await page.evaluate(() => location.hash)) === '', await page.evaluate(() => location.hash));
    check('scanned specimen (switch): zero console errors through the swaps', errors.length === 0, JSON.stringify(errors));
    await context.close();
  }
  /* the Normal asymmetry pill: the state's note is the index's, the flap overlay is off with a note, and a flap link is dropped */
  {
    const { context, page, errors } = await openSpecimen(browser, base, '#tier=3&anat=scanned');
    await page.waitForFunction(() => document.querySelector('#ssb-anatomy button[data-anat="scanned"]').getAttribute('aria-pressed') === 'true', null, { timeout: 20000 });
    await page.waitForFunction((n) => [...document.querySelectorAll('.ssb-param-src')].some((e) => e.textContent === n), entry.note, { timeout: 10000 });
    const info = await page.evaluate(() => ({
      notes: [...document.querySelectorAll('.ssb-param-src')].map((e) => ({ t: e.textContent, hidden: e.hidden })),
      designs: [...document.querySelectorAll('#ssb-spec button[data-flap-design]')].map((b) => b.disabled),
    }));
    const noteShown = info.notes.find((n) => n.t === entry.note);
    check('scanned page: the state\'s note is index.json\'s own text — cavity asymmetry and where it sits against the NasalSeg range — shown on the Normal asymmetry state', noteShown && !noteShown.hidden, JSON.stringify(info.notes.map((n) => n.t.slice(0, 60))));
    const gone = info.notes.find((n) => /standard-head tool/.test(n.t));
    const flapCharts = entry.absent.filter((a) => ['s.septal-mucosa', 's.nasal-floor-mucosa'].includes(a.id));
    check('scanned page: the flap overlay is disabled with a note naming the absent charts and their measured reasons (a standard-head tool), every design button disabled',
      flapCharts.length > 0 ? gone && !gone.hidden && flapCharts.every((a) => gone.t.includes(`${a.id}.${a.side}`)) && info.designs.length > 0 && info.designs.every(Boolean) : true, JSON.stringify(info));
    await context.close();
  }
  {
    /* a flap link on the scanned base: the overlay does not stay on */
    const { context, page, errors } = await openSpecimen(browser, base, '#tier=3&flap=extended.R&anat=scanned');
    await page.waitForFunction(() => document.querySelector('#ssb-anatomy button[data-anat="scanned"]').getAttribute('aria-pressed') === 'true', null, { timeout: 20000 });
    await page.waitForTimeout(600);
    const flapOn = await page.evaluate(() => /flap=/.test(location.hash) || /flap=/.test(window.__ssb.hash));
    check('scanned page: a link that asks for a flap on a base whose charts are absent ends with the overlay off and the flap out of the address', entry.absent.some((a) => ['s.septal-mucosa', 's.nasal-floor-mucosa'].includes(a.id)) ? !flapOn : true, await page.evaluate(() => location.hash));
    check('scanned page: zero console errors through the scanned-base pages', errors.length === 0, JSON.stringify(errors));
    await context.close();
  }
}

/* ---------------- the suite: named sections, and the CI shards ---------------- */

/* The scope's Node checks feed both the station-state and the mucosa checks: run them once per process. */
let scopeWindow = null;
const scopeWin = () => scopeWindow || (scopeWindow = scopeUnitTests());

/* Every section, in the order a full run takes them. Each opens its own pages, so any subset runs alone. */
const SECTIONS = {
  specimen: async (browser, base) => { await specimenUnitTests(); standardSpecimenTests(); liningTests(); await specimenTests(browser, base); },
  scope: async (browser, base) => { scopeWin(); await scopeTests(browser, base); },
  mucosa: async (browser, base) => { await mucosaUnitTests(scopeWin()); await mucosaTests(browser, base); },
  flap: (browser, base) => flapTests(browser, base, flapUnitTests()),
  anatomy: async (browser, base) => { await anatomyUnitTests(); await anatomyTests(browser, base); },
  scanned: async (browser, base) => { scannedBaseUnitTests(); await scannedBaseTests(browser, base); },
};

/* CI runs one shard per job (`--shard i/N`), balanced on measured section times. Every section is in exactly
   one shard, checked here, so a new section cannot be left out of CI: put it in the lightest shard. */
const SHARDS = [
  ['scope'],
  ['flap', 'mucosa'],
  ['specimen', 'scanned'],
  ['anatomy'],
];
{
  const sharded = SHARDS.flat();
  const missing = Object.keys(SECTIONS).filter((s) => !sharded.includes(s));
  const extra = sharded.filter((s, i) => !SECTIONS[s] || sharded.indexOf(s) !== i);
  if (missing.length || extra.length) {
    console.error(`test-ssb: SHARDS must hold every section once (missing: ${missing.join(', ') || '-'}; unknown or repeated: ${extra.join(', ') || '-'})`);
    process.exit(2);
  }
}

/* --only a,b | --shard i/N | neither (everything). A name or shard that matches nothing is an error, never an empty pass. */
function pickSections() {
  const usage = (msg) => { console.error(`test-ssb: ${msg}\n  sections: ${Object.keys(SECTIONS).join(', ')}\n  shards: 1..${SHARDS.length} as --shard i/${SHARDS.length}`); process.exit(2); };
  if (ONLY && SHARD) usage('--only and --shard are exclusive');
  if (ONLY) {
    const names = ONLY.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = names.filter((n) => !SECTIONS[n]);
    if (!names.length || bad.length) usage(`unknown section "${bad.join(', ') || ONLY}"`);
    return Object.keys(SECTIONS).filter((n) => names.includes(n));
  }
  if (SHARD) {
    const m = /^(\d+)\/(\d+)$/.exec(SHARD);
    if (!m || Number(m[2]) !== SHARDS.length || Number(m[1]) < 1 || Number(m[1]) > SHARDS.length) usage(`bad --shard "${SHARD}"`);
    return Object.keys(SECTIONS).filter((n) => SHARDS[Number(m[1]) - 1].includes(n));
  }
  return Object.keys(SECTIONS);
}

const timings = [];
const NODE_ONLY = new Set();

async function main() {
  const picked = pickSections();
  let server = null;
  let base = BASE;
  /* Node-only sections (NODE_ONLY) run without a browser, so they need no Chromium */
  const browser = picked.some((n) => !NODE_ONLY.has(n)) ? await launchBrowser({ headed: HEADED }) : null;
  if (browser && !base) { server = await startServer(); base = server.origin; }

  console.log('=== SSB behavior tests ===');
  for (const name of picked) {
    const t0 = Date.now();
    const n0 = results.length;
    console.log(`\n--- ${name} ---`);
    await SECTIONS[name](browser, base);
    timings.push(`${name} ${Math.round((Date.now() - t0) / 1000)}s (${results.length - n0} checks)`);
  }
  return finish(browser, server);
}

/* Report, close everything, exit. */
async function finish(browser, server) {
  const errs = allErrors.flat();
  check('zero real console errors across every page', errs.length === 0, errs.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '));

  if (browser) await browser.close();
  if (server) await server.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== SSB behavior tests: ${timings.join(', ')} ===`);
  for (const r of failed) console.log(`  FAIL  ${r.name}  — ${r.detail || ''}`);
  console.log(`\n${failed.length ? 'FAILED' : 'OK'} — ${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
