/* =============================================================
   OKSAT study modules — manifest
   (OHNS Knowledge Self-Assessment Tool.)
   Single source of truth for the hub (oksat.html) and the dynamic
   viewer (oksat-study.html). To add a module: drop a data file in
   js/mcq-modules/<slug>.js (ending in window.__MCQ_MODULE = {...})
   and append one entry here. `count` must equal ITEMS.length —
   tools/check-data.mjs enforces it. See docs/authoring-oksat.md.

   `subspecialty` keys into OKSAT_SUBSPECIALTIES below; the hub uses
   it to group module cards and color their accent bar.
   ============================================================= */

/* OHNS subspecialty ring — one hue per domain, carried through
   module cards and their accent bars. */
window.OKSAT_SUBSPECIALTIES = {
  otology:      { label: 'Otology / Neurotology',             hue: '#2F6E6A' },
  rhinology:    { label: 'Rhinology / Allergy',               hue: '#6E4A6B' },
  laryngology:  { label: 'Laryngology / Bronchoesophagology', hue: '#C06A4A' },
  hn_onc:       { label: 'Head & Neck Oncology',              hue: '#9A4B2E' },
  fprs:         { label: 'Facial Plastics & Recon',           hue: '#7A5A3A' },
  pediatrics:   { label: 'Pediatric Otolaryngology',          hue: '#7C7A3A' },
  sleep:        { label: 'Sleep Medicine',                    hue: '#5A567E' },
  endocrine:    { label: 'Endocrine',                         hue: '#A8863A' },
  fundamentals: { label: 'Fundamentals / Anatomy',            hue: '#55606A' },
};

window.OKSAT_MANIFEST = [
  {
    slug: 'pediatrics',
    title: 'Pediatric Hearing Loss',
    kicker: 'Pediatric Module',
    subspecialty: 'pediatrics',
    count: 40,
    accent: '#2C5454',
    desc: 'Embryology, conductive and sensorineural causes, syndromic genetics, EHDI screening, and clinical cases.',
    data: 'js/mcq-modules/pediatrics.js',
  },
  {
    slug: 'ta-tubes',
    title: 'Tubes, Tonsils & Neck',
    kicker: 'Pediatric OR Primer',
    subspecialty: 'pediatrics',
    count: 54,
    accent: '#A0635E',
    desc: 'Myringotomy and tubes, adenotonsillectomy (extra- and intracapsular), Level II neck node excision, and operative complications.',
    data: 'js/mcq-modules/ta-tubes.js',
  },
  {
    slug: 'vestibular-schwannoma',
    title: 'Vestibular Schwannoma',
    kicker: 'Neurotology Module',
    subspecialty: 'otology',
    count: 46,
    accent: '#5C4F7B',
    desc: 'CPA/IAC anatomy, NF2 genetics and histopathology, natural history, diagnosis and imaging, the surgical approaches plus radiosurgery, complications, and NF2 management.',
    data: 'js/mcq-modules/vestibular-schwannoma.js',
  },
  {
    slug: 'facial-reanimation',
    title: 'Facial Reanimation',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 42,
    accent: '#7B5C3A',
    desc: 'Facial nerve anatomy, aberrant regeneration and synkinesis, evaluation scales, Bell’s palsy workup, electrodiagnostics, nerve repair, transfers, free-muscle reconstruction, and conference cases.',
    data: 'js/mcq-modules/facial-reanimation.js',
  },
  {
    slug: 'dtc-risk-stratification',
    title: 'Thyroid Cancer Risk Stratification',
    kicker: 'Endocrine · 2025 ATA · Free-response',
    subspecialty: 'endocrine',
    count: 25,
    accent: '#2C5454',
    desc: 'A sequential self-test (reveal-and-grade) on the operative approach, completion thyroidectomy, histopathology, and the 2025 ATA Risk Stratification System — Recommendations 15, 16, 27, 28.',
    data: 'js/mcq-modules/dtc-risk-stratification.js',
  },
  {
    slug: 'lip-reconstruction',
    title: 'Lip Reconstruction',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 52,
    accent: '#7A5A3A',
    desc: 'Lip anatomy, oncologic considerations, vermilion and small-defect repairs, cross-lip flaps (Abbe, Estlander), Karapandzic and Gillies rotation flaps, subtotal reconstruction, and clinical cases.',
    data: 'js/mcq-modules/lip-reconstruction.js',
  },
  {
    slug: 'otoplasty',
    title: 'Otoplasty & Auricular Deformity',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 55,
    accent: '#7A5A3A',
    desc: 'Auricular anatomy and norms, Mustardé and Furnas otoplasty, Stahl ear, cryptotia, cauliflower ear, neonatal molding, microtia frameworks, complications, and clinical cases — with StatPearls clinical photographs.',
    data: 'js/mcq-modules/otoplasty.js',
  },
  {
    slug: 'facial-analysis',
    title: 'Facial Analysis',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 64,
    accent: '#7A5A3A',
    desc: 'Photography and skin typing, soft-tissue landmarks and planes, thirds and fifths, profile angles, nasal anatomy and tip support, nasal analysis from every view, and four integrating cases — with textbook figures.',
    data: 'js/mcq-modules/facial-analysis.js',
  },
  {
    slug: 'allergy-testing',
    title: 'Allergy and Allergy Testing',
    kicker: 'Rhinology / Allergy',
    subspecialty: 'rhinology',
    count: 83,
    accent: '#6E4A6B',
    desc: 'The mediator cascade, skin and in vitro testing, pharmacotherapy and immunotherapy, biologics, and the OHNS crossovers — AFRS, AERD, angioedema, and food syndromes.',
    data: 'js/mcq-modules/allergy-testing.js',
  },
  {
    slug: 'mandible-fractures',
    title: 'Mandible Fractures',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 43,
    accent: '#7A5A3A',
    desc: 'Biomechanics and favorable versus unfavorable patterns, condylar classification, closed and open treatment, load-bearing fixation, the edentulous and pediatric mandible, complications, and cases.',
    data: 'js/mcq-modules/mandible-fractures.js',
  },
  {
    slug: 'midface-fractures',
    title: 'Midface Fractures',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 32,
    accent: '#7A5A3A',
    desc: 'Buttresses and occlusion, Le Fort I to III, nasal bone fractures, the zygomaticomaxillary complex, Gillies and Keen, one- to four-point fixation, and cases.',
    data: 'js/mcq-modules/midface-fractures.js',
  },
  {
    slug: 'orbit-noe-trauma',
    title: 'Orbital & NOE Trauma',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 30,
    accent: '#7A5A3A',
    desc: 'Orbital anatomy and exam, blowout fractures, timing and approaches, naso-orbito-ethmoid fractures and the canthal tendon, apex, fissure and cavernous sinus syndromes, and cases.',
    data: 'js/mcq-modules/orbit-noe-trauma.js',
  },
  {
    slug: 'facial-trauma-evaluation',
    title: 'Facial Trauma: Evaluation & Airway',
    kicker: 'Facial Plastics & Recon',
    subspecialty: 'fprs',
    count: 28,
    accent: '#7A5A3A',
    desc: 'The trauma history and exam, laceration repair by structure, indications and options for securing the airway, ballistic injury, and cases.',
    data: 'js/mcq-modules/facial-trauma-evaluation.js',
  },
  {
    slug: 'temporal-bone-trauma',
    title: 'Temporal Bone Trauma',
    kicker: 'Otology / Neurotology',
    subspecialty: 'otology',
    count: 24,
    accent: '#2F6E6A',
    desc: 'Longitudinal versus transverse and otic capsule-sparing versus -disrupting fractures, sequelae, facial nerve injury and decompression, CSF otorrhea, and cases.',
    data: 'js/mcq-modules/temporal-bone-trauma.js',
  },
];

/* Back-compat alias (older cached pages). */
window.MCQ_MANIFEST = window.OKSAT_MANIFEST;
