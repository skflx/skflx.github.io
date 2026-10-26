/* =============================================================
   Treating allergic rhinitis, including immunotherapy
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 4
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'ar-treatment',
    title: 'Treating allergic rhinitis, including immunotherapy',
    kicker: '4 · Management',
    lede: 'Read each drug as two facts: the grade (how good the evidence is) and the policy (what ICAR tells you to do). They often disagree.',
    src: 'ICAR §XI',
    tldr: [
        '**INCS** are first line (A, strong). **Saline** belongs in every plan (A, strong). **Intranasal antihistamine** is first or second line (A, strong).',
        'If one spray fails: **INCS + intranasal antihistamine** (A, strong). Adding an oral antihistamine to INCS has not shown consistent benefit.',
        '**Against**: routine oral or injected steroids, routine oral decongestants, first-generation antihistamines, LTRA as first-line monotherapy (boxed warning), epicutaneous immunotherapy.',
        '**AIT** is the only disease-modifying option. SCIT and SLIT tablets: A, strong. Uncontrolled asthma is the top risk factor for fatal reactions; don\'t start AIT in pregnancy.',
        'Medically refractory turbinate hypertrophy: **inferior turbinate reduction** (B, recommendation).',
    ],
    sections: [
        {
            id: 'mg-1',
            n: '4.1',
            title: 'The treatment ladder',
            blocks: [
                {
                    t: 'steps',
                    items: [
                        { n: '0', x: '**Avoidance where it works** plus **saline irrigation** [[A|pos|Strong]]. Hypertonic saline may be better in children.' },
                        { n: '1', x: '**INCS spray** [[A|pos|Strong]], or **intranasal antihistamine** [[A|pos|Strong]]. Newer-generation oral H1 antihistamine is acceptable for mild disease [[A|pos|Strong]].' },
                        { n: '2', x: '**INCS + intranasal antihistamine** (combined or as two sprays) [[A|pos|Strong, when monotherapy fails]]' },
                        { n: '3', x: 'Targeted add-ons: **ipratropium** for persistent rhinorrhea [[A|neu|Option]]; short-term **topical decongestant + INCS** before turbinate surgery [[B|neu|Option]]; **LTRA + INCS** only with comorbid asthma [[B|neu|Option]]; cromolyn [[A|pos|2nd line]].' },
                        { n: '4', x: '**Procedures** for anatomic obstruction or refractory rhinorrhea: inferior turbinate reduction [[B|pos|Rec]], septoplasty [[C|neu|Option]], vidian / posterior nasal neurectomy [[B|neu|Option]], PNN cryo/RF [[C|neu|Option]].' },
                        { n: 'AIT', x: '**Immunotherapy at any rung** once testing matches symptoms: inadequate relief, preference for immunomodulation, wish to avoid long-term medication, or many symptomatic weeks per year. SCIT [[A|pos|Strong]], SLIT tablets [[A|pos|Strong]].', side: 1 },
                    ],
                },
                { t: 'check', id: 'c1', q: 'INCS alone has failed. What does ICAR strongly recommend next, and what does it say about adding an oral antihistamine instead?', a: 'INCS + intranasal antihistamine (strong recommendation). Adding an oral antihistamine to INCS has not consistently beaten INCS alone (option).' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['pharmacotherapy'],
                },
            ],
        },
        {
            id: 'mg-2',
            n: '4.2',
            title: 'Pharmacotherapy, drug by drug',
            blocks: [
                {
                    t: 'table',
                    head: ['Agent', 'Evidence', 'What matters'],
                    rows: [
                        [
                            '**INCS spray**',
                            '[[A|pos|Strong]]',
                            'Best for nasal symptoms, also ocular; beats oral antihistamines and LTRAs. Epistaxis with prolonged use. No HPA-axis effect; possible short-term growth effect in children → lowest effective dose. Start several days before pollen season; recheck the septum in a few weeks.',
                        ],
                        [
                            'INCS, non-traditional (drops, nebulized, irrigation)',
                            '[[B|neg|Against routine]]',
                            'Steroid drops have significant systemic effects. Inhaled steroid exhaled through the nose may help patients with asthma + AR.',
                        ],
                        [
                            '**Intranasal antihistamine**',
                            '[[A|pos|Strong]]',
                            'Rapid onset. Better than oral antihistamines for congestion; better than INCS for ocular symptoms; most studies favor it over INCS for sneezing, itch, rhinorrhea. Taste aversion. Less effective than INCS for congestion.',
                        ],
                        [
                            'Oral H1, newer generation',
                            '[[A|pos|Strong]]',
                            'First generation not recommended (CNS and anticholinergic effects, worse in the elderly). Not for <2 years; caution 2–5.',
                        ],
                        ['Oral H2', '[[B|neu|No rec]]', 'Possible add-on to H1; P450 interactions.'],
                        [
                            'Oral corticosteroids',
                            '[[B|neg|Strong against routine]]',
                            'Rare exception: obstruction so severe that sprays can\'t reach the mucosa, after a risk discussion (no direct evidence).',
                        ],
                        [
                            'Injectable corticosteroids',
                            '[[B|neg|Against]]',
                            'HPA axis, growth, bone, glucose. **Intraturbinate injection risks vision loss.**',
                        ],
                        [
                            'Oral decongestants',
                            '[[A|neg|Strong against routine]]',
                            '**Pseudoephedrine works; phenylephrine does not.** Short rescue only, mindful of HTN, cardiac disease, BPH.',
                        ],
                        [
                            'Intranasal decongestants',
                            '[[B|neu|Option, short term]]',
                            'Acute flares only; rhinitis medicamentosa with chronic use, adverse effects from ~3 days.',
                        ],
                        [
                            '**LTRA (montelukast)**',
                            '[[A|neg|Against 1st-line mono]]',
                            'Beats placebo, but inferior to INCS and no better than oral antihistamines. **FDA boxed warning for neuropsychiatric events**, including suicidality. Option only if preferred agents are contraindicated.',
                        ],
                        [
                            'Intranasal cromolyn',
                            '[[A|pos|Rec, 2nd line]]',
                            'Mast cell stabilizer; works best **before** exposure; age ≥2; useful in pregnancy. Less effective than INCS and INAH.',
                        ],
                        ['Ipratropium (intranasal)', '[[A|neu|Option]]', 'Rhinorrhea only; add to INCS.'],
                        [
                            'Biologics for AR',
                            '[[A|neu|Option]]',
                            'Omalizumab improves symptoms, rescue use and QOL; dupilumab data weaker. **Not FDA-approved for AR.**',
                        ],
                        [
                            'Probiotics',
                            '[[A|neu|Option]]',
                            'Benefit in most trials, but strains and doses vary too much for a specific recommendation.',
                        ],
                        [
                            'Acupuncture',
                            '[[A|neu|Option]]',
                            'Adjunct for patients avoiding medication; repeated sessions; electroacupuncture can interfere with pacemakers.',
                        ],
                        ['Honey · herbal', '[[D|neu|No rec]]', 'Conflicting or uncertain evidence.'],
                    ],
                    wide: 1,
                },
                { t: 'h', x: 'Combinations' },
                {
                    t: 'table',
                    head: ['Combination', 'Evidence', 'Verdict'],
                    rows: [
                        [
                            'INCS + intranasal antihistamine',
                            '[[A|pos|Strong]]',
                            'Beats either alone and beats INCS + oral antihistamine. Two separate generic sprays are a cheaper alternative to the fixed combination.',
                        ],
                        ['Oral antihistamine + INCS', '[[A|neu|Option]]', 'No consistent gain over INCS alone.'],
                        [
                            'Oral antihistamine + oral decongestant',
                            '[[A|neu|Option, episodic]]',
                            'Short-term only; not for <12 y or pregnancy.',
                        ],
                        [
                            'Oral antihistamine + LTRA',
                            '[[A|neg|Against 1st line]]',
                            'Works, but inferior to cheaper INCS and carries the boxed warning.',
                        ],
                        ['INCS + LTRA', '[[B|neu|Option with asthma]]', 'Not recommended for AR alone.'],
                        [
                            'INCS + intranasal decongestant',
                            '[[B|neu|Option]]',
                            'Short-term in AR refractory to INCS + INAH, before turbinate reduction or in patients declining surgery.',
                        ],
                        ['INCS + ipratropium', '[[?|neu|Option]]', 'One RCT (mixed AR/NAR) for refractory rhinorrhea.'],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: '“Grade A” does not mean “use it.” Probiotics and acupuncture are grade A but only options; LTRAs are grade A with a recommendation *against* first-line use. ICAR\'s grade measures the quality and consistency of the studies; the policy weighs size of benefit, harm and cost.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which oral decongestant actually reduces congestion, and what is ICAR\'s policy on routine use?', a: 'Pseudoephedrine (phenylephrine shows no benefit). Strong recommendation against routine use; short-term rescue only.' },
                { t: 'check', id: 'c2', q: 'Why does ICAR recommend against montelukast monotherapy for AR despite grade A evidence of efficacy?', a: 'It is inferior to INCS, no better than oral antihistamines, costs more, and carries an FDA boxed warning for neuropsychiatric events.' },
                { t: 'check', id: 'c3', q: 'Which intranasal agent is preferred for prophylaxis before a known exposure in a pregnant patient?', a: 'Cromolyn (disodium cromoglycate), used shortly before exposure.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q88', 'allergy-testing:q89'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['pharmacotherapy'],
                },
            ],
        },
        {
            id: 'mg-3',
            n: '4.3',
            title: 'Avoidance and environmental control',
            blocks: [
                {
                    t: 'table',
                    head: ['Allergen', 'Evidence', 'What works'],
                    rows: [
                        [
                            'House dust mite',
                            '[[B|neu|Option]]',
                            'Acaricides ± bedroom controls and air filtration; best evidence in children with AR + asthma.',
                        ],
                        [
                            'Cockroach',
                            '[[B|neu|Option]]',
                            'Bait traps + cleaning + education. Counts fall but Bla g 1/Bla g 2 often stay above clinical thresholds; no AR endpoints studied.',
                        ],
                        [
                            'Pets',
                            '[[C|neu|Option]]',
                            'Multimodal controls in Fel d 1-sensitized patients (one RCT showed symptom benefit). Removing a pet has emotional cost.',
                        ],
                        [
                            'Rodents',
                            '[[C|neu|Option]]',
                            'Integrated pest management for inner-city, mouse-sensitized children with asthma.',
                        ],
                        ['Pollen', '[[B|neu|Option]]', 'Low-cost measures; mostly expert opinion.'],
                        [
                            'Occupational',
                            '[[C|pos|Recommendation]]',
                            'Avoid or reduce exposure; may prevent occupational asthma. Weigh income loss.',
                        ],
                    ],
                    wide: 1,
                },
                { t: 'check', id: 'c1', q: 'Which avoidance measure earns a full recommendation in ICAR?', a: 'Occupational exposure avoidance/reduction. All the others are options.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['environmental-control'],
                },
            ],
        },
        {
            id: 'mg-4',
            n: '4.4',
            title: 'Allergen immunotherapy: how it works and who gets it',
            blocks: [
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Mechanism',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                'Early: mast cell and basophil desensitization (less degranulation).',
                                'sIgE rises transiently, then falls; **allergen-specific IgG (especially IgG4) “blocking” antibodies** rise and intercept allergen.',
                                'Allergen-specific **regulatory T cells** (FOXP3⁺ Tregs, Tr1; IL-10, TGF-β) and regulatory B cells appear; effector Th2 cells and ILC2s are suppressed; IL-10⁺ ILCs rise.',
                                'Fewer tissue mast cells and eosinophils; skin test reactivity falls.',
                                'SCIT acts earlier and produces larger sIgG4 responses than SLIT.',
                            ],
                        },
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/ar-crs-aerd/ait-time-course.svg',
                    alt: 'Schematic curves over 8 years: a short build-up, maintenance for 3 to 5 years, then stopping. Symptom and medication scores fall once maintenance starts and stay low after stopping. Allergen-specific IgG4 and regulatory T and B cells rise during maintenance and decline slowly after. Specific IgE rises briefly then falls. Boxes note early mast cell and basophil desensitization, that SCIT acts earlier with larger IgG4 rises than SLIT, and that adherence is poor (18% reached 3 years in one pharmacy database).',
                    label: 'Figure · what immunotherapy changes, and when',
                    cap: 'Schematic: directions from ICAR, curve heights illustrative. The adherence box is the trap behind every efficacy curve.',
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Candidate',
                            'Positive skin or in vitro test that **matches** exposure and symptoms, plus one of: inadequate control with avoidance/medication, adverse effects or unwillingness to use long-term medication, preference for immunomodulation, many symptomatic weeks a year, interest in secondary disease modification.',
                        ],
                        [
                            'Age',
                            'Efficacy and safety shown from age **5**; limited data below that, and young children may not be able to report early anaphylaxis.',
                        ],
                        [
                            'Course',
                            'Build-up, then maintenance for **3–5 years**. Clinical effect appears soon after maintenance. Benefit persists after stopping (SLIT: ≥2 years after a 3-year course; reduced medication use up to 3 years after SCIT or SLIT).',
                        ],
                        [
                            'Prevention',
                            'A 32-study meta-analysis found **no conclusive long-term** reduction in new allergic disease or sensitizations, but a short-term reduction in asthma risk in AR (RR 0.40, 95% CI 0.30–0.54). Grass SLIT for 3 years in 812 children aged 5–12 reduced asthma symptoms and medication use through 5 years.',
                        ],
                        [
                            'Adherence',
                            'Poor for both routes: in one pharmacy database only 18% reached 3 years (SCIT 23%, SLIT 7%); German data 35–37% (SCIT) vs 10–18% (SLIT). Most data are retrospective.',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: 'Many AIT trials let “placebo” patients use rescue medication, so the control arm is really a pharmacotherapy arm. AIT benefit is measured *on top of* medication, which shrinks apparent effect sizes. [[src|ICAR XI.D.1]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name three immunologic changes produced by successful AIT.', a: 'Rise in allergen-specific IgG4 blocking antibodies; induction of IL-10/TGF-β-producing Tregs and Bregs; reduced mast cell/basophil degranulation and tissue eosinophils (late fall in sIgE, fewer ILC2s).' },
                { t: 'check', id: 'c2', q: 'What does the best meta-analysis say about AIT preventing new sensitizations?', a: 'No conclusive long-term prevention of new allergic disease or sensitizations; short-term asthma risk reduction in AR (RR 0.40).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q91'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['immunotherapy-mechanism', 'immunotherapy-indications'],
                },
            ],
        },
        {
            id: 'mg-5',
            n: '4.5',
            title: 'Immunotherapy routes and safety',
            blocks: [
                {
                    t: 'table',
                    head: ['Route', 'Evidence', 'Key points'],
                    rows: [
                        [
                            '**Conventional SCIT**',
                            '[[A|pos|Strong]]',
                            'Strong rec over no therapy; **option** over SLIT. Frequent local reactions, rare systemic. Cost-effective.',
                        ],
                        [
                            'Rush SCIT',
                            '[[B|neu|Option]]',
                            'Faster to maintenance; **more local and systemic reactions** than conventional or cluster. Depigmented-polymerized extracts are safer.',
                        ],
                        ['Cluster SCIT', '[[B|neu|Option]]', 'Safety similar to conventional when **premedicated**.'],
                        [
                            '**SLIT (general)**',
                            '[[A|pos|Strong]]',
                            'Strong: grass, ragweed and HDM tablets, tree pollen aqueous. Rec: Alternaria; dual SLIT in bi-allergic patients. Option: animal. Safer than SCIT; frequent mild oral reactions.',
                        ],
                        [
                            'SLIT tablets',
                            '[[A|pos|Strong]]',
                            'FDA labels require an **epinephrine auto-injector**. Contraindicated in **eosinophilic esophagitis** and uncontrolled asthma.',
                        ],
                        [
                            'Aqueous SLIT',
                            '[[B|pos|Rec]]',
                            'High-dose; dosing not standardized; possibly less effective than tablets.',
                        ],
                        [
                            'Intralymphatic (ILIT)',
                            '[[A|neu|Option]]',
                            'Inguinal nodes; few injections, small allergen dose, short course; long-term data lacking.',
                        ],
                        [
                            'Epicutaneous',
                            '[[B|neg|Against]]',
                            'Variable benefit; systemic reactions up to 14.6% (RR 4.65); 3 of 4 studies from one group.',
                        ],
                        [
                            'SCIT + omalizumab',
                            '[[B|neu|Option]]',
                            'Anti-IgE premedication makes rush/cluster build-up safer; selected refractory patients.',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Contraindications',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        '**Uncontrolled asthma**: the single most important risk factor; most fatal reactions are bronchospasm or respiratory failure.',
                                        '**β-blockers** (relative): don\'t increase reaction rate but may increase severity and blunt epinephrine.',
                                        'Inability to receive epinephrine.',
                                        '**Starting AIT in pregnancy**. Continuing maintenance is acceptable.',
                                        'Active systemic autoimmune disease or active malignancy (some guidelines; low-quality evidence).',
                                        'SLIT tablets: EoE; uncontrolled or unstable asthma.',
                                    ],
                                },
                            ],
                        },
                        {
                            h: 'Relative / shared decision',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        'Cardiovascular disease; autoimmune disease in remission; severe psychiatric illness; poor adherence; immunodeficiency; prior serious systemic reaction.',
                                        'Can\'t communicate symptoms (young children).',
                                        '**ACE inhibitors**: relative for venom, not aeroallergen, AIT.',
                                        '**HIV**: not a contraindication unless AIDS.',
                                        'Systemic reactions in ~0.1% of injections; severe ~0.003%.',
                                    ],
                                },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'A patient on maintenance SCIT becomes pregnant. Stop, continue, or escalate?', a: 'Continue maintenance (do not escalate). Initiating AIT during pregnancy is contraindicated.' },
                { t: 'check', id: 'c2', q: 'Which comorbidity contraindicates SLIT tablets specifically?', a: 'Eosinophilic esophagitis (plus uncontrolled asthma).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q90'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['scit-vs-slit', 'slit-tablets', 'systemic-reaction-grading'],
                },
            ],
        },
        {
            id: 'mg-6',
            n: '4.6',
            title: 'Procedures',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        '**Inferior turbinate reduction** [[B|pos|Rec]] for turbinate hypertrophy refractory to medical therapy. Submucous resection and radiofrequency reduce resistance and preserve mucosa; total/partial turbinectomy causes more crusting and bleeding; outfracture alone is unsupported; cryotherapy and submucous diathermy lack durability. Risk: **empty nose syndrome**.',
                        '**Septoplasty / septorhinoplasty** [[C|neu|Option]] for obstructive deviation after failed medical therapy.',
                        '**Vidian or posterior nasal neurectomy** [[B|neu|Option]] for refractory rhinorrhea. Risks: dry eye, palatal or lip numbness, nasal dryness; long-term durability uncertain.',
                        '**Cryoablation / radiofrequency of the posterior nasal nerve** [[C|neu|Option]]: rhinorrhea; epistaxis, transient facial pain.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which turbinate techniques reduce resistance while preserving mucosal function?', a: 'Submucous resection (including microdebrider-assisted) and radiofrequency reduction.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['nonallergic-rhinitis'],
                },
            ],
        },
    ],
};
