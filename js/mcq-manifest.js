/* =============================================================
   MCQ study modules — manifest
   Single source of truth for the hub (mcq.html) and the dynamic
   viewer (mcq-study.html). To add a module: drop a data file in
   js/mcq-modules/<slug>.js (ending in window.__MCQ_MODULE = {...})
   and append one entry here. See docs/authoring-mcq.md.
   ============================================================= */
window.MCQ_MANIFEST = [
  {
    slug: 'pediatrics',
    title: 'Pediatric Hearing Loss',
    kicker: 'Pediatric Module',
    count: 40,
    accent: '#2C5454',
    desc: 'Embryology, conductive and sensorineural causes, syndromic genetics, EHDI screening, and clinical cases.',
    data: 'js/mcq-modules/pediatrics.js',
  },
  {
    slug: 'ta-tubes',
    title: 'Tubes, Tonsils & Neck',
    kicker: 'Pediatric OR Primer',
    count: 54,
    accent: '#A0635E',
    desc: 'Myringotomy and tubes, adenotonsillectomy (extra- and intracapsular), Level II neck node excision, and operative complications.',
    data: 'js/mcq-modules/ta-tubes.js',
  },
  {
    slug: 'vestibular-schwannoma',
    title: 'Vestibular Schwannoma',
    kicker: 'Neurotology Module',
    count: 46,
    accent: '#5C4F7B',
    desc: 'CPA/IAC anatomy, NF2 genetics and histopathology, natural history, diagnosis and imaging, the surgical approaches plus radiosurgery, complications, and NF2 management.',
    data: 'js/mcq-modules/vestibular-schwannoma.js',
  },
  {
    slug: 'facial-reanimation',
    title: 'Facial Reanimation',
    kicker: 'Facial Plastics & Recon',
    count: 42,
    accent: '#7B5C3A',
    desc: 'Facial nerve anatomy, aberrant regeneration and synkinesis, evaluation scales, Bell’s palsy workup, electrodiagnostics, nerve repair, transfers, free-muscle reconstruction, and conference cases.',
    data: 'js/mcq-modules/facial-reanimation.js',
  },
];
