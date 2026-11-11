---
name: oksat-guide
description: Build or extend an OKSAT Interactive learning guide on skflx.github.io (js/oksat/guides/<slug>/<chapter>.js + manifest entry), the first-pass study guide with retrieval prompts that drills into the question modules. Use when asked for an interactive module, study guide, first-pass guide, or "teach me X" content for OKSAT, or to turn a study guide or artifact into OKSAT.
---

# OKSAT interactive guide

Two tiers: a **guide** for first-pass learning with active recall inside it, then the **question
modules** (`/oksat-module`) for locked first attempts and spaced repetition. A guide is built together
with its questions; a guide with nothing to drill into is unfinished.

Spec: `docs/authoring-oksat-guide.md` (schema, blocks, markup, checkers, refs). Read it once, then
work here. Shipped example: `ar-crs-aerd`.

## 0. Work with the owner

The owner wants to be questioned. Ask before building when a choice changes the amount of work or the
product, and offer a recommended default so the answer is one click. Typical forks:

- scope (chapters) and the sources it stands on;
- questions with no home module: a new module, or interleaved into existing ones;
- which questions move into modules (default: board-style MCQs only; the guide's retrieval prompts
  stay in the guide);
- any clinical call (the owner verifies medicine).

Do not ask what the sources, `docs/decisions.md` or this file already settle. Teach as you would in a
room: predict first, then explain, then check.

## 1. Order of work

1. **Pin down** topic, sources (Drive PDFs, vault notes, an existing artifact), subspecialty (a key of
   `OKSAT_SUBSPECIALTIES`), and chapter list.
2. **Sources** follow `/oksat-module` §1: rank them, reconcile disagreements openly (a `trap` labelled
   "Source conflict"), verify on PubMed or the web anything the sources do not state, and record what
   you could not read.
3. **Outline** chapters of 3 to 10 sections, 15 to 50 minutes each, as a ladder (foundations, entity,
   work-up, management, appraisal). Each chapter opens with a `tldr` of 3 to 6 bullets.
4. **Write sections**, one idea each: teaching blocks, then 2 to 3 `check` prompts, then (where
   questions exist) a `practice` block and a `drill` row. Anything beyond first pass goes in `deep`.
   Use a `tool` only for a criteria set the learner applies with a threshold.
5. **Questions.** Read the target modules' items and concepts before inlining anything. Add only what
   is new: a vignette that applies a section, or a fact no item covers. A duplicate is skipped. New
   items in a studied module take new ids, appended in their section (never renumber, reorder options
   or change `correct`). No module for the topic: build one with `/oksat-module`. Choose concept keys
   with the drill rows in mind.
6. **Terms.** Run `node tools/check-data.mjs`; for each acronym it names, add the full name to
   `js/oksat/terms.js` (or, rarely, `PLAIN`, per the spec's Terms rules). Never write a prompt that
   asks what an abbreviation stands for.
7. **Wire** `drill` rows and `practice` refs to keys and ids that exist. `check-data` fails any that do not.
8. **Register** the guide in `OKSAT_GUIDES` (`js/oksat/manifest.js`), with `draft: true`, then
   `node tools/stamp-assets.mjs`.
9. **Verify**, all of it:
   ```bash
   node tools/check-data.mjs
   node tools/lint-oksat.mjs                # every module, including any you touched
   node tools/test-oksat-learn.mjs
   node tools/test-oksat-engine.mjs
   node tools/smoke-pages.mjs
   ```
   Then read the chapters in both themes and at phone width (`tools/smoke-lib.mjs`; screenshots are the
   only proof the page teaches rather than merely loads).
10. **Docs pass** per `AGENTS.md` (Documentation second pass): `README.md`, `docs/wip.md`, the owning
    spec. No counts that rot.

## 2. Converting an existing study guide

Convert structurally rather than retyping: parse the content into blocks, keep its wording, then review
the output as a reader. Map custom widgets onto blocks (comparison panels to `cards`, ladders to `steps`,
checkers to `tool`); do not add a block type for one chapter. Re-draw nothing that already exists in
`images/oksat/`. Keep its source conflicts and currency warnings. Strip its decorative colour: callouts
carry the only colour.

## 3. Hand-off

In this order: what shipped (guide, chapters, sections, modules added or extended, item counts); what was
verified and how; source conflicts and claims resting on one source; what could not be read; what was
deduplicated and why; figures reused or drawn; and that nothing is clinically verified (the owner sets
that). Commit and push only as the session instructs; never open a PR unasked.
