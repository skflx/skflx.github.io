---
name: quiz-prep
description: Build the study unit for one RR quiz session on skflx.github.io (one OKSAT guide + one companion module, linked to sk.oto), from the owner's sources, with Opus orchestrating and Gemini Hydrogen executing. Use when the owner starts a quiz topic, drops sources for a quiz, or says "quiz prep", "next quiz", or names a quiz faculty and topic.
---

# Quiz prep

Spec and decisions: `plans/2026-11-25-quiz-prep-pipeline.md`. Schema and verification come from the two
OKSAT skills; this file is only the order of work and the split between models.

**The unit:** one guide (`/oksat-guide`) and one companion module (`/oksat-module`), one module concept per
guide section. Every section ends with 2 to 3 `check` prompts, a `practice` block of 1 to 3 module items
(the Qs inside the lesson), and its `drill` row (the same Qs on their own). Section `ref` rows name sk.oto
notes from `tools/skoto-notes.json`. Size: 3 to 5 content chapters, 15 to 25 sections, 40 to 70 items;
a bigger topic expands only after the owner says so.

**Roles:** orchestrator Claude Opus; executor Gemini Hydrogen at medium effort (`gemini-4-hydrogen-medium`),
sent by the orchestrator through the `/agy` skill; reviewer one frontier model from the *other* family.
Hydrogen may escalate (see "Escalation"). The owner merges and vets medicine. Swap any of these when the
owner says so; keep the process light.

## Order of work

| # | Step | Who | Output |
|---|---|---|---|
| 1 | Intake | owner | sources in the thread |
| 2 | Source map | orchestrator | every source read (or named unreadable), ranked; posted in the thread |
| 3 | Grill | orchestrator, `/grill-me` | one round: chapters, likely test points, the topic's contrast axis, skips, any special-case SVG, size |
| 4 | Brief | orchestrator | `plans/quiz/<YYYY-MM-DD>-<slug>.md` from `plans/quiz/TEMPLATE.md`; one GitHub issue with steps A and B as its task list |
| 5 | Step A | Hydrogen | start chapter + first half of the chapters and their items; one PR |
| 6 | Spot-check A | orchestrator | diff against the brief; fixes pushed or written into the brief before B |
| 7 | Step B | Hydrogen | remaining chapters, synthesis cases, manifest, terms, docs; one PR |
| 8 | Review | other-family reviewer | `docs/delegation.md` §7 review of A+B against the brief; orchestrator adjudicates |
| 9 | Ship | owner | merge with `draft: true`; vetting continues live |

Record the wall-clock time of steps 2, 4, 5, 7 and 8 in the issue; the owner uses it to tune the split.

## The orchestrator's rules

- **Rank sources for keying:** the faculty's own material > board-review text > the RR deck > vault notes.
  Anything none states is checked on PubMed or the web and recorded, or labelled "added".
- **All judgment goes in the brief.** Hydrogen writes prose and items only from it: every claim with its
  source tag, every question's stem idea, keyed answer and distractor source, every conflict and how it is
  keyed. A fact missing from the brief is a `BLOCKED:` from Hydrogen, not a guess.
- **Reuse before writing.** Read the modules that already cover the topic (`grep` concepts in
  `js/oksat/modules/`); an existing item goes in a `practice` ref, not a duplicate.
- **Figures:** textbook figures first, credited and unmodified (`/oksat-module` §2). A bespoke SVG only when
  the owner OKs it in the grill, and only from a geometry spec in the brief.
- **Synthesis cases are required:** 3 to 4 `case-*` sequences, one whose naive answer is wrong.
- **Skip what the pipeline drops:** no separate ledger, handoff or chapter briefs, no sub-issues, no
  appraisal chapter unless the faculty assigned papers.

## Sending executor work (orchestrator, via `/agy`)

Run each executor step with `/agy` from the repo root, `--model gemini-4-hydrogen-medium --mode auto`
(the step runs the verify commands). Prompt:

```
Run step <A|B> of issue #<n>: follow .claude/skills/quiz-prep/SKILL.md "Executor protocol" exactly,
with the brief plans/quiz/<file>.md. Do one step, then stop and report.
```

`/agy` forbids the executor from touching git, so protocol steps 1, 3 and 6 (fetch, branch, commit, push,
PR, tick) are the orchestrator's: branch before the send, then review the diff and open the PR after it.

**Escalation.** If a task is too hard for Hydrogen (a conflict it cannot key, an item it cannot write
from the brief), it stops with `TOO HARD: <what> — want advisor input`, not a guess. The orchestrator
then either answers in the brief or sends that one question to Neon (`gemini-4-neon-high`, or another
frontier model on AGY) in `plan` mode, writes the answer into the brief, and resumes Hydrogen on the
same `--conversation`.

**Budget.** After every AGY send, report in the thread: the run's tokens (`usage.total_tokens`) and the
running AGY total for the current 5-hour window and week, plus Claude's 5-hour and weekly percent used
(`get_usage`). The AGY CLI does not expose its own remaining quota; if it fails on a limit, say so and
pause. Warn the owner as soon as either side passes about 70% of a window, before starting the next step.

## Executor protocol

1. `git fetch origin && git checkout master && git pull`. Read `AGENTS.md`, `docs/delegation.md` §3, the
   brief, and only the spec sections the brief names (`docs/authoring-oksat-guide.md`,
   `docs/authoring-oksat.md`).
2. If step A's PR is open and unmerged when running B, stop and report "Waiting on merge of #<n>".
3. Branch `gemini/<slug>-<a|b>`. Touch only the brief's Touch list for this step.
4. Write exactly what the brief states. No claim, number, eponym, direction or answer key the brief does
   not give.
5. Verify: `node tools/stamp-assets.mjs`, then `check-data`, `lint-oksat <slug>`, `lint-oksat-guide <slug>`,
   `test-oksat-learn`, `test-oksat-engine`, `smoke-pages`. Fix until green; never weaken a test.
6. (Orchestrator, when sent via `/agy`.) Commit one short line, push, open a PR to `master` with `Closes #<n>` only on step B, and the tail of each
   command. Tick the step in the issue. Never merge.
7. Stop with `BLOCKED: <why>` in the PR when the brief lacks a fact, a practice ref contradicts the brief, a
   change outside Touch is needed, or the diff passes about 800 lines (open the PR with what is done).

## Hand-off (orchestrator, after review)

What shipped and its size; the times recorded; source conflicts and single-source claims; what could not be
read; figures used and their rights; that nothing is clinically verified.
