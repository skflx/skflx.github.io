/* =============================================================
   review-items.js — the owner's review list, read by review.html.
   One entry per view the owner must verify. A work package that needs
   human verification adds or updates its entry here (docs/delegation.md).
   Fields: id (unique), group, issue (optional, "#n"), title, look (one
   sentence: what to check), links ([{label, href}], href = a root page
   plus an optional #hash, relative, no scheme), note (optional).
   tools/check-data.mjs (checkReviewItems) enforces the shape and the links.
   ============================================================= */
window.__REVIEW_ITEMS = [
  /* ---- SSB, issue #296 ---- */
  { id: 'ssb-uncinectomy', group: 'SSB (#296)', issue: '#296',
    title: 'Uncinectomy opens the infundibular trough',
    look: 'On the uncinectomy step the infundibular trough is open, and the natural ostium shows once the antrostomy is in.',
    links: [
      { label: 'Uncinectomy, step 1', href: 'ssb.html#p=p.uncinectomy&step=1' },
      { label: 'Antrostomy, step 1', href: 'ssb.html#p=p.maxillary-antrostomy&step=1' }
    ] },
  { id: 'ssb-antrostomy-window', group: 'SSB (#296)', issue: '#296',
    title: 'Antrostomy window 18.5 x 9 mm (prototype)',
    look: 'The antrostomy window reads 18.5 x 9 mm on the prototype; CP-3 pinned 19 x 9.5 mm, so check which figure the step shows.',
    links: [{ label: 'Antrostomy, step 1', href: 'ssb.html#p=p.maxillary-antrostomy&step=1' }] },
  { id: 'ssb-sella-lateral-limit', group: 'SSB (#296)', issue: '#296',
    title: 'Sellar opening: lateral limit at the ICA tube',
    look: 'The sellar opening stops 1 mm lateral to the ICA tube; the 29 % inferred figure is the reason to check it.',
    links: [{ label: 'Transsellar, step 4', href: 'ssb.html#p=p.transsellar-approach&step=4' }] },
  { id: 'ssb-choanal-arch-limit', group: 'SSB (#296)', issue: '#296',
    title: 'Posterior septectomy: choanal-arch inferior limit (O10)',
    look: 'The inferior limit of the posterior septectomy sits at the choanal arch, as drawn on the step.',
    links: [{ label: 'Transclival, step 2', href: 'ssb.html#p=p.transclival-approach&step=2' }],
    note: 'Step chosen from the procedure index; if the septectomy shows on another step, correct this link.' },
  { id: 'ssb-flap-full-right', group: 'SSB (#296)', issue: '#296',
    title: 'Nasoseptal flap, full size, right side',
    look: 'The full right flap overlay sits on the septum at its standard size, with its controls open.',
    links: [{ label: 'Flap, tier 3, full R', href: 'ssb.html#tier=3&flap=full.R' }] },
  { id: 'ssb-asymmetry-scanned', group: 'SSB (#296)', issue: '#296',
    title: 'Asymmetry: the scanned base and its note',
    look: 'The scanned base is described as the edge of normal, not typical, and the note says why.',
    links: [{ label: 'Scanned base', href: 'ssb.html#anat=scanned' }] },
  { id: 'ssb-st6-valve-plane', group: 'SSB (#296)', issue: '#296',
    title: 'ST6: valve plane at A -10',
    look: 'On the CT the valve plane sits at A -10, the level the nasal framework view gives.',
    links: [{ label: 'Nasal framework lab', href: 'ssb.html#lab=nasal-framework' }] },
  { id: 'ssb-st6-labial-branch', group: 'SSB (#296)', issue: '#296',
    title: 'ST6: superior labial branch in the columella',
    look: 'Decide whether the superior labial branch should be drawn into the columella, as the framework lab shows it.',
    links: [{ label: 'Nasal framework lab', href: 'ssb.html#lab=nasal-framework' }] },
  { id: 'ssb-aea-pea-spacing', group: 'SSB (#296)', issue: '#296',
    title: 'AEA-PEA spacing: 21 mm here, 12 mm in the population',
    look: 'The AEA-PEA spacing reads 21 mm in this specimen against 12 mm in the population, and the PEA is inferred.',
    links: [{ label: 'Ethmoid roof lab', href: 'ssb.html#lab=ethmoid-roof' }] },
  { id: 'ssb-tier1-fess', group: 'SSB (#296)', issue: '#296',
    title: 'Tier 1: FESS anatomy',
    look: 'The tier-1 FESS structures and their labels read as the anatomy you would expect for a first pass.',
    links: [{ label: 'Tier 1', href: 'ssb.html#tier=1' }] },
  { id: 'ssb-diorama-frontal-recess', group: 'SSB (#296)', issue: '#296',
    title: 'Diorama: frontal recess (schematic proportions)',
    look: 'The frontal-recess proportions are schematic; the drainage path is computed from the cells, not drawn.',
    links: [{ label: 'Frontal recess lab', href: 'ssb.html#lab=frontal-recess' }] },
  { id: 'ssb-diorama-ethmoid-roof', group: 'SSB (#296)', issue: '#296',
    title: 'Diorama: ethmoid roof (schematic proportions)',
    look: 'The ethmoid-roof proportions are schematic, and the AEA course matches the spacing noted above.',
    links: [{ label: 'Ethmoid roof lab', href: 'ssb.html#lab=ethmoid-roof' }] },
  { id: 'ssb-figure-fusion', group: 'SSB (#296)', issue: '#296',
    title: 'Figure: binaural pitch fusion (Fig. 2)',
    look: 'Open the fusion figure under Research by clicking the word "fusion", and check its caption and schematic label.',
    links: [{ label: 'Research section', href: 'index.html#research' }],
    note: 'Assumed to be the figure the issue calls Fig. 2; correct this entry if not.' },
  { id: 'ssb-figure-larynx', group: 'SSB (#296)', issue: '#296',
    title: 'Figure: larynx',
    look: 'Click the word "Airway" in the Airway Rounds heading, and check the larynx figure and its caption.',
    links: [{ label: 'Airway Rounds', href: 'airway-jeopardy.html' }] },

  /* ---- SSB follow-ups, issue #297 ---- */
  { id: 'ssb-flap-readout', group: 'SSB follow-ups (#297)', issue: '#297',
    title: 'Flap readout: 25.1 cm2 maximum',
    look: 'Once the measurement node lands, the full right flap readout shows 25.1 cm2 with its source.',
    links: [{ label: 'Flap, tier 3, full R', href: 'ssb.html#tier=3&flap=full.R' }],
    note: 'Open until the orchestrator adds the measurement node.' },
  { id: 'ssb-asymmetry-note', group: 'SSB follow-ups (#297)', issue: '#297',
    title: 'POP0: asymmetry note on the scanned base',
    look: 'The scanned note says the asymmetry is unresolved and defers to the resegmentation; check that the wording is right.',
    links: [{ label: 'Scanned base', href: 'ssb.html#anat=scanned' }] },
  { id: 'ssb-graph-canal-ids', group: 'SSB follow-ups (#297)', issue: '#297',
    title: 'Graph ids: posterior ethmoidal and nasolacrimal canals',
    look: 'Nothing to view yet: these two ids are needed before RS5 and wait on orchestrator content.',
    links: [] },

  /* ---- OLSB ---- */
  { id: 'olsb-3d-fit', group: 'OLSB fit', issue: null,
    title: 'OLSB 3D model fit',
    look: 'Turn the 3D model and check that the oval window origin and the drill states match the fit you expect.',
    links: [{ label: 'OLSB 3D model', href: 'OLSB.html#m=3d' }] },
  { id: 'olsb-real-ct', group: 'OLSB fit', issue: null,
    title: 'OLSB real CT slices',
    look: 'Scroll the axial, coronal and sagittal CT slices and check that the labelled points line up with the model.',
    links: [
      { label: 'Real CT', href: 'OLSB.html#m=ct' },
      { label: 'Real CT, axial', href: 'OLSB.html#m=ct&pl=ax' },
      { label: 'Real CT, coronal', href: 'OLSB.html#m=ct&pl=cor' },
      { label: 'Real CT, sagittal', href: 'OLSB.html#m=ct&pl=sag' }
    ] },

  /* ---- Site pages changed recently ---- */
  { id: 'site-index', group: 'Site pages', issue: null,
    title: 'One-pager',
    look: 'The five sections fold and open from their heads, and the residency year reads correctly.',
    links: [{ label: 'One-pager', href: 'index.html' }] },
  { id: 'site-search', group: 'Site pages', issue: null,
    title: 'Search',
    look: 'One box returns hits from the OKSAT modules and the CPT table, and reads well at phone width.',
    links: [{ label: 'Search', href: 'search.html' }] },
  { id: 'site-oksat-learn', group: 'Site pages', issue: null,
    title: 'OKSAT learning viewer',
    look: 'A guide opens at its first chapter, and the chapter flow and hotspot links work.',
    links: [{ label: 'Learning viewer', href: 'oksat-learn.html' }] },
  { id: 'site-airway', group: 'Site pages', issue: null,
    title: 'Airway Rounds stage in both themes',
    look: 'The game stage follows the site theme: light for rooms, dark for projectors.',
    links: [{ label: 'Airway Rounds', href: 'airway-jeopardy.html' }] },

  /* ---- Not in the repo ---- */
  { id: 'ext-openear-zeta', group: 'Not in the repo', issue: null,
    title: 'OpenEar ZETA review',
    look: 'Review the OpenEar ZETA notes; they are a local file on your machine, not part of this repository.',
    links: [],
    note: 'Text note only: open the local file where you keep it.' }
];
