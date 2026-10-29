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
   OLSB dioramas <-> glossary (OLSB.html)
   Every drawn structure names a glossary entry, every relation and
   every tour step points at something that exists, and the page loads
   the glossary before the dioramas it lists.
   =========================================================== */
function checkOlsb() {
  console.log('\nolsb: dioramas, glossary, relations, tours');
  const html = fs.readFileSync(rel('OLSB.html'), 'utf8');
  const files = [...html.matchAll(/<script\b(?![^>]*type="module")[^>]*\bsrc="(js\/olsb\/(?!main\.)[a-z]+\.js)/g)].map((m) => m[1]);
  ok(files[0] === 'js/olsb/glossary.js' && files.length > 1, 'OLSB.html loads the glossary first, then the dioramas',
    `OLSB.html script order: ${files.join(', ')}`);
  const win = {};
  for (const f of files) new Function('window', fs.readFileSync(rel(f), 'utf8') + '\n;return window;')(win);
  const O = win.OLSB;
  if (!O) { fail('window.OLSB missing'); return; }
  const G = O.glossary;
  const DIRS = new Set(['sup', 'inf', 'ant', 'post', 'med', 'lat']);
  const badRel = [];
  for (const [id, e] of Object.entries(G)) {
    if (!e.name || !e.note) badRel.push(`${id}: no name/note`);
    for (const [dir, list] of Object.entries(e.rel || {})) {
      if (!DIRS.has(dir)) badRel.push(`${id}: direction ${dir}`);
      for (const o of list) if (!G[o]) badRel.push(`${id}.${dir} -> ${o}`);
    }
  }
  ok(badRel.length === 0, `glossary: ${Object.keys(G).length} entries, every relation resolves`, `glossary: ${badRel.slice(0, 5).join('; ')}`);
  const dioIds = new Set();
  for (const d of O.dioramas) {
    const problems = [];
    if (dioIds.has(d.id)) problems.push('duplicate diorama id');
    dioIds.add(d.id);
    const layers = new Set(d.layers.map((l) => l.id).concat(['base']));
    const ids = new Set();
    for (const s of d.structures) {
      if (ids.has(s.id)) problems.push(`duplicate ${s.id}`);
      ids.add(s.id);
      if (!layers.has(s.layer)) problems.push(`${s.id}: layer ${s.layer}`);
      if (!s.inert && !G[s.id]) problems.push(`${s.id}: no glossary entry`);
      if (!s.inert && !s.at) problems.push(`${s.id}: no label anchor`);
    }
    const views = new Set(d.views.map((v) => v.id));
    for (const t of d.tours) for (const st of t.steps) {
      for (const f of st.focus || []) if (!ids.has(f)) problems.push(`${t.id}/${st.title}: focus ${f}`);
      for (const l of st.layers || []) if (!layers.has(l)) problems.push(`${t.id}/${st.title}: layer ${l}`);
      if (st.view && !views.has(st.view)) problems.push(`${t.id}/${st.title}: view ${st.view}`);
    }
    ok(problems.length === 0, `diorama ${d.id}: structures, tours and views resolve`, `diorama ${d.id}: ${problems.slice(0, 5).join('; ')}`);
  }
  checkOlsbVolume(O);
}

/* The 3D model (js/olsb/volume.js): its labels are glossary entries, its tour resolves, every
   structure it names is actually built, and its geometry agrees with every directional relation
   in the glossary between two structures it draws. A relation is tested over the columns both
   structures occupy along its axis (so a plate above a cavity counts where they overlap), or by
   centroid when they share none. */
function checkOlsbVolume(O) {
  const V = O.volume;
  if (!V) { fail('OLSB.volume missing (js/olsb/volume.js not loaded by OLSB.html)'); return; }
  const G = O.glossary;
  const unknown = V.LABELS.filter((l) => l && !G[l.id]).map((l) => l.id);
  ok(unknown.length === 0, '3D model: every label is a glossary entry', `3D labels without a glossary entry: ${unknown.join(', ')}`);
  const vol = V.build(V.LEVELS.coarse);
  const { nx, ny, lab, vox } = vol;
  const byId = {};
  for (let i = 0; i < lab.length; i++) if (lab[i]) (byId[V.LABELS[lab[i]].id] ||= []).push(i);
  const empty = V.LABELS.filter((l) => l && !l.drilled && !byId[l.id]).map((l) => l.id);
  ok(empty.length === 0, '3D model: every label is built', `3D labels with no voxels: ${[...new Set(empty)].join(', ')}`);
  const problems = [];
  const states = new Set(V.STATES.map((x) => x.id)), views = new Set(V.VIEWS.map((x) => x.id)), layers = new Set(V.LAYERS.map((x) => x.id));
  for (const t of V.TOURS) for (const sp of t.steps) {
    if (!states.has(sp.state)) problems.push(`${sp.title}: state ${sp.state}`);
    if (!views.has(sp.view)) problems.push(`${sp.title}: view ${sp.view}`);
    for (const l of sp.layers) if (!layers.has(l)) problems.push(`${sp.title}: layer ${l}`);
    for (const f of sp.focus) if (!byId[f]) problems.push(`${sp.title}: focus ${f} not in the model`);
  }
  for (const s of V.STATES) { try { V.carve(vol, s.id); } catch (e) { problems.push(`carve ${s.id}: ${e.message}`); } }
  ok(problems.length === 0, '3D model: tour steps, views and drill states resolve', `3D model: ${problems.slice(0, 5).join('; ')}`);

  const AX = { sup: 2, inf: 2, ant: 1, post: 1, lat: 0, med: 0 }, SG = { sup: 1, inf: -1, ant: 1, post: -1, lat: 1, med: -1 };
  const coord = (i) => [i % nx, ((i / nx) | 0) % ny, (i / (nx * ny)) | 0];
  const mean = (id, ax) => byId[id].reduce((a, i) => a + coord(i)[ax], 0) / byId[id].length;
  function offset(a, b, ax) {
    const key = (c) => (ax === 0 ? c[1] * 65536 + c[2] : ax === 1 ? c[0] * 65536 + c[2] : c[0] * 65536 + c[1]);
    const cols = new Map();
    for (const i of byId[a]) { const c = coord(i), e = cols.get(key(c)) || [0, 0, 0, 0]; e[0] += c[ax]; e[1]++; cols.set(key(c), e); }
    for (const i of byId[b]) { const c = coord(i), e = cols.get(key(c)); if (e) { e[2] += c[ax]; e[3]++; } }
    let d = 0, n = 0;
    for (const e of cols.values()) if (e[3]) { d += e[2] / e[3] - e[0] / e[1]; n++; }
    return (n ? d / n : mean(b, ax) - mean(a, ax)) * vox;
  }
  const wrong = [];
  let tested = 0;
  for (const [id, e] of Object.entries(G)) for (const [dir, list] of Object.entries(e.rel || {})) for (const o of list) {
    if (!byId[id] || !byId[o]) continue;
    tested++;
    const d = offset(id, o, AX[dir]) * SG[dir];
    if (!(d > 0)) wrong.push(`${o} is not ${dir} to ${id} (${d.toFixed(1)} mm)`);
  }
  ok(wrong.length === 0 && tested > 40, `3D model agrees with the glossary's relations (${tested} tested)`, `3D model vs glossary: ${wrong.slice(0, 5).join('; ')}`);
}

/* ===========================================================
   1. OKSAT manifest <-> modules
   =========================================================== */
function checkOksat() {
  console.log('\njs/oksat/manifest.js <-> js/oksat/modules/*');
  let man;
  try { man = loadWindow(rel('js/oksat/manifest.js')); }
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

  // orphan detection: every js/oksat/modules/*.js must be in the manifest
  const onDisk = fs.readdirSync(rel('js/oksat/modules')).filter((f) => f.endsWith('.js'));
  const orphans = onDisk.filter((f) => !manifestFiles.has(f));
  ok(orphans.length === 0, 'no orphan module files', `module files not in manifest: ${orphans.join(', ')}`);
}

/* ===========================================================
   1b. OKSAT interactive guides <-> chapters <-> modules
   (docs/authoring-oksat-guide.md.) Counts agree with the manifest, every
   block is a known type with balanced inline markup, every figure exists
   with alt text, and every module question or concept a guide points at
   resolves, so a renamed concept or id fails here instead of in a browser.
   =========================================================== */
function checkGuides() {
  console.log('\njs/oksat/manifest.js OKSAT_GUIDES <-> js/oksat/guides/*');
  let man;
  try { man = loadWindow(rel('js/oksat/manifest.js')); } catch (e) { fail('manifest load: ' + e.message); return; }
  const guides = man.OKSAT_GUIDES || [];
  const subs = man.OKSAT_SUBSPECIALTIES || {};
  ok(Array.isArray(guides) && guides.length > 0, 'OKSAT_GUIDES is a non-empty array', 'OKSAT_GUIDES missing/empty');
  const mods = {};
  for (const m of man.OKSAT_MANIFEST) {
    try { mods[m.slug] = loadWindow(rel(m.data)).__MCQ_MODULE; } catch (e) { /* reported by checkOksat */ }
  }
  const BLOCKS = new Set(['p', 'why', 'h', 'ul', 'ol', 'table', 'kv', 'call', 'deep', 'cards', 'steps', 'figure', 'tool', 'practice', 'check']);
  const CALLS = new Set(['pearl', 'trap', 'mech', 'hook']);
  /* **bold** and *italic* toggle, \* is a literal star, [[...]] is a chip: every string must close what it opens. */
  const markup = (t) => {
    const bare = t.replace(/\\\*/g, '').replace(/\[\[[^\]]+\]\]/g, '');
    if (/\[\[|\]\]/.test(bare)) return 'unbalanced [[ ]]';
    const stars = (bare.match(/\*/g) || []).length;
    return stars % 2 ? 'odd number of * (unclosed bold or italic; escape a literal star as \\*)' : null;
  };
  /* Terms (js/oksat/terms.js): the viewer marks every lexicon term; here the same scanner
     runs over every string a reader sees (markup and source chips stripped) and fails on
     an acronym-shaped token the lexicon does not know, and on a lexicon entry no guide uses. */
  let T = null;
  try { T = loadWindow(rel('js/oksat/terms.js')).OKSATTerms; } catch (e) { fail('js/oksat/terms.js load: ' + e.message); }
  const SKIP = new Set(['t', 'id', 'src', 'k', 'alt', 'm', 'c', 'refs', 'tone', 'data']);
  const used = new Set();
  const termScan = (v, key, where, out) => {
    if (typeof v === 'string') {
      if (SKIP.has(key)) return;
      const r = T.scan(v.replace(/\[\[[^\]]+\]\]/g, ' ').replace(/\\?\*/g, ''));
      r.hits.forEach((x) => used.add(x.key));
      r.unknown.forEach((u) => out.push(`${where}: '${u}' is not in js/oksat/terms.js`));
    } else if (Array.isArray(v)) v.forEach((x) => termScan(x, key, where, out));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) termScan(x, k, where, out);
  };
  const files = [];
  for (const g of guides) {
    const tag = g.slug;
    ok(!!subs[g.subspecialty] && g.accent === subs[g.subspecialty].hue, `${tag}: subspecialty '${g.subspecialty}' and accent match OKSAT_SUBSPECIALTIES`,
      `${tag}: subspecialty '${g.subspecialty}' unknown or accent ${g.accent} is not its hue`);
    const secIds = new Set(), problems = [];
    for (const c of g.chapters) {
      files.push(path.basename(c.data));
      if (!fs.existsSync(rel(c.data))) { problems.push(`${c.id}: data file missing`); continue; }
      let ch;
      try { ch = loadWindow(rel(c.data)).__OKSAT_CHAPTER; } catch (e) { problems.push(`${c.id}: load threw ${e.message}`); continue; }
      if (!ch) { problems.push(`${c.id}: no __OKSAT_CHAPTER`); continue; }
      if (ch.id !== c.id || c.id !== path.basename(c.data, '.js')) problems.push(`${c.id}: id/filename disagree`);
      const n = (ch.sections || []).length;
      if ((c.sections || 0) !== n) problems.push(`${c.id}: manifest sections ${c.sections || 0} !== ${n}`);
      if (!ch.title || !ch.kicker) problems.push(`${c.id}: missing title or kicker`);
      const strings = [];
      const walk = (blocks, where) => (blocks || []).forEach((b, i) => {
        const at = `${where}[${i}]`;
        if (!BLOCKS.has(b.t)) { problems.push(`${at}: unknown block '${b.t}'`); return; }
        for (const k of ['x', 'q', 'a', 'title', 'label']) if (typeof b[k] === 'string') strings.push([at + '.' + k, b[k]]);
        (b.items || []).forEach((it) => { if (typeof it === 'string') strings.push([at, it]); else { if (it.x) strings.push([at, it.x]); if (it.h) strings.push([at, it.h]); } });
        (b.head || []).forEach((h) => strings.push([at, h]));
        (b.rows || []).forEach((r) => r.forEach((cell) => strings.push([at, typeof cell === 'string' ? cell : cell.x])));
        if (b.t === 'call' && !CALLS.has(b.k)) problems.push(`${at}: call kind '${b.k}'`);
        if (b.t === 'call' || b.t === 'deep') walk(b.blocks, at);
        if (b.t === 'cards') b.items.forEach((it, j) => walk(it.blocks, `${at}.${j}`));
        if (b.t === 'table' && b.rows.some((r) => !r.length)) problems.push(`${at}: empty table row`);
        if (b.t === 'figure') {
          if (!fs.existsSync(rel(b.src))) problems.push(`${at}: figure not found ${b.src}`);
          if (!b.alt) problems.push(`${at}: figure without alt text`);
        }
        if (b.t === 'tool') {
          if (!b.crit.length || !b.rules.length) problems.push(`${at}: tool needs crit and rules`);
          if (b.rules[b.rules.length - 1].pre !== undefined || b.rules.every((r) => r.eq !== undefined)) problems.push(`${at}: last tool rule must be a catch-all`);
        }
        if (b.t === 'practice') for (const ref of b.refs) {
          const [m, id] = ref.split(':');
          if (!mods[m] || !mods[m].ITEMS.some((q) => q.id === id)) problems.push(`${at}: ${ref} does not resolve to a module item`);
        }
      });
      const checkIds = new Set();
      (ch.sections || []).forEach((s) => {
        if (secIds.has(s.id)) problems.push(`${c.id}/${s.id}: duplicate section id in guide`);
        secIds.add(s.id);
        if (!/^[a-z0-9-]+$/.test(s.id)) problems.push(`${s.id}: section id must be kebab-case`);
        walk(s.blocks, s.id);
        (s.blocks || []).filter((b) => b.t === 'check').forEach((b) => {
          if (!b.id || checkIds.has(s.id + ':' + b.id)) problems.push(`${s.id}: check id missing or duplicate (${b.id})`);
          checkIds.add(s.id + ':' + b.id);
        });
        for (const d of s.drill || []) {
          const mod = mods[d.m];
          if (!mod) { problems.push(`${s.id}: drill module ${d.m} unknown`); continue; }
          for (const k of d.c || []) {
            if (!mod.CONCEPTS[k]) problems.push(`${s.id}: drill concept ${d.m}/${k} unknown`);
            else if (!mod.ITEMS.some((q) => (q.concepts || []).includes(k))) problems.push(`${s.id}: drill concept ${d.m}/${k} has no items`);
          }
        }
      });
      walk(ch.intro, c.id + '.intro');
      (ch.tldr || []).forEach((t) => strings.push([c.id + '.tldr', t]));
      for (const [at, t] of strings) { const m = markup(t); if (m) problems.push(`${at}: ${m}: ${t.slice(0, 50)}`); }
      if (T) termScan(ch, '', c.id, problems);
    }
    ok(problems.length === 0, `${tag}: ${g.chapters.length} chapters, blocks, markup, figures and module references resolve`,
      `${tag}: ${problems.length} problem(s):\n        ` + problems.slice(0, 12).join('\n        '));
  }
  if (T) {
    const idle = T.keys().filter((k) => !used.has(k));
    ok(idle.length === 0, `js/oksat/terms.js: ${T.keys().length} terms, every one used by a guide`, `terms no guide uses (delete them): ${idle.join(', ')}`);
  }
  const dir = rel('js/oksat/guides');
  const onDisk = fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.js')).map((f) => path.basename(String(f))) : [];
  const orphans = onDisk.filter((f) => !files.includes(f));
  ok(orphans.length === 0, 'no orphan guide chapter files', `chapter files not in OKSAT_GUIDES: ${orphans.join(', ')}`);
}

/* ===========================================================
   2. Airway question bank
   =========================================================== */
function checkAirway() {
  console.log('\njs/airway/questions.js');
  let w;
  try { w = loadWindow(rel('js/airway/questions.js')); }
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
  'js/vendor/pdf-lib-1.17.1.min.js': 'weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI',
  'js/vendor/jszip-3.10.1.min.js': '+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG',
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
const SELF_CONTAINED = new Set(['airway-jeopardy.html', 'index.html', 'cpt-search.html', 'ssb.html', 'OLSB.html', 'pdf-chapter-splitter.html']);

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
  checkUwFigures(index);
  checkLiningMeshes();
}

/* ---- UW figure inventory (WP FG1): ssb/reference/uw-sinusanatomy2/figures.json ----
   Numbers and text only. Every figure has a plane and a window; ids are graph ids or an explicit null with its
   reason; arrows are null only for a soft/contrast window and then say why; every coordinate lies inside the image;
   role is N/V/P or null with a reason; group members agree. Writer: tools/ssb-pipeline/uw/figures.py. */
function checkUwFigures(index) {
  const fpath = rel('ssb/reference/uw-sinusanatomy2/figures.json');
  if (!fs.existsSync(fpath)) return;
  const errs = [];
  let data;
  try { data = JSON.parse(fs.readFileSync(fpath, 'utf8')); } catch (e) { fail(`uw figures: not valid JSON — ${e.message}`); return; }
  const figs = Array.isArray(data.figures) ? data.figures : [];
  const meta = data.meta || {};
  const str = (v) => typeof v === 'string' && v.trim() !== '';
  const inside = (pt, w, h) => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isInteger) && pt[0] >= 0 && pt[1] >= 0 && pt[0] <= w && pt[1] <= h;
  const seen = new Set(); const groups = new Map();
  if (!figs.length) errs.push('no figures');
  if (meta.count !== figs.length) errs.push(`meta.count ${meta.count} != ${figs.length} figures`);
  if (!str(meta.notSeparableReason)) errs.push('meta.notSeparableReason missing');
  for (const f of figs) {
    const w = f && f.size && f.size[0], h = f && f.size && f.size[1];
    const at = `figure ${f && f.id}`;
    if (!f || !str(f.id) || seen.has(f.id)) { errs.push(`${at}: missing or duplicate id`); continue; }
    seen.add(f.id);
    if (!str(f.file) || !/^images\/[^/]+\.jpg$/.test(f.file)) errs.push(`${at}: bad file`);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) { errs.push(`${at}: bad size`); continue; }
    if (!Array.isArray(f.pages) || !f.pages.length || !f.pages.every((p) => str(p.page) && str(p.caption))) errs.push(`${at}: pages need a page and a caption`);
    if (!['axial', 'coronal', 'sagittal'].includes(f.plane)) errs.push(`${at}: plane must be axial|coronal|sagittal (${f.plane})`);
    if (!['bone', 'soft'].includes(f.window)) errs.push(`${at}: window must be bone|soft`);
    if (typeof f.contrast !== 'boolean') errs.push(`${at}: contrast must be boolean`);
    if (!f.abbreviations || typeof f.abbreviations !== 'object') errs.push(`${at}: abbreviations must be an object`);
    if (f.ids === null) { if (!str(f.idsReason)) errs.push(`${at}: ids null without idsReason`); }
    else if (!Array.isArray(f.ids) || !f.ids.length) errs.push(`${at}: ids must be null (with a reason) or a non-empty list`);
    else for (const id of f.ids) if (!index.has(id)) errs.push(`${at}: ${id} is not a graph id`);
    for (const c of f.idCandidates || []) if (!str(c.id) || typeof c.inGraph !== 'boolean' || c.inGraph !== index.has(c.id)) errs.push(`${at}: idCandidates entry ${c && c.id} disagrees with the graph`);
    if (f.role === null) { if (!str(f.roleReason)) errs.push(`${at}: role null without roleReason`); }
    else if (!Array.isArray(f.role) || !f.role.length || !f.role.every((r) => ['N', 'V', 'P'].includes(r))) errs.push(`${at}: role must be null or a subset of N, V, P`);
    if (f.arrows === null) {
      if (f.window !== 'soft' && !f.contrast) errs.push(`${at}: arrows null on a bone window`);
      if (f.arrowsReason !== meta.notSeparableReason) errs.push(`${at}: arrows null without the not-separable reason`);
      if (f.labels !== null || f.marks !== null) errs.push(`${at}: labels and marks must be null with arrows`);
    } else {
      if (f.window !== 'bone') errs.push(`${at}: traced arrows on a ${f.window} window`);
      if (!Array.isArray(f.arrows) || !Array.isArray(f.marks) || !Array.isArray(f.labels)) { errs.push(`${at}: arrows, marks and labels must be arrays`); continue; }
      for (const a of f.arrows) {
        if (!inside(a.tail, w, h) || !inside(a.tip, w, h)) errs.push(`${at}: arrow outside the image`);
        if (a.label !== null && !str(a.label)) errs.push(`${at}: arrow label must be null or text`);
      }
      for (const m of f.marks) if (!['arrowhead', 'asterisk'].includes(m.kind) || !inside(m.at, w, h)) errs.push(`${at}: bad point mark`);
      for (const l of f.labels) {
        if (!Array.isArray(l.box) || l.box.length !== 4 || !l.box.every(Number.isFinite)) errs.push(`${at}: bad label box`);
        if (l.ids === null) { if (!str(l.idsReason)) errs.push(`${at}: label "${l.raw}" ids null without a reason`); }
        else for (const id of l.ids) if (!index.has(id)) errs.push(`${at}: label ${l.text} maps to ${id}, not a graph id`);
      }
      if (!f.maskCheck || !['clean', 'review'].includes(f.maskCheck.status)) errs.push(`${at}: maskCheck missing`);
    }
    if (f.group) {
      if (!str(f.group.id) || !str(f.group.basis) || !(f.group.confirmed === null || typeof f.group.confirmed === 'boolean')) errs.push(`${at}: bad group`);
      else groups.set(f.group.id, (groups.get(f.group.id) || 0) + 1);
    }
  }
  for (const [g, n] of groups) if (n < 2) errs.push(`group ${g} has one member`);
  const dir = rel('ssb/reference/uw-sinusanatomy2');
  const pix = fs.readdirSync(dir).filter((n) => /\.(jpe?g|png|gif|webp)$/i.test(n));
  if (pix.length) errs.push(`image files in ${dir}: ${pix.join(', ')} (no image is committed)`);
  if (fs.statSync(fpath).size > 400 * 1024) errs.push('figures.json is over 400 KB: numbers and text only');
  ok(errs.length === 0, `uw figures: ${figs.length} figure(s), schema and graph ids consistent`,
    `uw figures: ${errs.length} problem(s):\n        ` + errs.slice(0, 20).join('\n        '));
}

/* ---- SSB lining packs (WP L1): no zero-thickness fins, no zero normals ----
   A fin is two faces on the same three vertices; its area-weighted vertex normals cancel to zero and it is drawn
   black. Every ssb/models/lining*.glb.gz (the base lining, the mucosal and dissection-state packs) must be free of
   both; the cleaner is meshes.py clean_lining. Reads the quantized glTF meshes written by meshes.py write_glb. */
function glbMeshes(buf) {
  const jl = buf.readUInt32LE(12);
  const doc = JSON.parse(buf.slice(20, 20 + jl).toString());
  const bin = buf.slice(20 + jl + 8);
  const view = (a) => { const v = doc.bufferViews[doc.accessors[a].bufferView]; return bin.subarray(v.byteOffset, v.byteOffset + v.byteLength); };
  return doc.nodes.map((nd) => {
    const p = doc.meshes[nd.mesh].primitives[0];
    const n = doc.accessors[p.attributes.NORMAL], ix = doc.accessors[p.indices];
    const nb = view(p.attributes.NORMAL), ib = view(p.indices);
    const idx = ix.componentType === 5123 ? new Uint16Array(ib.buffer, ib.byteOffset, ix.count) : new Uint32Array(ib.buffer, ib.byteOffset, ix.count);
    return { name: nd.name, count: n.count, nb, idx };
  });
}
function liningDefects(buf) {
  let twins = 0, zero = 0;
  for (const m of glbMeshes(buf)) {
    const seen = new Set();
    for (let i = 0; i < m.idx.length; i += 3) {
      const t = [m.idx[i], m.idx[i + 1], m.idx[i + 2]].sort((a, b) => a - b).join(',');
      if (seen.has(t)) twins++; else seen.add(t);
    }
    for (let v = 0; v < m.count; v++) {
      const x = (m.nb[v * 4] << 24 >> 24) / 127, y = (m.nb[v * 4 + 1] << 24 >> 24) / 127, z = (m.nb[v * 4 + 2] << 24 >> 24) / 127;
      if (Math.hypot(x, y, z) < 0.25) zero++;
    }
  }
  return { twins, zero };
}
function checkLiningMeshes() {
  const dir = rel('ssb/models');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => /^lining.*\.glb\.gz$/.test(f)).sort();
  for (const f of files) {
    let d;
    try { d = liningDefects(zlib.gunzipSync(fs.readFileSync(path.join(dir, f)))); }
    catch (e) { fail(`ssb lining: ${f} unreadable — ${e.message}`); continue; }
    ok(d.twins === 0 && d.zero === 0, `ssb lining: ${f} has no twin faces or zero normals`,
      `ssb lining: ${f} has ${d.twins} twin face(s) and ${d.zero} zero-length normal(s) (rerun lining.py / mucosa.py / dissect.py)`);
  }
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
    /* a mucosal state (mucosa.py, docs/ssb.md 5.9) has no units: its key is the hash of "mucosa.<dec|cong>" */
    const mucosal = st.units.length === 0 && ['dec', 'cong'].includes(st.mucosa);
    const sha = crypto.createHash('sha256').update(mucosal ? 'mucosa.' + st.mucosa : st.units.join('\n')).digest('hex').slice(0, 10);
    if (sha !== key) bad.push(`${key}: not the hash of its ${mucosal ? 'mucosal name' : 'unit list'} (${sha})`);
    if (!mucosal && st.mucosa !== 'dec') bad.push(`${key}: a dissection state is built on the decongested mucosa (mucosa "dec"), not "${st.mucosa}"`);
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
  for (const [mode, m] of Object.entries(idx.mucosa || {})) if (!keys.has(m.state) || idx.states[m.state].mucosa !== mode) bad.push(`mucosa ${mode}: state ${m.state} is not the ${mode} state of the index`);
  for (const mode of ['dec', 'cong']) if (!(idx.mucosa && idx.mucosa[mode])) bad.push(`mucosa ${mode}: the index lists no ${mode} state (run mucosa.py then dissect.py)`);
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
     scripts (Airway renders its markup from js/airway/app.js). */
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
    const m = fs.readFileSync(rel('js/oksat/engine.js'), 'utf8').match(/LEITNER_INTERVALS\s*=\s*\{([^}]*)\}/);
    const engine = m ? m[1].split(',').map((kv) => Number(kv.split(':')[1])) : [];
    const shown = leitner.intervals || [];
    ok(engine.length > 0 && JSON.stringify(engine) === JSON.stringify(shown),
      `leitner figure intervals [${shown}] === LEITNER_INTERVALS`,
      `leitner figure intervals [${shown}] !== LEITNER_INTERVALS [${engine}] (js/diagrams/leitner.js)`);
  }
}

/* ---- agent instructions (AGENTS.md, cross-agent standard) ----
   AGENTS.md is canonical; every model-specific entry file only points to it. */
function checkAgents() {
  ok(fs.existsSync(rel('AGENTS.md')), 'AGENTS.md exists', 'AGENTS.md missing (the canonical agent manual)');
  for (const f of ['CLAUDE.md', '.claude/CLAUDE.md', '.gemini/GEMINI.md', '.gemini/settings.json', '.agents/AGENTS.md']) {
    const src = fs.existsSync(rel(f)) ? fs.readFileSync(rel(f), 'utf8') : '';
    ok(src.includes('AGENTS.md'), `${f} points to AGENTS.md`, `${f} missing or does not point to AGENTS.md`);
  }
}

/* ---- run ---- */
console.log('=== check-data.mjs ===');
checkAgents();
checkOksat();
checkGuides();
checkAirway();
checkSecurity();
checkStamps();
checkSsb();
checkFigures();
checkOlsb();
console.log(`\n${failures ? 'FAILED' : 'OK'} — ${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
