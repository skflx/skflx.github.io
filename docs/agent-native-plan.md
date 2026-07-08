# Agent-native architecture plan

Goal: a coding agent should be able to take a user bug report or a roadmap
feature and reproduce → implement → test → verify it on the real site with
minimal human input. This document is the audit behind GitHub issues
**#42–#61** (five epics, fifteen atomic sub-issues, each written to be
executable by a low-context agent from its body alone). Audit date:
2026-07-08, at 771 nodes / 1,221 edges in `data/kag-graph.json`.

## 1. Human-judgment chokepoints

| Chokepoint today | Codifiable? | Where it lands |
|---|---|---|
| "Did my change break anything?" — owner loads pages and eyeballs the console | Yes — automated checks + written playbooks | #46 (CI harness), #44 (`docs/verification.md`) |
| Which chrome a new page uses (`site.css` vs legacy `main.css` vs self-contained) | Yes — precedent is consistent, just unwritten | #43 (`docs/decisions.md`) |
| Renaming a page (redirect-stub convention exists only as precedent) | Yes | #43 |
| New module hue / subspecialty assignment | Yes — `OKSAT_SUBSPECIALTIES` is already the table; the *rule* to use it is unwritten | #43 |
| localStorage key naming + who owns which key | Yes — registry table | #43 |
| What counts as a "real" console error | Yes — explicit allowlist file | #47 (`tools/console-allowlist.json`) |
| WIP.md / plan-doc governance | Mostly written already; consolidate | #43 |
| Clinical vetting (`review:true`), medical correctness, new subspecialties, deleting shipped URLs, merging to `master` | **No — irreducibly the owner's.** But the *boundary* is codifiable as an escalation table so agents know exactly when to stop | #43 (escalation table) |

The pattern: almost every chokepoint is procedural, not judgmental. The only
genuinely human calls are clinical content vetting and production merges —
everything else is precedent that was never written down.

## 2. Verification gaps by subsystem

| Subsystem | What exists | What's missing | Issue |
|---|---|---|---|
| Committed data (graph, manifest↔modules, airway bank, oksat-db) | `tools/kag-validate.mjs` checks *shards at merge time only*; nothing re-checks committed files | Pure-Node invariant checker (dupes, dangling edges, sources, enums, `count === ITEMS.length`, orphan modules, answer-index ranges) | #48 |
| Every page boot | Manual | Headless-Chromium smoke: zero non-allowlisted console errors + per-page readiness assertions + redirect-stub param forwarding (real browser required — Cytoscape needs canvas, jsdom can't) | #47 |
| OKSAT engine | Nothing | Behavior tests for the product invariants: first-attempt lock, SRS key writes, keyboard matrix, sparse-module tolerance, `mcq:*` migration | #50 |
| KAG store | Nothing | Node unit tests over `merge`/`audit`/`reverseConcept` + defensive contract, loaded via the validator's `new Function('window', src)` trick | #58 |
| Sync/push paths (Contents API) | Nothing | Deferred — testable later via Playwright route interception; low frequency, owner-driven |
| CI | None | GitHub Action running all of the above on PRs (CI is verification, not a build step — the no-build rule survives) | #49 |

## 3. Reproduction paths

A typical report ("my progress disappeared", "graph blank on my iPad",
"module shows the wrong answer") is unreproducible today because all client
state is localStorage and there is no way to hand it over or load it back.
Three missing pieces:

1. **Diagnostic bundle exporter** — `js/diag.js` + a chrome button: all
   `sk_*` / `oksat:*` / `kag-graph` entries, page, UA, data-version stamps,
   with a credential deny-list (`oksat:gemini-*` etc.) as a hard requirement
   (#55).
2. **Replay harness** — `tools/repro.mjs` seeds a bundle's localStorage into
   a fresh Playwright context and opens the bundle's page: one command from
   pasted bundle to the user's exact failing state (#56).
3. **Canned fixtures** — fresh visitor, legacy `mcq:*` user, mid-progress
   reviewer, corrupted-JSON key — reusable by the behavior tests (#56).

Server state needs nothing new: it's in git; the bundle's data-version stamp
plus `git checkout` reproduces any historical pairing.

## 4. Structural obstacles

- **`js/kag-store.js` entangles user progress with canonical content** — the
  one real boundary violation, and it causes a shipped bug: whole-node
  LOCAL-WINS merge means content edits and `review:true` graduations never
  reach a browser that already holds the node (`kag-store.js:96-109`).
  Boundary: local storage holds only a `nodeId → {leitner, corrections}`
  overlay; content always comes from the file (epic #57).
- **`js/oksat-engine.js` (674 lines, closure-private `ItemView`)** — correct
  boundary already chosen and documented ("copy patterns, never export").
  Don't split it; wrap it in behavior tests (#50) so agents can modify it
  with a safety net instead of reading the whole file defensively.
- **Large inline scripts in HTML** (`airway-jeopardy.html` ~72 KB,
  `kag-extract.html` ~35 KB, `oksat.html` ~27 KB) — untestable as units.
  Don't refactor speculatively; convention going forward (#43): new inline
  scripts over ~50 lines start life in `js/<page>.js` (the airway
  engine/questions split is the precedent).
- **Window-global load-order coupling** (store before engine, manifest before
  hub, layout-base before cose-bilkent) — implicit today; smoke tests (#47)
  catch violations mechanically, `docs/decisions.md` states the orders.
- **Graph lens contract** — already well documented in the `graph-view.js`
  header; needs only a pointer from the docs index. Not an obstacle.
- **Duplicated storage helpers kept as regression surface** — intentional and
  documented; not an obstacle.

## 5. Prioritized plan (human-attention-saved per unit effort)

| Rank | Epic | Effort | Attention saved | Why this rank |
|---|---|---|---|---|
| 1 | #42 Conventions pack (decision tables, playbooks, CLAUDE.md) | ~½ day | Every future "which file / how do I verify / may I do this" round-trip | Best ratio; pure docs; multiplies every other epic |
| 2 | #46 CI verification harness | ~2–3 days | All manual page-eyeballing, forever; agents self-verify | Biggest absolute save; the keystone for autonomy |
| 3 | #51 Vendor CDN deps + guard | ~½ day | Outage debugging; deterministic offline tests | Cheap; hard prerequisite for reliable CI |
| 4 | #54 Diagnostics + replay | ~1 day | The entire bug-report back-and-forth loop | High save whenever real users hit real bugs |
| 5 | #57 KAG progress/content split | ~1–2 days | Future silent-staleness debugging; unblocks sync | Lowest ratio but the only item fixing a **shipped defect** — jumps to rank 1 the moment content curation resumes |

Suggested execution order differs slightly from rank: #42 → #48 → #47 → #49
(green CI exists) → #52/#53 → #58 → #59 → #55/#56 → #50 → #60 → #61 —
tests-before-refactor, guards-after-vendoring.

Each top-5 item is fully specified in its epic + sub-issues (#42–#61); the
issue bodies are self-contained (repo primer, exact files, steps, acceptance
criteria, verification commands) so a low-context agent can start from the
issue alone.

## Explicitly rejected

- **Firebase/Firestore as source of truth** — solves quota/traffic problems
  this site doesn't have, and destroys the git-based review pipeline
  (validator, shards, PR diffs, `review:true` gating, provenance) that is the
  repo's core safety mechanism for medical content.
- **IndexedDB migration** — the quota pressure it addresses disappears
  entirely once #57 stops persisting the full graph locally. Revisit only if
  a future local dataset genuinely exceeds a few MB.
- **Splitting `oksat-engine.js`** — behavior tests give the safety without
  the churn; the closure-private design is a feature.
- **Precomputed graph layout** — the real next scaling wall (cose-bilkent in
  the browser at 3–5k+ nodes), but not yet. When the term web approaches that
  size, compute layout positions at merge time in the validator and ship them
  in the JSON.
