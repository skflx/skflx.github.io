# WIP — current state

One section per living system: what it is, where it stands, what is next.
This is a status document, not a changelog — when something is retired, its
section goes away rather than growing a postscript. Git history is the record
of how things got here.

Last reviewed: 2026-09-23.

---

## Design system (`css/site.css`, `css/oksat.css`)

**State:** Redesigned 2026-09-23 away from the warm-cream/serif look. One
system everywhere: paper/ink, hairline rules, Archivo + IBM Plex Mono
(self-hosted), and two audiogram signal colors with fixed meanings. OKSAT
mirrors it as `--ok-*` tokens; Airway's dark stage uses the night palette.
Icon fonts, emoji, pastel badges and the Matte/Story style switch are gone.

**Next:** Nothing scheduled. The og-card image (`images/og-card.jpg`) predates
the redesign and could be reshot to match.

---

## One-pager (`index.html`)

**State:** Rebuilt as an index: big name, Fig. 1 (a generated cochlea with a
22-contact array and Greenwood tonotopic ticks), then five open numbered
sections with sticky heads on desktop. The residency year computes itself
from a July 1 rollover (capped at PGY-5); the HTML carries the current value
as a no-JS fallback, and the two must change together.

**Next:** `documents/cv.pdf` is linked from the hero but has never been
uploaded — that link 404s today. Upload the CV or drop the link. Owner's call.

---

## OKSAT (`oksat.html`, `oksat-study.html`)

**State:** The tool is now just the hub and the study viewer. Seven
hand-authored modules, each a data file in `js/mcq-modules/` plus one
manifest entry; the shared engine renders all of them. Every question opens
on a recall gate: the stem shows first, and you either **reveal the answer**
and self-grade from memory (Knew it cold / partially / guessed / didn't know)
or **show the choices** and answer it as an MCQ. The engine records which path
settled each item, so "knew it cold" and "got it with the choices" stay
distinct in the record. Answers lock on first attempt and a five-box Leitner
schedule resurfaces misses (a cold recall jumps two boxes; a correct MCQ, one).
The engine also supports optional per-item images in stems and explanations
(`item.image`, `item.explanationImage`), first used in the lip-reconstruction
module.

The viewer now loads React/htm from `js/vendor/` (pinned) rather than a CDN,
and the default typeface is the site's own (`instrument`); the choice moved to
`oksat:typeface` and is stored only when picked.

Progress is local to the browser and nothing is uploaded. Storage keys keep
their trailing `:<code>` namespace so progress from the multi-reviewer era
still resolves, but the code is now read silently — opening a module no
longer interrupts with a "Who is reviewing?" prompt.

The hub shows what the retired Progress and Atlas tabs were really being used
for: a completion meter per module, Launch vs Resume, and a single banner
totalling cards due across all modules with a link into the module holding
the most.

**Next:** Authoring is manual (`docs/authoring-oksat.md`). The module set is
thin outside pediatrics/otology — laryngology and H&N oncology have hues
reserved in `OKSAT_SUBSPECIALTIES` but no modules yet. Facial plastics has
two modules (facial reanimation, lip reconstruction); rhinology now has its
first (allergy and allergy testing, a free-response module in the
dtc-risk-stratification style).

---

## Airway Rounds (`airway-jeopardy.html`)

**State:** Complete and self-contained — a 200-question ENT/H&N airway bank
with Rounds, Jeopardy board, quick quiz, and browse modes. Zero external
requests by design (now enforced by its CSP), so it runs on bad
conference-room wifi or none. Retoned onto the site palette; UI logic moved
from an inline script to `js/airway-app.js`.

**Next:** Nothing planned. Keep it CDN-free; that constraint is the feature.

---

## CPT search (`cpt-search.html`)

**State:** Working, on the shared system (`css/site.css`), logic in
`js/cpt-search.js`. Search history stays in `localStorage`
(`cpt-history`, `cpt-analytics`). The legacy stylesheet it depended on is
deleted.

**Next:** Nothing planned. The code table is hand-maintained inline data.

---

## Wiki scaffold (`wiki/`)

**State:** Scaffold only, nothing built or served. Quartz 5 config (from the
upstream `obsidian` template, retuned to the site), custom styles, landing
page, an inert deploy workflow, and `wiki/sync/sync-vault.mjs` — the
fail-closed sync from the `sk.oto` vault (six subspecialty folders + MOC;
Personal Notes, drafts, source texts and governance files never leave).
Tested on a synthetic vault in CI; a real Quartz v5.0.0 build of the config
succeeded on 2026-09-23.

**Next:** Owner decisions in `wiki/README.md` — public vs. vetted-only vs.
password-gated, the separate repo, and whether to automate the sync. DGMO
diagrams render as code until converted (e.g. to Mermaid).

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

**State:** Four Node suites, run in CI on every PR: `check-data.mjs`
(committed data + security invariants: CSP on every page, no inline or
third-party script, vendored-file hashes), `test-wiki-sync.mjs` (the vault
boundary), `smoke-pages.mjs` (every page boots with no real console errors,
plus the `?m=` XSS regression), `test-oksat-engine.mjs` (answer lock, SRS
writes, keyboard, legacy migration). With React/htm vendored the browser
suites are hermetic and run in a network-restricted sandbox.

Security audit 2026-09-23: `docs/security.md` (one high-severity reflected
XSS fixed; CSP added site-wide; CDN scripts vendored).

**Next:** GitHub Pages cannot send headers, so `frame-ancestors`/HSTS are out
of reach without a proxy host. Owner's call whether that matters.
