# Archive

Kept content, served by nothing. No page fetches anything here, no script references it, and CI
does not check it. It is kept so the data survives, even after the tools that read it are deleted.

## `kag-graph.json`: OHNS knowledge graph

The database behind the retired atlas viewers (schema v2). Counts, sources and vetting status are in
the file's own top-level fields; read them there.

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
leitner       { box, nextReview }: spaced-repetition state from the old viewer
oksat         cross-links to OKSAT modules and concepts (many stale)
```

Edge shape: `{ source, target, type, label }`, where `source` and `target` are node ids and `type`
is one of a fixed relation set (`part_of`, `branches_from`, `landmark_for`, `treats`,
`complication_of`, …).

## `kag-graph-flat.txt`

A plain-text rendering of the same data: nodes grouped by subspecialty, edges grouped by relation,
one line each. Derived, not authoritative: regenerate it from the JSON rather than editing it.

**Read `review` before trusting a node.** Only the temporal-bone seed set is owner-vetted; the rest is
unverified scaffolding, flagged `draft` in the flat export. It is study material, not a reference.
