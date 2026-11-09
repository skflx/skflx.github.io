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
                                    poly: [40.8, 43.2, 41.7, 41.3, 43.9, 40.5, 46.1, 41.3, 46.9, 43.2, 50.8, 53.8, 49.9, 55.7, 47.8, 56.5, 45.6, 55.7, 44.7, 53.8],
                                },
                                {
                                    g: 'epitympanum',
                                    poly: [29.7, 46, 30.6, 44.1, 32.8, 43.2, 34.9, 44.1, 35.8, 46, 34.9, 47.9, 32.8, 48.8, 30.6, 47.9],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [12.5, 53, 13.4, 51.1, 15.6, 50.2, 17.7, 51.1, 18.6, 53, 17.7, 54.9, 15.6, 55.8, 13.4, 54.9],
                                },
                                {
                                    g: 'petapex',
                                    poly: [53.3, 40.5, 62.5, 38.8, 68.9, 42.5, 63.9, 50.5, 53.3, 52.5, 50.0, 46.2],
                                },
                                {
                                    g: 'sigmoid',
                                    poly: [19.4, 75.2, 20.3, 73.3, 22.5, 72.5, 24.7, 73.3, 25.6, 75.2, 24.7, 77.2, 22.5, 78, 20.3, 77.2],
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
                                    poly: [25.8, 48.2, 26.7, 46.3, 28.9, 45.5, 31.1, 46.3, 31.9, 48.2, 31.1, 50.2, 28.9, 51, 26.7, 50.2],
                                },
                                {
                                    g: 'antrum',
                                    poly: [23.1, 56.2, 23.9, 54.3, 26.1, 53.5, 28.3, 54.3, 29.2, 56.2, 28.3, 58.2, 26.1, 59, 23.9, 58.2],
                                },
                                {
                                    g: 'lscc',
                                    poly: [35.3, 47.5, 38.3, 46.5, 39.4, 53.0, 43.9, 54.0, 43.3, 54.8, 37.5, 54.8, 35.3, 53.0],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [43.1, 47.2, 44, 45.3, 46.1, 44.5, 48.3, 45.3, 49.2, 47.2, 48.3, 49.2, 46.1, 50, 44, 49.2],
                                },
                                {
                                    g: 'iac',
                                    poly: [58.6, 48, 59.5, 46.1, 61.7, 45.2, 63.8, 46.1, 64.7, 48, 63.8, 49.9, 61.7, 50.7, 59.5, 49.9],
                                },
                                {
                                    g: 'geniculate',
                                    poly: [46.1, 37.8, 47, 35.8, 49.2, 35, 51.3, 35.8, 52.2, 37.8, 51.3, 39.7, 49.2, 40.5, 47, 39.7],
                                },
                                {
                                    g: 'fn-lab',
                                    poly: [48.6, 39.8, 49.5, 37.8, 51.7, 37, 53.8, 37.8, 54.7, 39.8, 53.8, 41.7, 51.7, 42.5, 49.5, 41.7],
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
                                    poly: [35, 39, 35.9, 37.1, 38.1, 36.2, 40.2, 37.1, 41.1, 39, 40.2, 40.9, 38.1, 41.8, 35.9, 40.9],
                                },
                                {
                                    g: 'inclong',
                                    poly: [37.2, 42.5, 40.0, 42.5, 40.0, 45.5, 37.2, 45.5],
                                },
                                {
                                    g: 'stapes',
                                    poly: [39.4, 42.5, 40.3, 40.6, 42.5, 39.8, 44.7, 40.6, 45.6, 42.5, 44.7, 44.4, 42.5, 45.2, 40.3, 44.4],
                                },
                                {
                                    g: 'recess',
                                    poly: [33.1, 48, 34, 46.1, 36.1, 45.2, 38.3, 46.1, 39.2, 48, 38.3, 49.9, 36.1, 50.7, 34, 49.9],
                                },
                                {
                                    g: 'pyramid',
                                    poly: [34.4, 50.5, 35.3, 48.6, 37.5, 47.8, 39.7, 48.6, 40.6, 50.5, 39.7, 52.4, 37.5, 53.2, 35.3, 52.4],
                                },
                                {
                                    g: 'sinustymp',
                                    poly: [38.6, 52, 39.5, 50.1, 41.7, 49.2, 43.8, 50.1, 44.7, 52, 43.8, 53.9, 41.7, 54.8, 39.5, 53.9],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [48.1, 38.0, 53.3, 37.5, 56.9, 40.5, 56.4, 46.2, 52.2, 47.5, 48.1, 45.0],
                                },
                                {
                                    g: 'pscc',
                                    poly: [41.9, 53.2, 42.8, 51.3, 45, 50.5, 47.2, 51.3, 48.1, 53.2, 47.2, 55.2, 45, 56, 42.8, 55.2],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-47.jpg',
                            cap: 'Right ear, axial, round window level (slice 47 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'malleus',
                                    poly: [37.2, 39.5, 38.1, 37.6, 40.3, 36.8, 42.4, 37.6, 43.3, 39.5, 42.4, 41.4, 40.3, 42.2, 38.1, 41.4],
                                },
                                {
                                    g: 'rw',
                                    poly: [39.2, 46.2, 40.1, 44.3, 42.2, 43.5, 44.4, 44.3, 45.3, 46.2, 44.4, 48.2, 42.2, 49, 40.1, 48.2],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [45.0, 44.5, 48.3, 41.5, 52.2, 38.0, 57.2, 39.0, 57.2, 44.0, 52.2, 47.0, 47.2, 47.5],
                                },
                                {
                                    g: 'sinustymp',
                                    poly: [37.5, 53, 38.4, 51.1, 40.6, 50.2, 42.7, 51.1, 43.6, 53, 42.7, 54.9, 40.6, 55.8, 38.4, 54.9],
                                },
                                {
                                    g: 'fn',
                                    poly: [32.8, 55.2, 33.7, 53.3, 35.8, 52.5, 38, 53.3, 38.9, 55.2, 38, 57.2, 35.8, 58, 33.7, 57.2],
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
                                    poly: [37.2, 42.5, 38.1, 40.6, 40.3, 39.8, 42.4, 40.6, 43.3, 42.5, 42.4, 44.4, 40.3, 45.2, 38.1, 44.4],
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
                                    poly: [35.6, 56.5, 36.4, 54.6, 38.6, 53.8, 40.8, 54.6, 41.7, 56.5, 40.8, 58.4, 38.6, 59.2, 36.4, 58.4],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [23.1, 63.7, 23.9, 61.8, 26.1, 61, 28.3, 61.8, 29.2, 63.7, 28.3, 65.7, 26.1, 66.5, 23.9, 65.7],
                                },
                                {
                                    g: 'ica',
                                    poly: [67.2, 34.2, 68.1, 32.3, 70.3, 31.5, 72.4, 32.3, 73.3, 34.2, 72.4, 36.2, 70.3, 37, 68.1, 36.2],
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
                                    poly: [51.1, 42.4, 51.9, 39.9, 53.9, 38.9, 56, 39.9, 56.8, 42.4, 56, 44.9, 53.9, 45.9, 51.9, 44.9],
                                },
                                {
                                    g: 'geniculate',
                                    poly: [56.6, 36.7, 57.4, 34.2, 59.5, 33.2, 61.5, 34.2, 62.4, 36.7, 61.5, 39.2, 59.5, 40.2, 57.4, 39.2],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [61.1, 43.7, 61.9, 41.2, 63.9, 40.2, 66, 41.2, 66.8, 43.7, 66, 46.1, 63.9, 47.2, 61.9, 46.1],
                                },
                                {
                                    g: 'tm',
                                    poly: [46.8, 49.4, 51.6, 49.4, 52.1, 54.4, 47.4, 55.1],
                                },
                                {
                                    g: 'hypotympanum',
                                    poly: [53.4, 57, 54.3, 54.5, 56.3, 53.5, 58.4, 54.5, 59.2, 57, 58.4, 59.4, 56.3, 60.4, 54.3, 59.4],
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
                                    poly: [38.2, 29.7, 39, 27.3, 41.1, 26.3, 43.1, 27.3, 43.9, 29.7, 43.1, 32.2, 41.1, 33.2, 39, 32.2],
                                },
                                {
                                    g: 'incus',
                                    poly: [46.1, 38.3, 46.9, 35.8, 48.9, 34.8, 51, 35.8, 51.8, 38.3, 51, 40.8, 48.9, 41.8, 46.9, 40.8],
                                },
                                {
                                    g: 'prussak',
                                    poly: [40.8, 40.8, 41.6, 38.4, 43.7, 37.3, 45.7, 38.4, 46.6, 40.8, 45.7, 43.3, 43.7, 44.3, 41.6, 43.3],
                                },
                                {
                                    g: 'scutum',
                                    poly: [40.5, 46.8, 41.4, 44.4, 43.4, 43.4, 45.5, 44.4, 46.3, 46.8, 45.5, 49.3, 43.4, 50.3, 41.4, 49.3],
                                },
                                {
                                    g: 'malleus',
                                    poly: [47.1, 52.2, 48, 49.8, 50, 48.7, 52, 49.8, 52.9, 52.2, 52, 54.7, 50, 55.7, 48, 54.7],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [52.6, 41.1, 53.5, 38.7, 55.5, 37.7, 57.6, 38.7, 58.4, 41.1, 57.6, 43.6, 55.5, 44.6, 53.5, 43.6],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [63.9, 45.3, 64.8, 42.8, 66.8, 41.8, 68.9, 42.8, 69.7, 45.3, 68.9, 47.7, 66.8, 48.7, 64.8, 47.7],
                                },
                                {
                                    g: 'hypotympanum',
                                    poly: [56.8, 59.8, 57.7, 57.3, 59.7, 56.3, 61.8, 57.3, 62.6, 59.8, 61.8, 62.3, 59.7, 63.3, 57.7, 62.3],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-17.jpg',
                            cap: 'Right ear, coronal, oval window (slice 17 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'lscc',
                                    poly: [45, 36.4, 45.8, 33.9, 47.9, 32.9, 49.9, 33.9, 50.8, 36.4, 49.9, 38.9, 47.9, 39.9, 45.8, 38.9],
                                },
                                {
                                    g: 'ssc',
                                    poly: [52.4, 30.4, 53.2, 27.9, 55.3, 26.9, 57.3, 27.9, 58.2, 30.4, 57.3, 32.8, 55.3, 33.9, 53.2, 32.8],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [50.3, 41.5, 51.1, 39, 53.2, 38, 55.2, 39, 56.1, 41.5, 55.2, 43.9, 53.2, 44.9, 51.1, 43.9],
                                },
                                {
                                    g: 'incus',
                                    poly: [45, 46.8, 45.8, 44.4, 47.9, 43.4, 49.9, 44.4, 50.8, 46.8, 49.9, 49.3, 47.9, 50.3, 45.8, 49.3],
                                },
                                {
                                    g: 'stapes',
                                    poly: [48.9, 50.3, 49.8, 47.9, 51.8, 46.8, 53.9, 47.9, 54.7, 50.3, 53.9, 52.8, 51.8, 53.8, 49.8, 52.8],
                                },
                                {
                                    g: 'ow',
                                    poly: [52.4, 47.5, 53.2, 45, 55.3, 44, 57.3, 45, 58.2, 47.5, 57.3, 49.9, 55.3, 50.9, 53.2, 49.9],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [62.1, 49.4, 63, 46.9, 65, 45.9, 67, 46.9, 67.9, 49.4, 67, 51.8, 65, 52.8, 63, 51.8],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-15.jpg',
                            cap: 'Right ear, coronal, round window niche and internal auditory canal (slice 15 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'lscc',
                                    poly: [45, 36.7, 45.8, 34.2, 47.9, 33.2, 49.9, 34.2, 50.8, 36.7, 49.9, 39.2, 47.9, 40.2, 45.8, 39.2],
                                },
                                {
                                    g: 'ssc',
                                    poly: [54.2, 26.9, 55.1, 24.4, 57.1, 23.4, 59.2, 24.4, 60, 26.9, 59.2, 29.4, 57.1, 30.4, 55.1, 29.4],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [55.5, 40.2, 56.4, 37.7, 58.4, 36.7, 60.5, 37.7, 61.3, 40.2, 60.5, 42.7, 58.4, 43.7, 56.4, 42.7],
                                },
                                {
                                    g: 'iac',
                                    poly: [75, 38.3, 75.8, 35.8, 77.9, 34.8, 79.9, 35.8, 80.8, 38.3, 79.9, 40.8, 77.9, 41.8, 75.8, 40.8],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [44.2, 45.3, 45.1, 42.8, 47.1, 41.8, 49.2, 42.8, 50, 45.3, 49.2, 47.7, 47.1, 48.7, 45.1, 47.7],
                                },
                                {
                                    g: 'rw',
                                    poly: [50.3, 52.2, 51.1, 49.8, 53.2, 48.7, 55.2, 49.8, 56.1, 52.2, 55.2, 54.7, 53.2, 55.7, 51.1, 54.7],
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
                                    poly: [42.6, 51.6, 43.5, 49.1, 45.5, 48.1, 47.6, 49.1, 48.4, 51.6, 47.6, 54, 45.5, 55.1, 43.5, 54],
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
