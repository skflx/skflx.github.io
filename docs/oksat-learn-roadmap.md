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
instead of repeating each other. The term lexicon (`js/oksat-terms.js`) is
the first shared seam: today a name, later a link into Reference.

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
of content. That makes this the right moment to decide its shape.

### Phase A — trim the vault by role (vault-side, owner-run)

Add one frontmatter key to every note in the six subspecialty folders:

| `role:` | Meaning | Fate |
|---|---|---|
| `map` | Map of content | Published (as now) |
| `reference` | One entity: definition, classification, numbers, sources | Published; the wiki's core |
| `teaching` | Narrative, curriculum order, self-test blocks | Becomes guide source; not published once a guide covers it |
| `stub` / `duplicate` | Thin or repeated | Merged or dropped |

`wiki/sync/policy.json` then gates on `role` instead of `tier`
(`gate.roleIn: ["map", "reference"]`): one key, fail-closed, so an
unclassified note stays home. The classification is a vault pass that an
agent can draft and the owner confirms, subspecialty by subspecialty.

**Owner:** agree the four roles; confirm "teaching notes stay home once a
guide covers them".

### Phase B — terms link to notes (this repo, small)

- A lexicon entry may carry a note path:
  `'CCAD': { x: 'central compartment atopic disease', wiki: 'Sinus/CCAD' }`.
- The popover shows the full name and, when present, *Open in sk.oto →*.
- `check-data` fails a `wiki` path that is not in the published set
  (`wiki/content/.vault-sync.json`), so a link can never point at a note the
  privacy gate held back. Needs the wiki live, Phase A done for that topic.

### Phase C — sections and notes point at each other

- Guide section → wiki: a `ref: ['Sinus/CCAD', …]` row next to `drill`
  ("Look it up"), validated the same way.
- Wiki → guide: `sync-vault.mjs` appends *Learn this: OKSAT guide §6.7* to a
  published note from a mapping this repo generates from the guides' `ref`
  rows, so the backlink is never hand-maintained.

### Phase D — one lexicon (decide later)

Whether the vault's abbreviations (note `aliases`) and `js/oksat-terms.js`
should become one list, and which side is the source. Until then the lexicon
is hand-authored here, and a later check can report disagreements between the
two rather than overwrite either.

**Owner:** direction of truth for terms (vault or this repo).

## 5. Order of work

1. Terms in every guide — **done** (2026-10).
2. Second guide (Owner picks, §3), with `lint-oksat-guide.mjs` built
   alongside it (§2).
3. Phase A on one subspecialty (Rhinology, since its guide exists), then the
   rest.
4. Wiki live (`wiki/README.md` Bootstrap), then Phase B, then C.
