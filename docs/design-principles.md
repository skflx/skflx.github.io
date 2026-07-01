# OKSAT design principles

The design system behind the OHNS Knowledge Self-Assessment Tool
(`oksat.html`, `oksat-study.html`, `oksat-generate.html`). Everything here is
implemented as CSS custom properties in `css/oksat.css`; components consume
only tokens, never raw values, so a retheme is a one-block edit.

## 1. Principles

1. **Warm, not clinical.** The canvas is warm cream (`#FAF6EE` light /
   `#1B1813` dark), never hospital white. This is a *collected* study space,
   not an EHR.
2. **Calm feedback.** Correct/incorrect are sage (`#4F7042`) and rust
   (`#9A4537`) — desaturated relatives of green/red that stay easy on the
   eyes across a 100-question session and survive dark mode.
3. **One hue per domain.** Each subspecialty owns a hue
   (see `OKSAT_SUBSPECIALTIES` in `js/oksat-manifest.js`), carried through
   module accent bars, concept chips, and Atlas graph nodes. Color always
   *means* something; it is never decoration.
4. **First-attempt honesty.** An answer locks on first attempt — no
   re-answering to game the score. Spaced repetition (Leitner, 5 boxes)
   resurfaces what was missed; the progress dots show the truthful record.
5. **Keyboard first.** 1–9/a–d select options, 1–4 self-grade recall cards,
   ←/→ navigate, space/enter advance, `r` random, `h`/esc home. The pointer
   is optional.
6. **Token-driven theming.** Light/dark (`data-theme`) and font sets
   (`data-font`) are attribute switches on `<html>`; no component knows which
   theme it is in.
7. **Degrade gracefully.** The engine tolerates sparse modules (no taxonomy,
   no explanations); missing data removes UI rather than breaking it.
   Storage reads are fail-safe; no build step anywhere.

## 2. Color tokens

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ok-bg` | `#FAF6EE` | `#1B1813` | canvas |
| `--ok-surface` | `#FFFFFF` | `#242019` | cards |
| `--ok-text` | `#2A241D` | `#F1E7D8` | primary text |
| `--ok-accent` | `#2C5454` | `#5FA3A3` | primary actions, focus |
| `--ok-ochre` | `#9C7A45` | `#D6AC63` | kickers, review, warmth |
| `--ok-correct` | `#4F7042` | `#9FBF7E` | sage — pass |
| `--ok-incorrect` | `#9A4537` | `#DD9683` | rust — miss |

Subspecialty hues (module/Atlas identity): otology `#2F6E6A`, rhinology
`#6E4A6B`, laryngology `#C06A4A`, H&N onc `#9A4B2E`, facial plastics
`#7A5A3A`, pediatrics `#7C7A3A`, sleep `#5A567E`, endocrine `#A8863A`,
fundamentals `#55606A`.

## 3. Typography — font themes

Three roles: `--ok-font-display` (titles, stems, numbers), `--ok-font-body`
(prose, explanations), `--ok-font-ui` (chips, kickers, controls). Four themes,
switched via `data-font` and persisted per browser (`oksat:font`), picked from
the "Aa" topbar button:

| `data-font` | Display | Body | UI | When |
|---|---|---|---|---|
| `manuscript` *(default)* | Fraunces (variable opsz/SOFT) | Crimson Pro | system-ui | the warm original |
| `clinical` | Inter | Inter | Inter | dense, neutral, screen-first |
| `atlas` | IBM Plex Sans | IBM Plex Sans | JetBrains Mono | matches the Knowledge Atlas Graph |
| `hyperlegible` | Atkinson Hyperlegible | Atkinson Hyperlegible | Atkinson Hyperlegible | maximum legibility, low-sleep proof |

Rules: body text ≥ 15px; stems use the display face at ~1.15–1.4rem;
UI/meta text is small (10–12px) but always all-caps + letterspaced so it
reads as *chrome*, not content. Fraunces-specific `font-variation-settings`
are neutralized under sans themes.

## 4. Space, shape, motion

- Radii: 10px controls, 12px cards, 14px feature cards, 999px pills.
- One content column, `--ok-maxw: 42rem`, generous bottom padding (8rem).
- Motion: 150–350ms ease; `fade-up` (8px rise) on view changes; everything
  honors `prefers-reduced-motion`.
- Shadows are whisper-level (`--ok-shadow`), deepening slightly on hover.

## 5. Atlas graph conventions

- Node kinds: **subspecialty** (largest, hue ring), **module** (sized by
  question count), **concept** (small satellites).
- Completion encoding, per active reviewer: node fill interpolates from
  surface → domain hue with % answered; a finished node gets a sage outline.
- Hover spotlights the neighborhood (Obsidian-style); everything else dims.
- Tap module → launch; tap concept → `oksat-study.html?m=<slug>&c=<concept>`.

## 6. Voice

Kickers are Small-caps-style labels ("Self-Assessment · Neurotology Module").
Explanations teach mechanism → application → pearl (see the house style in
`js/oksat-ai.js`). Buttons are verbs ("Begin", "Reveal answer", "Review due").
No exclamation marks, no gamification chrome.
