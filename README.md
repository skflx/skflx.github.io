# skflx.MD — Personal Website

Single-page personal site for an otolaryngology resident in the Pacific Northwest.

## Live Site

[skflx.github.io](https://skflx.github.io)

## Overview

The site is one scrollable page (`index.html`) with four click-to-expand
sections (About opens by default; the rest are collapsed, clear at a glance):

1. **Surgeon-scientist in training in the PNW** — bio, education, languages, location
2. **My clinical tools and projects** — tools, technology projects, clinical experience
3. **Research — hearing science & how surgeons learn** — research areas (PubMed)
4. **Outside of medicine** — art, music, outdoors, fitness

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

## Tech Stack

- **HTML5** — semantic markup; native `<details>` for the accordion (no JS needed to open/close)
- **CSS3** — custom properties, Grid, Flexbox
- **JavaScript** — vanilla, no frameworks (`js/onepager.js`: style switch, theme toggle, hash deep-linking)
- **Fonts** — Google Fonts (DM Sans, Inter, Fraunces, Caveat)
- **Icons** — Font Awesome 6

## File Structure

Grouped by system; per-file detail lives in each file's header comment.

```
├── index.html              # The one-pager
│   ├── css/onepager.css    #   its styles (2 styles × 2 themes)
│   └── js/onepager.js      #   style switch, theme toggle, deep-linking
│
├── oksat.html              # OKSAT hub — modules + Atlas link + sync settings
├── oksat-study.html        # OKSAT viewer (?m=<slug>&c=<concept>)
├── oksat-adaptive.html     # OKSAT adaptive session (Gemini-generated items)
├── oksat-generate.html     # OKSAT Question Forge (Gemini module generator)
│   ├── css/oksat.css       #   OKSAT design system (tokens; docs/design-principles.md)
│   ├── js/oksat-*.js       #   engine, manifest, store, reviewer, prefs, db, ai,
│   │                       #   dashboard, adaptive, taxonomy, concept-graph, atlas shim
│   └── js/mcq-modules/     #   question banks (one data file per module)
│
├── graph.html              # Unified graph: Knowledge · Structural · Study (?lens=&node=)
│   ├── css/graph.css       #   consolidated graph chrome
│   ├── js/graph-view.js    #   the one Cytoscape engine (lens contract in header)
│   └── js/graph-lens-*.js  #   knowledge / structural / study lenses
├── kag-extract.html        # KAG shard extractor (Claude API)
├── data/kag-graph.json     # Canonical KAG database (never hand-edit; use the validator)
├── data/oksat-db.json      # Shared per-reviewer completion database
├── tools/kag-validate.mjs  # Dev-only shard validator + merger (Node, not shipped)
│
├── airway-jeopardy.html    # Airway Rounds team quiz (CDN-free, self-contained)
│   └── js/airway-*.js      #   engine + question bank
├── cpt-search.html         # CPT code search   (legacy: css/main.css + js/main.js)
├── ascii-editor.html       # ASCII/Unicode diagram editor (legacy chrome)
├── css/site.css, js/site.js  # Shared chrome for newer tool pages (theme toggle)
│
├── mcq*.html, occ*.html    # Redirect stubs → OKSAT pages (query strings preserved)
├── kag.html, atlas.html    # Redirect stubs → graph.html lenses (forward ?node=)
│
├── CLAUDE.md               # Operating manual for coding agents
├── WIP.md                  # Running project log (one section per workstream)
├── docs/                   # Schemas, authoring guides, design system, plans
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

Deep links open the matching section, e.g. `index.html#research`.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Uses CSS custom properties,
Grid/Flexbox, `backdrop-filter`, and the native `<details>` element.

## License

Personal use only. Content and design are proprietary.
