# Spec: ear figures based in truth, OLSB and SSB on one volume contract (2026-11-09)

> Status lives in GitHub Issues (parent: see `plans/README.md`). This file holds the decisions, contracts and
> data. It changes only through PRs. Commits: one short line, no trailers.

## 0. Context

Review of 2026-11-09. SSB is data-driven (real CT, labelled volume, precomputed packs, typed graph). OLSB is
procedural (analytic shapes in `js/olsb/volume.js`, meshed at runtime). `tbone/` is a real UW temporal bone
volume in OLSB's frame that no page loads. The ear-anatomy guide shows ten hand-cropped UW slices and hand-drawn
SVGs. Already shared: the glossary ids (`js/olsb/glossary.js`, the `g` of `tbone/geometry/landmarks.json`, the
guide's hotspots) and the ear frame. Not shared: the volume header and the runtimes.

**What `tbone/` can prove** (`tbone/README.md`): one specimen, a screen capture, scale inferred +-10 %, blur
about 0.7 mm, origin +-1.5 mm, tips scatter 1.5-2.5 mm, most of the facial nerve `inferred`. It supports
topology and gross position, not OLSB's 0.1 mm detail. Finer truth waits for DICOM (#244).

## 1. Decisions (owner, 2026-11-09)

| # | Decision |
|---|---|
| C1 | **OLSB stays procedural, checked against real data.** Its drill states and fine grids stay. It gains a real-CT slice view and a check against `tbone` landmarks. No port onto SSB's graph or packs. |
| C2 | **One volume contract: SSB's `ct.json` version 1** (`parseHeader` in `js/ssb/volume.js`). `tbone/ct/ct.json` adopts it. OLSB's frame for a right ear is RAS-oriented (x lateral = R, y anterior = A, z superior = S) with its origin at the oval window, so the affine is a 0.3 mm scale plus the box origin. |
| C3 | **A page may load `tbone/`** (amends UW T8 and sources B-7): OLSB only, lazily, with the attribution line of `tbone/LICENSE-data.md` shown beside the image. |
| C4 | **No shared framework.** OLSB imports the generic functions of `js/ssb/volume.js`; nothing is moved or renamed. The glossary and the SSB graph stay separate. The two offline pipelines are not de-duplicated. |
| C5 | **Guide CT figures are generated**, crops and hotspot regions both, from the pipeline's own tips. Hand SVGs stay labelled schematic. |
| C6 | **#244 is cut to OpenEar and the owner's institutional DICOM** (`plans/2026-11-04-tbone-sources.md`). |
| C7 | **SSB:** RS2c finishes, then SSB runs in parallel with this plan. Its board stays `docs/ssb-roadmap.md` (`AGENTS.md` exemption). |

## 2. Work packages

| ID | Goal | Model | Depends | Touch | Accept |
|---|---|---|---|---|---|
| E1 | `tbone/ct/ct.json` in the SSB v1 header (keep the scale, coverage and source notes as extra keys) | Haiku | none | `tools/tbone-pipeline/volume.py`, `selftest.py`, `tbone/ct/ct.json` (regenerated; needs `fetch.py`, so network to uwmsk.org), `tools/check-data.mjs` | a `check-data` rule runs `parseHeader(meta, 'tbone')` and passes; dims x spacing reproduce the old box; `selftest.py` passes |
| E2 | OLSB real-CT slice view: axial, coronal, sagittal slices of `tbone` with landmarks and sweeps drawn over them, coded detected / labelled / inferred, glossary names, attribution line | Opus specs the UI contract in the issue, Haiku builds | E1 | `js/olsb/ct.js` (new ES module importing `../ssb/volume.js`), `OLSB.html`, `css/olsb.css`, `js/olsb/main.js` or `3d.js` (mode switch only), `tools/stamp-assets.mjs` (stamp `tbone/`), `tools/smoke-pages.mjs` | smoke test opens the view against a synthetic volume routed by Playwright (no fixture in `tbone/`), a slice draws, a landmark click selects its glossary id; volume fetched only on entering the view; CSP unchanged |
| E3 | Truth check: `check-data` compares each OLSB anchor to the median `tbone` landmark of the same glossary id | Opus | E1 | `tools/check-data.mjs`, `js/olsb/volume.js` (constants only) | residual table printed per id; first run report-only; Opus moves the outliers it can justify, then the rule fails above 3 mm (the data's noise floor) with a listed, reasoned exception per id it leaves; glossary `rel` checks still pass |
| E4 | Guide slices from the pipeline: a script writes the ten crops and each slice's hotspot `poly` regions from `landmarks.json` tips | Haiku, Opus reviews every region | none | `tools/tbone-pipeline/slices.py` (new), `images/oksat/ear-anatomy/ct/`, `js/oksat/guides/ear-anatomy/imaging.js`, `images/oksat/ear-anatomy/ATTRIBUTION.md` | rerun reproduces the committed crops byte for byte; every region's `g` is a glossary id; `lint-oksat-guide` and `test-oksat-learn` pass. Escalate: a tip that does not sit on its structure |
| E5 | Docs pass: `docs/ssb.md` stale sections (status header, file list, pack list, decisions duplicated in the roadmap), `docs/ssb-roadmap.md` stale statuses, `README.md` test list, `docs/wip.md`, `docs/verification.md` (`test-search`, `test-airway-resume`) | Haiku | E1-E4 | those files | no doc names a file that `ls` does not find; `check-data` passes. Escalate: executor name (Sonnet in the roadmap, Haiku in `AGENTS.md`) |

Review: Opus reviews E2 and E4 diffs; the owner vets every anatomical claim (regions, moved anchors).

## 3. Not doing

A segmentation of the UW volume (its blur is above the structures that matter); a 3D mesh of it; a CT stage
shared as one component by both pages; moving `js/ssb/volume.js` to a shared folder.

## 4. Risks

- **False precision.** A 3 mm tolerance still rests on n = 1 and an inferred scale; the check catches gross
  errors and proves nothing finer. State this in the view (E2) and the check's message (E3).
- **Circularity in E4.** Regions come from UW's own labels, so they agree with UW by construction; that is
  provenance, not validation.
