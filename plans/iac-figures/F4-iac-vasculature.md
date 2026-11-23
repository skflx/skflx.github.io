# F4 · `iac-vasculature` — AICA loops and end arteries

**Block:** `layers`, `mode: 'toggle'`. **Ledger:** G5 (Chavda I–III from McDermott et al. 2003;
labyrinthine artery from AICA's meatal loop 90%, basilar 10%; single 60%, two 40%; subarcuate artery
from the depression superolateral to the porus, K2; internal auditory artery between VII and the
cochlear nerve, HCA3 p45). Schematic: no loop shape is to scale.

viewBox `0 0 760 460`. A coronal-style schematic of the right CPA and IAC: **medial left, lateral
right, superior up**. Compass: M left, L right, S up, I down; "Right ear".

**Base** (`vessels-base.svg`):
- Brainstem: path `M 30 40 L 150 40 Q 175 230 150 420 L 30 420 Z`, brain fill, label "Pons / medulla".
- Basilar artery: rect `120,40 14,380` artery fill, label "Basilar artery".
- Posterior petrous face: line `360,40 360,420`, bone stroke 2; bone fill to its right
  `M 360 40 L 740 40 L 740 420 L 360 420 Z`.
- IAC: rect `360,205 280,60`, dura fill, region `iac`; porus at x 360 (`porus` region: rect
  `352,200 16,70`); fundus at x 640. Midpoint tick at x 500 labelled "50%".
- VII and VIII in the canal: two strips, `fn-meatal` rect `362,212 276,18` facial fill; `cn8` rect
  `362,236 276,24` vestibulocochlear fill.
- Cochlea outline: circle (685, 280) r 32, `cochlea`; vestibule circle (690, 200) r 26, `vestibule`.
- Subarcuate fossa: ellipse (430, 120) rx 22 ry 14, bone second tone, region `subarc-fossa`.

**Layers** (each a separate file, same viewBox; AICA drawn as a 7 px artery path from the basilar
at (134, 300)):

| `id` | file | label | Path |
|---|---|---|---|
| `t1` | `vessels-chavda-1.svg` | "Type I: loop in the CPA" | `M 134 300 C 220 300 300 240 300 235 C 300 230 220 330 134 340` |
| `t2` | `vessels-chavda-2.svg` | "Type II: enters the canal, up to half" | same form with apex at (440, 245) |
| `t3` | `vessels-chavda-3.svg` | "Type III: beyond half the canal" | same form with apex at (570, 245) |
| `laby` | `vessels-labyrinthine.svg` | "Labyrinthine artery and its branches" | from the type II apex (440, 245): `labyr-a` 3 px along y 232 to (630, 232); then `comcoch-a` to the cochlea (670, 270) and `antvest-a` to the vestibule (675, 205) |
| `subarc` | `vessels-subarcuate.svg` | "Subarcuate artery" | `subarc-a` 3 px from the type II loop at (330, 238) up to the fossa (430, 120) |

Text on the `laby` layer (secondary): "End artery: no collateral supply to the inner ear." On
`subarc`: "Coagulate and divide; avulsion can tear AICA."
