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

**State:** A software renderer draws each figure except Fig. 1 into a
monospace grid (z-buffered, Blinn-Phong shading mapped to glyphs, contour
glyphs at silhouettes and part edges). Figures turn, take drag and arrow keys,
re-shade on a theme flip, and stop off-screen or under reduced motion. The same
core runs in Node (`tools/ascii3d.mjs`), which bakes the no-JS frames.

- **Fig. 2** (one-pager, Research): binaural pitch fusion. Schematic, not data;
  owner to vet the depiction and caption.
- **Leitner staircase** (OKSAT hub): its intervals are checked against the engine.
- **Larynx** (Airway setup screen): schematic adult-male proportions; owner to vet.

**Next:** figures inside OKSAT items (needs a hook in `js/oksat-engine.js`);
candidates the prose already asks for: facial nerve course, IAC nerve quadrants,
semicircular canal planes.

---

## One-pager (`index.html`)

**State:** An index: name beside a background-removed portrait, then five open
numbered sections with sticky heads on desktop. Fig. 1 (the cochlea, drawn to
the owner's own implant; `tools/gen-cochlea.py`) sits in About; Fig. 2 in
Research. The residency year is computed in `js/onepager.js` and duplicated as
a no-JS fallback in the HTML; change both or neither.

**Next (owner):** add the CV. The hero link is removed until `documents/cv.pdf`
exists; then add a `Curriculum vitae` item to `.hero-links` in `index.html`.

---

## OKSAT (`oksat.html`, `oksat-study.html`)

**State:** A hub and a study viewer. Modules are hand-authored data files in
`js/mcq-modules/`, each with one manifest entry; the shared engine renders all
of them. Every question opens on a recall gate: reveal and self-grade, or show
the choices and answer as a locked-first-attempt MCQ. The engine records which
path settled each item. Leitner boxes resurface misses. Progress stays in the
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
- **Rhinology:** allergy and allergy testing.

None of the newer modules is web-verified or clinically verified, except where
its explanations say so. Otoplasty's explanations flag vault-versus-StatPearls
discrepancies (hillock mapping, prominence thresholds) for owner review.

**Next:** authoring is manual (`docs/authoring-oksat.md`). Laryngology and
head-and-neck oncology have hues reserved in `OKSAT_SUBSPECIALTIES` but no
modules. The AO CMF content is still to be folded into the facial-trauma modules.

---

## Airway Rounds (`airway-jeopardy.html`)

**State:** Complete and self-contained: a question bank with Rounds, Jeopardy
board, quick quiz and browse modes. No external requests by design, enforced by
its CSP, so it runs on bad conference-room wifi or none.

**Next:** nothing planned. Keep it CDN-free; that constraint is the feature.

---

## CPT search (`cpt-search.html`)

**State:** Working, on the shared system (`css/site.css`). Logic in
`js/cpt-search.js`; history stays in `localStorage` (`cpt-history`,
`cpt-analytics`). The code table is hand-maintained inline data.

**Next:** nothing planned.

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
actions, §3 open work packages). The realistic-anatomy plan's next step is
`docs/realistic-anatomy.md` §11 (RS2c).

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
verification suites on every PR. Security: `docs/security.md` (audit 2026-09-23).

**Next:** GitHub Pages cannot send headers, so `frame-ancestors` and HSTS are out
of reach without a proxy host. Whether that matters is the owner's call.
