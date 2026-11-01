# Atlas

The unlisted skull-base atlas (`atlas.html`, plan `plans/2026-10-28-figures-eggs-atlas.md`, D4–D7):
a midsagittal right hemisection, medial view, face left, drawn as hand-authored SVG with no
visible labels. Related structures light together as groups.

## Files

| Path | Role |
|---|---|
| `tools/atlas/anatomy.json` | The source: groups and control-point shapes. Opus authors it; the owner vets every bake before it ships. |
| `tools/atlas.mjs` | `bake` (SVG into `atlas.html`), `check` (schema + stale bake; `checkAtlas()` for `check-data`), `preview` (PNG via Playwright). |
| `atlas.html` | The page; the SVG sits between `<!-- atlas:svg -->` and `<!-- /atlas:svg -->`. Never hand-edit the block. |

## Schema (`anatomy.json`)

```
{ viewBox: [x, y, w, h],
  groups: { <id>: { sub: <OKSAT_SUBSPECIALTIES key> | null, href: <relative URL> | null,
                    ariaLabel: string, interactive: bool } },
  shapes: [ { id, group, tissue, points: [[x, y], …], closed: bool, tension: 0..1,
              shade?: 'dome'|'pit', dashed?: bool, z: int } ] }
```

- `tissue`: `bone`, `cutbone`, `soft`, `mucosa`, `cartilage`, `nerve`, `vessel`, `air`, `brainghost`, `skin`.
- `tension`: 0 is a Catmull-Rom curve through the points, 1 is straight segments.
- `href` must be a relative same-site URL (no scheme, no `//host`); a linked group must be interactive.
- Top-level keys starting with `_` are notes and are ignored.
- Errors name the offending group or shape: unknown group, unknown tissue, fewer than 3 points, and so on.

## Emitted SVG

- `<svg class="at-svg" viewBox …>`; one element per group, `<a class="at-group" href>` for a linked
  group, otherwise `<g class="at-group">`, with `data-group`, `data-sub` (when set), `aria-label`
  and, on an unlinked interactive `<g>`, `tabindex="0"`. A non-interactive group is `aria-hidden`.
- Each shape is `<path class="at-shape at-<tissue>[ at-dashed]" data-shape="<id>" [data-shade]>`.
- **Paint order:** shapes by `z`. A group is a single element, so groups are placed by their lowest
  `z` (declaration order breaks ties) and their shapes by `z` inside them (file order breaks ties).
  A shape that must paint above another group belongs in a group whose lowest `z` is higher.
- No `<text>` and no `<title>`: `aria-label` serves screen readers; nothing is visible (D6).
- Coordinates are rounded to 0.1 and the output is deterministic, so a fresh bake never diffs.

## Lighting (page contract)

Hover or focus on a group adds `.is-lit` to it, sets `--hue` on it from `OKSAT_SUBSPECIALTIES`
(`style.setProperty`), and adds `.is-dim` to every other group. `preview --hover <group>` applies
the same classes, so a preview matches the page.

## Workflow

```bash
# edit tools/atlas/anatomy.json, then:
node tools/atlas.mjs preview --out /tmp/atlas.png [--theme dark] [--hover lsb]
node tools/atlas.mjs bake
node tools/atlas.mjs check
```

`preview` uses `css/atlas.css` when it exists and a minimal fallback style before then.
