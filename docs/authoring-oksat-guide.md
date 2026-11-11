# Authoring an OKSAT interactive guide

Interactive learning is the first-pass half of OKSAT: a **guide** teaches a
topic section by section with retrieval practice built in. The **question
modules** (`docs/authoring-oksat.md`) are the practice record that follows. A
section drills into the module that holds its questions, and a few questions
are answered in place. Both halves are data files; the viewer is
`js/oksat/learn.js` on `oksat-learn.html`. Never touch the viewer to add content.

| | Question module | Guide |
|---|---|---|
| Purpose | practice record: locked first attempt, Leitner | first pass: read, predict, reveal, apply |
| Unit | item (`q1`…) | chapter → section → blocks |
| Data | `js/oksat/modules/<slug>.js` | `js/oksat/guides/<slug>/<chapter>.js` |
| Registry | `OKSAT_MANIFEST` | `OKSAT_GUIDES` (both in `js/oksat/manifest.js`) |
| Progress | `oksat:progress:` / `oksat:srs:` (engine) | `oksat:learn:<slug>:<rev>` (`OKSATStore.getLearn`) |

A guide never writes a module's progress or schedule. An item answered in a
guide is stored in the guide's own record, so the module's first-attempt record
stays honest.

## Add a guide

1. Create `js/oksat/guides/<slug>/<chapter>.js` per chapter (kebab-case), each
   ending with one line: `window.__OKSAT_CHAPTER = { … };`.
2. Append one entry to `OKSAT_GUIDES` in `js/oksat/manifest.js`:
   ```js
   { slug: 'ar-crs-aerd', title: '…', kicker: 'Rhinology / Allergy',
     subspecialty: 'rhinology', accent: '#6E4A6B', draft: true,
     desc: 'One line for the hub card.',
     chapters: [
       { id: 'start', short: 'Start here', data: 'js/oksat/guides/ar-crs-aerd/start.js' },
       { id: 'science', k: 1, short: 'Type 2 immunology', min: 35, sections: 10, data: '…/science.js' },
     ] }
   ```
   `accent` equals the subspecialty's hue in `OKSAT_SUBSPECIALTIES`; `sections`
   equals the file's `sections.length`; chapter `id` equals the filename.
   `tools/check-data.mjs` enforces all three.
3. Open `oksat-learn.html?g=<slug>[&c=<chapter>]#<section-id>`.
4. `node tools/stamp-assets.mjs`, then the checks under Verification.

The hub lists guides under **Interactive learning**, grouped by subspecialty.

## Chapter file

```js
window.__OKSAT_CHAPTER = {
    id: 'science',                   // = manifest id = filename
    title: 'Type 2 immunology of the nose',
    kicker: '1 · Basic science',
    lede: 'One or two sentences.',
    src: 'ICAR §VI · EPOS §5.2',     // shown under the lede
    tldr: ['…', '…'],                // the 30-second version, 3–6 bullets
    intro: [ /* start chapter only: sources and any currency warning */ ],
    sections: [{ id: 'sci-1', n: '1.1', title: '…', blocks: [ … ], drill: [ … ] }],
};
```

`k`, `short`, `min` and `sections` live in the manifest so the hub can total
without loading a chapter. A start chapter has no `sections`.

Section ids are kebab-case, **unique across the whole guide**, and permanent:
progress is stored as `<chapter>/<section>`. Retrieval-prompt ids (`c1`, `c2`…)
are permanent within a section.

## Blocks

| `t` | Fields | Renders |
|---|---|---|
| `p`, `why`, `h` | `x` | paragraph, muted aside, sub-heading |
| `ul`, `ol` | `items: [x…]` | list |
| `table` | `head`, `rows`, `wide?` | cell is a string or `{x, rs?, nw?}` (row span, no-wrap) |
| `kv` | `rows: [[term, x]…]` | definition list |
| `call` | `k`: `pearl`｜`trap`｜`mech`｜`hook`, `label`, `blocks` | callout |
| `deep` | `title`, `blocks` | collapsible "Go deeper"; hidden by Core only |
| `cards` | `cols: 1｜2`, `items: [{h, tone?, blocks}]` | comparison cards; `tone` `early`/`late` rules the top edge |
| `steps` | `items: [{n, x, side?}]`, `rise?`, `label?`, `cap?` | ladder; `rise` indents each rung |
| `figure` | `src`, `alt`, `label?`, `cap?` | SVG or image from `images/oksat/` |
| `tool` | `id`, `title`, `src`, `pre?`, `crit`, `rules`, `note?` | checkbox checker |
| `check` | `id`, `q`, `a` | retrieval prompt |
| `practice` | `title?`, `refs: ['<module>:<item>'…]` | module questions answered in place |
| `hotspot` | `id`, `alt`, `label?`, `modes?` (`explore`, `find`), `frames` | tap regions on a figure; graded in find mode |
| `layers` | `id`, `alt`, `base`, `layers: [{id, label, src}]`, `mode` (`toggle`\|`step`), `on?`, `cumulative?`, `cap?` | stacked overlays; stores nothing |
| `neighbors` | `id`, `g`, `dirs?`, `label?` | fill the neighbours of a glossary anchor, then reveal; graded |
| `sequence` | `id`, `q`, `items` (authored in correct order) | put shuffled items in order; graded |

### Anatomy blocks

Graded blocks (`hotspot` in find mode, `neighbors`, `sequence`) need an `id`
unique within the section, shared with `check` ids. Each stores an integer grade
0–3 at `rec.checks[checkKey(…)]`, overwritten on re-grade. `hotspot` in explore
mode and `layers` store nothing. Graded blocks count in the section tally, not
the flashcard deck.

- **`hotspot`**: SVG frames are fetched, sanitized and inlined; each region is an
  element with `data-g="<glossary id>"`. Labels sit in `<g data-label="1">` and
  hide in find mode. Raster frames (`.png`, `.jpg`, `.webp`) take
  `regions: [{g, poly}]`, `poly` a flat list of ≥ 3 x,y pairs in 0–100 percent.
  Find mode needs ≥ 3 regions per frame. The ear-anatomy CT frames are generated:
  `tools/tbone-pipeline/slices.py` writes their regions from UW label tips
  (one pointer region per tip, not a segmentation); change them by rerunning it.
  `g` must be a glossary id (`js/olsb/glossary.js`).
- **`layers`**: one `base` plus ≥ 2 overlays of identical size, each with a
  unique `id` and a `label` read in an `aria-live` caption.
- **`neighbors`**: `dirs` ⊆ `sup, inf, ant, post, lat, med`; defaults to every
  direction the anchor has a relation in (`rel` plus reverses). Needs ≥ 2
  directions with relations. Reveal lists glossary names per direction.
- **`sequence`**: ≥ 3 unique items, shuffled on render; "Check order" marks each
  row by position.
- **Degrade rule**: if the glossary or an SVG fails to load, `hotspot` renders as
  a plain `figure` (first frame) and `neighbors` renders nothing.

### Flags and attribution

- `unlisted: true` on a guide or module entry hides it from the hub; the URL
  still works. Boolean only.
- `draft: true` lists the entry with a **Draft: in progress** badge and a notice
  on the guide's Start-here chapter (or above the module). Every new entry is
  `draft: true` from the day it is built; only the owner removes it
  (`docs/decisions.md` §9). Boolean only.
- Purpose-drawn figures are captioned schematic. Each open-licence raster (and
  any open-licence CT image) under `images/oksat/<slug>/` needs a row in
  `images/oksat/<slug>/ATTRIBUTION.md` (file, source URL, author, licence), and
  its caption credits the source. Copyrighted figures (textbook, Netter-style,
  Kenhub, Gralapp) are never committed, not even unlisted. `check-data` enforces
  `ATTRIBUTION.md` for each slug in `ATTRIBUTED`.

### Inline markup

Plain text plus a small safe subset, parsed into DOM nodes (never `innerHTML`):
`**bold**`, `*italic*`, `\*` for a literal star, `[[src|EPOS 5.2]]` for a source
chip, `[[A|pos|Strong rec]]` for an evidence chip (grade, then `pos`, `neg` or
`neu`, then the policy). Sub- and superscripts are Unicode (`IL-10⁺`, `αβγ₂`).
`check-data` fails any string whose stars or `[[ ]]` do not close. Bullets are
`ul` blocks, never text.

### Terms (`js/oksat/terms.js`)

Every specialty abbreviation a reader sees is defined once in the lexicon
(`TERMS`, keyed by the exact surface form), and the viewer marks **every**
occurrence: hover or focus shows the full name; a tap or Enter pins it; a tap
elsewhere or Escape closes it. Links, buttons, summaries and source chips are not
marked, so a tap there keeps its own job. Module questions shown in place are marked.

`check-data` enforces, over every string a reader sees (figure `alt` excluded):

- **Every acronym-shaped token resolves.** Two capitals (`CRS`), a capital and a
  digit (`Th17`), or lowercase into a capital (`eCRS`, `sIgE`) must be a `TERMS`
  key or `PLAIN`. Hyphenated words match their longest known run (`anti-IL-5Rα`
  → `IL-5Rα`); a lowercase plural finds its singular.
- **No idle entries.** A term no guide uses fails; delete it.
- **Expand only what a non-otolaryngologist may not know.** `TERMS` holds
  specialty vocabulary: disease names and procedures (CRSwNP, CCAD), specialty
  scores and tests (SNOT-22), sources and trials (EPOS), specialised immunology
  (ILC2, TSLP, CD numbers). General medical terms go in `PLAIN` and are never
  marked: NSAID, PFT, RCT, COPD, CRP, IgE, Th2, CT. So are Roman numerals,
  interleukins by number (`IL-13`), units, and ambiguous forms (T2). When unsure,
  ask whether an internist would stop at it.
- **The value is the full name**, then other names after a semicolon
  (`'CD23': 'FcεRII; low-affinity IgE receptor'`). No claims or numbers.
- **Meaning collisions across guides** (ESS: endoscopic sinus surgery vs Epworth
  Sleepiness Scale) are the one case for a per-guide override, added with the
  first guide that needs it.
- **Never a spoiler**: a `check` prompt never asks what an abbreviation stands for.

## Teaching blocks in use

### Retrieval prompts (`check`)

The learner may type an answer first (kept only in the tab, never stored),
reveals the model answer, then self-grades on the four tiers (keys 1 to 4):
didn't know, guessed, got it partially, knew it cold. The grade is stored per
prompt and feeds the flashcard deck. Write the prompt to be answerable from
memory; the model answer is the minimum a good answer contains (`\n` makes
paragraphs). Put the prompt after the teaching it tests.

### Checkers (`tool`)

A declarative checklist with ordered `rules`; the first rule whose conditions
hold supplies the output. Conditions: `eq`, `min`, `max` on the count ticked, and
`pre: false` when the optional prerequisite box (`pre`) is unticked. `tone` is
`yes`, `no` or omitted. Templates: `{k}` ticked, `{n}` total, `{miss}` unticked.
The last rule must match (`min: 0`). Use a checker only for a rule the learner
applies with a checklist in hand (a criteria set with a threshold), and cite its
source in `src`.

### Module questions in place (`practice`)

`refs` name real module items. The viewer loads the module, renders each item
with the recall gate, locks the first answer, and links to the module. The text
lives once, in the module. Pick items that apply the section's facts rather than
repeat a prompt already in the section. `check-data` fails a ref that does not
resolve.

### Drill rows (`drill`)

`drill: [{ m: '<module slug>', c: ['<concept key>'…] }]` ends a section with links
to `oksat-study.html?m=<slug>&c=<concept>` and a live count. Every concept must
exist in that module and have items. A section with no module questions has no `drill`.

## Teaching conventions

- **Order**: the 30-second version, then sections that each teach, then checks.
  One idea per section; three headings means two sections.
- **Retrieval, not rereading**: two or three `check` prompts per section, sometimes
  a prompt first ("predict") and the explanation after.
- **Mechanism before fact**: `mech` explains why; `pearl` states the one thing to
  keep; `trap` names the likely error; `hook` gives a mnemonic. Colour is carried
  by these four callouts only.
- **Depth is optional**: beyond the first pass goes in `deep`.
- **Sources**: name the source on the claim (`[[src|…]]`); where sources disagree,
  a `trap` labelled "Source conflict". Numbers come from a source, never memory.
  Content is draft; the owner verifies.
- **Figures**: reuse a figure from `images/oksat/` where it agrees with the text.
  A new one is SVG drawn for the purpose, labelled schematic, with alt text, in
  `images/oksat/<guide slug>/` (`docs/authoring-oksat.md`). Draw one only where a
  picture carries what prose cannot: a mechanism or loop, a time course, a spatial
  relation, a threshold. Place it after the teaching it illustrates.
- **Synonyms**: when a term has several names (CD number, eponym, abbreviation),
  give both at first use, figures included, and add the term to `terms.js`. A
  Start-chapter glossary table is for synonym sets worth reading as a list, not
  for abbreviations, which the popover covers.
- **Link the two halves**: facts not yet drillable get questions in a module
  (new items, new ids), not inline text in the guide.

Voice: the module voice (`docs/design-principles.md` §6). No exclamation marks,
no gamification, no congratulation.

## Verification

`node tools/check-data.mjs` (structure, markup, figures, references, terms);
`node tools/test-oksat-learn.mjs` (behaviour); `node tools/smoke-pages.mjs` (the
page boots). Then read the chapter in both themes and at phone width. A green
check proves structure, not that the page teaches.
