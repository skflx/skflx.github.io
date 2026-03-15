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
