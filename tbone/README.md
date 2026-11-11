# tbone: normal temporal bone reference volume (internal)

A 3D reconstruction of the normal temporal bone CT in the UW *Interactive Web-based CT Temporal Bone
Module*, in OLSB's frame, with the facial nerve and other surgical structures traced. **Internal
reference data**, loaded only by OLSB's Real CT mode (`js/olsb/ct.js`, lazily) and by the truth check
in `tools/check-data.mjs`. Spec: `plans/2026-11-03-uw-temporal-bone-volume.md`. Provenance and
permission: `LICENSE-data.md`. Everything here is generated: never hand-edit it; rerun the pipeline.

**Frame** (`js/olsb/volume.js`): millimetres, a **right** ear, x lateral, y anterior, z superior,
origin at the centre of the oval window. Values are 8-bit display levels of a bone-window screen
capture (air = the window floor, about 43; soft tissue about 110; dense bone 200–255), **not HU**.

## Files

| File | What |
|---|---|
| `ct/ct.u8.gz`, `ct/ct.json` | display volume, 0.3 mm isotropic, `[z][y][x]` (x fastest). `ct.json` is SSB's ct.json v1 header (read by `js/ssb/volume.js` `parseHeader`) plus scale method and uncertainty, coverage, source map and frame |
| `ct/source.u8.gz` | same grid: 0 no data, 1 axial stack, 2 reformatted stacks only |
| `geometry/landmarks.json` | every UW label tip as a 3D point (mm) with plane, slice run, canonical name, glossary id (`g`, else null), and tip-finder; `summary` per name |
| `geometry/sweeps.json` | centrelines with radius and per-point `status` (detected / labelled / inferred) and `src` (a = axial coverage, r = reformats only): facial nerve by segment, IAC, GSPN start, petrous ICA, sigmoid sinus, jugular bulb, aqueducts, EAC, bony Eustachian tube, canals, basal turn; `fn_sanity_mm` |
| `registration.json` | stack checks, per-plane registration (parameters, per-slice NCC, tip residuals), scale and frame, specimen identity |

Not produced: `labels.json` / `labels.u16.gz`; no chorda tympani sweep (not visible at this resolution
and not labelled by UW).

## Regenerate

The pipeline scripts need the raw slices, so run `fetch.py` first. From the repo root:

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/ssb-pipeline/requirements.txt
P=tools/tbone-pipeline
.venv/bin/python -I $P/fetch.py            # UW site -> $P/incoming/ (git-ignored; never committed)
.venv/bin/python -I $P/extract.py          # labels, OCR, arrowheads -> $P/work/slices-<plane>.json (slow)
.venv/bin/python -I $P/volume.py check     # stack checks
for p in coronal parallel perpendicular; do .venv/bin/python -I $P/register.py $p; done   # slow; in parallel
#  a stack stuck in a local minimum is refitted with: register.py --dz <step from the others> <plane>
.venv/bin/python -I $P/register.py --residuals coronal parallel perpendicular
.venv/bin/python -I $P/scale.py            # frame: scale, slice step, oval-window origin
.venv/bin/python -I $P/volume.py build     # ct/
.venv/bin/python -I $P/landmarks.py        # geometry/landmarks.json
.venv/bin/python -I $P/relabel.py          # after editing vocab.py (--check lists what would change)
.venv/bin/python -I $P/slices.py           # ear-anatomy guide CT crops and regions; --check writes nothing, then node tools/stamp-assets.mjs
.venv/bin/python -I $P/sweeps.py           # geometry/sweeps.json (+ work/dims.json)
.venv/bin/python -I $P/scale.py report     # anatomy cross-checks of the scale
.venv/bin/python -I $P/export.py           # registration.json
.venv/bin/python -I $P/selftest.py         # numpy-only self-test of the committed data
.venv/bin/python -I $P/contactsheet.py DIR --only facial-nerve --tag fn   # review sheets (not committed)
```

OpenEar sources: `tools/tbone-pipeline/fetch_openear.py` and `ingest.py` fetch and resample one
OpenEar specimen into the git-ignored `tools/tbone-pipeline/incoming/` only. Nothing from OpenEar is
committed to this folder. `tools/tbone-pipeline/frame.py` computes that volume's placement; its
output stays under `incoming/`.

## How it was made, and what it can say

- **Inputs.** All four normal planes at the best resolution served (512 x 512): axial, coronal,
  parallel (Stenvers) and perpendicular (Poeschl) stacks, each unlabelled and labelled.
- **One specimen.** The other three stacks are reformats of the axial acquisition: a rigid fit into
  the axial stack reaches an edge-NCC of 0.96–0.98 per slice, with the same pixel size, slice step and
  display window (`registration.json`, `specimen_identity`).
- **Scale is inferred, not measured** (the capture carries no spacing): in-plane 0.1758 mm/px (a 90 mm
  field of view over 512 px) ±10 %; the axial slice step follows from it. Checks against textbook
  lengths are weak (they disagree by up to 40 %). A measured scale needs a known length in the images,
  which is not published. Method and values: `registration.json` (`frame`) and the docstring of
  `tools/tbone-pipeline/scale.py`. Every length here scales with that number.
- **Origin** (centre of the oval window) is the median of UW's oval-window tips of the four stacks
  mapped into the axial volume; spread about 1 mm in-plane and about 2 slices across, so ±1.5 mm.
- **Labels.** Ambiguous bare fragments (`eminence`, `niche`) get no glossary id. Text is OCRed twice
  (page, then each box at 3x); arrow tips are found by arrowhead. A tip marks a place on a structure,
  not its centroid: tips of one structure scatter by 1.5–2.5 mm between planes.
- **Limits of the volume.** The axial stack is only about 16 mm tall; above and below it the volume is
  filled from the three reformatted stacks (`source` = 2), whose slice step is coarser, so those
  voxels are blurred across it. Detail finer than the capture's blur (about 0.7 mm) is not there: the
  facial canal, the aqueducts and the canals are at or below it.
- **Sweeps.** A sweep is a smooth curve fitted to the UW tips of a structure, re-centred on the lumen
  within 0.6 mm. Each point is classed: `labelled` within 1 mm of a tip; `detected` where the volume
  shows a lumen (darker than the bone ring round it and bone-enclosed; air for the EAC; soft tissue
  bounded by bone for the IAC and veins); otherwise `inferred`. Most of the facial nerve is inferred:
  the nerve inside the IAC is not distinguishable from CSF, and the second genu and GSPN have no label.
  The canals and the basal turn are fitted arcs or a spiral.
- **Coronal registration.** It used one wrong correspondence (a mis-read label; the labels are fixed
  by `relabel.py`, the registration is not), so its residual is still the old one. Redo with the DICOM
  sources.
- **Draft.** Anatomy stays draft until the owner verifies it (`docs/decisions.md` §7).

## Size and attribution

No UW image or derivative image is stored in this folder. The ear-anatomy guide's ten cropped slices
are in `images/oksat/ear-anatomy/ct/`, generated by `tools/tbone-pipeline/slices.py` and credited in
`images/oksat/ear-anatomy/ATTRIBUTION.md`.
