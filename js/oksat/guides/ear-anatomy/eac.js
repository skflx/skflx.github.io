/* =============================================================
   The external auditory canal
   OKSAT · Interactive learning · ear-anatomy · chapter 3
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'eac',
    title: 'The external auditory canal',
    kicker: '3 · Outer ear',
    review: 'draft',
    lede: 'A short S-shaped tube, cartilage outside and bone inside, lined by skin that changes character at the junction, with two natural gaps toward the parotid and joint, and three nerves that make it the most referred-to skin in the head.',
    src: 'Glasscock Ch. 1–2 · Cummings Review Ch. 2 · Handbook Ch. 3',
    tldr: [
        'About **2.5 cm** long: lateral third **cartilaginous**, medial two thirds **bony**; the **isthmus**, the narrowest point, lies just medial to the junction.',
        'Cartilaginous skin: thick, hair, sebaceous and cerumen glands. Bony skin: thin, no adnexa, **directly on periosteum**.',
        'Walls: squama superior and posterosuperior, tympanic bone anterior, inferior and posteroinferior. **Tympanosquamous** and **tympanomastoid** sutures guide the vascular strip.',
        'Gaps to the parotid and TMJ: **fissures of Santorini** (cartilage) and a patent **foramen of Huschke** (anteroinferior bone).',
        'Sensation: anterior and superior walls V3; posterior and inferior walls **Arnold** (X) and VII (**Hitselberger** sign).',
    ],
    sections: [
        {
            id: 'eac-seg',
            n: '3.1',
            title: 'Segments and course',
            blocks: [
                { t: 'p', x: 'The canal runs about **2.5 cm** from the concha to the drum. Its lateral third continues the cartilage of the pinna; its medial two thirds are bone. The **isthmus**, its narrowest point, lies just medial to the bony-cartilaginous junction. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                { t: 'p', x: 'The adult canal is S-shaped: pull the auricle **up and back** to straighten it. The infant canal has almost no bony segment, because the tympanic ring grows laterally only after birth, so pull **down and back**. The drum sets obliquely, so the anteroinferior canal wall is longer than the posterosuperior. [[src|Glasscock Ch. 1]]' },
                {
                    t: 'hotspot',
                    id: 'eac-seg-hs',
                    alt: 'Two sections of the right canal: coronal, showing cartilage, isthmus, bony canal and drum with dura above and parotid below; axial, showing the parotid and temporomandibular joint in front, the anterior bony overhang, the anterior tympanomeatal recess, a patent foramen of Huschke, and mastoid cells behind.',
                    modes: ['explore', 'find'],
                    frames: [
                        { src: 'images/oksat/ear-anatomy/eac-coronal.svg', cap: 'Coronal section, seen from the front; lateral to the left. Schematic, not to scale.' },
                        { src: 'images/oksat/ear-anatomy/eac-axial.svg', cap: 'Axial section, seen from below as on CT; lateral to the left, anterior up. Schematic, not to scale.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Where is the narrowest point of the canal?', a: 'The isthmus, just medial to the bony-cartilaginous junction.' },
                { t: 'check', id: 'c2', q: 'Why is the anteroinferior canal wall longer than the posterosuperior?', a: 'The drum is set obliquely: its anteroinferior margin is further medial, so the anterior and inferior walls run deeper before they reach it.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q15', 'ear-anatomy:q16'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['eac-seg'] }],
            ref: [],
        },
        {
            id: 'eac-skin',
            n: '3.2',
            title: 'Skin and adnexa',
            blocks: [
                {
                    t: 'table',
                    head: ['', 'Cartilaginous canal', 'Bony canal'],
                    rows: [
                        ['Skin', 'Thick, with a subcutaneous layer', 'Very thin, no subcutis, directly on periosteum'],
                        ['Adnexa', 'Hair follicles, sebaceous and cerumen glands', 'None'],
                        ['Clinical', 'Furuncles; injection easy', 'Tears and bleeds easily; very pain-sensitive; injection raises a bleb'],
                    ],
                },
                { t: 'p', x: 'Bony canal skin is among the thinnest in the body, with no subcutis, and lies directly on periosteum. Hair marks the cartilaginous canal. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 2]]' },
                { t: 'p', x: 'Medial to the isthmus the **anterior bony overhang** bulges back, and behind it the **anterior tympanomeatal recess** forms the deep, acute angle between the anterior canal wall and the drum: the least visible point of the canal, where debris and grafts both go wrong. Keratin migrates from the centre of the drum outward and then laterally along the canal, which is why the canal cleans itself.' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'Over-aggressive anterior canalplasty can open the temporomandibular joint into the canal (Glasscock). Respect the overhang; remove it to see the anterior annulus, not more.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why does an injection under bony canal skin hurt more and raise a tight bleb?', a: 'The cartilaginous canal: only it has hair follicles and glands.' },
                { t: 'check', id: 'c2', q: 'Where is the anterior tympanomeatal recess, and why does it matter?', a: 'The acute angle between the anterior bony canal wall and the drum, behind the anterior overhang; it hides debris and is where an anterior graft can blunt or lateralize.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q17'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['eac-skin'] }],
            ref: [],
        },
        {
            id: 'eac-walls',
            n: '3.3',
            title: 'Walls and sutures',
            blocks: [
                { t: 'p', x: 'The **squama** forms the superior and posterosuperior bony canal; the **tympanic bone** the anterior, inferior and posteroinferior walls. They meet at two sutures you can see through a speculum after infiltration: the **tympanosquamous** suture above and the **tympanomastoid** suture behind. The skin is anchored along both, so well-placed local anesthetic outlines them, and elevating over them often needs sharp division of the periosteum. They are the landmarks for the **vascular strip** incisions. [[src|Glasscock Ch. 2]]' },
                { t: 'p', x: '**Arnold nerve** emerges through the tympanomastoid suture. Followed deep and down, the suture leads toward the **stylomastoid foramen**, which is why parotid surgeons use it as a pointer to the facial nerve trunk.' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: '**Henle spine** marks the posterosuperior canal margin and the anterior limit of drilling in a canal wall up mastoidectomy. A prominent tympanosquamous spur narrows the canal and can be taken down.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which two sutures bound the vascular strip?', a: 'The tympanosquamous suture (superior) and the tympanomastoid suture (posterior).' },
                { t: 'check', id: 'c2', q: 'Which nerve leaves through the tympanomastoid suture, and what does the suture point to in parotid surgery?', a: 'Arnold nerve. Deeply, the suture points toward the stylomastoid foramen and the facial nerve trunk.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q18'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['eac-walls'] }],
            ref: [],
        },
        {
            id: 'eac-gaps',
            n: '3.4',
            title: 'Dehiscences: Santorini and Huschke',
            blocks: [
                { t: 'p', x: 'Two or three **fissures of Santorini** perforate the anterior cartilaginous canal; they let disease reach the superficial parotid. The **foramen of Huschke** is a defect in the anteroinferior bony wall; it normally closes, and if patent it opens toward the deep parotid and the temporomandibular joint. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the ring leaves a hole',
                    blocks: [
                        { t: 'p', x: 'At birth the tympanic bone is a flat, open ring. As it grows laterally into a tube, opposing spurs on its anterior and inferior aspect meet around age 1 and divide the opening into the canal above and a smaller channel below, the foramen of Huschke, which then closes. [[src|Glasscock Ch. 1]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Timing of closure: many texts say by about age 5; Glasscock (after Anson) says late childhood. Either way it persists into adulthood in a minority.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Necrotizing otitis externa reaches the parotid through which routes?', a: 'The fissures of Santorini (cartilaginous canal, to the superficial parotid) and a patent foramen of Huschke (bony canal, to the deep parotid and the TMJ), and along the bony-cartilaginous junction.' },
                { t: 'check', id: 'c2', q: 'Explain the foramen of Huschke from development.', a: 'The tympanic ring grows laterally; spurs on its anterior and inferior aspect fuse around age 1 and leave a channel below the canal that normally closes later in childhood.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q19'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['eac-gaps'] }],
            ref: [],
        },
        {
            id: 'eac-rel',
            n: '3.5',
            title: 'Relations in six directions',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        ['Anterior', 'Temporomandibular joint (glenoid fossa) and parotid'],
                        ['Posterior', 'Mastoid air cells; the mastoid facial nerve deep to the posterior canal near the annulus'],
                        ['Superior', 'Epitympanum and middle fossa dura'],
                        ['Inferior', 'Parotid and the styloid process'],
                        ['Medial', 'Tympanic membrane'],
                        ['Lateral', 'Cartilaginous canal and concha'],
                    ],
                },
                { t: 'p', x: 'Two relations explain common complaints. Disease of the TMJ and the molars refers pain to the ear through V3. And in its lower course the mastoid facial nerve lies **lateral** to the tympanic annulus, so it is at risk in deep posterior canal surgery. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                { t: 'neighbors', id: 'eac-rel-nb', g: 'eac-bony', label: 'Name the neighbours of the bony canal' },
                { t: 'check', id: 'c1', q: 'Which joint lies directly in front of the bony canal, and what symptom links them?', a: 'The temporomandibular joint; pain on chewing in otitis externa, and otalgia referred from the TMJ.' },
                { t: 'check', id: 'c2', q: 'Why is the facial nerve at risk in deep posterior canal surgery?', a: 'Near the stylomastoid foramen the mastoid segment lies lateral to the plane of the annulus, just deep to the posteroinferior canal wall.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q20'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['eac-rel'] }],
            ref: [],
        },
        {
            id: 'eac-nerve',
            n: '3.6',
            title: 'Innervation, supply and self-cleaning',
            blocks: [
                {
                    t: 'table',
                    head: ['Wall', 'Sensory nerve', 'Clinical'],
                    rows: [
                        ['Anterior and superior', '**Auriculotemporal** (V3)', 'Referred pain from TMJ and molars'],
                        ['Posterior and inferior', '**Arnold** (X) and facial nerve sensory fibres', 'Arnold reflex (cough); **Hitselberger sign** (posterior canal numbness with a cerebellopontine angle tumor)'],
                    ],
                },
                { t: 'p', x: 'The facial nerve carries somatic sensory fibres from the posterior canal and conchal skin. Arteries: the posterior auricular and superficial temporal arteries, and the **deep auricular artery** (maxillary) to the bony canal and lateral drum. [[src|Cummings Review Ch. 2]] [[src|Handbook Ch. 3]]' },
                { t: 'check', id: 'c1', q: 'What is the Hitselberger sign and which nerve does it test?', a: 'Hypesthesia of the posterior canal wall from a cerebellopontine angle tumor; it tests the sensory fibres of the facial nerve.' },
                { t: 'check', id: 'c2', q: 'Touching the posterior canal causes a cough. Name the reflex and its afferent nerve.', a: 'Arnold reflex; auricular branch of the vagus (Arnold nerve).' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q21'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['eac-nerve'] }],
            ref: [],
        },
    ],
};
