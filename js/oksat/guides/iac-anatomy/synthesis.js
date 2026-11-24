/* =============================================================
   Cases
   OKSAT · Interactive learning · iac-anatomy · chapter 7
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'synthesis',
    title: 'Cases',
    kicker: '7 · Synthesis',
    review: 'draft',
    lede: 'Six clinical cases that pull together the canal\'s walls, fundal quadrants, imaging cutoffs, surgical corridors and disease mechanisms. Work each vignette through its three prompts before drilling the module.',
    src: 'House Clinic Atlas Ch. 3, 5, 6 · Kirtane Ch. 2, 30, 31 · Primary series (Gantz 1999, McClay 2008, Stjernholm 2002, Parlak 2022, Xu 2024)',
    tldr: [
        'Serviceable hearing with a tumour filling the **fundus** calls for the **middle fossa** corridor, where CN VII sits on top.',
        'A normal-calibre **IAC** on CT never rules out cochlear nerve deficiency: measure the **BCNC** and read the oblique-sagittal MRI.',
        'Severe acute **Bell\'s palsy** (> 90% **ENoG** degeneration and silent **EMG** within 14 days) requires middle fossa decompression including the **meatal foramen**.',
        'Clear rhinorrhea with an intact drum after IAC surgery traces through opened perilabyrinthine or apical cells to the middle ear and Eustachian tube.',
    ],
    sections: [
        {
            id: 'case-mcf',
            n: '7.1',
            title: 'The small tumour at the fundus',
            blocks: [
                {
                    t: 'p',
                    x: 'A patient has a right **1.1 cm** intracanalicular vestibular schwannoma filling the **fundus** (no **CSF** cap), with a **PTA** of **15 dB** and speech discrimination of **96%**. [[src|Constructed case]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'What is the AAO-HNS hearing class?',
                    a: 'AAO-HNS Class A (PTA ≤ 30 dB and speech discrimination ≥ 70%; cc-audiometry).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Why is the retrosigmoid corridor poorly suited to clearing this tumour?',
                    a: 'The lateral third of the canal lies behind the posterior semicircular canal and common crus, which limit retrosigmoid drilling; retrosigmoid leaves residual tumour at the fundus in about 7% of cases (ap-retrosig).',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'Opening the dura from above in a middle fossa approach, where does CN VII lie?',
                    a: 'Anterior and on top, superficial to the tumour in the anterosuperior canal (ap-mcf, fu-views).',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Fundal extension lowers hearing odds',
                    blocks: [
                        {
                            t: 'p',
                            x: 'Extension into the lateral **fundus** (without a CSF cap) also lowers the odds of serviceable hearing preservation whatever the surgical approach. [[src|K31]]',
                        },
                    ],
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['case-mcf'] }],
        },
        {
            id: 'case-cnd',
            n: '7.2',
            title: 'The child with a normal canal',
            blocks: [
                {
                    t: 'p',
                    x: 'A 2-year-old child with bilateral profound **SNHL** has a normal-calibre **IAC** on CT, but the **BCNC** measures **0.9 mm**. [[src|Constructed case]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Is the normal IAC calibre on CT reassuring?',
                    a: 'No: about a third of deficient cochlear nerves sit in a normal-calibre canal, and a BCNC < 1.4 mm signals a cochlear nerve abnormality (im-cnd, fu-cnc).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'What will an oblique-sagittal heavily T2-weighted MRI show?',
                    a: 'An absent or small anteroinferior (lower-front) dot (im-4dot, im-cnd).',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'How should the family be counselled regarding implantation?',
                    a: 'Children with hypoplastic or deficient cochlear nerves do poorly with a cochlear implant; an auditory brainstem implant (ABI) bypasses the cochlea and cochlear nerve (im-cnd, ap-extend).',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['case-cnd'] }],
        },
        {
            id: 'case-tl-bulb',
            n: '7.3',
            title: 'The large tumour and the high bulb',
            blocks: [
                {
                    t: 'p',
                    x: 'A patient has a right **2.8 cm** **CPA** schwannoma, non-serviceable hearing, and a **high jugular bulb** on CT. [[src|Constructed case]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Which surgical corridor fits this tumour and hearing status?',
                    a: 'Translabyrinthine, which is suited to any tumour size when hearing is poor (and > 2 cm where hearing preservation is very unlikely; ap-translab, ap-choose).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'How does the high jugular bulb affect bone removal?',
                    a: 'It limits the inferior trough and can reach nearly to the canal; drill around and in front of it (os-walls, ap-translab).',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'What is the lower limit of translabyrinthine drilling, and what lies below it?',
                    a: 'The cochlear aqueduct sets the inferior and anterior limit of drilling, with cranial nerves IX–XI just below it (ap-translab, os-walls).',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['case-tl-bulb'] }],
        },
        {
            id: 'case-bell',
            n: '7.4',
            title: 'Day 9 of a Bell\'s palsy',
            blocks: [
                {
                    t: 'p',
                    x: 'A patient with complete **Bell\'s palsy** on day 9 has **93%** degeneration on **ENoG** and no voluntary motor units on **EMG**. [[src|Constructed case]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Are surgical decompression criteria met?',
                    a: 'Yes: > 90% ENoG degeneration and silent voluntary EMG within 14 days of total paralysis meet the Gantz criteria (cc-bell).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Which segments must be decompressed?',
                    a: 'The meatal foramen, labyrinthine segment, geniculate ganglion and tympanic segment (cc-bell).',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'Why must decompression proceed through the middle fossa rather than a transmastoid route?',
                    a: 'The meatal foramen (0.68 mm, the narrowest point and main site of entrapment) lies medial to the geniculate ganglion, so a transmastoid approach cannot reach it (cc-bell, fu-meatal).',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['case-bell'] }],
        },
        {
            id: 'case-ip3',
            n: '7.5',
            title: 'The X-linked boy before stapes surgery',
            blocks: [
                {
                    t: 'p',
                    x: 'A boy with an X-linked family history and progressive mixed hearing loss has a CT showing a **bulbous IAC fundus**. [[src|Constructed case]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'What is the diagnosis and its causal gene?',
                    a: 'Incomplete partition type III (IP-III), caused by POU3F4 mutations with X-linked recessive inheritance (im-ip3).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'What is the major intraoperative risk of stapes surgery here, and why?',
                    a: 'A CSF gusher, because the bony modiolus is absent and the fundus opens directly to the cochlea (im-ip3).',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'If cochlear implantation is performed, what surgical and postoperative caveat applies?',
                    a: 'Implantation is more complex because of the absent modiolus, and electrode position must be confirmed after surgery (im-ip3).',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['case-ip3'] }],
        },
        {
            id: 'case-leak',
            n: '7.6',
            title: 'Rhinorrhea after a retrosigmoid',
            blocks: [
                {
                    t: 'p',
                    x: 'On day 5 after **retrosigmoid** resection with a closed dura, a patient develops clear **rhinorrhea** with an intact tympanic membrane. [[src|Constructed case]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Trace the route of the CSF leak.',
                    a: 'Opened apical or posterior-lip air cells → middle ear → Eustachian tube (cc-csf).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Why is there no otorrhea?',
                    a: 'The tympanic membrane (drum) is intact (cc-csf).',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'Which temporal bones are at higher risk for this complication?',
                    a: 'Highly pneumatized temporal bones (os-cells).',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['case-leak', 'im-fundal-cap', 'cc-audiometry', 'ap-retrosig', 'ap-mcf', 'fu-views', 'im-cnd', 'fu-cnc', 'im-4dot', 'ap-extend', 'ap-translab', 'ap-choose', 'os-walls', 'cc-bell', 'fu-meatal', 'im-ip3', 'cc-csf', 'os-cells'] }],
        },
    ],
};
