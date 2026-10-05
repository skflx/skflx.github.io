---
name: oksat-module
description: Build a new OKSAT study module for skflx.github.io (js/mcq-modules/<slug>.js + manifest entry + figures) from the owner's sources: Drive PDFs and textbooks, vault notes, resident-review decks. Use when asked for a new OKSAT module, study module, question bank, or "a module on <topic>", or to extend or audit an existing one. The module is source-grounded, mixes free-response and MCQ, builds knowledge in a deliberate arc, and ends with synthesis cases.
---

# OKSAT module

Distilled from the eight shipped modules (`facial-reanimation`, `lip-reconstruction`,
`otoplasty`, `vestibular-schwannoma`, `pediatrics`, `ta-tubes`, `dtc-risk-stratification`,
`allergy-testing`) and from `facial-analysis`, the module built to this recipe.
The specification is `docs/authoring-oksat.md`; this file is the order of work and
the lessons the spec does not state. Read the spec's schema once, then work here.

The four hallmarks of every module, and where each is enforced:

1. **Source-grounded.** Every fact traces to a named source in `meta.sources`.
2. **Free response and MCQ.** Every MCQ opens on the recall gate (engine behavior), and
   list/definition prompts are authored as `type: 'recall'` items.
3. **Builds knowledge.** Section order is a ladder; later items reuse earlier facts.
4. **Synthesis at the end.** `case-<name>` sequences of 2–4 questions that make the
   learner measure, interpret, and choose.

## 0. Pin down the request

Get these from the message; ask only for what is missing and cannot be inferred.

- **Topic and scope**, and the **slug** (kebab-case; permanent, because ids reset history).
- **Sources the owner named**: Drive folders/PDFs, a deck, vault notes. Names in the
  request win over your own picks.
- **Subspecialty**: must already be a key in `OKSAT_SUBSPECIALTIES`. A new one is an
  owner decision (`docs/decisions.md` §7); ask, do not invent.
- **Images wanted?** If so, where from (e.g. `skflx.obs/Files`).

Clinical correctness is the owner's to verify. Never set anything to "verified"; say in
the hand-off which claims came from which source and where sources disagree.

## 1. Gather sources

Start every source pass by listing, not guessing: the owner's Drive is organised as
`skflx.obs/{02 Books, Files, textbook-figures, …}`, and the vault's atomic notes are
Markdown in Drive.

| Source | How to read it |
|---|---|
| Vault notes (`.md`) | `read_file_content`. Atomic, with Active Recall Q&A and a `sources:` line: good seeds, but **unvetted** and sometimes wrong. |
| PDFs in Drive | `read_file_content` returns text; a large result is saved to a file and must be grepped, not read whole (`python3` + `json`, search the landmark terms, print a window). Very large or scanned PDFs return an **empty** string (Baker, 365 MB, did): say so and cite the book only through the vault notes that quote it. |
| Decks (`.pptx`) | `unzip` into the scratchpad. Text: regex `<a:t>` per `ppt/slides/slideN.xml`. Images: `ppt/slides/_rels/slideN.xml.rels` maps slide → `ppt/media/imageK.*`. The deck is the owner's own review scope: its slide order is a good outline, and its errors are findable. |
| Images in Drive | `download_file_content` saves base64 JSON to a file (the call "errors" with a path; that is expected). Decode with `python3` (`base64.b64decode(json.load(f)['content'])`). `read_file_content` on an image returns OCR text, useful for catching a wrong title. |

Rank sources and use the top one for numbers: the board-review text (Cummings Review) >
the owner's deck > vault notes. Numbers and norms come from a source, never from memory.

### Reconcile, do not average

Sources will disagree (ranges, definitions, an error in a slide). For each conflict:
pick the highest-ranked source for the keyed answer, write the disagreement into that
item's `detailed` under **Discrepancy:** / **Caveat:**, and list it in the hand-off. Design
questions so the keyed answer is robust to the disagreement (ask for the *sex-specific
pattern* rather than an upper bound that varies by source).

Test every geometric or causal claim before you encode it. `facial-analysis` caught a
vault statement that a recessed chin *increases* the nasomental angle: constructing the
angle shows it decreases. Flag it; do not copy it.

## 2. Figures

The learner needs a figure only when it shows what text cannot (spatial relations, a
classification panel, a surgical series). Never decoration.

1. **Look at every candidate**, not its filename. Montage them (`PIL` or ImageMagick
   `montage`), view each sheet, then view any you will use at full size. Captions and
   titles lie: `nose-scale.png` was the NOSE questionnaire (not a projection scale) and
   `plumb-line.png` was histology depth of invasion.
2. **Labeled vs unlabeled decides the slot.** A figure that prints the answer goes in
   `explanationImage` (inside "Read more"). Only an unlabeled figure may be a stem `image`.
3. **Reject** figures with patient faces, clinic watermarks, or resolution too low to
   read (a 200 px diagram is not a teaching figure).
4. **Copy unmodified** (convert TIFF → PNG only) to `img/oksat/<slug>/`, kebab-case names.
5. **Alt text describes what is visibly there**, including printed labels and values,
   and never asserts more than you saw. Every image needs `imageAlt` /
   `explanationImageAlt`.
6. **Credit and rights.** List figure provenance in the file header. Textbook figures are
   third-party; the site is public. Say so in the header and the hand-off and leave the
   decision to the owner. CC BY-NC-ND figures (StatPearls) stay unmodified and credited.
7. Do not reuse a figure the module's sources contradict (see the deck's keystone-area error
   in `facial-analysis` q32).

## 3. Design the module

### Structure

- **Domains 5–8**, each a topical section **and** a step on the ladder; one hue pair
  each (`color` solid, `hex` rgba 0.13–0.14). Reuse the palette from existing modules.
- **Concepts 20–50**, kebab-case, each in exactly one domain, each tagged by ≥ 1 item.
  1–3 tags per item. Case keys are `case-<name>`.
- **Section label** on every item (shown above the stem; required over 30 items).
- Size: 40–65 items. Quality, not count; never pad to reach a number.

### The ladder (order of `ITEMS`)

Foundations (measurement, vocabulary, anatomy) → classification/norms →
analysis or workup → management → **cases**. Each rung must be answerable using only
earlier rungs. Reuse earlier facts in later stems, and in the cases.

### Item mix

- **MCQ (~75–80 %)**: for discrimination, interpretation, and application. The stem must
  be **answerable from memory** with the choices hidden: no "which of the following
  is true" without context.
- **Recall (~20 %)**: lists, definitions, norms, "name the four…". Put the answer as `\n`
  lines with `• ` bullets or short labelled lines. Always include `brief`, and a `detailed`
  when the answer needs mechanism. Recall items carry `section` too.
- **Keep numbers with their sources.** A norm question names the structure, not the number,
  in the stem.
- **Distractors** come from the neighbouring lists (the other maneuver's list, the other
  angle's norm), not from absurdities. A distractor may be a common source error
  (name it in the explanation).
- **Balance the answer letters.** Hand-written modules skew to b/c (`lip-reconstruction`
  b = 41 of 52). Shuffle options programmatically with a fixed cycle; skip items whose
  options are an ordered series (Type I–VI, ratios) or contain "none/all of the above".
  `tools/lint-oksat.mjs` warns above 40 % for one letter.

### Explanation voice

`brief` = the takeaway in 1–2 sentences. `detailed` = **mechanism → application → pearl**
(label the pearl "Pearl:"). Add **Discrepancy:** / **Caveat:** paragraphs where sources
disagree or a claim is only in one source. No exclamation marks, no gamification, no
congratulation. State the reason an option is wrong when a likely error exists.

### Synthesis cases (the last section)

Three or four cases of 2–4 questions each, `section: 'Synthesis Cases'`, concept
`case-<name>`. A case:

1. Opens with a short vignette that gives **raw measurements or findings**, not the
   diagnosis, so the learner must apply the module's norms.
2. Q1 interprets (which values are abnormal); Q2 integrates (what the pattern means
   and the plan, usually the non-obvious one); Q3–4 pick the maneuver or workup and its
   safeguard.
3. Continues with "(Same patient.)" so the cases read as sequences.
4. Cross-links sections (landmark → angle → plan), so a miss points back to a rung.

Include one case whose naive answer is wrong (the "big nose" that is a small chin).
Keep the arithmetic checkable: if a stem gives numbers, compute them before keying.

## 4. Write the file

Template: `js/mcq-modules/facial-analysis.js` is the current reference; `facial-reanimation.js`
is the benchmark for cases and `otoplasty.js` for mixed MCQ + recall with images.
Order inside the file: header comment (title, source, figure credits, discrepancy policy)
→ `meta` (with `id`, `sources`) → `DOMAINS` → `CONCEPTS` → items grouped by
`// ════════ DOMAIN ════════` dividers → one `window.__MCQ_MODULE = {...}` line.

Engine constraints that bite:

- **Plain text only.** `**bold**`, `#`, and backticks render literally. Use `\n` and `• `.
  The engine only turns `\n` into a line break.
- Template literals are convenient for multi-line text (no apostrophe escaping); never put
  `${` in them. Do not mix real and escaped Unicode, because it breaks search-and-replace;
  normalise one way.
- `id`s are permanent: `q1…qN` in final order; never renumber a studied module.
- Stems can say "(Same patient.)" but must not depend on a neighbour for the MCQ to be
  answerable at the recall gate; restate the key finding when the answer needs it.

## 5. Register

Append one entry to `js/oksat-manifest.js` (position: before the newest, grouping by
subspecialty is automatic): `slug`, `title`, `kicker`, `subspecialty`, `count` (=
`ITEMS.length`), `accent` (that subspecialty's hue from `OKSAT_SUBSPECIALTIES`), `desc`
(one line), `data`. Then `node tools/stamp-assets.mjs` (the manifest's own stamp changes in
`oksat.html` / `oksat-study.html`).

## 6. Verify (all of it, before saying "done")

```bash
node tools/lint-oksat.mjs <slug>     # quality spec: concepts, orphans, alt text, markdown, letter skew
node tools/check-data.mjs            # structural: count, ids, correct option
node tools/test-oksat-engine.mjs     # engine still passes
node tools/smoke-pages.mjs --page 'oksat-study.html?m=<slug>'   # boots, no console errors
```

Then **drive the real page** and look. A green lint proves structure, not that the
learner sees what you intended. Playwright is a devDependency (`npm install` first;
`node_modules` is gitignored); use `tools/smoke-lib.mjs` (`startServer()` → `.origin`,
`launchBrowser()`). Click **Begin**, then per item: MCQ `c` → `1` → `d` (opens "Read more");
recall `space` → `3` → `d`; `ArrowRight` next. (`h` is **home**, not "help", and a confidence
prompt follows each MCQ answer; `1/2/3` answer it.) Assert no image has
`naturalWidth === 0`, screenshot a recall item, an item with a stem image, and an item with
an explanation image, and read the screenshots.

Do not rely on a walk that never left the landing page. The first walk of
`facial-analysis` did, and reported "no broken images" for nothing.

## 7. Documentation pass (required, last)

Per `CLAUDE.md` and `docs/docs-map.md`: `README.md` (tree + counts-free description),
`WIP.md` (current state, not a diary), `CLAUDE.md` (OKSAT module list if it enumerates
modules), `docs/authoring-oksat.md` (add the lesson here if it is general),
`docs/verification.md` (new command). No item counts or sizes in prose that rots; point at
the source file.

## 8. Hand-off

State plainly, in this order:

1. What shipped (slug, item count, mix of recall/MCQ, cases) and what was verified.
2. **Source conflicts** and how each was resolved, and every claim that rests on a single
   or unvetted source.
3. **What could not be read** (empty PDFs, missing figures) and how it was cited instead.
4. **Figures rejected and why**, and the rights note for the ones used.
5. That nothing is clinically verified; the owner sets that.
6. Commit and push only as the session instructs; never open a PR unasked.
