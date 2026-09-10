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
];

/* Back-compat alias (older cached pages). */
window.MCQ_MANIFEST = window.OKSAT_MANIFEST;
