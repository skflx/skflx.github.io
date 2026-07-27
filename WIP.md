# WIP - OHNS Knowledge Atlas Graph (KAG)

## Goal
Build a two-tool system hosted on GitHub pages for generating and viewing a knowledge graph of Otolaryngology concepts, with a self-contained spaced repetition testing system.

## Actions Taken

1. **Created Extractor (`kag-extract.html`)**
   - Built a self-contained HTML tool with a dark theme interface.
   - Added secure `localStorage` API key management for Anthropic.
   - Integrated streaming Claude API calls (`claude-sonnet-4-20250514`) using a strict JSON schema prompt to extract entities and relationships.
   - Built validation logic and preview UI (raw JSON output with node/edge counts).
   - Added Copy, Download (as patch string), and "Merge into Atlas" functionality pointing to `kag-graph` in `localStorage`.

2. **Created Atlas Viewer (`kag.html`)**
   - Built a rich, dark-themed Cytoscape.js interface with `cose-bilkent` layout mapping the knowledge graph.
   - Embedded ~40 seed nodes (temporal bone anatomy, pathologies like cholesteatoma, otosclerosis, and procedures) with 50+ relationships.
   - Built **Explore Mode** with double-click neighborhood isolation, text search, and category filter pills.
   - Built an interactive right-panel for node detail, connections, and flag-for-correction forms.
   - Built **Self-Test Mode** with a Leitner spaced-repetition queue. Calculates due cards (`nextReview <= today`), hides answers until revealed, uses connected nodes/edges as explicit hint cues, and recalculates spacing based on confidence grading (Again, Hard, Good, Easy).
   - Added Settings Modal to handle raw JSON Import/Export, complete state reset, and a centralized Corrections Inbox.

3. **Site Integration**
   - Updated `projects.html` to include links to both the Knowledge Atlas Graph and the KAG Extractor in the "Clinical Tools" section alongside the existing CPT Search tool.

## Technical Details 
- All styling and logic use Vanilla JS without build steps (Tailwind aesthetics implemented with native custom CSS properties). 
- State relies exclusively on `localStorage`. 

## Next Steps
The new HTML tools are ready. You can test them locally or push to master to deploy them live to GitHub Pages.

---

# WIP - OKSAT (OHNS Knowledge Self-Assessment Tool)

## Goal
Rename and expand the MCQ tool into OKSAT: unified hub, traversable knowledge
atlas, per-user completion synced to a repo database file, font themes, and a
Gemini-powered question generator. Full plan: `docs/oksat-plan.md`.

## Actions Taken
1. **Rename** — `oksat.html` / `oksat-study.html` / `js/oksat-*.js` /
   `css/oksat.css`; old `mcq*.html` are redirect stubs; `occ*.html` point at
   the new pages; localStorage `mcq:*` auto-migrates to `oksat:*`.
2. **Design** — `docs/design-principles.md`; four persisted font themes
   (Manuscript, Clinical, Atlas, Hyperlegible) behind an "Aa" topbar picker.
3. **Atlas** — Obsidian-style Cytoscape graph on the hub: subspecialty →
   module → domain → concept nodes, per-reviewer completion color-coding,
   concept deep links (`?m=<slug>&c=<concept>`), dashed crossover node to KAG.
4. **Database file** — `data/oksat-db.json` (dated per-reviewer completion,
   no secrets) with read/merge on load and rewrite via download-to-commit or
   a GitHub Contents API push using a runtime-only token (never stored).
5. **Question Forge** — `oksat-generate.html`: paste text → Gemini generates a
   full module in the embedded house style (mechanism → application → pearl);
   validates, previews, downloads the module file + manifest entry.
6. **Gemini key manager** — `js/oksat-ai.js`; key lives in localStorage only.

## Next Steps
Generate the first Forge module end-to-end with a real key; consider merging
KAG node data into the Atlas (both are Cytoscape element models).

---

# WIP — KAG term web + structural anatomy atlas

## Goal
Turn the KAG from a 40-node localStorage seed into the site's canonical,
committed knowledge graph, grown into a massive OHNS term web and wired
bidirectionally to OKSAT. Full plan: `docs/oto-kag-atlas-plan.md`.

## Actions Taken
1. **Externalized the KAG** to a committed file `data/kag-graph.json`
   (schema v2), read through a new store `js/kag-store.js` (fetch + merge where
   LOCAL WINS on progress, download / Contents-API push write paths). `kag.html`
   now boots from the store; `SEED_GRAPH` remains only as an offline fallback.
2. **Schema v2 + bidirectional OKSAT↔KAG links** — nodes carry `oksat.{modules,
   concepts,topics}`; concept links resolve to real module CONCEPTS keys.
   `?node=<id>` deep links tie the graphs together both ways.
3. **Term web** — expanded to ~656 nodes / ~929 edges across all 9
   subspecialties, fanned out one authoring agent per subspecialty, each shard
   validated + merged via `tools/kag-validate.mjs`.
4. **Structural anatomy atlas** — new `atlas.html`, a filtered *view* of the KAG
   (265 structural nodes, colored by `structure`, grouped by `region`); holds no
   data of its own, so a new structural node appears with zero atlas-code
   changes. Spatial seed (`laterality`, edge `direction`) captured for a future
   3D layer.
5. **Docs** — `docs/kag-schema.md` (v2 model + enums + merge contract),
   `docs/authoring-kag.md` (shard/validator authoring contract).

All authored (non-seed) content is DRAFT / `review:false`; only the vetted
40-node temporal-bone seed is `review:true`.

## Next Steps
Owner (resident) curated-source verification pass over the `review:false` nodes
to graduate DRAFT content. Phase 3 usage analytics is deferred (owner call,
2026-07 — not needed for now).

---

# WIP - Unified graph system (KAG + Structural Atlas + OKSAT graph)

## Goal
Merge the three graph surfaces into one system that manifests as three lenses,
removing the triplicated Cytoscape code while preserving every behavior.

## Actions Taken
- **One engine** (`js/graph-view.js`, `window.GraphView`): owns the single
  Cytoscape instance, cose-bilkent layout, neighborhood isolate, hover
  spotlight, debounced search, `?node=` deep-link, theme re-skin, toast, and the
  detail-panel shell. Lenses plug in via a fixed contract.
- **One page** (`graph.html`) with a Knowledge · Structural · Study lens switcher
  (`?lens=` / `?node=`) and consolidated chrome (`css/graph.css`).
- **Three lenses** (`js/graph-lens-{knowledge,structural,study}.js`): full ports
  of the former `kag.html`, `atlas.html`, and `js/oksat-atlas.js` engines.
- **Routing**: `kag.html` / `atlas.html` are redirect stubs (forward `?node=`);
  `js/oksat-atlas.js` is a compat shim (`loadModules()` kept for adaptive +
  dashboard; `mount()` delegates to the study lens); the `oksat.html` Atlas tab
  and `index.html` cards point at the unified graph. Net −2800 lines.

## Technical Details
- Vanilla JS, no build step; each lens is a guarded IIFE registered on
  `window.GraphLenses`. Data layer (`data/kag-graph.json` via `KAGStore`) and
  persistence keys (`localStorage['kag-graph']`, `oksat:*`) unchanged.

## Next Steps
Optional: retire the `kag.html`/`atlas.html` stubs once external links migrate.

---

# WIP — Agent-native hardening (docs, verification, issue roadmap)

## Goal
Make the repo workable by coding agents end-to-end: reproduce a bug, implement,
test, and verify on the real site with minimal owner input. Full audit:
`docs/agent-native-plan.md`.

## Actions Taken
1. **CLAUDE.md** added — the agent operating manual (hard rules, commands,
   architecture, conventions).
2. **Audit** of judgment chokepoints, verification gaps, reproduction paths,
   and structural obstacles → `docs/agent-native-plan.md`, including one real
   shipped bug: the KAG store's whole-node LOCAL-WINS merge never propagates
   content edits or `review:true` graduations to returning browsers.
3. **Issue roadmap filed** — GitHub #42–#61: five epics (conventions pack, CI
   verification harness, CDN vendoring, diagnostics/replay harness, KAG
   progress/content split), each broken into atomic sub-issues written for
   low-context executors.
4. **Docs refresh** — rot-prone counts removed from `CLAUDE.md` /
   `docs/kag-schema.md`; README file tree regrouped and completed; the three
   plan docs got `> Status:` headers marking them as executed historical
   records; new `docs/docs-map.md` defines the mandatory documentation
   second pass (checklist-shaped, delegable to a cheaper model).

## Next Steps
Execute the remaining epics in the order given in `docs/agent-native-plan.md`
§5 (vendoring → diagnostics → KAG split). The docs second pass is now a
standing convention in `CLAUDE.md`.

### Delivered: #42 conventions pack + #46 CI verification harness
- **#42** — `docs/decisions.md` (decision tables: page chrome, renames, the
  localStorage key registry, module authoring, escalation) and
  `docs/verification.md` (per-subsystem probes), both wired into `CLAUDE.md`;
  stale graph counts removed.
- **#46** — `tools/check-data.mjs` (deps-free data invariants; enums pulled
  into shared `tools/kag-enums.mjs`), `tools/smoke-pages.mjs` +
  `tools/smoke-lib.mjs` + `tools/console-allowlist.json` (headless page-boot
  smoke), `tools/test-oksat-engine.mjs` (answer-lock / SRS / keyboard /
  migration), and `.github/workflows/ci.yml` running all three on every PR.
- Validated: check-data 39/39; browser suites 17/17 pages + 10/10 engine
  checks against a vendored mirror; both harnesses proven to fail on injected
  regressions. CDN pages need network (CI/local); a CDN-blocked sandbox boots
  only the CDN-free pages — the motivation for the still-open vendoring epic
  (#51).

---

# WIP — Product feature backlog

## Goal
Complement the engineering roadmap (#42–#61, `docs/agent-native-plan.md`) with
a **product** backlog: what the tools should be able to do that they cannot
today, ranked so the next build decision is already made.

## Actions Taken
- `docs/feature-requests.md` — 15 user-facing features scored
  utility × feasibility (feasibility judged against the no-build / static /
  client-state-only constraints, so "needs a server" scores 1), each with the
  problem, an implementation sketch against real files, its dependencies on
  the open engineering issues, and its escalation flags. Includes a
  "considered and not recommended" table and a suggested execution order.
- Registered in `docs/docs-map.md` and pointed to from `CLAUDE.md`.

## Evidence behind the ranking (snapshot 2026-07-25)
- 5 of 62 taxonomy topics have shipped modules (~92% of the mapped curriculum
  has no static content).
- 40 of 771 KAG nodes are `review:true` — 95% of the graph is DRAFT.
- `data/oksat-db.json` holds zero reviewer blocks; the sync path has never
  carried real data.
- Only 70 of 771 nodes carry any `oksat.*` link.
- Leitner scheduling is per module, with no cross-module daily queue.

## Next Steps
Owner triage. The three highest-scoring items (cross-module daily review
queue, Anki/CSV export, miss log) are independent of every open engineering
issue and can start immediately; the rest are sequenced in the doc's final
section.

### Filed as GitHub #63–#77, tracked by epic #78
One issue per feature, house style (repo primer / task / acceptance criteria),
each naming its dependencies on the engineering roadmap and its owner-only
escalations.

---

# WIP — Visual direction candidates

## Goal
Replace the palette. The owner's read ("the colors are atrocious") is
measurably correct, so the work started with measurement rather than taste.

## Actions Taken
- **Measured the current subspecialty hues** as a categorical palette: 3 of 5
  checks fail — 6 of 9 below the chroma floor (they render grey, not hue), and
  `fprs #7A5A3A` vs `hn_onc #9A4B2E` at ΔE 6.4 normal vision / 2.1 protan.
  Two subspecialties are effectively the same colour, which silently breaks the
  repo's own "colour always means something" convention.
- **Solved a replacement marker set** rather than picking by eye: hues spaced
  around the wheel with per-slot lightness stepping so neighbours stay separable
  under colour-vision deficiency. Light and dark are independent solves (the
  dark band is L 0.48–0.67, not an inversion of light's 0.43–0.77). All checks
  pass on every candidate surface; worst adjacent pair ΔE 12.6 light / 10.1 dark.
- **Six chrome directions** — Clinical Register, Theatre, Graphite, Nocturne,
  Signal, Vellum — each a complete light+dark `--ok-*` token block, all sharing
  the one validated marker set (subspecialty hue is data, not skin).
- `docs/ui-directions.md` carries the evidence, every token set, and the
  implementation cost. Proof sheet rendering all six on real components:
  <https://claude.ai/code/artifact/902e76db-aa80-45cd-9fbe-78c53d1471f8>

## Next Steps
**Owner pick — nothing is implemented.** Changing `OKSAT_SUBSPECIALTIES` is an
owner decision (`docs/decisions.md` §8). Once a direction is chosen, note that
the map holds one `hue` per subspecialty for both themes; a correct dark mode
needs a second value per entry, which touches every reader of `.hue`.

---

# WIP — Lightbox: one visual identity site-wide

## Goal
Replace the palette everywhere and give the site a single brand, rather than
the three looks it had grown (one-pager styles, OKSAT warm cream, graph blue).
Direction chosen by the owner from the round-two proof sheet: **Lightbox** —
dark ground, panels brighter than it and edge-lit like films on a viewing box;
light mode is a designed daylight twin, not an inversion.

## Actions Taken
1. **`css/tokens.css` — the brand file.** Every colour on the site now lives in
   one place, loaded first on every page. `css/oksat.css`, `css/site.css`,
   `css/graph.css` and `css/main.css` had their own palettes deleted; the last
   two are re-pointed via legacy aliases so two large frozen sheets did not
   need rewriting.
2. **Solved categorical palettes.** The nine subspecialty markers were
   regenerated (the old set failed 3 of 5 checks — six hues below the chroma
   floor, and `fprs`/`hn_onc` at ΔE 6.4 normal vision, 2.1 protan). Graph node
   types got their own all-pairs-validated set **plus shape encoding**, since
   seven categories cannot be separated by hue alone. `OKSAT_SUBSPECIALTIES`
   gained a `hueDark` per entry and a `window.OKSATHue()` helper; every
   `.hue` consumer now routes through it, and the study lens re-derives marker
   colours on the day/night flip.
3. **One identity on the one-pager.** The Matte/Story switcher, its CSS blocks
   and decorations, and the `sk_style` key are retired (the key is removed from
   storage on load). Day/night remains and still follows the OS on first visit.
4. **Legacy pages.** `cpt-search.html` was rethemed onto the brand by
   re-pointing `css/main.css`'s palette — its components were left untouched.
   `js/main.js`'s hero-image colour extraction is **disabled**: it wrote
   `--color-*` inline on `<html>` at runtime and overrode the brand accent
   (`sk_dynamic_colors` retired with it). `ascii-editor.html` was retired at
   the owner's request and is now a redirect stub to `index.html`.
5. **Type.** Default stack is IBM Plex Sans + JetBrains Mono; OKSAT's default
   font theme moved from Manuscript to Atlas. The four reader-selectable font
   themes stay (Manuscript for long-form, Hyperlegible for accessibility).
6. **Module domain hues** in `js/mcq-modules/*.js` were remapped onto the brand
   family (colour values only — no content touched).

## Verification
- `node tools/check-data.mjs` — 39/39.
- Console check across the CDN-free pages (index, airway, cpt-search,
  kag-extract, the ascii-editor stub): zero JS errors; `airway-jeopardy.html`
  still issues **zero external requests**, so it remains self-contained.
- Rendered light + dark on index, oksat hub and cpt-search.
- The browser suites could not run in this sandbox (installed Playwright wants
  a Chromium build the image doesn't carry, and the CDNs are blocked) — CI
  runs them on the PR.

## Next Steps
**The direction decision was reopened (2026-07-27) before merge.** The owner
asked to see further options, so a third proof sheet was produced: six
directions — Bedside, Ledger, Specimen, Contrast, Meridian, and Lightbox for
comparison — rendered across all six real surfaces with a direction switcher
(<https://claude.ai/code/artifact/4f3fb6c7-0a65-4c53-b1c2-5e8ff8ed23ec>).
Lightbox stays on the branch, unmerged, as a candidate.

Switching costs one file: because every colour now resolves through
`css/tokens.css`, a different pick is two token blocks, not a re-do. The
structural work in this branch (retired style switcher, rethemed CPT page,
disabled runtime colour extraction, retired ASCII editor, new markers + graph
shape encoding) is direction-independent and stands either way.

Still open regardless of the pick: watch CI for the OKSAT/graph pages, which
could not be booted locally; the structural lens still has nine class hues that
cannot all be mutually distinguishable (it leans on its legend and labels); and
`docs/verification.md` now carries a brand-consistency probe to run on any
future visual change.
