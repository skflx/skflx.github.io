# skflx.MD — Personal Website

Single-page personal site for an otolaryngology resident in the Pacific
Northwest, plus a small set of self-contained clinical study tools.

## Live Site

[skflx.github.io](https://skflx.github.io)

## Overview

The site is one scrollable page (`index.html`) with four click-to-expand
sections (About opens by default; the rest are collapsed, clear at a glance):

1. **Surgeon-scientist in training in the PNW** — bio, education, languages, location
2. **My clinical tools and projects** — tools, technology projects, clinical experience
3. **Research — hearing science & how surgeons learn** — research areas (PubMed)
4. **Outside of medicine** — art, music, outdoors, fitness

The residency year in the header computes itself from the program start date
and rolls over every July 1 — there is no annual edit to forget.

### Visitor-selectable visual styles

A switcher in the header lets the visitor choose between two styles, each
with its own typography, color, and decorative treatment:

- **Matte** — warm matte red / gold / brown (day) and a warm dark (night); DM Sans + Inter
- **Story** — warm paper + ink, Fraunces serif with handwritten Caveat accents

Layered on top is a **day / night** toggle. Both the chosen style and theme are
persisted in `localStorage` (`sk_style`, `sk_theme`) and respect
`prefers-color-scheme` on first visit.

### Modular by design

Styling is token-driven: each style declares its color + type tokens for both
themes in `css/onepager.css`, and the shared components consume only those
tokens. Retheming or adding a style is a localized edit. Switching is driven by
`data-style` / `data-theme` attributes on `<html>`.

## The tools

- **OKSAT** (`oksat.html`) — OHNS Knowledge Self-Assessment. Hand-authored
  study modules mixing locked-first-attempt questions with free-response
  recall cards, all feeding one Leitner spaced-repetition schedule. Progress
  is local to the browser; nothing is uploaded.
- **CPT Code Search** (`cpt-search.html`) — fast surgical CPT lookup built for
  otolaryngology.
- **Airway Rounds** (`airway-jeopardy.html`) — team-based ENT/H&N airway quiz
  (Rounds, Jeopardy board, quick quiz, browse). Deliberately CDN-free and
  fully self-contained, so it works on conference-room wifi or none at all.

## Tech Stack

- **HTML5** — semantic markup; native `<details>` for the accordion (no JS needed to open/close)
- **CSS3** — custom properties, Grid, Flexbox
- **JavaScript** — vanilla, no frameworks, **no build step** (`js/onepager.js`: style switch, theme toggle, residency year, hash deep-linking)
- **React 18 + htm** — pinned UMD `<script>` tags on the OKSAT study viewer only; tagged templates, no JSX build
- **Fonts** — Google Fonts (DM Sans, Inter, Fraunces, Caveat)
- **Icons** — Font Awesome 6

The only npm packages are dev-only test tooling (`jsdom`, `playwright`).
Nothing shipped touches `node_modules`.

## File Structure

Grouped by system; per-file detail lives in each file's header comment.

```
├── index.html              # The one-pager
│   ├── css/onepager.css    #   its styles (2 styles × 2 themes)
│   └── js/onepager.js      #   style switch, theme toggle, PGY, deep-linking
│
├── oksat.html              # OKSAT hub — module list, due-review banner, settings
├── oksat-study.html        # OKSAT viewer (?m=<slug>[&c=<concept>])
│   ├── css/oksat.css       #   OKSAT design system (tokens; docs/design-principles.md)
│   ├── js/oksat-*.js       #   engine, manifest, store, prefs, concept graph
│   └── js/mcq-modules/     #   question banks (one data file per module)
│
├── airway-jeopardy.html    # Airway Rounds team quiz (CDN-free, self-contained)
│   └── js/airway-*.js      #   engine + question bank
├── cpt-search.html         # CPT code search (still on legacy css/main.css tokens)
├── css/site.css, js/site.js  # Shared chrome for tool pages (theme toggle)
│
├── archive/                # Kept content, served by nothing (see its README)
│   ├── kag-graph.json      #   OHNS knowledge graph from the retired atlas viewers
│   └── kag-graph-flat.txt  #   the same data as readable text
│
├── tools/                  # Dev-only verification (Node; never shipped)
│   ├── check-data.mjs      #   committed-data invariants, zero deps
│   ├── smoke-pages.mjs     #   every page boots with no real console errors
│   └── test-oksat-engine.mjs  # engine behavior: answer lock, SRS, keyboard
│
├── CLAUDE.md               # Operating manual for coding agents
├── WIP.md                  # Current state of each system
├── docs/                   # Schemas, authoring guides, design system, decisions
│                           #   (index + update rules: docs/docs-map.md)
├── images/                 # Profile photo + derived crops (see images/list.txt)
└── documents/              # cv.pdf (upload pending)
```

## Local Development

No build step. Serve the folder and open `index.html`:

```
python3 -m http.server 8000
# http://localhost:8000/
```

Serving matters — `file://` breaks pages that fetch. Deep links open the
matching section, e.g. `index.html#research`.

Before pushing (CI runs the same three on every PR):

```
node tools/check-data.mjs
node tools/smoke-pages.mjs
node tools/test-oksat-engine.mjs
```

Deploy = merge to `master`; GitHub Pages serves the repo root directly.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Uses CSS custom properties,
Grid/Flexbox, `backdrop-filter`, and the native `<details>` element.

## License

Personal use only. Content and design are proprietary.
