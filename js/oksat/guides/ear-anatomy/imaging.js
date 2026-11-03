/* =============================================================
   Normal HRCT of the temporal bone
   OKSAT · Interactive learning · ear-anatomy · chapter 11
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'imaging',
    title: 'Normal HRCT of the temporal bone',
    kicker: '11 · Imaging',
    review: 'draft',
    lede: 'The same right temporal bone in axial and coronal slices. Learn to name the landmarks at each level, then to read a scan against a short checklist.',
    src: 'Glasscock Ch. 2 · UW Temporal Bone Module (University of Washington Radiology), used with permission',
    tldr: [
        'Display: the patient\'s right on the viewer\'s left. **Lateral is left**; anterior is up on axial, superior is up on coronal.',
        'Axial from the top: arch of the superior canal, epitympanum with the **ice cream cone**, oval window level with the posterior row (facial recess, pyramidal eminence, sinus tympani), round window level, jugular foramen level.',
        'Coronal from the front: geniculate and cochlea, malleus under the **scutum**, oval window with the tympanic facial nerve under the lateral canal, round window niche and internal auditory canal, mastoid facial nerve and jugular foramen.',
        'Reader checklist: scutum sharp, tegmen intact, ossicles aligned, sinus tympani depth, jugular bulb height, carotid plate present.',
    ],
    sections: [
        {
            id: 'im-axial',
            n: '11.1',
            title: 'Axial, superior to inferior',
            blocks: [
                {
                    t: 'p',
                    x: 'Every image in this chapter is the same right temporal bone in the usual radiological display: the patient\'s right is on the viewer\'s left, so **lateral is left**, and in axial slices **anterior is up**. Scroll from the top of the bone to the bottom and name the same few landmarks at each level. Tap a structure to read its glossary entry, or switch to *Find it* and tap what you are asked for.',
                },
                {
                    t: 'table',
                    head: ['Level', 'What to name'],
                    rows: [
                        [
                            'Near the top',
                            'Arch of the superior semicircular canal (a ring with a dark centre), epitympanum, mastoid air cells, sigmoid sinus, petrous apex',
                        ],
                        [
                            'Epitympanum',
                            'Head of the malleus, short process of the incus, aditus ad antrum, antrum, lateral semicircular canal, vestibule, internal auditory canal, geniculate ganglion, labyrinthine facial nerve',
                        ],
                        [
                            'Oval window',
                            'Malleus, long process of the incus, stapes, cochlea; in the posterior row, lateral to medial: facial recess, pyramidal eminence, sinus tympani',
                        ],
                        [
                            'Round window',
                            'Round window niche, cochlear turns, malleus handle, mastoid facial nerve, sinus tympani',
                        ],
                        [
                            'Hypotympanum',
                            'External canal, tympanic membrane, jugular bulb, mastoid facial nerve, petrous carotid, temporomandibular joint',
                        ],
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-axial-hs',
                    alt: 'Five axial CT slices of a right temporal bone from the superior semicircular canal down to the jugular foramen, with tappable ear structures on each.',
                    label: 'Find it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-18.jpg',
                            cap: 'Right ear, axial, near the top of the series (slice 18 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'ssc',
                                    poly: [39.4, 43.0, 42.8, 42.0, 45.6, 44.0, 45.0, 47.0, 41.7, 48.0, 39.4, 46.0],
                                },
                                {
                                    g: 'epitympanum',
                                    poly: [32.2, 44.5, 37.5, 44.0, 38.9, 47.5, 38.3, 53.5, 33.9, 54.0, 31.7, 48.8],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [10.6, 43.8, 22.2, 42.5, 29.2, 50.5, 25.0, 60.0, 13.3, 60.0, 10.0, 52.5],
                                },
                                {
                                    g: 'petapex',
                                    poly: [53.3, 40.5, 62.5, 38.8, 68.9, 42.5, 63.9, 50.5, 53.3, 52.5, 50.0, 46.2],
                                },
                                {
                                    g: 'sigmoid',
                                    poly: [16.7, 71.2, 22.2, 68.8, 27.2, 71.2, 25.0, 78.8, 19.4, 80.0, 16.1, 76.2],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-30.jpg',
                            cap: 'Right ear, axial, epitympanum (slice 30 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'mhead',
                                    poly: [35.6, 38.2, 38.9, 38.2, 39.4, 41.0, 37.5, 42.2, 35.3, 41.2],
                                },
                                {
                                    g: 'incshort',
                                    poly: [32.5, 41.5, 35.3, 41.0, 35.8, 43.2, 33.3, 44.2],
                                },
                                {
                                    g: 'aditus',
                                    poly: [31.1, 44.5, 35.0, 44.0, 35.3, 49.5, 31.7, 50.5],
                                },
                                {
                                    g: 'antrum',
                                    poly: [22.2, 52.5, 30.0, 52.0, 32.2, 56.2, 30.6, 61.3, 22.8, 60.0],
                                },
                                {
                                    g: 'lscc',
                                    poly: [35.3, 47.5, 38.3, 46.5, 39.4, 53.0, 43.9, 54.0, 43.3, 54.8, 37.5, 54.8, 35.3, 53.0],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [42.2, 44.0, 47.8, 44.5, 48.3, 48.5, 43.9, 48.5],
                                },
                                {
                                    g: 'iac',
                                    poly: [50.0, 44.5, 58.3, 45.8, 65.6, 47.5, 65.6, 49.2, 55.6, 50.0, 50.6, 48.5],
                                },
                                {
                                    g: 'geniculate',
                                    poly: [46.7, 36.2, 50.6, 36.8, 50.8, 39.2, 47.5, 39.2],
                                },
                                {
                                    g: 'fn-lab',
                                    poly: [51.7, 38.5, 55.0, 39.0, 54.4, 42.0, 51.7, 41.5],
                                },
                                {
                                    g: 'petapex',
                                    poly: [65.3, 36.2, 73.6, 34.5, 76.4, 38.8, 69.4, 42.5, 63.9, 41.2],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-41.jpg',
                            cap: 'Right ear, axial, oval window level (slice 41 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'malleus',
                                    poly: [36.9, 38.8, 39.4, 38.8, 39.4, 41.8, 36.9, 41.8],
                                },
                                {
                                    g: 'inclong',
                                    poly: [37.2, 42.5, 40.0, 42.5, 40.0, 45.5, 37.2, 45.5],
                                },
                                {
                                    g: 'stapes',
                                    poly: [40.8, 42.5, 43.6, 42.5, 43.6, 45.2, 40.8, 45.2],
                                },
                                {
                                    g: 'recess',
                                    poly: [33.3, 46.0, 37.5, 46.0, 37.8, 49.0, 34.2, 49.5],
                                },
                                {
                                    g: 'pyramid',
                                    poly: [36.1, 49.8, 39.4, 49.5, 39.4, 52.5, 36.4, 52.5],
                                },
                                {
                                    g: 'sinustymp',
                                    poly: [40.6, 47.0, 43.3, 47.0, 43.3, 51.0, 40.8, 51.0],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [48.1, 38.0, 53.3, 37.5, 56.9, 40.5, 56.4, 46.2, 52.2, 47.5, 48.1, 45.0],
                                },
                                {
                                    g: 'pscc',
                                    poly: [45.3, 49.5, 48.3, 49.5, 48.3, 52.5, 45.3, 52.5],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-47.jpg',
                            cap: 'Right ear, axial, round window level (slice 47 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'malleus',
                                    poly: [38.3, 39.5, 42.2, 39.5, 42.2, 43.0, 38.3, 43.0],
                                },
                                {
                                    g: 'rw',
                                    poly: [42.8, 46.0, 46.4, 46.0, 46.4, 48.8, 42.8, 48.8],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [45.0, 44.5, 48.3, 41.5, 52.2, 38.0, 57.2, 39.0, 57.2, 44.0, 52.2, 47.0, 47.2, 47.5],
                                },
                                {
                                    g: 'sinustymp',
                                    poly: [40.0, 49.2, 42.8, 49.2, 42.8, 52.0, 40.0, 52.0],
                                },
                                {
                                    g: 'fn',
                                    poly: [35.6, 51.5, 39.2, 51.5, 39.2, 55.0, 35.6, 55.0],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [9.7, 48.8, 22.2, 47.5, 34.7, 51.2, 36.1, 60.0, 25.0, 65.0, 11.1, 65.0],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-56.jpg',
                            cap: 'Right ear, axial, jugular foramen and external canal (slice 56 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'tm',
                                    poly: [40.0, 41.0, 43.3, 41.5, 43.3, 46.5, 40.0, 46.5],
                                },
                                {
                                    g: 'eac',
                                    poly: [18.1, 38.8, 37.5, 38.0, 38.9, 47.5, 19.4, 48.0],
                                },
                                {
                                    g: 'jb',
                                    poly: [41.1, 52.0, 47.2, 49.5, 53.3, 50.5, 55.6, 56.2, 51.4, 60.8, 44.4, 60.8, 40.8, 57.5],
                                },
                                {
                                    g: 'fn',
                                    poly: [36.1, 54.0, 40.0, 54.0, 40.0, 58.0, 36.1, 58.0],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [10.6, 50.5, 22.2, 48.0, 33.3, 50.5, 34.7, 60.0, 27.8, 64.5, 12.5, 65.0, 8.3, 57.5],
                                },
                                {
                                    g: 'ica',
                                    poly: [65.6, 32.5, 68.9, 31.0, 72.8, 31.5, 72.2, 34.0, 68.9, 35.5, 65.6, 35.0],
                                },
                                {
                                    g: 'tmj',
                                    poly: [22.8, 19.5, 29.2, 18.2, 37.5, 25.0, 38.3, 31.2, 33.3, 32.0, 24.4, 26.2],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl: the ice cream cone',
                    blocks: [
                        {
                            t: 'p',
                            x: 'On the epitympanic slice the ossicular mass is read as an **ice cream cone**: the **head of the malleus** in front is the ice cream, the **body of the incus** behind it is the cone, and the short process of the incus points back toward the aditus. If the cone is lost or displaced, look at the incudomallear joint. This is common radiology teaching rather than a textbook-cited term.',
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        {
                            t: 'p',
                            x: '**Read it like the surgeon approaches it.** The mastoid and antrum are lateral and posterior, the aditus leads forward into the attic, and the labyrinth sits medial to the ossicles with the internal auditory canal behind and the petrous apex in front of it.',
                        },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Predict: on an axial CT of the right ear, which way do lateral and anterior point on the screen?',
                    a: 'Lateral is to the viewer\'s left; anterior is up.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'At the oval window level, name the posterior row of spaces from lateral to medial.',
                    a: 'Facial recess, pyramidal eminence, sinus tympani.',
                },
                {
                    t: 'check',
                    id: 'c3',
                    q: 'Which slice shows the jugular bulb and the external canal together, and which shows the arch of the superior canal?',
                    a: 'The low slice (jugular foramen level) shows the bulb and the canal; the top slice shows the arch of the superior semicircular canal.',
                },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['ear-anatomy:q108', 'ear-anatomy:q109'],
                },
            ],
            drill: [
                {
                    m: 'ear-anatomy',
                    c: ['im-axial'],
                },
            ],
            ref: [],
        },
        {
            id: 'im-coronal',
            n: '11.2',
            title: 'Coronal, anterior to posterior',
            blocks: [
                {
                    t: 'p',
                    x: 'In coronal slices **lateral is still left** and **superior is up**. Start anterior and move back: the cochlea and geniculate region first, then the malleus under the scutum, then the oval window, then the round window niche and the internal auditory canal, then the mastoid segment of the facial nerve and the jugular foramen.',
                },
                {
                    t: 'table',
                    head: ['Slice', 'What to name'],
                    rows: [
                        [
                            'Anterior',
                            'Geniculate ganglion and tympanic segment of the facial nerve above the cochlea, hypotympanum, carotid canal',
                        ],
                        [
                            'Malleus',
                            'Tegmen tympani, Prussak space, scutum, malleus, incus, tympanic facial nerve, cochlea, hypotympanum',
                        ],
                        [
                            'Oval window',
                            'Stapes in the oval window, incus, tympanic facial nerve beneath the lateral canal, superior canal above it, cochlea',
                        ],
                        [
                            'Round window',
                            'Round window niche, lateral and superior canals, vestibule, internal auditory canal, tympanic facial nerve, jugular foramen',
                        ],
                        [
                            'Posterior',
                            'Posterior semicircular canal, mastoid segment of the facial nerve, jugular foramen, mastoid air cells',
                        ],
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-coronal-hs',
                    alt: 'Five coronal CT slices of a right temporal bone from anterior to posterior, with tappable ear structures on each.',
                    label: 'Find it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-21.jpg',
                            cap: 'Right ear, coronal, anterior (slice 21 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'fn-tymp',
                                    poly: [53.7, 41.8, 56.8, 41.8, 57.4, 45.6, 54.2, 46.2],
                                },
                                {
                                    g: 'geniculate',
                                    poly: [57.4, 36.7, 61.1, 36.7, 61.6, 40.5, 57.9, 41.1],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [59.2, 40.2, 63.7, 39.2, 69.7, 40.5, 70.5, 47.5, 67.1, 51.3, 61.8, 51.3, 59.5, 46.8],
                                },
                                {
                                    g: 'tm',
                                    poly: [46.8, 49.4, 51.6, 49.4, 52.1, 54.4, 47.4, 55.1],
                                },
                                {
                                    g: 'hypotympanum',
                                    poly: [55.8, 53.2, 60.5, 52.5, 61.1, 58.2, 57.4, 58.9],
                                },
                                {
                                    g: 'ica',
                                    poly: [64.7, 55.7, 69.7, 53.8, 75.0, 56.3, 75.8, 63.3, 71.1, 66.5, 65.3, 64.9],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-18.jpg',
                            cap: 'Right ear, coronal, malleus and scutum (slice 18 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'tegment',
                                    poly: [41.1, 34.5, 44.2, 30.7, 48.7, 28.5, 53.2, 29.1, 55.8, 31.6, 53.7, 32.9, 48.7, 31.3, 44.7, 33.5, 42.6, 36.7],
                                },
                                {
                                    g: 'incus',
                                    poly: [46.8, 39.2, 50.0, 39.2, 50.8, 43.0, 47.4, 44.3],
                                },
                                {
                                    g: 'prussak',
                                    poly: [42.9, 38.9, 46.1, 38.9, 46.3, 42.1, 43.4, 42.1],
                                },
                                {
                                    g: 'scutum',
                                    poly: [43.2, 42.7, 45.8, 42.7, 46.3, 46.2, 43.7, 48.7, 42.6, 46.2],
                                },
                                {
                                    g: 'malleus',
                                    poly: [50.0, 47.5, 53.7, 47.5, 54.2, 51.9, 50.5, 52.5],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [53.2, 39.9, 56.3, 39.9, 56.3, 44.3, 53.7, 44.3],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [57.9, 41.8, 61.8, 40.5, 65.3, 43.0, 65.8, 48.1, 62.6, 51.9, 58.9, 50.6, 57.4, 46.8],
                                },
                                {
                                    g: 'hypotympanum',
                                    poly: [56.8, 54.4, 61.1, 54.4, 61.6, 58.9, 58.4, 60.1],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-17.jpg',
                            cap: 'Right ear, coronal, oval window (slice 17 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'lscc',
                                    poly: [46.8, 35.4, 50.3, 35.4, 50.5, 39.9, 47.1, 39.9],
                                },
                                {
                                    g: 'ssc',
                                    poly: [51.8, 29.1, 55.5, 29.1, 56.1, 35.4, 53.2, 38.0, 51.6, 33.5],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [51.1, 41.1, 54.2, 41.1, 54.2, 44.6, 51.1, 44.6],
                                },
                                {
                                    g: 'incus',
                                    poly: [47.4, 44.9, 50.5, 44.9, 50.8, 48.7, 47.6, 48.7],
                                },
                                {
                                    g: 'stapes',
                                    poly: [51.6, 46.8, 54.5, 46.8, 54.5, 50.9, 51.6, 50.9],
                                },
                                {
                                    g: 'ow',
                                    poly: [54.7, 45.6, 56.8, 45.6, 56.8, 49.4, 54.7, 49.4],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [60.0, 46.2, 64.7, 44.9, 65.8, 49.4, 63.7, 52.5, 60.0, 51.9],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-15.jpg',
                            cap: 'Right ear, coronal, round window niche and internal auditory canal (slice 15 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'lscc',
                                    poly: [46.8, 36.1, 50.5, 36.1, 50.5, 41.1, 46.8, 41.1],
                                },
                                {
                                    g: 'ssc',
                                    poly: [53.2, 26.3, 57.4, 26.3, 57.9, 31.0, 53.7, 31.6],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [54.7, 39.6, 58.9, 39.6, 59.5, 44.9, 55.8, 46.2],
                                },
                                {
                                    g: 'iac',
                                    poly: [61.1, 38.0, 73.7, 37.3, 81.1, 38.0, 80.5, 41.1, 71.1, 42.4, 61.8, 41.8],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [46.6, 42.1, 50.3, 42.1, 50.5, 46.5, 46.8, 46.5],
                                },
                                {
                                    g: 'rw',
                                    poly: [51.1, 48.1, 55.8, 47.5, 56.8, 51.9, 54.2, 56.3, 51.1, 54.4],
                                },
                                {
                                    g: 'jb',
                                    poly: [56.8, 58.5, 63.7, 56.3, 69.7, 58.9, 68.4, 68.0, 61.8, 71.2, 57.9, 66.5],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-10.jpg',
                            cap: 'Right ear, coronal, posterior, mastoid segment and jugular foramen (slice 10 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'pscc',
                                    poly: [48.2, 36.7, 53.2, 36.7, 53.7, 44.9, 51.6, 48.1, 48.4, 46.8],
                                },
                                {
                                    g: 'fn',
                                    poly: [45.3, 50.0, 48.9, 50.0, 49.5, 60.8, 45.8, 60.8],
                                },
                                {
                                    g: 'jb',
                                    poly: [51.1, 52.2, 57.9, 50.0, 65.8, 52.2, 68.4, 57.0, 61.8, 60.8, 53.9, 60.8, 50.5, 57.0],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [24.2, 26.9, 36.8, 26.9, 44.7, 34.8, 44.2, 50.6, 36.8, 66.5, 26.3, 66.5, 23.2, 44.3],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Pearl: snake eyes and the sharp scutum',
                    blocks: [
                        {
                            t: 'p',
                            x: 'Near the geniculate ganglion a coronal slice can cut the facial nerve twice, once in the labyrinthine and once in the tympanic segment, giving two adjacent round dots: the **snake eyes** sign. On the malleus slice, check that the **scutum** ends in a sharp point; Prussak space is the small air pocket just beneath it, lateral to the malleus. Both are common radiology teaching rather than textbook-cited terms.',
                        },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Predict: on a coronal slice through the oval window, which structure lies directly above the tympanic facial nerve?',
                    a: 'The lateral semicircular canal.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Where is Prussak space on a coronal slice through the malleus?',
                    a: 'Under the tip of the scutum, lateral to the malleus.',
                },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['ear-anatomy:q111', 'ear-anatomy:q112'],
                },
            ],
            drill: [
                {
                    m: 'ear-anatomy',
                    c: ['im-coronal'],
                },
            ],
            ref: [],
        },
        {
            id: 'im-read',
            n: '11.3',
            title: 'What a reader checks',
            blocks: [
                {
                    t: 'p',
                    x: 'A normal CT is read against a short checklist. Each line below can be answered from the slices you have just stepped through.',
                },
                {
                    t: 'table',
                    head: ['Check', 'Look at', 'Why'],
                    rows: [
                        [
                            'Scutum sharp',
                            'Coronal slice through the malleus',
                            'A blunted tip is the classic early sign of attic disease',
                        ],
                        [
                            'Tegmen intact',
                            'Coronal slice through the malleus',
                            'Thin bony roof between the ear and the middle fossa dura [[src|Glasscock Ch. 2]]',
                        ],
                        [
                            'Ossicular alignment',
                            'Axial epitympanic and oval window slices',
                            'Malleus head, incus body and long process, stapes in the oval window',
                        ],
                        [
                            'Sinus tympani depth',
                            'Axial oval window slice',
                            'A deep pocket behind the pyramidal eminence is hard to see and clear; grade it A, B or C',
                        ],
                        [
                            'Jugular bulb height',
                            'Coronal slice at the round window niche',
                            'A high bulb narrows the hypotympanum and the inferior corridors',
                        ],
                        [
                            'Carotid plate',
                            'Anterior coronal slice, axial low slice',
                            'Bone between carotid canal and middle ear should be present',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Two definitions of a high jugular bulb',
                    blocks: [
                        {
                            t: 'p',
                            x: 'Glasscock gives two. A **high-riding bulb** extends to or above the level of the **inferior tympanic annulus**; this was reported in **3.5 to 5%** of temporal bones, perhaps more often on the right, and its bony covering is only **0.1 to 0.3 mm**. An alternate definition counts a bulb that comes to within **2 mm or less** of the **inferior aspect of the internal auditory canal**, and by that definition about **two-thirds** of bones from people older than 6 years qualified. State which definition you are using. [[src|Glasscock Ch. 2]]',
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        {
                            t: 'p',
                            x: '**Roof, floor, front, back, middle.** Tegmen, bulb, carotid, sigmoid and the facial nerve: if you can name each and say it is intact, the slice is read.',
                        },
                    ],
                },
                {
                    t: 'check',
                    id: 'c1',
                    q: 'Which definition of a high-riding jugular bulb uses the tympanic annulus?',
                    a: 'A bulb extending to or above the level of the inferior tympanic annulus.',
                },
                {
                    t: 'check',
                    id: 'c2',
                    q: 'Name the two walls of the ear that the coronal malleus slice lets you check.',
                    a: 'Scutum (lateral attic wall) and tegmen tympani (roof).',
                },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['ear-anatomy:q113', 'ear-anatomy:q114'],
                },
            ],
            drill: [
                {
                    m: 'ear-anatomy',
                    c: ['im-read'],
                },
            ],
            ref: [],
        },
    ],
};
