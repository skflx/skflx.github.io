#!/usr/bin/env node
/* =============================================================
   lint-oksat-guide.mjs — content-quality lint for OKSAT Interactive
   learning guides (js/oksat/guides/<slug>/<chapter>.js). The guide twin
   of tools/lint-oksat.mjs. Rules: docs/oksat-learn-roadmap.md §2;
   schema: docs/authoring-oksat-guide.md.

   tools/check-data.mjs already enforces structure, block types, markup,
   figures, module references and terms. This enforces the teaching shape.

     ERROR  2–3 check prompts per section; a section has a drill row or
            nodrill: 'reason'; 3–6 tldr bullets per chapter; 3–10 sections
            per chapter (only the start chapter, which has none, is exempt);
            a number with a unit, %, or ratio in a p / why / ol / ul / table
            block that carries no [[src|…]] or [[A|…]] chip (the chip must sit
            in the same block); a check prompt that asks what an abbreviation
            stands for (a spoiler for the term popover); a drawn (.svg)
            figure whose caption does not say "schematic"; the start chapter
            with no "Currency check" call dated YYYY-MM, or a source card
            with no year; review not 'draft' or 'verified'; markdown leakage
            (#, "- " or "* " at line start, backticks); congratulation words;
            exclamation marks.
     WARN   the Currency check date is more than 12 months old.

   Not automated (judgment or owner decisions): medical correctness and
   whether a chip cites the right source; "sources ranked and read before
   writing"; a conflict stated in a trap labelled Source conflict; "one idea
   per section" and the teaching order (mechanism before fact, prompts after
   the teaching); whether a figure earns its place; that a guide ships with
   its questions; the phone-width read; that only the owner sets
   review 'verified'; that a Draft mark is shown until then (learn.js).

   Usage:  node tools/lint-oksat-guide.mjs [slug ...]   (default: every guide)
   Exits nonzero on any ERROR. Deps-free.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* Same loading as tools/check-data.mjs: run the file with a fresh window object. */
const loadWindow = (rel) => {
  const win = {};
  new Function('window', fs.readFileSync(path.join(ROOT, rel), 'utf8') + '\n;return window;')(win);
  return win;
};

const T = loadWindow('js/oksat/terms.js').OKSATTerms;
const guides = loadWindow('js/oksat/manifest.js').OKSAT_GUIDES || [];
const want = process.argv.slice(2);
let errors = 0;

/* Text blocks whose numbers must sit beside a source chip. */
const TEXT = new Set(['p', 'why', 'ul', 'ol', 'table']);
const CHIP = /\[\[(?:src|A)\|[^\]]*\]\]/;
/* A number with a unit or %, a range of such, or a ratio a:b. Years and
   citation volume:page pairs (after ';' or ':') are not quantities. */
const QTY = /(?<![\w.,;:])\d+(?:[.,]\d+)?(?:\s?[–-]\s?\d+(?:[.,]\d+)?)?[\s-]?(?:%|(?:mg|mL|ml|µg|μg|ng|pg|kg|g|IU|mm|cm|mmHg|h|hours?|days?|weeks?|months?|years?|yrs?|min|minutes?|mSv|fold|×|x)(?![A-Za-z]))|(?<![\w;:./–-])\d+\s?:\s?\d+(?![\d;:])/;
/* A check prompt that asks what an abbreviation stands for: the acronym is
   the subject ("What does CRSwNP mean?", "What is ITAM?", "ITAM stands for")
   or the question asks for an expansion ("stand for", "short for", "spell out",
   "full name of"). An acronym that is only context ("What does “1a” mean in an
   EPOS table?") is not a spoiler. */
const ACRO = /\b(?:[A-Z]{2,}[a-z]*|[A-Za-z]*[A-Z]\w*\d|[a-z]+[A-Z]+[A-Za-z0-9]*)\b/g;
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asksExpansion = (q) => {
  const toks = [...new Set([...(q.match(ACRO) || []), ...T.scan(q).hits.map((h) => h.key)])];
  return toks.some((t) => {
    const e = esc(t);
    return new RegExp(`\\bwhat\\s+(?:does|do|is|are)\\s+(?:the\\s+)?${e}(?![\\w'’-])\\s*(?:(?:means?|stands?|refers?|represents?|abbreviates?)\\b|\\?|$)`, 'i').test(q)
      || new RegExp(`(?<![\\w-])${e}(?![\\w-])\\s+(?:stands?|means?|refers?\\s+to)\\b`, 'i').test(q)
      || new RegExp(`\\bfull (?:name|form) of\\s+${e}(?![\\w-])`, 'i').test(q)
      || (/\bstands? for\b|\bshort for\b|\bspell (?:it|them|out)\b|\babbreviat/i.test(q) && new RegExp(`(?<![\\w-])${e}(?![\\w-])`).test(q));
  });
};
const MD = /^\s*#{1,6}\s|^\s*[-*]\s|`/m;
const CONGRAT = /\b(?:congratulations?|well done|great job|good job|nice work|awesome|keep it up|you did it|excellent work|bravo)\b/i;
/* Keys that carry no learner-visible prose. */
const SKIP = new Set(['t', 'id', 'k', 'alt', 'm', 'c', 'refs', 'tone', 'data', 'n', 'src', 'rs', 'nw', 'wide', 'cols', 'rise']);

/* Visit every block, including those nested in call, deep and cards. */
const eachBlock = (blocks, fn) => (blocks || []).forEach((b) => {
  fn(b);
  if (b.t === 'call' || b.t === 'deep') eachBlock(b.blocks, fn);
  if (b.t === 'cards') (b.items || []).forEach((it) => eachBlock(it.blocks, fn));
});

/* Strings a text block shows (table head and cells, list items). */
const blockStrings = (b) => {
  if (b.t === 'p' || b.t === 'why') return [b.x];
  if (b.t === 'ul' || b.t === 'ol') return (b.items || []).map((it) => (typeof it === 'string' ? it : it.x));
  if (b.t === 'table') return [...(b.head || []), ...(b.rows || []).flat().map((c) => (typeof c === 'string' ? c : c.x))];
  return [];
};

/* Every learner-visible string under a value, with its key. */
const collect = (v, key, out) => {
  if (typeof v === 'string') { if (!SKIP.has(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => collect(x, key, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) collect(x, k, out);
  return out;
};

for (const g of guides) {
  if (want.length && !want.includes(g.slug)) continue;
  const E = (m) => { errors++; console.log(`  ERROR ${g.slug}: ${m}`); };
  const W = (m) => console.log(`  warn  ${g.slug}: ${m}`);
  console.log(`\n${g.slug} (${g.chapters.length} chapters)`);

  for (const c of g.chapters) {
    const where = (s) => (s ? `${c.id}/${s}` : c.id);
    if (!fs.existsSync(path.join(ROOT, c.data))) { E(`${c.id}: data file missing: ${c.data}`); continue; }
    let ch;
    try { ch = loadWindow(c.data).__OKSAT_CHAPTER; } catch (e) { E(`${c.id}: load threw ${e.message}`); continue; }
    if (!ch) { E(`${c.id}: no __OKSAT_CHAPTER`); continue; }

    /* Chapter shape. */
    if (!['draft', 'verified'].includes(ch.review)) E(`${c.id}: review must be 'draft' or 'verified' (got ${JSON.stringify(ch.review)})`);
    if (!Array.isArray(ch.tldr) || ch.tldr.length < 3 || ch.tldr.length > 6) E(`${c.id}: ${Array.isArray(ch.tldr) ? ch.tldr.length : 0} tldr bullets (spec 3–6)`);
    const isStart = !Array.isArray(ch.sections);
    if (isStart) {
      if (c.id !== 'start') E(`${c.id}: no sections (only the start chapter has none)`);
    } else if (ch.sections.length < 3 || ch.sections.length > 10) {
      E(`${c.id}: ${ch.sections.length} sections (spec 3–10)`);
    }

    /* Sections: prompts, drill, and the text/chip rule. */
    for (const s of ch.sections || []) {
      const sw = where(s.id);
      let checks = 0;
      eachBlock(s.blocks, (b) => { if (b.t === 'check') checks++; });
      if (checks < 2 || checks > 3) E(`${sw}: ${checks} check prompt(s) (spec 2–3)`);
      const drilled = Array.isArray(s.drill) && s.drill.length > 0;
      const reason = typeof s.nodrill === 'string' && s.nodrill.trim();
      if (!drilled && !reason) E(`${sw}: no drill row and no nodrill reason`);
      eachBlock(s.blocks, (b) => {
        if (b.t === 'check') {
          const q = b.q || '';
          if (asksExpansion(q)) E(`${sw}: check ${b.id} asks what an abbreviation stands for (the term popover answers it)`);
        }
      });
    }

    /* Whole-chapter block rules: chips, figures, start-chapter sources. */
    const chapterBlocks = (fn) => { eachBlock(ch.intro, fn); (ch.sections || []).forEach((s) => eachBlock(s.blocks, fn)); };
    chapterBlocks((b) => {
      if (TEXT.has(b.t)) {
        const strs = blockStrings(b);
        const chipped = strs.some((s) => typeof s === 'string' && CHIP.test(s));
        if (!chipped) {
          for (const s of strs) {
            if (typeof s !== 'string') continue;
            const m = s.replace(/\[\[[^\]]*\]\]/g, ' ').replace(/\*/g, '').match(QTY);
            if (m) { E(`${c.id}: number with unit or ratio ("${m[0].trim()}") in a ${b.t} block with no [[src|…]] or [[A|…]] chip`); break; }
          }
        }
      }
      if (b.t === 'figure' && /\.svg$/i.test(b.src || '') && !/schematic/i.test(b.cap || '')) {
        E(`${c.id}: drawn figure ${b.src} caption does not say "schematic"`);
      }
    });

    if (isStart) {
      const cur = [];
      eachBlock(ch.intro, (b) => { if (b.t === 'call' && /currency check/i.test(b.label || '')) cur.push(b); });
      if (!cur.length) E(`${c.id}: no "Currency check" call`);
      else {
        const m = collect(cur[0].blocks, '', []).join(' ').match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
        if (!m) E(`${c.id}: Currency check call has no date in YYYY-MM form`);
        else {
          const now = new Date();
          const months = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
          if (months > 12) W(`${c.id}: Currency check dated ${m[0]} is ${months} months old (warn past 12)`);
        }
      }
      eachBlock(ch.intro, (b) => {
        if (b.t === 'cards') (b.items || []).forEach((it) => {
          if (!/\b(?:19|20)\d{2}\b/.test(it.h || '')) E(`${c.id}: source card "${it.h || '?'}" names no year`);
        });
      });
    }

    /* Learner-visible prose: markdown, exclamation marks, congratulation. */
    const prose = collect(ch, '', []);
    if (ch.src) prose.push(ch.src);
    for (const s of prose) {
      if (MD.test(s)) E(`${c.id}: markdown in text (engine renders plain text; use ul blocks): ${s.slice(0, 40)}`);
      if (/!/.test(s)) E(`${c.id}: exclamation mark: ${s.slice(0, 40)}`);
      if (CONGRAT.test(s)) E(`${c.id}: congratulation wording: ${s.slice(0, 40)}`);
    }
  }
}

if (want.length) for (const w of want) if (!guides.some((g) => g.slug === w)) { errors++; console.log(`  ERROR ${w}: no such guide in OKSAT_GUIDES`); }

console.log(errors ? `\n${errors} error(s)` : '\nOK');
process.exit(errors ? 1 : 0);
