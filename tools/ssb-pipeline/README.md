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

`relate.py` needs only the committed `slices.json`, so the graph's spatial
claims can be re-tested after any content change without the images.
`orient.json` records the verified image orientation; `vocab-extra.json` maps
terms the crosswalk lacks to graph ids. Method and limits:
`ssb/reference/uw-sinusanatomy2/README.md`.
