# WIP — current state

One section per living system: state and next steps. A status document, not a
changelog. Detail lives in the owning doc named under each heading. Last reviewed: 2026-11-10.

---

## Design system (`css/site.css`, `css/oksat.css`)

**State:** one token set. Paper and ink, hairline rules, Archivo and IBM Plex
Mono (self-hosted). Surgical red signal colours calibrated to `#941B1B` (light,
WCAG AAA 7.62:1) and `#F03E4D` (dark, WCAG AA 5.06:1), synchronized with the
`sk.oto` clinical wiki (`quartz.config.yaml`). OKSAT mirrors it as `--ok-*`;
Airway's stage follows the site theme on `--aw-*` tokens (see `AGENTS.md`).

**Next:** single-source design token pipeline (`tokens/theme.json` + `tools/sync-tokens.mjs`).

---

## Figures: ASCII 3D (`js/ascii3d.js`, `js/diagrams/`)

**State:** three scenes, each an egg (`js/egg.js`): **Cochlea** (About, from
"electrode"), **Fusion** (Research, from "Binaural pitch fusion") and **Larynx**
(Airway Rounds, from the "Airway" heading). The cochlea is fitted to the owner's
CT and implant; turn count, canal width, ganglion radius and contact angles are
assumed. The fusion curves are schematic. The larynx has schematic adult-male
proportions. All three are owner-vetting items.

**Next:** figures inside OKSAT items (needs a hook in `js/oksat/engine.js`).
Candidates the prose already asks for: facial nerve course, IAC nerve quadrants,
semicircular canal planes.

---

## One-pager (`index.html`)

**State:** an index. Name beside a hero that opens its portrait from the "MD"
word (`docs/decisions.md` §10) with an accessible toggle, guarded text selection,
and an organic 0.5s decelerating glide curve. Five numbered sections, all folded
at load; each opens from its head or from a link into it; with no JavaScript all
five are open. Sticky section heads on desktop. The residency year is computed
in `js/onepager.js` and duplicated as a no-JS fallback in the HTML: change both or neither.

**Next (owner):** add the CV. The hero link stays removed until `documents/cv.pdf`
exists; then add a `Curriculum vitae` item to `.hero-links` in `index.html`.

---

## Search and navigation (`js/site.js`, `search.html`)

**State:** global `Cmd+K` / `Ctrl+K` shortcut. Form element focus and interactive
app pages (`airway-jeopardy.html`, `oksat-study.html`, `oksat-learn.html`,
`pdf-chapter-splitter.html`) opt out via `data-no-hotkey` on `<html>` or `<body>`
to prevent state loss.

**Palette:** `Cmd/Ctrl+K` opens `<dialog id="cmd-k-palette">` (`js/palette.js`, loaded on the
first press) over site pages, OKSAT guides and modules, CPT codes and wiki notes. The wiki index
is fetched on the first open only. If the palette cannot load, the key goes to `search.html`.

---

## OKSAT (`oksat.html`, `oksat-study.html`, `oksat-learn.html`)

**State:** a hub, a question viewer and an Interactive learning viewer. The hub
has two segments: **Interactive learning** (guides) and **Question modules**.
Modules are hand-authored data files in `js/oksat/modules/`, one manifest entry
each; the engine renders all of them. Progress stays in the browser. Each module
and guide links to its sk.oto map (`OKSAT_SKOTO`, `live: true`).

Interactive learning guides (`docs/authoring-oksat-guide.md`):

- **AR · CRS · AERD** (`ar-crs-aerd`): ten chapters, all draft. Primary papers were not
  re-read line by line. One cross-source
  difference is flagged in `allergy-testing` q95 (NARES eosinophil cutoff).
- **Normal Ear Anatomy** (`ear-anatomy`, plan `plans/2026-11-02-ear-anatomy-guide.md`):
  listed as **Draft**; the owner removes the notice (#237). Figures and CT slices
  are credited in `images/oksat/ear-anatomy/ATTRIBUTION.md`. A region is a
  pointer at UW's label tip, not a segmentation.
- **Whisking and auditory cortex** (`jc-whisking-auditory-cortex`, plan
  `plans/2026-11-10-jc-whisking-auditory-cortex.md`): listed as **Draft**. Reads one
  open-access paper figure by figure, with cropped paper figures under CC BY 4.0
  (`images/oksat/jc-whisking-auditory-cortex/ATTRIBUTION.md`). No question module, so
  no drill rows.

None of the newer modules is clinically verified except where its explanations say so.
Otoplasty's explanations flag vault-versus-StatPearls discrepancies for owner review.

**Next:** more guides (`/oksat-guide`), each built with its questions; the plan is
`docs/oksat-learn-roadmap.md`. Laryngology and head-and-neck oncology have hues
reserved in `OKSAT_SUBSPECIALTIES` but no modules. AO CMF content to fold into facial trauma.

---

## Airway Rounds (`airway-jeopardy.html`)

**State:** complete and self-contained: Rounds, Jeopardy board, quick quiz and browse
modes. Unfinished games survive a reload, per tab (saved-game keys and limits in `js/airway/app.js`). The stage follows the site theme: light for rooms, dark for projectors.

**Next:** nothing planned. Keep it CDN-free; that constraint is the feature.

---

## PDF chapter splitter (`pdf-chapter-splitter.html`)

**State:** working. Logic in `js/pdf-chapter-splitter.js`; pdf-lib and JSZip
vendored (`js/vendor/README.md`). Reads the PDF in memory; writes nothing to storage but the theme.

**Next:** nothing planned.

## CPT search (`cpt-search.html`)

**State:** working, on `css/site.css`. Logic in `js/cpt-search.js`; history in
`localStorage` (`cpt-history`, `cpt-analytics`). The code table is hand-maintained inline data.

**Next:** nothing planned.

---

## Atlas (`atlas.html`)

**State:** unlisted (`noindex`). Hand-authored midsagittal SVG; values are draft until
the owner vets them. Source `tools/atlas/anatomy.json`, baked by `tools/atlas.mjs`.

**Next:** owner vetting of control points and sources (`docs/atlas.md`).

---

## OLSB — middle ear & mastoid (`OLSB.html`)

**State:** unlisted (`noindex`). Three modes: the 3D model (default), the 2D
diagrams (the fallback without WebGL and every `#d=`/`#p=` link), and Real CT. Anatomy,
notes and relations are draft (owner, `docs/decisions.md` §7). Architecture: `AGENTS.md`.
Measured fit to the UW CT is poor; the envelope is an owner decision (`tools/olsb-ct-fit.mjs`, `js/olsb/volume.js`).

**Next:** owner review of the anatomy, notes and relations, 3D geometry first.
Candidates: segmenting a real temporal bone CT into the same labels (SSB's
pipeline); a find-it quiz in 3D; more drill states (cochlear implant, stapedotomy);
anatomical variants (sclerotic mastoid, high jugular bulb, dehiscent tegmen or superior canal).

---

## SSB — Sinus & Skull Base 3D (`ssb.html`)

**State:** unlisted (only `atlas.html` links to it). Two stages: the Specimen (pick, tree and search identify structures) and the Scope (the endoscope, traversal). The page loads only what the two stages draw (`docs/ssb.md` §5, §6.1).

**Gaps, owner decisions needed:**
- `ssb/geometry/sweeps.json` is not fetched by the page: the sweep loader and layer are gone. It stays as the input of `tools/ssb-pipeline/uw/sdf.py` (the Scope HUD's ICA, optic nerve and AEA fields) and of `normalize.py`. Deleting it is an owner call; it also needs the `sdf.py` input changed.
- Selecting a vessel or nerve in the Specimen no longer draws its tube: the sweep layer was the only 3D geometry for those ids. Owner call: restore a selected-vessel display (which brings the fetch back) or leave them as text in the panel.
- The UW ground truth the pipeline reads (`slices.json`, `labels.json`, `crosswalk.json`, `split.json`) is in `tools/ssb-pipeline/uw/reference/uw-sinusanatomy2/`, restored from b4b213c. `split.json` is the held-out tip division; `score.py split` rewrites it, and a rewrite is not checked against the committed file.
- `ssb/geometry/stations.json` still carries `byState` (keys are dissection states that no longer exist), `overviews` and `uncovered`. `stations.py` writes only the `stations` table and solves no `byState`; `tools/test-ssb.mjs` still reads its ids. A regeneration that drops `byState` must first move its ids into `uncovered` or `overviews`, or the coverage check fails (owner call).
- `content`: the procedure, hazard, principle and condition collections are still shown in the tree.
- Picking: the opaque external nose and any opaque skin yield to what is behind them. On the 20 by 16 grid of the default view the nose was first over a structure on 10 of 59 visible points; it is now 0 (`tools/test-ssb.mjs`, "picks: ... skin"). A solid envelope still occludes.
- Scope, unlabelled white patch (left of centre at the default pose, `#scope=R,30,0,0,0,30`): no tagged geometry is hit by its ray, and hiding the bone envelope does not remove it. Not identified and not labelled, so as not to label a guess; next step is to enumerate the visible meshes under that ray in the browser. Held by the owner: Scope is not changed until the owner says so.

**Next:** status is GitHub issue #266 and its sub-issues; the spec is
`plans/2026-10-07-ssb-roadmap.md`.

---

## Temporal bone reference volume (`tbone/`)

**State:** internal reference data, loaded lazily by OLSB's Real CT mode and by the
truth check. Draft until the owner verifies the anatomy. Scale is inferred (±10 %).
OpenEar (CC BY 4.0, #244) is fetched and ingested locally only (git-ignored `incoming/`);
nothing from it is committed. Method and limits: `tbone/README.md`. Spec `plans/2026-11-03-uw-temporal-bone-volume.md`.

**Next:** review sweeps against the labelled slices; settle the scale (owner or a
measured reference); register OLSB to it (#244 and its follow-on). Frame placement (B4) is next.

---

## Archive (`archive/`)

**State:** kept content, served by nothing (`archive/README.md`). Only the
temporal-bone seed set is owner-vetted.

**Next:** optional. Vetting nodes, or mining them into OKSAT modules, is not scheduled.

---

## Verification

**State:** suites are listed in `docs/verification.md`; CI runs the fast tier on
every PR and the SSB suite as two shards. Security model: `docs/security.md`.

**Next:** GitHub Pages cannot send headers, so `frame-ancestors` and HSTS are out of
reach without a proxy host. Whether that matters is the owner's call.
