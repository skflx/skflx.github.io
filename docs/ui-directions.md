# UI directions — candidates across three rounds, one validated marker set

> Snapshot date: 2026-07-27. Status: **REOPENED — awaiting owner pick.**
> "Lightbox" was implemented site-wide on branch
> `claude/feature-requests-matrix-5bsxyz` and is **not merged**; the owner asked
> to see further options before proceeding. Treat the shipped tokens as a
> candidate, not a decision.
>
> Because the retheme routed every colour through `css/tokens.css`, switching
> direction is a two-block edit in that one file — no page, component or script
> changes. Nothing in the branch is wasted if a different direction wins.
>
> Decided and **not** in scope of the reopened question (these were structural,
> not stylistic): the one-pager's Matte/Story switcher is retired for a single
> identity; day/night still follows the OS on first visit; `cpt-search.html` is
> rethemed onto the shared tokens; `js/main.js`'s hero-image colour extraction
> is disabled; `ascii-editor.html` is retired to a redirect stub; the
> subspecialty markers, the graph node palette and its shape encoding are
> replaced.

Three proof sheets, all rendering the same real components in light + dark:

- **Round 1 — six skins** (differ mostly by palette; a token-block edit):
  <https://claude.ai/code/artifact/902e76db-aa80-45cd-9fbe-78c53d1471f8>
- **Round 2 — six with a structural device** (differ in markup too; a component
  pass), with an A/B compare tray:
  <https://claude.ai/code/artifact/4db0ce83-70bb-4d58-acb5-6b5a8a794e0c>
- **Round 3 — six across every surface** (one-pager, hub, study, dashboard,
  graph, CPT) with a direction switcher — the sheet to decide from:
  <https://claude.ai/code/artifact/4f3fb6c7-0a65-4c53-b1c2-5e8ff8ed23ec>

## Round 3 candidates (whole-site mockups)

| Direction | Stance | Best for | Trade-off |
|---|---|---|---|
| **Bedside** | Legibility first — bigger type, more air, deep clinical teal. Differentiates on *scale*, not hue | Ward use, phones, tired eyes | Less information per screen |
| **Ledger** | The flowsheet — dense rows, hairline rules, tabular figures, one ink blue | Dashboards, CPT, dense review | Fatiguing for long prose |
| **Specimen** | Museum quiet — warm off-white, thin frames, square corners, botanical green | One-pager, Knowledge Atlas | Dense tools can feel underpowered |
| **Contrast** | Accessibility as the brief — pure grounds, 2px rules, heavy weights | Every accessibility case; sunlight, projector | Blunt; never looks like a portfolio |
| **Meridian** | Warm dark + copper, editorial rather than clinical | Feeling like a place, not a utility | Strongest personality → dates fastest |
| **Lightbox** | Built, unmerged — panels brighter than the ground, edge-lit | Dark reading rooms; the graph | Light mode is the weaker twin |

Exact token values for the round-3 candidates live in the artifact source; the
winner's values get transcribed into `css/tokens.css` when a pick is made.

## 1. The measured problem

The nine subspecialty hues in `js/oksat-manifest.js` are the load-bearing color
in the system — one hue per subspecialty, used on chips, graph nodes, and
dashboard bars. Scored as a categorical palette they fail three of five checks:

| Check | Result |
|---|---|
| Lightness band | PASS |
| Contrast vs surface | PASS |
| **Chroma floor** | **FAIL** — 6 of 9 below the floor; they render as grey, not hue |
| **Normal-vision separation** | **FAIL** — `fprs #7A5A3A` vs `hn_onc #9A4B2E` at ΔE 6.4 (floor is 15) |
| **Colour-vision deficiency** | **FAIL** — that pair collapses to ΔE 2.1 under protanopia |

This matters more here than on a typical site because the repo's own convention
is that **colour always means something — never decoration**
(`docs/decisions.md` §6). Two subspecialties that render as the same brown break
that promise silently.

Reproduce with the categorical-palette validator:

```
"#2F6E6A,#6E4A6B,#C06A4A,#9A4B2E,#7A5A3A,#7C7A3A,#5A567E,#A8863A,#55606A"
```

## 2. The replacement marker set

Solved, not picked by eye: hues spaced around the wheel, **lightness stepped per
slot** so neighbours stay separable under CVD, every slot above the chroma floor
and inside the band. Light and dark are **independent solves** — dark is not an
inversion (the dark band is L 0.48–0.67, narrower and lower than light's
0.43–0.77).

Slots are in `OKSAT_SUBSPECIALTIES` declaration order; the validator checks
*adjacent* pairs, so this order is load-bearing — do not reorder without
re-validating.

| # | Subspecialty | Light | Dark |
|---|---|---|---|
| 1 | otology | `#1d80c4` | `#327db6` |
| 2 | rhinology | `#e6797b` | `#d17576` |
| 3 | laryngology | `#367926` | `#417734` |
| 4 | hn_onc | `#9e73cb` | `#9471bb` |
| 5 | fprs | `#966508` | `#956408` |
| 6 | pediatrics | `#15aaa3` | `#13a09a` |
| 7 | sleep | `#9b3a22` | `#964430` |
| 8 | endocrine | `#898a0d` | `#838424` |
| 9 | fundamentals | `#8b90ed` | `#8488d6` |

Verified: all checks pass against every candidate surface below. Worst adjacent
pair ΔE 12.6 (light) / 10.1 (dark) against a target of 8; worst normal-vision
pair ΔE 20.9 against a floor of 15.

**These nine are identical in all six directions.** Subspecialty hue is data, not
skin — it should not change when the chrome changes. Only the chrome varies
below.

Two consequences to accept when implementing:

1. `OKSAT_SUBSPECIALTIES` currently holds **one** `hue` per subspecialty for both
   themes. A correct dark mode needs a second value per entry (e.g.
   `hue` / `hueDark`), which touches every consumer that reads `.hue`.
2. Three light slots land in the sub-3:1 contrast relief band. That is acceptable
   *only* because every use is already labelled (chips carry text, bars carry a
   name and a percentage). Do not introduce a colour-only use of these markers.

## 3. The six chrome directions

Each is a full `--ok-*` token block, light and dark. Type is named as intent —
the site currently loads Fraunces + Crimson Pro; changing faces is a separate
decision from changing colour.

### 1 · Clinical Register
The journal page: cool paper, true ink, one navy that only ever means "act here".
Grotesque headings over a serif body. *Best for long reading, printing, and
sitting credibly beside a real reference.*

| Token | Light | Dark |
|---|---|---|
| bg | `#F4F6F8` | `#0D1218` |
| surface | `#FFFFFF` | `#141A22` |
| border | `#DCE3EA` | `#242D39` |
| text | `#101820` | `#E7ECF2` |
| muted | `#57616E` | `#93A0B0` |
| accent | `#14509E` | `#6BA5F5` |
| correct / bg | `#1C6B45` / `#E6F2EB` | `#68BE90` / `#122219` |
| incorrect / bg | `#A63328` / `#FAE7E4` | `#E4867C` / `#261614` |

### 2 · Theatre
Surgical drape blue-green — chosen for the reason the drapes are: it is the
complement of blood red, so the eye rests. One grotesque throughout. *The most
subject-specific option.*

| Token | Light | Dark |
|---|---|---|
| bg | `#EFF4F3` | `#0B1211` |
| surface | `#FFFFFF` | `#121A19` |
| border | `#D3E0DD` | `#22302D` |
| text | `#0F1A18` | `#E4EDEB` |
| muted | `#52625F` | `#8DA09C` |
| accent | `#0F6F63` | `#3FB3A2` |
| correct / bg | `#1F7355` / `#E4F1EB` | `#5FBE95` / `#0F211B` |
| incorrect / bg | `#A8392C` / `#F9E7E3` | `#E0857A` / `#241614` |

### 3 · Graphite
Near-monochrome by rule: the interface is grey and the only saturated colour on
screen is data. Tight neo-grotesque plus a mono for numbers and keys. *The
direction that most literally enforces "colour always means something."*

| Token | Light | Dark |
|---|---|---|
| bg | `#F4F4F5` | `#0F0F11` |
| surface | `#FFFFFF` | `#17171A` |
| border | `#E0E0E4` | `#28282E` |
| text | `#131416` | `#EDEDEF` |
| muted | `#5E6166` | `#9A9CA3` |
| accent | `#1E1F23` | `#EDEDEF` |
| correct / bg | `#2C6E49` / `#EAF1EC` | `#6BBB8B` / `#151E19` |
| incorrect / bg | `#9E332B` / `#F7E8E6` | `#DE8279` / `#221615` |

### 4 · Nocturne
Dark-first for the call room, with a daylight twin. Deep indigo ground, one warm
amber carrying every action. High-contrast serif display over a plain sans.
*Best for night float and dark workrooms.*

| Token | Light | Dark |
|---|---|---|
| bg | `#F3F3F8` | `#0E0F1A` |
| surface | `#FFFFFF` | `#161829` |
| border | `#DEDEE9` | `#272A45` |
| text | `#16172B` | `#E8E9F5` |
| muted | `#5B5D78` | `#969ABE` |
| accent | `#4B3FBB` | `#E0A33F` |
| correct / bg | `#28684C` / `#E9F1EC` | `#67BE92` / `#12211B` |
| incorrect / bg | `#A33A31` / `#F8E8E6` | `#E3867E` / `#251618` |

### 5 · Signal
Modern product software: near-white, tight radii, dense rows, one electric
indigo. A single tight grotesque. *Feels like a tool you use daily rather than a
portfolio piece — and least resembles the current site.*

| Token | Light | Dark |
|---|---|---|
| bg | `#FAFAFC` | `#08080D` |
| surface | `#FFFFFF` | `#111119` |
| border | `#E5E5EE` | `#222231` |
| text | `#0B0B12` | `#F0F0F5` |
| muted | `#56566B` | `#8E8EA6` |
| accent | `#4338E8` | `#8B84FF` |
| correct / bg | `#1E7148` / `#E8F2EC` | `#63C08C` / `#10201A` |
| incorrect / bg | `#AB2F2F` / `#FBE7E7` | `#E58179` / `#231416` |

### 6 · Vellum
The warm one, done with discipline: real parchment rather than beige, a true
oxblood instead of muddy terracotta, chroma held steady so nothing turns to mud.
Serif display and body. *Closest to today — the "corrected, not replaced"
option.*

| Token | Light | Dark |
|---|---|---|
| bg | `#F7F3EC` | `#14110D` |
| surface | `#FFFDF9` | `#1C1813` |
| border | `#E4DBCB` | `#2F2820` |
| text | `#1F1B15` | `#F0E9DC` |
| muted | `#6A6154` | `#A99B85` |
| accent | `#8A3324` | `#D2694F` |
| correct / bg | `#3F6B43` / `#EDF1E6` | `#8FB878` / `#1B2116` |
| incorrect / bg | `#9C3A2B` / `#F8E6E0` | `#DE8B74` / `#26170F` |

## 4. What implementing a pick costs

The site is already token-driven — components consume custom properties and never
raw values, and theme switching is an attribute flip on `<html>`. That is what
makes this a token-block edit rather than a rewrite.

1. Replace the light and dark `--ok-*` blocks in `css/oksat.css` and
   `css/site.css` (they are duplicated by design — keep them in sync).
2. Replace the nine hues in `OKSAT_SUBSPECIALTIES` (`js/oksat-manifest.js`) and
   add the dark variant (§2, consequence 1). Grep every reader of `.hue` before
   changing the shape.
3. Retune `css/graph.css` and the two style blocks in `css/onepager.css`
   (`matte`, `personality`) so the one-pager doesn't diverge from the tools.
4. Verify per `docs/verification.md`: every page in both themes, then
   `node tools/smoke-pages.mjs` and `node tools/check-data.mjs`.
5. Update `docs/design-principles.md` — it owns the design system and currently
   documents the old tokens.

Re-run the categorical validator on any hue change before shipping. The rule that
matters: **never ship a marker set that fails adjacent-pair separation**, because
the whole point of the nine hues is that they are distinguishable.

---

# Round two — directions with a structural device

Round one's six differ almost entirely by palette: pick one and it is a
token-block edit. That is cheap, and it is also why they read as skins rather
than as identities.

Round two borrows a **structural device** from the discipline's own visual
world — a layout or notation rule, not a colour scheme. The nine validated
markers above are unchanged and were re-checked against every ground below
(all pass, light and dark).

**These cost more than round one.** A device lives in markup and component CSS
— leader lines, tab strips, grid substrates, stacked card edges — so it means
touching `js/oksat-engine.js`'s render output or the templates around it.
Budget a component pass, not an afternoon.

| # | Direction | Device | Risk | Buys | Costs |
|---|---|---|---|---|---|
| 1 | **Audiogram** | The audiogram grid as layout substrate; ○ / ✕ answer notation | Med | Instant specialty identity from a diagram nobody has to learn | Grid under long stems hurts readability; needs masking |
| 2 | **Plate XI** | Numbered figure key, keeper rules, italic caption | Med | Scholarly authority; suits the Knowledge Atlas best | Hairlines and italics are fragile on small/low-DPI screens |
| 3 | **Lightbox** | Inverted luminosity — panels brighter than the ground | Med | Most striking; genuinely comfortable in a dark reading room | Light mode is the weaker twin by construction |
| 4 | **Dictation** | Operative-note run-in heads, ruled margin, status stamp | High | Uncopyable; feels like the job rather than an app | Worst long-form readability; mono is dense on a phone |
| 5 | **Card Box** | Leitner box tabs 1–5, ruled stock, visible stack depth | Low | Makes spaced repetition *visible* — which box, how much left | Stack depth is decorative on a phone |
| 6 | **H&E** | The frosted slide label as card header; eosin/haematoxylin chrome | High | Most distinctive palette; warm without the usual cream | Eats hue space the markers need |

Full token sets for each are in the round-two proof sheet; they are not
duplicated here because none is committed yet. Once a direction is picked, its
tokens move into this document (or straight into
`docs/design-principles.md`, which owns the shipped system).

## Two decisions to make before building

1. **Distinctive ages faster.** A strong device is memorable on visit one and
   can grate by visit two hundred — and this is a tool used daily for years.
   Round one's Graphite is the safest answer available; Dictation and H&E are
   the riskiest. That is a real trade, not a reason to avoid the risk.
2. **H&E has a genuine conflict.** Eosin pink and haematoxylin violet occupy
   nearly the same hue space as marker slots 2 (rhinology) and 4 (head & neck).
   Choose H&E only while confining the stain to headers and rules, which is how
   the specimen is built — otherwise the markers stop being the only meaningful
   colour on screen, which is the whole point of §2.
