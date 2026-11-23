# Handoff — IAC guide: the serial queue (Gemini executes)

> Companion to [`2026-11-23-iac-anatomy-guide.md`](2026-11-23-iac-anatomy-guide.md). Roster from
> 2026-11-23 (owner): **Opus plans and orchestrates; Gemini executes every work package**, content
> included, strictly from the pinned [briefs](iac-briefs/README.md), [ledger](2026-11-23-iac-anatomy-ledger.md)
> and [figure specs](iac-figures/README.md). **Sonnet** reviews each wave; Opus adjudicates; the owner
> merges and vets medicine. Status lives in the issues; this file is the order and the rules.

## The one prompt

The owner starts every step with the same prompt, in a fresh Gemini session:

```
Run the next step of the IAC queue: follow plans/2026-11-23-iac-anatomy-handoff.md,
"How to run a step", exactly. Do one step, open its PR, then stop and report.
```

## How to run a step

1. `git fetch origin && git checkout master && git pull`. Read `AGENTS.md`, this file and
   `docs/delegation.md` §3.
2. **Find the step:** the first row of the queue below whose issue is **open**.
   - If its **Gate** is `review` or `owner`, stop and report "Waiting on <issue>: <who>". Do nothing else.
   - If the previous row's issue is still open, or its PR is open and not merged, stop and report
     "Waiting on merge of #<n>". Never stack a step on an unmerged one.
3. **Read** the issue body (its Read list), then the brief, ledger rows and figure specs it names.
   Read nothing else unless a command fails.
4. **Branch** `gemini/<step id>-<slug>` from `master`. **Touch** only the issue's Touch list.
5. **Do** the issue's Steps. For content steps, the brief's rules
   ([`iac-briefs/README.md`](iac-briefs/README.md)) are absolute: no claim, number, eponym or direction that
   the brief does not give.
6. **Verify:** `node tools/stamp-assets.mjs`, then every command in the issue's Acceptance list (content
   and figure steps: the whole spec §9 set). Fix until green. Never skip, weaken or delete a test.
7. **Docs pass** for what changed (`AGENTS.md`, Documentation second pass).
8. **Commit** (one short line, no trailers), **push** the branch, **open a PR** to `master` titled
   `[<step id>] <issue title>`, body: what changed, `Closes #<n>`, the tail of each Acceptance command.
   **Never merge, never push to `master`, never edit `AGENTS.md`, the pointer files or another plan.**
9. **Tick** the issue's Steps task list. **Stop** and report: the PR link and anything you dropped or
   blocked.

**Stop and write `BLOCKED: <why>`** in the PR (or on the issue if there is no PR) when: the brief lacks a fact
the text needs; a practice item contradicts a brief; a figure spec lacks a coordinate or label; a test
would have to be weakened; a change outside Touch is needed; the diff passes ~800 lines outside generated
files (split it: open the PR with what is done and list the rest).

## The queue

One row = one issue = one PR, in this order. **Gate**: `—` Gemini runs it; `review` Sonnet reviews the
wave's merged PRs and Opus adjudicates (owner runs both); `owner` the owner decides.

| # | Step | Issue | Gate | Needs before it |
|---|---|---|---|---|
| 1 | I1.4 Backfill `ref` rows into `ear-anatomy`, `ar-crs-aerd` | #334 | — | — |
| 2 | I1.3 Vendor Stanford figures + UW IAC slices | #333 | — | 1 merged |
| 3 | I2.S SVGs F1, F2, F3, F4, F8 | #344 | — | 2 merged |
| 4 | I2.1 `start` + register guide | #335 | — | 3 merged |
| 5 | I2.2 `osteology` | #336 | — | 4 merged |
| 6 | I2.3 `fundus` | #337 | — | 5 merged |
| 7 | I2.4 `neurovascular` | #338 | — | 6 merged |
| 8 | I2.W Wave 2 wiring and docs | #347 | — | 7 merged |
| 9 | R1 Review wave 2 | #350 | review | 8 merged |
| 10 | I3.S SVGs F5, F6, F7 + UW CT frames | #345 | — | R1 closed |
| 11 | I3.1 `imaging` | #339 | — | 10 merged |
| 12 | I3.2 `approaches` | #340 | — | 11 merged |
| 13 | I3.W Wave 3 wiring and docs | #348 | — | 12 merged |
| 14 | R2 Review wave 3 | #351 | review | 13 merged |
| 15 | I4.S SVG F9 | #346 | — | R2 closed |
| 16 | I4.1 `clinical-correlations` | #341 | — | 15 merged |
| 17 | I4.2 `synthesis` | #342 | — | 16 merged |
| 18 | I4.3 `appraisal` | #343 | — | 17 merged |
| 19 | I4.W Wave 4 wiring and final docs | #349 | — | 18 merged |
| 20 | R3 Review wave 4 | #352 | review | 19 merged |
| 21 | I5 Listing and `verified` | #353 | owner | R3 closed |

Corrective work packages that a review opens go **immediately after** that review's row (the orchestrator
inserts them here by PR, before the next wave starts).

## What each content step produces

- `js/oksat/guides/iac-anatomy/<chapter>.js` ending `window.__OKSAT_CHAPTER = {...}` (shape: any
  `ear-anatomy` chapter), sections exactly as the brief lists them (ids, order), `ref` rows as given.
- The chapter's items appended to `js/oksat/modules/iac-anatomy.js` (`window.__MCQ_MODULE = { meta,
  DOMAINS, CONCEPTS, ITEMS }`); one concept per section that has items, key = section id.
- Step 4 (`start`) writes `start.js` and adds only the `OKSAT_GUIDES` entry (spec §4.1, `draft: true`).
  Step 5 (`osteology`) creates the module file (meta and DOMAINS as spec §4.2) and its `OKSAT_MANIFEST`
  entry. Every later step appends a chapter row, its domain and concepts, and updates the module `count`.
- New acronyms in `js/oksat/terms.js`, each added by the chapter that first uses it (check-data fails an unused one); owner review entries in `js/review-items.js` (one per chapter and
  per figure, with a deep link).
