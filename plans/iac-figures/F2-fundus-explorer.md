# F2 · `fundus-explorer` — the fundus from every side

**Block:** `hotspot`, `modes: ['explore', 'find']`, eight frames in this order. Tapping a nerve shows
its glossary note (end organ, surgical point), so no new machinery is needed. **Ledger:** G3, G11, K2
(smaller upper zone, larger lower zone; cochlear nerve through a central canal ringed by small
foramina), K31, HCA3 p42/p45, HCA6 p78–81.

## The en-face fundus (frames 1–6)

viewBox `0 0 760 560`. The fundus seen end-on, **superior up** in every frame. Geometry for a frame
with **anterior on the left** (frames 1, 4, 6); the other frames mirror it (`x → 760 − x`).

- Canal rim: circle centre (380, 280), r 190, bone second tone; inner fundus plate circle r 176, bone.
- Transverse crest, `data-g="falciform"`: rect `200,244 360,14` rx 7, bone second tone. It sits
  **above** centre: upper zone smaller than lower (K2).
- Vertical crest, `data-g="bills-bar"`: rect `373,112 14,132` rx 7 (from the transverse crest upward
  only; it stops at y 244 and never crosses below).
- Facial nerve, `data-g="fn-meatal"`: ellipse (300, 180) rx 52 ry 46, facial fill. Upper anterior.
- Superior vestibular nerve, `data-g="svn"`: cluster of 9 circles r 7 inside the box `420–520 × 140–220`
  (grid 3 × 3 at x 437, 470, 503 and y 157, 180, 203), vestibulocochlear fill. Upper posterior.
- Cochlear nerve, `data-g="cochn"`: central circle (290, 360) r 14 plus 14 circles r 5 on a spiral
  r = 22 + 3.2·k at angle 40°·k (k = 0…13) around it. Lower anterior.
- Inferior vestibular nerve, `data-g="ivn"`: 7 circles r 7 in the box `430–510 × 300–370` (two rows:
  y 318 at x 445, 470, 495; y 350 at x 440, 462, 484, 506). Lower posterior.
- Singular canal, `data-g="singular"`: one circle (520, 420) r 9, posteroinferior to the IVN, with
  label "Singular canal (posterior ampullary nerve)".
- Labels (label group): "Facial nerve", "Superior vestibular", "Cochlear", "Inferior vestibular",
  "Transverse (falciform) crest", "Vertical crest (Bill's bar)", "Singular canal". Leaders 1 px
  `#555049` to each shape, labels outside the rim.

| # | File | Side | View | Anterior is | Compass | Frame caption |
|---|---|---|---|---|---|---|
| 1 | `fundus-rs-right.svg` | Right | From medial (looking laterally from the porus, as in the retrosigmoid view) | left | A left, P right, S up, I down | "Right fundus from medial (retrosigmoid view)" |
| 2 | `fundus-rs-left.svg` | Left | From medial | right | mirrored | "Left fundus from medial (retrosigmoid view)" |
| 3 | `fundus-tl-right.svg` | Right | From lateral (looking medially, translabyrinthine) | right | A right, P left | "Right fundus from lateral (translabyrinthine view)" |
| 4 | `fundus-tl-left.svg` | Left | From lateral | left | A left, P right | "Left fundus from lateral (translabyrinthine view)" |
| 5 | `fundus-mri-right.svg` | Right | Oblique-sagittal MRI convention: displayed with anterior on the image left | left | A left, P right | "Right IAC, oblique-sagittal (radiological display)" |
| 6 | `fundus-mri-left.svg` | Left | Oblique-sagittal MRI, same display | left | A left, P right | "Left IAC, oblique-sagittal (radiological display)" |

Frames 2 and 3 are the mirror of frame 1 (anterior right); 4, 5, 6 are frame 1's geometry with
their own caption and compass. In frames 5–6 draw the rim as a dark CSF disc (`#555049` fill,
nerves keep their fills) and omit the singular canal and both crests (MRI shows nerves, not bone);
frames 5–6 then have four regions.

## Frames 7–8: from above (MCF)

viewBox `0 0 760 560`, **screen up = lateral** (fundus at top), the canal's roof removed. Right ear
(frame 7, `fundus-mcf-right.svg`): anterior on the left; left ear (frame 8, `fundus-mcf-left.svg`):
mirror.
- Canal: rect `250,90 260,390` rx 10, bone second tone outline only (stroke, fill `#ffffff`); top edge
  y 90 = fundus, bottom y 480 = porus (label "Porus", "Fundus").
- Facial nerve, `data-g="fn-meatal"`: rect `270,120 100,350` rx 30, facial fill (anterior half of the
  superior plane); it leaves the top-left corner as the labyrinthine segment `data-g="fn-lab"`: path
  `M 300 120 L 285 60` width 26, to the geniculate `data-g="geniculate"` ellipse (290, 48) rx 26 ry 18.
- Superior vestibular nerve, `data-g="svn"`: rect `390,120 100,350` rx 30, vestibulocochlear fill.
- Vertical crest, `data-g="bills-bar"`: rect `373,90 14,60`, between them at the fundus.
- Cochlear and inferior vestibular nerves lie **below** this plane: draw each as a dashed outline only
  (`stroke-dasharray="5 4"`), cochlear `275,140 90,320`, IVN `395,140 90,320`, regions `cochn`, `ivn`,
  labelled "(below)".
- Danger zones (shading): cochlea circle (225, 100) r 34 labelled "Cochlea (≤ 1 mm in front of the
  labyrinthine segment)" (HCA3 p45); superior canal ampulla circle (520, 70) r 26 labelled
  "Superior canal ampulla".
- Compass: L up, M down, A left, P right (right ear). Caption "Right IAC from above (middle fossa
  view): the facial nerve is on top, in front".
