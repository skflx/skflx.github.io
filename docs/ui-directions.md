# UI directions — six candidates, one validated marker set

> Snapshot date: 2026-07-25. Status: **proposal awaiting owner pick.** Nothing
> here is implemented. Changing `OKSAT_SUBSPECIALTIES` is an owner decision
> (`docs/decisions.md` §8) — this document exists to make that decision, not to
> pre-empt it.

Proof sheet (all six rendered on real components, light + dark):
<https://claude.ai/code/artifact/902e76db-aa80-45cd-9fbe-78c53d1471f8>

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
