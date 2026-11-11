# Tiers and dispatch

Aliases are those the Agent tool's `model` parameter takes. They live in `.claude/skills/skillsmith/roster.json`, the one place a model upgrade is recorded. `order` there is cheapest first.

## Roles

| Role | Does |
|---|---|
| planner | Writes specs and case rubrics; reads scorecards only |
| orchestrator | Dispatches, adjudicates, keeps the checklist honest |
| executor | Edits skills; is the subject of task evals |
| scout | Runs trigger evals, judging, lint and docs passes |

These roles are for skill work only. The repo's delegation roles stay in `AGENTS.md` and `docs/delegation.md`.

## Order of spend

1. Lint: `node tools/lint-skills.mjs` (free).
2. Trigger evals: one scout call for all skills.
3. Task evals: only for due (`--due`) or changed skills.

Stop at the first stage that fails and fix there. Tier descent is the last step of an upgrade: rerun at the next cheaper alias in `order` and record the cheapest passing one as `floor`.

## Report limits

Every subagent reports at most 150 words plus the scorecard table. Never file contents, never diffs. Anything longer is written where the orchestrator can read it, and the report names the path.

## Dispatch templates

Fill the angle brackets; send the rest unchanged. Each follows the WP format of `docs/delegation.md`.

### Trigger run (scout)

```
Goal:    For each prompt below, say which one skill you would invoke, or none.
Read:    Only the skill list and prompt list in this message. Open no files.
Touch:   Nothing.
Accept:  One answer per prompt, numbered, each a skill name or none.
Report:  A numbered list "<n>: <skill|none>". No explanation.

Skills (name: description):
<every skill's name and description, one per line>

Prompts:
<numbered trigger prompts, no expect values>
```

### Task run (executor)

```
Goal:    <the case prompt, verbatim, nothing added>
Read:    Whatever the task needs; discover skills yourself.
Touch:   Whatever the task needs, inside this worktree.
Accept:  The task is complete by your own judgment.
Report:  At most 150 words: what you changed. No file contents.
```

Dispatch with `isolation: worktree`, `model` from `roster.json` `executor` (or the tier under test), once per run, three runs per case. For a baseline, the skill folder is absent from the worktree. Afterwards the orchestrator runs each command check in the worktree and sends the diff to the judge.

### Judge (scout)

```
Goal:    Decide whether the statement is true of the diff.
Read:    Only the diff and statement below.
Touch:   Nothing.
Accept:  Answer exactly yes or no on the first line.
Report:  First line yes or no; second line at most 30 words of reason.

Statement: <text after "judge: ">

Diff:
<git diff of the run's worktree>
```

Never tell the judge which arm produced the diff, which skill was tested, or which run it is.
