/* =============================================================
   The tympanic membrane
   OKSAT · Interactive learning · ear-anatomy · chapter 4
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'tm',
    title: 'The tympanic membrane',
    kicker: '4 · The drum',
    review: 'draft',
    lede: 'A three-layered cone, tethered to the malleus at two points, framed by an annulus that stops at the notch of Rivinus, and transparent enough to show you half the middle ear if you know what lies behind each quadrant.',
    src: 'Glasscock Ch. 1–3 · Handbook Ch. 3 · Cummings Review Ch. 2',
    tldr: [
        'About **10 × 9 mm**, a cone with the **umbo** at its apex, set at an acute angle to the canal floor; nearly horizontal at birth, adult angle by age 4–5.',
        'Three layers: squamous epithelium, **fibrous layer** (radial and circular), mucosa. The **pars flaccida** has no organized fibrous layer and no annulus.',
        'Firm attachment to the malleus at the **lateral process** and the **umbo** only.',
        'Behind the quadrants: anterosuperior, tensor and cochleariform; anteroinferior, protympanum and tube; posterosuperior, incus, stapes, chorda; posteroinferior, round window and hypotympanum.',
        'Sensation: V3 and X laterally, **IX** (Jacobson) medially. Germ layers: ectoderm, mesoderm, endoderm.',
    ],
    sections: [
        {
            id: 'tm-geo',
            n: '4.1',
            title: 'Geometry and mechanics',
            blocks: [
                { t: 'p', x: 'The drum is about **10 mm** high and **9 mm** wide, an irregular cone whose apex, the **umbo**, sits at the tip of the manubrium. It subtends an **acute angle** with the inferior canal wall. In the neonate it lies nearly horizontal; lateral growth of the tympanic ring carries it to the adult angle by about age 4–5. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 1–2]]' },
                { t: 'p', x: 'Mechanics hook: the drum collects force over a large area and delivers it to the small footplate. Quoted ratio about **20:1** (about 26 dB); the ossicular lever adds about **1.3:1** (about 2 dB); theoretical gain about 28 dB, measured gain lower and frequency dependent. [[src|Glasscock Ch. 3]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'The ratio depends on which drum area you count. Glasscock and Cummings Review use 20:1; computed from the freely vibrating area (about 43 of 69 mm²) against a 3.2 mm² footplate it is nearer 13:1. Cummings Review gives the actual gain as about 20 dB. [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why does a neonatal drum look foreshortened?', a: 'It lies nearly horizontal; the tympanic ring has not yet grown laterally to tilt it to the adult angle (reached by about age 4–5).' },
                { t: 'check', id: 'c2', q: 'Which contributes more to middle ear gain, the area ratio or the lever?', a: 'The area ratio (about 26 dB of a theoretical 28); the lever adds about 2 dB.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q22', 'ear-anatomy:q23'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['tm-geo'] }],
        },
        {
            id: 'tm-layers',
            n: '4.2',
            title: 'Pars tensa and pars flaccida',
            blocks: [
                {
                    t: 'table',
                    head: ['Layer, lateral to medial', 'Origin', 'Note'],
                    rows: [
                        ['Squamous epithelium', 'First groove ectoderm', 'Continuous with canal skin; migrates outward'],
                        ['Fibrous layer (lamina propria, pars propria)', 'Mesenchyme', 'Outer radial and inner circular fibres; splits to envelop the manubrium tip'],
                        ['Mucosa', 'First pouch endoderm', 'Continuous with middle ear lining'],
                    ],
                },
                { t: 'p', x: 'The **pars tensa** is framed by the fibrocartilaginous **annulus** in the tympanic sulcus. Superiorly the sulcus is deficient at the **notch of Rivinus**, between the anterior and posterior tympanic spines; there the drum attaches straight to the squama. Above the **anterior** and **posterior malleal folds** lies the **pars flaccida** (Shrapnell membrane), which has no organized fibrous layer. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]] [[src|Handbook Ch. 3]]' },
                { t: 'p', x: 'The drum is firmly attached to the malleus at only two points: the **lateral process**, whose cartilaginous cap merges with the pars propria, and the **umbo**. Between them only a mucosal fold, the plica mallearis, connects drum and handle. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'Elevating a drum off the malleus: it lifts easily along the handle but holds at the lateral process and the umbo, where it must be dissected sharply.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which layer is missing or disorganized in the pars flaccida, and what does that predict?', a: 'The fibrous layer; the flaccida yields to negative pressure first, so attic retraction pockets start there.' },
                { t: 'check', id: 'c2', q: 'At which two points is the drum fixed to the malleus?', a: 'The lateral process and the umbo.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q24', 'ear-anatomy:q25'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['tm-layers'] }],
        },
        {
            id: 'tm-marks',
            n: '4.3',
            title: 'Landmarks',
            blocks: [
                { t: 'p', x: 'On the drum: **lateral process**, **manubrium**, **umbo**, the **cone of light**, the **anterior** and **posterior malleal folds** with the **pars flaccida** above, and the **annulus**. Through it: the **long process of the incus**, the **promontory**, often the **round window niche**, sometimes the **chorda** and the Eustachian tube opening. [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'hotspot',
                    id: 'tm-marks-hs',
                    alt: 'Right tympanic membrane in otoscopic view with tappable landmarks on and behind the drum.',
                    modes: ['explore', 'find'],
                    frames: [{ src: 'images/oksat/ear-anatomy/tm-right.svg', cap: 'Right ear, otoscopic view; anterior to the right. Dashed outlines lie behind the drum. Schematic.' }],
                },
                { t: 'check', id: 'c1', q: 'Name four structures you can often see through a normal drum.', a: 'Long process of the incus, promontory, round window niche, chorda tympani (sometimes the Eustachian tube opening).' },
                { t: 'check', id: 'c2', q: 'Which landmark marks the top of the manubrium, and what lies above it?', a: 'The lateral process; above it, between the malleal folds, the pars flaccida.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q26'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['tm-marks'] }],
        },
        {
            id: 'tm-quad',
            n: '4.4',
            title: 'What lies behind each quadrant',
            blocks: [
                { t: 'p', x: 'Divide the drum by the line of the manubrium and its perpendicular through the umbo. Predict what is behind each quadrant before you make it transparent.' },
                {
                    t: 'layers',
                    id: 'tm-quad-ly',
                    alt: 'The right tympanic membrane drawn over the structures of the middle ear, with each quadrant an opaque cover that can be switched off.',
                    base: 'images/oksat/ear-anatomy/tm-behind.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'as', label: 'Anterosuperior cover', src: 'images/oksat/ear-anatomy/tm-cover-as.svg' },
                        { id: 'ai', label: 'Anteroinferior cover', src: 'images/oksat/ear-anatomy/tm-cover-ai.svg' },
                        { id: 'ps', label: 'Posterosuperior cover', src: 'images/oksat/ear-anatomy/tm-cover-ps.svg' },
                        { id: 'pi', label: 'Posteroinferior cover', src: 'images/oksat/ear-anatomy/tm-cover-pi.svg' },
                        { id: 'labels', label: 'Labels', src: 'images/oksat/ear-anatomy/tm-labels.svg' },
                    ],
                    on: ['as', 'ai', 'ps', 'pi'],
                    cap: 'Right ear. All four covers start on; turn one off at a time, then switch on the labels. Schematic.',
                },
                { t: 'check', id: 'c1', q: 'Name what lies behind the posterosuperior quadrant.', a: 'Incus long process, incudostapedial joint, stapes and stapedius tendon, chorda tympani; tympanic facial nerve above the oval window.' },
                { t: 'check', id: 'c2', q: 'Why is the anteroinferior quadrant the myringotomy site?', a: 'It overlies the protympanum, away from the ossicles and chorda (posterosuperior) and the round window and jugular bulb (posteroinferior).' },
                {
                    t: 'table',
                    head: ['Quadrant', 'Behind it', 'Consequence'],
                    rows: [
                        ['Anterosuperior', 'Tensor tendon, cochleariform process; chorda leaving anteriorly', 'Malleus neck; geniculate ganglion further anterosuperior'],
                        ['Anteroinferior', 'Protympanum, Eustachian tube orifice; carotid wall beyond', 'Myringotomy and tube site'],
                        ['Posterosuperior', 'Incus long process, incudostapedial joint, stapes, stapedius tendon, chorda; tympanic facial nerve above', 'Avoid instruments here'],
                        ['Posteroinferior', 'Round window niche, sinus tympani region, hypotympanum; jugular bulb if high', 'A vascular mass here: image before any biopsy'],
                    ],
                },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q27'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['tm-quad'] }],
        },
        {
            id: 'tm-supply',
            n: '4.5',
            title: 'Blood and nerve supply',
            blocks: [
                {
                    t: 'table',
                    head: ['Surface', 'Nerves', 'Arteries'],
                    rows: [
                        ['Lateral', '**Auriculotemporal** (V3) anteriorly; **Arnold** (X) posteriorly, with facial nerve fibres', '**Deep auricular** (maxillary): manubrial and radial vessels'],
                        ['Medial', '**Jacobson nerve** (IX) through the tympanic plexus', '**Anterior tympanic** (maxillary) and **stylomastoid** (posterior tympanic)'],
                    ],
                },
                { t: 'p', x: 'Jacobson nerve is met here first; it enters the middle ear through the floor and spreads over the promontory (chapter 5). One membrane carries three cranial nerves: V3 and X outside, IX inside, which is why otalgia has so many distant sources.' },
                { t: 'check', id: 'c1', q: 'Which cranial nerve supplies the mucosal surface of the drum?', a: 'IX, through Jacobson nerve and the tympanic plexus.' },
                { t: 'check', id: 'c2', q: 'Name the artery of the lateral surface of the drum and its parent.', a: 'Deep auricular artery, from the maxillary artery.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q28'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['tm-supply'] }],
        },
        {
            id: 'tm-dev',
            n: '4.6',
            title: 'Three germ layers',
            blocks: [
                { t: 'p', x: 'The drum forms where the **first pharyngeal groove** (ectoderm) deepens toward the **first pouch** (endoderm), with mesenchyme between them becoming the fibrous layer. The tympanic ring ossifies from four centres around 9 weeks and fuses by the tenth week except superiorly, where the gap remains as the **notch of Rivinus**. The meatal plug that fills the canal canalizes from its medial end in the second half of gestation. [[src|Glasscock Ch. 1]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Development explains the anatomy',
                    blocks: [
                        { t: 'p', x: 'No ring at the top means no annulus and no organized fibrous layer above the malleal folds: the pars flaccida. A meatal plug that fails to canalize gives canal atresia, often with a normal inner ear, because the otic capsule develops separately.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the germ layer of each drum layer, lateral to medial.', a: 'Ectoderm (first groove), mesoderm (mesenchyme), endoderm (first pouch).' },
                { t: 'check', id: 'c2', q: 'Why is there a notch of Rivinus?', a: 'The tympanic ring fuses everywhere except superiorly, leaving a gap where the drum attaches directly to the squama.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q29'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['tm-dev'] }],
        },
    ],
};
