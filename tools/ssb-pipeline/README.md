# tools/ssb-pipeline — offline data pipelines for SSB

Never run in CI and never shipped. Outputs that the repo keeps are committed;
inputs that must not be republished (third-party images) go to `incoming/`,
which is gitignored.

    python3 -m venv .venv && .venv/bin/pip install -r tools/ssb-pipeline/requirements.txt

## `uw/` — UW Interactive CT Sinus Anatomy

    .venv/bin/python tools/ssb-pipeline/uw/fetch.py     # site → incoming/uw-sinusanatomy2/ (≈ 950 files)
    .venv/bin/python tools/ssb-pipeline/uw/extract.py   # labeled frames → slices.json (read by labels3d.py; not committed)

Reconstruction, stage A (feasibility, registration, scale; needs the fetched images):

    .venv/bin/python tools/ssb-pipeline/uw/volume.py     # stacks -> incoming/.../_recon/*.npy; framing and scout checks
    .venv/bin/python tools/ssb-pipeline/uw/register.py   # sagittal + coronal vs axial (--refit, --png-dir DIR); slow
    .venv/bin/python tools/ssb-pipeline/uw/scale.py      # mm per pixel: acquisition geometry, globes, dens, skull
    .venv/bin/python tools/ssb-pipeline/uw/labels3d.py   # arrow tips -> 3D, axial/sagittal agreement, RAS frame

All four write sections of `uw/registration.json` (numbers only, no pixels); each
script's docstring states its method. The coronal stack is a different specimen
from the axial and sagittal stacks (`registration.specimen_identity`).

Resegmentation ground truth (WP RS0; numpy + scipy only, no crawl):

    python3 -I tools/ssb-pipeline/uw/score.py split      # -> split.json (the held-out seed/tip division; committed under tools/ssb-pipeline/uw/reference/)
    python3 -I tools/ssb-pipeline/uw/score.py            # baseline: today's labels, as-scanned and served; --labels DIR for candidates

`split.json` is the fixed 70/30 seed/held-out division of the head-A arrow tips; segmentation reads seed tips only.
`score.py` prints the held-out tip hit rate per structure with Wilson CIs, and the topology checks. Do not rerun
`split` unless the ground truth itself is meant to move (it moves every later score). Method, caveats (the current
labels were grown from these tips, so the baseline is optimistic) and `--tol`: the script's docstring;
`docs/ssb.md` §14, R7.1.

Resegmentation harness (WP RS1; needs the venv and the crawl, writes only the gitignored `incoming/_rs/`, never `ssb/`):

    .venv/bin/python -I tools/ssb-pipeline/uw/reseg.py all   # work -> air -> export -> score (stages also run singly; `selftest` tests the guard)

`reseg.py` rebuilds `specimen.py`'s air compartments on the native 0.3437 x 0.3437 x 0.625 mm grid from the SEED tips of
`split.json` only (`seed_tips` drops held-out rows unread and `guard` raises on any other tip), exports a candidate on the
served 0.5 mm grid to `incoming/_rs/candidate/` (laid out like `ssb/ct` + `ssb/geometry/labels.json`), and scores it with
`score.py --labels DIR --declared tools/ssb-pipeline/uw/rs/declared.json` at `--tol 1` and `--tol 6` beside today's
as-scanned labels (`score-RS1.json`). `rs/declared.json` is the label set RS commits to, each id with the step that adds it
(a `null` id is a term the graph lacks, for Opus); `--declared` reports coverage over it and identity over its done ids.
The candidate is in the as-scanned frame (the tips' frame), not the standardized one. Method and limits: the script's
docstring; `docs/ssb.md` §14, R7.2 and WP RS1.

Lamella sheets (WP RS2; same inputs and sandbox as above, `reseg.py sheets|export2|score2`, or `rs2` for the three):
`rs/sheets.json` holds the sheetness filter's parameters and, per lamella, the rules that name a sheet (the uncinate process,
basal, bullar and superior-turbinate ground lamellae, the sphenoid face and the intersinus septum), every number a named
parameter. A sheet is named only when exactly one candidate per side meets every rule; otherwise it stays unassigned and the
per-rule scores of its best candidates are in `incoming/_rs/sheets-report.json`. `--rules ALT.json` runs the same code on
another rule file (a what-if for review). Outputs are candidates under `incoming/_rs/` (`candidate-RS2/`, `score-RS2.json`,
`review/*.png`, each PNG listing the UW stack frame and FG1 figures to compare with); nothing in `ssb/` changes.

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
`ssb/ct`, `ssb/geometry` and `ssb/models` is in `ssb/LICENSE-data.md`, and so is the provenance of the
UW ground-truth inputs in `tools/ssb-pipeline/uw/reference/uw-sinusanatomy2/`.

Reconstruction, stage C (resection units, neurovascular sweeps, proximity fields; run after stage B):

    .venv/bin/python tools/ssb-pipeline/uw/walls.py      # compartments + walls -> ssb/ct/labels.u16.gz, labels.json
    .venv/bin/python tools/ssb-pipeline/uw/meshes.py     # now also ssb/models/walls.glb.gz
    .venv/bin/python tools/ssb-pipeline/uw/sweeps.py     # -> ssb/geometry/sweeps.json, sweeps.meta.json
    .venv/bin/python tools/ssb-pipeline/uw/sdf.py        # -> ssb/ct/sdf-<id>.u8.gz, "sdf" key of ct.json
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
(0.1 mm per level, clamped at 25 mm). Check images (`--png-dir`): `reconC-walls-*.png`,
`reconC-mesh-walls.png`, `reconC-sweeps-*.png`.

Reconstruction, stage D (soft tissue; needs only the committed `ssb/`, not the crawl; run after stage C):

    .venv/bin/python tools/ssb-pipeline/uw/softtissue.py      # -> ssb/models/soft.glb.gz, ssb/geometry/charts.json,
                                                              #    lm.choanal-arch.M and lm.naris.R/.L in landmarks.json
    .venv/bin/python tools/ssb-pipeline/uw/lining.py          # -> ssb/models/lining.glb.gz (the open airway lining, ST1b; fins dropped by `meshes.py` `clean_lining`, L1); run after meshes.py and softtissue.py, which rewrite packs.json
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

Station poses (the intact standard specimen; needs only the committed `ssb/`):

    python3 tools/ssb-pipeline/uw/stations.py check    # re-test every committed pose in the stations table, change nothing
    python3 tools/ssb-pipeline/uw/stations.py solve    # print the table (--search forces the search, --only=<station id>)
    python3 tools/ssb-pipeline/uw/stations.py write    # rewrite the two 2.7 mm poses in ssb/geometry/stations.json

Ports `js/ssb/scope.js` (shaft direction, `frameOf`, `shaftClearance`) onto the standard specimen's volume and
solves the two rows of TABLE in `stations.py`: the prototype pose first; if it is not free, tip-in-air and in view, a grid over depth, yaw and
pitch (2 units, then 0.5) with roll in 15 degree steps, ranked by the share of 161 rays that hit a wanted label or pass through a wanted
air space, then by less mucosal contact. Left is the mirrored right pose and is verified on the left. Needs numpy, scipy and the
`meshes.py` imports. A station that cannot be posed is reported, never forced. `solve` takes about a minute.

`relate.py` needs `slices.json`, `labels.json` and `crosswalk.json` (in `uw/reference/uw-sinusanatomy2/`) and the graph in
`ssb/content/`, so the graph's spatial claims can be re-tested after any content change without the images. `orient.json` records the verified image orientation; `vocab-extra.json` maps terms the
crosswalk lacks to graph ids. Its `canon()` is imported by `labels3d.py` and `score.py`, so it stays.

## `intake/` — 16-bit heads (WP IN1)

    .venv/bin/python -I tools/ssb-pipeline/intake/intake.py convert --in head.nii.gz --landmarks lm.json --name head01 [--spacing 0.5]
    .venv/bin/python -I tools/ssb-pipeline/intake/intake.py selftest

A NIfTI-1 or NRRD CT in HU -> `incoming/<name>/{ct.json,ct.i16.gz}` (dtype int16, `values.kind` HU, `levels` from head A's
display levels) in the docs/ssb.md 4 frame, from landmark correspondences (`{"landmarks": [{"id", "src", "dst"}]}`, at
least three, rigid fit, RMS gate). Writes nowhere but `incoming/`; DICOM is not supported (needs `pydicom`: an owner
decision). Method and limits: the script's docstring.
