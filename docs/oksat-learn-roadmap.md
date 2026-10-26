# OKSAT Interactive learning — roadmap

Plan for growing Interactive learning past its first guide and tying it to
the `sk.oto` wiki. A board, not a diary: rewrite a section when it changes.
Current state lives in `WIP.md`; the guide spec is
`docs/authoring-oksat-guide.md`. Nothing below marked **Owner** is decided.

## 1. The three layers

| Layer | Job | Home | Unit |
|---|---|---|---|
| **Reference** | Look a fact up; see how it connects | `sk.oto` vault → wiki (`skflx.github.io/ent-wiki/`) | note |
| **Teaching** | Learn a hard topic the first time, with retrieval built in | OKSAT guide (`oksat-learn.html`) | chapter → section |
| **Practice** | Prove it later, on a schedule | OKSAT module (`oksat-study.html`) | item |

Each fact has **one home** per layer, and the layers point at each other
instead of repeating each other. The term lexicon (`js/oksat-terms.js`) names
specialty terms in place; links into Reference are a list per chapter (§4).

The wiki trim follows from this: a vault note whose real job is teaching
(long narrative, curriculum order, self-test blocks) moves into a guide, and
the wiki keeps what you look up.

## 2. Content rules for every new guide

### Enforced now (`tools/check-data.mjs`, CI)

- Structure: counts agree with the manifest, ids unique and permanent, known
  block types, balanced markup, figures exist with alt text.
- Links: every `practice` ref and `drill` concept resolves to real items.
- **Terms**: every acronym-shaped token is in the lexicon (or `PLAIN`), and
  no lexicon entry is idle (spec: *Terms*).

### Proposed: `tools/lint-oksat-guide.mjs` (the guide twin of `lint-oksat.mjs`)

Build when the second guide starts, so the rules are tested on two guides,
not tuned to one. Each is mechanical; none judges medical content.

| Rule | Why |
|---|---|
| Each section has 2–3 `check` prompts; each chapter a `tldr` of 3–6 bullets and 3–10 sections | The spec's teaching shape |
| A number with a unit, %, or ratio in a `p`/`ul`/table cell sits in a block carrying a `[[src|…]]` chip | "Numbers come from a source, never from memory" |
| Every section has a `drill` row or an explicit `nodrill: 'reason'` | Keeps the Teaching → Practice link from silently lapsing |
| No `check` prompt asks what an abbreviation stands for | The popover would answer it |
| A drawn figure's caption says *schematic* | Invented shapes are labelled (CLAUDE.md, Figures) |
| Start chapter names each source with year, and a *Currency check* call dated `YYYY-MM`; warn past 12 months | Rhinology biologics moved within a year of the sources |
| No `!`, no congratulation, no markdown leakage (`#`, `- ` at line start) | Module voice (`docs/design-principles.md` §6) |
| Chapter `review: 'draft' \| 'verified'`; only the owner sets `verified`; the viewer shows a Draft mark until then | Same rule as SSB content (`docs/decisions.md` §7) |

### Process rules (not lintable)

- Sources ranked and read before writing; conflicts stated in a `trap`
  labelled *Source conflict* (spec, Teaching conventions).
- A guide ships with its questions: new items go in a module, never inline.
- The owner reads every chapter at phone width before it is listed on the hub.

## 3. Next guides

Pick for **difficulty** (many interacting rules, numbers that blur, a
mechanism to hold in mind), and prefer a topic that already has a module, so
the guide drills on day one. Candidates, in a suggested order:

| Topic | Existing module(s) | Why it needs a guide |
|---|---|---|
| Thyroid cancer risk stratification | `dtc-risk-stratification` | ATA risk tiers, response-to-therapy categories, RAI indications: rule-dense, checker-shaped |
| Vestibular schwannoma | `vestibular-schwannoma` | Growth data, approach selection by size and hearing, NF2; a decision ladder |
| Facial reanimation | `facial-reanimation` | Timing windows and nerve-donor logic; mechanism plus time course |
| Temporal bone trauma | `temporal-bone-trauma` | Fracture classifications, facial-nerve decision rules, CSF leak work-up |
| Facial fractures (mandible → midface → orbit/NOE) | the four trauma modules | One guide spanning four modules; AO CMF content still to fold in (`WIP.md`) |
| Pediatric hearing loss | `pediatrics` | Syndromic genetics and screening timelines |

**Owner:** which topic next, and its sources (Drive PDFs, vault notes).

## 4. Wiki integration

The wiki is not live (`wiki/README.md`): phase 1 publishes only the six maps
of content. **Owner** is verifying the existing vault first; nothing below
starts until that pass is done.

### Decided (2026-10)

- **Terms expand; they never link.** A term in a guide shows its full name on
  hover, focus or tap, and that is all. Tap has to mean "expand" because a
  phone has no hover, and many wiki topics are not abbreviations (Lund–Mackay,
  Draf III, aspirin desensitization), so a term-to-note link would miss most
  of them.
- **Only specialty vocabulary is expanded** (spec: *Terms*). General medical
  abbreviations are recognized and left alone.
- **Wiki links are a list at the end of the chapter.** *Related in sk.oto*
  lists each published note the chapter's sections cite, with the section
  numbers that cite it.
- **The wiki is text.** Figures live in guides only (§5).

### Phase A: tag every vault note (after the verification pass)

Two independent keys per note, set together in one read:

| Key | Values | Who sets it |
|---|---|---|
| `role:` | `map` · `reference` · `teaching` · `stub` | Claude drafts, owner confirms |
| `completeness:` | `1` · `2` · `3` (stars), plus `gap:` one line naming what is missing | Claude sets, owner adjusts |

Completeness rubric. It measures coverage, not correctness: correctness stays
`vetted`.

| ★ | Rubric |
|---|---|
| ★ | Outline or definition only; core sections missing, or numbers without sources |
| ★★ | Usable: definition, presentation, work-up and management with sources; missing a classification, staging, numbers or edge cases (named in `gap:`) |
| ★★★ | Complete for a board-level reader: every section present, every number sourced, classifications included, cross-linked; no TODOs |

To keep the tagging cheap, a script first measures each note mechanically
(sections present, sources counted, unsourced numbers, TODO markers,
length). The model reads only to judge role and completeness, one
subspecialty per batch. The output is a table the owner confirms before
anything is written back to the vault.

The publish gate in `wiki/sync/policy.json` then moves from `tier` to
`role` (`map`, `reference`). A note with no `role` stays home (fail-closed).
`sync-vault.mjs` prints the stars under the title, and a `gap:` line on ★
and ★★ notes. **Owner:** whether ★ notes are published at all, or held until
they reach ★★.

The `teaching` notes are the source material for guides. Once a guide covers
one, the note stays in the vault and leaves the wiki.

### Phase B: strip figures at publish

`sync-vault.mjs` drops image embeds (`![[…]]`, `![](…)`) and ```` ```dgmo ````
fences behind one policy switch (`figures: "strip"`). It leaves a one-line
marker only where the removal breaks the text ("see figure"). Stripping at
publish rather than editing the vault keeps it reversible, and your Obsidian
copy keeps its diagrams. With figures stripped, `wiki/dgmo/render-dgmo.mjs`
and its tests have no job and are deleted in the same change. **Owner:**
strip at publish (recommended), or also clean the vault.

### Phase C: chapters and notes point at each other

- Guide → wiki: a section may carry `ref: ['Sinus/CCAD', …]`. The chapter
  foot collects them as *Related in sk.oto*. `check-data` fails a path not in
  the published set (`wiki/content/.vault-sync.json`), so a link can never
  point at a note the privacy gate held back.
- Wiki → guide: `sync-vault.mjs` appends *Learn this: OKSAT guide, AR · CRS ·
  AERD §6.7* to a cited note. The mapping is generated from the `ref` rows,
  never hand-kept.

Needs the wiki live and Phase A done for that subspecialty.

### Later: one term list

Whether the vault's abbreviations and `js/oksat-terms.js` merge, and which
side is the source. Until then the lexicon is hand-authored here.

## 5. Figures: where they go and how to keep them cheap

Figures cost far more tokens than text, so each must earn its place.

- **Guides only.** The wiki is text; a note that needs a picture links to the
  guide section that has it.
- **Only what prose cannot carry**: a mechanism or loop, a time course, a
  spatial relation, a scoring rule. Never decoration, never a table drawn as
  a picture.
- **Proposed in the outline, approved before drawing.** The outline lists each
  figure with one line of purpose; the owner strikes what is not needed.
  Draw only after the chapter text is final, so nothing is redrawn because
  the text moved.
- **Reuse first**: `img/oksat/` already holds the module and guide figures.
- **A budget**: roughly one figure per chapter, more only for a chapter built
  around mechanisms. Adjust once the second guide shows what readers use.

## 6. Order of work

1. Terms in every guide, specialty vocabulary only — **done** (2026-10).
2. **Owner:** verification pass of the vault (in progress).
3. Phase A (role + completeness) on Rhinology first, since its guide exists,
   then the other subspecialties; Phase B with it.
4. Second guide (Owner picks, §3), built from ★★★ vetted notes, with
   `lint-oksat-guide.mjs` built alongside it (§2).
5. Wiki live (`wiki/README.md` Bootstrap), then Phase C.
