# SSB — wave 2 handoff (Sonnet)

Delete this file when wave 2's Sonnet work packages are merged (git history
keeps it).

## State (2026-10-03)

Wave 1 was built by a Sonnet-class model and then verified by Opus. The
verification found real problems and wrote corrective work packages (WPs).
All of it is recorded in `docs/ssb-roadmap.md`: §4 "Opus verification of
wave 1" (the findings, with numbers), §4 "Wave 2" (the lanes), §5 (the WPs).
Owner decisions O1–O5 are made (§2). The flap contract (`docs/ssb.md` §5.7)
and the sphenoid diorama spec (§6.1) were revised; build to them **as they
now stand**, not to the first-pass text in git history.

## How to work

- **Protocol: `docs/delegation.md` §3**, one WP at a time: read `CLAUDE.md`
  (auto-loaded), then only the WP's **Read** list; stay inside **Touch**;
  run every **Accept** command plus the standard checks; docs pass; set
  the WP to `review` in the roadmap with a one-line result; open a PR;
  never merge.
- **Branch** `claude/<wp-id>-<slug>` from `master`. If the owner has not yet
  merged `claude/wave-1-sonnet`, branch from it instead and say so in the PR.
- **Stop and report** (the WP's **Escalate**, or the hard stops in
  `docs/delegation.md` §3) rather than making an anatomy call, weakening a
  test, or touching a file outside **Touch**. Anatomy, sources and
  `verified` flags are not yours: if a number you need is not in the WP,
  the roadmap or the graph, stop.
- **Python** (pipeline WPs): make the venv **outside the repo** or in
  `.venv/` (gitignored), `pip install -r tools/ssb-pipeline/requirements.txt`.
  The UW site (`http://uwmsk.org/sinusanatomy2/`) was reachable from a
  session on 2026-10-03; raw downloads go to `tools/ssb-pipeline/incoming/`
  (gitignored) — never commit them.
- After any change under `js/`, `css/`, `ssb/`: `node tools/stamp-assets.mjs`.
  Standard checks: `node tools/check-data.mjs`, `node tools/test-ssb.mjs`
  (or `--only <section>` while iterating, the full suite before the PR),
  `node tools/smoke-pages.mjs`.

## Lanes — one session per lane, in this order

WPs inside a lane share files, so they run in order. Lanes run in parallel,
except for the two cross-lane waits marked ⏸.

| Lane | WPs, in order |
|---|---|
| **A — content and dioramas** | ~~ST0d~~ → ~~D2~~ → ~~D2a~~ (lane done; C1 is wave 3) |
| **B — pipeline, then the overlay** | ~~E1b~~ → ~~ST2b~~ (partial) → ~~N1~~ standard specimen → ~~ST2c~~ floor mucosa → ~~ST1b~~ open airway lining → **ST6** external nose → **ST4d** waypoint corrections → **ST5** soft-tissue panel + NSF overlay |
| **C — scope runtime** | ~~E2b~~ → ~~E3~~ → ~~E4~~ → ~~E3b~~ (lane done until E6) |

*Re-planned at CP-2a (2026-10-03, `docs/ssb-roadmap.md` §4):* the owner
asked for a normal, symmetric first release (O6). N1 builds it; every
left-side escalation of this wave (left ostium reach, left ostium margin,
left floor unit) is resolved by it, so do not work around a left-side gap
in the as-scanned data — report it.

Not yours: **E5** station poses (Opus). ST6 is specced (CP-2b) and is lane B's.

Prompt for each session (pick Sonnet as the model):

```
Read docs/ssb-sonnet-handoff.md, then execute lane <A|B|C>: work packages
in order, each per docs/delegation.md §3 — one branch and one PR per WP,
do not merge. Where the lane waits on another lane's WP, check whether it
is merged; if not, stop and report.
```

## Merging lanes

The stamps (`?v=` in `ssb.html`, `js/ssb/main.js` and the module imports,
`js/ssb/stamps.js`) conflict whenever two lanes touch `js/`. Resolve a
stamp-only conflict by taking either side, then `node
tools/stamp-assets.mjs` and `node tools/check-data.mjs`; never hand-pick
hashes. Branch each WP from current `master`; stack on another lane's
branch only when the WP truly needs its files, and say so in the PR.

## Traps the verification found (read before starting)

- **The as-scanned left side is anomalous** (closed sphenoid ostium, small
  floor unit, missing bulla label). Until N1 lands, a left-side failure is
  expected; N1 replaces the left with the right's mirror.
- **E3's Accept is a search, not CP-1's pose.** CP-1's pose (yaw -3, pitch
  15) is blocked by its own rule. Find the pose by searching yaw and pitch
  on a 1° grid, then pin what you find. The shaft is 4 mm (radius 2.0, O4).
- **The scope image saturates** (E2b); ostia and choanae are open since
  ST1b (the `lining` pack, drawn from inside). If a white wedge turns out
  to be a mesh, report which node.
- **The NSF superior incision starts at the ostium's inferior margin**
  (O5), measured by ST2b — not the landmark's centroid, and there is no
  `ostium_clearance` parameter any more.
- **The pedicle test must stay non-circular**: ST4d places the posterior
  septal artery from `m.psa-to-sphenoid-ostium` (9.3 mm below the ostium);
  never derive it from the flap construction.
- **D2 rule 4**: the Onodi cell is medial and/or superior to the optic
  nerve (the first pass had it lateral).
- **Content edits (ST0d) are exact texts given in the WP.** Do not add or
  strengthen claims; report a mismatch instead of rewriting it.
