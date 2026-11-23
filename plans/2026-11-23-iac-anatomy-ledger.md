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
| PubMed | Primary papers below, by PMID | abstracts only (the Xenellis editorial: title only) |

Read but not useful here: K12 (aural atresia only; nothing on the IAC, cochlear nerve deficiency or
IP-III). **Not available:** Rhoton, Cummings, Radiopaedia (HTTP 402). **Not yet read:** Jackler *Ear
Surgery Illustrated* ch. 1, 9, 10, 11; HCA ch. 14, 15, 17; K6 (vestibular anatomy). They are drawing
references for I0.4 and can add columns later.

## Rows

### G1 · IAC dimensions and cutoffs

- **Adopted:** about 1 cm long (K2, K31); CT mean length 11.0–11.1 mm and mid-canal diameter 4.2 mm
  in 162 patients, no sex or age difference (PMID 41682992). Long axis in line with the EAC (K2, K31,
  HCA3 p42). Porus: posterior lip an acute angle, anterior wall flatter (K2, K31).
- **Not adopted:** the blueprint's stenosis (< 2–3 mm), flaring (> 8 mm) and asymmetry (> 2 mm)
  cutoffs. No source read states them. The guide teaches symmetry and calibre qualitatively and
  names no cutoff until one is sourced.
- **Owner:** add a source for the cutoffs, or accept the qualitative wording.

### G2 · Meatal foramen and labyrinthine segment

- **Adopted:** narrowest point of the fallopian canal, average **0.68 mm**, at the meatal foramen
  (K30, citing Fisch & Esslen 1972); a periosteal band reinforces it, and the nerve fills **83%** of
  the canal there vs 73% tympanic and 64% mastoid (K30, citing Proctor & Nager 1982). Labyrinthine
  segment: shortest and thinnest, **3–5 mm** (K30; also K2). Canal bounded by the cochlea in front,
  the superior canal behind, the vestibule below (K2); the cochlea lies **≤ 1 mm** anterior to it
  (HCA3 p45).
- **Single source** for 0.68 mm and 83% (K30 citing primaries not read).

### G3 · Rotation of the nerves

- **Conflict.** Blueprint: about 90°. Stanford atlas (ST6, fig. 6): "gradual 180 degree rotation"
  between fundus and brainstem, positions far more variable mid-canal than at the fundus. Cadaver
  series, 30 bones (PMID 18253691): the facial nerve stays anterosuperior to VIII through the whole
  canal in 37%; in 63% it rotates anteroinferiorly by **30–90°**, the same direction as the cochlear
  nerve. VIII enters the porus as one trunk and divides into identifiable nerves only in the lateral
  **3–4 mm** (K31).
- **Adopted teaching:** the fundus is fixed (four quadrants, two crests); medially the bundle rotates
  by a variable amount, so the clock face does not hold mid-canal. The guide gives the 30–90%
  cadaver data and the atlas's 180° as a Source conflict. It states **no per-ear handedness**: none
  of the sources read gives one.
- **Owner:** confirm this stance (it replaces the blueprint's fixed 90°).

### G4 · Obersteiner-Redlich zone

- **Conflict.** Blueprint: VIII has the longest central myelin segment (~8–11 mm, into the canal) vs
  VII ~1–2 mm. K31: VIII's transition is "near the porus acousticus". Histomorphometry of cisternal
  nerves (PMID 37399929): central segment **3.6 ± 1.4 mm** for VIII vs 3.7 ± 1.6 mm for VII; VIII's
  junction midway between brainstem and meatus (13–54% of length). An editorial titled "On the myth of
  the glial/Schwann junction (Obersteiner-Redlich zone)" (Xenellis & Linthicum, PMID 12544018) argues
  the tumours do not arise at the zone (title only read).
- **Adopted teaching:** the zone is real and the transition is in the cisternal segment; whether it
  explains where schwannomas arise is contested. The misconception row "VS arises at the root entry
  zone → the O-R zone of VIII lies in the canal" (spec §5.9) is **withdrawn**. The safe fact: the
  tumours arise from vestibular Schwann cells, mostly within the canal (G7). `nv-orz` becomes a
  short section ending in a Source conflict, not a mechanism.
- **Owner:** confirm the withdrawal; read the Xenellis editorial if available.

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

- **Adopted:** the superior canal makes a **45–60°** angle with the IAC (HCA3 p44); begin medially
  at the porus, at about 60° to the arcuate eminence or on the line bisecting the angle between the
  arcuate eminence and the GSPN (HCA3 p42, p49); the arcuate eminence–superior canal relation is
  inconstant (HCA3 p42); geniculate dehiscent in ~16% (HCA3 p42); about 2.5 mm from cochlear base to
  superior canal ampulla, so ≤ 2 mm diamond burs at the lateral IAC (HCA3 figs 3.6–3.7); the SVN can be
  followed about half the length of the labyrinthine nerve before the ampulla (HCA3 p45); medially
  270° of the circumference can be removed (HCA3 p45).
- **Not verified:** eponyms (House = follow the GSPN; Fisch = 60° from the blue-lined superior canal;
  Garcia-Ibañez = the bisector). HCA3 gives the methods without the names. The guide shows the methods,
  and the names only once sourced.

### G11 · Fundal branches and ganglion

- **Adopted:** Voit's nerve is the nerve to the superior part of the saccule, through its own bony
  channel (Büki & Ward, PMID 34260510); the posterior ampullary (singular) nerve leaves through its
  canal posteroinferior to the IVN (K2, K31) and lies close to the round window membrane, the landmark
  for singular neurectomy (K2). Fundus: the transverse crest divides a smaller upper zone from a larger
  lower zone (K2). Anastomoses: vestibulofacial in 83%, vestibulocochlear in 80% of 30 bones (PMID
  18253691).
- **Not sourced:** vestibular (Scarpa) ganglion position along the canal. `nv-ganglion` waits for a
  source.

### G12 · Facial nerve displacement and hearing classes

- **Adopted:** AAO-HNS hearing classes: A ≤ 30 dB and ≥ 70%; B > 30–50 dB and ≥ 50%; C > 50 dB and
  ≥ 50%; D any PTA and < 50% (K31 table). > 90% are House-Brackmann I at diagnosis (K31). Meningiomas
  displace rather than invade VII and VIII, so they leave better odds of hearing (HCA6 p69). With an
  SVN tumour the plane is between tumour and VII; at the porus VII is most adherent and thinnest
  (HCA6 p81).
- **Not sourced:** displacement-pattern frequencies; Gardner-Robertson; the 50/50 rule. Not stated
  with numbers until sourced.

### G13 · IP-III

- **Adopted:** 13 XLD patients: bilateral IP-III, bulbous IACs, absent bony modiolus with preserved
  interscalar septa, intact cochleovestibular and facial nerves, thin otic capsule; hypothalamic
  anomalies common (Parlak et al. with Sennaroglu, PMID 34914607). POU3F4 is not in the abstract read;
  name it once a source is added.

### G14 · Embryology of the IAC

- **Not sourced.** `os-dev` waits for a source (Kirtane ch. 1 is the candidate) or is cut.

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

1. §5.9: withdraw the Obersteiner-Redlich misconception row (G4).
2. `nv-rotation`: no per-ear handedness (G3).
3. `os-morph`, `im-cnd`: no stenosis, flaring or asymmetry cutoffs; BCNC < 1.4 mm (G1, G6).
4. `ap-retrosig`: 5 mm reliable, up to 10 mm, medial two-thirds (G8).
5. `ap-mcf-landmarks`: methods taught; eponyms only once sourced (G10).
6. `nv-ganglion`, `os-dev`: wait for a source (G11, G14).
