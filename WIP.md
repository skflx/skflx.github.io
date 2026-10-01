# WIP — current state

One section per living system: what it is, where it stands, what is next.
This is a status document, not a changelog — when something is retired, its
section goes away rather than growing a postscript. Git history is the record
of how things got here.

Last reviewed: 2026-09-29.

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

**State:** The tool is now just the hub and the study viewer. Eight
hand-authored modules, each a data file in `js/mcq-modules/` plus one
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
three modules (facial reanimation, lip reconstruction, otoplasty); rhinology now has its
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
links) and three stages: the specimen, CT, and the variant lab. The
**reference specimen**
is reconstructed from the UW atlas (`tools/ssb-pipeline/uw/`, provenance
`ssb/LICENSE-data.md`): its axial and sagittal stacks are one CT (the
coronal is another head, `ssb/reference/uw-sinusanatomy2/README.md`),
resampled to RAS mm with the face masked (`ssb/ct/`), the air spaces split
into named compartments seeded by UW's own label arrows (label volume +
`ssb/geometry/labels.json`; the anterior/posterior ethmoid split is a
proxy for the basal lamella), landmarks (`ssb/geometry/landmarks.json`),
and meshes packed by region (`ssb/models/`). Stage C added the bony walls
as named label units and a `walls` pack (lamina papyracea, orbital floor,
maxillary walls, fovea / lateral lamella / cribriform plate, frontal tables,
sphenoid face, floor and lateral walls, planum, septum, inferior and middle
turbinates; superior turbinate, uncinate and bullar lamella not separable),
vessel and nerve centrelines (`ssb/geometry/sweeps.json`, every point marked
detected, labelled or inferred in `sweeps.meta.json`: optic nerve,
nasolacrimal duct and petrous ICA are seen in their canals; the cavernous
ICA — no contrast — vidian nerve and ethmoidal and sphenopalatine arteries
are mostly inferred), distance fields for the proximity HUD (`ct.json`
`sdf`), and a 3D test of the graph's spatial claims
(`ssb/reference/specimen-relations.json`: as of 2026-10-01, 94 testable,
88 agree, none contradict). `tools/check-data.mjs` fails if any of it names
an id the graph lacks. The **Specimen stage** (`mode-specimen.js`) shows the
packs in 3D: named views, bone X-ray/solid/hidden, region layers, landmarks,
click-through picking, a 3D cursor shared with the CT crosshair, and a
section plane with solid caps; sweeps are not drawn yet. **CT mode** (`mode-ct.js`,
`docs/ssb.md` §3) shows it as axial/coronal/sagittal canvases with a shared
crosshair, window presets, label outlines and hover names, without WebGL.
The variant lab — the `ethmoid-roof` (Keros, Gera, asymmetry, AEA course,
supraorbital cell) and `frontal-recess` (IFAC cells, uncinate attachment,
computed drainage pathway) dioramas, with presets from the graph's
classifications, picking into the panels, hatched hazard sites and a
`#lab=` URL state (`docs/ssb.md` §6; behaviour pinned by
`tools/test-ssb.mjs`). Surfaces are procedural per tissue kind
(`js/ssb/materials.js`, `docs/ssb.md` §7.4): world-space mm noise from
`--ssb-*` tokens, no textures, quality `full`/`lite` by device hints or the
`#q=` hash key; the dioramas use them now, the specimen and endoscope will
reuse them. Draft knowledge graph in `ssb/content/`: anatomy by region
(nasal/maxillary/PPF; ethmoid/frontal/orbit/ACF; sphenoid/sellar/clival)
plus a pathology layer (inflammatory/infectious/structural; neoplastic).
Every file was authored by one model and adversarially reviewed by
another; every journal source was matched to its PubMed record (NCBI
E-utilities; the few PubMed does not index were confirmed by hand).
"Verified" on a source means exists-as-cited, not supports-the-claim; all
content is still `review: draft`. The Chiu/Palmer/Adappa atlas (2nd ed.,
the owner's copy; chapter 7 is not in the Drive folder) was read chapter by
chapter against the graph and integrated in our own words, one source per
chapter; conflicts were decided on evidence (e.g. lumbar drains stay for
high-risk defects on trial evidence). The UW Interactive CT Sinus Anatomy
site (owner-reported permission) is crawled into `ssb/reference/uw-sinusanatomy2/`:
every labeled frame's labels and arrow tips (`slices.json`), from which
`tools/ssb-pipeline/uw/relate.py` tests the graph's spatial claims. As of
2026-09-28: about 1,030 entities (50 procedures, 78 conditions), 242
sources; 60 spatial claims testable against UW, 58 agree, the other 2 a
documented arrow-placement artifact.

**Next:** The endoscope stage (`docs/ssb.md` §3: fulcrum optics, collision, HUD, station
poses); the `sphenoid` diorama (rest of phase 2); procedure mode and
self-test (phases 6–7). Owner review of the two dioramas' schematic
proportions (each module's header lists what the graph does not give) and
of the graph (tier 1 first) — flip `review` to verified; record the UW
authors' written permission beside `ssb/LICENSE-data.md`. Hand
segmentation (3D Slicer) would replace the reconstruction's proxies: the
true basal lamella, the vidian and ethmoidal canals, and the cavernous ICA
(or a contrast CT). This specimen's AEA–PEA spacing (21 mm against a
population mean of 12) rests on an inferred PEA — worth an owner look.
Known content
gaps:
- Anatomy: petrolingual/parasellar ligaments, carotid cave, jugular
  foramen and CN IX–XI; orbital septum, superior ophthalmic vein, frontal
  lobe beyond gyrus rectus, hard palate, parapharyngeal space.
- Procedures (so conditions can link `managedBy`): canthotomy/cantholysis,
  orbitotomy, frontal sinus cranialization, septodermoplasty and Young's,
  transantral IMAX ligation, Lynch approach.
- Owner review flagged by the integration: whether the two dry-eye hazards
  (vidian neurectomy vs vidian sacrifice in transpterygoid work) should
  merge; optic nerve sheath incision wording in optic nerve decompression.
- Conditions: EGPA, PCD, immunodeficiency, granulomatous infections,
  septal hematoma/abscess, developmental cysts, organizing hematoma,
  facial fractures; HPV-related multiphenotypic and SMARCA4-deficient
  carcinomas, non-intestinal adenocarcinoma, biphenotypic sarcoma,
  petroclival/cavernous/spheno-orbital meningiomas, trigeminal schwannoma,
  germinoma, LCH, optic pathway glioma.
- Classifications/numbers: SPOA drainage size threshold, AFRS staging,
  Cannady (IP), WHO CNS meningioma grade, AJCC N categories, ION canal
  grading, JNA staging variants, olfactory neuroblastoma staging review.

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
