# Brief · `imaging` — Reading the canal on CT and MRI (ch. 4, ~40 min)

**Title:** "Reading the tube". **tldr:**
- CT for bone, heavily T2-weighted 3D MRI for nerves. [K9]
- Measure: 4–8 mm normal, < 2 mm stenosis, > 2 mm asymmetry. [G1]
- A normal canal can hold a deficient cochlear nerve: measure the bony cochlear nerve canal and look for the fourth dot. [G1, G6]
- IP-III: bulbous fundus, no modiolus, X-linked. [G13]
- Schwannoma centres on the porus; meningioma sits on a broad dural base. [K9, VS module]

## `im-ct-read` · A CT read order
- **Teach:** CT gives bone and air; 0.5–0.625 mm slices with 0.3 mm reconstruction allow reformats [K9]. Read
  order (orchestrator's synthesis of the rows below; present it as a checklist): calibre, symmetry, flaring
  [G1] → transverse crest and Bill's bar [K2] → labyrinthine segment and geniculate [K2, K30] → basal turn
  [HCA3] → jugular bulb height under the canal [K2] → vestibular aqueduct (≤ the posterior canal's width,
  < 1.5 mm) [K9] → petrous apex pneumatization [K31]. → bony cochlear nerve canal (< 1.4 mm) [G6].
- **Figure:** `hotspot` with raster frames, UW axial 29, 32, 36 and coronal 14, 16 (`images/oksat/iac-anatomy/ct/…`
  from I1.3; each frame written with `regions: []`, then filled by `python -I tools/tbone-pipeline/slices.py --guide iac-anatomy` and checked with `--check`; never hand-place a region), explore and find. Caption credits "UW CT temporal bone module,
  University of Washington Department of Radiology".
- **Checks:** (1) "Upper limit of a normal vestibular aqueduct on axial CT?" → no wider than the posterior
  canal, < 1.5 mm. (2) "Two CT measurements to make before implanting a deaf child?" → IAC calibre and the
  bony cochlear nerve canal.
- **Ref:** none. **Practice:** none. **Drill:** `im-ct-read`.
- **Items:** (a) vestibular aqueduct < 1.5 mm. (b) read-order item: which structure you check for a high
  bulb (recall). (c) CT slice thickness 0.5–0.625 mm.

- **Also:** `figure` `images/oksat/iac-anatomy/stanford-fig-8.jpg` (coronal: VIII and the transverse crest). Credit line in the caption: "Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas's educational permission."

## `im-mri` · Which sequence answers what
- **Teach** [K9, K30]: MRI is the first choice for the IAC and CPA. Heavily T2-weighted 3D sequences (CISS,
  DRIVE, FIESTA), sub-millimetre, show the nerves in CSF without contrast. Contrast helps for tumours in the
  fundus, cochlea and vestibule. DWI shows restriction in epidermoid. Fat suppression matters after fat
  grafting. A standard brain MRI without thin sections through the IAC cannot exclude a small schwannoma.
- **Checks:** (1) "Which sequence shows the four nerves without contrast?" → a heavily T2-weighted 3D
  sequence (CISS/FIESTA/DRIVE). (2) "Why fat suppression after translab?" → the fat graft would mask
  enhancement.
- **Ref:** `Otology/Internal auditory canal lipomas demonstrate T1 hyperintensity with fat saturation signal loss and mandate conservative observation`.
- **Practice:** `pediatrics:q35`. **Drill:** `im-mri`.
- **Items:** (a) heavy T2 3D for nerves. (b) thin IAC sections needed. (c) DWI for epidermoid.

## `im-4dot` · The four dots
- **Teach:** the oblique-sagittal reconstruction perpendicular to the canal shows the four nerves (facial,
  cochlear, superior and inferior vestibular) as dots in CSF [owner #355: G1 caveat]. Displayed with anterior
  on the image left: facial upper-front, cochlear lower-front, superior vestibular upper-back, inferior
  vestibular lower-back. Medially the vestibular nerves fuse (`nv-rotation`).
- **Figure:** F2 frames 5–6 (`fundus-mri-*.svg`) as their own `hotspot` with find mode.
- **Checks:** (1) "On oblique-sagittal MRI, which dot is the cochlear nerve?" → lower front (anteroinferior).
  (2) "What happens to the two vestibular dots as you trace the canal medially?" → they fuse.
- **Ref:** none. **Practice:** none. **Drill:** `im-4dot`.
- **Items:** (a) orientation of the four dots. (b) which reconstruction plane (perpendicular to the canal).
  Do **not** write an item on relative nerve size (unsourced).

## `im-fundal-cap` · CSF at the fundus
- **Teach:** CSF in the fundus on T2 MRI, meaning the tumour stops short of the fundus, is one of the House
  Clinic's factors for hearing preservation (HCA3 table 3.2). Lateral extension into the fundus usually
  precludes serviceable hearing even with a hearing-preservation technique [K31]. Retrosigmoid leaves tumour
  at the fundus in ~7% vs 0% translab [K31].
- **Checks:** (1) "What does CSF at the fundus on T2 tell you?" → the tumour stops short of the fundus;
  better odds of preserving hearing. (2) "What does tumour extending into the lateral fundus imply for
  hearing preservation?" → it usually precludes serviceable hearing even with a hearing-preservation approach
  (and retrosigmoid leaves residual tumour at the fundus in ~7% vs 0% for translab).
- **Ref:** `Otology/The middle cranial fossa approach provides hearing preservation for intracanalicular schwannomas with lateral fundus extension`.
- **Practice:** none. **Drill:** `im-fundal-cap`.
- **Items:** (a) fundal cap meaning. (b) fundal extension precludes serviceable hearing.

## `im-cnd` · Cochlear nerve deficiency
- **Teach:** IAC stenosis < 2 mm is linked to VIII aplasia or severe hypoplasia [G1]; but about a third of
  deficient cochlear nerves sit in a normal-calibre canal [McClay 2008, owner], so measure the bony cochlear
  nerve canal (< 1.4 mm abnormal [Stjernholm 2002]) and check the anteroinferior dot on oblique-sagittal MRI.
  Canal width and nerve size predict implant outcome in ANSD [Jeong 2013]; children with auditory nerve
  hypoplasia (2.5% of one CI programme) do poorly with an implant [Valero 2012].
- **Figure:** F7b (`mri-cnd-aplasia.svg`) in the explore-only `hotspot`.
- **Call** `trap`, "CT alone is a trap": a normal IAC does not exclude CND.
- **Checks:** (1) "Normal IAC on CT, profound SNHL: what next?" → measure the BCNC; oblique-sagittal heavy T2
  MRI for the cochlear nerve. (2) "BCNC cutoff?" → < 1.4 mm.
- **Ref:** `Otology/Cochlear implant candidacy criteria include severe to profound bilateral sensorineural hearing loss` · `Otology/Auditory Brainstem Implantation ABI bypasses the cochlea and cochlear nerve to stimulate the cochlear nucleus in NF2` · `Otology/Otoacoustic emissions evaluate outer hair cell integrity and differentiate cochlear from auditory neuropathy spectrum disorder`.
- **Practice:** none. **Drill:** `im-cnd`.
- **Items:** (a) a third in normal canals. (b) BCNC < 1.4. (c) hypoplasia → poor CI outcomes.

## `im-ip3` · Incomplete partition type III
- **Teach** [G13]: X-linked recessive, POU3F4 [Xu 2024]; bilateral; bulbous IACs; absent bony modiolus with
  preserved interscalar septa; thin otic capsule; cochleovestibular and facial nerves present; hypothalamic
  anomalies common [Parlak 2022]. With no modiolus the fundus opens to the cochlea, so stapes surgery risks a
  CSF gusher (`pediatrics:q22`) and implantation is more complex: check electrode position after surgery
  [Xu 2024].
- **Figure:** F7c (`mri-ip3.svg`).
- **Checks:** (1) "Gene and inheritance of IP-III?" → POU3F4, X-linked. (2) "Two CT signs?" → bulbous IAC,
  absent modiolus.
- **Ref:** `Otology/Gushing footplate indicates a congenital perilymph fistula from an abnormally patent cochlear aqueduct` · `Otology/Inner ear malformations are classified by Jackler and Sennaroglu based on embryonic arrest timing and cochleovestibular architecture`.
- **Practice:** `pediatrics:q22`. **Drill:** `im-ip3`.
- **Items:** (a) POU3F4/X-linked. (b) CT signs. (c) why stapes surgery gushes.

## `im-otoscl` (`deep · Chief`)
- **Cut from this wave:** no source in the ledger. Do not write the section; do not register it.

## `im-lesions` · What is in the canal
- **Teach** [K9; HCA6 p69]: schwannoma: enhancing, "ice cream cone", centred on the porus with extension
  into the canal; hemosiderin foci possible. Meningioma: the second commonest CPA mass; dural based;
  hyperostosis is a strong sign (may be absent at the CPA); the dural tail is non-specific; displaces rather
  than invades VII and VIII. Epidermoid: the third; CSF-like on T1/T2, bright on DWI (unlike an arachnoid
  cyst). Facial nerve inflammation: enhancement of the intracanalicular or labyrinthine segment is abnormal
  (normal enhancement starts at the genu); Bell's palsy enhancement centres on the perigeniculate region,
  without much enlargement, and can last ≥ 4 months; it can mimic a small intracanalicular schwannoma, so
  repeat MRI rather than operate [K9, K30]. Geniculate lesions include hemangioma and schwannoma [J9].
- **Figure:** F7d1, F7d2 (`mri-vs.svg`, `mri-meningioma.svg`).
- **Deep · Senior**: IAC lipoma: T1 bright, suppresses with fat saturation; observe (wiki note).
- **Checks:** (1) "Strongest sign of meningioma?" → hyperostosis. (2) "Where does normal facial nerve
  enhancement start?" → at the geniculate (genu) and distally. (3) "Epidermoid vs arachnoid cyst?" → DWI.
- **Ref:** `Otology/Facial nerve schwannomas present with slow progressive paralysis or facial twitching along the Fallopian canal` · `Otology/Internal auditory canal lipomas demonstrate T1 hyperintensity with fat saturation signal loss and mandate conservative observation`.
- **Practice:** `vestibular-schwannoma:q26` (`:q22` dropped: it calls the dural tail the strongest meningioma sign; here it is non-specific). **Drill:** `im-lesions`.
- **Items:** (a) ice cream cone. (b) hyperostosis. (c) DWI epidermoid. (d) normal FN enhancement from the
  genu. (e) Bell's mimicking a schwannoma → repeat MRI.
