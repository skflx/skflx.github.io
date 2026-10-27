/* =================================================================
   Facial Trauma: Evaluation, Lacerations & Airway
   OKSAT · Facial Plastics & Recon Module
   ================================================================= */
/* Sources: the owner's resident-review decks: "PGY-2 Trauma Crash
   Course" (KLS Martin; history, exam, laceration repair), "All of
   Facial Trauma" (Facial Trauma Overview; history and physical,
   fracture-pattern vocabulary) and "Airway Management in Facial
   Trauma" (L. Moneta; gunshot case, airway guidelines, airway
   options). The decks cite the AO Foundation Surgery Reference
   (CMF); the owner will add AO content later. Specific fractures
   are in the mandible-fractures, midface-fractures,
   orbit-noe-trauma, and temporal-bone-trauma modules.
   No figures: the decks' images are CT scans, patient photographs,
   or manufacturer slides; none is used.
   Discrepancy policy: the highest-ranked source is keyed;
   disagreements, "added" (standard teaching not in the decks) and
   deck-only claims are named in the explanation under Discrepancy:
   or Caveat:. Nothing here is clinically verified; the owner sets
   that. Statistics from the airway deck are quoted from
   unreferenced slides (the reference slide is blank in the source)
   and should be treated as deck-only. */

const meta = {
    title: 'Facial Trauma:\nEvaluation & Airway',
    subtitle:
        'The trauma history and examination, which lacerations to close and which to refer, structure-specific repairs (facial nerve, parotid duct, lacrimal system, lip, ear, eyelid), suture selection, indications for securing the airway, airway options in facial fractures, ballistic facial injury, and three integrating cases.',
    kicker: 'Self-Assessment · Facial Plastics & Recon Module',
    id: 'facial-trauma-evaluation',
    sources: [
        'Resident review decks (owner): PGY-2 Trauma Crash Course (KLS Martin); All of Facial Trauma; Airway Management in Facial Trauma (Moneta)',
        'AO Foundation Surgery Reference, craniomaxillofacial trauma (referenced by the decks; the owner will add content)',
        'Airway deck statistics (gunshot incidence, tracheostomy rates, cervical spine injury rate) come from slides whose citations are blank in the source: deck only',
        'Items marked "added" (ear antibiotic rationale, submental intubation indications, facial nerve landmark) are standard teaching not stated in the decks; unvetted',
    ],
};

const DOMAINS = {
    evaluation: { label: 'History & Examination',     color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    lacerations:{ label: 'Laceration Repair',         color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    airway:     { label: 'Airway Management',         color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    ballistic:  { label: 'Ballistic Facial Injury',   color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    cases:      { label: 'Cases',                     color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // history & examination
    'trauma-history':       { label: 'Trauma History',               domain: 'evaluation' },
    'trauma-exam':          { label: 'Trauma Examination',           domain: 'evaluation' },
    'priority-findings':    { label: 'Vision, Occlusion, Sensation, Airway', domain: 'evaluation' },
    'ct-approach':          { label: 'Systematic CT Review',         domain: 'evaluation' },

    // lacerations
    'who-closes':           { label: 'Which Lacerations to Refer',   domain: 'lacerations' },
    'laceration-technique': { label: 'Laceration Technique',         domain: 'lacerations' },
    'facial-nerve-lac':     { label: 'Facial Nerve Laceration',      domain: 'lacerations' },
    'parotid-duct':         { label: 'Parotid Duct Injury',          domain: 'lacerations' },
    'lacrimal-lac':         { label: 'Lacrimal System Injury',       domain: 'lacerations' },
    'suture-selection':     { label: 'Suture Selection',             domain: 'lacerations' },
    'lip-lac':              { label: 'Lip Lacerations',              domain: 'lacerations' },
    'ear-lac':              { label: 'Ear Lacerations & Hematoma',   domain: 'lacerations' },
    'eyelid-lac':           { label: 'Eyelid Lacerations',           domain: 'lacerations' },
    'bite-wounds':          { label: 'Bite Wounds',                  domain: 'lacerations' },

    // airway
    'airway-indications':   { label: 'Indications to Secure the Airway', domain: 'airway' },
    'obstruction-risk':     { label: 'Mechanisms of Obstruction',    domain: 'airway' },
    'airway-options':       { label: 'Airway Options',               domain: 'airway' },
    'cspine':               { label: 'Cervical Spine Considerations', domain: 'airway' },
    'submental':            { label: 'Submental Intubation',         domain: 'airway' },
    'bullard':              { label: 'Bullard Laryngoscope',         domain: 'airway' },
    'trach-risk':           { label: 'Tracheostomy Prediction',      domain: 'airway' },

    // ballistic
    'gsw-epi':              { label: 'Gunshot Epidemiology',         domain: 'ballistic' },
    'ballistics':           { label: 'Ballistic Behavior',           domain: 'ballistic' },

    // cases
    'case-gsw':             { label: 'Case: Gunshot to the Face',    domain: 'cases' },
    'case-lacerations':     { label: 'Case: Complex Laceration',     domain: 'cases' },
    'case-airway':          { label: 'Case: Evolving Airway',        domain: 'cases' },
};

const ITEMS = [

// ════════════════ HISTORY & EXAMINATION ════════════════

{
    id: 'q1', type: 'recall', section: 'History & Examination',
    stem: 'List the elements of the head and neck review of systems and the targeted trauma history in the decks.',
    answer: `History:
• When and how the injury occurred (mechanism)
• Associated injuries

Review of systems:
• Vision
• Breathing (nasal and oropharyngeal)
• Swallowing and eating
• Speaking
• Sensation
• Movement
• Cosmesis
• Hearing

Targeted: visual change, malocclusion, facial numbness, facial weakness, hearing loss, otorrhea`,
    brief: 'Mechanism, associated injuries, and a function-by-function review: eye, breathing, swallowing, speech, sensation, movement, appearance, hearing.',
    detailed: 'The Overview stresses that this is important even though the talk is about fractures. Pearl: the mechanism predicts the pattern (a fist is a nasal or zygoma injury; a steering wheel an NOE injury) and tells you what else to look for.',
    concepts: ['trauma-history'],
},
{
    id: 'q2', type: 'recall', section: 'History & Examination',
    stem: 'List the trauma examination by region from the PGY-2 crash course.',
    answer: `• Head and face — abrasions, lacerations, bony step-off, midface mobility, crepitus
• Eyes — pupils, EOM, globe injury, globe position, telecanthus, lacrimal system
• Ears — CSF leak, hemotympanum
• Nose — external deformity, septal hematoma
• Oral cavity — lacerations, occlusion, Stenson duct
• Neck — C-spine, crepitus, ecchymoses, palpable landmarks
• Neuro — mental status, cranial nerves`,
    brief: 'Examine every region; the nose needs a septal hematoma check and the mouth needs occlusion and Stenson duct.',
    detailed: 'Crepitus in the neck suggests airway or esophageal injury (added). Pearl: do not just focus on the injury the ED called about; the full exam catches the missed second injury.',
    concepts: ['trauma-exam'],
},
{
    id: 'q3', type: 'mcq', section: 'History & Examination',
    stem: 'The Facial Trauma Overview asks for special attention to four things in every patient. Which four?',
    options: [
        { id: 'a', text: 'Vision, occlusion, sensation, and airway obstruction'  },
        { id: 'b', text: 'Hearing, smell, taste, and swallowing'  },
        { id: 'c', text: 'Cosmesis, scars, symmetry, and projection'  },
        { id: 'd', text: 'Skin, hair, nails, and posture'  },
    ],
    correct: 'a',
    brief: 'Vision, occlusion, sensation, airway obstruction.',
    detailed: 'Each is a function that can be permanently lost or can kill. Pearl: they map directly to the surgical priorities: threat to life (airway), threat to sight (vision), and the functional restoration targets (occlusion, sensation).',
    concepts: ['priority-findings'],
},
{
    id: 'q4', type: 'mcq', section: 'History & Examination',
    stem: 'When reading a facial CT, how do the decks tell you to describe each fracture?',
    options: [
        { id: 'a', text: 'By the Hounsfield density of the fragment'  },
        { id: 'b', text: 'By the patient’s mechanism only'  },
        { id: 'c', text: 'Open or closed, displaced or not, comminuted or not, then identify the pattern (ZMC, NOE, Le Fort, etc.)'  },
        { id: 'd', text: 'By sidedness only'  },
    ],
    correct: 'c',
    brief: 'Develop a systematic review: open or closed, displaced, comminuted, then classify.',
    detailed: 'Soft-tissue windows assess extraocular muscles and orbital contents; look for intraorbital air; 3D reconstructions help to distinguish NOE type II from type III. Pearl: use the same order every time so you do not miss the contralateral injury.',
    concepts: ['ct-approach'],
},

// ════════════════ LACERATION REPAIR ════════════════

{
    id: 'q5', type: 'mcq', section: 'Laceration Repair',
    stem: 'The PGY-2 crash course says the ED or trauma team can close all lacerations EXCEPT those involving which structures?',
    options: [
        { id: 'a', text: 'Scalp, forehead, cheek, and chin'  },
        { id: 'b', text: 'Lip or vermilion, nose, eyelid, and ear'  },
        { id: 'c', text: 'Neck and shoulder'  },
        { id: 'd', text: 'Any laceration over 5 cm'  },
    ],
    correct: 'b',
    brief: 'Lip or vermilion, nose, eyelid, and ear go to the specialist.',
    detailed: 'These are the structures where small errors in alignment or cartilage coverage produce a visible or functional deformity. Pearl: also refer lacerations that involve the facial nerve, parotid duct, or lacrimal system.',
    concepts: ['who-closes'],
},
{
    id: 'q6', type: 'recall', section: 'Laceration Repair',
    stem: 'State the basic laceration technique principles from the crash course.',
    answer: `• Anesthetize with lidocaine with epinephrine
• Irrigate thoroughly with normal saline
• Remove all foreign bodies
• Approximate like with like
• Do not sacrifice tissue`,
    brief: 'Anesthetize, irrigate, remove foreign bodies, match like tissue to like, and preserve tissue.',
    detailed: 'The face tolerates debridement poorly because of its excellent blood supply; minimal debridement is the rule. Pearl: "like with like" means vermilion to vermilion, gray line to gray line, cartilage to cartilage.',
    concepts: ['laceration-technique'],
},
{
    id: 'q7', type: 'mcq', section: 'Laceration Repair',
    stem: 'A deep cheek laceration may have divided a facial nerve branch. According to the crash course, which injuries warrant repair?',
    options: [
        { id: 'a', text: 'Only injuries medial to the nasolabial fold'  },
        { id: 'b', text: 'No branch is ever repaired'  },
        { id: 'c', text: 'Only injuries to the main trunk'  },
        { id: 'd', text: 'Those lateral to a vertical line dropped from the lateral canthus; the deck wording is "a line from the lateral canthus to the oral commissure"'  },
    ],
    correct: 'd',
    brief: 'Explore and repair divided branches lateral to the lateral canthal line; more medial branches arborize and often recover.',
    detailed: 'Discrepancy: the slide says "lateral to line from lateral canthus to oral commissure". The commonly taught landmark is a vertical line from the lateral canthus; medial to it, the fine branches have extensive cross-connections and usually recover without repair (added). Keyed on the shared element, lateral to the canthus. Pearl: repair within 72 hours, while the distal stump still responds to a nerve stimulator.',
    concepts: ['facial-nerve-lac'],
},
{
    id: 'q8', type: 'mcq', section: 'Laceration Repair',
    stem: 'A laceration over the cheek is found to have transected Stenson duct. What is the standard management?',
    options: [
        { id: 'a', text: 'Refer to ophthalmology'  },
        { id: 'b', text: 'Close the skin and observe'  },
        { id: 'c', text: 'Ligate the duct'  },
        { id: 'd', text: 'Repair in the operating room over a stent'  },
    ],
    correct: 'd',
    brief: 'A parotid duct injury is repaired in the OR over a stent.',
    detailed: 'Added: the duct runs along a line from the tragus to the midpoint of the upper lip, and the clue is clear saliva from the wound or in the oral cavity; the duct is cannulated from the mouth to find the proximal end. Pearl: failure to repair produces a sialocele or salivary fistula.',
    concepts: ['parotid-duct'],
},
{
    id: 'q9', type: 'mcq', section: 'Laceration Repair',
    stem: 'A medial canthal laceration involves the lacrimal system. Who evaluates and repairs it?',
    options: [
        { id: 'a', text: 'The ED team with 6-0 nylon'  },
        { id: 'b', text: 'Ophthalmology (per the crash course)'  },
        { id: 'c', text: 'No repair is needed'  },
        { id: 'd', text: 'Dermatology'  },
    ],
    correct: 'b',
    brief: 'Lacrimal system injury: call ophthalmology.',
    detailed: 'The canalicular repair uses intubation of the canaliculus to prevent stenosis. The medial canthal tendon is anchored to the lacrimal crests, so an NOE fracture is another cause of lacrimal injury. Pearl: epiphora after a medial canthal wound is a canalicular injury until proven otherwise.',
    concepts: ['lacrimal-lac'],
},
{
    id: 'q10', type: 'recall', section: 'Laceration Repair',
    stem: 'List the suture materials the crash course recommends for each facial tissue.',
    answer: `• Hair-bearing scalp — staples (or suture)
• Deep tissue and muscle — 3-0 to 4-0 Vicryl
• Skin — 5-0 to 6-0 fast-absorbing gut (or Prolene)
• Mucosa — 3-0 to 5-0 chromic gut (or Vicryl)
• Cartilage — 4-0 to 5-0 PDS`,
    brief: 'Heavier absorbable sutures deep; fine fast-absorbing or nonabsorbable skin sutures; chromic on mucosa; PDS on cartilage.',
    detailed: 'Pearl: PDS holds longer than Vicryl, which is why cartilage is closed with it. Dog bites need Augmentin.',
    concepts: ['suture-selection', 'bite-wounds'],
},
{
    id: 'q11', type: 'mcq', section: 'Laceration Repair',
    stem: 'In repairing a through-and-through lip laceration, which statement is correct?',
    options: [
        { id: 'a', text: 'Approximate the vermilion precisely, as the first stitch; close in three layers; always approximate the orbicularis oris'  },
        { id: 'b', text: 'Leave the vermilion border unapproximated to allow drainage'  },
        { id: 'c', text: 'Close in two layers and leave the muscle for secondary healing'  },
        { id: 'd', text: 'Close skin first, then mucosa, and skip the muscle'  },
    ],
    correct: 'a',
    brief: 'Vermilion first and exact; mucosa, orbicularis oris, then skin.',
    detailed: 'A step of even 1 mm at the vermilion border is visible at conversational distance. Failure to repair the orbicularis causes a bulge or notch with function. Pearl: mark the vermilion border before infiltrating local anesthetic, which distorts it.',
    concepts: ['lip-lac'],
},
{
    id: 'q12', type: 'mcq', section: 'Laceration Repair',
    stem: 'After repairing an ear laceration or draining an auricular hematoma, what does the crash course recommend?',
    options: [
        { id: 'a', text: 'Apply a circumferential tight wrap'  },
        { id: 'b', text: 'Leave cartilage exposed to dry'  },
        { id: 'c', text: 'Cover all cartilage; apply a bolster (Xeroform and dental roll); give a fluoroquinolone'  },
        { id: 'd', text: 'Resect exposed cartilage'  },
    ],
    correct: 'c',
    brief: 'Cover the cartilage, bolster the ear, and give a fluoroquinolone.',
    detailed: 'Added: the fluoroquinolone covers Pseudomonas, which is the dominant pathogen in auricular perichondritis. A bolster prevents reaccumulation of hematoma, which would otherwise strangle the cartilage’s blood supply and form a cauliflower ear. Pearl: the ear is resilient, but exposed cartilage is not.',
    concepts: ['ear-lac'],
},
{
    id: 'q13', type: 'mcq', section: 'Laceration Repair',
    stem: 'Which statement about repairing a full-thickness eyelid laceration is correct?',
    options: [
        { id: 'a', text: 'Anesthetize the cornea with topical drops; align the gray line; repair the tarsus and levator/septum complex; the conjunctiva need not be closed'  },
        { id: 'b', text: 'Close the skin only'  },
        { id: 'c', text: 'Close the conjunctiva meticulously and leave the tarsus'  },
        { id: 'd', text: 'Avoid aligning the gray line'  },
    ],
    correct: 'a',
    brief: 'Protect the cornea, align the gray line, repair tarsus and levator or septum; conjunctiva can be left.',
    detailed: 'The gray line is the mucocutaneous junction of the lid margin; a step produces notching and trichiasis. A laceration near the medial canthus raises the question of canalicular injury. Pearl: check for globe injury before you suture anything.',
    concepts: ['eyelid-lac'],
},

// ════════════════ AIRWAY MANAGEMENT ════════════════

{
    id: 'q14', type: 'recall', section: 'Airway Management',
    stem: 'List the general trauma-society guidelines for securing the airway.',
    answer: `• Severe cognitive impairment
• GCS below 8
• Severe craniomaxillofacial trauma
• Severe neck injury
• Smoke inhalation`,
    brief: 'Secure the airway for GCS below 8, severe CMF or neck trauma, severe cognitive impairment, and inhalation injury.',
    detailed: 'These are triggers, not a requirement for observation first. Pearl: a patient with a normal GCS but progressive facial and pharyngeal swelling meets the spirit of these criteria.',
    concepts: ['airway-indications'],
},
{
    id: 'q15', type: 'recall', section: 'Airway Management',
    stem: 'Name the mechanisms by which facial trauma threatens the airway.',
    answer: `• Severe facial edema
• Tongue prolapse, especially with bilateral mandibular body fractures
• Pharyngeal edema or hematoma
• Hemorrhage
• Le Fort fractures — more severe levels, greater concern; maxillary prolapse`,
    brief: 'Swelling, tongue prolapse, hematoma, blood, and the posteriorly displaced maxilla.',
    detailed: 'Bilateral mandibular body (or parasymphyseal) fractures remove the anterior support of the tongue, which falls back, particularly when the patient is supine. Pearl: sit the patient forward when you can; a supine position is the worst.',
    concepts: ['obstruction-risk'],
},
{
    id: 'q16', type: 'mcq', section: 'Airway Management',
    stem: 'In the airway deck’s 10-year review, which was associated with needing a tracheostomy?',
    options: [
        { id: 'a', text: 'Isolated orbital floor fractures'  },
        { id: 'b', text: 'Isolated zygomatic arch fractures'  },
        { id: 'c', text: 'Lower GCS (mean 6.8 vs 12.4), mandible and multiple mandible fractures, and Le Fort III fractures'  },
        { id: 'd', text: 'Isolated nasal fractures'  },
    ],
    correct: 'c',
    brief: 'Low GCS, mandible, multiple mandible, and Le Fort III fractures predicted tracheostomy.',
    detailed: 'In that series 5.9% of trauma patients had facial fractures and 4.3% of them needed tracheostomy; mortality was 7.2% in the tracheostomy group versus 0%. Caveat: these are retrospective slide figures with no printed reference; the association reflects injury severity as much as the airway need. Pearl: the severity of head injury drives most of the airway decisions.',
    concepts: ['trach-risk'],
},
{
    id: 'q17', type: 'recall', section: 'Airway Management',
    stem: 'List airway-management options in facial trauma from the deck.',
    answer: `• Orotracheal intubation (usually possible)
• Nasotracheal intubation — blind or fiberoptic
• Laryngeal mask airway
• Bullard laryngoscope
• Bougie
• GlideScope
• Submental intubation
• Retromolar intubation
• Lighted stylet
• Retrograde intubation
• Cricothyroidotomy
• Tracheotomy`,
    brief: 'Orotracheal intubation can usually be performed; alternatives bypass the damaged anatomy.',
    detailed: 'Added: nasotracheal intubation is avoided with midface fractures that involve the skull base or nasoethmoid region because of the risk of intracranial passage; submental and retromolar routes keep the oral cavity free for intraoperative occlusion. Pearl: have the surgical airway set up before you start.',
    concepts: ['airway-options'],
},
{
    id: 'q18', type: 'mcq', section: 'Airway Management',
    stem: 'What is the incidence of cervical spine injury in craniomaxillofacial trauma in the deck, and how does it affect the airway plan?',
    options: [
        { id: 'a', text: 'About 13%; tracheotomy is mandatory'  },
        { id: 'b', text: 'About 1.3%; presume injury and maintain in-line neutral positioning, using options such as the Bullard laryngoscope or fiberoptic technique'  },
        { id: 'c', text: 'About 50%; avoid all intubation'  },
        { id: 'd', text: 'Zero; ignore it'  },
    ],
    correct: 'b',
    brief: 'Cervical spine injury is uncommon (about 1.3%) but must be presumed until cleared.',
    detailed: 'Airway management is complicated by a presumed cervical spine injury, and orotracheal intubation can usually still be performed. The Bullard laryngoscope was designed to maintain a neutral head position and has an attached stylet for the tube and a port for oxygenation or lidocaine. Pearl: manual in-line stabilization lets you use a direct or video laryngoscope in most cases.',
    concepts: ['cspine', 'bullard'],
},
{
    id: 'q19', type: 'recall', section: 'Airway Management',
    stem: 'Describe the steps of submental intubation from the deck.',
    answer: `• Incision parallel to and one finger-breadth below the mandible
• Blunt dissection through the mylohyoid along the mandibular cortex
• Incise the floor-of-mouth mucosa over the instrument
• Pass the tube through the tunnel (added)`,
    brief: 'Make a small submental incision, dissect bluntly through mylohyoid to the floor of mouth, and bring the tube out beneath the chin.',
    detailed: 'Added: it is a bridge between nasal intubation (contraindicated by skull base or nasoethmoid fractures) and tracheostomy when occlusion must be checked intraoperatively and prolonged ventilation is not needed. Pearl: the lingual nerve and the sublingual and submandibular ducts lie in the floor of mouth, so stay close to the mandibular cortex.',
    concepts: ['submental'],
},
{
    id: 'q20', type: 'mcq', section: 'Airway Management',
    stem: 'The deck’s conclusion on stable-appearing patients with facial gunshot wounds is which?',
    options: [
        { id: 'a', text: 'Stable-appearing patients never need airway intervention'  },
        { id: 'b', text: 'All patients should have an immediate tracheotomy'  },
        { id: 'c', text: 'Airway management is a late consideration'  },
        { id: 'd', text: 'Even stable-appearing patients may require emergent airway control as swelling rapidly increases'  },
    ],
    correct: 'd',
    brief: 'Do not be reassured by an initially stable airway: swelling progresses.',
    detailed: 'In the quoted series, 96 of 100 were stable at initial examination, yet 35 needed urgent airway control in the ED and 2 required a surgical airway. Caveat: single-center slide data. Pearl: re-examine the airway repeatedly in the first hours.',
    concepts: ['airway-indications', 'gsw-epi'],
},

// ════════════════ BALLISTIC FACIAL INJURY ════════════════

{
    id: 'q21', type: 'recall', section: 'Ballistic Facial Injury',
    stem: 'State the epidemiology of facial gunshot wounds from the Moneta deck.',
    answer: `• About 6% of all gunshot wounds involve the face
• About 80% male
• About two thirds of victims have a single shot
• About 11% mortality within 24 hours
• Low-velocity (below 1200 ft/s) wounds are most common`,
    brief: 'Facial gunshot wounds are mostly low-velocity, single-shot injuries in men; early mortality is about 11%.',
    detailed: 'Figures are deck-only (blank reference). Pearl: handgun injuries are low velocity, which is why reconstruction after initial stabilization is often feasible.',
    concepts: ['gsw-epi'],
},
{
    id: 'q22', type: 'mcq', section: 'Ballistic Facial Injury',
    stem: 'Which statement about the relation of the entry wound to the extent of injury is correct?',
    options: [
        { id: 'a', text: 'Low-velocity injuries never fracture bone'  },
        { id: 'b', text: 'Exit wounds are always larger and so predict depth'  },
        { id: 'c', text: 'Entrance wound size correlates well with the extent of underlying injury'  },
        { id: 'd', text: 'Entrance and extent of injury are not well correlated, and bone fragments act as secondary projectiles'  },
    ],
    correct: 'd',
    brief: 'A small entry wound can hide extensive injury; fragmented bone and teeth become secondary missiles.',
    detailed: 'This is why CT is mandatory even for a seemingly small wound. Pearl: image the whole trajectory, including the neck and skull base.',
    concepts: ['ballistics'],
},

// ════════════════ CASES ════════════════

{
    id: 'q23', type: 'mcq', section: 'Cases',
    stem: 'An 18-year-old man shot himself in the right face with a handgun, was intubated in the field, and arrives with a severely comminuted right mandible fracture, a right ZMC fracture, and multiple bullet fragments. There is no orbital or intracranial extension. The patient is intubated. What is the best next step?',
    options: [
        { id: 'a', text: 'Discharge with antibiotics'  },
        { id: 'b', text: 'Maintain the secured airway, complete the trauma survey with CT of the head, face, and neck, and plan staged fixation'  },
        { id: 'c', text: 'Remove the endotracheal tube to assess the injury'  },
        { id: 'd', text: 'Immediate load-bearing mandible reconstruction in the trauma bay'  },
    ],
    correct: 'b',
    brief: 'Keep the secure airway, complete the survey, and plan staged repair.',
    detailed: 'Gunshot injuries combine airway, hemorrhage, and associated head and neck injury. The fractures here (comminuted mandible, ZMC) are definitive management after stabilization, using load-bearing fixation for the comminuted mandible (see the mandible module). Pearl: the intubated patient’s tube position can be changed to submental or nasotracheal later if intraoperative occlusion is needed.',
    concepts: ['case-gsw', 'airway-indications'],
},
{
    id: 'q24', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Why is the field intubation reasonable, and which factor most raises the risk of obstruction later?',
    options: [
        { id: 'a', text: 'Severe CMF trauma is a guideline indication; a comminuted mandible raises the risk of tongue prolapse and swelling'  },
        { id: 'b', text: 'It was unnecessary; GCS was normal'  },
        { id: 'c', text: 'It was reasonable only for the ZMC fracture'  },
        { id: 'd', text: 'Intubation is contraindicated with mandibular fractures'  },
    ],
    correct: 'a',
    brief: 'Severe CMF trauma is a standard indication; mandibular comminution and swelling compound the risk.',
    detailed: 'Even with a stable-appearing patient, swelling rapidly increases. Orotracheal intubation can usually be done and is adequate. Pearl: if the patient later needs MMF in the OR, plan a nasal, submental, or retromolar route.',
    concepts: ['case-gsw', 'obstruction-risk', 'airway-options'],
},
{
    id: 'q25', type: 'mcq', section: 'Cases',
    stem: 'A 7-year-old is bitten on the cheek by a dog. The wound is 3 cm, deep, with clear fluid coming from it, and he cannot smile on that side. Which findings and plans are appropriate?',
    options: [
        { id: 'a', text: 'Leave the wound open for a week'  },
        { id: 'b', text: 'Refer to ophthalmology'  },
        { id: 'c', text: 'Possible parotid duct and facial nerve injury: exam of facial movement, OR repair over a stent, and Augmentin'  },
        { id: 'd', text: 'Close in the ED with 3-0 nylon and no antibiotics'  },
    ],
    correct: 'c',
    brief: 'Clear saliva plus weakness: duct and nerve injury; repair in the OR and treat for the bite.',
    detailed: 'Facial nerve branches lateral to the lateral canthal line should be repaired, and a transected parotid duct needs stenting. Augmentin is the crash-course antibiotic for dog bites. Irrigate thoroughly. Pearl: document the exam before any local anesthetic.',
    concepts: ['case-lacerations', 'facial-nerve-lac', 'parotid-duct'],
},
{
    id: 'q26', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) The wound also crosses the vermilion border of the upper lip. Which is the correct first stitch and which layers must be closed?',
    options: [
        { id: 'a', text: 'The vermilion border first, then mucosa, orbicularis oris, and skin'  },
        { id: 'b', text: 'Skin and mucosa, skipping the muscle'  },
        { id: 'c', text: 'The skin first, then the vermilion'  },
        { id: 'd', text: 'The mucosa only'  },
    ],
    correct: 'a',
    brief: 'Vermilion first and exact; always approximate the orbicularis oris.',
    detailed: 'A through-and-through lip wound is closed in three layers. Pearl: use the lip landmarks (white roll, vermilion border, wet-dry junction) to align.',
    concepts: ['case-lacerations', 'lip-lac'],
},
{
    id: 'q27', type: 'mcq', section: 'Cases',
    stem: 'A 45-year-old with bilateral mandibular body fractures, a Le Fort III fracture, and GCS 7 arrives with a swollen face and secretions. He is saturating 91% on a mask. What is the airway plan?',
    options: [
        { id: 'a', text: 'Observe and recheck in 6 hours'  },
        { id: 'b', text: 'Nasal intubation blind'  },
        { id: 'c', text: 'Secure the airway: GCS below 8 and severe CMF trauma meet the guidelines; prepare a surgical airway given the tongue prolapse and Le Fort III'  },
        { id: 'd', text: 'Supine positioning and a nasopharyngeal airway'  },
    ],
    correct: 'c',
    brief: 'GCS 7 and severe CMF trauma: secure the airway now with a backup surgical plan.',
    detailed: 'Bilateral mandibular body fractures (tongue prolapse), Le Fort III (maxillary prolapse), and the low GCS match the factors found in the tracheostomy group. Blind nasal intubation is dangerous with a Le Fort III and potential skull base fracture (added). Pearl: a double-setup (orotracheal attempt with the surgical airway prepped) is the standard of care.',
    concepts: ['case-airway', 'airway-indications', 'trach-risk'],
},
{
    id: 'q28', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) After the airway is secured and a tracheotomy is placed, CT shows the cervical spine is clear. He will need MMF for the mandible. How does the airway affect operative planning?',
    options: [
        { id: 'a', text: 'The tracheostomy must be removed first'  },
        { id: 'b', text: 'The tracheostomy frees the oral cavity so that occlusion can be set and MMF placed intraoperatively'  },
        { id: 'c', text: 'Occlusion is irrelevant in Le Fort III'  },
        { id: 'd', text: 'MMF is impossible with a tracheostomy'  },
    ],
    correct: 'b',
    brief: 'A tracheostomy leaves the mouth free to establish occlusion.',
    detailed: 'Establishing the premorbid occlusion is the first step of fixation for both mandible and midface fractures. Pearl: if the patient is not expected to need prolonged ventilation, the submental route accomplishes the same.',
    concepts: ['case-airway', 'airway-options', 'submental'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
