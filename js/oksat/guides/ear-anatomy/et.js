/* =============================================================
   The Eustachian tube
   OKSAT · Interactive learning · ear-anatomy · chapter 8
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'et',
    title: 'The Eustachian tube',
    kicker: '8 · Middle ear',
    review: 'draft',
    lede: 'The one pipe that ventilates, clears and protects the middle ear: closed at rest, opened by muscle, lengthening and tilting as the child grows, and lying against the carotid for most of its way.',
    src: 'Glasscock Ch. 2 · Cummings Review Ch. 2 · Handbook Ch. 3 · tubal morphometry and anatomy papers',
    tldr: [
        'Adult tube about **35 mm** (Glasscock, Handbook); about 18 mm at birth. Lateral third **bony** (protympanum), medial two thirds **cartilaginous**, ending at the **torus tubarius**; the **isthmus** is the narrow point at the junction.',
        'Closed at rest. **Ostmann fat pad** against the lateral wall helps keep it shut; rapid weight loss can shrink it and leave the tube patulous.',
        'Opened by **tensor veli palatini** (V3, primary dilator), with levator veli palatini and salpingopharyngeus (pharyngeal plexus, X).',
        'The infant tube is shorter and flatter; it lengthens and steepens with growth, one reason otitis media peaks in childhood.',
        'The **internal carotid artery** runs medial to the bony tube in a bony shell often under 0.5 mm thick. A unilateral effusion in an adult sends you to the **nasopharynx**.',
    ],
    sections: [
        {
            id: 'et-seg',
            n: '8.1',
            title: 'Segments and dimensions',
            blocks: [
                { t: 'p', x: 'The tube runs from the anterior wall of the tympanic cavity to the lateral wall of the nasopharynx, serving to **ventilate, clear and protect** the middle ear. The **lateral third is bony**: it opens from the protympanum, a few millimetres above the floor of the cavity, and is lined by ciliated cuboidal epithelium. The **medial two thirds are cartilaginous**: they end at the **torus tubarius** of the nasopharynx and are lined by pseudostratified columnar epithelium. The narrow point, the **isthmus**, lies where bone gives way to cartilage. [[src|Glasscock Ch. 2]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'ul',
                    items: [
                        'Adult length about **35 mm**; about **18 mm** at birth. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 2]]',
                        'The tympanic orifice sits a few millimetres above the floor, directly below the bulge of the tensor semicanal (see the anterior wall in chapter 5). [[src|Glasscock Ch. 2]]',
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Textbooks give a round adult length of about 35 mm and a bony third. Measured series differ: a computer reconstruction of 11 temporal bones found an adult lumen path length of **37.0 ± 4.2 mm** and a cartilaginous-plus-junctional to bony ratio of **4:1** (a bony fifth) in adults; a CT series reported a longer tube in 8–18-year-olds (about 41 mm) because it measures a different line. Use the textbook values for exams and expect the range in real scans. [[src|Ann Otol Rhinol Laryngol 2000]] [[src|Otolaryngol Head Neck Surg 2021]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which part of the tube is bony, which cartilaginous, and where does the cartilaginous part end?', a: 'The lateral third is bony (from the protympanum); the medial two thirds are cartilaginous and end at the torus tubarius in the nasopharynx.' },
                { t: 'check', id: 'c2', q: 'Where is the tympanic orifice in the anterior wall, and which bulge lies just above it?', a: 'A few millimetres above the floor, directly below the tensor semicanal.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q87'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['et-seg'] }],
        },
        {
            id: 'et-cart',
            n: '8.2',
            title: 'Cartilage, fat pad, safety canal',
            blocks: [
                { t: 'p', x: 'The cartilage forms the **craniomedial** wall of the cartilaginous tube and a **membranous wall** completes it on the **inferolateral** side. The cartilage has a **medial lamina** and a **lateral lamina**. The lumen has two compartments: **Rüdinger safety canal** and the **auxiliary gap**. [[src|Otolaryngol Clin North Am 2016]] [[src|Ann Otol Rhinol Laryngol 2002]]' },
                { t: 'p', x: 'Against the lateral aspect of the fibrocartilaginous tube sits the **Ostmann fat pad**. It helps maintain **resting closure**. The fat is metabolically sensitive: rapid weight loss can atrophy it and produce a **patulous Eustachian tube**. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why closed at rest',
                    blocks: [
                        { t: 'p', x: 'A collapsible wall (membranous) plus a fat pad pressing on it keeps the lumen shut until muscle pulls it open. Remove the fat and the same wall no longer resists: the tube stays open when it should not.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Glasscock and Cummings Review place the Ostmann fat pad on the lateral wall. A 2016 anatomical review describes a **medial** Ostmann fat pad lying between the lateral and medial suspensory ligaments of the cartilage. Learn the lateral pad for exams; do not assume one pad fits every description. [[src|Otolaryngol Clin North Am 2016]]' },
                    ],
                },
                { t: 'neighbors', id: 'et-cart-nb', g: 'et-cart', label: 'Neighbours of the cartilaginous tube' },
                { t: 'check', id: 'c1', q: 'Predict: why can rapid weight loss leave the tube patulous?', a: 'The Ostmann fat pad against the lateral wall atrophies; it normally helps keep the tube closed at rest.' },
                { t: 'check', id: 'c2', q: 'Name the two compartments of the lumen.', a: 'Rüdinger safety canal and the auxiliary gap.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q89'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['et-cart'] }],
        },
        {
            id: 'et-muscle',
            n: '8.3',
            title: 'Muscles',
            blocks: [
                { t: 'p', x: 'The tube is shut at rest and opens with swallowing or yawning. The **tensor veli palatini** is the primary dilator, supplied by **V3**. Two other muscles contribute. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'table',
                    head: ['Muscle', 'Nerve', 'In the opening tube'],
                    rows: [
                        ['Tensor veli palatini', 'V3 (first arch)', 'Primary dilator; lies lateral to the cartilage'],
                        ['Levator veli palatini', 'Pharyngeal plexus (X)', 'Strongest, longest activity on paratubal recordings; rotates the medial lamina'],
                        ['Salpingopharyngeus', 'Pharyngeal plexus (X)', 'Weakest; inactive in some ears'],
                    ],
                },
                { t: 'p', x: 'In 17 volunteers recorded with paratubal electromyography and sonotubometry, the levator veli palatini was strongest and longest-acting during opening, and salpingopharyngeus weakest. The levator lies inferolateral to the medial lamina and is thought to open the most anterior cartilaginous portion. [[src|Acta Otolaryngol 2016]] [[src|Ann Otol Rhinol Laryngol 2002]]' },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**V3 runs both tensors.** Tensor tympani (the malleus) and tensor veli palatini (the tube) share nerve and first-arch origin; the one palatal muscle not on the pharyngeal plexus is the one that opens the tube.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which muscle is the primary dilator of the tube, and which nerve supplies it?', a: 'Tensor veli palatini; the mandibular nerve (V3).' },
                { t: 'check', id: 'c2', q: 'Which of the three tubal muscles was strongest on paratubal electromyography, and which weakest?', a: 'Levator veli palatini strongest; salpingopharyngeus weakest.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q91'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['et-muscle'] }],
        },
        {
            id: 'et-child',
            n: '8.4',
            title: 'Adult versus infant',
            blocks: [
                { t: 'p', x: 'The tube is about **18 mm at birth and 35 mm in adults**. Infants have short, **horizontal** tubes; with growth the tube becomes longer and more vertical, and the incidence of acute otitis media falls. [[src|Handbook Ch. 3]] Aging increases slope, length, diameter and opening efficiency. [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'layers',
                    id: 'et-age-ly',
                    alt: 'The right Eustachian tube drawn twice from tympanic orifice to nasopharynx against a horizontal line, adult first (longer, steeper), then infant (shorter, flatter).',
                    base: 'images/oksat/ear-anatomy/et-base.svg',
                    mode: 'step',
                    layers: [
                        { id: 'adult', label: 'Adult: longer, steeper', src: 'images/oksat/ear-anatomy/et-adult.svg' },
                        { id: 'infant', label: 'Infant: shorter, flatter', src: 'images/oksat/ear-anatomy/et-infant.svg' },
                    ],
                    cap: 'Step from adult to infant and compare the length and slope against the dashed horizontal line. Segment proportions are not measured. Schematic.',
                },
                {
                    t: 'ul',
                    items: [
                        'Lumen path length: **21.2 mm** at 3 months, **37.0 ± 4.2 mm** in adults; the cartilaginous-plus-junctional to bony ratio falls from **8:1** at 3 months to **4:1** in adults, so the bony part gains relative length. [[src|Ann Otol Rhinol Laryngol 2000]]',
                        'In children the cartilaginous and bony parts both align with the line joining the two orifices; in adults the cartilaginous part is angled **inferiorly and laterally** from the bony part. [[src|Ann Otol Rhinol Laryngol 2000]]',
                        'More than half of growth occurs by **8 years**; adult morphology is reached in **early adolescence**. [[src|Otolaryngol Head Neck Surg 2021]]',
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Direction of change is agreed; magnitude is not. A CT series measured the horizontal angle at **17°** under 4 years, **21°** at 5–7 and **23°** at 8–18 years. A skull study of 3–4-year-olds against adults found a shorter child tube but **no difference** in the angle of descent from the cranial base. Do not quote a single infant angle as fact. [[src|Otolaryngol Head Neck Surg 2021]] [[src|Int J Pediatr Otorhinolaryngol 2010]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why infants get otitis media',
                    blocks: [
                        { t: 'p', x: 'Bacteria reach the middle ear through the tube. A short, horizontal tube is an easy path, and feeding in the reclined position adds to it. The child tube also has a shorter tensor vector and smaller tensor surface area, so it opens less efficiently. [[src|Handbook Ch. 3]] [[src|Int J Pediatr Otorhinolaryngol 2010]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Predict: why does a short, horizontal tube favour otitis media?', a: 'Bacteria from the nasopharynx reach the middle ear more easily through it, and the tube opens less efficiently; reclined feeding adds to the risk.' },
                { t: 'check', id: 'c2', q: 'How does tube length at birth compare with adult length?', a: 'About half: roughly 18 mm against 35 mm.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q93'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['et-child'] }],
        },
        {
            id: 'et-rel',
            n: '8.5',
            title: 'Orifice and relations',
            blocks: [
                { t: 'p', x: 'The **torus tubarius** is the cartilage ridge at the nasopharyngeal orifice. The bony tube has the **tensor semicanal above** it and the **internal carotid artery medial** to it: as the artery ascends through the petrous bone it passes in front of the cavity and cochlea, then bends (its knee) to run **medial to the tube** and inferomedial to the tensor semicanal. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 2]]' },
                { t: 'neighbors', id: 'et-rel-nb', g: 'et-bony', label: 'Neighbours of the bony tube' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'The shell over the carotid is thin, often less than **0.5 mm**, and dehiscent in **6%**. Dissect gently in the medial wall of the tube. [[src|Glasscock Ch. 2]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Peritubal cells',
                    blocks: [
                        { t: 'p', x: 'A peritubal air-cell tract surrounds the tube. Cells that open into the tube in front of its tympanic orifice have been linked to persistent CSF leak after translabyrinthine schwannoma resection despite adequate tympanomastoid obliteration. [[src|Glasscock Ch. 2]]' },
                    ],
                },
                { t: 'p', x: 'An adult with unilateral middle ear effusion needs the nasopharynx examined: a mass blocking the tube must be ruled out before attributing the effusion to a cold, allergy or flight. [[src|Handbook Ch. 3]]' },
                { t: 'check', id: 'c1', q: 'Which vessel lies medial to the bony tube, and why does that shape surgery?', a: 'The internal carotid artery; its bony shell is often under 0.5 mm and dehiscent in 6%, so the medial wall of the tube is dissected gently.' },
                { t: 'check', id: 'c2', q: 'An adult has unilateral middle ear effusion. Which region do you examine, and which ridge surrounds the tube there?', a: 'The nasopharynx; the torus tubarius.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q95', 'ear-anatomy:q96'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['et-rel'] }],
        },
    ],
};
