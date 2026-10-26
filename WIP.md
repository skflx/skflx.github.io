# WIP — current state

One section per living system: what it is, where it stands, what is next.
A status document, not a changelog. When something is retired, its section
goes. Detail lives in the owning doc (`docs/docs-map.md` maps each one).

Last reviewed: 2026-10-11.

---

## Design system (`css/site.css`, `css/oksat.css`)

**State:** One system: paper and ink, hairline rules, Archivo and IBM Plex
Mono (self-hosted), two audiogram signal colours with fixed meanings. OKSAT
mirrors it as `--ok-*` tokens; Airway's dark stage uses its night palette.

**Next:** nothing scheduled.

---

## Figures: ASCII 3D (`js/ascii3d.js`, `js/diagrams/`)

**State:** A software renderer draws every figure into a
monospace grid (z-buffered, Blinn-Phong shading mapped to glyphs, contour
glyphs at silhouettes and part edges). Figures turn, take drag and arrow keys,
re-shade on a theme flip, and stop off-screen or under reduced motion. The same
core runs in Node (`tools/ascii3d.mjs`), which bakes the no-JS frames.

- **Fig. 1** (one-pager, About): the owner's cochlea, fitted to their CT (A, B,
  H, lateral-wall CDL), with the FLEX28 on the lateral wall and the spiral
  ganglion ending near 1.75 turns. Turn count, canal width, ganglion radius
  and the full-insertion contact angles are assumed; owner to vet.
- **Fig. 2** (one-pager, Research): binaural pitch fusion in two bimodal
  listeners, narrow vs broad. Widths follow the published 1-4 octave range;
  the curves are schematic. Owner to vet the depiction and caption.
- **Leitner staircase** (OKSAT hub): its intervals are checked against the engine.
- **Larynx** (Airway setup screen): schematic adult-male proportions; owner to vet.

**Next:** figures inside OKSAT items (needs a hook in `js/oksat-engine.js`);
candidates the prose already asks for: facial nerve course, IAC nerve quadrants,
semicircular canal planes.

---

## One-pager (`index.html`)

**State:** An index: name beside a background-removed portrait, then five open
numbered sections with sticky heads on desktop. Fig. 1 (the cochlea, fitted to
the owner's own CT and implant) sits in About; Fig. 2 in Research. The residency year is computed in `js/onepager.js` and duplicated as
a no-JS fallback in the HTML; change both or neither.

**Next (owner):** add the CV. The hero link is removed until `documents/cv.pdf`
exists; then add a `Curriculum vitae` item to `.hero-links` in `index.html`.

---

## OKSAT (`oksat.html`, `oksat-study.html`, `oksat-learn.html`)

**State:** A hub, a question viewer and, since 2026-10, an Interactive learning
viewer. The hub has two named segments: **Interactive learning** (guides) and
**Question modules**. Modules are hand-authored data files in
`js/mcq-modules/`, each with one manifest entry; the shared engine renders all
of them. Every question opens on a recall gate: reveal and self-grade, or show
the choices and answer as a locked-first-attempt MCQ. The engine records which
path settled each item. Leitner boxes resurface misses: a due item reopens
fresh, answers hidden, and each review moves its box. A jump slider and a
"Next unanswered" button (`u`) move through a module; Continue resumes at the
first unanswered question. Progress stays in the
browser; nothing is uploaded.

Module families, and their status:

- **Facial plastics:** facial reanimation, lip reconstruction, otoplasty,
  facial analysis. Otoplasty reuses StatPearls figures under CC BY-NC-ND 4.0,
  attributed in the module header. Facial analysis uses third-party textbook
  figures, kept on the public site at the owner's decision, with a takedown note
  in the module's sources.
- **Facial trauma:** mandible, midface, orbit and NOE, temporal bone, and
  evaluation. Built from the owner's resident-review decks; deck-versus-standard
  disagreements sit under "Discrepancy:" or "Caveat:". The AO CMF content is not
  yet folded in.
- **Rhinology:** allergy and allergy testing; AERD and biologics, built from
  two open-access reviews (Priessnitz 2026, CC BY; Dominas 2020) with keyed
  numbers checked against the primary papers on PubMed. It reuses Priessnitz
  Figure 2 under CC BY and carries twelve schematic SVG diagrams drawn for it
  (the eicosanoid pathway, because the Dominas figure is wrong about COX-1 and
  COX-2, plus mechanism, timeline and evidence diagrams on the harder items).

- **Interactive learning** (`docs/authoring-oksat-guide.md`): first-pass guides
  with predict-then-reveal prompts, checkers, inline module questions and
  per-section drill links. One guide so far, **AR · CRS · AERD** (`ar-crs-aerd`):
  ten chapters from type 2 immunology to critical appraisal, ported from the
  study atlas built in conversation (2026-10-26), plus a flashcard deck and a
  pearl wall. Every specialty abbreviation is marked and expands on hover, focus or tap
  from one shared lexicon (`js/oksat-terms.js`, 2026-10), which `check-data`
  holds complete and free of idle entries. Its question bank was folded into the modules: the AERD and
  biologics items already existed in `aerd-biologics`; thirteen new MCQs were
  added to `allergy-testing` (its first MCQs; items q84 to q96), and a new
  `crs-ars` module (ARS, CRS, fungal and secondary CRS, EPOS biologic criteria,
  three cases) holds the rest. Figures: reuses the AERD module SVGs where they
  agree with the guide text (not `natural-history.svg`, whose order conflicts
  with 7.1), and draws its own schematics in `img/oksat/ar-crs-aerd/` for the
  mechanisms, time courses, anatomy and scoring rules the text alone carries
  poorly.
  Everything is draft: sources are EPOS 2020, the NEJM 2019 review, ICAR-AR
  2023 and the two AERD reviews, as summarized in the atlas; the primary
  papers were not re-read line by line. One known cross-source difference is
  flagged in `allergy-testing` q95 (NARES eosinophil cutoff).

None of the newer modules is web-verified or clinically verified, except where
its explanations say so. Otoplasty's explanations flag vault-versus-StatPearls
discrepancies (hillock mapping, prominence thresholds) for owner review.

**Next:** more guides (`/oksat-guide`), each built with its questions;
authoring is manual (`docs/authoring-oksat.md`). Laryngology and
head-and-neck oncology have hues reserved in `OKSAT_SUBSPECIALTIES` but no
modules. The AO CMF content is still to be folded into the facial-trauma modules.

---

## Airway Rounds (`airway-jeopardy.html`)

**State:** Complete and self-contained: a question bank with Rounds, Jeopardy
board, quick quiz and browse modes. No external requests by design, enforced by
its CSP, so it runs on bad conference-room wifi or none.

**Next:** nothing planned. Keep it CDN-free; that constraint is the feature.

---

## PDF chapter splitter (`pdf-chapter-splitter.html`)

**State:** Working. Logic in `js/pdf-chapter-splitter.js`; pdf-lib and JSZip are
vendored (`js/vendor/README.md`), so the page makes no third-party request.
It reads a PDF in memory and writes nothing to storage except the theme.

**Next:** nothing planned.

## CPT search (`cpt-search.html`)

**State:** Working, on the shared system (`css/site.css`). Logic in
`js/cpt-search.js`; history stays in `localStorage` (`cpt-history`,
`cpt-analytics`). The code table is hand-maintained inline data.

**Next:** nothing planned.

---

## OLSB — middle ear & mastoid (`OLSB.html`)

**State:** Unlisted (nothing links to it; `noindex`). Two modes behind
one switch: a 3D model (the default) and four 2D diagrams (the fallback
without WebGL, and every `#d=`/`#p=` link).

**3D model** (`js/olsb-volume.js` + `js/olsb-3d.js`): a right temporal
bone as a labelled voxel volume in millimetres (x lateral, y anterior,
z superior, origin at the oval window), placed from textbook dimensions
and relations: facial nerve segment by segment, ossicles on the drum,
three canals in their mutual planes, a spiral cochlea with scalae and
lamina, Voronoi mastoid air cells, sigmoid/jugular bulb/carotid, dura and
brain. Three grids, each replacing the coarser one inside its box: 0.3 mm
for the specimen, 0.1 mm for the tympanic cavity and labyrinth, and an
8 mm cube at 0.05 mm rebuilt round the point you look at when you are
close (within the fine box), all built and carved in a Web Worker (the
volume file itself; no worker, no cube). Walking (WASD) moves at a speed
set by the free space ahead and stops half a millimetre short of a wall,
so the middle ear can be walked like a room. Drill states carve it with margins round the hazards: flap up,
cortical mastoidectomy, facial recess, canal wall down,
translabyrinthine, middle fossa. Rendered as smooth lit surfaces
(`js/olsb-mesh.js`, in the worker): a surface net whose vertices sit on
the half level of an occupancy field softened by each voxel's sub-voxel
depth to the shape that painted it (so shapes come out at their analytic
size, not in voxel steps), normals from that field, colours blended across
tissue boundaries, a coarse openness term darkening cavities; a Blocks
toggle keeps the voxel look. Views carry a field of view (the canal view
narrow like a microscope, the endoscope views wide and in a round frame).
Layers, see-through
bone, isolate, a cut plane (axial/coronal/sagittal), names, big pixels;
orbit, fly (F) and WASD walking; click to select (neighbours from the
glossary), double-click to centre. A nine-step guided flight, and view
links (`#m=3d&st=&L=&cut=&cam=` or `&s=<step>`). `tools/check-data.mjs`
checks every label against the glossary and the geometry against every
glossary relation between two drawn structures.

**2D diagrams**, layered inline SVG drawn by `js/olsb.js`:

- **Surgical lateral** (`js/olsb-lateral.js`): the surgeon's projection in
  eight layers, skin to deep hazards, with TM states, field/canal/recess
  viewports and see-through. Tours: tympanoplasty (postauricular underlay)
  and canal-wall-up mastoidectomy with facial recess (action + hazard per
  step).
- **Medial wall** (`js/olsb-medial.js`): the tympanic cavity from lateral
  with TM, malleus and incus removed: divisions, the LSCC / facial nerve /
  oval window / promontory / round window stack, retrotympanum, anterior
  wall and epitympanum, inner ear projected, ossicles as a ghost.
- **Axial: posterior tympanum** (`js/olsb-axial.js`): CT-style cut at the
  round window; the posterior wall lateral to medial and three lines of
  sight (canal, facial recess, angled endoscope).
- **Coronal: the attic** (`js/olsb-coronal.js`): compartment widths,
  scutum, Prussak's space, the medial stack, roof and floor, the attic
  cholesteatoma route.

`js/olsb-glossary.js` holds each anatomical id once (name, note,
directional `rel`). `js/olsb-shapes.js` draws the ossicles, the
mid-modiolar cochlear section and the air-cell honeycomb from millimetre
outlines; every diorama is calibrated in px/mm with a live scale bar
(textbook sizes: TM about 9 mm, footplate 3 x 1.4 mm, facial nerve about
1.5-2 mm, sigmoid about 7 mm, cochlea about 9 x 5 mm), with form shading
(domes, pits), hatched section bone and cased nerves and vessels. Where
depths stack, structures are still spread apart, and the coronal cochlea
is drawn at three quarters size to fit. Tapping a structure lights its neighbours with their
direction, lists where else it is drawn, and jumps there (to a step that
shows it). A find-it quiz asks for any visible structure. Links:
`#d=<diorama>&p=<tour>&s=<n>` (older `#p=` links still resolve). No
storage. Self-contained (in `SELF_CONTAINED`).

It is a tool page, not a site figure, so it is SVG rather than ASCII 3D
(`docs/decisions.md` §8 governs figures). Geometry is invented and spread
apart for legibility; all content, including the relations, is draft and
unverified (owner, §7).

**Next:** Owner review of the anatomy, notes and relations, the 3D
geometry first (positions are reconstructed from dimensions, not traced
from a scan). Candidates: segmenting a real temporal bone CT into the
same labels (SSB's pipeline), a find-it quiz in 3D, more drill states
(cochlear implant, stapedotomy), anatomical variants (sclerotic mastoid
is already a build option, `pneu`; a high jugular bulb, a dehiscent
tegmen or superior canal).

---

## SSB — Sinus & Skull Base 3D (`ssb.html`)

**State:** Graph mode and these stages work: Specimen, Endoscope (including
station flights), CT, the variant lab (sphenoid diorama done; `lateral-wall`
later), and Procedure mode (dissection states, the player, per-state stations,
the decongested · as scanned · congested toggle, the flap overlay, the population
panel). The reference specimen is the UW head, standardized: right half mirrored,
septum centred. Normal asymmetry (the `scanned` base) is live; variants and
pathology wait. The external nose is the specimen's own. All content is `draft`;
only the owner sets `verified`.

**Next:** the board is `docs/ssb-roadmap.md` (§1 status, §2 owner decisions and
actions, §3 open work packages). Realistic anatomy's next step is RS2c
(`docs/ssb-roadmap.md` §3a; design `docs/ssb.md` §14).

---

## Wiki scaffold (`wiki/`)

**State:** Not live; nothing is built or served from this repo. Quartz config,
styles, landing page, an inert deploy workflow, and `wiki/sync/sync-vault.mjs`,
the fail-closed sync from the owner's vault (six subspecialty folders; Personal
Notes, drafts, source texts and governance files never leave). Reader corrections
round-trip through public issues (`wiki/feedback/`). DGMO diagrams render at build
time (`wiki/dgmo/`).

**Next:** create `skflx/ent-wiki` and go live (`wiki/README.md` §Bootstrap); widen
the phase-1 gate beyond the maps of content as notes are vetted; decide whether to
automate the sync (needs a secret). Going public is an owner escalation
(`docs/decisions.md` §7).

---

## Archive (`archive/`)

**State:** The OHNS knowledge graph from the retired atlas viewers, as JSON and a
flat text rendering. Nothing serves or checks it. Only the temporal-bone seed set
is owner-vetted; the rest is draft scaffolding (`archive/README.md`).

**Next:** optional. Vetting nodes, or mining them into OKSAT modules, would put the
content to work; neither is scheduled.

---

## Verification

**State:** Node suites and browser suites are listed under Commands in
`CLAUDE.md`; what each one proves is in `docs/verification.md`. CI runs the
fast tier (`check-data`, `lint-oksat`, the page smoke test) on every PR and a
subsystem's suite when its files change; the SSB suite runs as four parallel
shards (`SHARDS` in `tools/test-ssb.mjs`). Security: `docs/security.md` (audit
2026-09-23).

**Next:** GitHub Pages cannot send headers, so `frame-ancestors` and HSTS are out
of reach without a proxy host. Whether that matters is the owner's call.
