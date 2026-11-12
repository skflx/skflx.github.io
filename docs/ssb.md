# SSB — Sinus & Skull Base 3D: architecture and conventions

Status and work packages: GitHub issue #266 and its sub-issues. Specs and the decision record: `plans/2026-10-07-ssb-roadmap.md`. This file is the design of what is shipped. Data shape and editorial rules: `docs/authoring-ssb.md`. Image briefs: `docs/ssb-imagegen.md`.

`ssb.html` has two stages over one knowledge graph (`ssb/content/`, validated by `tools/ssb-content.mjs`): the **Specimen** (pick, tree and search identify structures on the reference specimen) and **Scope** (a rigid endoscope through the same specimen, for traversal). Phase 2 deleted everything else: the flap overlay, the mucosal and anatomy states, the population data, the dissection states and the variant lab.

## 0. What it is

A 3D model of the paranasal sinuses, nasal cavity, orbit, anterior and ventral skull base, sellar and parasellar region and pterygopalatine fossa, built to teach what a surgeon must see, know and think at each point of an operation. Tier (1 junior, 2 senior, 3 fellow) decides how much of the graph is on screen.

Not a navigation system and not a surgical simulator. Not a clinical reference while its content is `draft`. No patient data, ever.

## 1. Principles

1. **One graph, many views.** Every fact is a typed node with edges and sources. The scene and the panels render the graph; geometry is keyed by the same ids.
2. **Label the kind of truth.** The specimen is one real adult anatomy, CT-derived (n = 1), standardized (§5.1). Every view says so.
3. **Surgical granularity.** Meshes are cut into the smallest unit a surgeon identifies (uncinate, bullar lamella, each frontal recess cell, sphenoid rostrum). A whole "ethmoid bone" mesh does not exist; it is a parent id in the graph.
4. **Cognition is content.** Hazards, operating principles, preop CT checks and procedure steps are data. They are not rendered in the 3D view in phase 2.
5. **CT is the native language.** Every 3D position is one keystroke from the CT slices through it, and every CT voxel knows which structure it belongs to.
6. **Recall before reveal.** Panels can open as prompts with the answer collapsed.
7. **The repo's rules do not bend.** No build step, same-origin everything, `script-src 'self'`, stamped assets, guarded storage, escaped text.

## 2. Scope

| Region | Content |
|---|---|
| Nasal cavity, septum, turbinates, lateral wall, ostiomeatal unit, maxillary, anterior and posterior ethmoid, frontal sinus and recess, sphenoid, orbit's medial wall, skull base as a boundary | the structures and their landmarks, the structures a surgeon must not injure (orbit, skull base, AEA, optic nerve, ICA) |
| Sphenoid, sellar and clival, nasopharynx, pterygopalatine and infratemporal fossae | the same, from the sphenoid-sellar and nasal-maxillary-PPF content files |
| External nose | the skin and vestibule of the specimen, with its valve landmark |

Content lives in `ssb/content/*.json`: structures, landmarks, variants, classifications, measurements, hazards, principles, procedures, stations, pathways, conditions and sources. The tree shows every collection (region groups for structures, flat groups for the rest). Conditions (`dz.*`) are the pathology layer: their links appear in structure text; they are not drawn on the specimen.

## 3. Stages

Both stages share one scene, one selection and one URL state; switching stage never reloads.

- **Specimen.** Orbit, pan and zoom. Layer toggles by tissue kind and region; section planes with solid caps register a cut to the CT slice. X-ray draws the bone envelope as fresnel ghosts. Click picks (the order is §6.4); clicking the same pixel again steps deeper through what is under the cursor. The camera is in the URL (`cam`, §6.3). The mucosa layer draws the air spaces as their lining, and from inside the lining pack (open openings) replaces the shells. Landmark markers and labels are a layer. Vessels and nerves are not drawn in the Specimen.
- **Scope.** First-person through a rigid scope that **pivots at the nostril**. Pose = insertion depth, shaft yaw and pitch about the nostril fulcrum, roll, and lens angle (0/30/45/70°). The horizon stays upright. Lighting is a spotlight at the tip with inverse-square falloff and an automatic exposure.
  - Collision: the shaft is sampled against the CT display volume (§5.5). Bone blocks; a blocked pose is clamped to the last free depth, and while the clamp holds the stage says why in one line (`.ssb-scope-block`). Mucosa does not block; the shaft length in mucosa is reported as mucosal contact. At the midline the shaft is clamped at R = 0, except in the nasopharynx.
  - The fulcrum `lm.naris` is the centroid of the vestibule lumen at the alar-rim band.
  - A proximity HUD gives the distance from the tip to each critical structure (ICA, optic nerve, skull base, orbit, AEA) from precomputed distance fields, and marks those within 3 mm.
  - Stations: `ssb/geometry/stations.json` stores an endoscope pose per station and side (a midline `.M` station is posed from the right nostril). Picking one flies the pose there over about 600 ms; reduced motion cuts. `#scope=t.<id>[.<side>]` opens a station (side R when absent); an unknown id is ignored. A station may need the 2.7 mm telescope (`shaft`).

**Depth (tier) and truth badges are always visible.** Tier filters labels, panel sections and the tree; it never hides geometry needed for orientation.

## 4. Coordinate frame and units

- **All authored and pipeline data are RAS millimetres**: x → patient right, y → anterior, z → superior. Origin: anterior nasal spine. Axial plane parallel to Frankfort horizontal; x = 0 on the midsagittal plane.
- **One conversion, at one boundary:** `rasToScene([r, a, s]) → [r, s, -a]` (`js/ssb/frame.js`). Nothing in `ssb/` stores scene coordinates. 1 scene unit = 1 mm.
- Laterality in geometry names: `<id>.<side>` with side `R`, `L` or `M`.

## 5. Geometry

### 5.1 Reference specimen

The served specimen is one adult head from the UW Interactive CT Sinus Anatomy atlas (axial and sagittal stacks), 0.3437 mm in-plane and 0.625 mm axial, bone window (8-bit display values, not HU), registered and standardized by `tools/ssb-pipeline/uw/` (`normalize.py`). The right half is mirrored onto the left and the septum centred; the page says the head is standardized, not a real head. Faces are removed: the volume is cropped to the region, with the external nose the one exception (unmasked, centred and mirrored). The as-scanned head is not shipped.

`ssb/LICENSE-data.md` records dataset, licence and attribution for every derived file. Credit the atlas and its institution, never its authors by name.

### 5.2 Segmentation and the label table

`ssb/geometry/labels.json` maps each label index to `<graph id>.<side>`. The table is append-only: an index is never reused. Resection units and cells are manual segmentation; the coarse structures come from automatic segmentation where licensed. Centerlines and landmarks are exported to `ssb/geometry/sweeps.json` and `ssb/geometry/landmarks.json`, keyed `<id>.<side>`. **Coordinates live in geometry files, never in content.**

### 5.3 Pipeline (offline; outputs committed; never run in CI)

`tools/ssb-pipeline/` is Python for the volumetric work. Outputs are committed under `ssb/`. The pipeline writes the packs, the CT and label volumes and the geometry files the page reads; it has not been pruned to the phase 2 page (see `docs/wip.md`).

1. Resample CT and label map into the RAS frame; crop; deface.
2. Labels → per-structure surfaces (marching cubes, smoothing, decimation to a per-kind triangle budget).
3. Pack by region (`ssb/models/packs.json` lists the packs, their nodes and triangle counts) → `KHR_mesh_quantization` glTF binary → gzip → `ssb/models/<pack>.glb.gz`.
4. CT → 8-bit LUT-encoded values → `ssb/ct/ct.u8.gz`. Labels → `ssb/ct/labels.u16.gz`. Header `ssb/ct/ct.json` (dims, spacing, RAS affine, LUT, window presets, label file).
5. Distance fields (mm, clamped) for the proximity HUD → `ssb/ct/sdf-<id>.u8.gz`.

**Models carry geometry only**: no materials, no textures. Materials are assigned at runtime from CSS tokens by `kind` (§6.4). Compression is plain gzip, decoded by `DecompressionStream`; the loader checks the gzip magic bytes rather than trusting headers.

### 5.4 Budgets (design constants)

| | Target |
|---|---|
| First render (graph + `core` pack) | small enough to paint quickly on a phone |
| Triangles on screen | bounded per pack (`LIMIT_TRIANGLES` in `js/ssb/geo-specimen.js`) |
| CT + labels + distance fields | loaded on first entry to Scope |

Rendering is on demand (a frame only when something changed), except during camera flights.

The `lining` pack is not part of the boot. It is fetched the first time the mucosa is seen from within (the camera in the air box, or the scope).

### 5.5 Volumes at runtime

The CT, label and distance volumes are typed arrays in JS (`js/ssb/volume.js`). Slices are CPU-sampled into a 2D canvas. The same arrays answer "what structure is here" (label lookup), "may the scope shaft pass" (label ≠ tissue along sampled points) and "how close is the ICA" (distance-field lookup). `ct.json` carries `dims`, `spacing`, the voxel → RAS `affine`, the value table, the windows and the label file; `loadVolume({ root })` also serves OLSB's Real CT mode from `tbone/`.

### 5.6 Soft tissue and vessels

| Layer | Built as | Truth kind |
|---|---|---|
| Mucosa (sinus and nasal lining) | the air spaces' own surfaces; from inside, the `lining` pack (one surface over the union of every air label, split into nodes by label, so openings are open) | specimen |
| External nose (skin, vestibule, valve) | the specimen's own skin and vestibule, unmasked from the UW axial stack; the internal valve is the centroid of the narrowest coronal section of the airway connected to `lm.naris` | specimen, measured |
| Vessels and nerves | not drawn; their centrelines (`ssb/geometry/sweeps.json`, §5.2) feed the Scope's distance fields | inferred where marked |

Cartilage, ligament, fat and SMAS are not resolvable on this bone-window CT and are not drawn.

`ssb/geometry/sweeps.json`: `{ "<id>.<side>": { "pts": [[r,a,s]…], "radius": [mm…] | mm } }`. The page does not load it; `tools/ssb-pipeline/uw/sdf.py` builds the Scope HUD's distance fields from it.

## 6. Runtime architecture

### 6.1 Files

```
ssb.html                     shell: CSP, chrome, canvas, panels (no inline script)
css/ssb.css                  --ssb-* tokens (tissue kinds, cell categories, stage) + layout
js/ssb/main.js               entry (type="module"): feature detection, boot, error surface
js/ssb/frame.js              the one RAS <-> scene conversion (§4)
js/ssb/stamps.js             GENERATED: data-asset path -> hash (for fetch URLs)
js/ssb/graph.js              load, index, search, render text for the knowledge graph
js/ssb/state.js              the one store (stage, tier, selection, scope, cursor, quality); URL-hash codec; ssb:prefs (guarded)
js/ssb/scope.js              the rigid endoscope's geometry and the #scope= codec: pure math, no DOM, no three.js
js/ssb/scene.js              the 3D stage: renderer, camera, controls, lights, picking, on-demand loop
js/ssb/materials.js          procedural tissue-material library, one factory per tissue kind
js/ssb/geo-specimen.js       the specimen's geometry: model packs -> one scene graph and registry; landmarks, CT bounds
js/ssb/volume.js             the CT and label volumes as typed arrays: loading, affine, slicing, lookup
js/ssb/mode-specimen.js      the Specimen stage
js/ssb/mode-endoscope.js     the Scope stage
js/ssb/ui-specimen.js        the Specimen controls (view, bone, air-space layers, landmarks, section)
js/ssb/ui-endoscope.js       the Scope controls (pose, lens, stations, proximity HUD)
js/ssb/ui-tree.js            the structure tree
js/ssb/ui-search.js          search over the graph
js/ssb/ui-panel.js           the panel that identifies a structure
js/vendor/three-<version>/   three.js module build + the addons used (§7)
ssb/content/*.json           the knowledge graph
ssb/geometry/*.json          labels, landmarks, sweeps, station poses
ssb/models/, ssb/ct/         pipeline outputs the page loads
tools/ssb-content.mjs        graph validator (CI); `--queue` prints the owner's review queue
tools/ssb-pipeline/          offline geometry/CT pipeline
tools/ssb-fixture-ct.mjs     a synthetic volume in the same format, for tests (never written into ssb/)
```

Dependencies are one-way: `main -> mode-* -> {scene, geo-specimen, volume, ui-*} -> {graph, state, scope} -> stamps`; `scene -> materials`. Only `scene` and `geo-specimen` import three.js, and `materials` receives it as an argument. `mode-specimen` and `mode-endoscope` load by dynamic import, so a failure there leaves graph mode alone.

### 6.2 Cache-busting an ES-module graph

`tools/stamp-assets.mjs`:

1. Regenerates `js/ssb/stamps.js` from the hashes of the data files it lists (`ssb/content`, `ssb/geometry`, `ssb/models`, `ssb/ct`, `tbone/ct`, `tbone/geometry`).
2. Topologically sorts `js/ssb/**` by relative imports and rewrites each specifier to `./x.js?v=<hash>`, leaves first. An import cycle is an error.
3. Leaves vendored three.js unstamped: its versioned directory is its cache key.

`tools/check-data.mjs` checks the stamps the same way.

### 6.3 State and URL

One store; everything else subscribes. The URL hash is the shareable state, e.g. `#s=s.uncinate-process&tier=2`, `#scope=R,40,10,-5,90,45`, `#scope=t.frontal-recess-70.R`, `#at=12.5,31,48`, and `q=full|lite`. Parsing is whitelist-only: ids must exist in the graph index, numbers are parsed and clamped, unknown keys are ignored, and nothing from the URL reaches markup except through `textContent`.

- **Keys:** `s` (selected id), `tier` (1–3), `at` (the 3D cursor, `r,a,s` in RAS mm, clamped to the volume's bounds), `cam` (the Specimen's orbit view: camera position then target, `px,py,pz,tx,ty,tz` in RAS mm, one decimal; written only while the Specimen owns the camera, never with `scope`; a sane distance of 5 to 2000 mm between them or it is ignored), `scope` (a pose, or a station link), `q` (§6.4). Earlier keys (`lab`, `ct`, `p`, `step`, `cor`, `pop`, and the phase 2 removals `mu`, `flap`, `anat`, `v`, `dz`) are unknown and ignored.
- **Stage:** `scope=` opens the Scope; without it the stage is the Specimen.
- **Tree:** every group starts closed and builds its rows on first open (`ui-tree.js`); a link or selection opens the path to its row. A closed group costs one summary in the DOM.

### 6.4 Rendering

- **Materials: one procedural surface per tissue kind** (`materials.js`). A part's `look` names its `kind`; the library draws a `MeshStandardMaterial` extended through `onBeforeCompile`, so lighting and shadows stay. Bone is ivory with fine pitting; mucosa is pink with a submucosal vessel network; `skin` is matte. Air cells and air spaces stay plain tinted surfaces.
  - No textures and no UVs. Patterns are functions of world position in millimetres.
  - Colours come from `css/ssb.css`: one `--ssb-*` token per tissue kind and per cell category, read at boot and on every `html[data-theme]` change. There is no second palette in JS.
  - One compiled program per (kind, hazard, quality).
  - **Quality** `full` or `lite`, chosen at boot from device hints; the hash key `q` overrides it.
- The Specimen stage follows the site theme. The endoscope stage is dark in both themes (a projector stage).
- Labels: DOM overlay with SVG leader lines, few at a time, decluttered by tier.
- Picking: raycast on click, all intersections kept for click-to-go-deeper, in the order a click takes them (`collectHits`, `mode-specimen.js`): a landmark marker first; then the nearest surface, except that what yields is passed over for what lies behind it: a see-through envelope (the bone in X-ray) and any opaque skin (the external nose, the vestibule's lining). A solid envelope keeps its place. Hover (mouse only) names the first pick beside the pointer; touch has no hover.
- Camera flights respect `prefers-reduced-motion` (cut instead of fly).

### 6.5 Degradation, accessibility, mobile

- No WebGL2 → graph mode: tree, search and panels as text. Feature detection is in `main.js`; the page never throws to a blank screen.
- The structure tree is a real DOM list mirroring the scene: keyboard navigable, selection synced both ways, announced via `aria-live`.
- Phones: bottom-sheet panel, one-finger orbit, pinch zoom. Scope steps between stations with drag-to-look rather than free flight.

### 6.6 Content text

Escape first, then transform the two allowed inline forms (`[[id]]`, `*em*`). An unresolved `[[id]]` renders as plain text (the validator makes this unreachable in committed content).

## 7. Security and CSP

`ssb.html` uses the self-contained-page policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. Every fetch is same-origin. The design keeps this true:

- ES modules from same-origin files satisfy `script-src 'self'`. There is no import map. three.js ships only unminified module builds, vendored side by side; `js/vendor/README.md` records the patch and `tools/check-data.mjs` pins the bytes.
- No WebAssembly, no `blob:` images, no workers from blobs.

## 8. Verification

| What | How | When |
|---|---|---|
| Graph schema, ids, refs, vocabularies, review gate | `tools/ssb-content.mjs` via `tools/check-data.mjs` | CI |
| Geometry ↔ graph | every pack node, sweep and landmark resolves to a graph id | CI |
| Page boots, renders, zero real console errors | `tools/smoke-pages.mjs` entry for `ssb.html` | CI |
| Behaviour | `tools/test-ssb.mjs`: specimen and scope, unit and page level | CI (two shards) |
| Citations | an agent matches every `src.*` against an authoritative record and sets `verified` only on a match. `verified` means the work exists as cited, not that it supports the claim | continuous |
| Medical correctness | adversarial expert-model review, then **the owner** flips `review` to `verified` | continuous |

Test sections (`node tools/test-ssb.mjs --only <section>[,<section>…]`): `specimen`, `scope`. `--shard i/2` is CI's split.

## 9. Storage

`ssb:prefs` (the chosen tier), through one guarded adapter in `js/ssb/state.js`. Registered in `docs/decisions.md` §3.

## 10. Image generation

Generated pixels never carry an anatomical claim. The repo holds no API keys; the owner runs generators from the briefs in `docs/ssb-imagegen.md`. Procedural shaders come first (`js/ssb/materials.js`, §6.4).

## 11. Build plan

Phases, waves and work packages are tracked in GitHub issue #266 and its sub-issues (specs: `plans/2026-10-07-ssb-roadmap.md`). Every change ends green on `tools/check-data.mjs` and the relevant suites (`docs/verification.md`). Who does what: `docs/delegation.md`.

## 12. Owner decisions

The decision record is `plans/2026-10-07-ssb-roadmap.md` §1. Decisions whose rationale is not in the code:

- **Vendor three.js:** same-origin and pinned (`js/vendor/README.md`).
- **Reference specimen from the UW atlas:** bone window only, with vessels and nerves as sweeps. Written permission: `ssb/LICENSE-data.md`.
- **Standard specimen:** the first release teaches normal anatomy on the standardized head; the as-scanned head is not shipped.
- **Phase 2 (this page's scope):** only Specimen (pick, tree, search) and Scope (traversal) ship.
