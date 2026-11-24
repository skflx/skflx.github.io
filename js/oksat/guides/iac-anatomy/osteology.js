/* =============================================================
   The bony box
   OKSAT · Interactive learning · iac-anatomy · chapter 1
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'osteology',
    title: 'The bony box',
    kicker: '1 · Osteology & six walls',
    review: 'draft',
    lede: 'The internal auditory canal is a bony tube running mediolaterally in line with the external auditory canal, bounded by six walls from the porus to the fundus.',
    src: 'Kirtane Ch. 1–2, 31 · House Clinic Atlas Ch. 3, 5, 6 · PubMed primary series',
    tldr: [
        'About 1 cm long, 4–8 mm wide, in line with the ear canal.',
        '**Porus** medially (sharp posterior lip), **fundus** laterally against the otic capsule.',
        'Six walls, six hazards: middle fossa above, jugular bulb and cochlear aqueduct below, cochlea and carotid in front, posterior canal and vestibular aqueduct behind.',
        'Air cells around the canal are the route of **CSF** leaks.',
    ],
    sections: [
        {
            id: 'os-orient',
            n: '1.1',
            title: 'Which way the canal points',
            blocks: [
                {
                    t: 'p',
                    x: 'The **petrous pyramid** points anteromedially toward the clivus. [[src|K2]] The **IAC** runs mediolaterally, its long axis in line with the external auditory canal (**EAC**). [[src|K2]] [[src|K31]] [[src|HCA3 p42]] In the middle fossa approach this is how the surgeon orients: the IAC lies on roughly the same axis as the ear canal. [[src|HCA3 p42]]',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'The pyramid is not the canal',
                    blocks: [
                        { t: 'p', x: 'The canal does not follow the pyramid\'s long axis. The petrous pyramid points anteromedially, while the IAC runs mediolaterally.' },
                    ],
                },
                {
                    t: 'layers',
                    id: 'os-orient-ly',
                    alt: 'Axial schematic of the right petrous pyramid, showing the midline, lateral skull edge, the anteromedial long axis of the pyramid, and the mediolateral line shared by the IAC and EAC.',
                    base: 'images/oksat/iac-anatomy/iac-axis-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'axis', label: 'Pyramid axis', src: 'images/oksat/iac-anatomy/iac-axis-axis.svg' },
                        { id: 'canal', label: 'IAC and EAC', src: 'images/oksat/iac-anatomy/iac-axis-canal.svg' },
                    ],
                    on: ['axis', 'canal'],
                    cap: 'Schematic axial view, right side. The canal does not follow the pyramid\'s long axis. Sources: Kirtane ch. 2 and 31; House Clinic Atlas ch. 3.',
                },
                { t: 'check', id: 'c1', q: 'From the middle fossa, what external landmark gives the canal\'s axis?', a: 'The external auditory canal: the IAC lies on roughly the same axis.' },
                { t: 'check', id: 'c2', q: 'Does the IAC run along the long axis of the petrous pyramid?', a: 'No; the pyramid points anteromedially, while the canal runs mediolaterally.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['os-orient'] }],
        },
        {
            id: 'os-dev',
            ref: ['Otology/Inner ear malformations are classified by Jackler and Sennaroglu based on embryonic arrest timing and cochleovestibular architecture'],
            n: '1.2',
            title: 'Where the nerves come from',
            blocks: [
                {
                    t: 'p',
                    x: 'In week 4 the **acousticofacial ganglion** splits: its dorsal part becomes the **geniculate ganglion** of CN VII, and its ventral part becomes the **statoacoustic ganglion**. The statoacoustic ganglion\'s superior part forms the **superior vestibular nerve** (**SVN**); its inferior part forms both the **inferior vestibular nerve** (**IVN**) and the **cochlear ganglion**. [[src|K1]]',
                },
                {
                    t: 'p',
                    x: 'The sensory patches split the same way: the superior part supplies the utricle and the superior and lateral canal cristae; the inferior part supplies the saccule and posterior canal crista. The **otic capsule** ossifies from week 15, from 14 centres, fused by week 23 without sutures. The **cochlear aqueduct** forms between weeks 9 and 40 from a remnant of the inferior cochlear vein; it is not a true duct. [[src|K1]]',
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the inferior nerves stay together',
                    blocks: [
                        { t: 'p', x: 'The inferior vestibular nerve and the cochlear ganglion share an origin, which fits their tight fusion mid-canal. [[src|K1]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which nerve does the superior part of the statoacoustic ganglion form?', a: 'The superior vestibular nerve.' },
                { t: 'check', id: 'c2', q: 'Which end organs does the inferior part supply?', a: 'The saccule and posterior canal crista (and it forms the cochlear ganglion).' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['os-dev'] }],
        },
        {
            id: 'os-zones',
            n: '1.3',
            title: 'Porus, canal, fundus',
            blocks: [
                {
                    t: 'p',
                    x: 'The **porus** is the opening on the posterior face of the petrous bone; its posterior border is an acute angle, and its anterior border is flatter. [[src|K2]] [[src|K31]] Posterior fossa dura lines the canal its whole length and ends by merging with the nerves at their foramina. [[src|K2]]',
                },
                {
                    t: 'p',
                    x: 'The **fundus** is the lateral end, where the crests and foramina sit. [[src|K2]] In middle fossa surgery the porus is the "safe zone" to start drilling, and the fundus is the tight end. [[src|HCA3 p42]]',
                },
                { t: 'check', id: 'c1', q: 'Which lip of the porus is sharp?', a: 'The posterior lip (acute angle; the anterior border is flatter).' },
                { t: 'check', id: 'c2', q: 'Where does the canal\'s dural lining end?', a: 'By merging with the nerves as they enter their foramina at the fundus.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q3'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['os-zones'] }],
        },
        {
            id: 'os-morph',
            n: '1.4',
            title: 'How big, and when to worry',
            blocks: [
                {
                    t: 'p',
                    x: 'The canal is about 1 cm long. [[src|K2]] [[src|K31]] On CT in 162 patients, length measured 11.0–11.1 mm and mid-canal diameter 4.2 mm, with no sex or age difference. [[src|Gözen 2026, PMID 41682992]] Normal diameter is 4–8 mm, measured perpendicular to the long axis at mid-canal or the porus. [[src|Owner]] [[src|Marques 2012]]',
                },
                {
                    t: 'p',
                    x: '**Stenosis** is classically < 2 mm, linked to aplasia or severe hypoplasia of CN VIII; broader screening uses < 3 mm ("near-narrowed IAC"). [[src|Owner]] [[src|El Sadik 2017]] [[src|Ionescu 2023]] **Flaring** is > 8 mm (some series > 9 mm). [[src|Owner]] A side-to-side difference > 2 mm is abnormal and calls for contrast MRI. [[src|Owner]]',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Walls tell you why',
                    blocks: [
                        { t: 'p', x: 'Symmetric, smooth-walled flaring with a sharp transverse crest favours a variant or dural ectasia; asymmetric widening with erosion favours a mass. [[src|Owner]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'A normal canal can hold an absent nerve',
                    blocks: [
                        { t: 'p', x: 'About a third of deficient cochlear nerves sit in a normal-calibre canal. [[src|Owner]] [[src|McClay 2008]]' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'Go deeper · Senior — Where the numbers come from',
                    blocks: [
                        {
                            t: 'p',
                            x: 'Marques 2012 measured 110 normal CTs: adult vertical diameter 4.47 mm, opening width 7.10 mm, and length 9.84 mm; children measured slightly larger in length and diameter. [[src|PMID 23329967]] Cutoffs vary between series.',
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is the normal IAC diameter range?', a: '4–8 mm, measured perpendicular to the long axis at mid-canal or the porus.' },
                { t: 'check', id: 'c2', q: 'What is the classic stenosis cutoff, and what does it link to?', a: '< 2 mm; aplasia or severe hypoplasia of CN VIII.' },
                { t: 'check', id: 'c3', q: 'What side-to-side difference is abnormal?', a: '> 2 mm (calls for contrast MRI).' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['os-morph'] }],
        },
        {
            id: 'os-walls',
            ref: ['Otology/The otic capsule is an immutable endochondral bone that provides fixed surgical reference landmarks'],
            n: '1.5',
            title: 'Six walls, six hazards',
            blocks: [
                {
                    t: 'p',
                    x: '*Superior:* middle fossa floor and dura; the **arcuate eminence** roughly over the superior canal (an inconstant relation); **GSPN** and **geniculate ganglion** anteriorly; **superior petrosal sinus** medially along the ridge. [[src|HCA3 p41–42]]',
                },
                {
                    t: 'p',
                    x: '*Inferior:* the **jugular bulb**, whose height varies and which can reach the canal; [[src|K2]] the **cochlear aqueduct**, the inferior and anterior limit of translabyrinthine drilling, with cranial nerves IX–XI just below it. [[src|HCA6 p77]] [[src|K2]]',
                },
                {
                    t: 'p',
                    x: '*Anterior:* the basal turn of the **cochlea**, ≤ 1 mm in front of the labyrinthine facial nerve; [[src|HCA3 p45]] the **petrous carotid** anterolaterally; [[src|HCA3 p49]] the **petrous apex** medially.',
                },
                {
                    t: 'p',
                    x: '*Posterior:* posterior fossa dura; the **vestibular aqueduct** and **endolymphatic sac** under the operculum, inferolateral to the porus; [[src|K2]] the **posterior canal** and **common crus** laterally, which limit retrosigmoid drilling. [[src|HCA5 p60, p63]] The endolymphatic duct opening marks the posterior canal. [[src|K2]]',
                },
                {
                    t: 'p',
                    x: '*Lateral:* the **vestibule** and **cochlea** of the otic capsule. [[src|K2]]',
                },
                {
                    t: 'p',
                    x: '*Medial:* the **porus** opening onto the cerebellopontine angle. [[src|K2]]',
                },
                {
                    t: 'hotspot',
                    id: 'os-walls-hs',
                    alt: 'The internal auditory canal drawn as an unfolded six-sided box for a right ear, showing the structures beyond the superior, posterior, medial, anterior, inferior and lateral walls.',
                    modes: ['explore'],
                    frames: [
                        {
                            src: 'images/oksat/iac-anatomy/iac-walls-box.svg',
                            cap: 'Schematic, not to scale. Sources: House Clinic Atlas ch. 3 and 6; Kirtane ch. 2.',
                        },
                    ],
                },
                {
                    t: 'neighbors',
                    id: 'os-walls-nb',
                    g: 'iac',
                    label: 'Fill the canal\'s neighbours',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/iac-anatomy/stanford-fig-9.jpg',
                    alt: 'Axial illustration of the temporal bone with the internal auditory canal and surrounding bony and neurovascular structures labelled.',
                    cap: 'Axial temporal bone with the IAC labelled. Stanford Skull Base Surgery Atlas, © RK Jackler; used with the atlas\'s educational permission.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'The bulb sets the floor',
                    blocks: [
                        { t: 'p', x: 'A high jugular bulb can lie almost against the canal and limits the inferior trough. [[src|K2]] [[src|HCA6 p75]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is the inferior limit of translabyrinthine drilling, and what lies below it?', a: 'The cochlear aqueduct; cranial nerves IX, X and XI lie just below it.' },
                { t: 'check', id: 'c2', q: 'What limits retrosigmoid drilling of the posterior lip?', a: 'The posterior semicircular canal (and common crus laterally).' },
                { t: 'check', id: 'c3', q: 'What lies ≤ 1 mm in front of the labyrinthine segment?', a: 'The basal turn of the cochlea.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['os-walls'] }],
        },
        {
            id: 'os-cells',
            ref: ['Otology/Cerebrospinal fluid CSF leak and pseudomeningocele require lumbar drainage, fat obliteration, and re-exploration'],
            n: '1.6',
            title: 'Air cells around the canal',
            blocks: [
                {
                    t: 'p',
                    x: 'The five cell tracts of the temporal bone are **posterosuperior** (sinodural), **posteromedial** (retrofacial and retrolabyrinthine), **subarcuate**, **perilabyrinthine** (supra- and infralabyrinthine), and **peritubal**. [[src|K2]] Highly pneumatized bones carry more risk of postoperative **CSF** rhinorrhea. [[src|K31]]',
                },
                {
                    t: 'p',
                    x: 'In translabyrinthine surgery, apical cells above the IAC must be waxed. [[src|HCA6 p78]] In retrosigmoid surgery, cells opened at the posterior lip are waxed and covered with fat because apical cells are hard to seal. [[src|HCA5 p65–66]]',
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why a closed dura still leaks',
                    blocks: [
                        { t: 'p', x: 'CSF follows opened air cells to the middle ear and out the Eustachian tube.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the perilabyrinthine tracts.', a: 'Supralabyrinthine and infralabyrinthine air-cell tracts.' },
                { t: 'check', id: 'c2', q: 'Which bones leak more after IAC surgery?', a: 'Highly pneumatized temporal bones.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q35'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['os-cells'] }],
        },
    ],
};
