# OKSAT design principles

The design system behind the OHNS Knowledge Self-Assessment Tool
(`oksat.html`, `oksat-study.html`). Everything here is
implemented as CSS custom properties in `css/oksat.css`; components consume
only tokens, never raw values, so a retheme is a one-block edit.

## 1. Principles

1. **An instrument, not a brochure.** Paper and ink (`#F1F1EC` / `#0D0E10`),
   hairline rules instead of shadowed cards, and a monospace for anything that
   is data (labels, counts, keys). Same system as the rest of the site
   (`css/site.css`); OKSAT expresses it as `--ok-*` tokens.
2. **Calm feedback.** Correct/incorrect are a deep green and a crimson, each
   paired with a faint tint, readable across a 100-question session in both
   themes. Neither is reused for decoration.
3. **One hue per domain.** Each subspecialty owns a hue
   (see `OKSAT_SUBSPECIALTIES` in `js/oksat-manifest.js`), carried through
   module accent bars, hub grouping ticks, and concept chips. Color always
   *means* something; it is never decoration.
4. **Recall before recognition.** Every question opens on a recall gate: the
   stem alone, with **Reveal answer** (answer from memory, then self-grade) or
   **Show the choices** (answer it as an MCQ). Seeing the options is a choice,
   not the default — so the tool can tell "knew it cold" apart from "got it
   with the choices."
5. **First-attempt honesty.** An answer locks on first attempt — whether
   recalled from memory or picked from the choices — no re-answering to game
   the score. Spaced repetition (Leitner, 5 boxes) resurfaces what was missed;
   the progress dots show the truthful record.
6. **Keyboard first.** At the gate, space/enter reveals the answer for a memory
   attempt and `c` opens the choices; then 1–4 self-grade a revealed answer, or
   1–9/a–d select an option once the choices are open. ←/→ navigate,
   space/enter advance once answered, `r` random, `h`/esc home. The pointer is
   optional.
7. **Token-driven theming.** Light/dark (`data-theme`) and font sets
   (`data-font`) are attribute switches on `<html>`; no component knows which
   theme it is in.
8. **Degrade gracefully.** The engine tolerates sparse modules (no taxonomy,
   no explanations); missing data removes UI rather than breaking it.
   Storage reads are fail-safe; no build step anywhere.

## 2. Color tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ok-bg` | `#F1F1EC` | `#0D0E10` | canvas (paper / ink) |
| `--ok-surface` | `#FAFAF7` | `#16181B` | cards, modal |
| `--ok-text` | `#121418` | `#ECEBE6` | primary text; primary buttons |
| `--ok-accent` | `#2445B0` | `#8EA7FF` | actions, focus, progress (audiogram blue) |
| `--ok-ochre` | `#B8371A` | `#FF6B42` | kickers, review-due (audiogram red; historical token name) |
| `--ok-correct` | `#1F7A52` | `#5FD3A0` | pass |
| `--ok-incorrect` | `#B0243A` | `#FF7A8A` | miss |

Subspecialty hues (module identity) are unchanged and live only in
`OKSAT_SUBSPECIALTIES` (`js/oksat-manifest.js`); changing them is an owner
decision.

## 3. Typography — font themes

Three roles: `--ok-font-display` (titles, stems, numbers), `--ok-font-body`
(prose, explanations), `--ok-font-ui` (chips, kickers, controls). Four themes,
switched via `data-font`, picked from the "Aa" topbar button and persisted
only on an explicit pick (`oksat:typeface`):

| `data-font` | Display | Body | UI | When |
|---|---|---|---|---|
| `instrument` *(default)* | Archivo (variable width) | Archivo | IBM Plex Mono | the site's own faces; self-hosted, no network |
| `clinical` | Inter | Inter | Inter | dense, neutral, screen-first |
| `atlas` | IBM Plex Sans | IBM Plex Sans | JetBrains Mono | technical, high x-height |
| `hyperlegible` | Atkinson Hyperlegible | Atkinson Hyperlegible | Atkinson Hyperlegible | maximum legibility, low-sleep proof |

The three alternates load from Google Fonts only when chosen. Rules: body
text ≥ 15px; stems use the display face at ~1.15–1.4rem; UI/meta text is
small (10–12px) and set in the UI face so it reads as *chrome*, not content.
Archivo ships without an italic here, so `em` in titles is set upright
(no faux italic). The engine still passes Fraunces-era variation axes
inline; `css/oksat.css` neutralizes them.

## 4. Space, shape, motion

- Radii: 4px everywhere except pills (999px). Square is the house style.
- One content column, `--ok-maxw: 42rem`, generous bottom padding (8rem).
- Hub modules are ruled rows under a subspecialty rule, not floating cards.
- Motion: 150–350ms ease; `fade-up` (8px rise) on view changes; everything
  honors `prefers-reduced-motion`.
- No drop shadows; hover is a color or border change.

## 5. Hub signals

The hub answers one question — *what should I do next?* — with three signals
and nothing else:

- **Completion meter** per module card: answered / total, drawn only once a
  module has been started. An untouched module shows no meter rather than an
  empty one.
- **Launch vs Resume** on the card's action, so a half-finished module is
  distinguishable at a glance.
- **One review banner** above the list: total cards due across all modules,
  linking into the module holding the most. Absent entirely when nothing is
  due — an empty state is noise.

Progress is never framed as a score, streak, or badge; it is a record.

## 6. Voice

Kickers are Small-caps-style labels ("Self-Assessment · Neurotology Module").
Explanations teach mechanism → application → pearl. Buttons are verbs ("Begin", "Reveal answer", "Show the choices", "Review due").
No exclamation marks, no gamification chrome.
