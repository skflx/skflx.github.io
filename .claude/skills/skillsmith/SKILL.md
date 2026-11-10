---
name: skillsmith
description: Write, audit, shorten and upgrade the house skills in .claude/skills/ against evals, at the cheapest model tier that passes. Use when asked for a new skill, to improve, audit or shorten one, after a skill-guided task went wrong, or when the model roster changes (/skillsmith new|audit|upgrade|retro). Not for editing AGENTS.md rules, third-party skills, or the work a skill guides.
---

# skillsmith

A skill is a delta: only what a capable model cannot infer from the repo. Every line is one of three kinds.

| Kind | Is | Lives until |
|---|---|---|
| Knowledge | House facts and pointers (which doc owns the schema, which command proves done) | The fact changes |
| Constraint | An owner rule, with its reason | The owner changes it |
| Scaffold | Procedure compensating for a model weakness | Debt: kept only while an eval case fails without it |

Rules that follow:

- Evals come before prose. No evidence of a recurring need (three real requests or failures), no skill.
- Learning is a regression case, not a diary. An incident becomes an eval case, then the smallest edit that passes it.
- A model upgrade is a deletion opportunity. Ablate scaffold; never ablate knowledge or constraints.
- Evals are stochastic and n is tiny. Accept on all-or-nothing k=3 runs; never report percentages.
- Cheapest check first: lint (free), then trigger evals, then task evals only for due or changed skills.

Roles and models: `.claude/skills/skillsmith/roster.json`. Dispatch details: `.claude/skills/skillsmith/reference/tiers.md`.

## Anatomy of a good skill

- The description is the trigger: what it produces, `Use when ...` in the owner's real phrasings, and the near-miss it must not take.
- Body order: pointer to the owning doc; constraints with reasons; acceptance commands; escalation conditions; scaffold last, each step naming the eval case it serves.
- State the goal and the constraint, not the keystrokes.
- Deterministic work is a script under `tools/`, not prose.
- Detail needed only sometimes goes in `reference/`, loaded on demand.
- A rule every agent needs goes in `AGENTS.md`, not in a skill.
- Third-party skills (listed in `.claude/skills/THIRD_PARTY_SKILLS.md`) are never edited.

## Modes

### 1. `/skillsmith new <name>`

1. Evidence: find three real requests or failures (git log, PRs, issues, the owner's words). Fewer: stop and say so.
2. Write `.claude/skills/<name>/evals.json` (schema in `reference/evals.md`): triggers with near-miss negatives, tasks with at least one `holdout`.
3. Baseline the `dev` tasks with no skill at the executor tier.
4. Write the minimal `SKILL.md`: what failed in the baseline, plus constraints and knowledge. Nothing else.
5. Rerun the tasks; apply the accept rule.
6. Register the name in the `## Skills` section of `AGENTS.md`, then run `node tools/lint-skills.mjs`.

### 2. `/skillsmith audit [<name>|--due]`

1. Run `node tools/lint-skills.mjs`. Fix findings first; stop here if any remain.
2. No name: audit the skills `node tools/lint-skills.mjs --due` lists.
3. Run the trigger evals (one scout call, all skills). Fix a miss in the description, never the body.
4. Run the task evals for the skill (k=3 per case). Print the scorecard.
5. Edit only for failing cases, dev cases shown to the editor, holdouts never. Rerun; apply the accept rule.
6. Record the cheapest passing alias as `floor` and stamp `reviewed` in `evals.json`. Only an audit that ran the task evals may stamp.

### 3. `/skillsmith upgrade`

1. Edit `roster.json` to the new aliases; keep `order` cheapest first.
2. Per skill: baseline with no skill on the new executor.
3. Delete scaffold that no failing case needs; rerun to confirm.
4. Tier descent: run the skill one tier cheaper; record `floor` when it still passes.
5. Stamp `reviewed.model` with the new planner.

### 4. `/skillsmith retro`

Use after the owner, a reviewer or CI corrected a skill-guided task.

1. Write the incident as a task case with `origin: incident: <one line>`.
2. Confirm it fails (k=3). If it passes, the skill was not the cause; stop.
3. Make the smallest edit that passes it; apply the accept rule.
4. If the cause was a missing repo-wide rule, propose the `AGENTS.md` line to the owner instead of growing the skill.

## Accept rule

An edit lands only if the targeted case goes from at most 1/3 to 3/3, no case that was 3/3 drops (holdout included), and the body grew by at most 10 lines per fixed case, else move detail to `reference/`. Anything less than 3/3 against 0/3 is noise: rerun or leave it. A case the frontier model fails with and without the skill is a bad case or an owner question, not a skill defect. Full rule and the small-n statement: `.claude/skills/skillsmith/reference/evals.md`.

## References

- `.claude/skills/skillsmith/reference/evals.md`: schema, how trigger and task evals run, scorecard, accept rule.
- `.claude/skills/skillsmith/reference/tiers.md`: roles, order of spend, report limits, dispatch templates.
- `node tools/lint-skills.mjs`: structure lint (`--due` lists skills needing audit, `--self-test` checks the lint itself).
