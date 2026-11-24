/* =============================================================
   Reading the tube
   OKSAT · Interactive learning · iac-anatomy · chapter 4
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'imaging',
    title: 'Reading the tube',
    kicker: '4 · Imaging',
    review: 'draft',
    lede: 'High-resolution CT maps the bone and air around the internal auditory canal; heavily T2-weighted 3D MRI resolves the four nerves inside it and separates canal and CPA lesions.',
    src: 'Kirtane Ch. 9, 30, 31 · House Clinic Atlas Ch. 3, 6 · UW CT Temporal Bone Module · Stanford Skull Base Surgery Atlas · PubMed primary series',
    tldr: [
        '**CT** for bone, heavily T2-weighted **3D MRI** for nerves. [[src|K9]]',
        'Measure: 4–8 mm normal, < 2 mm stenosis, > 2 mm asymmetry. [[src|Owner]]',
        'A normal canal can hold a deficient cochlear nerve: measure the bony cochlear nerve canal and look for the fourth dot. [[src|Owner]] [[src|McClay 2008]] [[src|Stjernholm 2002]]',
        '**IP-III**: bulbous fundus, no modiolus, X-linked. [[src|Xu 2024]] [[src|Parlak 2022]]',
        'Schwannoma centres on the porus; meningioma sits on a broad dural base. [[src|K9]]',
    ],
    sections: [
        {
            id: 'im-ct-read',
            n: '4.1',
            title: 'A CT read order',
            blocks: [
                {
                    t: 'p',
                    x: 'CT gives bone and air; 0.5–0.625 mm slices with 0.3 mm reconstruction allow multiplanar reformats. [[src|K9]] Walk every temporal bone scan in the same order:',
                },
                {
                    t: 'ol',
                    items: [
                        'Canal calibre, symmetry, and flaring (4–8 mm normal, < 2 mm stenosis, > 2 mm side-to-side asymmetry). [[src|Owner]]',
                        'Transverse crest and Bill\'s bar. [[src|K2]]',
                        'Labyrinthine segment of the facial nerve and the geniculate ganglion. [[src|K2]] [[src|K30]]',
                        'Basal turn of the cochlea. [[src|HCA3]]',
                        'Jugular bulb height under the canal. [[src|K2]]',
                        'Vestibular aqueduct: no wider than the posterior semicircular canal, < 1.5 mm. [[src|K9]]',
                        'Petrous apex pneumatization. [[src|K31]]',
                        'Bony cochlear nerve canal (**BCNC**): < 1.4 mm suggests a cochlear nerve abnormality. [[src|Stjernholm 2002]]',
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-ct-read-hs',
                    alt: 'Five UW temporal bone CT slices (three axial and two coronal) through the internal auditory canal with tappable anatomical landmarks.',
                    label: 'Find it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/iac-anatomy/ct/ax-29.jpg',
                            cap: 'Right ear, axial CT through the IAC, geniculate ganglion, and vestibule (slice 29 of 61). Lateral is left, anterior is up. UW CT temporal bone module, University of Washington Department of Radiology.',
                            regions: [
                                {
                                    g: 'geniculate',
                                    poly: [50.6, 38.3, 49.8, 39.1, 48.6, 39.1, 47.7, 38.3, 47.7, 37.2, 48.6, 36.4, 49.8, 36.4, 50.6, 37.2],
                                },
                                {
                                    g: 'malleus',
                                    poly: [37.3, 39.0, 36.4, 39.8, 35.2, 39.8, 34.4, 39.0, 34.4, 38.0, 35.2, 37.2, 36.4, 37.2, 37.3, 38.0],
                                },
                                {
                                    g: 'fn-lab',
                                    poly: [53.1, 40.3, 52.3, 41.1, 51.1, 41.1, 50.2, 40.3, 50.2, 39.2, 51.1, 38.4, 52.3, 38.4, 53.1, 39.2],
                                },
                                {
                                    g: 'incus',
                                    poly: [34.0, 42.3, 33.1, 43.1, 31.9, 43.1, 31.0, 42.3, 31.0, 41.2, 31.9, 40.4, 33.1, 40.4, 34.0, 41.2],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [47.6, 47.8, 46.7, 48.6, 45.5, 48.6, 44.7, 47.8, 44.7, 46.7, 45.5, 45.9, 46.7, 45.9, 47.6, 46.7],
                                },
                                {
                                    g: 'iac',
                                    poly: [63.1, 48.5, 62.3, 49.3, 61.1, 49.3, 60.2, 48.5, 60.2, 47.5, 61.1, 46.7, 62.3, 46.7, 63.1, 47.5],
                                },
                                {
                                    g: 'aditus',
                                    poly: [30.3, 48.8, 29.5, 49.6, 28.3, 49.6, 27.4, 48.8, 27.4, 47.7, 28.3, 46.9, 29.5, 46.9, 30.3, 47.7],
                                },
                                {
                                    g: 'lscc',
                                    poly: [37.3, 51.5, 36.4, 52.3, 35.2, 52.3, 34.4, 51.5, 34.4, 50.5, 35.2, 49.7, 36.4, 49.7, 37.3, 50.5],
                                },
                                {
                                    g: 'antrum',
                                    poly: [27.6, 56.8, 26.7, 57.6, 25.5, 57.6, 24.7, 56.8, 24.7, 55.7, 25.5, 54.9, 26.7, 54.9, 27.6, 55.7],
                                },
                                {
                                    g: 'pscc',
                                    poly: [42.3, 58.3, 41.4, 59.1, 40.2, 59.1, 39.4, 58.3, 39.4, 57.2, 40.2, 56.4, 41.4, 56.4, 42.3, 57.2],
                                },
                                {
                                    g: 'sigmoid',
                                    poly: [24.0, 75.8, 23.1, 76.6, 21.9, 76.6, 21.0, 75.8, 21.0, 74.7, 21.9, 73.9, 23.1, 73.9, 24.0, 74.7],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/iac-anatomy/ct/ax-32.jpg',
                            cap: 'Right ear, axial CT through the IAC and labyrinthine facial nerve (slice 32 of 61). Lateral is left, anterior is up. UW CT temporal bone module, University of Washington Department of Radiology.',
                            regions: [
                                {
                                    g: 'geniculate',
                                    poly: [51.7, 36.3, 50.9, 37.1, 49.7, 37.1, 48.8, 36.3, 48.8, 35.2, 49.7, 34.4, 50.9, 34.4, 51.7, 35.2],
                                },
                                {
                                    g: 'malleus',
                                    poly: [39.5, 39.3, 38.7, 40.1, 37.5, 40.1, 36.6, 39.3, 36.6, 38.2, 37.5, 37.4, 38.7, 37.4, 39.5, 38.2],
                                },
                                {
                                    g: 'fn-lab',
                                    poly: [50.6, 41.5, 49.8, 42.3, 48.6, 42.3, 47.7, 41.5, 47.7, 40.5, 48.6, 39.7, 49.8, 39.7, 50.6, 40.5],
                                },
                                {
                                    g: 'incus',
                                    poly: [35.6, 42.3, 34.8, 43.1, 33.6, 43.1, 32.7, 42.3, 32.7, 41.2, 33.6, 40.4, 34.8, 40.4, 35.6, 41.2],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [49.0, 47.5, 48.1, 48.3, 46.9, 48.3, 46.0, 47.5, 46.0, 46.5, 46.9, 45.7, 48.1, 45.7, 49.0, 46.5],
                                },
                                {
                                    g: 'iac',
                                    poly: [65.1, 50.3, 64.2, 51.1, 63.0, 51.1, 62.2, 50.3, 62.2, 49.2, 63.0, 48.4, 64.2, 48.4, 65.1, 49.2],
                                },
                                {
                                    g: 'koerner',
                                    poly: [24.0, 53.5, 23.1, 54.3, 21.9, 54.3, 21.0, 53.5, 21.0, 52.5, 21.9, 51.7, 23.1, 51.7, 24.0, 52.5],
                                },
                                {
                                    g: 'lscc',
                                    poly: [39.2, 53.8, 38.4, 54.6, 37.2, 54.6, 36.3, 53.8, 36.3, 52.7, 37.2, 51.9, 38.4, 51.9, 39.2, 52.7],
                                },
                                {
                                    g: 'pscc',
                                    poly: [40.6, 59.0, 39.8, 59.8, 38.6, 59.8, 37.7, 59.0, 37.7, 58.0, 38.6, 57.2, 39.8, 57.2, 40.6, 58.0],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/iac-anatomy/ct/ax-36.jpg',
                            cap: 'Right ear, axial CT through the IAC, tympanic facial nerve, and vestibule (slice 36 of 61). Lateral is left, anterior is up. UW CT temporal bone module, University of Washington Department of Radiology.',
                            regions: [
                                {
                                    g: 'malleus',
                                    poly: [39.5, 39.3, 38.7, 40.1, 37.5, 40.1, 36.6, 39.3, 36.6, 38.2, 37.5, 37.4, 38.7, 37.4, 39.5, 38.2],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [45.3, 41.0, 44.5, 41.8, 43.3, 41.8, 42.4, 41.0, 42.4, 40.0, 43.3, 39.2, 44.5, 39.2, 45.3, 40.0],
                                },
                                {
                                    g: 'incus',
                                    poly: [37.0, 42.3, 36.2, 43.1, 35.0, 43.1, 34.1, 42.3, 34.1, 41.2, 35.0, 40.4, 36.2, 40.4, 37.0, 41.2],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [48.7, 49.3, 47.8, 50.1, 46.6, 50.1, 45.8, 49.3, 45.8, 48.2, 46.6, 47.4, 47.8, 47.4, 48.7, 48.2],
                                },
                                {
                                    g: 'iac',
                                    poly: [65.1, 50.3, 64.2, 51.1, 63.0, 51.1, 62.2, 50.3, 62.2, 49.2, 63.0, 48.4, 64.2, 48.4, 65.1, 49.2],
                                },
                                {
                                    g: 'koerner',
                                    poly: [24.0, 53.5, 23.1, 54.3, 21.9, 54.3, 21.0, 53.5, 21.0, 52.5, 21.9, 51.7, 23.1, 51.7, 24.0, 52.5],
                                },
                                {
                                    g: 'pscc',
                                    poly: [42.6, 58.0, 41.7, 58.8, 40.5, 58.8, 39.7, 58.0, 39.7, 57.0, 40.5, 56.2, 41.7, 56.2, 42.6, 57.0],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/iac-anatomy/ct/co-14.jpg',
                            cap: 'Right ear, coronal CT through the IAC, vestibule, and semicircular canals (slice 14 of 21). Lateral is left, superior is up. UW CT temporal bone module, University of Washington Department of Radiology.',
                            regions: [
                                {
                                    g: 'ssc',
                                    poly: [60.1, 27.6, 59.3, 28.6, 58.1, 28.6, 57.3, 27.6, 57.3, 26.2, 58.1, 25.2, 59.3, 25.2, 60.1, 26.2],
                                },
                                {
                                    g: 'lscc',
                                    poly: [48.5, 37.7, 47.7, 38.7, 46.5, 38.7, 45.7, 37.7, 45.7, 36.3, 46.5, 35.4, 47.7, 35.4, 48.5, 36.3],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [60.3, 40.2, 59.5, 41.2, 58.4, 41.2, 57.6, 40.2, 57.6, 38.9, 58.4, 37.9, 59.5, 37.9, 60.3, 38.9],
                                },
                                {
                                    g: 'iac',
                                    poly: [74.5, 42.1, 73.7, 43.1, 72.6, 43.1, 71.8, 42.1, 71.8, 40.8, 72.6, 39.8, 73.7, 39.8, 74.5, 40.8],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [48.5, 45.9, 47.7, 46.9, 46.5, 46.9, 45.7, 45.9, 45.7, 44.6, 46.5, 43.6, 47.7, 43.6, 48.5, 44.6],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/iac-anatomy/ct/co-16.jpg',
                            cap: 'Right ear, coronal CT through the IAC, oval window, and stapes (slice 16 of 21). Lateral is left, superior is up. UW CT temporal bone module, University of Washington Department of Radiology.',
                            regions: [
                                {
                                    g: 'ssc',
                                    poly: [57.2, 28.9, 56.4, 29.8, 55.2, 29.8, 54.4, 28.9, 54.4, 27.5, 55.2, 26.5, 56.4, 26.5, 57.2, 27.5],
                                },
                                {
                                    g: 'lscc',
                                    poly: [49.3, 37.1, 48.5, 38.1, 47.3, 38.1, 46.5, 37.1, 46.5, 35.7, 47.3, 34.7, 48.5, 34.7, 49.3, 35.7],
                                },
                                {
                                    g: 'iac',
                                    poly: [79.3, 39.0, 78.5, 40.0, 77.3, 40.0, 76.5, 39.0, 76.5, 37.6, 77.3, 36.6, 78.5, 36.6, 79.3, 37.6],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [54.5, 42.5, 53.7, 43.4, 52.6, 43.4, 51.8, 42.5, 51.8, 41.1, 52.6, 40.1, 53.7, 40.1, 54.5, 41.1],
                                },
                                {
                                    g: 'ow',
                                    poly: [56.9, 48.2, 56.1, 49.1, 55.0, 49.1, 54.1, 48.2, 54.1, 46.8, 55.0, 45.8, 56.1, 45.8, 56.9, 46.8],
                                },
                                {
                                    g: 'stapes',
                                    poly: [50.6, 50.1, 49.8, 51.0, 48.6, 51.0, 47.8, 50.1, 47.8, 48.7, 48.6, 47.7, 49.8, 47.7, 50.6, 48.7],
                                },
                                {
                                    g: 'promontory',
                                    poly: [53.5, 53.5, 52.7, 54.5, 51.5, 54.5, 50.7, 53.5, 50.7, 52.2, 51.5, 51.2, 52.7, 51.2, 53.5, 52.2],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/iac-anatomy/stanford-fig-8.jpg',
                    alt: 'Coronal illustration of the right ear and temporal bone showing the eighth cranial nerve inside the internal auditory canal divided by the transverse crest (TC), with the cochlea, semicircular canals, jugular bulb, carotid artery, petrous apex, and brainstem labelled.',
                    cap: 'Coronal view of the temporal bone showing CN VIII and the transverse crest in the internal auditory canal. Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas\'s educational permission.',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Upper limit of a normal vestibular aqueduct on axial CT?',
                    a: 'No wider than the posterior semicircular canal, < 1.5 mm.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Two CT measurements to make before implanting a deaf child?',
                    a: 'Internal auditory canal calibre and the bony cochlear nerve canal.',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-ct-read'] }],
        },
        {
            id: 'im-mri',
            ref: ['Otology/Internal auditory canal lipomas demonstrate T1 hyperintensity with fat saturation signal loss and mandate conservative observation'],
            n: '4.2',
            title: 'Which sequence answers what',
            blocks: [
                {
                    t: 'p',
                    x: 'MRI is the first choice for imaging the **IAC** and **CPA**. Sub-millimetre heavily T2-weighted 3D sequences (**CISS**, **DRIVE**, **FIESTA**) show the cranial nerves inside bright **CSF** without intravenous contrast. [[src|K9]]',
                },
                {
                    t: 'table',
                    head: ['Sequence / feature', 'What it answers'],
                    rows: [
                        ['Heavily T2-weighted 3D (**CISS**, **DRIVE**, **FIESTA**)', 'Resolves the four nerves in CSF without contrast; sub-millimetre slices [[src|K9]]'],
                        ['Contrast', 'Contrast helps for tumours in the fundus, cochlea and vestibule. [[src|K9]]'],
                        ['**DWI**', 'Shows diffusion restriction in an epidermoid cyst [[src|K9]]'],
                        ['Fat suppression', 'Fat suppression matters after fat grafting (for example after translabyrinthine surgery) so the graft does not mask enhancement [[src|K9]]'],
                    ],
                },
                { t: 'p', x: 'A standard brain MRI without thin sections through the IAC cannot exclude a small schwannoma. [[src|K9]]' },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Which sequence shows the four nerves without contrast?',
                    a: 'A heavily T2-weighted 3D sequence (CISS, FIESTA, or DRIVE).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Why is fat suppression needed after a translabyrinthine approach?',
                    a: 'The fat graft would mask enhancement.',
                },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['pediatrics:q35'],
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-mri'] }],
        },
        {
            id: 'im-4dot',
            n: '4.3',
            title: 'The four dots',
            blocks: [
                {
                    t: 'p',
                    x: 'An oblique-sagittal reconstruction perpendicular to the long axis of the canal shows the four nerves (facial, cochlear, superior vestibular, and inferior vestibular) as four dots surrounded by CSF. [[src|K9]] Displayed with anterior on the image left, the facial nerve sits upper-front, the cochlear nerve lower-front, the superior vestibular nerve upper-back, and the inferior vestibular nerve lower-back. Medially, the two vestibular nerves fuse. [[src|Owner]]',
                },
                {
                    t: 'hotspot',
                    id: 'im-4dot-hs',
                    alt: 'Two oblique-sagittal MRI schematics (right and left ears) displayed with anterior on the left and superior up, showing the four nerves as tappable dots in CSF.',
                    label: 'Find it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/iac-anatomy/fundus-mri-right.svg',
                            cap: 'Right IAC, oblique-sagittal radiological display (schematic). Anterior is left, superior is up.',
                        },
                        {
                            src: 'images/oksat/iac-anatomy/fundus-mri-left.svg',
                            cap: 'Left IAC, oblique-sagittal radiological display (schematic). Anterior is left, superior is up.',
                        },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'On oblique-sagittal MRI, which dot is the cochlear nerve?',
                    a: 'Lower front (anteroinferior).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'What happens to the two vestibular dots as you trace the canal medially?',
                    a: 'They fuse.',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-4dot'] }],
        },
        {
            id: 'im-fundal-cap',
            ref: ['Otology/The middle cranial fossa approach provides hearing preservation for intracanalicular schwannomas with lateral fundus extension'],
            n: '4.4',
            title: 'CSF at the fundus',
            blocks: [
                {
                    t: 'p',
                    x: 'Seeing CSF in the fundus on T2-weighted MRI means the tumour stops short of the fundus; this fundal cap is one of the House Clinic factors favouring hearing preservation. [[src|HCA3 table 3.2]]',
                },
                {
                    t: 'p',
                    x: 'Conversely, lateral extension into the fundus usually precludes serviceable hearing even when a hearing-preservation technique is attempted. [[src|K31]] Residual tumour is left at the fundus in ~7% of retrosigmoid cases versus 0% with the translabyrinthine approach. [[src|K31]]',
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'What does CSF at the fundus on T2 MRI tell you?',
                    a: 'The tumour stops short of the fundus; better odds of preserving hearing.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'What does tumour extending into the lateral fundus imply for hearing preservation?',
                    a: 'It usually precludes serviceable hearing even with a hearing-preservation approach (and retrosigmoid leaves residual tumour at the fundus in ~7% vs 0% for translabyrinthine).',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-fundal-cap'] }],
        },
        {
            id: 'im-cnd',
            ref: [
                'Otology/Cochlear implant candidacy criteria include severe to profound bilateral sensorineural hearing loss',
                'Otology/Auditory Brainstem Implantation ABI bypasses the cochlea and cochlear nerve to stimulate the cochlear nucleus in NF2',
                'Otology/Otoacoustic emissions evaluate outer hair cell integrity and differentiate cochlear from auditory neuropathy spectrum disorder',
            ],
            n: '4.5',
            title: 'Cochlear nerve deficiency',
            blocks: [
                {
                    t: 'p',
                    x: 'IAC stenosis (< 2 mm) is linked to CN VIII aplasia or severe hypoplasia. [[src|Owner]] However, about a third of deficient cochlear nerves sit inside a normal-calibre canal, [[src|McClay 2008]] [[src|Owner]] so measure the **BCNC** (< 1.4 mm abnormal) [[src|Stjernholm 2002]] and check the anteroinferior dot on oblique-sagittal heavily T2-weighted MRI.',
                },
                {
                    t: 'p',
                    x: 'Canal width and nerve size predict cochlear implant (**CI**) outcomes in **ANSD**; [[src|Jeong 2013]] children with auditory nerve hypoplasia (2.5% of one CI programme) do poorly with a cochlear implant. [[src|Valero 2012]]',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'CT alone is a trap',
                    blocks: [
                        { t: 'p', x: 'A normal IAC on CT does not exclude cochlear nerve deficiency (**CND**): measure the BCNC and confirm the cochlear nerve on oblique-sagittal MRI. [[src|McClay 2008]] [[src|Stjernholm 2002]]' },
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-cnd-hs',
                    alt: 'Oblique-sagittal schematic of cochlear nerve aplasia showing an empty anteroinferior quadrant in the IAC and an inset of a narrow bony cochlear nerve canal (< 1.4 mm on CT).',
                    modes: ['explore'],
                    frames: [
                        {
                            src: 'images/oksat/iac-anatomy/mri-cnd-aplasia.svg',
                            cap: 'Cochlear nerve aplasia on oblique-sagittal MRI with narrow BCNC inset (schematic).',
                        },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Normal IAC on CT, profound SNHL: what next?',
                    a: 'Measure the bony cochlear nerve canal and obtain oblique-sagittal heavily T2-weighted MRI for the cochlear nerve.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'What is the BCNC cutoff suggesting a cochlear nerve abnormality?',
                    a: '< 1.4 mm.',
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-cnd'] }],
        },
        {
            id: 'im-ip3',
            ref: [
                'Otology/Gushing footplate indicates a congenital perilymph fistula from an abnormally patent cochlear aqueduct',
                'Otology/Inner ear malformations are classified by Jackler and Sennaroglu based on embryonic arrest timing and cochleovestibular architecture',
            ],
            n: '4.6',
            title: 'Incomplete partition type III',
            blocks: [
                {
                    t: 'p',
                    x: '**Incomplete partition type III** (**IP-III**) is X-linked recessive and caused by **POU3F4** mutations. [[src|Xu 2024]] Imaging shows bilateral bulbous IACs, an absent bony modiolus with preserved interscalar septa, a thin otic capsule, and intact cochleovestibular and facial nerves; hypothalamic anomalies are also common. [[src|Parlak 2022]]',
                },
                {
                    t: 'p',
                    x: 'With no bony modiolus, the fundus opens directly into the cochlea: stapes surgery risks a CSF gusher, and cochlear implantation is surgically more complex, so check electrode position after surgery. [[src|Xu 2024]]',
                },
                {
                    t: 'hotspot',
                    id: 'im-ip3-hs',
                    alt: 'Axial schematic of incomplete partition type III showing a bulbous lateral IAC fundus opening directly into a cochlea lacking a modiolus, with preserved interscalar septa.',
                    modes: ['explore'],
                    frames: [
                        {
                            src: 'images/oksat/iac-anatomy/mri-ip3.svg',
                            cap: 'Incomplete partition type III: bulbous IAC and absent modiolus (axial schematic).',
                        },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Gene and inheritance of IP-III?',
                    a: 'POU3F4, X-linked recessive.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Two CT signs of IP-III?',
                    a: 'Bulbous IAC and absent bony modiolus.',
                },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['pediatrics:q22'],
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-ip3'] }],
        },
        {
            id: 'im-lesions',
            ref: [
                'Otology/Facial nerve schwannomas present with slow progressive paralysis or facial twitching along the Fallopian canal',
                'Otology/Internal auditory canal lipomas demonstrate T1 hyperintensity with fat saturation signal loss and mandate conservative observation',
            ],
            n: '4.7',
            title: 'What is in the canal',
            blocks: [
                {
                    t: 'table',
                    head: ['Lesion / pattern', 'Key imaging features'],
                    rows: [
                        ['Vestibular schwannoma', 'Enhancing, "ice cream cone" centred on the porus with canal extension (flared porus, acute angles); hemosiderin foci possible [[src|K9]]'],
                        ['Meningioma', 'Second commonest CPA mass; broad dural base (eccentric, obtuse angles); **hyperostosis** is a strong sign (may be absent at CPA); dural tail is non-specific; displaces rather than invades VII and VIII [[src|K9]] [[src|HCA6 p69]]'],
                        ['Epidermoid cyst', 'Third commonest CPA mass; CSF-like on T1 and T2, bright (restricts) on **DWI**, unlike an arachnoid cyst [[src|K9]]'],
                        ['Facial nerve inflammation (Bell\'s palsy)', 'Enhancement of intracanalicular or labyrinthine segment is abnormal (normal starts at the genu); Bell\'s enhancement centres on the perigeniculate region without much enlargement and can last ≥ 4 months; repeat MRI rather than operate [[src|K9]] [[src|K30]]'],
                        ['Geniculate lesions', 'Hemangioma and schwannoma [[src|J9]]'],
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-lesions-hs',
                    alt: 'Two axial MRI schematics comparing a vestibular schwannoma (ice-cream cone centred on a flared porus with acute angles) and a CPA meningioma (broad dural base eccentric to the porus with obtuse angles, hyperostosis, and a dural tail).',
                    modes: ['explore'],
                    frames: [
                        {
                            src: 'images/oksat/iac-anatomy/mri-vs.svg',
                            cap: 'Vestibular schwannoma: ice-cream cone centred on a flared porus with acute angles (axial schematic). Source: Kirtane ch. 9.',
                        },
                        {
                            src: 'images/oksat/iac-anatomy/mri-meningioma.svg',
                            cap: 'CPA meningioma: broad dural base eccentric to the porus with obtuse angles, hyperostosis, and a non-specific dural tail (axial schematic). Source: Kirtane ch. 9.',
                        },
                    ],
                },
                {
                    t: 'deep',
                    title: 'Go deeper · Senior — IAC lipoma',
                    blocks: [
                        { t: 'p', x: 'An **IAC lipoma** is bright on T1-weighted MRI and suppresses with fat saturation; management is conservative observation. [[src|sk.oto]]' },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Strongest sign of a CPA meningioma?',
                    a: 'Hyperostosis (the dural tail is non-specific).',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Where does normal facial nerve enhancement start?',
                    a: 'At the geniculate ganglion (genu) and distally.',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'How do you distinguish an epidermoid from an arachnoid cyst on MRI?',
                    a: 'DWI: epidermoid shows restricted diffusion (bright), whereas an arachnoid cyst follows CSF.',
                },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['vestibular-schwannoma:q26'],
                },
            ],
            drill: [{ m: 'iac-anatomy', c: ['im-lesions'] }],
        },
    ],
};
