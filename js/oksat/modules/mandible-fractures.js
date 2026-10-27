/* =================================================================
   Mandible Fractures
   OKSAT · Facial Plastics & Recon Module
   ================================================================= */
/* Sources: the owner's own resident-review decks (slide order and
   content): "Mandible Trauma" (resident review, 8/29/2016),
   "Mandible Trauma" (2018 deck), "Mandible and Midface Trauma"
   (08-2022), and "ZMC and Mandible Trauma" (09-2018). The 2022 and
   2018 decks reproduce the AO Foundation Surgery Reference (CMF)
   scheme; the owner will add AO CMF content later.
   Literature cited in the 2016 deck and used here as keyed:
   Halmos, Ellis, Dodson 2004 (third molars and angle fractures,
   PMID 15346357); Biller et al. 2005 (time to repair and
   complications, PMID 15867637); Bruce and Ellis 1993 (edentulous
   mandible, PMID 8336228); Luhr et al. 1996 (atrophic mandible,
   PMID 8600229); Valentino, Levy, Marentette 1994 (intraoral
   monocortical miniplating, PMID 8198783); Stacey et al. 2006
   (PMID 16525255).
   No figures: the decks' images are unlabeled screenshots or carry
   patient imaging; none is used.
   Discrepancy policy: the highest-ranked source (2022 deck) is
   keyed; disagreements and deck-only or added claims are named in
   the explanation under Discrepancy: or Caveat:. "Added" = standard
   teaching not stated in the decks; the owner should verify. */

const meta = {
    title: 'Mandible\nFractures',
    subtitle:
        'Anatomy and biomechanics, favorable versus unfavorable patterns, examination and condylar classification, closed versus open treatment, load-bearing and load-sharing fixation, site-specific decisions, the edentulous and pediatric mandible, complications, and three integrating cases.',
    kicker: 'Self-Assessment · Facial Plastics & Recon Module',
    id: 'mandible-fractures',
    sources: [
        'Resident review decks (owner): Mandible Trauma 2016; Mandible Trauma 2018; Mandible and Midface Trauma 08-2022; ZMC and Mandible Trauma 09-2018',
        'Halmos DR, Ellis E 3rd, Dodson TB. Mandibular third molars and angle fractures. J Oral Maxillofac Surg 2004 (PMID 15346357), as cited in the 2016 deck',
        'Biller JA et al. Complications and the time to repair of mandible fractures. Laryngoscope 2005 (PMID 15867637), as cited in the 2016 deck',
        'Bruce RA, Ellis E 3rd. The second Chalmers J. Lyons Academy study of fractures of the edentulous mandible. J Oral Maxillofac Surg 1993 (PMID 8336228); Luhr HG et al. J Oral Maxillofac Surg 1996 (PMID 8600229), as cited in the 2016 deck',
        'Valentino J, Levy FE, Marentette LJ. Intraoral monocortical miniplating of mandible fractures. Arch Otolaryngol Head Neck Surg 1994 (PMID 8198783), as cited in the 2016 deck',
        'Items marked "added" in the explanation (occlusion definitions, muscle pull on the distal segment) are standard teaching not stated in the decks; unvetted',
    ],
};

const DOMAINS = {
    anatomy:     { label: 'Anatomy & Biomechanics',    color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    evaluation:  { label: 'Evaluation & Classification', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    principles:  { label: 'Treatment Principles',      color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    sites:       { label: 'Site-Specific Management', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    special:     { label: 'Special Populations & Complications', color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    cases:       { label: 'Cases',                     color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // anatomy & biomechanics
    'mandible-anatomy':     { label: 'Mandibular Regions & Landmarks', domain: 'anatomy' },
    'weak-points':          { label: 'Sites of Predilection',          domain: 'anatomy' },
    'dentition':            { label: 'Dentition & Eruption',           domain: 'anatomy' },
    'occlusion':            { label: 'Occlusion & Angle Classes',      domain: 'anatomy' },
    'biomechanics':         { label: 'Tension & Compression Zones',    domain: 'anatomy' },
    'favorable-unfavorable':{ label: 'Favorable vs Unfavorable',       domain: 'anatomy' },
    'third-molar':          { label: 'Third Molars & Angle Fractures', domain: 'anatomy' },

    // evaluation & classification
    'history-exam':         { label: 'History & Examination',          domain: 'evaluation' },
    'condylar-signs':       { label: 'Condylar Fracture Signs',        domain: 'evaluation' },
    'fracture-terms':       { label: 'Fracture Descriptors',           domain: 'evaluation' },
    'epidemiology':         { label: 'Distribution by Site',           domain: 'evaluation' },
    'nerve-injury':         { label: 'Inferior Alveolar Nerve Injury', domain: 'evaluation' },
    'condylar-class':       { label: 'Condylar Displacement Classes',  domain: 'evaluation' },

    // treatment principles
    'general-management':   { label: 'General Management & Timing',    domain: 'principles' },
    'closed-reduction':     { label: 'Closed Reduction & IMF',         domain: 'principles' },
    'mmf-devices':          { label: 'MMF Devices',                    domain: 'principles' },
    'fixation-types':       { label: 'Rigid, Semi-Rigid, Non-Rigid',   domain: 'principles' },
    'load-bearing':         { label: 'Load-Bearing vs Load-Sharing',   domain: 'principles' },
    'champy':               { label: 'Champy Miniplates',              domain: 'principles' },
    'lag-screw':            { label: 'Lag Screws',                     domain: 'principles' },
    'teeth-in-line':        { label: 'Teeth in the Fracture Line',     domain: 'principles' },
    'approaches':           { label: 'Transoral vs Extraoral',         domain: 'principles' },
    'bone-healing':         { label: 'Primary vs Secondary Healing',   domain: 'principles' },

    // site-specific
    'symphysis-body-angle': { label: 'Symphysis, Body, Angle',         domain: 'sites' },
    'condylar-management':  { label: 'Condylar Fracture Management',   domain: 'sites' },
    'comminuted':           { label: 'Comminuted Fractures',           domain: 'sites' },
    'external-fixator':     { label: 'External Pin Fixation',          domain: 'sites' },

    // special populations & complications
    'edentulous':           { label: 'Edentulous Mandible',            domain: 'special' },
    'pediatric':            { label: 'Pediatric Mandible',             domain: 'special' },
    'complications':        { label: 'Complications',                  domain: 'special' },

    // cases
    'case-angle':           { label: 'Case: Angle with Impacted M3',   domain: 'cases' },
    'case-edentulous':      { label: 'Case: Atrophic Mandible',        domain: 'cases' },
    'case-child':           { label: 'Case: Pediatric Condyle',        domain: 'cases' },
};

const ITEMS = [

// ════════════════ ANATOMY & BIOMECHANICS ════════════════

{
    id: 'q1', type: 'recall', section: 'Anatomy & Biomechanics',
    stem: 'Name the anatomic components of the mandible used to describe fracture location.',
    answer: `• Symphysis
• Parasymphysis
• Body
• Angle
• Ramus
• Coronoid process
• Condyle
• Alveolus`,
    brief: 'Eight regions; fracture reports name the region, so know where each begins and ends.',
    detailed: 'The symphysis is the midline; the parasymphysis extends laterally to the canine; the body runs from there to the angle, which bounds the ramus. The condylar process and coronoid process are the two superior projections of the ramus, and the alveolus is the tooth-bearing, dense cortical ridge. Pearl: describing the region correctly drives everything downstream (muscle pull, favorable versus unfavorable, approach, plate choice).',
    concepts: ['mandible-anatomy'],
},
{
    id: 'q2', type: 'mcq', section: 'Anatomy & Biomechanics',
    stem: 'The mental foramen, where the mental nerve exits, lies in line with which tooth, and what landmark separates the parasymphysis from the body?',
    options: [
        { id: 'a', text: 'Second premolar; the canine (the body begins distal to it)'  },
        { id: 'b', text: 'Canine; the mental foramen'  },
        { id: 'c', text: 'Central incisor; the first premolar'  },
        { id: 'd', text: 'First molar; the second molar'  },
    ],
    correct: 'a',
    brief: 'Mental foramen at the second premolar; the body begins distal to the canine.',
    detailed: 'Both landmarks are from the 2016 deck. The foramen sits at the level of the second premolar, so a parasymphyseal fracture near the canine puts the mental nerve at risk as the plate or screw passes toward it. Pearl: bicortical screws below the apices and a plate placed along the lower border keep clear of the nerve; know where it exits before you drill.',
    concepts: ['mandible-anatomy'],
},
{
    id: 'q3', type: 'recall', section: 'Anatomy & Biomechanics',
    stem: 'Name the three anatomic locations with an increased propensity for mandible fracture, and the two patient groups with fractures at multiple or unusual sites.',
    answer: `Sites:
• Third molar area (especially an impacted third molar)
• Mental foramen region
• Condylar neck

Patient groups:
• Edentulous, atrophic mandibles — fracture at multiple locations
• Children in the deciduous phase of dentition`,
    brief: 'Weak points are where bone is thinned by a tooth or foramen, or a long narrow neck; the atrophic mandible is weak everywhere.',
    detailed: 'The impacted M3 displaces bone at the angle; the mental foramen and the tooth socket of the canine make the parasymphysis a thin region; the condylar neck is a narrow stalk. In children, tooth buds fill the body so the cortex is thin. Pearl: with a fracture at one weak point, look for a second at the contralateral one (classically parasymphysis plus contralateral angle or condyle) because the mandible is a ring.',
    concepts: ['weak-points'],
},
{
    id: 'q4', type: 'mcq', section: 'Anatomy & Biomechanics',
    stem: 'A patient bites down on the mandible, which acts as a cantilevered beam suspended at the two TMJs. In the body and angle, which zones of stress result?',
    options: [
        { id: 'a', text: 'Pure torsion with no tension or compression'  },
        { id: 'b', text: 'Compression along the superior border, tension along the inferior border'  },
        { id: 'c', text: 'Tension along the superior border, compression along the inferior border'  },
        { id: 'd', text: 'Tension on both borders, compression centrally'  },
    ],
    correct: 'c',
    brief: 'Occlusal load puts the superior border of the body and angle in tension and the inferior border in compression.',
    detailed: 'The tooth-bearing superior border distracts under occlusal load; the inferior border is compressed. This is why a plate placed at the superior border (a tension band, Champy) neutralizes the distracting force while the lower border is compressed. The symphysis behaves differently: compression at the upper border, and tension plus torsion along the lower border, which is why a single superior plate is not enough there. Pearl: the 2022 deck states this for body and angle only; do not extrapolate it to the symphysis.',
    concepts: ['biomechanics'],
},
{
    id: 'q5', type: 'mcq', section: 'Anatomy & Biomechanics',
    stem: 'In a symphyseal fracture, the pattern of stress differs from the body. Which statement matches the decks?',
    options: [
        { id: 'a', text: 'Tension at the upper border with compression at the lower border, as in the body'  },
        { id: 'b', text: 'Compression at the upper border; tension and torsion along the lower border'  },
        { id: 'c', text: 'No stress, because the muscles of mastication do not attach here'  },
        { id: 'd', text: 'Pure shear along the midline'  },
    ],
    correct: 'b',
    brief: 'Symphysis: compression above, tension and torsion below.',
    detailed: 'The symphyseal region is described as "more complicated": compression at the upper border and tension plus torsional forces along the lower border. Practically, the lower border needs fixation (and often two points) while the upper border needs less. Pearl: this inverts the body/angle pattern, so plate position is not interchangeable between regions.',
    concepts: ['biomechanics', 'symphysis-body-angle'],
},
{
    id: 'q6', type: 'mcq', section: 'Anatomy & Biomechanics',
    stem: 'A mandibular angle fracture line runs from posterior-superior to anterior-inferior so that the pull of the masseter, medial pterygoid, and temporalis displaces the proximal segment superiorly and medially, separating the fracture. How is this fracture classed?',
    options: [
        { id: 'a', text: 'Vertically favorable'  },
        { id: 'b', text: 'Greenstick'  },
        { id: 'c', text: 'Horizontally favorable'  },
        { id: 'd', text: 'Horizontally unfavorable'  },
    ],
    correct: 'd',
    brief: 'Unfavorable = muscles displace the fragments; most angle fractures are horizontally unfavorable.',
    detailed: 'A fracture is favorable when muscle pull seats the fragments against each other (it tends to reduce the fracture) and unfavorable when muscle pull displaces them. The majority of angle fractures are horizontally unfavorable: the masseter, medial pterygoid, and temporalis pull the proximal segment up and in, and (added) the suprahyoid group pulls the distal segment down and back. Pearl: horizontally unfavorable angle fractures are the usual reason a single IMF does not hold the reduction and why they are the fractures most often fixed.',
    concepts: ['favorable-unfavorable'],
},
{
    id: 'q7', type: 'mcq', section: 'Anatomy & Biomechanics',
    stem: 'Which child-tooth statement is correct? A 5-year-old has a mandible fracture; the surgeon needs to know the dentition before planning MMF.',
    options: [
        { id: 'a', text: 'Twenty primary teeth including eight premolars'  },
        { id: 'b', text: 'Twenty-eight primary teeth: only the third molars are missing'  },
        { id: 'c', text: 'Thirty-two permanent teeth are erupted by age 5'  },
        { id: 'd', text: 'Twenty primary teeth: eight premolars are absent compared with adult dentition and the third molars have not formed'  },
    ],
    correct: 'd',
    brief: 'Primary dentition = 20 teeth (adult 32 minus 8 premolars and 4 third molars).',
    detailed: 'The deck arithmetic: 32 permanent teeth, minus the premolars (8) and third molars (4) = 20 primary teeth. Central incisors erupt first (about 6 months); permanent teeth begin at about 6 to 7 years; third molars are the last to erupt; deciduous teeth are lost by about 11. Pearl: short, conical deciduous crowns and unerupted tooth buds make arch bars and wiring unreliable in children, which is part of why closed techniques and screws are more problematic there.',
    concepts: ['dentition', 'pediatric'],
},
{
    id: 'q8', type: 'recall', section: 'Anatomy & Biomechanics',
    stem: 'Define overjet, overbite, and crossbite, and state the Angle class I relationship.',
    answer: `• Overjet — horizontal (AP) distance by which the maxillary incisors project past the mandibular incisors
• Overbite — vertical overlap of the maxillary over the mandibular incisors
• Crossbite — a mandibular tooth lies buccal to its maxillary counterpart
• Angle class I — mesiobuccal cusp of the maxillary first molar sits in the buccal groove of the mandibular first molar`,
    brief: 'Premorbid occlusion defines the target: restore the patient’s own bite, not a textbook one.',
    detailed: 'Added from standard teaching; the decks show these as images and pose the questions without printed answers. The maxillary dentoalveolar arch is the larger of the two, so the maxillary teeth normally overlap the mandibular ones. Class II is a retruded mandible relative to the maxilla (distal), class III a protruded one (mesial). Pearl: ask about premorbid occlusion first; a patient with an old class III bite is not mal-occluded for being class III.',
    concepts: ['occlusion'],
},
{
    id: 'q9', type: 'mcq', section: 'Anatomy & Biomechanics',
    stem: 'Per Halmos, Ellis, and Dodson, how does the presence and position of a mandibular third molar change the risk of angle fracture?',
    options: [
        { id: 'a', text: 'About 2.8-fold increased risk; highest for deep impaction'  },
        { id: 'b', text: 'About 2.8-fold increased risk; highest for superficial impaction, lower for deep impaction'  },
        { id: 'c', text: 'No change in risk; angle fractures reflect only force vector'  },
        { id: 'd', text: 'Reduced risk, because the tooth adds bone mass'  },
    ],
    correct: 'b',
    brief: 'M3 present: about 2.8-fold angle fracture risk, driven by superficial impaction.',
    detailed: 'The theory is that the tooth reduces bone mass at the angle. Superficial positions (IA, IB, IIA) increase risk, probably by disrupting the cortical integrity of the external oblique ridge; deep positions (IIC, IIIC) decrease it. Pearl: because M3 removal is itself part of angle fracture management, this item connects to the "teeth in the line of fracture" question below.',
    concepts: ['third-molar'],
},

// ════════════════ EVALUATION & CLASSIFICATION ════════════════

{
    id: 'q10', type: 'recall', section: 'Evaluation & Classification',
    stem: 'List the history and exam findings the decks associate with a mandible fracture. What is the first thing to ask?',
    answer: `First: premorbid occlusion

Findings:
• Malocclusion
• Fragment mobility
• Trismus
• Deviation on opening toward the side of a fractured condyle
• Floor-of-mouth hematoma
• Laceration of attached gingiva over the fracture
• Lip or chin paresthesia (mental or inferior alveolar nerve)`,
    brief: 'Premorbid occlusion first; gingival laceration and floor-of-mouth hematoma make the fracture open.',
    detailed: 'The deck also lists an anterior open bite contralateral to a fractured condyle. See the Discrepancy in the next question. Pearl: floor-of-mouth hematoma is the specific sign of a fracture reaching the lingual cortex; do not attribute it to a soft-tissue bruise.',
    concepts: ['history-exam'],
},
{
    id: 'q11', type: 'mcq', section: 'Evaluation & Classification',
    stem: 'A patient has a left subcondylar fracture. On opening, the mandible deviates to which side, and why?',
    options: [
        { id: 'a', text: 'To the left, because the fractured side loses ramus height and lateral pterygoid translation'  },
        { id: 'b', text: 'It does not deviate; deviation indicates a coronoid fracture'  },
        { id: 'c', text: 'To the right, because the left masseter is spastic'  },
        { id: 'd', text: 'To the right, because the right lateral pterygoid is unopposed'  },
    ],
    correct: 'a',
    brief: 'The jaw deviates toward the fractured condyle on opening.',
    detailed: 'The injured side shortens and cannot translate forward, so the intact side translates and the chin swings toward the fracture. Discrepancy: the 2016 and 2022 decks list "anterior open bite contralateral to the fractured condyle." Added teaching: unilateral condylar fracture with ramus shortening gives ipsilateral premature molar contact and a contralateral open bite that is posterior or lateral; an anterior open bite is the classic finding of bilateral condylar fractures. Pearl: a patient who cannot bring the molars together on one side is a ramus-height problem until proven otherwise.',
    concepts: ['condylar-signs'],
},
{
    id: 'q12', type: 'mcq', section: 'Evaluation & Classification',
    stem: 'A fracture of the tooth-bearing mandible communicates with the oral cavity through a gingival laceration. Which description and consequence follow?',
    options: [
        { id: 'a', text: 'Open fracture; antibiotics only if repair is delayed beyond 3 days'  },
        { id: 'b', text: 'Closed fracture; no antibiotics needed'  },
        { id: 'c', text: 'Open fracture; prophylactic antibiotics for 24 to 48 hours and chlorhexidine rinse'  },
        { id: 'd', text: 'Greenstick fracture; antibiotics for 6 weeks'  },
    ],
    correct: 'c',
    brief: 'Tooth-bearing fractures with oral communication are open; antibiotics 24 to 48 hours plus Peridex.',
    detailed: 'Open means open to the external environment (mucosal or skin laceration). Fractures through the tooth-bearing segment that communicate with the mouth qualify. The 2022 deck specifies antibiotic prophylaxis for 24 to 48 hours with chlorhexidine (Peridex). Pearl: "open" does not mean "operate now"; short delay does not markedly raise complication rates (see timing item).',
    concepts: ['fracture-terms', 'general-management'],
},
{
    id: 'q13', type: 'recall', section: 'Evaluation & Classification',
    stem: 'Define the descriptors used for a mandible fracture: open, comminuted, greenstick, displaced, favorable, and the other features the 2016 deck adds.',
    answer: `• Open — mucosal or skin laceration, open to the external environment
• Comminuted — more than two fragments in one anatomic region
• Greenstick — through one cortex only
• Displaced / nondisplaced (with severity)
• Favorable / unfavorable — by muscle pull
• Involving a tooth root
• Location`,
    brief: 'Describe every fracture by open or closed, displacement, comminution, favorability, tooth involvement, and site.',
    detailed: 'A greenstick fracture is seen in children, whose bone is flexible. Involvement of a tooth root changes management (teeth in the line of fracture). Pearl: a complete, standard descriptor set is what you dictate and what the operative plan is built from.',
    concepts: ['fracture-terms'],
},
{
    id: 'q14', type: 'mcq', section: 'Evaluation & Classification',
    stem: 'Ranking the sites of mandible fracture by frequency in the 2016 deck (most to least common of the first three) gives which order?',
    options: [
        { id: 'a', text: 'Subcondylar/condyle, body, angle'  },
        { id: 'b', text: 'Angle, body, subcondylar/condyle'  },
        { id: 'c', text: 'Body, angle, subcondylar/condyle'  },
        { id: 'd', text: 'Symphysis, ramus, coronoid'  },
    ],
    correct: 'a',
    brief: 'Deck order: condyle, body, angle.',
    detailed: 'Caveat: the distribution varies by series, referral pattern, and mechanism (assault versus motor vehicle collision); many series place angle and body first or second, and the mandible is a ring so a second fracture is the rule. Pearl: never stop at the first fracture on CT; look for the contralateral one.',
    concepts: ['epidemiology'],
},
{
    id: 'q15', type: 'mcq', section: 'Evaluation & Classification',
    stem: 'Inferior alveolar nerve injury after mandible fracture: which factor is the strongest determinant of pretreatment numbness in the deck data, and which three factors raise the risk of persistent deficit after repair?',
    options: [
        { id: 'a', text: 'Open fractures; antibiotics, delay over 3 days, smoking'  },
        { id: 'b', text: 'Comminution; locking plates, edentulism, age over 70'  },
        { id: 'c', text: 'Posterior (IAN-bearing) fractures (56.2% versus 12.6% anterior); two-plate fixation, operator under 3 years’ experience, displacement over 5 mm'  },
        { id: 'd', text: 'Anterior fractures; one-plate fixation, operator over 10 years, displacement under 2 mm'  },
    ],
    correct: 'c',
    brief: 'IAN-bearing posterior fractures carry about 4 times the nerve injury of anterior ones.',
    detailed: 'Deck figures: 56.2% in IAN-bearing posterior fractures versus 12.6% anterior. Persistent deficit risk was significantly higher with two-plate fixation, operator experience under 3 years, and displacement over 5 mm. Caveat: the quoted ranges are very wide (post-treatment IAN injury 0.4 to 91.3%, permanent 0.9 to 66.7%, pre-treatment deficit 5.7 to 58.5%), which reflects heterogeneous series and definitions; treat the point values as order-of-magnitude. Pearl: document pre-operative sensation before you fix anything, because a deficit present on arrival is the injury, not your plate.',
    concepts: ['nerve-injury'],
},
{
    id: 'q16', type: 'mcq', section: 'Evaluation & Classification',
    stem: 'A condylar fracture shows 30 degrees of angulation and 8 mm of ramus height loss. According to the displacement scheme in the 2016 deck, what class and treatment does it carry?',
    options: [
        { id: 'a', text: 'Class 2, observation only'  },
        { id: 'b', text: 'Class 2, ORIF'  },
        { id: 'c', text: 'Class 1, closed reduction'  },
        { id: 'd', text: 'Class 3, ORIF'  },
    ],
    correct: 'b',
    brief: 'Class 2: 10 to 45 degrees or 2 to 15 mm shortening; ORIF in this scheme.',
    detailed: 'Class 1: under 10 degrees or under 2 mm, closed. Class 2: 10 to 45 degrees or 2 to 15 mm shortening, ORIF. Class 3: over 45 degrees or over 15 mm, ORIF. Caveat: this scheme is more interventionist than the 2022 deck, which calls closed treatment standard for non-dislocated or minimally displaced fractures in compliant patients and makes open treatment a judgment across ten factors. Use the numbers to describe displacement; use the decision factors to decide.',
    concepts: ['condylar-class'],
},

// ════════════════ TREATMENT PRINCIPLES ════════════════

{
    id: 'q17', type: 'mcq', section: 'Treatment Principles',
    stem: 'A patient with an isolated, open angle fracture is hemodynamically stable but on hospital day 4 is still awaiting the OR. Per the 2016 deck (Biller et al.), what does delay do to complications?',
    options: [
        { id: 'a', text: 'Treatment after 3 days markedly increases infection, so the case must be added on'  },
        { id: 'b', text: 'Delay has no effect on any complication'  },
        { id: 'c', text: 'Delay beyond 24 hours converts every fracture to nonunion'  },
        { id: 'd', text: 'Treatment after 3 days does not increase infection; technical complications may rise with delay'  },
    ],
    correct: 'd',
    brief: 'Delay beyond 3 days did not raise infection, but technical complications rose with delay; substance abuse raised infection.',
    detailed: 'Infectious complications (abscess, nonunion, fistula needing surgery and antibiotics) were not higher after 3 days; substance abuse did raise them. Technical complications (weak margin, revision for malocclusion, exposed hardware, persistent pain) increased with delay. Some advocate ORIF within 12 to 24 hours. Overall ORIF infection rates are 5 to 32%. Pearl: antibiotics and chlorhexidine buy time, but fix it promptly when you can because the fracture gets harder to reduce.',
    concepts: ['general-management'],
},
{
    id: 'q18', type: 'recall', section: 'Treatment Principles',
    stem: 'State when a mandible fracture can be observed rather than fixed, and the standard indication for closed reduction with IMF.',
    answer: `Observation (soft diet) when all are true:
• Nonmobile, nondisplaced, or incomplete fracture
• Stable occlusion
• No mobility at the fracture site

Closed reduction with IMF:
• Many favorable fractures
• IMF screws or arch bars; 4 to 6 weeks for symphysis, angle, and body
• Avoid or shorten for condyles (ankylosis, reduced opening)`,
    brief: 'Observe only if stable and nonmobile; many favorable fractures do well with 4 to 6 weeks of IMF.',
    detailed: 'Prolonged IMF (4 to 6 weeks) has been associated with poor range of motion, TMJ ankylosis, muscle atrophy, and loss of interincisal opening, which is why condylar fractures get shorter IMF or none. Closed techniques are used where open reduction is unnecessary or contraindicated, including in children. Pearl: the patient must be told that observation can convert to treatment.',
    concepts: ['closed-reduction', 'general-management'],
},
{
    id: 'q19', type: 'mcq', section: 'Treatment Principles',
    stem: 'Which list correctly sorts fixation by rigidity?',
    options: [
        { id: 'a', text: 'Rigid: interosseous wires; semi-rigid: lag screws; non-rigid: reconstruction plates'  },
        { id: 'b', text: 'Rigid: IMF screws; semi-rigid: arch bars; non-rigid: elastics'  },
        { id: 'c', text: 'Rigid: miniplates and wires; semi-rigid: reconstruction plates; non-rigid: lag screws'  },
        { id: 'd', text: 'Rigid: reconstruction plates and lag screws; semi-rigid: miniplates; non-rigid: interosseous wires'  },
    ],
    correct: 'd',
    brief: 'Rigid = reconstruction plates, lag screws; semi-rigid = miniplates; non-rigid = interosseous wires.',
    detailed: 'Most rigid and semi-rigid techniques obviate postoperative IMF, a major advantage in patients who tolerate IMF poorly (epilepsy, diabetes, alcoholism, psychiatric disorders, severe disability). Occlusion can be guided with elastics when needed. The 2018 deck adds that internal fixation is not necessarily rigid in many situations. Pearl: pick the least fixation that still prevents movement across the fracture during function.',
    concepts: ['fixation-types'],
},
{
    id: 'q20', type: 'mcq', section: 'Treatment Principles',
    stem: 'Which fracture most requires load-bearing fixation rather than load-sharing?',
    options: [
        { id: 'a', text: 'A simple unfavorable angle fracture with good bone stock'  },
        { id: 'b', text: 'A comminuted fracture with a segmental defect'  },
        { id: 'c', text: 'A simple, favorable parasymphyseal fracture in a young dentate patient'  },
        { id: 'd', text: 'A nondisplaced greenstick fracture'  },
    ],
    correct: 'b',
    brief: 'Comminuted, atrophic, and segmental-defect fractures need load-bearing fixation.',
    detailed: 'Load-bearing hardware is rigid enough to resist all functional forces until union, because the fragments cannot share the load. Load-sharing fixation lets the plate and apposed cortices share the load once the fracture is reduced; the majority of mandible fractures are adequately treated this way. Pearl: load-bearing means a reconstruction plate spanning the defect on stable bone, not a miniplate.',
    concepts: ['load-bearing'],
},
{
    id: 'q21', type: 'mcq', section: 'Treatment Principles',
    stem: 'For a comminuted infected fracture, you choose a locking reconstruction plate with 2.4 or 2.7 mm screws. How many screws on each side of the fracture, and what does locking add?',
    options: [
        { id: 'a', text: 'At least three to four, in stable bone; locking retains stiffness even when contouring is imprecise'  },
        { id: 'b', text: 'One or two; locking improves compression across the fracture'  },
        { id: 'c', text: 'Six; locking removes the need for anatomic reduction'  },
        { id: 'd', text: 'Two; locking is required in all load-sharing constructs'  },
    ],
    correct: 'a',
    brief: 'At least 3 to 4 screws each side in stable bone; locking tolerates imprecise bending.',
    detailed: 'Locking plates keep their yield load, yield displacement, and stiffness despite imprecise contouring; nonlocking plates change significantly with as little as 1 mm of gap between plate and bone. The benefit is less apparent in load-sharing constructs, where nonlocking plates are often sufficient. Pearl: with a nonlocking plate, adapt it exactly or you will pull the fragments out of reduction as the screws seat.',
    concepts: ['load-bearing', 'fixation-types'],
},
{
    id: 'q22', type: 'mcq', section: 'Treatment Principles',
    stem: 'Champy’s "ideal lines of osteosynthesis" support which technique?',
    options: [
        { id: 'a', text: 'Interosseous wiring with 6 weeks of IMF'  },
        { id: 'b', text: 'External pin fixation'  },
        { id: 'c', text: 'Small noncompression miniplates placed transorally along the superior border with monocortical screws'  },
        { id: 'd', text: 'Large compression plates at the inferior border with bicortical screws'  },
    ],
    correct: 'c',
    brief: 'Champy: transoral monocortical miniplates along the superior border (above or just below the oblique ridge for angle fractures).',
    detailed: 'Michelet (1973) described small bendable noncompression miniplates placed transorally with monocortical screws, in contrast to the AO and Luhr emphasis on compression and absolute rigidity. Champy then defined ideal lines of osteosynthesis; for the angle the plate sits on the superior border. Monocortical screws avoid tooth roots and the nerve, and the construct allows immediate function. Caveat: Schierle et al. reported that two-plate fixation may not offer advantages over a single plate in general. Pearl: Champy works because the superior border is the tension side (see biomechanics).',
    concepts: ['champy', 'biomechanics'],
},
{
    id: 'q23', type: 'recall', section: 'Treatment Principles',
    stem: 'Describe lag screw fixation: how it works, the requirements, and the advantages.',
    answer: `• Screw head near the cortex, threads engage across the fracture: compression of the segments
• Two to three screws needed to overcome rotation
• Placed at least 7 mm apart, perpendicular to the fracture (deck: divergent angles)
• Small-diameter drill hole
• Faster than plating, rigid fixation, low cost, minimal equipment`,
    brief: 'Lag screws compress across the fracture; they need at least two screws, spaced, perpendicular to the fracture plane.',
    detailed: 'From the 2016 deck, which is deck-only for the 7 mm spacing and the divergent-angle wording. Added teaching: lag technique drills a glide hole in the near fragment and a thread hole in the far, so the threads grip only the far fragment and the head pulls the near fragment onto it. It works best on oblique fractures long enough to take screws. Pearl: a screw not perpendicular to the plane of fracture shears the fragments instead of compressing them.',
    concepts: ['lag-screw'],
},
{
    id: 'q24', type: 'mcq', section: 'Treatment Principles',
    stem: 'An adult has a tooth in the line of an angle fracture. Which tooth should be removed?',
    options: [
        { id: 'a', text: 'An impacted third molar, or a fractured, infected, or dislocated tooth'  },
        { id: 'b', text: 'No tooth is ever removed in a fracture line'  },
        { id: 'c', text: 'Any tooth in the line, to prevent infection'  },
        { id: 'd', text: 'A healthy tooth with healthy periodontium that helps stabilize the reduction'  },
    ],
    correct: 'a',
    brief: 'Remove impacted M3s and fractured, infected, or dislocated teeth; keep healthy teeth that stabilize the reduction.',
    detailed: 'Ellis studied 402 patients with angle fractures: teeth were removed in 75% of fractures containing teeth; complications were 19% (removed) versus 19.5% (retained), and infection 15.8% for fractures without teeth versus 19.1% with. No clinically significant difference overall. Retained teeth need dental follow-up. Pearl: the decision is about the tooth’s condition, not about the fracture line itself.',
    concepts: ['teeth-in-line'],
},
{
    id: 'q25', type: 'mcq', section: 'Treatment Principles',
    stem: 'Which statement about approaches to mandible fracture fixation is accurate?',
    options: [
        { id: 'a', text: 'The transoral route has markedly higher complication rates than extraoral'  },
        { id: 'b', text: 'Extraoral approaches are preferred for symphysis fractures'  },
        { id: 'c', text: 'Most fractures can be treated transorally, which gives direct occlusal visualization, avoids scarring, and limits facial nerve risk'  },
        { id: 'd', text: 'A trocar is used only for the symphysis'  },
    ],
    correct: 'c',
    brief: 'Transoral is adequate for most; extraoral gives visualization for severe comminution and the atrophic mandible.',
    detailed: 'Complication rates are similar between transoral and extraoral reduction. Posterior body, angle, ramus, and condylar fractures can be treated with combined intraoral and extraoral approaches using a transbuccal trocar to avoid an external scar. Extraoral (transcervical) exposure is reserved for extensive comminution or the severely atrophic mandible. Pearl: the marginal mandibular branch of the facial nerve is the structure to protect on a cervical approach.',
    concepts: ['approaches'],
},
{
    id: 'q26', type: 'recall', section: 'Treatment Principles',
    stem: 'State the fundamental principles of ORIF and the general order of steps for open reduction of a mandible fracture.',
    answer: `Principles:
• Accurate anatomic reduction
• Stable internal fixation
• Early mobilization
• Careful handling of tissue and neurovascular supply

Order:
• Establish occlusion
• Reduce segments, starting with the dentate segments
• Fixate
• Recheck occlusion with passive movement`,
    brief: 'Occlusion first, reduce dentate segments, fix, and recheck the bite.',
    detailed: 'Internal fixation is the application of enough hardware to prevent movement across the fracture during function. Pearl: if the occlusion is wrong after fixation, take it back down before you leave; malocclusion is the most common reason for revision (the technical complications of the timing item).',
    concepts: ['general-management', 'fixation-types'],
},
{
    id: 'q27', type: 'mcq', section: 'Treatment Principles',
    stem: 'Which group lists only tooth-borne MMF devices?',
    options: [
        { id: 'a', text: 'Ernst ligatures, IMF screws, Matrix Wave'  },
        { id: 'b', text: 'Ivy loops, Ernst ligatures, arch bars'  },
        { id: 'c', text: 'Arch bars, Gunning splints, Matrix Wave'  },
        { id: 'd', text: 'IMF screws, Gunning splints, dentures'  },
    ],
    correct: 'b',
    brief: 'Tooth-borne: Ivy loops, Ernst ligatures, Minne ties, arch bars (Schuchardt, Erich). Bone-borne: IMF screws, Matrix Wave.',
    detailed: 'Splints and dentures (Gunning splint) make a third group for edentulous patients. Pearl: bone-borne screws avoid glove puncture and gingival injury and are quick to place, but they can damage tooth roots; arch bars are more durable and are the choice for prolonged MMF.',
    concepts: ['mmf-devices'],
},
{
    id: 'q28', type: 'mcq', section: 'Treatment Principles',
    stem: 'A closed-reduced fracture heals by which pathway, and how does open rigid fixation heal?',
    options: [
        { id: 'a', text: 'Closed: intramembranous only; rigid: endochondral only'  },
        { id: 'b', text: 'Closed: primary healing with no callus; rigid: secondary healing with callus'  },
        { id: 'c', text: 'Both heal by secondary healing'  },
        { id: 'd', text: 'Closed: secondary healing (hematoma, granulation, callus, woven then lamellar bone); rigid: primary healing with Haversian remodeling across the fracture and no callus'  },
    ],
    correct: 'd',
    brief: 'Non-rigid = secondary (callus); rigid = primary (no callus, Haversian remodeling).',
    detailed: 'Secondary healing: subperiosteal hematoma, granulation tissue, a thin layer of bone by membranous ossification, hyaline cartilage replaced by woven bone, and remodeling into mature lamellar bone. Primary healing: no callus; Haversian remodeling across the fracture, with lamellar bone deposited into any gap. Pearl: a visible callus on follow-up imaging implies motion at the fracture.',
    concepts: ['bone-healing'],
},

// ════════════════ SITE-SPECIFIC MANAGEMENT ════════════════

{
    id: 'q29', type: 'mcq', section: 'Site-Specific Management',
    stem: 'A noncompliant patient has a simple, displaced parasymphyseal fracture. Which plan matches the 2022 deck?',
    options: [
        { id: 'a', text: 'Six weeks of IMF only'  },
        { id: 'b', text: 'Observation and soft diet'  },
        { id: 'c', text: 'Reconstruction plate with 12 weeks of IMF'  },
        { id: 'd', text: 'ORIF without extended MMF'  },
    ],
    correct: 'd',
    brief: 'Symphysis/parasymphysis: ORIF without extended MMF for unstable fractures and noncompliant patients; closed treatment is an accepted alternative for simple fractures.',
    detailed: 'For body fractures, ORIF is used for complete simple fractures to avoid extended MMF, and for all displaced fractures and noncompliant patients. For angle fractures, ORIF is done for unfavorable simple fractures to prevent post-reduction displacement; the 2018 deck notes that angle fracture treatment "remains controversial." Pearl: compliance and ability to tolerate jaw wiring are as decisive as fracture morphology.',
    concepts: ['symphysis-body-angle'],
},
{
    id: 'q30', type: 'mcq', section: 'Site-Specific Management',
    stem: 'Which patient with a condylar fracture can be observed or treated closed?',
    options: [
        { id: 'a', text: 'A patient with a foreign body in the joint'  },
        { id: 'b', text: 'A dentate, compliant patient with a minimally displaced fracture, stable occlusion, and acceptable pain'  },
        { id: 'c', text: 'A patient who cannot open the mouth because the fragment blocks movement'  },
        { id: 'd', text: 'An edentulous patient with a dislocated condyle'  },
    ],
    correct: 'b',
    brief: 'Closed treatment is the standard for non-dislocated or minimally displaced fractures in compliant patients with good dentition.',
    detailed: '"Closed reduction is a misnomer": the fracture is often not anatomically reduced; the patient adapts functionally to a repeatable occlusion. Advantages: minimally invasive and can be performed under local anesthesia in the office. Observation requires minimal displacement, a stable occlusion over time, acceptable pain, compliance, and counseling that more treatment may be needed. Pearl: the other three options are open indications.',
    concepts: ['condylar-management'],
},
{
    id: 'q31', type: 'recall', section: 'Site-Specific Management',
    stem: 'List the absolute and relative indications for open treatment of a condylar neck fracture from the 2016 deck.',
    answer: `Absolute:
• Displacement of the condylar head into the middle cranial fossa
• Inadequate occlusion after 1 week of closed reduction
• Inability to open the mouth (fracture blocks movement)
• Lateral extracapsular displacement
• Foreign body in the capsule
• Other fractures where rigid fixation and early mobilization would reduce fibrosis

Relative:
• Edentulous or partially dentulous, with atrophy (MMF hard)
• Medically or mentally compromised patient who cannot tolerate jaw fixation
• Condylar fracture with a comminuted symphysis or midface fracture
• ORIF for deviations of 45 or 90 degrees, telescoping, or dislocation from the glenoid fossa
• In children under 12, closed unless bilateral and dislocated`,
    brief: 'Absolute indications are mechanical (intracranial, blocked opening, foreign body, failed occlusion); relative ones reflect the patient or the other injuries.',
    detailed: 'The 2022 deck gives a ten-factor framework in place of a list: location, ramus height loss, angulation, degree of luxation out of the glenoid fossa, fragmentation, associated mandibular injury, occlusion and dentition, associated facial fractures, comorbidities, and a foreign body in the TMJ. Intracapsular comminuted fractures cannot be repaired and are mobilized (the 2016 slide hedges this with a question mark). Pearl: the 45 or 90 degree wording is garbled in the slide (45 and over for severe displacement matches the class scheme).',
    concepts: ['condylar-management'],
},
{
    id: 'q32', type: 'mcq', section: 'Site-Specific Management',
    stem: 'A low subcondylar fracture needs ORIF. Which approach and what advantage match the deck?',
    options: [
        { id: 'a', text: 'Intraoral; avoids facial nerve injury and a cutaneous scar, but is harder for higher fractures'  },
        { id: 'b', text: 'Transcutaneous trocar only; no intraoral access is possible'  },
        { id: 'c', text: 'Extraoral; avoids intraoral contamination'  },
        { id: 'd', text: 'Coronal; best exposure of the TMJ'  },
    ],
    correct: 'a',
    brief: 'Intraoral for low condylar process fractures; extraoral for displaced fractures with ramus shortening or interference with function.',
    detailed: 'Extraoral access is chosen when the fracture is displaced with ramus height loss or the fragment interferes with function; its advantage is direct access and better visualization. Intraoral access trades visualization for no scar and no facial nerve risk, and higher fractures are harder. A buccal trocar can bridge the gap. Pearl: the higher the fracture, the more you need an extraoral view.',
    concepts: ['condylar-management', 'approaches'],
},
{
    id: 'q33', type: 'mcq', section: 'Site-Specific Management',
    stem: 'A comminuted mandibular fracture is stripped of periosteum during ORIF. What does the 2022 deck say about infection and about the cause of nonunion?',
    options: [
        { id: 'a', text: 'Stripping always raises infection; nonunion is due to the plate'  },
        { id: 'b', text: 'Stripping prevents nonunion by exposing marrow'  },
        { id: 'c', text: 'Stripping does not raise infection if fragments are stabilized; most nonunions come from inadequate immobilization of the fragments'  },
        { id: 'd', text: 'Reconstruction plates have higher complication rates than miniplates in comminution'  },
    ],
    correct: 'c',
    brief: 'Stabilize the fragments; instability, not periosteal stripping, causes infection and nonunion.',
    detailed: 'Comminuted fractures treated with reconstruction-plate ORIF have lower complication rates and shorter recovery. Caveat: the edentulous mandible is the exception, where the periosteum is the blood supply (below). Pearl: in comminution, bridge it with a load-bearing plate rather than trying to fix every fragment.',
    concepts: ['comminuted'],
},
{
    id: 'q34', type: 'mcq', section: 'Site-Specific Management',
    stem: 'An avulsive gunshot wound has destroyed part of the mandible and the patient is a poor candidate for open or closed treatment. What device does the 2016 deck describe?',
    options: [
        { id: 'a', text: 'A Joe Hall Morris appliance: biphasic external pin fixation with transcutaneous pins, bar and framework, later acrylic'  },
        { id: 'b', text: 'A lag screw construct'  },
        { id: 'c', text: 'Ivy loops'  },
        { id: 'd', text: 'A Gunning splint only'  },
    ],
    correct: 'a',
    brief: 'Joe Hall Morris: biphasic external pin fixation; comminuted, avulsive, edentulous, or poor candidates; temporary or definitive.',
    detailed: 'Indications: comminuted fractures, avulsive gunshot wounds, edentulous mandibles, and patients who are poor candidates for open or closed treatment. Transcutaneous pins are connected to an external bar or framework and then replaced with an acrylic tube or rod (biphasic). It can be temporary or permanent. Pearl: external fixation is a damage-control device that preserves reduction without a soft-tissue stripping.',
    concepts: ['external-fixator'],
},

// ════════════════ SPECIAL POPULATIONS & COMPLICATIONS ════════════════

{
    id: 'q35', type: 'mcq', section: 'Special Populations & Complications',
    stem: 'Why is the edentulous, atrophic mandible a special problem?',
    options: [
        { id: 'a', text: 'Occlusion must be perfect to fit new dentures'  },
        { id: 'b', text: 'High bone density makes screw placement difficult'  },
        { id: 'c', text: 'Thin body, resorbed height, and a blood supply dependent on periosteum raise nonunion, and without teeth MMF cannot be used'  },
        { id: 'd', text: 'The inferior alveolar artery supplies more flow, causing hemorrhage'  },
    ],
    correct: 'c',
    brief: 'Less bone, less blood supply, no teeth to wire: nonunion up to about 20%.',
    detailed: 'Decreased bone height means decreased buttressing; resorption is greatest in the thin body; inferior alveolar artery flow decreases so the bone relies on periosteal (subperiosteal plexus) supply; and age and comorbidity slow healing. The paradox from the deck: occlusion matters little (new dentures can accommodate), but without teeth MMF and closed reduction are unusable. Pearl: avoid subperiosteal degloving.',
    concepts: ['edentulous'],
},
{
    id: 'q36', type: 'mcq', section: 'Special Populations & Complications',
    stem: 'Which management of a displaced fracture of a severely atrophic edentulous mandible is best supported by Bruce and Ellis and by Luhr?',
    options: [
        { id: 'a', text: 'Intraoral miniplates and 6 weeks of IMF'  },
        { id: 'b', text: 'Extraoral approach, rigid fixation (compression or reconstruction plate), minimal subperiosteal dissection; supraperiosteal plate placement in class III'  },
        { id: 'c', text: 'Observation with a soft diet in all cases'  },
        { id: 'd', text: 'Transoral subperiosteal exposure with interosseous wires'  },
    ],
    correct: 'b',
    brief: 'Extraoral approach, rigid fixation, avoid subperiosteal stripping.',
    detailed: 'The 2016 deck: lowest complication rates with extraoral approaches and rigid fixation, avoiding subperiosteal dissection, using a compression plate; for the most atrophic (class III) mandibles, avoid periosteal degloving and place the plate supraperiosteally. Nonunion in edentulous or atrophic mandibles reaches about 20%. Pearl: here the load-bearing plate and the preserved blood supply matter more than the approach scar.',
    concepts: ['edentulous', 'load-bearing'],
},
{
    id: 'q37', type: 'recall', section: 'Special Populations & Complications',
    stem: 'How do pediatric mandible fractures differ, and how are they treated?',
    answer: `Differences:
• Heal rapidly; nonunion and fibrous union are rare
• Growth compensates for imperfect reduction; early malocclusion or malunion may resolve
• Thin cortex, tooth buds in the body
• Short crowns make MMF hard
• Ankylosis risk (esp. condyle)

Treatment:
• Favors closed reduction
• ORIF if severely displaced, unfavorable, delayed, or airway or medical issues
• Short IMF 7 to 14 days, jaw-opening exercises; immediate function if under 3 years`,
    brief: 'Children heal fast and remodel, so close observation or short IMF suffices; ankylosis is the main risk.',
    detailed: 'Condylar fractures in children under 12 are treated conservatively unless bilateral and dislocated. Greenstick patterns are common. Pearl: the pediatric mandible tolerates inexact reduction but does not tolerate prolonged immobilization.',
    concepts: ['pediatric'],
},
{
    id: 'q38', type: 'recall', section: 'Special Populations & Complications',
    stem: 'List the acute and long-term complications of mandible fracture repair, and the treatment of malunion and nonunion.',
    answer: `Acute:
• Infection
• Hematoma
• Injury to IAN, facial, or lingual nerves, teeth, gums
• Plate exposure

Long term:
• Malunion — bony union in abnormal position; treat with opening osteotomy at the fracture site, reposition, re-establish occlusion, rigid fixation
• Nonunion — no osseous union after the usual interval, most often from infection; open, remove callus, reduce, reconstruction bar plus or minus bone graft
• Osteomyelitis
• Increased facial width (lingual cortex splayed though buccal cortex looks intact)`,
    brief: 'Nonunion is usually infection; malunion needs an osteotomy; widened face suggests a splayed lingual cortex.',
    detailed: 'ORIF infection rates range from 5 to 32%, and substance abuse raises the risk. Pearl: in widened-face malunion, the buccal cortex may look perfect on the plate side; the failure is lingual, which you cannot see.',
    concepts: ['complications'],
},

// ════════════════ CASES ════════════════

{
    id: 'q39', type: 'mcq', section: 'Cases',
    stem: 'A 24-year-old man was assaulted. CT shows a left mandibular angle fracture through a superficially impacted third molar, with a tooth-bearing oral communication and a displaced proximal segment pulled up and medial. He has lower-lip numbness. What classifies the fracture, and which factor explains his numbness?',
    options: [
        { id: 'a', text: 'Closed, unfavorable; numbness comes from the plate'  },
        { id: 'b', text: 'Open, favorable; numbness is a TMJ sign'  },
        { id: 'c', text: 'Closed, favorable; the numbness is from a mental nerve stretch'  },
        { id: 'd', text: 'Open, horizontally unfavorable; IAN injury in an IAN-bearing posterior fracture (document it before repair)'  },
    ],
    correct: 'd',
    brief: 'Open, unfavorable angle fracture with a pre-treatment IAN deficit.',
    detailed: 'The communication makes it open (antibiotics 24 to 48 hours, chlorhexidine). The pull of masseter, medial pterygoid, and temporalis displaces the proximal segment, so it is unfavorable. Posterior IAN-bearing fractures carry the highest rate of nerve injury and a deficit present on arrival is part of the injury. Pearl: record sensation, and the displacement over 5 mm, before you operate.',
    concepts: ['case-angle', 'favorable-unfavorable'],
},
{
    id: 'q40', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) The impacted M3 sits in the fracture line and the occlusion is off. Which plan is best?',
    options: [
        { id: 'a', text: 'Extraoral reconstruction plate for every angle fracture'  },
        { id: 'b', text: 'Retain the tooth and do 6 weeks of IMF'  },
        { id: 'c', text: 'Closed treatment with a soft diet only'  },
        { id: 'd', text: 'Remove the impacted third molar, establish occlusion, and place a transoral miniplate at the superior border (Champy) or a stronger construct if unstable'  },
    ],
    correct: 'd',
    brief: 'Impacted M3 out; occlusion first; transoral superior-border fixation.',
    detailed: 'Impacted third molars are an indication for removal. ORIF is recommended for unfavorable simple angle fractures to prevent redisplacement and avoid MMF. A transoral approach suits the angle in a patient with an open fracture; the surgeon sets the occlusion, reduces the dentate segment first, fixes, and rechecks the bite. Pearl: two plates did not improve outcomes in the Schierle report and raised IAN deficit risk in the deck data.',
    concepts: ['case-angle', 'teeth-in-line', 'champy'],
},
{
    id: 'q41', type: 'mcq', section: 'Cases',
    stem: 'A 78-year-old edentulous woman fell and has a displaced fracture of an atrophic mandibular body. She has osteoporosis and diabetes. Which approach is the most defensible?',
    options: [
        { id: 'a', text: 'Closed reduction with Gunning splint and dentures for 6 weeks'  },
        { id: 'b', text: 'Extraoral approach with a load-bearing plate, preserving the periosteum'  },
        { id: 'c', text: 'Intraoral miniplate at the superior border with subperiosteal stripping'  },
        { id: 'd', text: 'Observation without fixation'  },
    ],
    correct: 'b',
    brief: 'Atrophic body: load-bearing plate, extraoral, minimal periosteal stripping.',
    detailed: 'Nonunion reaches about 20%. Bone height and periosteal blood supply are the limits; the plate must carry the load. Closed options exist (Gunning splints, external fixation) but are inferior or reserved for patients who cannot undergo surgery. Pearl: age and diabetes slow healing, so favor fixation that does not depend on bone quality at the fracture.',
    concepts: ['case-edentulous', 'edentulous'],
},
{
    id: 'q42', type: 'mcq', section: 'Cases',
    stem: '(Same patient.) Four weeks later the plate is exposed and there is pus at the fracture. What does the most likely sequence imply?',
    options: [
        { id: 'a', text: 'Hardware infection with instability: nonunion risk; treat with debridement, antibiotics, and revision fixation (reconstruction plate, plus or minus bone graft)'  },
        { id: 'b', text: 'Malunion; opening osteotomy'  },
        { id: 'c', text: 'Condylar ankylosis'  },
        { id: 'd', text: 'Normal healing; reassure'  },
    ],
    correct: 'a',
    brief: 'Infection plus instability leads to nonunion; revise with a reconstruction plate.',
    detailed: 'Nonunion is most often due to infection; treatment is open debridement, removal of the callus, reduction, a reconstruction bar for fixation, and bone grafting as needed. Pearl: remove the infection source before you trust any new hardware.',
    concepts: ['case-edentulous', 'complications'],
},
{
    id: 'q43', type: 'mcq', section: 'Cases',
    stem: 'A 5-year-old fell on her chin. The chin is deviated to the right on opening, there is a chin laceration, and CT shows a right condylar neck fracture without dislocation. Which approach?',
    options: [
        { id: 'a', text: 'External pin fixation'  },
        { id: 'b', text: 'ORIF through a retromandibular approach'  },
        { id: 'c', text: 'Closed management: soft diet, short or no IMF, and early jaw-opening exercises'  },
        { id: 'd', text: 'Six weeks of IMF with arch bars'  },
    ],
    correct: 'c',
    brief: 'Pediatric condylar fracture, not bilateral and dislocated: closed, early motion.',
    detailed: 'Children heal rapidly and remodel; the risk of prolonged IMF is ankylosis. Under 12, closed treatment unless bilateral and dislocated. Immediate function is used if under 3 years; otherwise IMF for 7 to 14 days and exercises. Pearl: the chin laceration over a symphyseal-region impact is the clue to look for a condylar fracture.',
    concepts: ['case-child', 'pediatric'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
