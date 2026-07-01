# OKSAT — OHNS Knowledge Self-Assessment Tool

*Redesign plan and architecture. Supersedes the "MCQ study guides" naming and the
2026-05-25 "OHNS Adaptive Quiz App" buildspec (Claude-in-Claude artifact) — that spec
assumed the Claude.ai artifact runtime; this site is static GitHub Pages, so the useful
ideas (house question style, taxonomy hues, adaptivity, generation-on-demand) are kept
and re-grounded here, and the rest discarded.*

---

## 1. Why the rename

The tool was never just multiple-choice — it already ships free-response (`recall`)
cards with four-tier self-grading and Leitner spaced repetition. **OKSAT** (OHNS
Knowledge Self-Assessment Tool) names the actual scope and leaves room to grow:
new item types, generated modules, and the knowledge-graph view all live under one roof.

| Before | After |
|---|---|
| `mcq.html` (hub) | `oksat.html` — hub with **Modules** + **Atlas** views |
| `mcq-study.html?m=slug` | `oksat-study.html?m=slug[&c=concept]` |
| — | `oksat-generate.html` — the Question Forge (Gemini) |
| `js/mcq-engine.js` etc. | `js/oksat-*.js` |
| `css/mcq.css` | `css/oksat.css` (+ font themes) |
| `localStorage mcq:*` | `oksat:*` (auto-migrated once, old keys left in place) |

Old URLs keep working: `mcq.html` / `mcq-study.html` become redirect stubs (query string
preserved), and the older `occ*.html` stubs point straight at the new pages.
`js/mcq-modules/` **content files are untouched** (only `meta.kicker` wording updated);
the engine still accepts the `window.__MCQ_MODULE` registration global.

## 2. Design principles & fonts

Documented in `docs/design-principles.md`. Highlights:

- Token-driven: components consume only CSS custom properties; themes (light/dark)
  and font sets are attribute switches on `<html>` (`data-theme`, `data-font`).
- Feedback colors are sage/rust, not green/red — calmer over long sessions.
- One hue per domain, carried through chips, accent bars, and graph nodes.
- First-attempt locking; keyboard-first interaction (1–9/a–d answer, 1–4 self-grade,
  arrows navigate, space/enter advance).

**Font themes** (persisted as `oksat:font`, picker in every OKSAT topbar):

| Theme | Display | Body | Character |
|---|---|---|---|
| Manuscript *(default)* | Fraunces | Crimson Pro | the collected, warm original |
| Clinical | Inter | Inter | neutral, compact, screen-first |
| Atlas | IBM Plex Sans | IBM Plex Sans (+ JetBrains Mono UI) | the KAG aesthetic — visually blends the two tools |
| Hyperlegible | Atkinson Hyperlegible | Atkinson Hyperlegible | maximum legibility, post-call proof |

## 3. Bringing the modules together — the Atlas view

`oksat.html` gains a graph view (`js/oksat-atlas.js`, Cytoscape + cose-bilkent — the
same stack as `kag.html`): every module, domain, and concept is a node; edges link
module → domain → concept, and modules that share a subspecialty connect through a
subspecialty hub node. Interaction is deliberately Obsidian-graph-like: drag, zoom,
hover to spotlight a neighborhood, search to locate a node.

- **Traversal:** tapping a module node launches it; tapping a concept node deep-links
  to `oksat-study.html?m=<slug>&c=<concept>` (new engine capability — the viewer opens
  pre-filtered to that concept).
- **Completion color-coding, per user:** node fill interpolates from faint surface to
  the domain hue by % answered for the *active reviewer*; a completed node earns a
  sage ring. Data comes from local progress merged with the server DB (§4), so you can
  also inspect a coresident's coverage.
- **KAG blending:** the Atlas adopts KAG's graph idiom, the *Atlas* font theme adopts
  its typography, and the hub cross-links KAG + the KAG extractor. A full data-level
  merge (KAG nodes inside the OKSAT graph) stays open for later — both graphs are
  Cytoscape, so the element models are already compatible.

## 4. The server database file

`data/oksat-db.json` — a plain JSON file in the repo, no secrets ever:

```json
{
  "version": 1,
  "updated": "2026-07-01T00:00:00Z",
  "reviewers": {
    "kafle": {
      "modules": {
        "pediatrics": { "answered": 40, "correct": 33, "total": 40, "updated": "2026-06-30" }
      },
      "log": [ { "date": "2026-06-30", "slug": "pediatrics", "answered": 40, "correct": 33 } ]
    }
  }
}
```

`js/oksat-db.js` fetches it on load (cache-busted) and merges with localStorage
(later `updated` wins per module; the dated `log` records each sync). Because GitHub
Pages is static, *rewriting* the file works two ways from the hub's Sync panel:

1. **Download** the merged `oksat-db.json` and commit it (works everywhere, zero setup).
2. **Push to GitHub** directly via the Contents API using a fine-grained token pasted
   at sync time. The token lives in a JS variable for that one request and is
   **never persisted** — not in localStorage, not in the DB file, not in the repo.

## 5. The Question Forge (`oksat-generate.html`)

KAG-extract's workflow, OKSAT's skin, Gemini's engine: dump raw text (chapter,
guideline, conference notes) → get a ready-to-commit module file.

- **House style is part of the program** — an embedded instruction block (viewable in
  the UI, sent as the system prompt) encoding: mechanism → application → pearl;
  stress-test framing that exposes a precise failure mode; plausible distractors with
  per-option rationale; no answer telegraphing; acronyms spelled out on first use;
  anatomy asked as spatial relationships before labels; `brief` + `detailed` +
  `reference` on every item; concept tags wired to a generated DOMAINS/CONCEPTS
  taxonomy.
- Controls: module title/slug, domain hue, item count, MCQ/recall mix, difficulty focus.
- Output: validated JSON preview rendered as question cards, then **Download
  `js/mcq-modules/<slug>.js`** (ends in `window.__MCQ_MODULE = …`) plus a copyable
  manifest entry — drop-in, no engine changes.
- Model: Gemini (`gemini-2.5-flash` default; `-pro` selectable) via the
  `generativelanguage.googleapis.com` REST API with `responseMimeType: application/json`.

## 6. Gemini key manager (`js/oksat-ai.js`)

Attach / test / clear a Google AI Studio API key. Stored **only** in this browser's
`localStorage` (`oksat:gemini-key`) — the same trust model as the existing KAG
extractor — and never written to the DB file or the repo. All Forge calls go through
this module.

## 7. File map (after)

```
oksat.html                 hub: Modules + Atlas + Sync/settings
oksat-study.html           viewer (?m=slug&c=concept)
oksat-generate.html        Question Forge (Gemini)
mcq.html, mcq-study.html   redirect stubs (bookmarks keep working)
css/oksat.css              tokens + font themes + atlas/forge styles
js/oksat-engine.js         study engine (renamed; + ?c= deep link, oksat:* keys)
js/oksat-manifest.js       module registry (+ subspecialty field for the graph)
js/oksat-reviewer.js       reviewer identity (+ one-time mcq:*→oksat:* migration)
js/oksat-prefs.js          font theme boot + picker
js/oksat-atlas.js          the graph view
js/oksat-db.js             server DB fetch/merge/export/push
js/oksat-ai.js             Gemini key + generateContent wrapper + house style
js/mcq-modules/*.js        question banks — unchanged content
data/oksat-db.json         the server database file
docs/design-principles.md  design system
docs/authoring-oksat.md    module authoring guide (renamed + updated)
```

## 8. Deferred (deliberately)

- Data-level KAG↔OKSAT graph merge (shared node registry).
- Adaptive difficulty controller & generation-on-demand inside the viewer (the Forge
  covers generation for now; adaptivity needs more usage data to tune).
- Image-based items (audiograms, CT) — needs a curated image set.
- Confidence tagging (🟢/🌫️/👻) per answer for calibration analytics.
