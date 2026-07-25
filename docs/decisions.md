# Decisions — routine judgment calls, codified

Consult this before asking the owner a "how do I…" question. Every rule
below is drawn from existing precedent in the repo (cited inline). Where the
precedent genuinely runs out, the rule says **ASK THE OWNER** — the
escalation is codified too. Companion: `docs/verification.md` (how to prove a
change works), `docs/docs-map.md` (the documentation pass).

## 1. Which chrome does a new page use?

**Every page loads `css/tokens.css` first** — that is the brand (colour, type,
geometry) and it is not optional. Then add the page's own sheet:

| You are building… | CSS | JS | Precedent |
|---|---|---|---|
| A new tool/utility page | `css/site.css` | `js/site.js` (theme toggle, binds `.site-theme-toggle`) | `kag-extract.html`, `airway-jeopardy.html` |
| A page that must work fully offline | self-contained; inline or vendored, **zero external requests** | inline / own `js/<page>-*.js` | `airway-jeopardy.html` |
| An OKSAT page | `css/oksat.css` | the `js/oksat-*.js` stack | `oksat.html`, `oksat-study.html` |
| A graph surface | `css/graph.css` | `js/graph-view.js` + a lens | `graph.html` |

**Never** put `css/main.css` / `js/main.js` on a new page — they are frozen
legacy, used only by `cpt-search.html` (which also carries `css/site.css` for
the shared topbar). They supply *components* only; their palette is re-pointed
at the brand tokens. Do not extend them. `ascii-editor.html` was retired in
2026-07 and is now a redirect stub.

## 2. Renaming or retiring a shipped page

Never delete a shipped URL — someone may have linked it. Leave a **redirect
stub** in its place that forwards the query string. Precedent: `mcq.html`,
`mcq-study.html`, `occ*.html` → OKSAT pages; `kag.html`, `atlas.html` →
`graph.html` lenses (forwarding `?node=`); `ascii-editor.html` → `index.html`
(the tool was retired — a retired tool still leaves a stub). Add the new stub to the stub lines
in the `README.md` file tree. A smoke test asserts stub forwarding
(`tools/smoke-pages.mjs`), so update it too.

## 3. localStorage keys

Namespaces: `sk_*` (site chrome), `oksat:*` (OKSAT), `kag-*` (KAG). All new
OKSAT persistence goes through `window.OKSATStore` (`js/oksat-store.js`) — do
not add raw `localStorage` calls to OKSAT pages. Reviewer normalization is
lowercase-alphanumeric, default `guest` (`norm()` in `js/oksat-store.js`,
`js/oksat-reviewer.js`, and the engine's `normCode`).

**Key registry** (grep-verified; `<rev>` = reviewer code, `<slug>` = module):

| Key / prefix | Owner file | Notes |
|---|---|---|
| `sk_theme` | `js/site.js`, `js/onepager.js` | day/night; `html[data-theme]` |
| ~~`sk_style`~~ | — | **RETIRED** (2026-07, single identity). `js/onepager.js` removes it on load; do not reintroduce |
| ~~`sk_dynamic_colors`~~ | — | **RETIRED** (2026-07). Hero-image colour extraction overrode the brand accent at runtime; the feature is off |
| `oksat:reviewer`, `oksat:reviewers` | `js/oksat-reviewer.js` | active code + registry |
| `oksat:migrated` | `js/oksat-reviewer.js` | one-time `mcq:*`→`oksat:*` marker |
| `oksat:font` | `js/oksat-prefs.js` | `html[data-font]` |
| `oksat:progress:<slug>:<rev>` | `js/oksat-engine.js` | answers + firstCorrect |
| `oksat:srs:<slug>:<rev>` | `js/oksat-engine.js` | Leitner boxes |
| `oksat:cmastery:<slug>:<rev>`, `oksat:conf:<slug>:<rev>`, `oksat:session:<rev>`, `oksat:adaptive:<rev>`, `oksat:starred:<rev>` | `js/oksat-store.js` | mastery / calibration / analytics / adaptive / stars |
| `oksat:gemini-key`, `oksat:gemini-model` | `js/oksat-ai.js` | **credential** — never export (see §8) |
| `kag-graph` | `js/kag-store.js` | local graph state |
| `kag-api-key` | `kag-extract.html` | **credential** (Anthropic) — never export |

## 4. Adding an OKSAT module

Full schema: `docs/authoring-oksat.md`. The load-bearing rules:

1. Filename `js/mcq-modules/<slug>.js`, kebab-case; **`slug` must equal the
   filename** (checked by `tools/check-data.mjs`).
2. File ends with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`.
3. One manifest entry in `js/oksat-manifest.js` with **`count` === `ITEMS.length`**
   (checked) and `subspecialty` = one of the 9 keys in `OKSAT_SUBSPECIALTIES`.
4. Node/accent hue comes **only** from that subspecialty's entry in
   `OKSAT_SUBSPECIALTIES` — never invent a hex. Adding a 10th subspecialty is
   an owner decision (§8).
5. MCQ items need `correct` matching an option id; recall items need `answer`
   (both checked). The engine tolerates missing `DOMAINS`/`CONCEPTS`.

## 5. Editing the KAG graph

Never hand-edit `data/kag-graph.json`. Author `{nodes, edges}` shards and
merge with `tools/kag-validate.mjs` (`docs/authoring-kag.md`). Agents:
- Every node needs ≥1 `sources` entry; no fabrication (medical content).
- Enums are defined once in `tools/kag-enums.mjs` (mirrored in
  `docs/kag-schema.md`).
- **Never set `review:true`** — only the owner graduates DRAFT nodes (§8).

## 6. Styling / theming

Components consume CSS custom properties only — **no raw colour values**.
Every colour on the site is declared in exactly one file, `css/tokens.css`
(the "Lightbox" brand). A new colour means adding a token *there*, never in a
page sheet or an inline style — a page-local `:root` loads later and silently
wins, which is precisely how brand drift starts.

Theme/font switching is only ever an attribute flip on `<html>` (`data-theme`,
`data-font`) — never a class swap on components. Colour always means something
(one hue per subspecialty); never decorative.

**Categorical palettes are solved, not chosen.** The subspecialty markers,
graph node types and structural classes were generated and checked against a
colour-vision-deficiency validator; provenance and the exact invocations are in
`docs/ui-directions.md`. Before editing any of them, re-run the validator, and
keep a second channel (label, shape) so colour is never the only cue — graph
node type carries a shape for exactly this reason.

## 7. Which plan doc governs what / when to log

- OKSAT changes → read `docs/oksat-plan.md`, `docs/oksat-next-iteration-plan.md`.
- Graph/KAG changes → `docs/oto-kag-atlas-plan.md`, `docs/kag-schema.md`.
- Agent tooling/CI → `docs/agent-native-plan.md`.
- Plan docs are historical records (Status headers) — trust code over plans.
- After completing a significant chunk, append to `WIP.md` (one section per
  workstream) and run the documentation pass in `docs/docs-map.md`.

## 8. Escalate to the owner — do NOT decide these yourself

- Setting `review:true` on any KAG node, or any claim about medical correctness.
- Adding a subspecialty (10th hue) or changing `OKSAT_SUBSPECIALTIES`.
- Changing Leitner scheduling semantics (`LEITNER_INTERVALS`, box math).
- Deleting a shipped URL (vs. leaving a redirect stub).
- Merging to `master` (that is deploy).
- Anything that would put a secret in the repo (§3 credential keys).
