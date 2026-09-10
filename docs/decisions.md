# Decisions — routine judgment calls, codified

Consult this before asking the owner a "how do I…" question. Every rule
below is drawn from existing precedent in the repo (cited inline). Where the
precedent genuinely runs out, the rule says **ASK THE OWNER** — the
escalation is codified too. Companion: `docs/verification.md` (how to prove a
change works), `docs/docs-map.md` (the documentation pass).

## 1. Which chrome does a new page use?

| You are building… | CSS | JS | Precedent |
|---|---|---|---|
| A new tool/utility page | `css/site.css` | `js/site.js` (theme toggle, binds `.site-theme-toggle`) | `cpt-search.html`, `airway-jeopardy.html` |
| A page that must work fully offline | self-contained; inline or vendored, **zero external requests** | inline / own `js/<page>-*.js` | `airway-jeopardy.html` |
| An OKSAT page | `css/oksat.css` | the `js/oksat-*.js` stack | `oksat.html`, `oksat-study.html` |

**Never** put `css/main.css` on a new page — it is frozen legacy, kept only
because `cpt-search.html` consumes its tokens. Do not extend it. (Its former
companion `js/main.js` was deleted in the 2026-09 cleanup: every function in
it targeted DOM that no surviving page has.)

## 2. Renaming or retiring a shipped page

**Delete it.** This is a personal site, not an indexed publication — dead
URLs cost nothing and redirect stubs accumulate into clutter. Owner decision,
2026-09: the nine stubs that existed (`mcq*.html`, `occ*.html`, `kag.html`,
`atlas.html`) were removed outright rather than repointed.

Remove the page from `PAGES` in `tools/smoke-pages.mjs` and from the
`README.md` file tree in the same change, and grep for inbound links:

```bash
grep -rn "<retired-page>" --include=*.html --include=*.js --include=*.md .
```

Leave a stub only if the owner says a specific URL was shared somewhere it
cannot be corrected.

## 3. localStorage keys

Namespaces: `sk_*` (site chrome), `oksat:*` (OKSAT). All new OKSAT
persistence goes through `window.OKSATStore` (`js/oksat-store.js`) — do not
add raw `localStorage` calls to OKSAT pages. Every read and write is
guarded; a storage failure degrades to a no-op, never an exception.

OKSAT keys carry a trailing `:<code>` namespace. There is one user and no
prompt: `OKSATStore.reviewer()` resolves the code from `oksat:reviewer` if a
browser already has one and otherwise returns `guest`. The namespace survives
from the retired multi-reviewer era **so that existing progress keeps
resolving** — do not "simplify" it away without migrating the data first.

**Key registry** (grep-verified; `<rev>` = namespace code, `<slug>` = module):

| Key / prefix | Owner file | Notes |
|---|---|---|
| `sk_theme` | `js/site.js`, `js/onepager.js` | day/night; `html[data-theme]` |
| `sk_style` | `js/onepager.js` | one-pager style (matte/story) |
| `oksat:reviewer` | `js/oksat-store.js` | storage namespace; read-only now |
| `oksat:migrated` | `js/oksat-store.js` | one-time `mcq:*`→`oksat:*` marker |
| `oksat:font` | `js/oksat-prefs.js` | `html[data-font]` |
| `oksat:progress:<slug>:<rev>` | `js/oksat-engine.js` | answers + firstCorrect |
| `oksat:srs:<slug>:<rev>` | `js/oksat-engine.js` | Leitner boxes |
| `oksat:cmastery:<slug>:<rev>`, `oksat:conf:<slug>:<rev>`, `oksat:session:<rev>` | `js/oksat-store.js` | mastery / calibration / analytics |

No credential keys remain. The Gemini and Anthropic key managers were deleted
with the tools that used them; **do not reintroduce a key field** without the
owner (§7).

## 4. Adding an OKSAT module

Full schema: `docs/authoring-oksat.md`. The load-bearing rules:

1. Filename `js/mcq-modules/<slug>.js`, kebab-case; **`slug` must equal the
   filename** (checked by `tools/check-data.mjs`).
2. File ends with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`.
3. One manifest entry in `js/oksat-manifest.js` with **`count` === `ITEMS.length`**
   (checked) and `subspecialty` = one of the 9 keys in `OKSAT_SUBSPECIALTIES`.
4. Accent hue comes **only** from that subspecialty's entry in
   `OKSAT_SUBSPECIALTIES` — never invent a hex. Adding a 10th subspecialty is
   an owner decision (§7).
5. MCQ items need `correct` matching an option id; recall items need `answer`
   (both checked). The engine tolerates missing `DOMAINS`/`CONCEPTS`.

Modules are authored by hand. There is no generator — the Gemini-backed
Question Forge was retired in 2026-09.

## 5. Styling / theming

Components consume CSS custom properties only — **no raw color values**. A new
color means adding a token to the owning block (`css/onepager.css` per style ×
theme; `css/oksat.css`; `css/site.css`). Theme/font/style switching is only
ever an attribute flip on `<html>` (`data-theme`, `data-font`, `data-style`)
— never a class swap on components. Color always means something (one hue per
subspecialty); never decorative.

## 6. When to log

After completing a significant chunk, update `WIP.md` (current state per
system, not an append-only diary) and run the documentation pass in
`docs/docs-map.md`.

## 7. Escalate to the owner — do NOT decide these yourself

- Any claim about medical correctness in module or archive content.
- Adding a subspecialty (10th hue) or changing `OKSAT_SUBSPECIALTIES`.
- Changing Leitner scheduling semantics (`LEITNER_INTERVALS`, box math).
- Deleting or rewriting anything under `archive/` — it is kept content.
- Adding an API-key field, or any new third-party/network dependency.
- Merging to `master` (that is deploy).
- Anything that would put a secret in the repo.
