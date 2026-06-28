/* =============================================================
   Differentiated Thyroid Cancer — 2025 ATA Guidelines
   Socratic self-test (free-response / recall) on the operative
   approach, completion, histopathology & risk stratification:
   Recommendations 15, 16, 27, 28 with Tables 5–7 cross-refs.
   Free-response module: every item is type 'recall' — read the
   prompt, commit to an answer, reveal, then self-grade.
   ============================================================= */
const meta = {
  id: 'dtc-risk-stratification',
  title: 'Differentiated\nThyroid Cancer',
  subtitle: 'A sequential-dependency self-test on operative approach, completion thyroidectomy, histopathology, and the 2025 ATA Risk Stratification System (Rec 15, 16, 27, 28). Each answer becomes load-bearing for the next.',
  kicker: 'Self-Test · 2025 ATA Rec 15/16/27/28',
};

const DOMAINS = {
  staging: { label: 'AJCC / TNM Staging', color: '#2C5454', hex: 'rgba(44,84,84,0.14)' },
  operative: { label: 'Operative Approach (Rec 15)', color: '#A0635E', hex: 'rgba(160,99,94,0.14)' },
  completion: { label: 'Completion (Rec 16)', color: '#5C4F7B', hex: 'rgba(92,79,123,0.14)' },
  pathology: { label: 'Histopathology (Rec 27)', color: '#7B7B4A', hex: 'rgba(123,123,74,0.14)' },
  riskStrat: { label: 'Risk Stratification (Rec 28)', color: '#7B5C3A', hex: 'rgba(123,92,58,0.14)' },
  controversy: { label: 'Controversy Stress-Test', color: '#8B4513', hex: 'rgba(139,69,19,0.14)' },
};

const CONCEPTS = {
  't-category': { label: 'T Categories', domain: 'staging' },
  'age-pivot': { label: 'Age 55 Pivot', domain: 'staging' },
  'downstaging': { label: '8th-Ed Downstaging', domain: 'staging' },
  'nodal-class': { label: 'N1a vs N1b', domain: 'staging' },
  'lobectomy': { label: 'Lobectomy', domain: 'operative' },
  'total-thyroidectomy': { label: 'Total Thyroidectomy', domain: 'operative' },
  'gross-ete': { label: 'Gross ETE', domain: 'operative' },
  'rai': { label: 'RAI Rationale', domain: 'operative' },
  'conversion-rate': { label: '~20% Conversion', domain: 'operative' },
  'completion-indications': { label: 'Completion Indications', domain: 'completion' },
  'rln': { label: 'RLN / Surgical Safety', domain: 'completion' },
  'nodal-completion': { label: 'Nodes & Completion', domain: 'completion' },
  'micro-ete': { label: 'Microscopic ETE', domain: 'pathology' },
  'path-report': { label: 'Path Report Elements', domain: 'pathology' },
  'subtype': { label: 'Histologic Subtypes', domain: 'pathology' },
  'familial': { label: 'Familial Syndromes', domain: 'pathology' },
  'niftp': { label: 'NIFTP / IEFVPTC', domain: 'pathology' },
  'ata-system': { label: 'ATA vs AJCC', domain: 'riskStrat' },
  'ata-tiers': { label: '3-Tier Recurrence', domain: 'riskStrat' },
  'focality': { label: 'Multifocality', domain: 'riskStrat' },
  'vascular-invasion': { label: 'Vascular Invasion', domain: 'riskStrat' },
  'nodal-risk': { label: 'Nodal Risk Params', domain: 'riskStrat' },
  'molecular': { label: 'Molecular Profiling', domain: 'riskStrat' },
  'case': { label: 'Integrated Case', domain: 'riskStrat' },
  'controversy': { label: 'Points of Contention', domain: 'controversy' },
};

const ITEMS = [
  {
    id: 'q1',
    type: 'recall',
    section: 'Foundations · AJCC',
    stem: 'Foundation — the T-category cutoffs. For a tumor confined to the thyroid (no ETE), state the size boundaries separating T1a, T1b, T2, and T3a. Then add the two extension-defined categories (T3b / T4).',
    answer: `Size-defined, intrathyroidal:
• T1a — ≤1 cm, limited to thyroid
• T1b — >1 cm but ≤2 cm, limited to thyroid
• T2 — >2 cm but ≤4 cm, limited to thyroid
• T3a — >4 cm, limited to thyroid (new 8th-edition category)

Extension-defined (size-independent):
• T3b — gross ETE invading ONLY strap muscles (sternohyoid, sternothyroid, thyrohyoid, omohyoid), any size (new category)
• T4a — gross ETE into subcutaneous soft tissue, larynx, trachea, esophagus, or recurrent laryngeal nerve
• T4b — gross ETE invading prevertebral fascia, or encasing carotid / mediastinal vessels`,
    brief: 'The 8th edition split the old "T3" into a SIZE arm (T3a) and an EXTENSION arm (T3b). T3a is just a big intrathyroidal tumor — size alone is a weak driver of management compared with extension and nodal status.',
    concepts: ['t-category'],
  },
  {
    id: 'q2',
    type: 'recall',
    section: 'Foundations · AJCC',
    stem: 'The age pivot with no analogue in other cancers. State (a) the old vs new age cutoff, (b) the maximum stage for a patient BELOW the cutoff regardless of T/N, and (c) why distant metastasis in an older patient lands at Stage IVB rather than IVC.',
    answer: `(a) Age cutoff raised from 45 → 55 years (8th edition, Change A).

(b) A patient <55 years can only ever be Stage I (M0) or Stage II (M1) — no T or N finding pushes them past Stage II. N1 disease does NOT upstage a young patient; in the <55 group, N1 is Stage I.

(c) In DTC, distant mets in an OLDER patient = Stage IVB (Change G). Stage IVC is reserved for ANAPLASTIC distant mets — so the most advanced a differentiated cancer reaches is IVB.`,
    brief: 'Stage predicts disease-specific SURVIVAL; it does NOT predict structural recurrence. Hold that distinction — it is the entire reason Rec 28 exists.',
    detailed: '20–30% of patients are downstaged moving 7th → 8th edition; roughly half from the age change and half from tumor-characteristic changes (e.g., microscopic ETE no longer counting). Critically, patients downstaged because of tumor characteristics carried a HIGHER recurrence risk than those downstaged purely by age.',
    concepts: ['age-pivot', 'downstaging'],
  },
  {
    id: 'q3',
    type: 'recall',
    section: 'Foundations · AJCC',
    stem: 'One nodal reclassification you will be asked about. Which level moved, what was it before, what is it now, and what is the N1a vs N1b distinction?',
    answer: `Level VII nodes (superior mediastinal) were previously classified as lateral neck (N1b) and are now reclassified as central neck (N1a) (Change F).

• N1a = metastasis to level VI or VII (pretracheal, paratracheal, prelaryngeal/Delphian, upper mediastinal); unilateral or bilateral.
• N1b = metastasis to unilateral, bilateral, or contralateral lateral neck (levels I–V) or retropharyngeal nodes.`,
    brief: '"Central compartment" now extends down into the superior mediastinum — it changes how you count compartments when reading an operative/path report.',
    concepts: ['nodal-class'],
  },
  {
    id: 'q4',
    type: 'recall',
    section: 'Rec 15 · Operative',
    stem: 'Rec 15A — the small-tumor default. For thyroid cancer ≤2 cm without gross ETE (cT1) and without metastases (cN0M0), what is the initial procedure of choice, and what is the strength/certainty?',
    answer: `Thyroid lobectomy is the initial procedure — unless there are bilateral cancers or other indications to remove the contralateral lobe.

(Strong recommendation, Moderate-certainty evidence.)`,
    brief: 'Why: for small, unifocal, intrathyroidal, node-negative tumors there is no meaningful survival difference between lobectomy and total thyroidectomy, while lobectomy carries significantly lower complication rates. "Does removing more tissue help?" → no, at this size.',
    concepts: ['lobectomy'],
  },
  {
    id: 'q5',
    type: 'recall',
    section: 'Rec 15 · Operative',
    stem: 'Rec 15B — the contested middle zone (>2 to ≤4 cm, cT2N0M0). What is the preferred initial treatment, how does the recommendation strength differ from 15A, and what are the three categories of reasons a team might still choose total thyroidectomy?',
    answer: `Thyroid lobectomy MAY be the preferred initial treatment (lower risk and side effects).
(Conditional recommendation, Low–moderate-certainty evidence.)

The strength downgrade is the teaching point: 15A (≤2 cm) is STRONG; 15B (2–4 cm) is only CONDITIONAL. The evidence is genuinely split — about half of meta-analyses show no recurrence difference (but higher complications with total), and about half show statistically lower recurrence with total.

Three reasons a team may still elect total thyroidectomy:
1. To enable RAI administration
2. To enhance follow-up (e.g., facilitating Tg surveillance)
3. Suspicious contralateral nodularity and/or patient preference`,
    brief: 'Forcing function: when offering lobectomy for a 2–4 cm tumor, counsel the patient about the ~20% possibility of conversion to total thyroidectomy if higher-risk features emerge. Anchor that ~20% figure now — it recurs through Rec 15/16.',
    concepts: ['lobectomy', 'conversion-rate'],
  },
  {
    id: 'q6',
    type: 'recall',
    section: 'Rec 15 · Operative',
    stem: 'Rec 15C — when the answer is unambiguously total thyroidectomy. List the qualifying scenarios (map them back to the T/N categories) and give the strength/certainty.',
    answer: `Total thyroidectomy (with gross removal of all primary tumor + node dissection, absent contraindications) is indicated for:
• Thyroid cancer >4 cm (cT3a)
• Gross extrathyroidal extension — cT3b or cT4 (any size)
• Clinically apparent nodal metastasis (cN1)
• Distant metastasis (cM1)
(Strong recommendation, Moderate-certainty evidence.)

Extent of initial surgery (Table 5):
• cT1N0M0 (unilateral) → Lobectomy
• cT1(m)N0M0 (bilateral/multifocal) → Total thyroidectomy
• cT2N0M0 (unilateral) → Lobectomy OR total thyroidectomy
• cT2(m)N0M0 (bilateral) → Total thyroidectomy
• cT3–4, or cN1, or cM1 → Total thyroidectomy`,
    brief: 'The logic is NOT "bigger = more surgery." Extension, multifocality, nodal, and metastatic status force total thyroidectomy. A 4.5 cm purely intrathyroidal cN0 tumor (T3a) tips to total mainly because near-total/total is necessary if the plan includes post-op RAI.',
    concepts: ['total-thyroidectomy', 't-category'],
  },
  {
    id: 'q7',
    type: 'recall',
    section: 'Rec 15 · Operative',
    stem: 'The "why RAI forces the hand" mechanism. Why does a plan to use post-operative RAI essentially mandate near-total or total thyroidectomy? And what is the corollary about the historical indications (contralateral nodules, prior radiation, FNMTC)?',
    answer: `Mechanism: RAI remnant ablation/adjuvant therapy requires total thyroidectomy to work — residual normal thyroid avidly takes up iodine, so a large remnant (intact contralateral lobe) defeats ablation and obscures Tg-based surveillance. Whenever post-op RAI is part of the strategy, the surgery must be near-total/total.

Corollary (the "RAI shadow"): prior guidelines recommended total thyroidectomy where post-op RAI was anticipated — DTC >4 cm (T3a), gross ETE (T3b/T4), cN1, or cM1. For 1–4 cm node-negative tumors, older guidance invoked age >45, contralateral nodules, prior head/neck radiation, or FNMTC as reasons to default to total BECAUSE of RAI plans.`,
    brief: 'The 2025 framing pulls away from routine RAI for remnant ablation in low-risk disease — which in turn removes much of the historical justification for routine total thyroidectomy in those patients.',
    concepts: ['rai', 'total-thyroidectomy'],
  },
  {
    id: 'q8',
    type: 'recall',
    section: 'Rec 16 · Completion',
    stem: 'Rec 16A — indications for completion thyroidectomy. Completion after initial lobectomy may be considered to address what three goals? Give the strength/certainty and the conceptual point about WHY completion is even on the table (the diagnostic gap).',
    answer: `Completion thyroidectomy after initial lobectomy may be considered to:
1. Ensure complete removal of persistent primary cancer after inadequate initial resection (R2 — gross residual)
2. Address persistent primary malignancy with suspected bilateral cancers
3. Facilitate RAI administration and/or enhance follow-up based on higher estimated recurrence risk identified post-operatively (accounting for RLN function)
(Conditional recommendation, Low–moderate-certainty evidence.)

The diagnostic gap: completion is indicated when DTC was not known/recognized pre- or intra-operatively. Most cytologically INDETERMINATE nodules that prove malignant turn out to be low-risk cancers adequately treated by lobectomy alone.`,
    brief: 'Completion becomes desirable only when final histology reveals heightened recurrence risk — the explicit hand-off to Rec 28 / the Pathology section.',
    concepts: ['completion-indications'],
  },
  {
    id: 'q9',
    type: 'recall',
    section: 'Rec 16 · Completion',
    stem: 'Rec 16B + the surgical-safety forcing functions. Before proceeding to completion, what functional assessment is mandatory, what should happen if it is abnormal, and what two bilateral-surgery risks drive this caution?',
    answer: `Mandatory pre-completion assessment: evaluate the functional status of the recurrent laryngeal nerves (laryngeal exam). If an IPSILATERAL RLN injury is present, defer contralateral resection until the ipsilateral nerve has recovered.

The two driving risks of two-stage / bilateral surgery:
1. Bilateral RLN injury → necessitating tracheostomy (the catastrophic outcome)
2. Hypoparathyroidism from removing/devascularizing remaining parathyroid tissue

(Rec 16B extends completion to oncocytic thyroid carcinoma [OTC] on the same indications as other types — Conditional, Very-low-certainty.)`,
    brief: 'If there is permanent ipsilateral RLN paralysis, contralateral completion should prompt referral to a high-volume thyroid surgeon (cross-ref Rec 6). Completion overall is roughly similar in complication profile to up-front total, though with somewhat higher transient hypoparathyroidism and readmission/return-to-OR rates.',
    concepts: ['rln', 'completion-indications'],
  },
  {
    id: 'q10',
    type: 'recall',
    section: 'Rec 16 / 28 · Hinge',
    stem: 'The microscopic-vs-gross ETE distinction (high-yield trap). What changed about minimal/microscopic ETE in the 8th edition, and how does that change whether you pursue completion? Contrast the scenarios at the strap-muscle interface.',
    answer: `Minimal/microscopic ETE no longer upstages to T3 (Change B) — removed from the T3 definition, no impact on T category or stage. Consequently microscopic ETE may NOT require completion, particularly for T1 and small T2 unifocal tumors — unless there is clinical concern for nerve, trachea, or esophagus involvement.

The strap-muscle interface:
• Gross ETE into strap muscle → higher recurrence → convert lobectomy to total, resect to a grossly free margin.
• Microscopic ETE into strap musculature with a clearly negative margin → does NOT mandate completion.
• Microscopically positive margin / tumor transgressing the capsule, absent clinical ETE concern → does NOT mandate completion, particularly anteriorly.`,
    brief: 'Prudent judgment: when you cannot tell true tumor extension from scarring after needle biopsy, leaving a cuff of sternothyroid muscle at the area of concern and deferring to final histology beats reflexively pursuing total thyroidectomy.',
    concepts: ['micro-ete', 'gross-ete'],
  },
  {
    id: 'q11',
    type: 'recall',
    section: 'Rec 16 / 28 · Nodes',
    stem: 'Which nodes seen at lobectomy change the plan? Distinguish the scenario that may prompt completion from the one that does not necessarily require it, and give the three nodal features that suggest higher recurrence (favoring completion).',
    answer: `• Microscopic, pathologically involved central nodes (cN0 but pN1a) found incidentally → MAY prompt completion, but is not necessary for all patients.
• Clinically evident nodal metastasis (cN1a) discovered DURING lobectomy → warrants conversion to total thyroidectomy with central neck dissection.

Three features suggesting higher recurrence (→ favor completion):
1. Larger number of nodes — more than 3 to 5 involved
2. Higher lymph node ratio (LNR >0.3)
3. Presence of extranodal extension`,
    brief: 'Tool pearl: targeted frozen section of clinically suspicious nodes aids the intraoperative decision — letting you convert in one stage rather than returning for completion.',
    concepts: ['nodal-completion', 'completion-indications'],
  },
  {
    id: 'q12',
    type: 'recall',
    section: 'Rec 15 / 16 · Synthesis',
    stem: 'Grand synthesis — the conversion-rate reality. For low-risk DTC managed with initial lobectomy, what conversion/completion number must the patient understand, and what does the evidence say about whether DEFERRING completion harms survival?',
    answer: `The number: patients must be aware of a ≥20% possibility of conversion to total thyroidectomy — intraoperatively or as later completion. (Estimates range widely, ~5%–43% across studies, clustering near a meta-analytic 11–34%.)

The corollary that makes lobectomy-first defensible: with appropriate follow-up, deferral of completion has little to no impact on survival. Most recurrences after lobectomy occur in the contralateral lobe and are successfully salvaged with completion if the patient is compliant with sonographic surveillance.`,
    brief: 'Oral-exam distillation: lobectomy is the preferred initial operation for low-risk DTC (small, unifocal, intrathyroidal, no regional/distant mets) because of lower complications and better QoL — provided the patient accepts ~20% conversion and commits to surveillance.',
    concepts: ['conversion-rate', 'lobectomy'],
  },
  {
    id: 'q13',
    type: 'recall',
    section: 'Rec 27 · Pathology',
    stem: 'Rec 27 (Part 1) — what the pathology report MUST contain. Beyond the essential AJCC staging features (including margin status), name the histopathologic features reports should include for risk assessment.',
    answer: `Beyond essential AJCC staging features (and resection margin status), reports should additionally include:
• Presence of vascular invasion — AND the number of invaded vessels
• Number of lymph nodes examined and involved with tumor
• Size of the largest metastatic focus to the lymph node
• Presence or absence of extranodal extension of metastatic tumor
(Good Practice Statement.)`,
    brief: 'Vessel count, node number, metastatic-focus size, and extranodal extension are precisely the variables that move a patient between ATA recurrence-risk tiers. The path report is the raw data feed for Rec 28.',
    concepts: ['path-report'],
  },
  {
    id: 'q14',
    type: 'recall',
    section: 'Rec 27 · Pathology',
    stem: 'Rec 27 (Parts 2 & 3) — the subtype-naming mandate. Sort the named subtypes into unfavorable vs favorable, and name the familial-syndrome association the pathologist must flag.',
    answer: `Unfavorable subtypes to identify:
• Tall cell, columnar cell, hobnail subtypes of PTC
• Widely invasive FTC and OTC
• High-grade follicular-cell–derived non-anaplastic carcinoma

Favorable subtypes to identify:
• IEFVPTC with minimal invasion (invasive encapsulated follicular variant of PTC)
• Minimally invasive FTC

Familial-syndrome flag (Part 3): cribriform-morular carcinoma — can be associated with familial adenomatous polyposis (FAP). Also flag PTEN hamartoma tumor syndrome (PHTS)–associated FTC or PTC.
(Good Practice Statements.)`,
    brief: 'Naming a subtype is not cosmetic — "cribriform-morular" on a path report can be the first clue to undiagnosed FAP, redirecting the whole patient (and family) toward colorectal screening.',
    concepts: ['subtype', 'familial'],
  },
  {
    id: 'q15',
    type: 'recall',
    section: 'Rec 27 / 28 · Pathology',
    stem: 'The NIFTP / IEFVPTC nuclear-cytology fork (Figure 4). Using PTC nuclear cytology (present vs absent) and invasion (present vs absent) as the two axes, name the four entities (FA, FTC, NIFTP, IEFVPTC) by their position.',
    answer: `Driven by PTC nuclear features first, then invasion:
• Nuclei ABSENT + non-invasive → FA (follicular adenoma)
• Nuclei ABSENT + invasive → FTC (follicular thyroid carcinoma)
• Nuclei PRESENT + non-invasive → NIFTP (noninvasive follicular thyroid neoplasm w/ papillary-like nuclear features)
• Nuclei PRESENT + invasive → IEFVPTC (invasive encapsulated follicular variant of PTC)`,
    brief: 'NIFTP sits in the "PTC-nuclei present but non-invasive" box — exactly why it was reclassified OUT of carcinoma (it behaves indolently). Its malignant counterpart with the same nuclei but WITH invasion is IEFVPTC. On the follicular (no-PTC-nuclei) side, invasion separates benign FA from malignant FTC.',
    concepts: ['niftp'],
  },
  {
    id: 'q16',
    type: 'recall',
    section: 'Rec 28 · Risk Strat',
    stem: 'Capstone — Rec 28A. State (a) the inputs the 2025 ATA Risk Stratification System integrates, (b) the outcome it predicts, (c) the timeframe, and (d) strength/certainty. Then state the crucial difference between what AJCC staging predicts vs what the ATA system predicts.',
    answer: `(a) Inputs: histopathologic features of the tumor + number of cervical lymph nodes + AJCC staging + post-operative imaging + serum Tg and TgAb (if appropriate).
(b) Predicts: risk of structural disease persistence/recurrence (locoregional and/or distant) and/or survival in DTC (PTC, FTC/IEFVPTC, OTC).
(c) Timeframe: applied within ~3 months of surgery.
(d) Strong recommendation, Moderate-certainty evidence.

The pivotal distinction:
• AJCC/UICC TNM staging predicts disease-SPECIFIC SURVIVAL (mortality).
• The ATA Risk Stratification System predicts STRUCTURAL PERSISTENCE/RECURRENCE.`,
    brief: 'A patient can be low STAGE (excellent survival) yet carry meaningful RECURRENCE risk — which is exactly why two parallel systems exist. Higher recurrence risk is usually dependent on co-existing factors rather than any single factor.',
    detailed: 'Rec 28B: routine molecular profiling of histologic specimens post-operatively is NOT recommended routinely — but if such data already exist, they may be used to further refine recurrence risk. (Conditional, Low-certainty.)',
    concepts: ['ata-system', 'molecular'],
  },
  {
    id: 'q17',
    type: 'recall',
    section: 'Rec 28 · Risk Strat',
    stem: 'Rec 28 — the three-tier recurrence percentages. The 2025 system builds on the 2015 low/intermediate/high framework. Anchor the approximate observed recurrence rates for low, intermediate, and high risk (multivariable PTC analysis).',
    answer: `Multivariable analysis of the ATA Risk of Recurrence categories in PTC:
• Low risk → ~1.5% recurrence
• Intermediate risk → ~5.4% recurrence
• High risk → ~25% recurrence

(Similar for T1a PTC specifically: ~1.6% low / 7.4% intermediate / 22.7% high.)`,
    brief: 'These percentages are why the tier label drives surveillance intensity and RAI decisions. Low → intermediate roughly triples-to-quadruples risk; high is an order of magnitude above low. The 2025 refinements (focality, vessel counts, ETE handling) exist to sort patients into the CORRECT tier more precisely.',
    concepts: ['ata-tiers'],
  },
  {
    id: 'q18',
    type: 'recall',
    section: 'Rec 28 · Features',
    stem: 'Feature deep-dive — tumor focality. Where do unifocal T1a, multifocal T1a, and multifocal T1a with microscopic ETE land on risk?',
    answer: `• Unifocal T1a PTC → LOW risk
• Multifocal T1a PTC → still LOW risk (both were low in 2015)
• Multifocal T1a PTC WITH microscopic ETE → INTERMEDIATE risk

Multifocality in T1a PTC carries somewhat higher structural recurrence (~4–6% vs ~1–2% unifocal), though data are mixed. Multifocality is most reliably an independent predictor in tumors >1 cm (e.g., bilateral multifocality HR ~4); the signal is weaker within T1a PTC specifically.`,
    brief: 'Focality alone rarely moves a tiny tumor — it is focality + a SECOND feature (here, microscopic ETE) that bumps the tier. Echoes the Rec 28 theme: recurrence risk is driven by co-existing factors, not single variables.',
    concepts: ['focality'],
  },
  {
    id: 'q19',
    type: 'recall',
    section: 'Rec 28 · Features',
    stem: 'Feature deep-dive — vascular invasion (the vessel-count thresholds). Give the vascular-invasion risk mapping for PTC vs FTC, including the ≥4-vessel threshold and what "extensive" vs "focal" angioinvasion predicts.',
    answer: `Definition: vascular invasion = tumor cells invading through a vessel wall WITH adherent fibrin thrombus (angioinvasion is the more reproducible term vs lymphatic invasion).

PTC: vascular invasion → INTERMEDIATE risk (historically 15–30%); newer data suggest it more commonly predicts distant metastasis than locoregional recurrence.

FTC — the vessel-count threshold is the key number:
• Minimally invasive / <4 vessels (focal) → LOW risk (~2–3% recurrence; one series ~1%)
• Extensive / ≥4 vessels → HIGH risk (~30–55% recurrence; ~26% in one series)

Distant-met risk rises with vessel number: HR ~2.5 for <4 vessels, HR ~8 for ≥4 vessels. Extensive (≥4 foci) angioinvasion → OR ~26 for distant recurrence.`,
    brief: '"≥4 vessels" is the canonical cutoff separating minimally from extensively/widely invasive follicular-pattern carcinoma — and the single most important reason the path report must COUNT, not just note presence/absence.',
    concepts: ['vascular-invasion'],
  },
  {
    id: 'q20',
    type: 'recall',
    section: 'Rec 28 · Features',
    stem: 'Feature deep-dive — nodal metastasis parameters. Give the micrometastasis definition and its tier, the clinical N1 >3 cm tier, and the metastatic-focus size threshold (>2–3 mm) that signals higher recurrence.',
    answer: `From the 2015 framework (carried forward):
• ≤5 micrometastases, each <2 mm (<0.2 cm) → LOW risk
• Clinical N1 with any node >3 cm → HIGH risk

Refinements since 2015:
• Metastatic focus >5 mm → ~25.9% recurrence
• pN1 with node >3 mm → HR ~4.2, ~50% recurrence in one analysis
• >5 involved nodes / LNR >0.3 / extranodal extension → all push toward higher recurrence (and toward completion, per Q11)
• The traditional 3 cm "high risk" cutoff is challenged — N1b nodes >2 cm already carry elevated HR (~1.15), suggesting risk is more continuous than binary.`,
    brief: 'Nodal risk is a function of how many, how big, and whether they breach the capsule — number, size, extranodal extension — exactly the trio Rec 27 mandates reporting.',
    concepts: ['nodal-risk'],
  },
  {
    id: 'q21',
    type: 'recall',
    section: 'Capstone · Integrated Case',
    stem: 'End-to-end case. A 58-year-old with a 3.2 cm unifocal PTC, clinically node-negative, no gross ETE (cT2N0M0). Walk the chain: (1) initial operative options per Rec 15, (2) the intraoperative finding that forces conversion, (3) what the path report must contain per Rec 27, and (4) two final-path scenarios — one keeping the patient low risk, one pushing intermediate — and what each implies for completion.',
    answer: `(1) Initial operation (Rec 15B, cT2N0M0, age >55): the conditional middle zone. Lobectomy OR total are both acceptable (Table 5). Lobectomy may be preferred (lower complications, better QoL) — provided the patient accepts ~20% conversion and commits to surveillance. Total is reasonable if the patient prefers to avoid a possible second operation, or there is suspicious contralateral nodularity / an RAI plan.

(2) Intraoperative finding forcing conversion (Rec 15C / 16):
• Grossly apparent nodal metastasis (cN1a) → convert to total + central neck dissection.
• Gross ETE into strap muscle (T3b) → convert to total, resect to free margin.
• Targeted frozen section of a suspicious node drives a one-stage conversion.

(3) Path report must contain (Rec 27): essential AJCC features + margin status, vascular invasion WITH vessel count, nodes examined/involved, size of largest nodal focus, extranodal extension, and explicit subtype (flag tall-cell/columnar/hobnail; flag cribriform-morular → FAP).

(4) Final-path scenarios (Rec 28):
• Stays LOW: classic PTC, no vascular invasion, negative margins, no/limited nodal disease (≤5 micromets <2 mm), no aggressive subtype → completion NOT required; lobectomy adequate; surveillance only.
• Pushes INTERMEDIATE: vascular invasion present, OR microscopic ETE + multifocality, OR pN1a with several involved nodes / focus >5 mm → completion MAY be considered (to facilitate RAI and/or enhance Tg follow-up) — after confirming RLN function (defer contralateral if ipsilateral nerve injured).`,
    brief: 'One-line distillation: stage (age 58, 3.2 cm) sets survival expectations; the final pathology features set recurrence risk and decide whether lobectomy was definitive or whether completion + RAI earns its keep.',
    concepts: ['case', 'lobectomy', 'total-thyroidectomy', 'nodal-risk'],
  },
  {
    id: 'c1',
    type: 'recall',
    section: 'Controversy Stress-Test',
    stem: 'Controversy 1 — lobectomy vs total for 2–4 cm (T2N0M0) DTC. Argue both sides and explain what the Conditional strength of Rec 15B is admitting.',
    answer: `The evidence is split down the middle — about half of meta-analyses show no recurrence difference, half show lower recurrence with total. The Conditional strength of Rec 15B is an honest admission that the data do not resolve.

Defensible to do either; indefensible to claim the question is settled.`,
    brief: 'When the guideline grades a recommendation "Conditional," read it as a flag that the underlying evidence genuinely conflicts — not as a soft "total is better but we are hedging."',
    concepts: ['controversy', 'lobectomy'],
  },
  {
    id: 'c2',
    type: 'recall',
    section: 'Controversy Stress-Test',
    stem: 'Controversy 2 — the 3 cm nodal cutoff for "high risk." Why is it contested?',
    answer: `Carried from 2015 but actively challenged — N1b nodes >2 cm already show elevated HR, implying risk is CONTINUOUS, not a clean binary at 3 cm. The guideline reports the cutoff while citing its own counter-evidence.`,
    brief: 'Binary cutoffs are administrative conveniences laid over continuous biology. Know the number for the exam, but know the guideline itself flags it as imperfect.',
    concepts: ['controversy', 'nodal-risk'],
  },
  {
    id: 'c3',
    type: 'recall',
    section: 'Controversy Stress-Test',
    stem: 'Controversy 3 — lymphovascular vs true angioinvasion. Why does this distinction matter for whether "vascular invasion" holds up as a predictor?',
    answer: `Pathologists cannot reliably distinguish small lymphatics from veins/arteries on H&E, so the two get lumped — which may explain why "lymphovascular invasion" sometimes fails as an independent predictor while vessel-COUNTED angioinvasion (with fibrin thrombus, ≥4-vessel threshold) holds up.

The reporting standard is moving toward counted angioinvasion specifically.`,
    brief: 'Reproducibility of the measurement, not just the biology, decides whether a "predictor" survives multivariable analysis. Counted angioinvasion with fibrin thrombus is the more reproducible — and more durable — variable.',
    concepts: ['controversy', 'vascular-invasion'],
  },
  {
    id: 'c4',
    type: 'recall',
    section: 'Rapid Recall',
    stem: 'Speed round — rattle off the one-screen recall anchors for this whole module from memory, then reveal to check yourself.',
    answer: `• T-categories: ≤1 (T1a) / ≤2 (T1b) / ≤4 (T2) / >4 (T3a) intrathyroidal; T3b/T4 = gross extension, size-independent.
• Age pivot: 55; <55 caps at Stage II; DTC distant mets = IVB (IVC is anaplastic).
• Rec 15 ladder: ≤2 cm → lobectomy (Strong); 2–4 cm → lobectomy preferred (Conditional); >4 cm / gross ETE / cN1 / cM1 → total (Strong).
• The number: ~20% conversion/completion after low-risk lobectomy.
• Rec 16: completion fills the diagnostic gap; check RLN function first; defer contralateral if ipsilateral nerve injured.
• Micro ETE: no longer upstages, usually no completion (clean margin). Gross ETE: convert to total.
• Rec 27 report quartet: vessel COUNT + nodes examined/involved + largest met focus size + extranodal extension + subtype.
• NIFTP = PTC-nuclei present, non-invasive → out of carcinoma; IEFVPTC = same nuclei WITH invasion.
• Rec 28: ATA predicts RECURRENCE; AJCC predicts SURVIVAL. Tiers ~1.5% / ~5% / ~25%. Applied <3 months post-op.
• ≥4 vessels = the FTC minimally-vs-extensively-invasive cutoff (low → high risk).`,
    brief: 'If you can produce this list cold, you own Rec 15/16/27/28. The two money-lines: (1) stage = survival, ATA = recurrence; (2) extension/nodal/multifocal status — not size alone — drives the extent of surgery.',
    concepts: ['t-category', 'age-pivot', 'ata-tiers'],
  },
];

window.__MCQ_MODULE = { meta, DOMAINS, CONCEPTS, ITEMS };
