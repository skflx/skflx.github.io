# Airway Rounds — Held-Out Assessment Blueprint & Item Map

*Companion to `airway-rounds-rn-study-proposal.md`. v0.1, 2026-09-14. Item IDs reference `js/airway-questions.js` (200-item bank). Machine-readable export: `airway-assessment-items.csv`.*

---

## 1. Design constraints this blueprint satisfies

1. **Held out from practice.** The 50 items below are pulled from the bank and **reserved for assessment only**. The intervention (perusal / Quick Quiz / Rounds) draws from the remaining **150** items. No participant ever practices on a scored item, so a "gain" cannot be direct item memorization, and the passive-perusal arm is not penalized for having read the answers verbatim.
2. **Two parallel forms, counterbalanced.** Form A and Form B are **concept-parallel** (each concept twin appears once per form) and **difficulty-matched** in aggregate (A: 11E/6M/8H; B: 10E/6M/9H). Randomize which form is pre vs. post per participant, so any residual form-difficulty gap washes out across the sample and cannot masquerade as a treatment effect.
3. **Lethality-weighted.** Item counts per domain track the domain's **bedside lethality × error frequency**, not equal coverage. The blueprint over-weights the domains where a wrong RN action kills fastest.

---

## 2. Lethality tiering (the weighting rationale)

Weighting is by the **lethal error the item guards against**, not by domain size. Each domain contributes 40 bank items regardless; the assessment samples them unequally.

| Tier | Definition | Domains (assessment weight) | Exemplar lethal error tested |
|---|---|---|---|
| **1 — Immediate airway-lethal, high-frequency error** | Wrong action → hypoxic arrest in minutes; the error is *common* on a general floor | **Emergencies** (7/form) · **Valves/Cuffs** (5/form) · **Basics** O2-route subset (4/form) | Reinsert fresh trach into a false passage; speaking valve over an inflated cuff; face O2 on a total neck breather |
| **2 — Rapidly lethal, lower-frequency** | Kills fast but the event is rarer; RN role is recognition + first temporizing maneuver | **Complications** — vascular catastrophes (5/form) | Miss an expanding neck hematoma; fail to compress/hyperinflate a tracheo-innominate bleed |
| **3 — Prevention substrate / subacute** | Lower immediate lethality; prevents Tier-1 events downstream, or fails silently | **Daily Care** (4/form) | Mucus plug behind a normal SpO₂; silent aspiration past an inflated cuff |

**Why not equal 5-per-domain?** Equal coverage would spend the same assessment budget on daily-hygiene recall as on false-passage discrimination. A lethality-weighted form makes the **total score itself safety-meaningful** and concentrates measurement precision where a real event would kill a patient. The trade-off — under-sampling low-lethality prevention content — is acceptable for a *safety* endpoint; per-domain subscores (§4) still let you read the prevention domain separately.

### Per-form blueprint (each form = 25 items)

| Domain | Tier | Items/form | Difficulty mix (target) | Concepts sampled |
|---|---|---|---|---|
| Emergencies | 1 | **7** | ~2E / 2–3M / 2–3H | failure modes · removal sequence · catheter+capnography interpretation · fresh-trach false passage · false-passage recognition · laryngectomy Red-algorithm O2 route · displacement-vs-obstruction lethality |
| Valves/Cuffs/Suctioning | 1 | **5** | ~2E / 1M / 2–3H | cuff-down prerequisite · **valve-over-inflated-cuff physiology** · valve contraindicated post-laryngectomy · cuff-pressure measurement · suction-induced bradycardia/hypoxia |
| Basics (O2-route subset) | 1 | **4** | ~3E / 1M | partial vs total neck breather · desaturation O2 route · unsure-which safest action · laryngectomy ventilation anatomy |
| Complications | 2 | **5** | ~3E / 1–2M / 0–1H | expanding neck hematoma · tracheo-innominate fistula temporizing · sentinel bleed / carotid blowout · free-flap venous vs arterial · subcutaneous emphysema red flag |
| Daily Care/Prevention | 3 | **4** | ~1E / 3H | humidification/plug prevention · silent deterioration & scheduled checks · silent aspiration / swallow safety · bedside emergency preparedness |
| **Total** | | **25** | **~11E / 6M / 8H** | |

---

## 3. Item map (Form A / Form B twins)

Each row is a **concept twin**: the Form A item and Form B item test the same idea at comparable depth. Full stems + choices are in `airway-assessment-items.csv`.

| # | Domain (tier) | Concept | Form A | Form B |
|---|---|---|---|---|
| 1 | Emergencies (1) | Two failure modes (obstruction vs displacement) | `em-01` | `em-02` |
| 2 | Emergencies (1) | Removal-sequence rationale (valve→cannula→suction) | `em-16` | `em-15` |
| 3 | Emergencies (1) | Catheter/ventilation interpretation | `em-07` | `em-18` |
| 4 | Emergencies (1) | Fresh trach — do not force back (false passage) | `em-22` | `em-13` |
| 5 | Emergencies (1) | False passage: danger & neck-crepitus recognition | `em-29` | `em-30` |
| 6 | Emergencies (1) | Laryngectomy O2 route / NTSP Red algorithm | `em-20` | `em-38` |
| 7 | Emergencies (1) | Displacement lethality / capnography discrimination | `em-39` | `em-31` |
| 8 | Valves (1) | Speaking-valve prerequisite: cuff fully down | `va-03` | `va-04` |
| 9 | Valves (1) | **Valve-over-inflated-cuff physiology** | `va-06` | `va-05` |
| 10 | Valves (1) | Valve contraindicated after total laryngectomy | `va-07` | `va-08` |
| 11 | Valves (1) | Cuff pressure: measure, never habituate | `va-22` | `va-17` |
| 12 | Valves (1) | Suction-induced bradycardia / hypoxia | `va-34` | `va-33` |
| 13 | Basics (1) | Partial vs total neck breather | `ba-01` | `ba-02` |
| 14 | Basics (1) | Desaturation → correct O2 route | `ba-03` | `ba-04` |
| 15 | Basics (1) | Unsure trach vs laryngectomy → safest action | `ba-06` | `ba-05` |
| 16 | Basics (1) | Laryngectomy ventilation anatomy | `ba-17` | `ba-18` |
| 17 | Complications (2) | Expanding neck hematoma → airway | `co-04` | `co-01` |
| 18 | Complications (2) | Tracheo-innominate fistula: temporize | `co-21` | `co-24` |
| 19 | Complications (2) | Sentinel bleed / carotid blowout | `co-19` | `co-17` |
| 20 | Complications (2) | Free-flap venous vs arterial compromise | `co-06` | `co-07` |
| 21 | Complications (2) | Subcutaneous emphysema as red flag | `co-33` | `co-34` |
| 22 | Daily (3) | Humidification / mucus-plug prevention | `da-04` | `da-07` |
| 23 | Daily (3) | Silent deterioration / scheduled checks | `da-19` | `da-08` |
| 24 | Daily (3) | Silent aspiration / swallow safety | `da-33` | `da-34` |
| 25 | Daily (3) | Bedside emergency preparedness | `da-39` | `da-10` |

**Practice/intervention pool = the other 150 items** (everything not listed above). It retains full domain coverage, so perusal/quiz/Rounds still teach the whole content.

---

## 4. Scoring & item-analysis plan

- **Total score** (0–25) is the primary knowledge endpoint — safety-weighted by construction.
- **Per-domain subscores** reported always; a floor-wide weakness in one domain (e.g., Valves) is the actionable finding, invisible in the total.
- **Item statistics from the pilot decide the final form.** Difficulty labels here are the game's *Intern/Resident/Attending* pips, **not** psychometric difficulty. After the instrument pilot (proposal §10, step 2) compute per-item difficulty (*p*), point-biserial discrimination, and KR-20/α; **drop or swap** any item with *p* > 0.95 (ceiling), *p* < 0.15 (floor/miskeyed), or point-biserial < 0.15. Treat this 50-item set as the **candidate pool**, not the frozen form — the twins give you replacement flexibility within concept.
- **Shuffle choices at render.** The bank stores `choices[0]` as correct; randomize option order per administration (the engine's `quiz.buildChoices` already does this) so position is not a cue.
- **Do not reuse the game score** as the knowledge outcome — see proposal §5.1.

---

## 5. Attitudes / comfort instrument — 0–100 slider (VAS)

Replaces the earlier Likert plan with a **0–100 visual-analog slider** per stem (digitized as an integer 0–100). Rationale: a VAS yields **continuous, near-interval data** — more statistical power, parametric analysis, and a finer read on the comfort–competence gap than a 5-point Likert, which floors/ceilings and clumps.

**Anchors (fixed, both ends labeled, no mid-tick labels):**
`0 = "Not at all confident / strongly disagree"` … `100 = "Completely confident / strongly agree"`.

**Administration notes (to reduce VAS artefact):**
- Present the slider **without a numeric readout to the respondent** where feasible (or start the handle unset/centered), to avoid anchoring on a displayed number; capture the underlying 0–100 value on the back end.
- Keep the **same anchor wording and stem order** pre and post; VAS is sensitive to re-anchoring.
- Randomize stem order across participants but **freeze it within a participant** (pre = post order) so the pre/post difference is within-item.
- A slider's endpoints attract responses (**end-aggregation**); analyze with methods robust to boundary clustering (e.g., report medians + rank-based tests alongside means) and inspect the distribution before assuming normality.

### Comfort/self-efficacy stems (mirror the knowledge blueprint)

Each maps to a knowledge domain so the **calibration gap** (comfort − knowledge, standardized) is computable per domain, not just overall.

| # | Domain mirror | Stem (rate 0–100) |
|---|---|---|
| S1 | Basics | "I can tell, for a given patient, whether they are a partial or total neck breather and what that means for oxygenating them." |
| S2 | Emergencies | "If a tracheostomy patient became distressed on my shift, I could work through the emergency steps in the right order without stopping to look it up." |
| S3 | Emergencies | "I can distinguish an **obstructed** tube from a **displaced** one at the bedside." |
| S4 | Emergencies | "I know why a dislodged **fresh** tracheostomy should not be pushed back in blindly." |
| S5 | Valves | "I can state the one absolute check before placing a speaking valve, and why the valve is dangerous if it is skipped." |
| S6 | Valves | "I am comfortable managing cuff pressure and suctioning without causing harm." |
| S7 | Complications | "I would recognize an expanding neck hematoma early and know the first things to do." |
| S8 | Complications | "I would recognize a herald/sentinel bleed and a tracheo-innominate bleed, and know the first temporizing maneuver." |
| S9 | Daily/Basics | "I feel prepared to care for a **total laryngectomy** patient specifically." |
| S10 | Global attitude | "Caring for tracheostomy/laryngectomy patients feels within my competence rather than something I dread." |
| S11 | Global attitude | "I know when and how quickly to escalate a neck-airway concern, even when the vital signs still look okay." |
| S12 | Global attitude | "Structured airway teaching like this is worth my time on the unit." *(acceptability, not self-efficacy — analyze separately.)* |

**Calibration-gap readout (the headline).** Per participant, per domain: `z(comfort gain) − z(knowledge gain)`. A **positive gap = intervention-induced overconfidence** — comfort rose faster than measured competence. Flagging this is the point, not a nuisance: a comfort-only effect is the same false reassurance ("the tube's in, so we're fine") the content itself warns against. Expect passive perusal to show the largest positive gap and group Rounds the largest comfort gain overall; pre-register both as **expected**, not as wins.

---

## 6. What still needs a human decision

- **Final form length.** 25 items/form is a defensible pre+post load (~15–20 min each). If floor time is tighter, the lethality weighting says **cut from Daily (tier 3) first, then Complications**, never from Emergencies/Valves.
- **Answer format.** These are the bank's 4-option MCQs. If you want a harder, less-cued knowledge measure, a subset could be re-authored as short-answer/script-concordance — but that adds scoring burden and inter-rater work. MCQ is the pragmatic pilot choice.
- **Instrument pilot is not optional.** Freeze the forms only *after* the ~5–10-nurse item-analysis run (proposal §10, step 2).
