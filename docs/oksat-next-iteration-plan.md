# OKSAT Next Iteration — Adaptive Platform Plan (v2)

> **Status: largely executed** — `oksat-adaptive.html`, `js/oksat-store.js`,
> `js/oksat-dashboard.js`, `js/oksat-taxonomy.js`, and
> `js/oksat-concept-graph.js` shipped. Historical planning record; where this
> document and the code disagree, the code and `CLAUDE.md` win. Its
> engineering constraints (never export `ItemView`; keep legacy storage
> helpers; `OKSATStore` for all new persistence) remain binding and are
> restated in `CLAUDE.md`.

*Re-grounds the "OHNS Adaptive Study Platform" plan (2026-06-03, artifact-era) onto the real OKSAT build (static GitHub Pages, no build step). Plan only — granular, with contingencies, written for less-capable executor models.*

---

## 1. Context

The user supplied an engineering plan written for a Claude.ai artifact runtime (`window.storage`, Claude API, single-file React artifact). Since that plan was written, the repo evolved past its baseline: the "MCQ study guide" became **OKSAT** (see `docs/oksat-plan.md`), which already implements — differently — much of the supplied plan's Phases 1–2, and explicitly deferred (§8) exactly what the supplied plan targets: adaptive generation, confidence tagging, and cross-module concept intelligence.

**Goal of this iteration:** deliver the supplied plan's *principles* on OKSAT's *actual architecture*, without breaking anything that works.

### Decisions already made (user-confirmed — do not revisit)
1. **AI provider: Gemini.** Reuse `js/oksat-ai.js` (key mgmt, HOUSE_STYLE, JSON+retry) for runtime single-question generation. No Claude API, no provider adapter.
2. **Spaced repetition: keep item-level day-based Leitner untouched** (`oksat:srs:*`, intervals `{1:1,2:3,3:7,4:14,5:30}` days). **Add** a concept-mastery layer on top for dashboards, adaptive targeting, and the cross-module graph. Session counter is for analytics only, never scheduling.
3. **Scope: full roadmap** (confidence, distractor autopsy, taxonomy + gap topics, dashboard, adaptive generation, hybrid grounding, concept graph, starred export), phased with runnable checkpoints.

## 2. Current Build — Verified Inventory (synthesis)

| Area | State | Anchor |
|---|---|---|
| Engine | React 18 UMD + htm, no build step. `StudyViewer` (all state) + `HomeView` + `ItemView` in one IIFE; mounts via `window.mountOKSAT(root, module, entry, code)` | `js/oksat-engine.js:89,292,425,594` |
| Persistence | `oksat:progress:<slug>:<code>` `{v:1,answers,firstCorrect,updated}`; `oksat:srs:<slug>:<code>` `{v:1,items:{qId:{box,nextReview}},updated}`; hydrated in `useState` initializers, written back in `useEffect` | `oksat-engine.js:108-134` |
| Leitner | Per-ITEM, 5 boxes, day intervals 1/3/7/14/30; correct→+1 box, wrong→box 1; recall 4-tier self-grade can jump boxes; due = `nextReview <= today` | `oksat-engine.js:46,57-62,136-166` |
| Study modes | Sequential, Review-due, Random, Concept-filter (via `?c=` deep link). No adaptive/stress/mixed/gap modes | `oksat-engine.js:186-201` |
| Item schema | `id,type(mcq\|recall),stem,section,concepts[],options[{id,text}],correct,answer,brief,detailed`; engine also reads `difficulty`/`reference` (dead — no module uses them). `distractorNotes` does not exist. `ITEMS ?? QUESTIONS` fallback | `oksat-engine.js:98-106,451` |
| Modules | 5 banks: pediatrics(40 mcq), vestibular-schwannoma(46), ta-tubes(54), facial-reanimation(42), dtc-risk-stratification(25 recall). Register `window.__MCQ_MODULE={meta,DOMAINS,CONCEPTS,ITEMS}`; homogeneous schema | `js/mcq-modules/*` |
| Hub | `oksat.html`: Modules tab (cards + per-module due badges) + Atlas tab (Cytoscape: subspecialty→module→domain→concept, per-reviewer completion color, `?m=&c=` deep links, KAG crossover). Settings modal: reviewer, Gemini key, DB sync, per-reviewer reset. **No dashboard/analytics view** | `oksat.html`, `js/oksat-atlas.js:75-138` |
| Taxonomy | 9 subspecialties (`OKSAT_SUBSPECIALTIES` with hues) but **no topic tree, no gap topics** — manifest is a flat module list | `js/oksat-manifest.js:17-80` |
| AI | Gemini via `js/oksat-ai.js` (`oksat:gemini-key` localStorage-only; models 2.5-flash/pro/2.0-flash; HOUSE_STYLE system prompt mechanism→application→pearl; `generateModule` + `validateModule`, 1 retry on parse fail). **Offline Forge authoring only — no runtime generation** | `js/oksat-ai.js:13-202` |
| DB sync | `data/oksat-db.json` `{version:1,updated,reviewers:{code:{modules:{slug:{answered,correct,total,updated}},log[≤400]}}}`; merge rule "more answered wins, tie→later date"; download-to-commit or GitHub Contents API push (token never persisted) | `js/oksat-db.js:24-153` |
| Identity | Reviewer codes, Levenshtein typo failsafe, all progress keys suffixed `:<code>`; `mcq:*→oksat:*` one-time migration | `js/oksat-reviewer.js` |
| Design | Token-driven `css/oksat.css` (`--ok-*`), light/dark (`sk_theme`), 4 font themes (`oksat:font`), sage/rust feedback, keyboard-first | `css/oksat.css:21-59` |
| Storage helpers | Ad-hoc `load/save` pairs duplicated in engine, reviewer, prefs, db — no unified adapter | `oksat-engine.js:78-84` |

## 3. Gap Analysis — supplied plan vs current build

| Supplied-plan principle | Current status | This iteration |
|---|---|---|
| StorageAdapter abstraction | Duplicated ad-hoc helpers | **Build** `js/oksat-store.js` (localStorage only) |
| Persistent Leitner | ✅ exists (per-item, days) | Keep; **add concept-mastery layer** |
| Session model | ❌ none | **Add** analytics-only session counter (30-min gap) |
| Confidence calibration | ❌ deferred in oksat-plan §8 | **Build** (MCQ confidence pills + per-concept calibration) |
| Distractor autopsy | ❌ `distractorNotes` nonexistent | **Build** (engine + Forge house style) |
| Unified taxonomy (~60 topics, gap flags) | ❌ flat manifest | **Build** `js/oksat-taxonomy.js` (draft list flagged for clinical review) |
| Global dashboard (radar/weak/coverage/calibration) | ❌ none | **Build** hub Dashboard tab (lightweight SVG, no recharts) |
| Runtime adaptive generation | ❌ Forge is offline-only | **Build** on Gemini (`generateQuestion` + normalization + AdaptiveQuiz surface) |
| Adaptive difficulty controller | ❌ `difficulty` field dead | **Build** rolling-accuracy controller |
| Short-answer AI grading | ❌ (recall is self-graded) | **Build** optional Gemini grading for generated recall items |
| Hybrid grounding (static→adaptive) | ❌ | **Build** (detailed-text excerpts → prompt) |
| Cross-module concept graph | ❌ (Atlas visualizes, no credit propagation) | **Build** `CONCEPT_GRAPH` + box-boost propagation |
| Starred questions → draft module export | ❌ | **Build** (reuse Forge download path) |
| Dark mode / design tokens / first-attempt locking / concept chips / keyboard nav | ✅ already better than plan baseline | Keep untouched |
| Multi-reviewer identity + shared DB sync | ✅ exists (plan never had this) | Extend minimally (version-safe) |

### What is intentionally NOT adopted from the supplied plan
- `window.storage` / artifact single-file build → localStorage only; multi-file no-build stays.
- Claude API (`claude-sonnet-4-20250514` fetch) → Gemini per user decision.
- Session-unit Leitner intervals → days stay (real user data exists in `oksat:srs:*`).
- Replacing the hub with a "TaxonomyShell" React root → the vanilla hub stays; taxonomy augments it.
- Recharts → no build step / no new heavy deps; hand-rolled SVG.

---

## 4. Architectural Decisions (made once — do not revisit during execution)

**D1 — Adaptive practice is a NEW page (`oksat-adaptive.html` + `js/oksat-adaptive.js`), not a mode of `oksat-study.html`.**
`oksat-study.html` hard-requires `?m=<slug>` and injects exactly one module script; `StudyViewer` is built around a fixed `ITEMS` array, per-item SRS keys, and first-attempt locking. Generated items are transient (no stable ids, must never enter `oksat:srs:*`) and need loading/error/one-in-flight machinery the study engine shouldn't carry. A separate page keeps regression risk on the 5 shipping modules near zero. The adaptive page reuses the React UMD + htm shell, CSS tokens, and *copies* the option-button rendering pattern from `ItemView` (`js/oksat-engine.js:479-499`) — **never** try to export/import `ItemView` (it is closure-private and prop-coupled).

**D2 — Dashboard charts are hand-rolled inline SVG in vanilla JS (`js/oksat-dashboard.js`), no React, no recharts.**
SVG `fill`/`stroke` can be literal `var(--ok-*)` strings, so day/night re-colors charts with zero JS. Horizontal **bar rows** for subspecialty accuracy (not a radar — 9 spokes with sparse data mislead; bars degrade gracefully), a **cell grid** for coverage, **stacked bars** for calibration.

**D3 — Dashboard lives as a third hub tab ("Progress")** in `oksat.html`, lazy-booted exactly like the Atlas tab.

**D4 — Item-level Leitner untouched.** `LEITNER_INTERVALS`, `recordAnswer`, `dueIds` (`js/oksat-engine.js:46,136-139,153-166`) keep scheduling. The concept-mastery layer is written *alongside* on each answer into new keys — purely analytic (dashboard, adaptive targeting, propagation). Nothing reads concept boxes to schedule reviews.

**D5 — All NEW storage goes through one new `js/oksat-store.js` (`window.OKSATStore`).** Existing modules keep their duplicated `load/save` helpers (do not rip them out — regression surface). The engine's helpers (`oksat-engine.js:78-84`) get a one-line delegation with the current inline body kept verbatim as fallback.

**Executor ground rules (read before every phase):**
- Line numbers in this plan are *anchors*, not gospel. Always locate the quoted code first (grep for the snippet); if it moved, edit where the code actually is. If a quoted snippet cannot be found at all, STOP and re-read the file — do not guess.
- No build step. New JS files are IIFEs exposing `window.*` globals, matching existing style. No imports, no JSX, no npm deps.
- Every consumer of a new global guards with `window.X && ...` so a missing/misordered script degrades to today's behavior instead of erroring.
- All new UI consumes `css/oksat.css` tokens (`--ok-*`) only; no hardcoded colors.
- All 5 modules in `js/mcq-modules/` must remain byte-identical (temporary *local* edits for testing are fine; revert before commit).
- One commit per phase on branch `claude/ohns-platform-plan-pz86rq`, each ending with the phase's verification checklist passing via `python3 -m http.server 8000`.

## 5. Storage Schema (exact keys and shapes)

All keys end `:<reviewer>` (normalized per `normCode`, `oksat-engine.js:75`). All values JSON with a `v` field; all reads/writes fail-safe try/catch.

| Key | Shape | Writer |
|---|---|---|
| `oksat:session:<reviewer>` | `{v:1, n:int≥1, last:epoch-ms, updated:ISO}` | `OKSATStore.touchSession` — if `now-last > 30*60*1000` then `n++`; always `last=now`; returns `n`. Analytics only, never scheduling. |
| `oksat:cmastery:<slug>:<reviewer>` | `{v:1, concepts:{<key>:{box:1-5, seen:int, correct:int, lapses:int, boosted:int, last:"YYYY-MM-DD"}}, updated}` | `recordConceptResult(slug, reviewer, conceptKeys[], correct)` — correct: `box=min(box+1,5)`; incorrect: `box=max(box-1,1)`, `lapses++`. (Gentler than item-level reset-to-1 because it aggregates many items.) `boosted` counts graph-propagated lifts (Phase 2). |
| `oksat:conf:<slug>:<reviewer>` | `{v:1, entries:{<qId>:{c:"hi"\|"md"\|"lo", ok:bool, concepts:[...], s:sessionN, t:"YYYY-MM-DD"}}, updated}` | `recordConfidence(...)`. hi=Confident, md=Unsure, lo=Guessing. Skip writes **nothing** (absence = skipped). Adaptive page uses pseudo-slug `adaptive`. |
| `oksat:adaptive:<reviewer>` | `{v:1, topics:{<topicId>:{level:1-5, attempts:int, correct:int, recent:[0\|1 ×≤10], last:"YYYY-MM-DD"}}, updated}` | adaptive page via `recordAdaptive(topicId, correct)`. |
| `oksat:starred:<reviewer>` | `{v:1, items:[<normalized item + {topicId, savedAt}>], updated}` — hard cap 100; `addStar` returns `{ok:false, reason:'cap'}` at cap | adaptive page. |

Existing keys (`oksat:progress:*`, `oksat:srs:*`, `oksat:reviewer(s)`, `oksat:font`, `sk_theme`, `oksat:gemini-*`) are **unchanged** — keeps `oksat-db.js` `localSnapshot` and the hub reset scanner working. Phase 5 extends the reset scanner to the new prefixes.

---

## 6. Phase Plan

### Phase 0 — StorageAdapter + session plumbing (foundation; zero visible change)

**New `js/oksat-store.js`** (IIFE → `window.OKSATStore`):
```
load(key, fallback), save(key, value)      // exact semantics of oksat-engine.js:78-84
remove(key), keysWithPrefix(prefix)        // for reset + dashboard scans
norm(code)                                 // copy of normCode
touchSession(reviewer) -> n
recordConceptResult(slug, reviewer, conceptKeys, correct)
getConceptMastery(slug, reviewer)
recordConfidence(slug, reviewer, qId, tier, correct, conceptKeys, sessionN)
getConfidence(slug, reviewer)
recordAdaptive(reviewer, topicId, correct) / getAdaptive(reviewer) / setAdaptiveLevel(reviewer, topicId, level)
addStar(reviewer, item) -> {ok, reason?} / removeStar(reviewer, id) / getStarred(reviewer)
```
**Edits:**
1. Add `<script src="js/oksat-store.js"></script>` right after the manifest tag in `oksat-study.html` (~line 50) and `oksat.html` (~line 162); later pages add it too.
2. `oksat-engine.js:78-84` — delegate with fallback: `const load = (k,f) => (window.OKSATStore ? OKSATStore.load(k,f) : /* current inline body verbatim */);` same for `save`. **Contingency:** if `OKSATStore` is undefined, behavior is byte-identical to today.

**Verify:** all 5 modules answer/persist exactly as before (`oksat:progress:*`/`oksat:srs:*` in DevTools); hub, Atlas, Forge — zero console errors; keyboard nav unchanged; no new keys appear yet (store is inert until Phase 1).

### Phase 1 — Engine instrumentation: concept mastery, confidence, distractor autopsy

All edits in `js/oksat-engine.js` + one Forge edit. Every new field optional; 5 modules untouched.

**1a. Concept mastery + session tick** — inside `recordAnswer` (`oksat-engine.js:153-166`), after `setSrs(...)`:
```js
if (window.OKSATStore) {
  const item = ITEMS.find(q => q.id === qId);
  OKSATStore.touchSession(reviewer);
  if (item && item.concepts.length) OKSATStore.recordConceptResult(slug, reviewer, item.concepts, correct);
  if (item && window.OKSATGraph && correct) OKSATGraph.propagate(slug, item.concepts, reviewer); // inert until Phase 2
}
```
(`slug`/`reviewer` already in scope, lines 93-94.)

**1b. Confidence capture (MCQ only; post-answer; skippable; ~3s auto-skip).**
- New state near line 127: `const [confPending, setConfPending] = useState(false);`
- `handleSelect` (line 168): after `recordAnswer`, `setConfPending(true)`. Recall never prompts (its 4-tier self-grade already encodes confidence).
- Reset `confPending` in `goToItem` (lines 171-175).
- New module-level component `ConfidencePrompt`: one row, three buttons `1 Confident / 2 Unsure / 3 Guessing` + faint "skip"; `useEffect` sets `setTimeout(dismiss, 3000)` cleared on unmount/click. Rendered in `ItemView` just inside the `answered ?` fragment (line 526), above the brief panel. Tokens only; new `.ok-confrow` class in `css/oksat.css`.
- On pick: `OKSATStore.recordConfidence(slug, reviewer, qId, tier, isCorrect, item.concepts, sessionN)` then dismiss. Timeout/skip: dismiss, write nothing.
- Keyboard (`kbRef.current`, lines 216-252): insert a `confPending` block as the **first** check after the input-focus guard (line 220): keys `1|2|3` → record + dismiss; space/enter/ArrowRight → dismiss (skip) then fall through to normal advance. **No collision:** option digits only fire while unanswered (line 236); recall 1–4 grades require `!answered` (line 243); `confPending` is only true after answering an MCQ.
- Plumb `confPending`/`onConfidence`/`onConfSkip` into `ItemView` (signature line 425, call site 273-284). **Contingency:** if prop-threading proves error-prone, render `ConfidencePrompt` from `StudyViewer` directly in a strip under the card — acceptable.

**1c. Distractor autopsy.**
- Optional item field `distractorNotes: {<optionId>: "why this tempts and why it's wrong"}`.
- In `ItemView`'s "Not Quite" branch (line 533), between the header row and the `brief` paragraph (line 535): if `item.distractorNotes && answer && item.distractorNotes[answer]`, render a small panel — kicker "Your distractor" in `C.incorrect`, body `renderText(item.distractorNotes[answer])`, left-border `C.incorrect`, background `C.bg`. Absent field → nothing renders.
- **Forge emits it:** extend `HOUSE_STYLE` (`oksat-ai.js:21-76`) — add to the distractor principle: *"For every mcq, also emit `distractorNotes`: an object mapping each incorrect option id to one sentence naming why that distractor tempts a partial-knowledge reader and the precise reason it is wrong."* Add `"distractorNotes": {"b": "…"}` to the OUTPUT schema block (~line 68). `validateModule` (~173-202): add a **warning** (not error) when an mcq lacks it.
- Document the field in `docs/authoring-oksat.md`.

**Verify:** answer an MCQ → confidence row appears; `1/2/3` and click both record into `oksat:conf:*`; 3s idle auto-dismisses; space skips-and-advances; recall items never show it; `oksat:cmastery:*` boxes move (+1 correct / −1 floor 1); `oksat:session:*` increments only after >30-min gap (edit `last` in DevTools to test); **temporarily** add `distractorNotes` to one pediatrics item locally → wrong answer shows the note → revert the module file; re-run all 5 modules end-to-end; verify keyboard matrix (arrows, h/Esc, r, d, digits, space) still works everywhere.

**Risks:** keyboard regression is the top risk — the handler is dense; re-test every existing key after the insert. Clear the auto-skip timer in effect cleanup.

### Phase 2 — Unified taxonomy + cross-module concept graph

**New `js/oksat-taxonomy.js`** → `window.OKSAT_TAXONOMY`:
```js
{ version: 1,
  status: 'DRAFT — pending clinical review by owner. Topics/priorities/bands are scaffolding, not doctrine.',
  topics: [ { id, label, subspecialty, moduleId: <slug>|null, priority: 1|2|3,
              difficultyBand: 'foundational'|'core'|'advanced', keywords: [...] }, ... ] }
```
`subspecialty` keys into `OKSAT_SUBSPECIALTIES`; `moduleId` set for exactly the 5 built modules. Seed with the **draft ~62-topic list** (executor copies verbatim; every label carries a `// REVIEW` comment):
- **otology (11):** vestibular-schwannoma *(built)*; chronic-otitis-media-cholesteatoma P1/core; complications-of-otitis-media P1/core; sudden-snhl P1/core; menieres-episodic-vertigo P1/core; bppv-vestibular-testing P2/core; otosclerosis-stapes P2/core; cochlear-implants P2/advanced; temporal-bone-trauma P2/core; tympanoplasty-ossiculoplasty P3/core; sscd-third-window P3/advanced.
- **rhinology (8):** acute-bacterial-rhinosinusitis P1/foundational; crs-polyps-afrs-biologics P1/core; orbital-intracranial-sinus-complications P1/core; epistaxis-hht P1/foundational; allergic-rhinitis-immunotherapy P2/core; sinonasal-tumors P2/advanced; csf-rhinorrhea-encephalocele P2/advanced; anterior-skull-base-pituitary P3/advanced.
- **laryngology (7):** benign-vocal-fold-lesions P1/core; vocal-fold-paralysis P1/core; laryngotracheal-stenosis P2/advanced; zenker-cricopharyngeal-dysphagia P2/core; lpr-chronic-cough P3/foundational; spasmodic-dysphonia-neurolaryngology P3/advanced; esophagology-caustic-ingestion P3/core.
- **hn_onc (10):** oral-cavity-cancer P1/core; oropharynx-hpv P1/core; laryngeal-cancer P1/core; salivary-gland-neoplasms P1/core; neck-dissection-unknown-primary P1/core; cutaneous-scc-melanoma P2/core; nasopharyngeal-carcinoma P2/advanced; hypopharynx-cervical-esophagus P3/advanced; paraganglioma-vascular P3/advanced; radiation-systemic-principles P2/core.
- **fprs (7):** facial-reanimation *(built)*; facial-trauma-mandible-midface P1/core; local-flaps-mohs-reconstruction P1/core; rhinoplasty-nasal-analysis P2/core; free-tissue-transfer P2/advanced; otoplasty-microtia P3/advanced; aging-face-blepharoplasty P3/core.
- **pediatrics (8):** pediatric-hearing-loss *(built: `pediatrics`)*; tubes-tonsils-neck *(built: `ta-tubes`)*; pediatric-airway P1/core; congenital-neck-masses-vascular-anomalies P1/core; airway-foreign-bodies-caustics P1/core; choanal-atresia-craniofacial-syndromes P2/core; pediatric-sinusitis-periorbital P2/foundational; velopharyngeal-insufficiency-drooling P3/advanced.
- **sleep (3):** adult-osa-evaluation P1/core; sleep-surgery-hgns P2/advanced; pediatric-osa P2/core.
- **endocrine (4):** dtc-risk-stratification *(built)*; thyroid-nodule-bethesda-molecular P1/core; hyperparathyroidism P1/core; medullary-anaplastic-familial P2/advanced.
- **fundamentals (6):** head-neck-spaces-deep-neck-infections P1/foundational; imaging-radiology-principles P2/foundational; airway-management-anesthesia P2/core; hemostasis-transfusion-periop P2/foundational; antimicrobials-pharmacology P3/foundational; biostatistics-evidence P3/foundational.

**New `js/oksat-concept-graph.js`** → `window.OKSAT_CONCEPT_GRAPH` + `window.OKSATGraph`:
```js
OKSAT_CONCEPT_GRAPH = { version:1, clusters: { <clusterId>: { label, members: [{module:<slug>, concept:<key>, weight:0..1}] } } };
OKSATGraph = { clustersFor(slug, key), siblings(slug, key), propagate(slug, conceptKeys, reviewer), audit() };
```
Seed ~8 clusters using **exact** concept keys read from the real `CONCEPTS` maps in `js/mcq-modules/*.js` (executor must open the files and copy keys — e.g. a `facial-nerve` cluster linking facial-reanimation anatomy ↔ vestibular-schwannoma facial-nerve/complication concepts; `pediatric-ear` linking pediatrics ↔ ta-tubes OM/tube concepts). **Contingency:** `siblings()` silently drops members whose concept key doesn't exist (lazy validation, never throw); `audit()` is a console helper listing dangling members.

**Propagation rule** (correct answers only, called from the Phase 1a hook): for each source concept read its box; for each sibling: `proposed = Math.round(sourceBox * weight)`; `next = Math.max(current, Math.min(proposed, current + 1))` clamped 1–5 — **never demotes, never lifts more than one box per event**. Write into the sibling module's `oksat:cmastery:<siblingSlug>:<reviewer>` incrementing `boosted` (leave `seen`/`correct` untouched); missing sibling records initialize `{box:1,...}` first.

**Wiring:** both scripts added to `oksat-study.html` and `oksat.html` (after store, before engine/atlas).

**Verify:** console — `OKSAT_TAXONOMY.topics.length ≈ 62`, every `subspecialty` ∈ the 9 keys, all 5 `moduleId`s resolve to manifest slugs; answer a clustered facial-reanimation item → sibling module's `oksat:cmastery` shows a boost with `boosted++` and box never lowered; temporarily remove the two script tags → engine still runs clean (guards hold).

### Phase 3 — Progress dashboard (hub "Progress" tab)

**Edits to `oksat.html`:** add a `Progress` tab button next to Modules/Atlas (~lines 51-54), a `<section id="view-progress" hidden><div id="dash-root"></div></section>`, and extend `selectTab` (~225-232) to lazy-load `js/oksat-store.js` + `js/oksat-taxonomy.js` + `js/oksat-dashboard.js` via the existing `loadScript` helper (~234-240), then `OKSATDashboard.mount(el, {reviewer, db})` — pass the same `OKSATDB.fetch()` result the Atlas uses.

**New `js/oksat-dashboard.js`** → `window.OKSATDashboard = { mount(container, opts), refresh() }`. Plain DOM + template-string SVG (D2).
- `collect(reviewer)`: load all module data by **reusing the Atlas loader** — add `loadModules` to the `OKSATAtlas` export (`js/oksat-atlas.js:276`, the fetch-and-scope-execute pattern at lines 18-37) and include `js/oksat-atlas.js` in the lazy list (safe: Cytoscape only loads inside its `mount`). **Contingency:** if exporting is risky, duplicate the ~20-line loader into the dashboard — acceptable. Merge `oksat:progress:*`, `oksat:cmastery:*`, `oksat:conf:*`, `oksat:adaptive:*` into one stats object.
- **Panels (each an `.ok-card`):**
  1. *Global stats* — answered, first-attempt accuracy, due-today (reuse hub `dueCount` logic ~175-183), session count.
  2. *Per-subspecialty accuracy* — 9 horizontal bar rows (label, answered/total, accent-on-borderSoft bar, % right-aligned, 3px subspecialty-hue tick). 0-answer rows render faint "untouched".
  3. *Weak concepts* — bottom 10 across modules ranked by (box asc, accuracy asc, `seen ≥ 2`), each linking to `oksat-study.html?m=<slug>&c=<concept>`; labels from module `CONCEPTS`; mark propagated-only boxes (`boosted>0, seen==0`) distinctly.
  4. *Coverage map* — CSS-grid of taxonomy topics grouped by subspecialty: built+touched = solid hue; built+untouched = hue outline; gap+touched = ochre; gap+untouched = faint dashed. Built cells link to the module. **Gap cells render unlinked until Phase 4 ships** (then link to `oksat-adaptive.html?t=<topicId>`).
  5. *Calibration* — three tier rows (Confident/Unsure/Guessing: n + accuracy bar); per-concept flags: **overconfident** = `hi` accuracy <0.75 with n≥4 (rust), **underconfident** = `lo|md` accuracy >0.75 with n≥4 (ochre), else calibrated/insufficient data. Stretch: per-session confident-accuracy sparkline.
- Empty states everywhere; **no Gemini key needed anywhere in this phase.** New CSS classes (`.dash-grid`, `.dash-bar`, `.dash-cell`) in `css/oksat.css`, tokens only.

**Verify:** with real progress the tab renders all five panels; day/night toggle re-colors charts with no JS; brand-new reviewer → all empty states; Modules/Atlas tabs unaffected; network tab shows only module files + db.json.

### Phase 4 — Runtime adaptive generation (Gemini) + starring + export

**4a. Extend `js/oksat-ai.js`** (append inside the IIFE; add exports ~lines 204-215):
- `SINGLE_ITEM_STYLE` — appended to `HOUSE_STYLE` for single-item calls: *"You are generating ONE item, not a module. Return ONLY one JSON object: `{"type":"mcq"|"recall","stem":"...","options":[{"id":"a","text":"..."}] (4-5, mcq only),"correct":"a" (mcq),"answer":"..." (recall),"brief":"...","detailed":"...","distractorNotes":{"b":"..."} (mcq: every incorrect option),"difficulty":"easy"|"medium"|"hard"}`. No id, no concepts, no meta — the caller assigns those. Do not repeat any stem listed under AVOID."*
- `generateItem(opts)` — `opts = {topic:{id,label,subspecialty,difficultyBand}, level:1-5, type:'mcq'|'recall'|'auto', avoidStems:[≤8, each truncated 120ch], grounding:string|null, model?}`. User prompt: topic + subspecialty label, `Target difficulty: level <n>/5 — <phrase>` (1 foundational recall … 5 attending-level trap), item type, AVOID list, then optional `--- REFERENCE EXCERPTS (ground the item here; do not copy wording) ---`. `systemInstruction = HOUSE_STYLE + '\n\n' + SINGLE_ITEM_STYLE`; `generationConfig {responseMimeType:'application/json', temperature:0.7, maxOutputTokens:4096}`. Reuse `endpoint()`/`parseJSON()` (~88-113) and the retry-with-nudge shape from `generateModule` (~146-168); add `AbortController` 45s timeout. **One-in-flight gate:** module-scoped flag; second call rejects immediately; always cleared on settle.
- `validateItem(raw)` — factor the per-item checks out of `validateModule`'s loop (stem present; mcq ≥3 options + `correct` matches an option id; recall needs `answer`); `validateModule` calls it internally, behavior unchanged.
- `normalizeGeneratedItem(raw, topic, seq)` → `{ok, item?, error?}`: coerce type; `id = 'gen:'+topic.id+':'+Date.now()+':'+seq` (the `gen:` prefix marks generated items everywhere); mcq: re-letter option ids `a..e` (remap `correct`), trim texts, drop empties, require ≥3 + valid correct, keep only `distractorNotes` for incorrect ids; recall: require `answer`; copy brief/detailed/difficulty; set `concepts:[topic.id]`, `section: topic.label`, `topicId`, `generated:true`; run `validateItem`.
- `gradeFreeResponse({stem, modelAnswer, userAnswer})` → `{verdict:'correct'|'partial'|'incorrect', feedback}`. Prompt: *"Grade a resident's free-text answer against the model answer. Be strict on load-bearing facts, lenient on wording. Return ONLY {"verdict":...,"feedback":"1-2 sentences"}"*; `temperature:0.1, maxOutputTokens:512`, JSON mime, same timeout. **Contingency:** on any failure the UI falls back to reveal + the 4 recall self-grade tiers — grading must never dead-end.

**4b. New `oksat-adaptive.html`** — copy `oksat-study.html`'s shell (topbar, pre-paint theme script, React/htm CDN tags); scripts in order: manifest, reviewer, prefs, store, taxonomy, concept-graph, ai, atlas (for `loadModules`), `js/oksat-adaptive.js`; boot reads `?t=<topicId>&mode=<mode>`, runs `OKSATReviewer.ask(...)`, then `window.mountOKSATAdaptive(root, {topicId, mode, code})`.

**4c. New `js/oksat-adaptive.js`** — React + htm `AdaptiveQuiz` (mirror engine idioms: `htm.bind`, the `C` palette map, icon factory — copied, not imported).
- **SetupView** — 4 mode cards: *Topic drill* (topic select grouped by subspecialty; gap topics marked); *Gap filler* (weighted-random gap topic: `priority × (1 + 1/(attempts+1)) × low-mastery bonus`); *Mixed review* (alternate weakest built-module concepts from `oksat:cmastery` — generated items grounded on that module — with gap topics); *Stress test* (level forced `max(level,4)`, ~50% recall). **No-key state:** if `!OKSATAI.hasKey()`, render picker disabled under a notice — "Adaptive practice generates questions with Gemini. Attach a key in the hub's Settings." — linking to `oksat.html`. Everything else on the site stays key-free.
- **QuizView** — one item at a time: loading skeleton (`.ok-skel` shimmer in `css/oksat.css`: stem bar + 4 option bars, respects `prefers-reduced-motion`); MCQ rendering copied from the engine option-button pattern incl. sage/rust states, distractor-autopsy panel, brief/detailed, confidence row (same 3-tier + auto-skip spec as Phase 1, pseudo-slug `adaptive`); free-response: textarea → "Submit for grading" → `gradeFreeResponse` (spinner; fallback per 4a); star toggle (☆/★, ochre) on answered items → `OKSATStore.addStar` (cap message at 100); Next → `advance()`.
- **Controller (plain functions):** `recordResult(topicId, correct)` → `recordAdaptive` + session tick (adaptive mastery lives ONLY in `oksat:adaptive` — never write module cmastery from here); `adjustDifficulty(topic)` — over `recent` (≤6): `n≥4 && acc≥0.8 → level+1 (max 5)`; `n≥3 && acc≤0.4 → level−1 (min 1)`; init from `difficultyBand` (foundational→1, core→2, advanced→3); `buildGrounding(...)` — for mixed-review built-module targets (or a gap topic with optional `relatedModule` in taxonomy), load the module via `OKSATAtlas.loadModules()`, take items tagged with the target concepts (else weakest-first), concatenate `detailed` texts, truncate to **6,000 chars (~1,500 tokens)**, prefix each excerpt with its concept label; return `null` if nothing applies (generation proceeds ungrounded); `advance()` — pick topic per mode → `generateItem` with session `avoidStems` (≤8) → `normalizeGeneratedItem` → on failure retry once with nudge → still bad → ErrorView.
- **Error states** (each an `.ok-card` with Retry): timeout; network; parse/validation ("The model returned an unusable question"); quota/HTTP (surface Gemini's message as the Forge does). One-in-flight gate makes double-click safe.
- **StarredView** — list starred (stem + topic chip + unstar) + **"Export as module draft"** → `oksat-generate.html?from=starred`.
- Generated items must **never** touch `oksat:srs:*` or `oksat:progress:*`.

**4d. Forge import path (`oksat-generate.html`).** On load with `?from=starred`: read starred items, build a module object — `meta` prefilled (title "Starred — Adaptive Set"), `DOMAINS` one per represented subspecialty (hue from `OKSAT_SUBSPECIALTIES`), `CONCEPTS` one per topicId (label from taxonomy, fallback raw id), `ITEMS` re-id'd `q1..qN` with `concepts:[topicId]` and `generated`/`topicId`/`savedAt` stripped — then feed the existing pipeline (`current = mod; render(mod, OKSATAI.validateModule(mod))`) so preview/validate/download/manifest-copy work untouched. Add store + taxonomy script tags to the page.

**4e. Hub link.** Add an "Adaptive Practice" companion card next to the Forge card (~oksat.html:78-85); make Phase 3 coverage-map gap cells link live now.

**Verify:** no key → attach-a-key state, zero network requests; with key → topic drill generates (skeleton → item), option ids normalized, wrong answer shows the chosen distractor's note; hammering Next never fires two requests (Network tab); kill network mid-generation → error card → Retry works; garbage model name → clean error; 4+ correct in a row → level rises in `oksat:adaptive`; free-response grading returns a verdict and falls back to self-grade when key removed mid-session; star 2 items → Forge `?from=starred` previews, validates, downloads a loadable module (commit-test locally with a temp manifest entry, then revert); `oksat:srs:*` contains **no** `gen:` ids.

### Phase 5 — Hub taxonomy navigation, Atlas surfacing, DB sync v2, hygiene

**5a. Hub Modules tab becomes taxonomy-aware** (~oksat.html:198-216): subspecialty group headers (label + hue tick); under each, the existing module cards unchanged, then compact gap-topic chips (ochre-tinted links to `oksat-adaptive.html?t=<id>`, `P1` badge for priority-1). **Contingency:** if `OKSAT_TAXONOMY` is missing, render today's flat list (grouping guarded behind the global).

**5b. Atlas surfacing** (`js/oksat-atlas.js`, `buildElements` ~75-138): add faint dashed **gap-topic nodes** (`kind:'gap'`, small, dashed subspecialty-hue border, tap → adaptive page) attached to subspecialty hubs; optional dashed cluster edges from `OKSAT_CONCEPT_GRAPH` between member concept nodes (ids `c:<slug>:<key>` already exist). Both additive and guarded on the globals.

**5c. DB sync v2** (`js/oksat-db.js`) — additive, backward-compatible:
- `emptyDB()` → `version: 2`.
- `localSnapshot(code)` additionally returns `calibration: {hi:{n,c}, md:{n,c}, lo:{n,c}}` (aggregated across all `oksat:conf:*:<code>` incl. `adaptive`) and `adaptive: {topics:{id:{attempts, correct, updated}}}`.
- `buildMerged`: merge new blocks monotonically — calibration tier-wise n-max wins; adaptive topic-wise attempts-more-wins, tie → later `updated` (mirror `better()`). Every read `(x || {})`-guarded so v1 server files merge cleanly; never delete unknown fields. Output `version: 2`.
- `completionFor` unchanged → Atlas unaffected. No secrets ever enter the file (aggregates only).

**5d. Hygiene:** extend the hub reset scanner (~oksat.html:385-388) to also clear `oksat:cmastery:*`, `oksat:conf:*` (suffix-matched to active reviewer) and exact keys `oksat:adaptive:<code>`, `oksat:starred:<code>`, `oksat:session:<code>`; update `docs/authoring-oksat.md` (distractorNotes) and `docs/oksat-plan.md` §8 (mark confidence/adaptive/generation-on-demand delivered; note taxonomy DRAFT status).

**Verify:** hub groups render with all 5 modules launchable; gap chips navigate; Atlas lays out with gap nodes and re-themes; downloaded merged DB is `version:2` with old reviewer blocks intact (diff against current `data/oksat-db.json`); reset clears every new prefix for the active reviewer only; **re-run the entire Phase 0–4 checklist as regression.**

---

## 7. Cross-Cutting Risk Register

| Risk | Phase | Mitigation / contingency |
|---|---|---|
| Engine regression breaking the 5 shipping modules | 0,1 | Fallback-preserving edits; keyboard block inserted first + full key-matrix re-test; every new render guarded on optional fields |
| Script-load-order mistakes (no bundler) | all | Every consumer guards `window.X &&`; canonical order: manifest → reviewer → prefs → **store → taxonomy → concept-graph** → db/ai → engine/atlas/dashboard/adaptive |
| Gemini output shape drift | 4 | Four layers: JSON mime → parse-nudge retry → normalization → validateItem; error card + Retry as floor |
| Line-number drift between plan and file | all | Executor locates quoted code by grep before editing; stops if snippet not found |
| localStorage bloat | 1+ | Per-entry data small; starred capped 100; `recent` capped 10; no unbounded client logs |
| Taxonomy clinical accuracy | 2 | `status: DRAFT` + `// REVIEW` comments; owner sign-off is an explicit separate step |
| Concept-graph key drift | 2 | Lazy validation; `OKSATGraph.audit()` console helper |
| DB merge corrupting v1 data | 5 | Additive-only fields, monotone merge rules; diff a downloaded merge before any push |

## 8. Execution Order & Dependencies

Phase 0 → 1 → 2 → 3 → 4 → 5. Each phase ends with a runnable site + passing checklist. Phases 2/3 are independent of 4 (reorderable); 4 depends on 0 (store) and 2 (taxonomy); 5 depends on everything.

## 9. Critical Files

| File | Role in this plan |
|---|---|
| `js/oksat-engine.js` | Phase 0 (load/save delegation, 78-84), Phase 1 (recordAnswer 153-166; handleSelect 168; goToItem 171-175; keyboard 216-252; ItemView answered block 525-547) |
| `js/oksat-ai.js` | Phase 1c (HOUSE_STYLE 21-76, validateModule 173-202), Phase 4a (generateItem/validateItem/normalize/grade; transport pattern 88-168) |
| `oksat.html` | Phase 3 (tabs ~51-54, selectTab ~225-240), Phase 4e (companion card ~78-85), Phase 5a (module list ~198-216), Phase 5d (reset ~385-388) |
| `js/oksat-db.js` | Phase 5c (emptyDB 24-26, localSnapshot 42-60, better 63-67, buildMerged 90-112) |
| `oksat-generate.html` | Phase 4d (pipeline ~204-331) |
| `js/oksat-atlas.js` | Phase 3 (export loadModules, 18-37 + 276), Phase 5b (buildElements 75-138) |
| `css/oksat.css` | Phases 1/3/4 (`.ok-confrow`, `.dash-*`, `.ok-skel`) — tokens only |
| **New:** `js/oksat-store.js`, `js/oksat-taxonomy.js`, `js/oksat-concept-graph.js`, `js/oksat-dashboard.js`, `js/oksat-adaptive.js`, `oksat-adaptive.html` | Phases 0/2/3/4 |

## 10. End-to-End Verification (final acceptance)

Serve with `python3 -m http.server 8000` and walk:
1. Fresh browser, new reviewer → hub → each of the 5 modules answers/persists; keyboard matrix intact.
2. Answer MCQs → confidence prompts record; cmastery boxes move; session counter behaves across a simulated 30-min gap.
3. Clustered answer → sibling module boost visible, never demoting.
4. Progress tab → five panels, correct in both themes, graceful when empty.
5. No Gemini key → whole site works; adaptive page shows attach-key state.
6. With key → all four adaptive modes generate; difficulty adapts; errors recover; free-response grades (and falls back).
7. Star → export via Forge → downloaded module file loads through a temp manifest entry.
8. DB download → v2 JSON, v1 blocks preserved; per-reviewer reset clears all new keys.
9. Existing regression: Atlas, KAG link, Forge normal path, redirect stubs, font themes, day/night.
