/* =================================================================
   Allergy and Allergy Testing
   OKSAT · Rhinology / Allergy Module
   Free-response module: every item is type 'recall' — read the
   prompt, commit to an answer, reveal, then self-grade.
   ================================================================= */
const meta = {
  id: 'allergy-testing',
  title: 'Allergy &\nAllergy Testing',
  subtitle: 'A self-test on the mediator cascade, skin and in vitro testing, pharmacotherapy and immunotherapy, and the OHNS allergy crossovers — AFRS, AERD, angioedema, and food syndromes.',
  kicker: 'Self-Test · Rhinology / Allergy',
};

const DOMAINS = {
  immunology: { label: 'Immunology & Mediators', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
  testing: { label: 'Testing', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
  treatment: { label: 'Treatment & Immunotherapy', color: '#A0635E', hex: 'rgba(160,99,94,0.14)' },
  crossovers: { label: 'OHNS Crossovers', color: '#5C4F7B', hex: 'rgba(92,79,123,0.14)' },
  controversies: { label: 'Contested Ground', color: '#7B5C3A', hex: 'rgba(123,92,58,0.14)' },
  numbers: { label: 'Numbers to Have Cold', color: '#7B7B4A', hex: 'rgba(123,123,74,0.14)' },
};

const CONCEPTS = {
  'hypersensitivity-types': { label: 'Gell & Coombs Types', domain: 'immunology' },
  'ige-sensitization': { label: 'Sensitization & Elicitation', domain: 'immunology' },
  'allergen-biology': { label: 'Allergen Protease Biology', domain: 'immunology' },
  'epithelial-alarmins': { label: 'Epithelial Alarmins & ILC2', domain: 'immunology' },
  'ige-synthesis': { label: 'IgE Class Switching & Receptors', domain: 'immunology' },
  'mast-cell-signaling': { label: 'Mast Cell Signal Transduction', domain: 'immunology' },
  'mast-cell-mediators': { label: 'Mast Cell Mediators & Histamine Receptors', domain: 'immunology' },
  'late-phase-response': { label: 'Early/Late Phase & Priming', domain: 'immunology' },
  'eosinophil-biology': { label: 'Eosinophil Biology', domain: 'immunology' },
  'tryptase': { label: 'Tryptase Kinetics', domain: 'immunology' },
  'non-ige-mechanisms': { label: 'Non-IgE Mast Cell Activation', domain: 'immunology' },
  'unified-airway': { label: 'Unified Airway & Atopic March', domain: 'immunology' },
  'crswnp-endotype': { label: 'CRSwNP Phenotype/Endotype', domain: 'immunology' },
  'immunotherapy-mechanism': { label: 'Immunotherapy Tolerance Mechanisms', domain: 'immunology' },
  'bradykinin-pathway': { label: 'Bradykinin Pathway', domain: 'immunology' },

  'pretest-probability': { label: 'Pretest Probability & Sensitization', domain: 'testing' },
  'skin-prick-testing': { label: 'Skin Prick Technique & Controls', domain: 'testing' },
  'intradermal-testing': { label: 'Intradermal Testing', domain: 'testing' },
  'skin-endpoint-titration': { label: 'Skin Endpoint Titration', domain: 'testing' },
  'modified-quantitative-testing': { label: 'Modified Quantitative Testing', domain: 'testing' },
  'in-vitro-testing': { label: 'In Vitro Specific IgE', domain: 'testing' },
  'medication-hold': { label: 'Medication Hold Intervals', domain: 'testing' },
  'component-resolved-diagnostics': { label: 'Component-Resolved Diagnostics', domain: 'testing' },
  'local-allergic-rhinitis': { label: 'Local Allergic Rhinitis', domain: 'testing' },
  'basophil-activation-test': { label: 'Basophil Activation Test', domain: 'testing' },
  'patch-testing': { label: 'Patch Testing', domain: 'testing' },
  'food-challenge': { label: 'Food Allergy Diagnosis', domain: 'testing' },
  'penicillin-allergy': { label: 'Penicillin & Cephalosporin Allergy', domain: 'testing' },
  'local-anesthetic-allergy': { label: 'Local Anesthetic Allergy', domain: 'testing' },

  'pharmacotherapy': { label: 'AR Pharmacotherapy', domain: 'treatment' },
  'environmental-control': { label: 'Environmental Control Evidence', domain: 'treatment' },
  'immunotherapy-indications': { label: 'Immunotherapy Indications', domain: 'treatment' },
  'scit-protocol': { label: 'SCIT Schedule & Dose Adjustment', domain: 'treatment' },
  'systemic-reaction-grading': { label: 'Systemic Reactions & Contraindications', domain: 'treatment' },
  'slit-tablets': { label: 'SLIT Tablets', domain: 'treatment' },
  'scit-vs-slit': { label: 'SCIT vs SLIT & Asthma Prevention', domain: 'treatment' },
  'biologics': { label: 'Biologics', domain: 'treatment' },
  'anaphylaxis-management': { label: 'Anaphylaxis Management', domain: 'treatment' },

  'afrs': { label: 'Allergic Fungal Rhinosinusitis', domain: 'crossovers' },
  'aerd': { label: 'AERD', domain: 'crossovers' },
  'angioedema-mechanisms': { label: 'Angioedema Mechanisms', domain: 'crossovers' },
  'ome-allergy': { label: 'Allergy & OME', domain: 'crossovers' },
  'latex-allergy': { label: 'Latex Allergy', domain: 'crossovers' },
  'food-syndromes': { label: 'Food-Allergy Syndromes', domain: 'crossovers' },
  'csu': { label: 'Chronic Spontaneous Urticaria', domain: 'crossovers' },
  'nonallergic-rhinitis': { label: 'Nonallergic Rhinitis & Surgery', domain: 'crossovers' },
  'aria-classification': { label: 'ARIA Classification', domain: 'crossovers' },
  'immunotherapy-extracts': { label: 'Standardized Extracts & Vial Mixing', domain: 'crossovers' },

  'controversies-and-traps': { label: 'Controversies & Methodological Traps', domain: 'controversies' },

  'rapid-recall-numbers': { label: 'Numbers to Have Cold', domain: 'numbers' },
};

const ITEMS = [
  // ═══════════ I. IMMUNOLOGY AND THE MEDIATOR CASCADE ═══════════
  {
    id: 'q1', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Name the four Gell and Coombs hypersensitivity types with the effector arm and one OHNS example of each.',
    answer: `Type I — IgE/mast cell (allergic rhinitis, anaphylaxis).
Type II — cytotoxic IgG/IgM against fixed antigen (autoimmune inner ear disease, pemphigus vulgaris).
Type III — immune complex (GPA, serum sickness).
Type IV — T-cell delayed (contact dermatitis to neomycin drops, nickel from tracheostomy hardware, patch-test reactions).`,
    brief: 'Types II and III are antibody-mediated but not IgE — the single most-tested trick in allergy question banks. Type IV has no antibody at all and peaks at 48–72 h.',
    concepts: ['hypersensitivity-types'],
  },
  {
    id: 'q2', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Type I disease requires two separate events. Name them and give the time scale of each.',
    answer: 'Sensitization (first exposure, days to weeks, no symptoms), then elicitation (re-exposure, minutes). Sensitization produces allergen-specific IgE that arms mast cells; elicitation cross-links it.',
    brief: 'This is why a first bee sting is silent and the second is dangerous, and why a patient can have a positive skin test with no clinical disease. Sensitization is a laboratory state; allergy is a clinical one.',
    concepts: ['ige-sensitization'],
  },
  {
    id: 'q3', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Why is protease activity a property of many major aeroallergens?',
    answer: 'Proteases cleave epithelial tight junctions, letting allergen reach dendritic cells and provoking epithelial alarmin release. Der p 1 (house dust mite) is a cysteine protease that cleaves occludin and claudin-1.',
    brief: 'Der p 1 also cleaves CD23 and CD25, removing negative feedback on IgE synthesis and blunting the Th1 arm. Allergenicity is partly a function of enzymatic mischief, not just molecular shape.',
    concepts: ['allergen-biology'],
  },
  {
    id: 'q4', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Which three epithelial cytokines drive type 2 inflammation independent of IgE, and which cell do they activate?',
    answer: 'TSLP, IL-25, and IL-33 (the alarmins), acting on ILC2 (group 2 innate lymphoid cells), which pour out IL-5 and IL-13 without any antigen receptor.',
    brief: 'This axis explains why CRSwNP patients can have florid type 2 inflammation with negative allergy testing. It is also why tezepelumab (anti-TSLP) works at the top of the cascade rather than downstream of it.',
    concepts: ['epithelial-alarmins'],
  },
  {
    id: 'q5', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'What two signals drive B-cell class switching to IgE?',
    answer: 'IL-4 or IL-13 signaling through STAT6, plus CD40–CD40L costimulation from the T cell.',
    brief: 'IL-4 and IL-13 share the IL-4Rα chain, which is why dupilumab (anti-IL-4Rα) blocks both. Loss-of-function STAT6 or IL-4Rα variants track with reduced atopy; gain-of-function with more.',
    concepts: ['ige-synthesis'],
  },
  {
    id: 'q6', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Distinguish FcεRI from FcεRII in structure, affinity, and cell distribution.',
    answer: 'FcεRI is high-affinity, tetrameric (αβγ2) on mast cells and basophils, trimeric (αγ2) on dendritic cells and monocytes. FcεRII (CD23) is low-affinity, on B cells, and regulates IgE synthesis.',
    brief: 'Degranulation requires cross-linking of at least two adjacent IgE molecules, so a monovalent hapten cannot trigger it. Free IgE upregulates FcεRI density; omalizumab lowers free IgE, which downregulates receptor expression over weeks — the delayed onset of its benefit.',
    concepts: ['ige-synthesis'],
  },
  {
    id: 'q7', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Following cross-linking, what is the proximal signaling sequence to degranulation?',
    answer: 'Lyn and Fyn phosphorylate ITAMs, Syk is recruited, LAT is phosphorylated, PLCγ generates IP3 and DAG, and store-operated Ca2+ influx triggers granule fusion.',
    brief: 'Calcium influx is the non-negotiable final step — the pharmacologic target of cromolyn and nedocromil (imprecisely called mast cell stabilizers), whose clinical effect is modest and whose real limitation is QID dosing.',
    concepts: ['mast-cell-signaling'],
  },
  {
    id: 'q8', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Separate preformed from newly synthesized mast cell mediators.',
    answer: `Preformed: histamine, tryptase, chymase, carboxypeptidase A3, heparin, TNF-α.
Newly synthesized (minutes, from arachidonate): PGD2, cysteinyl leukotrienes LTC4/D4/E4, PAF.`,
    brief: 'Cysteinyl leukotrienes are roughly a thousand times more potent than histamine at producing bronchoconstriction and vascular permeability. PGD2 signals through DP1 and CRTH2 (DP2) and is the dominant mast cell prostanoid in AERD.',
    concepts: ['mast-cell-mediators'],
  },
  {
    id: 'q9', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Map the four histamine receptors to function.',
    answer: `H1 (Gq): pruritus, sneeze via sensory nerve firing, vasodilation, vascular permeability, smooth muscle contraction.
H2 (Gs): gastric acid, vasodilation, cardiac chronotropy.
H3: presynaptic CNS autoreceptor.
H4 (Gi): chemotaxis of eosinophils, mast cells, dendritic cells.`,
    brief: 'H1 blockade abolishes sneeze, itch, and rhinorrhea but barely touches congestion, because congestion is a late-phase, leukotriene- and cytokine-driven venous sinusoid event. That single fact drives the entire pharmacotherapy hierarchy.',
    concepts: ['mast-cell-mediators'],
  },
  {
    id: 'q10', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Contrast the early and late phase nasal response.',
    answer: `Early (5–30 min): sneezing, itch, clear rhinorrhea, some congestion, from histamine, tryptase, and leukotrienes.
Late (4–12 h): congestion predominates, with an infiltrate of eosinophils, basophils, and Th2 cells recruited by IL-5, eotaxin, and adhesion molecule upregulation.`,
    brief: 'Roughly half of allergic patients mount a measurable late phase. Late-phase inflammation is what topical corticosteroids suppress and what antihistamines do not.',
    concepts: ['late-phase-response'],
  },
  {
    id: 'q11', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Define the priming effect and its clinical consequence.',
    answer: 'Repeated allergen exposure across a season lowers the allergen dose required to trigger symptoms (Connell, 1968). Late in the season a patient reacts to a fraction of the pollen count that was tolerated in week one.',
    brief: 'Priming plus non-specific nasal hyperreactivity explains why late-season patients also react to cold air, smoke, and perfume. It is also the pharmacologic argument for starting INCS and SLIT tablets weeks before the season rather than at symptom onset.',
    concepts: ['late-phase-response'],
  },
  {
    id: 'q12', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Which eosinophil granule proteins cause tissue injury, and what recruits the cell?',
    answer: 'MBP, ECP, EPO, and EDN cause epithelial desquamation and hyperreactivity. Recruitment is via IL-5 (maturation and survival) plus eotaxins acting on CCR3 (chemotaxis).',
    brief: 'IL-5 governs the eosinophil’s life span, which is why mepolizumab (anti-IL-5) and benralizumab (anti-IL-5Rα, which depletes eosinophils by ADCC) produce near-total blood eosinophil clearance. Serum ECP has never earned a routine clinical role.',
    concepts: ['eosinophil-biology'],
  },
  {
    id: 'q13', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'How is serum tryptase used, and what is the correct sampling protocol?',
    answer: 'Draw an acute total tryptase 15 min to 3 h after symptom onset, then a baseline ≥24 h after resolution. Half-life is about 2 h. Acute elevation is meaningful if it exceeds (1.2 × baseline) + 2 ng/mL.',
    brief: 'A single tryptase without a baseline is nearly uninterpretable. Persistently elevated baseline (>11.4 ng/mL) should prompt evaluation for systemic mastocytosis or hereditary alpha tryptasemia (TPSAB1 copy-number gain). Tryptase is frequently normal in food-induced anaphylaxis, so a normal value never excludes the diagnosis.',
    concepts: ['tryptase'],
  },
  {
    id: 'q14', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Give three mechanisms of mast cell degranulation that do not involve IgE.',
    answer: 'Complement anaphylatoxins C3a and C5a; MRGPRX2 ligation; direct physical or osmotic triggers (hyperosmolar radiocontrast, cold, pressure).',
    brief: 'MRGPRX2 is the receptor behind vancomycin flushing, fluoroquinolone reactions, neuromuscular blocker reactions, and opioid-induced pruritus. Clinically these are indistinguishable from anaphylaxis and get the same epinephrine, but skin testing and IgE assays will be negative. "Anaphylactoid" is a mechanistic label, not a severity label.',
    concepts: ['non-ige-mechanisms'],
  },
  {
    id: 'q15', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'State the unified airway hypothesis and the epidemiologic evidence for it.',
    answer: 'Upper and lower airway are one inflamed organ with shared epithelium and shared type 2 biology. Roughly 40–50% of AR patients have asthma; 80%+ of asthmatics have rhinitis.',
    brief: 'Treating AR improves asthma control and reduces asthma-related ED visits in observational data. The claim that this reflects one disease rather than two correlated ones rests largely on cross-sectional association, and confounding by shared atopic predisposition is not fully excluded.',
    concepts: ['unified-airway'],
  },
  {
    id: 'q16', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'What is the atopic march, and what has the LEAP trial done to the underlying model?',
    answer: 'The march is the sequence atopic dermatitis → food allergy → allergic rhinitis → asthma, often beginning with filaggrin-deficient barrier failure. LEAP (Du Toit, NEJM 2015) showed early peanut introduction in high-risk infants cut peanut allergy by roughly 80%, reversing a decade of avoidance guidance.',
    brief: 'The mechanistic reading is dual-allergen exposure: cutaneous exposure through inflamed skin sensitizes, oral exposure tolerizes. Guidelines flipped from avoidance to early introduction on the strength of one well-designed RCT — worth noting as an instance of how thin the prior evidence base had been.',
    concepts: ['unified-airway'],
  },
  {
    id: 'q17', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Distinguish phenotype from endotype in CRSwNP.',
    answer: 'Phenotype is the observable presentation (polyps, eosinophilia, comorbid asthma). Endotype is the molecular mechanism (type 2 versus type 1 versus type 3 inflammation), defined by tissue cytokine and cellular profiling.',
    brief: 'Endotype, not phenotype, predicts biologic response. Western CRSwNP is predominantly type 2 and eosinophilic; East Asian CRSwNP has historically shown a higher neutrophilic/type 1 and type 3 fraction, though that gap is narrowing. Endotyping is not yet a routine clinical assay.',
    concepts: ['crswnp-endotype'],
  },
  {
    id: 'q18', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Which two mechanisms explain how allergen immunotherapy induces tolerance?',
    answer: 'Induction of allergen-specific Foxp3+ Tregs secreting IL-10 and TGF-β, and class switching to IgG4 blocking antibody that intercepts allergen before it reaches mast cell-bound IgE.',
    brief: 'Specific IgE paradoxically rises in the first months of immunotherapy before declining over years, so a rising sIgE early in treatment is expected and not a failure signal. The IgG4:IgE ratio tracks better with clinical response than either alone.',
    concepts: ['immunotherapy-mechanism'],
  },
  {
    id: 'q19', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'Why can a patient have anaphylaxis on a normal serum IgE and a negative panel?',
    answer: 'Because effector reactivity depends on allergen-specific, mast cell-bound IgE, not circulating total IgE. Non-IgE routes bypass IgE entirely.',
    brief: 'Total IgE is a poor screen in both directions. It is elevated in helminth infection, ABPA (classically >1000 IU/mL), atopic dermatitis, hyper-IgE syndrome, and some lymphomas. Its main legitimate use is dosing omalizumab.',
    concepts: ['ige-sensitization', 'non-ige-mechanisms'],
  },
  {
    id: 'q20', type: 'recall', section: 'I. Immunology & Mediator Cascade',
    stem: 'What is the bradykinin pathway, and why should an otolaryngologist care?',
    answer: 'Factor XIIa activates plasma kallikrein, which cleaves high-molecular-weight kininogen to bradykinin, acting on the B2 receptor to produce vascular permeability. C1-inhibitor normally restrains factor XIIa and kallikrein.',
    brief: 'This pathway produces angioedema with no urticaria, no pruritus, and no response to epinephrine, antihistamines, or corticosteroids. It is the mechanism of hereditary angioedema and ACE-inhibitor angioedema, and it is the airway emergency that gets mismanaged as "allergic."',
    concepts: ['bradykinin-pathway'],
  },

  // ═══════════ II. TESTING ═══════════
  {
    id: 'q21', type: 'recall', section: 'II. Testing',
    stem: 'What does a positive allergy test actually establish?',
    answer: 'Sensitization only. Clinical allergy requires sensitization plus a matching exposure history plus symptoms in the right temporal pattern.',
    brief: 'Population sensitization rates run 40–50%, while symptomatic AR runs 15–30%. Any test ordered without a pretest hypothesis is being run in a low-prevalence setting, where even a specific test yields mostly false positives — the single most consequential Bayesian point in allergy, and why shotgun panels generate unnecessary elimination diets and unnecessary immunotherapy.',
    concepts: ['pretest-probability'],
  },
  {
    id: 'q22', type: 'recall', section: 'II. Testing',
    stem: 'Describe skin prick technique and the criterion for a positive result.',
    answer: 'Volar forearm or back, glycerinated extract applied and punctured with a lancet, read at 15–20 min. Positive is a wheal ≥3 mm greater than the negative control.',
    brief: 'Sites must be ≥2 cm apart to avoid axon-reflex overlap. Wheal size correlates with the probability of clinical reactivity, not with the severity of a future reaction — never counsel a patient that a big wheal means a dangerous reaction.',
    concepts: ['skin-prick-testing'],
  },
  {
    id: 'q23', type: 'recall', section: 'II. Testing',
    stem: 'What are the positive and negative controls, and what does a reactive negative control tell you?',
    answer: 'Positive control is histamine; negative control is the diluent (typically 50% glycerin or phenolated saline). A wheal at the negative control site means dermatographism, invalidating the panel.',
    brief: 'An absent histamine response means antihistamine effect, chronic topical steroid at the site, or attenuated skin reactivity (infancy, advanced age, omalizumab). Read the controls before reading anything else; every result is interpreted relative to them.',
    concepts: ['skin-prick-testing'],
  },
  {
    id: 'q24', type: 'recall', section: 'II. Testing',
    stem: 'Compare intradermal to prick testing on sensitivity, specificity, and risk.',
    answer: 'Intradermal is roughly 100–1000× more sensitive but less specific, with more irritant false positives and a higher systemic reaction rate. Volume is 0.01–0.02 mL raising a 4 mm bleb.',
    brief: 'Prick always precedes intradermal. A patient with a strongly positive prick should not receive an intradermal to the same antigen: it adds nothing and adds risk. Intradermal testing to foods is contraindicated for that reason.',
    concepts: ['intradermal-testing'],
  },
  {
    id: 'q25', type: 'recall', section: 'II. Testing',
    stem: 'In skin endpoint titration, how are the dilutions constructed and numbered?',
    answer: 'Fivefold serial dilutions from concentrate. Bottle #1 = 1:100 w/v (concentrate 1:20 w/v diluted fivefold), then #2 = 1:500, #3 = 1:2,500, #4 = 1:12,500, #5 = 1:62,500, #6 = 1:312,500.',
    brief: 'Higher number means more dilute. Testing begins at a weak dilution (#6 or #5) and moves stronger — the safety logic of the whole method.',
    concepts: ['skin-endpoint-titration'],
  },
  {
    id: 'q26', type: 'recall', section: 'II. Testing',
    stem: 'Define the endpoint precisely, including the confirmatory criterion.',
    answer: 'The most dilute concentration producing a 7 mm wheal at 10 min, confirmed by the next stronger fivefold dilution producing a wheal ≥2 mm larger (progressive whealing).',
    brief: 'The 4 mm bleb grows to about 5 mm at 10 min in a negative response, so 7 mm is the threshold. The confirmatory step exists because a single 7 mm wheal can be irritant or traumatic; a dose-responsive sequence cannot. Without progressive whealing, you do not have an endpoint.',
    concepts: ['skin-endpoint-titration'],
  },
  {
    id: 'q27', type: 'recall', section: 'II. Testing',
    stem: 'What is the endpoint used for, beyond diagnosis?',
    answer: 'It is the safe starting dose for immunotherapy, obtained directly rather than by protocol guess.',
    brief: 'This is the historical argument for otolaryngic titration over prick-only testing: a quantitative endpoint per antigen. With multiple antigens in one treatment vial, the additive effect requires starting one dilution weaker than the strongest single endpoint.',
    concepts: ['skin-endpoint-titration'],
  },
  {
    id: 'q28', type: 'recall', section: 'II. Testing',
    stem: 'What is modified quantitative testing (MQT) and what problem does it solve?',
    answer: 'A prick screen followed by a single intradermal at dilution #2 for negative or equivocal pricks, with the endpoint extrapolated from prick wheal size. It compresses full titration from dozens of injections into a manageable number.',
    brief: 'MQT trades some precision for time, cost, and systemic risk. The trade is defensible clinically, but the endpoint is being estimated by regression, not measured, and the studies validating that regression are small and largely single-center.',
    concepts: ['modified-quantitative-testing'],
  },
  {
    id: 'q29', type: 'recall', section: 'II. Testing',
    stem: 'Name five situations where in vitro specific IgE is preferable to skin testing.',
    answer: 'Dermatographism, extensive eczema or skin disease at test sites, inability to stop antihistamines, prior severe systemic reaction or unstable asthma, and beta-blocker therapy. Add: uncooperative patient, pregnancy.',
    brief: 'In vitro testing carries zero patient risk, is unaffected by medications and skin condition, and is quantitative. It costs more, takes days, and is modestly less sensitive for some pollens.',
    concepts: ['in-vitro-testing'],
  },
  {
    id: 'q30', type: 'recall', section: 'II. Testing',
    stem: 'What assay platform replaced RAST, and how are results expressed?',
    answer: 'Fluorescent enzyme immunoassay (ImmunoCAP), reported in kU/L and binned into classes 0–6.',
    brief: '"RAST" is radioallergosorbent and is obsolete; using the term in 2026 dates you. Concordance with skin testing for standardized aeroallergens is roughly 85–90%.',
    concepts: ['in-vitro-testing'],
  },
  {
    id: 'q31', type: 'recall', section: 'II. Testing',
    stem: 'List the medication hold intervals before skin testing.',
    answer: 'Second-generation antihistamines 5–7 days; first-generation 3 days; hydroxyzine 5–10 days; TCAs including doxepin 7–14 days; topical corticosteroid at the test site 2–3 weeks; H2 blockers 1–2 days (minor). Omalizumab suppresses reactivity for months.',
    brief: 'Two high-yield negatives: systemic corticosteroids do NOT suppress immediate skin testing at usual doses and duration (they do suppress patch and delayed testing), and montelukast does not require holding. Mirtazapine and quetiapine have potent H1 activity and are commonly missed.',
    concepts: ['medication-hold'],
  },
  {
    id: 'q32', type: 'recall', section: 'II. Testing',
    stem: 'Why do beta-blockers matter for allergy testing and immunotherapy?',
    answer: 'They do not increase reaction frequency much but make anaphylaxis refractory to epinephrine by blocking the β-receptor it acts on.',
    brief: 'Rescue is glucagon 1–5 mg IV over 5 min, which raises cAMP through a receptor epinephrine does not need. ACE inhibitors are separately associated with more severe reactions (impaired bradykinin degradation and blunted compensatory angiotensin response).',
    concepts: ['medication-hold'],
  },
  {
    id: 'q33', type: 'recall', section: 'II. Testing',
    stem: 'What is component-resolved diagnostics, and give a worked peanut example.',
    answer: 'Measurement of IgE to individual allergenic proteins rather than whole extract. In peanut, Ara h 2 (2S albumin storage protein) predicts systemic reaction; Ara h 8 (PR-10, birch homolog) predicts oral symptoms only.',
    brief: 'Whole-peanut IgE cannot distinguish these two patients, and they get opposite counseling. Other high-yield components: Bet v 1 (birch PR-10), Bet v 2 (profilin panallergen), Pru p 3 (peach nsLTP, systemic risk, Mediterranean), omega-5 gliadin (wheat-dependent exercise-induced anaphylaxis).',
    concepts: ['component-resolved-diagnostics'],
  },
  {
    id: 'q34', type: 'recall', section: 'II. Testing',
    stem: 'What are CCDs and why do they matter?',
    answer: 'Cross-reactive carbohydrate determinants: plant and insect glycans that bind IgE broadly with little clinical significance, producing multiple weak-positive in vitro results.',
    brief: 'A patient positive to everything on a panel at class 1–2 should raise CCD suspicion. Component testing to protein epitopes resolves it. This is a laboratory artifact that has generated a lot of unnecessary avoidance.',
    concepts: ['component-resolved-diagnostics'],
  },
  {
    id: 'q35', type: 'recall', section: 'II. Testing',
    stem: 'How is local allergic rhinitis diagnosed, and why does it matter?',
    answer: 'Negative skin testing and negative serum sIgE with a positive nasal allergen provocation test, with or without nasal sIgE in lavage. It matters because these patients are otherwise labeled nonallergic and denied immunotherapy.',
    brief: 'Rondón’s Spanish cohorts put LAR at roughly a quarter of patients previously classified as nonallergic, with responsiveness to immunotherapy in small RCTs. Whether LAR is a distinct entity or the tail of systemic testing insensitivity is not settled, and prevalence estimates outside Spain and Italy are notably lower.',
    concepts: ['local-allergic-rhinitis'],
  },
  {
    id: 'q36', type: 'recall', section: 'II. Testing',
    stem: 'What is measured during nasal provocation testing?',
    answer: 'Symptom scores (VAS or TNSS) plus an objective airflow measure: peak nasal inspiratory flow, rhinomanometry, or acoustic rhinometry.',
    brief: 'NAPT is the diagnostic standard for LAR and the research standard for immunotherapy efficacy. It is labor-intensive, unstandardized between centers, and essentially unavailable outside academic practice in the US.',
    concepts: ['local-allergic-rhinitis'],
  },
  {
    id: 'q37', type: 'recall', section: 'II. Testing',
    stem: 'What does a basophil activation test measure?',
    answer: 'Upregulation of CD63 and CD203c on basophils after ex vivo allergen exposure, quantified by flow cytometry.',
    brief: 'Functional rather than binding-based, so it distinguishes sensitization from reactivity better than sIgE. Used in drug and food allergy research and in Europe clinically. Requires fresh blood and rapid processing; non-responder basophils occur in about 10%.',
    concepts: ['basophil-activation-test'],
  },
  {
    id: 'q38', type: 'recall', section: 'II. Testing',
    stem: 'When is patch testing used, and when is it read?',
    answer: 'For Type IV contact hypersensitivity, read at 48 h and again at 72–96 h.',
    brief: 'The delayed second read distinguishes true allergic reactions (crescendo) from irritant reactions (decrescendo). Relevant in otology for neomycin, benzalkonium, and propylene glycol in topical otic drops, and for nickel and thiuram in the perioperative setting. Never use patch testing for aeroallergens.',
    concepts: ['patch-testing'],
  },
  {
    id: 'q39', type: 'recall', section: 'II. Testing',
    stem: 'What is the gold standard for food allergy diagnosis, and what is the failure mode of panels?',
    answer: 'Double-blind placebo-controlled oral food challenge. Panels ordered without history yield sensitizations with poor positive predictive value, producing needless elimination diets and nutritional harm in children.',
    brief: 'Sampson’s 95% PPV thresholds (roughly egg ≥7, milk ≥15, peanut ≥14 kU/L) apply to pretested populations with a compatible history and do not transfer to unselected screening. The predictive value of any of these numbers collapses as prevalence falls.',
    concepts: ['food-challenge'],
  },
  {
    id: 'q40', type: 'recall', section: 'II. Testing',
    stem: 'How is penicillin allergy evaluated, and what is the yield?',
    answer: 'Skin test with Pre-Pen (benzylpenicilloyl polylysine, the major determinant) plus penicillin G and often amoxicillin, followed by graded oral amoxicillin challenge. NPV of the combined protocol is roughly 97–99%.',
    brief: 'Around 90–95% of patients labeled penicillin-allergic are not, and the label is associated with more vancomycin and clindamycin use, more C. difficile, more MRSA, and longer stays. De-labeling is a legitimate perioperative quality target.',
    concepts: ['penicillin-allergy'],
  },
  {
    id: 'q41', type: 'recall', section: 'II. Testing',
    stem: 'What governs cephalosporin cross-reactivity, and which cephalosporin is the OHNS-relevant exception?',
    answer: 'The R1 side chain, not the beta-lactam ring. Overall cross-reactivity is roughly 1–2%. Cefazolin has a unique side chain shared with no penicillin, so it is generally safe in penicillin-allergic patients.',
    brief: 'The old "10% cross-reactivity" figure came from 1960s cephalosporins contaminated with penicillin during manufacture. It survives in institutional lore and in some order sets, and it is wrong.',
    concepts: ['penicillin-allergy'],
  },
  {
    id: 'q42', type: 'recall', section: 'II. Testing',
    stem: 'A patient reacts to lidocaine. What is the actual likelihood of true IgE-mediated local anesthetic allergy?',
    answer: 'Under 1%. Most events are vasovagal, epinephrine-related tachycardia, or reactions to methylparaben or metabisulfite preservatives.',
    brief: 'Esters (procaine, benzocaine, tetracaine, chloroprocaine) metabolize to PABA and are the more allergenic class. Amides have two letters "i" in the generic name (lidocaine, bupivacaine, mepivacaine, prilocaine, ropivacaine) and cross-react poorly with esters. Evaluation is graded subcutaneous challenge with preservative-free amide.',
    concepts: ['local-anesthetic-allergy'],
  },

  // ═══════════ III. TREATMENT AND IMMUNOTHERAPY ═══════════
  {
    id: 'q43', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Rank pharmacotherapy for allergic rhinitis by efficacy, and justify the top of the list mechanistically.',
    answer: 'Intranasal corticosteroid is the most effective monotherapy, including for congestion, because it suppresses late-phase cellular inflammation. INCS + intranasal antihistamine combination beats either alone. Oral second-generation antihistamine next, then LTRA.',
    brief: 'Antihistamines fail on congestion because congestion is a late-phase, leukotriene- and cytokine-driven event. Montelukast is inferior to INCS and carries a 2020 boxed warning for neuropsychiatric events, so it is now a second- or third-line agent rather than a routine add-on. Intranasal ipratropium 0.03% treats rhinorrhea alone.',
    concepts: ['pharmacotherapy'],
  },
  {
    id: 'q44', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'What is the correct INCS spray technique and why?',
    answer: 'Cross-hand, aiming laterally toward the ipsilateral lateral canthus, away from the septum, without sniffing hard.',
    brief: 'Aiming at the septum causes the epistaxis that is the commonest adverse effect and, rarely, septal perforation. Mometasone and fluticasone furoate have systemic bioavailability under 1%. Growth-velocity effects in children are small and largely offset by adherence-limited real-world dosing.',
    concepts: ['pharmacotherapy'],
  },
  {
    id: 'q45', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'How long can a topical decongestant be used, and what happens beyond that?',
    answer: 'Three to five days. Beyond that, rhinitis medicamentosa: rebound vasodilation with tachyphylaxis and mucosal changes.',
    brief: 'Treatment is cessation with INCS cover, sometimes a short oral steroid taper. Oral phenylephrine, by contrast, has now failed multiple efficacy analyses at OTC doses (FDA advisory committee, 2023) because of near-complete first-pass metabolism.',
    concepts: ['pharmacotherapy'],
  },
  {
    id: 'q46', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'What is the evidence status of environmental control?',
    answer: 'Single interventions fail; multifaceted interventions work. Mite-impermeable bedding encasings alone showed no benefit in adult asthma (Woodcock, NEJM 2003). Multi-component intervention reduced symptom days in the Inner-City Asthma Study (Morgan, NEJM 2004).',
    brief: 'This is a clean lesson in why component RCTs and bundled RCTs answer different questions. Complete allergen removal (rehoming a cat) works; partial reduction generally does not, because dose-response for allergen exposure is steep near zero and flat elsewhere.',
    concepts: ['environmental-control'],
  },
  {
    id: 'q47', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'What are the indications for allergen immunotherapy?',
    answer: 'Symptoms inadequately controlled by avoidance and pharmacotherapy, unacceptable medication burden or side effects, patient preference for disease modification, comorbid asthma, and documented specific IgE matching the clinical history.',
    brief: 'The last clause is the one that gets skipped. Immunotherapy directed at sensitizations without a matching history exposes a patient to years of injections and systemic reaction risk for a symptom they never had.',
    concepts: ['immunotherapy-indications'],
  },
  {
    id: 'q48', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Describe the SCIT schedule and effective maintenance dose.',
    answer: 'Weekly build-up over roughly 3–6 months from dilute vials to maintenance, then every 2–4 weeks for 3–5 years. Effective maintenance is 5–20 µg of major allergen per injection.',
    brief: 'Reference doses: Amb a 1 roughly 6–12 µg, Fel d 1 roughly 15 µg, Der p 1 roughly 7–12 µg. Underdosing is the commonest cause of apparent immunotherapy failure, and it is invisible unless extracts are standardized.',
    concepts: ['scit-protocol'],
  },
  {
    id: 'q49', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Name the situations requiring dose reduction during SCIT.',
    answer: 'Starting a new vial (lot-to-lot potency variation), missed doses beyond the protocol window, peak season for the relevant allergen, and after any systemic reaction.',
    brief: 'Extracts lose potency with time and dilution, so a fresh vial of the same nominal concentration can be substantially more potent than the depleted one it replaces. Dosing errors and new-vial transitions account for a large share of reported systemic reactions.',
    concepts: ['scit-protocol'],
  },
  {
    id: 'q50', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'What is the observation period after an injection, and what is the leading risk factor for a fatal reaction?',
    answer: '30 minutes in a facility with epinephrine and personnel trained to use it. Uncontrolled or severe asthma is the leading identifiable risk factor for fatality.',
    brief: 'Most fatal reactions begin within that window. Checking peak flow or FEV1 before injecting asthmatic patients, and holding for symptomatic obstruction, is standard. Historic fatality estimates ran about 1 per 2–2.5 million injections; recent AAAAI/ACAAI surveillance is lower.',
    concepts: ['scit-protocol'],
  },
  {
    id: 'q51', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'How are systemic reactions graded?',
    answer: 'WAO grades 1–5, from single-organ-system cutaneous or upper respiratory symptoms (grade 1) through lower respiratory or cardiovascular involvement (grades 2–3), to hypoxia/hypotension with neurologic compromise (grade 4) and death (grade 5).',
    brief: 'Large local reactions are graded separately and do NOT predict subsequent systemic reactions well enough to justify routine dose adjustment or premedication.',
    concepts: ['systemic-reaction-grading'],
  },
  {
    id: 'q52', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'List the contraindications and relative cautions for immunotherapy.',
    answer: `Absolute: severe uncontrolled asthma, prior life-threatening reaction to immunotherapy.
Relative: beta-blockers, significant cardiovascular disease, active autoimmune disease or malignancy, inability to communicate symptoms, age under 5.`,
    brief: 'Pregnancy is the classic nuance: do not initiate, but continue at maintenance without dose escalation if already established and tolerating well.',
    concepts: ['systemic-reaction-grading'],
  },
  {
    id: 'q53', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Which SLIT products are FDA-approved in the US, and how are they started?',
    answer: 'Four tablets: Oralair (5-grass), Grastek (timothy), Ragwitek (short ragweed), Odactra (house dust mite). First dose in the office with 30 min observation, epinephrine autoinjector prescribed, seasonal products started roughly 12–16 weeks before the season.',
    brief: 'All carry a boxed warning for severe allergic reactions. Each covers a single allergen family, which is the practical limitation in polysensitized patients. Palforzia is oral (swallowed) peanut immunotherapy, not sublingual — the distinction is a common item stem.',
    concepts: ['slit-tablets'],
  },
  {
    id: 'q54', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'What are the adverse effects and contraindications specific to SLIT tablets?',
    answer: 'Local oropharyngeal pruritus, ear itch, throat irritation, tongue edema, mostly in the first 1–2 weeks and self-limited. Contraindications include eosinophilic esophagitis, severe uncontrolled asthma, and prior severe systemic reaction to immunotherapy.',
    brief: 'Hold dosing during oral ulceration, dental extraction, or oral surgery, since a breached mucosa changes absorption. No SLIT fatality has been reported, which is the central safety argument for the route.',
    concepts: ['slit-tablets'],
  },
  {
    id: 'q55', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Compare SCIT and SLIT on efficacy, safety, breadth, and adherence.',
    answer: 'Comparable efficacy for a single allergen; SCIT is better for polysensitized patients because vials can be compounded; SLIT is safer; SLIT adherence is worse because it is daily, self-administered, and unsupervised.',
    brief: 'Aqueous SLIT drops are widely used in US otolaryngic allergy practice but remain off-label, without FDA-approved dosing or standardized potency for that route. That is a regulatory fact, not an efficacy judgment, and it should be disclosed in consent.',
    concepts: ['scit-vs-slit'],
  },
  {
    id: 'q56', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Does immunotherapy prevent asthma? State the evidence on both sides.',
    answer: 'The PAT study (3 years of grass/birch SCIT in children) showed reduced asthma development persisting at 7 and 10 years. The GAP trial (grass SLIT tablet) improved asthma symptoms and medication use but missed its primary endpoint of time to asthma onset.',
    brief: 'PAT was open-label and modest in size; GAP was larger and blinded. The honest summary is that disease modification is well supported for rhinitis symptoms and only suggestively supported for asthma prevention. Marketing materials routinely overstate this.',
    concepts: ['scit-vs-slit'],
  },
  {
    id: 'q57', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Match each biologic to its target and its CRSwNP status.',
    answer: `Omalizumab — anti-IgE (approved CRSwNP; also asthma, CSU, IgE-mediated food allergy).
Dupilumab — anti-IL-4Rα, blocking IL-4 and IL-13 (approved).
Mepolizumab — anti-IL-5 (approved).
Tezepelumab — anti-TSLP (approved for CRSwNP October 2025, 210 mg SC q4 weeks, age ≥12).`,
    brief: 'Tezepelumab’s WAYPOINT data (NEJM 2025) showed roughly a 92% relative reduction in need for polyp surgery or systemic corticosteroid. Benralizumab (anti-IL-5Rα) has asthma and EGPA indications but did not achieve CRSwNP approval.',
    concepts: ['biologics'],
  },
  {
    id: 'q58', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'How is omalizumab dosed, and what is its boxed warning?',
    answer: 'By body weight and baseline total IgE (label range roughly 30–1500 IU/mL depending on indication), SC every 2 or 4 weeks. Boxed warning for anaphylaxis, incidence roughly 0.1–0.2%.',
    brief: 'Draw total IgE before the first dose; the assay becomes uninterpretable afterward because omalizumab–IgE complexes are detected. It suppresses skin test reactivity for months, so do any needed testing first.',
    concepts: ['biologics'],
  },
  {
    id: 'q59', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'What is the correct treatment of anaphylaxis, in order?',
    answer: 'IM epinephrine 0.01 mg/kg of 1 mg/mL (1:1000), max 0.5 mg adult, into the anterolateral thigh, repeated every 5–15 min as needed. Then position supine with legs elevated, oxygen, large-volume IV crystalloid. Antihistamines and corticosteroids are adjuncts and treat nothing life-threatening.',
    brief: 'There is no absolute contraindication to epinephrine in anaphylaxis. Refractory cases go to an IV epinephrine infusion; beta-blocked patients get glucagon. Biphasic reactions occur in roughly 1–20% of cases, supporting 4–6 h observation with longer observation after severe or refractory presentations.',
    concepts: ['anaphylaxis-management'],
  },
  {
    id: 'q60', type: 'recall', section: 'III. Treatment & Immunotherapy',
    stem: 'Which agents most often cause perioperative anaphylaxis, and how does that change your tryptase timing?',
    answer: 'Neuromuscular blocking agents lead, followed by antibiotics (cefazolin, vancomycin), chlorhexidine, latex, and sugammadex. Draw acute tryptase within 15 min–3 h of the event and a baseline ≥24 h later.',
    brief: 'Chlorhexidine is systematically underdiagnosed because it is on drapes, catheters, and skin prep rather than on the anesthesia record. Perioperative events are more often true IgE-mediated than most drug reactions, so referral for testing has genuine yield.',
    concepts: ['anaphylaxis-management'],
  },

  // ═══════════ IV. OHNS CROSSOVERS ═══════════
  {
    id: 'q61', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'State the Bent and Kuhn criteria for allergic fungal rhinosinusitis.',
    answer: 'All five: (1) Type I hypersensitivity to fungi, (2) nasal polyposis, (3) characteristic CT (heterogeneous hyperattenuating material in expanded sinuses), (4) eosinophilic mucin without tissue invasion, (5) positive fungal stain.',
    brief: 'Organisms are usually dematiaceous (Bipolaris, Curvularia, Alternaria). Patients are immunocompetent, which is the whole distinction from invasive fungal sinusitis. Treatment is complete surgical removal of eosinophilic mucin plus long-term topical corticosteroid plus allergy management.',
    concepts: ['afrs'],
  },
  {
    id: 'q62', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Distinguish AFRS from eosinophilic mucin rhinosinusitis (EMRS).',
    answer: 'EMRS lacks fungal-specific IgE and usually lacks a positive fungal stain. It tends to be bilateral, systemic, more often associated with asthma and aspirin sensitivity; AFRS is more often unilateral or asymmetric in younger atopic patients.',
    brief: 'The clinical implication is that the immunologic target differs: AFRS has a demonstrable allergen, EMRS does not. Whether they are two diseases or one spectrum with variable fungal detection sensitivity remains unresolved.',
    concepts: ['afrs'],
  },
  {
    id: 'q63', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Explain the mechanism of AERD.',
    answer: 'COX-1 inhibition removes PGE2 braking on 5-lipoxygenase, shunting arachidonate to cysteinyl leukotrienes. Patients have baseline LTC4 synthase overexpression and CysLT1 receptor upregulation, plus mast cell PGD2 excess.',
    brief: 'It is NOT IgE-mediated, so skin testing to aspirin is meaningless and the term "aspirin allergy" is a misnomer. All COX-1 inhibitors cross-react; selective COX-2 inhibitors are generally tolerated. Prevalence is roughly 7% of asthmatics and around 10% of CRSwNP.',
    concepts: ['aerd'],
  },
  {
    id: 'q64', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'How is aspirin desensitization performed and what does it achieve?',
    answer: 'Graded oral aspirin challenge under monitored conditions until reaction and then through it, followed by maintenance 650 mg twice daily (some protocols 325 mg BID). It reduces polyp recurrence, revision surgery, and systemic steroid requirement.',
    brief: 'Perform after complete polyp clearance, typically 2–4 weeks post-FESS. Contraindications: pregnancy, bleeding diathesis, peptic ulcer disease, FEV1 below roughly 70%. Benefit is lost within days of stopping. Dupilumab is the non-desensitization alternative and has largely displaced desensitization in patients who can access it.',
    concepts: ['aerd'],
  },
  {
    id: 'q65', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'A patient presents with isolated tongue and lip swelling, no urticaria, no pruritus, no response to epinephrine and diphenhydramine. What is the mechanism and the first lab?',
    answer: 'Bradykinin-mediated angioedema. First screen is C4 (low in most hereditary angioedema, during and between attacks).',
    brief: 'The absence of urticaria is the discriminating sign. Histaminergic angioedema almost always brings hives or pruritus. Failure to respond to epinephrine is confirmatory, though epinephrine should still be given once when the diagnosis is uncertain.',
    concepts: ['angioedema-mechanisms'],
  },
  {
    id: 'q66', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Classify hereditary angioedema and give the distinguishing lab in each.',
    answer: `Type I (85%): low C1-INH antigenic level and function.
Type II (15%): normal or high level, low function.
HAE with normal C1-INH: normal level and function, mutations in factor XII, plasminogen, angiopoietin-1, or kininogen.`,
    brief: 'C1q separates hereditary from acquired C1-INH deficiency: normal in hereditary, low in acquired, where the underlying driver is usually a lymphoproliferative disorder or anti-C1-INH autoantibody. Acquired disease presents in later adulthood without family history.',
    concepts: ['angioedema-mechanisms'],
  },
  {
    id: 'q67', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'What is the acute treatment of a laryngeal HAE attack, and what does not work?',
    answer: 'Icatibant (B2 receptor antagonist), ecallantide (kallikrein inhibitor), or C1-INH concentrate (plasma-derived or recombinant). Fresh frozen plasma only if none of these is available. Epinephrine, antihistamines, and corticosteroids do NOT work.',
    brief: 'Roughly half of HAE patients have a laryngeal attack in their lifetime, and untreated laryngeal attacks historically carried high mortality. Secure the airway early rather than watching. Prophylaxis options include lanadelumab, berotralstat, and C1-INH; oral on-demand kallikrein inhibition (sebetralstat) has entered the market, so verify current labeling.',
    concepts: ['angioedema-mechanisms'],
  },
  {
    id: 'q68', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'How does ACE-inhibitor angioedema differ, and what is the disposition?',
    answer: 'Same bradykinin mechanism from impaired kinin degradation, but acquired and drug-dependent. Onset can be days to years after starting the drug. Discontinue permanently; do not rechallenge.',
    brief: 'Incidence roughly 0.1–0.7%, with a several-fold higher rate in Black patients. ARB substitution carries a small but real risk and should be a considered decision. Icatibant for ACE-I angioedema was positive in one RCT (Baş, NEJM 2015) and negative in subsequent larger trials, so its use here is not established.',
    concepts: ['angioedema-mechanisms'],
  },
  {
    id: 'q69', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'What is the relationship between allergy and otitis media with effusion?',
    answer: 'Consistent cross-sectional association with biological plausibility (eustachian tube mucosa is respiratory epithelium capable of a local type 2 response), but causality is unproven and guidelines do not recommend routine allergy testing for OME.',
    brief: 'Reasonable practice is to evaluate allergy in recurrent or refractory OME, particularly with other atopic disease. The interventional evidence that treating allergy resolves effusion is weak and largely uncontrolled, which is the honest thing to tell parents.',
    concepts: ['ome-allergy'],
  },
  {
    id: 'q70', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Distinguish the two immunologic forms of latex reaction and name the cross-reactive foods.',
    answer: 'Type I to Hev b latex proteins (urticaria to anaphylaxis) versus Type IV contact dermatitis to accelerators (thiurams, carbamates). Latex-fruit syndrome: banana, avocado, kiwi, chestnut (shared chitinases).',
    brief: 'Highest-risk groups are spina bifida patients, those with multiple early surgeries, and healthcare workers. Powdered gloves were the main aerosolization vector, and their withdrawal has substantially reduced incidence.',
    concepts: ['latex-allergy'],
  },
  {
    id: 'q71', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Describe pollen-food allergy syndrome and the exceptions to its benign course.',
    answer: 'Oropharyngeal pruritus and tingling from PR-10 and profilin panallergens cross-reacting with pollen: birch (Bet v 1) with apple, cherry, peach, carrot, hazelnut; ragweed with melon and banana. Proteins are heat- and digestion-labile, so cooked forms are tolerated.',
    brief: 'Systemic reactions occur in under about 2%. Exceptions with genuine systemic risk: celery, soy (Gly m 4), and nsLTP-driven reactions (Pru p 3), which are heat-stable and behave like true food allergy rather than PFAS.',
    concepts: ['food-syndromes'],
  },
  {
    id: 'q72', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'A patient develops urticaria and hypotension 4 hours after a steak dinner. Diagnosis?',
    answer: 'Alpha-gal syndrome: IgE to galactose-α-1,3-galactose, acquired after Lone Star tick (Amblyomma americanum) bite, causing delayed reactions 3–6 h after mammalian meat.',
    brief: 'The delay defeats standard history-taking, and these patients are routinely misdiagnosed as idiopathic anaphylaxis for years. The same epitope explains cetuximab first-infusion reactions in the southeastern US. Diagnosis is serum alpha-gal IgE.',
    concepts: ['food-syndromes'],
  },
  {
    id: 'q73', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Why is skin testing not indicated in chronic spontaneous urticaria?',
    answer: 'Because CSU is not allergen-driven. A substantial fraction is autoimmune, with autoantibodies against FcεRIα or IgE.',
    brief: 'Management is second-generation antihistamine, titrated up to fourfold the standard dose, then omalizumab, then cyclosporine. Testing for foods and aeroallergens in CSU generates false positives and delays effective treatment.',
    concepts: ['csu'],
  },
  {
    id: 'q74', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Enumerate the nonallergic rhinitis subtypes an otolaryngologist must exclude.',
    answer: 'NARES (nasal eosinophils >20%, negative testing), nonallergic rhinopathy/vasomotor, drug-induced (ACE-I, alpha-blockers, PDE5 inhibitors, cocaine, oral contraceptives), hormonal (pregnancy rhinitis, third trimester), gustatory, atrophic, and CSF rhinorrhea.',
    brief: 'Test unilateral clear rhinorrhea for beta-2 transferrin before anything else. Primary atrophic rhinitis (ozena, Klebsiella ozaenae) is distinct from secondary atrophic rhinitis and empty nose syndrome after aggressive turbinate reduction.',
    concepts: ['nonallergic-rhinitis'],
  },
  {
    id: 'q75', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Why does untreated allergic rhinitis matter before septoplasty or turbinate reduction?',
    answer: 'Because mucosal inflammation, not structure, may be generating the obstruction. Operating on an untreated allergic nose produces disappointed patients and drives revision requests.',
    brief: 'Medical optimization first is both a diagnostic maneuver and a consent point. Aggressive turbinate resection in an allergic patient carries the added risk of the atrophic/empty-nose end of the spectrum.',
    concepts: ['nonallergic-rhinitis'],
  },
  {
    id: 'q76', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'What is the ARIA classification, and how does it differ from the older scheme?',
    answer: 'Two axes: duration (intermittent <4 days/week or <4 consecutive weeks; persistent otherwise) and severity (mild versus moderate-severe based on sleep, daily activity, work/school, troublesome symptoms).',
    brief: 'It replaced seasonal/perennial because that scheme failed in patients with multiple pollen seasons or perennial allergens with seasonal peaks, and because it carried no severity information to guide therapy.',
    concepts: ['aria-classification'],
  },
  {
    id: 'q77', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Which allergens are available as standardized extracts, and why does that matter for immunotherapy?',
    answer: 'Cat (Fel d 1, BAU/mL), house dust mite (AU/mL), short ragweed (Amb a 1 units), and several grasses (BAU/mL). Everything else, including most tree and weed pollens, molds, and epithelia, is nonstandardized (w/v or PNU).',
    brief: 'Nonstandardized extracts have lot-to-lot potency variation that makes target maintenance dosing an estimate. This is one reason immunotherapy efficacy data are cleanest for grass, ragweed, mite, and cat.',
    concepts: ['immunotherapy-extracts'],
  },
  {
    id: 'q78', type: 'recall', section: 'IV. OHNS Crossovers',
    stem: 'Which extracts should not be mixed in a treatment vial, and why?',
    answer: 'Keep high-protease extracts (molds, insects, some epithelia) separate from pollens, because their proteases degrade pollen allergens over the life of the vial.',
    brief: 'Mixing also dilutes each component, so a multi-antigen vial risks delivering subtherapeutic doses of everything. Polysensitized patients are where SCIT retains a genuine advantage over single-allergen SLIT tablets, provided the compounding is done correctly.',
    concepts: ['immunotherapy-extracts'],
  },

  // ═══════════ V. CONTESTED GROUND ═══════════
  {
    id: 'q79', type: 'recall', section: 'V. Contested Ground',
    stem: 'Name three live controversies in otolaryngic allergy and state each side fairly.',
    answer: `1. Endpoint titration versus prick plus in vitro. Otolaryngic allergy holds that SET yields a quantitative, per-antigen starting dose and better sensitivity. Allergy-immunology holds that prick plus specific IgE achieves equivalent diagnostic accuracy with fewer injections, less time, and less risk, and that the endpoint-as-starting-dose claim rests on small, old, single-specialty studies. No adequately powered head-to-head trial with clinical endpoints exists.

2. SLIT drops in the US. Proponents cite the European evidence base, safety, and pediatric acceptability. Critics note that European evidence is for standardized products at defined doses, that US aqueous drop dosing is extrapolated rather than validated, and that off-label use without approved potency standards makes the exposure unverifiable. Both are correct about different things.

3. Antifungals and fungal immunotherapy in AFRS. Topical and systemic antifungals have repeatedly underperformed in RCTs despite mechanistic appeal, and immunotherapy to the causative fungus has small positive series and no convincing trial. Surgery plus topical steroid remains the backbone by default rather than by demonstration.`,
    brief: 'Two more worth holding: whether local allergic rhinitis is an entity or an artifact of systemic testing insensitivity, and whether AIT prevents asthma.',
    concepts: ['controversies-and-traps'],
  },
  {
    id: 'q80', type: 'recall', section: 'V. Contested Ground',
    stem: 'Name four recurring methodological traps in the allergy literature.',
    answer: `1. Sensitization/allergy conflation. Prevalence estimates and "allergy" outcomes frequently use test positivity as the outcome variable, inflating effect sizes and prevalence alike.

2. Prevalence-dependent predictive value. Sensitivity and specificity are transported across populations; PPV and NPV are not. A panel validated in a referral clinic performs badly in primary care.

3. Placebo effects in rhinitis trials. Symptom-score placebo response in AR trials commonly runs 30–50%, so unblinded and open-label studies are close to uninformative. SCIT is difficult to blind convincingly because injections cause local reactions.

4. Surrogate endpoint substitution. IgG4 rise, wheal reduction, and nasal provocation thresholds are mechanism markers. They are routinely reported as if they were symptom outcomes.`,
    brief: 'Add composite endpoints in biologic trials (polyp score plus congestion score), where a large effect on one component can carry the composite.',
    concepts: ['controversies-and-traps'],
  },

  // ═══════════ VI. NUMBERS TO HAVE COLD ═══════════
  {
    id: 'q81', type: 'recall', section: 'VI. Numbers to Have Cold',
    stem: 'Recite the skin-testing threshold numbers.',
    answer: `SPT positive: wheal ≥3 mm over negative control, read 15–20 min.
Intradermal: volume 0.01–0.02 mL, 4 mm bleb, endpoint wheal 7 mm at 10 min, confirmatory growth ≥2 mm.
SET dilution: #1 = 1:100 w/v, each step 5-fold, #6 = 1:312,500.
MQT: single intradermal at #2.`,
    brief: 'These thresholds are the operational definitions behind every testing question in this module — know them cold rather than reasoning them out on the fly.',
    concepts: ['rapid-recall-numbers'],
  },
  {
    id: 'q82', type: 'recall', section: 'VI. Numbers to Have Cold',
    stem: 'Recite the drug and timing numbers for anaphylaxis and immunotherapy.',
    answer: `Epinephrine: 0.01 mg/kg IM, max 0.5 mg, 1 mg/mL, anterolateral thigh, repeat q5–15 min.
Glucagon: 1–5 mg IV for beta-blockade.
Tryptase: acute 15 min–3 h, baseline ≥24 h, half-life ~2 h, significant if >(1.2 × baseline) + 2.
Post-injection observation: 30 min. Anaphylaxis observation: 4–6 h.
AIT maintenance: 5–20 µg major allergen, duration 3–5 years.
Aspirin desensitization maintenance: 650 mg BID.
Tezepelumab: 210 mg SC q4 weeks.`,
    brief: 'These numbers gate the emergency and dosing questions across the module — the acute epinephrine dose and the tryptase sampling window are the two most commonly missed on exam.',
    concepts: ['rapid-recall-numbers'],
  },
  {
    id: 'q83', type: 'recall', section: 'VI. Numbers to Have Cold',
    stem: 'Recite the medication hold intervals before skin testing.',
    answer: `Second-generation antihistamine: 5–7 d.
First-generation: 3 d.
Hydroxyzine: 5–10 d.
TCA/doxepin: 7–14 d.
H2 blocker: 1–2 d.
Topical steroid at site: 2–3 weeks.
Omalizumab: months.
Systemic corticosteroid and montelukast: no hold.`,
    brief: 'The two traps: systemic steroids do NOT need to be held for immediate skin testing, and montelukast never needs holding at all.',
    concepts: ['rapid-recall-numbers'],
  },
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
