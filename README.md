# skflx.MD — Personal Website

Single-page personal site for an otolaryngology resident in the Pacific
Northwest, plus a small set of self-contained clinical study tools.

## Live Site

[skflx.github.io](https://skflx.github.io)

## Overview

The site is one scrollable page (`index.html`), set like an index rather than
a brochure: a large name beside a cutout portrait, then five numbered
sections — About, Tools, Clinical projects, Research, Off hours — that
start folded into a compact index under the hero and open with a tap on
their heads (a link to one, such as `#research`, opens it). On desktop an open section's
head stays pinned in a left column while its content scrolls; on phones it is
one column.

The residency year in the header computes itself from the program start date
and rolls over every July 1 — there is no annual edit to forget.

### Design

One system across every page, declared as tokens in `css/site.css`:

- **Paper and ink** — a cool off-white and a near-black, with hairline rules
  instead of cards and shadows.
- **Two signal colors from the audiogram** — right-ear red for action and
  emphasis, left-ear blue for science. Nothing is colored for decoration.
- **Archivo** (variable width: expanded for the name and section heads) and
  **IBM Plex Mono** for anything that is data. Both are self-hosted.
- **Portrait on a plate** — a background-removed headshot standing on a
  tinted plate, head breaking its top edge (the plate keeps the dark suit
  legible in night mode).
- **ASCII 3D figures** — geometry rendered live into a character grid by
  the site's own renderer (`js/ascii3d.js`): the owner's cochlea fitted to
  their CT, with their FLEX28 array and the spiral ganglion it drives
  (About); binaural pitch fusion in a narrow- and a broad-fusion listener
  (Research); and a turning larynx (Airway Rounds). Each one is an
  easter egg: select or tap its word in the text ("electrode", "Binaural
  pitch fusion", the "Airway" heading) and it unfolds in place. They turn,
  drag, re-shade for night mode, stand still under reduced motion, and
  ship a pre-rendered frame for readers without JavaScript. How to make
  one: `docs/diagrams.md`.

A **day / night** toggle flips `html[data-theme]`, persisted as `sk_theme`
and defaulting to `prefers-color-scheme`.

## The tools

- **OKSAT** (`oksat.html`) — OHNS self-assessment study modules with a recall gate and one Leitner spaced-repetition schedule, plus interactive first-pass guides (`oksat-learn.html`).
- **CPT Code Search** (`cpt-search.html`) — fast surgical CPT lookup built for otolaryngology.
- **Search** (`search.html`) — one box over the OKSAT question modules and the CPT table.
- **PDF Chapter Splitter** (`pdf-chapter-splitter.html`) — lossless split of a PDF into chapters, entirely in the browser.
- **Airway Rounds** (`airway-jeopardy.html`) — team ENT/H&N airway quiz; self-contained, so it works with no network.
- **sk.oto** — the Obsidian knowledge graph as a Quartz 5 wiki, live at `skflx.github.io/ohns-wiki-skflx/` (as of 2026-11-10).

Current state of each system: `docs/wip.md`. Agent manual and architecture: `AGENTS.md`.

## Tech Stack

- **HTML5** — semantic markup, a static SVG figure plus ASCII 3D figures (own renderer, no library), no framework
- **CSS3** — custom properties (one token set), Grid, Flexbox, variable fonts
- **JavaScript** — vanilla, no frameworks, **no build step**
- **React 18 + htm** — vendored UMD builds in `js/vendor/`, on the OKSAT study viewer only; tagged templates, no JSX build
- **Fonts** — Archivo and IBM Plex Mono, self-hosted in `fonts/` (SIL OFL)
- **Security** — a Content-Security-Policy on every page, `script-src 'self'`, no inline script, no third-party script (`docs/security.md`)

The only npm package is dev-only test tooling (`playwright`). Nothing shipped
touches `node_modules`.

## Local Development

No build step. Serve the folder and open `index.html`:

```
python3 -m http.server 8000
# http://localhost:8000/
```

Serving matters — `file://` breaks pages that fetch. Deep links jump to
the matching section and open it if folded, e.g. `index.html#research`.

Verification, asset stamping and figure baking are listed under
**Commands** in `AGENTS.md`.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Uses CSS custom properties,
Grid/Flexbox, `color-mix()`, `backdrop-filter`, and variable fonts
(`font-stretch`).

## License

Personal use only. Content and design are proprietary.
