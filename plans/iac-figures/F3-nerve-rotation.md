# F3 · `nerve-rotation` — four cuts, porus to fundus

**Block:** `layers`, `mode: 'step'`, `cumulative: true`. **Ledger:** G3 (Tian 2008: no rotation in
37%, 30–90° anteroinferiorly in 63%; Stanford/Jackler fig. 6: "gradual 180 degree"), K31 (VIII enters
the porus as one trunk and divides only in the lateral 3–4 mm; VII and VIII enter as two structures).
The Obersteiner-Redlich zone is **not drawn** (ledger G4).

viewBox `0 0 960 360`. Right ear, each cut viewed from medial (anterior left, superior up). Four
panels, centres x = 130, 370, 610, 850, y = 200. Canal outline per panel: circle r 90, dura fill;
the CPA panel has no canal circle (dashed circle r 90 labelled "no canal: cistern").

**Base** (`rotation-base.svg`): panel titles (y 60, centred): "1 · Cerebellopontine angle",
"2 · Porus", "3 · Mid-canal", "4 · Fundus"; the four outlines; compass under panel 1; footnote at
(20, 345), secondary text: "One common pattern, schematic. The facial nerve's angle varies: 0–90° in
one cadaver series, 180° in a surgical atlas. Only the fundus is fixed."

Nerve positions: polar from the panel centre, angle measured **counterclockwise from screen right**
(so 135° = upper left = anterosuperior in these right-ear panels), radius in px.

| Layer (`id`, file, label) | Facial nerve `fn-meatal` (circle r 22, facial fill) | VIII | Intermedius `nint` (circle r 7) |
|---|---|---|---|
| `cpa`, `rotation-cpa.svg`, "At the brainstem" | 210°, r 50 | one trunk `cn8`: ellipse rx 40 ry 30 at 30°, r 30 | 270°, r 40 (between VII and VIII) |
| `porus`, `rotation-porus.svg`, "At the porus" | 195°, r 52 | one trunk `cn8`: ellipse rx 42 ry 32 at 15°, r 28 | 255°, r 42 |
| `mid`, `rotation-mid.svg`, "Mid-canal" | 165°, r 55 | `cn8` ellipse rx 42 ry 34 at 345°, r 26, with a faint dividing line | merged into VII (not drawn) |
| `fundus`, `rotation-fundus.svg`, "At the fundus" | 135°, r 50 | split: `svn` circle r 18 at 45°, r 50; `cochn` circle r 20 at 225°, r 50; `ivn` circle r 18 at 315°, r 50; plus the crests as in F2 scaled 0.45 | not drawn |

Each layer also draws a small arrow on the panel rim showing
the facial nerve's move from the previous panel (none on panel 1).
