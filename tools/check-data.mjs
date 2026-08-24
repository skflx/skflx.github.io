#!/usr/bin/env node
/* =============================================================
   check-data.mjs — committed-data invariant checker (dev-only).

   The site ships no build step, so the committed JSON/JS data files
   ARE the databases. tools/kag-validate.mjs only validates shards at
   MERGE time; nothing re-checks the committed graph, the OKSAT
   manifest/modules, or the airway bank once they land. This does.

   Pure Node, ZERO npm dependencies. Reports PASS/FAIL per check and
   exits nonzero if any check fails. Loads window.*-style data files
   with the same sandbox trick tools/kag-validate.mjs uses.

   Usage:  node tools/check-data.mjs

   Item schemas learned from the real modules (read before trusting):
   - MCQ item:    { id, type:'mcq', stem, options:[{id,text}...],
                    correct:<option id>, brief, ... concepts:[] }
   - Recall item: { id, type:'recall', stem, answer, brief, concepts:[] }
     (no options / no `correct`; graded by self-report)
   - Airway question: { id, topic, difficulty, q, a, pearl,
                        choices:[correct, ...distractors] }  (choices[0] correct)

   As of 2026-07-08 every check here passes on master. If a check fails
   on untouched master, the CHECK is wrong — investigate before editing data.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  NODE_TYPES, SUBSPECIALTIES, STRUCTURES, REGIONS, LATERALITIES, EDGE_TYPES, KEBAB,
} from './kag-enums.mjs';

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
   1. KAG graph  (data/kag-graph.json)
   =========================================================== */
function checkGraph() {
  console.log('\ndata/kag-graph.json');
  let g;
  try { g = JSON.parse(fs.readFileSync(rel('data/kag-graph.json'), 'utf8')); }
  catch (e) { fail('parse: ' + e.message); return; }

  ok(g.version === 2, 'version === 2', `version is ${g.version}, expected 2`);
  ok(Array.isArray(g.nodes), 'nodes is an array', 'nodes is not an array');
  ok(Array.isArray(g.edges), 'edges is an array', 'edges is not an array');
  if (!Array.isArray(g.nodes) || !Array.isArray(g.edges)) return;

  // ids: unique + kebab-case
  const ids = new Set();
  const dupes = [];
  const badKebab = [];
  for (const n of g.nodes) {
    if (ids.has(n.id)) dupes.push(n.id);
    ids.add(n.id);
    if (!KEBAB.test(String(n.id || ''))) badKebab.push(n.id);
  }
  ok(dupes.length === 0, 'node ids unique', `duplicate node ids: ${dupes.slice(0, 5).join(', ')}`);
  ok(badKebab.length === 0, 'node ids kebab-case', `non-kebab ids: ${badKebab.slice(0, 5).join(', ')}`);

  // sources: >=1 per node
  const noSources = g.nodes.filter((n) => !Array.isArray(n.sources) || n.sources.filter(Boolean).length === 0);
  ok(noSources.length === 0, 'every node has >=1 source',
    `${noSources.length} nodes lack sources (e.g. ${noSources.slice(0, 5).map((n) => n.id).join(', ')})`);

  // enums
  const badType = g.nodes.filter((n) => !NODE_TYPES.includes(n.type));
  ok(badType.length === 0, 'node.type in enum', `bad node.type: ${badType.slice(0, 5).map((n) => n.id + '=' + n.type).join(', ')}`);
  const badSub = g.nodes.filter((n) => !SUBSPECIALTIES.includes(n.subspecialty));
  ok(badSub.length === 0, 'node.subspecialty in enum', `bad subspecialty: ${badSub.slice(0, 5).map((n) => n.id + '=' + n.subspecialty).join(', ')}`);
  const badStruct = g.nodes.filter((n) => n.structure != null && !STRUCTURES.includes(n.structure));
  ok(badStruct.length === 0, 'node.structure null or in enum', `bad structure: ${badStruct.slice(0, 5).map((n) => n.id).join(', ')}`);
  const badRegion = g.nodes.filter((n) => n.region != null && !REGIONS.includes(n.region));
  ok(badRegion.length === 0, 'node.region null or in enum', `bad region: ${badRegion.slice(0, 5).map((n) => n.id).join(', ')}`);
  const badLat = g.nodes.filter((n) => n.laterality != null && !LATERALITIES.includes(n.laterality));
  ok(badLat.length === 0, 'node.laterality null or in enum', `bad laterality: ${badLat.slice(0, 5).map((n) => n.id).join(', ')}`);
  const badEdgeType = g.edges.filter((e) => !EDGE_TYPES.includes(e.type));
  ok(badEdgeType.length === 0, 'edge.type in enum', `bad edge.type: ${badEdgeType.slice(0, 5).map((e) => e.type).join(', ')}`);

  // no dangling edges
  const dangling = g.edges.filter((e) => !ids.has(e.source) || !ids.has(e.target));
  ok(dangling.length === 0, 'no dangling edges',
    `${dangling.length} dangling edges (e.g. ${dangling.slice(0, 3).map((e) => e.source + '->' + e.target).join(', ')})`);

  // oksat.concepts must resolve to a real module CONCEPTS key
  let modConcepts;
  try { modConcepts = moduleConceptIndex(); } catch (e) { modConcepts = null; }
  if (modConcepts) {
    const badLinks = [];
    for (const n of g.nodes) {
      const cs = (n.oksat && Array.isArray(n.oksat.concepts)) ? n.oksat.concepts : [];
      for (const c of cs) {
        if (!c || !c.module || !c.concept) { badLinks.push(`${n.id}:<malformed>`); continue; }
        const set = modConcepts[c.module];
        if (!set || !set.has(c.concept)) badLinks.push(`${n.id}: ${c.module}:${c.concept}`);
      }
    }
    ok(badLinks.length === 0, 'oksat.concepts resolve to real module CONCEPTS',
      `${badLinks.length} unresolved links (e.g. ${badLinks.slice(0, 5).join('  ')})`);
  }

  console.log(`  (info: ${g.nodes.length} nodes, ${g.edges.length} edges, ${g.nodes.filter((n) => n.review === true).length} review:true)`);
}

/* Build { slug: Set(conceptKeys) } from the manifest's modules. */
function moduleConceptIndex() {
  const man = loadWindow(rel('js/oksat-manifest.js'));
  const out = {};
  for (const entry of man.OKSAT_MANIFEST || []) {
    const w = loadWindow(rel(entry.data));
    out[entry.slug] = new Set(Object.keys((w.__MCQ_MODULE || {}).CONCEPTS || {}));
  }
  return out;
}

/* ===========================================================
   2. OKSAT manifest <-> modules
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
   3. Airway question bank
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
   4. oksat-db.json — parses as an object (may be near-empty)
   =========================================================== */
function checkOksatDb() {
  console.log('\ndata/oksat-db.json');
  try {
    const db = JSON.parse(fs.readFileSync(rel('data/oksat-db.json'), 'utf8'));
    ok(db && typeof db === 'object' && !Array.isArray(db), 'parses as an object', 'not a JSON object');
  } catch (e) { fail('parse: ' + e.message); }
}

/* ---- run ---- */
console.log('=== check-data.mjs ===');
checkGraph();
checkOksat();
checkAirway();
checkOksatDb();
console.log(`\n${failures ? 'FAILED' : 'OK'} — ${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
