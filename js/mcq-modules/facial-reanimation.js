// ─────────────────────────────────────────────────────────────────────
// MODULE  ·  Facial Reanimation  ·  OCC Study-Module
// Source: AAO-HNSF Otolaryngology Core Curriculum — Facial Reanimation
// (Lu, Baddour, Coviello). © content paraphrased for study.
// ─────────────────────────────────────────────────────────────────────

const meta = {
  id: 'facial-reanimation',
  title: 'Facial\nReanimation',
  subtitle:
    'Forty-two MCQs spanning facial nerve anatomy and segments, physiology of aberrant regeneration, patient evaluation and grading scales, diagnostic workup, surgical and nonsurgical treatment, corneal protection, and three conference cases — Bell\'s palsy impostor, post-acoustic neuroma palsy, and Ramsay Hunt sequelae.',
  kicker: 'MCQ · Facial Plastics & Recon Module',
};

const DOMAINS = {
  anatomy:      { label: 'Anatomy',         color: '#7B5C3A', hex: 'rgba(123,92,58,0.13)' },
  physiology:   { label: 'Physiology',      color: '#7B6B85', hex: 'rgba(123,107,133,0.14)' },
  evaluation:   { label: 'Evaluation',      color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
  workup:       { label: 'Workup',          color: '#4A5C6B', hex: 'rgba(74,92,107,0.14)' },
  treatment:    { label: 'Treatment',       color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
  complications:{ label: 'Complications',   color: '#A0635E', hex: 'rgba(160,99,94,0.14)' },
  cases:        { label: 'Cases',           color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

  // anatomy
  'pharyngeal-arch':       { label: 'Pharyngeal Arch Origins',    domain: 'anatomy' },
  'nerve-segments':        { label: 'Intratemporal Segments',     domain: 'anatomy' },
  'geniculate-branches':   { label: 'Geniculate Ganglion',        domain: 'anatomy' },
  'tympanic-segment':      { label: 'Tympanic Segment',           domain: 'anatomy' },
  'mastoid-branches':      { label: 'Mastoid Segment Branches',   domain: 'anatomy' },
  'extratemporal':         { label: 'Extratemporal Landmarks',    domain: 'anatomy' },
  'surface-landmarks':     { label: 'Surface Reference Lines',    domain: 'anatomy' },

  // physiology
  'NFFP':                  { label: 'Nonflaccid Facial Palsy',    domain: 'physiology' },
  'synkinesis':            { label: 'Synkinesis',                 domain: 'physiology' },

  // evaluation
  'bilateral-palsy':       { label: 'Bilateral Palsy',            domain: 'evaluation' },
  'exam-findings':         { label: 'Clinical Examination',       domain: 'evaluation' },
  'house-brackmann':       { label: 'House-Brackmann Scale',      domain: 'evaluation' },
  'sunnybrook':            { label: 'Sunnybrook Scale',           domain: 'evaluation' },

  // workup
  'bells-palsy':           { label: "Bell's Palsy",               domain: 'workup' },
  'imaging':               { label: 'Imaging Indications',        domain: 'workup' },
  'electrodiagnostics':    { label: 'Electrodiagnostics',         domain: 'workup' },

  // treatment
  'acute-repair':          { label: 'Acute Nerve Repair',         domain: 'treatment' },
  'nerve-transfer':        { label: 'Nerve Transfer',             domain: 'treatment' },
  'CFNG':                  { label: 'Cross-Facial Nerve Graft',   domain: 'treatment' },
  'muscle-transfer':       { label: 'Muscle Transfer',            domain: 'treatment' },
  'eyelid':                { label: 'Eyelid Management',          domain: 'treatment' },
  'NFFP-treatment':        { label: 'NFFP Treatment Algorithm',   domain: 'treatment' },
  'chemodenervation':      { label: 'Chemodenervation',           domain: 'treatment' },

  // complications
  'corneal':               { label: 'Corneal Protection',         domain: 'complications' },

  // cases
  'case-scc':              { label: 'Case 1 · SCCa / Perineural', domain: 'cases' },
  'case-acoustic':         { label: 'Case 2 · Post-AN Resection', domain: 'cases' },
  'case-ramsay':           { label: 'Case 3 · Ramsay Hunt NFFP',  domain: 'cases' },

};

const ITEMS = [

  // ════════════════ ANATOMY ════════════════

  {
    id: 'q1',
    type: 'mcq',
    stem: 'The facial nerve (CN VII) derives from which pharyngeal arch, and which of the following structures shares that same arch of origin?',
    options: [
      { id: 'a', text: 'First arch; malleus and incus' },
      { id: 'b', text: 'Second arch; stapes superstructure, styloid process, and stylohyoid ligament' },
      { id: 'c', text: 'Third arch; stylopharyngeus and posterior tongue' },
      { id: 'd', text: 'Second arch; tensor tympani and tensor veli palatini' },
    ],
    correct: 'b',
    brief: 'CN VII arises from the second (hyoid) branchial arch, which also contributes the stapes superstructure, styloid process, stylohyoid ligament, and lesser cornu of the hyoid.',
    detailed: 'Each pharyngeal arch has its own nerve, vasculature, and skeletal derivatives. The second (hyoid) arch carries CN VII and gives rise to the facial muscles, stapes superstructure, styloid process, stylohyoid ligament, and lesser cornu of the hyoid. The first arch (mandibular) → CN V, malleus, incus, tensor tympani, tensor veli palatini. Confusing arches I and II is a classic exam trap: the tensor muscles and ossicular heads belong to arch I despite their proximity to arch-II derivatives. The arch derivation anchors why CN VII enters the temporal bone at a predictable location — at the internal acoustic meatus, where the arch-II nerve makes its intratemporal course.',
    concepts: ['pharyngeal-arch'],
  },

  {
    id: 'q2',
    type: 'mcq',
    stem: 'Which intratemporal segment of the facial nerve is the narrowest and shortest (3–5 mm), and why does this anatomy confer the highest risk of injury in temporal bone trauma?',
    options: [
      { id: 'a', text: 'Meatal segment — it lacks epineurium and perineurium' },
      { id: 'b', text: 'Tympanic segment — it has the highest rate of bony dehiscence (~30%)' },
      { id: 'c', text: 'Labyrinthine segment — it traverses the narrowest bony canal with no room for swelling' },
      { id: 'd', text: 'Mastoid segment — it runs vertically and is closest to the middle ear' },
    ],
    correct: 'c',
    brief: 'The labyrinthine segment (3–5 mm, IAC to geniculate ganglion) is the narrowest. Inflammatory edema or traumatic forces cause a compartment-syndrome equivalent within its confining canal.',
    detailed: 'The labyrinthine segment traverses the narrowest portion of the fallopian canal, from the lateral IAC to the geniculate ganglion (first genu). Because it has zero room for edema-related expansion, any swelling (Bell\'s palsy, herpes zoster) or fracture force produces immediate axonal compression — explaining the highest incidence of facial nerve injury in temporal bone fractures through this segment. The tympanic (horizontal) segment is also vulnerable but by a different mechanism: bony dehiscence over the oval window in ~30% of individuals makes it the highest-risk segment in iatrogenic middle-ear surgery. The meatal segment lacks epineurium/perineurium and is vulnerable to inflammatory infiltration but is not the narrowest. The mastoid segment courses vertically between the second genu and the stylomastoid foramen.',
    concepts: ['nerve-segments'],
  },

  {
    id: 'q3',
    type: 'mcq',
    stem: 'The greater superficial petrosal nerve (GSPN), arising at the geniculate ganglion, synpases in the pterygopalatine ganglion to supply parasympathetic secretomotor fibers to which target organs?',
    options: [
      { id: 'a', text: 'Submandibular and sublingual glands' },
      { id: 'b', text: 'Lacrimal, nasal, and palatine glands' },
      { id: 'c', text: 'Parotid gland via the otic ganglion' },
      { id: 'd', text: 'Middle meningeal artery (sympathetic tone)' },
    ],
    correct: 'b',
    brief: 'The GSPN synapses in the pterygopalatine ganglion and provides parasympathetic secretomotor innervation to the lacrimal, nasal, and palatine glands.',
    detailed: 'Three branches arise at the geniculate ganglion: (1) the GSPN, which carries parasympathetics to the pterygopalatine ganglion → lacrimal, nasal, and palatine glands; (2) the lesser petrosal nerve, which travels with CN IX (Jacobson\'s nerve) to the otic ganglion and the parotid (not a facial nerve branch to salivary glands in the traditional sense); and (3) the external petrosal nerve, which carries sympathetics to the middle meningeal artery. The submandibular and sublingual glands are supplied by the chorda tympani (mastoid segment), not the GSPN. The clinical relevance: skull-base surgery that sacrifices the GSPN eliminates lacrimal secretion, dramatically worsening exposure keratopathy in a patient with existing lagophthalmos — a critical risk-factor combination named explicitly in the module.',
    concepts: ['geniculate-branches', 'corneal'],
  },

  {
    id: 'q4',
    type: 'mcq',
    stem: 'Dehiscence of the bony fallopian canal is present in approximately 30% of normal individuals. In which facial nerve segment and anatomical location does this most commonly occur, and what is its surgical implication?',
    options: [
      { id: 'a', text: 'Labyrinthine segment over the geniculate ganglion; highest trauma risk' },
      { id: 'b', text: 'Tympanic (horizontal) segment over the oval window niche; highest iatrogenic risk in middle-ear surgery' },
      { id: 'c', text: 'Mastoid segment over the pyramidal eminence; risk during mastoidectomy' },
      { id: 'd', text: 'Meatal segment within the IAC; risk during posterior fossa surgery' },
    ],
    correct: 'b',
    brief: 'Dehiscence most commonly occurs in the tympanic (horizontal) segment, particularly over the oval window niche, leaving the nerve unprotected and at highest iatrogenic risk during ossiculoplasty, stapedectomy, or tympanoplasty.',
    detailed: 'The tympanic segment courses horizontally from the geniculate ganglion to the second genu (above the pyramidal eminence). Bony dehiscence in this segment occurs in approximately 30% of temporal bones, most commonly over the oval window niche. The nerve is anatomically present and follows its expected trajectory — it simply lacks bony coverage and may protrude into the middle-ear space. Preoperative CT temporal bone is essential to identify this variant and alert the surgeon. Dehiscence should not be confused with aberrant (ectopic) facial nerve, which follows an abnormal course and is associated with congenital aural atresia. The labyrinthine segment, though narrowest, has a much lower dehiscence rate. Mastoid segment dehiscence is less common and usually iatrogenic.',
    concepts: ['tympanic-segment'],
  },

  {
    id: 'q5',
    type: 'mcq',
    stem: 'A patient with facial palsy reports that loud sounds are painful on the affected side (hyperacusis). This symptom localizes the lesion to the facial nerve at or proximal to which branch point?',
    options: [
      { id: 'a', text: 'Chorda tympani takeoff in the mastoid segment' },
      { id: 'b', text: 'Nerve to the stapedius in the mastoid segment' },
      { id: 'c', text: 'Greater superficial petrosal nerve at the geniculate ganglion' },
      { id: 'd', text: 'Stylomastoid foramen (extratemporal trunk)' },
    ],
    correct: 'b',
    brief: 'Hyperacusis localizes the lesion to the mastoid segment at or proximal to the stapedius nerve branch. Loss of stapedius function removes the acoustic reflex, causing inability to attenuate loud sounds.',
    detailed: 'The mastoid (vertical) segment gives off three named branches in proximal-to-distal order: (1) nerve to the stapedius — loss of the stapedius reflex causes hyperacusis; (2) general sensory branch — cutaneous sensation to the posterior EAC and auricular concha (the anatomical basis of the Hitselberger sign in vestibular schwannoma); (3) chorda tympani — carries parasympathetics to the submandibular and sublingual glands and taste from the anterior two-thirds of the tongue. Localization uses the presence or absence of these functions: if hyperacusis AND taste loss are both present, the lesion is proximal to the chorda tympani takeoff within the mastoid segment. The GSPN (geniculate ganglion) loss would reduce lacrimal secretion — not cause hyperacusis. The stylomastoid foramen is distal to all three mastoid-segment branches.',
    concepts: ['mastoid-branches'],
  },

  {
    id: 'q6',
    type: 'mcq',
    stem: 'During a parotidectomy, the surgeon locates the facial nerve trunk using the "tragal pointer" landmark. Where does the nerve lie relative to the tip of the tragal cartilage?',
    options: [
      { id: 'a', text: '2 cm inferior and anterior to the tip' },
      { id: 'b', text: 'At the level of the tympanomastoid suture line, immediately medial' },
      { id: 'c', text: 'Approximately 1 cm inferior and posterior to the tip' },
      { id: 'd', text: 'Immediately superior to the posterior belly of the digastric' },
    ],
    correct: 'c',
    brief: 'The facial nerve trunk lies approximately 1 cm inferior and posterior to the tip of the tragal cartilage — the most commonly used primary landmark during parotidectomy.',
    detailed: 'Three anatomical landmarks identify the extratemporal facial nerve trunk: (1) the tragal pointer — the nerve lies ~1 cm inferior and posterior to its tip and is the surgeon\'s first intraoperative reference; (2) the tympanomastoid suture line — the nerve lies several millimeters inferior to this suture, useful in revision surgery where scarring has obscured soft tissue planes; (3) the posterior belly of the digastric — the nerve runs immediately superior to this muscle at the stylomastoid foramen. Note that "immediately superior to the digastric" describes landmark 3 (option D), which is correct for that specific landmark but is not the description of the tragal pointer relationship. The retromandibular vein is useful for locating the intraparotid divisions but does not identify the main trunk.',
    concepts: ['extratemporal'],
  },

  {
    id: 'q7',
    type: 'mcq',
    stem: "Pitanguy's line is a surface reference drawn from 0.5 cm below the tragus to 1.5 cm superior to the lateral eyebrow. It approximates the course of which facial nerve branch, and at what anatomical landmark does this branch cross?",
    options: [
      { id: 'a', text: 'Zygomatic branch; crosses at the inferior orbital rim' },
      { id: 'b', text: 'Buccal branch; crosses at the anterior border of the masseter' },
      { id: 'c', text: 'Temporal (frontal) branch; crosses the zygomatic arch' },
      { id: 'd', text: 'Marginal mandibular branch; crosses the inferior border of the mandible' },
    ],
    correct: 'c',
    brief: "Pitanguy's line approximates the temporal (frontal) branch crossing the zygomatic arch, approximately 4 cm behind the lateral canthus (10–19 mm anterior to the EAC).",
    detailed: "Pitanguy's line is drawn from 0.5 cm below the tragus to 1.5 cm superior to the lateral eyebrow. This corresponds to the temporal branch of the facial nerve as it crosses the zygomatic arch. Injury here produces frontalis paralysis with brow ptosis — a highly visible and functionally significant deficit. The landmark guides surgical dissection in browlifts, lateral facelifts, and coronal flaps. Zuker's point is the companion landmark for the zygomatic/buccal branch: the midpoint of a line from the root of the helix to the lateral oral commissure, where the branch innervating the zygomaticus major is reliably identified for nerve transfers and CFNG harvest. Neither the marginal mandibular nor buccal branches cross the zygomatic arch.",
    concepts: ['surface-landmarks'],
  },

  {
    id: 'q8',
    type: 'mcq',
    stem: 'The Hayes-Martin maneuver — ligation of the facial artery and vein with superior elevation of the deep cervical fascia — is used in submandibular triangle dissection to protect which nerve?',
    options: [
      { id: 'a', text: 'Lingual nerve' },
      { id: 'b', text: 'Hypoglossal nerve (CN XII)' },
      { id: 'c', text: 'Cervical branch of the facial nerve' },
      { id: 'd', text: 'Marginal mandibular nerve' },
    ],
    correct: 'd',
    brief: 'The Hayes-Martin maneuver protects the marginal mandibular nerve, which dips into the submandibular triangle deep to the platysma and can be elevated out of harm\'s way by lifting the deep cervical fascia superiorly.',
    detailed: 'The marginal mandibular nerve runs deep to the platysma, coursing inferior to the mandible before looping back up into the submandibular triangle in many individuals. Injury produces paralysis of the depressor anguli oris, depressor labii inferioris, and mentalis — causing inability to depress the oral commissure and lower lip, with visible asymmetry during smiling and lip separation. The Hayes-Martin maneuver (ligation of facial artery and vein at the inferior border of the mandible with upward elevation of the fascial plane) mobilizes the nerve superiorly and is the key protective maneuver during submandibular gland excision and Level I neck dissection. The cervical branch (platysma innervation) and hypoglossal nerve are anatomically separate and are not the targets of this specific maneuver.',
    concepts: ['extratemporal', 'surface-landmarks'],
  },

  // ════════════════ PHYSIOLOGY ════════════════

  {
    id: 'q9',
    type: 'mcq',
    stem: 'Nonflaccid facial palsy (NFFP) results from aberrant nerve regeneration after an acute facial palsy. When does this process begin, and for how long does it evolve?',
    options: [
      { id: 'a', text: 'Begins at 1–2 weeks; evolves for up to 6 months' },
      { id: 'b', text: 'Begins at 1–2 months; evolves for up to 12 months' },
      { id: 'c', text: 'Begins at 3–4 months; evolves for up to 2 years' },
      { id: 'd', text: 'Begins at 6 months; evolves indefinitely without treatment' },
    ],
    correct: 'c',
    brief: 'NFFP begins as early as 3–4 months after initial paralysis and continues to evolve for up to 2 years, as aberrant axonal sprouting progressively reinnervates both intended and unintended muscles.',
    detailed: 'After Wallerian degeneration, proximal axons regenerate and sprout. The process is disordered — axons reroute to muscles they did not originally innervate, producing synkinesis, hypertonicity, gustatory epiphora (crocodile tears from aberrant GSPN/salivary cross-wiring), and platysmal banding. This begins as early as 3–4 months and continues for up to 2 years post-paralysis. Clinical counseling implication: patients recovering from Bell\'s palsy or Ramsay Hunt who develop synkinesis should be informed that the pattern may worsen for up to two years. This also distinguishes partial recovery with synkinesis (normal NFFP trajectory) from complete flaccid non-recovery (atypical → imaging warranted). The timeline drives when to start botulinum toxin — typically once the synkinesis pattern is established, but PT can begin immediately.',
    concepts: ['NFFP', 'synkinesis'],
  },

  {
    id: 'q10',
    type: 'mcq',
    stem: 'Which of the following best describes the mechanism of synkinesis after facial nerve injury?',
    options: [
      { id: 'a', text: 'A reflex arc where stimulation of one muscle group triggers contraction of another via an abnormal interneuron' },
      { id: 'b', text: 'Co-contraction from aberrant axonal sprouting, where one motor neuron sends branches to multiple unintended muscle groups' },
      { id: 'c', text: 'Ephaptic transmission between adjacent nerve fibers within the compressed labyrinthine segment' },
      { id: 'd', text: 'Cortical reorganization that drives compensatory recruitment of ipsilateral muscles' },
    ],
    correct: 'b',
    brief: 'Synkinesis results from co-contraction: after Wallerian degeneration, sprouting motor axons reinnervate unintended muscles, so volitional activation of one muscle group simultaneously activates the misdirected co-innervated group.',
    detailed: 'The two classic patterns are (1) oro-ocular synkinesis — eye closes involuntarily with smiling (most common and socially disabling) — and (2) oculo-oral synkinesis — oral commissure twitches with blinking. Both arise from the same mechanism: aberrant axonal sprouting after Wallerian degeneration, where an axon originally innervating one muscle group sends new branches to a different group. The result is simultaneous, unwanted contraction — this is co-contraction, not a reflex arc. Ephaptic transmission (direct electrical cross-talk between adjacent nerve fibers) has been proposed as an additional contributor in the compressed labyrinthine segment but is not the dominant mechanism for synkinesis in postparalytic patients. Treatment of oro-ocular synkinesis primarily targets the overactive orbicularis oculi with chemodenervation and neuromuscular retraining.',
    concepts: ['synkinesis', 'NFFP'],
  },

  // ════════════════ PATIENT EVALUATION ════════════════

  {
    id: 'q11',
    type: 'mcq',
    stem: 'Synchronous bilateral facial paralysis is defined as bilateral onset within three weeks of each other. What etiology should be presumed, and which single infectious cause is the most important to identify?',
    options: [
      { id: 'a', text: 'Peripheral neuropathy; Guillain-Barré syndrome' },
      { id: 'b', text: 'Systemic etiology; Lyme disease' },
      { id: 'c', text: 'Idiopathic bilateral Bell\'s palsy; HSV-1 reactivation' },
      { id: 'd', text: 'Neoplastic; parotid malignancy' },
    ],
    correct: 'b',
    brief: 'Synchronous bilateral palsy is presumed systemic until proven otherwise. Lyme disease is the single most important reversible infectious cause — missing it means inadequate antibiotics and potentially permanent palsy.',
    detailed: 'Unilateral Bell\'s palsy has a bilaterality rate of only ~0.3%; simultaneous bilateral palsy has a dramatically higher likelihood of a systemic etiology. The work-up should cover: autoimmune/inflammatory causes (sarcoidosis, Guillain-Barré), infectious causes (Lyme disease — particularly in endemic regions, EBV), and neoplastic causes (bilateral parotid involvement, lymphoma). The operative definition of "synchronous" is within 3 weeks. Sequential bilateral palsy separated by months represents a different entity (recurrent Bell\'s palsy). Among the infectious causes, Lyme disease (Borrelia burgdorferi) is uniquely treatable with antibiotics and should be tested for in all bilateral presentations regardless of geographic exposure history — given its potentially reversible nature if treated adequately.',
    concepts: ['bilateral-palsy'],
  },

  {
    id: 'q12',
    type: 'mcq',
    stem: 'On examination, a patient with a 6-month history of prior Bell\'s palsy shows a narrowed palpebral fissure, deepened nasolabial fold on the affected side, and involuntary eye closure when smiling. How does this presentation differ from flaccid facial palsy?',
    options: [
      { id: 'a', text: 'Flaccid palsy also shows a narrowed palpebral fissure due to orbicularis hypertonicity' },
      { id: 'b', text: 'Flaccid palsy shows a widened palpebral fissure and effaced NLF; synkinesis is absent' },
      { id: 'c', text: 'Flaccid palsy shows a widened palpebral fissure but an equally deepened NLF' },
      { id: 'd', text: 'The presentation described is still consistent with flaccid palsy evolving over 6 months' },
    ],
    correct: 'b',
    brief: 'Flaccid palsy shows a widened palpebral fissure (no orbicularis tone), an effaced NLF, a drooped commissure, and no synkinesis. NFFP shows the opposite: narrowed fissure, deepened NLF, hypertonicity, and synkinesis.',
    detailed: 'The distinction between flaccid and nonflaccid (postparalytic) facial palsy is the cornerstone of the treatment algorithm. Flaccid: widened palpebral fissure (paralytic lagophthalmos), effaced NLF, drooped commissure, absent tone at rest, no synkinesis. NFFP: narrowed palpebral fissure (orbicularis hypertonicity), deepened NLF (hypertonicity pulls it deeper), restricted commissure excursion with synkinetic co-contraction of antagonist muscles, elevated tone at rest. The clinical example in the question — narrowed fissure, deepened NLF, oro-ocular synkinesis — is textbook NFFP. Treating this as flaccid palsy (e.g., with a nerve transfer) would worsen synkinesis. Treating flaccid palsy with PT and chemodenervation alone would miss the opportunity for nerve or muscle restoration.',
    concepts: ['exam-findings', 'NFFP'],
  },

  {
    id: 'q13',
    type: 'mcq',
    stem: 'A patient presents with no visible facial movement at rest or with maximal effort, no facial symmetry, and no forehead movement. What is his House-Brackmann (HB) grade, and what distinguishes it from Grade V?',
    options: [
      { id: 'a', text: 'HB IV — incomplete eye closure and no forehead movement' },
      { id: 'b', text: 'HB V — barely perceptible movement; asymmetry at rest; incomplete eye closure' },
      { id: 'c', text: 'HB VI — total paralysis; no movement; no facial symmetry at rest or with effort' },
      { id: 'd', text: 'HB III — obvious asymmetry but complete eye closure with effort' },
    ],
    correct: 'c',
    brief: 'HB Grade VI is total paralysis — no movement whatsoever. Grade V differs in that barely perceptible movement is still present. The clinical distinction matters for prognosis and reanimation planning.',
    detailed: 'House-Brackmann scale: I = Normal; II = Mild (slight weakness, normal closure, slight asymmetry of smile); III = Moderate (obvious asymmetry, complete eye closure with effort, good forehead); IV = Moderately severe (obvious asymmetry, incomplete eye closure, no forehead); V = Severe (barely perceptible movement, asymmetry at rest, incomplete eye closure); VI = Total paralysis (no movement, no symmetry at rest or with movement). The key discriminators: III vs IV — completeness of eye closure (III closes with effort; IV does not) and forehead movement (III has it; IV does not). IV vs V — both have incomplete closure, but V has barely any voluntary movement at all. V vs VI — barely perceptible movement is present in V; VI has truly none. This matters clinically: Grade VI cannot generate voluntary signals to provide ENoG data and drives the most urgent corneal protection and surgical planning.',
    concepts: ['house-brackmann'],
  },

  {
    id: 'q14',
    type: 'mcq',
    stem: 'The Sunnybrook Facial Grading System assesses three domains and produces a composite score. Which formula correctly represents the Sunnybrook composite score?',
    options: [
      { id: 'a', text: 'Voluntary movement score + resting symmetry score + synkinesis score' },
      { id: 'b', text: 'Voluntary movement score − resting symmetry score − synkinesis score' },
      { id: 'c', text: 'Resting symmetry score − synkinesis score (voluntary movement not included)' },
      { id: 'd', text: 'Voluntary movement score − synkinesis score only (resting symmetry assessed separately)' },
    ],
    correct: 'b',
    brief: 'Sunnybrook composite = Voluntary movement score − Resting symmetry score − Synkinesis score. Range 0–100; 100 = normal. Subtracting the deficits means a higher score reflects better function.',
    detailed: 'The three Sunnybrook domains: (1) Resting symmetry — scored across eye, cheek (nasolabial fold), and mouth, then multiplied by 5; (2) Voluntary motion — five standard expressions (brow lift, gentle eye closure, snarl, open-mouth smile, lip pucker), scores summed and multiplied by 4; (3) Synkinesis — rated for the same five expressions on a 0–3 scale. Composite = Voluntary motion − Resting symmetry − Synkinesis. The Sunnybrook is more sensitive than the HB scale because it quantifies regional function, captures synkinesis severity numerically, and is responsive to treatment changes. The eFACE (electronic version, 16 items, app-based) provides even finer longitudinal tracking with static, dynamic, and synkinesis subscores — used increasingly in clinical trials and high-volume facial nerve programs.',
    concepts: ['sunnybrook', 'house-brackmann'],
  },

  // ════════════════ WORKUP & DIAGNOSIS ════════════════

  {
    id: 'q15',
    type: 'mcq',
    stem: "Bell's palsy is a clinical diagnosis of exclusion. Which of the following, if present, is INCONSISTENT with the diagnosis of Bell's palsy and requires further work-up?",
    options: [
      { id: 'a', text: 'Ear pain and mild taste change on the affected side' },
      { id: 'b', text: 'Facial weakness progressing over 48 hours involving all branches' },
      { id: 'c', text: 'Ipsilateral sensorineural hearing loss and vertigo' },
      { id: 'd', text: 'Hyperacusis on the affected side' },
    ],
    correct: 'c',
    brief: "Sensorineural hearing loss and vertigo are not features of Bell's palsy. Their presence indicates an otologic process — most commonly herpes zoster oticus (Ramsay Hunt), labyrinthitis, or temporal bone tumor — and mandates work-up.",
    detailed: "Bell's palsy requires: acute onset (progression within 72 hours), all facial nerve branches involved, and ABSENCE of hearing loss, vertigo, other cranial neuropathies, or neurologic changes. Ear pain and taste change (chorda tympani involvement) are compatible with Bell's palsy. Hyperacusis (stapedius branch involvement) is also compatible. Progression over 48 hours is within the 72-hour window. SNHL and vertigo raise the differential diagnosis immediately: herpes zoster oticus (Ramsay Hunt) if vesicles are present; labyrinthitis; temporal bone tumor; cholesteatoma with labyrinthine fistula. The presence of other cranial neuropathies (CN V numbness, CN IX, X involvement) similarly disqualifies Bell's palsy as a working diagnosis and demands imaging.",
    concepts: ['bells-palsy'],
  },

  {
    id: 'q16',
    type: 'mcq',
    stem: "A 34-year-old presents with 36 hours of progressive unilateral facial weakness involving all branches, ear discomfort, mild taste change, and no other symptoms. Per AAO-HNSF guidelines, what is the most appropriate management?",
    options: [
      { id: 'a', text: 'MRI with gadolinium within 24 hours; defer steroids pending imaging' },
      { id: 'b', text: 'Antiviral monotherapy (acyclovir) — steroids are contraindicated given viral etiology' },
      { id: 'c', text: 'Oral corticosteroids started within 72 hours of onset; no routine imaging or lab testing' },
      { id: 'd', text: 'Electroneurography (ENoG) within 48 hours to establish baseline severity' },
    ],
    correct: 'c',
    brief: "For new-onset Bell's palsy, oral corticosteroids within 72 hours are the evidence-based intervention. MRI, labs, and ENoG are not routinely indicated for a straightforward presentation.",
    detailed: "AAO-HNSF Quality Measure #13 explicitly advises against routine imaging and lab testing for uncomplicated Bell's palsy. Steroids (prednisone, 10-day course) are the only intervention with strong evidence of benefit — and the 72-hour window is critical; delaying beyond this substantially diminishes anti-inflammatory effect within the confined labyrinthine segment. Antivirals alone have no standalone evidence; the combination with steroids has modest supporting data in severe (HB V–VI) cases. ENoG should NOT be performed in patients with incomplete facial paralysis (it is reserved for complete paralysis cases when surgical decompression is being considered, ideally at 3–21 days). Imaging is indicated when red flags are present: bilateral palsy, other cranial neuropathies, hearing loss, no recovery by 4–6 months, recurrent ipsilateral palsy, or history of malignancy.",
    concepts: ['bells-palsy', 'imaging', 'electrodiagnostics'],
  },

  {
    id: 'q17',
    type: 'mcq',
    stem: 'MRI with and without gadolinium is NOT a routine first-line test for Bell\'s palsy, but five indications warrant obtaining it. Which of the following would NOT independently indicate MRI in a patient with facial palsy?',
    options: [
      { id: 'a', text: 'Flaccid facial paralysis beyond 4 months with no signs of recovery' },
      { id: 'b', text: 'Recurrent ipsilateral facial paralysis (second episode)' },
      { id: 'c', text: 'New-onset complete unilateral palsy improving on oral steroids at 2 weeks' },
      { id: 'd', text: 'Concurrent ipsilateral sensorineural hearing loss and tinnitus' },
    ],
    correct: 'c',
    brief: 'A new-onset complete palsy that is actively improving on steroids at 2 weeks is on the expected Bell\'s palsy recovery trajectory. The other options represent atypical, progressive, or recurrent courses requiring imaging.',
    detailed: "Indications for MRI with gadolinium in facial palsy: (1) Incomplete and/or progressive paralysis; (2) Recurrent ipsilateral palsy; (3) Concurrent additional cranial neuropathies; (4) Associated otologic symptoms (hearing loss, tinnitus, otalgia, vestibular symptoms); (5) Flaccid facial paralysis beyond 4 months with no recovery; (6) Clinical suspicion for neoplasm; (7) Any feature inconsistent with Bell's palsy. A patient with a straightforward presentation who is actively improving at 2 weeks is on the normal trajectory — no imaging is needed. MRI with gadolinium is preferred (not CT) because it covers the entire facial nerve course from IAC to the parotid bed, detects perineural spread, and identifies soft-tissue skull-base pathology. CT is reserved for temporal bone trauma or suspected fallopian canal widening by neoplasm.",
    concepts: ['imaging', 'bells-palsy'],
  },

  {
    id: 'q18',
    type: 'mcq',
    stem: 'Electroneurography (ENoG) measures compound muscle action potential (CMAP) amplitude compared to the unaffected side after supramaximal stimulation. What is the optimal timing window for ENoG following acute facial palsy, and why?',
    options: [
      { id: 'a', text: '0–48 hours — before any Wallerian degeneration begins' },
      { id: 'b', text: '72 hours to 21 days — Wallerian degeneration has rendered distal axons non-viable, and reinnervation has not yet confounded results' },
      { id: 'c', text: '3 weeks to 3 months — at peak EMG signal strength' },
      { id: 'd', text: '2–6 months — when muscle fibrosis is most predictable' },
    ],
    correct: 'b',
    brief: 'ENoG is valid from 72 hours (when Wallerian degeneration has reached the extratemporal nerve) to 21 days (before reinnervation potentials begin to confound the CMAP signal).',
    detailed: 'Within the first 72 hours of acute facial palsy, Wallerian degeneration has not yet reached the extratemporal nerve — the distal nerve still conducts and ENoG may appear falsely normal despite a severe proximal lesion. After 21 days, early reinnervation potentials begin to contribute to the CMAP, making the amplitude reduction appear artificially smaller (falsely improved). The 72-hour to 21-day window is therefore the validated period. Interpretation: ≥90% reduction in CMAP amplitude compared to the normal side within this window correlates with a poor prognosis for spontaneous recovery and, in traumatic complete palsy, is a relative indication for surgical decompression at some centers (though this remains controversial). ENoG cannot distinguish neurapraxia from axonotmesis — needle EMG is needed for that.',
    concepts: ['electrodiagnostics'],
  },

  {
    id: 'q19',
    type: 'mcq',
    stem: 'What is the critical clinical advantage of needle EMG (nEMG) over ENoG in facial nerve assessment, and when is nEMG most valuable?',
    options: [
      { id: 'a', text: 'nEMG can identify Wallerian degeneration earlier (within 24 hours) than ENoG' },
      { id: 'b', text: 'nEMG quantifies CMAP amplitude reduction, providing a prognosis number not available from ENoG' },
      { id: 'c', text: 'nEMG distinguishes neurapraxia from axonotmesis/neurotmesis, and can detect early reinnervation before visible movement returns' },
      { id: 'd', text: 'nEMG is the only test that can determine the site of lesion within the intratemporal segments' },
    ],
    correct: 'c',
    brief: 'nEMG uniquely differentiates neurapraxia (intact axon, no fibrillations, good prognosis) from axonotmesis/neurotmesis (fibrillation potentials, requires surgical planning), and reveals nascent MUAPs of early reinnervation before clinical movement appears.',
    detailed: 'ENoG and nEMG are complementary. ENoG (optimal at 3–21 days) gives the severity index via CMAP amplitude reduction. nEMG (optimal at 2–3 weeks to 3 months) characterizes the injury type: neurapraxia = conduction block, intact axon, no Wallerian degeneration, no fibrillation potentials, good prognosis for full spontaneous recovery; axonotmesis = disrupted axon with intact Schwann tube, fibrillation potentials present, regeneration possible along the original path; neurotmesis = complete nerve disruption, fibrillation potentials, no voluntary MUAPs, surgical repair required for any recovery. nEMG also detects nascent (polyphasic) MUAPs — the electrophysiologic signature of early reinnervation — before any visible facial movement returns, providing early prognostic optimism. Neither test is appropriate in incomplete Bell\'s palsy at initial presentation.',
    concepts: ['electrodiagnostics'],
  },

  // ════════════════ TREATMENT ════════════════

  {
    id: 'q20',
    type: 'mcq',
    stem: 'A patient undergoes resection of a parotid malignancy with intraoperative transection of the facial nerve trunk. What is the optimal repair strategy if the surgeon acts within 72 hours, and what is the realistic expected outcome?',
    options: [
      { id: 'a', text: 'Interposition cable graft with sural nerve only — direct repair is always under too much tension after tumor resection' },
      { id: 'b', text: 'Tension-free primary epineural coaptation if approximation is possible; interposition cable graft if not — expected HB III in ≥50%' },
      { id: 'c', text: 'Masseteric nerve (NTM) transfer to distal facial nerve — more reliable than direct repair' },
      { id: 'd', text: 'Delay all nerve repair 3 months to allow wound healing, then perform secondary neurorrhaphy' },
    ],
    correct: 'b',
    brief: 'Tension-free primary epineural coaptation is the gold standard when achievable; a cable graft (great auricular, sural, or lateral antebrachial cutaneous nerve) is used when a gap exists. The expected outcome is HB Grade III in at least 50% of cases.',
    detailed: 'The 72-hour window offers a critical intraoperative advantage: before Wallerian degeneration, the distal nerve branches can still be electrically stimulated and visually identified — essential when working in an edematous, complex surgical field. Tension is the enemy of nerve repair — a well-tensioned interposition graft outperforms a direct repair under tension. Cable graft donor options include great auricular nerve (most accessible, harvested from the ipsilateral neck simultaneously), sural nerve, lateral antebrachial cutaneous nerve, or the motor nerve to vastus lateralis for larger caliber mismatches. HB Grade III is the realistic benchmark for nerve repair outcomes — not HB I or II. Setting appropriate expectations prevents patient disappointment when surgical success does not yield a "normal" face. NTM transfer is appropriate when the proximal facial nerve is unavailable, not as a substitute for primary repair when the proximal nerve is present.',
    concepts: ['acute-repair'],
  },

  {
    id: 'q21',
    type: 'mcq',
    stem: 'The masseteric nerve (NTM) and hypoglossal nerve (CN XII) are the two main ipsilateral donor nerves for facial reanimation when the proximal facial nerve is unavailable. What is the key advantage of each?',
    options: [
      { id: 'a', text: 'NTM: superior resting tone; Hypoglossal: robust dynamic smile excursion' },
      { id: 'b', text: 'NTM: minimal donor deficit if anterior branch preserved; Hypoglossal: superior resting tone vs. NTM' },
      { id: 'c', text: 'NTM: spontaneous emotionally-driven smile; Hypoglossal: high axonal load without tongue hemiatrophy' },
      { id: 'd', text: 'Both provide equal functional outcomes; choice is based on patient preference only' },
    ],
    correct: 'b',
    brief: 'NTM\'s advantage is high axonal load and minimal donor deficit (when the anterior branch to masseter bulk is preserved); hypoglossal\'s advantage is superior resting tone compared to NTM, though traditional complete transection risks tongue hemiatrophy.',
    detailed: 'NTM (masseteric nerve): contains >2,700 myelinated fibers; located 3 cm anterior to the tragus, 1 cm inferior to the zygomatic arch; its main advantage is robust dynamic smile excursion with minimal donor morbidity when the anterior masseteric branch is preserved. Disadvantage: limited resting tone and volitional activation (patient must clench jaw to smile). Hypoglossal (CN XII): advantage is superior resting tone compared to NTM; used when resting symmetry is the dominant deficit. Disadvantage: traditional complete transection causes ipsilateral tongue hemiatrophy and dysphagia; modern partial (end-to-side or "split") techniques mitigate this. NTM has become the preferred first-line at most centers. Hypoglossal is chosen for resting tone dominance or combined dual transfer. Neither NTM nor hypoglossal restores spontaneous, emotionally-driven smile — only CFNG can provide that potential.',
    concepts: ['nerve-transfer'],
  },

  {
    id: 'q22',
    type: 'mcq',
    stem: 'Cross-facial nerve grafting (CFNG) uses expendable contralateral zygomatic/buccal branches connected by a sural nerve interposition graft. What is its main limitation, and what is its unique advantage over ipsilateral nerve transfers?',
    options: [
      { id: 'a', text: 'Limitation: high donor morbidity to the contralateral face; Advantage: larger axonal load than masseteric nerve' },
      { id: 'b', text: 'Limitation: significant axonal attrition across the long graft length; Advantage: only technique that can restore spontaneous, emotionally-driven smile' },
      { id: 'c', text: 'Limitation: cannot reinnervate the orbicularis oculi; Advantage: restores resting tone better than hypoglossal transfer' },
      { id: 'd', text: 'Limitation: requires three-stage procedure; Advantage: eliminates need for free muscle transfer' },
    ],
    correct: 'b',
    brief: 'CFNG\'s main limitation is substantial axonal loss across the long graft distance, reducing reinnervation amplitude. Its unique advantage is that it drives from the contralateral cortex via the contralateral facial nerve — the only way to restore spontaneous, emotionally-driven smile.',
    detailed: 'CFNG traverses the upper lip, crossing from the contralateral intact facial nerve (redundant zygomatic/buccal branches — their sacrifice causes no detectable deficit due to overlapping innervation) to the affected side via a sural nerve graft. The major limitation is axonal attrition: by the time regenerating axons cross the long graft and reach their target, axonal density is substantially reduced. This limits movement amplitude and is why CFNG alone rarely produces strong excursion. However, CFNG is the only technique driven by the contralateral motor cortex during spontaneous emotional expression — making it the only path to truly spontaneous smile. In contemporary dual-innervation gracilis free muscle transfer, NTM provides reliable axonal load for resting tone and volitional movement, while CFNG is coapted to a separate intramuscular nerve branch to provide spontaneity potential — combining the advantages of both.',
    concepts: ['CFNG', 'nerve-transfer'],
  },

  {
    id: 'q23',
    type: 'mcq',
    stem: 'For chronic flaccid facial palsy without viable native musculature, a single-stage procedure that provides IMMEDIATE improvement in resting facial symmetry is preferred for an elderly patient with multiple medical comorbidities. Which option best fits this profile?',
    options: [
      { id: 'a', text: 'Gracilis free muscle transfer (GFMT) with masseteric nerve innervation' },
      { id: 'b', text: 'Cross-facial nerve graft (CFNG) alone' },
      { id: 'c', text: 'Temporalis tendon transfer (TTT)' },
      { id: 'd', text: 'Dual-innervation GFMT (NTM + CFNG)' },
    ],
    correct: 'c',
    brief: 'Temporalis tendon transfer (TTT) is single-stage, requires shorter anesthesia, provides immediate resting symmetry improvement, and has minimal donor morbidity — the optimal profile for frail or elderly patients.',
    detailed: 'TTT transfers the temporalis tendon (with or without a fascia lata extension) to the oral commissure, using the trigeminal-innervated temporalis muscle to animate the corner of the mouth. Key advantages: single-stage, immediate resting symmetry improvement, short operative time, minimal donor morbidity. Disadvantages: movement requires volitional jaw clenching (no spontaneity); fixed single vector; does not preclude future GFMT. GFMT is the gold standard for comprehensive reanimation in younger, motivated patients willing to wait 6–12 months for reinnervation. Dual-innervation GFMT (NTM + CFNG) is the most common contemporary approach at high-volume centers for maximizing both excursion quality and spontaneity, but it requires staged surgery and long anesthesia. TTT and GFMT are complementary — TTT can be performed first for immediate functional rehabilitation, with GFMT added later if additional smile quality is desired.',
    concepts: ['muscle-transfer'],
  },

  {
    id: 'q24',
    type: 'mcq',
    stem: 'Upper eyelid platinum weights are preferred over gold for static eyelid loading in lagophthalmos. Which physical property of platinum drives this preference?',
    options: [
      { id: 'a', text: 'Platinum is biologically inert while gold causes allergic reactions in all patients' },
      { id: 'b', text: 'Platinum has a higher density than gold, allowing a smaller, lower-profile implant to achieve the same gravitational force' },
      { id: 'c', text: 'Platinum provides stronger active contraction force than gold during Bell\'s reflex' },
      { id: 'd', text: 'Platinum weights are sutured rather than implanted, making revision simpler' },
    ],
    correct: 'b',
    brief: 'Platinum\'s higher density means a smaller-volume implant delivers the same gravitational force, resulting in a lower-profile lid contour, lower extrusion rate, and lower allergic reaction and capsule formation rates.',
    detailed: 'Upper eyelid weighting works via gravity-assisted lid closure: the weight helps close the lid when the patient is upright; Bell\'s reflex (upward globe rotation during attempted closure) provides additional corneal protection in supine position. Gold weights are not ineffective — they work — but platinum\'s higher density (~21.4 g/cm³ vs gold\'s ~19.3 g/cm³) allows a smaller footprint for the same mass. Smaller implant footprint → less visible lid contour deformity → better cosmesis in a patient already dealing with facial asymmetry. Additional advantages of platinum over gold: lower extrusion rate, lower allergic/inflammatory reaction rate, and lower thickened capsule formation rate. Tarsorrhaphy (partial or complete lid fusion) is reserved for refractory lagophthalmos or when the patient cannot tolerate an implant — it is a separate procedure, not an alternative weight material.',
    concepts: ['eyelid'],
  },

  {
    id: 'q25',
    type: 'mcq',
    stem: 'A patient presents 8 months after Bell\'s palsy with facial tightness, synkinesis, and hypertonicity. What is the first-line treatment for this nonflaccid (postparalytic) facial palsy?',
    options: [
      { id: 'a', text: 'Botulinum toxin chemodenervation targeted to the orbicularis oculi' },
      { id: 'b', text: 'Physical therapy including facial neuromuscular retraining and biofeedback' },
      { id: 'c', text: 'Modified selective neurectomy to reduce aberrant motor input' },
      { id: 'd', text: 'Masseteric nerve transfer to augment the weak facial muscles' },
    ],
    correct: 'b',
    brief: 'Physical therapy — including patient education, soft tissue mobilization, facial neuromuscular retraining, and relaxation techniques — is the first-line treatment for NFFP regardless of cause.',
    detailed: 'The NFFP treatment algorithm: Step 1 — Physical therapy (always first-line, non-invasive, reversible). A comprehensive PT regimen includes: patient education about synkinesis mechanism and realistic expectations; soft tissue mobilization to reduce muscular hypertonicity; facial neuromuscular retraining with biofeedback strategies to suppress co-contracting muscles; and relaxation/meditation techniques to reduce overall facial tension. Step 2 — Botulinum toxin chemodenervation when PT is insufficient or in combination; repeat every 3–4 months to maintain effect. Step 3 — Surgery (modified selective neurectomy/neurolysis, targeted myectomies, or free muscle augmentation) for refractory cases. PT is preferred first because it targets the aberrant motor program directly — not just masking it — and its gains can persist between botulinum toxin cycles. Nerve transfer would worsen synkinesis by adding more disorganized input to an already aberrantly reinnervated system.',
    concepts: ['NFFP-treatment'],
  },

  {
    id: 'q26',
    type: 'mcq',
    stem: 'In chemodenervation for nonflaccid facial palsy, the CONTRALATERAL (healthy) side is also targeted to improve dynamic symmetry. Which contralateral muscle is most specifically targeted to reduce the over-pulling of the healthy lower lip?',
    options: [
      { id: 'a', text: 'Frontalis — to balance brow height' },
      { id: 'b', text: 'Orbicularis oculi — to reduce eye narrowing on the healthy side' },
      { id: 'c', text: 'Corrugator supercilii — to soften the glabellar frown' },
      { id: 'd', text: 'Depressor labii inferioris (DLI) — to reduce excess lower lip depression on the healthy side' },
    ],
    correct: 'd',
    brief: 'Depressor labii inferioris (DLI) on the contralateral side is targeted to reduce the pulling-down of the healthy lower lip, which creates visible dynamic asymmetry during smiling and lip movements.',
    detailed: 'In NFFP, the unaffected side is relatively overactive compared to the weak affected side, producing "dynamic asymmetry" most visible during emotional expression. Ipsilateral chemodenervation targets include: frontalis, orbicularis oculi (for ocular synkinesis), corrugator, buccinator, DAO, mentalis, and platysma. Contralateral targets: frontalis, corrugator, orbicularis oculi, and most importantly the depressor labii inferioris (DLI). The DLI pulls down the lower lip on the healthy side; when the affected side cannot match this movement, the result is asymmetric lower lip depression. Chemodenervating the contralateral DLI reduces this "over-pull" and improves smile symmetry — a counterintuitive but highly effective technique that patients notice immediately. This is a key clinical pearl: treating only the affected side misses the opportunity to balance the healthy side\'s excess movement.',
    concepts: ['chemodenervation', 'NFFP-treatment'],
  },

  // ════════════════ COMPLICATIONS ════════════════

  {
    id: 'q27',
    type: 'mcq',
    stem: 'Which combination of risk factors places a patient with facial paralysis at the HIGHEST risk for corneal ulceration and vision loss from exposure keratopathy?',
    options: [
      { id: 'a', text: 'HB Grade III palsy with intact Bell\'s reflex and normal corneal sensation' },
      { id: 'b', text: 'HB Grade VI palsy with absent Bell\'s reflex, V1 numbness, and prior skull-base surgery sacrificing the GSPN' },
      { id: 'c', text: 'HB Grade IV palsy with incomplete eye closure but intact lacrimal function' },
      { id: 'd', text: 'HB Grade V palsy in a young patient with pre-existing mild dry eye' },
    ],
    correct: 'b',
    brief: 'The highest-risk combination is complete lagophthalmos + absent Bell\'s reflex (no protective upward gaze) + V1 numbness (no corneal sensation to detect early injury) + GSPN sacrifice (reduced lacrimal secretion).',
    detailed: 'Four risk factors compound to create extreme corneal danger: (1) Complete lagophthalmos (no orbicularis function → eye cannot close) — the primary driver; (2) Absent Bell\'s reflex — normally, attempted lid closure triggers upward-outward globe rotation, moving the cornea away from the palpebral fissure; loss of this reflex means the exposed cornea remains directly in the aperture; (3) V1 (ophthalmic) trigeminal numbness — corneal anesthesia eliminates the pain signal that would alert the patient to early keratopathy; (4) GSPN compromise from skull-base surgery — eliminates lacrimal secretion, compounding the desiccation injury. Each factor alone is manageable; all four together can lead to corneal ulceration, scarring, and blindness even with standard care. Immediate management for ALL paralysis: artificial tears (frequent daytime), lubricating ointment (nocturnal), moisture chamber or taping, and ophthalmology referral. Surgical escalation (platinum eyelid weight, ectropion repair, tarsorrhaphy) is used when these measures are insufficient.',
    concepts: ['corneal', 'eyelid'],
  },

  // ════════════════ CASE 1 · SCCa / Perineural ════════════════

  {
    id: 'q28',
    type: 'mcq',
    stem: 'Case 1: A 53-year-old male reports a 4–5 month history of "Bell\'s palsy" without any clinical improvement. PMH: cutaneous SCCa of the nasal skin resected by Mohs surgery 2 years ago. Exam shows complete flaccid facial paralysis without synkinesis. Which features make this presentation INCONSISTENT with typical Bell\'s palsy?',
    options: [
      { id: 'a', text: 'The acute onset and complete involvement of all facial nerve branches' },
      { id: 'b', text: 'He is too old for Bell\'s palsy and should have been diagnosed with Ramsay Hunt instead' },
      { id: 'c', text: 'Persistent complete flaccidity at 4–5 months without any recovery, plus the prior history of cutaneous SCCa raising concern for perineural spread' },
      { id: 'd', text: 'The absence of synkinesis at 4 months indicates the nerve is completely destroyed' },
    ],
    correct: 'c',
    brief: "Bell's palsy should show at least partial recovery within 4–6 months. Persistent complete flaccidity is a red flag. Prior cutaneous SCCa on the face/nose raises strong concern for perineural spread along CN VII or V branches.",
    detailed: 'Two red flags dominate this case: (1) No recovery at 4–5 months. Bell\'s palsy is expected to recover — the majority within weeks, and at the latest 4–6 months. Persistent complete flaccid palsy beyond 4 months is atypical and warrants imaging. (2) Prior cutaneous SCCa on the nasal skin. Cutaneous SCCa of the face and scalp is one of the most common causes of perineural invasion along CN V and CN VII branches. Mohs surgery removes the gross tumor but can leave microscopic perineural extension that spreads centripetally along the nerve, often silently, for months to years. The nasal skin drains to branches of both CN V (V2 infraorbital, V3 mental) and CN VII. A thorough work-up should include MRI with and without gadolinium (full facial nerve course, IAC to parotid bed), CT for fallopian canal widening, and PET-CT if malignancy recurrence or perineural spread is suspected. Age is not a diagnostic criterion for Bell\'s palsy.',
    concepts: ['case-scc', 'bells-palsy', 'imaging'],
  },

  {
    id: 'q29',
    type: 'mcq',
    stem: 'Case 1 (continued): Full MRI, laboratory work-up, and CT all return negative. The patient continues to have complete flaccid facial paralysis at 6 months with no recovery. What should be considered next?',
    options: [
      { id: 'a', text: 'Repeat steroid course — a second course of high-dose prednisone is indicated at 6 months' },
      { id: 'b', text: 'Empiric antibiotic therapy for presumed seronegative Lyme disease' },
      { id: 'c', text: 'Facial nerve exploration and biopsy' },
      { id: 'd', text: 'Proceed directly to masseteric nerve transfer without further diagnostic evaluation' },
    ],
    correct: 'c',
    brief: 'When all imaging and lab work-up is negative but the patient has unexplained persistent flaccid paralysis beyond 6 months, facial nerve exploration and biopsy is indicated — microscopic perineural invasion or granulomatous infiltration may not be visible on imaging.',
    detailed: 'The module\'s guideline states that at >6 months of unexplained flaccid paralysis — where standard Bell\'s palsy recovery would have been expected — facial nerve exploration and biopsy should be considered. Rationale: microscopic perineural invasion by malignancy (SCCa, adenoid cystic carcinoma), inflammatory granulomatous disease (sarcoidosis), or rare infiltrative processes can be histologically identifiable even when imaging is unrevealing. A positive biopsy in this case would change management entirely: adjuvant radiation therapy, systemic therapy, and surveillance protocols for known perineural malignancy. A negative biopsy provides reassurance but does not rule out very focal disease. Empiric antibiotics without seroconversion evidence are not indicated. Repeat steroids at 6 months have no evidence base for non-recovering palsy. Proceeding to nerve transfer without completing the diagnostic evaluation risks missing a treatable oncologic process.',
    concepts: ['case-scc', 'imaging'],
  },

  {
    id: 'q30',
    type: 'mcq',
    stem: 'Case 1 (continued): On examination, this patient has a widened palpebral fissure, complete inability to close his eye, and no voluntary facial movement. Which corneal risk factor is most critically raised by his history of nasal SCCa and potential perineural spread?',
    options: [
      { id: 'a', text: 'Reduced lacrimal secretion from GSPN sacrifice during skull-base surgery' },
      { id: 'b', text: 'Absence of Bell\'s reflex due to motor neuron involvement' },
      { id: 'c', text: 'V1 trigeminal numbness from perineural spread reducing corneal sensation' },
      { id: 'd', text: 'Proptosis from orbital involvement by the primary SCCa' },
    ],
    correct: 'c',
    brief: 'Perineural spread from nasal SCCa can involve V1 (ophthalmic branch) via retrograde spread, causing corneal anesthesia. Loss of corneal sensation eliminates pain as the earliest warning sign of exposure keratopathy, dramatically increasing ulceration risk.',
    detailed: 'In this patient, the most concerning perineural risk beyond the lagophthalmos itself is V1 (ophthalmic division) numbness. Nasal SCCa can spread along the infraorbital nerve (V2) retrograde to the Gasserian ganglion and then anterograde along V1 to the ophthalmic division, causing corneal anesthesia. An eye that cannot close (CN VII lagophthalmos) AND cannot feel (CN V1 numbness) is in extreme danger: there is no pain alarm to signal early corneal epithelial damage, and what would otherwise be a minor abrasion becomes a rapidly progressive ulcer. The combination of VII loss + V1 loss is explicitly listed in the module as the highest-risk scenario. GSPN compromise would also be relevant if skull-base surgery had been performed, but in this case without such surgery, perineural V1 spread is the more immediately relevant concern. Absent Bell\'s reflex is a separate, important risk factor — but it would arise from the orbital branch of CN VII (already lost) rather than perineural spread.',
    concepts: ['case-scc', 'corneal'],
  },

  // ════════════════ CASE 2 · Post-Acoustic Neuroma ════════════════

  {
    id: 'q31',
    type: 'mcq',
    stem: 'Case 2: A 45-year-old male is 6 months post right acoustic neuroma resection with complete postoperative facial paralysis. Intraoperative notes confirm the facial nerve was left anatomically intact with reduced (but present) stimulation at end of case. When is the traditional threshold for intervening with a nerve transfer, and what is the rationale for waiting?',
    options: [
      { id: 'a', text: '6 months — facial muscles begin fibrosis after 6 months so earlier is always better' },
      { id: 'b', text: '12 months — spontaneous recovery is still possible with an intact nerve; premature intervention risks competing with natural recovery' },
      { id: 'c', text: '18 months — waiting ensures complete Wallerian degeneration before transfer' },
      { id: 'd', text: '3 months — the modern approach is always to intervene as early as possible' },
    ],
    correct: 'b',
    brief: '12 months is the traditional threshold. The nerve was anatomically intact at surgery, so spontaneous recovery remains possible; nerve regeneration proceeds at ~1 mm/day from the injury site, and motor end-plate viability is maintained for ~12–18 months.',
    detailed: 'The 12-month waiting period balances two competing concerns: (1) allowing time for spontaneous recovery of the intact (but injured) nerve — reduced intraoperative stimulation indicates neuropraxia or axonotmesis, not neurotmesis; with an intact nerve, regeneration may proceed at ~1 mm/day from the IAC to the peripheral musculature over many months. (2) Not waiting so long that motor end-plates undergo irreversible fibrosis. Facial muscle viability is maintained for ~12–18 months after denervation; beyond 18 months it deteriorates significantly. The modern trend is toward earlier intervention (before 12 months) in patients showing no clinical or EMG signs of recovery — early nEMG evidence of denervation without reinnervation potentials at 6 months can prompt earlier consideration. This case is at 6 months — still within the window where watchful waiting with serial EMG is appropriate, but close monitoring is warranted.',
    concepts: ['case-acoustic', 'nerve-transfer', 'acute-repair'],
  },

  {
    id: 'q32',
    type: 'mcq',
    stem: 'Case 2 (continued): At 14 months, there is still no facial movement and no reinnervation on needle EMG. The distal facial nerve branches are intact, and native facial musculature is viable on EMG. What is the most appropriate first-line surgical option to restore smile excursion?',
    options: [
      { id: 'a', text: 'Cross-facial nerve graft (CFNG) alone — provides the highest axonal load to the distal nerve' },
      { id: 'b', text: 'Masseteric nerve (NTM) to distal facial nerve — reliable, high axonal load, robust commissure excursion' },
      { id: 'c', text: 'Primary cable graft from the proximal facial nerve stump in the IAC' },
      { id: 'd', text: 'Free gracilis muscle transfer — native muscle viability is insufficient at this point' },
    ],
    correct: 'b',
    brief: 'The masseteric nerve (NTM) is the preferred first-line transfer when the distal nerve and native musculature are viable but the proximal nerve is unavailable — it delivers >2,700 myelinated axons with robust, predictable commissure excursion.',
    detailed: 'With intact distal facial nerve and viable native musculature, nerve transfer (not muscle transfer) is the appropriate approach. Options: (1) NTM (masseteric nerve to distal facial nerve) — preferred first-line at most centers; high axonal load (>2,700 myelinated fibers); located 3 cm anterior to the tragus, 1 cm below the zygomatic arch; minimal donor deficit when anterior branch preserved. (2) Hypoglossal nerve — superior resting tone vs. NTM; consider when resting symmetry is the dominant concern. (3) CFNG — for spontaneity potential; requires two stages and has high axonal attrition across graft length. (4) Combined dual transfer (NTM + CFNG) — most comprehensive approach at high-volume centers. CFNG alone has insufficient axonal load for robust commissure excursion. Primary cable graft requires an available proximal facial nerve stump (not present here after skull-base surgery). Free gracilis is not yet indicated because native muscle remains viable; it would be the option at >18–24 months when muscle viability is lost.',
    concepts: ['case-acoustic', 'nerve-transfer'],
  },

  {
    id: 'q33',
    type: 'mcq',
    stem: 'Case 2 (continued): How would the surgical plan change if the patient presented with 24 months of complete flaccid paralysis and no EMG evidence of residual motor unit activity?',
    options: [
      { id: 'a', text: 'Masseteric nerve transfer remains the primary option regardless of duration' },
      { id: 'b', text: 'Hypoglossal nerve transfer is preferred at 24 months because tongue function drives facial recovery' },
      { id: 'c', text: 'Free gracilis muscle transfer (with NTM or dual innervation) becomes the preferred approach given the loss of native muscle viability' },
      { id: 'd', text: 'Static suspension alone (fascia lata sling) is the only remaining option at 24 months' },
    ],
    correct: 'c',
    brief: 'At 24 months with no residual motor units on EMG, native facial musculature has undergone fibrotic degeneration. Management shifts to free gracilis muscle transfer (with nerve supply) as the primary dynamic option.',
    detailed: 'The clock runs on muscle — not on the nerve. Nerve transfers to fibrotic muscle will not produce movement because there are no functional motor end-plates to reinnervate. At 24 months without any reinnervation signal on nEMG, the timeline for native muscle viability has expired. Management shifts to: (1) Free gracilis muscle transfer with NTM innervation (reliable excursion) or dual innervation (NTM + CFNG for spontaneity potential) — the gold standard for dynamic reconstruction when native muscle is gone; (2) Static suspension procedures (fascia lata sling, eyelid weight) for immediate functional and cosmetic improvement; (3) Combined staged approach: static first for eye/oral competence, then free muscle for smile. NTM transfer to native muscle at this stage would fail to produce movement. Nerve transfers can work even years after injury IF the distal nerve is still present AND there are living muscle end-plates to reinnervate — the key caveat that shifts the decision here.',
    concepts: ['case-acoustic', 'muscle-transfer', 'nerve-transfer'],
  },

  {
    id: 'q34',
    type: 'mcq',
    stem: 'Case 2 (variant): The operative note instead states that the facial nerve was TRANSECTED during surgery and not repaired. It is now post-operative day 1. What is the most critical reason to return to the OR within 72 hours, and what is the expected outcome if repair is achieved?',
    options: [
      { id: 'a', text: 'Neural edema peaks at 72 hours, making the dissection impossible after that point; expected HB I' },
      { id: 'b', text: 'Distal nerve branches can still be electrically stimulated before Wallerian degeneration completes, allowing identification; expected HB III in ≥50%' },
      { id: 'c', text: 'The 72-hour window prevents bacterial contamination of the nerve ends; expected HB II in most patients' },
      { id: 'd', text: 'The 72-hour window is needed to harvest the sural nerve graft before denervation atrophy begins; expected HB IV' },
    ],
    correct: 'b',
    brief: 'Within 72 hours, distal nerve branches retain electrical excitability before Wallerian degeneration — allowing intraoperative identification in a complex field. Immediate primary repair or cable grafting targets HB Grade III in ≥50% of patients.',
    detailed: 'Wallerian degeneration renders the distal nerve non-excitable approximately 48–72 hours post-transection. Within this window, a nerve stimulator can identify small distal branches even in an edematous, scarred, surgically disrupted field — a critical intraoperative advantage. After 72 hours, the surgeon must rely entirely on anatomical landmarks, making distal nerve identification far more challenging. The repair strategy: tension-free epineural coaptation if possible; interposition cable graft (great auricular nerve is most accessible from the ipsilateral neck) if a gap exists. Expected outcome: HB Grade III in at least 50% — the realistic benchmark for nerve repair, not Grade I or II. Setting appropriate expectations is part of informed consent. Every day past 72 hours reduces the quality of reinnervation through increased fibrosis and greater difficulty in nerve identification. Sural nerve grafts are harvested from the leg and are available at any time — not the reason for urgency.',
    concepts: ['case-acoustic', 'acute-repair'],
  },

  // ════════════════ CASE 3 · Ramsay Hunt / NFFP ════════════════

  {
    id: 'q35',
    type: 'mcq',
    stem: 'Case 3: A 53-year-old woman presents 1 year after left Ramsay Hunt syndrome (treated with steroids + antivirals within 72 hours). She has left facial tightness, inability to smile, and on exam: narrowed left palpebral fissure, deepened NLF, complete eye closure, minimal commissure excursion, and significant left orbicularis contraction when attempting to smile. What is the diagnosis?',
    options: [
      { id: 'a', text: 'Persistent flaccid facial palsy from incomplete nerve recovery — the nerve is still healing' },
      { id: 'b', text: 'Nonflaccid (postparalytic) facial palsy from aberrant nerve regeneration with oro-ocular synkinesis' },
      { id: 'c', text: 'Upper motor neuron facial palsy from central involvement by varicella zoster' },
      { id: 'd', text: 'Secondary Bell\'s palsy on the same side — a recurrence of the original episode' },
    ],
    correct: 'b',
    brief: 'This is textbook NFFP: narrowed palpebral fissure (hypertonicity), deepened NLF, and orbicularis contraction with smile (oro-ocular synkinesis) — all hallmarks of aberrant nerve regeneration after Ramsay Hunt.',
    detailed: 'Ramsay Hunt syndrome (herpes zoster oticus) has a worse prognosis than Bell\'s palsy: only 20–50% fully recover without treatment vs. ~70–80% for Bell\'s palsy. Early treatment with steroids + antivirals within 72 hours (as this patient received) improves but does not guarantee full recovery. The patient\'s current exam shows: narrowed palpebral fissure (orbicularis oculi hypertonicity — opposite of flaccid widening), deepened NLF (hypertonicity), complete eye closure (the orbicularis did reinnervate, but aberrantly), and oro-ocular synkinesis (orbicularis oculi contracts when attempting to smile). These are the defining features of NFFP. Resting tone is present, confirming reinnervation has occurred — just aberrantly. This is not flaccid palsy (which would show widened fissure, effaced NLF, no tone). It is not central (no contralateral findings, no upper face sparing). NFFP after Ramsay Hunt follows the same aberrant-regeneration mechanism as after Bell\'s palsy.',
    concepts: ['case-ramsay', 'NFFP', 'synkinesis'],
  },

  {
    id: 'q36',
    type: 'mcq',
    stem: 'Case 3 (continued): How does the treatment algorithm for this patient\'s NFFP differ from what would be used for a patient with flaccid facial palsy? What treatment is specifically CONTRAINDICATED in NFFP?',
    options: [
      { id: 'a', text: 'NFFP requires immediate surgical nerve transfer; flaccid palsy is managed conservatively with PT alone' },
      { id: 'b', text: 'NFFP is treated with PT first, then chemodenervation; nerve transfer is contraindicated as it would worsen synkinesis' },
      { id: 'c', text: 'NFFP and flaccid palsy share the same algorithm; only the botulinum toxin dose differs' },
      { id: 'd', text: 'Chemodenervation is contraindicated in NFFP because it prevents the remaining recovery' },
    ],
    correct: 'b',
    brief: 'NFFP is treated with PT first (to address the aberrant motor program), then chemodenervation (to reduce hypertonicity and synkinesis). Nerve transfer is contraindicated — it would add more disorganized input to an already aberrantly reinnervated system, worsening synkinesis.',
    detailed: 'The treatment algorithms diverge fundamentally: Flaccid palsy → eye protection as immediate priority, then nerve repair/transfer to restore movement and tone; chemodenervation not indicated (no tone to reduce). NFFP → physical therapy first-line (neuromuscular retraining, biofeedback, soft tissue mobilization, relaxation); then chemodenervation (botulinum toxin to orbicularis oculi, DAO, platysma on ipsilateral side; DLI, frontalis on contralateral side); surgical options (selective neurectomy, myectomy) for refractory cases. Nerve transfer in NFFP adds more axons to muscles that are already overactive and aberrantly reinnervated — this increases, not decreases, hypertonicity and synkinesis. The surgical goal in NFFP is to reduce hyperactivity, not restore movement. The surgical goal in flaccid palsy is the opposite: restore movement from baseline zero. Chemodenervation is a central (not contraindicated) tool in NFFP.',
    concepts: ['case-ramsay', 'NFFP-treatment', 'nerve-transfer'],
  },

  {
    id: 'q37',
    type: 'mcq',
    stem: 'Case 3 (continued): Would the management algorithm change substantially if this patient presented 2 years after Ramsay Hunt rather than 1 year?',
    options: [
      { id: 'a', text: 'Yes — nerve transfer becomes appropriate at 2 years because PT is no longer effective after the synkinesis pattern stabilizes' },
      { id: 'b', text: 'No — NFFP management follows the same PT → chemodenervation → surgery algorithm; a plateau in synkinesis at 2 years actually makes chemodenervation targets more predictable' },
      { id: 'c', text: 'Yes — at 2 years, free gracilis muscle transfer replaces all other options because native muscle has fibrosed' },
      { id: 'd', text: 'Yes — corticosteroids are re-indicated at 2 years to suppress ongoing aberrant regeneration' },
    ],
    correct: 'b',
    brief: 'NFFP management is not time-limited the same way as flaccid palsy. At 2 years, aberrant regeneration has likely reached its plateau — making chemodenervation targets more predictable and stable, with no fundamental change to the algorithm.',
    detailed: 'Aberrant regeneration evolves for up to 2 years. A patient at 2 years is at or near their plateau — the synkinesis pattern is established and relatively stable. This is clinically advantageous: chemodenervation becomes more predictable because the targets are not moving, selective neurectomy or myectomy can be planned with greater confidence that the pattern is fixed, and physical therapy neuromuscular retraining continues to benefit regardless of duration. What does NOT change: the algorithm still follows PT → chemodenervation → surgery. NFFP does not convert to flaccid palsy, so nerve transfer remains inappropriate. Physical therapy remains beneficial even years after onset. Spontaneous improvement beyond 2 years is unlikely, so surgical options can be discussed more definitively at the 2-year mark. The key difference from flaccid palsy: flaccid palsy has a hard clock (muscle viability ~12–18 months); NFFP management clock is softer — it is driven by symptom severity and plateau, not by tissue viability.',
    concepts: ['case-ramsay', 'NFFP-treatment'],
  },

  // ════════════════ RAPID-FIRE ════════════════

  {
    id: 'q38',
    type: 'mcq',
    stem: "Zuker's point localizes the zygomatic/buccal branch of the facial nerve innervating the zygomaticus major for distal nerve transfers and CFNG harvest. Where is Zuker's point located?",
    options: [
      { id: 'a', text: '0.5 cm below the tragus, on a line to the lateral eyebrow' },
      { id: 'b', text: 'At the junction of the anterior border of the masseter and the lower eyelid' },
      { id: 'c', text: 'At the midpoint of a line from the root of the helix to the lateral oral commissure' },
      { id: 'd', text: '1 cm anterior to the tragus at the level of the zygomatic arch' },
    ],
    correct: 'c',
    brief: "Zuker's point is the midpoint of a line from the root of the helix to the lateral oral commissure — where the zygomatic/buccal branch innervating the zygomaticus major is reliably identified.",
    detailed: "Zuker's point is the anatomic target for identifying the zygomatic/buccal branch to the zygomaticus major — the primary smile elevator and the key target in smile reanimation surgery. Its reliable location (midpoint of helix root–commissure line) reduces dissection time and donor morbidity during CFNG harvest and distal nerve transfers. The companion landmark Pitanguy's line (0.5 cm below the tragus to 1.5 cm above the lateral brow) approximates the temporal branch over the zygomatic arch. Neither landmark is the same as option A (which describes Pitanguy's line). The zygomatic arch crossing of the temporal branch occurs 4 cm behind the lateral canthus (10–19 mm anterior to the EAC).",
    concepts: ['surface-landmarks', 'CFNG', 'nerve-transfer'],
  },

  {
    id: 'q39',
    type: 'mcq',
    stem: 'For ALL patients with facial paralysis regardless of etiology, stage, or severity, which three interventions constitute the minimum recommended immediate management?',
    options: [
      { id: 'a', text: 'Oral steroids, artificial tears, and audiometry' },
      { id: 'b', text: 'Artificial tears / lubricating ointment, eyelid taping or moisture chamber, and ophthalmology referral' },
      { id: 'c', text: 'Platinum eyelid weight implantation, artificial tears, and physical therapy' },
      { id: 'd', text: 'Botulinum toxin, artificial tears, and corneal topography' },
    ],
    correct: 'b',
    brief: 'The universal minimum: (1) artificial tears and lubricating ointment; (2) eyelid taping or moisture chamber at night; (3) ophthalmology referral for baseline corneal assessment — regardless of cause or severity.',
    detailed: 'These three measures protect against exposure keratopathy — the most devastating and preventable complication of facial paralysis — and should be initiated at the moment of diagnosis for every patient. (1) Frequent artificial tears (daytime) and lubricating ointment (nocturnal) keep the corneal surface lubricated; (2) Eyelid taping or moisture chamber prevents nocturnal desiccation when Bell\'s reflex and voluntary closure are absent; (3) Ophthalmology referral ensures baseline corneal surface assessment and establishes specialist co-management. These apply to a Bell\'s palsy Grade II presentation with mild weakness and equally to a Grade VI total paralysis post-acoustic neuroma resection. Surgical escalation (platinum eyelid weight, ectropion repair, tarsorrhaphy) is added when these conservative measures are insufficient. Oral steroids are appropriate for Bell\'s palsy specifically but not universally for all facial paralysis. Audiometry, PT, and botulinum toxin are important in specific contexts but are not universal immediate corneal-protection measures.',
    concepts: ['corneal', 'eyelid'],
  },

  {
    id: 'q40',
    type: 'mcq',
    stem: 'The zygomatic and buccal branches of the facial nerve have extensive overlapping innervation of mid-face muscles. How is this redundancy exploited in facial reanimation surgery?',
    options: [
      { id: 'a', text: 'The overlap means injury to either branch in isolation is usually clinically undetectable, allowing one to be sacrificed as a donor for CFNG without causing visible deficit' },
      { id: 'b', text: 'The overlap is a barrier to reanimation because stimulating one branch activates all mid-face muscles simultaneously' },
      { id: 'c', text: 'The overlap is exploited by stimulating both branches together to produce supramaximal commissure excursion' },
      { id: 'd', text: 'The overlap disappears after Wallerian degeneration, limiting CFNG to use within the first 72 hours' },
    ],
    correct: 'a',
    brief: 'Redundant innervation of mid-face muscles by both zygomatic and buccal branches means sacrificing one branch on the contralateral donor side causes no detectable clinical deficit — the anatomical basis for CFNG harvest without donor morbidity.',
    detailed: 'The zygomatic and buccal branches converge on the same mid-face muscles (zygomaticus major, orbicularis oris, levator labii) with considerable redundancy. Clinical consequence: injury to a single zygomatic or buccal branch is often functionally unnoticeable because the partner branch maintains motor input. Surgical exploitation: (1) during CFNG, expendable contralateral zygomatic or buccal branches are coapted to the sural nerve graft — the contralateral face shows no meaningful weakness because the remaining branch provides functional coverage; (2) in distal nerve transfers on the affected side, a redundant branch can be used as a donor for nerve-to-nerve coaptation without creating a new motor deficit. This redundancy is what makes CFNG feasible as a technique — otherwise sacrificing any facial nerve branch would produce visible paresis on the "good" side.',
    concepts: ['CFNG', 'nerve-transfer'],
  },

  {
    id: 'q41',
    type: 'mcq',
    stem: "In Bell's palsy, corticosteroids reduce edema and compression within the confined fallopian canal. Which intratemporal segment's unique anatomy is the mechanistic basis for this therapeutic rationale?",
    options: [
      { id: 'a', text: 'Meatal segment — it lacks epineurium and perineurium, making it more susceptible to pressure' },
      { id: 'b', text: 'Labyrinthine segment — it traverses the narrowest bony canal with no room for expansion, acting as a compartment syndrome' },
      { id: 'c', text: 'Tympanic segment — dehiscence in 30% allows nerve prolapse into the middle ear during edema' },
      { id: 'd', text: 'Mastoid segment — its vertical course is most susceptible to stretch injury during swelling' },
    ],
    correct: 'b',
    brief: 'The labyrinthine segment traverses the narrowest bony canal with no tolerance for swelling. Viral neuritis (HSV-1 reactivation) causes edema that compresses the nerve in its own closed canal — a compartment-syndrome equivalent reversed by steroids.',
    detailed: 'The labyrinthine segment (3–5 mm) is the narrowest intratemporal segment and occupies the most constricted portion of the fallopian canal. When HSV-1 reactivation triggers viral neuritis and inflammatory edema, the nerve swells within a fixed bony channel with zero room for expansion — analogous to a compartment syndrome. This results in axonal compression and conduction block. Corticosteroids reduce this inflammatory edema within the confined canal, relieving axonal compression and improving recovery rates. This is also why temporal bone fractures through the labyrinthine segment produce the highest rate of immediate facial nerve injury (from direct compression) — the same anatomical feature that creates vulnerability to both inflammatory and traumatic insults. The tympanic segment\'s dehiscence rate (30%) is a different phenomenon and relates to iatrogenic, not inflammatory, risk. The meatal segment\'s lack of connective tissue sheaths contributes to vulnerability to inflammatory infiltration but is not the narrowest canal.',
    concepts: ['nerve-segments', 'bells-palsy'],
  },

  {
    id: 'q42',
    type: 'mcq',
    stem: 'A 40-year-old patient presents with a flaccid right facial palsy with no history of prior palsy, no otologic symptoms, and no other cranial neuropathies. He is 35 days from symptom onset and has had no improvement. Which electrodiagnostic approach is most appropriate at this stage?',
    options: [
      { id: 'a', text: 'ENoG only — the 35-day mark is still optimal for CMAP amplitude measurement' },
      { id: 'b', text: 'Neither ENoG nor nEMG — electrodiagnostics are not indicated at any stage in incomplete palsy' },
      { id: 'c', text: 'Needle EMG (nEMG) — at 35 days, nEMG can characterize injury type and detect early reinnervation; ENoG is past its optimal window' },
      { id: 'd', text: 'Both ENoG and nEMG simultaneously — the combined study at 35 days gives the most complete picture' },
    ],
    correct: 'c',
    brief: 'At 35 days, ENoG is past its 21-day optimal window. nEMG is now the appropriate test — it can characterize the injury (neurapraxia vs axonotmesis), detect fibrillation potentials, and identify early reinnervation MUAPs before clinical movement returns.',
    detailed: 'ENoG is optimal from 72 hours to 21 days. Beyond 21 days, early reinnervation potentials confound the CMAP amplitude, making ENoG unreliable. At 35 days (5 weeks), nEMG (optimal 2–3 weeks to 3 months) is the appropriate test. nEMG provides: (1) injury characterization — neurapraxia (no fibrillations, intact axon, good prognosis), axonotmesis (fibrillation potentials, regeneration possible), or neurotmesis (fibrillations, no voluntary MUAPs, surgical repair needed); (2) early reinnervation detection — nascent polyphasic MUAPs appear before any visible movement returns; a single polyphasic MUAP is an excellent prognostic sign. At 35 days without improvement, nEMG helps decide whether to continue watchful waiting (early reinnervation potentials present) or escalate to imaging and surgical planning (no signs of recovery). Note: this patient\'s presentation is actually incomplete (no history given of HB grade) — if it were truly a complete HB VI palsy, ENoG within the first 21 days would have been appropriate to assess degeneration severity for surgical decompression consideration.',
    concepts: ['electrodiagnostics', 'bells-palsy'],
  },

];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
