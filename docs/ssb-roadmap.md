# SSB roadmap — task board

What is done, what is next, who does it, and what waits on the owner.
Architecture and the reasons behind it: `docs/ssb.md`. How work is handed
to a model and checked: `docs/delegation.md`. Current state in prose:
`WIP.md`.

Last re-planned: 2026-10-02 (Opus). Update the board in the same PR as the
work; when a wave closes, shrink its finished WPs to one line each (git
history keeps the specs).

## 1. Status board

| Phase (`docs/ssb.md` §12) | State | What remains |
|---|---|---|
| 0 Architecture, schema, validator, draft graph | **done** | — |
| 1 Walking skeleton, graph mode | **done** | — |
| 2 Variant lab | **2 of 4 dioramas** | `sphenoid` (D1–D2), `lateral-wall` (later) |
| 3 Reference specimen | **done** (stages B, C; Specimen stage; vessel tubes; mucosa layer) | soft tissue (track ST: ST1, ST2, ST4a in review; ST0, ST3, ST4b Opus); hand segmentation (owner, optional) |
| 4 Endoscope | **rig built** (E1, E2 in review) | collision + HUD (E3), station poses (E5, Opus), flights (E6) |
| 5 CT mode | **done** (triplanar, overlay, cursor shared with 3D) | oblique slice down the scope (E4) |
| 6 Procedure mode | not started — wave 3 | P1–P2 |
| 7 Self-test | not started — wave 3 | T1 |
| 8 Offline cache, performance | not started | image textures only if procedural materials fall short (`docs/ssb.md` §11) |
| ∞ Content | all `draft` (state: `WIP.md`) | owner review (tier 1 first); backlog §6 |

**Waiting on the owner:** decisions O1–O3 (§2), then CP-1's report. **CP-1 is done** (first pass, same model as the code; branch `claude/wave-1-sonnet`): re-check it, then the Opus wave-1 WPs (ST0 first) and wave 2.

## 2. Owner — decisions and actions

Decisions (detail and recommendations: `docs/ssb.md` §13):

| ID | Question | Recommended | Blocks |
|---|---|---|---|
| O1 | Where the **external nose** comes from: the specimen's own nose (unmask a nose-only box), a parametric nose diorama, or both | Both: specimen skin surface for the naris and ala (real n = 1), cartilage as a schematic overlay — if ST6-0 shows the nose is in the field of view | ST6 |
| O2 | How much **nose**: entry anatomy only (vestibule, valves, ala, columella — the scope's fulcrum and walls), or the rhinoplasty framework too (ULC/LLC crura, ligaments, SMAS) | Entry anatomy now; framework later, as its own diorama | ST0 scope, ST6 |
| O3 | **Content authoring split**: Sonnet drafts backlog content and checks citations, Opus reviews adversarially (cheaper) — instead of Opus authoring | Yes for the §6 backlog; Opus keeps authoring anything that places geometry (vessels, flaps, stations) | C1 |
| — | Still open from before: strict CSP; publish while `draft`; name | as in §13 | — |

Actions (no model can do these):

- Review the two dioramas' schematic proportions and tier-1 graph content;
  flip `review` to `verified` where right.
- Record the UW authors' written permission beside `ssb/LICENSE-data.md`.
- Look at the specimen's AEA–PEA spacing (21 mm vs population 12; inferred
  PEA).
- Optional upgrade: hand segmentation in 3D Slicer (basal lamella, vidian
  and ethmoidal canals, cavernous ICA) or a contrast CT.

## 3. Plan review (2026-10-02)

What changed since the phase plan was written, and what it does to the
order:

1. **The specimen is a bone-window reconstruction, not a contrast CT.** Soft
   tissue, fluid and fat sit a few display levels apart, so mucosal
   thickness, cartilage, muscle and vessels cannot be segmented. Soft tissue
   is therefore *derived* (surfaces of the air spaces and walls), *swept*
   (vessels as inferred tubes) or *parametric* (flap territories, cartilage)
   — `docs/ssb.md` §5.7.
2. **The face mask removed the nose.** The endoscope's fulcrum is the
   nostril, which the specimen no longer has. The endoscope starts on a
   provisional schematic fulcrum (E1); the nose track (ST6) replaces it.
3. **Endoscope before the sphenoid diorama.** The endoscope is the mode the
   project exists for, and its dependencies (mucosa surfaces, fulcrum) are
   the same as soft tissue's. The sphenoid diorama is independent and runs
   in parallel.
4. **Phase 8 shrinks.** Procedural materials (§7.4) cover what textures
   were for; image textures stay a fallback (§11), so phase 8 is mostly
   caching and performance.
5. **Pipeline runs without the raw crawl where possible.** New soft-tissue
   steps read the committed `ssb/ct/` volume (stage D), so any session can
   rerun them; only ST6 needs the UW crawl (`tools/ssb-pipeline/uw/fetch.py`,
   network permitting).

## 4. Waves and checkpoints

Each wave lists WPs that can start together; WPs in the same row share no
**Touch** files and can run in parallel sessions.

**Wave 1 — ready now**

| Sonnet (parallel) | Opus (one session) |
|---|---|
| H1 graph additions · ST1 mucosa layer · ST2 septal surface · ST4a surface sweeps · ST6-0 nose feasibility · D2 waits for D1 | ST0 soft-tissue content · ST3 flap construction spec · ST4b vessel waypoints · D1 sphenoid spec |
| then E1 fulcrum (after H1 + ST2) → E2 scope rig | |

**CP-1 (Opus)** — after H1, ST1, ST2, ST4a, ST6-0, E1, E2. Check: scope
math against E2's spec and tests; septal surfaces on screen on both sides
(deviation, spur); the mucosa look from inside and outside; ST6-0's report
→ put O1 to the owner with evidence. Re-plan wave 2.

**CP-1 result (2026-10-02)** — done by the same model that wrote the code,
at the owner's request, so treat it as a first pass to be re-checked, not
as independent review. Verdicts: H1, ST1, ST2, ST4a, ST6-0, E1, E2 pass
their Accept; what the review found and changed:

1. **Bug, fixed (E2):** the scope's per-frame camera update re-requested a
   frame, so the on-demand loop never idled while the scope was open (the
   specimen idles at 0 frames/s). Now a test pins it.
2. **Spec problem, changed (E3):** collision against the pipeline's air
   threshold (display 78) leaves *no* straight rigid-scope path from either
   provisional nostril to the sphenoid or frontal ostia (0 of the poses in
   yaw/pitch ±45° reach within 6 mm); blocking only on bone (≥ 150) gives
   the textbook sphenoid trajectory (R: yaw -3°, pitch 15°, depth 52 mm,
   0.7 mm off the ostium landmark; L: yaw 5°, pitch 17°, depth 58 mm) and
   still none for the frontal ostium with a 0° tip, which is the point of
   the 45–70° lens. Mucosa and turbinates in this specimen are display
   88–130, i.e. it is not decongested; E3's spec above says what to do.
3. **Defect, mitigated (ST2):** the septal patch had holes where the
   septum is thicker than `walls.py`'s 10 mm cap (anterior bulge, A -17,
   S 22: R and L surfaces 9–10 mm apart there) or a turbinate abuts it.
   `softtissue.py` now fills holes inside the patch's outline from the
   airway lining's medial-most sheet and lists those cells as `filled` in
   `charts.json` (50 right, 59 left); the chart round-trip is judged on
   interior, unflagged cells (max 0.44 / 0.27 mm; 1.08 mm over all cells,
   edge cells included). One hole remains posterosuperiorly (A -45…-35,
   S 28–33, olfactory cleft / sphenoethmoidal region), where no airway
   lining faces the septum within 8 mm: the NSF's superior incision and
   pedicle sit near it, so ST3 must treat it as no-data.
4. **Seen on screen:** mucosa from inside reads as a lining (vessel pattern,
   specular wet look; blown out on nearby surfaces at 900 cd, retuned to
   350). From outside the translucent shell is a flat pink mass: legible
   for orientation, not for detail.
5. **O1 evidence** (ST6-0): put to the owner below.

*Cannot be determined from this specimen — flagged, not decided:*
(a) whether `lm.naris` (A ≈ 0, S = 10) is where the nostril really is: the
unmasked sagittal stack shows the vestibule (rows 280–298, cols 107–139 of
slice 62) and could place the aperture, which I did not do; the +10 mm
forward step is a guess. (b) Whether a 3 mm or a 4 mm scope is the right
model of "the" scope. (c) Whether the choanal arch (S 12) and the
posterosuperior septal hole are real anatomy or segmentation limits (the
PNS plane is the specimen's own cut). (d) Anything about the clinical
correctness of the poses: the sphenoid trajectory matching teaching is
reassuring, not verification.

*For the owner — O1 with evidence:* the unmasked source stacks contain the
whole external nose (axial: tip 0.3 mm inside the frame over slices
123–129 of 175; sagittal: nose forward of column 30 over slices 53–72, tip
15 px from the edge; one continuous skin–air contour, vestibule air
visible). Recommendation unchanged: both (specimen skin for naris and ala,
cartilage as a schematic overlay); the frame margin at the tip is thin, so
expect a slightly flattened tip.

**Wave 2**

| Sonnet | Opus |
|---|---|
| ST0c citation checks · ST4c regenerate vessels · ST5 flap overlay + soft-tissue panel · E3 collision + HUD (revised spec) · E4 oblique CT · D2 sphenoid build | E5 station poses (after E3) · ST6 spec (after O1/O2) |

Still open from wave 1 (Opus, none started): **ST0** soft-tissue content,
**ST3** flap construction spec, **ST4b** vessel waypoints, **D1** sphenoid
spec. ST0 gates ST0c, ST4b, ST3, ST4c and ST5, so it goes first; D1 gates
D2 and is independent of the rest. E3 and E4 do not wait on them.

**CP-2 (Opus)** — anatomy on screen: each vessel's course against its
sources, PSA inside the flap pedicle, flap ladder against the procedure's
steps, endoscope frames at every station, sphenoid diorama proportions and
rules. Report for the owner's review.

**Wave 3** — E6 station flights; ST6 nose; P1/P2 procedure mode (NSF first:
harvest, rotation, inset); T1 self-test; C1 content backlog (per O3).

## 5. Work packages

Format and rules: `docs/delegation.md` §2–§3. Every Sonnet WP also runs the
standard checks (`node tools/check-data.mjs`, `node tools/test-ssb.mjs`,
`node tools/smoke-pages.mjs`; `node tools/stamp-assets.mjs` after any
`js/`/`css/`/`ssb/` change) and the docs pass.

Pipeline WPs need the Python env: `python3 -m venv .venv &&
.venv/bin/pip install -r tools/ssb-pipeline/requirements.txt`.

### H1 — Graph entities the geometry already needs        [done: CP-1] · Sonnet · depends: —
Result: `lm.naris` added (tier 1, `of: s.nasal-vestibule`). `s.skull-base-region` already existed with `region: multiple` (`skull-base` is not in the validator's vocabulary), so only its name and text were brought to the spec. `meshes.py` still writes its `proposedIds` note: rerunning it needs the raw crawl, and the id is in the graph now, so the note is stale and goes at the next pack rebuild.
Goal: every id the packs and the endoscope use exists in the graph.
Read: `docs/authoring-ssb.md` §3–§5; `ssb/models/packs.json` `proposedIds`.
Touch: `ssb/content/nasal-maxillary-ppf.json`, `ssb/content/ethmoid-frontal-orbit.json`.
Don't: rename any id; write medical claims beyond the text below.
Steps:
1. Add `s.skull-base-region` — name "Sinonasal bony envelope
   (reconstruction)", kind `region`, region `skull-base`, tier 1, geo
   `specimen`, `what`: "The bone within 12 mm of the named air spaces in the
   reference specimen, drawn as one surface for orientation; it is a
   reconstruction unit, not an anatomical structure.", `why`: "Gives the
   specimen its skeleton while the walls pack carries the named bones.",
   `src` the UW atlas source id already used by the specimen, `review: draft`.
   Pick `region` from the vocabulary `tools/ssb-content.mjs` accepts.
2. Add `lm.naris` — name "Naris (nostril)", `of: s.nasal-vestibule`, tier 1,
   `locate`: "The nostril opening; the endoscope's fulcrum.", `src` as for
   `s.nasal-vestibule`, `review: draft`.
3. Remove the `proposedIds` note from the pack writer's output only if
   `tools/ssb-pipeline/uw/meshes.py` can be changed without rerunning it;
   otherwise leave it and note it in the PR.
Accept: `node tools/ssb-content.mjs` and `node tools/check-data.mjs` pass.
Escalate: the validator rejects the kind/region vocabulary in a way that
needs a schema change.

### ST1 — Mucosa layer on the specimen        [done: CP-1] · Sonnet · depends: —
Result: "Mucosa" toggle in the Specimen layers (`setMucosa`, hook `mucosaOn` / `drawn` per node): opaque and double-sided once the camera is inside the air spaces' box, a 40 % translucent shell outside; no shader change. `test-ssb.mjs --only specimen` pins toggle on/off, bone untouched, picking through it, both themes.
Goal: the air spaces can be drawn as their lining — the surface the
endoscope will see.
Read: `docs/ssb.md` §5.7, §7.4; `js/ssb/materials.js`;
`js/ssb/mode-specimen.js`, `js/ssb/ui-specimen.js` (layers); `docs/verification.md` SSB.
Touch: `js/ssb/mode-specimen.js`, `js/ssb/ui-specimen.js`, `js/ssb/materials.js` (only if a material flag is missing), `tools/test-ssb.mjs`, `css/ssb.css`.
Don't: change pack files; add a colour outside `--ssb-*` tokens.
Steps:
1. A "Mucosa" layer toggle in the Specimen stage: air-space nodes drawn
   with the `mucosa` material — opaque and double-sided when the camera is
   inside the volume, a translucent shell from outside (follow how X-ray
   mode ghosts occluders).
2. Expose its state read-only through the existing `window.__ssb` hook.
Accept: new `test-ssb.mjs` cases (`--only specimen`): toggling the layer
switches every air-space node's material kind to `mucosa` and back; picking
through it still selects the air space's graph id; both themes compile.
Escalate: the material library has no way to express inside/outside
without a new shader.

### ST2 — Septal mucosa surfaces (stage D, from the committed volume)        [done: CP-1] · Sonnet · depends: —
Result: `softtissue.py` writes `ssb/models/soft.glb.gz` (5000 triangles a side), `ssb/geometry/charts.json` and `lm.choanal-arch.M` (R 4.0, A -51.5, S 12.0; stage B's `choanal_arch_s_mm` is 12.5). Areas 14.3 / 15.4 cm² after CP-1's hole fill, both within 8 mm of the midsagittal plane, chart round-trip max 0.44 / 0.27 mm on interior unflagged cells. **Deviations for CP-1:** (1) the pack is listed under `pendingPacks` in `packs.json`, not `packs`, because `check-data` fails any packs.json name that is not a graph id and `s.septal-mucosa` is ST0's; move it when ST0 lands. (2) A sagittal chart is not single-valued where the surface folds (the left side has a spur or deviation: 122 of 1337 cells span more than 1 mm in R, the right 31 of 1366): those cells are listed under `unreliable` in `charts.json` and ST3/ST4b should treat them as approximate. (3) The choanal arch sits at the 4 mm edge of its search window; the PNS plane is the specimen's own cut.
Goal: a surface per side for the septal mucosa, with a 2D chart, so flaps
and septal vessels can be placed on it.
Read: `docs/ssb.md` §5.3, §5.7; `tools/ssb-pipeline/uw/walls.py` (how the
septum wall unit is defined and meshed), `tools/ssb-pipeline/uw/meshes.py`
(pack writer).
Touch: new `tools/ssb-pipeline/uw/softtissue.py`; `ssb/models/` (new
`soft.glb.gz`, `packs.json`); `ssb/geometry/` (new `charts.json`);
`tools/check-data.mjs` (only to register the new files if it requires it).
Don't: touch the raw-crawl steps (`specimen.py` and earlier); hand-edit
generated files.
Steps:
1. Read `ssb/ct/` (CT, labels, `ct.json`). The septal surface of side X is
   the boundary between the `s.nasal-septum.M` wall voxels and the air of
   `s.nasal-cavity.X` (label names via `ssb/geometry/labels.json`).
2. Mesh each side as `s.septal-mucosa.R` / `.L` (H1 does not add this id —
   ST0 does; until then write it under `proposedIds` in `packs.json`
   exactly as `meshes.py` does) into a `soft` pack, same encoding and
   budget rules as `walls`.
3. Chart: the sagittal projection (a, s) of each surface. Write
   `ssb/geometry/charts.json`: per surface, the RAS→chart rule, its
   bounding polygon in chart mm, and a regular (a, s) → r lookup grid at
   1 mm (null where the surface is absent), so runtime code can drop a
   chart point onto the surface.
4. Landmarks the flap needs, merged into `ssb/geometry/landmarks.json`
   (+ meta, method per point; never drop keys): `lm.choanal-arch.M` — the
   highest point of the nasal-cavity | nasopharynx boundary at the septum's
   posterior free edge (`specimen.py` cuts that boundary at the PNS plane).
   The specimen has `lm.sphenoid-ostium.R/.L` already.
5. Print area (cm²) and the chart bounding box per side.
Accept: script runs in under a few minutes; `check-data.mjs` passes; each
side's area is printed and both sides lie within 15 mm of the midsagittal
plane; the chart round-trips (chart → surface → chart) within 1 mm on a
sample of points (print the max error).
Escalate: the septum wall unit does not separate cleanly from the turbinate
or floor walls (report where, with slice numbers).

### ST4a — Surface-snapped sweeps (pipeline machinery)        [done: CP-1] · Sonnet · depends: —
Result: `sweeps_soft.py` + an empty `sweeps-soft.json`; `softtissue.py` calls it. `--selftest` builds a straight chart line per side on reliable cells and checks every point is within 0.5 mm of `depth` below the mesh (max 0.09 mm) and that a rerun is identical. The test entry is built in memory, not committed, because a sweep key must be a graph id. Paths over `unreliable` cells warn and are flagged in the meta.
Goal: vessels that run on a mucosal surface can be specified as waypoints
and generated, so Opus writes anatomy as data and never hand-places points.
Read: `docs/ssb.md` §5.5, §5.7; `tools/ssb-pipeline/uw/sweeps.py`; `ssb/geometry/sweeps.meta.json`.
Touch: new `tools/ssb-pipeline/uw/sweeps_soft.py` (standalone, so it does
not collide with ST2; `softtissue.py` calls it once both exist); new
`tools/ssb-pipeline/uw/sweeps-soft.json` (spec, initially one test entry).
Don't: change existing sweeps; place real anatomy (that is ST4b).
Steps:
1. Spec format, per `<id>.<side>`: `surface` (a surface id with a chart),
   `waypoints` — each either a landmark id plus optional mm offset, or chart
   (a, s) mm — `depth` (mm below the surface, along its normal, toward
   tissue), `radius` (mm or per-point), `src` (graph source ids).
2. Generate: waypoints → surface points (via the chart grid) → offset by
   depth → resample at 1 mm → merge into `ssb/geometry/sweeps.json`, with
   every point marked `inferred` and the spec entry recorded in
   `sweeps.meta.json`. Run after `sweeps.py`; never delete its keys.
Accept: with a test entry (a straight chart line), every generated point is
within 0.5 mm of `depth` below the surface; rerunning is byte-identical;
`check-data.mjs` passes after the test entry is removed again.
Escalate: ST2's chart is not ready — build against a stub and say so.

### ST6-0 — Is the nose in the source images?        [done: CP-1] · Sonnet · depends: —
Result (evidence for O1; method and numbers in the PR body): yes. In the unmasked axial stack the nasal tip is inside the frame, with its anterior skin 1 px (0.34 mm) from the top edge over axial slices 123–129 (0-based, superior = 0, 0.625 mm apart): a hair from clipping, and no head mask touches row 0. In the sagittal stack the whole nose lies forward of column 30 over slices 53–72 and the tip (slice 62) is 15 px from the left edge; the skin–air edge is one connected contour from glabella to chin, and the vestibule air is visible there (rows 280–298). The mask removed it; a nose-only unmask is feasible.
Goal: evidence for owner decision O1.
Read: `tools/ssb-pipeline/README.md`; `tools/ssb-pipeline/uw/specimen.py`
docstring (face mask); `ssb/reference/uw-sinusanatomy2/README.md`.
Touch: nothing committed except a report in the PR body.
Steps: run the crawl and volume steps if the network allows (`fetch.py`,
`volume.py`); in the unmasked volume, report whether the nasal tip, both
alae, columella and nostrils lie inside the field of view on the axial and
sagittal stacks; the slice range they occupy; whether the skin–air edge is
continuous; and two PNGs (one axial, one sagittal through the vestibule) in
the scratchpad, described in the PR, not committed.
Accept: the report answers each question with slice numbers.
Escalate: the UW site is unreachable from the session (report the error;
the owner may need to run it locally).

### E1 — Provisional endoscope fulcrum        [done: CP-1] · Sonnet · depends: H1, ST2 (same script)
Result: `lm.naris.R` (4.43, -0.32, 10.0) and `.L` (-0.99, -0.16, 10.0), anterior to the bone of their axial row (A -10.0). **For CP-1:** the masked cavity's anterior edge is at A -9.5 on both sides, so the 10 mm forward step puts both points at A ≈ 0; the left front centroid is only 1 mm from the midline (R -0.99) against 4.4 for the right, a narrow left vestibule or a deviation, so the two nostrils are not symmetric.
Goal: a `lm.naris.R` / `.L` point the scope can pivot on until the nose
exists.
Read: `docs/ssb.md` §3 (Endoscope), §5.7.
Touch: `tools/ssb-pipeline/uw/softtissue.py`; `ssb/geometry/landmarks.json`
+ `landmarks.meta.json` (merge, never drop keys).
Steps: per side, take the axial level 10 mm above `lm.anterior-nasal-spine.M`
(the specimen has no turbinate-head landmark); find the most anterior air
voxels of `s.nasal-cavity.<side>` at that level (±2 mm); their centroid
moved 10 mm anterior (+A) is `lm.naris.<side>`. Record in meta:
`inferred — schematic: 10 mm above ANS, 10 mm anterior to the masked nasal
cavity's anterior edge; replaced when the nose exists (ST6)`. Both 10 mm
figures are schematic and go to CP-1 for a look.
Accept: both points emitted, anterior to every bone voxel on their axial
row, `check-data.mjs` passes.

### E2 — Scope rig        [done: CP-1] · Sonnet · depends: E1 (ST1 helps)
Result: `scope.js` (math, `#scope=` codec), `mode-endoscope.js`, `ui-endoscope.js`, a fourth stage pill. The scope is a camera pose over the Specimen stage (the store's `scope`, exclusive with `lab` and `ct`): bone hidden, mucosa on, spotlight (decay 2) at the tip, 70° circular field of view, drag / wheel / keys / sliders. **Deviations for CP-1:** it touched `js/ssb/scene.js` (exports `scene`, `controls`, `lights` and a `holdPose` so a stage left from the scope saves the orbit view, not the tip), outside the WP's Touch list; and the toolbar's pill padding and gaps in `css/ssb.css` shrank so four stages still fit one row at 1280 px. The lens-30 "looks up" rule holds for pitch above -30° (`v·S = sin(pitch + 30°)`). Spot intensity (350 cd), cone and fill are by eye: judge them at CP-1.
Goal: first-person rigid-endoscope view on the specimen.
Read: `docs/ssb.md` §3 (Endoscope), §4, §7.1–§7.4; `js/ssb/mode-specimen.js`
(stage pattern), `js/ssb/state.js` (hash codecs).
Touch: new `js/ssb/scope.js` (pure math, no DOM, no three.js import), new
`js/ssb/mode-endoscope.js`, new `js/ssb/ui-endoscope.js`, `js/ssb/main.js`
(register the stage), `js/ssb/state.js` (`#scope=`), `css/ssb.css`,
`ssb.html` (stage switcher only), `tools/test-ssb.mjs`.
Don't: collision or HUD (E3); new dependencies.
Spec (RAS mm; R, A, S unit vectors; all angles degrees):
- Pose `{side, depth, yaw, pitch, roll, lens}`; `lens ∈ {0, 30, 45, 70}`.
- Fulcrum F = `lm.naris.<side>`. Shaft direction
  `d = (cos p · sin y · σ)·R + (cos p · cos y)·(−A) + (sin p)·S`, with
  σ = +1 for the right nostril and −1 for the left: yaw 0 / pitch 0 points
  straight posterior, yaw + swings the tip laterally on the scope's own
  side, pitch + up.
- Tip T = F + depth · d.
- Reference up `u0` = S projected ⟂ d, normalised (fallback A if
  |d·S| > 0.99). `w = d × u0`. Lens offset direction
  `o = cos(roll)·u0 + sin(roll)·w`; view `v = cos(lens)·d + sin(lens)·o`.
  Roll 0 with a 30° lens therefore looks up.
- Camera up = S projected ⟂ v (horizon held level — the camera head stays
  upright while the telescope rotates). Light-post indicator drawn at the
  image edge opposite `o`'s projection.
- Spotlight at T along v, `decay 2` (inverse square), narrow cone; field of
  view ~ 70° circular vignette. Air-space nodes drawn as mucosa from inside
  (ST1's material).
- `#scope=side,depth,yaw,pitch,roll,lens`, clamped to ranges in `scope.js`
  (depth 0–120 mm, yaw/pitch ±45, roll 0–359, lens whitelist).
Accept: Node-only unit tests of `scope.js`: lens 0 ⇒ v = d; lens 30, roll 0
⇒ v·S > 0; |v| = 1 for random poses; camera up ⟂ v and its S component > 0
for |pitch| < 60; T at depth 0 = F; hash round-trip; hostile hash clamped.
Page tests: the stage renders non-blank; keys/drag change the pose; the
indicator moves with roll; reduced motion respected.
Escalate: the specimen's air meshes do not render from inside without pack
changes.

### E3 — Collision and proximity HUD        [todo] · Sonnet · depends: E2
Goal: the shaft cannot pass through tissue; distances to critical
structures shown.
Read: `docs/ssb.md` §3, §5.6; `js/ssb/volume.js`; `tools/ssb-fixture-ct.mjs`.
Touch: `js/ssb/scope.js`, `js/ssb/mode-endoscope.js`, `js/ssb/ui-endoscope.js`,
`tools/ssb-fixture-ct.mjs` (add an SDF if missing), `tools/test-ssb.mjs`.
Spec (revised at CP-1, with evidence in §4): sample the shaft every 0.5 mm
from F + 2 mm to T, at the axis and on a ring of 4 points at
`SHAFT_RADIUS_MM = 1.5` (schematic; a 4 mm scope is 2.0 and fails on the
right side, a 3 mm scope passes); **blocked only by bone**, CT display
≥ 150 (`BONE_LEVEL` in `meshes.py`), at any sample. Mucosa and turbinates
(display 78–150) are **not** blocking: this specimen is not decongested
and a rigid scope displaces mucosa, so blocking at the pipeline's air
threshold (78) makes the sphenoid and frontal ostia unreachable from either
nostril. Report the shaft length lying in soft tissue as "mucosal contact
(mm)" in the HUD. A pose change that would block is clamped to the last free
depth (not refused). HUD: each SDF in `ct.json` `sdf`, distance at T in mm,
nearest first; ≤ 3 mm drawn in `--signal`; names via the graph.
Accept: fixture tests: a pose through a solid wall clamps before it; a pose
in air is untouched; HUD distance matches the fixture's analytic distance
within one voxel; no SDF ⇒ HUD hidden, no error. Plus, on the real
specimen: from `lm.naris.R` a pose with yaw -3 ± 3°, pitch 15 ± 3° and depth
52 mm is collision-free and its tip is within 2 mm of `lm.sphenoid-ostium.R`
(CP-1 found yaw -3, pitch 15, depth 52.2 at 0.7 mm), and a pose straight
posterior at depth 40 is blocked by the same rule where CT is bone.

### E4 — CT along the scope        [todo] · Sonnet · depends: E2
Goal: the CT follows the tip.
Touch: `js/ssb/mode-endoscope.js`, `js/ssb/ui-endoscope.js`, `js/ssb/mode-ct.js` (only to accept the cursor), `tools/test-ssb.mjs`.
Spec: on pose change (throttled to animation frames), `state.cursor = T`;
an inset canvas shows `obliqueSlice` through T spanned by v and camera up,
with the shaft drawn on it.
Accept: after a pose change the CT crosshair equals T within a voxel; the
inset's centre pixel samples the same value as `volume.sample(T)`.

### E5 — Station poses        [todo] · **Opus** · depends: E3
Write `ssb/geometry/stations.json` (`{"t.<id>.<side>": pose}`) for every
`t.*` the specimen covers, by driving the rig until the view shows what the
station's `shows` lists; check each is collision-free. List stations the
specimen cannot show (out of crop, needs dissection) for procedure mode.

### E6 — Station flights        [todo] · Sonnet · depends: E5
Station list in the endoscope UI from `t.*` (tier-filtered), flight between
poses (interpolate pose parameters, not the camera), deep link
`#scope=t.<id>`. Accept: every station's pose is collision-free and its
first `shows` structure's centroid is inside the view frustum.

### ST0 — Soft-tissue content        [ready] · **Opus** · depends: — (O2 sets the nose scope)
Author, with sources, into the region files (`docs/authoring-ssb.md`):
- `s.septal-mucosa` (kind `mucosa`, geo `specimen`) and, if needed,
  `s.nasal-floor-mucosa` for the extended flap.
- Arteries as sweeps: posterior septal artery's superior and inferior
  septal branches; PLNA inferior- and middle-turbinate branches; AEA and
  PEA septal branches; nasopalatine artery / incisive canal; superior
  labial artery and its septal branch; facial, angular, lateral nasal
  (facial branch — distinct from the PLNA) and columellar arteries;
  supraorbital, supratrochlear and superficial temporal arteries for the
  regional flaps.
- Flaps as procedures: inferior turbinate flap, middle turbinate flap,
  anterior-pedicle lateral nasal wall flap (the rescue ladder in
  `h.nsf-pedicle-injury` already names them).
- Measurements the overlay needs: NSF length, width and area by design
  (short / full / extended), pedicle width, PSA height on the sphenoid face
  relative to the ostium and choana.
- Nose (scope per O2): `lm.naris` content beyond H1's stub; vestibule,
  internal and external valves, ala, columella, nasal bone, piriform
  aperture; cartilages only if O2 says so.
Then ST0c (Sonnet): PubMed E-utilities check of every new source
(`docs/ssb.md` §9 Citations).

### ST3 — Flap construction spec        [ready] · **Opus** · depends: ST0
Write `docs/ssb.md` §5.7's flap overlay contract concretely: the NSF outline
in ST2's chart for each design in `p.nasoseptal-flap` (short, full,
extended) — superior incision `m.nsf-superior-incision` below the septal
top, posterior cuts from the inferior margin of `lm.sphenoid-ostium` and
along `lm.choanal-arch`, anterior cut per design — as parameters with
ranges from the graph, plus the rescue-flap incisions; the tests it must
pass (pedicle contains the PSA sweep; the superior cut never enters the
olfactory strip; area readout equals the polygon's surface area).

### ST4b — Vessel waypoints        [ready] · **Opus** · depends: ST0 (ST4a format)
Write `tools/ssb-pipeline/uw/sweeps-soft.json` entries for every sweep
ST0 adds that runs on a mucosal surface, from sources, each waypoint
citing its source in the entry; flag the ones whose course is variable.

### ST4c — Regenerate vessels        [todo] · Sonnet · depends: ST2, ST4a, ST4b
Run `softtissue.py`; check every new sweep id resolves in the graph;
`relate3d.py` agreement does not drop (report the before/after counts).

### ST5 — Soft-tissue panel and NSF overlay        [todo] · Sonnet · depends: ST1, ST3, ST4c
Specimen stage: a soft-tissue group (Mucosa, Septal mucosa, Vessels, Flap)
with tier filtering; the NSF overlay per ST3 (design presets as buttons,
sliders for the parameters, area readout, incisions drawn on the surface,
"schematic on specimen" badge). Tests per ST3.

### ST6 — External nose        [blocked: O1, O2] · Opus spec → Sonnet build
Spec after ST6-0 and the owner's decision.

### D1 — Sphenoid diorama spec        [ready] · **Opus**
Parameters, presets from `c.sphenoid-pneumatization`, schematic proportions
(stated in the header), and the rules `test-ssb.mjs` must pin (as the
frontal-recess IFAC rules are), per `docs/ssb.md` §6's `sphenoid` row.

### D2 — Sphenoid diorama build        [todo] · Sonnet · depends: D1
Build `js/ssb/dioramas/sphenoid.js` to D1 with `kit.js` primitives;
register it; tests from D1.

### P1/P2, T1, C1 — wave 3        [todo]
P1 (Opus): `removes` units per step for the first procedures, mapped to
existing wall and air nodes. P2 (Sonnet): the procedure player
(`docs/ssb.md` §3). T1 (Sonnet): self-test — find it / name it / CT
localize, Leitner reused unchanged, storage key registered per
`docs/decisions.md` §3. C1: §6 backlog, split per O3.

## 6. Content backlog

Gaps found by the atlas integration (as of 2026-09-28):

- Anatomy: petrolingual/parasellar ligaments, carotid cave, jugular foramen
  and CN IX–XI; orbital septum, superior ophthalmic vein, frontal lobe
  beyond gyrus rectus, hard palate, parapharyngeal space.
- Procedures (so conditions can link `managedBy`): canthotomy/cantholysis,
  orbitotomy, frontal sinus cranialization, septodermoplasty and Young's,
  transantral IMAX ligation, Lynch approach.
- Owner review flagged by the integration: whether the two dry-eye hazards
  (vidian neurectomy vs vidian sacrifice in transpterygoid work) should
  merge; optic nerve sheath incision wording in optic nerve decompression.
- Conditions: EGPA, PCD, immunodeficiency, granulomatous infections,
  septal hematoma/abscess, developmental cysts, organizing hematoma,
  facial fractures; HPV-related multiphenotypic and SMARCA4-deficient
  carcinomas, non-intestinal adenocarcinoma, biphenotypic sarcoma,
  petroclival/cavernous/spheno-orbital meningiomas, trigeminal schwannoma,
  germinoma, LCH, optic pathway glioma.
- Classifications/numbers: SPOA drainage size threshold, AFRS staging,
  Cannady (IP), WHO CNS meningioma grade, AJCC N categories, ION canal
  grading, JNA staging variants, olfactory neuroblastoma staging review.
