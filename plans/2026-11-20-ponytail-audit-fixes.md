# Spec: Ponytail Audit Fixes (2026-11-20)

## 0. Context (facts, read from the repo on 2026-11-20)

- `/ponytail-debt` found **0** `shortcut:` / `ponytail:` markers (clean ledger).
- `/ponytail-audit` identified 11 concrete findings across OKSAT (`js/oksat/`), the PDF chapter splitter (`js/pdf-chapter-splitter.js`), CPT search (`js/cpt-search.js`), and the command palette (`js/palette.js` + `tools/stamp-assets.mjs`).
- All 11 findings are mechanical JS/tooling/test fixes requiring zero clinical or anatomical judgment.
- Every finding is split into 4 independent Work Packages with non-overlapping code/test `Touch` lists so they can execute in parallel, followed by a single `node tools/stamp-assets.mjs` pass and full verification.

## 1. Owner decisions (approved 2026-11-20)

1. **Scope:** Fix all 11 audit findings across 4 WPs (Must fix #1–#5, Should fix #6–#8, Nice to have #9–#11).
2. **OKSAT date contract:** Switch `today()` and `addDays(iso, n)` to **local calendar dates** (`YYYY-MM-DD` in the user's browser timezone), keeping the exact same `YYYY-MM-DD` storage format so existing `oksat:srs:*` and `oksat:cmastery:*` records require no migration.
3. **Storage & security invariants unchanged:** Every page keeps `script-src 'self'`, no inline scripts, no `on*=` handlers, no new external dependencies, and all `localStorage` access remains guarded.

## 2. Work Packages

### WP-1 — OKSAT local-date SRS, hub guide Resume, and mount-write guard
- **Findings:** #1 (UTC+1 SRS bug), #2 (hub Resume drops guides), #8a–b (regression tests), #11 (mount write)
- **Model:** `hydrogen`
- **Depends:** none
- **Read:** `js/oksat/store.js`, `js/oksat/engine.js` (L43–55, L148–158), `js/oksat/hub.js` (L20–30, L144–174), `tools/test-oksat-engine.mjs`, `tools/test-oksat-learn.mjs`
- **Touch:** `js/oksat/store.js`, `js/oksat/engine.js`, `js/oksat/hub.js`, `tools/test-oksat-engine.mjs`, `tools/test-oksat-learn.mjs`
- **Don't:** Do not change storage key names or schemas, do not let guides write module progress/SRS, do not touch `js/oksat/manifest.js` or module data files.
- **Steps:**
  1. In `js/oksat/store.js`:
     - Add `localDate(d)` returning local `YYYY-MM-DD` (`getFullYear()`, `String(getMonth() + 1).padStart(2, '0')`, `String(getDate()).padStart(2, '0')`), and `addDays(iso, n)` parsing `YYYY-MM-DD` via `iso.split('-').map(Number)` and constructing `new Date(y, m - 1, day + n)` then formatting via `localDate`.
     - Replace `var today = ...` with `function today() { return localDate(); }`.
     - Export `today` and `addDays` on `window.OKSATStore`.
     - In `getLearn(slug, who)`, include `updated: rec.updated || ''` in the returned object.
  2. In `js/oksat/engine.js`:
     - Replace local `today` and `addDays` (L47–52) with `OKSATStore.today` and `OKSATStore.addDays`.
     - Guard the two persistence `useEffect`s (L152–153) with separate `didMount` refs (`progMountedRef`, `srsMountedRef`) so initial mount does not write empty records or bump `updated` on untouched modules.
  3. In `js/oksat/hub.js`:
     - Replace `var today = new Date().toISOString().split('T')[0];` (L24) with `var today = OKSATStore.today();`.
  4. In `tools/test-oksat-engine.mjs`:
     - Add a regression check verifying `OKSATStore.addDays(OKSATStore.today(), 1) > OKSATStore.today()` and that answering a question wrong (Box 1) still shows locked feedback (does not immediately become due) even when run under `TZ=Europe/Berlin`.
  5. In `tools/test-oksat-learn.mjs`:
     - Add a regression check verifying that after marking a section done in an interactive guide, visiting `oksat.html` shows `#resume` (not hidden) pointing to `oksat-learn.html?g=...`.
- **Accept:**
  - `TZ=Europe/Berlin node tools/test-oksat-engine.mjs` passes
  - `node tools/test-oksat-learn.mjs` passes
- **Escalate:** If any existing test relies on initial-mount `localStorage` writes on `oksat-study.html`, stop and report.

### WP-2 — PDF splitter interval guard, Safari/Firefox blob download, RAM cleanup, and duplicate style
- **Findings:** #3 (negative interval infinite loop), #4 (sync `revokeObjectURL`), #7 (dead `rawPdfBytes`), #8c (smoke check), #9 (duplicate `style` attr)
- **Model:** `hydrogen`
- **Depends:** none
- **Read:** `js/pdf-chapter-splitter.js`, `tools/smoke-pages.mjs` (L130–145)
- **Touch:** `js/pdf-chapter-splitter.js`, `tools/smoke-pages.mjs`
- **Don't:** Do not add any external dependency or inline script; do not break offline operation.
- **Steps:**
  1. Delete unused `rawPdfBytes` (declaration, assignment on upload, reset clear).
  2. In `generateFixedIntervals(total, interval)`, guard `if (!(interval >= 1)) interval = 1;`, and at the call site in `applyStrategy()`, clamp `const interval = Math.max(1, parseInt(intervalInput.value, 10) || 10);`.
  3. Add a `downloadBlob(blob, filename)` helper that creates an `<a>`, appends it to `document.body`, clicks it, removes it, and revokes the object URL inside `setTimeout(() => URL.revokeObjectURL(url), 1000)`. Use it in both `exportSingleChapter` and the batch ZIP handler.
  4. Fix the duplicate `style` attribute on the row-number `<td>` in `renderTable()` to `<td class="mono" style="text-align: center; color: var(--ink-muted);">`.
  5. In `tools/smoke-pages.mjs` for `pdf-chapter-splitter.html`, extend the readiness check to exercise `generateFixedIntervals(10, -5)` (verifies it terminates and returns valid 1-page parts instead of looping) and verify a synthetic 3-page PDF built with `PDFLib.PDFDocument.create()` can be loaded into `handleUploadedFile` and rendered in the table.
- **Accept:**
  - `node tools/smoke-pages.mjs --page pdf-chapter-splitter.html` passes
- **Escalate:** If `handleUploadedFile` or `generateFixedIntervals` is not reachable from the smoke check without exporting, keep the script clean and exercise via DOM inputs (`#pdfFileInput` + `#intervalInput`).

### WP-3 — CPT clipboard fallback guard and analytics cap
- **Findings:** #5 (`navigator.clipboard` crash), #8c (regression test), #10 (unbounded `cpt-analytics` + unescaped `t.count`)
- **Model:** `hydrogen`
- **Depends:** none
- **Read:** `js/cpt-search.js`, `tools/test-search.mjs`
- **Touch:** `js/cpt-search.js`, `tools/test-search.mjs`
- **Don't:** Do not change `localStorage` keys (`cpt-history`, `cpt-analytics`); do not touch `js/cpt-data.js`.
- **Steps:**
  1. In `js/cpt-search.js`, extract a `fallbackCopy(code)` helper and guard `copyCode(code, desc)` with `if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).catch(function () { fallbackCopy(code); }); } else { fallbackCopy(code); }`.
  2. In `saveSearch(term, code)`, cap `analytics` to at most 100 keys (keeping the highest counts) before writing to `localStorage`.
  3. In `renderHistPanel()`, escape `t.count` with `esc(t.count)`.
  4. In `tools/test-search.mjs`, add a check on `cpt-search.html` where `navigator.clipboard` is removed/undefined before clicking a result card, verifying zero console/page errors and that the button text transitions to `Copied`.
- **Accept:**
  - `node tools/test-search.mjs` passes
- **Escalate:** None expected.

### WP-4 — Command palette asset stamps for `manifest.js` and `cpt-data.js`
- **Findings:** #6 (unstamped dynamic script loads in `js/palette.js`)
- **Model:** `hydrogen`
- **Depends:** none
- **Read:** `js/palette.js` (L75–135), `tools/stamp-assets.mjs` (L197–253), `tools/check-data.mjs` (L860–880)
- **Touch:** `js/palette.js`, `tools/stamp-assets.mjs`, `tools/check-data.mjs`
- **Don't:** Do not change `js/palette.js`'s lazy-loading behavior (still loads nothing until the first `Cmd/Ctrl-K` press).
- **Steps:**
  1. In `js/palette.js`, add two stamp constants:
     - `var MANIFEST_V = '<hash>'; /* stamp:js/oksat/manifest.js */`
     - `var CPT_V = '<hash>'; /* stamp:js/cpt-data.js */`
     and load `'js/oksat/manifest.js?v=' + MANIFEST_V` and `'js/cpt-data.js?v=' + CPT_V` in `loadOksat()` / `loadCpt()`.
  2. In `tools/stamp-assets.mjs`, extend `stampPalette({ write })` (or add a small helper called right before stamping `PALETTE_V` in `js/site.js`, since rewriting `js/palette.js` changes `palette.js`'s hash!) to stamp both `MANIFEST_V` and `CPT_V` in `js/palette.js`, then stamp `PALETTE_V` in `js/site.js`.
  3. In `tools/check-data.mjs`, ensure the `stampPalette()` check reports both `js/palette.js` and `js/site.js` stamps.
- **Accept:**
  - `node tools/stamp-assets.mjs && node tools/stamp-assets.mjs --check` passes
  - `node tools/check-data.mjs` passes
  - `node tools/test-palette.mjs` passes
- **Escalate:** If `tools/test-palette.mjs` routes or asserts exact script URLs without `?v=`, check and report before weakening any test.

## 3. Integration & Final Verification (after WP-1..WP-4)

1. Run `node tools/stamp-assets.mjs` once across the repo so every `?v=` stamp in `js/palette.js`, `js/site.js`, and root `*.html` is synchronized.
2. Run verification:
   - `node tools/check-data.mjs`
   - `node tools/lint-oksat.mjs`
   - `node tools/lint-oksat-guide.mjs`
   - `TZ=Europe/Berlin node tools/test-oksat-engine.mjs`
   - `node tools/test-oksat-learn.mjs`
   - `node tools/test-search.mjs`
   - `node tools/test-palette.mjs`
   - `node tools/smoke-pages.mjs --page pdf-chapter-splitter.html`
   - `node tools/smoke-pages.mjs --page cpt-search.html`
   - `node tools/smoke-pages.mjs --page oksat.html`
   - `node tools/smoke-pages.mjs --page oksat-study.html`
3. Documentation second pass (`AGENTS.md`): confirm no stale facts, all backticked paths exist, and update `plans/README.md`.
