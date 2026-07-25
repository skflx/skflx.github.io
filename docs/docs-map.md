# Documentation map + second-pass checklist

This file makes documentation upkeep mechanical. After any significant change,
`CLAUDE.md` requires a **documentation second pass**: a separate, final step
run *after* the code is done and verified. It is deliberately checklist-shaped
so it can be handed to a smaller/cheaper model or agent than the one that did
the main work — everything below is doable with grep, `ls`, and small edits;
no design judgment required.

## The map: which doc owns what

| File | Owns | Update when |
|---|---|---|
| `README.md` | Public-facing overview + grouped file tree | A page/tool is added, removed, or renamed; a system's one-line description changes |
| `CLAUDE.md` | Agent operating manual: hard rules, commands, architecture, conventions | A command, convention, subsystem boundary, or hard rule changes |
| `WIP.md` | Running log, one section per workstream (goal / actions / next steps) | A significant chunk of a workstream completes — append, never rewrite history |
| `docs/kag-schema.md` | KAG data contract: node/edge fields, enums, storage/merge behavior | `tools/kag-validate.mjs` enums or `js/kag-store.js` load/merge/write semantics change |
| `docs/authoring-kag.md` | How to author KAG shards | The shard workflow or validator flags/guarantees change |
| `docs/authoring-oksat.md` | How to author an OKSAT module | Module schema, manifest entry shape, or Forge output changes |
| `docs/design-principles.md` | OKSAT design system (tokens, color, keyboard, SRS principles) | A token, hue, or interaction principle changes in `css/oksat.css` / the engine |
| `docs/decisions.md` | Decision tables for routine judgment calls (chrome, renames, keys, modules, escalation) | A convention or precedent changes |
| `docs/verification.md` | Per-subsystem "how to prove it works" playbooks | A subsystem's verifiable behavior or the test tooling changes |
| `docs/agent-native-plan.md` | Agent-native audit + issue roadmap (#42–#61) | An epic lands (tick it off) or the plan changes |
| `docs/feature-requests.md` | Product backlog: user-facing features ranked utility × feasibility | A feature ships (drop it), or the evidence behind the ranking shifts materially — re-snapshot rather than patching counts in place |
| `docs/ui-directions.md` | Candidate visual directions + the validated subspecialty marker set | A direction is picked (record it, then `docs/design-principles.md` takes over as the owner of the shipped system) |
| `docs/oksat-plan.md`, `docs/oksat-next-iteration-plan.md`, `docs/oto-kag-atlas-plan.md` | **Historical plan records** | Never rewritten retroactively — only their `> Status:` header may be amended; corrections to the record go in `WIP.md` |
| `docs/docs-map.md` | This checklist | A doc is added/removed, or the pass itself changes |
| `images/list.txt` | Image inventory | An image is added/removed |

## The second-pass checklist

Run these in order. Each step is pass/fail; fix failures before finishing.

1. **Identify touched subsystems** from the diff (`git diff --stat master...HEAD`)
   and update the owning docs per the map above. If a shipped page was added,
   removed, or renamed, update the `README.md` file tree (keep it *grouped* —
   use globs like `js/oksat-*.js`, don't enumerate every file).
2. **Rot scan.** Docs must not contain facts that change with routine work.
   Run:
   ```bash
   grep -rnE '[0-9]{2,} (nodes|edges|items|questions|lines)|~[0-9]+' \
     README.md CLAUDE.md docs/*.md
   ```
   Every hit must be either (a) inside a historical plan doc / `WIP.md`
   (allowed — they are dated records), (b) explicitly dated in place
   ("as of 2026-07"), or (c) a stable design constant (rem sizes, ratios,
   Leitner intervals). Otherwise replace the number with a pointer to the
   source file.
3. **Path check.** Every backticked path in `README.md` and `CLAUDE.md` must
   exist:
   ```bash
   grep -oE '`[a-zA-Z0-9_./-]+\.(html|js|mjs|css|json|md)`' README.md CLAUDE.md \
     | tr -d '`' | sort -u | while read -r p; do [ -e "$p" ] || echo "MISSING: $p"; done
   ```
   Zero `MISSING` lines allowed. (Glob-style entries like `js/oksat-*.js`
   aren't matched by this scan — verify those by eye.)
4. **Stub check.** If a page was renamed or retired, confirm the old URL has a
   redirect stub that forwards its query string, and that the stub appears in
   the `README.md` tree's stub lines.
5. **WIP.md entry.** If the work completed a significant workstream chunk,
   append to its section (or add a new section: Goal / Actions Taken / Next
   Steps). Keep it to what happened and what's next — no marketing.
6. **Plan-doc status headers.** If the work executed part of a plan doc,
   amend that doc's `> Status:` header only.
7. **CLAUDE.md sanity.** If any command, convention, or boundary changed,
   CLAUDE.md must reflect it — this file is injected into every agent session
   and stale rules cause confidently-wrong agents. Keep it dense; link out to
   docs rather than expanding it.

`tools/check-data.mjs` now enforces the data-shape half of this in CI, so
graph/manifest drift fails a PR automatically. The doc rot scan and path check
(steps 2–3) are still run by hand during the pass. Note: only backtick a path
in docs once the file actually exists — the path check flags future files.

## Rot rules (why the checklist looks like this)

- **Numbers rot fastest.** Node/edge/item counts change with every content
  merge. Docs point at data files; only dated logs may quote numbers.
- **Plan docs are write-once.** They are the record of *why* — rewriting them
  to match the present destroys that. The `> Status:` header is the one
  mutable line.
- **CLAUDE.md is paid-for context.** Every line is read by every agent on
  every task. It states rules and points elsewhere for detail; it never
  duplicates a schema or a table another doc owns.
