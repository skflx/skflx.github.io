# Verification — how to prove a change works

Per subsystem: the exact probes that show a change is good. Most are now
automated (`tools/*.mjs`, run in CI by `.github/workflows/ci.yml`); this doc
is the spec they implement and the manual playbook for anything not yet
covered. Run the automated suite locally before pushing:

```bash
node tools/check-data.mjs                 # data invariants (deps-free, instant)
node tools/smoke-pages.mjs                # every page boots, zero real console errors
node tools/test-oksat-engine.mjs          # engine behavior (answer lock, SRS, keyboard)
```

The browser suites need a real Chromium (installed) and, for the OKSAT/graph
pages, network access to their CDN scripts (React/htm/Cytoscape). CI has both.
In a sandbox that blocks CDNs, those pages can't boot — that is the
environment, not a regression (see `docs/agent-native-plan.md`; issue #51
vendors the libs to remove the dependency).

## "Real" console error

Anything logged as `console.error` / `pageerror`, or a **same-origin**
`requestfailed`, that is **not** matched by `tools/console-allowlist.json`.
The allowlist holds only known-benign third-party noise (font/CDN network
resets). A first-party error is never allowlisted. The static test server
answers `/favicon.ico` with 204 so the site's missing favicon is not a
spurious 404.

## Playbooks by subsystem

### One-pager (`index.html`)
- Style switcher sets `html[data-style]` and persists `sk_style`; day/night
  sets `html[data-theme]` + `sk_theme`.
- `index.html#research` opens that `<details>` section; all four sections
  expand/collapse (native `<details>`).
- Smoke assertion: a `details.section` element exists.

### OKSAT hub (`oksat.html`)
- All modules in `OKSAT_MANIFEST` render as cards under `#modules`; each
  launches `oksat-study.html?m=<slug>`.
- Atlas card points at `graph.html?lens=study`; font picker flips `data-font`.
- Smoke assertion: `#modules` has ≥1 child.

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
- **Legacy migration**: a seeded `mcq:*` key is copied to `oksat:*`.
- Note: the page shows a blocking reviewer modal before mounting — drive it
  (`driveReviewerModal` in `tools/smoke-lib.mjs`).
- Concept deep link `&c=<key>` pre-filters (manual).

### Unified graph (`graph.html?lens=knowledge|structural|study`)
- Each lens renders > 0 nodes: the `#cy` container gains a `<canvas>` and the
  `#cy-empty` fallback is not shown (it hides via CSS `display:none`, **not**
  the `[hidden]` attribute — check computed visibility).
- `?node=<id>` focuses a node and opens the detail panel; the lens switcher
  preserves `?node=`; theme flip re-skins without errors (manual).
- Redirect stubs: `kag.html?node=X` → `graph.html?lens=knowledge&node=X`;
  `atlas.html` → `lens=structural`. Smoke asserts the forwarded params.

### Airway Rounds (`airway-jeopardy.html`)
- Boots with **zero external requests** (deliberately CDN-free); `AIRWAY_DATA`
  loads. Smoke assertion: `window.AIRWAY_DATA.questions` is an array.

### KAG data changes
- `node tools/kag-validate.mjs --dry` on the shard reports clean.
- `node tools/check-data.mjs` passes on the merged graph (ids unique+kebab,
  ≥1 source each, no dangling edges, enums valid, oksat links resolve).

### Legacy page (`cpt-search.html`)
- Boot with zero console errors — nothing more (frozen).

### Brand consistency (any visual change)

The site has one identity and one colour file. After touching styling:

1. `css/tokens.css` is linked **before** the page's own sheet on every page
   (`grep -L 'css/tokens.css' *.html` should list only redirect stubs).
2. No colour literal has crept back into a shipped sheet, page or script:
   ```bash
   grep -rnE "#[0-9A-Fa-f]{6}|rgba?\(" --include=*.css --include=*.html --include=*.js . \
     | grep -v node_modules | grep -v 'css/tokens.css'
   ```
   Hits are only acceptable inside redirect stubs (which are standalone by
   design), module `DOMAINS` data, and documented JS fallbacks.
3. Both themes on every page: flip the toggle and confirm nothing goes
   invisible — particularly panel edges, which carry the Lightbox lift.
4. If a categorical palette changed, re-run the validator (see
   `docs/ui-directions.md`) and confirm the second channel still exists —
   labels on chips and bars, shapes on graph node types.

## Adding a new page to the harness

Append an entry to `PAGES` in `tools/smoke-pages.mjs` with a `ready(page)`
that resolves when the page's core content exists (poll via
`page.waitForFunction`, don't sleep). If it redirects, mark `isStub: true` and
assert the destination + forwarded params with `stub(dest, params)`.
