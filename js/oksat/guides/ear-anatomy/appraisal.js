/* =============================================================
   Evidence and controversies
   OKSAT · Interactive learning · ear-anatomy · chapter 13
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'appraisal',
    title: 'Evidence and controversies',
    kicker: '13 · Appraisal',
    review: 'draft',
    lede: 'Three places where normal anatomy is taught as one answer and measured as several. Each card gives the board answer, the competing view, why the method behind it is weak, and what to say on the exam and in the operating room.',
    src: 'PubMed 2026-11 · Cummings Review Ch. 2 · Glasscock Ch. 1–3 · Handbook Ch. 3',
    tldr: [
        '**Arch origin.** Board: three hillocks on each arch, ossicles split by arch. A human embryo series and lineage work argue for a different split, but they infer from nerves or from other species.',
        '**Dehiscence.** Reported rates run from a few percent to two thirds, because the studies count different things in different bones: microscopic gaps, bare nerve at surgery, thin bone on CT, healthy versus diseased ears.',
        '**Transformer.** The quoted 20:1 area ratio, 1.3:1 lever and 28 dB are idealized; the measured gain is lower and falls with frequency. Which area you count changes the ratio.',
        'Proctor and Marchioni retrotympanum names are vocabulary, not competing findings.',
        'Rule: give the board answer on the exam; in the operating room trust what you see and the imaging.',
    ],
    sections: [
        {
            id: 'ap-arches',
            n: '13.1',
            title: 'Ossicular arch origin and the hillocks of His',
            blocks: [
                { t: 'p', x: 'The board answer is taught everywhere in this guide and is the one to give on an exam. This card only notes where it is contested, briefly.' },
                {
                    t: 'kv',
                    rows: [
                        ['Board answer', 'Six hillocks: 1–3 first arch (tragus, helical crus, helix), 4–6 second arch (antihelix, antitragus, lobule). Ossicles: malleus head and neck and incus body and short process first arch; manubrium, incus long process and stapes superstructure second arch; footplate from the otic capsule. [[src|Handbook Ch. 3]] [[src|Glasscock Ch. 1]]'],
                        ['Competing view', 'A study of 22 human embryos at 28–60 days found hillocks absent at most stages and the auricle innervated almost entirely by facial nerve branches, with trigeminal fibres only to the tragus and anterior canal; it concludes that almost the whole auricle is second arch. [[src|Laryngoscope 2020]] For the ossicles, a review of mouse and chick work describes cells of different origin (neural crest, mesoderm, endoderm) meeting and signalling to each other, so a first-arch or second-arch label is too coarse. [[src|Hear Res 2013]]'],
                        ['Method weakness', 'The embryo study infers lineage from nerve supply, and a nerve territory is not a cell lineage; it rests on one collection of 22 fixed specimens, all from the first two months. The lineage work is mouse and chick, and human ears are not mice. Neither tested the board split directly in humans.'],
                        ['On the exam', 'Give the three and three, and the ossicle split as taught. Add that 4–6 is the disputed half.'],
                        ['In the operating room', 'The arch label changes nothing you see or do. Auricular and ossicular anomalies are managed from the examination and the imaging.'],
                    ],
                },
                { t: 'check', id: 'c1', q: 'State the board hillock assignments and name which half is disputed.', a: 'Hillocks 1–3 first arch (tragus, helical crus, helix); 4–6 second arch (antihelix, antitragus, lobule). The second-arch half is the disputed one.' },
                { t: 'check', id: 'c2', q: 'Why is nerve supply a weak basis for deciding which arch the auricle came from?', a: 'A nerve territory records which nerve grew into the tissue, not which cells formed it, and the data came from fixed embryos with few specimens.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q146', 'ear-anatomy:q148'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ap-arches'] }],
        },
        {
            id: 'ap-dehiscence',
            n: '13.2',
            title: 'Facial canal dehiscence prevalence',
            blocks: [
                { t: 'p', x: 'The cavity chapter gives 25–55% of temporal bones dehiscent over the oval window and 10–20% at the geniculate ganglion. Newer studies agree with that range in some bones and differ sharply in others. The range is wide because the studies measure different things. [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Study', 'Sample and method', 'Finding'],
                    rows: [
                        ['Meta-analysis, 2024', 'Observational studies of healthy temporal bones', '29% pooled (95% CI 20–40%) [[src|Surg Radiol Anat 2024]]'],
                        ['Cadaver dissection, 2021', '30 bones, wet dissection', 'Tympanic segment 33%, first genu 10% [[src|Indian J Otolaryngol Head Neck Surg 2021]]'],
                        ['Micro-CT against cone-beam CT, 2025', '36 bones, both scans', '10 bones on micro-CT, 25 on cone-beam CT [[src|Head Face Med 2025]]'],
                        ['CT, 2025', '50 scans (100 sides)', 'Tympanic segment 68% [[src|J Craniofac Surg 2025]]'],
                        ['Surgery, 2022', '30 cholesteatoma ears against 30 otosclerosis controls', '50% in cholesteatoma, 3.3% in controls [[src|Indian J Otolaryngol Head Neck Surg 2022]]'],
                        ['Surgery, 2024', '46 chronic ears, canal wall down mastoidectomy', '50%, mostly tympanic [[src|Indian J Otolaryngol Head Neck Surg 2024]]'],
                        ['Surgery, 2025', '142 severe Bell palsy decompressions', '35.2%, 92.5% of them tympanic [[src|Auris Nasus Larynx 2025]]'],
                    ],
                    wide: true,
                },
                {
                    t: 'kv',
                    rows: [
                        ['Board answer', '25–55% over the oval window; geniculate ganglion 10–20%. [[src|Cummings Review Ch. 2]]'],
                        ['Competing view', 'Anything from a few percent to about two thirds, depending on the bones and the method. The pooled healthy-bone figure and the dissection figure sit inside the board range; the surgical figures in non-diseased ears sit far below it, and in diseased ears inside it.'],
                        ['Method weakness', '**Definition**: a microscopic gap, a bare nerve seen at surgery and thin bone on CT are three different things. **Selection**: cadaver series come from donated bones; surgical series are diseased ears, or ears chosen for a palsy. **Detection**: the surgeon sees only what the approach exposes, and low-resolution CT reads thin bone as a gap, so cone-beam CT found more than twice as many as micro-CT in the same bones. **Size**: the samples are 30 to 142 and mix ears with patients.'],
                        ['On the exam', '25–55% tympanic, 10–20% geniculate.'],
                        ['In the operating room', 'Assume bare nerve until you have seen bone, above the oval window first, and more so in cholesteatoma, revision and palsy cases.'],
                    ],
                },
                { t: 'check', id: 'c1', q: 'Give three reasons two studies of facial canal dehiscence can report very different rates.', a: 'Different definitions (microscopic gap, bare nerve at surgery, thin bone on CT); different bones (donated normal bones, diseased ears, ears chosen for palsy); different detection (the surgical field, CT resolution).' },
                { t: 'check', id: 'c2', q: 'Why are the surgical rates for cholesteatoma and for otosclerosis controls so far apart?', a: 'Cholesteatoma erodes the canal, so the sample is diseased; otosclerosis ears are not eroded and the microscope sees only what a tympanotomy exposes. The difference is population, not a contradiction.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q149', 'ear-anatomy:q151'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ap-dehiscence'] }],
        },
        {
            id: 'ap-numbers',
            n: '13.3',
            title: 'Transformer numbers and naming',
            blocks: [
                { t: 'p', x: 'The middle ear is taught as a transformer: an area ratio, a lever ratio and a total gain. Those numbers are real, but they are idealizations, and the sources do not agree on how to count them. [[src|Glasscock Ch. 3]] [[src|Cummings Review Ch. 2]]' },
                {
                    t: 'table',
                    head: ['Quantity', 'Board value', 'Another way to count'],
                    rows: [
                        ['Area ratio', 'About 20:1, about 26 dB [[src|Glasscock Ch. 3]]', 'Effective vibrating area 43 of 69 mm² against a footplate of 3.2 mm², nearer 13:1 [[src|Cummings Review Ch. 2]]'],
                        ['Lever ratio', 'About 1.3:1, about 2 dB [[src|Glasscock Ch. 3]]', 'In human temporal bones the effective lever rises above 1000 Hz as the rotation axis shifts [[src|Am J Otol 1994]]'],
                        ['Total gain', 'About 28 dB theoretical [[src|Cummings Review Ch. 2]]', 'About 20 dB actual [[src|Cummings Review Ch. 2]]; pressure gain falls above 1000 Hz [[src|Am J Otol 1994]]'],
                    ],
                    wide: true,
                },
                {
                    t: 'kv',
                    rows: [
                        ['Board answer', 'Area 20:1, lever 1.3:1, theoretical gain about 28 dB, measured about 20 dB. [[src|Glasscock Ch. 3]] [[src|Cummings Review Ch. 2]]'],
                        ['Competing view', 'A laser Doppler study of human temporal bones concluded that the conventional transformer teaching is only partly correct: the pressure gain falls above 1000 Hz and does not depend on the cochlear load at all frequencies. [[src|Am J Otol 1994]] The area ratio itself changes with the area you count.'],
                        ['Method weakness', '**Design**: temporal bone measurements are post-mortem, with no muscle tone and tissue that has changed. **Definition**: a single ratio is quoted for a frequency-dependent system, and the "drum area" may be the anatomic or the effective area. **Sample**: the values are averages across bones, applied to every ear, and neither source explains the gap between its area figures.'],
                        ['On the exam', 'Area 20:1, lever 1.3:1, theoretical 28 dB, actual about 20 dB.'],
                        ['In the operating room', 'The ratios do not predict your result. A repair is judged by the air-bone gap, not by a calculated gain.'],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Naming is not evidence',
                    blocks: [
                        { t: 'p', x: 'Proctor and Marchioni describe the posterior tympanum with overlapping names for the same spaces. This guide uses the vault and KJ Lee terms, with the older names beside them, in the spaces chapter. Choosing between names is vocabulary; nothing in the retrotympanum naming is a competing measurement. Only the sinus tympani depth classes (A, B and C) are a measured finding.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'State the board middle ear transformer numbers and the gain they predict.', a: 'Area ratio about 20:1 (about 26 dB), lever about 1.3:1 (about 2 dB), theoretical gain about 28 dB; measured gain about 20 dB.' },
                { t: 'check', id: 'c2', q: 'Name two reasons the measured gain is lower than the idealized figure.', a: 'The effective vibrating area is smaller than the anatomic drum area (about 43 of 69 mm²), and the gain is frequency dependent, falling above about 1000 Hz, so a single ratio overstates it.' },
                { t: 'check', id: 'c3', q: 'Is a difference between two retrotympanum naming schemes a competing finding?', a: 'No. It is vocabulary for the same spaces; only the measured depth of the sinus tympani is data.' },
                { t: 'practice', title: 'Apply it', refs: ['ear-anatomy:q152', 'ear-anatomy:q154'] },
            ],
            drill: [{ m: 'ear-anatomy', c: ['ap-numbers'] }],
        },
    ],
};
