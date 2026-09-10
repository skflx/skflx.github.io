# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static GitHub Pages site (skflx.github.io): a personal one-pager for an otolaryngology resident plus a small set of self-contained clinical study tools. **There is no build step, no framework build, no bundler — ever.** Every page is plain HTML + CSS + vanilla JS served as-is. The only npm dependencies are dev-only test tooling (`jsdom`, `playwright`); nothing shipped touches `node_modules`.

## Commands

```bash
# Serve locally (required — file:// breaks pages that fetch)
python3 -m http.server 8000    # http://localhost:8000/

# Verify a change before pushing (also run in CI on every PR)
node tools/check-data.mjs        # committed-data invariants (deps-free, instant)
node tools/smoke-pages.mjs       # every page boots, zero real console errors
node tools/test-oksat-engine.mjs # engine behavior: answer-lock, SRS, keyboard
```

The browser suites need a real Chromium and, for `oksat-study.html`, network access to its React/htm CDN — CI has both; a CDN-blocked sandbox cannot boot that one page. Before calling such a failure a regression, reproduce it from `master` in a worktree. Verification detail, including how to test that page without the CDN: `docs/verification.md`. CI (`.github/workflows/ci.yml`) is verification only — no build step. Deploy = merge to `master` (GitHub Pages serves the repo root directly).

## Architecture

Three independent systems share the repo. They share almost nothing: no common runtime, no shared state.

### 1. The one-pager (`index.html`)
Uses `css/onepager.css` + `js/onepager.js` only. Two visitor-selectable styles (Matte, Story) × day/night theme, driven by `data-style` / `data-theme` attributes on `<html>` and persisted as `localStorage` `sk_style` / `sk_theme`. Styling is token-driven: each style declares its tokens for both themes in `css/onepager.css`; components consume only tokens, so retheming is a localized edit. Native `<details>` provides the accordion (no JS to open/close). The residency year (`#pgy-status`) is computed in `js/onepager.js` — rolls over July 1, capped at PGY-5 — with the current value duplicated in the HTML as a no-JS fallback; **change both together or neither.**

### 2. OKSAT (OHNS Knowledge Self-Assessment Tool)
- **Pages:** `oksat.html` (hub: module list, due-review banner, settings) and `oksat-study.html?m=<slug>[&c=<concept>]` (viewer). That is the whole tool.
- **Engine:** `js/oksat-engine.js` renders every module using React 18 UMD + `htm` from CDN — tagged templates, **no JSX build**. `ItemView` is closure-private and prop-coupled; never try to export/import it (copy its patterns instead).
- **Modules are data files:** one file per module in `js/mcq-modules/`, ending with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`, plus one manifest entry in `js/oksat-manifest.js` (which also owns `OKSAT_SUBSPECIALTIES` — the one-hue-per-subspecialty map). You never touch the engine to add content. Modules are hand-authored; there is no generator. Schema: `docs/authoring-oksat.md`.
- **Storage is local and only local.** `js/oksat-store.js` (`window.OKSATStore`) is the one adapter: guarded reads/writes, identity resolution, and the one-time `mcq:*` → `oksat:*` migration. Keys keep a trailing `:<code>` namespace inherited from the retired multi-reviewer era, resolved silently by `OKSATStore.reviewer()` — **that namespace is load-bearing for existing progress; do not flatten it without migrating the data.** The engine keeps its own duplicated load/save helpers on purpose (regression surface — don't rip them out).
- **Design system:** `docs/design-principles.md`, implemented as CSS custom properties in `css/oksat.css`. Answers lock on first attempt (Leitner spaced repetition resurfaces misses); keyboard-first; the engine tolerates sparse modules — missing data removes UI rather than breaking it.

### 3. Airway Rounds (`airway-jeopardy.html`)
Deliberately **CDN-free and self-contained** (`js/airway-engine.js` + `js/airway-questions.js`) so it runs on bad conference-room wifi or none. Keep it that way: adding any external request to this page defeats its purpose.

### Other pages
`cpt-search.html` is frozen legacy — self-contained logic inline, but still consuming tokens from `css/main.css`. Do not extend `css/main.css`. Newer tool pages share chrome via `css/site.css` + `js/site.js` (theme toggle bound to `sk_theme` / `html[data-theme]`).

### `archive/`
Kept content, **served by nothing** — no page fetches it, no test checks it. Currently the OHNS knowledge graph from the retired atlas viewers, as both raw JSON and a flat text rendering. Read `archive/README.md` before using it: most nodes are `review:false`, i.e. unverified scaffolding, not a clinical reference. Do not wire it back into a page, and do not delete or rewrite it, without the owner.

## Conventions

- **Routine decisions are pre-answered.** For "which CSS/JS does a new page use", retiring a page, the localStorage key registry, adding a module or subspecialty, and what must be escalated to the owner, follow `docs/decisions.md` instead of inferring from precedent. How to prove a change works, per subsystem: `docs/verification.md`.
- **Retiring a page means deleting it** (owner decision, 2026-09) — no redirect stubs. Remove it from `PAGES` in `tools/smoke-pages.mjs` and the `README.md` tree in the same change, and grep for inbound links.
- **Vanilla JS, guarded IIFEs, defensive throughout:** wrap `localStorage` and DOM access in try/catch no-ops; storage reads are fail-safe; degrade gracefully rather than throw.
- **Token-driven theming everywhere:** components consume CSS custom properties, never raw values; theme/font/style switching is an attribute flip on `<html>` (`data-theme`, `data-font`, `data-style`). Color always means something (one hue per subspecialty) — never decoration.
- **CDN dependencies** (React, htm) are pinned UMD `<script>` tags on the one page that needs them — no npm installs for shipped code, and no new external dependencies without the owner.
- **No secrets, and no key fields.** The Gemini and Anthropic key managers were deleted with the tools that used them; nothing in the repo now reads a credential. Do not reintroduce one.
- **localStorage namespaces:** `sk_*` (site chrome), `oksat:*` (OKSAT). Full registry in `docs/decisions.md` §3.
- **Indentation** (`.editorconfig`): 4 spaces for HTML/JS, 2 for CSS/Markdown.
- **`WIP.md` describes the current state of each system** — not an append-only diary. When something is retired, delete its section rather than narrating the removal.
- **Documentation second pass (required):** after any significant change, once the code itself is done and verified, run a docs pass as a separate final step: update `README.md`, `WIP.md`, this file, and the owning `docs/*` file. The doc→subsystem map and the mechanical checklist live in `docs/docs-map.md` — the pass is deliberately checklist-shaped so it can be delegated to a smaller/cheaper model or agent. Never write facts that rot (item counts, file sizes, line numbers) into docs; point at the source file instead.
- **Prefer deleting to keeping.** Dead code here is not free: it gets loaded, indexed, read by the next agent, and mistaken for something in use. If nothing references it, remove it rather than leaving it "just in case" — git history is the safety net.
