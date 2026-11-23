# F5 · `mcf-landmarks` — finding the IAC from above

**Block:** `layers`, `mode: 'toggle'`. **Ledger:** G10 (HCA3: superior canal at 45–60° to the IAC;
drill at about 60° to the arcuate eminence or on the bisector of the arcuate eminence–GSPN angle;
follow the GSPN to the geniculate; arcuate eminence–canal relation inconstant; cochlea ≤ 1 mm in front
of the labyrinthine segment; geniculate dehiscent in ~16%). Methods are labelled by what they do, not
by eponym (ledger G10).

viewBox `0 0 760 560`. Right middle fossa floor **viewed from above: anterior up, lateral right**.
Compass: A up, P down, M left, L right; "Right ear". The geometry is built on one vertex
**V = (520, 300)** and three rays from it (angles counterclockwise from screen right, as seen):

- GSPN ray at **120°**: points V + t·(−0.5, −0.866).
- Arcuate eminence / superior canal ray at **240°**: V + t·(−0.5, +0.866).
- IAC axis at **180°**: the bisector of the two (60° from each).

**Base** (`mcf-base.svg`):
- Middle fossa floor: rect `20,40 720,480` bone fill.
- Petrous ridge: line `540,430 → 200,234`, bone stroke 3; label "Petrous ridge"; superior petrosal sinus
  along it, `data-g="sps"`, 4 px vein stroke offset 6 px posteriorly.
- Middle meningeal artery at the foramen spinosum: circle (560, 110) r 8 artery fill, label
  "Middle meningeal artery: the anterior limit".
- GSPN, `data-g="gspn"`: 4 px facial-colour line from t = 40 to t = 260 on the GSPN ray, i.e.
  (500, 265) → (390, 75).
- Geniculate, `data-g="geniculate"`: ellipse (500, 265) rx 16 ry 12, facial fill; label
  "Geniculate (bare in about 1 in 6)".
- Arcuate eminence, `data-g="arcuate"`: ellipse centred at t = 90 on the arcuate ray, (475, 378),
  rx 46 ry 22, rotated 60°, bone second tone; the superior canal `data-g="ssc"` as a dashed arc
  beneath it along t = 50–130, label "Superior canal (under the eminence, inconstantly)".
- IAC (under bone), `data-g="iac"`: dashed rect from the fundus F = (490, 300) to the porus
  P = (330, 300), height 34 (y 283–317), facial-free, label "IAC (under bone)".
- Labyrinthine segment, `data-g="fn-lab"`: 4 px facial line F → (500, 265).
- Danger zones: cochlea `data-g="cochlea"` circle (452, 248) r 28 shaded, label "Cochlea";
  superior canal ampulla circle (508, 322) r 14 shaded, label "Ampulla".

**Layers**:

| `id` | file | label | Draws |
|---|---|---|---|
| `follow` | `mcf-follow-gspn.svg` | "Follow the GSPN back to the geniculate, then the labyrinthine segment into the canal" | guide arrows along (390,75) → (500,265) → F → P |
| `sixty` | `mcf-sixty.svg` | "About 60° from the arcuate eminence" | guide lines on the arcuate ray and the IAC axis from V; arc r 60 between them; text "≈ 60°" and, secondary, "45–60° between the superior canal and the IAC (House Clinic Atlas)" |
| `bisect` | `mcf-bisector.svg` | "Bisect the angle between the arcuate eminence and the GSPN" | guide lines on both rays from V, arc r 70 spanning 120°, the bisector dashed along the IAC axis to P; text "Bisector ≈ IAC" |

Caption (chapter data): "Schematic, right side, from above. Start medially at the porus, the safe
end; the fundus is tight between the cochlea in front and the ampulla behind. Source: House Clinic
Atlas ch. 3." No left-ear frame: the text says the left is the mirror image.
