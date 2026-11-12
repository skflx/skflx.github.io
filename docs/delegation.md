# Delegation: how work is split between models and the owner

Task lists are GitHub Issues: one parent issue per plan, one sub-issue per work package (WP), against
a spec in `plans/`. Rules every model follows are in `AGENTS.md`. The owner sets the roster for each
wave (`AGENTS.md`, Models & roles).

The roles (owner, orchestrator, executor, adversarial reviewer) and what each never does are in `AGENTS.md`, Models & roles.

## 1. What makes a WP delegable

A WP goes to the executor only when all of these hold:

1. **Its anatomy is already data.** Where a vessel runs, a diorama's proportions, which wall a flap
   is cut from: the orchestrator writes these into a data file or the WP spec first. The executor
   builds the machinery that consumes them.
2. **Its acceptance is a command.** A test in `tools/test-*.mjs` (existing, or specified precisely
   enough to write), `check-data.mjs`, or a number the pipeline prints. "Looks right" is a
   checkpoint item, not an acceptance criterion.
3. **It needs no open owner decision** (`docs/ssb.md` §12, `plans/2026-10-07-ssb-roadmap.md` §1).
4. **Its read list fits.** The WP names the sections to read, not whole documents.

If one fails, the WP is the orchestrator's, or it is split: the orchestrator does the judgment half,
the executor the mechanical half.

## 2. The WP format (an issue body)

```
### <ID> — <title>                          [status] · <model> · depends: <IDs>
Goal:       one sentence.
Read:       files/sections, nothing else unless stuck.
Touch:      files it may create or change.
Don't:      files it must not touch, rules it must not bend.
Steps:      numbered, concrete.
Accept:     commands that must pass + what they must show.
Escalate:   the conditions under which it stops and reports instead.
```

Status values: `todo`, `ready` (deps met), `in progress`, `review` (PR open, waiting on a
checkpoint), `done`, `blocked: <reason>`.

## 3. Executor protocol

1. Read `AGENTS.md`, then only the WP's **Read** list.
2. Branch `claude/<wp-id>-<slug>` from current `master`.
3. Do the **Steps**. Stay inside **Touch**. If the work needs a file outside it, or a judgment the WP
   did not make, stop and write `BLOCKED: <why>` under the WP (step 6).
4. Run every **Accept** command plus the standard set (`docs/verification.md`):
   `node tools/stamp-assets.mjs` if `css/` or `js/` changed, `node tools/check-data.mjs`, and the
   browser suite of the subsystem touched. Paste the tail of each output into the PR body.
5. Docs pass (`AGENTS.md`, Documentation second pass) for what changed. Set the WP's status to
   `review` in the issue, or report it in the PR if GitHub is unreachable, with a one-line result.
6. Open a PR (never merge) when the WP is done. If stopped early, write `BLOCKED: <why>` under the WP,
   naming the **Escalate** condition that fired and the options; open a PR only if there is work to review.

Hard stops, whatever the WP says: a test would have to be skipped or weakened to pass; an anatomical
position, proportion or medical claim is needed and not in data; a hard rule in `AGENTS.md` would bend
(CSP, no inline script, no new dependency, ids never renamed, `verified` is the owner's); the diff
passes about 800 changed lines outside generated files (split the WP instead).

## 4. Checkpoint protocol (orchestrator)

A checkpoint (CP) in the plan names the WPs it reviews. The orchestrator:

1. Reads each PR's diff and test output, not the whole codebase.
2. Checks it against the WP's **Accept** and the CP's own list (anatomy on screen, numbers against
   sources, spec drift, scope creep).
3. Per PR: approve for the owner to merge, push small fixes itself, or write a corrective WP.
4. Updates the plan and its issues: statuses, what the next wave unlocks, anything the owner must decide.

## 5. Prompts for the owner

Start each in a **new** session.

Executor (pick the wave's executor model):

```
Execute issue #<n> (spec: plans/<spec>.md), following
docs/delegation.md §3. Open or update the PR with `Closes #<n>`
when its Acceptance commands pass; do not merge.
```

Checkpoint (pick the orchestrator model):

```
Run checkpoint <CP-ID> of plans/<spec>.md, following
docs/delegation.md §4. PRs: <links>.
```

Planning (orchestrator, when a wave is done or a decision lands):

```
Re-plan from plans/<spec>.md: fold in <decision/finding>,
write the next wave's WPs, keep the issues current.
```

Several `ready` WPs with no shared **Touch** files can run in parallel sessions.

## 6. Running lanes in parallel

Context is re-sent every turn, so keep sessions short:

- **Lanes are separate executor sessions launched by the owner**, not orchestrator subagents. The
  orchestrator does not sit in the loop while a WP is built.
- **One fresh session per WP** (or `/clear` between WPs in a lane). The WP's Read list is the context;
  the plan and its issues carry the rest.
- **The orchestrator runs once per batch**, as a checkpoint (§4). Several PRs per checkpoint is
  cheaper than one per PR.
- **Escalating is cheap; guessing is expensive.** A WP that stops at its Escalate line costs a
  paragraph; one that guesses an anatomy call costs a corrective WP.
- **Merge soon after a checkpoint**, so lanes branch from a current `master`. Conflicts in `?v=`
  stamps are resolved by taking either side, then `node tools/stamp-assets.mjs` and
  `node tools/check-data.mjs`; never hand-pick hashes. Merges, stamp conflicts and docs passes are
  mechanical: an executor session at low effort is enough.

## 7. Adversarial review

After each wave, the named reviewer reads the wave's diff, its spec, and the spec's reviewer checklist.
The reviewer posts a PR review with one finding per comment: severity `block`, `fix` or `nit`,
`file:line`, a concrete failure scenario, and whether it was reproduced. The owner may name two
reviewers for a wave. Reviewers do not rerun test suites; they read the diff and the output the WP reported.

When the reviewer is not the orchestrator, the orchestrator adjudicates: real findings become new
`type:wp` sub-issues, dismissed ones get a one-line reason on their thread, and the wave's review issue
closes when no `block` finding is open, which unlocks the next wave.

A WP runs only the suites whose inputs it changed; the full suite runs once before the owner merges
(`docs/verification.md`).

## 8. Owner-review items

Every work package or review item that needs human verification adds or updates its entry in `js/review-items.js` (the list `review.html` renders), with a deep link and one "look" sentence, as part of its acceptance. `node tools/check-data.mjs` fails on a malformed entry or a dead link.
