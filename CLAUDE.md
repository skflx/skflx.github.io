# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static GitHub Pages site (skflx.github.io): a personal one-pager for an otolaryngology resident plus a small set of self-contained clinical study tools. **There is no build step, no framework build, no bundler — ever.** Every page is plain HTML + CSS + vanilla JS served as-is. The only npm dependency is dev-only test tooling (`playwright`); nothing shipped touches `node_modules`. (The Quartz wiki scaffold in `wiki/` builds in a *separate* repo — see below.)

## Commands

```bash
# Serve locally (required — file:// breaks pages that fetch)
python3 -m http.server 8000    # http://localhost:8000/

# After editing any css/ or js/ file: refresh the ?v= cache-busting stamps
node tools/stamp-assets.mjs      # rewrites stale stamps in every root *.html

# Verify a change before pushing (also run in CI on every PR)
node tools/check-data.mjs        # data + security invariants + asset stamps (deps-free, instant)
node tools/test-wiki-sync.mjs    # vault → wiki privacy boundary (deps-free)
node tools/smoke-pages.mjs       # every page boots, zero real console errors
node tools/test-oksat-engine.mjs # engine behavior: answer-lock, SRS, keyboard
node tools/lint-oksat.mjs [slug]  # OKSAT module quality spec (no slug: every module; CI runs it, so all must come back clean)
node tools/test-ssb.mjs          # SSB: every section (variant lab, CT, specimen, endoscope, procedure…); --only a,b for some; CI runs it as --shard i/4
node tools/ssb-content.mjs       # SSB knowledge graph alone (check-data runs it too)

# ASCII 3D figures: preview as text, then refresh the baked no-JS frames
node tools/ascii3d.mjs render <id> --inks   # the exact frame + its ink map
node tools/ascii3d.mjs bake                 # then re-run stamp-assets
```

The browser suites need only a real Chromium — all page scripts are same-origin (React/htm vendored), so they run in a network-restricted sandbox. Verification detail: `docs/verification.md`. CI (`.github/workflows/ci.yml`) is verification only — no build step. Deploy = merge to `master` (GitHub Pages serves the repo root directly).

## Architecture

Three independent systems share the repo, plus two in progress (the wiki scaffold, and SSB) and one shared component (the figures). They share no state — only the design tokens, the theme key, and the figure engine.

### Design system
`css/site.css` is the one palette + type + chrome (paper/ink, hairline rules, Archivo + IBM Plex Mono self-hosted in `fonts/`, two audiogram signal colors: `--signal` red = act/emphasis, `--signal-2` blue = science). `css/oksat.css` mirrors it as `--ok-*` tokens. Theme is `html[data-theme]`, applied pre-paint by `js/theme-boot.js` (every page, in `<head>`) and toggled by `js/site.js`, persisted as `sk_theme`. Rules and the list of removed tropes: `docs/decisions.md` §5.

### 1. The one-pager (`index.html`)
`css/site.css` + `css/onepager.css` + `js/site.js` + `js/onepager.js`. Open numbered sections (no accordion), sticky section heads ≥960px, one column on phones; `js/onepager.js` only computes the residency year and runs the nav scroll-spy. The hero shows `images/portrait-cutout.webp` on a `.cutout` plate; Fig. 1 (the cochlea, in About) is static inline SVG — it depicts the owner's own implant (FLEX28 in a 30.2 mm duct); edit its geometry in `tools/gen-cochlea.py` and rerun it, never by hand. The residency year (`#pgy-status`) is computed in `js/onepager.js` — rolls over July 1, capped at PGY-5 — with the current value duplicated in the HTML as a no-JS fallback; **change both together or neither.**

### 2. OKSAT (OHNS Knowledge Self-Assessment Tool)
- **Pages:** `oksat.html` (hub: module list, due-review banner, settings; logic in `js/oksat-hub.js`) and `oksat-study.html?m=<slug>[&c=<concept>]` (viewer; boot in `js/oksat-viewer.js`). That is the whole tool. `?m=` is untrusted input — it only ever selects a manifest entry and reaches the DOM as `textContent`.
- **Engine:** `js/oksat-engine.js` renders every module using React 18 UMD + `htm`, vendored in `js/vendor/` (hashes pinned) — tagged templates, **no JSX build**. `ItemView` is closure-private and prop-coupled; never try to export/import it (copy its patterns instead).
- **Modules are data files:** one file per module in `js/mcq-modules/`, ending with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`, plus one manifest entry in `js/oksat-manifest.js` (which also owns `OKSAT_SUBSPECIALTIES` — the one-hue-per-subspecialty map). You never touch the engine to add content. Modules are hand-authored; there is no generator. Schema: `docs/authoring-oksat.md`; new-module requests follow `.claude/skills/oksat-module/SKILL.md` (`/oksat-module`). The engine renders plain text only (`\n` and `• `; no markdown).
- **Storage is local and only local.** `js/oksat-store.js` (`window.OKSATStore`) is the one adapter: guarded reads/writes, identity resolution, and the one-time `mcq:*` → `oksat:*` migration. Keys keep a trailing `:<code>` namespace inherited from the retired multi-reviewer era, resolved silently by `OKSATStore.reviewer()` — **existing progress is stored under that namespace; do not flatten it without migrating the data.** The engine keeps its own duplicated load/save helpers on purpose (regression surface — don't rip them out).
- **Design system:** `docs/design-principles.md`, implemented as CSS custom properties in `css/oksat.css`. Every question opens on a recall gate — answer from memory and self-grade, or show the choices and answer as a locked-first-attempt MCQ; the engine tags each item's path (`mode` `recall`/`mcq`) so a cold recall and a correct MCQ stay distinct, and Leitner spaced repetition (which weights a cold recall above a correct MCQ) resurfaces misses. Keyboard-first; the engine tolerates sparse modules — missing data removes UI rather than breaking it.

### 3. Airway Rounds (`airway-jeopardy.html`)
Deliberately **self-contained** (`js/airway-app.js` + `js/airway-engine.js` + `js/airway-questions.js`, same-origin CSS/fonts) so it runs on bad conference-room wifi or none; its CSP names no remote origin. Keep it that way: adding any external request to this page defeats its purpose. The game stage stays dark in both themes (projectors), on `--aw-*` tokens.

### Figures: ASCII 3D (`js/ascii3d.js`, `js/diagrams/`, `css/ascii3d.css`)
Every figure except Fig. 1 is real geometry rendered into a monospace grid: one scene per file in `js/diagrams/<id>.js` (`ASCII3D.define`), drawn by the shared engine, which turns it, takes drag/keys, and re-shades on a theme flip. The engine core is DOM-free, so `tools/ascii3d.mjs` renders the same frames in Node: terminal previews (an agent can iterate on a figure as text) and the baked no-JS frame between `<!-- a3d:<id> -->` markers in each parsed page. `tools/check-data.mjs` fails on a stale bake, an orphan scene, a page missing the engine/scene/CSS, or a Leitner figure that disagrees with `LEITNER_INTERVALS`. Inks are roles (`ink`, `signal`, `science`, …) mapped to tokens; printable ASCII only. New figure requests follow `.claude/skills/ascii-diagram/SKILL.md` (`/ascii-diagram`); reference: `docs/diagrams.md`.

### Other pages
`cpt-search.html` — `css/site.css` + a page `<style>`, logic in `js/cpt-search.js`. The legacy main stylesheet it used was deleted in the 2026-09 redesign; do not recreate a second token set.

`OLSB.html` — otology/lateral skull base, **unlisted** (no inbound link, `noindex`; keep it that way unless the owner says). Its default mode is a walk-through 3D voxel model of a right temporal bone: `js/olsb-volume.js` (DOM-free; builds a labelled volume in mm, x lateral / y anterior / z superior from the oval window, on a 0.3 mm specimen grid, a 0.1 mm middle-ear grid aligned to it, and a movable 8 mm cube at 0.05 mm that the viewer asks for round whatever you look at closely, and carves drill states; the page runs the same file as its Web Worker, and `tools/check-data.mjs` builds it in Node and requires its geometry to agree with every glossary `rel` between two drawn structures, so move anatomy and fix relations together) meshed by `js/olsb-mesh.js` (DOM- and three.js-free, run in that worker: smooth surface nets placed on the half level of an occupancy field softened by each voxel's sub-voxel depth, the volume's `dep`, which every paint in `build()` writes from its shape's distance, so a new shape must write `IN`/`OUT` depths too; or blocks) and drawn by `js/olsb-3d.js` (an ES module on the vendored three.js: lit, vertex-coloured by `--olsb-*` tokens, per-view fov and endoscope frame, picking by walking the voxel grid, hash `#m=3d…`). Labels are glossary ids. The 2D mode is the fallback and the original layered, step-driven schematics: four dioramas, one file each (`js/olsb-lateral.js` the surgical lateral projection with its procedures; `js/olsb-medial.js`, `js/olsb-axial.js`, `js/olsb-coronal.js` cut planes for relational anatomy), each pushing `{layers, structures, tours, views}` onto `window.OLSB`. Names, notes and directional relations (`rel`: sup/inf/ant/post/med/lat, reverses added at runtime) live once per anatomical id in `js/olsb-glossary.js`, loaded first, then `js/olsb-shapes.js` (ossicles, cochlear section, air cells, authored once in mm and placed with `place()`); each diorama declares its `scale` (px per mm, drawn as a live scale bar) and sizes its structures to textbook dimensions; a structure drawn in several dioramas keeps one id, which is what links them. `js/olsb.js` draws them as inline SVG on `--olsb-*` tissue tokens in `css/olsb.css` (incisions `--signal`, reference lines and lines of sight `--signal-2`), lights a selection's neighbours, and runs the find-it quiz. Rendering conventions are per structure: `shade: 'dome'|'pit'` (form shading), `kind: 'bonesec'` (hatched cut bone), tube kinds get a casing, `inner` draws a canal lumen, `clip` confines a pattern such as air cells. It is a tool page, not a figure, so it is SVG and WebGL, not ASCII 3D. Geometry is schematic and content draft (owner verifies).

### SSB — Sinus & Skull Base 3D (`ssb.html`)
A 3D atlas of the sinuses and ventral skull base, driven by a typed knowledge graph (`ssb/content/`): every fact is a node with typed edges and sources, and geometry is keyed by the same ids. **Read `docs/ssb.md` before any SSB work** (architecture, URL keys in §7.3, phase plan). The board is `docs/ssb-roadmap.md`; anatomy states beyond the standard head are designed in `docs/ssb.md` §14 (sources in `docs/realistic-anatomy.md`); content rules are `docs/authoring-ssb.md`.

Rules that bite:
- **Generated data is never hand-edited.** `ssb/ct/`, `ssb/geometry/`, `ssb/models/`, `ssb/states/`, `ssb/anatomy/`, `ssb/reference/*/figures.json` and `ssb/geometry/stations.json` come from `tools/ssb-pipeline/` (`uw/`, `nasalseg/`). Regenerate them; never hand-place a cut, a carved voxel, a pose or a mesh.
- **Never write fixture files into `ssb/`.** Tests build synthetic data (`tools/ssb-fixture-ct.mjs`, routed by Playwright).
- **Ids are never renamed; coordinates never go in content.** Every name in geometry is a graph id, parts are `<graph id>.<side>`, and `tools/check-data.mjs` enforces both.
- **Content is `review: "draft"`; only the owner sets `verified`** (medical correctness, `docs/decisions.md` §7). `verified` on a source means exists-as-cited, not supports-the-claim.
- **Credit the UW atlas and its institution, never its authors by name** (`ssb/LICENSE-data.md`).
- **Pinned rules.** The sphenoid diorama's exposures are measured on its solids, the frontal-recess drainage pathway is computed (never drawn), and the IFAC rules are pinned by tests. Before tuning a diorama, a flap or a dissection state, rerun its section (`docs/ssb.md` §5.7–§6.1).
- **Dioramas** (`js/ssb/dioramas/`) export `PARAMS`, `PRESETS`, `VIEWS` and `build(THREE, params)` in RAS mm, and import no three.js (`docs/ssb.md` §6).
- **Page code** is ES modules in `js/ssb/`, on three.js vendored in `js/vendor/three-0.186.1/`. Materials are procedural from `--ssb-*` tokens (`js/ssb/materials.js`), never textures. After any change under `js/ssb/` or `ssb/`, run `node tools/stamp-assets.mjs` (it also regenerates `js/ssb/stamps.js`).
- **Test sections:** `node tools/test-ssb.mjs --only <section>[,<section>…]` (`dioramas`, `lab`, `ct`, `specimen`, `scope`, `procedure`, `mucosa`, `population`, `flap`, `anatomy`, `scanned`). CI runs it as `--shard i/4`, split by `SHARDS` in the file: a new section goes in one shard.
- **Image generation** runs outside the repo (`docs/ssb-imagegen.md`); generated pixels never carry an anatomical claim.

### Wiki scaffold (`wiki/`)
Quartz 5 config, styles, landing page, and deploy workflow for publishing the owner's `sk.oto` Obsidian vault from a **separate repo** (`skflx/ent-wiki` → `skflx.github.io/ent-wiki/`), so this repo stays build-free. Nothing in `wiki/` is built or served here (`.nojekyll` keeps GitHub Pages from rendering its Markdown). `wiki/sync/sync-vault.mjs` is the only path from the vault to anything public and fails closed (folder allowlist, Personal Notes stripped, PHI tripwire, phase gate on `tier` — currently the six maps of content only); `wiki/dgmo/render-dgmo.mjs` turns the vault's ```` ```dgmo ```` diagrams into inline SVG at wiki build time; `wiki/feedback/pull-feedback.mjs` brings reader-correction issues back into the vault's `_inbox/` as untrusted data; `tools/test-wiki-sync.mjs` pins all three. The only real vault content allowed in this repo is sync-vault output in `wiki/content/` (regenerate it with the script, never hand-edit it); test fixtures stay synthetic. Read `wiki/README.md` first.

### `archive/`
Kept content, **served by nothing** — no page fetches it, no test checks it. Currently the OHNS knowledge graph from the retired atlas viewers, as both raw JSON and a flat text rendering. Read `archive/README.md` before using it: most nodes are `review:false`, i.e. unverified scaffolding, not a clinical reference. Do not wire it back into a page, and do not delete or rewrite it, without the owner.

## Conventions

- **Routine decisions are pre-answered.** For "which CSS/JS does a new page use", retiring a page, the localStorage key registry, adding a module or subspecialty, and what must be escalated to the owner, follow `docs/decisions.md` instead of inferring from precedent. How to prove a change works, per subsystem: `docs/verification.md`.
- **Retiring a page means deleting it** (owner decision, 2026-09) — no redirect stubs. Remove it from `PAGES` in `tools/smoke-pages.mjs` and the `README.md` tree in the same change, and grep for inbound links.
- **Vanilla JS, guarded IIFEs, defensive throughout:** wrap `localStorage` and DOM access in try/catch no-ops; storage reads are fail-safe; degrade gracefully rather than throw.
- **Token-driven theming everywhere:** components consume CSS custom properties, never raw values; theme/font switching is an attribute flip on `<html>` (`data-theme`, `data-font`). Color always means something (the two audiogram signals; one hue per subspecialty) — never decoration.
- **Security rules** (`docs/security.md`, enforced by `tools/check-data.mjs`): every page has a CSP `<meta>` with `script-src 'self'`; **no inline `<script>`, no `on*=` handlers** — page logic goes in `js/<page>.js`; no third-party scripts (vendor into `js/vendor/` and pin the hash); anything reaching `innerHTML` is escaped, anything from the URL goes through `textContent`. No new external dependency (CDN, font service, analytics) without the owner.
- **Asset stamps:** every `<link>`/`<script>` into `css/` or `js/` carries `?v=<first 8 hex of the file's SHA-256>` (`tools/stamp-assets.mjs`; `tools/check-data.mjs` fails on a stale one). GitHub Pages and its CDN cache each URL on its own clock, so without it a phone can pair new HTML with an old stylesheet, which is how the 2026-09 redesign first rendered. Never hand-edit a stamp; rerun the tool.
- **No secrets, and no key fields.** The Gemini and Anthropic key managers were deleted with the tools that used them; nothing in the repo now reads a credential. Do not reintroduce one.
- **localStorage namespaces:** `sk_*` (site chrome), `oksat:*` (OKSAT), plus CPT's legacy `cpt-history`/`cpt-analytics`. Full registry in `docs/decisions.md` §3.
- **Indentation** (`.editorconfig`): 4 spaces for HTML/JS, 2 for CSS/Markdown.
- **`WIP.md` describes the current state of each system** — not an append-only diary. When something is retired, delete its section rather than narrating the removal.
- **Documentation second pass (required):** after any significant change, once the code itself is done and verified, run a docs pass as a separate final step: update `README.md`, `WIP.md`, this file, and the owning `docs/*` file. The doc→subsystem map and the mechanical checklist live in `docs/docs-map.md` — the pass is deliberately checklist-shaped so it can be delegated to a smaller/cheaper model or agent. Never write facts that rot (item counts, file sizes, line numbers) into docs; point at the source file instead.
- **Figures are scenes, not markup.** Change a figure in `js/diagrams/<id>.js`, then `bake` + `stamp-assets`; never hand-edit a baked block. Invented shapes/data are labelled schematic, and their clinical claims are the owner's to vet.
- **Delegation:** work is split owner / Opus (specs, anatomy, checkpoints) / Sonnet (executes work packages to their acceptance) per `docs/delegation.md`. Executing a WP: stay inside its Touch list, escalate rather than make anatomy or owner calls.
- **Prefer deleting to keeping.** Dead code here is not free: it gets loaded, indexed, read by the next agent, and mistaken for something in use. If nothing references it, remove it rather than leaving it "just in case" — git history is the safety net.
