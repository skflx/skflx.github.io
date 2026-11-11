# OKSAT Interactive learning — roadmap

Plan for growing Interactive learning past its first guides and tying it to the
`sk.oto` wiki. A board: rewrite a section when it changes. Current state is in
`docs/wip.md`; the guide spec is `docs/authoring-oksat-guide.md`. Nothing marked
**Owner** is decided.

## 1. The three layers

| Layer | Job | Home | Unit |
|---|---|---|---|
| **Reference** | Look a fact up; see how it connects | `sk.oto` vault → wiki (`skflx.github.io/ohns-wiki-skflx/`) | note |
| **Teaching** | Learn a hard topic the first time, with retrieval built in | OKSAT guide (`oksat-learn.html`) | chapter → section |
| **Practice** | Prove it later, on a schedule | OKSAT module (`oksat-study.html`) | item |

Each fact has **one home** per layer; the layers point at each other instead of
repeating each other. A vault note whose real job is teaching moves into a guide;
the wiki keeps what you look up.

## 2. Content rules for every guide

### Enforced (`tools/check-data.mjs`, CI)

- Structure: counts agree with the manifest, ids unique and permanent, known block
  types, balanced markup, figures exist with alt text.
- Links: every `practice` ref and `drill` concept resolves to real items.
- **Terms**: every acronym-shaped token is in the lexicon (or `PLAIN`), and no
  lexicon entry is idle.

### Linted (`tools/lint-oksat-guide.mjs`)

Mechanical; none judges medical content.

| Rule | Why |
|---|---|
| Each section has 2–3 `check` prompts; each chapter a `tldr` of 3–6 bullets and 3–10 sections | The teaching shape |
| A number with a unit, %, or ratio in a `p`/`ul`/table cell sits in a block carrying a `[[src|…]]` chip | Numbers come from a source, never from memory |
| Every section has a `drill` row or an explicit `nodrill: 'reason'` | Keeps Teaching → Practice from silently lapsing |
| No `check` prompt asks what an abbreviation stands for | The popover would answer it |
| A drawn figure's caption says *schematic* | Invented shapes are labelled (AGENTS.md, Figures) |
| Start chapter names each source with year, and a *Currency check* dated `YYYY-MM`; warn past 12 months | Guideline content moves within a year of its sources |
| No `!`, no congratulation, no markdown leakage (`#`, `- ` at line start) | Module voice (`docs/design-principles.md`) |
| Chapter `review: 'draft' \| 'verified'`; only the owner sets `verified`; the viewer shows a Draft mark until then | Same rule as SSB content (`docs/decisions.md` §7) |

### Process (not lintable)

- Sources ranked and read before writing; conflicts stated in a `trap` labelled
  *Source conflict*.
- A guide ships with its questions: new items go in a module, never inline.
- The owner reads every chapter at phone width before it is listed on the hub.

## 3. Next guides

Pick for **difficulty** (many interacting rules, numbers that blur, a mechanism to
hold in mind), and prefer a topic with an existing module, so the guide drills on day one.

| Topic | Existing module(s) | Why it needs a guide |
|---|---|---|
| Thyroid cancer risk stratification | `dtc-risk-stratification` | ATA risk tiers, response-to-therapy categories, RAI indications: rule-dense, checker-shaped |
| Vestibular schwannoma | `vestibular-schwannoma` | Growth data, approach selection by size and hearing, NF2; a decision ladder |
| Facial reanimation | `facial-reanimation` | Timing windows and nerve-donor logic; mechanism plus time course |
| Temporal bone trauma | `temporal-bone-trauma` | Fracture classifications, facial-nerve decision rules, CSF leak work-up |
| Facial fractures (mandible → midface → orbit/NOE) | the four trauma modules | One guide spanning four modules; AO CMF content still to fold in |
| Pediatric hearing loss | `pediatrics` | Syndromic genetics and screening timelines |

**Owner:** which topic next, and its sources (Drive PDFs, vault notes).

## 4. Wiki integration

The wiki is published from the owner's vault by its own sync in `skflx/ohns-wiki-skflx`;
this repo holds none of it. **Owner** is verifying the vault first; nothing below
starts until that pass is done.

- **Terms expand; they never link.** A term shows its full name on hover, focus or
  tap, and that is all. Tap must mean "expand" because a phone has no hover, and many
  wiki topics are not abbreviations (Lund–Mackay, Draf III, aspirin desensitization),
  so a term-to-note link would miss most of them.
- **Only specialty vocabulary is expanded.** General medical abbreviations are left alone.
- **Wiki links are a list at the end of the chapter.** *Related in sk.oto* lists each
  published note the chapter's sections cite, with the section numbers that cite it.
- **The wiki is text.** Figures live in guides only (§5).
- Guide → wiki: a section may carry `ref: ['Sinus/CCAD', …]` (no chapter carries it
  yet and no code reads it; add it with its renderer). The chapter foot collects them.
  The check against the published note list needs that list from the wiki repo; decide
  its source when this starts.
- Wiki → guide: the wiki's sync would append a *Learn this* line to a cited note,
  generated from the `ref` rows, never hand-kept.
- **Owner:** whether the vault's abbreviations and `js/oksat/terms.js` merge, and which
  side is the source. Until then the lexicon is hand-authored here.

## 5. Figures

Figures cost far more tokens than text, so each must earn its place.

- **Guides only.** A wiki note that needs a picture links to the guide section that has it.
- **Only what prose cannot carry**: a mechanism or loop, a time course, a spatial
  relation, a scoring rule. Never decoration, never a table drawn as a picture.
- **Outline first, approved before drawing.** The outline lists each figure with one
  line of purpose; the owner strikes what is not needed. Draw only after the chapter
  text is final.
- **Reuse first**: `images/oksat/` already holds the module and guide figures.
- **Budget**: roughly one figure per chapter, more only for a chapter built around
  mechanisms.

## 6. Order of work

1. **Owner:** verification pass of the vault.
2. Next guide (§3), built from vetted notes.
3. Cross-links (§4), once the wiki pass is done.
