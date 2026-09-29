---
name: ascii-diagram
description: Design, build, place and verify a bespoke ASCII 3D figure on skflx.github.io, using the site's own renderer (js/ascii3d.js, scenes in js/diagrams/). Use when asked for a diagram, figure, illustration, 3D model, visual explainer or "ASCII art" anywhere on this site, or to change an existing figure.
---

# ASCII 3D figure

The reference is `docs/diagrams.md`: schema, inks, rules. Read it first.
This file is the order of work.

## 0. Pin down the request

Get these five from the request or the page. Ask only for what is missing
and cannot be inferred:

- **Subject:** what is drawn.
- **Place:** page and section.
- **The one claim:** what a reader should understand after looking.
- **Emphasis:** at most one `signal` (act, emphasis) thing, and any
  `science` (measurement) things.
- **Motion:** `spin` for objects, `rock` for plots and diagrams with a
  reading direction.

A figure goes where it explains something the prose cannot show well,
such as spatial relations or a schedule. It never goes in just to
decorate.

## 1. Model

```bash
node tools/ascii3d.mjs new <id>      # or copy the closest scene in js/diagrams/
```

Write the scene header: what it shows, where it is used, what is
schematic. Build from the primitives. `tube` along a curve and `surface`
from a function cover most anatomy. `heightfield` plus `line` ribs covers
most plots. `box` covers charts and schedules. Keep the geometry in named
functions, not magic numbers inline.

## 2. Iterate as text (no browser needed)

```bash
node tools/ascii3d.mjs render <id> --inks          # frame + ink map
node tools/ascii3d.mjs render <id> --turn 4        # if it spins: every side
node tools/ascii3d.mjs render <id> --dark          # dark-ground shading
```

Check each of these, and fix before moving on:

- The claim is legible at the default angle, without the caption.
- Labels sit on blank paper. Adjust `dx`/`dy`, `camera.offset` or `fit`.
- The emphasis ink map (`s`/`b`) covers exactly the intended part.
- Thin parts still read. If they are 1 cell wide, thicken them (`thick`
  gives a sheet a body) or raise `cols`/`rows`.
- Nothing important leaves the grid through a full spin or rock. A tall,
  narrow spinner fills the grid better with `camera.frame: 'turntable'`.

## 3. Place, bake, stamp

Markup and script order are in `docs/diagrams.md` §Workflow. Then:

```bash
node tools/ascii3d.mjs bake
node tools/stamp-assets.mjs
```

Style the figure in the page's own stylesheet with its tokens: margins, a
rule, the caption, and `--a3d-max` if the column is wide. The caption
states the claim, and says "schematic" when shapes or data are invented.

## 4. Verify

```bash
node tools/check-data.mjs        # scenes render, pages load them, bakes fresh, no orphans
node tools/smoke-pages.mjs       # mounts live, no console errors
```

If the figure is on a new page, add a `figureReady(page, '<id>')` call to
that page's `ready` in `tools/smoke-pages.mjs`. Then screenshot the page
at 390px and 1280px in both themes with Playwright (Chromium is at
`/opt/pw-browsers`; `tools/smoke-lib.mjs` has `startServer` and
`launchBrowser`) and look at the screenshots.

## 5. Docs pass

Add the figure to the page's section in `WIP.md`. If the engine gained a
feature, update `docs/diagrams.md`. Then run the second pass in
`docs/docs-map.md`.

## Never

- Invent anatomy or data and present it as measured. Mark it schematic
  and flag the owner (`docs/decisions.md` §7).
- Use non-ASCII glyphs, a remote script or font, or `innerHTML` in a scene.
- Hand-edit a baked block or a `?v=` stamp.
- Touch Fig. 1 (`tools/gen-cochlea.py`). It is the owner's implant, and
  changing it is an owner decision.
