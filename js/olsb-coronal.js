/* =============================================================
   olsb-coronal.js — OLSB diorama: coronal section through the attic.

   A SCHEMATIC coronal cut of a RIGHT ear at the level of the malleus,
   seen from the front, laid out like a coronal CT: lateral to the left,
   superior up, medial to the right. It teaches the compartments and their
   widths (about 6 / 2 / 4 mm), the scutum and Prussak's space, and the
   vertical stack on the medial wall (LSCC over facial nerve over oval
   window). The incus is posterior to this plane (ghost). Proportions are
   schematic. Names, notes and relations: js/olsb-glossary.js.

   Draft content: medical correctness is the owner's to verify
   (docs/decisions.md section 7).
   ============================================================= */
(function () {
    'use strict';

    var ell = window.OLSB.ell, spiral = window.OLSB.spiral;

    var LAYERS = [
        { id: 'bone', name: 'Bone & spaces', desc: 'Temporal bone, canal, middle ear, roof.' },
        { id: 'zones', name: 'Compartments', desc: 'Epi-, meso- and hypotympanum.' },
        { id: 'dims', name: 'Widths', desc: 'Schematic widths of the three compartments.' },
        { id: 'lateral', name: 'TM & attic wall', desc: 'Scutum, pars flaccida, pars tensa, Prussak\'s space.' },
        { id: 'ossicles', name: 'Ossicles', desc: 'Malleus in plane, incus (behind) and stapes.' },
        { id: 'medial', name: 'Medial wall', desc: 'LSCC, facial nerve, oval window, promontory.' },
        { id: 'inner', name: 'Inner ear', desc: 'Vestibule, cochlea, internal auditory canal.' },
        { id: 'deep', name: 'Above & below', desc: 'Dura, temporal lobe, jugular bulb.' },
        { id: 'spread', name: 'Disease route', desc: 'How attic cholesteatoma spreads.' }
    ];

    var ME = 'M 186 96 L 310 96 L 310 150 C 296 160, 296 180, 310 188 C 298 196, 298 216, 312 224 L 300 236 '
        + 'C 272 262, 258 300, 262 322 C 266 350, 280 372, 293 385 L 293 418 C 278 438, 236 440, 214 420 '
        + 'L 213 392 C 222 350, 220 300, 204 262 L 192 238 Z';

    var S = [
        /* ---- bone and spaces ---- */
        { id: 'bonebg', layer: 'bone', z: 1, bg: true, inert: true, kind: 'bone', d: 'M 10 40 L 690 40 L 690 470 L 10 470 Z' },
        { id: 'eac', layer: 'bone', z: 5, bg: true, kind: 'air', d: 'M 10 262 L 168 247 L 192 238 L 204 262 C 220 300, 222 350, 213 392 L 170 382 L 10 350 Z', at: [80, 300], lab: 't', label: 'External canal' },
        { id: 'mespace', layer: 'bone', z: 5, bg: true, kind: 'air', d: ME, inert: true },
        { id: 'tegment', layer: 'bone', z: 9, kind: 'plate', line: true, w: 7, d: 'M 184 92 L 334 92', at: [262, 92], lab: 't' },

        /* ---- compartments ---- */
        { id: 'epitympanum', layer: 'zones', z: 6, kind: 'zone', d: 'M 186 96 L 310 96 L 310 205 L 186 205 Z', at: [192, 106], lab: 'r', label: 'Epitympanum' },
        { id: 'mesotympanum', layer: 'zones', z: 6, kind: 'zone', d: 'M 202 238 L 300 236 L 293 392 L 213 392 Z', at: [236, 280], lab: 'r', label: 'Mesotympanum' },
        { id: 'hypotympanum', layer: 'zones', z: 6, kind: 'zone', d: 'M 213 392 L 293 392 L 293 418 C 278 438, 236 440, 214 420 Z', at: [293, 426], lab: 'r', label: 'Hypotympanum' },

        /* ---- widths ---- */
        { id: 'dim-epi', label: '≈ 6 mm', layer: 'dims', z: 45, kind: 'dimline', line: true, hair: true, d: 'M 188 142 L 308 142 M 188 136 L 188 148 M 308 136 L 308 148', at: [248, 142], lab: 't' },
        { id: 'dim-meso', label: '≈ 2 mm', layer: 'dims', z: 45, kind: 'dimline', line: true, hair: true, d: 'M 224 322 L 260 322 M 224 316 L 224 328 M 260 316 L 260 328', at: [242, 322], lab: 'b' },
        { id: 'dim-hypo', label: '≈ 4 mm', layer: 'dims', z: 45, kind: 'dimline', line: true, hair: true, d: 'M 215 410 L 291 410 M 215 404 L 215 416 M 291 404 L 291 416', at: [253, 410], lab: 't' },

        /* ---- TM and lateral attic wall ---- */
        { id: 'scutum', layer: 'lateral', z: 10, kind: 'bonehi', d: 'M 140 240 L 192 238 L 186 150 L 150 150 Z', at: [160, 200], lab: 'l', label: 'Scutum' },
        { id: 'prussak', layer: 'lateral', z: 11, kind: 'space', d: 'M 192 238 L 226 212 L 218 244 L 207 260 L 204 262 Z', at: [212, 240], lab: 'r', label: 'Prussak\'s space' },
        { id: 'lmf', label: 'Lateral malleal fold', layer: 'lateral', z: 12, kind: 'fold', line: true, w: 2, d: 'M 192 238 L 226 212', at: [206, 226], lab: 'l' },
        { id: 'flaccida', layer: 'lateral', z: 12, kind: 'tmline', line: true, w: 3, d: 'M 192 238 L 204 262', at: [196, 252], lab: 'l' },
        { id: 'tm', label: 'Pars tensa', layer: 'lateral', z: 12, kind: 'tmline', line: true, w: 3, d: 'M 204 262 C 220 300, 222 350, 213 392', at: [214, 350], lab: 'l' },

        /* ---- ossicles ---- */
        { id: 'incus', label: 'Incus (behind this plane)', layer: 'ossicles', z: 19, kind: 'ghost', d: ell(272, 138, 20, 18) + ' M 268 154 L 278 156 L 272 236 L 264 236 Z', at: [286, 130], lab: 'r' },
        { id: 'malleus', layer: 'ossicles', z: 20, kind: 'ossicle', d: ell(242, 150, 20, 26) + ' M 230 170 L 248 174 L 224 230 L 214 262 L 226 322 L 218 324 L 205 262 L 214 226 Z', at: [242, 140], lab: 't' },
        { id: 'stapes', layer: 'ossicles', z: 21, kind: 'ossicle', d: 'M 300 226 L 300 250 L 295 250 L 295 226 Z M 295 230 L 268 235 L 268 241 L 295 246 L 295 241 L 275 238 L 295 235 Z', evenodd: true, at: [282, 248], lab: 'b' },

        /* ---- medial wall ---- */
        { id: 'promontory', layer: 'medial', z: 14, kind: 'mucosaline', line: true, w: 6, d: 'M 300 238 C 272 262, 258 300, 262 322 C 266 350, 280 372, 293 385', at: [268, 330], lab: 'r' },
        { id: 'lscc', layer: 'medial', z: 15, kind: 'oticring', d: ell(330, 166, 14, 14), at: [346, 162], lab: 'r', label: 'Lateral SCC' },
        { id: 'fn', label: 'Facial nerve (tympanic)', layer: 'medial', z: 15, kind: 'nerve', d: ell(322, 208, 10, 10), at: [334, 206], lab: 'r' },
        { id: 'ow', layer: 'medial', z: 15, kind: 'air', d: ell(304, 238, 4, 12), at: [306, 244], lab: 'r', label: 'Oval window' },

        /* ---- inner ear ---- */
        { id: 'vestibule', layer: 'inner', z: 13, kind: 'innerfill', d: ell(372, 242, 36, 26), at: [396, 254], lab: 'r' },
        { id: 'cochlea', layer: 'inner', z: 13, kind: 'oticfill', d: ell(372, 326, 52, 38), at: [418, 330], lab: 'r' },
        { id: 'cochlea-spiral', layer: 'inner', z: 13, kind: 'innerline', line: true, hair: true, inert: true, d: spiral(372, 326, 4, 32, 2.5, 0) },
        { id: 'iac', layer: 'inner', z: 12, kind: 'dura', d: 'M 420 268 L 690 262 L 690 310 L 424 300 Z', at: [560, 284], lab: 't', label: 'Internal auditory canal' },

        /* ---- above and below ---- */
        { id: 'temporallobe', layer: 'deep', z: 2, kind: 'brain', d: 'M 10 0 L 690 0 L 690 50 C 500 60, 300 58, 10 52 Z', at: [560, 24], lab: 'l' },
        { id: 'mcfdura', layer: 'deep', z: 3, kind: 'dura', d: 'M 10 52 C 300 58, 500 60, 690 50 L 690 64 C 500 74, 300 72, 10 66 Z', at: [600, 66], lab: 'b', label: 'Middle fossa dura' },
        { id: 'jb', layer: 'deep', z: 7, kind: 'veinwall', d: ell(262, 482, 70, 34), at: [330, 460], lab: 'r', label: 'Jugular bulb' },

        /* ---- disease route ---- */
        { id: 'spread', label: 'Attic cholesteatoma route', layer: 'spread', z: 50, kind: 'route', line: true, hair: true, arrow: true, d: 'M 210 250 C 200 214, 197 172, 204 128 C 208 108, 222 102, 240 102', at: [236, 100], lab: 't' }
    ];

    var T = ['See', 'Why it matters'];
    var TOUR = {
        id: 'attic', name: 'The attic in section', sub: 'Compartments, the lateral attic wall, the medial stack', terms: T,
        steps: [
            { title: 'Three compartments, three widths', layers: ['bone', 'zones', 'dims', 'lateral', 'ossicles', 'medial'], focus: ['epitympanum', 'mesotympanum', 'hypotympanum', 'dim-epi', 'dim-meso', 'dim-hypo'],
              act: 'Like a coronal CT of the right ear: lateral left, superior up. The attic is widest; the mesotympanum is a slit between umbo and promontory; the hypotympanum sits between.',
              hazard: 'The 2 mm gap explains umbo-promontory contact and why a middle-ear prosthesis has so little room.' },
            { title: 'The lateral attic wall', layers: ['bone', 'lateral', 'ossicles', 'medial'], focus: ['scutum', 'flaccida', 'tm', 'eac'],
              act: 'The scutum is the bony spur between the canal roof and the attic; the pars flaccida hangs from it to the lateral process, the pars tensa below.',
              hazard: 'On coronal CT, a blunted or eroded scutum is an early sign of attic cholesteatoma.' },
            { title: 'Prussak\'s space', layers: ['bone', 'lateral', 'ossicles', 'medial'], focus: ['prussak', 'flaccida', 'malleus', 'lmf'],
              act: 'Pars flaccida lateral, malleus neck medial, lateral malleal fold above, lateral process below.',
              hazard: 'Primary acquired cholesteatoma starts as a pars flaccida retraction into this space.' },
            { title: 'The medial stack', layers: ['bone', 'lateral', 'ossicles', 'medial', 'inner'], focus: ['lscc', 'fn', 'ow', 'stapes', 'promontory', 'vestibule'],
              act: 'From above down on the medial wall: lateral canal, facial nerve, oval window with the stapes, promontory over the cochlea.',
              hazard: 'The nerve sits just above the stapes and under the canal: a soft-tissue mass at the oval window on CT may be the nerve itself.' },
            { title: 'Roof and floor', layers: ['bone', 'lateral', 'ossicles', 'medial', 'deep'], focus: ['tegment', 'mcfdura', 'temporallobe', 'jb'],
              act: 'A thin tegmen separates the attic from middle fossa dura and the temporal lobe; the jugular bulb lies under the hypotympanum.',
              hazard: 'Tegmen erosion: CSF leak, encephalocele, intracranial spread of infection.' },
            { title: 'How attic disease spreads', layers: ['bone', 'lateral', 'ossicles', 'medial', 'spread'], focus: ['spread', 'prussak', 'incus', 'scutum'],
              act: 'From Prussak\'s space up past the lateral malleal fold, lateral to the malleus head and incus body, and back toward the aditus and antrum.',
              hazard: 'Hence the incus body and the scutum erode first, and conductive loss can be mild while the attic fills.' }
        ]
    };

    window.OLSB.dioramas.push({
        id: 'coronal', name: 'Coronal: the attic', short: 'Coronal',
        sub: 'A coronal cut at the malleus, laid out like CT: compartments, Prussak\'s space, the medial stack.',
        orient: 'Right ear · coronal, from front · lateral ← · superior ↑',
        layers: LAYERS,
        structures: S,
        tours: [TOUR],
        views: [{ id: 'me', name: 'Middle ear', box: [70, 80, 540, 370] }, { id: 'full', name: 'Whole', box: [0, 0, 700, 479] }]
    });
})();
