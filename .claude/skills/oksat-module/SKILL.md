---
name: oksat-module
description: Build a new OKSAT study module for skflx.github.io (js/oksat/modules/<slug>.js + manifest entry + figures) from the owner's sources: Drive PDFs and textbooks, vault notes, resident-review decks. Use when asked for a new OKSAT module, study module, question bank, or "a module on <topic>", or to extend or audit an existing one. The module is source-grounded, mixes free-response and MCQ, builds knowledge in a deliberate arc, and ends with synthesis cases.
---

# OKSAT module

The spec is `docs/authoring-oksat.md` (schema, quality checklist). This file is the order of work and
the lessons the spec does not state. Read the spec's schema once, then work here. Reference modules:
`js/oksat/modules/facial-analysis.js` (file template), `facial-reanimation.js` (cases),
`otoplasty.js` (mixed MCQ and recall with images).

Every module has four hallmarks, enforced as noted:

1. **Source-grounded.** Every fact traces to a named source in `meta.sources`.
2. **Free response and MCQ.** MCQs open on the recall gate (engine behaviour); list and definition
   prompts are `type: 'recall'` items.
3. **Builds knowledge.** Section order is a ladder; later items reuse earlier facts.
4. **Synthesis at the end.** `case-<name>` sequences of 2–4 questions that make the learner measure,
   interpret and choose.

## 0. Pin down the request

Get these from the message; ask only for what is missing:

- **Topic, scope, and slug** (kebab-case; permanent, because ids reset history).
- **Sources the owner named** (Drive folders or PDFs, a deck, vault notes). Names in the request win over
  your own picks.
- **Subspecialty**: must be a key of `OKSAT_SUBSPECIALTIES`. A new one is an owner decision
  (`docs/decisions.md` §7); ask, do not invent.
- **Images wanted?** If so, from where.

Clinical correctness is the owner's to verify. Never mark anything verified; the hand-off says which
claims came from which source and where sources disagree.

## 1. Gather sources

List before guessing: the owner's Drive is organised as `skflx.obs/{02 Books, Files, textbook-figures, …}`,
and the vault's atomic notes are Markdown in Drive.

| Source | How to read it |
|---|---|
| Vault notes (`.md`) | `read_file_content`. Atomic, with a `sources:` line: good seeds, but **unvetted** and sometimes wrong. |
| PDFs in Drive | `read_file_content` returns text. A large result is saved to a file: grep it (landmark terms, then print a window), do not read it whole. A very large or scanned PDF can return an **empty** string: say so, and cite the book only through vault notes that quote it. |
| Decks (`.pptx`) | `unzip` into the scratchpad. Text: `<a:t>` per `ppt/slides/slideN.xml`. Images: `ppt/slides/_rels/slideN.xml.rels` maps slide to `ppt/media/`. Slide order is a good outline; its errors are findable. |
| Images in Drive | `download_file_content` saves base64 JSON to a file (the call reports an error with a path; expected). Decode with `python3` (`base64.b64decode(json.load(f)['content'])`). `read_file_content` on an image returns OCR text, useful for checking a title. |

Rank sources and use the top one for numbers: board-review text > the owner's deck > vault notes.
Numbers and norms come from a source, never from memory.

### Reconcile, do not average

Sources disagree (ranges, definitions, a slide error). For each conflict, key the answer from the
highest-ranked source, write the disagreement into that item's `detailed` under **Discrepancy:** or
**Caveat:**, and list it in the hand-off. Design questions so the keyed answer survives the disagreement
(ask for the sex-specific pattern, not an upper bound that varies by source).

Anything the sources do not state, and anything you are unsure of, is checked on the web before it is
keyed, and recorded in `meta.sources` (title and PubMed id or journal, never a bare URL). Report what the
search confirmed and what it could not; a claim found only in the deck is labelled "deck only".

Test every geometric or causal claim before encoding it. Construct the geometry, do not trust the note:
a vault statement can be backwards. Flag it; do not copy it.

## 2. Figures

Use a figure only when it shows what text cannot (spatial relations, a classification panel, a surgical
series).

1. **Look at every candidate**, not its filename. Montage them (`PIL` or ImageMagick `montage`), view
   each sheet, then any you will use at full size. Captions and titles lie.
2. **Labelled vs unlabelled decides the slot.** A figure that prints the answer goes in
   `explanationImage` (inside "Read more"). Only an unlabelled figure may be a stem `image`.
3. **Reject** figures with patient faces, clinic or stock-photo watermarks, labels that contradict the
   source text, or resolution too low to read.
4. **Copy to `images/oksat/<slug>/`**, kebab-case names, content unmodified (no crops, no annotation).
   Then compress, and view the result beside the original at full size:
   - cap width at 1200 px;
   - line art and text figures: 256-colour PNG (`Image.quantize`, no dither);
   - photographs, shaded illustrations, gradients: JPEG quality 90, `subsampling=0`. A palette PNG
     posterises them;
   - grayscale figures: `convert('L')` PNG, lossless.
5. **Alt text** describes what is visibly there, including printed labels and values, and never asserts
   more than you saw. Every image needs `imageAlt` / `explanationImageAlt`.
6. **Credit and rights.** Record provenance in the file header and `meta.sources`. Textbook figures are
   third-party; say so in the header and the hand-off, and leave the decision to the owner. CC BY-NC-ND
   figures stay unmodified and credited.
7. Do not reuse a figure that the module's own sources contradict.

## 3. Design the module

### Structure

- **Domains 5–8** (a guide's companion module: up to one per numbered chapter), each a topical section
  and a step on the ladder; one hue pair each (`color` solid, `hex` translucent 0.13–0.14). Reuse the
  palette of existing modules.
- **Concepts 20–50** (a guide's companion: up to one per guide section), kebab-case, each in exactly one
  domain and tagged by at least one item. 1–3 tags per item. Case keys are `case-<name>`.
- **Section label** on every item (required over 30 items).
- Size: 40–65 items. Quality over count; never pad.

### The ladder (order of `ITEMS`)

Foundations (measurement, vocabulary, anatomy) → classification and norms → analysis or work-up →
management → **cases**. Each rung must be answerable using only earlier rungs. Reuse earlier facts in
later stems and in the cases.

### Item mix

- **MCQ (about 75–80%)**: discrimination, interpretation, application. The stem must be **answerable
  from memory** with the choices hidden: no "which of the following is true" without context.
- **Recall (about 20%)**: lists, definitions, norms, "name the four…". Answer as `\n` lines with `• `
  bullets or short labelled lines. Always include `brief`, and `detailed` when the answer needs
  mechanism. Recall items carry `section` too.
- **Numbers keep their sources.** A norm question names the structure, not the number, in the stem.
- **Distractors** come from neighbouring lists (the other manoeuvre's list, the other angle's norm), not
  absurdities. A distractor may be a common source error; name it in the explanation.
- **Balance answer letters.** Hand-written modules skew to b and c. For a **new** module only, shuffle
  options programmatically with a fixed cycle; skip items whose options are an ordered series (Type I–VI,
  ratios) or contain "none of the above". `tools/lint-oksat.mjs` warns above 40% for one letter.

### Explanation voice

`brief` is the takeaway in 1–2 sentences. `detailed` is **mechanism → application → pearl** (label the
pearl "Pearl:"). Add **Discrepancy:** or **Caveat:** where sources disagree or a claim rests on one
source. No exclamation marks, no gamification, no congratulation. State why a wrong option is wrong when
a likely error exists.

### Synthesis cases (the last section)

Three or four cases of 2–4 questions each, `section: 'Synthesis Cases'`, concept `case-<name>`. A case:

1. Opens with a short vignette giving **raw measurements or findings**, not the diagnosis, so the
   learner must apply the module's norms.
2. Q1 interprets (which values are abnormal); Q2 integrates (what the pattern means and the plan, usually
   the non-obvious one); Q3–4 choose the manoeuvre or work-up and its safeguard.
3. Continues with "(Same patient.)" so cases read as sequences.
4. Cross-links sections (landmark, angle, plan), so a miss points back to a rung.

Include one case whose naive answer is wrong. Keep arithmetic checkable: if a stem gives numbers,
compute them before keying.

## 4. Write the file

Order inside the file: header comment (title, source, figure credits, discrepancy policy); `meta` (with
`id`, `sources`); `DOMAINS`; `CONCEPTS`; items grouped under `// ════ DOMAIN ════` dividers; the one
`window.__MCQ_MODULE = {...}` line.

Engine constraints that bite:

- **Plain text only.** `**bold**`, `#` and backticks render literally. Use `\n` and `• `.
- Template literals are convenient for multi-line text; never put `${` in them. Do not mix real and
  escaped Unicode; normalise one way.
- `id`s are permanent: `q1…qN` in final order. Never renumber a studied module.
- A stem may say "(Same patient.)", but the MCQ must be answerable at the recall gate without a
  neighbour: restate the key finding when the answer needs it.

## 5. Register

Append one entry to `js/oksat/manifest.js`: `slug`, `title`, `kicker`, `subspecialty`, `count`
(= `ITEMS.length`), `accent` (that subspecialty's hue), `desc` (one line), `data`, and `draft: true`.
Then `node tools/stamp-assets.mjs`.

## 6. Verify (all of it, before saying "done")

```bash
node tools/lint-oksat.mjs <slug>     # quality spec: concepts, orphans, alt text, markdown, letter skew
node tools/check-data.mjs            # structural: count, ids, correct option
node tools/test-oksat-engine.mjs     # engine still passes
node tools/smoke-pages.mjs --page 'oksat-study.html?m=<slug>'   # boots, no console errors
```

Then **drive the real page** and look. A green lint proves structure, not that the learner sees what
you intended. Playwright is a devDependency (`npm install` first; `node_modules` is gitignored); use
`tools/smoke-lib.mjs` (`startServer()` gives `.origin`; `launchBrowser()`). Click **Begin**, then per item:
MCQ `c`, `1`, `d` (opens "Read more"); recall `space`, `3`, `d`; `ArrowRight` moves on. (`h` is
**home**.) Assert no image has `naturalWidth === 0`, and screenshot a recall item, an item with a stem
image, and an item with an explanation image, and read them.

Do not accept a walk that never left the landing page: check that it reached the items.

## Auditing an existing module

`node tools/lint-oksat.mjs` lists problems. Progress is stored by **item id and option id**, so on a
studied module:

- Safe: trim tags to 3 (drop the broadest first; keep `case-*` and safety tags), merge singleton
  concepts to get under 50, add `section` labels, add `meta.sources` from the header, reorder items in
  the array (ids unchanged).
- Never: renumber ids, reorder or relabel options, change `correct`. Answer-letter skew in studied modules
  is reported, not fixed, for this reason.
- Verify that every item's id, options, `correct`, stem, brief and detailed are byte-identical to
  `git show HEAD:<file>` after the edit.

Concept keys and item ids are what interactive guides link to (`docs/authoring-oksat-guide.md`).
`tools/check-data.mjs` fails when a guide points at a missing one, so renaming either is breaking.

## 7. Documentation pass (required, last)

Per `AGENTS.md` (Documentation second pass): `README.md` (counts-free), `docs/wip.md` (current state),
`AGENTS.md` if it enumerates modules, `docs/authoring-oksat.md` if the lesson is general. No item counts
or sizes in prose.

## 8. Hand-off

In this order:

1. What shipped (slug, item count, recall and MCQ mix, cases) and what was verified.
2. **Source conflicts** and how each was resolved; every claim resting on a single or unvetted source.
3. **What could not be read** (empty PDFs, missing figures) and how it was cited instead.
4. **Figures rejected and why**, and the rights note for those used.
5. That nothing is clinically verified; the owner sets that.
6. Commit and push only as the session instructs; never open a PR unasked.
