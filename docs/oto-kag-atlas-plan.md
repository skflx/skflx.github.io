# OHNS Term Web, Usage Analytics & Structural Anatomy Atlas — Master Plan

*Plan only. Granular, contingency-covered, written so a less-capable executor
model (or a fleet of subagents) can build it phase by phase without holes.
Grounded on the REAL repo as it exists on branch
`claude/oto-kag-anatomy-atlas-x19jfa` — every file path, storage key, id
format, and deep-link string below was verified against the current code.*

---

## 0. What we are building (three pillars, one graph)

The site already has two knowledge surfaces that must now be fused and grown:

- **KAG** — `kag.html` + `kag-extract.html`: a Cytoscape knowledge graph of OHNS
  entities (`{nodes, edges}`) with a Leitner self-test. Today it lives **only**
  in `localStorage['kag-graph']`; the 40-node seed is hard-coded inside
  `kag.html` (all temporal-bone otology). There is **no committed KAG data
  file** — unlike OKSAT.
- **OKSAT** — `oksat.html` + 5 question modules + `js/oksat-*.js`: a study
  platform with a hub Atlas graph, a draft 62-topic taxonomy
  (`js/oksat-taxonomy.js`), a cross-module concept graph
  (`js/oksat-concept-graph.js`), and a shared **committed** database
  `data/oksat-db.json` synced via the GitHub Contents API.

The three deliverables the owner asked for:

1. **Otolaryngology term database (KAG expansion).** Turn the KAG into a
   *massive interconnected web* mirroring the OHNS core content, and wire it
   **bidirectionally** to OKSAT questions/modules/topics so a learner can
   traverse term → question → module → topic and back.
2. **Usage analytics.** Log visitors, number of uses, and question statistics —
   **cumulative** and **auto-saved to the site**.
3. **Structural anatomy atlas.** Bones, cartilage, ligaments, fascia only.
   3D deferred — for now **encode every relationship and name every structure**.
   The atlas is **not a new dataset**; it is a *structural view of the KAG*, so
   `module → KAG (detailed relationships) → anatomy atlas` is one pipeline with
   the KAG as the single source of truth (this is how we "reduce redundancy").

**The unifying architectural decision (D0):** the KAG becomes the site's
canonical knowledge graph, externalized into a committed, growing data file.
The term web, the module links, and the anatomy atlas are all layers/views on
that one file. Nothing is authored twice.

---

## 1. Verified inventory (do not re-derive — this is ground truth)

### 1.1 KAG (`kag.html`)
- **Storage:** single key `localStorage['kag-graph']` = `{nodes, edges}`.
  `loadGraph()` returns it or deep-copies `SEED_GRAPH`; `saveGraph(g)` writes it.
- **Node schema:** `{ id (kebab slug), label, type, subspecialty, detail,
  sources[], corrections[], leitner:{box,nextReview} }`.
- **Edge schema:** `{ source, target, type, label? }` (no id, no weight).
- **Node `type` enum:** `anatomy | pathology | procedure | nerve | vessel |
  drug | concept`. `NODE_COLORS` (bright, saturated) keys off `type`.
- **Seed:** 40 nodes (24 anatomy, 5 nerve, 2 vessel, 4 pathology, 5 procedure),
  52 edges. All `subspecialty: otology` except `vestibular-schwannoma`
  (`skull-base`). Edge types used: `contained_in`×21, `landmark_for`×11,
  `complication_of`×6, `treats`×5, `innervates`×3, `arises_from`×3,
  `branches_from`×2, `supplies`×1.
- **Leitner:** `LEITNER_INTERVALS={1:1,2:3,3:7,4:14,5:30}` days;
  due = `leitner.nextReview <= today`; grade buttons `data-conf` =
  `again|hard|good|easy`.
- **Corrections:** `node.corrections[] = {text, source, date, resolved}`;
  inbox in Settings modal; `hasCorrections` drives a yellow border.
- **Filter pills:** built from KAG's OWN subspecialty list
  `['rhinology','otology','head-neck-onc','laryngology','peds-ent',
  'skull-base','facial-plastics']` and filter on the node `subspecialty` field.
  **This vocabulary DIFFERS from OKSAT's — see §3 reconciliation.**
- **Search:** matches `label` OR `detail`.
- **Import/Export/Reset:** import requires `{nodes, edges}`, dedups nodes by
  `id`, edges by `source|target|type`; export downloads
  `kag-graph-<TODAY>.json`; reset restores `SEED_GRAPH`.

### 1.2 Extractor (`kag-extract.html`)
- Model `claude-sonnet-4-20250514`, endpoint
  `https://api.anthropic.com/v1/messages`, streaming, browser-direct.
- Node types + edge types = the enums above. Node requires `id`+`label`;
  fills defaults (`type`→`concept`, `subspecialty`→`rhinology`, empty
  `sources/corrections`, `leitner{box:1,nextReview:today}`).
- **Merge → `localStorage['kag-graph']`**, dedup nodes by `id`, edges by
  `source|target|type`. API key in `localStorage['kag-api-key']`.

### 1.3 OKSAT modules (exact slugs, counts, keys)
| Slug | Items | DOMAINS (keys) | # CONCEPT keys |
|---|---|---|---|
| `pediatrics` | 40 mcq | foundations, CHL, SNHL, syndromic, workup, management, cases | ~53 |
| `ta-tubes` | 54 mcq | foundations, bmt, tonsillectomy, neck, complications, cases | ~44 |
| `vestibular-schwannoma` | 46 mcq | anatomy, pathophysiology, epidemiology, diagnosis, treatment, complications, NF2, cases | ~36 |
| `facial-reanimation` | 42 mcq | anatomy, physiology, evaluation, workup, treatment, complications, cases | ~27 |
| `dtc-risk-stratification` | 25 recall | staging, operative, completion, pathology, riskStrat, controversy | ~25 |

**Total 207 items, ~180 concept keys.** The full key→label→domain lists for all
five modules were extracted and are attached in **Appendix A** (executors copy
verbatim — the keys are load-bearing). **Known data-hygiene bug:** `pediatrics`
CONCEPTS defines `CHL` twice (the second wins); flag during Phase 1.

### 1.4 OKSAT wiring (deep links + ids)
- Viewer: `oksat-study.html?m=<slug>` (reads `m`; `c` is passed through to the
  engine). Script load order ends: manifest → store → reviewer → prefs →
  taxonomy → concept-graph → engine.
- Adaptive: `oksat-adaptive.html?t=<topicId>`.
- Atlas node ids: sub `s:<subspecialty>`, module `m:<slug>`,
  domain `d:<slug>:<dKey>`, concept `c:<slug>:<cKey>`, gap `g:<topicId>`,
  crossover literal `kag`. Tap: module→`oksat-study.html?m=`, concept→
  `oksat-study.html?m=&c=`, gap→`oksat-adaptive.html?t=`, kag→`kag.html`.
- `window.OKSATAtlas.loadModules()` → Promise of `{slug:{meta,DOMAINS,CONCEPTS,
  ITEMS}}` (fetch + `new Function` sandbox). **Reuse this everywhere** modules
  must be read outside the study page.
- Shared DB `data/oksat-db.json` v2 via `js/oksat-db.js`
  (`fetch`/`buildMerged`/`download`/`push`). Contents-API `push()` uses a
  runtime-only token. **Both write paths need the owner to act — nothing writes
  automatically.** (Load-bearing for Pillar 2.)

### 1.5 Design system (obey it)
- Tokens only (`css/oksat.css --ok-*`), warm cream canvas, sage/rust feedback,
  one hue per subspecialty (`OKSAT_SUBSPECIALTIES`), keyboard-first, no build
  step, degrade gracefully. `js/main.css` styles the older tool pages
  (kag.html uses its own dark theme + bright `NODE_COLORS`). New surfaces should
  match OKSAT tokens; KAG/atlas may keep the dark "graph" aesthetic but must be
  internally consistent and themeable.

---

## 2. Architectural decisions (made once — do not revisit mid-build)

- **D0 — One canonical graph file.** Externalize the KAG into committed
  **`data/kag-graph.json`** (schema v2, §4). `kag.html`, the new `atlas.html`,
  and all cross-links read it through **one new module `js/kag-store.js`**
  (mirrors `js/oksat-db.js`). The in-HTML `SEED_GRAPH` stays only as an offline
  fallback. **Reason:** a term web that grows and feeds an atlas cannot live in
  one browser's localStorage or be trapped inside an HTML file.
- **D1 — The anatomy atlas is a VIEW, never a copy.** `atlas.html` renders the
  subset of `data/kag-graph.json` where `node.structure` is set (bone /
  cartilage / ligament / fascia / joint / foramen / space), grouped by
  `node.region`. Adding a structural node to the KAG makes it appear in the
  atlas with **zero atlas-code changes**. This is the "reduce redundancy /
  modules feed the atlas" mechanism.
- **D2 — Schema v2 is additive and backward-compatible.** Every new field is
  optional; v1 nodes/edges load unchanged; readers guard every new field. Bump
  `version` to 2 but never require v2 fields.
- **D3 — Subspecialty vocab is canonicalized on OKSAT's 9 keys**
  (`OKSAT_SUBSPECIALTIES`). KAG's legacy values are mapped (§3). Anatomical
  grouping moves to a **separate `region` field** (a bone can belong to
  `fundamentals`/anatomy yet a `larynx` region). Clinical subspecialty and
  anatomical region are orthogonal.
- **D4 — Cumulative cross-visitor analytics REQUIRE an external write
  endpoint.** A static Pages site cannot write to itself. Pillar 2 is therefore
  a **hybrid** (§7): a cookieless hosted analytics script for visitor/pageview
  counts + one tiny owner-hosted serverless KV endpoint for custom counters.
  The site degrades to localStorage-only counters when neither is provisioned,
  and NEVER breaks. Standing up the endpoint/account is an explicit **owner
  step** the plan flags; do not fake it with an embedded write token (a public
  site would leak it, and per-visitor commits race + spam history).
- **D5 — Medical accuracy gate.** Authored nodes are **DRAFT until owner
  review**. Authoring agents must cite a source per node, must NOT fabricate,
  and must mark anything uncertain. `status:'DRAFT'` on the file + a
  `review:false` flag per authored node; a node is not "vetted" until a resident
  clears it. Prefer owner-supplied source text; else web research with
  citations.
- **D6 — No build step, ever.** New JS files are IIFEs exposing `window.*`,
  loaded as plain `<script>` in a fixed order, every consumer guarded with
  `window.X && …`. Dev-only tooling (validators) may use Node but is never
  shipped to Pages.
- **D7 — Subagent-first construction.** The bulk content work (term web +
  structural atlas) is fanned out to parallel authoring subagents against a
  strict JSON contract, each shard validated then merged (§9). One human/owner
  review pass gates clinical accuracy.

---

## 3. Subspecialty & type reconciliation (do this before authoring anything)

**Canonical subspecialty keys** = the 9 in `OKSAT_SUBSPECIALTIES`:
`otology, rhinology, laryngology, hn_onc, fprs, pediatrics, sleep, endocrine,
fundamentals`.

**Legacy KAG → canonical map** (executor adds this table to `js/kag-store.js`
and to `kag-extract.html`'s prompt):

| KAG legacy | Canonical |
|---|---|
| `head-neck-onc` | `hn_onc` |
| `peds-ent` | `pediatrics` |
| `facial-plastics` | `fprs` |
| `skull-base` | `otology` (clinical home) + `region:'skull-base'` |
| `otology`,`rhinology`,`laryngology` | unchanged |

**`region` enum (new, atlas grouping):** `temporal-bone, skull-base,
facial-skeleton, nasal-sinus, larynx, neck, oral-pharynx, cervical-spine-hyoid,
external-ear`. Extendable; keep kebab-case.

**`structure` enum (new, atlas membership):** `bone, cartilage, ligament,
fascia, joint, foramen, space, membrane, muscle` (muscle/space/foramen included
as connective context; the atlas defaults to showing bone/cartilage/ligament/
fascia and lets the user toggle the rest). `structure:null` = non-structural
(pathology, procedure, nerve, vessel, concept) → not in the atlas view.

**Node `type` enum stays as-is** (backward compat). Structural classification
rides on the new `structure` field, not on `type` (a `type:'anatomy'` node gets
`structure:'bone'`). The KAG's `NODE_COLORS` remains valid; the atlas colors by
`structure` instead.

---

## 4. Schema v2 — exact shapes (the contract every subagent obeys)

### 4.1 `data/kag-graph.json`
```jsonc
{
  "version": 2,
  "updated": "<ISO>",
  "status": "DRAFT — pending clinical review by owner (OHNS resident).",
  "sources": ["AAO-HNSF Core Curriculum", "Cummings 7e", "..."],
  "nodes": [ Node, ... ],
  "edges": [ Edge, ... ]
}
```

### 4.2 Node (v2) — new fields all optional
```jsonc
{
  // --- v1 (unchanged) ---
  "id": "cricoid-cartilage",            // kebab slug, globally unique
  "label": "Cricoid Cartilage",
  "type": "anatomy",                    // v1 enum, unchanged
  "subspecialty": "laryngology",        // one of the 9 canonical keys
  "detail": "Only complete cartilaginous ring of the airway...",
  "sources": ["Cummings 7e"],           // >=1 required for authored nodes (D5)
  "corrections": [],
  "leitner": { "box": 1, "nextReview": "<TODAY>" },

  // --- v2 additive ---
  "aliases": ["signet ring cartilage"], // synonyms → search + term DB
  "abbrev": null,
  "structure": "cartilage",             // §3 enum, or null (non-structural)
  "region": "larynx",                   // §3 enum, or null
  "laterality": "midline",              // midline | paired | null
  "oksat": {                            // links INTO OKSAT (may be empty)
    "modules": [],                      // manifest slugs
    "concepts": [],                     // [{ "module": "<slug>", "concept": "<cKey>" }]
    "topics": []                        // OKSAT_TAXONOMY topic ids
  },
  "review": false                       // true once a human vets it
}
```

### 4.3 Edge (v2) — new relation types + spatial seed
```jsonc
{
  "source": "cricothyroid-joint",
  "target": "cricoid-cartilage",
  "type": "part_of",                    // enum below
  "label": "articulates at facet",      // optional human phrase
  "direction": "inferior",              // OPTIONAL spatial seed for 3D-later:
                                        // superior|inferior|medial|lateral|
                                        // anterior|posterior|deep|superficial|null
  "sources": []                         // optional
}
```
**Edge `type` enum v2** = v1 eleven values **plus** structural relations:
`articulates_with, attaches_to, part_of, bounded_by, continuous_with,
passes_through, transmits, suspends, forms`. (v1: `innervates, supplies,
drains_to, landmark_for, complication_of, differentiates_from, treats,
staged_with, arises_from, contained_in, branches_from`.)

**Validation rules (every shard, every phase):**
1. `id` unique across the whole graph; kebab-case; `[a-z0-9-]+`.
2. Every edge `source`/`target` resolves to a node `id` in the merged graph
   (no dangling). Edge `type` ∈ enum. Node `type` ∈ enum. `subspecialty` ∈ 9
   canonical. `structure`/`region` ∈ enum or null.
3. Authored node has ≥1 `sources` entry and `review:false` (D5).
4. `oksat.concepts[].module`/`.concept` resolve to a real module/CONCEPT key
   (validated against Appendix A / `loadModules()`), else dropped with a warning
   (lazy, never throw — mirror `OKSATGraph.audit()`).
5. Dedup: nodes by `id` (first-write-wins on merge unless the newer has
   `review:true`), edges by `source|target|type`.

---

## 5. Phase map (dependencies)

```
Phase 0  Externalize KAG + kag-store + deep links        (foundation)   [DONE]
Phase 1  Schema v2 fields + module↔KAG links + extractor upgrade        [DONE]
Phase 2  Term-web expansion  (subagent fan-out, per subspecialty)       [DONE]
Phase 4  Structural anatomy atlas (subagent fan-out, per region)        [DONE]
Phase 4b Atlas relationship augmentation (subagent fan-out, per region) [DONE]
Phase 3  Usage analytics (hybrid; owner provisions endpoint)            [DEFERRED — owner call 2026-07, not needed for now]
Phase 5  Navigation, docs, versioning, hygiene                          [DONE — nav in P4, docs/hygiene here; analytics parts N/A (P3 deferred)]
```

**Plan amendment (2026-07, owner):** Phase 3 (usage analytics) is deferred —
not necessary for now. Inserted **Phase 4b** before Phase 5: augment the
structural atlas with additional anatomic features and, especially,
relationships (articulations, attachments, boundaries, part-of hierarchies),
fanned out per anatomical region. All authored content stays `review:false`
for the owner's later curated-source stress test.
Each phase ends with a runnable site (`python3 -m http.server 8000`) and its
checklist passing. One commit per phase on
`claude/oto-kag-anatomy-atlas-x19jfa`.

---

## 6. Phase 0 — Externalize the KAG (foundation, near-zero visible change)

**Goal:** move the graph out of the HTML into a committed file read through a
store, without changing what the user sees.

**Steps**
1. **Extract the seed → `data/kag-graph.json`.** Copy the current `SEED_GRAPH`
   (kag.html ~988–1084) into the v2 wrapper (§4.1); for each node add the v2
   fields as empty/null (`aliases:[]`, `structure:null`, `region:null`,
   `laterality:null`, `oksat:{modules:[],concepts:[],topics:[]}`, `review:true`
   — the seed is already vetted). Normalize the one `skull-base` node to
   `subspecialty:'otology'` + `region:'skull-base'`. Do NOT change ids/labels/
   details (progress keys off ids). Keep `version:2`.
2. **New `js/kag-store.js`** (IIFE → `window.KAGStore`), mirroring
   `js/oksat-db.js`:
   ```
   fetch()            // GET data/kag-graph.json?ts=... no-store; fallback SEED
   merge(fileGraph)   // fileGraph ∪ localStorage['kag-graph']; dedup rules §4.5
   load()             // merged graph (what kag.html should render)
   save(graph)        // write localStorage['kag-graph'] (unchanged key)
   download(graph)    // Blob → kag-graph.json (commit-to-persist path)
   push(graph, token) // GitHub Contents API PUT data/kag-graph.json (owner path)
   reverseConcept()   // {"<module>:<cKey>": [nodeId,...]}  built from node.oksat
   normSub(x)         // legacy→canonical map (§3)
   audit()            // dangling edges, bad enums, id dupes (console helper)
   ```
   Reuse `oksat-db.js`'s `REPO`, token-never-persisted discipline, and merge
   idioms verbatim where possible.
3. **Refactor `kag.html`** to boot from the store: on load
   `KAGStore.fetch().then(f => render(KAGStore.merge(f)))`; keep `SEED_GRAPH`
   only inside the `fetch` catch. Self-test, corrections, filters, search,
   import/export **unchanged** (they still read/write `localStorage['kag-graph']`
   through `saveGraph`). Add `<script src="js/kag-store.js">` before the inline
   script.
4. **Deep link `?node=<id>`** in `kag.html`: on boot, if present, center +
   isolate that node's neighborhood (reuse the existing double-click isolate
   path). Unknown id → no-op + toast. This is the anchor every "open in KAG"
   link (Phase 1) will target.
5. **Sync panel** in the KAG Settings modal (copy OKSAT's): "Download merged
   graph" + "Push via token" using `KAGStore.download/push`. This is how the
   term web persists to the repo.

**Verify:** kag.html renders the identical 40-node graph, now sourced from
`data/kag-graph.json` (confirm via Network tab). Self-test due counts, grading,
corrections inbox, import/export, filter pills, search all behave as before.
`kag.html?node=cochlea` opens focused on the cochlea. `KAGStore.audit()` returns
`[]`. Delete `data/kag-graph.json` locally → falls back to seed, no crash.

---

## 7. Phase 1 — Schema v2 + module↔KAG links + extractor upgrade

**Goal:** make the graph richer and *bidirectionally* connected to OKSAT.

**Steps**
1. **Apply v2 fields to the seed** (already present as empty from Phase 0) and
   **populate `oksat` links for the 40 seed nodes** where obvious (e.g. node
   `cochlea` → concepts in `pediatrics`/`vestibular-schwannoma`; `facial-nerve`
   → facial-reanimation/VS `facial-nerve`; `stapes`/`oval-window` → otology
   concepts). Use Appendix A to pick exact `{module,concept}` pairs. Also set
   `structure`/`region` for the 40 seed nodes (they are all temporal-bone; most
   are `structure:'bone'|'space'|'membrane'`, ossicles `bone`, TM `membrane`,
   annular ligament etc. — see Phase 4 for the exhaustive ear list).
2. **Extractor (`kag-extract.html`) upgrade:** extend the SYSTEM_PROMPT + schema
   to emit v2 fields — `aliases`, `structure` (from the enum or null), `region`,
   `laterality`, and `oksat.concepts` when the text names a concept that maps to
   a module (give the model Appendix A as a lookup, or instruct it to leave
   `oksat` empty for a human/Phase-1 mapping pass). Normalize `subspecialty` to
   the 9 canonical keys via the §3 map. Keep the merge target
   `localStorage['kag-graph']` **and** add a "Download shard" button so
   extractor output can be committed to `data/kag-graph.json` through the store.
3. **Module→KAG reverse index** at runtime: `KAGStore.reverseConcept()` builds
   `"<module>:<concept>" → [nodeId]` from every node's `oksat.concepts`. No new
   data file needed — the links live on the nodes (single source of truth).
4. **Traversal UI — KAG side (`kag.html` node panel):** when a node has
   `oksat.concepts`, render **"Practice"** chips linking
   `oksat-study.html?m=<module>&c=<concept>`; when it has `oksat.topics`, a
   **"Adaptive drill"** chip → `oksat-adaptive.html?t=<topicId>`; when
   `oksat.modules`, a **"Open module"** chip. Chips use OKSAT subspecialty hues.
5. **Traversal UI — OKSAT side:**
   - `js/oksat-atlas.js`: on **concept** tap, if `KAGStore.reverseConcept()` has
     a node for `<slug>:<concept>`, offer/deep-link `kag.html?node=<id>` (make
     the crossover node-level & bidirectional, not just the single `kag` hub
     node). Guard on `window.KAGStore`.
   - Add `<script src="js/kag-store.js">` to `oksat.html` (and later
     `oksat-study.html`) so the reverse index is available. Guard everything.
6. **Data-hygiene fix:** resolve the duplicate `CHL` key in
   `js/mcq-modules/pediatrics.js` (rename the concept-level one, e.g.
   `CHL-overview`, and update any items referencing it) — do this carefully,
   re-run the module, keep item count at 40. If risky, leave it and note it in
   Appendix A as a known collision the mapping must treat as one node.

**Verify:** a seed node with links shows Practice/Adaptive chips that open the
right question set; an OKSAT concept node with a KAG match round-trips to
`kag.html?node=…` and back; extractor emits v2 fields and normalized
subspecialties; `KAGStore.reverseConcept()` has no entries pointing at
nonexistent module/concept pairs; all 5 modules still load and answer.

---

## 8. Phase 2 — The term web (massive KAG expansion via subagent fan-out)

**Goal:** grow the KAG from 40 otology nodes to a web covering the whole OHNS
core content, every node linked to the OKSAT concepts/topics it supports.

**Coverage target:** every one of the 62 `OKSAT_TAXONOMY` topics gets a cluster
of nodes (entities: key anatomy, pathologies, procedures, drugs, staging/
classification concepts) and their edges; **every OKSAT concept key (Appendix A)
resolves to ≥1 KAG node** via `node.oksat.concepts`. Prioritize P1 topics first.

**Fan-out design (see §9 for the reusable playbook):**
- **Batching:** group the 62 topics into ~10 batches by subspecialty (otology,
  rhinology, laryngology, hn_onc, fprs, pediatrics, sleep, endocrine,
  fundamentals) — one **authoring subagent per batch**. Big subspecialties
  (hn_onc, otology) may split into two batches. Each batch is capped (~30–60
  nodes) so shards stay reviewable.
- **Each authoring subagent** receives: the schema v2 contract (§4), the §3
  enums + subspecialty map, its batch's taxonomy topics (with keywords), the
  relevant slice of Appendix A (so it can fill `oksat.concepts`), any
  owner-supplied source text, and the no-fabrication + cite-every-node rule
  (D5). It returns **one JSON shard** `{nodes:[...], edges:[...]}` (no wrapper),
  `review:false`, ≥1 `sources` per node.
- **Each shard is validated** by a validator pass (§9 rules + dev script
  `tools/kag-validate.mjs`) before merge: enums, dangling edges, id collisions
  against the current graph, oksat-link resolution.
- **Merge** via `KAGStore.merge` semantics into `data/kag-graph.json`; then run
  `KAGStore.audit()` and a coverage report (every taxonomy topic touched? every
  concept key resolved?).

**Content guidance for authors (bake into the agent prompt):** prefer entities
and relationships that mirror how OHNS is tested — anatomy landmarks, staging
systems (AJCC/TNM, Koos, House-Brackmann, ATA tiers, Cotton-Myer, Brodsky),
syndromes/genes, drugs, complications, and the `treats`/`complication_of`/
`differentiates_from` edges that make the web *traversable for reasoning*, not
just a glossary. Reuse existing node ids (do not duplicate `facial-nerve`,
`cochlea`, etc.); add edges to them instead.

**Verify:** node count grows to the low hundreds; `KAGStore.audit()` = `[]`;
coverage report shows 0 taxonomy topics with no nodes and 0 unresolved P1
concept keys; kag.html filter pills now light up across all 9 subspecialties;
spot-check 5 random authored nodes against their cited source; `status` stays
`DRAFT`, `review:false` on all authored nodes (owner-review gate not yet passed).

---

## 9. Subagent orchestration playbook (used by Phases 2 & 4)

A reusable, deterministic loop the executor runs for each content batch:

1. **Author.** Spawn one authoring subagent per batch with: the §4 schema, §3
   enums/map, the batch scope (taxonomy topics *or* anatomical region), the
   Appendix-A slice, owner source text if any, and the hard rules (cite every
   node; never fabricate; mark uncertainty in `detail` + keep `review:false`;
   reuse existing ids; kebab-case). **Output contract:** a single fenced JSON
   object `{nodes, edges}` and nothing else. Run authoring agents **in
   parallel** (they touch disjoint shard files, no collisions).
2. **Land the shard** to `scratch/shards/<batch>.json` (not the live file yet).
3. **Validate.** Run `tools/kag-validate.mjs <shard> data/kag-graph.json`
   (dev-only Node script implementing §4.5 exactly): reports id collisions,
   dangling edges, bad enums, unresolved oksat links, missing sources. A shard
   with errors goes back to its authoring agent via `SendMessage` with the
   error list (resume the SAME agent — it keeps context — don't respawn cold).
4. **Merge.** Only clean shards merge into `data/kag-graph.json` via the store's
   dedup rules. Merge is serial (one shard at a time) to keep the id space
   consistent.
5. **Audit + coverage.** After each merge, `KAGStore.audit()` must be `[]`; a
   coverage script prints remaining gaps; iterate.
6. **Gate.** All authored nodes stay `review:false` until the owner (resident)
   signs off. Provide a lightweight "review queue" (Phase 5) listing
   `review:false` nodes for the owner to accept (`review:true`) or flag
   (existing corrections mechanism).

**Rules for the orchestrator model:** reuse a running subagent (SendMessage)
for fixes rather than spawning a fresh cold one; keep shards small enough to
validate; never merge an unvalidated shard; never let an authoring agent write
directly to `data/kag-graph.json`.

---

## 10. Phase 3 — Usage analytics (visitors, uses, question stats)

**Honest constraint (D4):** cumulative cross-visitor stats need an external
write endpoint. This phase is a hybrid; it degrades gracefully and never blocks
the rest of the build.

**3a — Visitor / pageview counts (automatic, zero maintenance).**
Add **GoatCounter** (free for a personal medical-ed site, cookieless, no consent
banner) as one `<script>` include on every page (`index.html`, `oksat*.html`,
`kag.html`, `atlas.html`, tools). Owner creates the account (**owner step** —
flagged; until then the include is a commented stub). Alternative:
Cloudflare Web Analytics (also free/cookieless) — pick one; GoatCounter exposes
a JSON API for surfacing counts on-site, so prefer it.

**3b — Custom cumulative counters (owner-hosted serverless KV).**
Stand up **one tiny endpoint** the site owns. Recommended: **Cloudflare Worker +
KV** (closest to the existing `fetch`-read / `PUT`-write model) or **Deno Deploy
+ Deno KV / Upstash Redis** if atomic increments are wanted (Workers KV has no
atomic increment and a ~1k writes/day cap — use Durable Objects / Deno KV
`sum` / Redis `INCR` if concurrency is real). API:
```
POST /inc   { metric: "questions_answered" | "module_completed" |
              "kag_reviewed" | "adaptive_generated", by?: 1, ctx?: "<slug>" }
              -> atomic add; 204
GET  /stats -> { questions_answered: N, module_completed: N, ...,
                 per_module: { "<slug>": N }, updated: ISO }
```
CORS allow-origin = the Pages origin. **Commit the Worker source** to
`serverless/usage-worker.js` (documented, deployed off-Pages by the owner —
**owner step**, needs their Cloudflare/Deno account + secret). No token ships in
the site; the endpoint is write-open only for `/inc` with a fixed small
allowlist of metric names and simple rate limiting.

**3c — Client `js/usage.js`** (IIFE → `window.Usage`, guarded, fail-safe):
```
inc(metric, ctx)   // fire-and-forget POST /inc; also bump a localStorage
                   // mirror ('usage:local:<metric>') so per-browser numbers
                   // exist even with no endpoint
stats()            // GET /stats (cache 60s); resolves to {} if no endpoint
endpoint()         // reads a config const; '' disables network entirely
```
If `endpoint()` is empty, `inc` only writes localStorage and `stats` returns the
localStorage mirror — the site is fully functional, just per-browser (state this
limitation in the UI).

**3d — Instrument the hooks (all guarded on `window.Usage`):**
- `js/oksat-engine.js` `recordAnswer` → `Usage.inc('questions_answered', slug)`;
  on module completion → `Usage.inc('module_completed', slug)`.
- adaptive controller (`js/oksat-adaptive.js`) → `Usage.inc('adaptive_generated',
  topicId)` and `questions_answered`.
- `kag.html` `scoreCard` → `Usage.inc('kag_reviewed')`.
- Add `<script src="js/usage.js">` to every page (after other stores).

**3e — Usage surface.** A read-only **"Usage" panel** (a new hub tab in
`oksat.html`, lazy-loaded like Progress/Atlas, and a small footer line on
`index.html`) that shows cumulative totals from `Usage.stats()` (+ GoatCounter
JSON for visitors/pageviews if configured). Tokens only, empty-states
everywhere, no charts library (hand-rolled numbers/bars per OKSAT convention).

**3f — Durable history (optional, reuses repo-as-DB).** A nightly **GitHub
Action** (`.github/workflows/usage-snapshot.yml`) fetches `/stats` and commits
it into `data/usage-stats.json` so the repo keeps an auditable cumulative
record. Keeps live counting off the critical path; the site can also read this
committed file as a fallback for `stats()`.

**Privacy note (owner-facing + a one-line site notice):** hosted analytics send
requests to a third party (cookieless, no banner legally needed but disclose it);
the owned endpoint keeps custom counters on infrastructure the owner controls.

**Verify:** with the endpoint live, answering questions in two different
browsers increments the SAME `/stats` totals (cumulative, cross-visitor); the
Usage panel shows growing numbers; with the endpoint disabled
(`endpoint()===''`), the whole site works and shows per-browser localStorage
counts labeled as such; GoatCounter records pageviews; the nightly Action writes
`data/usage-stats.json`.

---

## 11. Phase 4 — Structural anatomy atlas (view of the KAG, fan-out authored)

**Goal:** name every structural entity (bone, cartilage, ligament, fascia — plus
joints/foramina/spaces as connective tissue context) and encode every structural
relationship, as a *view* of the KAG. 3D deferred; capture the spatial seed now.

**4a — `atlas.html` (new page, structural view).**
- Boots from `KAGStore.load()`; **filters** to `node.structure ∈
  {bone,cartilage,ligament,fascia,joint,foramen,space,membrane}` and edges whose
  `type` is structural (`articulates_with, attaches_to, part_of, bounded_by,
  continuous_with, passes_through, transmits, suspends, forms`) OR whose both
  endpoints are structural.
- **Groups by `region`** (§3 enum): a region navigator (temporal bone, skull
  base, facial skeleton, nasal/sinus, larynx, neck, oral-pharynx, hyoid,
  external ear). Reuse the Cytoscape + dark-graph aesthetic of `kag.html` (or a
  cleaner region-panel list). Color by `structure` (bone/cartilage/ligament/
  fascia each a hue; muscle/space/foramen togged).
- **Structure detail panel:** name, aliases, region, laterality, and grouped
  relationship lists — *Articulates with* / *Attaches to* / *Part of* /
  *Bounded by* / *Transmits* — each a link to the related structure (and, via
  `node.oksat`, a "Practice" chip into OKSAT).
- **Redundancy reduction is automatic:** the atlas holds no data of its own; a
  structure exists once in the KAG and is referenced everywhere.
- **3D-later hooks:** the atlas reads `edge.direction` and `node.laterality`;
  encode them now so a future 3D layer has spatial seed data. No 3D rendering in
  this phase (explicitly deferred by the owner).

**4b — Structural content fan-out (playbook §9), one authoring agent per
region.** Each agent exhaustively names structures + relationships for its
region, reusing existing KAG ids and adding missing ones, setting `structure`,
`region`, `laterality`, spatial `direction` on edges, and `oksat` links where a
module tests it. Regions and their must-cover scope:

- **Temporal bone / external & middle ear** (extends the seed): squamous /
  petrous / mastoid / tympanic parts; ossicles (bone) + their **ligaments**
  (annular, anterior/lateral/superior malleal, posterior incudal, stapedial);
  tympanic membrane (membrane); otic capsule; auricular **cartilage**;
  tympanomastoid/tympanosquamous sutures.
- **Skull base & cranial foramina:** sphenoid, ethmoid, frontal, occipital,
  temporal, parietal bones; foramina (ovale, rotundum, spinosum, lacerum,
  magnum, jugular, carotid canal, IAC, stylomastoid, hypoglossal, cribriform,
  optic canal, SOF, IOF) with `transmits` edges to the nerves/vessels already in
  the KAG.
- **Facial skeleton:** maxilla, mandible (+ landmarks), zygoma, nasal bones,
  frontal, lacrimal, palatine, vomer, inferior turbinate; facial buttresses;
  **TMJ** (joint) + articular disc; sutures.
- **Nasal / sinus:** septal (quadrangular) cartilage, upper/lower lateral
  cartilages, sesamoid cartilages; bony septum (perpendicular plate of ethmoid +
  vomer); turbinates; sinus walls; keystone area (`continuous_with`).
- **Larynx:** cartilages (thyroid, cricoid, arytenoid, corniculate, cuneiform,
  epiglottis); **joints** (cricothyroid, cricoarytenoid); **ligaments/membranes**
  (thyrohyoid membrane, cricothyroid ligament / conus elasticus, quadrangular
  membrane, vocal ligament, vestibular ligament, hyoepiglottic, thyroepiglottic,
  cricotracheal); hyoid bone.
- **Neck fascia & spaces:** superficial cervical fascia (+ platysma); deep
  cervical fascia — superficial/investing, middle (pretracheal/visceral +
  buccopharyngeal), deep (prevertebral + alar); carotid sheath; **spaces**
  (parapharyngeal, retropharyngeal, danger, prevertebral, submandibular,
  masticator, parotid, visceral) with `bounded_by` edges to their fascial walls.
- **Oral cavity / pharynx / hyoid suspension:** pterygomandibular raphe;
  stylohyoid / stylomandibular / sphenomandibular **ligaments**; constrictor
  skeletal attachments; hyoid `suspends`/`attaches_to` relations.

**4c — Validate + merge** per §9, with extra **structural-completeness checks:**
every `bone` has ≥1 `articulates_with`; every `cartilage` in the larynx has its
joints/ligaments; every `fascia` has ≥1 `bounded_by`/`continuous_with`; no
orphan structural node (structure set but no structural edge).

**Verify:** `atlas.html` renders each region with every structure named; clicking
a bone lists its articulations and the foramina it contains; a new structural
KAG node (add one by hand) appears in the atlas with **no atlas code change**
(proves D1); `oksat` "Practice" chips deep-link correctly; `edge.direction`
present on a sample so a future 3D layer has data; `KAGStore.audit()` = `[]`.

---

## 12. Phase 5 — Navigation, docs, versioning, hygiene, regression

- **Navigation (`index.html` tools section, ~lines 139–164):** add an **Anatomy
  Atlas** card (`atlas.html`); keep KAG/OKSAT/Extractor cards; ensure the KAG
  and Atlas describe their relationship. Verify all tool links.
- **Owner review queue:** a small view (in `kag.html` Settings or a
  `kag-review.html`) listing `review:false` nodes grouped by subspecialty, with
  Accept (`review:true`) / Flag (existing corrections) buttons, writing through
  `KAGStore`. This is how DRAFT content graduates (D5).
- **Docs:** new `docs/kag-schema.md` (v2 node/edge, enums, §3 map),
  `docs/authoring-kag.md` (the subagent/human authoring contract + §9 playbook),
  `docs/usage-analytics.md` (endpoint spec, deployment steps, privacy). Update
  `README.md` file tree (add `data/kag-graph.json`, `js/kag-store.js`,
  `js/usage.js`, `atlas.html`, `serverless/usage-worker.js`), `WIP.md`, and note
  in `docs/oksat-plan.md` §8 that the KAG is now externalized + OKSAT-linked.
- **Versioning / merge:** `data/kag-graph.json` `version:2`, monotone additive
  merge (never delete unknown fields; `review:true` wins on dedup). Extend any
  reset scanner to leave `kag-graph`/`kag-api-key` intact and clear only
  `usage:local:*` mirrors when the user resets usage counts.
- **Full regression:** re-walk Phase 0–4 checklists; confirm the 5 OKSAT modules,
  hub Atlas, adaptive page, Forge, font themes, day/night, and the KAG self-test
  are all unbroken; Network tab shows only expected files + the (optional)
  analytics/endpoint calls.

---

## 13. Cross-cutting risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Externalizing KAG breaks self-test/progress (ids change) | 0 | Keep ids/labels byte-identical; only wrap + add optional fields |
| Subspecialty vocab mismatch corrupts filters/links | 1 | `normSub` map applied on read + in extractor; test both pill sets |
| Fabricated / wrong medical facts at scale | 2,4 | D5: cite every node, `review:false`, owner gate, DRAFT status; prefer owner source text |
| Dangling edges / id collisions from parallel shards | 2,4 | `tools/kag-validate.mjs` before every merge; serial merges; `audit()` must be `[]` |
| Analytics can't be truly automatic on static host | 3 | D4 hybrid; graceful localStorage fallback; owner-provisioned endpoint clearly flagged |
| Embedded write token leak / commit-spam race | 3 | Never ship a token; use owned KV endpoint with atomic inc; keep Contents-API push owner-only |
| Atlas duplicating anatomy already in KAG | 4 | D1: atlas is a filtered view, holds no data; reuse ids, add edges |
| Script load-order errors (no bundler) | all | Fixed order, every consumer `window.X &&`-guarded, degrades to prior behavior |
| Subagent cold-restart waste | 2,4 | Reuse running agents via SendMessage for fixes; small shards |

---

## 14. Execution order, ownership, and the human-in-the-loop steps

**Order:** 0 → 1 → 2 → 3 → 4 → 5. Phase 3 can run in parallel with 2/4 (it
touches different files) but needs Phase 0's page structure.

**Owner (human) steps — flag these explicitly, do not fake them:**
1. Provision the analytics account (GoatCounter/Cloudflare) — Phase 3a.
2. Deploy the serverless counter endpoint + set its origin allowlist — Phase 3b.
3. Supply source text where available, and run the **clinical review** pass over
   `review:false` nodes — Phases 2/4/5 (accuracy gate D5).
Everything else is executable by the model fleet without secrets. Until owner
steps land, the site ships with analytics stubbed/degraded and content in DRAFT
— fully functional, honestly labeled.

---

## 15. Critical files

| File | Role |
|---|---|
| **New** `data/kag-graph.json` | Canonical graph (term web + atlas source) |
| **New** `js/kag-store.js` | fetch/merge/save/download/push/reverseConcept/normSub/audit |
| **New** `js/usage.js` | client counters (POST /inc, GET /stats, localStorage fallback) |
| **New** `atlas.html` | structural view of the KAG (Phase 4) |
| **New** `serverless/usage-worker.js` | owner-deployed KV counter endpoint (off-Pages) |
| **New** `tools/kag-validate.mjs` | dev-only shard validator (§4.5) |
| **New** `docs/kag-schema.md`, `docs/authoring-kag.md`, `docs/usage-analytics.md` | contracts + ops |
| `kag.html` | boot from store, `?node=`, v2 fields, Practice/Adaptive chips, Sync panel |
| `kag-extract.html` | emit v2 fields, normalize subspecialty, download-shard |
| `js/oksat-atlas.js` | node-level bidirectional KAG crossover |
| `js/oksat-engine.js`, `js/oksat-adaptive.js` | `Usage.inc` hooks |
| `oksat.html` | Usage tab; kag-store include |
| `index.html` | Anatomy Atlas nav card; footer usage line |
| `js/mcq-modules/pediatrics.js` | duplicate `CHL` key fix |

---

## 16. End-to-end acceptance (final walk, `python3 -m http.server 8000`)

1. KAG loads from `data/kag-graph.json`; self-test, corrections, import/export,
   filters, search unchanged; `?node=<id>` focuses.
2. A KAG node deep-links into the right OKSAT questions; an OKSAT concept node
   deep-links back to `kag.html?node=…`.
3. Term web spans all 9 subspecialties; every P1 taxonomy topic and every OKSAT
   concept key resolves to KAG nodes; `audit()` clean; authored nodes DRAFT.
4. `atlas.html` names every structure by region with articulation/attachment/
   boundary lists; adding a structural node needs no atlas code change; spatial
   `direction` present for the future 3D layer.
5. Usage: with endpoint, two browsers grow the SAME cumulative `/stats`; Usage
   panel shows totals + visitors; with endpoint off, site works, per-browser
   counts labeled honestly; nightly Action snapshots `data/usage-stats.json`.
6. Regression: 5 OKSAT modules, hub Atlas, adaptive, Forge, font themes,
   day/night, KAG self-test all intact.

---

## Appendix A — OKSAT module concept keys (verbatim; load-bearing)

*Executors copy exact KEY strings when writing `node.oksat.concepts`. Full
label/domain tables were extracted from `js/mcq-modules/*.js`; the keys are
reproduced here so authoring subagents can link without re-reading the modules.*

**`pediatrics` (40 mcq)** — DOMAINS: foundations, CHL, SNHL, syndromic, workup,
management, cases. Concept keys: embryology, external-ear, middle-ear,
inner-ear, ossicles, EAC, first-arch, physiology, tonotopy, NIHL, mechanism,
potassium, collagen, vestibular, epidemiology, CHL *(⚠ duplicated key — treat as
one node; fix per §7.6)*, atresia, jahrsdoerfer, BCD, cholesteatoma, congenital,
acquired-SNHL, cCMV, ototoxicity, mitochondrial, genetic-SNHL, GJB2, meningitis,
syndromic-AD, syndromic-AR, syndromic-XL, BOR, treacher-collins, waardenburg,
CHARGE, pendred, EVA, usher, DFN3, alport, JLN, audiology, ANSD, imaging,
diagnosis, workup, EHDI, screening, surgical, treatment, CI, emerging,
gene-therapy, cases.

**`ta-tubes` (54 mcq)** — DOMAINS: foundations, bmt, tonsillectomy, neck,
complications, cases. Concept keys: embryology, tm-anatomy, middle-ear,
eustachian-tube, physiology, tonsil-anatomy, adenoid-anatomy, waldeyer,
cranial-nerves, imaging, workup, OME, tubes, myringotomy, tympanometry, SSCD,
OSA, brodsky, extracapsular, intracapsular, capsule, tonsil-dissection,
adenoidectomy, tonsillar-artery, regrowth, dissection-plane, hemostasis,
nodal-anatomy, lymphadenitis, node-malignancy, node-dissection, spinal-accessory,
carotid, hemorrhage, VPI, dysphagia, tube-complications, airway-edema, horner,
cases, anesthesia, counseling, seizure, cochlear-implant.

**`vestibular-schwannoma` (46 mcq)** — DOMAINS: anatomy, pathophysiology,
epidemiology, diagnosis, treatment, complications, NF2, cases. Concept keys: CPA,
IAC, nerve-quadrants, surrounding-anatomy, tumor-size, tumor-origin,
molecular-genetics, histopathology, incidence, tumor-growth,
hearing-natural-history, vestibulopathy, presentation, clinical-exam, MRI, Koos,
audiology, differential, observation, surgery, translabyrinthine, retrosigmoid,
middle-fossa, radiosurgery, medical-therapy, rehabilitation, facial-nerve,
CSF-leak, meningitis, headache, vascular, recurrence, NF2, manchester-criteria,
bilateral-VS, cases.

**`facial-reanimation` (42 mcq)** — DOMAINS: anatomy, physiology, evaluation,
workup, treatment, complications, cases. Concept keys: pharyngeal-arch,
nerve-segments, geniculate-branches, tympanic-segment, mastoid-branches,
extratemporal, surface-landmarks, NFFP, synkinesis, bilateral-palsy,
exam-findings, house-brackmann, sunnybrook, bells-palsy, imaging,
electrodiagnostics, acute-repair, nerve-transfer, CFNG, muscle-transfer, eyelid,
NFFP-treatment, chemodenervation, corneal, case-scc, case-acoustic, case-ramsay.

**`dtc-risk-stratification` (25 recall)** — DOMAINS: staging, operative,
completion, pathology, riskStrat, controversy. Concept keys: t-category,
age-pivot, downstaging, nodal-class, lobectomy, total-thyroidectomy, gross-ete,
rai, conversion-rate, completion-indications, rln, nodal-completion, micro-ete,
path-report, subtype, familial, niftp, ata-system, ata-tiers, focality,
vascular-invasion, nodal-risk, molecular, case, controversy.
