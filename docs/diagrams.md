# Figures: ASCII 3D diagrams

Site figures are **ASCII 3D**: real geometry rendered into a monospace character grid by a small
software renderer. Each turns slowly, can be dragged, and re-shades for night mode. Pages that parse
their HTML also ship a pre-rendered frame, so a figure shows without JavaScript.

| Piece | Role |
|---|---|
| `js/ascii3d.js` | The engine: a DOM-free core (mesh, camera, raster, shade, contours, lines, labels) and the browser layer (mount, motion, drag, keys, theme, resize) |
| `js/diagrams/<id>.js` | One scene per figure, `ASCII3D.define(id, {...})`: data and geometry functions only |
| `css/ascii3d.css` | Grid sizing and ink → token mapping, for both token sets (site and `--ok-*`) |
| `js/egg.js`, `css/egg.css` | The egg reveal (see Eggs) |
| `tools/ascii3d.mjs` | Terminal preview, ink map, bake and check of the no-JS frames, scaffolding |
| `.claude/skills/ascii-diagram/SKILL.md` | The playbook for a new figure request (`/ascii-diagram`) |

`node tools/ascii3d.mjs list` lists the scenes. Each file's header says where its figure is used,
what it shows, and what is schematic.

## Asking for a figure

A request needs five things; without them the agent has to ask.

1. **Subject**: what is drawn.
2. **Place**: the page and section.
3. **The one claim**: the single thing a reader should understand. Labels only support it.
4. **Emphasis**: what gets `signal` (act, emphasis) and `science` (measurement). The rest stays ink.
5. **Motion**: `spin` (objects: anatomy, devices), `rock` (plots and diagrams with a reading
   direction), or still.

## Workflow

```bash
node tools/ascii3d.mjs new <id>                  # scaffold js/diagrams/<id>.js
node tools/ascii3d.mjs render <id> --inks        # frame + ink map, as text
node tools/ascii3d.mjs render <id> --turn 4      # four angles around a spin
node tools/ascii3d.mjs render <id> --dark        # shaded for a dark ground
node tools/ascii3d.mjs render <id> --cols 72 --rows 24 --fit 0.9   # try a size
node tools/ascii3d.mjs bake                      # refresh baked frames in root pages
node tools/stamp-assets.mjs                      # then re-stamp
```

1. **Model** it in `js/diagrams/<id>.js` from the scaffold or the nearest scene. Work in any units;
   the camera frames the geometry.
2. **Iterate in the terminal.** `render` prints the frame the page draws. `--inks` prints a second
   grid of ink per cell: `i` ink, `m` muted, `f` faint, `s` signal, `b` science, `g` ok, `r` bad.
   Check several angles and both grounds.
3. **Place** it in a parsed page:
   ```html
   <figure class="a3d my-figure" data-a3d="<id>">
   <!-- a3d:<id> --><!-- /a3d:<id> -->
       <figcaption>…</figcaption>
   </figure>
   ```
   The page loads `css/ascii3d.css`, and at the end of `<body>` loads `js/ascii3d.js` **before**
   `js/diagrams/<id>.js`. A page that renders markup from JavaScript emits `<figure class="a3d"
   data-a3d="<id>"></figure>` and calls `ASCII3D.mountAll(root)` after each render; no baked frame.
4. **Bake and stamp.** The bake writes the stage, the `aria-label` (from the scene's `alt`) and the
   first frame, shaded for paper, between the markers. Never hand-edit a baked block.
5. **Verify**: `node tools/check-data.mjs`, `node tools/smoke-pages.mjs` (`docs/verification.md`),
   then the page at 390px and 1280px in both themes.

## Eggs

A figure can be revealed from a word in the text (an *egg*), so it stays out of the reading flow:

```html
<span class="egg" data-egg="<id>" role="button" tabindex="0"
      aria-expanded="false" aria-controls="egg-<id>">word</span>
<figure class="a3d egg-figure" id="egg-<id>" data-a3d="<id>">
<!-- a3d:<id> --><!-- /a3d:<id> -->
    <figcaption>…</figcaption>
</figure>
```

`js/egg.js` delegates on `document`, so eggs rendered by a script work too. Click, Enter or Space
toggles; Esc closes. Selecting text that touches the trigger (150 ms debounce) also opens it; a deselect never closes.
`css/egg.css` hides the figure only under `(scripting: enabled)`.
`tools/smoke-pages.mjs` clicks the eggs in use; `check-data` does not check egg markup.

## Scene schema

```js
ASCII3D.define('id', {
    alt: 'What a screen reader hears: the subject and the one claim.',
    cols: 96, rows: 30,              // full-size grid; narrow columns get fewer cells
    minFont: 8,                      // px floor before the grid gives up cells
    camera: { yaw: 30, pitch: 20,    // degrees; pitch > 0 looks down
              fit: 0.85,             // how much of the grid the geometry fills
              persp: 3.2,            // camera distance in scene radii; larger = flatter
              frame: 'view',         // 'view' | 'sphere' | 'turntable'
              offset: [0, 0],        // nudge, in cells
              target: [x, y, z] },   // orbit centre (default: geometry centre)
    motion: { spin: 18 },            // deg/s, or { rock: 14, period: 12 }
    light: { dir: [-0.5, 0.6, -0.62], ambient: 0.14, diffuse: 0.78, spec: 0.35, shininess: 18 },
    fog: 0.4,                        // depth cue: far cells thin out
    outline: true,                   // contour glyphs on silhouettes, depth jumps, part edges
    edgeDepth: 0.18,                 // depth jump (scene radii) that counts as an edge
    ss: [2, 4],                      // samples per cell, across x down
    cover: [0.5, 0.3],               // share of a cell's samples that draws it / a thin feature
    idEdges: true,                   // contour where two parts meet at different depths
    idDepth: 0.045,                  // that depth gap (default edgeDepth * 0.25)
    crease: 40,                      // degrees: normal break within a part that draws a contour
    ramp: '.:;=+*#@',                // shading glyphs, least ink -> most ink
    readout: true,                   // live HUD ("drag to turn" + angle)
    interactive: true,               // drag and keys (false: display only)
    parts: [ … ],
    labels: [ … ]
});
```

`frame: 'sphere'` is the default when the scene spins, `'view'` otherwise. `'turntable'` bounds the
geometry by a vertical cylinder about the orbit target: tighter for tall, narrow objects, and still
clear of the grid at every yaw. Light is in view space, so the key light stays put as the object turns.

### Parts

Every part takes `ink` and optional placement: `scale` (uniform), `rotate: [x, y, z]` in degrees,
then `at: [x, y, z]`. Solids are meshed as (u, v) grids, so they never show holes.

| `kind` | Parameters | Use it for |
|---|---|---|
| `surface` | `fn(u, v)`, `u`/`v: [a, b, n]`, `wrapU`/`wrapV`, `inkAt(u, v)`, `thick` | parametric sheets: laminae, membranes, bands |
| `heightfield` | `fn(x, z) → y`, `x`/`z: [a, b, n]`, `inkAt(x, z)`, `thick` | surfaces over a plane: response surfaces, terrain |
| `tube` | `path(t)`, `t: [a, b, n]`, `radius` (number or `fn(t)`), `sides`, `inkAt(t)` | ducts, nerves, vessels, electrode arrays (parallel-transported frames, no twist) |
| `torus` | `R`, `r` or `section: [w, h]`, `center`, `arc: [deg0, deg1]`, `n`, `sides` | rings, loops, canals |
| `sphere` | `center`, `radius` or `radii: [a, b, c]`, `n` | balls, ellipsoids |
| `cylinder` | `from`, `to`, `radius`, `radius2` (cone), `caps`, `sides`, `n` | rods, horns, shafts |
| `box` | `center`, `size: [w, h, d]`, `open: ['top', …]`, `n` | blocks, trays, bars |
| `line` | `points` or `path(t)` + `t`, `closed`, `glyph`, `dash: [on, off]`, `hidden: 'hide' \| 'dots'` | axes, arcs, leaders, curves over a surface |
| `points` | `points`, `glyph` (default `o`) | contacts, markers, arrowheads (`v`, `>`) |

Any part takes `view: 'ascii' | '3d'` to draw in one renderer only. Grid-mesh kinds take `ramp(u, v)`
(or `ramp(t, v)` on a tube) as a per-vertex value for the 3D colour ramp; the ASCII raster ignores it.
This is not the scene-level `ramp` string.

`thick` (surface, heightfield) gives a sheet a body: the grid is pushed out and in along its normals
by half of `thick` each, and closed with a rim along each unwrapped edge, so a thin plate seen
edge-on still has an edge and a back. `inkAt` colours both faces and the rim.

### Labels

```js
{ at: [x, y, z], text: 'cricoid:\nthe one ring', ink: 'signal',
  dx: 4, dy: -2,        // leader direction and length in cells; omit dx to point away from centre
  align: 'center',      // text on the anchor column, no leader (axis and box labels)
  mark: '+',            // anchor glyph; false for none
  clear: true,          // stretch the leader until the text is off the drawing
  hideOccluded: false } // default: a label whose anchor is hidden dims to faint
```

Labels never overwrite each other; a crowded row is nudged. Keep each line to about 20 characters.

### Inks: meaning first, then the token

| Ink | Means | Site token | OKSAT token |
|---|---|---|---|
| `ink` | the subject | `--ink` | `--ok-text` |
| `muted` | supporting structure | `--ink-muted` | `--ok-text-muted` |
| `faint` | axes, context, floor, hidden anchors | `--ink-faint` | `--ok-text-faint` |
| `signal` | act / emphasis: the device, the site where you act | `--signal` | `--ok-ochre` |
| `science` | measurement | `--signal-2` | `--ok-accent` |
| `ok` / `bad` | outcome: correct / miss | `--ok` / `--bad` | `--ok-correct` / `--ok-incorrect` |
| `ghost` | occludes, draws nothing (hidden-line fill) | — | — |

A page with its own ground remaps the `--a3d-*` variables in its scope (Airway does, per theme).
Shading follows the ground under the figure: dark text means paper, so denser glyphs mark shadow;
light text means a dark stage, so denser glyphs mark light.

## Rules

- **One claim per figure.** If a paragraph is needed to say which part matters, the emphasis is on
  the wrong part.
- **Colour is meaning** (`docs/decisions.md` §5). Most of a figure is `ink`; at most one thing is `signal`.
- **Schematic is said out loud** in the scene header and the caption. Any anatomical or scientific
  claim is the owner's to vet (`docs/decisions.md` §7).
- **Printable ASCII only** (space to `~`): the self-hosted Plex Mono is a latin subset, so anything
  else breaks the grid.
- **Same-origin, no network.** Scenes are code in `js/diagrams/`, loaded under `script-src 'self'`.
  Airway stays self-contained.
- **Size for the column.** Set `cols` for the widest column the figure gets (`--a3d-max` caps it).
  Narrower columns get fewer cells, down to `minFont`.
- **Motion is optional.** `prefers-reduced-motion` gets a still figure (dragging still works);
  figures stop animating off-screen.
- **Delete what no page shows.** `tools/check-data.mjs` fails on an orphan scene.

## How it renders

Per frame, an orbit camera feeds a perspective projection into cells of aspect `CELL_ASPECT`
(`js/ascii3d.js`, matched by `line-height` in `css/ascii3d.css`). Triangles are z-buffered on
`ss` samples per cell. Each cell takes its front from the nearest samples it covers; samples within
`edgeDepth` (same part) or `idDepth` (other part) count as inside. Luminance picks a ramp glyph, and
fog thins distant cells. A cell short of the `cover` share draws only as a thin feature.

Contours come from the inside/outside mask of the cell, in physical units: the boundary's angle picks
`_` or `-` (near horizontal), `/` or `\` (diagonal), or `|` (near vertical). `crease` adds contours
between neighbours of one part whose normals part by more than that angle. The shading ramp never
uses `- | / \ _`, so those always read as contours.

Lines and points are depth-tested with a small bias, so a curve on a surface still shows. Labels come
last. The DOM gets one `<span>` per ink run, built with `textContent`.

To extend: add a `kind` to `BUILD` in `js/ascii3d.js` that returns a grid mesh (`gridMesh`), a
polyline or points. Everything downstream is shared.
