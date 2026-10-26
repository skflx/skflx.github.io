/* =============================================================
   Definitions and acute rhinosinusitis
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 5
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'ars',
    title: 'Definitions and acute rhinosinusitis',
    kicker: '5 · Rhinosinusitis',
    lede: 'EPOS definitions are symptom plus objective-evidence rules. For ARS, most patients need symptom care and very few need antibiotics; complications need speed.',
    src: 'EPOS §1.2, §1.4, §4.7',
    tldr: [
        'Rhinosinusitis = **≥2 symptoms**, one being **blockage or discharge**, ± facial pain/pressure, ± smell loss (children: ± cough), plus **endoscopy or CT** evidence.',
        'ARS <12 weeks; CRS ≥12 weeks; recurrent ARS ≥4 episodes/year with symptom-free intervals.',
        'Viral ARS <10 days; **post-viral** = worse after day 5 or persisting >10 days; **ABRS** = ≥3 of 5 (discolored discharge, severe local pain, fever >38 °C, raised ESR/CRP, double sickening). ABRS is 0.5–2% of colds.',
        'Antibiotics: no for viral or post-viral; yes in selected ABRS (β-lactams). INCS help post-viral ARS only a little.',
        'Chandler: preseptal → orbital cellulitis → **subperiosteal abscess** → orbital abscess → cavernous sinus thrombosis. Falling acuity or color vision = operate.',
    ],
    sections: [
        {
            id: 'rs-1',
            n: '5.1',
            title: 'The definitions',
            blocks: [
                {
                    t: 'table',
                    head: ['Term', 'Definition (EPOS 2020)'],
                    rows: [
                        [
                            '**Rhinosinusitis, adult**',
                            'Inflammation of nose and sinuses with ≥2 symptoms, one of which is nasal blockage/obstruction/congestion **or** nasal discharge (anterior/posterior), ± facial pain/pressure, ± reduction or loss of smell; **and** endoscopic signs (polyps, and/or mucopurulent discharge primarily from the middle meatus, and/or edema/mucosal obstruction primarily in the middle meatus) **and/or** CT changes in the OMC or sinuses.',
                        ],
                        ['**Rhinosinusitis, child**', 'Same, but **cough** replaces smell loss.'],
                        [
                            'Epidemiology / primary care',
                            'Symptoms only, without endoscopy or imaging; overestimates prevalence because of overlap with AR and NAR.',
                        ],
                        [
                            '**ARS**',
                            'Sudden onset of the symptom set for **<12 weeks**, symptom-free intervals if recurrent. Children: sudden onset of ≥2 of blockage, discolored discharge, or day-and-night cough.',
                        ],
                        [
                            '**Recurrent ARS**',
                            '**≥4 episodes per year** with symptom-free intervals; each episode meets ARS criteria. EPOS advises at least one episode proven by endoscopy and/or CT before diagnosing RARS.',
                        ],
                        [
                            '**CRS**',
                            'The symptom set for **≥12 weeks** (with endoscopy/CT). CRSwNP: bilateral, endoscopically visible polyps in the middle meatus. CRSsNP: none visible, after decongestion if needed.',
                        ],
                        [
                            'Difficult-to-treat',
                            'Not controlled despite adequate surgery, INCS, and up to two short courses of antibiotics or systemic steroids in the last year.',
                        ],
                        [
                            'AECRS',
                            'Worsening with return to baseline, often after steroids or antibiotics. Viruses (e.g., rhinovirus driving eosinophilia) and dysbiosis probably matter more than single bacteria. Beware regression to the mean when judging any treatment.',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**“2 + 1 + 1”**: two symptoms, one of them blockage or discharge, plus one objective finding (scope or scan). Time sets the label: under 12 weeks acute, 12 or more chronic.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which symptom replaces smell loss in the pediatric definition?', a: 'Cough.' },
                { t: 'check', id: 'c2', q: 'Define recurrent ARS and the EPOS proviso.', a: '≥4 ARS episodes per year with complete resolution between; at least one episode should be confirmed by endoscopy and/or CT.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q2'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['rs-definitions'],
                },
            ],
        },
        {
            id: 'rs-2',
            n: '5.2',
            title: 'Viral, post-viral, bacterial',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'ARS one-year prevalence 6–15%, usually after a common cold. Post-viral ARS symptoms in ~18% in a Dutch survey.',
                        '**Viral ARS** (common cold): <10 days. **Post-viral ARS**: increase after 5 days or persistence beyond 10 days, still <12 weeks. Don\'t diagnose post-viral ARS before day 10 unless symptoms clearly worsen after day 5.',
                        '**ABRS**: a minority of post-viral ARS; suspect with ≥3 of the 5 criteria below. Severity is rated on a 10-cm VAS.',
                        'Nasal epithelium is the viral portal of entry and starts the inflammatory cascade: edema, engorgement, extravasation, mucus, ostial obstruction.',
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/ar-crs-aerd/ars-time-course.svg',
                    alt: 'Symptom severity over days with dashed lines at day 5, day 10 and week 12. The common cold peaks early and is gone by day 10. Post-viral ARS is still present after day 10 and resolves before 12 weeks. Double sickening improves and then worsens after day 5. Boxes give the definitions and the five ABRS criteria, of which 3 or more raise suspicion: discolored discharge, severe local pain, fever over 38 °C, raised ESR or CRP, and double sickening.',
                    label: 'Figure · the calendar of acute rhinosinusitis',
                    cap: 'Schematic; curve shapes illustrative. Use the checker below with the five criteria in view.',
                },
                {
                    t: 'tool',
                    id: 'abrs',
                    title: 'ABRS checker',
                    src: 'EPOS 2020',
                    crit: [
                        'Discolored discharge (with unilateral predominance) and purulent secretion in the nasal cavity',
                        'Severe local pain (with unilateral predominance)',
                        'Fever >38 °C',
                        'Elevated ESR or CRP',
                        'Double sickening (deterioration after an initial milder phase)',
                    ],
                    rules: [
                        { min: 3, tone: 'yes', x: '{k} of {n} present. ABRS likely: consider an antibiotic (β-lactam), with symptomatic care.' },
                        { min: 0, x: '{k} of {n} present. Fewer than 3: manage as post-viral ARS; avoid antibiotics.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Day 7 of a cold, improving until day 5, now worse with fever 38.6 °C and unilateral facial pain. ABRS?', a: 'Yes: double sickening + fever + severe local pain = 3 criteria. Consider an antibiotic (amoxicillin/penicillin-class).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q4'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['viral-postviral', 'abrs'],
                },
            ],
        },
        {
            id: 'rs-3',
            n: '5.3',
            title: 'Treating ARS',
            blocks: [
                {
                    t: 'table',
                    head: ['Setting', 'Use', 'Don\'t use'],
                    rows: [
                        [
                            '**Common cold**',
                            'Decongestants (small benefit; <10 days), paracetamol, NSAIDs for pain, antihistamine–decongestant–analgesic combinations (adults, older children), ipratropium for rhinorrhea, saline (option), zinc ≥75 mg/day started within 24 h, vitamin C trial',
                            'Antibiotics (1a−), INCS (1a−), steam (1a−), echinacea (1a−). Antihistamines alone help only days 1–2.',
                        ],
                        [
                            '**Post-viral ARS, adult**',
                            'INCS when symptom reduction is needed (small effect, no QOL effect); herbal (BNO1016, Pelargonium, Myrtol) show benefit',
                            '**Antibiotics (1a−)**; **systemic steroids** (no effect on recovery at 7–14 days)',
                        ],
                        [
                            '**Post-viral ARS, child**',
                            'Saline; symptomatic care',
                            'Antibiotics (1a−); evidence too weak for INCS or antihistamines',
                        ],
                        [
                            '**ABRS, adult**',
                            'Antibiotics in selected patients; **amoxicillin/penicillin** effective by day 3 and at completion; moxifloxacin not shown superior',
                            'Antihistamines; hypertonic saline add-on',
                        ],
                        [
                            '**ABRS, child**',
                            'Data thin (two small trials, no significant benefit, more adverse events)',
                            'Mucolytics (erdosteine)',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: 'Routine antibiotics do **not** prevent ABRS complications. Low suspicion thresholds and early imaging do. Hospital admissions for ARS in children fell after pneumococcal conjugate vaccination, but orbital complications did not. [[src|EPOS 4.7]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which antibiotic class has the best ABRS data in adults per EPOS?', a: 'β-lactams (amoxicillin/penicillin); moxifloxacin was not clearly effective.' },
                { t: 'check', id: 'c2', q: 'What does EPOS say about systemic steroids for post-viral ARS?', a: 'Advises against: no effect on recovery at 7–14 days, only a small effect on facial pain at days 4–7, with potential harm.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q6'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['ars-treatment'],
                },
            ],
        },
        {
            id: 'rs-4',
            n: '5.4',
            title: 'Complications',
            blocks: [
                { t: 'p', x: 'Three groups: **orbital** (preseptal and orbital cellulitis, subperiosteal and orbital abscess), **intracranial** (epidural and subdural empyema, brain abscess, meningitis, encephalitis, superior sagittal and cavernous sinus thrombosis), and **osseous** (frontal osteomyelitis with subperiosteal abscess = **Pott\'s puffy tumor**; frontocutaneous fistula). Children dominate orbital cases. [[src|EPOS 4.7]]' },
                {
                    t: 'steps',
                    rise: 1,
                    label: 'Chandler classification',
                    items: [
                        { n: '1', x: 'Preseptal cellulitis' },
                        { n: '2', x: 'Orbital cellulitis' },
                        { n: '3', x: 'Subperiosteal abscess' },
                        { n: '4', x: 'Orbital abscess' },
                        { n: '5', x: 'Cavernous sinus thrombosis' },
                    ],
                    cap: 'Proptosis and painful, limited eye movement mark the jump from stage 1 to stage 2.',
                },
                {
                    t: 'figure',
                    src: 'img/oksat/ar-crs-aerd/chandler-axial.svg',
                    alt: 'Axial schematic of one orbit, anterior up and medial left, with the ethmoid cells medial to the lamina papyracea, the periorbita lining the walls, the medial and lateral recti, the optic nerve, the globe, the eyelids and the orbital septum. Stage 1, preseptal cellulitis, sits in the lid in front of the septum. Stage 2, orbital cellulitis, is diffuse in the orbital fat. Stage 3, subperiosteal abscess, is a collection between the lamina papyracea and the periorbita next to the ethmoid. Stage 4, orbital abscess, is a collection inside the periorbita. Stage 5, cavernous sinus thrombosis, lies behind the orbital apex, reached by the valveless superior ophthalmic vein, with the sphenoid nearby.',
                    label: 'Figure · Chandler stages on an axial orbit',
                    cap: 'Schematic, not to scale. The two boundaries, septum and periorbita, explain the stages; the critique below explains why 1 and 5 do not belong in an orbital sequence.',
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Preseptal',
                            'Lid edema, erythema, fever, **no proptosis, full eye movements**. Usually from URTI, dacryocystitis or skin infection rather than sinusitis. Often a clinical diagnosis; oral antibiotics.',
                        ],
                        [
                            'Post-septal',
                            'Proptosis, chemosis, painful ophthalmoplegia, diplopia. IV antibiotics and **contrast CT** to separate cellulitis from abscess; MRI if intracranial spread is suspected. Can progress within 24–48 h.',
                        ],
                        [
                            'Spread pattern',
                            'Begins at the medial lid. Maxillary source → lower lid swelling first; frontal source → upper lid.',
                        ],
                        [
                            'Monitoring',
                            'Ophthalmology review (sometimes twice daily): exophthalmometry, tonometry, visual acuity, **color vision (an early sign of deterioration)**, eye movements. Switch to oral antibiotics after 48 h afebrile with resolving signs.',
                        ],
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Indications for surgery (EPOS)',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                'Subperiosteal or intraorbital abscess on CT or MRI (possible exception: small abscesses).',
                                'Reduced visual acuity, reduced color vision, afferent pupillary defect, or **inability to assess vision**.',
                                'Progression, or no improvement in orbital signs (diplopia, ophthalmoplegia, proptosis, swelling, chemosis), despite IV antibiotics.',
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Critique of Chandler',
                    blocks: [
                        { t: 'p', x: 'Preseptal cellulitis is an eyelid infection, not an orbital one, and is rarely sinogenic. Cavernous sinus thrombosis is an intracranial complication, not necessarily the end of an orbital sequence, and is **more often linked to sphenoid** than ethmoid or frontal disease.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Alarm symptoms → immediate referral',
                    blocks: [
                        { t: 'p', x: 'Periorbital edema/erythema, displaced globe, double vision, ophthalmoplegia, reduced acuity, severe headache, frontal swelling, sepsis, meningism, neurologic signs. For CRS add: unilateral symptoms, bleeding, crusting, cacosmia.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'A child with ethmoiditis has proptosis and a 3-mm medial subperiosteal collection; acuity and color vision are normal at 24 h on IV antibiotics. Operate?', a: 'Small abscesses are a possible exception to mandatory drainage; continue IV antibiotics with close ophthalmologic monitoring and operate for any visual decline, progression, or failure to improve.' },
                { t: 'check', id: 'c2', q: 'What is Pott\'s puffy tumor?', a: 'Frontal bone osteomyelitis with a subperiosteal abscess (forehead swelling), an osseous complication of frontal sinusitis.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['crs-ars:q8', 'crs-ars:q10'],
                },
            ],
            drill: [
                {
                    m: 'crs-ars',
                    c: ['chandler', 'orbital-management', 'ars-complications'],
                },
            ],
        },
    ],
};
