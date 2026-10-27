/* =================================================================
   Orbital & Naso-Orbito-Ethmoid Trauma
   OKSAT · Facial Plastics & Recon Module
   ================================================================= */
/* Sources: the owner's resident-review decks: "Orbit Trauma"
   (A. Baker, 2020-08-24), "Orbital and Temporal Bone Trauma"
   (V. Pandrangi; orbit half), "All of Facial Trauma" (Facial Trauma
   Overview; NOE and orbital floor slides), "Resident Review:
   Midface Fractures" (2017; NOE management slide). The orbit decks
   point to the AO Foundation Surgery Reference (CMF); the owner will
   add AO content later. The apex-syndrome slides cite Badakere A,
   Patil-Chhablani P. Orbital apex syndrome: a review. Eye Brain 2019
   (doi 10.2147/EB.S180190).
   Added from the AO text (Cienfuegos et al., Principles of Internal
   Fixation of the Craniomaxillofacial Skeleton, AO Foundation 2012, as
   supplied in the owner's mastery note): the floor and inferomedial
   strut, the volume-enophthalmos relation, retrobulbar hematoma
   features, the trapdoor 24-hour rule, and the canthopexy vector.
   Checked in PubMed: Kolk 2007 (0.93 mm per cm3) and Gerbino 2010.
   No figures: the decks' images are unlabeled CT or surgical
   photographs; none is used.
   Discrepancy policy: the highest-ranked source is keyed;
   disagreements and "added" (standard teaching not in the decks) or
   deck-only claims are named in the explanation under Discrepancy:
   or Caveat:. Nothing here is clinically verified; the owner sets
   that. */

const meta = {
    title: 'Orbital & NOE\nTrauma',
    subtitle:
        'Orbital anatomy and the trauma examination, blowout fractures and the indications and timing of repair, lid approaches and their risks, naso-orbito-ethmoid fractures and the canthal tendon, the orbital apex, superior orbital fissure and cavernous sinus syndromes, and three integrating cases.',
    kicker: 'Self-Assessment · Facial Plastics & Recon Module',
    id: 'orbit-noe-trauma',
    sources: [
        'Resident review decks (owner): Orbit Trauma 2020 (Baker); Orbital and Temporal Bone Trauma (Pandrangi); All of Facial Trauma; Resident Review Midface Fractures 2017 (Moneta)',
        'Badakere A, Patil-Chhablani P. Orbital apex syndrome: a review. Eye Brain 2019;11:63-72 (doi 10.2147/EB.S180190), as cited in the Baker deck',
        'AO Foundation Surgery Reference, craniomaxillofacial trauma (referenced by the decks; the owner will add content)',
        'Cienfuegos R, et al. Principles of Internal Fixation of the Craniomaxillofacial Skeleton. AO Foundation; 2012 (owner mastery note)',
        'Kolk A, et al. Secondary post-traumatic enophthalmos: high-resolution MRI compared with multislice CT in postoperative orbital volume measurement. J Oral Maxillofac Surg 2007;65:1926-34 (doi 10.1016/j.joms.2006.06.269)',
        'Gerbino G, et al. Surgical management of orbital trapdoor fracture in a pediatric population. J Oral Maxillofac Surg 2010;68:1310-6 (doi 10.1016/j.joms.2009.12.037)',
        'Claims marked "added" (canthotomy, the bimanual canthal test, steroid response in Tolosa-Hunt) are standard teaching not stated in the decks; unvetted',
    ],
};

const DOMAINS = {
    anatomy:   { label: 'Orbital Anatomy & Examination', color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    fractures: { label: 'Orbital Fractures',             color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    repair:    { label: 'Timing, Approaches & Repair',   color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    noe:       { label: 'Naso-Orbito-Ethmoid Fractures', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    syndromes: { label: 'Apex & Fissure Syndromes',      color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    cases:     { label: 'Cases',                         color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // anatomy & examination
    'orbital-bones':        { label: 'Orbital Skeleton',             domain: 'anatomy' },
    'orbital-floor-anatomy':{ label: 'Floor, Strut & Medial Wall',   domain: 'anatomy' },
    'foramina-distances':   { label: 'Ethmoidal Arteries & Optic Nerve', domain: 'anatomy' },
    'canthal-tendons':      { label: 'Canthal Tendons',              domain: 'anatomy' },
    'lid-layers':           { label: 'Eyelid Layers',                domain: 'anatomy' },
    'orbital-exam':         { label: 'Orbital Examination',          domain: 'anatomy' },

    // orbital fractures
    'blowout':              { label: 'Blowout Fractures',            domain: 'fractures' },
    'entrapment':           { label: 'Entrapment & Oculocardiac Reflex', domain: 'fractures' },
    'enophthalmos':         { label: 'Enophthalmos & Hypoglobus',    domain: 'fractures' },
    'roof-fractures':       { label: 'Roof Fractures',               domain: 'fractures' },
    'surgical-indications': { label: 'Indications for Surgery',      domain: 'fractures' },

    // timing, approaches & repair
    'timing':               { label: 'Timing of Repair',             domain: 'repair' },
    'trapdoor':             { label: 'Pediatric Trapdoor Fracture',  domain: 'repair' },
    'retrobulbar-hematoma': { label: 'Retrobulbar Hematoma',         domain: 'repair' },
    'orbital-emergencies':  { label: 'Orbital Emergencies',          domain: 'repair' },
    'lid-approaches':       { label: 'Subciliary vs Transconjunctival', domain: 'repair' },
    'materials':            { label: 'Implant Materials',            domain: 'repair' },
    'repair-complications': { label: 'Repair Complications',         domain: 'repair' },

    // NOE
    'noe-anatomy':          { label: 'NOE Region & Presentation',    domain: 'noe' },
    'telecanthus':          { label: 'Telecanthus & Canthal Tests',  domain: 'noe' },
    'noe-types':            { label: 'Markowitz NOE Types',          domain: 'noe' },
    'noe-repair':           { label: 'NOE Repair by Type',           domain: 'noe' },
    'canthopexy':           { label: 'Transnasal Canthopexy Vector', domain: 'noe' },
    'noe-approaches':       { label: 'NOE Approaches',               domain: 'noe' },
    'noe-complications':    { label: 'CSF Leak & Lacrimal Injury',   domain: 'noe' },

    // syndromes
    'apex-syndrome':        { label: 'Orbital Apex Syndrome',        domain: 'syndromes' },
    'sof-syndrome':         { label: 'Superior Orbital Fissure Syndrome', domain: 'syndromes' },
    'cavernous-sinus':      { label: 'Cavernous Sinus Syndrome',     domain: 'syndromes' },
    'tolosa-hunt':          { label: 'Tolosa-Hunt Syndrome',         domain: 'syndromes' },

    // cases
    'case-blowout':         { label: 'Case: Pediatric White-Eyed Blowout', domain: 'cases' },
    'case-noe':             { label: 'Case: Telecanthus & NOE',      domain: 'cases' },
    'case-apex':            { label: 'Case: Visual Loss After Trauma', domain: 'cases' },
    'case-floor':           { label: 'Case: Adult Floor Blowout',    domain: 'cases' },
};

const ITEMS = [

// ════════════════ ORBITAL ANATOMY & EXAMINATION ════════════════

{
    id: 'q1', type: 'recall', section: 'Orbital Anatomy & Examination',
    stem: 'Name the seven bones that form the orbital skeleton.',
    answer: `• Frontal
• Lacrimal
• Ethmoid
• Maxillary
• Palatine
• Zygomatic
• Sphenoid`,
    brief: 'Seven bones: frontal, lacrimal, ethmoid, maxillary, palatine, zygomatic, sphenoid.',
    detailed: 'The medial wall is the thinnest area (lamina papyracea of the ethmoid, lacrimal), the floor is the maxilla (thin over the infraorbital canal), the roof the frontal bone with the lesser wing of the sphenoid, and the lateral wall the zygoma and greater wing of the sphenoid. Pearl: the thin floor and medial wall are why blowouts occur there; the lateral wall and roof are thicker.',
    concepts: ['orbital-bones'],
},
{
    id: 'q2', type: 'mcq', section: 'Orbital Anatomy & Examination',
    stem: 'Measured from the anterior lacrimal crest, how far are the anterior ethmoidal artery, posterior ethmoidal artery, and optic nerve?',
    options: [
        { id: 'a', text: '12 mm, 24 mm, 36 mm' },
        { id: 'b', text: '24 mm, 36 mm, 42 mm' },
        { id: 'c', text: '24 mm, 42 mm, 48 mm' },
        { id: 'd', text: '36 mm, 42 mm, 48 mm' },
    ],
    correct: 'b',
    brief: 'AEA 24 mm, PEA 36 mm, optic nerve 42 mm: 24, then +12, then +6.',
    detailed: 'The mnemonic is 24, +12, +6. These distances set how far you can safely dissect along the medial wall; the posterior ethmoidal artery and optic nerve are only 6 mm apart. Pearl: stay anterior to the PEA when working on the medial wall without a navigation system, and respect the 6 mm that remains.',
    concepts: ['foramina-distances'],
},
{
    id: 'q3', type: 'mcq', section: 'Orbital Anatomy & Examination',
    stem: 'The lateral canthal tendon inserts on Whitnall tubercle. Which description of the medial canthal tendon is correct?',
    options: [
        { id: 'a', text: 'Anterior attachment to the frontal process of the maxilla (anterior lacrimal crest); posterior attachment to the lacrimal bone (posterior lacrimal crest)'  },
        { id: 'b', text: 'Attachment to the zygomatic bone at Whitnall tubercle'  },
        { id: 'c', text: 'Attachment to the nasal bones at the radix'  },
        { id: 'd', text: 'A single attachment to the lacrimal bone only'  },
    ],
    correct: 'a',
    brief: 'The medial canthal tendon is anchored to the anterior and posterior lacrimal crests; the lateral tendon to Whitnall tubercle.',
    detailed: 'The tendon embraces the lacrimal sac, so avulsion of the tendon puts the lacrimal system at risk too. This is why NOE fractures are assessed by what the tendon is still attached to. Pearl: the NOE classification is built on this attachment, not on bone-fragment count.',
    concepts: ['canthal-tendons', 'noe-anatomy'],
},
{
    id: 'q4', type: 'recall', section: 'Orbital Anatomy & Examination',
    stem: 'List the layers of the upper and lower eyelid from skin to conjunctiva.',
    answer: `Upper: skin, orbicularis oculi, septum, levator, conjunctiva
Lower: skin, orbicularis oculi, septum, retractors, conjunctiva`,
    brief: 'The septum is the middle layer; the levator (upper) or retractors (lower) lie behind it.',
    detailed: 'A preseptal approach stays anterior to the septum; a postseptal approach crosses it into the orbital fat. Pearl: the layers explain the approach-specific complications (below).',
    concepts: ['lid-layers', 'lid-approaches'],
},
{
    id: 'q5', type: 'recall', section: 'Orbital Anatomy & Examination',
    stem: 'List the components of the orbital trauma examination.',
    answer: `• Afferent system — visual acuity, visual fields, pupillary reactivity
• Vertical or horizontal dystopia
• Axial displacement — proptosis, pulsating exophthalmos, enophthalmos
• Eyelids — ptosis (marginal reflex distance), canthal position (telecanthus)
• Lacrimal system
• Motility disturbance; forced duction
• Sensory cranial nerves (V2)
• Ophthalmology evaluation`,
    brief: 'Afferent system first, then globe position, lids, lacrimal system, motility with forced duction, and sensation.',
    detailed: 'Ophthalmology evaluation belongs in the standard work-up (pre- and postoperatively). A pulsating exophthalmos suggests a carotid-cavernous fistula. Pearl: any decrease in visual acuity, a pupillary defect, or a rising IOP changes the urgency of the whole case.',
    concepts: ['orbital-exam'],
},

{
    id: 'q31', type: 'mcq', section: 'Orbital Anatomy & Examination',
    stem: 'Which statement about the orbital floor and its junction with the medial wall is correct?',
    options: [
        { id: 'a', text: 'The floor is thickest posteromedial to the infraorbital canal, which is why blowouts spare it'  },
        { id: 'b', text: 'The lamina papyracea is the thick transition zone that supports implants'  },
        { id: 'c', text: 'The floor is thinnest posteromedial to the infraorbital canal, and the thick inferomedial strut behind it is the ledge on which an implant rests'  },
        { id: 'd', text: 'The infraorbital canal marks the thinnest part of the lateral floor'  },
    ],
    correct: 'c',
    brief: 'Thin floor medial to the canal fractures first; the inferomedial (maxillo-ethmoidal) strut is the thick posterior ledge.',
    detailed: 'The floor is formed by the orbital plate of the maxilla and is about 0.5 mm thick medial to the infraorbital groove, the typical blowout site, whereas the canal itself is reinforced. The lamina papyracea (ethmoid) is the thin medial wall. The inferomedial strut is the thicker bone where wall and floor meet; an implant seated on it is supported posteriorly instead of hanging into the maxillary sinus. Pearl: an implant that is too short or tilted off the strut leaves the posteromedial bulge uncorrected, the usual cause of residual enophthalmos. Source: AO text; the decks do not discuss the strut.',
    concepts: ['orbital-floor-anatomy', 'orbital-bones'],
},

// ════════════════ ORBITAL FRACTURES ════════════════

{
    id: 'q6', type: 'mcq', section: 'Orbital Fractures',
    stem: 'A "blowout" fracture is defined as a fracture of the floor with what feature?',
    options: [
        { id: 'a', text: 'Isolated lamina papyracea fracture only'  },
        { id: 'b', text: 'Involvement of the inferior orbital rim'  },
        { id: 'c', text: 'No involvement of the orbital rim'  },
        { id: 'd', text: 'Involvement of the zygomaticofrontal suture'  },
    ],
    correct: 'c',
    brief: 'Blowout = floor fracture without rim involvement.',
    detailed: 'Fractures can involve the floor, roof, or a single wall (rare), but the deck states the most common orbital fracture is the floor in association with other walls, often with zygoma or Le Fort fractures. A fracture that includes the rim is a different mechanism. Pearl: look for intraorbital air on CT.',
    concepts: ['blowout'],
},
{
    id: 'q7', type: 'mcq', section: 'Orbital Fractures',
    stem: 'A floor fracture increases orbital volume. According to the Facial Trauma Overview, what is the expected clinical consequence?',
    options: [
        { id: 'a', text: 'Proptosis'  },
        { id: 'b', text: 'Enophthalmos (the deck states "not hypoglobus")'  },
        { id: 'c', text: 'Ptosis only'  },
        { id: 'd', text: 'Telecanthus'  },
    ],
    correct: 'b',
    brief: 'Increased orbital volume produces enophthalmos.',
    detailed: 'Discrepancy: the Overview says enophthalmos "(not hypoglobus)", but the Baker and Pandrangi decks list hypoglobus among the early findings and indications for urgent and non-urgent repair, and clinically a large floor defect can cause both. Treat the Overview’s parenthesis as a simplification. Pearl: look at the soft-tissue windows of the CT for muscle position as well as bone.',
    concepts: ['enophthalmos'],
},
{
    id: 'q8', type: 'recall', section: 'Orbital Fractures',
    stem: 'List the indications for surgery in orbital fractures from the Baker deck.',
    answer: `• Entrapment
• Oculocardiac reflex
• Immediate enophthalmos
• Fracture of 50% of the floor or medial wall, or 2 cm (risk of late enophthalmos)
• Inferior rectus height-to-width ratio greater than 1 on imaging
• Roof "blow-in" fractures — exophthalmos, superior rectus entrapment, levator dysfunction (with oculoplastics)`,
    brief: 'Entrapment, oculocardiac reflex, immediate enophthalmos, large defects (about 50% or 2 cm), a rounded inferior rectus, and blow-in roof fractures.',
    detailed: 'The inferior rectus ratio reflects muscle herniation: a muscle that has changed from flat to round on coronal CT is displaced into the defect. Pearl: small defects without entrapment, with good motility and no early enophthalmos, can be observed.',
    concepts: ['surgical-indications'],
},
{
    id: 'q9', type: 'mcq', section: 'Orbital Fractures',
    stem: 'A patient with an orbital floor fracture develops bradycardia, nausea, and syncope on attempted upgaze. What is this, and what is the implication?',
    options: [
        { id: 'a', text: 'Cavernous sinus syndrome; MRI'  },
        { id: 'b', text: 'Retrobulbar hematoma; canthotomy'  },
        { id: 'c', text: 'Vasovagal reaction; no action'  },
        { id: 'd', text: 'Oculocardiac reflex from entrapped muscle; if nonresolving it is an emergency indication for repair'  },
    ],
    correct: 'd',
    brief: 'Oculocardiac reflex with entrapment: bradycardia, heart block, nausea or vomiting, syncope; nonresolving means emergent repair.',
    detailed: 'Traction on the extraocular muscle causes a trigeminal-to-vagal reflex. It is most characteristic of children with trapdoor fractures. Pearl: unexplained nausea and vomiting after periorbital trauma in a child should prompt an orbital CT, even if the globe looks normal.',
    concepts: ['entrapment', 'orbital-emergencies'],
},
{
    id: 'q10', type: 'mcq', section: 'Orbital Fractures',
    stem: 'A roof "blow-in" fracture has pushed bone into the orbit. Which findings are typical?',
    options: [
        { id: 'a', text: 'Trismus'  },
        { id: 'b', text: 'Enophthalmos and inferior rectus entrapment'  },
        { id: 'c', text: 'Telecanthus and epiphora'  },
        { id: 'd', text: 'Exophthalmos, superior rectus entrapment, and levator dysfunction'  },
    ],
    correct: 'd',
    brief: 'Roof blow-in reduces orbital volume: exophthalmos, superior rectus entrapment, levator dysfunction.',
    detailed: 'Management involves oculoplastics and often neurosurgery because of the frontal bone and anterior cranial fossa. Pearl: volume decreases here, so the globe goes forward, the opposite of a floor blowout.',
    concepts: ['roof-fractures'],
},

{
    id: 'q32', type: 'mcq', section: 'Orbital Fractures',
    stem: 'A CT volumetric comparison shows a 3 mL increase in orbital volume after a floor and medial wall fracture. About how much enophthalmos is expected?',
    options: [
        { id: 'a', text: 'Under 1 mm'  },
        { id: 'b', text: 'About 2.5 to 3 mm, above the 2 mm surgical threshold'  },
        { id: 'c', text: 'About 8 to 10 mm'  },
        { id: 'd', text: 'None; volume changes alter only the vertical globe position'  },
    ],
    correct: 'b',
    brief: 'Each 1 mL of added orbital volume gives roughly 0.8 to 1.0 mm of enophthalmos.',
    detailed: 'Three milliliters at 0.8 to 1.0 mm per mL predicts about 2.4 to 3 mm, so it crosses the early enophthalmos > 2 mm indication. Caveat: the per-mL value is an empiric average; Kolk et al. (J Oral Maxillofac Surg 2007, doi 10.1016/j.joms.2006.06.269) measured 0.93 mm per cm³ in 36 postoperative enophthalmic orbits, a selected group with failed or incomplete reconstruction, so the slope may not transfer to the acute injury, and it varies with where the volume is added (the posteromedial bulge counts more). Edema masks enophthalmos early. Pearl: volume increase is what you correct with the implant, not the bone defect size alone.',
    concepts: ['enophthalmos', 'surgical-indications'],
},

// ════════════════ TIMING, APPROACHES & REPAIR ════════════════

{
    id: 'q11', type: 'recall', section: 'Timing, Approaches & Repair',
    stem: 'Sort orbital fracture repair into emergent, urgent, and non-urgent indications.',
    answer: `Emergent:
• Partial or complete visual loss from direct or indirect optic nerve trauma
• Severely raised intraocular pressure
• Acute space-occupying lesion (retrobulbar hematoma, emphysema)
• Severe shift of orbital contents
• Entrapment of eye muscle, especially pediatric
• Severe nasal or oral bleeding
• Nonresolving oculocardiac reflex with entrapment

Urgent:
• Early enophthalmos or hypoglobus
• "White-eyed" floor fracture with entrapment (minimal soft-tissue trauma, children)

Non-urgent:
• Symptomatic diplopia, enophthalmos, hypoglobus`,
    brief: 'Threats to vision or reflexes are emergent; early globe malposition and white-eyed entrapment are urgent; the rest can wait for swelling to resolve.',
    detailed: 'The Baker deck lists only the nonresolving oculocardiac reflex under emergent; the Pandrangi deck lists the full AO-derived emergent set, which is keyed here. Pearl: the white-eyed blowout looks deceptively benign (no chemosis or ecchymosis) yet carries ischemic risk to the entrapped muscle.',
    concepts: ['timing', 'orbital-emergencies'],
},
{
    id: 'q12', type: 'mcq', section: 'Timing, Approaches & Repair',
    stem: 'Retrobulbar hematoma with severe pain, proptosis, and a decreasing visual acuity: what immediate action is standard?',
    options: [
        { id: 'a', text: 'Wait for CT, then discuss repair'  },
        { id: 'b', text: 'Immediate lateral canthotomy and cantholysis (added), with ophthalmology'  },
        { id: 'c', text: 'Elective orbital floor repair at 2 weeks'  },
        { id: 'd', text: 'Observation with ice'  },
    ],
    correct: 'b',
    brief: 'An acute compartment syndrome of the orbit is a clinical diagnosis and an emergency.',
    detailed: 'Added: the decks list acute space-occupying lesions (retrobulbar hematoma, emphysema) and increased IOP as emergent indications but do not describe the procedure. The treatment for an acute orbital compartment syndrome is decompression: lateral canthotomy and inferior cantholysis. Pearl: do not delay for imaging when vision is declining.',
    concepts: ['orbital-emergencies'],
},
{
    id: 'q13', type: 'mcq', section: 'Timing, Approaches & Repair',
    stem: 'Which pair correctly names the characteristic risk of each approach to the orbital floor?',
    options: [
        { id: 'a', text: 'Subciliary (cutaneous): ectropion; transconjunctival: entropion'  },
        { id: 'b', text: 'Both: ectropion'  },
        { id: 'c', text: 'Both: entropion'  },
        { id: 'd', text: 'Subciliary (cutaneous): entropion; transconjunctival: ectropion'  },
    ],
    correct: 'a',
    brief: 'Cutaneous approaches risk ectropion; transconjunctival approaches risk entropion.',
    detailed: 'The subciliary approach divides skin and orbicularis, so scarring of the anterior lamella pulls the lid down. The transconjunctival approach (preseptal or postseptal) leaves the skin intact but can scar the posterior lamella, rolling the lid in. Pearl: a lateral canthotomy extension increases exposure at the cost of lid-position risk.',
    concepts: ['lid-approaches'],
},
{
    id: 'q14', type: 'recall', section: 'Timing, Approaches & Repair',
    stem: 'List the materials used for orbital reconstruction and the complications of orbital floor repair in the Baker deck.',
    answer: `Materials: cartilage, bone, Teflon, PDS, titanium

Complications:
• Ectropion, entropion
• Diplopia, malposition
• V2 deficit
• Hematoma, blindness`,
    brief: 'Autologous (cartilage, bone) or alloplastic (PDS, titanium, Teflon) implants; the dreaded complications are diplopia, hematoma, and blindness.',
    detailed: 'Intraoperative CT, where available, is listed as a pearl: it confirms implant position. Pearl: the posterior ledge of the floor, the orbital apex proximity, and the infraorbital nerve at the canal are the points of risk.',
    concepts: ['materials', 'repair-complications'],
},

{
    id: 'q33', type: 'recall', section: 'Timing, Approaches & Repair',
    stem: 'List the features of a retrobulbar hematoma and the sequence of treatment.',
    answer: `• Progressive proptosis, intense orbital pain, chemosis
• Ophthalmoplegia, mydriasis, decreasing visual acuity
• Intraocular pressure above about 40 mmHg

Treatment:
• Lateral canthotomy and inferior cantholysis at the bedside; do not delay for imaging
• If IOP stays elevated, emergent surgical orbital decompression`,
    brief: 'A tense, painful proptotic orbit with falling vision is an orbital compartment syndrome: decompress at the bedside first.',
    detailed: 'Bleeding into the closed orbit raises pressure above the perfusion pressure of the optic nerve and retina, and vision can be lost irreversibly if it is not relieved promptly. Pearl: cantholysis is complete only when the lower lid falls free from the orbital rim; recheck vision and pressure afterwards. Caveat: the 40 mmHg threshold is from the AO text alone; the diagnosis is clinical, so do not wait for a measurement when vision is falling.',
    concepts: ['retrobulbar-hematoma', 'orbital-emergencies'],
},
{
    id: 'q34', type: 'mcq', section: 'Timing, Approaches & Repair',
    stem: 'When should a pediatric trapdoor fracture with a trapped inferior rectus be released?',
    options: [
        { id: 'a', text: 'After 2 weeks, when swelling has settled'  },
        { id: 'b', text: 'At 7 to 10 days, as for an adult blowout'  },
        { id: 'c', text: 'Only if diplopia persists at 6 weeks'  },
        { id: 'd', text: 'Within 24 hours, as a surgical emergency'  },
    ],
    correct: 'd',
    brief: 'A trapped muscle is ischemic: release within 24 hours to limit permanent restrictive diplopia.',
    detailed: 'Elastic pediatric bone springs open and snaps shut on the herniated muscle and periorbita, so the eye is white and quiet but the upgaze is lost, with nausea, vomiting, and possible bradycardia from the oculocardiac reflex. Gerbino et al. (J Oral Maxillofac Surg 2010, doi 10.1016/j.joms.2009.12.037) found residual diplopia in 1 of 12 repaired within 24 hours, 3 of 8 at 24 to 96 hours, and 4 of 4 after 96 hours. Caveat: this is a 24-patient retrospective series without a comparison group, and later presentation may also mark more severe entrapment, so the dose-response is suggestive, not causal. Discrepancy: q11 follows the Pandrangi deck and classes white-eyed entrapment as urgent; the AO text and this series call it an emergency within 24 hours. Treat any nonresolving oculocardiac reflex as emergent in either scheme.',
    concepts: ['trapdoor', 'timing', 'entrapment'],
},

// ════════════════ NASO-ORBITO-ETHMOID FRACTURES ════════════════

{
    id: 'q15', type: 'mcq', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'Which structures constitute the naso-orbito-ethmoid (NOE) region, and what clinical findings suggest NOE injury?',
    options: [
        { id: 'a', text: 'Frontal sinus and parietal bone; Battle sign'  },
        { id: 'b', text: 'Maxilla, zygoma, and mandible; trismus'  },
        { id: 'c', text: 'Nose, orbit, ethmoids, frontal sinus base, and the floor of the anterior cranial base; CSF rhinorrhea and telecanthus'  },
        { id: 'd', text: 'Nasal bone and septum only; epistaxis'  },
    ],
    correct: 'c',
    brief: 'NOE = nose, orbit, ethmoids, frontal sinus, anterior skull base, with the medial canthal tendon insertion.',
    detailed: 'Findings: CSF rhinorrhea, telecanthus, a flattened nasal dorsum, and an avulsed canthal tendon. Pearl: because the cribriform and fovea are close, NOE fractures carry a CSF leak risk.',
    concepts: ['noe-anatomy', 'noe-complications'],
},
{
    id: 'q16', type: 'mcq', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'The normal intercanthal distance (ICD) is about 30 to 35 mm. What other measurements does the deck relate it to?',
    options: [
        { id: 'a', text: 'Half the interpupillary distance (about 60 mm), and the width of the alar base'  },
        { id: 'b', text: 'Equal to the interpupillary distance'  },
        { id: 'c', text: 'Twice the alar base'  },
        { id: 'd', text: 'One third of the bizygomatic width'  },
    ],
    correct: 'a',
    brief: 'ICD 30 to 35 mm, about half the IPD (about 60 mm), roughly equal to the alar base width.',
    detailed: 'A true ICD above this range (telecanthus) after trauma means the medial canthal tendon has been displaced or avulsed. Do not confuse telecanthus with hypertelorism (wide interorbital bony distance) or with an increased interpupillary distance. Pearl: the ICD is often normal in the first hours because edema masks it, so compare with pre-injury photographs.',
    concepts: ['telecanthus'],
},
{
    id: 'q17', type: 'mcq', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'How is medial canthal tendon avulsion tested at the bedside?',
    options: [
        { id: 'a', text: 'Schirmer test'  },
        { id: 'b', text: 'Swinging flashlight test'  },
        { id: 'c', text: 'Pinch test: place a hemostat on the tendon intranasally and palpate for motion of the canthus with traction'  },
        { id: 'd', text: 'Forced duction test'  },
    ],
    correct: 'c',
    brief: 'Pinch (bimanual) test: intranasal instrument at the tendon insertion while palpating the canthus; free motion means a free bone fragment or avulsed tendon.',
    detailed: 'The deck names the "pinch test" and "hemostat at MCT intranasally." Added: with the tendon attached to a bone fragment, the canthus moves with the fragment; in avulsion, traction moves the lid without bone. Pearl: examination under anesthesia is more reliable than in the awake, swollen patient.',
    concepts: ['telecanthus'],
},
{
    id: 'q18', type: 'recall', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'State the Markowitz NOE types and what distinguishes them.',
    answer: `• Type I — single large central fragment bearing the medial canthal tendon
• Type II — comminuted central fragment, but the tendon remains attached to a fragment large enough to fixate
• Type III — severe comminution with the tendon detached from bone

Notes: type II often has nasolacrimal duct injury; types II and III are hard to separate on CT; 3D reconstruction helps`,
    brief: 'The type depends on the medial canthal tendon: attached to one large piece (I), to a fragment (II), or avulsed (III).',
    detailed: 'Type I often involves the nasal bone and frontal sinus and carries a CSF leak risk. Pearl: because the plan depends on what the tendon is attached to, the exam and intraoperative findings can change the type you assigned from CT.',
    concepts: ['noe-types'],
},
{
    id: 'q19', type: 'mcq', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'Match the repair to the type: which technique is described for a type II NOE fracture?',
    options: [
        { id: 'a', text: 'Closed treatment with nasal packing'  },
        { id: 'b', text: 'Transnasal wiring through a hole drilled posterior and superior to the lacrimal fossa, with plating of comminuted bone'  },
        { id: 'c', text: 'Miniplate fixation of the single fragment'  },
        { id: 'd', text: 'Identify the tendon and perform transnasal suspension'  },
    ],
    correct: 'b',
    brief: 'Type I: miniplates; type II: transnasal wiring of the fragment with plating; type III: identify the tendon and suspend it transnasally.',
    detailed: 'The 2017 deck gives the supporting adjuncts: plating for poor support of the nasal dorsum, bone graft if comminuted, and wiring for telecanthus. The hole is drilled posterior and superior to the lacrimal fossa so the vector pulls the canthus back and up. Pearl: overcorrect slightly, because the canthus drifts laterally.',
    concepts: ['noe-repair'],
},
{
    id: 'q20', type: 'mcq', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'Which exposure options does the Baker deck list for NOE repair?',
    options: [
        { id: 'a', text: 'Only transnasal endoscopic'  },
        { id: 'b', text: 'Only the Keen approach'  },
        { id: 'c', text: 'Only submental'  },
        { id: 'd', text: 'Existing laceration, direct incisions, coronal, orbital, and sublabial approaches'  },
    ],
    correct: 'd',
    brief: 'Laceration, direct incisions, coronal, orbital, sublabial.',
    detailed: 'The coronal approach is used for wide exposure of the nasofrontal region and for calvarial bone graft harvest. Pearl: use an existing laceration when it already exposes the injury.',
    concepts: ['noe-approaches'],
},

{
    id: 'q35', type: 'mcq', section: 'Naso-Orbito-Ethmoid Fractures',
    stem: 'In a type III NOE fracture, where must the transnasal canthopexy wire or suture be anchored, and what happens if the vector is placed anteriorly?',
    options: [
        { id: 'a', text: 'Anterior and inferior to the anterior lacrimal crest; the eyelid tightens against the globe'  },
        { id: 'b', text: 'Straight across at the level of the anterior lacrimal crest; no consequence'  },
        { id: 'c', text: 'Posterior and superior to the posterior lacrimal crest; an anterior vector rounds the canthus, recreates telecanthus, and loses lid-to-globe apposition'  },
        { id: 'd', text: 'At the contralateral lateral orbital tubercle; the intercanthal distance is unaffected'  },
    ],
    correct: 'c',
    brief: 'Pull the tendon posteriorly and superiorly, behind the posterior lacrimal crest, to restore the natural canthal angle.',
    detailed: 'The medial canthal tendon normally wraps around the lacrimal sac fossa and keeps the lid against the globe, so the restoring vector is back and up. A wire passed through the contralateral nasal bone or an equivalent anchor, set under tension, pulls the tendons toward each other, which is why overcorrection is deliberate (see q19). Caveat: the AO text lists lateral eyelid laxity and epiphora from lacrimal pump failure as consequences of an anterior vector; the rounded canthus and telecanthus are well supported, the laxity and pump failure are single-source. It also gives a target intercanthal distance of 30 to 32 mm and equates the normal with the palpebral fissure width; the module’s 30 to 35 mm (q16) is keyed.',
    concepts: ['canthopexy', 'noe-repair', 'telecanthus'],
},

// ════════════════ APEX & FISSURE SYNDROMES ════════════════

{
    id: 'q21', type: 'recall', section: 'Apex & Fissure Syndromes',
    stem: 'List the structures affected in orbital apex syndrome.',
    answer: `• Optic nerve (CN II)
• Oculomotor nerve (CN III)
• Trochlear nerve (CN IV)
• Abducens nerve (CN VI)
• Ophthalmic division of the trigeminal nerve (V1)`,
    brief: 'Orbital apex syndrome is the superior orbital fissure syndrome plus the optic nerve.',
    detailed: 'Visual loss distinguishes it from the fissure syndrome. Causes include trauma, neoplasm, infection (mucormycosis, aspergillosis), and inflammation. Pearl: visual loss plus ophthalmoplegia after trauma is an apex or traumatic optic neuropathy until proven otherwise.',
    concepts: ['apex-syndrome'],
},
{
    id: 'q22', type: 'mcq', section: 'Apex & Fissure Syndromes',
    stem: 'Rochon-Duvigneaud syndrome is another name for which entity, and how does it differ from orbital apex syndrome?',
    options: [
        { id: 'a', text: 'Tolosa-Hunt syndrome: adds headache'  },
        { id: 'b', text: 'Orbital apex syndrome: identical'  },
        { id: 'c', text: 'Cavernous sinus syndrome: adds Horner and V2'  },
        { id: 'd', text: 'Superior orbital fissure syndrome: CN III, IV, VI, and V1 without optic nerve involvement'  },
    ],
    correct: 'd',
    brief: 'Rochon-Duvigneaud = superior orbital fissure syndrome; vision is spared.',
    detailed: 'The deck equates the two names. The structures passing through the fissure are III, IV, V1, and VI (plus the ophthalmic veins), so the optic canal, which carries CN II, is the discriminator. Pearl: this is why a fracture at the lateral wall near the greater wing can produce ophthalmoplegia and forehead numbness with normal vision.',
    concepts: ['sof-syndrome'],
},
{
    id: 'q23', type: 'mcq', section: 'Apex & Fissure Syndromes',
    stem: 'Which finding places the lesion in the cavernous sinus rather than at the orbital apex?',
    options: [
        { id: 'a', text: 'Proptosis alone'  },
        { id: 'b', text: 'Involvement of the maxillary division (V2) and sympathetic fibers, with the optic nerve spared'  },
        { id: 'c', text: 'Optic nerve loss'  },
        { id: 'd', text: 'Isolated CN VI palsy'  },
    ],
    correct: 'b',
    brief: 'Cavernous sinus syndrome: the apex pattern without CN II but with V2 and sympathetic involvement.',
    detailed: 'The Baker deck frames it as orbital apex syndrome without CN II but with sympathetic fibers and the maxillary division of V. V2 runs in the lateral wall of the cavernous sinus but not through the superior orbital fissure. Pearl: V2 numbness is the clinical clue that the lesion has left the orbit.',
    concepts: ['cavernous-sinus'],
},
{
    id: 'q24', type: 'recall', section: 'Apex & Fissure Syndromes',
    stem: 'State the features of Tolosa-Hunt syndrome from the deck.',
    answer: `• Unilateral headache
• Granulomatous inflammation of the cavernous sinus, superior orbital fissure, or orbit on MRI or biopsy
• Palsy of one or more of CN III, IV, VI on the same side
• Palsies follow the headache within 2 weeks or appear with it; headache localized around the eye on the same side
• Not better explained by another headache cause
• About 1 in 1,000,000 per year; mean age about 41; about 5% bilateral`,
    brief: 'A painful ophthalmoplegia from granulomatous inflammation, a diagnosis of exclusion.',
    detailed: 'Added: it classically responds to corticosteroids within days, which is both therapeutic and a supportive criterion. Pearl: do not apply the label before excluding neoplasm, infection, vascular and traumatic causes.',
    concepts: ['tolosa-hunt'],
},

// ════════════════ CASES ════════════════

{
    id: 'q25', type: 'mcq', section: 'Cases',
    stem: 'A 9-year-old was struck by a baseball. The eye looks white and quiet with minimal swelling. He cannot look up, vomits twice, and his heart rate is 48. CT shows a small trapdoor floor fracture with the inferior rectus herniated. What is this and how urgent is it?',
    options: [
        { id: 'a', text: 'A white-eyed blowout with entrapment and oculocardiac reflex: emergent repair if not resolving'  },
        { id: 'b', text: 'A concussion; observe'  },
        { id: 'c', text: 'Orbital apex syndrome; steroids'  },
        { id: 'd', text: 'A retrobulbar hematoma; canthotomy'  },
    ],
    correct: 'a',
    brief: 'White-eyed blowout with entrapment and oculocardiac reflex: emergent.',
    detailed: 'Minimal soft-tissue trauma with muscle entrapment in a child is classically deceptive. Bradycardia, vomiting, and syncope are the oculocardiac reflex; a nonresolving reflex is an emergent indication. Pearl: do not attribute the vomiting to a concussion until the orbit is excluded.',
    concepts: ['case-blowout', 'entrapment', 'timing'],
},
{
    id: 'q26', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Which approach and risk apply if you choose a transconjunctival route to the floor?',
    options: [
        { id: 'a', text: 'Coronal; risk of hollowing'  },
        { id: 'b', text: 'Sublabial; risk of entropion'  },
        { id: 'c', text: 'Transconjunctival, preseptal or postseptal; risk of entropion, with no skin scar'  },
        { id: 'd', text: 'Subciliary; risk of entropion'  },
    ],
    correct: 'c',
    brief: 'Transconjunctival avoids a skin scar; its characteristic risk is entropion.',
    detailed: 'Cutaneous (subciliary) approaches risk ectropion. In a child, an absorbable or thin implant, or release of the entrapped muscle without a large implant, is used (materials in the deck: cartilage, bone, PDS, titanium). Pearl: confirm free forced duction at the end.',
    concepts: ['case-blowout', 'lid-approaches'],
},
{
    id: 'q27', type: 'mcq', section: 'Cases',
    stem: 'A 35-year-old was struck in the nasal root by a steering wheel. He has a flattened nasal dorsum, clear rhinorrhea, and an intercanthal distance of 44 mm, with a normal interpupillary distance. What is abnormal and what does it suggest?',
    options: [
        { id: 'a', text: 'Telecanthus (ICD above 30 to 35 mm): medial canthal tendon displacement or avulsion, with CSF leak risk' },
        { id: 'b', text: 'Hypertelorism: congenital' },
        { id: 'c', text: 'Normal findings' },
        { id: 'd', text: 'Enophthalmos from a floor fracture' },
    ],
    correct: 'a',
    brief: 'An ICD of 44 mm is telecanthus; with rhinorrhea and a flat dorsum it indicates NOE injury.',
    detailed: 'Normal ICD is 30 to 35 mm, about half the IPD (about 60 mm) and about the alar base width. Clear rhinorrhea raises concern for CSF leak. Pearl: test the tendon (pinch test) and obtain 3D CT reconstructions.',
    concepts: ['case-noe', 'telecanthus', 'noe-anatomy'],
},
{
    id: 'q28', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) CT shows comminution of the central fragment and the tendon not attached to any identifiable bone at surgery. What type and what repair?',
    options: [
        { id: 'a', text: 'Type III; identify the tendon and perform transnasal canthal suspension, with bone graft and dorsal support as needed'  },
        { id: 'b', text: 'Closed reduction with packing'  },
        { id: 'c', text: 'Type I; miniplate the fragment'  },
        { id: 'd', text: 'Type II; transnasal wiring of the fragment'  },
    ],
    correct: 'a',
    brief: 'Detached tendon on comminuted bone: type III, canthopexy by transnasal suspension.',
    detailed: 'The coronal approach gives wide exposure. Type II and III are hard to tell apart on CT, which is why the intraoperative finding decides. Plate or graft the dorsum if support is poor; manage the CSF leak with the neurosurgical team. Pearl: the wire must pass posterior and superior to the lacrimal fossa to restore the vector.',
    concepts: ['case-noe', 'noe-types', 'noe-repair'],
},
{
    id: 'q29', type: 'mcq', section: 'Cases',
    stem: 'A 40-year-old falls from a ladder and strikes the lateral brow. He has no light perception in the right eye, a fixed dilated pupil, ptosis, and no eye movement; forehead numbness is present. Which diagnosis and urgency?',
    options: [
        { id: 'a', text: 'Cavernous sinus syndrome: elective MRI'  },
        { id: 'b', text: 'Isolated CN III palsy; observation'  },
        { id: 'c', text: 'Orbital apex syndrome with traumatic optic neuropathy: emergent evaluation by ophthalmology and imaging, with decompression decisions'  },
        { id: 'd', text: 'White-eyed blowout; urgent in 1 week'  },
    ],
    correct: 'c',
    brief: 'Visual loss plus ophthalmoplegia and V1 numbness is apex syndrome; vision loss makes it emergent.',
    detailed: 'CN II, III, IV, VI, and V1 are involved. The Baker deck lists visual loss from direct or indirect optic nerve trauma among the emergent indications. Pearl: a normal CT does not exclude traumatic optic neuropathy; document the afferent defect before any treatment.',
    concepts: ['case-apex', 'apex-syndrome', 'orbital-emergencies'],
},
{
    id: 'q30', type: 'mcq', section: 'Cases',
    stem: '(Same patient, hypothetical variant.) Vision is normal but he has ophthalmoplegia, ptosis, and forehead numbness. What changes?',
    options: [
        { id: 'a', text: 'Tolosa-Hunt syndrome by definition'  },
        { id: 'b', text: 'This is a superior orbital fissure (Rochon-Duvigneaud) pattern: III, IV, VI, and V1 without CN II'  },
        { id: 'c', text: 'Cavernous sinus syndrome because of forehead numbness'  },
        { id: 'd', text: 'Orbital apex syndrome unchanged'  },
    ],
    correct: 'b',
    brief: 'Same nerves minus the optic nerve: superior orbital fissure syndrome.',
    detailed: 'Cavernous sinus involvement would add V2 numbness or sympathetic signs. Tolosa-Hunt needs a painful granulomatous process and exclusion of trauma. Pearl: the optic nerve status separates apex from fissure syndromes at the bedside.',
    concepts: ['case-apex', 'sof-syndrome'],
},
{
    id: 'q36', type: 'mcq', section: 'Cases',
    stem: 'A 45-year-old was struck in the right orbit 10 days ago. Swelling has settled. Hertel exophthalmometry shows 3 mm of enophthalmos compared with the left, and he has diplopia on down-gaze. CT shows a posteromedial floor and medial wall defect of about 2.5 cm² with the inferior rectus sitting within it but moving normally on forced duction. What is the best interpretation?',
    options: [
        { id: 'a', text: 'Observe: diplopia on down-gaze alone is not an indication'  },
        { id: 'b', text: 'Emergent release, as for a trapdoor fracture'  },
        { id: 'c', text: 'Urgent lateral canthotomy for retrobulbar hematoma'  },
        { id: 'd', text: 'Reconstruction is indicated: a defect of 2 cm² or more, enophthalmos above 2 mm, and about 3 to 4 mL of expansion to correct'  },
    ],
    correct: 'd',
    brief: 'A large posteromedial defect with early enophthalmos above 2 mm predicts more, and the volume must be restored.',
    detailed: 'Three millimeters at 0.8 to 1.0 mm per mL implies roughly 3 to 3.75 mL of added volume (q32). A defect over 50% of the floor or 2 cm², persistent diplopia in down-gaze, and enophthalmos above 2 mm each independently support repair (q8). Forced duction that moves freely argues against entrapment, so this is non-urgent repair rather than a release. Pearl: the timing is days to two weeks, after edema resolves enough to measure enophthalmos honestly.',
    concepts: ['case-floor', 'enophthalmos', 'surgical-indications'],
},
{
    id: 'q37', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) At surgery through a transconjunctival approach, which implant placement and risk apply?',
    options: [
        { id: 'a', text: 'Seat the implant posteriorly on the inferomedial strut to restore volume; risk of entropion'  },
        { id: 'b', text: 'Place the implant only along the anterior floor; risk of ectropion'  },
        { id: 'c', text: 'Leave the medial wall unrepaired; the floor implant restores the volume'  },
        { id: 'd', text: 'Insert a thick block into the maxillary sinus to support the globe'  },
    ],
    correct: 'a',
    brief: 'Rest the implant on the posterior ledge (inferomedial strut) so the posteromedial bulge is corrected; transconjunctival risk is entropion.',
    detailed: 'An implant that stops short of the strut leaves the posteromedial volume uncorrected, so enophthalmos persists. The same defect that includes the medial wall needs medial wall coverage, because the volume expansion comes from both. Subciliary approaches risk ectropion instead (q13). Pearl: intraoperative imaging or a forced duction test after placement confirms position and free motion (Baker deck).',
    concepts: ['case-floor', 'orbital-floor-anatomy', 'lid-approaches'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
