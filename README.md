# skflx.MD — Personal Website

Single-page personal site for an otolaryngology resident, plus a small set of
self-contained clinical study tools. Live at [skflx.github.io](https://skflx.github.io).

## The site

`index.html` is one scrollable page set like an index: a large name, five
numbered sections (About, Tools, Clinical projects, Research, Off hours) that start
folded and open on a tap of their heads, and a deep link such as `index.html#research`
opens its section. The portrait opens from the "MD" in the name. On desktop an open
section's head stays pinned in a left column; on phones it is one column. The
residency year computes itself and rolls over every July 1.

Figures are ASCII 3D: real geometry rendered into a character grid by the site's own
renderer (`js/ascii3d.js`). Each is an easter egg: select or tap its word in the text
and it unfolds in place. How to make one: `docs/diagrams.md`.

Design is one system in `css/site.css`: paper and ink, hairline rules, and two
audiogram signal colours (red for action, blue for science). Nothing is coloured for
decoration. A day/night toggle flips `html[data-theme]`, persisted as `sk_theme`.

## The tools

- **OKSAT** (`oksat.html`): OHNS self-assessment study modules with a recall gate and
  Leitner spaced repetition, plus interactive first-pass guides (`oksat-learn.html`).
- **CPT Code Search** (`cpt-search.html`): surgical CPT lookup for otolaryngology.
- **Search** (`search.html`): one box over the OKSAT question modules and the CPT table.
- **PDF Chapter Splitter** (`pdf-chapter-splitter.html`): splits a PDF into chapters
  entirely in the browser.
- **Airway Rounds** (`airway-jeopardy.html`): team ENT/H&N airway quiz; self-contained,
  so it works with no network.
- **sk.oto**: the Obsidian knowledge graph as a Quartz wiki, published from its own repo
  (`skflx/ohns-wiki-skflx`), live at `skflx.github.io/ohns-wiki-skflx/`.

Current state of each system: `docs/wip.md`. Architecture and agent rules: `AGENTS.md`.

## Tech stack

- **HTML5, CSS3, vanilla JavaScript**, no framework and **no build step**
- **React 18 + htm**, vendored UMD builds in `js/vendor/`, on the OKSAT question viewer only
- **Fonts:** Archivo and IBM Plex Mono, self-hosted in `fonts/` (SIL OFL)
- **Security:** a Content-Security-Policy on every page, `script-src 'self'`, no inline
  script, no third-party script (`docs/security.md`)

The only npm package is dev-only test tooling (`playwright`). Nothing shipped
touches `node_modules`.

## Local development

No build step. Serve the folder (`file://` breaks pages that fetch):

```
python3 -m http.server 8000
# http://localhost:8000/
```

Verification, asset stamping and figure baking are listed under **Commands** in `AGENTS.md`.

## Browser support

Modern browsers (Chrome, Firefox, Safari, Edge).

## License

Personal use only. Content and design are proprietary.
