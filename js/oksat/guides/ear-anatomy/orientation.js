/* =============================================================
   Orientation and the temporal bone frame
   OKSAT · Interactive learning · ear-anatomy · chapter 1
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'orientation',
    title: 'Orientation and the temporal bone frame',
    kicker: '1 · Orientation',
    review: 'draft',
    lede: 'Before naming anything, know which ear you are looking at, from which side, and which bone builds the wall in front of you.',
    src: 'Cummings Review Ch. 2 · Glasscock Ch. 2 · Handbook Ch. 3',
    tldr: [
        'Call the side from the drum: the manubrium runs from the lateral process **posteroinferiorly** to the umbo; the **cone of light** is anteroinferior (5 o\'clock right, 7 o\'clock left).',
        'Temporal bone parts: **squamous, tympanic, mastoid, petrous** (± styloid). Squama above and behind the canal, tympanic bone in front and below, petrosa medially.',
        'Seams carry nerves: **tympanomastoid** suture (Arnold nerve), **petrotympanic** fissure (chorda, anterior malleal ligament, anterior tympanic artery).',
        'Compartments are planes off the drum: **epi-** above the tympanic spines, **meso-** behind the drum, **hypo-** below, **pro-** in front, **retro-** behind.',
    ],
    sections: [
        {
            id: 'or-views',
            n: '1.1',
            title: 'Views and laterality',
            blocks: [
                { t: 'p', x: 'Through a speculum you look medially and the patient\'s face is toward the anterior canal wall: in a **right ear** anterior is to your right, in a **left ear** to your left. The drum is a cone whose apex, the **umbo**, points medially, so the light reflex forms where the surface faces you, in the **anteroinferior** quadrant.' },
                { t: 'p', x: 'Two landmarks settle the side. The **manubrium** runs from the **lateral process** down and back to the umbo, and the **cone of light** fans out anteroinferiorly from the umbo. The same reading holds through a 0° endoscope; an angled scope or a rotated photograph moves the clock face but not the manubrium.' },
                {
                    t: 'hotspot',
                    id: 'or-views-hs',
                    alt: 'Two tympanic membranes without side labels, each divided into four quadrants by the line of the manubrium and its perpendicular through the umbo.',
                    label: 'Which ear? Then find the quadrants',
                    modes: ['find', 'explore'],
                    frames: [
                        { src: 'images/oksat/ear-anatomy/tm-quad-a.svg', cap: 'Frame A. Decide the side from the manubrium and the light reflex before you tap. Schematic.' },
                        { src: 'images/oksat/ear-anatomy/tm-quad-b.svg', cap: 'Frame B. Same task, other frame. Schematic.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**The handle points back.** Whatever the photograph does, the manubrium slopes posteriorly from top to bottom, and the light reflex points forward and down.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Frame A: which ear, and which landmark told you?', a: 'Right ear. The manubrium slopes down to the left (posterior is the viewer\'s left in a right ear) and the cone of light is at 5 o\'clock, anteroinferior.' },
                { t: 'check', id: 'c2', q: 'Which quadrant would you use for a myringotomy, and why that one in both frames?', a: 'Anteroinferior: in front of and below the umbo, over the protympanum, away from the ossicles and chorda (posterosuperior) and the round window and jugular bulb (posteroinferior).' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q1'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['or-views'] }],
            ref: [],
        },
        {
            id: 'or-parts',
            n: '1.2',
            title: 'The parts of the temporal bone and their seams',
            blocks: [
                { t: 'p', x: 'Cummings Review counts four portions: **squamous, petrous, tympanic** and **mastoid**. The squama forms the lateral wall of the middle fossa and the superior and posterosuperior canal; the **tympanic bone** forms the anterior, inferior and part of the posterior canal wall and the back wall of the glenoid fossa; the **mastoid** projects inferiorly behind the canal; the **petrosa** holds the inner ear and forms the medial wall of the middle ear, the tegmen and the carotid canal. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Seam', 'Between', 'What uses it'],
                    rows: [
                        ['**Tympanosquamous** suture', 'tympanic bone and squama, above the canal', 'superior vascular strip incision'],
                        ['**Tympanomastoid** suture', 'tympanic bone and mastoid, behind the canal', '**Arnold nerve**; posterior vascular strip incision'],
                        ['**Petrotympanic** (Glaserian) fissure', 'tympanic bone and petrosa, in the glenoid fossa', '**chorda tympani**, **anterior malleal ligament** with the anterior process, **anterior tympanic artery**'],
                        ['**Petrosquamous** suture', 'petrosa and squama', 'in the tegmen; laterally, the Körner septum in the mastoid'],
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'or-parts-hs',
                    alt: 'Right temporal bone in lateral view with the squama above, the zygomatic root running forward, the canal opening, the tympanic part curving in front of and below the canal, the mastoid behind and below, the styloid process, the two sutures, the temporal line, the spine of Henle and the Macewen triangle.',
                    modes: ['explore', 'find'],
                    frames: [{ src: 'images/oksat/ear-anatomy/temporal-bone-lateral.svg', cap: 'Right temporal bone, lateral view. The petrous part is medial and not seen from this side. Schematic.' }],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Surface landmarks of the deep',
                    blocks: [
                        { t: 'p', x: 'The **temporal line** approximates the floor of the middle fossa (within about 5 mm). The **Macewen triangle**, posterosuperior to the **spine of Henle**, overlies the antrum. [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Four parts or five: Glasscock\'s development chapter calls the temporal bone an amalgam of five bones including the styloid; its anatomy chapter and Cummings Review count four. Name the styloid process, then say whether you count it.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which bone forms the anterior wall of the bony canal, and which the posterosuperior wall?', a: 'Anterior: tympanic bone. Posterosuperior: squama.' },
                { t: 'check', id: 'c2', q: 'Name the nerve in the tympanomastoid suture and the nerve in the petrotympanic fissure.', a: 'Tympanomastoid: Arnold nerve (auricular branch of X). Petrotympanic: chorda tympani.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q3'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['or-parts'] }],
            ref: [],
        },
        {
            id: 'or-map',
            n: '1.3',
            title: 'The compartments as a map',
            blocks: [
                { t: 'p', x: 'Project the margins of the drum medially and the tympanic cavity divides into five spaces. The **epitympanum** lies above the plane of the anterior and posterior tympanic spines; planes from the annulus define the **mesotympanum** (behind the drum), **hypotympanum** (below), **protympanum** (in front, around the Eustachian tube) and the **retrotympanum** (behind; Glasscock\'s posterior tympanic cavity). [[src|Glasscock Ch. 2]]' },
                {
                    t: 'layers',
                    id: 'or-map-ly',
                    alt: 'A rectangle for the tympanic cavity in lateral view with the drum as a dashed oval; dashed lines through the drum margins divide it into five compartments.',
                    base: 'images/oksat/ear-anatomy/compartments-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'epi', label: 'Epitympanum', src: 'images/oksat/ear-anatomy/compartments-epi.svg' },
                        { id: 'meso', label: 'Mesotympanum', src: 'images/oksat/ear-anatomy/compartments-meso.svg' },
                        { id: 'hypo', label: 'Hypotympanum', src: 'images/oksat/ear-anatomy/compartments-hypo.svg' },
                        { id: 'pro', label: 'Protympanum', src: 'images/oksat/ear-anatomy/compartments-pro.svg' },
                        { id: 'retro', label: 'Retrotympanum', src: 'images/oksat/ear-anatomy/compartments-retro.svg' },
                    ],
                    on: ['meso'],
                    cap: 'Right ear, lateral view. Switch each compartment on and say what it contains before you read on. Schematic, not to scale.',
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the map matters',
                    blocks: [
                        { t: 'p', x: 'An otoscope sees the mesotympanum through the drum. The three spaces it cannot see, the epitympanum, the retrotympanum and the anterior protympanum, are where cholesteatoma hides and where the later chapters spend their time.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'A pars flaccida retraction opens into which compartment?', a: 'The epitympanum (Prussak space), above the plane of the tympanic spines.' },
                { t: 'check', id: 'c2', q: 'Name the five compartments and the boundary of each.', a: 'Epitympanum above the tympanic spines; mesotympanum medial to the pars tensa; hypotympanum below the inferior annulus; protympanum in front of the anterior annulus; retrotympanum behind the posterior annulus.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q4'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['or-map'] }],
            ref: [],
        },
    ],
};
