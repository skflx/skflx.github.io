# skillsmith: a skill that writes, audits and prunes skills

Owner request, 2026-11-10: a skill for creating effective, well organized, robust skills, which
evaluates itself periodically and systematically, capitalizes on model upgrades, and improves as a
person would. Planning by the frontier model; execution by one Opus orchestrator dispatching Sonnet
and Haiku agents, with token use as a first-class constraint.

## 1. Thesis (the contract every file below serves)

A skill is a **delta**: only what a capable model cannot infer from the repository. Every line of a
`SKILL.md` is one of three kinds.

| Kind | What it is | Lifetime |
|---|---|---|
| **Knowledge** | House facts and pointers: which doc owns the schema, which command proves done | Until the fact changes (drift) |
| **Constraint** | An owner rule, stated with its reason | Until the owner changes it |
| **Scaffold** | Procedure that compensates for a model weakness | **Debt.** Owed to an eval case that fails without it; deleted when a model passes without it |

Consequences:

1. **Evals come before prose.** A skill is written against cases, and a baseline run with no skill
   decides what it must contain. No evidence of a recurring need (three real requests or failures),
   no skill.
2. **Learning is a regression case, not a diary.** An incident becomes an eval case first, then the
   smallest edit that passes it. No lessons log.
3. **A model upgrade is a deletion opportunity.** Ablate scaffold against the new model; record the
   cheapest tier that still passes (`floor`) and run the skill there.
4. **Small-n honesty.** LLM-run evals are stochastic and n is tiny. The accept rule (§4) is
   all-or-nothing on k=3 runs; pass-rate percentages are never reported or compared.
5. **The cheap check runs first.** Structure is linted for zero tokens in CI; tokens are spent only
   on skills that are due or changed, at the lowest tier that can do the job.

## 2. Files

| Path | Holds |
|---|---|
| `.claude/skills/skillsmith/SKILL.md` | The playbook, at most 120 lines: thesis in brief, the four modes, the accept rule in one paragraph, pointers to the two references |
| `.claude/skills/skillsmith/reference/evals.md` | `evals.json` schema, how each eval kind is run, scorecard format, accept rule in full |
| `.claude/skills/skillsmith/reference/tiers.md` | Roles, budget rules, dispatch prompt templates |
| `.claude/skills/skillsmith/roster.json` | Role to model alias; the one place a model upgrade is recorded |
| `.claude/skills/<skill>/evals.json` | Per-skill cases and the review stamp (every house skill, skillsmith included) |
| `tools/lint-skills.mjs` | Deps-free structural lint, `--due` report, `--self-test` |

Third-party skills (folders listed in `.claude/skills/THIRD_PARTY_SKILLS.md`) are never edited and
get only the frontmatter check.

## 3. Contracts

### 3.1 `roster.json`

```json
{ "planner": "fable", "orchestrator": "opus", "executor": "sonnet", "scout": "haiku",
  "order": ["haiku", "sonnet", "opus", "fable"] }
```

Values are the aliases the Agent tool's `model` parameter takes. `order` is cheapest first. The
frontier is `planner`. This file assigns eval and authoring roles for skill work only; the repo's
delegation roles stay in `AGENTS.md`.

### 3.2 `evals.json`

```json
{
  "reviewed": null,
  "triggers": [ { "prompt": "…", "expect": true } ],
  "tasks": [ { "id": "kebab-id", "split": "dev", "prompt": "…",
               "checks": ["node tools/check-data.mjs", "judge: the scene file defines exactly one ASCII3D.define call"],
               "origin": "seed" } ]
}
```

- `reviewed`: `null` (never audited) or `{ "date": "YYYY-MM-DD", "model": "<alias>", "floor": "<alias>" }`.
  `model` is the roster planner at audit time; `floor` is the cheapest alias whose task evals met
  the accept rule. Only an audit that ran the task evals may set it.
- `triggers`: at least 3 with `expect: true` and 3 with `expect: false`. The negatives are
  near-misses (a request another skill or no skill should take), not unrelated prompts.
- `tasks`: at least 2, at least 1 with `split: "holdout"`. `checks` is non-empty; a check is a
  shell command (passes on exit 0) or starts with `judge: ` followed by one binary statement.
  Prefer commands. `origin` is `seed`, or `incident: <one line>` for a regression case.
- The agent that edits a skill is shown `dev` cases only. `holdout` cases are run and judged, never
  shown to the editor.

### 3.3 `tools/lint-skills.mjs`

Default run, exit 1 on any failure, one line per finding (`<skill>: <rule>: <detail>`):

| Rule | Check |
|---|---|
| `frontmatter` | `SKILL.md` opens with `---` frontmatter; `name` equals the folder name; `description` is non-empty, at most 1024 characters, and contains `Use when` (case-insensitive `use when` or `use on`) |
| `length` | Body (after frontmatter) at most 300 lines |
| `paths` | Every backticked token matching `^[\w.\-/]+$` that contains `/` and whose first segment is an existing top-level entry of the repo must exist. Also applied to `reference/*.md` |
| `evals` | `evals.json` parses and meets §3.2 (types, minimum counts, unique task ids, `floor`/`model` in roster `order`) |
| `registered` | The skill's name appears backticked in the `## Skills` section of `AGENTS.md` |
| `roster` | `roster.json` has the four roles and `order` contains every role's alias |

Third-party folders: `frontmatter` only; a missing `Use when` clause there is a warning that leaves
the exit code alone, any other frontmatter fault is an error.

`--due` (report only, always exit 0): one line per house skill with its reasons, from
`never audited` / `stale` (`reviewed.date` over 120 days old) / `model` (`reviewed.model` is not the
roster planner) / `drift: <path>` (a repo file cited in `SKILL.md`, never a directory, has a commit dated after
`reviewed.date`; `git log -1 --format=%cs -- <path>`; skip silently if git is unavailable). A skill
with no reason prints nothing; if none is due print `no skill is due`.

`--self-test`: runs the rule functions on in-memory synthetic skills (one valid, one per failing
rule) and exits 1 if any verdict is wrong. No fixture files are written anywhere. The rule
functions take parsed input so they are testable without the filesystem.

CI: one step `Lint skills` in `.github/workflows/ci.yml`, beside the OKSAT lints, running
`node tools/lint-skills.mjs --self-test && node tools/lint-skills.mjs`.

## 4. The playbook's content (`SKILL.md` and references)

Frontmatter description: what it does, then `Use when` asked for a new skill, to improve, audit or
shorten one, after a skill-guided task went wrong, or when the model roster changes. Not for
editing `AGENTS.md` rules or third-party skills.

**Anatomy of a good skill** (`SKILL.md`, brief):
- Description is the trigger: what it produces, `Use when …` with the owner's real phrasings, and
  the near-miss it must not take.
- Body order: owning doc pointer; constraints with reasons; acceptance commands; escalation
  conditions; scaffold last, each step naming the eval case it serves.
- State the goal and the constraint, not the keystrokes. Deterministic work is a script under
  `tools/`, not prose. Detail a task needs only sometimes goes in `reference/`, loaded on demand.
- A rule every agent needs goes in `AGENTS.md`, not in a skill.

**Modes:**

1. `new <name>`: evidence (three real requests or failures from git log, PRs, issues, or the
   owner's words; else stop and say so) → write `evals.json` → baseline the `dev` tasks with no
   skill at the executor tier → write the minimal `SKILL.md` covering only what failed plus
   constraints → rerun → accept rule → register in `AGENTS.md`, lint, stamp.
2. `audit [<name>|--due]`: lint → trigger evals → task evals → scorecard → edit only for failing
   cases → rerun → stamp. Without a name, audits what `node tools/lint-skills.mjs --due` lists.
3. `upgrade` (roster changed): edit `roster.json`; per skill, baseline with no skill on the new
   executor; delete scaffold no case needs; then tier descent (try the skill one tier cheaper) and
   record `floor`. Knowledge and constraints are never ablated away.
4. `retro` (a skill-guided task was corrected by the owner, a reviewer, or CI): write the incident
   as a task case (`origin: incident: …`) → confirm it fails → smallest edit → accept rule. If the
   cause was a missing repo-wide rule, propose the `AGENTS.md` line instead.

**How evals run** (`reference/evals.md`):
- Trigger evals: one scout call for all skills at once. It receives every skill's `name` and
  `description` only, and every trigger prompt, and returns which skill (or none) it would invoke
  per prompt. Scored against `expect`. A miss is fixed in the description, never the body.
- Task evals: one executor subagent per run, `isolation: worktree`, prompt = the case prompt
  alone (the skill is discovered, not pasted), k=3 runs per case. Command checks run in that
  worktree; `judge:` checks go to a scout-tier judge that sees the diff and the statement, not
  which arm produced it. Worktrees are discarded.
- Scorecard: a table of case × runs passed (`3/3`, `1/3`), nothing else.
- **Accept rule**: an edit lands only if (a) the targeted case goes from at most 1/3 to 3/3,
  (b) no case that was 3/3 drops, holdout included, (c) the body grew by at most 10 lines per
  fixed case, else move detail to `reference/`. 3/3 against 0/3 is the weakest result worth acting
  on (Fisher exact, one-sided p = 0.05); anything less is noise, so rerun or leave it.
- An eval case that the frontier model fails with and without the skill is a bad case or an
  owner question, not a skill defect.

**Token rules** (`reference/tiers.md`):
- Planner writes specs and case rubrics and reads scorecards only. Orchestrator dispatches and
  adjudicates. Executor edits skills and is the task-eval subject. Scout runs trigger evals,
  judging, lint and docs passes.
- Order of spend: lint (free) → trigger evals (one scout call) → task evals only for due or
  changed skills. Stop at the first stage that fails and fix there.
- Every subagent reports at most 150 words plus the scorecard table; never file contents.
- A dispatch prompt names Goal, Read, Touch, Accept, Report (the WP format of
  `docs/delegation.md`), and gives templates for the three calls (trigger run, task run, judge).

## 5. Work packages

Executed in one session and one PR; the parent issue carries the task list.

| WP | Model | Depends | Touch | Accept |
|---|---|---|---|---|
| WP1 lint | Sonnet | — | `tools/lint-skills.mjs`, `.github/workflows/ci.yml` | `node tools/lint-skills.mjs --self-test` exits 0; rules per §3.3 |
| WP2 playbook | Sonnet | — | `.claude/skills/skillsmith/**` | Files of §2 exist and say what §4 says; `SKILL.md` at most 120 lines; own `evals.json` meets §3.2 |
| WP3 seed evals | Sonnet | — | `.claude/skills/{ascii-diagram,oksat-guide,oksat-module}/evals.json` | Each meets §3.2 with `reviewed: null`; command checks are real repo commands; no clinical claim is written into a prompt or check |
| WP4 trigger dry run | Haiku | WP2, WP3 | none (report only) | One call, all house skills' triggers, table of misses returned to the orchestrator |
| WP5 docs pass | Haiku | WP1–WP3 | `AGENTS.md` (Skills line, Commands block, one conventions-free mention), `docs/verification.md`, `plans/README.md` | `node tools/lint-skills.mjs` and `node tools/check-data.mjs` exit 0 |
| Checkpoint | Opus | all | fixes via re-dispatch | Diff matches this spec; both commands above pass; trigger misses fixed in descriptions (house skills only) |

No task evals are run in this plan, so every stamp stays `reviewed: null` and
`node tools/lint-skills.mjs --due` lists every house skill as `never audited`. The first full audit
is the owner's to launch (`/skillsmith audit --due`).

## 6. Open, owner's call

- Whether `AGENTS.md` Models & roles gains a planner row above Opus and Sonnet as an executor;
  this plan leaves that table unchanged.
- Whether a recurring scheduled task runs `--due` and opens an issue when something is listed.
