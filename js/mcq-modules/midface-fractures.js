/* =================================================================
   Midface Fractures: Buttresses, Le Fort, Nasal, Zygomaticomaxillary
   OKSAT · Facial Plastics & Recon Module
   ================================================================= */
/* Sources: the owner's resident-review decks (slide order and
   content): "Midface Trauma" (B. Scott), "Resident Review: Midface
   Fractures" (3/20/2017), "Mandible and Midface Trauma" (08-2022,
   ZMC section), "ZMC and Mandible Trauma" (09-2018), "All of Facial
   Trauma" (Facial Trauma Overview), and "PGY-2 Trauma Crash Course"
   (KLS Martin, nasal fracture slide). The decks point to the AO
   Foundation Surgery Reference (CMF); the owner will add AO content
   later. NOE and orbital fractures are in the separate
   orbit-noe-trauma module.
   No figures: the decks' images are unlabeled screenshots, CT
   studies, or manufacturer slides; none is used.
   Discrepancy policy: the highest-ranked source is keyed;
   disagreements and "added" (standard teaching not in the decks) or
   deck-only claims are named in the explanation under Discrepancy:
   or Caveat:. Nothing here is clinically verified; the owner sets
   that. */

const meta = {
    title: 'Midface\nFractures',
    subtitle:
        'Facial buttresses, Le Fort I to III, nasal bone fractures, the zygomaticomaxillary complex and arch, Gillies and Keen approaches, closed reduction and one- to four-point fixation, and three integrating cases.',
    kicker: 'Self-Assessment · Facial Plastics & Recon Module',
    id: 'midface-fractures',
    sources: [
        'Resident review decks (owner): Midface Trauma (Scott); Resident Review Midface Fractures 2017 (Moneta); Mandible and Midface Trauma 08-2022; ZMC and Mandible Trauma 09-2018; All of Facial Trauma; PGY-2 Trauma Crash Course (KLS Martin)',
        'AO Foundation Surgery Reference, craniomaxillofacial trauma (referenced by the decks; the owner will add content)',
        'Claims marked "added" (Keen approach, coronoid impingement, septal hematoma, Le Fort mobility testing) are standard teaching not stated in the decks; unvetted',
    ],
};

const DOMAINS = {
    buttresses: { label: 'Buttresses & Occlusion',  color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    lefort:     { label: 'Le Fort Fractures',       color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    nasal:      { label: 'Nasal Bone Fractures',    color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    zmc:        { label: 'Zygomaticomaxillary Complex', color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    fixation:   { label: 'ZMC Reduction & Fixation', color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    cases:      { label: 'Cases',                   color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // buttresses & occlusion
    'vertical-buttresses':  { label: 'Vertical Buttresses',          domain: 'buttresses' },
    'horizontal-buttresses':{ label: 'Horizontal Buttresses',        domain: 'buttresses' },
    'angle-class':          { label: 'Angle Classification',         domain: 'buttresses' },
    'occlusion-terms':      { label: 'Overjet, Overbite, Crossbite', domain: 'buttresses' },
    'fracture-patterns':    { label: 'Fracture Pattern Vocabulary',  domain: 'buttresses' },

    // le fort
    'lefort-1':             { label: 'Le Fort I',                    domain: 'lefort' },
    'lefort-2':             { label: 'Le Fort II',                   domain: 'lefort' },
    'lefort-3':             { label: 'Le Fort III',                  domain: 'lefort' },
    'lefort-exam':          { label: 'Le Fort Examination',          domain: 'lefort' },
    'lefort-goals':         { label: 'Le Fort Goals & Approaches',   domain: 'lefort' },
    'order-of-operation':   { label: 'Order of Operation',           domain: 'lefort' },

    // nasal
    'nasal-epi':            { label: 'Nasal Fracture Basics',        domain: 'nasal' },
    'nasal-timing':         { label: 'Nasal Fracture Timing',        domain: 'nasal' },
    'nasal-repair':         { label: 'Closed vs Open Repair',        domain: 'nasal' },

    // zmc
    'zygoma-anatomy':       { label: 'Zygoma Articulations',         domain: 'zmc' },
    'zmc-lines':            { label: 'ZMC Fracture Lines',           domain: 'zmc' },
    'zmc-orbit':            { label: 'Sphenozygomatic Alignment',    domain: 'zmc' },
    'zygomatic-arch':       { label: 'Isolated Arch Fractures',      domain: 'zmc' },
    'gillies':              { label: 'Gillies Approach',             domain: 'zmc' },
    'keen':                 { label: 'Keen Approach',                domain: 'zmc' },

    // fixation
    'zmc-closed':           { label: 'ZMC Closed Reduction',         domain: 'fixation' },
    'point-fixation':       { label: '1- to 4-Point Fixation',       domain: 'fixation' },
    'forced-duction':       { label: 'Forced Duction & Ophthalmology', domain: 'fixation' },
    'coronal':              { label: 'Coronal Approach Risks',       domain: 'fixation' },

    // cases
    'case-lefort':          { label: 'Case: Le Fort Pattern',        domain: 'cases' },
    'case-zmc':             { label: 'Case: ZMC Fracture',           domain: 'cases' },
    'case-arch':            { label: 'Case: Isolated Arch',          domain: 'cases' },
    'case-nasal':           { label: 'Case: Nasal Fracture',         domain: 'cases' },
};

const ITEMS = [

// ════════════════ BUTTRESSES & OCCLUSION ════════════════

{
    id: 'q1', type: 'recall', section: 'Buttresses & Occlusion',
    stem: 'Name the vertical buttresses of the midface and what each connects.',
    answer: `• Medial (nasomaxillary) — anterior maxillary alveolus to the frontal bone, paired
• Lateral (zygomaticomaxillary) — lateral maxillary alveolus to the zygomatic process of the temporal bone
• Posterior (pterygomaxillary) — maxilla to the sphenoid bone
• Also the ramus of the mandible (deck bracket)`,
    brief: 'Three vertical buttresses transmit chewing forces to the skull base; the mandibular ramus is a fourth in the deck.',
    detailed: 'These are the pillars that give vertical height to the midface and carry occlusal load upward. Restoring them restores facial height and projection. Pearl: Le Fort I sits below the buttress insertions, Le Fort II and III cross them, so higher Le Fort levels need more buttress repair.',
    concepts: ['vertical-buttresses'],
},
{
    id: 'q2', type: 'recall', section: 'Buttresses & Occlusion',
    stem: 'Name the horizontal buttresses, and the one the 2022 deck calls most important for AP position of the malar eminence.',
    answer: `• Frontal bar — superior orbital rims and the frontal bone between them
• Zygomatic arch, zygomatic bone, and inferior orbital rim — the most important; defines the AP position of the malar eminence
• Arch of the hard palate and arch of the mandible (angle, body, symphysis)`,
    brief: 'Horizontal buttresses set width and AP projection; the zygomatic arch to inferior orbital rim set malar position.',
    detailed: 'Vertical buttresses restore height; horizontal buttresses restore width and projection. A fixated vertical buttress with a collapsed horizontal one gives a face that is tall but flat or wide. Pearl: this is why the arch matters in ZMC fractures (see below).',
    concepts: ['horizontal-buttresses', 'zygomatic-arch'],
},
{
    id: 'q3', type: 'mcq', section: 'Buttresses & Occlusion',
    stem: 'Which statement about arch size and occlusion is correct?',
    options: [
        { id: 'a', text: 'The maxillary arch is larger, so maxillary teeth normally overlap the mandibular teeth'  },
        { id: 'b', text: 'The arches are equal; overjet is zero in normal occlusion'  },
        { id: 'c', text: 'Angle class II is a prognathic mandible'  },
        { id: 'd', text: 'The mandibular arch is larger, so mandibular teeth overlap the maxillary teeth'  },
    ],
    correct: 'a',
    brief: 'The maxillary dentoalveolar arch is the larger one; the upper teeth overlap the lower.',
    detailed: 'Added: the deck poses the question without a printed answer. Angle class I places the mesiobuccal cusp of the maxillary first molar in the buccal groove of the mandibular first molar; class II is the mandible retruded (distal); class III is the mandible protruded (mesial). Overjet is the horizontal incisor distance, overbite the vertical overlap, crossbite a mandibular tooth buccal to its maxillary counterpart. Pearl: in a midface fracture you are restoring the patient’s premorbid bite, so ask what it was.',
    concepts: ['angle-class', 'occlusion-terms'],
},
{
    id: 'q4', type: 'mcq', section: 'Buttresses & Occlusion',
    stem: 'The ED consults you for a mandible fracture. According to the Facial Trauma Overview, how should you approach the rest of the patient?',
    options: [
        { id: 'a', text: 'Because CT is unreliable for facial trauma'  },
        { id: 'b', text: 'Because facial fractures are all treated identically'  },
        { id: 'c', text: 'Because a full head and neck exam is needed, with special attention to vision, occlusion, sensation, and airway obstruction'  },
        { id: 'd', text: 'Because cribriform fractures never need surgery'  },
    ],
    correct: 'c',
    brief: 'Do a full head and neck exam; prioritize vision, occlusion, sensation, and airway.',
    detailed: 'The overview lists the pattern vocabulary: midface (Le Fort 1 to 3, NOE 1 to 3, palatoalveolar, nasal, orbit floor, roof, medial and lateral walls, combined; ZMC combination or isolated arch), mandible (parasymphysis and symphysis, body, angle and ramus, condyle), and cranial vault and skull base (frontal sinus anterior table, posterior table, recess; temporal bone; sphenoid; cribriform). Pearl: describe each fracture as open or closed, displaced or not, comminuted or not, then classify.',
    concepts: ['fracture-patterns'],
},

// ════════════════ LE FORT FRACTURES ════════════════

{
    id: 'q5', type: 'mcq', section: 'Le Fort Fractures',
    stem: 'A fracture extends from the pyriform aperture, along the lateral maxillary walls, and through the septum to the pterygoid plates, leaving a mobile tooth-bearing segment. Which is it, and what is its name?',
    options: [
        { id: 'a', text: 'Le Fort II, "pyramidal"'  },
        { id: 'b', text: 'Le Fort I, "floating palate"'  },
        { id: 'c', text: 'Le Fort III, "craniofacial dysjunction"'  },
        { id: 'd', text: 'Le Fort I, "pyramidal"'  },
    ],
    correct: 'b',
    brief: 'Le Fort I separates the teeth-bearing maxilla from the face: the floating palate.',
    detailed: 'The fracture runs horizontally above the tooth roots, through the pyriform aperture, lateral maxillary walls, septum, and the pterygoid plates. The segment is mobile, producing malocclusion. Pearl: a mobile tooth-bearing maxilla with an intact nasal bridge and orbit is Le Fort I until proven otherwise.',
    concepts: ['lefort-1'],
},
{
    id: 'q6', type: 'recall', section: 'Le Fort Fractures',
    stem: 'List the structures a Le Fort II ("pyramidal") fracture passes through.',
    answer: `• Nasofrontal junction
• Medial orbital wall (nasoorbitoethmoid area)
• Infraorbital rim
• Face of the maxilla, often through the infraorbital foramen
• Pterygoid plates

Notes: involves the orbit; must check occlusion; significant bleeding; CSF leak risk`,
    brief: 'Pyramidal: nasofrontal junction, medial orbit, infraorbital rim, maxillary face, pterygoid plates; the zygoma stays attached to the skull.',
    detailed: 'The apex of the pyramid is at the nasofrontal junction, the base at the tooth-bearing maxilla, so the nose and central face move as one piece with the palate. Because the fracture passes the ethmoid region, a CSF leak is possible and bleeding can be brisk. Pearl: infraorbital foramen involvement explains the cheek and upper-lip numbness.',
    concepts: ['lefort-2'],
},
{
    id: 'q7', type: 'recall', section: 'Le Fort Fractures',
    stem: 'List the seven structures crossed by a Le Fort III fracture.',
    answer: `• Nasofrontal junction
• Medial orbital wall
• Floor of the orbit
• Inferior orbital fissure
• Sphenozygomatic suture
• Frontozygomatic suture
• Zygomatic arch`,
    brief: 'Complete craniofacial dysjunction: the face separates from the skull base across the nasofrontal, orbital, and zygomatic lines.',
    detailed: 'The 2017 deck summarizes as nasofrontal, maxillofrontal, and zygomaticofrontal sutures plus the orbital walls. Pearl: Le Fort III is craniofacial dysjunction, so the zygoma moves with the face (unlike Le Fort II), and the lateral orbit through the greater wing is the key alignment to restore.',
    concepts: ['lefort-3'],
},
{
    id: 'q8', type: 'mcq', section: 'Le Fort Fractures',
    stem: 'A trauma patient has a mobile maxilla with the nasal bridge and medial canthi moving together on palpation, and a CT showing fracture through the infraorbital rim and infraorbital foramen. Which pattern?',
    options: [
        { id: 'a', text: 'Le Fort III'  },
        { id: 'b', text: 'Isolated ZMC'  },
        { id: 'c', text: 'Le Fort I'  },
        { id: 'd', text: 'Le Fort II'  },
    ],
    correct: 'd',
    brief: 'Infraorbital rim and foramen with nasal bridge movement: Le Fort II.',
    detailed: 'Le Fort I does not reach the orbit; Le Fort III crosses the zygomaticofrontal suture and arch; Le Fort II crosses the infraorbital rim and foramen and the nasofrontal junction. Added: the exam maneuver is to grasp the anterior maxilla and rock it while palpating the nasofrontal junction and infraorbital rim. Pearl: real injuries are often mixed or asymmetric, with a different Le Fort level on each side.',
    concepts: ['lefort-exam', 'lefort-2'],
},
{
    id: 'q9', type: 'mcq', section: 'Le Fort Fractures',
    stem: 'Which are the goals of Le Fort management in the 2022 and Midface decks?',
    options: [
        { id: 'a', text: 'Avoid all open reduction'  },
        { id: 'b', text: 'Maximize midface height, regardless of occlusion'  },
        { id: 'c', text: 'Achieve open bite for airway'  },
        { id: 'd', text: 'Restore preinjury occlusion and facial projection and width'  },
    ],
    correct: 'd',
    brief: 'Two goals: preinjury occlusion; facial projection and width.',
    detailed: 'Closed treatment is considered for minimal displacement, intact occlusion, and a compliant patient. Otherwise open treatment restores the buttresses. Pearl: the maxillomandibular occlusion is the reference you build the face around.',
    concepts: ['lefort-goals'],
},
{
    id: 'q10', type: 'recall', section: 'Le Fort Fractures',
    stem: 'List the common surgical approaches for Le Fort fractures and what each exposes.',
    answer: `• Sublabial — medial and lateral buttresses
• Coronal — nasofrontal junction, frontal bones, zygomaticofrontal, zygomatic arch
• Transconjunctival — orbital floor and rim
• Upper lid blepharoplasty — frontozygomatic suture`,
    brief: 'Sublabial for buttresses, coronal for upper face and arch, transconjunctival for floor and rim, blepharoplasty incision for the frontozygomatic suture.',
    detailed: 'The sublabial approach is the workhorse for Le Fort I and the lower buttresses; the coronal approach is needed for Le Fort III and for frontal and nasofrontal exposure. Pearl: pick the incision for the fracture lines you must see to verify reduction.',
    concepts: ['lefort-goals'],
},
{
    id: 'q11', type: 'mcq', section: 'Le Fort Fractures',
    stem: 'What is the general order of operation for open treatment of a Le Fort fracture in the 2022 deck?',
    options: [
        { id: 'a', text: 'Plate fractures, then place IMF, then expose'  },
        { id: 'b', text: 'Place IMF screws or arch bars, expose all fractures, place into MMF, plate fractures, then repair soft tissue'  },
        { id: 'c', text: 'Expose, plate, then place MMF'  },
        { id: 'd', text: 'Soft-tissue repair first to control bleeding'  },
    ],
    correct: 'b',
    brief: 'IMF devices, expose everything, MMF, plate, soft tissue.',
    detailed: 'Exposing every fracture before fixation lets you see which pieces move and avoid fixing a segment in the wrong position. MMF sets the occlusion that all the plating references. Pearl: a missed fracture that stays mobile will pull the construct out of position.',
    concepts: ['order-of-operation'],
},

// ════════════════ NASAL BONE FRACTURES ════════════════

{
    id: 'q12', type: 'mcq', section: 'Nasal Bone Fractures',
    stem: 'Which statement about nasal bone fractures is correct?',
    options: [
        { id: 'a', text: 'They are the most common facial fracture; repair is for cosmesis or obstruction'  },
        { id: 'b', text: 'They are repaired only before 3 hours or after 5 to 10 days, never in between'  },
        { id: 'c', text: 'They have no functional consequence'  },
        { id: 'd', text: 'They are rare and always need ORIF'  },
    ],
    correct: 'a',
    brief: 'Most common facial fracture; indications for repair are cosmesis and obstruction (function).',
    detailed: 'Added for the exam: the KLS crash course also lists septal hematoma under the nose exam. A septal hematoma needs drainage because it can lead to septal necrosis and saddle deformity. Pearl: examine the septum on every nasal injury.',
    concepts: ['nasal-epi'],
},
{
    id: 'q13', type: 'mcq', section: 'Nasal Bone Fractures',
    stem: 'The decks give two windows for nasal fracture repair. Which pair?',
    options: [
        { id: 'a', text: 'Under 3 hours, or 6 weeks'  },
        { id: 'b', text: 'Under 24 hours, or 3 to 4 weeks'  },
        { id: 'c', text: 'Under 3 hours, or 5 to 10 days after trauma'  },
        { id: 'd', text: 'Only after 6 weeks'  },
    ],
    correct: 'c',
    brief: 'Within 3 hours (before swelling), or 5 to 10 days (after swelling settles).',
    detailed: 'In the first hours edema has not obscured the contour; between hours and days, swelling makes it difficult to judge the reduction; by 5 to 10 days edema has settled but bone has not yet healed. Options are closed or open repair. Caveat: windows of 7 to 14 days are also taught; the decks agree on 5 to 10. Pearl: waiting too long (beyond about 2 weeks in adults) makes a closed reduction unreliable.',
    concepts: ['nasal-timing'],
},
{
    id: 'q14', type: 'mcq', section: 'Nasal Bone Fractures',
    stem: 'A 22-year-old has a deviated nose after a punch 6 days ago. Swelling has settled and he reports obstruction. What is appropriate?',
    options: [
        { id: 'a', text: 'Closed reduction now, within the 5 to 10 day window'  },
        { id: 'b', text: 'Wait 6 weeks for the bone to heal first'  },
        { id: 'c', text: 'Immediate open reduction with coronal approach'  },
        { id: 'd', text: 'Antibiotics only'  },
    ],
    correct: 'a',
    brief: 'Day 6, edema settled, functional complaint: closed reduction is within the window.',
    detailed: 'Both cosmetic deformity and nasal obstruction are indications. Open treatment is reserved for fractures that cannot be reduced or held closed, a deviated septum, or complex injuries (septorhinoplasty). Pearl: tell the patient that a residual deformity may need later septorhinoplasty.',
    concepts: ['nasal-timing', 'nasal-repair'],
},

// ════════════════ ZYGOMATICOMAXILLARY COMPLEX ════════════════

{
    id: 'q15', type: 'recall', section: 'Zygomaticomaxillary Complex',
    stem: 'With which bones does the zygoma articulate, and from which structure does the arch form?',
    answer: `Frontal view:
• Maxilla (medially)
• Frontal bone (superiorly)
• Greater wing of the sphenoid (posteriorly, within the orbit)

Lateral view:
• Temporal process of the zygoma + zygomatic process of the temporal bone = zygomatic arch`,
    brief: 'Maxilla, frontal, sphenoid (greater wing), and temporal (arch).',
    detailed: 'The zygoma maintains facial width and cheek prominence and forms much of the lateral orbit. Zygomaticus major and minor and part of orbicularis oculi attach anteriorly; the masseter attaches below to the arch and produces the inferior displacing force on the zygoma. Pearl: that masseter pull is why a ZMC fracture often resettles after a closed reduction.',
    concepts: ['zygoma-anatomy'],
},
{
    id: 'q16', type: 'mcq', section: 'Zygomaticomaxillary Complex',
    stem: 'A CT shows a fracture of the lateral orbital wall at the sphenozygomatic suture. Why is this suture used to judge reduction?',
    options: [
        { id: 'a', text: 'It is the only suture the coronal approach reaches'  },
        { id: 'b', text: 'It bears the masseter pull'  },
        { id: 'c', text: 'Alignment of the zygoma with the greater wing of the sphenoid in the lateral orbit confirms anatomic reduction of the orbital walls'  },
        { id: 'd', text: 'It is the thickest bone in the complex'  },
    ],
    correct: 'c',
    brief: 'The sphenozygomatic alignment is the key reduction check, and all ZMC fractures involve the orbit.',
    detailed: 'Reduction must reproduce the original structure of the complex and the alignment of the orbital walls. Proper lateral wall reduction requires the greater wing of the sphenoid and the zygoma to be aligned. The arch, which is not a true arch and is relatively straight centrally, sets facial width and AP projection. Pearl: if the SZ suture lines up and the arch is out, you have width wrong; if the arch is right and the SZ is off, you have orbital volume wrong.',
    concepts: ['zmc-orbit'],
},
{
    id: 'q17', type: 'recall', section: 'Zygomaticomaxillary Complex',
    stem: 'Describe the four fracture lines of a ZMC fracture in the Facial Trauma Overview, and the three sutures usually named.',
    answer: `1. Inferior orbital fissure along the zygomaticosphenoid suture to the zygomaticofrontal suture
2. Inferior orbital fissure along the orbital plate of the maxilla, across the infraorbital rim and anterior maxillary face, to the zygomaticomaxillary suture or buttress
3. Inferior orbital fissure along the infratemporal maxilla, passing anteriorly under the zygomaticomaxillary buttress
4. Zygomatic arch fracture

Sutures: ZF, ZS, ZM`,
    brief: 'ZMC fractures involve ZF, ZS, and ZM separations plus the arch (the fourth point).',
    detailed: 'The older "tripod" label describes ZF, ZM (infraorbital rim and buttress), and ZS separations; "tetrapod" adds the arch. All ZMC fractures involve the orbit. Pearl: whether the arch is broken determines whether you need a fourth exposure.',
    concepts: ['zmc-lines'],
},
{
    id: 'q18', type: 'mcq', section: 'Zygomaticomaxillary Complex',
    stem: 'A patient has pain, swelling, a palpable step-off over the arch and trismus, with no zygomaticofrontal or inferior orbital rim finding. What is the injury and why the trismus?',
    options: [
        { id: 'a', text: 'NOE fracture; telecanthus'  },
        { id: 'b', text: 'Isolated zygomatic arch fracture; the depressed arch can impinge on the coronoid process of the mandible (added)'  },
        { id: 'c', text: 'Le Fort I; maxillary mobility'  },
        { id: 'd', text: 'ZMC tripod; masseter spasm'  },
    ],
    correct: 'b',
    brief: 'Isolated arch: pain, contour change, trismus, and no rim or ZF findings.',
    detailed: 'The Facial Trauma Overview lists pain or swelling, a palpable step-off, and trismus. Surgical indications are malar asymmetry and trismus. Added: trismus is classically from medial displacement of the arch onto the coronoid or temporalis. Pearl: an arch fracture alone does not alter orbital volume, so look for enophthalmos only if other fractures coexist.',
    concepts: ['zygomatic-arch'],
},
{
    id: 'q19', type: 'recall', section: 'Zygomaticomaxillary Complex',
    stem: 'Describe the steps of the Gillies approach for zygomatic arch elevation.',
    answer: `• 2 to 3 cm incision, about 2.5 cm anterosuperior to the helix, behind the temporal hairline
• Dissect through superficial temporal fascia down to the temporalis fascia
• Insert the elevator deep to the temporalis fascia and over the temporalis muscle
• Carry the plane down to the medial aspect of the zygomatic arch
• Place the elevator medial to the arch, lever laterally, and palpate the reduction with the free hand`,
    brief: 'Temporal incision, elevator deep to temporalis fascia, lever the arch outward while palpating.',
    detailed: 'The plane deep to the temporalis fascia and superficial to the muscle keeps the elevator under the arch and away from the temporal branch of the facial nerve, which runs in the superficial temporal fascia. Pearl: you feel and often hear the arch snap into position; if it does not hold, it needs fixation.',
    concepts: ['gillies', 'zygomatic-arch'],
},
{
    id: 'q20', type: 'mcq', section: 'Zygomaticomaxillary Complex',
    stem: 'What is the Keen approach?',
    options: [
        { id: 'a', text: 'A temporal incision for arch elevation'  },
        { id: 'b', text: 'A transconjunctival approach to the orbital floor'  },
        { id: 'c', text: 'A coronal incision'  },
        { id: 'd', text: 'An intraoral (upper buccal sulcus) approach under the zygoma and cheek for elevating the zygomatic complex'  },
    ],
    correct: 'd',
    brief: 'Keen: intraoral elevation of the zygoma through the buccal sulcus; Gillies: temporal.',
    detailed: 'Added: the deck names the Keen and Gillies approaches without describing them. The Keen route passes through a buccal sulcus incision and under the zygoma; the Gillies route goes under the arch from the temporal region. Pearl: the Keen approach is preferred by some for the body of the zygoma, Gillies for the arch.',
    concepts: ['keen'],
},

// ════════════════ ZMC REDUCTION & FIXATION ════════════════

{
    id: 'q21', type: 'mcq', section: 'ZMC Reduction & Fixation',
    stem: 'Which is NOT a contraindication to closed reduction of a ZMC fracture?',
    options: [
        { id: 'a', text: 'A stable reduction cannot be achieved by closed technique'  },
        { id: 'b', text: 'Need for internal orbital reconstruction'  },
        { id: 'c', text: 'Displaced comminuted injury'  },
        { id: 'd', text: 'A displaced fracture amenable to a bone hook or Carroll-Girard screw'  },
    ],
    correct: 'd',
    brief: 'Bone hook or Carroll-Girard screw reduction is the indication; comminution, instability, and orbital reconstruction are contraindications.',
    detailed: 'The advantage is minimal invasiveness. Disadvantages: difficult assessment of reduction, redisplacement without hardware, and possible soft-tissue injury from poorly placed bone. Pearl: a fracture that does not hold after elevation has told you it needs fixation.',
    concepts: ['zmc-closed'],
},
{
    id: 'q22', type: 'mcq', section: 'ZMC Reduction & Fixation',
    stem: 'Which fixation scheme fits a displaced simple noncomminuted ZMC fracture with minimal separation of the zygomaticofrontal suture, where the bone snaps into place on reduction?',
    options: [
        { id: 'a', text: 'External pin fixation'  },
        { id: 'b', text: 'One-point fixation'  },
        { id: 'c', text: 'Closed reduction without fixation'  },
        { id: 'd', text: 'Four-point fixation with orbital reconstruction'  },
    ],
    correct: 'b',
    brief: 'One-point fixation: simple, minimally separated, stable once reduced; reduction is hard to assess at unseen sites.',
    detailed: 'Contraindications: displaced comminuted injury, stable reduction not achievable, and need for internal orbital reconstruction. Disadvantage: difficult assessment of reduction at the frontozygomatic, internal orbit, and arch. Pearl: the fewer points you expose, the more you depend on one point reading the whole bone correctly.',
    concepts: ['point-fixation'],
},
{
    id: 'q23', type: 'mcq', section: 'ZMC Reduction & Fixation',
    stem: 'Two-point fixation exposes the sphenozygomatic and frontozygomatic sutures and which other site?',
    options: [
        { id: 'a', text: 'The zygomaticomaxillary buttress (or alternatively the infraorbital rim)'  },
        { id: 'b', text: 'The zygomatic arch'  },
        { id: 'c', text: 'The orbital floor'  },
        { id: 'd', text: 'The coronoid process'  },
    ],
    correct: 'a',
    brief: 'Two-point: ZM buttress plus the frontozygomatic region; a second point may be the infraorbital rim.',
    detailed: 'Disadvantage: difficult assessment of the orbital floor, medial orbital wall, and arch. Pearl: the slide is internally loose (the sphenozygomatic suture is not seen from a frontozygomatic incision); take it as listing the sites you can verify.',
    concepts: ['point-fixation'],
},
{
    id: 'q24', type: 'recall', section: 'ZMC Reduction & Fixation',
    stem: 'List the points of exposure in three-point, three-point with orbital reconstruction, and four-point fixation, and what limits each.',
    answer: `• Three-point — infraorbital rim, SZ and FZ sutures, ZM buttress. Limit: orbital floor, medial wall, and arch unseen; not for extended orbital reconstruction
• Three-point with orbital reconstruction — adds internal orbit. Limit: arch fractures hard to assess; contraindicated if arch reduction is needed
• Four-point with orbital reconstruction — adds the zygomatic arch via a coronal approach. Use for complex fractures, or with frontal sinus or NOE fractures or calvarial graft harvest`,
    brief: 'Each added point improves verification of reduction at the cost of exposure.',
    detailed: 'Four-point exposure restores facial projection and width but costs a visible scar, operative time, temporal hollowing, and risk to the temporal branch of the facial nerve. Pearl: choose the minimum exposure that lets you see the lines that determine alignment.',
    concepts: ['point-fixation', 'coronal'],
},
{
    id: 'q25', type: 'mcq', section: 'ZMC Reduction & Fixation',
    stem: 'After reduction of a ZMC fracture, which test and which evaluation does the deck advise?',
    options: [
        { id: 'a', text: 'Brain MRI and visual evoked potentials'  },
        { id: 'b', text: 'Hertel exophthalmometry only before surgery'  },
        { id: 'c', text: 'Forced duction test to exclude entrapment; pre- and postoperative ophthalmologic examination'  },
        { id: 'd', text: 'Schirmer test and tonometry'  },
    ],
    correct: 'c',
    brief: 'Forced duction after reduction; consider ophthalmology before and after for any periorbital trauma.',
    detailed: 'Reduction of the zygoma can shift periorbital contents and entrap soft tissue, so a forced duction test confirms free motion afterwards. Pearl: document visual acuity and motility preoperatively; postoperative diplopia is otherwise indistinguishable from a preexisting injury.',
    concepts: ['forced-duction'],
},
{
    id: 'q26', type: 'mcq', section: 'ZMC Reduction & Fixation',
    stem: 'Which are the specific risks of the coronal approach used for the fourth point?',
    options: [
        { id: 'a', text: 'Visible scar, long operative time, temporal hollowing, and temporal branch facial nerve injury'  },
        { id: 'b', text: 'Hypoesthesia of the infraorbital nerve'  },
        { id: 'c', text: 'Ectropion and entropion'  },
        { id: 'd', text: 'Oroantral fistula'  },
    ],
    correct: 'a',
    brief: 'Coronal: scar, time, temporal hollowing, temporal branch injury.',
    detailed: 'Ectropion and entropion belong to the subciliary and transconjunctival approaches to the orbital floor. Pearl: resuspending the temporalis at closure limits hollowing.',
    concepts: ['coronal'],
},

// ════════════════ CASES ════════════════

{
    id: 'q27', type: 'mcq', section: 'Cases',
    stem: 'A 30-year-old man falls from a motorcycle. On exam, the maxilla moves as a unit when you rock the upper incisors and the occlusion is open anteriorly. Palpation shows step-offs at the nasofrontal junction and both infraorbital rims, with bilateral infraorbital numbness, and CT shows fracture through the pterygoid plates. What pattern and which immediate concern in addition to the airway?',
    options: [
        { id: 'a', text: 'Le Fort I; no further concern'  },
        { id: 'b', text: 'Le Fort III; look for isolated arch trismus'  },
        { id: 'c', text: 'Le Fort II; check occlusion, expect significant bleeding, and look for CSF leak'  },
        { id: 'd', text: 'Isolated NOE fracture; telecanthus'  },
    ],
    correct: 'c',
    brief: 'Pyramidal (Le Fort II): nasofrontal, infraorbital rim and foramen, pterygoid plates; bleeding and CSF leak.',
    detailed: 'Mobile tooth-bearing maxilla with nasofrontal and infraorbital rim involvement and V2 numbness is Le Fort II. The decks note involvement of the orbit, the need to check occlusion, significant bleeding, and CSF leak risk. Pearl: always test for bilateral and different-level patterns.',
    concepts: ['case-lefort', 'lefort-2'],
},
{
    id: 'q28', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) After airway and hemorrhage control, what is the plan and sequence?',
    options: [
        { id: 'a', text: 'Closed treatment with 6 weeks of IMF only'  },
        { id: 'b', text: 'Place IMF screws or arch bars, expose via sublabial and orbital rim approaches, place into MMF, plate the buttresses and rims, then soft-tissue repair'  },
        { id: 'c', text: 'Coronal-only approach with no IMF'  },
        { id: 'd', text: 'Plate first, then place MMF so the plates set the bite'  },
    ],
    correct: 'b',
    brief: 'IMF, expose all, MMF, plate buttresses and rims, soft tissue.',
    detailed: 'Goals are preinjury occlusion and restored facial projection and width. Sublabial exposure reaches the medial and lateral buttresses; transconjunctival or lower lid exposure reaches the orbital floor and rim; the coronal approach is added if the nasofrontal junction needs exposure. Pearl: if a CSF leak is present, a neurosurgical and ophthalmology evaluation joins the plan.',
    concepts: ['case-lefort', 'order-of-operation', 'lefort-goals'],
},
{
    id: 'q29', type: 'mcq', section: 'Cases',
    stem: 'A 25-year-old was punched on the right cheek. He has flattening of the malar eminence, infraorbital numbness, a palpable step at the inferior orbital rim, and a CT showing fractures at the zygomaticofrontal suture, infraorbital rim, zygomaticomaxillary buttress, and sphenozygomatic suture, with an intact arch and a small floor fracture. What is the diagnosis, and which fixation scheme fits?',
    options: [
        { id: 'a', text: 'NOE type II; transnasal wiring'  },
        { id: 'b', text: 'Isolated arch fracture; Gillies elevation'  },
        { id: 'c', text: 'Le Fort III; coronal approach and four-point fixation'  },
        { id: 'd', text: 'ZMC (tripod) fracture; three-point exposure with orbital floor reconstruction'  },
    ],
    correct: 'd',
    brief: 'ZMC with an intact arch and floor involvement: three-point with orbital reconstruction.',
    detailed: 'Three-point exposure reaches the infraorbital rim, SZ and FZ sutures, and ZM buttress; the floor is explored from the infraorbital approach. Four-point is for complex fractures needing the arch (which is intact) or a coronal approach for associated frontal sinus or NOE fractures. Pearl: all ZMC fractures involve the orbit, so a forced duction test belongs at the end of the case.',
    concepts: ['case-zmc', 'point-fixation'],
},
{
    id: 'q30', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) At the end of the case the right eye does not elevate on forced duction. What does this mean and what do you do?',
    options: [
        { id: 'a', text: 'Normal; reassure'  },
        { id: 'b', text: 'Optic neuropathy; steroids'  },
        { id: 'c', text: 'Facial nerve palsy; observation'  },
        { id: 'd', text: 'Soft-tissue entrapment: re-explore the floor and free the tissue before leaving'  },
    ],
    correct: 'd',
    brief: 'A positive forced duction after reduction is entrapment until proven otherwise.',
    detailed: 'Reduction can displace periorbital soft tissue into the floor defect. The deck specifies a forced duction test after reduction to make sure the patient does not have entrapment. Pearl: if you cannot free it, the floor reconstruction needs revision.',
    concepts: ['case-zmc', 'forced-duction'],
},
{
    id: 'q31', type: 'mcq', section: 'Cases',
    stem: 'A 19-year-old has a depressed left cheek contour and cannot open her mouth fully after an elbow to the face. There is no step at the zygomaticofrontal suture or inferior orbital rim. Which treatment?',
    options: [
        { id: 'a', text: 'Le Fort I osteotomy'  },
        { id: 'b', text: 'Gillies temporal approach: elevate the arch from deep to the temporalis fascia'  },
        { id: 'c', text: 'Nonoperative management only'  },
        { id: 'd', text: 'Four-point fixation with coronal approach'  },
    ],
    correct: 'b',
    brief: 'Isolated arch fracture with trismus or asymmetry: Gillies elevation.',
    detailed: 'The surgical indications for an arch fracture are malar asymmetry and trismus. The Gillies approach lifts the arch through a small temporal incision with the elevator deep to the temporalis fascia. Pearl: confirm that the reduction is stable; an unstable comminuted arch needs open exposure.',
    concepts: ['case-arch', 'gillies', 'zygomatic-arch'],
},
{
    id: 'q32', type: 'mcq', section: 'Cases',
    stem: 'A 27-year-old has a deviated nose after a basketball injury 4 hours ago. Swelling is mild. A septal hematoma is not seen. What is the best timing, and what must you check?',
    options: [
        { id: 'a', text: 'Reduce within 3 hours, or wait until 5 to 10 days; check the septum for hematoma'  },
        { id: 'b', text: 'Immediate coronal approach'  },
        { id: 'c', text: 'Wait 6 weeks'  },
        { id: 'd', text: 'Never reduce'  },
    ],
    correct: 'a',
    brief: 'Within 3 hours, or after 5 to 10 days; always examine the septum.',
    detailed: 'At 4 hours he is just past the first window, so the second window applies. The septum should be examined for hematoma, which needs drainage. Pearl: counsel that cosmesis or obstruction decide whether to intervene.',
    concepts: ['case-nasal', 'nasal-timing', 'nasal-epi'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
