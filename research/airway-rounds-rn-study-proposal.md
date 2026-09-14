# Airway Rounds for Nursing Staff: A Pilot Study of Format-Dependent Knowledge and Comfort Gains in Head & Neck / Tracheostomy Airway Care

*Draft protocol / project plan — v0.1, 2026-09-14. Grounded in the existing `airway-jeopardy.html` question bank (200 items, 5 topics, 3 difficulty tiers) and its two delivery engines (team **Rounds** / solo **Quick Quiz**).*

---

## 1. Background & rationale

Tracheostomy and total-laryngectomy patients generate a disproportionate share of preventable inpatient airway deaths, and the **failure mode is almost always at the bedside, not the OR**: a nurse or first responder mistakes a **displaced** tube for an **obstructed** one, reinserts into a **false passage**, or places a **speaking valve over an inflated cuff**. The UK NCEPOD/NAP4 and NTSP work established that these events cluster on general floors where staff see trach patients infrequently, and that **structured, recurring education** — not one-off in-services — moves the needle.

The existing *Airway Rounds* tool encodes exactly this content: 40 items each across **Basics, Emergencies, Valves/Cuffs/Suctioning, Surgical Complications, and Daily Care/Prevention**, vetted against NTSP / ATS / AACN / StatPearls nursing guidance. Critically, it ships in **two interaction modes** that operationalize two distinct instructional theories:

- **Quick Quiz (solo)** — individual **active retrieval** (testing effect / retrieval practice).
- **Rounds (team Jeopardy)** — **facilitated, social, competitive** retrieval (collaborative learning, arousal/salience).

A third, lower-intensity condition is implied by the request — **self-guided perusal** of the same content (stems + answers + pearls read passively). This lets the study separate the *content* from the *act of retrieval* from the *social format*, which is the scientifically interesting question and the one most relevant to how a unit would actually deploy this.

### What this study can and cannot claim
This is a **single-site pilot / feasibility + preliminary-efficacy** study, not a definitive trial. The honest ceiling on the claim is: *does format modulate short-term knowledge and self-reported comfort, and is a larger trial worth running?* Retention beyond a few weeks, transfer to real airway events, and patient outcomes are **out of scope** and should not be implied by the design.

---

## 2. Specific aims & hypotheses

**Aim 1 (efficacy).** Quantify pre→post change in (a) **objective airway/emergency knowledge** and (b) **self-reported comfort/attitudes** after a single structured exposure to the Airway Rounds content.

**Aim 2 (format effect).** Compare the magnitude of those gains across three delivery formats: **passive self-guided perusal**, **solo active quiz**, and **facilitated group Rounds**.

**Aim 3 (feasibility & instrument performance).** Establish completion rates, time-on-task, item difficulty/discrimination for the assessment form, and the knowledge–comfort dissociation (does comfort rise faster than measured competence?).

**Primary hypothesis (H1).** Each floor shows a positive within-floor pre→post knowledge gain beyond the test–retest reference; and, at the descriptive/hypothesis-generating level, **the active-retrieval formats (solo quiz, group Rounds) produce larger gains than passive perusal** (a contrast the two-floor design can only *suggest*, not prove — §3.1).

**Secondary hypotheses.**
- **H2 (comfort ≠ competence).** Self-reported comfort increases in *all* exposed arms, including passive perusal, and its gain correlates only weakly with the knowledge gain — i.e., comfort partly tracks *exposure*, not *mastery* (a Dunning-Kruger / calibration concern, pre-registered as a caution, not a hoped-for result).
- **H3 (social salience).** Group Rounds shows the largest comfort gain but **not necessarily** the largest knowledge gain over solo quiz — dissociating affective from cognitive effects.

Pre-registering H2/H3 as *expected confounds* rather than as wins is deliberate: the point is to measure the knowledge–comfort gap, because a comfort-only intervention that leaves competence flat is a **patient-safety false reassurance**, mirroring the "the tube is in, so we're fine" error the content itself warns against.

---

## 3. Design

### 3.1 The site reality: two floors, and the confound it creates
Patients concentrate on **two RN floors — 6V (higher HN-oncology volume) and 7V.** These are the natural units, and the obvious plan is *floor = arm* (6V gets one format, 7V another). **That plan is structurally broken and must not be the basis of a format claim**, for one reason:

> With **one floor per arm (n = 2 clusters, 1 per arm), format is perfectly confounded with floor.** 6V and 7V differ in baseline exposure (6V sees more trach/laryngectomy patients), case mix, staffing, and unit culture. If 6V does solo-quiz and 7V does Rounds, any post-test difference is *format OR floor OR case-mix* with no way to separate them. This is not a power problem that a bigger N fixes, and not a bias that baseline-adjustment removes — it is **non-identifiability**. Two clusters cannot support cluster-level causal inference, full stop.

The user's instinct — *"then take each floor to the highest level"* — is the right escape hatch, because it points at using **each floor as its own control**. Below is the design that keeps the floors as the operational unit while recovering something causally interpretable.

### 3.2 What the two floors *can* cleanly answer
Reframe the estimands around what n = 2 floors actually identifies:

1. **Within-floor pre→post gain (primary, clean).** Each floor is differenced against *itself*, which removes every stable floor-level confounder (baseline knowledge, case mix, culture). "Did 6V improve after its intervention? Did 7V?" has strong internal validity for **whether the format does anything**.
2. **Baseline floor gap (secondary, directly measured).** The 6V−7V pre-test difference quantifies whether higher HN exposure predicts higher baseline trach knowledge, and in which domains. This is a genuine finding, not a nuisance.
3. **Convergence after both reach the ceiling (secondary).** When both floors receive Group Rounds in Phase 2, does the baseline gap close, persist, or invert? Convergence argues the gap was *baseline*, not *format-responsiveness*.

What it **cannot** clean answer is the head-to-head **format contrast** (B vs C) — that stays confounded with floor and is reported as **descriptive / hypothesis-generating only.**

### 3.3 Recommended design — alternated crossover, each floor its own control
A single-crossover (**stepped**) schedule that honors "pre both, different arms, then everyone to the top":

| Phase | 6V (high HN volume) | 7V | Assessment |
|---|---|---|---|
| **T0** | — pre-test — | — pre-test — | Form A or B (counterbalanced) |
| **Phase 1** | **Arm B — Solo Quiz** (active, solo) | **Arm A — Perusal** (passive, solo) | |
| **T1** | — post-test 1 — | — post-test 1 — | alternate form |
| **Phase 2** | **Arm C — Group Rounds** | **Arm C — Group Rounds** | (both reach the ceiling) |
| **T2** | — post-test 2 (+ 2–4 wk) — | — post-test 2 — | alternate form |

- **Phase-1 assignment** deliberately gives the higher-baseline floor (6V) the *stronger* solo format and the lower-baseline floor (7V) the *weaker* one, so a naïve between-floor comparison is **biased against** finding a Rounds benefit in Phase 2 — a conservative setup. (Swap if you'd rather bias the other way; the point is to pre-declare the direction.)
- **Phase-2 shared Rounds** delivers the "highest level for each," satisfies **equipoise** (everyone ends with the best content), and turns each floor into its own control for the *incremental* value of adding social retrieval on top of a solo Phase 1.
- **Waitlist reference for test–retest.** With only two floors there is no spare cluster for a pure no-treatment arm. Recover the maturation/regression estimate instead from a **small held-back cohort** (e.g., float/per-diem staff or a delayed-start subgroup) that takes T0 and T1 with **no** intervention between — even a handful quantifies how much the repeated test alone moves scores.

### 3.4 The upgrade, if a real format contrast is wanted
The only way to break the floor↔format confound with these two units is to **randomize *within* floor** — assign individual nurses or, better, **whole shifts/teams to Arm B vs Arm C inside each floor**, so every floor contributes both arms and floor becomes a balanced stratifying covariate rather than a confound. Cost: **within-floor contamination** (nurses on a shift talk), and the logistics of running two formats per floor. For a pilot this is often not worth it — but it is the *only* clean route to a causal B-vs-C estimate, so name it explicitly as the design a funded follow-on should adopt.

### 3.5 Arms (mechanism ladder)

| Arm | Format | Dose | Instructional mechanism isolated |
|---|---|---|---|
| **A. Perusal** | Self-guided reading of stems + answers + pearls (no scoring) | ~25–30 min, solo | Content exposure only |
| **B. Solo Quiz** | Quick Quiz mode, self-paced | ~25–30 min, solo | + individual active retrieval |
| **C. Group Rounds** | Facilitated Jeopardy Rounds, teams | ~45 min, facilitated | + social/competitive retrieval |

The **A→B→C ladder is intentional**: each adds one mechanism (content → retrieval → social), so a difference localizes *which* ingredient does the work.

**Blinding.** Participant/facilitator blinding is impossible (formats are overt). Mitigate with an **objective, machine-scored written knowledge outcome** and **analyst blinding** at scoring/analysis (floor + phase labels masked).

---

## 4. Population & setting

- **Target:** floor RNs on **6V** (higher HN-oncology volume) and **7V**, the two units that receive most HN-onc / trach / fresh-laryngectomy patients. Optionally include RN-adjacent bedside staff (RTs, PCTs), analyzed separately.
- **Inclusion:** provides care to trach/laryngectomy patients; consents.
- **Exclusion:** completed a formal trach course < 3 months prior (ceiling risk); float/agency staff (unless assigned to the held-back test–retest cohort). ENT/HN-specialized nurses whose baseline will ceiling out → **block separately** rather than exclude; their baseline is itself informative.
- **Covariates captured at T0:** floor (6V/7V), self-reported trach exposure frequency, years of experience, prior formal trach training. Baseline competence is strongly exposure-dependent, so these are measured and modeled (§7) — and the expected 6V > 7V baseline gap is a reported finding, not something to adjust away.

---

## 5. Outcomes & instruments

### 5.1 Primary — objective knowledge
A **written pre/post knowledge test**, scored objectively. Two design decisions matter more than any other in this protocol:

1. **The assessment items must be HELD OUT from the practice items.** If Arms B/C practice on the same 200 items the test draws from, the knowledge "gain" is contaminated by direct item memorization (teaching to the test), and passive Arm A is unfairly penalized because it saw the answers verbatim. **Split the bank into a practice pool and a locked assessment pool by blueprint**, so both cover the same *concepts* and difficulty mix but share no items. The bank's clean 5-topic × 3-difficulty structure makes this straightforward (e.g., reserve ~4–6 items/topic across difficulties as an assessment-only form; the remaining ~34–36/topic are the practice/intervention content).
2. **Use parallel forms A/B for pre vs. post**, counterbalanced, to blunt the item-specific practice effect on the test itself. The no-intervention held-back cohort (§3.3) quantifies whatever test–retest effect survives.

The **held-out, lethality-weighted blueprint and the specific item selection are built** in `airway-assessment-blueprint.md` (+ `airway-assessment-items.csv`): two 25-item parallel forms (concept twins, difficulty-matched), 50 items reserved for assessment, 150 left for practice. It over-weights **Emergencies (7/form) and Valves/Cuffs (5/form)** — the highest-lethality, highest-error domains (false passage, obstruction-vs-displacement, valve-over-inflated-cuff) — and reports **per-domain subscores**, since a floor-wide weakness in one domain is the actionable finding. Final form is frozen only after the instrument pilot's item statistics (§10).

> **Do NOT use the game's own score (points/steals/streak) as the knowledge outcome.** Rounds scoring is confounded by team dynamics, buzzer speed, wager strategy, and steal opportunism; it is an *engagement* signal at best. Cognitive outcome = the independent written test only.

### 5.2 Co-primary / secondary — attitudes & comfort (0–100 slider / VAS)
A **0–100 visual-analog slider** per stem (digitized as an integer 0–100), **not a Likert scale** — the continuous VAS gives more power, supports parametric analysis, and reads the comfort–competence gap more finely than a clumping 5-point Likert. The 12 stems mirror the knowledge blueprint domain-by-domain (so the calibration gap is computable *per domain*) and are specified in full in `airway-assessment-blueprint.md` §5, with anchors (`0 = not at all confident … 100 = completely confident`) and the VAS administration cautions (fixed anchor wording pre/post, frozen within-participant stem order, robustness to end-aggregation).

Anchor comfort to competence analytically: report the **calibration gap** = `z(comfort gain) − z(knowledge gain)` per participant and per domain. This operationalizes H2 and is arguably the most clinically important readout — a positive gap flags **intervention-induced overconfidence** (comfort rising faster than measured competence).

### 5.3 Feasibility / process
Completion rate, time-on-task, dropout by arm, facilitator burden for Rounds, participant-rated acceptability/NPS, and technical failure rate. **Item analysis** on the assessment form: difficulty (p), point-biserial discrimination, and internal consistency (KR-20 / Cronbach's α) — this doubles as validation of the assessment instrument for any future trial.

### 5.4 Timing
Pre-test (T0, immediately before) → intervention → **immediate post-test (T1)** → optional **delayed post-test (T2, 2–4 weeks)** for a first look at retention. T2 is where most edu-tech effects evaporate; even a small T2 sample is worth more than a large T1-only result, so prioritize it if resources are tight.

---

## 6. Instrumenting the tool for research (build work — currently a gap)

The tool as shipped **cannot produce analyzable per-participant data.** It writes only `localStorage['airway-rounds-history']` (last 10 sessions; date, winner, team scores, mode) — no participant ID, no per-item response, local to one browser, capped at 10, and mixing modes. Passive "perusal" (Arm A) has no logging at all.

Options, in ascending fidelity:

1. **Paper/e-form pre/post tests, tool used only as the intervention.** Zero code change; cleanest for the *knowledge* outcome; loses process telemetry. **Recommended for the pilot** — it decouples the science from a build task and keeps the assessment independent of the tool by construction.
2. **Add an opt-in research logger** to the engine: a per-session participant/arm code, per-item `{item_id, mode, chosen_idx, correct, latency_ms, difficulty}`, exported as CSV/JSON (or POSTed to a sheet). This is the right long-term instrument and enables **latency and per-item discrimination** analyses, but it is net-new code, needs consent/privacy handling, and — per repo conventions — **no new external dependency or credential** without owner sign-off (see `CLAUDE.md`; the tool is deliberately CDN-free and self-contained). A local CSV export keeps it dependency-free.
3. **A dedicated assessment page** (separate from the game) that serves the held-out form and records responses. Highest control; most build.

For a **feasibility pilot, use Option 1.** Reserve Option 2/3 for a funded follow-on. Whichever is chosen, the knowledge *assessment* should remain a held-out instrument, not the game's own scoring.

---

## 7. Analysis plan

The two-floor design (§3) means the **within-participant change score is the workhorse**, because it differences out the stable floor-level confounders that a between-floor comparison cannot.

- **Primary (H1, within-floor gain).** Per floor, paired pre→post analysis of total knowledge (T1−T0 and T2−T0). Mixed-effects model with a **random intercept for participant**, fixed effects for phase (T0/T1/T2) and floor, and baseline-exposure covariate; report adjusted mean gains + 95% CI **per floor per phase**. Each floor is its own control, so this is interpretable despite n = 2 clusters.
- **Baseline floor gap (secondary).** 6V vs 7V at T0, total and per-domain, with CI. Expected to favor 6V (higher HN volume); report it, don't adjust it away.
- **Incremental value of Rounds (secondary).** T2−T1 within each floor = the gain from adding Group Rounds on top of Phase 1. Convergence of the floor gap by T2 is evidence the gap was baseline, not format-responsiveness.
- **Format contrast (Aim 2) — descriptive only.** The Phase-1 B-vs-A difference is **confounded with floor** and reported as hypothesis-generating, never as a causal format effect. A clean causal contrast requires within-floor randomization (§3.4).
- **H2 calibration gap.** Per-participant `z(comfort gain) − z(knowledge gain)`, total and per domain; report the paired gap + CI and the comfort–knowledge correlation. A near-zero/negative correlation is the headline, not a nuisance.
- **Test–retest reference.** Estimate maturation/regression from the no-intervention held-back cohort (§3.3); subtract it from observed within-floor gains as a sensitivity analysis.
- **Item analysis.** *p*, point-biserial, KR-20 on the assessment form (also freezes the final form).
- **Missing data.** Complete-case for the pilot; multiple-imputation sensitivity if dropout > ~15%.

### Power / sample size — the honest part
Power this pilot to **estimate effect sizes and feasibility**, not to rank formats.

- Retrieval-practice effects on immediate post-tests are typically **medium-large (d ≈ 0.5–0.8)** — a within-floor pre→post *gain* is the well-powered comparison here (paired, within-subject), and even one floor of ~20–40 nurses can detect it.
- The **between-floor / format contrast is the underpowered, non-identified one** (§3.1): two clusters, one per Phase-1 arm, confounded with floor. No enrolled N fixes non-identifiability — say so up front rather than over-claim.

Recommendation: enroll what 6V + 7V realistically yield, **report per-floor gains, the baseline gap, the ICC, and effect sizes with CIs**, and use them to power a within-floor-randomized definitive trial. Treat every between-floor difference as hypothesis-generating.

---

## 8. Threats to validity (pre-registered, not discovered later)

| Threat | Mechanism | Mitigation |
|---|---|---|
| **Teaching to the test** | Practice items = test items → inflated, format-biased gains | Held-out assessment pool blueprinted to same concepts; parallel pre/post forms |
| **Floor ↔ format confound** | 1 floor per Phase-1 arm → format non-identifiable vs floor/case-mix | **Primary estimand = within-floor gain** (each floor its own control); B-vs-A reported descriptively only; within-floor randomization named as the definitive-trial fix (§3.4) |
| **Test–retest / maturation / regression to mean** | Two exposures to the assessment alone raise scores | No-intervention held-back cohort quantifies it (§3.3); within-floor change scores; baseline covariate |
| **Contamination** | RNs on a floor share answers | Brief exposure window; phase-level scheduling; held-out assessment items never practiced |
| **Ceiling effects** | ENT/ICU-experienced nurses start high | Block by exposure; expect 6V ceiling higher — read per-domain; difficulty-balanced form |
| **Comfort ≠ competence** | Self-report inflates with mere exposure | Objective co-primary; VAS calibration gap (H2) |
| **Hawthorne / demand** | Group Rounds is fun → inflated self-report | Objective knowledge outcome; analyst-blinded scoring |
| **Selection / volunteer bias** | Motivated nurses opt in | Report enrollment fraction; enroll whole floors, not self-select |
| **Assessment ≠ transfer** | Written score ≠ bedside performance | Explicitly scope out; name simulation/OSCE as the next study, not this one |
| **Order / carryover (crossover)** | Phase-2 Rounds gain contaminated by Phase-1 exposure | T2−T1 read as *incremental* only; counterbalanced test forms; pre-declared Phase-1 assignment direction |

---

## 9. Ethics & data

- Likely **IRB quality-improvement / education-research exemption or expedited** review; confirm locally. Staff are the subjects, not patients — but staff-competence data is sensitive (implications for performance evaluation), so **de-identify to arm+cluster codes**, keep the linkage log separate, and firewall results from management/HR use. State this in consent.
- No PHI. If Option 2 logging is built, store responses **locally / in an owner-controlled sheet**, no third-party analytics, consistent with the repo's no-credential / no-external-dependency stance.
- Both floors receive the (highest-intensity) Group Rounds session in Phase 2 — equipoise-preserving; no floor is denied the best content.

---

## 10. Timeline (indicative)

1. **Weeks 0–3.** Blueprint + item split already drafted (`airway-assessment-blueprint.md`); finalize the two forms and the VAS comfort scale; IRB submission; facilitator script for Rounds; recruit the no-intervention held-back cohort.
2. **Weeks 3–5.** Pilot the *instrument* on 5–10 nurses (item analysis, timing, comprehension) — freeze the forms; fix bad items before the real run.
3. **Weeks 5–10.** T0 both floors → Phase-1 arms (6V solo-quiz, 7V perusal) → T1.
4. **Weeks 10–14.** Phase-2 Group Rounds both floors → T2 (retention, +2–4 wk).
5. **Weeks 14–18.** Analysis, item validation, write-up; decide go/no-go and powering for a within-floor-randomized definitive trial.

---

## 11. What we can glean from the tool as-is (asset summary)

- **A vetted, blueprint-structured 200-item bank** already partitioned by domain and difficulty — the scaffolding for held-out parallel forms with minimal authoring.
- **Two ready-made intervention formats** (solo Quick Quiz, group Rounds) that cleanly instantiate the active-solo and active-social arms; passive perusal is trivially derived from the same content.
- **Domain coverage matched to the actual lethal error set** (obstruction vs. displacement, false passage, valve-over-cuff, expanding neck hematoma, free-flap venous congestion), so the assessment blueprint can be lethality-weighted with existing material.
- **Gaps to close before it is research-grade:** no per-participant/per-item logging, no participant identity, local-only capped history, and game scoring that is an engagement — not knowledge — metric. Handle by keeping assessment independent of the tool (Option 1) for the pilot.

---

### One-line summary
A **two-floor (6V/7V) alternated-crossover pilot** — pre-test both, different Phase-1 formats (solo-quiz vs perusal), then both to Group Rounds — analyzed as **within-floor pre→post gains** (each floor its own control, because 1-floor-per-arm makes any between-floor format claim non-identifiable), with a **held-out, lethality-weighted 25-item knowledge test** (two parallel forms) and a **0–100 VAS comfort scale**, built above all to measure the **knowledge–comfort calibration gap** and to yield the effect sizes needed to power a within-floor-randomized definitive trial — using the Airway Rounds bank as the intervention, not the yardstick.
