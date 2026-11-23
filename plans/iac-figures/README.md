# IAC figure geometry specs (I0.4)

One file per figure in spec §6 of [`../2026-11-23-iac-anatomy-guide.md`](../2026-11-23-iac-anatomy-guide.md).
Opus pins the anatomy here; the SVG work packages (I2.S, I3.S, I4.S) draw exactly what a file says.
A coordinate, label or proportion that a file does not give is a `BLOCKED:` question, never a guess.
All figures are **schematic**: their captions say so.

## Shared conventions

- **Files** go in `images/oksat/iac-anatomy/`, named `<stem>-<frame or layer>.svg`, as each file lists.
- **Canvas**: the `viewBox` each file gives; `width`/`height` equal to it; first child
  `<rect width="100%" height="100%" fill="#ffffff"/>`; `font-family="Helvetica, Arial, sans-serif"`.
- **Palette** (the ear-anatomy figures' colours, so both guides look alike):

  | Role | Fill | Stroke |
  |---|---|---|
  | Background | `#ffffff` | — |
  | Otic capsule / bone | `#efe6d2` | `#8a7b5f`, 1.4 |
  | Bone, second tone (crests, cut faces) | `#ddd0b4` | `#8a7b5f`, 1.4 |
  | Dura, arachnoid | `#f6e3d4` | `#8c4b3e`, 1.2 |
  | Brain / brainstem | `#f4f1ea` | `#555049`, 1.2 |
  | Facial nerve | `#d9a400` | `#9b7600`, 1.2 |
  | Vestibulocochlear nerves | `#f7f1e3` | `#555049`, 1.4 |
  | Artery | `#b8352a` | `#8c4b3e`, 1 |
  | Vein, sinus | `#2f5d8a` | `#2f5d8a`, 1 |
  | Danger zone (shading) | `#c97b6b` at `fill-opacity="0.35"` | none |
  | Guide line / sightline | none | `#2F6E6A`, 2, `stroke-dasharray="6 4"` |
  | Text | `#1d1d1b` (titles 15 bold, labels 13) | — |
  | Secondary text | `#555049` (12) | — |

- **Regions**: every structure a reader can tap is one `<g data-g="<glossary id>">` holding its shape;
  ids are from `js/olsb/glossary.js` (spec §4.3). **Labels** for a frame sit together in one
  `<g data-label="1">` (they hide in find mode). Leader lines belong to the label group.
- **Orientation** is printed on every frame: a small compass at the bottom left (`x 30–110`, `y` near the
  bottom) with letters **A P S I M L** as the file states, plus the side (**Right ear** / **Left ear**).
- **Mirroring**: a left-ear frame is the right-ear frame with every x replaced by `W − x` (W = viewBox
  width), text kept upright, compass letters swapped accordingly.
- **No numbers** appear on a figure unless the file gives them with their ledger row.
