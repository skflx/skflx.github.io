# tools/ssb-pipeline — offline data pipelines for SSB

Never run in CI and never shipped. Outputs that the repo keeps are committed;
inputs that must not be republished (third-party images) go to `incoming/`,
which is gitignored.

    python3 -m venv .venv && .venv/bin/pip install -r tools/ssb-pipeline/requirements.txt

## `uw/` — UW Interactive CT Sinus Anatomy

    .venv/bin/python tools/ssb-pipeline/uw/fetch.py     # site → incoming/uw-sinusanatomy2/ (≈ 950 files)
    .venv/bin/python tools/ssb-pipeline/uw/extract.py   # labeled frames → ssb/reference/uw-sinusanatomy2/slices.json
    python3 tools/ssb-pipeline/uw/relate.py             # slices + graph → relations.json (stdlib only)

`relate.py` needs only the committed `slices.json`, so the graph's spatial
claims can be re-tested after any content change without the images.
`orient.json` records the verified image orientation; `vocab-extra.json` maps
terms the crosswalk lacks to graph ids. Method and limits:
`ssb/reference/uw-sinusanatomy2/README.md`.
