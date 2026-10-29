# Spec — Figures, eggs & the atlas (2026-10-28)

> **Status lives in GitHub Issues: parent #176**, one sub-issue per work package (WP), labelled
> `wave:n` / `model:*` / `type:*`. This file is the spec: decisions, roles, contracts, anatomy
> numbers. It changes only through PRs. Branch: `claude/website-figures-diagrams-9uxh0g`.
> Commits: **one short line, no trailers.**


---

## 0. Context

The one-pager and the OKSAT hub show ASCII 3D scenes as their main figures. The owner wants three changes:

1. **ASCII becomes Easter eggs.** Each scene unfolds in place when the reader selects or taps one specific word.
2. **Informative, lit 3D figures** take their place, each teaching a principle:
   - tonotopy and frequency-to-place mismatch on the owner's own cochlea and FLEX28 array
   - binaural pitch fusion
3. **A separate, unlisted atlas page.** A Rhoton-style skull-base hemisection with no labels, where related structures highlight together. It becomes the only way into the two 3D models (OLSB, SSB).

Two non-figure changes are part of the same plan:
- Quiet links, starting with Fusion.
- Agent instructions synchronized across Claude, Gemini and Antigravity.

## 1. Locked decisions (owner, this session)

| # | Decision |
|---|---|
| D1 | Egg trigger = text **selection** overlapping the word, **or tap/click/Enter** on it. No visible mark. |
| D2 | 3D figures are **lit matte** (three.js, token colours, no textures). |
| D3 | Keep Fig. 1 (cochlea) and Fig. 2 (fusion), rebuilt in 3D. Each teaches a principle (§5). |
| D4 | Atlas art = **hand-built SVG**: control points authored by Opus, baked by a tool, **manually vetted by the owner** before it ships. |
| D5 | Atlas plane = midsagittal right half, medial view, face left. **Brain ghosted; posterior-fossa contents removed**, which exposes the posterior petrous face and the IAC porus. A cut-away window through the petrous bone. **CN VII drawn from brainstem to face.** |
| D6 | **No visible labels** in the atlas. Related structures highlight together as groups. |
| D7 | Atlas page `atlas.html`: unlisted (no inbound link), `noindex`. It links to OLSB (temporal-bone group) and SSB (sinonasal/ASB group) and is the **only** inbound path to either. |
| D8 | OLSB and SSB both `noindex`; both keep their "Draft" notice (already present). |
| D9 | **Delete** the Leitner staircase (scene, figure, CSS, check, test, docs). |
| D10 | Eggs:<br>• `cochlea` → "electrode" (About ¶1, index.html)<br>• `fusion` → "one sound" (Fig. 2 caption)<br>• `larynx` → "Airway" in the Airway Rounds `<h1>` (airway-jeopardy). |
| D11 | Quiet link: "binaural pitch fusion" in About ¶2 → `Fusion.html` (a personal reference, not recruitment). |
| D12 | Fig. 1 processor bands = **MED-EL default allocation, captioned "assumed default, not my fitting"**. |
| D13 | Instructions: canonical **`AGENTS.md`**. `CLAUDE.md`, `.claude/CLAUDE.md`, `.gemini/GEMINI.md` and `.agents/AGENTS.md` point to it. Plans live in `plans/`. |

## 2. Roles and protocol

| Model | Does | Never |
|---|---|---|
| **Opus** (orchestrator) | This plan; Wave 0; all anatomy and medical data (scene constants, atlas control points, fidelity fixes); adjudicating reviews; ticking this file | Routine wiring it can spec |
| **Gemini Flash** (coder) | Every WP marked **Flash**, to its Acceptance, inside its Touch list | Anatomy judgment, clinical claims, touching files outside Touch, changing contracts in §4 (escalate instead) |
| **Sonnet ∥ Argon** (adversarial reviewers) | Independent review of each wave's diff against this spec | Pushing fixes |

**WP rules (all models):**
- Read `AGENTS.md`, then only the WP's **Read** list.
- Edit only the **Touch** list. Anything else needed → stop, add the `blocked` label to the WP's issue, and comment why.
- Before pushing:
  1. Run the WP's **Acceptance** commands.
  2. `node tools/stamp-assets.mjs` if any `css/` or `js/` file changed.
  3. `node tools/check-data.mjs`.
- Then `git pull --rebase origin claude/website-figures-diagrams-9uxh0g`, push, and name `Closes #n` in the PR (or tick the issue's task list and close it).
- Parallel WPs in one wave have **disjoint Touch lists**. That is what makes them safe to run at once.
- **Stamp exemption:** `?v=` rewrites by `tools/stamp-assets.mjs` in any root `*.html` are allowed outside Touch. On a rebase conflict in a stamp, never hand-merge it: take either side, then rerun `stamp-assets` and `check-data`.

**Testing budget (owner: tests and CI are a bottleneck):**
- A WP runs **only the suites whose inputs it changed**:

  | Changed | Run |
  |---|---|
  | any `css/`, `js/`, `*.html` | `check-data` (instant, deps-free) |
  | `js/ascii3d.js`, `js/diagrams/` | `ascii3d.mjs bake` + byte diff |
  | `js/egg.js`, `js/fig3d/`, `atlas*`, `tools/atlas.mjs` | `test-figures --only <eggs\|fig3d\|atlas>` |
  | `js/oksat/` or `oksat*.html` | `test-oksat-engine` |
  | a page's markup | `smoke-pages --only <page>` |

- Reviewers do not rerun suites. They read the diff and the WP's reported output.
- The full suite runs **once**, at 4B, before the owner merges.
- **CI changes (3C):**
  - `test-figures` sits behind a `figures` change flag, never always-on.
  - `smoke-pages` and `test-figures` gain `--only` so CI runs just the changed pages.
  - `paths-ignore` for `plans/**`, `docs/**`, `*.md`.
  - `concurrency` with `cancel-in-progress`, so a newer push cancels the running job.
  - The always-on steps stay `check-data` and `lint-oksat` (both instant).
- Agents push **once per WP**, not per edit, so CI runs once per WP at most.

**Review protocol (after each wave):**
- Each reviewer gets the wave's diff (`git diff <wave-start-sha>..HEAD`), this spec, and the checklist in §7.
- Each posts an independent PR review on the wave's PR. One finding per comment:
  - severity: `block` / `fix` / `nit`
  - `file:line`
  - a concrete failure scenario
  - "reproduced: yes/no"
- Opus adjudicates. Real findings become new `type:wp` sub-issues of #176 (Flash). A dismissed finding gets a one-line reason on its thread. The wave's review issue (R1–R3) closes when nothing `block` is open.
- The next wave starts only when no `block` finding remains open.

---

## 3. Work packages (status: the linked issue)

| Wave | WP | Model | Issue |
|---|---|---|---|
| 0 | W0.1 Agent instruction sync | Opus | #177 |
| 0 | W0.2 Plan into repo | Opus | #178 |
| 0 | W0.3 ASCII fidelity review | Opus | #179 |
| 0 | W0.4 Contracts + data specs + atlas stub | Opus | #180 |
| 1 | 1A Egg runtime | Flash | #181 |
| 1 | 1B ASCII3D engine contract | Flash | #182 |
| 1 | 1C Delete Leitner + SSB noindex | Flash | #183 |
| 1 | 1D Atlas generator tool | Flash | #184 |
| 1 | R1 Review | Sonnet ∥ Argon | #185 |
| 2 | 2A 3D figure renderer | Flash | #186 |
| 2 | 2B Eggs applied + quiet link | Flash | #187 |
| 2 | 2C Atlas page shell | Flash | #188 |
| 2 | 2D Cochlea tonotopy + binaural data | Opus | #189 |
| 2 | 2E Atlas anatomy | Opus | #190 |
| 2 | R2 Review | Sonnet ∥ Argon | #191 |
| 3 | 3A Mount Figs 1–2 | Flash | #192 |
| 3 | 3B Atlas bake + check-data rules | Flash | #193 |
| 3 | 3C Figure tests + leaner CI | Flash | #194 |
| 3 | R3 Review | Sonnet ∥ Argon | #195 |
| 4 | 4A Docs pass | Flash | #196 |
| 4 | 4B Opus checkpoint | Opus | #197 |

Each issue body holds Goal, Model, Depends, Read, Touch, Steps (task list), Acceptance and
Escalate. Steps cite the sections below rather than copying them.

### W0.3 fidelity log
Posted as a comment on #179 when W0.3 runs.

---

## 4. Contracts (pinned in W0.4; Flash never changes these)

### 4.1 Egg markup and behaviour
```html
<span class="egg" data-egg="cochlea" role="button" tabindex="0"
      aria-expanded="false" aria-controls="egg-cochlea">electrode</span>
…
<figure class="a3d egg-figure" id="egg-cochlea" data-a3d="cochlea"> <!-- baked frame --> <figcaption>…</figcaption></figure>
```
- Open = `figure.classList.add('is-open')`, `aria-expanded="true"`, then `ASCII3D.refresh(figure)`.
- **Selection rule:** on `selectionchange` (150 ms debounce), if `!sel.isCollapsed` and some `range.intersectsNode(trigger)` → open. A deselect never closes.
- Toggle: click / Enter / Space on the trigger. Esc closes when focus is in the trigger or the figure.
- CSS: `@media (scripting: enabled) { .egg-figure:not(.is-open) { display: none } }`.

### 4.2 ASCII3D additions
- `ASCII3D.compile(sceneOrId, { view })` → `{ meshes:[{P,N,I,R?,quads,part}], lines, points, center, radius }`
- `ASCII3D.refresh(figEl)`
- part `view: 'ascii'|'3d'`
- part `ramp(u,v)`

The ASCII output of existing scenes must stay byte-identical.

### 4.3 fig3d
```html
<figure class="fig3d about-figure" data-fig3d="cochlea">
  <picture class="fig3d-poster"><source srcset="images/figures/cochlea-dark.webp" media="(prefers-color-scheme: dark)">
    <img src="images/figures/cochlea-light.webp" alt="{scene.alt}" width="…" height="…"></picture>
  <div class="fig3d-controls"></div><p class="fig3d-hud" aria-live="polite"></p>
  <figcaption class="site-kicker"><span class="fig-no">Fig. 1</span> …</figcaption>
</figure>
```
- The poster swap also follows `html[data-theme]`: CSS hides the wrong poster. `render.js` sets `data-fig3d-ready` on its figure when the canvas is live.
- Scene hooks:
  ```js
  fig3d: {
    controls: [{ key, type: 'range'|'toggle', min, max, log, value, options, label }],
    highlight(state) → { [partIndex]: 'lit'|'dim' },
    readout(state | pick) → string,
    pickable: [partIndex]
  }
  ```
  The renderer re-applies these on every control change.

### 4.4 Atlas
- **anatomy.json:**
  ```
  { viewBox: [x, y, w, h],
    groups: { <id>: { sub: <OKSAT subspecialty key> | null, href: string | null, ariaLabel: string, interactive: bool } },
    shapes: [ { id, group, tissue: bone|cutbone|soft|mucosa|cartilage|nerve|vessel|air|brainghost|skin,
                points: [[x, y], …], closed: bool, tension: 0..1,
                shade?: dome|pit, dashed?: bool, z: int } ] }
  ```
- **Emitted SVG:**
  - shapes sorted by `z`
  - one `<g class="at-group" data-group data-sub>` per group; a linked group is `<a class="at-group" href …>`
  - interactive groups get `tabindex="0"` (for `<g>`) and `aria-label`
  - no `<text>` and no `<title>` children (D6 — `aria-label` is for screen readers only, not visible)
  - `<path class="at-shape at-<tissue>[ at-dashed]">`
- **Behaviour:** see 2C.

### 4.5 Quiet link
`a.quiet` = `color: inherit; text-decoration: none`. On `:hover` / `:focus-visible`: `text-decoration: underline dotted var(--ink-faint)`.

---

## 5. Anatomy and data specs (Opus fills the numbers in W0.4 / 2D / 2E)

### 5.1 Fig. 1 — tonotopy and mismatch on the owner's cochlea
- **Two place maps, because they differ:**
  - **Organ of Corti (OC):** Greenwood, `f = 165.4·(10^(2.1·x) − 0.88)`, x = fraction of OC length from the apex.
  - **Spiral ganglion (SG):** the SG frequency map, which is what an electrode actually stimulates (Stakhovskaya et al. 2007). Rosenthal's canal ends near 1.75 turns while the OC continues to ~2.6, so the SG map is compressed. Every contact deeper than the SG's end lands on the SG's apical-most cells.
  - At each contact angle, compute both and show both. The **SG frequency is the primary value** (the one stimulated). The OC frequency is shown beside it wherever the two diverge by more than an agreed threshold, set in W0.4.
  - This divergence is part of the principle: the deepest contacts sit past the ganglion.
- Owner geometry stays as is: A 8.7, B 6.1, H 3.1, CDL 30.2, FLEX28 at 28 mm.
- **Basilar-membrane band:**
  - a thin `surface` along scala-tympani roof
  - `ramp` = log-frequency normalized (apex light → base dark `--signal-2`)
  - `view:'3d'`
- **Contacts:** pickable. Readout: `E{n} · {angle}° · ganglion ≈ {fSG} Hz [· organ of Corti ≈ {fOC} Hz] · assigned {lo}–{hi} Hz (default)`.
- The basilar-membrane ramp shows the OC map. A second, thinner band along Rosenthal's canal shows the SG map, ending where the ganglion ends.
- **Bands:** MED-EL default allocation (edges verified in W0.4 against MED-EL fitting documentation, cited in the scene header). The caption states "default allocation, assumed, not my fitting".
- **Principle shown:** apical contacts are assigned bands far below their place frequency, i.e. the place-pitch mismatch that bimodal listeners must reconcile. That leads into Fig. 2.

### 5.2 Fig. 2 — binaural fusion (`binaural.js`)
- Two cochleae side by side, both schematic:
  - left: acoustic (hearing-aid) ear, with a BM ramp
  - right: implanted ear, with a 12-contact array
- **Controls:**
  - tone 125–4000 Hz, log scale (the same axis as the ASCII fusion egg)
  - listener narrow ~1 oct / broad ~3.5 oct (`fusion.js` `LISTENERS`)
- **highlight:**
  - the tone's Greenwood place on the left lights
  - right-side contacts with `P(L,e,tone) ≥ .5` light; the others dim
- **readout:** `{tone} Hz fuses with E{a}–E{b} ({n} of 12)`.
- Labelled **schematic, not patient data** (Reiss et al. 2014 range).

### 5.3 Atlas plane and groups
- Midsagittal right half, medial view, face left, adult. Brain ghosted (cerebrum and corpus callosum outline only). Cerebellum and posterior-fossa contents removed. Brainstem shown only as a ghosted stump at the pontomedullary junction, so CN VII has an origin.
- **Exposed:** posterior face of the petrous temporal bone with the porus acusticus internus, the sigmoid groove, and the jugular foramen.
- **Petrous window:** a circular cut-away, with a hatched rim, showing cochlea, vestibule, SCCs, ossicles, tympanic membrane, EAC and mastoid air cells.
- **CN VII:**
  - brainstem → IAC: solid
  - labyrinthine → geniculate → tympanic → mastoid segments: solid, inside the window
  - extratemporal course and branches (lateral to the plane): **dashed** = beyond-plane projection
- **Nasal:** septum removed, showing the lateral nasal wall with turbinates.

| Group | Contents | `sub` | `href` |
|---|---|---|---|
| `lsb` | petrous face, porus/IAC, window contents, mastoid, sigmoid/jugular | otology | `OLSB.html#m=3d` |
| `cn7` | facial nerve, brainstem → face | otology | — |
| `asb` | frontal sinus, crista/cribriform/planum, lateral nasal wall + turbinates, sphenoid, sella/pituitary, clivus | rhinology | `ssb.html` |
| `pharynx` | adenoid, soft palate/uvula, palatine tonsil, posterior pharyngeal wall, tongue base | pediatrics | — |
| `oral` | lips, teeth, hard palate, oral tongue, floor of mouth | hn_onc | — |
| `larynx` | hyoid, epiglottis, thyroid/cricoid cartilages, vocal folds, trachea | laryngology | — |
| `thyroid` | thyroid isthmus | endocrine | — |
| `facial` | frontal bone, nasal bones, maxilla, mandible | fprs | — |
| context (non-interactive) | ghost brain, brainstem stump, C1–C7, cord, esophagus, skin/scalp | — | — |

Opus may refine the group membership in 2E and must update this table if it does.

---

## 6. Verification (end to end)

```bash
python3 -m http.server 8000                 # manual: index (open About/Research), airway, oksat, atlas.html, OLSB/SSB via atlas
node tools/stamp-assets.mjs && node tools/check-data.mjs
node tools/ascii3d.mjs bake && git diff --exit-code -- '*.html'   # bake fresh
node tools/atlas.mjs check && node tools/fig3d.mjs check
node tools/smoke-pages.mjs
node tools/test-figures.mjs
node tools/test-oksat-engine.mjs && node tools/test-oksat-learn.mjs   # Leitner removal regression
node tools/test-wiki-sync.mjs && node tools/lint-oksat.mjs
```

Manual, on a phone-width viewport:
- tap "electrode" → egg
- long-press-select "one sound" → egg
- Fig. 2 slider works with a thumb
- atlas: first tap lights a group, second tap follows the link

## 7. Reviewer checklist (R1–R3)

- Every changed file is inside its WP's Touch list.
- Contracts in §4 are followed exactly.
- CSP: no inline `<script>`, no `on*=`, no remote origin. Airway still loads only same-origin files.
- Nothing from a URL or data file reaches `innerHTML` unescaped.
- `localStorage`/DOM access is guarded. Graceful degradation holds: no JS, no WebGL, reduced motion.
- Asset stamps are fresh. Bakes are fresh. No hand-edited baked block or stamp.
- ASCII frames of the egg scenes are unchanged by 1B (byte diff).
- Unlisted invariants hold: no link to `atlas.html`; OLSB/SSB are reachable only from the atlas; all three are `noindex`.
- Accessibility: triggers are focusable with `aria-expanded`; fig3d has alt text + `aria-live`; atlas groups are keyboard reachable.
- No anatomy or clinical claim was introduced by a Flash WP.
- Commits are one line with no trailers.

## 8. Owner checkpoints

- #198: after W0.3, the fidelity log (any caption wording change).
- #199: after 2D/2E, posters + atlas previews (light/dark, each group lit).
- #200: after Wave 4, the full vetting list (4B). Merge to `master` = deploy; only the owner merges.
