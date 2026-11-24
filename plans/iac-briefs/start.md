# Brief · `start` — Start here (no sections; chapter `start`, like `ar-crs-aerd/start.js`)

Copy the shape of `js/oksat/guides/ar-crs-aerd/start.js` and `ear-anatomy/start.js` (how to use the
guide, the Draft notice comes from `draft: true`).

**Lede:** "The internal auditory canal is a short bony tube whose nerves turn as they cross it, and whose
surgical anatomy changes with the direction you enter it from. This guide builds it from the bone out."

**Thesis bullets** (`tldr`):
- The canal is about 1 cm long and runs in line with the ear canal, not along the petrous pyramid. [G1]
- The fundus is fixed: two crests, four nerves, one small extra canal. Everything medial to it moves. [G3]
- The cochleovestibular bundle turns about 90° inside the canal. [G3]
- You read it on CT for bone and on heavily T2-weighted MRI for nerves. [K9]
- Translabyrinthine, middle fossa and retrosigmoid surgeons see the same fundus from three sides. [HCA3, HCA5, HCA6]
- Disease follows the anatomy: a bottleneck at the meatal foramen, end arteries, air cells that leak. [K30, G5, HCA5]

**Learning map** (a `steps` block, four steps): 1 · The bony box (`osteology`, `fundus`) → 2 · The wiring
(`neurovascular`) → 3 · Reading the tube (`imaging`) → 4 · Entering the tube (`approaches`), then
mechanisms (`clinical-correlations`), cases (`synthesis`) and the evidence (`appraisal`).

**Tier targets** (a `table`, head `['Level', 'Aim to know']`, one row each; not `cards`: in `start`, `cards` are dated source cards):
- *Junior (PGY-1/2):* fundal quadrants and crests; canal dimensions; the normal four-dot MRI; where a
  vestibular schwannoma sits.
- *Senior (PGY-3/4):* the six walls; the 90° turn; middle fossa landmarks; which corridor for which
  hearing and fundal extent.
- *Chief / boards (PGY-5):* the meatal foramen bottleneck; cochlear nerve deficiency, narrow bony
  cochlear nerve canal and IP-III before implantation; the retrosigmoid lateral blind spot; AICA and
  subarcuate artery salvage; CSF leak tracts.

**Scope** (`call k:'hook'`, label "What this guide leaves out"): external and middle ear (see `ear-anatomy`);
schwannoma management choices (see the `vestibular-schwannoma` module); trauma work-up (see
`temporal-bone-trauma`).

**Sources** (the first `intro` block: `cards`, `cols: 1`, one card each; every heading names a year, as
`ear-anatomy/start.js`):
- *House Clinic Atlas 2012*: Friedman, Slattery, Brackmann, *Lateral Skull Base Surgery: The House Clinic
  Atlas*, Thieme 2012, ch. 3, 5, 6 (middle fossa, retrosigmoid, translabyrinthine).
- *Otology and Neurotology 2013*: Kirtane, de Souza, Sanna, Thieme 2013, ch. 1, 2, 6, 9, 30, 31.
- *Ear Surgery Illustrated 2019*: Jackler, Thieme 2019, ch. 9, 10.
- *Stanford Skull Base Surgery Atlas 2009*: figures © RK Jackler (Thieme 2009), used with the atlas's
  educational permission.
- *UW CT temporal bone module, accessed 2026*: University of Washington Department of Radiology, used with
  permission.
Primary papers are cited by PMID in each chapter, not in a card.

**Terms** (`js/oksat/terms.js`): add `AICA` and `PGY` as terms, and `RK` (an author's initials in the Stanford credit) to `PLAIN`; check-data names any other the text needs.

**Currency check** (`call k:'trap'`, label "Currency check", second `intro` block): "Checked 2026-11. The
bony anatomy does not change; what moves is the degree of nerve rotation taught (this guide: about 90°),
cutoffs for a narrow canal and a narrow cochlear nerve canal, and the share of schwannomas that start on
each vestibular nerve. Draft: medical content not yet verified by the owner."
