# Authoring an OKSAT study module

OKSAT — the OHNS Knowledge Self-Assessment Tool. Every study module is a single
JavaScript data file plus one manifest entry. The shared engine
(`js/oksat-engine.js`) renders it — you never touch the engine or write any UI.

This document is the **quality specification**, not a minimal-acceptance gate.
The engine tolerates sparse data (a title + questions works), but every shipped
module must meet the full spec below. The ingestion system enforces it;
`tools/check-data.mjs` enforces the structural subset.

## Add a module in 3 steps

1. **Create** `js/mcq-modules/<slug>.js` (kebab-case slug, e.g. `larynx-anatomy`).
2. **End the file** with exactly one registration line:
   ```js
   window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
   ```
3. **Append one entry** to `js/oksat-manifest.js`:
   ```js
   { slug: 'larynx-anatomy', title: 'Laryngeal Anatomy', kicker: 'Laryngology',
     subspecialty: 'laryngology',   // keys into OKSAT_SUBSPECIALTIES (hue + hub grouping)
     count: 25, accent: '#4A6B7B',
     desc: 'One-line description shown on the hub card.',
     data: 'js/mcq-modules/larynx-anatomy.js' },
   ```

Open `oksat-study.html?m=larynx-anatomy` to view it; it also appears on the
hub (`oksat.html`), grouped under its subspecialty. A concept deep link also
works: `oksat-study.html?m=larynx-anatomy&c=<concept-key>`.

---

## Schema reference

### `meta` (object, required)

| Field | Required | Notes |
|---|---|---|
| `title` | **yes** | Module heading. A `\n` splits it across two lines; the second line renders italic. |
| `subtitle` | **yes** | One or two sentences under the title — describes the module's scope and arc. |
| `kicker` | **yes** | Small all-caps label above the title (e.g. `Self-Assessment · Otology`). |
| `id` | **yes** | Falls back to the manifest slug for storage keys; set it explicitly to match the slug. |
| `sources` | recommended | Array of strings — provenance citations for the module's content (e.g. `['AAO-HNSF Otolaryngology Core Curriculum']`). Rendered below the subtitle when present. |

### `DOMAINS` (object, required)

`key → { label, color, hex }`. **5–8 domains per module.**

- `color` — a solid hue (chip text + accent bar), e.g. `'#2C5454'`.
- `hex` — a translucent fill (chip background), e.g. `'rgba(44,84,84,0.14)'`.

Pair each domain's `color` with a matching translucent `hex`. Domains provide
the top-level topical grouping; every concept belongs to exactly one domain.

### `CONCEPTS` (object, required)

`key → { label, domain }`. **20–50 concepts per module; 1–3 concept tags per item.**

- `domain` — must be a key in `DOMAINS`.
- Concept keys are `kebab-case`.

Concepts power the chip filter, the domain tree, and the "Explore Related"
suggestions (related questions are found by shared concept tags). An item with
no concept tags is a dead node — it won't appear in any concept-filtered view.

**Case-specific concept keys:** multi-question case sequences (§ Case scenarios
below) should share a concept key prefixed `case-` (e.g. `case-acoustic`,
`case-scc`). This lets the chip filter isolate the entire case as a study unit.

### `ITEMS` (array, required)

#### MCQ items (`type: 'mcq'` — default)

| Field | Required | Notes |
|---|---|---|
| `id` | **yes** | Unique within the module, conventionally `q1`, `q2`, … Used by progress dots + related list. **Changing an id resets its study history.** |
| `type` | omit or `'mcq'` | Defaults to `'mcq'`. |
| `stem` | **yes** | The question text. |
| `options` | **yes** | `[{ id: 'a', text: '…' }, …]` — typically 4 options (a–d). |
| `correct` | **yes** | The `id` of the correct option. |
| `brief` | **yes** | 1–2 sentence explanation shown immediately after answering — the takeaway. |
| `detailed` | **yes** | Longer explanation behind a "Read more" toggle — teaches mechanism → application → pearl. |
| `concepts` | **yes** | Array of `CONCEPTS` keys. 1–3 tags per item; every item must have at least one. |
| `section` | recommended (>30 items) | Small label above the question (e.g. `Embryology`). Adds visible grouping in the UI. |

#### Recall items (`type: 'recall'`)

| Field | Required | Notes |
|---|---|---|
| `id` | **yes** | Same rules as MCQ. |
| `type` | **yes** | Must be `'recall'`. |
| `stem` | **yes** | The question / prompt text. |
| `answer` | **yes** | The text revealed on "Reveal answer." Supports `\n` for line breaks and bullet lists. |
| `brief` | **yes** | Short explanation — the "so what" after self-grading. |
| `detailed` | recommended | Longer explanation when the answer needs elaboration. May be omitted if `answer` is already comprehensive. |
| `concepts` | **yes** | Same rules as MCQ. |
| `section` | **yes** (recall modules) | Recall modules rely on `section` for visual grouping since they lack the domain-chip interplay MCQ modules get from options. |

A `type: 'recall'` card shows the `stem`, a **Reveal answer** button, then the
`answer` text. The learner self-grades on a four-point scale:

| Grade (keys 1–4) | Counts as correct? | Leitner move |
|---|---|---|
| Didn't know | no | reset to box 1 |
| Guessed | no | reset to box 1 |
| Got it partially | yes | +1 box |
| Knew it cold | yes | +2 boxes |

### Text formatting

`stem`, `answer`, `brief`, and `detailed` honor `\n` as a line break. Use it
for short lists, bullet-point layouts, or text "tables" within a field (see
`js/mcq-modules/dtc-risk-stratification.js` for multi-line recall answers).
Template literals (backtick strings) work well for multi-line `answer` fields.

---

## Module structure

### Progression arc

Items should follow a deliberate pedagogical arc within the module:

1. **Foundational knowledge** — anatomy, embryology, physiology, definitions
2. **Pathophysiology & classification** — disease mechanisms, staging systems
3. **Workup & diagnosis** — imaging, labs, electrodiagnostics, exam findings
4. **Management & treatment** — medical therapy, surgical approaches, complications
5. **Integrating case scenarios** — multi-question sequences at the end

Not every module follows every tier — the arc adapts to the topic. A
procedural module (like `ta-tubes`) may emphasize tiers 3–5; a risk-strat
module (like `dtc-risk-stratification`) may be mostly tier 2.

### Case scenarios

Place multi-question clinical cases at the end of the module. A case is 3–4
questions sharing a clinical scenario and a `case-<name>` concept key.

- The first question sets the scene (history, exam, imaging).
- Subsequent questions build on prior answers — diagnosis, management,
  complications.
- Case-specific concept keys (e.g. `case-scc`, `case-ramsay`) let the chip
  filter isolate the case as a study unit.

See `js/mcq-modules/facial-reanimation.js` for the benchmark implementation.

### Sequential dependency (recall modules)

In recall-only modules, items can be designed so each answer becomes
load-bearing for the next — the learner builds up a framework question by
question. This is a distinct pedagogical mode from independent MCQ items.
**When using sequential dependency, item ordering matters — do not shuffle.**

See `js/mcq-modules/dtc-risk-stratification.js` for the canonical example.

---

## Explanation voice

From `docs/design-principles.md` §6 — explanations teach
**mechanism → application → pearl**:

- **`brief`** — the takeaway in 1–2 sentences. Answer the "so what."
- **`detailed`** — the teaching explanation. Start with mechanism (why the
  answer is correct), move to clinical application (when it matters), end with
  a pearl (the thing to remember). For case questions, walk the decision
  algorithm.

Never gamification language, exclamation marks, or congratulatory phrasing.
The voice is that of a teaching attending, not a quiz app.

---

## Data file conventions

### File header

Start the file with a comment block identifying the module:

```js
/* =================================================================
   <Module Title>
   OKSAT · <Subspecialty> Module
   ================================================================= */
```

If the content derives from a specific source, note it in the header (this
complements `meta.sources`, which is rendered in the UI):

```js
/* Source: AAO-HNSF Otolaryngology Core Curriculum — adapted. */
```

### Section dividers

For modules with >20 items, group items by domain using comment dividers:

```js
// ─────────────── FOUNDATIONS ───────────────
```

or

```js
// ════════════════ ANATOMY ════════════════
```

This is an authoring convention for file navigability — not parsed by the
engine.

### Registration line

The file must end with exactly one registration line:

```js
window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
```

---

## Manifest entry

Each module has one entry in `js/oksat-manifest.js`:

| Field | Required | Notes |
|---|---|---|
| `slug` | **yes** | Must match the filename (`js/mcq-modules/<slug>.js`). Kebab-case. |
| `title` | **yes** | Hub card title. |
| `kicker` | **yes** | Hub card subtitle label. |
| `subspecialty` | **yes** | Key into `OKSAT_SUBSPECIALTIES` — determines hub grouping and accent hue. |
| `count` | **yes** | Must equal `ITEMS.length` — `tools/check-data.mjs` enforces this. |
| `accent` | **yes** | Hex color for the hub card accent bar. Use the subspecialty's hue from `OKSAT_SUBSPECIALTIES`. |
| `desc` | **yes** | One-line description shown on the hub card. |
| `data` | **yes** | Path to the data file: `'js/mcq-modules/<slug>.js'`. |

**Accent hue rule:** the accent comes from `OKSAT_SUBSPECIALTIES`, not
invented. Adding a 10th subspecialty is an owner decision
(`docs/decisions.md` §7).

---

## Quality checklist

Before a module ships:

- [ ] `meta` has `title`, `subtitle`, `kicker`, `id`
- [ ] `DOMAINS` defined, 5–8 entries, each with `label`, `color`, `hex`
- [ ] `CONCEPTS` defined, 20–50 entries, each with `label` and valid `domain`
- [ ] Every item has `brief`, `concepts` (1–3 tags), and either `detailed` (MCQ) or `answer` (recall)
- [ ] No orphan concepts (every concept is tagged by at least one item)
- [ ] No untagged items (every item has at least one concept)
- [ ] Case scenarios at the end with `case-<name>` concept keys (if applicable)
- [ ] `section` field on items in modules with >30 items or recall items
- [ ] Progression arc: foundations → pathology → workup → management → cases
- [ ] Manifest entry with correct `count`, valid `subspecialty`, accent from `OKSAT_SUBSPECIALTIES`
- [ ] `tools/check-data.mjs` passes
- [ ] Preview: `oksat-study.html?m=<slug>` renders correctly

---

## Dropped fields

The following fields were in earlier schema versions but are **not used by any
shipped module** and are excluded from the quality spec. The engine may still
accept them, but the ingestion system does not produce them:

| Field | Reason dropped |
|---|---|
| `difficulty` | Static difficulty labels are redundant with Leitner SRS — the learner's performance *is* the difficulty signal. |
| `reference` (per-item) | Replaced by `meta.sources` (module-level attribution). Per-item citations were never authored. |
| `distractorNotes` | Never authored across 182 MCQ items. If distractor analysis becomes valuable, the ingestion system can generate it as a separate layer. |

---

## Minimal template (MCQ with taxonomy)

```js
const meta = {
    title: 'Laryngeal Anatomy',
    subtitle: 'Framework, musculature, innervation, and spaces of the larynx.',
    kicker: 'Self-Assessment · Laryngology',
    id: 'larynx-anatomy',
};

const DOMAINS = {
    framework: { label: 'Framework', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
    muscles:   { label: 'Musculature', color: '#6E4A6B', hex: 'rgba(110,74,107,0.14)' },
};

const CONCEPTS = {
    'cartilages':  { label: 'Cartilages', domain: 'framework' },
    'intrinsic':   { label: 'Intrinsic muscles', domain: 'muscles' },
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
        detailed: 'The cricoid forms a signet-ring shape — narrow anteriorly, broad posteriorly (the lamina). It articulates with both arytenoids superiorly and the thyroid cartilage at the cricothyroid joints. Its completeness makes it the structural foundation of the laryngeal skeleton and the narrowest fixed point of the pediatric airway.',
        concepts: ['cartilages'],
    },
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
```

## Full-featured item (case scenario with multi-question sequence)

```js
// Case-specific concept for chip-filter isolation
const CONCEPTS = {
    // ... other concepts ...
    'case-bell': { label: 'Case: Bell palsy', domain: 'cases' },
};

const ITEMS = [
    // ... earlier items ...

    // ─────────────── CASES ───────────────
    {
        id: 'q38', type: 'mcq', section: 'Cases',
        stem: 'A 45-year-old presents with acute-onset right facial paralysis, hyperacusis, and dysgeusia. Exam shows complete paralysis (HB VI). No vesicles. What is the most likely diagnosis?',
        options: [
            { id: 'a', text: 'Ramsay Hunt syndrome' },
            { id: 'b', text: 'Bell palsy' },
            { id: 'c', text: 'Acoustic neuroma' },
            { id: 'd', text: 'Cholesteatoma' },
        ],
        correct: 'b',
        brief: 'Acute complete facial paralysis with hyperacusis and dysgeusia, without vesicles, is the classic Bell palsy presentation.',
        detailed: 'Bell palsy is an acute idiopathic facial neuropathy — the most common cause of unilateral facial paralysis. The combination of hyperacusis (stapedius involvement) and dysgeusia (chorda tympani) localizes the lesion to the fallopian canal. Absence of vesicles distinguishes it from Ramsay Hunt (VZV reactivation in the geniculate ganglion). Onset is rapid (hours to 2 days); most recover, but complete paralysis carries a worse prognosis than incomplete.',
        concepts: ['case-bell', 'bell-palsy', 'facial-nerve'],
    },
    {
        id: 'q39', type: 'mcq', section: 'Cases',
        stem: '(Same patient.) At 2 weeks, ENoG shows >90% degeneration on the affected side. What is the next step?',
        options: [
            { id: 'a', text: 'Continue observation' },
            { id: 'b', text: 'Transmastoid facial nerve decompression' },
            { id: 'c', text: 'Hypoglossal–facial nerve transfer' },
            { id: 'd', text: 'Cross-face nerve graft' },
        ],
        correct: 'b',
        brief: 'ENoG >90% degeneration within 2 weeks of onset is the threshold for surgical decompression in Bell palsy.',
        detailed: 'The Gantz criteria: ENoG ≥90% degeneration within 14 days AND no voluntary EMG motor unit potentials → transmastoid decompression of the meatal foramen and labyrinthine segment (the narrowest portion). This must happen within 2 weeks of onset — beyond that, Wallerian degeneration is complete and decompression loses its window. The evidence base is a single RCT (Gantz, 1999) showing improved outcomes vs. observation in this subgroup.',
        concepts: ['case-bell', 'electrodiagnostics', 'decompression'],
    },
];
```

---

## Conventions & storage

- Keep the manifest `count` in sync with `ITEMS.length`.
- Pair each domain's `color` (solid) with a matching translucent `hex`.
- Progress and spaced-repetition state live in `localStorage` under
  `oksat:progress:<slug>:<code>` and `oksat:srs:<slug>:<code>`, where `<code>`
  is resolved silently by `OKSATStore.reviewer()` (legacy `mcq:*` keys are
  migrated automatically). Nothing is uploaded and there is no prompt.
  **Changing a question's `id` resets its history** — treat ids as permanent
  once a module has been studied.
- The hub reads both keys to draw each card's completion meter and the
  due-for-review banner, so a module whose `count` is wrong will show a
  misleading meter. `tools/check-data.mjs` catches that.
- Preview locally with no build step: `python3 -m http.server` then open
  `http://localhost:8000/oksat-study.html?m=<slug>`.
