/* =============================================================
   Aspirin-exacerbated respiratory disease
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 7
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'aerd',
    title: 'Aspirin-exacerbated respiratory disease',
    kicker: '7 · AERD / N-ERD',
    lede: 'Asthma, CRSwNP, and respiratory reactions to COX-1 inhibitors. A lipid-mediator disease sitting on top of type 2 inflammation, with the fastest polyp regrowth you will see.',
    src: 'LIO 2020 · EPOS · NEJM · CTA 2026',
    tldr: [
        '~**9.7% of nasal polyp** patients, 7.2% of asthmatics, 14.9% of severe asthmatics. Women more than men. Median onset ~34; ~10-year diagnostic delay.',
        'COX-1 inhibition removes the **PGE2 brake**; arachidonic acid is shunted to **5-lipoxygenase**; CysLTs surge (urinary **LTE4**). PGD2, IL-33, TSLP, mast cells, and platelets amplify it.',
        'Diagnose by history (>1 reaction) or a supervised **oral aspirin challenge**: positive = FEV1 fall >20% or clear upper/extrapulmonary reaction.',
        'Treatment is layered: complete ESS (± Draf III) → INCS/irrigations → **ATAD 2–4 weeks post-op** (lost if off >48 h) and/or **biologic** (dupilumab most consistent) → zileuton or montelukast → no alcohol.',
        'Selective COX-2 inhibitors are generally tolerated; about 10% react to acetaminophen.',
    ],
    sections: [
        {
            id: 'ae-1',
            n: '7.1',
            title: 'Recognizing it',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'Names: Samter\'s triad (1960s), AERD (US), **N-ERD** (NSAID-exacerbated respiratory disease, Europe). ~1.4 million in the US; likely underestimated.',
                        'Natural history: congestion and rhinorrhea first → **asthma ~2 years later** → **aspirin intolerance ~4 years after that**. Hyposmia comes later and signals polyps. [[src|LIO]]',
                        'Reactions to aspirin/NSAIDs: cough, wheeze, chest tightness, eye watering or redness, flushing, rash, nausea, angioedema, abdominal cramps. On challenge, most start 30–60 min after the provoking dose.',
                        'Polyps recur quickly after ESS. Pansinus opacification on imaging should prompt the question.',
                        '**Alcohol** provokes nasal and/or bronchial symptoms in ~75%. [[src|LIO]] (up to 83% in a survey cited by NEJM)',
                        '**Ears**: middle ear infections requiring antibiotics 41.5%, effusion 30%, vertigo 22.1%, chronic drainage 6.1%. Worth an otologic exam.',
                        'Over 70% report at least a moderate negative QOL effect; **anosmia** is the top driver.',
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/ar-crs-aerd/aerd-onset-order.svg',
                    alt: 'Timeline: 1, rhinitis with congestion and rhinorrhea; 2, asthma about 2 years later, usually adult-onset and eosinophilic; 3, aspirin and NSAID reactions about 4 years after that, marked in red, noting that earlier NSAID tolerance does not exclude AERD; 4, hyposmia, which signals polyps. A box reminds to ask about reactions, avoidance and alcohol.',
                    label: 'Figure · order of onset',
                    cap: 'Schematic, not to scale; order per LIO. Sources differ on where polyps fall; the NSAID reaction comes last in both.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: '“Are you allergic to NSAIDs?” is not enough. Many patients with polyps and asthma have been told to avoid NSAIDs and have never tested themselves; others tolerated NSAIDs before the disease developed. Ask about **reactions, avoidance, and alcohol**. Tolerating daily low-dose aspirin does not exclude AERD.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Give AERD prevalence in nasal polyps, asthma, and severe asthma.', a: '~9.7%, ~7.2%, ~14.9% (Rajan 2015 meta-analysis).' },
                { t: 'check', id: 'c2', q: 'Usual order in which the components appear?', a: 'Rhinitis/congestion → asthma (~2 years) → aspirin sensitivity (~4 years later); polyps and hyposmia along the way.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q12'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['epidemiology', 'natural-history', 'history-taking'],
                },
            ],
        },
        {
            id: 'ae-2',
            n: '7.2',
            title: 'Pathophysiology: the eicosanoid shunt',
            blocks: [
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/eicosanoid-pathway.svg',
                    alt: 'Schematic of arachidonic acid metabolism: a 5-lipoxygenase column leading to LTC4, LTD4, LTE4 (marked increased); a cyclooxygenase column where COX-1/COX-2 are drawn as enzymes making PGH2, which branches to PGE2 (marked decreased, via mPGES-1) and PGD2 (marked increased, via mast-cell HPGDS); a 15-LOX-1 column to 15-HETE and 15-oxo-ETE. A footnote says COX-1 and COX-2 are enzymes that convert arachidonic acid to PGH2, not its products.',
                    label: 'Figure · arachidonic acid in AERD',
                    cap: 'Schematic. Increased and decreased products are marked on the figure; zileuton, aspirin/NSAIDs and montelukast show where each drug acts.',
                },
                {
                    t: 'kv',
                    rows: [
                        [
                            'Baseline',
                            'CysLTs are high at rest and rise further with aspirin; polyp tissue makes more leukotrienes than non-AERD polyps, scaling with severity. **LTE4** (stable end metabolite) recruits eosinophils and its urinary level tracks the size of the bronchospasm.',
                        ],
                        [
                            'PGE2',
                            'Normally a checkpoint on 5-LO and mast cell activation. AERD patients are relatively PGE2-deficient, and what they make depends disproportionately on COX-1, so NSAIDs strip the last of it.',
                        ],
                        [
                            'PGD2',
                            'High at baseline, rises with reactions; highest levels go with the worst extra-respiratory symptoms. Its metabolite 9α,11β-PGF2 bronchoconstricts; PGD2 pulls eosinophils, basophils, and ILC2s into tissue.',
                        ],
                        [
                            'Epithelial cytokines',
                            '**IL-33 and TSLP** are overexpressed in AERD polyps. TSLP drives mast cell PGD2 production. Blocking IL-33 and TSLP prevents aspirin-induced lung function changes in models.',
                        ],
                        [
                            'Mast cells',
                            'Urinary LTE4 rises in step with histamine, tryptase, PGD2 during reactions.',
                        ],
                        [
                            'Platelets',
                            'Adhere to neutrophils, monocytes, eosinophils; carry **LTC4 synthase**, so they make CysLTs transcellularly. Basis of ifetroban and prasugrel trials.',
                        ],
                        [
                            '15-LOX-1',
                            'Epithelial 15-lipoxygenase-1 → 15-HETE → (via mast cells) 15-oxo-ETE; emerging biomarker and part of the broader eicosanoid imbalance. [[src|CTA 2026]]',
                        ],
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/transcellular-ltc4.svg',
                    alt: 'A neutrophil with 5-LO and FLAP makes LTA4 but has no LTC4 synthase; an adherent platelet has LTC4 synthase but no 5-LO. Joined by P-selectin, the pair converts LTA4 to LTC4, then LTD4 and LTE4, increased in AERD.',
                    label: 'Figure · transcellular LTC4 synthesis',
                    cap: 'Schematic. The Platelets entry above, drawn: why antiplatelet drugs were trialled in AERD.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: '**Selective COX-2 inhibitors** (celecoxib) generally do not trigger reactions because AERD reactions depend on COX-1 inhibition. They need a prescription, so patients often don\'t know they exist.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'Paradox worth knowing',
                    blocks: [
                        { t: 'p', x: 'High-dose daily aspirin after desensitization *raised* markers of type 2 inflammation in one prospective study while it reduced nasal symptoms. The mechanism of desensitization is still not understood. [[src|LIO · Cahill 2019]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why does aspirin cause bronchospasm in AERD but celecoxib usually doesn\'t?', a: 'AERD PGE2 depends on COX-1. Blocking COX-1 removes the PGE2/EP2 brake on 5-LO and mast cells, releasing CysLTs and PGD2. Selective COX-2 inhibition spares that COX-1 PGE2.' },
                { t: 'check', id: 'c2', q: 'Which cell type supplies LTC4 synthase for transcellular CysLT synthesis?', a: 'Platelets adherent to leukocytes (also mast cells and eosinophils).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q3'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['pge2-brake', 'cox-selectivity', 'cysteinyl-leukotrienes'],
                },
            ],
        },
        {
            id: 'ae-3',
            n: '7.3',
            title: 'Diagnosis and the aspirin challenge',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'Polyps (endoscopy) and asthma (PFTs) are easy to confirm. With **more than one** clear reaction to aspirin or NSAIDs, AERD can be diagnosed clinically.',
                        'No exposure or an ambiguous history → **physician-observed oral aspirin challenge**.',
                        'Typical provoking dose 30–150 mg (average 60–75 mg). Start 20–40 mg; most react between 45 and 100 mg, 30–60 min after the provoking dose. No new reactions appear at ≥650 mg.',
                        '**Brigham 1-day protocol**: start 40.5 mg, dose every 90 min, PROMs + spirometry + vitals before each dose, until a reaction or 325 mg is reached; ~9 hours.',
                        'FEV1 measured every 30 min to 120 min after the last dose. **Positive: FEV1 drop >20%** (or a clear clinical reaction). No reaction at any dose = not aspirin-sensitive.',
                        '**Pretreatment** with montelukast and zileuton gave 10–20% higher FEV1 and milder lower-airway reactions.',
                        'Outpatient in experienced centers. Consider **inpatient** with β-blockers, recent MI, or severe asthma.',
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Trap',
                    blocks: [
                        { t: 'p', x: 'Leukotriene modifiers blunt the bronchial reaction during challenge. That makes challenges safer, but a reaction may then show up mainly as nasal or ocular symptoms; read upper-airway responses as positive.' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/challenge-reading.svg',
                    alt: 'Decision tree: no reaction through 325 mg in a 1-day protocol (or 650 mg or more in a multi-day protocol) is negative. A reaction with an FEV1 fall of 20% or more is positive. A clear naso-ocular reaction without that fall is positive by the EAACI definition. Mild or nonspecific symptoms alone are not positive. A note records the discrepancy between definitions and the effect of leukotriene-modifier pretreatment.',
                    label: 'Figure · reading an aspirin challenge',
                    cap: 'Schematic. The naso-ocular branch is the trap above: on leukotriene modifiers the reaction may be mainly nasal or ocular.',
                },
                { t: 'check', id: 'c1', q: 'What FEV1 change defines a positive aspirin challenge?', a: 'A fall of more than 20%.' },
                { t: 'check', id: 'c2', q: 'Three reasons to do the challenge as an inpatient?', a: 'β-blocker use, recent myocardial infarction, severe asthma.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q15'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['challenge-indications', 'challenge-protocol', 'challenge-reading'],
                },
            ],
        },
        {
            id: 'ae-4',
            n: '7.4',
            title: 'Surgery',
            blocks: [
                {
                    t: 'ul',
                    items: [
                        'ESS removes polyps and widens ostia so topical steroids reach the mucosa. Without postoperative medical therapy, recurrence is rapid; surgery alone gives an initial gain then high recurrence.',
                        'After ESS: **urinary LTE4 falls, PGE2 rises**, and desensitization reactions are milder.',
                        '**Draf III** (endoscopic modified Lothrop: frontal sinus floor from lamina papyracea to lamina papyracea, superior septum, intersinus septum): symptom improvement 82% overall, 76% as salvage; AERD patients more likely to improve than non-AERD. AERD patients fail traditional ESS without Draf III more often.',
                        'In a prospective AERD Draf III cohort (n = 31), 18 (58%) had polyp recurrence and 7 needed revision Draf III at a mean 45 months; AERD carried higher recurrence risk than non-AERD.',
                        'Coordinate with allergy: if already on aspirin, plan either stop-and-redesensitize after ESS or continue through surgery.',
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/ar-crs-aerd/draf-extent.svg',
                    alt: 'Four coronal schematics of the frontal sinuses, ethmoid cells, middle turbinates, lamina papyracea and septum with the removed bone shaded red. Draf I clears the frontal recess and leaves the frontal ostium. Draf IIa opens the frontal floor from the lamina papyracea to the middle turbinate. Draf IIb opens it from the lamina papyracea to the nasal septum. Draf III opens both floors from lamina to lamina and removes the superior nasal septum and the intersinus septum. A note gives the AERD outcomes.',
                    label: 'Figure · Draf I to III',
                    cap: 'Schematic. Draf III as defined above; Draf I to IIb are standard definitions added for contrast.',
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Numbers check',
                    blocks: [
                        { t: 'p', x: 'The LIO review reports the revision rate as 7 patients (28%). Seven of 31 is 22.6%; the 28% likely uses a smaller follow-up denominator. Quote “7 patients” rather than the percentage.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What two lipid mediator changes follow ESS in AERD?', a: 'Urinary LTE4 decreases and PGE2 increases (and desensitization reactions are milder).' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q21'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['ess', 'draf-iii'],
                },
            ],
        },
        {
            id: 'ae-5',
            n: '7.5',
            title: 'Aspirin desensitization and daily aspirin (ATAD)',
            blocks: [
                {
                    t: 'kv',
                    rows: [
                        [
                            'When',
                            '**2–4 weeks after ESS**: lower leukotriene-producing polyp burden makes it safer and more effective.',
                        ],
                        [
                            'How',
                            'One day in a properly equipped clinic: 40.5 mg upward to 325 mg; reactions become milder and shorter with each step; above 325 mg reactions generally stop. European protocols use 50/100 mg steps (up to 800 mg).',
                        ],
                        [
                            'Then',
                            '**Daily aspirin for life.** Desensitization is lost if aspirin is stopped for **>48 hours**. Maintenance doses in studies range from 100 to 650 mg daily; lower doses may help adherence. [[src|NEJM]]',
                        ],
                        [
                            'Benefits',
                            'Slower polyp regrowth, longer surgery-free intervals, better smell, less steroid use. Meta-analysis: SNOT-22 improved by 10.27 points (95% CI 6.39–14.15). [[src|LIO · Chu 2019]]',
                        ],
                        [
                            'Harms',
                            'Asthma exacerbation, gastritis, bleeding, enough to stop the drug. Up to 50% discontinue in trials; real-world ATAD discontinuation ~40% vs ~20% for biologics, and ~25% move from ATAD to a biologic. [[src|NEJM · CTA 2026]]',
                        ],
                        [
                            'EPOS',
                            '1a: better than placebo for QOL and nasal symptoms, but the SNOT difference did not reach the MCID. Use when you are confident about adherence. Nasal lysine-aspirin and platelet inhibitors: not advised.',
                        ],
                    ],
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/challenge-timeline.svg',
                    alt: 'Timeline of the Brigham 1-day protocol, aspirin 40.5, 81, 162.5 and 325 mg every 90 minutes with symptom scores, vital signs and spirometry before each dose. Row A: no reaction through 325 mg, negative. Row B: a reaction at 81 mg 30 to 60 minutes after the dose, treated, then the dose repeated and escalated to 325 mg, desensitized.',
                    label: 'Figure · the 1-day challenge and desensitization',
                    cap: 'Schematic. Challenge and desensitization are the same day; a reaction becomes the starting point for desensitizing.',
                },
                {
                    t: 'figure',
                    src: 'img/oksat/aerd-biologics/atad-timeline.svg',
                    alt: 'Timeline from ESS at day 0, when urinary LTE4 falls and PGE2 rises, to desensitization 2 to 4 weeks later, then daily aspirin indefinitely. A gap of more than 48 hours off aspirin loses tolerance and requires supervised re-desensitization.',
                    label: 'Figure · when to desensitize, and the 48-hour rule',
                    cap: 'Schematic. Doses on the figure are one US regimen; trials range from 100 to 650 mg daily.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Board pearl',
                    blocks: [
                        { t: 'p', x: 'Missed doses matter: **>48 h off aspirin = re-desensitize** before restarting. Plan around surgery, GI bleeds, and anticoagulation.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Ideal timing of desensitization relative to ESS, and why?', a: '2–4 weeks after surgery, when the leukotriene-producing polyp load is lowest, so reactions are milder and the effect is best.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q26'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['atad-efficacy', 'atad-maintenance'],
                },
            ],
        },
        {
            id: 'ae-6',
            n: '7.6',
            title: 'Steroids, leukotriene modifiers, diet, and the rest',
            blocks: [
                {
                    t: 'table',
                    head: ['Option', 'Mechanism', 'Evidence / caution'],
                    rows: [
                        [
                            'INCS spray or **budesonide irrigation**',
                            'Fewer mucosal eosinophils and mast cells',
                            'Budesonide in rinses improves smell and CT polyp burden; rarely enough alone.',
                        ],
                        [
                            'Inhaled corticosteroids',
                            'Asthma control',
                            'Often insufficient alone; better with leukotriene modifiers.',
                        ],
                        [
                            'Oral steroid bursts',
                            'Broad suppression',
                            'Rapid relief; cumulative endocrine, bone, neurologic toxicity.',
                        ],
                        [
                            '**Montelukast**',
                            'CysLT1 receptor antagonist',
                            'FEV1 +10.2%, PEF +25.5 L/min, fewer daytime symptoms, better asthma QOL. Does not lower LTE4 production. Boxed warning (neuropsychiatric).',
                        ],
                        [
                            '**Zileuton**',
                            '5-LO inhibitor → all CysLTs down, including LTE4',
                            'FEV1 rise >20% within hours, less nasal dysfunction, return of smell, blunted aspirin bronchospasm; more effective than montelukast. **Monitor liver enzymes** (self-limited hepatotoxicity).',
                        ],
                        [
                            'Diet',
                            'Shift fatty acid substrate',
                            '2-week high omega-3 / low omega-6 diet lowered leukotrienes (pilot). Low-salicylate diet improved endoscopic scores (EPOS 1b). **Avoid alcohol.**',
                        ],
                        [
                            'Allergen immunotherapy',
                            '—',
                            'More than half of AERD patients on AIT for comorbid allergy found it ineffective for AERD; 8% found it extremely effective.',
                        ],
                        [
                            'Investigational',
                            'Platelet pathway',
                            'Ifetroban (thromboxane receptor antagonist); prasugrel (reduces transcellular CysLTs) for reaction severity.',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**Zileuton zaps the Z-enzyme upstream** (5-LO, so LTE4 falls); **montelukast** only **mutes** the receptor (LTE4 still made).' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Which leukotriene modifier lowers urinary LTE4, and what lab must you follow?', a: 'Zileuton (5-LO inhibitor); monitor liver function tests.' },
                {
                    t: 'practice',
                    title: 'Apply it',
                    refs: ['aerd-biologics:q28'],
                },
            ],
            drill: [
                {
                    m: 'aerd-biologics',
                    c: ['leukotriene-modifiers', 'non-drug-measures'],
                },
            ],
        },
    ],
};
