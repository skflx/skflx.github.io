/* =============================================================
   OKSAT study modules — manifest
   (OHNS Knowledge Self-Assessment Tool.)
   Single source of truth for the hub (oksat.html), the dynamic
   viewer (oksat-study.html), and the Atlas graph. To add a module:
   drop a data file in js/mcq-modules/<slug>.js (ending in
   window.__MCQ_MODULE = {...}) and append one entry here — or let
   the Question Forge (oksat-generate.html) write both for you.
   See docs/authoring-oksat.md.

   `subspecialty` keys into OKSAT_SUBSPECIALTIES below; the Atlas
   uses it to cluster modules and color their nodes.
   ============================================================= */

/* OHNS subspecialty ring — one hue per domain, carried through
   module cards, atlas nodes, and Forge-generated taxonomies. */
window.OKSAT_SUBSPECIALTIES = {
  /* One hue per subspecialty — the load-bearing colour of the whole
     system (chips, graph nodes, dashboard bars). These are a SOLVED
     palette, not chosen by eye: hues spaced around the wheel with
     per-slot lightness stepping so neighbours stay separable under
     colour-vision deficiency. Light and dark are independent solves.
     Provenance + validator invocation: docs/ui-directions.md.
     Mirrored as --sub-* in css/tokens.css for CSS consumers.

     Declaration order is load-bearing (the palette is validated on
     ADJACENT pairs). Do not reorder or edit a hue without
     re-validating, and never use these as the only cue — every use
     must carry a label too. */
  otology:      { label: 'Otology / Neurotology',             hue: '#1d80c4', hueDark: '#327db6' },
  rhinology:    { label: 'Rhinology / Allergy',               hue: '#e6797b', hueDark: '#d17576' },
  laryngology:  { label: 'Laryngology / Bronchoesophagology', hue: '#367926', hueDark: '#417734' },
  hn_onc:       { label: 'Head & Neck Oncology',              hue: '#9e73cb', hueDark: '#9471bb' },
  fprs:         { label: 'Facial Plastics & Recon',           hue: '#966508', hueDark: '#956408' },
  pediatrics:   { label: 'Pediatric Otolaryngology',          hue: '#15aaa3', hueDark: '#13a09a' },
  sleep:        { label: 'Sleep Medicine',                    hue: '#9b3a22', hueDark: '#964430' },
  endocrine:    { label: 'Endocrine',                         hue: '#898a0d', hueDark: '#838424' },
  fundamentals: { label: 'Fundamentals / Anatomy',            hue: '#8b90ed', hueDark: '#8488d6' },
};

/* Theme-aware marker lookup. Every consumer that used to read
   `sub.hue` directly should call this instead, so the dark palette
   actually reaches the screen. Accepts a subspecialty key or the
   entry object; falls back to the light hue, then to a neutral, so
   a missing entry degrades to something renderable rather than
   throwing (house convention: fail safe, never throw). */
window.OKSATHue = function (subOrKey, themeOverride) {
  try {
    var sub = (typeof subOrKey === 'string')
      ? window.OKSAT_SUBSPECIALTIES[subOrKey]
      : subOrKey;
    if (!sub) return 'var(--ok-text-faint)';
    var theme = themeOverride
      || document.documentElement.getAttribute('data-theme')
      || 'dark';
    return (theme === 'dark' && sub.hueDark) ? sub.hueDark : (sub.hue || 'var(--ok-text-faint)');
  } catch (e) {
    return 'var(--ok-text-faint)';
  }
};
window.OKSAT_MANIFEST = [
  {
    slug: 'pediatrics',
    title: 'Pediatric Hearing Loss',
    kicker: 'Pediatric Module',
    subspecialty: 'pediatrics',
    count: 40,
    accent: '#4FB3E8',
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
    accent: '#4FB3E8',
    desc: 'A sequential self-test (reveal-and-grade) on the operative approach, completion thyroidectomy, histopathology, and the 2025 ATA Risk Stratification System — Recommendations 15, 16, 27, 28.',
    data: 'js/mcq-modules/dtc-risk-stratification.js',
  },
];

/* Back-compat alias (older cached pages). */
window.MCQ_MANIFEST = window.OKSAT_MANIFEST;
