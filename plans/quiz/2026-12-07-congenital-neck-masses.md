# Quiz brief: Congenital head and neck masses (MacArthur, quiz Mon 12/7)

**SKELETON.** Written before intake (step 1) so the source map and grill start from a scope. Nothing
below is keyed yet: every claim gets its source tag after the source map, and the executor writes nothing
from this file until the grill has run and this notice is gone. Issue: #387.

## 1. Identity

- Guide slug and module slug: `congenital-neck-masses` (provisional until the grill). Subspecialty:
  `pediatrics`.
- Contrast axis (proposed, grill decides): **location**, midline vs lateral vs posterior/diffuse, because
  it is how the differential is taught and tested. One location table per chapter; paired cases.
  Secondary trap carried through: a "branchial cyst" presenting in an adult is a cystic nodal metastasis
  (HPV-positive oropharyngeal or thyroid) until proven otherwise.
- Existing items to reuse by `practice` ref: `pediatrics:q26` (BOR syndrome). No other OKSAT module
  covers this topic; `ear-anatomy` covers arch derivatives of the ear only (no ref planned).

## 2. Sources (to collect; ranked per `/quiz-prep`)

| Tag | Source | Rank | Covers | Status |
|---|---|---|---|---|
| S1 | MacArthur's own slides, handout or assigned reading | 1 | the faculty's scope and keying | **owner to supply** |
| S2 | Cummings Pediatric Otolaryngology (2021) ch. 23, Congenital and Inflammatory Neck Masses | 2 | branchial, TGDC, dermoid, teratoma, thymic, fibromatosis coli, approach | in Drive |
| S3 | Cummings Pediatric ch. 25, Vascular Anomalies of the Head and Neck | 2 | ISSVA, IH, RICH/NICH, LM, VM, AVM, treatment | in Drive |
| S4 | Cummings Pediatric ch. 5, Congenital and Acquired Malformations (nose/nasopharynx) | 2 | midline nasal masses (dermoid, glioma, encephalocele) | in Drive; include only if the grill keeps nasal masses |
| S5 | Cummings Pediatric ch. 26, Pediatric Head and Neck Neoplasms | 2 | red flags that move a "congenital" mass to malignant workup | in Drive; differential only |
| S6 | The RR deck for this session, if one exists | 3 | likely test points | **owner to supply** |
| S7 | sk.oto Pediatrics and Head_and_Neck notes (§4 `ref` rows) | 4 | cross-links | in repo index |
| S8 | ISSVA classification (2018 update, issva.org) | check | tumor vs malformation nomenclature | public; orchestrator fetches |
| S9 | AAP clinical practice guideline for infantile hemangioma (Krowchuk 2019) | check | propranolol indications, dosing, high-risk IH | public; orchestrator fetches |

Textbook figures already in Drive from earlier work (branchial cleft embryology, first/second cleft
fistula excision, second cleft cyst CT, third cleft piriform sinus, pediatric neck mass algorithm) are
figure candidates once their source chapter and credit are confirmed.

Conflicts: none yet.

## 3. Steps and Touch

- **A:** `js/oksat/guides/congenital-neck-masses/start.js`, chapters 1 and 2;
  `js/oksat/modules/congenital-neck-masses.js` (items for those chapters); `js/oksat/manifest.js`;
  `js/oksat/terms.js`; `images/oksat/congenital-neck-masses/`; `*.html` stamps.
- **B:** chapters 3 and 4, the synthesis chapter and cases; the rest of the module; `README.md`,
  `docs/wip.md`.

## 4. Chapters (outline; sections are concepts, refs are existing sk.oto notes)

### 0. Start here (step A)

How the guide runs; the location axis; the one table (midline / lateral / posterior, congenital vs
inflammatory vs neoplastic).

### 1. Embryology and the approach to a pediatric neck mass (step A)

#### 1.1 The pharyngeal apparatus (concept `pharyngeal-apparatus`, `ref`: `Pediatrics/Each branchial arch packages one nerve, one artery, one cartilage bar, and one muscle group`)
Arches, clefts, pouches; which derivative explains which tract. Cleft = ectoderm (skin side), pouch =
endoderm (pharynx side).

#### 1.2 Thyroid descent (concept `thyroid-descent`, `ref`: `Pediatrics/Thyroglossal duct cyst tract tracks from the foramen cecum through the hyoid bone to the anterior neck`)
Foramen cecum to the lower neck; ectopic and lingual thyroid.

#### 1.3 Approach and imaging (concept `approach`, `ref`: `Pediatrics/Pediatric head and neck lymphomas present as painless cervical lymphadenopathy staged by Ann Arbor and St Jude systems`)
Age, location, timing, inflammatory course; ultrasound first, when CT vs MRI; red flags for malignancy
(rhabdomyosarcoma, lymphoma, neuroblastoma: S5); the adult cystic-mass trap.

### 2. Midline masses (step A)

#### 2.1 Thyroglossal duct cyst (concept `tgdc`, `ref`: `Pediatrics/Sistrunk procedure resects the thyroglossal duct cyst with the central body of the hyoid bone and foramen cecum core`)
Moves with tongue protrusion; confirming normal thyroid before excision; Sistrunk and recurrence; TGDC
carcinoma.

#### 2.2 Dermoid and epidermoid cysts (concept `dermoid`)
Submental and midline neck; contrast with TGDC.

#### 2.3 Teratoma (concept `teratoma`)
Cervical teratoma, prenatal diagnosis, airway and EXIT planning.

#### 2.4 Midline nasal masses (concept `nasal-midline`, `ref`: `Pediatrics/Congenital midline nasal masses must be imaged before any biopsy to exclude intracranial connection`, `Pediatrics/Congenital nasal dermoid sinus cysts require preoperative MRI and CT to detect intracranial extension through the foramen cecum or bifid crista galli`)
Dermoid sinus cyst, glioma, encephalocele; Furstenberg sign; image before biopsy. **Grill: in or out.**

#### 2.5 Ranula (concept `ranula`, `ref`: `Head_and_Neck/Plunging ranula is a sublingual mucus extravasation pseudocyst herniating around the mylohyoid free edge`)
Simple vs plunging; sublingual gland excision. **Grill: acquired, may be out of scope.**

### 3. Lateral masses (step B)

#### 3.1 First branchial cleft anomalies (concept `first-cleft`, `ref`: `Pediatrics/First branchial cleft anomalies present as periauricular cysts or sinus tracts parallel to the external auditory canal`, `Pediatrics/First branchial cleft Work Type I and Type II anomalies require superficial parotidectomy with facial nerve dissection`)
Work type I vs II; relation to the facial nerve; parotidectomy approach.

#### 3.2 Second branchial cleft anomalies (concept `second-cleft`, `ref`: `Pediatrics/Second branchial cleft anomalies represent the most common branchial anomaly situated anterior to the sternocleidomastoid`)
Most common; tract course relative to the carotids and CN IX/XII to the tonsillar fossa; Bailey types;
stepladder incision.

#### 3.3 Third and fourth pouch anomalies (concept `piriform-sinus`, `ref`: `Pediatrics/Third and fourth branchial pouch anomalies present as recurrent left thyroid bed abscesses and piriform sinus fistulas`)
Left-sided, recurrent suppurative thyroiditis; direct laryngoscopy, endoscopic cauterization vs open.

#### 3.4 Branchial syndromes (concept `bor`, `ref`: `Pediatrics/Branchio-oto-renal syndrome pairs branchial fistulas, preauricular pits, structural renal dysplasia, and mixed hearing loss`)
BOR; practice ref `pediatrics:q26`.

#### 3.5 Thymic cysts and fibromatosis coli (concept `thymic-scm`, `ref`: `Pediatrics/Fibromatosis coli presents as a benign neonatal sternocleidomastoid mass causing congenital muscular torticollis`)
Cervical thymic cyst; SCM tumor of infancy, physical therapy first.

### 4. Vascular anomalies (step B)

#### 4.1 ISSVA: tumor vs malformation (concept `issva`)
The one split that decides everything: proliferates and involutes vs grows with the child.

#### 4.2 Infantile hemangioma (concept `infantile-hemangioma`, `ref`: `Pediatrics/Infantile hemangiomas exhibit rapid neonatal proliferation followed by slow involution driven by GLUT-1 positivity`, `Pediatrics/Oral propranolol is the first-line pharmacotherapy for proliferating infantile hemangiomas`, `Pediatrics/Beard distribution infantile hemangiomas are associated with symptomatic subglottic hemangiomas requiring oral propranolol`)
GLUT-1, natural history, high-risk features, PHACE, beard distribution and the airway, propranolol;
RICH/NICH and kaposiform hemangioendothelioma (Kasabach-Merritt) as GLUT-1-negative contrasts.

#### 4.3 Lymphatic malformation (concept `lymphatic-malformation`, `ref`: `Pediatrics/Lymphatic malformations are slow-flow vascular anomalies classified into macrocystic and microcystic lesions`, `Pediatrics/Bleomycin and OK-432 picibanil sclerotherapy provide targeted ablation of macrocystic lymphatic malformations`)
Macro vs microcystic, staging, sclerotherapy vs resection, sirolimus, airway.

#### 4.4 Venous and arteriovenous malformations (concept `vm-avm`, `ref`: `Pediatrics/Venous malformations are slow-flow vascular anomalies characterized by bluish compressible swelling, dependent engorgement, and pathognomonic phleboliths`, `Head_and_Neck/Head and neck arteriovenous malformations are staged by the Schobinger classification to guide embolization and complete surgical nidus resection`)
Slow vs fast flow; phleboliths; Schobinger; embolization then resection.

### 5. Synthesis (step B)

See §5.

Size target: 4 content chapters, about 17 sections, 45 to 60 items.

## 5. Synthesis cases (step B; drafted after the source map)

- `case-midline`: a child with a midline neck cyst; the naive answer (simple excision) is wrong when it
  moves with tongue protrusion and no other thyroid tissue is shown.
- `case-lateral-adult`: a 45-year-old with a cystic lateral neck mass labelled "branchial cyst".
- `case-piriform`: recurrent left neck abscess in a child.
- `case-infant-airway`: a beard-distribution hemangioma with biphasic stridor.

## 6. Figures

Textbook figures first (candidates in Drive, §2). No bespoke SVG unless the owner approves one in the
grill (candidate: the second cleft tract between the carotids, if no usable textbook figure).

## Open questions for the grill

1. Nasal midline masses (2.4) and ranula (2.5): in or out?
2. Malignant pediatric masses: differential and red flags only (proposed), or their own chapter?
3. Vascular anomalies: a full chapter (proposed), or only as neck masses (LM and IH)?
4. Contrast axis: location (proposed) or child vs adult?
5. Did MacArthur assign papers? If so, an appraisal section is added.
