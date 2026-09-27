#!/usr/bin/env node
/* =============================================================
   ssb-content.mjs — schema + referential integrity for the SSB
   knowledge graph (ssb/content/*.json). Schema: docs/authoring-ssb.md.

   Pure Node, zero dependencies. Called by tools/check-data.mjs; also
   runs on its own:

     node tools/ssb-content.mjs                    # ssb/content/*.json
     node tools/ssb-content.mjs a.json b.json      # specific files
     node tools/ssb-content.mjs --allow-dangling x.json
                        # refs to ids outside the given files are
                        # reported as warnings (drafting one region)
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = path.join(ROOT, 'ssb', 'content');

const COLLECTIONS = {
  structures: 's', landmarks: 'lm', variants: 'v', classifications: 'c',
  measurements: 'm', hazards: 'h', principles: 'pr', procedures: 'p',
  stations: 't', pathways: 'pw', sources: 'src',
};
const COMMON = ['id', 'tier', 'review'];
const REQUIRED = {
  structures: [...COMMON, 'name', 'kind', 'region', 'what', 'why', 'geo', 'src'],
  landmarks: [...COMMON, 'name', 'of', 'locate'],
  variants: [...COMMON, 'name', 'of', 'def', 'why', 'geo', 'src'],
  classifications: [...COMMON, 'name', 'of', 'basis', 'classes', 'src'],
  measurements: [...COMMON, 'name', 'what', 'unit', 'value', 'method', 'conf', 'src'],
  hazards: [...COMMON, 'name', 'at', 'during', 'site', 'mechanism', 'consequence', 'prevent', 'recognize', 'rescue', 'src'],
  principles: [...COMMON, 'name', 'rule', 'why', 'src'],
  procedures: [...COMMON, 'name', 'indications', 'steps', 'src'],
  stations: ['id', 'tier', 'name', 'side', 'scope', 'where', 'shows', 'purpose'],
  pathways: [...COMMON, 'name', 'kind', 'from', 'via', 'to', 'src'],
  sources: ['id', 'cite', 'type', 'verified'],
};
const ENUM = {
  kind: ['bone', 'bone-part', 'cell', 'sinus', 'space', 'opening', 'mucosa', 'cartilage', 'artery', 'vein',
    'venous-sinus', 'nerve', 'ganglion', 'dura', 'brain', 'muscle', 'tendon', 'fat', 'gland', 'duct', 'ligament', 'region'],
  region: ['nasal-cavity', 'septum', 'lateral-wall', 'maxillary', 'lacrimal', 'nasopharynx', 'ppf', 'itf', 'ethmoid',
    'frontal', 'olfactory', 'orbit', 'acf', 'sphenoid', 'sellar', 'parasellar', 'suprasellar', 'clival', 'petrous', 'cvj'],
  geo: ['specimen', 'sweep', 'diorama', 'point', 'none'],
  rel: ['medial-to', 'lateral-to', 'anterior-to', 'posterior-to', 'superior-to', 'inferior-to', 'borders', 'wall-of',
    'attaches-to', 'contains', 'passes-through', 'transmits', 'drains-to', 'opens-into', 'branch-of', 'supplies',
    'innervates', 'accompanies', 'landmark-for'],
  reliability: ['constant', 'usual', 'variable'],
  unit: ['% sides', '% patients', '% specimens'],
  method: ['CT', 'cadaver', 'endoscopic', 'MRI', 'meta-analysis'],
  conf: ['high', 'med', 'low'],
  side: ['R', 'L', 'either', 'midline'],
  scope: [0, 30, 45, 70, null],
  pathwayKind: ['mucociliary', 'drainage'],
  srcType: ['consensus', 'classification', 'cadaver', 'CT-series', 'cohort', 'review', 'meta-analysis', 'textbook'],
  review: ['draft', 'verified'],
  tier: [1, 2, 3],
};
const ID = /^(s|lm|v|c|m|h|pr|p|t|pw|src)\.[a-z0-9]+(-[a-z0-9]+)*$/;
const INLINE_REF = /\[\[([a-z]+\.[a-z0-9-]+)(?:\|[^\]]*)?\]\]/g;

/* Returns { errors, warnings, index } — index maps id → { type, entity }. */
export function validate(files, { allowDangling = false } = {}) {
  const errors = [];
  const warnings = [];
  const index = new Map();
  const err = (m) => errors.push(m);

  /* Pass 1: parse, shape, ids, enums. */
  const docs = [];
  for (const file of files) {
    const tag = path.basename(file);
    let doc;
    try { doc = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { err(`${tag}: not valid JSON — ${e.message}`); continue; }
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) { err(`${tag}: top level must be an object`); continue; }
    for (const key of Object.keys(doc)) {
      if (!(key in COLLECTIONS)) { err(`${tag}: unknown collection "${key}"`); continue; }
      if (!Array.isArray(doc[key])) { err(`${tag}: ${key} must be an array`); continue; }
      const prefix = COLLECTIONS[key];
      for (const e of doc[key]) {
        const where = `${tag}:${e && e.id ? e.id : '(no id)'}`;
        if (!e || typeof e !== 'object') { err(`${where}: entity must be an object`); continue; }
        for (const f of REQUIRED[key]) if (e[f] === undefined || e[f] === '') err(`${where}: missing ${f}`);
        if (typeof e.id !== 'string' || !ID.test(e.id)) { err(`${where}: bad id`); continue; }
        if (e.id.split('.')[0] !== prefix) err(`${where}: ${key} ids must start with "${prefix}."`);
        if (index.has(e.id)) { err(`${where}: duplicate id (also in ${index.get(e.id).file})`); continue; }
        index.set(e.id, { type: key, entity: e, file: tag });
        checkEnums(key, e, where, err);
      }
      docs.push({ tag, key, list: doc[key] });
    }
  }

  /* Pass 2: every reference resolves. */
  const refCheck = (where, id, want) => {
    if (id === null || id === undefined) return;
    if (typeof id !== 'string') { err(`${where}: ref must be a string id`); return; }
    const hit = index.get(id);
    if (!hit) { (allowDangling ? warnings : errors).push(`${where}: unresolved ref ${id}`); return; }
    if (want && !want.includes(hit.type)) err(`${where}: ${id} should be a ${want.join('/')} id`);
  };
  const refs = (where, list, want) => { if (list === undefined) return; if (!Array.isArray(list)) { err(`${where}: expected an array of ids`); return; } for (const id of list) refCheck(where, id, want); };
  const inline = (where, text) => { if (typeof text !== 'string') return; if (/<[a-z/!]/i.test(text)) err(`${where}: HTML in text (escaped by the renderer; use [[id]] / *em*)`); for (const m of text.matchAll(INLINE_REF)) refCheck(where, m[1]); };
  const walkText = (where, v) => { if (typeof v === 'string') inline(where, v); else if (Array.isArray(v)) v.forEach((x) => walkText(where, x)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => walkText(where, x)); };

  for (const { tag, key, list } of docs) {
    for (const e of list) {
      if (!e || typeof e.id !== 'string') continue;
      const w = `${tag}:${e.id}`;
      walkText(w, e);
      if (key !== 'sources') refs(w + ' src', e.src, ['sources']);
      if (key === 'structures') {
        refCheck(w + ' partOf', e.partOf, ['structures']);
        for (const r of e.rel || []) refCheck(`${w} rel ${r.r}`, r.to);
      }
      if (key === 'landmarks' || key === 'variants' || key === 'classifications') refCheck(w + ' of', e.of);
      if (key === 'variants') {
        refCheck(w + ' class', e.class, ['classifications']);
        for (const p of e.prev || []) refCheck(w + ' prev.src', p.src, ['sources']);
      }
      if (key === 'measurements') { refCheck(w + ' from', e.from, ['landmarks']); refCheck(w + ' to', e.to, ['landmarks']); }
      if (key === 'hazards') { refCheck(w + ' at', e.at, ['structures']); refs(w + ' during', e.during, ['procedures']); }
      if (key === 'procedures') {
        for (const [i, st] of (Array.isArray(e.steps) ? e.steps : []).entries()) {
          const sw = `${w} step ${i + 1}`;
          if (!st || !st.do) err(`${sw}: missing do`);
          refs(sw + ' see', st && st.see);
          refs(sw + ' risk', st && st.risk, ['hazards']);
          refCheck(sw + ' station', st && st.station, ['stations']);
          refs(sw + ' removes', st && st.removes, ['structures']);
        }
      }
      if (key === 'stations') refs(w + ' shows', e.shows);
      if (key === 'pathways') { refCheck(w + ' from', e.from); refs(w + ' via', e.via); refCheck(w + ' to', e.to); }
    }
  }

  /* Pass 3: review gate — verified content stands on verified sources. */
  for (const [id, { type, entity, file }] of index) {
    if (type === 'sources' || entity.review !== 'verified') continue;
    const srcs = entity.src || [];
    if (!srcs.length) errors.push(`${file}:${id}: verified but cites no source`);
    for (const s of srcs) { const hit = index.get(s); if (hit && hit.entity.verified !== true) errors.push(`${file}:${id}: verified but ${s} is unverified`); }
  }
  return { errors, warnings, index };
}

function checkEnums(key, e, where, err) {
  const one = (field, list, val = e[field]) => { if (val !== undefined && !list.includes(val)) err(`${where}: ${field} "${val}" not in vocabulary`); };
  if (key !== 'sources') one('tier', ENUM.tier);
  if (key !== 'sources' && key !== 'stations') one('review', ENUM.review);
  if (key === 'structures') {
    one('kind', ENUM.kind); one('region', ENUM.region); one('geo', ENUM.geo); one('reliability', ENUM.reliability);
    if (e.rel !== undefined && !Array.isArray(e.rel)) err(`${where}: rel must be an array`);
    for (const r of Array.isArray(e.rel) ? e.rel : []) one('rel', ENUM.rel, r && r.r);
    for (const p of e.pearls || []) one('pearls.tier', ENUM.tier, p && p.tier);
  }
  if (key === 'variants') {
    one('geo', ENUM.geo);
    for (const p of e.prev || []) {
      for (const f of ['value', 'unit', 'method', 'src', 'conf']) if (!p || p[f] === undefined) err(`${where}: prev entry missing ${f}`);
      if (p) { one('prev.unit', ENUM.unit, p.unit); one('prev.method', ENUM.method, p.method); one('prev.conf', ENUM.conf, p.conf); }
    }
  }
  if (key === 'classifications' && Array.isArray(e.classes)) {
    for (const c of e.classes) if (!c || !c.code || !c.criterion) err(`${where}: each class needs code + criterion`);
  }
  if (key === 'measurements') {
    one('method', ENUM.method); one('conf', ENUM.conf);
    const v = e.value || {};
    if (!['mean', 'median', 'range'].some((k) => v[k] !== undefined)) err(`${where}: value needs mean, median or range`);
  }
  if (key === 'stations') { one('side', ENUM.side); one('scope', ENUM.scope); }
  if (key === 'pathways') one('kind', ENUM.pathwayKind);
  if (key === 'sources') { one('type', ENUM.srcType); if (typeof e.verified !== 'boolean') err(`${where}: verified must be boolean`); }
}

export function contentFiles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(CONTENT_DIR, f));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const allowDangling = args.includes('--allow-dangling');
  const given = args.filter((a) => !a.startsWith('--'));
  const files = given.length ? given.map((f) => path.resolve(f)) : contentFiles();
  const { errors, warnings, index } = validate(files, { allowDangling });
  for (const w of warnings) console.log('  WARN  ' + w);
  for (const e of errors) console.log('  FAIL  ' + e);
  const counts = {};
  for (const { type } of index.values()) counts[type] = (counts[type] || 0) + 1;
  console.log(`${errors.length ? 'FAILED' : 'OK'} — ${files.length} file(s), ${index.size} entities`, counts,
    warnings.length ? `(${warnings.length} dangling)` : '');
  process.exit(errors.length ? 1 : 0);
}
