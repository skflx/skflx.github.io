# Round 4 — layout directions: scoping and plan

> Snapshot date: 2026-07-27. Status: **proposal awaiting owner pick.** Nothing
> here is implemented. Companion to `docs/ui-directions.md` (which holds the
> palette provenance and rounds 1–3).

Mockups: <https://claude.ai/code/artifact/589f060e-7bf9-49a3-8418-ff78f81a82ec>

Rounds 1–3 varied colour and type over a single layout. These five vary the
**information architecture** — how the site is organised, not how it is
painted. That changes the cost profile completely, which is what this document
exists to make explicit before a direction gets chosen on looks alone.

## 1. Cost tiers

The retheme already put every colour behind `css/tokens.css`. That is what
makes palette cheap and layout expensive.

| Tier | Effort | What it touches | Verification |
|---|---|---|---|
| **1 — palette + type** | Hours | Two token blocks in `css/tokens.css`. Nothing else. | CI green by construction; brand probe in `docs/verification.md` |
| **2 — component form** | Days | `css/*.css` plus the engine's render output. Cards become rows, options render differently. | `tools/test-oksat-engine.mjs` (answer-lock, SRS, keyboard) is the safety net |
| **3 — information architecture** | A week+ | New page skeletons, new navigation, new client state. Every page's markup, plus JS the site does not have today. | Needs new smoke assertions per page; the no-build constraint bites here |

Everything in rounds 1–3 was Tier 1. Only one candidate below is.

## 2. The five candidates

| Direction | Tier | Layout device | Biggest risk |
|---|---|---|---|
| **Redline** — red / black / white | 1½ | A persistent red spine down the left edge carrying the section name vertically; flush blocks separated by rules, not gaps | Red reads as alarm in a clinical context; every status colour must be re-solved around it |
| **Ward Board** — bespoke bento | 3 | **Tile span encodes due count.** Flush-packed grid with hairline dividers, status stripe per tile. No floating cards | A quiet week makes the board look empty; needs a floor size and a real empty state |
| **Console** — command-bar first | 2–3 | A persistent ⌘K bar; every result is a row, not a card; inline keyboard hints | Discoverability — a first-time visitor sees a blank bar unless the empty state does real work |
| **Codex** — reference work | 3 | Permanent left index + content pane, independent scroll, sticky breadcrumb | Costs horizontal room on the exact surfaces (study, graph) that want it most |
| **Deck** — one card at a time | 3 | **The page ground *is* the subspecialty marker.** Full-bleed cards, thumb-reachable actions, dot rail | Nine coloured grounds is nine separate contrast problems, not one |

### Problems solved inside the candidates

- **Redline / the two-reds problem.** If red is the brand it cannot also mean
  "wrong": a brand red `#D81E28` and an error red `#A3000E` differ by 1.61:1,
  which is invisible. Redline therefore carries right/wrong by **form** — a
  solid red fill for correct, a diagonal hatch with a struck rule for
  incorrect. Any red identity has to solve this; it is not cosmetic.
- **Ward Board / the generic-bento problem.** Stock bento fails because cell
  size is arbitrary and therefore decorative. Here size is the primary datum
  (due count), sorted deterministically by workload — so the layout *is* a
  chart, and the grid earns its place.
- **Codex / the two-pane-on-a-phone problem.** The index collapses to a
  horizontal chip strip under the breadcrumb rather than a hamburger, so the
  taxonomy stays visible at every width.
- **Deck / the nine-grounds problem.** Making the marker the ground promotes
  the palette from decoration to interface, but each of the nine grounds needs
  its own text-contrast check — that is nine checks, not one, and it is the
  main reason this is a Tier 3 item rather than a fun afternoon.

## 3. Execution plan for any Tier 3 pick

Do **not** retheme and re-architect in one change — a regression then has two
possible causes and no clean attribution.

1. **Land the palette alone first** (Tier 1). One file, CI green, independently
   deployable. If the layout is later abandoned, the colour still stands.
2. **Build the new skeleton on one page only** — the OKSAT hub, which shows the
   most structure. Ship it at its own URL and use it for a week before
   spreading it.
3. **Write the behaviour tests before touching the engine.** Answer-lock, SRS
   writes and the keyboard matrix are the invariants a layout change silently
   breaks; the suite already exists (`tools/test-oksat-engine.mjs`).
4. **Migrate remaining surfaces one at a time**, each its own commit, each
   added to `tools/smoke-pages.mjs`.
5. **Only then delete the old skeleton.** The redirect-stub convention
   (`docs/decisions.md` §2) exists so no URL dies mid-migration.

## 4. Recommendation

- **Ward Board** is the one worth Tier 3 money. It surfaces the due count at a
  glance, which is the site's actual daily job, and it degrades to a plain list
  on a phone.
- **Console** is the sleeper: mostly *additive* (a command bar over existing
  pages), and it honours a site that already documents a full keyboard matrix
  in `docs/design-principles.md`.
- **Redline** is a Tier 1 palette wearing a Tier 3 costume — roughly 80% of the
  effect is available for hours of work, since the spine and flat blocks are
  the only structural parts.
- **Codex** and **Deck** are the most expensive and the most opinionated. Both
  are defensible, but neither should be started before the content gap in
  `docs/feature-requests.md` is closed — a beautiful shell around 5 of 62
  topics is the wrong thing to build next.
