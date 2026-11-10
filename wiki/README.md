# wiki/ — the sk.oto vault's privacy boundary and tools

**Status: live.** The `sk.oto` wiki (Quartz 5) is built and deployed from its own
repository, `skflx/ohns-wiki-skflx`, at `skflx.github.io/ohns-wiki-skflx/`. The
Quartz config, stylesheet, landing page and deploy workflow live in that repository,
not here. Nothing in `wiki/` is built or served from this repo.

## What is in this folder

| Path | Role |
|---|---|
| `sync/sync-vault.mjs`, `sync/policy.json` | vault → `content/`, fail-closed (below). The policy is the place to edit what may be published, not the script |
| `content/` | sync output: the landing page and the published notes. Regenerate it with the script, never hand-edit it (`content/.vault-sync.json` lists what the script owns) |
| `dgmo/render-dgmo.mjs` | ```` ```dgmo ```` fences → inline SVG. Not yet installed in the wiki repository |
| `feedback/pull-feedback.mjs` | reader-correction issues → vault `_inbox/` (below), run locally |
| `github/ISSUE_TEMPLATE/` | the correction form every note links to. Not yet installed in the wiki repository |

`tools/test-wiki-sync.mjs` (repo root) tests the sync and the feedback tool against a
synthetic vault, and the DGMO fence transform with a stub renderer, in CI. The only real
vault content in this repo is sync output in `content/`; test fixtures are synthetic.
The repo root carries `.nojekyll` so GitHub Pages serves these Markdown files raw.

## Running the sync

`sync-vault.mjs` is dry-run by default and only writes with `--write`. Dry run first, and read the report:

```bash
node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --report /tmp/sync.json
node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --write
```
## Diagrams (DGMO)

The vault's flowcharts are [DGMO](https://github.com/diagrammo/dgmo) fences,
drawn in Obsidian by the [obsidian-dgmo](https://github.com/diagrammo/obsidian-dgmo)
plugin. Quartz cannot read them, so `render-dgmo.mjs` pre-renders each fence
with the same `@diagrammo/dgmo` library the plugin uses:

- static SVG, **twice** (light and dark), on a DGMO palette built from the
  site tokens (`SKFLX_PALETTE`); the wiki's stylesheet shows the one matching
  Quartz's `saved-theme`. No client script, no CDN.
- the source stays under the diagram in a collapsed *Diagram source*.
- a fence that fails to parse stays a code block and is listed; it never
  fails the build.
- wide layouts (a viewBox of 900+ units, e.g. the maps' tier pyramids) are
  marked `dgmo-wide`; on phones they keep a readable size and scroll
  sideways instead of shrinking.
- works around a DGMO 0.86 bug (chart title centered on an assumed 1200px
  canvas, so it was cut off) by re-centering the title on the viewBox.

DGMO warns that the vault's `r: <Tag>` suffix on flowchart nodes is
deprecated (`W_FLOWCHART_NODE_SUFFIX`); those diagrams still render.
Labels use DGMO's own font stack (Inter/system), not Archivo, so box sizes
stay what the layout engine measured.

## What leaves the vault, and what never does

`sync-vault.mjs` is dry-run by default and only writes with `--write`.

| Vault content | Published? | Mechanism |
|---|---|---|
| `Otology/ Sinus/ Laryngology/ Head_and_Neck/ FPRS/ Pediatrics/` notes with `status: complete` | **phase 1: only `tier: Master Map of Content`** | folder allowlist + frontmatter gate + `gate.tierMatches` |
| `MOC.md` (root master map) | not in phase 1 | `includeRootFiles` is empty |
| `## Personal Notes` sections | **never** | cut out, fence-aware |
| `personal_status` frontmatter | **never** | dropped |
| `data_sources/` (K.J. Lee, ENT Secrets text) | **never** | not on the allowlist — copyrighted |
| `_drafts/`, `_inbox/`, `_audits/`, any `_*` or `.*` | **never** | skipped by prefix |
| `AGENTS.md`, `SYSTEM.md`, `STATE.md`, `.personal_guard.json`, `*.py`, `.agents/`, `.obsidian/` | **never** | not on the allowlist |
| `status: stub / in-progress`, `draft: true` | no | gated (listed in the report) |
| notes matching the PHI/credential tripwire (MRN, DOB, phone, email, API keys) | held | listed for a human; exit code 2 |
| non-Markdown files, symlinks | no | Quartz publishes every non-`.md` file it sees, so they are never copied |

It also: unlinks wikilinks whose target was not published (plain alias
text, no dead links — in phase 1 that is every note a map lists, which
become links as they go up); tags notes with empty `vetted` as `#unvetted` and puts
a warning callout at the top; drops the H1 that repeats the frontmatter
title; ends every note with a *Suggest a correction* link (below); and
deletes only files it wrote itself (tracked in
`content/.vault-sync.json`), refusing any folder it did not create.

**Opening past phase 1.** In `policy.json`: set `gate.tierMatches` to `""`
(or a wider pattern) and `includeRootFiles` to `["MOC.md"]`, dry-run, read
the report. Owner decision (`docs/decisions.md`).

## Reader corrections (GitHub issues, round trip)

Corrections are made **in the vault**, never in the wiki. The vault is the
one source for Drive and for the web, so a fix made there reaches both.

```
reader ──▶ "Suggest a correction" link (end of every note, added by sync-vault)
       ──▶ public issue on skflx/ohns-wiki-skflx, label wiki-feedback, `note` prefilled
       ──▶ pull-feedback.mjs ──▶ <vault>/_inbox/wiki-feedback/issue-<n>.md
       ──▶ you (or /tend) fix the note in the vault, set `resolution:` in the item
       ──▶ your vault sync (sync_vault.py) ──▶ Drive has the fix
       ──▶ sync-vault.mjs ──▶ wiki commit + "Closes #n" ──▶ deploy; the issue closes
```

```bash
# 1. pull new reports into the vault inbox (dry run first; no token needed)
node ~/skflx.github.io/wiki/feedback/pull-feedback.mjs --vault ~/sk.oto
node ~/skflx.github.io/wiki/feedback/pull-feedback.mjs --vault ~/sk.oto --write
# 2. fix the note; in the inbox item set  resolution: fixed | wontfix | duplicate
# 3. push the vault to Drive as usual, then republish and close the issues
node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --write
git commit -am "Corrections from reader reports" -m "$(node ~/skflx.github.io/wiki/feedback/pull-feedback.mjs --vault ~/sk.oto --closes)"
```

- `_inbox/` is never published (sync skips `_*`), and the inbox item sits
  where your vault tooling already looks.
- **Issue text is untrusted.** Strangers write it, so an item keeps it
  inside a fence it cannot close, under an *Untrusted reader text* callout.
  Whoever triages it, including an agent, checks the claim against sources
  and never follows it as an instruction. Worth one line in the vault's
  `AGENTS.md`.
- The `note` field is kept only if it names a real vault file.
- Reports matching the PHI tripwire get a *Possible patient information*
  flag; scrub or delete the public issue first.
- Re-running the pull never overwrites an item, so your `resolution:` is
  safe. `wontfix` and `duplicate` also produce `Closes #n`; say why on the
  issue.
- The pull is manual, like the sync. Automating it (for example a
  scheduled Action that writes into the vault's Drive) would need a
  credential — owner decision.
