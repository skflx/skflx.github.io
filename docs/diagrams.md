# Figures — ASCII 3D diagrams

The site's figures, apart from Fig. 1, are **ASCII 3D**: real geometry
rendered into a monospace character grid by a small software renderer. Each
one turns slowly, can be dragged, and re-shades for night mode. Pages that
parse their HTML also ship a pre-rendered frame, so a figure is there
without JavaScript. The look comes from the rest of the site: ink on paper,
Plex Mono, hairline rules, and color only where it means something.

| Piece | Role |
|---|---|
| `js/ascii3d.js` | The engine. A DOM-free core (mesh, camera, raster, shade, contours, lines, labels) plus the browser layer (mount, motion, drag, keys, theme, resize) |
| `js/diagrams/<id>.js` | One scene per figure, `ASCII3D.define(id, {...})`: data and small geometry functions only |
| `css/ascii3d.css` | Grid sizing and ink → token mapping, for both token sets (site and `--ok-*`) |
| `tools/ascii3d.mjs` | Terminal preview, ink map, bake/check of the no-JS frames, scaffolding |
| `.claude/skills/ascii-diagram/` | The agent playbook for a new figure request (`/ascii-diagram`) |

The figures in use are the scene files themselves (`node tools/ascii3d.mjs list`).
Each file's header says where the figure is used, what it shows, and what
in it is schematic.

## Asking for a figure

A request needs five things. With these the job is mechanical; without
them the agent has to ask.

1. **Subject.** What is drawn, e.g. "the facial nerve through the temporal bone".
2. **Place.** The page and section, e.g. "OKSAT facial-reanimation hub card"
   or "one-pager, Research".
3. **The one claim.** The single thing a reader should understand after
   looking, e.g. "the labyrinthine segment is the narrowest and takes the
   first genu". A figure makes one point; labels only support it.
4. **Emphasis.** What gets signal red (act, emphasis) and what gets blue
   (science, measurement). Everything else stays ink.
5. **Motion.** A full `spin` (objects: anatomy, devices) or a gentle `rock`
   (plots, diagrams with a reading direction), or still.

Example: *"/ascii-diagram — the ossicular chain for the one-pager's About
section. Claim: the lever from the malleus to the stapes footplate. Stapes
footplate red. Spin."*

## Workflow

```bash
node tools/ascii3d.mjs new <id>                  # scaffold js/diagrams/<id>.js
node tools/ascii3d.mjs render <id> --inks        # frame + ink map, as text
node tools/ascii3d.mjs render <id> --turn 4      # four angles around a spin
node tools/ascii3d.mjs render <id> --dark        # shaded for a dark ground
node tools/ascii3d.mjs render <id> --cols 72 --rows 24 --fit 0.9   # try a size
node tools/ascii3d.mjs bake                      # refresh baked frames in root pages
node tools/stamp-assets.mjs                      # then re-stamp (scene/engine hashes)
```

1. **Model it** in `js/diagrams/<id>.js` from the scaffold or the nearest
   existing scene. Work in any units; the camera frames the geometry itself.
2. **Iterate in the terminal.** `render` prints exactly the frame the page
   draws, and `--inks` prints a second grid with the ink of every cell
   (`i` ink, `m` muted, `f` faint, `s` signal, `b` science, `g` ok,
   `r` bad). An agent can judge a figure from this text alone. Check
   several angles (`--turn`) and both grounds (`--dark`).
3. **Place it.** In a parsed page, put a figure with bake markers where it
   belongs:
   ```html
   <figure class="a3d my-figure" data-a3d="<id>">
   <!-- a3d:<id> --><!-- /a3d:<id> -->
       <figcaption>…</figcaption>
   </figure>
   ```
   The page loads `css/ascii3d.css`, then at the end of `<body>`
   `js/ascii3d.js` **before** `js/diagrams/<id>.js`. In a page that renders
   its markup from JavaScript (Airway), emit `<figure class="a3d"
   data-a3d="<id>"></figure>` and call `ASCII3D.mountAll(root)` after each
   render. The engine keeps the figure's angle across re-renders.
4. **Bake and stamp** (commands above). The bake writes the stage, the
   `aria-label` (from the scene's `alt`) and the first frame, shaded for
   paper, between the markers. Never hand-edit a baked block.
5. **Verify.** Run `node tools/check-data.mjs` and `node tools/smoke-pages.mjs`
   (details in `docs/verification.md`), then look at the page at 390px and
   1280px in both themes.

## Scene schema

```js
ASCII3D.define('id', {
    alt: 'What a screen reader hears: the subject and the one claim.',
    cols: 96, rows: 30,              // full-size grid; narrow columns get fewer cells
    minFont: 8,                      // px floor before the grid gives up cells (default 8)
    camera: { yaw: 30, pitch: 20,    // degrees; pitch > 0 looks down
              fit: 0.85,             // how much of the grid the geometry fills
              persp: 3.2,            // camera distance in scene radii; larger = flatter
              frame: 'view',         // 'view' (tight, centered) | 'sphere' (safe for a spin)
              offset: [0, 0],        // nudge the image, in cells
              target: [x, y, z] },   // orbit center (default: the geometry's center)
    motion: { spin: 18 },            // deg/s turntable, or { rock: 14, period: 12 } sway
    light: { dir: [-0.5, 0.6, -0.62], ambient: 0.14, diffuse: 0.78, spec: 0.35, shininess: 18 },
    fog: 0.4,                        // depth cue: far cells thin out
    outline: true,                   // contour glyphs on silhouettes and depth jumps
    edgeDepth: 0.18,                 // depth jump (in scene radii) that counts as an edge
    ramp: '.:;=+*#@',                // shading glyphs, least ink -> most ink
    readout: true,                   // live HUD: "drag to turn" + angle (false hides it)
    interactive: true,               // drag / keys (false: display only)
    parts: [ … ],
    labels: [ … ]
});
```

Framing defaults to `'sphere'` when the scene spins and to `'view'`
otherwise. Light is in view space, pointing toward the light, so the key
light stays put as the object turns.

### Parts

Every part takes `ink` (below) and optional placement: `scale` (uniform),
`rotate: [x, y, z]` in degrees, then `at: [x, y, z]`. Solids are meshed
as (u, v) grids and rasterized as triangles, so they never show holes.
Sampling counts only set smoothness.

| `kind` | Parameters | Use it for |
|---|---|---|
| `surface` | `fn(u, v) → [x,y,z]`, `u`/`v: [a, b, n]`, `wrapU`/`wrapV`, `inkAt(u, v)` | Anything parametric: laminae, membranes, leaves, bands |
| `heightfield` | `fn(x, z) → y`, `x`/`z: [a, b, n]`, `inkAt(x, z)` | Surfaces over a plane: response surfaces, terrain |
| `tube` | `path(t) → [x,y,z]`, `t: [a, b, n]`, `radius` (number or `fn(t)`), `sides`, `inkAt(t)` | Ducts, nerves, vessels, electrode arrays. Frames are parallel-transported, so tubes never twist |
| `torus` | `R`, `r` or `section: [w, h]`, `center`, `arc: [deg0, deg1]` (a C-shaped ring), `n`, `sides` | Rings, loops, canals |
| `sphere` | `center`, `radius` or `radii: [a, b, c]`, `n` | Balls, ellipsoids |
| `cylinder` | `from`, `to`, `radius`, `radius2` (a cone), `caps`, `sides`, `n` | Rods, horns, shafts |
| `box` | `center`, `size: [w, h, d]`, `open: ['top', …]`, `n` | Blocks, trays, bars of a 3D chart |
| `line` | `points: [[x,y,z], …]` or `path(t)` + `t`, `closed`, `glyph`, `dash: [on, off]`, `hidden: 'hide' \| 'dots'` | Axes, arcs, leaders in space, curves drawn over a surface |
| `points` | `points`, `glyph` (default `o`) | Contacts, markers, arrowheads (`v`, `>`) |

Lines choose glyphs from where they cross each cell: shallow runs give
`_` or `-`, diagonals `/` or `\` (one per row), steep runs `|`. The
shading ramp never uses those glyphs, so they always read as contours.

### Labels

```js
{ at: [x, y, z], text: 'cricoid:\nthe one ring', ink: 'signal',
  dx: 4, dy: -2,        // leader direction/length in cells; omit dx to point away from center
  align: 'center',      // set text on the anchor column, no leader (axis/box labels)
  mark: '+',            // anchor glyph; false for none
  clear: true,          // stretch the leader until the text is off the drawing (default)
  hideOccluded: false } // default: a label whose anchor is hidden dims to faint
```

Labels never overwrite each other: a crowded row is nudged up or down.
Keep each line of text to about 20 characters.

### Inks: meaning first, then the token

| Ink | Means | Site token | OKSAT token |
|---|---|---|---|
| `ink` | the subject | `--ink` | `--ok-text` |
| `muted` | supporting structure | `--ink-muted` | `--ok-text-muted` |
| `faint` | axes, context, floor, hidden anchors | `--ink-faint` | `--ok-text-faint` |
| `signal` | act / emphasis: the device, the site where you act | `--signal` | `--ok-ochre` |
| `science` | measurement, the scientific quantity | `--signal-2` | `--ok-accent` |
| `ok` / `bad` | an outcome: correct / miss | `--ok` / `--bad` | `--ok-correct` / `--ok-incorrect` |
| `ghost` | occludes, draws nothing (hidden-line fill) | — | — |

A page with its own ground remaps the `--a3d-*` variables in its scope.
Airway's dark stage does this in its page `<style>`. Shading follows the
ground actually under the figure: dark text means paper, so denser glyphs
mark shadow; light text means a dark stage, so denser glyphs mark light.

## Rules

- **One claim per figure.** If a figure needs a paragraph to explain
  which part matters, the emphasis ink is on the wrong part.
- **Color is meaning** (`docs/decisions.md` §5). Most of a figure is `ink`.
  At most one thing is `signal`.
- **Schematic is said out loud.** Invented shapes or data are called
  schematic in the scene header and in the caption. Any anatomical or
  scientific claim is the owner's to vet (`docs/decisions.md` §7).
- **Printable ASCII only** (space to `~`). The self-hosted Plex Mono is
  a latin subset, so anything else falls back to another face and breaks
  the grid.
- **Same-origin, no network.** Scenes are code in `js/diagrams/`, loaded
  under each page's `script-src 'self'`. Airway stays self-contained.
- **Size for the column.** Set `cols` for the widest column the figure gets
  (text in the grid caps at `--a3d-max`). Narrower columns get fewer cells
  automatically, down to `minFont`.
- **Motion is optional.** `prefers-reduced-motion` gets a still figure
  (dragging still works), and figures stop animating off-screen and in
  background tabs.
- **Delete what no page shows.** `tools/check-data.mjs` fails on an orphan
  scene.

## How it works

Per frame: an orbit camera (yaw about the world's vertical, then pitch)
feeds a perspective projection into cells whose aspect is `CELL_ASPECT`
(`js/ascii3d.js`, matched by `line-height` in `css/ascii3d.css`). Triangles
are z-buffered at cell centers, with interpolated normals and two-sided
Blinn-Phong lighting. Luminance picks a ramp glyph, and fog thins distant
cells. A contour pass turns silhouette and depth-jump cells into `- | / \`.
Lines and points are depth-tested with a small bias, so a curve drawn on a
surface still shows. Labels come last. The DOM gets one `<span>` per ink
run, built with `textContent`.

To extend it, add a `kind` to `BUILD` in `js/ascii3d.js` that returns a
grid mesh (`gridMesh`), a polyline or points. Everything downstream is
shared. Not built yet: figures inside OKSAT question items. The engine
takes `item.image` only, and a figure there would need a small component
in `js/oksat-engine.js` that calls `ASCII3D.mount`.
