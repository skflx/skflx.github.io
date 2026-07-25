# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static GitHub Pages site (skflx.github.io): a personal one-pager for an otolaryngology resident plus a suite of self-contained clinical/study tools. **There is no build step, no framework build, no bundler — ever.** Every page is plain HTML + CSS + vanilla JS served as-is. The only npm dependencies are dev-only test tooling (`jsdom`, `playwright`); nothing shipped touches `node_modules`.

## Commands

```bash
# Serve locally (required — pages fetch() JSON, so file:// breaks)
python3 -m http.server 8000    # http://localhost:8000/

# Verify a change before pushing (also run in CI on every PR)
node tools/check-data.mjs        # committed-data invariants (deps-free, instant)
node tools/smoke-pages.mjs       # every page boots, zero real console errors
node tools/test-oksat-engine.mjs # engine behavior: answer-lock, SRS, keyboard

# Validate + merge KAG shards into the canonical graph (dev-only tool)
node tools/kag-validate.mjs [--dir <shardDir>] [--graph data/kag-graph.json] [--dry]
```

The browser suites need a real Chromium and, for the OKSAT/graph pages, network to their CDN scripts (React/htm/Cytoscape) — CI has both; a CDN-blocked sandbox can only boot the CDN-free pages. Verification detail: `docs/verification.md`. CI (`.github/workflows/ci.yml`) is verification only — no build step. Deploy = merge to `master` (GitHub Pages serves the repo root directly).

## Architecture

Three mostly-independent systems share the repo:

### 1. The one-pager (`index.html`)
Uses `css/tokens.css` + `css/onepager.css` + `js/onepager.js` only. **One identity site-wide ("Lightbox")** × day/night theme, driven by the `data-theme` attribute on `<html>` and persisted as `localStorage` `sk_theme`. The former Matte/Story style switcher and its `sk_style` key are retired. Native `<details>` provides the accordion (no JS to open/close).

### 2. OKSAT (OHNS Knowledge Self-Assessment Tool)
- **Pages:** `oksat.html` (hub + settings), `oksat-study.html?m=<slug>&c=<concept>` (viewer), `oksat-generate.html` (Gemini "Question Forge"), `oksat-adaptive.html`. Old `mcq*.html` and `occ*.html` are redirect stubs.
- **Engine:** `js/oksat-engine.js` renders every module using React 18 UMD + `htm` from CDN — tagged templates, **no JSX build**. `ItemView` is closure-private and prop-coupled; never try to export/import it (copy its patterns instead).
- **Modules are data files:** one file per module in `js/mcq-modules/`, ending with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`, plus one manifest entry in `js/oksat-manifest.js` (which also owns `OKSAT_SUBSPECIALTIES` — the one-hue-per-subspecialty map). You never touch the engine to add content. Schema: `docs/authoring-oksat.md`.
- **Completion database:** `data/oksat-db.json` — dated per-reviewer completion, read/merged on load; writes go via download-to-commit or a GitHub Contents API push with a runtime-only token (never stored). Reviewer identity: `js/oksat-reviewer.js` (also migrates legacy `mcq:*` localStorage to `oksat:*`).
- **Storage:** all new persistence goes through `js/oksat-store.js` (`window.OKSATStore`); existing modules keep their duplicated load/save helpers on purpose (regression surface — don't rip them out).
- **Design system:** `docs/design-principles.md`; colour tokens live in `css/tokens.css`, OKSAT-specific components in `css/oksat.css`. Answers lock on first attempt (Leitner spaced repetition resurfaces misses); keyboard-first; the engine tolerates sparse modules — missing data removes UI rather than breaking it.

### 3. KAG (Knowledge Atlas Graph) + unified graph
- **The JSON file is the database.** `data/kag-graph.json` (schema v2; hundreds of nodes/edges — check the file for live counts) is the site's canonical knowledge graph — GitHub Pages is static, so there is no server. Contract: `docs/kag-schema.md` (authoritative; enums copied verbatim from the validator).
- **Never hand-edit `data/kag-graph.json`.** Author small `{nodes, edges}` shard files and merge them with `tools/kag-validate.mjs`, which coerces enums, drops dangling edges, forces `review:false` on authored nodes, and checks `oksat.concepts` links against the real module `CONCEPTS` keys. Authoring contract: `docs/authoring-kag.md` (kebab-case unique ids, reuse existing ids, ≥1 source per node, no fabrication — this is medical content; only the owner graduates nodes to `review:true`).
- **One engine, three lenses:** `graph.html?lens=<knowledge|structural|study>&node=<id>` is the single graph page. `js/graph-view.js` (`window.GraphView`) owns the one Cytoscape instance (cose-bilkent layout, isolate, search, deep-links, theming); `js/graph-lens-{knowledge,structural,study}.js` plug in via a fixed contract, each as a guarded IIFE registered on `window.GraphLenses`. `kag.html` / `atlas.html` are redirect stubs that forward `?node=`; `js/oksat-atlas.js` is a compat shim (`loadModules()` still used by adaptive + dashboard).
- **Data access:** always through `js/kag-store.js` (`KAGStore`): fetch + merge where **LOCAL WINS** on progress fields, download / Contents-API push write paths. Structural fields (`structure`, `region`, `laterality`) exist only on physical anatomical structures; the structural lens is a pure filtered view holding no data of its own.

### Other tools
`airway-jeopardy.html` (+ `js/airway-engine.js`, `js/airway-questions.js`) is deliberately **CDN-free and self-contained** (it loads only local CSS — keep it that way). `kag-extract.html` extracts graph shards via the Claude API. `cpt-search.html` is the one remaining legacy page, still using `css/main.css` / `js/main.js` for *components* only — its palette now comes from `css/tokens.css`. `ascii-editor.html` was retired (2026-07) and is a redirect stub. Newer tool pages share chrome via `css/site.css` + `js/site.js` (theme toggle bound to `sk_theme` / `html[data-theme]`).

## Conventions

- **Routine decisions are pre-answered.** For "which CSS/JS does a new page use", renames/redirect stubs, the localStorage key registry, adding a module or subspecialty, and what must be escalated to the owner, follow `docs/decisions.md` instead of inferring from precedent. How to prove a change works, per subsystem: `docs/verification.md`.
- **Vanilla JS, guarded IIFEs, defensive throughout:** wrap `localStorage` and DOM access in try/catch no-ops; storage reads are fail-safe; degrade gracefully rather than throw.
- **`css/tokens.css` is the single source of colour.** Every page loads it *first*, before its own stylesheet. No other file may declare a colour — not a hex, not an rgba, not in an inline `style`, not as a JS fallback worth caring about. A page-local `:root` block loads later and silently wins, which is how brand drift happens; if you need a new colour, add a token there. Categorical hues (subspecialty markers, graph node types, structural classes) are **solved palettes** — re-run the validator in `docs/ui-directions.md` before touching one, and never let colour be the only cue (graph node type also carries a shape).
- **Token-driven theming everywhere:** components consume CSS custom properties, never raw values; theme/font switching is an attribute flip on `<html>` (`data-theme`, `data-font`). Color always means something (one hue per subspecialty) — never decoration.
- **CDN dependencies** (React, htm, Cytoscape) are pinned UMD `<script>` tags per page — no npm installs for shipped code.
- **Secrets never touch the repo:** Anthropic/Gemini API keys live in `localStorage` only; GitHub push tokens are runtime-only and never stored.
- **localStorage namespaces:** `sk_*` (site chrome), `oksat:*` (OKSAT), `kag-graph` (KAG local state).
- **Indentation** (`.editorconfig`): 4 spaces for HTML/JS, 2 for CSS/Markdown.
- **`WIP.md` is the running project log** — one section per major workstream (goal / actions taken / next steps). Update it when completing a significant chunk of work.
- **Plans live in `docs/`** (`docs/oksat-plan.md`, `docs/oksat-next-iteration-plan.md`, `docs/oto-kag-atlas-plan.md`, `docs/agent-native-plan.md`); read the relevant plan before large changes to OKSAT or the graph system. `docs/feature-requests.md` is the *product* backlog (ranked utility × feasibility) — distinct from the engineering roadmap in `docs/agent-native-plan.md`. Plan docs are **historical records** of executed work (each carries a Status header) — trust the code over a plan when they disagree.
- **Documentation second pass (required):** after any significant change, once the code itself is done and verified, run a docs pass as a separate final step: update `README.md`, `WIP.md`, this file, and the owning `docs/*` file. The doc→subsystem map and the mechanical checklist live in `docs/docs-map.md` — the pass is deliberately checklist-shaped so it can be delegated to a smaller/cheaper model or agent. Never write facts that rot (node counts, file sizes, line numbers) into docs; point at the source file instead.
- Shard scratch directories (`scratchpad*/`) are gitignored — shards are merged into `data/kag-graph.json`, never committed raw.
