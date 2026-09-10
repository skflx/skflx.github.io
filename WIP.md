# WIP — current state

One section per living system: what it is, where it stands, what is next.
This is a status document, not a changelog — when something is retired, its
section goes away rather than growing a postscript. Git history is the record
of how things got here.

Last reviewed: 2026-09-10.

---

## One-pager (`index.html`)

**State:** Live and stable. Two visitor-selectable styles (Matte, Story) ×
day/night, all token-driven in `css/onepager.css`. Native `<details>`
accordion, hash deep-linking.

The residency year is computed in `js/onepager.js` from a July 1 rollover and
capped at PGY-5, so it no longer needs a manual edit each summer. The HTML
carries the current value as a no-JS fallback; the two must be edited
together if either is ever touched by hand.

**Next:** `documents/cv.pdf` is linked from the hero but the file has never
been uploaded — that link 404s today. Either upload the CV or drop the
button. Owner's call.

---

## OKSAT (`oksat.html`, `oksat-study.html`)

**State:** The tool is now just the hub and the study viewer. Five
hand-authored modules, each a data file in `js/mcq-modules/` plus one
manifest entry; the shared engine renders all of them. Answers lock on first
attempt and a five-box Leitner schedule resurfaces misses.

Progress is local to the browser and nothing is uploaded. Storage keys keep
their trailing `:<code>` namespace so progress from the multi-reviewer era
still resolves, but the code is now read silently — opening a module no
longer interrupts with a "Who is reviewing?" prompt.

The hub shows what the retired Progress and Atlas tabs were really being used
for: a completion meter per module, Launch vs Resume, and a single banner
totalling cards due across all modules with a link into the module holding
the most.

**Next:** Authoring is manual (`docs/authoring-oksat.md`). The module set is
thin outside pediatrics/otology — rhinology, laryngology, and H&N oncology
have hues reserved in `OKSAT_SUBSPECIALTIES` but no modules yet.

---

## Airway Rounds (`airway-jeopardy.html`)

**State:** Complete and self-contained — a 200-question ENT/H&N airway bank
with Rounds, Jeopardy board, quick quiz, and browse modes. Zero external
requests by design, so it runs on bad conference-room wifi or none.

**Next:** Nothing planned. Keep it CDN-free; that constraint is the feature.

---

## CPT search (`cpt-search.html`)

**State:** Frozen and working. Search logic is inline; the page still draws
tokens from the legacy `css/main.css`, which exists only for it.

**Next:** Nothing planned. If it is ever touched, moving it fully onto
`css/site.css` would let `css/main.css` go.

---

## Archive (`archive/`)

**State:** Holds the OHNS knowledge graph built for the retired Knowledge
Atlas Graph and Structural Atlas viewers, as raw JSON plus a flat text
rendering for reading. Nothing serves or checks it.

Only the temporal-bone seed set is owner-vetted (`review:true`); the rest is
authored scaffolding marked `draft` in the flat export. It is study material,
not a reference — `archive/README.md` says so at the point of use.

**Next:** Optional. Vetting nodes, or mining the detail text into OKSAT
modules, would both put the content back to work; neither is scheduled.

---

## Verification

**State:** Three Node suites, run in CI on every PR: `check-data.mjs`
(committed-data invariants, zero deps), `smoke-pages.mjs` (every page boots
with no real console errors), `test-oksat-engine.mjs` (answer lock, SRS
writes, keyboard, legacy migration).

The smoke harness earns its keep on cleanup work specifically — a same-origin
404 is treated as a failure, which is what catches a `<script>` tag left
pointing at a deleted file.

**Next:** `oksat-study.html` needs the React/htm CDN to boot, so it cannot be
smoke-tested in a network-restricted sandbox. Vendoring those two UMD bundles
would make the whole suite hermetic; until then, see `docs/verification.md`
for how to test that page's wiring with the CDN stubbed.
