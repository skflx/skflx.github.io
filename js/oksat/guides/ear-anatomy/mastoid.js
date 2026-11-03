/* =============================================================
   The mastoid and the surgical landmarks
   OKSAT · Interactive learning · ear-anatomy · chapter 9
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'mastoid',
    title: 'The mastoid and the surgical landmarks',
    kicker: '9 · Mastoid',
    review: 'draft',
    lede: 'A mastoidectomy is a sequence of landmarks met in a fixed order: the surface tells you where to start, the dura and sinus set the limits, and the lateral canal, the incus and the digastric ridge lead you to the facial nerve.',
    src: 'Myers Ch. 134 · Vula: Mastoidectomy · Glasscock Ch. 1–2 · Cummings Review Ch. 2 · ENT Secrets Ch. 39',
    tldr: [
        'Surface: temporal line (about the middle fossa floor), spine of Henle, **Macewen triangle** over the antrum, mastoid tip, digastric groove, emissary foramen.',
        '**Antrum**: near adult size at birth; roof tegmen, medial wall the lateral semicircular canal, anterior opening the aditus. **Körner septum** lies in the way and is taken down.',
        'Order of drilling: cortex off → tegmen, sigmoid plate and sinodural angle → antrum → lateral semicircular canal → short process of the incus → digastric ridge.',
        '**Second genu**: just inferior and medial to the lateral canal, medial to the short process. Mastoid segment runs to the stylomastoid foramen at the anterior end of the digastric ridge; the chorda leaves it about 4 mm above that (variable).',
        '**Facial recess**: nerve behind, chorda in front, incus buttress above. **Trautmann triangle**: labyrinth, sigmoid sinus, superior petrosal sinus. **Donaldson line**: lateral canal plane, endolymphatic sac below.',
        'Newborn: no mastoid process, so the facial nerve leaves the stylomastoid foramen onto the lateral skull.',
    ],
    sections: [
        {
            id: 'ma-surface',
            n: '9.1',
            title: 'Surface landmarks',
            blocks: [
                { t: 'p', x: 'The **mastoid portion** is the downward projection behind the canal. It has a **squamous** part laterally and a **petrous** part medially, joined at **Körner septum**. Its **tip** takes the sternocleidomastoid; medial and superior to the tip lies the **digastric groove**, the origin of the posterior belly, whose anterior border is the **stylomastoid foramen**. Posteriorly the **mastoid foramen** transmits the emissary vein and one or two mastoid arteries. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'hotspot',
                    id: 'ma-surface-hs',
                    alt: 'Right temporal bone seen from the side, with the temporal line, spine of Henle, Macewen triangle, root of the zygoma, canal and mastoid tip tappable.',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/temporal-bone-lateral.svg',
                            cap: 'Right temporal bone, lateral view, anterior to the right, superior up. Schematic.',
                            regions: [{ g: 'henle' }, { g: 'macewen' }, { g: 'templine' }, { g: 'tip' }, { g: 'zygroot' }, { g: 'eac' }, { g: 'mastoidpart' }],
                        },
                    ],
                },
                {
                    t: 'table',
                    head: ['Landmark', 'What it marks', 'Use'],
                    rows: [
                        ['**Temporal line** (linea temporalis)', 'Backward continuation of the zygomatic root; about the floor of the middle fossa (±5 mm) [[src|Cummings Review Ch. 2]]', 'Upper limit of the first cut; an avascular plane for the top of the postauricular "T" incision [[src|Glasscock Ch. 2]]'],
                        ['**Spine of Henle**', 'Small spine at the posterosuperior rim of the bony canal', 'Bounds Macewen triangle anteriorly; the triangle lies posterior and superior to it [[src|Vula: Mastoidectomy]] [[src|Cummings Review Ch. 2]]'],
                        ['**Macewen triangle** (cribriform area)', 'Between the temporal line, the posterosuperior canal margin and a tangent to the posterior canal margin; pierced by many small vessels [[src|Glasscock Ch. 2]]', 'Lies over the antrum: where mastoid drilling begins [[src|Glasscock Ch. 2]]'],
                        ['**Mastoid foramen** (emissary)', 'Posterior surface; the sigmoid sinus lies anterior to it [[src|Cummings Review Ch. 2]]', 'A large vein bleeds badly if not anticipated [[src|Vula: Mastoidectomy]]'],
                    ],
                },
                {
                    t: 'p',
                    x: 'Both Glasscock and Myers tie the first cut to the triangle: the cortex is removed within the temporal line, the posterior canal wall and the sigmoid line, and the deepest part of the cavity is kept over the antrum, so the antrum is entered before the plane of the facial nerve is reached. [[src|Myers Ch. 134]] [[src|Glasscock Ch. 2]] A large emissary vein is worth anticipating on the CT. [[src|Vula: Mastoidectomy]]',
                },
                { t: 'check', id: 'c1', q: 'Which three borders define Macewen triangle, and what lies deep to it?', a: 'The temporal line, the posterosuperior margin of the canal and a tangent to the posterior canal margin; the mastoid antrum lies deep to it.' },
                { t: 'check', id: 'c2', q: 'What does the temporal line approximate, and why does that matter for the first cut?', a: 'The floor of the middle cranial fossa (about ±5 mm): it is the upper limit of the cut, so you stay below it and meet the tegmen from beneath.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q67', 'ear-anatomy:q68'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-surface'] }],
            ref: [],
        },
        {
            id: 'ma-antrum',
            n: '9.2',
            title: 'Antrum and Körner septum',
            blocks: [
                { t: 'p', x: 'The **mastoid antrum** is the one constant cell: pneumatization reaches it by about the 21st week, it approximates adult size at birth, and it is ordinarily present even in the least pneumatized bone. Its **roof** is the **tegmen mastoideum**, its **medial wall** carries the **lateral semicircular canal**, and anteriorly the **aditus ad antrum** leads into the posterior epitympanum. [[src|Glasscock Ch. 1–2]] [[src|ENT Secrets Ch. 39]]' },
                {
                    t: 'neighbors',
                    id: 'ma-antrum-nb',
                    g: 'antrum',
                    label: 'Fill the antrum\'s neighbours',
                },
                { t: 'p', x: '**Körner septum** (the petrosquamous lamina) is the bone between the squamous and petrous parts of the mastoid. It sits in the path from the cortex to the antrum, and in Myers\' account of the intact canal wall approach it is removed, with the tegmen above and the canal wall in front as limits, to enter the antrum. A cavity that stops at the septum has not reached the antrum. [[src|Glasscock Ch. 2]] [[src|Myers Ch. 134]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Looking in the wrong place',
                    blocks: [
                        { t: 'p', x: 'Novice surgeons tend to drill inferior and posterior to the antrum, which puts the facial nerve at risk. If the antrum is hard to find, follow the dura of the middle fossa anteromedially (Vula), or drill anteriorly and superiorly (Myers). [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the antrum\'s roof, its medial wall and its anterior opening.', a: 'Roof: tegmen mastoideum. Medial wall: lateral semicircular canal. Anterior: the aditus ad antrum, into the posterior epitympanum.' },
                { t: 'check', id: 'c2', q: 'What is Körner septum, and what do you do with it in an intact canal wall mastoidectomy?', a: 'The petrosquamous lamina between the squamous (lateral) and petrous (medial) parts; it is taken down to enter the antrum.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q69', 'ear-anatomy:q70'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-antrum'] }],
            ref: [],
        },
        {
            id: 'ma-pneum',
            n: '9.3',
            title: 'Pneumatization',
            blocks: [
                { t: 'p', x: 'Pneumatization is evident from about 33 weeks and spreads along **tracts**; heredity, environment, nutrition, infection and Eustachian tube function all shape it, and the mastoid goes on growing for up to 19 years after birth. Glasscock recognizes five regions (middle ear, mastoid, perilabyrinthine, petrous apex, accessory) and five tracts. [[src|Glasscock Ch. 1–2]]' },
                {
                    t: 'table',
                    head: ['Tract', 'Course'],
                    rows: [
                        ['**Posterosuperior**', 'At the juncture of the posterior and middle fossa surfaces of the petrous bone'],
                        ['**Posteromedial**', 'Parallels the posterosuperior tract and runs inferior to it'],
                        ['**Subarcuate**', 'Through the arch of the superior semicircular canal'],
                        ['**Perilabyrinthine**', 'Superior and inferior to the bony labyrinth (supralabyrinthine and infralabyrinthine cells)'],
                        ['**Peritubal**', 'Around the Eustachian tube; with the apical cells it makes up the petrous apex region'],
                    ],
                },
                { t: 'p', x: 'Other named groups fill in the picture: the antrum, central and peripheral mastoid cells; the **retrofacial** cells behind the mastoid facial nerve; the tip cells; and the accessory zygomatic, squamous, occipital and styloid cells. An open cavity operation exenterates every tract, including the retrofacial, retrolabyrinthine, supralabyrinthine and supratubal cells. [[src|Glasscock Ch. 2]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Pneumatization is not ventilation',
                    blocks: [
                        { t: 'p', x: 'Read the CT for both. The **extent of pneumatization** (well pneumatized, reduced or sclerotic) records how the Eustachian tube worked in roughly the first 4 years of life. The **ventilation** (aerated or opacified middle ear and cells) shows how it works now. Poor pneumatization or poor ventilation of already impaired tracts favours an open cavity. [[src|Vula: Mastoidectomy]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name Glasscock\'s five air cell tracts.', a: 'Posterosuperior, posteromedial, subarcuate, perilabyrinthine and peritubal.' },
                { t: 'check', id: 'c2', q: 'A CT shows a sclerotic mastoid. What does that say about the first years of life, and which cavity does it favour?', a: 'Poor Eustachian tube function in roughly the first 4 years (the cells never developed); poor pneumatization favours an open (canal wall down) cavity.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q71', 'ear-anatomy:q72'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-pneum'] }],
            ref: [],
        },
        {
            id: 'ma-sequence',
            n: '9.4',
            title: 'Landmark sequence',
            blocks: [
                { t: 'p', x: 'The initial cuts outline the **temporal line**, the **posterior canal wall** and the **sigmoid sinus**, forming a triangle; the cortex comes off and the cells are exposed. The **tegmen** announces itself as a pink change in the bone (often with small veins) and the **sigmoid sinus** as a blue one; the dural plates are also recognized by a change in the pitch of the burr. Skeletonize them, leaving a thin shell of bone, and follow the dural plate anteromedially. The **sinodural angle** is where they meet. [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'hotspot',
                    id: 'ma-seq-hs',
                    alt: 'A completed canal wall up mastoidectomy in a right ear with the tegmen, sinodural angle, sigmoid plate, antrum, lateral canal, aditus, short process of the incus, facial nerve, recess and digastric ridge tappable.',
                    modes: ['explore', 'find'],
                    frames: [{ src: 'images/oksat/ear-anatomy/mastoidectomy-cwu.svg', cap: 'Right ear, surgeon\'s view into a completed canal wall up mastoidectomy; anterior to the right, superior up. Schematic.' }],
                },
                { t: 'p', x: 'The posterior canal wall is thinned from behind, kept in view, but not breached. With the tegmen above and the canal wall in front as limits, Körner septum is removed and the antrum entered; the burr is downsized and drilling continues toward the zygomatic root until the **lateral semicircular canal** and the **incus in the fossa incudis** are seen. From here drilling runs medial to lateral so the ossicles are not touched. The **digastric ridge** is found last, by drilling inferior to the skeletonized sinus, close to the tip, from lateral to medial. [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'sequence',
                    id: 'ma-seq-ord',
                    q: 'Order the landmarks of a canal wall up mastoidectomy as you meet them.',
                    items: [
                        'Cortex removed within the temporal line, canal wall and sigmoid line',
                        'Tegmen, sigmoid plate and the sinodural angle between them',
                        'Posterior canal wall thinned from behind',
                        'Antrum opened after Körner septum is taken down',
                        'Lateral semicircular canal',
                        'Short process of the incus, seen through the aditus',
                        'Digastric ridge',
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Drill parallel to what you keep',
                    blocks: [
                        { t: 'p', x: 'Keep the burr tip in view, work through a wide space, never drill behind an edge of bone, and drill parallel to the structure being preserved (facial nerve, sigmoid sinus). A cutting burr cannot be lengthened without chatter; change to a diamond burr for depth. [[src|Vula: Mastoidectomy]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What colour changes warn of the tegmen and the sigmoid sinus?', a: 'Pink (with small veins) for the tegmen and the dura; blue for the sigmoid sinus. The pitch of the burr also changes.' },
                { t: 'check', id: 'c2', q: 'Why does the drill change to a medial-to-lateral direction once the lateral semicircular canal is seen?', a: 'To avoid touching the ossicles (the incus is next), which would cause a sensorineural hearing loss.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q73', 'ear-anatomy:q74'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-sequence'] }],
            ref: [],
        },
        {
            id: 'ma-fn',
            n: '9.5',
            title: 'The facial nerve in the mastoid',
            blocks: [
                { t: 'p', x: 'The tympanic segment turns into the mastoid segment at the **second genu**, just inferior and medial to the lateral semicircular canal and medial to the short process of the incus. The short process points to it, in the same plane. Two canals bracket the nerve: it lies anteroinferior to the lateral canal and about 2.5 mm anterior to the posterior canal. It leaves at the **stylomastoid foramen**, at the anterior end of the digastric ridge. [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'hotspot',
                    id: 'ma-fn-hs',
                    alt: 'The completed mastoidectomy cavity with the facial nerve landmarks tappable: lateral and posterior canals, short process, second genu, nerve, chorda, recess, facial ridge, digastric ridge and stylomastoid foramen.',
                    modes: ['find', 'explore'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/mastoidectomy-cwu.svg',
                            cap: 'Right ear, surgeon\'s view; anterior to the right, superior up. The nerve lies deep to the facial ridge and is drawn through a thin shell. Schematic.',
                            regions: [{ g: 'lscc' }, { g: 'pscc' }, { g: 'incshort' }, { g: 'genu2' }, { g: 'fn' }, { g: 'chorda' }, { g: 'recess' }, { g: 'facialridge' }, { g: 'digastric' }, { g: 'smf' }],
                        },
                    ],
                },
                {
                    t: 'table',
                    head: ['Look for', 'It tells you'],
                    rows: [
                        ['**Lateral semicircular canal**', 'The nerve runs anteroinferiorly from it'],
                        ['**Short process of the incus**', 'Points to the second genu, in the same plane as the nerve'],
                        ['**Posterior canal wall**', 'With the two above, a major landmark; the facial ridge, with the nerve beneath it, runs along it'],
                        ['**Posterior semicircular canal**', 'The nerve runs about 2.5 mm anterior to it [[src|Vula: Mastoidectomy]]'],
                        ['**Digastric ridge**', 'Its anterior end leads to the stylomastoid foramen; the minor landmarks also include the cochleariform process and the oval window'],
                    ],
                },
                {
                    t: 'neighbors',
                    id: 'ma-fn-nb',
                    g: 'genu2',
                    label: 'Fill the second genu\'s neighbours',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Length of the mastoid segment: Glasscock gives about 20 mm from the second genu to the stylomastoid foramen; Cummings Review gives 12–15 mm. Use the landmarks, not a remembered length. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                { t: 'p', x: 'The **chorda tympani**, the sensory part of the nerve, usually separates about 4 mm proximal to the stylomastoid foramen; it may leave as high as the lateral canal, or rarely outside the temporal bone, and Vula warns of an early takeoff near the foramen. It ascends in a canal lateral and anterior to the nerve to enter the middle ear at the iter chordae posterius. The nerve to the stapedius leaves near the pyramidal eminence. The **stylomastoid artery** supplies the inferior mastoid segment; the superficial petrosal artery supplies its upper part. [[src|Glasscock Ch. 2]] [[src|Vula: Mastoidectomy]]' },
                { t: 'p', x: '**Arnold nerve** (auricular branch of the vagus) reaches the facial nerve by way of the mastoid canaliculus over the dome of the jugular bulb and enters the facial canal; a sensory branch is often met just above the stylomastoid foramen, supplying the posterior canal wall and part of the drum. [[src|Glasscock Ch. 2]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Where the nerve is hurt',
                    blocks: [
                        { t: 'p', x: 'The second genu is the segment most often damaged in mastoid surgery. Injury is under 1% in primary cases and 4–10% in revisions; monitoring does not replace the landmarks. Skeletonize the nerve by drilling parallel to it with a large diamond burr and copious irrigation. [[src|Myers Ch. 134]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Where is the second genu relative to the lateral semicircular canal and the short process of the incus?', a: 'Just inferior (and anteroinferior) to the lateral canal; medial to the short process, which points to it.' },
                { t: 'check', id: 'c2', q: 'Where does the chorda usually leave the facial nerve, and how can that vary?', a: 'About 4 mm proximal to the stylomastoid foramen; occasionally as high as the lateral canal level, or rarely outside the temporal bone.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q76', 'ear-anatomy:q77'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-fn'] }],
            ref: [],
        },
        {
            id: 'ma-recess',
            n: '9.6',
            title: 'Facial recess',
            blocks: [
                { t: 'p', x: 'The **facial recess** is a triangular area in the posterior wall, inferior to the fossa incudis: **medial** to it the vertical facial nerve, **lateral** to it the chorda tympani, **superior** the **incus buttress**. Its air cells lie at the level of the tip of the short process. It is the window from the mastoid into the middle ear in an intact canal wall approach. [[src|Glasscock Ch. 2]] [[src|ENT Secrets Ch. 39]]' },
                {
                    t: 'neighbors',
                    id: 'ma-recess-nb',
                    g: 'recess',
                    label: 'Fill the recess\'s neighbours',
                },
                {
                    t: 'table',
                    head: ['Border', 'Structure', 'If it is crossed'],
                    rows: [
                        ['Medial and posterior', 'Vertical facial nerve', 'Facial weakness: direct trauma or heat'],
                        ['Lateral and anterior', 'Chorda tympani', 'Altered taste, usually settling within months'],
                        ['Superior', 'Incus buttress', 'Drill contact with the incus can cause a sensorineural loss'],
                    ],
                },
                { t: 'p', x: 'Thin the posterior canal wall, then remove bone just below the buttress, drilling parallel to the nerve. The **superior** part of the recess is the widest and the safest entry. Once inside, bone can be taken medial to the chorda. A recess opened this way shows the stapes superstructure and, as it widens, the incudostapedial joint, the **round window niche** and the promontory. Sacrificing the chorda in an extended recess lets you work as far as the inferior annulus and the hypotympanum. [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]] The same route carries the cochlear implant electrode to the round window. [[src|ENT Secrets Ch. 39]]' },
                { t: 'check', id: 'c1', q: 'Name the three borders of the facial recess.', a: 'Facial nerve (vertical segment) medially and posteriorly; chorda tympani laterally and anteriorly; incus buttress above.' },
                { t: 'check', id: 'c2', q: 'Where do you enter the recess, and why there?', a: 'At its superior aspect just below the incus buttress: it is the widest part.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q79', 'ear-anatomy:q80'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-recess'] }],
            ref: [],
        },
        {
            id: 'ma-lines',
            n: '9.7',
            title: 'Triangles and lines',
            blocks: [
                { t: 'p', x: 'Three named relations map the region behind the labyrinth. [[src|Glasscock Ch. 2]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'table',
                    head: ['Name', 'Defined by', 'What it gives you'],
                    rows: [
                        ['**Trautmann triangle**', 'The bony labyrinth, the sigmoid sinus and the superior petrosal sinus', 'The plate of posterior fossa dura between them'],
                        ['**Donaldson line**', 'The plane of the lateral semicircular canal extended posteriorly: it bisects the posterior semicircular canal and meets the posterior fossa dura', 'The endolymphatic sac lies inferior to it, anterior and medial to the sigmoid sinus; its position varies'],
                        ['**Sinodural angle** (Citelli)', 'The area between the sigmoid sinus and the middle fossa dura, where the tegmen meets the sigmoid plate', 'Reached by following the dural plate posteriorly'],
                    ],
                },
                { t: 'p', x: 'The sac lies about 10 mm inferior and lateral to the porus of the internal auditory canal; it has an intraosseous part under the operculum and a more distal intradural part. [[src|Glasscock Ch. 2]]' },
                { t: 'check', id: 'c1', q: 'What are the three borders of Trautmann triangle?', a: 'The bony labyrinth, the sigmoid sinus and the superior petrosal sinus.' },
                { t: 'check', id: 'c2', q: 'How do you draw Donaldson line, and which structure lies below it?', a: 'Extend the plane of the lateral semicircular canal posteriorly so that it bisects the posterior canal; the endolymphatic sac lies inferior to it.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q81', 'ear-anatomy:q82'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-lines'] }],
            ref: [],
        },
        {
            id: 'ma-peds',
            n: '9.8',
            title: 'Pediatric shifts',
            blocks: [
                { t: 'p', x: 'In the neonate the mastoid process is essentially absent and the tympanic bone is a flat ring with the stylomastoid foramen exposed. Without a process the **facial nerve** leaves the foramen onto the **lateral surface of the skull**, so a standard postauricular incision endangers it. After the first year the process grows laterally and inferiorly, its tip from the petrous part. [[src|Glasscock Ch. 1]] In children Myers places the inferior limb of the incision farther posteriorly, and Vula notes that the sigmoid sinus can lie close to the lateral surface. [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]]' },
                {
                    t: 'table',
                    head: ['Feature', 'Newborn', 'Adult'],
                    rows: [
                        ['Mastoid process and tip', 'Essentially absent; the tip arises after the first year', 'Present, with the digastric groove medial to it'],
                        ['Stylomastoid foramen and nerve', 'Exposed on the lateral skull surface', 'Deep, at the anterior end of the digastric ridge'],
                        ['Antrum', 'Approximates adult size at birth', 'Adult'],
                        ['Tympanic bone', 'Flat ring', 'Cylinder (canal)'],
                    ],
                },
                {
                    t: 'deep',
                    title: 'The canal wall down cavity',
                    blocks: [
                        { t: 'p', x: 'In a canal wall down mastoidectomy the posterior canal wall is taken down to the **facial ridge** and the epitympanum, antrum, mastoid and canal become one cavity; the mastoid is exteriorized. The bone over the second genu and vertical segment is thinned and the facial ridge lowered to the level of the nerve (still covered by bone). The canal can be thought of as an **anterior buttress** (tympanosquamous suture and lateral wall of the epitympanum), a **posterior buttress** (the facial ridge) and the bridge of bone between. [[src|Myers Ch. 134]] [[src|ENT Secrets Ch. 39]]' },
                        { t: 'ul', items: [
                            'A **high facial ridge** makes the cavity hard to clean and is a cause of a discharging ear; **saucerize** the edges so soft tissue can collapse in. [[src|Myers Ch. 134]] [[src|Vula: Mastoidectomy]]',
                            'A **meatoplasty** is always performed with the wall down, to allow office cleaning. [[src|Myers Ch. 134]]',
                            'In a modified radical (Bondy) cavity the drum and ossicles are kept; a radical mastoidectomy removes the drum and the ossicles except the stapes, and closes the Eustachian tube orifice. [[src|ENT Secrets Ch. 39]] [[src|Myers Ch. 134]]',
                            'Indications named: limited exposure with poor pneumatization, labyrinthine fistula, cholesteatoma that cannot be cleared, an only hearing ear, or an unreliable follow-up. [[src|Myers Ch. 134]] [[src|ENT Secrets Ch. 39]]',
                        ] },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why is the facial nerve at risk from a standard postauricular incision in a newborn?', a: 'There is no mastoid process, so the nerve leaves the stylomastoid foramen onto the lateral skull surface, just beneath the incision.' },
                { t: 'check', id: 'c2', q: 'When does the mastoid process start to form, and from what part of the bone does the tip arise?', a: 'After the first year of life, growing laterally and inferiorly; the tip arises from the petrous part of the mastoid.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q83', 'ear-anatomy:q84'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ma-peds'] }],
            ref: [],
        },
    ],
};
