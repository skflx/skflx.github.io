# wiki/ — sk.oto on the web (Quartz 5)

**Status: not live. Nothing here is built, served, or linked from the site.**
Phase 1 content is ready: the six subspecialty maps of content, synced into
`content/`, render in Quartz. This folder is the kit for publishing the `sk.oto` Obsidian vault as a browsable,
searchable, graph-linked wiki with [Quartz 5](https://quartz.jzhao.xyz/),
and the privacy boundary that decides what may leave the vault.

## Shape

```
sk.oto vault (Drive / local)                    skflx/ent-wiki (new repo, Quartz 5)
┌──────────────────────────┐   sync-vault.mjs   ┌────────────────────────────┐   Actions    skflx.github.io/ent-wiki/
│ Otology/ Sinus/ … MOC.md │ ─────────────────▶ │ content/   (published set) │ ──────────▶  (GitHub Pages project page)
│ data_sources/ _drafts/   │   allowlist,       │ quartz.config.yaml         │   deploy.yml
│ .agents/ AGENTS.md …     │   strip, gate      │ quartz/styles/custom.scss  │
└──────────────────────────┘                    └────────────────────────────┘
```

**Why a separate repo.** Quartz is a Node build; this repo has no build step
by rule and GitHub Pages serves it as-is. A second repo deploys through
Actions to `skflx.github.io/ent-wiki/` (a project page under the same
domain) without changing how the main site deploys. The files here are
copied into that repo when it is created.

## What is in this folder

| File | Goes to (in `skflx/ent-wiki`) | Role |
|---|---|---|
| `sync/sync-vault.mjs` | stays here, run locally | vault → `content/`, fail-closed (below) |
| `sync/policy.json` | stays here | what may be published — edit this, not the script |
| `feedback/pull-feedback.mjs` | stays here, run locally | reader-correction issues → vault `_inbox/` (below) |
| `github/ISSUE_TEMPLATE/*.yml` | `.github/ISSUE_TEMPLATE/` | the correction form every note links to; blank issues off |
| `dgmo/render-dgmo.mjs` | `scripts/render-dgmo.mjs` | ```` ```dgmo ```` fences → inline SVG, run by the deploy before `quartz build` |
| `quartz.config.yaml` | repo root | Quartz 5 `obsidian` template, retuned (`# sk:` marks every change) |
| `quartz/styles/custom.scss` | `quartz/styles/custom.scss` | self-hosted faces + the main site's typographic restraint |
| `content/index.md` | `content/index.md` | landing page (links the six maps) |
| `content/<Subspecialty>/…` | `content/` | **sync-vault output** — phase 1: the six maps of content. Regenerate, never hand-edit (`content/.vault-sync.json` lists what the script owns) |
| `github/deploy.yml` | `.github/workflows/deploy.yml` | build + Pages deploy, with a last-chance privacy check |

`tools/test-wiki-sync.mjs` (repo root) tests the sync and the feedback
tool against a synthetic vault, and the DGMO fence transform with a stub
renderer, in CI. The only real vault content in this repo is sync output in
`content/`; test fixtures are synthetic. The repo root carries `.nojekyll`
so GitHub Pages serves these Markdown files raw instead of rendering them
as half-working pages.

## Diagrams (DGMO)

The vault's flowcharts are [DGMO](https://github.com/diagrammo/dgmo) fences,
drawn in Obsidian by the [obsidian-dgmo](https://github.com/diagrammo/obsidian-dgmo)
plugin. Quartz cannot read them, so `render-dgmo.mjs` pre-renders each fence
with the same `@diagrammo/dgmo` library the plugin uses:

- static SVG, **twice** (light and dark), on a DGMO palette built from the
  site tokens (`SKFLX_PALETTE`); `custom.scss` shows the one matching Quartz's
  `saved-theme`. No client script, no CDN.
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
       ──▶ public issue on skflx/ent-wiki, label wiki-feedback, `note` prefilled
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

## Bootstrap (when you decide to go live)

1. Create `skflx/ent-wiki` from the Quartz template (github.com/jackyzha0/quartz →
   *Use this template*), clone it, `npm ci` (Node ≥ 22).
2. Copy in: `quartz.config.yaml`, `quartz/styles/custom.scss`,
   `content/` (landing page + the synced maps), `github/deploy.yml` →
   `.github/workflows/deploy.yml`, `github/ISSUE_TEMPLATE/` →
   `.github/ISSUE_TEMPLATE/`; and `skflx.github.io/fonts/*.woff2` →
   `quartz/static/fonts/`. Create the `wiki-feedback` label (issue forms
   only apply labels that exist).
3. `npx quartz plugin install --from-config`, then
   `npm i -D @diagrammo/dgmo` and copy `dgmo/render-dgmo.mjs` → `scripts/`.
4. Sync (dry run first, read the report):
   ```bash
   node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --report /tmp/sync.json
   node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --write
   ```
5. `node scripts/render-dgmo.mjs content && npx quartz build --serve` →
   http://localhost:8080 and look. (Re-running the sync restores the plain
   fences; the deploy renders them itself.)
6. Commit, push to `v5`; Settings → Pages → Source: *GitHub Actions*.
7. Then, in this repo: add the wiki to the Tools index on `index.html`.

Verified 2026-09-23, phase 1: the six real maps of content, synced with
the committed policy, build on Quartz v5.0.0; all six DGMO pyramids render
in both themes (and scroll sideways at readable size on phones); each page
ends with the correction link; no personal text in the output.

Verified 2026-09-23: this config builds cleanly on Quartz v5.0.0 against a
synthetic vault in the vault's exact note format (callouts, `dgmo` fences,
KaTeX, aliased and table-escaped wikilinks); output contained no personal
text and no Google Fonts request; DGMO flowcharts rendered in both themes
with `@diagrammo/dgmo` 0.86.0.

## Decisions for the owner before anything is public

- **Who can read it — open, brainstorm pending.** A GitHub Pages site is
  public. Most notes are `vetted: ""` and AI-assisted; they would publish
  under your name with only the "Unvetted" banner between them and a reader.
  Options on the table:
  - *Vetted only* — flip `requireVetted: true` in `policy.json`. Safest,
    but the site grows only as fast as vetting does.
  - *Password* — Quartz's `encrypted-pages` encrypts each page at build
    time; the password is a CI secret, not in the repo. **But** a password
    only protects anything if the Markdown in `content/` is not itself in a
    public repo. It works if the wiki repo is private (Pages from a private
    repo needs a paid plan), or if a private repo holds `content/` and a
    public one only receives the built, encrypted site. Otherwise the
    plaintext is one click away on GitHub.
  - *Reader feedback* — **chosen (2026-09)**, see *Reader corrections*
    above. Issues are public; you accepted that.
- **Sync trigger.** Manual (above) is the scaffold. Automating it from the
  vault's own git repo would need a cross-repo token — a secret, which this
  project does not hold without your say-so.
- **`sources:` citations** publish as note properties. They cite chapters,
  not text, so they carry no copyrighted material; the source texts
  themselves never leave (`data_sources/` is not allowlisted).
- **Third-party requests** in Quartz output: KaTeX CSS from jsDelivr, a
  cdnjs preconnect, and d3 + pixi.js from jsDelivr for the Graph view
  (without them the graph panel shows "could not load"; the page is
  otherwise fine). Fonts are local. Unlike the main site, the wiki has no
  CSP (Quartz inlines scripts); it holds no user data, so the exposure is
  small, but it is not zero.
