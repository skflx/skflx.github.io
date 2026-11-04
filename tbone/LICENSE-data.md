# Temporal bone reference data: provenance and permission

Every file under `tbone/` is derived from one source. Same format and rules as `ssb/LICENSE-data.md`.

## Reference specimen `uw-temporalbone-normal`

**Source.** *Interactive Web-based CT Temporal Bone Module*, normal anatomy, University of Washington
Department of Radiology, Seattle, at http://uwmsk.org/temporalbone/ (axial, coronal, parallel and perpendicular
planes). Credit goes to the atlas and its institution; the repo does not name the atlas's individual authors
(owner, 2026-10-07: their privacy), here or in any other file or commit.

**Case.** One adult temporal bone, normal (n = 1), a right ear. The four planes are reformats of one
acquisition (`tbone/registration.json`, `specimen_identity`). The atlas carries no patient identifiers.

**Permission.** The written permission of 2026-10-07 recorded in `ssb/LICENSE-data.md` (use of the atlas's
public CT images in a public, non-commercial 3D educational model, on condition that the work credits the
atlas) covers this module too (owner, 2026-11-03; plan `plans/2026-11-03-uw-temporal-bone-volume.md`, T1). The
email stays with the owner and is not committed. Any UW image committed to the repo would need its own row
here; none is: the raw downloads live in `tools/tbone-pipeline/incoming/` (ignored by version control) and
no derivative image is stored.

**Attribution** (show wherever the specimen is displayed): *Temporal bone CT derived from the Interactive CT
Temporal Bone Atlas, University of Washington Department of Radiology (uwmsk.org/temporalbone), used with the
authors' permission.*

**What this is not.** The atlas is a screen capture of a bone-window display, not DICOM: values are 8-bit
display levels, not HU, and the pixel spacing is inferred (`tbone/README.md`, `registration.json`). It has no
contrast, so nerves and vessels show only where bone encloses them; the sweeps say per point whether they
were detected, labelled by UW or inferred. Content is `draft`; only the owner verifies anatomy.

### Derived files

| File | What | Made by |
|---|---|---|
| `tbone/ct/ct.u8.gz`, `tbone/ct/ct.json`, `tbone/ct/source.u8.gz` | the axial display volume resampled to 0.3 mm isotropic in the OLSB frame (origin = centre of the oval window), cropped to the temporal bone; where the axial stack (about 16 mm tall) does not reach, filled from the registered coronal, parallel and perpendicular stacks; per-voxel source map | `tools/tbone-pipeline/volume.py` (after `register.py`, `scale.py`) |
| `tbone/geometry/landmarks.json` | every UW label (text read by OCR, canonical name, OLSB glossary id) as a 3D point per arrow tip, with plane, slice run and the method | `tools/tbone-pipeline/extract.py`, `tips.py`, `vocab.py`, `landmarks.py` |
| `tbone/geometry/sweeps.json` | centrelines and radii of the facial nerve (by segment), IAC, GSPN start, petrous ICA, sigmoid sinus, jugular bulb, cochlear and vestibular aqueducts, EAC, bony Eustachian tube, the three semicircular canals and the basal turn; per point detected / labelled / inferred; facial-nerve distance checks | `tools/tbone-pipeline/sweeps.py`, `trace.py` |
| `tbone/registration.json` | numbers only: stack checks, registration of the three reformatted stacks to the axial stack, scale and frame, specimen identity | `tools/tbone-pipeline/register.py`, `scale.py`, `volume.py`, `export.py` |

Regeneration and limits: `tbone/README.md`.
