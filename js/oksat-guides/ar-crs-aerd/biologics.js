/* =============================================================
   Biologics for CRSwNP and AERD
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 8
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'biologics',
    title: 'Biologics for CRSwNP and AERD',
    kicker: '8 · Biologics',
    lede: 'Five targets, six-plus drugs, one EPOS checklist. In AERD the comparative data are observational, so learn both the results and why they might mislead.',
    src: 'EPOS §1.6.3 · CTA 2026 · NEJM · LIO · ICAR XI.B.7',
    tldr: [
        'Targets: **IgE** (omalizumab), **IL-5** (mepolizumab, reslizumab, depemokimab), **IL-5Rα** (benralizumab), **IL-4Rα** (dupilumab), **TSLP** (tezepelumab).',
        'EPOS 2020: bilateral polyps **after ESS** (or unfit) + **≥3 of 5**: type 2 evidence (tissue eos ≥10/hpf, blood eos ≥250, or IgE ≥100), ≥2 OCS courses/yr or >3 months, SNOT-22 ≥40, anosmia, asthma on regular ICS.',
        'Judge response at **16 weeks** and **1 year** on 5 domains; stop if none improves.',
        'AERD: **dupilumab** has the most consistent upper- and lower-airway benefit and the best persistence; anti-IL-5/5Rα help eosinophilic asthma, sinus benefit variable; omalizumab for atopic phenotypes and raises aspirin tolerance; tezepelumab cut AERD asthma exacerbations 83%.',
        'Safety: dupilumab conjunctivitis and transient eosinophilia; omalizumab anaphylaxis ~0.1–0.2%; reslizumab is IV.',
    ],
    sections: [
        {
            id: 'bi-1',
            n: '8.1',
            title: 'Drugs and targets',
            blocks: [
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/type2-cascade-targets.svg',
                    alt: 'Schematic cascade: airway epithelium releases TSLP, IL-33 and IL-25 to Th2 cells and ILC2s, which make IL-5 and IL-4 with IL-13. IL-5 acts on IL-5Rα on eosinophils; IL-4 and IL-13 act on IL-4Rα, driving IgE class switch, mucus and FeNO; IgE binds FcεRI on mast cells, whose mediators are PGD2, cysteinyl leukotrienes, histamine and tryptase. Side boxes mark where tezepelumab, mepolizumab and reslizumab, benralizumab, dupilumab and omalizumab block.',
                    label: 'Figure · the type 2 cascade and where each biologic acts',
                    cap: 'Schematic, simplified. Red bars mark what each drug blocks.',
                },
                {
                    t: 'table',
                    head: ['Drug', 'Target / mechanism', 'CRSwNP status', 'Notes'],
                    rows: [
                        [
                            '**Dupilumab**',
                            'Fully human anti-**IL-4Rα** (CD124): blocks IL-4 and IL-13 signaling (shared receptor chain) → less IgE synthesis, eosinophil recruitment, mucus, barrier leak, M2 activation',
                            'FDA 2019 (first)',
                            'In AERD lowers nasal and urinary LTE4 and partly restores PGE2',
                        ],
                        [
                            '**Omalizumab**',
                            'Humanized anti-**IgE**: binds free IgE, prevents FcεRI binding, downregulates FcεRI',
                            'FDA 2020',
                            'Dosed by weight and total IgE; best in atopic phenotypes',
                        ],
                        [
                            '**Mepolizumab**',
                            'Humanized anti-**IL-5**: eosinophil maturation, survival, recruitment fall',
                            'FDA 2021',
                            'SYNAPSE: 57% lower risk of surgery',
                        ],
                        [
                            '**Tezepelumab**',
                            'Anti-**TSLP**: upstream alarmin; dampens DC, ILC2, mast cell, T2 cytokine signaling',
                            'FDA Oct 2025 (≥12 y)',
                            'Works across eosinophil strata in asthma',
                        ],
                        [
                            '**Benralizumab**',
                            'Afucosylated anti-**IL-5Rα** (CD125): NK-cell ADCC via FcγRIIIa (CD16) → near-complete eosinophil depletion',
                            'Asthma; FDA declined CRSwNP (complete response letter, 2022)',
                            'OSTRO improved polyp and blockage scores; AERD subgroup not reported',
                        ],
                        [
                            '**Reslizumab**',
                            'Anti-IL-5, **IV**',
                            'Asthma only',
                            'Infusion reactions, CPK rises; little AERD sinonasal benefit',
                        ],
                        [
                            '**Depemokimab**',
                            'Long-acting anti-IL-5, twice yearly',
                            'FDA asthma Dec 2025; UK CRSwNP',
                            'Check current US label',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/il4-receptors.svg',
                    alt: 'Type I receptor: IL-4Rα with the common gamma chain, binds IL-4 only, on blood-derived cells. Type II receptor: IL-4Rα with IL-13Rα1, binds IL-4 or IL-13, on epithelium, smooth muscle, fibroblasts and myeloid cells. Dupilumab binds IL-4Rα, the chain shared by both, blocking IL-4 through both receptors and IL-13 through type II.',
                    label: 'Figure · why one antibody blocks IL-4 and IL-13',
                    cap: 'Schematic. Dupilumab neutralizes signalling; it does not deplete cells.',
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/il5-vs-il5ra.svg',
                    alt: 'Left: mepolizumab and reslizumab bind IL-5, leaving the eosinophil receptor empty, so maturation, recruitment and survival fall. Right: benralizumab binds IL-5Rα on the eosinophil and, through its afucosylated Fc, engages FcγRIIIa on an NK cell, killing the eosinophil by ADCC. A shared message: either way the eosinophil goes and the rest of the cascade does not, so polyps and anosmia can persist.',
                    label: 'Figure · anti-IL-5 versus anti-IL-5Rα',
                    cap: 'Schematic. This is the pearl below: eosinophils at zero is not the same as disease controlled.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Benralizumab can drive blood eosinophils to zero while polyps and anosmia persist. Eosinophils are not the whole upper-airway story; mast cell and leukotriene activity can continue. [[src|CTA 2026]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why does one antibody (dupilumab) block both IL-4 and IL-13?', a: 'It binds IL-4Rα, which is part of both the type I IL-4 receptor and the type II receptor that IL-13 also uses.' },
                { t: 'check', id: 'c2', q: 'How does benralizumab deplete eosinophils?', a: 'It binds IL-5Rα; its afucosylated Fc enhances NK-cell antibody-dependent cell-mediated cytotoxicity.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q32'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['biologic-targets', 'dupilumab', 'anti-il5', 'tezepelumab'],
                },
            ],
        },
        {
            id: 'bi-2',
            n: '8.2',
            title: 'Pivotal CRSwNP trials',
            blocks: [
                {
                    t: 'table',
                    head: ['Trial', 'Drug', 'Population', 'Headline'],
                    rows: [
                        [
                            '**SINUS-24 / SINUS-52**',
                            'Dupilumab',
                            'Severe CRSwNP, n = 724; AERD 204 (28%)',
                            'Lower NPS, NCS, Lund–Mackay; better smell and symptoms, consistent across subgroups. AERD subgroup vs placebo: NPS −1.89, NCS −1.17, LMS −6.33, SNOT-22 −24.35, UPSIT +10.17.',
                        ],
                        [
                            '**POLYP 1 / 2**',
                            'Omalizumab',
                            'n = 138 / 127; AERD 27.6%',
                            'NPS −1.14 / −0.59; NCS −0.55 / −0.50; SNOT-22 −16.0 / −15.0; UPSIT +3.8 / +3.9 vs placebo at 24 weeks.',
                        ],
                        [
                            '**SYNAPSE**',
                            'Mepolizumab',
                            'n = 407; ~27% AERD',
                            'Lower endoscopic NPS at week 52; 57% lower risk of sinus surgery; efficacy irrespective of NSAID sensitivity.',
                        ],
                        [
                            '**OSTRO**',
                            'Benralizumab',
                            'n = 413; 29.2% AERD',
                            'Improved NPS and blockage; SNOT-22 and UPSIT gains; no AERD analysis.',
                        ],
                        [
                            '**WAYPOINT**',
                            'Tezepelumab',
                            'CRSwNP',
                            'NPS −2.10, NCS −1.09, SNOT-22 −28.4 vs placebo; large reductions in surgery and systemic steroid need (CTA reports 92%; verify against the primary report).',
                        ],
                        [
                            '**EVEREST**',
                            'Dupilumab vs omalizumab',
                            'CRSwNP with asthma; ~40% AERD',
                            'Phase 4 head-to-head, both on background mometasone: dupilumab outperformed omalizumab for polyp size and smell at 24 weeks (the CTA review reports only the dupilumab arm).',
                        ],
                        [
                            '**NAVIGATOR**',
                            'Tezepelumab',
                            'Severe asthma, n = 1061',
                            'AERD subgroup: **83% fewer annualized exacerbations**, regardless of eosinophils.',
                        ],
                    ],
                    wide: 1,
                },
                { t: 'p', x: 'A network meta-analysis put dupilumab\'s NPS reduction at −2.0, omalizumab −1.1, mepolizumab −0.9. [[src|Wu 2022 via CTA]] In 2019 the NEJM review could only say small trials of omalizumab, mepolizumab, and dupilumab reduced symptoms and polyp size, with clinically significant NPS reductions in 60% (mepolizumab) and 70% (dupilumab) of participants.' },
                { t: 'check', id: 'c1', q: 'Which CRSwNP trial showed a 57% reduction in need for surgery, and with which drug?', a: 'SYNAPSE, mepolizumab.' },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['dupilumab', 'omalizumab', 'tezepelumab'],
                },
            ],
        },
        {
            id: 'bi-3',
            n: '8.3',
            title: 'Who qualifies and who responds (EPOS 2020)',
            blocks: [
                {
                    t: 'tool',
                    id: 'bio',
                    title: 'Biologic eligibility',
                    src: 'EPOS 2020 / EUFOREA',
                    pre: 'Bilateral polyps **and** prior ESS (or unfit for surgery)',
                    crit: [
                        'Type 2 evidence: tissue eos ≥10/hpf, or blood eos ≥250/µL, or total IgE ≥100',
                        'Systemic steroids: ≥2 courses/year, or >3 months low dose, or contraindicated',
                        'SNOT-22 ≥40',
                        'Anosmic on smell testing',
                        'Comorbid asthma needing regular inhaled corticosteroids',
                    ],
                    rules: [
                        { pre: false, tone: 'no', x: 'Prerequisite missing: EPOS 2020 reserves biologics for bilateral polyps after ESS (or patients unfit for surgery).' },
                        { min: 3, tone: 'yes', x: '{k} of {n} criteria: indicated per EPOS 2020.' },
                        { min: 0, tone: 'no', x: '{k} of {n} criteria: not yet indicated (need 3).' },
                    ],
                },
                {
                    t: 'tool',
                    id: 'resp',
                    title: 'Response grading',
                    src: 'assess at 16 weeks and 1 year',
                    crit: [
                        'Reduced nasal polyp size',
                        'Reduced need for systemic corticosteroids',
                        'Improved quality of life',
                        'Improved sense of smell',
                        'Reduced impact of comorbidities',
                    ],
                    rules: [
                        { eq: 5, tone: 'yes', x: 'Excellent response (5/5). Continue.' },
                        { min: 3, tone: 'yes', x: 'Moderate response ({k}/5). Continue and reassess.' },
                        { min: 1, tone: 'no', x: 'Poor response ({k}/5). Consider switching target.' },
                        { min: 0, tone: 'no', x: 'No response (0/5). Discontinue.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: 'Blood eosinophils of 300 and SNOT-22 of 52 after ESS is only **two** criteria. Without frequent steroids, anosmia, or asthma, EPOS 2020 says not yet. EPOS also could not say whether to re-operate on a patient on a biologic before calling it a failure; that remains a research question. An EPOS/EUFOREA update was published in 2023; check it before applying these thresholds to a payer request.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'List the five EPOS 2020 biologic criteria with cut-offs.', a: 'Type 2 (tissue eos ≥10/hpf, blood eos ≥250, or IgE ≥100); systemic steroids (≥2 courses/yr, >3 months, or contraindicated); SNOT-22 ≥40; anosmia on testing; asthma on regular ICS. Need ≥3, plus bilateral polyps after ESS.' },
                { t: 'check', id: 'c2', q: 'How many response criteria define an “excellent” and a “moderate” response?', a: 'Excellent 5; moderate 3–4; poor 1–2; none 0 (discontinue).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q51', 'crs-ars:q53'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['biologic-criteria', 'biologic-response'],
                },
            ],
        },
        {
            id: 'bi-4',
            n: '8.4',
            title: 'Biologics in AERD: the evidence',
            blocks: [
                {
                    t: 'table',
                    head: ['Drug', 'Key AERD data', 'Design'],
                    rows: [
                        [
                            '**Dupilumab**',
                            'n = 22: SNOT-22 −34 at 3 months; 73% regained normal or near-normal smell (anosmia 16/22 → 4/22 at 1 month); NPS fell by 1 month; FEV1 +12.6% predicted at 4 weeks; ACQ-6 −1.3; nasal LTE4 down, PGE2 up. Raised aspirin tolerance in a 5-patient series. Added after inadequate ATAD: SNOT-22 −21, ACT +4.3, OCS −61%.',
                            'Prospective cohort; case series; retrospective',
                        ],
                        [
                            '**Omalizumab**',
                            '**62.5% tolerated a cumulative 930 mg aspirin challenge** after 3 months vs 0% on placebo, with lower urinary LTE4 (n = 16). Retrospective n = 29: 86% fewer OCS or SABA; OCS median 2 → 0; best in IgE-mediated allergic asthma. Many still needed surgery or ATAD.',
                            'Randomized crossover; retrospective',
                        ],
                        [
                            '**Mepolizumab**',
                            'n = 14: SNOT-22 −17.7, better congestion and smell, ACT +5.1, FEV1 trend +5–6%, OCS taper, no sinus surgery during follow-up.',
                            'Retrospective',
                        ],
                        [
                            '**Benralizumab**',
                            'Good asthma control and OCS weaning; sinus results mixed (SNOT-22 −8.9 in one study, no change in others).',
                            'Case reports, subgroups',
                        ],
                        [
                            '**Tezepelumab**',
                            'NAVIGATOR AERD subgroup −83% exacerbations; FEV1 ~+0.23 L consistent in AERD; case report of rescue after benralizumab failure (eos 1782 → <300, FeNO 42 → 8 ppb).',
                            'RCT subgroup; case report',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Head-to-head',
                            'Largest comparison (n = 74): only dupilumab improved SNOT-22, ACT, and exacerbations at the population level. **98% stayed on dupilumab**; ~50% stopped benralizumab and omalizumab; ~70% stopped mepolizumab or reslizumab, mostly for poor sinonasal response. [[src|Wangberg 2022]]',
                        ],
                        [
                            'Switching',
                            'Patients failing anti-IL-5/5Rα who switched to dupilumab improved in SNOT-22, ACT, and exacerbations. [[src|Bavaro 2021]]',
                        ],
                        [
                            'ATAD + biologic',
                            'n = 70: ACT +5.0 vs +2.0, SNOT-22 −28 vs −14, OCS −76% vs −38% compared with ATAD alone. Biologics may make desensitization better tolerated; ATAD is increasingly reserved for residual sinus disease on a biologic.',
                        ],
                        [
                            'Durability',
                            'No evidence that biologics change the natural history of AERD; they control disease while given.',
                        ],
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/persistence-bars.svg',
                    alt: 'Panel A: still prescribed at study end in 74 AERD patients: dupilumab 98%, omalizumab 48.6%, anti-IL-5 or IL-5Rα 26.9%. Panel B: discontinuation about 40% for ATAD versus about 20% for biologics, with persistence about 60% versus 80%; twice the discontinuation is not twice the persistence.',
                    label: 'Figure · who stays on what',
                    cap: 'Schematic bars from the cited cohorts. Read it with the confounding critique in Evidence & controversies.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Phenotype-based choice (CTA 2026 framework)',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                'Prominent polyps and anosmia → **dupilumab** (IL-4/IL-13).',
                                'Uncontrolled eosinophilic asthma dominates → **anti-IL-5 / IL-5Rα**.',
                                'Atopic, IgE-mediated allergic asthma → **omalizumab** (also raises aspirin tolerance).',
                                'Mixed or low-eosinophil disease, or failure of targeted agents → **tezepelumab**.',
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'In the omalizumab crossover RCT, what proportion tolerated a 930-mg cumulative aspirin challenge?', a: '62.5% on omalizumab vs 0% on placebo.' },
                { t: 'check', id: 'c2', q: 'What was dupilumab persistence in the multicenter AERD comparison?', a: '98% remained on it long term.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q45'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['real-world', 'head-to-head', 'phenotype-algorithm'],
                },
            ],
        },
        {
            id: 'bi-5',
            n: '8.5',
            title: 'Safety and biomarkers',
            blocks: [
                {
                    t: 'table',
                    head: ['Drug', 'Adverse effects to know'],
                    rows: [
                        [
                            'Dupilumab',
                            'Injection-site reactions, nasopharyngitis, **transient blood eosinophilia** (the label warns about eosinophilic conditions, especially as oral steroids are tapered). **Conjunctivitis** 15.8% vs 8.4% and keratitis 1.3% vs 0.2%, mainly in atopic dermatitis trials. EPOS 2020 said conjunctivitis was not seen in asthma or CRSwNP trials.',
                        ],
                        [
                            'Omalizumab',
                            'Anaphylaxis ~0.1–0.2%; injection-site reactions, headache, mild viral infections.',
                        ],
                        [
                            'Mepolizumab / reslizumab',
                            'Headache, injection-site pain, back pain, rare herpes zoster. Reslizumab IV: infusion reactions, asymptomatic CPK rises.',
                        ],
                        [
                            'Benralizumab',
                            'Headache, pharyngitis; theoretical helminth risk from near-total eosinophil depletion (not confirmed clinically).',
                        ],
                        [
                            'Tezepelumab',
                            'Similar to placebo: nasopharyngitis, headache, injection-site reactions.',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Blood eosinophils',
                            'Most available; predict anti-IL-5/5Rα response; incomplete picture in AERD.',
                        ],
                        [
                            'FeNO',
                            'Reflects IL-4/IL-13 activity; may predict dupilumab or tezepelumab benefit.',
                        ],
                        [
                            'Urinary LTE4',
                            'Characteristic of AERD, tracks disease activity and reactions; assay availability and thresholds limit use.',
                        ],
                        [
                            'Total IgE',
                            'Needed to dose omalizumab; should not decide the drug alone.',
                        ],
                        [
                            'Emerging',
                            'IL-33, TSLP, periostin, 15-HETE, 15-oxo-ETE. EPOS: no biomarker yet predicts response in CRS.',
                        ],
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/ar-crs-aerd/biomarker-map.svg',
                    alt: 'Four rows. Blood eosinophils report the IL-5 arm and predict response to mepolizumab and benralizumab. FeNO reports IL-4 and IL-13 and may predict dupilumab or tezepelumab benefit. Total IgE with weight doses omalizumab but should not choose it. Urinary LTE4 reports cysteinyl leukotriene production and tracks AERD activity rather than choosing a drug. A note: on treatment the marker reports the drug, and EPOS found no biomarker that yet predicts response in CRS.',
                    label: 'Figure · biomarker, arm, drug',
                    cap: 'Schematic. Each test can only point to the drug aimed at the arm it reads.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'ICAR on allergic rhinitis',
                    blocks: [
                        { t: 'p', x: 'Biologics for AR alone: grade A evidence, policy **option**, not FDA-approved for AR. Omalizumab as premedication makes rush and cluster SCIT safer.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which biomarker best reflects IL-4/IL-13 activity?', a: 'Fractional exhaled nitric oxide (FeNO).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q36'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['biologic-safety', 'biomarkers'],
                },
            ],
        },
    ],
};
