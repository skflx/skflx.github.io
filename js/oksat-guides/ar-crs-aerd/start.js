/* =============================================================
   Allergic rhinitis, chronic rhinosinusitis, and AERD in one map
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 0
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'start',
    title: 'Allergic rhinitis, chronic rhinosinusitis, and AERD in one map',
    kicker: 'Start here',
    lede: 'Built from ICAR-Allergic Rhinitis 2023, EPOS 2020, the 2019 NEJM CRSwNP review, the 2020 LIO AERD review, and the 2026 AERD biologics review. Every chapter opens with a 30-second version, then breaks into short sections you can tick off.',
    intro: [
        {
            t: 'cards',
            cols: 1,
            items: [
                {
                    h: 'ICAR-AR 2023',
                    blocks: [
                        { t: 'p', x: '**Wise et al., Int Forum Allergy Rhinol 2023.** 144 topics, systematic reviews per topic with an aggregate grade (A–D) and a policy (strong recommendation → recommendation against). The backbone for AR pathophysiology, testing, pharmacotherapy, and immunotherapy. Policy level weighs benefit, harm, and cost, so a grade A topic can still be only an “option.”' },
                    ],
                },
                {
                    h: 'EPOS 2020',
                    blocks: [
                        { t: 'p', x: '**Fokkens et al., Rhinology Suppl 29.** Definitions of ARS/CRS, the primary/secondary × localized/diffuse classification, integrated care pathways, GRADE tables for every CRS therapy, and the biologic indication and response criteria. Written before omalizumab and mepolizumab were approved for CRSwNP.' },
                    ],
                },
                {
                    h: 'NEJM 2019',
                    blocks: [
                        { t: 'p', x: '**Hopkins, N Engl J Med 2019;381:55–63.** Clinical practice review of CRSwNP: epidemiology, associated diseases, a VAS-based treatment algorithm, and surgical outcomes. Biologics were still investigational when it was written.' },
                    ],
                },
                {
                    h: 'LIO 2020',
                    blocks: [
                        { t: 'p', x: '**Dominas et al., Laryngoscope Investig Otolaryngol 2020;5:360–7.** AERD review from the Brigham AERD center: eicosanoid pathophysiology, the 1-day aspirin challenge and desensitization protocol, Draf III data, leukotriene modifiers. Level of evidence 5.' },
                    ],
                },
                {
                    h: 'CTA 2026',
                    blocks: [
                        { t: 'p', x: '**Priessnitz et al., Clin Transl Allergy 2026;16:e70212.** Semi-systematic narrative review of 18 studies of biologics in AERD with a phenotype-based selection framework. Mostly observational and subgroup data.' },
                    ],
                },
            ],
        },
        {
            t: 'call',
            k: 'trap',
            label: 'Currency check',
            blocks: [
                { t: 'p', x: 'Regulatory status moved after these sources. FDA approvals for CRSwNP: dupilumab (2019), omalizumab (2020), mepolizumab (2021), tezepelumab (October 2025, age ≥12). Depemokimab (twice-yearly anti-IL-5) was FDA-approved for severe eosinophilic asthma in December 2025 and approved for CRSwNP in the UK; confirm the current US label before quoting it.' },
            ],
        },
        { t: 'p', x: 'Educational summary for residents; not a substitute for the primary documents or institutional protocols. Where a source statement conflicts with standard immunology or with another source, the conflict is flagged inline.' },
    ],
};
