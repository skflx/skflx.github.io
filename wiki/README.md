# wiki/ — sk.oto on the web (Quartz 5 scaffold)

**Status: scaffold. Nothing here is built, served, or linked from the site.**
It is the kit for publishing the `sk.oto` Obsidian vault as a browsable,
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
| `quartz.config.yaml` | repo root | Quartz 5 `obsidian` template, retuned (`# sk:` marks every change) |
| `quartz/styles/custom.scss` | `quartz/styles/custom.scss` | self-hosted faces + the main site's typographic restraint |
| `content/index.md` | `content/index.md` | landing page |
| `github/deploy.yml` | `.github/workflows/deploy.yml` | build + Pages deploy, with a last-chance privacy check |

`tools/test-wiki-sync.mjs` (repo root) tests the sync against a synthetic
vault in CI. No real note is committed anywhere in this repo.

## What leaves the vault, and what never does

`sync-vault.mjs` is dry-run by default and only writes with `--write`.

| Vault content | Published? | Mechanism |
|---|---|---|
| `Otology/ Sinus/ Laryngology/ Head_and_Neck/ FPRS/ Pediatrics/` notes with `status: complete` | yes | folder allowlist + frontmatter gate |
| `MOC.md` | yes | `includeRootFiles` |
| `## Personal Notes` sections | **never** | cut out, fence-aware |
| `personal_status` frontmatter | **never** | dropped |
| `data_sources/` (K.J. Lee, ENT Secrets text) | **never** | not on the allowlist — copyrighted |
| `_drafts/`, `_inbox/`, `_audits/`, any `_*` or `.*` | **never** | skipped by prefix |
| `AGENTS.md`, `SYSTEM.md`, `STATE.md`, `.personal_guard.json`, `*.py`, `.agents/`, `.obsidian/` | **never** | not on the allowlist |
| `status: stub / in-progress`, `draft: true` | no | gated (listed in the report) |
| notes matching the PHI/credential tripwire (MRN, DOB, phone, email, API keys) | held | listed for a human; exit code 2 |
| non-Markdown files, symlinks | no | Quartz publishes every non-`.md` file it sees, so they are never copied |

It also: unlinks wikilinks whose target was not published (plain alias
text, no dead links); tags notes with empty `vetted` as `#unvetted` and puts
a warning callout at the top; drops the H1 that repeats the frontmatter
title; and deletes only files it wrote itself (tracked in
`content/.vault-sync.json`), refusing any folder it did not create.

## Bootstrap (when you decide to go live)

1. Create `skflx/ent-wiki` from the Quartz template (github.com/jackyzha0/quartz →
   *Use this template*), clone it, `npm ci` (Node ≥ 22).
2. Copy in: `quartz.config.yaml`, `quartz/styles/custom.scss`,
   `content/index.md`, `github/deploy.yml` → `.github/workflows/deploy.yml`;
   and `skflx.github.io/fonts/*.woff2` → `quartz/static/fonts/`.
3. `npx quartz plugin install --from-config`
4. Sync (dry run first, read the report):
   ```bash
   node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --report /tmp/sync.json
   node ~/skflx.github.io/wiki/sync/sync-vault.mjs --vault ~/sk.oto --out content --write
   ```
5. `npx quartz build --serve` → http://localhost:8080 and look.
6. Commit, push to `v5`; Settings → Pages → Source: *GitHub Actions*.
7. Then, in this repo: add the wiki to the Tools index on `index.html`.

Verified 2026-09-23: this config builds cleanly on Quartz v5.0.0 against a
synthetic vault in the vault's exact note format (callouts, `dgmo` fences,
KaTeX, aliased and table-escaped wikilinks); output contained no personal
text and no Google Fonts request.

## Decisions for the owner before anything is public

- **Public, private, or password-gated?** A GitHub Pages site is public, and
  so is a public repo's `content/`. Most notes are `vetted: ""` and
  AI-assisted; they would publish under your name with only the
  "Unvetted" banner between them and a reader. Options: publish only
  `requireVetted: true` notes (flip it in `policy.json`), keep the repo
  private (Pages on a private repo needs a paid plan), or use Quartz's
  `encrypted-pages` plugin (client-side, enabled in the config) for a
  password.
- **Sync trigger.** Manual (above) is the scaffold. Automating it from the
  vault's own git repo would need a cross-repo token — a secret, which this
  project does not hold without your say-so.
- **DGMO diagrams** render as code blocks; there is no DGMO renderer for
  Quartz. Converting to Mermaid (which Quartz renders) is possible later.
- **`sources:` citations** publish as note properties. They cite chapters,
  not text, so they carry no copyrighted material; the source texts
  themselves never leave (`data_sources/` is not allowlisted).
- **Third-party requests** in Quartz output: KaTeX CSS from jsDelivr and a
  cdnjs preconnect. Fonts are local. Unlike the main site, the wiki has no
  CSP (Quartz inlines scripts); it holds no user data, so the exposure is
  small, but it is not zero.
