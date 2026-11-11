# Journal-club guide: auditory cortex, spontaneous vs sound-evoked movements

OKSAT Interactive learning guide `jc-whisking-auditory-cortex`, a figure-by-figure walk through one
paper for a journal club. Listed as Draft. No question module: a single basic-science paper has
nothing to drill, so no section carries `drill` or `practice`.

## Source

Zimmer-Harwood P, Picard S, King AJ, Dahmen JC. Auditory Cortex Distinguishes between Spontaneous
and Sound-Evoked Movements. J Neurosci. 2026;46(26):e1874252026.
https://doi.org/10.1523/JNEUROSCI.1874-25.2026. Open access, CC BY 4.0.

It is the only source. Every number in the guide is in the paper's main text or a figure legend.
The supplemental figures (S1 to S6) were not read: a claim that rests on one is written as
"the authors report (Fig. S…, not reproduced here)". Anything that is not in the paper (a critique,
a clinical bridge) sits in a `call` labelled **Appraisal** (kind `trap`) or **Discussant's note**
(kind `hook`), so a reader always knows whose claim it is.

## Contracts

- Slug `jc-whisking-auditory-cortex`; subspecialty `otology`, accent `#2F6E6A`;
  kicker `Otology / Neurotology · Journal club`; `draft: true`.
- Chapter files `js/oksat/guides/jc-whisking-auditory-cortex/<id>.js`, schema
  `docs/authoring-oksat-guide.md`, form as `js/oksat/guides/ar-crs-aerd/appraisal.js`.
- Figures are the paper's own, cropped from the PDF (never redrawn, never edited beyond the crop),
  in `images/oksat/jc-whisking-auditory-cortex/`, each listed in that folder's `ATTRIBUTION.md`.
  Every `figure` caption ends `Zimmer-Harwood et al., J Neurosci 2026, Fig. <n><panels>. CC BY 4.0; cropped.`
  `alt` describes what is plotted (axes, colours, what moves), not the conclusion.
- Section shape, in this order: what was asked → the figure → a `kv` "How to read it" with one row
  per panel (axes, colours, unit, n) → what it shows, with the numbers → a `call` `pearl` labelled
  **Conclusion** (one sentence, the claim this figure licenses) → where it applies, an **Appraisal**
  `trap` → 2 or 3 `check` prompts (ids `c1`, `c2`, …), at least one per chapter asked before its
  explanation (predict first).
- Colour words in the text follow the paper's figures: blue whisking, yellow wheel, red-orange pupil;
  green spontaneous, orange sound-triggered.
- Voice: module voice (`docs/design-principles.md` §6). No exclamation marks, bold for terminology,
  no em dashes used as asides, plain text plus the guide's inline markup only.
- A `check` never asks what an abbreviation stands for.
- Lint (`tools/lint-oksat-guide.mjs`): every chapter has `review: 'draft'`; 3 to 6 `tldr` bullets; 2 or 3
  `check` blocks per section, no more; any `p`, `why`, `ul`, `ol` or `table` block that holds a number
  carries a source chip in that block (`[[src|Results, Fig. 1F]]`, `[[src|Methods]]`,
  `[[src|Discussion]]`); no backticks, no line starting with `#`, `- ` or `* ` inside a string.

## Figures (already cropped)

| File | Panels | Shows |
|---|---|---|
| `movie1.webp` | Movie 1 still | face camera, eye camera, whisking / pupil / wheel traces |
| `fig1.webp` | 1A–J | whole figure |
| `fig1-ae.webp` | 1A–E | setup, tracking, 200 s example traces |
| `fig1-fh.webp` | 1F–H | run onset/offset; event-aligned means; pre-twitch dip |
| `fig1-ij.webp` | 1I–J | size-ordered heatmaps; smallest vs largest quintile |
| `fig2.webp` | 2A–E | whole figure |
| `fig2-a.webp` | 2A | whisking by tone frequency and level |
| `fig2-b.webp` | 2B | one session, all trials, ordered by level and frequency |
| `fig2-ce.webp` | 2C–E | above-threshold trials; no habituation; stimulus history |
| `fig3.webp` | 3A–F | whole figure |
| `fig3-ad.webp` | 3A–D | example neuron, classification schematic, spontaneous mean |
| `fig3-ef.webp` | 3E–F | same neuron, sound-triggered events |
| `fig4.webp` | 4A–D | six categories, pie, amplitudes, correlation |
| `fig5.webp` | 5A–C | ROC analysis |
| `fig6.webp` | 6A–B | sound-evoked activity: locomotion vs whisking |

Use the panel crop in the section that reads those panels; the whole-figure file opens a chapter
only where the panels are read together (Fig. 3).

## Chapters

Section ids are permanent and unique across the guide.

### `start` (no sections)
`intro`: one `cards` item with the full citation (with its year), DOI and licence; a `trap` labelled
"Currency check" whose text starts "Checked 2026-11." (one paper, mouse, basic science; figures are the paper's own under CC BY 4.0; supplement not read;
appraisal notes are the guide's, not the authors'; content draft); "How to use it" (`ul`): read the
30-second version, then each section shows the figure, tells you how to read it, states its
conclusion, then asks; the last chapter is the appraisal. End with a `table` "The paper in six
claims" (claim | where shown), one row per conclusion C1 to C6 below.

### 1 `question` · Question and background (3 sections, 15 min)
- `bg-1` Auditory cortex carries more than sound: brain state, arousal, pupil diameter and body
  movement as external readouts; ACh from basal forebrain, NA from locus coeruleus, both tracking
  pupil and whisking/locomotion (Introduction, p. 1–2).
- `bg-2` Two reasons a movement shows up in auditory cortex, and the loop between them: arousal-linked
  neuromodulation vs efference copy / corollary discharge from motor cortex (suppression of
  self-generated sound; movement signals as early as cochlear nucleus). Bidirectional: movements
  make sound, sounds make movement (startle at the loud end; subtler facial movements at lower
  levels). `cards` cols 2 for the two routes.
- `bg-3` The question and the design in one view: brief whisking bouts outside locomotion as a
  marker of a neuromodulatory spike; ask whether auditory cortex neurons treat a spontaneous whisk
  and a tone-triggered whisk alike. `steps` for the design (behaviour only → tones → two-photon →
  classify events → compare per neuron). Predict-first `check`: what result would you expect if the
  whisk-related signal were purely a copy of the motor command?

### 2 `methods` · Methods, process by process (5 sections, 25 min)
- `m-1` Animals and preparation: head-fixed mice ~3 months; GCaMP6 in CaMKIIα-expressing excitatory
  neurons, layers 2/3 (150–250 µm); head bar ± 4 mm cranial window over right auditory cortex;
  polystyrene wheel (foam-coated) or acrylic tube; sound-attenuated chamber; lit for pupil work,
  dark for imaging. Three male mice for Fig. 1; Fig. 2A right from two females; rest from three
  males. Figure `movie1.webp`.
- `m-2` Tracking behaviour: 200 or 30 frames/s whisker camera, second camera for pupil; DeepLabCut
  tracks 4 pupil-rim points and 1–3 whisker tips; whisker trace = frame-to-frame tip displacement
  averaged over whiskers; pupil diameter = mean of the two point-pair distances; locomotion = wheel
  > 3 cm/s; whisking events = peaks (Matlab findpeaks) on the 100 ms Gaussian-smoothed trace,
  excluding locomotion and the 10 s after it, and events within 2 s of another; everything plotted
  as % of session maximum.
- `m-3` Sound: 200 ms pure tones, 10 ms ramps, 2–64 kHz in 1/3 octaves at 40/60/80 dB SPL, onset
  interval 1.5 s (Fig. 2A right: 2–32 kHz, 1/6 octaves, 40/50/60 dB, 1 s); free-field electrostatic
  speaker ~10 cm ahead; flat ±2 dB. SAM tones only for widefield mapping of A1 and AAF.
- `m-4` Imaging and signal: two-photon at 940 nm, 512×512, ~30 Hz, 8 kHz resonant scanner
  (< 40 dB SPL at the head); suite2p registration and segmentation; neuropil × 0.7; ΔF/F with a
  robust median F₀. **Appraisal**: calcium indicators low-pass the spike train, so timing claims
  are coarse; the scanner tone sits inside the band that best drives whisking (level is low).
- `m-5` Classifying events and the statistics: **spontaneous** = not within 1 s after a tone whose
  frequency-level combination raises whisking (p < 0.05, Wilcoxon signed rank, 500 ms before vs
  300 ms after onset); **sound-triggered** = within 1 s of an 80 dB tone at a frequency that reliably
  triggers whisking (p < 0.001, "above-threshold trials"); the rest discarded. Neuron modulated =
  Kruskal–Wallis p < 0.001 across 70 frames (20 before, 50 after). ROC per frame, significant if AUC
  beyond shuffled mean ± 3 SD (100 shuffles). `cards` for the two definitions with `fig3-ad.webp`
  panel C in mind (figure shown in chapter 5, not here). A `sequence` block (id `s1`) ordering the
  analysis pipeline: track whiskers and pupil → find whisking events outside locomotion → find
  tone combinations that trigger whisking → label each event spontaneous, sound-triggered or
  discard → test each neuron around each event type → ROC per neuron. **Appraisal**: with tones
  every 1.5 s, a "spontaneous" event still sits among tones; it is only guaranteed not to follow a
  whisk-triggering one.

### 3 `behavior` · Figure 1: whisking, twitch and pupil (3 sections, 20 min)
- `f1-setup` Fig. 1A–E (`fig1-ae.webp`): whiskers move together (median Pearson r 0.96 ± 0.05 IQR),
  so one whisker suffices; locomotion comes with vigorous whisking and pupil dilation; brief
  whisking bouts (dots under 1E) occur without locomotion.
- `f1-timing` Fig. 1F–H (`fig1-fh.webp`): around running, whisking leads locomotion by a median
  470 ± 619 ms and pupil dilation by 265 ± 700 ms; whisking outlasts running by 625 ± 1,340 ms and
  the pupil keeps constricting for 1,950 ± 1,665 ms. Around a whisking event (n = 743): whisk and a
  small back-and-forth wheel deflection coincide (a whole-body **twitch**), pupil peaks 540 ± 225 ms
  later; pupil dilation with a twitch is 5.3 ± 5.8% vs 26.8 ± 16.2% with locomotion; a small
  pre-twitch pupil constriction and whisking dip (1H, segment a vs b). Predict-first `check` on which
  of the three signals peaks last and why (pupil is a slow smooth-muscle readout).
- `f1-scaling` Fig. 1I–J (`fig1-ij.webp`): events ordered by size; bigger whisk, bigger body movement
  and bigger dilation (pupil R = 0.25; body-movement correlation reported in Fig. S2A). Conclusion:
  three outward signs of one brain-state change. **Appraisal**: R = 0.25 is about 6% of variance; a
  shared cause is the authors' reading, and the neuromodulatory link is borrowed from Collins et al.
  2023, not measured here.

### 4 `sound` · Figure 2: pure tones trigger whisking (3 sections, 20 min)
- `f2-tuning` Fig. 2A (`fig2-a.webp`): whisking as a function of tone frequency and level; effective
  band about 3–20 kHz, the most sensitive part of mouse hearing; measurable at 50 dB SPL, broader at
  80 dB. Thick traces = significant combinations (p < 0.05; n = 234–254 presentations per
  combination left, 120 right). Prior work stressed broadband sound; here pure tones.
- `f2-reliability` Fig. 2B–C (`fig2-b.webp`, `fig2-ce.webp`): one session, every trial; at 80 dB in
  the effective band (8–20.15 kHz in this session) all but four trials show a sound-locked whisk.
  Onset latency 67–100 ms (third video frame after onset). **Discussant's note**: slower than an
  acoustic startle and at lower level; the paper places startle at the loud end of the same
  sound-to-movement spectrum.
- `f2-history` Fig. 2D–E: no habituation across a session (Mann–Kendall p = 0.79) but smaller
  after an immediately preceding loud tone (11.9 ± 10.3% vs 15.5 ± 11.3%; n = 191 vs 1,288 trials);
  larger when pre-trial whisking was higher (R = 0.25). Conclusion: a reliable, tuned, non-habituating
  sound-evoked movement that still depends on recent history and state.

### 5 `neurons` · Figures 3 to 6: what the neurons do (5 sections, 35 min)
- `f3-example` Fig. 3 (`fig3.webp` first, then `fig3-ad.webp` and `fig3-ef.webp`): one neuron; ΔF/F
  black, whisking blue, wheel yellow; event rectangles green (spontaneous), orange (sound-triggered),
  grey (discarded); panel C is the classification rule; the neuron fires with spontaneous whisks
  (n = 78 events) and is flat for sound-triggered ones (n = 53).
- `f4-count` How many neurons: 6,359 neurons, 14 sessions, 3 mice; 399 (6.3%) modulated by spontaneous
  whisking; A1 6% (0.5–13% across sessions), AAF 9% (1–15.5%). **Appraisal**: neurons are the unit of
  analysis across three animals (pseudoreplication; the session range is wide).
- `f4-categories` Fig. 4 (`fig4.webp`): `table` of the six categories with n and the ROC-distinguishing
  count in brackets: ES 10 (10), En 160 (80), EE 59 (31), SS 29 (12), Sn 112 (18), SE 29 (24). 40% are
  excited by spontaneous whisking and unmoved by sound-triggered whisking. Not an amplitude effect:
  sound-triggered whisks are slightly larger (4C; 2,209 spontaneous and 1,001 sound-triggered
  events). Negative correlation between the two responses, R = −0.23 (4D). Pupil dilation and
  twitching accompany sound-triggered whisking too (Fig. S4, not reproduced). **Appraisal**: "n.s." is
  absence of evidence with half as many events; R = −0.23 is about 5% of variance.
- `f5-roc` Fig. 5 (`fig5.webp`): ROC as the direct test. Explain AUC as the probability that a
  randomly drawn spontaneous-event value exceeds a sound-triggered one; 0.5 = indistinguishable;
  computed per frame; significance against shuffled labels ± 3 SD; 175 of 399 neurons distinguish
  the two. Predict-first `check`: what AUC would a neuron that ignores the difference show.
- `f6-evoked` Fig. 6 (`fig6.webp`) plus the "is it just the tone" control: only 54 of 399 (and 20 of
  the 127 neurons modulated during sound-triggered whisking) responded to tones that did not cause
  whisking; activity after sound-triggered whisks lags sound-driven responses (Fig. S5, not
  reproduced). Locomotion suppresses sound-evoked responses (median 0.17 vs 0.34 ΔF/F, p = 0.002,
  n = 59); whisking does not (0.31 vs 0.28, p = 0.14, n = 367). How to read a log-log unity plot:
  points below the diagonal = smaller during the behaviour.

### 6 `appraisal` · Conclusions and appraisal (4 sections, 25 min)
- `ap-claims` The six conclusions, each with its figure and how strong the support is (`table`):
  C1 brief whisks outside locomotion come with a body twitch and a later, size-scaled pupil
  dilation (Fig. 1). C2 pure tones in the sensitive band trigger near-identical whisks, down to
  50 dB SPL, without habituation (Fig. 2). C3 about 6% of layer 2/3 excitatory auditory cortex
  neurons are modulated around spontaneous whisks (Figs. 3–4). C4 many of those do not respond, or
  respond differently, when the whisk is sound-triggered; 175 of 399 distinguish the two (Figs. 4–5).
  C5 whisking, unlike locomotion, does not change sound-evoked responses (Fig. 6). C6 so the
  cause and context of a movement, not the movement alone, set its cortical signature.
- `ap-mechanisms` What could drive the difference (Discussion): arousal-related neuromodulation
  (global and coordinated for spontaneous events; sound-driven cholinergic input is tuned and
  heterogeneous; rostral vs caudal basal forebrain), corollary discharge (M2 input; different
  motor populations depending on what initiates the movement), and direct acoustic drive in some
  neurons. `cards`, one per candidate, each with "for" and "what the paper cannot tell".
  The paper measures none of these directly.
- `ap-limits` Appraisal, the guide's own (every item inside **Appraisal** callouts or a `ul` under
  one): three mice and neurons as n; the event-count asymmetry behind "n.s."; sound-triggered events
  are confounded with an 80 dB tone by definition, so "whisk context" and "loud tone present" cannot
  be separated without a whisk-free loud-tone comparison per neuron (the 54-of-399 control uses
  non-triggering tones, which are quieter or off-band); calcium kinetics; behaviour characterised
  in the light on a wheel, neurons imaged in the dark in a tube; C57BL/6 background (age-related
  high-frequency loss, which the authors raise); the supplement carries several key controls
  (S4, S5, S6). End with what would change your mind: neuromodulator axon imaging or sensors during
  both event types, and anaesthetised or motor-silenced controls.
- `ap-use` Why it matters and what to ask: the authors' practical advice (low level, short tones,
  avoid the most sensitive frequencies, anaesthetised controls; 80 dB pure tones are not
  movement-free, refining Clayton et al. 2024's below-90 dB reassurance; 200 ms vs 50 ms tones).
  **Discussant's note** for an otology audience: sound-evoked activity in an awake animal can
  include movement and arousal; pupil dilation as an arousal readout is the same signal used in
  human listening-effort pupillometry; none of this is tested in humans here. Close with a `ul` of
  five discussion questions for the room.

## Work packages

| WP | Model | Touch | Acceptance |
|---|---|---|---|
| A | Sonnet | `start.js`, `question.js`, `methods.js` | each file loads in Node and ends with the one `window.__OKSAT_CHAPTER` line |
| B | Sonnet | `behavior.js`, `sound.js` | same |
| C | Sonnet | `neurons.js`, `appraisal.js` | same |
| D | Haiku | `js/oksat/manifest.js`, `js/oksat/terms.js`, `images/oksat/jc-whisking-auditory-cortex/ATTRIBUTION.md`, `ATTRIBUTED` in `tools/check-data.mjs`, stamps, `docs/wip.md`, `plans/README.md` | `check-data`, `lint-oksat`, `lint-oksat-guide`, `test-oksat-learn`, `smoke-pages` green |

Writers do not touch the manifest or the lexicon. Escalate (stop and report) rather than add a
number or claim the paper does not state.
