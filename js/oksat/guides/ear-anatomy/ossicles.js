/* =============================================================
   The ossicular chain
   OKSAT · Interactive learning · ear-anatomy · chapter 6
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'ossicles',
    title: 'The ossicular chain',
    kicker: '6 · Middle ear',
    review: 'draft',
    lede: 'Three bones slung on six ligaments, rocking about one axis, tuned by two muscles from two different arches, and fed so thinly at one point that chronic otitis eats it first.',
    src: 'Glasscock Ch. 2–3 · Handbook Ch. 3 · Cummings Review Ch. 2',
    tldr: [
        'Malleus: head, neck, lateral and anterior processes, manubrium. Incus: body, short, long and lenticular processes (the largest ossicle). Stapes: head, neck, two crura, footplate (about 2.7–2.9 × 1.2–1.5 mm).',
        '**Axis of rotation**: anterior malleal ligament to posterior incudal ligament. Lever about 1.3:1.',
        '**Tensor tympani**: around the cochleariform process to the malleus, V3, first arch. **Stapedius**: out of the pyramid to the posterior stapes, VII, second arch.',
        'Stapedial reflex: VIII → cochlear nucleus → superior olivary complex (both sides) → facial motor nuclei → stapedius.',
        'Incus long process: single mucosal blood supply, first to erode. Board origin: seen through the drum = second arch; in the attic = first arch; footplate = otic capsule.',
    ],
    sections: [
        {
            id: 'os-parts',
            n: '6.1',
            title: 'Parts',
            blocks: [
                { t: 'p', x: 'The **malleus**, most lateral, has a head, neck, **lateral process** (with a cartilaginous cap fused to the drum), **anterior process** and **manubrium**. The **incus**, the largest ossicle, has a **body** that articulates with the malleus head in the attic, a **short process** anchored in the fossa incudis, a **long process** running down behind and parallel to the manubrium, and the **lenticular process** at its tip. The **stapes**, smallest and most medial, has a **head (capitulum)**, neck, **anterior** and **posterior crura** around the **obturator foramen**, and a **footplate** in the oval window. [[src|Glasscock Ch. 2]] [[src|Handbook Ch. 3]]' },
                {
                    t: 'hotspot',
                    id: 'os-parts-hs',
                    alt: 'Right ossicular chain in lateral view, with the stapes opened out below the lenticular process, and every part tappable.',
                    modes: ['explore', 'find'],
                    frames: [{ src: 'images/oksat/ear-anatomy/ossicles-parts.svg', cap: 'Right chain, lateral view, anterior to the right; stapes opened out to show its profile. Schematic.' }],
                },
                {
                    t: 'ul',
                    items: [
                        'Footplate about 2.7–2.9 mm long and 1.2–1.5 mm wide, its long axis anteroposterior. [[src|Folia Morphol 2024]] [[src|J Otolaryngol Head Neck Surg 2021]]',
                        'The anterior crus is thinner and straighter than the posterior crus.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the four parts of the incus and what each touches.', a: 'Body: malleus head (incudomallear joint). Short process: fossa incudis (posterior incudal ligament). Long process: runs down behind the manubrium. Lenticular process: stapes head (incudostapedial joint).' },
                { t: 'check', id: 'c2', q: 'Which ossicle is the largest, which the smallest?', a: 'Incus largest; stapes smallest.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q41', 'ear-anatomy:q42'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['os-parts'] }],
            ref: [],
        },
        {
            id: 'os-joints',
            n: '6.2',
            title: 'Joints, ligaments and the axis',
            blocks: [
                { t: 'p', x: 'The **incudomallear** and **incudostapedial** joints are synovial. Six ligaments suspend the chain: **superior malleal** and **superior incudal** to the tegmen, **anterior malleal** from the anterior process through the petrotympanic fissure, **lateral malleal** from the neck to the notch of Rivinus (the roof of Prussak space), **posterior incudal** from the short process to the fossa incudis, and the **annular** (stapediovestibular) ligament around the footplate. [[src|Glasscock Ch. 2]] [[src|Handbook Ch. 3]]' },
                { t: 'p', x: 'The anterior malleal and posterior incudal ligaments define the **axis of rotation**. The chain rocks about it; the manubrium is about **1.3** times as long as the incus long process, the ossicular lever (about 2 dB). [[src|Glasscock Ch. 2–3]]' },
                {
                    t: 'hotspot',
                    id: 'os-joints-hs',
                    alt: 'Right ossicular chain with six ligaments in red and a dashed axis of rotation from the anterior malleal ligament to the posterior incudal ligament.',
                    modes: ['find', 'explore'],
                    frames: [{ src: 'images/oksat/ear-anatomy/ossicles-ligaments.svg', cap: 'Right chain, lateral view. Find each ligament, then trace the axis. Schematic.' }],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'Dissect disease off the stapes **posterior to anterior, parallel to the stapedius tendon**, so the tendon resists displacement. The ligaments are easily overcome by an instrument pulling the wrong way. [[src|Glasscock Ch. 2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which two ligaments define the axis of rotation?', a: 'The anterior malleal ligament and the posterior incudal ligament.' },
                { t: 'check', id: 'c2', q: 'Which ligament forms the roof of Prussak space?', a: 'The lateral malleal ligament, from the malleus neck to the notch of Rivinus.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q43', 'ear-anatomy:q44'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['os-joints'] }],
            ref: [],
        },
        {
            id: 'os-tensor',
            n: '6.3',
            title: 'Tensor tympani',
            blocks: [
                { t: 'p', x: 'The tensor tympani arises from the walls of its semicanal above the Eustachian tube, the greater wing of the sphenoid and the cartilage of the tube. Its tendon sweeps around the **cochleariform process**, turning about 90°, to the medial neck and manubrium of the malleus. It is a **first-arch** muscle of **V3**; the nerve passes through the otic ganglion without synapsing. It pulls the malleus medially. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'The medialized manubrium',
                    blocks: [
                        { t: 'p', x: 'The intact drum normally opposes the tensor. With a large chronic perforation its pull is unopposed and the manubrium medializes, shrinking the middle ear space; the tendon may need lateralization or section before grafting. [[src|Glasscock Ch. 2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Give the tensor tympani\'s nerve, arch and pulley.', a: 'V3; first arch; the cochleariform process.' },
                { t: 'check', id: 'c2', q: 'Which other muscle shares its nerve and arch?', a: 'Tensor veli palatini (V3, first arch).' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q45'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['os-tensor'] }],
            ref: [],
        },
        {
            id: 'os-stapedius',
            n: '6.4',
            title: 'Stapedius and the reflex arc',
            blocks: [
                { t: 'p', x: 'The stapedius lies in a vertical sulcus in the posterior wall beside the mastoid facial nerve. Its tendon leaves the **pyramidal eminence** for the posterior stapes. It is a **second-arch** muscle supplied by the **facial nerve** (nerve to stapedius) and pulls the stapes posteriorly. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Insertion: Cummings Review gives the stapes neck; Glasscock the posterior crus and occasionally the head; the Handbook the posterior capitulum or posterior crus. All agree it is the posterior stapes.' },
                    ],
                },
                {
                    t: 'sequence',
                    id: 'os-reflex-seq',
                    q: 'Order the stapedial reflex arc.',
                    items: ['Cochlear nerve (VIII)', 'Ventral cochlear nucleus', 'Superior olivary complex, both sides', 'Facial motor nucleus', 'Stapedius'],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the arc localizes',
                    blocks: [
                        { t: 'p', x: 'Because the olivary relay goes to both sides, sound in one ear contracts both stapedius muscles. A unilateral facial lesion above the nerve to stapedius removes the reflex in that ear whichever ear is stimulated; a unilateral VIII lesion removes it in both ears when that ear is stimulated.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Right facial palsy proximal to the nerve to stapedius: where is the reflex lost?', a: 'In the right ear, for stimulation of either ear; the left ear\'s reflex is preserved.' },
                { t: 'check', id: 'c2', q: 'Right dead ear (VIII): where is the reflex lost?', a: 'Whenever the right ear is stimulated, recorded in either ear; stimulating the left still gives reflexes in both.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q47'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['os-stapedius'] }],
            ref: [],
        },
        {
            id: 'os-supply',
            n: '6.5',
            title: 'Blood supply and weak points',
            blocks: [
                { t: 'p', x: 'The ossicles are fed by mucosal vessels from the anterior tympanic and posterior tympanic arteries; the stapes receives anterior and posterior **crural** branches. The **long process of the incus** has a single supply without collaterals, which predisposes it to erosion; Glasscock calls it particularly prone to osteitic resorption in chronic otitis media. [[src|Cummings Review Ch. 2]] [[src|Glasscock Ch. 2]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Variant: persistent stapedial artery',
                    blocks: [
                        { t: 'p', x: 'The embryonic stapedial artery (second arch) normally regresses. If it persists, it runs through the obturator foramen of the stapes, usually with an absent foramen spinosum. It is seen, not divided.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which ossicular segment erodes first in chronic otitis media, and why?', a: 'The long and lenticular process of the incus: a single mucosal blood supply without collaterals.' },
                { t: 'check', id: 'c2', q: 'Through which opening does a persistent stapedial artery run?', a: 'The obturator foramen, between the stapes crura.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q48'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['os-supply'] }],
            ref: [],
        },
        {
            id: 'os-dev',
            n: '6.6',
            title: 'Embryology',
            blocks: [
                { t: 'p', x: 'Board version: **Meckel cartilage** (first arch) forms the head and neck of the malleus and the body and short process of the incus; **Reichert cartilage** (second arch) forms the manubrium, the long process of the incus and the stapes superstructure; the **footplate** comes from the **otic capsule**. The cartilaginous ossicles reach adult size and shape by about 16 weeks, then ossify; the manubrium never fully ossifies. [[src|Handbook Ch. 3]]' },
                {
                    t: 'layers',
                    id: 'os-dev-ly',
                    alt: 'The right ossicular chain in outline with three colour overlays for first-arch, second-arch and otic capsule parts.',
                    base: 'images/oksat/ear-anatomy/ossicles-arch-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'a1', label: 'First arch (Meckel)', src: 'images/oksat/ear-anatomy/ossicles-arch1.svg' },
                        { id: 'a2', label: 'Second arch (Reichert)', src: 'images/oksat/ear-anatomy/ossicles-arch2.svg' },
                        { id: 'otic', label: 'Otic capsule', src: 'images/oksat/ear-anatomy/ossicles-otic.svg' },
                    ],
                    cap: 'Predict the colour of each part before switching the overlays on. Board teaching; lineage studies differ. Schematic.',
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**What you see through the drum is second arch; what hides in the attic is first arch.** The muscles follow: tensor (first arch, V3) on the malleus, stapedius (second arch, VII) on the stapes.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the second-arch parts of the chain.', a: 'Manubrium of the malleus, long process of the incus, stapes superstructure.' },
                { t: 'check', id: 'c2', q: 'Where does the footplate come from, and why does that matter for a first- or second-arch malformation?', a: 'The otic capsule; an arch malformation can leave a normal footplate and inner ear.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q49'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['os-dev'] }],
            ref: [],
        },
    ],
};
