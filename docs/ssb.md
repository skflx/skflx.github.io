# SSB — Sinus & Skull Base 3D: architecture and conventions

**Status: phase 1 (2026-09).** `ssb.html` runs graph mode — tree, search,
depth filter, info panels, deep links — over the draft knowledge graph
(`ssb/content/`, schema `docs/authoring-ssb.md`, validator
`tools/ssb-content.mjs`), with a placeholder 3D stage on vendored three.js.
The reference specimen is being reconstructed from the UW atlas (§13).
Build order and owner decisions: §12–§13.

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
  depth reads as it does in the OR. The shaft cannot pass through tissue
  (sampled against the label volume, §5.6). A proximity HUD gives the
  distance in mm from the tip to each critical structure (ICA, optic nerve,
  skull base, orbit, AEA) from precomputed distance fields. This mode is
  where the fulcrum constraint teaches why the frontal recess needs a 45–70°
  scope and why posterior septectomy opens binostril work.
- **CT.** Axial/coronal/sagittal plus an oblique slice down the scope axis,
  crosshair synced to the 3D cursor or scope tip (navigation-style).
  Label overlay outlines segmented structures; hover names the voxel's
  structure. Bone and soft-tissue windows. Built for the Wormald
  building-block exercise: scroll the three planes, identify each frontal
  recess cell, and toggle its 3D block to check.
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
Materials are assigned at runtime from CSS tokens by `kind` (theming works;
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

## 6. Dioramas

A diorama is an ES module `js/ssb/dioramas/<name>.js` exporting
`build(params) → THREE.Group` and `PRESETS` keyed by classification code.
Parts are named with graph ids, so picking, panels, hazards and self-test
work exactly as on the specimen. Geometry primitives: superellipsoid air
cells (Wormald's building blocks, literally), lofted/bent sheets for lamellae,
profile extrusions for the skull base. A diorama may be placed in context by
a similarity transform onto specimen landmarks, but defaults to standalone
with a *schematic* badge.

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
laterally — the geometry derives the rule rather than illustrating it.

## 7. Runtime architecture

### 7.1 Files

```
ssb.html                     shell: CSP, chrome, canvas, panels (no inline script)
css/ssb.css                  --ssb-* tokens (tissue kinds, cell categories, stage) + layout
js/ssb/main.js               entry (type="module"): feature detection, boot, error surface
js/ssb/stamps.js             GENERATED: data-asset path → hash (for fetch URLs)
js/ssb/graph.js              load + index content; text renderer; search
js/ssb/state.js              one store (mode, tier, layers, selection, camera, step);
                             URL-hash codec; ssb:* storage (guarded)
js/ssb/scene.js              renderer, cameras, lights, on-demand loop, token materials
js/ssb/geo-specimen.js       pack loading (gzip → GLTFLoader.parse), unit registry, dissection states
js/ssb/geo-sweep.js          tubes and flow particles
js/ssb/volume.js             CT/label/distance arrays: slicing, lookup, proximity
js/ssb/dioramas/*.js         parametric models
js/ssb/mode-*.js             explore, endoscope, ct, procedure, lab, quiz
js/ssb/ui-*.js               panel, labels, tree/search, HUD
js/vendor/three-<version>/   three.js module build + the addons used (§8)
ssb/content/*.json           the knowledge graph
ssb/geometry/*.json          labels, landmarks, sweeps, station poses
ssb/models/, ssb/ct/         pipeline outputs
tools/ssb-content.mjs        graph validator (CI)
tools/ssb-pipeline/          offline geometry/CT pipeline
```

Dependency direction is one-way and acyclic: `main → mode-* → {scene,
geo-*, volume, ui-*} → {graph, state} → stamps`. Only `scene`, `geo-*` and
dioramas import three.js.

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
`#lab=ethmoid-roof&c.keros=III`, `#ct=cor&at=12.5,31,48`. Parsing is
whitelist-only: ids must exist in the graph index, numbers are parsed and
clamped, unknown keys are ignored, and nothing from the URL reaches markup
except through `textContent` (`docs/security.md` rule 4).

### 7.4 Rendering

- Materials from tokens: `css/ssb.css` declares one token per tissue kind and
  per cell category; `scene.js` reads computed values at boot and on
  `html[data-theme]` change. Anatomical color convention (artery red, vein
  blue, nerve yellow, bone ivory, dura grey) *is* the meaning, so it
  satisfies the site's color rule; air cells take categorical hues by
  identity (allowed — categorical colors that encode identity).
- **Hazards are never color alone:** hatched shader overlay + text in the
  HUD. `--signal` marks UI emphasis only.
- Explore stage follows the site theme; the endoscope and CT stages are
  dark in both themes (like Airway's stage).
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
| Behavior | `tools/test-ssb.mjs`: deep link → state; pick at a golden view returns the expected id; tier filter; endoscope shaft blocked by tissue; CT label lookup; storage failure is a no-op | phases 1–7, CI |
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
`docs/ssb-imagegen.md`. Procedural shaders come first; textures are a phase-8
refinement, not a dependency.

## 12. Build plan

Each phase ends green on `tools/check-data.mjs` and the smoke suite, and
leaves the page useful. Model tier = who does the work best per token.

| Phase | Deliverable | Who |
|---|---|---|
| 0 | Architecture, schema, validator, draft graph, image briefs *(this change)* | Opus authors per region; Sonnet research and citation checks; Opus adversarial review |
| 1 | Walking skeleton: vendored three.js, `ssb.html`, module stamping, graph mode (tree, search, panels, procedures as text), smoke entry | Sonnet |
| 2 | Dioramas `ethmoid-roof`, `frontal-recess`, `sphenoid`; variant lab; picking → panels | Opus (parametric anatomy), Sonnet (wiring) |
| 3 | Reference specimen: dataset chosen, segmented, pipeline, packs, geometry ↔ graph checks | Owner (dataset, segmentation); Sonnet (pipeline) |
| 4 | Endoscope mode: fulcrum optics, collision, proximity HUD, stations | Opus (optics/constraints), Sonnet (UI) |
| 5 | CT mode: triplanar + oblique, label overlay, crosshair sync | Sonnet |
| 6 | Procedure mode: `removes` states, hazards in scene, station poses | Opus (content), Sonnet (wiring) |
| 7 | Self-test from the graph, Leitner storage | Sonnet |
| 8 | Textures (owner via `docs/ssb-imagegen.md`), offline caching, performance | Haiku/Sonnet |
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

Still open:

1. **Keep the CSP strict** (recommended: gzip, then Draco's JS decoder if
   needed). `'wasm-unsafe-eval'` for meshopt only if both fail the budgets.
2. **Publish while `draft`?** Recommended: publish with visible unverified
   markers (the wiki's precedent), prioritizing owner review of tier 1.
3. Name and URL (`SSB`, `ssb.html`) — working title.
