/* =============================================================
   Testing for allergy and sinus disease
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 3
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'diagnostics',
    title: 'Testing for allergy and sinus disease',
    kicker: '3 · Diagnostics',
    lede: 'History makes the AR diagnosis; tests confirm it before immunotherapy or targeted avoidance. For CRS, endoscopy or CT is part of the definition.',
    src: 'ICAR §X · EPOS §1.5.4',
    tldr: [
        '**SPT**: read at ~20 min; wheal **≥3 mm** larger than the negative control is positive. Include histamine and saline/glycerin controls.',
        'Hold **H1 antihistamines 2–7 days**, H2 2 days, TCAs 7–14 days, benzodiazepines 7 days. **Omalizumab** suppresses wheals 4–6 months. Montelukast, systemic steroids, SSRIs: no hold needed.',
        'Serum sIgE when skin testing is not possible. Nasal provocation for **local AR** and **occupational** rhinitis.',
        'Imaging, FeNO, nasal NO, and nasal histology are **not** for routine AR diagnosis.',
        'CRS: **Lund–Mackay** 0–24; ≤2 essentially rules out, ≥5 rules in. eCRS = **≥10 eosinophils/hpf**. PCD screen: nasal NO **<77 nL/min**.',
    ],
    sections: [
        {
            id: 'dx-1',
            n: '3.1',
            title: 'History, exam, endoscopy, imaging',
            blocks: [
                {
                    t: 'table',
                    head: ['Modality', 'Evidence', 'Use'],
                    rows: [
                        [
                            'History',
                            '[[D|pos|Recommendation]]',
                            'Essential; presumptive diagnosis can start treatment. Testing is required before AIT or targeted avoidance.',
                        ],
                        [
                            'Physical exam',
                            '[[D|pos|Recommendation]]',
                            'Raises accuracy and excludes mimics; limited in telemedicine.',
                        ],
                        [
                            'Nasal endoscopy',
                            '[[C|neu|Option]]',
                            'Middle or inferior turbinate edema, pale or bluish mucosa, **isolated central compartment polypoid change** (CCAD).',
                        ],
                        [
                            'Radiology',
                            '[[D|neg|Against routine]]',
                            'Central compartment edema on CT may hint at allergy, but radiation and cost outweigh benefit for AR.',
                        ],
                        [
                            'Validated PROMs',
                            '[[B|pos|Recommendation]]',
                            'Screening, tracking control, trial outcomes (TNSS, RQLQ, SNOT-22 and others).',
                        ],
                    ],
                    wide: 1,
                },
                { t: 'check', id: 'c1', q: 'What isolated endoscopic finding suggests an allergic etiology for polypoid disease?', a: 'Polypoid change confined to the central compartment (middle turbinate head, superior turbinate, posterosuperior septum): central compartment atopic disease.' },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['ccad'],
                },
            ],
        },
        {
            id: 'dx-2',
            n: '3.2',
            title: 'Skin testing',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'Skin prick [[B|pos|Rec]]',
                            'Forearm or back (back is more reactive; mid and upper back more than lower). Sites ≥2 cm apart. Read the largest wheal diameter at ~20 min. **Positive: ≥3 mm over the negative control.** Controls: histamine (positive); saline, 50% glycerin, or glycerinated HSA (negative). Use standardized extracts and stick to one device type so your interpretation is consistent.',
                        ],
                        [
                            'Intradermal [[C|neu|Option]]',
                            'Stand-alone test, or confirmation after a negative SPT, especially for non-standardized allergens. Picks up low-level sensitivity; generally performs worse than SPT.',
                        ],
                        [
                            'Blended (e.g., MQT) [[D|neu|Option]]',
                            'SPT followed by intradermal testing to set an endpoint faster than intradermal dilutional testing; defines a starting dose for AIT.',
                        ],
                    ],
                },
                { t: 'h', x: 'Medications that change skin tests' },
                {
                    t: 'table',
                    head: ['Drug', 'Grade', 'Effect', 'Hold'],
                    rows: [
                        [
                            'Oral H1 antihistamines',
                            'A',
                            'Suppress wheal',
                            { x: '**2–7 days**', nw: 1 },
                        ],
                        [
                            'H2 antihistamines (ranitidine)',
                            'A',
                            'May suppress wheal',
                            { x: '2 days', nw: 1 },
                        ],
                        [
                            'Topical (nasal) antihistamines',
                            '—',
                            'One study',
                            { x: '2 days', nw: 1 },
                        ],
                        [
                            'Omalizumab',
                            'A',
                            'Negative skin tests',
                            { x: '**4–6 months**', nw: 1 },
                        ],
                        [
                            'Tricyclic antidepressants',
                            'B',
                            'Antihistaminic, suppress',
                            { x: '**7–14 days**', nw: 1 },
                        ],
                        [
                            'Benzodiazepines',
                            'C',
                            'May suppress',
                            { x: '7 days', nw: 1 },
                        ],
                        ['Topical skin steroids', 'A', 'Local suppression', 'Don\'t test on chronically treated skin'],
                        ['Leukotriene modifiers', 'A', 'None', 'Continue'],
                        ['Systemic corticosteroids', 'C', 'No significant impairment', 'Continue'],
                        ['SSRIs', 'C', 'No suppression', 'Continue'],
                        ['Topical calcineurin inhibitors', 'C', 'Conflicting', '—'],
                    ],
                    wide: 0,
                },
                {
                    t: 'figure',
                    src: 'images/oksat/ar-crs-aerd/skin-test-reading-holds.svg',
                    alt: 'Panel A: a forearm with a 1 mm negative control, a 6 mm histamine control and a 5 mm allergen wheal; 5 minus 1 is 4 mm, at least 3 mm over the negative control, so positive (sensitization). A second forearm where the histamine control is flat is labelled uninterpretable, not negative. Panel B: hold times on a log scale: H2 blockers and nasal antihistamines 2 days, oral H1 antihistamines 2 to 7 days, benzodiazepines 7 days, tricyclic antidepressants 7 to 14 days, omalizumab 4 to 6 months. A box lists drugs that need not be stopped: systemic corticosteroids, leukotriene modifiers, SSRIs; topical skin steroids mean testing elsewhere.',
                    label: 'Figure · reading a prick test, and how long to hold each drug',
                    cap: 'Schematic; wheal sizes illustrative. The log scale shows why omalizumab is the outlier.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: 'The patient on prednisone does **not** need to stop it for skin testing; the patient on amitriptyline for migraine does (7–14 days). A flat histamine control means the test is uninterpretable, not negative.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What makes a skin prick test positive, and when is it read?', a: 'Wheal ≥3 mm larger than the negative control, read at about 20 minutes.' },
                { t: 'check', id: 'c2', q: 'Which three common drugs can be continued before SPT?', a: 'Leukotriene modifiers (montelukast), systemic corticosteroids, SSRIs.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['allergy-testing:q86'],
                },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['skin-prick-testing', 'medication-hold'],
                },
            ],
        },
        {
            id: 'dx-3',
            n: '3.3',
            title: 'In vitro and molecular tests',
            blocks: [
                {
                    t: 'table',
                    head: ['Test', 'Evidence', 'When it helps', 'Limits'],
                    rows: [
                        [
                            'Serum total IgE',
                            '[[C|neu|Option]]',
                            'Overall atopic status; total:specific IgE ratio may predict AIT outcome',
                            'Low level does not exclude AR; not for routine use',
                        ],
                        [
                            'Serum sIgE',
                            '[[B|pos|Rec]]',
                            'When SPT is not possible (dermatographism, extensive eczema, can\'t stop antihistamines)',
                            'False positives; purified or recombinant allergens and lab proficiency testing improve accuracy',
                        ],
                        [
                            'Nasal sIgE',
                            '[[C|neu|Option]]',
                            'Suspected LAR with poor response to medication',
                            'No consensus cutoff',
                        ],
                        [
                            'Basophil activation (BAT)',
                            '[[C|neu|Option]]',
                            'Conflicting or impossible standard tests; possibly AIT monitoring',
                            'Not routine',
                        ],
                        [
                            'Component-resolved (CRD)',
                            '[[C|neu|Option]]',
                            'Polysensitized patients; choosing AIT allergens; AIT safety',
                            'Specialist use; cost',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'deep',
                    title: 'components worth knowing',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                '**Bet v 1** (birch, PR-10 family) cross-reacts with **Mal d 1** (apple): the classic pollen–food syndrome pair.',
                                '**Amb a 1** (ragweed, pectate lyase) and **Art v 1** (mugwort, defensin) are species-specific markers; profilins, polcalcins, and lipid transfer proteins are pan-allergens that cause cross-positive tests without matching clinical relevance.',
                                '**Ara h 2** predicts true peanut allergy better than whole-extract sIgE. [[src|ICAR XIII.E]]',
                                'Major indoor markers: Der p 1/Der p 2 (HDM), **Fel d 1** (cat; the target of the only RCT showing multimodal avoidance benefit), Bla g 1/2 (cockroach).',
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'When does ICAR recommend serum sIgE over skin testing?', a: 'When the patient cannot undergo skin testing (e.g., can\'t stop antihistamines, extensive dermatitis, dermatographism).' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['in-vitro-testing', 'component-resolved-diagnostics'],
                },
            ],
        },
        {
            id: 'dx-4',
            n: '3.4',
            title: 'Challenge, cytology, airflow, nitric oxide',
            blocks: [
                {
                    t: 'table',
                    head: ['Test', 'Evidence', 'Bottom line'],
                    rows: [
                        [
                            'Nasal provocation',
                            '[[C|pos|Rec for LAR, occupational]]',
                            'Option for AR when skin or in vitro results are equivocal. Environmental exposure chambers are mainly research.',
                        ],
                        [
                            'Nasal cytology',
                            '[[C|neu|Option]]',
                            'Cheap, minimally invasive; finds eosinophils in NAR (NARES, LAR) or mixed rhinitis. NARES cutoff not settled.',
                        ],
                        [
                            'Nasal histology',
                            '[[B|neg|Against routine]]',
                            'Research or selected cases (tissue eosinophils at surgery).',
                        ],
                        [
                            'Rhinomanometry',
                            '[[B|neu|Option]]',
                            'Separates structural from mucosal obstruction; valve collapse; when history and exam disagree. Four-phase method correlates with symptoms. Useless with complete obstruction or septal perforation.',
                        ],
                        [
                            'Acoustic rhinometry',
                            '[[C|neu|Option]]',
                            'Cross-sectional area; mostly research. Sinus leakage distorts readings.',
                        ],
                        [
                            'Peak nasal inspiratory flow',
                            '[[B|neu|Option]]',
                            'Cheap and portable; effort-dependent, both sides together, misses valve collapse. Pair with PROMs.',
                        ],
                        [
                            'FeNO / nasal NO',
                            '[[D/C|neg|Against routine]]',
                            'Inconsistent separation of AR from NAR; no agreed cutoffs.',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Nasal NO has one sharp use: **primary ciliary dyskinesia**. nNO <77 nL/min detects PCD with sensitivity 98% and specificity >99% once CF and acute viral infection are excluded. [[src|EPOS 1.8.5]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'For which two diagnoses is nasal provocation testing a recommendation rather than an option?', a: 'Local allergic rhinitis and occupational rhinitis.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['local-allergic-rhinitis'],
                },
                {
                    m: 'crs-ars',
                    c: ['systemic-workup'],
                },
            ],
        },
        {
            id: 'dx-5',
            n: '3.5',
            title: 'Sinus disease workup',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'Endoscopy',
                            'Essential. Polyps, mucopurulence from the middle meatus, edema. Correlates with CT (r = 0.85). Lund–Kennedy score tracks it.',
                        ],
                        [
                            'CT',
                            'Gold standard. Not for uncomplicated ARS. Plain films are obsolete. Early CT may be more cost-effective than repeated empiric antibiotics. Cone-beam and multidetector CT reduce dose.',
                        ],
                        [
                            'Lund–Mackay',
                            'Each side: maxillary, anterior ethmoid, posterior ethmoid, sphenoid, frontal scored 0 (clear), 1 (partial), 2 (total); OMC 0 or 2. Max 12/side, 24 total. **≤2: excellent NPV. ≥5: excellent PPV.**',
                        ],
                        [
                            'MRI',
                            'Complications, tumor, intracranial extension. In invasive fungal sinusitis, **loss of contrast enhancement** is more sensitive on MRI (86%) than CT (69%).',
                        ],
                        [
                            'PROMs',
                            'SNOT-22 (0–110). Surgical candidates average ~42 vs ~9 in controls. Preoperative SNOT-22 is the best predictor of surgical improvement. MCID ≈ 9.',
                        ],
                        [
                            'Smell',
                            'Patients misjudge their own olfaction; test it. UPSIT (and short forms) or Sniffin\' Sticks; all carry cultural bias.',
                        ],
                        [
                            'Histopathology',
                            '**eCRS ≥10 eosinophils/hpf (×400)**; further split 10–100 vs >100/hpf in ≥2 fields. Higher counts predict worse disease and recurrence.',
                        ],
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/ar-crs-aerd/lund-mackay.svg',
                    alt: 'Panel A: for each side, five sinuses (maxillary, anterior ethmoid, posterior ethmoid, sphenoid, frontal) drawn as clear (0), partly opacified (1) or totally opacified (2), and the ostiomeatal complex scored only 0 (patent) or 2 (obstructed), giving 12 per side and 24 total. Panel B: a 0 to 24 bar with 2 or less marked excellent negative predictive value and 5 or more marked excellent positive predictive value, and a worked example totalling 8.',
                    label: 'Figure · scoring Lund–Mackay',
                    cap: 'Schematic. The OMC has no score of 1.',
                },
                { t: 'h', x: 'When to test for something systemic' },
                {
                    t: 'table',
                    head: ['Suspicion', 'Trigger', 'Test'],
                    rows: [
                        [
                            'Humoral immunodeficiency',
                            'Recalcitrant CRS, rapid relapse after antibiotics, pneumonia, bronchiectasis',
                            'Serum IgG/IgA/IgM, then vaccine titers: protein (tetanus) and polysaccharide (pneumococcal) pre/post',
                        ],
                        [
                            'GPA',
                            'Crusting, bleeding, feels disproportionately unwell',
                            'c-ANCA/PR3 (positive in up to 95% of active systemic GPA); cocaine can mimic both clinically and serologically',
                        ],
                        [
                            'EGPA',
                            'Severe polyps unresponsive to usual care, adult asthma',
                            'Blood eosinophils (>1500/µL or >10%), ANCA (subset), organ screen',
                        ],
                        [
                            'Sarcoidosis',
                            'Crusting, nodules, systemic features',
                            'Biopsy (non-caseating granulomas); ACE sensitivity ~60%, specificity ~70%',
                        ],
                        ['CF', 'Polyps in a child (<16 y)', 'Sweat chloride, *CFTR* genetics'],
                        [
                            'PCD',
                            'Neonatal respiratory distress, situs inversus, wet cough, CRS in a child',
                            'Nasal NO, ciliary EM (may be normal), genetics',
                        ],
                    ],
                    wide: 1,
                },
                { t: 'check', id: 'c1', q: 'Score a Lund–Mackay for one side with a fully opaque maxillary sinus, partially opaque anterior ethmoid, clear everything else, and blocked OMC.', a: 'Maxillary 2 + anterior ethmoid 1 + OMC 2 = 5 for that side.' },
                { t: 'check', id: 'c2', q: 'Which vaccine responses test humoral function, and why two kinds?', a: 'Tetanus toxoid (protein, T-dependent) and pneumococcal polysaccharide (T-independent). Specific antibody deficiency can spare protein responses.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q20'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['lund-mackay', 'histology', 'systemic-workup'],
                },
            ],
        },
    ],
};
