# Verification — how to prove a change works

Per subsystem: the exact probes that show a change is good. Most are
automated (`tools/*.mjs`, run in CI by `.github/workflows/ci.yml`); this doc
is the spec they implement and the manual playbook for anything not yet
covered. Run the automated suite locally before pushing:

```bash
node tools/check-data.mjs                 # data + security invariants (deps-free, instant)
node tools/test-wiki-sync.mjs             # vault → wiki privacy boundary (deps-free)
node tools/smoke-pages.mjs                # every page boots, zero real console errors
node tools/test-oksat-engine.mjs          # engine behavior (answer lock, SRS, keyboard)
node tools/test-ssb.mjs                   # SSB variant lab: dioramas, pathway rules, picking, hash
```

The browser suites need a real Chromium and nothing else: every page script
is same-origin (React/htm are vendored in `js/vendor/`), so they run in a
network-restricted sandbox too. The only remote requests left are optional
Google Fonts on the OKSAT pages, which the console allowlist tolerates.

## "Real" console error

Anything logged as `console.error` / `pageerror`, or a **same-origin**
`requestfailed`, that is **not** matched by `tools/console-allowlist.json`.
The allowlist holds only known-benign third-party noise (font/CDN network
resets). A first-party error is never allowlisted — a same-origin 404 is how
this harness catches a script tag left pointing at a deleted file. The static
test server answers `/favicon.ico` with 204 (pages link `images/favicon.svg`;
browsers still probe the root path). A CSP violation logs a console error,
so the smoke suite also proves each page runs under its own policy.

## Playbooks by subsystem

### Security invariants (all pages)
`tools/check-data.mjs` §3 (spec: `docs/security.md`): vendored files match
their pinned SHA-384; every root `*.html` has a CSP whose `script-src` has no
`'unsafe-inline'`/`'unsafe-eval'`/remote origin, no inline executable
`<script>`, no `on*=` handlers or `javascript:` URLs, `rel="noopener"` on
every `target="_blank"`, and — for the self-contained pages — no remote
`<link>`/`<script>`/`<img>` at all. §4 checks every root page's `css/` and
`js/` references carry `?v=` equal to the first 8 hex of that file's
SHA-256 (fix with `node tools/stamp-assets.mjs`; spec in its header). To
prove the check bites, append a comment to `css/site.css` and rerun: the
three pages that load it must FAIL. Smoke additionally loads
`oksat-study.html?m=<img onerror…>` and asserts the payload renders as text.

### One-pager (`index.html`)
- Day/night toggle (`.site-theme-toggle`, `js/site.js`) flips
  `html[data-theme]` and persists `sk_theme`; `js/theme-boot.js` applies it
  before paint.
- All sections are open; the topbar links (`#about`, `#tools`, `#work`,
  `#research`, `#beyond`) are plain anchors, and the one in view gets
  `aria-current` (scroll-spy in `js/onepager.js`).
- No horizontal scroll at 390px wide; the cochlea figure (Fig. 1) is static
  SVG and renders without JS, and without CSS it is still a line drawing
  capped at its viewBox size (the generator emits fallback `fill`/`stroke`/
  `width`/`height` attributes; any stylesheet rule outranks them).
- Check phones and the phone's "desktop site" mode, which lays the page out
  at 980px (the ≥960px two-column grid), in both themes.
- `#pgy-status` renders the current residency year. The HTML ships the
  current value as a no-JS fallback, so **both** must be updated together if
  either is ever edited by hand. Check the rollover directly rather than
  waiting for July:
  ```bash
  node -e "const f=(d)=>{const n=new Date(d);const y=n.getFullYear()-(n.getMonth()<6?1:0);
  return Math.max(1,Math.min(5,y-2024+1))};
  ['2026-06-30','2026-07-01','2029-07-01'].forEach(d=>console.log(d,'PGY-'+f(d)))"
  ```
- Smoke assertion: `.hero-name` exists and `#pgy-status` reads `PGY-<n>`.

### OKSAT hub (`oksat.html`)
- Every module in `OKSAT_MANIFEST` renders as a card under `#modules`,
  grouped by subspecialty, each launching `oksat-study.html?m=<slug>`.
- With seeded `oksat:progress:*` the card shows a completion meter and reads
  **Resume**; with none it reads **Launch**.
- With a `oksat:srs:*` item whose `nextReview` is today or earlier, the
  `#review-banner` unhides, `#review-count` totals due across all modules,
  and `#review-go` links to the module holding the most.
- Settings holds only the local-data reset, which arms on first click and
  fires on second. No API key, sync, or reviewer UI may reappear.
- Smoke assertion: `#modules .module-card` count > 0.

### OKSAT study engine (`oksat-study.html?m=pediatrics`)
The highest-regression-risk code. `tools/test-oksat-engine.mjs` pins:
- **Recall gate**: every MCQ opens on the stem alone — options hidden until
  **Show the choices** (or `c`) opens them. **Reveal answer** (or space) shows
  the answer for a memory attempt, then a four-point self-grade; the engine
  tags each item `mode` `'recall'` or `'mcq'` in `oksat:progress:<slug>:<rev>`.
- **First-attempt lock**: on the MCQ path, the first selection records in
  `oksat:progress:<slug>:<rev>` and disables the options; a later click does
  not change it; it survives reload. (Answers lock on first attempt — no
  re-answering to game the score.)
- **SRS write**: `oksat:srs:<slug>:<rev>` gains an item with Leitner `box`
  1–5 and a `nextReview` date. A cold recall jumps two boxes; a correct MCQ,
  one; a miss resets to box 1.
- **Keyboard**: at the gate space/enter reveals and `c` opens the choices;
  then `1`–`4` self-grade a revealed answer, or `1`–`9`/`a`–`d` select an
  option once the choices are open; `←`/`→` navigate, space/enter advance,
  `r` random, `h`/esc home (`docs/design-principles.md` §1.6). Automated:
  `c` opens choices + `1` selects, space reveals + `4` grades cold, `→`
  advances, `h` home.
- **Legacy migration**: a seeded `mcq:*` key is copied to `oksat:*` (now by
  `js/oksat-store.js`).
- The page mounts straight into the module — **no prompt of any kind**. The
  test seeds `oksat:reviewer` directly to pick a namespace.
- Concept deep link `&c=<key>` pre-filters (manual).

### Airway Rounds (`airway-jeopardy.html`)
- Boots with **zero external requests** (deliberately CDN-free — its CSP
  names no remote origin, so a regression is also a console error);
  `AIRWAY_DATA` loads. Smoke assertion: `window.AIRWAY_DATA.questions` is an
  array.

### CPT search (`cpt-search.html`)
- Boots with zero console errors; typing filters; clicking a result copies
  its code and flips the button to **Copied**; a query like
  `<img src=x onerror=…>` renders as text (results go through `esc()`).

### Wiki sync (`wiki/sync/sync-vault.mjs`)
`tools/test-wiki-sync.mjs` builds a synthetic vault in a temp dir and
asserts: dry run writes nothing; only allowlisted folders + `MOC.md` leave;
`data_sources/`, `_drafts/`, `_*`, dotfiles, governance docs, non-Markdown
files and symlinks never do; `## Personal Notes` is cut (fence-aware) and
`personal_status` dropped; stub/draft notes are gated; the PHI tripwire
holds a note (exit 2); links to unpublished notes are unlinked; unvetted
notes are tagged and bannered; it deletes only files it wrote and refuses
foreign folders and outputs inside the vault. The same suite checks
`wiki/dgmo/render-dgmo.mjs`'s fence transform with a stub renderer: good
fences become one-line light+dark figures, failed ones stay code, other
fences and prose are untouched, the source is escaped, and the chart title
is re-centered. A real Quartz/DGMO build is not part of CI (no build step
here); `wiki/README.md` records the last manual build check.

The suite also pins the phase-1 policy: only `tier: Master Map of Content`
notes publish, the root `MOC.md` does not, and every note ends with a
prefilled correction link whose URL survives parentheses.

It runs `wiki/feedback/pull-feedback.mjs` against a saved, deliberately
hostile issue list (no network) and checks that:

- a dry run writes nothing, and PRs and unlabelled issues are skipped;
- reader text containing its own fences, headings and "instructions" stays
  inside its fence;
- a `note` path-traversal or frontmatter-injection attempt is dropped;
- PHI trips the flag;
- an owner's resolution is never overwritten;
- `--closes` emits only resolved issues;
- the inbox never publishes.

Fig. 1 has no test; regenerate it with `python3 tools/gen-cochlea.py` and
look at it in both themes.

### Archive (`archive/`)
Not served, not smoke-tested, not checked by `tools/check-data.mjs`. The one
invariant worth asserting after touching it:

```bash
node -e "const g=require('./archive/kag-graph.json');
const ids=new Set(g.nodes.map(n=>n.id));
console.log('nodes',g.nodes.length,'edges',g.edges.length,
'dangling',g.edges.filter(e=>!ids.has(e.source)||!ids.has(e.target)).length)"
```

If `kag-graph.json` changes, regenerate `kag-graph-flat.txt` from it — never
edit the flat file directly.

### SSB knowledge graph (`ssb/content/`)

`node tools/ssb-content.mjs` (also run by `tools/check-data.mjs`). Checks:
required fields per entity type and the controlled vocabularies
(`docs/authoring-ssb.md` §5–§6); id format and global uniqueness; every
reference resolves — structured refs *and* inline `[[id]]` in text — with
the right target type; no HTML in text; and the review gate (an entity marked
`verified` must cite sources that are all `verified: true`). Drafting one
region file alone: `node tools/ssb-content.mjs --allow-dangling <file>`
turns unresolved refs into warnings.

What it cannot check: medical correctness and whether a source supports the
claim that cites it. That stays with the owner, who alone flips `review` to
`verified`.

### SSB page and variant lab (`ssb.html`)

Smoke boots `ssb.html` (graph mode + a WebGL frame; headless Chromium runs
software WebGL, flags in `tools/smoke-lib.mjs`), the hostile `#s=` payload,
and `#lab=frontal-recess` (a diorama builds). `tools/test-ssb.mjs` drives the
lab and reads the scene back through the read-only `window.__ssb.lab` hook
(part names, graph ids, hazards, RAS bounding boxes, the computed pathway,
a pixel where a click picks a given part). It pins:

- each diorama loads on its lesson's view (ethmoid roof coronal, frontal
  recess sagittal); every part is named `<graph id>.<side>` and its id and
  hazard ids resolve in the graph; the *schematic — idealized* badge shows;
- presets satisfy the graph's own criterion text (`c.keros`, `c.gera`) and
  preset codes are classes in the graph (`c.ifac`,
  `c.uncinate-superior-attachment`); buttons carry the class labels;
- ethmoid roof: Keros I→III raises each lateral lamella by exactly the
  preset difference, and the lamella meets the fovea; asymmetry shortens
  the left lamella; the AEA canal drops exactly as its parameter; a
  supraorbital cell drops it by `m.aea-mesentery-drop`'s mean;
- frontal recess, under uncinate attachments 1, 5 and 6: each anterior cell
  alone moves the computed pathway posteriorly and each suprabullar cell
  anteriorly (≥ 0.5 mm, mean over the recess and ostium), the frontal septal
  cell laterally at the ostium, the pathway runs anterior and medial to the
  supraorbital cell, and it drains medial to the uncinate into the middle
  meatus (1) or lateral into the infundibulum (5, 6); the same toggles
  through the UI checkboxes move it posterior vs anterior;
- clicking a part selects its entity (panel and URL follow); view buttons
  cut the camera without rebuilding; the desktop dock never covers the
  canvas and collapses to a rail; phones get the controls in the sheet with
  no horizontal scroll;
- a hostile `#lab=` is clamped, snapped or dropped, rewritten canonically,
  and never becomes markup; an unknown diorama leaves the specimen stage;
- reduced motion stops the particle animation and continuous rendering;
- the tissue-material library (`js/ssb/materials.js`, `docs/ssb.md` §7.4):
  its kind table matches the vocabulary in `docs/authoring-ssb.md` and every
  graph kind in use; every colour token it reads exists for both themes in
  `css/ssb.css`; nothing animates. Through `window.__ssb.materials` (read-only:
  quality, program and material counts, `probe(kind, hatched)` draws a
  sphere into a small target and returns the GL error and pixels), every
  kind, plain and hatched, compiles and draws without a WebGL error at
  `#q=full` and at `#q=lite`; programs are shared per kind (a selection adds
  materials, not programs); the `q` hash key picks the quality, switches it
  at runtime and rewrites the hash canonically, and a hostile `q` is ignored;
  the real lab renders non-blank under both, the hatched lateral lamella
  still shows dark stripes, picking still works, and reduced motion adds no
  animation. Software WebGL picks `lite` on its own, so the default runs
  exercise it and `q=full` is always explicit.

`node tools/test-ssb.mjs --shots <dir>` also writes desktop and phone
screenshots of each diorama for a visual check. Judging how a material
*looks* (pattern scale, sheen under the endoscope's spotlight) stays a human
check: render it in a scratch page that imports `materials.js` with a
spotlight and both themes, and compare `full` with `lite`.

## Adding a new page to the harness

Append an entry to `PAGES` in `tools/smoke-pages.mjs` with a `ready(page)`
that resolves when the page's core content exists (poll via
`page.waitForFunction`, don't sleep).
