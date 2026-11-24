/* =============================================================
   Mechanisms
   OKSAT · Interactive learning · iac-anatomy · chapter 6
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'clinical-correlations',
    title: 'Mechanisms',
    kicker: '6 · Clinical correlations',
    review: 'draft',
    lede: 'How internal auditory canal anatomy governs presentation and complication: where tumours arise and displace the facial nerve, why hearing drops, where Bell’s palsy chokes, and how CSF reaches the nose.',
    src: 'House Clinic Atlas Ch. 3, 5, 6 · Kirtane Ch. 30, 31 · Jackler Ch. 9 · Stanford Atlas · PubMed primary series',
    tldr: [
        'Most schwannomas start on the **inferior vestibular nerve**; one major atlas says the superior.',
        'The **facial nerve** usually lies **anterior** to the tumour.',
        'Bell’s palsy chokes at the **meatal foramen**: decompress there, within 2 weeks, if **ENoG** > 90% and **EMG** silent.',
        '**CSF** leaks follow air cells to the Eustachian tube.',
    ],
    sections: [
        {
            id: 'cc-vs-origin',
            ref: ['Otology/Vestibular schwannomas arise from the Schwann cell sheath of the inferior or superior vestibular nerve'],
            n: '6.1',
            title: 'Where the tumour starts',
            blocks: [
                {
                    t: 'p',
                    x: 'In 271 translabyrinthine cases, **84.8%** of vestibular schwannomas arose from the **inferior vestibular nerve** (**IVN**), **8.9%** from the **superior vestibular nerve** (**SVN**), **5.6%** were undetermined, **0.7%** arose from the facial nerve, and **none** arose from the cochlear nerve; Kirtane cites up to **91%** inferior origin. [[src|Komatsuzaki 2001]] [[src|K31]] About **95%** are sporadic and **5%** occur in **NF2**. [[src|K31]] Preoperative **vHIT** and **VEMP** scores predict inferior vestibular nerve origin with **73%** sensitivity and **80%** specificity. [[src|Rahne 2021]]',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'The House Clinic Atlas states that "Acoustic tumors usually arise from the superior vestibular nerve." [[src|HCA6 p81]] Most surgical series instead report the inferior vestibular nerve as the dominant origin. [[src|Komatsuzaki 2001]] [[src|K31]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which nerve is the commonest nerve of origin for a vestibular schwannoma in most surgical series?', a: 'The inferior vestibular nerve (in most series).' },
                { t: 'check', id: 'c2', q: 'Do vestibular schwannomas arise from the cochlear nerve?', a: 'Essentially never (0 of 271 translabyrinthine cases).' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q1'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-vs-origin'] }],
        },
        {
            id: 'cc-fn-displacement',
            ref: ['Otology/Intraoperative facial nerve and cochlear nerve monitoring minimize cranial nerve morbidity in skull base surgery'],
            n: '6.2',
            title: 'Where the facial nerve goes',
            blocks: [
                {
                    t: 'p',
                    x: 'The **facial nerve** most often lies **anterior** to a vestibular schwannoma. In retrosigmoid surgery it is found more anteriorly along the brainstem, with a variable course, [[src|HCA5 p65]] and along the canal it is **thinnest and most adherent** to the tumour at the **porus**. [[src|HCA6 p81]]',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/iac-anatomy/stanford-fig-6.jpg',
                    alt: 'Drawing of nerve positions around a superior and an inferior vestibular schwannoma, with the middle fossa (MF), translabyrinthine (TL) and posterior fossa (PF, retrosigmoid) views marked.',
                    cap: 'Surgeon’s views marked MF middle fossa, TL translabyrinthine, PF posterior fossa, i.e. retrosigmoid. As a general rule the facial nerve is displaced opposite to the vestibular nerve of origin. An inferior vestibular schwannoma puts the facial nerve between the tumour and the surgeon in a middle fossa approach. Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas’s educational permission.',
                },
                { t: 'check', id: 'c1', q: 'What is the most common facial nerve position relative to a vestibular schwannoma?', a: 'Anterior to the tumour.' },
                { t: 'check', id: 'c2', q: 'Where along the canal is the facial nerve thinnest and most adherent to the tumour?', a: 'At the porus.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q7'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-fn-displacement'] }],
        },
        {
            id: 'cc-audiometry',
            ref: [
                'Otology/Acoustic reflex thresholds and reflex decay testing identify retrocochlear lesions and facial nerve pathology',
                'Otology/Auditory brainstem response waves I through V identify retrocochlear and brainstem pathology',
            ],
            n: '6.3',
            title: 'Why speech falls more than tones',
            blocks: [
                {
                    t: 'p',
                    x: 'Progressive unilateral or asymmetric high-frequency **SNHL** is the presenting symptom in almost **90%** of vestibular schwannomas, whereas sudden hearing loss occurs in **10%**. [[src|K31]] Sudden and fluctuating hearing losses fit disrupted cochlear blood supply. [[src|K31]]',
                },
                {
                    t: 'p',
                    x: 'Hearing is described by pure tones (**PTA**) and speech discrimination using the **AAO-HNS** hearing classification: [[src|K31]]',
                },
                {
                    t: 'table',
                    head: ['AAO-HNS class [[src|K31]]', 'Pure-tone average', 'Speech discrimination'],
                    rows: [
                        ['**Class A**', '≤ 30 dB', '≥ 70%'],
                        ['**Class B**', '> 30–50 dB', '≥ 50%'],
                        ['**Class C**', '> 50 dB', '≥ 50%'],
                        ['**Class D**', 'Any level', '< 50%'],
                    ],
                },
                { t: 'check', id: 'c1', q: 'What thresholds define AAO-HNS hearing class B?', a: 'Pure-tone average > 30–50 dB with ≥ 50% speech discrimination.' },
                { t: 'check', id: 'c2', q: 'How often is hearing loss progressive versus sudden at presentation?', a: 'Progressive in almost 90% of patients; sudden in 10%.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-audiometry'] }],
        },
        {
            id: 'cc-grades',
            ref: [
                'Otology/Koos grading system classifies vestibular schwannomas from Stage I intracanalicular to Stage IV brainstem compression',
                'Otology/House-Brackmann grading system stratifies facial nerve function from Grade I normal to Grade VI total paralysis',
            ],
            n: '6.4',
            title: 'Grading by anatomy',
            blocks: [
                {
                    t: 'p',
                    x: 'The **Koos** classification stages tumour extent from the **IAC** to the brainstem: **I** intracanalicular; **II** in the **CPA** without brainstem contact; **III** touching the brainstem; **IV** compressing the brainstem.',
                },
                {
                    t: 'p',
                    x: 'Facial nerve function is graded on the **House–Brackmann** (**HB**) scale; over **90%** of patients are **HB** I at diagnosis. [[src|K31]]',
                },
                { t: 'check', id: 'c1', q: 'What defines a Koos III vestibular schwannoma?', a: 'A tumour extending into the CPA that touches the brainstem without compressing it.' },
                { t: 'check', id: 'c2', q: 'What is the facial nerve function at diagnosis in over 90% of vestibular schwannomas?', a: 'Normal (House–Brackmann Grade I).' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q23'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-grades'] }],
        },
        {
            id: 'cc-hearing-mech',
            ref: ['Otology/Intraoperative facial nerve and cochlear nerve monitoring minimize cranial nerve morbidity in skull base surgery'],
            n: '6.5',
            title: 'Why hearing is lost at surgery',
            blocks: [
                {
                    t: 'p',
                    x: 'The **internal auditory artery** must be preserved to keep hearing; it runs between **CN** VII and the cochlear nerve and is not visible. [[src|HCA3 p45]]',
                },
                {
                    t: 'p',
                    x: 'Dissecting from **lateral to medial** risks avulsing delicate cochlear fibres at the **habenula perforata** [[src|HCA3 p45]] and placing traction on the cochlear nerve. [[src|HCA5 p63]] Separating cochlear from inferior vestibular fibres mid-canal also risks the cochlear nerve. Once a tumour involves the **cochlea**, the chance of preserving hearing is lost. [[src|K31]]',
                },
                { t: 'check', id: 'c1', q: 'Why should tumour dissection off the cochlear nerve proceed medial to lateral rather than lateral to medial?', a: 'Lateral-to-medial dissection pulls on the cochlear nerve and risks avulsing cochlear fibres at the habenula perforata.' },
                { t: 'check', id: 'c2', q: 'Once tumour involves the cochlea, what happens to hearing preservation?', a: 'The chance is lost.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-hearing-mech'] }],
        },
        {
            id: 'cc-bell',
            ref: [
                'Otology/Acute Bell\'s palsy presents with unilateral lower motor neuron facial paralysis treated with early oral steroids',
                'Otology/Electroneuronography showing greater than ninety percent degeneration within fourteen days indicates severe facial nerve axonal injury',
                'Otology/Transmastoid and middle cranial fossa facial nerve decompression relieves canalicular compression',
            ],
            n: '6.6',
            title: 'The meatal foramen and Bell’s palsy',
            blocks: [
                {
                    t: 'p',
                    x: 'Bell’s palsy accounts for about **51%** of facial nerve disorders, and **85%** of patients recover spontaneously. [[src|K30]] The lesion is ischaemic necrosis of an edematous nerve, with the greatest entrapment at the **meatal foramen**; decompression that omits the meatal foramen misses the site of entrapment. [[src|K30]]',
                },
                {
                    t: 'p',
                    x: '**ENoG** requires at least **3 days** after onset (Wallerian degeneration). [[src|K30]] Under the **Gantz criteria**, middle fossa decompression is offered within **14 days** (2 weeks) of total paralysis when **ENoG** shows **> 90%** degeneration and **EMG** shows no voluntary motor units. [[src|Gantz 1999]] Decompression of the meatal foramen, labyrinthine segment, geniculate ganglion, and tympanic segment within 2 weeks yielded **91%** **HB** I–II versus **58%** poor outcomes (**HB** III–IV) in controls who declined. [[src|Gantz 1999]]',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'Gantz’s control group was self-selected (patients who declined surgery), not randomized.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What are the Gantz electrodiagnostic criteria and time window for decompression in Bell’s palsy?', a: '> 90% degeneration on ENoG and no voluntary EMG motor units within 14 days of total paralysis.' },
                { t: 'check', id: 'c2', q: 'Which segment must decompression include to relieve the bottleneck in Bell’s palsy?', a: 'The meatal foramen (medial to the geniculate ganglion).' },
                { t: 'check', id: 'c3', q: 'When is the earliest day after onset that ENoG is meaningful?', a: 'Day 3 (at least 3 days after onset, for Wallerian degeneration).' },
                { t: 'practice', title: 'Apply it', refs: ['facial-reanimation:q18'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-bell'] }],
        },
        {
            id: 'cc-trauma',
            ref: [
                'Trauma/Temporal bone fractures classified as otic capsule violating carry high risks of sensorineural hearing loss and facial nerve transection',
                'Otology/Temporal bone longitudinal and transverse fractures cause delayed or immediate facial paralysis',
            ],
            n: '6.7',
            title: 'Fractures through the canal',
            blocks: [
                {
                    t: 'p',
                    x: 'Otic-capsule-violating temporal bone fractures carry high rates of **SNHL** and facial paralysis. At exploration, traumatic injury is usually found at the **second genu** or the **meatal foramen**, [[src|K30]] and the **geniculate ganglion** is a frequent site of destructive lesions including fracture. [[src|J9 fig 9.25]] The same **> 90%** degeneration on **ENoG** within **2 weeks** criterion is extrapolated from Bell’s palsy to trauma. [[src|K30]]',
                },
                { t: 'check', id: 'c1', q: 'What are the two commonest sites of traumatic facial nerve injury at exploration?', a: 'The second genu and the meatal foramen (with the geniculate also a frequent fracture site).' },
                { t: 'check', id: 'c2', q: 'What electrodiagnostic criterion is extrapolated to traumatic facial nerve paralysis?', a: 'Greater than 90% degeneration on ENoG within 2 weeks.' },
                { t: 'practice', title: 'Apply it', refs: ['temporal-bone-trauma:q7'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-trauma'] }],
        },
        {
            id: 'cc-nvc',
            n: '6.8',
            title: 'Vessels against nerves',
            blocks: [
                {
                    t: 'p',
                    x: 'The **Obersteiner–Redlich transition zone** is vulnerable to vascular compression: compression of **CN** VII causes **hemifacial spasm**, whereas compression of **CN** VIII causes **vestibular paroxysmia**. Chavda II–III vascular loops were associated with unilateral hearing loss in one series, though not in another.',
                },
                { t: 'check', id: 'c1', q: 'Which syndrome does vascular compression of CN VIII’s transition zone cause?', a: 'Vestibular paroxysmia.' },
                { t: 'check', id: 'c2', q: 'Which syndrome does vascular compression of CN VII’s transition zone cause?', a: 'Hemifacial spasm.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-nvc'] }],
        },
        {
            id: 'cc-csf',
            ref: [
                'Otology/Cerebrospinal fluid CSF leak and pseudomeningocele require lumbar drainage, fat obliteration, and re-exploration',
                'Trauma/Traumatic cerebrospinal fluid otorrhea and rhinorrhea are managed conservatively before considering surgical skull base repair',
            ],
            n: '6.9',
            title: 'Leak tracts',
            blocks: [
                {
                    t: 'p',
                    x: '**CSF** leak is the commonest complication after vestibular schwannoma resection (**~10%**). [[src|K31]] Opened air cells at the **posterior lip** and **petrous apex** carry **CSF** into the middle ear and out the **Eustachian tube**; because watertight dural closure is generally impossible, opened cells are waxed and fat-packed. [[src|HCA5 p65–66]] [[src|HCA6 p77–78]] Translabyrinthine surgery adds **Eustachian tube plugging** and **middle ear obliteration**, and highly pneumatized temporal bones leak more often. [[src|HCA6 p77–78]] [[src|K31]]',
                },
                {
                    t: 'layers',
                    id: 'cc-csf-ly',
                    alt: 'Axial schematic of the right temporal bone showing the internal auditory canal, cochlea, vestibule, posterior semicircular canal, mastoid antrum, middle ear, and Eustachian tube leading to the nasopharynx, with three sequential steps tracing CSF from opened air cells to rhinorrhea.',
                    base: 'images/oksat/iac-anatomy/csf-base.svg',
                    mode: 'step',
                    cumulative: true,
                    layers: [
                        { id: 'cells', label: '1 · Air cells opened around the canal', src: 'images/oksat/iac-anatomy/csf-cells.svg' },
                        { id: 'route', label: '2 · Cell tracts carry CSF to the middle ear', src: 'images/oksat/iac-anatomy/csf-route.svg' },
                        { id: 'nose', label: '3 · Out through the Eustachian tube: rhinorrhea', src: 'images/oksat/iac-anatomy/csf-nose.svg' },
                    ],
                    cap: 'Schematic, right side. Wax the opened cells; in translabyrinthine surgery the tube is also plugged. Sources: House Clinic Atlas ch. 5 and 6; Kirtane ch. 31.',
                },
                { t: 'check', id: 'c1', q: 'Trace the route of CSF rhinorrhea after a closed retrosigmoid resection.', a: 'Opened petrous apex or posterior lip air cells → middle ear → Eustachian tube.' },
                { t: 'check', id: 'c2', q: 'What extra steps does translabyrinthine surgery add against CSF rhinorrhea?', a: 'Eustachian tube plugging and middle ear obliteration.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q35', 'vestibular-schwannoma:q46'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['cc-csf'] }],
        },
    ],
};
