/* =============================================================
   The fundus
   OKSAT · Interactive learning · iac-anatomy · chapter 2
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'fundus',
    title: 'The fundus',
    kicker: '2 · Fundus & crests',
    review: 'draft',
    lede: 'The lateral end of the IAC, divided by two bony crests into four nerve compartments plus the singular canal, the bony cochlear nerve canal, and the meatal foramen, the narrowest point of the fallopian canal.',
    src: 'K2 · K6 · K30 · K31 · HCA3 · HCA6 · J10 · Stjernholm 2002 · Büki & Ward 2021',
    tldr: [
        'A horizontal crest (**transverse** or **falciform** crest) everywhere; a vertical crest (**Bill’s bar**) above it only.',
        '**Facial** anterosuperior, **superior vestibular** posterosuperior, **cochlear** anteroinferior, **inferior vestibular** posteroinferior, and the **singular canal** below and behind.',
        'The **meatal foramen** is the narrowest point of the fallopian canal: 0.68 mm.',
        'Learn the fundus once, then turn it for each surgical or imaging view.',
    ],
    sections: [
        {
            id: 'fu-crests',
            n: '2.1',
            title: 'Two crests',
            blocks: [
                { t: 'p', x: 'The **transverse** (falciform, horizontal) crest divides the fundus into a smaller upper zone and a larger lower zone. [[src|K2]] The **vertical crest**, **Bill’s bar** (named for William House), divides only the upper zone: the **facial nerve** lies in front, and the **superior vestibular nerve** (**SVN**) lies behind. [[src|K2]] [[src|K31]] [[src|HCA3 p42]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: "Bill's bar is upper-zone only",
                    blocks: [
                        { t: 'p', x: 'Bill’s bar never divides the lower zone. The cochlear and inferior vestibular nerves are separated by position, not by a bony bar. [[src|K2]]' },
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'fu-crests-hs',
                    alt: 'Schematic cross-section of the right IAC fundus viewed from medial (retrosigmoid view), showing the transverse crest, Bill’s bar in the upper compartment, the four nerve territories, and the singular canal.',
                    modes: ['explore'],
                    frames: [
                        { src: 'images/oksat/iac-anatomy/fundus-rs-right.svg', cap: 'Right fundus from medial (retrosigmoid view); anterior to the left. Tap any crest, nerve, or the singular canal. Schematic.' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/iac-anatomy/stanford-fig-5.jpg',
                    alt: 'Cross-section of the lateral IAC with S superior, I inferior, P posterior, and A anterior, showing the horizontal transverse crest (TC) separating the upper SV (superior vestibular) and 7 (facial) nerves divided by the vertical crest (VC) from the lower IV (inferior vestibular) and C (cochlear) nerves.',
                    cap: "The lateral IAC (superior vestibular, inferior vestibular, facial, and cochlear nerves, transverse crest, and Bill's bar). Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas's educational permission.",
                },
                { t: 'check', id: 'c1', q: 'Which crest divides the fundus into upper and lower zones, and which divides only the upper?', a: 'The transverse (falciform) crest divides upper and lower; the vertical crest (Bill’s bar) divides only the upper zone.' },
                { t: 'check', id: 'c2', q: 'What does Bill’s bar separate?', a: 'The facial nerve (anterior) from the superior vestibular nerve (posterior).' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q3'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['fu-crests'] }],
        },
        {
            id: 'fu-quadrants',
            ref: [
                'Otology/cVEMP evaluates the saccule and inferior vestibular nerve via uncrossed sternocleidomastoid inhibition',
                'Otology/oVEMP evaluates the utricle and superior vestibular nerve via crossed inferior oblique excitation',
                'Otology/Vestibular neuritis causes acute spontaneous prolonged vertigo without auditory symptoms',
            ],
            n: '2.2',
            title: 'Four nerves and their organs',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        '**Anterosuperior:** **facial nerve** → labyrinthine segment. [[src|K2]] [[src|K31]]',
                        '**Posterosuperior:** **SVN** → utricle, superior and lateral canal ampullae, and the anterosuperior saccule (**Voit’s nerve**). [[src|K6]] [[src|Büki & Ward 2021]]',
                        '**Anteroinferior:** **cochlear nerve** → through a central canal ringed by small foramina into the modiolus. [[src|K2]]',
                        '**Posteroinferior:** **inferior vestibular nerve** (**IVN**) → the rest of the saccule. [[src|K6]]',
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Seven-up, Coke down',
                    blocks: [
                        { t: 'p', x: '**VII** upper front, **cochlear** lower front. It is a mnemonic for the fundus, not anatomy that holds medially.' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'Go deeper · Senior: The vestibular ganglion',
                    blocks: [
                        { t: 'p', x: '**Scarpa’s ganglion** (the vestibular ganglion) sits at the lateral end of the canal, divided into superior and inferior parts matching the two vestibular nerves’ territories. [[src|K6]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which nerve occupies the anterosuperior quadrant?', a: 'The facial nerve.' },
                { t: 'check', id: 'c2', q: 'Which organs does the superior vestibular nerve supply?', a: 'The utricle, superior and lateral canal ampullae, and the anterosuperior saccule (via Voit’s nerve).' },
                { t: 'check', id: 'c3', q: 'Where is the cochlear nerve at the fundus?', a: 'In the anteroinferior quadrant.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q4'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['fu-quadrants'] }],
        },
        {
            id: 'fu-singular',
            n: '2.3',
            title: 'The fifth opening',
            blocks: [
                { t: 'p', x: 'The **singular canal** lies posteroinferior to the **IVN** and carries the **posterior ampullary (singular) nerve** to the posterior semicircular canal ampulla. [[src|K2]] [[src|K31]]' },
                { t: 'p', x: 'The singular nerve lies close to the **round window membrane**, the surgical landmark for singular neurectomy, though singular neurectomy is seldom done today. [[src|K2]] [[src|J10 p402]] In the translabyrinthine approach, the **posterior canal ampulla** marks the inferior border of the IAC. [[src|HCA6 p75]]' },
                { t: 'check', id: 'c1', q: 'What runs in the singular canal?', a: 'The posterior ampullary (singular) nerve, to the posterior canal ampulla.' },
                { t: 'check', id: 'c2', q: 'Which middle ear landmark leads to the singular nerve?', a: 'The round window membrane.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['fu-singular'] }],
        },
        {
            id: 'fu-cnc',
            n: '2.4',
            title: 'The bony cochlear nerve canal',
            blocks: [
                { t: 'p', x: 'The **bony cochlear nerve canal** (**BCNC**) is the short bony canal leading from the anteroinferior fundus into the modiolus. [[src|K2]] Normal diameter is about **1.9–2.6 mm** (anatomical casts **2.58 mm**; CT **1.91–1.98 mm**). A diameter **< 1.4 mm** suggests a cochlear nerve abnormality, while **> 3.0 mm** suggests other anomalies. [[src|Stjernholm 2002, PMID 11876597]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Cutoff caution',
                    blocks: [
                        { t: 'p', x: 'Cutoffs vary between series.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Below what BCNC diameter should you suspect cochlear nerve deficiency?', a: '1.4 mm.' },
                { t: 'check', id: 'c2', q: 'And above what diameter should you look for other anomalies?', a: '3.0 mm.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['fu-cnc'] }],
        },
        {
            id: 'fu-meatal',
            ref: [
                'Otology/The labyrinthine segment is the narrowest portion of the Fallopian canal and most vulnerable to edema',
            ],
            n: '2.5',
            title: 'The meatal bottleneck',
            blocks: [
                { t: 'p', x: 'The **meatal segment** runs from the porus to the **meatal foramen**, the narrowest point of the fallopian canal: **0.68 mm** on average. [[src|Fisch & Esslen 1972, via K30]] A periosteal band reinforces it, and the nerve fills **83%** of the canal there, versus **73%** in the tympanic segment and **64%** in the mastoid segment. [[src|Proctor & Nager 1982, via K30]]' },
                { t: 'p', x: 'Beyond the meatal foramen, the **labyrinthine segment** is the shortest and thinnest segment of the fallopian canal (**3–5 mm**), bounded by the **cochlea** in front, the **superior semicircular canal** behind, and the **vestibule** below. [[src|K30]] [[src|K2]] The arachnoid sleeve ends at the meatal foramen.' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why edema strangles here',
                    blocks: [
                        { t: 'p', x: 'A tight bony ring the nerve already nearly fills (**83%**), so swelling becomes ischaemia; this is the greatest site of entrapment in Bell’s palsy. [[src|K30]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Some sources call the labyrinthine segment itself the narrowest part of the canal; Kirtane Ch. 30 places the narrowest point at the meatal foramen, at that segment’s entrance. This guide teaches the meatal foramen. [[src|K30]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is the narrowest point of the facial canal, and what is its diameter?', a: 'The meatal foramen, averaging 0.68 mm.' },
                { t: 'check', id: 'c2', q: 'What fraction of the canal does the nerve fill there?', a: '83%.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['fu-meatal'] }],
        },
        {
            id: 'fu-views',
            n: '2.6',
            title: 'Turning the fundus',
            blocks: [
                { t: 'p', x: 'The same four nerves are seen from medial (retrosigmoid), from lateral (translabyrinthine), from above (**MCF**), and on oblique-sagittal MRI (displayed with anterior on the image left). Right and left ears mirror each other. From above, the **facial nerve** lies on top and in front; the **cochlear** and **inferior vestibular** nerves lie below it. [[src|HCA3 p45]]' },
                {
                    t: 'hotspot',
                    id: 'fu-views-hs',
                    alt: 'Eight schematic views of the IAC fundus across right and left ears: retrosigmoid, translabyrinthine, oblique-sagittal MRI, and middle cranial fossa.',
                    modes: ['explore', 'find'],
                    frames: [
                        { src: 'images/oksat/iac-anatomy/fundus-rs-right.svg', cap: 'Right fundus from medial (retrosigmoid view); anterior on the left. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-rs-left.svg', cap: 'Left fundus from medial (retrosigmoid view); anterior on the right. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-tl-right.svg', cap: 'Right fundus from lateral (translabyrinthine view); anterior on the right. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-tl-left.svg', cap: 'Left fundus from lateral (translabyrinthine view); anterior on the left. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-mri-right.svg', cap: 'Right IAC, oblique-sagittal MRI display; anterior on the left. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-mri-left.svg', cap: 'Left IAC, oblique-sagittal MRI display; anterior on the left. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-mcf-right.svg', cap: 'Right IAC from above (MCF view): facial nerve on top, in front. Schematic.' },
                        { src: 'images/oksat/iac-anatomy/fundus-mcf-left.svg', cap: 'Left IAC from above (MCF view): facial nerve on top, in front. Schematic.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'In a right ear seen from medial, which side is anterior?', a: 'The viewer’s left.' },
                { t: 'check', id: 'c2', q: 'From the middle fossa, which nerve is on top?', a: 'The facial nerve.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['fu-views'] }],
        },
    ],
};
