# Authoring an OKSAT study module

OKSAT — the OHNS Knowledge Self-Assessment Tool. Every study module is a single
JavaScript data file plus one manifest entry. The shared engine
(`js/oksat-engine.js`) renders it — you never touch the engine or write any UI.
The fastest authoring path is the **Question Forge** (`oksat-generate.html`):
paste source text, review the generated items, download the module file and the
manifest entry. This document is the underlying schema (which the Forge also
targets). The engine is **tolerant of sparse data**: a module with only a
title and a list of questions works. Everything else is optional and is shown
only when present.

## Add a module in 3 steps

1. **Create** `js/mcq-modules/<slug>.js` (kebab-case slug, e.g. `larynx-anatomy`).
2. **End the file** with exactly one registration line:
   ```js
   window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
   ```
   (`DOMAINS` and `CONCEPTS` may be omitted — see below.)
3. **Append one entry** to `js/oksat-manifest.js`:
   ```js
   { slug: 'larynx-anatomy', title: 'Laryngeal Anatomy', kicker: 'Laryngology',
     subspecialty: 'laryngology',   // keys into OKSAT_SUBSPECIALTIES (Atlas hue + clustering)
     count: 25, accent: '#4A6B7B',
     desc: 'One-line description shown on the hub card.',
     data: 'js/mcq-modules/larynx-anatomy.js' },
   ```

Open `oksat-study.html?m=larynx-anatomy` to view it; it also appears on the hub
(`oksat.html`) and as a node cluster in the Atlas graph view. A concept deep
link also works: `oksat-study.html?m=larynx-anatomy&c=<concept-key>`.

## Schema reference

### `meta` (object)
| Field | Required | Notes |
|---|---|---|
| `title` | recommended | Module heading. A `\n` splits it across two lines; the second line renders italic. |
| `subtitle` | optional | One or two sentences under the title. |
| `kicker` | optional | Small all-caps label above the title (e.g. `Self-Assessment · Otology`). |
| `id` | optional | Falls back to the manifest slug for storage keys. |

### `DOMAINS` (object, optional)
`key → { label, color, hex }`. `color` is a solid hue (chip text + accent bar);
`hex` is a translucent fill (chip background), e.g. `rgba(44,84,84,0.14)`.
Omit `DOMAINS` (or `CONCEPTS`) entirely and the "Explore by Domain" section and
concept chips simply don't render.

### `CONCEPTS` (object, optional)
`key → { label, domain }`. `domain` must be a key in `DOMAINS`. Concepts power
the chip filter, the domain tree, and the "Explore Related" suggestions (related
questions are found by shared concept tags).

### `ITEMS` (array, required)
| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique, conventionally `q1`, `q2`, … (used by progress dots + related list). |
| `type` | optional | `'mcq'` (default) or `'recall'`. |
| `stem` | yes | The question text. |
| `options` | mcq only | `[{ id: 'a', text: '…' }, …]`. |
| `correct` | mcq only | The `id` of the correct option. |
| `answer` | recall only | The text revealed for a recall card. |
| `brief` | recommended | Short explanation shown after answering. |
| `detailed` | optional | Longer explanation behind a "Read more" toggle. |

`stem`, `answer`, `brief`, and `detailed` honor `\n` as a line break, so you can
lay out short lists or text "tables" inside a field (see
`js/mcq-modules/dtc-risk-stratification.js`, a fully recall/free-response set).

### Recall (free-response) cards

A `type: 'recall'` card shows the `stem`, a **Reveal answer** button, then the
`answer` text. The learner self-grades on a four-point scale instead of a binary
got-it / missed — each tier drives spaced repetition differently:

| Grade (keys 1–4) | Counts as correct? | Leitner move |
|---|---|---|
| Didn't know | no | reset to box 1 |
| Guessed | no | reset to box 1 |
| Got it partially | yes | +1 box |
| Knew it cold | yes | +2 boxes |
| `concepts` | optional | Array of `CONCEPTS` keys; defaults to `[]`. |
| `section` | optional | Small label above the question (e.g. `Embryology`). |
| `difficulty` | optional | Small badge near the counter (e.g. `hard`). |
| `reference` | optional | Citation line under the explanation. |

## Minimal template (sparse — no taxonomy)

```js
const meta = { title: 'Quick Set', kicker: 'MCQ · Scratch' };
const ITEMS = [
  { id: 'q1', stem: 'First question?',
    options: [{ id: 'a', text: 'Yes' }, { id: 'b', text: 'No' }],
    correct: 'a', brief: 'Because…' },
  { id: 'q2', stem: 'Second question?',
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    correct: 'b', brief: 'Since…' },
];
window.__MCQ_MODULE = { meta, ITEMS };
```

## Full-featured item (with taxonomy + optional fields)

```js
const DOMAINS = {
  otology: { label: 'Otology', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
};
const CONCEPTS = {
  'middle-ear': { label: 'Middle ear', domain: 'otology' },
};
const ITEMS = [
  { id: 'q1', type: 'mcq', section: 'Anatomy', difficulty: 'medium',
    stem: 'Which ossicle articulates with the oval window?',
    options: [
      { id: 'a', text: 'Malleus' }, { id: 'b', text: 'Incus' },
      { id: 'c', text: 'Stapes' }, { id: 'd', text: 'Tensor tympani' },
    ],
    correct: 'c',
    brief: 'The stapes footplate sits in the oval window.',
    detailed: 'Sound passes malleus → incus → stapes; the footplate transmits…',
    reference: 'Cummings Otolaryngology, 7e, Ch. 129.',
    concepts: ['middle-ear'] },
];
window.__MCQ_MODULE = { meta: { title: 'Otology Set' }, DOMAINS, CONCEPTS, ITEMS };
```

## Conventions & tips

- Keep the manifest `count` in sync with the number of `ITEMS`.
- Pair each domain's `color` (solid) with a matching translucent `hex`.
- Progress and spaced-repetition state are stored per module **and per
  reviewer** in `localStorage` under `oksat:progress:<slug>:<code>` and
  `oksat:srs:<slug>:<code>` (legacy `mcq:*` keys are migrated automatically).
  Module-level completion also syncs to the shared database file
  `data/oksat-db.json` via the hub's Settings → Completion database panel.
  The reviewer `<code>` (e.g. `kafle`, `terry`) is
  collected by `js/oksat-reviewer.js` — a small prompt shown on each study
  session, with a typo failsafe that flags unknown codes and suggests the
  closest existing one. This lets coresidents share one browser while keeping
  separate progress. Changing a question's `id` resets its history.
- Preview locally with no build step: `python3 -m http.server` then open
  `http://localhost:8000/oksat-study.html?m=<slug>`.
