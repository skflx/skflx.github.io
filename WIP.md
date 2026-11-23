# WIP

## 2026-11-23 — Issues #331 (I1.1) and #332 (I1.2)
- Fast-forwarded local `master` to `origin/master` (`fb40313`, which landed I0.1 `plans/2026-11-23-iac-anatomy-guide.md`).
- **I1.2 (#332)** on branch `claude/i1.2-skoto-notes` (`b8dc341`):
  - Created `tools/skoto-notes.mjs` to list `content/**/*.md` from `skflx/ohns-wiki-skflx` (local clone path arg, else `gh api`, else GitHub REST API) and write sorted `{ generated, notes }` to `tools/skoto-notes.json`.
  - Generated `tools/skoto-notes.json` (1052 notes).
  - Added `guideRefProblems` in `tools/check-data.mjs` (rejects unknown refs, chapter-level `ref`, and duplicate refs within a section; in-memory self-tests added in `checkBlockValidators`).
  - Documented the refresh command in `docs/verification.md`.
  - Verified `node tools/check-data.mjs`: 180/180 checks passed.
- **I1.1 (#331)** on branch `claude/i1.1-ref-renderer`:
  - Ported Quartz `slugifyFilePath` / `slugifyPath` (`skotoSlug`) into `js/oksat/learn.js` and verified 3 live wiki notes return HTTP 200.
  - Added `relatedSkoto(ch)` in `js/oksat/learn.js` rendering a chapter-foot **Related in sk.oto** section in first-cited order with citing section numbers, `rel="noopener"`, and `textContent` only (hidden when `OKSAT_SKOTO.live` is false or no section cites a note).
  - Styled `.lr-related*` in `css/oksat-learn.css`.
  - Added cases 11a–11c in `tools/test-oksat-learn.mjs` and documented `ref` in `docs/authoring-oksat-guide.md`.
  - Ran `node tools/stamp-assets.mjs` (updated `oksat-learn.html`) and `node tools/check-data.mjs`: 179/179 checks passed.
  - Note: `playwright` is not installed locally (`node_modules` absent), so `test-oksat-learn.mjs` and `smoke-pages.mjs` were not executed locally.
