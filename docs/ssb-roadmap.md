# SSB roadmap — task board

What is done, what is next, who does it, and what waits on the owner.
Architecture: `docs/ssb.md`. How work is handed to a model and checked:
`docs/delegation.md`. Current state in prose: `WIP.md`. Realistic anatomy's work packages are in §3a (moved 2026-10-11).

Last updated 2026-10-11. Done work packages are one line each (§4). Their
specs and the checkpoint narratives (CP-1 to CP-4a) are in git history: the
last full version is commit `34af192`. Update the board in the same PR as the
work it records.

## 1. Status board

| Phase (`docs/ssb.md` §12) | State | Remaining |
|---|---|---|
| 0 Architecture, schema, validator, draft graph | done | — |
| 1 Walking skeleton, graph mode | done | — |
| 2 Variant lab | 3 of 4 dioramas | `lateral-wall` (later) |
| 3 Reference specimen | done | hand segmentation (owner, optional) |
| 4 Endoscope | rig, exposure, collision and HUD, CT along the scope, septum rule, station poses and flights done | 8 uncovered stations, all outside O7's corridors or intradural |
| 5 CT mode | done | — |
| 6 Procedure mode | P1–P4 done with P1b, P2, P3, DC1, POP2a/b, L1, ST4d, ST5 | NSF overlay in procedure mode (harvest, rotation, inset); Draf III, transpterygoid and transplanum states (no WP yet); owner review of the states |
| 7 Self-test | not started | T1 (deferred) |
| 8 Offline cache, performance | not started | image textures only if procedural materials fall short (`docs/ssb.md` §11) |
| 3c External nose and rhinoplasty framework (`docs/ssb.md` §6.2) | specced (ST7); deferred behind O7 | ST7b (ready) → ST7a → ST7c; ST7d; ST7e (O14 decided) |
| Realistic anatomy (design `docs/ssb.md` §14; sources `docs/realistic-anatomy.md`) | in progress (§3) | RS2c (critical path), then RP2 (owner fetch), RP3 (specced, waits on RP2), POP3, RA0d; then RS3–RS6, OP1, VB1/PB1, RA5 |
| ∞ Content | all `draft` | owner review (tier 1 first); backlog §6 |

## 2. Owner — decisions and actions

### Decided

Each as recommended, unless noted. Rationale: `docs/ssb.md` §13.

- **O1** External nose: specimen skin for naris and ala, cartilage as an overlay.
- **O2** Entry anatomy now; the full nasal framework later (ST7).
- **O3** Sonnet drafts content and checks citations, Opus reviews; Opus authors anything that places geometry.
- **O4** Model the 4 mm telescope; 2.7 mm selectable.
- **O5** The NSF superior incision starts at the floor of the sphenoid ostium, for every design.
- **O6** Normal before variant: right half mirrored, septum centred; anomalies carried by the left.
- **O7** Content priority: clear FESS anatomy and EEA-to-sellar/clival anatomy first; other content waits. Problems in existing entities are flagged, not fixed.
- **O8** Framework defaults mixed by population, each labelled; modal variant classes.
- **O9** A population reference beside the head (percentiles, median profile, mean-shape ghost); a deformed head only later.
- **O10** Posterior septectomy 15 mm, from the choanal arch up. Inferior limit still to confirm (below).
- **O11** FESS on both sides at once; one dissected side beside an intact one later.
- **O12** SEG1 (NasalSeg-trained voxel check): not now.
- **O13** Mucosa toggle: decongested · as scanned · congested. Inflammatory edema is a condition.
- **O14** Where the nasal framework is drawn: **both, lab first** (variant lab, then fitted under the specimen's skin and nasal bones). Decided 2026-10-11, as recommended. Unblocks the fit, ST7e, after ST7c and ST7d.
- **RA-O8** (realistic anatomy): batch 3 is planned only after batches 1–2 are verified. Decided 2026-10-11, as recommended.

### Open

- **RA-O7** Author names remain in git history before 2026-10-07. Recommended: leave history; rewrite only if the authors ask. (`docs/realistic-anatomy.md` §13.)
- **RP3, serve case material?** Whether any Radiopaedia volume or image is ever served. RP3 commits none. (`docs/ssb-roadmap.md` §3a, RP3 Owner line.)
- **RP3, pool into the population file?** Whether Radiopaedia entries may go into `ssb/anatomy/population.json`. Its share-alike licence (CC BY-NC-SA 3.0) would then cover that file.
- **Carried from `docs/ssb.md` §13:**
  - Strict CSP. Recommended: keep it; gzip first, then Draco's JS decoder. `'wasm-unsafe-eval'` only if the budgets fail.
  - Publish while `draft`. Recommended: yes, with visible unverified markers.
  - Name and URL (`SSB`, `ssb.html`) are a working title.
- **C1 flags** (owner, 2026-10-07: keep as flags; fix after FESS and EEA anatomy):
  - `c.kadish`: "(in the original system also cervical or distant metastasis)" is not supported; the original C has no metastasis (D is Morita's).
  - `c.dulguerov`: T3 "without dural invasion" is the modified system's wording, blended into the original.
  - `c.hyams`: grade III matrix and grade IV rosettes differ from the original table.
  - `c.kadish` / Morita: the "32 vs 15 patients" split is not in the Morita abstract.
  - `c.jna-radkowski`: IIB, IIC, IIIA and IIIB wording differs from an open reproduction; the original's criteria were not readable.
  - `c.infraorbital-canal`: type 2/3 wording, "on coronal CT" and "larger sinuses" are not in the cited Ference abstract.
  - `s.petrosphenoidal-ligament`: insertion given as "lateral dorsum sellae"; sources say the posterior clinoid process.
  - `dz.smarcb1-deficient-carcinoma`: "no feature separates it from SNUC" on CT, with no source.
  - `s.gyrus-rectus`: "medial to the olfactory sulcus and tract" rests on a chapter citation only.
  - Back-links not yet added: ICA and Meckel's cave to the parasellar ligaments and carotid cave; gyrus rectus to the olfactory sulcus; the cellulitis conditions to `s.orbital-septum`; `dz.subperiosteal-orbital-abscess` to `m.spoa-drainage-volume-threshold`.
  - Detail: skflx/skflx.github.io#117.

### Owner actions

- **P1 checks** on the dissected states (review links in §5):
  - The uncinectomy opens the infundibular trough; the natural ostium appears with the antrostomy (`docs/ssb.md` §5.8).
  - Antrostomy window: 18.5 × 9 mm on the prototype; 19 × 9.5 mm pinned at CP-3.
  - Sellar opening's lateral limit: the ICA tube (29 % inferred), plus 1 mm.
  - Confirm the choanal-arch inferior limit of the posterior septectomy (O10).
- **Flap and asymmetry views:** `ssb.html#tier=3&flap=full.R` (flap overlay) and `ssb.html#anat=scanned` (asymmetry note).
- **ST6 items:** the valve plane at A −10 (glance at it on CT); whether the superior labial branch is drawn into the columella (it stays truncated at the valve plane until you say).
- **AEA–PEA spacing:** 21 mm in this specimen against 12 mm in the population; the PEA is inferred.
- **Tier-1 FESS anatomy and the two dioramas' schematic proportions:** flip `review` to `verified` only where right. Nothing is `verified` yet. In this repo, `verified` on a source means exists-as-cited, not supports-the-claim.
- **Figure depictions and captions** (Fig. 2 and the Larynx): schematic; check against the owner's sources (`docs/decisions.md` §7).
- **Radiopaedia (RP2):** veto any pick in `ssb/reference/radiopaedia/cases.json` (`_meta.pick`), then open each in your browser, save its stack to `tools/ssb-pipeline/incoming/radiopaedia/<rID>/` (gitignored; `docs/realistic-anatomy.md` §4.3), and fill the "owner reads" fields.
- **Optional:** full texts of Daniel & Palhazi 2018, Daniel 2014, Çavuş Özkan 2020 and Letourneau & Daniel 1988, and a sourced cephalic-malposition threshold (ST7 sources); hand segmentation in 3D Slicer, or a contrast CT.

## 3. Open work packages

**Deferred behind O7** (clear FESS and sellar/clival anatomy first): T1, ST7 (below), NSF in procedure mode (harvest, rotation, inset; no WP spec yet), the Draf III, transpterygoid and transplanum states (no WP spec yet), more pathology content.

**ST7 track** (`docs/ssb.md` §6.2; WPs in §5) — **deferred behind O7** (FESS and sellar/clival anatomy first); when it resumes: lane A runs ST7b
(kit only, no shared files with the other lanes except
`tools/test-ssb.mjs`), then ST7a once ST6 is merged (it maps the graph's
new `skin` kind onto ST6's material), then ST7c; C1 batches and ST7a both
append to `sources.json`, so whichever merges second keeps both sides.
Lane B adds ST7d after ST5. CP-ST7a reviews ST7a's content; CP-ST7c
reviews ST7b and ST7c, writes ST7e's final spec and plans the
rhinoplasty model (R0).


### ST7 — Nasal framework: anatomy for a rhinoplasty model        [specced 2026-10-07] · Opus spec → Sonnet build · spec: `docs/ssb.md` §6.2
Owner decision O2 (2026-10-02): the atlas covers the whole nasal framework.
The spec (`docs/ssb.md` §6.2) builds it as the `nasal-framework` diorama —
framework, envelope in layers, vessels and nerves by layer, three computed
rules (tripod, dissection plane, thick skin) — shaped as the substrate of a
later rhinoplasty model, then fits it under the specimen's skin. Five WPs
and two checkpoints:

| WP | What | Who | Depends | Lane |
|---|---|---|---|---|
| ST7a | Graph content for the framework, envelope, vessels, nerves; vocabulary | Sonnet drafts → Opus review (CP-ST7a) | ST6 merged (the `skin` material kind) | A |
| ST7b | `kit.js`: `strip` solid, exact distance transform, marching cubes | Sonnet | — | A (first) |
| ST7c | The diorama, to §6.2, rules 0–13 | Sonnet | ST7a, ST7b merged | A |
| ST7d | The specimen's bony nose (nasal bone / frontal process labels, rhinion, sellion, piriform rim) and ST6's skin landmarks written | Sonnet | ST6 merged | B (after ST5) |
| ST7e | Fit on the specimen | Sonnet (spec finalized by Opus at CP-ST7c) | ST7c, ST7d; O14 = (b) or (c) | A |

Population and class defaults follow O8 (decided 2026-10-08: mixed and labelled, modal classes): the
spec's defaults stand until the owner says otherwise.

### ST7a — Nasal framework content        [todo: branch after ST6 merges] · Sonnet drafts → Opus review (CP-ST7a) · depends: ST6 merged
Goal: every id `docs/ssb.md` §6.2 names exists in the graph, sourced from
the PubMed records below, so the diorama (ST7c) builds on ids and cited
numbers only.
Read: `docs/authoring-ssb.md` (all); `docs/ssb.md` §6.2; this WP; the
abstracts of the sources below (PubMed E-utilities `efetch`, as ST0 did);
`ssb/content/nasal-maxillary-ppf.json` only to find the existing nose ids
and the house style.
Touch: new `ssb/content/external-nose.json`; `ssb/content/sources.json`
(new sources only; C1 batches also append — keep both sides of an append
conflict); `tools/ssb-content.mjs` (vocabularies: region `external-nose`;
kind `skin`; measurement and prevalence method `ultrasound`, `histology`,
`clinical`); `js/ssb/materials.js` (one `GRAPH_KIND` line: `skin` →
the `skin` material ST6 added); `docs/authoring-ssb.md` §6 (the same
vocabulary); in `nasal-maxillary-ppf.json`, **only** the `geo` field of
`s.nasal-bone`, `s.piriform-aperture`, `s.nasal-ala`, `s.columella`,
`s.lateral-nasal-artery`, `s.dorsal-nasal-artery`, `s.columellar-artery`,
`s.superior-labial-artery` (→ `"diorama"`); docs pass.
Don't: set `review` to anything but `"draft"`; set a source `verified:
true` before its PubMed match (the match is this WP's job: record PMID and
DOI from the record, never from this table without checking); edit an
existing entity's text; add coordinates, stations or pathways; write a
number the abstract does not give (`docs/authoring-ssb.md` §7.7) — if the
spec names a number its source's abstract lacks, report it.

*Entities* (region `external-nose` unless the id exists; tier in brackets;
what each must say comes from the sources listed with it):

- **Framework** — `s.upper-lateral-cartilage` [1] (fused to the dorsal
  septum as one complex, Han 2019; passes under the nasal bones at the
  keystone, Palhazi 2015; width/thickness, El-Shaarawy 2016);
  `s.lower-lateral-cartilage` [1] (syn alar cartilage, major alar
  cartilage; the alar ring, Daniel 2014) with `partOf` children
  `s.medial-crus` [1], `s.medial-crural-footplate` [2],
  `s.intermediate-crus` [2] (syn middle crus; lobular and domal segments,
  Daniel 1992), `s.lateral-crus` [1] (domal notch, turning point, accessory
  chain; caudal border higher than cephalic, Daniel 2014; LC strut
  indications, Gunter 1997; sagittal malposition, Hamilton 2016);
  `s.accessory-alar-cartilages` [2] (syn sesamoid cartilages, lateral
  crural complex; Daniel 2014, Ebrahimi 2012, Haddad 2022, Bruintjes 1998
  — the hinge area); `s.keystone-area` [2] (kind region; Palhazi 2015,
  Irmak 2020, Mau 2007).
- **Ligaments** (kind ligament) — `s.interdomal-ligament` [2],
  `s.intercrural-ligament` [3], `s.pitanguy-ligament` [2] (syn
  dermocartilaginous ligament, midline ligament; Pitanguy 1965 as eponym,
  Saban 2008 for what it is), `s.scroll-ligament` [2] (longitudinal and
  vertical parts; Ku 2025's inferior nasal retaining ligament in `syn`),
  `s.pyriform-ligament` [2] (Rohrich 2008). Each with `attaches-to` edges
  naming the parts its source names — rule 12 of §6.2 tests them; where
  the abstract does not say where an end attaches, write no edge and list
  it under "check hardest".
- **Envelope** — `s.nasal-soft-tissue-envelope` [1] (kind region; syn STE,
  skin–soft-tissue envelope), its layers `s.nasal-skin` [1] (kind skin),
  `s.nasal-superficial-fat` [2] (fat), `s.nasal-smas` [2] (kind muscle;
  the fibromuscular layer; Letourneau 1988, Saban 2008, and Figallo 2001's
  doubt in a pearl), `s.nasal-deep-fat` [2] (fat), all `partOf` the
  envelope.
- **Muscles** (kind muscle) — `s.procerus` [2], `s.nasalis-transverse`
  [2], `s.nasalis-alar` [2], `s.dilator-naris-anterior` [3],
  `s.depressor-septi-nasi` [2]; origins and insertions as `attaches-to`
  edges from Hur 2011, Bruintjes 1998, Tansatit 2016, Rohrich 2000.
- **Vessels and nerves** — `s.angular-artery` [2] (branch of
  `s.facial-artery`; Kim 2014, Saban 2012), `s.angular-vein` [3]
  (Iwanaga 2022), `s.lateral-nasal-vein` [3] (the one vessel deep to the
  SMAS, Toriumi 1996), `s.external-nasal-nerve` [2] (branch of
  `s.anterior-ethmoidal-nerve`; Han 2004).
- **Landmarks** — `lm.soft-tissue-nasion`, `lm.sellion` and `lm.rhinion`
  (of `s.nasal-bone`; Lazovic 2015), `lm.pronasale`, `lm.subnasale`,
  `lm.columella-lobule-junction`, `lm.alar-crease` (Byrd 1993's alar-cheek
  junction), `lm.dome` (of `s.intermediate-crus`), `lm.anterior-septal-angle`
  (of `s.septal-cartilage`; Daniel 2018).
- **Classifications** — `c.nasal-bone-shape` (V / S; Lazovic 2015),
  `c.medial-crura-shape` (1–3; Patel 2013), `c.angular-artery-course`
  (I–IV; Kim 2014), `c.external-nasal-nerve-branching` (I–III; Han 2004),
  `c.depressor-septi-type` (I–III; Rohrich 2000). Prevalences in
  `caveats`, each with its denominator.
- **Variants** — `v.columellar-artery-presence` (Rohrich 1995: bilateral
  9, unilateral 68, absent 23 % of 31 specimens; Tansatit 2016's 31.1 % of
  45 is a different quantity — note it), `v.supratip-arterial-anastomosis`
  (64.4 % of 45; Tansatit 2016), `v.nasal-sesamoid-cartilage` (the four
  sources of §6.2's disagreement list, each as its own `prev` entry with
  method and denominator).
- **Measurements** (one value each; `from`/`to` where a landmark pair
  defines it) — `m.ste-thickness-nasion` 4.13 ± 0.72, `-rhinion`
  2.25 ± 0.51, `-supratip` 4.88 ± 0.74, `-tip` 4.07 ± 0.72 mm,
  `m.nasal-dermis-thickness-tip` 2.35 ± 0.49, `-nasion` 1.35 ± 0.35 mm
  (Chen 2024; method `ultrasound`; n 110; Asian; Çavuş Özkan 2020 in
  `note`); `m.keystone-length` 8.9 and `m.keystone-width` 4.9 mm (Palhazi
  2015, n 15); `m.nasal-bone-ulc-overlap` 6.47 ± 2.50 mm midline,
  3.53 / 3.81 lateral in `note` (Han 2019, n 16); `m.dome-asa-projection`
  5.7 (2.2–9.6) and `m.dome-asa-caudal` 5.5 (2.9–9.5) mm (Daniel 2018,
  n 14); `m.interdomal-distance` 13.8 ± 3.2 and
  `m.interdomal-ligament-depth` 1.6 ± 0.5 (1.0–2.4) mm (Marangi 2025);
  `m.lateral-crus-length` 23.4, `-width-domal-notch` 6.4,
  `-width-turning-point` 11.1, `-thickness` 0.5 mm (cadaver, n 20, mean
  age 74), `m.lateral-crus-orientation` 43.6° and
  `m.lateral-crus-to-mid-nostril` 5.9 mm (`clinical`, 40 women) (all
  Daniel 2014); `m.lateral-crus-to-alar-margin` (Hatzis 2004: the mean is
  below 6.7 mm over the anterior 15 mm; record 6.7 as the bound, not as a
  mean, conf low); `m.ulc-width` 12.8 ± 1.29 and `m.ulc-thickness`
  1.34 ± 0.14 mm, `m.alar-divergence-angle` 23–44° (El-Shaarawy 2016,
  n 30); `m.septal-cartilage-length`, `-height`, `-area`, `-thickness`,
  `m.septal-harvestable-area` (Hwang 2010 n 14; Samibut 2021 n 42 — one
  entity per quantity, each study a value only if the schema allows,
  otherwise the larger series as the value and the other in `note`;
  Han 2019 and Han 2018's arcs in `note`); `m.external-nasal-nerve-exit`
  7.3 ± 0.6 (6.5–8.5) mm (Han 2004, 20 nerves);
  `m.lateral-nasal-artery-to-alar-groove` 2–3 mm (Rohrich 1995, n 31);
  `m.tip-projection-ratio` 0.67 (Byrd 1993; `note`: an aesthetic target
  from 87 models); `m.nasal-lower-border-to-fh` 18 ± 7° and
  `m.nasolabial-angle` 114 ± 10° (Fitzgerald 1992, n 104; `note`: faces
  chosen as balanced; the standard specimen's ≈ 89° in the O1 evidence (roadmap at commit 34af192, §4) was
  taken by a different construction and is not comparable as it stands).
- **Principles** — `pr.nasal-tip-tripod` (Anderson 1984; Janeke & Wright
  1971 as origin; Daniel 2018's reassessment as `caveat`: the domes are
  not supported by the ASA); `pr.dissect-below-the-smas` (Toriumi 1996,
  Rohrich 1995, Jung 2000, Han 2004: the plane on the perichondrium keeps
  the arcade and the external nasal nerve in the flap).
- **Procedure and hazards** — `p.open-rhinoplasty-approach` [2]
  (exposure only: transcolumellar and marginal incisions, elevation in the
  areolar plane on the perichondrium over the tip and middle vault; Toriumi
  1996, Rohrich 1995, Neves 2021, Hatzis 2004; steps only as deep as the
  abstracts go); `h.nasal-tip-skin-necrosis` (at `s.nasal-skin`, during
  that procedure; Rohrich 1995, Toriumi 1996, Jung 2000);
  `h.external-nasal-nerve-injury` (Han 2004). The rhinoplasty manoeuvres
  themselves are not in ST7.

*Sources* (PubMed records fetched 2026-10-07 by Opus; re-match each and
store PMID and DOI from the record; abstract-only reading, say so in
`note`):

| Proposed id | Record | PMID | DOI | type | Supports |
|---|---|---|---|---|---|
| `src.rohrich-1995-tip-blood-supply` | Rohrich, Gunter, Friedman. Plast Reconstr Surg 1995;95(5):795 | 7708862 | — | cadaver | lateral nasal artery (31/31, subdermal, 2–3 mm above the groove), columellar presence, crossover flow, alar base resection above the groove |
| `src.toriumi-1996-nose-vessels` | exists | 8554743 | exists | cadaver | vessels in or above the SMAS; lateral nasal veins deep; alar arcade; sub-SMAS plane |
| `src.jung-2000-nasal-tip-arteries` | exists | 10680935 | exists | cadaver | main tip supply 78 / 22 %; columellar arteries near the plane at the dome |
| `src.saban-2012-nasal-arteries` | Saban et al. Arch Facial Plast Surg 2012;14(6):429 | 22710606 | 10.1001/archfacial.2012.202 | cadaver | polygonal ECA–ICA system (Doppler flow reversal) |
| `src.tansatit-2016-nasal-midline` | Tansatit et al. Aesthetic Plast Surg 2016;40(2):236 | 26893278 | 10.1007/s00266-016-0621-1 | cadaver | midline columellar artery 31.1 %, supratip anastomosis 64.4 %, nasalis over the ULC, procerus |
| `src.kim-2014-angular-artery` | Kim et al. Dermatol Surg 2014;40(10):1070 | 25207758 | 10.1097/01.DSS.0000452661.61916.b5 | cadaver | angular artery types I–IV |
| `src.iwanaga-2022-angular-vein` | Iwanaga et al. PLoS One 2022;17(10):e0276121 | 36228011 | 10.1371/journal.pone.0276121 | cadaver | the angular vein's course: through the depressor supercilii to the medial palpebral ligament, between the LLSAN origin and the orbicularis oculi, three types at the alar level (44 Korean cadavers) |
| `src.letourneau-1988-nasal-smas` | Letourneau, Daniel. Plast Reconstr Surg 1988;82(1):48 | 3380925 | — | cadaver | the five soft-tissue components; elevate beneath the musculature |
| `src.saban-2008-nasal-smas` | Saban et al. Arch Facial Plast Surg 2008;10(2):109 | 18347238 | 10.1001/archfaci.10.2.109 | cadaver | SMAS split at the valve; Pitanguy = deep medial expansion; lowering ligaments |
| `src.figallo-2001-tip-trigonum` | Figallo, Acosta. Plast Reconstr Surg 2001;108(5):1118 | 11604607 | 10.1097/00006534-200110000-00003 | review | doubt about a true nasal SMAS |
| `src.neves-2021-dissection-planes` | Neves et al. Facial Plast Surg 2021;37(1):2 | 33634451 | 10.1055/s-0041-1723825 | review | the four dissection planes |
| `src.daniel-2018-nasal-ligaments` | Daniel, Palhazi. Aesthet Surg J 2018;38(4):357 | 29365051 | 10.1093/asj/sjx192 | cadaver | the five ligaments found, two not found; dome–ASA offsets |
| `src.marangi-2025-interdomal-ligament` | Marangi et al. J Plast Reconstr Aesthet Surg 2025;102:218 | 39938461 | 10.1016/j.bjps.2025.01.031 | cadaver | interdomal ligament present 24/25, depth, area, interdomal distance |
| `src.irmak-2020-keystone-scroll` | Irmak et al. Plast Reconstr Surg 2020;146(1):75 | 32590646 | 10.1097/PRS.0000000000006895 | cadaver | keystone histology; scroll complex; interdomal as a transition |
| `src.rohrich-2008-pyriform-ligament` | Rohrich et al. Plast Reconstr Surg 2008;121(1):277 | 18176231 | 10.1097/01.prs.0000293880.38769.cc | cadaver | pyriform ligament |
| `src.ku-2025-nasal-retaining-ligaments` | Ku et al. J Plast Reconstr Aesthet Surg 2025;106:35 | 40367650 | 10.1016/j.bjps.2025.03.037 | cadaver | vertical scroll = inferior nasal retaining ligament (Asian) |
| `src.pitanguy-1965-dermocartilaginous` | Pitanguy. Plast Reconstr Surg 1965;36:247 | 14339183 | 10.1097/00006534-196508000-00014 | (no abstract: type from the record's publication type) | eponym only |
| `src.janeke-1971-tip-support` | Janeke, Wright. Arch Otolaryngol 1971;93(5):458 | 5554881 | 10.1001/archotol.1971.00770060704004 | (no abstract) | origin of the tip-support studies only |
| `src.anderson-1984-tripod` | Anderson. Arch Otolaryngol 1984;110(6):349 | 6721774 | 10.1001/archotol.1984.00800320003001 | review | the tripod concept |
| `src.palhazi-2015-vault` | Palhazi, Daniel, Kosins. Aesthet Surg J 2015;35(3):242 | 25805276 | 10.1093/asj/sju079 | cadaver | keystone length and width; profile set by the cartilaginous vault |
| `src.lazovic-2015-nasal-bones` | Lazovic et al. Aesthet Surg J 2015;35(3):255 | 25805278 | 10.1093/asj/sju050 | cadaver | V / S shapes; sellion, radix, bony dorsum |
| `src.han-2019-keystone` | Han Z et al. Aesthet Surg J 2019;39(6):595 | 30321258 | 10.1093/asj/sjy255 | cadaver | NB–ULC overlap; ULC–septal complex; quadrangular cartilage size |
| `src.daniel-1992-nasal-tip` | Daniel. Plast Reconstr Surg 1992;89(2):216 | 1732887 | 10.1097/00006534-199202000-00002 | cohort | three crura, two segments each; tip angles |
| `src.daniel-2014-lateral-crura` | Daniel et al. Aesthet Surg J 2014;34(4):526 | 24682443 | 10.1177/1090820X14528464 | cadaver | lateral crus dimensions, orientation, alar ring, accessory chain |
| `src.hatzis-2004-lateral-crus` | Hatzis et al. Oral Surg Oral Med Oral Pathol Oral Radiol Endod 2004;97(4):432 | 15088028 | 10.1016/j.tripleo.2003.10.012 | cadaver | lateral crus to alar margin; dimorphism; asymmetry |
| `src.gunter-1997-lateral-crural-strut` | Gunter, Friedman. Plast Reconstr Surg 1997;99(4):943 | 9091939 | 10.1097/00006534-199704000-00001 | cohort | indications for the lateral crural strut |
| `src.hamilton-2016-lateral-crus` | Hamilton. Facial Plast Surg 2016;32(1):49 | 26862964 | 10.1055/s-0035-1570504 | review | cephalic and sagittal malposition |
| `src.toriumi-2006-tip-contour` | Toriumi. Arch Facial Plast Surg 2006;8(3):156 | 16702528 | 10.1001/archfaci.8.3.156 | review | dome sutures and the caudal margin; thick skin and shield grafts |
| `src.patel-2013-medial-crura` | Patel et al. Plast Reconstr Surg 2013;132(4):787 | 24076670 | 10.1097/PRS.0b013e3182a0137a | cadaver | medial crura types 1–3 |
| `src.el-shaarawy-2016-nasal-cartilages` | El-Shaarawy. Folia Morphol 2016;75(3):316 | 26916202 | 10.5603/FM.a2016.0008 | cadaver | ULC width and thickness; divergence angle |
| `src.ebrahimi-2012-sesamoid` | Ebrahimi et al. Oral Surg Oral Med Oral Pathol Oral Radiol 2012;114(2):e22 | 22769416 | 10.1016/j.oooo.2011.09.020 | cadaver | sesamoid prevalence and size |
| `src.greenlund-2023-sesamoid` | Greenlund et al. Ann Otol Rhinol Laryngol 2023;132(11):1438 | 37002594 | 10.1177/00034894231165134 | cohort | cartilage rare in Mohs alar histology |
| `src.haddad-2022-llj-micro-mri` | Haddad et al. Surg Radiol Anat 2022;44(10):1367 | 36208337 | 10.1007/s00276-022-03029-z | cadaver | ULC–LLC junction types; posterior accessory cartilages |
| `src.hwang-2010-septal-thickness` | Hwang et al. J Craniofac Surg 2010;21(1):243 | 20098189 | 10.1097/SCS.0b013e3181c5a203 | cadaver | septal cartilage size and thickness map |
| `src.samibut-2021-septal-cartilage` | Samibut et al. Aesthetic Plast Surg 2021;45(4):1705 | 33432388 | 10.1007/s00266-020-02116-z | cadaver | septal size, area, harvestable area after a 10 mm L-strut |
| `src.han-2018-septal-arcs` | Han PS et al. Laryngoscope 2018;128(8):1806 | 29536545 | 10.1002/lary.27154 | cadaver | dorsal and caudal arcs and rises |
| `src.mau-2007-l-strut` | exists | 17721403 | exists | cadaver | strut failure at the bony–cartilaginous junction; overlap |
| `src.han-2004-external-nasal-nerve` | Han SK et al. Plast Reconstr Surg 2004;114(5):1055 | 15457012 | 10.1097/01.prs.0000135335.60575.d9 | cadaver | exit point, layer, branching, precautions |
| `src.hur-2011-nasal-muscles` | Hur et al. Clin Anat 2011;24(2):162 | 21254248 | 10.1002/ca.21115 | cadaver | dilator naris anterior, alar nasalis, dilator naris vestibularis |
| `src.bruintjes-1998-valve-muscles` | Bruintjes et al. Laryngoscope 1998;108(7):1025 | 9665251 | 10.1097/00005537-199807000-00014 | cadaver | lateral wall in three parts; hinge area; muscle actions |
| `src.rohrich-2000-depressor-septi` | Rohrich et al. Plast Reconstr Surg 2000;105(1):376 | 10627007 | 10.1097/00006534-200001000-00059 | cadaver | depressor types I–III |
| `src.chen-2024-ste-ultrasound` | Chen et al. Aesthetic Plast Surg 2024;48(17):3292 | 38565724 | 10.1007/s00266-024-03906-5 | cohort | STE and dermis by site (Asian) |
| `src.cavus-ozkan-2020-ste-mri` | Çavuş Özkan et al. Aesthet Surg J 2020;40(7):711 | 32003429 | 10.1093/asj/sjz320 | cohort | STE pattern by site, sex, age (MRI) |
| `src.byrd-1993-planning` | Byrd, Hobar. Plast Reconstr Surg 1993;91(4):642 | 8446718 | — | cohort | proportioned length, tip and radix projection |
| `src.fitzgerald-1992-nasolabial` | Fitzgerald, Nanda, Currier. Am J Orthod Dentofacial Orthop 1992;102(4):328 | 1456217 | 10.1016/0889-5406(92)70048-F | cohort | nasolabial angle and the nose's lower border to FH |

*Check hardest* (the PR lists these first, with what each entity says):
the disagreements of `docs/ssb.md` §6.2 (each must be stated in the
entity, not resolved by picking one); every `attaches-to` edge's source
sentence; the two textbook-only claims the spec relied on and that need a
PubMed source or are dropped (the levator labii superioris alaeque nasi
was dropped for this reason; a definition of cephalic malposition with a
threshold — none in hand, so `lc_orientation` carries no class);
prevalences whose classes do not sum to 100 % (Kim 2014); what
Marangi 2025's interdomal distance is measured between; anything
written beyond an abstract.
Accept: `node tools/ssb-content.mjs`, `node tools/check-data.mjs`,
`node tools/test-ssb.mjs` (the materials ↔ graph-kinds agreement);
the PR lists every new id with tier and sources.
Escalate: an abstract does not support a number the spec uses (say which;
the spec changes, not the number); an entity would duplicate an existing
one; a source's record differs from this table.

### ST7b — Kit: strip, distance transform, iso-surface        [ready] · Sonnet · depends: —
Goal: the three DOM-free primitives §6.2 needs, each with one inside test
and one mesh builder (`docs/ssb.md` §6), tested in Node.
Read: `docs/ssb.md` §6 and §6.2 (the envelope paragraph); `js/ssb/dioramas/kit.js`;
`tools/test-ssb.mjs` (how the lab section runs kit in Node).
Touch: `js/ssb/dioramas/kit.js`; `tools/test-ssb.mjs` (a `kit`
section, `--only kit`); `docs/ssb.md` §6 (the primitive list); docs pass.
Don't: change an existing primitive's output (the three dioramas' tests
pass unchanged); add a dependency or vendored library (the marching-cubes
tables are data written in the file); import three.js (it is passed in).
Steps:
1. `strip` solid: `{ type: 'strip', pts, wdir, w, t }` — centreline
   points (≥ 2), a unit width direction per point (re-orthogonalized to the
   tangent), per-point width offsets `[lo, hi]` along it, thickness `t`
   (mm, or per point). `inside()`: the nearest point on the polyline
   (global minimum over segments; ties to the lower index), local (u along
   the width direction, v along tangent × width), inside iff the
   projection lies on the polyline, lo ≤ u ≤ hi and \|v\| ≤ t/2.
   Because the nearest-point frame is only unique while the strip bends
   about its width axis (as cartilage does), `kit` rejects a strip whose
   in-plane curvature κ_w satisfies κ_w · max(\|lo\|, \|hi\|) > 0.5 (throws,
   with the point index). Mesh: a closed thickened strip, `seg`
   subdivisions per segment (default 4), outward normals; `bounds()`.
2. `edt(mask, nx, ny, nz, step)`: exact Euclidean distance in mm from
   every voxel to the nearest set voxel (0 on it), separable
   (Felzenszwalb–Huttenlocher lower envelope of parabolas), Float32Array.
3. `iso`: `isoGeometry(THREE, field, nx, ny, nz, origin, step, level)` —
   marching cubes with the standard 256-case tables, vertices welded per
   grid edge, normals from the field's gradient — and
   `isoInside(field, nx, ny, nz, origin, step, level)(x, y, z)`: trilinear
   field below the level (outside the grid: false).
Accept: `node tools/test-ssb.mjs --only kit`, then the full suite:
strip — on a straight, a 90° and a 180° (hairpin about the width axis)
strip, `inside()` agrees with a ray-parity test against its mesh on
≥ 99.5 % of 20 000 random points, every disagreement within 0.1 mm of the
surface, and a strip bent in its own plane past the limit throws; edt —
exact (1e-4 mm) against brute force on random 24³ masks at steps 0.5 and
1.0, and on a single voxel; iso — a sphere field r = 10 mm at 0.5 mm
encloses 4/3·π·r³ within 1 %, the mesh is closed (every edge in exactly
two triangles), every vertex's trilinear value is within 1e-3 of the
level, and `isoInside` agrees with ray parity on ≥ 99.5 % of random
points; timing printed: edt and iso on a 1.2 M-voxel grid.
Escalate: edt on 1.2 M voxels takes > 300 ms or iso > 200 ms in Node on
the CI runner (report both; §6.2's budget then needs the 1.0 mm grid by
default).

### ST7c — The `nasal-framework` diorama        [todo] · Sonnet · depends: ST7a, ST7b merged
Goal: `js/ssb/dioramas/nasal-framework.js` to `docs/ssb.md` §6.2 as it
stands, with rules 0–13 pinned.
Read: `docs/ssb.md` §6, §6.1 (the pattern of rules computed from solids,
and the degrade table), §6.2; `js/ssb/dioramas/sphenoid.js` (module
pattern, header of schematic proportions, `degrade()`),
`frontal-recess.js` (voxelizing the drawn solids), `kit.js`;
`tools/test-ssb.mjs` lab section; `js/ssb/materials.js` (kinds).
Touch: new `js/ssb/dioramas/nasal-framework.js`, `js/ssb/dioramas/index.js`,
`tools/test-ssb.mjs`; docs pass (`docs/ssb.md` §6 table, `WIP.md`).
Don't: invent a proportion, attachment or depth §6.2 does not give (stop
instead); change `kit.js` (ST7b's); add tokens or materials (every kind
exists after ST6 and ST7a); change graph content.
Steps: anchors and construction order; parts; envelope field and layers;
tubes in envelope coordinates; `PARAMS`, `PRESETS`, `VIEWS`, `classify`,
`readout`; hazard sites; the degrade table; the module header listing
every schematic proportion; rules 0–13 in `--only lab`.
Accept: `node tools/test-ssb.mjs --only lab` (rules 0–13) and the full
suite, `node tools/check-data.mjs`, `node tools/smoke-pages.mjs`; in the
PR: the default readouts (projection ratio, rotation, domes–ASA, valve
angle, keystone, lateral crus to rim, envelope at four sites, septal and
harvestable area, each plane's carried / cut / deep sets, external nasal
nerve exit), build time, part and triangle counts, and screenshots of the
five views at the default, at `ste_scale` 0.6 and 1.6, and with each plane.
Escalate: rule 3's dip is not monotone (send the A(x) profiles — it
should be, by construction); rule 10's sets need a depth or radius other
than §6.2's to hold (send the clearances, do not tune); the tripod has no solution within
±5 mm at the default (send the leg lengths); the domes' construction
(rule 7) puts the ASA where the septal outline fails rule 9; a muscle or
ligament end has no `attaches-to` edge to land on; a budget breaks.

### ST7d — The specimen's bony nose and skin landmarks        [todo] · Sonnet · depends: ST6 merged · lane B after ST5
Goal: the specimen's own nasal bones, frontal processes, rhinion, sellion
and piriform rim, and ST6's measured skin points, as data — the anchors
ST7e fits to, and the n = 1 values beside §6.2's population numbers.
Read: `docs/ssb.md` §5.1–§5.3, §6.2 (anchors, fit); the docstrings of
`tools/ssb-pipeline/uw/walls.py` (compartments, walls), `nose.py`
(ST6's region and groove rules), `normalize.py`, `meshes.py`.
Touch: new `tools/ssb-pipeline/uw/nosebone.py` (or a `nose.py`
subcommand), `normalize.py` (`all` runs it after ST6's step);
`ssb/ct/labels.u16.gz`, `ssb/geometry/labels.json` (append-only),
`landmarks.json` and `.meta.json`, `sweeps.json` and `.meta.json`,
`ssb/models/*` (the new labels meshed into the `nose` pack);
`tools/test-ssb.mjs`; docs pass.
Don't: hand-edit an output; change ST6's unmask region; rename a label.
Steps:
1. *Bony nasal vault*: bone (display ≥ `walls.py`'s BT) that is a wall
   between the nasal cavity air and the exterior soft tissue (the unmasked
   nose), above the piriform aperture. Split nasal bone from frontal
   process at the nasomaxillary suture where the volume shows it (a
   continuous line of lower display between the plates over ≥ 3 axial
   levels); if it does not, stop (Escalate) with coronal images — the
   split is then the owner's (hand segmentation) or Opus's proxy, not the
   executor's.
2. *Landmarks*: `lm.rhinion.M` — the caudal-most nasal-bone voxel on the
   dorsal surface at \|R\| ≤ 1.5; `lm.sellion.M` — the most posterior
   point of the bony dorsal profile at R = 0 between the frontal sinus's
   anterior table and the rhinion (Lazovic 2015's term; the method in the
   meta); `lm.soft-tissue-nasion.M`, `lm.pronasale.M`, `lm.subnasale.M`
   and `lm.alar-crease.R/L` (the deepest point of the alar-facial groove at
   the alar-rim band's S) by ST6's own rules.
3. *Piriform rim*: per axial level from the ANS to the rhinion, on each
   side, the anterior-most bone voxel of the lateral bony wall bordering
   the airway; smoothed (3-level moving mean); written as the sweep
   `s.piriform-aperture.R/L` (radius 0.5) with its method in the meta.
4. *n = 1 envelope*: skin-to-bone distance along the skin normal at the
   soft-tissue nasion (to the bone under it) and at the rhinion; printed
   and stored in the landmark meta.
Accept: `normalize.py all` prints steps 1–4 and the pack's bytes and
triangles against §5.4; `check-data.mjs`; `test-ssb.mjs` (full) with new
checks — the rhinion is nasal-bone voxels' caudal end, the sellion lies
at R = 0, every rim point is bone adjacent to air, the volume is still
mirror-symmetric; `smoke-pages.mjs`. In the PR, a table: each landmark
against the diorama's default anchor (§6.2) and the two envelope values
against `m.ste-thickness-nasion` / `-rhinion`.
Escalate: the suture is not visible (step 1); the nasal bones fall below
BT over more than a third of their dorsal length (thin caudal bone — say
where); the rim is ambiguous on more than a fifth of the levels; a budget
breaks.

### ST7e — Fit on the specimen        [todo: spec sketch in `docs/ssb.md` §6.2, finalized at CP-ST7c] · Sonnet · depends: ST7c, ST7d; O14 = (b) or (c)
Not executable until Opus rewrites it at CP-ST7c with the numbers ST7c
and ST7d print (where the default framework lands under the real skin;
whether the specimen's envelope leaves room for the default domes).

**CP-ST7a (Opus)** — ST7a's PR: every number against its abstract, the
"check hardest" list first, the disagreements stated not resolved; then
owner review of tier 1 as usual.

**CP-ST7c (Opus)** — ST7b and ST7c: the five views against anatomy
(proportions, the alar ring, the scroll, the envelope's layers on a
section), the rules' numbers against §6.2, the plane sets, schematic
proportions labelled; then ST7e's final spec from ST7c's and ST7d's
printed numbers, and the first rhinoplasty-model WPs (R0: which
manoeuvres, in what order, as `p.*` steps that set §6.2's parameters).


### T1 — Self-test        [later] · Sonnet · depends: P2
Find it / name it / CT localize, Leitner reused unchanged, storage key registered per `docs/decisions.md` §3. After O7's corridors work.


## 3a. Realistic anatomy (moved from the plan, 2026-10-11)

Design: `docs/ssb.md` §14. Sources and limits: `docs/realistic-anatomy.md` §4–§5. Done items are in §4 below.


Format: `docs/delegation.md` §2. Lanes: **P** pipeline/data, **V** viewer,
**C** content, **O** owner. Every Sonnet WP's anatomy is already data
(written by Opus in the WP or an earlier Opus WP).

### Wave RA-0 — scoping, credit (now)

```
### RA0d — Name guard in check-data          [todo] · Sonnet · depends: —
Goal:     check-data fails if an atlas author's name or e-mail local part appears in any
          tracked text file, without the names being in the repo.
Touch:    tools/check-data.mjs; docs/security.md (rule line).
Steps:    store SHA-256 of lower-case tokens (surnames, full-name bigrams, e-mail local parts —
          the owner supplies them out of band, Opus hashes them); tokenize tracked text files
          (git ls-files), hash each token and adjacent bigram, fail on a match with the file and
          line, printing no name. Bigram-only for any common surname, to avoid false positives
          on unrelated authors.
Accept:   check-data passes on master; a scratch file containing one name fails it (not committed).
Escalate: runtime > 2 s on the repo.
```

### Wave RA-1 — inventories and the state machinery (parallel)

```
### POP0 — NasalSeg population statistics     [done 2026-10-07] · Opus
tools/ssb-pipeline/nasalseg/stats.py (+ review.json) → ssb/anatomy/population/nasalseg.json;
findings in docs/realistic-anatomy.md §4.4 (107 distinct scans of 130 ids; asymmetry distributions; head A's cavity outlier).
Follow-up for RS: explain head A's left-cavity volume (docs/realistic-anatomy.md §4.4) before RA3b.
```

### Wave RA-2 — resegmentation and alignment

```
### RS1–RS6 — Resegment head A                [RS1, RS2a done; RS2b stopped → RS2c; RS3–RS6 specified as each predecessor lands] · Opus + Sonnet
RS1 native-grid working volume · RS2 lamella sheets and identity (R7.2.2) · RS3 ethmoid cell
instances + shared rule set (R7.2.3) · RS4 openings and channels (R7.2.4, with the consumer list)
· RS5 canals as labels, sweeps from detected centrelines (R7.2.5) · RS6 added bone units and
the RA landmark set (R7.2.6, R6.1). The served head is rebuilt once, at the end (RS6, CP-RA2):
until then every RS output is a candidate under the gitignored incoming/_rs/, scored by
score.py --labels, and nothing in ssb/ct, ssb/geometry, ssb/models or ssb/anatomy changes.
Accept (whole RS): score.py held-out identity ≥ 95 % overall and ≥ 90 % per structure with ≥ 10
          tips, over RS's declared label set (R7.1 "Baseline"), and full coverage of that set;
          boundary review ≥ 90 % correct on the review slices; topology checks pass; relate3d
          contradictions not increased; diorama IFAC rules hold on the specimen's cells;
          test-ssb passes on both rebuilt bases (thresholds unchanged, or each change argued
          at CP-RA2).
Escalate: any cell the rules cannot classify that an expert would name; any wall the boundary
          review marks missing that the sheet filter cannot recover (→ owner: hand correction
          in 3D Slicer is the documented fallback, docs/ssb-roadmap.md §2).
```

```
### RS2 — Lamella sheets and their identity      [RS2a review 2026-10-09 (#158); the ethmoid lamellae are RS2b] · Sonnet (filter, plumbing) + Opus (rules review) · depends: RS1
Goal:     the uncinate process, basal lamella, bullar lamella and the superior turbinate's
          ground lamella (s.ethmoid-ground-lamellae) as labelled sheets on the native grid,
          found by a sheetness filter
          and named by attachment rules held as data; the basal lamella replaces the proxy.
Read:     R7.2.2; FG1's figures.json entries Axial.ethmoid2, Cor.basallamella,
          Sag.basallamella2 (their tips are pointers, CP-RA1); walls.py (the wall units the
          rules attach to); the graph entries of the four lamellae and their `partOf`/`attachesTo`
          edges.
Touch:    reseg.py (`sheets` stage); tools/ssb-pipeline/uw/rs/sheets.json (new: the rules);
          declared.json status; README; this WP's status line.
Don't:    tune a rule to the held-out tips; draw or paint a sheet; change served files.
Steps:    1. Sheetness: multiscale Hessian on the working volume's bone (sigma 0.35, 0.5,
             0.75 mm; bright plates: one large negative eigenvalue, two small), hysteresis
             thresholded, thinned to a 1-voxel medial surface, split into components.
          2. Rules (sheets.json, one object per lamella, every number a named parameter):
             - uncinate: attaches anteriorly to the lateral nasal wall unit (frontal process of
               maxilla / lacrimal) or the agger nasi cell wall; has a free posterior-superior
               edge facing air; lies medial to the maxillary ostium and lateral to the middle
               turbinate; its free edge bounds the hiatus semilunaris.
             - basal lamella: continuous from the lamina papyracea laterally to the skull base
               superiorly and the middle turbinate medially; separates anterior from posterior
               ethmoid air (every air path between their seed tips crosses it).
             - bullar lamella: the posterior wall of the bulla's air, between bulla and
               retrobullar recess, reaching the lamina papyracea.
             - superior turbinate ground lamella: posterior to the basal lamella, from the
               superior turbinate to the lamina papyracea / skull base.
             A component is named only if exactly one candidate per side meets every rule;
             otherwise the lamella is unassigned with the per-rule scores written out.
          3. The basal lamella's side splits anterior from posterior ethmoid air (replacing
             the proxy plane); the uncinate's free edge and the bulla's face bound the hiatus
             air (input to RS4).
          4. Review sheet: for each lamella and side, PNGs of the sheet over the working
             volume in three planes through its centroid, and over the matching UW figure
             slice (head A is those stacks), written to incoming/_rs/review/ for the CP.
Accept:   each named lamella is one component per side; the basal lamella separates the
          anterior and posterior ethmoid seeds' air (no 6-connected path between them avoids
          it); score.py (candidate) for s.anterior-ethmoid-cells and s.posterior-ethmoid-cells
          does not fall at --tol 6 against RS1's; the topology check for those two air labels
          (single component) is reported before and after; the review sheet exists; reruns
          byte-identical; no served file changes.
Escalate: a lamella with no unique candidate on a side (report the per-rule scores, do not
          relax a rule); a dehiscent or fenestrated lamella that would need a call on where
          the wall "is"; a rule that needs an anatomical parameter not stated in sheets.json.
Ruling:   (Opus, 2026-10-09, from RS1 #156) the seed-only rebuild gives the left lateral
          sphenoid recess to the posterior ethmoid (its only tips were held out) and, with no
          complete septum found, splits the sphenoid front/back instead of left/right. RS2 adds
          two sheets, by the same rules-as-data method, before the lamellae above:
          - sphenoid face: the anterior wall of the sphenoid body (the sphenoethmoidal
            junction), from the skull base to the choana's roof; air posterior to it and
            within the sphenoid body, reached through the sinus, is sphenoid, so the lateral
            recess and the pterygoid recesses join the sphenoid without a seed in them. A
            posterior ethmoid cell that crosses it superolaterally (an Onodi cell) is not
            decided here: report it for RS3.
          - intersinus septum: the dominant sagittally oriented sheet inside the sphenoid
            body, attached to the sphenoid face and the posterior wall (or the sella floor),
            often off the midline or deviated. It, not a watershed, splits the sphenoid into
            .R and .L; where it is incomplete, the split follows its surface extended along
            its own fit, and the PR says how much was extended.
          Accept adds: the left sphenoid's tips at --tol 6 back to today's count or better; the
          sphenoid .L label is on the patient's left (Dice with today's .L reported); no
          posterior ethmoid air posterior to the sphenoid face. Ids: s.sphenoid-face and
          s.intersinus-septum (both in the graph); an accessory septum is
          s.accessory-sphenoid-septum. RS1's two null ids (posterior ethmoidal canal,
          nasolacrimal canal) are content work before RS5, not RS2's.
Ruling 2: (Opus, 2026-10-09, on #158) RS2 is split. RS2a = the filter, the sphenoid face and the
          intersinus septum, export and score: it is #158, merged once (1) and (2) below are in.
          (1) Septum rule form: a septum faces bone only where it inserts, so
              `sphenoid_air_on_both_faces` is measured over the sheet's interior (voxels farther
              than 1.5 mm from where it meets another wall), threshold unchanged at 0.5. It is a
              change of form, argued from anatomy; lowering the threshold after seeing 0.49 would
              be tuning and is not allowed. If the septum still fails, .L stays RS1's split and
              the PR says so.
          (2) declared.json follows the graph: s.basal-lamella-vertical is the anterior,
              near-coronal part; s.basal-lamella-horizontal the posterior, near-axial part.
          The face's ≤ 3 mm gap fill (ostium, seams) stands, recorded as a wall-position call.
          The 1,100-line size is accepted for #158 (candidate-only code); later RS WPs keep the
          800-line stop.
```

```
### RS2c — Ethmoid lamellae from control points (RA-O9, option C)   [todo] · Opus (points) + Sonnet (fit, plumbing) · depends: RS2a; the UW crawl in incoming/ (fetch.py)
Goal:     the middle turbinate's vertical lamella (s.middle-turbinate), the basal lamella
          (s.basal-lamella, with its -vertical and -horizontal parts) and the uncinate
          (s.uncinate-process), per side, as sheets fitted through control points Opus places
          by eye on head A's own native stacks. The anterior/posterior ethmoid split moves
          from the proxy plane to the fitted basal lamella.
Read:     RA-O9 (docs/realistic-anatomy.md §13); RS2's and RS2b's WP text and rulings; #158's body (why the filter
          fails here); rs/sheets.json and reseg.py's sheet rasterizer; the README of the RS
          split (what is held out, so as not to open it).
Touch:    tools/ssb-pipeline/uw/rs/lamellae.json (new, committed: the control points, an
          input placed by eye, not pipeline output), reseg.py (read, fit, rasterize, use as
          the partition), rs/declared.json status, the RS README, this WP's status line.
Don't:    open split.json or any held-out tip while placing points (step 1); move a point
          after seeing a score, unless the move is argued from anatomy and disclosed (RS2's
          rule); change served files (nothing under ssb/ changes until RS6).
Steps:    1. (Opus, not delegated) on review slices of the native axial stack and its
             coronal and sagittal reformats: per sheet and side, ≥ 8 points on ≥ 4 slices
             spread over the sheet, including its attachments (MT lamella: the skull-base
             insertion at the cribriform/fovea junction and the lower border of the
             turbinate; basal lamella: the lamina papyracea laterally, the MT medially;
             uncinate: the lateral wall and its superior attachment, read as one of
             c.uncinate-superior-attachment's classes). Each point: plane, slice index,
             RAS mm in the native frame, confidence (sure / probable) and one line on what
             was seen. A sheet-side without 8 sure-or-probable points is marked "C cannot
             place" and goes to option A (the owner, 3D Slicer).
          2. (Sonnet) per sheet: the dominant plane from the points' PCA; a thin-plate spline
             of the height over that plane, its smoothing fixed before any score as the value
             with the smallest leave-one-out residual; clipped to the points' hull in the
             plane plus 2 mm; rasterized one voxel thick on the native grid. Where a sheet
             crosses the air of a compartment it does not bound, report the clash; do not
             trim by hand.
          3. The basal lamella replaces the proxy as the AE/PE partition; the MT lamella
             bounds the ethmoid medially; the uncinate is stored as a sheet for RS4 (it
             defines the infundibulum) and changes no label in this WP.
          4. score.py --labels on the held-out tips, the proxy's partition beside it.
Accept:   per sheet, leave-one-out residual median ≤ 1.5 mm and none > 3 mm; AE/PE held-out
          identity at tol 1 not below the proxy's (both recorded), the other structures' not
          worse; reruns byte-identical; review PNGs (incoming/, not committed) at every
          control slice show the sheet on the wall the point names; lamellae.json carries
          its provenance (placed by eye by Opus, date, source stack, frame, review: draft).
Escalate: a sheet-side C cannot place (→ A); a held-out score below the proxy's; a sheet
          through a structure it cannot cross.
Owner:    verifies the sheets on the review slices at CP-RA2 (R12.3).
```

```
### POP3 — NasalSeg relations                  [todo] · Sonnet · depends: POP0, POP1 (done); the NasalSeg archive in the drop zone (stats.py docstring)
Goal:     relationship measurements between the structures NasalSeg labels (and the bone its
          CT shows), on the clear subjects, as numbers in nasalseg.json under a new key
          `relations`; head A (as scanned) placed in each.
Read:     docs/realistic-anatomy.md §4.4; stats.py (docstring: duplicates, header fixes, sides, the clear subset);
          POP1's profiles method; normalize.py (how head A's midsagittal plane is found).
Touch:    tools/ssb-pipeline/nasalseg/stats.py (a `relations` subcommand; rerunning `stats`
          must keep the `profiles`, `meanShape` and `relations` keys it does not write:
          today it drops `meanShape`), nasalseg.json, the script's docstring, docs/realistic-anatomy.md §4.4.
Don't:    commit image data; change POP0's or POP1's numbers or subset; add a dependency.
Steps:    1. Field of view per distinct scan: the superior and inferior extent of the image
             against the labels (does it reach the cribriform plate, the frontal sinus, the
             sphenoid?). This decides which bony relations can be measured at all; report it
             before measuring anything above the maxillary roof.
          2. Maxillary floor against the nasal floor, per side (mm, + = sinus floor below):
             the 2nd-percentile S of the maxillary air label against that of the cavity label
             over the same A range.
          3. Minimum cross-section of the cavity and its position along POP1's axis (the
             acoustic-rhinometry analogue), restricted convention, and the cavity length.
          4. Septal deviation: the septal midsurface (midway between the two cavity labels'
             medial faces, per coronal section) against the midsagittal plane found from the
             bone (as normalize.py finds head A's); magnitude, side, and where (A, S).
          5. Turbinate tissue proxy per side: soft tissue (-50..150 HU) inside each cavity's
             per-section hull, lateral to the midsurface; its asymmetry against the septal
             deviation's side, and the cavity AI against both (Spearman, n stated).
          6. Head A's own values for 2–5 from its as-scanned labels, as percentiles.
Accept:   reruns byte-identical; every number stated with n and the subset; stats.py rerun
          leaves the other keys byte-identical; the step-5 relation is written with the
          sentence "a single scan cannot separate compensatory hypertrophy from the phase of
          the nasal cycle" beside it.
Escalate: a measure step 1 shows the field of view cannot support; a midsagittal fit that
          fails on more than 10 % of subjects.
Then:     new m.* ids for the measures that hold (a content WP, Opus reviews; source
          src.* NasalSeg) and their place in the population panel and the variant presets
          (v.septal-deviation's mild/typical/marked anchors, R12.2 item 3).
```

```
### FG2 — Figure poses in head A's frame      [todo] · Sonnet (search) + Opus (landmarks, review) · depends: FG1, RS6
Goal:     a plane pose and TPS for every N and V figure (P figures where bone-window), written
          to ssb/anatomy/sources.json; observations to observations.json.
Steps:    constrained plane search (tilt ≤ 20°, scale 0.25–0.6 mm/px) on air-mask Dice of large
          structures + bone-edge NCC, disease regions masked; multi-start; record residual and the
          best/second-best margin; Opus places ≥ 5 RA landmarks per figure where automatic
          matching is ambiguous (decoded by eye, as for the atlas OCR).
Accept:   N figures: median landmark residual after TPS ≤ 3 mm, none > 6 mm; every pose has a
          margin; a figure that fails is graded C and kept as a 2D exemplar only.
```

```
### RA4 — Exemplars layer in CT mode          [todo] · Sonnet · depends: FG2, RA3a
Goal:     R6.1's overlay: observations near the slice as markers; nearby exemplars listed with
          caption, credit and the figure itself (RA-O1), served from ssb/reference/uw-sinusanatomy2/figures/.
Accept:   test-ssb --only ct: markers project to within 0.5 px of their RAS position; the list
          changes with the slice; no remote request is made by the page.
```

**Checkpoint CP-RA2 (Opus + owner):** resegmentation review sheets (owner
looks at the uncinate, basal lamella and frontal cells); figure poses.

### Wave RA-3 — variants batch 1, pathology batch 1

```
### OP1 — Edit operators and texture         [todo] · Opus (invariants, specs) → Sonnet (code) · depends: RS (all)
Goal:     ops.py (R6.5) with self-tests; PSF and noise measured on head A and printed.
Accept:   each operator's invariants tested on synthetic volumes; texture metrics of edited
          voxels within ± 15 % of head A's (edge width, σ per tissue); blinded crop test at
          CP-RA3 (Opus/owner cannot pick edited crops above chance on 20 pairs).
```

```
### VB1 — Variants batch 1                    [todo] · Opus (parameters from exemplars; rules) → Sonnet (builds, tests) · depends: OP1, FG2, C-RA
Goal:     R8.1 as patches on standard and scanned, three presets each, with override packs,
          index.json entries, compat pairs.
Accept:   each row's acceptance rule pinned in test-ssb (--only variants); every patch's header
          names calibratedOn and assumed; budgets of R6.6.
```

```
### PB1 — Pathology batch 1                   [todo] · Opus (patterns, HU targets) → Sonnet · depends: OP1, RS4
Goal:     R9.1 as patches; Lund–Mackay and pattern presets; the drainage-follows-anatomy rule.
Accept:   test-ssb --only pathology: each pattern opacifies exactly the sinuses its drainage
          reaches, on standard, on scanned, and over each batch-1 variant that changes drainage.
```

```
### RA5 — Variant and pathology pickers        [todo] · Sonnet · depends: RA3a, VB1/PB1 (first entries)
Goal:     the pickers of R6.4, panels (prevalence with unit, exemplars, stations affected),
          truth badges per R2.2.
Accept:   test-ssb: every index.json entry reachable from the picker and the URL; the badge text
          names the edit and its exemplars; tier filtering works.
```

**Checkpoint CP-RA3 (Opus + owner):** realism (blinded crops), each
variant's look on CT and in 3D against its exemplar; owner sets `verified`
where right.

### Wave RA-4 — batch 2, Radiopaedia volumes, head B

```
RP2  fetch in the owner's browser (RA-O5), one case at a time, and record the chosen cases, grade A/B/C · owner + Sonnet
RP3  stack → volume, pose, observations, population entries · Sonnet + Opus review
RB1  head B: coronal stack → volume (spacing estimation), labels from its tips, scanned-b base · Opus + Sonnet
VB2  variants batch 2 (R8.2) · Opus → Sonnet
PB2  pathology batch 2 (R9.2) · Opus → Sonnet
(POP1 here was the asymmetry panel: built as POP2a/POP2b on docs/ssb-roadmap.md's board.)
```

```
### RP3 — Radiopaedia stacks → volume, pose, observations, population entries   [todo: specced 2026-10-11, waits on RP2] · Sonnet (intake, fits, files) + Opus (points, review) · depends: RP2; for step 5 also RS6 (RA landmark set) and FG2 (pose fields)
Goal:     each picked case RP2 delivers with grade A or B and a CC BY-NC-SA 3.0 licence line becomes
          numbers in its own ssb/exemplars/rp-<rID>/: volume header and spacing, pose in head A's
          frame, observations (R6.1) and, for a normal case, population entries. No pixel is committed.
Read:     docs/realistic-anatomy.md §4.2, §4.3, §4.4, §5 items 2, 5, 6, 10; docs/ssb.md §4, §14 R6.1,
          R6.2; ssb/reference/radiopaedia/ (README, RP2's records); the docstrings of tools/ssb-pipeline/
          uw/scale.py, uw/register.py, uw/labels3d.py, intake/intake.py and nasalseg/stats.py.
Touch:    tools/ssb-pipeline/radiopaedia/rp.py (new: a subcommand per step, `all`, `selftest`);
          ssb/exemplars/rp-<rID>/ (new: LICENSE.md, volume.json, points.json, pose.json,
          observations.json, population.json); tools/check-data.mjs (step 8's check); a
          radiopaedia/ section in tools/ssb-pipeline/README.md; this status line.
Don't:    fetch from radiopaedia.org (RA-O5: inputs are the owner's saves in tools/ssb-pipeline/
          incoming/radiopaedia/<rID>/); change ssb/anatomy/**, ssb/{ct,geometry,models,states,content},
          cases.json, ssb/LICENSE-data.md, js/**, stamp-assets.mjs, or the uw/, nasalseg/, intake/
          scripts (port their methods); commit an image, slice or volume, or a case-derived number
          outside its folder; move a point or a spacing after seeing a residual (RS2's rule).
Steps:    1. Intake. Skip, with the reason in the PR table: a vetoed or incomplete record, a licence
             line other than CC BY-NC-SA 3.0 (flagged to the owner), recorded burned-in text, grade C
             (no folder: a 2D exemplar for FG2's method, later). Per plane: scroll order, count =
             sliceCount, one size; colour beyond JPEG noise is an annotation. Orientation from
             anatomy; laterality by radiological convention, checked against the case text's side.
          2. Spacing. In-plane mm/px from anatomy (globes, interorbital and skull dimensions; scale.py's
             references, inverse-variance). Slice spacing: grade A by registering one plane's stack to
             the other's (register.py's model), grade B across slices as §4.2 says for head B. Grade A
             also needs the planes' own in-plane estimates within 10 % of each other (§5 item 5).
          3. Points (Opus, not delegated): points.json on the case's own slices: frame landmarks (ANS,
             porions, orbitales), RA landmarks where visible, the points and measures its `serves` ids
             need, one seed per maxillary sinus and cavity if normal. Each: plane, slice, pixel,
             sure/probable, one line on what was seen; provenance (Opus, date), review: draft.
          4. Volume. Its own §4 frame (labels3d.py's rule), isotropic 0.5 mm, trilinear, 8-bit display
             values kept (toHU only where the window was read); ct.u8.gz (gzip mtime 0) and the review
             sheets to incoming/_rp/<rID>/; volume.json: dims, spacing, affine, every estimate and its
             method, frame residual, window as read, SHA-256 of the inputs and of the volume.
          5. Pose. Similarity + TPS from the case's RA landmarks to the scanned base's
             (ssb/anatomy/scanned/geometry/landmarks.json, read only), in R6.1's fields as FG2 writes
             them; the scale is head size, never fed back into the spacing; leave-one-out residuals;
             under 5 landmarks, no pose.
          6. Observations: R6.1's schema, source rp:<rID>, raw in voxels, ras via the pose or null,
             sigmaMm from spacing and confidence; measures as ratios to a local reference (§5 item 5).
          7. Population entries, owner-confirmed normal cases only (§5 item 2): maxillary sinus and
             nasal cavity per side and AI by stats.py's formulas on air grown from the seeds (threshold
             from the stack's own air and soft-tissue peaks; cavity only with naris and choana in view,
             §5 item 10 beside it); percentile among nasalseg.json's clear subjects; n = 1, not like for like.
          8. Licence: rp.py writes LICENSE.md from the record (CC BY-NC-SA 3.0 and its link; the licence
             line verbatim and date read; contributor, Radiopaedia.org and rID as links; case URL; each
             file and how it was made). check-data: every file in the folder is listed there; LICENSE.md
             names licence, rID, contributor; each JSON's source is rp:<that rID>; every `of` a graph id;
             no image or volume file.
          9. Review (Opus), on the sheets (points in three planes; the case at its pose beside head A):
             the images show `serves` on the side named, each landmark on its structure; signed in the PR.
Accept:   rp.py selftest (synthetic stack of known spacing, orientation and similarity: spacing within
          2 %, landmarks within 0.5 mm, nothing written under ssb/); rp.py all twice, git status clean;
          node tools/check-data.mjs passes, and fails on an unlisted scratch file in a case folder (not
          committed); git diff --exit-code ssb/anatomy ssb/reference js; pose median leave-one-out
          ≤ 3 mm, none > 6 mm (FG2's), else recorded as failed, never forced. PR table per picked case:
          grade RP2 → RP3, planes, spacing per method, plane agreement, residuals, AI, or skip reason.
Escalate: grade C needed as a volume; a licence line missing or unreadable; burned-in text or an
          annotation the record missed (never masked); spacing not estimable (no globe, one plane with
          no through-plane anatomy, uneven slices) or planes > 10 % apart; the case text's side against
          the image's; a frame landmark out of view (a substitute is Opus's call); a landmark or measure
          needing an anatomy call or a parameter not in R8, R9 or the graph; an id the graph lacks.
Owner:    at CP-RA4, per case, from the PR table and the sheets: licence line and contributor against
          the page; each anatomy call (side, the class the case states, "normal"); only the owner sets
          verified. Open, not decided here: serving an exemplar volume or image (R14, R6.6, §5.1
          defacing); pooling entries into ssb/anatomy/population.json (ShareAlike would bind it).
```

**Checkpoint CP-RA4.**

### Wave RA-5 — integration

```
SC1  scenarios (named combinations, R6.3) · Opus picks, Sonnet builds
ST-RA  stations re-validated and re-posed per base and scenario (after E6) · Opus
T-RA  self-test items from states: "name the variant", "which sinuses does this pattern opacify,
      and why", "what does this change at the table" (feeds T1) · Sonnet
SX0  synthetic soft-tissue channel design (R9.3) · Opus; SX1 build · Sonnet
```

---

### Execution

**Order.** Critical path first; each lane is one Sonnet session (`docs/delegation.md`).

1. **RS2c** (Opus places control points after the crawl) → **RS3** (specify on the fitted basal lamella) → **RS4–RS6** → **OP1** → **VB1** ∥ **PB1** → **RA5**.
2. Beside it: **RP2** (owner fetch), **POP3**, **RA0d** (small), **FG2** (after RS6), **RA4** (after FG2).
3. Then **RA-4** (RP2 → RP3, RB1, VB2, PB2 → CP-RA4) and **RA-5** (integration).

**Rules that still apply.**

- Critical path: resegmentation (RS) → OP1 → VB1/PB1. The `scanned` state (RA3b) is already shipped, so the owner sees *Normal asymmetry* before any edit exists.
- Re-export discipline: bases and patches are regenerated at checkpoints only (R6.6), deterministically (gzip mtime 0), never hand-edited.
- Threshold re-checks: tests tuned on the old labels (E5 poses, the septum rule) are re-checked at CP-RA2, not moved silently.
- Docs: done 2026-10-11. The design moved to `docs/ssb.md` §14; the work packages to §3a.

### Handoff (2026-10-11)

Nothing is running and no PR is open. The RS2b branch `claude/RS2b-ethmoid-lamellae` stays unmerged as the record of v2 and v3.

Next, in order:

1. **RS2c** (critical path): run `fetch.py` for the crawl first (do not open the split), place the control points, then delegate the fit and plumbing. Then specify **RS3** on the fitted basal lamella.
2. **RP2** (beside it): the owner's checklist per picked case was given 2026-10-11. The picks in `ssb/reference/radiopaedia/cases.json` (`_meta.pick`) are vetoable. RP3 is specced (§3a); it waits on RP2's records.
3. **POP3** (beside it, Sonnet): NasalSeg relations; fixes `stats.py` dropping `meanShape`.
4. **RA0d** (any time, small): the name guard.
5. **Content before RS5**: graph ids for the posterior ethmoidal canal and the nasolacrimal canal.

Open follow-ups (not blocking):

- POP0's follow-up, "explain head A's left-cavity volume (docs/realistic-anatomy.md §4.4) before RA3b": no record that it closed, and RA3b has merged. Confirm or close.
- `ssb/reference/specimen-relations.json` is stale against `relate3d.py`: rerun.
- The 25.1 cm² flap maximum needs a measurement node with its source before the readout shows it.
- E6's flight test samples on a timer and fails on one slow frame.

Waiting on the owner: review of `ssb.html#anat=scanned` and its asymmetry note; CP-3 and the flap (`docs/ssb-roadmap.md` §2 and §5); RA-O7; RP2's browser fetch.

---

## 4. Done work packages

One line each. Specs and checkpoint reviews: git history (commit 34af192).

- **H1** — Graph entities the geometry already needs — done: CP-1
- **ST1** — Mucosa layer on the specimen — done: CP-1
- **ST2** — Septal mucosa surfaces (stage D, from the committed volume) — done: CP-1
- **ST4a** — Surface-snapped sweeps (pipeline machinery) — done: CP-1
- **ST6-0** — Is the nose in the source images? — done: CP-1
- **E1** — Provisional endoscope fulcrum — done: CP-1; superseded by E1b
- **E2** — Scope rig — done: CP-1
- **E1b** — Nostril fulcrum from the unmasked stack — done: merged #98, CP-2a
- **E2b** — Scope exposure — done: CP-2a
- **E3** — Collision and proximity HUD — done: CP-2a; lazy shared volume added by Opus
- **E4** — CT along the scope — done: CP-2b
- **E3b** — The septum blocks the shaft — done: CP-2c
- **E5** — Station poses — done: Opus, 2026-10-07
- **E6** — Station flights — done: merged #115, owner 2026-10-07; no Opus checkpoint
- **ST0d** — Content corrections — done: merged #97, CP-2a
- **ST2b** — Nasal floor chart and incisive canal — done (partial): canal + right margin; floor → ST2c, left → N1
- **ST1b** — Open airway lining — done: CP-2c
- **ST1c** — Load the lining pack lazily — done: reviewed by Opus 2026-10-07
- **N1** — Standard specimen: right half mirrored, septum centred — done: CP-2b
- **ST2c** — Nasal floor mucosa from the airway lining — done: CP-2c
- **ST0** — Soft-tissue content — done: verified 2026-10-03, corrections in ST0d
- **ST3** — Flap construction spec — done: first pass; revision ST3r
- **ST4b** — Vessel waypoints — done: verified 2026-10-03, corrections in ST4d
- **ST4c** — Regenerate vessels — done
- **ST4d** — Waypoint corrections — done: #136, merged in #138
- **ST3r** — Flap contract revision — done 2026-10-03
- **ST5** — Soft-tissue panel and NSF overlay — done: #139
- **ST6** — External nose: unmask, centre, vestibule and valve — done: merged #116, owner 2026-10-07; checkpoint items closed at CP-ST6 (git history)
- **D1** — Sphenoid diorama spec — done: amended 2026-10-03
- **D2** — Sphenoid diorama build — done: CP-2a; follow-up D2a
- **D2a** — Presellar in rule 9 — done: CP-2b
- **C1** — Content backlog, drafted by Sonnet, reviewed by Opus (O3) — done
- **P1** — Dissection contract and data (FESS, sellar/clival EEA) — done: Opus, 2026-10-08, this PR
- **P1b** — Dissection states (the pipeline) — done: #123, merged in #125
- **P2** — Procedure player — done: #124, merged in #125
- **P3** — Station poses per state, and the 2.7 mm shaft — done: #127
- **DC1** — Mucosal state: decongested and congested — done: #129
- **POP1** — NasalSeg cross-section profiles — done: #126
- **SEG1** — A voxel-level check of head A's labels with a NasalSeg-trained model — declined for now: O12, 2026-10-08
- **IN1** — 16-bit heads: the volume format and an intake path — done: #130
- **P4** — The player's views: a step lands on what it opened — done: #132
- **L1** — Lining fins in the base and mucosal packs — done: #137, merged in #138
- **POP2a** — The population panel (O9, the reference beside the head) — done: #135, merged in #138
- **POP2b** — The population maxillary sinus (O9; re-scoped at CP-POP2b) — done: #141

Realistic anatomy (moved 2026-10-11):

- **RA0a** — This plan — done 2026-10-07
- **RA0b** — Credit without names; permission recorded — done 2026-10-07
- **RA0c** — UW credit on the page — done 2026-10-09, #143
- **RS0** — Ground-truth split and scorer — done 2026-10-09, #142
- **RA3a** — Anatomy state, patch format, loader — done 2026-10-09, #147
- **RA3b** — The scanned base — done 2026-10-09, #152
- **C-RA** — Graph additions — done 2026-10-09, #146
- **RS1** — Native-grid working volume and the honest baseline — done 2026-10-09, #156; its Escalate (the left lateral sphenoid recess) is ruled in RS2
- **RS2b** — Ethmoid lamellae — stopped 2026-10-09: v2 and v3 name no middle turbinate; RA-O9 (owner)
- **FG1** — UW figure inventory (figures.json) — done 2026-10-09, #151; CP-RA1
- **RP1** — Radiopaedia shortlist (cases.json) — done 2026-10-09, #149; pick at CP-RA1

## 5. Owner review links (CP-3, dissected states)

Each link opens a corridor position at the view posed for its state (as at CP-3; a step link lands on the step's view):

  - FESS uncinectomy-1 · `t.ethmoid-bulla-0.R`: `https://skflx.github.io/ssb.html#p=p.uncinectomy&step=1&cor=fess&scope=R,36,4,38,0,0`
  - FESS uncinectomy-1 · `t.infundibulum-45.R`: `https://skflx.github.io/ssb.html#p=p.uncinectomy&step=1&cor=fess&scope=R,32,4,30,270,45`
  - FESS maxillary-antrostomy-1 · `t.maxillary-antrum-70.R`: `https://skflx.github.io/ssb.html#p=p.maxillary-antrostomy&step=1&cor=fess&scope=R,30,4,28,240,70`
  - FESS maxillary-antrostomy-1 · `t.medial-orbital-floor-30.R`: `https://skflx.github.io/ssb.html#p=p.maxillary-antrostomy&step=1&cor=fess&scope=R,30,6,34,270,30`
  - FESS anterior-ethmoidectomy-1 · `t.basal-lamella-0.R`: `https://skflx.github.io/ssb.html#p=p.anterior-ethmoidectomy&step=1&cor=fess&scope=R,48,2,40,0,0`
  - FESS anterior-ethmoidectomy-1 · `t.maxillary-antrum-70.R`: `https://skflx.github.io/ssb.html#p=p.anterior-ethmoidectomy&step=1&cor=fess&scope=R,30,4,28,240,70`
  - FESS anterior-ethmoidectomy-4 · `t.ethmoid-roof-30.R`: `https://skflx.github.io/ssb.html#p=p.anterior-ethmoidectomy&step=4&cor=fess&scope=R,44,-2,44,15,30`
  - FESS anterior-ethmoidectomy-4 · `t.basal-lamella-0.R`: `https://skflx.github.io/ssb.html#p=p.anterior-ethmoidectomy&step=4&cor=fess&scope=R,48,2,40,0,0`
  - FESS posterior-ethmoidectomy-0 · `t.ethmoid-roof-30.R`: `https://skflx.github.io/ssb.html#p=p.posterior-ethmoidectomy&step=0&cor=fess&scope=R,44,-2,44,15,30`
  - FESS posterior-ethmoidectomy-0 · `t.basal-lamella-0.R`: `https://skflx.github.io/ssb.html#p=p.posterior-ethmoidectomy&step=0&cor=fess&scope=R,48,2,40,0,0`
  - FESS posterior-ethmoidectomy-1 · `t.posterior-ethmoid-roof-0.R`: `https://skflx.github.io/ssb.html#p=p.posterior-ethmoidectomy&step=1&cor=fess&scope=R,58,0,34,0,0`
  - FESS posterior-ethmoidectomy-1 · `t.ethmoid-roof-30.R`: `https://skflx.github.io/ssb.html#p=p.posterior-ethmoidectomy&step=1&cor=fess&scope=R,44,-2,44,15,30`
  - FESS transethmoidal-sphenoidotomy-2 · `t.frontal-recess-45.R`: `https://skflx.github.io/ssb.html#p=p.transethmoidal-sphenoidotomy&step=2&cor=fess&scope=R,34,2,42,0,45`
  - FESS transethmoidal-sphenoidotomy-2 · `t.medial-orbital-wall-0.R`: `https://skflx.github.io/ssb.html#p=p.transethmoidal-sphenoidotomy&step=2&cor=fess&scope=R,38,4,38,0,0`
  - FESS draf-i-2 · `t.frontal-recess-45.R`: `https://skflx.github.io/ssb.html#p=p.draf-i&step=2&cor=fess&scope=R,34,2,42,0,45`
  - FESS draf-i-2 · `t.medial-orbital-wall-0.R`: `https://skflx.github.io/ssb.html#p=p.draf-i&step=2&cor=fess&scope=R,38,4,38,0,0`
  - FESS draf-iia-2 · `t.frontal-sinus-70.R`: `https://skflx.github.io/ssb.html#p=p.draf-iia&step=2&cor=fess&scope=R,42,-4,44,0,70`
  - FESS draf-iia-2 · `t.frontal-recess-45.R`: `https://skflx.github.io/ssb.html#p=p.draf-iia&step=2&cor=fess&scope=R,34,2,42,0,45`
  - EEA transsellar-approach-1 · `t.ser-0.R`: `https://skflx.github.io/ssb.html#p=p.transsellar-approach&step=1&cor=eea-sellar-clival&scope=R,49,-3,18,0,0`
  - EEA transsellar-approach-2 · `t.sphenoid-face-0.M`: `https://skflx.github.io/ssb.html#p=p.transsellar-approach&step=2&cor=eea-sellar-clival&scope=R,62,-2,24,0,0`
  - EEA transsellar-approach-4 · `t.cavernous-sinus-30.R`: `https://skflx.github.io/ssb.html#p=p.transsellar-approach&step=4&cor=eea-sellar-clival&scope=R,68,2,16,300,30`
  - EEA transclival-approach-2 · `t.cavernous-sinus-30.R`: `https://skflx.github.io/ssb.html#p=p.transclival-approach&step=2&cor=eea-sellar-clival&scope=R,68,2,16,300,30`
  - EEA transsellar-approach-4 · `t.sella-open-30.M`: `https://skflx.github.io/ssb.html#p=p.transsellar-approach&step=4&cor=eea-sellar-clival&scope=R,74,-2,20,60,30`
  - EEA transclival-approach-2 · `t.sella-open-30.M`: `https://skflx.github.io/ssb.html#p=p.transclival-approach&step=2&cor=eea-sellar-clival&scope=R,74,-2,20,60,30`
  - EEA transclival-approach-2 · `t.sphenoid-face-0.M`: `https://skflx.github.io/ssb.html#p=p.transclival-approach&step=2&cor=eea-sellar-clival&scope=R,62,-2,24,0,0`

## 6. Content backlog

Gaps found by the atlas integration (as of 2026-09-28):

- Anatomy: petrolingual/parasellar ligaments, carotid cave, jugular foramen
  and CN IX–XI; orbital septum, superior ophthalmic vein, frontal lobe
  beyond gyrus rectus, hard palate, parapharyngeal space.
- Procedures (so conditions can link `managedBy`): canthotomy/cantholysis,
  orbitotomy, frontal sinus cranialization, septodermoplasty and Young's,
  transantral IMAX ligation, Lynch approach.
- Owner review flagged by the integration: whether the two dry-eye hazards
  (vidian neurectomy vs vidian sacrifice in transpterygoid work) should
  merge; optic nerve sheath incision wording in optic nerve decompression.
- Conditions: EGPA, PCD, immunodeficiency, granulomatous infections,
  septal hematoma/abscess, developmental cysts, organizing hematoma,
  facial fractures; HPV-related multiphenotypic and SMARCA4-deficient
  carcinomas, non-intestinal adenocarcinoma, biphenotypic sarcoma,
  petroclival/cavernous/spheno-orbital meningiomas, trigeminal schwannoma,
  germinoma, LCH, optic pathway glioma.
- Classifications/numbers: SPOA drainage size threshold, AFRS staging,
  Cannady (IP), WHO CNS meningioma grade, AJCC N categories, ION canal
  grading, JNA staging variants, olfactory neuroblastoma staging review.
