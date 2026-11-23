# F6 · `approach-corridors` — three ways in

**Block:** `layers`, `mode: 'toggle'`. **Ledger:** G8 (retrosigmoid: posterior lip, 5 mm reliable,
up to 10 mm; medial two-thirds; lateral third risks vestibule and common crus; vestibular aqueduct the
lateral limit), HCA6 (translab: the whole canal from lateral; cochlear aqueduct the inferior limit),
HCA3 (MCF from above).

viewBox `0 0 760 560`. Axial schematic of the right petrous bone, **viewed from above: anterior up,
lateral right**, reusing F8's pyramid. Compass: A up, P down, M left, L right; "Right ear".

**Base** (`corridors-base.svg`):
- Pyramid polygon `440,170 740,350 620,470`, bone fill.
- IAC, `data-g="iac"`: rect `545,318 115,24` CSF-dark (`#555049` at fill-opacity 0.25), porus at x 545
  (`porus` region: rect `539,314 12,32`), fundus at x 660 (`iac-fundus`: rect `654,314 12,32`).
  Two-thirds mark: tick at x 622 labelled "⅔".
- Cochlea, `data-g="cochlea"`: circle (672, 292) r 20. Vestibule, `data-g="vestibule"`: circle
  (690, 338) r 16. Posterior canal, `data-g="pscc"`: arc path `M 655 372 A 26 26 0 1 0 705 380`, 5 px
  bone stroke; common crus label at (650, 392). Vestibular aqueduct, `data-g="vest-aq"`: line
  `640,372 → 610,420`, 3 px.
- Sigmoid sinus, `data-g="sigmoid"`: circle (700, 470) r 20, vein fill.
- Posterior fossa / cerebellum, `data-g="cerebellum"`: path `M 380 560 L 520 330 L 620 470 L 640 560 Z`,
  brain fill, label "Posterior fossa".

**Layers**:

| `id` | file | label | Draws |
|---|---|---|---|
| `tl` | `corridors-translab.svg` | "Translabyrinthine: from lateral, through the labyrinth" | guide cone from (760, 520) to the fundus, edges to (660, 312) and (660, 348); the labyrinth (vestibule, canal) drawn with `fill-opacity 0.3` as removed; text "Whole canal exposed, hearing sacrificed" |
| `mcf` | `corridors-mcf.svg` | "Middle fossa: from above" | dashed rect over the IAC `540,306 126,48` with a ⊙ symbol at (600, 300) and text "Seen from above, out of this plane: roof off, facial nerve on top" |
| `rs` | `corridors-retrosigmoid.svg` | "Retrosigmoid: from behind, through the posterior lip" | guide cone from (470, 548) to the porus, edges to (545, 318) and (622, 342); shaded blind zone `rect 622,318 38,24` with danger-zone fill and text "Lateral third: behind the posterior canal and common crus" |

Caption: "Schematic, right side, from above. Each corridor sees a different part of the same canal.
Sources: House Clinic Atlas ch. 3, 5, 6."
