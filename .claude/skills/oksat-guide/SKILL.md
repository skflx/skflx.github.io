---
name: oksat-guide
description: Build or extend an OKSAT Interactive learning guide on skflx.github.io (js/oksat/guides/<slug>/<chapter>.js + manifest entry), the first-pass study guide with retrieval prompts that drills into the question modules. Use when asked for an interactive module, study guide, first-pass guide, or "teach me X" content for OKSAT, or to turn a study guide or artifact into OKSAT.
---

# OKSAT interactive guide

The owner's two-tier model: a **guide** for first-pass learning with active
recall inside it, then the **question modules** (`/oksat-module`) for locked
first attempts and spaced repetition. Every guide is built together with its
questions; a guide with nothing to drill into is unfinished.

Spec: `docs/authoring-oksat-guide.md` (schema, blocks, markup, checkers, refs).
Read it once, then work here. Shipped example: `ar-crs-aerd`.

## 0. Work with the owner, not at them

The owner wants the build to be interactive and asks to be questioned. Ask
before building when a choice changes the amount of work or the product, and
offer a recommended default so the answer is one click. Typical forks:

- scope of the guide (chapters) and which sources it stands on;
- questions with no home module: build a new module, or interleave into
  existing ones;
- which questions move into modules (default: board-style MCQs only; the
  guide's own retrieval prompts stay in the guide);
- anything that is a clinical call (the owner verifies medicine).

Do not ask for what the sources, `docs/decisions.md` or this file already
settle. When you teach inside the guide, teach as you would in a room:
predict first, then explain, then check.

## 1. Order of work

1. **Pin down** topic, sources (Drive PDFs, vault notes, an existing artifact),
   subspecialty (must exist in `OKSAT_SUBSPECIALTIES`), and chapter list.
2. **Sources** follow `/oksat-module` §1: rank them, number from the highest,
   reconcile disagreements openly (a `trap` labelled "Source conflict"),
   verify anything the sources do not state on PubMed or the web before it is
   written, and record what you could not read.
3. **Outline** chapters of 3 to 10 sections, 15 to 50 minutes each, ordered as
   a ladder (foundations, entity, work-up, management, appraisal). Each
   chapter opens with a `tldr` of 3 to 6 bullets.
4. **Write sections** one idea each: teaching blocks, then 2 to 3 `check`
   prompts, then (where questions exist) a `practice` block and a `drill` row.
   Put anything beyond first pass in `deep`. Use a `tool` only for a criteria
   set the learner applies with a threshold.
5. **Questions.** Before inlining anything, read the target modules' items and
   concepts. Add only what is new: a vignette that applies a section, or a
   fact no item covers. A duplicate of an existing item is skipped, not
   re-added. New items in a studied module take new ids, appended in the
   section they belong to (never renumber, reorder options or change
   `correct`). If there is no module for the topic, build one with
   `/oksat-module` and register it. Concept keys are what the drill rows link
   to, so choose them with that in mind.
6. **Terms**: run `node tools/check-data.mjs`; for each acronym it names, add
   the full name to `js/oksat/terms.js` (or, rarely, to `PLAIN`, per the
   spec's Terms rules). Never write a prompt that asks what an abbreviation
   stands for.
7. **Wire**: `drill` rows (module and concept keys that exist and have items)
   and `practice` refs (real item ids). `check-data` fails any that do not
   resolve.
8. **Register** the guide in `OKSAT_GUIDES` (`js/oksat/manifest.js`), then
   `node tools/stamp-assets.mjs`.
9. **Verify** (all of it):
   ```bash
   node tools/check-data.mjs
   node tools/lint-oksat.mjs                # every module, including any you touched
   node tools/test-oksat-learn.mjs
   node tools/test-oksat-engine.mjs
   node tools/smoke-pages.mjs
   ```
   Then open the chapters and read them in both themes and at phone width
   (`tools/smoke-lib.mjs` gives a server and browser; screenshots are the
   only proof the page teaches rather than merely loads).
10. **Docs pass** per `docs/docs-map.md`: `README.md`, `docs/wip.md`, `AGENTS.md`,
   `docs/verification.md`, and the owning spec. No counts that rot.

## 2. Converting an existing study guide

If the content already exists as HTML or a document (an artifact, a PDF
summary), convert it structurally rather than retyping: parse it into
blocks, keep its wording, and then review the output as a reader. Map its
custom widgets onto blocks (comparison panels to `cards`, ladders to `steps`,
checkers to `tool`); do not add a block type for one chapter. Re-draw nothing
that already exists as a figure in `images/oksat/`. Keep its source conflicts and
currency warnings. Strip its decorative color: callouts carry the only color.

## 3. Hand-off

State in this order: what shipped (guide, chapters, sections, modules added or
extended and how many items), what was verified and how, source conflicts and
claims that rest on one source, what could not be read, what was deduplicated
and why, figures reused or drawn, and that nothing is clinically verified (the
owner sets that). Commit and push only as the session instructs; never open a
PR unasked.
