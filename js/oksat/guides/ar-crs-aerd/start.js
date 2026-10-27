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
        { t: 'h', x: 'Glossary: one thing, several names' },
        { t: 'p', x: 'Where a term has more than one name (a CD number, an eponym, an abbreviation), the chapters give both at first use; this is the index.' },
        {
            t: 'table',
            head: ['Term', 'Also called / stands for', 'See'],
            rows: [
                ['**FcεRI**', 'high-affinity IgE receptor; αβγ₂; no CD number (α: *FCER1A*, β: *MS4A2*)', '1.4'],
                ['**FcεRII**', 'CD23; low-affinity IgE receptor (B cells, macrophages, epithelium)', '1.4'],
                ['**FcγRIIIa**', 'CD16; NK-cell receptor that benralizumab engages for ADCC', '8.1'],
                ['**CD80 / CD86**', 'B7-1 / B7-2; costimulatory ligands on the APC for CD28', '1.3'],
                ['**CD40L**', 'CD154; T-cell ligand for CD40 on B cells', '1.3'],
                ['**IL-4Rα**', 'CD124; shared chain of type I and II IL-4 receptors (dupilumab)', '8.1'],
                ['**γc**', 'CD132; common gamma chain (IL-2Rγ), type I IL-4 receptor', '8.1'],
                ['**IL-13Rα1**', 'CD213a1; type II IL-4/IL-13 receptor', '8.1'],
                ['**IL-5Rα**', 'CD125; benralizumab target', '8.1'],
                ['**ST2**', 'IL1RL1; the IL-33 receptor', '1.2'],
                ['**Src-family kinase**', 'Lyn in mast cells; phosphorylates FcεRI ITAMs', '1.4'],
                ['**ITAM**', 'immunoreceptor tyrosine-based activation motif', '1.4'],
                ['**CysLTs**', 'cysteinyl leukotrienes: LTC4, LTD4, LTE4', '1.4, 7.2'],
                ['**5-LO**', '5-lipoxygenase (ALOX5); zileuton target', '7.2, 7.6'],
                ['**t-PA**', 'tissue plasminogen activator', '1.8'],
                ['**GSPN**', 'greater (superficial) petrosal nerve', '1.6'],
                ['**Vidian nerve**', 'nerve of the pterygoid canal (GSPN + deep petrosal)', '1.6'],
                ['**PNN**', 'posterior nasal nerve', '1.6, 4.6'],
                ['**AERD**', 'N-ERD (NSAID-exacerbated respiratory disease); Samter’s triad', '7'],
                ['**ATAD**', 'aspirin therapy after desensitization', '7.5'],
                ['**Draf III**', 'endoscopic modified Lothrop procedure (EMLP)', '7.4'],
                ['**AIT**', 'allergen immunotherapy: SCIT (subcutaneous), SLIT (sublingual)', '4.4'],
                ['**INCS · INAH · LTRA**', 'intranasal corticosteroid · intranasal antihistamine · leukotriene receptor antagonist', '4.2'],
                ['**LAR**', 'local allergic rhinitis (entopy)', '1.7'],
                ['**NARES**', 'non-allergic rhinitis with eosinophilia syndrome', '2.3'],
                ['**CCAD**', 'central compartment atopic disease', '6.7'],
                ['**eCRS**', 'eosinophilic CRS (≥10 eosinophils/hpf)', '6.2'],
                ['**AFRS**', 'allergic fungal rhinosinusitis', '6.6'],
                ['**GPA · EGPA**', 'granulomatosis with polyangiitis (formerly Wegener’s) · eosinophilic GPA (formerly Churg–Strauss)', '6.7'],
                ['**PCD**', 'primary ciliary dyskinesia; Kartagener syndrome with situs inversus', '6.7'],
                ['**MCID**', 'minimal clinically important difference', '10.2'],
            ],
        },
        { t: 'p', x: 'Educational summary for residents; not a substitute for the primary documents or institutional protocols. Where a source statement conflicts with standard immunology or with another source, the conflict is flagged inline.' },
    ],
};
