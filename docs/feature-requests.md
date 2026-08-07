# Feature requests — utility × feasibility

> Snapshot date: 2026-07-25. Counts quoted below are *as of* that date and
> will drift; they are the evidence for the ranking, not durable facts.
> Re-derive them from the source files before acting on an old copy of this
> list.
>
> **Amended 2026-07-27 — the daily-use assumption was wrong.** The owner
> reviews *periodically*, not daily. Due-ness is therefore an input to the
> scheduling algorithm and **never a number shown on the front page**: no
> badges, no counters, no streak. #1 is re-scoped from a daily queue to an
> on-demand session and #12 loses its streak entirely (both marked below).
> Rationale and the replacement organising ideas: `docs/console-underlay-plan.md`.

This is a **product** backlog: user-facing capability the site does not have
today. It is deliberately disjoint from the **engineering** backlog already
filed as GitHub #42–#61 (`docs/agent-native-plan.md`) — that roadmap is
verification, vendoring, diagnostics, and the KAG store refactor. Where a
feature below depends on one of those issues, the dependency is named.

## Scoring

| Axis | 1 | 3 | 5 |
|---|---|---|---|
| **Utility** | Nice to look at | Saves real time weekly | Changes how the tools get used, or unblocks a system that is currently stalled |
| **Feasibility** | Needs a new subsystem, owner-only clinical judgment, or external licensing | A new page reusing established patterns | An afternoon inside existing files; data already collected; no new dependency |

**Score = Utility × Feasibility.** Feasibility is scored against this repo's
real constraints — no build step, no bundler, vanilla JS, static hosting,
client-side-only state — not against a generic web stack. Anything requiring
a server scores 1 by definition.

## The honest headline

The tooling has outrun the content. As of this snapshot:

- `js/oksat-taxonomy.js` defines 62 topics; `js/oksat-manifest.js` ships **5
  modules** (~207 items). Roughly 92% of the mapped curriculum has no static
  content.
- `data/kag-graph.json` holds 771 nodes, of which **40 are `review:true`** —
  95% of the graph is DRAFT and cannot be trusted for study.
- `data/oksat-db.json` has zero reviewer blocks: the multi-reviewer sync path
  is built but has never carried real data.

No feature on this list beats *authoring content* on utility. The features
that matter most are therefore the ones that lower the cost per unit of
content (#5, #7) or raise the value of the content already present (#1–#3).

## Ranked matrix

| # | Feature | U | F | Score | Primary surface |
|---|---|---|---|---|---|
| 1 | **Session on demand** (cross-module, *not* a daily queue) | 5 | 4 | 20 | new "oksat-review.html" |
| 2 | Anki / CSV export | 4 | 5 | 20 | `js/oksat-store.js` + hub |
| 3 | Miss log — every item failed on first attempt | 4 | 5 | 20 | `js/oksat-dashboard.js` |
| 4 | Offline use (service worker + web app manifest) | 4 | 4 | 16 | new "sw.js", all pages |
| 5 | KAG DRAFT review queue (graduate `review:false`) | 5 | 3 | 15 | new lens or owner page |
| 6 | Source line on every item | 3 | 5 | 15 | `js/oksat-engine.js`, `js/oksat-ai.js` |
| 7 | Forge → one-click module PR | 4 | 3 | 12 | `oksat-generate.html` |
| 8 | Timed exam mode (OKAP simulation) | 4 | 3 | 12 | new "oksat-exam.html" |
| 9 | Printable pocket sheets | 3 | 4 | 12 | `css/oksat.css` print block |
| 10 | Validator suggests KAG↔OKSAT links | 3 | 4 | 12 | `tools/kag-validate.mjs` |
| 11 | Item images (audiogram, CT, scope, path) | 5 | 2 | 10 | schema + engine + `images/` |
| 12 | Hub "continue where you left off" (~~+ streak~~ — dropped) | 3 | 5 | 15 | `oksat.html` |
| 13 | Global search across graph + modules | 3 | 3 | 9 | new "search.html" |
| 14 | KAG cards join the session | 3 | 3 | 9 | "oksat-review.html" + `KAGStore` |
| 15 | Airway Rounds scoreboard persistence | 2 | 4 | 8 | `js/airway-engine.js` |
| 16 | **Console underlay (⌘K on every page)** | 4 | 4 | 16 | new `js/console.js`, all pages |

---

## 1 — Session on demand · U5 F4 · 20

> **Re-scoped 2026-07-27.** Originally "daily mixed review queue". The
> cross-module machinery is unchanged; the framing is. One control — "start a
> session", optionally scoped to a subspecialty — with no daily obligation and
> no due badge anywhere. Due-ness picks *what* surfaces, never *how loudly*.

**Problem.** Leitner scheduling is per module. `oksat-study.html` hard-requires
`?m=<slug>` and `dueIds` is computed inside a single module's `ITEMS` array
(`js/oksat-engine.js`). The hub shows a due badge per module card, so a
reviewer with items due in four banks must open four pages and remember which
they finished. Spaced repetition works on a single daily queue; this is the
one product gap that degrades the core loop every single day.

**Sketch.** New "oksat-review.html" + "js/oksat-review.js". Load every module
via `OKSATAtlas.loadModules()` (already exported for the dashboard), read
`oksat:srs:<slug>:<rev>` for each, build one interleaved due list tagged by
origin module, and present items with the engine's option-button pattern
**copied, not imported** (`ItemView` is closure-private by design — see
`docs/oksat-next-iteration-plan.md` D1, the precedent that made
`oksat-adaptive.html` a separate page). Grading writes back to the item's own
per-module SRS and progress keys — no new storage key, no scheduling change.

**Feasibility 4, not 5:** the write-back must target the correct per-module
keys or it corrupts real progress. Land `tools/test-oksat-engine.mjs`
coverage for the cross-module write path first.

**Escalation:** none — this changes *where* items are answered, not
`LEITNER_INTERVALS` or box math (which are owner-only, `docs/decisions.md` §8).

## 2 — Anki / CSV export · U4 F5 · 20

**Problem.** 207 authored items are locked in this site. Residents already run
Anki daily; the bank cannot ride along to a phone on call.

**Sketch.** `OKSATStore` gains `exportItems(scope)` returning TSV
(Anki's native import format): `front`, `back`, `tags` built from
`stem`/`options` → `answer` + `brief`, tagged `oksat::<subspecialty>::<slug>`.
Scope selector on the hub: whole module, one concept, current miss log,
starred set. Download via the existing Blob/anchor pattern
(`js/kag-store.js`). Zero dependencies, zero network, no new key.

**Feasibility 5:** all data is already in memory when the hub renders.

## 3 — Miss log · U4 F5 · 20

**Problem.** `oksat:progress:<slug>:<rev>` already records `firstCorrect` per
item, and the dashboard ranks *concepts* by mastery (panel 3) — but a reviewer
cannot get the literal list of questions they got wrong, across modules, which
is the single most-requested view of any question bank.

**Sketch.** Sixth dashboard panel in `js/oksat-dashboard.js`: scan
`oksat:progress:*:<rev>`, select items where `firstCorrect === false`, group by
subspecialty, each row deep-linking to `oksat-study.html?m=<slug>&c=<concept>`.
Feeds the export in #2 as a scope.

**Feasibility 5:** pure read over data already collected; `collect(reviewer)`
in the dashboard already loads every module.

## 4 — Offline use · U4 F4 · 16

**Problem.** The tools are for wards, ORs, and call rooms — exactly where
hospital wifi fails. Nothing is cached; every page needs the network, and the
OKSAT and graph pages additionally need unpkg/cdnjs to be up.

**Sketch.** "sw.js" with a precache list (HTML, `css/*`, `js/*`,
`data/kag-graph.json`) and a stale-while-revalidate strategy for data files;
"manifest.webmanifest" + icons so it installs to a phone home screen. Register
from `js/site.js` behind a guard, matching house style.

**Feasibility 4:** the site is 100% static, so the service worker is
mechanical — but a wrong cache strategy ships stale content invisibly, which
is the same failure mode as the KAG staleness bug (#57). **Depends on #52**
(vendoring the CDN libraries): until React/htm/Cytoscape are local, "offline"
covers only the CDN-free pages. Sequence after #51/#52; ship the manifest half
now if a home-screen icon is wanted early.

## 5 — KAG DRAFT review queue · U5 F3 · 15

**Problem.** 731 of 771 nodes are `review:false`. Graduating them is the
owner's irreducible clinical judgment (`docs/decisions.md` §8), and there is
no surface for doing it — the workflow today is "hand-edit a shard, re-run the
validator", which is why it has not happened at scale. The graph's entire
credibility is gated behind this one stalled loop.

**Sketch.** An owner-only review surface (fourth graph lens, or a standalone
page): one DRAFT node at a time — label, detail, sources, neighbors — with
Approve / Edit / Reject. Decisions accumulate in a local queue and export as a
standard `{nodes, edges}` shard, which goes through `tools/kag-validate.mjs`
unchanged. The validator keeps forcing `review:false` on authored nodes; the
owner's shard is the one input allowed to carry `review:true`, applied on
merge. Order the queue by graph centrality so high-traffic nodes graduate
first.

**Feasibility 3:** the surface is easy; the safe part is the merge contract —
the validator's authored-node rule must be relaxed for exactly this one path
and nothing else. Interacts with #57/#59: build it after the progress/content
split so review state is unambiguous.

**Escalation:** the feature is *for* the owner; agents build the tool, never
the verdicts.

## 6 — Source line on every item · U3 F5 · 15

**Problem.** `js/oksat-engine.js` already reads a `reference` field, and no
module sets it — a dead field. For medical content that is a real gap: an item
you cannot trace is an item you cannot trust, and the KAG already enforces
"≥1 source per node" (`docs/authoring-kag.md`) while the question banks do not.

**Sketch.** Render `item.reference` as a small muted line under the detailed
explanation when present (absent → nothing renders, matching the engine's
sparse-data tolerance). Add the field to `HOUSE_STYLE` in `js/oksat-ai.js` so
the Forge emits it, warn on absence in `validateModule`, document it in
`docs/authoring-oksat.md`, and backfill the 5 shipped modules over time.

**Feasibility 5:** the read path already exists; every new field is optional.

## 7 — Forge → one-click module PR · U4 F3 · 12

**Problem.** Generating a module is the easy half. Shipping it is: download the
file, drop it in `js/mcq-modules/`, hand-copy a manifest entry with a `count`
that must equal `ITEMS.length`, commit, push. That friction is a direct tax on
closing the 5-of-62 coverage gap.

**Sketch.** Reuse the Contents API push path proven in `js/oksat-db.js` and
`js/kag-store.js` (runtime-only token, never stored): create a branch, PUT the
module file plus the patched `js/oksat-manifest.js`, open a PR. CI (#49) then
runs `tools/check-data.mjs`, which already enforces slug/filename equality and
`count === ITEMS.length` — so a bad generation fails automatically instead of
silently.

**Feasibility 3:** patching `js/oksat-manifest.js` from the browser means
editing JS source as text. Keep it dumb — insert before a sentinel comment,
and refuse to push if the sentinel is missing.

## 8 — Timed exam mode · U4 F3 · 12

**Problem.** The engine teaches; it does not simulate. OKAP is timed, mixed,
and gives no feedback until the end — the opposite of the first-attempt-lock,
immediate-explanation loop, which is correct for learning and useless for
pacing practice.

**Sketch.** New "oksat-exam.html": pick N items across modules, countdown
timer, answers changeable until submit, no explanations shown mid-exam, then a
score report by subspecialty with links into the miss log (#3). Items are
drawn from the shipped banks; **nothing writes to `oksat:srs:*` or
`oksat:progress:*`** — an exam is measurement, not study, and mixing the two
would corrupt the Leitner signal.

**Feasibility 3:** conceptually simple, but "answers changeable until submit"
directly inverts the engine's core invariant, so it must be a separate page
with its own state — never a flag inside `js/oksat-engine.js`.

## 9 — Printable pocket sheets · U3 F4 · 12

**Problem.** Nothing here survives contact with a white coat pocket. A concept
or module cannot be turned into a one-page reference for pre-rounding.

**Sketch.** A `@media print` block in `css/oksat.css` (drop chrome, linearize
cards, black-on-white, expand all detail text) plus a "Print sheet" control on
the module and concept views. Same treatment for a KAG node's neighborhood
from the knowledge lens.

**Feasibility 4:** pure CSS plus one button; the tokens already exist. The
work is in tuning page breaks, which is fiddly but low-risk.

## 10 — Validator suggests KAG↔OKSAT links · U3 F4 · 12

**Problem.** Only 70 of 771 nodes carry any `oksat.modules`/`oksat.concepts`
link. The bidirectional graph↔bank navigation that the schema was built for
mostly does not fire, because linking is manual and easy to skip.

**Sketch.** A `--suggest-links` flag on `tools/kag-validate.mjs`: for each
node, match label and aliases against real module `CONCEPTS` keys and labels,
print high-confidence candidates as a copyable patch. Suggest only — never
auto-write, since a wrong link sends a reader to the wrong content.

**Feasibility 4:** the validator already loads both sides to check
`oksat.concepts` against real `CONCEPTS` keys; this reuses that index in
reverse. Zero dependencies, dev-only tool, no shipped surface touched.

## 11 — Item images · U5 F2 · 10

**Problem.** Otolaryngology is a visual specialty and every item in the bank is
text-only. No audiograms, temporal bone CTs, scope stills, or histology — a
whole category of testable reasoning is unreachable, and the KAG's structural
lens has the same limitation.

**Sketch.** Optional `item.media = { src, alt, credit, license }`; engine
renders it above the stem, absent → nothing changes. Assets live in
`images/oksat/` with `images/list.txt` extended (`docs/docs-map.md` already
makes that inventory a documented obligation).

**Feasibility 2 — and the constraint is not technical.** The rendering is an
afternoon. Sourcing images that are legally redistributable on a public
GitHub Pages site is the hard part, and any clinical image (even
de-identified) is a licensing and privacy decision only the owner can make.
Recommended path: ship the schema + rendering with two openly-licensed
example images, then let content follow. Highest ceiling on this list, and the
one most likely to stall if started from the content end.

**Escalation:** image licensing and provenance — owner, always.

## 12 — Hub "continue where you left off" · U3 F5 · 15

> **Amended 2026-07-27: the streak is dropped.** For a periodic reviewer a
> streak is a guilt counter that reads zero almost always — it punishes the
> actual usage pattern. Utility rises without it, because "where you left off"
> is precisely the ordering that works at any cadence.

**Problem.** The hub opens cold every time. `oksat:session:<rev>` is already
written (30-minute-gap session counter) and nothing surfaces it.

**Sketch.** One line above the module cards: last module touched, items due
today across all banks, current daily streak. Streak = derived from existing
`updated` stamps; no new key needed.

**Feasibility 5:** read-only, data already stored, one small render on
`oksat.html`. Low utility on its own — worth bundling into whichever hub edit
lands first (#1 or #2).

## 13 — Global search · U3 F3 · 9

**Problem.** Three searchable corpora (771 graph nodes, 5 module banks, the CPT
table) with three separate search boxes and no way to ask "where does this term
appear at all".

**Sketch.** "search.html" fetching `data/kag-graph.json` + the manifest's
modules, building a client-side index, returning grouped results that deep-link
to `graph.html?node=`, `oksat-study.html?m=&c=`, or the CPT tool.

**Feasibility 3:** straightforward, but it downloads the whole graph to index
it — best built *after* #60's version-check-then-fetch caching, or it adds a
~850 KB fetch to a page whose whole job is to feel instant.

## 14 — KAG cards join the daily queue · U3 F3 · 9

**Problem.** The knowledge lens has its own Leitner self-test with its own
queue. A reviewer has two unrelated daily obligations for one body of
knowledge.

**Sketch.** Once #1 exists, extend it to pull due KAG nodes via `KAGStore`
alongside due MCQ items, rendering each card type in its own idiom.

**Feasibility 3:** depends on #1 shipping first and on #59's progress overlay
landing, so KAG progress is a small, well-defined object rather than a whole
embedded graph. Sequence accordingly.

## 15 — Airway Rounds scoreboard persistence · U2 F4 · 8

**Problem.** Team scores vanish on refresh — a real risk mid-game with a room
watching.

**Sketch.** Persist game state to `localStorage` under an `sk_airway:*` key
after each scoring event; offer resume on boot. Must stay CDN-free and
self-contained (`docs/decisions.md` §1).

**Feasibility 4:** small and isolated. Utility is capped by how often the game
is actually run — bump this up if it becomes a recurring conference fixture.

---

## Considered and not recommended

| Idea | Why not |
|---|---|
| User accounts / login | Needs a server. Reviewer codes + per-reviewer files already cover the real use case; auth would trade the git-based review pipeline for nothing. |
| Real-time multiplayer study | Same server problem, and no second concurrent user exists yet. |
| Push notifications for due cards | Web push needs a server for VAPID delivery. A PWA badge (#4) gets ~80% of the value with zero backend. |
| Rich text / WYSIWYG item editor | The Forge plus a text editor already produces modules; an editor is a large surface serving one author. |
| Migrating question banks to JSON | The `window.__MCQ_MODULE` convention is load-bearing across engine, validator, and tests. Churn without user-visible benefit. |
| LLM chat tutor over the graph | Interesting, but it puts unreviewed generated claims next to curated medical content — exactly the boundary `review:true` exists to protect. Revisit only after #5. |

## Suggested order

1. **#3 → #2 → #12** — one hub/dashboard pass; all read-only over existing data.
2. **#1** — the highest-utility item; give it engine-test coverage first.
3. **#6 → #10** — cheap content-quality wins that make every future module better.
4. **#7** — then start closing the 5-of-62 coverage gap in volume.
5. **#5** — after #57/#59 land, unstall the 95%-DRAFT graph.
6. **#4** — after #51/#52 vendoring.
7. **#8, #9, #11, #13, #14, #15** — as appetite allows.
