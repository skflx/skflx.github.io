# F7 · `mri-4dot` — reading the canal on MRI

Two blocks. **F7a** is frames 5–6 of F2 (oblique-sagittal 4-dot); `im-4dot` reuses F2 rather than
redrawing it. **F7b–d** are a separate `hotspot` with `modes: ['explore']`. **Ledger:** G6 (BCNC
< 1.4 mm; normal IAC does not exclude a deficient nerve), G13 (IP-III: bulbous IAC, absent modiolus),
K9 (VS ice-cream-cone and porus flaring; meningioma broad dural base, hyperostosis, non-specific tail).
No size rule between the cochlear and facial nerves is drawn (unsourced, G6).

viewBox `0 0 760 440` for each frame. Fills: CSF `#555049` at 0.85; nerves vestibulocochlear fill;
facial nerve facial fill; bone `#efe6d2`; enhancing tumour `#ffffff` with stroke `#1d1d1b` 1.5.

| # | File | Title | Draws |
|---|---|---|---|
| b | `mri-cnd-aplasia.svg` | "Cochlear nerve aplasia" | the F2 frame-5 geometry scaled 0.7 about (380, 220), **no cochlear nerve** (empty CSF where it would be), dashed circle at its place labelled "No anteroinferior nerve"; inset bottom right: a narrow BCNC drawn as two bone walls 6 px apart, labelled "Narrow bony cochlear nerve canal (< 1.4 mm on CT)" |
| c | `mri-ip3.svg` | "Incomplete partition type III" | axial schematic (anterior up, lateral right): IAC widened laterally into a bulb, path `M 300 200 L 470 190 Q 540 180 560 220 Q 540 260 470 250 L 300 240 Z` (CSF); cochlea outline at (600, 200) r 50 with interscalar septa (3 arcs) and **no modiolus** (no central bone), so the bulb opens into it; labels "Bulbous fundus", "No modiolus: CSF reaches the cochlea" |
| d1 | `mri-vs.svg` | "Vestibular schwannoma" | axial: petrous face line `120,80 → 640,360`; porus gap 70 px at its middle; the IAC axis is perpendicular to the petrous face at the porus (schematic), so canal plug and CPA part share one straight axis; flared (each gap edge drawn as a short outward arc r 12); tumour = canal plug `rect` in the IAC plus a round CPA part r 70 centred on the porus axis (ice-cream cone); angle marks: two acute angles (< 90°) where the tumour meets the bone, labelled "Acute angles; centred on the porus" |
| d2 | `mri-meningioma.svg` | "Meningioma" | same petrous line and porus (not flared); IAC axis as d1; tumour = a broad, flat dome based on the petrous face **eccentric** to the porus (base centre 120 px anterior along the face): a circular segment smaller than a semicircle, chord 180 px along the face, height 50 px, so each edge meets the face at an obtuse angle (> 90°), both marked; a thin enhancing dural tail 80 px along the face; a hyperostotic thickening of the face under its base; labels "Broad dural base, obtuse angles", "Dural tail (non-specific)", "Hyperostosis (strong sign)" |

Regions (explore only): `iac`, `porus`, `cochlea`, `bcnc`, `modiolus` where drawn.
