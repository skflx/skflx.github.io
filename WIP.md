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
