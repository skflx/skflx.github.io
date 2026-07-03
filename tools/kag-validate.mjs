#!/usr/bin/env node
/* =============================================================
   KAG shard validator + merger (dev-only; never shipped to Pages).

   Validates authored shards ({nodes,edges}) against schema v2, then
   merges the clean ones into data/kag-graph.json.

   Usage:
     node tools/kag-validate.mjs [--dir <shardDir>] [--graph <file>] [--dry]
   Defaults: --dir scratchpad_p2/shards  --graph data/kag-graph.json
   --dry validates + prints the report but does NOT write the graph.

   Guarantees (see docs/oto-kag-atlas-plan.md §4.5):
   - node.type / subspecialty / structure / region / laterality coerced
     to their enums (bad type -> 'concept'; legacy subspecialty mapped,
     else -> 'fundamentals'); v2 fields defaulted; review:false on shard
     nodes; ids must be kebab-case and unique (seed wins on collision).
   - edge.type coerced to enum (unknown -> 'contained_in'); edges with an
     endpoint missing from the FINAL node set are dropped (no dangling).
   - node.oksat.concepts entries that do not resolve to a real module
     CONCEPTS key are dropped (validated against js/mcq-modules/*).
   Never throws on bad data — it reports and coerces/drops.
   ============================================================= */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const DIR = opt('--dir', 'scratchpad_p2/shards');
const GRAPH = opt('--graph', 'data/kag-graph.json');
const DRY = args.includes('--dry');

const NODE_TYPES = ['anatomy', 'pathology', 'procedure', 'nerve', 'vessel', 'drug', 'concept'];
const SUBS = ['otology', 'rhinology', 'laryngology', 'hn_onc', 'fprs', 'pediatrics', 'sleep', 'endocrine', 'fundamentals'];
const SUB_MAP = { 'head-neck-onc': 'hn_onc', 'peds-ent': 'pediatrics', 'facial-plastics': 'fprs', 'skull-base': 'otology' };
const STRUCTURES = ['bone', 'cartilage', 'ligament', 'fascia', 'joint', 'foramen', 'space', 'membrane', 'muscle'];
const REGIONS = ['temporal-bone', 'skull-base', 'facial-skeleton', 'nasal-sinus', 'larynx', 'neck', 'oral-pharynx', 'cervical-spine-hyoid', 'external-ear'];
const LAT = ['midline', 'paired'];
const EDGE_TYPES = ['innervates', 'supplies', 'drains_to', 'landmark_for', 'complication_of', 'differentiates_from', 'treats', 'staged_with', 'arises_from', 'contained_in', 'branches_from', 'articulates_with', 'attaches_to', 'part_of', 'bounded_by', 'continuous_with', 'passes_through', 'transmits', 'suspends', 'forms'];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TODAY = new Date().toISOString().split('T')[0];

const warn = [];
const W = (m) => warn.push(m);

/* ---- load real module CONCEPTS keys (sandbox, mirrors the atlas loader) ---- */
function loadModuleConcepts() {
  const slugs = ['pediatrics', 'ta-tubes', 'vestibular-schwannoma', 'facial-reanimation', 'dtc-risk-stratification'];
  const out = {};
  for (const slug of slugs) {
    try {
      const src = fs.readFileSync(`js/mcq-modules/${slug}.js`, 'utf8');
      const win = {};
      new Function('window', src + '\n;return window;')(win);
      out[slug] = new Set(Object.keys((win.__MCQ_MODULE || {}).CONCEPTS || {}));
    } catch (e) { out[slug] = new Set(); W(`could not load module ${slug}: ${e.message}`); }
  }
  return out;
}

/* ---- load taxonomy topic ids (for coverage) ---- */
function loadTopics() {
  try {
    const src = fs.readFileSync('js/oksat-taxonomy.js', 'utf8');
    const win = {};
    new Function('window', src + '\n;return window;')(win);
    return (win.OKSAT_TAXONOMY.topics || []).map(t => t.id);
  } catch (e) { W(`could not load taxonomy: ${e.message}`); return []; }
}

const MODCONCEPTS = loadModuleConcepts();
const TOPICS = loadTopics();

function normNode(n, fromShard) {
  const o = {};
  o.id = String(n.id || '').trim();
  o.label = String(n.label || o.id).trim();
  o.type = NODE_TYPES.includes(n.type) ? n.type : 'concept';
  let sub = n.subspecialty;
  if (SUB_MAP[sub]) sub = SUB_MAP[sub];
  o.subspecialty = SUBS.includes(sub) ? sub : 'fundamentals';
  o.detail = String(n.detail || '').trim();
  o.sources = Array.isArray(n.sources) ? n.sources.filter(Boolean) : [];
  o.corrections = Array.isArray(n.corrections) ? n.corrections : [];
  o.leitner = (n.leitner && typeof n.leitner.box === 'number') ? { box: n.leitner.box, nextReview: n.leitner.nextReview || TODAY } : { box: 1, nextReview: TODAY };
  o.aliases = Array.isArray(n.aliases) ? n.aliases.filter(x => typeof x === 'string') : [];
  o.abbrev = (typeof n.abbrev === 'string' && n.abbrev) ? n.abbrev : null;
  o.structure = STRUCTURES.includes(n.structure) ? n.structure : null;
  o.region = REGIONS.includes(n.region) ? n.region : null;
  o.laterality = LAT.includes(n.laterality) ? n.laterality : null;
  // oksat links
  const ok = n.oksat || {};
  const concepts = [];
  (Array.isArray(ok.concepts) ? ok.concepts : []).forEach(c => {
    if (!c || !c.module || !c.concept) return;
    if (MODCONCEPTS[c.module] && MODCONCEPTS[c.module].has(c.concept)) concepts.push({ module: c.module, concept: c.concept });
    else droppedLinks.push(`${o.id}: ${c.module}:${c.concept}`);
  });
  const modules = (Array.isArray(ok.modules) ? ok.modules : []).filter(m => MODCONCEPTS[m]);
  const topics = (Array.isArray(ok.topics) ? ok.topics : []).filter(t => typeof t === 'string');
  o.oksat = { modules, concepts, topics };
  o.review = fromShard ? false : (n.review === true);
  if (fromShard) {
    if (!KEBAB.test(o.id)) W(`bad id (not kebab): "${o.id}"`);
    if (!o.sources.length) W(`node "${o.id}" has no sources`);
    if (!o.detail) W(`node "${o.id}" has empty detail`);
    if (!o.oksat.topics.length) W(`node "${o.id}" has no oksat.topics (coverage untraceable)`);
  }
  return o;
}

let droppedLinks = [];

/* ---- base graph ---- */
const base = JSON.parse(fs.readFileSync(GRAPH, 'utf8'));
const nodesById = new Map();
base.nodes.forEach(n => nodesById.set(n.id, normNode(n, false)));
const edgeKey = e => `${e.source}|${e.target}|${e.type}`;
const edgesByKey = new Map();
base.edges.forEach(e => {
  const type = EDGE_TYPES.includes(e.type) ? e.type : 'contained_in';
  edgesByKey.set(edgeKey({ source: e.source, target: e.target, type }), { source: e.source, target: e.target, type, ...(e.label ? { label: e.label } : {}), ...(e.direction ? { direction: e.direction } : {}) });
});

/* ---- shards ---- */
const perSub = {};
let collisions = 0, addedNodes = 0, shardEdgeSeen = 0, addedEdges = 0, droppedEdges = 0;
const shardFiles = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')) : [];
if (!shardFiles.length) { console.error(`No shards in ${DIR}`); }

const pendingEdges = [];
for (const f of shardFiles) {
  let shard;
  try { shard = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); }
  catch (e) { console.error(`SHARD PARSE FAIL ${f}: ${e.message}`); process.exitCode = 1; continue; }
  const name = f.replace(/\.json$/, '');
  perSub[name] = { nodes: 0, edges: 0 };
  (shard.nodes || []).forEach(raw => {
    const n = normNode(raw, true);
    if (!n.id) return;
    if (nodesById.has(n.id)) { collisions++; return; } // seed / earlier shard wins
    nodesById.set(n.id, n); addedNodes++; perSub[name].nodes++;
  });
  (shard.edges || []).forEach(e => {
    if (!e || !e.source || !e.target) return;
    shardEdgeSeen++;
    const type = EDGE_TYPES.includes(e.type) ? e.type : 'contained_in';
    pendingEdges.push({ source: e.source, target: e.target, type, label: e.label, direction: e.direction, _sub: name });
  });
}

/* ---- resolve edges against the FINAL node set ---- */
pendingEdges.forEach(e => {
  if (!nodesById.has(e.source) || !nodesById.has(e.target)) { droppedEdges++; return; }
  const k = edgeKey(e);
  if (edgesByKey.has(k)) return;
  const rec = { source: e.source, target: e.target, type: e.type };
  if (e.label) rec.label = e.label;
  if (e.direction) rec.direction = e.direction;
  edgesByKey.set(k, rec);
  addedEdges++;
  if (perSub[e._sub]) perSub[e._sub].edges++;
});

/* ---- assemble merged graph ---- */
const merged = {
  version: 2,
  updated: new Date().toISOString(),
  status: base.status || 'DRAFT — pending clinical review.',
  sources: base.sources || [],
  nodes: [...nodesById.values()],
  edges: [...edgesByKey.values()],
};

/* ---- coverage ---- */
const topicsCovered = new Set();
merged.nodes.forEach(n => (n.oksat.topics || []).forEach(t => topicsCovered.add(t)));
const missing = TOPICS.filter(t => !topicsCovered.has(t));
const subCounts = {};
merged.nodes.forEach(n => { subCounts[n.subspecialty] = (subCounts[n.subspecialty] || 0) + 1; });
const structural = merged.nodes.filter(n => n.structure).length;
const oksatLinked = merged.nodes.filter(n => n.oksat.concepts.length || n.oksat.modules.length).length;

/* ---- report ---- */
console.log('=== KAG merge report ===');
console.log(`shards: ${shardFiles.join(', ') || '(none)'}`);
console.log(`nodes: ${base.nodes.length} seed + ${addedNodes} added = ${merged.nodes.length}  (collisions skipped: ${collisions})`);
console.log(`edges: ${base.edges.length} seed + ${addedEdges} added = ${merged.edges.length}  (shard edges seen ${shardEdgeSeen}, dropped/dangling ${droppedEdges})`);
console.log(`structural nodes: ${structural} | oksat-linked nodes: ${oksatLinked} | dropped oksat links: ${droppedLinks.length}`);
console.log('per-shard added:', Object.entries(perSub).map(([k, v]) => `${k}:${v.nodes}n/${v.edges}e`).join('  '));
console.log('subspecialty node counts:', Object.entries(subCounts).map(([k, v]) => `${k}:${v}`).join('  '));
console.log(`topic coverage: ${TOPICS.length - missing.length}/${TOPICS.length} covered`);
if (missing.length) console.log('  UNCOVERED topics:', missing.join(', '));
if (droppedLinks.length) console.log(`  dropped oksat links (first 10): ${droppedLinks.slice(0, 10).join('  ')}`);
if (warn.length) { console.log(`\nwarnings (${warn.length}):`); warn.slice(0, 25).forEach(w => console.log('  - ' + w)); if (warn.length > 25) console.log(`  ...and ${warn.length - 25} more`); }

/* ---- final audit: dangling + dup ---- */
const ids = new Set(merged.nodes.map(n => n.id));
const dangling = merged.edges.filter(e => !ids.has(e.source) || !ids.has(e.target)).length;
console.log(`\nfinal audit: dangling edges ${dangling}, dup ids ${merged.nodes.length - ids.size}`);

if (DRY) { console.log('\n--dry: not writing.'); }
else if (process.exitCode) { console.log('\nErrors present — not writing. Fix shards and re-run.'); }
else { fs.writeFileSync(GRAPH, JSON.stringify(merged, null, 2) + '\n'); console.log(`\nWROTE ${GRAPH}`); }
