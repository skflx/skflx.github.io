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

**The external nose** (O2) is in scope to the full rhinoplasty framework:
tier 1 names the bones, cartilages, envelope and its subunits; tier 2 adds
the ligaments, tip support, the envelope's layers and dissection planes, the
valves and the vessels and nerves an open approach meets; tier 3 adds the
quantitative anatomy and the variant classes. It is built as the
`nasal-framework` diorama (§6.2) and, later, fitted under the specimen's own
skin. Its job beyond anatomy is to be the substrate of a rhinoplasty model
(§6.2, "Hooks").

Region ownership and the full inventory live in the graph
(`ssb/content/*.json`), not here.

### Reference atlases

External labeled imaging the graph is checked against, recorded under
`ssb/reference/` with provenance:

- **UW Interactive CT Sinus Anatomy** (University of Washington Department
  of Radiology; `ssb/reference/uw-sinusanatomy2/`; credit the atlas and the
  institution, never its individual authors by name) — labeled axial/coronal/sagittal stacks
  of a normal sinus CT, with every slice published as an unlabeled/labeled
  pair, plus normal-variant and inflammatory-disease pages. Its label
  vocabulary is crosswalked to graph ids (`crosswalk.json`), which fed
  synonyms and gap entities into the graph. Every labeled frame was also
  extracted to label positions (`slices.json`), from which within-slice
  spatial relations test the graph's `rel` claims (`relations.json`,
  `tools/ssb-pipeline/uw/relate.py`) — a relational check available before
  our own specimen exists, with the limits its README states. The authors' written
  permission arrived 2026-10-07 (terms in `ssb/LICENSE-data.md`), and the
  owner reads it as covering serving the images themselves, credited
  (`docs/realistic-anatomy.md` §13, RA-O1). The unlabeled/labeled pairs are a ready-made
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
  clamped to the last free depth. The tip is the shared 3D cursor (`state.cursor`, set once per animation frame that follows a pose change, so CT opens on it), and an inset in the controls shows the oblique CT slice through the tip spanned by the view direction and the camera's up, with the shaft drawn on it (hidden until the volume has loaded). The exposure is measured when the pose has rested 100 ms, not on every moving frame. Only bone blocks (display ≥ 150); the
  shaft length lying in mucosa is reported as mucosal contact, because this
  specimen is not decongested and a rigid scope displaces mucosa. A proximity
  HUD gives the distance in mm from the tip to each critical structure (ICA,
  optic nerve, skull base, orbit, AEA) from precomputed distance fields, the
  ones within 3 mm in the signal colour. This mode is
  where the fulcrum constraint teaches why the frontal recess needs a 45–70°
  scope and why posterior septectomy opens binostril work.
  The fulcrum `lm.naris` is the centroid of the vestibule lumen at the
  alar-rim band, measured on the unmasked axial stack
  (`tools/ssb-pipeline/uw/nose.py`; method in the landmark meta), inside
  the specimen's own nose (§5.1, ST6); the scope
  sees the air spaces' surfaces drawn as mucosa. Built (`js/ssb/scope.js`:
  the pose math and the `#scope=` codec, pure; `mode-endoscope.js`,
  `ui-endoscope.js`): a scope pose is a camera over the Specimen stage
  (`state.scope`, exclusive with the lab and CT), with a spotlight at the tip
  and a 70° circular field of view. Collision (E3, E3b): the shaft is clamped
  at bone and at the midline (R = 0, where the standard specimen centres the
  septum; the septum itself is below the bone level) except in the
  nasopharynx, behind and below `lm.choanal-arch.M`; the HUD reports which
  limit fired. Stations (E6): `ssb/geometry/stations.json` stores an
  endoscope pose per station and side (Opus, E5; a midline `.M` station is
  posed from the right nostril); the controls list this nostril's and the
  midline ones at the page's tier, and picking one flies the pose there over
  about 600 ms (depth, yaw, pitch; roll the short way round; the lens switches
  at the end), through the store like any pose change, so collision, the HUD
  and the CT inset follow; any other input cancels the flight, and
  prefers-reduced-motion cuts. `#scope=t.<id>[.<side>]` opens a station (side
  R when absent, the midline station for a midline id) and is rewritten to the
  ordinary pose; an unknown id is ignored like any hostile link.
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
  Specimen stage's 3D cursor (`state.cursor`), which the Endoscope stage moves
  to its tip. *Not built yet:* the 3D block toggle.
- **Procedure.** A procedure from the graph played as steps. Each step sets
  the station (camera pose), applies the cumulative dissection state (units
  the step `removes` disappear), highlights what comes into view, hatches
  the step's hazards, and poses the step's `think` as a prompt before
  revealing it. Scrub forward and back. A dissection state is a change to
  the *volume*, not only to the meshes: the removed units become air in the
  CT display and label arrays the scope reads, so collision, the tip-in-air
  rule of the stations and the proximity HUD all see the opened cavity
  (contract: §5.8). Procedures chain into corridors (FESS: uncinectomy to
  Draf IIa; EEA: transsphenoidal, sellar, transclival), played on the
  decongested mucosa (§5.9), both sides at once for FESS. The CT stage keeps
  showing the preoperative scan, as image guidance does, with the removed
  voxels outlined.
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
- Laterality in geometry names: `<id>.R` / `.L` / `.M`. Dissection units in
  geometry names: `<id>.<side>@<cut>` (e.g. `s.uncinate-process.R@uncinectomy`,
  `s.sella-turcica.M@sellar-opening`): the structure resected and the cut;
  a remnant mesh of a partly resected wall carries the same name (§5.8).

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

**Served as a standard specimen (owner, 2026-10-03, O6).** The first
release teaches normal anatomy, so what the page serves is the UW head
*standardized*: its right half mirrored onto the left, the nasal septum
centred, and a thin midline plate wherever a paired sinus's air would
otherwise cross the midline. It is not a real head (no head is
symmetric), and the page says so wherever the volume is shown. Why the
right half: in the as-scanned head the left side has the anomalies — the
left sphenoid ostium is closed by mucosa, the left nasal cavity holds
under half the right's air by label volume (2.8 vs 6.1 cm³, with a left inferior
turbinate twice the right's volume: compensatory hypertrophy against a
septum bowed slightly right), the left floor wall unit is a third of the
right's, and the left ethmoid bulla is unlabelled. The septum is centred,
not rebuilt: each column keeps its measured thickness (median 4 mm
mucosa to mucosa, the swell body ~10 mm), only its midline offset (at
most ~2 mm here) is removed, so the septal swell body and the thin
olfactory septum stay as scanned. The as-scanned volume stays the
pipeline's input (reproducible from the UW crawl, or from git at the
commit WP N1 names) and becomes a variant later — a septal deviation, a
closed ostium, asymmetric sinuses — rather than the default. Method and
acceptance: roadmap WP N1; the script is `tools/ssb-pipeline/uw/normalize.py`.
Decisions made when it ran (owner, 2026-10-05, simplicity first): the mirror
plane is R = 0, not the septum's fitted plane (the fit's tilt is printed, and
the gate is the fitted plane's R at the septum, not its extrapolation to the
origin); the frontal sinus's tables, which cross R = 0 in the as-scanned
head, are simply replaced by the mirror; a landmark that exists on one side
only stays as scanned.

Whatever is chosen, `ssb/LICENSE-data.md` records dataset, case id,
license and attribution for every derived file. Faces are removed: the
volume is cropped to the region and soft tissue outside a dilated bone
envelope anterior to the facial skeleton is masked to air — except the
external nose (O1 (c), roadmap ST6): between subnasale and nasion and
between the alar-facial grooves (above S 28 also |R| ≤ 12, so the medial
canthi stay masked), the unmasked skin, alae, columella and vestibule are
restored, centred and mirrored with the rest. Lips, cheeks and eyelids
stay masked. The grooves, the centring and the valve rules are in
`tools/ssb-pipeline/uw/nose.py` (ST6); the region comes from the raw UW
stack, so `normalize.py` needs the crawl (`fetch.py`) from ST6 on.

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

The served specimen is the standardized one (§5.1): `normalize.py` writes the
mirrored CT and labels from the as-scanned inputs, then reruns `walls.py`,
`meshes.py`, `sdf.py` and `softtissue.py` on them and makes the side pairs
exact (`normalize.py all`). Before the mirror it unmasks and centres the
nose; after it, it measures the internal valve and labels the vestibule
(ST6), and `nose.py pack` writes the `nose` pack last. The side-relative scope `yaw` means a mirrored pose
keeps its yaw (`js/ssb/scope.js`).

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

The `lining` pack is not part of the boot: it is fetched once, the first time
the mucosa layer is seen from within (the camera in the air box, or the scope),
and until it arrives the air shells are drawn as before (`geo-specimen.js`
`loadLining`, ST1c).

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
inverse is computed), `dtype: uint8` (or `int16`, §5.10), `windows` (presets in the file's own
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
| Mucosa (sinus and nasal lining) | the air spaces' own surfaces — the air/tissue boundary *is* the mucosal surface — drawn with the `mucosa` material; no thickness is modelled. Each air space is its own closed shell (the outside view), so every opening is a double membrane; from inside (the camera in the air box, or the scope) the `lining` pack is drawn instead: one surface over the union of every air label, split into nodes by the label each triangle faces, so openings are open (`lining.py`, ST1b). Its nodes repeat the shells' names; the viewer keys them `lining:<id>.<side>`, and a pick reports the graph id | specimen |
| Septal mucosa | the faces of the `s.nasal-septum.M` wall unit that face each nasal cavity, meshed per side, with a **chart**: the surface's sagittal projection (a, s) in mm and a lookup grid back onto it, so anything drawn on the septum is specified in 2D | specimen |
| Nasal floor mucosa (for the extended flap) | the floor bone `s.nasal-floor.*` is separated from the air by 1–3 mm of unlabelled soft tissue, the mucosa, so the surface is the airway lining itself: the cavity's lining triangles facing down (normal S ≤ −cos 45°) within 6 mm of floor-bone voxels, at or in front of the PNS plane (A ≥ −50), largest component (`softtissue.py`, ST2c). Its chart is axial, (a, r) → s, with r = \|R\| (the left chart is the right one: the standard specimen is symmetric), and a `junction` polyline against the septal chart's `bottom(a)` | specimen |
| Small arteries (posterior septal and its branches, PLNA branches, septal AEA/PEA branches, nasopalatine, superior labial) | sweeps (§5.5) generated from **waypoints** — landmarks or chart points — at a stated depth below the surface; every point `inferred`, every waypoint cited | specimen-placed, inferred |
| Flap territories (nasoseptal: short, full, extended; rescue incisions; later IT/MT/lateral wall flaps) | **overlays**: outlines computed at runtime on a chart from landmarks plus the graph's measurements and the procedure's steps, with parameters and presets like a diorama's | schematic on specimen |
| External nose (naris, vestibule, valves, ala, columella) | the specimen's own skin and vestibule, unmasked from the UW axial stack (§5.1; ST6, O1 (c), O2): skin surface `s.external-nose.M` (pack `nose`, one open surface) and the vestibule air `s.nasal-vestibule.<side>` (the `core` pack; vestibular skin, not mucosa) are both drawn with the `skin` material, which a model node asks for through its glTF `extras.kind`; the Nose layer toggles the skin. The internal valve `s.internal-nasal-valve.<side>` is the centroid of the narrowest coronal section of the airway connected to `lm.naris` (a landmark, measured), and that plane is the vestibule \| cavity boundary, the limen nasi: a proxy for the mucocutaneous junction, which CT does not show. The flat section minimum and the tip cut flat by the source image's border are limits (`nose.py`) | specimen, measured |
| Nasal framework (ULC, LLC crura, accessory chain, septal cartilage, ligaments), the envelope's layers, the external nose's vessels and nerves | cartilage, ligament, fat and SMAS are not resolvable on this bone-window CT: the parametric `nasal-framework` diorama (§6.2, roadmap ST7c), then fitted under the specimen's skin and on its nasal bones (ST7e) | schematic; schematic on specimen once fitted |

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
`s.nasal-floor-mucosa.X` (chart (a, |R|) → `grid.s`, with its `junction` rows to
the septal chart's `bottom(a)`; ST2c); the landmarks `lm.sphenoid-ostium.X`,
`lm.choanal-arch.M`, `lm.middle-turbinate-head.X`; the ostium's inferior
margin `s_f` (`landmarks.meta.json`, `lm.sphenoid-ostium.X`
`inferior_margin_s_mm`, written by ST2b; right ≈ 23.5, the lowest S of the
patent cavity | sinus interface); the meshes of both surfaces (for areas).
From the septal chart: `top(a)`, `bottom(a)`, `post(s)`, `a_ant`. `top(a)`
is interpolated linearly across columns with no data (the posterosuperior
gap, A -45…-35) from the nearest occupied columns either side. In the
reference specimen the septal surface stops about 4 mm in front of the
rostrum and at the internal valve plane (the vestibule is its own label
since ST6, so the chart ends there): the overlay clips to what exists and
says so.

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
   mucocutaneous junction where the chart reaches it — on the specimen the
   chart's anterior edge is the internal valve plane, ST6's proxy for the
   junction, which CT does not show); on the floor chart
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
specimen**; a note that B and C end at the internal valve plane, the proxy
for the mucocutaneous junction, which CT does not show.

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

### 5.8 Dissection states (P1, 2026-10-08)

**Why the volume, not the meshes.** A station needs its tip in an air
label, the scope's collision samples the CT display volume, and the
proximity HUD reads distance fields. Hiding a resected structure's mesh
changes none of these: the scope would still stop at bone that is gone and
look at a lining that seals the opened cell. A dissection state is
therefore a change to the CT display and label arrays: every removed voxel
becomes air (display `air.fill`, label the nearest air space the unit
opens into), and the lining is re-meshed on the opened air.

**Anatomy as data.** `tools/ssb-pipeline/uw/dissection.json` (Opus) holds
the units, their rules, and which procedure step applies which unit. A
unit is a **rule over the base's own labels, landmarks and distance
fields**, never a hand-drawn voxel set, so it re-runs on any base (§5.10).
Its name is `<graph id>.<side>@<cut>` (§4); `realizes` lists the content
ids it stands for. Three operators:

| `op` | Removes | Used for |
|---|---|---|
| `window` | voxels in the box with d(a) + d(b) ≤ `sumMm`, a and b two air-space sets: the rule `walls.py` uses to define a wall, so a resection is a window in what two compartments share. `shell` keeps a wall of given mm around named air spaces (opened by a later unit) | uncinectomy, antrostomy, basal lamella, sphenoidotomy, Draf IIa |
| `exenterate` | the morphological closing (ball of `closeMm`) of a group of air spaces, inside the box: partitions thinner than about 2 × `closeMm` go, thicker walls stay | bulla, anterior and posterior ethmoid, agger and frontal recess cells |
| `region` | every voxel of the named labels (or any non-air voxel) in the box, optionally only within `nearAirMm` of named air | posterior septectomy, rostrum, intersinus septum, sellar opening, clival recess |

Boxes are side-relative (r = σR) and every bound is a number or an anchor
expression on a label's extent or a landmark (`"s.ethmoid-bulla.amax - 5"`,
`"lm.middle-turbinate-head.a - 6"`), resolved on the base. Common rules:
a `keep` list (lamina, skull base, turbinates, septum for FESS; the posterior
ethmoid and planum for the EEA corridor) is never carved, on either side;
the **guard** keeps every carved voxel ≥ 1 mm from the ICA, optic nerve
and AEA tubes and the orbital contents, re-applied after mirroring (the ICA
sweeps are not exactly symmetric). On the standard specimen the right side
is computed and mirrored; midline units are computed whole.

**Procedures, states, corridors.** `procedures` maps each step of a
procedure to its units; `entry` lists the procedures assumed complete
before step 0 (a Draf I in a full FESS comes after the sphenoethmoidectomy,
per its own step 0). A **state** is the cumulative unit list at a step
(entry chain, then the steps up to it) or at a position in a corridor;
identical lists are one state. On the standard specimen: 15 states, 10 on
the FESS side (uncinectomy → antrostomy → bulla → anterior ethmoid →
basal lamella → posterior ethmoid → transethmoidal sphenoidotomy → Draf I
→ Draf IIa, plus the transnasal sphenoidotomy alone) and 5 on the EEA
corridor (posterior septectomy, rostrum and wide sphenoidotomies →
intersinus septum → sellar opening → clival recess, and the transclival
approach alone). Consistency with the graph (checked in CI from P1b on):
every id a step `removes` is realized by a unit on that step or before it,
or listed under the procedure's `unrealized` with the reason; every unit
on a step realizes at least one id that step removes; every unit name is a
graph id. Unrealized in v1: the frontal beak (inseparable from the anterior
table wall unit), the accessory sphenoid septum (not segmented), the dorsum
and posterior clinoids (upper clival third: pituitary transposition is
intradural, not modelled).

**Truth kind.** A state is *specimen, dissected (rule-based cut)*: the
cut is schematic even where the bone is real, and several units stand in
for structures the specimen does not segment (uncinate, bullar lamella,
rostrum; the basal lamella is a proxy plane). Each unit's `truth` says
which. The uncinate is fused into the maxillary medial wall unit here, so
the uncinectomy opens the infundibular trough and the hiatus and leaves
the wall; the natural ostium appears with the antrostomy.

**Pipeline outputs (WP P1b, `tools/ssb-pipeline/uw/dissect.py`; done).**
- `ssb/states/index.json`: `version`, `base` (the first 10 hex of the SHA-256
  of the base CT display and labels), `ctFill`, `states`, `procedures`,
  `corridors`, and the unit voxel counts against `measured`. Per state key
  (the first 10 hex of the SHA-256 of its unit list in application order,
  one unit per line): `units`, `usedBy` (`"p.draf-i#2"` for a procedure
  step, `"fess:p.draf-i#2"` for a corridor position), `patch`, `lining`,
  `hides` (wall nodes a state removes entirely), `remnants` (wall node ->
  the remnant node that replaces it in the state's lining pack) and
  `measured` (carved voxels, bytes, guard minima per field and side, keep
  violations, the post-mirror guard count, symmetry). `procedures[p]` is
  `{entry, steps: {step: key}}` (`entry` null when the procedure starts on
  the intact head); `corridors[c]` copies the data's entry and adds
  `positions: [{procedure, step, state}]`.
- `ssb/states/<key>.ssbp.gz`: a **patch**: a u32 header length, a JSON
  header (`version`, `base`, `state`, `units`, `ctFill`, `boxes:
  [{side, ijk0, dims}]`), then per box a u16 array, x fastest: 0 = unchanged,
  else the voxel's new label (its display becomes `ctFill`). Each patch is
  whole from the base (random access to any step), at most one box per
  side: `R` (voxels right of R = 0), `L`, and `M` (the R = 0 plane). The
  format is the dense-box patch of the realistic-anatomy plan (PR #119)
  with a constant display, so one loader serves both.
- `ssb/models/lining-<key>.glb.gz`: `lining.py`'s method on the state's air
  (built to 33 000 triangles with the remnants), plus remnant meshes
  `<id>.<side>@<cut>` (the cut of the last unit that touched the wall; the
  node's `extras.cut`) for each wall label a state cuts partly. **Not listed
  in `packs.json`**: the Specimen stage loads every pack that file lists, so
  the state linings are loaded on demand from the index (P2 decides how).
- Distance fields are not recomputed: the guard keeps every cut away from
  the structures they measure.
- Budgets: a state lining <= 350 kB gzip, all state linings <= 6 MB, a patch
  <= 100 kB (`tools/check-data.mjs` enforces them, and the `dissection.json`
  <-> graph rule above).
- Evaluation notes (where the data left a choice): anchors read voxel
  centres; a right-side unit's box never reaches r < 0 and its result is
  mirrored per unit, the guard applied again on the mirrored voxels; the
  air sets of a right-side unit are its `.R` and `.M` labels, of a midline
  unit all three sides; `exenterate` is the closing by Euclidean thresholds
  (dilate to `r`, keep what is farther than `r` from outside the dilation);
  the working air is the cumulative state, so a later unit sees the earlier
  carves.

**Runtime (WP P2, built).** `volume.js` has a pure `parsePatch(bytes, volume)`
(refuses with a `VolumeError` a wrong `base`, a box outside `dims`, a label
the table does not name, a body that is not the boxes' size, version 2) and
`applyPatch(volume, patch)`, a derived volume with the same API plus
`carvedAt` (the base is never touched). `js/ssb/mode-procedure.js` plays a
procedure as the scope stage with `state.procedure = { id, step, cor }`
behind it (§7.3), not a fifth stage: the endoscope's collision, tip label
and exposure read the state volume (`setStateVolume`), the CT stage and the
scope's CT inset keep the base image, the CT stage outlines the carved
voxels (`mode-ct.js` `setCarved`; entering CT ends the procedure as it ends
the scope, and the outline stays pinned until CT is left), the specimen
stage swaps in the state's pack by key (`geo-specimen.js` `loadState` /
`unloadState`, the last three kept) and draws a step's `see` structures and
the `at` of its `risk` hazards through what hides them, hazards hatched
(minus the walls the state cuts: only a thin rim of one is left, which drawn
through the lining reads as a detached slab; the opened cavity shows the cut).
`ui-procedure.js` is the step list, the `think` behind "Think first" (click
or `T`), Previous / Next / `[` `]`, the corridor picker and the state
badge. Index shape read (P1b writes it; `parseIndex` is tolerant of the flat
`"<p-id>#<n>"` form): `procedures: { "<p-id>": { "<step>": <key> } }`,
`corridors: { "<key>": { name, procedures, positions: { "<p-id>#<n>": <key> } } }`.
**Step n is 0..N**: 0 is the start (the entry state, or the intact specimen),
n >= 1 the state after step n; N is the highest step the index lists for the
procedure; a step the index does not list takes the nearest lower one (a
step that removes nothing is the same state). A step lands on what its state
opened (WP P4): the scope flies (a step the reader takes) or jumps (a `#p=…&step=n`
link with no `scope=`) to a view of the state, by the rule under **Stations**
below; a link that carries `scope=` keeps its pose. The index is fetched only when `js/ssb/stamps.js` lists
`ssb/states/index.json` (`ssb/states` is one of the stamped data dirs), so a
build without states makes no request. A state pack (`packs.json` entry with
`"state": <key>`) holds the state's lining nodes `<id>.<side>` and its
remnants (extras `cut`, or a name ending `@<cut>`); remnants replace the base
wall of the same id and side, `hides` hide base nodes by key. The hides,
remnants and state-lining paths are covered on real packs only once P1b's
files exist (`--only procedure`, real-data section).

**Stations.** `ssb/geometry/stations.json` gains `byState: {<state key>:
{"t.<id>.<side>": {pose, target, measured}}}`, posed by E5's rule on the
committed state (WP P3, `tools/ssb-pipeline/uw/stations.py`: it ports
`scope.js`, tests P1's prototype pose on the state's own volume first and
searches only when that fails; `check` re-tests every committed pose, `write`
re-poses after a regeneration of the states). The tip must lie in an airway
label *of that state* (a space, an ethmoid cell, the frontal recess; not the
vestibule). A station the contralateral nostril reaches is keyed by its
target's side. A pose posed for state A is free in every state B whose units include A's
(carving and decongestion only turn tissue into air; `--only scope` tests it on every
such pair), so the **views of a state** are its own `byState` poses, then those of
each state whose units are a proper subset of its own (most units first, a key
posed by a nearer state shadowing a farther one), then the intact `stations`. The
**landing** of a step is: the step's own station when the state's *own* poses have one
for it; else the first of the state's own views (the
order of `TABLE` in `stations.py`: what the state opens comes first); else the
nearest inherited view; else the intact pose of the step's station; else the pose
stays and a note says so. The procedure also lands on step 0 of a position that
has a state (the posterior ethmoidectomy and the transclival approach, in their
corridors). The station list shows "This state" (the views, the step's station
marked) above the nostril's intact stations. A row of `stations.py` may name its
state as `<corridor>:<p-id>#<n>` (a corridor position), a target as `lm` (an exact
landmark), `carvedDiff` (the centroid of what one state carves beyond another) or
`prominence` ranking (the share of rays on the sphenoid lateral wall above S = 24, the
carotid prominences, with `both`: a minimum share on each side); a 0° lens is
searched with the roll fixed at 0. A pose may carry `"shaft": "2.7"` when only
the 2.7 mm telescope reaches it (the olfactory cleft and the inferior
meatus, §5.9); flying there switches the shaft and the controls say so.

### 5.9 Mucosal state: decongested · as scanned · congested

The specimen is not decongested (CP-1, E5): its per-side nasal-cavity
cross-section averages 1.6 cm² between the MT head and the choana, and the
as-scanned left side 0.65 cm². A three-way toggle shows the mucosa
decongested, as scanned, or congested, as a patch on the base (the same
format as §5.8), applied before any dissection; procedure mode always plays
on the decongested state (the operations start by decongesting).

- **Operator** (WP DC1): soft tissue (display 78 ≤ v < 120) of the
  erectile labels, inferior and middle turbinate and the side's half of the
  septum, within d mm of that side's nasal-cavity air recedes to air, never
  closer than 0.5 mm to bone (display ≥ 120), between the choana and the
  internal valve. The congested state grows the same tissue into the air.
- **Decongested, calibrated** on Xiao et al. 2021 (Sci Rep, full text; MRI
  of 10 healthy adults aged 21–38, before and 10 minutes after
  xylometazoline 0.1%): the mean cross-section between the first vertical
  plane and the posterior septum rose from 2.8 to 3.8 cm² (34.8 %), least
  in the superior third and around the valve, with the surface area
  unchanged. d is the smallest step (0.25 mm) that raises the specimen's
  mean per-side CSA over that span by at least the same ratio (3.8 / 2.8).
  Prototype: d = 1.0 mm gives × 1.39, and the superior third gains least in
  absolute terms (0.13 cm² against 0.25 and 0.24); the pipeline reproduces
  it (`tools/ssb-pipeline/uw/mucosa.py decongested`, record in
  `ssb/states/mucosa.json`, "never closer than 0.5 mm" read as: a voxel
  adjacent to bone, at 0.5 mm, may change; bone itself never does). The ratio, not Xiao's
  absolute values, is used: the specimen's label is a bone-window CT
  threshold and Xiao's an MRI segmentation. Measured on NasalSeg's CTs at our
  threshold (POP1, 10–90 % of the cavity's length, CP-POP1), the standard
  specimen's two-side mean cross-section is ordinary (62nd percentile of
  the clear subjects), so the gap to Xiao's 2.8 cm² is method and
  population (MRI, adults aged 21–38), not a narrow head or a segmentation
  defect. The operator never changes the septum's midplane (R = 0), so
  decongestion cannot perforate it.
- **Congested** is physiological: the congested phase of the nasal cycle,
  on both sides. Its target is POP1's median of the more congested side's
  mean cross-section against the subject's two-side mean (`profiles.summary
  .restricted["10-90"].moreCongestedOverMean` in
  `ssb/anatomy/population/nasalseg.json`, span settled at CP-POP1); d is the
  0.1 mm step whose ratio is closest to it. In NasalSeg the loss sits in the
  middle of the cavity, at the turbinates. Head A's own left side is not
  used: at our threshold it is near the population's 5th percentile of
  sides, with a smaller/larger ratio at the 6th (POP1; POP0's "beyond every
  subject" compared rim-inclusive labels with ours).
  **Built (DC1); turbinates only (CP-3b).** The CT grid is 0.5 mm, so
  growing the tissue by d < 0.5 mm changes nothing and the first step that
  does is a whole layer of voxels: with all three erectile labels advancing
  the ratio goes 1.00 → 0.76 (d = 0.5 mm) → 0.66, and the target 0.873 is
  not reachable within ± 0.04. With the two turbinates only, the first layer
  gives 0.851 (d = 0.5 mm; the septum alone 0.909, both together 0.76), which
  is within ± 0.04 and puts the largest loss in the middle third along A. The
  shipped congested state is therefore the **turbinates' layer**, as POP1's
  finding that the loss sits at the turbinates suggests. Accepted at CP-3b:
  the septum's erectile tissue is the septal swell body opposite the middle
  turbinate head (`s.septal-swell-body`), not the whole septal half the
  three-label operator grows, so the turbinates alone are the closer
  approximation on a 0.5 mm grid; adding the swell body as a bounded septal
  region is a refinement for when it has geometry, not a correction; `mucosa.py congested --group all` builds the
  three-label operator instead (ratio 0.76, outside the tolerance). The
  patch writes one constant display (the median of the erectile soft tissue)
  and the labels of the nearest turbinate. The owner may still overrule
  (roadmap O13, decided as recommended).
- **Pipeline and files (WP DC1).** `mucosa.py` writes a patch and a lining
  pack per state (`ssb/states/<key>.ssbp.gz`, `ssb/models/lining-<key>.glb.gz`;
  key = first 10 hex of the SHA-256 of `mucosa.dec` / `mucosa.cong`), with the
  calibration table in `ssb/states/mucosa.json`; `dissect.py` applies the
  decongested operator first, so every dissection patch is whole from the
  as-scanned base (it includes the decongested voxels) and records
  `mucosa: "dec"`, and copies both mucosal states into `index.json` (`states`
  with `units: []`, and a top-level `mucosa: {dec, cong}` naming their keys
  and calibration). The erectile walls (turbinates, septum) get remnant meshes
  `<id>.<side>@decongested` / `@congested` at half their usual triangle budget
  (their surface moves in every mucosal state), so the lining keeps about
  two thirds of the state budget. Runtime: `state.mu` (§7.3); the procedure
  player (`mode-procedure.js`) loads a mucosal state like any other state
  (patch → scope volume, pack → specimen) when `mu` is not `scan` and no
  procedure plays, and a procedure always uses the decongested one (step 0
  with no entry state is the decongested state itself); the toggle is in the
  Specimen controls (`ui-specimen.js`). CT keeps the base image.
- **What decongestion does not open.** At Xiao's ratio none of E5's three
  closed views opens. The olfactory cleft and the inferior meatus are
  closed to the 4 mm shaft, and open to the 2.7 mm telescope even as
  scanned (P1 prototype: the cribriform plate fills 96 % of the cleft view;
  the lateral wall 89 % of the meatus view with the tip lateral to the
  inferior turbinate). The 45° frontal recess view opens with the Draf I
  entry state. Mucosal edema of rhinosinusitis (sinus lining, polyps) is
  pathology, the realistic-anatomy plan's `fill` operator, not this toggle.

### 5.10 New data: population, more heads, 16-bit CT

A **head** is a base: a CT and a label volume (every name a graph id) in
the §4 frame, plus everything the pipeline derives from them. Everything
downstream — walls, meshes, lining, distance fields, dissection units,
mucosal states, station poses — is a rule over a head's labels and
landmarks, so a new head gets FESS and the EEA corridor by re-running the
pipeline once it has the labels those rules name. Layer order on any
head: base → variant → condition (the realistic-anatomy plan, PR #119) →
mucosal state → dissection.

- **Population (NasalSeg, CC BY 4.0, 130 CTs of which 107 distinct; POP0 in
  PR #119).** Numbers ship, scans do not. Uses: (1) *placement*: every
  base's cavity and maxillary volumes, asymmetry indices and (POP1)
  cross-section profiles as percentiles, shown with population truth;
  (2) *calibration*: the congested state, and the mild / typical / marked
  grades of asymmetry variants; (3) *averaged normal*: a population
  reference (median and IQR profiles; a mean shape of the five NasalSeg
  structures registered onto the head as a ghost overlay), population
  truth, not a head. Deforming a head toward the population median is a
  composite and covers only the five structures NasalSeg labels: owner
  decision O9.
- **Label conventions (checked 2026-10-08 on 91 distinct clear NasalSeg
  subjects; scratch script, method for POP1).** NasalSeg's labels and ours
  differ in convention more than in quality. Its nasal cavity runs from the
  nostril to the choana (vestibule included: anteroposterior span median
  66 mm, against 42 mm for our cavity label alone) and takes in the
  partial-volume rim: a median 26 % of its voxels lie above our air
  threshold (display 78, about −482 HU), and the 95th percentile of their
  values is −279 HU. Compared at one convention (our threshold, cavity plus
  vestibule), head A's cavity, 7.7 mL per side, is at the 42nd percentile
  of NasalSeg's; its maxillary sinus, 13.7 mL, at the 51st; its mid-cavity
  cross-section (one section) at the 37th, its mean over 10–90 % of the
  length at the 62nd (POP1). Our labels leave less adjacent air unlabelled
  than NasalSeg's (cavity 3.9 % against a median of 10 %; maxillary 1.5 %
  against 6 %). So for the five structures NasalSeg labels, the
  approximated segmentation holds. NasalSeg cannot check what the FESS
  units stand on (the uncinate, the ethmoid partitions, the infundibulum),
  which it does not label: that is the resegmentation's job (PR #119, RS).
  A voxel-level check (a model trained on NasalSeg, run on head A) is WP
  SEG1, waiting on an owner decision (O12).
- **Cross-section profiles (POP1).** Per clear subject and side, the cavity
  label's section profile along its own anteroposterior axis (1 mm sections,
  mean from 10 to 90 % of the length), reported as labelled and restricted
  to our air threshold; method in the docstring of
  `tools/ssb-pipeline/nasalseg/stats.py`. Head A's labels are already at our
  threshold, so only the restricted rows compare like with like. The
  span is 10–90 % (CP-POP1): only 0–100 % moves head A's percentile by more
  than 20 points, because its end sections are the vestibule border and the
  choanal cut, where the conventions differ most; the JSON keeps all three
  spans.
- **Population panel (WP POP2a).** The Specimen dock's "Population (NasalSeg)"
  section (`js/ssb/population.js`, `js/ssb/ui-population.js`) reads the file
  above and nothing else: the 10–90 % restricted rows, the standard specimen
  and the as-scanned head set against the clear subjects' median and IQR.
  It hides itself when the file is missing or malformed.
- **Variants from NasalSeg.** Subjects at chosen percentiles (maxillary
  hypoplasia, marked cavity asymmetry) are real 16-bit CTs: exemplars that
  calibrate the variant layer, and bases of their own once resegmented
  (their five labels do not include the ethmoid that FESS units need).
- **16-bit intake (WP IN1, built).** `ct.json` takes `dtype: "int16"` with
  `values.kind: "HU"` (windows in HU, no LUT; the data file is `ct.i16.gz`,
  little-endian) and optional per-head `levels: {air, bone}` in the file's own
  values. `volume.js` reads both dtypes (`vol.range`, `vol.levels`; `toHU` is
  the identity on an HU head); the CT stage's window and LUT span the head's
  range; the scope's collision takes `levels` as `shaftClearance`'s last
  argument (`mode-endoscope.js` passes the header's), defaulting to `BONE_LEVEL`
  150 and `SOFT_LEVEL` 78, so collision behaves the same on any head. Outside
  the volume is "no data" on any scale (neither bone nor mucosa). Head A stays
  8-bit. `tools/ssb-pipeline/intake/intake.py` reads NIfTI-1 and NRRD (DICOM
  would need `pydicom`, an owner decision), fits a rigid transform to the §4
  frame from landmark correspondences it is given, resamples to an isotropic
  grid and writes `incoming/<name>/` only; shipping a head under `ssb/` (with
  its licence line in `ssb/LICENSE-data.md`) is a separate decision. The RA
  landmark set (RS6) is what the correspondences will be once it exists.

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
literally), profile extrusions (prisms) for plates and the skull base, cylinders (`cyl`, with an implicit test) for canals and nerves, tubes
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
| `nasal-framework` | envelope thickness and depth shown, dissection plane, keystone, valve angle, lateral crus size and orientation, interdomal distance, tip tripod legs, L-strut, variant classes of the nasal bones, medial crura, columellar and angular arteries, external nasal nerve, depressor septi (§6.2) | `c.nasal-bone-shape`, `c.medial-crura-shape`, `c.angular-artery-course`, `c.external-nasal-nerve-branching`, `c.depressor-septi-type` |

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

*Built (D2) as `js/ssb/dioramas/sphenoid.js`, `kit.js` gaining a `cyl`
solid (canals and nerves need an implicit test; an optional `arc` leaves a
dehiscence gap, mesh and test alike) and a `zMax` for `super`. Two readings of
the spec: rule 2's "segment" is judged where the sinus reaches it (parasellar
from sellar, paraclival from postsellar; in presellar the ICA lies behind
all air, share 0 whatever the toggle, which rule 9's table does not list),
and rule 3's distance is to the parasellar canal wall. The tests are
`tools/test-ssb.mjs --only lab`.*

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
   with `presellar`, `ica_protrusion` and `ica_dehiscence` have no effect
   (the air ends in front of the sella's anterior wall, so it never reaches
   the parasellar carotid: a share of 0 is the anatomy, not a bug — added
   at the D2 checkpoint, 2026-10-03);
   `optic_type` 3 needs at least `sellar` (below it, type 2 is drawn). "No
   effect" means the parameter takes its default and the HUD names it. A
   test sets each such pair and checks the geometry equals the degraded
   configuration's. Rule 2 judges a carotid segment only where the class
   reaches it: the parasellar segment from `sellar`, the paraclival from
   `postsellar`.

### 6.2 The `nasal-framework` diorama (ST7 spec)

*Spec by Opus, 2026-10-07. Every number below is from a PubMed record
read for this spec (abstracts only; the source set, its PMIDs and what each
supports are in roadmap WP ST7a), or it is marked schematic. Owner
decisions O14 (where it is drawn; open) and O8 (which population and class
the defaults come from; decided 2026-10-08: mixed and labelled, modal
classes) are in §13: either answer changes defaults, not structure. Not built.*

**What it is for.** The external nose as rhinoplasty sees it: the
framework (bone, cartilage, ligaments), the soft-tissue envelope in its
layers, and the vessels and nerves in the layer each actually runs in —
built so that a later rhinoplasty model ("Hooks", below) can change the
framework and watch the envelope, the valve, the tip support and the blood
supply respond. Three teaching rules are computed from the drawn solids,
never written in: the **tip tripod** (projection and rotation follow the
legs' lengths), **what a dissection plane carries** in the flap (vessels and
the external nasal nerve, by layer), and **how envelope thickness shows or
hides the domes**.

**Frame and anchors.** Local RAS mm in the specimen's convention (§4):
origin at the anterior nasal spine, axial plane Frankfort-parallel, x = 0
midsagittal. The default nose therefore sits where the standard specimen's
does, and fitting it to the specimen (ST7e) changes anchors, not frame.
Anchors (`.M` unless sided):

| Anchor | Default (RAS mm) | From |
|---|---|---|
| soft-tissue nasion `lm.soft-tissue-nasion` | (0, −5.5, 41.5) | standard specimen, measured at CP-2b on the unmasked stack (roadmap ST6; ±1.5 mm); ST7d writes it |
| pronasale `lm.pronasale` | (0, 18.0, 4.5) | same (the tip may be flattened 1–2 mm by the reconstruction edge) |
| subnasale `lm.subnasale` | (0, 7.0, −6.5) | same |
| alar crease `lm.alar-crease.R/L` | (±21, 1.0, 1.0) | schematic until ST7d (ST6 found the alar-facial groove at \|R\| 19–24) |
| ANS `lm.anterior-nasal-spine` | (0, 0, 0) | the frame's origin |

Everything else is constructed from them, in this order:

1. *Dorsal line*: the straight line nasion → pronasale; its parameter t
   (0 at the nasion, 1 at the pronasale) indexes the envelope thickness.
2. *Domes*: the domes' midpoint lies under the pronasale, inward along −A by
   the tip's envelope thickness T(tip); the two dome tops are
   ±`interdomal`/2 from it in R.
3. *Anterior septal angle* `lm.anterior-septal-angle`: 5.7 mm behind the
   domes' midpoint (projection, along −A) and 5.5 mm cephalic to it (along
   the dorsal line toward the nasion) — Daniel & Palhazi's dome–ASA offsets
   (`m.dome-asa-projection`, `m.dome-asa-caudal`; "projection" and "caudal"
   read as those two axes: our reading, flagged for the full text).
4. *Rhinion* `lm.rhinion`: on the dorsal line at t = 0.45, inward by
   T(rhinion) (t schematic; ST7d measures it on the specimen's bone).
   *Sellion* `lm.sellion`: t = 0.1, inward by T(nasion) (schematic; the
   term is Lazovic 2015's).
5. *Piriform rim*: a curve from the nasal bone's caudal lateral corner down
   and medially to the ANS, at most \|R\| 12 (schematic; ST7d traces the
   specimen's).

**Parts** — each `<graph id>.<side>`, kind by `userData.look`, `kit.js`
primitives only (two added by ST7b: `strip` and the iso-surface):

| Part | Look | Primitive | Sized by |
|---|---|---|---|
| `s.nasal-bone.R/L` | bone | `strip` sellion → rhinion, 1.0 mm | `nb_shape` (`c.nasal-bone-shape`): V straight, S with the caudal third angulated (Lazovic 2015); widths and thickness schematic |
| `s.frontal-process-maxilla.R/L` | bone | `strip` from the nasal bone's lateral edge to the piriform rim | schematic |
| `s.piriform-aperture.M` | opening, ghost | thin tube along the rim | schematic (ST7d: the specimen's) |
| `s.septal-cartilage.M` | cartilage | `prism` on x, 1.0 mm (the measured map runs 0.74–3.03 mm, thickest at the base: Hwang 2010; uniform here, schematic) | outline: dorsal edge from `keystone` mm under the nasal bones to the ASA; caudal edge ASA → ANS; posterior edge a straight chondro-osseous line (schematic); length and height checked by rule 9 |
| `s.septal-l-strut.M` | cartilage, translucent | `prism` band `l_strut` wide along the dorsal and caudal edges | `s.septal-l-strut`, `pr.l-strut-preserve` |
| `s.upper-lateral-cartilage.R/L` | cartilage | `strip` along the dorsal septum from under the nasal bone to its caudal (scroll) edge; width 12.8, thickness 1.3 | `m.ulc-width`, `m.ulc-thickness` (El-Shaarawy 2016); fused to the septum along its medial edge (the ULC–septal complex, Han 2019); flare from the septum = `valve_angle` at the caudal edge |
| `s.medial-crus.R/L` (footplate `s.medial-crural-footplate.R/L`) | cartilage | the first segment of one `strip` per side (the lower lateral cartilage is one strip, as Daniel's alar ring is one cartilage): footplate flared toward the ANS, columellar segment 0.5 mm off the midline | `mc_type` (`c.medial-crura-shape`, Patel 2013) |
| `s.intermediate-crus.R/L` | cartilage | the strip's lobular then domal segment, ending at the dome top | Daniel 1992 (three crura, two segments each); `interdomal` |
| `s.lateral-crus.R/L` | cartilage | the strip from the domal notch past the turning point to the accessory chain: length `lc_length`, width 6.4 at the notch → `lc_width` at the turning point (one third along) → 4 at the end (schematic taper), thickness 0.5; long axis at `lc_orientation` from the midsagittal plane seen from the front (Daniel's construction is in the full text: this is our reading); short axis tilted `lc_vertical` (positive = caudal border higher, the normal per Daniel 2014; a caudal border below the cephalic is the pinched-tip form, Toriumi 2006) | `m.lateral-crus-length`, `-width-domal-notch`, `-width-turning-point`, `-thickness`, `-orientation` (Daniel 2014) |
| `s.accessory-alar-cartilages.R/L` | cartilage | three `super` 3 × 2 × 0.75 mm continuing the alar ring toward the ANS, never touching the rim (Daniel 2014: "not abutting the pyriform") | Ebrahimi 2012 (size); count 3 schematic |
| `s.interdomal-ligament.M` | ligament | `super` bridging the domes, its top 1.6 mm below the dome tops | `m.interdomal-ligament-depth` (Marangi 2025) |
| `s.intercrural-ligament.M` | ligament | thin `prism` between the medial and intermediate crura | schematic |
| `s.pitanguy-ligament.M` | ligament | midline band from the supratip dermis's deep surface to the interdomal region | course schematic; Pitanguy 1965, Saban 2008 (the deep medial SMAS expansion), Daniel 2018 |
| `s.scroll-ligament.R/L` | ligament | longitudinal band along the ULC caudal / lateral crus cephalic edges, plus a vertical band from there to the SMAS | Daniel 2018 (longitudinal and vertical), Ku 2025 (vertical = inferior nasal retaining ligament) |
| `s.pyriform-ligament.R/L` | ligament | sheet from the piriform rim (nasal bone to ANS) to the ULC, the lateral crus and the accessory chain | Rohrich 2008 |
| `s.nasal-ala.R/L` (alar lobule) | fat | `super` lateral and caudal to the lateral crus, reaching the alar crease (the ala holds no cartilage: Bruintjes 1998); placed from the alar crease and the naris, never from the crus, so the alar rim stays put when the crus moves (rule 8) | schematic |
| `s.columella.M` | fat | `super` around the medial crura | schematic |
| `s.nasal-vestibule.R/L` | space | lumen carved up through the base inside each alar ring | schematic (ST6's measured vestibule in fit mode) |
| envelope `s.nasal-deep-fat.M`, `s.nasal-smas.M`, `s.nasal-superficial-fat.M`, `s.nasal-skin.M` | fat, muscle, fat, skin | iso-surfaces of one field (below) | `m.ste-thickness-*`, `m.nasal-dermis-thickness-*` |
| muscles in the SMAS shell: `s.procerus.M`, `s.nasalis-transverse.R/L`, `s.nasalis-alar.R/L`, `s.dilator-naris-anterior.R/L`, `s.depressor-septi-nasi.R/L` | muscle | `strip` from origin to insertion, as the graph's `attaches-to` edges name them, clipped to the SMAS shell | courses schematic; Hur 2011, Bruintjes 1998, Rohrich 2000, Tansatit 2016 |
| vessels and nerves | artery, vein, nerve | tubes (below) | below |

**The envelope: one field, five surfaces.** Voxelize the framework (every
cartilage, bone and ligament part, the alar lobules and the columella,
through `kit.inside`) on a 0.5 mm grid over the nose box (R ±28, A −20…+30, S
−14…+48; 1.0 mm at `q=lite`) and take the exact Euclidean distance d(x) to
it (`kit.edt`). The envelope thickness is T(x) = `ste_scale` × T₀(x), with
T₀ interpolated along the dorsal line through four sourced values —
nasion 4.13, rhinion 2.25, supratip 4.88 (t = 0.8), tip 4.07 mm
(`m.ste-thickness-*`, Chen 2024) — and schematic values over the sidewall
(3.0), ala (3.0) and columella (2.0), blended by the nearest framework
point. The layers are level sets of φ(x) = d(x) / T(x): deep fat
0 < φ ≤ 0.25, SMAS ≤ 0.40, superficial fat ≤ 1 − δ(x), dermis ≤ 1, with the
dermis fraction δ = 0.58 at the tip (2.35 / 4.07) and 0.33 at the nasion
(1.35 / 4.13), both Chen 2024, interpolated between (the 0.25 and 0.40 are
schematic). Skin = {φ ≤ 1} minus the vestibule lumens, carved after, so the
nostrils are holes. Each layer's surface is marching cubes on φ at its
level (`kit.iso`), and its `inside()` is trilinear φ below the level, so a
test sees what is drawn. No smoothing pass (it would move a surface off its
inside test). Only the layers that `show` exposes are meshed; φ is always
computed (rules and planes need it).

*The layering is Letourneau & Daniel's* (1988: superficial fatty
panniculus, fibromuscular layer, deep fatty layer, longitudinal fibrous
sheet, interdomal ligament; the fibrous sheet is not drawn). Saban 2008
splits the nasal SMAS at the valve into deep and superficial layers with
medial and lateral expansions; Figallo 2001 doubts that a true nasal SMAS
exists. The diorama draws one fibromuscular shell and says so.

**Vessels and nerves.** Tubes along centripetal Catmull-Rom curves through
waypoints given in *envelope coordinates* — a framework or anchor point, an
outward direction, and a depth φ (the point is moved along ∇d until φ is
reached) — so they follow the envelope when the framework changes, as
§5.7's specimen sweeps follow the septal chart. The depths are our reading
of the sources' layer words: schematic in value, sourced in order.

| Tube | Course (waypoints) | Depth φ | From |
|---|---|---|---|
| `s.lateral-nasal-artery.R/L` | from the angular/facial origin lateral to the alar crease, along the alar groove 2.5 mm cephalic to it, then over the lateral crus to the supratip, where it joins the arcade | 0.85 along the groove (subdermal plexus), 0.5 over the crus | Rohrich 1995 (2–3 mm above the groove, subdermal, present in 31 of 31); Toriumi 1996 (alar arcade) |
| `s.dorsal-nasal-artery.R/L` | from the medial canthal region (schematic point, \|R\| 12, S 35) down the sidewall to the arcade | 0.6 | Toriumi 1996 (in or above the musculoaponeurotic layer); Jung 2000 |
| `s.columellar-artery.R/L` | per `columellar`: from the superior labial artery at the columella base up over the medial crura to the infratip, joining the arcade near the domes | 0.6, reaching 0.45 at the domes | Rohrich 1995 (presence); Jung 2000 ("close to the main surgical plane in the dome") |
| `s.superior-labial-artery.R/L` | its last 10 mm, from the box edge below the alar base to the columella base | 0.6 | schematic |
| `s.angular-artery.R/L` | per `angular_type`: I along the alar-facial groove to the medial canthus; II leaves the box laterally (cheek and tear-trough course); III an ophthalmic-origin vessel at the medial canthus only; IV none | 0.6 | Kim 2014 |
| supratip anastomosis (part of `s.lateral-nasal-artery.M`) | toggle: a midline crossing at the supratip, level with the alar cartilages | 0.5 (mid-subcutaneous) | Tansatit 2016 |
| `s.lateral-nasal-vein.R/L` | along the sidewall | 0.17 (deep to the SMAS — Toriumi's one exception) | Toriumi 1996 |
| `s.angular-vein.R/L` | from the medial canthus (medial palpebral ligament) down lateral to the sidewall, past the LLSAN origin, to the alar level | 0.6 | Iwanaga 2022 (course); depth schematic |
| `s.external-nasal-nerve.R/L` | exits between nasal bone and ULC at \|R\| 7.3, runs to the lateral crus; branching per `nerve_type` (I single; II splits at the intercartilaginous junction; III two branches from the exit) | 0.22 (deep fat, directly under the SMAS: 19 of 20 nerves) | Han 2004 |

Radii: arteries 0.4 mm, the columellar 0.2 (Tansatit's midline columellar
artery 0.21 ± 0.09 mm), veins 0.25, the nerve 0.18 (Han: 0.35 mm diameter at
the exit); other than those two, schematic. The vein's radius is set so it
fits the deep fat at the default sidewall thickness (rule 10).

**`PARAMS`:**

| Key | Type / range | Default | Source |
|---|---|---|---|
| `show` | choice `ghost` (translucent skin, all inside) · `skin` · `smas` (skin and superficial fat off) · `framework` · `bones` | `ghost` | — |
| `plane` | choice `none` · `subcutaneous` · `sub-smas` · `supraperichondrial` · `subperichondrial` | `none` | Neves 2021 (the four planes); Toriumi 1996 |
| `ste_scale` | 0.6–1.6, step 0.05 | 1.0 | `m.ste-thickness-*` |
| `keystone` (nasal bone over the cartilaginous vault, along the dorsum) | 4–12 mm | 8.9 | `m.keystone-length` (Palhazi 2015); Han 2019's 6.47 midline overlap is inside the range |
| `valve_angle` (ULC to septum at the ULC's caudal edge) | 5–25° | 12 | `m.internal-nasal-valve-angle` (10–15, conf low); below 10 flagged "narrow" |
| `lc_length` | 15–30 mm | 23.4 | `m.lateral-crus-length` |
| `lc_width` (at the turning point) | 6–14 mm | 11.1 | `m.lateral-crus-width-turning-point` |
| `lc_orientation` | 15–60° | 43.6 | `m.lateral-crus-orientation` |
| `lc_vertical` | −30…+30° | +10 (schematic) | `s.lateral-crus`; Daniel 2014, Hamilton 2016 |
| `interdomal` | 6–20 mm | 13.8 | `m.interdomal-distance` |
| `mc_type` | choice 1 · 2 · 3 | 3 | `c.medial-crura-shape` |
| `tripod_medial` (Δ medial leg) | −5…+5 mm | 0 | `pr.nasal-tip-tripod` |
| `tripod_lateral` (Δ both lateral legs) | −5…+5 mm | 0 | `pr.nasal-tip-tripod` |
| `l_strut` | 6–20 mm | 10 | `m.l-strut-width` (10–15), `pr.l-strut-preserve`; below 10 flagged |
| `nb_shape` | choice V · S | S | `c.nasal-bone-shape` |
| `columellar` | choice `bilateral` · `unilateral` · `absent` | `bilateral` (see below) | `v.columellar-artery-presence` |
| `angular_type` | choice I · II · III · IV | III | `c.angular-artery-course` |
| `supratip_anastomosis` | toggle | on | `v.supratip-arterial-anastomosis` |
| `nerve_type` | choice I · II · III | I | `c.external-nasal-nerve-branching` |
| `depressor_type` | choice I · II · III | I | `c.depressor-septi-type` |
| `sesamoid` | toggle (one extra cartilage in the hinge area) | off | `v.nasal-sesamoid-cartilage` |

*Defaults for a variant choice* (O8, decided 2026-10-08): the modal class among those
that draw the structure, so the default is what a surgeon meets most often
— angular type III (the modal drawn type; IV, absent, is 26.3 %), nerve
type I (50 %), depressor type I (62 %), nasal bone S (88 %). Under O6
(normal and symmetric first) a modal *asymmetric* class yields to the
modal symmetric one that draws the structure: medial crura type 1 (7 of
17) yields to types 2 and 3, which tie (5 each), and the simpler, 3, is
taken; the columellar artery's modal class, unilateral (68 %), yields to
bilateral — only 9 % of Rohrich's 31 specimens, the clearest case for O8. The HUD gives every class's
prevalence with its denominator.

**`PRESETS`** (one parameter each, as in §6.1): `c.nasal-bone-shape`
(V, S → `nb_shape`), `c.medial-crura-shape` (1–3 → `mc_type`),
`c.angular-artery-course` (I–IV → `angular_type`),
`c.external-nasal-nerve-branching` (I–III → `nerve_type`),
`c.depressor-septi-type` (I–III → `depressor_type`). No preset for the
envelope: no sourced classification of nasal skin thickness was found.

**`VIEWS`** — the five standard rhinoplasty views: `frontal`, `lateral`
(the right profile), `base` (worm's-eye, tip up), `oblique` (right
three-quarter), `dorsal` (bird's-eye). `VIEW_DEFAULT`: `oblique`.

**`classify` / `readout` HUD lines:** the classes in force (with
prevalence); nasal length (soft nasion → pronasale); tip projection P
(pronasale's A minus the alar creases' mean A — Byrd & Hobar measure from
the alar-cheek junction; along the Frankfort-parallel axis is our reading)
and P / length beside 0.67 (`m.tip-projection-ratio`: an aesthetic
proportion from 87 selected models, not a population mean); rotation —
the nose's lower border (subnasale → columella–lobule junction) above the
Frankfort plane, beside 18 ± 7° (`m.nasal-lower-border-to-fh`: 104 young
white adults chosen as well-balanced); the domes against the ASA (mm,
beside 5.7 / 5.5); the internal valve angle measured on the solids; the
keystone overlap measured; the lateral crus's caudal border to the alar
rim over its first 15 mm (beside < 6.7, `m.lateral-crus-to-alar-margin`);
the envelope at nasion, rhinion, supratip and tip; the septal cartilage's
area and the harvestable area outside the L-strut (beside 636 and
385 mm², Samibut 2021); the external nasal nerve's exit (\|R\|, beside
7.3); for a `plane`, what it carries in the flap, cuts, or leaves deep
(rule 10), by name.

**Hazard sites** (hatched, `userData.hazards`):
`h.nasal-tip-skin-necrosis` on the arcade (lateral nasal over the crus,
dorsal nasal, columellar, supratip anastomosis) when `plane` is
`subcutaneous`, and on the lateral nasal artery's alar-groove segment
always (alar base resection above the groove: Rohrich 1995);
`h.external-nasal-nerve-injury` on the nerve when `plane` is `sub-smas`,
and on its exit always (Han 2004: keep dissection at the bone–ULC junction
within 6.5 mm of the midline); `h.saddle-nose` (exists) on the L-strut band
when `l_strut` < 10. An unsupported alar rim (rule 8 above 6.7 mm) is a
HUD flag, not a hazard id, until rhinoplasty procedures exist to own it
(a hazard needs the procedures it happens `during`).

**Rules `tools/test-ssb.mjs` must pin** (computed from the solids on the
0.5 mm grid, as §6.1's are; nothing written in):

0. *Names, ids, codec.* Every part is `<graph id>.<side>` and resolves in
   the graph; every hazard id resolves; the `#lab=` codec round-trips and
   clamps hostile values; both themes compile; at the defaults (all
   symmetric) the model is mirror-symmetric (vertex sets within 1e-6); only
   the asymmetric classes (`columellar` `unilateral`, `mc_type` 1) break it.
1. *Containment and nesting.* Every framework voxel is inside the skin;
   each layer's solid contains the next deeper one; every layer is at
   least 0.15 mm thick wherever the envelope is, over the whole
   `ste_scale` range; each nostril is open (a
   ray up from each naris centre reaches the vestibule lumen without
   entering skin) and enclosed (columella medial, ala lateral on its row).
2. *Envelope thickness.* Skin-to-framework distance along the outward
   normal at the nasion, rhinion, supratip and tip equals `ste_scale` ×
   T₀ there within 0.5 mm, and the rhinion is the thinnest of the four (a
   construction check against Chen 2024; Çavuş Özkan 2020's MRI series
   agrees on the rhinion and disagrees on the thickest site).
3. *Thick skin hides the domes.* On the skin's most-anterior profile
   A(x) along R at the dome tops' S, the midline dip — the higher of the
   two lateral maxima minus A(0), or 0 when there is one maximum — never
   increases over `ste_scale` 0.6…1.6 in steps of 0.1 and is strictly
   smaller at 1.6 than at 0.6. The count of maxima (prominence ≥ 0.2 mm
   after 1 mm smoothing) is a readout, not pinned. An outward offset can
   only shallow a concavity, so this holds by construction; it is drawn
   because it is the teaching point (Toriumi 2006, Chen 2024), not a
   measured threshold. Whether a default tip shows one or two highlights
   depends on `interdomal`, whose definition in Marangi's abstract is
   unclear (below).
4. *The tripod* (`pr.nasal-tip-tripod`; Anderson 1984). Feet: F_m, the
   footplates' posterior midpoint; F_l.R/L, each lateral crus's end at the
   accessory chain — all fixed. Apex D: the dome tops' midpoint. With
   Δm, Δl the apex is the anterior intersection of the spheres (F_m,
   L_m⁰ + Δm) and (F_l.R/L, L_l⁰ + Δl); each crus is carried by the
   similarity that maps its leg's old end to the new (intermediate crura
   translate with D); the envelope is recomputed. Measured on the skin:
   shortening both lateral legs (Δl < 0) lowers projection and raises
   rotation; shortening the medial leg lowers both; lengthening it raises
   projection; Δ = 0 reproduces the default to 1e-6. An unsolvable Δ
   clamps to the nearest solvable one and the HUD says so.
5. *Keystone.* Along the dorsum at \|R\| ≤ 2, the nasal bone overlies the
   ULC–septal complex for `keystone` ± 0.5 mm; laterally (\|R\| 6–8) the
   overlap is shorter than in the midline (Han 2019's pattern).
6. *Valve.* The angle between the ULC's inner surface and the septum, in
   the coronal section at the ULC's caudal edge, equals `valve_angle`
   ± 1° over the whole range.
7. *Domes and the ASA.* At Δ = 0 the dome tops are 5.7 ± 0.5 mm anterior
   and 5.5 ± 0.5 mm caudal to `lm.anterior-septal-angle`, and the minimum
   distance from either dome to the septal cartilage is positive: the ASA
   does not support the domes directly (Daniel & Palhazi 2018).
8. *Lateral crus and the alar rim.* The alar rim is the skin's boundary
   voxels adjacent to the nostril opening. At the default, the distance
   from the lateral crus's caudal border to the rim is ≤ 6.7 mm over the
   first 15 mm from the domal notch (Hatzis 2004), and it grows
   monotonically as `lc_orientation` falls (a cephalically oriented crus
   leaves the rim unsupported: the reason for the strut graft, Gunter 1997).
9. *Septum and L-strut.* The septal cartilage's length and height lie
   within the means ± 2 SD of the cited series (`m.septal-cartilage-*`);
   the harvestable polygon is the cartilage minus the dorsal and caudal
   bands (`l_strut` wide, measured perpendicular to each edge) minus the
   part under the nasal bones (Mau 2007: the bony overlap is part of the
   strut's stability); its area readout equals an independent
   point-in-polygon sum within 2 %; it is empty, not negative, when the
   bands meet.
10. *What a plane carries* (pinned at the defaults). The planes:
    subcutaneous φ = 0.5 (above the musculoaponeurotic layer, Toriumi's
    disruptive group), sub-SMAS φ = 0.24, supraperichondrial d = 0.1 mm
    and subperichondrial d = −0.1 mm (on and under the perichondrium).
    Over the dissection field (the envelope over the ULCs, LLCs and nasal
    bones), with depths in mm, a tube is *carried* when its centre depth
    minus its radius exceeds the plane's depth + 0.1 mm everywhere, *cut*
    when its depth ± radius contains the plane's depth anywhere, and
    *left deep* otherwise. Pinned: `subcutaneous` → no artery of the
    arcade carried; `sub-smas` → every artery carried, the external nasal
    nerve and the lateral nasal vein cut; `supraperichondrial` and
    `subperichondrial` → everything carried (Toriumi 1996; Han 2004).
11. *Positions from the sources.* The lateral nasal artery's alar-groove
    segment lies 2–3 mm cephalic to the alar crease on the skin; the
    external nasal nerve exits at \|R\| 7.3 ± 0.5 between the nasal bone and
    the ULC, in deep fat; the columellar tubes drawn match `columellar`;
    the angular artery matches `angular_type`.
12. *Attachments agree with the graph.* For every ligament and muscle,
    each end lies within 0.5 mm of a part its graph `attaches-to` edges
    name; a missing edge or a far end fails.
13. *Determinism and cost.* The same parameters give the same hash of
    every part's geometry; build time is reported (≤ 500 ms on the CI
    runner at `q=full` is a budget, not a test of a phone's speed).

**Impossible combinations degrade, by one table** (the HUD names them, as
§6.1 rule 9): an unsolvable tripod Δ clamps (rule 4); `angular_type` IV
draws no angular artery or vein and starts the lateral nasal artery at the
box edge; `depressor_type` III draws no depressor (Rohrich's "no, or
rudimentary" muscle); an `l_strut` wide enough for the bands to meet
leaves no harvestable area; `sesamoid` adds a part only when `show`
exposes cartilage.

**Proportions that are schematic** (stated in the module header, as
§6.1's are): nasal bone width and thickness, the chondro-osseous line, the
septal thickness (uniform 1 mm), the lateral crus's taper after the
turning point, the accessory count, the intercrural and Pitanguy
ligaments' shapes, the alar lobule and columella solids, the sidewall /
ala / columella envelope values, the layer fractions 0.25 and 0.40, the
vessels' depths (their order is sourced), the dorsal artery's origin, the
rhinion's t and the alar crease's position (until ST7d).

**Budgets:** ≤ 60 parts; ≤ 150k triangles with the outermost shown layer
meshed at 0.5 mm; ≤ 1.2 M voxels at `q=full`; a parameter change rebuilds
when the slider settles, as the lab already does.

**What the sources disagree on** — kept visible in the panels, and listed
for CP-ST7 and the owner:

- *Accessory and sesamoid cartilages.* One sesamoid per side in 88 % of 41
  Iranian cadavers (gross dissection; Ebrahimi 2012); cartilage in 1 of 362
  tissue blocks from 101 Mohs alar specimens (histology of a sample chosen
  by skin cancer, of uncertain depth; Greenlund 2023); no sesamoid but
  posterior accessory cartilages in 6 of 8 joints (micro-MRI; Haddad
  2022); an accessory chain in 20 of 20 (Daniel 2014). The diorama draws
  the chain and makes the sesamoid a toggle.
- *The interdomal "ligament".* A transition between the middle crura
  rather than a ligament (histology, 26 cadavers; Irmak 2020) versus a
  fibrous ligament in 24 of 25 (histology; Marangi 2025). Daniel 2018 found
  no footplate and no sesamoid ligament, both commonly taught.
- *The thickest envelope site.* The supratip in 110 Asian patients
  (ultrasound; Chen 2024), the nasion in 325 Turkish patients (MRI; Çavuş
  Özkan 2020): different populations and modalities. Both put the
  thinnest at the rhinion. The defaults use Chen's numbers because they
  are the only ones in an abstract (O8).
- *The columellar artery.* Present on at least one side in 24 of 31
  (dissection and microangiography; Rohrich 1995) versus a midline
  columellar artery in 14 of 45 (midline histological strips, which can
  miss paired paramedian vessels; Tansatit 2016) — not the same quantity.
- *Angular artery classes.* Kim 2014's four types sum to 78 % of 57
  hemifaces in the abstract; the rest is unstated.
- *Interdomal distance.* Marangi 2025 gives 13.8 ± 3.2 mm and a ligament
  area of 0.39 cm² at 1.6 mm depth, and a 1.633 ratio between the
  ligament's base and that distance; the abstract does not say between
  which points the distance is measured. If it is not dome top to dome
  top, the default tip is too wide.
- *Keystone length.* 8.9 mm along the dorsal septum (15 cadavers; Palhazi
  2015) versus a 6.47 ± 2.50 mm midline nasal bone–ULC overlap (16 Chinese
  cadavers; Han 2019): different measures and populations.
- *Cadaver age.* Daniel 2014's lateral crus dimensions come from cadavers
  of mean age 74; its orientation angle from 40 young women in surgery.
- *Aesthetic ratios* (Byrd 1993, Fitzgerald 1992) are measured on faces
  selected as attractive or balanced; they are targets, not norms, and the
  HUD says so.
- *Septal cartilage size* differs by axis convention as much as by
  population (Hwang 2010, Samibut 2021, Han 2019, Han 2018).

**Fit on the specimen (ST7e; a sketch that Opus finalizes after ST7c and
ST7d).** Under O7 (b) or (c), the same module builds with
`anchors = 'specimen'`: anchors and bony landmarks come from
`landmarks.json` (ST7d), the specimen's nasal bones and piriform rim
replace the diorama's (those parts are not drawn), and the skin is the
`nose` pack's `s.external-nose.M` (ST6) instead of the generated one. The
framework is placed under the real skin by the same construction run
inward, and the inner layers are fractions of the *actual* local
skin-to-framework distance. Checks: the framework lies in tissue (no
cartilage voxel in the specimen's air, ≤ 1 % tolerance) and at least
1.0 mm under the skin; the ULC tucks under the specimen's nasal bone by
`keystone`; the specimen's own envelope at the nasion and rhinion (skin to
bone, n = 1) is printed beside Chen and Çavuş Özkan. **Not to be forced:**
ST6's "internal valve" is the narrowest coronal airway section, which need
not be where the ULC–septum angle is; the fit reports the A distance
between the ULC's caudal edge and that plane rather than placing one on
the other, and CP-ST7 decides what the specimen landmark is called.

**Hooks for the rhinoplasty model (not in ST7).** Everything above is
shaped for it: the framework is parametric, and the envelope, valve,
support and blood supply are recomputed from it; parts are the units a
surgeon moves or resects; the dissection plane is already a parameter.
The model will need, and ST7 must not preclude: (1) clip planes on `kit`
solids (dorsal reduction, cephalic trim, osteotomy lines), so a resection
is a boolean that `inside()` sees; (2) dissection states in names
(`s.lateral-crus.R@trimmed`, §4); (3) grafts as added solids under
procedure ids (spreader, columellar strut, caudal septal extension,
lateral crural strut, alar rim, shield), placed on the anchors; (4) the
tripod, the valve angle and the plane's carried set as the readouts that
grade a manoeuvre; (5) rhinoplasty procedures (`p.*`) whose steps set
these parameters, played as §3's procedure mode plays steps.

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
ssb/geometry/*.json          labels, landmarks, sweeps, station poses (stations.json: E5; its `rule` string says how each pose was checked, `uncovered` lists the stations the intact specimen cannot show)
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

The procedure hash (WP P2, built) is `#p=<p-id>&step=<n>[&cor=<corridor>]`
(the pose follows as `scope=`): the store keeps only a well-formed `p-id` in
the graph and clamps `step` to 0..99; the player, once the index has loaded,
drops a procedure the index does not list and clamps `step` to its steps, and `cor` (a corridor key there that lists the
procedure) makes the state accumulate the corridor's earlier procedures
instead of the procedure's own `entry`. It implies the scope stage on the
decongested mucosa. The mucosa key `mu=dec|scan|cong` (§5.9, WP DC1, built;
`state.mu`, default `scan`, not written when `scan`) is ignored while a
procedure plays and not written to the hash then; an unknown value (any other
case or text) is dropped.

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
  striation), gland and brain follow; `skin` (ST6: the external nose and the
  vestibule's lining) is matte with fine pores and a slow flush, no vessels.
  Air cells, air spaces and the flow
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
  its images** (owner-confirmed; the authors' written permission arrived
  2026-10-07, recorded in `ssb/LICENSE-data.md`).

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
- **O6 — Normal before variant (owner, 2026-10-03).** The first release
  is a working *normal* atlas and endoscope: as symmetric and standard as
  the data allow, even though no real head is; septal deviation, ostium
  heights and other asymmetries come later as variants. Implemented as the
  standard specimen of §5.1 (right half mirrored, septum centred; WP N1).

Open, from the ST7 spec (2026-10-07; §6.2):

- **O14 — Where the nasal framework is drawn** (open; numbered O7 until
  2026-10-08, when it collided with the content-priority O7). (a) In the variant lab
  only, as an idealized diorama; (b) fitted under the specimen's own skin
  and on its nasal bones in the Specimen stage (schematic on specimen,
  n = 1 envelope); (c) both, the lab first. Recommended: (c) — the lab
  build is needed either way and is where the rules are tested; the fit
  follows ST6 and the specimen's bony nose (roadmap ST7d, ST7e).
- **O8 — Where the defaults come from.** The numbers in hand come from
  different populations: Caucasian cadaver series for the ligaments,
  crura and vessels; Korean, Chinese and Thai series for the septal
  cartilage, the keystone overlap and the envelope thickness; an Egyptian
  series for the ULC. (a) Mixed defaults, each labelled with its
  population — no real nose is the default, but every number is cited;
  (b) Caucasian-series numbers only, schematic where none exist (the
  envelope would become schematic); (c) a `population` choice, once a
  complete second set exists. And for variant classes: the modal drawn
  class (what a surgeon meets most) or the textbook configuration.
  Recommended: (a) now with (c) later; modal classes; in fit mode the
  envelope is the specimen's own, so O8 matters least where the specimen
  speaks. **Decided 2026-10-08 by the owner: as recommended.**

1. **Keep the CSP strict** (recommended: gzip, then Draco's JS decoder if
   needed). `'wasm-unsafe-eval'` for meshopt only if both fail the budgets.
2. **Publish while `draft`?** Recommended: publish with visible unverified
   markers (the wiki's precedent), prioritizing owner review of tier 1.
3. Name and URL (`SSB`, `ssb.html`) — working title.

From P1 (Opus, 2026-10-08), **all decided 2026-10-08 by the owner as recommended** (`docs/ssb-roadmap.md` §2):

- **O13 — What "edema" means in the mucosa toggle** (numbered O8 until
  it collided with ST7's O8). The physiological
  congested phase (turbinates and septal swell body, calibrated on NasalSeg,
  §5.9), or the mucosal edema of rhinosinusitis (sinus lining, polyps:
  pathology, PR #119's `fill` operator). Recommended: the toggle is
  decongested · as scanned · congested; inflammatory edema is a condition.
- **O9 — "Averaged normal anatomy."** A population reference shown beside
  the head (percentiles, profiles, a mean-shape ghost: population truth), or
  a head deformed toward the NasalSeg median (composite, five structures
  only). Recommended: the reference now, the deformed head only after it.
- **O10 — Posterior septectomy extent.** 15 mm of posterior septum (the
  middle of the graph's 1–2 cm), from the choanal arch up. Is the arch the
  right inferior limit for the corridor you teach?
- **O11 — FESS on both sides at once.** Procedure mode carves both sides
  (the scope chooses the nostril); one dissected side beside an intact one
  needs per-side lining packs. Recommended: both sides now.
- **O12 — A voxel-level check against a NasalSeg-trained model** (roadmap
  SEG1). Recommended: not now (a deep-learning stack in the pipeline; the
  distribution check of §5.10 found no defect in the five structures it
  can see, and it cannot see the ethmoid).
