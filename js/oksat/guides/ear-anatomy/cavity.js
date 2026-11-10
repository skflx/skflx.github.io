/* =============================================================
   The tympanic cavity: six walls
   OKSAT · Interactive learning · ear-anatomy · chapter 5
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'cavity',
    title: 'The tympanic cavity: six walls',
    kicker: '5 · Middle ear',
    review: 'draft',
    lede: 'A narrow box standing on edge: dura above, jugular bulb below, carotid in front, mastoid behind, labyrinth medially, drum laterally. Learn it wall by wall, then by what each wall hides.',
    src: 'Glasscock Ch. 1–2 · Cummings Review Ch. 2 · Handbook Ch. 3',
    tldr: [
        'A slit: about 15 mm high and long, about 6 mm wide in the attic, **2 mm** between umbo and promontory, 4 mm in the hypotympanum.',
        'Medial wall: **promontory** with Jacobson nerve, **oval window** posterosuperior, **round window** posteroinferior, tympanic **facial nerve** above the oval window, **cochleariform process** at its anterior end.',
        'Retrotympanum: **ponticulus** and **subiculum** bound the **sinus tympani** (medial to the facial nerve); the **facial recess** is lateral to it, medial to the chorda.',
        'Anterior wall top to bottom: tensor semicanal, Eustachian tube orifice, carotid wall. Floor: plate over the **jugular bulb** with the inferior tympanic canaliculus.',
        'Facial nerve dehiscence over the oval window: **25–55%** of temporal bones; geniculate ganglion 10–20%.',
    ],
    sections: [
        {
            id: 'cav-box',
            n: '5.1',
            title: 'Compartments and dimensions',
            blocks: [
                { t: 'p', x: 'The tympanic cavity is a sagittally oriented slit immediately medial to the drum, continuous in front with the Eustachian tube and behind with the mastoid through the aditus and antrum. Its height and anteroposterior length are each about **15 mm**; its width is about **6 mm** in the attic, about **2 mm** between the umbo and the promontory, and about **4 mm** in the hypotympanum. [[src|Glasscock Ch. 2]] [[src|Gray\'s Anatomy, cited secondhand]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/ear-anatomy/cavity-box.svg',
                    alt: 'A net of the tympanic cavity: the medial wall in the centre with the roof above, the floor below, the posterior wall to the left and the anterior wall to the right, and the lateral wall shown apart; each panel lists its main structures.',
                    label: 'Figure · the box opened out',
                    cap: 'Medial wall in the centre, each neighbour hinged on its shared edge. Schematic.',
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the middle is narrowest',
                    blocks: [
                        { t: 'p', x: 'The drum cones medially to the umbo while the promontory bulges laterally, so the two surfaces nearly meet. A retracted drum touches the promontory first: the start of adhesive otitis media.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Give the widths of the attic, the mesotympanum at the umbo and the hypotympanum.', a: 'About 6 mm, 2 mm and 4 mm.' },
                { t: 'check', id: 'c2', q: 'Name what lies beyond each of the six walls.', a: 'Lateral: canal. Medial: cochlea and vestibule. Roof: middle fossa dura. Floor: jugular bulb. Anterior: internal carotid artery. Posterior: mastoid and the mastoid facial nerve.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q30', 'ear-anatomy:q31'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['cav-box'] }],
        },
        {
            id: 'cav-lateral',
            n: '5.2',
            title: 'Lateral wall',
            blocks: [
                { t: 'p', x: 'Mostly the drum. Above it the bony **scutum** (lateral attic wall) and the **notch of Rivinus**. Posteriorly the chorda enters through the **iter chordae posterius**, in the chordal eminence lateral to the pyramid, then runs forward across the drum, medial to it and between the incus and the malleus. Anteriorly it leaves through the **canal of Huguier** beside the **petrotympanic fissure**, which also carries the anterior malleal ligament and the anterior tympanic artery. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Opening', 'Wall', 'Transmits'],
                    rows: [
                        ['Iter chordae posterius', 'Posterior (chordal eminence)', 'Chorda tympani in; posterior tympanic artery'],
                        ['Canal of Huguier, petrotympanic fissure', 'Anterior', 'Chorda tympani out; anterior malleal ligament; anterior tympanic artery'],
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl',
                    blocks: [
                        { t: 'p', x: 'Raising a tympanomeatal flap, the chorda is met first just under the posterosuperior annulus. Curette scutum there with the chorda in view.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Where does the chorda enter and leave the tympanic cavity?', a: 'Enters posteriorly through the iter chordae posterius (chordal eminence); leaves anteriorly through the canal of Huguier at the petrotympanic fissure.' },
                { t: 'check', id: 'c2', q: 'Which structures pass the petrotympanic fissure with the chorda?', a: 'The anterior malleal ligament (with the anterior process) and the anterior tympanic artery.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q32'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['cav-lateral'] }],
        },
        {
            id: 'cav-medial',
            n: '5.3',
            title: 'Medial wall',
            blocks: [
                { t: 'p', x: 'The **promontory** is the bulge of the basal turn of the cochlea. **Jacobson nerve** climbs over it and forms the **tympanic plexus**, joined by caroticotympanic sympathetic fibres; the plexus gives the **lesser petrosal nerve**, which leaves for the otic ganglion and the parotid. The **oval window** niche, holding the stapes footplate, lies posterosuperior to the promontory; the **round window** niche lies posteroinferior, under a bony lip, its true membrane usually hidden by a mucosal veil. [[src|Glasscock Ch. 2]]' },
                { t: 'p', x: 'Above the oval window runs the tympanic **facial nerve** in the fallopian canal, with the **lateral semicircular canal** above and behind it. At its anterior end the **cochleariform process** turns the tensor tendon 90°; the nerve runs immediately superior to it, and the **geniculate ganglion** with the **greater petrosal nerve** lies just anterosuperior. Behind the oval window the **ponticulus** runs to the pyramid; the **subiculum** forms the posterior lip of the round window niche; the **finiculus** lies in front of the round window niche. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'hotspot',
                    id: 'cav-medial-hs',
                    alt: 'Medial wall of the right tympanic cavity seen from lateral, with the promontory, Jacobson nerve, oval window and stapes, round window niche, facial nerve running back and slightly down from the geniculate ganglion, above the cochleariform process, to the second genu, second genu, lateral canal, cog, tensor, geniculate ganglion, greater petrosal nerve, pyramid, posterior sinus, ponticulus, sinus tympani, subiculum, subtympanic sinus, finiculus, styloid eminence, Eustachian tube, carotid wall and hypotympanum.',
                    modes: ['explore', 'find'],
                    frames: [{ src: 'images/oksat/ear-anatomy/medial-wall.svg', cap: 'Right ear, medial wall from lateral, drum, malleus and incus removed; anterior to the right. Relations follow an endoscopic cadaver tour (Kalmanson, Yang, Mann). Explore first, then Find. Schematic.' }],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Dehiscence',
                    blocks: [
                        { t: 'p', x: 'The tympanic facial nerve is dehiscent over the oval window in **25–55%** of temporal bones, and the geniculate ganglion in **10–20%**. Assume bare nerve until you have seen bone. Why the range is so wide is an appraisal question (histologic versus surgical series). [[src|Cummings Review Ch. 2]]' },
                    ],
                },
                { t: 'neighbors', id: 'cav-medial-nb1', g: 'promontory', label: 'Neighbours of the promontory' },
                { t: 'neighbors', id: 'cav-medial-nb2', g: 'cochleariform', label: 'Neighbours of the cochleariform process' },
                { t: 'check', id: 'c1', q: 'Which way does the tympanic facial nerve run from the geniculate ganglion?', a: 'Posteriorly and slightly downward, above the cochleariform process and the oval window, to the second genu by the pyramid.' },
                { t: 'check', id: 'c2', q: 'Trace the lesser petrosal nerve from its source.', a: 'Jacobson nerve (IX) on the promontory → tympanic plexus → lesser petrosal nerve → middle fossa → otic ganglion → auriculotemporal nerve → parotid.' },
                { t: 'check', id: 'c3', q: 'Where does the round window niche face, and what forms its posterior lip?', a: 'Posteroinferiorly, under a bony overhang; the subiculum.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q33', 'ear-anatomy:q35'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['cav-medial'] }],
        },
        {
            id: 'cav-roof-floor',
            n: '5.4',
            title: 'Roof and floor',
            blocks: [
                { t: 'p', x: 'The roof is the **tegmen tympani**, a thin plate that is also part of the floor of the middle fossa, crossed by the petrosquamous suture. The floor is an irregular plate over the **jugular bulb**, pierced by the **inferior tympanic canaliculus** in the crest between the jugular fossa and the carotid canal: Jacobson nerve and the inferior tympanic artery (ascending pharyngeal) enter here. Hypotympanic air cells pit the floor. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Why the floor can be bare',
                    blocks: [
                        { t: 'p', x: 'The hypotympanum develops late in fetal life, between 22 and 32 weeks, from three kinds of bone: tympanic bone, the canalicular otic capsule and a petrosal ledge. The seams can fail, leaving the bulb bare in the middle ear. [[src|Glasscock Ch. 1]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Variant: high or dehiscent jugular bulb',
                    blocks: [
                        { t: 'p', x: 'A blue mass behind the posteroinferior drum. It may be a high bulb or a paraganglioma, and definitions of a high bulb vary between sources; what matters on the day is not to biopsy or incise it. Imaging settles it.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What passes through the inferior tympanic canaliculus?', a: 'Jacobson nerve (tympanic branch of IX) and the inferior tympanic artery.' },
                { t: 'check', id: 'c2', q: 'What lies above the tegmen tympani?', a: 'Middle fossa dura and the temporal lobe.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q36', 'ear-anatomy:q37'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['cav-roof-floor'] }],
        },
        {
            id: 'cav-anterior',
            n: '5.5',
            title: 'Anterior wall',
            blocks: [
                { t: 'p', x: 'Top to bottom: the **tensor tympani semicanal**, whose bulge dominates the anterior mesotympanum; immediately below it the **tympanic orifice of the Eustachian tube**, a few millimetres above the floor; then the thin **carotid wall**, pierced by the caroticotympanic canaliculi. The internal carotid artery lies just anteromedial to the protympanum. Above the tensor fold is the **supratubal recess**, part of the anterior epitympanum, bounded behind by the cog above and the cochleariform process below, with the **geniculate ganglion** in its medial wall. [[src|Glasscock Ch. 2]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Variant: aberrant internal carotid artery',
                    blocks: [
                        { t: 'p', x: 'A pulsatile red mass behind the anteroinferior drum with no carotid canal on CT. Like a dehiscent bulb, it is diagnosed before anyone touches it.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'List the anterior wall from top to bottom.', a: 'Tensor tympani semicanal, Eustachian tube orifice, carotid wall with caroticotympanic canaliculi.' },
                { t: 'check', id: 'c2', q: 'What bounds the supratubal recess posteriorly?', a: 'The cochleariform process below and the cog above.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q38', 'ear-anatomy:q39'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['cav-anterior'] }],
        },
        {
            id: 'cav-posterior',
            n: '5.6',
            title: 'Posterior wall',
            blocks: [
                { t: 'p', x: 'From above down: the **aditus ad antrum** opening to the mastoid, the **fossa incudis** holding the short process of the incus, the **pyramidal eminence** from which the stapedius tendon emerges, the **chordal eminence** lateral to it with the iter chordae, and the **styloid eminence** below. The stapedius lies in a vertical sulcus beside the mastoid facial nerve, which supplies it through the nerve to stapedius. [[src|Glasscock Ch. 2]]' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        { h: 'Facial recess', blocks: [{ t: 'p', x: 'Lateral to the mastoid facial nerve, medial to the chorda (which is medial to the annulus), capped by the incus buttress. Opened from the mastoid as a posterior tympanotomy, it shows the incudostapedial joint, stapes, pyramid and round window niche. [[src|Cummings Review Ch. 2]]' }] },
                        { h: 'Sinus tympani', blocks: [{ t: 'p', x: 'Medial to the mastoid facial nerve, between the ponticulus above and the subiculum below, with the posterior canal medially; its posterior extent varies from shallow to deep. Hidden from the microscope through the canal and through the facial recess; an angled endoscope reaches it. [[src|Glasscock Ch. 2]]' }] },
                    ],
                },
                { t: 'neighbors', id: 'cav-posterior-nb', g: 'pyramid', label: 'Neighbours of the pyramidal eminence' },
                { t: 'check', id: 'c1', q: 'A posterior tympanotomy reaches the middle ear through which space, and what does it preserve?', a: 'The facial recess, between the facial nerve and the chorda below the incus buttress; it preserves the posterior canal wall.' },
                { t: 'check', id: 'c2', q: 'Why does residual cholesteatoma favour the sinus tympani?', a: 'It lies medial to the facial nerve, out of the line of sight of the microscope through the canal or the facial recess.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q34', 'ear-anatomy:q40'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['cav-posterior'] }],
        },
    ],
};
