# SSB roadmap — task board

What is done, what is next, who does it, and what waits on the owner.
Architecture and the reasons behind it: `docs/ssb.md`. How work is handed
to a model and checked: `docs/delegation.md`. Current state in prose:
`WIP.md`.

Last re-planned: 2026-10-03 (Opus, after verifying wave 1). Update the board in the same PR as the
work; when a wave closes, shrink its finished WPs to one line each (git
history keeps the specs).

## 1. Status board

| Phase (`docs/ssb.md` §12) | State | What remains |
|---|---|---|
| 0 Architecture, schema, validator, draft graph | **done** | — |
| 1 Walking skeleton, graph mode | **done** | — |
| 2 Variant lab | **3 of 4 dioramas** (sphenoid done with D2a) | `lateral-wall` (later) |
| 3 Reference specimen | **done** (stages B, C; Specimen stage; vessel tubes; mucosa layer; septal surfaces; incisive canal) | ~~standard specimen (N1, O6)~~ done, ~~floor mucosa (ST2c)~~ in review, ~~open airway lining (ST1b)~~ in review, then external nose (ST6), waypoint corrections (ST4d), flap overlay (ST5); hand segmentation (owner, optional) |
| 4 Endoscope | **rig, exposure, collision + HUD, CT along the scope done** (E1, E1b, E2, E2b, E3, E4) | septum blocks the shaft (E3b), station poses (E5, Opus, after E3b and ST1b), flights (E6) |
| 5 CT mode | **done** (triplanar, overlay, cursor shared with 3D; oblique slice along the scope as the scope inset, E4) | — |
| 6 Procedure mode | not started — wave 3 | P1–P2 |
| 7 Self-test | not started — wave 3 | T1 |
| 8 Offline cache, performance | not started | image textures only if procedural materials fall short (`docs/ssb.md` §11) |
| ∞ Content | all `draft` (state: `WIP.md`) | owner review (tier 1 first); backlog §6 |

**Decided (2026-10-02):** O1–O3 answered (§2). **Verified (2026-10-03):** CP-1 and the Opus wave-1 WPs (ST0, ST3, ST4b, D1), first-passed by a Sonnet-class model, were re-checked by Opus (§4, "Opus verification of wave 1"): the fulcrum is misplaced (left one inside the septum), E3's Accept was unsatisfiable, the scope image saturates and ostia are sealed membranes, three content errors, ST3's floor cut contradicts the atlas, D1's type 4 rule is inverted. Corrective WPs are in wave 2; O4 and O5 decided the same day, and ST3r (the flap contract) and the D1 amendments are written into `docs/ssb.md`. **Next:** wave 2's Sonnet lanes (`docs/ssb-sonnet-handoff.md`).

**CP-2a (Opus, 2026-10-03):** wave 2's first PRs reviewed (§4, "CP-2a"): E2b and D2 pass; E3 passes (the lazy, shared CT load it needed was added at the checkpoint); ST2b's partial is merged as is. All four merged 2026-10-03. **O6 (owner, 2026-10-03): normal before variant** — the page serves a standard specimen (right half mirrored, septum centred; `docs/ssb.md` §5.1), which also resolves every left-side escalation of this wave. **Next:** N1, then the rest of the pipeline lane on the standard specimen.

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
| — | Still open from before: strict CSP; publish while `draft`; name | as in §13 | — |

Actions (no model can do these):

- Review the two dioramas' schematic proportions and tier-1 graph content;
  flip `review` to `verified` where right.
- Record the UW authors' written permission beside `ssb/LICENSE-data.md`.
- Look at the specimen's AEA–PEA spacing (21 mm vs population 12; inferred
  PEA).
- ~~Read Table 31.2 in print~~ — done 2026-10-03 (owner's photos; see §4).
- ~~Judge the choanal airway height~~ — done 2026-10-03: ~14 mm is plausible
  (the range is broad, larger in men than women).
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
| Pipeline (`tools/ssb-pipeline/uw/`, `ssb/geometry/`, `ssb/models/`) then the overlay | ~~E1b~~ → ~~ST2b~~ (partial; rest in ST2c) → ~~N1~~ standard specimen (O6) → ~~ST2c~~ floor mucosa (review) → ~~ST1b~~ open airway lining (review) → **ST6** external nose (CP-2b) → **ST4d** waypoint corrections (reruns ST4c) → **ST5** soft-tissue panel + NSF overlay | Sonnet |
| Scope runtime (`js/ssb/*endoscope*`, `scope.js`) | ~~E2b~~ → ~~E3~~ → ~~E4~~ → **E3b** the septum blocks the shaft (CP-2b) | Sonnet |
| Content and dioramas | ~~ST0d~~ · ~~D2~~ → ~~D2a~~ → **C1** content backlog (O3; first item in CP-2a) | Sonnet |
| Specs | ~~ST3r~~ (done 2026-10-03) · ~~ST6 spec~~ (CP-2b) · then **E5** station poses (after E3b, ST1b) | Opus |

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

**CP-2 (Opus)** — anatomy on screen: each vessel's course against its
sources, PSA inside the flap pedicle, flap ladder against the procedure's
steps, endoscope frames at every station (through open ostia, exposure
legible), sphenoid diorama proportions and rules (with D1's amendments).
Report for the owner's review.

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

### E1b — Nostril fulcrum from the unmasked stack        [review] · Sonnet · depends: —
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

### E3b — The septum blocks the shaft        [ready] · Sonnet · depends: E4, N1 (merged)
Goal: a rigid scope cannot be swung through the septum into the other side (CP-2b: on the standard specimen 4108 of the 6185 (A, S) columns where both nasal cavities face the septum have no voxel at E3's bone level, 150; the septum there is cartilage and mucosa, display ≤ ~120).
Read: §4 "CP-2b" of this file; `js/ssb/scope.js` (`shaftClearance`, the side sign); `docs/ssb.md` §3 (Endoscope), §5.1 (standard specimen: the septum is centred on R = 0).
Touch: `js/ssb/scope.js`, `js/ssb/mode-endoscope.js` (only to pass the arch point in), `tools/ssb-fixture-ct.mjs`, `tools/test-ssb.mjs`.
Don't: change the bone level, the ring, the sampling step, or any pinned pose's expected value without listing it in the PR (old → new).
Spec: in `shaftClearance`, a sample point P (axis or ring) also blocks when it lies on the far side of the midline, s·R(P) < 0 (s = +1 right scope, −1 left), **unless** it is in the nasopharynx: A(P) < A_arch and S(P) < S_arch, where (A_arch, S_arch) are `lm.choanal-arch.M`'s A and S (passed in by the mode; fallback A −51, S 12 if the landmark is missing). The midline is R = 0 because the standard specimen centres the septum there; say so in the code comment. The block is reported like bone (`blocked: true`, the HUD's "Bone limits the depth" becomes "The septum or bone limits the depth" when the midline rule fired — return which).
Accept: fixture: a pose whose shaft crosses R = 0 in front of the arch clamps at the last depth with s·R ≥ 0 at every ring point; the same line below and behind the arch is not clamped. Real specimen: from `R` at yaw −30, pitch 0 (aimed across the septum) the clamped tip and all four ring points have R ≥ 0; the pinned sphenoid poses (both sides, R/L 58.5, −3, 19) and frontal poses (R/L 36, −2, 33, 0, 70) are unchanged; the full `test-ssb.mjs` passes.
Escalate: a pinned pose clamps under the new rule (report the depth and which ring point crossed).

### E5 — Station poses        [todo] · **Opus** · depends: E3b, N1, ST1b
Write `ssb/geometry/stations.json` (`{"t.<id>.<side>": pose}`) for every
`t.*` the specimen covers, by driving the rig until the view shows what the
station's `shows` lists; check each is collision-free. List stations the
specimen cannot show (out of crop, needs dissection) for procedure mode.

### E6 — Station flights        [todo] · Sonnet · depends: E5
Station list in the endoscope UI from `t.*` (tier-filtered), flight between
poses (interpolate pose parameters, not the camera), deep link
`#scope=t.<id>`. Accept: every station's pose is collision-free and its
first `shows` structure's centroid is inside the view frustum.

### ST0d — Content corrections        [review: PR open — ST0 findings applied, 4 sources re-checked] · Sonnet · depends: — (folds in ST0c)
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

### ST1b — Open airway lining        [review: PR open] · Sonnet · depends: N1, ST2c (same pack files)
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

### ST2c — Nasal floor mucosa from the airway lining        [review: PR open] · Sonnet · depends: N1
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

### ST6 — External nose: unmask, centre, vestibule and valve        [todo] · Sonnet · depends: ST1b (lane B, same files) · spec: Opus, CP-2b
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

### ST7 — Full nasal framework        [later] · Opus spec → Sonnet build · depends: ST6
Owner decision (O2, 2026-10-02): the atlas ultimately covers the entire nasal framework (ULC/LLC crura, ligaments, SMAS, dorsum, tip support), as its own diorama after ST6's entry anatomy. Not scheduled; spec after ST6.

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
