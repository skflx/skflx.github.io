/* =================================================================
   Otoplasty & Auricular Deformity
   OKSAT · Facial Plastics & Recon Module
   ================================================================= */
/* Source: Kennedy KL, Hohman MH, Katrib Z. Otoplasty. StatPearls
   [Internet], last updated 2025-02-03 (NCBI Bookshelf NBK538320) —
   adapted. Text and figures are CC BY-NC-ND 4.0; figures in
   img/oksat/otoplasty/ are reproduced unmodified, contributed by
   MH Hohman (clinical photos, operative series, diamond block,
   cryptotia repair, ear molding), M Nuara / MH Hohman / A Kopacz
   (Marx classification), M Nuara / T Hadlock / MH Hohman (Nagata
   series), A Kopacz (rib reconstruction table), CM Llewellyn
   (perichondritis); cranial-surface cartilage from Gray's Anatomy
   (public domain).
   Cross-referenced with the sk.oto Obsidian vault (unvetted notes on
   Mustardé/Furnas sutures, Gibson's principle, Brent/Nagata staging,
   porous polyethylene frameworks, auricular hematoma, perichondritis,
   and the hillocks of His; those notes cite Baker, Local Flaps in
   Facial Reconstruction 3e, Ch 22–23, and Cummings). Where the two
   disagree, the explanation says so. */

const meta = {
    title: 'Otoplasty &\nAuricular Deformity',
    subtitle:
        'Auricular anatomy, embryology and innervation, the normative measurements that define prominauris, Mustardé and Furnas suture otoplasty with cartilage-modifying adjuncts, Stahl ear, cryptotia, cauliflower ear, neonatal ear molding, microtia framework reconstruction, early and late complications, and three integrating cases.',
    kicker: 'Self-Assessment · Facial Plastics & Recon Module',
    id: 'otoplasty',
    sources: [
        'Kennedy KL, Hohman MH, Katrib Z. Otoplasty. StatPearls, updated 2025-02-03 (NBK538320) — text and figures, CC BY-NC-ND 4.0',
        'Figures: MH Hohman, M Nuara, T Hadlock, A Kopacz, CM Llewellyn (via StatPearls); Gray’s Anatomy (public domain)',
        'sk.oto vault — otoplasty, microtia, auricular hematoma, perichondritis, and hillocks-of-His notes (unvetted; cite Baker, Local Flaps 3e, and Cummings)',
    ],
};

const DOMAINS = {
    anatomy:       { label: 'Anatomy & Embryology',       color: '#7A5A3A', hex: 'rgba(122,90,58,0.13)' },
    analysis:      { label: 'Analysis & Indications',     color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    prominauris:   { label: 'Prominauris Technique',      color: '#4E6B4A', hex: 'rgba(78,107,74,0.14)' },
    deformities:   { label: 'Other Deformities & Molding', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
    microtia:      { label: 'Microtia Reconstruction',    color: '#9A4B2E', hex: 'rgba(154,75,46,0.14)' },
    complications: { label: 'Complications',              color: '#C06A4A', hex: 'rgba(192,106,74,0.14)' },
    cases:         { label: 'Cases',                      color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {

    // anatomy
    'surface-anatomy':      { label: 'Auricular Surface Anatomy',    domain: 'anatomy' },
    'lobule':               { label: 'Lobule & Inferior Helix',      domain: 'anatomy' },
    'hillocks':             { label: 'Hillocks of His',              domain: 'anatomy' },
    'skin-envelope':        { label: 'Auricular Skin Envelope',      domain: 'anatomy' },
    'sensory-innervation':  { label: 'Sensory Innervation',          domain: 'anatomy' },
    'auricular-block':      { label: 'Auricular (Diamond) Block',    domain: 'anatomy' },

    // analysis & indications
    'auricular-norms':      { label: 'Normative Measurements',       domain: 'analysis' },
    'prominauris':          { label: 'Prominauris',                  domain: 'analysis' },
    'deformity-recognition':{ label: 'Deformity Recognition',        domain: 'analysis' },
    'surgical-timing':      { label: 'Surgical Timing',              domain: 'analysis' },
    'patient-selection':    { label: 'Patient Selection',            domain: 'analysis' },
    'preop-planning':       { label: 'Preoperative Planning',        domain: 'analysis' },

    // prominauris technique
    'skin-excision':        { label: 'Postauricular Skin Excision',  domain: 'prominauris' },
    'mustarde':             { label: 'Mustardé Sutures',             domain: 'prominauris' },
    'furnas':               { label: 'Furnas Sutures',               domain: 'prominauris' },
    'suture-material':      { label: 'Suture Material',              domain: 'prominauris' },
    'cartilage-modifying':  { label: 'Cartilage-Modifying Techniques', domain: 'prominauris' },
    'incisionless':         { label: 'Incisionless Otoplasty',       domain: 'prominauris' },
    'postop-care':          { label: 'Dressing & Headband',          domain: 'prominauris' },

    // other deformities & molding
    'stahl-ear':            { label: 'Stahl Ear Correction',         domain: 'deformities' },
    'cryptotia':            { label: 'Cryptotia Correction',         domain: 'deformities' },
    'cauliflower-ear':      { label: 'Cauliflower Ear',              domain: 'deformities' },
    'ear-molding':          { label: 'Neonatal Ear Molding',         domain: 'deformities' },

    // microtia
    'marx':                 { label: 'Marx Classification',          domain: 'microtia' },
    'framework-choice':     { label: 'Autologous vs Alloplastic',    domain: 'microtia' },
    'microtia-staging':     { label: 'Tanzer / Brent / Nagata Staging', domain: 'microtia' },
    'tpf-flap':             { label: 'Temporoparietal Fascia Flap',  domain: 'microtia' },
    'microtia-sequencing':  { label: 'Framework–Atresia Sequencing', domain: 'microtia' },
    'construct-complications': { label: 'Framework Complications',  domain: 'microtia' },

    // complications
    'hematoma':             { label: 'Postoperative Hematoma',       domain: 'complications' },
    'perichondritis':       { label: 'Perichondritis',               domain: 'complications' },
    'contour-deformities':  { label: 'Contour Deformities',          domain: 'complications' },
    'symmetry':             { label: 'Symmetry Targets',             domain: 'complications' },
    'suture-extrusion':     { label: 'Suture Extrusion & Chronic Pain', domain: 'complications' },

    // cases
    'case-prominauris':     { label: 'Case: School-Age Prominauris', domain: 'cases' },
    'case-neonate':         { label: 'Case: Neonatal Deformity',     domain: 'cases' },
    'case-microtia':        { label: 'Case: Grade III Microtia',     domain: 'cases' },
};

const ITEMS = [

// ════════════════ ANATOMY & EMBRYOLOGY ════════════════

{
    id: 'q1', type: 'recall', section: 'Anatomy & Embryology',
    stem: 'The helical crus (root) divides the conchal bowl into two named parts. Name them, and state which lies superior.',
    answer: `• Cymba concha — superior to the helical crus
• Cavum concha — inferior to the helical crus, leading into the external auditory meatus`,
    brief: 'The helical crus is the landmark that splits the concha; overtightened Furnas sutures over a prominent mastoid can create an unnatural fold exactly between cymba and cavum.',
    detailed: 'The helix begins as the crus (root) arising from the conchal floor, then spirals anteriorly, superiorly, posteriorly, and inferiorly toward the lobule. The antihelix is the curvilinear fold between helix and concha; superiorly it divides into superior and inferior crura that, with the helix, bound the triangular fossa. The scaphoid fossa separates helix from antihelix. Pearl: when you set the concha back with Furnas sutures against a prominent mastoid, watch the cymba–cavum junction — that is where overtightening buckles the bowl.',
    explanationImage: 'img/oksat/otoplasty/auricle-surface-anatomy.jpg',
    explanationImageAlt: 'Labeled lateral view of the auricle: helix, antihelix with superior and inferior crura, triangular fossa, crus helicis, tragus, intertragal incisura, antitragus, lobule, cavum and cymba concha, scaphoid fossa, and Darwin tubercle',
    concepts: ['surface-anatomy'],
},
{
    id: 'q2', type: 'mcq', section: 'Anatomy & Embryology',
    stem: 'The superior and inferior crura of the antihelix, together with the helix, bound which depression of the auricle?',
    options: [
        { id: 'a', text: 'Scaphoid fossa' },
        { id: 'b', text: 'Triangular fossa' },
        { id: 'c', text: 'Cymba concha' },
        { id: 'd', text: 'Intertragal incisura' },
    ],
    correct: 'b',
    brief: 'The triangular fossa sits between the two antihelical crura beneath the helix.',
    detailed: 'The antihelix ends inferiorly at the antitragus and divides superiorly into the superior and inferior crura. The triangle they enclose with the overlying helix is the triangular fossa. The scaphoid fossa lies between helix and antihelix; the cymba concha lies below the inferior crus, above the helical crus; the intertragal incisura is the notch between tragus and antitragus. Pearl: in prominauris the inferior crus is usually well formed even when the superior crus is effaced — so the Mustardé suture that recreates the superior crus is the one that restores the triangular fossa.',
    concepts: ['surface-anatomy'],
},
{
    id: 'q3', type: 'mcq', section: 'Anatomy & Embryology',
    stem: 'The inferior helix looks like a continuous ridge but loses its cartilage below one structure — the same structure resected when the lobule still projects after setback. Name it.',
    options: [
        { id: 'a', text: 'Spina helicis' },
        { id: 'b', text: 'Ponticulus' },
        { id: 'c', text: 'Cauda helicis' },
        { id: 'd', text: 'Eminentia conchae' },
    ],
    correct: 'c',
    brief: 'Below the cauda helicis the helix is soft tissue only; the cauda itself props the lobule laterally.',
    detailed: 'The cauda helicis is the inferior tail of helical cartilage, separated from the antitragus by a fissure (visible on the cranial surface of the cartilage). Below it, the "helix" is fibrofatty tissue continuous with the lobule. Because the cauda continues to press the lobule outward after the conchal bowl and antihelix are medialized, resecting it is the most effective fix for an outstanding lobule. Pearl: you cannot suture-shape the inferior ear the way you shape the upper two-thirds — there is no cartilage there to hold a suture.',
    explanationImage: 'img/oksat/otoplasty/auricular-cartilage-cranial.jpg',
    explanationImageAlt: 'Gray’s Anatomy drawing of the cranial (medial) surface of the right auricular cartilage, labeling the spina helicis, sulcus antihelicis transversus, eminentia conchae, ponticulus, cauda helicis, and cartilage of the meatus',
    concepts: ['lobule', 'surface-anatomy'],
},
{
    id: 'q4', type: 'mcq', section: 'Anatomy & Embryology',
    stem: 'The six hillocks of His appear around gestational week 6. Hillocks 1–3 arise from which pharyngeal arch, and which structure does hillock 1 form?',
    options: [
        { id: 'a', text: 'First arch — tragus' },
        { id: 'b', text: 'Second arch — tragus' },
        { id: 'c', text: 'First arch — lobule' },
        { id: 'd', text: 'Second arch — antitragus' },
    ],
    correct: 'a',
    brief: 'Hillocks 1–3 are first-arch (tragus, helical crus, helix); hillocks 4–6 are second-arch. Hillock 1 is the tragus.',
    detailed: 'The first row of hillocks (1–3) shares its first-arch origin with Meckel cartilage, which is why microtia travels with hemifacial microsomia. Hillock 1 → tragus, 2 → helical crus, 3 → helix — sources agree on these. The second-arch assignments are contested: StatPearls gives 4 → antihelical crura, 5 → antihelical stem, 6 → antitragus, and states that the cartilage-free lobule does not arise from the hillocks at all; the sk.oto vault and the Pediatric Hearing Loss module (following Cummings) give 4 → antihelix, 5 → antitragus, 6 → lobule. Pearl: commit the uncontested half (1–3, first arch, tragus first) and know that the 4–6 mapping is a known point of disagreement rather than a fact to argue on an exam.',
    concepts: ['hillocks'],
},
{
    id: 'q5', type: 'mcq', section: 'Anatomy & Embryology',
    stem: 'Why is standard otoplasty dissection performed through a postauricular incision rather than on the anterior face of the auricle?',
    options: [
        { id: 'a', text: 'The posterior skin lies on a loose areolar layer and hides the scar; the anterior skin is tightly adherent to cartilage' },
        { id: 'b', text: 'The anterior perichondrium carries the only blood supply to the cartilage' },
        { id: 'c', text: 'The facial nerve branches to the intrinsic muscles run under the anterior skin' },
        { id: 'd', text: 'Posterior cartilage cannot be scored, so it must be sutured' },
    ],
    correct: 'a',
    brief: 'Anterior skin is bound to the cartilage; posterior skin glides on areolar tissue — easy to undermine, and the scar sits in the sulcus.',
    detailed: 'Anteriorly, skin adheres tightly to perichondrium, so undermining is difficult and any scar is visible. Posteriorly, a loose areolar layer separates skin from cartilage, giving a supraperichondrial plane to the helical rim (for Mustardé sutures) and toward the mastoid (for Furnas sutures), with the scar hidden in the sulcus. The intrinsic and extrinsic auricular muscles are facial-nerve innervated but functionally irrelevant to the pinna’s form. Pearl: the same tight anterior skin is why an anterior hematoma strips perichondrium so readily — and why cauliflower ear is an anterior-surface disease.',
    concepts: ['skin-envelope'],
},
{
    id: 'q6', type: 'recall', section: 'Anatomy & Embryology',
    stem: 'List the nerves that provide sensation to the auricle and external canal, with their parent nerves.',
    answer: `• Auriculotemporal nerve — V3 (anterior auricle, tragus, anterior helix)
• Great auricular nerve — cervical plexus C2–C3 (posterior–inferior auricle, lobule)
• Lesser occipital nerve — cervical plexus C2 (superior–posterior cranial surface)
• Arnold nerve — auricular branch of the vagus (CN X) (canal, concha)
• Sensory auricular branch of the facial nerve (CN VII) (external auditory meatus, concha)
• Jacobson nerve — tympanic branch of the glossopharyngeal (CN IX) (middle ear)`,
    brief: 'Five nerves from three cranial nerves plus the cervical plexus reach the ear — which is why a single-site injection never anesthetizes it completely.',
    detailed: 'Mechanism: the auricle sits at a watershed of trigeminal, cervical plexus, and branchial (VII, IX, X) sensory territories. Application: under local anesthesia, a circumauricular ring ("diamond") covers the auriculotemporal, great auricular, and lesser occipital nerves, but the conchal bowl and meatus need a separate injection for the VII/X territory. Pearl: Arnold nerve stimulation is the ear–cough reflex you trigger with the speculum.',
    concepts: ['sensory-innervation'],
},
{
    id: 'q7', type: 'mcq', section: 'Anatomy & Embryology',
    stem: 'The circumauricular "diamond" block shown (solid lines anterior, dashed lines posterior) anesthetizes the auriculotemporal, great auricular, and lesser occipital nerves. The extra injection marked X in the conchal bowl targets which nerve?',
    image: 'img/oksat/otoplasty/diamond-block.jpg',
    imageAlt: 'An ear with a red diamond drawn around it: solid lines in front of the ear and above and below it, dashed lines behind the auricle, and a red X in the conchal bowl near the meatus',
    options: [
        { id: 'a', text: 'Great auricular nerve' },
        { id: 'b', text: 'Auriculotemporal nerve' },
        { id: 'c', text: 'Sensory auricular branch of the facial nerve' },
        { id: 'd', text: 'Lesser occipital nerve' },
    ],
    correct: 'c',
    brief: 'The ring covers V3 and the cervical plexus; the conchal injection covers the facial nerve’s sensory auricular branch near the meatus.',
    detailed: 'The diamond’s anterior limbs block the auriculotemporal nerve; the posterior and inferior limbs block the great auricular and lesser occipital nerves. None of those reaches the meatus and conchal floor, which is supplied by the sensory auricular branch of CN VII — the StatPearls target for the X — with overlapping Arnold (CN X) territory in the vault’s account. Inject before measuring? No: measure prominence first, because large volumes distort the auricle, especially anteriorly. Pearl: an adult with prominauris or Stahl ear can be done entirely under this block.',
    concepts: ['auricular-block', 'sensory-innervation'],
},

// ════════════════ ANALYSIS & INDICATIONS ════════════════

{
    id: 'q8', type: 'recall', section: 'Analysis & Indications',
    stem: 'State the normative auricular measurements: height, width, rotation, vertical position, and the three angles used in otoplasty analysis.',
    answer: `• Height 5.5–6.5 cm; width ≈ 55% of height (≈ 35 mm)
• Long axis rotated ≈ 15° posteriorly — the posterior pinna (Darwin tubercle → lobule) parallels the nasal dorsum
• Vertical position: brow level to the nasal ala (auricle length ≈ nasal length)
• Conchomastoid angle ≈ 90°
• Conchoscaphal angle ≈ 90°
• Auriculocephalic angle (skull to helix) 20–30°`,
    brief: 'Prominauris is defined against these norms — typically an auriculocephalic angle beyond 30°.',
    detailed: 'Each angle maps to a maneuver: an obtuse conchoscaphal angle means an effaced antihelix (Mustardé sutures fold it back toward 90°); an increased conchomastoid angle or deep bowl means conchal excess (Furnas sutures ± conchal resection). Sources differ at the margins — the sk.oto vault quotes 30–40° as the prominence threshold and 15–20 mm helix–mastoid distances throughout, the archive graph >25° or >2 cm — so treat the numbers as a frame, not a cutoff. Pearl: the patient sees asymmetry before absolute position.',
    explanationImage: 'img/oksat/otoplasty/auricle-surface-anatomy.jpg',
    explanationImageAlt: 'Labeled lateral view of the auricle showing the landmarks used for otoplasty measurement',
    concepts: ['auricular-norms'],
},
{
    id: 'q9', type: 'mcq', section: 'Analysis & Indications',
    stem: 'Normal helix-to-mastoid distances, measured at the superior pole, the mid-helix, and the superior lobule, are approximately:',
    options: [
        { id: 'a', text: '5 mm / 10 mm / 15 mm' },
        { id: 'b', text: '10–12 mm / 16–18 mm / 20 mm' },
        { id: 'c', text: '20 mm / 20 mm / 20 mm' },
        { id: 'd', text: '25–30 mm / 20 mm / 10 mm' },
    ],
    correct: 'b',
    brief: 'Prominence increases from top to bottom: 10–12 mm superiorly, 16–18 mm mid-helix, ≈ 20 mm at the lobule.',
    detailed: 'These three points are measured preoperatively (before local anesthetic) and again at the end of the case, both sides, to set prominence and symmetry. The progression explains why a uniform setback looks wrong — overcorrecting the middle third relative to the poles produces the telephone-ear deformity. Pearl: aim for left–right agreement within 3 mm at each point; failure to do so is a leading cause of the most common late complication, dissatisfaction.',
    concepts: ['auricular-norms', 'preop-planning'],
},
{
    id: 'q10', type: 'mcq', section: 'Analysis & Indications',
    stem: 'Prominauris — the most common indication for otoplasty — is generally caused by which two anatomic abnormalities?',
    options: [
        { id: 'a', text: 'Effaced antihelical fold and excessive conchal bowl depth' },
        { id: 'b', text: 'Supernumerary antihelical crus and unfurled superior helix' },
        { id: 'c', text: 'Buried superior helix and absent postauricular sulcus' },
        { id: 'd', text: 'Hypertrophic lobule and anterior rotation of the long axis' },
    ],
    correct: 'a',
    brief: 'Antihelical effacement → Mustardé sutures; conchal excess → Furnas sutures ± conchal resection. Most ears need both in some proportion.',
    detailed: 'Prominauris affects about 5% of White individuals and is often autosomal dominant, so ask about family history. Deformity analysis drives the operation: an unfolded antihelix (obtuse conchoscaphal angle) is corrected by conchoscaphal (Mustardé) sutures; an overdeep bowl (increased conchomastoid angle) by conchomastoid (Furnas) setback, with Davis conchal resection when the bowl is bulky. Option b describes Stahl ear; c, cryptotia. Pearl: grade each component separately — the weighting of the two techniques is the plan.',
    concepts: ['prominauris'],
},
{
    id: 'q11', type: 'mcq', section: 'Analysis & Indications',
    stem: 'A 7-year-old girl presents for otoplasty evaluation (three views shown). Which structural element is primarily deficient?',
    image: 'img/oksat/otoplasty/lop-ear.jpg',
    imageAlt: 'Three photographs of a child’s ear: two lateral views and one posterior view showing the upper third of the auricle folded forward and lacking definition',
    options: [
        { id: 'a', text: 'The superior antihelix and superior crus — effaced, so the upper pole lops forward' },
        { id: 'b', text: 'Postauricular skin — the superior helix is buried beneath the scalp' },
        { id: 'c', text: 'A third antihelical crus flattening the superior helix' },
        { id: 'd', text: 'Conchal cartilage — the bowl is absent' },
    ],
    correct: 'a',
    brief: 'Lop ear: the superior antihelix and superior crus are effaced, so the upper third of the auricle falls forward.',
    detailed: 'In the "lop" ear the antihelix is incompletely folded, most conspicuously at the superior crus; the complementary common deformity is the "cup" ear, in which excess cartilage deepens the conchal bowl. Treatment is a superior-crus Mustardé suture plus antihelical sutures, placed from the posterior approach. Pearl: at 7 years old the ear is 80–90% of adult size and the child can cooperate with a headband — the standard surgical window.',
    concepts: ['deformity-recognition', 'prominauris'],
},
{
    id: 'q12', type: 'mcq', section: 'Analysis & Indications',
    stem: 'A 3-month-old has a bilateral lop-ear deformity. When is surgical otoplasty typically offered, and why then?',
    options: [
        { id: 'a', text: 'Now — cartilage is most malleable in infancy' },
        { id: 'b', text: 'At 18–24 months, before speech development' },
        { id: 'c', text: 'At about 5–6 years — the ear is 80–90% of adult size, the child can cooperate with care, and it precedes school teasing' },
        { id: 'd', text: 'After puberty, once growth is complete' },
    ],
    correct: 'c',
    brief: 'Past the 2–3-week molding window, the next window is age 5–6: near-adult ear size, cooperation, and before school-age teasing.',
    detailed: 'Neonatal molding exploits maternal estrogen-driven cartilage plasticity and should start by 3 weeks of age; beyond that, most children wait until 5–6 years. Surgery is elective because isolated auricular deformities do not cause meaningful hearing loss unless the canal is stenotic or atretic. High-grade microtia is different — autologous reconstruction may wait until about age 10 for enough costal cartilage. Pearl: a missed molding window means a multi-year wait, which is why early referral of newborn ear deformities matters.',
    concepts: ['surgical-timing'],
},
{
    id: 'q13', type: 'mcq', section: 'Analysis & Indications',
    stem: 'Which preoperative finding best predicts persistent dissatisfaction after a technically sound otoplasty?',
    options: [
        { id: 'a', text: 'Autosomal dominant family history of prominauris' },
        { id: 'b', text: 'Body dysmorphic disorder or unrealistic expectations' },
        { id: 'c', text: 'An auriculocephalic angle of 45°' },
        { id: 'd', text: 'Bilateral rather than unilateral deformity' },
    ],
    correct: 'b',
    brief: 'Body dysmorphic disorder and unrealistic expectations are behavioral contraindications — dissatisfaction persists despite correction.',
    detailed: 'Contraindications span medical (active ear infection, uncontrolled diabetes or hypertension, coagulopathy), behavioral (BDD, unrealistic expectations, inability to comply with dressings or a headband), and developmental factors (a child too young to protect the wound). Contact-sport exposure defers surgery, especially cauliflower-ear repair. Pearl: screen expectations as carefully as you measure angles — the most common late complication is dissatisfaction, not a surgical failure.',
    concepts: ['patient-selection'],
},
{
    id: 'q14', type: 'mcq', section: 'Analysis & Indications',
    stem: 'A patient is scheduled for unilateral otoplasty. Why photograph both ears and measure prominence before injecting local anesthetic?',
    options: [
        { id: 'a', text: 'Insurance requires bilateral documentation' },
        { id: 'b', text: 'Infiltrated volume distorts auricular contour, and the opposite ear is the intraoperative reference for symmetry' },
        { id: 'c', text: 'Epinephrine blanching makes the helical rim invisible' },
        { id: 'd', text: 'Local anesthetic shrinks cartilage temporarily' },
    ],
    correct: 'b',
    brief: 'Measure before you inject — infiltration changes contour — and post photographs of both ears in the room as the symmetry reference.',
    detailed: 'Preoperative prominence is measured at the superior helix, mid-helix, and superior lobule; for microtia, the auricle is positioned relative to fixed landmarks (lateral canthus, nasal ala) and a template of the normal ear is made (acetate or x-ray film tracing, or 3D printing). Epinephrine-containing lidocaine (1% with 1:100,000) reduces bleeding and intraoperative narcotic need, but large anterior volumes distort the contour you are trying to judge. Pearl: prep the face widely so both ears and midface landmarks stay visible.',
    concepts: ['preop-planning'],
},

// ════════════════ PROMINAURIS TECHNIQUE ════════════════

{
    id: 'q15', type: 'mcq', section: 'Prominauris Technique',
    stem: 'In panel B of this operative sequence, a fusiform ellipse of postauricular skin is excised. How much does this skin excision contribute to reducing auricular prominence?',
    image: 'img/oksat/otoplasty/prominauris-part1.jpg',
    imageAlt: 'Six-panel operative series A to F: helix-to-mastoid measurement with a ruler, a marked postauricular skin ellipse, supraperichondrial dissection to the helical rim, cautery removal of soft tissue over the mastoid, horizontal-mattress guide sutures on the anterior antihelix, and placement of posterior sutures',
    options: [
        { id: 'a', text: 'It is the main setback maneuver; sutures only fine-tune' },
        { id: 'b', text: 'Very little — aggressive resection mainly risks effacing the postauricular sulcus' },
        { id: 'c', text: 'It corrects the antihelix but not the concha' },
        { id: 'd', text: 'It prevents suture extrusion by thickening the closure' },
    ],
    correct: 'b',
    brief: 'The skin ellipse provides access and removes redundancy; it does not set the ear back. Over-resection flattens the sulcus.',
    detailed: 'The ellipse runs from the inferior conchal bowl to about 15 mm below the superior helical rim, 15–20 mm wide depending on how much skin will be redundant, centered midway between helical rim and sulcus. The cartilage sutures do the work: panel C shows supraperichondrial dissection to the helical rim (Mustardé access), D cautery removal of soft tissue over the mastoid (Furnas access), E anterior guide sutures, F permanent posterior Mustardé sutures. Pearl: if you are tempted to take more skin to get more setback, you need a different cartilage maneuver instead.',
    concepts: ['skin-excision'],
},
{
    id: 'q16', type: 'mcq', section: 'Prominauris Technique',
    stem: 'Mustardé (1963) sutures create or refine the antihelical fold. Between which two structures is each horizontal mattress placed?',
    options: [
        { id: 'a', text: 'Conchal bowl and mastoid periosteum' },
        { id: 'b', text: 'Scaphoid fossa and conchal bowl, across the planned antihelix' },
        { id: 'c', text: 'Helical rim and temporalis fascia' },
        { id: 'd', text: 'Cauda helicis and sternocleidomastoid fascia' },
    ],
    correct: 'b',
    brief: 'Mustardé = conchoscaphal; Furnas = conchomastoid.',
    detailed: 'Mustardé sutures are conchoscaphal horizontal mattresses placed perpendicular to the planned antihelix, folding the scapha back toward the concha and restoring the ≈ 90° conchoscaphal angle. Furnas (1968) sutures are conchomastoid: they anchor the posterior conchal bowl to mastoid periosteum to correct conchal excess. Both are cartilage-sparing and, to a degree, adjustable. Pearl: match each suture to the angle it corrects — conchoscaphal angle (Mustardé), conchomastoid angle (Furnas).',
    concepts: ['mustarde', 'furnas'],
},
{
    id: 'q17', type: 'recall', section: 'Prominauris Technique',
    stem: 'Describe the guide-suture method for placing Mustardé sutures: where the guides go, the mattress dimensions, and how the permanent sutures are placed and tensioned.',
    answer: `• Guide sutures (e.g., blue 4-0 polypropylene) thrown from the anterior surface as horizontal mattresses between scapha and concha, just below where the antihelical stem divides; bites perpendicular to the antihelix, not through the posterior skin
• Tie to produce the desired fold; add 1–2 more inferiorly in a gentle curve (not a straight line), plus one anterosuperiorly for the superior crus
• Each mattress ≈ 15 mm anteroposterior × 10 mm superoinferior, ≈ 2 mm between sutures
• Permanent sutures from the posterior surface, as close as possible to each guide, passed perpendicular to it (opposite surface), never through the anterior skin
• Tighten each permanent suture until its guide begins to slacken — mild overcorrection — then remove the guides`,
    brief: 'Guides simulate the result from the front; permanents reproduce it from behind, tightened to slight overcorrection.',
    detailed: 'Alternatives for marking are methylene-blue tattooing or 27-gauge needles passed across the antihelix, but guide sutures simulate the permanent sutures most faithfully. The curved line of sutures is what keeps the antihelix from becoming a straight "vertical post"; overtightening is what produces a "hidden helix" or a creased, pinched antihelix. Pearl: mild overcorrection compensates for some relaxation before scar takes over the job of holding the fold.',
    explanationImage: 'img/oksat/otoplasty/prominauris-part1.jpg',
    explanationImageAlt: 'Six-panel operative series; panel E shows anterior guide sutures defining the antihelix and superior crus, and panel F shows placement of permanent Mustardé sutures from behind',
    concepts: ['mustarde'],
},
{
    id: 'q18', type: 'mcq', section: 'Prominauris Technique',
    stem: 'In one comparative study of permanent otoplasty sutures, which materials were associated with a higher extrusion rate?',
    options: [
        { id: 'a', text: 'Nylon and polypropylene' },
        { id: 'b', text: 'Expanded polytetrafluoroethylene and polydioxanone' },
        { id: 'c', text: 'Braided polyester and expanded polytetrafluoroethylene' },
        { id: 'd', text: 'Polydioxanone and braided polyester' },
    ],
    correct: 'a',
    brief: 'Nylon and polypropylene extruded more than ePTFE, PDS, and braided polyester in a single study.',
    detailed: 'StatPearls cites one study for this ranking, so weight it accordingly — a single series, with extrusion confounded by knot burial, skin thickness, and tension. Other surgeons interpose a dermal graft or a de-epithelialized dermofascial flap between sutures and closure to reduce extrusion. When a suture does extrude weeks later, it can usually be removed without loss of contour, because scar rather than suture now holds the cartilage. Pearl: extrusion is a nuisance complication, not a failure of the setback.',
    concepts: ['suture-material', 'suture-extrusion'],
},
{
    id: 'q19', type: 'mcq', section: 'Prominauris Technique',
    stem: 'When placing Furnas sutures, why are the bites in the mastoid periosteum taken well posteriorly?',
    options: [
        { id: 'a', text: 'To avoid the facial nerve at the stylomastoid foramen' },
        { id: 'b', text: 'To pull the concha posteriorly as well as medially, so the setback does not narrow the external auditory canal' },
        { id: 'c', text: 'Because anterior periosteum is too thin to hold a suture' },
        { id: 'd', text: 'To recreate the superior antihelical crus' },
    ],
    correct: 'b',
    brief: 'A posteriorly directed vector keeps the conchal setback from rotating cartilage into the meatus.',
    detailed: 'Furnas sutures are horizontal mattresses with superoinferior bites through the most prominent conchal cartilage and the mastoid periosteum; three are typical, all placed before any is tied, then tensioned in sequence. An anteriorly directed pull compresses the cartilaginous meatus and, if severe, causes conductive hearing loss. The vault adds that a crescent of conchal cartilage can be resected if the setback still narrows the meatus. Pearl: preserve periosteum while clearing mastoid soft tissue — it is the anchor.',
    explanationImage: 'img/oksat/otoplasty/prominauris-part2.jpg',
    explanationImageAlt: 'Six-panel operative series G to L: partial-thickness conchal cartilage resection, first Furnas bite in conchal cartilage, second bite in mastoid periosteum, resection of the cauda helicis, closure over a rubber-band drain, and the final result',
    concepts: ['furnas'],
},
{
    id: 'q20', type: 'mcq', section: 'Prominauris Technique',
    stem: 'In a combined otoplasty, why are Mustardé sutures placed before Furnas sutures?',
    options: [
        { id: 'a', text: 'Mustardé sutures must heal first to anchor the concha' },
        { id: 'b', text: 'Setting the conchal bowl back first makes access to the posterior auricular cartilage difficult' },
        { id: 'c', text: 'Furnas sutures cause edema that obscures the antihelix' },
        { id: 'd', text: 'The order does not matter' },
    ],
    correct: 'b',
    brief: 'Fold the antihelix while the posterior cartilage is still exposed; set the bowl back last.',
    detailed: 'Once the concha is fixed to the mastoid, the posterior auricle is pinned against the skull and the posterior scapha is hard to reach for permanent Mustardé sutures. Sequence: skin ellipse → dissection (to helical rim, then to mastoid) → soft-tissue removal over mastoid → guide sutures → permanent Mustardé → optional Davis conchal resection → Furnas → cauda helicis resection if the lobule projects → closure over a drain. Pearl: the lobule is judged last, because medialization of the pinna can paradoxically push it out.',
    concepts: ['furnas', 'mustarde'],
},
{
    id: 'q21', type: 'mcq', section: 'Prominauris Technique',
    stem: 'While clearing soft tissue over the mastoid for Furnas sutures, what is preserved, and what change will many patients notice afterward?',
    options: [
        { id: 'a', text: 'The great auricular nerve is preserved; lobule numbness is expected' },
        { id: 'b', text: 'The periosteum is preserved; patients who could wiggle their ears usually can no longer do so' },
        { id: 'c', text: 'The posterior auricular artery is preserved; the helix becomes pale' },
        { id: 'd', text: 'The posterior auricular muscle is preserved; ear wiggling improves' },
    ],
    correct: 'b',
    brief: 'Remove the posterior auricular muscle and soft tissue, keep the periosteum to anchor the sutures — ear wiggling is lost.',
    detailed: 'The dissection follows the supraperichondrial plane posteriorly; once the conchal cartilage curves anteriorly, dissection drops away from the perichondrium so as not to enter the posterior canal. Enough tissue — typically including the posterior auricular muscle — is removed with cautery to let the bowl medialize, leaving periosteum intact. Pearl: warn the patient who can wiggle their ears; it is a harmless but predictable change.',
    concepts: ['furnas'],
},
{
    id: 'q22', type: 'mcq', section: 'Prominauris Technique',
    stem: 'Which technique adds excision of conchal cartilage to augment the setback achieved with Furnas sutures?',
    options: [
        { id: 'a', text: 'Davis' },
        { id: 'b', text: 'Chongchet' },
        { id: 'c', text: 'Stenström' },
        { id: 'd', text: 'Fritsch' },
    ],
    correct: 'a',
    brief: 'Davis: conchal cartilage resection. Chongchet: anterior scoring. Stenström: anterior rasping. Fritsch: incisionless percutaneous sutures.',
    detailed: 'Panel G of the operative series shows a partial-thickness conchal resection using the Davis technique before Furnas sutures (H, I) are placed. Resection helps when the bowl is bulky, but over-resecting the central concha is itself a cause of the telephone-ear deformity, because it permits disproportionate central setback. Pearl: cartilage-sparing sutures are adjustable; cartilage you remove cannot be put back.',
    explanationImage: 'img/oksat/otoplasty/prominauris-part2.jpg',
    explanationImageAlt: 'Six-panel operative series G to L; panel G shows partial-thickness conchal cartilage resection by the Davis technique',
    concepts: ['cartilage-modifying'],
},
{
    id: 'q23', type: 'recall', section: 'Prominauris Technique',
    stem: 'State Gibson’s principle of cartilage warping and how Chongchet and Stenström apply it to the antihelix. What are the drawbacks?',
    answer: `• Gibson’s principle: cartilage scored, incised, or abraded on one surface bends AWAY from the injured surface (intact tension on the opposite side wins)
• Chongchet: open anterior scoring of the antihelical cartilage under direct vision → cartilage curls posteriorly into an antihelix
• Stenström: blind anterior rasping via a small incision → same effect
• Drawbacks: unnatural sharp edges (full-thickness incisions should be sutured closed); higher incidence of prolonged tenderness with anterior scoring; posterior scoring and rasping are rarely used today`,
    brief: 'Score the anterior surface and the cartilage folds backward — the antihelix forms on the side away from the scoring.',
    detailed: 'Gibson and Davis described the principle in 1958; it underlies both anterior-scoring otoplasty and costal-cartilage warping in rhinoplasty. In Stahl ear, the same principle is used in reverse — scoring the posterior Stahl bar lets it unroll. Pearl: suture techniques are reversible with higher recurrence; scoring techniques recur less but carry contour and chronic-pain risk.',
    concepts: ['cartilage-modifying', 'suture-extrusion'],
},
{
    id: 'q24', type: 'mcq', section: 'Prominauris Technique',
    stem: 'After well-placed Mustardé and Furnas sutures reduce auricular prominence, the lobule still projects laterally. What is the most effective correction?',
    options: [
        { id: 'a', text: 'Tighten the inferior Furnas suture' },
        { id: 'b', text: 'Resect the cartilaginous cauda helicis' },
        { id: 'c', text: 'Excise more postauricular skin' },
        { id: 'd', text: 'Add a Mustardé suture at the antitragus' },
    ],
    correct: 'b',
    brief: 'The outstanding lobule is propped by the cauda helicis; removing it lets the lobule follow the pinna.',
    detailed: 'Medialization of the pinna can paradoxically push the lobule outward. Because the lobule has no cartilage to suture, the fix is to remove the structure pushing it — the cauda helicis (panel J). Skin excision risks sulcus effacement, and overtightening the inferior Furnas suture relative to the central one produces a reverse-telephone deformity. Pearl: if an outstanding lobule becomes evident once edema settles and the headband comes off, revise sooner rather than later, before scar matures.',
    explanationImage: 'img/oksat/otoplasty/prominauris-part2.jpg',
    explanationImageAlt: 'Six-panel operative series G to L; panel J shows resection of the cauda helicis to reduce lobule prominence, and panel L the final result',
    concepts: ['lobule', 'contour-deformities'],
},
{
    id: 'q25', type: 'mcq', section: 'Prominauris Technique',
    stem: 'Fritsch’s "incisionless" otoplasty (1995) places buried percutaneous Mustardé sutures through stab incisions. Which statement is correct?',
    options: [
        { id: 'a', text: 'It is suitable for all degrees of prominauris' },
        { id: 'b', text: 'It avoids incision and undermining, reducing discomfort, wound complications, and the need for a drain or pressure dressing, but severe prominauris still needs an open approach' },
        { id: 'c', text: 'It sets back the concha without sutures' },
        { id: 'd', text: 'It requires anterior cartilage scoring through the stab incisions' },
    ],
    correct: 'b',
    brief: 'Incisionless otoplasty trades power for morbidity: good for milder antihelical deficiency, not for severe prominauris.',
    detailed: 'Percutaneous sutures limit postauricular exposure to stab incisions, so there is no undermining, less discomfort, fewer wound complications, and no drain or pressure dressing. It addresses the antihelix; significant conchal excess and severe deformity still require open Furnas setback ± conchal resection. Pearl: match the approach to the deformity grade, not to the patient’s preference for "no incision".',
    concepts: ['incisionless'],
},
{
    id: 'q26', type: 'recall', section: 'Prominauris Technique',
    stem: 'Outline the standard closure, dressing, and headband regimen after open otoplasty.',
    answer: `• Close the postauricular incision with absorbable suture (e.g., gut) over a small Penrose or rubber-band drain
• Mastoid-type (Glasscock) pressure dressing
• Remove drain and dressing at ~24 hours (24–48 h in the complications discussion) and inspect
• Athletic headband over the ear(s) at all times, with infrequent breaks, for 1–2 weeks
• Then headband at night only for about another month
• Same regimen after Stahl, cryptotia, and cauliflower-ear otoplasty`,
    brief: 'Drain + pressure dressing for a day, continuous headband for 1–2 weeks, nights for a month.',
    detailed: 'The drain and dressing are hematoma prophylaxis — the most concerning early complication — but an overly tight dressing can cause skin necrosis. The headband protects sutures from trauma (which can cause hematoma or rupture a contouring suture) while scar consolidates. Pearl: rising pain in the first 24–72 hours means take the dressing down and look.',
    concepts: ['postop-care', 'hematoma'],
},

// ════════════════ OTHER DEFORMITIES & MOLDING ════════════════

{
    id: 'q27', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'Which congenital auricular deformity is shown?',
    image: 'img/oksat/otoplasty/stahl-ear.jpg',
    imageAlt: 'Lateral photograph of an adult ear with a flattened, pointed superior helical rim and a broad, flat upper scapha crossed by an extra ridge running posterosuperiorly',
    options: [
        { id: 'a', text: 'Stahl ear' },
        { id: 'b', text: 'Cryptotia' },
        { id: 'c', text: 'Lop ear' },
        { id: 'd', text: 'Grade I microtia' },
    ],
    correct: 'a',
    brief: 'Stahl ear: a supernumerary, posterosuperiorly directed antihelical crus (Stahl bar) flattens the superior helix into a pointed, "elfin" ear.',
    detailed: 'The Stahl bar may coexist with the two normal crura or replace the superior crus; the scapha broadens and flattens and the superior helix unfurls. The postulated cause is anomalous insertion of the transverse auricular muscle. Cryptotia buries the superior helix under scalp skin; lop ear lacks a superior crus; grade I microtia is a small ear with all subunits. Pearl: in a neonate, Stahl ear is a molding diagnosis — far easier to correct with a splint than with surgery later.',
    concepts: ['deformity-recognition'],
},
{
    id: 'q28', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'Why is surgical correction of Stahl ear less straightforward than Mustardé correction of prominauris?',
    options: [
        { id: 'a', text: 'The Stahl bar contains bone' },
        { id: 'b', text: 'Releasing an existing cartilage fold is harder than creating a new one' },
        { id: 'c', text: 'Stahl ear is always bilateral' },
        { id: 'd', text: 'The deformity recurs after puberty' },
    ],
    correct: 'b',
    brief: 'Sutures readily add a fold; flattening an unwanted one requires scoring, excision, or splinting.',
    detailed: 'No consensus technique exists; the only agreed point is that neonatal molding obviates surgery. Options include posterior scoring of the Stahl bar through a postauricular incision (Chongchet’s principle in reverse, letting it unroll), Mustardé sutures to create a missing superior crus, excising and cross-hatching or sectioning the bar and replacing it flat, folding the superior cartilage posteriorly on itself as a splint (at the cost of superior support), and a periosteal strip pulling the rim inward with a superior-crus Mustardé suture. Pearl: every surgical option is a workaround for a missed molding window.',
    concepts: ['stahl-ear', 'cartilage-modifying'],
},
{
    id: 'q29', type: 'recall', section: 'Other Deformities & Molding',
    stem: 'List the surgical options for correcting a Stahl ear, in roughly escalating order.',
    answer: `• Posterior scoring of the Stahl bar via a postauricular incision so it unrolls (± Mustardé sutures to create an absent superior crus, which also effaces the bar)
• Excise the Stahl-bar cartilage, cross-hatch or section it until the pieces lie flat, and replace it
• Dissect the superior cartilage free of both skin surfaces and fold it posteriorly on itself as a splint (removes support from the superior auricle)
• A strip of periosteum tensioned to pull the helical rim inward and flatten the bar — works best with a superior-crus Mustardé suture`,
    brief: 'Score, excise-and-replace, fold-as-splint, or periosteal tensioning — with Mustardé sutures to build a superior crus when one is missing.',
    detailed: 'All of these are standard-otoplasty regimens afterward (drain, dressing, headband). The recurring theme is that a fold is being removed rather than created, which is mechanically less predictable. Pearl: when the normal superior crus is absent, recreating it with a Mustardé suture is often the lowest-morbidity way to efface the Stahl bar.',
    concepts: ['stahl-ear'],
},
{
    id: 'q30', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'In this child’s ear (left), the superior helix is buried beneath scalp skin; reflecting the auricle forward (right) shows no sulcus behind the upper pinna. What must surgery primarily supply?',
    image: 'img/oksat/otoplasty/cryptotia.jpg',
    imageAlt: 'Two photographs of a child’s ear: at left the upper helix disappears under the scalp skin; at right a finger pulls the auricle forward, revealing no postauricular sulcus above',
    options: [
        { id: 'a', text: 'Cartilage to rebuild the superior helix' },
        { id: 'b', text: 'Skin to create a postauricular sulcus behind the upper pinna' },
        { id: 'c', text: 'A superior-crus Mustardé suture' },
        { id: 'd', text: 'Conchal setback with Furnas sutures' },
    ],
    correct: 'b',
    brief: 'Cryptotia is a skin deficiency: the upper auricle failed to separate from the scalp, so the repair must supply sulcus skin.',
    detailed: 'The cartilage framework is usually present; what is missing is the skin that lines the superior postauricular sulcus. The simplest approach — incise along the helical rim and graft behind the upper pinna — is limited because an avascular graft contracts and re-effaces the neosulcus. Pearl: like Stahl ear, cryptotia responds well to neonatal molding when caught early.',
    concepts: ['deformity-recognition', 'cryptotia'],
},
{
    id: 'q31', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'Why do most cryptotia repairs transfer local flaps (trefoil or kite flaps) into the neosulcus rather than simply skin grafting it?',
    options: [
        { id: 'a', text: 'Skin grafts carry hair follicles into the sulcus' },
        { id: 'b', text: 'An avascular graft contracts and effaces the new sulcus' },
        { id: 'c', text: 'Grafts cannot survive on perichondrium' },
        { id: 'd', text: 'Flaps avoid the need for a headband' },
    ],
    correct: 'b',
    brief: 'Graft contraction undoes the sulcus; vascularized local skin holds it.',
    detailed: 'The Seattle Children’s (Sie) technique uses a pair of interdigitating trefoil flaps with wide undermining to move half the skin between the superior helix and hairline into the neosulcus; careful design and staggered closure keep hair follicles out and reduce dehiscence. The dermofascial kite flap shifts skin from the inferior postauricular sulcus into the neosulcus on a mastoid fascia pedicle with no named vessel — effectively a vascularized skin graft. Pearl: in the image, panel F shows the improved superior helical definition compared with panel A.',
    explanationImage: 'img/oksat/otoplasty/cryptotia-repair.jpg',
    explanationImageAlt: 'Six-panel cryptotia repair: A, modified trefoil incisions marked in red above the ear; B to E, kite flap marked with parallel lines for the fascial pedicle, elevated, transposed into the superior postauricular incision, and inset to form a neosulcus; F, final result with improved superior helical definition',
    concepts: ['cryptotia'],
},
{
    id: 'q32', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'Why does an undrained subperichondrial auricular hematoma progress to a cauliflower ear?',
    options: [
        { id: 'a', text: 'Blood toxicity directly dissolves elastic fibers within hours' },
        { id: 'b', text: 'Avascular cartilage depends on diffusion from perichondrium; separation causes necrosis, then disorganized neocartilage and fibrosis' },
        { id: 'c', text: 'The hematoma calcifies into bone' },
        { id: 'd', text: 'The auricular muscles contract the organized clot' },
    ],
    correct: 'b',
    brief: 'Strip the perichondrium off avascular cartilage and it dies; the perichondrium then lays down disorganized fibrocartilage.',
    detailed: 'Blunt shear (wrestling, rugby, martial arts) separates the tightly adherent anterior skin–perichondrium from cartilage. Without its diffusion source, cartilage necroses; stagnant blood also invites perichondritis. The acute treatment (vault notes) is evacuation — incision within a natural contour or aspiration — followed by through-and-through bolster compression for 5–7 days to obliterate the dead space. Pearl: the bolster is the treatment; drainage without compression reaccumulates.',
    concepts: ['cauliflower-ear'],
},
{
    id: 'q33', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'A 40-year-old long-time jiu-jitsu practitioner asks about correcting the deformity shown. What is the most important prerequisite before offering surgery?',
    image: 'img/oksat/otoplasty/cauliflower-ear.jpg',
    imageAlt: 'Lateral photograph of an adult ear with a thickened, lumpy, contracted upper auricle obscuring the normal antihelix and scaphoid fossa',
    options: [
        { id: 'a', text: 'CT to rule out cartilage calcification' },
        { id: 'b', text: 'The patient has stopped activities likely to cause further auricular trauma' },
        { id: 'c', text: 'A trial of intralesional steroids' },
        { id: 'd', text: 'Audiometry showing no conductive loss' },
    ],
    correct: 'b',
    brief: 'Cauliflower-ear otoplasty is deferred until the patient has stopped the sport — re-injury recreates the deformity.',
    detailed: 'Auricular cartilage is prone to fibrosis when traumatized, and a repaired cauliflower ear is at particular risk of recurrence. Calcification is common in long-standing deformities and older patients, but it changes the instruments (an otologic drill) rather than the candidacy. Pearl: settle the sport question at the first visit; it determines whether there is an operation at all.',
    concepts: ['cauliflower-ear', 'patient-selection', 'deformity-recognition'],
},
{
    id: 'q34', type: 'recall', section: 'Other Deformities & Molding',
    stem: 'Outline the surgical approach to a cauliflower ear: incisions, how fibrocartilage is reshaped, and options for severe deformity.',
    answer: `• Incisions: junction of antihelix and concha (conchal access) or the medial edge of the helical rim (scapha and antihelix); postauricular approach for the helix itself
• Mild–moderate (contour changed, outline intact): sculpt fibrocartilage with scalpel or curettes
• Calcified fibrocartilage (long-standing, older patients): otologic drill with cutting/diamond burs
• Concha-only involvement: resect the conchal cartilage entirely — no loss of support or appearance
• Helical rim distortion: incise along the medial helical cartilage to release scar contracture
• Then Mustardé or Furnas sutures as needed to normalize contour
• Severe cartilage loss or soft-tissue contracture: postauricular skin flaps, or grafts of contralateral concha, septum, or costal cartilage (microtia principles)`,
    brief: 'Sculpt, drill, or resect the fibrocartilage through a contour-hiding incision, release helical scar, then re-contour with sutures.',
    detailed: 'Equipment beyond standard otoplasty: biopsy punches (3–6 mm) and a drill with 4 and 6 mm cutting and diamond burs. A quilting suture after reshaping obliterates the dead space where the skin was elevated off scarred perichondrium. Pearl: the conchal cartilage is expendable — its complete removal is invisible and does not destabilize the ear.',
    concepts: ['cauliflower-ear'],
},
{
    id: 'q35', type: 'mcq', section: 'Other Deformities & Molding',
    stem: 'Neonatal ear molding with a device like the one shown should ideally begin by what age, and why?',
    image: 'img/oksat/otoplasty/ear-molding.jpg',
    imageAlt: 'A newborn wearing a clear silicone ear-molding cradle adhered around the ear, with conformers visible through the perforated outer cover',
    options: [
        { id: 'a', text: 'By 3 weeks — circulating maternal estrogen keeps the elastic cartilage malleable' },
        { id: 'b', text: 'By 6 months — before the cartilage calcifies' },
        { id: 'c', text: 'By 1 year — once the ear reaches half of adult size' },
        { id: 'd', text: 'At any age before school entry' },
    ],
    correct: 'a',
    brief: 'Start by 3 weeks: maternal estrogen keeps cartilage moldable, and malleability falls quickly after that.',
    detailed: 'With appropriate selection, 4–6 weeks of splinting gives a better than 90% chance of substantial improvement or a normal contour; the main exception is high-grade microtia, which molding cannot build. Commercial systems use a silastic cradle adherent to the skin, retractors/conformers to shape the auricle, and an outer cover. Pearl: miss the window and the next opportunity is surgery at 5–6 years.',
    concepts: ['ear-molding', 'surgical-timing'],
},
{
    id: 'q36', type: 'recall', section: 'Other Deformities & Molding',
    stem: 'Describe the practical ear-molding protocol and its complication profile.',
    answer: `• Trim hair and apply skin adhesive so the appliance stays on
• Device stays on ≈ 2 weeks until the first follow-up, when it is removed and the ear examined
• Usually a larger appliance is placed (interim growth), with review 2 weeks later
• Repeat until the goal is reached or progress stops — typically ≈ 6 weeks total
• Satisfaction is very high; complications are limited to adhesive irritation and abrasion or pressure ischemia from retractors/conformers`,
    brief: 'Two-week cycles, upsizing as the ear grows, about six weeks total; complications are skin-level.',
    detailed: 'The deformities that respond best are the shape anomalies — prominence, lop, Stahl, cryptotia, helical rim deformities — which the vault notes as the ones molding can "avoid surgery entirely" for. Pearl: examine for pressure injury at every change; the conformers sit exactly where the skin is thinnest.',
    concepts: ['ear-molding'],
},

// ════════════════ MICROTIA RECONSTRUCTION ════════════════

{
    id: 'q37', type: 'mcq', section: 'Microtia Reconstruction',
    stem: 'A child has a small vertical cartilage remnant with an anterosuperiorly rotated lobule and no recognizable subunits. Which Marx grade is this?',
    options: [
        { id: 'a', text: 'Grade I' },
        { id: 'b', text: 'Grade II' },
        { id: 'c', text: 'Grade III' },
        { id: 'd', text: 'Grade IV' },
    ],
    correct: 'c',
    brief: 'Marx III: minimal cartilage ("peanut ear") with a malpositioned lobule — the grade most often reconstructed.',
    detailed: 'Grade I: at least 2 SD below normal size, all subunits present. Grade II: small, with some subunits underdeveloped or absent. Grade III: minimal cartilage remnant, malpositioned (anterosuperiorly rotated) lobule. Grade IV: anotia. Auricular malformation alone does not cause meaningful conductive loss; the hearing problem in microtia comes from associated canal stenosis or atresia. Pearl: grade III is the workhorse of microtia surgery — the lobule is present to transpose, but essentially all cartilage must be built.',
    explanationImage: 'img/oksat/otoplasty/marx-classification.jpg',
    explanationImageAlt: 'Marx classification panel with four photographs: grade I small auricle with all subunits; grade II small auricle with underdeveloped or absent subunits; grade III small cartilage remnant with anterosuperiorly rotated lobule; grade IV anotia',
    concepts: ['marx'],
},
{
    id: 'q38', type: 'mcq', section: 'Microtia Reconstruction',
    stem: 'Comparing autologous costal cartilage with porous polyethylene frameworks for microtia, which statement is correct?',
    options: [
        { id: 'a', text: 'Porous polyethylene has lower exposure and extrusion rates' },
        { id: 'b', text: 'Costal cartilage constructs have lower exposure and extrusion rates, but require waiting for enough rib cartilage' },
        { id: 'c', text: 'Porous polyethylene frameworks do not need soft-tissue flap coverage' },
        { id: 'd', text: 'Both can be performed at age 2' },
    ],
    correct: 'b',
    brief: 'Autologous rib is living, durable tissue with less exposure/extrusion; alloplastic frameworks start earlier but carry lifetime exposure risk.',
    detailed: 'Porous polyethylene (Medpor / Su-Por; the Reinisch method) avoids rib harvest and can start earlier — the vault notes 3–5 years — but must be wrapped in a temporoparietal fascia flap and skin graft, and remains vulnerable to exposure and fracture with trauma for life. Autologous reconstruction waits for sufficient costal cartilage (often until about age 10 for high-grade microtia). Other media: adhesive or magnetic prostheses, osseointegrated prostheses (acquired defects, radiated fields, failed reconstructions), 3D-printed implants, and — since 2022 — a bioprinted autologous construct. Pearl: framework choice is a values conversation about donor-site morbidity versus lifetime implant risk.',
    concepts: ['framework-choice', 'tpf-flap'],
},
{
    id: 'q39', type: 'recall', section: 'Microtia Reconstruction',
    stem: 'Compare the stages of the Tanzer, Brent, and Nagata autologous rib reconstructions.',
    answer: `Tanzer (4 stages):
1. Transpose lobule
2. Harvest and implant costal cartilage (contralateral ribs 6–8)
3. Elevate the implant
4. Form tragus (separate piece) and conchal bowl

Brent (4 stages):
1. Harvest and implant costal cartilage (contralateral ribs 6–8)
2. Transpose lobule
3. Elevate the implant
4. Form tragus and conchal bowl

Nagata (2 stages):
1. Transpose lobule + harvest and implant costal cartilage (ipsilateral ribs 6–9) with the tragus built into the construct
2. Elevate the implant with a temporoparietal fascia flap and skin graft`,
    brief: 'Tanzer and Brent differ only in whether the lobule or the framework goes first; Nagata consolidates into two stages at the cost of more cartilage.',
    detailed: 'Brent’s framework: the synchondrosis of ribs 6–7 forms the base plate, the floating 8th rib is thinned and wired around it as the helical rim (vault notes). Nagata builds the antihelix, tragus, and antitragus into a multilayer construct in stage 1, which needs more rib — hence the later start (about age 10, adequate chest circumference; the vault gives ≥ 60–65 cm). The Reinisch alloplastic method uses the same two-stage logic with an implant. Pearl: more stages, less cartilage, earlier start; fewer stages, more cartilage, later start.',
    explanationImage: 'img/oksat/otoplasty/rib-reconstruction-stages.jpg',
    explanationImageAlt: 'Table comparing autologous rib reconstruction: Tanzer four stages, Brent four stages, and Nagata two stages, with the rib sources and the order of lobule transposition, implantation, elevation, and tragus formation',
    concepts: ['microtia-staging'],
},
{
    id: 'q40', type: 'mcq', section: 'Microtia Reconstruction',
    stem: 'At Nagata stage 2, the framework is elevated off the mastoid to create the postauricular sulcus. What covers the elevated framework?',
    options: [
        { id: 'a', text: 'A postauricular skin advancement flap alone' },
        { id: 'b', text: 'A temporoparietal fascia flap and a skin graft' },
        { id: 'c', text: 'A radial forearm free flap' },
        { id: 'd', text: 'Porous polyethylene sheeting' },
    ],
    correct: 'b',
    brief: 'Stage 2 elevation is wrapped in temporoparietal fascia (superficial temporal vessels) and skin-grafted.',
    detailed: 'The TPF flap provides a vascularized bed over the exposed posterior framework so a skin graft can take; the vault adds a banked cartilage block behind the construct to hold projection. The TPF flap is also the salvage flap for exposure in any framework reconstruction, so the superficial temporal vessels are protected from the first incision. Pearl: in the image, stage 1 shows the construct and transposed lobule, stage 2 the elevated auricle with TPF and graft.',
    explanationImage: 'img/oksat/otoplasty/nagata-reconstruction.jpg',
    explanationImageAlt: 'Four photographs: a carved costal cartilage construct; the ear after Nagata stage 1 with construct placement and lobule transposition; after stage 2 with elevation using temporoparietal fascia and skin graft; and the final result',
    concepts: ['microtia-staging'],
},

// ════════════════ COMPLICATIONS ════════════════

{
    id: 'q41', type: 'mcq', section: 'Complications',
    stem: 'The evening after bilateral otoplasty, a child has increasing right-sided ear pain despite analgesia. What is the next step?',
    options: [
        { id: 'a', text: 'Increase opioid dosing and reassess in the morning' },
        { id: 'b', text: 'Remove the dressing and examine the ear for hematoma' },
        { id: 'c', text: 'Start oral ciprofloxacin' },
        { id: 'd', text: 'Tighten the pressure dressing' },
    ],
    correct: 'b',
    brief: 'Increasing pain in the first 24–72 hours is a hematoma until proven otherwise — take the dressing down and look.',
    detailed: 'Hematoma is the most concerning early complication: untreated, it leads to infection, perichondritis, cartilage necrosis, resorption, fibrosis, and a cauliflower deformity. Most result from transient blood pressure rises and inadequate hemostasis, some from early trauma. Asymmetric edema and ecchymosis in the first 24–48 hours, especially with fluctuance and fever, call for aspiration or opening the incision to evacuate. Tightening the dressing risks skin necrosis. Pearl: the vault calls pain out of proportion "the emergency" of otoplasty.',
    concepts: ['hematoma'],
},
{
    id: 'q42', type: 'mcq', section: 'Complications',
    stem: 'A 6-year-old develops the appearance shown 5 days after otoplasty for prominauris: erythema and edema of the auricle that spare the lobule. What is the most likely pathogen and appropriate antibiotic?',
    image: 'img/oksat/otoplasty/perichondritis.jpg',
    imageAlt: 'A child’s ear with diffuse erythema and swelling of the helix, scapha, and antihelix, scattered excoriations, and a normal-appearing lobule',
    options: [
        { id: 'a', text: 'Staphylococcus aureus — cephalexin' },
        { id: 'b', text: 'Streptococcus pyogenes — amoxicillin' },
        { id: 'c', text: 'Pseudomonas aeruginosa — a fluoroquinolone such as ciprofloxacin, even in children' },
        { id: 'd', text: 'Anaerobes — clindamycin' },
    ],
    correct: 'c',
    brief: 'Lobule-sparing inflammation after day 2–3 is perichondritis; Pseudomonas is the most common isolate, and ciprofloxacin is the drug even in pediatrics.',
    detailed: 'The lobule has no cartilage, so an infection of the perichondrium spares it — cellulitis and erysipelas do not. Pain, erythema, and edema appearing more than 2–3 days after surgery favor perichondritis over hematoma. Oral or IV therapy depends on severity and early response; the vault adds incision, drainage, and bolstering if a subperichondrial abscess forms. The vault’s ">90% Pseudomonas" figure refers to piercing-related chondritis, a different population — StatPearls says only that Pseudomonas is the most common isolate after otoplasty. Pearl: antistaphylococcal cephalosporins do not cover Pseudomonas.',
    concepts: ['perichondritis'],
},
{
    id: 'q43', type: 'recall', section: 'Complications',
    stem: 'Name the late contour deformities after prominauris otoplasty and the technical error behind each.',
    answer: `• Hidden helix — Mustardé sutures overtightened; antihelix projects beyond the helix, so the helix is invisible on frontal view
• Vertical post — Mustardé sutures misplaced in a straight line; antihelix becomes a straight vertical ridge instead of a gentle curve
• Telephone ear — central Furnas suture too tight relative to the superior and inferior sutures (or excess central conchal resection); poles bow outward
• Reverse telephone ear — superior and inferior Furnas sutures too tight relative to the central one; the middle third protrudes
• Outstanding lobule — lobule fails to follow the medialized pinna; resect the cauda helicis
• Canal compression / conductive loss — Furnas sutures oriented so they pull the concha anteriorly into the meatus`,
    brief: 'Mustardé errors distort the antihelix (hidden helix, vertical post); Furnas errors distort the profile (telephone, reverse telephone) or narrow the canal.',
    detailed: 'Each deformity traces to a suture set and a tension or placement error, which is why guide sutures, a curved suture line, sequential Furnas tensioning, and posteriorly placed mastoid bites are emphasized intraoperatively. Revise early — once edema settles and the headband is off — before scar makes revision harder. Pearl: on frontal view the helix should always be visible just lateral to the antihelix.',
    concepts: ['contour-deformities'],
},
{
    id: 'q44', type: 'mcq', section: 'Complications',
    stem: 'Months after otoplasty, the superior and inferior poles of the auricle bow outward while the middle third sits close to the head, resembling a corded handset. What is the most common cause?',
    options: [
        { id: 'a', text: 'Overtightened Mustardé sutures' },
        { id: 'b', text: 'Central Furnas suture tightened excessively relative to the superior and inferior sutures' },
        { id: 'c', text: 'Superior and inferior Furnas sutures tightened excessively relative to the central suture' },
        { id: 'd', text: 'Failure to resect the cauda helicis' },
    ],
    correct: 'b',
    brief: 'Telephone ear = middle-third overcorrection, usually from the central Furnas suture (less often from excess central conchal resection).',
    detailed: 'The deformity reads as a handset because the middle third is set back more than the poles. The reverse telephone ear (option c) is the opposite error — poles overcorrected, middle protruding. Overtightened Mustardé sutures produce a hidden helix; an unresected cauda helicis leaves an outstanding lobule. Pearl: place all three Furnas sutures before tying any, then modulate tension across them.',
    concepts: ['contour-deformities'],
},
{
    id: 'q45', type: 'mcq', section: 'Complications',
    stem: 'What is the most common late complication of otoplasty, and what symmetry target helps prevent it?',
    options: [
        { id: 'a', text: 'Keloid; silicone sheeting for 3 months' },
        { id: 'b', text: 'Dissatisfaction with cosmesis; left and right prominence within 3 mm' },
        { id: 'c', text: 'Suture extrusion; prominence within 10 mm' },
        { id: 'd', text: 'Chronic pain; bilateral surgery in all cases' },
    ],
    correct: 'b',
    brief: 'Dissatisfaction is the most common late complication; match the two sides within about 3 mm.',
    detailed: 'Dissatisfaction follows from asymmetry beyond ~3 mm, contour abnormalities from suture misplacement, or insufficient reduction. Keloids are uncommon because most incisions are postauricular, but keloid-prone patients remain at risk. Pearl: measure both sides at three points at the end of the case, and compare them against the photographs posted in the room.',
    concepts: ['symmetry'],
},
{
    id: 'q46', type: 'mcq', section: 'Complications',
    stem: 'Three months after otoplasty, a Mustardé suture extrudes through the postauricular skin. What is the expected result of removing it?',
    options: [
        { id: 'a', text: 'The antihelix will unfold; replace the suture' },
        { id: 'b', text: 'Contour is usually unchanged, because scar now holds the cartilage in position' },
        { id: 'c', text: 'Removal is contraindicated until one year' },
        { id: 'd', text: 'It predicts perichondritis; start ciprofloxacin' },
    ],
    correct: 'b',
    brief: 'After a few weeks, scar — not suture — maintains the new shape, so extruded sutures can usually be removed without loss of contour.',
    detailed: 'Other general complications include prolonged tenderness or hypersensitivity (usually resolving over months to years; possibly more common with anterior scoring), unsightly scarring or keloid, and post-traumatic fibrosis — including recurrent cauliflower deformity after repair of a prior one. Pearl: reassure the patient before the extruded stitch comes out; the setback does not depend on it anymore.',
    concepts: ['suture-extrusion'],
},

// ════════════════ CASES ════════════════

{
    id: 'q47', type: 'mcq', section: 'Case · School-Age Prominauris',
    stem: 'A 6-year-old boy is teased at school for bilateral prominent ears. Superior helix–mastoid distance is 24 mm, the superior crus is absent, and the conchal bowl is deep. What operation is indicated?',
    options: [
        { id: 'a', text: 'Postauricular skin excision alone' },
        { id: 'b', text: 'Mustardé sutures for the antihelix and superior crus, then Furnas conchomastoid sutures' },
        { id: 'c', text: 'Furnas sutures first, then Mustardé sutures' },
        { id: 'd', text: 'Neonatal-style molding for 6 weeks' },
    ],
    correct: 'b',
    brief: 'Two components, two techniques: Mustardé for the absent superior crus and antihelix, Furnas for the deep concha — Mustardé first.',
    detailed: 'His superior prominence is well above the 10–12 mm norm, and analysis identifies both components of prominauris. At 6, the ear is 80–90% of adult size and he can cooperate with a headband. Molding is ineffective after the first weeks of life; skin excision does not set the ear back; and placing Furnas sutures first blocks access for posterior Mustardé sutures. Pearl: document measurements and photographs of both ears before injecting local anesthetic.',
    concepts: ['case-prominauris', 'prominauris'],
},
{
    id: 'q48', type: 'mcq', section: 'Case · School-Age Prominauris',
    stem: '(Same patient.) On postoperative day 1, the left ear is markedly more swollen and ecchymotic than the right, fluctuant, and he is febrile. What is the next step?',
    options: [
        { id: 'a', text: 'Reapply a tighter mastoid dressing' },
        { id: 'b', text: 'Aspirate or open the incision to evacuate the hematoma' },
        { id: 'c', text: 'Oral cephalexin and review in a week' },
        { id: 'd', text: 'Warm compresses' },
    ],
    correct: 'b',
    brief: 'Asymmetric swelling with fluctuance and fever in the first 24–48 hours is a hematoma needing evacuation.',
    detailed: 'Untreated, the hematoma separates perichondrium from cartilage and sets up infection, perichondritis, necrosis, and eventual cauliflower deformity. Evacuate (aspiration or reopening), control bleeding, and re-dress with appropriate — not excessive — pressure, since an overly tight dressing can necrose skin. Pearl: the drain and dressing are prophylaxis, not a guarantee; the exam is what catches a hematoma.',
    concepts: ['case-prominauris', 'hematoma'],
},
{
    id: 'q49', type: 'mcq', section: 'Case · School-Age Prominauris',
    stem: '(Same patient.) At 3 months, the swelling has resolved and the headband is off. On frontal view, the helix of the right ear is not visible behind a sharply projecting antihelix. What happened, and when should it be revised?',
    options: [
        { id: 'a', text: 'Telephone ear from the central Furnas suture; wait at least 2 years' },
        { id: 'b', text: 'Hidden helix from overtightened Mustardé sutures; revise sooner rather than later, before scar matures' },
        { id: 'c', text: 'Vertical post from straight-line Mustardé sutures; never revise' },
        { id: 'd', text: 'Recurrence from suture failure; wait for spontaneous correction' },
    ],
    correct: 'b',
    brief: 'Antihelix projecting beyond the helix = hidden helix, an overtightened-Mustardé error. Revise once edema settles, before scar progresses.',
    detailed: 'A normal ear shows the helix just lateral to the antihelix on frontal view. When Mustardé sutures overfold the antihelix, it becomes the most lateral structure. Progressive scar makes revision harder, so once a deformity is evident after edema resolves and headband wear ends, correct it promptly. Pearl: the guide-suture method — tighten permanents only until the guide slackens — is the defense against this.',
    concepts: ['case-prominauris', 'contour-deformities'],
},
{
    id: 'q50', type: 'mcq', section: 'Case · Neonatal Deformity',
    stem: 'A 10-day-old is referred for a unilateral pointed ear with a flattened superior helix and a third antihelical crus. What is the recommended management?',
    options: [
        { id: 'a', text: 'Reassure — it will correct with growth' },
        { id: 'b', text: 'Begin ear molding now' },
        { id: 'c', text: 'Plan otoplasty at 6 months' },
        { id: 'd', text: 'Obtain a temporal bone CT' },
    ],
    correct: 'b',
    brief: 'Stahl ear at 10 days: mold now, inside the estrogen window — it obviates surgery.',
    detailed: 'For Stahl ear there is no surgical consensus but full agreement that neonatal molding is the best treatment. At 10 days the cartilage is still malleable under maternal estrogen; start by 3 weeks. Imaging is unnecessary for an isolated shape anomaly with a normal canal. Pearl: this is a referral-speed problem — every week of delay lowers the odds.',
    concepts: ['case-neonate', 'stahl-ear'],
},
{
    id: 'q51', type: 'mcq', section: 'Case · Neonatal Deformity',
    stem: '(Same infant.) Molding starts. At the 2-week visit the device is removed. What typically happens next?',
    options: [
        { id: 'a', text: 'Treatment ends — two weeks is sufficient' },
        { id: 'b', text: 'A larger appliance is placed for interim growth, with review in 2 more weeks, repeating until the result is reached or progress stops (about 6 weeks)' },
        { id: 'c', text: 'The same device is reapplied for 6 months' },
        { id: 'd', text: 'Surgery is scheduled if the ear is not yet normal' },
    ],
    correct: 'b',
    brief: 'Two-week cycles, upsizing each time, typically about 6 weeks in total.',
    detailed: 'Each visit removes the device, examines progress and the skin, and places a larger appliance to accommodate growth. Hair trimming and adhesive keep the device on between visits. Complications are limited to adhesive irritation and conformer abrasion or pressure ischemia. Pearl: stop when progress stops — additional weeks without change add skin risk without benefit.',
    concepts: ['case-neonate', 'ear-molding'],
},
{
    id: 'q52', type: 'mcq', section: 'Case · Neonatal Deformity',
    stem: '(Counterfactual.) The same deformity is first seen at 4 months of age. What is the plan?',
    options: [
        { id: 'a', text: 'Mold for 12 weeks instead of 6' },
        { id: 'b', text: 'Defer to surgical correction at about 5–6 years' },
        { id: 'c', text: 'Operate now while cartilage is soft' },
        { id: 'd', text: 'Refer for microtia reconstruction' },
    ],
    correct: 'b',
    brief: 'Past 2–3 weeks, molding loses efficacy; the next window is surgery at 5–6 years.',
    detailed: 'Cartilage malleability declines as maternal estrogen wanes, so molding outcomes fall quickly after the first weeks. Surgery waits for near-adult ear size and the child’s cooperation with postoperative care. For Stahl ear, expect a less predictable operation (scoring, excision, or splinting of the Stahl bar). Pearl: this case is the argument for newborn-nursery screening of ear shape.',
    concepts: ['case-neonate', 'surgical-timing', 'stahl-ear'],
},
{
    id: 'q53', type: 'mcq', section: 'Case · Grade III Microtia',
    stem: 'A 4-year-old has unilateral grade III microtia with ipsilateral aural atresia; the contralateral ear hears normally. The family wants autologous rib reconstruction. When should it be planned?',
    options: [
        { id: 'a', text: 'Immediately, to minimize psychosocial harm' },
        { id: 'b', text: 'When there is sufficient costal cartilage — often around age 10 for a two-stage Nagata reconstruction' },
        { id: 'c', text: 'After skeletal maturity at 18' },
        { id: 'd', text: 'Only after atresiaplasty has created a canal' },
    ],
    correct: 'b',
    brief: 'Autologous frameworks wait for adequate rib cartilage; Nagata’s two-stage method needs the most, so it typically starts around age 10.',
    detailed: 'Brent’s four-stage approach uses less cartilage and can start younger (≈ 6–8 in the vault); Nagata’s integrated construct needs more (≈ 10, adequate chest circumference). If the family wanted to start earlier, porous polyethylene under a TPF flap is the alternative, with its lifetime exposure risk. Meanwhile, hearing is managed independently — bone-conduction devices decouple hearing from the reconstruction calendar. Pearl: counsel on timing at the first visit, so the family is not waiting for an operation that cannot yet be done.',
    explanationImage: 'img/oksat/otoplasty/marx-classification.jpg',
    explanationImageAlt: 'Marx classification panel; grade III shows a small cartilage remnant with an anterosuperiorly rotated lobule',
    concepts: ['case-microtia', 'framework-choice', 'microtia-staging'],
},
{
    id: 'q54', type: 'mcq', section: 'Case · Grade III Microtia',
    stem: '(Same patient.) The otologist and reconstructive surgeon plan both atresiaplasty and framework reconstruction. In what order?',
    options: [
        { id: 'a', text: 'Atresiaplasty first, so the framework can be positioned around the new canal' },
        { id: 'b', text: 'Framework placement (and lobule transposition) first; atresiaplasty afterward' },
        { id: 'c', text: 'Both in a single operation' },
        { id: 'd', text: 'The order does not matter' },
    ],
    correct: 'b',
    brief: 'Framework before canal: atresia surgery scars the virgin mastoid skin the framework depends on.',
    detailed: 'The framework needs an unscarred, well-vascularized skin envelope; drilling a canal first creates dense scar, disrupts the subdermal plexus, and obscures landmarks for positioning the ear. The vault’s integrated sequence places framework inset and lobule transposition before the otologist’s drill-out. This comes from the sk.oto notes (Baker, Ch 22–23) rather than the StatPearls article. Pearl: the ear is built first, then the canal is placed into it.',
    concepts: ['case-microtia', 'microtia-sequencing'],
},
{
    id: 'q55', type: 'mcq', section: 'Case · Grade III Microtia',
    stem: '(Same patient, now age 10.) Weeks after Nagata stage 1, skin over the superior helix of the construct breaks down, exposing cartilage. What is the typical salvage?',
    options: [
        { id: 'a', text: 'Topical antibiotics and observation' },
        { id: 'b', text: 'Remove the entire framework' },
        { id: 'c', text: 'Transpose a temporoparietal fascia flap over the exposure and skin-graft it, with antibiotics as needed' },
        { id: 'd', text: 'Replace the construct with porous polyethylene' },
    ],
    correct: 'c',
    brief: 'Superior-helix necrosis is the classic microtia wound complication; a TPF flap restores blood supply and a graftable bed.',
    detailed: 'Pressure and tenuous perfusion at the superior helix make it the usual site of skin and cartilage necrosis; Pseudomonas infection can follow. The TPF flap brings vascularized tissue to cover cartilage and accept a skin graft. Late risks of any construct include trauma-related necrosis and exposure, with resorption (cartilage) or infection (synthetic), and migration or extrusion — lower with costal cartilage than porous polyethylene. Pearl: the TPF flap is the "insurance policy" of auricular reconstruction — do not burn it with a careless temporal incision.',
    concepts: ['case-microtia', 'construct-complications'],
},
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
