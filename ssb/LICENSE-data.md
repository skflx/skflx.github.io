# SSB specimen data — provenance and permission

Every file listed here is derived from one source: its dataset, the permission it is
published under, and how it was made. `docs/ssb.md` §5.1 requires this record for each
derived file. A replacement specimen gets its own section here.

## Reference specimen `uw-axial-sagittal`

**Source.** *Interactive CT Sinus Anatomy*, University of Washington Department of
Radiology, Seattle, at http://uwmsk.org/sinusanatomy2/ (c. 2009–2010). Credit goes to the
atlas and its institution; the repo does not name the atlas's individual authors (owner,
2026-10-07: their privacy), here or in any other file or commit.

**Case.** The atlas's axial stack (175 slices) and sagittal stack (137 slices). They are one
adult head: the sagittal images are reformats of the axial acquisition. UW's coronal stack
shows a different head and is **not** used here (see
`tools/ssb-pipeline/uw/registration.json`, `registration.specimen_identity`). The atlas
shows normal anatomy only (n = 1). It carries no patient identifiers, and the external face
is masked in the published volume, except the specimen's own nose (skin, alae, columella and
vestibule between the alar-facial grooves; lips, cheeks and eyelids stay masked).

**Permission.** Written permission from the atlas's authors, by email to the owner on
2026-10-07, in answer to a request to use the atlas's public CT images in a public,
non-commercial 3D educational model of endoscopic sinus surgery. Its terms: the use is
permitted, on condition that the work credits the atlas; the authors asked to see the
finished model. The email stays with the owner and is not committed (it carries personal
contact details). It covers what was asked: 3D geometry and volumes derived from the
images, and the slices as inputs to that model. The owner reads it as also covering
serving the atlas's own images from this site (a recall deck, side-by-side comparison
with the specimen), always with the attribution below (`docs/realistic-anatomy.md` §13,
RA-O1, 2026-10-07). Any UW image committed to the repo gets its own row in a section
for it here.

**Attribution** (show wherever the specimen is displayed): *Specimen CT derived from
Interactive CT Sinus Anatomy, University of Washington Department of Radiology
(uwmsk.org/sinusanatomy2), used with the authors' permission.*

**What this is not.** The atlas was published as a screen capture of a bone-window display.
It is not a DICOM export. The volume values are therefore 8-bit display levels, not HU
(`ssb/ct/ct.json` gives an approximate inverse). The scale is inferred from the acquisition
geometry and cross-checked against anatomy, with the method and uncertainty in
`registration.json`. Segmentation is semi-automatic, grown from UW's arrow tips; it is
`draft` like the rest of SSB, and the reconstruction method sets its limits. The scan has no
contrast. Vessels and nerves show only where bone encloses them, or where orbital fat outlines
them. Elsewhere their course is inferred, and the pipeline marks those points in its own output.

### Derived files

| File | What | Made by |
|---|---|---|
| `ssb/ct/ct.u8.gz`, `ssb/ct/ct.json` | the axial display volume resampled to 0.5 mm in the RAS frame (`docs/ssb.md` §4), cropped to the sinonasal / ventral skull base region, external face masked except the nose | `tools/ssb-pipeline/uw/specimen.py`, then `normalize.py` (the nose is unmasked from the raw stack by `nose.py`) |
| `ssb/ct/labels.u16.gz`, `ssb/geometry/labels.json` | named air spaces on the same grid | `specimen.py` |
| `ssb/geometry/landmarks.json` | landmark coordinates, RAS mm | `specimen.py` |
| `ssb/models/*.glb.gz`, `ssb/models/packs.json` | surfaces of the named air spaces and the bony envelope; the `walls` pack: bone resection units, septum, turbinates and orbital contents | `tools/ssb-pipeline/uw/meshes.py` |
| `ssb/ct/labels.u16.gz` (indices from 19 on), `ssb/geometry/labels.json` | walls, septum, turbinates and orbits, added on voxels no air space holds | `tools/ssb-pipeline/uw/walls.py` |
| `ssb/geometry/sweeps.json` | centrelines and radii of the ICA, optic, maxillary, vidian and infraorbital nerves, nasolacrimal duct, sphenopalatine and ethmoidal arteries | `tools/ssb-pipeline/uw/sweeps.py` |
| `ssb/ct/sdf-*.u8.gz`, the `sdf` key of `ssb/ct/ct.json` | distance fields (mm) to the ICA, optic nerve, AEA, anterior skull base and orbit | `tools/ssb-pipeline/uw/sdf.py` |
| `ssb/models/soft.glb.gz`, `lm.choanal-arch.M` and `lm.naris.R/.L` in `ssb/geometry/landmarks.json` | the septal mucosa surfaces (the nasal cavities' lining facing the septum unit); two landmarks derived from the labels and the volume (the nostrils are schematic offsets) | `tools/ssb-pipeline/uw/softtissue.py` |
| `ssb/models/nose.glb.gz`, `s.nasal-vestibule.<side>` in `ssb/ct/labels.u16.gz` and the `core` pack, `s.internal-nasal-valve.<side>` in `ssb/geometry/landmarks.json`, the `standard.nose` block of `ssb/ct/ct.json` | the specimen's own nose: the skin surface (tissue against outside air between the alar-facial grooves), the vestibule label, the internal valve (the narrowest coronal section of the airway) | `tools/ssb-pipeline/uw/nose.py`, `normalize.py` (ST6) |
| `ssb/reference/specimen-relations.json` | the graph's spatial claims tested against this specimen (numbers only) | `tools/ssb-pipeline/uw/relate3d.py` |

Regeneration steps and the order to run the scripts are in `tools/ssb-pipeline/README.md`.
