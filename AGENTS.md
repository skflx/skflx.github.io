# AGENTS.md

The canonical operating manual for every coding agent in this repository (Claude, Gemini, Antigravity, any other). `CLAUDE.md`, `.claude/CLAUDE.md`, `.gemini/GEMINI.md` and `.agents/AGENTS.md` only point here: edit this file, never them.

## Cross-agent instruction synchronization & implementation planning standard

1. **Instruction synchronization.** The pointer files (`.claude/CLAUDE.md`, `.gemini/GEMINI.md`, `CLAUDE.md`, `.agents/AGENTS.md`) name this `AGENTS.md`. Project instructions are changed here only, so every agent works under identical rules. `tools/check-data.mjs` fails if a pointer file goes missing or stops naming `AGENTS.md`.
2. **Specs live in the repo; status lives in GitHub Issues.** Every plan has a spec: a Markdown file under `plans/` (`plans/<YYYY-MM-DD>-<task-name>.md`, indexed in `plans/README.md`) holding its decisions, contracts and data, changed only through PRs. Its status lives in GitHub Issues: one parent issue per plan and one sub-issue per work package, labelled `wave:n`, `model:<name>|owner`, `type:wp|review|decision` (plus `blocked`). The owner sets the roster per wave (see Models & roles). A WP issue body is its task (Goal, Model, Depends, Read, Touch, Steps as a task list, Acceptance, Escalate). A PR names `Closes #n` for each WP it finishes. An agent with GitHub access ticks its issue's task list; one without reports in its PR and the orchestrator updates the issue. No checklist is duplicated in the repo.
3. **Pruning.** At the end of each wave the orchestrator closes finished or abandoned WP issues with a one-line reason and rewrites stale ones, so open issues are always live work.

## Models & roles

| Model | Does | Never |
|---|---|---|
| **Owner** | Decides, vets medical content, merges to `master` (deploy) | — |
| **Orchestrator** (generally Fable or Opus) | Plans and specs; anatomy and medical data; checkpoints; adjudicates reviews; keeps the plan's checklist honest | Routine wiring it could spec instead |
| **Executor** (generally Sonnet or Haiku/Flash) | Executes work packages (WPs) to their acceptance, inside their Touch list | Anatomy or clinical judgment, owner decisions, files outside Touch, changing a plan's contracts (it writes `BLOCKED: <why>` under the WP instead) |
| **Adversarial reviewer** (named per wave by the owner) | Independent review of a wave's diff against its spec; the orchestrator adjudicates when it is not the reviewer | Pushing fixes |

The owner decides the roster for each wave. Protocol: `docs/delegation.md`.

## Skills

`.claude/skills/<name>/SKILL.md` are task playbooks (`ascii-diagram`, `oksat-guide`, `oksat-module`, `skillsmith`). Claude invokes them as skills; any other agent reads the file and follows it as written. `/skillsmith` writes, audits and prunes skills against each skill's `evals.json`; spec `plans/2026-11-10-skillsmith.md`.

## What this is

A static GitHub Pages site (skflx.github.io): a personal one-pager for an otolaryngology resident plus a small set of self-contained clinical study tools. **There is no build step, no framework build, no bundler, ever.** Every page is plain HTML, CSS and vanilla JS served as-is. The only npm dependencies are dev-only test tooling: `playwright`, and `axe-core` (pinned to 4.10.2 for the accessibility scan; pending owner approval, `docs/decisions.md` §12). Nothing shipped touches `node_modules`.

## Commands

```bash
# Serve locally (required: file:// breaks pages that fetch)
python3 -m http.server 8000    # http://localhost:8000/

# After editing any css/ or js/ file: refresh the ?v= cache-busting stamps
node tools/stamp-assets.mjs      # rewrites stale stamps in every root *.html

# Verify a change before pushing (also run in CI on every PR)
node tools/check-data.mjs        # data + security invariants + asset stamps (deps-free, instant)
node tools/smoke-pages.mjs       # every page boots, zero real console errors
node tools/test-a11y.mjs         # axe-core accessibility scan, report-only (--check: fail on new violations vs tools/a11y-baseline.json)
node tools/test-oksat-engine.mjs # engine behavior: answer-lock, SRS, review attempts, keyboard, navigation
node tools/test-oksat-learn.mjs  # Interactive learning viewer: prompts, checkers, inline module questions, step/core, deck, hub, term popover
node tools/test-search.mjs       # search.html and the CPT deep link, desktop and phone, real browser
node tools/test-palette.mjs      # Cmd/Ctrl-K command palette: lazy load, filter, Enter/Esc, opt-outs, wiki failing
node tools/test-airway-resume.mjs # Airway Rounds saved games: per-tab saves, resume, zero external requests
node tools/lint-oksat.mjs [slug]  # OKSAT module quality spec (no slug: every module; CI runs it, so all must come back clean)
node tools/lint-oksat-guide.mjs [slug]  # OKSAT guide teaching-shape lint (no slug: every guide; CI runs it)
node tools/lint-skills.mjs       # house skills: structure, evals.json schema, registration
node tools/test-ssb.mjs          # SSB: every section; --only a,b for some; CI runs it as --shard i/2
node tools/ssb-content.mjs       # SSB knowledge graph alone (check-data runs it too)
node tools/ssb-content.mjs --queue # SSB owner review queue: draft nodes whose cited sources are all verified

# ASCII 3D figures: preview as text, then refresh the baked no-JS frames
node tools/ascii3d.mjs render <id> --inks   # the exact frame + its ink map
node tools/ascii3d.mjs bake                 # then re-run stamp-assets
```

The browser suites need only a real Chromium: all page scripts are same-origin (React and htm are vendored). Verification detail: `docs/verification.md`. CI (`.github/workflows/ci.yml`) is verification only; there is no build step. Deploy = merge to `master` (GitHub Pages serves the repo root directly).

## Architecture

Three independent systems share the repo, plus two in progress (the wiki scaffold, and SSB) and one shared component (the figures). They share no state, only the design tokens, the theme key, and the figure engine.

### Design system
`css/site.css` is the one palette, type and chrome: paper and ink, hairline rules, Archivo and IBM Plex Mono self-hosted in `fonts/`, and two audiogram signal colours (`--signal` red = act/emphasis, `--signal-2` blue = science). `css/oksat.css` mirrors it as `--ok-*` tokens. Theme is `html[data-theme]`, applied pre-paint by `js/theme-boot.js` (every page, in `<head>`) and toggled by `js/site.js`, persisted as `sk_theme`. Rules: `docs/decisions.md` §5.

### 1. The one-pager (`index.html`)
`css/site.css` + `css/onepager.css` + `js/site.js` + `js/onepager.js`. Five numbered sections (`.block[data-fold]`), all folded at load and opened from their heads (folded pre-paint by CSS under `@media (scripting: enabled)`; open without JS; a hash or link into one opens it). Sticky section heads at ≥960px; one column on phones. The hero's portrait (`images/portrait-cutout.webp`, on a `.cutout` plate) is hidden and opens from the "MD" word (`docs/decisions.md` §10). About shows a static 2D cochlea SVG; its ASCII 3D scene `js/diagrams/cochlea.js` (fitted to the owner's own CT and implant, FLEX28; those numbers change only on the owner's word) opens as an egg from the word "electrode". The residency year (`#pgy-status`) is computed in `js/onepager.js` (rolls over July 1, capped at PGY-5), with the current value duplicated in the HTML as a no-JS fallback: **change both together or neither.**

### 2. OKSAT (OHNS Knowledge Self-Assessment Tool)
- **Pages:** `oksat.html` (hub; logic in `js/oksat/hub.js`), `oksat-study.html?m=<slug>[&c=<concept>]` (question viewer; boot in `js/oksat/viewer.js`) and `oksat-learn.html` (Interactive learning viewer). `?m=` is untrusted input: it only selects a manifest entry and reaches the DOM as `textContent`.
- **Engine:** `js/oksat/engine.js` renders every module with React 18 UMD and `htm` from `js/vendor/` (hashes pinned): tagged templates, **no JSX build**. `ItemView` is closure-private and prop-coupled; never try to export or import it.
- **Modules are data files:** one per module in `js/oksat/modules/`, ending with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`, plus one manifest entry in `js/oksat/manifest.js` (which also owns `OKSAT_SUBSPECIALTIES`, the one-hue-per-subspecialty map). Adding content never touches the engine. Modules are hand-authored. Schema: `docs/authoring-oksat.md`; new modules follow `.claude/skills/oksat-module/SKILL.md`. The engine renders plain text only (`\n` and `• `; no markdown).
- **Storage is local only.** `js/oksat/store.js` (`window.OKSATStore`) is the one adapter: guarded reads and writes, identity resolution, and the one-time `mcq:*` → `oksat:*` migration. Keys keep a trailing `:<code>` namespace; `OKSATStore.reviewer()` resolves it. **Existing progress is stored under that namespace; do not flatten it without migrating the data.** Key registry: `docs/decisions.md` §3.
- **Interactive learning** (spec `docs/authoring-oksat-guide.md`, playbook `.claude/skills/oksat-guide/SKILL.md`, `/oksat-guide`): `oksat-learn.html?g=<slug>[&c=<chapter>]` + `js/oksat/learn.js` + `css/oksat-learn.css`. A guide is a series of chapters, one data file each in `js/oksat/guides/<slug>/` ending `window.__OKSAT_CHAPTER = {...}`, registered in `OKSAT_GUIDES` (same file as the module manifest). Sections hold blocks (text, tables, callouts, checkers, figures, and the anatomy blocks `hotspot`, `layers`, `neighbors`, `sequence`), predict-then-reveal `check` prompts, module questions answered in place by reference (`practice`), and `drill` links into the question modules by concept. Guide text uses a small inline markup (`**bold**`, `*italic*`, `[[src|…]]`, `[[A|pos|…]]`) that the viewer parses into DOM nodes: nothing from a data file or the URL reaches `innerHTML`. Every specialty abbreviation is defined once in the shared lexicon `js/oksat/terms.js` and marked where it appears; general medical ones (NSAID and similar) are listed as `PLAIN` and never marked. `check-data` fails an acronym-shaped token the lexicon does not know, and a lexicon entry no guide uses. Progress is `oksat:learn:<slug>:<code>` via `OKSATStore.getLearn/saveLearn`; **a guide never writes a module's progress or SRS.** Each module loads in its own throwaway same-origin frame (module files declare top-level `const`s, so two cannot share a page). `check-data` validates counts, block types, markup, figures, and that every `practice` ref and `drill` concept resolves, so renaming a module concept or item id that a guide uses fails CI.
- **sk.oto links:** `OKSAT_SKOTO` in `js/oksat/manifest.js` (`live`, `base`, one map path per subspecialty) gives each module and guide a "Read the map in sk.oto" link, shown only when `live` is true. The maps table holds only verified live URLs; `check-data` validates it.
- **Design:** `docs/design-principles.md`, implemented as tokens in `css/oksat.css`. Every question opens on a recall gate: answer from memory and self-grade, or show the choices and answer as a locked-first-attempt MCQ. The engine tags each item's path (`mode` `recall`/`mcq`). Leitner spaced repetition weights a cold recall above a correct MCQ and resurfaces misses: a due item reopens fresh at the gate, and one review attempt per due date moves only its box, so the first attempt stays the locked record. Keyboard-first. The engine tolerates sparse modules: missing data removes UI rather than breaking it.

### 3. Airway Rounds (`airway-jeopardy.html`)
Deliberately **self-contained** (`js/airway/app.js` + `js/airway/engine.js` + `js/airway/questions.js`, same-origin CSS/fonts) so it runs on bad conference-room wifi or none; its CSP names no remote origin. Keep it that way: adding any external request to this page defeats its purpose. The game stage follows the site theme, on `--aw-*` tokens: light for rooms, dark for projectors.

### Figures: ASCII 3D (`js/ascii3d.js`, `js/diagrams/`, `css/ascii3d.css`)
Every figure is real geometry rendered into a monospace grid: one scene per file in `js/diagrams/<id>.js` (`ASCII3D.define`), drawn by the shared engine, which turns it, takes drag and keys, and re-shades on a theme flip. The engine core is DOM-free, so `tools/ascii3d.mjs` renders the same frames in Node: terminal previews, and the baked no-JS frame between `<!-- a3d:<id> -->` markers in each page. `tools/check-data.mjs` fails on a stale bake, an orphan scene, or a page missing the engine, scene or CSS. Inks are roles (`ink`, `signal`, `science`, …) mapped to tokens; printable ASCII only. New figure requests follow `.claude/skills/ascii-diagram/SKILL.md`; reference `docs/diagrams.md`.

Figures open as **eggs**: a `.egg[data-egg]` word in the text unfolds its `.egg-figure` in place (`js/egg.js`, `css/egg.css`; hidden only under scripting). The three in use are the cochlea (About), binaural pitch fusion (Research) and the larynx (Airway Rounds heading). `tools/smoke-pages.mjs` clicks them; `check-data` does not check egg markup.

### Atlas (`atlas.html`)
Unlisted (`noindex`; the only page that links to `ssb.html`; `OLSB.html` is also linked by the guide viewer's hotspot block, which opens a selected structure as `#m=3d&sel=<glossary id>`). A midsagittal right hemisection drawn as hand-authored SVG with no visible labels: hover or focus lights a group in its subspecialty's hue. Source `tools/atlas/anatomy.json` (Opus authors it; the owner vets every bake); `tools/atlas.mjs` bakes the SVG between the `<!-- atlas:svg -->` markers and checks it. Schema and sources: `docs/atlas.md`. `check-data` ("atlas and unlisted pages") enforces the bake and the link rules.

### Other pages
- `search.html`: one box over the OKSAT question modules and the CPT table; logic in `js/search.js`. The index is built in memory on each load; nothing is persisted.
- `cpt-search.html`: `css/site.css` + a page `<style>`; logic in `js/cpt-search.js`. Do not create a second token set.
- `review.html`: unlisted owner review list (`noindex`, linked from `atlas.html` only); its items are `js/review-items.js` (`window.__REVIEW_ITEMS`), logic in `js/review.js`, ticks in `sk_review:<id>`. Items are added or updated by the work package that needs the owner's eye (`docs/delegation.md`).
- `pdf-chapter-splitter.html`: in-browser PDF chapter splitter on `css/site.css`; logic in `js/pdf-chapter-splitter.js`; pdf-lib and JSZip vendored in `js/vendor/`. Makes no third-party request.
- `OLSB.html`: otology and lateral skull base, **unlisted** (`noindex`; reached through `atlas.html` and the guide viewer's hotspot block; keep it that way unless the owner says). Three modes behind one switch: the default 3D model, the 2D dioramas (the fallback without WebGL and the target of every `#d=`/`#p=` link), and Real CT.
  - **3D model:** `js/olsb/volume.js` (DOM-free; builds a labelled volume in mm, x lateral / y anterior / z superior, origin at the oval window, on a 0.3 mm specimen grid, a 0.1 mm middle-ear grid aligned to it, and a movable 8 mm cube at 0.05 mm; it carves drill states). The page runs the same file as its Web Worker. `tools/check-data.mjs` builds it in Node and requires its geometry to agree with every glossary `rel` between two drawn structures, so move anatomy and fix relations together. `js/olsb/mesh.js` (DOM- and three.js-free, run in the worker) meshes it: smooth surface nets on an occupancy field softened by each voxel's sub-voxel depth, the volume's `dep`, which every paint in `build()` writes from its shape's distance, so a new shape must write `IN`/`OUT` depths too; or blocks. `js/olsb/3d.js` draws it on the vendored three.js (an ES module), lit, coloured by `--olsb-*` tokens, with picking by walking the voxel grid and hash `#m=3d…`. Labels are glossary ids.
  - **2D dioramas:** one file each (`js/olsb/lateral.js`, `js/olsb/medial.js`, `js/olsb/axial.js`, `js/olsb/coronal.js`), each pushing `{layers, structures, tours, views}` onto `window.OLSB`. `js/olsb/glossary.js` (loaded first) holds names, notes and directional `rel` (sup/inf/ant/post/med/lat; reverses added at runtime) once per anatomical id; `js/olsb/shapes.js` draws the ossicles, cochlear section and air cells in mm via `place()`. Each diorama declares its `scale` (px per mm, drawn as a live scale bar). A structure drawn in several dioramas keeps one id. `js/olsb/main.js` draws them as inline SVG on `--olsb-*` tokens in `css/olsb.css`. Rendering conventions per structure: `shade: 'dome'|'pit'`, `kind: 'bonesec'`, tube casings, `inner` lumens, `clip`.
  - **Real CT** (`js/olsb/ct.js`, hash `#m=ct[&pl=ax|cor|sag][&at=<mm>]`): slices of the UW volume in `tbone/` on a 2D canvas, through the generic functions of `js/ssb/volume.js`. Nothing under `tbone/` is fetched until the mode is entered.
  - Geometry is schematic and content is draft; the owner verifies.
- `ssb.html`, `ssb/`: see SSB below.

### SSB — Sinus & Skull Base 3D (`ssb.html`)
**Unlisted**: only `atlas.html` links to it. Two stages over one typed knowledge graph (`ssb/content/`), every fact a node with typed edges and sources, geometry keyed by the same ids: **Specimen** (pick, tree and search identify structures) and **Scope** (a rigid endoscope through the specimen, for traversal). **Read `docs/ssb.md` before any SSB work.** Status is GitHub issue #266 and its sub-issues; the spec is `plans/2026-10-07-ssb-roadmap.md`; content rules are `docs/authoring-ssb.md`.

Rules that bite:
- **Generated data is never hand-edited.** `ssb/ct/`, `ssb/geometry/` and `ssb/models/` come from `tools/ssb-pipeline/`; the UW ground truth it reads is in `tools/ssb-pipeline/uw/reference/`, never served. Regenerate them; never hand-place a cut, a carved voxel, a pose or a mesh.
- **Before deleting a data file, grep `tools/` for its readers.** Pipeline inputs live under `tools/ssb-pipeline/`, never under the served `ssb/`.
- **Never write fixture files into `ssb/`.** Tests build synthetic data (`tools/ssb-fixture-ct.mjs`), routed by Playwright.
- **Ids are never renamed; coordinates never go in content.** Every name in geometry is a graph id; parts are `<graph id>.<side>`. `tools/check-data.mjs` enforces both.
- **Content is `review: "draft"`; only the owner sets `verified`** (medical correctness, `docs/decisions.md` §7). `verified` on a source means exists-as-cited, not supports-the-claim.
- **Credit the UW atlas and its institution, never its authors by name** (`ssb/LICENSE-data.md`).
- **Page code** is ES modules in `js/ssb/`, on three.js vendored in `js/vendor/three-0.186.1/`. Materials are procedural from `--ssb-*` tokens (`js/ssb/materials.js`), never textures. After any change under `js/ssb/` or `ssb/`, run `node tools/stamp-assets.mjs`.
- **Test sections:** `node tools/test-ssb.mjs --only <section>[,<section>…]` (`specimen`, `scope`). CI runs `--shard i/2`; `SHARDS` in the file holds the split.
- **Image generation** runs outside the repo (`docs/ssb-imagegen.md`); generated pixels never carry an anatomical claim.

### sk.oto wiki
The owner's `sk.oto` vault is published as a Quartz wiki from the separate repo `skflx/ohns-wiki-skflx` (live at `skflx.github.io/ohns-wiki-skflx/`) by that repo's own sync. This repo holds none of it; it links to the wiki only through `OKSAT_SKOTO` in `js/oksat/manifest.js`.

### Temporal bone reference volume (`tbone/`)
Generated internal reference data: a 0.3 mm display volume of the UW normal temporal bone CT in OLSB's frame, with labelled points and traced centrelines. Produced by `tools/tbone-pipeline/` and never hand-edited. OLSB's Real CT mode loads it lazily; `tools/check-data.mjs` compares OLSB's structures with the UW landmarks (enforcing, with owner-vetted exceptions; see `TRUTH_CLASS`). Read `tbone/README.md` first.

### `archive/`
Kept content, **served by nothing**: no page fetches it, no test checks it. Currently the OHNS knowledge graph from the retired atlas viewers, as JSON and a flat text rendering. Read `archive/README.md` first; most nodes are unverified scaffolding, not a clinical reference. Do not wire it back into a page, and do not delete or rewrite it, without the owner.

## Conventions

- **Routine decisions are pre-answered.** For which CSS or JS a new page uses, retiring a page, the localStorage key registry, adding a module or subspecialty, and what must be escalated, follow `docs/decisions.md` instead of inferring from precedent. How to prove a change works: `docs/verification.md`.
- **Repo layout:** pages stay at the root, so their URLs never move (`Fusion.html`'s is printed in its QR code). A single-file page's script is `js/<page>.js`; a system with several scripts gets a folder, `js/<system>/` with unprefixed names. Shared chrome (`js/site.js`, `js/theme-boot.js`, `js/ascii3d.js`) sits at the `js/` root; every image is under `images/`. ES modules one folder down import vendored code through `../vendor/`.
- **Retiring a page means deleting it** (owner decision): no redirect stubs. Remove it from `PAGES` in `tools/smoke-pages.mjs` in the same change, and grep for inbound links.
- **Vanilla JS, guarded IIFEs, defensive throughout:** wrap `localStorage` and DOM access in try/catch no-ops; storage reads are fail-safe; degrade gracefully rather than throw.
- **Token-driven theming everywhere:** components consume CSS custom properties, never raw values; theme and font switching is an attribute flip on `<html>` (`data-theme`, `data-font`). Colour always means something (the two audiogram signals; one hue per subspecialty), never decoration.
- **Security rules** (`docs/security.md`, enforced by `tools/check-data.mjs`): every page has a CSP `<meta>` with `script-src 'self'`; **no inline `<script>`, no `on*=` handlers**; page logic goes in `js/<page>.js`; no third-party scripts (vendor into `js/vendor/` and pin the hash); anything reaching `innerHTML` is escaped, anything from the URL goes through `textContent`. No new external dependency (CDN, font service, analytics) without the owner.
- **Asset stamps:** every `<link>`/`<script>` into `css/` or `js/` carries `?v=<first 8 hex of the file's SHA-256>` (`tools/stamp-assets.mjs`; `tools/check-data.mjs` fails on a stale one). Never hand-edit a stamp; rerun the tool `js/palette.js`, which `js/site.js` fetches, is stamped by the `PALETTE_V` line in `js/site.js`.
- **No secrets, and no key fields.** Nothing in the repo reads a credential. Do not reintroduce one.
- **localStorage namespaces:** `sk_*` (site chrome), `oksat:*` (OKSAT), `ssb:*` (SSB), plus CPT's legacy `cpt-history`/`cpt-analytics`. Full registry: `docs/decisions.md` §3.
- **Indentation** (`.editorconfig`): 4 spaces for HTML and JS, 2 for CSS and Markdown.
- **`docs/wip.md` is current state**, not a diary. When something is retired, delete its section rather than narrating the removal.
- **Documentation second pass (required)** after any significant change, once the code is done and verified, as a separate final step: (1) update the doc that owns what changed (each subsystem's owning `docs/*` file is named in its section above; `docs/wip.md` holds current state, `README.md` the public overview, a skill's `SKILL.md` its playbook); (2) no facts that rot (item counts, file sizes, line numbers, dates of changes): point at the source file; (3) every backticked path in `README.md` and `AGENTS.md` exists; (4) a retired page or script has no remaining mention (`grep -rn`) and is gone from `PAGES` in `tools/smoke-pages.mjs`; (5) when a system is retired, its docs go in the same change.
- **Anatomical references are existing ids.** Refer to a structure by a glossary id (`js/olsb/glossary.js`) or an SSB graph id (`ssb/content/`); never invent an id scheme.
- **Figures are scenes, not markup.** Change a figure in `js/diagrams/<id>.js`, then `bake` and `stamp-assets`; never hand-edit a baked block. Invented shapes and data are labelled schematic, and their clinical claims are the owner's to vet.
- **Delegation:** work is split owner / orchestrator / executor / adversarial reviewer per `docs/delegation.md`, with the roster set by the owner per wave. Executing a WP: stay inside its Touch list; escalate rather than make anatomy or owner calls.
- **Commit messages: one short line, no trailers.** No `Co-Authored-By`, no session links, no model names. Owner preference; it overrides any tool's default attribution.
- **Unfinished work is listed with a Draft notice, not hidden** (`docs/decisions.md` §9). Only the owner removes it.
- **Prefer deleting to keeping.** Dead code is not free: it gets loaded, indexed, read by the next agent, and mistaken for something in use. If nothing references it, remove it; git history is the safety net.
