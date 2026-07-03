# KAG schema (v2)

The Knowledge Atlas Graph is the site's canonical OHNS knowledge graph. It lives
in one committed file, `data/kag-graph.json`, and every surface that shows graph
data (`kag.html`, `atlas.html`, the OKSAT crossover links) reads it through
`js/kag-store.js`. GitHub Pages is static, so **the JSON file *is* the
database** — there is no server and no build step. This document is the exact
contract every reader and every authored shard obeys. It is authoritative:
enums below are copied verbatim from `tools/kag-validate.mjs`.

Current graph: ~656 nodes / ~929 edges, 265 of them structural; the 40-node
temporal-bone seed is vetted (`review:true`), every other authored node is
`review:false` pending owner clinical review.

## File wrapper

```jsonc
{
  "version": 2,
  "updated": "<ISO timestamp>",
  "status": "DRAFT — pending clinical review.",   // free text; DRAFT until owner sign-off
  "sources": ["Cummings Otolaryngology 7e", "AAO-HNSF Core Curriculum"],
  "nodes": [ Node, ... ],
  "edges": [ Edge, ... ]
}
```

`version` is `2`. Schema v2 is **additive and backward-compatible**: every v2
field is optional, v1 nodes/edges load unchanged, and every reader guards each
new field.

## Node

```jsonc
{
  // --- v1 (unchanged) ---
  "id": "cricoid-cartilage",            // kebab-case slug, globally unique
  "label": "Cricoid Cartilage",
  "type": "anatomy",                    // NODE_TYPES enum
  "subspecialty": "laryngology",        // one of the 9 canonical keys
  "detail": "Only complete cartilaginous ring of the airway…",
  "sources": ["Cummings 7e"],           // >=1 required for authored nodes
  "corrections": [],                    // [{ text, source, date, resolved }]
  "leitner": { "box": 1, "nextReview": "<TODAY>" },

  // --- v2 additive ---
  "aliases": ["signet-ring cartilage"], // synonyms; feed search + term DB
  "abbrev": null,                       // short form string, or null
  "structure": "cartilage",             // STRUCTURES enum, or null (non-structural)
  "region": "larynx",                   // REGIONS enum, or null
  "laterality": "midline",              // midline | paired | null
  "oksat": {                            // links INTO OKSAT (may be empty)
    "modules": [],                      // manifest slugs
    "concepts": [],                     // [{ module: "<slug>", concept: "<cKey>" }]
    "topics": []                        // OKSAT_TAXONOMY topic ids
  },
  "review": false                       // true once a human vets the node
}
```

A node is **structural** (appears in `atlas.html`) iff `structure` is set to a
valid enum value. `structure` and `region` are orthogonal to `subspecialty`:
a bone can be `subspecialty:'fundamentals'` yet `region:'larynx'`. Clinical
subspecialty and anatomical region are separate axes.

## Edge

```jsonc
{
  "source": "cricothyroid-joint",       // must resolve to a node id
  "target": "cricoid-cartilage",        // must resolve to a node id
  "type": "part_of",                    // EDGE_TYPES enum
  "label": "articulates at facet",      // optional human phrase
  "direction": "inferior"               // optional spatial seed for a future 3D layer
}
```

Edges have no id and no weight. Edge identity for dedup is
`source|target|type`. `label` and `direction` are optional and only emitted
when present.

## Enums (verbatim from `tools/kag-validate.mjs`)

### Node `type`

| Value |
|---|
| `anatomy` |
| `pathology` |
| `procedure` |
| `nerve` |
| `vessel` |
| `drug` |
| `concept` |

Bad/absent `type` is coerced to `concept`.

### `subspecialty` — 9 canonical keys

`otology`, `rhinology`, `laryngology`, `hn_onc`, `fprs`, `pediatrics`,
`sleep`, `endocrine`, `fundamentals`.

Unknown value → coerced to `fundamentals`.

**Legacy → canonical map** (applied on read by `KAGStore.normSub` and by the
validator):

| Legacy KAG value | Canonical |
|---|---|
| `head-neck-onc` | `hn_onc` |
| `peds-ent` | `pediatrics` |
| `facial-plastics` | `fprs` |
| `skull-base` | `otology` (its clinical home; use `region:'skull-base'` for grouping) |

### `structure` (atlas membership; or `null`)

`bone`, `cartilage`, `ligament`, `fascia`, `joint`, `foramen`, `space`,
`membrane`, `muscle`.

`atlas.html` defaults to showing `bone`/`cartilage`/`ligament`/`fascia`/`joint`
and lets the user toggle the rest. `structure:null` = non-structural → not in
the atlas view.

### `region` (atlas grouping; or `null`)

`temporal-bone`, `skull-base`, `facial-skeleton`, `nasal-sinus`, `larynx`,
`neck`, `oral-pharynx`, `cervical-spine-hyoid`, `external-ear`.

### `laterality`

`midline`, `paired`, or `null`.

### Edge `type`

**v1 relational (11):** `innervates`, `supplies`, `drains_to`, `landmark_for`,
`complication_of`, `differentiates_from`, `treats`, `staged_with`,
`arises_from`, `contained_in`, `branches_from`.

**v2 structural (9):** `articulates_with`, `attaches_to`, `part_of`,
`bounded_by`, `continuous_with`, `passes_through`, `transmits`, `suspends`,
`forms`.

Unknown edge `type` is coerced to `contained_in`.

### Edge `direction` (optional spatial seed)

`superior`, `inferior`, `medial`, `lateral`, `anterior`, `posterior`, `deep`,
`superficial`, or `null`. Surfaced by the atlas now; reserved for a future 3D
layer.

## Storage & merge model

The committed file is the shared, canonical copy. Each browser also keeps its
own progress in `localStorage['kag-graph']` (Leitner boxes, corrections). On
load, readers fetch the file and merge the two — **local wins**:

- `KAGStore.fetch()` — GET `data/kag-graph.json?ts=…` with `cache:'no-store'`;
  cached after the first call; returns `null` on any failure (never throws).
- `KAGStore.merge(fileGraph)` — union of local and file. For every node the
  local copy already has (by `id`), the local node is kept; the file only
  **adds** nodes/edges the local copy is missing. Edges dedup by
  `source|target|type`. This preserves the user's progress while still pulling
  in new authored content.
- `KAGStore.save(graph)` — writes `localStorage['kag-graph']` (guarded).

### Two write paths (both require an explicit owner action)

1. **Download to commit** — `KAGStore.download(graph)` writes the merged graph
   to a `kag-graph.json` file the owner commits to the repo.
2. **Contents-API push** — `KAGStore.push(graph, token)` PUTs
   `data/kag-graph.json` via the GitHub Contents API. The fine-grained token is
   pasted at sync time, used for that request only, and **never persisted**
   (not localStorage, not the file, not the repo).

Nothing writes to the repo automatically.

### Deep links

Both `kag.html` and `atlas.html` accept `?node=<id>`: on boot they center and
isolate that node's neighborhood and open its detail panel. Unknown id → no-op
(kag) or a toast (atlas). This is the target of every "Open in KAG" /
"Practice" crossover link.

## Related

- `docs/authoring-kag.md` — how to author/enrich nodes and edges and run the
  validator.
- `docs/oto-kag-atlas-plan.md` — the master plan and architectural decisions.
