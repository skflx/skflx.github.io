# SSB roadmap — task board

What is done, what is next, who does it, and what waits on the owner.
Architecture and the reasons behind it: `docs/ssb.md`. How work is handed
to a model and checked: `docs/delegation.md`. Current state in prose:
`WIP.md`.

Last re-planned: 2026-10-08 (Opus, P1: the dissection contract and data; wave 3 specced: P1b, P2, P3, DC1, POP1, IN1). Update the board in the same PR as the
work; when a wave closes, shrink its finished WPs to one line each (git
history keeps the specs).

## 1. Status board

| Phase (`docs/ssb.md` §12) | State | What remains |
|---|---|---|
| 0 Architecture, schema, validator, draft graph | **done** | — |
| 1 Walking skeleton, graph mode | **done** | — |
| 2 Variant lab | **3 of 4 dioramas** (sphenoid done with D2a) | `lateral-wall` (later) |
| 3 Reference specimen | **done** (stages B, C; Specimen stage; vessel tubes; mucosa layer; septal surfaces; incisive canal; standard specimen; floor mucosa; open airway lining; external nose) | ~~standard specimen (N1, O6)~~, ~~floor mucosa (ST2c)~~, ~~open airway lining (ST1b)~~, ~~external nose (ST6)~~ done; then waypoint corrections (ST4d), flap overlay (ST5); hand segmentation (owner, optional) |
| 4 Endoscope | **rig, exposure, collision + HUD, CT along the scope, septum rule, station poses, station flights done** (E1, E1b, E2, E2b, E3, E3b, E4, E5, E6); `t.septum-anterior` and `t.lacrimal-sac-0` posed (P1) | **poses per dissected state and the two 2.7 mm stations done** (P3, in review): 8 uncovered remain, all outside O7's corridors or intradural |
| 5 CT mode | **done** (triplanar, overlay, cursor shared with 3D; oblique slice along the scope as the scope inset, E4) | — |
| 6 Procedure mode | **P1 done** (contract `docs/ssb.md` §5.8, data `tools/ssb-pipeline/uw/dissection.json`, `removes` on 15 steps); **P1b and P2 done** (15 states in `ssb/states/` with state linings; the player; merged with the CP-3a integration fixes, #125); **P3 in review** (poses per state, the 2.7 mm shaft) | DC1 (mucosal state); CP-3 |
| 7 Self-test | not started — wave 3 | T1 |
| 8 Offline cache, performance | not started | image textures only if procedural materials fall short (`docs/ssb.md` §11) |
| 3c External nose and rhinoplasty framework (`docs/ssb.md` §6.2) | **specced** (ST7, 2026-10-07) | ST7b kit → ST7a content → ST7c diorama; ST7d specimen bony nose; ST7e fit (O7); then the rhinoplasty model (R0, planned at CP-ST7c) |
| ∞ Content | all `draft` (state: `WIP.md`) | owner review (tier 1 first); backlog §6 |

**Decided (2026-10-02):** O1–O3 answered (§2). **Verified (2026-10-03):** CP-1 and the Opus wave-1 WPs (ST0, ST3, ST4b, D1), first-passed by a Sonnet-class model, were re-checked by Opus (§4, "Opus verification of wave 1"): the fulcrum is misplaced (left one inside the septum), E3's Accept was unsatisfiable, the scope image saturates and ostia are sealed membranes, three content errors, ST3's floor cut contradicts the atlas, D1's type 4 rule is inverted. Corrective WPs are in wave 2; O4 and O5 decided the same day, and ST3r (the flap contract) and the D1 amendments are written into `docs/ssb.md`. **Next:** wave 2's Sonnet lanes (`docs/ssb-sonnet-handoff.md`).

**CP-2a (Opus, 2026-10-03):** wave 2's first PRs reviewed (§4, "CP-2a"): E2b and D2 pass; E3 passes (the lazy, shared CT load it needed was added at the checkpoint); ST2b's partial is merged as is. All four merged 2026-10-03. **O6 (owner, 2026-10-03): normal before variant** — the page serves a standard specimen (right half mirrored, septum centred; `docs/ssb.md` §5.1), which also resolves every left-side escalation of this wave. **Next:** N1, then the rest of the pipeline lane on the standard specimen.

**P1 + wave-3 plan (Opus, 2026-10-08).** P1 is done in this PR (§5 P1): a dissection state changes the CT display and label volume, not only the meshes, so collision, the tip-in-air rule and the HUD see the opened cavity (`docs/ssb.md` §5.8); the units are rules over the base's own labels, landmarks and distance fields in `tools/ssb-pipeline/uw/dissection.json`, so they re-run on any base (NasalSeg-informed or a new 16-bit head, §5.10); the 10 FESS and EEA procedures' steps now carry `removes`. A scratch prototype of the rules built the 15 states and posed 16 stations on them (every pose free, tip in air, target in field, left = right mirrored); the counts are in the data file and the poses in P3's table. Findings that change the plan: (1) the specimen has no uncinate label: the uncinate is fused into the maxillary medial wall unit, so the uncinectomy opens the infundibular trough and the natural ostium appears with the antrostomy (an 18.5 × 9 mm window, inside the graph's sourced "typically 1–2 cm"); (2) **decongestion is not what closes E5's three views**: the olfactory cleft and inferior meatus are closed to the 4 mm shaft and open to the 2.7 mm telescope even as scanned, and the 45° frontal recess opens with Draf I's entry state; (3) the specimen's nasal cross-section (1.6 cm² per side) is below the one MRI source's undecongested mean (2.8 cm²), so the decongested state is calibrated on that source's ratio (× 1.36, d = 1.0 mm of erectile mucosa); measured on NasalSeg's CTs the same way, the head is ordinary (37th percentile), so the gap is the MRI method and population, not the head; (4) `t.septum-anterior` and `t.lacrimal-sac-0` are posed (ST6 made them reachable). **NasalSeg against our segmentation (owner's question, checked the same day on the 91 distinct clear subjects; `docs/ssb.md` §5.10 "Label conventions"):** for the five structures NasalSeg labels, ours hold: the difference is convention (its cavity includes the vestibule and the partial-volume rim, a median 26 % of its voxels above our air threshold), not quality; at one convention head A's cavity is at the 42nd percentile, its maxillary sinus at the 51st, and our labels leave less adjacent air unlabelled. NasalSeg cannot check the ethmoid partitions and the uncinate the FESS units stand on (it does not label them). NasalSeg (#119, open) is folded in as population data (placement, calibration, a reference "averaged normal") and its scans as future 16-bit heads (IN1). **Next, in order:** lane P runs **P1b** (the states) while lane V runs **P2** (the player, on a fixture); then **P3** (poses per state, the 2.7 mm shaft), then **DC1** (mucosal state); **IN1** after P2; **POP1** after #119 merges; lane B continues ST4d → ST5. **CP-3** (Opus) after P1b, P2 and P3. Owner: O8–O11 (§2), tier-1 FESS anatomy, and the P1 checks (§2).

**O7 re-plan (Opus, 2026-10-08).** Merged 2026-10-07: ST6, E6 and C1a–C1f (C1 had an Opus first read, but neither ST6 nor E6 had an Opus checkpoint). The owner's priority (O7) is clear anatomy for FESS and for EEA to sellar/clival masses; everything else waits. Of E5's 27 `uncovered` stations, **22 need a dissection step** (uncinectomy, bulla, basal lamella, antrostomy, sphenoidotomy and posterior septectomy, sella open, Draf), **3 need decongestion** (olfactory cleft, frontal recess 45°, inferior meatus 45°) and **2 waited on ST6** (septum anterior, lacrimal sac). Procedure mode is therefore the lever for both FESS and sellar/clival views. **Next, in order:**
(1) **P1** (Opus), scoped to FESS (uncinectomy → bulla → basal lamella → posterior ethmoid → sphenoidotomy → frontal recess, plus the antrostomy) and the transsphenoidal → sellar → transclival corridor. Per step, `removes` maps to existing wall and air nodes. It must also decide how a dissected state becomes geometry: hiding meshes is not enough, because stations need the tip in air and collision is read from the volume (see P1/P2).
(2) **P2** (Sonnet): the procedure player.
(3) Opus poses for the stations each dissection state opens, plus `t.septum-anterior` and `t.lacrimal-sac-0` now that ST6 is in.
(4) A decongestion WP (Opus spec) for the 3 closed views.
(5) **ST4d** for the carotid and other sweeps on the sellar/clival route.
(6) **ST5** (the flap overlay; reconstruction is part of EEA).
Owner in parallel: verify tier-1 FESS anatomy (nothing is `verified` yet). Deferred: T1, ST7, more pathology content, the C1 flags (§2). Open from ST6 (#116): valve area 116 mm² against 92–100; the re-seated superior labial branch waypoints.

**Realistic anatomy (Opus, 2026-10-07):** plan in `docs/realistic-anatomy.md` (four anatomy states, resegmentation, UW-page and Radiopaedia exemplars); the owner answered its §13 on 2026-10-07; POP0 (NasalSeg statistics) is done, the rest of its WPs join this board as they start.

**ST7 spec (Opus, 2026-10-07):** the external nose to the full rhinoplasty framework (O2's end state) is specced as the `nasal-framework` diorama (`docs/ssb.md` §6.2): framework, envelope in Letourneau–Daniel layers, vessels and the external nasal nerve placed by layer, and three rules computed from the solids (tip tripod, what a dissection plane carries, thick skin hiding the domes), sourced from 45 PubMed records (abstracts read where PubMed has one; table in WP ST7a) with their disagreements listed. Five WPs (ST7a–e, §5) and two owner decisions (O7 where it is drawn, O8 where the defaults come from). **Next:** ST7b can start now (lane A); ST7a after ST6 merges; ST7d after ST5 in lane B.

**E5 + ST1c (Opus, 2026-10-07):** ST1c reviewed (pass: the lining pack is deferred until the first look from within; `test-ssb` 589/589). E5 done: 7 of 40 stations posed on the specimen (13 sided poses), 27 `uncovered` with the reason, 6 overviews; both earlier pinned poses had the tip in tissue (§5 E5). E6 is rewritten around the file's `target` field, and **C1** is specced as six batches. **Next:** lane B ST6 → ST4d → ST5; lane C E6 (parallel with ST6: only `test-ssb.mjs` is shared); content lane C1a…C1f.

**CP-2c (Opus, 2026-10-07):** E3b, ST2c and ST1b reviewed (§4, "CP-2c"): all three pass and are merged with CP-2b. CI on CP-2b was red from a test race (the lazily loaded collision volume and the store's 250 ms hash write), fixed in the tests. **Next:** lane B runs ST6 (the external nose), then ST4d, then ST5; Opus does E5 (station poses) — E3b and ST1b are in; follow-up WP **ST1c** (load the lining pack lazily) is small and runs first in lane B, before ST6 (same file, `mode-specimen.js`).

**CP-2b (Opus, 2026-10-05):** D2a, E4 and N1 reviewed (§4, "CP-2b"): all three pass. One defect found on the merged state: two thirds of the septum has no voxel at the bone level, so the shaft can be swung through it into the other cavity — corrective WP **E3b**. ST6 (the external nose) is specced. **Next:** lane B continues (ST2c → ST1b → ST6 → ST4d → ST5; ST6 is new in the lane), lane C runs E3b; Opus does E5 after E3b and ST1b.

## 2. Owner — decisions and actions

Decisions (detail and recommendations: `docs/ssb.md` §13). **O1–O3 were decided by the owner on 2026-10-02, each as recommended**, with the O2 addition below:

| ID | Question | Recommended | Blocks |
|---|---|---|---|
| O1 | Where the **external nose** comes from: the specimen's own nose (unmask a nose-only box), a parametric nose diorama, or both | Both: specimen skin surface for the naris and ala (real n = 1), cartilage as a schematic overlay — if ST6-0 shows the nose is in the field of view | ST6 — **decided** |
| O2 | How much **nose**: entry anatomy only (vestibule, valves, ala, columella — the scope's fulcrum and walls), or the rhinoplasty framework too (ULC/LLC crura, ligaments, SMAS) | Entry anatomy now; framework later, as its own diorama. **Decided:** entry anatomy now; the full nasal framework is the intended end state, logged as task ST7 | ST0 scope, ST6 — **decided** |
| O3 | **Content authoring split**: Sonnet drafts backlog content and checks citations, Opus reviews adversarially (cheaper) — instead of Opus authoring | Yes for the §6 backlog; Opus keeps authoring anything that places geometry (vessels, flaps, stations). **Decided: yes** | C1 — **decided** |
| O4 | **Scope diameter** modelled by the endoscope's collision ring | 4 mm (the standard adult telescope), 2.7 mm selectable | E3 — **decided 2026-10-03: as recommended** |
| O5 | NSF superior incision | (recommended: margin per design) | ST3r — **decided 2026-10-03: the superior incision starts at the level of the floor (inferior margin) of the sphenoid ostium, for every design** (Geltzeiler's technique; ch. 31 starts at the ostium's superior aspect, the graph's step at its inferior margin — the owner chose the latter). The margin below the septal top keeps one default (15) and applies where the incision rises forward (designs B, C) |
| O6 | Symmetric "normal" specimen for the first release, variants later | (owner's own instruction) | N1 — **decided 2026-10-03 by the owner: as symmetric and standard as possible; septal deviation, ostium heights etc. later as variants.** Opus chose the method: right half mirrored (the left carries the anomalies), septum centred keeping its measured thickness (`docs/ssb.md` §5.1) |
| O7 | Where the **nasal framework** is drawn: variant lab only, fitted under the specimen's skin, or both | Both, the lab first (`docs/ssb.md` §13) | ST7e — **open** |
| O8 | Where the framework's **defaults** come from: mixed populations each labelled, Caucasian-series only, or a population switch later; modal or textbook variant classes | Mixed and labelled now, a switch later; modal classes | ST7c defaults — **open** (ST7c builds on the recommended defaults meanwhile) |
| — | Still open from before: strict CSP; publish while `draft`; name | as in §13 | — |
| O7 | **Content priority** and the C1 calls | — | **Decided 2026-10-07 by the owner:** the priority is clear anatomy for FESS and for EEA to sellar/clival masses; other content waits behind it. C1f stays as the evidence shows (the prior-SPA-ligation check on the middle turbinate flap is kept). The C1c categories are accepted (LCH `malignant-neoplasm`, optic pathway glioma `benign-neoplasm`). Problems found in existing entities are **flagged, not fixed** for now (list below) |
| O8 | **What "edema" means in the mucosa toggle** (`docs/ssb.md` §5.9) | Decongested · as scanned · congested, the congested end from NasalSeg (physiological); the mucosal edema of rhinosinusitis is a condition (PR #119's pathology layer) | DC1's labels and its congested half |
| O9 | **"Averaged normal anatomy"** from NasalSeg (§5.10) | A population reference beside the head now (percentiles, median cross-section profile, a mean-shape ghost of the 5 NasalSeg structures: population truth); a head deformed toward the median only later (composite, 5 structures only) | POP1's scope; a later WP |
| O10 | **Posterior septectomy extent** in the EEA states | 15 mm (the middle of the graph's 1–2 cm), from the choanal arch up, well behind the MT heads: confirm the inferior limit | P1b (it runs as written; a change is one data line) |
| O11 | **FESS on both sides at once** in procedure mode | Yes now (the scope picks the nostril); one dissected side beside an intact one later (per-side lining packs) | P1b, P2 |
| O12 | **A voxel-level check of head A against a NasalSeg-trained model** (WP SEG1) | Not now: it adds PyTorch / nnU-Net to the offline pipeline and hours of compute, and the distribution check found no defect in the five structures NasalSeg labels; the approximate structures (ethmoid, uncinate) are outside its labels, so the resegmentation (#119 RS) is the better spend | SEG1 |

Flagged by C1 (owner 2026-10-07: keep as flags; fix later, FESS/EEA anatomy first). Each was found against the entity's own source or an open reproduction; detail in skflx/skflx.github.io#117:

- `c.kadish`: class C's "(in the original system also cervical or distant metastasis)" is not supported. The original C has no metastasis; D is Morita's.
- `c.dulguerov`: T3 "without dural invasion" is the *modified* system's wording, blended into the original.
- `c.hyams`: grade III matrix ("scant or absent" vs "may be present") and grade IV rosettes differ from the original table.
- `c.kadish`/Morita: the "32 vs 15 patients" split is not in the Morita abstract.
- `c.jna-radkowski`: IIB, IIC, IIIA and IIIB wording differs from an open reproduction; the original's criteria were not readable.
- `c.infraorbital-canal`: type 2/3 wording, "on coronal CT" and "larger sinuses" are not in the cited Ference abstract.
- `s.petrosphenoidal-ligament`: insertion given as "lateral dorsum sellae"; sources say the posterior clinoid process.
- `dz.smarcb1-deficient-carcinoma`: "no feature separates it from SNUC" on CT, with no source for it.
- `s.gyrus-rectus`: "medial to the olfactory sulcus and tract" rests on a chapter citation only; no source read places the tract in the sulcus.
- Back-links not yet added: ICA and Meckel's cave to the new parasellar ligaments and the carotid cave; gyrus rectus to the olfactory sulcus; the cellulitis conditions to `s.orbital-septum`; `dz.subperiosteal-orbital-abscess` to `m.spoa-drainage-volume-threshold`.

Actions (no model can do these):

- **P1 checks (2026-10-08):** look at the dissected states once P1b lands (CP-3 lists the URLs). Specifically: the uncinectomy (`docs/ssb.md` §5.8: the uncinate is fused into the medial wall unit, so the step opens the infundibular trough and the natural ostium appears with the antrostomy); the antrostomy window (18.5 × 9 mm on the prototype); the sellar opening's lateral limit (the ICA tube, 29 % inferred, plus 1 mm); O10.
- **ST6 items (CP-ST6, §4):** the valve plane at A −10 (its section profile is flat, so the plane is weakly determined; glance at it on CT); whether the superior labial branch should be drawn into the columella (it stays truncated at the valve plane until you say).

- Review the two dioramas' schematic proportions and tier-1 graph content;
  flip `review` to `verified` where right.
- ~~Record the UW authors' written permission beside `ssb/LICENSE-data.md`~~ — done 2026-10-07 (email; terms recorded there, the email itself stays with the owner).
- Look at the specimen's AEA–PEA spacing (21 mm vs population 12; inferred
  PEA).
- ~~Read Table 31.2 in print~~ — done 2026-10-03 (owner's photos; see §4).
- ~~Judge the choanal airway height~~ — done 2026-10-03: ~14 mm is plausible
  (the range is broad, larger in men than women).
- For ST7 (optional, raises confidence): full texts of Daniel & Palhazi
  2018 and Daniel 2014 (how the dome–ASA offsets and the lateral crus
  orientation were measured), Çavuş Özkan 2020 (the Caucasian envelope
  thicknesses by site, which could replace the Asian defaults, O8),
  Letourneau & Daniel 1988 (layer thicknesses), and a sourced definition
  of cephalic malposition with a threshold.
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

**O1 evidence, second pass (soft tissue of the nose).** Sources: Radiopaedia's nasal-cavity, septum, cartilage and bone articles (qualitative anatomy only: five named cartilages, the columella as the visible septum, the dual arterial supply) and PubMed. **Radiopaedia scans were not examined:** the site is readable only as text through the fetch tool here (scripted downloads return HTTP 406, PubMed Central full texts return a reCAPTCHA), and I did not work around either, so the "look at other scans for averages" step is not done; the owner can supply specific cases or open the PMC full texts. What the unmasked UW sagittal stack gives for this specimen (n = 1, landmarks picked by profile curvature, about ±2 mm and ±8°): nasion to pronasale ≈ 54 mm, nasion to subnasale ≈ 57 mm, the tip 13 mm in front of the subnasale, nasolabial angle ≈ 89°, nasofrontal angle ≈ 138°; in the axial stack the tip is 18 mm in front of the ANS row. **Cannot be compared with population norms yet:** the normative values in the papers found (a Brazilian series of 100 Caucasians, a Korean series of 21) are not in their abstracts, and the Korean abstract's nasolabial angles look transposed. One quantitative anchor is verified: the internal valve is 10–15° (a hypothesised true value, n = 24). For the endoscope, pronasale 18 mm in front of the ANS puts the nostril aperture a little behind and below the tip, so `lm.naris` at A ≈ 0 is plausible but probably 5–10 mm too far back; the specimen could place it properly and this was not done.

**Opus verification of wave 1 (2026-10-03)** — adversarial re-check of
CP-1, ST0, ST3, ST4b and D1 in the handoff's order. The first-pass text
above and in each WP is kept as written; what this pass found, and what it
changes, is here and in each WP's *Verification* line. `node
tools/test-ssb.mjs` passes (405/405) and `check-data` passes; the findings
are about anatomy and spec, which the suites do not test. Method: the
committed `ssb/ct/` volume and labels, the unmasked UW axial stack
(fetched from the UW site, reachable from a session; resampled through
`registration.json`'s frame), screenshots of the scope stage, the Chiu ESS
atlas ch. 31 (owner's Drive) and the PubMed abstracts of the ST0 sources.

*CP-1 flags*

- **(a) `lm.naris` is wrong, and on the left it is inside tissue.** In the
  unmasked stack E1's points sit at the internal valve level (S 10), not
  the nostril: the right one is in air in a lumen only ~4 mm wide (R 1–4),
  the left one (R -0.99) is in the caudal septum (display 110, soft
  tissue; the vestibule lumen there is R -4…-7). The nostril — the
  vestibule lumen at the alar-rim level, enclosed between columella and
  ala, opening downward — is at about **R (7, 4, 4)** and **L (-7.5, 4, 4)**
  (±2 mm; lumen A -2…+12, S 3–5; columella centred at R ≈ -1.5). So the
  fulcrum is ~4 mm too far back and ~6 mm too high, not "5–10 mm too far
  back". Corrective WP **E1b**.
- **(b) CP-1's "a 3 mm scope passes" is false under its own rule.** With
  the E1 fulcrum and the ring at 1.5 mm, no collision-free pose brings the
  tip within 2 mm of `lm.sphenoid-ostium.R` (best 3.2 mm): CP-1's pose
  (yaw -3, pitch 15) is blocked at 19.5 mm, where the upper ring point
  grazes the bony septum (display 150–169, label `s.nasal-septum.M`) — the
  axis hugs the septum because the fulcrum is at the narrow internal valve.
  E3's real-specimen Accept is therefore unsatisfiable as written. From
  the measured nostril the trajectory is lower and more lateral, and the
  sphenoid ostium is reachable: 4 mm shaft (r 2.0) R 1.4 mm at yaw -4,
  pitch 20, depth 59; L 2.4 mm at yaw -1, pitch 22, depth 64 (3 mm shaft:
  1.2 / 2.1). **Decision: model the standard adult 4 mm telescope (r 2.0),
  2.7 mm selectable** — owner may overrule. CP-1's threshold-78 claim
  checks out (no pose from either fulcrum reaches the ostium).
- **(c) Choanal arch and the posterosuperior hole.** The arch landmark
  (S 12) is the top of the airway; the bony roof (vomer ala / sphenoid
  body) is at S ≈ 14 at A -58…-61 and the nasal floor at the PNS is S ≈ -2,
  so the choanal airway is ~14 mm high in this specimen — real for n = 1,
  low against the usual adult figure (owner to judge). The posterosuperior
  "hole" (A -45…-35, S 28–33) is a **segmentation limit**: the olfactory
  cleft there is a 0.5–1 mm air slit either side of a perpendicular plate
  too thin to reach display 150, and the left and right nasal-cavity labels
  touch across the midline over 52 mm² centred at (0, -44.5, 30.8). Not a
  perforation. Consequence for ST3 below.
- **(d) Poses.** The sphenoid trajectory from the measured nostril
  (ostium 56 mm from the ANS at 26° above the Frankfort-parallel plane on
  the right, 62 mm / 28° on the left) is in the range taught; reassurance,
  not verification. The frontal ostium is reachable by line of sight, not
  by the shaft: from a collision-free pose a 70° view reaches it on both
  sides (17–22 mm away), 45° and 30° only on the right — what the scope
  mode exists to teach.

*New findings on screen (not in the handoff)*

- **The scope's image saturates.** At CP-1's own sphenoid pose (`#scope=
  R,52,-3,15,0,0`) the field is a uniform white disc; at 42 mm half the
  field is white, and a 30° view shows a hard-edged white wedge. The
  spotlight has a fixed intensity with inverse-square falloff and no
  exposure control, so anything within a few mm of the tip clips. The
  page test passes only because it checks a 40 mm straight pose.
  Corrective WP **E2b**.
- **Ostia and choanae are sealed membranes.** Every air compartment is
  meshed as its own closed surface (marching cubes per label in
  `meshes.py`), so where two compartments meet there is a double wall:
  nasal cavity | nasopharynx (179 mm² right, 68 left — the choanae), nasal
  cavity | sphenoid (11 mm², the right ostium), nasal cavity | maxillary,
  | frontal recess, | posterior ethmoid, left | right cavity (52 mm²). Drawn
  as opaque mucosa from inside, the scope cannot look through an ostium or
  the choana. Corrective WP **ST1b**. Also: the left sphenoid ostium is not
  patent in the air segmentation (no left cavity | sphenoid interface; the
  landmark sits inside the sinus), i.e. mucosa closes it in this
  non-decongested scan; bone-only collision lets the shaft through.

*ST0 content* (checked against the atlas chapter and every new PubMed
abstract; titles, authors, PMIDs and DOIs match)

1. **`m.itf-area` is traced, and does not hold up.** Atlas Table 31.2's
   2.4 cm² carries reference 47 — Harvey, Sheahan, Schlosser 2009,
   *Inferior turbinate pedicle flap for endoscopic skull base defect
   repair*, Am J Rhinol Allergy 23:522 (PMID 19807987,
   doi:10.2500/ajra.2009.23.3354) — not Fortes 2007. That abstract gives a
   length of 54.0 ± 4.9 mm and a distal-third width of 22.1 ± 3.7 mm (9
   cadaver heads), which cannot make 2.4 cm². Replace with Harvey's
   dimensions as the primary value; keep the table figure only as an
   unresolved discrepancy (the PDF's text layer garbles that table: owner
   to read the printed page).
2. **`p.middle-turbinate-flap` preop misattributes the pedicle risk.**
   Table 31.3 lists prior sphenoid surgery and posterior septectomy
   against the *septal* branch (NSF); the middle turbinate flap is listed
   as excluded when the internal maxillary artery is unavailable
   (infratemporal fossa surgery or tumour). Rewrite the check.
3. **`s.incisive-canal` is resolved in the specimen**, contrary to its `ct`
   text: on the midsagittal plane a soft-tissue-density channel runs
   through the anterior maxilla from the nasal floor at about A -18, S -3
   to A -13, S -12, with paired upper limbs near R ±2. It should be a
   landmark, and the nasopalatine sweep should end on it (ST4b, 4 below).
4. Everything else read as cited: the flap steps follow ch. 31 closely
   (ITF, MTF, NSF incisions), Zhang 2014 (dominant branch below the ostium
   plane; 61.5 %, 65.4 / 34.6 %), Pinheiro-Neto 2011 (17.12 cm², 9.3 mm,
   71.4 %), Peris-Celda 2013 (20 mm, 774 mm², 27 sides), Bleier 2011,
   Gras-Cabrerizo 2014/2016, Prevedello 2009, Bloom 2012, Jung 2000,
   Toriumi 1996. Denominators in the new `v.*` are stated, and where an
   abstract lacks one the entry says so. Two soft spots, left as is: the
   atlas supports "Asian septal area may be smaller" only with a
   rhinoplasty paper (its ref. 33), and `v.psa-bifurcation-site` mixes
   two definitions of "level" (near the foramen vs lateral to the ostium)
   in one variant — both are labelled in the notes.

*ST3 flap contract*

1. **The inferior incision contradicts the atlas** *(overstated — corrected by Fig. 31.3, see "Owner answers" below)*. Ch. 31: from the
   choanal arch "turn toward the floor of the nose and move laterally
   until the desired width is achieved", then cut forward along the floor.
   The standard flap takes a strip of floor; the extended (Peris-Celda)
   flap adds the rest of the floor and the inferior meatus. ST3 cuts at
   the septum–floor junction and treats any floor as extended-only. This
   needs a floor chart (WP **ST2b**) and a `floor_width` parameter.
2. **The 7.5 / 8.5 cm² vs 17.12 cm² gap is mostly construction**, not a
   small septum: the masked vestibule truncates the chart ~10 mm short of
   the mucocutaneous junction, `top_margin` 15 leaves the upper 15 mm, and
   the floor strip is missing — each worth a few cm² on this septum.
   Pinheiro-Neto 2011's abstract recommends adding floor mucosa for width,
   so its 17.12 cm² is probably septum-dominant; whether it includes floor
   stays unknown from the abstract.
3. **`top_margin` should depend on the design.** The atlas leaves 1–2 cm
   only when the defect is sella/planum (the short flap); for a
   transethmoid resection olfaction is lost anyway. Proposed: short 15,
   full/extended 10 (both schematic) — owner's call (olfaction).
4. **The pedicle test is circular.** ST4b put the PSA's first point at the
   middle of the very strip the test checks. The test should use an
   independent position: 9.3 mm below the ostium (`m.psa-to-sphenoid-ostium`)
   — inside the default pedicle on both sides (R S 14.9, L S 19.3).
5. **No-data gap:** `top(a)` is undefined over A -45…-35 (the hole in
   (c)); the superior cut must interpolate `top(a)` across it, or it will
   notch down to S 28.

*ST4b waypoints* — the handoff's "PSA start is numeric" is not so: it is
the midpoint of the ostium–arch strip. Use `m.psa-to-sphenoid-ostium`
(9.3 mm below the ostium) for the start. The nasopalatine end is placed by
borrowing Bleier's BAS flap length (a 9-patient mean of a flap's length on
the midline, not a canal position) and lands ~6 mm in front of the
canal the specimen shows; re-anchor it on the canal. The AEA entry's
+5.5 mm S offset has no source (Gras-Cabrerizo gives only the AP
distance, from the axilla, which the specimen approximates with the
turbinate head). Corrections: WP **ST4d**.

*D1 sphenoid spec* — **amendments, binding for D2** (folded into
`docs/ssb.md` §6.1 the same day, rules 0–9):

1. **Rule 4, type 4, is inverted.** DeLano type 4 (the graph's own
   criterion) has the nerve *lateral* to the posterior ethmoid
   (sphenoethmoidal) cell, i.e. in the Onodi cell's lateral wall: the cell
   lies **medial and/or superior** to the nerve, not lateral.
2. **"Circumference facing air" is undefined for a covered canal.** Define
   it as the share of the canal's circumference whose outward normal
   reaches sinus air within the wall thickness + 0.5 mm; dehiscence sets
   the wall to 0 over that arc. Rules 2 and 4 use this definition.
3. **Rule 1's "a few mm" needs a number**: conchal leaves ≥ 8 mm of bone
   between sinus air and the sella (schematic, stated in the header).
4. **Rule 2's 0.5 threshold** is the DeLano type 3 criterion transferred to
   the ICA; `v.ica-protrusion` itself only says "often defined as", with no
   source. Keep it as a labelled diorama convention, not a graph value.
5. **Impossible combinations degrade, all of them, by one table** (not
   just conchal + protrusion): with `conchal`, ICA protrusion/dehiscence,
   optic types 2–3, vidian type 1 and a lateral recess are unavailable;
   optic type 3 needs at least `sellar`. The HUD says what was degraded.
6. One parameter per preset — agreed.

*E3 spec* — revised again (below): 4 mm shaft, the fulcrum from E1b, the
real-specimen Accept as a search rather than CP-1's pose, and the frontal
line-of-sight check.

*Owner answers and the printed chapter (2026-10-03).* O4: 4 mm, as
recommended. O5: the superior incision starts at the floor of the sphenoid
ostium for every design (§2). Choanal airway ~14 mm: plausible. The
owner's photos of ch. 31 settle three points read from a garbled text
layer:

- **Table 31.2 does print "2.4" with reference 47** (Harvey 2009) for the
  inferior turbinate flap. The discrepancy with Harvey's own 54 × 22 mm is
  therefore the atlas's, not the extraction's: ST0d keeps Harvey's
  dimensions as the primary value and the table figure as a flagged,
  cited secondary. The same table gives the middle turbinate flap's range
  as transplanum to **transsellar** (not transodontoid) and the
  contralateral transposition septal flap as ethmoidal-artery based.
- **Table 31.3 confirms the middle turbinate flap finding**: the internal
  maxillary artery row excludes the posterior septal, inferior turbinate,
  nasal floor and middle turbinate flaps; sphenoid surgery and posterior
  septectomy appear only under the septal branch.
- **Fig. 31.3 corrects ST3 finding 1 above, which overstated it.** The
  basic (A) and anterior-extension (B) flaps are septal in the figure; the
  floor is the lateral extension (C). The first pass's junction cut for
  short and full was therefore consistent with the figure; what it lacked
  was drawing C's floor on a chart instead of a readout. The text's "move
  laterally until the desired width" is how C is cut. Fig. 31.3 also shows
  A's superior border level at the ostium and B's rising toward the top of
  the septum anteriorly — ST3r encodes both.

**Wave 2** (re-planned 2026-10-03 after the verification above). Three
lanes; inside a lane the WPs share files and run in order, the lanes run in
parallel sessions.

| Lane | Order | Who |
|---|---|---|
| Pipeline (`tools/ssb-pipeline/uw/`, `ssb/geometry/`, `ssb/models/`) then the overlay | ~~E1b~~ → ~~ST2b~~ (partial; rest in ST2c) → ~~N1~~ standard specimen (O6) → ~~ST2c~~ floor mucosa → ~~ST1b~~ open airway lining → ~~ST1c~~ lazy lining → ~~ST6~~ external nose (merged 2026-10-07) → **ST4d** waypoint corrections (reruns ST4c) → **ST5** soft-tissue panel + NSF overlay | Sonnet |
| Scope runtime (`js/ssb/*endoscope*`, `scope.js`) | ~~E2b~~ → ~~E3~~ → ~~E4~~ → ~~E3b~~ → ~~E5~~ → ~~E6~~ station flights (merged 2026-10-07) | Sonnet |
| Content and dioramas | ~~ST0d~~ · ~~D2~~ → ~~D2a~~ → ~~C1~~ content backlog (O3; merged 2026-10-07, owner priority O7: FESS + sellar/clival EEA anatomy) | Sonnet |
| Specs | ~~ST3r~~ (done 2026-10-03) · ~~ST6 spec~~ (CP-2b) · ~~E5~~ station poses (2026-10-07) · **P1** (O7: FESS + sellar/clival dissection states) → poses for newly opened stations → decongestion spec | Opus |

**ST5** (flap overlay and soft-tissue panel) closes the pipeline lane
after ST4d: its contract (ST3r) is written.

O4, O5 and the two owner checks were answered on 2026-10-03 (§2, §4).

**CP-2a — wave 2's first PRs (Opus, 2026-10-03).** Diffs read, every
suite run on each branch (E3 branch, which contains E2b: `test-ssb`
435/435; D2: `--only lab` 97/97; all `check-data` 75/75). Merged before
this pass by the owner: ST0d (#97: the texts match the WP; one content
question below) and E1b (#98: 0.9 and 0.5 mm from the verification's
estimates, E1's values kept as `superseded`).

- **E2b (#99) — pass.** Tuning K and the fill to the Accept, not to the
  old 40 mm look, is accepted (the old look clipped). The raycast runs at
  most once per moved frame, but during a drag that is every frame, at
  10–17 ms on the CPU: E4 (same file) exposes on settle (debounce
  ~100 ms after the last pose change) instead.
- **E3 (#102) — pass, one required change before merge.** The endoscope
  mounts at page boot and immediately fetches and decodes the CT, the
  labels and five distance fields (~4.4 MB transferred, ~27 MB decoded:
  209×225×193 voxels as u8 plus u16) for every visitor, scope or not, and
  CT mode then loads its own second copy. Required: load on first engage,
  and share one volume between CT mode and the scope (a memoized loader in
  `volume.js`). **The left sphenoid ostium item (3.31 mm, not ≤ 2.5)** is
  not relaxed and 2.7 mm is not substituted: the standard specimen (N1)
  makes the left side the right's mirror, where the right's pose reaches
  2.03 mm; N1 deletes the OPEN pin and pins both sides. Accepted as is:
  rotation that would hit bone pulls the scope back silently (the HUD says
  "Bone limits the depth"); the HUD in the controls panel (a stage overlay
  needs CSS: E4 or later); the pasted-link test's new pose.
- **ST2b (#101) — merge as a partial.** The incisive-canal tie-break
  (midline-most of four candidates) is confirmed: the canal is a single
  midline trunk below its paired nasal openings, so a `.M` point belongs on
  the trunk; its S is the box top (a lower bound) and within the Accept.
  `registration.json` losing its `naris` block is outside Touch but the
  right consequence of `softtissue.py` no longer writing `lm.naris`.
  Escalation 1 (floor chart) is decided as option (a), on the standard
  specimen: the 1–3 mm of soft tissue between floor bone and air *is* the
  floor mucosa, so the surface is the airway's, not the bone's — WP ST2c.
  The small left floor unit is a left-side labelling gap that N1 removes
  from the served specimen. Escalation 2 (left ostium margin): N1 mirrors
  the right's 23.5 mm.
- **D2 (#100) — pass; merge after bringing master in (stamp-only
  conflicts).** Gap 1 decided: presellar air ends in front of the sella's
  anterior wall, so a carotid share of 0 there is the anatomy; presellar
  joins rule 9's table for protrusion and dehiscence (`docs/ssb.md` §6.1
  amended; WP D2a). Gap 2: judging a carotid segment only where the class
  reaches it is the rule now (paraclival from postsellar). Gap 3: "no
  effect = takes its default, HUD names it" is the rule now. The DeLano 4
  preset also turns the Onodi cell on: accepted, type 4 is defined by the
  cell.
- **Content question (C1, first item).** ST0d's middle turbinate flap
  check now names only the internal maxillary artery, as the WP said; but
  the flap's pedicle is the middle turbinate branch of the sphenopalatine
  artery, so prior sphenopalatine ligation plausibly endangers it too.
  Not in Table 31.3; needs a source before it goes back in.

Merge order: #99 → #102 (after its change) → #101 → #100. Each later
one then has stamp-only conflicts: take either side and rerun
`node tools/stamp-assets.mjs` (`docs/delegation.md` §6).

**CP-2b — D2a, E4, N1 (Opus, 2026-10-05).** Diffs read; the three
branches merged together (stamp-only conflicts, restamped) and every suite
run on the result: `check-data` 79/79, `smoke-pages` 10/10, `test-ssb`
565/565. Screens checked: CT in three planes at the sphenoethmoidal
junction, the maxillary level and the floor (symmetric about R = 0, septum
centred, the standard-specimen note shown), and both mirrored sphenoid
poses in the scope.

- **D2a (#105) — pass.** The presellar branch is rule 9 as amended; the
  optic type 3 → 2 behaviour moved into it unchanged.
- **E4 (#106) — pass.** Accepted as reported: `#at=` left in the hash
  after leaving the scope (the cursor is shared state by design; the scope
  link itself stays pose-only); pointer capture (a release outside the
  canvas left the drag stuck and would have blocked exposure for ever);
  the out-of-range-link test accepting a bone-clamped depth (the race is
  pre-existing; yaw, pitch and roll are still pinned); the inset's
  129 px × 0.5 mm. Minor, not blocking: the inset reads `--signal` when it
  paints, so a theme flip recolours the shaft only at the next pose change.
- **N1 (#107) — pass.** The midline gate and frontal-table exemption are
  the owner's (2026-10-05). The WP's "yaw negated" was my error: yaw is
  side-relative, so the mirrored pose has the same yaw, as the executor
  found; the WP text is corrected. The frontal-recess plate given the nasal
  septum's label is right (it is the olfactory-cleft contact). Accepted:
  `normalize.py labels` re-mirroring `walls.py`'s scan-order ties.
  *For E5 and P1:* the four one-sided `.L` landmarks kept as scanned sit
  in the mirrored half, up to 4 mm off its surfaces — use them as
  approximate, or mirror the structure's `.R` partner if one is added.
- **Found on the merged state — corrective WP E3b.** E3 blocks only at
  bone (display ≥ 150). On the standard specimen, of the 6185 (A, S)
  columns where both nasal cavities face the septum, 4108 have no voxel at
  that level (median thickness 3.5 mm, median maximum display 118: the
  cartilaginous septum and mucosa), and the midline plates N1 adds are at
  display 138. A shaft swung medially therefore passes through the septum
  into the other cavity. E3b adds the rule that a rigid scope stays on its
  own side of R = 0 except in the nasopharynx.

Merge: one PR (CP-2b) carries the three branches merged with the
stamps regenerated, plus this record; merging it merges #105–#107.

**CP-2c — E3b, ST2c, ST1b (Opus, 2026-10-07).** Diffs read against
each WP's Spec and Accept; the three branches merged onto CP-2b
(stamp-only conflicts in code, restamped; roadmap and handoff tables
hand-merged) and every suite run on the result: `check-data` 79/79,
`smoke-pages` 10/10, `test-ssb` 585/585.

- **CI, CP-2b and E3b — a test race, fixed in the tests.** Both PRs were
  red on CI only (local runs pass): the pasted-link checks read
  `location.hash` (and, in E3b, the pose) a few frames after engage, but
  the clamp needs the collision volume, loaded lazily since CP-2a, and the
  store writes a scope-sourced hash 250 ms after the last change
  (`main.js`). The checks now wait for the volume and then for the hash;
  the asserted values are unchanged.
- **E3b (#109) — pass.** `shaftClearance` is the Spec: midline blocks on
  axis or ring with s·R < 0 unless A < arch.a and S < arch.s; `by`
  reports bone or septum, and the HUD line follows it. Pinned sphenoid
  and frontal poses unchanged. Pin changes listed as the Don't asks:
  `L,30,−10,…` now clamps at 26 (it swings medially), and the NaN/no-data
  check uses a straight-posterior pose. The fixture file untouched is
  accepted (the midline tests run in synthetic air).
- **ST2c (#111) — pass.** 3.82 cm² per side, second component 0.40 cm²
  (dropped, under the limit), interior round trip 0.24 mm, junction
  0.64 mm for A ≥ −47. The executor excluded the PNS end (A −49, −48:
  3.09 mm, where the septal chart's own edge cells are partly covered) from
  the Accept on its own; accepted because it is recorded in the chart's
  `junction.rows` — **ST5 must not trust junction rows with a < −47**
  (design C's posterior floor extension: take the floor chart's own medial
  edge there). The medial bound is the normal rule plus the cavity label,
  not an explicit `bottom(a)` clip; the junction number shows it holds. The
  floor stops at A −12 because the floor bone does (the anterior floor is
  ST6's).
- **ST1b (#110) — pass.** Union surface, 50 000 triangles, 469 KB,
  membrane count 0. Both Accept rays were replaced, for reasons that hold:
  the sphenoid ray started in tissue (the recess is a cleft), so the test
  casts 41 rays from cavity air near the interface (lining → sphenoid
  sinus, shells → nasal cavity, every time); the choanal pose's tip sat in
  the inferior turbinate's tail after N1, re-pinned to `R,40,−4,3,0,0`
  (lining's first hit A −55.4, past the PNS). *Not reproduced:* the
  result's "left sphenoid ostium still closed in the labels" — on the
  merged labels the volume is mirror-symmetric (99.99 % of voxels after
  the R↔L label swap) and the left sphenoid | nasal-cavity interface is
  the right's (20 face-adjacent voxels each); E5 checks it on screen.
  *Follow-up (not blocking):* the lining pack is listed in `packs.json`
  and so loads for every specimen visitor, though it is drawn only from
  within — WP **ST1c**.
- **Note for E5.** `lm.sphenoid-ostium.R` is at R 1.69: a 4 mm shaft's
  ring reaches R −0.31 at the ostium itself, so a tip *at* the ostium is
  blocked by the midline rule; the pinned pose stops 2 mm short (2.03 mm),
  which is what the station should use.

**CP-2 (Opus)** — anatomy on screen: each vessel's course against its
sources, PSA inside the flap pedicle, flap ladder against the procedure's
steps, endoscope frames at every station (through open ostia, exposure
legible), sphenoid diorama proportions and rules (with D1's amendments).
Report for the owner's review.

**CP-ST6 and E6 (Opus, 2026-10-08, with P1).** Neither had an Opus checkpoint before merging; read on the merged state.

- **Valve area, 116 mm² against "92–100": the range is withdrawn, not the measurement.** The 92–100 mm² was CP-2b's own reading of the unmasked stack under an earlier airway definition, not a literature range: `src.bloom-2012-valve-ct`'s abstract reports angles and comparisons, no area. ST6's definition (the smallest coronal section of the airway connected to `lm.naris`, vestibule and cavity together) is the documented one, and its profile is flat (112–131 mm² over A −16…−9), so the plane is weakly determined; with the cavity label alone the same plane reads 70. No claim in the graph rests on the number. Accepted as the specimen's measurement under that definition; the owner glances at the plane (§2 actions).
- **Superior labial septal branch: the re-seat is accepted.** The three waypoints moved from A −9…−8 to the chart's new anterior edge (A −10) at the same S: still the ascending segment along the anterior septal margin, which is what the entry's sources support. The columella entry in front of the valve plane is not drawn: the septal chart ends at the plane and no waypoint in front of it is sourced. It stays truncated, as its `derivation` says, until the owner asks for it (§2); ST4d does not touch it.
- **E6's stations re-checked on the merged volume** (P1's port of `scope.js`): the 13 E5 poses are free, their tips are in air labels and their targets in the field; the image shares differ from the stored ones by a few points (ray sampling), which the Node checks do not pin.

**Wave 3 — procedure mode first (O7), then the mucosa and new data.** Lanes are separate Sonnet sessions (`docs/delegation.md` §6). Rows share no **Touch** files except `js/ssb/stamps.js` and the stamps in `ssb.html` (stamp-only conflicts: `docs/ssb-sonnet-handoff.md` "Merging lanes").

| Lane | Now | Then | Notes |
|---|---|---|---|
| P (pipeline) | **P1b** dissection states | **P3** poses per state → **DC1** mucosal state | DC1 reruns the states decongested; it only turns tissue into air, so P3's poses stay free and in air |
| V (viewer) | **P2** procedure player (on a fixture) | **IN1** 16-bit heads, after P3 (shares `volume.js`, `scope.js` and `mode-endoscope.js`) | P2's real-data checks switch on when P1b's `ssb/states/index.json` exists |
| B (soft tissue) | ST4d | ST5 | ST4d moves the ICA sweeps on the sellar route: whichever of ST4d and P1b merges second reruns `dissect.py` (the guard reads the ICA field) |
| N (population) | **POP1** (#119 merged 2026-10-08) | — | fetches the NasalSeg archive into the drop zone (224 MB, Zenodo; reachable from a session) |
| Opus | — | **CP-3** after P1b, P2, P3 | — |
| Owner | O8–O12; tier-1 FESS anatomy | review the dissected states (CP-3's URLs) | — |

**CP-3a — P1b (#123) and P2 (#124) (Opus, 2026-10-08).** Read against each WP's Accept and run together (P2's real-data checks on P1b's states). Rulings on P1b's two flags: (1) the state linings indexed in `ssb/states/index.json` instead of `packs.json` is right: `packs.json` is what the specimen loads at boot, and P2 loads a state's pack from the index. (2) The guard rejected 3.8–10 % of four units' candidates (uncinectomy, antrostomy, basal lamella, Draf IIa floor), all at the orbit and AEA margins: that is the guard doing its job where those units meet the lamina and the AEA, and the prototype's `measured` counts already included it (P1b reproduces them within 3.7 %). The 1 % escalation was meant for the post-mirror guard (which rejected nothing); the P1b text is corrected below.

**CP-3 (Opus)** — after P1b, P2 and P3. Read each PR against its Accept; then on screen, per state of both corridors: the cavity in the three CT planes (preoperative scan, carved outline) and from the scope at its station; the guard (no cut within 1 mm of the ICA, optic nerve, AEA or orbit); the lamina, skull base, turbinates and the posterior table untouched; the antrostomy's size; the sellar opening's lateral edges against the carotid prominences; left = right. Write the URLs of each state for the owner's review.

Deferred (after O7's corridors work): T1 self-test; ST7; NSF in procedure mode (harvest, rotation, inset: after ST5); Draf III, transpterygoid and transplanum states; the C1 flags (§2).

**ST7 track** (`docs/ssb.md` §6.2; WPs in §5) — **deferred behind O7** (FESS and sellar/clival anatomy first); when it resumes: lane A runs ST7b
(kit only, no shared files with the other lanes except
`tools/test-ssb.mjs`), then ST7a once ST6 is merged (it maps the graph's
new `skin` kind onto ST6's material), then ST7c; C1 batches and ST7a both
append to `sources.json`, so whichever merges second keeps both sides.
Lane B adds ST7d after ST5. CP-ST7a reviews ST7a's content; CP-ST7c
reviews ST7b and ST7c, writes ST7e's final spec and plans the
rhinoplasty model (R0).

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
*Verification (Opus, 2026-10-03):* the posterosuperior hole is a segmentation limit (thin perpendicular plate, 0.5–1 mm olfactory-cleft slits), not a perforation; the left and right cavity labels touch across it.
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

### E1 — Provisional endoscope fulcrum        [done: CP-1; superseded by E1b] · Sonnet · depends: H1, ST2 (same script)
*Verification (Opus, 2026-10-03):* the points are at the internal-valve level, and `lm.naris.L` lies in the caudal septum (display 110); replaced by E1b.
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
*Verification (Opus, 2026-10-03):* the math and the tests hold; the `scene.js` deviation is accepted. On screen the image saturates near surfaces (E2b) and ostia are sealed (ST1b).
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

### E1b — Nostril fulcrum from the unmasked stack        [done: merged #98, CP-2a] · Sonnet · depends: —
Result: `nose.py` puts `lm.naris.R` at (6.55, 4.45, 4.7) and `.L` at (-7.83, 4.22, 3.76), both in air with tissue medial and lateral, 0.9 and 0.5 mm from the verification's estimates; E1's values are kept under `superseded` in the meta.
Goal: `lm.naris.R` / `.L` at the real nostril, replacing E1's schematic
points (verification (a): the left one is inside the septum).
Read: this file §4 "Opus verification of wave 1" (a); `docs/ssb.md` §3
(Endoscope), §5.7; `tools/ssb-pipeline/uw/volume.py` docstring;
`specimen.py` `frame()` and `resample()`.
Touch: new `tools/ssb-pipeline/uw/nose.py`; `ssb/geometry/landmarks.json`
+ `landmarks.meta.json` (merge, never drop keys).
Don't: change `ssb/ct/` (the face stays masked there until ST6); commit
anything from `incoming/`.
Steps:
1. Fetch the axial stack (`fetch.py`; only the axial frames are needed)
   and load it with `volume.load('axial')`. Resample the **unmasked**
   display volume with `specimen.resample` over R -30…30, A -30…45,
   S -20…40 at 0.5 mm, in memory.
2. Per side, on axial levels S 0…10: the vestibule lumen is the air
   (0 < display < 78) on that side of the columella with tissue
   (display ≥ 78) both medially and laterally within 12 mm on the same row,
   A -2…+16. The alar-rim band is the 3 mm of S where that lumen's area is
   largest. `lm.naris.<side>` = the centroid of the lumen voxels in the
   band.
3. Meta per point: method (as step 2), band S range, lumen area, and the E1
   value under `superseded` with the reason ("E1: internal-valve level;
   left point inside the caudal septum — verification 2026-10-03").
Accept: both points in air of the unmasked volume, with tissue medial and
lateral on their row; each within 3 mm of the verification's estimate
(R (7, 4, 4), L (-7.5, 4, 4)); `check-data.mjs` and `test-ssb.mjs --only
scope` pass.
Escalate: the UW site is unreachable; no level has an enclosed lumen.

### E2b — Scope exposure        [done: CP-2a] · Sonnet · depends: —
Goal: the scope image is legible at every distance (verification: white
disc at the sphenoid pose).
Read: this file §4 verification "New findings on screen"; `docs/ssb.md` §3
(Endoscope), §7.4; `js/ssb/mode-endoscope.js`.
Touch: `js/ssb/mode-endoscope.js`, `tools/test-ssb.mjs`.
Don't: change materials or packs; add a dependency.
Spec: automatic exposure, as a camera control unit does. On each pose
change, raycast from the tip along v and along four rays 15° off it
against the drawn air-space meshes; D = the median hit distance (3 mm
floor). Set the spotlight's intensity to `K · D²` clamped to a range, K
chosen so the existing straight 40 mm pose looks as it does now. If the
hard-edged white wedge seen in a 30° view (`#scope=R,40,0,15,0,30`) is a
mesh, report which node it is (it may be ST1b's sealed interfaces) rather
than hiding it.
Accept: at `#scope=R,52,-3,15,0,0`, `R,42,-3,15,0,0` and `R,40,0,15,0,30`,
under 10 % of the pixels inside the circle have luminance ≥ 250 and their
median luminance is 40–200; the on-demand loop still idles when the pose
does not change; the existing scope tests pass.
Escalate: raycasting the packs costs more than a frame at 60 fps.
*Result (Sonnet, 2026-10-03; retuned after E1b merged):* exposure = K·D² (K
from `EXPOSURE_D0 = 16`, clamp 10–2000) plus the scope's hemisphere fill
raised 0.1 → 0.5: the three Accept poses read 0 %, 3.7 %, 0 % clipped, median
luminance 46, 67, 46 (`test-ssb --only scope`, 61/61). The "K so the straight
40 mm pose looks as now" clause could not hold with the Accept (that pose
clipped 15 % at the old exposure with the provisional fulcrum), so K and the
fill were tuned to the Accept instead; they were retuned once E1b moved the
fulcrum (the first values left the "not blank" check one colour short).
White areas at the first tuning were single nodes with the tip against them,
not interface membranes (`s.sphenoid-sinus.R` 0.77 mm ahead at `R,52,-3,15,0,0`,
`s.nasal-cavity.R` 0.3 mm at `R,40,0,15,0,30`); with E1b's fulcrum neither pose
is that close. At `R,40,0,0,0,0` the left edge of the field shows the page
background through the lining (no geometry there: ST1b's problem). Raycast cost:
10–17 ms per pose change in headless software-GL Chromium (not per frame);
borderline against the Escalate line, for the checkpoint.

### E3 — Collision and proximity HUD        [done: CP-2a; lazy shared volume added by Opus] · Sonnet · depends: E1b, E2b (same files)
*O4 decided 2026-10-03: 4 mm.* *Spec revised again at verification (2026-10-03); it supersedes the CP-1
revision below wherever they differ, and the CP-1 text is kept for the
record.* (1) The fulcrum is E1b's. (2) `SHAFT_RADIUS_MM = 2.0` (a 4 mm
telescope, O4), with 1.35 (2.7 mm) selectable in the scope controls, not in
the hash. (3) Blocking, sampling, clamping and the HUD stay as below.
(4) The real-specimen Accept replaces CP-1's pose, which is blocked by its
own rule (the 1.5 mm ring grazes the bony septum at 19.5 mm): per side, a
search over yaw and pitch on a 1° grid finds a collision-free pose whose
tip is within 2.5 mm of `lm.sphenoid-ostium.<side>`; the test pins the pose
it finds (verification, approximate fulcrum: R yaw -4, pitch 20, depth 59,
1.4 mm; L yaw -1, pitch 22, depth 64, 2.4 mm). A pose aimed 5 mm into the
sphenoid face beside the ostium clamps at the last free depth. (5) Frontal:
per side there is a collision-free pose with lens 70 whose view axis is
within 15° of the direction to `lm.frontal-ostium.<side>`, with a bone-free
line of sight of at most 25 mm; no lens-0 pose reaches it.

*CP-1 revision (superseded where the above differs):*
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

*Result (Sonnet, 2026-10-03):* `scope.js` `shaftClearance` / `sdfSampler` /
`hudRows` (pure), wired in `mode-endoscope.js` and `ui-endoscope.js`: bone-only
collision with clamping (also for a pasted link), mucosal contact and the
proximity HUD in the controls, the 4 / 2.7 mm shaft pills. The fixture got an
analytic sphere SDF. `test-ssb` 435/435. **One Accept item is not met, for the
checkpoint:** with E1b's fulcrum, a 4 mm shaft's closest free tip to
`lm.sphenoid-ostium.L` is **3.31 mm** (yaw -2, pitch 24, depth 63), not within
2.5 mm; the verification's 2.4 mm used the superseded fulcrum. A 2.7 mm shaft
reaches 1.55 mm (yaw 0, pitch 24, depth 64). The right side passes (2.03 mm: yaw
-3, pitch 19, depth 58.5). The test pins the left gap as a measured fact, named
OPEN; it does not stand in for the Accept. Options: accept 2.7 mm for the left
ostium, relax the tolerance to 3.5 mm, or move the left landmark (anatomy:
Opus). Frontal item met: lens 70 reaches both ostia (R yaw -2, pitch 33,
depth 36, roll 0; L yaw -10, pitch 44, depth 41, roll 15), no lens-0 pose does.
The HUD sits in the controls panel; a stage-overlay HUD needs CSS (outside this
WP's Touch). The existing pasted-link test now uses `L,30,-10,0,0,30` because
`L,30,10,0,0,30` is inside bone and clamps to depth 16.

### E4 — CT along the scope        [done: CP-2b] · Sonnet · depends: E3 (same files)
Goal: the CT follows the tip; exposure stops costing a raycast per dragged frame.
Read: `docs/ssb.md` §3 (Endoscope, CT), §5.6; §4 "CP-2a" (E2b, E3) of this file; `js/ssb/volume.js` (`sharedVolume`, `obliqueSlice`); `js/ssb/mode-endoscope.js`; `js/ssb/ui-endoscope.js`.
Touch: `js/ssb/mode-endoscope.js`, `js/ssb/ui-endoscope.js`, `js/ssb/mode-ct.js` (only to accept the cursor), `css/ssb.css`, `tools/test-ssb.mjs`.
Don't: load the volume at page boot (it loads on the first engage through `sharedVolume`, CP-2a); change `scope.js`'s collision rules.
Spec: (1) on pose change (throttled to animation frames), `state.cursor = T`;
an inset canvas in the scope controls shows `obliqueSlice` through T spanned by v and camera up,
with the shaft drawn on it; hidden until the volume has loaded, and with no volume.
(2) Exposure on settle: `expose()` runs once the pose has not changed for 100 ms (and on engage),
not on every moving frame; a settled pose reads exactly as it does now.
(3) The HUD's near-row colour moves from the inline style to a class in `css/ssb.css` on `--signal`.
Accept: after a pose change the CT crosshair equals T within a voxel; the
inset's centre pixel samples the same value as `volume.sample(T)`; during a 30-frame
drag `expose()` runs at most twice; E2b's exposure checks still pass; the CP-2a
lazy-load test still passes (no `ct.u8.gz` request until the scope or CT opens).

*Result (Sonnet, 2026-10-05):* `follow()` in `mode-endoscope.js` sets `state.cursor = T` and resamples the inset once per animation frame after a pose change; `ui-endoscope.js` paints it (shaft stops 4 px short of the tip and a ring marks it, so the centre pixel stays the CT's). `expose()` runs from a 100 ms settle timer (and on engage); a held pointer keeps it waiting. HUD near colour is the `.ssb-scope-hud-near` class. `test-ssb` 550/550. Consequences to know: (1) the cursor lives in the store, so leaving the scope now leaves `#at=x,y,z` in the URL (a scope link itself is unchanged; the old test expected an empty hash); (2) `mode-ct.js` needed no change; (3) the drag now uses pointer capture, because a release outside the canvas left the drag stuck and would have blocked the exposure forever; (4) the "out-of-range numbers in a link" test accepts a bone-clamped depth, since the volume can arrive before the check; (5) the Accept's "30-frame drag" is driven back to back, because software GL frames outlast 100 ms.

### E3b — The septum blocks the shaft        [done: CP-2c] · Sonnet · depends: E4, N1 (merged)
Goal: a rigid scope cannot be swung through the septum into the other side (CP-2b: on the standard specimen 4108 of the 6185 (A, S) columns where both nasal cavities face the septum have no voxel at E3's bone level, 150; the septum there is cartilage and mucosa, display ≤ ~120).
Read: §4 "CP-2b" of this file; `js/ssb/scope.js` (`shaftClearance`, the side sign); `docs/ssb.md` §3 (Endoscope), §5.1 (standard specimen: the septum is centred on R = 0).
Touch: `js/ssb/scope.js`, `js/ssb/mode-endoscope.js` (only to pass the arch point in), `tools/ssb-fixture-ct.mjs`, `tools/test-ssb.mjs`.
Don't: change the bone level, the ring, the sampling step, or any pinned pose's expected value without listing it in the PR (old → new).
Spec: in `shaftClearance`, a sample point P (axis or ring) also blocks when it lies on the far side of the midline, s·R(P) < 0 (s = +1 right scope, −1 left), **unless** it is in the nasopharynx: A(P) < A_arch and S(P) < S_arch, where (A_arch, S_arch) are `lm.choanal-arch.M`'s A and S (passed in by the mode; fallback A −51, S 12 if the landmark is missing). The midline is R = 0 because the standard specimen centres the septum there; say so in the code comment. The block is reported like bone (`blocked: true`, the HUD's "Bone limits the depth" becomes "The septum or bone limits the depth" when the midline rule fired — return which).
Accept: fixture: a pose whose shaft crosses R = 0 in front of the arch clamps at the last depth with s·R ≥ 0 at every ring point; the same line below and behind the arch is not clamped. Real specimen: from `R` at yaw −30, pitch 0 (aimed across the septum) the clamped tip and all four ring points have R ≥ 0; the pinned sphenoid poses (both sides, R/L 58.5, −3, 19) and frontal poses (R/L 36, −2, 33, 0, 70) are unchanged; the full `test-ssb.mjs` passes.
Escalate: a pinned pose clamps under the new rule (report the depth and which ring point crossed).

*Result (Sonnet, 2026-10-05):* `shaftClearance(fulcrum, pose, ctAt, radius, arch)` in `scope.js` also blocks a sample (axis or ring) with s·R < 0 unless A < arch.a and S < arch.s; it returns `by` (`'bone'` | `'septum'` | null), and `limitedBy` reaches the hook and the HUD, which says "The septum or bone limits the depth." when the midline fired. `mode-endoscope.js` passes `lm.choanal-arch.M`'s A and S (`ARCH_DEFAULT` −51, 12 otherwise). `test-ssb` 572/572; the pinned sphenoid and frontal poses are unchanged. Pins changed (old → new): the pasted link `L,30,−10,0,0,30` now clamps at depth **26** (was 30; it swings medially), in the page check; the NaN / no-data check uses a straight-posterior pose (`yaw 0`) instead of the midline-crossing one, because the septum rule blocks on position, not data. The fixture file was not touched: the midline tests run in air (the fixture's own septum is bone and fires first).

### E5 — Station poses        [done: Opus, 2026-10-07] · **Opus** · depends: E3b, N1, ST1b
*Result:* `ssb/geometry/stations.json` — 7 of the graph's 40 stations posed (13 keys: six per side, `t.nsf-pedicle.M` from the right nostril), 27 listed as `uncovered` with the reason, 6 as `overviews` (scope `null`: orbit-camera views for procedure mode). Every pose is free (4 mm shaft, E3b midline rule), its tip is in airway air, and its `target` is inside the field; `measured` records what a 161-ray cone hits, so E6 and the checkpoint can re-check it without judgement. Left = right mirrored (roll → 360 − roll; checked: view and up vectors mirror exactly, hits identical). Solver and checks: scratch scripts, not committed (the method is the `rule` string in the file).
Findings: (1) **the two earlier pinned poses put the tip in tissue** — `R,58.5,−3,19` inside `s.sphenoid-face.R`, `R,36,−2,33,0,70` inside `s.middle-turbinate.R`; the scope then looks out of mucosa, which is CP-2c's "near-uniform pink field". Collision blocks only at bone, so they stay valid poses, but stations require the tip in air. (2) The specimen is not decongested: at the sphenoethmoidal recess the air is ~2 mm wide, the olfactory cleft and the axilla are closed, the inferior meatus is not enterable — those stations are `uncovered`, not forced. (3) `t.septum-anterior` and `t.lacrimal-sac-0` wait on ST6 (the anterior cavity is masked); ST6 must re-run E6's station test, and add those two if its vestibule makes them reachable (an Opus pose, at its checkpoint).

### E6 — Station flights        [done: merged #115, owner 2026-10-07; no Opus checkpoint] · Sonnet · depends: E5 (merged)
Note (ST6, 2026-10-07): the nose changed the volume (the vestibule label, the unmasked skin). A scratch copy of the Node checks below found all 13 poses unchanged and valid; the shaft contact (the `contactMm` pins) went up by 5 and 2 mm. Add `t.septum-anterior` and `t.lacrimal-sac-0` only with Opus poses.
Goal: the endoscope can jump to any station the specimen covers, by list or by link.
Read: this WP; E5's result above; the `rule` string in `ssb/geometry/stations.json`; `js/ssb/scope.js` (`clampPose`, `parseScope`, `formatScope`, `shaftClearance`, `frameOf`, `tipOf`, `FOV_DEG`); `js/ssb/mode-endoscope.js`, `js/ssb/ui-endoscope.js`; `docs/ssb.md` §3 (Endoscope).
Touch: `js/ssb/mode-endoscope.js`, `js/ssb/ui-endoscope.js`, `js/ssb/scope.js` (codec only), `js/ssb/state.js` (hash), `css/ssb.css`, `tools/test-ssb.mjs`; docs pass.
Don't: change `stations.json` or any pose in it (a pose that fails is reported, not edited); animate the camera directly (interpolate the pose, then the store); bend prefers-reduced-motion (a cut, no flight).
Steps:
1. Load `ssb/geometry/stations.json` lazily with the scope (as the volume is); a missing or malformed file hides the station list and throws nothing.
2. A "Stations" list in the scope controls: the stations for the current side (and `.M` ones), named from the graph (`graph.nameOf`), tier-filtered like the rest of the page, each with its lens; the uncovered ones are not listed.
3. Picking one flies there: interpolate depth, yaw, pitch and roll (shortest way round) over ~600 ms through the store, the lens switches at the end; a pose that would block mid-flight is clamped as usual (the end pose is free by construction). Reduced motion: a cut.
4. Deep link `#scope=t.<id>` (and `t.<id>.<side>`; the side defaults to R): resolves to the station's pose and then writes the ordinary pose hash; an unknown id is ignored like any hostile link.
Accept (`tools/test-ssb.mjs`, new Node and page checks): every station in the file has a pose `clampPose` leaves unchanged, is free under `shaftClearance` (4 mm, `lm.choanal-arch.M`), has its tip in an air label, and has its `target` (landmark, label centroid, `between` midpoint or `at`) within `FOV_DEG / 2` of `frameOf(pose).v`; every `.L` station is its `.R` mirrored (roll → 360 − roll); every graph `t.*` is in `stations`, `uncovered` or `overviews`; in the page, picking `t.ser-0` from the list ends at its pose and URL, `#scope=t.frontal-recess-70.L` opens at that pose, `#scope=t.nope` is ignored, reduced motion cuts; `check-data`, full `test-ssb`, `smoke-pages`.
Escalate: a station fails a Node check (report which and the numbers); the list needs a design decision the controls have no place for.

*Result (Sonnet, 2026-10-07):* `scope.js` gains the codec (`parseStationLink`, `parseStations`, `resolveStation`, `flightPose`); `state.js` holds a pending link as `state.station` (a link is `#scope=t.<id>[.<side>]`, kept in the URL until `store.resolveStation(pose|null)` turns it into the ordinary pose hash, source `url`); `mode-endoscope.js` loads `stations.json` with the scope (or when a link is pending), runs `flyTo(key)` (600 ms, smoothstep, one `store.setScope` per animation frame with meta `{ internal: true }`, so collision, the HUD, the URL and the CT inset behave as for any pose change; any other pose change, a pointer press, the wheel or a key cancels it) and cuts under `prefers-reduced-motion`; `ui-endoscope.js` adds a Stations section (this nostril's and the `.M` ones, at or above the page's tier, graph name plus lens; hidden with no table). All stations in the file pass the Node checks as stored (free, tip in air, target within 35°, mirrored, every graph `t.*` accounted for): none reported, no pose touched. Decisions to know: (1) the side switches on the first step of a flight (two nostrils have no halfway), so a `.M` station picked from the left scope moves to the right nostril; (2) a deep link does not raise the page's tier, so a tier-2 or tier-3 station opened by link is not in the list until the tier allows it; (3) a missing or malformed file hides the list and drops a pending link without an error.

### ST0d — Content corrections        [done: merged #97, CP-2a] · Sonnet · depends: — (folds in ST0c)
Goal: apply the verification's ST0 findings; check the sources it did not
read.
Read: this file §4 verification, "ST0 content"; `docs/authoring-ssb.md`
§3–§5.
Touch: `ssb/content/nasal-maxillary-ppf.json`, `ssb/content/sources.json`.
Don't: rename ids; set `verified`; add claims beyond the texts below.
Steps:
1. Add `src.harvey-2009-itf` (Harvey RJ, Sheahan PO, Schlosser RJ. Inferior
   turbinate pedicle flap for endoscopic skull base defect repair. Am J
   Rhinol Allergy. 2009;23(5):522-526; PMID 19807987;
   doi:10.2500/ajra.2009.23.3354) and a measurement `m.itf-dimensions`
   (length 54.0 ± 4.9 mm, distal-third width 22.1 ± 3.7 mm, cadaver, n 9,
   conf low; reach 112 ± 21 % of the posterior cranial fossa and 67 ± 10 %
   of the anterior). In `m.itf-area` replace the note: Table 31.2 cites
   Harvey 2009 (its ref. 47) for 2.4 cm², which Harvey's own dimensions
   contradict; unresolved until the printed table is read. Point the
   inferior turbinate flap's preop "expected area" at both. (The printed
   Table 31.2 confirms "2.4" with ref. 47: the inconsistency is the atlas's;
   say so, citing both.)
2. `p.middle-turbinate-flap`, second preop check → "Pedicle: the internal
   maxillary artery (prior infratemporal fossa surgery or tumour)." Why:
   "The atlas lists the middle turbinate flap among the flaps excluded when
   the internal maxillary artery is unavailable; prior sphenoid surgery and
   posterior septectomy endanger the septal branch, i.e. the nasoseptal
   flap." Add to its indications the atlas's midline range, transplanum to
   transsellar (Table 31.2).
3. `s.incisive-canal`: `ct` → the canal is visible in the reference
   specimen on the midsagittal plane, running from the nasal floor
   anteroinferiorly through the anterior maxilla (point at
   `lm.incisive-canal.M`). Add `lm.incisive-canal` (of `s.incisive-canal`,
   tier 2, `locate`: "The nasal opening of the incisive canal, on the floor
   beside the septum's base.", src as for `s.incisive-canal`).
4. ST0c: check by PMID/DOI, and against its abstract every claim citing,
   the sources the verification did not read: `moscatiello-2011`,
   `sertel-2016`, `jacobs-2007`, `wang-2007` and the five Radiopaedia
   pages. List mismatches in the PR; fix only citation metadata.
Accept: `node tools/ssb-content.mjs` and `node tools/check-data.mjs` pass.
Escalate: a claim does not match its abstract (report, do not rewrite).

### ST2b — Nasal floor chart and incisive canal        [done (partial): canal + right margin; floor → ST2c, left → N1] · Sonnet · depends: E1b, ST0d
Goal: floor mucosa surfaces with charts (the NSF's floor strip and the
extended flap need them), and the incisive canal as a landmark.
Read: this file §4 verification (ST0 3, ST3 1); `docs/ssb.md` §5.7; ST2
above; `softtissue.py`.
Touch: `tools/ssb-pipeline/uw/softtissue.py`; `ssb/models/soft.glb.gz`,
`packs.json`; `ssb/geometry/charts.json`, `landmarks.json` + meta.
Don't: change the septal surfaces or their charts beyond adding the
junction record.
Steps:
1. `s.nasal-floor-mucosa.R` / `.L`: the boundary between the
   `s.nasal-floor.<side>` wall voxels and `s.nasal-cavity.<side>` air,
   meshed into the `soft` pack under the same rules as the septal
   surfaces. Chart: axial projection (a, r) with a 1 mm lookup grid back to
   s, plus the junction polyline with the septal chart's `bottom(a)` so an
   outline can cross from one chart to the other. (The inferior meatus is
   a lateral-wall surface: later.)
2. `lm.incisive-canal.M`: among voxels with |R| ≤ 4, A -24…-8, S -14…-1, the
   connected channel of display 78–150 bounded by bone (≥ 150) within 2 mm
   on both sides in R or A that runs at least 5 mm in S; its topmost point.
   The verification saw it from (A -18, S -3) to (A -13, S -12) at R 0.
3. The sphenoid ostium's inferior margin per side (the NSF's superior
   incision starts there, O5), into `landmarks.meta.json`
   `lm.sphenoid-ostium.<side>` as `inferior_margin_s_mm` with its method:
   the lowest S of the `s.nasal-cavity.<side>` | `s.sphenoid-sinus.<side>`
   label interface (right: ≈ 23.5). Where there is no interface (the left
   ostium is closed by mucosa in this scan), the lowest S of the connected
   set of display < 150 voxels that crosses the `s.sphenoid-face.<side>`
   wall within 6 mm of the landmark, between cavity air and sinus air;
   escalate if that set is taller than 8 mm or absent.
4. Print areas, chart boxes, round-trip errors, the canal's run and both
   inferior margins.
Accept: floor chart round-trip ≤ 1 mm on interior cells; the canal point
within 3 mm of (0, -18, -3) and a run ≥ 5 mm; right inferior margin within
1 mm of 23.5 and each margin below its landmark's S; `check-data.mjs`
passes.
Escalate: the floor wall unit does not separate from the inferior
turbinate or maxillary walls (report where).
*Result (Sonnet, 2026-10-03), partial.* Done: `lm.incisive-canal.M` (0.1, -18.95, -1.0), 2.3 mm from (0, -18, -3), channel run 12.5 mm (four bone-bounded candidates; the midline-most centroid is taken, R 0.05 — the others sit at |R| 1.6–3.1; the box top at S -1 clips it, so S is a lower bound); right `inferior_margin_s_mm` 23.5 (below the landmark's 24.16). `softtissue.py` no longer rewrites `lm.naris` (its E1 step would have clobbered E1b). **Escalated, not done:** (1) *Floor chart.* The `s.nasal-floor.<side>` unit does not abut the cavity air: it is the palate's bone, display 170–195, with 1–3 mm of unlabelled soft tissue (display ~50–110) between it and the air (distance floor→air: right median 3.2 mm, 8 voxels touch; left median 6.3 mm, 0 touch). The right unit has 12180 voxels, the left only 4361, so a left floor mucosa cannot be derived from it: meshing the cavity's down-facing lining (normal S < -0.5) within 3 mm of the unit gives 3.9 cm² right but 0.5 cm² left (R -15…-2, A -48…-40). It does touch `s.maxillary-medial-wall.R` (149 voxels) and `s.maxillary-sinus-floor` (275 R, 83 L), not the inferior turbinate. A method that defines the floor from the air's down-facing lining instead of the unit is an anatomy call (and the left unit's coverage may be a labelling gap in `walls.py`). (2) *Left ostium margin.* No cavity | sinus interface on the left; the fallback opening (display < 150 voxels of `s.sphenoid-face.L` within 6 mm of the landmark, touching both airways) is one 530-voxel component spanning S 23.5–34.5 (11 mm, R -13.5…-3.5, A -54.5…-49.5), over the 8 mm limit, so no left margin is written.

### ST1b — Open airway lining        [done: CP-2c] · Sonnet · depends: N1, ST2c (same pack files)
Goal: the scope sees through the ostia and the choanae (verification: each
air compartment is a closed shell, so every opening is a double membrane).
Read: this file §4 verification "New findings on screen"; `docs/ssb.md`
§5.3–§5.4, §5.7; `tools/ssb-pipeline/uw/meshes.py`; ST1 above.
Touch: new `tools/ssb-pipeline/uw/lining.py` (stage D, reads the committed
volume); `ssb/models/` (new `lining` pack, `packs.json`);
`js/ssb/mode-specimen.js`; `tools/test-ssb.mjs`.
Don't: change the existing air packs (the outside view and the CT
overlay keep using them).
Spec: one marching-cubes surface over the union of every air-space label,
at `meshes.py`'s level, step and budget rules; split it into nodes by the
label of the air voxel each triangle faces (the first air voxel along the
inward normal), named `<id>.<side>` so picking keeps graph ids. No
triangle lies on an air|air interface. The Mucosa layer, when drawn from
inside (and so the scope), uses the lining nodes instead of the
per-compartment shells; the outside view is unchanged.
Accept: no triangle centroid within 0.5 mm of an air|air label interface
unless within 1 mm of tissue (print the count: 0); a ray from 10 mm in
front of `lm.sphenoid-ostium.R` toward it, with the lining drawn, first
hits a `s.sphenoid-sinus.R` node; a ray from `#scope=R,40,0,3,0,0`'s tip
along v passes the PNS plane (A -50) before its first hit; picking from
inside returns graph ids; budgets hold.
Escalate: the union surface breaks the triangle or byte budget.
*Result (Sonnet, 2026-10-06).* `lining.py` (run after `softtissue.py`; `normalize.py all` now ends with it) writes `ssb/models/lining.glb.gz`: one union surface, 50 000 triangles, 469 KB, split into 19 nodes (one per air label, 271 triangles found no air voxel within 3 mm of their normal and took the nearest label); all packs now 381 016 triangles, 3.42 MB. Membrane count 0. In `packs.json` the pack carries `"lining": true`; its node names repeat the air packs', so `geo-specimen.js` keys them `lining:<id>.<side>` (group `lining`, `byId` skips them, a pick reports the structure's own key). `mode-specimen.js` draws the lining, and hides the air shells, only when the mucosa layer is seen from within (camera inside the air box or the scope); outside, the lining is not drawn and nothing changes.
Deviations from the spec's two rays (both are *tests*, `tools/test-ssb.mjs` `liningTests`): (1) a straight ray from 10 mm in front of `lm.sphenoid-ostium.R` starts in tissue (the recess is a cleft; the first hit is `s.nasal-cavity.R` with the lining *and* the shells). The test casts every ray from cavity air 8–12 mm from the cavity | sinus interface's centroid (2.5 mm from the landmark) whose straight path to it is all air (41 rays): the lining always first hits `s.sphenoid-sinus.R`, the shells always `s.nasal-cavity.R` (the sealed membrane). (2) `#scope=R,40,0,3,0,0` is no longer a view through the choana: after N1 its tip sits in the inferior turbinate's tail and the view ends in tissue at A −49.7 either way. The pinned pose is `R,40,-4,3,0,0` (free, tip in cavity air): the lining's first hit is A −55.4, the shells' A −49.7. Left sphenoid ostium: still closed in the labels, so still closed in the lining (not in this WP's accept).
For CP-2c: at `#scope=R,58.5,-3,19,0,0` (the tip 2 mm from the ostium) the image is still a near-uniform pink field — the exposure (E2b), not a membrane.

### ST1c — Load the lining pack lazily        [done: reviewed by Opus 2026-10-07] · Sonnet · depends: ST1b (merged)
Goal: a specimen visitor who never looks from inside downloads no lining
(CP-2c: `lining.glb.gz`, 469 KB, is fetched at boot for everyone, drawn
only from within).
Read: §4 "CP-2c" of this file; `js/ssb/geo-specimen.js` (`load`,
`listPacks`, the `lining` flag); `js/ssb/mode-specimen.js` (`within`,
`openLining`, `onPack`); in `tools/test-ssb.mjs` the CT lazy-load checks
("does not fetch the CT volume") and `liningTests`, as patterns.
Touch: `js/ssb/geo-specimen.js`, `js/ssb/mode-specimen.js`,
`tools/test-ssb.mjs`; docs pass (`docs/ssb.md` §5.4 one sentence).
Don't: change `packs.json`, any pack, the pipeline, or a lining test's
threshold; change what is drawn once the lining has loaded.
Steps:
1. `geo-specimen.js`: `load()` registers a `lining: true` pack with state
   `deferred` and does not fetch it; the final status ignores deferred
   packs (a page with every other pack loaded is `ready`). A new
   `loadLining()` fetches and adopts every deferred pack once (memoized
   promise; a second call returns the same one), calls `onPack` for each,
   never rejects.
2. `mode-specimen.js`: the first time the mucosa layer is seen from within
   (the condition that sets `within`, which includes the scope), call
   `specimen.loadLining()`, then re-apply; until it arrives the air shells
   are drawn as before (the old behaviour is the fallback).
3. Anything that lists pack states (the specimen status line, tests) shows
   `deferred` as not-an-error.
Accept: new checks — a specimen page that never goes inside requests no
`lining.glb.gz` and reaches status `ready`; entering the scope requests it
exactly once and then draws lining nodes (the air shells hidden); going
inside by the orbit camera does the same; every existing `liningTests`
check passes unchanged; `node tools/stamp-assets.mjs`,
`node tools/check-data.mjs`, `node tools/test-ssb.mjs` (full),
`node tools/smoke-pages.mjs`.
Escalate: a lining test needs a different pose or threshold to pass; the
pack status UI has no place for a deferred state without a design change.
*Result (Sonnet, 2026-10-07).* `load()` registers the `lining: true` pack as `deferred` (ignored by the final status); `loadLining()` (memoized, waits for `load()`, never rejects) fetches it, and `mode-specimen.js` `paint()` asks for it once the first time the mucosa is seen from within, drawing the shells until it lands. No pack status UI changed (a deferred pack is neither `failed` nor `pending`). Tests: a never-inside page fetches no `lining.glb.gz` and is `ready`; the scope and the orbit camera each fetch it exactly once, then draw lining nodes with the air shells hidden; the pack-state check and the ST1b page checks were adapted to wait for the lining, no `liningTests` threshold or pose changed.

### N1 — Standard specimen: right half mirrored, septum centred        [done: CP-2b] · Sonnet · depends: ST2b, E3 (merged)
Result (2026-10-05): `tools/ssb-pipeline/uw/normalize.py` built the standard specimen; the numbers are in the PR body. First run escalated (midline fit, frontal tables); the owner answered the same day: gate on the fit at the septum, mirror at R = 0, frontal tables exempt, one-sided landmarks stay as scanned. Step 8's "yaw negated" was corrected: yaw is side-relative (`scope.js`), so the mirrored left pose has the same yaw. One-sided landmarks (`lm.greater-palatine-foramen.L`, `lm.infraorbital-foramen.L`, `s.foramen-lacerum.L`, `s.foramen-ovale.L`, `lm.sphenopalatine-foramen.R`, `lm.vidian-canal-anterior.R`, `s.anterior-clinoid-process.R`, `s.petrous-apex.R`) stay as scanned; `lm.infraorbital-foramen.L` then lies 4.01 mm from the mirrored left maxillary mesh, so the two landmark-vs-mesh checks now cover paired landmarks only (owner, 2026-10-05; threshold unchanged, row guard 8 -> 6 because only six paired rows remain).
Goal: the page serves a symmetric, standard specimen (O6, `docs/ssb.md`
§5.1); the as-scanned head stays the pipeline's input.
Read: `docs/ssb.md` §4, §5.1 (the standard-specimen paragraph), §5.3,
§5.6, §5.7; §4 "CP-2a" of this file; the docstrings of
`tools/ssb-pipeline/uw/walls.py`, `meshes.py`, `sdf.py`, `softtissue.py`,
`sweeps_soft.py`, `sweeps.py`; `ssb/geometry/charts.json`'s `note`.
Touch: new `tools/ssb-pipeline/uw/normalize.py`; `ssb/ct/*`;
`ssb/models/*`; `ssb/geometry/*` (`labels.json` append-only);
`js/ssb/ui-specimen.js` and `js/ssb/ui-ct.js` (one note each);
`tools/test-ssb.mjs`; docs pass.
Don't: change graph content; hand-edit an output; change a test threshold;
commit anything from `incoming/`; rerun `sweeps.py` (its seeds are the
asymmetric UW arrow tips — mirror its output instead, step 6).
Steps:
0. Input: the as-scanned `ssb/ct/{ct.json,ct.u8.gz,labels.u16.gz}` and
   `ssb/geometry/{labels.json,landmarks.json,landmarks.meta.json,charts.json,sweeps.json,sweeps.meta.json}`
   read with `git show <commit>:<path>` at the master commit just before
   N1 (a constant `AS_SCANNED_COMMIT` in `normalize.py`, also written to
   `ct.json`), cached under `tools/ssb-pipeline/incoming/_recon/as-scanned/`.
1. Midline check. The frame's midsagittal plane is R = 0 (voxel column
   104 of 209). Fit a plane to the as-scanned `s.nasal-septum.M` voxels
   with S ≥ 20 (the perpendicular plate) plus every `.M` landmark; print
   its R offset at the origin and its tilt.
2. Centre the septum (right half only; the left is replaced in step 3).
   From the as-scanned septal charts, per cell (a, s) in both: offset
   c = (rR + rL) / 2, thickness T = rR − rL. Cells in one chart only,
   `filled`, `unreliable`, or in the posterosuperior hole take c from the
   nearest valid cell, then a 3×3 median over the union outline; outside
   the outline c tapers linearly to 0 over 3 mm. Per column (a, s), the new
   right surface is at r = T/2 (= rR − c): if c > 0, voxels with
   T/2 < x ≤ rR become right-cavity air (display = the median of the
   as-scanned `s.nasal-cavity.R` air, printed; label `s.nasal-cavity.R`);
   if c < 0, voxels with rR ≤ x < T/2 take the display and label of the
   voxel at x + c (septal tissue extended). Nothing lateral to the old
   right surface changes.
3. Mirror. Every voxel with x < 0 takes the display of the voxel at −x and
   its label mapped side for side (`.R` → the same id's `.L` index, `.M`
   and unnamed unchanged; append a `.L` index to `labels.json` if one is
   missing, print it). First, in the right half, relabel any `.L` voxel to
   the same id's `.R` (print the count per id).
4. Midline plates. Where, after step 3, air of a paired air space (any
   `.R` air label) is face-adjacent across R = 0 to air of its own `.L`,
   set the voxels with |x| ≤ 0.5 (three columns, 1.5 mm) over that patch,
   dilated 1 mm in A and S, to bone: display = the median of the
   as-scanned `s.sphenoid-face` voxels (printed); label
   `s.intersinus-septum.M` in the sphenoid, `s.frontal-intersinus-septum.M`
   in the frontal sinus (append indices), the nasal septum's label in the
   nasal cavity (the olfactory-cleft contact, 52 mm² as scanned). Print
   each plate's area. Afterwards no `.R` air voxel touches a `.L` air voxel.
5. `ct.json` gains `standard`: `{ method, asScannedCommit, sourceSide: "R",
   septumOffsetMm: { median, max }, plates: { <id>: mm² }, note }`.
6. Rerun every stage that reads `ssb/ct`, in their documented order
   (`walls.py`, `meshes.py`, `sdf.py`, `softtissue.py`, `sweeps_soft.py`).
   Then make the side pairs exact: every paired landmark `.L` := `.R` with
   R negated, `.M` R := 0 (the meta keeps the as-scanned point under
   `asScanned`, method "mirrored from .R (N1)"; the sphenoid ostium's
   `inferior_margin_s_mm` carries over); `sweeps.json` `.L` := mirrored
   `.R` (meta likewise); `s.septal-mucosa.L`'s chart := `.R`'s with r
   negated.
7. One `textContent` note in the specimen controls and in the CT stage,
   shown when `ct.json` has `standard`: "Standardized specimen: one head's
   right half, mirrored, with the septum centred — symmetric by
   construction, not a real head."
8. Tests (`test-ssb.mjs`): re-pin the real-specimen numbers that move, each
   with its old and new value in the PR; delete E3's OPEN left-ostium pin
   and instead, per side, run E3's 1° search: a collision-free 4 mm pose
   within 2.5 mm of `lm.sphenoid-ostium.<side>`, the left pose the right
   one with the same yaw (± 1°; yaw is side-relative — the first text said "negated", corrected at CP-2b). New: the CT and the label volume are
   mirror-symmetric (labels side-mapped) outside |x| ≤ 0.5 — 0 mismatches;
   every `.L` landmark mirrors its `.R` within 0.01 mm; the right septal
   surface lies at T/2 within 0.5 mm on interior chart cells.
Accept: `check-data.mjs`, `test-ssb.mjs` (full), `smoke-pages.mjs`; the
script prints the midline fit, the septum offset (median, max), each
relabel count, each plate area, pack bytes and triangles against the
§5.4 budgets and against the as-scanned packs.
Escalate: the midline fit is more than 1.5 mm or 3° off R = 0; a stage
needs a parameter change to run; a budget breaks; in the as-scanned
volume a right-labelled structure other than an air space reaches more
than 2 mm left of R = 0 (print which).

### ST2c — Nasal floor mucosa from the airway lining        [done: CP-2c] · Sonnet · depends: N1
Goal: ST2b step 1, decided at CP-2a as option (a) on the standard
specimen: the 1–3 mm of soft tissue between the floor bone and the air is
the floor mucosa, so its surface is the airway's.
Read: ST2, ST2b (above) and §4 "CP-2a"; `docs/ssb.md` §5.7;
`softtissue.py`.
Touch: `tools/ssb-pipeline/uw/softtissue.py`; `ssb/models/soft.glb.gz`,
`packs.json`; `ssb/geometry/charts.json`; docs pass.
Don't: change the septal surfaces or their charts beyond the junction
record.
Steps:
1. `s.nasal-floor-mucosa.R`: the faces of the right cavity's airway lining
   (the surface ST2's hole fill already uses) whose normal, airway into
   tissue, has an S component ≤ −cos 45°, lying within 6 mm above a
   `s.nasal-floor.R` voxel; medially bounded by the septal chart's
   `bottom(a)`, posteriorly by A −50 (the PNS plane), laterally where the
   normal's S component rises above −cos 45° (the floor turning into the
   inferior meatus). Keep the largest connected component. `.L` := the
   mirror (the specimen is symmetric after N1).
2. Chart: axial projection (a, r) on a 1 mm grid → s, plus the junction
   polyline with the septal chart's `bottom(a)`.
3. Print area, chart box, round-trip errors, and the junction's distance
   to `bottom(a)`.
Accept: chart round-trip ≤ 1 mm on interior cells; the junction within
1 mm of the septal chart's `bottom(a)` over their shared A; `check-data`
and `test-ssb --only specimen` pass.
Escalate: area under 2 cm², or a second component over 0.5 cm².

**Result (ST2c):** `softtissue.py` `floor_surface()`; each side **3.82 cm²**, 4101 triangles, 413 chart cells (A −51…−10, r 1…17). Second component **0.40 cm²** (under the 0.5 limit; dropped), third 0.01. The chart is built once on the right and the left reuses it (the specimen is symmetric after N1; the soft pack's left mesh is the mirror, winding flipped). Round trip **0.24 mm** (3D) / 0.20 mm (chart) on interior cells, 0.96 mm over all cells. Junction (distance from the septal chart's `bottom(a)` point to the floor surface): **0.64 mm max** for A ≥ −47 over 38 columns; at the PNS end (A −49, −48) the septal chart's own edge cells are partly covered and the distance reaches **3.09 mm** — that end is excluded from the Accept and recorded in the chart's `junction.rows`. The floor bone voxels stop at A −12, so the mucosa does too (the anterior floor is masked with the vestibule: ST6). The chart's value key is `grid.s` (not `r`): it is an axial chart. Soft pack gains two nodes; `normalize.py sides` is rerun after `softtissue.py` as usual.

### ST0 — Soft-tissue content        [done: verified 2026-10-03, corrections in ST0d] · **Opus** (first pass by Sonnet 5.5) · depends: — (O2 sets the nose scope)
*Verification (Opus, 2026-10-03):* checked against ch. 31 and every new PubMed abstract (§4). Three errors — `m.itf-area`'s source, the middle turbinate flap's pedicle check, `s.incisive-canal` "not resolved" — go to ST0d; the rest reads as cited. All still `draft`: medical correctness is the owner's.
Result (2026-10-02): added to the region files, all `draft`: `s.septal-mucosa`, `s.nasal-floor-mucosa`; the posterior septal artery's superior and inferior branches, `s.nasopalatine-artery`, `s.incisive-canal`, `s.superior-labial-artery` and its septal branch, `s.anterior-ethmoidal-septal-branch`, `s.facial-artery`, `s.lateral-nasal-artery` (facial; distinct from the PLNA), `s.dorsal-nasal-artery`, `s.columellar-artery`, `s.supraorbital-artery`, `s.supratrochlear-artery`, `s.superficial-temporal-artery`; the nose entry anatomy `s.external-nose`, `s.external-nasal-valve`, `s.nasal-ala`, `s.columella`, `s.nasal-bone`, `s.piriform-aperture`; `lm.middle-turbinate-head`; variants (PSA bifurcation level, two-branch pedicle, dominant inferior branch, SPA multiple trunks, tip supply); measurements (septal artery to ostium, NSF area, extended-flap gain, bipedicled anterior septal flap, MT flap area, AEA septal entry, internal valve angle, SOA axial length); procedures `p.inferior-turbinate-flap`, `p.middle-turbinate-flap`, `p.lateral-nasal-wall-flap`. **Sources:** 21 new, every journal paper matched in PubMed (PMID and DOI stored); five Radiopaedia articles (type `atlas`, fetched 2026-10-02). **Not done, and why:** the angular artery (no source in hand), the PEA septal branch (no course source), cartilages (O2 undecided), NSF length/width by design (the abstracts give area and the extended gain only; short/full dimensions come from the overlay on the specimen), the incisive canal's position (not resolved in the 0.5 mm display volume: derived from a literature distance instead). Steps of the three added flaps are limited to what their abstracts say; a surgical technique source is needed for harvest detail. **Check hardest:** every `why` that goes beyond its abstract, `v.*` prevalences' denominators, the extranasal arteries' relations.
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
(`docs/ssb.md` §9 Citations). *Folded into ST0d (2026-10-03): the verification checked 17 of the new journal sources; ST0d checks the rest.*

### ST3 — Flap construction spec        [done: first pass; revision ST3r] · **Opus** (first pass by Sonnet 5.5) · depends: ST0
*Verification (Opus, 2026-10-03):* the floor cut contradicts the atlas, the area gap is mostly construction, `top_margin` should depend on the design, the pedicle test is circular, and `top(a)` needs interpolating across the no-data gap (§4). ST3r revised the contract the same day (`docs/ssb.md` §5.7; the first pass is in git history).
Result: the contract is in `docs/ssb.md` §5.7 (parameters and ranges from the graph, geometry on ST2's chart, readouts, the tests ST5 must pin). Checked numerically on the specimen: with the defaults the pedicle is 10.2 mm (right) and 14.6 mm (left) high; the first points of both PSA branch sweeps lie in it; the superior cut keeps the margin everywhere; the default full flap is 7.5 cm² right and 8.5 cm² left against the specimen's septal lining of 14.3 / 15.4 cm². **Flag:** the literature mean is 17.12 cm² and the atlas quotes a maximum of about 25.1 cm² (`m.nsf-area`): the specimen overlay is well under half of either. Also from the atlas (ch. 31): its superior incision starts at the superior aspect of the ostium, the graph's step says the inferior margin, so `ostium_clearance` now spans both. Likely contributors: the upper margin left unelevated, the masked vestibule and floor turn missing from the chart, and a smaller specimen septum; whether the 17.12 cm² includes floor mucosa is not stated in the abstract. The defaults for `top_margin` (15), `ostium_clearance` (2) and `window` (5) are schematic.
Write `docs/ssb.md` §5.7's flap overlay contract concretely: the NSF outline
in ST2's chart for each design in `p.nasoseptal-flap` (short, full,
extended) — superior incision `m.nsf-superior-incision` below the septal
top, posterior cuts from the inferior margin of `lm.sphenoid-ostium` and
along `lm.choanal-arch`, anterior cut per design — as parameters with
ranges from the graph, plus the rescue-flap incisions; the tests it must
pass (pedicle contains the PSA sweep; the superior cut never enters the
olfactory strip; area readout equals the polygon's surface area).

### ST4b — Vessel waypoints        [done: verified 2026-10-03, corrections in ST4d] · **Opus** (first pass by Sonnet 5.5) · depends: ST0 (ST4a format)
*Verification (Opus, 2026-10-03):* the PSA start is a midpoint construction, not a cited number (use the 9.3 mm distance); the nasopalatine end is ~6 mm in front of the canal the specimen shows; the AEA entry height is unsourced (§4, ST4d).
Result: `uw/sweeps-soft.json` holds 10 entries (R and L): PSA inferior and superior branches, nasopalatine artery, superior labial septal branch, AEA septal branch; each cites its sources and has a `derivation` text saying what is cited and what is schematic. **Honest limits:** only the PSA branch starts, the AEA entry (7.35 mm behind the middle turbinate head) and the nasopalatine end (39.6 mm in front of the choanal arch) come from numbers; every course between them is a straight chart segment, the superior branch's direction has no cited waypoint, and the superior labial branch is truncated where the face mask removed its entry. The septal chart ends about 4 mm in front of the rostrum, so the PSA start sits at the chart's posterior edge, not on the rostrum. All 10 flagged `variable` where the sources show variation; the nasopalatine left sweep is 77 % over flagged cells.
Write `tools/ssb-pipeline/uw/sweeps-soft.json` entries for every sweep
ST0 adds that runs on a mucosal surface, from sources, each waypoint
citing its source in the entry; flag the ones whose course is variable.

### ST4c — Regenerate vessels        [done] · Sonnet · depends: ST2, ST4a, ST4b
Result: `softtissue.py` regenerated everything; every new sweep id resolves in the graph (`check-data` passes); `relate3d.py` agreement is unchanged (88 agree, 4 mixed, 2 untestable before and after); 4 new claims are untestable for want of geometry.
Run `softtissue.py`; check every new sweep id resolves in the graph;
`relate3d.py` agreement does not drop (report the before/after counts).

### ST4d — Waypoint corrections        [todo] · Sonnet · depends: N1, ST2c, ST6 (lane order)
Note (ST6): the septal chart now ends at the valve plane (A −10), so the superior labial septal branch's waypoints were re-seated on that edge row (see ST6's result); decide whether the columella entry in front of the plane is drawn.
Goal: apply the verification's ST4b findings and regenerate.
Read: this file §4 verification "ST4b waypoints"; ST4a and ST4b above.
Touch: `tools/ssb-pipeline/uw/sweeps-soft.json`; regenerated
`ssb/geometry/sweeps.json` + `sweeps.meta.json` (via `softtissue.py`).
Steps:
1. Both posterior septal branches start on the chart's posterior edge at
   S = S(`lm.sphenoid-ostium.<side>`) − 9.3 (`m.psa-to-sphenoid-ostium`, add
   `src.pinheiro-neto-2011-nsf-dimensions`); derivation says so.
2. The nasopalatine sweep ends at the septal chart cell nearest to
   `lm.incisive-canal.M` (same A, lowest occupied S); drop the Bleier-length
   construction from its derivation (keep Bleier as a source for the
   artery's role).
3. The AEA septal entry: same A; S = `top(a)` − 2 mm, derivation "height:
   the top of the septal surface; no source gives it".
4. Rerun `softtissue.py`; report `relate3d.py` agreement before and after.
Accept: printed start/end points match steps 1–3 within 0.5 mm;
`check-data.mjs` passes; agreement does not drop.

### ST3r — Flap contract revision        [done 2026-10-03] · **Opus** · depends: O5
Result: `docs/ssb.md` §5.7 rewritten (its "Changes from the first pass" lists them): the superior incision starts at the ostium's inferior margin for every design (O5), level for A and rising for B/C (Fig. 31.3), C drawn on the floor chart, `top(a)` interpolated across the gap, the pedicle test a cross-check of two sources. Specimen numbers wait for ST2b (the left inferior margin, the floor chart).
Revise `docs/ssb.md` §5.7's contract for the verification's ST3 findings:
an inferior incision on the floor chart at `floor_width` lateral to the
junction (atlas ch. 31), with short/full/extended differing in the anterior
cut and in floor and meatal extent; `top_margin` per design (O5); `top(a)`
interpolated across the posterosuperior no-data gap; the pedicle test
against the 9.3 mm point, not ST4b's construction; recompute the
specimen's areas with the floor strip and say what the masked vestibule
still removes. ST5 builds on this, not on the first pass.

### ST5 — Soft-tissue panel and NSF overlay        [todo] · Sonnet · depends: ST1b, ST2b, ST6, ST4d (contract: ST3r, done; the anterior cut is at ST6's valve plane)
Read: `docs/ssb.md` §5.7 (the revised contract — not the first pass in git history), §6 (diorama parameter/URL pattern), §7.3–§7.4; `js/ssb/mode-specimen.js`, `js/ssb/ui-specimen.js`, `js/ssb/state.js`.
Touch: new `js/ssb/flap.js` (pure geometry on chart data: no DOM, no three.js import, so Node tests it), `js/ssb/mode-specimen.js`, `js/ssb/ui-specimen.js`, `js/ssb/state.js` (`#flap=`), `css/ssb.css`, `tools/test-ssb.mjs`.
Accept: every test in §5.7's list, the outline computation in Node and the drawing in the page; areas printed for each design and side in the PR.
Specimen stage: a soft-tissue group (Mucosa, Septal mucosa, Vessels, Flap)
with tier filtering; the NSF overlay per ST3 (design presets as buttons,
sliders for the parameters, area readout, incisions drawn on the surface,
"schematic on specimen" badge). Tests per ST3.

### ST6 — External nose: unmask, centre, vestibule and valve        [done: merged #116, owner 2026-10-07; checkpoint items closed at CP-ST6, §4] · Sonnet · depends: ST1b (merged), ST1c (lane B, same file) · spec: Opus, CP-2b
Goal: O1 (c) and O2's entry anatomy on the standard specimen: the
specimen's own nose (skin, alae, columella, vestibule) unmasked from the
UW axial stack, centred and mirrored like the rest (N1), the vestibule
labelled, the internal valve measured, and the nasal cavity label carried
forward to the valve, which is where the septal chart and the NSF's
anterior cut now end (ST3r's "mucocutaneous junction").
Read: this WP; §4 "CP-2b" of this file; `docs/ssb.md` §5.1 (standard
specimen; the face-mask exception), §5.4, §5.7 (the anterior cut); the
docstrings of `tools/ssb-pipeline/uw/nose.py`, `normalize.py`,
`specimen.py` (`frame`, `resample`, the face mask), `meshes.py`.
Touch: `tools/ssb-pipeline/uw/nose.py` (new subcommand), `normalize.py`
(one new step, and `all`); `ssb/ct/*`, `ssb/models/*` (new `nose` pack,
`packs.json`), `ssb/geometry/*` (`labels.json` append-only);
`js/ssb/materials.js` (a `skin` kind), `css/ssb.css` (`--ssb-skin`, both
themes), `js/ssb/mode-specimen.js` + `js/ssb/ui-specimen.js` (the pack's
`extras.kind`, a Nose layer); `tools/test-ssb.mjs`; docs pass.
Don't: unmask anything outside the region of step 1 (lips, cheeks, eyelids
stay masked: `docs/ssb.md` §5.1); change graph content; hand-edit an
output; commit `incoming/`; change a test threshold.
Numbers measured at CP-2b on the unmasked stack (E1b's resample, R −30…30,
A −30…45, S −20…60, 0.5 mm), for the executor to reproduce (± 1.5 mm):
pronasale A 18.0 at S 4.5 (the reconstruction circle's no-data edge is at
A ≈ 20.5 there: the tip is 2 mm from it, so it may be slightly flattened);
subnasale S −6.5 (A 7.0); soft-tissue nasion S 41.5 (A −5.5); the
alar-facial grooves (the lowest point of the skin profile A(R) either side
of the nose) at |R| ≈ 19–24 for S −6…26; the nose's skin midpoint and the
tissue between the two vestibule lumens (caudal septum / columella) lie
within −1.0…+1.0 mm of R = 0; the right airway's coronal cross-section is
smallest, 92–100 mm², over A −15…−9.
Steps:
1. Region (`nose.py unmask`, reads the raw axial stack like E1b and the
   as-scanned `ssb/ct`): per axial level S from subnasale − 2 mm to nasion,
   the voxels anterior to the as-scanned mask (display 0 in the as-scanned
   volume, non-zero in the unmasked resample) and between that level's two
   alar-facial grooves; above S 28, also |R| ≤ 12 (keeps the medial
   canthi out). Print the levels, groove R per level and the voxel count;
   write the region and the unmasked display inside it to
   `incoming/_recon/nose-patch.npz` on the `ssb/ct` grid.
2. Patch and centre (a new `normalize.py` step between reading the
   as-scanned input and step 1, so `normalize.py all` reproduces it):
   inside the region, the display takes the unmasked value. Per (A, S) row
   of the region, c = the midpoint of the tissue run between the two
   vestibule lumens where both exist (`nose.py`'s lumen rule), else the
   midpoint of the skin's two edges; 3×3 median; taper to 0 over 3 mm at
   the region's edge; shift each row by −c (as N1 step 2 shifts the
   septum). Print c's median and max. Then N1 runs as it is (mirror at
   R = 0, plates, stages).
3. Internal valve, per side on the right (mirrored after): over A from
   `lm.naris` A − 25 to − 10, the coronal plane where the airway
   component connected to `lm.naris` has the smallest area (3 mm moving
   mean). Landmark `s.internal-nasal-valve.<side>` = that section's
   centroid; meta: method, A, area mm². (Opus checks the area against
   `src.bloom-2012-valve-ct` at the checkpoint; the executor only prints.)
4. Labels: air anterior to the valve plane, connected to `lm.naris` and
   enclosed by `nose.py`'s lumen rule (tissue medially and laterally within
   12 mm on its row), from the alar-rim band's lower S up, becomes
   `s.nasal-vestibule.<side>` (append the indices). Unlabelled air behind
   the valve plane and connected to `s.nasal-cavity.<side>` joins it, and
   nasal-cavity air anterior to the plane becomes vestibule: the
   vestibule | cavity boundary is the valve plane (the limen nasi: a
   proxy for the mucocutaneous junction, which CT does not show; say so in
   the meta). Outside air stays unlabelled.
5. Meshes: `meshes.py` meshes the vestibule like any air label; a new
   `nose` pack holds the skin surface (marching cubes, tissue ≥ 78 against
   outside air, inside the region only; ≤ 8,000 triangles; node
   `s.external-nose.M`, `extras.kind: "skin"`), and the vestibule's air
   nodes carry `extras.kind: "skin"` too (vestibular skin, not mucosa).
   `packs.json` lists the pack; budgets §5.4.
6. Runtime: `materials.js` gains a `skin` tissue kind (matte, faint
   pore-scale noise like the mucosa's pattern, no vessels) on a new
   `--ssb-skin` token in both themes; `mode-specimen.js` uses
   `extras.kind` when a node has one, else the graph kind; a "Nose" layer
   toggle (default on) in the Specimen controls.
7. Septal chart: `softtissue.py` (rerun by `all`) now reaches the valve
   plane; print the chart's new anterior edge A against the old (−9.5) and
   the area change, per side.
Accept: `normalize.py all` prints steps 1–4 and 7, and pack bytes and
triangles against §5.4 and against N1's; `check-data.mjs`; `test-ssb.mjs`
(full) with new checks: the nose pack loads with one `s.external-nose.M`
node drawn as skin; the volume is still mirror-symmetric (N1's checks);
`lm.naris.<side>` lies in `s.nasal-vestibule.<side>` air; the valve
landmark lies in air at the valve plane; every pinned scope pose is
unchanged or re-pinned in the PR (old → new); `smoke-pages.mjs`.
Escalate: |c| > 2 mm anywhere; the valve minimum lies at either end of its
A window; the region touches the as-scanned mask's no-data edge over more
than the tip; a budget breaks; the vestibule and the outside air are one
component under step 4's rule (the nostril is not closed off by it).
Not in ST6: cartilage. O1's "cartilage as a schematic overlay" needs the
framework's geometry (ULC/LLC crura) and goes to ST7.

*Result (Sonnet, 2026-10-07; `normalize.py all` prints it as the `ST6 1..5, 7` lines):* (1) region: 99 levels S −8.5…40.5, pronasale (A 18.0, S 4.5), subnasale (7.0, −6.5), nasion (−5.5, 40.5) as measured at CP-2b; the grooves are the minimum of A(R) + 0.25 R (smoothed) inside the checkpoint's corridor |R| 19…24, because the profile is monotone at most levels and has no lowest point; 377k voxels, the outside air in front of the nose included (it reads 45, not 0). The skin within 1 mm of the source image's anterior border (flattened by it) is S 4.0…7.5, the tip only. (2) centring: |c| median 0.50 mm, **max 2.00 mm** (the limit, not over it; raw single rows reach 2.5 at the sill, removed by the 3×3 median); the columella pairs give c ≈ 0, the skin edges −0.5…−1; only region voxels move, to region voxels. (3) valve at A **−10.0**, section **116.0 mm²** (3 mm mean 117.8), centroid (4.66, −10.0, 13.58): the profile is flat, 112…131 mm² over A −16…−9, and 116 is above the checkpoint's 92–100 (Opus: the area against `src.bloom-2012-valve-ct`; with the cavity label alone the same plane reads 70). (4) vestibule 1277 mm³ per side, one piece, A −9.5…12.5, S 3.5…30.5 — it has no upper S bound, so the air under the nasal bones in front of the plane is vestibule too; 646 unlabelled airway voxels behind the plane (A −12…−10, S 0…11) join the cavity, which also moves the floor chart's anterior row from A −12 to −10. (5) pack `nose`: 7,998 triangles, 73 KB, 30 cm²; the vestibule is in `core` (2 × 3,000 budget); all packs 395,238 triangles (budget 400k) and 3.5 MB; CT + labels + distance fields 4.5 MB. (7) septal chart anterior edge A −10.0 (HEAD −3.0; the −9.5 in the spec was not HEAD's), area 14.48 cm² (was 15.19) on both sides. Tests: `check-data` and `test-ssb` pass; new Node and page checks for the labels, the landmark, the chart, the pack, the kind and the layer. **Re-pinned (old → new):** shaft contact at R 40 straight 25 → 30 mm and at the sphenoid pose 11 → 13 mm (the nostril's wall is tissue now; poses unchanged); the floor-chart check measures the last occupied row (≤ −10, its title's bound) instead of the padded grid end (≤ −9), because the row is now −10; the mucosa and scope checks expect the vestibule drawn as skin. All 13 station poses of E5, checked with a scratch copy of E6's Node checks (E6 had not merged): unchanged, free, tips in air labels, targets in the field, left = right mirrored.
**Deviations (one-line files outside Touch, needed by the WP's own steps):** `meshes.py` (the vestibule in the `core` pack and its budget; `extras.kind` from a `KIND` map), `walls.py` (the vestibule in `AIR_IDS`, or its label is wiped; and the septum rule counts it as the side's airway, or the septal chart is ragged and 2 cm² smaller at its anterior end), `geo-specimen.js` (reads `extras.kind`), `mode-endoscope.js` / `ui-endoscope.js` (two stale sentences about the masked nose), `sweeps-soft.json`: **the superior labial septal branch's three waypoints (A −9…−8) were off the new chart, which ends at A −10, and `softtissue.py` stops on that; they are re-seated on the edge row, same S, per the entry's own "along the anterior septal margin" — Opus/ST4d to confirm or redraw the columella entry.** **For the checkpoint:** poses for `t.septum-anterior` and `t.lacrimal-sac-0` (E5 finding 3: reachable now? not tried, they are Opus poses); E6 must re-run its station test (the scratch check found nothing to change).

### ST7 — Nasal framework: anatomy for a rhinoplasty model        [specced 2026-10-07] · Opus spec → Sonnet build · spec: `docs/ssb.md` §6.2
Owner decision O2 (2026-10-02): the atlas covers the whole nasal framework.
The spec (`docs/ssb.md` §6.2) builds it as the `nasal-framework` diorama —
framework, envelope in layers, vessels and nerves by layer, three computed
rules (tripod, dissection plane, thick skin) — shaped as the substrate of a
later rhinoplasty model, then fits it under the specimen's skin. Five WPs
and two checkpoints:

| WP | What | Who | Depends | Lane |
|---|---|---|---|---|
| ST7a | Graph content for the framework, envelope, vessels, nerves; vocabulary | Sonnet drafts → Opus review (CP-ST7a) | ST6 merged (the `skin` material kind) | A |
| ST7b | `kit.js`: `strip` solid, exact distance transform, marching cubes | Sonnet | — | A (first) |
| ST7c | The diorama, to §6.2, rules 0–13 | Sonnet | ST7a, ST7b merged | A |
| ST7d | The specimen's bony nose (nasal bone / frontal process labels, rhinion, sellion, piriform rim) and ST6's skin landmarks written | Sonnet | ST6 merged | B (after ST5) |
| ST7e | Fit on the specimen | Sonnet (spec finalized by Opus at CP-ST7c) | ST7c, ST7d; O7 = (b) or (c) | A |

Population and class defaults wait on O8 but nothing blocks on it: the
spec's defaults stand until the owner says otherwise.

### ST7a — Nasal framework content        [todo: branch after ST6 merges] · Sonnet drafts → Opus review (CP-ST7a) · depends: ST6 merged
Goal: every id `docs/ssb.md` §6.2 names exists in the graph, sourced from
the PubMed records below, so the diorama (ST7c) builds on ids and cited
numbers only.
Read: `docs/authoring-ssb.md` (all); `docs/ssb.md` §6.2; this WP; the
abstracts of the sources below (PubMed E-utilities `efetch`, as ST0 did);
`ssb/content/nasal-maxillary-ppf.json` only to find the existing nose ids
and the house style.
Touch: new `ssb/content/external-nose.json`; `ssb/content/sources.json`
(new sources only; C1 batches also append — keep both sides of an append
conflict); `tools/ssb-content.mjs` (vocabularies: region `external-nose`;
kind `skin`; measurement and prevalence method `ultrasound`, `histology`,
`clinical`); `js/ssb/materials.js` (one `GRAPH_KIND` line: `skin` →
the `skin` material ST6 added); `docs/authoring-ssb.md` §6 (the same
vocabulary); in `nasal-maxillary-ppf.json`, **only** the `geo` field of
`s.nasal-bone`, `s.piriform-aperture`, `s.nasal-ala`, `s.columella`,
`s.lateral-nasal-artery`, `s.dorsal-nasal-artery`, `s.columellar-artery`,
`s.superior-labial-artery` (→ `"diorama"`); docs pass.
Don't: set `review` to anything but `"draft"`; set a source `verified:
true` before its PubMed match (the match is this WP's job: record PMID and
DOI from the record, never from this table without checking); edit an
existing entity's text; add coordinates, stations or pathways; write a
number the abstract does not give (`docs/authoring-ssb.md` §7.7) — if the
spec names a number its source's abstract lacks, report it.

*Entities* (region `external-nose` unless the id exists; tier in brackets;
what each must say comes from the sources listed with it):

- **Framework** — `s.upper-lateral-cartilage` [1] (fused to the dorsal
  septum as one complex, Han 2019; passes under the nasal bones at the
  keystone, Palhazi 2015; width/thickness, El-Shaarawy 2016);
  `s.lower-lateral-cartilage` [1] (syn alar cartilage, major alar
  cartilage; the alar ring, Daniel 2014) with `partOf` children
  `s.medial-crus` [1], `s.medial-crural-footplate` [2],
  `s.intermediate-crus` [2] (syn middle crus; lobular and domal segments,
  Daniel 1992), `s.lateral-crus` [1] (domal notch, turning point, accessory
  chain; caudal border higher than cephalic, Daniel 2014; LC strut
  indications, Gunter 1997; sagittal malposition, Hamilton 2016);
  `s.accessory-alar-cartilages` [2] (syn sesamoid cartilages, lateral
  crural complex; Daniel 2014, Ebrahimi 2012, Haddad 2022, Bruintjes 1998
  — the hinge area); `s.keystone-area` [2] (kind region; Palhazi 2015,
  Irmak 2020, Mau 2007).
- **Ligaments** (kind ligament) — `s.interdomal-ligament` [2],
  `s.intercrural-ligament` [3], `s.pitanguy-ligament` [2] (syn
  dermocartilaginous ligament, midline ligament; Pitanguy 1965 as eponym,
  Saban 2008 for what it is), `s.scroll-ligament` [2] (longitudinal and
  vertical parts; Ku 2025's inferior nasal retaining ligament in `syn`),
  `s.pyriform-ligament` [2] (Rohrich 2008). Each with `attaches-to` edges
  naming the parts its source names — rule 12 of §6.2 tests them; where
  the abstract does not say where an end attaches, write no edge and list
  it under "check hardest".
- **Envelope** — `s.nasal-soft-tissue-envelope` [1] (kind region; syn STE,
  skin–soft-tissue envelope), its layers `s.nasal-skin` [1] (kind skin),
  `s.nasal-superficial-fat` [2] (fat), `s.nasal-smas` [2] (kind muscle;
  the fibromuscular layer; Letourneau 1988, Saban 2008, and Figallo 2001's
  doubt in a pearl), `s.nasal-deep-fat` [2] (fat), all `partOf` the
  envelope.
- **Muscles** (kind muscle) — `s.procerus` [2], `s.nasalis-transverse`
  [2], `s.nasalis-alar` [2], `s.dilator-naris-anterior` [3],
  `s.depressor-septi-nasi` [2]; origins and insertions as `attaches-to`
  edges from Hur 2011, Bruintjes 1998, Tansatit 2016, Rohrich 2000.
- **Vessels and nerves** — `s.angular-artery` [2] (branch of
  `s.facial-artery`; Kim 2014, Saban 2012), `s.angular-vein` [3]
  (Iwanaga 2022), `s.lateral-nasal-vein` [3] (the one vessel deep to the
  SMAS, Toriumi 1996), `s.external-nasal-nerve` [2] (branch of
  `s.anterior-ethmoidal-nerve`; Han 2004).
- **Landmarks** — `lm.soft-tissue-nasion`, `lm.sellion` and `lm.rhinion`
  (of `s.nasal-bone`; Lazovic 2015), `lm.pronasale`, `lm.subnasale`,
  `lm.columella-lobule-junction`, `lm.alar-crease` (Byrd 1993's alar-cheek
  junction), `lm.dome` (of `s.intermediate-crus`), `lm.anterior-septal-angle`
  (of `s.septal-cartilage`; Daniel 2018).
- **Classifications** — `c.nasal-bone-shape` (V / S; Lazovic 2015),
  `c.medial-crura-shape` (1–3; Patel 2013), `c.angular-artery-course`
  (I–IV; Kim 2014), `c.external-nasal-nerve-branching` (I–III; Han 2004),
  `c.depressor-septi-type` (I–III; Rohrich 2000). Prevalences in
  `caveats`, each with its denominator.
- **Variants** — `v.columellar-artery-presence` (Rohrich 1995: bilateral
  9, unilateral 68, absent 23 % of 31 specimens; Tansatit 2016's 31.1 % of
  45 is a different quantity — note it), `v.supratip-arterial-anastomosis`
  (64.4 % of 45; Tansatit 2016), `v.nasal-sesamoid-cartilage` (the four
  sources of §6.2's disagreement list, each as its own `prev` entry with
  method and denominator).
- **Measurements** (one value each; `from`/`to` where a landmark pair
  defines it) — `m.ste-thickness-nasion` 4.13 ± 0.72, `-rhinion`
  2.25 ± 0.51, `-supratip` 4.88 ± 0.74, `-tip` 4.07 ± 0.72 mm,
  `m.nasal-dermis-thickness-tip` 2.35 ± 0.49, `-nasion` 1.35 ± 0.35 mm
  (Chen 2024; method `ultrasound`; n 110; Asian; Çavuş Özkan 2020 in
  `note`); `m.keystone-length` 8.9 and `m.keystone-width` 4.9 mm (Palhazi
  2015, n 15); `m.nasal-bone-ulc-overlap` 6.47 ± 2.50 mm midline,
  3.53 / 3.81 lateral in `note` (Han 2019, n 16); `m.dome-asa-projection`
  5.7 (2.2–9.6) and `m.dome-asa-caudal` 5.5 (2.9–9.5) mm (Daniel 2018,
  n 14); `m.interdomal-distance` 13.8 ± 3.2 and
  `m.interdomal-ligament-depth` 1.6 ± 0.5 (1.0–2.4) mm (Marangi 2025);
  `m.lateral-crus-length` 23.4, `-width-domal-notch` 6.4,
  `-width-turning-point` 11.1, `-thickness` 0.5 mm (cadaver, n 20, mean
  age 74), `m.lateral-crus-orientation` 43.6° and
  `m.lateral-crus-to-mid-nostril` 5.9 mm (`clinical`, 40 women) (all
  Daniel 2014); `m.lateral-crus-to-alar-margin` (Hatzis 2004: the mean is
  below 6.7 mm over the anterior 15 mm; record 6.7 as the bound, not as a
  mean, conf low); `m.ulc-width` 12.8 ± 1.29 and `m.ulc-thickness`
  1.34 ± 0.14 mm, `m.alar-divergence-angle` 23–44° (El-Shaarawy 2016,
  n 30); `m.septal-cartilage-length`, `-height`, `-area`, `-thickness`,
  `m.septal-harvestable-area` (Hwang 2010 n 14; Samibut 2021 n 42 — one
  entity per quantity, each study a value only if the schema allows,
  otherwise the larger series as the value and the other in `note`;
  Han 2019 and Han 2018's arcs in `note`); `m.external-nasal-nerve-exit`
  7.3 ± 0.6 (6.5–8.5) mm (Han 2004, 20 nerves);
  `m.lateral-nasal-artery-to-alar-groove` 2–3 mm (Rohrich 1995, n 31);
  `m.tip-projection-ratio` 0.67 (Byrd 1993; `note`: an aesthetic target
  from 87 models); `m.nasal-lower-border-to-fh` 18 ± 7° and
  `m.nasolabial-angle` 114 ± 10° (Fitzgerald 1992, n 104; `note`: faces
  chosen as balanced; the standard specimen's ≈ 89° in §4's O1 evidence was
  taken by a different construction and is not comparable as it stands).
- **Principles** — `pr.nasal-tip-tripod` (Anderson 1984; Janeke & Wright
  1971 as origin; Daniel 2018's reassessment as `caveat`: the domes are
  not supported by the ASA); `pr.dissect-below-the-smas` (Toriumi 1996,
  Rohrich 1995, Jung 2000, Han 2004: the plane on the perichondrium keeps
  the arcade and the external nasal nerve in the flap).
- **Procedure and hazards** — `p.open-rhinoplasty-approach` [2]
  (exposure only: transcolumellar and marginal incisions, elevation in the
  areolar plane on the perichondrium over the tip and middle vault; Toriumi
  1996, Rohrich 1995, Neves 2021, Hatzis 2004; steps only as deep as the
  abstracts go); `h.nasal-tip-skin-necrosis` (at `s.nasal-skin`, during
  that procedure; Rohrich 1995, Toriumi 1996, Jung 2000);
  `h.external-nasal-nerve-injury` (Han 2004). The rhinoplasty manoeuvres
  themselves are not in ST7.

*Sources* (PubMed records fetched 2026-10-07 by Opus; re-match each and
store PMID and DOI from the record; abstract-only reading, say so in
`note`):

| Proposed id | Record | PMID | DOI | type | Supports |
|---|---|---|---|---|---|
| `src.rohrich-1995-tip-blood-supply` | Rohrich, Gunter, Friedman. Plast Reconstr Surg 1995;95(5):795 | 7708862 | — | cadaver | lateral nasal artery (31/31, subdermal, 2–3 mm above the groove), columellar presence, crossover flow, alar base resection above the groove |
| `src.toriumi-1996-nose-vessels` | exists | 8554743 | exists | cadaver | vessels in or above the SMAS; lateral nasal veins deep; alar arcade; sub-SMAS plane |
| `src.jung-2000-nasal-tip-arteries` | exists | 10680935 | exists | cadaver | main tip supply 78 / 22 %; columellar arteries near the plane at the dome |
| `src.saban-2012-nasal-arteries` | Saban et al. Arch Facial Plast Surg 2012;14(6):429 | 22710606 | 10.1001/archfacial.2012.202 | cadaver | polygonal ECA–ICA system (Doppler flow reversal) |
| `src.tansatit-2016-nasal-midline` | Tansatit et al. Aesthetic Plast Surg 2016;40(2):236 | 26893278 | 10.1007/s00266-016-0621-1 | cadaver | midline columellar artery 31.1 %, supratip anastomosis 64.4 %, nasalis over the ULC, procerus |
| `src.kim-2014-angular-artery` | Kim et al. Dermatol Surg 2014;40(10):1070 | 25207758 | 10.1097/01.DSS.0000452661.61916.b5 | cadaver | angular artery types I–IV |
| `src.iwanaga-2022-angular-vein` | Iwanaga et al. PLoS One 2022;17(10):e0276121 | 36228011 | 10.1371/journal.pone.0276121 | cadaver | the angular vein's course: through the depressor supercilii to the medial palpebral ligament, between the LLSAN origin and the orbicularis oculi, three types at the alar level (44 Korean cadavers) |
| `src.letourneau-1988-nasal-smas` | Letourneau, Daniel. Plast Reconstr Surg 1988;82(1):48 | 3380925 | — | cadaver | the five soft-tissue components; elevate beneath the musculature |
| `src.saban-2008-nasal-smas` | Saban et al. Arch Facial Plast Surg 2008;10(2):109 | 18347238 | 10.1001/archfaci.10.2.109 | cadaver | SMAS split at the valve; Pitanguy = deep medial expansion; lowering ligaments |
| `src.figallo-2001-tip-trigonum` | Figallo, Acosta. Plast Reconstr Surg 2001;108(5):1118 | 11604607 | 10.1097/00006534-200110000-00003 | review | doubt about a true nasal SMAS |
| `src.neves-2021-dissection-planes` | Neves et al. Facial Plast Surg 2021;37(1):2 | 33634451 | 10.1055/s-0041-1723825 | review | the four dissection planes |
| `src.daniel-2018-nasal-ligaments` | Daniel, Palhazi. Aesthet Surg J 2018;38(4):357 | 29365051 | 10.1093/asj/sjx192 | cadaver | the five ligaments found, two not found; dome–ASA offsets |
| `src.marangi-2025-interdomal-ligament` | Marangi et al. J Plast Reconstr Aesthet Surg 2025;102:218 | 39938461 | 10.1016/j.bjps.2025.01.031 | cadaver | interdomal ligament present 24/25, depth, area, interdomal distance |
| `src.irmak-2020-keystone-scroll` | Irmak et al. Plast Reconstr Surg 2020;146(1):75 | 32590646 | 10.1097/PRS.0000000000006895 | cadaver | keystone histology; scroll complex; interdomal as a transition |
| `src.rohrich-2008-pyriform-ligament` | Rohrich et al. Plast Reconstr Surg 2008;121(1):277 | 18176231 | 10.1097/01.prs.0000293880.38769.cc | cadaver | pyriform ligament |
| `src.ku-2025-nasal-retaining-ligaments` | Ku et al. J Plast Reconstr Aesthet Surg 2025;106:35 | 40367650 | 10.1016/j.bjps.2025.03.037 | cadaver | vertical scroll = inferior nasal retaining ligament (Asian) |
| `src.pitanguy-1965-dermocartilaginous` | Pitanguy. Plast Reconstr Surg 1965;36:247 | 14339183 | 10.1097/00006534-196508000-00014 | (no abstract: type from the record's publication type) | eponym only |
| `src.janeke-1971-tip-support` | Janeke, Wright. Arch Otolaryngol 1971;93(5):458 | 5554881 | 10.1001/archotol.1971.00770060704004 | (no abstract) | origin of the tip-support studies only |
| `src.anderson-1984-tripod` | Anderson. Arch Otolaryngol 1984;110(6):349 | 6721774 | 10.1001/archotol.1984.00800320003001 | review | the tripod concept |
| `src.palhazi-2015-vault` | Palhazi, Daniel, Kosins. Aesthet Surg J 2015;35(3):242 | 25805276 | 10.1093/asj/sju079 | cadaver | keystone length and width; profile set by the cartilaginous vault |
| `src.lazovic-2015-nasal-bones` | Lazovic et al. Aesthet Surg J 2015;35(3):255 | 25805278 | 10.1093/asj/sju050 | cadaver | V / S shapes; sellion, radix, bony dorsum |
| `src.han-2019-keystone` | Han Z et al. Aesthet Surg J 2019;39(6):595 | 30321258 | 10.1093/asj/sjy255 | cadaver | NB–ULC overlap; ULC–septal complex; quadrangular cartilage size |
| `src.daniel-1992-nasal-tip` | Daniel. Plast Reconstr Surg 1992;89(2):216 | 1732887 | 10.1097/00006534-199202000-00002 | cohort | three crura, two segments each; tip angles |
| `src.daniel-2014-lateral-crura` | Daniel et al. Aesthet Surg J 2014;34(4):526 | 24682443 | 10.1177/1090820X14528464 | cadaver | lateral crus dimensions, orientation, alar ring, accessory chain |
| `src.hatzis-2004-lateral-crus` | Hatzis et al. Oral Surg Oral Med Oral Pathol Oral Radiol Endod 2004;97(4):432 | 15088028 | 10.1016/j.tripleo.2003.10.012 | cadaver | lateral crus to alar margin; dimorphism; asymmetry |
| `src.gunter-1997-lateral-crural-strut` | Gunter, Friedman. Plast Reconstr Surg 1997;99(4):943 | 9091939 | 10.1097/00006534-199704000-00001 | cohort | indications for the lateral crural strut |
| `src.hamilton-2016-lateral-crus` | Hamilton. Facial Plast Surg 2016;32(1):49 | 26862964 | 10.1055/s-0035-1570504 | review | cephalic and sagittal malposition |
| `src.toriumi-2006-tip-contour` | Toriumi. Arch Facial Plast Surg 2006;8(3):156 | 16702528 | 10.1001/archfaci.8.3.156 | review | dome sutures and the caudal margin; thick skin and shield grafts |
| `src.patel-2013-medial-crura` | Patel et al. Plast Reconstr Surg 2013;132(4):787 | 24076670 | 10.1097/PRS.0b013e3182a0137a | cadaver | medial crura types 1–3 |
| `src.el-shaarawy-2016-nasal-cartilages` | El-Shaarawy. Folia Morphol 2016;75(3):316 | 26916202 | 10.5603/FM.a2016.0008 | cadaver | ULC width and thickness; divergence angle |
| `src.ebrahimi-2012-sesamoid` | Ebrahimi et al. Oral Surg Oral Med Oral Pathol Oral Radiol 2012;114(2):e22 | 22769416 | 10.1016/j.oooo.2011.09.020 | cadaver | sesamoid prevalence and size |
| `src.greenlund-2023-sesamoid` | Greenlund et al. Ann Otol Rhinol Laryngol 2023;132(11):1438 | 37002594 | 10.1177/00034894231165134 | cohort | cartilage rare in Mohs alar histology |
| `src.haddad-2022-llj-micro-mri` | Haddad et al. Surg Radiol Anat 2022;44(10):1367 | 36208337 | 10.1007/s00276-022-03029-z | cadaver | ULC–LLC junction types; posterior accessory cartilages |
| `src.hwang-2010-septal-thickness` | Hwang et al. J Craniofac Surg 2010;21(1):243 | 20098189 | 10.1097/SCS.0b013e3181c5a203 | cadaver | septal cartilage size and thickness map |
| `src.samibut-2021-septal-cartilage` | Samibut et al. Aesthetic Plast Surg 2021;45(4):1705 | 33432388 | 10.1007/s00266-020-02116-z | cadaver | septal size, area, harvestable area after a 10 mm L-strut |
| `src.han-2018-septal-arcs` | Han PS et al. Laryngoscope 2018;128(8):1806 | 29536545 | 10.1002/lary.27154 | cadaver | dorsal and caudal arcs and rises |
| `src.mau-2007-l-strut` | exists | 17721403 | exists | cadaver | strut failure at the bony–cartilaginous junction; overlap |
| `src.han-2004-external-nasal-nerve` | Han SK et al. Plast Reconstr Surg 2004;114(5):1055 | 15457012 | 10.1097/01.prs.0000135335.60575.d9 | cadaver | exit point, layer, branching, precautions |
| `src.hur-2011-nasal-muscles` | Hur et al. Clin Anat 2011;24(2):162 | 21254248 | 10.1002/ca.21115 | cadaver | dilator naris anterior, alar nasalis, dilator naris vestibularis |
| `src.bruintjes-1998-valve-muscles` | Bruintjes et al. Laryngoscope 1998;108(7):1025 | 9665251 | 10.1097/00005537-199807000-00014 | cadaver | lateral wall in three parts; hinge area; muscle actions |
| `src.rohrich-2000-depressor-septi` | Rohrich et al. Plast Reconstr Surg 2000;105(1):376 | 10627007 | 10.1097/00006534-200001000-00059 | cadaver | depressor types I–III |
| `src.chen-2024-ste-ultrasound` | Chen et al. Aesthetic Plast Surg 2024;48(17):3292 | 38565724 | 10.1007/s00266-024-03906-5 | cohort | STE and dermis by site (Asian) |
| `src.cavus-ozkan-2020-ste-mri` | Çavuş Özkan et al. Aesthet Surg J 2020;40(7):711 | 32003429 | 10.1093/asj/sjz320 | cohort | STE pattern by site, sex, age (MRI) |
| `src.byrd-1993-planning` | Byrd, Hobar. Plast Reconstr Surg 1993;91(4):642 | 8446718 | — | cohort | proportioned length, tip and radix projection |
| `src.fitzgerald-1992-nasolabial` | Fitzgerald, Nanda, Currier. Am J Orthod Dentofacial Orthop 1992;102(4):328 | 1456217 | 10.1016/0889-5406(92)70048-F | cohort | nasolabial angle and the nose's lower border to FH |

*Check hardest* (the PR lists these first, with what each entity says):
the disagreements of `docs/ssb.md` §6.2 (each must be stated in the
entity, not resolved by picking one); every `attaches-to` edge's source
sentence; the two textbook-only claims the spec relied on and that need a
PubMed source or are dropped (the levator labii superioris alaeque nasi
was dropped for this reason; a definition of cephalic malposition with a
threshold — none in hand, so `lc_orientation` carries no class);
prevalences whose classes do not sum to 100 % (Kim 2014); what
Marangi 2025's interdomal distance is measured between; anything
written beyond an abstract.
Accept: `node tools/ssb-content.mjs`, `node tools/check-data.mjs`,
`node tools/test-ssb.mjs` (the materials ↔ graph-kinds agreement);
the PR lists every new id with tier and sources.
Escalate: an abstract does not support a number the spec uses (say which;
the spec changes, not the number); an entity would duplicate an existing
one; a source's record differs from this table.

### ST7b — Kit: strip, distance transform, iso-surface        [ready] · Sonnet · depends: —
Goal: the three DOM-free primitives §6.2 needs, each with one inside test
and one mesh builder (`docs/ssb.md` §6), tested in Node.
Read: `docs/ssb.md` §6 and §6.2 (the envelope paragraph); `js/ssb/dioramas/kit.js`;
`tools/test-ssb.mjs` (how the lab section runs kit in Node).
Touch: `js/ssb/dioramas/kit.js`; `tools/test-ssb.mjs` (a `kit`
section, `--only kit`); `docs/ssb.md` §6 (the primitive list); docs pass.
Don't: change an existing primitive's output (the three dioramas' tests
pass unchanged); add a dependency or vendored library (the marching-cubes
tables are data written in the file); import three.js (it is passed in).
Steps:
1. `strip` solid: `{ type: 'strip', pts, wdir, w, t }` — centreline
   points (≥ 2), a unit width direction per point (re-orthogonalized to the
   tangent), per-point width offsets `[lo, hi]` along it, thickness `t`
   (mm, or per point). `inside()`: the nearest point on the polyline
   (global minimum over segments; ties to the lower index), local (u along
   the width direction, v along tangent × width), inside iff the
   projection lies on the polyline, lo ≤ u ≤ hi and \|v\| ≤ t/2.
   Because the nearest-point frame is only unique while the strip bends
   about its width axis (as cartilage does), `kit` rejects a strip whose
   in-plane curvature κ_w satisfies κ_w · max(\|lo\|, \|hi\|) > 0.5 (throws,
   with the point index). Mesh: a closed thickened strip, `seg`
   subdivisions per segment (default 4), outward normals; `bounds()`.
2. `edt(mask, nx, ny, nz, step)`: exact Euclidean distance in mm from
   every voxel to the nearest set voxel (0 on it), separable
   (Felzenszwalb–Huttenlocher lower envelope of parabolas), Float32Array.
3. `iso`: `isoGeometry(THREE, field, nx, ny, nz, origin, step, level)` —
   marching cubes with the standard 256-case tables, vertices welded per
   grid edge, normals from the field's gradient — and
   `isoInside(field, nx, ny, nz, origin, step, level)(x, y, z)`: trilinear
   field below the level (outside the grid: false).
Accept: `node tools/test-ssb.mjs --only kit`, then the full suite:
strip — on a straight, a 90° and a 180° (hairpin about the width axis)
strip, `inside()` agrees with a ray-parity test against its mesh on
≥ 99.5 % of 20 000 random points, every disagreement within 0.1 mm of the
surface, and a strip bent in its own plane past the limit throws; edt —
exact (1e-4 mm) against brute force on random 24³ masks at steps 0.5 and
1.0, and on a single voxel; iso — a sphere field r = 10 mm at 0.5 mm
encloses 4/3·π·r³ within 1 %, the mesh is closed (every edge in exactly
two triangles), every vertex's trilinear value is within 1e-3 of the
level, and `isoInside` agrees with ray parity on ≥ 99.5 % of random
points; timing printed: edt and iso on a 1.2 M-voxel grid.
Escalate: edt on 1.2 M voxels takes > 300 ms or iso > 200 ms in Node on
the CI runner (report both; §6.2's budget then needs the 1.0 mm grid by
default).

### ST7c — The `nasal-framework` diorama        [todo] · Sonnet · depends: ST7a, ST7b merged
Goal: `js/ssb/dioramas/nasal-framework.js` to `docs/ssb.md` §6.2 as it
stands, with rules 0–13 pinned.
Read: `docs/ssb.md` §6, §6.1 (the pattern of rules computed from solids,
and the degrade table), §6.2; `js/ssb/dioramas/sphenoid.js` (module
pattern, header of schematic proportions, `degrade()`),
`frontal-recess.js` (voxelizing the drawn solids), `kit.js`;
`tools/test-ssb.mjs` lab section; `js/ssb/materials.js` (kinds).
Touch: new `js/ssb/dioramas/nasal-framework.js`, `js/ssb/dioramas/index.js`,
`tools/test-ssb.mjs`; docs pass (`docs/ssb.md` §6 table, `WIP.md`).
Don't: invent a proportion, attachment or depth §6.2 does not give (stop
instead); change `kit.js` (ST7b's); add tokens or materials (every kind
exists after ST6 and ST7a); change graph content.
Steps: anchors and construction order; parts; envelope field and layers;
tubes in envelope coordinates; `PARAMS`, `PRESETS`, `VIEWS`, `classify`,
`readout`; hazard sites; the degrade table; the module header listing
every schematic proportion; rules 0–13 in `--only lab`.
Accept: `node tools/test-ssb.mjs --only lab` (rules 0–13) and the full
suite, `node tools/check-data.mjs`, `node tools/smoke-pages.mjs`; in the
PR: the default readouts (projection ratio, rotation, domes–ASA, valve
angle, keystone, lateral crus to rim, envelope at four sites, septal and
harvestable area, each plane's carried / cut / deep sets, external nasal
nerve exit), build time, part and triangle counts, and screenshots of the
five views at the default, at `ste_scale` 0.6 and 1.6, and with each plane.
Escalate: rule 3's dip is not monotone (send the A(x) profiles — it
should be, by construction); rule 10's sets need a depth or radius other
than §6.2's to hold (send the clearances, do not tune); the tripod has no solution within
±5 mm at the default (send the leg lengths); the domes' construction
(rule 7) puts the ASA where the septal outline fails rule 9; a muscle or
ligament end has no `attaches-to` edge to land on; a budget breaks.

### ST7d — The specimen's bony nose and skin landmarks        [todo] · Sonnet · depends: ST6 merged · lane B after ST5
Goal: the specimen's own nasal bones, frontal processes, rhinion, sellion
and piriform rim, and ST6's measured skin points, as data — the anchors
ST7e fits to, and the n = 1 values beside §6.2's population numbers.
Read: `docs/ssb.md` §5.1–§5.3, §6.2 (anchors, fit); the docstrings of
`tools/ssb-pipeline/uw/walls.py` (compartments, walls), `nose.py`
(ST6's region and groove rules), `normalize.py`, `meshes.py`.
Touch: new `tools/ssb-pipeline/uw/nosebone.py` (or a `nose.py`
subcommand), `normalize.py` (`all` runs it after ST6's step);
`ssb/ct/labels.u16.gz`, `ssb/geometry/labels.json` (append-only),
`landmarks.json` and `.meta.json`, `sweeps.json` and `.meta.json`,
`ssb/models/*` (the new labels meshed into the `nose` pack);
`tools/test-ssb.mjs`; docs pass.
Don't: hand-edit an output; change ST6's unmask region; rename a label.
Steps:
1. *Bony nasal vault*: bone (display ≥ `walls.py`'s BT) that is a wall
   between the nasal cavity air and the exterior soft tissue (the unmasked
   nose), above the piriform aperture. Split nasal bone from frontal
   process at the nasomaxillary suture where the volume shows it (a
   continuous line of lower display between the plates over ≥ 3 axial
   levels); if it does not, stop (Escalate) with coronal images — the
   split is then the owner's (hand segmentation) or Opus's proxy, not the
   executor's.
2. *Landmarks*: `lm.rhinion.M` — the caudal-most nasal-bone voxel on the
   dorsal surface at \|R\| ≤ 1.5; `lm.sellion.M` — the most posterior
   point of the bony dorsal profile at R = 0 between the frontal sinus's
   anterior table and the rhinion (Lazovic 2015's term; the method in the
   meta); `lm.soft-tissue-nasion.M`, `lm.pronasale.M`, `lm.subnasale.M`
   and `lm.alar-crease.R/L` (the deepest point of the alar-facial groove at
   the alar-rim band's S) by ST6's own rules.
3. *Piriform rim*: per axial level from the ANS to the rhinion, on each
   side, the anterior-most bone voxel of the lateral bony wall bordering
   the airway; smoothed (3-level moving mean); written as the sweep
   `s.piriform-aperture.R/L` (radius 0.5) with its method in the meta.
4. *n = 1 envelope*: skin-to-bone distance along the skin normal at the
   soft-tissue nasion (to the bone under it) and at the rhinion; printed
   and stored in the landmark meta.
Accept: `normalize.py all` prints steps 1–4 and the pack's bytes and
triangles against §5.4; `check-data.mjs`; `test-ssb.mjs` (full) with new
checks — the rhinion is nasal-bone voxels' caudal end, the sellion lies
at R = 0, every rim point is bone adjacent to air, the volume is still
mirror-symmetric; `smoke-pages.mjs`. In the PR, a table: each landmark
against the diorama's default anchor (§6.2) and the two envelope values
against `m.ste-thickness-nasion` / `-rhinion`.
Escalate: the suture is not visible (step 1); the nasal bones fall below
BT over more than a third of their dorsal length (thin caudal bone — say
where); the rim is ambiguous on more than a fifth of the levels; a budget
breaks.

### ST7e — Fit on the specimen        [todo: spec sketch in `docs/ssb.md` §6.2, finalized at CP-ST7c] · Sonnet · depends: ST7c, ST7d; O7 = (b) or (c)
Not executable until Opus rewrites it at CP-ST7c with the numbers ST7c
and ST7d print (where the default framework lands under the real skin;
whether the specimen's envelope leaves room for the default domes).

**CP-ST7a (Opus)** — ST7a's PR: every number against its abstract, the
"check hardest" list first, the disagreements stated not resolved; then
owner review of tier 1 as usual.

**CP-ST7c (Opus)** — ST7b and ST7c: the five views against anatomy
(proportions, the alar ring, the scroll, the envelope's layers on a
section), the rules' numbers against §6.2, the plane sets, schematic
proportions labelled; then ST7e's final spec from ST7c's and ST7d's
printed numbers, and the first rhinoplasty-model WPs (R0: which
manoeuvres, in what order, as `p.*` steps that set §6.2's parameters).

### D1 — Sphenoid diorama spec        [done: amended 2026-10-03] · **Opus** (first pass by Sonnet 5.5)
*Verification (Opus, 2026-10-03):* six amendments, now folded into `docs/ssb.md` §6.1 (§4, "D1 sphenoid spec"): rule 4's type 4 was inverted (the Onodi cell is medial/superior to the nerve); "facing air" defined; conchal's bone ≥ 8 mm; rule 2's threshold labelled a convention; one table of impossible combinations; one parameter per preset kept.
Result: the spec is `docs/ssb.md` §6.1: parameters from `c.sphenoid-pneumatization`, `c.delano-optic-nerve`, `c.vidian-canal-type` and `m.intercarotid-distance-narrowest`, the variants the graph defines, eight rules computed from the solids that the tests must pin, hazard sites by graph id. All sizes the graph does not give (sella length, ICA and canal diameters, wall thickness) are left to the module header as schematic. **Vet:** the rule set (esp. rule 2's 0.5 circumference threshold, taken from `v.ica-protrusion`'s definition, and rule 4's DeLano type 4 geometry) and that presets set one parameter at a time.
Parameters, presets from `c.sphenoid-pneumatization`, schematic proportions
(stated in the header), and the rules `test-ssb.mjs` must pin (as the
frontal-recess IFAC rules are), per `docs/ssb.md` §6's `sphenoid` row.

### D2 — Sphenoid diorama build        [done: CP-2a; follow-up D2a] · Sonnet · depends: D1
Build `js/ssb/dioramas/sphenoid.js` to `docs/ssb.md` §6.1 as it now stands (the 2026-10-03 amendments are folded in, rules 0–9) using `kit.js` primitives;
register it; tests from §6.1.
Read: `docs/ssb.md` §6 and §6.1; `js/ssb/dioramas/frontal-recess.js` and `kit.js` (the pattern); `tools/test-ssb.mjs` lab section.
Touch: new `js/ssb/dioramas/sphenoid.js`, `js/ssb/dioramas/index.js`, `tools/test-ssb.mjs`.
Don't: change `kit.js` beyond adding a primitive the scene needs (say so in the PR); invent proportions the graph gives.
Accept: rules 0–9 pinned in `test-ssb.mjs` (`--only lab`), computed from the solids on a 0.5 mm grid.
Escalate: a rule cannot hold with the stated schematic sizes (report the numbers).

### D2a — Presellar in rule 9        [done: CP-2b] · Sonnet · depends: D2 merged
Goal: rule 9 as amended at CP-2a (`docs/ssb.md` §6.1).
Read: `docs/ssb.md` §6.1 rules 2 and 9; `js/ssb/dioramas/sphenoid.js` `degrade()`.
Touch: `js/ssb/dioramas/sphenoid.js`, `tools/test-ssb.mjs`.
Steps: in `degrade()`, with `pneum` = presellar, `ica_protrusion` and
`ica_dehiscence` take their defaults and are named in the HUD; tests: each
of the two pairs draws the same model as presellar with the toggle off, and
the HUD names it.
Accept: `node tools/test-ssb.mjs --only lab`.
Result: `degrade()` has a presellar branch; four tests pin the two pairs (same solids as toggle off, HUD names them).

### C1 — Content backlog, drafted by Sonnet, reviewed by Opus (O3)        [done] · Sonnet (drafts) → Opus (review at a checkpoint) · depends: —
Split into batches, one PR each, so a review reads one topic. Run them in order (they share the region files; each later batch branches from a master that has the earlier one), or in parallel only when they touch different files (listed per batch).

Common to every batch:
Read: `docs/authoring-ssb.md` (all: it is short and every rule binds); the region file(s) the batch touches, only to find ids and the house style; `ssb/content/sources.json` (the source record format); `docs/decisions.md` §7.
Touch: the batch's region file(s); `ssb/content/sources.json` (new sources only); docs pass (`WIP.md` content line, this WP's status).
Don't: set `review` to anything but `"draft"`; set a source `verified: true`; edit an existing entity's medical text (a disagreement with an existing entity is reported, not edited); add geometry, landmarks with coordinates, stations or pathways; rename an id.
Sources: every number and every prevalence cites a `src.*`; journal papers only if found in PubMed with PMID and DOI stored (as ST0 did), textbooks with chapter and edition, Radiopaedia as type `atlas` with the fetch date. **If no source is in hand, write no number** (`conf: "low"` or leave the field out) — never an invented citation (`docs/authoring-ssb.md` §7.7). Abstract-only reading is allowed; say so in the source's `note`, and keep `why` within what the abstract supports.
Accept: `node tools/ssb-content.mjs` and `node tools/check-data.mjs` pass; the PR lists every new id with its tier and the sources each cites, and a "check hardest" list (claims that go beyond an abstract, prevalences with unclear denominators, anything the executor was unsure of) — that list is what the Opus review reads first.
Escalate: an item needs a geometry or anatomy-placement decision; two sources disagree on a number that matters and the batch cannot say why; an item would duplicate or contradict an existing entity.

Batches:
- **C1a — procedures** (`managedBy` targets): canthotomy/cantholysis, orbitotomy (as needed for orbital complications), frontal sinus cranialization, septodermoplasty and Young's procedure, transantral internal maxillary artery ligation, Lynch (external frontoethmoidectomy). Each with `steps` at the depth its sources support, `hazards` links to existing ids, and the conditions that already exist linked by `managedBy`. Files: the procedure's region file(s).
  **[review]** C1a result: seven procedures drafted (`p.lateral-canthotomy-cantholysis`, `p.external-orbitotomy-drainage`, `p.frontal-sinus-cranialization`, `p.lynch-external-frontoethmoidectomy`, `p.septodermoplasty`, `p.young-procedure`, `p.transantral-ima-ligation`), every claim from a PubMed abstract or open PMC full text, new sources `verified: false`; the "check hardest" list is in the PR; `node tools/ssb-content.mjs`, `node tools/check-data.mjs` and `node tools/test-ssb.mjs` pass.
- **C1b — inflammatory and other benign conditions** (`pathology-inflammatory.json`): EGPA, primary ciliary dyskinesia, immunodeficiency (as one condition with variants only if the sources split it), granulomatous infections, septal hematoma and abscess, developmental cysts, organizing hematoma, facial fractures (only their sinonasal/orbital relevance).
  **[review]** C1b result: 14 conditions (`dz.egpa`, `dz.primary-ciliary-dyskinesia`, `dz.immunodeficiency-crs`, `dz.sinonasal-tuberculosis`, `dz.leprosy-nasal`, `dz.rhinoscleroma`, `dz.rhinosporidiosis`, `dz.septal-hematoma-abscess`, `dz.nasolabial-cyst`, `dz.nasopalatine-duct-cyst`, `dz.organized-hematoma`, `dz.nasal-fracture`, `dz.medial-orbital-wall-fracture`, `dz.zmc-fracture`) and `c.acr-eular-egpa`, from PubMed abstracts; syphilis and Le Fort skipped (no sinonasal source with content); every number traced to a cited abstract; check-hardest list in the PR.
- **C1c — neoplastic conditions** (`pathology-neoplastic.json`): HPV-related multiphenotypic sinonasal carcinoma, SMARCA4-deficient sinonasal carcinoma, non-intestinal-type adenocarcinoma, biphenotypic sinonasal sarcoma, petroclival / cavernous / spheno-orbital meningiomas, trigeminal schwannoma, germinoma, Langerhans cell histiocytosis, optic pathway glioma. WHO 5th edition naming where it applies.
  **[review]** C1c result: 11 conditions (`dz.hpv-multiphenotypic-sinonasal-carcinoma`, `dz.smarca4-deficient-sinonasal-carcinoma`, `dz.sinonasal-non-intestinal-adenocarcinoma`, `dz.biphenotypic-sinonasal-sarcoma`, `dz.petroclival-meningioma`, `dz.cavernous-sinus-meningioma`, `dz.spheno-orbital-meningioma`, `dz.trigeminal-schwannoma`, `dz.intracranial-germinoma`, `dz.langerhans-cell-histiocytosis`, `dz.optic-pathway-glioma`), WHO 5th-edition naming, from PubMed abstracts and seven open full texts; every number traced; LCH and optic pathway glioma categories are owner calls (PR).
- **C1d — classifications and numbers**: silent sinus/SPOA drainage-size threshold, AFRS staging, Cannady (inverted papilloma), WHO CNS meningioma grade, AJCC N categories (sinonasal), infraorbital-nerve canal grading, JNA staging variants, olfactory neuroblastoma staging (Kadish, modified Kadish, Dulguerov, Hyams grade). Each classification's `levels` from its primary source.
  **[review]** C1d result: `m.spoa-drainage-volume-threshold`, `c.wise-afrs-ct`, `c.cannady`, `c.who-cns-meningioma-grade`, `c.ajcc-sinonasal-n` (clinical N only), `c.infraorbital-canal-yenigun`, `c.jna-chandler`, `c.jna-fisch`, `c.jna-onerci`; classes from the primary source or an open reproduction that was read; existing ION, JNA and olfactory neuroblastoma systems checked against their sources and the discrepancies reported in the PR, not edited; silent sinus threshold, pathologic N, Sessions and Philpott-Javer grades skipped (criteria not readable).
- **C1e — anatomy without geometry** (content only; nothing is placed on the specimen): petrolingual and parasellar ligaments, carotid cave, jugular foramen and CN IX–XI, orbital septum, superior ophthalmic vein, frontal lobe beyond the gyrus rectus, hard palate, parapharyngeal space.
  **[review]** C1e result: 16 structures, all `geo: "none"` (`s.petrolingual-ligament`, `s.interclinoid-ligament`, `s.caroticoclinoid-ligament`, `s.carotid-cave`, `s.jugular-foramen`, `s.glossopharyngeal-nerve`, `s.vagus-nerve`, `s.accessory-nerve`, `s.orbital-septum`, `s.superior-ophthalmic-vein`, `s.orbital-gyri`, `s.olfactory-sulcus`, `s.hard-palate`, `s.parapharyngeal-space`, `s.prestyloid-compartment`, `s.poststyloid-compartment`); every `rel` edge stated by a source read; back-links from existing structures listed in the PR, not added.
- **C1f — the CP-2a question**: whether prior sphenopalatine ligation endangers the middle turbinate flap's pedicle (the middle turbinate branch of the SPA). Find a source; if one supports it, add it to the flap's checks with that source; if none, report "no source" and change nothing.
  **[review]** C1f result: a source was found for the mechanism, not for the flap itself. Added to `p.middle-turbinate-flap.preop`: check for prior sphenopalatine ligation, citing Pistochini 2021 (pedicle = middle turbinate branch of the SPA, cadaver) and Elsheikh 2013 (middle turbinate necrosis after SPA ligation, one case); no source reports flap outcome after ligation. Owner to accept or revert (one `preop` item).

Owner-only items stay with the owner (§2): merging the two dry-eye hazards (vidian neurectomy vs vidian sacrifice in transpterygoid work); the optic nerve sheath incision wording.

Checkpoint **CP-C1** (Opus, per batch or two batches together): read the "check hardest" list and every number against its source's abstract; reject or correct before merge; content stays `draft` until the owner verifies.

### P1 — Dissection contract and data (FESS, sellar/clival EEA)        [done: Opus, 2026-10-08, this PR] · **Opus** · depends: — (O7)
*Result:* the contract is `docs/ssb.md` §5.8 (a state changes the CT display and label volume; units are rules; patches, state linings, `byState` stations), the mucosal state §5.9 and new data §5.10. The data is `tools/ssb-pipeline/uw/dissection.json`: 16 units (`<id>.<side>@<cut>`, each with `realizes`, an operator, an anchored box, a keep list, a `truth` note where it stands in for an unsegmented structure, its `basis` in the procedure's own steps, and `measured` voxels), the step → unit map for 10 procedures with each procedure's `entry` and `unrealized` ids, and two corridors. `removes` added to 15 steps (`p.uncinectomy`, `p.maxillary-antrostomy`, `p.anterior-ethmoidectomy`, `p.posterior-ethmoidectomy`, `p.transethmoidal-sphenoidotomy`, `p.sphenoidotomy`, `p.draf-i`, `p.draf-iia`, `p.transsellar-approach`, `p.transclival-approach`): ids the steps' own text already names; no new medical claim, every procedure's sources `verified: true`, none of C1a's thin steps involved (C1a's procedures are outside both corridors). `t.septum-anterior` and `t.lacrimal-sac-0` posed in `stations.json` (E5's rule; free under 4 mm, tips in air, targets in field, mirrored), and every `uncovered` reason rewritten to say what opens it.
Method: a scratch prototype (not committed, as E5's solver was) evaluated the data file as written: 15 states, guard minima ≥ 1.0 mm on every state after mirroring, the keep labels untouched, the antrostomy window 18.5 × 9 mm. Station poses on those states: P3's table. Decongestion and shaft findings: §1 "P1 + wave-3 plan" and `docs/ssb.md` §5.9.
What P1 did not do: Draf III, transplanum, transpterygoid, transmaxillary and the upper clival third (outside O7's corridors or intradural); the NSF in procedure mode (after ST5); a contralateral-control (one side dissected) view (O11).

### P1b — Dissection states (the pipeline)        [done: #123, merged in #125] · Sonnet · depends: P1 (merged)
Goal: `dissect.py` evaluates `dissection.json` on the standard specimen and writes every state's patch, lining pack and index, reproducing P1's counts.
Read: `docs/ssb.md` §5.8 (all), §5.3, §5.7 (the lining row); `tools/ssb-pipeline/uw/dissection.json` (its `rule`, `air`, `guard`, `keep`, then the units); the docstrings of `walls.py` (the wall rule, `Grid`), `lining.py`, `meshes.py`, `sdf.py`, and `normalize.py`'s `all`.
Touch: `tools/ssb-pipeline/uw/dissect.py` (new); `lining.py` and `meshes.py` (factor out a function that meshes a given air or label mask, unchanged output for the base); `normalize.py` (`all` runs `dissect.py` last); `ssb/states/**` (new); `ssb/models/lining-*.glb.gz`, `ssb/models/packs.json` (state packs with `"state"`); `tools/check-data.mjs` (the checks of step 6); `tools/ssb-pipeline/README.md`; docs pass.
Don't: change `dissection.json` (a rule that cannot be implemented as written is an escalation, not an edit); change content, `stations.json`, or any base output (`ssb/ct`, base packs: the states are additive); hand-edit an output; recompute the distance fields per state.
Steps:
1. Parse `dissection.json`: anchors per its `rule` (side-relative r; a midline unit's label anchor is `.M`, else `.R`; a landmark `.side`, else `.M`, else `.R`); `keep` (an id without a side is all three), `keepAlso`, `keepExcept`; the guard: each listed field from `ssb/ct/sdf-*.u8.gz` resampled trilinearly to the CT grid, and the distance to the `s.orbit` labels.
2. Operators on a working copy of the base (CT display, labels): `window` (Euclidean distances to the a and b air sets within the box, padded by `sumMm`; `shell` keeps voxels within the given mm of the named air), `exenterate` (binary closing of the group's air with a ball of `round(closeMm / 0.5)` voxels), `region` (`labels`, or every non-air voxel; `nearAir` / `nearAirMm`; `split: "side"` sends R ≥ 0 to `into[0]` and R < 0 to `into[1]`). Every operator acts only on voxels with display ≥ `air.level`, outside keep, inside the guard; a carved voxel takes display `air.fill` and the label of the nearest voxel of the unit's own air sets (a ∪ b, `group`, or `into`).
3. States: for each procedure step in `procedures` and each corridor position, the unit list (the `entry` chain's units, then the steps up to it; in a corridor, the earlier procedures' units instead of `entry`), applied in that order, `.R` and `.M` units only; then mirror R → L at R = 0 (labels `.R` → `.L`); then the guard again on both sides, restoring any voxel it rejects (print the count). Dedupe identical unit lists; key = the first 10 hex of SHA-256 of the list joined by newlines.
4. Outputs per state: the patch (`docs/ssb.md` §5.8: u32 header length, JSON header, one u16 box per side and one for the midline, gzip with mtime 0); the lining pack (`lining.py`'s method on the state's air union, its budget rules), plus remnant meshes `<id>.<side>@<cut>` for every wall label a state cuts partly and `hides` for any it removes entirely; `packs.json` entries with `"state"`.
5. `ssb/states/index.json`: `version`, `base`, `states` (`units`, `usedBy`, `patch`, `lining`, `hides`, `remnants`, `measured`: carved voxels, per-unit voxels, guard minima, symmetry count), `procedures` (step → state key), `corridors` (from the data, with each position's state key).
6. `check-data.mjs`: (a) the `dissection.json` ↔ graph rule of §5.8 (every id a step `removes` realized on that step or before, or listed `unrealized`; a step with `removes` but no units only when all are unrealized; every unit on a step realizes one of that step's ids; unit names and `realizes` are graph ids); (b) every label index in a patch is in `labels.json`; (c) the budgets of §5.8.
7. Print one table: per unit, voxels against `measured`; per state, carved voxels, guard minima per field and per side, the post-mirror guard count, bytes; the antrostomy window's sagittal extent (`s.posterior-fontanelle.R@antrostomy` with the uncinectomy before it: the medial-wall voxels carved, longest A and S spans).
Accept: `python tools/ssb-pipeline/uw/dissect.py` prints 15 states; every unit's voxels within ± 5 % of `measured` (the clival recess has two values, by order); guard minima ≥ 0.9 mm (the field's 1 mm grid) on both sides of every state; 0 keep-label voxels changed; the post-mirror guard count ≤ 0.1 % of the state's carved voxels; the antrostomy window's longest sagittal span within 10–20 mm (the graph's "typically 1–2 cm for CRS"; prototype 18.5 × 9 mm); state linings ≤ 350 kB each and ≤ 6 MB together; a rerun is byte-identical. `node tools/check-data.mjs` (with step 6's checks; a scratch edit that unmaps one step makes it fail, not committed), `node tools/test-ssb.mjs` (full: nothing outside the new data changes), `node tools/smoke-pages.mjs`, `node tools/stamp-assets.mjs`.
Escalate: a unit is off by more than 5 % and the cause is how the rule reads (quote the line); the post-mirror guard rejects more than 1 % of a unit (the guard's own rejections inside a unit are expected where it meets the orbit or the AEA, CP-3a); a state lining breaks its budget; a keep-label voxel would change; ST4d has merged and moved the ICA field (rerun and report the new counts instead of matching the old).

*Result:* `dissect.py` writes 15 states (`ssb/states/`, `ssb/models/lining-<key>.glb.gz`). Every unit is within 3.7 % of `measured` (the intersinus septum flush, 5249 against 5452, is the widest; the others are within 2.3 %); guard minima are >= 1.0 mm on both sides of every state, 0 keep-label voxels changed, the post-mirror guard rejected 0 voxels, the antrostomy window is 19.0 mm (A) x 9.5 mm (S) (prototype 18.5 x 9), state linings 311-318 kB each and 4.7 MB in all, patches <= 26 kB, and a rerun is byte-identical. **Deviation for the checkpoint:** the state linings are not listed in `packs.json` (the WP's Touch list says they are): `js/ssb/geo-specimen.js` loads every pack that file lists, so 15 extra packs would load at boot, duplicate the lining's nodes and break `test-ssb.mjs`'s "every pack is loaded, node for node" check; `js/ssb/` is outside this WP's Touch list. They are indexed in `ssb/states/index.json` (`lining`). P2 decides how they load (and may add a `state` skip to the loader and list them then). The Escalate condition "the guard rejects more than 1 % of a unit" **fired** for four units (guard-rejected of candidates: uncinectomy 223 of 4641, 4.8 %; antrostomy 166 of 3784, 4.4 %; basal lamella 64 of 1691, 3.8 %; Draf IIa floor 302 of 2951, 10 %), all on the orbit and AEA margins, and I did not stop: the guard is the data's own rule working as written (the counts still land within 3.7 % of `measured`, so the prototype saw the same rejections), but whether 1 % was meant for these units is the checkpoint's call.

### P2 — Procedure player        [done: #124, merged in #125] · Sonnet · depends: P1 (merged); ran beside P1b (shares no Touch files but the stamps)
*Result:* the player is `js/ssb/mode-procedure.js` + `ui-procedure.js` (the scope stage with `state.procedure` behind it, not a fifth stage); `volume.js` `parsePatch`/`applyPatch`; the endoscope reads the state volume, the CT stage outlines the carved voxels over the base image, the specimen swaps the state's lining pack (`geo-specimen.js` `loadState`) and marks `see`/`risk`. All Accept commands pass on the fixture (`--only procedure`, the full suite and smoke); the real-data section is written but skipped until P1b's `ssb/states/index.json` exists. Index shape read, step numbering and the hides/remnants/state-lining paths (untested on real packs): `docs/ssb.md` §5.8 "Runtime". Open for P1b/Opus: confirm the index shape; `ssb/states` is now in `tools/stamp-assets.mjs`'s data dirs.
Goal: a procedure (or a corridor) plays step by step in the scope on its dissected state: the volume the scope reads, the lining it sees, the station it flies to, and the step's text with the `think` as a recall prompt.
Read: `docs/ssb.md` §3 (Procedure, Endoscope), §5.8 ("Runtime", "Stations", the patch format), §7.3 (the procedure hash); `docs/authoring-ssb.md` §5 (the Procedure fields); `tools/ssb-pipeline/uw/dissection.json` (`procedures`, `corridors` only); `js/ssb/state.js`, `js/ssb/volume.js` (header validation, `VolumeError`), `js/ssb/mode-endoscope.js` (`ctAt`, the label lookup, stations, `flyTo`), `js/ssb/mode-specimen.js` and `js/ssb/geo-specimen.js` (pack loading, the lining), `js/ssb/ui-panel.js` (the procedure section), `tools/ssb-fixture-ct.mjs`.
Touch: `js/ssb/mode-procedure.js`, `js/ssb/ui-procedure.js` (new); `js/ssb/volume.js` (`parsePatch`, `applyPatch`); `js/ssb/state.js` (procedure state, hash); `js/ssb/mode-endoscope.js` (reads the state volume; station lookup in `byState` first); `js/ssb/mode-specimen.js`, `js/ssb/geo-specimen.js` (state lining swap, `hides`, `remnants`); `js/ssb/mode-ct.js` (the carved outline); `js/ssb/ui-panel.js` (a Play button); `js/ssb/main.js` (mount); `ssb.html`, `css/ssb.css`; `tools/ssb-fixture-ct.mjs` (fixture states); `tools/test-ssb.mjs` (`--only procedure`); stamps; docs pass.
Don't: change `dissection.json`, content, `stations.json` or anything under `ssb/`; write a fixture file into `ssb/` (route it, as the CT fixture is); move the camera except through a pose in the store; let any URL value reach markup except as `textContent`; weaken an existing test.
Steps:
1. `volume.js`: `parsePatch(bytes)` (gzip by magic bytes, as the volume; header checks: version 1, `base` equal to the volume's `specimen`, every box inside `dims`, every label index in the table, byte length = Σ box sizes × 2; else a `VolumeError`) and `applyPatch(volume, patch)` → a derived volume with the same API (`sample`, `labelAt`, slices) and `carvedAt(r, a, s)`; the base volume is untouched. Pure; Node-testable.
2. `state.js`: `state.procedure = { id, step, cor } | null`; the hash `p`, `step`, `cor` per §7.3 (whitelisted against the loaded index and the graph; `step` clamped; canonical form rewritten); a procedure implies the scope stage and is exclusive with the lab and CT, like the scope.
3. `mode-procedure.js`: load `ssb/states/index.json` lazily on first use (missing or malformed: Play is disabled with a one-line reason, nothing throws); resolve (procedure, step, cor) → state key; load and cache the patch and the lining pack (the last three); hand the derived volume to the endoscope (collision, tip label) and to CT (base image, carved outline), and the pack to the specimen (lining swap, `hides`, `remnants`); for the step's `station`, look up `stations.byState[key]`, then `stations.stations`, else keep the pose and say "no pose for this state"; fly with E6's `flyTo` (reduced motion: a cut); highlight the step's `see` ids; hatch the `at` structures of its `risk` hazards with the existing hazard hatching.
4. `ui-procedure.js`: the step list (`do`, `see`, `risk`, the `think` collapsed behind "Think first" until revealed, by click or key), Previous / Next and the `[` `]` keys, a corridor picker (the index's corridors), the state badge ("Specimen, dissected — rule-based cut", plus the mucosal state once DC1 exists).
5. `ui-panel.js`: a Play button on any procedure the index lists.
6. Fixture (`tools/ssb-fixture-ct.mjs`): an index with one procedure of three steps over the synthetic volume: step 1 carves a 4 mm hole through a bone plate between two air labels, step 2 nothing, step 3 a second hole; patches built in memory and routed like the CT fixture; `lining: null` (the player keeps the base lining when a state has none).
Accept (`node tools/test-ssb.mjs --only procedure`):
- Node: `parsePatch` round-trips a fixture patch; it refuses a box outside `dims`, an unknown label index, a wrong `base`, a short body and version 2, each with a `VolumeError`; `applyPatch` changes exactly the box's non-zero voxels (display `ctFill`, the new label) and nothing else, and the base volume is byte-identical after; the hash codec clamps `step`, drops an unknown `p` or `cor`, ignores markup, and writes the canonical form.
- Page, on the fixture: `#p=<fixture>&step=1` makes a pose through the hole free that clamps at step 0 (same pose, both read through the store), and the tip's label there is the patch's label; CT at that point still samples the base value and draws the outline; stepping back to 0 clamps the pose again; Next / Previous and `[` `]` move one step and rewrite the hash; the `think` is hidden until revealed; a step's risk hazards hatch their `at` structure; with no index the Play button is disabled with its reason and there are zero console errors; reduced motion cuts the flight; a hostile `#p=` is ignored.
- Real data (runs only when `ssb/states/index.json` exists, i.e. once P1b has merged): every state's patch parses and applies; the first FESS state's lining pack replaces the base lining (the lining node count changes, no console error).
- Plus `node tools/check-data.mjs`, the full `node tools/test-ssb.mjs`, `node tools/smoke-pages.mjs`.
Escalate: the store needs a fifth exclusive stage; the patch format cannot carry what P1b writes; a check can only be written against real data before P1b merges (leave it for the real-data section and say so).

### P3 — Station poses per state, and the 2.7 mm shaft        [review] · Sonnet (solver) → Opus (CP-3) · depends: P1b, P2 (merged)
Goal: `stations.json` `byState` poses for the stations in the table below, each passing E5's rule on the committed state; the stations' `shaft` field; the two 2.7 mm intact poses.
Read: `docs/ssb.md` §5.8 ("Stations"), §3 (Endoscope); the `rule` string of `ssb/geometry/stations.json`; this WP's table; `js/ssb/scope.js` (`shaftClearance`, `frameOf`, `tipOf`, `parseStations`); the E6 station checks in `tools/test-ssb.mjs`.
Touch: `ssb/geometry/stations.json` (`byState`; the `uncovered` entries that move; the two intact 2.7 mm poses); `tools/ssb-pipeline/uw/stations.py` (new: the solver, committed so a re-pose after a regeneration is a command); `js/ssb/scope.js` (`parseStations` reads `shaft` and `byState`); `js/ssb/mode-endoscope.js`, `js/ssb/ui-endoscope.js` (a flight to a `shaft: "2.7"` station switches the shaft and the controls say why); `tools/test-ssb.mjs`; docs pass.
Don't: change a pose in `stations.stations` other than adding the two 2.7 mm ones; change `dissection.json`; force a pose (a station that fails is reported).
Steps:
1. `stations.py`: for (station, state key, lens, target, tip air set, wanted labels, side), test the prototype pose first; if it fails, search depth / yaw / pitch (2-unit grid, then 0.5 refinement) and roll (15°) for free poses (4 mm unless the row says 2.7) with the tip in the tip set (an airway label: E6's check does not count `s.nasal-vestibule` as one) and the target within 30° of the view, ranked by the share of rays that pass through or first hit the wanted labels, then by lower mucosal contact. Write `measured` as E5 did.
2. Left = right mirrored (roll → 360 − roll) for sided stations, checked, not assumed; a midline station is posed from the right nostril (`.M`). A station whose `where` says "through the contralateral nostril" is keyed by its target side, with `pose.side` the other nostril.
3. Remove from `uncovered` every station that now has a pose (intact or in `byState`); keep the others' reasons as P1 wrote them.
Accept (`node tools/test-ssb.mjs --only scope`, new Node checks): every `byState` pose is free in its state's volume (the patch applied to the CT, `shaftClearance` with its shaft and `lm.choanal-arch.M`), its tip is in an air label of that state, its target within `FOV_DEG / 2`; every `byState` key is a state in `ssb/states/index.json`; sided stations mirror; every graph `t.*` is in `stations`, `byState`, `uncovered` or `overviews`; in the page, flying to the olfactory cleft station switches the shaft to 2.7 mm and the controls say so. Plus `check-data`, the full suite, `smoke-pages`.
Escalate: a table row cannot be posed (report the best candidate's numbers); a station needs a state that no procedure step reaches.

*Result (review):* `tools/ssb-pipeline/uw/stations.py` (a numpy port of `scope.js`; `check`, `solve`, `write`) poses all 17 table rows on P1b's real states: **P1's prototype pose passed on every row but one** (its off-axis angle reproduced to 0.1°), so those poses are kept and re-measured; `byState` has 30 poses over 10 states, the olfactory cleft and inferior meatus are intact poses with `shaft: "2.7"` (4 keys), and `uncovered` is down to the 8 outside O7's corridors. Left = right mirrored, verified on each left state volume (all free, tips in air). The search path was exercised with `--search` on `t.cavernous-sinus-30` (found R,67,3,15.5,270,30, 83 % lateral wall against the prototype's 70 %, 43.5 mm mucosal contact against 42). `scope.js` `parseStations` keeps `shaft`; `flyTo` and a station link switch the telescope (`shaftWhy`) and the controls say why. **For the checkpoint:** (1) `t.basal-lamella-0`: the label centroid of `s.basal-lamella` lies below the view (75° off), so P1's 15.0° cannot have used it; the target is recorded as the centroid of the label's voxels inside the half field (an `at` point with a note), which makes that one row's "target in view" check true by construction, so judge it on the image shares (lamina 25, posterior ethmoid cells 19, basal lamella 17, fovea 17 %). (2) The tip-in-air set is every air-space label (`meshes.AIR_PACKED`, which includes the ethmoid cells and the frontal recess) except the vestibule; the intact E6 check keeps its narrower set. (3) `measured` shares come from a Fibonacci disk of 161 rays, not E5's ray set, so they differ by a few points from P1's table. (4) `t.cavernous-sinus-30` still has 42 mm of mucosal contact (the table's own warning).

Prototype poses (P1; on the prototype's states, which P1b reproduces): `R, depth, yaw, pitch, roll, lens`; "off" is the target's angle from the view axis; shares are % of 161 rays (first hit; "into" = rays that pass through that air space).

| Station (key side) | State reached at | Pose | Off | What the image shows |
|---|---|---|---|---|
| `t.ethmoid-bulla-0` (R/L) | `p.uncinectomy#1` | R,36,4,38,0,0 | 9.5° | bulla face (tissue) 49, lamina 24, basal lamella 12; 20 into the bulla |
| `t.infundibulum-45` (R/L) | `p.uncinectomy#1` | R,32,4,30,270,45 | 3.6° | the medial wall of the opened infundibular trough 98 |
| `t.maxillary-antrum-70` (R/L) | `p.maxillary-antrostomy#1` | R,30,4,28,240,70 | 7.2° | 47 into the antrum; medial 58, posterior 25, orbital floor 13 |
| `t.medial-orbital-floor-30` (R/L) | `p.maxillary-antrostomy#1` | R,30,6,34,270,30 | 9.6° | orbital floor 33, lamina 33; 78 into the antrum |
| `t.basal-lamella-0` (R/L) | `p.anterior-ethmoidectomy#1` | R,48,2,40,0,0 | 15.0° | lamina 34, fovea 26, basal lamella 23; tip in the opened anterior ethmoid |
| `t.ethmoid-roof-30` (R/L) | `p.anterior-ethmoidectomy#4` | R,44,−2,44,15,30 | 6.9° | lateral lamella 50, fovea 33 |
| `t.posterior-ethmoid-roof-0` (R/L) | `p.posterior-ethmoidectomy#1` | R,58,0,34,0,0 | 10.7° | fovea 88, sphenoid face 12; tip in the posterior ethmoid |
| `t.optic-canal-0` (R/L) | `p.transethmoidal-sphenoidotomy#2` | R,62,4,24,0,0 | 18.8° | sphenoid lateral wall 52, planum 21, sella 21 |
| `t.medial-orbital-wall-0` (R/L) | `p.transethmoidal-sphenoidotomy#2` | R,38,4,38,0,0 | 13.3° | lamina 52, fovea 13, lateral lamella 12 |
| `t.frontal-recess-45` (R/L) | `p.draf-i#1` (the sphenoidotomy state) | R,34,2,42,0,45 | 6.2° | MT 62, lamina 32; 31 into the agger |
| `t.frontal-sinus-70` (R/L) | `p.draf-iia#2` | R,42,−4,44,0,70 | 6.3° | 22 into the frontal sinus, 76 through the recess |
| `t.sphenoid-face-0` (M) | `p.transsellar-approach#2` | R,62,−2,24,0,0 | 27.4° | sella 54, planum 34, clivus 11 |
| `t.sphenoid-face-0` (R/L) | `p.sphenoidotomy#4` | R,72,−2,20,0,0 | 25.1° | sella 65, clivus 17, intersinus septum 15 |
| `t.sphenoid-lateral-recess-45` (L target, right nostril) | `p.transsellar-approach#2` | R,62,−4,14,60,45 | 13.0° | left lateral wall 52, sella 32 |
| `t.sella-open-30` (M) | `p.transsellar-approach#4` | R,74,−2,20,60,30 | 12.6° | tissue behind the opening (gland, not segmented) 66, sellar rim 29 |
| `t.cavernous-sinus-30` (R/L) | `p.transsellar-approach#4` | R,68,2,16,300,30 | 15.1° | lateral sphenoid wall 86 (mucosal contact 42 mm: prefer a pose with less) |
| `t.olfactory-cleft-0` (R/L), **2.7 mm** | intact | R,48,−8,40,0,0 | 19.3° | cribriform plate 96; tip in the cleft (R 1.4) |
| `t.inferior-meatus-45` (R/L), **2.7 mm** | intact | R,22,6,−4,300,45 | 22.3° | lateral wall 89, IT 11; tip lateral to the IT (R 8.8) |

Targets (for the solver, as P1 used them): the bulla and the maxillary sinus, the frontal sinus, the basal lamella and the lamina: their label centroids; the medial wall (infundibulum): `s.maxillary-medial-wall.R` with −31 < A < −19, S > 18; the orbital floor: R < 22; the ethmoid roof: `s.fovea-ethmoidalis.R` with A > −40, the posterior roof A < −40; the optic canal: `s.sphenoid-lateral-wall.R` with S > 28; the cavernous sinus: the same with S > 24, A < −62; the sphenoid face: (0, −68, 30), one side (2, −68, 30); the lateral recess: `s.sphenoid-lateral-wall.L`; the sella: `lm.sella-floor-center.M`; the frontal recess: `lm.frontal-ostium.R`; the cleft: `s.cribriform-plate.R`; the inferior meatus: (12, −25, 6).

### DC1 — Mucosal state: decongested (and, after POP1, congested)        [todo] · Sonnet · depends: P1b, P3 (same files: `mode-endoscope.js`, `test-ssb.mjs`)
Goal: the decongested · as scanned · congested toggle of `docs/ssb.md` §5.9, as patches and lining packs; the dissection states rebuilt on the decongested base.
Read: `docs/ssb.md` §5.9, §5.8 ("Pipeline outputs", the patch format); `dissect.py` (P1b: the patch and lining writers); `state.js`; `mode-specimen.js`, `mode-endoscope.js`.
Touch: `tools/ssb-pipeline/uw/mucosa.py` (new); `dissect.py` (an optional mucosal patch applied to the base first); `ssb/states/**` (mucosal patches; the dissection states regenerated); `ssb/models/lining-*.glb.gz`, `packs.json`; `js/ssb/state.js` (`mu`), `js/ssb/mode-specimen.js`, `js/ssb/mode-endoscope.js`, `js/ssb/ui-specimen.js` (the toggle), `js/ssb/mode-procedure.js` (forces decongested); `tools/test-ssb.mjs` (`--only mucosa`); docs pass. Content: one measurement entity for Xiao 2021's numbers (below), `review: "draft"`, its source with PMID and DOI from PubMed and `verified: false`.
Don't: change bone (display ≥ 120) or any label other than the three erectile ones and the nasal cavity; build the congested state before POP1 has merged (skip it; do not invent a ratio); calibrate on Xiao's absolute values.
Steps:
1. `mucosa.py decongested`: the operator of §5.9 between `lm.choanal-arch.M`'s A and `s.internal-nasal-valve`'s A; the per-side mean nasal-cavity cross-section over A from `lm.middle-turbinate-head.a − 3` to `lm.choanal-arch.a + 1` (prototype −15.2…−50); the smallest d in 0.25 mm steps with ratio ≥ 3.8 / 2.8; print the table of d against the ratio and the three thirds' absolute gains (S thirds of the cavity's own extent); write the patch and its lining.
2. Rerun `dissect.py` on the decongested base; `index.json` records the mucosal state of each state.
3. Runtime: three pills (Decongested · As scanned · Congested, the last disabled until its patch exists) with the badge "Mucosa: decongested (calibrated, Xiao 2021)"; `#…&mu=dec|scan|cong`; procedure mode forces decongested and greys the toggle.
4. Content: `m.nasal-csa-decongestion` (or the id the authoring rules give it): the mean cross-section between the first vertical plane and the posterior septum, 2.8 cm² before and 3.8 cm² after decongestion; method MRI; n 10; population healthy adults aged 21–38; xylometazoline 0.1 %; source Xiao Q, Bates AJ, Cetto R, Doorly DJ, Sci Rep 2021;11:14410, PMID 34257360, doi 10.1038/s41598-021-93769-6 (full text, PMC8277849).
Accept: `python mucosa.py decongested` prints d with a ratio within 1.35–1.45 (prototype: d = 1.0 mm, × 1.39), the superior third's absolute gain the smallest (prototype 0.13 against 0.25 and 0.24 cm²), 0 bone voxels and 0 voxels within 0.5 mm of bone changed; `node tools/test-ssb.mjs --only mucosa`: the toggle loads the patch and the lining; a pose whose tip is in inferior-turbinate tissue as scanned is in air decongested; every intact station and every `byState` pose still passes in the decongested state; `mu` is whitelisted; a procedure forces decongested; `node tools/ssb-content.mjs`, `check-data`, the full suite, `smoke-pages`.
Escalate: the ratio needs d > 2 mm; any intact or `byState` station fails in the decongested state.

### POP1 — NasalSeg cross-section profiles        [review] · Sonnet · depends: #119 (merged with P1, 2026-10-08); the archive in the drop zone (download it: `tools/ssb-pipeline/nasalseg/stats.py` docstring)
Result (review): `stats.py profiles` writes the `profiles` key of `nasalseg.json` (88 clear subjects, none with an undefined axis; reruns byte-identical); the scratch check reproduces (cavity median 11.4 mL labelled, 8.3 restricted). Escalate line 2 fired: head A's mean-cross-section percentile moves by more than 20 points across the 10–90, 20–80 and 0–100 % spans (standard, cavity + vestibule, restricted: 62.5, 67.0, 38.6); all three are in the JSON for the checkpoint.
Goal: per clear NasalSeg subject and side, the nasal cavity's coronal cross-section profile, its mean, and the more- against the less-congested side; head A placed against them.
Read: `docs/ssb.md` §5.9, §5.10; `tools/ssb-pipeline/nasalseg/stats.py` (docstring: duplicates, header fixes, side assignment, the clear subset); `docs/realistic-anatomy.md` §4.4 (PR #119).
Touch: `tools/ssb-pipeline/nasalseg/stats.py` (a `profiles` subcommand); `ssb/anatomy/population/nasalseg.json` (new keys only); docs pass.
Don't: commit any image data; change POP0's numbers or subset.
Convention (checked 2026-10-08, `docs/ssb.md` §5.10): NasalSeg's cavity includes the vestibule and the partial-volume rim, so report every number twice, as labelled and restricted to our air threshold (−482 HU; the `toHU` of display 78), and measure head A as cavity plus vestibule. Reproduce the scratch check: clear distinct subjects about 90 (POP0's clear subset); cavity median 11.4 mL as labelled, 8.3 mL at our threshold; head A (cavity + vestibule, our threshold) near the 42nd percentile, maxillary near the 51st, mid-cavity cross-section near the 37th.
Steps: per clear subject and side, resample the cavity label onto the subject's anteroposterior axis (the direction from the cavity label's anterior to its posterior extent, in world mm) in 1 mm sections; the profile from 10 % to 90 % of that length (so neither the vestibule border nor the choana's cut decides it); per subject: mean cross-section per side, the smaller / larger ratio of the side means; across subjects: median, IQR, 5th and 95th percentiles; head A as scanned and the standard specimen measured the same way and placed as percentiles.
Accept: the subcommand prints the table and head A's percentiles; the JSON is deterministic (sorted keys, a rerun byte-identical); `check-data` passes.
Escalate: the axis or the 10–90 % span cannot be defined for more than 5 % of subjects; head A's percentile depends on the span choice by more than 20 points (report both).

### SEG1 — A voxel-level check of head A's labels with a NasalSeg-trained model        [blocked: O12] · Sonnet · depends: O12, #119 merged
Goal: Dice and boundary distance between head A's five labels (as scanned and standard) and a segmentation model trained on NasalSeg, at NasalSeg's convention.
Why it waits: it needs a deep-learning stack in the offline pipeline (PyTorch and nnU-Net, or similar: a new pipeline dependency) and hours of compute, and the distribution check (`docs/ssb.md` §5.10) already found no defect in these five structures. It would not reach the ethmoid, which is where the specimen's segmentation is approximate.
Steps (if approved): train on the clear subjects with a held-out split (Dice on held-out NasalSeg cases reported first); convert head A to HU (`ct.json` `toHU`) and NasalSeg's spacing; infer; map head A's labels to NasalSeg's convention (cavity + vestibule, partial-volume rim at NasalSeg's measured threshold); report Dice and the 95th-percentile surface distance per structure and side.
Accept: the held-out NasalSeg Dice is printed beside head A's; head A's numbers within the held-out range, or each structure outside it explained by a named convention difference or reported as a segmentation defect.

### IN1 — 16-bit heads: the volume format and an intake path        [todo] · Sonnet · depends: P2 (same `volume.js`), P3 (same `scope.js`, `mode-endoscope.js`)
Goal: any head with HU values (NasalSeg's scans, a future 16-bit CT) loads and drives the scope like head A.
Read: `docs/ssb.md` §5.10, §5.6, §5.3; `js/ssb/volume.js`, `js/ssb/scope.js` (`BONE_LEVEL`, `SOFT_LEVEL`, `shaftClearance`), `js/ssb/mode-endoscope.js`; `tools/ssb-fixture-ct.mjs`; the NRRD reader in `tools/ssb-pipeline/nasalseg/stats.py`.
Touch: `js/ssb/volume.js` (`dtype: "int16"`, `values.kind: "HU"`, `levels`); `js/ssb/scope.js` (the levels as `shaftClearance` arguments, defaulting to today's constants); `js/ssb/mode-endoscope.js` (passes the header's levels); `tools/ssb-fixture-ct.mjs` (an int16 variant of the fixture); `tools/ssb-pipeline/intake/` (new: NRRD and NIfTI readers, the resample into the §4 frame given landmark correspondences, writing to `incoming/` only); `tools/test-ssb.mjs`; docs pass.
Don't: ship a head (no file under `ssb/` changes); add a Python dependency (DICOM needs `pydicom`: escalate); change head A's files or behaviour.
Accept: `node tools/test-ssb.mjs --only ct` and `--only scope` pass on the int16 fixture with the same results as on the u8 fixture (levels mapped through `toHU`); the full suite unchanged on head A; the intake script round-trips a synthetic NIfTI and a synthetic NRRD written by its own self-test into the frame within 0.5 voxel.
Escalate: a real head is needed to test something; the RA landmark set is needed for the frame and is not in the graph yet (PR #119's RS6).

### T1 — Self-test        [later] · Sonnet · depends: P2
Find it / name it / CT localize, Leitner reused unchanged, storage key registered per `docs/decisions.md` §3. After O7's corridors work.

### Launch prompts (owner)
Start each in a new session (`docs/delegation.md` §5); P1b and P2 can run at the same time.

- Lane P, Sonnet: `Execute work package P1b in docs/ssb-roadmap.md, following docs/delegation.md §3. Open a PR when its Accept commands pass; do not merge.`
- Lane V, Sonnet: `Execute work package P2 in docs/ssb-roadmap.md, following docs/delegation.md §3. Open a PR when its Accept commands pass; do not merge.`
- After P1b and P2 merge, lane P, Sonnet: `Execute work package P3 in docs/ssb-roadmap.md, following docs/delegation.md §3. Open a PR when its Accept commands pass; do not merge.`
- After P3: the same prompt with DC1, and in another session with IN1; after #119 merges and the NasalSeg archive is in the drop zone: with POP1.
- Checkpoint, Opus, after P1b, P2 and P3: `Run checkpoint CP-3 in docs/ssb-roadmap.md, following docs/delegation.md §4. PRs: <links>.`

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
