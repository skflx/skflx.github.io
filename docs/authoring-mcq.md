# Authoring an MCQ study module

Every study module is a single JavaScript data file plus one manifest entry.
The shared engine (`js/mcq-engine.js`) renders it — you never touch the engine
or write any UI. The engine is **tolerant of sparse data**: a module with only a
title and a list of questions works. Everything else is optional and is shown
only when present.

## Add a module in 3 steps

1. **Create** `js/mcq-modules/<slug>.js` (kebab-case slug, e.g. `larynx-anatomy`).
2. **End the file** with exactly one registration line:
   ```js
   window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
   ```
   (`DOMAINS` and `CONCEPTS` may be omitted — see below.)
3. **Append one entry** to `js/mcq-manifest.js`:
   ```js
   { slug: 'larynx-anatomy', title: 'Laryngeal Anatomy', kicker: 'Laryngology',
     count: 25, accent: '#4A6B7B',
     desc: 'One-line description shown on the hub card.',
     data: 'js/mcq-modules/larynx-anatomy.js' },
   ```

Open `mcq-study.html?m=larynx-anatomy` to view it; it also appears on `mcq.html`.

## Schema reference

### `meta` (object)
| Field | Required | Notes |
|---|---|---|
| `title` | recommended | Module heading. A `\n` splits it across two lines; the second line renders italic. |
| `subtitle` | optional | One or two sentences under the title. |
| `kicker` | optional | Small all-caps label above the title (e.g. `MCQ · Otology`). |
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
- Progress and spaced-repetition state are stored per module in `localStorage`
  under `mcq:progress:<slug>` and `mcq:srs:<slug>`; changing a question's `id`
  resets its history.
- Preview locally with no build step: `python3 -m http.server` then open
  `http://localhost:8000/mcq-study.html?m=<slug>`.
