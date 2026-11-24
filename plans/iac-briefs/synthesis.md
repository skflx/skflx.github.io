# Brief · `synthesis` — Six cases (ch. 7, ~45 min)

**Title:** "Cases". **tldr:**
- Serviceable hearing with tumour filling the fundus calls for the middle fossa corridor, where VII sits on top. [HCA3, K31]
- A normal-calibre IAC on CT never rules out cochlear nerve deficiency: measure the BCNC and read the oblique-sagittal MRI. [G1, G6]
- Severe acute Bell's palsy (> 90% ENoG degeneration and silent EMG within 14 days) requires middle fossa decompression including the meatal foramen. [K30, Gantz 1999]
- Clear rhinorrhea with an intact drum after IAC surgery traces through opened perilabyrinthine or apical cells to the middle ear and Eustachian tube. [HCA5, HCA6]

Each section is one case (keyed `case-*` so section ids match module synthesis concept keys per spec §4.2): a
vignette paragraph, then 3 `check` prompts in order (each answer cites the section where it was taught), then
a module case item (`concepts: [<section id>]`, MCQ, `section: 'Synthesis Cases'`, the case stem plus one
question), and `drill: [{ m: 'iac-anatomy', c: ['<section id>'] }]`. Use only facts from the earlier briefs.
Every vignette block that holds a number with a unit or % ends with the chip `[[src|Constructed case]]` (the
guide lint rejects such a number without a chip).

## `case-mcf` · The small tumour at the fundus
- **Vignette:** right 1.1 cm intracanalicular schwannoma filling the fundus (no CSF cap); PTA 15 dB,
  discrimination 96%.
- **Checks:** (1) Class? → AAO-HNS A (`cc-audiometry`). (2) Why not retrosigmoid? → the lateral third is
  behind the posterior canal and common crus; fundal residual 7% (`ap-retrosig`). (3) Opening the dura from
  above, where is VII? → anterior and on top (`ap-mcf`).
- **Call** `trap`: fundal extension also lowers the odds of serviceable hearing whatever the approach (K31,
  `im-fundal-cap`).
- **Item:** which corridor reaches the fundus with hearing preserved → middle fossa.

## `case-cnd` · The child with a normal canal
- **Vignette:** 2-year-old, bilateral profound SNHL, IAC calibre normal on CT, BCNC 0.9 mm.
- **Checks:** (1) Is the CT reassuring? → no: a third of deficient nerves sit in normal canals; BCNC < 1.4 mm
  (`im-cnd`). (2) What will oblique-sagittal heavy T2 MRI show? → absent or small anteroinferior dot
  (`im-4dot`). (3) Counselling? → hypoplastic nerves do poorly with CI; ABI is the alternative that bypasses
  the nerve (`im-cnd`, `ap-extend`).
- **Item:** next study → oblique-sagittal heavy T2 MRI.

## `case-tl-bulb` · The large tumour and the high bulb
- **Vignette:** right 2.8 cm CPA schwannoma, non-serviceable hearing, high jugular bulb on CT.
- **Checks:** (1) Corridor? → translab (poor hearing, any size) (`ap-translab`). (2) The bulb's effect? →
  drill around and in front of it; it limits the inferior trough (`os-walls`, `ap-translab`). (3) The lower
  limit of drilling? → the cochlear aqueduct, IX–XI below (`ap-translab`).
- **Item:** inferior limit → cochlear aqueduct.

## `case-bell` · Day 9 of a Bell's palsy
- **Vignette:** complete palsy, day 9, ENoG 93% degeneration, no voluntary EMG.
- **Checks:** (1) Criteria met? → yes, > 90% and silent EMG within 14 days (`cc-bell`). (2) What to
  decompress? → meatal foramen, labyrinthine segment, geniculate (and tympanic segment) (`cc-bell`).
  (3) Why the middle fossa? → the meatal foramen is medial to the geniculate; transmastoid cannot reach it
  (`cc-bell`, `fu-meatal`).
- **Item:** approach → middle fossa decompression including the meatal foramen.

## `case-ip3` · The X-linked boy before stapes surgery
- **Vignette:** boy, X-linked family history, progressive mixed hearing loss; CT: bulbous IAC fundus.
- **Checks:** (1) Diagnosis? → IP-III (POU3F4) (`im-ip3`). (2) Risk of stapes surgery? → CSF gusher (no
  modiolus) (`im-ip3`). (3) If implanted? → more complex; confirm electrode position after surgery (`im-ip3`).
- **Item:** the CT sign pair → bulbous IAC + absent modiolus.

## `case-leak` · Rhinorrhea after a retrosigmoid
- **Vignette:** day 5 after retrosigmoid resection with a closed dura: clear rhinorrhea, intact drum.
- **Checks:** (1) Route? → opened apical / posterior-lip cells → middle ear → Eustachian tube (`cc-csf`).
  (2) Why no otorrhea? → the drum is intact (`cc-csf`). (3) Which bones are at higher risk? → highly
  pneumatized ones (`os-cells`).
- **Item:** the route.

**Drill row** on the final section (`case-leak`): also include every concept used above (the section ids each case's checks cite).
