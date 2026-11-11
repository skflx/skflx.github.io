# Spec: link OKSAT modules and guides to sk.oto (2026-11-04, amended 2026-11-10)

> **Amended 2026-11-10 (owner):** the wiki is live at `https://skflx.github.io/ohns-wiki-skflx/`. Map URLs below are the ones the live site serves (HTTP 200 checked), stored ready to append to `base`; there is no slug function; `live` ships `true`; the check against `.vault-sync.json` is dropped (live paths are lowercase slugs, not the vault file names). Section 4 describes the pre-launch state and is kept as history.
>
> Ponytail spec. Supersedes `plans/2026-11-04-wiki-links.md` (branch `claude/issue-174-spec`). Status lives in GitHub Issues. Commits: one short line, no trailers.

## 0. Context (facts, read from the repo on 2026-11-04)

- The knowledge graph is retired for good (owner, 2026-11-04). `archive/` keeps it; nothing serves it. This spec does not revive it.
- **sk.oto is the Obsidian vault** (outside this repo). Its web form is a Quartz wiki in the separate repo `skflx/ohns-wiki-skflx`, published from the vault by that repo's own sync; this repo holds none of it (the former `wiki/` scaffold was retired 2026-11-11). Only maps of content are published, one per subspecialty folder.
- OKSAT keys: `OKSAT_MANIFEST` modules (17 files) and `OKSAT_GUIDES` (`ar-crs-aerd`, `ear-anatomy`, the latter `unlisted`) both carry `subspecialty`, a key of `OKSAT_SUBSPECIALTIES` (`js/oksat/manifest.js`). The empty `ref: []` section slots the chapters once carried were deleted 2026-11-10 (nothing read them).

## 1. Owner decisions (what this spec chooses; veto any)

1. **Mapping lives in one place**: a six-line table `OKSAT_SKOTO` in `js/oksat/manifest.js`, keyed by the `subspecialty` every module and guide already has. No per-entry field.
2. **Module-level only**: one link per guide or module, to its subspecialty's published map of content. No section or concept links in v1.
3. **Links are checked by plain string rules in `check-data`**; no network.
4. **A single constant `OKSAT_SKOTO.live` (default `false`) gates all visible change.** The owner flips it after the wiki deploys.
5. **No vault text enters this repo.** Link label and target are constants and published file paths; the viewer never reads wiki content.

## 2. Smallest version

In `js/oksat/manifest.js`, below `OKSAT_SUBSPECIALTIES`:

```js
window.OKSAT_SKOTO = {
  live: true,                        // false hides every link
  base: 'https://skflx.github.io/ohns-wiki-skflx/',
  maps: {                            // subspecialty -> published path; base + value is the exact URL
    otology:    'otology/the-otology-and-lateral-skull-base-knowledge-graph-provides-a-structured-mastery-curriculum',
    rhinology:  'sinus/the-rhinology-and-skull-base-knowledge-graph-provides-a-structured-mastery-curriculum',
    fprs:       'fprs/the-fprs-knowledge-graph-provides-a-structured-mastery-curriculum',
    pediatrics: 'pediatrics/the-pediatric-otolaryngology-and-sleep-surgery-knowledge-graph-provides-a-structured-mastery-curriculum',
  },
};
```

Only subspecialties that a module or guide in the manifest uses get a key. `laryngology` and `hn_onc` have live maps but no module yet, so no key (add one with the first module). `sleep`, `endocrine`, `fundamentals` have no map and so no link (see Q2). The wiki also serves a `trauma` map that matches no subspecialty key.

Viewer change (`js/oksat/learn.js` and `js/oksat/viewer.js`, a few lines each): if `OKSAT_SKOTO.live` and `maps[entry.subspecialty]` exists, add one `<a>` to the top bar (`.ok-topbar-actions`, styled as `ok-back`), text `Read the map in sk.oto` (constant), `href = base + maps[subspecialty]`, `target=_blank`, `rel="noopener"`. Built with `createElement`/`textContent`/`.href`; nothing reaches `innerHTML`. The hub does not change.

Why subspecialty-keyed and module-level is enough: the public set is six maps, one per subspecialty. A section link has no finer target to point at until reference notes are published, so there are no section slots. Adding them now would be a feature for later, which the owner ruled out.

## 3. Non-goals (named skips)

- No section/chapter/concept links, no "Related in sk.oto" chapter foot.
- No wiki-to-OKSAT backlinks ("Learn this" lines) and no change to what the wiki publishes.
- No graph, search, or fetch of wiki content at runtime. No embedded wiki text, titles or summaries.
- No link on the hub, the one-pager, or `unlisted` pages beyond what the viewer already shows for them.

## 4. Gate: while it is closed

`live: false` is the shipped state and stays so until the owner has (a) deployed the wiki, (b) opened one map in a browser and confirmed the URL, and (c) decided that linking the `#unvetted` maps is acceptable (Q1). While closed: no anchor, no header change, no request, no visible difference to a reader. The table and the check still run in CI, so the data cannot rot meanwhile. Flipping `live` is a one-line owner PR; merging is deploy.

## 5. Acceptance checks (each is a command or an assertion in `node tools/check-data.mjs`)

| # | Requirement | Check |
|---|---|---|
| A1 | Every `maps` value is a plain relative path | non-empty string, no `..`, no scheme, no whitespace (the live URLs were verified once with HTTP 200 on 2026-11-10; no network in CI). |
| A2 | Every `maps` key is a real subspecialty | key must exist in `OKSAT_SUBSPECIALTIES`; `check-data` fails otherwise. |
| A3 | No dead subspecialty | every key is used by at least one entry in `OKSAT_MANIFEST` or `OKSAT_GUIDES`. |
| A4 | Base is the fixed origin | `base` equals the literal `https://skflx.github.io/ohns-wiki-skflx/`; any other string fails (no new external origin without the owner). |
| A5 | `live` is a boolean | `typeof live === 'boolean'`, plus a self-test that `'yes'` is rejected (same pattern as the `unlisted` rule). |
| A6 | Closed gate is invisible | with `live: false` (A6 and A7 are `tools/test-oksat-learn.mjs` section 11), `node tools/test-oksat-learn.mjs` and `node tools/test-oksat-engine.mjs` pass unchanged and a new assertion finds no element with `href` containing `ohns-wiki-skflx` on `oksat-learn.html?g=ear-anatomy` and `oksat-study.html?m=vestibular-schwannoma`. |
| A7 | Open gate renders one safe link | the same test with `live` patched true (test sets `window.OKSAT_SKOTO.live` before boot): exactly one `a[rel~=noopener]` whose `href` starts with `base`, and whose text is the constant label. A `fprs`-less entry (e.g. an `endocrine` module) shows none. |
| A8 | No vault text copied | dropped: the viewers hold only the constant label and the paths in `maps`. |
| A9 | Stamps and CSP unchanged | `node tools/stamp-assets.mjs` then `check-data` passes; no inline script or `on*` handler added. |
| A10 | Full suite | `node tools/check-data.mjs && node tools/smoke-pages.mjs` clean. |

## 6. Risks

- **R1: Published slugs.** Resolved 2026-11-10: the paths in `maps` are the URLs the live site serves (HTTP 200). If the wiki renames a map, the link 404s and CI cannot see it; recheck with curl after a wiki rebuild.
- **R2: Linking unvetted pages.** Every public map carries `vetted: ""` and the warning banner. The link is honest only if the reader meets that banner, which the wiki puts at the top of each page. Owner decision (Q1).
- **R3: Wrong map for a module.** `pediatrics` also covers sleep surgery, but a `sleep` module would have no link. Mapping is subspecialty-level, so a module in the "wrong" subspecialty links to the wrong map; fix by correcting its `subspecialty`, never by adding a per-entry override.
- **R4: Gate widening later.** When the wiki publishes more than the maps, A1 keeps working; a future section-level feature would need its own spec then.
- **R5: Vetting boundary.** sk.oto pages are the owner's; the repo carries paths only. Medical correctness of linked pages is not asserted by OKSAT (`docs/decisions.md` §7).

## Open questions for the owner

1. Link to maps that are `#unvetted` at all, or wait until at least one map has `vetted:` set? (Spec assumes: link only after `live` is flipped, which you control.)
2. `endocrine`, `sleep` and `fundamentals` have no map: leave them unlinked (spec default), or map `endocrine` to `Head_and_Neck` and `sleep` to `Pediatrics`?
