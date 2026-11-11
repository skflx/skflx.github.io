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
        'Axial from the top: arch of the superior canal, epitympanum with the **ice cream cone**, oval window level with the posterior row (facial recess, pyramidal eminence, sinus tympani), round window level, then a low slice through the tympanic membrane and the petrous carotid.',
        'Coronal from the front: geniculate and cochlea, malleus under the **scutum**, oval window with the tympanic facial nerve under the lateral canal, round window niche and internal auditory canal, then the mastoid facial nerve.',
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
                            'Tympanic membrane, mastoid facial nerve, petrous carotid, mastoid air cells',
                        ],
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-axial-hs',
                    alt: 'Five axial CT slices of a right temporal bone from the superior semicircular canal down to the tympanic membrane level, with tappable ear structures on each.',
                    label: 'Find it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-18.jpg',
                            cap: 'Right ear, axial, near the top of the series (slice 18 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'ssc',
                                    poly: [45.3, 43.8, 44.5, 44.6, 43.3, 44.6, 42.4, 43.8, 42.4, 42.7, 43.3, 41.9, 44.5, 41.9, 45.3, 42.7],
                                },
                                {
                                    g: 'epitympanum',
                                    poly: [34.2, 46.5, 33.4, 47.3, 32.2, 47.3, 31.3, 46.5, 31.3, 45.5, 32.2, 44.7, 33.4, 44.7, 34.2, 45.5],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [17.0, 53.5, 16.2, 54.3, 15.0, 54.3, 14.1, 53.5, 14.1, 52.5, 15.0, 51.7, 16.2, 51.7, 17.0, 52.5],
                                },
                                {
                                    g: 'ssc',
                                    poly: [49.2, 54.3, 48.4, 55.1, 47.2, 55.1, 46.3, 54.3, 46.3, 53.2, 47.2, 52.4, 48.4, 52.4, 49.2, 53.2],
                                },
                                {
                                    g: 'sigmoid',
                                    poly: [24.0, 75.8, 23.1, 76.6, 21.9, 76.6, 21.0, 75.8, 21.0, 74.7, 21.9, 73.9, 23.1, 73.9, 24.0, 74.7],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-30.jpg',
                            cap: 'Right ear, axial, epitympanum (slice 30 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'geniculate',
                                    poly: [50.6, 38.3, 49.8, 39.1, 48.6, 39.1, 47.7, 38.3, 47.7, 37.2, 48.6, 36.4, 49.8, 36.4, 50.6, 37.2],
                                },
                                {
                                    g: 'malleus',
                                    poly: [37.3, 39.0, 36.4, 39.8, 35.2, 39.8, 34.4, 39.0, 34.4, 38.0, 35.2, 37.2, 36.4, 37.2, 37.3, 38.0],
                                },
                                {
                                    g: 'fn-lab',
                                    poly: [53.1, 40.3, 52.3, 41.1, 51.1, 41.1, 50.2, 40.3, 50.2, 39.2, 51.1, 38.4, 52.3, 38.4, 53.1, 39.2],
                                },
                                {
                                    g: 'incus',
                                    poly: [34.0, 42.3, 33.1, 43.1, 31.9, 43.1, 31.0, 42.3, 31.0, 41.2, 31.9, 40.4, 33.1, 40.4, 34.0, 41.2],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [47.6, 47.8, 46.7, 48.6, 45.5, 48.6, 44.7, 47.8, 44.7, 46.7, 45.5, 45.9, 46.7, 45.9, 47.6, 46.7],
                                },
                                {
                                    g: 'iac',
                                    poly: [63.1, 48.5, 62.3, 49.3, 61.1, 49.3, 60.2, 48.5, 60.2, 47.5, 61.1, 46.7, 62.3, 46.7, 63.1, 47.5],
                                },
                                {
                                    g: 'aditus',
                                    poly: [30.3, 48.8, 29.5, 49.6, 28.3, 49.6, 27.4, 48.8, 27.4, 47.7, 28.3, 46.9, 29.5, 46.9, 30.3, 47.7],
                                },
                                {
                                    g: 'antrum',
                                    poly: [27.6, 56.8, 26.7, 57.6, 25.5, 57.6, 24.7, 56.8, 24.7, 55.7, 25.5, 54.9, 26.7, 54.9, 27.6, 55.7],
                                },
                                {
                                    g: 'pscc',
                                    poly: [42.6, 58.5, 41.7, 59.3, 40.5, 59.3, 39.7, 58.5, 39.7, 57.5, 40.5, 56.7, 41.7, 56.7, 42.6, 57.5],
                                },
                                {
                                    g: 'sigmoid',
                                    poly: [24.0, 75.8, 23.1, 76.6, 21.9, 76.6, 21.0, 75.8, 21.0, 74.7, 21.9, 73.9, 23.1, 73.9, 24.0, 74.7],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-41.jpg',
                            cap: 'Right ear, axial, oval window level (slice 41 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'malleus',
                                    poly: [39.5, 39.5, 38.7, 40.3, 37.5, 40.3, 36.6, 39.5, 36.6, 38.5, 37.5, 37.7, 38.7, 37.7, 39.5, 38.5],
                                },
                                {
                                    g: 'incus',
                                    poly: [38.1, 42.8, 37.3, 43.6, 36.1, 43.6, 35.2, 42.8, 35.2, 41.7, 36.1, 40.9, 37.3, 40.9, 38.1, 41.7],
                                },
                                {
                                    g: 'stapes',
                                    poly: [44.0, 43.0, 43.1, 43.8, 41.9, 43.8, 41.0, 43.0, 41.0, 42.0, 41.9, 41.2, 43.1, 41.2, 44.0, 42.0],
                                },
                                {
                                    g: 'recess',
                                    poly: [37.6, 48.5, 36.7, 49.3, 35.5, 49.3, 34.7, 48.5, 34.7, 47.5, 35.5, 46.7, 36.7, 46.7, 37.6, 47.5],
                                },
                                {
                                    g: 'pyramid',
                                    poly: [39.0, 51.0, 38.1, 51.8, 36.9, 51.8, 36.0, 51.0, 36.0, 50.0, 36.9, 49.2, 38.1, 49.2, 39.0, 50.0],
                                },
                                {
                                    g: 'sinustymp',
                                    poly: [43.1, 52.5, 42.3, 53.3, 41.1, 53.3, 40.2, 52.5, 40.2, 51.5, 41.1, 50.7, 42.3, 50.7, 43.1, 51.5],
                                },
                                {
                                    g: 'pscc',
                                    poly: [46.5, 53.8, 45.6, 54.6, 44.4, 54.6, 43.5, 53.8, 43.5, 52.7, 44.4, 51.9, 45.6, 51.9, 46.5, 52.7],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-47.jpg',
                            cap: 'Right ear, axial, round window level (slice 47 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'malleus',
                                    poly: [41.7, 40.0, 40.9, 40.8, 39.7, 40.8, 38.8, 40.0, 38.8, 39.0, 39.7, 38.2, 40.9, 38.2, 41.7, 39.0],
                                },
                                {
                                    g: 'rw',
                                    poly: [43.7, 46.8, 42.8, 47.6, 41.6, 47.6, 40.8, 46.8, 40.8, 45.7, 41.6, 44.9, 42.8, 44.9, 43.7, 45.7],
                                },
                                {
                                    g: 'sinustymp',
                                    poly: [42.0, 53.5, 41.2, 54.3, 40.0, 54.3, 39.1, 53.5, 39.1, 52.5, 40.0, 51.7, 41.2, 51.7, 42.0, 52.5],
                                },
                                {
                                    g: 'fn',
                                    poly: [37.3, 55.8, 36.4, 56.6, 35.2, 56.6, 34.4, 55.8, 34.4, 54.7, 35.2, 53.9, 36.4, 53.9, 37.3, 54.7],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/ax-56.jpg',
                            cap: 'Right ear, axial, tympanic membrane and petrous carotid (slice 56 of 61). Lateral is left, anterior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'ica',
                                    poly: [71.7, 34.8, 70.9, 35.6, 69.7, 35.6, 68.8, 34.8, 68.8, 33.7, 69.7, 32.9, 70.9, 32.9, 71.7, 33.7],
                                },
                                {
                                    g: 'tm',
                                    poly: [41.7, 43.0, 40.9, 43.8, 39.7, 43.8, 38.8, 43.0, 38.8, 42.0, 39.7, 41.2, 40.9, 41.2, 41.7, 42.0],
                                },
                                {
                                    g: 'fn',
                                    poly: [40.1, 57.0, 39.2, 57.8, 38.0, 57.8, 37.2, 57.0, 37.2, 56.0, 38.0, 55.2, 39.2, 55.2, 40.1, 56.0],
                                },
                                {
                                    g: 'mastoidcells',
                                    poly: [27.6, 64.3, 26.7, 65.1, 25.5, 65.1, 24.7, 64.3, 24.7, 63.2, 25.5, 62.4, 26.7, 62.4, 27.6, 63.2],
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
                    q: 'Which slice shows the tympanic membrane and the petrous carotid together, and which shows the arch of the superior canal?',
                    a: 'The low slice: the tympanic membrane laterally, the carotid anteromedially. The top slice shows the arch of the superior semicircular canal.',
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
        },
        {
            id: 'im-coronal',
            n: '11.2',
            title: 'Coronal, anterior to posterior',
            blocks: [
                {
                    t: 'p',
                    x: 'In coronal slices **lateral is still left** and **superior is up**. Start anterior and move back: the cochlea and geniculate region first, then the malleus under the scutum, then the oval window, then the round window niche and the internal auditory canal, then the mastoid segment of the facial nerve.',
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
                            'Round window niche, lateral and superior canals, vestibule, internal auditory canal, tympanic facial nerve',
                        ],
                        [
                            'Posterior',
                            'Posterior semicircular canal, mastoid segment of the facial nerve, mastoid air cells',
                        ],
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-coronal-hs',
                    alt: 'Four coronal CT slices of a right temporal bone from anterior to posterior, with tappable ear structures on each.',
                    label: 'Find it',
                    modes: ['explore', 'find'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-21.jpg',
                            cap: 'Right ear, coronal, anterior (slice 21 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'geniculate',
                                    poly: [60.9, 37.4, 60.0, 38.4, 58.9, 38.4, 58.1, 37.4, 58.1, 36.0, 58.9, 35.0, 60.0, 35.0, 60.9, 36.0],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [55.3, 43.1, 54.5, 44.1, 53.4, 44.1, 52.6, 43.1, 52.6, 41.7, 53.4, 40.7, 54.5, 40.7, 55.3, 41.7],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [65.3, 44.4, 64.5, 45.3, 63.4, 45.3, 62.6, 44.4, 62.6, 43.0, 63.4, 42.0, 64.5, 42.0, 65.3, 43.0],
                                },
                                {
                                    g: 'hypotympanum',
                                    poly: [57.7, 57.7, 56.9, 58.6, 55.7, 58.6, 54.9, 57.7, 54.9, 56.3, 55.7, 55.3, 56.9, 55.3, 57.7, 56.3],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-18.jpg',
                            cap: 'Right ear, coronal, malleus and scutum (slice 18 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'tegment',
                                    poly: [42.4, 30.4, 41.6, 31.4, 40.5, 31.4, 39.7, 30.4, 39.7, 29.1, 40.5, 28.1, 41.6, 28.1, 42.4, 29.1],
                                },
                                {
                                    g: 'incus',
                                    poly: [50.3, 39.0, 49.5, 40.0, 48.4, 40.0, 47.6, 39.0, 47.6, 37.6, 48.4, 36.6, 49.5, 36.6, 50.3, 37.6],
                                },
                                {
                                    g: 'prussak',
                                    poly: [45.1, 41.5, 44.3, 42.5, 43.1, 42.5, 42.3, 41.5, 42.3, 40.1, 43.1, 39.2, 44.3, 39.2, 45.1, 40.1],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [56.9, 41.8, 56.1, 42.8, 55.0, 42.8, 54.1, 41.8, 54.1, 40.5, 55.0, 39.5, 56.1, 39.5, 56.9, 40.5],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [68.2, 45.9, 67.4, 46.9, 66.3, 46.9, 65.5, 45.9, 65.5, 44.6, 66.3, 43.6, 67.4, 43.6, 68.2, 44.6],
                                },
                                {
                                    g: 'scutum',
                                    poly: [44.8, 47.5, 44.0, 48.5, 42.8, 48.5, 42.0, 47.5, 42.0, 46.1, 42.8, 45.2, 44.0, 45.2, 44.8, 46.1],
                                },
                                {
                                    g: 'malleus',
                                    poly: [51.4, 52.9, 50.6, 53.9, 49.4, 53.9, 48.6, 52.9, 48.6, 51.5, 49.4, 50.6, 50.6, 50.6, 51.4, 51.5],
                                },
                                {
                                    g: 'hypotympanum',
                                    poly: [61.1, 60.5, 60.3, 61.5, 59.2, 61.5, 58.4, 60.5, 58.4, 59.1, 59.2, 58.1, 60.3, 58.1, 61.1, 59.1],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-17.jpg',
                            cap: 'Right ear, coronal, oval window (slice 17 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'ssc',
                                    poly: [56.6, 31.1, 55.8, 32.0, 54.7, 32.0, 53.9, 31.1, 53.9, 29.7, 54.7, 28.7, 55.8, 28.7, 56.6, 29.7],
                                },
                                {
                                    g: 'lscc',
                                    poly: [49.3, 37.1, 48.5, 38.1, 47.3, 38.1, 46.5, 37.1, 46.5, 35.7, 47.3, 34.7, 48.5, 34.7, 49.3, 35.7],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [54.5, 42.1, 53.7, 43.1, 52.6, 43.1, 51.8, 42.1, 51.8, 40.8, 52.6, 39.8, 53.7, 39.8, 54.5, 40.8],
                                },
                                {
                                    g: 'incus',
                                    poly: [49.3, 47.5, 48.5, 48.5, 47.3, 48.5, 46.5, 47.5, 46.5, 46.1, 47.3, 45.2, 48.5, 45.2, 49.3, 46.1],
                                },
                                {
                                    g: 'ow',
                                    poly: [56.6, 48.2, 55.8, 49.1, 54.7, 49.1, 53.9, 48.2, 53.9, 46.8, 54.7, 45.8, 55.8, 45.8, 56.6, 46.8],
                                },
                                {
                                    g: 'cochlea',
                                    poly: [66.4, 50.1, 65.6, 51.0, 64.4, 51.0, 63.6, 50.1, 63.6, 48.7, 64.4, 47.7, 65.6, 47.7, 66.4, 48.7],
                                },
                                {
                                    g: 'stapes',
                                    poly: [53.2, 51.0, 52.4, 52.0, 51.3, 52.0, 50.5, 51.0, 50.5, 49.6, 51.3, 48.7, 52.4, 48.7, 53.2, 49.6],
                                },
                            ],
                        },
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-15.jpg',
                            cap: 'Right ear, coronal, round window niche and internal auditory canal (slice 15 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'ssc',
                                    poly: [58.5, 27.6, 57.7, 28.6, 56.5, 28.6, 55.7, 27.6, 55.7, 26.2, 56.5, 25.2, 57.7, 25.2, 58.5, 26.2],
                                },
                                {
                                    g: 'lscc',
                                    poly: [49.3, 37.4, 48.5, 38.4, 47.3, 38.4, 46.5, 37.4, 46.5, 36.0, 47.3, 35.0, 48.5, 35.0, 49.3, 36.0],
                                },
                                {
                                    g: 'iac',
                                    poly: [79.3, 39.0, 78.5, 40.0, 77.3, 40.0, 76.5, 39.0, 76.5, 37.6, 77.3, 36.6, 78.5, 36.6, 79.3, 37.6],
                                },
                                {
                                    g: 'vestibule',
                                    poly: [59.8, 40.9, 59.0, 41.9, 57.8, 41.9, 57.0, 40.9, 57.0, 39.5, 57.8, 38.5, 59.0, 38.5, 59.8, 39.5],
                                },
                                {
                                    g: 'fn-tymp',
                                    poly: [48.5, 45.9, 47.7, 46.9, 46.5, 46.9, 45.7, 45.9, 45.7, 44.6, 46.5, 43.6, 47.7, 43.6, 48.5, 44.6],
                                },
                                {
                                    g: 'rw',
                                    poly: [54.5, 52.9, 53.7, 53.9, 52.6, 53.9, 51.8, 52.9, 51.8, 51.5, 52.6, 50.6, 53.7, 50.6, 54.5, 51.5],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'hotspot',
                    id: 'im-coronal-post-hs',
                    alt: 'A posterior coronal CT slice of a right temporal bone with the one tappable structure the atlas labels on it.',
                    label: 'Posterior slice',
                    modes: ['explore'],
                    frames: [
                        {
                            src: 'images/oksat/ear-anatomy/ct/co-10.jpg',
                            cap: 'Right ear, coronal, posterior, mastoid segment of the facial nerve (slice 10 of 21). Lateral is left, superior is up. UW Temporal Bone Module (University of Washington Radiology), used with permission.',
                            regions: [
                                {
                                    g: 'fn',
                                    poly: [46.9, 52.3, 46.1, 53.2, 45.0, 53.2, 44.1, 52.3, 44.1, 50.9, 45.0, 49.9, 46.1, 49.9, 46.9, 50.9],
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
        },
    ],
};
