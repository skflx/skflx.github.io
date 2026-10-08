#!/usr/bin/env node
/* =============================================================
   check-data.mjs — committed-data invariant checker (dev-only).

   The site ships no build step, so the committed JS data files ARE
   the databases: nothing re-checks the OKSAT manifest/modules or the
   airway bank once they land. This does.

   Pure Node, ZERO npm dependencies. Reports PASS/FAIL per check and
   exits nonzero if any check fails. Loads window.*-style data files
   in a sandbox.

   Usage:  node tools/check-data.mjs

   Item schemas learned from the real modules (read before trusting):
   - MCQ item:    { id, type:'mcq', stem, options:[{id,text}...],
                    correct:<option id>, brief, ... concepts:[] }
   - Recall item: { id, type:'recall', stem, answer, brief, concepts:[] }
     (no options / no `correct`; graded by self-report)
   - Airway question: { id, topic, difficulty, q, a, pearl,
                        choices:[correct, ...distractors] }  (choices[0] correct)

   Every check here passes on master. If a check fails
   on untouched master, the CHECK is wrong — investigate before editing data.
   ============================================================= */
import crypto from 'crypto';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';
import { stampHtml, stampSsb, rootPages } from './stamp-assets.mjs';
import { validate as validateSsb, contentFiles as ssbFiles, validateGeometry as validateSsbGeometry } from './ssb-content.mjs';
import { loadEngine, bakeAll } from './ascii3d.mjs';
/* Resolve repo root from this file so the checker runs from anywhere. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);

let failures = 0;
let checks = 0;
function pass(msg) { checks++; console.log('  PASS  ' + msg); }
function fail(msg) { checks++; failures++; console.log('  FAIL  ' + msg); }
/* Assert helper: cond true → pass(okMsg); else fail(failMsg). */
function ok(cond, okMsg, failMsg) { cond ? pass(okMsg) : fail(failMsg || okMsg); }

/* Load a `window.__X = {...}` data file in a sandbox, return the window. */
function loadWindow(absPath) {
  const src = fs.readFileSync(absPath, 'utf8');
  const win = {};
  new Function('window', src + '\n;return window;')(win);
  return win;
}

/* ===========================================================
   1. OKSAT manifest <-> modules
   =========================================================== */
function checkOksat() {
  console.log('\njs/oksat-manifest.js <-> js/mcq-modules/*');
  let man;
  try { man = loadWindow(rel('js/oksat-manifest.js')); }
  catch (e) { fail('manifest load: ' + e.message); return; }

  const manifest = man.OKSAT_MANIFEST;
  const subs = man.OKSAT_SUBSPECIALTIES || {};
  ok(Array.isArray(manifest) && manifest.length > 0, 'OKSAT_MANIFEST is a non-empty array', 'OKSAT_MANIFEST missing/empty');
  if (!Array.isArray(manifest)) return;

  const manifestFiles = new Set();
  for (const entry of manifest) {
    const tag = entry.slug || '<no slug>';
    if (!entry.data || !fs.existsSync(rel(entry.data))) { fail(`${tag}: data file missing (${entry.data})`); continue; }
    manifestFiles.add(path.basename(entry.data));

    let w;
    try { w = loadWindow(rel(entry.data)); }
    catch (e) { fail(`${tag}: module load threw — ${e.message}`); continue; }
    const mod = w.__MCQ_MODULE;
    if (!mod || !Array.isArray(mod.ITEMS)) { fail(`${tag}: no __MCQ_MODULE.ITEMS array`); continue; }

    ok(entry.count === mod.ITEMS.length, `${tag}: manifest count ${entry.count} === ITEMS ${mod.ITEMS.length}`,
      `${tag}: manifest count ${entry.count} !== ITEMS ${mod.ITEMS.length}`);
    ok(entry.slug === path.basename(entry.data, '.js'), `${tag}: slug matches filename`,
      `${tag}: slug !== filename ${path.basename(entry.data, '.js')}`);
    ok(!!subs[entry.subspecialty], `${tag}: subspecialty '${entry.subspecialty}' is a known hue`,
      `${tag}: subspecialty '${entry.subspecialty}' not in OKSAT_SUBSPECIALTIES`);

    // per-item shape
    const bad = [];
    mod.ITEMS.forEach((it, i) => {
      const where = `${tag}#${it.id || i}`;
      const type = it.type || 'mcq';
      if (type === 'recall') {
        if (typeof it.answer !== 'string' || !it.answer.trim()) bad.push(`${where}: recall missing answer`);
      } else {
        if (!Array.isArray(it.options) || it.options.length < 2) { bad.push(`${where}: <2 options`); return; }
        const optIds = it.options.map((o) => String(o.id));
        if (!optIds.includes(String(it.correct))) bad.push(`${where}: correct '${it.correct}' not an option id`);
      }
    });
    ok(bad.length === 0, `${tag}: all ${mod.ITEMS.length} items well-formed`,
      `${tag}: ${bad.length} malformed items (e.g. ${bad.slice(0, 3).join(' ; ')})`);
  }

  // orphan detection: every mcq-modules/*.js must be in the manifest
  const onDisk = fs.readdirSync(rel('js/mcq-modules')).filter((f) => f.endsWith('.js'));
  const orphans = onDisk.filter((f) => !manifestFiles.has(f));
  ok(orphans.length === 0, 'no orphan module files', `module files not in manifest: ${orphans.join(', ')}`);
}

/* ===========================================================
   2. Airway question bank
   =========================================================== */
function checkAirway() {
  console.log('\njs/airway-questions.js');
  let w;
  try { w = loadWindow(rel('js/airway-questions.js')); }
  catch (e) { fail('load: ' + e.message); return; }
  const data = w.AIRWAY_DATA;
  ok(data && Array.isArray(data.questions), 'AIRWAY_DATA.questions is an array', 'AIRWAY_DATA.questions missing');
  if (!data || !Array.isArray(data.questions)) return;

  const topicIds = new Set((data.topics || []).map((t) => t.id));
  const bad = [];
  data.questions.forEach((q, i) => {
    const where = q.id || `#${i}`;
    if (!Array.isArray(q.choices) || q.choices.length < 2) bad.push(`${where}: <2 choices`);
    else if (q.choices[0] == null || String(q.choices[0]).trim() === '') bad.push(`${where}: empty correct choice[0]`);
    if (q.topic && topicIds.size && !topicIds.has(q.topic)) bad.push(`${where}: unknown topic '${q.topic}'`);
  });
  ok(bad.length === 0, `all ${data.questions.length} airway questions well-formed`,
    `${bad.length} malformed (e.g. ${bad.slice(0, 3).join(' ; ')})`);
}

/* ===========================================================
   3. Security invariants (docs/security.md)
   Static checks over every shipped page, so a regression fails CI
   instead of waiting for someone to notice. Regex, not a parser:
   the pages are hand-written and these patterns are simple.
   =========================================================== */

/* SHA-384 of each vendored file (js/vendor/README.md). A mismatch
   means the file was edited or swapped — re-derive it from npm. */
const VENDOR_SHA384 = {
  'js/vendor/react-18.3.1.production.min.js': 'DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z',
  'js/vendor/react-dom-18.3.1.production.min.js': 'gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1',
  'js/vendor/htm-3.1.1.umd.js': 'toVdrLSMaw7Y55MowcKqkmFL/Ek6Sky62NOk0b5sDDZBu2wcoPyyQUt9unDVjXhL',
  /* three.js 0.186.1 (SSB). The two build files are byte-identical to the npm
     tarball; each addon differs from it only in its bare 'three' import,
     rewritten to a relative path (js/vendor/README.md). */
  'js/vendor/three-0.186.1/build/three.module.js': 'm8JoFX52V6NGv2usipnlLJKnJfL7IE8dbniPDDCSGSQv3Hm4n6PjfV6syVwfuoRc',
  'js/vendor/three-0.186.1/build/three.core.js': 'mdKeCwPEcbDvzaxwhm+MVuLoMou+E7jQqrs4tmu/n8HBYPGI1kZt0MkJxlMR4zFM',
  'js/vendor/three-0.186.1/examples/jsm/controls/OrbitControls.js': 'qPsQxHJQusTrZkJM/pV9+9Ar5wamA5KT4tS5DssTyclVxwLoIXzCoJLxdFE3rrbT',
  'js/vendor/three-0.186.1/examples/jsm/loaders/GLTFLoader.js': 'TY1cL389i0uKzt8Zef+4ZTyT95lXTtcBQeMs0ax19sXELjIjHWgGNQSO9EaOrkfv',
  'js/vendor/three-0.186.1/examples/jsm/utils/BufferGeometryUtils.js': '80MKp/CJ09MRFS7LKwTZfs+4FOsnlOG8NSuvB3RLMWod2+6UFOfwSkLo937gpx8S',
  'js/vendor/three-0.186.1/examples/jsm/utils/SkeletonUtils.js': '9wnnny/bCGM+AmRCOO5igFReelvUyFf3GxRjMbg7DRZE/ErDbTH7hvDc+eS0yFWG',
};

/* Pages that must make no third-party request at all. */
const SELF_CONTAINED = new Set(['airway-jeopardy.html', 'index.html', 'cpt-search.html', 'ssb.html']);

function checkSecurity() {
  console.log('\nsecurity: vendored scripts + page policies');

  for (const [file, want] of Object.entries(VENDOR_SHA384)) {
    let got = null;
    try { got = crypto.createHash('sha384').update(fs.readFileSync(rel(file))).digest('base64'); } catch (e) { /* missing */ }
    ok(got === want, `${file} matches pinned SHA-384`, `${file} ${got ? 'hash changed' : 'missing'}`);
  }

  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
  for (const page of pages) {
    const html = fs.readFileSync(rel(page), 'utf8');
    const problems = [];

    const csp = (html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i) || [])[1];
    if (!csp) problems.push('no CSP meta');
    else {
      const dir = (name) => (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) || '');
      const scriptSrc = dir('script-src') || dir('default-src');
      if (!scriptSrc) problems.push('CSP has no script-src/default-src');
      if (/'unsafe-inline'|'unsafe-eval'|\*|https?:|data:/.test(scriptSrc)) problems.push(`script-src too broad: "${scriptSrc}"`);
      if (!/object-src 'none'/.test(csp)) problems.push("CSP lacks object-src 'none'");
      if (!/base-uri 'none'|base-uri 'self'/.test(csp)) problems.push('CSP lacks base-uri');
      if (SELF_CONTAINED.has(page) && /https?:/.test(csp)) problems.push('self-contained page allows a remote origin in CSP');
    }

    /* Inline executable script: a <script> without src whose type is not a data block. */
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1];
      if (/\bsrc\s*=/.test(attrs)) {
        const src = (attrs.match(/\bsrc\s*=\s*"([^"]+)"/) || [])[1] || '';
        if (/^(https?:)?\/\//i.test(src)) problems.push(`third-party script ${src}`);
        else if (!fs.existsSync(rel(src.split('?')[0]))) problems.push(`script src missing on disk: ${src}`);
      } else if (!/type\s*=\s*"application\/(ld\+)?json"/i.test(attrs) && m[2].trim()) {
        problems.push('inline <script> (move it to a file; CSP forbids it)');
      }
    }
    if (/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<script\b[\s\S]*?<\/script>/gi, ''))) problems.push('inline on*= event handler');
    if (/href\s*=\s*["']\s*javascript:/i.test(html)) problems.push('javascript: URL');

    for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
      if (!/rel="[^"]*noopener/.test(m[0])) problems.push(`target=_blank without rel=noopener: ${m[0].slice(0, 80)}`);
    }

    if (SELF_CONTAINED.has(page)) {
      const loaded = [...html.matchAll(/<(?:link|script|img|iframe|source)\b[^>]*>/gi)]
        .map((m) => m[0]).filter((tag) => !/rel="canonical"/i.test(tag))
        .map((tag) => (tag.match(/(?:href|src|srcset)\s*=\s*"(https?:\/\/[^"]+)"/i) || [])[1]).filter(Boolean);
      if (loaded.length) problems.push(`loads remote resources: ${loaded.join(', ')}`);
    }

    ok(problems.length === 0, `${page}: CSP present, no inline/third-party script`, `${page}: ${problems.join(' ; ')}`);
  }
}

/* ===========================================================
   4. Asset stamps (tools/stamp-assets.mjs)
   Every same-origin CSS/JS reference carries ?v=<hash of the file>,
   so a deploy can never pair new HTML with a cached old stylesheet.
   Editing a CSS/JS file without re-stamping fails here.
   =========================================================== */
function checkStamps() {
  console.log('\nasset stamps: ?v= matches each css/ and js/ file');
  for (const page of rootPages()) {
    const { stale } = stampHtml(fs.readFileSync(rel(page), 'utf8'));
    ok(stale.length === 0, `${page}: asset stamps current`,
      `${page}: stale stamp (run node tools/stamp-assets.mjs): ${stale.join(' ; ')}`);
  }
  /* SSB's ES-module graph and its data-hash map (docs/ssb.md 7.2). */
  const ssb = stampSsb();
  ok(ssb.errors.length === 0, 'js/ssb: imports resolve, no cycle', `js/ssb: ${ssb.errors.join(' ; ')}`);
  ok(ssb.stale.length === 0, 'js/ssb: module specifiers and stamps.js current',
    `js/ssb: stale (run node tools/stamp-assets.mjs):\n        ` + ssb.stale.join('\n        '));
}

/* ===========================================================
   5. SSB knowledge graph (ssb/content/*.json)
   Schema, id format, vocabularies, every reference resolving, and
   the review gate (verified content stands on verified sources).
   Rules: docs/authoring-ssb.md; checker: tools/ssb-content.mjs.
   =========================================================== */
function checkSsb() {
  console.log('\nssb: knowledge graph schema + references');
  const files = ssbFiles();
  if (!files.length) { pass('ssb: no content yet'); return; }
  const { errors, index } = validateSsb(files);
  ok(errors.length === 0, `ssb: ${files.length} file(s), graph consistent`,
    `ssb: ${errors.length} problem(s) (node tools/ssb-content.mjs):\n        ` + errors.slice(0, 20).join('\n        '));
  ok(index.size > 0, 'ssb: graph has entities', 'ssb: content files present but empty');
  const geo = validateSsbGeometry(index);
  ok(geo.length === 0, 'ssb: specimen geometry names only graph ids',
    `ssb: ${geo.length} geometry reference problem(s):\n        ` + geo.slice(0, 20).join('\n        '));
  checkDissection(index);
}

/* ---- SSB dissection states (docs/ssb.md 5.8; WP P1b) ----
   (a) tools/ssb-pipeline/uw/dissection.json <-> the graph: every id a procedure step removes is realized by a unit
   on that step or before it, or is listed unrealized; a step that removes something maps no unit only when all its
   ids are unrealized; every unit on a step realizes one of that step's ids; unit names and `realizes` are graph ids.
   (b) every label a patch writes is in labels.json; (c) the budgets, and the index agrees with the files. */
function checkDissection(index) {
  const dpath = rel('tools/ssb-pipeline/uw/dissection.json');
  if (!fs.existsSync(dpath)) return;
  const data = JSON.parse(fs.readFileSync(dpath, 'utf8'));
  const errs = [];
  const idOf = (unit) => unit.split('@')[0].replace(/\.[RLM]$/, '');
  for (const [u, spec] of Object.entries(data.units)) {
    if (!index.has(idOf(u))) errs.push(`unit ${u}: ${idOf(u)} is not a graph id`);
    for (const r of spec.realizes || []) if (!index.has(r)) errs.push(`unit ${u}: realizes ${r}, not a graph id`);
  }
  for (const [pid, pd] of Object.entries(data.procedures)) {
    const proc = index.get(pid);
    if (!proc || proc.type !== 'procedures') { errs.push(`${pid}: not a graph procedure`); continue; }
    const steps = proc.entity.steps || [];
    const unreal = new Set(Object.keys(pd.unrealized || {}));
    const realized = new Set();
    for (const s of Object.keys(pd.steps)) if (!steps[Number(s)]) errs.push(`${pid} step ${s}: the procedure has no such step`);
    for (let i = 0; i < steps.length; i++) {
      const units = pd.steps[String(i)] || [];
      const removes = steps[i].removes || [];
      for (const u of units) {
        if (!data.units[u]) { errs.push(`${pid} step ${i}: unit ${u} is not defined`); continue; }
        const real = data.units[u].realizes || [];
        if (!real.some((r) => removes.includes(r))) errs.push(`${pid} step ${i}: unit ${u} realizes none of the ids the step removes (${removes.join(', ') || 'none'})`);
        real.forEach((r) => realized.add(r));
      }
      if (removes.length && !units.length && !removes.every((r) => unreal.has(r))) errs.push(`${pid} step ${i}: removes ${removes.join(', ')} but maps no unit and not all are unrealized`);
      for (const r of removes) if (!realized.has(r) && !unreal.has(r)) errs.push(`${pid} step ${i}: removes ${r}, which no unit on this step or before realizes and the procedure does not list as unrealized`);
    }
    for (const r of unreal) if (!index.has(r)) errs.push(`${pid}: unrealized ${r} is not a graph id`);
  }
  ok(errs.length === 0, 'ssb dissection: dissection.json agrees with the graph (steps, removes, realizes, unrealized)',
    `ssb dissection: ${errs.length} problem(s):\n        ` + errs.slice(0, 20).join('\n        '));

  const ipath = rel('ssb/states/index.json');
  if (!fs.existsSync(ipath)) { fail('ssb dissection: ssb/states/index.json is missing (run tools/ssb-pipeline/uw/dissect.py)'); return; }
  const idx = JSON.parse(fs.readFileSync(ipath, 'utf8'));
  {
    /* The patches are made for one specimen: index.base is the first 10 hex of the SHA-256 of the raw CT and label arrays
       dissect.py read (the player refuses a patch whose base differs). A specimen regenerated without rerunning dissect.py fails here. */
    const h = crypto.createHash('sha256');
    h.update(zlib.gunzipSync(fs.readFileSync(rel('ssb/ct/ct.u8.gz'))));
    h.update(zlib.gunzipSync(fs.readFileSync(rel('ssb/ct/labels.u16.gz'))));
    const want = h.digest('hex').slice(0, 10);
    ok(idx.base === want, 'ssb dissection: ssb/states/index.json base is the hash of the committed specimen (rerun dissect.py after any specimen change)',
      `ssb dissection: index.json base ${idx.base} is not the committed specimen's ${want}: rerun tools/ssb-pipeline/uw/dissect.py`);
  }
  const labels = new Set(Object.keys(JSON.parse(fs.readFileSync(rel('ssb/geometry/labels.json'), 'utf8')).labels).map(Number));
  const bad = [];
  let lining = 0;
  for (const [key, st] of Object.entries(idx.states)) {
    const sha = crypto.createHash('sha256').update(st.units.join('\n')).digest('hex').slice(0, 10);
    if (sha !== key) bad.push(`${key}: not the hash of its unit list (${sha})`);
    for (const u of st.units) if (!data.units[u]) bad.push(`${key}: unit ${u} is not in dissection.json`);
    const pf = rel('ssb/states/' + st.patch), lf = rel('ssb/models/' + st.lining);
    if (!fs.existsSync(pf) || !fs.existsSync(lf)) { bad.push(`${key}: patch or lining file is missing`); continue; }
    const raw = zlib.gunzipSync(fs.readFileSync(pf));
    const hl = raw.readUInt32LE(0);
    const hdr = JSON.parse(raw.subarray(4, 4 + hl).toString('utf8'));
    if (hdr.state !== key) bad.push(`${key}: patch header names state ${hdr.state}`);
    let off = 4 + hl;
    for (const b of hdr.boxes) {
      const n = b.dims[0] * b.dims[1] * b.dims[2];
      const a = new Uint16Array(raw.buffer.slice(raw.byteOffset + off, raw.byteOffset + off + n * 2));
      off += n * 2;
      const seen = new Set(a);
      for (const v of seen) if (v !== 0 && !labels.has(v)) bad.push(`${key}: patch writes label ${v}, which is not in labels.json`);
    }
    if (off !== raw.length) bad.push(`${key}: patch length does not match its boxes`);
    if (fs.statSync(pf).size > 100_000) bad.push(`${key}: patch is ${fs.statSync(pf).size} bytes (budget 100 kB)`);
    const lb = fs.statSync(lf).size;
    lining += lb;
    if (lb > 350_000) bad.push(`${key}: state lining is ${lb} bytes (budget 350 kB)`);
  }
  if (lining > 6_000_000) bad.push(`state linings total ${lining} bytes (budget 6 MB)`);
  const keys = new Set(Object.keys(idx.states));
  for (const [p, pd] of Object.entries(idx.procedures)) for (const k of [pd.entry, ...Object.values(pd.steps)]) if (k && !keys.has(k)) bad.push(`procedure ${p}: state ${k} is not in the index`);
  for (const [c, cd] of Object.entries(idx.corridors)) for (const pos of cd.positions) if (!keys.has(pos.state)) bad.push(`corridor ${c}: state ${pos.state} is not in the index`);
  ok(bad.length === 0, `ssb dissection: ${keys.size} states: keys, patches (labels in labels.json, 100 kB), state linings (350 kB each, 6 MB in all) and the index agree`,
    `ssb dissection: ${bad.length} problem(s):\n        ` + bad.slice(0, 20).join('\n        '));
}

/* ===========================================================
   5. ASCII 3D figures (js/ascii3d.js, js/diagrams/*, docs/diagrams.md)
   Scenes render, pages load what they show (engine first), no
   scene file is orphaned, baked no-JS frames are current, and the
   Leitner figure states the engine's real schedule.
   =========================================================== */
function checkFigures() {
  console.log('\nASCII figures: js/diagrams/* <-> pages');
  let eng;
  try { eng = loadEngine(); } catch (e) { fail('engine + scenes load: ' + e.message); return; }
  const { A3D, fileOf } = eng;

  for (const id of A3D.ids()) {
    try {
      const fr = A3D.frame(id, {});
      ok(fr.chars.some((c) => c !== ' '), `${id}: renders`, `${id}: renders a blank frame`);
    } catch (e) { fail(`${id}: frame threw — ${e.message}`); }
  }

  /* data-a3d ids a page shows: in its HTML, or in the page's own
     scripts (Airway renders its markup from js/airway-app.js). */
  const used = new Set();
  const idsIn = (src) => [...src.matchAll(/data-a3d="([a-z0-9-]+)"/g)].map((m) => m[1]);
  for (const page of rootPages()) {
    const html = fs.readFileSync(rel(page), 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"?]+)/g)].map((m) => m[1]);
    const ids = new Set(idsIn(html));
    for (const src of scripts) {
      if (src.startsWith('js/') && !src.startsWith('js/diagrams/') && src !== 'js/ascii3d.js' && fs.existsSync(rel(src))) {
        idsIn(fs.readFileSync(rel(src), 'utf8')).forEach((id) => ids.add(id));
      }
    }
    for (const id of ids) {
      used.add(id);
      const file = fileOf[id];
      const eIdx = scripts.indexOf('js/ascii3d.js'), sIdx = file ? scripts.indexOf(file) : -1;
      ok(!!file && eIdx >= 0 && sIdx > eIdx, `${page}: figure '${id}' loads js/ascii3d.js then ${file}`,
        `${page}: figure '${id}' needs ${file ? 'js/ascii3d.js then ' + file : 'a scene (no js/diagrams file defines it)'}`);
      ok(/css\/ascii3d\.css/.test(html), `${page}: figure '${id}' has css/ascii3d.css`, `${page}: figure '${id}' without css/ascii3d.css`);
    }
  }
  const orphans = A3D.ids().filter((id) => !used.has(id));
  ok(orphans.length === 0, 'no orphan scene files', `scenes no page shows (delete them): ${orphans.join(', ')}`);

  for (const r of bakeAll({ write: false })) {
    if (r.unknown) fail(`${r.page}: baked block a3d:${r.id} has no scene`);
    else ok(r.fresh, `${r.page}: baked frame '${r.id}' current`, `${r.page}: baked frame '${r.id}' stale (run node tools/ascii3d.mjs bake)`);
  }

  const leitner = A3D.get('leitner');
  if (leitner) {
    const m = fs.readFileSync(rel('js/oksat-engine.js'), 'utf8').match(/LEITNER_INTERVALS\s*=\s*\{([^}]*)\}/);
    const engine = m ? m[1].split(',').map((kv) => Number(kv.split(':')[1])) : [];
    const shown = leitner.intervals || [];
    ok(engine.length > 0 && JSON.stringify(engine) === JSON.stringify(shown),
      `leitner figure intervals [${shown}] === LEITNER_INTERVALS`,
      `leitner figure intervals [${shown}] !== LEITNER_INTERVALS [${engine}] (js/diagrams/leitner.js)`);
  }
}

/* ---- run ---- */
console.log('=== check-data.mjs ===');
checkOksat();
checkAirway();
checkSecurity();
checkStamps();
checkSsb();
checkFigures();
console.log(`\n${failures ? 'FAILED' : 'OK'} — ${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
