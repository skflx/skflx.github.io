# tbone — normal temporal bone reference volume (internal)

A 3D reconstruction of the normal temporal bone CT in the UW *Interactive Web-based CT Temporal Bone
Module*, in OLSB's frame, with the facial nerve and other surgical structures traced. **Internal reference
data, loaded only by OLSB's Real CT mode** (`js/olsb/ct.js`, lazily; `tools/smoke-pages.mjs` tests that mode on a synthetic volume, and `tools/check-data.mjs` reads it in a report-only truth check) (plan `plans/2026-11-03-uw-temporal-bone-volume.md`, parent issue #225).
Provenance and permission: `LICENSE-data.md`. Everything here is generated: never hand-edit it; rerun the pipeline.

**Frame** (`js/olsb/volume.js`): millimetres, a **right** ear, x lateral, y anterior, z superior, origin at the
centre of the oval window. Values are 8-bit display levels of a bone-window screen capture (air = the window
floor, about 43; soft tissue about 110; dense bone 200-255), **not HU**.

## Files

| File | What |
|---|---|
| `ct/ct.u8.gz`, `ct/ct.json` | display volume, 0.3 mm isotropic, 214 x 174 x 167 voxels, `[z][y][x]` (x fastest). `ct.json` is SSB's ct.json v1 header (`version`, `dims`, `spacing`, 4x4 `affine` at the box origin, `dtype`, `values`, `windows`, `specimen`; read by `js/ssb/volume.js` `parseHeader`) plus extra keys: scale method and uncertainty, coverage, source map, frame |
| `ct/source.u8.gz` | same grid: 0 no data, 1 axial stack, 2 reformatted stacks only (see Limits) |
| `geometry/landmarks.json` | every UW label tip as a 3D point (mm) with plane, slice run, canonical name, `js/olsb/glossary.js` id (`g`, else null), tip-finder; `summary` per name |
| `geometry/sweeps.json` | centrelines with radius, per-point `status` (detected / labelled / inferred) and `src` (a = axial coverage, r = reformats only): facial nerve by segment, IAC, GSPN start, petrous ICA, sigmoid sinus, jugular bulb, cochlear and vestibular aqueducts, EAC, bony Eustachian tube, the three canals, basal turn; `fn_sanity_mm` |
| `registration.json` | stack checks, per-plane registration (parameters, per-slice NCC, tip residuals), scale and frame, specimen identity |

Not produced: `labels.json` / `labels.u16.gz` (spec: optional, WP T3); no chorda tympani sweep (not visible at
this resolution and not labelled by UW).

## Regenerate

`extract.py`, `slices.py` and the other pipeline scripts need the raw slices, so run `fetch.py` first.

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/ssb-pipeline/requirements.txt
P=tools/tbone-pipeline
.venv/bin/python -I $P/fetch.py            # UW site -> $P/incoming/ (git-ignored; never committed)
.venv/bin/python -I $P/extract.py          # labels, OCR, arrowheads -> $P/work/slices-<plane>.json   (slow: ~10 min)
.venv/bin/python -I $P/volume.py check     # stack checks
for p in coronal parallel perpendicular; do .venv/bin/python -I $P/register.py $p; done   # slow; run in parallel
#  a stack that stalls in a local minimum is refitted with  register.py --dz <step from the others> <plane>
.venv/bin/python -I $P/register.py --residuals coronal parallel perpendicular
.venv/bin/python -I $P/scale.py            # frame: scale, slice step, oval-window origin
.venv/bin/python -I $P/volume.py build     # ct/
.venv/bin/python -I $P/landmarks.py        # geometry/landmarks.json
.venv/bin/python -I $P/relabel.py          # after editing vocab.py: reapply it to landmarks.json without re-registering (--check lists what would change)
.venv/bin/python -I $P/slices.py           # the ear-anatomy guide's CT crops (images/oksat/ear-anatomy/ct/) and regions (imaging.js); --check writes nothing, then node tools/stamp-assets.mjs
.venv/bin/python -I $P/sweeps.py           # geometry/sweeps.json (+ work/dims.json)
.venv/bin/python -I $P/scale.py report     # anatomy cross-checks of the scale
.venv/bin/python -I $P/export.py           # registration.json
.venv/bin/python -I $P/selftest.py         # numpy-only self-test of the committed data
.venv/bin/python -I $P/contactsheet.py DIR --only facial-nerve --tag fn   # review sheets (not committed)
```

The OpenEar ingest is planned, not written: a reader for NRRD volumes (it keeps only the geometry header fields and resamples isotropic, writing under the git-ignored incoming folder only) and a fetcher that range-extracts only the needed members of an OpenEar archive into incoming/openear/<specimen>/. It is work package B3 of `plans/2026-11-04-tbone-sources.md`. Until it lands, nothing from OpenEar is in this folder.

## How it was made, and what it can and cannot say

- **Inputs.** All four normal planes at the best resolution served (512 x 512): axial 61, coronal 21, parallel
  (Stenvers) 23, perpendicular (Poeschl) 17 slices, each unlabelled and labelled.
- **One specimen.** The other three stacks are reformats of the axial acquisition: a rigid fit into the axial
  stack reaches an edge-NCC of 0.96-0.98 per slice, pixel size equal to the axial one, the same slice step, the
  same display window (`registration.json`, `specimen_identity`).
- **Scale is inferred, not measured** (the capture carries no spacing): in-plane 0.1758 mm/px (a 90 mm field of
  view over 512 px) +-10 %; the axial slice step 0.263 mm follows from it (registration fixes the ratio, 1.60
  px). The checks against textbook lengths are weak and disagree by up to 40 %, and they are not independent: the 90 mm field was chosen after they pointed below the first 100 mm guess. A measured scale needs a known length in the images (none is published); method and values in
  `registration.json` (`frame`) and the docstring of `tools/tbone-pipeline/scale.py`. Every length in this
  folder scales with that number.
- **Origin** (centre of the oval window) is the median of UW's oval-window tips of the four stacks mapped into
  the axial volume; spread about 1 mm in-plane and about 2 slices across, so +-1.5 mm.
- **Labels.** Ambiguous bare fragments (`eminence`, `niche`) get no glossary id. Text is OCRed twice (page, then each box at 3x); arrow tips are found by arrowhead (the SSB shaft
  rule was wrong by tens of pixels where arrows converge on the middle ear). A tip marks a place on a
  structure, not its centroid: tips of one structure scatter by 1.5-2.5 mm between planes.
- **Limits of the volume.** The axial stack is only about 16 mm tall; below and above it the volume is filled
  from the three reformatted stacks (`source` = 2; their slice step is 1.1 mm, so those voxels are blurred
  across it). Detail finer than the capture's blur (about 0.7 mm) is not there: the facial canal, the
  aqueducts and the canals are at or below it.
- **Sweeps.** A sweep is a smooth curve fitted to the UW tips of a structure (they scatter too much to be
  joined), re-centred on the lumen within 0.6 mm, with each point classed: `labelled` within 1 mm of a tip;
  `detected` where the volume shows a lumen (darker than the bone ring round it and bone-enclosed; air for
  the EAC; soft tissue bounded by bone for the IAC and veins); otherwise `inferred`. Most of the facial nerve
  is inferred: the nerve inside the IAC is not distinguishable from CSF, the second genu and GSPN have no
  label. `sweeps.json` carries counts per segment. The canals and the basal turn are fitted arcs / a spiral.
- **Registration limit, coronal.** The coronal stack was registered while UW's "arcuate eminence" label was mis-read as the pyramidal eminence, so its registration used one wrong correspondence among its compact structures. The labels are corrected (`relabel.py`); the registration is not, and is to be redone with the DICOM sources (issue #244). `registration.json` still lists the old pyramidal-eminence residual for that reason.
- **Draft.** Anatomy is draft until the owner verifies it (`docs/decisions.md` section 7).

## Size

About 3.4 MB in all (`ct.u8.gz` 3.2 MB), no UW image or derivative image is stored in this folder (the ear-anatomy guide's ten cropped slices are in `images/oksat/ear-anatomy/ct/`, generated by `tools/tbone-pipeline/slices.py`, credited in `images/oksat/ear-anatomy/ATTRIBUTION.md`).
