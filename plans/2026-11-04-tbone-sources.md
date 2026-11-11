# Spec: higher-quality temporal bone sources (2026-11-04)

> Status lives in GitHub Issues (parent: see `plans/README.md`, one sub-issue per WP). This file holds the decisions, contracts and data. It changes only through PRs. Commits: one short line, no trailers.
> Follows `plans/2026-11-03-uw-temporal-bone-volume.md` (parent #225). That spec stands; this one adds sources.

## 0. Why the UW atlas is not enough (facts from `tbone/README.md`, `tbone/LICENSE-data.md`)

- UW is a **screen capture of a bone-window display, 512 x 512 JPEG, not DICOM**: values are 8-bit display levels, not HU; pixel spacing and slice step are **inferred** (scale circularity is stated in `tbone/README.md`); one specimen (n = 1); the axial stack covers about 16 mm and the rest is filled from reformats.
- Consequence: no segmentation by density threshold, no millimetre truth, and the 0.3 mm grid is finer than the source supports. A real DICOM (or NIfTI/NRRD with real spacing) removes the whole scale-inference method (UW T5).

## 1. Candidate sources (research of 2026-11-04; **every row is unverified until WP B1 reads its licence and a sample**)

| Source | What it is (as described by its own pages) | Why it might fit | Open questions |
|---|---|---|---|
| **OpenEar** library, [Zenodo 1473724](https://zenodo.org/records/1473724) (v2 open; v1 [1342658](https://zenodo.org/record/1342658) restricted) | 8 human temporal bones, cone-beam CT reconstructed to **DICOM at 0.25 mm** voxel, micro-slicing histology, triangulated segmentations (ossicles, scalae, facial nerve, chorda tympani, drum, EAC, sigmoid/dura, carotid). Article: [PMC6326113](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6326113/) | Real spacing, 8 specimens (case variation), segmentations to check our sweeps against | Licence: the Zenodo record 1473724 is open access under **CC BY 4.0** (record metadata, read 2026-11-09), so a derived volume may be redistributed with attribution; B1 still reads any licence file inside the archives. Eight archives of 4 to 14 GB each: download one, outside the repo. CBCT, not clinical HRCT: noise and artefact profile. Does it include the full mastoid and petrous apex, or a block? |
| **Owner's institutional HRCT** | A normal clinical temporal bone CT from the owner's PACS | The only true clinical-grade source (0.3–0.6 mm HRCT, HU) | PHI/IRB: **owner decision**; raw DICOM never enters the repo (§2 B-6). |

Dropped from triage (owner, 2026-11-09): the Gerber multiscale inner ear set and the Leiden inner ear CTs (inner ear only), the Visible Human head (CT too coarse, cryosection is photographs), TCIA, MorphoSource and NIH 3D (no temporal bone collection known). OpenEar is the only public whole-bone set with supplied segmentations.

Rejected: any model-generated or "enhanced" image as an anatomical source (`AGENTS.md`: generated pixels never carry an anatomical claim); textbook or Radiopaedia images (copyright).

## 2. Decisions (veto any)

| # | Decision |
|---|---|
| B-1 | **Licence first.** No file is downloaded into the repo until its licence permits redistribution of a *derived* volume and the attribution line is recorded in `tbone/LICENSE-data.md` (credit the data set and institution; never name individual authors if the source asks otherwise, as for UW). |
| B-2 | **Derived data only, never raw.** Raw DICOM/NIfTI stays in `tools/tbone-pipeline/incoming/<source>/` (git-ignored; never committed). Only the OLSB-frame crop, landmarks and sweeps are committed, as UW's are. |
| B-3 | **Same frame as UW**: mm, right ear, x lateral, y anterior, z superior, origin at the centre of the oval window, so OLSB and every specimen register to each other. A left bone is mirrored and `mirrored: true` is recorded. |
| B-4 | **Real spacing replaces inferred scale.** DICOM `PixelSpacing`/`SliceThickness`/`ImagePositionPatient` are read, not guessed; HU is kept (stored as int16 gz, then windowed for display). |
| B-5 | **One folder per specimen**: `tbone/<source-id>-<n>/` with the UW file layout. The existing UW files stay where they are (moving them is out of scope). Each has its own README row and provenance. |
| B-6 | **No PHI.** DICOM header tags are dropped at ingest by an allowlist (spacing, orientation, modality, kVp, slice thickness); for NRRD, geometry only, with `space` accepted from a closed vocabulary; a test fails if any other tag text reaches a committed file. Owner-institution data additionally needs the owner's written go-ahead recorded in `LICENSE-data.md`. |
| B-7 | **Still internal** (as UW T8): no page loads `tbone/` until a WP says so. |
| B-8 | **Size budget** stated in B1 per specimen (a cropped, gzipped volume must be small enough to live in git; target decided from the first real crop, not guessed here). |
| B-9 | **Medical claims stay the owner's**: sweeps are `detected | labelled | inferred`, content `draft`; segmentations supplied by a source are cited as such, not re-labelled as ours. |

## 3. Work packages

| ID | Goal | Model | Depends | Accept |
|---|---|---|---|---|
| B1 | **Triage report** in `plans/` addendum (not code): for OpenEar v2, read the licence text and file listing, download one sample (outside the repo), record format, spacing, field of view (does it include mastoid tip, petrous apex, IAC?), noise, and a verdict per source. | Opus | none | Each §1 "open question" answered with a quote or a measurement; a ranked recommendation; B-8 numbers. |
| B2 | **Owner decision D-B1** (below) on the institutional option. | Owner | B1 | Written in the parent issue. |
| B3 | **Ingest** `tools/tbone-pipeline/ingest.py`: read a volume, keep only allowlisted header fields (B-6), resample isotropic. **NRRD first** (owner go, 2026-11-11: OpenEar's registered volumes are NRRD, §6); the DICOM reader waits for D-B1. `fetch_openear.py` range-extracts only the needed archive members into the git-ignored `incoming/openear/<specimen>/`. | Executor | B1 | A synthetic NRRD (generated by the test, no real data) round-trips: dims, spacing and orientation correct; a header key outside the allowlist injected into the fixture never reaches the output. ZETA ingests; its dims and spacing are printed. Nothing from `incoming/` is committed. |
| B4 | **Frame placement**: oval-window origin and right-ear orientation for a new specimen (Opus places the origin landmarks as data, per `docs/delegation.md` §1; the script applies them). | Opus then Haiku | B3 | Origin and axes cross-checked against OLSB anatomy: oval-window position, cochlear basal-turn axis and IAC direction within stated tolerance; residuals printed. |
| B5 | **Sweeps on real HU** (facial nerve by segment, IAC, aqueducts, ICA, sigmoid, canals, basal turn) via the existing `sweeps.py`/`trace.py` adapted to int16 HU; compare to the source's own segmentations where given (OpenEar): Dice/centreline distance printed. | Opus | B4 | Facial nerve distances (tympanic to oval window, second genu to LSCC, mastoid FN to EAC posterior wall) in plausible range; overlay contact sheets reviewed by Opus before merge. |
| B6 | **Provenance and docs**: `tbone/<id>/LICENSE-data.md`, README rows, `README.md`/`docs/wip.md` lines. | Haiku | B5 | `node tools/check-data.mjs` passes. |

Review: Opus reviews each sweep overlay; the owner vets anatomy (`review: draft` until then).

## 4. Owner decisions

- **D-B1.** Use the owner's own institutional HRCT as a specimen? It is the best-quality option and the only one with clinical HRCT noise and window behaviour, but it needs de-identification and the institution's approval. Recommendation: decide after B1; do not start without it.
- **D-B2.** Is one extra specimen enough, or should B3–B5 target a set (OpenEar has eight)? Recommendation: one first, built generically so the rest is a loop.

## 5. Risks

- **R1: licence.** If OpenEar v2 forbids redistribution of derivatives, only measurements (landmarks, sweeps) may be committed, not the volume. B1 decides before any work.
- **R2: CBCT is not HRCT.** Different noise and bone/air contrast; thresholds tuned on it may not transfer to clinical CT.
- **R3: one-bone bias.** n = 1 per specimen; the anatomy is a normal individual, not a population norm. State this wherever it is displayed.
- **R4: field of view.** Some bones are blocks that exclude the mastoid tip or petrous apex; B1 checks first.

## 6. B1 result (2026-11-11; full report on issue #244)

- **OpenEar is licence-clear: CC BY 4.0** (paper Data Records and Zenodo record 1473724 agree). Credit line, confirmed by the owner (CC BY requires naming the authors; the no-author-names rule is UW's only): "Temporal bone CT derived from the OpenEar library (Sieber et al., Sci Data 2019, doi:10.1038/sdata.2018.297; data doi:10.5281/zenodo.1473724), CC BY 4.0; resampled and cropped."
- **Start with specimen ZETA** (right ear, both scans, registered `CBCT_Unembedded.nrrd` at 0.125 mm, int16). Second: THETA. Not ALPHA, BETA, ETA.
- **Intensities are scanner grey values, not HU**: B-4's "HU is kept" reads "source values are kept" for OpenEar, and B5's thresholds are relative.
- **Labels**: 13 segments; no semicircular canals, vestibule, Eustachian tube, jugular bulb or IAC; sinus and dura are one label. Those ids need B5.
- **Never committed**: any OpenEar NRRD, DICOM, TIFF, PLY or segmentation file. Donor sex and dates in the DICOM headers are never copied.
- **Unverified until B4 opens the volume**: completeness of the mastoid tip, petrous apex and Eustachian tube; the committed crop's size (B-8).

