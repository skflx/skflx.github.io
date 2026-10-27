/* =============================================================
   js/olsb/lateral.js — OLSB diorama: the surgical lateral view.

   A SCHEMATIC lateral (surgeon's) view of a RIGHT temporal bone:
   anterior is to the right, superior is up, and every structure is
   projected onto that one plane whatever its depth. Proportions are
   exaggerated where a true projection would stack structures on top
   of each other (the facial recess is widened, the posterior canal
   wall is drawn thick). Not to scale; not traced from imaging.

   Every structure belongs to one LAYER (what the toggles show and
   hide) and paints at its `z` (deep first). Coordinates are in the
   SVG's user units (viewBox 0 0 900 640). `at` is where its marker
   sits, `lab` which side its name goes (l/r/t/b). Names, notes and
   relations come from js/olsb/glossary.js by id.

   Content is draft: medical correctness is the owner's to verify
   (docs/decisions.md section 7). Data only; js/olsb/main.js draws it.
   ============================================================= */
(function () {
    'use strict';

    var ell = window.OLSB.ell, SH = window.OLSB.shapes;
    /* About 13.3 px per mm (TM about 9 mm tall). Sizes follow textbook
       dimensions; positions are a projection, spread where depths stack. */
    var MM = 13.3;

    /* Shared outlines. */
    var CORTEX = 'M 800 238 C 700 228, 560 215, 420 205 C 300 196, 200 186, 140 200 C 128 260, 134 350, 170 430 '
        + 'C 215 505, 280 555, 345 578 C 380 592, 412 578, 422 540 C 432 505, 455 470, 500 455 '
        + 'C 560 445, 640 440, 690 410 C 730 385, 770 330, 800 300 Z';
    var SKIN = 'M 860 110 L 860 600 L 120 600 L 110 150 C 300 110, 600 100, 860 110 Z';
    var EAC = ell(560, 335, 62, 80);              /* bony canal (porus), seen end-on */
    var CAVITY = 'M 492 238 L 262 226 C 254 300, 260 392, 290 452 C 318 500, 360 524, 400 526 '
        + 'C 442 524, 468 492, 478 450 C 484 400, 486 340, 488 290 Z';
    var TM_CX = 562, TM_CY = 344, TM_RX = 48, TM_RY = 60;
    var TM = ell(TM_CX, TM_CY, TM_RX, TM_RY);
    var PERF = ell(585, 368, 14, 16);             /* anteroinferior central perforation */
    var TM_ANT = 'M 562 284 A 48 60 0 0 1 562 404 L 556 346 L 553 292 Z';  /* anterior remnant, hinge on the manubrium */

    var LAYERS = [
        { id: 'skin', name: 'Skin', desc: 'Postauricular skin and the incision.' },
        { id: 'soft', name: 'Soft tissue', desc: 'Temporalis fascia and the musculoperiosteal flap.' },
        { id: 'cortex', name: 'Cortex', desc: 'Lateral mastoid cortex and its surface landmarks.' },
        { id: 'tm', name: 'Canal & TM', desc: 'Tympanic membrane, annulus and canal incisions.' },
        { id: 'me', name: 'Middle ear', desc: 'Ossicles, windows, promontory, medial-wall landmarks.' },
        { id: 'mastoid', name: 'Mastoid cavity', desc: 'Cortical mastoidectomy: boundaries and antral landmarks.' },
        { id: 'fn', name: 'Facial nerve', desc: 'Facial nerve course, chorda tympani, facial recess.' },
        { id: 'deep', name: 'Deep hazards', desc: 'Dura, venous sinuses, carotid, labyrinth beyond the cavity.' }
    ];

    /* needs: other layers that must also be on (the facial recess only exists
       once the mastoid is open; it is drilled through the canal-wall bone,
       so it paints above the cortex). */
    /* kind -> css class k-<kind> (fill/stroke tokens in css/olsb.css).
       line: stroke only. w: stroke width in user units (scales with zoom);
       hair: hairline that does not scale. */
    var S = [
        /* ---- base: canal lumen (always drawn, not a structure) ---- */
        { id: 'lumen', layer: 'base', z: 5, kind: 'air', d: EAC, inert: true },

        /* ---- mastoid cavity (drilled) ---- */
        { id: 'cavity', layer: 'mastoid', z: 10, bg: true, kind: 'bonecut', shade: 'pit', d: CAVITY, at: [380, 480], lab: 'b' },
        { id: 'cells-open', layer: 'mastoid', z: 11, inert: true, kind: 'cellopen', clip: CAVITY, d: SH.aircells(258, 222, 236, 310, 90, 6, 17, 7) },
        { id: 'antrum', layer: 'mastoid', z: 31, kind: 'air', shade: 'pit', d: ell(458, 268, 38, 23), at: [422, 270], lab: 'l' },
        { id: 'koerner', layer: 'mastoid', z: 33, kind: 'lamina', line: true, w: 3, d: 'M 425 248 L 498 272', at: [425, 249], lab: 'l' },
        { id: 'tegmen', layer: 'mastoid', z: 32, kind: 'plate', line: true, w: 6, d: 'M 264 228 L 490 238', at: [360, 232], lab: 't' },
        { id: 'sigplate', layer: 'mastoid', z: 32, kind: 'sinusplate', line: true, w: 8, d: 'M 262 230 C 254 300, 260 392, 290 452 C 302 474, 316 490, 332 502', at: [264, 380], lab: 'r' },
        { id: 'sinodural', layer: 'mastoid', z: 34, kind: 'mark', d: 'M 262 226 L 282 227 L 263 246 Z', at: [263, 230], lab: 'l' },
        { id: 'pcw', layer: 'mastoid', z: 33, kind: 'plate', line: true, w: 7, d: 'M 493 248 C 490 320, 488 390, 480 446', at: [490, 410], lab: 'r' },
        { id: 'lscc', layer: 'mastoid', z: 35, kind: 'canal', line: true, w: 11, d: 'M 422 296 C 428 270, 496 266, 506 296', at: [430, 292], lab: 'l' },
        { id: 'digastric', layer: 'mastoid', z: 34, kind: 'plate', line: true, w: 5, d: 'M 330 502 C 380 494, 430 482, 470 474', at: [392, 494], lab: 'b' },

        /* ---- deep hazards ---- */
        { id: 'mcfdura', layer: 'deep', z: 20, kind: 'dura', d: 'M 262 226 L 492 238 C 560 240, 610 244, 650 246 C 640 222, 600 200, 520 192 C 420 184, 300 182, 250 196 Z', at: [480, 212], lab: 't' },
        { id: 'sigmoid', layer: 'deep', z: 21, kind: 'vein', line: true, w: 94, d: 'M 212 205 C 204 320, 210 420, 244 482 C 280 540, 370 570, 450 552 C 505 538, 535 500, 552 462', at: [192, 330], lab: 'l' },
        { id: 'transverse', layer: 'deep', z: 21, kind: 'vein', line: true, w: 84, d: 'M 212 205 C 180 196, 150 192, 100 192', at: [160, 186], lab: 't' },
        { id: 'jb', layer: 'deep', z: 22, kind: 'vein', shade: 'dome', d: ell(556, 452, 58, 38), at: [556, 456], lab: 'b' },
        { id: 'ica', layer: 'deep', z: 22, kind: 'artery', line: true, w: 60, d: 'M 650 492 C 650 440, 648 390, 668 340', at: [672, 430], lab: 'r' },
        { id: 'pscc', layer: 'deep', z: 24, kind: 'canal', line: true, w: 9, inner: true, d: 'M 410 262 C 386 282, 386 330, 410 350', at: [404, 352], lab: 'b' },
        { id: 'donaldson', layer: 'deep', z: 25, kind: 'refline', line: true, hair: true, d: 'M 506 294 L 262 306', at: [330, 302], lab: 't' },
        { id: 'els', layer: 'deep', z: 23, kind: 'dura', d: ell(318, 352, 26, 40), at: [318, 392], lab: 'b' },

        /* ---- facial nerve layer ---- */
        { id: 'fn', label: 'Facial nerve (tympanic + mastoid)', layer: 'fn', z: 40, kind: 'nerve', line: true, w: 18,
          d: 'M 614 283 C 585 294, 550 311, 522 311 C 502 310, 490 300, 485 316 C 480 345, 480 395, 474 472', at: [478, 384], lab: 'l' },
        { id: 'fn-tymp', layer: 'fn', z: 41, kind: 'nervemark', d: ell(572, 301, 3, 3), at: [572, 301], lab: 'r' },
        { id: 'genu2', layer: 'fn', z: 41, kind: 'nervemark', d: ell(486, 312, 3, 3), at: [486, 312], lab: 'l' },
        { id: 'smf', layer: 'fn', z: 41, kind: 'nervemark', d: ell(474, 472, 5, 5), at: [474, 474], lab: 'r' },
        { id: 'geniculate', layer: 'fn', z: 41, kind: 'nerve', shade: 'dome', d: ell(616, 283, 13, 11), at: [624, 276], lab: 'r' },
        { id: 'chorda', layer: 'fn', z: 42, kind: 'nerve', line: true, w: 4.5,
          d: 'M 478 440 C 488 400, 504 345, 520 314 C 546 302, 578 298, 606 298', at: [548, 299], lab: 'b' },
        { id: 'chorda-wall', layer: 'fn', z: 66, needs: ['mastoid'], kind: 'nerve', line: true, w: 4.5, inert: true,
          d: 'M 482 420 C 492 385, 505 345, 520 314' },
        { id: 'recess', layer: 'fn', z: 64, needs: ['mastoid'], kind: 'recess', d: 'M 493 318 L 518 318 L 486 425 Z', at: [492, 340], lab: 'l' },
        { id: 'buttress', layer: 'fn', z: 65, needs: ['mastoid'], kind: 'plate', d: 'M 486 302 L 514 300 L 520 314 L 492 316 Z', at: [500, 301], lab: 't' },

        /* ---- middle ear (ossicles from js/olsb/shapes.js, true size) ---- */
        { id: 'promontory', layer: 'me', z: 50, kind: 'mucosa', shade: 'dome', d: ell(566, 356, 30, 25), at: [578, 356], lab: 'r' },
        { id: 'rw', layer: 'me', z: 52, kind: 'air', shade: 'pit', d: ell(526, 382, 13, 11), at: [526, 394], lab: 'b' },
        { id: 'ow', layer: 'me', z: 52, kind: 'air', shade: 'pit', d: ell(528, 327, 24, 12), at: [552, 330], lab: 'r' },
        { id: 'stapes', layer: 'me', z: 56, kind: 'ossicle', evenodd: true, d: SH.stapesEnd(528, 327, MM), at: [528, 338], lab: 'b' },
        { id: 'sinustymp', layer: 'me', z: 52, kind: 'air', shade: 'pit', d: ell(504, 354, 8, 12), at: [499, 356], lab: 'l' },
        { id: 'pyramid', layer: 'me', z: 53, kind: 'bone', shade: 'dome', d: 'M 504 334 L 518 324 L 516 340 Z', at: [508, 334], lab: 'l' },
        { id: 'stapedius', layer: 'me', z: 54, kind: 'tendon', line: true, w: 1.4, d: 'M 516 331 L 526 326', inert: true },
        { id: 'cochleariform', layer: 'me', z: 53, kind: 'bone', d: 'M 584 296 C 594 295, 597 308, 587 310 Z', at: [592, 304], lab: 'r' },
        { id: 'tensor-tendon', layer: 'me', z: 54, kind: 'tendon', line: true, w: 1.6, d: 'M 586 303 L 553 271', inert: true },
        { id: 'et', layer: 'me', z: 52, kind: 'air', shade: 'pit', d: ell(606, 334, 9, 13), at: [610, 338], lab: 'r' },
        { id: 'incus', layer: 'me', z: 55, kind: 'ossicle', d: SH.incusLat(517, 248, MM), at: [527, 292], lab: 'l' },
        { id: 'isj', layer: 'me', z: 57, kind: 'ossicle', d: ell(523, 323, 3, 3), at: [523, 323], lab: 'l' },
        { id: 'malleus', label: 'Malleus (manubrium)', layer: 'me', z: 56, kind: 'ossicle', d: SH.malleusLat(550, 289, MM), at: [559, 322], lab: 'r' },

        /* ---- cortex ---- */
        { id: 'cortex', layer: 'cortex', z: 60, bg: true, kind: 'bone', d: CORTEX + ' ' + EAC, dDrilled: CORTEX + ' ' + EAC + ' ' + CAVITY, evenodd: true, at: [260, 420], lab: 'b' },
        { id: 'templine', layer: 'cortex', z: 62, kind: 'refline', line: true, hair: true, d: 'M 790 250 C 650 248, 540 246, 470 243 C 380 238, 260 225, 190 212', at: [300, 228], lab: 't' },
        { id: 'macewen', layer: 'cortex', z: 61, kind: 'zone', d: 'M 498 243 L 556 243 L 560 255 A 62 80 0 0 0 498 335 Z', at: [512, 262], lab: 'l' },
        { id: 'henle', layer: 'cortex', z: 63, kind: 'bonedark', d: 'M 520 282 L 502 268 L 524 276 Z', at: [508, 272], lab: 'l' },
        { id: 'zygroot', layer: 'cortex', z: 62, kind: 'bonedark', line: true, w: 6, d: 'M 640 252 C 700 250, 760 248, 800 246', at: [740, 250], lab: 't' },
        { id: 'tip', layer: 'cortex', z: 62, kind: 'mark', d: ell(372, 560, 4, 4), at: [372, 562], lab: 'b' },

        /* ---- canal and tympanic membrane ---- */
        { id: 'graft', layer: 'tm', z: 70, kind: 'fascia', d: ell(563, 345, 54, 66), tm: ['graft'], at: [610, 360], lab: 'r' },
        { id: 'tm', layer: 'tm', z: 72, kind: 'tm', d: TM, dByTm: { perf: TM + ' ' + PERF, flap: TM_ANT + ' ' + PERF, graft: TM + ' ' + PERF }, evenodd: true, at: [600, 320], lab: 'r' },
        { id: 'flaccida', layer: 'tm', z: 72, kind: 'tm', d: 'M 538 285 C 545 270, 566 268, 578 284 C 565 279, 550 279, 538 285 Z', at: [558, 276], lab: 't' },
        { id: 'annulus', layer: 'tm', z: 73, kind: 'annulus', line: true, w: 2.4, d: TM, at: [520, 380], lab: 'l' },
        { id: 'perf', layer: 'tm', z: 74, kind: 'rim', line: true, w: 1.6, d: PERF, tm: ['perf', 'flap', 'graft'], at: [585, 384], lab: 'b' },
        { id: 'flap', layer: 'tm', z: 75, kind: 'skin', d: 'M 562 270 C 640 290, 640 396, 562 412 C 604 380, 604 302, 562 270 Z', tm: ['flap'], at: [604, 296], lab: 't' },
        { id: 'tmincision', layer: 'tm', z: 76, tm: ['intact', 'perf'], kind: 'incision', line: true, hair: true, d: 'M 561 264 A 58 76 0 0 0 561 416 M 562 284 L 561 264 M 562 404 L 561 416', at: [503, 340], lab: 'l' },

        /* ---- soft tissue ---- */
        { id: 'fascia', layer: 'soft', z: 80, kind: 'fascia', d: 'M 450 120 C 540 110, 640 112, 700 130 L 690 205 C 620 214, 530 214, 460 208 Z', at: [600, 160], lab: 't' },
        { id: 'tincision', layer: 'soft', z: 82, kind: 'incision2', line: true, hair: true, d: 'M 650 246 L 300 222 M 470 240 L 395 548', at: [420, 420], lab: 'l' },

        /* ---- skin ---- */
        { id: 'skin', layer: 'skin', z: 90, bg: true, kind: 'skin', d: SKIN + ' ' + EAC, evenodd: true, at: [250, 300], lab: 't' },
        { id: 'sulcus', layer: 'skin', z: 91, kind: 'crease', line: true, hair: true, d: 'M 606 150 C 480 170, 440 300, 458 400 C 470 470, 520 510, 566 520', at: [454, 300], lab: 'r' },
        { id: 'paincision', layer: 'skin', z: 92, kind: 'incision', line: true, hair: true, d: 'M 590 130 C 440 160, 398 300, 420 405 C 435 480, 490 525, 530 538', at: [404, 300], lab: 'l' }
    ];

    var TYMPANOPLASTY = {
        id: 'tympanoplasty', name: 'Tympanoplasty', sub: 'Postauricular, underlay (medial) graft', terms: ['Do', 'Hazard'],
        steps: [
            { title: 'Approach and graft harvest', view: 'field', layers: ['skin', 'soft', 'cortex'], focus: ['paincision', 'fascia'],
              act: 'Postauricular incision behind the sulcus. Harvest temporalis fascia above the temporal line; thin it and set it aside to dry.',
              hazard: 'Infants: facial nerve superficial at the undeveloped tip; keep the incision superior.' },
            { title: 'Canal incisions', view: 'canal', layers: ['cortex', 'tm'], tm: 'perf', focus: ['tmincision', 'perf'],
              act: 'Inject the canal. Radial incisions near 12 and 6 o\'clock joined by a posterior curved incision lateral to the annulus.',
              hazard: 'Tearing thin canal skin; bleeding obscuring the field (inject all four quadrants and wait).' },
            { title: 'Elevate the flap, enter the middle ear', view: 'canal', layers: ['cortex', 'tm', 'me', 'fn'], tm: 'flap', focus: ['annulus', 'chorda', 'flap'],
              act: 'Raise the tympanomeatal flap to the annulus. Lift the annulus out of the sulcus posteroinferiorly first, then superiorly to find the chorda.',
              hazard: 'Chorda tympani at the posterosuperior annulus; a high jugular bulb inferiorly.' },
            { title: 'Inspect the ossicular chain', view: 'canal', layers: ['cortex', 'tm', 'me', 'fn'], tm: 'flap', focus: ['malleus', 'incus', 'isj', 'stapes', 'rw', 'fn-tymp'],
              act: 'Palpate the malleus and watch the stapes and the round window reflex. Check the long process of incus. Curette the scutum only if the stapes cannot be seen.',
              hazard: 'Force on the stapes (sensorineural loss); a dehiscent tympanic facial nerve over the oval window.' },
            { title: 'Rim the perforation, pack the middle ear', view: 'canal', layers: ['cortex', 'tm', 'me'], tm: 'flap', focus: ['perf', 'et', 'promontory'],
              act: 'Freshen the perforation edge and remove epithelium from its undersurface. Gelfoam into the anterior mesotympanum and protympanum to hold the graft up.',
              hazard: 'Epithelium left under the remnant becomes a cholesteatoma.' },
            { title: 'Place the underlay graft', view: 'canal', layers: ['cortex', 'tm', 'me'], tm: 'graft', focus: ['graft', 'malleus', 'perf'],
              act: 'Graft medial to the remnant and annulus, tucked anteriorly; medial (or lateral) to the manubrium per preference. Replace the flap over it.',
              hazard: 'Anterior failure: the graft slips off the anterior remnant (residual anterior perforation).' },
            { title: 'Close and pack', view: 'canal', layers: ['cortex', 'tm'], tm: 'graft', focus: ['tm', 'annulus'],
              act: 'Flap returned with no gap; Gelfoam in the canal against it. Close the postauricular wound in layers.',
              hazard: 'Blunting and lateralization are failures of overlay grafts; underlay grafts fail medially and anteriorly.' }
        ]
    };

    var MASTOID = {
        id: 'mastoidectomy', name: 'Mastoidectomy', sub: 'Canal wall up, with facial recess', terms: ['Do', 'Hazard'],
        steps: [
            { title: 'Exposure', view: 'field', layers: ['skin', 'soft', 'cortex'], focus: ['paincision', 'tincision'],
              act: 'Postauricular incision; T-shaped musculoperiosteal incision along the temporal line and down toward the tip. Raise the periosteum forward to the spine of Henle.',
              hazard: 'Infants: superficial facial nerve at the tip.' },
            { title: 'Surface landmarks', view: 'field', layers: ['cortex', 'tm'], tm: 'intact', focus: ['templine', 'henle', 'macewen', 'zygroot', 'tip'],
              act: 'The first cuts make a triangle: along the temporal line (tegmen level), down along the posterior canal wall, and joined behind toward the tip.',
              hazard: 'A low-lying tegmen sits below the temporal line: read the CT.' },
            { title: 'Define the boundaries', view: 'field', layers: ['cortex', 'tm', 'mastoid'], tm: 'intact', focus: ['tegmen', 'sigplate', 'pcw', 'sinodural'],
              act: 'Largest cutting burr, broad strokes, saucerize. Thin the tegmen and the sigmoid plate; thin the posterior canal wall from behind without breaching it.',
              hazard: 'Sigmoid (bleeding, air embolism); tegmen dura (CSF leak); breach of the posterior canal wall.' },
            { title: 'Antrum and lateral canal', view: 'field', layers: ['cortex', 'tm', 'mastoid', 'me'], tm: 'intact', focus: ['antrum', 'koerner', 'lscc', 'incus'],
              act: 'Follow the tegmen anteriorly and deep to Macewen\'s triangle into the antrum; take down Koerner\'s septum. Find the LSCC and the short process of incus in the fossa incudis.',
              hazard: 'Burr on the incus (drill noise to the cochlea); LSCC fistula in cholesteatoma.' },
            { title: 'Facial nerve and digastric ridge', view: 'field', layers: ['cortex', 'tm', 'mastoid', 'fn'], tm: 'intact', focus: ['fn', 'genu2', 'digastric', 'smf'],
              act: 'With a diamond burr and irrigation, follow the nerve from below the LSCC down to the anterior end of the digastric ridge, through bone. Drill parallel to it.',
              hazard: 'Facial nerve. The vertical segment runs more lateral inferiorly; never drill blind deep to the tip.' },
            { title: 'Facial recess', view: 'recess', layers: ['cortex', 'tm', 'mastoid', 'fn', 'me'], tm: 'intact', focus: ['recess', 'chorda', 'buttress', 'rw', 'stapes', 'sinustymp'],
              act: 'Open the triangle between the nerve, the chorda and the incus buttress. Through it: stapes, round window niche (implant route), posterior mesotympanum.',
              hazard: 'Facial nerve medially; chorda laterally; the buttress protects the incus. The sinus tympani stays hidden.' },
            { title: 'Deep landmarks', view: 'field', layers: ['cortex', 'tm', 'mastoid', 'fn', 'me', 'deep'], tm: 'intact', ghost: true, focus: ['donaldson', 'els', 'pscc', 'jb', 'ica', 'mcfdura'],
              act: 'Beyond the cavity: Donaldson\'s line to the endolymphatic sac; the labyrinth medial to the antrum; the jugular bulb and carotid around the middle ear.',
              hazard: 'High jugular bulb; dehiscent carotid; posterior fossa dura medial to the sigmoid.' }
        ]
    };

    /* Viewports (viewBox). field: whole lateral surface; canal: through the
       speculum; recess: the posterior tympanotomy region. */
    var VIEWS = [
        { id: 'field', name: 'Field', box: [120, 100, 760, 520] },
        { id: 'canal', name: 'Canal', box: [432, 240, 260, 178] },
        { id: 'recess', name: 'Recess', box: [380, 220, 290, 198] }
    ];

    window.OLSB.dioramas.push({
        id: 'lateral', name: 'Surgical lateral', short: 'Lateral',
        sub: 'The surgeon\'s view, skin to deep hazards, every depth projected onto one plane.',
        orient: 'Right ear \u00b7 lateral \u00b7 anterior \u2192 \u00b7 superior \u2191',
        layers: LAYERS,
        structures: S,
        tours: [TYMPANOPLASTY, MASTOID],
        views: VIEWS,
        scale: MM,
        tmStates: ['intact', 'perf', 'flap', 'graft']
    });
})();
