# SSB — Sinus & Skull Base 3D: architecture and conventions

Status, work packages and order: GitHub issue #266 and its sub-issues. Specs and the decision record: `plans/2026-10-07-ssb-roadmap.md`. This file is the design. Data shape and editorial rules: `docs/authoring-ssb.md`. Realistic-anatomy sources and limits: `docs/realistic-anatomy.md`. Image briefs: `docs/ssb-imagegen.md`.

`ssb.html` runs four stages (the `data-stage` buttons) over the knowledge graph (`ssb/content/`, validated by `tools/ssb-content.mjs`): Specimen (§5.1), the variant lab (Lab, §6), CT (§3, §5.6; no WebGL needed) and the endoscope on the specimen (Scope, §3; the procedure player runs there).

## 0. What it is

A traversable 3D model of the paranasal sinuses, nasal cavity, orbit, anterior and ventral skull base, sellar/parasellar region and pterygopalatine fossa, built to teach what a surgeon must **see**, **know** and **think** at each point of an operation. The depth setting (tier 1/2/3) decides how much of the graph is on screen.

Not a navigation system, not a surgical simulator (no haptics, no free-form drilling), not a clinical reference while its content is `draft`. No patient data, ever.

## 1. Principles

1. **One graph, many views.** Every fact is a typed node with edges and sources. The 3D scene, panels, CT overlay and procedures render the graph, and geometry is keyed by the same ids. A fact is written once and cannot disagree with itself across views.
2. **Label the kind of truth.** Four kinds, never blurred:
   *specimen* — one real adult anatomy, CT-derived (n = 1);
   *diorama* — an idealized parametric model that shows a variant or a classification cleanly;
   *population* — literature values with their spread, method and denominator;
   *composite* — a real specimen with a declared edit (owner RA-O2; §14 R2.2). The badge names the edit, its parameters and the exemplars it was calibrated on; picking an edited voxel or mesh reports that it is edited.
   Every view carries a badge saying which kind it is, and every measurement shows the specimen's own value beside the population range.
3. **Surgical granularity.** Meshes are cut into the smallest unit a surgeon identifies or removes (uncinate, bullar lamella, vertical and horizontal basal lamella, each frontal recess cell, sphenoid rostrum, sellar floor), not into textbook bones. A whole "ethmoid bone" mesh does not exist; it is a parent id in the graph.
4. **Cognition is content.** Hazards (mechanism → prevent → recognize → rescue), operating principles, preop CT checks and each procedure step's `think` field are data, rendered in the scene: at-risk structures hatched, proximity read out in mm.
5. **CT is the native language.** Every 3D position is one keystroke from the CT slices through it, and every CT voxel knows which structure it belongs to.
6. **Recall before reveal.** Panels and procedure steps can open as prompts with the answer collapsed, the same recall-gate idea as OKSAT.
7. **The repo's rules do not bend.** No build step, same-origin everything, `script-src 'self'`, stamped assets, guarded storage, escaped text. Where 3D needs something new (a vendored library, an ES-module graph), the design extends the existing mechanism.

## 2. Scope

| Tier | Regions and depth |
|---|---|
| 1 | Nasal cavity, septum, turbinates, lateral wall and ostiomeatal unit, maxillary, anterior/posterior ethmoid, frontal sinus and recess, sphenoid, orbit's medial wall, skull base as a boundary; CT identification; the structures you must not injure (orbit, skull base, AEA, optic nerve, ICA) |
| 2 | Variants and their classifications (IFAC, Keros, Gera, uncinate attachment, sphenoid pneumatization, Onodi/Haller), extended FESS (Draf IIa/IIb, sphenoidotomy, SPA/AEA ligation, medial maxillectomy, DCR, orbital decompression), complication recognition and rescue |
| 3 | Expanded endonasal approaches on the sagittal and coronal planes (transcribriform → transclival, transpterygoid, petrous apex, cavernous sinus, CVJ), ICA segments, OCRs, cavernous and suprasellar neurovascular anatomy, reconstruction and flap design, quantitative anatomy |

**Pathology** is a layer over that anatomy, not a separate atlas. Each condition (`dz.*`: inflammatory and fungal disease and their orbital and intracranial complications, CSF leak and encephalocele, benign and malignant sinonasal and skull base tumors) names the structures it involves, its imaging discriminators and mimics, its staging systems and what it changes at the table. In the scene a condition is an overlay on the specimen; in CT mode, its findings.

**The external nose** is in scope to the full rhinoplasty framework: tier 1 names the bones, cartilages, envelope and subunits; tier 2 adds ligaments, tip support, envelope layers and dissection planes, valves, and the vessels and nerves an open approach meets; tier 3 adds quantitative anatomy and variant classes. It is built as the `nasal-framework` diorama (§6.2) and later fitted under the specimen's skin. Beyond anatomy it is the substrate of a rhinoplasty model (`plans/2026-11-10-ssb-nasal-framework.md`).

Region ownership and the full inventory live in the graph (`ssb/content/*.json`), not here.

### Reference atlas

**UW Interactive CT Sinus Anatomy** (credit the atlas and its institution, never its authors by name; `ssb/reference/uw-sinusanatomy2/`, terms in `ssb/LICENSE-data.md`): labeled axial, coronal and sagittal stacks of a normal sinus CT, unlabeled/labeled slice pairs, and normal-variant and disease pages. Its label vocabulary is crosswalked to graph ids (`crosswalk.json`). Labeled frames are extracted to label positions (`slices.json`), and within-slice relations test the graph's `rel` claims (`relations.json`, `tools/ssb-pipeline/uw/relate.py`), with the limits its README states. Its images may be served from this origin, credited (§14 RA-O1). UW's host is HTTP-only, so an HTTPS page cannot hotlink them.

## 3. Modes

All modes share one scene, one selection and one URL state; switching mode never reloads.

- **Explore.** Orbit, pan and zoom around the specimen. Layer toggles by tissue kind and region; *peel* removes resection units in anatomical order; X-ray draws occluders as fresnel ghosts (no sorted transparency); section planes with solid caps register a cut to the CT slice. Click picks; clicking the same pixel again steps deeper through what is under the cursor.
- **Endoscope.** First-person through a rigid scope that **pivots at the nostril**. Pose = insertion depth, shaft yaw and pitch about the nostril fulcrum, roll, and lens angle (0/30/45/70°). The view deflects from the shaft by the lens angle toward the roll; the horizon stays upright, as the real technique does. A light-post indicator sits opposite the view direction.
  - Illumination is a spotlight at the tip with inverse-square falloff. Its intensity follows an automatic exposure (K·D², D the median distance to the lining over five rays), as a camera control unit does.
  - Collision: the shaft is sampled every 0.5 mm, on its axis and on a ring of four points at the shaft radius (4 mm or 2.7 mm scope, chosen in the controls, never in the URL), against the CT display volume (§5.6). Bone (display ≥ 150) blocks; a pose that would block is clamped to the last free depth. The shaft length lying in mucosa is reported as mucosal contact, because the specimen is not decongested. At the midline the shaft is clamped at R = 0, except in the nasopharynx, behind and below `lm.choanal-arch.M`. The HUD reports which limit fired.
  - The fulcrum `lm.naris` is the centroid of the vestibule lumen at the alar-rim band (`tools/ssb-pipeline/uw/nose.py`).
  - The tip is the shared 3D cursor (`state.cursor`). A CT inset shows the oblique slice through the tip, spanned by the view direction and the camera's up, with the shaft drawn on it. Exposure is measured once the pose has rested 100 ms.
  - A proximity HUD gives the distance from the tip to each critical structure (ICA, optic nerve, skull base, orbit, AEA) from precomputed distance fields, and marks those within 3 mm in the signal colour.
  - Stations (E6): `ssb/geometry/stations.json` stores an endoscope pose per station and side (a midline `.M` station is posed from the right nostril). Picking one flies the pose there over about 600 ms (depth, yaw, pitch; roll the short way round; the lens switches at the end). Any other input cancels the flight; reduced motion cuts. `#scope=t.<id>[.<side>]` opens a station (side R when absent); an unknown id is ignored.
  - This mode is where the fulcrum constraint teaches why the frontal recess needs a 45–70° scope and why posterior septectomy opens binostril work.
- **CT.** Axial, coronal and sagittal slices of the specimen volume, each on its own canvas, in radiological convention (patient right on the image's left), with orientation letters and one crosshair in RAS mm shared by the three. Click or drag a view to move it; wheel or arrows scroll the active plane a voxel; Shift+arrows move it in-plane; `1`/`2`/`3` pick a plane; bone, sinus and soft-tissue presets from `ct.json` plus width/level. The label overlay outlines each segmented structure in the colour its graph kind has in 3D (§7.4 tokens). Hovering names the voxel's structure with approximate HU (`toHU`); clicking selects it. The volume loads on first entry; with no `ssb/ct/ct.json` the stage says so. The crosshair is the Specimen stage's `state.cursor`.
- **Procedure.** A procedure from the graph played as steps. Each step sets the station (camera pose), applies the cumulative dissection state (units the step `removes` disappear), highlights what comes into view, hatches the step's hazards and poses the step's `think` before revealing it. Scrub forward and back. A dissection state changes the *volume*, not only the meshes (§5.8), so collision, the tip-in-air rule of the stations and the proximity HUD all see the opened cavity. Procedures chain into corridors (FESS: uncinectomy to Draf IIa; EEA: transsphenoidal, sellar, transclival), played on the decongested mucosa (§5.9), both sides at once for FESS. The CT stage keeps the preoperative scan, with removed voxels outlined.
- **Variant lab (dioramas).** Parametric models driven by classification presets and sliders (§6). Drag olfactory fossa depth from Keros I to III and watch the lateral lamella lengthen and the AEA drop into a mesentery; toggle IFAC cells and watch the frontal drainage pathway reroute.

**Depth (tier) and truth badges are always visible.** Tier filters labels, panel sections and hazards; it never hides geometry needed for orientation.

## 4. Coordinate frame and units

- **All authored and pipeline data are RAS millimetres**: x → patient right, y → anterior, z → superior (the 3D Slicer / NIfTI convention). Origin: anterior nasal spine. Axial plane parallel to Frankfort horizontal; x = 0 on the midsagittal plane. The pipeline resamples every reference CT into this frame, so no file needs its own transform.
- **One conversion, at one boundary:** `rasToScene([r, a, s]) → [r, s, -a]` (three.js is Y-up, right-handed; `js/ssb/frame.js`). Nothing in `ssb/` stores scene coordinates. 1 scene unit = 1 mm.
- Laterality in geometry names: `<id>.R` / `.L` / `.M`. Dissection units: `<id>.<side>@<cut>` (e.g. `s.uncinate-process.R@uncinectomy`): the structure resected and the cut. A remnant mesh of a partly resected wall carries the same name (§5.8).

## 5. Geometry

Three classes, chosen per structure by its `geo` field.

| `geo` | Source | Used for | Runtime form |
|---|---|---|---|
| `specimen` | segmented from the reference CT | bone resection units, air cells (as solid "blocks"), mucosa surface, orbit contents, brain surfaces | quantized glTF packs |
| `sweep` | centerline + radius profile authored in RAS mm | arteries, veins, nerves, ducts, flow pathways | tubes generated at load |
| `diorama` | parameters | variants and classifications | generated at load from presets and sliders |

### 5.1 Reference specimen

**The served specimen is the UW atlas's axial/sagittal head, standardized** (owner decision O6). It is one adult at 0.3437 mm in-plane and 0.625 mm axial slices, bone window (8-bit display values, not HU), registered and scaled by `tools/ssb-pipeline/uw/` (`registration.json`; the gate's findings are in `ssb/reference/uw-sinusanatomy2/README.md`). UW's coronal stack is a different head and is not used for geometry.

Standardization: the right half is mirrored onto the left, the nasal septum is centred, and a thin midline plate is added wherever a paired sinus's air would otherwise cross the midline. The head is not a real head, and the page says so wherever the volume is shown. The right side is used because the as-scanned left side carries the anomalies: a closed left sphenoid ostium, under half the right's nasal air by label volume, a left inferior turbinate about twice the right's, a smaller left floor unit, and an unlabelled left ethmoid bulla. The septum is centred, not rebuilt: each column keeps its measured thickness and only its midline offset is removed. The mirror plane is R = 0; the frontal sinus tables that cross R = 0 are replaced by the mirror; a landmark that exists on one side only stays as scanned. The script is `tools/ssb-pipeline/uw/normalize.py` (`normalize.py all`). The as-scanned volume remains the pipeline input and becomes a variant base (§5.11), not the default.

Whatever the specimen, `ssb/LICENSE-data.md` records dataset, case id, license and attribution for every derived file. Faces are removed: the volume is cropped to the region, and soft tissue outside a dilated bone envelope anterior to the facial skeleton is masked to air. The external nose is the exception (O1 (c)): between subnasale and nasion, and between the alar-facial grooves (above S 28 also |R| ≤ 12, so the medial canthi stay masked), the skin, alae, columella and vestibule are unmasked, centred and mirrored (`tools/ssb-pipeline/uw/nose.py`). Lips, cheeks and eyelids stay masked. The region comes from the raw UW stack, so normalization needs the crawl (`fetch.py`).

A replacement specimen needs one adult thin-slice CT with vascular contrast, from an open dataset whose license allows redistributing derived meshes and volumes. No open dataset or model segments ethmoid cells, the uncinate or frontal recess cells; automatic tools stop at the whole maxillary and frontal sinus, nasal cavity, orbit, optic nerve and ICA. The surgical layer is manual segmentation whichever CT is chosen.

### 5.2 Segmentation: the graph writes the label table

`tools/ssb-labels.mjs` (planned) emits a 3D Slicer colour table from every `geo: "specimen"` structure × side, with stable indices recorded in `ssb/geometry/labels.json`. The table is append-only: an index is never reused. Coarse structures come from automatic segmentation where licensed; resection units and cells are expert manual segmentation in Slicer's Segment Editor. Centerlines and landmarks are Slicer markups exported to `ssb/geometry/sweeps.json` and `ssb/geometry/landmarks.json`, keyed `<id>.<side>`. **Coordinates live in geometry files, never in content.** Swapping the specimen changes geometry, not knowledge.

### 5.3 Pipeline (offline; outputs committed; never run in CI)

`tools/ssb-pipeline/` is Python for volumetric work (pinned `requirements.txt`), with `@gltf-transform/cli` as a dev dependency for glTF packaging.

1. Resample CT and label map into the RAS frame (§4); crop; deface.
2. Labels → per-structure surfaces (marching cubes, windowed-sinc smoothing, decimation to a per-kind triangle budget).
3. Pack by region (the list is `packs` in `ssb/models/packs.json`) → weld → `KHR_mesh_quantization` → `.glb` → gzip → `ssb/models/<pack>.glb.gz`, plus `ssb/models/packs.json` (pack → node ids, triangle counts).
4. CT → 8-bit **LUT-encoded HU** (piecewise-linear: air, soft tissue and bone each keep enough levels for both bone and soft-tissue windows; the inverse LUT is in the header) → `ssb/ct/ct.u8.gz`. Labels → `ssb/ct/labels.u16.gz`. Header `ssb/ct/ct.json` (dims, spacing, RAS affine, LUT, window presets, label index → id).
5. Distance fields (mm, clamped) for the proximity HUD's critical structures → `ssb/ct/sdf-<id>.u8.gz`.

**Models carry geometry only**: no materials, no embedded textures. Materials are assigned at runtime from CSS tokens by `kind` (§7.4). Compression is plain gzip, decoded by the browser's `DecompressionStream`. GitHub Pages serves binaries as `application/octet-stream`, so the loader checks the gzip magic bytes rather than trusting headers. If the budgets (§5.4) fail, the next step is Draco with its **JS** decoder (no WebAssembly, no `eval`). Meshopt needs WebAssembly, so it would need `'wasm-unsafe-eval'`, a CSP loosening (§8, §13).

The served specimen is the standardized one (§5.1): `normalize.py` writes the mirrored CT and labels, reruns `walls.py`, `meshes.py`, `sdf.py` and `softtissue.py`, and makes the side pairs exact. A side-relative scope `yaw` keeps its meaning under mirroring (`js/ssb/scope.js`).

Git carries the binaries (GitHub Pages cannot serve LFS). Re-export only at release points; the budgets bound history growth.

### 5.4 Budgets (design constants)

| | Target |
|---|---|
| First render (graph + `core` pack) | ≤ 2.5 MB transferred |
| All specimen packs | ≤ 12 MB |
| CT + labels + distance fields | ≤ 6 MB, loaded on first entry to CT or endoscope mode |
| Triangles on screen | ≤ 400k desktop; phones load the decimated LOD |
| Draw calls | ≤ 150 |
| Frame rate | 60 fps orbit on integrated desktop GPU; ≥ 30 fps mid-range phone |

Rendering is on demand (a frame only when something changed), except during camera flights and pathway animation.

The `lining` pack is not part of the boot. It is fetched the first time the mucosa is seen from within (the camera in the air box, or the scope); until then the air shells are drawn (`geo-specimen.js` `loadLining`).

### 5.5 Sweeps

`ssb/geometry/sweeps.json`: `{ "<id>.<side>": { "pts": [[r,a,s]…], "radius": [mm…] | mm } }`. Built at load as tubes along a centripetal Catmull-Rom curve. Pathways (`pw.*`) are sweeps rendered as moving particles along the curve: mucociliary transport toward the natural ostium, frontal drainage around the cells present, and the anterior and posterior group drainage routes around the torus tubarius.

### 5.6 Volumes at runtime

The CT, label and distance volumes are typed arrays in JS. Slices, oblique reformats and lookups are **CPU-sampled into a 2D canvas**, so CT mode needs no WebGL and no 3D textures. The same arrays answer "what structure is here" (label lookup), "may the scope shaft pass" (label ≠ tissue along sampled points) and "how close is the ICA" (distance-field lookup).

`js/ssb/volume.js` loads and serves them. `ssb/ct/ct.json` carries `dims`, `spacing`, the voxel → RAS `affine` (row-major, any axis order or sign; the inverse is computed), `dtype` (`uint8`, or `int16`, §5.10), `windows` (in the file's own value units), `values.toHU` (a piecewise-linear display → HU table) and the label file. `ct.u8.gz` and `labels.u16.gz` are gzip of raw voxels, x fastest, then y, then z (labels little-endian). `ssb/geometry/labels.json` maps an index to `<graph id>.<side>`. The loader decodes only when the bytes start with the gzip magic `1f 8b`, so a server that sends `Content-Encoding` and one that does not both work. Sizes are checked against `dims`. A missing label volume drops only the overlay. A header that fails validation, or a label or table name that would leave `ssb/ct` and `ssb/geometry`, is refused. Slices are resampled per pixel (trilinear CT, nearest label) along straight rows in voxel space: the three standard planes, and `obliqueSlice` for an origin plus two in-plane unit vectors.

### 5.7 Soft tissue

The bone-window specimen is 8-bit display values: air and bone separate cleanly, but mucosa, fluid, fat, muscle and cartilage lie a few display levels apart and cannot be segmented from it. Soft tissue is built four other ways, and each part says which:

| Layer | Built as | Truth kind |
|---|---|---|
| Mucosa (sinus and nasal lining) | The air spaces' own surfaces: the air/tissue boundary *is* the mucosal surface, drawn with the `mucosa` material; no thickness is modelled. Each air space is a closed shell, so every opening is a double membrane. From inside (the camera in the air box, or the scope) the `lining` pack is drawn instead: one surface over the union of every air label, split into nodes by the label each triangle faces, so openings are open (`lining.py`). Its nodes are keyed `lining:<id>.<side>`; a pick reports the graph id | specimen |
| Septal mucosa | The faces of the `s.nasal-septum.M` wall unit that face each nasal cavity, meshed per side, with a **chart**: the surface's sagittal projection (a, s) in mm and a lookup grid back onto it, so anything drawn on the septum is specified in 2D | specimen |
| Nasal floor mucosa (extended flap) | The cavity's lining triangles facing down (normal S ≤ −cos 45°) within 6 mm of floor-bone voxels, at or in front of the PNS plane (A ≥ −50), largest component (`softtissue.py`). Its chart is axial, (a, r) → s, with r = \|R\| (the left chart is the right one), and a `junction` polyline against the septal chart's `bottom(a)` | specimen |
| Small arteries (posterior septal and branches, PLNA, septal AEA/PEA branches, nasopalatine, superior labial) | Sweeps (§5.5) generated from **waypoints** (landmarks or chart points) at a stated depth below the surface. Every point `inferred`, every waypoint cited | specimen-placed, inferred |
| Flap territories | **Overlays**: outlines computed at runtime on a chart from landmarks, the graph's measurements and the procedure's steps, with parameters and presets like a diorama's (flap contract below) | schematic on specimen |
| External nose (naris, vestibule, valves, ala, columella) | The specimen's own skin and vestibule, unmasked from the UW axial stack (§5.1): skin `s.external-nose.M` (pack `nose`, one open surface) and vestibule air `s.nasal-vestibule.<side>` (the `core` pack; vestibular skin, not mucosa), both drawn with the `skin` material (a model node asks for it through its glTF `extras.kind`). The Nose layer toggles the skin. The internal valve `s.internal-nasal-valve.<side>` is the centroid of the narrowest coronal section of the airway connected to `lm.naris`; that plane is the vestibule \| cavity boundary (the limen nasi), a proxy for the mucocutaneous junction, which CT does not show | specimen, measured |
| Nasal framework (ULC, LLC crura, accessory chain, septal cartilage, ligaments), envelope layers, vessels and nerves of the external nose | Cartilage, ligament, fat and SMAS are not resolvable on this bone-window CT: the parametric `nasal-framework` diorama (§6.2), then fitted under the specimen's skin and on its nasal bones | schematic; schematic on specimen once fitted |

Pipeline: stage D (`tools/ssb-pipeline/uw/softtissue.py`) reads the committed `ssb/ct/` volume, not the raw crawl, so it reruns in any session. It writes a `soft` pack and `ssb/geometry/charts.json`, and merges its landmarks and sweeps into the shared geometry files without dropping other steps' keys. Method per point is in the `*.meta.json` files. The sagittal chart is single-valued only where the surface does not fold back: `charts.json` lists the cells that do under `unreliable`. Where the septum is thicker than the wall unit's cap, or a turbinate abuts it, the patch is completed from the airway lining's medial-most sheet; those cells are `filled` (lower confidence). Waypoint specs live in `tools/ssb-pipeline/uw/sweeps-soft.json`: anatomy as data, authored with sources, never hand-placed coordinates in content.

Overlays share the diorama contract's spirit (§6): parameters with ranges from the graph, presets from the procedure's own design ladder, parts named `<graph id>.<side>`, a *schematic on specimen* badge, and rules pinned in `tools/test-ssb.mjs`.

#### Flap overlay contract (nasoseptal flap; `js/ssb/flap.js`, `#flap=`)

**Inputs.** For side X: the septal chart `s.septal-mucosa.X` (chart (a, s) mm = RAS (A, S); `grid`, `polygon`, `unreliable`, `filled`); for design C the floor chart `s.nasal-floor-mucosa.X` (chart (a, |R|) → `grid.s`, with its `junction` rows); the landmarks `lm.sphenoid-ostium.X`, `lm.choanal-arch.M`, `lm.middle-turbinate-head.X`; the ostium's inferior margin `s_f` (`landmarks.meta.json`, `inferior_margin_s_mm`: the lowest S of the patent cavity, the sinus interface); and the meshes of both surfaces (for areas). From the septal chart: `top(a)`, `bottom(a)`, `post(s)`, `a_ant`. `top(a)` is interpolated linearly across the no-data gap (A -45…-35). The septal surface stops about 4 mm in front of the rostrum and at the internal valve plane; the overlay clips to what exists and says so.

**Parameters** (sliders, presets as buttons):

| Key | Range | Default | From |
|---|---|---|---|
| `design` | `short` (A) · `full` (B) · `extended` (C) · `rescue` | `full` | `p.nasoseptal-flap` preop ladder; atlas Fig. 31.3 |
| `top_margin` (B and C only; mm below the top of the septum) | 5–20; below 10 flagged "olfactory risk" | 15 (schematic) | `m.nsf-superior-incision` (10–20, conf low); ch. 31: 1–2 cm of superior septum for sella/planum defects |
| `anterior_margin` (B, C; mm behind the chart's anterior edge) | 0–10 | 0 | `p.nasoseptal-flap` step 4 |
| `floor_width` (C; mm lateral from the septum–floor junction) | 0 – the floor chart's width at each a | full width (schematic) | `m.nsf-extended-gain` |
| `window` (rescue; side of the contralateral window, mm) | 3–8 | 5 (schematic) | `p.nasoseptal-flap` rescue step |

**Geometry** (chart mm; `s_c` = the choanal arch's S, `s_f` = the ostium's inferior margin):

1. *Pedicle*: the posterior edge from `s_c` up to `s_f`. Its height `s_f - s_c` must lie in 8–16 mm (`m.choana-to-sphenoid-ostium`).
2. *Superior incision*: starts at (`post(s_f)`, `s_f`) for every design and runs forward. A (`short`) is level: `s_sup(a) = min(s_f, top(a))`. B and C rise to follow the septum's top: `s_sup(a) = max(s_f, top(a) - top_margin)`, clipped to `top(a)`.
3. *Posteroinferior cut*: down the posterior edge from `s_c` along the choanal arch and the vomer to `bottom(post)`.
4. *Inferior incision*: A and B run forward along `bottom(a)`. C crosses the junction onto the floor chart and runs at `floor_width` from the junction, with the posterior floor cut short of the hard–soft palate junction.
5. *Anterior cut*: A at the A of `lm.middle-turbinate-head.X`; B and C at `a_ant - anterior_margin`; on the floor chart (C) the same A.
6. *Outline* = pedicle → superior → anterior → inferior → posteroinferior, clipped to the chart polygons (septal, and floor for C).
7. *Rescue* draws only the superior incision from `s_f` forward to the middle turbinate head (no flap: area 0, pedicle marked), and a `window`-mm square on the contralateral chart, its inferior-posterior corner at `post(s_f)`, `s_f`.

**Readouts.** Surface area in cm² of mesh triangles whose centroid projects inside the outline, septal and floor separately; pedicle height; length of the outline's longest chord; the share of outline length on `unreliable` or `filled` cells as an "approximate" badge; and the literature line read from the graph (`m.nsf-area` for B, `m.nsf-extended-gain` for C, `m.choana-to-sphenoid-ostium`). No literature number is typed in code. Badge **schematic on specimen**, with a note that B and C end at the valve plane, the proxy for the mucocutaneous junction.

**Readings the code makes** (where the contract left a choice):
- The outline lives on cell edges (half a cell beyond the outermost occupied cell); the "inside its chart polygon" test allows 1 mm.
- A's level incision is clipped to `top(a)` at `s_f`; `top_margin` does not apply to A. Open for the owner and Opus: whether A should carry a margin of its own.
- Where the septal top is within `top_margin` of `s_f` (the posterior part), the B and C incision stays at `s_f`. The test therefore pins "at `s_f` or at most `top(a) - top_margin`", since no construction that starts at `s_f` can meet the stronger reading.
- The floor strip is exactly `floor_width` wide from the junction, clipped to occupied floor cells. The inferior meatus is not charted.
- The rescue window's placement is schematic: the contract gives none.
- The flap areas are smaller than the literature mean for B, because the charted septum stops at the valve plane. Compare them with `--only flap`, not against the literature here.

**Tests `tools/test-ssb.mjs` must pin:**
- the pedicle contains the posterior septal artery: the first point of both `s.posterior-septal-artery-*-branch` sweeps of that side (placed independently from `m.psa-to-sphenoid-ostium`) lies inside the pedicle's chart box, both sides;
- the superior incision starts at `s_f` in every design; for B and C every sample is at `s_f` or at most `top(a) - top_margin`, and none lies below `s_f` (property test over a parameter grid); for A it is level;
- the area readout equals an independent point-in-polygon sum over the meshes, within 2 %;
- `short` ⊂ `full` ⊂ `extended` (areas strictly increasing), each inside its chart polygons; `rescue` has zero area and the same pedicle;
- the right and left overlays differ only through their own charts and landmarks;
- determinism: the same parameters give the same polygon (hashed);
- hostile `#flap=` values clamp or are ignored.

**Not in this contract**: the inferior meatus, the inferior and middle turbinate flaps, the lateral nasal wall flaps, regional flaps, and the contralateral reverse flap.

### 5.8 Dissection states

**Why the volume, not the meshes.** A station needs its tip in an air label, the scope's collision samples the CT display volume, and the proximity HUD reads distance fields. Hiding a resected structure's mesh changes none of these. A dissection state is therefore a change to the CT display and label arrays: every removed voxel becomes air (display `air.fill`, label the nearest air space the unit opens into), and the lining is re-meshed on the opened air.

**Anatomy as data.** `tools/ssb-pipeline/uw/dissection.json` holds the units, their rules and which procedure step applies which unit. A unit is a **rule over the base's own labels, landmarks and distance fields**, never a hand-drawn voxel set, so it reruns on any base (§5.10). `realizes` lists the content ids it stands for. Three operators:

| `op` | Removes | Used for |
|---|---|---|
| `window` | voxels in the box with d(a) + d(b) ≤ `sumMm`, where a and b are two air-space sets. This is the rule `walls.py` uses to define a wall, so a resection is a window in what two compartments share. `shell` keeps a wall of given mm around named air spaces (opened by a later unit) | uncinectomy, antrostomy, basal lamella, sphenoidotomy, Draf IIa |
| `exenterate` | the morphological closing (ball of `closeMm`) of a group of air spaces, inside the box: partitions thinner than about 2 × `closeMm` go; thicker walls stay | bulla, anterior and posterior ethmoid, agger and frontal recess cells |
| `region` | every voxel of the named labels (or any non-air voxel) in the box, optionally only within `nearAirMm` of named air | posterior septectomy, rostrum, intersinus septum, sellar opening, clival recess |

Boxes are side-relative (r = σR). Every bound is a number or an anchor on a label's extent or a landmark (`"s.ethmoid-bulla.amax - 5"`), resolved on the base. Common rules: a `keep` list (lamina, skull base, turbinates, septum for FESS; posterior ethmoid and planum for the EEA corridor) is never carved, on either side. The **guard** keeps every carved voxel ≥ 1 mm from the ICA, optic nerve, AEA tubes and orbital contents, and is re-applied after mirroring. On the standard specimen the right side is computed and mirrored; midline units are computed whole.

**Procedures, states, corridors.** `procedures` maps each step to its units; `entry` lists the procedures assumed complete before step 0. A **state** is the cumulative unit list at a step (the entry chain, then the steps up to it) or at a corridor position; identical lists are one state. Checked in CI: every id a step `removes` is realized by a unit on that step or before it, or is listed under the procedure's `unrealized` with a reason; every unit on a step realizes at least one id that step removes; every unit name is a graph id. Unrealized in v1: the frontal beak (inseparable from the anterior table wall unit), the accessory sphenoid septum (not segmented), and the dorsum and posterior clinoids.

**Truth kind.** A dissected state is *specimen, dissected (rule-based cut)*. The cut is schematic even where the bone is real: several units stand in for structures the specimen does not segment (uncinate, bullar lamella, rostrum; the basal lamella is a proxy plane). Each unit's `truth` says which. The uncinate is fused into the maxillary medial wall unit, so the uncinectomy opens the infundibular trough and the hiatus and leaves the wall; the natural ostium appears with the antrostomy.

**Pipeline outputs** (`tools/ssb-pipeline/uw/dissect.py`):
- `ssb/states/index.json`: `version`, `base` (the first 10 hex of the SHA-256 of the base CT display and labels), `ctFill`, `states`, `procedures`, `corridors`, and unit voxel counts against `measured`. Per state key (the first 10 hex of the SHA-256 of its unit list in application order, one unit per line): `units`, `usedBy` (`"p.draf-i#2"`, or `"fess:p.draf-i#2"` for a corridor position), `patch`, `lining`, `hides` (wall nodes removed entirely), `remnants` (wall node → the remnant that replaces it in the lining pack) and `measured`. `procedures[p]` is `{entry, steps: {step: key}}` (`entry` null when the procedure starts on the intact head). `corridors[c]` copies the data's entry and adds `positions: [{procedure, step, state}]`.
- `ssb/states/<key>.ssbp.gz`: a **patch**. A u32 header length, a JSON header (`version`, `base`, `state`, `units`, `ctFill`, `boxes: [{side, ijk0, dims}]`), then per box a u16 array, x fastest: 0 = unchanged, else the voxel's new label (its display becomes `ctFill`). Each patch is whole from the base, so any step is reachable at random. At most one box per side: `R` (voxels right of R = 0), `L`, and `M` (the R = 0 plane).
- `ssb/models/lining-<key>.glb.gz` (and `lining.glb.gz`): `lining.py`'s method on the state's air, plus remnant meshes `<id>.<side>@<cut>` (the node's `extras.cut`) for each wall label a state cuts partly. Every lining pack is cleaned by `meshes.py` `clean_lining` (zero-thickness fins and twin faces go; their normals are rebuilt). `tools/check-data.mjs` fails on a twin face or a zero normal in any `lining*.glb.gz`. State linings are **not listed in `packs.json`**; they load on demand from the index.
- Distance fields are not recomputed: the guard keeps every cut away from the structures they measure.
- Budgets (checked by `tools/check-data.mjs`): a state lining ≤ 350 kB gzip, all state linings ≤ 6 MB, a patch ≤ 100 kB.
- Evaluation notes: anchors read voxel centres; a right-side unit's box never reaches r < 0, and its result is mirrored per unit with the guard applied again; the air sets of a right-side unit are its `.R` and `.M` labels, of a midline unit all three sides; `exenterate` is the closing by Euclidean thresholds; the working air is the cumulative state, so a later unit sees the earlier carves.

**Runtime.** `volume.js` has a pure `parsePatch(bytes, volume)`, which refuses (with a `VolumeError`) a wrong `base`, a box outside `dims`, a label the table does not name, a body that is not the boxes' size, or a version other than 1; and `applyPatch(volume, patch)`, a derived volume with the same API plus `carvedAt`. The base is never touched. `js/ssb/mode-procedure.js` plays a procedure as the scope stage with `state.procedure = { id, step, cor }` behind it (§7.3), not as a fifth stage. The endoscope's collision, tip label and exposure read the state volume (`setStateVolume`). The CT stage and the scope's CT inset keep the base image, and the CT stage outlines the carved voxels (`mode-ct.js` `setCarved`). The specimen stage swaps in the state's pack by key (`geo-specimen.js` `loadState` / `unloadState`), draws a step's `see` structures and the `at` of its `risk` hazards through what hides them, and hatches the hazards. Hazards exclude the walls the state cuts: a thin rim of one, drawn through the lining, reads as a detached slab. `ui-procedure.js` is the step list, the `think` prompt ("Think first", click or `T`), Previous / Next / `[` `]`, the corridor picker and the state badge.

**Step numbering.** Step 0 is the start (the entry state, or the intact specimen); n ≥ 1 is the state after step n. N is the highest step the index lists for the procedure. A step the index does not list takes the nearest lower one. A step that removes nothing is the same state. A step lands on what its state opened: the scope flies (a step the reader takes) or jumps (a `#p=…&step=n` link with no `scope=`) to a view of the state, by the landing rule below. The index is fetched only when `js/ssb/stamps.js` lists `ssb/states/index.json`, so a build without states makes no request. A state pack (`packs.json` entry with `"state": <key>`) holds the state's lining nodes and remnants. Remnants replace the base wall of the same id and side; `hides` hides base nodes by key.

**Stations.** `ssb/geometry/stations.json` gains `byState: {<state key>: {"t.<id>.<side>": {pose, target, measured}}}`, posed by the E5 rule on the committed state (`tools/ssb-pipeline/uw/stations.py`; `check` retests every committed pose, `write` reposes after a regeneration). The tip must lie in an airway label *of that state* (a space, an ethmoid cell, the frontal recess; not the vestibule). A station the contralateral nostril reaches is keyed by its target's side. A pose posed for state A is free in every state B whose units include A's, because carving and decongestion only turn tissue into air (`--only scope` tests every such pair). So the **views of a state** are its own `byState` poses, then those of each state whose units are a proper subset of its own (most units first; a key posed by a nearer state shadows a farther one), then the intact `stations`.

The **landing** of a step: the step's own station if the state's own poses have one for it; else the first of the state's own views (what the state opens comes first); else the nearest inherited view; else the intact pose of the step's station; else the pose stays and a note says so. A procedure also lands on step 0 of a position that has a state. A row of `stations.py` may name its state as `<corridor>:<p-id>#<n>`, a target as `lm` (an exact landmark), `carvedDiff` (the centroid of what one state carves beyond another), or a `prominence` ranking. A 0° lens is searched with the roll fixed at 0. A pose may carry `"shaft": "2.7"` when only the 2.7 mm telescope reaches it (the olfactory cleft and inferior meatus, §5.9); flying there switches the shaft, and the controls say so.

### 5.9 Mucosal state: decongested · as scanned · congested

The as-scanned specimen is not decongested: its per-side nasal-cavity cross-section averages 1.6 cm² between the middle turbinate head and the choana, and the as-scanned left side 0.65 cm². A three-way toggle shows the mucosa decongested, as scanned or congested, as a patch on the base (the §5.8 format), applied before any dissection. Procedure mode always plays on the decongested state.

- **Operator** (`tools/ssb-pipeline/uw/mucosa.py`): soft tissue (display 78 ≤ v < 120) of the erectile labels (inferior and middle turbinate, and the side's half of the septum), within d mm of that side's nasal-cavity air, recedes to air. It never comes closer than 0.5 mm to bone (display ≥ 120), and acts only between the choana and the internal valve. The congested state grows the same tissue into the air.
- **Decongested, calibrated on the ratio** of Xiao et al. 2021 (MRI of 10 healthy adults before and 10 minutes after xylometazoline 0.1%): the mean cross-section between the first vertical plane and the posterior septum rose 34.8 % (2.8 → 3.8 cm²), least in the superior third and around the valve, with surface area unchanged. d is the smallest 0.25 mm step that raises the specimen's mean per-side CSA over that span by at least the same ratio. The prototype gives d = 1.0 mm (× 1.39). The ratio, not Xiao's absolute values, is used: the specimen's label is a bone-window threshold and Xiao's an MRI segmentation. The calibration record is `ssb/states/mucosa.json`. The operator never changes the septum's midplane (R = 0), so decongestion cannot perforate it.
- **Congested** is the congested phase of the nasal cycle, on both sides. Its target is POP1's median of the more congested side's mean cross-section against the subject's two-side mean (`profiles.summary.restricted["10-90"].moreCongestedOverMean` in `ssb/anatomy/population/nasalseg.json`). d is the 0.1 mm step whose ratio is closest. In NasalSeg the loss sits in the middle of the cavity, at the turbinates.
  - **Shipped as the turbinates' layer only** (accepted at checkpoint CP-3b). The CT grid is 0.5 mm, so with all three erectile labels advancing, the ratio jumps 1.00 → 0.76 (d = 0.5 mm) → 0.66, and the target is not reachable within ± 0.04. The turbinates alone give 0.851 at d = 0.5 mm, within tolerance. The septal swell body (`s.septal-swell-body`) is therefore not grown; adding it as a bounded septal region is a refinement for when it has geometry. `mucosa.py congested --group all` builds the three-label operator instead.
  - The patch writes one constant display (the median of the erectile soft tissue) and the labels of the nearest turbinate. The owner may still overrule (O13).
- **Pipeline and files.** `mucosa.py` writes a patch and a lining pack per state (keys: the first 10 hex of the SHA-256 of `mucosa.dec` / `mucosa.cong`). `dissect.py` applies the decongested operator first, so every dissection patch is whole from the as-scanned base and records `mucosa: "dec"`. `index.json` copies both mucosal states (`states` with `units: []`, and a top-level `mucosa: {dec, cong}`). The erectile walls get remnants `<id>.<side>@decongested` / `@congested` at half their usual triangle budget, so the lining keeps about two thirds of the state budget. Runtime: `state.mu` (§7.3); the procedure player loads a mucosal state like any other state when `mu` is not `scan` and no procedure plays. The toggle is in the Specimen controls (`ui-specimen.js`). CT keeps the base image.
- **What decongestion does not open.** At Xiao's ratio none of the closed views opens. The olfactory cleft and the inferior meatus are closed to the 4 mm shaft, and open to the 2.7 mm telescope even as scanned (the cribriform plate fills most of the cleft view; the lateral wall most of the meatus view). The 45° frontal recess view opens with the Draf I entry state. Mucosal edema of rhinosinusitis is pathology, the realistic-anatomy `fill` operator (§14 R6.5), not this toggle.

### 5.10 New data: population, more heads, 16-bit CT

A **head** is a base: a CT and a label volume (every name a graph id) in the §4 frame, plus everything the pipeline derives from them. Walls, meshes, lining, distance fields, dissection units, mucosal states and station poses are rules over a head's labels and landmarks, so a new head gets FESS and the EEA corridor by rerunning the pipeline once it has the labels those rules name. Layer order on any head: base → variant → condition (§14 R2.1) → mucosal state → dissection.

- **Population (NasalSeg, CC BY 4.0).** 130 case ids hold **107 distinct scans** (19 groups of byte-identical duplicates): count scans, not ids. Numbers ship; scans do not. Subjects are adults on one scanner at one centre; the labels are **air**, so disease shrinks them. Uses: (1) *placement*: each base's cavity and maxillary volumes, asymmetry indices and cross-section profiles as percentiles, shown with population truth; (2) *calibration*: the congested state, and the mild / typical / marked grades of asymmetry variants; (3) *averaged normal*: a population reference (median and IQR profiles; a population maxillary sinus as a ghost overlay). Deforming a head toward the population median is a composite and covers only the five structures NasalSeg labels (owner decision O9). Results and the full method are in `ssb/anatomy/population/nasalseg.json` and `tools/ssb-pipeline/nasalseg/` (`stats.py` docstring).
- **Label conventions.** NasalSeg's labels differ from ours in convention more than in quality. Its nasal cavity runs from the nostril to the choana (vestibule included) and takes in the partial-volume rim, so a median 26 % of its voxels lie above our air threshold. Compared at one convention (our threshold, cavity plus vestibule), head A's cavity sits at the 42nd percentile of NasalSeg's clear subjects and its maxillary sinus at the 51st. Our labels leave less adjacent air unlabelled, so for the five structures NasalSeg labels, the approximated segmentation holds. NasalSeg does not label what the FESS units stand on (uncinate, ethmoid partitions, infundibulum); that is the resegmentation's job (§14 R7). A voxel-level check (a model trained on NasalSeg, run on head A) waits on owner decision O12.
- **Head A's nasal asymmetry** lies beyond every clear NasalSeg subject on the cavity index (`ssb/anatomy/population/`; the owner's reading in `docs/realistic-anatomy.md` §4.4). Until resegmentation settles whether the septal bow and turbinate congestion or segmentation explains it, the `scanned` state describes this head as at the edge of normal, not typical.
- **Cross-section profiles.** Per clear subject and side, the cavity label's section profile along its own anteroposterior axis (1 mm sections, mean from 10 to 90 % of the length), restricted to our air threshold. Only the restricted rows compare like with like. The 10–90 % span is the one used; the JSON keeps all three spans.
- **Population panel.** The Specimen dock's "Population (NasalSeg)" section (`js/ssb/population.js`, `js/ssb/ui-population.js`) reads the JSON and nothing else. It hides itself when the file is missing or malformed.
- **Population sinus.** `tools/ssb-pipeline/nasalseg/meanshape.py` aligns each clear subject rigidly (no scale; four label centroids onto the standard specimen's) and votes: the region at least half the aligned maxillary labels occupy is the shape. It writes `ssb/models/population.glb.gz` (nodes `s.maxillary-sinus.<side>@nasalseg-majority`, `extras.kind` "ghost"; `packs.json` `"population": true`, so never loaded at boot). It is an aligned majority, not any one person's sinus, and runs a little under the median volume. The cavity and nasopharynx are not drawn from the population, because a rigid fit cannot register a thin convoluted passage. The ghost is registered as `population:<id>.<side>`: never selected, picked or counted among the regions.
- **Variants from NasalSeg.** Subjects at chosen percentiles are real 16-bit CTs: exemplars that calibrate the variant layer, and bases of their own once resegmented (their five labels do not include the ethmoid that FESS units need).
- **16-bit intake.** `ct.json` takes `dtype: "int16"` with `values.kind: "HU"` (windows in HU, no LUT; data in `ct.i16.gz`, little-endian) and optional per-head `levels: {air, bone}`. `volume.js` reads both dtypes; `toHU` is the identity on an HU head. The scope's collision takes `levels` as `shaftClearance`'s last argument, defaulting to `BONE_LEVEL` 150 and `SOFT_LEVEL` 78, so collision behaves the same on any head. Outside the volume is "no data" on any scale. `tools/ssb-pipeline/intake/intake.py` reads NIfTI-1 and NRRD (DICOM would need `pydicom`, an owner decision), fits a rigid transform to the §4 frame from landmark correspondences, resamples isotropically and writes `incoming/<name>/` only. Shipping a head under `ssb/` is a separate decision. Head A stays 8-bit.

### 5.11 Anatomy state: bases and patches

`state.anatomy = { base, variants, conditions }` (§14 R2.1) is the layer stack over the volume and the packs: a **base** (`standard`: `ssb/ct`, `ssb/geometry`, `ssb/models`; `scanned` and `scanned-b`: a full copy of that layout under `ssb/anatomy/<base>/`), then **variants**, then **conditions**, each a **patch** laid over the base. It is independent of the stage. `ssb/anatomy/index.json` is the registry. If `js/ssb/stamps.js` does not list it, the anatomy is the standard head and nothing is requested. Its shape (`buildAnatomyRegistry`, `js/ssb/state.js`): `{ version: 1, bases: {scanned: {…}}, variants: {"<v-id>": entity}, conditions: {"<dz-id>": entity}, compat: [["<id>.<side>", "<id>.<side>"]] }`, with `entity = { sides, presets, default?, bases?, region?, boxes?: {"<side>": {min, max}} }` (extents in RAS mm). An entry the graph lacks, or with no side or preset, is dropped. Compatibility: no ref twice; one condition; one variant per side per `region`; two different refs only when the pair is in `compat` or their extents do not overlap.

**Patch file** `ssb/anatomy/patches/<base>/<entity>.<side>.<preset>.ssbp.gz`: gzip of a u32 LE header length, a JSON header (`version` 1, `base`, `entity`, `side`, `preset`, `params`, `truth` `"composite"`, `calibratedOn`, `assumed`, `boxes`, `landmarks`, `sweeps`, `replacesNodes`, `addsNodes`; layout as §14 R6.2), then per box, in order, its dense arrays, x fastest, little-endian: `ct` (u8, or i16 on a 16-bit head), `labels` (u16), then one u8 array per `sdf` key in header order. `parseAnatomyPatch` (`js/ssb/volume.js`) refuses, with a `VolumeError`: a version other than 1, or a base, entity, side or preset that differs from what was asked; a truth other than `composite`; a box with non-integer, zero or negative dimensions or corner; more than 16 boxes; node names that are not `<id>.<side>`; a body not exactly the boxes' size. `applyAnatomyPatch` also refuses a box outside the volume, a ct type that is not the volume's, and a label the table does not name. A box REPLACES every voxel of its extent (CT and labels). Patches apply in order, the later winning an overlap, and the base is never touched. `sdf`, `landmarks` and `sweeps` are carried but not applied yet: the scope still reads the standard head's distance fields.

**Override packs** `ssb/anatomy/overrides/<base>/<entity>.<side>.<preset>.glb.gz` (not in `packs.json`) hold the whole-node replacements a patch names. The specimen stage loads one only for the nodes of its header (`replacesNodes` ∪ `addsNodes`; any other node is skipped with a problem recorded), registers them as `anatomy:<stem>:<id>.<side>`, hides the base nodes of `replacesNodes` whose replacement arrived (never a hole), and restores them when the anatomy is cleared. CT shows `anatomyVolume(anatomy)`, the base's volume with each patch applied. A procedure still plays on the standard head.

**URL and UI.** `anat=`, `v=`, `dz=` (§7.3). The Anatomy pills (Symmetric · Normal asymmetry · Variants · Pathology, `ui-specimen.js`) enable only for what the index lists. Variants and Pathology are hidden until the index lists an entry of that kind.

**The scanned base** `ssb/anatomy/scanned/{ct,geometry,models}` is regenerated by `tools/ssb-pipeline/uw/normalize.py --base scanned`: head A as scanned, with the standard stages minus the septal centring, the mirror, the midline plates, the nose centring and the sides step, and each side computed on its own. Its label table is the standard one, so an index means the same name on every base. A stage-D product that fails its gate on a side is left out, never loosened, and listed in the index entry as `absent: [{id, side, reason}]` with the measured number. The flap overlay is a standard-head tool, so a base whose entry lists a flap chart as absent has the overlay disabled with a note. The entry also carries the pipeline's volumes, the cavity and maxillary asymmetry indices with their NasalSeg percentiles, the state's note, and `labelTransitions`: voxel counts per (from, to) label pair, attributed to a step, with tissue becoming air (or the reverse) an escalation. The dissected states, the endoscope and the procedure stage are the standard head's. The store never pairs them with another base; the later choice wins. Picking Normal asymmetry leaves the scope or procedure, and entering either returns to the standard head (`set()` in `state.js`). `tools/test-ssb.mjs --only scanned` tests the base.

## 6. Dioramas

A diorama is an ES module `js/ssb/dioramas/<name>.js`, registered in `dioramas/index.js`, exporting:

- `PARAMS`: `[{key, label, unit, min, max, step, default, from?, type?, options?, requires?}]`. `from` is the graph id the range comes from; `type` is `toggle` or `choice` (else a range); `requires` ties a size to its on/off toggle. The lab's sliders and the URL whitelist are generated from it.
- `PRESETS`: `{ '<classification id>': { '<class code>': {params…} } }`, derived from the classification's criteria in the graph (the module says where the graph is silent).
- `VIEWS` (`sagittal`, `coronal`, `axial`, `oblique`; radiological conventions) and `VIEW_DEFAULT`.
- `classify(params)` and `readout(params, userData, names)`: the HUD lines.
- `build(THREE, params) → THREE.Group`: geometry in RAS millimetres, converted once to the scene by the root group's rotation (`js/ssb/frame.js`). three.js is passed in, never imported, so the modules load without WebGL (the URL whitelist and the tests read their tables).

Every part is an object named `<graph id>.<side>` whose `userData.id` is the graph id, so picking selects through the ordinary store path. A hazard site carries the graph's hazard ids in `userData.hazards` and is hatched. A part's `userData.look` names its tissue `kind` (`kit.tag` rejects an unknown one) and space / ghost / translucent flags. The lab draws it with that kind's procedural material (§7.4). A diorama never names a colour.

Primitives (`dioramas/kit.js`): superellipsoid air cells; profile extrusions (prisms) for plates and skull base; cylinders (`cyl`, with an implicit test) for canals and nerves; tubes for vessels and pathways. Each kind has one implicit `inside()` test and one mesh builder, so anything computed over a diorama sees exactly what is drawn. Also `strip` (a thickened polyline: ribbon or cartilage plate), `edt` (the exact separable Euclidean distance transform of a voxel mask, in mm) and `isoGeometry` / `isoInside` (marching cubes over a grid field). These are tested in Node (`node tools/test-ssb.mjs --only kit`).

A diorama may be placed in context by a similarity transform onto specimen landmarks, but defaults to standalone with a *schematic — idealized* badge. Fixed proportions the graph does not give are stated as schematic in each module's header.

| Diorama | Parameters | Presets from |
|---|---|---|
| `ethmoid-roof` | olfactory fossa depth, lateral lamella angle, fovea asymmetry, AEA course (in canal / in mesentery, drop below roof), supraorbital ethmoid cell | `c.keros`, `c.gera` |
| `frontal-recess` | each IFAC cell on/off and size, uncinate superior attachment, frontal beak AP depth | `c.ifac`, `c.uncinate-superior-attachment` |
| `sphenoid` | pneumatization pattern, lateral recess, pneumatized anterior clinoid (deep lateral OCR), intersinus septum insertion, ICA/optic dehiscence, sphenoethmoidal cell over the optic nerve | `c.sphenoid-pneumatization` |
| `lateral-wall` | uncinate form, accessory ostia, infraorbital ethmoid cell, concha bullosa, paradoxical MT | variants in region A |
| `nasal-framework` | envelope thickness and depth, dissection plane, keystone, valve angle, lateral crus size and orientation, interdomal distance, tip tripod legs, L-strut, nasal bone variant classes, medial crura, columellar and angular arteries, external nasal nerve, depressor septi (§6.2) | `c.nasal-bone-shape`, `c.medial-crura-shape`, `c.angular-artery-course`, `c.external-nasal-nerve-branching`, `c.depressor-septi-type` |

In `frontal-recess` the drainage pathway is **computed**, not drawn: it is the channel left between the cells present. The recess and sinus are voxelized at 0.5 mm from the rendered solids, the cells present are subtracted, and the path from the sinus through the ostium to the middle meatus or infundibulum is a 26-neighbour Dijkstra path whose step cost grows as clearance shrinks. It is smoothed in free space and drawn as a tube with slow particles (none under reduced motion). The uncinate's superior attachment (Landsberg–Friedman 1, 5, 6) is geometry too: a lateral bend closes a terminal recess; a plate to the skull base or a medial bend to the MT leaves only the infundibulum. `tools/test-ssb.mjs` checks every rule under all three attachments. Anterior cells (agger nasi, supra agger) push the pathway posteriorly; posterior cells (suprabullar, suprabullar frontal) push it anteriorly; a frontal septal cell pushes it laterally. The supraorbital ethmoid cell is posterolateral to the pathway rather than pushing it.

### 6.1 The `sphenoid` diorama

Built as `js/ssb/dioramas/sphenoid.js`; rules 0–9 below. Amended by Opus at verification: rule 4's type 4 corrected, "facing air" defined, the conchal bone thickness given a number, rule 2's threshold labelled a convention, impossible combinations tabled (rule 9). Every fixed proportion is schematic and says so in the module header.

**Scene.** One standalone, bilateral model in a local RAS frame: origin on the sphenoid face at the midline and the ostium height, y negative posteriorly. Solids: the sinus as a superellipsoid pair inside the sphenoid body; rostrum and anterior face with two ostia; roof (planum, tuberculum, sella as a bulge with its anterior and posterior wall planes); floor; clivus; the ICAs as tubes (parasellar and paraclival segments) in canals; optic nerves in canals; vidian canals; foramen rotundum (V2); the intersinus septum; the lateral recess; the anterior clinoid with its optic strut; an optional sphenoethmoidal (Onodi) cell. `kit.js` primitives only; the same `inside()` tests drive rendering and the rules. Fixed schematic sizes (sella AP length, ICA and optic canal diameters, wall thicknesses, sinus height) are stated in the header.

**`PARAMS`** (a `choice` or `toggle` where the graph defines classes, a range where it gives numbers):

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
| `onodi` | toggle (sphenoethmoidal cell over the optic nerve; implied by `optic_type` 4) | `v.sphenoethmoidal-cell` |
| `vidian_type` | choice 1 · 2 · 3 | `c.vidian-canal-type` |

**`PRESETS`**: `c.sphenoid-pneumatization` (4 codes → `pneum`), `c.delano-optic-nerve` (1–4 → `optic_type`, `onodi` for 4), `c.vidian-canal-type` (1–3 → `vidian_type`). The graph is silent on joint configurations, so a preset sets one parameter and leaves the rest at the default (`sellar`, all toggles off, `intercarotid` 12, `optic_type` 1, `vidian_type` 2).

**`VIEWS`**: `sagittal` (default; reads the pneumatization), `axial` (septum, ICAs, optic canals), `coronal` (lateral recess, vidian canal, V2, carotid prominences), `oblique`.

**HUD (`classify` / `readout`)**: pneumatization class; DeLano type; vidian type; "septum meets the ICA prominence: yes/no"; "intercarotid window: N mm"; "ICA dehiscent / protruding"; hazards by id.

**Hazard sites** (hatched, `userData.hazards`): the exposed ICA wall (`h.ica-injury-sphenoidotomy`, and `h.septum-avulsion-ica` when the septum inserts on it); the optic canal where exposed (`h.optic-nerve-injury-sphenoid`, and `h.optic-nerve-injury-onodi` with an Onodi cell); the vidian canal ridge (`h.ica-injury-vidian`).

**Rules `tools/test-ssb.mjs` must pin** (computed from the solids on a 0.5 mm voxel grid, as the frontal-recess rules are; none written in):

0. *Facing air* (used by rules 2 and 4): the share of a canal's circumference whose outward normal reaches sinus air within the canal wall's thickness + 0.5 mm, sampled at 64 angles on each of 9 cross sections along the segment. Dehiscence sets the wall to 0 on that arc.
1. *Pneumatization order.* Posterior air extent is strictly conchal < presellar < sellar < postsellar. Air lies under the sella (between its anterior and posterior wall planes, below its floor) exactly for `sellar` and `postsellar`; behind the posterior sellar wall plane exactly for `postsellar`. `conchal` leaves at least 8 mm of bone between sinus air and the sella (schematic).
2. *Carotid prominence.* The fraction of an ICA segment's circumference facing sinus air (rule 0) is 0 for `conchal`, and at least 0.5 exactly when the segment is protruding. The 0.5 threshold is a diorama convention (DeLano's type 3 criterion carried over to the ICA, matching `v.ica-protrusion`'s hedged wording), stated in the header. Impossible combinations: rule 9. A segment is judged only where the class reaches it: parasellar from `sellar`, paraclival from `postsellar`.
3. *Septum on the ICA.* The minimum distance between the intersinus septum's posterior end and the ICA canal wall is 0 exactly when `septum_on_ica` is on and the sinus is at least `sellar`; otherwise positive.
4. *DeLano.* Optic canal circumference facing air (rule 0): type 1 → 0; type 2 → above 0 and below 0.5 (indenting); type 3 → at least 0.5 (traversing); type 4 → an Onodi cell lies **medial and/or superior** to the nerve, which runs in the cell's lateral wall, and the canal faces the cell's air, not the sphenoid's, over at least 0.25 of its circumference. The nerve is never inside the sinus lumen as a free tube.
5. *Intercarotid window.* The minimum distance between the two ICAs' medial walls equals `intercarotid` within 0.5 mm over the whole range; `septum_shift` does not change it.
6. *Vidian.* Type 1: a ridge of positive height over the sinus floor; type 2: the canal on the floor with a lower ridge (height below type 1's); type 3: no ridge.
7. *Lateral recess.* With `lateral_recess` on, sinus air extends lateral to the vidian canal–foramen rotundum line by `lr_extent` (±1 mm); off, it does not.
8. *Names and ids.* Every part is `<graph id>.<side>` and resolves in the graph; every hazard id resolves; the URL codec round-trips and clamps hostile values; both themes compile.
9. *Impossible combinations degrade, by one table in the module*, and the HUD says what was degraded. With `pneum` = `conchal`: `ica_protrusion`, `ica_dehiscence`, `optic_type` 2–3, `optic_dehiscence`, `vidian_type` 1, `lateral_recess`, `clinoid_pneum` and `septum_on_ica` have no effect. With `presellar`: `ica_protrusion` and `ica_dehiscence` have no effect (the air ends in front of the sella's anterior wall, so it never reaches the parasellar carotid; a share of 0 is the anatomy). `optic_type` 3 needs at least `sellar`; below it, type 2 is drawn. "No effect" means the parameter takes its default and the HUD names it. A test sets each such pair and checks the geometry equals the degraded configuration's.

### 6.2 The `nasal-framework` diorama

Spec: `plans/2026-11-10-ssb-nasal-framework.md` (ST7). Status: GitHub issue #267.

## 7. Runtime architecture

### 7.1 Files

```
ssb.html                     shell: CSP, chrome, canvas, panels (no inline script)
css/ssb.css                  --ssb-* tokens (tissue kinds, cell categories, stage) + layout
js/ssb/main.js               entry (type="module"): feature detection, boot, error surface
js/ssb/frame.js              the one RAS <-> scene conversion (§4)
js/ssb/stamps.js             GENERATED: data-asset path → hash (for fetch URLs)
js/ssb/graph.js              load, index, search, render text for the knowledge graph
js/ssb/state.js             the one store (mode, tier, layers, selection, camera, step); URL-hash codec; ssb:* storage (guarded); anatomy registry
js/ssb/flap.js               the nasoseptal flap overlay's geometry (§5.7): pure, no DOM, no three.js
js/ssb/scope.js              the rigid endoscope's geometry: pure math, no DOM, no three.js
js/ssb/scene.js              the 3D stage: renderer, camera, controls, lights, picking, on-demand loop
js/ssb/materials.js          procedural tissue-material library, one factory per tissue kind
js/ssb/geo-specimen.js       the specimen's geometry: model packs → one scene graph, registry, dissection states, patches
js/ssb/population.js         NasalSeg's population facts about the five structures it labels (§5.10)
js/ssb/volume.js             the CT and label volumes as typed arrays: loading, affine, slicing, lookup, patches
js/ssb/mode-specimen.js      the Specimen stage: Explore mode
js/ssb/mode-endoscope.js     the Endoscope stage: a first-person rigid scope
js/ssb/mode-procedure.js     the procedure player: steps played in the scope on a dissected state
js/ssb/mode-lab.js           the variant lab stage: builds the named diorama with its parameters
js/ssb/mode-ct.js            the CT stage: three linked slice canvases, no WebGL needed
js/ssb/ui-*.js               panel, tree, search, and the Specimen, endoscope, procedure, population, lab and CT controls
js/ssb/dioramas/*.js         parametric models (index.js registry, kit.js primitives)
js/vendor/three-<version>/   three.js module build + the addons used (§8)
ssb/content/*.json           the knowledge graph
ssb/geometry/*.json          labels, landmarks, sweeps, station poses (stations.json: its `rule` string says how each pose was checked; `uncovered` lists stations the intact specimen cannot show)
ssb/models/, ssb/ct/         pipeline outputs
tools/ssb-content.mjs        graph validator (CI); `--queue` prints the owner's review queue
tools/ssb-pipeline/          offline geometry/CT pipeline
tools/ssb-fixture-ct.mjs     a synthetic volume in the same format, for tests (never written into ssb/)
```

Dependencies are one-way and acyclic: `main → mode-* → {scene, geo-*, volume, ui-*} → {graph, state} → stamps`; `scene → materials`; `mode-ct → {volume, materials}`; `main → dioramas → {frame, materials}`. Only `scene` and `geo-*` import three.js. The dioramas and `materials` receive it as an argument, so they load without WebGL. `mode-ct` and `ui-ct` mount from the graph alone, which is why CT works where WebGL does not. `mode-specimen` loads by dynamic import, so a failure there leaves graph mode and CT alone.

### 7.2 Cache-busting an ES-module graph

Stamps cover `<link>`/`<script>` in root HTML only. A module graph defeats that: `main.js?v=…` imports `./scene.js`, which the CDN caches on its own clock. So `tools/stamp-assets.mjs`:

1. Regenerates `js/ssb/stamps.js` from the hashes of `ssb/**` data files and of `tbone/ct` and `tbone/geometry` (OLSB's Real CT mode reads them through `js/ssb/volume.js`; `js/olsb/ct.js` is stamped as an extra importer of `js/ssb`).
2. Topologically sorts `js/ssb/**` by relative imports (static and dynamic) and rewrites each specifier to `./x.js?v=<hash>`, leaves first, so a changed leaf re-stamps every importer up to the HTML. An import cycle is an error.
3. Leaves vendored three.js unstamped: its versioned directory (`js/vendor/three-<version>/`) is its cache key.

`tools/check-data.mjs`'s stamp check covers module specifiers the same way.

### 7.3 State and URL

One store; everything else subscribes. The URL hash is the shareable state, e.g. `#s=s.lateral-lamella&tier=2`, `#p=p.draf-iia&step=4`, `#lab=ethmoid-roof&c.keros=III`, `#ct=cor&at=12.5,31,48`, and the quality override `q=full|lite` (§7.4). Parsing is whitelist-only: ids must exist in the graph index, numbers are parsed and clamped, unknown keys are ignored, and nothing from the URL reaches markup except through `textContent` (`docs/security.md`).

- **Lab** `#lab=<diorama>&<key>=<value>…`: the diorama must be in the registry; keys must be in its `PARAMS` (values clamped and snapped to the step; a `choice` snaps to an option). A classification id naming a preset (`c.keros=III`) is applied before explicit parameters. The canonical form lists only parameters that differ from their defaults. Slider drags update it once they settle.
- **CT** `#ct=<ax|cor|sag>&at=<r>,<a>,<s>`: the plane is one of those names (or `axial`, `coronal`, `sagittal`); anything else ignores the whole stage. `at` is the crosshair in RAS mm and must be three finite numbers, else it is dropped and the viewer sits at the volume's centre. The store clamps it to a sanity range until the volume loads, then to the volume's bounds (`setCtBounds`). A crosshair drag settles before the URL is replaced.
- The stage is one of specimen, lab or CT. A hash with both `lab` and `ct` keeps the lab.
- **Anatomy** `#anat=<base>&v=<ref>,…&dz=<ref>,…` (§5.11; `<ref>` is `<id>.<R|L|M>[:<preset>]`): whitelisted against `ssb/anatomy/index.json` and the graph. An unknown id, side, preset or base, a disallowed pair, a malformed value or more than eight entries drops the **whole** anatomy key, and the hash is rewritten canonical. Until the index arrives the link's anatomy is `pending`, and every consumer treats it as the standard head. `v` or `dz` without `anat` takes the index's default base (`scanned` when listed).
- **Procedure** `#p=<p-id>&step=<n>[&cor=<corridor>]` (the pose follows as `scope=`): the store keeps a well-formed `p-id` and clamps `step` to 0..99. Once the index has loaded, the player drops a procedure the index does not list and clamps `step` to its steps. `cor` (a corridor key that lists the procedure) makes the state accumulate the corridor's earlier procedures instead of the procedure's own `entry`. It implies the scope stage on the decongested mucosa.
- **Mucosa** `mu=dec|scan|cong` (§5.9; default `scan`, not written when `scan`): ignored and not written while a procedure plays; an unknown value is dropped.
- **Flap** `flap=<short|full|extended|rescue>[.<R|L>]` with `top`, `ant`, `fw`, `win` for its sliders (`state.flap`; side defaults to `R`; values clamped and snapped; default parameters not written). It is an overlay on the specimen, not a stage: a lab or CT link ignores it. Its controls are offered from its own tier (3) or whenever an overlay is on.

### 7.4 Rendering

- **Materials: one procedural surface per tissue kind** (`materials.js`). A part's `look` names its `kind`; the library draws a `MeshStandardMaterial` extended through `onBeforeCompile`, so three's lighting and shadows stay. Bone is ivory with fine pitting; `bone-cut` is the flat solid cap colour for section planes; mucosa is pink with a fine, domain-warped submucosal vessel network and a wet sheen (the endoscope's main surface); cartilage, dura, fat, muscle, artery, vein, nerve, gland and brain follow; `skin` (external nose and vestibule lining) is matte with fine pores, no vessels. Air cells, air spaces and the flow pathway stay plain tinted surfaces.
  - No textures and no UVs. Every pattern is a function of the **world position in millimetres**, so its scale is identical on every model. Structured 2D patterns (vessels, fibres) are projected triplanar; isotropic ones (pores, mottling, lobules) are solid 3D noise. Relief is a derivative bump in mm, and detail finer than a pixel fades from its footprint. Nerve and muscle grain follows a per-vertex `ssbAxis` tangent when present (`kit.tubeGeometry` writes it).
  - Colours come from `css/ssb.css`: one `--ssb-*` token per tissue kind and per cell category, read at boot and on every `html[data-theme]` change. A missing token draws mid-grey; there is no second palette in JS. The anatomical convention (artery red, vein blue, nerve yellow, bone ivory) is the meaning, which satisfies the site's colour rule. Air cells take categorical hues by identity.
  - One compiled program per (kind, hazard, quality). The cache key is set explicitly, so any number of parts share one compile; a selection adds materials, not programs.
  - **Quality** `full` or `lite` (fewer octaves, no domain warp, at most two projection planes, a plain-noise stand-in for lobules). Chosen at boot from device hints (a software rasterizer or old mobile GPU, Save-Data, a small-memory or dual-core device, or a phone-sized touch screen means `lite`); the hash key `q` overrides it (exactly `full` or `lite`). A change of `q` recompiles in place.
  - Nothing is animated, so `prefers-reduced-motion` needs no special case in materials.
- **Hazards are never colour alone**: a hatched shader overlay plus text in the HUD. `--signal` marks UI emphasis only.
- The Explore stage follows the site theme. The endoscope and CT stages are dark in both themes (projector stages). CT's views use the `--ssb-ct-*` tokens.
- Labels: DOM overlay with SVG leader lines, few at a time, decluttered by tier and priority; never "label everything".
- Picking: raycast on click, all intersections kept for click-to-go-deeper; no hover picking on touch devices.
- Camera flights respect `prefers-reduced-motion` (cut instead of fly).

### 7.5 Degradation, accessibility, mobile

- No WebGL2 → graph mode: tree, search, panels, procedures as text, and CT mode (CPU-rendered) intact. Feature detection is in `main.js`; the page never throws to a blank screen.
- The structure tree is a real DOM list mirroring the scene: keyboard navigable, selection synced both ways, announced via `aria-live`. Every fact reachable in 3D is reachable in the DOM.
- Phones: bottom-sheet panel, one-finger orbit, pinch zoom. Endoscope mode steps between stations with drag-to-look rather than free flight.

### 7.6 Content text

Escape first, then transform the two allowed inline forms (`[[id]]`, `*em*`). An unresolved `[[id]]` renders as plain text (the validator makes this unreachable in committed content).

## 8. Security and CSP

`ssb.html` uses the self-contained-page policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. Fetches of `ssb/**` are same-origin under `default-src`. The design keeps this true:

- ES modules from same-origin files satisfy `script-src 'self'`. There is no import map (it would be an inline script). three.js ships only unminified module builds: `three.module.js`, which imports `./three.core.js`, both vendored side by side. Every addon imports the bare specifier `'three'`; that one line is rewritten to a relative path at vendoring time. `js/vendor/README.md` records the patch, and `tools/check-data.mjs` pins the patched bytes.
- No WebAssembly (no Draco or meshopt), no `blob:` images (no embedded textures), no workers from blobs.
- Vendoring three.js is a new third-party dependency, approved by the owner (`docs/decisions.md` §7).

## 9. Verification

| What | How | When |
|---|---|---|
| Graph schema, ids, refs, vocabularies, review gate | `tools/ssb-content.mjs` via `tools/check-data.mjs` | CI |
| Geometry ↔ graph | every pack node, sweep and landmark resolves to a graph id; every `geo: specimen` structure has geometry or is listed pending | CI |
| **Spatial claims ↔ geometry** | each spatial `rel` (`medial-to` …) checked against landmark and centroid coordinates; a failure means the prose or the mesh is wrong | CI |
| Measurements ↔ specimen | model value from `from`/`to` landmarks compared with the population range; outliers reported, not failed (n = 1 differs) | report |
| Page boots, renders, zero real console errors | `tools/smoke-pages.mjs` entry for `ssb.html`; headless Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL | CI |
| Behaviour | `tools/test-ssb.mjs`, through the read-only `window.__ssb.lab` hook: each diorama on its lesson's view; parts resolve to graph ids; presets satisfy the graph's criteria; the computed frontal pathway reproduces every IFAC rule under each uncinate attachment; hostile `#lab=` clamped; the material library (every kind compiles and draws at `q=full` and `q=lite`, tokens for both themes, hostile `q` ignored, programs shared) | CI |
| CT mode | `tools/test-ssb.mjs`, through `window.__ssb.ct`, on the synthetic volume of `tools/ssb-fixture-ct.mjs` (routed for `ssb/ct/*` requests, so the suite never depends on the real volume): `volume.js` in Node (affine round trip, exact trilinear, slices agree with `sample` and `labelAt`, radiological orientation, oblique planes, gzip by magic bytes, loader errors); the `#ct=` codec; in the page, three views render, the crosshair is consistent across them, hover gives name and ≈HU, hostile `#ct=` is clamped or ignored, a missing volume shows a message, CT runs with WebGL blocked, phones show one plane | CI |
| Citations | an agent matches every `src.*` against an authoritative record and sets `verified` only on a match. **`verified` means the work exists as cited, not that it supports the claim**; claim support is the reviewer's and owner's job. Match against the PubMed record itself (NCBI E-utilities), never a search snippet; sources PubMed does not index are confirmed by hand. | continuous |
| Medical correctness | adversarial expert-model review, then **the owner** flips `review` to `verified` | continuous |

Test sections (`node tools/test-ssb.mjs --only <section>[,<section>…]`): `dioramas`, `lab`, `ct`, `specimen`, `scope`, `procedure`, `mucosa`, `population`, `flap`, `anatomy`, `scanned`, `kit`, `materials`. CI runs them as `--shard i/4`, split by `SHARDS` in the file; a new section goes in one shard. Browser verification detail: `docs/verification.md`.

## 10. Storage

Namespace `ssb:*`, through one guarded adapter in `js/ssb/state.js`. Keys written are registered in `docs/decisions.md` §3; register any new key when the code that writes it lands.

## 11. Image generation

Generative images are wrong in exactly the way an atlas cannot afford: plausible, confident, anatomically false. So **generated pixels never carry an anatomical claim.** Generators may make tileable surface textures (style only) and, later, illustration plates restyled from our own render; a different model family may audit the draft graph's numbers. The repo holds no API keys, so the owner runs these from the briefs in `docs/ssb-imagegen.md`. Procedural shaders come first (`js/ssb/materials.js`, §7.4); textures are a later refinement, not a dependency.

## 12. Build plan

Phases, waves and work packages are tracked in GitHub issue #266 and its sub-issues (specs: `plans/2026-10-07-ssb-roadmap.md`). Every change ends green on `tools/check-data.mjs` and the relevant suites (`docs/verification.md`). Who does what: `docs/delegation.md`.

## 13. Owner decisions

The decision record (decided and open, one line each) is `plans/2026-10-07-ssb-roadmap.md` §1. The owner's open actions are GitHub issues under #266. Decisions whose rationale is not in the code:

- **Vendor three.js:** same-origin and pinned (`js/vendor/README.md`).
- **Reference specimen from the UW atlas:** the axial stack treated as a CT volume, registered to UW's reformats, scaled from the globe, segmented from the labelled arrow tips; bone window only, with vessels and nerves as sweeps. Written permission: `ssb/LICENSE-data.md`.
- **O4, scope diameter:** the 3 mm and 4 mm checks showed that only the measured nostril, not a provisional fulcrum, gives a collision-free path to the sphenoid ostium.
- **O5, NSF superior incision:** follows the owner's reading over ch. 31's superior-aspect start; the margin below the septal top keeps one default (15) where the incision rises forward (designs B and C).
- **O6, standard specimen:** the first release teaches normal anatomy; the as-scanned head is a variant base (§5.1).
- **O12, SEG1 not now:** it adds a deep-learning stack to the pipeline, and the ethmoid and uncinate, which it cannot see, are the approximate structures.
- **O13, mucosa toggle:** the congested end is physiological (turbinates, from NasalSeg); rhinosinusitis edema is a condition, in the pathology layer.

## 14. Realistic anatomy

The design for anatomy states beyond the standard head. Sources, limits and owner decisions are in `docs/realistic-anatomy.md` (its §4, §5, §13). Work packages and handoff: `plans/2026-10-07-ssb-roadmap.md` §3 and issue #266. Sections are numbered `R…` so they do not collide with §1–§13.

### R1. Goal

The page serves the standardized head (§5.1), which is right for a first release and wrong as an end state: no head is symmetric, and what a sinus surgeon must read on a preoperative CT is exactly the departure from the standard head. **One toggle, four anatomy states, each honest about its truth kind:**

| State (UI label) | What the learner sees | Built from | Truth kind (badge) |
|---|---|---|---|
| `standard` (Symmetric) | the standardized head | §5.1, unchanged | specimen, standardized |
| `scanned` (Normal asymmetry) | a real head as scanned: septal bow, unequal cavities, one-sided cells | UW head A without the standardization; later UW head B | specimen |
| `variant` (Variants) | a base head with one named variant (or a curated set) | the variant on a real head where one exists; else a constrained edit of the base, calibrated on exemplars | specimen, or **composite** |
| `pathology` (Pathology) | a base head with a condition laid over it | condition operators calibrated on exemplars | composite |

**Non-goals.** No patient data. No statistical shape model sold as a real head. No disease the bone-window specimen cannot show honestly without a synthetic soft-tissue channel (R9.3). No new external runtime dependency: offline pipeline → committed data → static page.

**End state.** A CT and 3D head in which "show me a right concha bullosa", "this patient's left Haller cell narrowing the infundibulum", or "a frontal mucocele pushing the globe down" are one click each, with the graph's text, prevalence (with its denominator), the exemplar it was calibrated on, and the stations where it changes the operation.

### R2. The four states: semantics

#### R2.1 Layers, not modes

The states are **layers over a base**, not exclusive modes:

```
anatomy = { base: standard | scanned[-b] | <exemplar head>,
            variants: [ {id, side, preset} … ],      // applied in order
            conditions: [ {id, side, preset} … ] }   // applied after variants
```

- *Symmetric* = `{base: standard}`; *Normal asymmetry* = `{base: scanned}`.
- *Variants* and *Pathology* apply to the current base. **Default base for both: `scanned`** (RA-O3): they should look like a real patient's CT. A switch moves the same variant onto `standard`, where the contralateral side becomes a clean normal control; useful for isolating one change, not the default.
- One variant per side per region in v1. Curated **scenarios** (named sets, e.g. "typical preoperative CT") are precomputed combinations (R6.3).
- Pathology composes over variants because disease follows anatomy (a Haller cell narrows the infundibulum; an infundibular pattern then opacifies the maxillary sinus behind it). The pipeline proves each allowed combination (R6.3).

#### R2.2 Truth kinds

§1 principle 2 lists four truth kinds. **composite** is *a real specimen with a declared edit*. Its badge names the edit, its parameters and the exemplars it was calibrated on, e.g. "Specimen, edited: right concha bullosa (bulbous, 11 mm), calibrated on UW Maxillary-Normal fig. 6; schematic". Picking an edited voxel or mesh reports that it is edited.

#### R2.3 What each state changes across the page

| Consumer | standard | scanned | variant / pathology |
|---|---|---|---|
| CT volume, labels | unchanged | own volume | base + patches (R6.2) |
| Specimen packs | unchanged | own packs | base packs with node overrides |
| Distance fields (scope HUD) | unchanged | own | patched where the edit changes them (dehiscence, Onodi) |
| Landmarks, sweeps, charts | unchanged | own, per side (no mirror) | patch overrides by key |
| Endoscope stations (E5, E6) | posed | re-validated; invalid poses say so | re-validated per patch |
| Flap overlay (§5.7), septal charts | unchanged | recomputed per side | septal deviation recomputes the chart |
| Variant lab | unchanged | unchanged | a lab diorama can link to "see it on the specimen" |
| Graph panels | unchanged | + asymmetry measurements | + the entity's panel, prevalence, exemplar list |

### R6. Architecture

#### R6.1 The anatomy registry

The owner asked for something internal that tracks where everything is, and overlays it. Three files and one viewer overlay, all in the §4 frame:

- **`ssb/anatomy/sources.json`**: every source item, a base volume (head A, head B, a graded Radiopaedia volume) or a 2D figure (UW page image, Radiopaedia key image). Per item: id (`uw-fig:Cor.pneumMT`, `uw-head:A`, `rp:<rID>`), licence and attribution key, modality, plane, window, contrast, grade (A/B/C), same-patient group, and its **pose**: for a volume, a similarity plus TPS transform to head A's frame; for a figure, a plane `{origin, u, v, mmPerPx}` with a fit residual and an identifiability margin.
- **`ssb/anatomy/observations.json`**: every extracted fact as an observation, `{id, source, kind: point|contour|measure, of: <graph id>, side, raw, ras, sigmaMm, method}`. Numbers only, no pixels.
- **`ssb/anatomy/population.json`**: per graph id or measurement, the aggregated observations across heads (n, per-side values, paired L−R differences), beside the graph's literature values. The asymmetry panel and preset ranges read it.
- **RA landmark set**: the landmarks every pose and TPS uses, visible in at least two planes and present in the graph: ANS, crista galli apex, sella floor centre, dorsum sellae tip, choanal arch, frontal and sphenoid ostia, middle turbinate heads, foramen rotundum (anterior), infraorbital and greater palatine foramina, optic canal openings, globe centres. Missing ones are added to the graph as `lm.*` and to `landmarks.json` (RS6).

**Overlay viewer.** CT mode gains an *Exemplars* layer: observations within ±3 mm of the current slice plane are drawn as markers (colour by source, shape by kind) on head A, and the exemplar figures whose pose lies near the slice are listed beside it. Disagreement between an observation and head A's labels is the QA signal for resegmentation. The UW permission covers showing the figures (RA-O1); they are shown side by side, served from this origin, with the credit line.

#### R6.2 Data layout and the patch format

```
ssb/anatomy/
  index.json                       registry of states: bases, variants, conditions, scenarios, compat
  sources.json  observations.json  population.json
  scanned/                         a full base: ct/, geometry/, models/ in the ssb/ layout
  scanned-b/                       head B, later
  patches/<base>/<entity>.<side>.<preset>.ssbp.gz
  overrides/<base>/<entity>.<side>.<preset>.glb.gz
ssb/exemplars/rp-<rID>/            Radiopaedia-derived data (+ images where needed) + LICENSE.md (CC BY-NC-SA 3.0)
```

`ssb/ct`, `ssb/geometry`, `ssb/models` stay the `standard` base. `labels.json` stays the one append-only table for every base and patch: a variant's new air space is labelled with its graph id (e.g. `v.infraorbital-ethmoid-cell.R`).

**Patch (`.ssbp.gz`)**: gzip of a length-prefixed JSON header, then raw arrays:

```
{ "version": 1, "base": "standard", "entity": "v.concha-bullosa", "side": "R",
  "preset": "typical", "params": {…}, "truth": "composite",
  "calibratedOn": ["uw-fig:Cor.pneumMT", "rp:<rID>"], "assumed": ["AP extent"],
  "boxes": [ { "ijk0": [i,j,k], "dims": [ni,nj,nk],
               "ct": "u8", "labels": "u16", "sdf": { "<id>": "u8" } } ],
  "landmarks": { "<key>": [r,a,s] }, "sweeps": { "<key>": {…} },
  "replacesNodes": ["s.middle-turbinate.R", "s.nasal-cavity.R"],
  "addsNodes": ["v.concha-bullosa.R"] }
```

Dense boxes, not sparse lists: simple to apply and test, and a variant's box is small (a concha bullosa box is about 60k voxels at 0.5 mm). `volume.js` `applyPatch` uses the same header validation as `ct.json`. Override packs replace whole nodes named in `replacesNodes` (no mesh stitching); the specimen stage hides the base nodes of those names while the patch is active.

#### R6.3 Composition and the compatibility table

Patches apply in order: variants, then conditions. Two patches are compatible when their boxes do not overlap, or when the pipeline has built and tested their combination. `index.json` carries `compat` (pairs built and tested) and `scenarios` (named precomputed combinations, each with its own override nodes, so no runtime remeshing of combined edits). In v1: one variant per side per region, plus one condition.

#### R6.4 State, URL, UI

- **State**: `state.anatomy = {base, variants, conditions}` in the one store, orthogonal to the stage. Changing it reloads volume and packs through the lazy loaders and re-validates the scope pose (a pose that becomes blocked is clamped, and the HUD says why).
- **URL**: §7.3 (`anat=`, `v=`, `dz=`).
- **UI**: a four-pill *Anatomy* group beside *Stage*. Variants and Pathology open a picker grouped by region, filtered by depth tier, each entry showing side, presets, prevalence and exemplar count. The truth badge and provenance note follow the state, including the UW credit line.

#### R6.5 Edit operators (pipeline)

One Python module, `tools/ssb-pipeline/anatomy/ops.py` (planned). Each operator is a pure function `(ct, labels, landmarks, params) → patch` with stated invariants, mirroring the diorama contract (`PARAMS` with ranges and `from` graph ids, `PRESETS`):

| Operator | Does | Used for |
|---|---|---|
| `pneumatize` | turns a bony or soft region into air, keeping a cortical shell of given thickness | concha bullosa, crista galli, ACP, pterygoid, uncinate pneumatization, lateral recess extension |
| `grow_cell` | inserts an air cell (superellipsoid, oriented on landmarks) with a 0.5–1 mm wall, repartitioning the ethmoid air it displaces | Haller, Onodi, IFAC cells, bulla hyperpneumatization, agger size |
| `deflate` | shrinks a sinus with wall thickening or retraction, by type | maxillary hypoplasia, frontal hypoplasia or aplasia, conchal sphenoid, silent sinus |
| `deform` | smooth displacement field in a box (bone, air and labels move together) | septal deviation (Mladina types), spur, paradoxical MT, Keros depth, roof asymmetry, mucocele expansion, globe displacement |
| `plate` | inserts or removes a thin bony plate | maxillary septa, sphenoid septum on the ICA, bullar lamella deficiency |
| `dehisce` | removes bone over a structure for a given arc and length | lamina papyracea, ICA, optic canal, AEA canal |
| `reroute` | moves a sweep and builds its bony support (canal or mesentery) | AEA in a mesentery, suspended infraorbital canal |
| `fill` | fills air with tissue of a target HU: shell (thickening), level (fluid, with gravity), dome (cyst), lobules (polyps), core with calcifications (fungal ball), expansile (mucocele, AFRS) | inflammatory conditions (R9) |
| `bone_mass` | adds lobulated bone or ground-glass density | osteoma, fibrous dysplasia, focal hyperostosis |
| `erode` | removes bone and extends tissue beyond the wall | aggressive sinusitis, AIFS, malignancy (later) |

**Texture realism.** Edited voxels must look like CT, not painted labels: bone and soft-tissue display values sampled from head A's own voxels of the same tissue and thickness; partial-volume blur from the point-spread width measured on head A's sharpest air–bone edges; noise matched to head A's σ per tissue. HU targets go through the inverse of `ct.json` `toHU` (about 15.7 HU per display level; soft tissue is only a few levels wide in this window, which is why R9.3 waits for a synthetic channel).

#### R6.6 Budgets

Per state, the §5.4 budgets hold. Patches and override packs: target ≤ 250 kB each, ≤ 8 MB for the catalogue. A second full base adds about the size of today's `ssb/ct` and `ssb/models` and loads only when chosen. Bases and patches are re-exported at checkpoints, not per work package, because git history grows with every re-export.

### R7. Resegmentation of head A

Every edit and state is only as good as head A's labels. The current ones suffice for a normal atlas but not for grafting a Haller cell (no uncinate, no infundibulum) or classifying frontal cells (no individual cells). This is the critical path.

#### R7.1 Ground truth and metrics

- **Held-out split.** The head-A arrow tips (`slices.json`, axial and sagittal) are split once, stratified by structure and slice region, fixed seed, into **seed (70 %)** and **held-out (30 %)**; the split list is committed (`ssb/reference/uw-sinusanatomy2/split.json`). Segmentation reads only seeds; the score reads only held-out tips.
- **Identity metric**: held-out tip hit rate per structure. The tip's voxel (± 1 voxel) carries the crosswalked id. Target ≥ 95 % overall, ≥ 90 % for every structure with ≥ 10 held-out tips; report Wilson 95 % CIs, since small-n structures can reach 100 % by chance.
- **Coverage**: every id in RS's declared label set (`tools/ssb-pipeline/uw/rs/declared.json`) has a label. The headline mixes coverage with accuracy, so the two are scored separately: coverage, and identity over the structures that are labelled. The identity targets apply over the declared set. Tips on ids outside it are reported, never gated.
- **Boundary metric.** Tips say nothing about walls between compartments. On review slices (every 5 mm per plane through the ethmoid–frontal region), label outlines are drawn over the UW labeled frame for that slice (alignment is exact by construction). Each partition wall is marked correct, misplaced (> 1 mm) or missing; target ≥ 90 % correct.
- **Topology checks** (automatic): every air label is one component; each sinus and cell reaches its meatus through its ostium (shortest air path, as the frontal-recess diorama computes); no air label crosses the orbit or anterior cranial fossa; bone units are thicker than 0 and within stated limits.
- **Graph consistency**: `relate3d.py` contradictions do not increase; the IFAC drainage rules pinned for the diorama are rerun on the specimen's own cells and must hold.
- **Identity gate tolerance.** The ±1 voxel gate is tighter than the ground truth: the axial and sagittal tips of one structure can disagree by several mm. Read it alongside `--tol 6`. A candidate that loses ground at `--tol 6` has lost a structure; one that moves only at `--tol 1` has moved within the tips' noise. The boundary review and topology checks decide whether a segmentation is better; the tip metric mostly guards coverage. `python3 -I tools/ssb-pipeline/uw/score.py` prints the numbers; they are not copied here.

#### R7.2 Method

1. **Native grid.** Segment on the native 0.3437 × 0.3437 × 0.625 mm volume, and export to the served 0.5 mm grid last, so thin lamellae are found before resampling blurs them.
2. **Lamellae as sheets.** A multiscale Hessian sheetness filter on bone finds thin septa. Each sheet is identified by attachment rules and seeds: uncinate (lateral wall or agger anteriorly, free posterior edge at the hiatus), bullar lamella, basal lamella (lamina papyracea laterally, skull base superiorly, middle turbinate medially; it replaces the proxy plane under the same id), ground lamella of the superior turbinate. Review references: `Axial.ethmoid2`, `Cor.basallamella`, `Sag.basallamella2`.
3. **Ethmoid cells as instances.** Inside ethmoid air: distance-to-bone, h-maxima markers, watershed constrained by the detected sheets. Each cell gets centroid, volume, neighbours and drainage (which meatus its air reaches). Classification is by rule (agger nasi, bulla, supra agger, supra agger frontal, suprabullar, suprabullar frontal, supraorbital ethmoid, frontal septal, infraorbital ethmoid, sphenoethmoidal), with **one rule set shared** with the frontal-recess diorama (criteria as data). A cell no rule claims stays a generic anterior or posterior ethmoid cell.
4. **Openings and channels as air sub-labels**: frontal ostium, maxillary natural ostium, sphenoid ostium, infundibulum, hiatus semilunaris, middle, superior and inferior meatus, sphenoethmoidal recess, olfactory cleft. Each is `partOf` its parent. Every consumer that tests for `s.nasal-cavity` (collision, lining, floor chart) switches to "the id or anything `partOf` it" in the same change.
5. **Canals as labels**: optic, vidian, foramen rotundum, carotid canal and prominence, anterior and posterior ethmoidal canals, infraorbital canal, nasolacrimal canal, sphenopalatine foramen, from the lumen detector in `sweeps.py`. Sweeps then follow the detected centrelines where detected.
6. **Bone units added**: superior turbinate, crista galli, anterior clinoid, pterygoid process, uncinate (as a removable unit).
7. **Then rebuild both bases**: `normalize.py all` for `standard`; the same stages without mirroring for `scanned`. Stage-D steps that assume symmetry compute each side for `scanned`.

### R8. Variants catalogue

#### R8.1 Batch 1 (high-yield preoperative CT review; UW exemplars exist)

| Variant | Operator | Parameters (ranges `from`) | Exemplars | Acceptance rule (pinned in tests) |
|---|---|---|---|---|
| `v.concha-bullosa` (lamellar / bulbous / extensive, `c.middle-turbinate-pneumatization`) | `pneumatize` MT | type, AP extent, width ratio | UW `Axial.PneumMT`, `Cor.pneumMT` | the cell's air is enclosed by MT bone; middle meatus width at the infundibulum's level decreases monotonically with width |
| `v.paradoxical-middle-turbinate` | `deform` MT | curvature | UW `Paradox.MT.curve` | MT convexity faces lateral; meatus width reported |
| `v.septal-deviation`, `v.septal-spur` (`c.mladina-septal` types) | `deform` septum (N1 centring, inverted and parameterized) | type, apex A/S, amplitude | UW `Cor.SeptDeviatnSpur` | septum keeps its thickness; the convex side's airway narrows; septal chart recomputed; scope collision blocks where it should |
| `v.infraorbital-ethmoid-cell` | `grow_cell` on the medial orbital floor | size ratio, AP position | UW `Axial/Cor/Sag.hallercell` | the cell lies below the orbit, lateral to the infundibulum; the infundibulum's minimum cross-section decreases with size |
| `v.uncinate-insertion-*` (`c.uncinate-superior-attachment` 1/5/6) | re-attach the uncinate's superior end (needs RS uncinate) | attachment | UW `Cor.VariantFSDP1/2` | the frontal drainage pathway reaches the infundibulum (5, 6) or the middle meatus (1), the diorama's rule on the specimen |
| `v.maxillary-sinus-septa` | `plate` | position, height | UW `Cor.Maxseptum` | a plate divides but does not seal the sinus unless asked |
| `v.maxillary-sinus-hypoplasia` (`c.maxillary-sinus-hypoplasia`) | `deflate` | type, volume ratio | UW `Axial.Maxhypo`, `Cor.OMU4` | orbital floor lowers, uncinate lateralizes by type |
| `v.frontal-sinus-aplasia`, frontal hypoplasia (new) | `deflate` | volume ratio | UW `Axial.FShypo` | the recess persists; ostium position |
| `v.crista-galli-pneumatization` | `pneumatize` | extent, connection to the recess | UW `Cor.pneumCG` | — |
| `v.sphenoethmoidal-cell` (Onodi) | `grow_cell` superolateral to the sphenoid, to the optic canal | extent, optic contact | UW `Axial.BilatOnodicells1`, `Cor.Onodicell3` | optic canal bulges into the cell; optic SDF patched; `h.optic-nerve-injury-onodi` hatched |
| `v.pneumatized-anterior-clinoid` | `pneumatize` ACP | extent | UW `Cor.Onodicell3` | lateral OCR deepens (the sphenoid diorama's measure, on the specimen) |
| `v.lateral-recess-pneumatization`, pterygoid (new) | `pneumatize` greater wing or pterygoid | extent | UW `Axial/Cor.Pneumsphenoid1`, `axial.pneum.ptyp` | V2 and vidian protrude when present |
| bulla hyperpneumatization (new) | `grow_cell` (enlarge) | size ratio | UW `Cor.ethmoidbulla3`, `Cor.PneumFS` | hiatus narrows |

#### R8.2 Batch 2 (Radiopaedia exemplars needed)

`v.keros-type-3`, `v.asymmetric-ethmoid-roof`, `v.gera-class-3` (`deform` skull base; the ethmoid-roof diorama's rules on the specimen); `v.aea-in-mesentery`, `v.anterior-ethmoidal-canal-dehiscence` (`reroute`, `dehisce`); `v.lamina-papyracea-dehiscence`, `v.ica-dehiscence`, `v.optic-canal-dehiscence`, `v.ica-protrusion`, `v.optic-canal-protrusion`, `v.intersinus-septum-on-ica` (`dehisce`, `deform`, `plate`; scope HUD distances must fall where bone is removed); the IFAC cells (`v.supra-agger-cell` … `v.frontal-septal-cell`; `grow_cell`; the computed frontal pathway rerun on the specimen must reproduce the diorama's push rules); `v.accessory-maxillary-ostium`; `v.pneumatized-uncinate`; `v.conchal-sphenoid`, `v.presellar-sphenoid`, `v.postsellar-sphenoid` (the sphenoid diorama's exposure measures on the specimen); `v.v2-protrusion-sphenoid`, `v.vidian-canal-protrusion`.

#### R8.3 Graph additions this plan needs

New variants: frontal sinus hypoplasia; extensive frontal pneumatization (or a measurement on `s.frontal-sinus`, owner decision); ethmoid bulla hyperpneumatization; pterygoid process pneumatization. New finding: septal perforation or absent septum. New landmarks for the RA set: globe centres, optic canal openings where missing, greater palatine foramina, PNS. Every new prevalence carries its denominator.

### R9. Pathology catalogue

#### R9.1 Batch 1: inflammatory patterns (bone-window CT is the clinical study)

Sinus CT for inflammatory disease is a non-contrast bone-algorithm scan, the same modality as the specimen, so these are representable honestly:

| Condition / preset | Operator | Parameters | Exemplars |
|---|---|---|---|
| mucosal thickening by sinus, scored by `c.lund-mackay` (0 / partial / total per sinus; OMC 0/2) | `fill` shell, inward along the air boundary | thickness per sinus, score preset | UW `Axial.Maxillarysinus`, `Cor.OMU5`, `Cor.Inflamm2` |
| `c.sinonasal-inflammatory-patterns`: infundibular, OMU, SER, sporadic (sinonasal polyposis in 9.2) | presets of the above, driven by drainage topology (RS openings) | pattern, side | UW `Cor.frontalinflamm2/3`, `Cor.OMU4`, `Sag.anteriorOMU`, `Sag.FSDP`, `Sag.ethmoidinflamm3`, `Sphenoidsinus1–3` |
| `dz.acute-rhinosinusitis`: air–fluid level, bubbly or foamy secretions | `fill` level with gravity (supine default), bubble option | fill fraction, scan position | UW `Axial.acutesinus1/2`, `Cor.foamysinus` |
| `dz.mucus-retention-cyst` | `fill` dome on a wall | base point, radius | UW `axial.MRCfrontal2`, `Cor.MRCfrontal1`, `Cor.MRCmax1`, `Sag.MRCmax3` |
| polyp in the maxillary sinus (CT mimic of MRC) | `fill` lobule | size | UW `Cor.Maxpolyp` |

Rule (pinned): a pattern's opacification follows drainage. An infundibular preset opacifies the maxillary sinus and spares the frontal; OMU adds the frontal and anterior ethmoid; SER the posterior ethmoid and sphenoid. The rule is checked against the specimen's own drainage graph, so a variant that changes drainage (a Haller cell, an uncinate to the skull base) changes what a pattern opacifies.

#### R9.2 Batch 2: lesions with bone signatures

`dz.mucocele` (frontal with orbital extension and globe displacement; ethmoid; sphenoid into the posterior ethmoid: `fill` expansile plus `deform` walls and orbit); `dz.osteoma` (`bone_mass`); `dz.antrochoanal-polyp` (`fill` the sinus plus a stalk through the ostium to the choana); `dz.fungal-ball` (hyperdense core, punctate calcification, sclerotic wall); `dz.afrs` (expansile, double density, thinned bone); `dz.crs-with-polyps` / sinonasal polyposis; `dz.silent-sinus-syndrome` (with `v.maxillary-sinus-atelectasis`); `dz.inverted-papilloma` (focal hyperostosis at the attachment, the surgical teaching point); `dz.fibrous-dysplasia`; `dz.jna` (PPF widening, SPF erosion). Exemplars from Radiopaedia.

#### R9.3 Batch 3: soft-tissue and contrast findings (needs a synthetic channel)

Orbital and intracranial complications (`dz.orbital-cellulitis`, `dz.subperiosteal-orbital-abscess`, `dz.cavernous-sinus-thrombosis`, `dz.epidural-abscess`), aggressive sinusitis and AIFS beyond the bone (retroantral fat), and malignancy. The specimen is an 8-bit bone-window display with no contrast, so these need a **synthetic soft-tissue channel**: a second volume generated from labels (tissue class → HU distribution, enhancement as a parameter), shown in a soft-tissue or contrast window and badged schematic. It is its own design and starts only after batches 1–2 work.

### R12. Review plan

#### R12.1 Automatic (every PR)

`node tools/check-data.mjs` (graph ids in every label table and patch; licence ledger: every file under `ssb/anatomy/` and `ssb/exemplars/` maps to a licence entry; the e-mail guard) · `node tools/smoke-pages.mjs` · `node tools/test-ssb.mjs` with sections `--only anatomy`, `--only variants`, `--only pathology` · pipeline self-tests (`ops.py --selftest`, `score.py`). Thresholds are set in the work package that introduces them and change only at a checkpoint, with the reason written down.

#### R12.2 Checkpoint checklist (Opus, each checkpoint)

1. **Provenance.** Each new file traces to a source in `sources.json` with licence, attribution and (for UW) no individual names.
2. **Circularity.** Seeds and held-out tips disjoint; no variant validated only on its calibration exemplar.
3. **Spectrum.** Presets labelled mild, typical or marked, with the anchor of each; no exemplar size presented as typical.
4. **Assumed vs. measured.** Every patch header's `assumed` list is honest; spot-check three against the exemplar.
5. **Anatomy.** Every new state in all three CT planes and in 3D, at tiers 1 and 3; laterality on screen (radiological convention) and in the scope.
6. **Drainage.** The pathways and the pattern rule agree with the anatomy after every edit.
7. **Proximity.** Where bone was removed or a cell added near the ICA, optic nerve, orbit, skull base or AEA, the HUD distances changed as they must.
8. **Budgets and determinism.** Sizes within R6.6; a rerun reproduces byte-identical outputs.
9. **Board.** Work-package status updated in the roadmap in the same change.

#### R12.3 Owner review (medical correctness)

Only the owner sets `verified` (`docs/decisions.md` §7). Queue, in order: `scanned` (does the head look like a real CT; is the nasal-cycle note right); resegmentation sheets (uncinate, basal lamella, frontal cells); variants batch 1; inflammatory patterns; batch 2. Each item gives the state's URL, the exemplar list, the measured parameters and the specific question (e.g. "is a *typical* concha bullosa this large?").

#### R12.4 Adversarial tests worth writing

A Haller cell grafted onto `scanned` (where the left infundibulum is already narrow) must not seal the maxillary ostium unless the preset says so. An Onodi cell must not enter the optic canal. An OMU pattern over `v.uncinate-insertion-skull-base` must include the frontal sinus (drainage through the infundibulum); over `…-lamina-papyracea` it may spare it. A mucocele's globe displacement must not intersect the orbital walls. An air–fluid level in a supine scan must lie in a coronal plane. A scenario's URL with one id removed from `index.json` must drop cleanly.

### R14. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Resegmentation stalls on thin lamellae at this resolution | no uncinate → batch 1 blocked | sheetness on the native grid; boundary review; the owner's 3D Slicer hand-correction fallback |
| Edits look painted | learners learn the artefact | texture from head A, PSF and noise matched, blinded crop test |
| Exemplars mislead about size | florid = "typical" | mild/typical/marked presets, population anchors (`docs/realistic-anatomy.md` §5) |
| Radiopaedia access or licence friction | batch 2 thin | small owner-curated list; numbers only; UW and head B cover batch 1 |
| Repo growth from bases | slow clones | re-export at checkpoints; patches small; a third base only with an owner decision |
| Two bases double every downstream test | CI time | tests parameterized by base; the slow ones run on `standard` in CI and on all bases at checkpoints |
| Merge churn with lane B | rework | resegmentation scheduled after ST5 or folded into its checkpoint (`plans/2026-10-07-ssb-roadmap.md` §3) |
