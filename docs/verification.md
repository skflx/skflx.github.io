# Verification — how to prove a change works

Per subsystem: the probes that show a change is good. Most are automated
(`tools/*.mjs`, run in CI by `.github/workflows/ci.yml`); this doc names what
each one pins and the manual checks that remain. Run the automated suite
locally before pushing:

```bash
node tools/check-data.mjs                  # data + security invariants (deps-free, instant)
node tools/smoke-pages.mjs                 # every page boots, zero real console errors
node tools/test-oksat-engine.mjs           # OKSAT engine (answer lock, SRS, keyboard)
node tools/test-oksat-learn.mjs            # Interactive learning viewer
node tools/test-search.mjs                 # search.html and the CPT deep link
node tools/test-palette.mjs                # Cmd/Ctrl-K palette: lazy load, filter, Enter, Esc, opt-outs, wiki failing
node tools/test-airway-resume.mjs          # Airway Rounds saved games
node tools/lint-oksat.mjs [slug ...]       # OKSAT modules vs the quality spec (no slug: all)
node tools/lint-oksat-guide.mjs [slug ...] # OKSAT guides vs the teaching-shape spec (no slug: all)
node tools/lint-skills.mjs                 # house skills: structure, evals.json, registration
node tools/test-ssb.mjs [--only a,b]       # SSB sections (names: SECTIONS in the file)
node tools/test-a11y.mjs [--check]         # axe-core scan, every page, light and dark (report-only unless --check)
```

CI always runs `check-data`, `lint-oksat`, `lint-oksat-guide` and the page
smoke test. The OKSAT engine and learning suites run when their files change;
the SSB suite runs as four parallel jobs (`node tools/test-ssb.mjs --shard i/4`).
`SHARDS` in `tools/test-ssb.mjs` holds the split and refuses a section that is
in no shard or two; a new section goes in the lightest shard, and the workflow
matrix and the `/4` change with it. A push to `master`, or a change to the
workflow or the shared harness, runs everything. Changes under
`tools/ssb-pipeline/` start the SSB suite only if they touch `dissection.json`.

The axe scan (`test-a11y.mjs`) is report-only in CI (`continue-on-error`). Its `--check` mode fails on any violation not in `tools/a11y-baseline.json` (rule, page, theme, node count); regenerate that file with `--write-baseline` only when a fix or an accepted exception changes it. It inspects the top document only.

The browser suites need only a real Chromium: every page script is
same-origin (React/htm are vendored), so they run without network. The only
remote requests left are optional Google Fonts on OKSAT pages, which the
console allowlist tolerates. Wall-clock checks (a flight sampled mid-way,
frames counted over a second) can fail on a loaded machine; do not run shards
side by side on one box.

## "Real" console error

Anything logged as `console.error` / `pageerror`, or a **same-origin**
`requestfailed`, that `tools/console-allowlist.json` does not match. The
allowlist holds only known third-party noise (font and CDN resets). A
first-party error is never allowlisted: a same-origin 404 is how the harness
catches a script tag left pointing at a deleted file. A CSP violation logs a
console error, so smoke also proves each page runs under its own policy.

## Playbooks by subsystem

### Security invariants (all pages)
`tools/check-data.mjs` §3 (spec: `docs/security.md`): vendored files match
their pinned SHA-384; every root `*.html` has a CSP whose `script-src` has no
`'unsafe-inline'`, `'unsafe-eval'` or remote origin; no inline executable
`<script>`, no `on*=` handler, no `javascript:` URL; `rel="noopener"` on every
`target="_blank"`; the self-contained pages have no remote `<link>`, `<script>`
or `<img>`. §4 requires every `css/` and `js/` reference to carry `?v=` equal
to the first 8 hex of the file's SHA-256 (fix with `node tools/stamp-assets.mjs`).
To prove the check bites, append a comment to `css/site.css` and rerun: the
pages that load it must FAIL. Smoke also loads `oksat-study.html?m=<img onerror…>`
and asserts the payload renders as text.

### One-pager (`index.html`)
- Day/night toggle (`.site-theme-toggle`, `js/site.js`) flips `html[data-theme]`
  and persists `sk_theme`; `js/theme-boot.js` applies it before paint.
- All five sections (`.block[data-fold]`) load folded, with no flash; a tap on a
  head toggles it (`aria-expanded` follows). A topbar or deep link
  (`index.html#research`) opens its section; the one in view gets
  `aria-current` (scroll-spy in `js/onepager.js`). With JavaScript off, every
  section is open. Smoke pins the folded start and a head tap.
- No horizontal scroll at 390px. Both figures are ASCII 3D and ship a baked
  frame, so they render without JS.
- The hero portrait is an egg (`#hero-portrait`): it opens from the "MD" word
  (`docs/decisions.md` §10).
- Check phones and the phone "desktop site" mode (980px, the ≥960px two-column
  grid), in both themes.
- `#pgy-status` renders the residency year. The HTML ships the current value as
  a no-JS fallback, so **both** must change together. To check the July 1
  rollover without waiting:
  ```bash
  node -e "const f=(d)=>{const n=new Date(d);const y=n.getFullYear()-(n.getMonth()<6?1:0);
  return Math.max(1,Math.min(5,y-2024+1))};
  ['2026-06-30','2026-07-01','2029-07-01'].forEach(d=>console.log(d,'PGY-'+f(d)))"
  ```
- Smoke: `.hero-name` exists and `#pgy-status` reads `PGY-<n>`.

### OKSAT hub (`oksat.html`)
- Every guide in `OKSAT_GUIDES` is a card under `#guides`, launching
  `oksat-learn.html?g=<slug>`; with a seeded `oksat:learn:*` record it shows
  `done / total sections` and reads **Resume**.
- Every module in `OKSAT_MANIFEST` is a card under `#modules`, grouped by
  subspecialty, launching `oksat-study.html?m=<slug>`. With seeded
  `oksat:progress:*` it shows a meter and reads **Resume**; otherwise **Launch**.
- A due `oksat:srs:*` item unhides `#review-banner`; `#review-count` totals due
  items; `#review-list` links each module with due items, most due first
  (`test-oksat-engine.mjs` case 8).
- `#weak` lists concepts with 3+ attempts and a miss, worst first, hidden when
  none (case 9).
- Settings: the local-data reset (arms on first click, fires on second) and
  Export / Import progress (case 10: the round trip restores every `oksat:*`
  key; a malformed import writes nothing). No API key, sync or reviewer UI may
  reappear.
- Smoke: `#modules .module-card` count > 0.

### OKSAT study engine (`oksat-study.html?m=pediatrics`)
The highest-regression-risk code. `tools/test-oksat-engine.mjs` pins:
- **Recall gate**: each MCQ opens on the stem alone. **Show the choices** (`c`)
  opens the options; **Reveal answer** (space) shows the answer for a memory
  attempt, then a four-point self-grade. The engine tags each item `mode`
  `'recall'` or `'mcq'` in `oksat:progress:<slug>:<rev>`.
- **First-attempt lock**: on the MCQ path the first selection records and
  disables the options; a later click changes nothing; it survives reload.
- **SRS write**: `oksat:srs:<slug>:<rev>` holds Leitner `box` 1–5 and
  `nextReview`. A cold recall jumps two boxes; a correct MCQ, one; a miss
  resets to box 1.
- **Navigation**: **Continue** opens the first unanswered or due item; `u` and
  **Next unanswered** skip answered items, wrapping; the jump slider
  (`input.ok-jump-range`) previews while dragged and jumps on release.
- **Review attempt**: a due answered item opens at the gate with its old answer
  hidden and options enabled; answering moves `box` and `nextReview` but not
  `answers` or `firstCorrect`; a second click in the same review changes nothing.
- **Keyboard**: at the gate, space/enter reveals and `c` opens choices. Then `1`–`4`
  grade a revealed answer, `1`–`9` or `a`–`d` select an option, `←`/`→`
  navigate, space/enter advance, `u` next unanswered, `r` random, `h`/esc home
  (`docs/design-principles.md`).
- **Legacy migration**: a seeded `mcq:*` key is copied to `oksat:*` by `js/oksat/store.js`.
- The page mounts straight into the module with **no prompt**; the test seeds
  `oksat:reviewer` to pick a namespace. Concept deep link `&c=<key>` pre-filters (manual).

### Interactive learning (`oksat-learn.html?g=<slug>`)
`tools/test-oksat-learn.mjs` pins, and `check-data` (`OKSAT_GUIDES`) validates the data beneath:
- **Hotspot to 3D**: in Explore a selected structure gets "Open in 3D model"
  (`a.lr-hs-3d`, `OLSB.html#m=3d&sel=<id>`); Find shows none.
- **Render**: a chapter draws its sections; the rail lists chapters, flashcards
  and pearls; no raw `**` or `[[ ]]` reaches the page.
- **Predict-then-reveal**: the typed answer is echoed and never stored; keys 1–4
  grade; the grade lands in `oksat:learn:<slug>:<rev>` as
  `checks['<chapter>/<section>:<id>']`; Mark done and the grade survive reload.
- **Modes**: Core hides every "Go deeper" block; Step shows one section (Next,
  arrow keys, deep links); both persist.
- **Terms**: each lexicon abbreviation is marked; hover or focus shows the full
  name, Escape closes it (desktop); a tap pins it inside the 16 px gutters and a
  tap elsewhere closes it (phone); a term in a checker label opens the popover
  without ticking the box.
- **Checkers** evaluate their declared rules (ABRS, ESS, biologic eligibility
  with its prerequisite, response grade).
- **Inline module questions** load by reference, lock on first answer, store
  under `practice['<module>:<item>']`, and leave the module's own progress and
  SRS untouched. Two modules can load into one page.
- **Deck and pearls** load every chapter; a card grade writes the same record.
- **Untrusted input**: `?g=`, `?c=` and the hash match only known ids; a payload renders as text.
- **sk.oto link**: one "Read the map in sk.oto" link with the exact `OKSAT_SKOTO`
  URL where the subspecialty has a map; none where it has none, or when `live` is false.
- Manual: read each new chapter in both themes and at phone width. A green run
  proves structure, not that the page teaches.

### Airway Rounds (`airway-jeopardy.html`)
- Boots with **zero external requests** (its CSP names no remote origin, so a
  regression is also a console error); `AIRWAY_DATA` loads. Smoke:
  `window.AIRWAY_DATA.questions` is an array.
- `test-airway-resume.mjs`: saved games per tab; resume restores the exact
  state; Start fresh and End game clear only that tab's save; the game plays
  with storage throwing.

### CPT search (`cpt-search.html`)
- Zero console errors; typing filters; clicking a result copies its code and
  flips the button to **Copied**; `<img src=x onerror=…>` renders as text.
- `test-search.mjs` (covers `search.html`): a module-title query links to
  `?m=<slug>`; a CPT hit lands on its row, on desktop and phone.
- `test-palette.mjs` (the Cmd/Ctrl-K palette, `js/palette.js`): the wiki index
  is route-stubbed; nothing is fetched before the first press; opt-out pages stay
  off; Enter opens a wiki note, module and CPT row; the wiki failing still leaves a
  working palette.

### PDF chapter splitter (`pdf-chapter-splitter.html`)
- Zero console errors, with `PDFLib` and `JSZip` defined (smoke).

### OLSB (`OLSB.html`)
- Boots with zero console errors and draws the layered SVG
  (`html[data-olsb="ready"]`). `#p=mastoidectomy&s=6` opens the facial-recess
  step; `#d=axial&p=posterior&s=2` opens a cut-plane tour; tapping the sinus
  tympani lights its neighbours; a payload in `#p=` selects nothing and never
  becomes markup.
- `check-data` checks every drawn structure has a glossary entry and label
  anchor, every `rel` target exists, every step's `focus`/`layers`/`view` resolves.
  After a geometry change, look at every tour step at 390px and 1280px in both
  themes: label placement is hand-tuned (`at`, `lab`).
- Guide deep link `#m=3d&sel=lscc` selects the structure; a hostile `sel` is ignored (smoke).
- **3D model**: `#m=3d&s=1` builds the volume in its worker and meshes it
  (`#olsb3d-stage[data-faces]`); a click selects a structure; a payload in
  `#m=3d&st=…&cam=…` selects nothing. `check-data` builds the coarse volume in
  Node: every label is a glossary entry and is built; every tour step, state and
  drill resolves and carves; every glossary relation between two drawn
  structures holds in the geometry.
- After moving anatomy, also look: isolate the ossicles, nerves and inner ear
  (`#m=3d&L=ossicles.nerves.inner.muscles&cam=…`) from lateral, above, front and
  medial; step the guided flight with the fine grid (`data-fine="ready"`) and the
  detail cube (`data-micro="ready"`); wait for `data-meshing` to leave `busy`
  (`data-remesh-ms` is the time taken). Check both Smooth and Blocks: thin
  structures (chorda, stapes crura, GSPN) are where smoothing loses most.
- **Real CT** (`#m=ct[&pl=ax|cor|sag][&at=<mm>]`): smoke runs it on a synthetic
  volume routed by Playwright (nothing under `tbone/` is read). Checks: no
  `tbone/` request before the mode is entered; a slice draws; a click on a
  landmark selects its glossary id and fills the info card; junk in `pl` or `at`
  falls back to axial without error (`pl=constructor` included); unreadable
  `tbone/` data shows the status message and Diagrams stays usable.
- **Truth check** (`olsb truth` in `check-data`, every run): OLSB structures are
  compared with the UW landmarks (`tbone/geometry/landmarks.json`), each against
  its tolerance; owner-vetted exceptions are above `TRUTH_CLASS`. `OLSB_TRUTH=1`
  prints the residual per structure. It proves nothing finer than the ~3 mm noise floor.

### ASCII 3D figures (`js/ascii3d.js`, `js/diagrams/`)
`check-data` §5 checks that every scene renders a non-blank frame, every page
showing a figure loads `css/ascii3d.css` then `js/ascii3d.js` before its scene,
no scene is orphaned, and every baked block equals a fresh render
(`node tools/ascii3d.mjs bake --check`).

`smoke-pages` (`figureReady`) checks each figure mounts live with a drawn grid.
On the one-pager, flipping `html[data-theme]` flips `data-a3d-shade`. On
Airway, picking another mode must bring the figure back live. To prove that
bites, remove the `mountAll` call from `js/airway/app.js`: the Airway smoke must FAIL.

Manual: `node tools/ascii3d.mjs render <id> --turn 4` for every side, then the
page at 390px and 1280px in both themes. Load once with JavaScript off to see the baked frame.

### Archive (`archive/`)
Not served, not smoke-tested, not checked by `check-data`. After touching it:

```bash
node -e "const g=require('./archive/kag-graph.json');
const ids=new Set(g.nodes.map(n=>n.id));
console.log('nodes',g.nodes.length,'edges',g.edges.length,
'dangling',g.edges.filter(e=>!ids.has(e.source)||!ids.has(e.target)).length)"
```

If `kag-graph.json` changes, regenerate `kag-graph-flat.txt` from it; never edit the flat file.

### SSB (`ssb.html`, `ssb/`)
Read `docs/ssb.md` first. Each section runs with `node tools/test-ssb.mjs --only <section>`;
the test names what it pins, and the human checks are listed here.

- **Knowledge graph** (`node tools/ssb-content.mjs`, also run by `check-data`;
  `--queue` prints the owner's review queue, not a check): required fields and
  controlled vocabularies (`docs/authoring-ssb.md` §5–§6); id format and global
  uniqueness; every reference resolves, structured and inline `[[id]]`; no HTML
  in text; a `verified` entity must cite only `verified` sources. Drafting one
  region file: `--allow-dangling <file>` turns unresolved refs into warnings.
  It cannot check medical correctness or whether a source supports its claim.
- **Dissection states** (offline; needs `pip install scipy scikit-image
  fast-simplification`): `python3 tools/ssb-pipeline/uw/dissect.py` prints the
  unit table (voxels against `dissection.json`'s `measured`, within 5 %) and carve,
  guard and budget figures; a rerun is byte-identical. `check-data` checks the
  `dissection.json` ↔ graph rule and each label against `labels.json`.
- **Page and variant lab** (`--only lab`): `ssb.html` boots in graph mode with a
  WebGL frame (software WebGL; flags in `tools/smoke-lib.mjs`); `#lab=frontal-recess`
  builds; a hostile `#lab=` is clamped, snapped or dropped. Through the read-only
  `window.__ssb.lab` hook the suite reads part names, hazards, bounding boxes and
  the computed pathway. Each diorama loads on its lesson's view; presets satisfy
  the graph's criteria; the ethmoid roof, frontal recess (uncinate attachments 1, 5,
  6) and sphenoid geometry match their pinned rules (`docs/ssb.md` §5.7–§6.1);
  clicking a part selects its entity; the dock never covers the canvas; phones
  have no horizontal scroll; reduced motion stops particles and continuous rendering.
- **Materials** (`js/ssb/materials.js`): every kind in the vocabulary of
  `docs/authoring-ssb.md` compiles and draws without WebGL error at `#q=full` and
  `#q=lite`; programs are shared per kind; a hostile `q` is ignored; every colour
  token exists for both themes in `css/ssb.css`.
- **CT mode** (`js/ssb/volume.js`, `mode-ct.js`, `ui-ct.js`; `docs/ssb.md` §3, §5.6)
  runs on a synthetic phantom, never the real volume: `tools/ssb-fixture-ct.mjs`
  builds it in the `ssb/ct/` format and Playwright routes the page's requests to
  it. Nothing is written into `ssb/`; the suite passes with or without the real
  volume. `--only ct` runs it; add `--int16` (with `ct` or `scope`) to serve the
  same phantom as a 16-bit HU head. `node tools/ssb-fixture-ct.mjs [dir]` writes
  the files for a manual look. The intake self-test (numpy and scipy, not in CI):
  `.venv/bin/python -I tools/ssb-pipeline/intake/intake.py selftest`.
  Without WebGL the stage still loads, draws and selects.
- **Procedure player** (`--only procedure`): `parsePatch`/`applyPatch` round-trip
  and refusals; exactly the box's voxels change; the `#p=` codec and store reject
  hostile input; on a fixture index, a hole through the septum plate is free at
  step 1 and clamps at step 0. The real-data section runs once `ssb/states/index.json` exists.
- **Mucosal state** (`--only mucosa`, `docs/ssb.md` §5.9): the decongested patch
  changes only erectile tissue, adds no bone voxels, keeps the midplane, and raises
  the measured cross-section by 1.35–1.45; the congested patch stays within 0.04
  of POP1's median. Human check: how the lining looks.
- **Population** (`--only population`, `docs/ssb.md` §5.10): the pack is at most
  300 kB, flagged `population` and never loaded at boot; its numbers match its
  file; off gives the pack back. Re-running `meanshape.py` reproduces the pack
  byte for byte. Human check: how the ghost reads beside the sinus.
- **Endoscope** (`js/ssb/scope.js`, `--only scope`, `docs/ssb.md` §3): scope
  geometry (lens angle, orthonormal image-up through the zenith, tip at depth 0);
  the `#scope=` codec; the camera equals the pose; keys, drag and wheel move the
  pose with the right signs; collision clamps to the last free 0.5 mm sample; the
  midline rule (E3b) holds in air and on the real specimen; the searches on the
  real specimen (a 1° grid) return the pinned poses. Station flights (E6) are
  checked in Node on every station in `ssb/geometry/stations.json`: free, tip in
  air, target within 35° of the view, `.L` the mirror of `.R`. A station that
  fails is reported to the orchestrator, never edited. `python3 tools/ssb-pipeline/uw/stations.py check`
  re-tests the file. Human check: a screenshot of `#scope=R,45,6,4,0,0`.
- **Specimen** (`--only specimen`, `docs/ssb.md` §3 Explore): every pack is a
  quantized glTF whose nodes match `ssb/models/packs.json`, named `<graph id>.<side>`;
  every mesh lies in the CT bounds; laterality holds three ways (data, scene,
  screen); picking and the shared cursor agree with an independent ray cast within
  1 mm; the section plane clips on the cursor. The standard specimen is
  mirror-symmetric about R = 0 (`standardSpecimenTests`, read with `git show` at
  the commit `ct.json` names). The open lining (`liningTests`) and the floor mucosa
  are pinned on their charts. Human check: `--shots` writes `spec-*.png`.
- **Anatomy states** (`--only anatomy`, `docs/ssb.md` §5.11): the suite builds its
  own patches and index inside the test; a patch changes exactly its box; refusals
  and the hash whitelist hold; with no index, Variants and Pathology are hidden.
- **Flap overlay** (`--only flap`, `docs/ssb.md` §5.7): areas against an
  independent point-in-polygon and Heron sum (2 %); the short < full < extended
  ladder; the `#flap=` codec on hostile input. The suite prints each design's area per side.
- **Reconstruction** (`tools/ssb-pipeline/uw/`) is offline and never runs in CI.
  Its proof is the overlay PNGs each stage writes and
  `ssb/reference/specimen-relations.json`. `check-data` pins only that every name in
  the specimen data is a graph id; the figure inventory (`uw/figures.py`) is judged
  on the overlay check images at a checkpoint.
- `node tools/test-ssb.mjs --shots <dir>` writes desktop and phone screenshots for a
  visual check. How a material looks is a human check: compare `full` with `lite` in a scratch page.

## Adding a new page to the harness

Append an entry to `PAGES` in `tools/smoke-pages.mjs` with a `ready(page)` that
resolves when the page's core content exists (poll via `page.waitForFunction`,
never sleep).
