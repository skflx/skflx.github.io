# IAC chapter briefs

One brief per chapter of [`../2026-11-23-iac-anatomy-guide.md`](../2026-11-23-iac-anatomy-guide.md). The
orchestrator pins every claim here; the executor (Gemini) turns a brief into
`js/oksat/guides/iac-anatomy/<chapter>.js` and the chapter's items in `js/oksat/modules/iac-anatomy.js`.
A brief wins over the spec's §5 outline wherever they differ.

## Rules for the writer (non-negotiable)

1. **No claim that is not in the brief.** Every sentence of teaching text restates a bullet under
   *Teach*, a *Call*, a *Deep* block or a *Check* answer. You may reorder, join and rephrase for plain
   English; you may not add a fact, a number, an eponym, a percentage or a direction. If a sentence
   needs a fact the brief lacks, leave it out. If the section reads wrong without it, write
   `BLOCKED: <section>: needs <fact>` in the PR and stop.
2. **Numbers verbatim** from the brief, with their source chip: `[[src|<key>]]`. Keys are the ledger
   keys (HCA3, K31, Gantz 1999, …; see the ledger's *Sources read* table and PMIDs).
3. **Conflicts** are `call k:'trap'`, `label: 'Source conflict'`, stating both sides as the brief does.
4. **Tiers** (spec D10): core text is for juniors; `deep` blocks carry the label the brief gives
   (`Go deeper · Senior` or `Go deeper · Chief`).
5. **Checks**: each section gets the 2–3 `check` prompts given, wording adjustable, answers not.
6. **Practice / drill / ref**: use exactly the item ids, concept keys and note paths given. Before using
   a practice item, read it; if its answer contradicts this brief, drop it and note that in the PR.
7. **New module items** ("Items"): one item per target. Write the stem, four options (one correct, three
   plausible distractors drawn from the same section's facts), `brief` (one line) and `detailed`
   (2–4 sentences, restating only brief facts). Item ids `q1…` in chapter order, never renumbered;
   `concepts: [<section id>]`. Follow `.claude/skills/oksat-module/SKILL.md` for shape and
   `node tools/lint-oksat.mjs iac-anatomy` must be clean. A target marked `recall` is free-response.
8. **Plain text** in items (`\n` and `• ` only). Guide text may use the inline markup in
   `docs/authoring-oksat-guide.md`. Specialty abbreviations go in `js/oksat/terms.js` (check-data names
   any it does not know).
9. **Figures**: use the files and block types the brief names (geometry: `../iac-figures/`). Captions say
   "Schematic" for drawn figures; vendored images carry their credit line.

Legend in briefs: `[G3]` = ledger row; `→` = answer.
