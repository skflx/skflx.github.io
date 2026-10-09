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

Resegmentation ground truth (WP RS0; numpy + scipy only, no crawl):

    python3 -I tools/ssb-pipeline/uw/score.py split      # -> ssb/reference/uw-sinusanatomy2/split.json (made once; committed)
    python3 -I tools/ssb-pipeline/uw/score.py            # baseline: today's labels, as-scanned and served; --labels DIR for candidates

`split.json` is the fixed 70/30 seed/held-out division of the head-A arrow tips; segmentation reads seed tips only.
`score.py` prints the held-out tip hit rate per structure with Wilson CIs, and the topology checks. Do not rerun
`split` unless the ground truth itself is meant to move (it moves every later score). Method, caveats (the current
labels were grown from these tips, so the baseline is optimistic) and `--tol`: the script's docstring;
`docs/realistic-anatomy.md` §7.1.

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

Dissection states (procedure mode; `docs/ssb.md` §5.8): `uw/dissection.json` is Opus's data, the units
(rules over the base's labels, landmarks and distance fields), the step → unit map of each procedure, and the
FESS and EEA corridors. WP P1b adds `uw/dissect.py`, which evaluates it into `ssb/states/` and per-state lining
packs; until then the file is data only, checked by hand against `ssb/content/` (the rule is in §5.8).

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

The head as scanned (not mirrored, WP RA3b) is a separate build into `ssb/anatomy/scanned/`:

    .venv/bin/python tools/ssb-pipeline/uw/normalize.py --base scanned   # about three minutes; deterministic

It runs `walls`, `meshes`, `sdf`, `softtissue --per-side`, `lining` and `nose pack` from a scratch copy of this directory under
`incoming/_recon/scanned-root/`, so the standard specimen's files are never read or written, and writes the `scanned` entry of
`ssb/anatomy/index.json` from the numbers it prints. A stage-D product that fails its gate on a side is left out and listed as `absent`
(nothing is loosened); the vestibule keeps each side's largest component. It prints a label transition table (as-scanned label -> scanned label, voxel counts, per step) and stops if tissue became an air label or the reverse. Method: the `normalize.py` docstring.

`normalize.py all` needs `fetch.py` to have run (the raw stack) and takes about four minutes. The region, the centring offset, the valve
plane and the vestibule are described in `nose.py`'s docstring and printed as the `ST6 1..5, 7` lines. `nose.py` with no argument is E1b's
nostril landmark (`--write` stores it).

Station poses (P3; needs only the committed `ssb/`, after `dissect.py`):

    python3 tools/ssb-pipeline/uw/stations.py check    # re-test every committed pose (intact and byState), change nothing
    python3 tools/ssb-pipeline/uw/stations.py solve    # print the table (--search forces the search, --only=<station id>)
    python3 tools/ssb-pipeline/uw/stations.py write    # rewrite `byState` and the two 2.7 mm poses in ssb/geometry/stations.json

Ports `js/ssb/scope.js` (shaft direction, `frameOf`, `shaftClearance`) onto each state's volume (the base with its patch applied) and
solves P3's table in `docs/ssb-roadmap.md`: the prototype pose first; if it is not free, tip-in-air and in view, a grid over depth, yaw and
pitch (2 units, then 0.5) with roll in 15 degree steps, ranked by the share of 161 rays that hit a wanted label or pass through a wanted
air space, then by less mucosal contact. Left is the mirrored right pose and is verified on the left. Needs numpy, scipy and the
`meshes.py` imports. A station that cannot be posed is reported, never forced. `solve` takes about a minute.

Reconstruction, stage F (dissection states for procedure mode, P1b; needs only the committed `ssb/`, run last):

    python3 tools/ssb-pipeline/uw/dissect.py    # dissection.json -> ssb/states/{index.json,<key>.ssbp.gz}, ssb/models/lining-<key>.glb.gz

Evaluates the rules in `uw/dissection.json` (Opus's data; never edited here) on the standard specimen, a right-side unit on r >= 0
and mirrored, a midline unit whole, with the guard (ICA, optic nerve, AEA fields, orbit) applied before and after the mirror. One
state per distinct cumulative unit list at a procedure step or corridor position, keyed by the first 10 hex of the SHA-256 of the
list (one unit per line). Per state: a patch (docs/ssb.md 5.8: u32 header length, JSON header, one u16 box per side R, L and midline;
0 = unchanged, else the new label, the display becoming `ctFill`), a lining pack (`lining.py`'s method on the state's air, plus
a remnant mesh `<id>.<side>@<cut>` for every wall label the state cuts partly; wall nodes it removes entirely are `hides` in the
index). The state linings are listed in `ssb/states/index.json` and are **not** in `packs.json` (the Specimen stage loads every pack
that file lists, so they are loaded on demand from the index). Prints one table: per unit, voxels against `measured`; per state,
carved voxels, guard minima per field and side, bytes; and the antrostomy window's extent. `normalize.py all` runs it last. About
three minutes; a rerun is byte-identical. `--no-lining` (development) skips the linings.

`relate.py` needs only the committed `slices.json`, so the graph's spatial
claims can be re-tested after any content change without the images.
`orient.json` records the verified image orientation; `vocab-extra.json` maps
terms the crosswalk lacks to graph ids. Method and limits:
`ssb/reference/uw-sinusanatomy2/README.md`.

## `nasalseg/` — population asymmetry (NasalSeg, CC BY 4.0)

    # download NasalSeg.zip from https://zenodo.org/records/13893419 into incoming/nasalseg/, unzip to incoming/nasalseg/data/
    .venv/bin/python -I tools/ssb-pipeline/nasalseg/stats.py [--png-dir DIR]   # -> ssb/anatomy/population/nasalseg.json

Reads the archive's NRRD images and labels (no extra dependency: the reader is in the script), de-duplicates
byte-identical cases, takes geometry from the image header where a label header disagrees, assigns sides by
position, and measures the maxillary sinuses and nasal cavities. `review.json` holds the per-case visual verdicts
(clear / thickening / opacified / unsure) that define the clear subset; `--png-dir` writes the review sheets they
were made from. It also measures head A (as scanned, from git) the same way. Method and limits: the script's
docstring; results and their reading: `docs/realistic-anatomy.md` §4.4; provenance: `ssb/LICENSE-data.md`.

    .venv/bin/python -I tools/ssb-pipeline/nasalseg/meanshape.py   # POP2b: -> ssb/models/population.glb.gz, packs.json, nasalseg.json "meanShape"

`meanshape.py` (after `stats.py` and `stats.py profiles`) aligns the clear subjects rigidly onto the standard specimen and
writes the population maxillary sinus (the region at least half of them occupy) as a ghost pack, loaded on demand by the
Population panel; it prints the alignment RMS and each side's volume beside the population median, and writes nothing if
either exceeds its limit. Method and limits: the script's docstring; `docs/ssb.md` §5.10.

## `intake/` — 16-bit heads (WP IN1)

    .venv/bin/python -I tools/ssb-pipeline/intake/intake.py convert --in head.nii.gz --landmarks lm.json --name head01 [--spacing 0.5]
    .venv/bin/python -I tools/ssb-pipeline/intake/intake.py selftest

A NIfTI-1 or NRRD CT in HU -> `incoming/<name>/{ct.json,ct.i16.gz}` (dtype int16, `values.kind` HU, `levels` from head A's
display levels) in the docs/ssb.md 4 frame, from landmark correspondences (`{"landmarks": [{"id", "src", "dst"}]}`, at
least three, rigid fit, RMS gate). Writes nowhere but `incoming/`; DICOM is not supported (needs `pydicom`: an owner
decision). Method and limits: the script's docstring.
