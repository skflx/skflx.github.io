/* =============================================================
   The systems, gathered
   OKSAT · Interactive learning · ear-anatomy · chapter 12
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'synthesis',
    title: 'The systems, gathered',
    kicker: '12 · Synthesis',
    review: 'draft',
    lede: 'The earlier chapters met each nerve, vessel and embryologic origin where it crosses a wall. This chapter lines them up by system: the facial nerve end to end, the three parasympathetic routes, where ear pain comes from, the arterial companions, the embryology table, and a relationship gauntlet.',
    src: 'Cummings Review Ch. 2 · Glasscock Ch. 1–2 · Handbook Ch. 3 · chapters 1–10 of this guide',
    tldr: [
        'The facial nerve runs meatal, **labyrinthine**, **geniculate** (greater petrosal nerve), tympanic, **second genu**, mastoid, stylomastoid foramen. Three branches arise inside the bone: greater petrosal nerve, nerve to stapedius, chorda tympani, in that order.',
        'A lesion localizes by what is lost downstream: tears (before the geniculate ganglion), stapedial reflex (before the nerve to stapedius), taste (before the chorda), then motor alone.',
        'The labyrinthine segment is the narrowest and shortest stretch, wholly in bone, with the poorest intrinsic blood supply, between two arterial territories.',
        'Three parasympathetic routes: greater petrosal nerve to the lacrimal and nasal glands; Jacobson to lesser petrosal nerve to the parotid; chorda to the submandibular and sublingual glands.',
        'Ear pain with a normal ear is referred along V3, VII, IX, X or C2–C3. Embryology explains the gaps, the muscles and the vessels; the gauntlet drills the six-direction relations.',
    ],
    sections: [
        {
            id: 'sy-fn',
            n: '12.1',
            title: 'The facial nerve, whole intratemporal course',
            blocks: [
                { t: 'p', x: 'The nerve crosses the temporal bone in seven stations. You met the tympanic segment on the medial wall and the mastoid segment behind the facial recess; this section strings them together with the part you never see, the labyrinthine segment, and adds what each station gives off and what feeds it. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Station', 'Length', 'Landmark', 'Gives off', 'Blood supply'],
                    rows: [
                        ['**Meatal** (internal auditory canal)', '8–10 mm [[src|Cummings Review Ch. 2]]', 'Anterosuperior quadrant at the fundus, with the nervus intermedius', 'Nothing', 'Labyrinthine artery [[src|Glasscock Ch. 2]]'],
                        ['**Labyrinthine**', '3–5 mm [[src|Cummings Review Ch. 2]]', 'Fundus to geniculate ganglion, between cochlea and vestibule; narrowest part of the canal', 'Nothing', 'Between two territories; intrinsic network poorest [[src|Glasscock Ch. 2]]'],
                        ['**Geniculate ganglion** (first genu)', 'Short bend', 'Dehiscent in 10–20% [[src|Cummings Review Ch. 2]]', '**Greater petrosal nerve**, out by the facial hiatus', 'Superficial petrosal artery'],
                        ['**Tympanic**', '10–12 mm [[src|Cummings Review Ch. 2]]', 'Above the cochleariform process and oval window; dehiscent in 25–55% [[src|Cummings Review Ch. 2]]', 'Nothing', 'Intrinsic network well developed [[src|Glasscock Ch. 2]]'],
                        ['**Second genu**', 'Short bend', 'Below the lateral canal, medial to the short process of the incus', 'Nothing', 'As the mastoid segment'],
                        ['**Mastoid**', '12–15 mm [[src|Cummings Review Ch. 2]]', 'Behind the pyramid, deep to the facial ridge', '**Nerve to stapedius** near the pyramid; **chorda tympani** about 4 mm above the foramen [[src|Glasscock Ch. 2]]', 'Superficial petrosal artery above, **stylomastoid artery** below [[src|Glasscock Ch. 2]]'],
                        ['**Stylomastoid foramen**', 'Exit', 'Anterior end of the digastric ridge; posterior belly of digastric around it', 'Branches to the face and digastric', 'Stylomastoid artery'],
                    ],
                    wide: true,
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Segment lengths differ by source. Labyrinthine: 3–5 mm (Cummings Review), about 4 mm (Glasscock), 4.28 mm in 30 dissected bones. Tympanic: 10–12 mm, about 13 mm, 10.40 mm. Mastoid: 12–15 mm, about 20 mm, 12.34 mm. The intracranial segment is 14–17 mm in one text and 24 mm in the other. None of the sources explains the gap, so learn the order and the landmarks, not a remembered length. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]] [[src|Indian J Otolaryngol Head Neck Surg 2021]]' },
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'sy-fn-hs',
                    alt: 'The facial nerve of the right ear in lateral projection: meatal segment dashed at the top, labyrinthine segment running forward to the geniculate ganglion with the greater petrosal nerve, the tympanic segment running back above the oval window to the second genu, the mastoid segment descending to the stylomastoid foramen, the nerve to stapedius, the chorda tympani, and three arteries in red.',
                    label: 'Trace it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/facial-nerve-course.svg',
                            cap: 'Right ear, lateral projection, anterior to the right, superior up; segment lengths not to scale. The meatal segment lies deep and medial. The dashed ring marks the watershed zone between the labyrinthine artery (from the anterior inferior cerebellar artery) and the superficial petrosal artery. Explore first, then Find. Schematic.',
                            regions: [{ g: 'fn-meatal' }, { g: 'fn-lab' }, { g: 'geniculate' }, { g: 'gspn' }, { g: 'fn-tymp' }, { g: 'genu2' }, { g: 'fn' }, { g: 'nstap' }, { g: 'chorda' }, { g: 'smf' }, { g: 'labyr-a' }, { g: 'suppetr-a' }, { g: 'stylomast-a' }],
                        },
                    ],
                },
                {
                    t: 'sequence',
                    id: 'sy-fn-seq',
                    q: 'Order the intratemporal course of the facial nerve, from the brainstem side outward.',
                    items: ['Meatal segment in the internal auditory canal', 'Labyrinthine segment', 'Geniculate ganglion at the first genu', 'Tympanic segment above the oval window', 'Second genu below the lateral canal', 'Mastoid segment', 'Stylomastoid foramen'],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the labyrinthine segment is the weak point',
                    blocks: [
                        { t: 'p', x: 'The canal narrows to its smallest at the fundus, the **meatal foramen**, and the labyrinthine segment beyond it is wholly enclosed in bone, so swelling has nowhere to go. In Bell palsy the nerve is compressed here, and conduction studies show reduced responses distal to the foramen. The intrinsic vascular network is poorest in this segment, and Cummings Review describes the geniculate region as a watershed between the branches of the external carotid artery and the posterior circulation. The first genu is also tethered by the greater petrosal nerve, which makes it vulnerable to shearing in temporal bone fracture. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                {
                    t: 'p',
                    x: 'Lesion localizer: work out what each branch carries, then ask which branches the lesion is upstream of. The greater petrosal nerve carries tear and nasal secretion; the nerve to stapedius carries the stapedial reflex; the chorda carries taste from the anterior two thirds of the tongue and salivary secretion. Cummings Review lists the tear, taste, salivary and reflex tests as topodiagnostic tests of historical value only; the logic still tests anatomy. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]',
                },
                { t: 'check', id: 'c1', q: 'A complete lesion proximal to the geniculate ganglion, in the labyrinthine or meatal segment: what is lost?', a: 'Everything downstream: tearing (greater petrosal nerve), the stapedial reflex (nerve to stapedius), taste on the anterior two thirds of the tongue and salivation (chorda), and facial motor function. Lesions proximal to the ganglion may also take hearing and balance, because the nerve runs with VIII in the internal auditory canal.' },
                { t: 'check', id: 'c2', q: 'A lesion in the vertical mastoid segment between the origin of the nerve to stapedius and the origin of the chorda: what is lost, and what is spared?', a: 'Lost: facial motor function, and taste and salivation (the chorda arises below the lesion\'s level, so its fibres are cut off). Spared: tearing (the greater petrosal nerve left at the geniculate ganglion) and the stapedial reflex (the nerve to stapedius left higher up).' },
                { t: 'check', id: 'c3', q: 'A lesion at the stylomastoid foramen or just outside it: what is lost?', a: 'Facial motor function only. The greater petrosal nerve, nerve to stapedius and chorda have all left; the chorda usually separates about 4 mm above the foramen.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q121', 'ear-anatomy:q124'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['sy-fn'] }],
        },
        {
            id: 'sy-para',
            n: '12.2',
            title: 'Parasympathetic routes',
            blocks: [
                { t: 'p', x: 'Three parasympathetic routes pass through the ear, two of them through the middle ear itself. Each has the same plan: a preganglionic nerve leaves a brainstem nucleus, runs a bony course, relays in a ganglion, and ends in a gland. The facial nerve carries fibres from the superior salivatory nucleus to the lacrimal gland, the nasal mucosa and the submandibular and sublingual glands; Jacobson nerve carries the glossopharyngeal fibres. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Route', 'Starts', 'Leaves the ear by', 'Relay', 'Target'],
                    rows: [
                        ['**Greater petrosal nerve**', 'Geniculate ganglion (VII)', 'Facial hiatus, on the middle fossa floor', 'Pterygopalatine ganglion', 'Lacrimal gland, nasal mucosa'],
                        ['**Jacobson to lesser petrosal nerve**', 'Inferior tympanic canaliculus (IX)', 'Tympanic plexus, then the lesser petrosal nerve in the superior tympanic canaliculus', 'Otic ganglion', 'Parotid gland, by the auriculotemporal nerve'],
                        ['**Chorda tympani**', 'Mastoid facial nerve (VII)', 'Canal of Huguier and petrotympanic fissure', 'Submandibular ganglion', 'Submandibular and sublingual glands; taste, anterior two thirds of the tongue'],
                    ],
                    wide: true,
                },
                {
                    t: 'sequence',
                    id: 'para-gspn',
                    q: 'Order the greater petrosal route to the tear gland.',
                    items: ['Superior salivatory nucleus, in the nervus intermedius', 'Greater petrosal nerve, leaving the geniculate ganglion', 'Facial hiatus on the middle fossa floor', 'Foramen lacerum', 'Vidian nerve (nerve of the pterygoid canal)', 'Pterygopalatine ganglion', 'Lacrimal gland and nasal mucosa'],
                },
                {
                    t: 'sequence',
                    id: 'para-lpn',
                    q: 'Order the route from Jacobson nerve to the parotid gland.',
                    items: ['Jacobson nerve, entering by the inferior tympanic canaliculus', 'Tympanic plexus on the promontory, joined by sympathetic fibres', 'Lesser petrosal nerve, leaving along the tensor semicanal', 'Middle fossa floor and foramen ovale', 'Otic ganglion', 'Auriculotemporal nerve', 'Parotid gland'],
                },
                {
                    t: 'sequence',
                    id: 'para-chorda',
                    q: 'Order the chorda tympani route to the salivary glands.',
                    items: ['Mastoid facial nerve, just above the stylomastoid foramen', 'Canal of the chorda, to the iter chordae posterius', 'Across the middle ear, medial to the malleus and lateral to the incus', 'Canal of Huguier and petrotympanic fissure', 'Lingual nerve', 'Submandibular ganglion', 'Submandibular and sublingual glands'],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Where the sources stop',
                    blocks: [
                        { t: 'p', x: 'The ranked sources give the starts and the targets of these routes, the facial hiatus, the tympanic plexus, the superior tympanic canaliculus beside the greater petrosal nerve, and the chorda courses. The deeper waypoints (foramen lacerum, vidian nerve, foramen ovale, the three ganglia and the lingual nerve) are standard anatomy that the ranked sources do not spell out. Check them against an anatomy text when the owner reviews this section. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the gland or glands each of the three routes supplies.', a: 'Greater petrosal nerve: lacrimal gland and nasal mucosa. Jacobson to lesser petrosal nerve: parotid. Chorda: submandibular and sublingual glands (and it carries taste).' },
                { t: 'check', id: 'c2', q: 'Which route also carries taste, and from where?', a: 'The chorda tympani: taste from the anterior two thirds of the tongue, to the solitary nucleus by way of the facial nerve.' },
                { t: 'check', id: 'c3', q: 'On the middle fossa floor, which runs more laterally: the greater petrosal nerve or the lesser petrosal nerve?', a: 'The lesser petrosal nerve, in its own canal, lateral to and parallel with the greater petrosal nerve toward the apex.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q127', 'ear-anatomy:q128'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['sy-para'] }],
        },
        {
            id: 'sy-sensory',
            n: '12.3',
            title: 'Sensation and referred otalgia',
            blocks: [
                { t: 'p', x: 'The ear is supplied by branches of four cranial nerves and two cervical roots, and each of them also supplies something else. Pain in an ear with a normal examination usually comes from that something else, along the shared nerve. Tracing the pain home is a matter of knowing which nerve touches the ear where. [[src|Glasscock Ch. 2]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'table',
                    head: ['Nerve', 'In the ear', 'Elsewhere', 'Source'],
                    rows: [
                        ['**V3** (auriculotemporal)', 'Tragus, anterior and superior canal, drum', 'Temporomandibular joint, molar teeth, oral cavity', 'Glasscock Ch. 2 names the joint and molars; Handbook Ch. 3 lists joint disease as a common adult cause'],
                        ['**VII** (sensory branch)', 'Posterior canal and concha', 'Zoster oticus (Ramsay Hunt) gives severe otalgia with vesicles', 'Cummings Review Ch. 2; Handbook Ch. 3'],
                        ['**IX** (Jacobson nerve)', 'Middle ear, by the tympanic plexus', 'Pharynx: tonsil, tongue base, nasopharynx', 'Glasscock Ch. 2 for the pharynx'],
                        ['**X** (Arnold nerve)', 'Posterior canal and part of the drum', 'Larynx and hypopharynx', 'Standard teaching; Glasscock Ch. 2 names the nerve only'],
                        ['**C2–C3** (great auricular, lesser occipital)', 'Lobule, posterior auricle', 'Cervical spine', 'Standard teaching'],
                    ],
                    wide: true,
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'Otalgia with a normal ear needs the whole route examined: teeth and joint (V3), tonsil and tongue base (IX), larynx (X), neck (C2–C3). In an adult with one-sided otalgia or a middle ear effusion, the nasopharynx goes on the list. [[src|Handbook Ch. 3]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'An adult has otalgia, a normal ear and a firm tonsillar mass. Which nerve carries the pain to the ear, and where does it reach the ear?', a: 'The glossopharyngeal nerve, through Jacobson nerve and the tympanic plexus on the promontory.' },
                { t: 'check', id: 'c2', q: 'Why do molar disease and temporomandibular dysfunction both present as ear pain?', a: 'Shared innervation by V3 (the auriculotemporal nerve supplies the anterior canal and drum), and the joint lies immediately in front of the canal.' },
                { t: 'check', id: 'c3', q: 'List the five nerve routes by which pain from elsewhere can reach the ear.', a: 'V3, VII, IX (Jacobson), X (Arnold), and the cervical roots C2–C3.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q130', 'ear-anatomy:q131'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['sy-sensory'] }],
        },
        {
            id: 'sy-arteries',
            n: '12.4',
            title: 'Arterial companions',
            blocks: [
                { t: 'p', x: 'Every artery to the ear travels with a nerve or a ligament through a named opening, so the aperture tells you the artery. Most come from the external carotid system; the stapedial artery and the carotid wall explain the exceptions. [[src|Glasscock Ch. 1]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Artery', 'Parent', 'Opening and companion', 'Territory'],
                    rows: [
                        ['**Anterior tympanic**', 'Maxillary (external carotid system)', 'Petrotympanic fissure, with the anterior malleal ligament', 'Drum, ossicles'],
                        ['**Deep auricular**', 'Maxillary', 'Through the canal wall', 'Bony canal and lateral drum'],
                        ['**Posterior tympanic**', 'Stylomastoid artery', 'Iter chordae posterius, with the chorda', 'Drum, ossicles, posterior cavity'],
                        ['**Stylomastoid**', 'Posterior auricular', 'Stylomastoid foramen, with the facial nerve', 'Lower mastoid segment of the nerve, mastoid'],
                        ['**Inferior tympanic**', 'Ascending pharyngeal', 'Inferior tympanic canaliculus, with Jacobson nerve', 'Floor and promontory; a main feeder of tympanic paraganglioma'],
                        ['**Superior tympanic**', 'Middle meningeal', 'Superior tympanic canaliculus, with the lesser petrosal nerve', 'Roof, tensor region'],
                        ['**Superficial petrosal**', 'Middle meningeal', 'Facial hiatus, with the greater petrosal nerve', 'Geniculate ganglion, upper mastoid segment'],
                        ['**Caroticotympanic**', 'Internal carotid', 'Caroticotympanic canaliculi in the carotid wall, with the caroticotympanic nerves', 'Anterior wall, promontory'],
                    ],
                    wide: true,
                },
                { t: 'p', x: 'Sources for the table: Glasscock for the stylomastoid artery from the posterior auricular, the inferior tympanic from the ascending pharyngeal and its role in paraganglioma, the superior tympanic as a branch of the middle meningeal artery, and the caroticotympanic as a branch of the carotid; Glasscock and Cummings Review for the superficial petrosal supply. Parents of the anterior and posterior tympanic and the deep auricular are given as in the ear canal and cavity chapters. [[src|Glasscock Ch. 1]] [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        { h: 'Great vessels', blocks: [{ t: 'ul', items: ['**Internal carotid artery**: anteromedial to the protympanum and the bony tube, behind a thin shell.', '**Jugular bulb**: under the floor of the cavity.', '**Sigmoid sinus**: behind the mastoid air cells.'] }] },
                        { h: 'Variants to recognize', blocks: [{ t: 'ul', items: ['High or dehiscent jugular bulb', 'Persistent stapedial artery', 'Aberrant carotid artery', 'Anterior sigmoid sinus; low tegmen; Körner septum', 'Facial canal dehiscence'] }] },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which artery enters the inferior tympanic canaliculus, with which nerve, and why does it matter for tumours?', a: 'The inferior tympanic artery (from the ascending pharyngeal), with Jacobson nerve; it is an important feeder of tympanic paragangliomas.' },
                { t: 'check', id: 'c2', q: 'Which artery supplies the geniculate ganglion and the upper mastoid segment of the facial nerve, and which supplies the lower mastoid segment?', a: 'Superficial petrosal artery above; stylomastoid artery below.' },
                { t: 'check', id: 'c3', q: 'Which adult artery is the remnant of the distal stapedial artery, and which parent does it come from?', a: 'The superior tympanic artery, a branch of the middle meningeal artery.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q133', 'ear-anatomy:q135'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['sy-arteries'] }],
        },
        {
            id: 'sy-dev',
            n: '12.5',
            title: 'Embryology table',
            blocks: [
                { t: 'p', x: 'Five sources build the ear, and the anatomy you have learned follows them: the two arches, the first cleft, the first pouch and the otic capsule. This table uses the board version taught in the auricle and ossicle chapters; the appraisal chapter returns to where it is contested. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 1]]' },
                {
                    t: 'table',
                    head: ['Source', 'Builds', 'Supply'],
                    rows: [
                        ['**First arch** (Meckel cartilage)', 'Malleus head and neck, incus body and short process; tensor tympani; hillocks 1–3 (tragus, helical crus, helix)', 'V3'],
                        ['**Second arch** (Reichert cartilage)', 'Manubrium, incus long process, stapes superstructure; stapedius; hillocks 4–6 (antihelix, antitragus, lobule)', 'VII'],
                        ['**First cleft**', 'Ear canal; outer layer of the drum', 'Auriculotemporal, Arnold, VII'],
                        ['**First pouch**', 'Eustachian tube, middle ear lining; inner layer of the drum', 'Jacobson (IX)'],
                        ['**Otic capsule**', 'Footplate (vestibular surface), annular ligament, inner ear', 'VIII'],
                    ],
                    wide: true,
                },
                {
                    t: 'kv',
                    rows: [
                        ['Notch of Rivinus', 'The tympanic ring fuses except at the top, so the superior sulcus is open; no annulus there, hence the pars flaccida. [[src|Glasscock Ch. 1]]'],
                        ['Foramen of Huschke', 'Spurs of the ring fuse and leave a channel in the anteroinferior bony wall that normally closes later in childhood. [[src|Glasscock Ch. 2]]'],
                        ['Superficial neonatal facial nerve', 'There is no mastoid process at birth, so the nerve leaves the stylomastoid foramen on the lateral skull and a standard postauricular incision can reach it. [[src|Glasscock Ch. 1]]'],
                        ['Tensor V3, stapedius VII', 'Each muscle keeps the nerve of its arch: tensor tympani and tensor veli palatini V3, stapedius VII.'],
                        ['Persistent stapedial artery', 'The second-arch artery normally regresses; if it persists it runs through the obturator foramen of the stapes. [[src|Glasscock Ch. 1]]'],
                        ['Atresia with a normal inner ear', 'The meatal plug and the arch derivatives can fail while the otic capsule, which has a separate origin, forms normally.'],
                    ],
                },
                { t: 'check', id: 'c1', q: 'Give the nerve and arch of the tensor tympani and of the stapedius.', a: 'Tensor tympani: V3, first arch. Stapedius: VII, second arch.' },
                { t: 'check', id: 'c2', q: 'Why can a child have canal atresia with a normal inner ear?', a: 'The canal and the arch derivatives form from the cleft, plug and arches; the otic capsule has a separate origin and develops normally.' },
                { t: 'check', id: 'c3', q: 'Why is the facial nerve exposed under a standard postauricular incision in a newborn?', a: 'The mastoid process has not formed, so the nerve leaves the stylomastoid foramen onto the lateral skull surface.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q137', 'ear-anatomy:q138'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['sy-dev'] }],
        },
        {
            id: 'sy-gauntlet',
            n: '12.6',
            title: 'Relationship gauntlet',
            blocks: [
                { t: 'p', x: 'Four paths through the ear, each in the order a surgeon meets the structures. Put each path in order, then draw the three blind-draw prompts from memory against the answer key.' },
                {
                    t: 'sequence',
                    id: 'gl-ps',
                    q: 'Lateral to medial through the posterosuperior quadrant of the drum.',
                    items: ['Skin of the bony canal and the posterosuperior annulus', 'Pars tensa of the drum', 'Chorda tympani', 'Incus long process and incudostapedial joint', 'Stapes crura and footplate in the oval window', 'Vestibule'],
                },
                {
                    t: 'sequence',
                    id: 'gl-cor',
                    q: 'Superior to inferior in a coronal plane through the oval window.',
                    items: ['Middle fossa dura', 'Tegmen tympani', 'Lateral semicircular canal prominence', 'Tympanic facial nerve', 'Oval window and stapes', 'Floor of the hypotympanum', 'Jugular bulb'],
                },
                {
                    t: 'sequence',
                    id: 'gl-ap',
                    q: 'Posterior to anterior at the level of the mesotympanum.',
                    items: ['Retrofacial air cells', 'Mastoid facial nerve', 'Pyramidal eminence', 'Oval window and stapes', 'Cochleariform process and tensor semicanal', 'Eustachian tube orifice', 'Internal carotid artery'],
                },
                {
                    t: 'sequence',
                    id: 'gl-deep',
                    q: 'Surface to depth, from Macewen triangle to the round window niche.',
                    items: ['Mastoid cortex in Macewen triangle', 'Antrum', 'Lateral semicircular canal, on the medial wall of the antrum', 'Short process of the incus in the aditus', 'Facial recess, opened by a posterior tympanotomy', 'Round window niche'],
                },
                { t: 'check', id: 'c1', q: 'Draw the medial wall of the tympanic cavity from memory, then score it.', a: 'Key: promontory with Jacobson nerve; oval window posterosuperior and round window posteroinferior; tympanic facial nerve above the oval window with the lateral canal above and behind it; cochleariform process at the anterior end with the geniculate ganglion anterosuperior; pyramidal eminence and ponticulus behind; subiculum behind the round window niche; sinus tympani between ponticulus and subiculum; finiculus in front of the round window niche.' },
                { t: 'check', id: 'c2', q: 'Draw the ossicular chain with its ligaments from memory, then score it.', a: 'Key: malleus head, neck, lateral and anterior processes, manubrium to the umbo; incus body, short, long and lenticular processes; stapes head, two crura, footplate; incudomallear and incudostapedial joints; superior malleal, anterior malleal, lateral malleal, superior incudal, posterior incudal and annular ligaments; axis of rotation from the anterior malleal to the posterior incudal ligament.' },
                { t: 'check', id: 'c3', q: 'Draw the whole intratemporal facial nerve from memory, then score it.', a: 'Key: meatal, labyrinthine, geniculate ganglion with the greater petrosal nerve, tympanic segment above the oval window, second genu below the lateral canal, mastoid segment with the nerve to stapedius and the chorda, stylomastoid foramen; labyrinthine artery, superficial petrosal artery and stylomastoid artery along it.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q141', 'ear-anatomy:q143'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['sy-gauntlet'] }],
        },
    ],
};
