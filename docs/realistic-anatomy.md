# Realistic anatomy — sources, limits and decisions

**Status (2026-10-11).** The plan's design moved to `docs/ssb.md` §14, and its work packages and handoff to `docs/ssb-roadmap.md` §3a and §4 (owner's call, 2026-10-11). This file keeps what the design rests on: the sources (§4), the methodological limits (§5) and the owner decisions (§13).

Read first: `docs/ssb.md` §14 (the design), `ssb/reference/uw-sinusanatomy2/README.md` (what the atlas is, its two heads, the arrow-tip method), `docs/delegation.md` §2.

**Credit.** Every UW-derived item credits *Interactive CT Sinus Anatomy,
University of Washington Department of Radiology* (`ssb/LICENSE-data.md`
holds the exact attribution and the written permission of 2026-10-07).
The repo names the atlas and its institution, never its individual authors
— not in files, not in commit messages (owner, 2026-10-07). Radiopaedia
items carry the attribution their licence requires (§4.3).

---

---

## 4. Sources

### 4.1 UW teaching pages — figure inventory

Role: **N** normal reference (resegmentation QA, alignment), **V** variant
exemplar, **P** pathology exemplar. Window: bone unless marked *soft* or
*+C* (post-contrast). "→" = graph ids; **(new)** = an id the graph lacks
(R8.3, `docs/ssb.md` §14). Same-patient multiplanar sets (§5, item 4) are marked ⧉ — to be
confirmed by anatomy matching in FG1, not assumed.

**Frontal — Normal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Axial.frontalsinus1` | ax | frontal sinuses | `s.frontal-sinus` | N |
| `Cor.frontalsinus1` | cor | FS, nasal bone, septum | `s.frontal-sinus`, `s.nasal-septum` | N |
| `Sag.FSDP2` | sag | frontal ostium, superior FSDP compartment; AG, PE, SpS, MT, IT | `lm.frontal-ostium`, `s.frontal-recess`, `s.agger-nasi-cell` | N |
| `Sag.FSDP5` | sag | FSDP → hiatus → middle meatus | `pw.frontal-drainage`, `s.hiatus-semilunaris` | N |
| `Cor.FSDP6` | cor | frontal recess | `s.frontal-recess` | N |
| `Cor.FSDP1` | cor | frontal recess, hiatus, middle meatus, EB | `s.frontal-recess`, `s.hiatus-semilunaris`, `s.ethmoid-bulla` | N |
| `Cor.VariantFSDP1` | cor | uncinate to skull base: FSDP drains into the infundibulum | `v.uncinate-insertion-skull-base`, `pw.frontal-drainage-infundibular` | V |
| `Cor.VariantFSDP2` | cor | uncinate to lamina papyracea: FSDP drains to the middle meatus (terminal recess) | `v.uncinate-insertion-lamina-papyracea` | V |
| `Axial.FShypo` | ax | bilateral frontal hypoplasia | **(new)** `v.frontal-sinus-hypoplasia` (graph has aplasia only) | V |
| `Cor.PneumFS` | cor | hyperpneumatized frontal sinuses; large bullae | **(new)** extensive frontal pneumatization; **(new)** bulla hyperpneumatization | V |
| `Cor.pneumCG` | cor | pneumatized crista galli (incidental left ZMC fracture: exclude) | `v.crista-galli-pneumatization` | V |

**Frontal — Abnormal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Cor.frontalinflamm3` | cor | isolated right frontal disease | `c.sinonasal-inflammatory-patterns` (sporadic) | P |
| `Cor.frontalinflamm2` | cor | anterior ethmoid + maxillary: OMU pattern | `c.sinonasal-inflammatory-patterns` (OMU) | P |
| `Cor.OMU4` (also Maxillary-Abn.) | cor | diffuse OMU disease; right maxillary hypoplasia | OMU pattern; `v.maxillary-sinus-hypoplasia` | P, V |
| `Sag.anteriorOMU` (also Maxillary-Abn.) | sag | anterior OMU pattern through ostium, FSDP, hiatus | OMU pattern | P |
| `Sag.FSDP` | sag | anterior + posterior pattern (FSDP, AE, sphenoid ostium, SER) | OMU + SER patterns | P |
| `axial.MRCfrontal2`, `Cor.MRCfrontal1` | ax, cor | frontal mucus retention cyst | `dz.mucus-retention-cyst` | P |
| `Cor/Sag/axial.frontalmucocele` ⧉ | cor, sag *soft*, ax *soft* | expansile frontal mucocele into the orbit, globe displaced inferolaterally | `dz.mucocele` | P |
| `Epidabscess1` | ax *+C* | epidural abscess from frontal sinusitis | `dz.epidural-abscess` | P (soft) |
| `Epidabscess3` | cor *+C* | epidural abscess, intracranial + orbital (another patient) | `dz.epidural-abscess`, `dz.subperiosteal-orbital-abscess`? | P (soft) |
| `Osteoma2/3/4` ⧉ | ax, cor, sag | large frontal osteoma, intracranial and into the recess, globe displaced | `dz.osteoma` | P |

**Maxillary — Normal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Axial.max.1` | ax | MS, NLD, IT, septum | `s.maxillary-sinus`, `s.nasolacrimal-duct` | N |
| `Cor.OMU2` | cor | maxillary ostium, infundibulum, hiatus | `s.ethmoid-infundibulum`, `s.hiatus-semilunaris` | N — **but** Maxillary-Abnormal captions the same image with anterior ethmoid disease, a right MRC and a right paradoxical MT: not a clean normal |
| `Sag.max2` | sag | hiatus, uncinate, EB | `s.uncinate-process`, `s.ethmoid-bulla` | N |
| `Axial.Maxhypo` | ax | bilateral maxillary hypoplasia; absent septum | `v.maxillary-sinus-hypoplasia`; septal loss: **(new)** `dz.septal-perforation` or the existing `dz.cocaine-midline-destructive-lesion` / `dz.gpa` as causes | V, P |
| `Axial.PneumMT`, `Cor.pneumMT` | ax, cor | concha bullosa | `v.concha-bullosa` | V |
| `Paradox.MT.curve` | cor | paradoxical MT | `v.paradoxical-middle-turbinate` | V |
| `Cor.SeptDeviatnSpur` | cor | septal deviation with spur | `v.septal-deviation`, `v.septal-spur` | V |
| `Cor.Maxseptum` | cor | bilateral maxillary septa | `v.maxillary-sinus-septa` | V |

**Maxillary — Abnormal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Axial.Maxillarysinus` | ax | mucosal thickening + air-fluid level | `dz.acute-rhinosinusitis` | P |
| `Cor.OMU5` | cor | infundibular obstruction, AE disease, bilateral MS thickening | infundibular + OMU patterns | P |
| `Cor.Inflamm2` | cor | ostium/infundibulum + MS thickening | infundibular pattern | P |
| `Axial.acutesinus1` | ax | air-fluid level, bubbly | `dz.acute-rhinosinusitis` | P |
| `Axial.acutesinus2` | ax | air-fluid levels in ethmoid and sphenoid | `dz.acute-rhinosinusitis` | P |
| `Cor.foamysinus` | cor | "foamy" maxillary secretions | `dz.acute-rhinosinusitis` | P |
| `Aggressivesinus3` | ax | air-fluid level + posterior wall erosion | `dz.acute-rhinosinusitis`; mimic of `dz.acute-invasive-fungal-sinusitis` | P |
| `Aggressivesinus1` | ax *soft* | spread through the posterior wall into the retroantral fat | `s.retroantral-fat-pad`; red flag for AIFS | P (soft) |
| `Cor.MRCmax1`, `Sag.MRCmax3` ⧉? | cor, sag | maxillary mucus retention cyst (air around it, vs. a mucocele that fills and expands) | `dz.mucus-retention-cyst`, mimic `dz.mucocele` | P |
| `Cor.Maxpolyp` | cor | maxillary polyp (indistinguishable from MRC on CT) | `dz.crs-with-polyps`?, mimic `dz.mucus-retention-cyst` | P |
| `AntrochoanalPolyp1` | ax *soft* | antrochoanal polyp filling MS, widened infundibulum, into the nasal cavity | `dz.antrochoanal-polyp` | P |

**Ethmoid — Normal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Axial.ethmoid1` | ax | anterior and posterior ethmoidal canals; CG, AC, OC | `s.crista-galli`, `s.anterior-clinoid-process`, `s.optic-canal`, the ethmoidal arteries | N (canal QA) |
| `Axial.ethmoid2` | ax | basal lamella's lateral attachment to the lamina papyracea | `s.basal-lamella`, `s.lamina-papyracea` | N (**basal lamella QA**) |
| `Sag.ethmoidnormal` | sag | anterior drainage to hiatus, posterior to SER/superior meatus | `s.sphenoethmoidal-recess` | N |
| `Cor.basallamella` | cor | BL to LP; CG, cribriform, fovea | `s.basal-lamella`, `s.cribriform-plate`, `s.fovea-ethmoidalis` | N |
| `Sag.basallamella2` | sag | vertical BL to the skull base | `s.basal-lamella` | N |
| `Axial/Cor/Sag.Aggernasicell` ⧉ | all | agger nasi cell | `s.agger-nasi-cell` | N |
| `Cor.ethmoidbulla1` | cor | EB above uncinates, hiatus | `s.ethmoid-bulla`, `s.uncinate-process` | N |
| `Cor.ethmoidbulla3` | cor | enlarged bullae encroaching on the OMU | **(new)** bulla hyperpneumatization | V |
| `Axial/Cor/Sag.hallercell` ⧉ | all | infraorbital ethmoid (Haller) cell narrowing the infundibulum | `v.infraorbital-ethmoid-cell` | V |

**Ethmoid — Abnormal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Axial.antethmoidinf` | ax | anterior ethmoid disease, clear posterior ethmoid and sphenoid | OMU pattern | P |
| `Sag.ethmoidinflamm3` | sag | posterior ethmoid disease, SER involvement | SER pattern | P |
| `Axial.ethmoidinflamm4` | ax | anterior + posterior ethmoid | — | P |
| `Cor.ethmoidinfunddz1` | cor | infundibular disease with the uncinate to the skull base | infundibular pattern; `v.uncinate-insertion-skull-base` | P, V |
| `Mucocele1` | ax | expansile ethmoid mucocele | `dz.mucocele` | P |
| `Orbitalcellulitis2` | ax *+C* | orbital extension of ethmoid disease | `dz.orbital-cellulitis` (`c.chandler`) | P (soft) |
| `Axial/Sag/Cor.CSthrombosis` ⧉ | *+C* | ethmoiditis → orbit → cavernous sinus thrombosis | `dz.cavernous-sinus-thrombosis` | P (soft) |
| `Axial.ethmoidosteoma1`, `Cor.ethmoidosteoma2` ⧉? | ax, cor | anterior ethmoid osteoma into the orbit, fovea involved | `dz.osteoma` | P |

**Sphenoid — Normal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Axial.sphenoid1` | ax | SpS, SER, carotid canal | `s.sphenoid-sinus`, `s.sphenoethmoidal-recess` | N |
| `Cor.sphenoid1` | cor | foramen rotundum, vidian canal, optic canal, ACP, pterygoid plate | `s.foramen-rotundum`, `s.vidian-canal`, `s.optic-canal` | N (**canal QA**) |
| `Sag.sphenoid` | sag | ostium, SER | `lm.sphenoid-ostium`, `s.sphenoethmoidal-recess` | N |
| `Axial.Pneumsphenoid1` | ax | lateral recesses; FO, FS (*foramen spinosum* here) | `v.lateral-recess-pneumatization` | V |
| `Cor.Pneumsphenoid1` | cor | lateral recesses, V2 bulging, optic canals | `v.lateral-recess-pneumatization`, `v.v2-protrusion-sphenoid` | V |
| `Axial.BilatOnodicells1` | ax | bilateral sphenoethmoidal (Onodi) cells | `v.sphenoethmoidal-cell` | V |
| `Cor.Onodicell3` | cor | Onodi cells + pneumatized ACPs, optic canals | `v.sphenoethmoidal-cell`, `v.pneumatized-anterior-clinoid` | V |
| `axial.pneum.ptyp` | ax | pneumatized pterygoid processes | **(new)** `v.pterygoid-pneumatization` (gaps.md proposed a synonym; it is a distinct extension) | V |
| `Axial.sphenoidhypo` | ax | hypoplastic sphenoid | `v.conchal-sphenoid` or `v.presellar-sphenoid` (Opus judges in FG1) | V |

**Sphenoid — Abnormal**

| File | Plane | Shows | → | Role |
|---|---|---|---|---|
| `Sphenoidsinus1/2/3` ⧉? | ax, cor, sag | isolated left sphenoid disease, ostium obstruction, SER | SER pattern | P |
| `Mucocele3`, `Mucocele5` ⧉ | ax, sag *soft* | sphenoid mucocele into the posterior ethmoid | `dz.mucocele` | P |
| `Axial/Cor.SphenoidCSthrombosis` ⧉ | *+C* | sphenoiditis → cavernous sinus thrombosis | `dz.cavernous-sinus-thrombosis` | P (soft) |

**Yield.** Variants with at least one UW exemplar: 19 named (incl. 4 new
ids). Pathology exemplars: inflammatory patterns (all Babbel patterns
except sinonasal polyposis), acute sinusitis findings, MRC, polyp,
antrochoanal polyp, mucocele (frontal, ethmoid, sphenoid), osteoma
(frontal, ethmoid), and contrast-only complications. **Gaps UW cannot
fill** (Radiopaedia queue, §4.3): Keros III / asymmetric roof, lamina
papyracea and ICA/optic dehiscence, IFAC cells beyond the agger nasi,
accessory maxillary ostium, AEA in a mesentery, sinonasal polyposis, AFRS,
fungal ball, invasive fungal disease, silent sinus syndrome, inverted
papilloma, JNA, fibrous dysplasia, encephalocele/CSF leak.

### 4.2 UW atlas stacks

- **Head A** (axial + sagittal; 2,019 extracted arrow tips across all three
  planes, of which the axial and sagittal ones are on head A): base of
  `standard` and `scanned`; the resegmentation target (R7, `docs/ssb.md` §14).
- **Head B** (coronal only): a second `scanned` base after reconstruction
  (WP RB1). Unknown slice spacing (estimate as `scale.py` did for A: globe
  sphericity, skull dimensions, the coronal frames' own label tips), so
  resolution is anisotropic and thin lamellae may not survive between
  slices — quality grade B (R6.1, `docs/ssb.md` §14).

### 4.3 Radiopaedia

**Licence** (radiopaedia.org/licence, read 2026-10-07): CC BY-NC-SA 3.0.
Attribution must name the contributing user, Radiopaedia.org and the case's
rID, and online they must be links. Derived works must be re-licensed under
the same licence and not used commercially. A contributor may license their
own images otherwise, so **the licence is read per case**, not assumed.
There is no API and no supported bulk download; access must not burden the
site.

**Consequences for this repo:**

1. **Licence segregation.** Anything derived from a Radiopaedia case
   (numbers, poses, patches, meshes) lives under its own path
   (`ssb/exemplars/rp-<rID>/`) with a per-case `LICENSE.md` (CC BY-NC-SA 3.0,
   contributor, links), and the page shows the attribution wherever it is
   displayed. The rest of SSB is not relicensed by it. Decided (owner,
   RA-O4, 2026-10-07): derived data may be committed — the cases are
   public, and the licence asks for attribution and no commercial use,
   both of which this site meets. ShareAlike still binds: files derived
   from a case carry CC BY-NC-SA 3.0 and stay in its folder.
2. **Images.** Case images may be shown with their attribution (licence,
   RA-O4); a served image goes in the case's folder under the same licence,
   after a check for burned-in text (none allowed). Derived numbers,
   poses and edits are the default; images are added where a view needs
   them. (Contributor names on Radiopaedia are required attribution under
   its licence; the UW no-names rule does not apply to them.)
3. **Curated, small, polite.** A shortlist of cases (target 25–40, Opus
   picks, the owner may veto), cached in the gitignored drop zone, never in
   CI. Who fetches is RA-O5, decided 2026-10-09: access is approved, through
   the owner's own browser, because the site challenges non-browser clients
   and no agent works around it.
4. **Per case, record**: rID, URL, title, contributor, licence line as shown,
   modality, plane(s), series description, slice count, apparent window,
   contrast, whether the stack is complete or key images only, burned-in
   text (must be none), and the graph ids it serves.

**Search queue** (each needs ≥ 1 case; prefer non-contrast bone-algorithm
sinus CT with complete scrollable stacks in ≥ 2 planes):
Keros III and asymmetric ethmoid roof; dehiscent lamina papyracea; ICA and
optic canal dehiscence / protrusion; Onodi cell with the optic nerve;
pneumatized anterior clinoid; IFAC cells (supra agger, supra agger frontal,
suprabullar, suprabullar frontal, supraorbital ethmoid, frontal septal);
accessory maxillary ostium; pneumatized uncinate; AEA below the skull base;
sphenoid septum inserting on the carotid; conchal / presellar / postsellar
pneumatization; septal deviation by Mladina type; silent sinus syndrome;
sinonasal polyposis; AFRS; fungal ball; acute invasive fungal sinusitis;
inverted papilloma (focal hyperostosis); JNA; fibrous dysplasia; osteoma;
mucocele; antrochoanal polyp; encephalocele / CSF leak site; and **normal
sinus CTs** (as many as exist: they are the population for normal
asymmetry). A case found during the search is a candidate, not a source,
until its record is complete and its anatomy checked by Opus.

**Stack → volume.** Radiopaedia stacks are exported images (downsampled,
windowed, often 8-bit), spacing not given. Reconstruct as UW was: estimate
in-plane scale and slice spacing from anatomy (globe ~24 mm axial length,
interorbital and skull dimensions) and, where ≥ 2 planes exist, from their
mutual registration; grade A (≥ 2 planes, mutually consistent, dense), B
(one dense stack), C (key images only — a 2D exemplar like the UW pages).

### 4.4 Volumetric population data (approved, RA-O6)

Single exemplars cannot say what *typical* asymmetry is. An open volumetric
dataset can: **NasalSeg** (Zenodo record 13893419, Scientific Data 2024,
doi:10.1038/s41597-024-04176-1): 130 CT scans with left/right nasal cavity,
nasopharynx and left/right maxillary sinus labels, CC BY 4.0 (record read
2026-10-07). It gives paired left/right volumes and shapes for the
maxillary sinuses and cavities across subjects — the normal-asymmetry
distribution `scanned` should be compared against. Approved by the owner
(RA-O6, 2026-10-07). What ships from it is numbers with its citation
(`ssb/anatomy/population/nasalseg.json`, built by
`tools/ssb-pipeline/nasalseg/stats.py`, WP POP0, done 2026-10-07); the scans
themselves stay in the gitignored drop zone.

**Who the subjects are** (dataset paper): 130 adults, 74 M / 56 F, aged
24–82 (mean 54.6), the CT of PET/CT on one scanner at one Shanghai nuclear
medicine centre, 0.586 × 0.586 × 1.5 mm, no sinus-disease exclusion stated.
Not a sinus-clinic cohort (less disease-selected), but one ethnicity, one
centre, older than a typical FESS population, and a low-dose CT. The labels
are **air**, so disease shrinks them.

**What the archive actually holds** (POP0's checks; the method is in the
script's docstring, every correction is listed in the JSON):

- **Byte-identical duplicates:** the 130 case ids hold **107 distinct
  scans** (19 groups of 2–4 identical image + label arrays). Anyone using
  NasalSeg as if n = 130 double-counts.
- **Label headers:** 11 label files disagree with their image's header (z
  flipped against the uncropped frame, or 1.0 mm instead of 1.5 mm slices),
  while the arrays are voxel-aligned. Geometry is taken from the image.
- **Swapped labels:** one case's nasal-cavity labels have right and left
  swapped (sides are assigned by position).
- **Label completeness:** every label misses about 6 % of the adjacent air
  (the boundary sits a voxel inside it), so absolute volumes run low by
  about that much while left/right indices barely move. A few labels stop
  at flat cuts where air continues; those above a Tukey fence are excluded.
- **Disease:** reviewed by eye per case (coronal + axial slice, uncertain
  ones again at zoom; verdicts in `tools/ssb-pipeline/nasalseg/review.json`,
  for the owner to spot-check): of 214 maxillary sinuses, 7 with mucosal
  thickening / cyst / fluid, 6 opacified, 4 undecidable. Two slices per
  sinus will miss some focal disease, so this undercounts it. The
  automatic lining measure barely separates disease from clear and is kept
  only as a number.

**Results** (the *clear* subset: both maxillary sinuses clear and
completely labelled, n = 88; asymmetry index AI = 100·(R − L)/mean):

| | median volume R / L (mL, air) | \|AI\| median (IQR) | \|AI\| 95th pct | max |
|---|---|---|---|---|
| Maxillary sinus | 13.7 / 13.1 | 17 % (7–35) | 55 % | 167 % (a unilateral hypoplasia) |
| Nasal cavity | 11.4 / 11.4 | 12 % (5–20) | 33 % | 51 % |

Signed AI averages ≈ 0 for both (no side bias). **Cavity and maxillary
asymmetry are independent** (Spearman ρ ≈ 0): the cavity's tracks the
nasal cycle and the septum, the maxillary sinus's its own development. The
`scanned` state and any asymmetry generator should vary them independently.

**Head A against this population** (same method on its as-scanned labels;
SSB's label boundaries differ, so compare indices, not volumes): its
maxillary AI (−11 %) sits at the 34th percentile, ordinary. Its **nasal
cavity AI (+75 %, left 2.8 mL vs right 6.0 mL) lies beyond every one of
the 88 clear NasalSeg subjects** (max 51 %). Either head A's left cavity is
genuinely extreme (septal bow plus a congested left inferior turbinate) or
SSB's segmentation assigns left meatal air to other compartments. RS (R7, `docs/ssb.md` §14)
must settle which before RA3b ships `scanned` as *normal* asymmetry; if it
is real, the state says this head is at the edge of normal, not typical.

---

## 5. Methodological limits (read before trusting any output)

1. **n = 1 per base.** Head A is one adult; head B a second. Every
   "normal" the page shows is one realization, not a mean.
2. **Teaching-file spectrum bias.** UW and Radiopaedia pick florid,
   unambiguous examples. A concha bullosa calibrated on them is a large one.
   Presets therefore come in three grades — *mild*, *typical*, *marked* —
   with *marked* anchored on exemplars and *typical* on population data
   where the graph has it (`v.*.prev`, `m.*`), never the reverse. The badge
   says which.
3. **A slice is not a volume.** A single UW figure fixes a cross-section;
   the third dimension of a grafted variant is an assumption (a
   superellipsoid, an extrusion along the structure's axis). The edit's
   header records which dimensions were measured and which assumed.
4. **Same patient across planes is not given.** Triplets such as
   `Osteoma2/3/4` look like one patient in three planes; FG1 confirms by
   matching anatomy before any 3D extent is taken from them.
5. **Scale is estimated.** The UW pages carry no pixel spacing. Scale from
   anatomy is good to roughly ±10 %; measurements are therefore stored as
   **ratios to a local reference** (e.g. concha width ÷ ipsilateral nasal
   cavity width at that level; cell height ÷ orbital height) and converted
   to mm on the base head.
6. **Cross-subject registration is approximate.** Placing another patient's
   slice in head A's frame is accurate to several mm at best. Positions are
   stored relative to nearby landmarks (thin-plate spline on a landmark set,
   R6.1, `docs/ssb.md` §14), with the residual; nothing downstream may treat them as exact.
7. **Window and contrast differ.** Bone-window images register on bone
   edges and air; soft-window and post-contrast images only on large air
   and bone outlines. Disease-filled sinuses must be masked out of the
   registration objective, or the fit is pulled toward the wrong slice.
8. **Circular validation.** Arrow tips used as segmentation seeds cannot
   also measure segmentation accuracy; R7.1, `docs/ssb.md` §14 holds out a fixed split. An
   exemplar used to calibrate an edit cannot also validate it; a variant is
   validated on a second, independent exemplar where one exists.
9. **Prevalence denominators.** When a variant is shown, its prevalence
   comes from the graph with its unit (`% sides` / `% patients`), method and
   population, never from the number of exemplars found.
10. **Physiology vs. structure.** The nasal cycle and undecongested mucosa
    explain much of head A's left–right cavity asymmetry; `scanned` labels
    turbinate and mucosal asymmetry as physiological and septal/bony
    asymmetry as structural.
11. **Supine gravity.** Air–fluid levels in a supine axial scan lie in a
    plane perpendicular to the anterior–posterior axis (the fluid layers
    posteriorly); the overlay operator takes the scan position as a
    parameter rather than drawing a level that is horizontal on screen.

---

## 13. Owner decisions

Each row is dated. *Open* marks what still waits on the owner.

| ID | Question | Decision |
|---|---|---|
| RA-O1 | Does the UW email ("Yes that is fine, it is public anyways. Be sure to credit us … would love to see the final version") cover **serving the atlas's own images** (the unlabeled/labeled recall deck; exemplar figures side by side)? | **Yes.** The images may be served from this origin, always with the credit line of `ssb/LICENSE-data.md`. Send the authors the finished model, as they asked. |
| RA-O2 | Add **composite** as a fourth truth kind (R2.2, `docs/ssb.md` §14)? | **Yes.** |
| RA-O3 | Default base for Variants/Pathology? | **`scanned`** — variants and pathology should look realistic, so they sit on the real asymmetric head; `standard` is one click away. |
| RA-O4 | May Radiopaedia-derived data (and images) be committed? | **Yes** — the cases are public; attribute (contributor, Radiopaedia.org, rID, as links) and do not monetize, which this site does not. ShareAlike: derived files carry CC BY-NC-SA 3.0 in their own folder. |
| RA-O5 | Who downloads Radiopaedia stacks? | First: an agent, one case at a time (2026-10-07). Reopened 2026-10-09 when the site began challenging non-browser clients. **Decided (owner, 2026-10-09): access approved.** The cloud container gets HTTP 406 from radiopaedia.org, and no agent works around the challenge (no scraping service or proxy, no header spoofing, no headless or cloud browser). RP2 therefore runs in the owner's own browser: the owner opens the picked cases (by hand, or with Claude driving that browser at reading pace), saves each stack into the drop zone, and fills the "owner reads" fields from the same page. |
| RA-O6 | Use **NasalSeg** (CC BY 4.0, 130 CTs) for population asymmetry statistics? | **Yes** — started as WP POP0. |
| RA-O7 | Author names remain in **git history** before 2026-10-07. Rewriting `master` history is destructive (force-push, every clone and open PR breaks). | *Open.* Recommended: leave history; the names are gone from the tree and RA0d keeps them out. Rewrite only if the authors ask. |
| RA-O8 | Scope of batch 3 (soft-tissue/contrast complications with a synthetic channel) | **Decided (owner, 2026-10-11), as recommended:** plan batch 3 only after batches 1–2 are verified. |
| RA-O9 | The ethmoid lamellae (middle turbinate vertical lamella, basal lamella, uncinate) are not recoverable by the sheet filter on this head: two rule revisions (RS2b v2, v3) named no middle turbinate, and a third shaped by the candidates' diagnostics would be fitting one head. | **Decided (owner, 2026-10-09): C, then A** for any sheet-side C cannot place (WP RS2c). B is not taken: RS3 waits for RS2c. The options were: (A) Hand-trace them in 3D Slicer on head A's native volume (the documented fallback; the owner or a delegate traces, the owner verifies; the traced sheets enter the pipeline as a committed, provenance-marked input, not as edited output). (B) Keep RS2a's gains, keep the basal-lamella proxy, and continue RS3–RS6 on it, revisiting the lamellae later. (C) Opus places a few control points per lamella on review slices of head A's own stacks and a spline sheet is fitted through them, owner verifies. |
