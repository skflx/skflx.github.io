# SSB specimen data — provenance and permission

Every file listed here is derived from one source: its dataset, the permission it is
published under, and how it was made. `docs/ssb.md` §5.1 requires this record for each
derived file. A replacement specimen gets its own section here.

## Reference specimen `uw-axial-sagittal`

**Source.** *Interactive CT Sinus Anatomy*, University of Washington Department of
Radiology, Seattle, at http://uwmsk.org/sinusanatomy2/. Authors: Sung E. LoGerfo, M.D.;
Michael L. Richardson, M.D.; Robert W. Dalley, M.D.; Yoshimi Anzai, M.D. (c. 2009–2010).

**Case.** The atlas's axial stack (175 slices) and sagittal stack (137 slices). They are one
adult head: the sagittal images are reformats of the axial acquisition. UW's coronal stack
shows a different head and is **not** used here (see
`tools/ssb-pipeline/uw/registration.json`, `registration.specimen_identity`). The atlas
shows normal anatomy only (n = 1). It carries no patient identifiers, and the external face
is masked in the published volume.

**Permission.** The SSB project owner reports that the authors permit publishing 3D
geometry and volumes derived from the atlas images. This was confirmed by the owner and
recorded on 2026-09-30 (`docs/ssb.md` §13). The authors' written permission has yet to be
filed; add it to `ssb/reference/uw-sinusanatomy2/` when it arrives. The atlas's own images
and page text are not redistributed. `ssb/reference/uw-sinusanatomy2/` holds text and
label positions only.

**Attribution** (show wherever the specimen is displayed): *Specimen CT derived from
Interactive CT Sinus Anatomy (LoGerfo, Richardson, Dalley, Anzai; University of Washington
Department of Radiology), used with the authors' permission.*

**What this is not.** The atlas was published as a screen capture of a bone-window display.
It is not a DICOM export. The volume values are therefore 8-bit display levels, not HU
(`ssb/ct/ct.json` gives an approximate inverse). The scale is inferred from the acquisition
geometry and cross-checked against anatomy, with the method and uncertainty in
`registration.json`. Segmentation is semi-automatic, grown from UW's arrow tips; it is
`draft` like the rest of SSB, and the reconstruction method sets its limits. The scan has no
contrast. Vessels and nerves show only where bone encloses them, or where orbital fat outlines
them. Elsewhere their course is inferred, and `ssb/geometry/sweeps.meta.json` marks those points.

### Derived files

| File | What | Made by |
|---|---|---|
| `ssb/ct/ct.u8.gz`, `ssb/ct/ct.json` | the axial display volume resampled to 0.5 mm in the RAS frame (`docs/ssb.md` §4), cropped to the sinonasal / ventral skull base region, external face masked | `tools/ssb-pipeline/uw/specimen.py` |
| `ssb/ct/labels.u16.gz`, `ssb/geometry/labels.json` | named air spaces on the same grid | `specimen.py` |
| `ssb/geometry/landmarks.json`, `landmarks.meta.json` | landmark coordinates, RAS mm, with method per point | `specimen.py` |
| `ssb/models/*.glb.gz`, `ssb/models/packs.json` | surfaces of the named air spaces and the bony envelope; the `walls` pack: bone resection units, septum, turbinates and orbital contents | `tools/ssb-pipeline/uw/meshes.py` |
| `ssb/ct/labels.u16.gz` (indices from 19 on), `ssb/geometry/labels.json` | walls, septum, turbinates and orbits, added on voxels no air space holds | `tools/ssb-pipeline/uw/walls.py` |
| `ssb/geometry/sweeps.json`, `sweeps.meta.json` | centrelines and radii of the ICA, optic, maxillary, vidian and infraorbital nerves, nasolacrimal duct, sphenopalatine and ethmoidal arteries; per point whether it was detected in the CT, labelled by UW or inferred | `tools/ssb-pipeline/uw/sweeps.py` |
| `ssb/ct/sdf-*.u8.gz`, the `sdf` key of `ssb/ct/ct.json` | distance fields (mm) to the ICA, optic nerve, AEA, anterior skull base and orbit | `tools/ssb-pipeline/uw/sdf.py` |
| `ssb/models/soft.glb.gz`, `ssb/geometry/charts.json`, `lm.choanal-arch.M` and `lm.naris.R/.L` in `ssb/geometry/landmarks.json` | the septal mucosa surfaces (the nasal cavities' lining facing the septum unit) and their sagittal charts; two landmarks derived from the labels and the volume (the nostrils are schematic offsets, method in `landmarks.meta.json`) | `tools/ssb-pipeline/uw/softtissue.py` |
| `ssb/reference/specimen-relations.json` | the graph's spatial claims tested against this specimen (numbers only) | `tools/ssb-pipeline/uw/relate3d.py` |

Regeneration steps and the order to run the scripts are in `tools/ssb-pipeline/README.md`.
