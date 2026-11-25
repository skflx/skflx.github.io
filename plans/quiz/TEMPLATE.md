# Quiz brief: <topic> (<faculty>, quiz <date>)

One file per quiz, written by the orchestrator, read by the executor (`.claude/skills/quiz-prep/SKILL.md`).
Everything the executor writes comes from here. Issue: #<n>.

## 1. Identity

- Guide slug and module slug: `<slug>` (permanent). Subspecialty: `<key of OKSAT_SUBSPECIALTIES>`.
- Contrast axis, if any (e.g. child vs adult): where it appears (a table per chapter, paired cases).
- Existing items to reuse by `practice` ref: `<module>:<id>`, …

## 2. Sources (ranked)

| Tag | Source | Rank | Covers | Readable |
|---|---|---|---|---|
| S1 | faculty slides … | 1 | … | yes |

Conflicts: `S1 vs S2: <claim>; keyed to S1; shown as a "Source conflict" trap in §<n>.<m>`.

## 3. Steps and Touch

- **A:** `js/oksat/guides/<slug>/start.js`, chapters …; `js/oksat/modules/<slug>.js` (items for those
  chapters); `js/oksat/manifest.js`; `js/oksat/terms.js`; `images/oksat/<slug>/`; `*.html` stamps.
- **B:** the remaining chapters, the rest of the module (including cases); `README.md`, `docs/wip.md`.

## 4. Chapters

### <k>. <chapter title>  (step A|B, ~<min> min, `src`: S1, S2)

TL;DR: 3 to 6 bullets.

#### <k>.<m> <section title>  (concept `<key>`, `ref`: `<Folder>/<Note title>`)

- Claims, each with its tag: `<claim> [S1 p. 12]`.
- Blocks: table / cards / call (`pearl`, `trap`, `mech`, `hook`) / figure (file, credit, alt text).
- Checks: `Q → A` (2 to 3).
- Items (module, in order): `MCQ | recall`; stem idea; keyed answer; distractors and where they come from;
  the pearl; any Discrepancy/Caveat. `practice` takes items <ids>.

## 5. Synthesis cases (step B)

`case-<name>`: vignette with raw findings; Q1 interpret, Q2 integrate, Q3 choose; which one has the naive
wrong answer.

## 6. Figures

Per figure: file and source, or (owner-approved special case) the SVG geometry spec.
