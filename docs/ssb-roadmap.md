# SSB roadmap — task board

What is done, what is next, who does it, and what waits on the owner.
Architecture: `docs/ssb.md`. How work is handed to a model and checked:
`docs/delegation.md`. Current state in prose: `WIP.md`. The realistic-anatomy
board is `docs/realistic-anatomy.md` §11.

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
- **Radiopaedia (RP2):** veto any pick in `ssb/reference/radiopaedia/cases.json` (`_meta.pick`), then open each in your browser, save its stack (`docs/realistic-anatomy.md` §4.3), and fill the "owner reads" fields.
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
