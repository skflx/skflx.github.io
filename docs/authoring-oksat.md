# Authoring an OKSAT study module

A module is one JavaScript data file plus one manifest entry. The engine
(`js/oksat/engine.js`) renders it; never touch the engine or write UI.

This is the **quality specification**. The engine tolerates sparse data, but
every shipped module meets the full spec. `tools/check-data.mjs` enforces the
structural subset; `tools/lint-oksat.mjs <slug>` enforces the rest and must
come back clean. The agent recipe (sources, figures, arc, cases) is
`.claude/skills/oksat-module/SKILL.md`.

## Add a module

1. **Create** `js/oksat/modules/<slug>.js` (kebab-case; `slug` = filename).
2. **End the file** with exactly one line:
   ```js
   window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
   ```
3. **Append one entry** to `js/oksat/manifest.js` (fields below).

Preview: `python3 -m http.server`, then `oksat-study.html?m=<slug>`. A concept
deep link adds `&c=<concept-key>`.

## Schema

### `meta` (required)

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Heading. A `\n` splits it; the second line renders italic. |
| `subtitle` | yes | One or two sentences: scope and arc. |
| `kicker` | yes | Small label above the title, e.g. `Self-Assessment · Otology`. |
| `id` | yes | Set explicitly to the slug (storage key). |
| `sources` | recommended | Array of citation strings, rendered under the subtitle. |

### `DOMAINS` (required)

`key → { label, color, hex }`, 5–8 per module (a guide's companion module may
have up to one per numbered chapter). `color` is the solid hue; `hex` the
translucent chip fill, e.g. `'rgba(44,84,84,0.14)'`. Every concept belongs to
exactly one domain.

### `CONCEPTS` (required)

`key → { label, domain }`, 20–50 per module (a guide's companion may have up
to one per guide section). Keys are kebab-case; `domain` must be a `DOMAINS`
key. Concepts drive the chip filter, the domain tree and "Explore Related".
Multi-question case sequences share a `case-<name>` concept so the filter
isolates the case as a study unit.

### `ITEMS` (required)

Every item opens on a **recall gate**: the stem shows first, and the learner
either answers from memory and self-grades (**Reveal answer**), or picks **Show
the choices** and answers as a locked-first-attempt MCQ. The engine records the
path, so a cold recall and a correct MCQ stay distinct. Authoring is unchanged:
write every MCQ stem so it is answerable from memory.

**Changing an item `id` resets its study history.** Ids are permanent once a
module has been studied; new items get new ids, appended, never renumbered.
On a studied item, do not reorder options or change `correct`.

#### MCQ (`type: 'mcq'`, the default)

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique in the module, conventionally `q1`, `q2`, … |
| `stem` | yes | Question text. |
| `options` | yes | `[{ id: 'a', text }, …]`, typically 4. |
| `correct` | yes | Id of the correct option. |
| `brief` | yes | 1–2 sentences: the takeaway, shown right after answering. |
| `detailed` | yes | Behind "Read more": mechanism → application → pearl. |
| `concepts` | yes | 1–3 `CONCEPTS` keys; never empty. |
| `section` | recommended (>30 items) | Small label above the question. |
| `image`, `imageAlt` | optional | Shown under the stem. Alt required with it. |
| `explanationImage`, `explanationImageAlt` | optional | Shown inside the explanation. |

#### Recall (`type: 'recall'`)

| Field | Required | Notes |
|---|---|---|
| `id`, `type`, `stem`, `concepts` | yes | As MCQ; `type` must be `'recall'`. |
| `answer` | yes | Revealed on "Reveal answer". `\n` and `• ` lists allowed. |
| `brief` | yes | The "so what" after self-grading. |
| `detailed` | recommended | Omit only if `answer` is already complete. |
| `section` | yes | Recall modules group by section; they have no option chips. |

Self-grade (keys 1–4):

| Grade | Correct? | Leitner move |
|---|---|---|
| Didn't know | no | reset to box 1 |
| Guessed | no | reset to box 1 |
| Got it partially | yes | +1 box |
| Knew it cold | yes | +2 boxes |

### Text and images

`stem`, `answer`, `brief` and `detailed` honour `\n`. The engine renders plain
text only: `**bold**`, `#` and backticks show literally; use `\n` and `• `.
`lint-oksat` flags markdown.

Images live in `images/oksat/<slug>/`, as paths from the repo root. A labelled
figure (classification panel, staging table) goes in `explanationImage`, not
`image`: in the stem it reveals the answer before the gate. Third-party figures
keep their licence: copy unmodified, credit in the file header and
`meta.sources`. A drawn SVG loads as `<img>`, so it cannot use site tokens or
fonts: give it a white background, system fonts, the two signal colours as hex,
and label it schematic.

### Sequence and arc

Order items as a deliberate arc, adapted to the topic:

1. Foundations (anatomy, embryology, physiology, definitions)
2. Pathophysiology and classification
3. Workup and diagnosis
4. Management and complications
5. Integrating cases, last: 3–4 questions sharing a scenario and a
   `case-<name>` concept, each building on the last.

Recall modules may use **sequential dependency**, where each answer feeds the
next. Do not shuffle those; order matters.

### Explanation voice

Teach mechanism → application → pearl. `brief` is the takeaway; `detailed`
gives the mechanism, when it matters, and the pearl (for cases, the decision
path). No gamification, exclamation marks or congratulation. Source:
`docs/design-principles.md` §6.

## File conventions

- Header comment naming the module, subspecialty and any source
  (`/* Source: … — adapted. */`).
- Modules over 20 items: comment dividers by domain (authoring only).
- Last line: the registration line above.

## Manifest entry

| Field | Notes |
|---|---|
| `slug` | equals the filename |
| `title`, `kicker`, `desc` | hub card: title, label, one line |
| `subspecialty` | key into `OKSAT_SUBSPECIALTIES` (grouping and hue) |
| `count` | equals `ITEMS.length`; the hub meter depends on it |
| `accent` | the subspecialty's hue from `OKSAT_SUBSPECIALTIES`, never invented (a new subspecialty is an owner decision, `docs/decisions.md` §7) |
| `data` | `'js/oksat/modules/<slug>.js'` |

Unfinished modules set `draft: true` (`docs/decisions.md` §9).

## Guides that link here

An Interactive learning guide (`docs/authoring-oksat-guide.md`) drills into a
module by concept key and answers items in place by item id.
`tools/check-data.mjs` fails when either stops resolving, so treat concept keys
as stable as ids.

## Storage

Progress and SRS live under `oksat:progress:<slug>:<code>` and
`oksat:srs:<slug>:<code>`, with `<code>` resolved by `OKSATStore.reviewer()`.
Keys and migration: `docs/decisions.md` §3. Nothing is uploaded.

## Quality checklist

- [ ] `meta` has `title`, `subtitle`, `kicker`, `id`
- [ ] `DOMAINS`: 5–8 entries, each with `label`, `color`, `hex`
- [ ] `CONCEPTS`: 20–50 entries, each with `label` and a valid `domain`
- [ ] Every item has `brief`, 1–3 `concepts`, and `detailed` (MCQ) or `answer` (recall)
- [ ] No orphan concepts; no untagged items
- [ ] Cases last, with `case-<name>` concepts (if any)
- [ ] `section` on items in modules over 30 items, and on all recall items
- [ ] Arc: foundations → pathology → workup → management → cases
- [ ] Manifest: correct `count`, valid `subspecialty`, accent from `OKSAT_SUBSPECIALTIES`
- [ ] `node tools/check-data.mjs` and `node tools/lint-oksat.mjs <slug>` pass
- [ ] `oksat-study.html?m=<slug>` renders

## Minimal template

```js
const meta = {
    title: 'Laryngeal Anatomy',
    subtitle: 'Framework, musculature, innervation, and spaces of the larynx.',
    kicker: 'Self-Assessment · Laryngology',
    id: 'larynx-anatomy',
};

const DOMAINS = {
    framework: { label: 'Framework', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
};

const CONCEPTS = {
    'cartilages': { label: 'Cartilages', domain: 'framework' },
};

const ITEMS = [
    {
        id: 'q1', type: 'mcq',
        stem: 'Which laryngeal cartilage is the only complete ring?',
        options: [
            { id: 'a', text: 'Thyroid' },
            { id: 'b', text: 'Cricoid' },
            { id: 'c', text: 'Arytenoid' },
            { id: 'd', text: 'Epiglottis' },
        ],
        correct: 'b',
        brief: 'The cricoid is the only complete cartilaginous ring in the airway.',
        detailed: 'Mechanism, application and pearl, in prose.',
        concepts: ['cartilages'],
    },
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
```
