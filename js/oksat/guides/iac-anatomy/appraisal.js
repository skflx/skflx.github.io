/* =============================================================
   The evidence
   OKSAT · Interactive learning · iac-anatomy · chapter 8
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'appraisal',
    title: 'The evidence',
    kicker: '8 · Appraisal',
    review: 'draft',
    lede: 'Where published numbers, cutoffs and clinical series disagree, why their methods differ, and what this guide adopts.',
    src: 'House Clinic Atlas Ch. 3, 6 · Kirtane Ch. 31 · Stanford Atlas · PubMed primary series · Radiopaedia',
    tldr: [
        'Published **IAC** and **BCNC** cutoffs vary because CT series measure at different planes and landmarks (mid-canal, porus, or opening width).',
        '"90°" versus "180°" rotation reflects whether an author tracks the VIII bundle or the facial nerve and from which viewpoint.',
        'Transition-zone distances and nerve-of-origin percentages shift with histological landmark definitions and tumour size at surgery.',
        'Middle fossa size limits are institutional conventions, and the Gantz Bell\'s decompression series used non-randomized, self-selected controls.',
    ],
    sections: [
        {
            id: 'apr-cutoffs',
            n: '8.1',
            title: 'IAC size cutoffs',
            blocks: [
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: 'IAC width norms, stenosis and flaring',
                            blocks: [
                                { t: 'p', x: '**Claim:** What counts as a normal, stenotic, flared, or asymmetric **IAC**.' },
                                { t: 'p', x: '**Sources and numbers:** Normal 4–8 mm, stenosis < 2 mm or < 3 mm, flaring > 8 mm (some series > 9 mm), and asymmetry > 2 mm [[src|Owner]] [[src|El Sadik 2017, PMID 27665959]] [[src|Ionescu 2023, PMID 38137649]], versus measured CT means: adult vertical diameter 4.47 mm in 110 CTs [[src|Marques 2012, PMID 23329967]] and mid-diameter 4.2 mm in 162 CTs [[src|Gözen 2026, PMID 41682992]].' },
                                { t: 'p', x: '**Design and why they differ:** CT series differ in imaging plane and where along the canal they measure (mid-canal versus porus versus opening width).' },
                                { t: 'p', x: '**What this guide teaches:** The owner\'s cutoffs (4–8 mm normal, < 2 mm or < 3 mm stenosis, > 8 mm or > 9 mm flaring, > 2 mm asymmetry), measured perpendicular to the canal\'s long axis. [[src|Owner]]' },
                            ],
                        },
                        {
                            h: 'BCNC stenosis cutoff',
                            blocks: [
                                { t: 'p', x: '**Claim:** The bony cochlear nerve canal (**BCNC**) diameter threshold for stenosis.' },
                                { t: 'p', x: '**Sources and numbers:** **BCNC** < 1.4 mm [[src|Stjernholm 2002, PMID 11876597]], versus other series (Fatterpekar 2000 found smaller canals in **SNHL** without stating a cutoff in its abstract [[src|Fatterpekar 2000, PMID 10751494]]).' },
                                { t: 'p', x: '**Design and why they differ:** Stjernholm 2002 combined temporal bone casts with CT.' },
                                { t: 'p', x: '**What this guide teaches:** < 1.4 mm as the BCNC stenosis cutoff. [[src|Stjernholm 2002, PMID 11876597]]' },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why can two papers disagree on "normal" IAC width?', a: 'They use different imaging planes and measure at different landmarks (mid-canal versus porus versus opening width).' },
                { t: 'check', id: 'c2', q: 'What specimens and imaging did Stjernholm 2002 combine for the < 1.4 mm BCNC cutoff?', a: 'Temporal bone casts plus CT.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['apr-cutoffs'] }],
        },
        {
            id: 'apr-rotation',
            n: '8.2',
            title: 'How far the nerves turn',
            blocks: [
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: 'Degree of intracanalicular rotation',
                            blocks: [
                                { t: 'p', x: '**Claim:** How many degrees the nerves turn inside the internal auditory canal.' },
                                { t: 'p', x: '**Sources and numbers:** About 90° inside the canal, right ear counterclockwise tracing fundus to brainstem, viewed from medial [[src|Owner]] [[src|Silverstein 1986, PMID 3108792]] [[src|Schefter & Harner 1986, PMID 3963686]], versus "gradual 180°" in the Stanford/Jackler atlas caption [[src|ST6]], versus the facial nerve rotating 0° (none) in 37% and 30–90° in 63% across 30 temporal bones [[src|Tian 2008]].' },
                                { t: 'p', x: '**Design and why they differ:** Cadaver dissection versus surgical observation, and whether "rotation" refers to the CN VIII bundle or to CN VII, and from which viewpoint.' },
                                { t: 'p', x: '**What this guide teaches:** About 90° rotation for CN VIII (not 180°). [[src|Owner]]' },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why might an atlas say 180°?', a: 'It tracks a different structure or uses a different reference frame; 180° is not normal CN VIII anatomy.' },
                { t: 'check', id: 'c2', q: 'What did Tian 2008 show about the facial nerve\'s position across 30 temporal bones?', a: 'It rotated 0° (none) in 37% and 30–90° in 63%.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['apr-rotation'] }],
        },
        {
            id: 'apr-orz',
            n: '8.3',
            title: 'The transition zone',
            blocks: [
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: 'Obersteiner-Redlich transition-zone distance',
                            blocks: [
                                { t: 'p', x: '**Claim:** Distance from the brainstem to the central-to-peripheral myelin transition zone on CN VIII and CN VII, and whether vestibular schwannomas arise there.' },
                                { t: 'p', x: '**Sources and numbers:** CN VIII 9–14 mm and CN VII 2–3 mm [[src|Radiopaedia]], versus 3.6 mm (CN VIII) and 3.7 mm (CN VII) measured by histomorphometry at "maximum convexity" [[src|Gupta 2023, PMID 37399929]].' },
                                { t: 'p', x: '**Design and why they differ:** Measurements depend on where along the nerve the measurement is taken and how the central-to-peripheral myelin junction is defined histologically.' },
                                { t: 'p', x: '**What this guide teaches:** The Radiopaedia distances (VIII 9–14 mm, VII 2–3 mm) [[src|Radiopaedia]], and that tumour origin at the transition zone is a myth [[src|Xenellis & Linthicum 2003, PMID 12544018]].' },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Is the transition zone the schwannoma\'s birthplace?', a: 'No; that is a myth.' },
                { t: 'check', id: 'c2', q: 'Why did Gupta 2023 report ~3.6–3.7 mm for both VIII and VII instead of 9–14 mm vs 2–3 mm?', a: 'Gupta 2023 used a different histological definition of where the central-to-peripheral myelin junction is measured (at maximum convexity).' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['apr-orz'] }],
        },
        {
            id: 'apr-origin',
            n: '8.4',
            title: 'Superior or inferior vestibular nerve',
            blocks: [
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: 'Nerve of origin in vestibular schwannoma',
                            blocks: [
                                { t: 'p', x: '**Claim:** Whether vestibular schwannomas arise more often from the inferior vestibular nerve (**IVN**) or the superior vestibular nerve (**SVN**).' },
                                { t: 'p', x: '**Sources and numbers:** **IVN** in 84.8% of 271 translabyrinthine cases [[src|Komatsuzaki 2001, PMID 11410128]] and "up to 91%" [[src|K31]], versus "usually **SVN**" [[src|HCA6 p81]].' },
                                { t: 'p', x: '**Design and why they differ:** Translabyrinthine series identify the nerve of origin intraoperatively, and large tumours obscure the nerve (5.6% undetermined in Komatsuzaki 2001). [[src|Komatsuzaki 2001, PMID 11410128]]' },
                                { t: 'p', x: '**What this guide teaches:** IVN is commonest. [[src|Komatsuzaki 2001, PMID 11410128]] [[src|K31]]' },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What limits nerve-of-origin data?', a: 'Data come from surgical series only, and large tumours obscure the nerve (5.6% undetermined).' },
                { t: 'check', id: 'c2', q: 'How do Komatsuzaki 2001 / Kirtane and the House Clinic Atlas disagree on nerve of origin?', a: 'Komatsuzaki (84.8%) and Kirtane (up to 91%) find the inferior vestibular nerve commonest; the House Clinic Atlas states the superior vestibular nerve.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['apr-origin'] }],
        },
        {
            id: 'apr-mcf-bell',
            n: '8.5',
            title: 'MCF size and Bell\'s decompression',
            blocks: [
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: 'Middle fossa tumour size cutoff',
                            blocks: [
                                { t: 'p', x: '**Claim:** Upper tumour-size threshold for a middle cranial fossa (**MCF**) approach.' },
                                { t: 'p', x: '**Sources and numbers:** ≤ 2 cm (House Clinic) [[src|HCA3 p40, p50–51]] versus < 1.5 cm (Sanna group) [[src|K31]].' },
                                { t: 'p', x: '**Design and why they differ:** Institutional practice conventions rather than randomized trials.' },
                                { t: 'p', x: '**What this guide teaches:** Both limits reflect institutional practice, not trials. [[src|HCA3 p40]] [[src|K31]]' },
                            ],
                        },
                        {
                            h: 'Bell\'s palsy decompression (Gantz 1999)',
                            blocks: [
                                { t: 'p', x: '**Claim:** Recovery rate after middle fossa facial nerve decompression in severe Bell\'s palsy.' },
                                { t: 'p', x: '**Sources and numbers:** 91% HB I–II after decompression versus 58% poor outcome (HB III–IV) in controls who declined; decompression within 14 days [[src|Gantz 1999, PMID 10443817]].' },
                                { t: 'p', x: '**Design and why they differ:** Prospective series, but non-randomized with self-selected controls and small groups. [[src|Gantz 1999, PMID 10443817]]' },
                                { t: 'p', x: '**What this guide teaches:** Decompression within 14 days as the criterion, taught with its non-randomized, self-selected control design stated explicitly. [[src|Gantz 1999, PMID 10443817]]' },
                            ],
                        },
                        {
                            h: 'MCF landmark angles',
                            blocks: [
                                { t: 'p', x: '**Claim:** Surgical angles used to localize the IAC from the middle cranial fossa floor.' },
                                { t: 'p', x: '**Sources and numbers:** Fisch angle 73.5 ± 11.7° and Garcia-Ibañez angle 126 ± 12° (bisector 63°) on CT [[src|Sahana 2023, PMID 37141941]], versus 45–60° [[src|HCA3]]; cadaver work shows wide individual variation [[src|Maina 2007, PMID 18449332]].' },
                                { t: 'p', x: '**Design and why they differ:** The angle values come from different measurement designs, and individual variation is wide.' },
                                { t: 'p', x: '**What this guide teaches:** Wide individual variation in these angles. [[src|HCA3]] [[src|Sahana 2023, PMID 37141941]] [[src|Maina 2007, PMID 18449332]]' },
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is the main weakness of the Gantz 1999 Bell\'s palsy decompression series?', a: 'Controls were self-selected, with no randomization and small groups.' },
                { t: 'check', id: 'c2', q: 'Are the ≤ 2 cm (House Clinic) versus < 1.5 cm (Sanna) middle fossa size cutoffs based on randomized trials?', a: 'No; they reflect institutional practice.' },
            ],
            drill: [{ m: 'iac-anatomy', c: ['apr-mcf-bell'] }],
        },
    ],
};
