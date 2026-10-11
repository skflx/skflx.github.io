/* =============================================================
   olsb-glossary.js — OLSB shared registry, loaded before the dioramas.

   One entry per anatomical id, shared by every diorama that draws it:
   the name and note shown in the panel, and `rel`, the structure's
   neighbours by direction (sup/inf/ant/post/med/lat: "X lies <dir> to
   this"). js/olsb.js adds the reverse of every relation, so each pair
   is written once. A diorama structure takes its name from here unless
   it sets its own short `label` for the drawing.

   Draft content: medical correctness is the owner's to verify
   (docs/decisions.md section 7).
   ============================================================= */
(function () {
    'use strict';

    function ell(cx, cy, rx, ry) {
        return 'M ' + (cx - rx) + ' ' + cy + ' a ' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0 a ' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0 Z';
    }
    /* An Archimedean spiral (a cochlea seen end-on), as a polyline. */
    function spiral(cx, cy, r0, r1, turns, rot) {
        var n = Math.round(turns * 36), out = [];
        for (var i = 0; i <= n; i++) {
            var t = i / n, a = (rot || 0) + t * turns * 2 * Math.PI, r = r0 + (r1 - r0) * t;
            out.push((i ? 'L ' : 'M ') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1));
        }
        return out.join(' ');
    }

    var G = {
        "cavity": {
            "name": "Mastoid cavity",
            "note": "Cortical (canal wall up) mastoidectomy: saucerized, with the widest part at the cortex so the deep landmarks stay in view. Boundaries: tegmen above, sigmoid behind, posterior canal wall in front, mastoid tip below."
        },
        "antrum": {
            "name": "Mastoid antrum",
            "note": "The largest constant air cell; lies about 12-15 mm deep to Macewen's triangle in the adult, at the level of the tegmen. Connects to the epitympanum through the aditus ad antrum.",
            "rel": {
                "lat": [
                    "koerner",
                    "macewen",
                    "henle"
                ],
                "sup": [
                    "tegmen"
                ],
                "ant": [
                    "aditus"
                ]
            }
        },
        "koerner": {
            "name": "Koerner's septum",
            "note": "Petrosquamous lamina lateral to the antrum. Can be mistaken for the medial wall of the antrum: drilling stops short and the true antrum and LSCC are missed. Take it down to enter the antrum."
        },
        "tegmen": {
            "name": "Tegmen mastoideum",
            "note": "Bony plate under middle fossa dura; the superior limit. Follow it anteriorly to the antrum and attic. Thin it, keep a bone shell over the dura. Its level is approximated on the surface by the temporal line.",
            "rel": {
                "sup": [
                    "mcfdura"
                ]
            }
        },
        "sigplate": {
            "name": "Sigmoid plate",
            "note": "Bone over the sigmoid sinus; the posterior limit. Saucerize back to it so the cavity is not a deep pit, but leave a thin shell (a bluish hue through bone). Injury: brisk venous bleeding and air embolism; control with pressure, Surgicel, bone wax."
        },
        "sinodural": {
            "name": "Sinodural angle (Citelli)",
            "note": "Junction of tegmen and sigmoid plate; superior petrosal sinus runs medially from here. Opening it widens the posterosuperior cavity; cells here are a site of residual disease."
        },
        "pcw": {
            "name": "Posterior canal wall",
            "note": "Kept intact in a canal-wall-up mastoidectomy; thinned from behind (keep it in view in the canal) without breach. Taking it down to the facial ridge converts to canal wall down."
        },
        "lscc": {
            "name": "Lateral semicircular canal",
            "note": "Smooth, dense, ivory-yellow otic capsule in the medial wall of the antrum. The key landmark of the mastoid: the facial nerve's second genu lies just anteroinferior to it, and its plane (extended posteriorly) is Donaldson's line. Cholesteatoma can erode it (fistula).",
            "rel": {
                "inf": [
                    "fn-tymp",
                    "genu2"
                ],
                "post": [
                    "pscc"
                ],
                "lat": [
                    "antrum",
                    "aditus"
                ]
            }
        },
        "digastric": {
            "name": "Digastric ridge",
            "note": "Ridge in the floor of the mastoid tip from the digastric groove. Followed anteriorly it leads to the stylomastoid foramen: the facial nerve exits at its anterior end."
        },
        "mcfdura": {
            "name": "Middle fossa dura",
            "note": "Above the tegmen. Exposed dura is tolerated if not torn; a tear risks CSF leak and encephalocele. Bipolar shrinks small herniations.",
            "rel": {
                "sup": [
                    "temporallobe"
                ]
            }
        },
        "sigmoid": {
            "name": "Sigmoid sinus",
            "note": "Continues the transverse sinus down to the jugular bulb. Its position varies: an anterior (forward-lying) sigmoid narrows the mastoid and the retrolabyrinthine window; check the CT.",
            "rel": {
                "ant": [
                    "els",
                    "sigplate"
                ]
            }
        },
        "transverse": {
            "name": "Transverse sinus",
            "note": "Runs posteriorly from the sinodural angle region; the top of the sigmoid."
        },
        "jb": {
            "name": "Jugular bulb",
            "note": "Under the floor of the hypotympanum. A high or dehiscent bulb can sit behind the inferior tympanic membrane: risk when elevating the annulus inferiorly or drilling the hypotympanum.",
            "rel": {
                "sup": [
                    "hypotympanum",
                    "rw"
                ]
            }
        },
        "ica": {
            "name": "Internal carotid artery",
            "note": "Petrous carotid runs vertically anterior to the cochlea and protympanum, then turns anteromedially. Its canal wall may be dehiscent in the anterior mesotympanum; an aberrant carotid presents as a retrotympanic mass.",
            "rel": {
                "post": [
                    "cochlea"
                ],
                "lat": [
                    "et",
                    "protympanum"
                ]
            }
        },
        "pscc": {
            "name": "Posterior semicircular canal",
            "note": "Posterior to the LSCC and perpendicular to it; bisected by Donaldson's line. Its ampulla lies near the second genu of the facial nerve, medial to it."
        },
        "donaldson": {
            "name": "Donaldson's line",
            "note": "The plane of the LSCC extended posteriorly to the sigmoid; it bisects the PSCC. The endolymphatic sac lies inferior to it, medial to the sigmoid (sac decompression)."
        },
        "els": {
            "name": "Endolymphatic sac",
            "note": "Dural thickening below Donaldson's line, between the PSCC and the sigmoid, on the posterior fossa dura.",
            "rel": {
                "sup": [
                    "donaldson"
                ],
                "ant": [
                    "pscc"
                ]
            }
        },
        "fn": {
            "name": "Facial nerve",
            "note": "Tympanic segment runs posteriorly above the oval window and stapes, under the LSCC; second genu just anteroinferior to the LSCC and medial to the short process of incus; mastoid segment descends to the stylomastoid foramen at the anterior end of the digastric ridge. Most common dehiscence: tympanic segment over the oval window. Identify it through bone with a diamond burr and copious irrigation, drilling parallel to its course.",
            "rel": {
                "lat": [
                    "recess",
                    "chorda"
                ],
                "med": [
                    "sinustymp"
                ],
                "sup": [
                    "lscc"
                ],
                "inf": [
                    "ow"
                ]
            }
        },
        "fn-tymp": {
            "name": "Tympanic segment (over oval window)",
            "note": "Commonest site of a natural bony dehiscence; may overhang the stapes. Check it before working near the stapes or oval window.",
            "rel": {
                "sup": [
                    "lscc"
                ],
                "inf": [
                    "ow",
                    "stapes"
                ],
                "ant": [
                    "cochleariform",
                    "geniculate"
                ],
                "post": [
                    "genu2"
                ],
                "med": [
                    "vestibule"
                ]
            }
        },
        "genu2": {
            "name": "Second genu",
            "note": "Where tympanic turns into mastoid segment: anteroinferior to the LSCC, medial and slightly inferior to the short process of incus.",
            "rel": {
                "sup": [
                    "lscc"
                ],
                "lat": [
                    "incus"
                ]
            }
        },
        "smf": {
            "name": "Stylomastoid foramen",
            "note": "Exit of the facial nerve at the anterior end of the digastric ridge. In young children (undeveloped tip) it is superficial: keep postauricular incisions high.",
            "rel": {
                "post": [
                    "digastric"
                ]
            }
        },
        "geniculate": {
            "name": "Geniculate ganglion",
            "note": "First genu, anterior to the cochleariform process; greater superficial petrosal nerve leaves anteriorly. The tympanic segment starts here.",
            "rel": {
                "post": [
                    "fn-tymp"
                ],
                "ant": [
                    "gspn"
                ],
                "inf": [
                    "cochleariform"
                ],
                "lat": [
                    "aer",
                    "cog"
                ],
                "med": [
                    "cochlea"
                ]
            }
        },
        "chorda": {
            "name": "Chorda tympani",
            "note": "Leaves the mastoid facial nerve, enters the middle ear at the posterosuperior annulus (iter chordae posterius), crosses lateral to the long process of incus and medial to the manubrium, and exits anteriorly (petrotympanic fissure). Taste (anterior two-thirds of the tongue); stretch injury is common, so find it early when elevating the annulus.",
            "rel": {
                "lat": [
                    "malleus"
                ],
                "med": [
                    "incus",
                    "recess"
                ]
            }
        },
        "recess": {
            "name": "Facial recess",
            "note": "Posterior tympanotomy window. Bounded medially/posteriorly by the mastoid facial nerve, laterally/anteriorly by the chorda tympani, superiorly by the incus buttress. Opens the posterior mesotympanum: stapes, oval and round windows (the cochlear implant route). An extended recess sacrifices the chorda.",
            "rel": {
                "med": [
                    "fn"
                ],
                "lat": [
                    "chorda"
                ],
                "sup": [
                    "buttress"
                ]
            }
        },
        "buttress": {
            "name": "Incus buttress",
            "note": "Bone bridge between the fossa incudis and the facial recess. Leaving it protects the incus (contact transmits drill energy to the inner ear) and marks the top of the recess.",
            "rel": {
                "sup": [
                    "incus"
                ]
            }
        },
        "promontory": {
            "name": "Promontory",
            "note": "Bulge of the basal turn of the cochlea; tympanic plexus (Jacobson's nerve) runs on it. The cochleostomy for an implant is anteroinferior to the round window.",
            "rel": {
                "post": [
                    "rw",
                    "sinustymp"
                ],
                "sup": [
                    "ow"
                ],
                "med": [
                    "cochlea"
                ],
                "lat": [
                    "malleus"
                ],
                "ant": [
                    "et"
                ]
            }
        },
        "rw": {
            "name": "Round window niche",
            "note": "Posteroinferior to the promontory, under an overhang; the membrane faces posteroinferiorly. Seen through the facial recess; implant electrodes enter here.",
            "rel": {
                "ant": [
                    "promontory"
                ],
                "post": [
                    "sinustymp",
                    "subiculum"
                ],
                "med": [
                    "cochlea"
                ],
                "inf": [
                    "jb",
                    "hypocells"
                ]
            }
        },
        "ow": {
            "name": "Oval window (footplate)",
            "note": "Stapes footplate, below the tympanic segment of the facial nerve. Footplate manipulation risks sensorineural loss; avoid suctioning an open vestibule.",
            "rel": {
                "sup": [
                    "fn-tymp"
                ],
                "inf": [
                    "promontory"
                ],
                "post": [
                    "pyramid"
                ],
                "ant": [
                    "cochleariform"
                ],
                "med": [
                    "vestibule"
                ],
                "lat": [
                    "stapes",
                    "incus"
                ]
            }
        },
        "stapes": {
            "name": "Stapes",
            "note": "Superstructure seen end-on through the canal; assess mobility by palpating the incus or watching the round window reflex. Do not mobilize it with force."
        },
        "sinustymp": {
            "name": "Sinus tympani",
            "note": "Recess medial to the facial nerve and pyramidal eminence, between the ponticulus and subiculum. Hidden from both the canal and the facial recess: the classic site of residual cholesteatoma. Angled endoscopes see into it.",
            "rel": {
                "sup": [
                    "ponticulus"
                ],
                "inf": [
                    "subiculum"
                ],
                "lat": [
                    "fn",
                    "pyramid"
                ],
                "ant": [
                    "promontory"
                ],
                "med": [
                    "pscc"
                ]
            }
        },
        "pyramid": {
            "name": "Pyramidal eminence",
            "note": "Houses the stapedius; its tendon runs to the stapes neck. Lateral to the sinus tympani, with the facial nerve just behind and lateral.",
            "rel": {
                "ant": [
                    "ow",
                    "stapes"
                ],
                "med": [
                    "sinustymp"
                ],
                "lat": [
                    "recess"
                ],
                "post": [
                    "fn"
                ]
            }
        },
        "cochleariform": {
            "name": "Cochleariform process",
            "note": "Pulley of the tensor tympani tendon. Constant landmark: the tympanic facial nerve runs just superior to it, and the geniculate ganglion is just anterior.",
            "rel": {
                "sup": [
                    "fn-tymp"
                ],
                "ant": [
                    "geniculate",
                    "tensor"
                ],
                "post": [
                    "ow"
                ]
            }
        },
        "et": {
            "name": "Eustachian tube orifice",
            "note": "Protympanum, anterosuperior mesotympanum. Pack Gelfoam here and under the perforation to support an underlay graft; check patency. The carotid canal lies just medial and inferior.",
            "rel": {
                "post": [
                    "promontory"
                ],
                "med": [
                    "ica"
                ],
                "sup": [
                    "tensor"
                ]
            }
        },
        "incus": {
            "name": "Incus",
            "note": "Body in the epitympanum behind the scutum; short process points posteriorly into the fossa incudis (seen from the antrum: it points to the facial recess); long process descends to the incudostapedial joint. The lenticular process is the commonest site of erosion.",
            "rel": {
                "inf": [
                    "stapes"
                ]
            }
        },
        "isj": {
            "name": "Incudostapedial joint",
            "note": "Separate the IS joint before drilling or manipulating the malleus or incus if the chain is at risk, so drill energy and traction do not reach the footplate."
        },
        "malleus": {
            "name": "Malleus",
            "note": "Handle embedded in the TM to the umbo; head in the epitympanum articulating with the incus body. Underlay grafts go medial to the manubrium (or lateral to it, by preference); keep the graft in contact.",
            "rel": {
                "post": [
                    "incus"
                ],
                "lat": [
                    "tm"
                ]
            }
        },
        "cortex": {
            "name": "Mastoid cortex",
            "note": "Lateral surface of the mastoid process. Start the mastoidectomy with the largest cutting burr that fits, in broad strokes, across the triangle formed by the temporal line, the posterior canal wall and the sigmoid line."
        },
        "templine": {
            "name": "Temporal line",
            "note": "Posterior continuation of the zygomatic root (supramastoid crest). Approximates the level of the middle fossa floor (tegmen): the superior limit of the first cut."
        },
        "macewen": {
            "name": "Macewen's (suprameatal) triangle",
            "note": "Between the temporal line, the posterosuperior canal rim and a vertical tangent to the posterior canal wall. Surface marking of the antrum, about 12-15 mm deep in the adult (cribriform area)."
        },
        "henle": {
            "name": "Spine of Henle",
            "note": "Small spine at the posterosuperior canal rim; the antrum lies deep and slightly posterosuperior to it."
        },
        "zygroot": {
            "name": "Root of the zygoma",
            "note": "Anterior limit of the field; the epitympanum (attic) lies medial to it. Extending the cut here opens the attic (atticotomy)."
        },
        "tip": {
            "name": "Mastoid tip",
            "note": "Pneumatized after early childhood; the sternocleidomastoid inserts on it and the digastric groove is medial. Absent in infants, which is why the facial nerve is superficial there."
        },
        "graft": {
            "name": "Graft (underlay)",
            "note": "Temporalis fascia or perichondrium placed medial to the TM remnant and annulus, supported by Gelfoam in the middle ear. The anterior edge is where underlay grafts fail: tuck it well under the anterior remnant."
        },
        "tm": {
            "name": "Tympanic membrane (pars tensa)",
            "note": "Translucent: the manubrium, the long process of incus and the round window niche show through the posterior half. The fibrous annulus sits in the bony sulcus except superiorly (notch of Rivinus)."
        },
        "flaccida": {
            "name": "Pars flaccida",
            "note": "Above the lateral process, in the notch of Rivinus; Prussak's space lies medial to it. Site of primary acquired (attic) cholesteatoma."
        },
        "annulus": {
            "name": "Annulus",
            "note": "Fibrocartilaginous ring in the bony sulcus. Elevate it out of the sulcus posteroinferiorly first, where the sulcus is deep and the ossicles and chorda are distant; the chorda appears posterosuperiorly."
        },
        "perf": {
            "name": "Perforation rim",
            "note": "Freshen the edge (rim the perforation) to remove the squamous epithelium that has turned onto its undersurface; left behind, it can grow into an iatrogenic cholesteatoma."
        },
        "flap": {
            "name": "Tympanomeatal flap (elevated)",
            "note": "Posterior canal skin and the posterior TM, reflected anteriorly on the manubrium once the annulus is out of the sulcus. Keep it thick; tears let squamous epithelium in and slow healing."
        },
        "tmincision": {
            "name": "Tympanomeatal flap incisions",
            "note": "Radial incisions near 12 and 6 o'clock, joined by a posterior curved incision about 5-8 mm lateral to the annulus. (Shown on the projection; on the canal wall they run along its length.)"
        },
        "fascia": {
            "name": "Temporalis fascia",
            "note": "Graft donor: harvest the deep layer of the temporalis fascia (or the loose areolar layer over it) above the temporal line through the same incision; thin it and let it dry."
        },
        "tincision": {
            "name": "Musculoperiosteal (T) incision",
            "note": "Horizontal along the temporal line, vertical down toward the mastoid tip; raise the periosteum forward to the spine of Henle and the posterior canal. Variants: anteriorly based Palva flap. Close it over the cavity at the end."
        },
        "skin": {
            "name": "Postauricular skin",
            "note": "The pinna is folded forward once the incision is made and the canal is entered."
        },
        "sulcus": {
            "name": "Postauricular sulcus",
            "note": "Crease behind the pinna; the incision lies a few millimetres behind it."
        },
        "paincision": {
            "name": "Postauricular incision",
            "note": "Curved, about 5-10 mm behind the sulcus, from the top of the pinna toward the tip. In children under about 2 years keep it superior and shallow: the facial nerve exits superficially at the undeveloped tip."
        },
        "epitympanum": {
            "name": "Epitympanum (attic)",
            "note": "Above the level of the short process of the malleus (the upper TM margin). Holds the malleus head and incus body; its lateral wall is the scutum, its roof the tegmen tympani, and it opens posteriorly through the aditus to the antrum. About 6 mm wide, the widest part of the cavity."
        },
        "mesotympanum": {
            "name": "Mesotympanum",
            "note": "The part medial to the pars tensa. Narrowest of the three, about 2 mm between the umbo and the promontory: why the umbo contacts the promontory in an atelectatic ear."
        },
        "hypotympanum": {
            "name": "Hypotympanum",
            "note": "Below the inferior TM margin; floor over the jugular bulb, with air cells. About 4 mm wide. A high or dehiscent bulb rises into it."
        },
        "protympanum": {
            "name": "Protympanum",
            "note": "Anterior part, leading to the Eustachian tube; carotid canal medial and inferior, tensor tympani above."
        },
        "retrotympanum": {
            "name": "Retrotympanum",
            "note": "Posterior part, behind the windows: pyramidal eminence, sinus tympani, facial recess, ponticulus and subiculum. Where cholesteatoma hides."
        },
        "aditus": {
            "name": "Aditus ad antrum",
            "note": "Opening from the posterior epitympanum to the antrum, above the LSCC and FN second genu, with the fossa incudis at its floor. Blocked by edema or cholesteatoma, it isolates the mastoid.",
            "rel": {
                "post": [
                    "antrum"
                ],
                "ant": [
                    "epitympanum"
                ]
            }
        },
        "gspn": {
            "name": "Greater superficial petrosal nerve",
            "note": "Leaves the geniculate ganglion anteriorly through the facial hiatus onto the middle fossa floor; secretomotor to the lacrimal gland. Traction on it during middle fossa dural elevation can injure the geniculate.",
            "rel": {
                "sup": [
                    "mcfdura"
                ]
            }
        },
        "tensor": {
            "name": "Tensor tympani (semicanal)",
            "note": "Muscle in its semicanal above the Eustachian tube; its tendon turns laterally around the cochleariform process to the malleus neck."
        },
        "jacobson": {
            "name": "Jacobson's nerve (tympanic plexus)",
            "note": "Tympanic branch of CN IX: enters the floor through the inferior tympanic canaliculus, crosses the promontory, and leaves as the lesser petrosal nerve (parasympathetic to the parotid). Glomus tympanicum arises along it.",
            "rel": {
                "med": [
                    "promontory"
                ]
            }
        },
        "ponticulus": {
            "name": "Ponticulus",
            "note": "Bony ridge from the promontory to the pyramidal eminence; the upper border of the sinus tympani, below the oval window niche.",
            "rel": {
                "sup": [
                    "ow"
                ]
            }
        },
        "subiculum": {
            "name": "Subiculum",
            "note": "Bony ridge from the posterior lip of the round window niche to the styloid eminence; the lower border of the sinus tympani.",
            "rel": {
                "inf": [
                    "styloid"
                ]
            }
        },
        "styloid": {
            "name": "Styloid eminence",
            "note": "Bump on the posterior hypotympanic floor from the root of the styloid process; below the subiculum. The mastoid facial nerve lies just posterior to it."
        },
        "hypocells": {
            "name": "Hypotympanic air cells",
            "note": "Cells in the floor over the jugular bulb; can extend toward the petrous apex (infralabyrinthine). A route for residual disease and for drainage of the apex."
        },
        "cog": {
            "name": "Cog",
            "note": "Bony ridge hanging from the tegmen in the anterior epitympanum, anterior to the malleus head. It separates the anterior epitympanic (supratubal) recess from the attic and points to the geniculate ganglion and tympanic facial nerve just medial to it.",
            "rel": {
                "ant": [
                    "aer"
                ],
                "post": [
                    "malleus",
                    "epitympanum"
                ],
                "sup": [
                    "tegment"
                ]
            }
        },
        "aer": {
            "name": "Anterior epitympanic recess",
            "note": "Supratubal recess: anterior to the cog, above the tensor and the Eustachian tube; the geniculate ganglion lies in its medial wall. A hidden site of residual cholesteatoma and the route to ventilate the attic anteriorly.",
            "rel": {
                "inf": [
                    "tensor",
                    "et"
                ],
                "sup": [
                    "tegment"
                ]
            }
        },
        "cochlea": {
            "name": "Cochlea",
            "note": "Behind the promontory (basal turn), medial to the mesotympanum; scala tympani ends at the round window, the vestibule opens at the oval window. Electrodes enter the scala tympani through the round window or a cochleostomy anteroinferior to it.",
            "rel": {
                "med": [
                    "iac"
                ]
            }
        },
        "vestibule": {
            "name": "Vestibule",
            "note": "Medial to the oval window and the stapes footplate, between the cochlea (anterior) and the semicircular canals (posterior). A footplate pushed in or suctioned opens it: vertigo and sensorineural loss.",
            "rel": {
                "ant": [
                    "cochlea"
                ],
                "post": [
                    "pscc",
                    "lscc"
                ],
                "med": [
                    "iac"
                ]
            }
        },
        "ssc": {
            "name": "Superior semicircular canal",
            "note": "Vertical, perpendicular to the petrous ridge, under the middle fossa floor (arcuate eminence). Dehiscence of its roof gives superior canal dehiscence syndrome."
        },
        "tegment": {
            "name": "Tegmen tympani",
            "note": "Roof of the middle ear and attic: thin bone under middle fossa dura and the temporal lobe. Dehiscence or erosion: CSF leak, encephalocele, meningitis.",
            "rel": {
                "inf": [
                    "epitympanum"
                ],
                "sup": [
                    "mcfdura"
                ]
            }
        },
        "mewall": {
            "name": "Medial wall of the tympanic cavity",
            "note": "Seen from lateral with the TM and the malleus and incus removed. Its landmarks are a fixed sequence: LSCC prominence, facial nerve, oval window, promontory, round window, from above down."
        },
        "eac": {
            "name": "External auditory canal",
            "note": "Bony medial two-thirds at this depth. Its posterior wall separates the canal from the mastoid and the facial recess."
        },
        "mespace": {
            "name": "Middle ear space",
            "note": "In this section: narrow between the TM and the promontory, widening posteriorly into the pockets of the retrotympanum."
        },
        "mastoidcells": {
            "name": "Mastoid air cells",
            "note": "Posterolateral to the middle ear; the approach to the facial recess comes from here."
        },
        "iac": {
            "name": "Internal auditory canal",
            "note": "Medial to the cochlea and vestibule; carries the facial and vestibulocochlear nerves. The facial nerve leaves it anterosuperiorly as the labyrinthine segment, the narrowest part of its course."
        },
        "sight-canal": {
            "name": "Line of sight: through the canal",
            "note": "A straight line of sight down the canal, as with the microscope, sees the mesotympanum but not the facial recess or the sinus tympani: the posterior canal wall and the pyramid overhang them."
        },
        "sight-recess": {
            "name": "Line of sight: facial recess",
            "note": "From the mastoid through the posterior tympanotomy, between chorda and facial nerve: the round window niche and stapes come into view. The sinus tympani, medial to the nerve, still does not."
        },
        "sight-endo": {
            "name": "Angled endoscope",
            "note": "A 30 or 45 degree endoscope through the canal looks around the posterior wall into the sinus tympani: the main argument for endoscopic inspection at the end of cholesteatoma surgery."
        },
        "scutum": {
            "name": "Scutum (lateral attic wall)",
            "note": "Bony spur forming the lateral wall of the epitympanum, above the pars flaccida. Blunting or erosion of it on coronal CT is an early sign of attic cholesteatoma; atticotomy removes it.",
            "rel": {
                "med": [
                    "prussak",
                    "epitympanum"
                ],
                "inf": [
                    "flaccida"
                ]
            }
        },
        "prussak": {
            "name": "Prussak's space",
            "note": "Lateral: pars flaccida. Medial: malleus neck. Superior: lateral malleal fold. Inferior: lateral process of the malleus. A retraction pocket of the pars flaccida starts here and spreads posteriorly to the posterior epitympanum, aditus and antrum.",
            "rel": {
                "lat": [
                    "flaccida"
                ],
                "med": [
                    "malleus"
                ],
                "sup": [
                    "lmf"
                ],
                "inf": [
                    "annulus"
                ]
            }
        },
        "lmf": {
            "name": "Lateral malleal fold",
            "note": "From the malleus neck to the margins of the notch of Rivinus; the roof of Prussak\u2019s space, separating it from the attic above."
        },
        "dim-epi": {
            "name": "Epitympanum: about 6 mm",
            "note": "Width from the lateral attic wall to the medial attic wall (schematic proportion)."
        },
        "dim-meso": {
            "name": "Mesotympanum: about 2 mm",
            "note": "Umbo to promontory: the narrowest point of the cavity."
        },
        "dim-hypo": {
            "name": "Hypotympanum: about 4 mm",
            "note": "Width at the floor."
        },
        "spread": {
            "name": "Attic cholesteatoma route",
            "note": "From a pars flaccida retraction into Prussak\u2019s space, then commonly posteriorly and up, lateral to the incus body (superior incudal space), into the posterior epitympanum, aditus and antrum. Schematic: the route runs posteriorly out of this plane."
        },
        "temporallobe": {
            "name": "Temporal lobe",
            "note": "Over the middle fossa dura, above the tegmen."
        },
        "tbone": {
            "name": "Temporal bone",
            "note": "Petrous and mastoid bone around the ear: the block every structure here is drilled out of. Cut faces of the 3D model show it in section."
        },
        "oticcap": {
            "name": "Otic capsule",
            "note": "The dense enchondral bone around the labyrinth: harder, paler and less vascular than the surrounding bone, and it does not remodel. Its bulge into the middle ear is the promontory; into the antrum, the lateral canal.",
            "rel": {
                "lat": [
                    "promontory"
                ]
            }
        },
        "fcanal": {
            "name": "Fallopian canal",
            "note": "The bony canal of the facial nerve, from the fundus of the IAC to the stylomastoid foramen. Commonly dehiscent over the oval window. In the 3D model it is the bone shell around the nerve; drilling states keep a shell of it.",
            "rel": {
                "lat": [
                    "recess"
                ],
                "med": [
                    "sinustymp"
                ]
            }
        },
        "fn-meatal": {
            "name": "Facial nerve: meatal segment",
            "note": "In the internal auditory canal, in its anterosuperior quadrant, above the cochlear nerve and in front of the superior vestibular nerve (Bill's bar separates them at the fundus).",
            "rel": {
                "inf": [
                    "cn8"
                ]
            }
        },
        "fn-lab": {
            "name": "Facial nerve: labyrinthine segment",
            "note": "Fundus to geniculate ganglion, about 3-5 mm: the narrowest part of the fallopian canal (the meatal foramen), between the cochlea in front and the superior canal ampulla behind. Middle fossa approach territory.",
            "rel": {
                "ant": [
                    "cochlea"
                ],
                "post": [
                    "ssc",
                    "vestibule"
                ]
            }
        },
        "cn8": {
            "name": "Vestibulocochlear nerve",
            "note": "Fills most of the internal auditory canal: the cochlear nerve anteroinferior, the superior and inferior vestibular nerves posterior. Shown here as one bundle."
        },
        "pfdura": {
            "name": "Posterior fossa dura",
            "note": "Over the posterior face of the petrous bone, medial to the sigmoid sinus. Trautmann's triangle (between the sigmoid, the superior petrosal sinus and the bony labyrinth) is the window onto it from the mastoid.",
            "rel": {
                "med": [
                    "cerebellum"
                ]
            }
        },
        "cerebellum": {
            "name": "Cerebellum",
            "note": "In the posterior fossa, behind the posterior fossa dura."
        },
        "stapedius": {
            "name": "Stapedius muscle",
            "note": "In its own canal just anterior to the mastoid segment of the facial nerve (which supplies it); its tendon leaves the pyramidal eminence for the stapes neck.",
            "rel": {
                "post": [
                    "fn"
                ]
            }
        }
    };

    window.OLSB = { glossary: G, dioramas: [], ell: ell, spiral: spiral };
})();
