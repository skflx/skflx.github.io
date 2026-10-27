/* =============================================================
   Allergic rhinitis: definition, classification, mimics
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 2
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'allergic-rhinitis',
    title: 'Allergic rhinitis: definition, classification, mimics',
    kicker: '2 · Clinical entity',
    lede: 'The diagnosis is clinical, the classification is about time and impact, and the differential is long. Most errors come from treating sensitization as disease.',
    src: 'ICAR §V, VII–IX, XII',
    tldr: [
        'AR = **IgE-mediated type 1 hypersensitivity** of the nasal mucosa in a sensitized person: rhinorrhea, congestion, itch, sneezing.',
        'ARIA: **intermittent** (<4 days/week *or* <4 consecutive weeks) vs **persistent** (>4 days/week *and* ≥4 weeks); **mild** vs **moderate–severe** (any of sleep, daily activity, school/work, troublesome).',
        'Intermittent ≠ seasonal. Persistent ≠ perennial.',
        'Sensitization is not allergy. A positive test must match exposure and symptoms.',
        'Prevalence 5–50% worldwide; highest in children; rare before age 2.',
    ],
    sections: [
        {
            id: 'ar-1',
            n: '2.1',
            title: 'Classification',
            blocks: [
                {
                    t: 'table',
                    head: ['Axis', 'Category', 'Definition'],
                    rows: [
                        [
                            { x: '**Traditional**', rs: 2 },
                            'Seasonal',
                            'Outdoor allergens (pollens) during high-count seasons',
                        ],
                        [
                            'Perennial',
                            'Indoor allergens (HDM, insects, animal dander); molds can be either',
                        ],
                        [
                            { x: '**ARIA duration**', rs: 2 },
                            'Intermittent',
                            'Symptoms <4 days/week **or** <4 consecutive weeks',
                        ],
                        ['Persistent', 'Symptoms >4 days/week **and** ≥4 consecutive weeks'],
                        [
                            { x: '**ARIA severity**', rs: 2 },
                            'Mild',
                            'None of the four impairments',
                        ],
                        [
                            'Moderate–severe',
                            '≥1 of: sleep disturbance; impaired daily, leisure or sport activity; impaired school or work; troublesome symptoms',
                        ],
                    ],
                    wide: 0,
                },
                {
                    t: 'figure',
                    src: 'images/oksat/ar-crs-aerd/aria-classification.svg',
                    alt: 'Panel A: a two-by-two grid of days per week with symptoms (under 4, over 4) against consecutive weeks (under 4, 4 or more). Only the cell with over 4 days per week and 4 or more weeks is persistent; the other three are intermittent. Three example patients: grass, 6 days a week for 8 weeks, seasonal and persistent; house dust mite, 2 days a week all year, perennial and intermittent; tree, daily for 2 weeks, seasonal and intermittent. Panel B: mild means none of four impairments; moderate to severe means at least one of sleep disturbance, impaired daily or sport activity, impaired school or work, or troublesome symptoms.',
                    label: 'Figure · ARIA duration and severity',
                    cap: 'Schematic. The example patients are the trap below: seasonal and intermittent are different axes.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: '“Intermittent” and “seasonal” are different axes. A grass-allergic patient symptomatic 6 days a week for 8 weeks each June has seasonal **and persistent** AR. Climate change lengthens pollen seasons and polysensitization blurs the seasonal/perennial line; HDM allergy can be intermittent.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: 'Persistent needs **both** fours (4 days, 4 weeks). Intermittent needs **either** one to fall short.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Symptoms 5 days/week for 3 weeks, waking at night. Classify.', a: 'Intermittent (fewer than 4 consecutive weeks), moderate–severe (sleep disturbance).' },
                { t: 'check', id: 'c2', q: 'List the four impairments that upgrade AR to moderate–severe.', a: 'Sleep disturbance; impairment of daily, leisure or sport activities; impairment of school or work; troublesome symptoms.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q94'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['aria-classification'],
                },
            ],
        },
        {
            id: 'ar-2',
            n: '2.2',
            title: 'Sensitization versus clinical allergy',
            blocks: [
                { t: 'p', x: 'Many sensitized people have no symptoms, and in some patients with AR the sensitization pattern does not explain their symptoms. Skin test reliability depends on extracts and technique. Larger wheals and higher sIgE titers raise specificity but false positives remain. [[src|ICAR V.A.2]]' },
                {
                    t: 'ul',
                    items: [
                        '**Nasal allergen challenge** is the most accurate confirmation of clinical allergy (PPV and NPV >90%), but it is mostly confined to specialist centers.',
                        '**Component-resolved diagnostics** measure sIgE to individual molecules; patterns of component sIgE predict asthma and its severity.',
                        '**Thunderstorm asthma, Melbourne 2016**: many asthma admissions and 10 deaths over ~30 h. Most severe cases had AR, not prior asthma; AIT appeared protective. One IgE-driven disease with an available biomarker and a mechanism-based treatment.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which test best confirms that a sensitization is clinically relevant?', a: 'Nasal allergen challenge (provocation), with PPV and NPV above 90%.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q87'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['pretest-probability'],
                },
            ],
        },
        {
            id: 'ar-3',
            n: '2.3',
            title: 'The differential diagnosis',
            blocks: [
                { t: 'p', x: 'Symptoms of AR are nonspecific. The clues below separate the common mimics. [[src|ICAR V.B]]' },
                {
                    t: 'table',
                    head: ['Entity', 'Distinguishing clue', 'Key fact'],
                    rows: [
                        [
                            '**Rhinitis medicamentosa**',
                            'Prolonged topical decongestant use; congestion without much rhinorrhea or sneezing; tachyphylaxis; red, edematous mucosa',
                            'Triad: prolonged use, persistent obstruction, rebound swelling. ICAR notes adverse effects appear as early as 3 days.',
                        ],
                        [
                            '**Drug-induced**',
                            'Timing with a new medication',
                            'α-blockers, PDE5 inhibitors, some antihypertensives, hormones, NSAIDs (think AERD)',
                        ],
                        [
                            '**NARES**',
                            'Perennial AR picture, **negative allergy tests**, nasal eosinophilia, prominent smell loss',
                            'Smear eosinophils usually 10–20%; diagnostic criterion ≥25%. Raised nasal tryptase, ECP; degranulating mast cells on biopsy.',
                        ],
                        [
                            '**Local AR**',
                            'Allergic story, negative systemic tests, positive nasal provocation',
                            'See 1.7',
                        ],
                        [
                            '**Non-allergic (vasomotor) rhinopathy**',
                            'Triggers: temperature, odors, irritants',
                            'Parasympathetic overactivity; TRP-channel hyperresponsiveness',
                        ],
                        [
                            '**Gustatory / alcohol**',
                            'Watery rhinorrhea soon after eating or drinking',
                            'Cholinergic; ipratropium before meals. Alcohol worsening also suggests CRSwNP or AERD.',
                        ],
                        [
                            '**Rhinitis of pregnancy**',
                            'New symptoms in pregnancy without another cause; remits after delivery',
                            '~22% of previously asymptomatic women; AR history and smoking raise risk',
                        ],
                        [
                            '**Occupational**',
                            'Work-related pattern, better on holidays',
                            'Nasal provocation confirms; avoidance is a recommendation',
                        ],
                        [
                            '**Atrophic rhinitis**',
                            'Crusting, fetor, epistaxis, wide cavity yet “blocked”',
                            'Primary (tropical regions, women, lower SES) vs secondary (surgery, radiation, granulomatous disease)',
                        ],
                        [
                            '**Empty nose syndrome**',
                            'Paradoxical obstruction and suffocation after turbinate tissue loss',
                            'Burning, dryness; psychiatric comorbidity in a minority',
                        ],
                        [
                            '**Autoimmune / granulomatous**',
                            'Crusting, recurrent epistaxis, negative allergy tests, systemic illness',
                            'GPA: sinonasal presenting features in ~73%; renal ~75%, ocular ~50%',
                        ],
                        [
                            '**Non-rhinitis**',
                            'Unilateral, bloody, clear salty drip, child with fetor',
                            'Neoplasm, CSF leak, foreign body, CF, PCD, GERD',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: '**Unilateral** symptoms are never AR until proven otherwise. A child with unilateral foul discharge has a foreign body until proven otherwise; an adult with unilateral obstruction and blood-stained discharge needs endoscopy and imaging for neoplasm.' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'why decongestants rebound',
                    blocks: [
                        { t: 'p', x: 'Resistance arterioles in nasal mucosa carry mainly α2 receptors; capacitance venous sinusoids carry α1 and α2. Imidazolines (oxymetazoline, xylometazoline) are α-agonists that shrink the sinusoids. With prolonged use, receptor downregulation and reduced endogenous norepinephrine release are thought to produce rebound vasodilation and tachyphylaxis. Sympathomimetic amines (phenylephrine, pseudoephedrine, ephedrine) can do the same intranasally. [[src|ICAR V.B.2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Perennial rhinitis, negative SPT and sIgE, marked hyposmia, 30% eosinophils on nasal smear. Diagnosis?', a: 'NARES (non-allergic rhinitis with eosinophilia syndrome; criterion ≥25% eosinophils).' },
                { t: 'check', id: 'c2', q: 'Three exam or history features that should push you away from AR toward vasculitis?', a: 'Crusting, recurrent epistaxis, negative allergy tests (plus feeling systemically unwell, septal perforation, renal or ocular findings).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q95'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['nonallergic-rhinitis'],
                },
            ],
        },
        {
            id: 'ar-4',
            n: '2.4',
            title: 'Epidemiology, risk, burden',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'Prevalence 5–50% depending on definition (some studies count sensitization as AR) and age. It rose globally and may now be leveling off; it increases through childhood to young adulthood.',
                        '**Breastfeeding** [[C|pos|Recommendation]] for ≥4–6 months, mainly for general infant health; possible AR protection.',
                        '**Childhood pet exposure** [[C|neu|Option]]: evidence conflicts (possible harm in Asian cohorts). No recommendation to expose or avoid.',
                        '**Quality of life** [[B|pos|Recommendation]]: treatment improves overall and disease-specific QOL; use validated measures in studies.',
                        '**Sleep** [[B|pos|Rec adults · option children]]: INCS, oral antihistamines, montelukast, and AIT improve AR-related sleep disturbance.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which AR treatments does ICAR list as improving sleep disturbance?', a: 'Intranasal corticosteroids, oral antihistamines, montelukast, and allergen immunotherapy.' },
            ],
        },
        {
            id: 'ar-5',
            n: '2.5',
            title: 'Children and special settings',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'AR takes a few years to develop. Ask about family history of AR, atopy, asthma, and look for the **allergic march** (atopic dermatitis → food allergy → AR → asthma).',
                        'Clues: chapped lips from mouth breathing, fatigue, irritability, poor appetite, attention problems.',
                        'Exam: **allergic salute** and transverse nasal crease, **allergic shiners**, **Dennie–Morgan lines**, posterior pharyngeal cobblestoning, boggy enlarged inferior turbinates, adenoid facies.',
                        'Diagnosis needs history plus testing; **SPT is the preferred test in children**. Treatment under age 2 is limited; older children are treated like adults. AIT may reduce the risk of developing asthma. [[src|ICAR XII]]',
                        '**COVID-19**: AR is not a risk factor for severe disease; standard AR therapies and anti-IgE did not increase risk.',
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: 'Dennie–Morgan = **D**ouble **M**arks under the eyes (infraorbital folds). Shiners = venous congestion, not bruising.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Preferred allergy test in a 6-year-old with suspected AR?', a: 'Skin prick testing.' },
            ],
        },
    ],
};
