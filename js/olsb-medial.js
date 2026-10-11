/* =============================================================
   olsb-medial.js — OLSB diorama: the medial wall of the tympanic cavity.

   A SCHEMATIC view of a RIGHT tympanic cavity from lateral, with the TM,
   malleus and incus taken away (the "Ossicles" layer puts them back as a
   ghost): anterior to the right, superior up, same as the lateral view.
   It teaches the fixed vertical stack (LSCC, facial nerve, oval window,
   promontory, round window), the retrotympanum, the anterior epitympanum,
   and what lies behind the wall. Not to scale; proportions invented for
   legibility. Names, notes and relations: js/olsb-glossary.js.

   Draft content: medical correctness is the owner's to verify
   (docs/decisions.md section 7).
   ============================================================= */
(function () {
    'use strict';

    var ell = window.OLSB.ell, spiral = window.OLSB.spiral;

    var CAVITY = 'M 132 90 L 622 90 C 648 90, 660 108, 660 136 L 660 424 C 660 446, 644 460, 616 460 '
        + 'L 168 460 C 140 460, 120 442, 120 414 L 120 128 C 120 104, 124 90, 132 90 Z';

    var LAYERS = [
        { id: 'walls', name: 'Walls', desc: 'Outline of the cavity, roof and openings.' },
        { id: 'zones', name: 'Divisions', desc: 'Epi-, meso-, hypo-, pro- and retrotympanum.' },
        { id: 'medial', name: 'Medial wall', desc: 'Promontory, windows, ridges and recesses.' },
        { id: 'nerve', name: 'Nerves', desc: 'Facial nerve, geniculate, GSPN, Jacobson\'s nerve.' },
        { id: 'anterior', name: 'Anterior wall', desc: 'Tensor tympani, cochleariform process, Eustachian tube, cog.' },
        { id: 'vessels', name: 'Vessels', desc: 'Carotid and jugular bulb behind thin bone.' },
        { id: 'ossicles', name: 'Ossicles', desc: 'Malleus, incus and chorda put back (lateral to everything else).' },
        { id: 'inner', name: 'Inner ear', desc: 'Cochlea, vestibule and canals projected through the wall.' }
    ];

    var S = [
        /* ---- walls ---- */
        { id: 'mewall', layer: 'walls', z: 1, bg: true, kind: 'wall', d: CAVITY, at: [150, 440], lab: 'r', label: 'Medial wall' },
        { id: 'tegment', layer: 'walls', z: 30, kind: 'plate', line: true, w: 7, d: 'M 132 89 L 622 89', at: [380, 89], lab: 't' },
        { id: 'aditus', layer: 'walls', z: 31, kind: 'air', d: 'M 121 100 L 172 100 C 184 118, 182 146, 166 164 L 121 164 Z', at: [140, 132], lab: 'r', label: 'Aditus (to antrum)' },
        { id: 'hypocells', layer: 'walls', z: 31, kind: 'air', d: ell(262, 438, 12, 7) + ' ' + ell(300, 446, 10, 6) + ' ' + ell(352, 440, 13, 7), at: [300, 446], lab: 'b' },

        /* ---- divisions ---- */
        { id: 'epitympanum', layer: 'zones', z: 2, kind: 'zone', d: 'M 121 91 L 659 91 L 659 192 L 121 192 Z', at: [640, 110], lab: 'l' },
        { id: 'mesotympanum', layer: 'zones', z: 2, kind: 'zone', d: 'M 121 192 L 659 192 L 659 372 L 121 372 Z', at: [640, 205], lab: 'l', label: 'Mesotympanum' },
        { id: 'hypotympanum', layer: 'zones', z: 2, kind: 'zone', d: 'M 121 372 L 659 372 L 659 459 L 121 459 Z', at: [640, 385], lab: 'l' },
        { id: 'protympanum', layer: 'zones', z: 3, kind: 'zone', d: 'M 572 192 L 659 192 L 659 372 L 572 372 Z', at: [600, 360], lab: 't' },
        { id: 'retrotympanum', layer: 'zones', z: 3, kind: 'zone', d: 'M 121 192 L 245 192 L 245 372 L 121 372 Z', at: [130, 196], lab: 'r' },

        /* ---- medial wall ---- */
        { id: 'promontory', layer: 'medial', z: 10, kind: 'mucosa', d: ell(402, 316, 104, 62), at: [430, 330], lab: 'r' },
        { id: 'lscc', label: 'LSCC prominence', layer: 'medial', z: 11, kind: 'oticfill', d: ell(236, 160, 56, 16), at: [236, 156], lab: 't' },
        { id: 'ow', layer: 'medial', z: 12, kind: 'air', d: ell(336, 252, 38, 19), at: [372, 258], lab: 'r', label: 'Oval window niche' },
        { id: 'stapes', layer: 'medial', z: 14, kind: 'ossicle', d: ell(336, 254, 28, 10) + ' M 312 250 C 314 226, 358 226, 360 250 L 352 250 C 350 234, 322 234, 320 250 Z', evenodd: true, at: [336, 232], lab: 't', label: 'Stapes (footplate + crura)' },
        { id: 'stapedius', layer: 'medial', z: 15, kind: 'tendon', line: true, w: 1.6, d: 'M 232 268 L 334 232', inert: true },
        { id: 'pyramid', layer: 'medial', z: 13, kind: 'bonedark', d: 'M 208 260 L 238 268 L 212 284 Z', at: [210, 272], lab: 'l' },
        { id: 'rw', layer: 'medial', z: 12, kind: 'air', d: ell(282, 354, 27, 22), at: [282, 380], lab: 'b', label: 'Round window niche' },
        { id: 'rwm', layer: 'medial', z: 13, kind: 'tm', d: ell(288, 357, 12, 10), inert: true },
        { id: 'sinustymp', layer: 'medial', z: 12, kind: 'air', d: ell(256, 309, 20, 20), at: [252, 309], lab: 'l' },
        { id: 'ponticulus', layer: 'medial', z: 14, kind: 'bonedark', line: true, w: 5, d: 'M 302 288 C 282 280, 260 278, 238 278', at: [292, 284], lab: 't' },
        { id: 'subiculum', layer: 'medial', z: 14, kind: 'bonedark', line: true, w: 5, d: 'M 300 332 C 282 332, 258 336, 236 344', at: [244, 342], lab: 'b' },
        { id: 'styloid', layer: 'medial', z: 13, kind: 'bonedark', d: ell(204, 392, 11, 8), at: [204, 396], lab: 'b' },
        { id: 'recess', label: 'Facial recess (lateral to FN)', layer: 'medial', z: 16, kind: 'recess', d: 'M 166 200 L 202 206 L 194 302 L 170 292 Z', at: [184, 204], lab: 't' },

        /* ---- nerves ---- */
        { id: 'fn', label: 'Facial nerve', layer: 'nerve', z: 20, kind: 'nerve', line: true, w: 12,
          d: 'M 556 172 C 500 184, 420 198, 330 206 C 280 210, 246 212, 230 230 C 218 250, 214 320, 212 470', at: [214, 420], lab: 'r' },
        { id: 'fn-tymp', label: 'Tympanic segment', layer: 'nerve', z: 21, kind: 'nervemark', d: ell(400, 199, 3, 3), at: [400, 199], lab: 't' },
        { id: 'genu2', layer: 'nerve', z: 21, kind: 'nervemark', d: ell(230, 228, 3, 3), at: [232, 226], lab: 'r' },
        { id: 'geniculate', layer: 'nerve', z: 22, kind: 'nerve', d: ell(566, 168, 13, 11), at: [566, 160], lab: 't' },
        { id: 'gspn', layer: 'nerve', z: 21, kind: 'nerve', line: true, w: 4, d: 'M 576 160 C 600 148, 625 132, 650 118', at: [622, 132], lab: 't', label: 'GSPN' },
        { id: 'jacobson', layer: 'nerve', z: 19, kind: 'nerve', line: true, w: 2.5, d: 'M 410 458 C 404 402, 414 342, 424 284 C 432 244, 470 228, 506 222', at: [412, 400], lab: 'r', label: 'Jacobson\'s nerve' },

        /* ---- anterior wall ---- */
        { id: 'tensor', layer: 'anterior', z: 17, kind: 'muscle', line: true, w: 14, d: 'M 530 212 L 660 236', at: [610, 226], lab: 't', label: 'Tensor tympani' },
        { id: 'cochleariform', layer: 'anterior', z: 18, kind: 'bonedark', d: 'M 506 206 C 524 198, 538 212, 526 226 L 510 222 Z', at: [518, 226], lab: 'b' },
        { id: 'et', layer: 'anterior', z: 17, kind: 'air', d: ell(624, 290, 22, 30), at: [612, 300], lab: 'l', label: 'Eustachian tube' },
        { id: 'cog', layer: 'anterior', z: 32, kind: 'bonedark', line: true, w: 6, d: 'M 504 90 C 507 120, 511 150, 514 176', at: [508, 130], lab: 'l' },
        { id: 'aer', layer: 'anterior', z: 4, kind: 'zone2', d: 'M 518 92 L 620 92 L 620 168 L 520 168 Z', at: [590, 110], lab: 'b' },

        /* ---- vessels ---- */
        { id: 'jb', layer: 'vessels', z: 25, kind: 'veinwall', d: ell(330, 476, 74, 34), at: [330, 452], lab: 't', label: 'Jugular bulb' },
        { id: 'ica', layer: 'vessels', z: 25, kind: 'arterywall', line: true, w: 26, d: 'M 640 476 C 638 420, 636 370, 650 320', at: [640, 420], lab: 'l', label: 'Internal carotid' },

        /* ---- ossicles (ghost: they sit lateral to the wall) ---- */
        { id: 'incus', layer: 'ossicles', z: 40, kind: 'ghost', d: ell(396, 132, 22, 18) + ' M 378 126 L 330 116 L 336 126 Z M 390 148 L 346 230 L 338 228 L 380 146 Z', at: [330, 116], lab: 'l' },
        { id: 'chorda', layer: 'ossicles', z: 41, kind: 'nerve', line: true, w: 3, d: 'M 182 206 C 260 196, 360 190, 430 188 C 500 186, 560 182, 620 176', at: [520, 184], lab: 't' },
        { id: 'malleus', layer: 'ossicles', z: 42, kind: 'ghost', d: ell(452, 136, 18, 22) + ' M 444 156 L 456 156 L 432 306 L 420 304 Z', at: [430, 290], lab: 'r', label: 'Malleus' },

        /* ---- inner ear, projected ---- */
        { id: 'cochlea', layer: 'inner', z: 50, kind: 'innerline', line: true, hair: true, d: spiral(426, 304, 6, 66, 2.5, 0.6), at: [470, 290], lab: 'r' },
        { id: 'vestibule', layer: 'inner', z: 50, kind: 'innerfill', d: ell(318, 232, 46, 30), at: [300, 216], lab: 't' },
        { id: 'ssc', label: 'Superior SCC', layer: 'inner', z: 50, kind: 'innerline', line: true, hair: true, d: ell(300, 112, 26, 54), at: [300, 70], lab: 'r' },
        { id: 'lscc-loop', layer: 'inner', z: 50, kind: 'innerline', line: true, hair: true, d: ell(236, 160, 64, 26), inert: true },
        { id: 'pscc', label: 'Posterior SCC', layer: 'inner', z: 50, kind: 'innerline', line: true, hair: true, d: ell(170, 230, 22, 54), at: [170, 290], lab: 'b' }
    ];

    var T = ['See', 'Why it matters'];
    var TOUR = {
        id: 'reading', name: 'Reading the wall', sub: 'Landmarks in the order you find them', terms: T,
        steps: [
            { title: 'The five divisions', layers: ['walls', 'zones', 'medial'], focus: ['epitympanum', 'mesotympanum', 'hypotympanum', 'protympanum', 'retrotympanum'],
              act: 'The TM\'s upper and lower margins, projected medially, cut the cavity into epi-, meso- and hypotympanum; the windows split pro- from retrotympanum.',
              hazard: 'Disease is described by the compartments it fills; residual cholesteatoma concentrates in the epi- and retrotympanum.' },
            { title: 'Promontory and the two windows', layers: ['walls', 'medial', 'nerve'], focus: ['promontory', 'ow', 'stapes', 'rw', 'jacobson'],
              act: 'The promontory is the basal turn. The oval window and stapes are posterosuperior to it, the round window niche posteroinferior, under an overhang.',
              hazard: 'The round window faces posteroinferiorly: you see it best from behind (facial recess) or with the overhang drilled.' },
            { title: 'The facial nerve corridor', layers: ['walls', 'medial', 'nerve', 'anterior'], focus: ['fn', 'lscc', 'ow', 'cochleariform', 'geniculate'],
              act: 'LSCC prominence above, oval window below: the tympanic facial nerve runs between them, from the geniculate (just anterior to the cochleariform process) to the second genu.',
              hazard: 'The canal over the oval window is the commonest natural dehiscence. Find the cochleariform process and the nerve is just above it.' },
            { title: 'The retrotympanum', layers: ['walls', 'medial', 'nerve'], focus: ['pyramid', 'sinustymp', 'ponticulus', 'subiculum', 'recess', 'styloid'],
              act: 'Pyramid with the stapedius tendon to the stapes. Medial to the nerve and pyramid, the sinus tympani, framed by the ponticulus above and the subiculum below. Lateral to the nerve, the facial recess.',
              hazard: 'The sinus tympani is out of sight from the canal and from the facial recess: check it with an angled endoscope.' },
            { title: 'Anterior wall and floor', layers: ['walls', 'medial', 'anterior', 'vessels'], focus: ['et', 'tensor', 'ica', 'jb', 'hypocells'],
              act: 'Tensor tympani above the Eustachian tube; the carotid medial and inferior to the tube; the jugular bulb under the floor.',
              hazard: 'Bone over either vessel can be dehiscent: a blue (bulb) or red (carotid) mass behind the drum is not to be biopsied.' },
            { title: 'Anterior epitympanum', layers: ['walls', 'medial', 'nerve', 'anterior'], focus: ['cog', 'aer', 'geniculate', 'gspn', 'tegment'],
              act: 'The cog hangs from the tegmen in front of the malleus head; anterior to it, the supratubal recess, with the geniculate in its medial wall.',
              hazard: 'Cholesteatoma left anterior to the cog recurs; dissect here knowing the geniculate is medial.' },
            { title: 'Behind the wall', layers: ['walls', 'medial', 'nerve', 'inner'], focus: ['cochlea', 'vestibule', 'ssc', 'pscc', 'lscc'],
              act: 'The cochlea sits behind the promontory, the vestibule behind the oval window, the canals posterosuperiorly.',
              hazard: 'The footplate is the lid of the vestibule; the promontory is millimetres of bone over the basal turn.' },
            { title: 'Put the ossicles back', layers: ['walls', 'medial', 'nerve', 'ossicles'], focus: ['malleus', 'incus', 'chorda', 'stapes'],
              act: 'The chorda crosses lateral to the long process of incus and medial to the malleus handle.',
              hazard: 'The long process and the chorda are close together: the chorda is stretched or cut when the posterior bony rim is curetted to see the stapes.' }
        ]
    };

    window.OLSB.dioramas.push({
        id: 'medial', name: 'Medial wall', short: 'Medial wall',
        sub: 'The tympanic cavity from lateral, eardrum and malleus/incus removed.',
        orient: 'Right ear · from lateral · anterior → · superior ↑',
        layers: LAYERS,
        structures: S,
        tours: [TOUR],
        views: [{ id: 'full', name: 'Whole', box: [60, 40, 680, 460] }]
    });
})();
