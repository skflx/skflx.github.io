# tools/ssb-pipeline — offline data pipelines for SSB

Never run in CI and never shipped. Outputs that the repo keeps are committed;
inputs that must not be republished (third-party images) go to `incoming/`,
which is gitignored.

    python3 -m venv .venv && .venv/bin/pip install -r tools/ssb-pipeline/requirements.txt

## `uw/` — UW Interactive CT Sinus Anatomy

    .venv/bin/python tools/ssb-pipeline/uw/fetch.py     # site → incoming/uw-sinusanatomy2/ (≈ 950 files)
    .venv/bin/python tools/ssb-pipeline/uw/extract.py   # labeled frames → ssb/reference/uw-sinusanatomy2/slices.json
    python3 tools/ssb-pipeline/uw/relate.py             # slices + graph → relations.json (stdlib only)

Reconstruction, stage A (feasibility, registration, scale; needs the fetched images):

    .venv/bin/python tools/ssb-pipeline/uw/volume.py     # stacks -> incoming/.../_recon/*.npy; framing and scout checks
    .venv/bin/python tools/ssb-pipeline/uw/register.py   # sagittal + coronal vs axial (--refit, --png-dir DIR); slow
    .venv/bin/python tools/ssb-pipeline/uw/scale.py      # mm per pixel: acquisition geometry, globes, dens, skull
    .venv/bin/python tools/ssb-pipeline/uw/labels3d.py   # arrow tips -> 3D, axial/sagittal agreement, RAS frame

All four write sections of `uw/registration.json` (numbers only, no pixels); each
script's docstring states its method. The coronal stack is a different specimen
from the axial and sagittal stacks (`registration.specimen_identity`).

Reconstruction, stage B (the reference specimen the viewer loads; run after stage A):

    .venv/bin/python tools/ssb-pipeline/uw/specimen.py   # -> ssb/ct/{ct.json,ct.u8.gz,labels.u16.gz},
                                                         #    ssb/geometry/{labels,landmarks,landmarks.meta}.json
    .venv/bin/python tools/ssb-pipeline/uw/meshes.py     # ssb/ct + labels -> ssb/models/<pack>.glb.gz, packs.json
    node tools/stamp-assets.mjs && node tools/check-data.mjs

`specimen.py` resamples the axial volume into the RAS frame and masks the face. It then
grows the named air spaces from UW's arrow tips (marker watershed on air). It adds the
cuts the tips cannot give: the choanae (PNS plane), the frontal ostium (narrowest
cross-section), the sphenoid intersinus septum, and a basal-lamella **proxy** plane for
anterior versus posterior ethmoid. Finally it places landmarks. `meshes.py` reads the
committed volume back, so the meshes cannot drift from CT mode.

Both scripts are deterministic: gzip is written with mtime 0. `ssb/geometry/labels.json`
is append-only. Existing indices are reused and new names are appended, so never delete
the file once it is committed. Both scripts write their report to `registration.json`
(`specimen`, `meshes`). With `--png-dir DIR` they also write check images (label overlays,
mesh renders). A native-resolution copy of the volume stays offline in
`incoming/uw-sinusanatomy2/_recon/specimen-native.npz`. Provenance for everything under
`ssb/ct`, `ssb/geometry` and `ssb/models` is in `ssb/LICENSE-data.md`.

Reconstruction, stage C (resection units, neurovascular sweeps, proximity fields; run after stage B):

    .venv/bin/python tools/ssb-pipeline/uw/walls.py      # compartments + walls -> ssb/ct/labels.u16.gz, labels.json
    .venv/bin/python tools/ssb-pipeline/uw/meshes.py     # now also ssb/models/walls.glb.gz
    .venv/bin/python tools/ssb-pipeline/uw/sweeps.py     # -> ssb/geometry/sweeps.json, sweeps.meta.json
    .venv/bin/python tools/ssb-pipeline/uw/sdf.py        # -> ssb/ct/sdf-<id>.u8.gz, "sdf" key of ct.json
    .venv/bin/python tools/ssb-pipeline/uw/relate3d.py   # graph spatial claims vs the 3D specimen
    node tools/stamp-assets.mjs && node tools/check-data.mjs

`specimen.py` rewrites `labels.u16.gz` with the air spaces only, so rerun `walls.py` (and the rest of
stage C) after it; `ct.json`'s `sdf` key survives a `specimen.py` rerun. `walls.py` first assigns every
non-bone voxel to a compartment: the named air spaces flood their own mucosa, and seeds mark the orbit, the
intracranial space, the face, the retromaxillary soft tissue, the pharynx and the mouth. A marker watershed
on distance-to-bone then splits them where bone is, or at the narrowest neck where bone is too thin to see.
A wall is the bone (or the bare interface) whose two nearest compartments are the named pair, within a
thickness limit and on opposite sides. The septum and turbinates come from the airway itself. Which units are
proxies or orientation splits is listed in `registration.json` (`walls.notes`); the basal lamella stays a
proxy, because stage B's anterior/posterior ethmoid split is a plane. `sweeps.py` marks each centreline point
`detected` (a canal lumen with bone all round, or the optic nerve in orbital fat on a soft window), `labelled`
(a UW tip) or `inferred` (a stated rule between found points). Its docstring and `sweeps.meta.json` say which
is which, per sweep. The bone-window CT has no contrast: the cavernous ICA, the ethmoidal arteries and the
sphenopalatine artery beyond its foramen are inferred. `sdf.py` builds the HUD's five fields on a 1 mm grid
(0.1 mm per level, clamped at 25 mm). `relate3d.py` needs only `ssb/`. It compares regions, not centroids:
same-height cells for medial/lateral, and the same for the other two axes. It writes
`ssb/reference/specimen-relations.json`. Check images (`--png-dir`): `reconC-walls-*.png`,
`reconC-mesh-walls.png`, `reconC-sweeps-*.png`.

Reconstruction, stage D (soft tissue; needs only the committed `ssb/`, not the crawl; run after stage C):

    .venv/bin/python tools/ssb-pipeline/uw/softtissue.py      # -> ssb/models/soft.glb.gz, ssb/geometry/charts.json,
                                                              #    lm.choanal-arch.M and lm.naris.R/.L in landmarks.json
    .venv/bin/python tools/ssb-pipeline/uw/lining.py          # -> ssb/models/lining.glb.gz (the open airway lining, ST1b); run after meshes.py and softtissue.py, which rewrite packs.json
    .venv/bin/python tools/ssb-pipeline/uw/sweeps_soft.py --selftest   # the waypoint-sweep machinery, nothing written
    node tools/stamp-assets.mjs && node tools/check-data.mjs

`softtissue.py` meshes each nasal cavity's lining where it faces the septum wall unit, with a sagittal chart ((a, s) mm to R, a 1 mm grid, the cells where the surface folds are
flagged `unreliable`). Its `soft` pack is listed in `packs.json` (`s.septal-mucosa` is a graph id).
`lm.naris.R/.L` is the endoscope's provisional fulcrum (schematic offsets, replaced when the nose exists).
`specimen.py` rewrites `landmarks.json`, so rerun stage D after it. Then `sweeps_soft.py` runs from `softtissue.py`: it turns the waypoints in `uw/sweeps-soft.json`
(format in its docstring; empty until the soft-tissue vessels are specified) into sweeps on those charts and merges them into `sweeps.json`.

Reconstruction, stage E (the external nose, ST6; needs the raw crawl, because the face mask removed the nose):

    .venv/bin/python tools/ssb-pipeline/uw/nose.py unmask   # prints the region (grooves per level, voxels); writes incoming/_recon/nose-patch.npz
    .venv/bin/python tools/ssb-pipeline/uw/normalize.py all # patches and centres the nose, measures the valve, labels the vestibule, then nose.py pack
    .venv/bin/python tools/ssb-pipeline/uw/nose.py pack     # the `nose` pack from the committed volume and incoming/_recon/nose-region.npz (written by normalize.py)

`normalize.py all` needs `fetch.py` to have run (the raw stack) and takes about four minutes. The region, the centring offset, the valve
plane and the vestibule are described in `nose.py`'s docstring and printed as the `ST6 1..5, 7` lines. `nose.py` with no argument is E1b's
nostril landmark (`--write` stores it).

`relate.py` needs only the committed `slices.json`, so the graph's spatial
claims can be re-tested after any content change without the images.
`orient.json` records the verified image orientation; `vocab-extra.json` maps
terms the crosswalk lacks to graph ids. Method and limits:
`ssb/reference/uw-sinusanatomy2/README.md`.
