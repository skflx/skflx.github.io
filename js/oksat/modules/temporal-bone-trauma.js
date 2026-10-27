/* =================================================================
   Temporal Bone Trauma
   OKSAT · Otology / Neurotology Module
   ================================================================= */
/* Sources: the owner's resident-review decks: "Temporal Bone
   Trauma" (L. Moneta, resident conference, 8/25/14; the main
   source, with citations to Bailey's and a series of the literature)
   and "Orbital and Temporal Bone Trauma" (V. Pandrangi; temporal
   bone half, which cites the AO Foundation Surgery Reference). The
   owner may add further otology sources later.
   No figures: the decks' fracture diagrams are unlabeled CT or
   schematic images; none is used.
   Discrepancy policy: the highest-ranked source is keyed;
   disagreements, "added" (standard teaching not in the decks) and
   deck-only claims are named in the explanation under Discrepancy:
   or Caveat:. Nothing here is clinically verified; the owner sets
   that. */

const meta = {
    title: 'Temporal Bone\nTrauma',
    subtitle:
        'Epidemiology and anatomy, longitudinal versus transverse and otic capsule-sparing versus -disrupting classification, the associated cochleovestibular and ossicular sequelae, facial nerve injury and decompression, CSF otorrhea, and three integrating cases.',
    kicker: 'Self-Assessment · Otology / Neurotology Module',
    id: 'temporal-bone-trauma',
    sources: [
        'Resident review decks (owner): Temporal Bone Trauma (Moneta 2014); Orbital and Temporal Bone Trauma (Pandrangi)',
        'Bailey’s Head and Neck Surgery: Otolaryngology, as cited in the Moneta deck (epidemiology and facial nerve figures)',
        'AO Foundation Surgery Reference, as cited in the Pandrangi deck',
        'Items marked "added" (hemotympanum, ossicular findings, antibiotic controversy) are standard teaching not stated in the decks; unvetted',
    ],
};

const DOMAINS = {
    epi:       { label: 'Epidemiology & Examination',   color: '#2F6E6A', hex: 'rgba(47,110,106,0.13)' },
    classify:  { label: 'Fracture Classification',      color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    sequelae:  { label: 'Sequelae & Associated Injuries', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    facial:    { label: 'Facial Nerve Injury',          color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    csf:       { label: 'CSF Leak',                     color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    cases:     { label: 'Cases',                        color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // epidemiology & examination
    'epidemiology':         { label: 'Epidemiology',                 domain: 'epi' },
    'nearby-structures':    { label: 'Structures at Risk',           domain: 'epi' },
    'tb-exam':              { label: 'History & Examination',        domain: 'epi' },

    // classification
    'long-vs-transverse':   { label: 'Longitudinal vs Transverse',   domain: 'classify' },
    'otic-capsule':         { label: 'Otic Capsule Sparing vs Disrupting', domain: 'classify' },
    'oblique-mixed':        { label: 'Oblique & Mixed Fractures',    domain: 'classify' },
    'force-vector':         { label: 'Force Vector',                 domain: 'classify' },

    // sequelae
    'hearing-loss':         { label: 'Conductive vs Sensorineural Loss', domain: 'sequelae' },
    'vestibular':           { label: 'Vertigo & Vestibular Injury',  domain: 'sequelae' },
    'late-sequelae':        { label: 'Delayed Sequelae',             domain: 'sequelae' },
    'associated-injuries':  { label: 'Associated Injuries',          domain: 'sequelae' },

    // facial nerve
    'fn-incidence':         { label: 'Facial Nerve Injury Rates',    domain: 'facial' },
    'fn-site':              { label: 'Site of Injury',               domain: 'facial' },
    'fn-management':        { label: 'Observation vs Decompression', domain: 'facial' },
    'fn-electrodiagnostics':{ label: 'ENoG & Timing',                domain: 'facial' },
    'fn-approaches':        { label: 'Decompression Approaches',     domain: 'facial' },

    // csf
    'csf-conservative':     { label: 'Conservative CSF Leak Management', domain: 'csf' },
    'csf-surgery':          { label: 'Surgical CSF Leak Repair',     domain: 'csf' },
    'meningitis':           { label: 'Meningitis Risk',              domain: 'csf' },

    // cases
    'case-longitudinal':    { label: 'Case: Longitudinal Fracture',  domain: 'cases' },
    'case-transverse':      { label: 'Case: Transverse Fracture',    domain: 'cases' },
    'case-delayed-palsy':   { label: 'Case: Delayed Facial Palsy',   domain: 'cases' },
};

const ITEMS = [

// ════════════════ EPIDEMIOLOGY & EXAMINATION ════════════════

{
    id: 'q1', type: 'recall', section: 'Epidemiology & Examination',
    stem: 'State the epidemiology of temporal bone fractures as presented in the Moneta deck.',
    answer: `• About 31% from motor vehicle collisions; also falls, bicycle accidents, assaults
• Present in 14 to 22% of all skull fractures
• Male predominance about 3 to 1
• About 70% aged 20 to 40
• 8 to 29% bilateral
• About 60% open fractures`,
    brief: 'Young men, high-energy mechanisms, and a substantial bilateral rate; always check the other ear.',
    detailed: 'Figures are cited to Bailey’s and the literature in the deck. Pearl: because a temporal bone fracture implies a head injury, the associated intracranial injury rate is high (84% in the deck) and the neurologic assessment comes first.',
    concepts: ['epidemiology'],
},
{
    id: 'q2', type: 'recall', section: 'Epidemiology & Examination',
    stem: 'Name the important structures within or near the temporal bone that can be injured.',
    answer: `• Facial nerve (CN VII); CN IX, X, XI nearby (jugular foramen)
• Cochlea
• Labyrinth (vestibular apparatus)
• Ossicles
• Carotid artery and jugular vein
• Tympanic membrane
• TMJ (Pandrangi deck)`,
    brief: 'Facial nerve, cochleovestibular apparatus, ossicles, tympanic membrane, and the carotid and jugular vessels.',
    detailed: 'The carotid canal and jugular bulb are why a high-energy temporal bone fracture needs CT angiography when the fracture approaches them (added). Pearl: each structure maps to a symptom, which is how the history is organized.',
    concepts: ['nearby-structures'],
},
{
    id: 'q3', type: 'recall', section: 'Epidemiology & Examination',
    stem: 'List the history and physical examination elements for suspected temporal bone trauma.',
    answer: `History:
• Hearing loss, vertigo, tinnitus, aural fullness
• Facial weakness
• Otorrhea
• Jaw pain

Examination:
• Auricular hematoma or laceration
• Ear canal — hemorrhage, CSF otorrhea, fracture line or step-off, herniation
• Tympanic membrane
• Neurologic exam, CN VII
• Vertigo with nystagmus
• Hearing and tuning fork exam`,
    brief: 'Ask about hearing, balance, facial movement, and drainage; examine the canal and drum, the facial nerve, and perform tuning forks.',
    detailed: 'Tuning forks distinguish conductive from sensorineural loss at the bedside: with a 512 Hz fork the Weber lateralizes to the worse ear in conductive loss and to the better ear in sensorineural loss (added). Pearl: record facial function before sedation or paralysis; a later deficit is judged against it.',
    concepts: ['tb-exam'],
},

// ════════════════ FRACTURE CLASSIFICATION ════════════════

{
    id: 'q4', type: 'mcq', section: 'Fracture Classification',
    stem: 'Temporal bone fractures were first classified by Ulrich in 1926 by orientation to the petrous axis. Which definitions are correct?',
    options: [
        { id: 'a', text: 'Longitudinal: parallel to the long axis of the petrous bone; transverse: perpendicular to it'  },
        { id: 'b', text: 'Longitudinal: through the otic capsule; transverse: sparing it'  },
        { id: 'c', text: 'Longitudinal: along the squamosal suture; transverse: along the occipital suture'  },
        { id: 'd', text: 'Longitudinal: perpendicular to the petrous axis; transverse: parallel to it'  },
    ],
    correct: 'a',
    brief: 'Longitudinal parallels the long axis of the petrous pyramid; transverse is perpendicular.',
    detailed: 'Oblique fractures resemble longitudinal ones with a sloping plane; mixed fractures have components of both. Pearl: orientation to the petrous axis is the older system; the otic capsule system (below) predicts outcome better.',
    concepts: ['long-vs-transverse', 'oblique-mixed'],
},
{
    id: 'q5', type: 'mcq', section: 'Fracture Classification',
    stem: 'A patient struck on the temporoparietal region has blood in the ear canal, an EAC step-off, Battle sign, and a conductive hearing loss. What fracture is this and what is its approximate share?',
    options: [
        { id: 'a', text: 'Longitudinal; about 10%'  },
        { id: 'b', text: 'Transverse; about 25%'  },
        { id: 'c', text: 'Longitudinal; about 75% in the deck series'  },
        { id: 'd', text: 'Transverse; about 75%'  },
    ],
    correct: 'c',
    brief: 'Longitudinal: temporoparietal force, conductive loss, canal blood and step-off, about 75% in the deck.',
    detailed: 'Caveat: the 75/25 split is the classic teaching, but more recent series using high-resolution CT find that many fractures are oblique or mixed and that most are not purely one type; the otic capsule classification is now preferred. Pearl: use the traditional split to remember the clinical associations, not as a precise frequency.',
    concepts: ['long-vs-transverse', 'force-vector'],
},
{
    id: 'q6', type: 'recall', section: 'Fracture Classification',
    stem: 'Contrast longitudinal and transverse temporal bone fractures across the characteristics in the deck table.',
    answer: `Longitudinal | Transverse
• Prevalence about 75% | about 25%
• Line parallel to petrous long axis | perpendicular to it
• Force temporoparietal | frontal or occipital
• Spares the otic capsule (anterolateral) | may transect the capsule, with or without the IAC
• Conductive hearing loss | sensorineural hearing loss
• Blood in EAC, Battle sign, EAC step-off, sometimes vestibular signs | hemotympanum, nystagmus, CSF otorrhea
• Facial nerve injury less likely | more likely`,
    brief: 'Longitudinal: lateral blow, conductive loss; transverse: front or back blow, sensorineural loss and facial nerve injury.',
    detailed: 'Discrepancy: the table lists the longitudinal relation to the otic capsule as "anteromedial", but the capsule-sparing slide in the same deck says anterolateral; a longitudinal fracture runs lateral and anterior to the capsule, so keyed here as sparing. Pearl: the force direction predicts the type.',
    concepts: ['long-vs-transverse', 'force-vector'],
},
{
    id: 'q7', type: 'mcq', section: 'Fracture Classification',
    stem: 'Which is the correct comparison for otic capsule-disrupting versus -sparing fractures?',
    options: [
        { id: 'a', text: 'Sparing: occipital force, profound sensorineural loss; disrupting: temporoparietal force, conductive loss'  },
        { id: 'b', text: 'Disrupting: occipital force, higher rates of CN VII paralysis, CSF leak, profound hearing loss, and intracranial complications; sparing: temporoparietal force, conductive or mixed loss'  },
        { id: 'c', text: 'Both have the same facial nerve risk'  },
        { id: 'd', text: 'Disrupting fractures never cause CSF leak'  },
    ],
    correct: 'b',
    brief: 'Capsule-disrupting fractures carry the worse outcomes: sensorineural loss, facial paralysis, CSF leak, meningitis.',
    detailed: 'The disrupting group comes from an occipital force and almost always has sensorineural hearing loss, with a risk of delayed meningitis. The sparing group is anterolateral to the capsule from temporoparietal force, with conductive or mixed loss and lower facial nerve risk. Pearl: this classification predicts complications better than longitudinal versus transverse.',
    concepts: ['otic-capsule'],
},

// ════════════════ SEQUELAE & ASSOCIATED INJURIES ════════════════

{
    id: 'q8', type: 'recall', section: 'Sequelae & Associated Injuries',
    stem: 'List the common and less common problems after temporal bone trauma in the Moneta deck.',
    answer: `Common:
• Facial nerve injury
• Cochleovestibular injury: sensorineural hearing loss, vertigo
• CSF leak

Less common:
• Conductive hearing loss
• Sympathetic SNHL
• Perilymphatic fistula
• Posttraumatic endolymphatic hydrops
• Cholesteatoma
• Meningocele or encephalocele
• Otogenic meningitis`,
    brief: 'Facial nerve, inner ear, and CSF leak first; delayed problems include cholesteatoma and meningitis.',
    detailed: 'Added: conductive loss after a longitudinal fracture is usually from hemotympanum or ossicular disruption, classically the incudostapedial joint, and can be assessed on audiogram once the blood clears. Cholesteatoma can follow entrapment of squamous epithelium in the fracture line years later. Pearl: warn patients that a late symptom (hearing drop, discharge, fever) needs review.',
    concepts: ['hearing-loss', 'late-sequelae'],
},
{
    id: 'q9', type: 'mcq', section: 'Sequelae & Associated Injuries',
    stem: 'A patient has profound sensorineural hearing loss and vertigo with nystagmus after a blow to the occiput. Which fracture type and mechanism fit?',
    options: [
        { id: 'a', text: 'Isolated EAC fracture'  },
        { id: 'b', text: 'Mastoid tip fracture'  },
        { id: 'c', text: 'Longitudinal, temporoparietal force'  },
        { id: 'd', text: 'Transverse or otic capsule-disrupting, from frontal or occipital force'  },
    ],
    correct: 'd',
    brief: 'Inner ear injury with vertigo: a transverse (capsule-disrupting) pattern.',
    detailed: 'A fracture through the otic capsule or the IAC injures the cochlea and labyrinth directly. The expected associated problems are CN VII paralysis, CSF leak, and delayed meningitis. Pearl: the sensorineural loss in a disrupting fracture is usually permanent.',
    concepts: ['otic-capsule', 'vestibular'],
},
{
    id: 'q10', type: 'mcq', section: 'Sequelae & Associated Injuries',
    stem: 'Which associated injuries are most common with temporal bone fractures in the deck?',
    options: [
        { id: 'a', text: 'Orbital apex syndrome'  },
        { id: 'b', text: 'Isolated ossicular injury'  },
        { id: 'c', text: 'Cervical spine injury only'  },
        { id: 'd', text: 'Intracranial injury (84%), lower cranial neuropathies (VI, IX to XI), and vascular injury'  },
    ],
    correct: 'd',
    brief: 'Intracranial injury is by far the most common (84%), then CN VI, IX to XI, and vascular injury.',
    detailed: 'The abducens nerve runs near the petrous apex (Dorello canal); the jugular foramen nerves lie medial to the bone. Pearl: neurosurgical assessment and the airway take priority over the ear.',
    concepts: ['associated-injuries'],
},

// ════════════════ FACIAL NERVE INJURY ════════════════

{
    id: 'q11', type: 'mcq', section: 'Facial Nerve Injury',
    stem: 'What is the incidence of facial nerve injury in otic capsule-disrupting versus otic capsule-sparing fractures?',
    options: [
        { id: 'a', text: '7 to 18% disrupting; 38 to 50% sparing'  },
        { id: 'b', text: '38 to 50% disrupting; 7 to 18% sparing'  },
        { id: 'c', text: 'About 3% for both'  },
        { id: 'd', text: '80 to 93% for both'  },
    ],
    correct: 'b',
    brief: 'Disrupting 38 to 50%; sparing 7 to 18%; children about 3%.',
    detailed: 'The sparing group has a lower proportion but, because these fractures are more numerous, accounts for the large majority of facial nerve injuries. The nerve is tethered by the greater superficial petrosal nerve in the perigeniculate region, so it is vulnerable to shearing. Pearl: do not assume that a lower rate means that few patients are affected.',
    concepts: ['fn-incidence'],
},
{
    id: 'q12', type: 'mcq', section: 'Facial Nerve Injury',
    stem: 'Rank the sites of facial nerve injury in temporal bone fractures from most to least common.',
    options: [
        { id: 'a', text: 'Geniculate ganglion (66%), second genu (20%), tympanic segment (8%), mastoid segment (6%)'  },
        { id: 'b', text: 'Tympanic segment, mastoid segment, geniculate, second genu'  },
        { id: 'c', text: 'Internal auditory canal, then all others equal'  },
        { id: 'd', text: 'Mastoid segment, tympanic segment, second genu, geniculate ganglion'  },
    ],
    correct: 'a',
    brief: 'Geniculate ganglion 66%, second genu 20%, tympanic 8%, mastoid 6%.',
    detailed: 'The deck also states 80 to 93% occur at the perigeniculate region or distal labyrinthine segment, because the nerve is tethered by the GSPN. This matters for the approach: decompression must reach the geniculate ganglion, which a transmastoid route alone does not. Pearl: the geniculate ganglion is the usual target, so a purely transmastoid decompression may leave the site of injury untouched.',
    concepts: ['fn-site'],
},
{
    id: 'q13', type: 'mcq', section: 'Facial Nerve Injury',
    stem: 'A patient with a temporal bone fracture has incomplete facial weakness that was present on arrival. What do the decks say about management?',
    options: [
        { id: 'a', text: 'Obtain ENoG and decompress if any degeneration'  },
        { id: 'b', text: 'Decompress within 24 hours'  },
        { id: 'c', text: 'Do not intervene: most patients with incomplete paralysis recover full function'  },
        { id: 'd', text: 'Perform a nerve graft'  },
    ],
    correct: 'c',
    brief: 'Incomplete paralysis, or delayed onset, usually recovers; do not intervene.',
    detailed: 'Delayed onset paralysis recovers to House-Brackmann grade I or II in 82 to 100%. When to intervene is controversial; the deck suggests considering decompression for immediate, complete paralysis in which ENoG after 72 hours shows more than 90 to 95% degeneration. Caveat: standard timing guidance for ENoG is between about 3 and 14 days after onset; the deck’s "after 72 hours" is the lower bound. Pearl: immediate onset suggests transection or compression; delayed onset suggests edema.',
    concepts: ['fn-management', 'fn-electrodiagnostics'],
},
{
    id: 'q14', type: 'recall', section: 'Facial Nerve Injury',
    stem: 'List the facial nerve decompression approaches in the Moneta deck and when each is used.',
    answer: `• Translabyrinthine — only if there is no serviceable hearing
• Transmastoid supralabyrinthine — one approach to the entire nerve; disadvantage: requires disarticulating the incus
• Transmastoid plus middle cranial fossa — the most common approach in patients with hearing`,
    brief: 'Hearing preserved: transmastoid plus middle cranial fossa; no hearing: translabyrinthine.',
    detailed: 'The choice is between sacrificing the labyrinth for the best exposure (translabyrinthine) and keeping hearing with a combined route that reaches the perigeniculate region from above. Pearl: the incus disarticulation of the supralabyrinthine approach causes a conductive loss that must be reconstructed.',
    concepts: ['fn-approaches'],
},
{
    id: 'q15', type: 'mcq', section: 'Facial Nerve Injury',
    stem: 'A patient with a transverse fracture has immediate complete facial paralysis and no cochlear function. Which decompression approach is appropriate if you decide to explore?',
    options: [
        { id: 'a', text: 'Translabyrinthine, since there is no serviceable hearing'  },
        { id: 'b', text: 'Transmastoid plus middle cranial fossa to preserve hearing'  },
        { id: 'c', text: 'Middle cranial fossa alone'  },
        { id: 'd', text: 'Observation only; surgery is never indicated'  },
    ],
    correct: 'a',
    brief: 'With no serviceable hearing, translabyrinthine gives the best nerve exposure.',
    detailed: 'Immediate, complete paralysis with greater than 90 to 95% degeneration is the situation in which decompression is considered. Because nothing remains to protect, translabyrinthine exposure of the whole intratemporal nerve is acceptable. Pearl: confirm that the contralateral ear hears before sacrificing the labyrinth.',
    concepts: ['fn-approaches', 'fn-management'],
},

// ════════════════ CSF LEAK ════════════════

{
    id: 'q16', type: 'recall', section: 'CSF Leak',
    stem: 'Outline conservative management of a CSF leak after temporal bone trauma.',
    answer: `• Head of bed elevated above 30 degrees
• Bedrest
• Stool softeners
• Prophylactic antibiotics
• If leak persists beyond 5 to 7 days: lumbar drain for 5 days
• If still leaking: surgery`,
    brief: 'Most leaks stop with positioning and time; a lumbar drain is the second step and surgery the third.',
    detailed: 'Caveat: the benefit of prophylactic antibiotics in basilar skull fracture is debated; the deck includes them (added). Avoid nose blowing and straining. Pearl: persistent leak means a persistent risk of meningitis.',
    concepts: ['csf-conservative'],
},
{
    id: 'q17', type: 'mcq', section: 'CSF Leak',
    stem: 'A persistent CSF leak after an otic capsule-disrupting fracture with profound SNHL needs surgery. Which procedure?',
    options: [
        { id: 'a', text: 'Intranasal mucoperichondrial flap to the cribriform plate'  },
        { id: 'b', text: 'Lumbar drain for 6 weeks'  },
        { id: 'c', text: 'Resection of the EAC and TM with obliteration of the middle ear and eustachian tube'  },
        { id: 'd', text: 'Mastoidectomy with a mini middle cranial fossa craniotomy'  },
    ],
    correct: 'c',
    brief: 'Capsule-disrupting with SNHL: close the ear (EAC, TM, middle ear and eustachian tube obliteration).',
    detailed: 'Since the ear has no hearing to save, the CSF pathway is removed by closing the canal and obliterating the middle ear and eustachian tube. For otic capsule-sparing leaks, a mastoidectomy with a mini middle cranial fossa craniotomy repairs the tegmen. The intranasal mucoperichondrial flap is for cribriform or fovea ethmoidalis leaks. Pearl: the approach matches the source and the hearing.',
    concepts: ['csf-surgery', 'otic-capsule'],
},
{
    id: 'q18', type: 'mcq', section: 'CSF Leak',
    stem: 'A patient with an otic capsule-sparing fracture and a tegmen leak with preserved hearing fails a lumbar drain. Which repair?',
    options: [
        { id: 'a', text: 'Intranasal flap'  },
        { id: 'b', text: 'Mastoidectomy with mini middle cranial fossa craniotomy'  },
        { id: 'c', text: 'Translabyrinthine closure'  },
        { id: 'd', text: 'Closure of the EAC with blind-sac obliteration'  },
    ],
    correct: 'b',
    brief: 'Sparing fracture with hearing: mastoidectomy plus mini middle cranial fossa craniotomy.',
    detailed: 'This protects hearing and repairs the tegmen from both sides. Pearl: do not obliterate a hearing ear.',
    concepts: ['csf-surgery'],
},

// ════════════════ CASES ════════════════

{
    id: 'q19', type: 'mcq', section: 'Cases',
    stem: 'A 25-year-old man is thrown from a motorcycle with a blow to the right temporoparietal region. He has blood in the right ear canal, a posterosuperior canal step-off, mild facial weakness (incomplete) noted on arrival, and a Rinne showing bone conduction better than air on the right. What is the fracture and the most likely cause of the hearing loss?',
    options: [
        { id: 'a', text: 'Transverse; sensorineural loss from a cochlear fracture'  },
        { id: 'b', text: 'Otic capsule-disrupting; sensorineural loss'  },
        { id: 'c', text: 'No fracture; wax impaction'  },
        { id: 'd', text: 'Longitudinal; conductive loss from hemotympanum or ossicular disruption'  },
    ],
    correct: 'd',
    brief: 'Temporoparietal force with canal step-off and conductive loss: longitudinal, capsule-sparing.',
    detailed: 'The lateral force, canal findings, and conductive loss fit longitudinal. Facial nerve injury is less likely in this type, and incomplete weakness usually recovers. Pearl: wait for the hemotympanum to clear before judging whether ossicular repair is needed.',
    concepts: ['case-longitudinal', 'long-vs-transverse', 'hearing-loss'],
},
{
    id: 'q20', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) What is the management of his facial weakness?',
    options: [
        { id: 'a', text: 'Nerve graft'  },
        { id: 'b', text: 'Immediate ENoG-guided surgery'  },
        { id: 'c', text: 'Urgent translabyrinthine decompression'  },
        { id: 'd', text: 'Observation: incomplete paralysis usually recovers fully'  },
    ],
    correct: 'd',
    brief: 'Incomplete paralysis: observe.',
    detailed: 'Most patients with incomplete paralysis recover full function. Eye protection and follow-up are needed; escalate only if it progresses to complete paralysis. Pearl: document House-Brackmann grade at each visit.',
    concepts: ['case-longitudinal', 'fn-management'],
},
{
    id: 'q21', type: 'mcq', section: 'Cases',
    stem: 'A 32-year-old is struck from behind on the occiput in an assault. He has profound right SNHL, vertigo with nystagmus beating away from the right, immediate complete right facial paralysis, and clear otorrhea. CT shows a fracture across the otic capsule. What are the type and the expected facial nerve site?',
    options: [
        { id: 'a', text: 'Capsule-sparing; second genu'  },
        { id: 'b', text: 'Transverse or capsule-disrupting; geniculate ganglion region most likely'  },
        { id: 'c', text: 'Longitudinal; mastoid segment'  },
        { id: 'd', text: 'Mixed; tympanic segment'  },
    ],
    correct: 'b',
    brief: 'Occipital force across the capsule: transverse, with the geniculate region the usual injury site.',
    detailed: 'Geniculate ganglion injury accounts for 66% of nerve injuries; capsule-disrupting fractures have the highest facial nerve rate (38 to 50%). Pearl: immediate complete paralysis, unlike delayed, suggests a structural injury.',
    concepts: ['case-transverse', 'otic-capsule', 'fn-site'],
},
{
    id: 'q22', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Seventy-two hours after injury ENoG shows 95% degeneration, and the patient has no serviceable hearing on the right. What next?',
    options: [
        { id: 'a', text: 'Consider translabyrinthine decompression'  },
        { id: 'b', text: 'Transmastoid plus middle cranial fossa to preserve hearing'  },
        { id: 'c', text: 'Observation, since all palsies recover'  },
        { id: 'd', text: 'Lumbar drain'  },
    ],
    correct: 'a',
    brief: 'Immediate, complete paralysis with more than 90 to 95% degeneration and no hearing: consider translabyrinthine decompression.',
    detailed: 'These are the deck’s criteria for considering decompression, which remains controversial. Pearl: the clear otorrhea also needs a plan (positioning, then drain, then closure of the ear if it persists), since an otic capsule-disrupting fracture carries a risk of delayed meningitis.',
    concepts: ['case-transverse', 'fn-approaches', 'fn-electrodiagnostics'],
},
{
    id: 'q23', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) The otorrhea persists beyond 7 days despite elevation and a 5-day lumbar drain. With a nonhearing ear, what is the definitive treatment?',
    options: [
        { id: 'a', text: 'Continued bedrest'  },
        { id: 'b', text: 'Intranasal flap'  },
        { id: 'c', text: 'Resect the EAC and TM, obliterate the middle ear and eustachian tube'  },
        { id: 'd', text: 'Mini middle cranial fossa craniotomy'  },
    ],
    correct: 'c',
    brief: 'Capsule-disrupting leak with SNHL: close and obliterate the ear.',
    detailed: 'This removes the pathway between the CSF and the middle ear in an ear with nothing to preserve. Pearl: this can be combined with the facial nerve decompression in the same sitting.',
    concepts: ['case-transverse', 'csf-surgery', 'meningitis'],
},
{
    id: 'q24', type: 'mcq', section: 'Cases',
    stem: 'A 28-year-old has a longitudinal temporal bone fracture. At 5 days a facial weakness appears and progresses to partial weakness, with eventual House-Brackmann grade IV, and ENoG is below 90% degeneration. What is the prognosis and plan?',
    options: [
        { id: 'a', text: 'Delayed onset: 82 to 100% recover to HB I or II; observe with eye care and steroids (added)'  },
        { id: 'b', text: 'Probable transection; exploration'  },
        { id: 'c', text: 'Poor; decompress immediately'  },
        { id: 'd', text: 'Poor; nerve graft'  },
    ],
    correct: 'a',
    brief: 'Delayed onset implies edema, not transection: expect recovery.',
    detailed: 'Delayed-onset paralysis recovers to House-Brackmann I or II in 82 to 100% in the deck, and the ENoG below the 90 to 95% threshold gives no indication to decompress. Pearl: serial ENoG shows whether degeneration crosses the threshold.',
    concepts: ['case-delayed-palsy', 'fn-management', 'fn-electrodiagnostics'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
