# Decisions: routine judgment calls

Consult this before asking the owner a "how do I…" question. Where these rules run out, the rule
says **ASK THE OWNER** (§7). Companion docs: `docs/verification.md` (how to prove a change works),
`AGENTS.md` (Documentation second pass).

## 1. Which chrome does a new page use?

| You are building… | CSS | JS | Precedent |
|---|---|---|---|
| A new tool or utility page | `css/site.css` + a page `<style>` on its tokens | `js/theme-boot.js` in `<head>`, `js/site.js` at the end, logic in `js/<page>.js` | `cpt-search.html` |
| A page that must work fully offline | as above; **zero remote requests**, CSP with no remote origin | as above | `airway-jeopardy.html` |
| An OKSAT page | `css/oksat.css` (+ `css/oksat-learn.css` for the learning viewer) | `js/theme-boot.js` + the `js/oksat/*.js` stack; React and htm from `js/vendor/` on the question viewer only | `oksat.html`, `oksat-study.html`, `oksat-learn.html` |
| A page with an ES-module graph (3D) | `css/site.css` + `css/<page>.css` (its `--<page>-*` tokens) | `js/theme-boot.js` in `<head>`, `js/site.js` at the end, and **one** `<script type="module" src="js/<page>/main.js">`; three.js only from `js/vendor/three-<version>/` | `ssb.html` |

Every new page also gets: the CSP `<meta>` from its closest precedent,
`<link rel="icon" href="images/favicon.svg">`, stamped asset references
(`node tools/stamp-assets.mjs`), an entry in `PAGES` (`tools/smoke-pages.mjs`), and
**no inline script** (`docs/security.md`).

Files: the page at the root (URLs do not move); one script as `js/<page>.js`; several as
`js/<page>/` with unprefixed names; images in `images/<page>/`.

There is one palette, in `css/site.css`, mirrored as `--ok-*` in `css/oksat.css`. Do not create a
second token set.

## 2. Renaming or retiring a shipped page

**Delete it.** No redirect stubs (owner decision). Remove the page from `PAGES` in
`tools/smoke-pages.mjs` in the same change, and grep for inbound links:

```bash
grep -rn "<retired-page>" --include=*.html --include=*.js --include=*.md .
```

A stub is allowed only if the owner says a URL was shared somewhere it cannot be corrected.

## 3. localStorage keys

Namespaces: `sk_*` (site chrome), `oksat:*` (OKSAT), `ssb:*` (SSB). OKSAT persistence goes through
`window.OKSATStore` (`js/oksat/store.js`); SSB's through the guarded adapter in `js/ssb/state.js`.
Every read and write is guarded; a storage failure is a no-op, never an exception. The hub offers
Export and Import of every `oksat:*` key as one JSON file, validated before anything is written.

OKSAT keys carry a trailing `:<code>` namespace. `OKSATStore.reviewer()` resolves the code from
`oksat:reviewer` and otherwise returns `guest`. **Existing progress is stored under that namespace;
do not flatten it without migrating the data.**

Key registry (`<rev>` = namespace code, `<slug>` = module, `<guide>` = guide slug):

| Key / prefix | Owner file | Notes |
|---|---|---|
| `sk_theme` | `js/theme-boot.js` (read), `js/site.js`, `js/oksat/prefs.js` | day/night; `html[data-theme]` |
| `sk_airway_games` | `js/airway/app.js` | unfinished games, one entry per tab keyed by `sk_airway_tab`; at most 5, kept 24 h; listed, never auto-resumed |
| `sk_airway_tab` | `js/airway/app.js` | sessionStorage: this tab's 6-char id |
| `oksat:reviewer` | `js/oksat/store.js` | storage namespace; read-only |
| `oksat:migrated` | `js/oksat/store.js` | one-time `mcq:*`→`oksat:*` marker |
| `oksat:typeface` | `js/oksat/prefs.js`, `js/theme-boot.js` | `html[data-font]`; written only on an explicit pick |
| `oksat:progress:<slug>:<rev>` | `js/oksat/engine.js` | answers and firstCorrect |
| `oksat:srs:<slug>:<rev>` | `js/oksat/engine.js` | Leitner boxes |
| `oksat:cmastery:<slug>:<rev>` | `js/oksat/store.js` (written by the engine) | concept mastery; the hub's Weak concepts list |
| `oksat:learn:<guide>:<rev>` | `js/oksat/store.js` (`getLearn`/`saveLearn`), written by `js/oksat/learn.js` | guide record: sections done, grades, inline module answers, reading mode. Never a module's own progress |
| `ssb:prefs` | `js/ssb/state.js` | SSB depth tier as `{v:1, tier}`; written only on an explicit pick, never from a shared link |
| `cpt-history`, `cpt-analytics` | `js/cpt-search.js` | recent searches and counts; predate the namespaces |

Legacy keys no longer read are cleared by `OKSATStore.resetLocal`; do not write them.

No credential keys remain. **Do not reintroduce a key field** without the owner (§7).

## 4. Adding an OKSAT module

Schema and quality spec: `docs/authoring-oksat.md`. The rules that matter most:

1. File `js/oksat/modules/<slug>.js`, kebab-case; **`slug` equals the filename** (checked).
2. File ends with exactly `window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };`.
3. One manifest entry in `js/oksat/manifest.js`, with **`count` === `ITEMS.length`** (checked)
   and `subspecialty` a key of `OKSAT_SUBSPECIALTIES`.
4. Accent hue comes **only** from that subspecialty's entry in `OKSAT_SUBSPECIALTIES`; never invent
   a hex. A new subspecialty is an owner decision (§7).
5. MCQ items need `correct` matching an option id; recall items need `answer` (both checked).
   The engine tolerates missing `DOMAINS` or `CONCEPTS`; the quality spec requires both.
6. A new module comes back clean from `node tools/lint-oksat.mjs <slug>`. Recipe:
   `.claude/skills/oksat-module/SKILL.md`.

Modules are authored by hand; there is no generator.

**Interactive learning guides** (`docs/authoring-oksat-guide.md`, `.claude/skills/oksat-guide/SKILL.md`)
use the same subspecialty hues and the same rule that `accent` is never invented, with one entry in
`OKSAT_GUIDES`. The question modules a guide drills into are the source of truth for its questions:
add questions to a module (new ids, appended, never renumbered), never copy them into a guide.

## 5. Styling and theming

Components consume CSS custom properties only: **no raw colour values**. A new colour is a token in
the owning block (`css/site.css`, `css/oksat.css`, or Airway's `--aw-*` stage block). Theme and font
switching is only an attribute flip on `<html>` (`data-theme`, `data-font`), never a class swap on
components.

Colour always means something. Site-wide there are exactly two signals, from the audiogram:
`--signal` (right-ear red) = act and emphasis; `--signal-2` (left-ear blue) = science and research.
In OKSAT, one hue per subspecialty. Categorical colours that encode game state (Airway teams, topics,
difficulty) are allowed; decorative colour is not.

Do not reintroduce: pill "eyebrow" badges above headings, emoji as icons, icon fonts, gradient or glow
backgrounds, soft drop shadows on cards, pastel rainbow tags, or a second visitor-selectable theme.

## 6. When to log

After a significant chunk, update `docs/wip.md` (current state per system) and run the documentation
pass in `AGENTS.md`.

## 7. Escalate to the owner: do NOT decide these yourself

- Any claim about medical correctness in module, figure or archive content. Figures with invented
  shapes or data say "schematic" in the caption.
- Adding a subspecialty (a new hue) or changing `OKSAT_SUBSPECIALTIES`.
- Changing Leitner scheduling semantics (`LEITNER_INTERVALS`, box math).
- Deleting or rewriting anything under `archive/`: it is kept content.
- Adding an API-key field, or any new third-party or network dependency (CDN, font service, analytics).
- Loosening a page's Content-Security-Policy (`docs/security.md`).
- Changing the device or measurements in `js/diagrams/cochlea.js`: the owner's own cochlea and implant.
- Merging to `master` (that is deploy).
- Anything that would put a secret in the repo.

## 8. Adding a figure

Use the figure system (`docs/diagrams.md`; playbook `.claude/skills/ascii-diagram/SKILL.md`). Do not
add an image, an SVG library or a canvas. One scene file per figure in `js/diagrams/`.

| Question | Answer |
|---|---|
| Does this spot need a figure? | Only if it shows what prose cannot: spatial relations, a schedule, a response surface. Never decoration. |
| Which inks? | `ink` for the subject; `signal` for at most one thing; `science` for measurement; `ok`/`bad` for outcomes. Nothing else is coloured. |
| Spin or rock? | Objects spin. Plots and diagrams with a reading direction rock. |
| Invented data or proportions? | Allowed, but "schematic" goes in the caption and the scene header, and it is flagged to the owner (§7). |
| A figure no page shows any more? | Delete the scene file (`check-data.mjs` fails on orphans). |
| A figure on a page rendered by JavaScript? | Emit the empty `<figure data-a3d>` and call `ASCII3D.mountAll(root)` after each render (Airway). No baked frame. |

## 9. Listing unfinished work (owner)

Unfinished work is listed, not hidden: `draft: true` on the OKSAT guide or module entry (hub badge
plus a notice on its entry page), or a visible "Draft" notice on the entry page of any other new page
or tool. `unlisted` is for pages the owner wants unreachable (OLSB, SSB, atlas), not for work in
progress. Removing `draft` is the owner's call.

## 10. Settled owner decisions

- **Hero portrait.** The `index.html` hero portrait is hidden by default and opens from the "MD" word
  in the name (`.egg[data-egg="portrait"]`, `#hero-portrait`). The egg is hidden only under scripting,
  so a reader without JavaScript sees the portrait.

## 11. Open data we may commit

- **OpenEar (CC BY 4.0).** Derived data (resampled, cropped) may be committed with the attribution line in `tbone/LICENSE-data.md`. Raw archives, NRRD and DICOM files, and donor metadata (sex, dates) are never committed. Owner, 2026-11-11; `plans/2026-11-04-tbone-sources.md`.
- **Author names and e-mail addresses.** Author names may appear in the tree and in git history; history is not rewritten (`docs/realistic-anatomy.md` §13, RA-O7). E-mail addresses may not: `checkNoEmails` in `tools/check-data.mjs` fails on any in tracked text (`docs/security.md`). Owner, 2026-11-11.
