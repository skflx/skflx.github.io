/* =============================================================
   The auricle
   OKSAT · Interactive learning · ear-anatomy · chapter 2
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'auricle',
    title: 'The auricle',
    kicker: '2 · Outer ear',
    review: 'draft',
    lede: 'One plate of elastic cartilage under tight skin, slung from the skull by muscles of the facial nerve, fed from two arteries, and supplied by five sensory nerves that explain both the blocks and the referred pain.',
    src: 'Glasscock Ch. 1–2 · Handbook Ch. 3 · Cummings Review Ch. 2',
    tldr: [
        'Landmarks: helix, scapha, antihelix and its two crura, triangular fossa, cymba and cavum conchae, tragus, antitragus, intertragic notch, **incisura terminalis**, lobule.',
        'No cartilage in the **lobule** or the **incisura terminalis** (the endaural incision). Lateral skin is bound tightly to perichondrium; cartilage lives off the perichondrium.',
        'Muscles: three extrinsic and six intrinsic, all **facial nerve** (second arch).',
        'Arteries: **superficial temporal** (anterior) and **posterior auricular** (medial, with perforators). Sensation: auriculotemporal (V3), great auricular, lesser occipital, **Arnold** (X) and VII; the last two reach the concha and canal from inside a ring block.',
        'Hillocks 1–3 first arch (tragus, helical crus, helix); 4–6 second arch; the 4–6 mapping is disputed.',
    ],
    sections: [
        {
            id: 'au-topo',
            n: '2.1',
            title: 'Topography',
            blocks: [
                { t: 'p', x: 'Read the lateral surface from the rim inward. The **helix** is the rim; it begins at the **helical crus**, which divides the concha into the **cymba** above and the **cavum** below; a small **helical spine** sits on the crus, and the **Darwin tubercle** on the posterosuperior helix. Inside the helix lies the **scapha**, then the **antihelix**, which splits into **superior** and **inferior crura** around the **triangular fossa**. Around the canal: **tragus** in front, **antitragus** behind and below, the **intertragic notch** between them, and the **incisura terminalis** between the tragus and the helical crus. The **lobule** hangs below.' },
                {
                    t: 'hotspot',
                    id: 'au-topo-hs',
                    alt: 'Right auricle in lateral view with sixteen tappable landmarks from the helix to the lobule.',
                    modes: ['explore', 'find'],
                    frames: [{ src: 'images/oksat/ear-anatomy/auricle-right.svg', cap: 'Right auricle, lateral view, face to the right. Use Find until every landmark comes first time. Schematic.' }],
                },
                { t: 'check', id: 'c1', q: 'Which structure divides the concha, and what are the two parts called?', a: 'The helical crus: cymba conchae above, cavum conchae below (leading into the canal).' },
                { t: 'check', id: 'c2', q: 'Where is the incisura terminalis, and why does a surgeon care?', a: 'Between the tragus and the helical crus. It has no cartilage, so the endaural incision goes through it without cutting cartilage.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q6'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['au-topo'] }],
            ref: [],
        },
        {
            id: 'au-cart',
            n: '2.2',
            title: 'Cartilage and skin',
            blocks: [
                { t: 'p', x: 'The shape of the auricle is the shape of one **elastic cartilage** plate, continuous with the cartilage of the lateral canal; that continuity is what fixes the pinna to the tympanic bone. The **lobule** and the **incisura terminalis** have no cartilage. Skin on both surfaces carries hair, sebaceous and sweat glands, but it is **tightly bound to the perichondrium laterally** and **loosely attached medially**. [[src|Glasscock Ch. 2]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'table',
                    head: ['', 'Lateral (anterior) surface', 'Medial (posterior) surface'],
                    rows: [
                        ['Skin to perichondrium', 'Tight, almost no subcutis', 'Loose, with a subcutaneous layer'],
                        ['Hematoma plane', 'Subperichondrial: lifts perichondrium off cartilage', 'Subcutaneous space available'],
                        ['Skin defect', 'Rarely closes primarily; graft or flap', 'Mobile skin advances'],
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why a hematoma deforms the ear',
                    blocks: [
                        { t: 'p', x: 'Cartilage has no vessels of its own; it is nourished from the perichondrium. Blood that lifts the perichondrium starves the cartilage beneath, which necroses and is replaced by fibrous tissue: the cauliflower ear. Drain and bolster to close the plane.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'The Handbook calls the canal cartilage fibrocartilage, not elastic cartilage, while Glasscock describes it as a continuation of the auricular cartilage. Both agree it is continuous with the pinna.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the two parts of the auricle without cartilage.', a: 'The lobule and the incisura terminalis.' },
                { t: 'check', id: 'c2', q: 'Predict: after a hematoma is drained, why does it re-collect unless bolstered?', a: 'The perichondrium stays separated from the cartilage; the dead space refills with blood or serum until the bolster holds the perichondrium down.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q8'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['au-cart'] }],
            ref: [],
        },
        {
            id: 'au-muscle',
            n: '2.3',
            title: 'Muscles and ligaments',
            blocks: [
                { t: 'p', x: 'The pinna is held by skin, connective tissue, ligaments, **three extrinsic** muscles (anterior, superior, posterior) and **six intrinsic** muscles, poorly developed in humans. All are second-arch muscles of the **facial nerve**: the **posterior auricular nerve** supplies the posterior auricular muscle and the intrinsic muscles; the temporal branch supplies the anterior and superior muscles. These are the first facial nerve targets this guide meets. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Ligaments: the Handbook names anterior, superior and posterior ligaments; other texts name only anterior and posterior extrinsic ligaments. The muscles are not in dispute.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which nerve supplies the extrinsic auricular muscles, and from which arch are they?', a: 'The facial nerve (temporal branch anteriorly and superiorly, posterior auricular nerve posteriorly); second arch.' },
                { t: 'check', id: 'c2', q: 'How many extrinsic and intrinsic auricular muscles are there?', a: 'Three extrinsic (anterior, superior, posterior) and six intrinsic.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q9'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['au-muscle'] }],
            ref: [],
        },
        {
            id: 'au-vessel',
            n: '2.4',
            title: 'Arteries, veins and lymph',
            blocks: [
                { t: 'p', x: 'Two branches of the external carotid artery. The **superficial temporal artery** sends anterior auricular branches to the front of the pinna and the canal. The **posterior auricular artery** runs up on the mastoid, supplies the medial surface, sends perforators through the cartilage to the concha and lateral skin, and gives the **stylomastoid artery**, which enters the fallopian canal to supply the facial nerve. Veins follow the arteries to the external jugular or facial veins. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'layers',
                    id: 'au-vessel-ly',
                    alt: 'Right auricle shown from the lateral and medial sides, with overlays for the two arteries and the three lymphatic basins.',
                    base: 'images/oksat/ear-anatomy/auricle-faces-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'sta', label: 'Superficial temporal a.', src: 'images/oksat/ear-anatomy/auricle-a-sta.svg' },
                        { id: 'paa', label: 'Posterior auricular a.', src: 'images/oksat/ear-anatomy/auricle-a-paa.svg' },
                        { id: 'pre', label: 'Preauricular nodes', src: 'images/oksat/ear-anatomy/auricle-l-pre.svg' },
                        { id: 'retro', label: 'Retroauricular nodes', src: 'images/oksat/ear-anatomy/auricle-l-retro.svg' },
                        { id: 'infra', label: 'Infra-auricular nodes', src: 'images/oksat/ear-anatomy/auricle-l-infra.svg' },
                    ],
                    on: ['paa'],
                    cap: 'Territories are approximate and overlap. Turn on one artery, then each lymph basin, and name a lesion site that drains there. Schematic.',
                },
                {
                    t: 'kv',
                    rows: [
                        ['Preauricular (parotid) nodes', 'Anterior surface and tragus'],
                        ['Retroauricular (mastoid) nodes', 'Posterior and superior auricle'],
                        ['Infra-auricular and upper cervical nodes', 'Lobule and concha'],
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'The posterior auricular artery is the dominant supply.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which branch of the posterior auricular artery matters to otologists, and where does it go?', a: 'The stylomastoid artery: it enters the stylomastoid foramen and fallopian canal to supply the mastoid facial nerve.' },
                { t: 'check', id: 'c2', q: 'A melanoma on the lobule: first nodal basin?', a: 'Infra-auricular and upper cervical nodes.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q10'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['au-vessel'] }],
            ref: [],
        },
        {
            id: 'au-nerve',
            n: '2.5',
            title: 'The sensory map',
            blocks: [
                { t: 'p', x: 'Five sensory sources: the **auriculotemporal nerve** (V3: tragus, anterior helix, anterior canal), the **great auricular nerve** (cervical plexus: lower lateral and most of the medial surface, lobule), the **lesser occipital nerve** (upper medial surface and superior helix), **Arnold nerve** (auricular branch of X: concha, posterior canal) and twigs of the **facial nerve** (concha and posterior canal). [[src|Glasscock Ch. 2]]' },
                {
                    t: 'layers',
                    id: 'au-nerve-ly',
                    alt: 'Right auricle from the lateral and medial sides with overlays for four sensory territories.',
                    base: 'images/oksat/ear-anatomy/auricle-faces-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'atn', label: 'Auriculotemporal (V3)', src: 'images/oksat/ear-anatomy/auricle-n-atn.svg' },
                        { id: 'gan', label: 'Great auricular', src: 'images/oksat/ear-anatomy/auricle-n-gan.svg' },
                        { id: 'lon', label: 'Lesser occipital', src: 'images/oksat/ear-anatomy/auricle-n-lon.svg' },
                        { id: 'x7', label: 'Arnold (X) and VII', src: 'images/oksat/ear-anatomy/auricle-n-x7.svg' },
                    ],
                    cap: 'Predict each territory first, then switch it on. Note what a ring around the base would miss. Schematic.',
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why a ring block misses the concha',
                    blocks: [
                        { t: 'p', x: 'The cervical nerves and the auriculotemporal nerve arrive from the periphery and are caught by a ring around the base. Arnold nerve and the facial twigs arrive from deep, through the canal and the tympanomastoid region, inside the ring. For canal surgery Glasscock adds infiltration of the cartilaginous canal at 2, 4, 8 and 10 o\'clock. [[src|Glasscock Ch. 2]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Roots and reach: Glasscock and the Handbook both give the great auricular nerve as C3 and the lesser occipital as C2 and C3, and the Handbook says the lesser occipital supplies the inferior auricle, where most texts put the great auricular. Many anatomy texts give C2–C3 and C2. Learn the territories as drawn here; roots vary by text.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which two nerves reach the concha and the posterior canal?', a: 'Arnold nerve (auricular branch of X) and sensory twigs of the facial nerve.' },
                { t: 'check', id: 'c2', q: 'Predict: which cranial nerves can refer pain to the ear, given this map and the drum?', a: 'V3 (auriculotemporal), VII, IX (Jacobson, middle ear), X (Arnold), plus C2–C3. Chapter 4 adds IX on the medial drum.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q11', 'ear-anatomy:q12'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['au-nerve'] }],
            ref: [],
        },
        {
            id: 'au-dev',
            n: '2.6',
            title: 'Development and proportions',
            blocks: [
                { t: 'p', x: 'Six **hillocks of His** appear around the first branchial groove at about 6 weeks, three on the first (mandibular) arch and three on the second (hyoid) arch; they fuse into an anterior and a posterior fold, and the adult configuration is reached by the fifth month. The auricle reaches about 85% of adult size by age 5. [[src|Glasscock Ch. 1]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'table',
                    head: ['Hillock', 'Arch', 'Board-version derivative'],
                    rows: [
                        ['1', 'First', 'Tragus'],
                        ['2', 'First', 'Helical crus'],
                        ['3', 'First', 'Helix'],
                        ['4', 'Second', 'Antihelix'],
                        ['5', 'Second', 'Antitragus'],
                        ['6', 'Second', 'Lobule'],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'The Handbook notes that hillocks 4–6 remain controversial; Glasscock cites studies giving the second arch most of the auricle and others a balanced share. The appraisal chapter returns to this. Commit to 1–3.' },
                    ],
                },
                {
                    t: 'ul',
                    items: [
                        'Height 5.5–6.5 cm; width about 55% of height. [[src|Baker Ch. 22 via otoplasty module]]',
                        'Long axis tilted about 15° posteriorly; conchoscaphal angle about 90°; auriculocephalic angle 20–30°. [[src|Baker Ch. 22 via otoplasty module]]',
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the first-arch hillock derivatives in order.', a: 'Hillock 1 tragus, 2 helical crus, 3 helix.' },
                { t: 'check', id: 'c2', q: 'Which angle measures the fold of the antihelix, and what is its normal value?', a: 'The conchoscaphal angle, about 90°.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q13', 'ear-anatomy:q14'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['au-dev'] }],
            ref: [],
        },
    ],
};
