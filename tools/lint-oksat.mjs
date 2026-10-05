#!/usr/bin/env node
/* =============================================================
   lint-oksat.mjs — quality lint for OKSAT modules (js/mcq-modules/*).

   tools/check-data.mjs enforces the structural minimum (count, ids,
   correct option). This enforces the rest of docs/authoring-oksat.md's
   quality spec and the authoring lessons in .claude/skills/oksat-module:

     ERROR  domains 5–8; concepts 20–50; 1–3 concepts per item; unknown or
            orphan concepts; duplicate ids; missing brief/detailed/answer;
            image or explanationImage that does not exist or lacks alt text;
            markdown (**bold**, #, backtick) in learner-facing text — the
            engine renders plain text only.
     WARN   answer-letter skew (any letter >40% of MCQs); no recall items;
            no case-* concepts or cases not at the end; items lacking
            `section` in a >30-item module; exclamation marks.

   Usage:  node tools/lint-oksat.mjs [slug ...]     (default: every module)
   Exits nonzero on any ERROR. Deps-free.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => {
  const w = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), w);
  return w.window;
};

const manifest = load('js/oksat-manifest.js').OKSAT_MANIFEST;
const want = process.argv.slice(2);
let errors = 0;

for (const entry of manifest) {
  if (want.length && !want.includes(entry.slug)) continue;
  const { meta, DOMAINS, CONCEPTS, ITEMS } = load(entry.data).__MCQ_MODULE;
  const E = (m) => { errors++; console.log(`  ERROR ${entry.slug}: ${m}`); };
  const W = (m) => console.log(`  warn  ${entry.slug}: ${m}`);
  console.log(`\n${entry.slug} (${ITEMS.length} items)`);

  const nd = Object.keys(DOMAINS).length;
  if (nd < 5 || nd > 8) E(`${nd} domains (spec 5–8)`);
  const nc = Object.keys(CONCEPTS).length;
  if (nc < 20 || nc > 50) E(`${nc} concepts (spec 20–50)`);
  for (const [k, c] of Object.entries(CONCEPTS)) if (!DOMAINS[c.domain]) E(`concept ${k}: unknown domain ${c.domain}`);

  const used = new Set(), ids = new Set();
  const md = /\*\*|^#{1,6}\s|`/m;
  ITEMS.forEach((it, i) => {
    const w = `${it.id || '#' + i}`;
    if (ids.has(it.id)) E(`duplicate id ${w}`);
    ids.add(it.id);
    const n = (it.concepts || []).length;
    if (n < 1 || n > 3) E(`${w}: ${n} concept tags (spec 1–3)`);
    (it.concepts || []).forEach((c) => { used.add(c); if (!CONCEPTS[c]) E(`${w}: unknown concept ${c}`); });
    const recall = it.type === 'recall';
    if (!it.brief) E(`${w}: missing brief`);
    if (recall ? !it.answer : !it.detailed) E(`${w}: missing ${recall ? 'answer' : 'detailed'}`);
    for (const k of ['image', 'explanationImage']) {
      if (!it[k]) continue;
      if (!fs.existsSync(path.join(ROOT, it[k]))) E(`${w}: ${k} not found: ${it[k]}`);
      if (!it[k + 'Alt']) E(`${w}: ${k} has no ${k}Alt`);
    }
    const text = [it.stem, it.answer, it.brief, it.detailed, ...(it.options || []).map((o) => o.text)].filter(Boolean).join('\n');
    if (md.test(text)) E(`${w}: markdown in text (engine renders plain text; use "• " bullets)`);
    if (/!/.test(text)) W(`${w}: exclamation mark (voice is a teaching attending)`);
    if (ITEMS.length > 30 && !it.section) W(`${w}: no section label`);
  });
  for (const c of Object.keys(CONCEPTS)) if (!used.has(c)) E(`orphan concept ${c}`);

  const mcq = ITEMS.filter((i) => (i.type || 'mcq') === 'mcq');
  const dist = {};
  mcq.forEach((i) => { dist[i.correct] = (dist[i.correct] || 0) + 1; });
  const top = Math.max(0, ...Object.values(dist));
  if (mcq.length >= 10 && top / mcq.length > 0.4) W(`answer-letter skew ${JSON.stringify(dist)}`);
  if (mcq.length && mcq.length === ITEMS.length) W('no recall items (free-response)');

  const caseKeys = Object.keys(CONCEPTS).filter((k) => k.startsWith('case-'));
  if (!caseKeys.length) W('no case-* concepts (synthesis cases)');
  else {
    const firstCase = ITEMS.findIndex((it) => it.concepts.some((c) => c.startsWith('case-')));
    const late = ITEMS.slice(firstCase).filter((it) => !it.concepts.some((c) => c.startsWith('case-')));
    if (late.length) W(`${late.length} non-case item(s) after the first case (cases belong at the end)`);
  }
  if (!meta.sources || !meta.sources.length) W('meta.sources is empty');
}

console.log(errors ? `\n${errors} error(s)` : '\nOK');
process.exit(errors ? 1 : 0);
