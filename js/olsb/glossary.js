/* =============================================================
   js/olsb/glossary.js — OLSB shared registry, loaded before the dioramas.

   One entry per anatomical id, shared by every diorama that draws it:
   the name and note shown in the panel, and `rel`, the structure's
   neighbours by direction (sup/inf/ant/post/med/lat: "X lies <dir> to
   this"). js/olsb/main.js adds the reverse of every relation, so each pair
   is written once. A diorama structure takes its name from here unless
   it sets its own short `label` for the drawing.

   Optional fields read by the OKSAT ear-anatomy guide (plan
   2026-11-02, spec section 4.4); OLSB ignores them:
     syn     synonyms and eponyms, [string]
     supply  {n: [nerve ids], a: [artery ids]}, ids in this file
     origin  embryologic origin codes: arch1 arch2 arch4 cleft1
             pouch1 otic mesenchyme
   Ids OLSB does not draw are allowed; its panel shows them as
   disabled neighbours, and the geometry check skips them.

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
            "origin": [
                "pouch1"
            ],
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
            "syn": [
                "Petrosquamous lamina"
            ],
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
            "origin": [
                "otic"
            ],
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
            "note": "Posterior to the LSCC and perpendicular to it; bisected by Donaldson's line. Its ampulla lies near the second genu of the facial nerve, medial to it.",
            "origin": [
                "otic"
            ]
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
            "supply": {
                "a": [
                    "stylomast-a"
                ]
            },
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
            "supply": {
                "a": [
                    "suppetr-a"
                ]
            },
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
            "supply": {
                "a": [
                    "suppetr-a"
                ]
            },
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
            "supply": {
                "n": [
                    "jacobson"
                ],
                "a": [
                    "inftymp-a"
                ]
            },
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
            "syn": [
                "Fenestra cochleae"
            ],
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
            "syn": [
                "Fenestra vestibuli"
            ],
            "note": "Stapes footplate, below the tympanic segment of the facial nerve. Footplate manipulation risks sensorineural loss; avoid suctioning an open vestibule.",
            "origin": [
                "otic"
            ],
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
            "note": "Superstructure seen end-on through the canal; assess mobility by palpating the incus or watching the round window reflex. Do not mobilize it with force.",
            "origin": [
                "arch2",
                "otic"
            ],
            "supply": {
                "a": [
                    "crural-a"
                ]
            }
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
            "syn": [
                "Pyramidal process"
            ],
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
            "syn": [
                "Pharyngotympanic tube",
                "Auditory tube"
            ],
            "note": "Protympanum, anterosuperior mesotympanum. Pack Gelfoam here and under the perforation to support an underlay graft; check patency. The carotid canal lies just medial and inferior.",
            "origin": [
                "pouch1"
            ],
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
            "origin": [
                "arch1",
                "arch2"
            ],
            "supply": {
                "a": [
                    "antymp-a",
                    "posttymp-a"
                ]
            },
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
            "origin": [
                "arch1",
                "arch2"
            ],
            "supply": {
                "a": [
                    "antymp-a"
                ]
            },
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
            "syn": [
                "Suprameatal spine"
            ],
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
            "syn": [
                "Eardrum"
            ],
            "note": "Translucent: the manubrium, the long process of incus and the round window niche show through the posterior half. The fibrous annulus sits in the bony sulcus except superiorly (notch of Rivinus).",
            "origin": [
                "cleft1",
                "mesenchyme",
                "pouch1"
            ],
            "supply": {
                "n": [
                    "auriculotemp-n",
                    "arnold",
                    "jacobson"
                ],
                "a": [
                    "deepaur-a",
                    "antymp-a",
                    "stylomast-a"
                ]
            }
        },
        "flaccida": {
            "name": "Pars flaccida",
            "syn": [
                "Shrapnell's membrane"
            ],
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
            "syn": [
                "Attic"
            ],
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
            "syn": [
                "Greater petrosal nerve"
            ],
            "note": "Leaves the geniculate ganglion anteriorly through the facial hiatus onto the middle fossa floor; secretomotor to the lacrimal gland. Traction on it during middle fossa dural elevation can injure the geniculate.",
            "rel": {
                "sup": [
                    "mcfdura"
                ]
            }
        },
        "tensor": {
            "name": "Tensor tympani (semicanal)",
            "note": "Muscle in its semicanal above the Eustachian tube; its tendon turns laterally around the cochleariform process to the malleus neck.",
            "origin": [
                "arch1"
            ],
            "supply": {
                "n": [
                    "ntt"
                ],
                "a": [
                    "suptymp-a"
                ]
            }
        },
        "jacobson": {
            "name": "Jacobson's nerve (tympanic plexus)",
            "syn": [
                "Tympanic nerve",
                "Tympanic branch of the glossopharyngeal nerve"
            ],
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
            "origin": [
                "otic"
            ],
            "rel": {
                "med": [
                    "iac"
                ]
            }
        },
        "vestibule": {
            "name": "Vestibule",
            "note": "Medial to the oval window and the stapes footplate, between the cochlea (anterior) and the semicircular canals (posterior). A footplate pushed in or suctioned opens it: vertigo and sensorineural loss.",
            "origin": [
                "otic"
            ],
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
            "note": "Vertical, perpendicular to the petrous ridge, under the middle fossa floor (arcuate eminence). Dehiscence of its roof gives superior canal dehiscence syndrome.",
            "origin": [
                "otic"
            ]
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
            "syn": [
                "External acoustic meatus"
            ],
            "note": "Bony medial two-thirds at this depth. Its posterior wall separates the canal from the mastoid and the facial recess.",
            "origin": [
                "cleft1"
            ],
            "supply": {
                "n": [
                    "auriculotemp-n",
                    "arnold",
                    "fn-sensory"
                ],
                "a": [
                    "supftemp-a",
                    "postaur-a",
                    "deepaur-a"
                ]
            }
        },
        "mespace": {
            "name": "Middle ear space",
            "note": "In this section: narrow between the TM and the promontory, widening posteriorly into the pockets of the retrotympanum.",
            "origin": [
                "pouch1"
            ]
        },
        "mastoidcells": {
            "name": "Mastoid air cells",
            "note": "Posterolateral to the middle ear; the approach to the facial recess comes from here.",
            "origin": [
                "pouch1"
            ]
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
            "origin": [
                "otic"
            ],
            "rel": {
                "lat": [
                    "promontory"
                ]
            }
        },
        "fcanal": {
            "name": "Fallopian canal",
            "syn": [
                "Facial canal"
            ],
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
            "supply": {
                "a": [
                    "labyr-a",
                    "suppetr-a"
                ]
            },
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
            "origin": [
                "arch2"
            ],
            "supply": {
                "n": [
                    "nstap"
                ],
                "a": [
                    "stylomast-a"
                ]
            },
            "rel": {
                "post": [
                    "fn"
                ]
            }
        },
        "squama": {
            "name": "Squamous part of the temporal bone",
            "note": "The flat upper plate. Builds the superior and posterosuperior bony canal wall, the scutum and the zygomatic root; its inner face carries the temporal lobe."
        },
        "mastoidpart": {
            "name": "Mastoid part of the temporal bone",
            "note": "Behind the canal: the mastoid process and its air cells, the antrum, the sigmoid groove on its inner face."
        },
        "petrous": {
            "name": "Petrous part of the temporal bone",
            "note": "The pyramid pointing anteromedially toward the clivus: medial wall of the middle ear, otic capsule, tegmen, carotid canal, jugular fossa and the internal auditory canal.",
            "rel": {
                "lat": [
                    "mespace"
                ]
            }
        },
        "tympanicpart": {
            "name": "Tympanic part of the temporal bone",
            "note": "A U-shaped plate (the tympanic ring in the newborn) forming the anterior, inferior and posteroinferior bony canal walls and the tympanic sulcus. Its incomplete ossification leaves the foramen of Huschke."
        },
        "styloidproc": {
            "name": "Styloid process",
            "note": "Projects anteroinferiorly from under the tympanic part, anteromedial to the stylomastoid foramen. Second-arch (Reichert's) cartilage derivative.",
            "origin": [
                "arch2"
            ],
            "rel": {
                "post": [
                    "smf"
                ]
            }
        },
        "tssut": {
            "name": "Tympanosquamous suture",
            "note": "Between the squama and the tympanic part, along the anterosuperior bony canal. The anterior incision of the vascular strip runs along it."
        },
        "tmsut": {
            "name": "Tympanomastoid suture",
            "note": "Between the tympanic and mastoid parts, along the posteroinferior bony canal. Arnold's nerve exits through it; in parotidectomy it points medially toward the facial nerve at the stylomastoid foramen.",
            "rel": {
                "med": [
                    "smf"
                ]
            }
        },
        "pssut": {
            "name": "Petrosquamous suture",
            "note": "Between the petrous and squamous parts. Crosses the tegmen; its remnant in the mastoid is Koerner's septum. A route for venous channels, and for infection, to the middle fossa."
        },
        "ptfiss": {
            "name": "Petrotympanic fissure",
            "syn": [
                "Glaserian fissure"
            ],
            "note": "Between the tympanic part and the petrous lip of the tegmen, just above the anterior canal wall. Transmits the anterior tympanic artery and the anterior malleal ligament; the chorda leaves beside it through the canal of Huguier."
        },
        "tmj": {
            "name": "Temporomandibular joint",
            "note": "In the glenoid fossa directly anterior to the bony canal; the tympanic plate separates them. Explains referred otalgia from the joint and canal-wall injury in mandibular trauma."
        },
        "parotid": {
            "name": "Parotid gland",
            "note": "Below and in front of the canal, against the cartilaginous floor. The fissures of Santorini and the foramen of Huschke open toward it."
        },
        "auricle": {
            "name": "Auricle",
            "syn": [
                "Pinna"
            ],
            "note": "One plate of elastic cartilage under tightly bound skin, except the lobule. Built from six hillocks of His around the first branchial cleft.",
            "origin": [
                "arch1",
                "arch2"
            ],
            "supply": {
                "n": [
                    "greataur-n",
                    "lessocc-n",
                    "auriculotemp-n",
                    "arnold",
                    "fn-sensory"
                ],
                "a": [
                    "postaur-a",
                    "supftemp-a"
                ]
            }
        },
        "helix": {
            "name": "Helix",
            "note": "The curled outer rim, from the helical crus in the concha around to the lobule.",
            "origin": [
                "arch1"
            ]
        },
        "helcrus": {
            "name": "Helical crus",
            "syn": [
                "Crus helicis"
            ],
            "note": "The start of the helix, crossing the concha and dividing it into the cymba above and the cavum below.",
            "origin": [
                "arch1"
            ],
            "rel": {
                "inf": [
                    "cavum"
                ]
            }
        },
        "helspine": {
            "name": "Helical spine",
            "syn": [
                "Spina helicis"
            ],
            "note": "A small cartilage projection at the front of the helix, above the tragus."
        },
        "darwin": {
            "name": "Darwin's tubercle",
            "note": "Inconstant thickening on the posterosuperior helix."
        },
        "scapha": {
            "name": "Scapha",
            "note": "The groove between the helix and the antihelix."
        },
        "antihelix": {
            "name": "Antihelix",
            "note": "The ridge inside the helix. It divides above into superior and inferior crura around the triangular fossa; its fold is missing in prominent ears.",
            "origin": [
                "arch2"
            ],
            "rel": {
                "post": [
                    "scapha"
                ]
            }
        },
        "antihelix-sup": {
            "name": "Superior crus of the antihelix",
            "note": "The upper, posterior limb of the antihelix fork."
        },
        "antihelix-inf": {
            "name": "Inferior crus of the antihelix",
            "note": "The lower, anterior limb of the antihelix fork; above the cymba.",
            "rel": {
                "inf": [
                    "cymba"
                ]
            }
        },
        "trifossa": {
            "name": "Triangular fossa",
            "syn": [
                "Fossa triangularis"
            ],
            "note": "The hollow between the two crura of the antihelix."
        },
        "concha": {
            "name": "Concha",
            "note": "The deep bowl leading into the canal, divided by the helical crus into the cymba and the cavum. Its skin carries Arnold's and facial nerve sensory fibres."
        },
        "cymba": {
            "name": "Cymba conchae",
            "note": "The upper part of the concha, above the helical crus.",
            "rel": {
                "inf": [
                    "helcrus"
                ]
            }
        },
        "cavum": {
            "name": "Cavum conchae",
            "note": "The lower, larger part of the concha, opening into the canal.",
            "supply": {
                "n": [
                    "arnold",
                    "fn-sensory"
                ],
                "a": [
                    "postaur-a"
                ]
            },
            "rel": {
                "ant": [
                    "tragus"
                ],
                "med": [
                    "eac-cart"
                ]
            }
        },
        "tragus": {
            "name": "Tragus",
            "note": "The flap in front of the concha over the canal opening. First-arch derivative.",
            "origin": [
                "arch1"
            ],
            "supply": {
                "n": [
                    "auriculotemp-n"
                ],
                "a": [
                    "supftemp-a"
                ]
            },
            "rel": {
                "sup": [
                    "incisura"
                ]
            }
        },
        "antitragus": {
            "name": "Antitragus",
            "note": "The bump above the lobule, opposite the tragus across the intertragic notch. Second-arch derivative.",
            "origin": [
                "arch2"
            ],
            "rel": {
                "inf": [
                    "lobule"
                ]
            }
        },
        "intertragic": {
            "name": "Intertragic notch",
            "syn": [
                "Incisura intertragica"
            ],
            "note": "Between the tragus and the antitragus."
        },
        "incisura": {
            "name": "Incisura terminalis",
            "note": "The cartilage-free gap between the tragus and the root of the helix. The endaural incision runs through it, so no cartilage is cut.",
            "rel": {
                "sup": [
                    "helcrus"
                ]
            }
        },
        "lobule": {
            "name": "Lobule",
            "note": "Fat and fibrous tissue without cartilage.",
            "origin": [
                "arch2"
            ],
            "supply": {
                "n": [
                    "greataur-n"
                ]
            }
        },
        "aucart": {
            "name": "Auricular cartilage",
            "note": "A single elastic plate, continuous with the lateral canal cartilage, absent from the lobule and incisura terminalis. Avascular: it depends on its perichondrium, so a haematoma lifting the perichondrium kills it. Lateral skin is bound to perichondrium with almost no subcutis; medial skin is looser."
        },
        "aupont": {
            "name": "Ponticulus (auricular)",
            "note": "A ridge on the medial surface of the conchal cartilage, where the posterior auricular muscle attaches. Not the ponticulus of the middle ear."
        },
        "aumuscles": {
            "name": "Extrinsic auricular muscles",
            "note": "Anterior, superior and posterior auricularis: vestigial, on the scalp. Anterior and superior from the temporal branch of the facial nerve, posterior from the posterior auricular nerve. Six intrinsic muscles on the cartilage are vestigial too.",
            "origin": [
                "arch2"
            ],
            "supply": {
                "n": [
                    "fn",
                    "postaur-n"
                ]
            }
        },
        "greataur-n": {
            "name": "Great auricular nerve",
            "note": "Cervical plexus, C2-C3. Lower lateral and most of the medial auricle, the lobule, skin over the parotid and the mandibular angle."
        },
        "lessocc-n": {
            "name": "Lesser occipital nerve",
            "note": "Cervical plexus, C2. Upper medial auricle and the adjacent scalp."
        },
        "auriculotemp-n": {
            "name": "Auriculotemporal nerve",
            "note": "Posterior trunk of V3, splitting around the middle meningeal artery. Tragus, anterosuperior auricle, anterior and superior canal walls, anterior lateral face of the drum. Carries otic ganglion secretomotor fibres to the parotid.",
            "rel": {
                "ant": [
                    "tmj"
                ]
            }
        },
        "arnold": {
            "name": "Arnold's nerve",
            "syn": [
                "Auricular branch of the vagus"
            ],
            "note": "From the superior (jugular) ganglion of X, through the mastoid canaliculus in the lateral wall of the jugular fossa, across the facial canal (communicating with VII), out through the tympanomastoid suture. Concha, posterior and inferior canal, posterior lateral drum. Canal stimulation can trigger a cough."
        },
        "fn-sensory": {
            "name": "Facial nerve: auricular sensory branch",
            "note": "Sensory fibres of VII to the posterosuperior canal and part of the concha. Hypoesthesia here (Hitselberger sign) can accompany a lesion compressing VII in the internal auditory canal."
        },
        "postaur-n": {
            "name": "Posterior auricular nerve",
            "note": "First extracranial branch of VII after the stylomastoid foramen; posterior auricular and occipitalis muscles."
        },
        "v3": {
            "name": "Mandibular nerve (V3)",
            "note": "Through the foramen ovale, lateral to the cartilaginous Eustachian tube. Motor to tensor tympani and tensor veli palatini; sensory to the canal and drum through the auriculotemporal nerve. Referred otalgia from teeth, jaw and oral cavity."
        },
        "phplexus": {
            "name": "Pharyngeal plexus",
            "note": "Motor fibres from the vagus (with glossopharyngeal sensory fibres) to the pharyngeal and palatal muscles except tensor veli palatini."
        },
        "supftemp-a": {
            "name": "Superficial temporal artery",
            "note": "Terminal branch of the external carotid, in front of the tragus. Anterior auricular branches to the lateral auricle and anterior canal."
        },
        "postaur-a": {
            "name": "Posterior auricular artery",
            "note": "External carotid branch. The dominant auricular supply: the medial surface, and perforators through the cartilage to the concha and lateral surface. Usually gives the stylomastoid artery."
        },
        "deepaur-a": {
            "name": "Deep auricular artery",
            "note": "First part of the maxillary artery; pierces the canal wall. Canal skin and the lateral face of the drum (manubrial and radial vessels); also the TMJ."
        },
        "ln-pre": {
            "name": "Preauricular (parotid) nodes",
            "note": "Drain the anterior auricle, tragus and anterior canal."
        },
        "ln-retro": {
            "name": "Retroauricular (mastoid) nodes",
            "note": "Over the mastoid; drain the posterior and superior auricle."
        },
        "ln-infra": {
            "name": "Infra-auricular nodes",
            "note": "Below the ear, continuous with the upper deep cervical chain; drain the lobule, concha and canal floor."
        },
        "eac-cart": {
            "name": "Cartilaginous canal",
            "note": "The lateral third (about 8 mm). Thick skin with hair, sebaceous and ceruminous glands. Straightened by pulling the auricle posterosuperiorly in adults.",
            "supply": {
                "n": [
                    "auriculotemp-n",
                    "arnold",
                    "fn-sensory"
                ],
                "a": [
                    "supftemp-a",
                    "postaur-a",
                    "deepaur-a"
                ]
            },
            "rel": {
                "med": [
                    "eac-bony",
                    "eac-isthmus"
                ],
                "inf": [
                    "parotid"
                ]
            }
        },
        "eac-bony": {
            "name": "Bony canal",
            "note": "The medial two thirds (about 16 mm). Skin about 0.2 mm thick directly on periosteum: no adnexa, no subcutis, easily torn. Squama above and behind, tympanic part in front, below and posteroinferiorly.",
            "rel": {
                "med": [
                    "tm"
                ],
                "ant": [
                    "tmj"
                ]
            }
        },
        "eac-isthmus": {
            "name": "Isthmus of the canal",
            "note": "The narrowest point, just medial to the bony-cartilaginous junction. Foreign bodies lodge medial to it."
        },
        "overhang": {
            "name": "Anterior canal wall overhang",
            "note": "The anterior bony wall bulging into the canal; hides the anterior annulus and recess. Canalplasty takes it down.",
            "rel": {
                "med": [
                    "atmr"
                ]
            }
        },
        "atmr": {
            "name": "Anterior tympanomeatal recess",
            "syn": [
                "Anterior sulcus"
            ],
            "note": "The acute angle between the anterior canal wall and the drum: the deepest, least visible point of the canal. Blunting here after grafting is a known failure."
        },
        "santorini": {
            "name": "Fissures of Santorini",
            "note": "Clefts in the floor of the cartilaginous canal. A route for infection and tumour between the canal and the parotid.",
            "rel": {
                "inf": [
                    "parotid"
                ]
            }
        },
        "huschke": {
            "name": "Foramen of Huschke",
            "note": "A gap in the anteroinferior bony canal from incomplete ossification of the tympanic ring; usually closes in early childhood. When persistent it opens the canal to the TMJ and parotid.",
            "rel": {
                "ant": [
                    "tmj"
                ]
            }
        },
        "tympsulcus": {
            "name": "Tympanic sulcus",
            "note": "The groove in the tympanic part holding the annulus. Deficient above, at the notch of Rivinus."
        },
        "umbo": {
            "name": "Umbo",
            "note": "The tip of the manubrium at the centre of the drum: the apex of its medially pointing cone. About 2 mm from the promontory.",
            "rel": {
                "sup": [
                    "manubrium"
                ],
                "inf": [
                    "lightreflex"
                ],
                "med": [
                    "promontory"
                ]
            }
        },
        "manubrium": {
            "name": "Manubrium of the malleus",
            "syn": [
                "Handle of the malleus"
            ],
            "note": "Embedded in the drum's middle layer, from the lateral process down and back to the umbo. Second-arch derivative.",
            "origin": [
                "arch2"
            ],
            "rel": {
                "sup": [
                    "latproc"
                ]
            }
        },
        "latproc": {
            "name": "Lateral process of the malleus",
            "syn": [
                "Short process of the malleus"
            ],
            "note": "The knob at the top of the manubrium, bulging the drum: the most constant otoscopic landmark. The malleal folds run forward and back from it.",
            "rel": {
                "sup": [
                    "flaccida"
                ],
                "post": [
                    "pmf"
                ],
                "ant": [
                    "amf"
                ]
            }
        },
        "lightreflex": {
            "name": "Cone of light",
            "syn": [
                "Light reflex"
            ],
            "note": "Reflection from the anteroinferior drum: 5 o'clock in a right ear, 7 o'clock in a left."
        },
        "rivinus": {
            "name": "Notch of Rivinus",
            "note": "The gap in the tympanic sulcus superiorly, between the ends of the annulus. The pars flaccida attaches to it directly.",
            "rel": {
                "inf": [
                    "latproc"
                ]
            }
        },
        "tm-as": {
            "name": "Anterosuperior quadrant",
            "note": "Medial to it: the tensor tendon and cochleariform process superiorly, the chorda leaving anteriorly.",
            "rel": {
                "post": [
                    "tm-ps"
                ],
                "inf": [
                    "tm-ai"
                ],
                "med": [
                    "cochleariform"
                ]
            }
        },
        "tm-ai": {
            "name": "Anteroinferior quadrant",
            "note": "Faces the protympanum and Eustachian tube orifice, with the carotid beyond the anterior wall. The usual myringotomy and tube site."
        },
        "tm-ps": {
            "name": "Posterosuperior quadrant",
            "note": "Medial to it: the long process of the incus, incudostapedial joint, stapes, stapedius tendon, chorda and oval window, with the tympanic facial nerve above. Retraction here erodes the incus.",
            "rel": {
                "inf": [
                    "tm-pi"
                ],
                "med": [
                    "isj",
                    "stapes"
                ]
            }
        },
        "tm-pi": {
            "name": "Posteroinferior quadrant",
            "note": "Medial to it: the round window niche, sinus tympani region and hypotympanum; a high jugular bulb shows here as a blue mass.",
            "rel": {
                "ant": [
                    "tm-ai"
                ],
                "med": [
                    "rw"
                ]
            }
        },
        "mhead": {
            "name": "Head of the malleus",
            "note": "In the epitympanum, articulating behind with the incus body. First-arch (Meckel's) derivative.",
            "origin": [
                "arch1"
            ],
            "rel": {
                "inf": [
                    "mneck"
                ],
                "sup": [
                    "sml"
                ],
                "post": [
                    "imj"
                ]
            }
        },
        "mneck": {
            "name": "Neck of the malleus",
            "note": "Between head and manubrium; the medial wall of Prussak's space. The tensor tendon inserts on its medial side.",
            "rel": {
                "inf": [
                    "manubrium"
                ],
                "ant": [
                    "antproc"
                ],
                "lat": [
                    "lml"
                ]
            }
        },
        "antproc": {
            "name": "Anterior process of the malleus",
            "note": "A slender spur toward the petrotympanic fissure, anchored by the anterior malleal ligament.",
            "rel": {
                "ant": [
                    "aml"
                ]
            }
        },
        "imj": {
            "name": "Incudomallear joint",
            "note": "Synovial saddle joint between the malleus head and incus body; the 'ice cream cone' on axial CT.",
            "rel": {
                "post": [
                    "incbody"
                ]
            }
        },
        "incbody": {
            "name": "Body of the incus",
            "note": "In the posterior epitympanum. First-arch derivative.",
            "origin": [
                "arch1"
            ],
            "rel": {
                "post": [
                    "incshort"
                ],
                "inf": [
                    "inclong"
                ],
                "sup": [
                    "sil"
                ]
            }
        },
        "incshort": {
            "name": "Short process of the incus",
            "note": "Points back into the fossa incudis at the aditus: a mastoidectomy landmark, seen through the aditus, lateral to the second genu.",
            "rel": {
                "post": [
                    "pil"
                ]
            }
        },
        "inclong": {
            "name": "Long process of the incus",
            "note": "Descends parallel to and behind the manubrium. Second-arch derivative. Its tip has the poorest blood supply in the chain and erodes first.",
            "origin": [
                "arch2"
            ],
            "rel": {
                "med": [
                    "lenticular"
                ]
            }
        },
        "lenticular": {
            "name": "Lenticular process",
            "note": "The small medial knob at the tip of the long process, articulating with the stapes head.",
            "rel": {
                "med": [
                    "capitulum"
                ]
            }
        },
        "capitulum": {
            "name": "Head of the stapes",
            "syn": [
                "Capitulum"
            ],
            "note": "Articulates with the lenticular process; the stapedius tendon inserts on the posterior neck just below it.",
            "rel": {
                "med": [
                    "antcrus",
                    "postcrus"
                ]
            }
        },
        "antcrus": {
            "name": "Anterior crus of the stapes",
            "note": "Thinner and straighter than the posterior crus.",
            "rel": {
                "post": [
                    "obturator"
                ],
                "med": [
                    "ow"
                ]
            }
        },
        "postcrus": {
            "name": "Posterior crus of the stapes",
            "note": "Thicker and more curved than the anterior crus.",
            "rel": {
                "med": [
                    "ow"
                ]
            }
        },
        "obturator": {
            "name": "Obturator foramen",
            "note": "The opening between the crura, closed by mucosa. A persistent stapedial artery runs through it.",
            "rel": {
                "post": [
                    "postcrus"
                ]
            }
        },
        "sml": {
            "name": "Superior malleal ligament",
            "note": "From the malleus head up to the tegmen."
        },
        "aml": {
            "name": "Anterior malleal ligament",
            "note": "From the anterior process into the petrotympanic fissure; with the posterior incudal ligament it sets the chain's axis of rotation. First-arch (Meckel's cartilage) remnant.",
            "origin": [
                "arch1"
            ],
            "rel": {
                "ant": [
                    "ptfiss"
                ]
            }
        },
        "lml": {
            "name": "Lateral malleal ligament",
            "note": "From the malleus neck to the margins of the notch of Rivinus; lies in the lateral malleal fold, the roof of Prussak's space.",
            "rel": {
                "lat": [
                    "rivinus"
                ]
            }
        },
        "sil": {
            "name": "Superior incudal ligament",
            "note": "From the incus body up to the tegmen; often only a fold."
        },
        "pil": {
            "name": "Posterior incudal ligament",
            "note": "From the short process into the fossa incudis. The posterior end of the axis of rotation.",
            "rel": {
                "post": [
                    "fossainc"
                ]
            }
        },
        "annlig": {
            "name": "Annular ligament",
            "note": "Ring of elastic fibres sealing the footplate into the oval window. Its fixation by otosclerosis is the lesion of stapes surgery. Otic capsule derivative.",
            "origin": [
                "otic"
            ]
        },
        "fossainc": {
            "name": "Fossa incudis",
            "note": "A pit in the floor of the aditus holding the short process of the incus.",
            "rel": {
                "post": [
                    "antrum"
                ]
            }
        },
        "amf": {
            "name": "Anterior malleal fold",
            "note": "From the lateral process forward to the anterior tympanic spine; on the drum it is the anterior border of the pars flaccida. Encloses the anterior malleal ligament, chorda and anterior tympanic artery; bounds the anterior pouch of von Tr\u00f6ltsch.",
            "rel": {
                "sup": [
                    "flaccida"
                ]
            }
        },
        "pmf": {
            "name": "Posterior malleal fold",
            "note": "From the lateral process back to the posterosuperior annulus; on the drum, the posterior border of the pars flaccida. The chorda runs in its free edge; it bounds the posterior pouch of von Tr\u00f6ltsch.",
            "rel": {
                "sup": [
                    "flaccida"
                ]
            }
        },
        "supmf": {
            "name": "Superior malleal fold",
            "note": "From the malleus head to the tegmen, around the superior malleal ligament."
        },
        "lif": {
            "name": "Lateral incudal fold",
            "note": "From the incus body and short process to the lateral attic wall: part of the tympanic diaphragm."
        },
        "mif": {
            "name": "Medial incudal fold",
            "note": "From the short process medially; part of the tympanic diaphragm, bounding the posterior isthmus."
        },
        "pif": {
            "name": "Posterior incudal fold",
            "note": "Around the posterior incudal ligament at the fossa incudis."
        },
        "supif": {
            "name": "Superior incudal fold",
            "note": "From the incus body to the tegmen, around the superior incudal ligament."
        },
        "tensorfold": {
            "name": "Tensor fold",
            "note": "From the tensor tendon and cochleariform process to the anterior wall; floors the anterior epitympanic recess. Usually complete, so the anterior attic ventilates only through the isthmus.",
            "rel": {
                "sup": [
                    "aer"
                ]
            }
        },
        "inteross": {
            "name": "Interossicular fold",
            "note": "Between the malleus, incus and chorda; part of the tympanic diaphragm."
        },
        "stapfold": {
            "name": "Stapedial fold",
            "note": "Mucosa over the stapes and stapedius tendon, filling the obturator foramen."
        },
        "vtrant": {
            "name": "Anterior pouch of von Tr\u00f6ltsch",
            "note": "Between the anterior malleal fold and the drum.",
            "rel": {
                "lat": [
                    "tm"
                ],
                "med": [
                    "amf"
                ]
            }
        },
        "vtrpost": {
            "name": "Posterior pouch of von Tr\u00f6ltsch",
            "note": "Between the posterior malleal fold and the drum; communicates with Prussak's space. A route for posterior epitympanic retractions.",
            "rel": {
                "lat": [
                    "tm"
                ],
                "med": [
                    "pmf"
                ]
            }
        },
        "diaphragm": {
            "name": "Tympanic diaphragm",
            "note": "Ossicles, ligaments and folds that separate the epitympanum from the mesotympanum, open only at the isthmus.",
            "rel": {
                "sup": [
                    "epitympanum"
                ],
                "inf": [
                    "mesotympanum"
                ]
            }
        },
        "isth-ant": {
            "name": "Anterior tympanic isthmus",
            "note": "The anterior of the two corridors between mesotympanum and epitympanum, split by the stapes. Anterior: the tensor tendon and its fold. Posterior: the stapes superstructure (anterior crus). Lateral: the malleus neck. Medial: the cochleariform process and medial wall. Clears the tubal orifice up into the anterior and superior attic.",
            "rel": {
                "post": [
                    "isth-post"
                ],
                "sup": [
                    "epitympanum"
                ],
                "inf": [
                    "mesotympanum"
                ],
                "lat": [
                    "mneck"
                ],
                "med": [
                    "cochleariform"
                ]
            }
        },
        "isth-post": {
            "name": "Posterior tympanic isthmus",
            "note": "The posterior corridor. Anterior: the posterior crus of the stapes. Posterior: the pyramidal process and posterior incudal ligament. Lateral: the short process of the incus. Medial: the bony facial canal and sinus tympani area. The ventilation path to the aditus, antrum and mastoid cells.",
            "rel": {
                "lat": [
                    "incshort"
                ],
                "post": [
                    "pil"
                ]
            }
        },
        "strecess": {
            "name": "Supratubal recess",
            "note": "Above the tensor fold, in front of the cog: the anterior part of the epitympanum. Below the tensor fold lies the protympanum, leading down to the tube. Often used interchangeably with the anterior epitympanic recess.",
            "rel": {
                "inf": [
                    "tensorfold"
                ]
            }
        },
        "subtymp": {
            "name": "Subtympanic sinus",
            "syn": [
                "Sinus subtympanicus"
            ],
            "note": "The retrotympanic recess below the subiculum, above the hypotympanum.",
            "rel": {
                "sup": [
                    "subiculum"
                ]
            }
        },
        "posttymp": {
            "name": "Posterior tympanic sinus",
            "note": "A small recess above the ponticulus, between it and the lateral canal prominence.",
            "rel": {
                "inf": [
                    "ponticulus"
                ]
            }
        },
        "chordal": {
            "name": "Chordal eminence",
            "note": "On the posterior wall lateral to the pyramid, where the chorda enters through the iter chordae posterius.",
            "rel": {
                "med": [
                    "pyramid"
                ]
            }
        },
        "finiculus": {
            "name": "Finiculus",
            "note": "A bony ridge running from the anterior lip of the round window niche; bounds the subtympanic sinus anteriorly.",
            "rel": {
                "post": [
                    "rw"
                ]
            }
        },
        "lpn": {
            "name": "Lesser petrosal nerve",
            "note": "Glossopharyngeal secretomotor fibres from the tympanic plexus. Leaves anterosuperiorly beside the tensor semicanal, runs on the middle fossa floor lateral to the GSPN, exits through the foramen ovale (or innominatum) to the otic ganglion, then the auriculotemporal nerve to the parotid.",
            "rel": {
                "med": [
                    "gspn"
                ]
            }
        },
        "ctn": {
            "name": "Caroticotympanic nerves",
            "note": "Sympathetic fibres from the internal carotid plexus, through the caroticotympanic canaliculi, joining the tympanic plexus."
        },
        "ntt": {
            "name": "Nerve to tensor tympani",
            "note": "From V3 (with the nerve to medial pterygoid), through the otic ganglion without synapse."
        },
        "nstap": {
            "name": "Nerve to stapedius",
            "note": "From the mastoid segment of VII beside the pyramid. Lost with lesions proximal to it: hyperacusis, absent stapedial reflex."
        },
        "itc": {
            "name": "Inferior tympanic canaliculus",
            "note": "In the ridge between the carotid canal and the jugular fossa; carries Jacobson's nerve and the inferior tympanic artery into the hypotympanum. The site of origin of glomus tympanicum.",
            "rel": {
                "ant": [
                    "ica"
                ],
                "post": [
                    "jb"
                ]
            }
        },
        "mastcan": {
            "name": "Mastoid canaliculus",
            "note": "In the lateral wall of the jugular fossa; carries Arnold's nerve toward the facial canal.",
            "rel": {
                "med": [
                    "jb"
                ]
            }
        },
        "fhiatus": {
            "name": "Facial hiatus",
            "note": "Opening on the anterior petrous face where the GSPN and the superficial petrosal artery leave the geniculate region."
        },
        "icp": {
            "name": "Iter chordae posterius",
            "note": "Opening on the posterior wall lateral to the pyramid, near the posterosuperior annulus: the chorda and posterior tympanic artery enter the middle ear here."
        },
        "huguier": {
            "name": "Canal of Huguier",
            "syn": [
                "Iter chordae anterius"
            ],
            "note": "Small canal at the medial end of the petrotympanic fissure through which the chorda leaves the middle ear."
        },
        "max-a": {
            "name": "Maxillary artery",
            "note": "Terminal external carotid branch, behind the mandibular neck. First part gives the deep auricular, anterior tympanic and middle meningeal arteries."
        },
        "mma": {
            "name": "Middle meningeal artery",
            "note": "Maxillary branch through the foramen spinosum; gives the superficial petrosal and superior tympanic arteries. Absent foramen spinosum suggests a persistent stapedial artery."
        },
        "ascphar-a": {
            "name": "Ascending pharyngeal artery",
            "note": "Medial external carotid branch; gives the inferior tympanic artery. The usual feeder of glomus tumours."
        },
        "aica": {
            "name": "Anterior inferior cerebellar artery",
            "note": "Basilar branch; usually gives the labyrinthine artery, and loops into the internal auditory canal in some."
        },
        "antymp-a": {
            "name": "Anterior tympanic artery",
            "note": "Maxillary artery, through the petrotympanic fissure. Medial drum, malleus, anterior middle ear; with the posterior tympanic it forms the arcade on the ossicles."
        },
        "posttymp-a": {
            "name": "Posterior tympanic artery",
            "note": "From the stylomastoid artery; enters with the chorda through the iter chordae posterius. Posterior drum, incus, stapes, stapedius."
        },
        "stylomast-a": {
            "name": "Stylomastoid artery",
            "note": "Posterior auricular (or occipital) artery, up the stylomastoid foramen with VII. Mastoid facial nerve, stapedius, mastoid cells; gives the posterior tympanic artery."
        },
        "inftymp-a": {
            "name": "Inferior tympanic artery",
            "note": "Ascending pharyngeal artery, through the inferior tympanic canaliculus with Jacobson's nerve. Promontory and hypotympanum."
        },
        "suptymp-a": {
            "name": "Superior tympanic artery",
            "note": "Middle meningeal artery, along the tensor tympani canal with the lesser petrosal nerve. Tensor and anterosuperior middle ear."
        },
        "suppetr-a": {
            "name": "Superficial petrosal artery",
            "note": "Middle meningeal artery, through the facial hiatus with the GSPN. Geniculate ganglion and tympanic facial nerve."
        },
        "carotymp-a": {
            "name": "Caroticotympanic artery",
            "note": "Petrous internal carotid, through the caroticotympanic canaliculi in the carotid plate. Anterior middle ear."
        },
        "labyr-a": {
            "name": "Labyrinthine artery",
            "note": "Usually from AICA, through the internal auditory canal. Inner ear, meatal and labyrinthine facial nerve: an end artery, and the labyrinthine segment is a watershed with the superficial petrosal artery."
        },
        "crural-a": {
            "name": "Crural arteries",
            "note": "Anterior and posterior vessels along the stapes crura, from the mucosal plexus of the tympanic arteries."
        },
        "pstap-a": {
            "name": "Persistent stapedial artery",
            "note": "Variant: the embryonic second-arch artery persists, usually from the petrous carotid, through the obturator foramen, along an enlarged tympanic facial canal, and replaces the middle meningeal artery (foramen spinosum absent).",
            "origin": [
                "arch2"
            ]
        },
        "et-bony": {
            "name": "Bony Eustachian tube",
            "note": "The lateral third, opening from the protympanum. The petrous carotid lies medial to it, the tensor semicanal above.",
            "rel": {
                "med": [
                    "et-isthmus",
                    "ica"
                ],
                "ant": [
                    "et-isthmus"
                ],
                "sup": [
                    "tensor"
                ]
            }
        },
        "et-isthmus": {
            "name": "Isthmus of the Eustachian tube",
            "note": "The narrowest point, at the bony-cartilaginous junction.",
            "rel": {
                "med": [
                    "et-cart"
                ],
                "ant": [
                    "et-cart"
                ]
            }
        },
        "et-cart": {
            "name": "Cartilaginous Eustachian tube",
            "note": "The medial two thirds: a large medial lamina, a small hooked lateral lamina and a membranous anterolateral wall. Closed at rest, opened by tensor veli palatini. V3 and the foramen ovale lie lateral to it.",
            "rel": {
                "lat": [
                    "ostmann",
                    "v3"
                ],
                "inf": [
                    "lvp"
                ]
            }
        },
        "ostmann": {
            "name": "Ostmann's fat pad",
            "note": "Fat against the lateral membranous wall of the cartilaginous tube; helps keep it closed. Loss of it (weight loss) is linked to a patulous tube.",
            "rel": {
                "lat": [
                    "tvp"
                ]
            }
        },
        "rudinger": {
            "name": "R\u00fcdinger's safety canal",
            "note": "The upper part of the cartilaginous lumen under the hook of the lateral lamina, which stays open for pressure equalization when the rest is closed."
        },
        "torus": {
            "name": "Torus tubarius",
            "note": "The cartilage ridge around the nasopharyngeal orifice of the tube.",
            "rel": {
                "post": [
                    "rosenmuller"
                ]
            }
        },
        "rosenmuller": {
            "name": "Fossa of Rosenm\u00fcller",
            "syn": [
                "Lateral pharyngeal recess"
            ],
            "note": "The recess behind and above the torus: the commonest site of nasopharyngeal carcinoma, which presents as a unilateral effusion."
        },
        "tvp": {
            "name": "Tensor veli palatini",
            "note": "The main dilator of the tube, lateral to it; hooks around the pterygoid hamulus. V3: the one palatal muscle not supplied by the pharyngeal plexus.",
            "origin": [
                "arch1"
            ],
            "supply": {
                "n": [
                    "v3"
                ]
            }
        },
        "lvp": {
            "name": "Levator veli palatini",
            "note": "Below and medial to the cartilaginous tube; elevates the torus. Pharyngeal plexus (X).",
            "origin": [
                "arch4"
            ],
            "supply": {
                "n": [
                    "phplexus"
                ]
            }
        },
        "salpingo": {
            "name": "Salpingopharyngeus",
            "note": "From the lower torus down the salpingopharyngeal fold. Pharyngeal plexus (X).",
            "origin": [
                "arch4"
            ],
            "supply": {
                "n": [
                    "phplexus"
                ]
            }
        },
        "facialridge": {
            "name": "Facial ridge",
            "note": "The bone over the mastoid facial nerve between the posterior canal wall and the mastoid cavity; lowered in a canal wall down mastoidectomy.",
            "rel": {
                "med": [
                    "fn"
                ]
            }
        },
        "sps": {
            "name": "Superior petrosal sinus",
            "note": "Along the petrous ridge, from the cavernous sinus to the sigmoid-transverse junction. The upper border of Trautmann's triangle."
        },
        "trautmann": {
            "name": "Trautmann's triangle",
            "note": "The posterior fossa dural plate between the sigmoid sinus behind, the superior petrosal sinus above and the bony labyrinth in front.",
            "rel": {
                "post": [
                    "sigmoid"
                ],
                "sup": [
                    "sps"
                ],
                "ant": [
                    "pscc"
                ],
                "med": [
                    "pfdura"
                ]
            }
        },
        "retrofacial": {
            "name": "Retrofacial air cells",
            "note": "Posteromedial to the mastoid facial nerve, toward the jugular bulb; a route to the hypotympanum and petrous apex.",
            "rel": {
                "ant": [
                    "fn"
                ]
            }
        },
        "emissary": {
            "name": "Mastoid emissary vein foramen",
            "note": "On the posterior mastoid surface, draining into the sigmoid sinus; bleeds briskly when drilled.",
            "rel": {
                "med": [
                    "sigmoid"
                ]
            }
        },
        "petapex": {
            "name": "Petrous apex",
            "note": "The medial tip of the petrous pyramid, medial to the inner ear, against the clivus. Pneumatized in a minority of bones.",
            "rel": {
                "lat": [
                    "cochlea"
                ],
                "post": [
                    "iac"
                ],
                "inf": [
                    "ica-horiz"
                ],
                "ant": [
                    "ica-horiz",
                    "meckel"
                ],
                "med": [
                    "dorello",
                    "petroclival"
                ]
            }
        },
        "ica-horiz": {
            "name": "Internal carotid artery: horizontal petrous segment",
            "note": "Runs anteromedially toward the foramen lacerum after the genu below the cochlea; anterolateral and below the apex."
        },
        "meckel": {
            "name": "Meckel's cave",
            "note": "Dural pocket over the apex holding the trigeminal ganglion."
        },
        "dorello": {
            "name": "Dorello's canal",
            "note": "Under the petrosphenoidal (Gruber's) ligament at the apex tip; carries the abducens nerve. Apex inflammation: abducens palsy with trigeminal pain and otorrhoea (Gradenigo).",
            "rel": {
                "med": [
                    "cn6"
                ]
            }
        },
        "cn6": {
            "name": "Abducens nerve",
            "note": "Crosses the tip of the petrous apex in Dorello's canal on its way to the cavernous sinus."
        },
        "petroclival": {
            "name": "Petroclival fissure",
            "note": "The synchondrosis between petrous apex and clivus; the inferior petrosal sinus lies along it."
        },
        "supralab": {
            "name": "Supralabyrinthine cell tract",
            "note": "Air cells above the labyrinth toward the apex.",
            "rel": {
                "inf": [
                    "vestibule"
                ],
                "sup": [
                    "mcfdura"
                ]
            }
        },
        "infralab": {
            "name": "Infralabyrinthine cell tract",
            "note": "Air cells below the labyrinth, above the jugular bulb, toward the apex.",
            "rel": {
                "sup": [
                    "vestibule"
                ],
                "inf": [
                    "jb"
                ]
            }
        },
        "subarcuate": {
            "name": "Subarcuate cell tract",
            "note": "Through the arch of the superior canal, along the subarcuate artery's canal, toward the apex."
        },
        "peritubal": {
            "name": "Peritubal cell tract",
            "note": "Cells around the Eustachian tube and carotid canal, toward the apex."
        }
    };

    window.OLSB = { glossary: G, dioramas: [], ell: ell, spiral: spiral };
})();
