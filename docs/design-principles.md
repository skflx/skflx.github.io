# OKSAT design principles

The design system behind the OHNS Knowledge Self-Assessment Tool
(`oksat.html`, `oksat-study.html`, `oksat-generate.html`).

**Colour is not defined here.** Since 2026-07 the whole site shares one
identity — *Lightbox* — declared once in `css/tokens.css` and loaded by every
page before its own sheet. This document owns OKSAT's *interaction* and
*typography* principles; `css/oksat.css` owns its components. Palette
provenance (and the validator runs behind the categorical hues) lives in
`docs/ui-directions.md`.

## 1. Principles

1. **Lit, not printed.** The ground is dark and panels sit *above* it,
   edge-lit like films on a viewing box — the inverse of a dark theme where
   cards sink. Light mode is a designed daylight twin, not an inversion.
2. **Calm feedback.** Correct/incorrect are a muted green and a muted rust —
   desaturated relatives that stay easy on the eyes across a 100-question
   session and hold up in both themes.
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

## 2. Colour tokens

Values are **not duplicated here** — they rot the moment the brand moves.
Read them from `css/tokens.css`, which is commented and grouped. The roles
OKSAT relies on:

| Token | Role |
|---|---|
| `--ok-bg` / `--ok-bg-2` | the ground the panels sit on |
| `--ok-surface` / `--ok-surface-2` | cards — always *lighter* than the ground in dark |
| `--ok-lift` / `--ok-lift-hover` | the edge-light + bloom that makes a panel read as lit |
| `--ok-text` / `--ok-text-muted` / `--ok-text-faint` | type hierarchy |
| `--ok-accent` / `--ok-on-accent` | primary actions, focus |
| `--ok-ochre` | kickers, review state, the one warm note |
| `--ok-correct` / `--ok-incorrect` (+ `-bg`) | answer feedback |
| `--sub-<key>` | the nine subspecialty markers |

The `--ok-lift` shadow is the load-bearing device: remove it and the
direction collapses into an ordinary flat theme.

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
