# WIP — current state

One section per living system: what it is, where it stands, what is next.
This is a status document, not a changelog — when something is retired, its
section goes away rather than growing a postscript. Git history is the record
of how things got here.

Last reviewed: 2026-10-02.

---

## Design system (`css/site.css`, `css/oksat.css`)

**State:** Redesigned 2026-09-23 away from the warm-cream/serif look. One
system everywhere: paper/ink, hairline rules, Archivo + IBM Plex Mono
(self-hosted), and two audiogram signal colors with fixed meanings. OKSAT
mirrors it as `--ok-*` tokens; Airway's dark stage uses the night palette.
Icon fonts, emoji, pastel badges and the Matte/Story style switch are gone.

**Next:** Nothing scheduled.

---

## Figures: ASCII 3D (`js/ascii3d.js`, `js/diagrams/`)

**State:** Added 2026-09-29. A small software renderer draws every figure
except Fig. 1 into a monospace grid: triangles z-buffered on a sub-cell
sample grid, Blinn-Phong shading mapped to a glyph ramp, contour glyphs that
follow the boundary through each cell (silhouettes, depth jumps, part edges,
optional creases), sub-cell line glyphs, and labels whose leaders stretch
clear of the drawing.
Figures turn (spin or rock), take drag and arrow keys, re-shade when the
theme flips (shadow is ink on paper, light is glyph density on a dark
ground), pick their resolution from the column width, and stop when
off-screen or under reduced motion. The same core runs in Node:
`tools/ascii3d.mjs` previews a scene as text with an ink map, and bakes the
first frame into parsed pages as the no-JS fallback. `check-data.mjs`
guards bakes, orphans, script order, and the Leitner schedule. Three
figures ship:

- **Fig. 2** (one-pager, Research): binaural pitch fusion as a ribbed
  surface, twelve electrode curves, fused span in blue. **Schematic, not
  data — owner to vet the depiction and caption** (§7).
- **Leitner staircase** (OKSAT hub): the five boxes as blocks rising with
  their interval, and the +1 / +2 / miss moves. Its intervals are checked
  against the engine.
- **Larynx** (Airway setup screen): hyoid with greater cornua, epiglottis,
  thyroid laminae with both cornua, the cricoid as the one complete (signet)
  ring, arytenoids with corniculates, the vocal folds (dotted where the
  thyroid hides them), a tracheal tube with C-shaped rings open behind, and
  the cricothyroid membrane in signal, below the folds. In-grid labels are
  short names; the claims are in the figcaption (`js/airway-app.js`).
  Schematic adult-male proportions; owner to vet.

New figures follow `.claude/skills/ascii-diagram/SKILL.md` (reference:
`docs/diagrams.md`).

**Next:** Figures inside OKSAT question items (needs a small hook in
`js/oksat-engine.js`); candidates the prose already asks for — facial nerve
course, IAC nerve quadrants, semicircular canal planes.

---

## One-pager (`index.html`)

**State:** Rebuilt as an index: big name beside a background-removed
portrait on a plate, then five open numbered sections with sticky heads on
desktop; Fig. 1 (a generated cochlea drawn to the owner's 30.2 mm duct, with
their FLEX28 array and Greenwood tonotopic ticks; `tools/gen-cochlea.py`)
sits in About; Fig. 2 (ASCII 3D, binaural pitch fusion, schematic) sits
in Research. The social card (`images/og-card.jpg`) was
re-rendered to match. Asset URLs are hash-stamped since the first deploy
reached phones as new HTML under the cached pre-redesign stylesheet; Fig. 1
also carries no-CSS fallback attributes so an unstyled page shows a line
drawing, not a black blob. The residency year computes itself
from a July 1 rollover (capped at PGY-5); the HTML carries the current value
as a no-JS fallback, and the two must change together.

**Next (TODO, owner):** add the CV. The hero link was removed until
`documents/cv.pdf` exists; when it lands, add a `Curriculum vitae` item to
`.hero-links` in `index.html`.

---

## OKSAT (`oksat.html`, `oksat-study.html`)

**State:** The tool is now just the hub and the study viewer.
Hand-authored modules, each a data file in `js/mcq-modules/` plus one
manifest entry; the shared engine renders all of them. Every question opens
on a recall gate: the stem shows first, and you either **reveal the answer**
and self-grade from memory (Knew it cold / partially / guessed / didn't know)
or **show the choices** and answer it as an MCQ. The engine records which path
settled each item, so "knew it cold" and "got it with the choices" stay
distinct in the record. Answers lock on first attempt and a five-box Leitner
schedule resurfaces misses (a cold recall jumps two boxes; a correct MCQ, one).
The engine also supports optional per-item images in stems and explanations
(`item.image`, `item.explanationImage`), first used in the lip-reconstruction
module. The otoplasty module (2026-09) is adapted from the StatPearls
*Otoplasty* article and reuses its figures unmodified under CC BY-NC-ND 4.0,
with attribution in the module header and `meta.sources`; unlabeled clinical
photos go in stems, labeled figures (Marx grades, the staging table) only in
explanations so they can't give the answer away. Its explanations flag where
the sk.oto vault and StatPearls disagree (hillock 4–6 mapping, prominence
thresholds) — unvetted for correctness pending owner review.

The facial-analysis module is built to the `.claude/skills/oksat-module`
recipe: Cummings Review ch. 3 for the numbers, the resident-review deck for the
outline and figures, vault notes cross-checked (Baker's PDF could not be
text-extracted, so Baker is cited only through the vault). It mixes free-response
recall items with MCQs, ends in four synthesis cases, and its explanations flag
where deck, textbook, and vault disagree. Its figures are third-party textbook
illustrations copied unmodified (compressed only), kept on the public site at the
owner's decision with a takedown note in the module's sources. Details not in
Cummings Review were web-verified and are recorded in `meta.sources`; claims found
only in the deck are labelled as such. Nothing in it is clinically verified.

The viewer now loads React/htm from `js/vendor/` (pinned) rather than a CDN,
and the default typeface is the site's own (`instrument`); the choice moved to
`oksat:typeface` and is stored only when picked.

Progress is local to the browser and nothing is uploaded. Storage keys keep
their trailing `:<code>` namespace so progress from the multi-reviewer era
still resolves, but the code is now read silently — opening a module no
longer interrupts with a "Who is reviewing?" prompt.

The hub shows what the retired Progress and Atlas tabs were really being used
for: a completion meter per module, Launch vs Resume, and a single banner
totalling cards due across all modules with a link into the module holding
the most.

**Next:** Authoring is manual (`docs/authoring-oksat.md`). The module set is
thin outside pediatrics/otology — laryngology and H&N oncology have hues
reserved in `OKSAT_SUBSPECIALTIES` but no modules yet. Facial plastics has
four modules (facial reanimation, lip reconstruction, otoplasty, facial analysis); rhinology now has its
first (allergy and allergy testing, a free-response module in the
dtc-risk-stratification style).

---

## Airway Rounds (`airway-jeopardy.html`)

**State:** Complete and self-contained — a 200-question ENT/H&N airway bank
with Rounds, Jeopardy board, quick quiz, and browse modes. Zero external
requests by design (now enforced by its CSP), so it runs on bad
conference-room wifi or none. Retoned onto the site palette; UI logic moved
from an inline script to `js/airway-app.js`.

**Next:** Nothing planned. Keep it CDN-free; that constraint is the feature.

---

## CPT search (`cpt-search.html`)

**State:** Working, on the shared system (`css/site.css`), logic in
`js/cpt-search.js`. Search history stays in `localStorage`
(`cpt-history`, `cpt-analytics`). The legacy stylesheet it depended on is
deleted.

**Next:** Nothing planned. The code table is hand-maintained inline data.

---

## SSB — Sinus & Skull Base 3D

**State:** `ssb.html` runs graph mode (tree, search, depth, panels, deep
links) and four stages. Phase-by-phase status: `docs/ssb-roadmap.md` §1.

- **Anatomy state (RA3a loader, RA3b scanned base):** `state.anatomy` (base + variant and condition patches, `#anat=`/`#v=`/`#dz=`) is
  whitelisted against `ssb/anatomy/index.json`, which lists the scanned base (head A as scanned, `ssb/anatomy/scanned/`, built by
  `normalize.py --base scanned`); Normal asymmetry is enabled, Variants and Pathology wait for entries. The CT and Specimen stages load the
  scanned base's own data (the Specimen stage swaps live; the Endoscope, procedures and dissected states stay on the standard head, and choosing one returns the page to it).
  Products that failed their gate on this head are `absent` in its index entry and the flap overlay is off there
  (`docs/ssb.md` §5.11). The patch format, loader and override-node hiding are tested on synthetic patches.
- **Standard specimen (O6, N1):** the page serves the UW head
  standardized — right half mirrored onto the left at R = 0, septum centred,
  thin midline plates where a paired air space would cross
  (`tools/ssb-pipeline/uw/normalize.py`, `docs/ssb.md` §5.1; `ct.json`
  `standard`, and a note in the Specimen and CT controls). Landmarks that
  exist on one side only stay as scanned (listed in the roadmap, N1). The
  as-scanned head is the pipeline's input and becomes a variant later.
- **Realistic anatomy (in progress):** `docs/realistic-anatomy.md`
  plans four anatomy states (symmetric, normal asymmetry, variants,
  pathology) over the specimen, a resegmentation of the UW head, an
  inventory of the UW teaching pages' figures, and curated Radiopaedia
  exemplars; its §11 "Handoff" is the next agent's order of work. Built:
  NasalSeg population asymmetry and cross-section profiles
  (`ssb/anatomy/population/nasalseg.json`, its §4.4; the archive holds 107
  distinct scans, not 130), the anatomy state with the `scanned` base
  (Normal asymmetry), the UW figure inventory (FG1) and the Radiopaedia
  shortlist (RP1). Resegmentation: RS1 and RS2a are candidates under the
  gitignored `incoming/_rs/` (nothing served changes until RS6); the
  ethmoid lamellae resisted the sheet filter, so they come from control
  points placed by eye (RS2c; owner, RA-O9). Radiopaedia stacks are fetched
  in the owner's browser (RA-O5). The UW authors' written permission is in
  `ssb/LICENSE-data.md`; the repo credits the atlas and its institution,
  never the authors by name.
- **Reference specimen** (`tools/ssb-pipeline/uw/`, provenance
  `ssb/LICENSE-data.md`) — reconstructed from the UW atlas: its axial and
  sagittal stacks are one CT (the coronal is another head,
  `ssb/reference/uw-sinusanatomy2/README.md`), resampled to RAS mm with the
  face masked (`ssb/ct/`). Air spaces split into named compartments seeded
  by UW's label arrows (label volume + `ssb/geometry/labels.json`; the
  anterior/posterior ethmoid split is a proxy for the basal lamella);
  landmarks (`ssb/geometry/landmarks.json`); meshes packed by region
  (`ssb/models/`). Bony walls as named units in a `walls` pack (lamina
  papyracea, orbital floor, maxillary walls, fovea / lateral lamella /
  cribriform plate, frontal tables, sphenoid face, floor and lateral walls,
  planum, septum, inferior and middle turbinates; superior turbinate,
  uncinate and bullar lamella not separable). Vessel and nerve centrelines
  (`ssb/geometry/sweeps.json`, every point marked detected, labelled or
  inferred in `sweeps.meta.json`: optic nerve, nasolacrimal duct and
  petrous ICA are seen in their canals; the cavernous ICA — no contrast —
  vidian nerve and ethmoidal and sphenopalatine arteries are mostly
  inferred). Distance fields for the proximity HUD (`ct.json` `sdf`). A 3D
  test of the graph's spatial claims (`ssb/reference/specimen-relations.json`;
  as of 2026-10-01, 94 testable, 88 agree, none contradict).
  `tools/check-data.mjs` fails if any of it names an id the graph lacks.
  Soft tissue is bone-window-limited, so it is derived, swept or parametric
  (`docs/ssb.md` §5.7): stage D (`softtissue.py`) so far gives the septal
  mucosa surfaces and charts (the `soft` pack), the choanal arch, the
  middle turbinate heads; the nostrils `lm.naris.R/.L` come from
  `nose.py` (the vestibule lumen of the unmasked stack), the incisive canal `lm.incisive-canal.M` and the right sphenoid ostium's
  inferior margin (ST2b, partial: floor chart and left margin escalated),
  and `sweeps_soft.py` turns the waypoints in `uw/sweeps-soft.json` into
  the septal-branch, nasopalatine and AEA-septal sweeps (all inferred,
  schematic courses; first-pass waypoints verified 2026-10-03 with
  corrections pending, ST4d). The graph now
  holds the soft-tissue and nose entries (septal mucosa, the septal and
  nasal-tip arteries, the turbinate and lateral-wall flaps, the external
  valve, ala, columella, nasal bone, piriform aperture), sourced from
  PubMed-matched papers and Radiopaedia articles (verified against the
  atlas and abstracts 2026-10-03; three errors pending in ST0d). The face mask
  removed the nose; ST6 restores the specimen's own (`nose.py`, `normalize.py`):
  the skin (the `nose` pack, `s.external-nose.M`, drawn as skin by a Nose layer),
  the vestibule label `s.nasal-vestibule` in front of the internal valve plane
  (`s.internal-nasal-valve` landmark, the narrowest coronal section of the
  airway), centred and mirrored like the rest. The septal and floor charts now
  end at the valve plane. The tip is cut flat by the source image's border; the
  vestibule | cavity boundary is a proxy for the mucocutaneous junction; the
  cartilage framework is ST7. Waiting on the checkpoint: the valve area against
  Bloom, the labial septal branch (ST4d), poses for `t.septum-anterior` and
  `t.lacrimal-sac-0`, E6's station checks (E6 not merged when ST6 ran).
- **Specimen stage** (`mode-specimen.js`) — the packs in 3D: named views,
  bone X-ray/solid/hidden, region layers, landmarks, click-through
  picking, a 3D cursor shared with the CT crosshair, a section plane with
  solid caps, a vessels-and-nerves layer drawing the sweeps as tubes
  (off by default; most points are inferred), a Mucosa layer drawing
  the air spaces as their lining (the vestibule's is skin) and a Nose layer
  (on by default) drawing the skin of the specimen's own nose.
- **Procedure player** (`mode-procedure.js`, `ui-procedure.js`, `#p=…&step=…`;
  `docs/ssb.md` §5.8) — a procedure plays step by step in the scope on a
  dissected state (patch on the volume: collision, tip label; the state's
  lining pack; `see` and hatched `risk` structures; the step's station), with
  the `think` behind a click, `[` `]`, a corridor picker. Built and tested on a
  fixture; waits for P1b's `ssb/states/` for real data (Play is disabled with
  its reason until then).
- **Endoscope stage** (`scope.js`, `mode-endoscope.js`, `ui-endoscope.js`,
  `#scope=`) — a first-person rigid scope as a camera pose over the
  Specimen stage: pivot at the nostril, depth / yaw / pitch / roll, a
  0 / 30 / 45 / 70° lens with a camera head that stays upright (no image flip through the zenith) and a light-post
  indicator, a spotlight at the tip with automatic exposure (K·D² from raycasts
  to the lining), the lining drawn as mucosa from inside. Bone
  stops the shaft (4 or 2.7 mm), mucosal contact is reported and a proximity
  HUD reads the distance fields at the tip; from inside, the lining is the open `lining` pack (`lining.py`, ST1b; fetched on the first look from within, ST1c), so the scope can look through the choanae and the right sphenoid ostium (the left is closed in the specimen's labels).
  The tip is also the Specimen stage's 3D cursor (so CT opens on it, and leaving the scope leaves `#at=`), an inset in
  the controls shows the oblique CT slice through it along the view, and the exposure is measured once the pose has rested 100 ms.
  Stations (E6): the controls list this nostril's covered stations from `ssb/geometry/stations.json` (Opus's intact poses, E5, plus the two 2.7 mm ones) at the page's tier;
  picking one flies the scope there over ~600 ms (a cut with reduced motion), and `#scope=t.<id>[.<side>]` opens one.
- **Procedure mode** (P1, 2026-10-08; contract `docs/ssb.md` §5.8–5.10) —
  pipeline built (P1b) and player built (P2), both merged. A dissection state changes the volume the scope
  reads (removed voxels become air), so collision and stations see the
  opened cavity. The cuts are rules in `tools/ssb-pipeline/uw/dissection.json`
  (FESS from uncinectomy to Draf IIa; transsphenoidal, sellar and clival
  recess openings), mapped to the `removes` of those procedures' steps; a
  scratch prototype built the states and posed the stations they open;
  `tools/ssb-pipeline/uw/dissect.py` evaluates the rules into 15 states
  (`ssb/states/index.json`, a patch and a lining pack each, not in
  `packs.json`), which the player reads. Stations per state (P3):
  `ssb/geometry/stations.json` `byState` poses the 15 stations the states
  open (both sides; the midline ones from the right nostril), solved and
  re-checkable by `tools/ssb-pipeline/uw/stations.py`; the olfactory cleft and
  the inferior meatus are intact poses with `shaft: "2.7"`, and flying to one
  switches the scope to the 2.7 mm telescope and says why.
  The mucosal state (DC1, `docs/ssb.md` §5.9; `mucosa.py`): a decongested ·
  as scanned · congested toggle in the Specimen controls (`#mu=`), as patches
  and lining packs; the decongested one is calibrated on a published ratio
  (a recession of the turbinates' and septum's soft tissue by 1 mm) and is the
  base of every dissection state, so a procedure always plays decongested.
  The congested one is a one-voxel layer on the turbinates (the 0.5 mm grid
  cannot grow less; with the septum too it overshoots the NasalSeg target):
  that choice awaits the owner and the checkpoint. Next: CP-3.
- **CT mode** (`mode-ct.js`, `docs/ssb.md` §3) — axial/coronal/sagittal
  canvases with a shared crosshair, window presets, label outlines and
  hover names, without WebGL.
- **Variant lab** — the `ethmoid-roof` (Keros, Gera, asymmetry, AEA course,
  supraorbital cell), `frontal-recess` (IFAC cells, uncinate attachment,
  computed drainage pathway) and `sphenoid` (pneumatization, carotid and
  optic-nerve exposure, DeLano/Onodi, septum, vidian canal, lateral recess;
  every exposure is read off the solids, rules in `docs/ssb.md` §6.1)
  dioramas, with presets from the graph's
  classifications, picking into the panels, hatched hazard sites and a
  `#lab=` URL state (`docs/ssb.md` §6; behaviour pinned by
  `tools/test-ssb.mjs`).
- **Materials** — procedural per tissue kind (`js/ssb/materials.js`,
  `docs/ssb.md` §7.4): world-space mm noise from `--ssb-*` tokens, no
  textures, quality `full`/`lite` by device hints or the `#q=` hash key;
  the dioramas, the specimen and the endoscope all use them.
- **Knowledge graph** (`ssb/content/`) — anatomy by region
  (nasal/maxillary/PPF; ethmoid/frontal/orbit/ACF; sphenoid/sellar/clival)
  plus a pathology layer (inflammatory/infectious/structural; neoplastic).
  Every file was authored by one model and adversarially reviewed by
  another; every journal source was matched to its PubMed record (NCBI
  E-utilities; the few PubMed does not index were confirmed by hand).
  "Verified" on a source means exists-as-cited, not supports-the-claim;
  all content is still `review: draft`. The Chiu/Palmer/Adappa atlas (2nd
  ed., the owner's copy; chapter 7 is not in the Drive folder) was read
  chapter by chapter against the graph and integrated in our own words,
  one source per chapter; conflicts were decided on evidence (e.g. lumbar
  drains stay for high-risk defects on trial evidence). As of 2026-09-28:
  about 1,030 entities (50 procedures, 78 conditions), 242 sources.
  C1a (2026-10-07, Sonnet draft awaiting the Opus checkpoint CP-C1): the
  procedures canthotomy/cantholysis, external orbitotomy, frontal sinus
  cranialization, Lynch frontoethmoidectomy, septodermoplasty, Young's
  procedure and transantral IMA ligation, from PubMed abstracts (PMC full
  text where open); their 43 new sources are `verified: false` with a
  `note` saying what was read.
  C1b–C1f (2026-10-07, Sonnet drafts with an Opus first read, awaiting
  CP-C1): inflammatory and benign conditions (EGPA, PCD, immunodeficiency,
  granulomatous infections, septal hematoma/abscess, developmental cysts,
  organized hematoma, nasal/medial-wall/ZMC fractures); neoplastic
  conditions under WHO 5th-edition names; classifications (Cannady, WHO CNS
  meningioma grade, AJCC clinical N, Wise AFRS score, more JNA systems) and
  the SPOA volume threshold; parasellar, jugular foramen, orbital, frontal
  lobe, palate and parapharyngeal structures with `geo: "none"`; and a
  prior-SPA-ligation check on the middle turbinate flap. Same source rule
  as C1a.
- **UW reference crawl** (`ssb/reference/uw-sinusanatomy2/`,
  owner-reported permission) — every labeled frame's labels and arrow tips
  (`slices.json`), from which `tools/ssb-pipeline/uw/relate.py` tests the
  graph's spatial claims (as of 2026-09-28: 60 testable, 58 agree, the
  other 2 a documented arrow-placement artifact).
  `figures.json` (WP FG1) inventories the eight Normal/Abnormal pages'
  figures: plane, window, caption abbreviations, traced arrows on the
  bone-window ones, and the ids, roles and candidate same-patient groups
  transcribed from `docs/realistic-anatomy.md` §4.1 (Opus fills the nulls).

**Next:** Tracked task by task in `docs/ssb-roadmap.md` (status board,
owner decisions, waves of work packages with Opus checkpoints, content
backlog). The owner's priority (O7) is clear anatomy for FESS and for EEA
to sellar/clival masses, so wave 3 is procedure mode: the dissection
states, the player, poses per state, the mucosal state, NasalSeg's
population profiles and the 16-bit intake are built (P1b, P2, P3, DC1,
POP1, IN1; the population panel POP2a is merged and the population maxillary sinus, POP2b, is in review); CP-3 found that a step does not yet land on the view it
opened, and P4 fixed that (every corridor position, by step or link,
lands on a view of its state); the soft-tissue lane
has ST4d merged and the flap overlay (ST5: `flap.js`, `#flap=`, the Nasoseptal flap control, areas per design and side) in review.
Waiting on the owner: O14 (where the nasal framework is drawn), the review of the dissected states (CP-3's links), review of tier-1 FESS anatomy and the
dioramas (`docs/ssb-roadmap.md` §2). The external nose beyond the entry anatomy (the full rhinoplasty
framework, its envelope layers, vessels and nerves) is specced
(2026-10-07) as the `nasal-framework` diorama (`docs/ssb.md` §6.2;
roadmap ST7a–e), deferred behind O7; nothing of it is built yet.

---

## Wiki scaffold (`wiki/`)

**State:** Not live; nothing is built or served from this repo. Quartz 5
config (from the upstream `obsidian` template, retuned to the site), custom
styles, landing page, an inert deploy workflow, and
`wiki/sync/sync-vault.mjs` — the fail-closed sync from the `sk.oto` vault
(six subspecialty folders; Personal Notes, drafts, source texts and
governance files never leave). Phase 1 of `policy.json` publishes only the
six subspecialty maps of content; their sync output is committed in
`wiki/content/` and renders in Quartz v5.0.0 (checked 2026-09-23).

Reader corrections: every published note ends with a link to a prefilled
public GitHub issue (`wiki/github/ISSUE_TEMPLATE/correction.yml`);
`wiki/feedback/pull-feedback.mjs` pulls those issues into the vault's
`_inbox/wiki-feedback/` as untrusted, fenced reports, and prints the
`Closes #n` lines once they are resolved. Fixes are made in the vault, so
Drive and the wiki both get them.

DGMO diagrams render at build time: `wiki/dgmo/render-dgmo.mjs` uses the
same `@diagrammo/dgmo` library as the vault's Obsidian plugin to emit light
and dark SVGs on a palette built from the site tokens (verified in a real
Quartz build, 2026-09-23).

**Next:** Create `skflx/ent-wiki` and go live (`wiki/README.md` §Bootstrap);
publish notes beyond the maps as they are vetted (widen `gate.tierMatches`);
decide whether to automate the sync (needs a secret).

---

## Archive (`archive/`)

**State:** Holds the OHNS knowledge graph built for the retired Knowledge
Atlas Graph and Structural Atlas viewers, as raw JSON plus a flat text
rendering for reading. Nothing serves or checks it.

Only the temporal-bone seed set is owner-vetted (`review:true`); the rest is
authored scaffolding marked `draft` in the flat export. It is study material,
not a reference — `archive/README.md` says so at the point of use.

**Next:** Optional. Vetting nodes, or mining the detail text into OKSAT
modules, would both put the content back to work; neither is scheduled.

---

## Verification

**State:** Four Node suites, run in CI on every PR: `check-data.mjs`
(committed data + security invariants: CSP on every page, no inline or
third-party script, vendored-file hashes; and that every `css/`/`js/`
reference carries a current `?v=` stamp from `stamp-assets.mjs`),
`test-wiki-sync.mjs` (the vault
boundary), `smoke-pages.mjs` (every page boots with no real console errors,
plus the `?m=` XSS regression), `test-oksat-engine.mjs` (answer lock, SRS
writes, keyboard, legacy migration). With React/htm vendored the browser
suites are hermetic and run in a network-restricted sandbox.

Security audit 2026-09-23: `docs/security.md` (one high-severity reflected
XSS fixed; CSP added site-wide; CDN scripts vendored).

**Next:** GitHub Pages cannot send headers, so `frame-ancestors`/HSTS are out
of reach without a proxy host. Owner's call whether that matters.
