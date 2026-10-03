# SSB — Sinus & Skull Base 3D: architecture and conventions

**Status (2026-10-02): phases 0, 1, 3 and 5 done, 2 half done, the endoscope
rig built; its collision and soft tissue next.** `ssb.html` runs graph mode
over the draft knowledge graph (`ssb/content/`, schema
`docs/authoring-ssb.md`, validator `tools/ssb-content.mjs`) and four stages:
the reference specimen reconstructed from the UW atlas (§5.1), the
endoscope on it (§3), CT (§3, §5.6; no WebGL needed), and the variant lab
(§6). **What is done and what is next, task by task, with
who does it: `docs/ssb-roadmap.md`.** This file is the design; the roadmap
is the board.

## 0. What it is

A traversable, interactive 3D model of the paranasal sinuses, nasal cavity,
orbit, anterior and ventral skull base, sellar/parasellar region and
pterygopalatine fossa — built to teach what a surgeon must **see**, **know**
and **think** at each point of an operation. One tool serves a PGY-1 learning
the uncinate and a skull base fellow rehearsing the paraclival carotid; the
depth setting (tier 1/2/3) decides how much of the graph is on screen.

Not a navigation system, not a surgical simulator (no haptics, no free-form
drilling), not a clinical reference while its content is `draft`. No patient
data, ever.

## 1. Principles — the decisions everything else follows from

1. **One graph, many views.** Every fact is a typed node in a knowledge graph
   (`docs/authoring-ssb.md`) with edges and sources. The 3D scene, panels, CT
   overlay, procedures and self-test are renderings of that graph; geometry
   is keyed by the same ids. A fact is written once and cannot disagree with
   itself across views.
2. **Label the kind of truth.** Three kinds, never blurred:
   *specimen* — one real adult anatomy, CT-derived (n = 1);
   *diorama* — an idealized parametric model that shows a variant or a
   classification cleanly; *population* — literature values with their
   spread, method and denominator. Every view carries a badge saying which it
   is, and every measurement shows the specimen's own value beside the
   population range.
3. **Surgical granularity.** Meshes are cut into the smallest unit a surgeon
   identifies or removes — uncinate, bullar lamella, the vertical and
   horizontal basal lamella, each frontal recess cell, sphenoid rostrum,
   sellar floor — not into textbook bones. A whole "ethmoid bone" mesh is
   useless at the table, so it does not exist; it is a parent id in the graph.
4. **Cognition is content.** Hazards (mechanism → prevent → recognize →
   rescue), operating principles, preop CT checks, and each procedure step's
   `think` field are first-class data, rendered in the scene (at-risk
   structures hatched, proximity read out in mm), not buried in prose.
5. **CT is the native language.** Surgeons plan in triplanar CT. Every 3D
   position is one keystroke from the CT slices through it, and every CT
   voxel knows which structure it belongs to.
6. **Recall before reveal.** Panels and procedure steps can open as prompts
   with the answer collapsed, the same recall-gate idea as OKSAT. The
   self-test is generated from the graph, so it grows with the content.
7. **The repo's rules do not bend.** No build step, same-origin everything,
   `script-src 'self'`, stamped assets, guarded storage, escaped text. Where
   3D needs something new (a vendored library, an ES-module import graph),
   the design extends the existing mechanism rather than excepting itself.

## 2. Scope

| Tier | Regions and depth |
|---|---|
| 1 | Nasal cavity, septum, turbinates, lateral wall and ostiomeatal unit, maxillary, anterior/posterior ethmoid, frontal sinus and recess, sphenoid, orbit's medial wall, skull base as a boundary; CT identification; the structures you must not injure (orbit, skull base, AEA, optic nerve, ICA) |
| 2 | Variants and their classifications (IFAC, Keros, Gera, uncinate attachment, sphenoid pneumatization, Onodi/Haller), extended FESS (Draf IIa/IIb, sphenoidotomy, SPA/AEA ligation, medial maxillectomy, DCR, orbital decompression), complication recognition and rescue |
| 3 | Expanded endonasal approaches on the sagittal and coronal planes (transcribriform → transclival, transpterygoid, petrous apex, cavernous sinus, CVJ), ICA segments, OCRs, cavernous and suprasellar neurovascular anatomy, reconstruction and flap design, quantitative anatomy |

**Pathology** is a layer over that anatomy, not a separate atlas: each
condition (`dz.*` — inflammatory and fungal disease and their orbital and
intracranial complications, CSF leak and encephalocele, benign and malignant
sinonasal and skull base tumors) names the structures it involves, its
imaging discriminators and mimics, its staging systems, and what it changes
at the table. In the scene a condition is an overlay on the specimen (a
lesion volume, an opacified cell, an effaced fat plane); in CT mode, its
findings; in self-test, *pattern → diagnosis* and *diagnosis → what it
changes about the operation*.

Region ownership and the full inventory live in the graph
(`ssb/content/*.json`), not here.

### Reference atlases

External labeled imaging the graph is checked against, recorded under
`ssb/reference/` with provenance:

- **UW Interactive CT Sinus Anatomy** (LoGerfo, Richardson, Dalley, Anzai;
  `ssb/reference/uw-sinusanatomy2/`) — labeled axial/coronal/sagittal stacks
  of a normal sinus CT, with every slice published as an unlabeled/labeled
  pair, plus normal-variant and inflammatory-disease pages. Its label
  vocabulary is crosswalked to graph ids (`crosswalk.json`), which fed
  synonyms and gap entities into the graph. Every labeled frame was also
  extracted to label positions (`slices.json`), from which within-slice
  spatial relations test the graph's `rel` claims (`relations.json`,
  `tools/ssb-pipeline/uw/relate.py`) — a relational check available before
  our own specimen exists, with the limits its README states. The owner reports the authors'
  permission (2026-09); until its scope is confirmed in writing, no UW image
  is copied into this repo. The unlabeled/labeled pairs are a ready-made
  CT recall deck (see the unlabeled slice, name the structures, reveal); using
  them in SSB needs that scope to cover republishing, because the site is
  HTTP-only and an HTTPS page cannot load its images (mixed content), so
  they would have to be served from this origin.

## 3. Modes

All modes share one scene, one selection and one URL state; switching mode
never reloads.

- **Explore.** Orbit/pan/zoom around the specimen. Layer toggles by tissue
  kind and region; *peel* (remove resection units in anatomical order);
  X-ray (fresnel ghosting of occluders — no sorted transparency); section
  planes with solid caps so a cut shows as a cadaver section registered to
  the CT slice. Click picks; clicking the same pixel again steps deeper
  through everything under the cursor (dense anatomy is layered).
- **Endoscope.** First-person through a rigid scope that **pivots at the
  nostril**: pose = insertion depth, shaft yaw/pitch about the nostril
  fulcrum, roll, and lens angle (0/30/45/70°). The view direction deflects
  from the shaft by the lens angle toward the roll, and the image horizon
  stays upright (camera head held level while the telescope rotates — the
  real technique); a light-post indicator sits opposite the view direction.
  Illumination is a spotlight at the tip with inverse-square falloff, so
  depth reads as it does in the OR; its intensity follows an automatic
  exposure (K·D², D the median distance to the lining over five rays), as a
  camera control unit does, so the image stays legible at any range. The shaft cannot pass through bone: it is
  sampled every 0.5 mm, on its axis and on a ring of four points at the
  shaft radius (4 mm scope, or 2.7 mm, chosen in the controls, never in the
  URL), against the CT display volume (§5.6), and a pose that would block is
  clamped to the last free depth. Only bone blocks (display ≥ 150); the
  shaft length lying in mucosa is reported as mucosal contact, because this
  specimen is not decongested and a rigid scope displaces mucosa. A proximity
  HUD gives the distance in mm from the tip to each critical structure (ICA,
  optic nerve, skull base, orbit, AEA) from precomputed distance fields, the
  ones within 3 mm in the signal colour. This mode is
  where the fulcrum constraint teaches why the frontal recess needs a 45–70°
  scope and why posterior septectomy opens binostril work.
  The specimen's face mask removed the nose, so the fulcrum `lm.naris`
  is measured from the unmasked axial stack, in memory
  (`tools/ssb-pipeline/uw/nose.py`: the vestibule lumen at the alar-rim
  band; method in the landmark meta); the scope
  sees the air spaces' surfaces drawn as mucosa. Built (`js/ssb/scope.js`:
  the pose math and the `#scope=` codec, pure; `mode-endoscope.js`,
  `ui-endoscope.js`): a scope pose is a camera over the Specimen stage
  (`state.scope`, exclusive with the lab and CT), with a spotlight at the tip
  and a 70° circular field of view; collision, the HUD and station flights
  are the next work packages (`docs/ssb-roadmap.md`).
- **CT.** Axial, coronal and sagittal slices of the specimen volume, each
  on its own canvas, radiological convention (patient right on the image's
  left) with orientation letters; one crosshair in RAS mm shared by the
  three (navigation-style). Click or drag a view to move it, wheel or arrow
  keys to scroll the active plane a voxel, Shift+arrows to move it in the
  plane, `1`/`2`/`3` to pick a plane; bone, sinus and soft-tissue window
  presets from `ct.json` plus width/level (slider, or right-drag). The label
  overlay outlines every segmented structure in the colour its graph kind has
  in 3D (the `--ssb-*` tokens of §7.4: a sinus is one blue, each IFAC cell its
  own hue), fills the selected entity, and has a colour key that selects.
  Hovering names the voxel's structure (label table → graph id → graph
  name) with the approximate HU (`toHU`); clicking a labelled voxel selects
  that entity in the ordinary panel. The volume loads on first entry; with
  no `ssb/ct/ct.json` the stage says so. Built for the Wormald
  building-block exercise: scroll the three planes, identify each frontal
  recess cell, and toggle its 3D block to check. The crosshair is the
  Specimen stage's 3D cursor (`state.cursor`). *Not built yet:* the oblique
  slice down the scope axis and the crosshair following the scope tip
  (roadmap E4), and the 3D block toggle.
- **Procedure.** A procedure from the graph played as steps. Each step sets
  the station (camera pose), applies the cumulative dissection state (units
  the step `removes` disappear), highlights what comes into view, hatches
  the step's hazards, and poses the step's `think` as a prompt before
  revealing it. Scrub forward and back.
- **Variant lab (dioramas).** Parametric models driven by classification
  presets and sliders: drag olfactory fossa depth from Keros I to III and
  watch the lateral lamella lengthen and the AEA drop into a mesentery;
  toggle IFAC cells and watch the frontal drainage pathway reroute (§6).
- **Self-test.** Items generated from the graph, filtered by tier: *find it*
  (name → click), *name it* (highlight → recall, self-graded), *CT localize*
  (crosshair → name; the label volume grades it), *classify* (a diorama or
  CT state → Keros/Gera/IFAC/pneumatization type), *what's at risk* (station
  → hazards), *next step* (procedure step → next action and what to confirm
  first). Leitner scheduling like OKSAT's, in SSB's own storage.

**Depth (tier) and truth badges are always visible.** Tier filters labels,
panel sections, hazards and self-test items; it never hides geometry needed
for orientation.

## 4. Coordinate frame and units

- **All authored and pipeline data are RAS millimetres** (x → patient right,
  y → anterior, z → superior; the 3D Slicer / NIfTI convention). Origin:
  anterior nasal spine. Axial plane parallel to Frankfort horizontal; x = 0
  on the midsagittal plane. The pipeline resamples the reference CT into
  this frame, so every file agrees without per-file transforms.
- **One conversion, at one boundary:** `rasToScene([r, a, s]) → [r, s, -a]`
  (three.js is Y-up, right-handed). Nothing in `ssb/` stores scene
  coordinates. 1 scene unit = 1 mm.
- Laterality in geometry names: `<id>.R` / `.L` / `.M`. Dissection states in
  geometry names: `<id>.<side>@<state>` (e.g. `s.frontal-beak.M@drilled`).

## 5. Geometry

Three classes, chosen per structure by its `geo` field.

| `geo` | Source | Used for | Runtime form |
|---|---|---|---|
| `specimen` | segmented from the reference CT | bone resection units, air cells (as solid "blocks"), mucosa surface, orbit contents, brain surfaces | quantized glTF packs |
| `sweep` | centerline + radius profile authored in RAS mm | arteries, veins, nerves, ducts, flow pathways | tubes generated at load (kilobytes, editable as data) |
| `diorama` | parameters | variants and classifications | generated at load from presets/sliders |

### 5.1 Reference specimen

**Chosen (2026-09-30): the UW atlas's axial/sagittal head** — one adult,
0.3437 mm in-plane, 0.625 mm axial slices, bone window (8-bit display
values, not HU), registered and scaled in `tools/ssb-pipeline/uw/`
(`registration.json`; the gate's findings are in
`ssb/reference/uw-sinusanatomy2/README.md`). UW's coronal stack is a
different head and is not used for geometry. The general requirements
below still describe what a replacement specimen would need.

One adult CT, thin-slice, with vascular contrast so the ICA segments
segment cleanly, from an open dataset whose license allows redistributing
derived meshes and volumes. Candidates and licenses: §13 (owner decision).
No open dataset or model segments ethmoid cells, the uncinate or frontal
recess cells (phase-0 research, 2026-09); automatic tools stop at whole
maxillary/frontal sinus, nasal cavity, orbit, optic nerve and ICA. The
surgical layer is manual segmentation whichever CT is chosen.
Whatever is chosen, `ssb/LICENSE-data.md` records dataset, case id,
license and attribution for every derived file. Faces are removed: the
volume is cropped to the region and soft tissue outside a dilated bone
envelope anterior to the facial skeleton is masked to air.

### 5.2 Segmentation — the graph writes the label table

`tools/ssb-labels.mjs` (phase 3) emits a 3D Slicer color table from every
`geo: "specimen"` structure × side, with stable indices recorded in
`ssb/geometry/labels.json` (append-only; an index is never reused). Coarse
structures come from automatic segmentation where licensed; resection units
and cells are expert manual segmentation in Slicer's Segment Editor — the
labor-heavy step, done once, and the one place an expert's hands are
irreplaceable. Centerlines (vessels, nerves, ducts) and landmarks are Slicer
markups exported to `ssb/geometry/sweeps.json` and
`ssb/geometry/landmarks.json`, keyed `<id>.<side>`. **Coordinates live in
geometry files, never in content** — swapping the specimen changes geometry,
not knowledge.

### 5.3 Pipeline (offline; outputs committed; never run in CI)

`tools/ssb-pipeline/` — Python (pinned `requirements.txt`) for volumetric
work, `@gltf-transform/cli` as a dev dependency for glTF packaging:

1. Resample CT and label map into the RAS frame (§4); crop; deface.
2. Labels → per-structure surfaces (marching cubes, windowed-sinc smoothing,
   decimation to a per-kind triangle budget).
3. Pack by region (`core`, `ethmoid-frontal`, `sphenoid-sellar`, `ppf-itf`,
   `acf-brain`) → weld → `KHR_mesh_quantization` → `.glb` → gzip →
   `ssb/models/<pack>.glb.gz`, plus `ssb/models/packs.json` (pack → node ids,
   triangle counts).
4. CT → 8-bit **LUT-encoded HU** (piecewise-linear: air, soft tissue and
   bone ranges each keep enough levels that bone and soft-tissue windows
   both stay usable; the inverse LUT is in the header) → `ssb/ct/ct.u8.gz`;
   labels → `ssb/ct/labels.u16.gz`; header `ssb/ct/ct.json` (dims, spacing,
   RAS affine, LUT, window presets, label index → id).
5. Distance fields (mm, clamped) for the proximity HUD's critical structures
   → `ssb/ct/sdf-<id>.u8.gz`.

**Models carry geometry only** — no materials, no embedded textures.
Materials are assigned at runtime from CSS tokens by `kind` (procedural
surfaces, `js/ssb/materials.js`, §7.4; theming works;
GLTFLoader turns embedded textures into `blob:` URLs, which `img-src 'self'`
blocks — so there are none). Compression is plain gzip decoded by the
browser's native `DecompressionStream`; GitHub Pages compresses only text
types and serves binaries as `application/octet-stream`, so the loader
checks the gzip magic bytes rather than trusting headers. If the budgets
below fail, the next step is Draco with its **JS** decoder (no WebAssembly,
no `eval` — works under the current CSP); meshopt needs real WebAssembly and
therefore `'wasm-unsafe-eval'`, a CSP loosening (§8, §13).

Git carries the binaries (GitHub Pages cannot serve LFS). Re-export only at
release points; the budget below bounds history growth.

### 5.4 Budgets (design constants)

| | Target |
|---|---|
| First render (graph + `core` pack) | ≤ 2.5 MB transferred |
| All specimen packs | ≤ 12 MB |
| CT + labels + distance fields | ≤ 6 MB, loaded on first entry to CT/endoscope mode |
| Triangles on screen | ≤ 400k desktop; phones load the decimated LOD |
| Draw calls | ≤ 150 |
| Frame rate | 60 fps orbit on integrated desktop GPU; ≥ 30 fps mid-range phone |

Rendering is on demand (a frame only when something changed), except during
camera flights and pathway animation.

### 5.5 Sweeps

`ssb/geometry/sweeps.json`: `{ "<id>.<side>": { "pts": [[r,a,s]…],
"radius": [mm…] | mm } }`. Built at load as tubes along a centripetal
Catmull-Rom curve. Pathways (`pw.*`) are sweeps rendered as moving particles
along the curve (mucociliary transport toward the natural ostium, frontal
drainage around the cells present, anterior-group drainage passing
anteroinferior and posterior-group drainage posterosuperior to the torus
tubarius).

### 5.6 Volumes at runtime

The CT, label and distance volumes are plain typed arrays in JS; slices,
oblique reformats and lookups are **CPU-sampled into a 2D canvas** (a slice
is tens of thousands of trilinear samples — milliseconds). CT mode therefore
needs no WebGL and no 3D textures, and still works where WebGL fails. The
same arrays answer "what structure is here" (label lookup), "may the scope
shaft pass" (label ≠ tissue along sampled points) and "how close is the ICA"
(distance-field lookup).

`js/ssb/volume.js` loads and serves them. `ssb/ct/ct.json` carries `dims`,
`spacing`, the voxel → RAS `affine` (row-major, any axis order or sign; the
inverse is computed), `dtype: uint8`, `windows` (presets in the file's own
value units), `values.toHU` (a piecewise-linear display → HU table) and the
label file and table; `ct.u8.gz` and `labels.u16.gz` are gzip of raw voxels,
x fastest, then y, then z (labels little-endian); the table,
`ssb/geometry/labels.json`, maps an index to `<graph id>.<side>`. The loader
decodes only when the bytes start with the gzip magic `1f 8b`, so a server
that sends `Content-Encoding` (the browser has already decoded) and one that
does not both work; sizes are checked against `dims`; a missing label volume
drops only the overlay; a header that fails validation, or a label file or
table name that would leave `ssb/ct` and `ssb/geometry`, is refused. Slices
are resampled per pixel (trilinear CT, nearest label) along straight rows in
voxel space: the three standard planes, and `obliqueSlice` for an origin plus
two in-plane unit vectors.

### 5.7 Soft tissue

The reference specimen is a bone-window CT in 8-bit display values: air
and bone separate cleanly, but mucosa, fluid, fat, muscle and cartilage
lie a few display levels apart. None of them can be segmented from it, so
soft tissue is built three other ways, and each part says which:

| Layer | Built as | Truth kind |
|---|---|---|
| Mucosa (sinus and nasal lining) | the air spaces' own surfaces — the air/tissue boundary *is* the mucosal surface — drawn with the `mucosa` material; no thickness is modelled | specimen |
| Septal mucosa (and nasal floor, for the extended flap) | the faces of the `s.nasal-septum.M` (and `s.nasal-floor.*`) wall units that face each nasal cavity, meshed per side, each with a **chart**: the surface's sagittal projection (a, s) in mm and a lookup grid back onto it, so anything drawn on the septum is specified in 2D | specimen |
| Small arteries (posterior septal and its branches, PLNA branches, septal AEA/PEA branches, nasopalatine, superior labial) | sweeps (§5.5) generated from **waypoints** — landmarks or chart points — at a stated depth below the surface; every point `inferred`, every waypoint cited | specimen-placed, inferred |
| Flap territories (nasoseptal: short, full, extended; rescue incisions; later IT/MT/lateral wall flaps) | **overlays**: outlines computed at runtime on a chart from landmarks plus the graph's measurements and the procedure's steps, with parameters and presets like a diorama's | schematic on specimen |
| External nose (naris, vestibule, valves, ala, columella; cartilage) | not in the specimen: the face mask (§5.1) removed it. Owner decision O1/O2 (§13) | — |

Pipeline: stage D (`tools/ssb-pipeline/uw/softtissue.py`) reads the
committed `ssb/ct/` volume, not the raw crawl, so it can be rerun in any
session; it writes a `soft` pack, `ssb/geometry/charts.json`, and merges
its landmarks and sweeps into the shared geometry files (never dropping
other steps' keys; method per point in the `*.meta.json` files). The
sagittal chart is single-valued only where the surface does not fold back
(a spur, a deviation): `charts.json` lists the cells that do under
`unreliable`, and anything placed there is approximate. Where the septum is thicker than the wall unit's cap, or a turbinate abuts it, the patch is completed from the airway lining's medial-most sheet; those cells are `filled` (lower confidence), and one posterosuperior gap stays no-data. The `soft` pack
is listed in `packs.json` like the others. Waypoint
specs live in `tools/ssb-pipeline/uw/sweeps-soft.json` — anatomy as data,
authored with sources, never hand-placed coordinates in content.

Overlays share the diorama contract's spirit (§6): parameters with ranges
from the graph, presets from the procedure's own design ladder, parts
named `<graph id>.<side>`, a *schematic on specimen* badge, and rules
pinned in `tools/test-ssb.mjs` (the NSF pedicle contains the posterior
septal artery; the superior cut stays below the olfactory strip).

#### Flap overlay contract (ST3, revised ST3r 2026-10-03)

*First pass by a Sonnet-class model; revised by Opus after verification and
the owner's decision O5 (the superior incision starts at the floor of the
sphenoid ostium for every design, as Geltzeiler does it). Designs follow
the atlas's Fig. 31.3 (ch. 31): A basic, B anterior extension, C lateral
extension. Every default that is not a cited graph value is schematic.
What changed from the first pass is listed at the end.*

**Inputs.** For side X: the septal chart `ssb/geometry/charts.json`
`s.septal-mucosa.X` (chart (a, s) mm = RAS (A, S); `grid`, `polygon`,
`unreliable`, `filled`), and for design C the floor chart
`s.nasal-floor-mucosa.X` (chart (a, r), with its junction polyline to the
septal chart; ST2b); the landmarks `lm.sphenoid-ostium.X`,
`lm.choanal-arch.M`, `lm.middle-turbinate-head.X`; the ostium's inferior
margin `s_f` (`landmarks.meta.json`, `lm.sphenoid-ostium.X`
`inferior_margin_s_mm`, written by ST2b; right ≈ 23.5, the lowest S of the
patent cavity | sinus interface); the meshes of both surfaces (for areas).
From the septal chart: `top(a)`, `bottom(a)`, `post(s)`, `a_ant`. `top(a)`
is interpolated linearly across columns with no data (the posterosuperior
gap, A -45…-35) from the nearest occupied columns either side. In the
reference specimen the septal surface stops about 4 mm in front of the
rostrum and at the masked vestibule (until ST6): the overlay clips to what
exists and says so.

**Parameters** (sliders, presets as buttons, like a diorama):

| Key | Range | Default | From |
|---|---|---|---|
| `design` | `short` (A) · `full` (B) · `extended` (C) · `rescue` | `full` | `p.nasoseptal-flap` preop ladder; Fig. 31.3 |
| `top_margin` (mm below the top of the septum; B and C only, where the incision rises forward) | 5–20; below 10 flagged "olfactory risk" | 15 (schematic) | `m.nsf-superior-incision` (10–20, conf low); ch. 31: 1–2 cm of superior septum for sella/planum defects |
| `anterior_margin` (B, C: mm behind the chart's anterior edge) | 0–10 | 0 | `p.nasoseptal-flap` step 4 ("up to the mucocutaneous junction") |
| `floor_width` (C: mm lateral from the septum–floor junction on the floor chart) | 0 – the floor chart's width at each a | the full width (schematic) | `m.nsf-extended-gain` (floor and inferior meatus) |
| `window` (rescue: side of the contralateral window beside the ostium, mm) | 3–8 | 5 (schematic) | `p.nasoseptal-flap` rescue step |

**Geometry** (chart mm; `s_c` = the choanal arch's S, `s_f` = the ostium's
inferior margin):

1. *Pedicle* — the posterior edge from `s_c` up to `s_f`. Its height
   `s_f - s_c` must lie in 8–16 mm (`m.choana-to-sphenoid-ostium`, 10–15;
   right specimen ≈ 11.5).
2. *Superior incision* — starts at (`post(s_f)`, `s_f`) for every design
   (O5) and runs forward. A (`short`): level, `s_sup(a) = min(s_f, top(a) -
   top_margin)`. B, C: it rises to follow the septum's top, `s_sup(a) =
   max(s_f, top(a) - top_margin)`, which is level near the sphenoid and
   higher forward, as in Fig. 31.3 B.
3. *Posteroinferior cut* — down the posterior edge from `s_c` along the
   choanal arch and the vomer to `bottom(post)`.
4. *Inferior incision* — A, B: forward along `bottom(a)` (the septum–floor
   junction; Fig. 31.3 A, B are septal). C: the outline crosses the
   junction onto the floor chart, runs posteriorly to anteriorly at
   `floor_width` from the junction (the atlas's "turn toward the floor and
   move laterally until the desired width is achieved"), with the
   posterior floor cut short of the hard–soft palate junction.
5. *Anterior cut* — A: at the A of `lm.middle-turbinate-head.X` (the head of
   the middle turbinate); B, C: at `a_ant - anterior_margin` (the
   mucocutaneous junction where the chart reaches it); on the floor chart
   (C) the same A.
6. *Outline* = pedicle → superior → anterior → inferior → posteroinferior,
   clipped to the chart polygons (septal, and floor for C).
7. *Rescue* draws only the superior incision from `s_f` forward to the
   middle turbinate head (no flap is raised: area 0, the pedicle marked)
   and the `window` beside the ostium, on the contralateral chart.

**Readouts.** Surface area in cm² of the mesh triangles whose centroid's
chart point lies inside the outline, septal and floor parts listed
separately; pedicle height; length along the outline's long axis; per
design the literature beside it — B: 17.12 cm² mean (`m.nsf-area`,
Pinheiro-Neto 2011) and about 25.1 cm² maximum (ch. 31 Table 31.2); C:
the gain over B against ≈ 774 mm² and ≈ 20 mm (`m.nsf-extended-gain`),
noting that the inferior meatus is not charted, so the drawn gain is the
floor's only. The share of outline length on `unreliable` or `filled`
cells, as an "approximate" badge when above 0; badge **schematic on
specimen**; while the vestibule is masked, a note that B and C stop short
of the mucocutaneous junction.

**Tests `tools/test-ssb.mjs` must pin** (ST5):

- the pedicle contains the posterior septal artery: the first point of both
  `s.posterior-septal-artery-*-branch` sweeps of that side (placed by ST4d
  from `m.psa-to-sphenoid-ostium`, independently of this construction)
  lies inside the pedicle's chart box (s between `s_c` and `s_f`, a within
  4 mm of `post(s)`), both sides — a cross-check of two sources (Zhang
  2014: the dominant branch below the ostium plane; Pinheiro-Neto 2011:
  9.3 mm below the ostium);
- the superior incision starts at `s_f` in every design; for B and C it
  stays at least `top_margin` below `top(a)` at every sample, for every
  parameter in range (property test over a grid), and never below `s_f`;
  for A it is level;
- the area readout equals an independent point-in-polygon sum over the
  meshes within 2 %;
- `short` ⊂ `full` ⊂ `extended` (areas strictly increasing), each inside
  its chart polygons; `rescue` has zero area and the same pedicle;
- sides: the right and left overlays differ only through their own charts
  and landmarks (swapping the data swaps the outlines);
- determinism: the same parameters give the same polygon (hash it);
- hostile `#flap=` values clamp or are ignored (as `#lab=` does).

**Not in this contract** (later, on other surfaces): the inferior meatus
(a lateral-wall chart), inferior and middle turbinate flaps and the lateral
nasal wall flaps, regional flaps, the contralateral reverse flap that
resurfaces the donor septum.

*Changes from the first pass:* `ostium_clearance` is gone — the superior
incision starts at the ostium's inferior margin, a measured value, not the
landmark's centroid minus a schematic clearance (O5); the superior
incision's course depends on the design (level for A, rising for B and C);
C draws the floor on its own chart instead of a readout only; `top(a)` is
interpolated across the no-data gap; the pedicle test checks a sweep
placed from an independent source (the first pass placed the sweep from
this very construction).

## 6. Dioramas

A diorama is an ES module `js/ssb/dioramas/<name>.js`, registered in
`dioramas/index.js`, exporting:

- `PARAMS` — `[{key, label, unit, min, max, step, default, from?, type?,
  options?, requires?}]`; `from` is the graph id the range comes from,
  `type` is `toggle` or `choice` (else a range), `requires` ties a size to
  its on/off toggle. The lab's sliders and the URL whitelist are generated
  from it.
- `PRESETS` — `{ '<classification id>': { '<class code>': {params…} } }`,
  derived from the classification's own criteria in the graph (the module
  says where the graph is silent). Buttons are labelled with the graph's
  class labels.
- `VIEWS` (`sagittal`, `coronal`, `axial`, `oblique`, radiological
  conventions) and `VIEW_DEFAULT` — the view the lesson reads in.
- `classify(params)` and `readout(params, userData, names)` — the HUD lines
  (classification of the current parameters, the AEA's course, the
  pathway's outlet).
- `build(THREE, params) → THREE.Group` — geometry in RAS millimetres,
  converted once to the scene by the root group's rotation (`rasToScene`,
  `js/ssb/frame.js`). three.js is passed in, never imported, so the modules
  load with graph mode for the URL whitelist.

Every part is an object named `<graph id>.<side>` whose `userData.id` is the
graph id, so picking selects the entity through the ordinary store path; a
hazard site carries the graph's hazard ids in `userData.hazards` and is
hatched (and named in the HUD). A part's `userData.look` names its tissue
`kind` (the graph's kind vocabulary; `kit.tag` rejects an unknown one) plus
space / ghost / translucent flags, and the lab draws it with the procedural
material of that kind (§7.4) — a diorama never names a colour. Geometry primitives
(`dioramas/kit.js`): superellipsoid air cells (Wormald's building blocks,
literally), profile extrusions (prisms) for plates and the skull base, tubes
for vessels and pathways — each kind has one implicit `inside()` test and
one mesh builder, so anything computed over a diorama sees exactly what is
drawn. A diorama may be placed in context by a similarity transform onto
specimen landmarks, but defaults to standalone with a *schematic —
idealized* badge. Fixed proportions the graph does not give are stated as
schematic in each module's header.

| Diorama | Parameters | Presets from |
|---|---|---|
| `ethmoid-roof` | olfactory fossa depth, lateral lamella angle, fovea asymmetry, AEA course (in canal / in mesentery, drop below roof), supraorbital ethmoid cell | `c.keros`, `c.gera` |
| `frontal-recess` | each IFAC cell on/off and size, uncinate superior attachment, frontal beak AP depth | `c.ifac`, `c.uncinate-superior-attachment` |
| `sphenoid` | pneumatization pattern, lateral recess, pneumatized anterior clinoid (deep lateral OCR), intersinus septum insertion, ICA/optic dehiscence, sphenoethmoidal cell over the optic nerve | `c.sphenoid-pneumatization` |
| `lateral-wall` | uncinate form, accessory ostia, infraorbital ethmoid cell, concha bullosa, paradoxical MT | variants in region A |

In `frontal-recess`, the drainage pathway is **computed** as the channel left
between the cells present, so the learner sees why anterior cells (agger
nasi, supra agger) push the pathway posteriorly, posterior cells (suprabullar,
suprabullar frontal) push it anteriorly, and a frontal septal cell pushes it
laterally — the geometry derives the rule rather than illustrating it. The
recess and sinus are voxelized at 0.5 mm from the rendered solids, the cells
present subtracted, and the path from the sinus through the ostium to the
middle meatus or infundibulum is a 26-neighbour Dijkstra path whose step cost
grows as clearance shrinks (so it runs down the middle of the channel),
smoothed inside free space, drawn as a tube with slow particles (none under
reduced motion). The uncinate's superior attachment (Landsberg–Friedman 1, 5,
6) is geometry too: its lateral bend closes a terminal recess (drainage
medial to it), a plate to the skull base or a medial bend to the MT leaves
only the infundibulum. `tools/test-ssb.mjs` checks every rule under all
three attachments. The supraorbital ethmoid cell is posterolateral to the
pathway rather than pushing it (the graph states a relation, not a push).

### 6.1 The `sphenoid` diorama (D1 spec)

*First pass by a Sonnet-class model; amended by Opus at verification
(2026-10-03): rule 4's type 4 corrected (it was inverted), "facing air"
defined, the conchal bone thickness given a number, rule 2's threshold
labelled a convention, impossible combinations tabled (rule 9). Every fixed
proportion is schematic and says so in the module header. D2 builds this
text as it stands.*

**Scene.** One standalone, bilateral model in a local RAS frame: origin on
the sphenoid face at the midline and the ostium height, y negative
posteriorly. Solids: the sinus as a superellipsoid pair (air) inside the
sphenoid body; rostrum and anterior face with two ostia; roof (planum,
tuberculum, sella as a bulge with its anterior and posterior wall planes);
floor; clivus behind; the ICAs as tubes (parasellar and paraclival
segments) in canals; optic nerves in canals; vidian canals; foramen
rotundum (V2); the intersinus septum; the lateral recess; the anterior
clinoid with its optic strut; an optional sphenoethmoidal (Onodi) cell.
`kit.js` primitives only; the same `inside()` tests drive rendering and the
rules. Fixed schematic sizes (stated in the header, not from the graph): sella
AP length, ICA and optic canal diameters, wall thicknesses, sinus height.

**`PARAMS`** (a `choice` or `toggle` where the graph defines classes, a
range where it gives numbers):

| Key | Type / range | Graph source |
|---|---|---|
| `pneum` | choice `conchal` · `presellar` · `sellar` · `postsellar` | `c.sphenoid-pneumatization` (preset codes) |
| `lateral_recess` + `lr_extent` | toggle; extent lateral to the vidian canal–foramen rotundum line, 0–15 mm (schematic) | `v.lateral-recess-pneumatization` |
| `clinoid_pneum` | toggle (air in the anterior clinoid via the optic strut) | `v.pneumatized-anterior-clinoid` |
| `septum_on_ica` + `septum_shift` | toggle; shift of the main septum from the midline, -8…8 mm (schematic) | `v.intersinus-septum-on-ica`, `s.intersinus-septum` |
| `ica_protrusion` | toggle | `v.ica-protrusion` |
| `ica_dehiscence` | toggle (no bone over the exposed ICA) | `v.ica-dehiscence` |
| `intercarotid` | 4–18 mm, medial wall to medial wall | `m.intercarotid-distance-narrowest` |
| `optic_type` | choice 1 · 2 · 3 · 4 | `c.delano-optic-nerve` |
| `optic_dehiscence` | toggle | `v.optic-canal-dehiscence` |
| `onodi` | toggle (the sphenoethmoidal cell over the optic nerve; implied by `optic_type` 4) | `v.sphenoethmoidal-cell` |
| `vidian_type` | choice 1 · 2 · 3 | `c.vidian-canal-type` |

**`PRESETS`:** `c.sphenoid-pneumatization` (4 codes → `pneum`),
`c.delano-optic-nerve` (1–4 → `optic_type`, `onodi` for 4),
`c.vidian-canal-type` (1–3 → `vidian_type`). The graph is silent on joint
configurations (e.g. which pneumatization goes with a lateral recess), so
presets set one parameter and leave the rest at the default (`sellar`, all
toggles off, `intercarotid` 12, `optic_type` 1, `vidian_type` 2).

**`VIEWS`:** `sagittal` (default: reads the pneumatization), `axial` (septum,
ICAs, optic canals), `coronal` (lateral recess, vidian canal, V2, carotid
prominences), `oblique`.

**`classify` / `readout` HUD lines:** pneumatization class; DeLano type;
vidian type; "septum meets the ICA prominence: yes/no"; "intercarotid
window: N mm"; "ICA dehiscent / protruding"; hazards named by their ids.

**Hazard sites** (hatched, `userData.hazards`): the exposed ICA wall
(`h.ica-injury-sphenoidotomy`, `h.septum-avulsion-ica` when the septum
inserts on it); the optic canal where exposed (`h.optic-nerve-injury-sphenoid`,
`h.optic-nerve-injury-onodi` with an Onodi cell); the vidian canal ridge
(`h.ica-injury-vidian`).

**Rules `tools/test-ssb.mjs` must pin** (computed from the solids on a voxel
grid at 0.5 mm, as the frontal-recess rules are; none written in):

0. *Facing air* (used by rules 2 and 4): the share of a canal's
   circumference whose outward normal reaches sinus air within the canal
   wall's thickness + 0.5 mm, sampled at 64 angles on each of 9 cross
   sections along the segment; dehiscence sets the wall to 0 on that arc.
1. *Pneumatization order.* Posterior air extent is strictly
   conchal < presellar < sellar < postsellar; air lies under the sella
   (between its anterior and posterior wall planes, below its floor) exactly
   for `sellar` and `postsellar`; air lies behind the posterior sellar wall
   plane exactly for `postsellar`; `conchal` leaves at least 8 mm of bone
   between sinus air and the sella (schematic, stated in the header).
2. *Carotid prominence.* The fraction of an ICA segment's circumference
   facing sinus air (rule 0) is 0 for `conchal`, and at least 0.5 exactly
   when the segment is protruding. The 0.5 threshold is a diorama
   convention — DeLano's type 3 criterion carried over to the ICA, matching
   `v.ica-protrusion`'s hedged "often defined as" — and the module header
   says so. Impossible combinations: rule 9.
3. *Septum on the ICA.* The minimum distance between the intersinus septum's
   posterior end and the ICA canal wall is 0 exactly when `septum_on_ica` is
   on and the sinus is at least `sellar`; otherwise it is positive.
4. *DeLano.* Optic canal circumference facing air (rule 0): type 1 → 0;
   type 2 → above 0 and below 0.5 (indenting); type 3 → at least 0.5
   (traversing); type 4 → an Onodi cell lies **medial and/or superior** to
   the nerve, which runs in the cell's lateral wall (the graph: the nerve
   runs immediately lateral to the posterior ethmoid cell), and the canal
   faces the cell's air, not the sphenoid's, over at least 0.25 of its
   circumference; the nerve is never inside the sinus lumen as a free tube.
   (The first pass had the cell lateral to the nerve: inverted.)
5. *Intercarotid window.* The minimum distance between the two ICAs' medial
   walls equals `intercarotid` within 0.5 mm over the whole range; `septum_shift`
   does not change it.
6. *Vidian.* Type 1: a ridge of positive height over the sinus floor;
   type 2: the canal on the floor with a lower ridge (height below type 1's);
   type 3: no ridge.
7. *Lateral recess.* With `lateral_recess` on, sinus air extends lateral to
   the vidian canal–foramen rotundum line by `lr_extent` (±1 mm); off, it
   does not.
8. *Names and ids.* Every part is `<graph id>.<side>` and its id resolves in
   the graph; every hazard id resolves; the URL codec round-trips and clamps
   hostile values; both themes compile.
9. *Impossible combinations degrade, by one table in the module* (and the
   HUD says what was degraded): with `pneum` = `conchal`, `ica_protrusion`,
   `ica_dehiscence`, `optic_type` 2–3, `optic_dehiscence`, `vidian_type` 1,
   `lateral_recess`, `clinoid_pneum` and `septum_on_ica` have no effect;
   `optic_type` 3 needs at least `sellar` (below it, type 2 is drawn). A
   test sets each such pair and checks the geometry equals the degraded
   configuration's.

## 7. Runtime architecture

### 7.1 Files

```
ssb.html                     shell: CSP, chrome, canvas, panels (no inline script)
css/ssb.css                  --ssb-* tokens (tissue kinds, cell categories, stage) + layout
js/ssb/main.js               entry (type="module"): feature detection, boot, error surface
js/ssb/frame.js              rasToScene / sceneToRas — the one coordinate conversion
js/ssb/stamps.js             GENERATED: data-asset path → hash (for fetch URLs)
js/ssb/graph.js              load + index content; text renderer; search
js/ssb/state.js              one store (mode, tier, layers, selection, camera, step);
                             URL-hash codec; ssb:* storage (guarded)
js/ssb/scene.js              renderer, cameras, lights, on-demand loop, quality choice
js/ssb/materials.js          procedural tissue materials: one shader hook per kind (three passed in)
js/ssb/geo-specimen.js       pack loading (gzip → GLTFLoader.parse), unit registry, dissection states
js/ssb/geo-sweep.js          tubes and flow particles
js/ssb/volume.js             CT/label/distance arrays: loading, affine, slicing, lookup (proximity later)
js/ssb/dioramas/*.js         parametric models (index.js registry, kit.js primitives)
js/ssb/mode-*.js             explore, endoscope, ct, procedure, lab, quiz
js/ssb/ui-*.js               panel, labels, tree/search, HUD, lab and CT controls
js/vendor/three-<version>/   three.js module build + the addons used (§8)
ssb/content/*.json           the knowledge graph
ssb/geometry/*.json          labels, landmarks, sweeps, station poses
ssb/models/, ssb/ct/         pipeline outputs
tools/ssb-content.mjs        graph validator (CI)
tools/ssb-pipeline/          offline geometry/CT pipeline
tools/ssb-fixture-ct.mjs     a synthetic volume in the same format, for tests (never written into ssb/)
```

Dependency direction is one-way and acyclic: `main → mode-* → {scene,
geo-*, volume, ui-*} → {graph, state} → stamps`, `scene → materials`,
`mode-ct → {volume, materials}` and `main → dioramas → {frame, materials}`. Only `scene` and `geo-*` import
three.js; the dioramas and `materials` receive it as an argument (they load
without WebGL: the URL whitelist and the tests read their tables), and
`mode-lab.js` uses the stage's `THREE`, so one module instance serves the
page. Built so far: `main`, `frame`, `stamps`, `graph`, `state`, `scene`,
`materials`, `mode-lab`, `dioramas/*`, `ui-panel`, `ui-tree`, `ui-search`,
`ui-lab`, `volume`, `mode-ct`, `ui-ct`, `geo-specimen`, `mode-specimen`,
`ui-specimen`. `mode-ct` and `ui-ct` are mounted from the graph alone (no
`scene`), which is why CT works where WebGL does not; `mode-specimen` is
loaded by dynamic import (`geo-specimen` pulls in three.js and its glTF
loader), so a failure there leaves graph mode and CT alone.

### 7.2 Cache-busting an ES-module graph

Stamps today cover `<link>`/`<script>` in root HTML only. A module graph
defeats that: `main.js?v=…` imports `./scene.js`, which the CDN caches on
its own clock — the exact new-HTML/old-asset pairing the stamps exist to
prevent. So (phase 1) `tools/stamp-assets.mjs` gains:

1. Regenerate `js/ssb/stamps.js` from the hashes of `ssb/**` data files.
2. Topologically sort `js/ssb/**` by relative imports (static and dynamic)
   and rewrite each specifier to `./x.js?v=<hash>` leaves-first, so a
   changed leaf re-stamps every importer up to the HTML. An import cycle is
   an error.
3. Vendored three.js lives under a versioned directory
   (`js/vendor/three-<version>/`); the version in the path is its cache key,
   so its internal imports stay unstamped.

`tools/check-data.mjs`'s stamp check covers module specifiers the same way.

### 7.3 State and URL

One store; everything else subscribes. The URL hash is the shareable state:
`#s=s.lateral-lamella&tier=2`, `#p=p.draf-iia&step=4`,
`#lab=ethmoid-roof&c.keros=III`, `#ct=cor&at=12.5,31,48`, and the rendering
quality override `q=full|lite` (§7.4). Parsing is
whitelist-only: ids must exist in the graph index, numbers are parsed and
clamped, unknown keys are ignored, and nothing from the URL reaches markup
except through `textContent` (`docs/security.md` rule 4). The lab hash is
`#lab=<diorama>&<key>=<value>…`: the diorama must be in the registry, keys
must be in its `PARAMS` (values clamped and snapped to the step; a `choice`
snaps to an option), and a classification id naming a preset
(`c.keros=III`) is applied before explicit parameters. The canonical form
written back lists only parameters that differ from their defaults; slider
drags update it once they settle, since browsers rate-limit history writes.

The CT hash is `#ct=<ax|cor|sag>&at=<r>,<a>,<s>`: the plane is exactly one
of those three names (or `axial`, `coronal`, `sagittal`), anything else
ignores the whole stage; `at` is the crosshair in RAS mm and must be three
finite numbers, else it is dropped (the viewer then sits at the volume's
centre). The store clamps it to a sanity range until the volume is loaded
and to the volume's own bounds after (`setCtBounds`), and the canonical hash
is rewritten; a crosshair drag settles before the URL is replaced, like a
lab slider. The stage is one of specimen, lab or CT: a hash with both `lab`
and `ct` keeps the lab, and entering one leaves the other.

### 7.4 Rendering

- **Materials: one procedural surface per tissue kind** (`materials.js`).
  A part's `look` names its `kind`; the library draws it as a
  `MeshStandardMaterial` extended through `onBeforeCompile` (three's lighting
  and shadows stay) with an albedo / roughness / relief hook. Bone is ivory
  with fine pitting and varying gloss; `bone-cut` is the flat solid cap
  colour for future section planes; mucosa is pink with a fine, domain-warped
  submucosal vessel network and a wet sheen (the endoscope's main surface,
  tuned under a single spotlight); cartilage, dura (fibrous grain), fat
  (lobules cut by thin septa), muscle, artery, vein, nerve (lengthwise
  striation), gland and brain follow. Air cells, air spaces and the flow
  pathway stay plain tinted surfaces. There are no textures and no UVs:
  every pattern is a function of the **world position in millimetres**
  (1 scene unit = 1 mm), so its scale is identical on every model and does
  not move when a model is rebuilt. Structured 2D patterns (vessels, fibres)
  are projected triplanar; isotropic ones (pores, mottling, lobules) are
  solid 3D noise, which needs no projection. Relief is a derivative bump in
  mm (independent of zoom), and detail finer than a pixel fades out from the
  pixel's footprint, so a far view is smooth rather than shimmering. Nerve and
  muscle grain follows a per-vertex `ssbAxis` tangent when the geometry has
  one (`kit.tubeGeometry` writes it).
  - Colors come from `css/ssb.css`: one `--ssb-*` token per tissue kind (plus
    an accent for the vessels and fat septa) and per cell category, read at
    boot and again on every `html[data-theme]` change; a missing token draws
    mid-grey, so there is no second copy of the palette in JS. The anatomical
    convention (artery red, vein blue, nerve yellow, bone ivory, dura
    grey-white) *is* the meaning, so it satisfies the site's color rule; air
    cells take categorical hues by identity (allowed — categorical colors
    that encode identity).
  - One compiled program per (kind, hazard, quality): the cache key is set
    explicitly (three would otherwise key on the hook's source, identical for
    every kind), so any number of parts share the compile; a selection adds
    materials, not programs. Ghosted walls and air spaces are see-through and
    stay plain.
  - **Quality** `full` or `lite` (fewer octaves, no domain warp, at most two
    projection planes, a plain-noise stand-in for lobules). Chosen at boot
    from device hints — a software rasterizer or old mobile GPU (renderer
    string), Save-Data, a small-memory or dual-core device, a phone-sized
    touch screen mean `lite` — and overridden by the hash key `q`
    (whitelist-only: exactly `full` or `lite`, anything else is ignored). A
    change of `q` recompiles the programs in place.
  - Nothing is animated: no time uniform and no frame requests, so
    `prefers-reduced-motion` needs no special case.
  - The generated-texture briefs in §11 stay a later refinement; this library
    is what draws until then.
- **Hazards are never color alone:** hatched shader overlay (over whatever
  the tissue looks like; its relief and gloss are flattened under the
  stripes) + text in the HUD. `--signal` marks UI emphasis only.
- Explore stage follows the site theme; the endoscope and CT stages are
  dark in both themes (like Airway's stage; CT's views use the `--ssb-ct-*`
  tokens, its info cell and truth strip follow the theme).
- Labels: DOM overlay with SVG leader lines, few at a time (selection,
  step, tour), decluttered by tier and priority; never "label everything".
- Picking: raycast on click, all intersections kept for click-to-go-deeper;
  no hover picking on touch devices.
- Camera flights respect `prefers-reduced-motion` (cut instead of fly).

### 7.5 Degradation, accessibility, mobile

- No WebGL2 → graph mode: tree, search, panels, procedures as text, CT mode
  (CPU-rendered) intact. Feature detection in `main.js`; the page never
  throws to a blank screen.
- The structure tree is a real DOM list mirroring the scene: keyboard
  navigable, selecting in either selects in both, selection announced via
  `aria-live`. Every fact reachable in 3D is reachable in the DOM.
- Phones: bottom-sheet panel, one-finger orbit, pinch zoom; endoscope mode
  steps between stations with drag-to-look rather than free flight.

### 7.6 Content text

Escape first, then transform the two allowed inline forms (`[[id]]`,
`*em*`). An unresolved `[[id]]` renders as plain text (the validator makes
this unreachable in committed content).

## 8. Security and CSP

`ssb.html` takes the self-contained-page policy unchanged:
`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none';
form-action 'none'` (fetches of `ssb/**` are same-origin under
`default-src`). The design is shaped so this holds:

- ES modules from same-origin files satisfy `script-src 'self'`; there is no
  import map (it would be an inline script). three.js now ships only
  unminified module builds — `three.module.js`, which imports
  `./three.core.js`; both are vendored side by side (Pages gzips them in
  transit). Every addon imports the bare specifier `'three'`; that one line
  is rewritten to a relative path at vendoring time,
  `js/vendor/README.md` records the patch, and `tools/check-data.mjs` pins
  the patched bytes.
- No WebAssembly (no Draco/meshopt), no `blob:` images (no embedded
  textures), no workers from blobs.
- Vendoring three.js is a new third-party dependency — **owner approval
  required** (`docs/decisions.md` §7) before phase 1.

## 9. Verification

| What | How | When |
|---|---|---|
| Graph schema, ids, refs, vocabularies, review gate | `tools/ssb-content.mjs` via `tools/check-data.mjs` | now, CI |
| Geometry ↔ graph | every pack node, sweep and landmark resolves to a graph id; every `geo: specimen` structure has geometry or is listed pending | phase 3, CI |
| **Spatial claims ↔ geometry** | each spatial `rel` (`medial-to` …) checked against landmark/centroid coordinates; a failure means the prose or the mesh is wrong | phase 3, CI |
| Measurements ↔ specimen | model value from `from`/`to` landmarks compared with the population range; outliers reported, not failed (n = 1 differs) | phase 3, report |
| Page boots, renders non-blank, zero real console errors | `tools/smoke-pages.mjs` entry for `ssb.html`; Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL headless | phase 1, CI |
| Behavior | `tools/test-ssb.mjs`, through the read-only `window.__ssb.lab` hook. Now (phase 2): each diorama loads on its lesson's view; parts resolve to graph ids and hazards; presets satisfy the graph's criteria; Keros I→III raises the lateral lamella by the preset difference; the AEA drop and supraorbital-cell rule follow the graph; the computed frontal pathway reproduces every IFAC rule under each uncinate attachment; clicking a part selects its entity; a hostile `#lab=` is clamped; reduced motion stops the particles; the dock never covers the canvas; phones get the sheet; the material library (graph kinds ↔ material kinds, tokens for both themes, every kind compiles and draws hatched or not at `q=full` and `q=lite`, hostile `q` ignored, programs shared, hatch visible, no animation). Later: tier filter; endoscope shaft blocked by tissue; storage failure is a no-op | phases 2–7, CI |
| CT mode | `tools/test-ssb.mjs`, through the read-only `window.__ssb.ct` hook, on the synthetic volume of `tools/ssb-fixture-ct.mjs` (the page's `ssb/ct/*` requests are routed to it, so the suite never depends on the real volume): `volume.js` in plain Node (affine round trip, exact trilinear, slices agree with `sample`/`labelAt`, radiological orientation, oblique planes, gzip by magic bytes, loader errors, name whitelist) and the `#ct=` codec; in the page, the three views render non-blank, the crosshair is drawn at the same RAS point in all three and a click moves it within a voxel, label lookup returns the fixture's ids, hover gives name and ≈HU, a click selects the entity, keys/wheel/window/outlines/colour key, outline colours are the materials' tokens and follow the theme, hostile `#ct=` is clamped or ignored, a missing volume shows a message, CT runs with WebGL blocked, phones show one plane | phase 5, CI |
| Citations | an agent matches every `src.*` against an authoritative record and sets `verified` only on a match; it also corrects the study-design `type`. **`verified` means the work exists as cited — not that it supports the claim**; claim support is the reviewer's and owner's job. Match against the PubMed record itself (NCBI E-utilities), never a search snippet: in phase 0 a search-listing check added a nonexistent co-author and a wrong PMID, both caught by the E-utilities re-check. Sources PubMed does not index (monographs, unindexed journal years) are confirmed by hand. | continuous |
| Medical correctness | adversarial expert-model review, then **the owner** flips `review` to `verified` | continuous |

## 10. Storage

Namespace `ssb:*`, through one guarded adapter in `js/ssb/state.js`:
`ssb:prefs` (tier, layers, scope angle, units), `ssb:srs` (self-test
Leitner boxes), `ssb:seen`. Registered in `docs/decisions.md` §3 when the
code that writes them lands.

## 11. Image generation (Gemini and others)

Generative images are wrong in exactly the way an atlas cannot afford:
plausible, confident, anatomically false, and hard for a junior to catch.
So the rule is **generated pixels never carry an anatomical claim.** Where a
generator is better than code:

1. **Tileable surface textures** for the endoscope mode (mucosa healthy and
   inflamed, exposed and drilled bone, dura, periorbital fat) — style only,
   no anatomy.
2. **Illustration plates, later:** our own deterministic render (outlines +
   depth) restyled by image-to-image, accepted only if it overlays the
   source render within tolerance; labels are always ours (SVG), never
   generated text.
3. **A cross-family content audit:** a different model family reviewing
   the draft graph's numeric claims catches errors correlated with Claude's
   own.

The repo holds no API keys (`CLAUDE.md`), so these run in the Gemini app by
the owner from ready-to-paste briefs with acceptance checks:
`docs/ssb-imagegen.md`. Procedural shaders come first (`js/ssb/materials.js`, §7.4); textures
are a phase-8 refinement, not a dependency.

## 12. Build plan

Each phase ends green on `tools/check-data.mjs` and the smoke suite, and
leaves the page useful. Model tier = who does the work best per token
(`docs/delegation.md`). This table is the plan's shape; **status, work
packages, checkpoints and order live in `docs/ssb-roadmap.md`.**

| Phase | Deliverable | Who |
|---|---|---|
| 0 | Architecture, schema, validator, draft graph, image briefs | Opus authors per region; Sonnet research and citation checks; Opus adversarial review |
| 1 | Walking skeleton: vendored three.js, `ssb.html`, module stamping, graph mode, smoke entry | Sonnet |
| 2 | Dioramas `ethmoid-roof`, `frontal-recess`, `sphenoid`, `lateral-wall`; variant lab; picking → panels | Opus (parameters, proportions, rules as a spec), Sonnet (build to the spec) |
| 3 | Reference specimen: pipeline, packs, Specimen stage, geometry ↔ graph checks | Owner (dataset, decisions); Opus (reconstruction, anatomy-critical), Sonnet (viewer) |
| 3b | Soft tissue (§5.7): mucosa, septal surfaces and charts, waypoint vessels, flap overlays, external nose | Opus (content, waypoints, flap spec), Sonnet (pipeline stage D, viewer, tests) |
| 4 | Endoscope mode: fulcrum optics, collision, proximity HUD, stations | Opus (math spec, station poses), Sonnet (rig, UI, tests) |
| 5 | CT mode: triplanar, label overlay, crosshair sync, oblique slice down the scope | Sonnet |
| 6 | Procedure mode: `removes` states, hazards in scene, station poses | Opus (content), Sonnet (wiring) |
| 7 | Self-test from the graph, Leitner storage | Sonnet |
| 8 | Offline caching, performance; image textures only where procedural materials fall short (§11) | Sonnet |
| ∞ | Content verification: citations checked, owner review | Sonnet, owner |

## 13. Owner decisions

Decided (owner, 2026-09-30):

- **Vendor three.js** — approved (same-origin, pinned; `js/vendor/README.md`).
- **Reference specimen: reconstruct from the UW atlas.** Its axial stack is
  treated as a CT volume, registered against UW's own coronal and sagittal
  reformats, scaled from the globe, and segmented with the labeled arrow tips
  as named seeds — gated on a feasibility check. Bone window only: vessels
  and nerves are sweeps placed at labeled points; thin lamellae get schematic
  touch-up.
- **UW permission covers publishing 3D geometry and volumes derived from
  its images** (owner-confirmed; record the authors' written permission with
  the reference when available).

O1–O3 were decided by the owner on 2026-10-02 (below); the roadmap's §2 lists what each unblocks:

- **O1 — Source of the external nose.** (a) Unmask a nose-only box of the
  specimen (real n = 1 naris, vestibule and alar skin; touches the "faces
  are removed" rule of §5.1), (b) a parametric nose diorama registered to
  the piriform aperture and ANS (schematic), or (c) both — specimen skin
  surface, cartilage as an overlay. Recommended: (c), if the nose is in the
  source's field of view (roadmap ST6-0 checks). **Decided: (c).**
- **O2 — Nose scope.** Entry anatomy only (vestibule, valves, ala,
  columella: the scope's fulcrum and walls) or also the rhinoplasty
  framework (ULC/LLC and crura, ligaments, SMAS). Recommended: entry anatomy
  now; the framework later as its own diorama. **Decided:** entry anatomy now; the full nasal framework is the intended end state (roadmap ST7).
- **O3 — Content authoring split.** Sonnet drafts the content backlog and
  checks citations, Opus reviews adversarially; Opus keeps authoring
  anything that places geometry. Recommended: yes. **Decided: yes.**

1. **Keep the CSP strict** (recommended: gzip, then Draco's JS decoder if
   needed). `'wasm-unsafe-eval'` for meshopt only if both fail the budgets.
2. **Publish while `draft`?** Recommended: publish with visible unverified
   markers (the wiki's precedent), prioritizing owner review of tier 1.
3. Name and URL (`SSB`, `ssb.html`) — working title.
