# Spec: publish sk.oto with every figure stripped (2026-11-04)

> Status lives in GitHub Issues (parent: see `plans/README.md`, one sub-issue per WP). This file holds the decisions, contracts and data. It changes only through PRs. Commits: one short line, no trailers.

## 0. Context (facts read from the repo on 2026-11-04)

- **sk.oto is the owner's Obsidian vault**, a folder on the owner's computer (OHSU machine, Remote Control list). Cloud sessions cannot mount it (`not_available`), so **no agent has seen its contents**. Every claim below about the vault is therefore a *question* WP S1 answers, not a fact.
- The pipeline exists and is dry-run by default: `wiki/sync/sync-vault.mjs` + `policy.json` (folder allowlist, `status` gate, `tier` gate, `Personal Notes` cut, PHI/credential tripwire, `unvetted` banner). It copies **only `.md`**; non-Markdown files and symlinks are never copied. It already deletes an embed `![[x]]` whose target is not in the published set, which incidentally removes `![[fig.png]]`. `wiki/README.md` lists the Bootstrap steps (separate repo `skflx/ent-wiki`, Quartz 5); **not live**.
- That incidental removal is **not a figure policy**. It does not touch `![alt](path.png)`, `![alt](https://…)`, `<img>`/`<figure>`/`<picture>`, `data:image/…` URIs, Excalidraw/canvas notes (an `*.excalidraw.md` note is Markdown and carries its drawing inline), figure-only callouts, frontmatter keys such as `image:`/`cover:`, or the caption left behind once its image is gone.
- Phase 1 publishes only the six maps of content (`gate.tierMatches`). Widening that gate is the owner's call (`docs/decisions.md` §7) and is **not** done here; this spec makes widening safe for pictures.

## 1. Decisions (veto any)

| # | Decision |
|---|---|
| P1 | **Figures never leave the vault.** Published notes contain zero images, drawings or embeds of any non-Markdown file. There is no allowlist of "safe" figures; a figure the owner wants public is redrawn as an ASCII/SVG figure in the main repo, not synced. |
| P2 | **Strip, don't hold.** A figure in a note is removed (with its caption) and the note still publishes, so one picture does not block a map. Residue that cannot be classified safely is **held** (exit 2, listed) instead. |
| P3 | **Fail closed twice.** The sync strips and then re-scans its own output; the deploy workflow scans `content/` once more. Either finding an image reference stops the publish. |
| P4 | **Counts, not content, cross the boundary.** The owner runs a read-only inventory script locally (S1) and pastes counts back. No vault text is pasted into issues, PRs or the repo. |
| P5 | **Policy file is the only knob.** New strip rules are `policy.json` keys read by the script; the script has no hard-coded vault names. Editing `policy.json` is an owner decision (§7). |
| P6 | **Draft notice on the wiki** (standard, `docs/decisions.md` §9): the landing page and every published note say the wiki is in progress. Notes already carry `#unvetted`; the landing page gets a visible Draft line. |

## 2. What "a figure" is (the strip contract)

`stripFigures(body, policy)` in `sync-vault.mjs`, pure, exported, unit-tested. It removes:

1. Obsidian embeds of non-note files: `![[x.ext]]`, `![[x.ext|300]]`, `![[x.ext#page=2]]` for any extension that is not `md` (png, jpg, jpeg, gif, webp, svg, pdf, mp4, excalidraw, canvas…). Embeds of a note (`![[Note]]`) are left to the existing unlink rule.
2. Markdown images: `![alt](target)` for any target, local or `http(s):`, including reference style `![alt][ref]` and its `[ref]: url` definition line.
3. HTML: `<img …>`, `<picture>…</picture>`, `<figure>…</figure>`, `<svg>…</svg>`, `<video>`, `<iframe>`, `<object>`, `<embed>`.
4. `data:image/…` anywhere in the body.
5. Captions: a line directly adjacent (blank lines ignored) to a removed figure that matches `policy.figures.captionPatterns` (default `^\s*[*_]*(Fig(ure)?\.?|Table image|Source:|Image:)\s*\d*`), and a callout whose type is in `policy.figures.calloutTypes` (default `figure`, `image`).
6. Frontmatter keys in `policy.figures.dropFrontmatterKeys` (default `image`, `images`, `cover`, `banner`, `thumbnail`, `figure`, `excalidraw-plugin`).

Whole-note exclusion (not strip): a note with frontmatter `excalidraw-plugin` or a name ending `.excalidraw.md`, or a body that is still more than `policy.figures.maxDroppedRatio` (default 0.4) figure after stripping, is **skipped** and listed (a note that is mostly a picture has nothing left to publish).

Not stripped, **reported**: prose that mentions a figure ("see Figure 3"). The report lists these per note so the owner can reword; the script never edits prose.

Output re-scan (P3): after all transforms, a regex for any of the above forms in the written body is an error, never a warning.

## 3. Work packages

| ID | Goal | Model | Depends | Accept |
|---|---|---|---|---|
| S1 | **Inventory.** `wiki/sync/inventory-vault.mjs`: read-only, run by the owner on their machine against the vault path; prints counts only (notes per folder, per `status`/`tier`, per figure form in §2, Excalidraw notes, notes mostly figure, frontmatter keys seen, attachment extensions, largest note). Writes nothing into the vault or repo. | Haiku | none | Synthetic-vault test in `tools/test-wiki-sync.mjs` asserts the counts and that no body text appears in the output. Owner runs it on `sk.oto` and pastes the output into the parent issue. |
| S2 | **`stripFigures`** per §2, wired into `sync-vault.mjs` after `stripSections`, before `unlinkMissing`; `policy.json` gains the `figures` block. | Haiku | S1 output (for the pattern defaults only) | Synthetic fixtures, one per form in §2 plus the nasty cases (alt text containing `]`, a `(`inside a URL, an image inside a table cell, a figure inside a fenced code block that must **stay**, adjacent captions, Excalidraw note, `data:` URI): every one removed or kept as specified; idempotent (strip twice = once). |
| S3 | **Second and third lock.** Output re-scan in the sync (exit 2) and the same scan in `wiki/github/deploy.yml` before `quartz build`. | Haiku | S2 | A fixture with a figure form S2 deliberately misses (injected after the transform) makes the sync exit 2 and the deploy scan step fail; clean fixtures pass. |
| S4 | **Report.** `--write` prints per note: figures removed, captions removed, prose mentions left, skipped notes with reason; a total. | Haiku | S2 | Report test on the synthetic vault. |
| S5 | **Landing Draft notice** (P6) in `wiki/content/index.md` (hand-authored; the one non-synced file). | Haiku | none | `node tools/test-wiki-sync.mjs` and `node tools/check-data.mjs` pass; `rg -i "draft" wiki/content/index.md` hits. |
| S6 | **Docs pass:** `wiki/README.md` table row for the figure rule, `docs/security.md`, `docs/wip.md`, `AGENTS.md` wiki paragraph. | Haiku | S2–S4 | `docs/docs-map.md` checklist done. |
| S7 | **Gate widening plan** (owner decision D1 below), only after S1 shows what is behind the six maps. | Opus | S1 | A short addendum to this spec, not code. |

Review: adversarial reviewer reads the S2–S3 diff against §2 with the nastiest vault note the owner can describe in words (no content).

## 4. Owner decisions (D)

- **D1.** After S1, open the gate beyond the six maps? Options: (a) stay phase 1 and publish only maps (no further work); (b) `role` tag gate from `docs/oksat-learn-roadmap.md` Phase A (`roleIn`, not built); (c) `tier` gate set to `""` plus `MOC.md` (the policy comment's "open full set"). This spec is a **prerequisite** for (b) and (c), not a decision for either.
- **D2.** Bootstrap `skflx/ent-wiki` now (Phase 1 content is ready) or after S2–S3? Recommendation: after S3, so the first deploy already has all three locks.
- **D3.** Text derived from textbooks (the vault's `data_sources/` are copyrighted and never publish, but notes summarising them do). Out of scope here; a figure-free note can still be a close paraphrase. The owner decides what is paraphrase enough, per note, via `status`.

## 5. Risks

- **R1: unseen vault.** The strip rules are written blind. Mitigation: S1 before S2's defaults; fixtures cover the forms Obsidian and common plugins emit, but a new plugin syntax can slip through. The P3 re-scan only catches forms it knows.
- **R2: over-strip.** A fenced code block or inline code containing `![` is data, not a figure. S2 is fence-aware like the `Personal Notes` cut.
- **R3: stripped captions orphan prose** ("as shown above"). Reported, never rewritten (§2).
- **R4: Quartz copies every non-Markdown file it finds.** The sync never copies them, and the deploy scan checks `content/` contains only `.md` and `.vault-sync.json`.
