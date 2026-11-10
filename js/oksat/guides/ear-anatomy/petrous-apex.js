/* =============================================================
   The petrous apex
   OKSAT · Interactive learning · ear-anatomy · chapter 10
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'petrous-apex',
    title: 'The petrous apex',
    kicker: '10 · Skull base',
    review: 'draft',
    lede: 'The medial tip of the temporal bone, a crowded corner: the inner ear lateral, the internal auditory canal behind, the carotid and trigeminal ganglion in front, the abducens at the tip. Learn it as a map of neighbours.',
    src: 'Glasscock Ch. 2 · Cummings Review Ch. 2 · apex surgery papers',
    tldr: [
        'The apex points **anteromedially**. **Cochlea** lateral, **internal auditory canal** posterior, horizontal petrous **carotid** anterior and below, **Meckel cave** (trigeminal ganglion) anterolateral on the middle fossa face, **Dorello canal** (abducens) at the tip, **petroclival fissure** medial.',
        'The apex region has two parts: the apical area and the peritubal area. The anterior apex is pneumatized in only about **10–15%** (Glasscock; Cummings Review gives 10%); most often it is diploic, rarely sclerotic.',
        'Cell tracts to the apex: subarcuate, sinodural, peritubal, retrofacial, infralabyrinthine, infracochlear and the glenoid fossa route (Cummings Review).',
        'Corridors by name: **infracochlear**, **infralabyrinthine**, **middle fossa**. A jugular bulb close to the cochlea closes the inferior corridors.',
        'Gradenigo: draining ear, retro-orbital pain, abducens palsy. Meckel cave explains the pain, Dorello canal the palsy.',
    ],
    sections: [
        {
            id: 'pa-bounds',
            n: '10.1',
            title: 'Boundaries and relations',
            blocks: [
                { t: 'p', x: 'The petrous apex is the **medial tip of the pyramid**. It points anteromedially and is marked by the transition of the intrapetrous to the intracranial internal carotid artery, the orifice of the bony Eustachian tube and, anterolaterally, the **trigeminal ganglion in Meckel cave**. [[src|Glasscock Ch. 2]] Meckel cave lies on the middle cranial fossa face, anterolateral to the apex; the **abducens** nerve runs in **Dorello canal** beneath the posterior petroclinoid (Gruber) ligament. [[src|Glasscock Ch. 2]]' },
                { t: 'p', x: 'After its knee the petrous carotid runs medial to the Eustachian tube and inferomedial to the tensor semicanal, so its horizontal segment lies in front of and below the apex. [[src|Glasscock Ch. 2]] Behind the apex is the **internal auditory canal**; lateral to it, the **cochlea**; medially, the **petroclival fissure** against the clivus.' },
                {
                    t: 'hotspot',
                    id: 'pa-bounds-hs',
                    alt: 'Right petrous apex in axial section with the cochlea, internal auditory canal, horizontal petrous carotid, Meckel cave, Dorello canal, abducens nerve and petroclival fissure, every one tappable.',
                    modes: ['explore'],
                    frames: [{ src: 'images/oksat/ear-anatomy/petrous-apex-axial.svg', cap: 'Right petrous apex, axial as on CT: anterior up, lateral to the left. Meckel cave sits above this level. Schematic.' }],
                },
                { t: 'neighbors', id: 'pa-bounds-nb', g: 'petapex', label: 'Neighbours of the petrous apex' },
                { t: 'check', id: 'c1', q: 'Predict: which structure lies immediately lateral to the apex and which immediately behind it?', a: 'The cochlea lateral; the internal auditory canal posterior.' },
                { t: 'check', id: 'c2', q: 'Which nerve runs in Dorello canal, and under which ligament?', a: 'The abducens nerve, under the posterior petroclinoid (Gruber) ligament.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q98', 'ear-anatomy:q100'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['pa-bounds'] }],
        },
        {
            id: 'pa-tracts',
            n: '10.2',
            title: 'Cell tracts to the apex',
            blocks: [
                { t: 'p', x: 'Glasscock recognises five regions of pneumatization; the **apical area** and the **peritubal area** make up the petrous apex region. Air-cell tracts lead to it. The **subarcuate** tract passes through the arch of the superior semicircular canal; the perilabyrinthine tracts run **above and below** the labyrinth; the **peritubal** tract surrounds the Eustachian tube. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Part of apex', 'Tracts (Cummings Review)'],
                    rows: [
                        ['Posterior', 'Subarcuate; sinodural'],
                        ['Anterior', 'Peritubal; retrofacial; infralabyrinthine; infracochlear; glenoid fossa'],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Glasscock: the **anterior apex is pneumatized in only 10–15%** of specimens, most often diploic, rarely sclerotic. Cummings Review lists the **anterior** apex at **10%** and the **posterior** apex at **30%**. Either way a minority of apices hold air cells, so most apical disease sits in marrow-containing or sclerotic bone, not in air. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'Peritubal cells that open into the tube in front of its tympanic orifice have been linked to CSF leaks that persist after translabyrinthine tumour resection. Check them when the leak will not stop. [[src|Glasscock Ch. 2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the tract that runs through the arch of the superior canal and the tract that surrounds the Eustachian tube.', a: 'Subarcuate; peritubal.' },
                { t: 'check', id: 'c2', q: 'How often is the anterior apex pneumatized, and what is it most often instead?', a: 'About 10–15% (Cummings Review: 10%); most often diploic, rarely sclerotic.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q101'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['pa-tracts'] }],
        },
        {
            id: 'pa-corridors',
            n: '10.3',
            title: 'Corridors (names and boundaries)',
            blocks: [
                { t: 'p', x: 'Three corridors reach the apex from the ear. This section names them and their limits; it does not describe technique.' },
                {
                    t: 'table',
                    head: ['Corridor', 'Reaches the apex from', 'What bounds or blocks it'],
                    rows: [
                        ['Infracochlear', 'Below the cochlea, through the tympanic cavity', 'Cochlea above, jugular bulb below; a bulb under 3 mm from the cochlea in the cavity restricts it [[src|Eur Arch Otorhinolaryngol 2021]]'],
                        ['Infralabyrinthine', 'Below the labyrinth, through the cell tract beneath it', 'Labyrinth above, jugular bulb below'],
                        ['Middle fossa', 'Above, through the floor of the middle cranial fossa', 'Meckel cave lies on this surface, anterolateral to the apex; the greater petrosal nerve leaves the geniculate ganglion onto it'],
                    ],
                },
                { t: 'p', x: 'Infracochlear: a high jugular bulb within 3 mm of the cochlea in the tympanic cavity was the only instance that restricted a cadaver series; a high-riding jugular bulb has also been cited as the reason to rule out both inferior corridors in a patient with an apical granuloma. [[src|Eur Arch Otorhinolaryngol 2021]] [[src|World Neurosurg 2022]]' },
                { t: 'check', id: 'c1', q: 'Which structure, when close to the cochlea in the tympanic cavity, restricts the infracochlear corridor?', a: 'The jugular bulb (under 3 mm from the cochlea).' },
                { t: 'check', id: 'c2', q: 'Which corridor reaches the apex from above?', a: 'The middle fossa corridor, through the floor of the middle cranial fossa.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q103'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['pa-corridors'] }],
        },
        {
            id: 'pa-clinical',
            n: '10.4',
            title: 'Why the relations matter',
            blocks: [
                { t: 'p', x: 'Petrous apicitis, with its dural and venous inflammation, can present with **purulent otorrhoea, retro-orbital pain and abducens palsy**: the **Gradenigo triad**. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**The pain is the trigeminal ganglion in Meckel cave; the palsy is the abducens in Dorello canal.** Both sit on the apex, and an apical lesion presses on both before it reaches the ear.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'A mass without an infection',
                    blocks: [
                        { t: 'p', x: 'An expanding cystic apical lesion produces the same nerve signs. A 3.5 cm cholesterol granuloma compressed the abducens nerve where it enters the cavernous sinus and presented as acute diplopia. [[src|ORL J Otorhinolaryngol Relat Spec 2023]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the triad of petrous apicitis and the structure behind each element.', a: 'Draining ear (middle ear and tract disease), retro-orbital pain (trigeminal ganglion in Meckel cave), abducens palsy (Dorello canal).' },
                { t: 'check', id: 'c2', q: 'Why can a large cystic apical lesion present with diplopia alone?', a: 'It compresses the abducens at the apex tip or at its entry to the cavernous sinus.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q105'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['pa-clinical'] }],
        },
    ],
};
