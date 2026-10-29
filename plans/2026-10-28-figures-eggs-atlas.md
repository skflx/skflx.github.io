# Plan — Figures, eggs & the atlas (2026-10-28)

> **Execution scope approved so far: W0.1 + W0.2 only** (agent sync + this plan committed to the
> repo). Everything after W0.2 waits for the owner's go.
>
> This is the canonical copy. Every agent (Claude, Gemini, reviewers) reads and ticks this file. Branch:
> `claude/website-figures-diagrams-9uxh0g`. Commits: **one short line, no trailers.**

## Status

- [ ] Wave 0 — Opus: agent sync, plan in repo, fidelity review, data specs (W0.1, W0.2 done)
- [ ] Wave 1 — Gemini Flash ×4 in parallel: eggs runtime, engine contracts, Leitner removal + SSB noindex, atlas generator
- [ ] Review R1 — Sonnet ∥ Argon
- [ ] Wave 2 — Flash ×3 ∥ Opus ×2: 3D renderer, eggs applied, atlas shell ∥ cochlea/binaural data, atlas anatomy
- [ ] Review R2
- [ ] Wave 3 — Flash ×3 in parallel: Figs 1–2 mounted, atlas baked, test suite + CI
- [ ] Review R3
- [ ] Wave 4 — Flash docs pass ∥ Opus checkpoint → owner sign-off

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
| **Sonnet ∥ Argon** (adversarial reviewers) | Independent review of each wave's diff against this plan | Pushing fixes |

**WP rules (all models):**
- Read `AGENTS.md`, then only the WP's **Read** list.
- Edit only the **Touch** list. Anything else needed → stop and write `BLOCKED: <why>` under the WP in this file.
- Before pushing:
  1. Run the WP's **Acceptance** commands.
  2. `node tools/stamp-assets.mjs` if any `css/` or `js/` file changed.
  3. `node tools/check-data.mjs`.
- Then `git pull --rebase origin claude/website-figures-diagrams-9uxh0g`, push, and tick the WP's boxes here, in the same commit.
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
- Each reviewer gets the wave's diff (`git diff <wave-start-sha>..HEAD`), this plan, and the checklist in §7.
- Each writes `plans/reviews/2026-10-28-R<n>-<sonnet|argon>.md`. One finding per entry:
  - severity: `block` / `fix` / `nit`
  - `file:line`
  - a concrete failure scenario
  - "reproduced: yes/no"
- Opus merges both files into a **Findings** list under the review heading here. Real ones become fix WPs (Flash). The reasons for dismissing a finding are recorded.
- The next wave starts only when no `block` finding remains open.

---

## 3. Waves

### Wave 0 — Opus (serial, this session after approval)

**W0.1 Agent instruction sync** — Touch: `AGENTS.md` (new), `CLAUDE.md`, `.claude/CLAUDE.md` (new), `.gemini/GEMINI.md` (new), `.gemini/settings.json` (new), `.agents/AGENTS.md` (new), `docs/docs-map.md`, `docs/delegation.md`, `README.md` (tree), `tools/check-data.mjs` (pointer invariant), `.claude/skills/*/SKILL.md` (`CLAUDE.md` → `AGENTS.md` refs).
- [x] Move the current `CLAUDE.md` body into `AGENTS.md`, worded model-neutral ("coding agents", not "Claude Code"). Add sections:
  - **Cross-Agent Instruction Synchronization & Implementation Planning Standard** (the owner's text, verbatim)
  - **Models & roles** (§2 above)
  - **Commits**: one short line, no `Co-Authored-By` or other trailers, no model names
  - **Skills**: `.claude/skills/<name>/SKILL.md` are playbooks; a non-Claude agent reads the file directly
- [x] `CLAUDE.md` = one line `@AGENTS.md` (Claude Code import), plus a one-sentence comment that it must not grow.
- [x] `.claude/CLAUDE.md` = a pointer sentence only, **no** `@` import (Claude Code would load the canonical text twice).
- [x] `.gemini/settings.json` = `{"context":{"fileName":["AGENTS.md"]}}` so Gemini CLI loads the canonical file. `.gemini/GEMINI.md` and `.agents/AGENTS.md` = a pointer sentence each.
- [x] `check-data`: each pointer file exists and mentions `AGENTS.md`. `AGENTS.md` exists.
- [x] `docs/docs-map.md`, `docs/delegation.md`: `CLAUDE.md` → `AGENTS.md`. Rewrite delegation roles to match §2: Opus, Gemini Flash, Sonnet ∥ Argon.
- Acceptance: `node tools/check-data.mjs` passes. `grep -rn "CLAUDE\.md" docs .claude tools README.md` shows only the pointer description.

**W0.2 Plan into repo** — Touch: `plans/2026-10-28-figures-eggs-atlas.md`, `plans/README.md`, `plans/reviews/.gitkeep`.
- [x] Copy this plan. `plans/README.md` = an index of plans with status.

**W0.3 ASCII fidelity review** — Touch: `js/diagrams/cochlea.js`, `js/diagrams/fusion.js`, `js/diagrams/larynx.js` (comments/constants/labels only), plus the matching captions in `index.html` and `js/airway/app.js`.
- [ ] Cochlea checks:
  - SG extent (Stakhovskaya 2007, JARO 8:220): ~1.75 turns, label "~630 deg" vs `SG_END`.
  - Caption "about 700°" vs computed `angles[0]`. Derive the label text from the constants rather than hard-coding it.
  - The array sits on the lateral wall of scala tympani.
  - The cochlear nerve leaves from the modiolar base.
  - The lead exits through the round window.
- [x] Fusion checks (owner-verified 2026-10-28; no further lookup):
  - Reiss et al. 2014 JARO 15:235 reports 1–4 octave bimodal fusion ranges.
  - The normal-hearing "< ~0.2 octave" claim comes from prior Reiss-lab work; the owner vouches. Wording stays as is.
  - Electrode direction is apex = low.
- [ ] Larynx checks:
  - Cricoid is a signet ring (low arch in front, tall lamina behind).
  - Tracheal rings are C-shaped and open posteriorly.
  - CTM lies below the folds.
  - Proportions are adult male; "schematic" is stated.
- [ ] Record each finding with its fix in a **W0.3 log** under this WP. Rebake (`node tools/ascii3d.mjs bake`) and stamp.
- Acceptance: `node tools/ascii3d.mjs render <id> --turn 4 --inks` reviewed for each scene. `check-data` passes.

**W0.4 Data specs that Flash builds against** — Touch: this plan (§4–§5 filled in), `tools/atlas/anatomy.json` (stub: the group list and 1 shape per group, valid schema).
- [ ] Pin the §4 contracts.
- [ ] Write §5 numbers: Greenwood constants, angle→place map source, MED-EL default band edges, binaural model.
- [ ] Commit the atlas stub so Wave 1 tooling has real input.

### Wave 1 — Gemini Flash, 4 WPs in parallel (Touch lists disjoint by file)

**1A Egg runtime** — Touch: `js/egg.js` (new, classic IIFE), `css/egg.css` (new). Read: §4.1, `js/onepager.js` (fold pattern), `css/ascii3d.css`, `js/ascii3d.js` (mount/refresh).
- [ ] Implement contract §4.1 exactly:
  - debounced `selectionchange`
  - click/Enter/Space toggle
  - Esc closes and returns focus to the trigger
  - `aria-expanded`
  - event delegation on `document`, so it also works on JS-rendered pages (Airway)
- [ ] On open, call `ASCII3D.refresh(fig)` (from 1B) so the grid refits after leaving `display:none`.
- [ ] Reveal animation: `clip-path` print-in over ~600 ms. None under `prefers-reduced-motion`.
- [ ] Pre-paint hide only under `@media (scripting: enabled)`, so without JS every egg is simply visible (same pattern as the folds).
- [ ] Hover: `cursor: zoom-in` only. `:focus-visible` gets a hairline outline. No other styling.
- Acceptance: a scratch HTML page in the scratchpad (not committed) exercises all paths. `node tools/check-data.mjs` passes.

**1B ASCII3D engine contract additions** — Touch: `js/ascii3d.js`, `tools/ascii3d.mjs` (if needed), `docs/diagrams.md` (schema rows only). Read: §4.2.
- [ ] Export `api.compile(sceneOrId)` (existing `compile`).
- [ ] Export `api.refresh(figEl)`: re-fit and repaint a mounted figure.
- [ ] Part field `view: 'ascii' | '3d'` (default both). `compile` gets a second argument `{ view }`. The ASCII frame path passes `'ascii'`; `__compiled` is cached per view.
- [ ] Part field `ramp(u, v) → 0..1` on grid-mesh kinds (`surface`, `tube`, `cylinder`). `gridMesh` stores `mesh.R` (Float32Array per vertex) when it is present. The ASCII path ignores it.
- Acceptance:
  - `node tools/ascii3d.mjs bake` produces **no diff** on existing pages (byte-identical frames).
  - `node tools/check-data.mjs` passes.
  - `node tools/smoke-pages.mjs` passes.

**1C Delete Leitner + SSB noindex** — Touch: `js/diagrams/leitner.js` (delete), `oksat.html` (figure block + script tag), `css/oksat.css` (`.hub-figure*` rules), `tools/check-data.mjs` (Leitner block only), `tools/smoke-pages.mjs` (oksat `ready` only), `ssb.html` (robots meta only). Docs mentions are left to 4A (`docs/diagrams.md` belongs to 1B in this wave).
- [ ] Also drop `css/ascii3d.css` and `js/ascii3d.js` from `oksat.html` if no other figure is left there.
- [ ] Add `<meta name="robots" content="noindex">` to `ssb.html` (D8). The unlisted-page invariants come in 3B.
- [ ] `grep -rn leitner js css tools *.html` is clean, except `LEITNER_INTERVALS` in the engine itself.
- Acceptance: `check-data`, `smoke-pages`, and `test-oksat-engine` all pass.

**1D Atlas generator tool** — Touch: `tools/atlas.mjs` (new), `docs/atlas.md` (new: schema + workflow). Read: §4.4, `tools/ascii3d.mjs` (bake-between-markers pattern).
- [ ] `node tools/atlas.mjs bake`:
  - reads `tools/atlas/anatomy.json`
  - emits SVG per §4.4 between `<!-- atlas:svg -->` / `<!-- /atlas:svg -->` in `atlas.html` (if the file is missing, prints the SVG to stdout)
  - Catmull-Rom → cubic Bézier, closed or open per shape
  - coordinates rounded to 0.1
  - deterministic output
- [ ] `node tools/atlas.mjs check` → exit 1 if the bake is stale. Export `checkAtlas()` for check-data to import (3B wires it).
- [ ] `node tools/atlas.mjs preview --out <png> [--theme dark] [--hover <group>]`: Playwright renders a temp page with the SVG and `css/atlas.css`, then screenshots it. This is Opus's authoring loop.
- [ ] Validate the schema: unknown group, unknown tissue, or <3 points → error naming the shape id.
- Acceptance: the bake of the W0.4 stub is deterministic (run twice, no diff). The preview writes a PNG.

**R1 — Sonnet ∥ Argon review of Wave 0 + Wave 1.** Findings → here.

### Wave 2 — Flash ×3 ∥ Opus ×2

**2A 3D figure renderer (Flash)** — Touch: `js/fig3d/loader.js` (new), `js/fig3d/render.js` (new), `css/fig3d.css` (new), `tools/fig3d.mjs` (new: poster bake), `tools/stamp-assets.mjs` (generalize the SSB module-graph pass to also cover `js/fig3d/`). Read: §4.3, `js/ascii3d.js` (`compile`, `camera`, drag semantics), `js/olsb/3d.js` (three import + token materials), `js/ssb/materials.js`.
- [ ] `loader.js` (module, tiny, stamped in HTML):
  - per `[data-fig3d]`, an IntersectionObserver
  - on first intersection (folded sections are `display:none`, so this means "section opened"), `import('./render.js?v=…')`
  - if WebGL is unavailable or the import fails, keep the poster and log nothing
- [ ] `render.js`:
  - imports three from `../vendor/three-0.186.1/build/three.module.js`
  - builds BufferGeometry from `ASCII3D.compile(id, {view:'3d'})`: meshes (quads → 2 tris; N as normals), lines → `Line2`-free thin tubes or `LineBasicMaterial`, points → small spheres
  - colours per part ink from computed CSS tokens (`--ink`, `--ink-muted`, `--ink-faint`, `--signal`, `--signal-2`)
  - `ghost` parts skipped
  - `mesh.R` → vertex colours along a lightness ramp of `--signal-2` (§5.1)
  - `MeshStandardMaterial({roughness:1, metalness:0})`, hemisphere + key directional light, transparent background
  - camera from `scene.camera` yaw/pitch
  - re-colour on `data-theme` flip
- [ ] Interaction, copying the ASCII engine's semantics:
  - drag yaws/pitches (`touch-action: pan-y`, no OrbitControls, no zoom)
  - arrow keys when focused
  - slow rock per `scene.motion` unless reduced-motion
  - paused offscreen or when `document.hidden`
- [ ] `scene.fig3d` hooks (§4.3): controls rendering (range/toggle), `highlight(state)`, `readout(state)` into an `aria-live="polite"` HUD, and pick-to-readout on `pickable` parts (raycast).
- [ ] `tools/fig3d.mjs bake`: Playwright opens each page with a `data-fig3d`, opens its fold, waits for `data-fig3d-ready`, and screenshots the canvas → `images/figures/<id>-light.webp` and `-dark.webp`. `check` = posters exist for every id.
- Acceptance:
  - A scratch page with the `cochlea` scene renders, rotates and theme-flips.
  - No console errors under `smoke-lib`.
  - `stamp-assets` stamps `js/fig3d/*` imports.
  - `check-data` passes.

**2B Eggs applied + quiet link (Flash)** — Touch: `index.html`, `airway-jeopardy.html` (script/css tags), `js/airway/app.js` (hero markup), `css/site.css` (`.quiet` link rule only), `css/onepager.css` (egg figure spacing only), `tools/smoke-pages.mjs` (index/airway `ready` only). Read: §4.1, §4.5.
- [ ] index.html:
  - Fig. 1's ASCII `cochlea` becomes an egg figure after About ¶1. Trigger = "electrode" in ¶1.
  - The `fusion` ASCII egg figure goes directly after Fig. 2's `<figure>`. Trigger = "one sound" in Fig. 2 caption. **Leave the existing Fig. 1/Fig. 2 slots** as empty `<figure data-fig3d>` placeholders, with their current captions, for 3A to fill. Do not add the loader yet.
  - "binaural pitch fusion" in About ¶2 → `<a class="quiet" href="Fusion.html">`.
- [ ] Airway:
  - `<h1>` becomes `<span data-egg="larynx" …>Airway</span> Rounds`
  - the larynx figure gets `class="a3d egg-figure" id="egg-larynx"`, caption kept
  - load `css/egg.css` + `js/egg.js` (same-origin: the page stays self-contained)
- [ ] `.quiet`: inherits colour. On `:hover`/`:focus-visible`, a dotted underline in `--ink-faint`.
- [ ] Bake, then stamp.
- [ ] smoke-pages: `figureReady(p, 'cochlea'|'fusion')` must target the hidden eggs. Open each egg in `ready` before checking it. Airway: the same for larynx.
- Acceptance:
  - `smoke-pages` passes. `check-data` passes.
  - Manual: selecting "electrode" opens the egg.

**2C Atlas page shell (Flash)** — Touch: `atlas.html` (new), `css/atlas.css` (new), `js/atlas.js` (new). (Its smoke entry is added by 3C.) Read: §4.4, `ssb.html` head (CSP/topbar pattern), `js/olsb/main.js` (`shade: dome|pit` gradients), `js/oksat/manifest.js` (`OKSAT_SUBSPECIALTIES`).
- [ ] Page:
  - standard topbar
  - CSP `script-src 'self'`
  - `noindex`
  - `<title>Atlas | skflx.MD</title>`
  - the `<!-- atlas:svg -->` markers
  - loads `css/site.css`, `css/atlas.css`, `js/theme-boot.js`, `js/site.js`, `js/oksat/manifest.js`, `js/atlas.js`
- [ ] Tissue tokens `--atlas-*` in `css/atlas.css`, derived from site tokens, light and dark. Cut bone uses a hatch `<pattern>`. Ghost layers use low opacity and are non-interactive.
- [ ] `js/atlas.js`, implementing §4.4 behaviour:
  - hover/focus a group → set `--hue` from `OKSAT_SUBSPECIALTIES[data-sub].hue` via `style.setProperty`, add `.is-lit`, dim the others
  - tap on touch: first tap lights, second tap follows `href`
  - Esc clears
  - groups without a link toggle a pinned light
- Acceptance:
  - Against the W0.4 stub bake: hover lights, keyboard Tab reaches every interactive group, and the links resolve to `OLSB.html#m=3d` and `ssb.html`.
  - `check-data` passes.
  - A scratch Playwright run of `atlas.html` has no console errors.

**2D Cochlea tonotopy + binaural scene data (Opus)** — Touch: `js/diagrams/cochlea.js`, `js/diagrams/fusion.js` (export the model), `js/diagrams/binaural.js` (new).
- [ ] Cochlea, per §5.1 (all parts added with `view:'3d'`; the ASCII egg stays byte-stable):
  - basilar-membrane band surface with `ramp`
  - per-contact place frequency and assigned band (MED-EL default)
  - `fig3d.pickable` contacts → readout
- [ ] `fusion.js`: expose `model: { LISTENERS, center, half, P }` on the scene object (no frame change).
- [ ] `binaural.js` per §5.2: two cochleae, all `view:'3d'`, with `fig3d.controls` + `highlight` + `readout`, reusing `ASCII3D.get('fusion').model`.

**2E Atlas anatomy (Opus)** — Touch: `tools/atlas/anatomy.json`.
- [ ] Author every shape for the §5.3 plane and groups, iterating with `node tools/atlas.mjs preview` (light + dark + each group hovered).
- [ ] Proportions use adult textbook dimensions (mm, 1 unit = 1 mm). Sources go in `docs/atlas.md`.

**R2 — Sonnet ∥ Argon.**

### Wave 3 — Flash, 3 WPs in parallel

**3A Mount Figs 1–2 in 3D** — Touch: `index.html` (the two fig3d placeholders + script/css tags), `css/onepager.css` (fig3d sizing only), `images/figures/*` (generated).
- [ ] Fill `<figure data-fig3d="cochlea">` and `<figure data-fig3d="binaural">` per §4.3: a poster `<picture>` (light/dark), a controls slot (binaural), and the HUD.
- [ ] Load: `js/ascii3d.js` → `js/diagrams/fusion.js` → `cochlea.js` → `binaural.js` → `<script type="module" src="js/fig3d/loader.js">`.
- [ ] Captions (Opus supplies the text in §5.1/§5.2; Flash pastes it verbatim).
- [ ] `node tools/fig3d.mjs bake`, then stamp.
- Acceptance: the cochlea and binaural sections render in Chromium. The slider changes the readout. `smoke-pages` passes. `check-data` passes.

**3B Atlas bake + check wiring** — Touch: `atlas.html` (bake output only), `tools/check-data.mjs` (import `checkAtlas` and fig3d/egg checks; new section appended), `docs/atlas.md`.
- [ ] Bake the 2E anatomy.
- [ ] check-data additions:
  - **egg pairs:** every `data-egg="x"` has `#egg-x[data-a3d="x"].egg-figure` on the same page (Airway: in `js/airway/app.js`), and the reverse.
  - **fig3d:** every `data-fig3d` id is a defined scene, has both posters, and its page loads the engine, the scene and the loader in order.
  - **orphans:** the orphan-scene rule counts `data-fig3d` usage.
  - **atlas:** the atlas bake is fresh.
  - **unlisted pages:** `OLSB.html`, `ssb.html` and `atlas.html` carry `noindex`. No root `*.html` or `js/**` file links to `atlas.html`. `OLSB.html` and `ssb.html` are linked from no root page except `atlas.html`, and from no `js/**` file outside their own system.
- Acceptance: `check-data` passes. Each new rule is shown failing once by a deliberate local break (then reverted).

**3C Browser tests + CI (minimal, change-scoped; see Testing budget)** — Touch: `tools/test-figures.mjs` (new, with `--only eggs,fig3d,atlas`), `tools/smoke-pages.mjs` (add `atlas.html`, fig3d readiness, and an `--only <page>` flag), `.github/workflows/ci.yml` (one step, + a `figures` change flag), `docs/verification.md` (new section).
- [ ] Eggs:
  - a selection over "electrode" opens `#egg-cochlea`
  - a tap toggles it
  - Esc closes and refocuses the trigger
  - `aria-expanded` is correct
  - with JS disabled, every egg figure is visible
  - Airway: the egg survives a re-render
- [ ] Fig3d:
  - the poster is visible before the fold opens
  - a canvas appears after opening and `data-fig3d-ready` is set
  - theme flip re-colours it
  - binaural slider → the readout text changes
  - with WebGL blocked (`--disable-webgl`), the poster remains and there are no console errors
- [ ] Atlas:
  - hover → `.is-lit` on the group only
  - Tab order covers interactive groups
  - linked groups have the right `href`
  - no visible `<text>` in the SVG
- [ ] Unlisted: no inbound links (a crawl of root pages).
- Acceptance: `node tools/test-figures.mjs` passes locally. The CI YAML is valid.

**R3 — Sonnet ∥ Argon.**

### Wave 4

**4A Docs pass (Flash)** per `docs/docs-map.md`: `README.md` tree, `docs/wip.md` (figures, atlas, eggs, current state), `AGENTS.md` architecture (Figures: eggs + fig3d; Atlas; OLSB/SSB reachable only via atlas), `docs/diagrams.md`, `docs/decisions.md` (localStorage: none added; new page conventions), `docs/security.md` (fig3d dynamic import is same-origin).
**4B Opus checkpoint:** re-read the whole diff and run every suite (§6). Then hand the owner the vetting list:
- tonotopy numbers
- band assumption
- binaural schematic
- atlas anatomy (each group screenshot)
- CN VII course

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

- [ ] Every changed file is inside its WP's Touch list.
- [ ] Contracts in §4 are followed exactly.
- [ ] CSP: no inline `<script>`, no `on*=`, no remote origin. Airway still loads only same-origin files.
- [ ] Nothing from a URL or data file reaches `innerHTML` unescaped.
- [ ] `localStorage`/DOM access is guarded. Graceful degradation holds: no JS, no WebGL, reduced motion.
- [ ] Asset stamps are fresh. Bakes are fresh. No hand-edited baked block or stamp.
- [ ] ASCII frames of the egg scenes are unchanged by 1B (byte diff).
- [ ] Unlisted invariants hold: no link to `atlas.html`; OLSB/SSB are reachable only from the atlas; all three are `noindex`.
- [ ] Accessibility: triggers are focusable with `aria-expanded`; fig3d has alt text + `aria-live`; atlas groups are keyboard reachable.
- [ ] No anatomy or clinical claim was introduced by a Flash WP.
- [ ] Commits are one line with no trailers.

## 8. Owner checkpoints

1. After W0.3: fidelity log (any caption wording change).
2. After 2D/2E: posters + atlas previews (light/dark, each group lit).
3. After Wave 4: full vetting list (4B). Merge to `master` = deploy; only the owner merges.
