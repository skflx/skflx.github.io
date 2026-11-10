# Spec: SSB nasal-framework diorama (moved from docs/ssb.md §6.2, 2026-11-10)
> Not built. Status: docs/ssb-roadmap.md (ST7a). SSB has no GitHub issues (AGENTS.md exemption).
*Spec by Opus, 2026-10-07. Every number below is from a PubMed record
read for this spec (abstracts only; the source set, its PMIDs and what each
supports are in roadmap WP ST7a), or it is marked schematic. Owner
decisions O14 (where it is drawn; decided 2026-10-11) and O8 (which population and class
the defaults come from; decided 2026-10-08: mixed and labelled, modal
classes) are in docs/ssb.md §13: either answer changes defaults, not structure. Not built.*

**What it is for.** The external nose as rhinoplasty sees it: the
framework (bone, cartilage, ligaments), the soft-tissue envelope in its
layers, and the vessels and nerves in the layer each actually runs in —
built so that a later rhinoplasty model ("Hooks", below) can change the
framework and watch the envelope, the valve, the tip support and the blood
supply respond. Three teaching rules are computed from the drawn solids,
never written in: the **tip tripod** (projection and rotation follow the
legs' lengths), **what a dissection plane carries** in the flap (vessels and
the external nasal nerve, by layer), and **how envelope thickness shows or
hides the domes**.

**Frame and anchors.** Local RAS mm in the specimen's convention (docs/ssb.md §4):
origin at the anterior nasal spine, axial plane Frankfort-parallel, x = 0
midsagittal. The default nose therefore sits where the standard specimen's
does, and fitting it to the specimen (ST7e) changes anchors, not frame.
Anchors (`.M` unless sided):

| Anchor | Default (RAS mm) | From |
|---|---|---|
| soft-tissue nasion `lm.soft-tissue-nasion` | (0, −5.5, 41.5) | standard specimen, measured at CP-2b on the unmasked stack (roadmap ST6; ±1.5 mm); ST7d writes it |
| pronasale `lm.pronasale` | (0, 18.0, 4.5) | same (the tip may be flattened 1–2 mm by the reconstruction edge) |
| subnasale `lm.subnasale` | (0, 7.0, −6.5) | same |
| alar crease `lm.alar-crease.R/L` | (±21, 1.0, 1.0) | schematic until ST7d (ST6 found the alar-facial groove at \|R\| 19–24) |
| ANS `lm.anterior-nasal-spine` | (0, 0, 0) | the frame's origin |

Everything else is constructed from them, in this order:

1. *Dorsal line*: the straight line nasion → pronasale; its parameter t
   (0 at the nasion, 1 at the pronasale) indexes the envelope thickness.
2. *Domes*: the domes' midpoint lies under the pronasale, inward along −A by
   the tip's envelope thickness T(tip); the two dome tops are
   ±`interdomal`/2 from it in R.
3. *Anterior septal angle* `lm.anterior-septal-angle`: 5.7 mm behind the
   domes' midpoint (projection, along −A) and 5.5 mm cephalic to it (along
   the dorsal line toward the nasion) — Daniel & Palhazi's dome–ASA offsets
   (`m.dome-asa-projection`, `m.dome-asa-caudal`; "projection" and "caudal"
   read as those two axes: our reading, flagged for the full text).
4. *Rhinion* `lm.rhinion`: on the dorsal line at t = 0.45, inward by
   T(rhinion) (t schematic; ST7d measures it on the specimen's bone).
   *Sellion* `lm.sellion`: t = 0.1, inward by T(nasion) (schematic; the
   term is Lazovic 2015's).
5. *Piriform rim*: a curve from the nasal bone's caudal lateral corner down
   and medially to the ANS, at most \|R\| 12 (schematic; ST7d traces the
   specimen's).

**Parts** — each `<graph id>.<side>`, kind by `userData.look`, `kit.js`
primitives only (two added by ST7b: `strip` and the iso-surface):

| Part | Look | Primitive | Sized by |
|---|---|---|---|
| `s.nasal-bone.R/L` | bone | `strip` sellion → rhinion, 1.0 mm | `nb_shape` (`c.nasal-bone-shape`): V straight, S with the caudal third angulated (Lazovic 2015); widths and thickness schematic |
| `s.frontal-process-maxilla.R/L` | bone | `strip` from the nasal bone's lateral edge to the piriform rim | schematic |
| `s.piriform-aperture.M` | opening, ghost | thin tube along the rim | schematic (ST7d: the specimen's) |
| `s.septal-cartilage.M` | cartilage | `prism` on x, 1.0 mm (the measured map runs 0.74–3.03 mm, thickest at the base: Hwang 2010; uniform here, schematic) | outline: dorsal edge from `keystone` mm under the nasal bones to the ASA; caudal edge ASA → ANS; posterior edge a straight chondro-osseous line (schematic); length and height checked by rule 9 |
| `s.septal-l-strut.M` | cartilage, translucent | `prism` band `l_strut` wide along the dorsal and caudal edges | `s.septal-l-strut`, `pr.l-strut-preserve` |
| `s.upper-lateral-cartilage.R/L` | cartilage | `strip` along the dorsal septum from under the nasal bone to its caudal (scroll) edge; width 12.8, thickness 1.3 | `m.ulc-width`, `m.ulc-thickness` (El-Shaarawy 2016); fused to the septum along its medial edge (the ULC–septal complex, Han 2019); flare from the septum = `valve_angle` at the caudal edge |
| `s.medial-crus.R/L` (footplate `s.medial-crural-footplate.R/L`) | cartilage | the first segment of one `strip` per side (the lower lateral cartilage is one strip, as Daniel's alar ring is one cartilage): footplate flared toward the ANS, columellar segment 0.5 mm off the midline | `mc_type` (`c.medial-crura-shape`, Patel 2013) |
| `s.intermediate-crus.R/L` | cartilage | the strip's lobular then domal segment, ending at the dome top | Daniel 1992 (three crura, two segments each); `interdomal` |
| `s.lateral-crus.R/L` | cartilage | the strip from the domal notch past the turning point to the accessory chain: length `lc_length`, width 6.4 at the notch → `lc_width` at the turning point (one third along) → 4 at the end (schematic taper), thickness 0.5; long axis at `lc_orientation` from the midsagittal plane seen from the front (Daniel's construction is in the full text: this is our reading); short axis tilted `lc_vertical` (positive = caudal border higher, the normal per Daniel 2014; a caudal border below the cephalic is the pinched-tip form, Toriumi 2006) | `m.lateral-crus-length`, `-width-domal-notch`, `-width-turning-point`, `-thickness`, `-orientation` (Daniel 2014) |
| `s.accessory-alar-cartilages.R/L` | cartilage | three `super` 3 × 2 × 0.75 mm continuing the alar ring toward the ANS, never touching the rim (Daniel 2014: "not abutting the pyriform") | Ebrahimi 2012 (size); count 3 schematic |
| `s.interdomal-ligament.M` | ligament | `super` bridging the domes, its top 1.6 mm below the dome tops | `m.interdomal-ligament-depth` (Marangi 2025) |
| `s.intercrural-ligament.M` | ligament | thin `prism` between the medial and intermediate crura | schematic |
| `s.pitanguy-ligament.M` | ligament | midline band from the supratip dermis's deep surface to the interdomal region | course schematic; Pitanguy 1965, Saban 2008 (the deep medial SMAS expansion), Daniel 2018 |
| `s.scroll-ligament.R/L` | ligament | longitudinal band along the ULC caudal / lateral crus cephalic edges, plus a vertical band from there to the SMAS | Daniel 2018 (longitudinal and vertical), Ku 2025 (vertical = inferior nasal retaining ligament) |
| `s.pyriform-ligament.R/L` | ligament | sheet from the piriform rim (nasal bone to ANS) to the ULC, the lateral crus and the accessory chain | Rohrich 2008 |
| `s.nasal-ala.R/L` (alar lobule) | fat | `super` lateral and caudal to the lateral crus, reaching the alar crease (the ala holds no cartilage: Bruintjes 1998); placed from the alar crease and the naris, never from the crus, so the alar rim stays put when the crus moves (rule 8) | schematic |
| `s.columella.M` | fat | `super` around the medial crura | schematic |
| `s.nasal-vestibule.R/L` | space | lumen carved up through the base inside each alar ring | schematic (ST6's measured vestibule in fit mode) |
| envelope `s.nasal-deep-fat.M`, `s.nasal-smas.M`, `s.nasal-superficial-fat.M`, `s.nasal-skin.M` | fat, muscle, fat, skin | iso-surfaces of one field (below) | `m.ste-thickness-*`, `m.nasal-dermis-thickness-*` |
| muscles in the SMAS shell: `s.procerus.M`, `s.nasalis-transverse.R/L`, `s.nasalis-alar.R/L`, `s.dilator-naris-anterior.R/L`, `s.depressor-septi-nasi.R/L` | muscle | `strip` from origin to insertion, as the graph's `attaches-to` edges name them, clipped to the SMAS shell | courses schematic; Hur 2011, Bruintjes 1998, Rohrich 2000, Tansatit 2016 |
| vessels and nerves | artery, vein, nerve | tubes (below) | below |

**The envelope: one field, five surfaces.** Voxelize the framework (every
cartilage, bone and ligament part, the alar lobules and the columella,
through `kit.inside`) on a 0.5 mm grid over the nose box (R ±28, A −20…+30, S
−14…+48; 1.0 mm at `q=lite`) and take the exact Euclidean distance d(x) to
it (`kit.edt`). The envelope thickness is T(x) = `ste_scale` × T₀(x), with
T₀ interpolated along the dorsal line through four sourced values —
nasion 4.13, rhinion 2.25, supratip 4.88 (t = 0.8), tip 4.07 mm
(`m.ste-thickness-*`, Chen 2024) — and schematic values over the sidewall
(3.0), ala (3.0) and columella (2.0), blended by the nearest framework
point. The layers are level sets of φ(x) = d(x) / T(x): deep fat
0 < φ ≤ 0.25, SMAS ≤ 0.40, superficial fat ≤ 1 − δ(x), dermis ≤ 1, with the
dermis fraction δ = 0.58 at the tip (2.35 / 4.07) and 0.33 at the nasion
(1.35 / 4.13), both Chen 2024, interpolated between (the 0.25 and 0.40 are
schematic). Skin = {φ ≤ 1} minus the vestibule lumens, carved after, so the
nostrils are holes. Each layer's surface is marching cubes on φ at its
level (`kit.iso`), and its `inside()` is trilinear φ below the level, so a
test sees what is drawn. No smoothing pass (it would move a surface off its
inside test). Only the layers that `show` exposes are meshed; φ is always
computed (rules and planes need it).

*The layering is Letourneau & Daniel's* (1988: superficial fatty
panniculus, fibromuscular layer, deep fatty layer, longitudinal fibrous
sheet, interdomal ligament; the fibrous sheet is not drawn). Saban 2008
splits the nasal SMAS at the valve into deep and superficial layers with
medial and lateral expansions; Figallo 2001 doubts that a true nasal SMAS
exists. The diorama draws one fibromuscular shell and says so.

**Vessels and nerves.** Tubes along centripetal Catmull-Rom curves through
waypoints given in *envelope coordinates* — a framework or anchor point, an
outward direction, and a depth φ (the point is moved along ∇d until φ is
reached) — so they follow the envelope when the framework changes, as
docs/ssb.md §5.7's specimen sweeps follow the septal chart. The depths are our reading
of the sources' layer words: schematic in value, sourced in order.

| Tube | Course (waypoints) | Depth φ | From |
|---|---|---|---|
| `s.lateral-nasal-artery.R/L` | from the angular/facial origin lateral to the alar crease, along the alar groove 2.5 mm cephalic to it, then over the lateral crus to the supratip, where it joins the arcade | 0.85 along the groove (subdermal plexus), 0.5 over the crus | Rohrich 1995 (2–3 mm above the groove, subdermal, present in 31 of 31); Toriumi 1996 (alar arcade) |
| `s.dorsal-nasal-artery.R/L` | from the medial canthal region (schematic point, \|R\| 12, S 35) down the sidewall to the arcade | 0.6 | Toriumi 1996 (in or above the musculoaponeurotic layer); Jung 2000 |
| `s.columellar-artery.R/L` | per `columellar`: from the superior labial artery at the columella base up over the medial crura to the infratip, joining the arcade near the domes | 0.6, reaching 0.45 at the domes | Rohrich 1995 (presence); Jung 2000 ("close to the main surgical plane in the dome") |
| `s.superior-labial-artery.R/L` | its last 10 mm, from the box edge below the alar base to the columella base | 0.6 | schematic |
| `s.angular-artery.R/L` | per `angular_type`: I along the alar-facial groove to the medial canthus; II leaves the box laterally (cheek and tear-trough course); III an ophthalmic-origin vessel at the medial canthus only; IV none | 0.6 | Kim 2014 |
| supratip anastomosis (part of `s.lateral-nasal-artery.M`) | toggle: a midline crossing at the supratip, level with the alar cartilages | 0.5 (mid-subcutaneous) | Tansatit 2016 |
| `s.lateral-nasal-vein.R/L` | along the sidewall | 0.17 (deep to the SMAS — Toriumi's one exception) | Toriumi 1996 |
| `s.angular-vein.R/L` | from the medial canthus (medial palpebral ligament) down lateral to the sidewall, past the LLSAN origin, to the alar level | 0.6 | Iwanaga 2022 (course); depth schematic |
| `s.external-nasal-nerve.R/L` | exits between nasal bone and ULC at \|R\| 7.3, runs to the lateral crus; branching per `nerve_type` (I single; II splits at the intercartilaginous junction; III two branches from the exit) | 0.22 (deep fat, directly under the SMAS: 19 of 20 nerves) | Han 2004 |

Radii: arteries 0.4 mm, the columellar 0.2 (Tansatit's midline columellar
artery 0.21 ± 0.09 mm), veins 0.25, the nerve 0.18 (Han: 0.35 mm diameter at
the exit); other than those two, schematic. The vein's radius is set so it
fits the deep fat at the default sidewall thickness (rule 10).

**`PARAMS`:**

| Key | Type / range | Default | Source |
|---|---|---|---|
| `show` | choice `ghost` (translucent skin, all inside) · `skin` · `smas` (skin and superficial fat off) · `framework` · `bones` | `ghost` | — |
| `plane` | choice `none` · `subcutaneous` · `sub-smas` · `supraperichondrial` · `subperichondrial` | `none` | Neves 2021 (the four planes); Toriumi 1996 |
| `ste_scale` | 0.6–1.6, step 0.05 | 1.0 | `m.ste-thickness-*` |
| `keystone` (nasal bone over the cartilaginous vault, along the dorsum) | 4–12 mm | 8.9 | `m.keystone-length` (Palhazi 2015); Han 2019's 6.47 midline overlap is inside the range |
| `valve_angle` (ULC to septum at the ULC's caudal edge) | 5–25° | 12 | `m.internal-nasal-valve-angle` (10–15, conf low); below 10 flagged "narrow" |
| `lc_length` | 15–30 mm | 23.4 | `m.lateral-crus-length` |
| `lc_width` (at the turning point) | 6–14 mm | 11.1 | `m.lateral-crus-width-turning-point` |
| `lc_orientation` | 15–60° | 43.6 | `m.lateral-crus-orientation` |
| `lc_vertical` | −30…+30° | +10 (schematic) | `s.lateral-crus`; Daniel 2014, Hamilton 2016 |
| `interdomal` | 6–20 mm | 13.8 | `m.interdomal-distance` |
| `mc_type` | choice 1 · 2 · 3 | 3 | `c.medial-crura-shape` |
| `tripod_medial` (Δ medial leg) | −5…+5 mm | 0 | `pr.nasal-tip-tripod` |
| `tripod_lateral` (Δ both lateral legs) | −5…+5 mm | 0 | `pr.nasal-tip-tripod` |
| `l_strut` | 6–20 mm | 10 | `m.l-strut-width` (10–15), `pr.l-strut-preserve`; below 10 flagged |
| `nb_shape` | choice V · S | S | `c.nasal-bone-shape` |
| `columellar` | choice `bilateral` · `unilateral` · `absent` | `bilateral` (see below) | `v.columellar-artery-presence` |
| `angular_type` | choice I · II · III · IV | III | `c.angular-artery-course` |
| `supratip_anastomosis` | toggle | on | `v.supratip-arterial-anastomosis` |
| `nerve_type` | choice I · II · III | I | `c.external-nasal-nerve-branching` |
| `depressor_type` | choice I · II · III | I | `c.depressor-septi-type` |
| `sesamoid` | toggle (one extra cartilage in the hinge area) | off | `v.nasal-sesamoid-cartilage` |

*Defaults for a variant choice* (O8, decided 2026-10-08): the modal class among those
that draw the structure, so the default is what a surgeon meets most often
— angular type III (the modal drawn type; IV, absent, is 26.3 %), nerve
type I (50 %), depressor type I (62 %), nasal bone S (88 %). Under O6
(normal and symmetric first) a modal *asymmetric* class yields to the
modal symmetric one that draws the structure: medial crura type 1 (7 of
17) yields to types 2 and 3, which tie (5 each), and the simpler, 3, is
taken; the columellar artery's modal class, unilateral (68 %), yields to
bilateral — only 9 % of Rohrich's 31 specimens, the clearest case for O8. The HUD gives every class's
prevalence with its denominator.

**`PRESETS`** (one parameter each, as in docs/ssb.md §6.1): `c.nasal-bone-shape`
(V, S → `nb_shape`), `c.medial-crura-shape` (1–3 → `mc_type`),
`c.angular-artery-course` (I–IV → `angular_type`),
`c.external-nasal-nerve-branching` (I–III → `nerve_type`),
`c.depressor-septi-type` (I–III → `depressor_type`). No preset for the
envelope: no sourced classification of nasal skin thickness was found.

**`VIEWS`** — the five standard rhinoplasty views: `frontal`, `lateral`
(the right profile), `base` (worm's-eye, tip up), `oblique` (right
three-quarter), `dorsal` (bird's-eye). `VIEW_DEFAULT`: `oblique`.

**`classify` / `readout` HUD lines:** the classes in force (with
prevalence); nasal length (soft nasion → pronasale); tip projection P
(pronasale's A minus the alar creases' mean A — Byrd & Hobar measure from
the alar-cheek junction; along the Frankfort-parallel axis is our reading)
and P / length beside 0.67 (`m.tip-projection-ratio`: an aesthetic
proportion from 87 selected models, not a population mean); rotation —
the nose's lower border (subnasale → columella–lobule junction) above the
Frankfort plane, beside 18 ± 7° (`m.nasal-lower-border-to-fh`: 104 young
white adults chosen as well-balanced); the domes against the ASA (mm,
beside 5.7 / 5.5); the internal valve angle measured on the solids; the
keystone overlap measured; the lateral crus's caudal border to the alar
rim over its first 15 mm (beside < 6.7, `m.lateral-crus-to-alar-margin`);
the envelope at nasion, rhinion, supratip and tip; the septal cartilage's
area and the harvestable area outside the L-strut (beside 636 and
385 mm², Samibut 2021); the external nasal nerve's exit (\|R\|, beside
7.3); for a `plane`, what it carries in the flap, cuts, or leaves deep
(rule 10), by name.

**Hazard sites** (hatched, `userData.hazards`):
`h.nasal-tip-skin-necrosis` on the arcade (lateral nasal over the crus,
dorsal nasal, columellar, supratip anastomosis) when `plane` is
`subcutaneous`, and on the lateral nasal artery's alar-groove segment
always (alar base resection above the groove: Rohrich 1995);
`h.external-nasal-nerve-injury` on the nerve when `plane` is `sub-smas`,
and on its exit always (Han 2004: keep dissection at the bone–ULC junction
within 6.5 mm of the midline); `h.saddle-nose` (exists) on the L-strut band
when `l_strut` < 10. An unsupported alar rim (rule 8 above 6.7 mm) is a
HUD flag, not a hazard id, until rhinoplasty procedures exist to own it
(a hazard needs the procedures it happens `during`).

**Rules `tools/test-ssb.mjs` must pin** (computed from the solids on the
0.5 mm grid, as docs/ssb.md §6.1's are; nothing written in):

0. *Names, ids, codec.* Every part is `<graph id>.<side>` and resolves in
   the graph; every hazard id resolves; the `#lab=` codec round-trips and
   clamps hostile values; both themes compile; at the defaults (all
   symmetric) the model is mirror-symmetric (vertex sets within 1e-6); only
   the asymmetric classes (`columellar` `unilateral`, `mc_type` 1) break it.
1. *Containment and nesting.* Every framework voxel is inside the skin;
   each layer's solid contains the next deeper one; every layer is at
   least 0.15 mm thick wherever the envelope is, over the whole
   `ste_scale` range; each nostril is open (a
   ray up from each naris centre reaches the vestibule lumen without
   entering skin) and enclosed (columella medial, ala lateral on its row).
2. *Envelope thickness.* Skin-to-framework distance along the outward
   normal at the nasion, rhinion, supratip and tip equals `ste_scale` ×
   T₀ there within 0.5 mm, and the rhinion is the thinnest of the four (a
   construction check against Chen 2024; Çavuş Özkan 2020's MRI series
   agrees on the rhinion and disagrees on the thickest site).
3. *Thick skin hides the domes.* On the skin's most-anterior profile
   A(x) along R at the dome tops' S, the midline dip — the higher of the
   two lateral maxima minus A(0), or 0 when there is one maximum — never
   increases over `ste_scale` 0.6…1.6 in steps of 0.1 and is strictly
   smaller at 1.6 than at 0.6. The count of maxima (prominence ≥ 0.2 mm
   after 1 mm smoothing) is a readout, not pinned. An outward offset can
   only shallow a concavity, so this holds by construction; it is drawn
   because it is the teaching point (Toriumi 2006, Chen 2024), not a
   measured threshold. Whether a default tip shows one or two highlights
   depends on `interdomal`, whose definition in Marangi's abstract is
   unclear (below).
4. *The tripod* (`pr.nasal-tip-tripod`; Anderson 1984). Feet: F_m, the
   footplates' posterior midpoint; F_l.R/L, each lateral crus's end at the
   accessory chain — all fixed. Apex D: the dome tops' midpoint. With
   Δm, Δl the apex is the anterior intersection of the spheres (F_m,
   L_m⁰ + Δm) and (F_l.R/L, L_l⁰ + Δl); each crus is carried by the
   similarity that maps its leg's old end to the new (intermediate crura
   translate with D); the envelope is recomputed. Measured on the skin:
   shortening both lateral legs (Δl < 0) lowers projection and raises
   rotation; shortening the medial leg lowers both; lengthening it raises
   projection; Δ = 0 reproduces the default to 1e-6. An unsolvable Δ
   clamps to the nearest solvable one and the HUD says so.
5. *Keystone.* Along the dorsum at \|R\| ≤ 2, the nasal bone overlies the
   ULC–septal complex for `keystone` ± 0.5 mm; laterally (\|R\| 6–8) the
   overlap is shorter than in the midline (Han 2019's pattern).
6. *Valve.* The angle between the ULC's inner surface and the septum, in
   the coronal section at the ULC's caudal edge, equals `valve_angle`
   ± 1° over the whole range.
7. *Domes and the ASA.* At Δ = 0 the dome tops are 5.7 ± 0.5 mm anterior
   and 5.5 ± 0.5 mm caudal to `lm.anterior-septal-angle`, and the minimum
   distance from either dome to the septal cartilage is positive: the ASA
   does not support the domes directly (Daniel & Palhazi 2018).
8. *Lateral crus and the alar rim.* The alar rim is the skin's boundary
   voxels adjacent to the nostril opening. At the default, the distance
   from the lateral crus's caudal border to the rim is ≤ 6.7 mm over the
   first 15 mm from the domal notch (Hatzis 2004), and it grows
   monotonically as `lc_orientation` falls (a cephalically oriented crus
   leaves the rim unsupported: the reason for the strut graft, Gunter 1997).
9. *Septum and L-strut.* The septal cartilage's length and height lie
   within the means ± 2 SD of the cited series (`m.septal-cartilage-*`);
   the harvestable polygon is the cartilage minus the dorsal and caudal
   bands (`l_strut` wide, measured perpendicular to each edge) minus the
   part under the nasal bones (Mau 2007: the bony overlap is part of the
   strut's stability); its area readout equals an independent
   point-in-polygon sum within 2 %; it is empty, not negative, when the
   bands meet.
10. *What a plane carries* (pinned at the defaults). The planes:
    subcutaneous φ = 0.5 (above the musculoaponeurotic layer, Toriumi's
    disruptive group), sub-SMAS φ = 0.24, supraperichondrial d = 0.1 mm
    and subperichondrial d = −0.1 mm (on and under the perichondrium).
    Over the dissection field (the envelope over the ULCs, LLCs and nasal
    bones), with depths in mm, a tube is *carried* when its centre depth
    minus its radius exceeds the plane's depth + 0.1 mm everywhere, *cut*
    when its depth ± radius contains the plane's depth anywhere, and
    *left deep* otherwise. Pinned: `subcutaneous` → no artery of the
    arcade carried; `sub-smas` → every artery carried, the external nasal
    nerve and the lateral nasal vein cut; `supraperichondrial` and
    `subperichondrial` → everything carried (Toriumi 1996; Han 2004).
11. *Positions from the sources.* The lateral nasal artery's alar-groove
    segment lies 2–3 mm cephalic to the alar crease on the skin; the
    external nasal nerve exits at \|R\| 7.3 ± 0.5 between the nasal bone and
    the ULC, in deep fat; the columellar tubes drawn match `columellar`;
    the angular artery matches `angular_type`.
12. *Attachments agree with the graph.* For every ligament and muscle,
    each end lies within 0.5 mm of a part its graph `attaches-to` edges
    name; a missing edge or a far end fails.
13. *Determinism and cost.* The same parameters give the same hash of
    every part's geometry; build time is reported (≤ 500 ms on the CI
    runner at `q=full` is a budget, not a test of a phone's speed).

**Impossible combinations degrade, by one table** (the HUD names them, as
docs/ssb.md §6.1 rule 9): an unsolvable tripod Δ clamps (rule 4); `angular_type` IV
draws no angular artery or vein and starts the lateral nasal artery at the
box edge; `depressor_type` III draws no depressor (Rohrich's "no, or
rudimentary" muscle); an `l_strut` wide enough for the bands to meet
leaves no harvestable area; `sesamoid` adds a part only when `show`
exposes cartilage.

**Proportions that are schematic** (stated in the module header, as
docs/ssb.md §6.1's are): nasal bone width and thickness, the chondro-osseous line, the
septal thickness (uniform 1 mm), the lateral crus's taper after the
turning point, the accessory count, the intercrural and Pitanguy
ligaments' shapes, the alar lobule and columella solids, the sidewall /
ala / columella envelope values, the layer fractions 0.25 and 0.40, the
vessels' depths (their order is sourced), the dorsal artery's origin, the
rhinion's t and the alar crease's position (until ST7d).

**Budgets:** ≤ 60 parts; ≤ 150k triangles with the outermost shown layer
meshed at 0.5 mm; ≤ 1.2 M voxels at `q=full`; a parameter change rebuilds
when the slider settles, as the lab already does.

**What the sources disagree on** — kept visible in the panels, and listed
for CP-ST7 and the owner:

- *Accessory and sesamoid cartilages.* One sesamoid per side in 88 % of 41
  Iranian cadavers (gross dissection; Ebrahimi 2012); cartilage in 1 of 362
  tissue blocks from 101 Mohs alar specimens (histology of a sample chosen
  by skin cancer, of uncertain depth; Greenlund 2023); no sesamoid but
  posterior accessory cartilages in 6 of 8 joints (micro-MRI; Haddad
  2022); an accessory chain in 20 of 20 (Daniel 2014). The diorama draws
  the chain and makes the sesamoid a toggle.
- *The interdomal "ligament".* A transition between the middle crura
  rather than a ligament (histology, 26 cadavers; Irmak 2020) versus a
  fibrous ligament in 24 of 25 (histology; Marangi 2025). Daniel 2018 found
  no footplate and no sesamoid ligament, both commonly taught.
- *The thickest envelope site.* The supratip in 110 Asian patients
  (ultrasound; Chen 2024), the nasion in 325 Turkish patients (MRI; Çavuş
  Özkan 2020): different populations and modalities. Both put the
  thinnest at the rhinion. The defaults use Chen's numbers because they
  are the only ones in an abstract (O8).
- *The columellar artery.* Present on at least one side in 24 of 31
  (dissection and microangiography; Rohrich 1995) versus a midline
  columellar artery in 14 of 45 (midline histological strips, which can
  miss paired paramedian vessels; Tansatit 2016) — not the same quantity.
- *Angular artery classes.* Kim 2014's four types sum to 78 % of 57
  hemifaces in the abstract; the rest is unstated.
- *Interdomal distance.* Marangi 2025 gives 13.8 ± 3.2 mm and a ligament
  area of 0.39 cm² at 1.6 mm depth, and a 1.633 ratio between the
  ligament's base and that distance; the abstract does not say between
  which points the distance is measured. If it is not dome top to dome
  top, the default tip is too wide.
- *Keystone length.* 8.9 mm along the dorsal septum (15 cadavers; Palhazi
  2015) versus a 6.47 ± 2.50 mm midline nasal bone–ULC overlap (16 Chinese
  cadavers; Han 2019): different measures and populations.
- *Cadaver age.* Daniel 2014's lateral crus dimensions come from cadavers
  of mean age 74; its orientation angle from 40 young women in surgery.
- *Aesthetic ratios* (Byrd 1993, Fitzgerald 1992) are measured on faces
  selected as attractive or balanced; they are targets, not norms, and the
  HUD says so.
- *Septal cartilage size* differs by axis convention as much as by
  population (Hwang 2010, Samibut 2021, Han 2019, Han 2018).

**Fit on the specimen (ST7e; a sketch that Opus finalizes after ST7c and
ST7d).** Under O7 (b) or (c), the same module builds with
`anchors = 'specimen'`: anchors and bony landmarks come from
`landmarks.json` (ST7d), the specimen's nasal bones and piriform rim
replace the diorama's (those parts are not drawn), and the skin is the
`nose` pack's `s.external-nose.M` (ST6) instead of the generated one. The
framework is placed under the real skin by the same construction run
inward, and the inner layers are fractions of the *actual* local
skin-to-framework distance. Checks: the framework lies in tissue (no
cartilage voxel in the specimen's air, ≤ 1 % tolerance) and at least
1.0 mm under the skin; the ULC tucks under the specimen's nasal bone by
`keystone`; the specimen's own envelope at the nasion and rhinion (skin to
bone, n = 1) is printed beside Chen and Çavuş Özkan. **Not to be forced:**
ST6's "internal valve" is the narrowest coronal airway section, which need
not be where the ULC–septum angle is; the fit reports the A distance
between the ULC's caudal edge and that plane rather than placing one on
the other, and CP-ST7 decides what the specimen landmark is called.

**Hooks for the rhinoplasty model (not in ST7).** Everything above is
shaped for it: the framework is parametric, and the envelope, valve,
support and blood supply are recomputed from it; parts are the units a
surgeon moves or resects; the dissection plane is already a parameter.
The model will need, and ST7 must not preclude: (1) clip planes on `kit`
solids (dorsal reduction, cephalic trim, osteotomy lines), so a resection
is a boolean that `inside()` sees; (2) dissection states in names
(`s.lateral-crus.R@trimmed`, docs/ssb.md §4); (3) grafts as added solids under
procedure ids (spreader, columellar strut, caudal septal extension,
lateral crural strut, alar rim, shield), placed on the anchors; (4) the
tripod, the valve angle and the plane's carried set as the readouts that
grade a manoeuvre; (5) rhinoplasty procedures (`p.*`) whose steps set
these parameters, played as docs/ssb.md §3's procedure mode plays steps.
