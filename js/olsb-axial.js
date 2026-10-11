/* =============================================================
   olsb-axial.js — OLSB diorama: axial section through the posterior
   tympanum (round window / sinus tympani level).

   A SCHEMATIC axial cut of a RIGHT ear seen from above, laid out like an
   axial CT: lateral to the left, anterior up, medial to the right. It
   teaches what no lateral projection can: the order of the posterior
   wall from lateral to medial (chorda, facial recess, facial nerve,
   pyramid, sinus tympani) and which of those each line of sight reaches.
   Levels are compressed into one plane; proportions invented. Names,
   notes and relations: js/olsb-glossary.js.

   Draft content: medical correctness is the owner's to verify
   (docs/decisions.md section 7).
   ============================================================= */
(function () {
    'use strict';

    var ell = window.OLSB.ell, SH = window.OLSB.shapes;
    /* About 20 px per mm: canal about 8 mm, umbo to promontory about 2 mm,
       facial nerve about 1.7 mm, cochlea about 9 mm across its base. */
    var MM = 20;
    var MASTOID = 'M 10 302 L 204 334 L 226 398 L 300 426 L 432 426 L 456 470 L 10 470 Z';

    var LAYERS = [
        { id: 'bone', name: 'Bone & spaces', desc: 'Temporal bone, canal, middle ear, mastoid cells.' },
        { id: 'post', name: 'Posterior wall', desc: 'Chorda, facial recess, facial nerve, pyramid, sinus tympani.' },
        { id: 'ossicles', name: 'Ossicles', desc: 'Malleus handle and long process of incus in section.' },
        { id: 'inner', name: 'Inner ear', desc: 'Cochlea, posterior canal, internal auditory canal.' },
        { id: 'vessels', name: 'Vessels', desc: 'Carotid and sigmoid sinus.' },
        { id: 'sight', name: 'Lines of sight', desc: 'Canal, facial recess and angled endoscope.' }
    ];

    var S = [
        /* ---- bone and spaces ---- */
        { id: 'bonebg', layer: 'bone', z: 1, bg: true, inert: true, kind: 'bonesec', d: 'M 10 10 L 690 10 L 690 470 L 10 470 Z' },
        { id: 'eac', layer: 'bone', z: 5, bg: true, kind: 'air', d: 'M 10 205 L 238 178 L 206 330 L 10 298 Z', at: [90, 216], lab: 't', label: 'External canal' },
        { id: 'mespace', layer: 'bone', z: 5, bg: true, kind: 'air', d: 'M 240 168 L 312 158 C 300 200, 292 225, 294 248 C 296 275, 310 300, 335 318 L 346 334 L 298 352 L 256 356 L 208 334 Z', at: [262, 190], lab: 'r', label: 'Middle ear' },
        { id: 'et', layer: 'bone', z: 5, bg: true, kind: 'air', d: 'M 244 168 L 312 158 L 352 46 L 322 38 Z', at: [338, 56], lab: 'r', label: 'Protympanum / tube' },
        { id: 'tm', layer: 'bone', z: 8, kind: 'tmline', line: true, w: 3.5, d: 'M 238 176 L 206 330', at: [232, 206], lab: 'l', label: 'TM' },
        { id: 'promontory', layer: 'bone', z: 9, kind: 'mucosaline', line: true, w: 6, d: 'M 312 160 C 300 200, 292 225, 294 248 C 296 275, 310 300, 335 318', at: [296, 250], lab: 'r' },
        { id: 'rw', layer: 'bone', z: 9, kind: 'tm', d: ell(338, 328, 10, 7), at: [344, 330], lab: 'r', label: 'Round window' },
        { id: 'mastoidcells', layer: 'bone', z: 5, kind: 'cells', clip: MASTOID, d: SH.aircells(10, 300, 448, 172, 140, 6, 19, 3), at: [96, 352], lab: 't' },
        { id: 'pcw', layer: 'bone', z: 6, kind: 'mark', d: ell(120, 330, 3, 3), at: [120, 330], lab: 'b', label: 'Posterior canal wall' },

        /* ---- posterior wall, lateral to medial ---- */
        { id: 'chorda', layer: 'post', z: 20, kind: 'nerve', d: ell(214, 361, 6, 6), at: [208, 361], lab: 'l' },
        { id: 'recess', layer: 'post', z: 15, kind: 'recess', d: 'M 218 340 L 250 350 L 244 392 L 228 392 Z', at: [226, 384], lab: 'l' },
        { id: 'fn', label: 'Facial nerve', layer: 'post', z: 20, kind: 'nerve', shade: 'dome', d: ell(268, 382, 17, 17), at: [268, 400], lab: 'b' },
        { id: 'pyramid', layer: 'post', z: 18, kind: 'bonedark', d: 'M 280 358 L 298 356 L 290 372 Z', at: [292, 362], lab: 'r' },
        { id: 'sinustymp', layer: 'post', z: 15, kind: 'air', shade: 'pit', d: 'M 298 354 L 326 352 L 322 414 L 300 408 Z', at: [324, 392], lab: 'r' },

        /* ---- ossicles ---- */
        { id: 'malleus', label: 'Malleus handle', layer: 'ossicles', z: 22, kind: 'ossicle', d: ell(244, 214, 7, 7), at: [250, 214], lab: 'r' },
        { id: 'incus', label: 'Incus long process', layer: 'ossicles', z: 22, kind: 'ossicle', d: ell(256, 292, 6, 6), at: [262, 292], lab: 'r' },

        /* ---- inner ear ---- */
        { id: 'cochlea', layer: 'inner', z: 12, kind: 'oticfill', d: SH.cochleaCapsule(452, 256, MM * 0.85, -45), at: [430, 150], lab: 't' },
        { id: 'cochlea-turns', layer: 'inner', z: 13, inert: true, kind: 'perilymph', d: SH.cochleaLumens(452, 256, MM * 0.85, -45) },
        { id: 'cochlea-lamina', layer: 'inner', z: 14, inert: true, kind: 'spiral', line: true, hair: true, d: SH.cochleaLamina(452, 256, MM * 0.85, -45) },
        { id: 'pscc', label: 'Posterior SCC', layer: 'inner', z: 12, kind: 'oticfill', d: ell(358, 430, 18, 18), at: [378, 434], lab: 'r' },
        { id: 'pscc-lumen', layer: 'inner', z: 13, inert: true, kind: 'perilymph', d: ell(358, 430, 8, 8) },
        { id: 'iac', layer: 'inner', z: 12, kind: 'dura', d: 'M 500 214 L 690 202 L 690 284 L 500 274 Z', at: [600, 240], lab: 't', label: 'Internal auditory canal' },

        /* ---- vessels ---- */
        { id: 'ica', label: 'Internal carotid', layer: 'vessels', z: 12, kind: 'arterywall', shade: 'dome', d: ell(486, 70, 46, 46), at: [534, 70], lab: 'r' },
        { id: 'sigmoid', layer: 'vessels', z: 12, kind: 'veinwall', shade: 'dome', d: ell(540, 452, 84, 36), at: [540, 412], lab: 't' },

        /* ---- lines of sight ---- */
        { id: 'sight-canal', label: 'Line of sight down the canal', layer: 'sight', z: 40, kind: 'cone', d: 'M 10 205 L 320 172 L 320 336 L 10 298 Z', at: [60, 262], lab: 'r' },
        { id: 'sight-recess', label: 'Line of sight via the recess', layer: 'sight', z: 41, kind: 'cone2', d: 'M 48 435 L 326 326 L 340 336 Z', at: [62, 436], lab: 'b' },
        { id: 'sight-endo', label: 'Angled endoscope', layer: 'sight', z: 42, kind: 'route2', line: true, hair: true, arrow: true, d: 'M 40 262 L 232 296 C 268 306, 296 334, 308 378', at: [150, 282], lab: 'b' }
    ];

    var T = ['See', 'Why it matters'];
    var TOUR = {
        id: 'posterior', name: 'The posterior tympanum', sub: 'What sits behind the windows, and what you can see', terms: T,
        steps: [
            { title: 'Orientation', layers: ['bone', 'ossicles', 'inner', 'vessels'], focus: ['eac', 'tm', 'mespace', 'promontory', 'cochlea', 'et'],
              act: 'Like an axial CT of the right ear: lateral is left, anterior is up. The TM is oblique; the middle ear is a slit between it and the promontory, the cochlea medial to that.',
              hazard: 'The narrow mesotympanum is why a retracted drum lies on the promontory and the incus.' },
            { title: 'The posterior wall, lateral to medial', view: 'close', layers: ['bone', 'post', 'ossicles'], focus: ['chorda', 'recess', 'fn', 'pyramid', 'sinustymp'],
              act: 'Chorda, then the facial recess, then the facial nerve, then the pyramid, then the sinus tympani, which runs back medial to the nerve.',
              hazard: 'The nerve divides the two recesses: the facial recess is drilled lateral to it, the sinus tympani lies medial to it and is never drilled into.' },
            { title: 'Through the canal', layers: ['bone', 'post', 'ossicles', 'sight'], focus: ['sight-canal', 'recess', 'sinustymp'],
              act: 'A straight line down the canal sees the middle ear but neither pocket of the posterior wall.',
              hazard: 'A transcanal microscopic view leaves both recesses unseen: residual disease hides there.' },
            { title: 'Through the facial recess', view: 'close', layers: ['bone', 'post', 'ossicles', 'sight'], focus: ['sight-recess', 'rw', 'fn', 'chorda', 'sinustymp'],
              act: 'From the mastoid, between the chorda and the nerve, the line of sight reaches the round window niche: the cochlear implant route.',
              hazard: 'The window is only as wide as the gap between nerve and chorda. The sinus tympani is still out of sight, medial to the nerve.' },
            { title: 'The angled endoscope', view: 'close', layers: ['bone', 'post', 'ossicles', 'sight'], focus: ['sight-endo', 'sinustymp', 'pyramid'],
              act: 'An angled endoscope through the canal turns the corner into the sinus tympani.',
              hazard: 'Why an endoscopic second look (or endoscope-assisted surgery) finds cholesteatoma the microscope missed.' },
            { title: 'Deep relations', layers: ['bone', 'post', 'inner', 'vessels'], focus: ['pscc', 'iac', 'ica', 'sigmoid', 'mastoidcells'],
              act: 'The posterior canal limits how deep the sinus tympani goes; the carotid is anterior to the cochlea, the IAC medial to it, the sigmoid posteromedial.',
              hazard: 'A deep sinus tympani reaches toward the posterior canal: blind curettage there risks a fistula.' }
        ]
    };

    window.OLSB.dioramas.push({
        id: 'axial', name: 'Axial: posterior tympanum', short: 'Axial',
        sub: 'An axial cut at the round window, laid out like CT, with lines of sight.',
        orient: 'Right ear · axial, from above · lateral ← · anterior ↑',
        layers: LAYERS,
        structures: S,
        tours: [TOUR],
        views: [{ id: 'full', name: 'Whole', box: [0, 10, 700, 479] }, { id: 'close', name: 'Recesses', box: [110, 170, 380, 260] }],
        scale: MM
    });
})();
