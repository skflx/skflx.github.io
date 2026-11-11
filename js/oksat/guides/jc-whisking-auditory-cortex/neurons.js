/* =============================================================
   What the neurons do
   OKSAT · Interactive learning · JC · whisking and auditory cortex · chapter 5
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'neurons',
    review: 'draft',
    title: 'Figures 3 to 6: what the neurons do',
    kicker: '5 · Figures 3 to 6',
    lede: 'One example neuron, then the whole population sorted into six categories, a test that asks whether single neurons tell the two kinds of whisk apart, and a control on whether whisking changes sound responses.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    tldr: [
        'Of 6,359 imaged neurons, 399 (6.3%) were modulated around spontaneous whisks. Most were excited.',
        'Fig. 4 sorts those 399 by their response to spontaneous whisking (first letter) and to sound-triggered whisking (second letter). The largest cell, 160 neurons, is excited by the first and unmoved by the second.',
        'A receiver operating characteristic analysis found that 175 of the 399 neurons separate the two kinds of whisk. The difference is not explained by whisk size: sound-triggered whisks were slightly larger.',
        'Only 54 of the 399 neurons responded to tones that did not cause whisking, so the tone itself is not the main driver in most cells.',
        'Locomotion suppressed sound-evoked responses in the neurons tested; whisking did not.',
    ],
    sections: [
        {
            id: 'f3-example',
            n: '5.1',
            title: 'Figure 3: one neuron, two kinds of whisk',
            blocks: [
                { t: 'p', x: 'The question: when this neuron is active around a whisk, is it the whisk that matters, or the tone that often comes with it? To answer it the authors first sort every whisking event into a category, then average the neuron\'s activity around each category. [[src|Results, Fig. 3]]' },
                { t: 'check', id: 'c1', q: 'Predict first. A neuron brightens after most whisks. Why would the authors refuse to pool all whisks together before averaging?', a: 'Some whisks are triggered by a tone, and the tone itself might be what drives the neuron. Pooling would mix a movement signal with a sound signal, so the events are split by what started the whisk.' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig3.webp',
                    alt: 'Six-panel figure for one neuron. Top: a long trace of fluorescence in black above, whisking in blue and wheel speed in yellow plotted downward below, with two dashed boxes marking segments. Middle left: an expanded segment with coloured rectangles under the whisking trace, mostly green, one grey, and a row of tick marks for tones. A small inset grid of frequency against level is coloured green, grey and orange. Middle right: the average fluorescence in black rises sharply after a blue whisking spike. Bottom left: a second expanded segment with green and orange rectangles. Bottom right: the average fluorescence for sound-triggered events stays nearly flat after the blue whisking spike.',
                    label: 'Figure 3 · all panels',
                    cap: 'Read the whole figure first, then the two crops below panel by panel. Zimmer-Harwood et al., J Neurosci 2026, Fig. 3A–F. CC BY 4.0; cropped.',
                },
                { t: 'h', x: 'How to read panels A to D' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig3-ad.webp',
                    alt: 'Panel A: a long recording of one neuron. Black trace above is fluorescence change in the neuron (ΔF/F); below it a blue trace is whisking and a yellow trace is wheel speed, both drawn downward. Dashed boxes B and E mark segments. Scale bars: 20 seconds, 5 ΔF/F, 50 percent for whisking and wheel. Panel B: an expanded segment with rectangles under the whisking trace, green for most events and one grey, and tick marks along the bottom for tones. Panel C: a small grid with frequency on the horizontal axis and sound level on the vertical axis, filled green, grey and orange, with a few orange tone symbols at the top. Panel D: mean fluorescence in black with a grey band, and a narrow blue whisking spike, aligned to spontaneous whisking events; fluorescence rises after the spike. Scale bars 1 second, 1 ΔF/F, 10 percent.',
                    label: 'Figure 3A–D · the example neuron and the classification rule',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 3A–D. CC BY 4.0; cropped.',
                },
                {
                    t: 'kv',
                    rows: [
                        ['A: the raw record', 'Time runs left to right (scale bar 20 s). Black, top: ΔF/F, the neuron\'s fluorescence change, up means more active (scale 5 ΔF/F). Blue and yellow hang downward from the baseline: whisking (blue) and wheel speed (yellow), each as a percentage of the session maximum (scale 50%). The big yellow blocks are running bouts; the many thin blue spikes outside them are whisks without running. [[src|Fig. 3A legend]]'],
                        ['B: zoom on one segment', 'The rectangles under the whisking trace are whisking events, coloured by the rule. Green: spontaneous. Grey: disregarded. Orange appears in E. The ticks along the bottom are tone onsets, coloured the same way. The first tone of this segment came about 20 s in, after a period of silence. [[src|Fig. 3B legend]]'],
                        ['C: the rule as a map', 'Frequency along the bottom, level up the side. The colours match the event rectangles. A whisk counts as spontaneous when no tone in the preceding 1 s came from a frequency-level combination that raises whisking. It counts as sound-triggered when it falls within 1 s of an 80 dB SPL tone at a frequency that reliably triggers whisking (the orange zone, p < 0.001). Whisks in neither case are disregarded (grey). [[src|Results; Fig. 3C legend]]'],
                        ['D: the answer for spontaneous whisks', 'The blue spike is the average whisk aligned to time zero. The black line is the neuron\'s average ΔF/F, and the grey shading is the 95% confidence interval. Fluorescence climbs just after the whisk and decays over seconds. n = 78 events. [[src|Fig. 3D legend]]'],
                    ],
                },
                { t: 'h', x: 'How to read panels E and F' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig3-ef.webp',
                    alt: 'Panel E: a second expanded segment of the same neuron. Black fluorescence trace above, blue whisking trace below, with green and orange rectangles under the whisking trace and one grey; a row of tick marks for tones along the bottom, and an arrow labelled sound-triggered whisking pointing at an orange rectangle. Panel F: the mean fluorescence in black with a thin grey band stays nearly flat around a blue whisking spike for sound-triggered events. Scale bars 1 second, 1 ΔF/F, 10 percent.',
                    label: 'Figure 3E–F · the same neuron, sound-triggered whisks',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 3E–F. CC BY 4.0; cropped.',
                },
                {
                    t: 'kv',
                    rows: [
                        ['E: a segment with orange events', 'Same layout as B. The orange rectangles are whisks that followed an 80 dB tone at a whisk-triggering frequency. Compare what the black trace does after an orange event with what it does after a green one. [[src|Fig. 3E legend]]'],
                        ['F: the answer for sound-triggered whisks', 'Same axes and colours as D (black ΔF/F, blue whisking, grey shading is the 95% confidence interval). The whisking spike looks the same as in D, but the black line is almost flat. n = 53 events. [[src|Fig. 3F legend]]'],
                    ],
                },
                { t: 'p', x: 'What it shows: for this neuron, a spontaneous whisk (78 events) is followed by a large, slow rise in ΔF/F, while a near-identical whisk triggered by a loud tone (53 events) is followed by almost nothing. The two spikes on the whisking trace are drawn on the same scale, so the movement is not what differs. [[src|Results, Fig. 3D, 3F]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'One neuron can respond to a whisk when it happens spontaneously and not respond when the same-looking whisk is triggered by a tone.' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'In Fig. 3D and 3F the neuron\'s averaged trace differs but the blue whisking spike does not. What does that rule out?', a: 'That the difference is simply a bigger or smaller movement. The movement looks the same; the neuron\'s response differs with what started it.' },
                { t: 'check', id: 'c3', q: 'In Fig. 3B a whisk is coloured grey. Under the paper\'s rule, what happened before it?', a: 'It was neither clearly spontaneous nor clearly sound-triggered, so it was disregarded: a tone from a combination that raises whisking came before it, but not an 80 dB tone at a frequency that reliably triggers whisking.' },
            ],
        },
        {
            id: 'f4-count',
            n: '5.2',
            title: 'How many neurons care',
            blocks: [
                { t: 'p', x: 'The question: before sorting neurons by how they respond, how many respond to spontaneous whisking at all? The authors imaged 6,359 neurons across 14 sessions in three mice, and called a neuron modulated if its fluorescence differed significantly (Kruskal-Wallis test, p < 0.001) across 70 imaging frames around the whisk, 20 before and 50 after. [[src|Results; Methods]]' },
                { t: 'check', id: 'c1', q: 'Predict first. Out of 6,359 recorded neurons, roughly what share would you expect to be modulated by spontaneous whisking, and would you expect the two cortical fields to differ?', a: 'About 6%: 399 neurons (6.3%). The two fields are similar: primary auditory cortex 6%, anterior auditory field 9%, with wide ranges across sessions.' },
                {
                    t: 'kv',
                    rows: [
                        ['The unit', 'Each neuron is one imaged cell body, from layers 2/3, 150 to 250 µm below the surface. The count is over neurons, not animals. [[src|Methods; Results]]'],
                        ['The two fields', 'Primary auditory cortex (A1) was imaged in 10 sessions and the anterior auditory field (AAF) in four. [[src|Results]]'],
                        ['The result', '399 of 6,359 neurons (6.3%). In A1 the proportion was 6%, range across sessions 0.5 to 13%. In AAF it was 9%, range 1 to 15.5%. [[src|Results]]'],
                    ],
                },
                { t: 'p', x: 'What it shows: a minority of neurons carry a significant whisk-related signal, and the proportion varies several-fold from session to session. The next section asks what those 399 do when the whisk is sound-triggered. [[src|Results]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'About 6% of layer 2/3 excitatory auditory cortex neurons are modulated around spontaneous whisks, so the effect is real but concerns a subset. [[src|Zimmer-Harwood 2026]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'The guide\'s note, not the authors\': the analysis treats neurons as the unit across only three animals, so neurons from one mouse are not independent samples (**pseudoreplication**). The session range, 0.5 to 13% in A1, shows how much the proportion moves with the session and animal. [[src|Results]]' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'What test and window defined a neuron as modulated by spontaneous whisking?', a: 'A Kruskal-Wallis test, p < 0.001, on fluorescence across 70 frames around the event: 20 frames before the whisk peak to 50 frames after.' },
                { t: 'check', id: 'c3', q: 'Why does the authors\' count exclude neurons that simply follow tones that also happen to cause whisking?', a: 'They analysed only spontaneous whisking events, defined as events not within 1 s after a tone in a whisk-raising combination, so a neuron counted as modulated is coupled to the whisk rather than to a sound that also drives whisking.' },
            ],
        },
        {
            id: 'f4-categories',
            n: '5.3',
            title: 'Figure 4: six kinds of neuron',
            blocks: [
                { t: 'p', x: 'The question: of the 399 neurons excited or suppressed by spontaneous whisking, what do they do when the whisk is sound-triggered instead? Fig. 4 answers with a two-by-three grid. The rows are the effect of spontaneous whisking, the columns the effect of sound-triggered whisking. [[src|Results, Fig. 4]]' },
                { t: 'check', id: 'c1', q: 'Predict first. Each cell of the grid gets a two-letter label: first letter the effect of spontaneous whisking, second the effect of sound-triggered whisking; the letters are E for excited, S for suppressed, n for not significant. A neuron is suppressed by spontaneous whisks and excited by sound-triggered whisks. Which label, and which corner of the grid?', a: 'SE: bottom row (suppressed by spontaneous), right-hand column (excited by sound-triggered). It is a cell with 29 neurons.' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig4.webp',
                    alt: 'Panels A and B: a grid with three columns headed Suppression, n.s. and Excitation for the effect of sound-triggered whisking, and two rows, Excitation on top and Suppression below, for the effect of spontaneous whisking. Each cell holds two mean fluorescence traces with shaded bands, green for spontaneous whisking and orange for sound-triggered, with a count n and a bracketed number. Top row n values: 10 (10), 160 (80), 59 (31). Bottom row: 29 (12), 112 (18), 29 (24). A pie chart in the centre carries the six labels ES, En, EE, SS, Sn and SE. Panel C: two overlapping narrow whisking peaks, orange and green. Panel D: a scatter of sound-triggered z-score against spontaneous z-score with a red downward fit line and R = -0.23.',
                    label: 'Figure 4 · six categories',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 4A–D. CC BY 4.0; cropped.',
                },
                {
                    t: 'kv',
                    rows: [
                        ['Colours', 'Green is spontaneous whisking, orange is sound-triggered whisking, everywhere in the figure. The shaded bands are 95% confidence intervals. [[src|Fig. 4 legend]]'],
                        ['A: top row', 'Neurons excited by spontaneous whisking (the green trace rises). Left column: orange dips, so suppressed by sound-triggered whisking, 10 neurons, label ES. Middle: orange stays flat, not significant, 160 neurons, En. Right: orange rises too, excited by both, 59 neurons, EE. Scale bar 1 standard deviation (SD) vertical, 1 s horizontal. [[src|Fig. 4A legend]]'],
                        ['B: bottom row', 'Neurons suppressed by spontaneous whisking (the green trace dips). Left: orange dips too, 29 neurons, SS. Middle: orange flat, 112 neurons, Sn. Right: orange rises, 29 neurons, SE. [[src|Fig. 4B legend]]'],
                        ['The two numbers', 'n = 160(80) means 160 neurons in this cell, 80 of which also pass the ROC test for a significant difference between the two kinds of whisk (next section). [[src|Fig. 4 legend]]'],
                        ['The pie', 'The same six cells as slices of the 399, labelled with the same two-letter codes. [[src|Fig. 4 legend]]'],
                        ['C: whisk size', 'Average whisking amplitude for the two kinds of event on one axis (scale 10%, 500 ms), N = 2,209 spontaneous and 1,001 sound-triggered events in three mice. The orange peak is slightly taller. [[src|Fig. 4C legend]]'],
                        ['D: do the two responses go together?', 'Each dot is one neuron. Horizontal: its response to spontaneous whisking; vertical: its response to sound-triggered whisking; both are the mean z-scored fluorescence 0 to 1.5 s after the event. The red line is the fit; R is the Pearson correlation coefficient. [[src|Fig. 4D legend]]'],
                    ],
                },
                {
                    t: 'table',
                    head: ['Label', 'Spontaneous', 'Sound-triggered', 'Neurons (ROC-separable)'],
                    rows: [
                        ['ES', 'Excited', 'Suppressed', '10 (10)'],
                        ['En', 'Excited', 'Not significant', '160 (80)'],
                        ['EE', 'Excited', 'Excited', '59 (31)'],
                        ['SS', 'Suppressed', 'Suppressed', '29 (12)'],
                        ['Sn', 'Suppressed', 'Not significant', '112 (18)'],
                        ['SE', 'Suppressed', 'Excited', '29 (24)'],
                    ],
                },
                { t: 'p', x: 'What it shows: the cells add to 399. The biggest, En at 160 neurons, is about 40% of all 399 neurons: excited by spontaneous whisking and not significantly modulated by sound-triggered whisking. It is not a size effect, because sound-triggered whisks were slightly larger (Fig. 4C, p < 10⁻²⁴), and the two responses are negatively correlated across neurons (R = −0.23, Fig. 4D): neurons strongly excited by spontaneous whisking tended not to be strongly activated by sound-triggered whisking. The authors also report that pupil dilation and twitching accompany sound-triggered whisking too (Fig. S4, not reproduced here). [[src|Results, Fig. 4A–D]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'Many neurons that respond to a spontaneous whisk do not respond, or respond differently, to a sound-triggered whisk of the same or larger size.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'The guide\'s note, not the authors\': "not significant" is absence of evidence, and there are about half as many sound-triggered events (1,001) as spontaneous ones (2,209), so a weaker test sits behind every n cell. R = −0.23 explains about 5% of the variance across neurons. [[src|Fig. 4C legend, 4D]]' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'The En cell reads n = 160(80). What are the two numbers, and what does the cell mean?', a: '160 neurons were excited by spontaneous whisking and not significantly modulated by sound-triggered whisking; 80 of them also pass the ROC test that the two responses differ.' },
                { t: 'check', id: 'c3', q: 'A critic says the sound-triggered responses are smaller because those whisks were smaller. What in Fig. 4 answers that?', a: 'Fig. 4C: the sound-triggered whisks were slightly larger than spontaneous ones (2,209 spontaneous and 1,001 sound-triggered events), so a smaller movement cannot explain a weaker neural response.' },
            ],
        },
        {
            id: 'f5-roc',
            n: '5.4',
            title: 'Figure 5: can a single neuron tell the two apart',
            blocks: [
                { t: 'p', x: 'The question: in Fig. 4 two averaged traces are compared by eye. Does each neuron, on its own, actually separate spontaneous from sound-triggered events? The authors use a **receiver operating characteristic** (ROC) analysis, and the number it produces is the **area under the curve** (AUC). [[src|Results, Fig. 5]]' },
                { t: 'check', id: 'c1', q: 'Predict first. What AUC would a neuron show if it ignored the difference between the two kinds of whisk?', a: 'About 0.5: chance. Its activity at a given moment would not tell you which kind of event you were looking at.' },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'AUC in plain words',
                    blocks: [
                        { t: 'p', x: 'Pick one spontaneous event and one sound-triggered event at random, and compare the neuron\'s activity at the same moment relative to each whisk. The AUC is the probability that the spontaneous one is higher. A value of 0.5 means a coin flip: the two groups overlap completely. Values toward 1 mean spontaneous events are reliably higher; values toward 0 mean sound-triggered events are reliably higher. The authors measure the distance from 0.5, so a neuron far above or far below counts equally. Because it is computed on the whole distribution of events, not on a mean, it asks whether the two groups can be told apart. [[src|Methods]]' },
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig5.webp',
                    alt: 'Three panels. A: mean ΔF/F against time from minus 3 to 3 seconds for one neuron; a green line for spontaneous whisking rises to near 3 after time zero with a shaded band, an orange line for sound-triggered stays near baseline. B: AUC against time for the same neuron, a black line near 0.5 before time zero that rises to a high plateau after zero; a dotted line at 0.5, a blue horizontal band around it and brown beyond. C: a histogram of maximum AUC, with the number of neurons on the vertical axis up to about 120 and AUC from 0.1 to 0.9 on the horizontal axis; blue bars for non-significant and brown bars for significant, and a black line for the shuffled distribution peaking near 0.5.',
                    label: 'Figure 5 · ROC analysis',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 5A–C. CC BY 4.0; cropped.',
                },
                {
                    t: 'kv',
                    rows: [
                        ['A: the raw contrast', 'One example neuron. Horizontal: time from 3 s before to 3 s after the whisk (time zero is the whisk). Vertical: mean ΔF/F. Green: spontaneous; orange: sound-triggered; shading is the 95% confidence interval. Green rises, orange does not. [[src|Fig. 5A legend]]'],
                        ['B: the same neuron as AUC', 'Same time axis, now AUC on the vertical axis (0.1 to 0.9). The black line is the AUC at each imaging frame. The dotted line is the mean AUC from shuffled event labels, and the blue band is 3 standard deviations around it (100 shuffles). Where the black line leaves the blue band, the neuron tells the two apart. [[src|Fig. 5B legend; Methods]]'],
                        ['C: all 399 neurons', 'Each neuron contributes its maximum AUC, defined as the maximum distance from 0.5. Horizontal: maximum AUC. Vertical: number of neurons. Brown: the neuron\'s maximum exceeded the shuffled mean by 3 standard deviations, so significant. Blue: not. The black line is the distribution expected from shuffled labels, centred near 0.5. [[src|Fig. 5C legend]]'],
                    ],
                },
                { t: 'p', x: 'What it shows: for the example neuron, AUC sits inside the blue band (no information) before the whisk and climbs far above it shortly after time zero, as the two means in A suggest. Across the population, 175 of 399 neurons were judged able to distinguish spontaneous from sound-triggered whisking. [[src|Results, Fig. 5A–C]]' },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'A large subset of the whisk-modulated neurons, 175 of 399, respond measurably differently to the two kinds of whisk.' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'In Fig. 5B what do the dotted line and the blue band represent, and what would the black line have to do to count as significant?', a: 'The dotted line is the mean AUC obtained with shuffled event labels, and the blue band is 3 standard deviations around it. The black line must go outside the band.' },
                { t: 'check', id: 'c3', q: 'What does the ROC analysis add that the averaged traces in Fig. 4 do not?', a: 'A per-neuron statistical test of whether the two kinds of event can be told apart, using the whole distribution of responses and a shuffled-label null, rather than a visual comparison of mean traces.' },
            ],
        },
        {
            id: 'f6-evoked',
            n: '5.5',
            title: 'Figure 6: is it the tone, and does whisking change hearing',
            blocks: [
                { t: 'p', x: 'Two controls. First, is the tone itself what drives these neurons? Only 54 of all 399 neurons, and 20 of the 127 neurons modulated during sound-triggered whisking, responded to tones of frequency-level combinations that did not cause whisking. The authors conclude that most neurons are not directly responsive to the tones used, although some may be tuned to combinations that also elicit whisking. [[src|Results]]' },
                { t: 'p', x: 'The authors also report that activity after sound-triggered whisking lags sound-driven responses on average (Fig. S5, not reproduced here). Second, does whisking change how neurons respond to sound, as locomotion is known to? Fig. 6 compares responses to the same tones with and without the behaviour. [[src|Results]]' },
                { t: 'check', id: 'c1', q: 'Predict first. Mice whisk during some tones. How could you test whether whisking changes sound-evoked responses without being fooled by whisks that the tone itself caused?', a: 'Use only tones from frequency-level combinations that did not trigger whisking, and compare responses to the same combination when the mouse was whisking and when it was not.' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig6.webp',
                    alt: 'Two scatter plots on logarithmic axes from 0.1 to 10 ΔF/F with a diagonal dashed line. A: horizontal axis not locomoting, vertical axis locomoting; few points, most below the diagonal. B: horizontal axis not whisking, vertical axis whisking; many points scattered tightly along the diagonal.',
                    label: 'Figure 6 · locomotion against whisking',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 6A–B. CC BY 4.0; cropped.',
                },
                {
                    t: 'kv',
                    rows: [
                        ['Each dot', 'One neuron, its mean sound-evoked response (ΔF/F) to matching frequency-level combinations. The horizontal axis is the response when the behaviour was absent; the vertical axis is the response when it was present. Both axes are logarithmic, 0.1 to 10. [[src|Fig. 6 legend]]'],
                        ['The dashed diagonal', 'Equal response in both states. A dot below the diagonal responded less during the behaviour. A dot above responded more. [[src|Fig. 6 legend]]'],
                        ['A: locomotion', 'Not locomoting (horizontal) against locomoting (vertical), n = 59 neurons. [[src|Fig. 6A legend]]'],
                        ['B: whisking', 'Not whisking against whisking, n = 367 neurons. [[src|Fig. 6B legend]]'],
                    ],
                },
                { t: 'p', x: 'What it shows: during locomotion the median response fell from 0.34 to 0.17 ΔF/F (p = 0.002, Wilcoxon signed rank test, n = 59), so most dots lie below the line. During whisking it was 0.31 against 0.28 ΔF/F (p = 0.14, n = 367), and the dots straddle the diagonal. [[src|Fig. 6A, 6B legends]]' },
                {
                    t: 'deep',
                    title: 'How the comparison was selected',
                    blocks: [
                        { t: 'p', x: 'Only tones whose frequency-level combination did not trigger significant whisking were used. Neurons with a significant difference in response across tones (one-way ANOVA, p < 0.001) were kept, and for each the combinations with a mean response of at least 1.5 standard deviations above its overall mean were taken. Whisking was defined as the smoothed whisker trace exceeding 5% of the session maximum, and periods of locomotion were excluded from the whisking comparison. A neuron entered only if at least five presentations fell in each state; this reduced the number of neurons available, especially for the locomotion comparison. [[src|Methods]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'Locomotion suppresses sound-evoked responses in these neurons, but whisking does not.' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'In a log-log plot with a diagonal, what does a point below the line mean?', a: 'That the neuron\'s response was smaller during the behaviour on the vertical axis than in its absence.' },
                { t: 'check', id: 'c3', q: 'State the contrast between locomotion and whisking in Fig. 6 with the numbers.', a: 'Locomotion: median 0.17 against 0.34 ΔF/F, p = 0.002, n = 59, suppression. Whisking: 0.31 against 0.28 ΔF/F, p = 0.14, n = 367, no effect.' },
            ],
        },
    ],
};
