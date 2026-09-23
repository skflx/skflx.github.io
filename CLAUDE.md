# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static GitHub Pages site (skflx.github.io): a personal one-pager for an otolaryngology resident plus a small set of self-contained clinical study tools. **There is no build step, no framework build, no bundler — ever.** Every page is plain HTML + CSS + vanilla JS served as-is. The only npm dependency is dev-only test tooling (`playwright`); nothing shipped touches `node_modules`. (The Quartz wiki scaffold in `wiki/` builds in a *separate* repo — see below.)

## Commands

```bash
# Serve locally (required — file:// breaks pages that fetch)
python3 -m http.server 8000    # http://localhost:8000/

# Verify a change before pushing (also run in CI on every PR)
node tools/check-data.mjs        # data + security invariants (deps-free, instant)
node tools/test-wiki-sync.mjs    # vault → wiki privacy boundary (deps-free)
node tools/smoke-pages.mjs       # every page boots, zero real console errors
node tools/test-oksat-engine.mjs # engine behavior: answer-lock, SRS, keyboard
```

The browser suites need only a real Chromium — all page scripts are same-origin (React/htm vendored), so they run in a network-restricted sandbox. Verification detail: `docs/verification.md`. CI (`.github/workflows/ci.yml`) is verification only — no build step. Deploy = merge to `master` (GitHub Pages serves the repo root directly).

## Architecture

Three independent systems share the repo, plus a scaffold. They share no runtime and no state — only the design tokens and the theme key.

### Design system
`css/site.css` is the one palette + type + chrome (paper/ink, hairline rules, Archivo + IBM Plex Mono self-hosted in `fonts/`, two audiogram signal colors: `--signal` red = act/emphasis, `--signal-2` blue = science). `css/oksat.css` mirrors it as `--ok-*` tokens. Theme is `html[data-theme]`, applied pre-paint by `js/theme-boot.js` (every page, in `<head>`) and toggled by `js/site.js`, persisted as `sk_theme`. Rules and the list of removed tropes: `docs/decisions.md` §5.

### 1. The one-pager (`index.html`)
`css/site.css` + `css/onepager.css` + `js/site.js` + `js/onepager.js`. Open numbered sections (no accordion), sticky section heads ≥960px, one column on phones; `js/onepager.js` only computes the residency year and runs the nav scroll-spy. The hero shows `images/portrait-cutout.webp` on a `.cutout` plate; Fig. 1 (the cochlea, in About) is static inline SVG generated once — edit its geometry by regenerating, not by hand. The residency year (`#pgy-status`) is computed in `js/onepager.js` — rolls over July 1, capped at PGY-5 — with the current value duplicated in the HTML as a no-JS fallback; **change both together or neither.**

### 2. OKSAT (OHNS Knowledge Self-Assessment Tool)
- **Pages:** `oksat.html` (hub: module list, due-review banner, settings; logic in `js/oksat-hub.js`) and `oksat-study.html?m=<slug>[&c=<concept>]` (viewer; boot in `js/oksat-viewer.js`). That is the whole tool. `?m=` is untrusted input — it only ever selects a manifest entry and reaches the DOM as `textContent`.
- **Engine:** `js/oksat-engine.js` renders every module using React 18 UMD + `htm`, vendored in `js/vendor/` (hashes pinned) — tagged templates, **no JSX build**. `ItemView` is closure-private and prop-coupled; never try to export/import it (copy its patterns instead).
- **Modules are data files:** one file per module in `js/mcq-modules/`, ending with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`, plus one manifest entry in `js/oksat-manifest.js` (which also owns `OKSAT_SUBSPECIALTIES` — the one-hue-per-subspecialty map). You never touch the engine to add content. Modules are hand-authored; there is no generator. Schema: `docs/authoring-oksat.md`.
- **Storage is local and only local.** `js/oksat-store.js` (`window.OKSATStore`) is the one adapter: guarded reads/writes, identity resolution, and the one-time `mcq:*` → `oksat:*` migration. Keys keep a trailing `:<code>` namespace inherited from the retired multi-reviewer era, resolved silently by `OKSATStore.reviewer()` — **existing progress is stored under that namespace; do not flatten it without migrating the data.** The engine keeps its own duplicated load/save helpers on purpose (regression surface — don't rip them out).
- **Design system:** `docs/design-principles.md`, implemented as CSS custom properties in `css/oksat.css`. Every question opens on a recall gate — answer from memory and self-grade, or show the choices and answer as a locked-first-attempt MCQ; the engine tags each item's path (`mode` `recall`/`mcq`) so a cold recall and a correct MCQ stay distinct, and Leitner spaced repetition (which weights a cold recall above a correct MCQ) resurfaces misses. Keyboard-first; the engine tolerates sparse modules — missing data removes UI rather than breaking it.

### 3. Airway Rounds (`airway-jeopardy.html`)
Deliberately **self-contained** (`js/airway-app.js` + `js/airway-engine.js` + `js/airway-questions.js`, same-origin CSS/fonts) so it runs on bad conference-room wifi or none; its CSP names no remote origin. Keep it that way: adding any external request to this page defeats its purpose. The game stage stays dark in both themes (projectors), on `--aw-*` tokens.

### Other pages
`cpt-search.html` — `css/site.css` + a page `<style>`, logic in `js/cpt-search.js`. The legacy main stylesheet it used was deleted in the 2026-09 redesign; do not recreate a second token set.

### Wiki scaffold (`wiki/`)
Quartz 5 config, styles, landing page, and deploy workflow for publishing the owner's `sk.oto` Obsidian vault from a **separate repo** (`skflx/ent-wiki` → `skflx.github.io/ent-wiki/`), so this repo stays build-free. Nothing in `wiki/` is built or served here. `wiki/sync/sync-vault.mjs` is the only path from the vault to anything public and fails closed (folder allowlist, Personal Notes stripped, PHI tripwire); `wiki/dgmo/render-dgmo.mjs` turns the vault's ```` ```dgmo ```` diagrams into inline SVG at wiki build time; `tools/test-wiki-sync.mjs` pins both. Never commit real vault notes to this repo — fixtures are synthetic. Read `wiki/README.md` first.

### `archive/`
Kept content, **served by nothing** — no page fetches it, no test checks it. Currently the OHNS knowledge graph from the retired atlas viewers, as both raw JSON and a flat text rendering. Read `archive/README.md` before using it: most nodes are `review:false`, i.e. unverified scaffolding, not a clinical reference. Do not wire it back into a page, and do not delete or rewrite it, without the owner.

## Conventions

- **Routine decisions are pre-answered.** For "which CSS/JS does a new page use", retiring a page, the localStorage key registry, adding a module or subspecialty, and what must be escalated to the owner, follow `docs/decisions.md` instead of inferring from precedent. How to prove a change works, per subsystem: `docs/verification.md`.
- **Retiring a page means deleting it** (owner decision, 2026-09) — no redirect stubs. Remove it from `PAGES` in `tools/smoke-pages.mjs` and the `README.md` tree in the same change, and grep for inbound links.
- **Vanilla JS, guarded IIFEs, defensive throughout:** wrap `localStorage` and DOM access in try/catch no-ops; storage reads are fail-safe; degrade gracefully rather than throw.
- **Token-driven theming everywhere:** components consume CSS custom properties, never raw values; theme/font switching is an attribute flip on `<html>` (`data-theme`, `data-font`). Color always means something (the two audiogram signals; one hue per subspecialty) — never decoration.
- **Security rules** (`docs/security.md`, enforced by `tools/check-data.mjs`): every page has a CSP `<meta>` with `script-src 'self'`; **no inline `<script>`, no `on*=` handlers** — page logic goes in `js/<page>.js`; no third-party scripts (vendor into `js/vendor/` and pin the hash); anything reaching `innerHTML` is escaped, anything from the URL goes through `textContent`. No new external dependency (CDN, font service, analytics) without the owner.
- **No secrets, and no key fields.** The Gemini and Anthropic key managers were deleted with the tools that used them; nothing in the repo now reads a credential. Do not reintroduce one.
- **localStorage namespaces:** `sk_*` (site chrome), `oksat:*` (OKSAT), plus CPT's legacy `cpt-history`/`cpt-analytics`. Full registry in `docs/decisions.md` §3.
- **Indentation** (`.editorconfig`): 4 spaces for HTML/JS, 2 for CSS/Markdown.
- **`WIP.md` describes the current state of each system** — not an append-only diary. When something is retired, delete its section rather than narrating the removal.
- **Documentation second pass (required):** after any significant change, once the code itself is done and verified, run a docs pass as a separate final step: update `README.md`, `WIP.md`, this file, and the owning `docs/*` file. The doc→subsystem map and the mechanical checklist live in `docs/docs-map.md` — the pass is deliberately checklist-shaped so it can be delegated to a smaller/cheaper model or agent. Never write facts that rot (item counts, file sizes, line numbers) into docs; point at the source file instead.
- **Prefer deleting to keeping.** Dead code here is not free: it gets loaded, indexed, read by the next agent, and mistaken for something in use. If nothing references it, remove it rather than leaving it "just in case" — git history is the safety net.
