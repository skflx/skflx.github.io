/* =============================================================
   What travels with allergic rhinitis
   OKSAT · Interactive learning · AR · CRS · AERD · chapter 9
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'comorbidities',
    title: 'What travels with allergic rhinitis',
    kicker: '9 · Associated conditions',
    lede: 'The high-yield associations: asthma, pollen–food syndrome, eye, ear, sleep, and the conditions that change treatment choice.',
    src: 'ICAR §XIII · EPOS §1.8',
    tldr: [
        'AR and asthma share one airway; treating AR with asthma allows LTRA + INCS as an option.',
        '**Pollen–food allergy syndrome**: birch → apple, stone fruit, carrot, celery, hazelnut (Bet v 1 ↔ Mal d 1). Heat-labile, so cooked food is usually tolerated and commercial fruit extracts test poorly.',
        'Intranasal antihistamines beat INCS for eye symptoms; INCS still help ocular symptoms.',
        'SLIT tablets are contraindicated in EoE.',
    ],
    sections: [
        {
            id: 'as-1',
            n: '9.1',
            title: 'Pollen–food allergy syndrome',
            blocks: [
                { t: 'p', x: 'IgE to a pollen protein cross-reacts with a homologous plant food protein, causing transient oral itch, perioral hives, angioedema, rarely systemic symptoms. Prevalence 4.7% to over 20% of pollen-allergic children and 13–58% of adults; longer AR duration raises risk. [[src|ICAR XIII.E.1]]' },
                {
                    t: 'table',
                    head: ['Pollen', 'Cross-reactive foods'],
                    rows: [
                        [
                            '**Birch**',
                            'Apple, apricot, cherry, peach, pear, plum, kiwi; carrot, celery, parsley; peanut, soybean; almond, hazelnut',
                        ],
                        ['**Timothy / orchard grass**', 'Peach, watermelon, orange, tomato; white potato'],
                        [
                            '**Ragweed**',
                            'Cantaloupe, honeydew, watermelon, banana; cucumber, white potato, zucchini',
                        ],
                        [
                            '**Mugwort**',
                            'Bell pepper, broccoli, cabbage, cauliflower, chard, garlic, onion, parsley; aniseed, caraway, coriander, fennel, black pepper',
                        ],
                    ],
                    wide: 1,
                },
                {
                    t: 'ul',
                    items: [
                        'Gold standard: double-blind food challenge (confounded by look, texture, taste). Commercial fruit/vegetable extracts are unreliable because the allergens are heat-labile.',
                        'CRD sharpens risk (e.g., Ara h 2 for true peanut allergy). Systemic reactions and anaphylaxis occur in a minority (reported ~2–10%), so take the history seriously.',
                        'Treatment: identify and avoid the offending raw foods.',
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Memory hook',
                    blocks: [
                        { t: 'p', x: '**Ragweed → “melons and bananas”** (and cucumber, zucchini). **Birch → “apple in the orchard”** plus carrot and celery.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Molecular basis of birch–apple cross-reactivity?', a: 'Sequence homology between Bet v 1 (birch, PR-10) and Mal d 1 (apple).' },
                { t: 'check', id: 'c2', q: 'Which pollen cross-reacts with melons and banana?', a: 'Ragweed.' },
            ],
            drill: [
                {
                    m: 'allergy-testing',
                    c: ['food-syndromes'],
                },
            ],
        },
        {
            id: 'as-2',
            n: '9.2',
            title: 'Airway, eye, ear, sleep',
            blocks: [
                {
                    t: 'table',
                    head: ['Condition', 'Link to AR', 'Practical point'],
                    rows: [
                        [
                            'Asthma',
                            'Unified airway; AR often precedes asthma; AIT reduces short-term asthma risk',
                            'INCS + LTRA is an option only with asthma; AIT is contraindicated while asthma is uncontrolled',
                        ],
                        [
                            'Rhinosinusitis',
                            'Strong for CCAD and AFRS; weak for CRSwNP/CRSsNP',
                            'Treat comorbid AR optimally; allergy testing in CCAD and AFRS',
                        ],
                        [
                            'AERD',
                            'Positive allergy history/testing common (~77–83% in one series)',
                            'AIT rarely improves the AERD component',
                        ],
                        [
                            'Allergic conjunctivitis',
                            'Shared IgE mechanism',
                            'Intranasal antihistamine better than INCS for ocular symptoms; INCS also reduce them',
                        ],
                        ['Atopic dermatitis', 'Allergic march', 'Extensive eczema can force serum sIgE instead of SPT'],
                        [
                            'Adenoid hypertrophy',
                            'HDM sensitization associated in some regions',
                            'Main pediatric differential for chronic “rhinitis”',
                        ],
                        [
                            'ETD, otitis media',
                            'Mucosal inflammation at the torus; the evidence is mixed',
                            'Relationship to ear disease is a stated ICAR knowledge gap',
                        ],
                        [
                            'Cough, laryngeal disease',
                            'Postnasal drainage, shared inflammation',
                            'Treatment effect of AR on cough is a knowledge gap',
                        ],
                        ['Eosinophilic esophagitis', 'Aeroallergens implicated', '**Contraindication to SLIT tablets**'],
                        ['Sleep disturbance, OSA', 'Congestion fragments sleep', 'Treating AR improves sleep (B)'],
                    ],
                    wide: 1,
                },
                { t: 'check', id: 'c1', q: 'A grass-allergic patient with EoE asks about the grass SLIT tablet. Answer?', a: 'Contraindicated (EoE). Discuss SCIT instead if AIT is indicated.' },
            ],
        },
    ],
};
