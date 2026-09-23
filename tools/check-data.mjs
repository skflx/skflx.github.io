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
import path from 'path';
import { fileURLToPath } from 'url';
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
};

/* Pages that must make no third-party request at all. */
const SELF_CONTAINED = new Set(['airway-jeopardy.html', 'index.html', 'cpt-search.html']);

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

/* ---- run ---- */
console.log('=== check-data.mjs ===');
checkOksat();
checkAirway();
checkSecurity();
console.log(`\n${failures ? 'FAILED' : 'OK'} — ${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
