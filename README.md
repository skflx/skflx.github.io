# skflx.MD — Personal Website

Single-page personal site for an otolaryngology resident in the Pacific Northwest.

## Live Site

[skflx.github.io](https://skflx.github.io)

## Overview

The site is one scrollable page (`index.html`) with four click-to-expand
sections (collapsed by default, clear at a glance):

1. **A budding surgeon-scientist in the PNW** — bio, education, languages, location
2. **My clinical tools and projects** — tools, technology projects, clinical experience
3. **Machine & cognitive frameworks in surgical learning** — research areas (PubMed)
4. **Outside of medicine** — art, music, outdoors, fitness

### Visitor-selectable visual styles

A switcher in the header lets the visitor choose between three styles, each
with its own typography, color, and decorative treatment:

- **Matte** — warm matte red / gold / brown (day) and a warm dark (night); DM Sans + Inter
- **Terminal** — monospace, grid lines, shell-prompt section headers; dark-first
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
- **Fonts** — Google Fonts (DM Sans, Inter, JetBrains Mono, Fraunces, Caveat)
- **Icons** — Font Awesome 6

## File Structure

```
├── index.html              # The one-pager
├── css/
│   ├── onepager.css        # Styles for the one-pager (3 styles × 2 themes)
│   └── main.css            # Legacy stylesheet (still used by the tool pages)
├── js/
│   ├── onepager.js         # Style switch, theme toggle, deep-linking
│   ├── main.js             # Legacy script (still used by the tool pages)
│   └── cpt_search.jsx      # CPT search tool logic
├── kag.html                # Tool: Knowledge Atlas Graph
├── kag-extract.html        # Tool: KAG extractor
├── cpt-search.html         # Tool: CPT code search
├── ascii-editor.html       # Tool: ASCII/Unicode diagram editor
├── images/                 # me_large.jpg + placeholders
├── documents/              # cv.pdf (placeholder)
├── scripts/                # update_from_cv.py (deprecated)
└── archive/                # Old multi-page site + design mockups (kept for reference)
    ├── index-legacy.html, projects.html, contact.html
    ├── MAINTENANCE.md, TODO.md
    └── mockups/            # Exploratory mockups + style variants
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
