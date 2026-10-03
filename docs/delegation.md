# Delegation — how work is split between models and the owner

The repo is worked by three parties. This file says who does what, how a
task is handed over, and how it comes back. The SSB task list that uses it
is `docs/ssb-roadmap.md`.

| Party | Does | Never does |
|---|---|---|
| **Owner** (human orchestrator) | Decides (`docs/decisions.md` §7), vets medical content (`review: verified`), merges to `master` (deploy), launches sessions with the prompts below | — |
| **Opus** (orchestrator) | Specs, anatomy-critical geometry and data, medical content authoring and adversarial review, checkpoints (reviews a batch of delegated work against its acceptance), keeps the roadmap honest | Routine wiring it could spec instead |
| **Sonnet** (executor) | Executes a work package (WP) to its acceptance: code, tests, UI wiring, pipeline plumbing, citation checks, docs passes | Anatomy judgment, medical claims, owner decisions, scope changes, merging |

Why the split: a spec plus an acceptance test costs Opus far fewer tokens
than the implementation, and this repo's test suites (`docs/verification.md`)
make "done" checkable by a model that did not design the work. The
expensive model reads a diff at a checkpoint instead of writing it.

## 1. What makes a WP delegable

A WP may go to Sonnet only when all of these hold:

1. **Its anatomy is already data.** Where a vessel runs, a diorama's
   proportions, which wall a flap is cut from — Opus writes these into a
   data file or the WP spec first. Sonnet builds machinery that consumes
   them.
2. **Its acceptance is a command.** A test in `tools/test-*.mjs` (existing,
   or specified in the WP precisely enough to write), `check-data.mjs`, a
   number the pipeline prints. "Looks right" is a checkpoint item, not an
   acceptance criterion.
3. **It needs no owner decision** that is still open (`docs/ssb.md` §13,
   `docs/ssb-roadmap.md` §Owner decisions).
4. **Its read list fits.** The WP names the sections to read (e.g.
   `docs/ssb.md` §5.5, §7.4), not whole documents.

If one fails, the WP is Opus's, or it is split: Opus does the judgment
half, Sonnet the mechanical half.

## 2. The WP format (in `docs/ssb-roadmap.md`)

```
### <ID> — <title>                          [status] · Sonnet|Opus · depends: <IDs>
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

## 3. Executor protocol (Sonnet)

1. Read `CLAUDE.md` (auto-loaded), then only the WP's **Read** list.
2. Branch `claude/<wp-id>-<slug>` from current `master`.
3. Do the **Steps**. Stay inside **Touch**. If the work needs a file outside
   it, or a judgment the WP did not make, stop and report (step 6).
4. Run every **Accept** command plus the standard set
   (`docs/verification.md`): `node tools/stamp-assets.mjs` if `css/`/`js/`
   changed, `node tools/check-data.mjs`, and the browser suite of the
   subsystem touched. Paste the tail of each output into the PR body.
5. Docs pass (`docs/docs-map.md` checklist) for what changed, and set the
   WP's status to `review` in `docs/ssb-roadmap.md` in the same PR, with a
   one-line result.
6. Open a PR (never merge). If stopped early, the PR or the report says
   exactly which **Escalate** condition fired and what the options are.

Hard stops, whatever the WP says: a test would have to be skipped or
weakened to pass; an anatomical position, proportion or medical claim is
needed and not in data; a hard rule in `CLAUDE.md` would bend (CSP, no
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

Executor — pick Sonnet as the session model, then:

```
Execute work package <ID> in docs/ssb-roadmap.md, following
docs/delegation.md §3. Open a PR when its Accept commands pass;
do not merge.
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

- **Lanes are separate Sonnet sessions launched by the owner**, not Opus
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
  `master` and conflicts stay stamp-only (recipe:
  `docs/ssb-sonnet-handoff.md` "Merging lanes"). Merges, stamp conflicts
  and docs passes are mechanical: a Sonnet (or smaller) session at low
  effort is enough.
