# skflx.MD — Personal Website

Single-page personal site for an otolaryngology resident in the Pacific
Northwest, plus a small set of self-contained clinical study tools.

## Live Site

[skflx.github.io](https://skflx.github.io)

## Overview

The site is one scrollable page (`index.html`), set like an index rather than
a brochure: a large name beside a cutout portrait, then five numbered
sections, all open —
About, Tools, Clinical projects, Research, Off hours. On desktop the section
heads stay pinned in a left column while the content scrolls; on phones it is
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
- **Fig. 1** (About) — a cochlea drawn as a logarithmic spiral, with a
  22-contact implant electrode in the basal turn and tonotopic ticks placed
  by the Greenwood place–frequency function, next to "both sides of the
  electrode". Static SVG, animated once on load, still under
  `prefers-reduced-motion`.

A **day / night** toggle flips `html[data-theme]`, persisted as `sk_theme`
and defaulting to `prefers-color-scheme`.

## The tools

- **OKSAT** (`oksat.html`) — OHNS Knowledge Self-Assessment. Hand-authored
  study modules where every question opens on a recall gate — answer it from
  memory and self-grade, or show the choices and answer it as a locked
  first-attempt MCQ — all feeding one Leitner spaced-repetition schedule.
  Progress is local to the browser; nothing is uploaded.
- **CPT Code Search** (`cpt-search.html`) — fast surgical CPT lookup built for
  otolaryngology.
- **Airway Rounds** (`airway-jeopardy.html`) — team-based ENT/H&N airway quiz
  (Rounds, Jeopardy board, quick quiz, browse). Makes no third-party request
  (its CSP enforces that), so it works on conference-room wifi or none at all.

Coming: **sk.oto**, the Obsidian knowledge graph as a Quartz 5 wiki — scaffold
only for now (`wiki/README.md`).

## Tech Stack

- **HTML5** — semantic markup, static SVG figure, no framework
- **CSS3** — custom properties (one token set), Grid, Flexbox, variable fonts
- **JavaScript** — vanilla, no frameworks, **no build step**
- **React 18 + htm** — vendored UMD builds in `js/vendor/`, on the OKSAT study viewer only; tagged templates, no JSX build
- **Fonts** — Archivo and IBM Plex Mono, self-hosted in `fonts/` (SIL OFL)
- **Security** — a Content-Security-Policy on every page, `script-src 'self'`, no inline script, no third-party script (`docs/security.md`)

The only npm package is dev-only test tooling (`playwright`). Nothing shipped
touches `node_modules`.

## File Structure

Grouped by system; per-file detail lives in each file's header comment.

```
├── index.html              # The one-pager
│   ├── css/onepager.css    #   its layout (on css/site.css tokens)
│   └── js/onepager.js      #   residency year, section scroll-spy
│
├── oksat.html              # OKSAT hub — module list, due-review banner, settings
├── oksat-study.html        # OKSAT viewer (?m=<slug>[&c=<concept>])
│   ├── css/oksat.css       #   OKSAT design system (tokens; docs/design-principles.md)
│   ├── js/oksat-*.js       #   engine, manifest, store, prefs, hub, viewer boot, concept graph
│   ├── js/vendor/          #   React + htm, pinned and self-hosted
│   └── js/mcq-modules/     #   question banks (one data file per module)
│
├── airway-jeopardy.html    # Airway Rounds team quiz (no network needed)
│   └── js/airway-*.js      #   app, engine, question bank
├── cpt-search.html         # CPT code search
│   └── js/cpt-search.js    #   code table + search
│
├── css/site.css            # The design system: tokens, faces, shared chrome
├── js/site.js              # Day/night toggle
├── js/theme-boot.js        # Pre-paint theme (every page, in <head>)
├── fonts/                  # Self-hosted Archivo + IBM Plex Mono (+ licenses)
│
├── wiki/                   # Scaffold: Quartz 5 wiki for the sk.oto vault (not served; see wiki/README.md)
│   ├── sync/               #   vault → wiki sync, the privacy boundary
│   └── dgmo/               #   DGMO diagrams → inline SVG at wiki build time
│
├── archive/                # Kept content, served by nothing (see its README)
│   ├── kag-graph.json      #   OHNS knowledge graph from the retired atlas viewers
│   └── kag-graph-flat.txt  #   the same data as readable text
│
├── tools/                  # Dev-only verification (Node; never shipped)
│   ├── check-data.mjs      #   data + security invariants, zero deps
│   ├── test-wiki-sync.mjs  #   vault sync behavior on a synthetic vault
│   ├── smoke-pages.mjs     #   every page boots with no real console errors
│   └── test-oksat-engine.mjs  # engine behavior: answer lock, SRS, keyboard
│
├── CLAUDE.md               # Operating manual for coding agents
├── WIP.md                  # Current state of each system
├── docs/                   # Design system, decisions, security, verification
│                           #   (index + update rules: docs/docs-map.md)
├── img/oksat/              # Per-module images used in question stems & explanations
├── images/                 # Cutout portrait, social card, favicon (see images/list.txt)
└── documents/              # cv.pdf (upload pending)
```

## Local Development

No build step. Serve the folder and open `index.html`:

```
python3 -m http.server 8000
# http://localhost:8000/
```

Serving matters — `file://` breaks pages that fetch. Deep links jump to
the matching section, e.g. `index.html#research`.

Before pushing (CI runs the same four on every PR):

```
node tools/check-data.mjs
node tools/test-wiki-sync.mjs
node tools/smoke-pages.mjs
node tools/test-oksat-engine.mjs
```

Deploy = merge to `master`; GitHub Pages serves the repo root directly.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Uses CSS custom properties,
Grid/Flexbox, `color-mix()`, `backdrop-filter`, and variable fonts
(`font-stretch`).

## License

Personal use only. Content and design are proprietary.
