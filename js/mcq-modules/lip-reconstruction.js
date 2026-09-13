/* =================================================================
   Lip Reconstruction
   OKSAT · Facial Plastics & Recon Module
   ================================================================= */
/* Source: Krane — Lip Reconstruction Study Guide, adapted.
   Cross-referenced with Baker & Swanson, Local Flaps in Facial
   Reconstruction, and Obsidian reference vault (sk.obs). */

const meta = {
    title: 'Lip\nReconstruction',
    subtitle:
        'Lip anatomy and labial artery supply, aesthetic subunits, oncologic epidemiology and embryologic lymphatic drainage, the defect-size reconstructive algorithm, small-defect repairs (wedge, mucosal advancement, O-to-T, V-to-Y, melolabial and perialar flaps), large-defect flaps (Abbe, Estlander, Karapandzic, Gillies), subtotal/total reconstruction (Bernard-Burow-Webster, free flap with palmaris longus sling), and three integrating clinical cases.',
    kicker: 'Self-Assessment · Facial Plastics & Recon Module',
    id: 'lip-reconstruction',
    sources: [
        'Krane — Lip Reconstruction Study Guide',
        'Baker & Swanson — Local Flaps in Facial Reconstruction',
    ],
};

const DOMAINS = {
    anatomy:       { label: 'Anatomy',                 color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    oncology:      { label: 'Oncology & Epidemiology', color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    principles:    { label: 'Reconstructive Principles', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    'small-defects': { label: 'Small/Medium Defects',  color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    'large-defects': { label: 'Large Defects',         color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    subtotal:      { label: 'Subtotal/Total Recon',    color: '#C06A4A', hex: 'rgba(192,106,74,0.14)' },
    cases:         { label: 'Cases',                   color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // anatomy
    'labial-artery':          { label: 'Labial Artery Anatomy',        domain: 'anatomy' },
    'lip-subunits':           { label: 'Lip Aesthetic Subunits',       domain: 'anatomy' },
    'lip-layers':             { label: 'Lip Tissue Layers',            domain: 'anatomy' },
    'perioral-landmarks':     { label: 'Vermilion & White Roll',       domain: 'anatomy' },

    // oncology
    'lip-cancer':             { label: 'Lip Cancer Epidemiology',      domain: 'oncology' },
    'lymphatic-drainage':     { label: 'Lymphatic Drainage',           domain: 'oncology' },
    'embryologic-development':{ label: 'Embryologic Development',      domain: 'oncology' },

    // principles
    'reconstructive-algorithm': { label: 'Reconstructive Algorithm',   domain: 'principles' },
    'commissure-decision':    { label: 'Commissure Decision Point',    domain: 'principles' },
    'vermilion-alignment':    { label: 'Vermilion Border Alignment',   domain: 'principles' },
    'sphincter-repair':       { label: 'Sphincteric Repair',           domain: 'principles' },
    'flap-design':            { label: 'Flap Design Principles',       domain: 'principles' },

    // small defects
    'mucosal-advancement':    { label: 'Mucosal Advancement Flap',     domain: 'small-defects' },
    'wedge-excision':         { label: 'Wedge Excision',               domain: 'small-defects' },
    'o-to-t-plasty':          { label: 'O-to-T Plasty',                domain: 'small-defects' },
    'v-to-y-flap':            { label: 'V-to-Y Island Pedicle',        domain: 'small-defects' },
    'melolabial-transposition': { label: 'Melolabial Transposition',   domain: 'small-defects' },
    'perialar-crescentic':    { label: 'Perialar Crescentic',           domain: 'small-defects' },

    // large defects
    'abbe-flap':              { label: 'Abbe Flap',                    domain: 'large-defects' },
    'estlander-flap':         { label: 'Estlander Flap',               domain: 'large-defects' },
    'karapandzic-flap':       { label: 'Karapandzic Flap',             domain: 'large-defects' },
    'gillies-fan':            { label: 'Gillies Fan Flap',             domain: 'large-defects' },

    // subtotal
    'bernard-burow':          { label: 'Bernard-Burow-Webster',        domain: 'subtotal' },
    'nasolabial-flap':        { label: 'Nasolabial Flap',              domain: 'subtotal' },
    'free-flap-lip':          { label: 'Free Flap Reconstruction',     domain: 'subtotal' },

    // cases
    'case-lower-lip-scc':     { label: 'Case: Lower Lip SCC',         domain: 'cases' },
    'case-commissure-defect': { label: 'Case: Commissure Defect',      domain: 'cases' },
    'case-near-total':        { label: 'Case: Near-Total Defect',      domain: 'cases' },
};

const ITEMS = [

// ════════════════ ANATOMY & FOUNDATIONS ════════════════

{
    id: 'q1', type: 'mcq', section: 'Anatomy',
    stem: 'Where do the superior and inferior labial arteries run in relation to the orbicularis oris muscle?',
    options: [
        { id: 'a', text: 'Between skin and orbicularis oris (subcutaneous)' },
        { id: 'b', text: 'Within the substance of orbicularis oris (intramuscular)' },
        { id: 'c', text: 'Between orbicularis oris and oral mucosa (submucosal)' },
        { id: 'd', text: 'Deep to the buccinator, lateral to orbicularis oris' },
    ],
    correct: 'c',
    brief: 'The labial arteries run in a submucosal plane — between the orbicularis oris and the mucosal surface of the lip, not between muscle and skin.',
    detailed: 'The superior labial artery is submucosal in ~81% of cadaveric specimens (within the muscle in ~19%), while the inferior labial artery is submucosal in ~87%. Near the midline, the superior labial artery sits within 10 mm of the free lip margin. This anatomy is directly load-bearing for Abbe and Estlander flap pedicle preservation: the labial artery runs 1–2 mm posterior to the vermilion-cutaneous junction, so the surgeon must begin the full-thickness flap incision carefully to avoid transecting it. The submucosal position also explains why mucosal advancement flaps are undermined deep to the minor salivary glands — staying in the submucosal plane avoids the artery.',
    concepts: ['labial-artery', 'abbe-flap'],
},

{
    id: 'q2', type: 'mcq', section: 'Anatomy',
    stem: 'Which statement about the superior labial artery near the midline is correct?',
    options: [
        { id: 'a', text: 'Paired vessels in 60% of specimens; within 5 mm of the free margin' },
        { id: 'b', text: 'Single vessel in 100% of specimens; within 10 mm of the free margin; near the commissure it runs superior to the vermilion border in 94%' },
        { id: 'c', text: 'Single vessel in 80% of specimens; runs within the muscle belly in the majority of cases' },
        { id: 'd', text: 'Absent in up to 20% of individuals; replaced by branches of the facial artery' },
    ],
    correct: 'b',
    brief: 'The superior labial artery is a single vessel in 100% of specimens, sits within 10 mm of the free margin near the midline, and near the oral commissure runs superior to the vermilion border in 94% of dissections.',
    detailed: 'These anatomic constants make the superior labial artery one of the most reliable axial vessels for lip flap design. Near the commissure it consistently runs superior to the vermilion border, which is why commissure-based flaps (Estlander, Gillies) can reliably capture it in their pedicle. The inferior labial artery is also a single vessel but more variable — it can lie up to 15 mm from the free margin at the commissure. Both arteries are branches of the facial artery, arising as it crosses the oral commissure.',
    concepts: ['labial-artery'],
},

{
    id: 'q3', type: 'mcq', section: 'Anatomy',
    stem: 'Referring to the image below, how many aesthetic subunits comprise the upper lip?',
    image: 'img/oksat/lip-recon/subunits.jpg',
    imageAlt: 'Lip aesthetic subunits diagram showing philtrum, lateral subunits, vermilion, and perioral landmarks',
    options: [
        { id: 'a', text: 'Two — the philtrum and a single lateral subunit' },
        { id: 'b', text: 'Three — the central philtrum and two lateral subunits' },
        { id: 'c', text: 'Four — the philtrum, two lateral subunits, and the vermilion as a separate subunit' },
        { id: 'd', text: 'One — the upper lip is a single aesthetic subunit, like the lower lip' },
    ],
    correct: 'b',
    brief: 'The upper lip has three aesthetic subunits: the central philtrum (bounded by the philtral columns) and two lateral subunits, each extending to the melolabial crease.',
    detailed: 'The philtral subunit has unique anatomy — the two philtral columns, Cupid\'s bow, and the tubercle — that cannot be replicated by adjacent tissue advancement alone. The lateral subunits are bounded medially by the philtral columns, superiorly by the nasal base and alar-facial sulcus, and laterally by the melolabial (nasolabial) crease. This anatomy matters because reconstruction should ideally replace like with like within subunit boundaries. The lower lip, by contrast, is a single aesthetic subunit — reconstruction aims to maintain symmetry across the entire unit.',
    concepts: ['lip-subunits', 'perioral-landmarks'],
},

{
    id: 'q4', type: 'mcq', section: 'Anatomy',
    stem: 'How many aesthetic subunits comprise the lower lip, and how does this differ functionally from the upper lip?',
    options: [
        { id: 'a', text: 'Three subunits; both lips have matching subunit architecture' },
        { id: 'b', text: 'Two subunits (medial and lateral); the lower lip has a less defined philtral equivalent' },
        { id: 'c', text: 'One subunit; unlike the upper lip\'s three subunits, the lower lip is a single aesthetic unit from commissure to commissure' },
        { id: 'd', text: 'One subunit; however the lower lip vermilion is considered a separate subunit' },
    ],
    correct: 'c',
    brief: 'The lower lip is a single aesthetic subunit from commissure to commissure. This simplifies reconstruction compared to the upper lip, where the philtral subunit demands precise matching.',
    detailed: 'The upper lip\'s three subunits (philtrum + two lateral) create reconstruction challenges: defects crossing subunit boundaries may need separate tissue sources to maintain natural-appearing landmarks. The lower lip\'s single-subunit status means advancement and rotation flaps can recruit tissue from anywhere along the lip without crossing a visible aesthetic boundary. However, the lower lip does have important landmarks — the vermilion border, the white roll, and the labiomental crease — that must be precisely aligned during reconstruction.',
    concepts: ['lip-subunits'],
},

{
    id: 'q5', type: 'mcq', section: 'Anatomy',
    stem: 'A full-thickness lip flap traverses five histological tissue layers. From external to internal, what is the correct sequence?',
    options: [
        { id: 'a', text: 'Skin → orbicularis oris → submucosa → minor salivary glands → mucosa' },
        { id: 'b', text: 'Skin → subcutaneous fat → orbicularis oris → submucosa (labial vessels, minor salivary glands) → oral mucosa' },
        { id: 'c', text: 'Epidermis → dermis → orbicularis oris → oral mucosa → periosteum' },
        { id: 'd', text: 'Skin → deep investing fascia → orbicularis oris → buccinator → oral mucosa' },
    ],
    correct: 'b',
    brief: 'The lip comprises five layers: skin, subcutaneous fat, orbicularis oris muscle, submucosa (containing the labial vessels and minor salivary glands), and oral mucosa.',
    detailed: 'Although surgeons often describe three functional layers (skin, muscle, mucosa) when planning flaps, the full five-layer model matters for dissection. The submucosal layer houses the labial artery and minor salivary glands — this is why a mucosal advancement flap is undermined deep to the minor salivary glands (to mobilize mucosa without devascularizing it) and why the labial artery pedicle lies in the submucosal plane. The vermilion is not a separate histological layer; it is a mucocutaneous transition zone coinciding with the white roll — a subtle cutaneous ridge at the vermilion-cutaneous junction.',
    concepts: ['lip-layers', 'labial-artery', 'perioral-landmarks'],
},

{
    id: 'q6', type: 'mcq', section: 'Anatomy',
    stem: 'What is the white roll, and why does even a 1 mm malalignment during lip reconstruction matter?',
    options: [
        { id: 'a', text: 'The mucosal fold at the wet-dry vermilion junction; malalignment causes chronic lip dryness' },
        { id: 'b', text: 'A subtle cutaneous ridge at the vermilion-cutaneous junction; even 1 mm mismatch is visible at conversational distance' },
        { id: 'c', text: 'The superior edge of the philtral column; malalignment distorts Cupid\'s bow symmetry' },
        { id: 'd', text: 'The orbicularis oris roll visible during lip eversion; malalignment impairs oral competence' },
    ],
    correct: 'b',
    brief: 'The white roll is a subtle cutaneous ridge at the vermilion-cutaneous junction. Even 1 mm malalignment creates a visible step-off that is immediately apparent to a casual observer.',
    detailed: 'The white roll and the vermilion border are the two most scrutinized landmarks during lip reconstruction. Together they form the line that separates the cutaneous (white) lip from the vermilion (red) lip. Because the human eye is highly sensitive to symmetry at the lips, even minor irregularities are conspicuous — far more so than equivalent mismatches on the nose or ear. This is why vermilion border alignment must be marked before infiltrating local anesthetic: tissue swelling from the anesthetic distorts these landmarks and makes intraoperative alignment unreliable.',
    concepts: ['perioral-landmarks', 'vermilion-alignment'],
},

// ════════════════ ONCOLOGY & EPIDEMIOLOGY ════════════════

{
    id: 'q7', type: 'mcq', section: 'Oncology',
    stem: 'What is the most common malignancy of the upper lip?',
    options: [
        { id: 'a', text: 'Squamous cell carcinoma' },
        { id: 'b', text: 'Basal cell carcinoma' },
        { id: 'c', text: 'Mucoepidermoid carcinoma' },
        { id: 'd', text: 'Melanoma' },
    ],
    correct: 'b',
    brief: 'Basal cell carcinoma is the most common malignancy of the upper lip. The upper lip is relatively UV-shielded, favoring BCC over the UV-driven SCC that predominates on the lower lip.',
    detailed: 'The upper lip receives less direct UV exposure than the lower lip due to the overhang of the nose and the downward-facing orientation of the lower lip\'s cutaneous surface. BCC is the most common skin cancer overall but its lip distribution differs from SCC, which specifically correlates with chronic UV exposure. The practical implication: an upper lip malignancy is more likely BCC, while a lower lip malignancy is more likely SCC — but both require biopsy for definitive diagnosis before planning reconstruction.',
    concepts: ['lip-cancer'],
},

{
    id: 'q8', type: 'mcq', section: 'Oncology',
    stem: 'What is the most common malignancy of the lower lip, and what percentage of all lip SCCs arise there?',
    options: [
        { id: 'a', text: 'Basal cell carcinoma; ~60% of lip BCCs' },
        { id: 'b', text: 'Squamous cell carcinoma; ~90% of all lip SCCs' },
        { id: 'c', text: 'Squamous cell carcinoma; ~50% of all lip SCCs' },
        { id: 'd', text: 'Melanoma; ~70% of lip melanomas' },
    ],
    correct: 'b',
    brief: 'Squamous cell carcinoma is the most common malignancy of the lower lip. Approximately 90% of all lip SCCs occur on the lower lip due to its greater UV exposure.',
    detailed: 'The lower lip\'s cutaneous surface faces upward and outward, receiving substantially more cumulative UV radiation than the upper lip. This UV exposure drives actinic damage and SCC development. Lower lip malignancy is also more common than upper lip malignancy overall. This epidemiologic pattern has reconstructive implications: because most lip cancers requiring reconstruction are lower lip SCCs, the reconstructive algorithm is weighted toward lower lip techniques (wedge excision, Abbe/Estlander, Karapandzic).',
    concepts: ['lip-cancer', 'lymphatic-drainage'],
},

{
    id: 'q9', type: 'mcq', section: 'Oncology',
    stem: 'Upper lip malignancies drain to ipsilateral cervical lymph nodes. What embryologic basis explains this pattern?',
    options: [
        { id: 'a', text: 'The upper lip receives unilateral arterial supply from the ipsilateral facial artery' },
        { id: 'b', text: 'The upper lip forms from fusion of the maxillary and medial nasal prominences, creating an embryologic midline boundary' },
        { id: 'c', text: 'The upper lip dermis has unilateral lymphatic channels that do not cross the philtral columns' },
        { id: 'd', text: 'The upper lip musculature is innervated by ipsilateral buccal branches, and lymphatics follow the motor nerve distribution' },
    ],
    correct: 'b',
    brief: 'The upper lip forms from bilateral fusion of the maxillary and medial nasal prominences, establishing an embryologic midline boundary. Lymphatic channels respect this boundary, producing ipsilateral drainage.',
    detailed: 'Embryologic development determines lymphatic drainage patterns throughout the head and neck. The upper lip derives from two paired processes — the maxillary prominences and the medial nasal prominences — that fuse in the midline. This fusion plane creates a true midline boundary that lymphatic channels do not cross. The clinical consequence: upper lip cancers can generally be treated with ipsilateral neck staging or surveillance. The lower lip, by contrast, develops as a single midline structure from the mandibular process with no embryologic left/right partition, allowing bilateral drainage.',
    concepts: ['lymphatic-drainage', 'embryologic-development'],
},

{
    id: 'q10', type: 'mcq', section: 'Oncology',
    stem: 'How does the lymphatic drainage of the lower lip differ from the upper lip, and what is the clinical consequence?',
    options: [
        { id: 'a', text: 'Strictly ipsilateral; the lower lip shares the upper lip\'s embryologic midline boundary' },
        { id: 'b', text: 'Bilateral drainage is possible, especially for centrally located lesions; the lower lip develops from a single midline mandibular process with no embryologic left/right boundary' },
        { id: 'c', text: 'Contralateral only; the lower lip drains to the opposite side by convention' },
        { id: 'd', text: 'No cervical drainage; the lower lip drains directly to the submental nodes without further spread' },
    ],
    correct: 'b',
    brief: 'Lower lip lymphatic drainage can be bilateral because the lower lip develops from a single midline mandibular process without an embryologic left/right boundary.',
    detailed: 'This bilateral drainage potential is most clinically significant for centrally located lower lip lesions, which can spread to either or both sides of the neck. Lateralized lesions tend to drain ipsilaterally but can still cross the midline. The staging consequence: a lower lip SCC may require bilateral neck imaging, sentinel lymph node biopsy, or surveillance — particularly for midline or locally advanced tumors. Compare this with the upper lip\'s reliable ipsilateral pattern derived from its bilateral embryologic fusion.',
    concepts: ['lymphatic-drainage', 'embryologic-development', 'lip-cancer'],
},

// ════════════════ RECONSTRUCTIVE PRINCIPLES ════════════════

{
    id: 'q11', type: 'mcq', section: 'Principles',
    stem: 'Which defect-size category is correctly matched with its primary reconstructive approach for full-thickness lower lip defects?',
    options: [
        { id: 'a', text: '<1/3 lip width → Abbe flap; 1/3–2/3 → Karapandzic; >2/3 → primary closure' },
        { id: 'b', text: '<1/3 lip width → primary closure; 1/3–2/3 → Abbe/Estlander/Karapandzic; >2/3 → advancement flaps or free tissue transfer' },
        { id: 'c', text: '<1/2 lip width → mucosal advancement; 1/2–2/3 → free flap; >2/3 → Gillies fan' },
        { id: 'd', text: '<1/3 lip width → primary closure; 1/3–2/3 → Bernard-Burow-Webster; >2/3 → Abbe flap' },
    ],
    correct: 'b',
    brief: 'The lip reconstruction algorithm is defect-size-driven: <1/3 → primary closure (wedge), 1/3–2/3 → cross-lip or rotation flaps (Abbe, Estlander, Karapandzic), >2/3 → regional advancement or free tissue transfer.',
    detailed: 'This three-tier framework is the foundation of the lip reconstruction decision tree. Within the middle tier (1/3–2/3), the next branch point is commissure involvement: Estlander if the commissure is involved, Abbe if spared, and Karapandzic for larger defects requiring more tissue recruitment. The alternative threshold system in some references (<30%, 30–60%, 60–80%, >80%) adds a fourth tier recognizing near-total defects (>80%) as requiring microvascular free tissue transfer when local tissue is inadequate. Both frameworks converge on the same principle: reconstruct with the simplest technique that restores form and function.',
    concepts: ['reconstructive-algorithm'],
},

{
    id: 'q12', type: 'mcq', section: 'Principles',
    stem: 'In the reconstructive algorithm for full-thickness lip defects of the middle tier (1/3–2/3), what single factor determines whether to use an Abbe flap or an Estlander flap?',
    options: [
        { id: 'a', text: 'Whether the defect is on the upper or lower lip' },
        { id: 'b', text: 'Whether the defect involves the oral commissure' },
        { id: 'c', text: 'Whether the patient has had prior radiation' },
        { id: 'd', text: 'Whether adequate vermilion remains for border alignment' },
    ],
    correct: 'b',
    brief: 'Commissure involvement is the single biggest branch point: Estlander if the commissure is involved, Abbe if the commissure is spared.',
    detailed: 'Both flaps are full-thickness, labial-artery-pedicled cross-lip flaps with identical design principles (width = half the defect). They differ only in their relationship to the commissure. The Abbe flap transfers tissue from one lip to a defect medial to the commissure on the other lip and requires a two-stage procedure (pedicle division at ~21 days). The Estlander flap is designed to incorporate the commissure itself, rotating tissue around it to create a neo-commissure at the pivot point — often completable in a single stage. This distinction also predicts the secondary procedure needed: commissuroplasty for the Estlander\'s blunted neo-commissure, versus none for the Abbe flap.',
    concepts: ['commissure-decision', 'abbe-flap', 'estlander-flap'],
},

{
    id: 'q13', type: 'mcq', section: 'Principles',
    stem: 'Why must the vermilion border be marked before infiltrating local anesthetic for lip reconstruction?',
    options: [
        { id: 'a', text: 'Local anesthetic causes blanching that makes the vermilion invisible' },
        { id: 'b', text: 'Tissue swelling from local anesthetic distorts the vermilion border and white roll, making intraoperative alignment unreliable' },
        { id: 'c', text: 'The anesthetic diffuses across the midline and obscures the philtral columns' },
        { id: 'd', text: 'Vasoconstriction from epinephrine causes the vermilion to retract inferiorly' },
    ],
    correct: 'b',
    brief: 'Tissue swelling from local anesthetic distorts the vermilion border and white roll. Even small mismatches are immediately obvious to a casual observer, so landmarks must be marked before injection.',
    detailed: 'This is a core surgical pearl: the vermilion border and white roll are the landmarks most sensitive to malalignment during lip reconstruction. A 1 mm step-off is visible at conversational distance. Local anesthetic infiltration causes tissue edema that shifts these landmarks unpredictably. The solution is to mark them with ink or a needle scratch before any injection. This principle extends to all perioral surgery — lip biopsies, Mohs reconstructions, and cleft lip repair all require pre-anesthetic landmark identification.',
    concepts: ['vermilion-alignment', 'perioral-landmarks'],
},

{
    id: 'q14', type: 'mcq', section: 'Principles',
    stem: 'What functional consequence results from failure to realign orbicularis oris muscle fibers along their original orientation during full-thickness lip repair?',
    options: [
        { id: 'a', text: 'Lip numbness from mental nerve traction' },
        { id: 'b', text: 'Wound dehiscence from excessive tension' },
        { id: 'c', text: 'The unrepaired muscular defect contracts during healing, producing a permanent notch at the wet-lip border and impaired sphincteric function' },
        { id: 'd', text: 'Excessive scar contracture producing microstomia' },
    ],
    correct: 'c',
    brief: 'Failure to realign orbicularis oris produces a permanent notch at the wet-lip border from unbalanced wound contraction, plus impaired sphincteric function (oral incompetence).',
    detailed: 'Orbicularis oris is a circumferential sphincter whose fibers must be in continuity to generate the seal needed for eating, drinking, and speech. Disrupted fibers heal with scar rather than functional muscle, creating an area of focal weakness. During healing, the intact muscle fibers on either side of the defect contract and pull the wound edges inward — but the unreconstructed gap between them creates a visible notch at the wet-lip/dry-lip junction. Repairing the muscle in its own layer is therefore not optional: it restores both functional competence and aesthetic contour. This principle also explains why Karapandzic flaps are functionally superior — they maintain orbicularis oris continuity rather than transecting it.',
    concepts: ['sphincter-repair', 'karapandzic-flap'],
},

{
    id: 'q15', type: 'mcq', section: 'Principles',
    stem: 'During undermining for lip advancement flaps, the standard dissection plane is:',
    options: [
        { id: 'a', text: 'Deep to the orbicularis oris, in the submucosal plane' },
        { id: 'b', text: 'Superficial to orbicularis oris, preserving muscle integrity and vascular supply' },
        { id: 'c', text: 'Within the orbicularis oris, splitting the muscle along its fiber direction' },
        { id: 'd', text: 'Deep to the buccinator, in the buccal space' },
    ],
    correct: 'b',
    brief: 'Lip advancement flaps are undermined superficial to the orbicularis oris. This preserves the muscle\'s integrity and its vascular supply from the labial arteries running on its deep surface.',
    detailed: 'Dissecting superficial to the orbicularis oris mobilizes skin and subcutaneous tissue while leaving the muscle and its submucosal vasculature intact. This plane is used for cutaneous lip defects (perialar crescentic advancement, melolabial transposition) and for the mucosal advancement flap (which dissects between mucosa/submucosa and the muscle\'s deep surface). Full-thickness flaps (Abbe, Estlander, Karapandzic) by definition traverse all layers, but even in those procedures, the pedicle dissection respects the submucosal vascular plane.',
    concepts: ['flap-design', 'labial-artery'],
},

// ════════════════ SMALL/MEDIUM DEFECTS ════════════════

{
    id: 'q16', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'A mucosal advancement flap is best indicated for which type of lip defect?',
    options: [
        { id: 'a', text: 'Full-thickness defects <1/3 of lip width' },
        { id: 'b', text: 'Isolated vermilion defects without full-thickness loss' },
        { id: 'c', text: 'Defects involving the oral commissure' },
        { id: 'd', text: 'Large cutaneous defects with intact vermilion' },
    ],
    correct: 'b',
    brief: 'Mucosal advancement flaps reconstruct isolated vermilion defects where the underlying orbicularis oris and cutaneous lip are intact.',
    detailed: 'The vermilion is reconstructed by advancing oral mucosa from the gingivolabial sulcus. The incision runs commissure to commissure along the vermilion border; mucosa is undermined deep to the minor salivary glands (which ride with the flap), superficial to the orbicularis oris. This is not appropriate for full-thickness defects because it does not restore muscle or skin. The resulting lip will have a thinner red lip than the native vermilion — some surgeons augment with a supraclavicular dermal-fat graft placed under the flap to restore bulk.',
    concepts: ['mucosal-advancement'],
},

{
    id: 'q17', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'During a mucosal advancement flap, where is the mucosa undermined to mobilize it toward the vermilion border?',
    explanationImage: 'img/oksat/lip-recon/mucosal-advancement.jpg',
    explanationImageAlt: 'Clinical photos showing stages of mucosal advancement flap for vermilion reconstruction',
    options: [
        { id: 'a', text: 'Between mucosa and orbicularis oris, superficial to minor salivary glands' },
        { id: 'b', text: 'Deep to minor salivary glands but superficial to orbicularis oris, all the way to the gingivolabial sulcus' },
        { id: 'c', text: 'Between the orbicularis oris and the buccinator' },
        { id: 'd', text: 'In the subcutaneous plane between skin and muscle' },
    ],
    correct: 'b',
    brief: 'The mucosa is undermined deep to the minor salivary glands, superficial to orbicularis oris, all the way to the gingivolabial sulcus. The salivary glands travel with the flap.',
    detailed: 'This plane carries the minor salivary glands with the flap, which provides both bulk to the reconstructed vermilion and preserves the mucosal surface\'s moisture. The undermining extends from the commissure-to-commissure incision at the vermilion border all the way down to the gingivolabial sulcus, providing enough tissue laxity to advance the mucosa up to the white roll. The submucosal plane is consistent with the labial artery\'s position — the vessel runs in this same plane, so awareness of its location is important to avoid hemorrhage during undermining.',
    concepts: ['mucosal-advancement', 'labial-artery'],
},

{
    id: 'q18', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'For a lower lip defect involving less than one-third of the lip width, what is the primary reconstructive technique?',
    explanationImage: 'img/oksat/lip-recon/v-excision-clinical.jpg',
    explanationImageAlt: 'Clinical photos of full-thickness V-shaped excision: marking, post-excision closure, and healed result at 6 months',
    options: [
        { id: 'a', text: 'Abbe cross-lip flap' },
        { id: 'b', text: 'Primary wedge closure, with optional refinements (W-plasty, barrel excision)' },
        { id: 'c', text: 'Karapandzic rotation-advancement flap' },
        { id: 'd', text: 'Bernard-Burow-Webster advancement flaps' },
    ],
    correct: 'b',
    brief: 'Defects <1/3 of lip width are closed primarily with a wedge excision, refined with W-plasty or barrel excision variants to avoid crossing the mental crease.',
    detailed: 'Primary closure is the simplest reconstructive option and produces excellent results when enough lip tissue remains for tension-free layered repair. The closure is done in three layers: mucosa, orbicularis oris muscle (the critical functional layer), and skin. W-plasty modifications redirect the scar to avoid crossing the labiomental crease, where a vertical scar would be conspicuous. Barrel excision rounds the wedge tips to reduce standing cutaneous deformities. The upper limit of primary closure is roughly one-third of the lip width, though this varies with individual tissue laxity.',
    concepts: ['wedge-excision', 'reconstructive-algorithm'],
},

{
    id: 'q19', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'When performing a V-shaped full-thickness excision in the lateral lower lip, why is the V often skewed (asymmetric) rather than centered on the lesion?',
    explanationImage: 'img/oksat/lip-recon/v-excision-marking.jpg',
    explanationImageAlt: 'Lip marked for V-shaped excision with skewed orientation to accommodate lateral relaxed skin tension lines',
    options: [
        { id: 'a', text: 'To center the scar in the philtral column' },
        { id: 'b', text: 'To accommodate the slanted relaxed skin tension lines in the lateral lip' },
        { id: 'c', text: 'To avoid the mental nerve foramen' },
        { id: 'd', text: 'To preserve the marginal mandibular nerve' },
    ],
    correct: 'b',
    brief: 'A skewed V accommodates the slanted relaxed skin tension lines (RSTLs) in the lateral lip, placing the scar along lines of minimal tension for optimal healing.',
    detailed: 'RSTLs in the lateral lower lip run obliquely rather than vertically, so a symmetric midline-style V-excision would cross them and heal with a more visible scar under greater tension. Skewing the V aligns its limbs closer to the local RSTLs while still achieving a full-thickness excision with adequate margins. The central lower lip, by contrast, has more vertically oriented RSTLs, allowing a more symmetric wedge.',
    concepts: ['wedge-excision', 'flap-design'],
},

{
    id: 'q20', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'An O-to-T plasty for a lip defect leaves three standing cutaneous deformities after closure. Where should the vertical limb of the "T" be positioned?',
    options: [
        { id: 'a', text: 'Perpendicular to the vermilion border for maximum tissue recruitment' },
        { id: 'b', text: 'Along a natural crease or subunit boundary to minimize visible scarring' },
        { id: 'c', text: 'Centered on the mental crease to distribute tension evenly' },
        { id: 'd', text: 'In the commissure itself to hide the scar within the oral aperture' },
    ],
    correct: 'b',
    brief: 'The vertical limb should sit along a natural crease or subunit boundary (e.g., the vermilion-cutaneous border, the melolabial crease) to minimize visible scarring.',
    detailed: 'The O-to-T plasty uses wide undermining to advance tissue into a round or oval defect, with the closure forming a T-shaped scar. One standing cutaneous deformity is excised to form the vertical limb of the T; the other two are managed with undermining or allowed to settle. This technique is versatile for lateral upper lip and central/lateral lower lip defects. The key design principle is placing incisions along existing boundaries — the vermilion-cutaneous border and the alar-facial sulcus are ideal camouflage lines. Wide undermining reduces tension and distortion, but the technique requires enough surrounding tissue laxity.',
    concepts: ['o-to-t-plasty', 'flap-design'],
},

{
    id: 'q21', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'The V-to-Y island pedicle flap for lateral lip defects >1 cm² is a subcutaneous-pedicle advancement flap. What determines its width and incision length?',
    options: [
        { id: 'a', text: 'Width = defect width; incision length = defect height' },
        { id: 'b', text: 'Width = defect height; incision length = 2× defect width, tapered to a point' },
        { id: 'c', text: 'Width = 1.5× defect width; incision length = 3× defect height' },
        { id: 'd', text: 'Width and length are equal, forming an equilateral triangle' },
    ],
    correct: 'b',
    brief: 'Flap width equals the defect height, and incision length equals twice the defect width, tapered to a point. The pedicle can be narrowed to the central third and still maintain adequate blood supply.',
    detailed: 'The V-to-Y island pedicle flap is shaped as a V with the defect at its base. The incisions run along the alar-facial sulcus and vermilion border for camouflage. "Island" means the flap is connected to the surrounding tissue only by its deep subcutaneous pedicle — no skin bridges. This pedicle can be narrowed to the central third of the flap\'s width without compromising perfusion, providing significant mobility. The technique is reported for defects up to 3 cm² and is specifically suited to lateral cutaneous lip defects — not full-thickness defects requiring muscle reconstruction.',
    concepts: ['v-to-y-flap', 'flap-design'],
},

{
    id: 'q22', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'A melolabial transposition flap for cutaneous lip repair can be based on a superior or inferior pedicle. Which pedicle is favored for central upper lip defects?',
    explanationImage: 'img/oksat/lip-recon/melolabial-transposition.jpg',
    explanationImageAlt: 'Clinical photos of inferiorly based melolabial transposition flap for lateral lip repair',
    options: [
        { id: 'a', text: 'Inferior pedicle — blood supply is more reliable from below' },
        { id: 'b', text: 'Superior pedicle — it rotates tissue downward into the central upper lip from the cheek above' },
        { id: 'c', text: 'Either pedicle is equivalent; the choice is arbitrary' },
        { id: 'd', text: 'Neither — a free flap is required for central upper lip defects' },
    ],
    correct: 'b',
    brief: 'A superiorly based pedicle is favored for central upper lip defects; an inferiorly based pedicle is used for lateral upper or lower lip defects.',
    detailed: 'The melolabial transposition flap recruits medial cheek skin from the melolabial fold. The pedicle orientation determines the arc of rotation and the resulting tissue inset. A superior pedicle rotates tissue from the nasolabial fold downward into a central upper lip defect. An inferior pedicle serves lateral upper or lower lip defects. The transposed tissue should be only slightly wider than the defect to account for contracture. Known risks include trapdoor deformity (bulge from circumferential scar contraction), flattening of the melolabial fold (loss of the natural crease), and transposing hair-bearing skin into a non-hair-bearing area — the last requiring electrolysis or laser depilation.',
    concepts: ['melolabial-transposition', 'lip-subunits'],
},

{
    id: 'q23', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'What are the three principal risks of a melolabial transposition flap for lip reconstruction?',
    options: [
        { id: 'a', text: 'Microstomia, oral incompetence, and flap necrosis' },
        { id: 'b', text: 'Trapdoor deformity, flattening of the melolabial fold, and transposing hair-bearing skin into a non-hair-bearing area' },
        { id: 'c', text: 'Marginal mandibular nerve injury, parotid duct injury, and hematoma' },
        { id: 'd', text: 'Vermilion notching, lip asymmetry, and drooling' },
    ],
    correct: 'b',
    brief: 'The three principal risks are trapdoor deformity (circumferential scar contraction), flattening of the melolabial fold, and transposition of hair-bearing skin into the non-hair-bearing lip.',
    detailed: 'Trapdoor deformity occurs when circumferential scar contracture around the transposed flap creates a raised, bulging appearance. It can be addressed with scar revision and dermal thinning at 6–12 months. Flattening of the melolabial fold results from recruiting tissue from this natural crease, removing the depression that defines the aesthetic boundary between lip and cheek. Hair-bearing skin transfer is especially problematic in male patients with thick facial hair — the lip should be a non-hair-bearing surface, so depilation is often required. These risks collectively make the melolabial transposition flap best reserved for defects where advancement or V-to-Y flaps cannot provide adequate coverage.',
    concepts: ['melolabial-transposition'],
},

{
    id: 'q24', type: 'mcq', section: 'Small/Medium Defects',
    stem: 'Bilateral perialar crescentic advancement flaps are preferred over a unilateral flap for which type of upper lip defect, and why?',
    explanationImage: 'img/oksat/lip-recon/perialar-crescentic.jpg',
    explanationImageAlt: 'Clinical photos showing bilateral perialar crescentic advancement for full-thickness upper lip defect with 6-month follow-up',
    options: [
        { id: 'a', text: 'Lateral defects — bilateral flaps provide more tissue' },
        { id: 'b', text: 'Central defects — splitting tension between two flaps reduces distortion and improves perfusion' },
        { id: 'c', text: 'Commissure defects — bilateral flaps reconstruct both corners' },
        { id: 'd', text: 'Full-thickness defects — bilateral flaps restore muscle continuity' },
    ],
    correct: 'b',
    brief: 'Central upper lip defects benefit from bilateral perialar crescentic advancement because splitting the tension between two flaps reduces tissue distortion and improves perfusion compared to a unilateral flap.',
    detailed: 'The perialar crescentic advancement flap uses crescentic skin excisions along the alar-facial sulcus to create room for advancement. The dissection plane is superficial to the orbicularis oris. For central defects, bilateral flaps divide the closure tension equally on both sides, preventing asymmetric pull that would distort the nasal base or commissure. A unilateral flap suffices for defects just off midline, where one side can absorb the tension without significant distortion. The alar-facial sulcus incision provides excellent scar camouflage because it sits in a natural shadow line.',
    concepts: ['perialar-crescentic', 'lip-subunits'],
},

// ════════════════ LARGE DEFECTS ════════════════

{
    id: 'q25', type: 'mcq', section: 'Large Defects',
    stem: 'What is an Abbe flap?',
    image: 'img/oksat/lip-recon/abbe-flap-illustration.jpg',
    imageAlt: 'Illustration of Abbe cross-lip flap showing full-thickness flap rotated 180 degrees on labial artery pedicle',
    options: [
        { id: 'a', text: 'A rotation-advancement flap that preserves the neurovascular bundle near the commissure' },
        { id: 'b', text: 'A full-thickness cross-lip flap transferring skin, orbicularis oris, and mucosa from one lip to reconstruct a defect medial to the commissure in the other lip' },
        { id: 'c', text: 'A free tissue transfer from the forearm to the lip' },
        { id: 'd', text: 'A mucosal advancement flap for vermilion-only defects' },
    ],
    correct: 'b',
    brief: 'The Abbe flap is a full-thickness cross-lip (lip-switch) flap that transfers all three layers — skin, orbicularis oris, and mucosa — from the opposing lip to reconstruct a defect medial to the commissure.',
    detailed: 'The Abbe flap was first described in the English literature by Robert Abbe in 1898 (though similar techniques were described by Sabittini in 1837). It is an axial-pattern flap pedicled on the labial artery — specifically the contralateral labial artery relative to the defect. The flap is designed as a full-thickness triangular or rectangular segment of the donor lip, rotated 180° on its vascular pedicle into the defect. The pedicle bridges the oral aperture for approximately 21 days before second-stage division and inset. This technique uniquely restores like with like: lip tissue replaces lip tissue, including the sphincteric muscle layer.',
    concepts: ['abbe-flap', 'labial-artery'],
},

{
    id: 'q26', type: 'mcq', section: 'Large Defects',
    stem: 'An Abbe flap reconstructing a left lower lip defect is pedicled on which artery?',
    options: [
        { id: 'a', text: 'Left inferior labial artery' },
        { id: 'b', text: 'Right superior labial artery' },
        { id: 'c', text: 'Left superior labial artery' },
        { id: 'd', text: 'Right inferior labial artery' },
    ],
    correct: 'b',
    brief: 'The flap is pedicled on the contralateral labial artery relative to the defect. For a left lower lip defect, the donor tissue comes from the upper lip, pedicled on the right (superior) labial artery.',
    detailed: 'The naming convention follows the artery\'s origin: the upper lip carries the superior labial artery, and the donor flap is designed on the side contralateral to the defect. When the flap is rotated 180° into the lower lip defect, the pedicle — containing the right superior labial artery — bridges the oral aperture. This vascular anatomy is why the labial artery\'s submucosal position matters (see the anatomy section): the surgeon must dissect carefully near the vermilion to preserve the artery within the pedicle. Both labial arteries run within ~10 mm of the free margin near the midline, so the pedicle is reliably captured with a controlled full-thickness incision.',
    concepts: ['abbe-flap', 'labial-artery'],
},

{
    id: 'q27', type: 'mcq', section: 'Large Defects',
    stem: 'When designing an Abbe flap, the donor flap width should be approximately what fraction of the defect width, and why?',
    options: [
        { id: 'a', text: 'Equal to the defect width — a 1:1 ratio ensures adequate tissue' },
        { id: 'b', text: 'One-half the defect width — so both donor and recipient lips end up equal in width once healed' },
        { id: 'c', text: 'One-third the defect width — to minimize donor site morbidity' },
        { id: 'd', text: 'Twice the defect width — to account for flap contracture' },
    ],
    correct: 'b',
    brief: 'The donor flap width is designed at approximately one-half the defect width. This ratio ensures both lips end up equal in width after the donor site is closed and the flap is inset.',
    detailed: 'This is the key Abbe flap design principle: the donor lip loses tissue (narrowing it) and the recipient lip gains tissue (widening it). A 1:2 ratio means each lip changes by the same amount, producing symmetry. The flap height equals the defect height for full-thickness match. An important nuance: the resting tone of the orbicularis oris pulls wound edges together after excision, making the true defect appear smaller than it is before closure. The surgeon must account for this by measuring the defect before orbicularis retraction distorts the apparent width.',
    concepts: ['abbe-flap', 'flap-design'],
},

{
    id: 'q28', type: 'mcq', section: 'Large Defects',
    stem: 'During Abbe flap transfer, the flap is rotated how many degrees, and for how long is the pedicle maintained before division?',
    explanationImage: 'img/oksat/lip-recon/abbe-flap-diagram.jpg',
    explanationImageAlt: 'Line drawings showing Abbe flap excision from upper lip, 180-degree rotation, and final closure',
    options: [
        { id: 'a', text: '90° rotation; pedicle divided at 10 days' },
        { id: 'b', text: '180° rotation; pedicle maintained ~21 days before second-stage division' },
        { id: 'c', text: '270° rotation; pedicle maintained ~14 days' },
        { id: 'd', text: '180° rotation; pedicle divided at 7 days' },
    ],
    correct: 'b',
    brief: 'The flap is rotated 180° on its labial artery pedicle. The pedicle bridges the oral aperture for approximately 21 days before second-stage division and inset.',
    detailed: 'The 180° rotation brings the mucosal surface of the donor flap to face the oral cavity of the recipient lip, and the skin surface to face outward — matching the orientation of the recipient bed. During the pedicle phase, the patient is kept on a liquid or soft diet because the pedicle bridges the oral aperture and restricts mouth opening. The 21-day interval allows neovascularization from the recipient bed to establish independent perfusion of the flap before the pedicle is divided. Dividing too early risks partial flap necrosis. The second-stage procedure divides the pedicle and insets the remaining edges of the flap.',
    concepts: ['abbe-flap'],
},

{
    id: 'q29', type: 'mcq', section: 'Large Defects',
    stem: 'After pedicle division of an Abbe flap, the transferred tissue is initially denervated. What is the expected timeline and mechanism for functional recovery?',
    options: [
        { id: 'a', text: 'Motor function returns in 2–3 weeks via preserved nerve branches within the pedicle' },
        { id: 'b', text: 'Motor and sensory function typically return without special retraining, over approximately one year, via reinnervation from the recipient bed' },
        { id: 'c', text: 'No functional recovery occurs; the flap remains permanently denervated and adynamic' },
        { id: 'd', text: 'Motor function returns in 3 months; sensation never recovers' },
    ],
    correct: 'b',
    brief: 'Motor and sensory function typically return over approximately one year via reinnervation from the recipient bed. No special neuromuscular retraining is required.',
    detailed: 'The transferred orbicularis oris muscle is initially denervated because the nerve fibers are transected when the flap is elevated. Over ~12 months, motor axons from the intact orbicularis oris in the recipient lip sprout into the transferred muscle segment, restoring contraction. Sensory reinnervation follows a similar timeline. This spontaneous reinnervation distinguishes the Abbe flap from free tissue transfer, where the transferred muscle is permanently adynamic unless a motor nerve coaptation is performed. The Karapandzic flap, by contrast, never loses innervation because it preserves the neurovascular pedicle throughout.',
    concepts: ['abbe-flap', 'sphincter-repair'],
},

{
    id: 'q30', type: 'mcq', section: 'Large Defects',
    stem: 'How does the extended Abbe flap differ from the standard version?',
    options: [
        { id: 'a', text: 'It uses a free tissue graft rather than a pedicled flap' },
        { id: 'b', text: 'It incorporates a vertical labiomental branch off the inferior labial artery, extending coverage to the columella, perialar area, or premaxilla' },
        { id: 'c', text: 'It uses bilateral flaps from both lips simultaneously' },
        { id: 'd', text: 'It adds a nerve graft to provide immediate motor reinnervation' },
    ],
    correct: 'b',
    brief: 'The extended Abbe flap incorporates a vertical labiomental branch of the inferior labial artery, allowing coverage of large composite defects reaching the columella, perialar area, or premaxilla.',
    detailed: 'The labiomental branch supplies the chin and submental region. By including this vascular territory in the flap design, the surgeon can harvest a larger segment of tissue with reliable perfusion — extending the standard Abbe flap beyond the lip proper to reconstruct adjacent structures. This variant is specifically indicated when adjacent cheek tissue is inadequate for perialar or columellar reconstruction and the defect extends beyond what a standard Abbe flap can reach.',
    concepts: ['abbe-flap', 'labial-artery'],
},

{
    id: 'q31', type: 'mcq', section: 'Large Defects',
    stem: 'The Estlander flap shares the same labial-artery-pedicled, full-thickness concept as the Abbe flap. What is the key indication that differentiates the Estlander from the Abbe?',
    image: 'img/oksat/lip-recon/estlander-diagram.jpg',
    imageAlt: 'Diagram of Estlander flap showing rotation around the commissure with neo-commissure at pivot point',
    options: [
        { id: 'a', text: 'The Estlander is used when the defect is on the upper lip; the Abbe is only for lower lip defects' },
        { id: 'b', text: 'The Estlander is used when the defect involves the oral commissure; the Abbe is used when the commissure is spared' },
        { id: 'c', text: 'The Estlander uses a free graft; the Abbe uses a pedicled flap' },
        { id: 'd', text: 'The Estlander is larger (>2/3 of lip); the Abbe is for smaller (1/3–1/2) defects' },
    ],
    correct: 'b',
    brief: 'The Estlander flap is used when the defect involves the oral commissure. The Abbe flap is reserved for defects that spare the commissure.',
    detailed: 'Both flaps use identical principles: full-thickness composite tissue from the opposing lip, pedicled on the labial artery, with width = half the defect. The commissure involvement determines which one. The Estlander flap\'s lateral incision is designed to incorporate the oral commissure itself, with the incision lying along the melolabial sulcus. The new oral commissure ends up at the pivot point of the flap — recreating the corner of the mouth from tissue that was previously mid-lip. This commissure-reconstructing design is what allows the Estlander to be completed as a single-stage procedure in many cases.',
    concepts: ['estlander-flap', 'commissure-decision'],
},

{
    id: 'q32', type: 'mcq', section: 'Large Defects',
    stem: 'Unlike the Abbe flap\'s two-stage design, the Estlander flap can often be completed in a single stage. Why?',
    explanationImage: 'img/oksat/lip-recon/estlander-illustration.jpg',
    explanationImageAlt: 'Four-panel illustration of Estlander flap showing defect, flap design, rotation, and closure with neo-commissure',
    options: [
        { id: 'a', text: 'The Estlander flap does not require a vascular pedicle' },
        { id: 'b', text: 'The flap rotates around the commissure rather than bridging the oral aperture, so the pedicle does not need to be divided separately' },
        { id: 'c', text: 'The Estlander flap uses a random-pattern rather than axial blood supply' },
        { id: 'd', text: 'The Estlander flap is always smaller and revascularizes immediately' },
    ],
    correct: 'b',
    brief: 'The Estlander flap rotates around the commissure itself. Because the pivot point becomes the neo-commissure, the pedicle does not bridge the oral aperture and often does not need a separate division stage.',
    detailed: 'In an Abbe flap, the pedicle bridges across the oral aperture (upper lip to lower lip), physically linking the two lips and requiring a second-stage procedure to divide it and separate the lips. The Estlander flap avoids this because it rotates around the commissure — the pedicle stays at the corner of the mouth, where it becomes incorporated into the reconstruction as the new commissure. However, some surgeons still elect to perform a two-stage Estlander depending on flap bulk and design. The trade-off is that the neo-commissure is typically rounded and blunted, often requiring secondary commissuroplasty.',
    concepts: ['estlander-flap', 'abbe-flap'],
},

{
    id: 'q33', type: 'mcq', section: 'Large Defects',
    stem: 'What is the principal aesthetic complication of the Estlander flap, and what secondary procedure addresses it?',
    options: [
        { id: 'a', text: 'Microstomia → oral stretching exercises' },
        { id: 'b', text: 'Lip asymmetry → contralateral lip reduction' },
        { id: 'c', text: 'Rounded/blunted neo-commissure → secondary commissuroplasty' },
        { id: 'd', text: 'Vermilion notching → mucosal advancement flap' },
    ],
    correct: 'c',
    brief: 'The Estlander flap produces a rounded, blunted neo-commissure because the pivot point lacks the sharp angle of a natural oral commissure. Secondary commissuroplasty restores the angle.',
    detailed: 'The natural oral commissure has a sharp, well-defined angle where the upper and lower lip vermilion meet. When the Estlander flap rotates tissue around this point, the resulting neo-commissure is a smooth curve rather than a defined angle — creating a rounded, blunted appearance. Commissuroplasty (Dieffenbach or Converse technique) is typically performed 3–6 months after the initial reconstruction, once healing is complete and tissue has softened. This secondary procedure reshapes the rounded corner into a more natural-appearing angle. Note that the Karapandzic flap shares this same complication of blunted commissures, though via a different mechanism (bilateral rotation rather than cross-lip transfer).',
    concepts: ['estlander-flap', 'commissure-decision'],
},

{
    id: 'q34', type: 'mcq', section: 'Large Defects',
    stem: 'What is the defining innovation of the Karapandzic flap (described in 1974) compared to the older Gillies fan flap?',
    options: [
        { id: 'a', text: 'The Karapandzic flap uses free tissue transfer instead of local tissue' },
        { id: 'b', text: 'The Karapandzic flap uses full-thickness cuts to mobilize more tissue' },
        { id: 'c', text: 'The Karapandzic flap uses partial-thickness incisions that preserve the neurovascular pedicle, maintaining dynamic sphincter function and sensation' },
        { id: 'd', text: 'The Karapandzic flap reconstructs the commissure; the Gillies flap does not' },
    ],
    correct: 'c',
    brief: 'The Karapandzic flap uses curvilinear, partial-thickness incisions that meticulously preserve the neurovascular pedicle — labial arteries, buccal and marginal mandibular motor nerves, and mental sensory nerves — maintaining dynamic oral sphincter function and sensation.',
    detailed: 'The Gillies fan flap uses full-thickness cuts that transect motor and sensory nerves, producing a denervated, adynamic reconstructed lip segment. Karapandzic\'s refinement was to dissect around (not through) the neurovascular bundle near the commissure — the bundle containing the labial artery branches plus the buccal and marginal mandibular branches of the facial nerve. This requires meticulous skeletonization of each neurovascular structure during the partial-thickness incisions, adding surgical complexity but preserving the functional integrity that makes the Karapandzic flap uniquely capable of maintaining oral competence. The Karapandzic is a bilateral rotation-advancement flap, with curvilinear incisions running from the defect edges into the melolabial and nasolabial creases.',
    concepts: ['karapandzic-flap', 'gillies-fan', 'sphincter-repair'],
},

{
    id: 'q35', type: 'mcq', section: 'Large Defects',
    stem: 'Which of the following lip reconstruction flaps preserves dynamic oral sphincter function, motor innervation, and sensation in the reconstructed lip?',
    options: [
        { id: 'a', text: 'Abbe flap' },
        { id: 'b', text: 'Estlander flap' },
        { id: 'c', text: 'Gillies fan flap' },
        { id: 'd', text: 'Karapandzic flap' },
    ],
    correct: 'd',
    brief: 'Only the Karapandzic flap preserves all three: dynamic sphincter function, motor innervation, and sensation. Abbe, Estlander, and Gillies flaps all produce initially denervated tissue.',
    detailed: 'This is a high-yield differentiator. The Abbe and Estlander flaps transfer denervated tissue that reinnervates slowly over ~12 months from the recipient bed. The Gillies fan flap makes full-thickness cuts that transect nerves, producing permanent denervation of the rotated segment. Only the Karapandzic flap — through its partial-thickness dissection preserving the buccal/marginal mandibular motor nerves and mental sensory nerves — maintains immediate postoperative sphincter function. The trade-off is the well-known disadvantage of microstomia: recruiting tissue circumorally narrows the oral aperture, which may require secondary commissuroplasty.',
    concepts: ['karapandzic-flap', 'sphincter-repair', 'abbe-flap'],
},

{
    id: 'q36', type: 'mcq', section: 'Large Defects',
    stem: 'What are the primary disadvantages of the Karapandzic flap?',
    options: [
        { id: 'a', text: 'Flap necrosis and need for a second-stage pedicle division' },
        { id: 'b', text: 'Permanent denervation and oral incompetence' },
        { id: 'c', text: 'Microstomia and blunted/rounded commissures' },
        { id: 'd', text: 'Donor site morbidity on the forearm' },
    ],
    correct: 'c',
    brief: 'The Karapandzic flap\'s primary disadvantages are microstomia (narrowing of the oral aperture from bilateral tissue recruitment) and blunted commissures.',
    detailed: 'Microstomia is the inherent trade-off of circumoral tissue recruitment — the more tissue rotated inward from the cheeks, the smaller the resulting oral aperture. Severe microstomia may interfere with eating, dental care, and intubation. Secondary commissuroplasty (Dieffenbach or Converse procedure) at 3–6 months can partially widen the aperture. Blunted commissures result from the same rotation mechanism. Despite these drawbacks, the Karapandzic flap remains the preferred technique for defects of 50–80% of the lip width because preserving sphincter function is generally prioritized over aperture size.',
    concepts: ['karapandzic-flap'],
},

{
    id: 'q37', type: 'mcq', section: 'Large Defects',
    stem: 'The Gillies fan flap is a rotation-advancement flap for large lateral lower lip defects. What artery is it based on, and how do its incisions differ from the Karapandzic flap?',
    options: [
        { id: 'a', text: 'Inferior labial artery; partial-thickness incisions preserving nerves' },
        { id: 'b', text: 'Superior labial artery; full-thickness incisions that transect the neurovascular pedicle' },
        { id: 'c', text: 'Facial artery; subperiosteal incisions' },
        { id: 'd', text: 'Mental artery; mucosal-only incisions' },
    ],
    correct: 'b',
    brief: 'The Gillies fan flap is based on the superior labial artery and uses full-thickness incisions — unlike the Karapandzic flap\'s partial-thickness dissection, the Gillies flap transects the neurovascular pedicle.',
    detailed: 'The Gillies fan flap incisions start at the inferior defect edge, extend laterally around the commissure and superiorly into the melolabial fold, then curve toward the superior vermilion — all while preserving the superior labial artery pedicle. Despite the artery being preserved, the full-thickness incisions cut through the buccal and marginal mandibular motor nerves and the mental sensory nerve. This produces a denervated, adynamic reconstructed lip that cannot generate voluntary sphincteric contraction. Oral competence is therefore reduced compared to the Karapandzic. The Gillies flap maintains orbicularis oris continuity (the muscle is rotated as a unit), but without its innervation, this continuity is structural rather than functional.',
    concepts: ['gillies-fan', 'karapandzic-flap', 'labial-artery'],
},

{
    id: 'q38', type: 'mcq', section: 'Large Defects',
    stem: 'How does the McGregor modification improve upon the standard Gillies fan flap?',
    options: [
        { id: 'a', text: 'It preserves the neurovascular bundle, converting the Gillies flap into a Karapandzic flap' },
        { id: 'b', text: 'It uses a free graft to replace the vermilion' },
        { id: 'c', text: 'It rotates the flap about the commissure itself, bringing the medial flap margin up to form the new vermilion border directly' },
        { id: 'd', text: 'It adds a second stage for pedicle division' },
    ],
    correct: 'c',
    brief: 'The McGregor modification rotates the flap about the commissure itself (rather than a point adjacent to it), so the medial flap margin becomes the new vermilion border directly — improving the aesthetic match.',
    detailed: 'In the standard Gillies flap, the pivot point is adjacent to the commissure, meaning the rotated tissue arrives at the defect with its margin offset from the vermilion border — requiring additional vermilion reconstruction. The McGregor modification shifts the pivot point to the commissure itself, aligning the flap\'s medial edge with the vermilion border and reducing the need for separate vermilion reconstruction. Both versions still produce a rounded commissure that may need commissuroplasty, and both still transect the neurovascular pedicle (neither is a Karapandzic variant).',
    concepts: ['gillies-fan'],
},

// ════════════════ SUBTOTAL/TOTAL RECONSTRUCTION ════════════════

{
    id: 'q39', type: 'mcq', section: 'Subtotal/Total',
    stem: 'Bernard-Burow-Webster flaps are indicated for which type of lip defect?',
    options: [
        { id: 'a', text: 'Medium defects (1/3–2/3) involving the commissure' },
        { id: 'b', text: 'Near-total or total lower lip defects that spare the commissure' },
        { id: 'c', text: 'Isolated vermilion defects' },
        { id: 'd', text: 'Upper lip defects with philtral involvement' },
    ],
    correct: 'b',
    brief: 'Bernard-Burow-Webster flaps are bilateral cheek advancement flaps used for near-total or total lower lip defects that spare the commissure.',
    detailed: 'When defects exceed what circumoral rotation (Karapandzic) or cross-lip transfer (Abbe/Estlander) can reconstruct — generally >2/3 of the lip — tissue must be recruited from the cheeks. The Bernard-Burow-Webster technique advances medial cheek soft tissue plus mucosa bilaterally into the central defect. Triangular (Burow\'s) excisions are removed at the perialar and labiomental creases to allow advancement without cheek distortion. Because this advanced cheek tissue lacks orbicularis oris muscle, the reconstructed lip has significant neuromuscular dysfunction and the missing vermilion must be recreated with a buccal mucosal or tongue flap.',
    concepts: ['bernard-burow', 'reconstructive-algorithm'],
},

{
    id: 'q40', type: 'mcq', section: 'Subtotal/Total',
    stem: 'When planning Bernard-Burow-Webster flaps, the horizontal length of each cheek limb and the height of each limb are determined by what measurements?',
    options: [
        { id: 'a', text: 'Length = the total defect width; height = half the lip height' },
        { id: 'b', text: 'Length = half the desired horizontal lip length; height = the desired lip height' },
        { id: 'c', text: 'Both length and height equal the defect dimensions exactly' },
        { id: 'd', text: 'Length = twice the defect width; height = the defect height plus 1 cm' },
    ],
    correct: 'b',
    brief: 'Each cheek limb\'s horizontal length = half the desired horizontal lip length; height = the desired lip height. Two limbs advancing bilaterally together reconstruct the full lip width.',
    detailed: 'This 1:2 ratio (each side provides half the lip width) ensures symmetric bilateral advancement. The Burow\'s triangles — full-thickness crescentic excisions at the perialar and labiomental creases — are critical to prevent bunching and distortion of the cheek tissue as it advances medially. Without these excisions, the advancement would create standing cutaneous deformities and distort the nose. The technique is powerful but causes significant facial deformity and neuromuscular dysfunction because the advanced tissue is cheek (not lip), lacking the specialized orbicularis oris muscle and lip innervation.',
    concepts: ['bernard-burow', 'flap-design'],
},

{
    id: 'q41', type: 'mcq', section: 'Subtotal/Total',
    stem: 'Why are Bernard-Burow-Webster flaps generally considered a last resort in the lip reconstruction algorithm?',
    options: [
        { id: 'a', text: 'They require microsurgical expertise' },
        { id: 'b', text: 'The advanced cheek tissue lacks orbicularis oris, causing significant neuromuscular dysfunction and facial deformity; the missing vermilion must be separately reconstructed' },
        { id: 'c', text: 'They have a high rate of flap necrosis' },
        { id: 'd', text: 'They cannot be combined with other flap techniques' },
    ],
    correct: 'b',
    brief: 'The advanced cheek tissue lacks orbicularis oris muscle, producing significant neuromuscular dysfunction (oral incompetence) and facial deformity. The absent vermilion must be recreated with a buccal mucosal or tongue flap.',
    detailed: 'Unlike the Karapandzic flap, which rotates lip tissue with its innervation intact, or the Abbe flap, which transfers lip tissue that can reinnervate, the Bernard-Burow-Webster technique advances non-lip tissue (cheek skin, subcutaneous fat, and buccal mucosa) that has no orbicularis oris and no sphincteric function. The reconstructed lip can close passively at rest but cannot generate the active contraction needed for oral competence during eating, drinking, or speech. Additionally, the advanced cheek skin has no vermilion, so a separate buccal mucosal or tongue flap must be performed to create a neovermilion — adding another stage to an already complex reconstruction.',
    concepts: ['bernard-burow', 'sphincter-repair'],
},

{
    id: 'q42', type: 'mcq', section: 'Subtotal/Total',
    stem: 'A nasolabial flap for lower lip reconstruction has its width dictated by what measurement, and what additional flap is commonly needed?',
    options: [
        { id: 'a', text: 'Width = the horizontal defect width; additional tongue flap for oral lining' },
        { id: 'b', text: 'Width = the vertical height of the lip defect; a buccal mucosal flap is commonly added to create a neovermilion' },
        { id: 'c', text: 'Width = twice the defect width; no additional flap needed' },
        { id: 'd', text: 'Width = the distance from commissure to commissure; additional skin graft for the donor site' },
    ],
    correct: 'b',
    brief: 'Nasolabial flap width = the vertical height of the lip defect. A buccal mucosal flap is commonly added to create a neovermilion because the nasolabial skin lacks vermilion.',
    detailed: 'The nasolabial (melolabial) flap is drawn from the nasolabial fold and rotated into the lip defect. It is used as a less morbid alternative to large bilateral cheek advancement flaps for near-total/total lower lip defects, or for large lateral upper lip defects. Like the Bernard-Burow-Webster, the nasolabial flap provides cutaneous tissue without orbicularis oris — so sphincteric function is not restored. The buccal mucosal flap to create the neovermilion can be harvested from the inner cheek, providing mucosal tissue that approximates the appearance and moisture of native vermilion.',
    concepts: ['nasolabial-flap'],
},

{
    id: 'q43', type: 'mcq', section: 'Subtotal/Total',
    stem: 'When is free tissue transfer indicated in lip reconstruction, and what is the classic donor site with its key adjunct?',
    options: [
        { id: 'a', text: 'For any defect >1/3; anterolateral thigh flap with gracilis muscle' },
        { id: 'b', text: 'When local/regional tissue is inadequate (prior radiation, extensive resection); radial forearm free flap, often with palmaris longus tendon sling for static sphincter support' },
        { id: 'c', text: 'For commissure defects only; fibula free flap with osseous reconstruction' },
        { id: 'd', text: 'For all total lip defects regardless of local tissue; latissimus dorsi flap' },
    ],
    correct: 'b',
    brief: 'Free tissue transfer is reserved for defects where local/regional tissue is inadequate (prior radiation, extensive resection). The classic choice is the radial forearm free flap (RFFF), often combined with a palmaris longus tendon sling for static oral sphincter support.',
    detailed: 'The RFFF provides thin, pliable fasciocutaneous tissue that closely matches lip thickness. The palmaris longus tendon — harvested in continuity with the radial forearm flap — serves as a static suspension sling anchored to the bilateral oral modioli or zygomatic arches, preventing gravity-induced lip ptosis and severe oral incontinence (drooling). This tendon sling provides static oral competence at rest, though voluntary pucker and dynamic function are not restored. An alternative donor is the anterolateral thigh (ALT) flap, which offers more tissue bulk and can incorporate tensor fascia lata for sling support, but its thickness can be problematic for lip reconstruction.',
    concepts: ['free-flap-lip', 'reconstructive-algorithm'],
},

{
    id: 'q44', type: 'mcq', section: 'Subtotal/Total',
    stem: 'A radial forearm free flap for total lip reconstruction includes a palmaris longus tendon sling. Where is the tendon anchored, and what function does it restore?',
    options: [
        { id: 'a', text: 'Anchored to the mandibular periosteum; restores dynamic oral sphincter function' },
        { id: 'b', text: 'Anchored to the bilateral oral modioli or zygomatic arches; provides static oral continence at rest' },
        { id: 'c', text: 'Anchored to the masseter muscle; provides dynamic chewing function' },
        { id: 'd', text: 'Anchored to the nasal spine; restores lip elevation during speech' },
    ],
    correct: 'b',
    brief: 'The palmaris longus tendon sling is anchored under tension to the bilateral oral modioli or zygomatic arches, establishing a static suspension that prevents lip ptosis and restores oral continence at rest.',
    detailed: 'The modiolus is the fibromuscular convergence point at each oral commissure where multiple facial expression muscles insert — it acts as a natural anchor point for the tendon sling. Anchoring the palmaris longus between both modioli (or to the zygomatic arches for higher suspension) creates a hammock-like support under the reconstructed lip. This prevents the flap from sagging under gravity and controls drooling at rest. It provides static, not dynamic, support — the patient cannot generate voluntary lip contraction. Dynamic function can be partially augmented by transferring local innervated muscle slips (depressor anguli oris or masseter) at a separate stage. The palmaris longus is absent in ~14% of individuals; the plantaris tendon is an alternative.',
    concepts: ['free-flap-lip', 'labial-artery'],
},

// ════════════════ CASES ════════════════

{
    id: 'q45', type: 'mcq', section: 'Cases',
    stem: 'A 68-year-old farmer presents with a 2.5 cm ulcerated lesion on the central lower lip. Biopsy confirms squamous cell carcinoma. Given the location, what pattern of lymphatic spread should inform the neck staging?',
    options: [
        { id: 'a', text: 'Strictly ipsilateral drainage — only the ipsilateral neck needs evaluation' },
        { id: 'b', text: 'Bilateral cervical drainage is possible — both sides of the neck should be evaluated, especially for a central lesion' },
        { id: 'c', text: 'No cervical drainage — lower lip SCC rarely metastasizes' },
        { id: 'd', text: 'Contralateral drainage only — lower lip lesions cross to the opposite side' },
    ],
    correct: 'b',
    brief: 'Central lower lip lesions can drain bilaterally because the lower lip develops from a single midline mandibular process without an embryologic left/right boundary. Both sides of the neck require evaluation.',
    detailed: 'This case integrates two foundational concepts: (1) lower lip = most common site for lip SCC (~90% of lip SCCs), and (2) lower lip lymphatic drainage = bilateral potential, especially for midline/central lesions. The staging work-up should include bilateral imaging or bilateral sentinel lymph node biopsy. Contrast this with an upper lip malignancy, where the embryologic midline boundary from maxillary/medial nasal prominence fusion restricts drainage to the ipsilateral side. The farmer\'s occupation (chronic UV exposure) reinforces the epidemiologic link between UV exposure and lower lip SCC.',
    concepts: ['case-lower-lip-scc', 'lymphatic-drainage', 'lip-cancer'],
},

{
    id: 'q46', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Wide local excision of the lower lip SCC results in a full-thickness defect measuring approximately 40% of the total lip width. The oral commissure is intact bilaterally. Which reconstructive technique is most appropriate?',
    options: [
        { id: 'a', text: 'Primary wedge closure' },
        { id: 'b', text: 'Abbe cross-lip flap' },
        { id: 'c', text: 'Estlander flap' },
        { id: 'd', text: 'Bernard-Burow-Webster advancement flaps' },
    ],
    correct: 'b',
    brief: 'A 40% defect falls in the middle tier (1/3–2/3). With the commissure intact, the Abbe flap is the appropriate choice — the commissure-sparing branch of the algorithm.',
    detailed: 'Walking the algorithm: (1) Defect size = 40% → too large for primary closure (<1/3), appropriate for cross-lip or rotation flaps (1/3–2/3). (2) Commissure involved? → No → Abbe flap, not Estlander. (3) Could the Karapandzic work? → Yes, but for a 40% defect the Abbe provides adequate tissue transfer with less microstomia risk. The Abbe flap will be pedicled on the contralateral superior labial artery, with width = half the defect (~20% of total lip width), rotated 180°, and maintained for ~21 days before pedicle division. Bernard-Burow-Webster flaps are reserved for >2/3 defects.',
    concepts: ['case-lower-lip-scc', 'abbe-flap', 'commissure-decision', 'reconstructive-algorithm'],
},

{
    id: 'q47', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Six months after Abbe flap reconstruction, the patient reports difficulty whistling and diminished sensation of the reconstructed segment. What is the expected trajectory?',
    options: [
        { id: 'a', text: 'This represents permanent deficit — the patient should be counseled that the flap will remain denervated' },
        { id: 'b', text: 'Motor and sensory function typically return over approximately one year via recipient-bed reinnervation; 6 months is within the expected recovery window' },
        { id: 'c', text: 'Immediate nerve transfer is indicated to prevent irreversible atrophy' },
        { id: 'd', text: 'Physical therapy should have been started immediately; the deficit at 6 months indicates a missed window' },
    ],
    correct: 'b',
    brief: 'Both motor and sensory function after Abbe flap reconstruction typically return without special retraining over approximately one year. At 6 months, the patient is within the expected recovery window.',
    detailed: 'Abbe flap tissue is initially denervated because the motor and sensory nerve fibers are transected during harvest. Reinnervation occurs from the intact nerve fibers in the surrounding recipient bed, which sprout into the transferred muscle and skin over 6–12 months. No specific neuromuscular retraining protocol is required (unlike free muscle transfer for facial reanimation, which may benefit from targeted PT). Whistling requires fine, coordinated orbicularis contraction — it is often one of the last functions to recover. If function has not returned by 12–18 months, evaluation for incomplete reinnervation may be warranted, but intervention at 6 months is premature.',
    concepts: ['case-lower-lip-scc', 'abbe-flap', 'sphincter-repair'],
},

{
    id: 'q48', type: 'mcq', section: 'Cases',
    stem: 'A 72-year-old woman undergoes excision of a recurrent lower lip basal cell carcinoma that extends to involve the right oral commissure. The resulting full-thickness defect spans approximately 45% of the lower lip width. What flap is most appropriate?',
    options: [
        { id: 'a', text: 'Abbe cross-lip flap' },
        { id: 'b', text: 'Estlander flap' },
        { id: 'c', text: 'Primary wedge closure' },
        { id: 'd', text: 'Karapandzic flap' },
    ],
    correct: 'b',
    brief: 'With the commissure involved, the Estlander flap is indicated. Despite the 45% defect being within Abbe territory by size, the commissure involvement overrides — the Abbe is reserved for commissure-sparing defects.',
    detailed: 'The algorithm: (1) Defect size = 45% → middle tier (1/3–2/3). (2) Commissure involved? → Yes → Estlander, not Abbe. The Karapandzic flap could also be considered for this defect size, but the Karapandzic does not specifically reconstruct the commissure — it preserves the neurovascular pedicle near the commissure, which requires the commissure to be present. When the commissure itself is part of the defect, the Estlander flap creates a neo-commissure at its pivot point. Note the epidemiologic nuance: BCC on the lower lip is the minority pattern (SCC predominates), though BCC remains the second most common lower lip malignancy.',
    concepts: ['case-commissure-defect', 'estlander-flap', 'commissure-decision'],
},

{
    id: 'q49', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Three months after the Estlander flap, the right oral commissure appears rounded and blunted. What is the appropriate next step?',
    options: [
        { id: 'a', text: 'Revision Estlander flap' },
        { id: 'b', text: 'Observation only — the commissure will sharpen over time' },
        { id: 'c', text: 'Secondary commissuroplasty (Dieffenbach or Converse technique)' },
        { id: 'd', text: 'Contralateral commissuroplasty to symmetrize both sides' },
    ],
    correct: 'c',
    brief: 'A rounded commissure after an Estlander flap is the expected aesthetic complication, not a surgical error. Secondary commissuroplasty at 3–6 months restores the natural commissure angle.',
    detailed: 'The blunted neo-commissure is inherent to the Estlander flap design: the pivot point creates a smooth curve rather than the sharp angle of a natural commissure. Commissuroplasty (Dieffenbach excises the rounded corner and re-creates the angle; Converse uses a mucosal advancement) is the standard secondary procedure. Timing at 3–6 months allows complete wound healing and tissue softening before revision. This complication is shared by the Karapandzic and Gillies flaps, which also blunt the commissures through different mechanisms. It is not an indication for a revision flap — the tissue transfer was successful.',
    concepts: ['case-commissure-defect', 'estlander-flap'],
},

{
    id: 'q50', type: 'mcq', section: 'Cases',
    stem: 'A 75-year-old man requires near-total lower lip resection for an advanced SCC, resulting in loss of approximately 80% of the lip width. He has no history of prior radiation. Adequate cheek tissue is available. What is the primary reconstructive option?',
    options: [
        { id: 'a', text: 'Bilateral Abbe flaps' },
        { id: 'b', text: 'Bilateral Karapandzic flaps' },
        { id: 'c', text: 'Bernard-Burow-Webster cheek advancement flaps (± buccal mucosal flap for neovermilion)' },
        { id: 'd', text: 'Radial forearm free flap with palmaris longus tendon sling' },
    ],
    correct: 'c',
    brief: 'With adequate cheek tissue and an 80% defect, Bernard-Burow-Webster bilateral cheek advancement is the primary regional option. A buccal mucosal flap is needed to recreate the absent vermilion.',
    detailed: 'The algorithm for >2/3 defects branches on tissue availability: if adequate adjacent cheek tissue exists, Bernard-Burow-Webster flaps provide regional reconstruction. If tissue is inadequate (prior radiation, extensive scarring), free tissue transfer is required. In this case, available cheek tissue allows regional reconstruction without microsurgery. Burow\'s triangles at the perialar and labiomental creases facilitate medial cheek advancement. The vermilion must be separately reconstructed because cheek tissue has no vermilion component — a buccal mucosal advancement flap or tongue flap provides the wet mucosal surface. Bilateral Karapandzic flaps for an 80% defect would produce severe microstomia.',
    concepts: ['case-near-total', 'bernard-burow', 'reconstructive-algorithm'],
},

{
    id: 'q51', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) The surgeon successfully advances bilateral cheek flaps. Six months later, the patient has significant difficulty with oral competence — food falls from the lip, and liquids drool. What is the mechanistic reason for this dysfunction?',
    options: [
        { id: 'a', text: 'Surgical denervation of the mental nerve during the advancement' },
        { id: 'b', text: 'The advanced cheek tissue lacks orbicularis oris muscle, so there is no dynamic sphincteric contraction' },
        { id: 'c', text: 'Excessive scar contracture has produced microstomia' },
        { id: 'd', text: 'The buccal mucosal flap has contracted, pulling the lip inward' },
    ],
    correct: 'b',
    brief: 'The advanced cheek tissue lacks orbicularis oris muscle. Without a dynamic sphincter, the reconstructed lip cannot generate the active contraction needed to seal the oral aperture during eating and drinking.',
    detailed: 'This is the fundamental limitation of Bernard-Burow-Webster and similar cheek advancement techniques: they provide tissue bulk and mucosal lining but not the specialized circumferential sphincter of the orbicularis oris. Contrast this with the Karapandzic flap (which preserves the muscle with its innervation) and the Abbe flap (which transfers muscle that can reinnervate). For this patient, a static sling (palmaris longus or fascia lata graft sutured between the modioli) could partially compensate by providing passive support. Dynamic function could potentially be augmented by transferring an innervated muscle slip (depressor anguli oris or masseter transfer). These are the same principles used in free flap lip reconstruction with a palmaris longus sling.',
    concepts: ['case-near-total', 'bernard-burow', 'sphincter-repair', 'free-flap-lip'],
},

{
    id: 'q52', type: 'mcq', section: 'Cases',
    stem: '(Alternative scenario.) If the same patient had a history of prior radiation to the lower face, rendering local tissue inadequate, what free flap and adjunct would provide the best reconstruction?',
    options: [
        { id: 'a', text: 'Latissimus dorsi free flap with no adjunct' },
        { id: 'b', text: 'Anterolateral thigh (ALT) free flap with gracilis muscle transfer' },
        { id: 'c', text: 'Radial forearm free flap (RFFF) with palmaris longus tendon sling anchored to the bilateral oral modioli' },
        { id: 'd', text: 'Fibula free flap with osseous mandibular reconstruction' },
    ],
    correct: 'c',
    brief: 'The radial forearm free flap provides thin, pliable fasciocutaneous tissue matching lip thickness. The palmaris longus tendon, harvested in continuity, creates a static sling anchored to the bilateral modioli for oral continence.',
    detailed: 'The RFFF is the classic choice for lip free tissue transfer because its thin, pliable tissue closely matches native lip thickness — unlike the ALT or latissimus, which tend to be thicker and may produce a bulky reconstructed lip. The palmaris longus tendon (absent in ~14% of individuals; plantaris tendon is an alternative) is sutured under tension between the oral modioli, suspending the flap against gravity and preventing drooling at rest. The ALT with tensor fascia lata is a viable alternative offering more tissue volume, useful when the defect extends to the chin and mandible. In the irradiated field, microsurgical recipient vessels may be scarred — the facial artery and superior thyroid artery are the usual recipients, ideally accessed outside the radiation zone.',
    concepts: ['case-near-total', 'free-flap-lip', 'reconstructive-algorithm'],
},

];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
