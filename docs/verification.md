# Verification — how to prove a change works

Per subsystem: the exact probes that show a change is good. Most are
automated (`tools/*.mjs`, run in CI by `.github/workflows/ci.yml`); this doc
is the spec they implement and the manual playbook for anything not yet
covered. Run the automated suite locally before pushing:

```bash
node tools/check-data.mjs                 # data invariants (deps-free, instant)
node tools/smoke-pages.mjs                # every page boots, zero real console errors
node tools/test-oksat-engine.mjs          # engine behavior (answer lock, SRS, keyboard)
```

The browser suites need a real Chromium (installed) and, for `oksat.html`'s
sibling `oksat-study.html`, network access to the React/htm CDN. CI has both.
In a sandbox that blocks CDNs the study viewer cannot boot — that is the
environment, not a regression. Confirm which it is by running the same page
from `master` in a worktree; an identical failure means the sandbox. To test
the page's own wiring without the CDN, intercept the `unpkg.com` requests and
stub `js/oksat-engine.js` with a probe that records what `mountOKSAT` was
called with. Every other page is CDN-independent for boot purposes and runs
anywhere.

## "Real" console error

Anything logged as `console.error` / `pageerror`, or a **same-origin**
`requestfailed`, that is **not** matched by `tools/console-allowlist.json`.
The allowlist holds only known-benign third-party noise (font/CDN network
resets). A first-party error is never allowlisted — a same-origin 404 is how
this harness catches a script tag left pointing at a deleted file. The static
test server answers `/favicon.ico` with 204 so the site's missing favicon is
not a spurious 404.

## Playbooks by subsystem

### One-pager (`index.html`)
- Style switcher sets `html[data-style]` and persists `sk_style`; day/night
  sets `html[data-theme]` + `sk_theme`.
- `index.html#research` opens that `<details>` section; all four sections
  expand/collapse (native `<details>`).
- `#pgy-status` renders the current residency year. The HTML ships the
  current value as a no-JS fallback, so **both** must be updated together if
  either is ever edited by hand. Check the rollover directly rather than
  waiting for July:
  ```bash
  node -e "const f=(d)=>{const n=new Date(d);const y=n.getFullYear()-(n.getMonth()<6?1:0);
  return Math.max(1,Math.min(5,y-2024+1))};
  ['2026-06-30','2026-07-01','2029-07-01'].forEach(d=>console.log(d,'PGY-'+f(d)))"
  ```
- Smoke assertion: a `details.section` element exists.

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
- **First-attempt lock**: first selection records in
  `oksat:progress:<slug>:<rev>` and disables the options; a later click does
  not change it; it survives reload. (Answers lock on first attempt — no
  re-answering to game the score.)
- **SRS write**: `oksat:srs:<slug>:<rev>` gains an item with Leitner `box`
  1–5 and a `nextReview` date.
- **Keyboard**: `1`–`9`/`a`–`d` select options, `1`–`4` self-grade recall,
  `←`/`→` navigate, space/enter advance, `r` random, `h`/esc home
  (`docs/design-principles.md` §1.5). Automated: `1` selects, `→` advances,
  `h` home.
- **Legacy migration**: a seeded `mcq:*` key is copied to `oksat:*` (now by
  `js/oksat-store.js`).
- The page mounts straight into the module — **no prompt of any kind**. The
  test seeds `oksat:reviewer` directly to pick a namespace.
- Concept deep link `&c=<key>` pre-filters (manual).

### Airway Rounds (`airway-jeopardy.html`)
- Boots with **zero external requests** (deliberately CDN-free); `AIRWAY_DATA`
  loads. Smoke assertion: `window.AIRWAY_DATA.questions` is an array.

### CPT search (`cpt-search.html`)
- Boots with zero console errors and the search field filters — nothing more
  (frozen; still consumes `css/main.css` tokens).

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
