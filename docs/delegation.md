# Delegation — how work is split between models and the owner

The repo is worked by the owner and several models. This file says who does
what, how a task is handed over, and how it comes back. Task lists that use
it: `docs/ssb-roadmap.md` (SSB) and, for everything else, GitHub Issues (one
parent issue per plan, one sub-issue per WP) against a spec in `plans/`. Rules every model follows are in
`AGENTS.md`.

| Party | Does | Never does |
|---|---|---|
| **Owner** (human orchestrator) | Decides (`docs/decisions.md` §7), vets medical content (`review: verified`), merges to `master` (deploy), launches sessions with the prompts below | — |
| **Opus** (orchestrator) | Plans and specs; anatomy and medical data; checkpoints (reviews a batch of delegated work against its acceptance); adjudicates reviews; keeps the roadmap honest | Routine wiring it could spec instead |
| **Haiku** (executor; any other model the owner assigns to this role) | Executes a work package (WP) to its acceptance, inside its Touch list: code, tests, UI wiring, pipeline plumbing, docs passes | Anatomy or clinical judgment, owner decisions, files outside Touch, changing a plan's contracts, merging |
| **Adversarial reviewer** (Opus by default; the owner names another per wave: self, Argon, Sonnet) | Review each wave's diff against its spec, as PR reviews; Opus adjudicates when it is not the reviewer | Pushing fixes, merging |

Why the split: a spec plus an acceptance test costs Opus far fewer tokens
than the implementation, and this repo's test suites (`docs/verification.md`)
make "done" checkable by a model that did not design the work. The
expensive model reads a diff at a checkpoint instead of writing it.

## 1. What makes a WP delegable

A WP may go to the executor only when all of these hold:

1. **Its anatomy is already data.** Where a vessel runs, a diorama's
   proportions, which wall a flap is cut from — Opus writes these into a
   data file or the WP spec first. The executor builds machinery that consumes
   them.
2. **Its acceptance is a command.** A test in `tools/test-*.mjs` (existing,
   or specified in the WP precisely enough to write), `check-data.mjs`, a
   number the pipeline prints. "Looks right" is a checkpoint item, not an
   acceptance criterion.
3. **It needs no owner decision** that is still open (`docs/ssb.md` §13,
   `docs/ssb-roadmap.md` §2).
4. **Its read list fits.** The WP names the sections to read (e.g.
   `docs/ssb.md` §5.5, §7.4), not whole documents.

If one fails, the WP is Opus's, or it is split: Opus does the judgment
half, the executor the mechanical half.

## 2. The WP format (an issue body; SSB WPs still in `docs/ssb-roadmap.md`)

```
### <ID> — <title>                          [status] · Haiku|Opus · depends: <IDs>
Goal:       one sentence.
Read:       files/sections, nothing else unless stuck.
Touch:      files it may create or change.
Don't:      files it must not touch, rules it must not bend.
Steps:      numbered, concrete.
Accept:     commands that must pass + what they must show.
Escalate:   the conditions under which it stops and reports instead.
```

Status values: `todo`, `ready` (deps met, can start), `in progress`,
`review` (PR open, waiting on a checkpoint), `done`, `blocked: <reason>`.

## 3. Executor protocol (Haiku)

1. Read `AGENTS.md` (auto-loaded), then only the WP's **Read** list.
2. Branch `claude/<wp-id>-<slug>` from current `master`.
3. Do the **Steps**. Stay inside **Touch**. If the work needs a file outside
   it, or a judgment the WP did not make, stop and write `BLOCKED: <why>`
   under the WP (step 6).
4. Run every **Accept** command plus the standard set
   (`docs/verification.md`): `node tools/stamp-assets.mjs` if `css/`/`js/`
   changed, `node tools/check-data.mjs`, and the browser suite of the
   subsystem touched. Paste the tail of each output into the PR body.
5. Docs pass (`AGENTS.md` Documentation second pass) for what changed, and set the
   WP's status to `review` in `docs/ssb-roadmap.md` in the same PR, with a
   one-line result.
6. Open a PR (never merge) when the WP is done. If stopped early, write
   `BLOCKED: <why>` under the WP, naming the **Escalate** condition that fired
   and the options; open a PR only if there is work to review.

Hard stops, whatever the WP says: a test would have to be skipped or
weakened to pass; an anatomical position, proportion or medical claim is
needed and not in data; a hard rule in `AGENTS.md` would bend (CSP, no
inline script, no new dependency, ids never renamed, `verified` is the
owner's); the diff passes ~800 changed lines outside generated files (split
the WP instead).

## 4. Checkpoint protocol (Opus)

A checkpoint (CP) in the roadmap names the WPs it reviews. Opus:

1. Reads each PR's diff and test output — not the whole codebase.
2. Checks it against the WP's **Accept** and the CP's own list (anatomy on
   screen, numbers against sources, spec drift, scope creep).
3. Per PR: approve for the owner to merge, push small fixes itself, or
   write a corrective WP.
4. Updates the roadmap: statuses, what the next wave unlocks, anything the
   owner must now decide.

## 5. Prompts for the owner

Start each in a **new** session (fresh context is cheaper than a long one).

Executor — pick Haiku as the session model, then:

```
Execute issue #<n> (spec: plans/<spec>.md), following
docs/delegation.md §3. Open or update the PR with `Closes #<n>`
when its Acceptance commands pass; do not merge.
```

Checkpoint — pick Opus, then:

```
Run checkpoint <CP-ID> in docs/ssb-roadmap.md, following
docs/delegation.md §4. PRs: <links>.
```

Planning — Opus, when a wave is done or a decision lands:

```
Re-plan from docs/ssb-roadmap.md: fold in <decision/finding>,
write the next wave's WPs, keep the status board current.
```

Several `ready` WPs with no shared **Touch** files can run in parallel
sessions.

## 6. Running lanes in parallel, cheaply

What costs tokens is context, re-sent every turn: a long session pays
for its whole history on each call, and an orchestrator that spawns
subagents pays twice (each subagent re-reads the repo cold, then its report
lands in the orchestrator's context). So:

- **Lanes are separate executor sessions launched by the owner**, not Opus
  subagents. Opus never sits in the loop while a WP is being built.
- **One fresh session per WP** (or `/clear` between WPs in a lane): the
  WP's Read list is the context; a lane's history is not needed, the
  roadmap carries it.
- **Opus runs once per batch**, in a fresh session, as a checkpoint:
  diffs, test output and the WP's Accept, not the codebase (§4). Several
  PRs per checkpoint is cheaper than one checkpoint per PR.
- **Escalating is cheap, guessing is expensive.** A WP that stops at its
  Escalate line costs a paragraph at the checkpoint; one that guesses an
  anatomy call costs a corrective WP.
- **Merge soon after a checkpoint**, so lanes branch from a current
  `master`. Conflicts in `?v=` stamps (`ssb.html`, `js/ssb/main.js`, the
  module imports, `js/ssb/stamps.js`) are resolved by taking either side,
  then `node tools/stamp-assets.mjs` and `node tools/check-data.mjs`; never
  hand-pick hashes. Merges, stamp conflicts and docs passes are mechanical:
  an executor session at low effort is enough.

## 7. Adversarial review

After each wave, the reviewer the owner names for that wave (default Opus; the
owner may name self, Argon or Sonnet) reads the wave's diff, its spec, and the
spec's reviewer checklist. The reviewer posts a PR review, one finding per
comment (severity `block`/`fix`/`nit`, `file:line`, a concrete failure
scenario, reproduced yes/no). The owner may name two reviewers for a wave. Reviewers do
not rerun test suites: they read the diff and the output the WP reported.
When the reviewer is not Opus, Opus adjudicates: real findings become new
`type:wp` sub-issues, dismissed ones get a one-line reason on their thread, and
the wave's review issue closes when no `block` finding is open, which unlocks
the next wave.

Tests and CI are a bottleneck: a WP runs only the suites whose inputs it
changed, pushes once, and the full suite runs once before the owner merges
(the active plan's testing budget lists which suite covers which paths).
