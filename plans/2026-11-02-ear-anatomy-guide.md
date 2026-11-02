# Spec — Normal ear anatomy: OKSAT guide + question module (2026-11-02)

> **Status lives in GitHub Issues** (parent issue to be opened on import), one sub-issue per work
> package (WP), labelled `wave:n` / `model:*` / `type:*`. This file is the spec: decisions, contracts,
> content, numbers. It changes only through PRs. Commits: **one short line, no trailers.**

---

## 0. Context

A first-pass OKSAT Interactive learning guide on **normal outer and middle ear anatomy**, plus its
companion question module, built for PGY-3 level: ABOHNS written/OTE recall and OR fluency for
tympanoplasty, mastoidectomy, stapes surgery and the facial recess approach.

The guide teaches the ear as a **relational map**. Every structure is learned by its boundaries, its
neighbours in six directions, its contents, its nerve and arterial supply, its embryologic origin
where that explains its position, and the surgical consequence of that position.

It follows the existing OKSAT pattern (`docs/authoring-oksat-guide.md`): **teach first** (guide
sections with predict-then-reveal prompts), **then test** (module questions answered in place and
drilled by concept), **then review** (the module's Leitner schedule). It adapts that pattern for
anatomy and visual learning with four new guide block types and purpose-drawn SVG figures. It does
not link to `OLSB.html` (D6).

Second guide after `ar-crs-aerd`, so `tools/lint-oksat-guide.mjs` is built alongside it
(`docs/oksat-learn-roadmap.md` §2).

## 1. Locked decisions (owner, 2026-11-02)

| # | Decision |
|---|---|
| D1 | Format = **OKSAT guide** (`oksat-learn.html?g=ear-anatomy`) + **companion question module** (`oksat-study.html?m=ear-anatomy`). Teach → test → Leitner review. No standalone app, no P2-style build. |
| D2 | Hosted in this repo; repo conventions govern (`AGENTS.md`, `docs/decisions.md`). |
| D3 | **Order: external to internal, transcanal, woven.** Auricle → EAC → TM → tympanic cavity → ossicles → spaces → ET → mastoid → petrous apex. Each nerve, vessel and embryologic origin is taught where the reader first meets it; one consolidation chapter at the end gathers the systems. |
| D4 | **Interactives: four lightweight block types** added to `js/oksat/learn.js` (§4.2): `hotspot`, `layers`, `neighbors`, `sequence`. Spatial and cut-plane work is carried by multi-frame SVG `hotspot` and `layers` blocks. No 3D in this guide; better 3D modelling is a separate later project. |
| D5 | **One registry.** `js/olsb/glossary.js` is extended to carry every structure the guide names (auricle, EAC, vessels, nerves, ET, petrous apex). Guide blocks read it. No second ontology. |
| D6 | **No link to OLSB** (owner, 2026-11-02, reversing the draft's amendment of plan 2026-10-28 D7). OLSB is a test bed for 3D anatomy, not a study source yet; 2026-10-28 D7 stands unchanged. The OLSB link design is parked in Appendix A; revisit when the owner declares OLSB complete. Reading its glossary as a data file (D5) is not a link. |
| D7 | Subspecialty = **otology** (`#2F6E6A`). |
| D8 | **Unlisted for now.** The guide is registered but hidden from the hub (`unlisted: true`, §4.1). |
| D9 | **Figures: own SVG for everything not publicly postable.** Drive figures are drawing references only: pulled into a session scratchpad, never committed. An open-license image is used instead of an SVG only when it shows the same view and the same teaching points as the Drive figure; it is vendored with its license and attribution. SVGs ship as first teaching drafts and are refined iteratively later. |
| D10 | **HRCT images:** open-license normal cases, vendored with attribution, plus a plan for built line-drawing slices. |
| D11 | **Petrous apex is in scope** (own chapter). CWD cavity anatomy is an optional `deep` block in the mastoid chapter. |
| D12 | **Vault kept separate.** No links to `sk.oto` now. Each section reserves the roadmap's Phase C `ref: []` slot, left empty, for later linking (`docs/oksat-learn-roadmap.md` §4). |
| D13 | **No static Markdown export.** OKSAT is the home. |
| D14 | Retrotympanum terms: vault/KJ Lee terms primary, Marchioni and Proctor synonyms shown beside them. |
| D15 | Co-design self-rating is optional, in the Start chapter. |
| D16 | Build is staged in the waves of §3 (fixed on import, 2026-11-02). |
| D17 | **No ASCII 3D figures** in the guide: on this site they are easter eggs, not study tools. |

## 2. Roles

Per `AGENTS.md` and `docs/delegation.md`. Opus owns all anatomy: glossary entries and relations,
hotspot region coordinates, SVG control points, chapter text, module items. Haiku owns machinery:
block types, validation, hub flag, lint. Sonnet ∥ Argon review each wave. Owner vets content and sets
`verified`.

## 3. Work packages (proposal; status lives in the issues)

| ID | Title | Model | Depends | Touch (indicative) | Accept |
|---|---|---|---|---|---|
| W0.1 | Land this spec; note D6 under 2026-10-28 D7; index in `plans/README.md` | Opus | — | `plans/` | `check-data` |
| W0.2 | Glossary extension data: new ids, `rel`, `syn`, `supply`, `origin` (§4.4, §7) | Opus | W0.1 | `js/olsb/glossary.js` | `check-data` (OLSB geometry vs `rel` still passes) |
| W0.3 | Pin block contracts and test cases (§4.2) | Opus | W0.1 | this spec | review |
| W0.4 | Figure references: pull Drive figures to a scratchpad (never committed); visual check of *verify* rows; open-license search per figure (same view and teaching points only, §4.5) | Opus | W0.1 | this spec (§6 table) | §6 records per figure: SVG or a named open-license file with license |
| W1.1 | Block types `hotspot`, `layers`, `neighbors`, `sequence` in the viewer | Haiku | W0.3 | `js/oksat/learn.js`, `css/oksat-learn.css`, `oksat-learn.html` | `test-oksat-learn.mjs` new cases pass; `smoke-pages` |
| W1.2 | `check-data` rules for the new blocks, `unlisted`, figure licence rule (§4.5) | Haiku | W0.3 | `tools/check-data.mjs` | fixtures fail/pass as specified |
| W1.3 | Hub honours `unlisted: true` | Haiku | W0.1 (§4.1 is already pinned) | `js/oksat/hub.js` | `test-oksat-learn.mjs` hub case |
| W1.4 | `tools/lint-oksat-guide.mjs` (roadmap §2 rules) | Haiku | W0.1 | `tools/` | runs clean on `ar-crs-aerd` |
| W2 | R1 content: `start`, `orientation`, `auricle`, `eac`, `tm`, `cavity`, `ossicles` + module items + their SVGs | Opus | W0.2, W0.4, W1.1, W1.2 | `js/oksat/guides/ear-anatomy/`, `js/oksat/modules/ear-anatomy.js`, `js/oksat/manifest.js`, `js/oksat/terms.js` | all checks; owner phone-width read |
| W3 | R2 content: `spaces`, `et`, `mastoid`, `petrous-apex` + items + SVGs | Opus | W2 | same | same |
| W4 | R3 content: `imaging` (CT vendored), `synthesis`, `appraisal` (PubMed pull) + items + SVGs | Opus | W3 | same + `images/oksat/ear-anatomy/ct/` | same |
| W6 | Listing decision (remove `unlisted`) | Owner | W4 | `js/oksat/manifest.js` | — |
| W7 | Docs pass per `docs/docs-map.md` after each wave: new block types into `docs/authoring-oksat-guide.md`; `README.md`, `docs/wip.md`, `AGENTS.md`, `docs/verification.md`, `docs/oksat-learn-roadmap.md` | Haiku | each wave | docs only | `check-data` |
| R1–R3 | Adversarial review per content wave | Sonnet ∥ Argon | each wave | — | PR reviews adjudicated by Opus |

SVGs are drawn inside each content wave (no separate SVG wave). Concurrency: W0.2, W0.3, W0.4, W1.3
and W1.4 can run at once; W1.1 and W1.2 start when W0.3 lands; within a content wave, chapters can be
written in parallel sessions.

## 4. Contracts (pinned in W0.3; Haiku never changes these)

### 4.1 Registry entries

```js
// OKSAT_GUIDES
{ slug: 'ear-anatomy', title: 'Normal Ear Anatomy: Outer and Middle Ear',
  kicker: 'Otology / Neurotology', subspecialty: 'otology', accent: '#2F6E6A',
  unlisted: true,
  desc: 'Auricle to petrous apex as a relational map: walls, neighbours, nerves and vessels where you meet them, read the way a surgeon explores.',
  chapters: [ /* §5 */ ] }

// OKSAT_MANIFEST
{ slug: 'ear-anatomy', title: 'Normal Ear Anatomy', kicker: 'Otology Module',
  subspecialty: 'otology', accent: '#2F6E6A', count: <n>, unlisted: true,
  desc: '…', data: 'js/oksat/modules/ear-anatomy.js' }
```

- `unlisted: true` hides the entry from the hub; its URL still works. W0 confirms `check-data`
  allows the same slug in both registries; if not, the module becomes `ear-anatomy-qs`.
- Module concepts = one key per guide section that has items (§5 section ids reused as concept keys
  where practical), so `drill` rows resolve one to one.

### 4.2 New guide block types

All render from data through DOM nodes (never `innerHTML`), store only in the guide's own record
(`oksat:learn:ear-anatomy:<code>`), and degrade to a plain `figure` or list without JS support.
Structure ids are glossary ids (§4.4); `check-data` fails an id the glossary lacks.

| `t` | Fields | Behaviour |
|---|---|---|
| `hotspot` | `id`, `alt`, `frames: [{src, cap?, regions: [{g, shape}]}]`, `modes?: ['explore','find']`, `label?` | **Explore**: tap a region → glossary name, synonyms, note, and its neighbours with direction. **Find**: prompt names a structure, learner taps; first tap scored, then revealed. More than one frame adds a stepper (CT stacks, drill-down states, canal positions). `shape` = SVG element id inside an SVG `src` (`data-g` attribute), or a polygon in % of image size for raster `src`. |
| `layers` | `id`, `alt`, `base`, `layers: [{id, label, src}]`, `mode: 'toggle'｜'step'`, `cap?` | **Toggle**: overlays on one base (topography / cartilage / arteries / nerves / lymph). **Step**: ordered states with a slider (TM layers peeled, ET adult → infant, isthmus open → blocked, mastoid depth). |
| `neighbors` | `id`, `g` (anchor), `dirs?` (default all six) | Learner fills sup/inf/ant/post/med/lat, then reveals the answer computed from glossary `rel` plus reverses; self-grades on the four tiers. The glossary is the answer key, so the text lives once. |
| `sequence` | `id`, `q`, `items: [x…]` (authored in correct order) | Shown shuffled; learner drags or keys into order; first order scored, then revealed. CN VII segments, landmark sequence to the facial recess. |

Existing types (`p`, `table`, `call`, `deep`, `cards`, `steps`, `figure`, `tool`, `check`,
`practice`, `drill`) are used unchanged.

These four are general anatomy primitives, used across every chapter here and by any later anatomy
guide, so they satisfy the skill rule against adding a block type for one chapter. They are documented
in `docs/authoring-oksat-guide.md` (W7).

### 4.3 OLSB deep links — parked (D6; see Appendix A)

Not used while OLSB is unlisted. The table below is kept for Appendix A.

| View | Hash | Use in guide |
|---|---|---|
| Surgical lateral, tympanoplasty tour | `#d=lateral&p=tympanoplasty&s=<n>` | EAC, flap, annulus, chorda at the posterosuperior annulus |
| Surgical lateral, mastoidectomy tour | `#d=lateral&p=mastoidectomy&s=<n>` | Landmark sequence, facial recess |
| Medial wall, reading tour | `#d=medial&p=reading&s=<n>` | Medial wall stack, retrotympanum, anterior wall |
| Axial posterior tympanum | `#d=axial&p=posterior&s=<n>` | Facial recess vs sinus tympani, three lines of sight |
| Coronal attic | `#d=coronal&p=attic&s=<n>` | Compartment widths, scutum, Prussak space |
| 3D model | `#m=3d&s=<step>` or `#m=3d&st=&L=&cut=&cam=` | Walk the cavity; cut planes matched to CT |

### 4.4 Glossary extension (`js/olsb/glossary.js`)

- New optional fields per entry: `syn: [string]` (synonyms and eponyms), `supply: {n: [id], a: [id]}`
  (nerve and arterial supply; ids in the glossary), `origin: [code]`, an array because many structures
  have more than one source (malleus, stapes, TM). Codes: `arch1`, `arch2`, `arch4`, `cleft1`, `pouch1`,
  `otic`, `mesenchyme` (W0.2).
- Ids are never renamed. New ids follow the file's existing short lowercase style.
- `rel` keeps its meaning ("X lies <dir> to this"); write each pair once.
- New ids that OLSB does not draw are allowed; the geometry check covers drawn pairs only.
- Draft content; owner verifies (`docs/decisions.md` §7).

### 4.5 Figures and the listing gate

- `images/oksat/ear-anatomy/<name>.svg`: purpose-drawn, captioned *schematic*. Copyrighted figures
  (textbook, Netter-style, Kenhub, Gralapp) are never committed, not even unlisted.
- An open-license raster replaces an SVG only when it shows the same view and teaching points. It
  lives in `images/oksat/ear-anatomy/` with an entry in `images/oksat/ear-anatomy/ATTRIBUTION.md`
  (file, source URL, author, license); its caption credits the source.
- `check-data` fails a raster under `images/oksat/ear-anatomy/` without an `ATTRIBUTION.md` entry.
  (Replaces the draft's `ref/` gate.)
- Open-license CT images live in `images/oksat/ear-anatomy/ct/` under the same `ATTRIBUTION.md` rule.

### 4.6 Terms

Every specialty abbreviation goes through `js/oksat/terms.js` (EAC, TM, LSCC, SSCC, PSCC, ISJ, IMJ,
GSPN exists, LPN, CWU, CWD, TEES, IAC, PORP/TORP if used). **ET** may collide later with
endotracheal tube; add the per-guide override only if a second guide needs the other meaning.

## 5. Guide content

Chapter files in `js/oksat/guides/ear-anatomy/`. Each chapter: `tldr` 3–6 bullets, 3–10 sections,
2–3 `check` prompts per section, a `drill` row per section once items exist, an empty `ref: []` per
section (D12). Numbers carry a `[[src|…]]` chip; values marked † are checked in §8 before writing.
Section ids below are permanent once shipped.

Each section lists: **teach** (content), **interact** (blocks), **figures** (Drive reference → own SVG, §4.5).

### start · Start here

- Sources with years (§8), how the guide reads (teach → check → drill → review).
- Optional self-rating table (D15): per chapter, "draw it cold / blurry / never learned".
- Synonym table for sets worth reading as a list: Proctor vs Marchioni retrotympanum terms; Shrapnell
  membrane = pars flaccida; fallopian canal = facial canal; Jacobson nerve = tympanic nerve of IX;
  Arnold nerve = auricular branch of X; Glaserian fissure = petrotympanic fissure.

### 1 · orientation — Orientation and the temporal bone frame (3 sections)

- `or-views` **Views and laterality.** Otoscopic convention: right ear, anterior is the viewer's
  right, **cone of light** at 5 o'clock; left ear 7 o'clock. **Manubrium** runs from the **lateral
  process** posteroinferiorly to the **umbo**. Views: transcanal microscope, postauricular, 0° and
  angled endoscope, axial and coronal CT. Petrous ridge runs about 45° anteromedially †.
  Interact: `hotspot` find mode on mirrored and rotated TM frames (call side, tap a quadrant).
- `or-parts` **Five parts and their sutures.** Squamous, mastoid, petrous, tympanic, styloid. Which
  part builds which surface (squama: superior and posterosuperior bony EAC, scutum, zygomatic root;
  tympanic: anterior, inferior, posteroinferior bony EAC and tympanic sulcus; petrous: medial wall,
  otic capsule, tegmen, carotid canal, jugular fossa). Sutures: tympanosquamous, tympanomastoid,
  petrotympanic (Glaserian), petrosquamous. Interact: `hotspot` explore. Figure:
  temporal-bone-squamous-tympanic-mastoid-parts-labeled → SVG with English labels.
- `or-map` **The compartments as a map.** Epi-, meso-, hypo-, pro-, retrotympanum defined by
  projecting the TM margins; the route this guide takes through them. Interact: `layers` toggle.

### 2 · auricle — The auricle (6 sections)

- `au-topo` **Topography.** Helix, helical crus and spine, **Darwin tubercle**, scapha, antihelix
  with superior and inferior crura, triangular fossa, cymba and cavum conchae, tragus, antitragus,
  intertragic notch, **incisura terminalis**, lobule. Interact: `hotspot` explore + find. Figures:
  auricle-landmarks, pinna-auricle-landmarks → one SVG.
- `au-cart` **Cartilage and skin.** One elastic plate, continuous with the lateral EAC cartilage; no
  cartilage in the lobule or incisura terminalis (endaural incision site). Medial-aspect eminences;
  **ponticulus** (posterior auricular muscle attachment). Lateral skin adheres to perichondrium with
  almost no subcutis; medial skin is looser. Cartilage is avascular and fed by perichondrium.
  Interact: `layers` step (skin → perichondrium → cartilage, lateral vs medial). Figure:
  auricular-cartilage-anatomy, auricular-cartilage-framework (verify) → SVG.
- `au-muscle` **Muscles and ligaments.** Extrinsic anterior and superior (temporal branch CN VII),
  posterior (posterior auricular n.); six vestigial intrinsics; anterior and posterior extrinsic
  ligaments. First mention of **CN VII**: these are its first extracranial targets met in this guide.
- `au-vessel` **Arteries, veins, lymph.** Superficial temporal (anterior auricular branches) and
  **posterior auricular** (medial surface plus perforators to concha and lateral surface; dominant).
  Veins to STV and posterior auricular v. → EJV. Lymph: anterior surface and tragus → preauricular /
  parotid; posterior and superior → retroauricular; lobule and concha → infra-auricular and upper
  cervical. Interact: `layers` toggle (arterial zones, lymph basins). Figure: auricle-arteria → SVG;
  lymph basins SVG only.
- `au-nerve` **Sensory map.** Great auricular (C2–C3), lesser occipital (C2), **auriculotemporal**
  (V3), **Arnold** (X), CN VII sensory overlap in concha and posterior canal. A ring block misses the
  concha and canal. First mention of Arnold nerve, carried forward to `eac-walls`. Interact: `layers`
  toggle on lateral and medial faces; `check` on which territory a ring block misses. Figure:
  auricular-innervation → SVG.
- `au-dev` **Development and proportions.** Six **hillocks of His**; board teaching 1–3 arch 1,
  4–6 arch 2 (controversy → `appraisal`). Normal proportions †: height 5.5–6.5 cm, width about 55%
  of height, axis tilted 15–20° posteriorly, helix-to-scalp 15–20 mm, conchoscaphal angle about 90°.

### 3 · eac — The external auditory canal (6 sections)

- `eac-seg` **Segments and course.** About 24–25 mm †; lateral third cartilaginous (about 8 mm),
  medial two thirds bony (about 16 mm). S-shaped; straighten posterosuperiorly in adults,
  posteroinferiorly in infants. Anteroinferior wall longer than posterosuperior because the TM is
  oblique. Interact: `hotspot` with frames at concha, cartilaginous canal, isthmus, bony canal,
  annulus (the scrubber). Figure: SVG only (coronal and axial sections).
- `eac-skin` **Skin and adnexa.** Cartilaginous canal: thick skin, hair, sebaceous and
  **ceruminous glands**. Bony canal: about 0.2 mm †, no adnexa, no subcutis, on periosteum.
  **Isthmus** just medial to the bony-cartilaginous junction; **anterior bony overhang** and
  **anterior tympanomeatal recess** form the deepest, least visible point.
- `eac-walls` **Walls and sutures.** Squama superior and posterosuperior; tympanic part anterior,
  inferior, posteroinferior. **Tympanosquamous** suture (vascular strip incision), **tympanomastoid**
  suture (Arnold nerve exits here via the mastoid canaliculus route; points toward CN VII in
  parotidectomy, depth †).
- `eac-gaps` **Dehiscences.** **Fissures of Santorini** in the cartilaginous floor; **foramen of
  Huschke** in the anteroinferior bony wall (tympanic ring ossification gap, closes in early childhood
  †). Both open toward the parotid and TMJ. Embryology woven: why the ring leaves a gap.
- `eac-rel` **Six-direction relations.** Anterior TMJ and parotid; posterior mastoid cells and the
  mastoid CN VII near the annulus; superior epitympanum and middle fossa; inferior parotid and
  styloid; medial TM. Interact: `neighbors` on `eac`.
- `eac-nerve` **Innervation and self-cleaning.** Anterior and superior walls auriculotemporal;
  posterior and inferior walls Arnold plus CN VII sensory (posterosuperior canal = **Hitselberger**
  territory). Arteries: posterior auricular, superficial temporal, **deep auricular** (maxillary).
  **Epithelial migration** from the TM centre outward, then lateral along the canal.

### 4 · tm — The tympanic membrane (6 sections)

- `tm-geo` **Geometry.** About 9–10 × 8–9 mm, 0.1 mm thick †; a cone pointing medially, apex at the
  umbo; set about 55° to the canal floor †. Effective vibratory area about 55 mm² vs footplate about
  3.2 mm² † (mechanics hook).
- `tm-layers` **Pars tensa and pars flaccida.** Tensa: epidermis, **lamina propria** (outer radial,
  inner circular collagen), mucosa; rim = fibrocartilaginous **annulus** in the tympanic sulcus.
  **Pars flaccida (Shrapnell)**: above the anterior and posterior **malleolar folds**, disorganized
  lamina propria, no annulus, inserts on the **notch of Rivinus**. Interact: `layers` step (three
  layers peeled; flaccida lacks the organized middle layer).
- `tm-marks` **Landmarks.** Lateral process, manubrium, umbo, light reflex, malleolar folds; often
  visible through the drum: incus long process, ISJ, chorda, promontory, round window niche.
  Interact: `hotspot` explore + find. Figure: tympanic-membrane → SVG.
- `tm-quad` **What lies behind each quadrant.** AS: tensor tendon and cochleariform process deep,
  chorda leaving superiorly. AI: protympanum, ET orifice, ICA beyond the anterior wall; myringotomy
  site. PS: incus long process, ISJ, stapes, stapedius tendon, chorda, oval window; tympanic CN VII
  above. PI: round window niche, sinus tympani region, hypotympanum, jugular bulb if high. Interact:
  `layers` toggle (drum opaque → each quadrant made transparent).
- `tm-supply` **Blood and nerve supply.** Lateral face: **deep auricular a.** (manubrial and radial
  vessels), auriculotemporal (anterior), Arnold (posterior). Medial face: **anterior tympanic** and
  **posterior tympanic / stylomastoid** aa., **Jacobson nerve** via the tympanic plexus (first
  mention; carried to `cav-medial`). Figure: tympanic-membrane-nerve-supply (verify) → SVG.
- `tm-dev` **Three germ layers.** Ectoderm (first cleft), mesoderm, endoderm (first pouch).

### 5 · cavity — The tympanic cavity: six walls (6 sections)

- `cav-box` **Compartments and dimensions.** Height and AP about 15 mm; width about 6 mm attic,
  2 mm umbo to promontory, 4 mm hypotympanum †. Interact: `layers` step (closed box → unfolded cross,
  Netter style; built SVG).
- `cav-lateral` **Lateral wall.** TM, **scutum**, notch of Rivinus, openings of the **iter chordae
  posterius** (chorda enters, with the posterior tympanic a.) and the **canal of Huguier** beside the
  petrotympanic fissure (chorda exits; anterior tympanic a. and anterior malleal ligament pass the
  fissure). Beyond: EAC. Figure: tympanum-medial-view (lateral wall seen from inside) → SVG.
- `cav-medial` **Medial wall.** **Promontory** (basal turn) with **Jacobson nerve** and the tympanic
  plexus (caroticotympanic sympathetics join; **lesser petrosal nerve** leaves toward the otic
  ganglion and parotid); **oval window** niche posterosuperior (footplate, annular ligament);
  **round window** niche posteroinferior under a bony lip; **ponticulus**; **subiculum**; tympanic
  **CN VII** in the fallopian canal above the oval window (most common dehiscence site †);
  **LSCC** prominence above and behind it; **cochleariform process** anterosuperior (tensor tendon
  turns here; **geniculate ganglion** and **GSPN** just anterosuperior, GSPN out through the facial
  hiatus with the superficial petrosal a.); finiculus. Beyond: vestibule, cochlea. Interact:
  `hotspot` explore + find; `neighbors` on `promontory` and `cochleariform`. Figure:
  tympanum-medial-wall (lead) → SVG.
- `cav-roof-floor` **Roof and floor.** **Tegmen tympani** and petrosquamous suture; beyond: middle
  fossa dura. Floor: thin plate over the **jugular bulb**, **inferior tympanic canaliculus**
  (Jacobson nerve + inferior tympanic a. from the ascending pharyngeal), hypotympanic cells. Variant
  card: high or dehiscent jugular bulb (definition †).
- `cav-anterior` **Anterior wall.** Top to bottom: tensor tympani semicanal (superior tympanic a.
  from the MMA, with the LPN), **ET orifice**, carotid plate with caroticotympanic canaliculi;
  **supratubal recess**. Beyond: petrous ICA. Variant card: aberrant ICA. Figure:
  tympanum-anterior-view → SVG.
- `cav-posterior` **Posterior wall.** **Aditus ad antrum**, **fossa incudis**, **pyramidal
  eminence** (stapedius; **nerve to stapedius** from the mastoid CN VII), chordal eminence, **facial
  recess**, **sinus tympani**, styloid eminence. Beyond: antrum, mastoid cells, mastoid CN VII.
  Interact: `neighbors` on `pyramid`.

### 6 · ossicles — The ossicular chain (6 sections)

- `os-parts` **Parts.** Malleus: head, neck, lateral and anterior processes, manubrium. Incus: body,
  short process, long process, lenticular process. Stapes: capitulum, neck, anterior crus (thinner,
  straighter), posterior crus, footplate (about 3 × 1.4 mm †), obturator foramen. Weights about
  23 / 27 / 3 mg †. Interact: `hotspot` explore. Figure: middle-ear-ossicles-mastoid-anatomy → SVG.
- `os-joints` **Joints, ligaments, axis.** Incudomallear (synovial, saddle); incudostapedial
  (synovial, ball-and-socket). Ligaments and anchors: superior malleal (tegmen), anterior malleal
  (petrotympanic fissure), lateral malleal (notch of Rivinus; roof of Prussak space), superior incudal
  (tegmen), posterior incudal (fossa incudis), annular. **Axis of rotation**: anterior malleal to
  posterior incudal ligament. Lever ratio about 1.3:1 †. Interact: `hotspot` find on ligaments.
  Figure: tympanum-middle-ear-ligaments (lead) → SVG.
- `os-tensor` **Tensor tympani.** From the cartilaginous ET, greater wing of sphenoid and its
  semicanal; tendon turns 90° at the cochleariform process to the medial malleus neck; **V3** (nerve
  passes through the otic ganglion without synapse); arch 1; pulls the malleus medially.
- `os-stapedius` **Stapedius and the reflex arc.** Inside the pyramidal eminence; tendon to the
  posterior stapes neck; CN VII; arch 2; pulls the stapes posteriorly. Arc: CN VIII → ventral
  cochlear nucleus → superior olivary complex (bilateral) → facial motor nuclei → stapedius.
  Interact: `sequence` on the arc.
- `os-supply` **Blood supply and weak points.** Incus long and lenticular processes on a mucosal
  plexus from anterior and posterior tympanic aa.; stapes via anterior and posterior **crural**
  branches; the incus has the least ligamentous support. Variant card: persistent stapedial artery
  through the obturator foramen. Figure: tympanum-lateral-no-drum (arterial arcade; rename to
  tympanum-arterial-supply on import) → SVG.
- `os-dev` **Embryology.** Board version: malleus head/neck and incus body/short process arch 1;
  manubrium, incus long process, stapes superstructure arch 2; footplate vestibular surface and
  annular ligament otic capsule. Controversy → `appraisal`. Interact: `layers` toggle (arch colours).

### 7 · spaces — Epitympanum, folds, ventilation, retrotympanum (6 sections)

- `sp-attic` **Attic boundaries.** Lateral scutum; medial LSCC and tympanic CN VII prominences; roof
  tegmen; anterior zygomatic root, **cog**, supratubal recess; posterior aditus; floor = **tympanic
  diaphragm**. Anterior epitympanic space (floored by the **tensor fold**) vs posterior epitympanum.
  Cog relation to the geniculate †.
- `sp-prussak` **Prussak space and the pouches.** Lateral pars flaccida; medial malleus neck;
  superior lateral malleal fold; inferior lateral process. Drains posteriorly: the classic path of
  primary acquired cholesteatoma (posterior epitympanum → aditus → antrum). **Pouches of von
  Tröltsch**: anterior and posterior (chorda runs in the posterior malleal fold). Interact:
  `neighbors` on `prussak`.
- `sp-folds` **Folds and the diaphragm.** Anterior, posterior, lateral, superior malleal folds;
  lateral, medial, posterior, superior incudal folds; tensor fold; interossicular; stapedial.
  Interact: `layers` step (fold builder, one fold at a time). Figure: SVG only (Proctor-style coronal
  and axial).
- `sp-isthmus` **Isthmus, ventilation route, mucosa.** Anterior and posterior **tympanic isthmus**
  (boundaries †). Route: ET → protympanum → mesotympanum → isthmus → epitympanum → aditus → antrum
  → cells. Complete tensor fold (usual) makes the anterior attic depend on the isthmus. Mucosa:
  ciliated respiratory anteroinferiorly; flat, non-ciliated, gas-exchanging in attic and mastoid.
  Interact: `layers` step (isthmus open → blocked; tensor fold complete → incomplete; retraction site
  shown per state).
- `sp-retro` **Retrotympanum partitions.** Ponticulus (promontory to pyramid), subiculum (round
  window lip to styloid eminence). **Sinus tympani** between them, medial to CN VII; **facial recess**
  lateral to CN VII; subtympanic sinus below the subiculum; posterior tympanic sinus above the
  ponticulus. Synonyms per D14. Sinus tympani depth classes †.
- `sp-sight` **What each approach sees.** Canal microscope, angled endoscope, posterior tympanotomy:
  the sinus tympani stays hidden from the microscope and the facial recess; an angled endoscope
  reaches it. Interact: `layers` toggle (sight cones).

### 8 · et — The Eustachian tube (5 sections)

Met at the anterior wall (`cav-anterior`) and as the start of the ventilation route.

- `et-seg` **Segments and dimensions.** Adult 31–38 mm †; lateral third bony (protympanum), medial
  two thirds cartilaginous; **isthmus** at the junction.
- `et-cart` **Cartilage, fat pad, safety canal.** Large medial lamina, small hook-shaped lateral
  lamina, membranous anterolateral wall, **Ostmann fat pad**, **Rüdinger safety canal**.
- `et-muscle` **Muscles.** **Tensor veli palatini** (V3; main dilator), levator veli palatini (X via
  pharyngeal plexus), salpingopharyngeus (X). Interact: `layers` step (closed → open).
- `et-child` **Adult vs infant.** About 45° vs 10° to the horizontal, infant tube about half the
  adult length †; adult geometry reached in childhood. Interact: `layers` step (adult → infant).
- `et-rel` **Orifice and relations.** Torus tubarius, fossa of Rosenmüller, salpingopharyngeal fold;
  ICA medial to the bony segment, tensor semicanal above, V3 and foramen ovale lateral to the
  cartilaginous segment. Mucosa and tubal lymphoid tissue. Figure: SVG only (sagittal, axial).

### 9 · mastoid — Mastoid and the surgical landmarks (8 sections)

- `ma-surface` **Surface.** Temporal line (approximates the middle fossa floor), **Henle spine**,
  **Macewen triangle** (antrum about 12–15 mm deep in adults †), mastoid tip, digastric groove,
  emissary foramen, zygomatic root. Figure: mastoid-cortex-bone-cuts-cortical-mastoidectomy-steps
  → SVG.
- `ma-antrum` **Antrum and Körner septum.** The one constant cell, near adult size at birth †. Medial
  LSCC, roof **tegmen mastoideum**, anterior aditus. **Körner septum** (petrosquamous lamina) can
  sit lateral to the true antrum and fake a floor. Interact: `neighbors` on `antrum`.
- `ma-pneum` **Pneumatization.** Tracts: posterosuperior, posteromedial, subarcuate,
  perilabyrinthine, peritubal and apical, zygomatic root, tip, retrofacial. Patterns: pneumatized,
  diploic, sclerotic.
- `ma-sequence` **Landmark sequence.** Cortex off → tegmen, **sigmoid sinus**, **sinodural angle**,
  thinned posterior canal wall → antrum → **LSCC** → short process of incus through the aditus →
  **digastric ridge**. Interact: `sequence`; `hotspot` frames as drill-down states. Figure:
  completed-intact-canal-wall-mastoidectomy-anatomy-diagram (Cummings Fig 134.3, lead) → SVG.
- `ma-fn` **Mastoid CN VII.** Second genu below the LSCC and medial to the short process; mastoid
  segment medial to the facial ridge, on the line from short process to the anterior end of the
  digastric ridge; **chorda** leaves it above the stylomastoid foramen (height variable †);
  **stylomastoid a.** enters with it; Arnold nerve crosses the canal (communicating branch).
  Interact: `neighbors` on `genu2`.
- `ma-recess` **Facial recess.** CN VII medial, chorda lateral, incus buttress superior; opening it
  shows ISJ, stapes, pyramid, round window niche (CI corridor).
- `ma-lines` **Triangles and lines.** **Trautmann triangle** (sigmoid, superior petrosal sinus,
  labyrinth; posterior fossa dura); **Donaldson line** (LSCC plane extended posteriorly bisects the
  PSCC; endolymphatic sac below).
- `ma-peds` **Pediatric shifts.** Superficial antrum, absent tip, superficial stylomastoid foramen
  and CN VII under a standard postauricular incision. `deep` block: CWD cavity anatomy (facial ridge
  lowered, mastoid exteriorized). Figure: canal-wall-down-mastoidectomy-cavity-surgical-anatomy
  (verify) → SVG.

### 10 · petrous-apex — The petrous apex (4 sections)

Content draft from standard sources; Opus pulls numbers in W3.

- `pa-bounds` **Boundaries and relations.** Medial to the inner ear; ICA horizontal segment
  anterolateral and inferior; IAC posterior-superior; **Meckel cave** anteromedial; **Dorello canal**
  and CN VI at the apex tip; petroclival fissure medial. Interact: `neighbors` on the apex id.
- `pa-tracts` **Cell tracts to the apex.** Supralabyrinthine, infralabyrinthine, subarcuate,
  peritubal; apex pneumatized in a minority of bones †.
- `pa-corridors` **Corridors (names and boundaries only).** Infracochlear, infralabyrinthine, middle
  fossa. No technique.
- `pa-clinical` **Why the relations matter.** One hook: abducens and trigeminal involvement explained
  by Dorello canal and Meckel cave.

### 11 · imaging — Normal HRCT temporal bone (3 sections)

Images: open-license normal cases (D10) in `images/oksat/ear-anatomy/ct/`, attributed; built
line-drawing slices planned to replace or complement them.

- `im-axial` **Axial, superior to inferior.** (1) SSCC, arcuate eminence, petrous apex cells.
  (2) Epitympanum: **ice cream cone**, aditus, antrum, LSCC, vestibule, IAC, geniculate and
  labyrinthine CN VII. (3) Oval window: malleus neck, incus long process, stapes crura, cochlea,
  tympanic CN VII; posterior row lateral to medial: facial recess, pyramid, sinus tympani.
  (4) Round window: niche, basal turn, mastoid CN VII. (5) Hypotympanum: jugular bulb, vertical
  carotid canal, ET, EAC, TMJ. Interact: `hotspot` frames + find mode.
- `im-coronal` **Coronal, anterior to posterior.** (1) Cochlea, cochleariform process, tensor;
  labyrinthine and tympanic CN VII cut twice (**snake eyes**). (2) Malleus, **scutum**, Prussak space,
  tegmen, TM. (3) Oval window, tympanic CN VII under the LSCC, vestibule, IAC. (4) Round window, LSCC
  and SSCC. (5) Mastoid CN VII to the stylomastoid foramen, jugular bulb, sigmoid. Interact: `hotspot`
  frames + find mode.
- `im-read` **What a reader checks.** Scutum sharp, tegmen intact, ossicular alignment, sinus
  tympani depth, jugular bulb height †, carotid plate present.

### 12 · synthesis — The systems, gathered (6 sections)

- `sy-fn` **CN VII, whole intratemporal course.** Meatal → **labyrinthine** (narrowest canal at the
  meatal foramen, 0.6–0.7 mm †) → geniculate (GSPN) → tympanic → second genu → mastoid → stylomastoid
  foramen. Landmark per segment, branch per segment, blood supply (labyrinthine a. from AICA,
  superficial petrosal a., stylomastoid a.; watershed at the labyrinthine segment). Interact:
  `sequence` on segments; lesion localizer as a `check` series (lesion site → lacrimation, stapedial
  reflex, taste, motor). Figures: tympanum-facial-nerve-and-chorda (lead), facial-nerve-arterial-supply
  → SVGs; facial-nerve-intratemporal-branches (Kenhub) and facial-nerve-diagram-ao (verify) as backup
  references only.
- `sy-para` **Parasympathetic routes.** GSPN → facial hiatus → foramen lacerum → vidian nerve →
  pterygopalatine ganglion → lacrimal and nasal glands. Jacobson → tympanic plexus → LPN → foramen
  ovale → otic ganglion → auriculotemporal → parotid. Chorda → lingual nerve → submandibular ganglion
  → submandibular and sublingual glands (and taste, anterior two thirds). Interact: `sequence` ×3.
- `sy-sensory` **Sensation and referred otalgia.** V3 (teeth, TMJ, oral cavity), VII (concha and
  canal), IX (tonsil, tongue base, nasopharynx), X (larynx, hypopharynx), C2–C3 (cervical spine).
  Interact: `layers` toggle (ear territory ↔ distant source).
- `sy-arteries` **Arterial companions.** Table: artery · parent · aperture · companion · territory
  (anterior tympanic, deep auricular, posterior tympanic, stylomastoid, inferior tympanic, superior
  tympanic, superficial petrosal, caroticotympanic). Great vessels: ICA anteromedial to protympanum
  and bony ET; jugular bulb under the floor; sigmoid posterior. Variants: high or dehiscent jugular
  bulb, persistent stapedial artery, aberrant ICA, anterior sigmoid, low tegmen, Körner septum, facial
  canal dehiscence.
- `sy-dev` **Embryology table.** Arch 1, arch 2, cleft 1, pouch 1, otic capsule → derivatives;
  explanations: notch of Rivinus, foramen of Huschke, superficial neonatal CN VII, tensor V3 vs
  stapedius VII, persistent stapedial artery, atresia with a normal inner ear.
- `sy-gauntlet` **Relationship gauntlet.** Four chained `check` series: lateral → medial through the
  PS quadrant; superior → inferior coronal at the oval window; posterior → anterior at the
  mesotympanum; surface → depth from Macewen triangle to the round window. Then blind-draw prompts
  (medial wall, ossicles with ligaments, CN VII path) self-scored against a checklist `tool`.

### 13 · appraisal — Evidence and controversies (3 sections)

Citations pulled from PubMed in W4; each card states board answer, competing view, method weakness,
and what to say on the exam vs in the OR. Source conflicts use a `trap` labelled *Source conflict*.

- `ap-arches` **Ossicular arch origin** and **hillocks of His.** Owner, 2026-11-02: teach the board version everywhere (hillocks 1–3 arch 1: tragus, helical crus, helix; 4–6 arch 2: antihelix, antitragus, lobule); this card notes the newer evidence briefly, one short card, not a chapter. Board 3+3 and split-arch teaching vs
  lineage-tracing work (largely mouse) giving arch 1 and arch 2 different shares. Weakness: species
  extrapolation; human data infer origin from position, few embryos.
- `ap-dehiscence` **Facial canal dehiscence prevalence.** Histologic temporal bone series report far
  higher rates than intraoperative series. Weakness: bone-bank selection, microscopic vs surgically
  visible definition, diseased vs normal ears, detection bias.
- `ap-numbers` **Transformer numbers and naming.** Areal and lever ratios and total gain vary by
  source; measured gain is frequency dependent and below the idealized figure. Retrotympanum naming
  (Proctor vs Marchioni) shown as synonyms, not evidence.

## 6. Figures

24 Drive figures from `skflx.obs/Files` (Drive file ids for W0.4). Content was checked from embedded
labels; rows marked *verify* had no readable labels and need a visual check. These are drawing
references only (D9): each row becomes an SVG in its content wave, unless W0.4 records an
open-license image that shows the same view and teaching points. Netter-style plates carry a "Medico Plasma" mark.

| Drive file | Drive id | Section(s) | Note |
|---|---|---|---|
| tympanum-medial-wall.png | 1TIGM6pa5PNDOvvqDklD4PcF47mUMBvkH | `cav-medial`, `sp-retro` | Lead |
| tympanum-medial-view.png | 142QD3nlch8K7_sTCsqhdoW95Vz9T-awb | `cav-lateral` | Lateral wall from inside |
| tympanum-anterior-view.png | 1l8TPo_HIG4rOHlnx8CDzuszgsQWA_W4A | `cav-anterior`, `sy-para` | Coronal from front; LPN, tympanic plexus |
| tympanum-middle-ear-ligaments.png | 1ayaNW-HUvgQGQOsATHh6E_A2wJBcQyVI | `os-joints` | Lead |
| tympanum-facial-nerve-and-chorda.png | 1wTjkU1twVByPcpWGjxiPymIP0_aqDhhl | `sy-fn`, `ma-fn` | Lead |
| tympanum-lateral-no-drum.png | 1cNXnPBNrQ41FPw-zzEmpbppYU1dBcZ6Q | `os-supply`, `sy-arteries` | Is the arterial arcade; rename on import |
| tympanic-membrane.png | 1BXl0F3prDOKMIoM1COPi7t0M_YBBvpMb | `or-views`, `tm-marks` | Lead |
| tympanic-membrane-nerve-supply.jpg | 1Mu-UPhlz2MIuttRsm4oKq7hVIk3jBbbf | `tm-supply` | verify |
| auricle-landmarks.png | 1CnsiGnHqmUzUBHqQbgxfjh5ERYDkp0iZ | `au-topo` | Textbook Fig 23-1 |
| pinna-auricle-landmarks.jpg | 145eDjHs76RtT3zeZTU6NI9_fyjoxt7Q5 | `au-topo` | Gralapp; alternate |
| auricular-cartilage-anatomy.png | 17up4LHGo0ShhC_0fcisjZ2--Gv6EFTog | `au-cart` | Fig 22-1 |
| auricular-cartilage-framework.png | 14YjgsOD7O0BSbUmo7x8sUSCUTOKiZB_v | `au-cart` | verify |
| auricle-arteria.png | 1KTIFbWb55Z-nSJ-tyh32DNnK_UJjD6JC | `au-vessel` | Fig 22-2 |
| auricular-innervation.png | 16Kkju87cqfpDRCHt3GeJd_Vxyrd__b6P | `au-nerve` | Fig 22-3 |
| temporal-bone-squamous-tympanic-mastoid-parts-labeled.png | 1LnaSnFbeaoaYOa6vQKIKvNdrWaybxiTE | `or-parts` | Latin labels; SVG in English. Same size as temporal-bone-landmarks.png (likely duplicate) |
| temporal-bone-anatomical-parts-diagram.png | 1IUMhAptZQSmhh57uNpig4YjhN-zJUAT9 | `or-parts` | verify; a -dup copy exists |
| middle-ear-ossicles-mastoid-anatomy.png | 19RUZYjrLM8DI0W5IBiMT4mFR-5UayaNH | `os-parts`, `ma-sequence` | Gralapp |
| facial-nerve-intratemporal-branches.jpg | 1LQGbvYK1oJrMPVFo-Sgo2TP6iCBNu8D4 | `sy-fn` | Kenhub, watermarked; reference only |
| facial-nerve-diagram-ao.png | 1GaqVJ_vLLNvcYSbkMUGGuDHj5_yWUbVb | `sy-fn` | verify |
| facial-nerve-arterial-supply.png | 16yhACJ1ZEqwfzYoLL_W_ws4HlecWTt5W | `sy-fn` | |
| mastoid-cortex-bone-cuts-cortical-mastoidectomy-steps.png | 1F74Roz002sAaC7lGaQ3rTb32610EBBUG | `ma-surface` | |
| completed-intact-canal-wall-mastoidectomy-anatomy-diagram.png | 16cRv54NNiI4-l4xHcjCaSDJzArrd_PfO | `ma-sequence` | Cummings Fig 134.3; lead |
| canal-wall-down-mastoidectomy-cavity-surgical-anatomy.png | 19XdG7k8r9ffcQs5xeRwQ1Y0RmL8aYwKg | `ma-peds` (deep) | verify |
| cranial-nerve-7-facial-nerve-pathway-statpearls.png | 1Jr5_njutpZ5hvUa1ve4vM3hKY8uwrlIu | — | Screenshot; do not import |

**SVG-only figures (no Drive reference):** rotated TM frames (`or-views`), compartment map
(`or-map`), auricle lymph basins (`au-vessel`), EAC coronal/axial sections and canal frames
(`eac-seg`), TM quadrant overlay (`tm-quad`), TM layers (`tm-layers`), six-wall box (`cav-box`),
arch-colour overlays (`os-dev`, `sy-dev`), folds and isthmus (`sp-folds`, `sp-isthmus`), sight cones
(`sp-sight`), ET sagittal/axial and adult/infant (`et-*`), petrous apex relations (`pa-bounds`),
HRCT line drawings (`im-*`), otalgia map (`sy-sensory`).

Candidate extraction sources in the same Drive folder: Myers – Mastoid Surgery.pdf, Vula –
Mastoidectomy and epitympanectomy.pdf, Secrets Tympanomastoid.pdf, Tympanoplasty and OCR.pdf.

**Exposure note.** Unlisted is not private: files in this public repo are fetchable by URL, so no
copyrighted figure is committed (D9).

Figure budget rule from the roadmap (§5) is relaxed for this guide because spatial relations are its
subject; the owner approves the figure list per chapter before that chapter's SVGs are drawn.

## 7. Glossary extension (W0.2 input)

Reuse existing OLSB ids where they exist: `eac`, `tm`, `flaccida`, `annulus`, `scutum`, `prussak`,
`lmf`, `cog`, `aer`, `epitympanum`, `mesotympanum`, `hypotympanum`, `protympanum`, `retrotympanum`,
`promontory`, `ow`, `rw`, `ponticulus`, `subiculum`, `sinustymp`, `recess`, `buttress`, `pyramid`,
`styloid`, `cochleariform`, `tensor`, `stapedius`, `et`, `malleus`, `incus`, `stapes`, `isj`,
`chorda`, `jacobson`, `gspn`, `geniculate`, `fn-meatal`, `fn-lab`, `fn-tymp`, `genu2`, `fn`, `smf`,
`fcanal`, `aditus`, `antrum`, `koerner`, `tegmen`, `tegment`, `lscc`, `pscc`, `ssc`, `digastric`,
`sigmoid`, `sinodural`, `jb`, `ica`, `macewen`, `henle`, `templine`, `tip`, `zygroot`, `donaldson`,
`els`, `mastoidcells`, `hypocells`, `cochlea`, `vestibule`, `iac`, `oticcap`, `mcfdura`, `pfdura`.

New ids to add (names indicative; Opus finalizes style and `rel`):

- **Auricle**: helix, helical crus, helical spine, Darwin tubercle, scapha, antihelix and both crura,
  triangular fossa, cymba, cavum, tragus, antitragus, intertragic notch, incisura terminalis, lobule,
  auricular cartilage, extrinsic auricular muscles.
- **Auricular supply**: great auricular n., lesser occipital n., auriculotemporal n., Arnold n.,
  CN VII sensory branch, superficial temporal a., posterior auricular a., lymph basins
  (preauricular, retroauricular, infra-auricular).
- **EAC**: cartilaginous canal, bony canal, isthmus, anterior tympanomeatal recess, fissures of
  Santorini, foramen of Huschke, tympanosquamous suture, tympanomastoid suture, petrotympanic
  fissure, canal of Huguier, iter chordae posterius, deep auricular a.
- **TM**: umbo, lateral process, manubrium, malleolar folds, cone of light, notch of Rivinus, four
  quadrants.
- **Ossicles**: incudomallear joint, superior/anterior/lateral malleal ligaments, superior/posterior
  incudal ligaments, annular ligament, fossa incudis, crural branches.
- **Folds and spaces**: anterior and posterior pouches of von Tröltsch, malleal folds, incudal folds,
  tensor fold, anterior and posterior tympanic isthmus, supratubal recess, subtympanic sinus,
  posterior tympanic sinus, chordal eminence, finiculus.
- **Nerves and canals**: lesser petrosal n., tympanic plexus, caroticotympanic nn., nerve to tensor
  tympani, nerve to stapedius, inferior tympanic canaliculus, mastoid canaliculus, facial hiatus,
  tensor semicanal.
- **Arteries**: anterior tympanic, posterior tympanic, stylomastoid, inferior tympanic, superior
  tympanic, superficial petrosal, caroticotympanic, labyrinthine, persistent stapedial (variant).
- **ET**: bony segment, cartilaginous segment, tubal isthmus, torus tubarius, fossa of Rosenmüller,
  tensor veli palatini, levator veli palatini, Ostmann fat pad, Rüdinger safety canal.
- **Mastoid**: facial ridge, Trautmann triangle, retrofacial cells, emissary foramen.
- **Petrous apex**: petrous apex, ICA horizontal segment, Meckel cave, Dorello canal, petroclival
  fissure, apical cell tracts.

Owner rulings, 2026-11-02: the **supratubal recess** is above the tensor fold (epitympanum); the
protympanum is below it. The **finiculus** definition in the glossary stands.

## 8. Numbers to verify (before any chapter text uses them)

Checked against Cummings Review (2017) Ch 2 and KJ Lee; where sources differ the guide shows the
range under a *Source conflict* trap. Every value lands in the text with a `[[src|…]]` chip.

| Item | Draft value | Section |
|---|---|---|
| Petrous axis angle | about 45° | `or-views` |
| Auricle proportions and angles | see `au-dev` | `au-dev` |
| EAC length; cartilaginous vs bony | 24–25 mm; 8 / 16 mm | `eac-seg` |
| Bony canal skin thickness | about 0.2 mm | `eac-skin` |
| Tympanomastoid suture to CN VII depth | per source | `eac-walls` |
| Foramen of Huschke closure | early childhood | `eac-gaps` |
| TM size, thickness, angle | 9–10 × 8–9 mm; 0.1 mm; about 55° | `tm-geo` |
| TM effective area vs footplate | about 55 vs 3.2 mm² | `tm-geo` |
| Tympanic cavity widths | 6 / 2 / 4 mm | `cav-box` |
| Tympanic CN VII dehiscence rate | histologic vs intraoperative | `cav-medial`, `ap-dehiscence` |
| High jugular bulb definition | state the one used | `cav-roof-floor`, `im-read` |
| Footplate dimensions | about 3 × 1.4 mm | `os-parts` |
| Ossicle weights | 23 / 27 / 3 mg | `os-parts` |
| Lever ratio; total gain | about 1.3:1; about 27 dB | `os-joints`, `ap-numbers` |
| Cog to geniculate relation | per source | `sp-attic` |
| Isthmus boundaries | Owner, 2026-11-02: anterior isthmus = tensor tendon / anterior crus / malleus neck / cochleariform; posterior = posterior crus / pyramid + posterior incudal lig. / short process / facial canal + sinus tympani area (glossary `isth-ant`, `isth-post`) | `sp-isthmus` |
| Sinus tympani depth classes | Marchioni A/B/C | `sp-retro` |
| ET length, angle, infant values | 31–38 mm; 45° vs 10° | `et-seg`, `et-child` |
| Antrum depth under Macewen triangle | 12–15 mm adult | `ma-surface` |
| Antrum size at birth | near adult | `ma-antrum` |
| Chorda takeoff above stylomastoid foramen | range | `ma-fn` |
| Petrous apex pneumatization rate | minority | `pa-tracts` |
| Labyrinthine canal diameter | 0.6–0.7 mm | `sy-fn` |
| CN VII segment lengths | per Cummings Ch 2 | `sy-fn` |

## 9. Question module (`js/oksat/modules/ear-anatomy.js`)

- Schema and voice per `docs/authoring-oksat.md`; `node tools/lint-oksat.mjs ear-anatomy` clean.
- About 2 items per section with teachable content (about 130 items across the guide). Mix of
  recall-first items and MCQs; each item = short answer plus explanation, mechanism → application
  where the item allows.
- Concepts map to sections so every `drill` row resolves; 1–2 `practice` refs per section pick items
  that apply the section rather than repeat its `check` prompts.
- Items build on each other inside a concept (Q(n+1) uses Q(n)'s answer) where the topic allows.
- Six-direction neighbour items are generated by hand from glossary `rel` so text and registry agree;
  W1.2 may add a `check-data` cross-check later.

## 10. Verification (end to end)

```bash
node tools/stamp-assets.mjs
node tools/check-data.mjs          # registry, blocks, glossary ids, figure attribution, terms
node tools/lint-oksat.mjs ear-anatomy
node tools/lint-oksat-guide.mjs ear-anatomy
node tools/test-oksat-learn.mjs    # new block behaviour, unlisted hub
node tools/test-oksat-engine.mjs
node tools/smoke-pages.mjs
```

Then the owner reads each chapter at phone width in both themes. A green check proves structure, not
teaching.

## 11. Owner checkpoints

| When | Owner does |
|---|---|
| After W0.2 | Spot-check new glossary entries and relations |
| Before W2 writing | Approve each chapter's figure list |
| After each content wave | Phone-width read; mark chapters `verified` when correct |
| W4 | Read the three appraisal cards against their pulled sources |
| Each content wave | Vet that wave's SVGs against their Drive references |
| W6 | Decide listing |

## Appendix A — Parked: OLSB links

Revisit trigger: the owner declares OLSB complete as a study source. Then: add an `olsb` link-card
block (`label`, `href`, `task`; no iframe; `check-data` fails a hash whose diorama, tour or step does
not exist), amend plan 2026-10-28 D7, and map sections to the §4.3 views (EAC and annulus →
tympanoplasty tour; landmark sequence and facial recess → mastoidectomy tour; medial wall and
retrotympanum → medial reading tour; facial recess vs sinus tympani → axial posterior tympanum;
attic → coronal attic; CT cut planes → 3D model).
