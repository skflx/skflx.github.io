/* =============================================================
   Figure 2: pure tones trigger whisking
   OKSAT · Interactive learning · Journal club: auditory cortex, spontaneous vs sound-evoked movements · chapter 4
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'sound',
    review: 'draft',
    title: 'Figure 2: pure tones trigger whisking',
    kicker: '4 · Figure 2',
    lede: 'A near-identical whisk can also be produced by a sound. This figure asks which tones do it, how reliably, and whether the response wears out or depends on what just happened.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    tldr: [
        'Pure tones make mice whisk when their frequency lies in the most sensitive part of mouse hearing, about 3 to 20 kHz.',
        'The effect is measurable at 50 dB SPL and the responsive band widens at 80 dB SPL.',
        'In one session, at 80 dB SPL in the effective band, all but four trials showed a sound-locked whisk; onset was 67 to 100 ms after the tone.',
        'The response does not habituate across a session (p = 0.79) but is smaller right after another loud tone and larger when the mouse was already whisking.',
        'This sets up the central comparison: the same outward whisk can be spontaneous or sound-triggered.',
    ],
    sections: [
        {
            id: 'f2-tuning',
            n: '4.1',
            title: 'Which tones make a mouse whisk',
            blocks: [
                { t: 'p', x: '**Asked:** if you play pure tones of many frequencies at several levels, which combinations evoke whisking? [[src|Results, Fig. 2A]]' },
                { t: 'check', id: 'c1', q: 'Predict: the tones range from 2 to 64 kHz at 40, 60 and 80 dB SPL. At which frequencies, and at which levels, would you expect whisking to appear?', a: 'Within the most sensitive part of the mouse hearing range, about 3 to 20 kHz. Louder tones should evoke whisking over a wider range of frequencies, and the quiet 40 dB SPL tones should evoke little or none.' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig2-a.webp',
                    alt: 'Two sets of stacked blue traces. Left: three rows labelled 80, 60 and 40 dB SPL, frequency on a logarithmic axis from 2 to 64 kHz with ticks at 2, 4, 8, 16, 32 and 64. The 80 dB row has a series of tall narrow peaks between about 3 and 20 kHz, tallest near 10 to 13 kHz; the 60 dB row has smaller peaks between about 8 and 20 kHz drawn in thicker line; the 40 dB row is flat. A scale bar of 10 percent and 1 second sits at the right. Right: a mouse head cartoon with whiskers and a loudspeaker, then three rows labelled 60, 50 and 40 dB SPL on an axis from 2 to 32 kHz; the 60 dB row has a series of small peaks from about 6 to 20 kHz, the 50 dB row has smaller thick-line peaks between about 7 and 18 kHz, and the 40 dB row is nearly flat.',
                    label: 'Figure 2A · whisking by tone frequency and level',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 2A. CC BY 4.0; cropped.',
                },
                { t: 'h', x: 'How to read it' },
                {
                    t: 'kv',
                    rows: [
                        ['x axis · frequency', 'Pure-tone frequency in kHz on a logarithmic scale: 2, 4, 8, 16, 32, 64 are equally spaced, so each step is a doubling (an octave). Left: 2 to 64 kHz in one-third-octave steps. Right: 2 to 32 kHz in one-sixth-octave steps. [[src|Methods; Fig. 2A]]'],
                        ['Rows · level', 'Sound level in dB SPL, a logarithmic scale of sound pressure; higher is louder. Left: 80, 60, 40. Right: 60, 50, 40. Each row is one level. [[src|Methods; Fig. 2A]]'],
                        ['Each blue trace · a tone', 'The mean whisking in the seconds around a tone of that frequency and level, laid out along the frequency axis. A bump is whisking evoked by that tone. Bar at right: 10% of the session maximum and 1 s. [[src|Fig. 2A legend]]'],
                        ['Thick versus thin', 'Thick segments mark combinations with a statistically significant increase in whisking (p < 0.05, Wilcoxon signed rank test). Thin segments are not significant. [[src|Fig. 2A legend]]'],
                        ['n', 'Left: 234 to 254 tone presentations per combination, across three mice and sessions. Right: 120 presentations per combination, mice in an acrylic tube rather than on the wheel. [[src|Fig. 2A legend]]'],
                    ],
                },
                { t: 'h', x: 'What it shows' },
                { t: 'p', x: 'Pure tones evoked whisking when their frequency lay in the most sensitive region of the mouse hearing range, between about 3 and 20 kHz. At 80 dB SPL a greater range of frequencies triggered whisking, on almost every tone; at 60 dB SPL the band is narrower; significant increases were already present at 50 dB SPL, and perhaps below. Earlier reports had stressed broadband sounds; here the stimulus is a single frequency. [[src|Results, Fig. 2A; Discussion]]' },
                {
                    t: 'deep',
                    title: 'Why the band changes with level',
                    blocks: [
                        { t: 'p', x: 'The authors note that these level-dependent changes in the frequency tuning of whisking resemble the broadening of frequency selectivity in the mouse auditory periphery. This is their comparison, not something the figure tests. [[src|Discussion]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'A single pure tone can trigger whisking when it lies within about 3 to 20 kHz, and the responsive band widens as the tone gets louder. [[src|Results, Fig. 2A]]' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'What does a thick segment of a trace in panel A mean, and what does the thin line mean?', a: 'Thick: that frequency and level combination produced a statistically significant increase in whisking (p below 0.05). Thin: no significant increase.' },
                { t: 'check', id: 'c3', q: 'Why are 2, 4, 8, 16 and 32 equally spaced on the x axis?', a: 'The axis is logarithmic: each step is a doubling of frequency, an octave, so equal distance means equal ratio.' },
            ],
        },
        {
            id: 'f2-reliability',
            n: '4.2',
            title: 'Reliability: every trial in one session',
            blocks: [
                { t: 'p', x: '**Asked:** an average can hide inconsistency. In one recording session, how many individual tone presentations are followed by a whisk? The figure shows every trial. The reading skill is the one from section 3.3, a trial-ordered heatmap, now with a different sort order. [[src|Results, Fig. 2B–C]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig2-b.webp',
                    alt: 'One tall colour heatmap. Each row is one tone presentation; time from minus 1 to 1 second runs along the bottom with a dashed grey vertical line at time zero. Colours run from dark blue (low whisking) to yellow (high). A grey bar on the left labels three blocks 40, 60 and 80 dB SPL, from top to bottom; a grey-scale column on the right marks frequency from 2 to 64 kHz, repeated within each block, dark at 2 kHz to light at 64 kHz. The 40 dB block is almost uniformly dark blue. The 60 dB block has a small patch of brighter colour after time zero around 16 kHz. In the 80 dB block, a pink rectangle encloses a band of rows between about 8 and 20 kHz with a bright cluster of yellow and green just after time zero.',
                    label: 'Figure 2B · one session, all trials',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 2B. CC BY 4.0; cropped.',
                },
                { t: 'h', x: 'How to read it: panel B' },
                {
                    t: 'kv',
                    rows: [
                        ['Rows', 'One row per tone presentation. Time runs along each row, with tone onset at the dashed grey line (0 s), from -1 to 1 s. [[src|Fig. 2B legend]]'],
                        ['Colour', 'Whisking amplitude: dark blue minimum, yellow maximum. A bright patch after 0 is a whisk that follows the tone. [[src|Fig. 2B legend]]'],
                        ['Sort order', 'First by level (grey bar at the left: 40, 60 and 80 dB SPL), then within each level by frequency (grey-scale column at the right, 2 to 64 kHz, repeated in each block). [[src|Fig. 2B legend]]'],
                        ['Pink rectangle', 'The above-threshold trials: tones at 80 dB SPL whose frequency reliably triggered whisking (p < 0.001). In this session that was 8 to 20.15 kHz. [[src|Fig. 2B legend]]'],
                    ],
                },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig2-ce.webp',
                    alt: 'Three stacked plots. C: top, a heatmap of the trials inside the pink rectangle with trial number on the vertical axis (ticks 10, 30, 50, 70), time from minus 1 to 1 seconds and a dashed grey line at zero, with a thin crimson-outlined strip at the top for the weakest rows; middle, those weakest 12 trials enlarged on a different colour scale with ticks at 5 and 10; bottom, two line traces of whisking amplitude as percent of maximum against time, a black one that stays low and a blue one with a peak near 10 percent just after time zero. D: a black line with grey band of mean whisking amplitude against trial number from about 10 to 60, roughly flat between 10 and 20 percent. E: two traces, red and blue, with a scale of 10 percent and 1 second: the red trace has a large peak and then a second slightly smaller peak, the blue trace has only a single peak that is taller than the red second peak; small coloured ticks under the axis mark tone onsets.',
                    label: 'Figure 2C–E · above-threshold trials, habituation and history',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 2C–E. CC BY 4.0; cropped. Panels D and E are read in section 4.3.',
                },
                { t: 'h', x: 'How to read it: panel C' },
                {
                    t: 'kv',
                    rows: [
                        ['Top', 'The same rows as the pink rectangle, but now sorted by the amplitude of the whisker movement and plotted as trial number against time (tone at the dashed line). Colour bar at the left: Min to Max. [[src|Fig. 2C legend]]'],
                        ['Middle', 'The 12 trials with the smallest whisker movement, enlarged on a different colour scale so faint responses become visible. [[src|Fig. 2C legend]]'],
                        ['Bottom', 'Average whisking trace (percent of maximum) against time. Black: the average of trials 1 to 4. Blue: trial 5 alone. [[src|Fig. 2C legend]]'],
                    ],
                },
                { t: 'h', x: 'What it shows' },
                { t: 'p', x: 'At 40 dB SPL almost nothing happens, at 60 dB SPL there is a small patch, and at 80 dB SPL in the effective band the response is clear in nearly every row. Inside the pink rectangle, all but four trials appeared to include a sound-locked whisk; the four exceptions are trials 1 to 4 of the weakest 12, and the black trace shows no sound-locked peak while trial 5 (blue) does. On average whisking began 67 to 100 ms after the tone, that is in the third video frame after sound onset. [[src|Results, Fig. 2B–C]]' },
                {
                    t: 'deep',
                    title: 'Why the middle strip has its own colour scale',
                    blocks: [
                        { t: 'p', x: 'A shared colour scale is set by the largest values, so weak whisks look dark. Re-plotting the 12 weakest trials on a scale of their own lets a reader judge by eye whether a small response is locked to the tone rather than noise. The legend notes this change of scale. [[src|Fig. 2C legend]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Discussant’s note',
                    blocks: [
                        { t: 'p', x: 'The paper places startle at the loud end of one spectrum of sound-evoked movements, with subtler facial movements at lower levels. It does not compare the latency of this whisk with a startle reflex, so whether it is a gentler member of that family or a different response is left open. [[src|Introduction; Discussion]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'In the effective band at 80 dB SPL the sound-locked whisk is close to all-or-none and begins within about 67 to 100 ms. [[src|Results, Fig. 2B–C]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'In panel B, what are the rows and what two variables sort them?', a: 'One row is one tone presentation. They are sorted by sound level (40, 60, 80 dB SPL blocks) and, within each block, by tone frequency (2 to 64 kHz).' },
                { t: 'check', id: 'c2', q: 'What does the pink rectangle select, and what do the rows inside show?', a: 'Above-threshold trials: 80 dB SPL tones at frequencies that reliably triggered whisking (p below 0.001; 8 to 20.15 kHz in this session). Nearly all of its rows show a whisk right after the tone; only four trials appeared not to.' },
                { t: 'check', id: 'c3', q: 'Why is a heatmap of every trial more convincing for reliability than an average trace?', a: 'An average could be produced by a few large responses and many absent ones. The heatmap shows every trial, so you can see directly how many show the response.' },
            ],
        },
        {
            id: 'f2-history',
            n: '4.3',
            title: 'Habituation and stimulus history',
            blocks: [
                { t: 'p', x: '**Asked:** does the sound-evoked whisk wear out over a session, and does it depend on what happened just before the tone? Panels D and E answer one question each. [[src|Results, Fig. 2D–E]]' },
                { t: 'h', x: 'How to read it' },
                {
                    t: 'kv',
                    rows: [
                        ['Panel D · across the session', 'x axis: trial number within the session (about 10 to 60). y axis: mean whisking amplitude as a percentage of the session maximum. Black line is the mean over 14 recording sessions in three mice; the grey band is the 95% confidence interval. Only above-threshold trials. [[src|Fig. 2D legend]]'],
                        ['Panel E · across seconds', 'An event-aligned average of whisking (bar 10% and 1 s) around above-threshold tones. Red: trials that were themselves preceded by an above-threshold trial (n = 191), with the earlier tone as the first red tick. Blue: trials that were not (n = 1,288). Ticks under the axis mark tone onsets. Bands are 95% confidence intervals. [[src|Fig. 2E legend]]'],
                    ],
                },
                { t: 'h', x: 'What it shows' },
                { t: 'p', x: '**Over a session.** Habituation is a gradual decline in response to a repeated stimulus. Sound-triggered whisking did not decline across a session (p = 0.79, Mann–Kendall trend test): the black line in D stays flat and the mice remain responsive after dozens of presentations. [[src|Results, Fig. 2D]]' },
                { t: 'p', x: '**Over seconds.** Mean amplitude was smaller when a trial was immediately preceded by another loud tone, 11.9 ± 10.3% against 15.5 ± 11.3% (p < 10⁻⁶, Wilcoxon rank sum test); in E the red second peak sits below the blue one. [[src|Results, Fig. 2E]]' },
                { t: 'p', x: '**State.** Using only trials not preceded by a loud tone, the amplitude of the whisk correlated with mean whisking in the 2 s before the trial (R = 0.25, p < 10⁻¹⁹): higher baseline arousal favours a stronger sound-triggered whisk, as the authors read it. This correlation is reported in the text, not drawn in a panel. [[src|Results]]' },
                {
                    t: 'deep',
                    title: 'What the Mann–Kendall test does',
                    blocks: [
                        { t: 'p', x: 'It asks whether a series, here amplitude against trial number, drifts steadily up or down. A large p value (0.79) means no detectable steady drift. It does not prove there is no habituation: it fails to find any in this data. [[src|Results, Fig. 2D]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'Sound-triggered whisking is reliable, tuned and does not habituate across a session, yet it is smaller right after a loud tone and larger when the mouse was already more aroused. [[src|Results, Fig. 2D–E]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What does the flat line in panel D tell you, and what test supports it?', a: 'Whisking amplitude did not change over trial number, so no habituation across a session. The Mann–Kendall trend test gave p = 0.79.' },
                { t: 'check', id: 'c2', q: 'What two groups of trials are compared in panel E, and which whisks are larger?', a: 'Above-threshold trials that were preceded by another above-threshold trial (red, n = 191) against those that were not (blue, n = 1,288). The not-preceded whisks are larger: 15.5% against 11.9%.' },
                { t: 'check', id: 'c3', q: 'The response does not habituate, but it is still not constant. Name two things the authors found that change its size.', a: 'A loud tone immediately before makes it smaller (short time scale), and more whisking in the preceding 2 s makes it larger (R = 0.25), which the authors read as higher baseline arousal.' },
            ],
        },
    ],
};
