# Ledger — IAC anatomy `[GROUND]` truth concordance (I0.2)

> Companion to [`2026-11-23-iac-anatomy-guide.md`](2026-11-23-iac-anatomy-guide.md) §7. Every number or
> classification the guide states comes from a row here. Prose quotes the **Adopted** column; a
> **Conflict** becomes a `trap` labelled "Source conflict"; **Single source** is said in the text.
> Content is draft until the owner vets this file (`docs/decisions.md` §7).

## Sources read

Abbreviations used in the rows. Book sources are the owner's Drive copies (`study-guide-test`), not
committed.

| Key | Source | What was read |
|---|---|---|
| HCA3 | Friedman RA, Fayad JN. The middle cranial fossa approach to vestibular schwannomas. In: Friedman, Slattery, Brackmann, *Lateral Skull Base Surgery: The House Clinic Atlas*, Thieme 2012, ch. 3, pp. 40–51 | whole chapter |
| HCA5 | Fayad JN, Friedman RA, Schwartz MS. The retrosigmoid approach. Ibid., ch. 5, pp. 59–67 | whole chapter |
| HCA6 | Slattery WH. The translabyrinthine approach to the skull base. Ibid., ch. 6, pp. 68–87 | passages on the IAC, bulb, aqueduct, crests, tumour origin, CSF |
| K2 | Kirtane, de Souza, Sanna, *Otology and Neurotology*, Thieme 2013, ch. 2 Surgical anatomy of the temporal bone | IAC, posterior face, cell tracts, facial nerve, jugular bulb passages |
| K9 | Ibid., ch. 9 Imaging of the temporal bone (Sakai et al.) | IAC/CPA, inflammation, CPA masses |
| K30 | Ibid., ch. 30 Facial nerve disorders | anatomy, Bell's palsy, electrodiagnosis, imaging |
| K31 | Ibid., ch. 31 Acoustic neuromas and NF2 (Sanna group) | origin, hearing classes, approach algorithm, IAC anatomy |
| ST6 | Stanford Skull Base Surgery Atlas (Jackler RK, Gralapp C; Thieme 2009), "Surgical anatomy", figs. 5–6 captions | captions only |
| K1, K6 | Kirtane ch. 1 Embryology; ch. 6 Anatomy of the vestibular system | whole chapters |
| J9, J10 | Jackler, *Ear Surgery Illustrated*, Thieme 2019, ch. 9 Facial nerve; ch. 10 Vestibular surgery | whole chapters (figure captions) |
| Owner | Owner answers on #355 (2026-11-23): Stanford figures, G1 cutoffs, G3 rotation, G4 transition zone | as written there |
| PubMed | Primary papers below, by PMID | abstracts only (the Xenellis editorial: title only) |

Read but not useful here: K12 (aural atresia only; nothing on the IAC, cochlear nerve deficiency or
IP-III). **Not available:** Rhoton, Cummings, Radiopaedia (HTTP 402). **Not read:** Jackler ch. 1 and 11; HCA ch. 14, 15, 17 (drawing references only).

## Rows

### G1 · IAC dimensions and cutoffs

- **Adopted (owner, #355):** normal diameter **4–8 mm**, measured perpendicular to the canal's long axis
  at mid-canal or the porus; **stenosis < 2 mm** (classic, with VIII aplasia or severe hypoplasia),
  **< 3 mm** in broader screening ("near-narrowed IAC"); **flaring > 8 mm** (some series give > 9 mm);
  **side-to-side asymmetry > 2 mm** is abnormal and calls for contrast MRI. Symmetric smooth-walled
  flaring with a sharp transverse crest favours a variant or dural ectasia; asymmetric widening with
  erosion favours a mass. A normal bony IAC does not exclude a deficient nerve (about a third of
  deficient nerves sit in a normal-calibre canal; McClay 2008).
- **Sources (owner-supplied, existence checked on PubMed):** Marques 2012 (PMID 23329967), El Sadik
  2017 (PMID 27665959), Ionescu 2023 (PMID 38137649), McClay 2008 (PMID 18794439). Normal values also:
  about 1 cm long (K2, K31); CT length 11.0–11.1 mm, mid-diameter 4.2 mm (PMID 41682992); in line with
  the EAC (K2, K31, HCA3 p42); porus posterior lip acute, anterior wall flatter (K2, K31).
- **Note:** Marques 2012's abstract reports adult vertical diameter 4.47 mm and opening width 7.10 mm,
  not a "4–8 mm" range; the range rests on the owner's note. The owner's reference "Jackler,
  Brackmann, Schindler, Otol Neurotol 2011;32(5):e36" is miscited: its DOI is Korban & Bassim,
  *Bilateral giant internal auditory canals*, Otol Neurotol 2011;32(8):e60 (PMID 21358559, case
  report). Cite it as that, or drop it.

### G2 · Meatal foramen and labyrinthine segment

- **Adopted:** narrowest point of the fallopian canal, average **0.68 mm**, at the meatal foramen
  (K30, citing Fisch & Esslen 1972); a periosteal band reinforces it, and the nerve fills **83%** of
  the canal there vs 73% tympanic and 64% mastoid (K30, citing Proctor & Nager 1982). Labyrinthine
  segment: shortest and thinnest, **3–5 mm** (K30; also K2). Canal bounded by the cochlea in front,
  the superior canal behind, the vestibule below (K2); the cochlea lies **≤ 1 mm** anterior to it
  (HCA3 p45).
- **Single source** for 0.68 mm and 83% (K30 citing primaries not read).

### G3 · Rotation of the nerves

- **Adopted (owner, #355):** the cochleovestibular bundle rotates about **90°** (not 180°), almost all
  of it inside the canal. Fundus: cochlear nerve anterior to the inferior vestibular nerve; the
  cochleovestibular cleavage plane runs superior–inferior. Mid-canal: the cochlear and inferior
  vestibular nerves fuse tightly; the plane is poorly defined. Porus and CPA: the cochlear nerve lies
  inferior (anteroinferior) to the vestibular bundle; the plane runs anterior–posterior. **Chirality**,
  tracing fundus → brainstem: **right ear counterclockwise, left ear clockwise**. Variations: no
  cleavage plane in ~25% (a fused trunk to the brainstem); in some, the last 15–30° occurs just medial
  to the porus. "180°" is not normal anatomy. Sources (owner-supplied, existence checked): Silverstein
  1986 (PMID 3108792), Schefter & Harner 1986 (PMID 3963686), Özdogmus 2004 (PMID 15255963).
- **Orchestrator note on viewpoint:** the owner's text gives no viewpoint for "counterclockwise". The
  figures draw each cut **viewed from medial** (anterior on the viewer's left for a right ear), and the
  owner's positions (vestibular bundle posterior at the fundus, superior at the porus) then turn
  counterclockwise on screen for a right ear. The guide states the viewpoint whenever it states the
  chirality. Owner to confirm on the R1 read.
- **Kept as context, not a conflict:** the Stanford/Jackler "180°" caption (ST6) and Tian 2008 (the
  facial nerve's own position varies, 0° in 37%, 30–90° in 63%) are cited in `appraisal`. Owner's
  surgical pearls (adopted): selective vestibular neurectomy is most reliable laterally, before
  fusion; separating the cochlear and inferior vestibular nerves mid-canal risks the cochlear nerve.

### G4 · Obersteiner-Redlich zone

- **Adopted (owner, #355, from Radiopaedia "Transition zone (nerve)"):** a few millimetres where central
  (glial) myelin gives way to peripheral (Schwann) myelin, with the central myelin extending further in
  the nerve's core. Distance from the root entry zone: **VII 2–3 mm**, **VIII 9–14 mm** (also V 4 mm;
  III, IV, VI < 1 mm; IX 1–2 mm). The zone is susceptible to vascular compression (hemifacial spasm for
  VII, vestibular paroxysmia for VIII). That vestibular schwannomas arise at the zone is an **erroneous
  myth** (Radiopaedia; Xenellis & Linthicum 2003, PMID 12544018).
- **Source conflict (kept):** cadaver histomorphometry finds similar central segments, 3.6 mm (VIII)
  vs 3.7 mm (VII), with VIII's junction midway along the cisternal nerve (Gupta 2023, PMID 37399929). The
  guide adopts the Radiopaedia distances and shows Gupta as a Source conflict trap.
- The blueprint's misconception row returns in corrected form: "VS arises at the transition zone" →
  myth; they arise from vestibular Schwann cells within the canal (G7, G11).

### G5 · AICA loops and labyrinthine artery

- **Adopted:** Chavda classification from McDermott et al. with Chavda (PMID 12680822), 664 sides on
  CISS: type I (in the CPA) 412 (62%), type II (at the porus, up to 50% of the canal) 202 (30%), type III
  (beyond 50%) 50 (7.5%); types II and III associated with unilateral hearing loss there. Not
  reproduced in 58 patients (PMID 19887989); there only a loop **between VII and VIII** was associated.
  Labyrinthine artery from AICA's meatal loop in **90%**, basilar 10%, in 10 cranial bases (PMID
  26242329; small sample); single trunk 60%, two 40%. Canal contents include the internal auditory
  artery and vein; an AICA loop may be present (K2). In MCF surgery the internal auditory artery
  typically runs between the facial and cochlear nerves and is not visible; it must be preserved for
  hearing (HCA3 p45). Subarcuate artery emerges from the depression superolateral to the porus (K2).
- **Conflict** on the clinical meaning of loops: shown as a Source conflict in `nv-aica` and `cc-nvc`.

### G6 · Bony cochlear nerve canal

- **Adopted:** normal diameter ~1.9–2.6 mm (casts 2.58 mm; CT 1.91–1.98 mm); **< 1.4 mm** suggests a
  cochlear nerve abnormality, **> 3.0 mm** other anomalies (Stjernholm & Muren, PMID 11876597).
  Hypoplastic canals in congenital SNHL with otherwise normal CT (Fatterpekar, PMID 10751494). Canal
  width and nerve size predict CI outcome in ANSD (PMID 23768056); children with auditory nerve
  hypoplasia (2.5% of one CI programme) do poorly with CI (PMID 21750462). The cochlear nerve leaves
  the anterior lower fundus through a central canal ringed by small foramina (K2).
- **Not adopted:** "< 1.5 mm" (common citation, not in the abstracts read). The guide says < 1.4 mm
  and notes that cutoffs vary between series.
- **Not sourced:** "cochlear nerve ≥ facial nerve on oblique-sagittal MRI". Taught as a radiology rule
  of thumb only if a source is added.

### G7 · Nerve of origin of vestibular schwannoma

- **Conflict.** IVN **84.8%**, SVN 8.9%, undetermined 5.6%, facial 0.7%, cochlear 0 in 271
  translabyrinthine cases (Komatsuzaki & Tsunoda, PMID 11410128); "up to 91%" IVN (K31). HCA6 p81:
  "Acoustic tumors usually arise from the superior vestibular nerve." Preoperative vHIT/VEMP scores
  predict IVN origin with 73% sensitivity, 80% specificity (PMID 33883565).
- **Adopted:** most series find the inferior vestibular nerve; one major surgical atlas states the
  superior; shown as a Source conflict in `cc-vs-origin`. Sporadic ~95%, NF2 ~5% (K31).

### G8 · Retrosigmoid posterior-lip drilling

- **Adopted:** drilling is limited by the posterior semicircular canal; **5 mm** of canal can be
  exposed reliably in all cases, **up to 10 mm** in selected cases (HCA5 p60); exposure is usually the
  medial two-thirds, and the lateral third risks the vestibule or common crus (HCA5 p63). The
  vestibular aqueduct is the lateral limit in hearing preservation (HCA5 p67); the endolymphatic duct
  opening marks the PSCC (K2). Residual tumour at the fundus ~7% retrosigmoid vs 0% translabyrinthine
  (K31).
- **Not adopted:** the blueprint's 7–9 mm.

### G9 · MCF size limit and Bell's palsy decompression

- **Conflict** (MCF size): House Clinic "small tumors (≤ 2 cm) and serviceable hearing"; hearing
  preservation extremely unlikely > 2 cm (HCA3 p40, p50–51). Sanna group: < 1.5 cm with good hearing
  and no fundal extension → retrosigmoid-retrolabyrinthine; fundal extension usually precludes
  serviceable hearing (K31). Blueprint ≤ 1.5 cm. Taught as a Source conflict; management stays in
  `vestibular-schwannoma`.
- **Adopted** (Bell's): Gantz et al. 1999 (PMID 10443817): **> 90% degeneration on ENoG and no
  voluntary EMG potentials within 14 days** of total paralysis; MCF decompression of meatal foramen,
  labyrinthine segment, geniculate and tympanic segment; 91% HB I–II vs 58% poor (HB III–IV) in
  controls who declined. Must be within 2 weeks. ENoG needs ≥ 3 days for Wallerian degeneration;
  85% of Bell's recover spontaneously (K30). Appraisal: non-randomized, self-selected controls.
- **Imaging:** normal facial nerve enhancement from the genu distally; intracanalicular or labyrinthine
  enhancement is abnormal; Bell's may mimic a small intracanalicular schwannoma, and the enhancement
  can last ≥ 4 months (K9, K30).

### G10 · MCF landmark geometry

- **Adopted:** HCA3 as before (superior canal 45–60° to the IAC; ~60° to the arcuate eminence or the
  bisector of the arcuate eminence–GSPN angle; start medially at the porus; arcuate eminence–canal
  relation inconstant; geniculate dehiscent ~16%; cochlear base to superior canal ampulla ~2.5 mm; ≤ 2 mm
  burrs laterally; SVN followed half the labyrinthine length; 270° medially).
- **Eponyms now sourced:** *Garcia-Ibañez* = bisect the arcuate eminence–GSPN angle; *Fisch* = the
  arcuate eminence–IAC angle; *House* = trace the GSPN back to the geniculate (House 1961, cited in
  HCA3). CT of 100 sides (Sahana 2023, PMID 37141941, doi:10.1016/j.wneu.2023.04.110): arcuate
  eminence–GSPN angle **126.2 ± 11.6°** (106–156), bisector **63 ± 5.8°**; arcuate eminence–IAC (Fisch)
  **73.5 ± 11.7°** (51–105). Cadaver study (Maina 2007, PMID 18449332): the Garcia-Ibañez method is
  "the simplest and most reliable"; landmark variability is large.
- **Conflict:** the Fisch angle (73.5° on CT) vs "about 60°" (HCA3): shown in `appraisal`.

### G11 · Fundal branches and ganglion

- **Adopted:** Voit's nerve supplies the superior part of the saccule (Büki & Ward, PMID 34260510). The
  singular nerve leaves posteroinferior to the IVN (K2, K31) and lies near the round window membrane,
  the singular neurectomy landmark (K2). Fundus: smaller upper zone, larger lower zone (K2).
  Anastomoses: vestibulofacial 83%, vestibulocochlear 80% of 30 bones (PMID 18253691); Oort's (IVN →
  cochlear) named by the owner (#355).
- **Vestibular (Scarpa) ganglion, now sourced (K6):** at the bottom (lateral end) of the internal
  auditory meatus, divided into superior (superior and lateral ampullae, utricle, anterosuperior
  saccule) and inferior (posterior ampulla, rest of the saccule) parts.
- **Labyrinthine artery (K6, Mazzoni 1990):** may arise from AICA, the superior cerebellar artery or
  the basilar; it divides into the anterior vestibular artery (utricle, superior and lateral ampullae)
  and the common cochlear artery (proper cochlear artery and vestibulocochlear artery, whose
  vestibular ramus supplies the posterior ampulla, the saccule and parts of the utricle).

### G12 · Facial nerve displacement and hearing classes

- **Adopted:** AAO-HNS classes A–D (K31 table, as before); > 90% HB I at diagnosis (K31); meningiomas
  displace rather than invade VII and VIII (HCA6 p69); with an SVN tumour the plane is between tumour
  and VII; at the porus VII is most adherent and thinnest (HCA6 p81); in retrosigmoid surgery VII is
  found more anteriorly along the brainstem, its course variable (HCA5 p65). Nervus intermedius exits
  the pons between motor VII and VIII; the distance before it joins VII varies (J9 figs 9.12–9.14).
- **Still not sourced:** displacement-pattern frequencies; Gardner-Robertson thresholds (the 1988
  paper, PMID 3277525, exists; its abstract gives no classes); the 50/50 rule. Taught without numbers;
  Gardner-Robertson and 50/50 are not named.

### G13 · IP-III

- **Adopted:** bilateral IP-III, bulbous IACs, absent bony modiolus with preserved interscalar septa,
  intact cochleovestibular and facial nerves, thin otic capsule; hypothalamic anomalies common (PMID
  34914607). **POU3F4** mutations are the principal cause; X-linked recessive (Xu 2024, PMID 38498189,
  doi:10.1007/s00405-024-08555-7). Implantation is the main treatment but surgically more complex; check
  electrode position after surgery (same).

### G14 · Embryology of the IAC

- **Adopted (K1):** week 4, the acousticofacial ganglion splits: dorsal → geniculate ganglion (VII);
  ventral → statoacoustic ganglion, whose superior part forms the superior vestibular nerve and whose
  inferior part forms both the inferior vestibular nerve and the cochlear ganglion. The macular and
  crista primordia split the same way (superior → utricle and superior and lateral cristae; inferior →
  saccule and posterior crista). The otic capsule ossifies from week 15 from 14 centres, fused by week
  23 with no sutures. The cochlear aqueduct forms between weeks 9 and 40, from a remnant of the
  inferior cochlear vein; it is not a true duct.
- **Not sourced:** that the canal forms around the nerve, so its calibre tracks the nerve. `os-dev`
  teaches the ganglion split instead (it explains why IVN and cochlear fibres stay intertwined and
  fuse mid-canal; G3).

### Other facts used by the outline

- Cochlear aqueduct: the inferior and anterior limit of translabyrinthine drilling; IX–XI lie below
  it (HCA6 p77; K2); its external aperture is the uppermost limit of the jugular foramen (K2).
  The posterior canal ampulla marks the inferior border of the IAC in translab; the superior canal
  ampulla marks the superior border (HCA6 p75, p77). The jugular bulb can reach the IAC (K2).
- CSF: ET plugging and middle ear obliteration in translab reduce rhinorrhea (HCA6 p77); petrous
  apex cells above the IAC must be waxed (HCA6 p78); retrosigmoid leaks are commoner because apical
  cells are hard to seal, and true watertight dural closure is "generally impossible" (HCA5 p65–66);
  highly pneumatized bones carry more risk (K31).
- Imaging: heavily T2-weighted 3D sequences (CISS, DRIVE, FIESTA) show the nerves in CSF without
  contrast (K9); meningioma is the second commonest CPA mass, hyperostosis a strong sign, the dural
  tail non-specific; epidermoid third, bright on DWI unlike an arachnoid cyst (K9).

## Changes to the spec this ledger forces

Superseded by the chapter briefs in [`iac-briefs/`](iac-briefs/README.md), which apply every row above
section by section. Briefs win over the spec's §5 outline where they differ.
