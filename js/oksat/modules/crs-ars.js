/* =================================================================
   Rhinosinusitis: ARS & CRS
   OKSAT · Rhinology / Allergy Module
   Acute rhinosinusitis and its complications, CRS classification and
   work-up, medical therapy, surgery, fungal and secondary CRS, and the
   EPOS biologic criteria, ending in synthesis cases. Built from the
   AR · CRS · AERD interactive guide (chapters 5, 6 and 8) and its bank of
   board-style questions; the guide's sources are EPOS 2020 and the NEJM
   2019 review. Draft: the owner verifies.
   Figures: none. Discrepancy policy: where EPOS and the NEJM review differ
   the item says so under "Caveat" or "Discrepancy".
   ================================================================= */
const meta = {
  id: 'crs-ars',
  title: 'Rhinosinusitis:\nARS & CRS',
  subtitle: 'From the EPOS definitions through acute rhinosinusitis and its orbital complications, CRS classification and work-up, medical therapy, ESS appropriateness and outcomes, fungal and secondary CRS, and the EPOS biologic criteria, with three synthesis cases.',
  kicker: 'Self-Assessment · Rhinology / Allergy Module',
  sources: [
    'Fokkens WJ, et al. European Position Paper on Rhinosinusitis and Nasal Polyps 2020. Rhinology 2020;58(Suppl 29):1–464 (PubMed 32077450).',
    'Hopkins C. Chronic Rhinosinusitis with Nasal Polyps. N Engl J Med 2019;381:55–63 (PubMed 31269366).',
    'Rudmik L, et al. Defining appropriateness criteria for endoscopic sinus surgery during management of uncomplicated adult chronic rhinosinusitis: a RAND/UCLA appropriateness study. Int Forum Allergy Rhinol 2016 (PubMed 26970538). The thresholds in q32, q33 and q61 match its abstract.',
    'Wise SK, et al. International Consensus Statement on Allergy and Rhinology: Allergic Rhinitis 2023. Int Forum Allergy Rhinol 2023 (PubMed 36878860): cited for the allergy overlap (CCAD).',
    'Content was taken from the AR · CRS · AERD interactive guide, which summarizes these documents; the primary papers were not re-read line by line for this module, so numbers are labelled as the guide gives them. Nothing here is clinically verified; the owner verifies.',
  ],
};

const DOMAINS = {
  ars: { label: 'Acute Rhinosinusitis & Complications', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
  classify: { label: 'CRS Classification & Workup', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
  medical: { label: 'Medical Therapy', color: '#A0635E', hex: 'rgba(160,99,94,0.14)' },
  surgery: { label: 'Surgery & Outcomes', color: '#5C4F7B', hex: 'rgba(92,79,123,0.14)' },
  variants: { label: 'Fungal & Secondary CRS', color: '#7B5C3A', hex: 'rgba(123,92,58,0.14)' },
  biologics: { label: 'Biologics in CRSwNP', color: '#7B7B4A', hex: 'rgba(123,123,74,0.14)' },
  cases: { label: 'Synthesis Cases', color: '#55606A', hex: 'rgba(85,96,106,0.14)' },
};

const CONCEPTS = {
  'rs-definitions': { label: 'Rhinosinusitis Definitions', domain: 'ars' },
  'viral-postviral': { label: 'Viral vs Post-viral ARS', domain: 'ars' },
  'abrs': { label: 'Acute Bacterial Rhinosinusitis', domain: 'ars' },
  'ars-treatment': { label: 'ARS Treatment', domain: 'ars' },
  'ars-complications': { label: 'Complication Groups & Routes', domain: 'ars' },
  'chandler': { label: 'Chandler Classification', domain: 'ars' },
  'orbital-management': { label: 'Orbital Complication Management', domain: 'ars' },
  'crs-classification': { label: 'EPOS 2020 CRS Classification', domain: 'classify' },
  'endotype': { label: 'Type 2 vs Non-type 2 Endotype', domain: 'classify' },
  'crs-control': { label: 'Control & Care Pathway', domain: 'classify' },
  'lund-mackay': { label: 'Lund–Mackay Score', domain: 'classify' },
  'histology': { label: 'Tissue Eosinophilia', domain: 'classify' },
  'systemic-workup': { label: 'Systemic Work-up', domain: 'classify' },
  'unilateral-disease': { label: 'Unilateral Disease', domain: 'classify' },
  'incs': { label: 'Intranasal Corticosteroids', domain: 'medical' },
  'saline': { label: 'Saline Irrigation', domain: 'medical' },
  'oral-steroids': { label: 'Systemic Corticosteroids', domain: 'medical' },
  'crs-against': { label: 'Therapies Recommended Against', domain: 'medical' },
  'antibiotics': { label: 'Antibiotics in CRS', domain: 'medical' },
  'nejm-algorithm': { label: 'CRSwNP Clinic Algorithm', domain: 'medical' },
  'steroid-delivery': { label: 'Steroid Delivery After ESS', domain: 'medical' },
  'ess-criteria': { label: 'ESS Appropriateness', domain: 'surgery' },
  'ess-extent': { label: 'Extent of Surgery', domain: 'surgery' },
  'ess-outcomes': { label: 'Outcomes & Recurrence', domain: 'surgery' },
  'ess-predictors': { label: 'Predictors of Response', domain: 'surgery' },
  'peds-crs': { label: 'Pediatric CRS', domain: 'surgery' },
  'afrs': { label: 'Allergic Fungal Rhinosinusitis', domain: 'variants' },
  'fungal-spectrum': { label: 'Fungal Disease by Host', domain: 'variants' },
  'invasive-fungal': { label: 'Invasive Fungal Sinusitis', domain: 'variants' },
  'cf-pcd': { label: 'Cystic Fibrosis & PCD', domain: 'variants' },
  'ccad': { label: 'Central Compartment Atopic Disease', domain: 'variants' },
  'vasculitis': { label: 'GPA & EGPA', domain: 'variants' },
  'biologic-criteria': { label: 'EPOS Biologic Criteria', domain: 'biologics' },
  'biologic-response': { label: 'Biologic Response Grading', domain: 'biologics' },
  'case-orbital': { label: 'Case: Orbital complication', domain: 'cases' },
  'case-biologic': { label: 'Case: Biologic candidate', domain: 'cases' },
  'case-ccad': { label: 'Case: Central compartment disease', domain: 'cases' },
};

const ITEMS = [
  {
    id: 'q1', type: 'recall', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'State the EPOS 2020 adult definition of rhinosinusitis, how the child definition differs, and how duration separates ARS, recurrent ARS and CRS.',
    answer: `• Adult: at least 2 symptoms, one of them nasal blockage/obstruction/congestion or nasal discharge (anterior or posterior), plus facial pain/pressure and/or reduced or lost smell.
• Objective evidence: endoscopic signs (polyps, mucopurulent discharge mainly from the middle meatus, edema or mucosal obstruction mainly in the middle meatus) and/or CT changes in the ostiomeatal complex or sinuses.
• Child: the same, but cough replaces smell loss.
• ARS: sudden onset, under 12 weeks. Recurrent ARS: at least 4 episodes a year with symptom-free intervals. CRS: the symptom set for 12 weeks or more.`,
    brief: 'Two symptoms (one of them blockage or discharge) plus one objective finding; time sets the label.',
    detailed: `Mechanism of the rule: symptoms alone overlap with allergic and nonallergic rhinitis, so symptom-only definitions are for epidemiology and primary care and overestimate prevalence. The objective arm (endoscopy or CT) is what makes it rhinosinusitis.
Application: CRSwNP means bilateral, endoscopically visible polyps in the middle meatus; CRSsNP means none visible, after decongestion if needed. For recurrent ARS, EPOS advises at least one episode proven by endoscopy and/or CT before the diagnosis (item q2).
Pearl: 2 + 1 + 1. Two symptoms, one of them blockage or discharge, plus one objective finding. Under 12 weeks acute, 12 or more chronic.`,
    concepts: ['rs-definitions'],
  },
  {
    id: 'q2', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'Recurrent acute rhinosinusitis is defined as:',
    options: [
      { id: 'a', text: 'At least 2 episodes a year, each treated with an antibiotic' },
      { id: 'b', text: 'At least 3 episodes in 6 months with persistent symptoms in between' },
      { id: 'c', text: 'At least 4 episodes a year, each meeting ARS criteria, with symptom-free intervals between episodes' },
      { id: 'd', text: 'Any acute episode that returns within 12 weeks of the previous one' },
    ],
    correct: 'c',
    brief: 'At least 4 episodes per year with symptom-free intervals. EPOS also advises confirming at least one episode by endoscopy or CT.',
    detailed: `Mechanism: the symptom-free interval is what separates recurrent ARS from CRS with exacerbations. If symptoms never clear between episodes, the 12-week rule makes it CRS.
Application: the objective-evidence proviso guards against labeling repeated viral colds or allergic flares as sinusitis, which is how antibiotics get overused. The proviso is EPOS advice rather than part of the numerical definition.
Pearl: count episodes, require clearance between them, and prove one.`,
    concepts: ['rs-definitions'],
  },
  {
    id: 'q3', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'Which description fits post-viral acute rhinosinusitis in EPOS 2020?',
    options: [
      { id: 'a', text: 'Symptoms that worsen after day 5 or persist beyond day 10, still under 12 weeks' },
      { id: 'b', text: 'Any acute rhinosinusitis lasting longer than 5 days' },
      { id: 'c', text: 'Symptoms that persist beyond 4 weeks' },
      { id: 'd', text: 'Fever above 38 °C with purulent discharge' },
    ],
    correct: 'a',
    brief: 'Viral ARS (the common cold) resolves in under 10 days. Post-viral ARS is a rise in symptoms after day 5 or persistence beyond day 10, still under 12 weeks.',
    detailed: `Mechanism: the nasal epithelium is the portal of entry for the virus and starts the cascade of edema, engorgement, extravasation, mucus and ostial obstruction. Most of this is viral inflammation, not infection.
Application: do not diagnose post-viral ARS before day 10 unless symptoms clearly worsen after day 5. Acute bacterial rhinosinusitis is a minority of post-viral cases, suspected from a cluster of features (item q4), not from duration alone.
Pearl: duration alone never makes it bacterial.`,
    concepts: ['viral-postviral'],
  },
  {
    id: 'q4', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'On day 7 of a cold that was improving until day 5, an adult now has a fever of 38.6 °C and severe unilateral maxillary pain. What is the best assessment under EPOS 2020?',
    options: [
      { id: 'a', text: 'Post-viral ARS; intranasal corticosteroid only' },
      { id: 'b', text: 'Viral ARS; reassure and review in a week' },
      { id: 'c', text: 'CRS exacerbation; obtain a CT now' },
      { id: 'd', text: 'Acute bacterial rhinosinusitis is likely (3 of 5 criteria); an amoxicillin-class antibiotic is reasonable' },
    ],
    correct: 'd',
    brief: 'Double sickening, fever above 38 °C and severe local pain make 3 of the 5 criteria, which supports ABRS. Beta-lactams have the best adult evidence.',
    detailed: `Mechanism: the five EPOS features are discolored discharge with unilateral predominance and purulent secretion in the nasal cavity, severe local pain (unilateral predominance), fever above 38 °C, elevated ESR or CRP, and double sickening (deterioration after an initial milder phase). Three or more point to bacterial infection. ABRS is only 0.5–2% of colds.
Application: amoxicillin/penicillin was effective by day 3 and at completion in adult trials; moxifloxacin was not shown to be superior. Fewer than 3 features means treat as post-viral and avoid antibiotics.
Pearl: routine antibiotics do not prevent complications. A low threshold for imaging does.`,
    concepts: ['abrs'],
  },
  {
    id: 'q5', type: 'recall', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'List the five EPOS 2020 features that favor acute bacterial over viral or post-viral rhinosinusitis, the number needed, and the antibiotic class with the best adult evidence.',
    answer: `• Discolored discharge (unilateral predominance) with purulent secretion in the nasal cavity.
• Severe local pain (unilateral predominance).
• Fever above 38 °C.
• Elevated ESR or CRP.
• Double sickening: deterioration after an initial milder phase.
Three or more of the five suggest ABRS. Best adult evidence: beta-lactams (amoxicillin/penicillin).`,
    brief: 'Three of five points to ABRS; fewer than three is post-viral ARS, managed without antibiotics.',
    detailed: `Application: ABRS is a minority of post-viral ARS (0.5–2% of colds). In children the data are thin: two small trials showed no significant benefit and more adverse events, and mucolytics such as erdosteine are not advised.
Pearl: two features of the five do not justify an antibiotic.`,
    concepts: ['abrs'],
  },
  {
    id: 'q6', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'A 32-year-old has had nasal congestion, bilateral facial pressure and cloudy discharge for 12 days. There is no fever and no worsening after an initial improvement. What does EPOS 2020 support?',
    options: [
      { id: 'a', text: 'Amoxicillin for 10 days' },
      { id: 'b', text: 'Symptomatic care, with an intranasal corticosteroid if symptom reduction is wanted; no antibiotic or systemic steroid' },
      { id: 'c', text: 'A 5-day course of oral prednisone' },
      { id: 'd', text: 'Sinus CT and referral for surgery' },
    ],
    correct: 'b',
    brief: 'This is post-viral ARS. Antibiotics have 1a(−) evidence of no benefit and systemic steroids do not change recovery at 7–14 days.',
    detailed: `Mechanism: persistence past day 10 in a patient who is not deteriorating is slow resolution of viral inflammation, not a bacterial relapse.
Application: in adults EPOS supports an intranasal corticosteroid when symptom reduction is needed (small effect, no quality-of-life effect); some herbal preparations (BNO1016, Pelargonium, Myrtol) showed benefit. Oral steroids had only a small effect on facial pain at days 4–7 with potential harm, and none on recovery. In children, saline and symptomatic care; the evidence is too weak for intranasal steroids or antihistamines.
Pearl: 1a(−) means good evidence of no effect, not an absence of evidence.`,
    concepts: ['ars-treatment'],
  },
  {
    id: 'q7', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'A patient with frontal sinusitis develops a soft, tender, fluctuant swelling of the forehead. Which complication is this?',
    options: [
      { id: 'a', text: 'Preseptal cellulitis' },
      { id: 'b', text: 'Cavernous sinus thrombosis' },
      { id: 'c', text: 'Pott\'s puffy tumor: frontal osteomyelitis with a subperiosteal abscess' },
      { id: 'd', text: 'An epidural abscess alone' },
    ],
    correct: 'c',
    brief: 'Frontal bone osteomyelitis with a subperiosteal abscess is Pott\'s puffy tumor, an osseous complication of frontal sinusitis.',
    detailed: `Mechanism and grouping: EPOS groups complications as orbital (preseptal and orbital cellulitis, subperiosteal and orbital abscess), intracranial (epidural and subdural empyema, brain abscess, meningitis, encephalitis, superior sagittal and cavernous sinus thrombosis) and osseous (frontal osteomyelitis, Pott's puffy tumor, frontocutaneous fistula). Children dominate orbital cases.
Application: the swelling is over the frontal bone, so it is osseous, not orbital. Intracranial extension can coexist, which is why imaging with contrast is part of the work-up.
Pearl: forehead swelling plus frontal sinusitis is Pott's puffy tumor until imaging says otherwise.`,
    concepts: ['ars-complications'],
  },
  {
    id: 'q8', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'A child has proptosis, painful limited eye movement, and a rim-enhancing collection between the lamina papyracea and the periorbita on CT. What is the Chandler stage?',
    options: [
      { id: 'a', text: 'Stage 1: preseptal cellulitis' },
      { id: 'b', text: 'Stage 2: orbital (post-septal) cellulitis' },
      { id: 'c', text: 'Stage 3: subperiosteal abscess' },
      { id: 'd', text: 'Stage 4: orbital abscess' },
    ],
    correct: 'c',
    brief: 'A collection between the lamina papyracea and periorbita is a subperiosteal abscess, Chandler stage 3.',
    detailed: `Mechanism: the ethmoid roof of the orbit is the paper-thin lamina papyracea, so ethmoid infection reaches the periorbita first. Pus lifting the periorbita off bone is stage 3; pus inside the periorbita (in the orbital fat or muscle cone) is stage 4.
Application: stage 2 is orbital cellulitis without a drainable collection; stage 1 has lid swelling without proptosis and with full eye movements. Contrast CT separates cellulitis from abscess.
Pearl: proptosis and painful, limited eye movement are the jump from stage 1 to stage 2.`,
    concepts: ['chandler'],
  },
  {
    id: 'q9', type: 'recall', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'Name the five Chandler stages in order, the examination finding that separates stage 1 from stage 2, and two criticisms of the classification.',
    answer: `• 1 Preseptal cellulitis. 2 Orbital (post-septal) cellulitis. 3 Subperiosteal abscess. 4 Orbital abscess. 5 Cavernous sinus thrombosis.
• Stage 1: lid edema and erythema, fever, no proptosis, full eye movements. Proptosis, chemosis, painful or limited movement or diplopia mean stage 2 or beyond.
• Criticism 1: preseptal cellulitis is an eyelid infection, not an orbital one, and is rarely sinogenic (URTI, dacryocystitis or skin).
• Criticism 2: cavernous sinus thrombosis is an intracranial complication, not necessarily the end of an orbital sequence, and is more often linked to sphenoid disease.`,
    brief: 'Stages 1 to 5 run from lid to cavernous sinus; the exam finding that marks the move into the orbit is proptosis with painful, limited movement.',
    detailed: `Application: spread begins at the medial lid. A maxillary source gives lower-lid swelling first; a frontal source gives the upper lid. Post-septal disease can progress within 24–48 hours, so it gets IV antibiotics and contrast CT (MRI if intracranial spread is suspected).
Pearl: the staircase is a teaching device, not a natural history. Always check vision and color vision.`,
    concepts: ['chandler'],
  },
  {
    id: 'q10', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'A child on intravenous antibiotics for orbital cellulitis now cannot distinguish red from green on plate testing, and acuity has dropped. What is the next step?',
    options: [
      { id: 'a', text: 'Urgent surgical drainage or decompression' },
      { id: 'b', text: 'Add intravenous corticosteroids and reassess in 48 hours' },
      { id: 'c', text: 'Repeat the CT in 72 hours' },
      { id: 'd', text: 'Switch to a broader-spectrum antibiotic' },
    ],
    correct: 'a',
    brief: 'Reduced acuity or color vision is an EPOS indication for surgery. Color vision is an early sign of deterioration.',
    detailed: `Mechanism: optic nerve compromise from pressure or inflammation shows first as loss of color discrimination, before acuity falls, so color vision is the sentinel test and is checked at every ophthalmology review (sometimes twice daily).
Application: EPOS surgical indications are (1) a subperiosteal or intraorbital abscess on CT or MRI (small abscesses are a possible exception), (2) reduced acuity or color vision, an afferent pupillary defect, or inability to assess vision, and (3) progression or no improvement in orbital signs despite IV antibiotics. Waiting 48–72 hours with this finding risks permanent loss.
Pearl: inability to assess vision (a young or sedated child) is itself an indication to operate.`,
    concepts: ['orbital-management'],
  },
  {
    id: 'q11', type: 'recall', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'List the EPOS 2020 indications for surgery in orbital complications of rhinosinusitis and the point at which IV antibiotics can step down.',
    answer: `• Subperiosteal or intraorbital abscess on CT or MRI (possible exception: small abscesses).
• Reduced visual acuity, reduced color vision, an afferent pupillary defect, or inability to assess vision.
• Progression, or no improvement in orbital signs (diplopia, ophthalmoplegia, proptosis, swelling, chemosis) despite IV antibiotics.
Step down to oral antibiotics after 48 hours afebrile with resolving signs.`,
    brief: 'Three groups: a drainable collection, threatened vision, or failure of medical therapy.',
    detailed: `Application: ophthalmology reviews exophthalmometry, tonometry, visual acuity, color vision and eye movements, sometimes twice daily. Small abscesses may be watched with close monitoring and drained for any visual decline, progression or failure to improve.
Pearl: the alarm symptoms that need immediate referral are periorbital edema or erythema, a displaced globe, double vision, ophthalmoplegia, reduced acuity, severe headache, frontal swelling, sepsis, meningism or neurologic signs.`,
    concepts: ['orbital-management'],
  },
  {
    id: 'q12', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'Per EPOS 2020, cavernous sinus thrombosis as a complication of rhinosinusitis is most often associated with infection of which sinus?',
    options: [
      { id: 'a', text: 'Maxillary' },
      { id: 'b', text: 'Anterior ethmoid' },
      { id: 'c', text: 'Frontal' },
      { id: 'd', text: 'Sphenoid' },
    ],
    correct: 'd',
    brief: 'EPOS argues that cavernous sinus thrombosis is an intracranial complication more often linked to sphenoid than to ethmoid or frontal disease.',
    detailed: `Mechanism: the sphenoid sinus sits against the cavernous sinus, separated by thin bone with venous connections, so infection spreads directly. The ethmoid reaches the orbit first.
Application: this is why Chandler's staircase, which ends in cavernous sinus thrombosis, misleads: stage 5 need not follow stages 1 to 4. A patient with sphenoid sinusitis, severe headache and cranial neuropathies needs imaging for intracranial extension.
Pearl: ethmoid goes to the orbit; sphenoid goes to the cavernous sinus.`,
    concepts: ['ars-complications'],
  },
  {
    id: 'q13', type: 'mcq', section: 'I. Acute Rhinosinusitis & Complications',
    stem: 'A child has fever, a swollen red eyelid after a scratch, full eye movements, no proptosis and normal vision. Which statement is correct?',
    options: [
      { id: 'a', text: 'This is Chandler stage 2, so contrast CT and IV antibiotics are mandatory' },
      { id: 'b', text: 'This is preseptal cellulitis, usually not sinogenic, often a clinical diagnosis treated with oral antibiotics' },
      { id: 'c', text: 'This is a subperiosteal abscess until proven otherwise, requiring urgent drainage' },
      { id: 'd', text: 'This is early cavernous sinus thrombosis, requiring anticoagulation' },
    ],
    correct: 'b',
    brief: 'Lid swelling with no proptosis and full movements is preseptal cellulitis, usually from a URTI, dacryocystitis or skin infection rather than sinusitis.',
    detailed: `Mechanism: the orbital septum limits spread, so the infection stays anterior to it. Preseptal cellulitis is an eyelid infection, not an orbital one.
Application: post-septal disease (proptosis, chemosis, painful ophthalmoplegia, diplopia) is different: IV antibiotics, contrast CT, and ophthalmology monitoring, because it can progress within 24–48 hours.
Pearl: examine the movements and look for proptosis in every swollen eyelid.`,
    concepts: ['orbital-management'],
  },
  {
    id: 'q14', type: 'recall', section: 'II. CRS: Classification & Workup',
    stem: 'Lay out the EPOS 2020 classification of CRS and place AFRS, CCAD, eCRS, odontogenic sinusitis, cystic fibrosis and GPA in it.',
    answer: `• Primary CRS (no local or systemic cause): localized (unilateral) or diffuse (bilateral), then type 2 or non-type 2.
• Primary localized: type 2 = AFRS; non-type 2 = isolated sinusitis.
• Primary diffuse: type 2 = eCRS/CRSwNP, AFRS, CCAD; non-type 2 = non-eCRS.
• Secondary CRS, localized: local pathology (odontogenic, fungal ball, tumor).
• Secondary CRS, diffuse: mechanical (PCD, CF), inflammatory (GPA, EGPA), or immunity (selective immunodeficiency).
• eCRS is set by tissue eosinophils of at least 10 per high-power field (×400).`,
    brief: 'Anatomy first (localized or diffuse), cause second (primary or secondary), endotype third (type 2 or not).',
    detailed: `Mechanism of the shift: EPOS 2020 stopped organizing CRS by the presence of polyps and organized it by distribution and endotype, because endotype is what drugs and prognosis follow.
Application: localized CRS usually does not respond to medical therapy and needs surgery, so EPOS sends unilateral disease to secondary care. AFRS keeps its name even though not every case shows fungal allergy.
Pearl: odontogenic = secondary localized; CF = secondary diffuse (mechanical); CCAD = primary diffuse type 2.`,
    concepts: ['crs-classification'],
  },
  {
    id: 'q15', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'An adult has 8 months of unilateral maxillary sinusitis traced to an infected upper molar. How does EPOS 2020 classify it?',
    options: [
      { id: 'a', text: 'Primary CRS, diffuse, type 2' },
      { id: 'b', text: 'Primary CRS, localized, non-type 2 (isolated sinusitis)' },
      { id: 'c', text: 'Secondary CRS, localized (local pathology)' },
      { id: 'd', text: 'Secondary CRS, diffuse (mechanical)' },
    ],
    correct: 'c',
    brief: 'A dental source is a local cause, so the disease is secondary and localized.',
    detailed: `Mechanism: primary CRS has no local or systemic cause; once a cause is identified (odontogenic infection, fungal ball, tumor) the disease is secondary. Unilateral disease is localized.
Application: secondary diffuse covers causes acting on the whole mucosa (mechanical: PCD and CF; inflammatory: GPA and EGPA; immunity: immunodeficiency). Treating the dental source is part of treating the sinus.
Pearl: find the cause before assigning "primary".`,
    concepts: ['crs-classification'],
  },
  {
    id: 'q16', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'In the EPOS control table (items assessed over the last month), how many present features define uncontrolled CRS?',
    options: [
      { id: 'a', text: 'Three or more' },
      { id: 'b', text: 'One or more' },
      { id: 'c', text: 'Two or more' },
      { id: 'd', text: 'All seven' },
    ],
    correct: 'a',
    brief: 'Controlled means all features absent; partly controlled means at least one present; uncontrolled means at least three present.',
    detailed: `Mechanism: the table scores nasal blockage, rhinorrhea or postnasal drip, facial pain or pressure, smell, sleep disturbance or fatigue, endoscopy findings and rescue medication over the last 6 months. For research, "not bothersome" is a VAS of 5 or less and "present" is above 5.
Application: EPOS warns that these 2012 criteria may overestimate how many patients are truly uncontrolled, so use them to direct escalation rather than as an absolute label.
Pearl: all absent, at least one, at least three.`,
    concepts: ['crs-control'],
  },
  {
    id: 'q17', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'A 50-year-old has anosmia, nasal blockage, adult-onset asthma, bilateral polyps with eosinophilic mucin, raised total IgE and blood eosinophilia. Which statement about this endotype is correct?',
    options: [
      { id: 'a', text: 'It is non-type 2 disease, so long-term macrolide therapy is the first escalation' },
      { id: 'b', text: 'It is type 3 disease driven by IL-17 and neutrophils, so IL-17 is the target' },
      { id: 'c', text: 'It is secondary CRS from immunodeficiency, so immunoglobulins come first' },
      { id: 'd', text: 'It is type 2 disease: it recurs most after surgery and responds to corticosteroids and the approved biologics' },
    ],
    correct: 'd',
    brief: 'Smell loss, asthma, atopy, polyps with eosinophilic mucin and raised IgE or eosinophils are the type 2 pattern.',
    detailed: `Mechanism: type 2 inflammation (IL-4, IL-5, IL-13; ILC2 and Th2) drives eosinophils, IgE and the polyp matrix. Pure or mixed type 2 CRS recurs more after surgery than pure type 1 or type 3 disease.
Application: type 2 pattern: main complaint is smell loss or blockage; asthma, N-ERD and atopy; polyps and eosinophilic mucin; raised IgE and eosinophilia; escalation to biologics, aspirin therapy after desensitization if N-ERD, oral steroid taper, revision. Non-type 2 pattern: discharge or facial pain, purulence, normal IgE, less asthma; escalation to xylitol rinses, long-term antibiotics, revision.
Caveat: the type 2 predominance is described in Western CRSwNP cohorts and may not hold elsewhere.
Pearl: match the escalation to the endotype.`,
    concepts: ['endotype'],
  },
  {
    id: 'q18', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'EPOS 2020 sets the tissue threshold for eosinophilic CRS at:',
    options: [
      { id: 'a', text: '5 or more eosinophils per high-power field' },
      { id: 'b', text: '10 or more eosinophils per high-power field (×400)' },
      { id: 'c', text: '25% eosinophils on nasal cytology' },
      { id: 'd', text: '100 or more eosinophils per high-power field' },
    ],
    correct: 'b',
    brief: 'eCRS means at least 10 eosinophils per high-power field at ×400; higher counts predict worse disease and recurrence.',
    detailed: `Mechanism: tissue eosinophils are the histologic marker of the type 2 endotype. EPOS further splits 10–100 versus more than 100 per high-power field in at least 2 fields.
Application: the 25% figure is the nasal cytology criterion for NARES, a different test on a different specimen. The 100 per field figure is a severity stratum, not the cutoff.
Pearl: tissue eosinophils above 10 per field also predict higher recurrence after surgery.`,
    concepts: ['histology'],
  },
  {
    id: 'q19', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'Which statement about the Lund–Mackay CT score is correct?',
    options: [
      { id: 'a', text: 'The maximum score per side is 24' },
      { id: 'b', text: 'The ostiomeatal complex is scored 0, 1 or 2' },
      { id: 'c', text: 'A score of 2 or less has an excellent negative predictive value for CRS, and 5 or more an excellent positive predictive value' },
      { id: 'd', text: 'A score of at least 4 is required before ESS is appropriate' },
    ],
    correct: 'c',
    brief: 'Five sinus groups are scored 0–2 and the ostiomeatal complex 0 or 2, giving 12 per side and 24 in total. A score of 2 or less essentially rules out CRS.',
    detailed: `Mechanism: each side scores maxillary, anterior ethmoid, posterior ethmoid, sphenoid and frontal as 0 (clear), 1 (partial) or 2 (total opacity), and the ostiomeatal complex as 0 or 2.
Application: the RAND/UCLA threshold for ESS is a Lund–Mackay score of at least 1, not 4. The score is a map of disease extent and correlates poorly with symptom burden, which is why surgical criteria also require symptom and treatment criteria (items q32 and q33).
Pearl: 12 per side, 24 total; 2 or less out, 5 or more in.`,
    concepts: ['lund-mackay'],
  },
  {
    id: 'q20', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'On one side the maxillary sinus is completely opaque, the anterior ethmoid is partly opaque, the posterior ethmoid, sphenoid and frontal sinuses are clear, and the ostiomeatal complex is obstructed. What is the Lund–Mackay score for this side?',
    options: [
      { id: 'a', text: '5' },
      { id: 'b', text: '3' },
      { id: 'c', text: '4' },
      { id: 'd', text: '6' },
    ],
    correct: 'a',
    brief: 'Maxillary 2 + anterior ethmoid 1 + ostiomeatal complex 2 = 5.',
    detailed: `Mechanism: partial opacity scores 1, total opacity 2, and an obstructed ostiomeatal complex scores 2 (it is scored only as 0 or 2). Clear sinuses score 0.
Application: 3 forgets that an obstructed ostiomeatal complex is 2 not 1; 4 drops the ostiomeatal complex or the partial ethmoid; 6 scores the partial ethmoid as total.
Pearl: add the sinuses, then add 0 or 2 for the ostiomeatal complex.`,
    concepts: ['lund-mackay'],
  },
  {
    id: 'q21', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'A 10-year-old has a wet cough and CRS. Nasal NO is 40 nL/min after cystic fibrosis and acute viral infection are excluded. This suggests:',
    options: [
      { id: 'a', text: 'Allergic rhinitis' },
      { id: 'b', text: 'Cystic fibrosis' },
      { id: 'c', text: 'A normal result' },
      { id: 'd', text: 'Primary ciliary dyskinesia' },
    ],
    correct: 'd',
    brief: 'Nasal NO below 77 nL/min detects primary ciliary dyskinesia with about 98% sensitivity and over 99% specificity once CF and acute viral infection are excluded.',
    detailed: `Mechanism: nasal NO is markedly low in PCD because of the ciliary and airway defect, so it works as a screen. Nasal NO is not useful for routine diagnosis of allergic rhinitis.
Application: PCD is mostly autosomal recessive, with situs inversus in about half (Kartagener), infertility, and CRSwNP in 15–30%. Confirm with ciliary electron microscopy (which can be normal) and genetics. The usual organisms are H. influenzae, S. pneumoniae and P. aeruginosa; prolonged macrolides and ESS if medical therapy fails.
Pearl: low nasal NO plus neonatal respiratory distress, situs inversus or a wet cough in a child with CRS points to PCD.`,
    concepts: ['systemic-workup', 'cf-pcd'],
  },
  {
    id: 'q22', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'An adult with unilateral nasal obstruction and headache has isolated opacification of one sphenoid sinus on CT. What is the appropriate approach?',
    options: [
      { id: 'a', text: 'Reassure; isolated opacification needs no further evaluation' },
      { id: 'b', text: 'Refer for early surgical evaluation: isolated opacification carries a real neoplasia risk (about 18%, malignancy 7–10%) and rarely responds to medical therapy' },
      { id: 'c', text: 'Prescribe 12 weeks of intranasal steroid and repeat the CT' },
      { id: 'd', text: 'Start long-term macrolide therapy for a non-type 2 pattern' },
    ],
    correct: 'b',
    brief: 'Isolated maxillary or sphenoid opacification is neoplasia in about 18% and malignancy in 7–10%. Keep a low threshold for early surgery.',
    detailed: `Mechanism: localized disease is more often structural, infective, fungal or neoplastic than the inflammatory processes that medical therapy treats.
Application: EPOS sends unilateral disease to secondary care, with urgent CT when tumor is suspected. Blood-stained discharge, unilateral polyps and visual change are urgent referral triggers in the NEJM review.
Pearl: unilateral means imaging and tissue before medication.`,
    concepts: ['unilateral-disease'],
  },
  {
    id: 'q23', type: 'recall', section: 'II. CRS: Classification & Workup',
    stem: 'When should you test for a systemic cause of CRS, and what do you order for each suspicion?',
    answer: `• Humoral immunodeficiency (recalcitrant CRS, rapid relapse after antibiotics, pneumonia, bronchiectasis): IgG, IgA, IgM, then vaccine titers to protein (tetanus) and polysaccharide (pneumococcal) antigens before and after immunization.
• GPA (crusting, bleeding, disproportionately unwell): c-ANCA/PR3, positive in up to 95% of active systemic GPA; cocaine can mimic both the picture and the serology.
• EGPA (severe polyps unresponsive to usual care, adult asthma): blood eosinophils above 1500/µL or above 10%, ANCA in a subset, organ screen.
• Sarcoidosis (crusting, nodules, systemic features): biopsy for non-caseating granulomas; ACE is about 60% sensitive and 70% specific.
• Cystic fibrosis (polyps in a child under 16): sweat chloride and CFTR genetics.
• PCD (neonatal respiratory distress, situs inversus, wet cough, CRS in a child): nasal NO, ciliary electron microscopy (may be normal), genetics.`,
    brief: 'Each suspicion has a clinical trigger and a first test: immunoglobulins with vaccine titers, ANCA, eosinophils, biopsy, sweat chloride, nasal NO.',
    detailed: `Application: test for the vaccine response to both a protein antigen (T-dependent) and a polysaccharide antigen (T-independent), because specific antibody deficiency can spare protein responses.
Pearl: red flags for secondary diffuse CRS are bleeding, crusting, severe pain, tissue loss and other organ involvement; these warrant serology, biopsy, CT and specialist referral.`,
    concepts: ['systemic-workup'],
  },
  {
    id: 'q24', type: 'mcq', section: 'II. CRS: Classification & Workup',
    stem: 'Which patient needs secondary-care assessment first, rather than a primary-care trial of saline and an intranasal steroid?',
    options: [
      { id: 'a', text: 'A patient with bilateral blockage and discharge for 14 weeks' },
      { id: 'b', text: 'A patient with bilateral blockage and reduced smell for 6 months' },
      { id: 'c', text: 'A patient with unilateral symptoms, bleeding or crusting' },
      { id: 'd', text: 'A patient with nasal blockage that worsens in pollen season' },
    ],
    correct: 'c',
    brief: 'Unilateral symptoms, bleeding and crusting are red flags for localized or secondary diffuse disease, so they go straight to full ENT assessment.',
    detailed: `Mechanism: the EPOS pathway assumes primary diffuse disease in primary care: 6–12 weeks of saline rinses and an intranasal steroid, with technique and adherence taught and treatable traits (asthma, allergy, smoking, N-ERD) checked.
Application: localized disease goes to endoscopy and CT (urgent if tumor is suspected) and usually surgery. Red flags for secondary diffuse CRS (bleeding, crusting, severe pain, tissue loss, other organ involvement) prompt serology, biopsy, CT and specialist referral. For CRS add unilateral symptoms, bleeding, crusting and cacosmia to the alarm list.
Pearl: the first step depends on whether the disease looks primary and diffuse.`,
    concepts: ['crs-control', 'unilateral-disease'],
  },
  {
    id: 'q25', type: 'mcq', section: 'III. Medical Therapy',
    stem: 'Which statement about intranasal corticosteroids in CRS is supported by EPOS 2020 and the NEJM review?',
    options: [
      { id: 'a', text: 'They are effective and safe long term, with a larger effect in CRSwNP than CRSsNP, and the SNOT-22 change is below the MCID' },
      { id: 'b', text: 'One molecule is clearly superior, so mometasone should always be chosen' },
      { id: 'c', text: 'Prolonged use raises intraocular pressure and causes cataract' },
      { id: 'd', text: 'They do not reduce polyp recurrence after ESS' },
    ],
    correct: 'a',
    brief: 'Evidence level 1a: effective and safe long term, bigger effect in CRSwNP (SMD −0.93) than CRSsNP (−0.30), no difference between molecules.',
    detailed: `Mechanism: second-generation intranasal steroids (mometasone, fluticasone) have under 1% systemic bioavailability, so they can be used long term without breaks.
Application: they reduce polyp size and prevent recurrence after ESS, with no effect on intraocular pressure or lens. Even so, the SNOT-22 improvement is below the minimal clinically important difference, a reminder that pooled symptom scores dilute benefit. They are underused: in one database only 20% of CRS patients used one, mostly at too low a dose.
Pearl: teach technique and adherence before calling a spray a failure.`,
    concepts: ['incs'],
  },
  {
    id: 'q26', type: 'mcq', section: 'III. Medical Therapy',
    stem: 'Which saline irrigation choice does EPOS 2020 advise against?',
    options: [
      { id: 'a', text: 'Isotonic saline' },
      { id: 'b', text: 'Ringer\'s lactate' },
      { id: 'c', text: 'Saline with xylitol' },
      { id: 'd', text: 'Hypertonic saline or added baby shampoo' },
    ],
    correct: 'd',
    brief: 'Hypertonic solutions and baby shampoo add side effects without benefit. Xylitol, hyaluronate and xyloglucan may help.',
    detailed: `Mechanism: isotonic saline and Ringer's lactate are well tolerated and improve mucociliary clearance; the additives tested otherwise (honey, dexpanthenol, heat) added no benefit.
Application: large-volume irrigation has not been proven better than spray for saline alone (item q31 for the steroid-delivery distinction).
Pearl: isotonic first; avoid hypertonic and shampoo.`,
    concepts: ['saline'],
  },
  {
    id: 'q27', type: 'mcq', section: 'III. Medical Therapy',
    stem: 'After a 2-week course of oral corticosteroid for CRSwNP, what should you expect?',
    options: [
      { id: 'a', text: 'Both polyps and symptoms stay improved for 12 months' },
      { id: 'b', text: 'The polyp score stays improved for about 3 months, but the symptom benefit has faded by then' },
      { id: 'c', text: 'Neither improves; oral steroids only help CRSsNP' },
      { id: 'd', text: 'Symptoms improve for 3 months but polyp size returns within 2 weeks' },
    ],
    correct: 'b',
    brief: 'A short course lowers symptoms and polyp score; the polyp effect lasts about 3 months, the symptom effect does not.',
    detailed: `Mechanism: steroids suppress the type 2 inflammation that holds the polyp matrix, but when stopped the inflammation returns.
Application: the Cochrane review (8 RCTs) used 2–3 weeks at about 0.5 mg/kg/day (maximum 60 mg) with short-term benefit gone by 3–6 months and insomnia and gastrointestinal effects. EPOS supports 1–2 courses a year for partly or uncontrolled disease; weigh cumulative bone harm. A short postoperative course does not improve quality of life.
Pearl: a smell response to oral steroids predicts the smell result of surgery.`,
    concepts: ['oral-steroids'],
  },
  {
    id: 'q28', type: 'mcq', section: 'III. Medical Therapy',
    stem: 'Which CRS therapy does EPOS 2020 explicitly recommend against?',
    options: [
      { id: 'a', text: 'A short course of oral steroids in CRSwNP' },
      { id: 'b', text: 'Saline irrigation' },
      { id: 'c', text: 'Topical or systemic antifungals' },
      { id: 'd', text: 'An intranasal corticosteroid after ESS' },
    ],
    correct: 'c',
    brief: 'Antifungals have 1a(−) evidence: no effect on quality of life, symptoms or signs. The NEJM review agrees.',
    detailed: `Mechanism: fungi are in almost every nose; the host response, not the organism, distinguishes disease, so killing fungi does not treat the inflammation (except in AFRS, where it is an adjunct).
Application: EPOS also recommends against probiotics, proton pump inhibitors, traditional Chinese medicine or acupuncture, and verapamil (1b(−)). Montelukast is not recommended unless an intranasal steroid is not tolerated, and should not be added to one; antihistamines have insufficient evidence for CRS (treat comorbid allergic rhinitis); decongestants only as a temporary add-on when the nose is fully blocked.
Pearl: the "(−)" means good evidence of no benefit.`,
    concepts: ['crs-against'],
  },
  {
    id: 'q29', type: 'mcq', section: 'III. Medical Therapy',
    stem: 'Which statement about antibiotics in CRS is correct?',
    options: [
      { id: 'a', text: 'Short-term, long-term and topical antibiotics all have uncertain or absent proven benefit in EPOS 2020, and long-term macrolides carry cardiovascular risk' },
      { id: 'b', text: 'Long-term macrolides are first-line for type 2 CRSwNP' },
      { id: 'c', text: 'Topical antibiotic irrigation is clearly better than placebo' },
      { id: 'd', text: 'Three weeks of doxycycline has been proven superior to oral steroids' },
    ],
    correct: 'a',
    brief: 'EPOS rates short-term antibiotics 1b(−), long-term 1a(−) and topical 1b(−), with macrolide cardiovascular risk and gastrointestinal adverse effects.',
    detailed: `Mechanism and sources: EPOS pooled the trials and found no reliable benefit. The NEJM review notes that doxycycline for 3 weeks and methylprednisolone each shrank polyps against placebo, with the steroid faster and doxycycline more sustained, and that macrolides reduced early postoperative recurrence in one RCT. Those claims rest on single small trials.
Application: long-term antibiotics have a role in the non-type 2 escalation pathway and in immunodeficiency or PCD, where they are chosen for the host, not for polyps.
Pearl: weigh single-RCT advice against pooled evidence.`,
    concepts: ['antibiotics'],
  },
  {
    id: 'q30', type: 'recall', section: 'III. Medical Therapy',
    stem: 'Outline the NEJM 2019 clinic algorithm for CRSwNP, including the VAS bands and who is referred urgently.',
    answer: `• Unilateral polyps, visual change or blood-stained discharge: urgent referral.
• VAS bands: 0–3 mild, above 3 to 7 moderate, above 7 severe.
• Bilateral, VAS under 4: intranasal steroid spray plus saline; stress adherence.
• Bilateral, VAS 4 or more: steroid drops plus saline; consider oral steroid and doxycycline.
• Good response: maintenance spray plus saline. Poor or short-lived response: CT, then ESS.
• Early recurrence after surgery: change steroid delivery (devices, irrigations, stents); consider long-term antibiotics or biologics.`,
    brief: 'Triage red flags first, then step intensity by VAS, then CT and surgery for non-responders.',
    detailed: `Application: the vignette patient received 14 days of oral steroid, doxycycline 100 mg daily for 3 weeks and head-down steroid drops for 4 weeks, with referral for surgery if still moderate to severe at 4 weeks.
Caveat: the doxycycline advice rests on one small RCT and the irrigation advice on one post-ESS RCT; the review was written when biologics were under study.
Pearl: the first branch is unilateral, visual or bloody.`,
    concepts: ['nejm-algorithm'],
  },
  {
    id: 'q31', type: 'mcq', section: 'III. Medical Therapy',
    stem: 'After ESS for CRSwNP, which statement best reconciles the NEJM review and EPOS 2020 on steroid delivery?',
    options: [
      { id: 'a', text: 'EPOS proved large-volume irrigation superior in every setting, so the NEJM advice is redundant' },
      { id: 'b', text: 'Sprays do not reach the postoperative cavity, so irrigation is mandatory' },
      { id: 'c', text: 'Steroid drops are contraindicated after ESS because of the open cavity' },
      { id: 'd', text: 'One RCT found high-volume (240 mL) steroid irrigation beat the same dose by spray for endoscopic recurrence, while EPOS found insufficient evidence that large-volume saline beats spray: different questions, so both can be true' },
    ],
    correct: 'd',
    brief: 'EPOS pooled saline studies across settings; the NEJM claim is specific to postoperative steroid delivery and rests on one trial.',
    detailed: `Mechanism: after ESS the cavity is open and the mucosa is accessible, so delivery matters more; mometasone was used in the trial, with budesonide and fluticasone also available.
Application: drops in a head-down position are used for moderate to severe disease. Delivery change is also the first response to early recurrence in the NEJM algorithm (item q30).
Pearl: one RCT is a reason to try it, not a reason to call the question closed.`,
    concepts: ['steroid-delivery'],
  },
  {
    id: 'q32', type: 'mcq', section: 'IV. Surgery & Outcomes',
    stem: 'A patient with CRSwNP has a Lund–Mackay score of 8, 10 weeks of intranasal steroid, one 7-day prednisone course, and a post-treatment SNOT-22 of 34. By RAND/UCLA criteria, ESS is:',
    options: [
      { id: 'a', text: 'Inappropriate: intranasal steroid must be given for at least 12 weeks' },
      { id: 'b', text: 'Appropriate: all four minimum criteria are met' },
      { id: 'c', text: 'Inappropriate: SNOT-22 must be 40 or more' },
      { id: 'd', text: 'Inappropriate: two systemic steroid courses are required' },
    ],
    correct: 'b',
    brief: 'The minimum criteria are a Lund–Mackay score of at least 1, at least 8 weeks of intranasal steroid plus a short systemic steroid course (CRSwNP), and a post-treatment SNOT-22 of at least 20.',
    detailed: `Mechanism: the RAND/UCLA panel (Rudmik 2016) scored 624 scenarios and defined the minimum medical trial before surgery is an appropriate option.
Application: SNOT-22 of 40 or more is an EPOS biologic criterion, not a surgical one. Meeting the criteria makes surgery appropriate, not mandatory, and these are thresholds for uncomplicated adult CRS; patients operated on outside them improved less in quality of life.
Pearl: 1, 8, steroid, 20.`,
    concepts: ['ess-criteria'],
  },
  {
    id: 'q33', type: 'recall', section: 'IV. Surgery & Outcomes',
    stem: 'State the four RAND/UCLA minimum criteria for ESS in uncomplicated adult CRS, and how the medical-trial criterion differs for CRSwNP and CRSsNP.',
    answer: `• CT Lund–Mackay score of at least 1.
• At least 8 weeks of topical intranasal corticosteroid.
• Plus: CRSwNP, a short course of systemic steroid. CRSsNP, either a short course of broad-spectrum or culture-directed systemic antibiotic, or a prolonged course of low-dose anti-inflammatory antibiotic.
• Post-treatment total SNOT-22 of at least 20.`,
    brief: 'Imaging, a topical trial, a second medical agent matched to polyp status, and a symptom threshold after treatment.',
    detailed: `Application: these are minimum thresholds for offering surgery as an option; extent and technique were not addressed by the panel. Preoperative SNOT-22 is also the best predictor of improvement (item q36).
Pearl: the polyp status decides the second agent: steroid for CRSwNP, antibiotic for CRSsNP.`,
    concepts: ['ess-criteria'],
  },
  {
    id: 'q34', type: 'mcq', section: 'IV. Surgery & Outcomes',
    stem: 'Which set of procedures defines a "full FESS" in EPOS 2020?',
    options: [
      { id: 'a', text: 'Uncinectomy with a maxillary antrostomy alone' },
      { id: 'b', text: 'Anterior ethmoidectomy with a Draf III' },
      { id: 'c', text: 'Anterior and posterior ethmoidectomy, middle meatal antrostomies, sphenoidotomy, and a frontal opening such as Draf IIa' },
      { id: 'd', text: 'Endoscopic polypectomy with turbinate reduction' },
    ],
    correct: 'c',
    brief: 'Full FESS opens every sinus group: both ethmoids, the maxillary ostia, the sphenoid and the frontal recess.',
    detailed: `Mechanism: EPOS ranks the extent of surgery. Functional surgery makes a cavity that incorporates the natural ostium, ventilates, supports mucociliary clearance and gives access for topical therapy. Full FESS is the full set above. Extended surgery is a Draf III or surgery beyond the sinuses (skull base, orbit, pterygopalatine and infratemporal fossae). Radical surgery adds significant removal of inflamed mucosa.
Application: the surgical goal is topical access as much as removal, which is why postoperative steroid delivery matters (item q31).
Pearl: Draf III is extended, not full.`,
    concepts: ['ess-extent'],
  },
  {
    id: 'q35', type: 'mcq', section: 'IV. Surgery & Outcomes',
    stem: 'A patient with CRSwNP asks what to expect after ESS. Which statement is the most accurate?',
    options: [
      { id: 'a', text: 'Large quality-of-life gains are maintained to 5 years, but about 40% show endoscopic polyp recurrence by 18 months and about 20% need revision within 5 years, so topical steroids must continue' },
      { id: 'b', text: 'ESS is curative: with a complete polypectomy recurrence is under 5%' },
      { id: 'c', text: 'Smell always recovers once the polyps are removed' },
      { id: 'd', text: 'Postoperative steroid therapy is unnecessary after a complete ethmoidectomy' },
    ],
    correct: 'a',
    brief: 'Outcomes are good but not curative: roughly 40% endoscopic recurrence at 18 months and 20% revision at 5 years.',
    detailed: `Mechanism: surgery removes the obstructing tissue and opens the sinuses to topical therapy, but it does not change the type 2 inflammation that rebuilds the polyp matrix. Smell loss has two parts: inflammation of the neuroepithelium and mechanical blockage of the olfactory cleft. Surgery fixes only the second.
Application: postoperative intranasal steroids improve symptoms and endoscopic scores and cut prednisolone rescue, so counsel before surgery. Adherence fell to 42% at 12 months in one study. Large national audit data (England) show quality-of-life gains maintained to 5 years. Big-data studies suggest ESS lowers the incidence of new asthma diagnoses.
Pearl: promise the airway and the nose, not a cure.`,
    concepts: ['ess-outcomes'],
  },
  {
    id: 'q36', type: 'mcq', section: 'IV. Surgery & Outcomes',
    stem: 'Which preoperative factor best predicts how much a patient will improve after ESS, and which predict recurrence?',
    options: [
      { id: 'a', text: 'Polyp size predicts improvement; smoking predicts recurrence' },
      { id: 'b', text: 'Revision status predicts better improvement than primary surgery; neutrophil counts predict recurrence' },
      { id: 'c', text: 'Lund–Mackay score predicts improvement; patient age predicts recurrence' },
      { id: 'd', text: 'Preoperative SNOT-22 predicts improvement; blood and tissue eosinophilia predict recurrence' },
    ],
    correct: 'd',
    brief: 'Preoperative SNOT-22 is the best predictor of improvement. Eosinophilia in blood and tissue predicts recurrence.',
    detailed: `Mechanism: SNOT-22 captures the burden that surgery can relieve, and eosinophils mark the type 2 endotype that rebuilds polyps (tissue eosinophils above 10 per high-power field predict recurrence).
Application: primary surgery beats revision, and a smell response to oral steroids predicts the smell result of surgery. Polyp size tracks obstruction but not the other symptoms, and smoking is not a strong CRSwNP risk factor.
Pearl: symptom burden predicts benefit; endotype predicts relapse.`,
    concepts: ['ess-predictors'],
  },
  {
    id: 'q37', type: 'mcq', section: 'IV. Surgery & Outcomes',
    stem: 'A 5-year-old has CRS refractory to saline irrigation and an intranasal steroid. What is the usual first surgical step?',
    options: [
      { id: 'a', text: 'Full endoscopic sinus surgery with a frontal opening' },
      { id: 'b', text: 'Adenoidectomy, with or without antral irrigation' },
      { id: 'c', text: 'Draf III' },
      { id: 'd', text: 'Inferior turbinate reduction' },
    ],
    correct: 'b',
    brief: 'In young children, adenoidectomy is first; the adenoids act as a bacterial reservoir more than as an obstruction.',
    detailed: `Mechanism: adenoid tissue harbors bacteria and biofilm that seed the sinuses, so removing it can help even without sinus surgery.
Application: add antral irrigation in asthmatic children with high CT scores. FESS is for older children or after failed adenoidectomy, with major complications about 0.6% and minor about 2%. There is no good evidence for oral or intravenous antibiotics or prolonged macrolides. First-line care is saline irrigation and an intranasal steroid (supported by safety and adult data). CRS in a child can signal cystic fibrosis, PCD or primary immunodeficiency, so consider those before surgery.
Pearl: in a child, look for the cause behind the CRS.`,
    concepts: ['peds-crs'],
  },
  {
    id: 'q38', type: 'recall', section: 'V. Fungal & Secondary CRS',
    stem: 'State the Bent–Kuhn major and minor criteria for allergic fungal rhinosinusitis, and its typical imaging.',
    answer: `• Major: nasal polyposis; fungi on staining; eosinophilic mucin without tissue invasion; type I hypersensitivity to fungi; characteristic CT (differential densities, unilateral or discrete sinus involvement).
• Minor: bone erosion, Charcot–Leyden crystals, unilateral disease, peripheral eosinophilia, positive culture, no immunodeficiency or diabetes.
• Imaging: CT shows hyperdense, packed sinuses with expansion and bone erosion; MRI shows signal voids on T1 and T2.`,
    brief: 'Five majors center on polyps, fungi, eosinophilic mucin, IgE to fungi and the CT pattern; the minors are supporting features.',
    detailed: `Application: AFRS is 5–10% of CRS and typically affects young, atopic patients with asthma in warm, humid climates (highest in the southwestern US). Proptosis and visual disturbance can occur. Surgery is the mainstay; oral steroids before and after help; nebulized topical steroids reduce recurrence; immunotherapy may help atopic patients (weak data); oral antifungals may reduce recurrence but not symptoms.
Pearl: eosinophilic mucin without invasion is major; Charcot–Leyden crystals are minor.`,
    concepts: ['afrs'],
  },
  {
    id: 'q39', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'Which finding is a minor, not major, Bent–Kuhn criterion for AFRS?',
    options: [
      { id: 'a', text: 'Eosinophilic mucin without fungal invasion' },
      { id: 'b', text: 'Type I hypersensitivity to fungi' },
      { id: 'c', text: 'Charcot–Leyden crystals' },
      { id: 'd', text: 'Nasal polyposis' },
    ],
    correct: 'c',
    brief: 'Charcot–Leyden crystals are a minor criterion; the other three are major.',
    detailed: `Mechanism: Charcot–Leyden crystals are crystallized eosinophil protein, seen with eosinophilic mucin, but they are supportive rather than defining.
Application: the major criteria are polyposis, fungi on staining, eosinophilic mucin without invasion, type I hypersensitivity and the characteristic CT. The minors are bone erosion, Charcot–Leyden crystals, unilateral disease, eosinophilia, positive culture, and no immunodeficiency or diabetes.
Pearl: minors support the diagnosis; majors define it.`,
    concepts: ['afrs'],
  },
  {
    id: 'q40', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'A 19-year-old atopic asthmatic has bilateral polyps and hyperdense, expanded sinuses with bone erosion on CT, with signal voids on T1 and T2 MRI. What is the mainstay of treatment?',
    options: [
      { id: 'a', text: 'Surgical clearance of the allergic mucin, with perioperative systemic steroids and postoperative topical steroids' },
      { id: 'b', text: 'Long-term oral antifungal as monotherapy' },
      { id: 'c', text: 'Systemic amphotericin B and radical debridement' },
      { id: 'd', text: 'Saline irrigation and observation' },
    ],
    correct: 'a',
    brief: 'Surgery is the mainstay of AFRS; steroids before and after help, and nebulized topical steroids reduce recurrence.',
    detailed: `Mechanism: AFRS is a hypersensitivity reaction to fungi in an immunocompetent host, so the problem is the allergic mucin and inflammation, not tissue invasion.
Application: systemic antifungal therapy and radical debridement belong to invasive disease. Antifungals in CRS in general are recommended against (item q28); in AFRS oral antifungals may reduce recurrence but not symptoms.
Pearl: the host decides: hypersensitivity gives AFRS, an immunocompetent host a fungal ball, and immunosuppression invasive disease.`,
    concepts: ['afrs'],
  },
  {
    id: 'q41', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'Which pairing of host state and sinus fungal disease is correct?',
    options: [
      { id: 'a', text: 'Hypersensitivity: fungal ball. Immunocompetent: invasive disease. Immunosuppressed: AFRS' },
      { id: 'b', text: 'Hypersensitivity: invasive disease. Immunocompetent: AFRS. Immunosuppressed: fungal ball' },
      { id: 'c', text: 'Hypersensitivity: AFRS. Immunocompetent: invasive disease. Immunosuppressed: fungal ball' },
      { id: 'd', text: 'Hypersensitivity: AFRS. Immunocompetent: fungal ball. Immunosuppressed: invasive disease' },
    ],
    correct: 'd',
    brief: 'Fungi are in almost every nose; the host immune state decides the disease.',
    detailed: `Mechanism: AFRS is allergic mucin; a fungal ball is a non-invasive mass (usually maxillary, often after dental work, with common neo-osteogenesis of the sinus wall); invasive disease has hyphae within tissue with angioinvasion, thrombosis and necrosis.
Application: fungal ball is treated by removal through an adequate antrostomy (persistent mucostasis in up to 18%). Invasive disease occurs almost always with immunocompromise.
Pearl: allergic, colonizing, invasive: three states, three treatments.`,
    concepts: ['fungal-spectrum'],
  },
  {
    id: 'q42', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'A neutropenic patient has facial pain. Which imaging finding is the most sensitive for invasive fungal sinusitis?',
    options: [
      { id: 'a', text: 'Bone erosion on CT' },
      { id: 'b', text: 'Loss of mucosal contrast enhancement on MRI' },
      { id: 'c', text: 'Hyperdense sinus contents on CT' },
      { id: 'd', text: 'Air–fluid levels' },
    ],
    correct: 'b',
    brief: 'Loss of contrast enhancement is about 86% sensitive on MRI versus 69% on CT.',
    detailed: `Mechanism: angioinvasion thromboses the mucosal vessels, so the infarcted tissue does not enhance with contrast.
Application: hyperdense contents with expansion suggest AFRS, and bone erosion is a late and non-specific sign. Management is urgent: systemic antifungals, endoscopic debridement of necrotic tissue and reducing immunosuppression where feasible.
Pearl: in the immunocompromised, a non-enhancing mucosa is dead tissue until proven otherwise.`,
    concepts: ['invasive-fungal'],
  },
  {
    id: 'q43', type: 'recall', section: 'V. Fungal & Secondary CRS',
    stem: 'State the three principles of managing invasive fungal sinusitis and the host and organism features.',
    answer: `• Principles: (1) systemic antifungals; (2) endoscopic debridement of necrotic tissue, repeated as needed; (3) reduce immunosuppression where feasible.
• Host: immunocompromise in almost all cases; diabetes in about 50% and hematologic malignancy in about 40%.
• Organisms: Mucorales (Rhizopus, Mucor, Rhizomucor) and Aspergillus.
• Pathology: hyphae within tissue with angioinvasion causing thrombosis, infarction and necrosis.
• Aids: MRI loss of enhancement (86% versus 69% for CT); serum PCR and galactomannan for aspergillosis.`,
    brief: 'Drug, debride, and de-escalate immunosuppression.',
    detailed: `Application: the three principles run together and fast; delay costs tissue.
Pearl: tissue invasion by hyphae is the defining feature.`,
    concepts: ['invasive-fungal'],
  },
  {
    id: 'q44', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'A 9-year-old has bilateral nasal polyps. What is the first investigation?',
    options: [
      { id: 'a', text: 'CT of the sinuses' },
      { id: 'b', text: 'Serum total IgE' },
      { id: 'c', text: 'Sweat chloride test' },
      { id: 'd', text: 'Biopsy of a polyp' },
    ],
    correct: 'c',
    brief: 'Polyps before age 16 should prompt testing for cystic fibrosis; about 20% of patients with CF have polyps.',
    detailed: `Mechanism: the CFTR chloride-channel defect makes secretions more than twice as viscous, and the inflammation is neutrophilic rather than eosinophilic.
Application: confirm with sweat chloride and CFTR genetics. Sinus and lung bacteria are concordant. ESS is recommended when there is no chronic lung infection or after lung transplant to clear gram-negative organisms; topical antibiotics are safe and helpful; CFTR modulators (ivacaftor, tezacaftor) improve rhinologic quality of life.
Pearl: a child with polyps has cystic fibrosis until the sweat test says no.`,
    concepts: ['cf-pcd'],
  },
  {
    id: 'q45', type: 'recall', section: 'V. Fungal & Secondary CRS',
    stem: 'Contrast cystic fibrosis and primary ciliary dyskinesia as causes of CRS: the defect, the test, the inflammation and polyps, and the management.',
    answer: `• CF: CFTR chloride-channel defect, secretions over 2× normal viscosity; neutrophilic inflammation; polyps in about 20%; test with sweat chloride and CFTR genetics; ESS, topical antibiotics, CFTR modulators.
• PCD: mostly autosomal recessive ciliary defect; situs inversus in about 50% (Kartagener), infertility, CRSwNP in 15–30%; test with nasal NO (below 77 nL/min), ciliary electron microscopy (may be normal) and genetics; prolonged macrolides, ESS if medical therapy fails.
• Both: think of them in a child with polyps or CRS.`,
    brief: 'CF is a viscosity and chloride defect tested by sweat chloride; PCD is a motility defect screened by nasal NO.',
    detailed: `Application: the usual PCD organisms are H. influenzae, S. pneumoniae and P. aeruginosa. Nasal NO is the one sharp use of nasal NO (item q21).
Pearl: sweat chloride for CF, nasal NO for PCD.`,
    concepts: ['cf-pcd'],
  },
  {
    id: 'q46', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'A 32-year-old with lifelong allergic rhinitis has polypoid edema of both middle turbinate heads and the posterosuperior septum, with central sinus opacification and sparing of the lateral sinuses. What is the most likely diagnosis?',
    options: [
      { id: 'a', text: 'Central compartment atopic disease' },
      { id: 'b', text: 'AERD' },
      { id: 'c', text: 'Inverted papilloma' },
      { id: 'd', text: 'Non-type 2 CRS' },
    ],
    correct: 'a',
    brief: 'Central compartment polypoid change with long-standing allergy is CCAD, an inhalant-allergy phenotype of type 2 disease.',
    detailed: `Mechanism: CCAD is driven by IgE-mediated inhalant allergy (dust mites, molds, pollens); patients are slightly younger, often with allergic rhinitis since childhood. Allergy testing was positive in about 93% in one series.
Application: skin testing, especially in younger patients; treat the allergy; intranasal steroid; surgery for refractory disease. In the EPOS scheme it is primary, diffuse, type 2. Allergy is strongly linked to CCAD and AFRS and only weakly to CRSwNP and CRSsNP.
Pearl: central compartment polyps point to atopy; pansinus polyps point to the CRSwNP and AERD group.`,
    concepts: ['ccad'],
  },
  {
    id: 'q47', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'A patient has crusting, a septal perforation and a positive c-ANCA/PR3, with no renal or lung disease. Which history must be excluded before diagnosing limited GPA?',
    options: [
      { id: 'a', text: 'Topical decongestant overuse' },
      { id: 'b', text: 'Cigarette smoking' },
      { id: 'c', text: 'Recent COVID-19' },
      { id: 'd', text: 'Intranasal cocaine use' },
    ],
    correct: 'd',
    brief: 'Cocaine can mimic GPA clinically and produce ANCA and PR3 positivity.',
    detailed: `Mechanism: cocaine causes vasoconstrictive necrosis and perforation, and is associated with ANCA formation, so the picture and the serology can both overlap.
Application: GPA presents with ENT symptoms in about two-thirds (crusting 75%, discharge 70%, stuffiness 65%, bleeding 59%, smell loss 52%, pain 33%); c-ANCA/PR3 is positive in up to 95% of active systemic disease. Untreated systemic GPA has a mean survival of about 5 months versus about 21.7 years treated, so the diagnosis must be right.
Pearl: ask about cocaine before inducing immunosuppression.`,
    concepts: ['vasculitis'],
  },
  {
    id: 'q48', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'A patient has severe polyps unresponsive to usual care, adult-onset asthma and blood eosinophils of 2,100/µL. Which diagnosis must be considered?',
    options: [
      { id: 'a', text: 'AERD' },
      { id: 'b', text: 'Eosinophilic granulomatosis with polyangiitis (EGPA)' },
      { id: 'c', text: 'Allergic fungal rhinosinusitis' },
      { id: 'd', text: 'Cystic fibrosis' },
    ],
    correct: 'b',
    brief: 'Adult-onset asthma, severe polyps and blood eosinophils usually above 1,500/µL or 10% point to EGPA, with ANCA in a subset.',
    detailed: `Mechanism: EGPA is an eosinophilic small-vessel vasculitis; the sinonasal phase can look like AERD (a prodromal polyp and asthma phase), so the eosinophil count and systemic features are what separate them.
Application: patients feel systemically ill. Treatment is systemic: prednisolone with cyclophosphamide, azathioprine, mycophenolate or methotrexate. Suspect it in severe polyps not responding to usual care.
Pearl: very high eosinophils plus a new organ symptom is EGPA until proven otherwise.`,
    concepts: ['vasculitis'],
  },
  {
    id: 'q49', type: 'mcq', section: 'V. Fungal & Secondary CRS',
    stem: 'An adult has unilateral obstruction with blood-stained discharge and a unilateral polypoid mass high in the nasal cavity. What should precede biopsy?',
    options: [
      { id: 'a', text: 'An immediate office biopsy, with imaging to follow' },
      { id: 'b', text: 'A 12-week trial of an intranasal steroid' },
      { id: 'c', text: 'Cross-sectional imaging, because a mass that connects to the skull base may be a meningoencephalocele' },
      { id: 'd', text: 'Allergy testing' },
    ],
    correct: 'c',
    brief: 'Image before biopsy of any mass that could connect to the skull base. A unilateral "polyp" may be inverted papilloma, malignancy or a meningo/encephalocele.',
    detailed: `Mechanism: a mass high in the nose or near the cribriform plate can communicate with the intracranial compartment; biopsy of a cephalocele risks CSF leak and meningitis.
Application: the NEJM algorithm sends unilateral polyps, visual change and blood-stained discharge to urgent referral. A boggy, cobblestoned inferior turbinate of allergic rhinitis can be mistaken for a polyp; decongest and scope.
Pearl: unilateral plus blood means image first, then tissue.`,
    concepts: ['unilateral-disease'],
  },
  {
    id: 'q50', type: 'recall', section: 'VI. Biologics in CRSwNP',
    stem: 'List the EPOS 2020 criteria for a biologic in CRSwNP with their cut-offs, the prerequisite, and how many are needed.',
    answer: `• Prerequisite: bilateral polyps after ESS (or a patient unfit for surgery).
• Need at least 3 of 5:
• Type 2 evidence: tissue eosinophils at least 10/hpf, or blood eosinophils at least 250/µL, or total IgE at least 100.
• Systemic steroids: at least 2 courses a year, or more than 3 months of low dose, or contraindicated.
• SNOT-22 of at least 40.
• Anosmia on smell testing.
• Comorbid asthma needing regular inhaled corticosteroids.`,
    brief: 'Bilateral polyps after surgery plus 3 of 5 criteria: type 2 evidence, steroid burden, SNOT-22 of 40, anosmia, asthma.',
    detailed: `Caveat: EPOS 2020 predates the approvals of omalizumab and mepolizumab for CRSwNP (anti-IgE was rated insufficient), and EPOS could not say whether to re-operate on a patient on a biologic before calling it a failure. An EPOS/EUFOREA update was published in 2023, so check it before applying these thresholds to a payer request.
Pearl: three of five, after surgery.`,
    concepts: ['biologic-criteria'],
  },
  {
    id: 'q51', type: 'mcq', section: 'VI. Biologics in CRSwNP',
    stem: 'After ESS: bilateral polyps, blood eosinophils 300/µL, SNOT-22 of 52, one prednisone course this year, normal smell testing and no asthma. By EPOS 2020 criteria:',
    options: [
      { id: 'a', text: 'Not eligible: only 2 of the 5 criteria are met' },
      { id: 'b', text: 'Eligible: 3 criteria are met' },
      { id: 'c', text: 'Eligible: type 2 evidence alone is sufficient' },
      { id: 'd', text: 'Not eligible: surgery must be repeated first' },
    ],
    correct: 'a',
    brief: 'Type 2 evidence and SNOT-22 of at least 40 are 2 criteria; steroid use, anosmia and asthma are absent. Three are required.',
    detailed: `Mechanism: the criteria combine biology (type 2 evidence), burden (steroids, SNOT-22), function (anosmia) and comorbidity (asthma) so that expensive therapy goes to patients with both type 2 disease and a large burden.
Application: one prednisone course does not meet the steroid criterion (at least 2 courses a year, more than 3 months of low dose, or contraindicated). Repeat surgery is not a prerequisite; the prerequisite is prior ESS (or being unfit for surgery).
Pearl: count them, do not weigh them.`,
    concepts: ['biologic-criteria'],
  },
  {
    id: 'q52', type: 'mcq', section: 'VI. Biologics in CRSwNP',
    stem: 'When does EPOS 2020 advise evaluating the response to a biologic in CRSwNP?',
    options: [
      { id: 'a', text: 'At 4 weeks and 6 months' },
      { id: 'b', text: 'At 6 months only' },
      { id: 'c', text: 'At 2 years' },
      { id: 'd', text: 'At 16 weeks and at 1 year, on five domains' },
    ],
    correct: 'd',
    brief: 'Judge response at 16 weeks and 1 year on polyp size, systemic steroid need, quality of life, smell and comorbidities; stop if none improves.',
    detailed: `Mechanism: the five domains together capture whether the drug is working across the nose and the airway.
Application: 5 domains improved is excellent, 3–4 moderate, 1–2 poor, 0 none (discontinue). A poor response should prompt consideration of switching target (item q53).
Pearl: 16 weeks and 1 year.`,
    concepts: ['biologic-response'],
  },
  {
    id: 'q53', type: 'mcq', section: 'VI. Biologics in CRSwNP',
    stem: 'At 16 weeks of a biologic, a patient has smaller polyps and needs fewer oral steroids, but smell, quality of life and comorbidities are unchanged. How is this graded and what follows?',
    options: [
      { id: 'a', text: 'Moderate response (2 of 5): continue and reassess' },
      { id: 'b', text: 'Poor response (2 of 5): consider switching target' },
      { id: 'c', text: 'Excellent response: continue' },
      { id: 'd', text: 'No response: discontinue' },
    ],
    correct: 'b',
    brief: 'Two of five domains improved is a poor response; consider another target rather than stopping outright.',
    detailed: `Mechanism: the grading counts improved domains. Polyp size and steroid need improved; smell, quality of life and comorbidity impact did not.
Application: grading is 5 excellent, 3–4 moderate (continue and reassess), 1–2 poor (consider switching), 0 none (discontinue).
Pearl: a poor responder is not a non-responder.`,
    concepts: ['biologic-response'],
  },
  {
    id: 'q54', type: 'mcq', section: 'Synthesis Cases',
    stem: 'A 6-year-old has had 4 days of rhinorrhea and now has a fever of 39.1 °C, left upper and lower lid swelling and erythema, proptosis, chemosis and pain on abduction. Acuity and color vision are normal. Contrast CT shows left ethmoid opacification and a 12-mm medial subperiosteal collection with no intraconal extension. What is the diagnosis?',
    options: [
      { id: 'a', text: 'Orbital cellulitis without abscess (Chandler stage 2)' },
      { id: 'b', text: 'Preseptal cellulitis (Chandler stage 1)' },
      { id: 'c', text: 'Subperiosteal abscess (Chandler stage 3)' },
      { id: 'd', text: 'Intraconal orbital abscess (Chandler stage 4)' },
    ],
    correct: 'c',
    brief: 'Proptosis, painful abduction and a collection between the lamina papyracea and periorbita is a subperiosteal abscess.',
    detailed: `Mechanism: ethmoid infection crosses the lamina papyracea to lift the periorbita; the collection is medial, outside the muscle cone.
Application: proptosis and painful movement exclude preseptal disease; the drainable collection excludes cellulitis alone; absence of intraconal extension excludes stage 4.
Pearl: contrast CT is what separates stage 2 from stage 3.`,
    concepts: ['case-orbital', 'chandler'],
  },
  {
    id: 'q55', type: 'mcq', section: 'Synthesis Cases',
    stem: '(Same patient.) Acuity and color vision remain normal on intravenous antibiotics. What is the best management of the 12-mm abscess?',
    options: [
      { id: 'a', text: 'Continue intravenous antibiotics and drain the abscess surgically' },
      { id: 'b', text: 'Intravenous antibiotics alone for 48 hours, draining only if vision falls' },
      { id: 'c', text: 'Oral antibiotics at home with outpatient review' },
      { id: 'd', text: 'MRI of the brain before any other decision' },
    ],
    correct: 'a',
    brief: 'A subperiosteal or intraorbital abscess on imaging is an EPOS indication for surgery; small collections are a possible exception.',
    detailed: `Mechanism: undrained pus keeps raising orbital pressure and can progress within 24–48 hours.
Application: a 12-mm collection is not small, so the exception does not apply, and waiting for vision to fall waits for the harm. MRI is for suspected intracranial spread, which is not suggested here. Oral antibiotics at home are for resolving, afebrile disease.
Pearl: drain the abscess; do not wait for the optic nerve to tell you.`,
    concepts: ['case-orbital', 'orbital-management'],
  },
  {
    id: 'q56', type: 'mcq', section: 'Synthesis Cases',
    stem: '(Same patient.) After drainage he is afebrile for 48 hours and proptosis and chemosis are resolving. What is appropriate?',
    options: [
      { id: 'a', text: 'Stop all antibiotics now' },
      { id: 'b', text: 'Continue intravenous antibiotics until the collection has gone on repeat CT' },
      { id: 'c', text: 'Add a 5-day course of systemic steroids' },
      { id: 'd', text: 'Switch to oral antibiotics with continued ophthalmology review' },
    ],
    correct: 'd',
    brief: 'After 48 hours afebrile with resolving signs, step down to oral antibiotics and keep monitoring vision.',
    detailed: `Mechanism: clinical response, not imaging resolution, guides step-down.
Application: keep checking acuity and color vision, since color vision is the earliest sign of deterioration. Systemic steroids add nothing to the plan.
Pearl: step down on clinical response, not on repeat CT.`,
    concepts: ['case-orbital', 'orbital-management'],
  },
  {
    id: 'q57', type: 'mcq', section: 'Synthesis Cases',
    stem: 'A 45-year-old man with bilateral polyps had ESS 3 years ago. Now: anosmia on smell testing, adult-onset asthma on a daily inhaled corticosteroid, SNOT-22 of 56, two oral steroid courses in the past year despite 12 weeks of intranasal steroid spray, and tissue eosinophils of 25/hpf. Which statement about EPOS 2020 biologic eligibility is correct?',
    options: [
      { id: 'a', text: 'He is not eligible until a second ESS is performed' },
      { id: 'b', text: 'He meets the prerequisite and all five criteria, so he is eligible' },
      { id: 'c', text: 'He is eligible only after a further trial of oral steroids' },
      { id: 'd', text: 'He is not eligible because SNOT-22 must be 60 or more' },
    ],
    correct: 'b',
    brief: 'Bilateral polyps after ESS plus type 2 evidence, steroid burden, SNOT-22 above 40, anosmia and asthma on ICS: five of five.',
    detailed: `Mechanism: each criterion is met: tissue eosinophils of 25/hpf (type 2 evidence), 2 steroid courses in a year, SNOT-22 of 56, anosmia, and asthma needing regular inhaled corticosteroid. Prior ESS satisfies the prerequisite.
Application: EPOS requires prior surgery, not repeat surgery, and a further steroid trial is not a criterion. Check the EPOS/EUFOREA 2023 update before a payer request.
Pearl: three of five suffice; he has five.`,
    concepts: ['case-biologic', 'biologic-criteria'],
  },
  {
    id: 'q58', type: 'mcq', section: 'Synthesis Cases',
    stem: '(Same patient.) At 16 weeks on a biologic his polyps are smaller, he has needed no oral steroids and his SNOT-22 is 24, but his smell and asthma control are unchanged. How is the response graded and what follows?',
    options: [
      { id: 'a', text: 'Excellent response (5 of 5): continue' },
      { id: 'b', text: 'Poor response (1 of 5): switch target' },
      { id: 'c', text: 'Moderate response (3 of 5): continue and reassess' },
      { id: 'd', text: 'No response: discontinue' },
    ],
    correct: 'c',
    brief: 'Polyp size, steroid need and quality of life improved; smell and comorbidity did not. Three of five is a moderate response.',
    detailed: `Mechanism: grade by counting improved domains: 5 excellent, 3–4 moderate, 1–2 poor, 0 none.
Application: a moderate response continues, with reassessment at 1 year. Unchanged smell in a patient who was anosmic is common to follow; it does not by itself mandate a change.
Pearl: grade at 16 weeks and again at 1 year.`,
    concepts: ['case-biologic', 'biologic-response'],
  },
  {
    id: 'q59', type: 'mcq', section: 'Synthesis Cases',
    stem: '(Same patient.) His blood eosinophils are 2,100/µL and he develops numbness and weakness in one foot. Which diagnosis must be excluded, and what does it change?',
    options: [
      { id: 'a', text: 'EGPA: it needs systemic immunosuppression, such as prednisolone with cyclophosphamide or azathioprine, not polyp-directed therapy alone' },
      { id: 'b', text: 'AERD: start aspirin desensitization' },
      { id: 'c', text: 'AFRS: start oral antifungal therapy' },
      { id: 'd', text: 'Cystic fibrosis: arrange a sweat chloride test' },
    ],
    correct: 'a',
    brief: 'Eosinophils above 1,500/µL with a new mononeuropathy in a patient with polyps and asthma is EGPA until proven otherwise.',
    detailed: `Mechanism: EGPA is an eosinophilic small-vessel vasculitis; the prodromal polyp and asthma phase resembles AERD, but organ involvement (a mononeuritis) marks vasculitis.
Application: evaluate with ANCA (positive in a subset), an organ screen and specialist input. Cystic fibrosis is a childhood diagnosis, and AFRS does not cause a neuropathy.
Pearl: a systemic symptom in a "polyp patient" reopens the diagnosis.`,
    concepts: ['case-biologic', 'vasculitis'],
  },
  {
    id: 'q60', type: 'mcq', section: 'Synthesis Cases',
    stem: 'A 28-year-old with allergic rhinitis since childhood has 6 months of obstruction and reduced smell. Endoscopy shows polypoid change of both middle turbinate heads and the posterosuperior septum; CT shows central sinus opacification with the lateral sinuses spared. Skin testing is positive to house dust mite. What is the working diagnosis?',
    options: [
      { id: 'a', text: 'Allergic fungal rhinosinusitis' },
      { id: 'b', text: 'Inverted papilloma' },
      { id: 'c', text: 'Primary diffuse non-type 2 CRS' },
      { id: 'd', text: 'Central compartment atopic disease' },
    ],
    correct: 'd',
    brief: 'Central compartment polypoid change, lateral sparing and an inhalant allergy is CCAD.',
    detailed: `Mechanism: IgE-mediated inhalant allergy drives edema and polypoid change in the central compartment, where the airflow and allergen deposition are highest.
Application: AFRS shows hyperdense, expanded sinuses with allergic mucin; an inverted papilloma is unilateral; non-type 2 disease has purulence and normal IgE.
Pearl: central compartment plus atopy equals CCAD.`,
    concepts: ['case-ccad', 'ccad'],
  },
  {
    id: 'q61', type: 'mcq', section: 'Synthesis Cases',
    stem: '(Same patient.) His Lund–Mackay score is 6, he has used an intranasal steroid spray for 10 weeks, has had no systemic steroid, and post-treatment SNOT-22 is 28. By RAND/UCLA criteria, is ESS appropriate yet?',
    options: [
      { id: 'a', text: 'Yes: all four criteria are met' },
      { id: 'b', text: 'Not yet: the short systemic steroid course required for CRSwNP has not been given' },
      { id: 'c', text: 'Not yet: the Lund–Mackay score must be at least 8' },
      { id: 'd', text: 'Not yet: the intranasal steroid must be given for 6 months' },
    ],
    correct: 'b',
    brief: 'Three of four criteria are met. The systemic steroid criterion for CRSwNP is missing, so surgery is not yet an appropriate option.',
    detailed: `Mechanism: the criteria are cumulative. Lund–Mackay of at least 1 (6), 8 weeks of topical steroid (10 weeks) and SNOT-22 of at least 20 (28) are satisfied.
Application: the naive answer is yes, because he is symptomatic with a positive CT. The missing piece is the second medical agent.
Pearl: count all four before booking.`,
    concepts: ['case-ccad', 'ess-criteria'],
  },
  {
    id: 'q62', type: 'mcq', section: 'Synthesis Cases',
    stem: '(Same patient.) What is the most useful next step?',
    options: [
      { id: 'a', text: 'Proceed to full FESS with a Draf III' },
      { id: 'b', text: 'Start a biologic' },
      { id: 'c', text: 'Add a short oral steroid course and treat the allergy (testing-directed avoidance or immunotherapy), then reassess for surgery' },
      { id: 'd', text: 'Start long-term macrolide therapy' },
    ],
    correct: 'c',
    brief: 'Complete the medical trial and treat the underlying allergy; surgery is for refractory disease.',
    detailed: `Mechanism: in CCAD the allergy drives the polypoid change, so treating it is treating the disease.
Application: a biologic needs prior ESS (or unfitness for surgery) and 3 of 5 criteria, which he does not meet. Macrolides belong to the non-type 2 pathway. Surgery follows if he is still symptomatic after the full medical trial.
Pearl: treat the allergy, complete the trial, then decide.`,
    concepts: ['case-ccad', 'ccad'],
  },
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
