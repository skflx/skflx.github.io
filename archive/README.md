# Archive

Content kept for its own sake, not served by the site. Nothing in this folder
is fetched by any page, referenced by any script, or checked by CI. It is here
so the data survives; deleting the tools that read it should not delete it.

## `kag-graph.json` — OHNS knowledge graph

The database behind the retired Knowledge Atlas Graph and Structural Atlas
viewers. Schema v2, hand-authored plus subagent expansion. Counts, sources,
and vetting status are recorded in the file's own top-level fields — read them
there rather than trusting a number written here.

Node shape:

```
id            kebab-case unique key
label         display name
type          anatomy | pathology | procedure | concept | nerve | vessel | drug
subspecialty  otology | rhinology | laryngology | hn_onc | fprs |
              pediatrics | sleep | endocrine | fundamentals
detail        one- or two-sentence teaching note
sources       >= 1 citation string
aliases       alternate names / abbreviations
review        true = owner-vetted; false = authored scaffolding, unverified
structure     bone | cartilage | ligament | joint | space | foramen | ...
region        temporal-bone | external-ear | skull-base | neck | ...
laterality    paired | midline
leitner       { box, nextReview } — spaced-repetition state from the old viewer
oksat         cross-links to OKSAT modules/concepts (many now stale)
```

Edge shape: `{ source, target, type, label }`, where `source`/`target` are node
ids and `type` is one of ~20 relations (`part_of`, `branches_from`,
`landmark_for`, `treats`, `complication_of`, …).

### `kag-graph-flat.txt`

A plain-text rendering of the same data — nodes grouped by subspecialty, edges
grouped by relation, one line each. Meant for reading directly or pasting into
an LLM context window. Derived, not authoritative: regenerate it from the JSON
rather than editing it.

**Read `review` before trusting a node.** Only the temporal-bone seed set was
owner-vetted; the rest is unverified scaffolding, flagged `draft` in the flat
export. It is study material, not a reference.
