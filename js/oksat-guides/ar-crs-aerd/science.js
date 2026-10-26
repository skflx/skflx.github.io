/* =============================================================
   Type 2 immunology of the nose
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 1
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'science',
    title: 'Type 2 immunology of the nose',
    kicker: '1 · Basic science',
    lede: 'One cascade explains allergic rhinitis, type 2 CRSwNP, and most of AERD. Learn it once, then hang every drug and every test on it.',
    src: 'ICAR §VI · EPOS §5.2 · NEJM · LIO',
    tldr: [
        'Three immune programs: **type 1** (IFN-γ; viruses), **type 2** (IL-4, IL-5, IL-13; parasites, tissue repair), **type 3** (IL-17, IL-22; extracellular bacteria, fungi). CRS is one or more of these switched on and never switched off.',
        'A leaky epithelium releases **alarmins** (TSLP, IL-33, IL-25) that start type 2 inflammation through dendritic cells and **ILC2s**.',
        '**IL-4 → STAT6 → GATA-3** makes Th2 cells; IL-4/IL-13 plus **CD40L–CD40** switch B cells to IgE; IgE arms **FcεRI** on mast cells and basophils.',
        'Re-exposure cross-links IgE: **early phase** in minutes (histamine, tryptase, CysLTs), **late phase** at 4–8 h (eosinophils, Th2, congestion, hyposmia).',
        'Polyps form when IL-13 suppresses **t-PA** and a **fibrin mesh** builds up in the stroma.',
    ],
    sections: [
        {
            id: 'sci-1',
            n: '1.1',
            title: 'Three immune programs',
            blocks: [
                { t: 'p', x: 'Each program pairs a fast innate lymphoid cell with a slower T-helper subset. In health the response is pathogen-specific and self-limited. In CRS the same machinery is co-opted into a chronic, polyclonal response that does not resolve. [[src|EPOS 5.2]]' },
                {
                    t: 'table',
                    head: ['Program', 'Innate → adaptive', 'Canonical cytokines', 'Physiologic target', 'Effector picture'],
                    rows: [
                        [
                            '**Type 1**',
                            'ILC1 → Th1',
                            'IFN-γ, IL-12',
                            'Intracellular pathogens, viruses',
                            'Cytotoxic T cells, neutrophils',
                        ],
                        [
                            '**Type 2**',
                            'ILC2 → Th2',
                            'IL-4, IL-5, IL-13',
                            'Helminths; tissue regeneration after injury',
                            'Eosinophils, mast cells, IgE, goblet cell hyperplasia',
                        ],
                        [
                            '**Type 3**',
                            'ILC3 → Th17',
                            'IL-17A, IL-22 (IL-23 upstream)',
                            'Extracellular bacteria, fungi',
                            'Neutrophils, barrier damage',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Pure or mixed **type 2** CRS recurs more after surgery than pure type 1 or 3, and it is the endotype that responds to corticosteroids and to every approved biologic. In Western CRSwNP cohorts most patients are type 2; this may not hold in other populations (NEJM notes Asian cohorts with more neutrophilic polyps were not the basis of that statement).' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'why etiology research stalled and endotyping took over',
                    blocks: [
                        { t: 'p', x: 'Fungi, then *Staphylococcus aureus* (and biofilm), then whole-community dysbiosis were each proposed as the cause of CRS. Therapies aimed at each were underwhelming. Outside CF and *CFTR*, CRS genetics involve many genes with small effects. The field therefore shifted from *what triggered* the inflammation to *which pathway is active* in the tissue, because that is what drugs can target. [[src|EPOS 1.5.3]]' },
                        { t: 'p', x: 'CRS is mostly an adult-onset disease (diagnosis most often in the fifth decade), which points to a long, variable sequence of exposures layered on host susceptibility rather than one cause.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the canonical cytokines and the ILC/Th pair for each of the three programs.', a: 'Type 1: IFN-γ, IL-12; ILC1/Th1. Type 2: IL-4, IL-5, IL-13; ILC2/Th2. Type 3: IL-17A, IL-22; ILC3/Th17.' },
                { t: 'check', id: 'c2', q: 'Which endotype has the highest recurrence after ESS?', a: 'Type 2 (pure or mixed). It also carries the most remodeling: fibrin deposition, polyps, barrier damage.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['crswnp-endotype'],
                },
                {
                    m: 'crs-ars',
                    c: ['endotype'],
                },
            ],
        },
        {
            id: 'sci-2',
            n: '1.2',
            title: 'The epithelium starts it',
            blocks: [
                { t: 'p', x: 'The sinonasal epithelium is pseudostratified ciliated columnar cells, goblet cells, and basal cells joined by **tight junctions** (occludin, claudins, zonula occludens-1). Over it sits a two-layer mucus blanket: a watery periciliary sol layer and a viscous gel layer carrying lactoferrin, lysozyme, and defensins. [[src|ICAR VI.F–G]]' },
                {
                    t: 'kv',
                    rows: [
                        [
                            'What breaks it',
                            '**Der p 1** (house dust mite cysteine protease) and pollen peptidases cleave tight junctions directly. IL-4 and IL-13 downregulate occludin and ZO-1. Histamine and AR nasal secretions lower transepithelial resistance. PM2.5 lowers ZO-1. HMGB1 lowers angulin-1/LSR.',
                        ],
                        [
                            'What it releases',
                            '**Alarmins**: TSLP, IL-33, IL-25, plus other DAMPs. Toll-like receptors on epithelial cells sense allergens and microbes.',
                        ],
                        [
                            'Who listens',
                            '**TSLP** mainly matures dendritic cells toward Th2-promoting subtypes (and acts on ILC2s, mast cells, basophils). **IL-33** acts on ILC2s through ST2 and promotes mast cell degranulation. **IL-25** acts on Th2 cells and ILC2s.',
                        ],
                        [
                            'What repairs it',
                            'Fluticasone restored tight junctions in IL-4-exposed epithelial cultures even without inflammatory cells, and in HDM-allergic mucosa ex vivo. Butyrate (a microbial short-chain fatty acid) blocks histone deacetylase and restores tight junctions.',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Mechanism',
                    blocks: [
                        { t: 'p', x: 'ILC2s are tissue-resident and have no antigen receptor. Alarmins switch them on in minutes, and they pour out IL-5 and IL-13 before any Th2 cell is involved. IL-13 from ILC2s also makes the barrier leakier, which lets more allergen in. That loop is why a barrier defect and type 2 inflammation reinforce each other.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'TSLP sits at the top of the cascade. Blocking it (tezepelumab) dampens downstream IL-4, IL-5, and IL-13 at once, which is the rationale for its activity in low-eosinophil asthma and in mixed AERD.' },
                    ],
                },
                {
                    t: 'deep',
                    title: 'ILC2 maintenance factors and Th17 in AR',
                    blocks: [
                        { t: 'p', x: 'ILC2 survival and proliferation depend on IL-2, IL-7, and IL-9; TL1A and GITRL drive proliferation and cytokine release. IL-2 induces ILC2s to secrete IL-9, which sustains them. Nasal allergen challenge increases blood ILC2s and their influx into the nasal mucosa; pretreatment with intranasal corticosteroid blunts that influx. AIT lowers ILC2s and raises IL-10-producing ILCs, and the IL-10⁺ ILC frequency tracks clinical improvement. [[src|ICAR VI.B]]' },
                        { t: 'p', x: 'A systematic review of 10 studies found raised IL-17 in serum or nasal fluid of AR patients in all of them. Type 3 contributions to AR are plausible but undefined. [[src|ICAR VI.D]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which three alarmins does the nasal epithelium release, and which one mainly targets dendritic cells?', a: 'TSLP, IL-33, IL-25. TSLP mainly acts on dendritic cells (IL-33 on ILC2s/mast cells via ST2; IL-25 on Th2/ILC2).' },
                { t: 'check', id: 'c2', q: 'How does house dust mite reach the submucosa without an injury?', a: 'Der p 1 is a protease that cleaves tight-junction proteins, opening the paracellular route.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['epithelial-alarmins', 'allergen-biology'],
                },
            ],
        },
        {
            id: 'sci-3',
            n: '1.3',
            title: 'Sensitization: making allergen-specific IgE',
            blocks: [
                {
                    t: 'ol',
                    items: [
                        'Dendritic cells in the mucosa take up allergen, migrate to secondary lymphoid tissue, and present it on **MHC class II** to naive Th0 cells.',
                        'Costimulation through **CD28 on the T cell with CD80/CD86** on the APC, in the presence of **IL-4**, drives Th2 differentiation: IL-4 → **STAT6** → master switch **GATA-3**.',
                        'Th2 cells release IL-4, IL-5, IL-13. IL-4/IL-13 plus **CD40L (T cell) – CD40 (B cell)** trigger ε-germline transcription and **class switching to IgE**.',
                        'Plasma cells secrete allergen-specific IgE, which binds **FcεRI** on mast cells and basophils. Memory Th2 and memory B cells persist.',
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/type2-cascade-targets.svg',
                    alt: 'Schematic cascade: airway epithelium releases TSLP, IL-33 and IL-25 to Th2 cells and ILC2s, which make IL-5 and IL-4 with IL-13. IL-5 acts on IL-5Rα on eosinophils; IL-4 and IL-13 act on IL-4Rα, driving IgE class switch, mucus and FeNO; IgE binds FcεRI on mast cells, whose mediators are PGD2, cysteinyl leukotrienes, histamine and tryptase. Side boxes mark where tezepelumab, mepolizumab and reslizumab, benralizumab, dupilumab and omalizumab block.',
                    label: 'Figure · the type 2 cascade and where each biologic acts',
                    cap: 'Schematic, simplified. Red bars mark what each drug blocks.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'AR is essentially absent in infants and rarely appears before age 2, because sensitization takes years of exposure. A toddler with “allergic” rhinorrhea needs another explanation first (adenoid hypertrophy, viral URI, foreign body if unilateral). [[src|ICAR V.A]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**“4-6-3”**: IL-**4** → STAT**6** → GATA-**3**. Th1 runs on IL-12 → STAT4 → T-bet.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which receptor–ligand pair delivers the contact signal for IgE class switching?', a: 'CD40 ligand on the Th2 cell binding CD40 on the B cell, together with IL-4/IL-13.' },
                { t: 'check', id: 'c2', q: 'Which costimulatory pair is needed for Th0 → Th2 differentiation?', a: 'CD28 (T cell) with CD80/CD86 (antigen-presenting cell), plus IL-4.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q84'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['ige-synthesis', 'ige-sensitization'],
                },
            ],
        },
        {
            id: 'sci-4',
            n: '1.4',
            title: 'FcεRI and mast cell degranulation',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'FcεRI (high affinity)',
                            'Mast cells and basophils (degranulation, cytokines); also dendritic cells and macrophages (antigen uptake that promotes Th2). Structure **αβγ₂**: α binds the IgE Fc; β (four transmembrane domains) stabilizes and amplifies; disulfide-linked γ dimer triggers signaling.',
                        ],
                        [
                            'FcεRII / CD23 (low affinity)',
                            'Macrophages and epithelial cells take up IgE–antigen complexes. On B cells, CD23 regulates IgE synthesis and antigen presentation.',
                        ],
                        [
                            'Signal',
                            'Allergen bridges ≥2 IgE–FcεRI complexes → **ITAMs on β and γ** are phosphorylated by Src-family kinases → **Syk** is recruited and activated → degranulation plus de novo synthesis.',
                        ],
                        [
                            'Transcription',
                            'STAT5, NFAT, AP-1, NF-κB, EGR-2. Within 2 h, ~260 genes up, ~84 down.',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source conflict',
                    blocks: [
                        { t: 'p', x: 'ICAR lists a third receptor, “FcεRIII,” on B cells that regulates IgE production. Standard immunology assigns that role to **CD23 (FcεRII)**. For exams, CD23 is the B-cell IgE receptor.' },
                    ],
                },
                {
                    t: 'table',
                    head: ['Mediator class', 'Examples', 'Timing', 'Main nasal effect'],
                    rows: [
                        [
                            'Preformed (granule)',
                            'Histamine, tryptase',
                            { x: 'Seconds–minutes', nw: 1 },
                            'Itch, sneeze (H1 on sensory nerves), vascular leak, rhinorrhea',
                        ],
                        [
                            'Newly formed lipids',
                            'CysLTs (LTC4/D4/E4), PGD2, PAF',
                            { x: 'Minutes', nw: 1 },
                            'Congestion, mucus, eosinophil recruitment; bronchoconstriction',
                        ],
                        [
                            'Cytokines, chemokines',
                            'IL-3, IL-4, IL-5, IL-13, CCL5, GM-CSF',
                            { x: 'Hours', nw: 1 },
                            'Recruit eosinophils, basophils, Th2 cells → late phase',
                        ],
                    ],
                    wide: 0,
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Mechanism',
                    blocks: [
                        { t: 'p', x: 'Omalizumab binds free IgE, so less IgE reaches FcεRI; with less ligand, mast cells and basophils downregulate FcεRI itself. Both effects lower sensitivity to allergen. It also explains why omalizumab can flatten skin-test wheals for months.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which FcεRI subunits carry ITAMs, and which kinase do they recruit?', a: 'β and γ; after Src-family phosphorylation they recruit and activate Syk.' },
                { t: 'check', id: 'c2', q: 'Name one preformed and one newly synthesized mast cell mediator, and a lab marker of degranulation.', a: 'Preformed: histamine or tryptase. Newly formed: LTC4, PGD2, PAF. Tryptase is the measurable marker of mast cell degranulation (ECP marks eosinophil activation).' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['mast-cell-signaling', 'mast-cell-mediators'],
                },
            ],
        },
        {
            id: 'sci-5',
            n: '1.5',
            title: 'Early phase, late phase, priming',
            blocks: [
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Early phase · minutes',
                            tone: 'early',
                            blocks: [
                                { t: 'p', x: 'Mast cell degranulation. **Itching, sneezing, watery rhinorrhea, congestion.** Basophils accumulate in the lamina propria within ~1 h.' },
                            ],
                        },
                        {
                            h: 'Late phase · 4–8 h',
                            tone: 'late',
                            blocks: [
                                { t: 'p', x: 'Adhesion molecules up; eosinophils, basophils, neutrophils, macrophages, T cells recruited. **Congestion, hyposmia, more anterior and posterior rhinorrhea, nasal hyperresponsiveness.** Matrix metalloproteinases and angiogenic factors favor remodeling.' },
                            ],
                        },
                    ],
                },
                { t: 'p', x: '**Priming.** Repeated low-level pollen exposure lowers the threshold for later reactions, and some patients have “minimal persistent inflammation” between exposures. Symptoms therefore do not line up neatly with allergen counts, and nonspecific triggers start provoking flares. [[src|ICAR V.A.1]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Congestion and hyposmia are late-phase symptoms; sneezing and itch are early-phase. Drugs that block only histamine (oral H1 antihistamines) help sneeze/itch/rhinorrhea more than congestion. Intranasal corticosteroids act on the late phase and are the best single agent for congestion.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'A patient sneezes within minutes of mowing and is congested and anosmic that evening. Explain both in one sentence each.', a: 'Minutes: IgE cross-linking on mast cells releases histamine and other preformed mediators (early phase). 4–8 h later: recruited eosinophils, basophils and Th2 cells cause mucosal edema and hyposmia (late phase).' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['late-phase-response'],
                },
            ],
        },
        {
            id: 'sci-6',
            n: '1.6',
            title: 'Neural mechanisms',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'Sensory (trigeminal)',
                            'Aδ and C fibers with **TRPV1** and **TRPA1** channels respond to histamine, bradykinin, acetylcholine, capsaicin. Repeated depolarization makes them hyperexcitable. They release **substance P** (short-acting vasodilator; gland secretion, permeability), **CGRP** (long-acting arterial vasodilator, raised in AR), and **neurokinin A**. SP and CGRP also degranulate mast cells.',
                        ],
                        [
                            'Parasympathetic',
                            '**Acetylcholine** (muscarinic receptors on glands, vessels, epithelium) and **VIP** → watery secretion and vasodilation. Overactivity relative to sympathetic tone is the classic model of non-allergic (vasomotor) rhinitis.',
                        ],
                        [
                            'Sympathetic',
                            '**Neuropeptide Y** and norepinephrine → vasoconstriction of capacitance vessels → decongestion. Resistance arterioles carry mainly α2 receptors; venous sinusoids carry α1 and α2.',
                        ],
                        [
                            'Neurotrophins',
                            '**NGF** from mast cells and eosinophils increases sensory nerve density and neuropeptide content → hyperresponsiveness.',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Source wording',
                    blocks: [
                        { t: 'p', x: 'ICAR writes that sympathetic nerves “respond to neurokinin Y.” The sympathetic co-transmitter is **neuropeptide Y**.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Mechanism → treatment',
                    blocks: [
                        { t: 'p', x: '**Ipratropium** blocks muscarinic glandular secretion: rhinorrhea only. **Azelastine** downregulates TRP channels, which is part of why it helps non-allergic rhinitis too. Intranasal **capsaicin** desensitizes TRPV1 and helps non-allergic and mixed rhinitis. **Vidian neurectomy** and **posterior nasal nerve** cryo/RF ablation cut the parasympathetic secretomotor supply.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: 'Parasympathetic path to the nose: superior salivatory nucleus → nervus intermedius → greater superficial petrosal nerve + deep petrosal (sympathetic) = vidian nerve → pterygopalatine ganglion (synapse) → posterior nasal nerves. That is why vidian neurectomy causes **dry eye**: the lacrimal secretomotor fibers ride the same route.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which neuropeptide is the long-acting arterial vasodilator increased in AR?', a: 'CGRP (substance P is the short-acting one).' },
                { t: 'check', id: 'c2', q: 'Why does ipratropium fix rhinorrhea but not congestion or sneezing?', a: 'It blocks muscarinic receptors on submucosal glands (parasympathetic secretion). Congestion is vascular and sneezing is sensory/histaminergic.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q92', 'allergy-testing:q93'],
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
            id: 'sci-7',
            n: '1.7',
            title: 'Local allergic rhinitis',
            blocks: [
                { t: 'p', x: '**Local AR (LAR)**: allergic-type nasal symptoms with **negative skin and serum tests**, but a positive nasal provocation test, nasal sIgE, or basophil activation test. IgE is produced in the nasal mucosa in amounts enough to arm local effector cells but not enough to reach skin mast cells or be detected in serum. [[src|ICAR VI.A.2–3]]' },
                {
                    t: 'ul',
                    items: [
                        'Prevalence ~26% in Mediterranean series; 7–10% in China and Korea.',
                        '~47% of children previously labeled non-allergic may have LAR.',
                        'Low conversion to systemic sensitization (~3%); progression to asthma is rare.',
                        'Nasal provocation shows classic early and late phases; nasal lavage ECP rises after challenge.',
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Nasal provocation testing is a **recommendation** for diagnosing LAR and occupational rhinitis, but only an option for routine AR. A “non-allergic” patient with a classic allergic story deserves the thought of LAR before being filed as vasomotor. [[src|ICAR X.D.2]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'SPT and serum sIgE are negative but symptoms are seasonal and itchy. Which test confirms local AR?', a: 'Nasal allergen provocation test (supported by nasal sIgE or BAT).' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['local-allergic-rhinitis'],
                },
            ],
        },
        {
            id: 'sci-8',
            n: '1.8',
            title: 'How a polyp is built',
            blocks: [
                { t: 'p', x: 'Type 2 CRS shows the most remodeling: polyps, goblet cell hyperplasia, and barrier damage. These changes probably produce most CRS symptoms. Biologics that suppress type 2 inflammation shrink polyps, which suggests the endotype drives the remodeling rather than the reverse. [[src|EPOS 1.5.3, 5.2]]' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Mechanism',
                    blocks: [
                        { t: 'p', x: '**IL-13 suppresses tissue plasminogen activator (t-PA)**. Less plasmin means fibrin is not cleared, so a **fibrin mesh** deposits and forms the edematous stromal matrix of the polyp. Barrier damage in type 2 CRS is often severe, driven by IL-13-maintained immature epithelial differentiation, autoimmunity, and complement. Type 1 polyps also appear to have a fibrin matrix, and t-PA suppression may be shared.' },
                    ],
                },
                {
                    t: 'ul',
                    items: [
                        '***S. aureus*** is isolated in up to 50% of CRSwNP; its enterotoxins act as **superantigens** that activate T cells nonspecifically. Whether they cause disease or are a marker of it is unresolved. [[src|NEJM]]',
                        'Tissue eosinophilia **>10 cells/hpf** predicts higher recurrence after surgery. [[src|NEJM · EPOS]]',
                        'Olfactory loss in CRS has two parts: inflammation of the neuroepithelium and mechanical blockage of the olfactory cleft. Removing polyps fixes only the second, so smell often needs ongoing anti-inflammatory treatment. [[src|EPOS 1.5.4]]',
                    ],
                },
                { t: 'check', id: 'c1', q: 'What enzyme does IL-13 suppress to produce the fibrin-rich polyp stroma?', a: 'Tissue plasminogen activator (t-PA).' },
                { t: 'check', id: 'c2', q: 'Why can smell stay poor after a technically complete polypectomy?', a: 'Surgery relieves mechanical cleft obstruction, but the inflammatory injury to olfactory epithelium persists until type 2 inflammation is controlled.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q85'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['crswnp-endotype'],
                },
            ],
        },
        {
            id: 'sci-9',
            n: '1.9',
            title: 'The unified airway',
            blocks: [
                { t: 'p', x: 'Upper and lower airways share ciliated pseudostratified epithelium, basement membrane, glands, and inflammatory cells. Differences: the nose has no airway smooth muscle but has extensive subepithelial capillaries and **venous cavernous sinusoids** (the erectile tissue behind congestion); the bronchi have smooth muscle. [[src|ICAR VI.K]]' },
                {
                    t: 'ul',
                    items: [
                        'Asthma in ~25% of CRS vs ~5% of the general population. [[src|EPOS]]',
                        'Up to 60% of CRSwNP patients have lower airway disease, usually adult-onset asthma. [[src|NEJM]]',
                        'Up to two-thirds of CRS patients have asthma, COPD, or bronchiectasis. ESS in asthmatics improves asthma control, attack frequency, admissions, and oral/inhaled steroid use. [[src|EPOS 1.8.3]]',
                        'Nasal allergen challenge raises serum IL-5, which reaches the lungs and increases exhaled NO and bronchial hyperreactivity.',
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Childhood-onset allergic asthma travels with AR; **adult-onset, eosinophilic, non-allergic asthma** travels with CRSwNP and AERD. Polyps are reported to be *less* common in AR and childhood allergic asthma than in the general population. [[src|NEJM]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which tissue element in the nose, absent in the bronchi, explains rapid congestion and decongestion?', a: 'Venous cavernous sinusoids (capacitance vessels) under sympathetic α-adrenergic control.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['unified-airway'],
                },
            ],
        },
        {
            id: 'sci-10',
            n: '1.10',
            title: 'Vitamin D, nitric oxide, microbiome',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'Vitamin D',
                            '1,25-(OH)₂D suppresses type 1 cytokines in most studies. Low levels associate with higher AR prevalence in children but did not predict new AR; supplementation evidence for prevention is insufficient. ICAR suggests checking levels in children as a low-risk step.',
                        ],
                        [
                            'Nitric oxide',
                            'Nose and sinuses are a main source of airway NO; AR raises NO release. NO is antimicrobial, speeds ciliary beat (sGC–cGMP–PKG), and at higher concentrations favors Th2 differentiation. Clinical NO testing is covered in Diagnostics.',
                        ],
                        [
                            'Microbiome',
                            'Adults with AR show lower gut diversity, more Bacteroidetes, fewer Firmicutes (butyrate producers). Nasal microbiome richness does not clearly differ in AR. Mechanisms are unproven.',
                        ],
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which gut phylum, reduced in AR, produces butyrate that tightens epithelial junctions?', a: 'Firmicutes.' },
            ],
        },
    ],
};
