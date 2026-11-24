/* =============================================================
   Entering the tube
   OKSAT · Interactive learning · iac-anatomy · chapter 5
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'approaches',
    title: 'Entering the tube',
    kicker: '5 · Surgical corridors',
    review: 'draft',
    lede: 'Translabyrinthine, middle cranial fossa, and retrosigmoid surgeons enter the same internal auditory canal from lateral, above, and behind—each seeing a different slice of the fundus and paying a different price in hearing and exposure.',
    src: 'House Clinic Atlas Ch. 3, 5, 6 · Kirtane Ch. 31 · Jackler Ch. 9–10 · Sahana 2023 · Maina 2007',
    tldr: [
        '**Translabyrinthine:** from lateral, whole canal exposed, hearing gone. [[src|HCA6]]',
        '**Middle fossa:** from above, facial nerve on top, hearing kept; tight at the fundus. [[src|HCA3]]',
        '**Retrosigmoid:** from behind, medial two-thirds only; the lateral third hides behind the posterior canal. [[src|HCA5]]',
        'Choice follows hearing, tumour size, and fundal extent; management lives in the *vestibular-schwannoma* module. [[src|K31]] [[src|HCA3]] [[src|HCA6]]',
    ],
    sections: [
        {
            id: 'ap-frame',
            n: '5.1',
            title: 'One fundus, three views',
            blocks: [
                {
                    t: 'p',
                    x: 'The three surgical corridors see the same **IAC** from lateral (translabyrinthine), above (middle fossa), and behind (retrosigmoid); the fundus explorer turns the nerves to match each vector.',
                },
                {
                    t: 'p',
                    x: 'The translabyrinthine approach exposes the whole facial nerve from the brainstem to the stylomastoid foramen. [[src|HCA6 p68]] Complete intratemporal facial nerve exposure in a hearing ear requires a combined middle fossa plus transmastoid approach, whereas in a deaf ear the translabyrinthine approach achieves it alone. [[src|J9 fig 9.23]]',
                },
                {
                    t: 'layers',
                    id: 'ap-frame-ly',
                    alt: 'Axial schematic of the right petrous bone showing the internal auditory canal, cochlea, vestibule, posterior semicircular canal, vestibular aqueduct, sigmoid sinus, and posterior fossa, with toggleable overlays for the translabyrinthine, middle fossa, and retrosigmoid corridors.',
                    base: 'images/oksat/iac-anatomy/corridors-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'tl', label: 'Translabyrinthine: from lateral, through the labyrinth', src: 'images/oksat/iac-anatomy/corridors-translab.svg' },
                        { id: 'mcf', label: 'Middle fossa: from above', src: 'images/oksat/iac-anatomy/corridors-mcf.svg' },
                        { id: 'rs', label: 'Retrosigmoid: from behind, through the posterior lip', src: 'images/oksat/iac-anatomy/corridors-retrosigmoid.svg' },
                    ],
                    on: ['tl'],
                    cap: 'Schematic, right side, from above. Each corridor sees a different part of the same canal. Sources: House Clinic Atlas ch. 3, 5, 6.',
                },
                { t: 'check', id: 'c1', q: 'Which corridor sees the lateral third of the canal with hearing kept?', a: 'Middle fossa.' },
                { t: 'check', id: 'c2', q: 'How is complete intratemporal facial nerve exposure achieved in a hearing ear versus a deaf ear?', a: 'Middle fossa plus transmastoid in a hearing ear; translabyrinthine alone in a deaf ear.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-frame'] }],
        },
        {
            id: 'ap-translab',
            ref: ['Otology/The translabyrinthine approach provides direct exposure of the internal auditory canal with complete hearing sacrifice'],
            n: '5.2',
            title: 'Translabyrinthine',
            blocks: [
                {
                    t: 'p',
                    x: 'The translabyrinthine corridor is the most direct route to the **CPA**, with hearing sacrificed; it applies to tumours of any size when hearing is poor, and to tumours > 2 cm where hearing preservation is very unlikely. [[src|HCA6 p68]] It gives early facial nerve identification in the labyrinthine segment, with the tumour visible extradurally and little retraction. [[src|HCA6]]',
                },
                {
                    t: 'p',
                    x: 'Inferior bone removal extends to the **jugular bulb**, working around or in front of a high bulb; [[src|HCA6 p75]] drilling stops at the **cochlear aqueduct**, with cranial nerves IX–XI lying below it. [[src|HCA6 p77]] The superior border of the **IAC** is marked by the superior canal ampulla and the inferior border by the posterior canal ampulla. [[src|HCA6 p75, p77]]',
                },
                {
                    t: 'p',
                    x: 'Apical air cells above the canal are waxed, [[src|HCA6 p78]] and the Eustachian tube is plugged with the middle ear obliterated against **CSF** rhinorrhea. [[src|HCA6 p77]] At the fundus, **Bill\'s bar** separates the facial canal from the superior vestibular canal, and the facial nerve runs slightly superior as it leaves; [[src|HCA6 p78]] the **SVN** is stimulated, then divided and reflected posteriorly to open the facial nerve plane. [[src|HCA6 p80–81]]',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Find the nerve before the tumour',
                    blocks: [
                        { t: 'p', x: 'A right-angle hook rises over the vertical crest to identify the labyrinthine facial nerve. [[src|HCA6 p81]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is the inferior limit of translabyrinthine drilling?', a: 'The cochlear aqueduct (with cranial nerves IX–XI lying below it).' },
                { t: 'check', id: 'c2', q: 'Which ampulla marks the superior border of the IAC?', a: 'The superior canal ampulla (the posterior canal ampulla marks the inferior border).' },
                { t: 'check', id: 'c3', q: 'Why plug the Eustachian tube and obliterate the middle ear?', a: 'Against CSF rhinorrhea.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q29'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-translab'] }],
        },
        {
            id: 'ap-mcf',
            ref: ['Otology/The middle cranial fossa approach provides hearing preservation for intracanalicular schwannomas with lateral fundus extension'],
            n: '5.3',
            title: 'Middle fossa',
            blocks: [
                {
                    t: 'p',
                    x: 'The middle fossa corridor preserves hearing; House Clinic criteria are tumours ≤ 2 cm with serviceable hearing, as hearing preservation is extremely unlikely > 2 cm. [[src|HCA3 p40, p50–51]] Elevate the dura from posterior to anterior because the **geniculate ganglion** is dehiscent in ~16%. [[src|HCA3 p43]]',
                },
                {
                    t: 'p',
                    x: 'Start drilling medially at the **porus**, the safe zone, where 270° of bone can be removed. [[src|HCA3 p42, p45]] Laterally, the **cochlea** lies ≤ 1 mm in front of the labyrinthine segment, the **SVN** can be followed half the labyrinthine length before the ampulla, and there is ~2.5 mm from the cochlear base to the ampulla, so use ≤ 2 mm burrs. [[src|HCA3 p45, figs 3.6–3.7]]',
                },
                {
                    t: 'p',
                    x: 'The dura is opened posteriorly; the facial nerve lies in the anterior canal, on top. Dissect medial to lateral to avoid avulsing cochlear fibres, and preserve the internal auditory artery. [[src|HCA3 p45]] The middle meningeal artery marks the anterior limit; [[src|HCA3 p41]] in the extended approach, watch the vein of Labbé. [[src|HCA3 p49]]',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'Size cutoff: ≤ 2 cm (House Clinic) [[src|HCA3 p40]] versus < 1.5 cm favouring retrosigmoid-retrolabyrinthine in the Sanna algorithm. [[src|K31]] Full management lives in the *vestibular-schwannoma* module.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'The nerve is on top',
                    blocks: [
                        { t: 'p', x: 'From above, CN VII is the first structure over the tumour. [[src|HCA3 p45]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why elevate the dura from posterior to anterior?', a: 'Because the geniculate ganglion is bare (dehiscent) in ~16%.' },
                { t: 'check', id: 'c2', q: 'Where do you start drilling from above?', a: 'Medially, at the porus (the safe zone).' },
                { t: 'check', id: 'c3', q: 'What lies ≤ 1 mm in front of the labyrinthine segment?', a: 'The cochlea.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q31'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-mcf'] }],
        },
        {
            id: 'ap-mcf-landmarks',
            n: '5.4',
            title: 'Finding the canal from above',
            blocks: [
                {
                    t: 'p',
                    x: 'Three landmark methods locate the hidden **IAC** under the middle fossa floor, bearing in mind that the arcuate eminence does not always sit over the superior canal: [[src|HCA3 p42]]',
                },
                {
                    t: 'ul',
                    items: [
                        '**House:** follow the **GSPN** back to the geniculate, then the labyrinthine segment into the canal. [[src|House 1961]] [[src|HCA3]]',
                        '**Fisch:** use the canal\'s angle from the arcuate eminence or superior canal—45–60° [[src|HCA3 p44]] or about 60°, [[src|HCA3 p49]] and 73.5 ± 11.7° on **CT**. [[src|Sahana 2023]]',
                        '**Garcia-Ibañez:** bisect the angle between the arcuate eminence and the **GSPN**—126 ± 12° on **CT**, giving a bisector of 63 ± 6°; [[src|Sahana 2023]] judged the simplest and most reliable in a cadaver study. [[src|Maina 2007]]',
                    ],
                },
                {
                    t: 'layers',
                    id: 'ap-mcf-landmarks-ly',
                    alt: 'Schematic of the right middle fossa floor viewed from above, showing the petrous ridge, superior petrosal sinus, middle meningeal artery, GSPN, geniculate ganglion, arcuate eminence, superior canal, underlying IAC, cochlea, and ampulla, with toggleable overlays for the House, Fisch, and Garcia-Ibañez landmark methods.',
                    base: 'images/oksat/iac-anatomy/mcf-base.svg',
                    mode: 'toggle',
                    layers: [
                        { id: 'follow', label: 'House: follow the GSPN back to the geniculate, then the labyrinthine segment into the canal', src: 'images/oksat/iac-anatomy/mcf-follow-gspn.svg' },
                        { id: 'sixty', label: 'Fisch: the canal\'s angle from the arcuate eminence', src: 'images/oksat/iac-anatomy/mcf-sixty.svg' },
                        { id: 'bisect', label: 'Garcia-Ibañez: bisect the angle between the arcuate eminence and the GSPN', src: 'images/oksat/iac-anatomy/mcf-bisector.svg' },
                    ],
                    on: ['follow'],
                    cap: 'Schematic, right side, from above. Start medially at the porus, the safe end; the fundus is tight between the cochlea in front and the ampulla behind. Source: House Clinic Atlas ch. 3.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'All three angles have wide ranges. [[src|Sahana 2023]] [[src|Maina 2007]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is the Garcia-Ibañez method for finding the IAC from above?', a: 'Bisect the arcuate eminence–GSPN angle.' },
                { t: 'check', id: 'c2', q: 'Why is the arcuate eminence unreliable alone?', a: 'Its relation to the superior semicircular canal is inconstant.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-mcf-landmarks'] }],
        },
        {
            id: 'ap-retrosig',
            ref: ['Otology/The retrosigmoid suboccipital approach allows hearing preservation for small to medium vestibular schwannomas'],
            n: '5.5',
            title: 'Retrosigmoid',
            blocks: [
                {
                    t: 'p',
                    x: 'The retrosigmoid approach preserves hearing and is used for tumours mainly in the **CPA** with little canal extension. [[src|HCA5 p59]] The **porus** is the focal point; drilling its posterior lip is limited by the posterior canal: 5 mm reliably, up to 10 mm in selected cases [[src|HCA5 p60]]—usually the medial two-thirds, as the lateral third risks the vestibule or common crus. [[src|HCA5 p63]] The vestibular aqueduct is the lateral limit in hearing preservation. [[src|HCA5 p67]]',
                },
                {
                    t: 'p',
                    x: 'Dissect medial to lateral; the facial nerve is found more anteriorly along the brainstem. [[src|HCA5 p65]] Watertight dural closure is generally impossible; air cells at the posterior lip are waxed and covered with fat, **CSF** leaks are commoner because apical cells are hard to seal, and postoperative headache may come from bone dust. [[src|HCA5 p65–66]] Residual tumour at the fundus is ~7% versus 0% translabyrinthine. [[src|K31]]',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'The blind spot',
                    blocks: [
                        { t: 'p', x: 'The lateral third of the canal sits behind the posterior canal and common crus. [[src|HCA5 p63]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'How much canal can be exposed safely through a retrosigmoid approach?', a: '5 mm reliably, up to 10 mm in selected cases (usually the medial two-thirds).' },
                { t: 'check', id: 'c2', q: 'What is the lateral limit in hearing preservation?', a: 'The vestibular aqueduct.' },
                { t: 'check', id: 'c3', q: 'Why are CSF leaks commoner after retrosigmoid surgery?', a: 'Apical air cells are hard to seal, and watertight dural closure is generally impossible.' },
                { t: 'practice', title: 'Apply it', refs: ['vestibular-schwannoma:q30', 'vestibular-schwannoma:q38'] },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-retrosig'] }],
        },
        {
            id: 'ap-extend',
            ref: [
                'Otology/The transcochlear approach expands the translabyrinthine corridor through posterior facial nerve rerouting and cochlear drill-out to access the prepontine space and ventral clivus',
                'Otology/Auditory Brainstem Implantation ABI bypasses the cochlea and cochlear nerve to stimulate the cochlear nucleus in NF2',
            ],
            n: '5.6',
            title: 'Beyond the three',
            blocks: [
                {
                    t: 'deep',
                    title: 'Go deeper · Chief — Extensions, ABI and selective neurectomy',
                    blocks: [
                        {
                            t: 'p',
                            x: 'The **transcochlear** approach extends translabyrinthine exposure by rerouting the facial nerve posteriorly and drilling out the cochlea. [[src|sk.oto]] An auditory brainstem implant (**ABI**) bypasses the cochlea and cochlear nerve. [[src|sk.oto]]',
                        },
                        {
                            t: 'p',
                            x: 'Selective vestibular nerve section and singular neurectomy are seldom done today. [[src|J10 p402]] Vestibular neurectomy is most reliable laterally, before the nerves fuse. [[src|Owner]]',
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Where is selective vestibular neurectomy most reliable, and why?', a: 'Laterally, before the nerves fuse.' },
                { t: 'check', id: 'c2', q: 'How does the transcochlear approach extend translabyrinthine exposure?', a: 'By rerouting the facial nerve posteriorly and drilling out the cochlea.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-extend'] }],
        },
        {
            id: 'ap-choose',
            ref: [
                'Otology/The translabyrinthine approach provides direct exposure of the internal auditory canal with complete hearing sacrifice',
                'Otology/The middle cranial fossa approach provides hearing preservation for intracanalicular schwannomas with lateral fundus extension',
                'Otology/The retrosigmoid suboccipital approach allows hearing preservation for small to medium vestibular schwannomas',
            ],
            n: '5.7',
            title: 'Choosing by anatomy',
            blocks: [
                {
                    t: 'table',
                    head: ['Hearing', 'Tumour & fundal anatomy', 'Corridor'],
                    rows: [
                        ['Poor hearing', 'Any size [[src|HCA6]]', '**Translabyrinthine**'],
                        ['Serviceable hearing', 'Small, intracanalicular (House Clinic: ≤ 2 cm) [[src|HCA3]]', '**Middle fossa**'],
                        ['Serviceable hearing', '**CPA**-dominant, no fundal extension [[src|HCA5]] [[src|K31]]', '**Retrosigmoid**'],
                    ],
                },
                {
                    t: 'p',
                    x: 'Fundal extension and a **CSF** cap matter when judging hearing preservation (covered in the Imaging chapter), while everything else—observation and radiosurgery—belongs to *vestibular-schwannoma*. Meningiomas displace rather than invade CN VII and CN VIII, so a hearing-preserving corridor may still be chosen even for large ones. [[src|HCA6 p69]]',
                },
                { t: 'check', id: 'c1', q: 'Serviceable hearing with a tumour filling the fundus: which corridor reaches the fundus?', a: 'Middle fossa (retrosigmoid cannot see the lateral third).' },
                { t: 'check', id: 'c2', q: 'Why may a hearing-preserving corridor still be chosen for a large CPA meningioma?', a: 'Meningiomas displace rather than invade CN VII and CN VIII.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['ap-choose'] }],
        },
    ],
};
