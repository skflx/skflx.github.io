/* =============================================================
   Neurovascular contents, rotation, arteries and planes
   OKSAT · Interactive learning · iac-anatomy · chapter 3
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'neurovascular',
    title: 'The wiring',
    kicker: '3 · Neurovascular contents',
    review: 'draft',
    lede: 'Two nerve bundles leave the brainstem and rotate inside a single dural sleeve while end arteries loop beside them. Tracing the 90° turn, the transition zone, the arterial loops and the arachnoid plane explains where tumours arise and how hearing and facial function are saved or lost.',
    src: 'K2 · K6 · K31 · J9 · J10 · HCA3 · HCA5 · HCA6 · PMIDs 12544018, 12680822, 19887989, 26242329, 37399929',
    tldr: [
        '**CN VIII** turns about **90°** inside the canal; only the fundus is fixed.',
        'The **nervus intermedius** leaves the brainstem between **VII** and **VIII**.',
        '**VIII**’s transition zone lies **9–14 mm** from the brainstem, **VII**’s **2–3 mm**; it is not where schwannomas start.',
        'The **labyrinthine artery** is an end artery, usually from an **AICA** loop.',
        'The dissection plane between tumour and facial nerve is what saves the nerve; at the porus they cling.',
    ],
    sections: [
        {
            id: 'nv-cpa',
            ref: ['Otology/The facial nerve traverses six distinct anatomical segments from the pons to the parotid gland'],
            n: '3.1',
            title: 'From the brainstem to the porus',
            blocks: [
                { t: 'p', x: '**VII** and **VIII** leave the brainstem at the pontomedullary junction [[src|K31]] [[src|K6]] and cross the **CPA** cistern to enter the porus as two structures: a tubular facial nerve and **VIII**, which enters as a single unit and divides inside the canal, identifiably only in the lateral **3–4 mm**. [[src|K31]]' },
                { t: 'p', x: 'In the canal, the cochlear division runs anteroinferiorly beneath the facial nerve, while the vestibular nerves lie in the posterior half. [[src|K31]] In retrosigmoid surgery the facial nerve is found more anteriorly along the brainstem, and the courses vary. [[src|HCA5 p65]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/iac-anatomy/stanford-fig-3.jpg',
                    alt: 'Retrosigmoid illustration of the right cerebellopontine angle showing the retracted cerebellum, brainstem, cranial nerves V and VII through XI, sigmoid sinus, jugular bulb, endolymphatic sac, vestibular aqueduct, semicircular canals, cochlea and petrous apex.',
                    cap: "CPA through a retrosigmoid view. Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas's educational permission.",
                },
                { t: 'check', id: 'c1', q: 'Where does VIII divide into separate nerves?', a: 'In the lateral 3–4 mm of the canal.' },
                { t: 'check', id: 'c2', q: 'How do VII and VIII enter the porus?', a: 'As two structures: a tubular facial nerve, and VIII as a single trunk.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-cpa'] }],
        },
        {
            id: 'nv-rotation',
            n: '3.2',
            title: 'The 90° turn',
            blocks: [
                { t: 'p', x: 'Tracing from fundus to brainstem, the cochleovestibular bundle rotates about **90°**, almost all of it inside the canal. At the fundus, the cochlear nerve lies in front of the inferior vestibular nerve, so the cochleovestibular cleavage plane is **vertical** (superior–inferior). Mid-canal, the cochlear and inferior vestibular nerves fuse and the plane is poorly defined. At the porus and in the **CPA**, the cochlear nerve lies **inferior** (anteroinferior) to the vestibular bundle, so the plane is **horizontal** (anterior–posterior). Viewed from medial while tracing fundus to brainstem, the **right ear** turns **counterclockwise** and the **left ear** turns **clockwise**. [[src|Owner]]' },
                {
                    t: 'layers',
                    id: 'nv-rot-ly',
                    alt: 'Four cross-sectional cuts of the right internal auditory canal and cerebellopontine angle from fundus to brainstem, viewed from medial, showing the 90 degree counterclockwise turn of the vestibulocochlear bundle and the positions of the facial nerve and nervus intermedius.',
                    base: 'images/oksat/iac-anatomy/rotation-base.svg',
                    mode: 'step',
                    cumulative: true,
                    layers: [
                        { id: 'fundus', label: 'At the fundus: four separate nerves', src: 'images/oksat/iac-anatomy/rotation-fundus.svg' },
                        { id: 'mid', label: 'Mid-canal: cochlear and inferior vestibular fused', src: 'images/oksat/iac-anatomy/rotation-mid.svg' },
                        { id: 'porus', label: 'At the porus: cochlear inferior to vestibular', src: 'images/oksat/iac-anatomy/rotation-porus.svg' },
                        { id: 'cpa', label: 'At the brainstem: horizontal cleavage plane; nervus intermedius between VII and VIII', src: 'images/oksat/iac-anatomy/rotation-cpa.svg' },
                    ],
                    cap: 'Right ear, four cuts from fundus to brainstem viewed from medial (anterior left, superior up); the left ear mirrors it and turns clockwise. Schematic.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: '180° is not normal anatomy',
                    blocks: [
                        { t: 'p', x: 'A **180°** turn would put the cochlear nerve above the vestibular nerve at the brainstem. Some atlases describe a 180° rotation; the disagreement is reviewed in the appraisal chapter. [[src|Owner]]' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'Go deeper · Chief — Variants',
                    blocks: [
                        { t: 'p', x: 'In about a quarter of ears there is no cleavage plane, leaving one fused trunk to the brainstem; in some ears the last **15–30°** of rotation happens just medial to the porus. [[src|Owner]] [[src|Silverstein 1986]] [[src|Schefter & Harner 1986]] The facial nerve’s own position varies too: in one cadaver series it stayed anterosuperior throughout in **37%** and turned **30–90°** in **63%**. [[src|Tian 2008]]' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'Go deeper · Chief — Surgical consequence',
                    blocks: [
                        { t: 'p', x: 'Selective vestibular neurectomy is most reliable laterally, before the nerves fuse; separating cochlear from inferior vestibular fibres mid-canal risks the cochlear nerve. [[src|Owner]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'How far does the bundle turn, and where?', a: 'About 90°, almost all inside the canal.' },
                { t: 'check', id: 'c2', q: 'At the brainstem, where is the cochlear nerve relative to the vestibular bundle?', a: 'Inferior.' },
                { t: 'check', id: 'c3', q: 'Right ear, fundus to brainstem, seen from medial: which way does the bundle turn?', a: 'Counterclockwise.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-rotation'] }],
        },
        {
            id: 'nv-intermedius',
            ref: [
                'Sinus/Gustatory sensation is transmitted via the chorda tympani, greater superficial petrosal, glossopharyngeal, and superior laryngeal nerves',
                'Otology/The first genu marks the location of the geniculate ganglion and origin of the greater superficial petrosal nerve',
            ],
            n: '3.3',
            title: 'Nervus intermedius',
            blocks: [
                { t: 'p', x: 'The **nervus intermedius** carries the facial nerve’s parasympathetic and sensory fibres. It exits the pons between the motor facial trunk and **VIII**, and how far it runs before joining **VII** varies. [[src|J9 figs 9.12–9.14]]' },
                { t: 'p', x: 'Its sensory fibres supply the posterior ear canal: hypesthesia there is the **Hitselberger sign**. [[src|J9]]' },
                { t: 'check', id: 'c1', q: 'Where does the nervus intermedius exit the brainstem?', a: 'Between motor VII and VIII.' },
                { t: 'check', id: 'c2', q: 'What is the Hitselberger sign?', a: 'Hypesthesia of the posterior ear canal from its sensory fibres.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q25'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-intermedius'] }],
        },
        {
            id: 'nv-orz',
            ref: ['Otology/Vestibular schwannomas arise from the Schwann cell sheath of the inferior or superior vestibular nerve'],
            n: '3.4',
            title: 'The transition zone',
            blocks: [
                { t: 'p', x: 'The **Obersteiner-Redlich zone** is where central (glial) myelin changes to peripheral (Schwann) myelin over a few millimetres, with the central myelin reaching further in the nerve’s core. Its distance from the root entry zone is **2–3 mm** for **VII** and **9–14 mm** for **VIII**. The zone is vulnerable to vascular compression, causing hemifacial spasm or vestibular paroxysmia. [[src|Radiopaedia]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'The schwannoma myth',
                    blocks: [
                        { t: 'p', x: 'That vestibular schwannomas arise at the transition zone is an erroneous myth. They arise from vestibular Schwann cells within the canal. [[src|Radiopaedia]] [[src|Xenellis & Linthicum 2003]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'One cadaver histomorphometry study found **VIII**’s central segment to be only **3.6 mm** (**VII** **3.7 mm**), placing its junction midway along the cisternal nerve. [[src|Gupta 2023]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'How far from the brainstem is VIII’s transition zone?', a: '9–14 mm (VII 2–3 mm).' },
                { t: 'check', id: 'c2', q: 'Do vestibular schwannomas arise there?', a: 'No; that is a myth.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q8'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-orz'] }],
        },
        {
            id: 'nv-aica',
            n: '3.5',
            title: 'AICA and its loops',
            blocks: [
                { t: 'p', x: 'An **AICA** loop may lie in the canal. [[src|K2]] The **Chavda classification** grades its position: **type I** lies in the **CPA**, **type II** enters at the porus up to half (**50%**) of the canal, and **type III** extends beyond half. In 664 sides, type I was **62%**, type II **30%** and type III **7.5%**, and types II and III were associated with unilateral hearing loss there. [[src|McDermott 2003]]' },
                {
                    t: 'layers',
                    id: 'nv-aica-ly',
                    alt: 'Coronal schematic of the right cerebellopontine angle and internal auditory canal with the brainstem, basilar artery, facial and vestibulocochlear nerves, cochlea, vestibule and subarcuate fossa, plus toggleable overlays for Chavda types I, II and III AICA loops, the labyrinthine artery and its branches, and the subarcuate artery.',
                    base: 'images/oksat/iac-anatomy/vessels-base.svg',
                    mode: 'toggle',
                    on: ['t1'],
                    layers: [
                        { id: 't1', label: 'Type I: loop in the CPA', src: 'images/oksat/iac-anatomy/vessels-chavda-1.svg' },
                        { id: 't2', label: 'Type II: enters the canal, up to half', src: 'images/oksat/iac-anatomy/vessels-chavda-2.svg' },
                        { id: 't3', label: 'Type III: beyond half the canal', src: 'images/oksat/iac-anatomy/vessels-chavda-3.svg' },
                        { id: 'laby', label: 'Labyrinthine artery and its branches', src: 'images/oksat/iac-anatomy/vessels-labyrinthine.svg' },
                        { id: 'subarc', label: 'Subarcuate artery', src: 'images/oksat/iac-anatomy/vessels-subarcuate.svg' },
                    ],
                    cap: 'Right ear, coronal-style view of the CPA and IAC (medial left, lateral right, superior up); loop shapes are not to scale. Schematic.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/iac-anatomy/stanford-fig-4.jpg',
                    alt: 'Retrosigmoid surgical illustration of the right cerebellopontine angle showing the cerebellar retractor, cranial nerves, sigmoid sinus, labyrinth, and an arterial loop entering the porus with a branch coursing toward the inner ear.',
                    cap: "CPA arteries, AICA loop and internal auditory artery. Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas's educational permission.",
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'In 58 patients, the Chavda type did not predict hearing loss; only a loop running between **VII** and **VIII** did. [[src|Gorrie 2010]]' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'Go deeper · Senior',
                    blocks: [
                        { t: 'p', x: 'Distal **AICA** infarction after surgery produces ipsilateral dysmetria.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Chavda type II?', a: 'Loop at the porus extending up to 50% of the canal.' },
                { t: 'check', id: 'c2', q: 'Commonest type?', a: 'Type I (in the CPA).' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q39'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-aica'] }],
        },
        {
            id: 'nv-labyrinthine',
            n: '3.6',
            title: 'The end artery',
            blocks: [
                { t: 'p', x: 'The **labyrinthine** (internal auditory) artery usually arises from **AICA**’s meatal loop (**90%** vs basilar **10%** in 10 cranial bases; single trunk **60%**, two **40%**), though the superior cerebellar artery is also a possible origin. [[src|Haidara 2015]] [[src|K6]]' },
                { t: 'p', x: 'It divides into the **anterior vestibular artery** (utricle, superior and lateral ampullae) and the **common cochlear artery** (proper cochlear artery and the vestibulocochlear artery, whose vestibular ramus supplies the posterior ampulla, saccule and parts of the utricle). [[src|K6]] [[src|Mazzoni 1990]] In **MCF** surgery it typically runs between **VII** and the cochlear nerve, not visible, and must be preserved for hearing. [[src|HCA3 p45]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'End artery',
                    blocks: [
                        { t: 'p', x: 'There is no collateral supply, so its loss costs the inner ear.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Usual origin?', a: 'AICA (its meatal loop).' },
                { t: 'check', id: 'c2', q: 'Its two divisions?', a: 'Anterior vestibular and common cochlear arteries.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-labyrinthine'] }],
        },
        {
            id: 'nv-subarcuate',
            n: '3.7',
            title: 'The subarcuate artery',
            blocks: [
                { t: 'p', x: 'The **subarcuate artery** emerges from the depression superolateral to the porus (the **subarcuate fossa**) [[src|K2]] and lies in the centre of the superior semicircular canal’s loop. [[src|J10 fig 10.9]] Coagulate and divide it before retracting the cerebellum: avulsion can tear **AICA**.' },
                { t: 'check', id: 'c1', q: 'Where does the subarcuate artery enter bone?', a: 'The subarcuate fossa, above and lateral to the porus, under the superior canal’s arch.' },
                { t: 'check', id: 'c2', q: 'Why coagulate and divide it before retracting the cerebellum?', a: 'Avulsion can tear AICA.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-subarcuate'] }],
        },
        {
            id: 'nv-meninges',
            n: '3.8',
            title: 'Dura and arachnoid',
            blocks: [
                { t: 'p', x: 'The posterior fossa dura lines the whole canal and merges with the nerves at their foramina [[src|K2]], and the subarachnoid space reaches the fundus (a fundal **CSF** cap on **T2 MRI** favours hearing preservation). [[src|HCA3 table 3.2]]' },
                { t: 'p', x: 'With superior vestibular tumours the dissection plane lies between tumour and facial nerve, and the superior vestibular nerve is dissected away from **VII** to create it; at the porus **VII** is most adherent and thinnest. [[src|HCA6 p81]]' },
                { t: 'check', id: 'c1', q: 'Where is the facial nerve most adherent to a schwannoma?', a: 'At the porus.' },
                { t: 'check', id: 'c2', q: 'Where does the dura merge with the nerves?', a: 'At their foramina.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['nv-meninges'] }],
        },
    ],
};
