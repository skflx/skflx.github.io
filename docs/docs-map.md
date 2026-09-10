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
| `WIP.md` | Current state of each system (what it is / where it stands / what is next) | A significant chunk of work completes — rewrite the affected section to match reality |
| `docs/authoring-oksat.md` | How to author an OKSAT module | Module schema or manifest entry shape changes |
| `docs/design-principles.md` | OKSAT design system (tokens, color, keyboard, SRS principles) | A token, hue, or interaction principle changes in `css/oksat.css` / the engine |
| `docs/decisions.md` | Decision tables for routine judgment calls (chrome, renames, keys, modules, escalation) | A convention or precedent changes |
| `docs/verification.md` | Per-subsystem "how to prove it works" playbooks | A subsystem's verifiable behavior or the test tooling changes |
| `docs/docs-map.md` | This checklist | A doc is added/removed, or the pass itself changes |
| `archive/README.md` | What the archived data is and how to read it | Anything is added to or changed under `archive/` |
| `images/list.txt` | Image inventory | An image is added/removed |

There are no plan docs. The five that existed were records of work on systems
retired in 2026-09 and went with them; `WIP.md` now carries current state.

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
     README.md CLAUDE.md docs/*.md archive/README.md
   ```
   Every hit must be either (a) inside `WIP.md` (allowed — it is dated),
   (b) explicitly dated in place
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
4. **Orphan check.** If a page or script was retired, confirm nothing still
   points at it — a same-origin 404 is a smoke failure, but a stale mention in
   a comment or doc is not:
   ```bash
   grep -rn "<retired-name>" --include=*.html --include=*.js --include=*.mjs \
     --include=*.md . | grep -v node_modules | grep -v '^./archive/'
   ```
   Also confirm the page is gone from `PAGES` in `tools/smoke-pages.mjs`.
5. **WIP.md.** Update the affected system's section to describe the current
   state. It is a status document, not a diary — if a section describes
   something that no longer exists, delete the section.
6. **CLAUDE.md sanity.** If any command, convention, or boundary changed,
   CLAUDE.md must reflect it — this file is injected into every agent session
   and stale rules cause confidently-wrong agents. Keep it dense; link out to
   docs rather than expanding it.

`tools/check-data.mjs` enforces the data-shape half of this in CI, so
manifest/module drift fails a PR automatically. The doc rot scan and path
check (steps 2–3) are still run by hand during the pass. Note: only backtick a path
in docs once the file actually exists — the path check flags future files.

## Rot rules (why the checklist looks like this)

- **Numbers rot fastest.** Item and question counts change with every content
  merge. Docs point at data files; only dated logs may quote numbers.
- **Docs describing dead code are worse than no docs.** When a system is
  retired, its docs go with it in the same change. Git history is the record
  of why; a doc left behind reads as current and misleads.
- **CLAUDE.md is paid-for context.** Every line is read by every agent on
  every task. It states rules and points elsewhere for detail; it never
  duplicates a schema or a table another doc owns.
