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

**Primary hypothesis (H1).** All three formats produce a positive pre→post knowledge gain vs. a waitlist reference; **the two active-retrieval formats (solo quiz, group Rounds) outperform passive perusal** on the knowledge outcome.

**Secondary hypotheses.**
- **H2 (comfort ≠ competence).** Self-reported comfort increases in *all* exposed arms, including passive perusal, and its gain correlates only weakly with the knowledge gain — i.e., comfort partly tracks *exposure*, not *mastery* (a Dunning-Kruger / calibration concern, pre-registered as a caution, not a hoped-for result).
- **H3 (social salience).** Group Rounds shows the largest comfort gain but **not necessarily** the largest knowledge gain over solo quiz — dissociating affective from cognitive effects.

Pre-registering H2/H3 as *expected confounds* rather than as wins is deliberate: the point is to measure the knowledge–comfort gap, because a comfort-only intervention that leaves competence flat is a **patient-safety false reassurance**, mirroring the "the tube is in, so we're fine" error the content itself warns against.

---

## 3. Design

**Type.** Prospective, **cluster-randomized** (randomize at the *unit/shift* level to limit within-unit contamination), pre/post, with a **delayed-treatment waitlist control**. Parallel four-arm.

**Why cluster, not individual.** RNs on a shared unit discuss cases in real time; individual randomization within a unit guarantees cross-arm contamination and dilutes the format contrast toward null. Randomizing intact units/shifts to a format trades statistical efficiency (design effect from intraclass correlation) for internal validity. This is the correct trade for the format question; it must be **planned for in the power calculation** (see §7), not discovered afterward.

### Arms

| Arm | Format | Dose | Instructional mechanism isolated |
|---|---|---|---|
| **A. Perusal** | Self-guided reading of stems + answers + pearls (no scoring) | ~25–30 min, solo | Content exposure only |
| **B. Solo Quiz** | Quick Quiz mode, self-paced | ~25–30 min, solo | + individual active retrieval |
| **C. Group Rounds** | Facilitated Jeopardy Rounds, teams | ~45 min, facilitated | + social/competitive retrieval |
| **D. Waitlist control** | No intervention until after post-test; receives Rounds afterward (ethics) | — | Reference for test–retest / maturation |

The **A→B→C ladder is intentional**: each arm adds one mechanism (content → retrieval → social), so differences localize *which* ingredient does the work. D isolates the **pure test–retest / maturation / regression-to-the-mean** effect of taking the assessment twice — without it, all gains are confounded by the assessment itself.

**Blinding.** Participant/facilitator blinding is impossible (formats are overt). Mitigate with an **objective, machine-scored written knowledge outcome** and **analyst blinding** at scoring/analysis (arm labels masked).

---

## 4. Population & setting

- **Target:** RNs and, if desired, RN-adjacent bedside staff (RTs, PCTs) on units that receive HN-onc / trach / fresh-laryngectomy patients — SICU/step-down, HN/ENT floor, PACU, ED.
- **Inclusion:** provides care to trach/laryngectomy patients; consents.
- **Exclusion:** completed a formal trach course < 3 months prior (ceiling risk); ENT/HN-specialized nurses whose baseline will ceiling out (or **stratify** them as a separate block rather than exclude — their baseline is itself informative).
- **Stratification/blocking:** by unit acuity (ICU vs. floor) and self-reported trach exposure frequency, because baseline competence is strongly exposure-dependent and unbalanced baselines will masquerade as format effects.

---

## 5. Outcomes & instruments

### 5.1 Primary — objective knowledge
A **written pre/post knowledge test**, scored objectively. Two design decisions matter more than any other in this protocol:

1. **The assessment items must be HELD OUT from the practice items.** If Arms B/C practice on the same 200 items the test draws from, the knowledge "gain" is contaminated by direct item memorization (teaching to the test), and passive Arm A is unfairly penalized because it saw the answers verbatim. **Split the bank into a practice pool and a locked assessment pool by blueprint**, so both cover the same *concepts* and difficulty mix but share no items. The bank's clean 5-topic × 3-difficulty structure makes this straightforward (e.g., reserve ~4–6 items/topic across difficulties as an assessment-only form; the remaining ~34–36/topic are the practice/intervention content).
2. **Use parallel forms A/B for pre vs. post**, counterbalanced, to blunt the item-specific practice effect on the test itself. Waitlist Arm D quantifies whatever test–retest effect survives.

Blueprint the assessment to **over-weight Emergencies and Valves/Cuffs** — the highest-lethality, highest-error domains (false passage, obstruction-vs-displacement discrimination, valve-over-inflated-cuff). Report **per-domain subscores**, not just total, because a floor-wide weakness in one domain is the actionable finding.

> **Do NOT use the game's own score (points/steals/streak) as the knowledge outcome.** Rounds scoring is confounded by team dynamics, buzzer speed, wager strategy, and steal opportunism; it is an *engagement* signal at best. Cognitive outcome = the independent written test only.

### 5.2 Co-primary / secondary — attitudes & comfort (self-efficacy)
A short **Likert self-efficacy / comfort scale** (e.g., 5-point, ~10–15 stems) mirroring the knowledge blueprint: "I can confidently distinguish an obstructed from a displaced trach," "I know why a speaking valve is dangerous with an inflated cuff," "I feel prepared to respond to a stoma emergency on my shift." Include **general attitude items** (perceived relevance, willingness to escalate, comfort caring for laryngectomy patients).

Anchor comfort to competence analytically: report the **calibration gap** = (standardized comfort gain − standardized knowledge gain) per participant. This operationalizes H2 and is arguably the most clinically important readout — a positive gap flags **overconfidence induced by the intervention**.

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

- **Primary (H1).** Mixed-effects model on post-test knowledge with pre-test as covariate (ANCOVA framing), **random intercept for cluster (unit/shift)** to honor the cluster randomization, fixed effect for arm, stratification covariates (baseline exposure, unit acuity). Report adjusted mean gains + 95% CI per arm and the pairwise contrasts of interest (**B vs A, C vs B, {B,C} vs A**), not an omnibus F alone.
- **Format contrast (Aim 2).** Pre-planned contrasts as above; correct for multiplicity across the *primary* contrasts only.
- **H2 calibration gap.** Per-participant standardized comfort gain vs knowledge gain; report correlation and the paired gap with CI. A near-zero or negative correlation is the headline, not a nuisance.
- **Item analysis.** p, point-biserial, KR-20 on the assessment form.
- **Missing data.** Pre-specify: complete-case for the pilot, sensitivity with multiple imputation if dropout > ~15%.

### Power / sample size — the honest part
This is a **pilot**; power it to **estimate effect sizes and feasibility**, not to definitively rank formats. Two forces fight each other:

- Retrieval-practice effects on immediate post-tests are typically **medium-large (d ≈ 0.5–0.8)**, which is encouraging.
- **Cluster randomization inflates the required N** by the design effect `1 + (m−1)·ICC`. With even a modest ICC (0.05–0.10) and clusters of, say, 8–12 nurses, the effective N is a fraction of the enrolled N. A pilot with a handful of units **will not** have power to resolve B-vs-C reliably, and the protocol should **say so up front** rather than over-claim.

Recommendation: enroll what the site realistically yields (e.g., 4–8 clusters/arm where feasible), **report the observed ICC and effect sizes with CIs**, and use them to power the definitive trial. Frame any B-vs-C difference in the pilot as hypothesis-generating.

---

## 8. Threats to validity (pre-registered, not discovered later)

| Threat | Mechanism | Mitigation |
|---|---|---|
| **Teaching to the test** | Practice items = test items → inflated, format-biased gains | Held-out assessment pool blueprinted to same concepts; parallel pre/post forms |
| **Test–retest / maturation / regression to mean** | Two exposures to the assessment alone raise scores | Waitlist Arm D quantifies it; ANCOVA on pre-test |
| **Contamination** | RNs on a unit share answers across arms | Cluster randomization; brief window; unit-level scheduling |
| **Ceiling effects** | ENT/ICU-experienced nurses start high | Stratify/block by exposure; over-sample floor staff; difficulty-balanced form |
| **Comfort ≠ competence** | Self-report inflates with mere exposure | Objective co-primary; report calibration gap (H2) |
| **Hawthorne / demand** | Group Rounds is fun → inflated self-report | Objective knowledge outcome; analyst-blinded scoring |
| **Selection / volunteer bias** | Motivated nurses opt in | Report enrollment fraction; enroll at unit level, not self-select |
| **Assessment ≠ transfer** | Written score ≠ bedside performance | Explicitly scope out; name simulation/OSCE as the next study, not this one |
| **Small-N cluster design** | Underpowered for B-vs-C | Frame as pilot; report ICC + effect sizes for future powering |

---

## 9. Ethics & data

- Likely **IRB quality-improvement / education-research exemption or expedited** review; confirm locally. Staff are the subjects, not patients — but staff-competence data is sensitive (implications for performance evaluation), so **de-identify to arm+cluster codes**, keep the linkage log separate, and firewall results from management/HR use. State this in consent.
- No PHI. If Option 2 logging is built, store responses **locally / in an owner-controlled sheet**, no third-party analytics, consistent with the repo's no-credential / no-external-dependency stance.
- Waitlist Arm D receives the (highest-intensity) Rounds session after post-testing — equipoise-preserving.

---

## 10. Timeline (indicative)

1. **Weeks 0–3.** Finalize blueprint; split bank into practice vs. held-out assessment pool; build parallel pre/post forms; draft comfort scale; IRB submission; facilitator script for Rounds.
2. **Weeks 3–5.** Pilot the *instrument* on 5–10 nurses (item analysis, timing, comprehension) — fix bad items before the real run.
3. **Weeks 5–10.** Cluster randomize units/shifts; run arms; collect T0/T1.
4. **Weeks 10–14.** Delayed T2 (retention) where feasible.
5. **Weeks 14–18.** Analysis, item validation, write-up; decide go/no-go and powering for a definitive multi-site trial.

---

## 11. What we can glean from the tool as-is (asset summary)

- **A vetted, blueprint-structured 200-item bank** already partitioned by domain and difficulty — the scaffolding for held-out parallel forms with minimal authoring.
- **Two ready-made intervention formats** (solo Quick Quiz, group Rounds) that cleanly instantiate the active-solo and active-social arms; passive perusal is trivially derived from the same content.
- **Domain coverage matched to the actual lethal error set** (obstruction vs. displacement, false passage, valve-over-cuff, expanding neck hematoma, free-flap venous congestion), so the assessment blueprint can be lethality-weighted with existing material.
- **Gaps to close before it is research-grade:** no per-participant/per-item logging, no participant identity, local-only capped history, and game scoring that is an engagement — not knowledge — metric. Handle by keeping assessment independent of the tool (Option 1) for the pilot.

---

### One-line summary
A four-arm, cluster-randomized pilot (**perusal / solo-quiz / group-Rounds / waitlist**) with a **held-out, blueprint-matched objective knowledge test** and a **paired comfort scale**, designed above all to measure the **knowledge–comfort calibration gap** and to produce the ICC and effect-size estimates needed to power a real trial — using the existing Airway Rounds bank as the intervention, not as the yardstick.
