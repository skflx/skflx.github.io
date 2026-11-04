# Spec: link OKSAT to the sk.oto wiki (#174, 2026-11-04)

> Ponytail spec. Status lives in #174. Commits: one short line, no trailers.

## 0. Why the title is stale

"KAG draws from sk.oto wiki" assumed a live knowledge graph (`data/kag-graph.json`, `KAGStore`).
Neither exists: the graph was retired, its data is in `archive/` and nothing serves it (`archive/README.md`).
The wiki itself is alive in a separate repo (`skflx/ent-wiki`, published to `skflx.github.io/ent-wiki/`
once its phase gate opens; see `wiki/README.md`). So the core job is a link, not a graph.

## 1. Decision for the owner (one line)

Revive the knowledge graph? **No**: this spec does not rebuild it. If yes, #174 needs a new spec.

## 2. Smallest version

1. Add an optional `wiki` field to each `OKSAT_GUIDES` entry and each `OKSAT_MANIFEST` entry in
   `js/oksat/manifest.js`: a relative URL into `ent-wiki/`, e.g. `ent-wiki/Otology/` (the map of content
   for that subspecialty). Omitted = no link.
2. `oksat-learn.html` and `oksat-study.html` show one "Read in the wiki" link in the page header when the
   field is set. Plain `<a href>`, text from the manifest only, via `textContent`/`href` assignment.
3. `check-data` fails a `wiki` value that is absolute, starts with `/`, or contains `..`.

That is all. Five lines of JS, one `check-data` rule.

## 3. Non-goals

- No copy of vault or wiki content into this repo. `wiki/content/` stays sync-vault output only (AGENTS.md).
- No graph, no search over the wiki, no change to `wiki/sync/`.
- No change to the ear-anatomy guide until the owner removes `unlisted` (its D12 forbids vault links before Phase C).

## 4. Gate

Links go live only when the owner opens the wiki publish (phase gate in `sync-vault`). Until then the
field stays unset for every entry and nothing changes for readers.

## 5. Check

- `node tools/check-data.mjs` passes, with and without a `wiki` value.
- Add one fixture-free assertion to `check-data`: every set `wiki` value matches `^ent-wiki/[A-Za-z0-9_/-]*$`.

## 6. Risks

- A link to an unpublished `ent-wiki/` path is a 404. Gate (4) prevents it.
- Map-of-content slugs must match the wiki's folder names exactly (`Otology`, `Sinus`, ...). Check against
  `wiki/content/` before setting any value.
