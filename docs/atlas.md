# Atlas

The unlisted skull-base atlas (`atlas.html`; spec `plans/2026-10-28-figures-eggs-atlas.md`): a
midsagittal right hemisection, medial view, face left, drawn as hand-authored SVG with no visible
labels. Related structures light together as groups.

## Files

| Path | Role |
|---|---|
| `tools/atlas/anatomy.json` | The source: groups and control-point shapes. Opus authors it; the owner vets every bake. |
| `tools/atlas.mjs` | `bake` (SVG into `atlas.html`), `check` (schema and stale bake; `checkAtlas()` for `check-data`), `preview` (PNG via Playwright). |
| `atlas.html` | The SVG sits between `<!-- atlas:svg -->` and `<!-- /atlas:svg -->`. Never hand-edit the block. |

## Checks

`tools/check-data.mjs` ("atlas and unlisted pages") fails on: a stale bake or invalid
data; a missing `noindex` robots meta on `atlas.html`, `OLSB.html` or `ssb.html`; any link to
`atlas.html` from a root page or a `js/` file other than `js/atlas.js`; any link to `OLSB.html`
or `ssb.html` outside `atlas.html`.

## Schema (`anatomy.json`)

```
{ viewBox: [x, y, w, h],
  groups: { <id>: { sub: <OKSAT_SUBSPECIALTIES key> | null, href: <relative URL> | null,
                    ariaLabel: string, interactive: bool } },
  shapes: [ { id, group, tissue, points: [[x, y], …], closed: bool, tension: 0..1,
              shade?: 'dome'|'pit', dashed?: bool, z: int } ] }
```

- `tissue`: `bone`, `cutbone`, `soft`, `mucosa`, `cartilage`, `nerve`, `vessel`, `air`,
  `brainghost`, `skin`.
- `tension`: 0 is a Catmull-Rom curve through the points; 1 is straight segments.
- `href` is a relative same-site URL (no scheme, no `//host`); a linked group must be interactive.
- Top-level keys starting with `_` are notes and are ignored.
- Errors name the offending group or shape (unknown group or tissue, fewer than 3 points).

## Emitted SVG

- `<svg class="at-svg" viewBox …>`; one element per group: `<a class="at-group" href>` when linked,
  otherwise `<g class="at-group">`, with `data-group`, `data-sub` (when set) and `aria-label`. An
  unlinked interactive `<g>` has `tabindex="0"`; a non-interactive group is `aria-hidden`.
- Each shape is `<path class="at-shape at-<tissue>[ at-dashed]" data-shape="<id>" [data-shade]>`.
- **Paint order.** A group is one element, so groups are placed by their lowest `z` (declaration
  order breaks ties) and shapes by `z` inside them (file order breaks ties). A shape that must paint
  above another group belongs in a group whose lowest `z` is higher.
- No `<text>` and no `<title>`: `aria-label` serves screen readers; nothing is visible.
- Coordinates round to 0.1 and output is deterministic, so a fresh bake never diffs.

## Lighting (page contract)

Hover or focus on a group adds `.is-lit`, sets `--hue` from `OKSAT_SUBSPECIALTIES`
(`style.setProperty`), and adds `.is-dim` to every other group. `preview --hover <group>` applies
the same classes, so a preview matches the page.

## Workflow

```bash
# edit tools/atlas/anatomy.json, then:
node tools/atlas.mjs preview --out <scratchpad>/atlas.png [--theme dark] [--hover lsb]
node tools/atlas.mjs bake
node tools/atlas.mjs check
```

`preview` uses `css/atlas.css` when it exists.

## Sources and draft status

Every number in `anatomy.json` is a draft. The owner has not vetted them, and none has been
re-checked against the printed source; the works below name where the values come from, not
page-level verification.

**Frame.** `anatomy.json` `_frame`: mm from the centre of the sella, `a` anterior, `s` superior,
Frankfort horizontal at `s = -20`; `px = 340 - 3.2a`, `py = 404 - 3.2s` (3.2 px per mm). The temporal
bone is taken from the OLSB model (`js/olsb/volume.js`, oval-window origin, `y` anterior, `z`
superior) projected onto the sagittal plane, with the oval window at `(-23, -24)`, so the atlas and
OLSB cannot disagree on the ear.

| Landmark | Value (a, s mm) | Basis |
|---|---|---|
| Nasion | (69.5, 8.5) | S–N 70 mm, S–N 7° to FH (cephalometric norms) |
| Basion | (-24.5, -37.7) | S–Ba 45 mm, N–S–Ba 130° |
| ANS / PNS | (72, -44) / (21, -46) | N–ANS 53 mm; palate 51 mm, parallel to FH |
| Menton | (55, -114.5) | N–Me 123 mm (anterior face height) |
| Porion | (-23, -20) | top of the EAC, on FH; the EAC and IAC superimpose (OLSB) |
| Skull | glabella–opisthocranion 188 mm; vertex 131 mm above FH | adult male head norms |
| Cervical spine | C2–C7 bodies 14 mm, discs 5 mm; hyoid at C3–C4; cricoid at C6 | textbook levels |
| Larynx | anterior commissure mid-thyroid (s -136); glottis 20 mm; trachea 18 mm AP; isthmus on rings 2–4 | textbook dimensions |
| Ear | cochlea, vestibule, canals, ossicles, TM, EAC, sigmoid, jugular bulb, CN VII segments | OLSB coordinates, as drawn there |

Works: Standring S (ed). *Gray's Anatomy*, 42nd ed. Elsevier, 2020 (head and neck). Rhoton AL Jr.
*Cranial Anatomy and Surgical Approaches*. Lippincott Williams & Wilkins, 2003 (posterior fossa,
temporal bone, cranial base: the hemisection convention). Jacobson A, Jacobson RL (eds). *Radiographic
Cephalometry*, 2nd ed. Quintessence, 2006 (S–N, N–S–Ba, face heights). The OLSB model's sources are
in `js/olsb/volume.js`.

**Schematic choices the owner must vet.**
- The petrous window (radius 8.4 mm floor, hatched rim to 9.6 mm) is centred on the labyrinth. In a
  true sagittal projection the IAC, vestibule, TM and EAC superimpose, so the porus sits inside the
  window and hides most of the stapes. Window contents are clipped to the floor when authored, so
  the cochlear apex and outer mastoid cells are cut.
- The window paints over the posterior edge of the clivus: a cut-away, not an occlusion error.
- The cochlea is drawn side-on (three stacked turns), because OLSB's modiolar axis lies only about
  31° out of the sagittal plane.
- The lateral canal is widened to a narrow loop; projected exactly, it is a line.
- The labyrinthine segment of CN VII is lifted about 0.9 mm so the geniculate genu reads; exactly
  projected, it lies on the tympanic segment.
- CN VII is solid from the root exit zone to the stylomastoid foramen (the lower mastoid segment runs
  below the window, inside bone) and dashed beyond. All five branches are drawn in projection, so they
  cross midline structures (nasal cavity, maxilla, tongue) and the temporal branch crosses the
  cranial outline.
- The brainstem stump is its own non-interactive group, `stump`, painted after `lsb`: it lies medial
  to the petrous face, and in the single `context` group the face would hide it and the nerve would
  have no visible origin.
