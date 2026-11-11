# OKSAT design principles

The design system behind `oksat.html`, `oksat-study.html` and `oksat-learn.html`.
Implemented as CSS custom properties in `css/oksat.css`: components consume only
tokens, never raw values, so a retheme is a one-block edit.

## 1. Principles

1. **An instrument, not a brochure.** Paper and ink, hairline rules instead of
   shadowed cards, and monospace for anything that is data (labels, counts,
   keys). Same system as the site (`css/site.css`), expressed as `--ok-*` tokens.
2. **Calm feedback.** Correct and incorrect are a deep green and a crimson, each
   with a faint tint, readable across a 100-question session in both themes.
   Neither is reused for decoration.
3. **One hue per subspecialty.** Each owns a hue (`OKSAT_SUBSPECIALTIES` in
   `js/oksat/manifest.js`), carried by module accent bars, hub ticks and concept
   chips. Colour always means something.
4. **Recall before recognition.** Every question opens on a recall gate: the stem
   alone, with **Reveal answer** (answer from memory, then self-grade) or **Show
   the choices** (answer as an MCQ). Seeing the options is a choice, not the
   default, so the tool can tell "knew it cold" from "got it with the choices".
5. **First-attempt honesty.** An answer locks on first attempt, whether recalled
   or picked. No re-answering to game the score. Leitner spaced repetition (5
   boxes) resurfaces misses. A review is a separate attempt: when an item comes
   due it reopens fresh at the gate, with the old answer hidden, and one attempt
   per due date moves only its box and next date. The first attempt is never
   overwritten.
6. **Keyboard first.** At the gate, space or enter reveals a memory attempt and
   `c` opens the choices; then 1–4 self-grade a revealed answer, or 1–9 and a–d
   select an option once the choices are open. ←/→ navigate, space/enter advance
   once answered, `u` next unanswered (or due), `r` random, `h`/esc home. The
   pointer is optional. A jump slider below the item previews any question
   (number, section, status) and jumps on release.
7. **Token-driven theming.** Light and dark (`data-theme`) and font sets
   (`data-font`) are attribute switches on `<html>`; no component knows its theme.
8. **Degrade gracefully.** The engine tolerates sparse modules (no taxonomy, no
   explanations): missing data removes UI rather than breaking it. Storage reads
   are fail-safe.

## 2. Colour tokens

Values live in `css/oksat.css` (light and dark blocks). Subspecialty hues live in
`OKSAT_SUBSPECIALTIES`; changing them is an owner decision (`docs/decisions.md` §7).

| Token | Role |
|---|---|
| `--ok-bg` | canvas (paper / ink) |
| `--ok-surface` | cards, modal |
| `--ok-text` | primary text; primary buttons |
| `--ok-accent` | actions, focus, progress (audiogram blue) |
| `--ok-ochre` | kickers, review-due (audiogram red) |
| `--ok-correct` | pass |
| `--ok-incorrect` | miss |

Text on a signal fill is `--on-signal` (`css/site.css`).

## 3. Typography: font themes

Three roles: `--ok-font-display` (titles, stems, numbers), `--ok-font-body`
(prose, explanations), `--ok-font-ui` (chips, kickers, controls). Four themes,
switched by `data-font` from the "Aa" topbar button; persisted only on an
explicit pick (`oksat:typeface`).

| `data-font` | Display | Body | UI | When |
|---|---|---|---|---|
| `instrument` (default) | Archivo | Archivo | IBM Plex Mono | the site's own faces; self-hosted |
| `clinical` | Inter | Inter | Inter | dense, neutral, screen-first |
| `atlas` | IBM Plex Sans | IBM Plex Sans | JetBrains Mono | technical, high x-height |
| `hyperlegible` | Atkinson Hyperlegible | Atkinson Hyperlegible | Atkinson Hyperlegible | maximum legibility |

The three alternates load from Google Fonts only when chosen. Body text is at
least 15px; stems use the display face at about 1.15–1.4rem; UI and meta text is
10–12px in the UI face, so it reads as chrome, not content. Archivo has no italic
here, so `em` in titles is set upright (no faux italic).

## 4. Space, shape, motion

- Radii 4px, except pills (999px). Square is the house style.
- One content column, `--ok-maxw`, with generous bottom padding.
- Hub modules are ruled rows under a subspecialty rule, not floating cards.
- Motion 150–350ms ease; `fade-up` on view changes; everything honours
  `prefers-reduced-motion`.
- No drop shadows; hover is a colour or border change.

## 5. Hub signals

The hub answers one question, *what should I do next?*, with these signals and
nothing else:

- **Completion meter** per module card (answered / total), drawn only once the
  module is started. An untouched module shows no meter.
- **Launch or Resume** on the card's action.
- **One review banner** above the list: total cards due, with a link to each
  module that has due items, most due first. Absent when nothing is due.
- **Weak concepts** (only when there are any): the lowest-accuracy concepts tried
  at least three times with a miss, each linking to the concept in the viewer.

Progress is never framed as a score, streak or badge. It is a record.

## 6. Voice

Kickers are small-caps labels ("Self-Assessment · Neurotology Module").
Explanations teach mechanism → application → pearl. Buttons are verbs ("Begin",
"Reveal answer", "Show the choices", "Review due"). No exclamation marks, no
gamification chrome.

## 7. Interactive learning

`oksat-learn.html` follows the same system (`css/oksat.css` tokens;
`css/oksat-learn.css` adds only layout). Its authoring rules are in
`docs/authoring-oksat-guide.md`.

- **Predict, then reveal.** A retrieval prompt offers a box to commit an answer
  before the model answer; the typed text stays in the tab. Grades are a record
  for the learner, never a score.
- **Colour means one thing.** Callouts carry the only colour: pearl = vermilion
  (act), mechanism = blue (science), trap = crimson, hook = neutral. The guide's
  subspecialty hue marks the section number, progress bar and active chapter,
  never small text.
- **A guide never grades the module.** Questions answered in place are recorded
  in the guide's own record; the module keeps its locked first attempt and schedule.
- **Square, hairline, mono for chrome**: no shadows, no pills above headings,
  evidence and source chips in the UI face.
- **Figures are reused**: an SVG from `images/oksat/` loads as an image on its
  own white ground and is labelled schematic. Do not redraw one that exists.
