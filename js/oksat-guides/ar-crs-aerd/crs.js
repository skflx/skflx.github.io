/* =============================================================
   Chronic rhinosinusitis: classification to surgery
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 6
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'crs',
    title: 'Chronic rhinosinusitis: classification to surgery',
    kicker: '6 · Rhinosinusitis',
    lede: 'EPOS 2020 stopped organizing CRS by polyps and started organizing it by anatomy (localized vs diffuse) and endotype (type 2 vs not). The NEJM review supplies the clinic-level CRSwNP detail.',
    src: 'EPOS §1.2, 1.5–1.8 · NEJM',
    tldr: [
        'Primary vs secondary CRS; each **localized** (unilateral) or **diffuse** (bilateral); primary diffuse splits into **type 2** (eCRS, CRSwNP, AFRS, CCAD) and non-type 2.',
        'Appropriate medical therapy: **INCS + saline**, technique and adherence, ± short OCS. Antibiotics, antifungals, PPIs, probiotics: no.',
        'ESS is appropriate when **LMS ≥1**, after **≥8 weeks INCS + short OCS** (CRSwNP) or antibiotic course (CRSsNP), with **SNOT-22 ≥20**.',
        'After ESS, continued INCS is mandatory. Polyps recur on endoscopy in ~40% at 18 months; ~20% revised within 5 years.',
        'Polyps in a child → CF. Unilateral polyp or blood → tumor. Severe polyps + asthma + eosinophils >10% → think EGPA.',
    ],
    sections: [
        {
            id: 'crs-1',
            n: '6.1',
            title: 'Who gets it',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'CRS affects 5–12% (symptom-based 5.5–28%; with endoscopy or CT 3–6%). More common in smokers. [[src|EPOS]]',
                        '**CRSwNP**: 2.7% of adults on endoscopy (Swedish population study), **twice as common in men**, peak in the sixth decade, very uncommon before age 30. [[src|NEJM]]',
                        'Cardinal symptoms in surgical CRSwNP: obstruction 97%, smell loss 90%. Polyp size tracks obstruction but not other symptoms.',
                        'Associations: asthma, COPD, N-ERD/AERD, hypogammaglobulinemia, GERD. Allergy is strongly linked to CCAD and AFRS, weakly to CRSwNP and CRSsNP.',
                        '**Alcohol** worsens symptoms in about one-third of CRSwNP and up to 83% of AERD patients. [[src|NEJM]]',
                        'Familial aggregation; textile workers with long dust exposure have more polyps. Smoking is not a strong CRSwNP risk factor.',
                        'Facial pain on its own is rarely CRS; don\'t operate on it without nasal findings.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'Sex ratio and age peak for idiopathic CRSwNP? How does AERD differ?', a: 'Men 2:1, peak in the sixth decade. AERD affects women more, starts younger (median ~34), and is more severe with higher recurrence.' },
            ],
        },
        {
            id: 'crs-2',
            n: '6.2',
            title: 'EPOS 2020 classification',
            blocks: [
                {
                    t: 'table',
                    head: ['EPOS 2020', 'Localized (unilateral)', 'Diffuse (bilateral)'],
                    rows: [
                        ['**Primary · type 2**', 'AFRS', 'eCRS / CRSwNP, AFRS, CCAD'],
                        ['**Primary · non-type 2**', 'Isolated sinusitis', 'Non-eCRS'],
                        ['**Secondary · local pathology**', 'Odontogenic, fungal ball, tumor', '—'],
                        ['**Secondary · mechanical**', '—', 'PCD, CF'],
                        ['**Secondary · inflammatory**', '—', 'GPA, EGPA'],
                        ['**Secondary · immunity**', '—', 'Selective immunodeficiency'],
                    ],
                },
                { t: 'p', x: 'eCRS vs non-eCRS is set by tissue eosinophils: **≥10/hpf (×400)**. “Allergic fungal rhinosinusitis” was kept as the name even though not every case shows fungal allergy.' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Type 2 pattern',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        'Main complaint: smell loss or blockage',
                                        'Asthma, N-ERD, atopy',
                                        'Endoscopy: polyps, eosinophilic mucin',
                                        'Labs: raised IgE, eosinophilia',
                                        'Escalation: biologics, ATAD if N-ERD, OCS taper, revision',
                                    ],
                                },
                            ],
                        },
                        {
                            h: 'Non-type 2 pattern',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        'Main complaint: discharge or facial pain',
                                        'Less asthma, less atopy',
                                        'Endoscopy: purulence',
                                        'Labs: normal IgE, no eosinophilia',
                                        'Escalation: xylitol rinses, long-term antibiotics, revision',
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Localized CRS usually does not respond to medical therapy and needs surgery, so EPOS sends unilateral disease to secondary care. **Isolated maxillary or sphenoid opacification** is neoplasia in 18% and malignancy in 7–10%: keep a low threshold for early surgery. [[src|EPOS 1.8.6]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Place odontogenic sinusitis, CF, and CCAD in the EPOS 2020 scheme.', a: 'Odontogenic: secondary, localized (local pathology). CF: secondary, diffuse (mechanical). CCAD: primary, diffuse, type 2.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q15', 'crs-ars:q17'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['crs-classification', 'endotype'],
                },
            ],
        },
        {
            id: 'crs-3',
            n: '6.3',
            title: 'Control and the care pathway',
            blocks: [
                {
                    t: 'table',
                    head: ['Item (last month)', 'Controlled (all)', 'Partly (≥1)', 'Uncontrolled (≥3)'],
                    rows: [
                        ['Nasal blockage', 'Absent or not bothersome', 'Most days', 'Most days'],
                        ['Rhinorrhea / PND', 'Little, mucoid', 'Mucopurulent most days', 'Mucopurulent most days'],
                        ['Facial pain/pressure', 'Absent or not bothersome', 'Most days', 'Most days'],
                        ['Smell', 'Normal or slightly impaired', 'Impaired', 'Impaired'],
                        ['Sleep disturbance / fatigue', 'Absent', 'Present', 'Present'],
                        ['Endoscopy', 'Healthy or near', 'Diseased', 'Diseased'],
                        ['Rescue in 6 months', 'None', '1 course', 'Symptoms persist despite rescue'],
                    ],
                    wide: 1,
                },
                { t: 'why', x: 'For research, “not bothersome” = VAS ≤5 and “present” = VAS >5. EPOS warns the 2012 criteria may overestimate how many patients are uncontrolled.' },
                {
                    t: 'ol',
                    items: [
                        '**Self-care / pharmacy**: saline, OTC INCS, avoid antibiotics and exacerbating factors.',
                        '**Primary care** (6–12 weeks): saline rinses, INCS, teach technique and adherence, check treatable traits (asthma, allergy, smoking, N-ERD).',
                        '**Secondary/tertiary**: full ENT exam and endoscopy. Localized → CT (urgent if tumor suspected) → usually surgery. Diffuse → **appropriate medical therapy**: steroid drops/spray/rinses, saline, technique, consider OCS for 6–12 weeks.',
                        'Not better → CT, SPT, labs; reconsider traits and adherence; endotype → AMT ± OCS (type 2) or ± long-term antibiotics (non-type 2), or FESS.',
                        'Still not better after FESS → additional therapy by endotype (biologics, ATAD, OCS taper, revision; or xylitol, long-term antibiotics, revision).',
                        'Red flags for **secondary diffuse** CRS (bleeding, crusting, severe pain, tissue loss, other organs): serology, biopsy, CT, specialist referral.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'How many uncontrolled items define “uncontrolled” CRS?', a: 'Three or more (one or more = partly controlled; all absent = controlled).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q16'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['crs-control'],
                },
            ],
        },
        {
            id: 'crs-4',
            n: '6.4',
            title: 'Medical therapy: what the evidence supports',
            blocks: [
                {
                    t: 'table',
                    head: ['Therapy', 'EPOS LoE', 'Verdict and detail'],
                    rows: [
                        [
                            '**Nasal corticosteroids**',
                            { x: '1a ✓', nw: 1 },
                            'Effective and safe long term. Larger effect in CRSwNP (SMD −0.93) than CRSsNP (SMD −0.30). No difference between molecules. Reduce polyp size; prevent recurrence after ESS. No effect on intraocular pressure or lens. SNOT-22 effect is below the MCID.',
                        ],
                        [
                            '**Saline irrigation**',
                            { x: '1a ✓', nw: 1 },
                            'Isotonic saline or Ringer\'s lactate. Xylitol, hyaluronate, xyloglucan may add benefit. No added benefit from baby shampoo, honey, dexpanthenol, heat, or hypertonic solutions (avoid hypertonic and baby shampoo: side effects). Large volume not proven better than spray.',
                        ],
                        [
                            '**Systemic corticosteroids**',
                            { x: '1a ✓', nw: 1 },
                            'Short course lowers symptoms and polyp score; polyp effect lasts ~3 months, symptom effect does not. 1–2 courses/year reasonable for partly or uncontrolled disease. Postoperative short course doesn\'t improve QOL.',
                        ],
                        [
                            'Steroid-eluting implants',
                            { x: '1a ✓', nw: 1 },
                            'Recurrent polyps after ESS: small obstruction effect (0.3 on 0–3) but fewer surgeries and lower polyp score. Option.',
                        ],
                        [
                            'Short-term antibiotics',
                            { x: '1b(−)', nw: 1 },
                            'Uncertain benefit for CRS or AECRS; GI adverse events.',
                        ],
                        [
                            'Long-term antibiotics',
                            { x: '1a(−)', nw: 1 },
                            'Uncertain; macrolide cardiovascular risk.',
                        ],
                        [
                            'Topical antibiotics',
                            { x: '1b(−)', nw: 1 },
                            'No better than placebo.',
                        ],
                        [
                            'Antifungals (topical or systemic)',
                            { x: '1a(−)', nw: 1 },
                            '**Recommend against.**',
                        ],
                        [
                            'Montelukast',
                            { x: '1b(−)', nw: 1 },
                            'Not recommended unless INCS not tolerated; don\'t add to INCS.',
                        ],
                        [
                            'Antihistamines',
                            { x: '1b', nw: 1 },
                            'Insufficient evidence for CRS (treat comorbid AR).',
                        ],
                        [
                            'Decongestants',
                            { x: '1b', nw: 1 },
                            'Generally no; temporary add-on when the nose is fully blocked.',
                        ],
                        [
                            'Probiotics · PPIs · TCM/acupuncture · verapamil',
                            { x: '1b(−)', nw: 1 },
                            'Recommend against.',
                        ],
                        [
                            'Capsaicin · furosemide spray',
                            { x: '1b', nw: 1 },
                            'Capsaicin may be an option in CRSwNP; furosemide: no advice.',
                        ],
                        [
                            'ATAD (oral, N-ERD)',
                            { x: '1a ✓', nw: 1 },
                            'See the AERD chapter. Nasal lysine-aspirin and platelet inhibitors: not advised.',
                        ],
                        [
                            'Biologics',
                            { x: '1a/1b', nw: 1 },
                            'Dupilumab and mepolizumab advised when criteria are met; anti-IgE “insufficient” in 2020 (since FDA-approved). See Biologics.',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'From the NEJM review',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                'Second-generation INCS (mometasone, fluticasone) have <1% systemic bioavailability; safe long term without breaks. Underused: in one database only 20% of CRS patients used INCS, mostly at too low a dose.',
                                'Delivery matters more after surgery. **High-volume (240 mL) steroid irrigation** (mometasone in the trial; budesonide and fluticasone available) beat the same dose by spray for endoscopic recurrence after ESS. Drops in a head-down position for moderate–severe disease.',
                                'Oral steroids: Cochrane, 8 RCTs, 2–3 weeks at ~0.5 mg/kg/day (max 60 mg); short-term benefit, gone by 3–6 months; insomnia and GI effects; weigh cumulative bone harm.',
                                '**Doxycycline** 3 weeks and methylprednisolone each shrank polyps vs placebo; steroid faster, doxycycline more sustained. Macrolides reduced early postoperative recurrence in one RCT. Antifungals: no benefit.',
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Conflict between sources',
                    blocks: [
                        { t: 'p', x: 'EPOS 2020 found insufficient evidence that large-volume saline or particular delivery methods beat sprays. The NEJM review recommends high-volume steroid irrigation after ESS on the strength of one RCT. Both can be true: EPOS pooled saline studies across settings; the NEJM claim is specific to post-ESS steroid delivery.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which saline additives does EPOS advise against, and which may help?', a: 'Against: baby shampoo and hypertonic saline. May help: xylitol, sodium hyaluronate, xyloglucan.' },
                { t: 'check', id: 'c2', q: 'How long does the polyp-score benefit of a short oral steroid course last, and what about symptoms?', a: 'Polyp score stays reduced to about 3 months; the symptom benefit has faded by then.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q26', 'crs-ars:q28'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['incs', 'oral-steroids', 'crs-against', 'antibiotics'],
                },
            ],
        },
        {
            id: 'crs-5',
            n: '6.5',
            title: 'Surgery: when, what, and what to expect',
            blocks: [
                {
                    t: 'tool',
                    id: 'ess',
                    title: 'ESS appropriateness',
                    src: 'RAND/UCLA, Rudmik 2016',
                    crit: [
                        'CT Lund–Mackay score ≥1',
                        '≥8 weeks of topical intranasal corticosteroid',
                        'Plus: short course of systemic steroid (CRSwNP) *or* short broad-spectrum/culture-directed antibiotic, or prolonged low-dose anti-inflammatory antibiotic (CRSsNP)',
                        'Post-treatment SNOT-22 ≥20',
                    ],
                    rules: [
                        { eq: 4, tone: 'yes', x: 'All four minimum criteria met: ESS is an appropriate option to offer.' },
                        { eq: 3, tone: 'no', x: '1 criterion missing: optimize medical therapy or reassess the diagnosis first.' },
                        { min: 0, tone: 'no', x: '{miss} criteria missing: optimize medical therapy or reassess the diagnosis first.' },
                    ],
                    note: 'These are minimum thresholds for uncomplicated adult CRS. Meeting them makes surgery appropriate, not mandatory. Patients operated on outside them improved less in QOL.',
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Functional',
                            'Cavity incorporating the natural ostium; ventilation; mucociliary clearance; access for topical therapy.',
                        ],
                        [
                            'Full FESS',
                            'Anterior and posterior ethmoidectomy, (large) middle meatal antrostomies, sphenoidotomy, frontal opening (e.g., Draf IIa).',
                        ],
                        [
                            'Extended',
                            'Draf III, or beyond the sinuses (skull base, orbit, pterygopalatine and infratemporal fossae).',
                        ],
                        ['Radical', 'Adds significant removal of inflamed mucosa.'],
                    ],
                },
                {
                    t: 'ul',
                    items: [
                        '**Outcomes**: large QOL gains maintained to 5 years in the English national audit; endoscopic polyp recurrence ~40% at 18 months; ~20% revision within 5 years. [[src|NEJM]]',
                        '**Postoperative INCS** improve symptoms and endoscopic scores and cut prednisolone rescue; counsel before surgery. Adherence fell to 42% at 12 months in one study. [[src|EPOS]]',
                        '**Predictors**: preoperative SNOT-22 is the best predictor of improvement; primary beats revision; a smell response to OCS predicts the smell result of surgery; blood and tissue eosinophils predict recurrence.',
                        'Big-data studies suggest ESS lowers the incidence of new asthma diagnoses, and later surgery is associated with more asthma.',
                        'Office-based polypectomy under local anesthesia is spreading.',
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'NEJM algorithm',
                    blocks: [
                        {
                            t: 'ol',
                            items: [
                                '**Unilateral polyps, visual change, or blood-stained discharge** → urgent referral.',
                                'Bilateral, **VAS <4** (mild) → INCS spray + saline; stress adherence.',
                                'Bilateral, **VAS ≥4** → INCS drops + saline; consider oral steroid and doxycycline.',
                                'Good response → maintenance spray + saline. Poor or short-lived → CT then ESS.',
                                'Early recurrence → change steroid delivery (devices, irrigations, stents); consider long-term antibiotics or biologics.',
                            ],
                        },
                        { t: 'p', x: 'VAS 0–3 mild, >3–7 moderate, >7 severe. The vignette patient got 14 days of oral steroid, doxycycline 100 mg daily for 3 weeks, and head-down steroid drops for 4 weeks, with referral for surgery if still moderate–severe at 4 weeks.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'State the four RAND/UCLA minimum criteria for ESS in CRSwNP.', a: 'LMS ≥1; ≥8 weeks INCS; plus a short systemic steroid course; post-treatment SNOT-22 ≥20.' },
                { t: 'check', id: 'c2', q: 'What defines a “full FESS” in EPOS?', a: 'Anterior and posterior ethmoidectomy, middle meatal antrostomies, sphenoidotomy, and frontal opening such as Draf IIa.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q32'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['ess-criteria', 'ess-outcomes'],
                },
            ],
        },
        {
            id: 'crs-6',
            n: '6.6',
            title: 'Fungal disease',
            blocks: [
                { t: 'p', x: 'Fungi are in almost every nose. The host immune state, not the fungus, decides the disease: **hypersensitivity → AFRS**, **immunocompetent → fungal ball**, **immunosuppression → invasive**. [[src|EPOS 1.8.6]]' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'AFRS · Bent–Kuhn major criteria',
                            blocks: [
                                {
                                    t: 'ol',
                                    items: [
                                        'Nasal polyposis',
                                        'Fungi on staining',
                                        'Eosinophilic mucin without tissue invasion',
                                        'Type I hypersensitivity to fungi',
                                        'Characteristic CT: differential densities, unilateral or discrete sinus involvement',
                                    ],
                                },
                                { t: 'p', x: '**Minor**: bone erosion, Charcot–Leyden crystals, unilateral disease, peripheral eosinophilia, positive culture, no immunodeficiency or diabetes.' },
                            ],
                        },
                        {
                            h: 'AFRS · features and treatment',
                            blocks: [
                                {
                                    t: 'ul',
                                    items: [
                                        '5–10% of CRS. Young, atopic, asthma, warm humid climates (highest in the southwestern US).',
                                        'CT: hyperdense packed sinuses with expansion and bone erosion. MRI: **signal voids on T1 and T2**.',
                                        'Can cause proptosis and visual disturbance.',
                                        'Surgery is the mainstay; oral steroids pre- and postoperatively help; nebulized topical steroids reduce recurrence; AIT helps atopic patients (weak data); oral antifungals may reduce recurrence but not symptoms.',
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Fungal ball',
                            'Non-invasive mass, usually maxillary, often after dental work; neo-osteogenesis of the sinus wall common. Treat by removal through an adequate antrostomy; persistent mucostasis in up to 18% (some advocate medial maxillectomy).',
                        ],
                        [
                            'Invasive fungal',
                            'Hyphae **within tissue**, angioinvasion → thrombosis, infarction, necrosis. Immunocompromise in almost all: diabetes ~50%, hematologic malignancy ~40%. Mucorales (Rhizopus, Mucor, Rhizomucor) and Aspergillus. MRI loss of enhancement 86% vs CT 69% sensitivity. Serum PCR, galactomannan for aspergillosis.',
                        ],
                        [
                            'Three principles',
                            '1) systemic antifungals; 2) endoscopic debridement of necrotic tissue, repeated as needed; 3) reduce immunosuppression where feasible.',
                        ],
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which AFRS finding is minor, not major: Charcot–Leyden crystals or eosinophilic mucin?', a: 'Charcot–Leyden crystals are minor; eosinophilic mucin without invasion is major.' },
                { t: 'check', id: 'c2', q: 'Which imaging sign is most sensitive for invasive fungal sinusitis?', a: 'Loss of contrast enhancement of the mucosa on MRI (86% vs 69% on CT).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q41'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['afrs', 'fungal-spectrum', 'invasive-fungal'],
                },
            ],
        },
        {
            id: 'crs-7',
            n: '6.7',
            title: 'Other phenotypes you must not miss',
            blocks: [
                {
                    t: 'table',
                    head: ['Entity', 'Recognize it', 'Manage it'],
                    rows: [
                        [
                            '**CCAD**',
                            'IgE-mediated inhalant allergy (HDM, molds, pollens); slightly younger, AR since childhood; polypoid change of middle turbinate, superior turbinate, posterosuperior septum with **central** sinus disease. Positive allergy testing in ~93% of CCAD in one series.',
                            'Skin testing, especially in younger patients; treat the allergy; INCS; surgery for refractory disease. [[src|NEJM · ICAR]]',
                        ],
                        [
                            '**Cystic fibrosis**',
                            '*CFTR* chloride channel defect; secretions >2× normal viscosity; polyps in ~20%; **neutrophilic** inflammation; polyps before age 16 → test.',
                            'Sinus–lung bacterial concordance. ESS recommended without chronic lung infection or after lung transplant to clear gram-negatives; topical antibiotics safe and helpful. CFTR modulators (ivacaftor, tezacaftor) improve rhinologic QOL.',
                        ],
                        [
                            '**PCD**',
                            'Mostly autosomal recessive; situs inversus in ~50% (Kartagener); infertility; CRSwNP in 15–30%; *H. influenzae*, *S. pneumoniae*, *P. aeruginosa*.',
                            'nNO <77 nL/min; EM can be normal. Prolonged macrolides; ESS if medical therapy fails.',
                        ],
                        [
                            '**Immunodeficiency**',
                            'Recalcitrant CRS, fast relapse after antibiotics, pneumonia, bronchiectasis; secondary ID from rituximab, steroids.',
                            'Immunoglobulins → vaccine responses → immunology. Long-term (often half-dose) antibiotics, pneumococcal vaccination, immunoglobulin replacement.',
                        ],
                        [
                            '**GPA**',
                            'Two-thirds present with ENT symptoms. Crusting 75%, discharge 70%, stuffiness 65%, bleeding 59%, smell loss 52%, pain 33%. c-ANCA/PR3. Cocaine mimics it, including ANCA.',
                            'Induction and maintenance immunosuppression (untreated systemic GPA: mean survival ~5 months; treated: ~21.7 years). Irrigation, topical steroid, lubricants, crust debridement; co-trimoxazole and anti-staphylococcal creams. Reconstruction is a last resort.',
                        ],
                        [
                            '**EGPA**',
                            'Adult-onset asthma, severe rhinitis, polyps; blood eosinophils usually >1500/µL or >10%; ANCA in a subset; patients feel systemically ill. Prodromal polyp–asthma phase looks like AERD.',
                            'Prednisolone ± cyclophosphamide, azathioprine, mycophenolate, methotrexate. Suspect in severe polyps not responding to usual care.',
                        ],
                        [
                            '**Sarcoidosis**',
                            'Non-caseating granulomas; raised calcium, ALP, ACE (none diagnostic).',
                            'Systemic steroids; hydroxychloroquine, methotrexate, infliximab.',
                        ],
                        [
                            '**Unilateral “polyp”**',
                            'Inverted papilloma, malignancy, meningo/encephalocele; blood-stained discharge raises concern.',
                            'Image before biopsy of any mass that could connect to the skull base.',
                        ],
                        [
                            '**Pale turbinates**',
                            'AR\'s boggy, cobblestoned inferior turbinate can be mistaken for a polyp (NEJM Fig. 2).',
                            'Decongest and scope.',
                        ],
                    ],
                    wide: 1,
                },
                { t: 'check', id: 'c1', q: 'A 9-year-old has bilateral nasal polyps. First test?', a: 'Sweat chloride test for cystic fibrosis.' },
                { t: 'check', id: 'c2', q: 'Severe polyps, adult-onset asthma, blood eosinophils 18%, and new mononeuritis. Diagnosis?', a: 'Eosinophilic granulomatosis with polyangiitis (EGPA).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q44', 'crs-ars:q48'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['cf-pcd', 'ccad', 'vasculitis'],
                },
            ],
        },
        {
            id: 'crs-8',
            n: '6.8',
            title: 'Pediatric CRS',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'Prevalence up to 4%. Passive and active smoke exposure associated. Adenoids act as a **bacterial reservoir** more than an obstruction. GERD link controversial.',
                        'First line: **saline irrigation** and **INCS** (supported by safety and adult data). No good evidence for oral/IV antibiotics or prolonged macrolides. A steroid taper added to (ineffective) antibiotics beat placebo.',
                        'Surgery: **adenoidectomy ± antral irrigation** first in young children; add irrigation in asthmatics with high CT scores. **FESS** in older children or after failed adenoidectomy; major complications 0.6%, minor 2%.',
                        'CRS in a child may signal CF, PCD, or primary immunodeficiency.',
                    ],
                },
                { t: 'check', id: 'c1', q: 'First surgical step for a 5-year-old with CRS refractory to saline and INCS?', a: 'Adenoidectomy, with or without antral irrigation (add irrigation if asthmatic with a high Lund–Mackay score).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q37'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['peds-crs'],
                },
            ],
        },
    ],
};
