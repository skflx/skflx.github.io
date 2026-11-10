# Authoring an OKSAT interactive guide

Interactive learning is the first-pass half of OKSAT. A **guide** teaches a
topic section by section with retrieval practice built in; the **question
modules** (`docs/authoring-oksat.md`) are the practice record that follows.
Each section of a guide drills into the module that holds its questions, and a
few of those questions are answered in place. Both halves are data files; the
viewer is `js/oksat/learn.js` on `oksat-learn.html`, and you never touch it to
add content.

| | Question module | Guide |
|---|---|---|
| Purpose | Practice record: locked first attempt, Leitner schedule | First pass: read, predict, reveal, apply |
| Unit | Item (`q1`…) | Chapter → section → blocks |
| Data | `js/oksat/modules/<slug>.js` | `js/oksat/guides/<slug>/<chapter>.js` |
| Registry | `OKSAT_MANIFEST` | `OKSAT_GUIDES`, both in `js/oksat/manifest.js` |
| Progress | `oksat:progress:` / `oksat:srs:` (engine) | `oksat:learn:<slug>:<rev>` (`OKSATStore.getLearn`) |

A guide never writes a module's progress or schedule. An item answered inside
a guide is stored in the guide's own record, so the module's first-attempt
record stays honest.

## Add a guide

1. Create `js/oksat/guides/<slug>/<chapter>.js` per chapter, kebab-case, each
   ending with exactly one line: `window.__OKSAT_CHAPTER = { … };`.
2. Append one entry to `OKSAT_GUIDES` in `js/oksat/manifest.js`:
   ```js
   { slug: 'ar-crs-aerd', title: '…', kicker: 'Rhinology / Allergy',
     subspecialty: 'rhinology', accent: '#6E4A6B', desc: 'One line for the hub card.',
     chapters: [
       { id: 'start', short: 'Start here', data: 'js/oksat/guides/ar-crs-aerd/start.js' },
       { id: 'science', k: 1, short: 'Type 2 immunology', min: 35, sections: 10, data: '…/science.js' },
     ] }
   ```
   `accent` must equal the subspecialty's hue in `OKSAT_SUBSPECIALTIES`;
   `sections` must equal the file's `sections.length`; `id` must equal the
   filename. `tools/check-data.mjs` enforces all three.
3. Open `oksat-learn.html?g=<slug>[&c=<chapter>]#<section-id>`.
4. `node tools/stamp-assets.mjs`, then the checks in `docs/verification.md`.

The hub (`oksat.html`) lists guides under **Interactive learning**, grouped by
subspecialty, with a meter of sections marked done.

## Chapter file

```js
window.__OKSAT_CHAPTER = {
    id: 'science',                   // = manifest id = filename
    title: 'Type 2 immunology of the nose',
    kicker: '1 · Basic science',
    lede: 'One or two sentences.',
    src: 'ICAR §VI · EPOS §5.2',     // shown under the lede
    tldr: ['…', '…'],                // the 30-second version, 3–6 bullets
    intro: [ /* blocks before the summary; only the start chapter uses it */ ],
    sections: [{ id: 'sci-1', n: '1.1', title: '…', blocks: [ … ], drill: [ … ] }],
};
```

`k` (chapter number), `short` (rail label), `min` and `sections` live in the
manifest, so the hub can show totals without loading a chapter. A **start**
chapter has no `sections`; it carries the sources and any currency warning in
`intro`.

Section ids are kebab-case and **unique across the whole guide**, and are
permanent: progress is stored as `<chapter>/<section>`. Retrieval-prompt ids
(`c1`, `c2`…) are permanent within a section.

## Blocks

| `t` | Fields | Renders |
|---|---|---|
| `p`, `why`, `h` | `x` | paragraph, muted aside, sub-heading |
| `ul`, `ol` | `items: [x…]` | list |
| `table` | `head: [x…]`, `rows: [[cell…]]`, `wide?` | cell is a string or `{x, rs?, nw?}` (row span, no-wrap) |
| `kv` | `rows: [[term, x]…]` | definition list |
| `call` | `k: 'pearl'｜'trap'｜'mech'｜'hook'`, `label`, `blocks` | callout |
| `deep` | `title`, `blocks` | collapsible "Go deeper"; hidden by Core only |
| `cards` | `cols: 1｜2`, `items: [{h, tone?, blocks}]` | comparison cards; `tone` `early`/`late` rules the top edge |
| `steps` | `items: [{n, x, side?}]`, `rise?`, `label?`, `cap?` | ladder; `rise` indents each rung |
| `figure` | `src`, `alt`, `label?`, `cap?` | an SVG or image from `images/oksat/` |
| `tool` | `id`, `title`, `src`, `pre?`, `crit: [x…]`, `rules`, `note?` | checkbox checker (below) |
| `check` | `id`, `q`, `a` | retrieval prompt (below) |
| `practice` | `title?`, `refs: ['<module>:<item>'…]` | module questions answered in place |
| `hotspot` | `id`, `alt`, `label?`, `modes?` (`explore`, `find`), `frames: [{src, cap?, regions: [{g, poly?}]}]` | tap regions on a figure (below); graded in find mode |
| `layers` | `id`, `alt`, `base`, `layers: [{id, label, src}]`, `mode` (`toggle`\|`step`), `on?`, `cumulative?`, `cap?` | stacked overlay images (below); stores nothing |
| `neighbors` | `id`, `g`, `dirs?`, `label?` | fill the neighbours of a glossary anchor, then reveal (below); graded |
| `sequence` | `id`, `q`, `items: [x…]` (authored in correct order) | put shuffled items in order (below); graded |

### Anatomy blocks

Graded blocks (`hotspot` in find mode, `neighbors`, `sequence`) need a unique
`id` within the section, shared with `check` ids. Each stores an integer grade
0–3 at `rec.checks[checkKey(…)]`, overwritten on every re-grade. `hotspot` in
explore mode and `layers` store nothing. Graded blocks count in the section
tally but not in the flashcard deck.

- **`hotspot`**: SVG frames (`.svg`) are fetched, sanitized and inlined; every
  region is an element with `data-g="<glossary id>"`. Labels and leader lines
  sit in `<g data-label="1">` and are hidden in find mode. Raster frames
  (`.png`, `.jpg`, `.webp`) take `regions: [{g, poly}]`, where `poly` is a flat
  list of ≥ 3 x,y pairs in 0–100 percent. Find mode needs ≥ 3 regions per frame.
  The ear-anatomy CT frames are generated, not authored: `tools/tbone-pipeline/slices.py` writes their regions
  from UW's label tips (one pointer region per tip, not a segmentation), so change them by rerunning it.
  `g` must be a glossary id (`js/olsb/glossary.js`); `check-data` fails an
  unknown id.
- **`layers`**: one `base` image plus ≥ 2 overlay images of identical size, each
  with a unique `id` and a `label` read out in an `aria-live` caption.
- **`neighbors`**: `dirs` ⊆ `sup, inf, ant, post, lat, med`; defaults to every
  direction the anchor has a relation in (`rel` plus reverses). Needs ≥ 2
  directions with relations. Reveal lists the glossary names per direction.
- **`sequence`**: ≥ 3 unique items. Shuffled on render; "Check order" marks each
  row by position.
- **Degrade rule**: if the glossary or an SVG fails to load, `hotspot` renders
  as a plain `figure` (first frame) and `neighbors` renders nothing.

### Unlisted guides and modules

`unlisted: true` on a guide (`OKSAT_GUIDES`) or module (`OKSAT_MANIFEST`) entry
hides it from the hub; its URL still works. It must be a boolean.

### Draft notice (standard for anything listed before it is done)

`draft: true` on the same entries lists the guide or module on the hub with a
**Draft: in progress** badge, a notice on the guide's *Start here* chapter or
above the module, and no other change. Every entry is listed `draft: true`
from the day it is first built; the owner removes the flag when it is done
(`docs/decisions.md` section 9). It must be a boolean.

### Figure attribution

Purpose-drawn figures are captioned as schematic. Each open-license raster
(and any open-license CT image) under `images/oksat/<slug>/` needs an entry in
`images/oksat/<slug>/ATTRIBUTION.md` (file, source URL, author, license), and its
caption credits the source. Copyrighted figures (textbook, Netter-style, Kenhub,
Gralapp) are never committed, not even unlisted. `check-data` enforces the
`ATTRIBUTION.md` rule for each slug in `ATTRIBUTED`.

Consecutive `check` blocks group under one "Check yourself" label.

### Inline markup

Plain text plus a small safe subset, parsed into DOM nodes (never `innerHTML`):
`**bold**`, `*italic*`, `\*` for a literal star, `[[src|EPOS 5.2]]` for a
source chip, and `[[A|pos|Strong rec]]` for an evidence chip (grade, then
`pos`, `neg` or `neu`, then the policy). Superscripts and subscripts are
written as Unicode (`IL-10⁺`, `αβγ₂`). `check-data` fails any string whose
stars or `[[ ]]` do not close. Use bold for **terminology**, as in the
modules; bullets are `ul` blocks, not text.

### Terms (`js/oksat/terms.js`)

Every specialty abbreviation a reader sees is defined once, in the shared
lexicon `js/oksat/terms.js` (`TERMS`, keyed by the exact surface form), and
the viewer marks **every** occurrence: hover or focus shows the full name, a tap
or Enter pins it, a tap elsewhere or Escape closes it. Paragraphs, lists,
tables, callout labels, card heads, captions, checker text, section and
chapter titles, and module questions shown in place are all marked; links,
buttons, summaries and source chips are not, since a tap there must keep its
own job. One lexicon serves every guide, so a term is defined once for all
topics.

Rules, enforced by `check-data` over every string a reader sees (markup and
source chips stripped; figure `alt` text is not scanned):

- **Every acronym-shaped token resolves.** Two capitals (`CRS`), a capital
  and a digit (`Th17`, `LTE4`), or lowercase into a capital (`eCRS`, `sIgE`)
  must be a `TERMS` key or `PLAIN`, or the check fails naming the token.
  Hyphenated words match their longest known run (`anti-IL-5Rα` → `IL-5Rα`,
  `IgE-mediated` → `IgE`); a plural in lowercase `s` finds its singular.
- **No idle entries.** A term no guide uses fails; delete it. The lexicon is
  what the guides say, not a dictionary.
- **Expand only what a non-otolaryngologist may not know.** `TERMS` holds
  specialty vocabulary: rhinology, allergy and otology disease names and
  procedures (CRSwNP, CCAD, EMLP), specialty scores and tests (SNOT-22, SPT),
  sources and trials (EPOS, SINUS-52), and specialized immunology (ILC2,
  FcεRI, TSLP, CD numbers). General medical knowledge goes in `PLAIN` and is
  never marked: NSAID, PFT, RCT, COPD, CRP, COX-1, IgE, Th2, CT. So do roman
  numerals, interleukins by number (`IL-13`), units, and a form whose meaning
  depends on context (T2: MRI weighting or type 2). When unsure, ask whether
  an internist would stop at it.
- **The value is the full name**, then other names after a semicolon
  (`'CD23': 'FcεRII; low-affinity IgE receptor'`). No claims, numbers or
  mechanism: an expansion is a name, and the teaching stays in the text.
- **A meaning collision across guides** (ESS: endoscopic sinus surgery vs
  Epworth Sleepiness Scale) is the one case for a per-guide override; add the
  mechanism with the first guide that needs it, not before.
- **Never a spoiler**: a `check` prompt never asks what an abbreviation
  stands for, since the popover would answer it.

### Retrieval prompts (`check`)

The learner can type an answer first (optional, kept only in the tab and never
stored), reveals the model answer, then self-grades on the engine's four
tiers: didn't know, guessed, got it partially, knew it cold (keys 1 to 4).
The grade is stored per prompt and feeds the flashcard deck. Write the prompt
so it can be answered from memory, and the model answer as the minimum a
good answer contains (`\n` makes paragraphs). Put the prompt after the
teaching it tests, not before.

### Checkers (`tool`)

A declarative checklist with ordered `rules`; the first rule whose conditions
hold supplies the output. Conditions: `eq`, `min`, `max` on the count ticked,
and `pre: false` when the optional prerequisite box (`pre`) is unticked. `tone`
is `yes` or `no` (omit for neutral). Templates: `{k}` ticked, `{n}` total,
`{miss}` unticked. The last rule must always match (`min: 0`). Use a checker
only for a rule the learner will apply with a checklist in hand (a criteria
set with a threshold), and cite its source in `src`.

### Module questions in place (`practice`)

`refs` name real module items. The viewer loads the module, renders each item
with the recall gate (type first, then show the choices; recall items reveal
and self-grade), locks the first answer, and links to the module. The text
lives once, in the module. Pick items that apply the section's facts rather
than repeat a prompt that is already in the section. `check-data` fails a ref
that does not resolve.

### Drill rows (`drill`)

`drill: [{ m: '<module slug>', c: ['<concept key>'…] }]` ends the section with
links to `oksat-study.html?m=<slug>&c=<concept>` and a live question count.
Every concept must exist in that module and have items. A section with no
module questions yet has no `drill`.

## Teaching conventions

- **Order**: the 30-second version, then sections that each teach, then check.
  A section is one idea; if it needs three headings it is two sections.
- **Retrieval, not rereading**: two or three `check` prompts per section,
  sometimes a prompt first ("predict") and the explanation after.
- **Mechanism before fact**: a `call` of kind `mech` explains why; a `pearl`
  states the one thing to keep; a `trap` names the likely error; a `hook`
  gives a mnemonic. Color is carried by these four only.
- **Depth is optional**: anything beyond the first pass goes in `deep`.
- **Sources**: name the source on the claim (`[[src|…]]`) and say where
  sources disagree under a `trap` labelled "Source conflict". Numbers come from
  a source, never from memory. Content is draft; the owner verifies.
- **Figures**: reuse a figure from `images/oksat/` where it exists and agrees
  with the guide's text; a new one follows `docs/authoring-oksat.md` (SVG drawn
  for the purpose, labelled schematic, with alt text) and lives in
  `images/oksat/<guide slug>/`. Draw one only where a picture carries what prose
  cannot: a mechanism or loop, a time course, a spatial relation, a threshold
  or scoring rule. Place it after the teaching it illustrates, and let the
  caption point at the prompt or callout it serves.
- **Synonyms**: when a term has several names (CD number, eponym,
  abbreviation), give both at first use, in figures too, and add the term to
  `js/oksat/terms.js` with its other names after the semicolon. A guide's
  Start-chapter glossary table is for synonym sets worth reading as a list
  (a CD number and its receptor), not a list of abbreviations: those are in
  the popover.
- **Link the two halves**: when a section's facts are not yet drillable, add
  the questions to a module (new items get new ids) rather than inlining them
  in the guide, then point at them.

No exclamation marks, no gamification, no congratulation: the voice is the
module voice (`docs/design-principles.md` §6).

## Verification

`node tools/check-data.mjs` (structure, markup, figures, references, terms),
`node tools/test-oksat-learn.mjs` (behavior), `node tools/smoke-pages.mjs`
(the page boots), then open the chapter and read it, in both themes and at
phone width. A green check proves structure, not that the page teaches.
