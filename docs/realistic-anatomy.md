# Realistic anatomy — scoping, implementation, execution and review plan

**Status (2026-10-07): owner decisions RA-O1…O6 answered (§13); first WP
done (POP0, NasalSeg population asymmetry, §4.4); the rest is plan.** Written by Opus for the owner. It extends SSB (`docs/ssb.md`) from one standardized head to
a head that can be shown four ways — **symmetric**, **normal asymmetry**,
**normal variants**, **pathology** — and grounds the last three in more CT:
the remaining pages of the UW atlas and curated Radiopaedia cases. When the
owner accepts it, its work packages move into `docs/ssb-roadmap.md` (the
board) and this file keeps the design, as `docs/ssb.md` does for SSB.

Read first: `docs/ssb.md` §1 (principles), §4 (frame), §5.1–5.3 (specimen
and pipeline), §6 (dioramas), §7.3 (state and URL);
`ssb/reference/uw-sinusanatomy2/README.md` (what the atlas is, its two
heads, the arrow-tip method); `docs/delegation.md` §2 (WP format).

**Credit.** Every UW-derived item credits *Interactive CT Sinus Anatomy,
University of Washington Department of Radiology* (`ssb/LICENSE-data.md`
holds the exact attribution and the written permission of 2026-10-07).
The repo names the atlas and its institution, never its individual authors
— not in files, not in commit messages (owner, 2026-10-07). Radiopaedia
items carry the attribution their licence requires (§4.3).

---

## 1. Goal, and what "realistic" means here

The page today serves the UW axial/sagittal head **standardized**: right half
mirrored, septum centred (O6, `docs/ssb.md` §5.1). That was right for a
first release and is wrong as an end state — no head is symmetric, and the
things a sinus surgeon must learn to read on a preoperative CT are exactly
the departures from the standard head.

**Goal.** One toggle, four anatomy states, each honest about what kind of
truth it shows:

| State (UI label) | What the learner sees | Built from | Truth kind (badge) |
|---|---|---|---|
| `standard` (Symmetric) | the current standardized head | N1, unchanged | specimen, standardized |
| `scanned` (Normal asymmetry) | a real head as scanned: septal bow, unequal cavities, one-sided cells | UW head A without N1; later UW head B (§4.2) | specimen |
| `variant` (Variants) | a base head with one named variant applied (or a curated set) | the variant on a real head where one exists; else a constrained edit of the base, calibrated on exemplars | specimen, or **composite** (new) |
| `pathology` (Pathology) | a base head with a condition laid over it | condition operators calibrated on exemplars | composite |

**Non-goals.** No patient data. No statistical shape model sold as a real
head. No disease the bone-window specimen cannot show honestly without a
synthetic soft-tissue channel (those wait for §9.3). No new external runtime
dependency; everything stays offline-pipeline → committed data → static page.

**What the owner gets at the end.** A CT and a 3D head in which "show me a
right concha bullosa", "this patient's left Haller cell narrowing the
infundibulum", "Lund–Mackay 2 in the left maxillary with an OMU pattern" or
"a frontal mucocele pushing the globe down" are one click, each with the
graph's text, prevalence (with its denominator), the exemplar it was
calibrated on, and the stations where it changes the operation.

---

## 2. The four states — semantics

### 2.1 Layers, not modes

The four states are **layers over a base**, not exclusive modes:

```
anatomy = { base: standard | scanned[-b] | <exemplar head>,
            variants: [ {id, side, preset} … ],      // applied in order
            conditions: [ {id, side, preset} … ] }   // applied after variants
```

- *Symmetric* = `{base: standard}`; *Normal asymmetry* = `{base: scanned}`.
- *Variants* and *Pathology* open a picker and apply to the current base.
  **Default base for both: `scanned`** (owner, RA-O3: variants and
  pathology should look like a real patient's CT, so they sit on the real,
  asymmetric head). A switch moves the same variant onto `standard`, where
  the contralateral side becomes a clean normal control (a right concha
  bullosa beside a normal left middle turbinate) — useful for isolating
  one change, but not the default. Consequence: batch-1 variants and
  pathology are built and tested on `scanned` first, so RA3b (the scanned
  base) is on their critical path.
- One variant per side per region in v1; curated **scenarios** (named sets,
  e.g. "typical preoperative CT") are precomputed combinations (§6.3).
- Pathology composes over variants because disease follows anatomy (a Haller
  cell narrows the infundibulum; an infundibular pattern then opacifies the
  maxillary sinus behind it). The pipeline proves each allowed combination
  (§6.3, compatibility table).

### 2.2 Truth kinds

`docs/ssb.md` §1.2 has three truth kinds: specimen, diorama, population.
This plan needs a fourth, and it must stay as distinct as the other three:

- **composite** — *a real specimen with a declared edit*. The badge names the
  edit, its parameters, and the exemplar(s) it was calibrated on:
  "Specimen, edited: right concha bullosa (bulbous, 11 mm), calibrated on
  UW Maxillary-Normal fig. 6 and Radiopaedia rID …; schematic". Picking an
  edited voxel or mesh reports that it is edited.

Adding a truth kind changes a principle; the owner approved it (RA-O2,
2026-10-07), so `docs/ssb.md` §1.2 gains it when the first edited state
ships (WP RA3a's docs pass).

### 2.3 What each state changes across the page

| Consumer | standard | scanned | variant / pathology |
|---|---|---|---|
| CT volume, labels | as now | own volume | base + patches (§6.2) |
| Specimen packs | as now | own packs | base packs with node overrides |
| Distance fields (scope HUD) | as now | own | patched where the edit changes them (dehiscence, Onodi) |
| Landmarks, sweeps, charts | as now | own, per side (no mirror) | patch overrides by key |
| Endoscope stations (E5, E6 in PR #115) | posed | re-validated; invalid poses say so | re-validated per patch |
| Flap overlay (ST5), septal charts | as now | recomputed per side | septal deviation recomputes the chart |
| Variant lab | unchanged | unchanged | a lab diorama can link to "see it on the specimen" |
| Graph panels | as now | + asymmetry measurements | + the entity's panel, prevalence, exemplar list |

---

## 3. What exists now (2026-10-07)

**Specimen A** (UW axial + sagittal stacks, one head): 0.3437 mm in-plane,
0.625 mm slices, bone-window 8-bit display, served on a 0.5 mm grid in RAS.
Labels: the named air spaces (agger nasi cell, anterior and posterior
ethmoid cells as two lumps, bulla, frontal recess and sinus, maxillary,
nasal cavity, nasopharynx, sphenoid), the stage-C wall units, septum,
inferior and middle turbinates, orbits (`ssb/geometry/labels.json`). The
basal lamella is a **proxy plane**; there is no uncinate, superior
turbinate, ostium, infundibulum, hiatus, meatus, sphenoethmoidal recess or
individual ethmoid cell label; canals and vessels are sweeps, many points
inferred. The as-scanned (pre-N1) files are reproducible from git
(`normalize.py` `AS_SCANNED_COMMIT`). Its left side carries the head's
asymmetries: a left cavity with less than half the right's air and a left
inferior turbinate twice the right's volume against a septum bowed slightly
right, a left sphenoid ostium closed by mucosa, an unlabelled left bulla
(`docs/ssb.md` §5.1). Most of that is **physiological** — the nasal cycle
congests one side's turbinates and mucosa at a time, and this specimen is
not decongested — which the `scanned` state must say rather than present
as structure.

**Specimen B** (UW coronal stack, a different adult head, 109 labeled
frames): not used for geometry (`registration.specimen_identity`). It is
a second real normal head with visibly different ethmoid partitions,
maxillary septa and sphenoid septation — real normal variation we already
have permission for.

**UW teaching pages**: 8 pages (Frontal/Maxillary/Ethmoid/Sphenoid ×
Normal/Abnormal), crawled 2026-10-07 into the gitignored drop zone
(`tools/ssb-pipeline/incoming/uw-sinusanatomy2/`): 87 figure files, three
reused across pages, one listed file missing on the server
(`Sag.OMU&Sps.jpg`, HTTP 404). Single slices, ~300–800 px, labels and arrows
baked in, captions spell out every abbreviation. Inventory: §4.1.

**Graph**: variants (`v.*`) and conditions (`dz.*`) are already rich; every
variant is `geo: diorama` or `none` and every condition `geo: overlay` or
`none` — **nothing is yet drawn on the specimen**. Three dioramas exist
(`ethmoid-roof`, `frontal-recess`, `sphenoid`), whose rules (IFAC drainage,
Keros, sphenoid exposure) are pinned in `tools/test-ssb.mjs`.

**Open PRs touching the same ground** (scanned for context only):
[skflx/skflx.github.io#115](https://github.com/skflx/skflx.github.io/pull/115)
(E6, station flights — `js/ssb/state.js`, `scope.js`, `mode-endoscope.js`;
stations posed on the standard head, which §2.3 must re-validate per base)
and [skflx/skflx.github.io#114](https://github.com/skflx/skflx.github.io/pull/114)
(C1a, seven procedures + sources — content this plan's panels will link
to). Nothing here should start in `state.js` until #115 merges.

---

## 4. Sources

### 4.1 UW teaching pages — figure inventory

Role: **N** normal reference (resegmentation QA, alignment), **V** variant
exemplar, **P** pathology exemplar. Window: bone unless marked *soft* or
*+C* (post-contrast). "→" = graph ids; **(new)** = an id the graph lacks
(§8.3). Same-patient multiplanar sets (§5, item 4) are marked ⧉ — to be
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
  `standard` and `scanned`; the resegmentation target (§7).
- **Head B** (coronal only): a second `scanned` base after reconstruction
  (WP RB1). Unknown slice spacing (estimate as `scale.py` did for A: globe
  sphericity, skull dimensions, the coronal frames' own label tips), so
  resolution is anisotropic and thin lamellae may not survive between
  slices — quality grade B (§6.1).

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
   CI. Who fetches is RA-O5, reopened: the site challenges non-browser
   clients, and no agent works around it.
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
SSB's segmentation assigns left meatal air to other compartments. RS (§7)
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
   §6.1), with the residual; nothing downstream may treat them as exact.
7. **Window and contrast differ.** Bone-window images register on bone
   edges and air; soft-window and post-contrast images only on large air
   and bone outlines. Disease-filled sinuses must be masked out of the
   registration objective, or the fit is pulled toward the wrong slice.
8. **Circular validation.** Arrow tips used as segmentation seeds cannot
   also measure segmentation accuracy; §7.1 holds out a fixed split. An
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

## 6. Architecture

### 6.1 The anatomy registry — keeping track of where everything is

The owner asked for "something internally to keep track of the overall
positions … and overlay them". That is three files and one viewer overlay,
all in the existing RAS frame (`docs/ssb.md` §4: origin ANS, axial ∥
Frankfort, x = 0 midsagittal):

- **`ssb/anatomy/sources.json`** — every source item: a base volume (head A,
  head B, a graded Radiopaedia volume) or a 2D figure (UW page image,
  Radiopaedia key image). Per item: id (`uw-fig:Cor.pneumMT`,
  `uw-head:A`, `rp:<rID>`), licence and attribution key, modality, plane,
  window, contrast, grade (A/B/C), same-patient group, and its **pose**:
  for a volume, the similarity + TPS transform to head A's frame; for a
  figure, a plane `{origin, u, v, mmPerPx}` in head A's frame with a fit
  residual and an identifiability margin (best vs. second-best fit).
- **`ssb/anatomy/observations.json`** — every extracted fact as an
  observation: `{id, source, kind: point|contour|measure, of: <graph id>,
  side, raw (source px or voxel), ras (in head A frame), sigmaMm, method}`.
  UW arrow tips, Radiopaedia annotations read by eye, measured ratios.
  Numbers only, no pixels.
- **`ssb/anatomy/population.json`** — per graph id or measurement, the
  aggregated observations across heads (n, per-side values, paired L−R
  differences), beside the graph's literature values. The asymmetry panel
  and preset ranges read it.
- **RA landmark set** — the landmarks every pose and TPS uses, chosen to be
  visible in at least two planes and present in the graph: ANS, crista
  galli apex, sella floor centre, dorsum sellae tip, choanal arch, frontal
  ostia, sphenoid ostia, middle turbinate heads, foramen rotundum (anterior),
  infraorbital foramina, greater palatine foramina, optic canal openings,
  globe centres **(new landmarks)**. Missing ones are added to the graph as
  `lm.*` (content) and to `landmarks.json` (geometry) in RS6.

**Overlay viewer (dev and teaching).** CT mode gains an *Exemplars* layer:
observations within ±3 mm of the current slice plane are drawn as markers
(colour by source, shape by kind) on head A, and the exemplar figures whose
pose lies near the slice are listed beside it. Disagreement between an
observation and head A's labels is the QA signal for resegmentation; for
teaching, clicking an exemplar applies its variant to the specimen. The
UW permission covers showing the figures themselves (owner, RA-O1,
2026-10-07), so the figure is shown side by side, served from this origin
(the site is HTTP-only, so an HTTPS page cannot hotlink it), with the
credit line beside it.

### 6.2 Data layout and the patch format

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

`ssb/ct`, `ssb/geometry`, `ssb/models` stay the `standard` base, so nothing
existing moves. `labels.json` stays the one append-only table for every
base and patch (a variant's new air space is labelled with its graph id,
e.g. `v.infraorbital-ethmoid-cell.R`; `check-data.mjs` already requires
every name to be a graph id).

**Patch (`.ssbp.gz`)** — gzip of a small JSON header (length-prefixed) then
raw arrays:

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

Dense boxes (not sparse lists): simple to apply and test, and a box around
a variant is small (a concha bullosa box is ~25 × 40 × 30 mm = 60k voxels at
0.5 mm). `js/ssb/volume.js` gains a pure `applyPatch(volume, patch)` with
the same header validation as `ct.json` (dims, box inside the volume, label
indices in the table). Override packs replace whole nodes named in
`replacesNodes` (no mesh stitching); the specimen stage hides the base
nodes of those names while the patch is active.

### 6.3 Composition and the compatibility table

Patches apply in order: variants, then conditions. Two patches are
compatible when their boxes do not overlap, or when the pipeline has built
and tested their combination. `index.json` carries `compat` (pairs the
pipeline built and tested) and `scenarios` (named precomputed combinations,
each its own patch set with its own override nodes, so no runtime remeshing
of combined edits). v1: one variant per side per region + one condition.

### 6.4 State, URL, UI

- **State**: `state.anatomy = {base, variants, conditions}` in the one
  store, orthogonal to the stage (specimen, lab, CT, scope). Changing it
  reloads volume/packs through the existing lazy loaders and re-validates
  the scope pose (a pose that becomes blocked is clamped as now and the HUD
  says why).
- **URL** (whitelist, `docs/ssb.md` §7.3 rules):
  `#anat=standard|scanned|scanned-b` + `&v=<v-id>.<R|L>[:<preset>]` +
  `&dz=<dz-id>.<R|L|M>[:<preset>]`. Ids must be in `index.json` *and* the
  graph; presets in the entity's preset list; combinations in `compat` or
  the whole anatomy key is dropped. Nothing reaches markup except through
  `textContent`.
- **UI**: a four-pill *Anatomy* group beside *Stage* (Symmetric · Normal
  asymmetry · Variants · Pathology); Variants and Pathology open a picker
  grouped by region, filtered by depth tier, each entry showing side,
  presets, prevalence and the exemplar count. The truth badge and the
  provenance note follow the state (including the UW credit line,
  WP RA0c).

### 6.5 Edit operators (pipeline)

One Python module, `tools/ssb-pipeline/anatomy/ops.py`, each operator a pure
function `(ct, labels, landmarks, params) → patch` with stated invariants,
mirroring the diorama contract (`PARAMS` with ranges and `from` graph ids,
`PRESETS`, self-test):

| Operator | Does | Used for |
|---|---|---|
| `pneumatize` | turns a bony/soft region into air, keeping a cortical shell of given thickness | concha bullosa, crista galli, ACP, pterygoid, uncinate pneumatization, lateral recess extension |
| `grow_cell` | inserts an air cell (superellipsoid, oriented on landmarks) with a 0.5–1 mm wall, repartitioning the ethmoid air it displaces | Haller, Onodi, IFAC cells, bulla hyperpneumatization, agger size |
| `deflate` | shrinks a sinus with wall thickening/retraction by type | maxillary hypoplasia (by `c.maxillary-sinus-hypoplasia` type), frontal hypoplasia/aplasia, conchal sphenoid, silent sinus |
| `deform` | smooth displacement field in a box (bone, air and labels move together) | septal deviation (Mladina types), spur, paradoxical MT, Keros depth / lateral lamella, roof asymmetry, mucocele expansion, globe displacement |
| `plate` | inserts or removes a thin bony plate | maxillary septa, sphenoid septum on the ICA, bullar lamella deficiency |
| `dehisce` | removes bone over a structure for a given arc and length | lamina papyracea, ICA, optic canal, AEA canal |
| `reroute` | moves a sweep and builds its bony support (canal or mesentery) | AEA in a mesentery, suspended infraorbital canal |
| `fill` | fills air with tissue of a target HU: shell (thickening), level (fluid, with gravity), dome (cyst), lobules (polyps), core with calcifications (fungal ball), expansile (mucocele, AFRS) | the inflammatory conditions (§9) |
| `bone_mass` | adds lobulated bone or ground-glass density | osteoma, fibrous dysplasia, focal hyperostosis (inverted papilloma) |
| `erode` | removes bone and extends tissue beyond the wall | aggressive sinusitis, AIFS, malignancy (later) |

**Texture realism.** Edited voxels must look like CT, not like painted
labels: bone and soft-tissue display values sampled from head A's own
voxels of the same tissue and thickness; partial-volume blur from the
point-spread width measured on head A's sharpest air–bone edges; noise
matched to head A's measured σ per tissue. HU targets go through the
inverse of `ct.json` `toHU` (about 15.7 HU per display level; soft tissue
is only a few levels wide in this bone window, which is why §9.3 waits for
a synthetic soft-tissue channel).

### 6.6 Budgets

Per state, the `docs/ssb.md` §5.4 budgets hold (CT + labels + fields
≤ 6 MB on first entry; first render ≤ 2.5 MB). A second full base adds
about the size of today's `ssb/ct` + `ssb/models` to the repo and loads only
when chosen. Patches and override packs: target ≤ 250 kB each, ≤ 8 MB for
the whole catalogue. Git history grows with every re-export, so bases and
patches are re-exported at checkpoints, not per WP.

---

## 7. Resegmentation of head A ("much more robust and accurate")

Every edit and every state is only as good as head A's labels. The current
ones were good enough for a normal atlas and are not good enough to graft
a Haller cell (no uncinate, no infundibulum) or to classify frontal cells
(no individual cells). This is the critical path.

### 7.1 Ground truth and metrics

- **Held-out split.** The head-A arrow tips (`slices.json`, axial and
  sagittal) are split once, stratified by structure and slice region,
  fixed seed, into **seed (70 %)** and **held-out (30 %)**; the split list
  is committed (`ssb/reference/uw-sinusanatomy2/split.json`). Segmentation
  reads only seeds; the score reads only held-out tips.
- **Identity metric**: held-out tip hit rate per structure — the tip's voxel
  (± 1 voxel) carries the crosswalked id. Target ≥ 95 % overall, ≥ 90 % for
  every structure with ≥ 10 held-out tips; report Wilson 95 % CIs, since
  small-n structures can reach 100 % by chance.
- **Boundary metric.** Tips say nothing about walls between compartments.
  On review slices (every 5 mm per plane through the ethmoid–frontal
  region), our label outlines are drawn over **the very UW labeled frame
  that is that slice** (head A *is* those stacks, so alignment is exact by
  construction). Opus marks each partition wall correct / misplaced (> 1 mm)
  / missing; target ≥ 90 % correct.
- **Topology checks** (automatic): every air label is one component; each
  sinus and cell reaches its expected meatus through its ostium (shortest
  air path, as the frontal-recess diorama computes); no air label crosses
  the orbit or anterior cranial fossa; bone units are thicker than 0 and
  thinner than stated limits.
- **Graph consistency**: `relate3d.py` contradictions do not increase;
  the IFAC drainage rules pinned for the diorama are re-run on the
  specimen's own cells and must hold.

**Baseline (RS0, 2026-10-09; Opus reading).** Run
`python3 -I tools/ssb-pipeline/uw/score.py` for the numbers; they are not copied here. What
they mean for RS:

- **The headline mixes coverage with accuracy.** Most held-out misses are tips on structures
  that have no label at all (bones such as the frontal bone and the frontal process of the
  maxilla, the nasolacrimal duct, foramina and fissures, and the pterygopalatine fossa, which
  `walls.py` seeds only on its offline grid). So RS scores two things separately:
  **coverage**, meaning every id in RS's declared label set (RS1 writes it down) has a label,
  and **identity**, the hit rate over the structures that are labelled. The ≥ 95 % / ≥ 90 %
  targets apply to identity over the declared set. Tips on ids outside the set are reported,
  never gated.
- **±1 voxel is tighter than the ground truth.** For labelled structures, almost every
  ±1-voxel miss is a hit at `--tol 6` (3 mm), and the axial and sagittal tips of one structure
  disagree by several mm (the scorer prints the median). The identity gate is therefore
  `--tol 1` as specified, read alongside `--tol 6`. A candidate that loses ground at `--tol 6`
  has lost a structure. A candidate that moves only at `--tol 1` has moved within the tips'
  noise. **The boundary review and the topology checks are what tell a better segmentation
  from today's**; the tip metric mostly guards coverage.
- **Today's labels are a resubstitution score.** They were grown from these tips, held-out ones
  included, so an honest RS may score lower at `--tol 1`. That alone is not a regression; a
  drop at `--tol 6` is.
- **Topology failures are concrete RS targets:** the anterior ethmoid cells, the ethmoid bulla,
  the frontal recess and the nasal cavity are split into several components, and one sphenoid
  sinus is not joined to its side's cavity in the as-scanned head (RS3, RS4).
- **Not evaluable yet, to be defined in the RS specs:** "no air label crosses the anterior
  cranial fossa" needs an intracranial compartment in the served labels (RS6 adds it from
  `walls.py`'s grid). Upper limits on bone thickness are set per unit in RS6's spec, from
  sources; no number is assumed here.

### 7.2 Method

1. **Native grid.** Segment on the native 0.3437 × 0.3437 × 0.625 mm volume
   (`incoming/_recon/specimen-native.npz`), export to the served 0.5 mm grid
   last, so thin lamellae are found before resampling blurs them.
2. **Lamellae as sheets.** A multiscale Hessian sheetness filter on bone
   (bright plates: one large-magnitude eigenvalue, two small) finds thin
   septa; each sheet is identified by attachment rules and seeds:
   uncinate (lateral wall/agger anteriorly, free posterior edge at the
   hiatus), bullar lamella, basal lamella (lamina papyracea laterally,
   skull base superiorly, middle turbinate medially — **replaces the proxy
   plane**, same id, method recorded), ground lamella of the superior
   turbinate. UW figures `Axial.ethmoid2`, `Cor.basallamella`,
   `Sag.basallamella2` are its review references.
3. **Ethmoid cells as instances.** Inside ethmoid air: distance-to-bone,
   h-maxima markers, watershed constrained by the detected sheets; each cell
   gets centroid, volume, neighbours, and its drainage (which meatus its air
   reaches). Classification by rule — agger nasi, bulla, supra agger, supra
   agger frontal, suprabullar, suprabullar frontal, supraorbital ethmoid,
   frontal septal, infraorbital ethmoid, sphenoethmoidal — with **one rule
   set shared** with the frontal-recess diorama (criteria as data, not two
   implementations). A cell no rule claims stays a generic anterior or
   posterior ethmoid cell.
4. **Openings and channels as air sub-labels**: frontal ostium, maxillary
   natural ostium, sphenoid ostium (narrowest cross-section rules, as the
   frontal ostium already is), infundibulum, hiatus semilunaris, middle,
   superior and inferior meatus, sphenoethmoidal recess, olfactory cleft.
   Each is `partOf` its parent in the graph; every consumer that tests for
   `s.nasal-cavity` (collision, lining, floor chart) is listed in the WP and
   switched to "the id or anything `partOf` it" in the same change.
5. **Canals as labels**: optic, vidian, foramen rotundum, carotid canal /
   prominence, anterior and posterior ethmoidal canals, infraorbital canal,
   nasolacrimal canal, sphenopalatine foramen — from the lumen detector
   `sweeps.py` already has; sweeps then follow the detected centrelines
   where detected. `Cor.sphenoid1` and `Axial.ethmoid1` are review
   references.
6. **Bone units added**: superior turbinate, crista galli, anterior clinoid,
   pterygoid process, uncinate (as a removable unit).
7. **Then rebuild both bases**: `normalize.py all` for `standard`, the same
   stages without mirroring for `scanned`. Stage-D steps that assume
   symmetry (the floor chart's "left = right", the sides step) compute each
   side for `scanned`.

---

## 8. Variants catalogue

### 8.1 Batch 1 (high-yield preoperative CT review, UW exemplars exist)

| Variant | Operator | Parameters (ranges `from`) | Exemplars | Acceptance rule (pinned in tests) |
|---|---|---|---|---|
| `v.concha-bullosa` (lamellar / bulbous / extensive, `c.middle-turbinate-pneumatization`) | `pneumatize` MT | type, AP extent, width ratio | UW `Axial.PneumMT`, `Cor.pneumMT` | the cell's air is enclosed by MT bone; middle meatus width at the infundibulum's level decreases monotonically with width |
| `v.paradoxical-middle-turbinate` | `deform` MT | curvature | UW `Paradox.MT.curve` | MT convexity faces lateral; meatus width reported |
| `v.septal-deviation`, `v.septal-spur` (`c.mladina-septal` types) | `deform` septum (N1's centring, inverted and parameterized) | type, apex A/S, amplitude | UW `Cor.SeptDeviatnSpur` | septum keeps its thickness; the convex side's airway narrows; septal chart recomputed; scope collision blocks where it should |
| `v.infraorbital-ethmoid-cell` | `grow_cell` on the medial orbital floor | size ratio, AP position | UW `Axial/Cor/Sag.hallercell` | the cell lies below the orbit, lateral to the infundibulum; the infundibulum's minimum cross-section decreases with size |
| `v.uncinate-insertion-*` (`c.uncinate-superior-attachment` 1/5/6) | re-attach the uncinate's superior end (needs RS uncinate) | attachment | UW `Cor.VariantFSDP1/2` | the frontal drainage pathway reaches the infundibulum (5, 6) or the middle meatus (1) — the diorama's rule, now on the specimen |
| `v.maxillary-sinus-septa` | `plate` | position, height | UW `Cor.Maxseptum` | a plate divides but does not seal the sinus unless asked |
| `v.maxillary-sinus-hypoplasia` (`c.maxillary-sinus-hypoplasia`) | `deflate` | type, volume ratio | UW `Axial.Maxhypo`, `Cor.OMU4` | orbital floor lowers, uncinate lateralizes by type |
| `v.frontal-sinus-aplasia`, frontal hypoplasia **(new)** | `deflate` | volume ratio | UW `Axial.FShypo` | the recess persists; ostium position |
| `v.crista-galli-pneumatization` | `pneumatize` | extent, connection to the recess | UW `Cor.pneumCG` | — |
| `v.sphenoethmoidal-cell` (Onodi) | `grow_cell` superolateral to the sphenoid, to the optic canal | extent, optic contact | UW `Axial.BilatOnodicells1`, `Cor.Onodicell3` | optic canal bulges into the cell; optic SDF patched; `h.optic-nerve-injury-onodi` hatched |
| `v.pneumatized-anterior-clinoid` | `pneumatize` ACP | extent | UW `Cor.Onodicell3` | lateral OCR deepens (the sphenoid diorama's measure, on the specimen) |
| `v.lateral-recess-pneumatization`, pterygoid **(new)** | `pneumatize` greater wing / pterygoid | extent | UW `Axial/Cor.Pneumsphenoid1`, `axial.pneum.ptyp` | V2 / vidian protrude when present |
| bulla hyperpneumatization **(new)** | `grow_cell` (enlarge) | size ratio | UW `Cor.ethmoidbulla3`, `Cor.PneumFS` | hiatus narrows |

### 8.2 Batch 2 (Radiopaedia exemplars needed)

`v.keros-type-3`, `v.asymmetric-ethmoid-roof`, `v.gera-class-3` (`deform`
skull base; the ethmoid-roof diorama's rules on the specimen);
`v.aea-in-mesentery`, `v.anterior-ethmoidal-canal-dehiscence` (`reroute`,
`dehisce`); `v.lamina-papyracea-dehiscence`, `v.ica-dehiscence`,
`v.optic-canal-dehiscence`, `v.ica-protrusion`, `v.optic-canal-protrusion`,
`v.intersinus-septum-on-ica` (`dehisce`, `deform`, `plate`; scope HUD
distances must fall where bone is removed); the IFAC cells
(`v.supra-agger-cell` … `v.frontal-septal-cell`; `grow_cell`; the computed
frontal drainage pathway re-run on the specimen must reproduce the
diorama's push rules); `v.accessory-maxillary-ostium`;
`v.pneumatized-uncinate`; `v.conchal-sphenoid`, `v.presellar-sphenoid`,
`v.postsellar-sphenoid` (the sphenoid diorama's exposure measures on the
specimen); `v.v2-protrusion-sphenoid`, `v.vidian-canal-protrusion`.

### 8.3 Graph additions this plan needs (content WP C-RA, Sonnet drafts → Opus reviews, O3)

New variants: frontal sinus hypoplasia; extensive frontal pneumatization
(or a measurement on `s.frontal-sinus` — Opus decides; gaps.md recommended
against a variant); ethmoid bulla hyperpneumatization; pterygoid process
pneumatization. New condition or finding: septal perforation / absent
septum. New landmarks for the RA set: globe centres, optic canal openings
on both sides where missing, greater palatine foramina, PNS. Synonyms from
`gaps.md` still open. Every new prevalence carries its denominator.

---

## 9. Pathology catalogue

### 9.1 Batch 1 — inflammatory patterns (bone-window CT is the clinical study)

Sinus CT for inflammatory disease is a non-contrast bone-algorithm scan,
the same modality as the specimen, so these are representable honestly:

| Condition / preset | Operator | Parameters | Exemplars |
|---|---|---|---|
| mucosal thickening by sinus, scored by `c.lund-mackay` (0 / partial / total per sinus; OMC 0/2) | `fill` shell, inward along the air boundary | thickness per sinus, score preset | UW `Axial.Maxillarysinus`, `Cor.OMU5`, `Cor.Inflamm2` |
| `c.sinonasal-inflammatory-patterns`: infundibular, OMU, SER, sporadic (sinonasal polyposis in 9.2) | presets of the above, driven by drainage topology (RS openings) | pattern, side | UW `Cor.frontalinflamm2/3`, `Cor.OMU4`, `Sag.anteriorOMU`, `Sag.FSDP`, `Sag.ethmoidinflamm3`, `Sphenoidsinus1–3` |
| `dz.acute-rhinosinusitis`: air–fluid level, bubbly/foamy secretions | `fill` level with gravity (supine default), bubble option | fill fraction, scan position | UW `Axial.acutesinus1/2`, `Cor.foamysinus` |
| `dz.mucus-retention-cyst` | `fill` dome on a wall | base point, radius | UW `axial.MRCfrontal2`, `Cor.MRCfrontal1`, `Cor.MRCmax1`, `Sag.MRCmax3` |
| polyp in the maxillary sinus (CT mimic of MRC) | `fill` lobule | size | UW `Cor.Maxpolyp` |

Rule (pinned): a pattern's opacification follows drainage — an
infundibular preset opacifies the maxillary sinus and spares the frontal;
OMU adds the frontal and anterior ethmoid; SER the posterior ethmoid and
sphenoid. The rule is checked against the specimen's own drainage graph,
so a variant that changes drainage (a Haller cell, uncinate to the skull
base) changes what a pattern opacifies — the anatomy–disease link the
owner wants taught.

### 9.2 Batch 2 — lesions with bone signatures

`dz.mucocele` (frontal with orbital extension and globe displacement;
ethmoid; sphenoid into the posterior ethmoid — `fill` expansile + `deform`
walls and orbit; UW `Cor/Sag/axial.frontalmucocele`, `Mucocele1/3/5`);
`dz.osteoma` (`bone_mass`; UW `Osteoma2/3/4`, `Axial/Cor.ethmoidosteoma*`);
`dz.antrochoanal-polyp` (`fill` the sinus + a stalk through the ostium to
the choana; UW `AntrochoanalPolyp1`); `dz.fungal-ball` (hyperdense core,
punctate calcification, sclerotic wall), `dz.afrs` (expansile, double
density, thinned bone), `dz.crs-with-polyps` / sinonasal polyposis,
`dz.silent-sinus-syndrome` (with `v.maxillary-sinus-atelectasis`),
`dz.inverted-papilloma` (focal hyperostosis at the attachment — the
surgical teaching point), `dz.fibrous-dysplasia`, `dz.jna` (PPF widening,
SPF erosion) — Radiopaedia exemplars.

### 9.3 Batch 3 — soft-tissue and contrast findings (needs a synthetic channel)

Orbital and intracranial complications (`dz.orbital-cellulitis`,
`dz.subperiosteal-orbital-abscess`, `dz.cavernous-sinus-thrombosis`,
`dz.epidural-abscess`, …), aggressive sinusitis and AIFS beyond the bone
(retroantral fat), malignancy. The specimen is an 8-bit bone-window display:
soft tissue spans a handful of levels and there is no contrast. These need
a **synthetic soft-tissue channel** — a second volume generated from labels
(tissue class → HU distribution, enhancement as a parameter), shown in a
soft-tissue/contrast window and badged schematic. It is its own design
(WP SX0, Opus) and starts only after batches 1–2 work.

---

## 10. Work packages

Format: `docs/delegation.md` §2. Lanes: **P** pipeline/data, **V** viewer,
**C** content, **O** owner. Every Sonnet WP's anatomy is already data
(written by Opus in the WP or an earlier Opus WP).

### Wave RA-0 — scoping, credit (now)

```
### RA0a — This plan                         [done 2026-10-07] · Opus
### RA0b — Credit without names; permission recorded   [done 2026-10-07] · Opus
Names removed from ssb/LICENSE-data.md, ssb/reference/uw-sinusanatomy2/README.md,
docs/ssb.md, ssb/content/sources.json (src.uw-ct-sinus-atlas now cites the
department as corporate author). Git history before 2026-10-07 still contains
them (see §13 RA-O7).
```

```
### RA0c — UW credit on the page             [done 2026-10-09, #143] · Sonnet · depends: #114, #115 merged (same files)
Goal:     the full attribution of ssb/LICENSE-data.md is visible wherever the specimen is
          shown (today the note says only "UW CT atlas").
Read:     ssb/LICENSE-data.md "Attribution"; docs/ssb.md §7.5; js/ssb/mode-specimen.js PROVENANCE.
Touch:    js/ssb/mode-specimen.js (PROVENANCE), ssb.html (static fallback text and a credit
          link in the panel footer), css/ssb.css if a class is needed, tools/test-ssb.mjs,
          stamps (tools/stamp-assets.mjs).
Don't:    name any individual author; add an external request (the link is an <a href>).
Steps:    1. PROVENANCE → "Reference specimen · from Interactive CT Sinus Anatomy, Univ. of
             Washington Radiology · draft". 2. A "Credits" line at the panel foot with the
             exact attribution and a link to http://uwmsk.org/sinusanatomy2/ (rel="noopener").
          3. Test: the credit text is present in Specimen, CT and Scope stages.
Accept:   check-data, smoke-pages, test-ssb pass; the test of step 3 passes.
Escalate: the text does not fit at phone width without truncating the institution's name.
Result:   PROVENANCE and the static note name the atlas and institution; on a phone the note wraps
          rather than truncating. A `#ssb-credit` line at the foot of the Details panel carries the
          full attribution and link (on a phone it shows in the closed sheet in CT, which hides the
          stage note). test-ssb `credit:` checks cover Specimen, Scope and CT at desktop and phone width.
```

```
### RA0d — Name guard in check-data          [todo] · Sonnet · depends: —
Goal:     check-data fails if an atlas author's name or e-mail local part appears in any
          tracked text file, without the names being in the repo.
Touch:    tools/check-data.mjs; docs/security.md (rule line).
Steps:    store SHA-256 of lower-case tokens (surnames, full-name bigrams, e-mail local parts —
          the owner supplies them out of band, Opus hashes them); tokenize tracked text files
          (git ls-files), hash each token and adjacent bigram, fail on a match with the file and
          line, printing no name. Bigram-only for any common surname, to avoid false positives
          on unrelated authors.
Accept:   check-data passes on master; a scratch file containing one name fails it (not committed).
Escalate: runtime > 2 s on the repo.
```

### Wave RA-1 — inventories and the state machinery (parallel)

```
### POP0 — NasalSeg population statistics     [done 2026-10-07] · Opus
tools/ssb-pipeline/nasalseg/stats.py (+ review.json) → ssb/anatomy/population/nasalseg.json;
findings in §4.4 (107 distinct scans of 130 ids; asymmetry distributions; head A's cavity outlier).
Follow-up for RS: explain head A's left-cavity volume (§4.4) before RA3b.
```

```
### FG1 — UW figure inventory (figures.json) [done 2026-10-09, #151; CP-RA1] · Sonnet (mechanics) + Opus (ids, roles) · depends: —
Goal:     every UW page figure as data: page, file, plane, window, contrast, caption,
          abbreviation map, arrows (tail label → tip px), graph ids, role N/V/P, same-patient group.
Read:     this file §4.1, §5; ssb/reference/uw-sinusanatomy2/README.md "Per-slice extraction";
          tools/ssb-pipeline/uw/extract.py, relate.py (OCR and arrow method to reuse).
Touch:    tools/ssb-pipeline/uw/figures.py (new; fetch.py already downloads the pages);
          ssb/reference/uw-sinusanatomy2/figures.json; that README (a section).
Don't:    commit any image; guess an id (unmapped stays null for Opus).
Steps:    1. Annotation mask: pixels ≥ 250 in thin components (verify per image that bone stays
             below that; list the exceptions). No unlabeled twin exists, so arrows are traced on
             the mask alone. 2. OCR abbreviations; map via the caption's own expansion.
          3. Arrow tips (skeleton end away from text; arrowheads and asterisks as point marks).
          4. Window/contrast class from the histogram and the caption ("post-contrast",
             "soft tissue window"). 5. Same-patient grouping: candidate groups from file names,
             confirmed by Opus comparing anatomy across planes.
Accept:   figures.json validates (a schema check added to check-data or a pipeline self-test);
          every figure has plane, window, ≥ 1 graph id or an explicit null with reason; Opus
          spot-check of 15 figures' tips (checkpoint item).
Escalate: annotation and bone overlap in > 10 % of the bone-window figures.
Ruling:   (Opus, 2026-10-09, after the first run measured 15 of 89 figures with saturated
          bone/contrast at the annotation value) the soft-tissue and post-contrast figures
          are recorded in full (plane, window, contrast, caption, abbreviation map, ids,
          role, group) with `arrows: null` and the reason "annotation not separable by
          threshold (saturated window)"; tips are traced on the bone-window figures only,
          each figure's thin-component mask checked (not a sample). `figures.py` unescapes
          HTML entities in `src` (`Sag.OMU&amp;Sps.jpg`). The rapidocr pin in requirements.txt
          is updated to the version that installs, with the version recorded in the README.
Result:   (Sonnet, 2026-10-09) figures.py + figures.json + schema check in check-data; PR open, spot-check list and the
          measured limits are in the PR. The ≥ 250 thin-component mask alone does not isolate the annotation (resampled JPEGs
          fragment strokes; cortex clips at 255 in bone windows too), so arrows are told from cortex by shape: see the README.
```

```
### RS0 — Ground-truth split and scorer      [done 2026-10-09, #142] · Sonnet · depends: —
Goal:     the held-out arrow-tip split and a scorer any labels file can be run against (§7.1).
Touch:    tools/ssb-pipeline/uw/score.py (new); ssb/reference/uw-sinusanatomy2/split.json.
Steps:    stratified 70/30 split of head-A tips by crosswalked id and slice region, seed fixed;
          scorer prints per-structure hit rate with Wilson CI and the topology checks of §7.1.
Accept:   scorer runs on today's labels and prints the baseline (it becomes the number RS must beat).
Result:   `python3 -I tools/ssb-pipeline/uw/score.py` prints the baseline (as-scanned labels are the headline; the tips live in that frame). Caveats are in its docstring.
```

```
### RA3a — Anatomy state, patch format, loader   [done 2026-10-09, #147] · Sonnet · depends: #115 merged (state.js)
Goal:     state.anatomy, the #anat/#v/#dz whitelist, volume.js applyPatch, override-node
          loading — with no real patches yet (test patches built in the test).
Read:     this file §2, §6.2–6.4; docs/ssb.md §5.6, §7.3; js/ssb/state.js, volume.js,
          geo-specimen.js.
Touch:    js/ssb/state.js, volume.js, geo-specimen.js, mode-specimen.js, mode-ct.js,
          ui-specimen.js (the Anatomy pills; Variants/Pathology disabled until index.json lists
          entries), ssb.html, css/ssb.css, tools/test-ssb.mjs (--only anatomy), stamps.
Don't:    change ssb/ct, ssb/models; let anything from the URL reach markup.
Accept:   test-ssb --only anatomy: a synthetic patch changes exactly its box in CT and labels;
          an invalid header (box outside, unknown label, bad dims) is refused; an unknown id,
          preset or incompatible pair drops the anatomy key and the hash is rewritten canonical;
          override nodes hide base nodes and restore them on clear.
Result:   `node tools/test-ssb.mjs --only anatomy` pins all of it on synthetic patches built in the test; the
          format and URL are in `docs/ssb.md` §5.11 and §7.3. Open for the checkpoint: the volume.js patch entry points are
          `parseAnatomyPatch`/`applyAnatomyPatch` (`applyPatch` is the dissection patch's), the index.json shape is `ssb.md` §5.11,
          and a non-standard base resolves its label table inside its own root (`ssb/anatomy/<base>/geometry/`).
```

```
### RA3b — The scanned base                  [done 2026-10-09, #152] · Sonnet · depends: RA3a
Goal:     head A as scanned, served as ssb/anatomy/scanned/, built by the same stages minus
          the mirror; both sides computed where stage D assumed symmetry.
Read:     docs/ssb.md §5.1, §5.3, §5.7; normalize.py docstring; softtissue.py, lining.py.
Touch:    tools/ssb-pipeline/uw/normalize.py (a --base scanned path that skips steps 2–5 and
          the sides step), softtissue.py (per-side floor chart), lining.py, meshes.py, sdf.py
          output dirs; ssb/anatomy/scanned/**, ssb/anatomy/index.json.
Don't:    hand-edit outputs; change the standard base's files.
Accept:   check-data passes (every label a graph id); test-ssb specimen section runs on both
          bases (placement, picking, laterality); the scanned base's left cavity and inferior
          turbinate volumes are printed beside the right's and match §3's figures ± 5 %; its
          cavity and maxillary asymmetry indices are printed beside the NasalSeg percentiles
          (§4.4), and the state's note says where this head sits in that range.
Escalate: a stage cannot run per side without an anatomy decision.
Ruling:   (Opus, 2026-10-09, on the first run's four gates) no gate is relaxed for the scanned
          base. (1) Vestibule: keep each side's largest component; smaller components go back
          to s.nasal-cavity, their voxel count printed, and the stage still fails if they total
          more than 2 % of the largest (a leak, not a speck). (2)–(4) A stage-D product (floor
          or septal chart, floor mucosa, soft sweep) that fails its gate on a side is left out
          of the scanned base, never loosened, and listed in its index.json entry as
          `absent: [{ id, side, reason }]` with the measured number. The flap overlay stays a
          standard-head tool: on a base whose charts are absent it is disabled with a note.
          The nasopalatine waypoints stay authored on the standard head; per-base waypoints
          are RS work. The left floor goes to the resegmentation (§5.1). Touch adds
          tools/test-ssb.mjs (the specimen section on both bases, and a plain visit still on
          `standard`) and js/ssb/ui-specimen.js (the state's note; the flap control disabled
          when charts are absent); walls.py runs unmodified. Default base: resolveAnatomy uses
          the index's default base only when a link names a variant or condition, so a plain
          visit stays on the standard head; keep that, and test it.
Ruling 2: (Opus, 2026-10-09, on draft #152) (1) The Specimen stage draws the base's own packs:
          Touch adds js/ssb/geo-specimen.js and js/ssb/mode-specimen.js, which load
          `<baseRoot(base)>/models/packs.json` when state.anatomy.base is not `standard`;
          test-ssb runs the specimen section (placement, picking, laterality on screen) on
          the scanned base too. "Normal asymmetry" must never draw the mirrored head.
          (2) The ±5 % check against §3 is replaced by exact accounting: the pipeline prints
          a label transition table (as-scanned label -> scanned-base label, voxel counts) and
          attributes every changed class to a named step (vestibule split, valve, nose
          unmask, wall units). Tissue voxels that became an air label, or the reverse, are
          an escalation with their counts; the turbinate's loss against the as-scanned
          labels is explained by that table, not tolerated. (3) The state's note states
          hypotheses as hypotheses ("may", "consistent with"), names cavity+vestibule as
          the comparison closest to NasalSeg's nasal cavity, and says the comparison is not
          like for like: NasalSeg labels CT at its HU threshold, this head's labels sit on
          display levels of a screen capture (ssb/LICENSE-data.md).
```

```
### RP1 — Radiopaedia shortlist (cases.json) [done 2026-10-09, #149; pick at CP-RA1] · Sonnet (search, records) → Opus (choice) · depends: — (RA-O4, RA-O5 decided)
Goal:     ≥ 1 candidate case per §4.3 queue item, each fully recorded; Opus picks ≤ 40.
Touch:    ssb/reference/radiopaedia/cases.json, README.md (method, licence).
Don't:    download stacks in this WP (RP2 does); record a case whose licence line differs
          from CC BY-NC-SA 3.0 without flagging it.
Accept:   every record complete (§4.3 item 4); every queue item has a case or "none found".
Ruling:   (Opus, 2026-10-09) radiopaedia.org serves an anti-bot challenge to non-browser
          clients ("unsanctioned scraping by bots"). No agent works around it: no scripted
          browser, no header spoofing, no curl of case pages. Records are built from search
          results only (rID, URL, title, contributor, tags, the snippet's own words). Every
          field only the case page shows (licence line, planes, series, slice counts,
          contrast, complete vs key images, burned-in text) is the string "owner reads",
          never inferred. The shortlist is ranked so the owner reads at most 40 pages. RA-O5
          is reopened (§13), and RP2 waits on it.
Result:   (2026-10-09) 47 search-result records in ssb/reference/radiopaedia/cases.json; 7 queue groups
          "none found" with their queries; all page-only fields "owner reads".
```

```
### C-RA — Graph additions                  [done 2026-10-09, #146] · Sonnet drafts → Opus reviews (O3) · depends: — (after #114 merges: sources.json)
Goal:     the ids and landmarks of §8.3 with sources and prevalences (denominators).
Ruling:   (Opus, 2026-10-09) frontal sinus hypoplasia/aplasia is a variant node; extensive
          frontal pneumatization is NOT a variant: it is a measurement on s.frontal-sinus
          (as gaps.md recommends), with the extent definition and any cut-off quoted from
          its source. A prevalence or cut-off that no source states is left out, not
          estimated; ids follow docs/authoring-ssb.md; everything stays review: "draft".
Accept:   tools/ssb-content.mjs passes; Opus review at CP-RA1.
Result:   (2026-10-09) drafted: `v.ethmoid-bulla-hyperpneumatization`, `v.pterygoid-process-pneumatization`, `m.frontal-sinus-volume`, `dz.septal-perforation`, `s.globe` + `lm.globe-center`, `lm.posterior-nasal-spine`; prevalences added to `v.frontal-sinus-aplasia` and `v.lateral-recess-pneumatization`; six sources. Open items are listed in the PR.
```

**Checkpoint CP-RA1 (Opus):** FG1, RS0, RA3a, RA3b, RP1, C-RA. §12 checklist.

**CP-RA1 held 2026-10-09 (Opus).** Outcomes; the numbers live in the files named.

- **FG1 tips.** Spot-check of the 15 figures FG1 proposed, plus 3 more chosen afterwards to test the rule
  below, on overlays (`figures.py overlay`). Every false positive (5 in the sample, 3 of 3 out of
  sample) had its tip or tail within a few pixels of the image edge, a frame or cortex line; FG1's
  `suspect` flag caught none of them and flagged four true tips. `figures.py` now drops arrows within
  `BORDER_PX` of the edge (`nonAnnotation.atBorder`). After it, every detected tip in the sample
  was correct, but recall is about two thirds (thick or bone-adjacent arrows are missed;
  `captionCueMissing` lists them). **Use:** FG1 tips are pointers for exemplar alignment and figure
  captions, never ground truth for scoring (RS scores against `split.json`). The 8 null ids are
  filled in `figures.py`'s table (C-RA's new ids where they fit); `Axial.sphenoidhypo` keeps
  conchal vs presellar as candidates, since one axial slice cannot place the air against the sella.
- **RP1 pick.** 38 of 47 in `ssb/reference/radiopaedia/cases.json` (`_meta.pick`, with each drop's
  reason). The owner reads the picked pages (the "owner reads" fields) and may veto; RP2 waits on
  RA-O5.
- **C-RA.** Merged as draft after one unsourced imaging sentence was removed. Open, listed in #146:
  pterygoid pneumatization and hyperpneumatized-bulla prevalences, a numeric cut-off for extensive
  frontal pneumatization. `dz.septal-perforation` sits under `traumatic` for want of an
  etiology-neutral category; the owner may move it.
- **RA3a/RA3b.** Loader and scanned base merged. Added at review: the credit and base checks, and the
  rule that the endoscope and procedures never ride a non-standard base (they read the standard
  head; the later choice wins). The scanned head's cavity asymmetry is beyond every clear NasalSeg
  subject on a measure that is not like for like (§6, the state's note); RS settles whether that
  is anatomy or labelling.
- **§12.2 checklist.** Provenance: no UW author names; Radiopaedia derived data waits on RA-O5.
  Circularity: RS0's seed/held-out split is disjoint by construction; the baseline is a
  resubstitution score (§7.1). Anatomy: `scanned` viewed in 3D (front view asymmetric), CT and
  scope; laterality held. Determinism: `normalize.py --base scanned` and `figures.py build` rerun
  byte-identical apart from intended changes. Not applicable yet: spectrum, drainage, proximity
  (no variant or pathology patch exists).
- **Next (RA-2):** the RS1–RS6 specs (Opus), then RS1. FG2 and RA4 wait on RS.

### Wave RA-2 — resegmentation and alignment

```
### RS1–RS6 — Resegment head A                [RS1, RS2 ready; RS3–RS6 specified after RS2] · Opus + Sonnet
RS1 native-grid working volume · RS2 lamella sheets and identity (§7.2.2) · RS3 ethmoid cell
instances + shared rule set (§7.2.3) · RS4 openings and channels (§7.2.4, with the consumer list)
· RS5 canals as labels, sweeps from detected centrelines (§7.2.5) · RS6 added bone units and
the RA landmark set (§7.2.6, §6.1). The served head is rebuilt once, at the end (RS6, CP-RA2):
until then every RS output is a candidate under the gitignored incoming/_rs/, scored by
score.py --labels, and nothing in ssb/ct, ssb/geometry, ssb/models or ssb/anatomy changes.
Accept (whole RS): score.py held-out identity ≥ 95 % overall and ≥ 90 % per structure with ≥ 10
          tips, over RS's declared label set (§7.1 "Baseline"), and full coverage of that set;
          boundary review ≥ 90 % correct on the review slices; topology checks pass; relate3d
          contradictions not increased; diorama IFAC rules hold on the specimen's cells;
          test-ssb passes on both rebuilt bases (thresholds unchanged, or each change argued
          at CP-RA2).
Escalate: any cell the rules cannot classify that an expert would name; any wall the boundary
          review marks missing that the sheet filter cannot recover (→ owner: hand correction
          in 3D Slicer is the documented fallback, docs/ssb-roadmap.md §2).
```

```
### RS1 — Native-grid working volume and the honest baseline   [done 2026-10-09, #156; its Escalate (the left lateral sphenoid recess) is ruled in RS2] · Sonnet · depends: RS0, CP-RA1
Goal:     a resegmentation harness that rebuilds today's air labels on the native grid from
          SEED tips only, exports a candidate the scorer reads, and records the honest
          baseline and the declared label set every later RS step is scored against.
Read:     §7.1 (incl. "Baseline"), §7.2.1; specimen.py (steps 1-4) and its docstring;
          score.py docstring; split.json; tools/ssb-pipeline/README.md stage B.
Touch:    tools/ssb-pipeline/uw/reseg.py (new; stages `work`, `air`, `export`, `score`);
          tools/ssb-pipeline/uw/rs/declared.json (new); score.py only to accept --labels on a
          candidate dir and to report coverage of declared.json; tools/ssb-pipeline/README.md;
          this WP's status line.
Don't:    read held-out tips anywhere in reseg.py (assert it: the split's held-out set is
          never loaded); change specimen.py, the served files, or split.json; hand-place a seed.
Steps:    1. `work`: specimen-native.npz -> the working volume in RAS at native spacing
             (0.3437 x 0.3437 x 0.625 mm), plus the face/hull masks of specimen.py steps 2-3,
             cached under incoming/_rs/work.npz.
          2. `air`: specimen.py's marker watershed and cuts (choanae, frontal ostium,
             intersinus septum, the basal-lamella PROXY) on the working volume, seeded from
             split.json's seed tips only; the proxy stays until RS2 replaces it, named as such.
          3. `export`: resample to the served 0.5 mm grid (label = the native label covering
             most of the output voxel, ties to the lower index) into incoming/_rs/candidate/,
             laid out like ssb/ct + ssb/geometry/labels.json, so score.py --labels reads it.
          4. declared.json: the ids RS commits to label, each with the RS step that adds it:
             RS1 the current air compartments; RS2 s.uncinate-process, s.basal-lamella (its
             -vertical and -horizontal parts where the graph splits it), s.bullar-lamella, and
             the superior turbinate's ground lamella as s.ethmoid-ground-lamellae (no own id;
             a new one is content work, never invented here);
             RS3 the ethmoid cell instances; RS4 the openings and channels of §7.2.4; RS5 the
             canals of §7.2.5; RS6 the bone units of §7.2.6. Ids not in the graph are listed
             with "id": null and the term, for Opus.
          5. `score`: score.py on the candidate at --tol 1 and --tol 6, coverage over the
             declared ids whose step is done, topology checks; written to
             incoming/_rs/score-RS1.json and quoted in the PR beside today's (resubstitution)
             baseline.
Accept:   reseg.py runs end to end from a clean incoming/ (after fetch.py and specimen.py's
          inputs) and reruns byte-identical; the held-out guard is tested (feeding it a
          held-out tip raises); the candidate scores within the CI of today's labels at
          --tol 6 for every labelled structure with n >= 10, or the PR explains each
          difference; check-data passes; no served file changes (git diff).
Escalate: the seed-only rebuild loses a compartment outright (a structure whose only tips
          were held out); the native grid and the served grid disagree on laterality or frame.
```

```
### RS2 — Lamella sheets and their identity      [review 2026-10-09; Escalate fired: the septum and the ethmoid lamellae are unassigned, see the PR] · Sonnet (filter, plumbing) + Opus (rules review) · depends: RS1
Goal:     the uncinate process, basal lamella, bullar lamella and the superior turbinate's
          ground lamella (s.ethmoid-ground-lamellae) as labelled sheets on the native grid,
          found by a sheetness filter
          and named by attachment rules held as data; the basal lamella replaces the proxy.
Read:     §7.2.2; FG1's figures.json entries Axial.ethmoid2, Cor.basallamella,
          Sag.basallamella2 (their tips are pointers, CP-RA1); walls.py (the wall units the
          rules attach to); the graph entries of the four lamellae and their `partOf`/`attachesTo`
          edges.
Touch:    reseg.py (`sheets` stage); tools/ssb-pipeline/uw/rs/sheets.json (new: the rules);
          declared.json status; README; this WP's status line.
Don't:    tune a rule to the held-out tips; draw or paint a sheet; change served files.
Steps:    1. Sheetness: multiscale Hessian on the working volume's bone (sigma 0.35, 0.5,
             0.75 mm; bright plates: one large negative eigenvalue, two small), hysteresis
             thresholded, thinned to a 1-voxel medial surface, split into components.
          2. Rules (sheets.json, one object per lamella, every number a named parameter):
             - uncinate: attaches anteriorly to the lateral nasal wall unit (frontal process of
               maxilla / lacrimal) or the agger nasi cell wall; has a free posterior-superior
               edge facing air; lies medial to the maxillary ostium and lateral to the middle
               turbinate; its free edge bounds the hiatus semilunaris.
             - basal lamella: continuous from the lamina papyracea laterally to the skull base
               superiorly and the middle turbinate medially; separates anterior from posterior
               ethmoid air (every air path between their seed tips crosses it).
             - bullar lamella: the posterior wall of the bulla's air, between bulla and
               retrobullar recess, reaching the lamina papyracea.
             - superior turbinate ground lamella: posterior to the basal lamella, from the
               superior turbinate to the lamina papyracea / skull base.
             A component is named only if exactly one candidate per side meets every rule;
             otherwise the lamella is unassigned with the per-rule scores written out.
          3. The basal lamella's side splits anterior from posterior ethmoid air (replacing
             the proxy plane); the uncinate's free edge and the bulla's face bound the hiatus
             air (input to RS4).
          4. Review sheet: for each lamella and side, PNGs of the sheet over the working
             volume in three planes through its centroid, and over the matching UW figure
             slice (head A is those stacks), written to incoming/_rs/review/ for the CP.
Accept:   each named lamella is one component per side; the basal lamella separates the
          anterior and posterior ethmoid seeds' air (no 6-connected path between them avoids
          it); score.py (candidate) for s.anterior-ethmoid-cells and s.posterior-ethmoid-cells
          does not fall at --tol 6 against RS1's; the topology check for those two air labels
          (single component) is reported before and after; the review sheet exists; reruns
          byte-identical; no served file changes.
Escalate: a lamella with no unique candidate on a side (report the per-rule scores, do not
          relax a rule); a dehiscent or fenestrated lamella that would need a call on where
          the wall "is"; a rule that needs an anatomical parameter not stated in sheets.json.
Ruling:   (Opus, 2026-10-09, from RS1 #156) the seed-only rebuild gives the left lateral
          sphenoid recess to the posterior ethmoid (its only tips were held out) and, with no
          complete septum found, splits the sphenoid front/back instead of left/right. RS2 adds
          two sheets, by the same rules-as-data method, before the lamellae above:
          - sphenoid face: the anterior wall of the sphenoid body (the sphenoethmoidal
            junction), from the skull base to the choana's roof; air posterior to it and
            within the sphenoid body, reached through the sinus, is sphenoid, so the lateral
            recess and the pterygoid recesses join the sphenoid without a seed in them. A
            posterior ethmoid cell that crosses it superolaterally (an Onodi cell) is not
            decided here: report it for RS3.
          - intersinus septum: the dominant sagittally oriented sheet inside the sphenoid
            body, attached to the sphenoid face and the posterior wall (or the sella floor),
            often off the midline or deviated. It, not a watershed, splits the sphenoid into
            .R and .L; where it is incomplete, the split follows its surface extended along
            its own fit, and the PR says how much was extended.
          Accept adds: the left sphenoid's tips at --tol 6 back to today's count or better; the
          sphenoid .L label is on the patient's left (Dice with today's .L reported); no
          posterior ethmoid air posterior to the sphenoid face. Ids: s.sphenoid-face and
          s.intersinus-septum (both in the graph); an accessory septum is
          s.accessory-sphenoid-septum. RS1's two null ids (posterior ethmoidal canal,
          nasolacrimal canal) are content work before RS5, not RS2's.
Ruling 2: (Opus, 2026-10-09, on #158) RS2 is split. RS2a = the filter, the sphenoid face and the
          intersinus septum, export and score: it is #158, merged once (1) and (2) below are in.
          (1) Septum rule form: a septum faces bone only where it inserts, so
              `sphenoid_air_on_both_faces` is measured over the sheet's interior (voxels farther
              than 1.5 mm from where it meets another wall), threshold unchanged at 0.5. It is a
              change of form, argued from anatomy; lowering the threshold after seeing 0.49 would
              be tuning and is not allowed. If the septum still fails, .L stays RS1's split and
              the PR says so.
          (2) declared.json follows the graph: s.basal-lamella-vertical is the anterior,
              near-coronal part; s.basal-lamella-horizontal the posterior, near-axial part.
          The face's ≤ 3 mm gap fill (ostium, seams) stands, recorded as a wall-position call.
          The 1,100-line size is accepted for #158 (candidate-only code); later RS WPs keep the
          800-line stop.
```

```
### RS2b — Ethmoid lamellae                    [ready after RS2a] · Sonnet · depends: RS2a
Goal:     name the middle turbinate's vertical lamella, the basal lamella, the uncinate and the
          bullar lamella (R) with the RS2 method, and split anterior from posterior ethmoid at the
          basal lamella instead of the proxy.
Read:     RS2's WP text and both rulings; #158's body (per-rule failures, review PNGs).
Touch:    reseg.py, rs/sheets.json, declared.json status, README, this WP's status line.
Don't:    change a threshold after seeing its score; read held-out tips; change served files.
Steps:    1. Middle turbinate vertical lamella (s.middle-turbinate, the graph's id): a sagittal
             sheet medial to the ethmoid air and lateral to the olfactory cleft, reaching the
             cribriform plate / skull base superiorly, with a free inferior edge in nasal-cavity
             air. Named first; it replaces "ridge near the MT seeds" as the basal lamella's medial
             target (touch within the existing reach).
          2. Uncinate: candidates that pass every rule and lie within the assembly tolerance of
             each other (gap and angle as the face's, named parameters) are fragments of one
             sheet and are assembled before the uniqueness test; two that are not are still a tie
             and are escalated.
          3. Bullar lamella: R only. L waits for RS3 (the bulla is a cell; RS1 has no .L bulla air
             without held-out tips).
          4. Basal split as RS2 step 3, now on a named sheet; vertical/horizontal parts per the
             graph (Ruling 2).
Accept:   as RS2's, for these sheets; plus each sheet's rule-set history disclosed as in #158.
Escalate: as RS2's; also when the MT lamella cannot be named (then RS2b stops: the basal
          lamella has nothing to attach to).
```

```
### FG2 — Figure poses in head A's frame      [todo] · Sonnet (search) + Opus (landmarks, review) · depends: FG1, RS6
Goal:     a plane pose and TPS for every N and V figure (P figures where bone-window), written
          to ssb/anatomy/sources.json; observations to observations.json.
Steps:    constrained plane search (tilt ≤ 20°, scale 0.25–0.6 mm/px) on air-mask Dice of large
          structures + bone-edge NCC, disease regions masked; multi-start; record residual and the
          best/second-best margin; Opus places ≥ 5 RA landmarks per figure where automatic
          matching is ambiguous (decoded by eye, as for the atlas OCR).
Accept:   N figures: median landmark residual after TPS ≤ 3 mm, none > 6 mm; every pose has a
          margin; a figure that fails is graded C and kept as a 2D exemplar only.
```

```
### RA4 — Exemplars layer in CT mode          [todo] · Sonnet · depends: FG2, RA3a
Goal:     §6.1's overlay: observations near the slice as markers; nearby exemplars listed with
          caption, credit and the figure itself (RA-O1), served from ssb/reference/uw-sinusanatomy2/figures/.
Accept:   test-ssb --only ct: markers project to within 0.5 px of their RAS position; the list
          changes with the slice; no remote request is made by the page.
```

**Checkpoint CP-RA2 (Opus + owner):** resegmentation review sheets (owner
looks at the uncinate, basal lamella and frontal cells); figure poses.

### Wave RA-3 — variants batch 1, pathology batch 1

```
### OP1 — Edit operators and texture         [todo] · Opus (invariants, specs) → Sonnet (code) · depends: RS (all)
Goal:     ops.py (§6.5) with self-tests; PSF and noise measured on head A and printed.
Accept:   each operator's invariants tested on synthetic volumes; texture metrics of edited
          voxels within ± 15 % of head A's (edge width, σ per tissue); blinded crop test at
          CP-RA3 (Opus/owner cannot pick edited crops above chance on 20 pairs).
```

```
### VB1 — Variants batch 1                    [todo] · Opus (parameters from exemplars; rules) → Sonnet (builds, tests) · depends: OP1, FG2, C-RA
Goal:     §8.1 as patches on standard and scanned, three presets each, with override packs,
          index.json entries, compat pairs.
Accept:   each row's acceptance rule pinned in test-ssb (--only variants); every patch's header
          names calibratedOn and assumed; budgets of §6.6.
```

```
### PB1 — Pathology batch 1                   [todo] · Opus (patterns, HU targets) → Sonnet · depends: OP1, RS4
Goal:     §9.1 as patches; Lund–Mackay and pattern presets; the drainage-follows-anatomy rule.
Accept:   test-ssb --only pathology: each pattern opacifies exactly the sinuses its drainage
          reaches, on standard, on scanned, and over each batch-1 variant that changes drainage.
```

```
### RA5 — Variant and pathology pickers        [todo] · Sonnet · depends: RA3a, VB1/PB1 (first entries)
Goal:     the pickers of §6.4, panels (prevalence with unit, exemplars, stations affected),
          truth badges per §2.2.
Accept:   test-ssb: every index.json entry reachable from the picker and the URL; the badge text
          names the edit and its exemplars; tier filtering works.
```

**Checkpoint CP-RA3 (Opus + owner):** realism (blinded crops), each
variant's look on CT and in 3D against its exemplar; owner sets `verified`
where right.

### Wave RA-4 — batch 2, Radiopaedia volumes, head B

```
RP2  fetch (agent, one case at a time, RA-O5) and record the chosen cases, grade A/B/C · Sonnet
RP3  stack → volume, pose, observations, population entries · Sonnet + Opus review
RB1  head B: coronal stack → volume (spacing estimation), labels from its tips, scanned-b base · Opus + Sonnet
VB2  variants batch 2 (§8.2) · Opus → Sonnet
PB2  pathology batch 2 (§9.2) · Opus → Sonnet
POP1 population.json + the asymmetry panel (paired L−R, n, sources; NasalSeg from POP0) · Sonnet
```

**Checkpoint CP-RA4.**

### Wave RA-5 — integration

```
SC1  scenarios (named combinations, §6.3) · Opus picks, Sonnet builds
ST-RA  stations re-validated and re-posed per base and scenario (after E6) · Opus
T-RA  self-test items from states: "name the variant", "which sinuses does this pattern opacify,
      and why", "what does this change at the table" (feeds T1) · Sonnet
SX0  synthetic soft-tissue channel design (§9.3) · Opus; SX1 build · Sonnet
```

---

## 11. Execution

**Order and lanes.**

```
RA-0  ── RA0c (after #114/#115) ── RA0d
RA-1  P: FG1, RS0, POP0, RP1   V: RA3a → RA3b   C: C-RA   O: RA-O7, RA-O8
        └──────────── CP-RA1 ────────────┘
RA-2  P: RS1 → RS6 (critical path), FG2   V: RA4
        └──────────── CP-RA2 ────────────┘
RA-3  OP1 → VB1 ∥ PB1 → RA5
        └──────────── CP-RA3 ────────────┘
RA-4  RP2 → RP3, RB1, VB2, PB2, POP1 → CP-RA4
RA-5  SC1, ST-RA, T-RA, SX0/SX1
```

- **Critical path**: RS (resegmentation) → OP1 → VB1/PB1. RA3a/RA3b and FG1
  run beside it, so the `scanned` state can ship before any edit exists:
  *Normal asymmetry* is the first new state the owner sees.
- **Conflicts with work in flight**: RA3a waits for #115 (`state.js`); C-RA
  and RA0c wait for #114 (`sources.json`, stamps). The resegmentation
  rebuilds every specimen output, so it is scheduled at a quiet point of
  lane B (after ST6 → ST4d → ST5 merge, or those rerun on the new labels in
  the same checkpoint); test thresholds tuned on the old labels (E5 poses,
  the septum rule) are re-checked at CP-RA2 rather than silently moved.
- **Re-export discipline**: bases and patches are regenerated at
  checkpoints only (§6.6), deterministic (gzip mtime 0), never hand-edited.
- **Docs**: when the owner accepts the plan, its WPs move into
  `docs/ssb-roadmap.md` §5 and its design sections into `docs/ssb.md`
  (§1.2 truth kinds, a new §5.8 "Anatomy states", §7.3 URL keys); this file
  then keeps only §4–§5 (sources and limits) and §13 history, or is
  deleted per "prefer deleting to keeping".

---

## 12. Review plan

### 12.1 Automatic (every PR)

`node tools/check-data.mjs` (graph ids in every label table and patch;
licence ledger: every file under `ssb/anatomy/` and `ssb/exemplars/` maps
to a licence entry; the name guard of RA0d) · `node tools/smoke-pages.mjs`
· `node tools/test-ssb.mjs` with new sections `--only anatomy`, `--only
variants`, `--only pathology` · pipeline self-tests (`ops.py --selftest`,
`score.py`). Thresholds are set in the WP that introduces them and change
only at a checkpoint with the reason written down.

### 12.2 Checkpoint checklist (Opus, each CP-RA)

1. **Provenance.** Each new file traces to a source in `sources.json` with
   licence, attribution and (for UW) no individual names.
2. **Circularity.** Seeds and held-out tips disjoint; no variant validated
   only on its calibration exemplar.
3. **Spectrum.** Presets labelled mild/typical/marked with the anchor of each;
   no exemplar size presented as typical.
4. **Assumed vs. measured.** Every patch header's `assumed` list is honest;
   spot-check three against the exemplar.
5. **Anatomy.** Look at every new state in all three CT planes and in 3D, at
   tier 1 and 3; check laterality on screen (radiological convention) and in
   the scope.
6. **Drainage.** The pathways and the pattern rule agree with the anatomy
   after every edit.
7. **Proximity.** Where bone was removed or a cell added near the ICA, optic
   nerve, orbit, skull base or AEA, the HUD distances changed as they must.
8. **Budgets and determinism.** Sizes within §6.6; a rerun reproduces
   byte-identical outputs.
9. **Board.** WP statuses updated in the roadmap in the same PR.

### 12.3 Owner review (medical correctness)

Only the owner sets `verified` (`docs/decisions.md` §7). Queue, in order:
`scanned` (does the head look like a real CT; is the nasal-cycle note
right) → resegmentation sheets (uncinate, basal lamella, frontal cells) →
variants batch 1 → inflammatory patterns → batch 2. Each item: the state's
URL, the exemplar list, the measured parameters, and the specific question
(e.g. "is a *typical* concha bullosa this large?").

### 12.4 Adversarial tests worth writing

A Haller cell grafted onto `scanned` (where the left infundibulum is already
narrow) must not seal the maxillary ostium unless the preset says so; an
Onodi cell must not enter the optic canal; an OMU pattern over
`v.uncinate-insertion-skull-base` must include the frontal sinus (drainage
through the infundibulum) while over `…-lamina-papyracea` it may spare it;
a mucocele's globe displacement must not intersect the orbital walls; an
air–fluid level in a supine scan must lie in a coronal plane; a scenario's
URL with one id removed from `index.json` must drop cleanly.

---

## 13. Owner decisions

Answered by the owner on 2026-10-07 unless marked open.

| ID | Question | Decision |
|---|---|---|
| RA-O1 | Does the UW email ("Yes that is fine, it is public anyways. Be sure to credit us … would love to see the final version") cover **serving the atlas's own images** (the unlabeled/labeled recall deck; exemplar figures side by side)? | **Yes.** The images may be served from this origin, always with the credit line of `ssb/LICENSE-data.md`. Send the authors the finished model, as they asked. |
| RA-O2 | Add **composite** as a fourth truth kind (§2.2)? | **Yes.** |
| RA-O3 | Default base for Variants/Pathology? | **`scanned`** — variants and pathology should look realistic, so they sit on the real asymmetric head; `standard` is one click away. |
| RA-O4 | May Radiopaedia-derived data (and images) be committed? | **Yes** — the cases are public; attribute (contributor, Radiopaedia.org, rID, as links) and do not monetize, which this site does not. ShareAlike: derived files carry CC BY-NC-SA 3.0 in their own folder. |
| RA-O5 | Who downloads Radiopaedia stacks? | An agent may fetch them, one case at a time, politely, from the shortlist (follows from RA-O4). **Reopened 2026-10-09:** the site now challenges non-browser clients as unsanctioned scraping, so an agent may not fetch. Options for the owner: ask Radiopaedia for sanctioned access (its Developers/licensing contact), or download the ≤ 40 chosen cases in a browser into the drop zone. RP2 waits. |
| RA-O6 | Use **NasalSeg** (CC BY 4.0, 130 CTs) for population asymmetry statistics? | **Yes** — started as WP POP0. |
| RA-O7 | Author names remain in **git history** before 2026-10-07. Rewriting `master` history is destructive (force-push, every clone and open PR breaks). | *Open.* Recommended: leave history; the names are gone from the tree and RA0d keeps them out. Rewrite only if the authors ask. |
| RA-O8 | Scope of batch 3 (soft-tissue/contrast complications with a synthetic channel) | *Open.* Recommended: plan it only after batches 1–2 are verified. |

## 14. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Resegmentation stalls on thin lamellae at this resolution | no uncinate → batch 1 blocked | sheetness on the native grid; boundary review; the owner's 3D Slicer hand-correction fallback |
| Edits look painted | learners learn the artefact | texture from head A, PSF and noise matched, blinded crop test |
| Exemplars mislead about size | florid = "typical" | mild/typical/marked presets, population anchors (§5.2) |
| Radiopaedia access or licence friction | batch 2 thin | small owner-curated list; numbers only; UW and head B cover batch 1 |
| Repo growth from bases | slow clones | re-export at checkpoints; patches small; a third base only with an owner decision |
| Two bases double every downstream test | CI time | tests parameterized by base; the slow ones run on `standard` in CI and on all bases at checkpoints |
| Merge churn with lane B | rework | resegmentation scheduled after ST5 or folded into its checkpoint (§11) |
