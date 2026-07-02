# Authoring the KAG (nodes, edges, enrichment)

This is the committed version of the process used to build the term web and the
structural atlas. You never edit `data/kag-graph.json` by hand. Instead you
write **shards** — small `{nodes, edges}` files — and let
`tools/kag-validate.mjs` validate and merge them. The schema every shard obeys
is `docs/kag-schema.md`; read it first.

## A shard

A shard is a single JSON object with two arrays and **no file wrapper**:

```jsonc
{
  "nodes": [ Node, ... ],   // Node schema per docs/kag-schema.md
  "edges": [ Edge, ... ]    // Edge schema per docs/kag-schema.md
}
```

Drop one or more shard files into a shard directory (e.g.
`scratchpad_p2/shards/<batch>.json`). One shard per authoring scope
(subspecialty or anatomical region) keeps them small and reviewable.

## The authoring contract

1. **Kebab-case ids** (`[a-z0-9]+(-[a-z0-9]+)*`), globally unique. The validator
   warns on non-kebab ids.
2. **Reuse existing ids.** Do not re-author `facial-nerve`, `cochlea`, etc. —
   add edges *to* them. On an id collision the seed / earlier shard wins and
   your duplicate node is skipped.
3. **Cite every node:** ≥1 entry in `sources`. Authored nodes are written with
   `review:false` (the validator forces this on shard nodes regardless of what
   you put). A node graduates to `review:true` only when the owner (a resident)
   vets it.
4. **No fabrication.** If something is uncertain, say so in `detail` and leave
   `review:false`. Prefer owner-supplied source text; otherwise cite researched
   sources.
5. **Structural fields only for physical structures.** Set `structure`,
   `region`, `laterality`, and edge `direction` only on real anatomical
   structures. Non-structural nodes (pathology, procedure, nerve, vessel,
   concept) leave `structure`/`region` null and never appear in the atlas.
6. **Give every node an `oksat.topics` entry** where possible — it is how
   coverage is traced. The validator warns when a node has no topics.
7. **Every edge endpoint must resolve** to a node id in the final merged graph.
   Edges with a missing endpoint are silently dropped (no dangling edges ever
   land).

### OKSAT concept links must be real

`node.oksat.concepts` entries are `{ module: "<slug>", concept: "<cKey>" }`.
The `concept` must be a **real CONCEPTS key** of that module — the validator
loads the actual module files (`js/mcq-modules/*.js`) and checks each pair
against the module's `CONCEPTS` object. Any pair that does not resolve is
**dropped** with a warning (it does not fail the shard). Likewise
`oksat.modules` entries must be known module slugs, or they are filtered out.
Copy concept keys exactly — they are load-bearing (see the appendix in
`docs/oto-kag-atlas-plan.md`).

## Validate + merge

```bash
node tools/kag-validate.mjs --dir <shardDir> [--graph data/kag-graph.json] [--dry]
```

Defaults: `--dir scratchpad_p2/shards`, `--graph data/kag-graph.json`. Use
`--dry` to validate and print the report **without writing** the graph. The
script never throws on bad data — it coerces, drops, and reports.

**What it coerces:**

- `type` not in the node enum → `concept`.
- legacy `subspecialty` → canonical via the map; anything else → `fundamentals`.
- `structure` / `region` / `laterality` not in their enums → `null`.
- edge `type` not in the enum → `contained_in`.
- v2 fields defaulted (`aliases:[]`, `abbrev:null`, `leitner:{box:1,…}`, etc.);
  shard nodes forced to `review:false`.

**What it drops:**

- shard nodes whose `id` collides with an existing node (seed / earlier shard
  wins).
- `oksat.concepts` / `oksat.modules` entries that don't resolve to a real
  module key.
- edges whose `source` or `target` is missing from the final node set, and
  duplicate edges (`source|target|type` already present).

**Coverage report.** After merging it prints seed-vs-added node/edge counts,
collisions and dropped/dangling edge totals, structural-node and oksat-linked
counts, dropped-link count, per-shard additions, per-subspecialty node counts,
taxonomy topic coverage (with any UNCOVERED topics listed), and a final audit
of dangling edges and duplicate ids. Without `--dry` (and if no shard-parse
errors occurred) it writes the merged graph back to `--graph`.

## Fan-out pattern (how the graph was built)

Bulk authoring is fanned out: **one authoring agent per subspecialty (term web)
or per anatomical region (structural atlas)**. Each agent gets the schema, the
enums, its scope, and the relevant concept keys, and returns one shard. Each
shard is validated (fix loop: send the validator's error/warning list back to
the same agent, don't respawn cold), then merged serially so the id space stays
consistent. All authored content stays `review:false` until the owner's
clinical review pass. The full playbook is in `docs/oto-kag-atlas-plan.md` §9.

## Related

- `docs/kag-schema.md` — the v2 data model and all enums.
- `docs/oto-kag-atlas-plan.md` — master plan, architectural decisions, and the
  load-bearing OKSAT concept-key appendix.
