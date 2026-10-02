# SSB — Opus verification handoff

Delete this file when the verification below is done (git history keeps it).

State: PR #95 merged (`7cf2af4`); owner decisions O1–O3 recorded in
`docs/ssb-roadmap.md` §2 (O1 both; O2 entry anatomy, full framework = ST7;
O3 yes). Everything in wave 1 was executed by one Sonnet-class model,
**including the work the roadmap assigns to Opus** (CP-1, ST0, ST3, ST4b, D1).
Nothing has had independent review. Medical correctness is the owner's
(`verified` is theirs alone, `docs/decisions.md` §7).

## Read first
`CLAUDE.md` (SSB section) → `docs/ssb.md` (§3 endoscope, §5.7 soft tissue and
the flap overlay contract, §6.1 sphenoid diorama) → `docs/ssb-roadmap.md`
(§1, the CP-1 result, wave 2) → `docs/delegation.md`.

## Verify, in this order
1. **CP-1 result** (roadmap, "CP-1 result"): re-run `node tools/test-ssb.mjs`
   and look at the scope and septal surfaces on screen (both sides). Judge the
   four flags (a)–(d): `lm.naris` placement (probably 5–10 mm too far back;
   the sagittal stack shows the vestibule at rows 280–298, cols 107–139,
   slice 62), 3 vs 4 mm scope, choanal arch / posterosuperior septal hole as
   anatomy vs segmentation limit, pose correctness.
2. **E3 revised spec** (block on bone, display ≥150, 1.5 mm shaft ring):
   agree or change before ST5/E3 are built on it.
3. **ST0 content** (`ssb/content/*.json`, `sources.json`): all `draft`.
   Adversarially check claims against their cited sources, especially the
   Chiu ESS atlas ch. 31 rewrites (`p.inferior-turbinate-flap`,
   `p.middle-turbinate-flap`; `m.itf-area` is second-hand). PubMed matches were
   checked by PMID/DOI, not by reading full texts. Radiopaedia was read as
   text only, no scan pixels. Omitted for want of a source: angular artery,
   PEA septal branch, nasal cartilages, NSF length/width by design.
4. **ST3 flap spec** (`docs/ssb.md` §5.7): the default full NSF is 7.5 / 8.5 cm²
   against literature 17.12 and atlas max ~25.1. Unresolved whether the
   literature figure includes floor mucosa; defaults `top_margin` 15,
   `ostium_clearance` 2, `window` 5 are schematic.
5. **ST4b vessel waypoints** (`tools/ssb-pipeline/uw/sweeps-soft.json`): only the
   PSA start, AEA entry (7.35 mm behind the middle turbinate head) and the
   nasopalatine end (39.6 mm in front of the choanal arch) are numeric;
   courses between are straight chart segments, schematic.
6. **D1 sphenoid spec** (`docs/ssb.md` §6.1): rule 2's 0.5 circumference
   threshold (from `v.ica-protrusion`), rule 4's DeLano type 4 geometry, and
   one-parameter-at-a-time presets.

## Then
Wave 2 (roadmap): Sonnet — ST0c, ST5, E3, E4, D2; Opus — E5 after E3, ST6
spec (entry anatomy; specimen skin + schematic cartilage). Raise any finding
by editing the roadmap, not by silently fixing a first-pass decision.
