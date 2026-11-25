/* =============================================================
   Chronic otitis media and tympanic membrane perforation
   OKSAT · Interactive learning · cholesteatoma · chapter 1
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'com-tm',
    title: 'Chronic otitis media and tympanic membrane perforation',
    kicker: '1 · COM & tympanoplasty',
    review: 'draft',
    lede: 'How chronic middle ear inflammation destroys bone even without cholesteatoma, why posterior marginal perforations carry higher risk, and how pediatric tympanoplasty timing differs from adult repair.',
    src: 'C2 · P16 · J5 · K14 · K15 · K17 · K18 · E33–E45 · E53',
    tldr: [
        'CSOM is middle ear discharge through a TM perforation lasting >3 months; granulation tissue alone destroys bone via collagenase even without cholesteatoma, and chronic ear infections shift toward *Proteus*, *Pseudomonas*, and *Enterococcus*.',
        'Posterior and marginal perforations carry more CHL (phase cancellation over the round window) and higher cholesteatoma risk because marginal defects lack the fibrous annulus.',
        'In COM without cholesteatoma, tympanoplasty alone matches tympanoplasty plus mastoidectomy; underlay temporalis fascia is standard, lateral grafting risks anterior blunting and lateralization, and myringoplasty is contraindicated in an only-hearing ear.',
        'In children, a **healthy contralateral ear** predicts tympanoplasty success better than age alone; elective repair is often delayed until around age 10, though earlier surgery is reasonable for troublesome otorrhea or hearing loss.',
    ],
    sections: [
        {
            id: 'com-et-anatomy',
            ref: [
                'Otology/Eustachian tube dysfunction divides into dilatory and patulous forms with opposite treatment goals',
                'Otology/Patulous Eustachian tube manifests with autophony, respiratory-synchronous tinnitus, and tympanic membrane excursions on nasal breathing',
            ],
            n: '1.1',
            title: 'Chronic OM, TM structure, and Eustachian tube anatomy',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        ['CSOM', 'Chronic middle ear discharge through a TM perforation lasting >3 months, versus an inactive dry perforation. [[src|K14]]'],
                        ['Silent OM', 'Paparella (1980): chronic middle ear inflammatory pathology behind an intact TM without perforation or otorrhea. [[src|K14]]'],
                        ['Granulation osteolysis', 'Granulation tissue in chronic OM destroys bone (90% collagen) via collagenase enzymatic activity even without cholesteatoma. [[src|K14]]'],
                        ['Cholesterol granuloma', 'Granulation tissue with cholesterol crystals and giant cells caused by bleeding in a poorly aerated cavity. [[src|K14]]'],
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Bone erosion without cholesteatoma',
                    blocks: [
                        { t: 'p', x: 'Granulation tissue releases **collagenase**, digesting mucosa and bone (which is 90% collagen) even in the absence of cholesteatoma. The **long process of the incus** is especially vulnerable because it has a single blood supply without collaterals. [[src|K14]] [[src|C2]]' },
                    ],
                },
                { t: 'p', x: 'Unlike AOM, COM complications most commonly isolate ***Proteus mirabilis***, ***Pseudomonas aeruginosa***, and ***Enterococcus***. [[src|K15]]' },
                { t: 'p', x: 'Unlike the three-layered pars tensa, the **pars flaccida** (Shrapnell membrane) is deficient in its central fibrous layer. The **vascular strip** in the posterior-superior EAC supplies blood to the central portion of the TM. [[src|J5]]' },
                { t: 'p', x: 'The **ET** is two-thirds cartilaginous and one-third bony, with the **tensor veli palatini** serving as its primary dilator. Rapid weight loss can atrophy **Ostmann fat pad**, resulting in patulous ET syndrome. From infancy to adulthood, the ET grows from **18 mm and horizontal** at birth to **35 mm with a 45-degree inclination** in adults, increasing slope, length, diameter, and opening efficiency. During balloon Eustachian tuboplasty, advancement must stop once resistance is met at the **bony isthmus**. [[src|C2]] [[src|K14]] [[src|J5]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Adult ET inclination is keyed to **45 degrees** (18 mm horizontal at birth → 35 mm, 45° in adults). Jackler quotes ~30 degrees from the middle ear cavity and is dropped here. [[src|K14]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/tm-vascular-strip.png',
                    alt: 'Otoscopic illustration showing the posterior-superior ear canal vascular strip supplying the central tympanic membrane.',
                    cap: 'Posterior-superior EAC vascular strip supplying the central TM. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 5.4.',
                },
                { t: 'check', id: 'c1', q: 'How can chronic otitis media destroy ossicles or temporal bone when no cholesteatoma is present?', a: 'Granulation tissue releases collagenase that digests mucosa and bone (90% collagen), and the incus long process has a single collateral-free blood supply.' },
                { t: 'check', id: 'c2', q: 'Name the three organisms most commonly isolated in chronic otitis media complications, and explain what distinguishes silent otitis media from CSOM.', a: 'Proteus mirabilis, Pseudomonas aeruginosa, and Enterococcus. Silent OM is chronic middle ear inflammatory pathology behind an intact TM without perforation or otorrhea.' },
                { t: 'check', id: 'c3', q: 'How do Eustachian tube length and inclination change from infancy to adulthood, and what stops balloon advancement during Eustachian tuboplasty?', a: '18 mm and horizontal at birth to 35 mm with a 45-degree inclination in adults; balloon advancement stops on meeting resistance at the bony isthmus.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q1', 'cholesteatoma:q2', 'ear-anatomy:q48'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['com-et-anatomy'] }],
        },
        {
            id: 'perforations-retractions',
            ref: ['Otology/Traumatic tympanic membrane perforations heal spontaneously in the majority of cases without early surgery'],
            n: '1.2',
            title: 'Tympanic membrane perforations and retraction pockets',
            blocks: [
                { t: 'p', x: 'Conductive hearing loss from TM perforation affects low frequencies more, and for equal-sized perforations, **posterior perforations** cause greater hearing loss than anterior ones (though current evidence from Merchant and Rosowski shows perforation size, not location, determines the loss). **Marginal perforations** lack the fibrous annulus and are considered "unsafe" because EAC skin can easily advance into the middle ear to form cholesteatoma. [[src|E35]] [[src|E36]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why posterior perforations hurt hearing more',
                    blocks: [
                        { t: 'p', x: 'Posterior marginal TM perforations overlying the round window allow sound to strike the round window directly, creating **phase cancellation** against the oval window and worsening low-frequency CHL. [[src|J5]] [[src|E36]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Leave the traumatic clot',
                    blocks: [
                        { t: 'p', x: 'An overlying blood clot on a posttraumatic TM perforation should not be removed because it guides spontaneous healing. [[src|E40]]' },
                    ],
                },
                { t: 'p', x: 'Topographically, **60%** of TM retraction pockets (RPs) occur in the pars tensa (**36%** posterior-superior, **16%** inferior) and **40%** in the pars flaccida. In children with middle ear inflammation, mesenchyme in the TM lamina propria (normally resorbed in a few months) persists up to **3 years**, impairing elastin maturation and promoting RPs. [[src|K18]]' },
                {
                    t: 'table',
                    head: ['Sadé grade (pars tensa)', 'Finding'],
                    rows: [
                        ['Grade I', 'Mild TM retraction [[src|K18]]'],
                        ['Grade II', 'Retracted TM contacts incus or stapes [[src|E33]]'],
                        ['Grade III', 'Contacts promontory without adhesion [[src|K18]]'],
                        ['Grade IV', 'Adherent to promontory [[src|K18]]'],
                        ['Grade V', 'Spontaneous perforation with otorrhea or polyps [[src|K18]]'],
                    ],
                },
                { t: 'p', x: 'In the **Tos classification** of pars flaccida retraction, **Type IV** shows distinct bone resorption of the osseous annulus with retraction extending to the malleus head. Patients with **myringostapedopexy** generally maintain good hearing, so surgery is not indicated unless CHL or frequent otorrhea develops; long-term ventilation tubes do not alter the further evolution of atelectasis. Cartilage-perichondrial tympanoplasty for severe RPs achieved **0% graft failure** in grafted areas, though **13%** developed new pockets elsewhere. [[src|E33]] [[src|K18]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/tm-posterior-marginal-perf.png',
                    alt: 'Illustration of a posterior marginal tympanic membrane perforation overlying the round window niche.',
                    cap: 'Posterior marginal TM perforation over the round window niche. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 5.9.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/retraction-staging.jpg',
                    alt: 'Diagram illustrating staging of pars flaccida and pars tensa tympanic membrane retraction pockets relative to middle ear structures.',
                    cap: 'Pars flaccida and pars tensa retraction pocket staging. Kirtane, de Souza & Sanna, Otology and Neurotology (Thieme, 2013), Fig. 18.2.',
                },
                { t: 'check', id: 'c1', q: 'For two equal-sized TM perforations, why does a posterior marginal perforation cause more conductive hearing loss and carry higher risk than an anterior central perforation?', a: 'Direct sound entry over the round window causes phase cancellation (especially at low frequencies), and loss of the fibrous annulus lets EAC skin migrate medially into the middle ear.' },
                { t: 'check', id: 'c2', q: 'Distinguish Sadé Grade III from Grade IV pars tensa retraction, and state whether ventilation tubes halt long-term atelectasis progression.', a: 'Grade III contacts the promontory without adhesion, whereas Grade IV is adherent to the promontory; ventilation tubes do not modify the long-term evolution of atelectasis.' },
                { t: 'check', id: 'c3', q: 'A patient has a natural myringostapedopexy and normal conversational hearing without drainage. What is the management, and why do children with chronic middle ear inflammation form retraction pockets more readily?', a: 'Observe unless CHL or frequent otorrhea develops; persistent mesenchyme in the lamina propria (up to 3 years vs a few months normally) impairs elastin maturation.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q4', 'cholesteatoma:q5', 'ear-anatomy:q24'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['perforations-retractions'] }],
        },
        {
            id: 'tympanoplasty-technique',
            ref: [
                'Otology/Medial underlay fascia grafting avoids anterior blunting and lateral graft displacement',
                'Otology/Underlay and overlay tympanoplasty techniques have distinct advantages and complication profiles',
                'Otology/Cartilage island tympanoplasty resists negative middle ear pressure and recurrent retraction',
                'Otology/Cartilage palisade and butterfly inlay tympanoplasty techniques reinforce the reconstructed tympanic membrane against eustachian tubal negative pressure while preserving acoustic transmission',
            ],
            n: '1.3',
            title: 'Tympanoplasty techniques, grafts, and technical pitfalls',
            blocks: [
                { t: 'p', x: 'Microsurgical repair of chronic TM perforation achieves **well over 90% success** in experienced hands; reperforation occurs in **~5%** of myringoplasties, with revision indicated after a few months. In COM without cholesteatoma, **tympanoplasty alone** yields the same graft failure rate and postoperative hearing status as tympanoplasty with mastoidectomy. Perforations posterior to the malleus can be approached transcanally, whereas anterior perforations are best approached postauricularly for visualization. [[src|J5]] [[src|E41]] [[src|E53]]' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Underlay (standard)',
                            blocks: [
                                { t: 'p', x: 'Autologous temporalis fascia placed medial to the TM remnant; preferred for most myringoplasties for superior anatomical and functional results. [[src|E40]]' },
                            ],
                        },
                        {
                            h: 'Lateral / overlay',
                            blocks: [
                                { t: 'p', x: 'Fascia positioned **lateral to the TM remnant but medial to the malleus handle**; used when only a small anterior TM rim remains. Risks **anterior blunting** (insufficient anterior canal contouring) and **TM lateralization** (maximal CHL, shortened EAC, featureless membrane). [[src|J5]] [[src|E39]]' },
                            ],
                        },
                        {
                            h: 'Butterfly cartilage',
                            blocks: [
                                { t: 'p', x: 'Best suited for small- and medium-sized posterior or central perforations; for round perforations, tragal or conchal cartilage is cut with a dermatological punch **1 mm wider** than the measured perforation. Cartilage grafts also prepare for ossiculoplasty and resist reperforation. [[src|J5]]' },
                            ],
                        },
                    ],
                },
                {
                    t: 'ul',
                    items: [
                        'Remove large areas of myringosclerosis / dense tympanosclerotic plaques because they impair drum vibration and graft vascularity. [[src|J5]] [[src|E39]]',
                        'Freshen the perforation edge to promote graft attachment and reduce the risk of entrapped skin causing iatrogenic cholesteatoma. [[src|E36]]',
                        'Elevate anterior meatal skin **lateral-to-medial**; medial-to-lateral detachment from the annulus risks anterior angle blunting. [[src|E45]]',
                        'Block the tympanic orifice of the ET with saline-soaked Gelfoam to prevent the graft from falling into the tube. [[src|E45]]',
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Two absolute red lines',
                    blocks: [
                        { t: 'p', x: 'Never perform elective myringoplasty on an **only-hearing ear** (contraindicated). In tympanosclerosis with TM perforation and stapes fixation, surgery must be **staged**: myringoplasty first, followed by stapedotomy a few months later. [[src|E40]] [[src|E44]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/tympanoplasty-lateral-graft.png',
                    alt: 'Cross-section of lateral graft tympanoplasty showing fascia placed lateral to the tympanic membrane remnant and medial to the malleus handle.',
                    cap: 'Lateral graft placement lateral to TM remnant and medial to malleus handle. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 5.71.',
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/tympanoplasty-anterior-blunting.png',
                    alt: 'Illustration of anterior tympanomeatal angle blunting following lateral graft tympanoplasty.',
                    cap: 'Anterior tympanomeatal angle blunting after lateral graft tympanoplasty. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 5.79.',
                },
                { t: 'check', id: 'c1', q: 'Does adding a cortical mastoidectomy improve graft take or hearing in chronic otitis media without cholesteatoma?', a: 'No; tympanoplasty alone yields the same graft failure rate and postoperative hearing status as tympanoplasty with mastoidectomy.' },
                { t: 'check', id: 'c2', q: 'In lateral graft tympanoplasty, where is the fascia positioned relative to the TM remnant and the malleus handle, and what are the two signature complications?', a: 'Lateral to the TM remnant and medial to the malleus handle; anterior blunting (from insufficient anterior canal contouring) and TM lateralization (maximal CHL, shortened EAC, featureless drum).' },
                { t: 'check', id: 'c3', q: 'Why must anterior meatal skin be elevated lateral-to-medial, and how do you handle a dry perforation with a fixed tympanosclerotic stapes?', a: 'Medial-to-lateral detachment from the annulus risks anterior angle blunting; stage surgery—myringoplasty first, then stapedotomy a few months later.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q7', 'cholesteatoma:q8', 'cholesteatoma:q9'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['tympanoplasty-technique'] }],
        },
        {
            id: 'peds-adult-com-timing',
            ref: ['Otology/Tympanostomy tube placement follows guideline criteria for chronic effusion and recurrent acute otitis media'],
            n: '1.4',
            title: 'Pediatric vs adult COM and tympanoplasty timing',
            blocks: [
                { t: 'p', x: 'In children, a **healthy contralateral ear** predicts tympanoplasty success more reliably than patient age alone. Pediatric TM perforation closure rates are significantly lower below index ages **9, 13, and 15 years** because of adenoid hypertrophy, immature ET function, and higher incidence of AOM. Elective pediatric tympanoplasty is often delayed until around **age 10 years**, though earlier surgery is reasonable for troublesome otorrhea or hearing loss. [[src|P16]]' },
                {
                    t: 'table',
                    head: ['Feature', 'Pediatric', 'Adult'],
                    rows: [
                        ['Eustachian tube', '18 mm, horizontal at birth [[src|K14]]', '35 mm, 45° inclination [[src|K14]]'],
                        ['TM lamina propria', 'Mesenchyme persists up to 3 years with inflammation, impairing elastin [[src|K18]]', 'Mature fibrous layer [[src|K18]]'],
                        ['Tympanoplasty timing', 'Often delayed to ~10 years; earlier if troublesome otorrhea or hearing loss; healthy contralateral ear > age alone [[src|P16]]', 'No age delay [[src|P16]]'],
                        ['Failure drivers', 'Adenoid hypertrophy, immature ET, higher AOM [[src|P16]]', 'Anterior rim loss, technical blunting or lateralization [[src|J5]]'],
                        ['Anesthesia', 'General anesthesia [[src|E40]]', 'Often local anesthesia [[src|E40]]'],
                        ['Isolated ossiculoplasty', 'Defer to age 5–7 years for ET maturation [[src|K17]]', 'No developmental delay [[src|K17]]'],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Pediatric tympanoplasty timing is keyed to Cummings Pediatric Ch. 16: elective repair is often delayed until around age 10 (lower closure below index ages 9, 13, and 15), with contralateral ear status more reliable than age alone, and earlier repair reasonable for troublesome otorrhea or hearing loss. Kirtane defers isolated ossicular reconstruction (without chronic disease) to age 5–7 years for ET maturation, while Sanna states myringoplasty is indicated regardless of age. Do not memorize a single rigid cut-off age. [[src|P16]] [[src|K17]] [[src|E40]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/cholesteatoma/post-tube-perforation.png',
                    alt: 'Illustration of a small residual anterior tympanic membrane perforation following tympanostomy tube extrusion.',
                    cap: 'Residual anterior TM perforation after tympanostomy tube extrusion. Jackler, Ear Surgery Illustrated (Thieme, 2019), Fig. 5.7.',
                },
                { t: 'check', id: 'c1', q: 'What clinical finding predicts pediatric tympanoplasty success more reliably than patient age alone, and what three factors worsen outcomes in younger children?', a: 'A healthy contralateral ear; adenoid hypertrophy, immature Eustachian tube function, and higher incidence of AOM.' },
                { t: 'check', id: 'c2', q: 'When is it reasonable to perform pediatric tympanoplasty before age 10 rather than delaying?', a: 'When the perforation causes troublesome otorrhea or hearing loss.' },
                { t: 'practice', title: 'Apply it', refs: ['cholesteatoma:q11', 'cholesteatoma:q10'] },
            ],
            drill: [{ m: 'cholesteatoma', c: ['peds-adult-com-timing'] }],
        },
    ],
};
