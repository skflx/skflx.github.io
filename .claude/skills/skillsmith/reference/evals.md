# Evals

Each house skill has `.claude/skills/<skill>/evals.json`. Contract owner: `plans/2026-11-10-skillsmith.md` section 3.2.

## Schema

```json
{
  "reviewed": null,
  "triggers": [ { "prompt": "...", "expect": true } ],
  "tasks": [ { "id": "kebab-id", "split": "dev", "prompt": "...",
               "checks": ["node tools/check-data.mjs", "judge: <one binary statement>"],
               "origin": "seed" } ]
}
```

- `reviewed`: `null` (never audited) or `{ "date": "YYYY-MM-DD", "model": "<alias>", "floor": "<alias>" }`. `model` is the roster planner at audit time. `floor` is the cheapest alias whose task evals met the accept rule. Only an audit that ran the task evals sets it.
- `triggers`: at least 3 with `expect: true` and 3 with `expect: false`. Negatives are near-misses (a request another skill or no skill should take), not unrelated prompts.
- `tasks`: at least 2, at least 1 with `split: "holdout"`; ids unique. `checks` is non-empty. A check is a shell command (passes on exit 0) or `judge: ` plus one binary statement. Prefer commands.
- `origin`: `seed`, or `incident: <one line>` for a regression case.
- The agent that edits a skill sees `dev` cases only. `holdout` cases are run and judged, never shown to the editor.

## Trigger evals

One scout call for all skills at once (template in `reference/tiers.md`). It receives every skill's `name` and `description` and every trigger prompt, nothing else, and returns per prompt the one skill it would invoke, or `none`. Score each against `expect`: a positive passes when its own skill is chosen; a negative passes when its own skill is not chosen. A miss is fixed in the description, never the body.

## Task evals

- One executor subagent per run, `isolation: worktree`.
- The prompt is the case prompt alone. The skill is discovered, not pasted.
- k=3 runs per case. Never fewer, never more for a decision.
- Command checks run in that run's worktree; a run passes a check on exit 0.
- `judge:` checks go to a scout-tier judge (template in `reference/tiers.md`). It sees the diff and the statement, not the prompt's skill, the arm (with or without the skill), or the run number. It answers `yes` or `no`.
- A run passes the case when every check passes. Worktrees are discarded.
- Baselines use the same procedure with the skill folder absent from the worktree.

## Scorecard

A table of case by runs passed, nothing else:

```
| case | with skill | baseline |
|---|---|---|
| scene-one-define | 3/3 | 0/3 |
| holdout-placement | 3/3 | 3/3 |
```

Report counts such as `2/3`. Never report percentages, averages or pass rates, and never compare them.

## Accept rule

An edit lands only if all hold:

1. The targeted case goes from at most 1/3 to 3/3.
2. No case that was 3/3 drops, holdout included.
3. The body grew by at most 10 lines per fixed case; otherwise move the detail to `reference/`.

Small n: 3/3 against 0/3 is the weakest result worth acting on (Fisher exact, one-sided p = 0.05). Anything less is noise, so rerun or leave the skill alone. Do not read a difference between 2/3 and 3/3 as a signal.

## Bad cases

A case that the planner-tier model fails both with and without the skill is a bad case or an owner question, not a skill defect. Do not edit the skill for it. Fix or drop the case, or put the question to the owner.
