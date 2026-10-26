/* =============================================================
   Reading these sources skeptically
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 10
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'appraisal',
    title: 'Reading these sources skeptically',
    kicker: '10 · Critical appraisal',
    lede: 'How the grading systems work, where each source is weak, and four questions that are still open in practice.',
    src: 'All five sources',
    tldr: [
        'ICAR\'s aggregate grade is evidence quality and consistency; its policy level folds in effect size, harm, and cost. EPOS uses levels (1a–4, with “(−)” for negative evidence) plus GRADE wording.',
        'Most AERD biologic data are post hoc subgroups and observational cohorts. Persistence is not efficacy.',
        'Watch effect-size framing: an MCID crossed by the point estimate but not the confidence interval is not a settled clinical benefit.',
        'Open questions: surgery vs biologic first; ATAD in the biologic era; how much surgery in AERD; the place of montelukast.',
    ],
    sections: [
        {
            id: 'ap-1',
            n: '10.1',
            title: 'Two grading systems',
            blocks: [
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'ICAR',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        'Oxford levels 1–5 per study → aggregate grade A–D per topic.',
                                        'Policy: strong recommendation, recommendation, option, no recommendation, recommendation against (strong or not).',
                                        'Topic authors ran their own searches → variable yield; tables may omit lower-level studies when higher ones exist.',
                                    ],
                                },
                            ],
                        },
                        {
                            h: 'EPOS 2020',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        'Full systematic review; levels of evidence (1a, 1b, …) with “(−)” when good evidence shows no effect.',
                                        'GRADE-style recommendations; Delphi for practical questions with little evidence.',
                                        'Care pathways and biologic criteria are consensus built on the reviews.',
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Lesson',
                    blocks: [
                        { t: 'p', x: '“Grade A” for probiotics and acupuncture produced only “option,” because heterogeneous organisms, doses and protocols make the size of benefit unclear. LTRAs are grade A with a recommendation against first-line use. Always read the policy.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What does “1a(−)” mean in an EPOS table?', a: 'High-level (systematic review / meta-analysis of RCTs) evidence showing no benefit, e.g., antibiotics for the common cold or antifungals in CRS.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q96'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['controversies-and-traps'],
                },
            ],
        },
        {
            id: 'ap-2',
            n: '10.2',
            title: 'Source-by-source weak points',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'ICAR-AR 2023',
                            'Executive-summary statements compress large tables; some definitions (FcεRIII on B cells; “neurokinin Y”) depart from standard immunology. Predates tezepelumab and depemokimab approvals.',
                        ],
                        [
                            'EPOS 2020',
                            'Written before omalizumab and mepolizumab were approved for CRSwNP (anti-IgE rated “insufficient”). INCS improve SNOT-22 by less than the MCID despite 1a evidence, a reminder that pooled symptom scores dilute benefit. Its own authors think the control criteria overestimate uncontrolled disease. The biologic criteria were updated by EPOS/EUFOREA in 2023.',
                        ],
                        [
                            'NEJM 2019',
                            'Expert clinical review. The doxycycline advice rests on one small RCT, and the high-volume steroid irrigation advice on one post-ESS RCT. Biologics were “under study.” Author disclosures include steroid-delivery and biologic manufacturers.',
                        ],
                        [
                            'LIO 2020',
                            'Level 5 narrative review from one AERD center, so its protocols are one center\'s practice. Arithmetic slip in the Draf III revision rate (7/31 reported as 28%). Biologic section predates most CRSwNP approvals.',
                        ],
                        [
                            'CTA 2026',
                            'Semi-systematic narrative review; one data extractor with verification by a second; 18 studies, mostly small, observational, or post hoc subgroups. Sign conventions are inconsistent: improvements reported as “+34” SNOT-22 or “+6.33” Lund–Mackay, and smell as “−1.03.” Two authors consult for biologic manufacturers.',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Applied: the ATAD meta-analysis',
                    blocks: [
                        { t: 'p', x: 'SNOT-22 improved by 10.27 points (95% CI 6.39–14.15) against an MCID of ~9. The point estimate crosses the MCID; the lower confidence limit does not. The honest reading is “benefit likely, clinically important benefit not established for every patient,” which matches EPOS\'s statement that the SNOT difference did not reach the MCID.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Applied: the n = 74 comparative cohort',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                '**Confounding by indication**: clinicians chose drugs by phenotype (atopic → omalizumab, eosinophilic asthma → anti-IL-5), so groups differ at baseline.',
                                '**Persistence as an outcome** mixes efficacy, tolerability, cost, and insurer behavior. Dupilumab\'s 98% persistence is meaningful but not a pure efficacy measure.',
                                'Small arms, multiple outcomes, no adjustment reported in the review; anti-IL-5 drugs grouped despite different mechanisms.',
                                'Subgroups in SINUS, SYNAPSE, POLYP, OSTRO were not randomization-stratified for AERD and are underpowered for interaction tests.',
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why is long-term persistence a biased surrogate for comparing biologics?', a: 'It reflects efficacy plus tolerability, dosing convenience, cost and coverage, and clinician selection; it is also confounded by indication in observational cohorts.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q24'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['evidence-quality'],
                },
            ],
        },
        {
            id: 'ap-3',
            n: '10.3',
            title: 'Four live controversies',
            blocks: [
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: '1 · Surgery first or biologic first in CRSwNP?',
                            blocks: [
                                { t: 'p', x: '**For surgery first:** EPOS requires prior ESS (unless unfit); ESS gives durable QOL gains at a one-time cost; biologics are open-ended, expensive, and have no disease-modifying evidence. **For biologic first:** recurrence after ESS is common (~40% endoscopic at 18 months), AERD regrows fastest, and dupilumab and tezepelumab shrink polyps and restore smell without anesthesia. **Unresolved:** whether to re-operate on a partial biologic responder, and whether surgery on a biologic resets the baseline.' },
                            ],
                        },
                        {
                            h: '2 · Where does ATAD fit now?',
                            blocks: [
                                { t: 'p', x: 'ATAD is cheap and evidence-based (EPOS 1a), but GI and bleeding effects and the >48-hour rule drive ~40% discontinuation. Omalizumab and dupilumab can raise aspirin tolerance, and ATAD + biologic beat ATAD alone in one cohort. Current drift: biologic first, ATAD for residual disease or when cost dictates. No randomized sequencing data.' },
                            ],
                        },
                        {
                            h: '3 · How much surgery for AERD?',
                            blocks: [
                                { t: 'p', x: 'AERD fails standard ESS more often, and Draf III improves most patients, yet 58% of an AERD Draf III cohort still recurred. Whether to do Draf III or more extensive mucosal surgery at the primary operation has no randomized data, and all surgical series predate routine biologic use.' },
                            ],
                        },
                        {
                            h: '4 · Montelukast after the boxed warning',
                            blocks: [
                                { t: 'p', x: 'ICAR recommends against LTRA as first-line AR monotherapy and allows it with comorbid asthma after weighing mental-health risk. In AERD the leukotriene rationale is strongest, but zileuton (5-LO) is more effective and needs LFT monitoring. Counsel about neuropsychiatric effects whenever you prescribe montelukast.' },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Give one argument for and one against starting a biologic before revision ESS in AERD.', a: 'For: fastest regrowth after surgery; dupilumab improves smell, SNOT-22, and asthma with high persistence. Against: EPOS criteria assume prior surgery, cost is ongoing, no proof of disease modification, and surgery improves topical delivery.' },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['combination-therapy', 'phenotype-algorithm'],
                },
            ],
        },
    ],
};
