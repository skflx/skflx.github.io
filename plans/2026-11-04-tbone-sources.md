# Spec: higher-quality temporal bone sources (2026-11-04)

> Status lives in GitHub Issues (parent: see `plans/README.md`, one sub-issue per WP). This file holds the decisions, contracts and data. It changes only through PRs. Commits: one short line, no trailers.
> Follows `plans/2026-11-03-uw-temporal-bone-volume.md` (parent #225). That spec stands; this one adds sources.

## 0. Why the UW atlas is not enough (facts from `tbone/README.md`, `tbone/LICENSE-data.md`)

- UW is a **screen capture of a bone-window display, 512 x 512 JPEG, not DICOM**: values are 8-bit display levels, not HU; pixel spacing and slice step are **inferred** (scale circularity is stated in `tbone/README.md`); one specimen (n = 1); the axial stack covers about 16 mm and the rest is filled from reformats.
- Consequence: no segmentation by density threshold, no millimetre truth, and the 0.3 mm grid is finer than the source supports. A real DICOM (or NIfTI/NRRD with real spacing) removes the whole scale-inference method (UW T5).

## 1. Candidate sources (research of 2026-11-04; **every row is unverified until WP B1 reads its licence and a sample**)

| Source | What it is (as described by its own pages) | Why it might fit | Open questions |
|---|---|---|---|
| **OpenEar** library, [Zenodo 1473724](https://zenodo.org/records/1473724) (v2 open; v1 [1342658](https://zenodo.org/record/1342658) restricted) | 8 human temporal bones, cone-beam CT reconstructed to **DICOM at 0.25 mm** voxel, micro-slicing histology, triangulated segmentations (ossicles, scalae, facial nerve, chorda tympani, drum, EAC, sigmoid/dura, carotid). Article: [PMC6326113](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6326113/) | Real spacing, 8 specimens (case variation), segmentations to check our sweeps against | **Licence of v2 not confirmed.** CBCT, not clinical HRCT: noise and artefact profile. Does it include the full mastoid and petrous apex, or a block? |
| **Gerber et al., multiscale inner ear dataset**, Scientific Data 2017 ([PMC5604133](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5604133/)) | 52 temporal bones with CBCT and micro-CT, manual cochlear segmentations for 24 | micro-CT detail of cochlea/vestibule (the part UW shows worst) | Paper is CC BY; **data licence and format unconfirmed**; inner ear only. |
| **Leiden inner ear volume CT** ([Zenodo 8277159](https://zenodo.org/records/8277159)) | 43 volume CTs, HDF5, landmarks (cochlear apex, round and oval windows) | Cheap check of our oval-window origin and cochlear axis across many ears | HDF5, licence unconfirmed; landmarks, not structures. |
| **Visible Human Male head** (NLM) | CT 1 mm axial; head cryosection at **0.174 mm** with a 72-year-old male's CT/MRI ([NLM](https://lhncbc.nlm.nih.gov/)) | Colour anatomy at 0.17 mm to *vet* sweeps (facial nerve, chorda) that CT cannot show | CT is too coarse for ossicles; cryosection is photographs, so it carries pixels, not HU: use as a cross-check only. Current terms ("acknowledge NLM") unconfirmed. |
| **Owner's institutional HRCT** | A normal clinical temporal bone CT from the owner's PACS | The only true clinical-grade source (0.3–0.6 mm HRCT, HU) | PHI/IRB: **owner decision**; raw DICOM never enters the repo (§2 B-6). |
| TCIA, MorphoSource, NIH 3D | Large archives | Possible hits | TCIA head CTs are mostly 1–3 mm and unsuited; not pursued unless B1 finds a temporal bone collection. |

Rejected: any model-generated or "enhanced" image as an anatomical source (`AGENTS.md`: generated pixels never carry an anatomical claim); textbook or Radiopaedia images (copyright).

## 2. Decisions (veto any)

| # | Decision |
|---|---|
| B-1 | **Licence first.** No file is downloaded into the repo until its licence permits redistribution of a *derived* volume and the attribution line is recorded in `tbone/LICENSE-data.md` (credit the data set and institution; never name individual authors if the source asks otherwise, as for UW). |
| B-2 | **Derived data only, never raw.** Raw DICOM/NIfTI stays in `tools/tbone-pipeline/incoming/<source>/` (git-ignored). Only the OLSB-frame crop, landmarks and sweeps are committed, as UW's are. |
| B-3 | **Same frame as UW**: mm, right ear, x lateral, y anterior, z superior, origin at the centre of the oval window, so OLSB and every specimen register to each other. A left bone is mirrored and `mirrored: true` is recorded. |
| B-4 | **Real spacing replaces inferred scale.** DICOM `PixelSpacing`/`SliceThickness`/`ImagePositionPatient` are read, not guessed; HU is kept (stored as int16 gz, then windowed for display). |
| B-5 | **One folder per specimen**: `tbone/<source-id>-<n>/` with the UW file layout. The existing UW files stay where they are (moving them is out of scope). Each has its own README row and provenance. |
| B-6 | **No PHI.** DICOM header tags are dropped at ingest by an allowlist (spacing, orientation, modality, kVp, slice thickness); a test fails if any other tag text reaches a committed file. Owner-institution data additionally needs the owner's written go-ahead recorded in `LICENSE-data.md`. |
| B-7 | **Still internal** (as UW T8): no page loads `tbone/` until a WP says so. |
| B-8 | **Size budget** stated in B1 per specimen (a cropped, gzipped volume must be small enough to live in git; target decided from the first real crop, not guessed here). |
| B-9 | **Medical claims stay the owner's**: sweeps are `detected | labelled | inferred`, content `draft`; segmentations supplied by a source are cited as such, not re-labelled as ours. |

## 3. Work packages

| ID | Goal | Model | Depends | Accept |
|---|---|---|---|---|
| B1 | **Triage report** in `plans/` addendum (not code): for OpenEar v2, Gerber, Leiden, Visible Human, read the licence text and file listing, download one sample (outside the repo), record format, spacing, field of view (does it include mastoid tip, petrous apex, IAC?), noise, and a verdict per source. | Opus | none | Each §1 "open question" answered with a quote or a measurement; a ranked recommendation; B-8 numbers. |
| B2 | **Owner decision D-B1** (below) on the institutional option. | Owner | B1 | Written in the parent issue. |
| B3 | **DICOM/NIfTI ingest** `tools/tbone-pipeline/ingest.py` (reuse `volume.py` helpers per UW T6): read series, sort by position, resample isotropic, header allowlist (B-6). | Haiku | B1 | A synthetic DICOM series (generated by the test, no real data) round-trips: dims, spacing and orientation correct; a PHI tag injected into the fixture never reaches the output. |
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
