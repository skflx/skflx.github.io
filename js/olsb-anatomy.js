/* =============================================================
   olsb-anatomy.js — OLSB (otology / lateral skull base) data.

   A SCHEMATIC lateral (surgeon's) view of a RIGHT temporal bone:
   anterior is to the right, superior is up, and every structure is
   projected onto that one plane whatever its depth. Proportions are
   exaggerated where a true projection would stack structures on top
   of each other (the facial recess is widened, the posterior canal
   wall is drawn thick). Not to scale; not traced from imaging.

   Every structure belongs to one LAYER (what the toggles show and
   hide) and paints at its `z` (deep first). Coordinates are in the
   SVG's user units (viewBox 0 0 900 640). `at` is where its marker
   sits, `lab` which side its name goes (l/r/t/b).

   Content is draft: medical correctness is the owner's to verify
   (docs/decisions.md section 7). Data only; js/olsb.js draws it.
   ============================================================= */
(function () {
    'use strict';

    function ell(cx, cy, rx, ry) {
        return 'M ' + (cx - rx) + ' ' + cy + ' a ' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0 a ' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0 Z';
    }

    /* Shared outlines. */
    var CORTEX = 'M 800 238 C 700 228, 560 215, 420 205 C 320 198, 230 190, 175 205 C 160 260, 165 340, 200 420 '
        + 'C 240 490, 290 545, 345 575 C 380 590, 410 575, 420 540 C 430 505, 455 470, 500 455 '
        + 'C 560 445, 640 440, 690 410 C 730 385, 770 330, 800 300 Z';
    var SKIN = 'M 860 110 L 860 600 L 120 600 L 110 150 C 300 110, 600 100, 860 110 Z';
    var EAC = ell(560, 335, 62, 80);              /* bony canal (porus), seen end-on */
    var CAVITY = 'M 492 238 L 337 228 C 332 300, 337 380, 352 440 C 367 480, 390 510, 410 515 '
        + 'C 440 515, 466 490, 476 450 C 482 400, 484 340, 486 290 Z';
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
        { id: 'cavity', layer: 'mastoid', z: 10, bg: true, kind: 'bonecut', d: CAVITY, at: [400, 470], lab: 'b',
          name: 'Mastoid cavity',
          note: 'Cortical (canal wall up) mastoidectomy: saucerized, with the widest part at the cortex so the deep landmarks stay in view. Boundaries: tegmen above, sigmoid behind, posterior canal wall in front, mastoid tip below.' },
        { id: 'antrum', layer: 'mastoid', z: 31, kind: 'air', d: ell(455, 262, 26, 17), at: [434, 268], lab: 'l',
          name: 'Mastoid antrum',
          note: 'The largest constant air cell; lies about 12-15 mm deep to Macewen\'s triangle in the adult, at the level of the tegmen. Connects to the epitympanum through the aditus ad antrum.' },
        { id: 'koerner', layer: 'mastoid', z: 33, kind: 'lamina', line: true, w: 2.5, d: 'M 430 252 L 480 270', at: [431, 253], lab: 'l',
          name: 'Koerner\'s septum',
          note: 'Petrosquamous lamina lateral to the antrum. Can be mistaken for the medial wall of the antrum: drilling stops short and the true antrum and LSCC are missed. Take it down to enter the antrum.' },
        { id: 'tegmen', layer: 'mastoid', z: 32, kind: 'plate', line: true, w: 5, d: 'M 340 229 L 490 238', at: [400, 232], lab: 't',
          name: 'Tegmen mastoideum',
          note: 'Bony plate under middle fossa dura; the superior limit. Follow it anteriorly to the antrum and attic. Thin it, keep a bone shell over the dura. Its level is approximated on the surface by the temporal line.' },
        { id: 'sigplate', layer: 'mastoid', z: 32, kind: 'sinusplate', line: true, w: 6, d: 'M 337 232 C 332 300, 337 380, 352 440 C 360 462, 372 482, 386 497', at: [340, 360], lab: 'r',
          name: 'Sigmoid plate',
          note: 'Bone over the sigmoid sinus; the posterior limit. Saucerize back to it so the cavity is not a deep pit, but leave a thin shell (a bluish hue through bone). Injury: brisk venous bleeding and air embolism; control with pressure, Surgicel, bone wax.' },
        { id: 'sinodural', layer: 'mastoid', z: 34, kind: 'mark', d: 'M 337 228 L 352 229 L 338 243 Z', at: [338, 230], lab: 'l',
          name: 'Sinodural angle (Citelli)',
          note: 'Junction of tegmen and sigmoid plate; superior petrosal sinus runs medially from here. Opening it widens the posterosuperior cavity; cells here are a site of residual disease.' },
        { id: 'pcw', layer: 'mastoid', z: 33, kind: 'plate', line: true, w: 7, d: 'M 493 248 C 490 320, 488 390, 480 446', at: [490, 400], lab: 'r',
          name: 'Posterior canal wall',
          note: 'Kept intact in a canal-wall-up mastoidectomy; thinned from behind (keep it in view in the canal) without breach. Taking it down to the facial ridge converts to canal wall down.' },
        { id: 'lscc', layer: 'mastoid', z: 35, kind: 'otic', line: true, w: 5, d: 'M 436 279 C 440 268, 470 266, 476 279', at: [456, 276], lab: 'b',
          name: 'Lateral semicircular canal',
          note: 'Smooth, dense, ivory-yellow otic capsule in the medial wall of the antrum. The key landmark of the mastoid: the facial nerve\'s second genu lies just anteroinferior to it, and its plane (extended posteriorly) is Donaldson\'s line. Cholesteatoma can erode it (fistula).' },
        { id: 'digastric', layer: 'mastoid', z: 34, kind: 'plate', line: true, w: 4, d: 'M 385 505 C 410 496, 440 482, 466 472', at: [418, 494], lab: 'b',
          name: 'Digastric ridge',
          note: 'Ridge in the floor of the mastoid tip from the digastric groove. Followed anteriorly it leads to the stylomastoid foramen: the facial nerve exits at its anterior end.' },

        /* ---- deep hazards ---- */
        { id: 'mcfdura', layer: 'deep', z: 20, kind: 'dura', d: 'M 337 229 L 492 238 C 560 240, 610 244, 650 246 C 640 222, 600 200, 520 192 C 440 186, 360 184, 326 196 Z', at: [500, 214], lab: 't',
          name: 'Middle fossa dura',
          note: 'Above the tegmen. Exposed dura is tolerated if not torn; a tear risks CSF leak and encephalocele. Bipolar shrinks small herniations.' },
        { id: 'sigmoid', layer: 'deep', z: 21, kind: 'vein', line: true, w: 30, d: 'M 318 214 C 314 320, 322 420, 352 478 C 380 525, 420 540, 465 528 C 505 515, 535 485, 552 458', at: [316, 300], lab: 'l',
          name: 'Sigmoid sinus',
          note: 'Continues the transverse sinus down to the jugular bulb. Its position varies: an anterior (forward-lying) sigmoid narrows the mastoid and the retrolabyrinthine window; check the CT.' },
        { id: 'transverse', layer: 'deep', z: 21, kind: 'vein', line: true, w: 26, d: 'M 318 214 C 280 202, 230 195, 178 198', at: [230, 198], lab: 't',
          name: 'Transverse sinus',
          note: 'Runs posteriorly from the sinodural angle region; the top of the sigmoid.' },
        { id: 'jb', layer: 'deep', z: 22, kind: 'vein', d: ell(556, 442, 22, 17), at: [556, 446], lab: 'b',
          name: 'Jugular bulb',
          note: 'Under the floor of the hypotympanum. A high or dehiscent bulb can sit behind the inferior tympanic membrane: risk when elevating the annulus inferiorly or drilling the hypotympanum.' },
        { id: 'ica', layer: 'deep', z: 22, kind: 'artery', line: true, w: 16, d: 'M 646 478 C 646 430, 644 380, 662 334', at: [650, 420], lab: 'r',
          name: 'Internal carotid artery',
          note: 'Petrous carotid runs vertically anterior to the cochlea and protympanum, then turns anteromedially. Its canal wall may be dehiscent in the anterior mesotympanum; an aberrant carotid presents as a retrotympanic mass.' },
        { id: 'pscc', layer: 'deep', z: 24, kind: 'otic', line: true, w: 4, d: 'M 426 270 C 416 280, 416 305, 426 316', at: [420, 312], lab: 'b',
          name: 'Posterior semicircular canal',
          note: 'Posterior to the LSCC and perpendicular to it; bisected by Donaldson\'s line. Its ampulla lies near the second genu of the facial nerve, medial to it.' },
        { id: 'donaldson', layer: 'deep', z: 25, kind: 'refline', line: true, hair: true, d: 'M 478 279 L 338 300', at: [360, 297], lab: 't',
          name: 'Donaldson\'s line',
          note: 'The plane of the LSCC extended posteriorly to the sigmoid; it bisects the PSCC. The endolymphatic sac lies inferior to it, medial to the sigmoid (sac decompression).' },
        { id: 'els', layer: 'deep', z: 23, kind: 'dura', d: ell(366, 345, 17, 26), at: [366, 352], lab: 'r',
          name: 'Endolymphatic sac',
          note: 'Dural thickening below Donaldson\'s line, between the PSCC and the sigmoid, on the posterior fossa dura.' },

        /* ---- facial nerve layer ---- */
        { id: 'fn', layer: 'fn', z: 40, kind: 'nerve', line: true, w: 7,
          d: 'M 614 283 C 585 292, 548 308, 515 306 C 495 304, 482 298, 476 308 C 470 330, 470 380, 468 470', at: [470, 360], lab: 'l',
          name: 'Facial nerve (tympanic + mastoid)',
          note: 'Tympanic segment runs posteriorly above the oval window and stapes, under the LSCC; second genu just anteroinferior to the LSCC and medial to the short process of incus; mastoid segment descends to the stylomastoid foramen at the anterior end of the digastric ridge. Most common dehiscence: tympanic segment over the oval window. Identify it through bone with a diamond burr and copious irrigation, drilling parallel to its course.' },
        { id: 'fn-tymp', layer: 'fn', z: 41, kind: 'nervemark', d: ell(572, 297, 3, 3), at: [572, 297], lab: 'r',
          name: 'Tympanic segment (over oval window)',
          note: 'Commonest site of a natural bony dehiscence; may overhang the stapes. Check it before working near the stapes or oval window.' },
        { id: 'genu2', layer: 'fn', z: 41, kind: 'nervemark', d: ell(476, 306, 3, 3), at: [476, 306], lab: 'l',
          name: 'Second genu',
          note: 'Where tympanic turns into mastoid segment: anteroinferior to the LSCC, medial and slightly inferior to the short process of incus.' },
        { id: 'smf', layer: 'fn', z: 41, kind: 'nervemark', d: ell(468, 470, 4, 4), at: [468, 472], lab: 'r',
          name: 'Stylomastoid foramen',
          note: 'Exit of the facial nerve at the anterior end of the digastric ridge. In young children (undeveloped tip) it is superficial: keep postauricular incisions high.' },
        { id: 'geniculate', layer: 'fn', z: 41, kind: 'nerve', d: ell(614, 283, 7, 6), at: [618, 280], lab: 'r',
          name: 'Geniculate ganglion',
          note: 'First genu, anterior to the cochleariform process; greater superficial petrosal nerve leaves anteriorly. The tympanic segment starts here.' },
        { id: 'chorda', layer: 'fn', z: 42, kind: 'nerve', line: true, w: 2.4,
          d: 'M 470 420 C 480 380, 498 335, 514 312 C 540 300, 575 296, 606 296', at: [548, 299], lab: 'b',
          name: 'Chorda tympani',
          note: 'Leaves the mastoid facial nerve, enters the middle ear at the posterosuperior annulus (iter chordae posterius), crosses lateral to the long process of incus and medial to the manubrium, and exits anteriorly (petrotympanic fissure). Taste (anterior two-thirds of the tongue); stretch injury is common, so find it early when elevating the annulus.' },
        { id: 'chorda-wall', layer: 'fn', z: 66, needs: ['mastoid'], kind: 'nerve', line: true, w: 2.4, inert: true,
          d: 'M 476 400 C 486 370, 498 335, 514 312' },
        { id: 'recess', layer: 'fn', z: 64, needs: ['mastoid'], kind: 'recess', d: 'M 479 312 L 508 316 L 472 405 Z', at: [482, 330], lab: 'l',
          name: 'Facial recess',
          note: 'Posterior tympanotomy window. Bounded medially/posteriorly by the mastoid facial nerve, laterally/anteriorly by the chorda tympani, superiorly by the incus buttress. Opens the posterior mesotympanum: stapes, oval and round windows (the cochlear implant route). An extended recess sacrifices the chorda.' },
        { id: 'buttress', layer: 'fn', z: 65, needs: ['mastoid'], kind: 'plate', d: 'M 478 300 L 500 297 L 506 309 L 481 310 Z', at: [492, 300], lab: 't',
          name: 'Incus buttress',
          note: 'Bone bridge between the fossa incudis and the facial recess. Leaving it protects the incus (contact transmits drill energy to the inner ear) and marks the top of the recess.' },

        /* ---- middle ear ---- */
        { id: 'promontory', layer: 'me', z: 50, kind: 'mucosa', d: ell(564, 352, 26, 22), at: [572, 352], lab: 'r',
          name: 'Promontory',
          note: 'Bulge of the basal turn of the cochlea; tympanic plexus (Jacobson\'s nerve) runs on it. The cochleostomy for an implant is anteroinferior to the round window.' },
        { id: 'rw', layer: 'me', z: 52, kind: 'air', d: ell(530, 378, 9, 7), at: [530, 380], lab: 'b',
          name: 'Round window niche',
          note: 'Posteroinferior to the promontory, under an overhang; the membrane faces posteroinferiorly. Seen through the facial recess; implant electrodes enter here.' },
        { id: 'ow', layer: 'me', z: 52, kind: 'air', d: ell(545, 326, 11, 5), at: [554, 326], lab: 'r',
          name: 'Oval window (footplate)',
          note: 'Stapes footplate, below the tympanic segment of the facial nerve. Footplate manipulation risks sensorineural loss; avoid suctioning an open vestibule.' },
        { id: 'stapes', layer: 'me', z: 56, kind: 'ossicle', line: true, w: 2.6, d: 'M 532 327 L 539 318 L 548 327 M 530 328 L 551 328', at: [539, 320], lab: 'b',
          name: 'Stapes',
          note: 'Superstructure seen end-on through the canal; assess mobility by palpating the incus or watching the round window reflex. Do not mobilize it with force.' },
        { id: 'sinustymp', layer: 'me', z: 52, kind: 'air', d: ell(512, 348, 7, 10), at: [508, 350], lab: 'l',
          name: 'Sinus tympani',
          note: 'Recess medial to the facial nerve and pyramidal eminence, between the ponticulus and subiculum. Hidden from both the canal and the facial recess: the classic site of residual cholesteatoma. Angled endoscopes see into it.' },
        { id: 'pyramid', layer: 'me', z: 53, kind: 'bone', d: 'M 514 324 L 524 318 L 522 328 Z', at: [518, 324], lab: 'l',
          name: 'Pyramidal eminence',
          note: 'Houses the stapedius; its tendon runs to the stapes neck. Lateral to the sinus tympani, with the facial nerve just behind and lateral.' },
        { id: 'stapedius', layer: 'me', z: 54, kind: 'tendon', line: true, w: 1.2, d: 'M 522 322 L 538 320', inert: true },
        { id: 'cochleariform', layer: 'me', z: 53, kind: 'bone', d: 'M 584 296 C 592 296, 594 306, 586 308 Z', at: [590, 302], lab: 'r',
          name: 'Cochleariform process',
          note: 'Pulley of the tensor tympani tendon. Constant landmark: the tympanic facial nerve runs just superior to it, and the geniculate ganglion is just anterior.' },
        { id: 'tensor', layer: 'me', z: 54, kind: 'tendon', line: true, w: 1.4, d: 'M 586 302 L 555 293', inert: true },
        { id: 'et', layer: 'me', z: 52, kind: 'air', d: ell(605, 332, 8, 12), at: [608, 336], lab: 'r',
          name: 'Eustachian tube orifice',
          note: 'Protympanum, anterosuperior mesotympanum. Pack Gelfoam here and under the perforation to support an underlay graft; check patency. The carotid canal lies just medial and inferior.' },
        { id: 'incus', layer: 'me', z: 55, kind: 'ossicle', line: true, w: 4,
          d: 'M 482 288 L 528 272 M 531 276 L 536 316', at: [533, 292], lab: 'l',
          name: 'Incus',
          note: 'Body in the epitympanum behind the scutum; short process points posteriorly into the fossa incudis (seen from the antrum: it points to the facial recess); long process descends to the incudostapedial joint. The lenticular process is the commonest site of erosion.' },
        { id: 'incus-body', layer: 'me', z: 55, kind: 'ossicle', d: ell(530, 272, 9, 8), inert: true },
        { id: 'isj', layer: 'me', z: 57, kind: 'ossicle', d: ell(537, 317, 3, 3), at: [537, 316], lab: 'l',
          name: 'Incudostapedial joint',
          note: 'Separate the IS joint before drilling or manipulating the malleus or incus if the chain is at risk, so drill energy and traction do not reach the footplate.' },
        { id: 'malleus', layer: 'me', z: 56, kind: 'ossicle', line: true, w: 4.5, d: 'M 549 272 L 553 291 L 562 344', at: [556, 318], lab: 'r',
          name: 'Malleus (manubrium)',
          note: 'Handle embedded in the TM to the umbo; head in the epitympanum articulating with the incus body. Underlay grafts go medial to the manubrium (or lateral to it, by preference); keep the graft in contact.' },
        { id: 'malleus-head', layer: 'me', z: 56, kind: 'ossicle', d: ell(548, 266, 8, 9), inert: true },

        /* ---- cortex ---- */
        { id: 'cortex', layer: 'cortex', z: 60, bg: true, kind: 'bone', d: CORTEX + ' ' + EAC, dDrilled: CORTEX + ' ' + EAC + ' ' + CAVITY, evenodd: true, at: [260, 420], lab: 'b',
          name: 'Mastoid cortex',
          note: 'Lateral surface of the mastoid process. Start the mastoidectomy with the largest cutting burr that fits, in broad strokes, across the triangle formed by the temporal line, the posterior canal wall and the sigmoid line.' },
        { id: 'templine', layer: 'cortex', z: 62, kind: 'refline', line: true, hair: true, d: 'M 790 250 C 650 248, 540 246, 470 243 C 380 238, 260 225, 190 212', at: [300, 228], lab: 't',
          name: 'Temporal line',
          note: 'Posterior continuation of the zygomatic root (supramastoid crest). Approximates the level of the middle fossa floor (tegmen): the superior limit of the first cut.' },
        { id: 'macewen', layer: 'cortex', z: 61, kind: 'zone', d: 'M 498 243 L 556 243 L 560 255 A 62 80 0 0 0 498 335 Z', at: [512, 262], lab: 'l',
          name: 'Macewen\'s (suprameatal) triangle',
          note: 'Between the temporal line, the posterosuperior canal rim and a vertical tangent to the posterior canal wall. Surface marking of the antrum, about 12-15 mm deep in the adult (cribriform area).' },
        { id: 'henle', layer: 'cortex', z: 63, kind: 'bonedark', d: 'M 520 282 L 502 268 L 524 276 Z', at: [508, 272], lab: 'l',
          name: 'Spine of Henle',
          note: 'Small spine at the posterosuperior canal rim; the antrum lies deep and slightly posterosuperior to it.' },
        { id: 'zygroot', layer: 'cortex', z: 62, kind: 'bonedark', line: true, w: 6, d: 'M 640 252 C 700 250, 760 248, 800 246', at: [740, 250], lab: 't',
          name: 'Root of the zygoma',
          note: 'Anterior limit of the field; the epitympanum (attic) lies medial to it. Extending the cut here opens the attic (atticotomy).' },
        { id: 'tip', layer: 'cortex', z: 62, kind: 'mark', d: ell(372, 560, 4, 4), at: [372, 562], lab: 'b',
          name: 'Mastoid tip',
          note: 'Pneumatized after early childhood; the sternocleidomastoid inserts on it and the digastric groove is medial. Absent in infants, which is why the facial nerve is superficial there.' },

        /* ---- canal and tympanic membrane ---- */
        { id: 'graft', layer: 'tm', z: 70, kind: 'fascia', d: ell(563, 345, 54, 66), tm: ['graft'], at: [610, 360], lab: 'r',
          name: 'Graft (underlay)',
          note: 'Temporalis fascia or perichondrium placed medial to the TM remnant and annulus, supported by Gelfoam in the middle ear. The anterior edge is where underlay grafts fail: tuck it well under the anterior remnant.' },
        { id: 'tm', layer: 'tm', z: 72, kind: 'tm', d: TM, dByTm: { perf: TM + ' ' + PERF, flap: TM_ANT + ' ' + PERF, graft: TM + ' ' + PERF }, evenodd: true, at: [600, 320], lab: 'r',
          name: 'Tympanic membrane (pars tensa)',
          note: 'Translucent: the manubrium, the long process of incus and the round window niche show through the posterior half. The fibrous annulus sits in the bony sulcus except superiorly (notch of Rivinus).' },
        { id: 'flaccida', layer: 'tm', z: 72, kind: 'tm', d: 'M 538 285 C 545 270, 566 268, 578 284 C 565 279, 550 279, 538 285 Z', at: [558, 276], lab: 't',
          name: 'Pars flaccida',
          note: 'Above the lateral process, in the notch of Rivinus; Prussak\'s space lies medial to it. Site of primary acquired (attic) cholesteatoma.' },
        { id: 'annulus', layer: 'tm', z: 73, kind: 'annulus', line: true, w: 2.4, d: TM, at: [520, 380], lab: 'l',
          name: 'Annulus',
          note: 'Fibrocartilaginous ring in the bony sulcus. Elevate it out of the sulcus posteroinferiorly first, where the sulcus is deep and the ossicles and chorda are distant; the chorda appears posterosuperiorly.' },
        { id: 'perf', layer: 'tm', z: 74, kind: 'rim', line: true, w: 1.6, d: PERF, tm: ['perf', 'flap', 'graft'], at: [585, 384], lab: 'b',
          name: 'Perforation rim',
          note: 'Freshen the edge (rim the perforation) to remove the squamous epithelium that has turned onto its undersurface; left behind, it can grow into an iatrogenic cholesteatoma.' },
        { id: 'flap', layer: 'tm', z: 75, kind: 'skin', d: 'M 562 270 C 640 290, 640 396, 562 412 C 604 380, 604 302, 562 270 Z', tm: ['flap'], at: [604, 296], lab: 't',
          name: 'Tympanomeatal flap (elevated)',
          note: 'Posterior canal skin and the posterior TM, reflected anteriorly on the manubrium once the annulus is out of the sulcus. Keep it thick; tears let squamous epithelium in and slow healing.' },
        { id: 'tmincision', layer: 'tm', z: 76, tm: ['intact', 'perf'], kind: 'incision', line: true, hair: true, d: 'M 561 264 A 58 76 0 0 0 561 416 M 562 284 L 561 264 M 562 404 L 561 416', at: [503, 340], lab: 'l',
          name: 'Tympanomeatal flap incisions',
          note: 'Radial incisions near 12 and 6 o\'clock, joined by a posterior curved incision about 5-8 mm lateral to the annulus. (Shown on the projection; on the canal wall they run along its length.)' },

        /* ---- soft tissue ---- */
        { id: 'fascia', layer: 'soft', z: 80, kind: 'fascia', d: 'M 450 120 C 540 110, 640 112, 700 130 L 690 205 C 620 214, 530 214, 460 208 Z', at: [600, 160], lab: 't',
          name: 'Temporalis fascia',
          note: 'Graft donor: harvest the deep layer of the temporalis fascia (or the loose areolar layer over it) above the temporal line through the same incision; thin it and let it dry.' },
        { id: 'tincision', layer: 'soft', z: 82, kind: 'incision2', line: true, hair: true, d: 'M 650 246 L 300 222 M 470 240 L 395 548', at: [420, 420], lab: 'l',
          name: 'Musculoperiosteal (T) incision',
          note: 'Horizontal along the temporal line, vertical down toward the mastoid tip; raise the periosteum forward to the spine of Henle and the posterior canal. Variants: anteriorly based Palva flap. Close it over the cavity at the end.' },

        /* ---- skin ---- */
        { id: 'skin', layer: 'skin', z: 90, bg: true, kind: 'skin', d: SKIN + ' ' + EAC, evenodd: true, at: [250, 300], lab: 't',
          name: 'Postauricular skin',
          note: 'The pinna is folded forward once the incision is made and the canal is entered.' },
        { id: 'sulcus', layer: 'skin', z: 91, kind: 'crease', line: true, hair: true, d: 'M 606 150 C 480 170, 440 300, 458 400 C 470 470, 520 510, 566 520', at: [454, 300], lab: 'r',
          name: 'Postauricular sulcus',
          note: 'Crease behind the pinna; the incision lies a few millimetres behind it.' },
        { id: 'paincision', layer: 'skin', z: 92, kind: 'incision', line: true, hair: true, d: 'M 590 130 C 440 160, 398 300, 420 405 C 435 480, 490 525, 530 538', at: [404, 300], lab: 'l',
          name: 'Postauricular incision',
          note: 'Curved, about 5-10 mm behind the sulcus, from the top of the pinna toward the tip. In children under about 2 years keep it superior and shallow: the facial nerve exits superficially at the undeveloped tip.' }
    ];

    var TYMPANOPLASTY = {
        id: 'tympanoplasty', name: 'Tympanoplasty', sub: 'Postauricular, underlay (medial) graft',
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
        id: 'mastoidectomy', name: 'Mastoidectomy', sub: 'Canal wall up, with facial recess',
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
    var VIEWS = {
        field: [120, 100, 760, 520],
        canal: [432, 240, 260, 178],
        recess: [380, 220, 290, 198]
    };

    window.OLSB_DATA = {
        layers: LAYERS,
        structures: S,
        procedures: [TYMPANOPLASTY, MASTOID],
        views: VIEWS,
        tmStates: ['intact', 'perf', 'flap', 'graft']
    };
})();
