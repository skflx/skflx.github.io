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
`<link>`/`<script>`/`<img>` at all. Smoke additionally loads
`oksat-study.html?m=<img onerror…>` and asserts the payload renders as text.

### One-pager (`index.html`)
- Day/night toggle (`.site-theme-toggle`, `js/site.js`) flips
  `html[data-theme]` and persists `sk_theme`; `js/theme-boot.js` applies it
  before paint.
- All sections are open; the topbar links (`#about`, `#tools`, `#work`,
  `#research`, `#beyond`) are plain anchors, and the one in view gets
  `aria-current` (scroll-spy in `js/onepager.js`).
- No horizontal scroll at 390px wide; the cochlea figure (Fig. 1) is static
  SVG and renders without JS.
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

## Adding a new page to the harness

Append an entry to `PAGES` in `tools/smoke-pages.mjs` with a `ready(page)`
that resolves when the page's core content exists (poll via
`page.waitForFunction`, don't sleep).
