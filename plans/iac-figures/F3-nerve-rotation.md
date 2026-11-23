# F3 · `nerve-rotation` — four cuts, fundus to brainstem

**Block:** `layers`, `mode: 'step'`, `cumulative: true`. **Ledger:** G3 (owner, #355): about 90°, almost
all inside the canal; right ear counterclockwise from fundus to brainstem; at the fundus the cochlear
nerve is anterior to the IVN and the cochleovestibular cleavage plane runs superior–inferior; at the
porus and CPA the cochlear nerve is inferior to the vestibular bundle and the plane runs
anterior–posterior; no plane in ~25%. K31: VIII enters the porus as one trunk and divides in the lateral
3–4 mm; cochlear "beneath the facial nerve". J9: intermedius exits between VII and VIII. The
transition zone is **not drawn** (G4).

viewBox `0 0 960 380`. **Right ear, every cut viewed from medial** (anterior on the viewer's left,
superior up). Panels left → right go **fundus → brainstem**, centres x = 130, 370, 610, 850, y = 200.
Canal outline per panel: circle r 90, dura fill; panel 4 (CPA) has a dashed circle r 90 labelled
"cistern: no canal".

Angles are counterclockwise **as seen on screen** from screen right (so 90° = up = superior,
180° = left = anterior). Rotation parameter θ per panel: fundus 0°, mid-canal 45°, porus 80°, CPA 90°.

**Base** (`rotation-base.svg`): panel titles (y 60): "1 · Fundus", "2 · Mid-canal", "3 · Porus",
"4 · Cerebellopontine angle"; the four outlines; compass under panel 1 (A left, P right, S up, I down,
"Right ear, viewed from medial"); a curved arrow above the panels from panel 1 to panel 4 labelled
"≈ 90° counterclockwise, fundus → brainstem (right ear, as drawn)"; footnote (20, 365), secondary:
"Almost all of the turn happens inside the canal. In about 1 in 4 there is no cleavage plane: one fused
trunk. The left ear turns the other way."

**Layers** (one per panel, file `rotation-<id>.svg`, label as given):

| `id`, label | Facial nerve `fn-meatal` (circle r 20, facial fill) | Vestibulocochlear nerve | Cleavage plane | Intermedius `nint` (circle r 7) |
|---|---|---|---|---|
| `fundus`, "At the fundus: four separate nerves" | 135°, r 52 | separate nerves: `svn` circle r 18 at 45°, r 52; `cochn` r 20 at 225°, r 52; `ivn` r 18 at 315°, r 52; transverse crest and vertical crest as in F2 scaled 0.45 | dashed line through the centre at 90° (vertical), lower half only, between `cochn` and `ivn` | not drawn |
| `mid`, "Mid-canal: cochlear and inferior vestibular fused" | 140°, r 66 | one disc `cn8` r 46 at the centre, split by the plane into a cochlear half (centred 180° + θ = 225°, label "cochlear") and a vestibular half (centred θ = 45°, label "vestibular") | dashed diameter at 90° + θ = 135°, drawn **faint** (`stroke-opacity 0.35`): "poorly defined" | merged into VII (not drawn) |
| `porus`, "At the porus" | 150°, r 68 | disc `cn8` r 46; cochlear half centred 260°; vestibular half centred 80° | dashed diameter at 170° | 175°, r 62 |
| `cpa`, "At the brainstem" | 160°, r 70 | disc `cn8` r 46; cochlear half centred 270° (inferior); vestibular half centred 90° (superior) | dashed diameter at 180° (horizontal: anterior–posterior) | 200°, r 62 (between VII and VIII) |

Halves are drawn as the disc's two semicircles with fills vestibulocochlear (`#f7f1e3`) for vestibular
and bone second tone (`#ddd0b4`) for cochlear, so the turn is visible. Labels outside the canal circle
with 1 px leaders.

**Left ear:** not drawn; the caption says the left mirrors it and turns clockwise.
