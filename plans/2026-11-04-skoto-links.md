# Spec: link OKSAT modules and guides to sk.oto (2026-11-04)

> Ponytail spec. Supersedes `plans/2026-11-04-wiki-links.md` (branch `claude/issue-174-spec`). Status lives in GitHub Issues. Commits: one short line, no trailers.

## 0. Context (facts, read from the repo on 2026-11-04)

- The knowledge graph is retired for good (owner, 2026-11-04). `archive/` keeps it; nothing serves it. This spec does not revive it.
- **sk.oto is the Obsidian vault** (outside this repo). Its web form is a Quartz 5 wiki in a separate repo, `skflx/ent-wiki`, meant for `skflx.github.io/ent-wiki/`. **It is not live**: `wiki/README.md` says "not live, nothing here is built, served, or linked", the Bootstrap steps are undone, and `https://skflx.github.io/ent-wiki/` returned HTTP 404 when checked today. There is no URL to link to yet.
- `wiki/content/` is a **subset**, not the vault: `index.md` plus six maps of content, listed in `wiki/content/.vault-sync.json`, one per folder (the file names are the long titles, "The ... Knowledge Graph provides a structured mastery curriculum.md"):
  `Otology/`, `Sinus/`, `Laryngology/`, `Head_and_Neck/`, `FPRS/`, `Pediatrics/`. Every map has `vetted: ""` and the `#unvetted` banner. No other vault note is public.
- **The gate that blocks everything else**: `wiki/sync/policy.json` has `gate.tierMatches: "^Master Map of Content"` (phase 1), `includeRootFiles: []`, `statusIn: ["complete"]`. `sync-vault.mjs` (line ~230) skips any note whose `tier` does not match, and nothing outside the six folders is on the allowlist. `docs/oksat-learn-roadmap.md` Phase A proposes moving the gate to a `role` tag (`map`, `reference`); `sync-vault.mjs` has no `roleIn` yet, so that is not built. Opening the gate is the owner's call (`docs/decisions.md` §7).
- OKSAT keys: `OKSAT_MANIFEST` modules (17 files) and `OKSAT_GUIDES` (`ar-crs-aerd`, `ear-anatomy`, the latter `unlisted`) both carry `subspecialty`, a key of `OKSAT_SUBSPECIALTIES` (`js/oksat/manifest.js`). The ear-anatomy chapters have `ref: []` section slots (Phase C, `docs/oksat-learn-roadmap.md`), all empty and rendered nowhere.

## 1. Owner decisions (what this spec chooses; veto any)

1. **Mapping lives in one place**: a six-line table `OKSAT_SKOTO` in `js/oksat/manifest.js`, keyed by the `subspecialty` every module and guide already has. No per-entry field.
2. **Module-level only**: one link per guide or module, to its subspecialty's published map of content. No section or concept links in v1.
3. **Links are checked by plain string rules in `check-data`** against `.vault-sync.json`; no network.
4. **A single constant `OKSAT_SKOTO.live` (default `false`) gates all visible change.** The owner flips it after the wiki deploys.
5. **No vault text enters this repo.** Link label and target are constants and published file paths; the viewer never reads wiki content.

## 2. Smallest version

In `js/oksat/manifest.js`, below `OKSAT_SUBSPECIALTIES`:

```js
window.OKSAT_SKOTO = {
  live: false,                       // owner flips after ent-wiki deploys
  base: 'https://skflx.github.io/ent-wiki/',
  maps: {                            // subspecialty -> vault path of its published map, no .md
    otology:     'Otology/The Otology and Lateral Skull Base Knowledge Graph provides a structured mastery curriculum',
    rhinology:   'Sinus/The Rhinology and Skull Base Knowledge Graph provides a structured mastery curriculum',
    laryngology: 'Laryngology/The Laryngology Knowledge Graph provides a structured mastery curriculum',
    hn_onc:      'Head_and_Neck/The Head and Neck Oncology Knowledge Graph provides a structured mastery curriculum',
    fprs:        'FPRS/The FPRS Knowledge Graph provides a structured mastery curriculum',
    pediatrics:  'Pediatrics/The Pediatric Otolaryngology and Sleep Surgery Knowledge Graph provides a structured mastery curriculum',
  },
};
```

`sleep`, `endocrine`, `fundamentals` have no key and so no link (the map set has no folder for them; see Q2).

Viewer change (`js/oksat/learn.js` and `js/oksat/viewer.js`, a few lines each): if `OKSAT_SKOTO.live` and `maps[entry.subspecialty]` exists, add one `<a>` to the page header, text `Read the map in sk.oto` (constant), `href = base + slug(path)`, `target=_blank`, `rel="noopener"`. Built with `createElement`/`textContent`/`.href`; nothing reaches `innerHTML`. The hub does not change.

`slug(path)` = path with each space replaced by `-`, URL-encoded per segment (Quartz's slug rule; see risk R1). Defined once, used by the viewers and by `check-data`.

Why subspecialty-keyed and module-level is enough: the public set is six maps, one per subspecialty. A section link has no finer target to point at until reference notes are published, so the `ref: []` slots stay empty and unused. Adding them now would be a feature for later, which the owner ruled out.

## 3. Non-goals (named skips)

- No section/chapter/concept links, no filling of `ref: []`, no "Related in sk.oto" chapter foot.
- No wiki-to-OKSAT backlinks ("Learn this" lines) and no change to `wiki/sync/`, `policy.json`, or the gate.
- No graph, search, or fetch of wiki content at runtime. No embedded wiki text, titles or summaries.
- No link on the hub, the one-pager, or `unlisted` pages beyond what the viewer already shows for them.
- Not building the wiki: Bootstrap (`wiki/README.md`) stays the owner's step.

## 4. Gate: while it is closed

`live: false` is the shipped state and stays so until the owner has (a) bootstrapped and deployed `skflx/ent-wiki`, (b) opened one map in a browser and confirmed the URL matches `base + slug(path)`, and (c) decided that linking the `#unvetted` maps is acceptable (Q1). While closed: no anchor, no header change, no request, no visible difference to a reader. The table and the check still run in CI, so the data cannot rot meanwhile. Flipping `live` is a one-line owner PR; merging is deploy.

## 5. Acceptance checks (each is a command or an assertion in `node tools/check-data.mjs`)

| # | Requirement | Check |
|---|---|---|
| A1 | Every `maps` value names a published file | `check-data` loads `OKSAT_SKOTO`, and for each value requires `value + '.md'` to be in `wiki/content/.vault-sync.json` `files`. A renamed or gated-out map fails CI. |
| A2 | Every `maps` key is a real subspecialty | key must exist in `OKSAT_SUBSPECIALTIES`; `check-data` fails otherwise. |
| A3 | No dead subspecialty | every key is used by at least one entry in `OKSAT_MANIFEST` or `OKSAT_GUIDES`. |
| A4 | Base is the fixed origin | `base` equals the literal `https://skflx.github.io/ent-wiki/`; any other string fails (no new external origin without the owner). |
| A5 | `live` is a boolean | `typeof live === 'boolean'`, plus a self-test that `'yes'` is rejected (same pattern as the `unlisted` rule). |
| A6 | Closed gate is invisible | with `live: false`, `node tools/test-oksat-learn.mjs` and `node tools/test-oksat-engine.mjs` pass unchanged and a new assertion finds no element with `href` containing `ent-wiki` on `oksat-learn.html?g=ear-anatomy` and `oksat-study.html?m=vestibular-schwannoma`. |
| A7 | Open gate renders one safe link | the same test with `live` patched true (test sets `window.OKSAT_SKOTO.live` before boot): exactly one `a[rel~=noopener]` whose `href` starts with `base`, and whose text is the constant label. A `fprs`-less entry (e.g. an `endocrine` module) shows none. |
| A8 | No vault text copied | a `check-data` rule fails if any file under `js/oksat/` or `css/` contains the title string of a map note (read from the first `title:` line of each `.vault-sync.json` file). Paths in `maps` are exempt. |
| A9 | Stamps and CSP unchanged | `node tools/stamp-assets.mjs` then `check-data` passes; no inline script or `on*` handler added. |
| A10 | Full suite | `node tools/check-data.mjs && node tools/smoke-pages.mjs` clean. |

## 6. Risks

- **R1: Quartz slug rule.** The slug used for `href` (spaces to hyphens, extension dropped) is Quartz's behaviour as the wiki repo will build it, and the map file names are very long. It is not verifiable offline. Mitigation: gate step (b) is a manual open of one map before flipping `live`. If it differs, change `slug()` in one place.
- **R2: Linking unvetted pages.** Every public map carries `vetted: ""` and the warning banner. The link is honest only if the reader meets that banner, which the wiki puts at the top of each page. Owner decision (Q1).
- **R3: Wrong map for a module.** `pediatrics` also covers sleep surgery, but a `sleep` module would have no link. Mapping is subspecialty-level, so a module in the "wrong" subspecialty links to the wrong map; fix by correcting its `subspecialty`, never by adding a per-entry override.
- **R4: Gate widening later.** When the owner opens the gate past phase 1, `.vault-sync.json` grows and A1 keeps working; a future section-level feature would need its own spec then.
- **R5: Vetting boundary.** sk.oto pages are the owner's; the repo carries paths only. Medical correctness of linked pages is not asserted by OKSAT (`docs/decisions.md` §7).

## Open questions for the owner

1. Link to maps that are `#unvetted` at all, or wait until at least one map has `vetted:` set? (Spec assumes: link only after `live` is flipped, which you control.)
2. `endocrine`, `sleep` and `fundamentals` have no map: leave them unlinked (spec default), or map `endocrine` to `Head_and_Neck` and `sleep` to `Pediatrics`?
3. Ready to bootstrap `skflx/ent-wiki`, so there is a real URL to verify (R1)? Until then this spec ships with `live: false`.
