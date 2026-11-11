/* =============================================================
   Figure 1: whisking, twitch and pupil
   OKSAT · Interactive learning · Journal club: auditory cortex, spontaneous vs sound-evoked movements · chapter 3
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'behavior',
    review: 'draft',
    title: 'Figure 1: whisking, twitch and pupil',
    kicker: '3 · Figure 1',
    lede: 'Before any neuron is recorded, the authors show what a brief whisk looks like from the outside: a whole-body twitch followed by a slower pupil dilation that grows with the size of the whisk.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    tldr: [
        'Whiskers move together (median correlation 0.96), so tracking one whisker is enough to measure whisking.',
        'Brief whisks happen without running. Each comes with a small whole-body twitch, and the pupil peaks about half a second later (540 ms).',
        'An event-aligned average lines up hundreds of events at time zero so that the shared shape survives and noise averages out.',
        'Bigger whisks come with bigger body movements and bigger pupil dilations, which the authors read as three signs of one brain-state change.',
        'The correlations are modest (pupil R = 0.25), and the neuromodulator link is borrowed from earlier work, not measured here.',
    ],
    sections: [
        {
            id: 'f1-setup',
            n: '3.1',
            title: 'Three outside readouts of brain state',
            blocks: [
                { t: 'p', x: '**Asked:** how do you read a mouse’s internal state from outside, and are brief whisking bouts without running a clean marker of it? Panels A to E set up the three measurements used for the rest of the paper: wheel movement, pupil diameter and whisking. [[src|Results, Fig. 1A–E]]' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig1-ae.webp',
                    alt: 'Five-part figure. A: photograph of a head-fixed mouse on a curved wheel, labelled wheel movement in yellow. B: close-up video frame of an eye with an orange cross marking four points on the pupil rim, labelled pupil diameter in orange-red. C: face video frame with two whisker tips tracked and their positions drawn as arcs of purple and blue dots, labelled whisking in blue. D: two stacked traces, whisker 1 in purple and whisker 2 in blue, each a series of narrow peaks occurring at the same moments, with scale bars of 25 pixels and 1 second. E: a long 200-second trace set with whisking in blue, wheel movement in yellow and pupil diameter in orange-red; a dotted box at the left is enlarged above; small black dots under the baseline mark brief whisking events; three tall blocks to the right show whisking, wheel movement and pupil dilation rising together.',
                    label: 'Figure 1A–E · setup, tracking and a 200-second example',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 1A–E. CC BY 4.0; cropped.',
                },
                { t: 'h', x: 'How to read it' },
                {
                    t: 'kv',
                    rows: [
                        ['Panel A · the rig', 'Photograph of a head-fixed mouse on a freely turning polystyrene wheel. The wheel’s speed sensor supplies the yellow trace in later panels. [[src|Results, Fig. 1A]]'],
                        ['Panel B · the pupil', 'Video of one eye. The orange cross marks four tracked points on the rim of the pupil; diameter is the average distance between the two opposed pairs. Orange-red means pupil in every panel of the figure. [[src|Methods; Fig. 1B]]'],
                        ['Panel C · the whiskers', 'A video frame with the tips of two whiskers tracked. The coloured dots are where each tip was in every frame of a 17-second segment, so each arc is the sweep of one whisker. [[src|Fig. 1C legend]]'],
                        ['Panel D · two whiskers compared', 'x axis: time (bar 1 s). y axis: frame-to-frame change in tip position in pixels (bar 25 pixels). Purple is whisker 1, blue is whisker 2, same segment as C. A peak is a burst of movement; the two traces rise at the same moments. [[src|Fig. 1D legend]]'],
                        ['Panel E · everything at once', 'x axis: time (bar 5 s). y axis: each trace as a percentage of its own maximum in the session (bar 20%). Blue whisking, yellow wheel, orange-red pupil. The dotted box is enlarged above it (bar 1 s). Black dots under the baseline mark whisking events that occur outside locomotion and not within 10 s after it. [[src|Fig. 1E legend]]'],
                    ],
                },
                { t: 'h', x: 'What it shows' },
                { t: 'p', x: 'Simultaneously tracked whiskers were highly correlated (median Pearson r 0.96 ± 0.05 interquartile range), so they move together and tracking one whisker is enough to measure whisking. [[src|Results, Fig. 1D]]' },
                { t: 'p', x: 'The three long blocks at the right of panel E are locomotion: the wheel turns, whisking becomes vigorous and the pupil dilates. Everywhere else, the black dots mark brief whisking bouts that last a few hundred milliseconds with no running. Those brief bouts are the events the whole paper follows. [[src|Results, Fig. 1E]]' },
                {
                    t: 'deep',
                    title: 'Median ± interquartile range, and what a correlation of 0.96 means',
                    blocks: [
                        { t: 'p', x: 'The paper reports a median with its **interquartile range** (the spread of the middle half of the values) rather than a mean with a standard deviation, which suits data that are skewed. A **Pearson correlation** of 1 means two traces rise and fall in perfect proportion; 0 means no relationship. A median of 0.96 across whisker pairs is close to the ceiling. [[src|Results]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'One tracked whisker, the pupil and the wheel give three outside readouts, and brief whisks that occur without running are common enough to study as their own event. [[src|Results, Fig. 1]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Why can the authors measure whisking from a single whisker?', a: 'Simultaneously tracked whiskers moved together: the median correlation between them was 0.96, so one whisker carries nearly all the information.' },
                { t: 'check', id: 'c2', q: 'In trace E, what does a black dot under the baseline mean, and why do the authors want such events apart from running?', a: 'A whisking event that occurs outside locomotion and not within 10 s after it. Running comes with vigorous whisking and pupil dilation, so keeping the two apart lets a brief whisk be studied without running as a confounder.' },
            ],
        },
        {
            id: 'f1-timing',
            n: '3.2',
            title: 'Timing: who moves first, and what is a twitch',
            blocks: [
                { t: 'p', x: '**Asked:** around a run and around a brief whisk, in what order do whisking, the wheel and the pupil change, and how big is the pupil change in each case? Answering this needs one reading skill, the event-aligned average, so it is explained here and used for the rest of the guide. [[src|Results, Fig. 1F–H]]' },
                { t: 'check', id: 'c1', q: 'Predict: a mouse whisks once, briefly, with no running. Of whisking, the wheel and the pupil, which signal peaks last, and why might that be?', a: 'The pupil. It is a slow readout: the paper finds its maximum about half a second (540 ± 225 ms) after the whisk, while whisking and the wheel deflection coincide at time zero.' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig1-fh.webp',
                    alt: 'Three plots of averaged traces in blue (whisking), yellow (wheel) and orange-red (pupil), each with a lighter shaded band. F: two halves, run onsets on the left and run offsets on the right, with a scale of 5 percent and 1 second; at onset whisking rises first, then pupil, then wheel; at offset the wheel falls fastest, whisking falls over about a second and the pupil falls slowest. G: whisking events; a tall narrow blue spike at time zero with a small up-and-down wheel wiggle at the same moment and a broad orange-red pupil hump that peaks later, with separate scale bars of 2 and 4 percent and 0.5 seconds; a dotted box marks the flat baseline. H: the dotted region enlarged for whisking alone, a shallow dip before the spike, with letters a and b under two consecutive half-second stretches and a scale of 0.3 percent and 0.5 seconds.',
                    label: 'Figure 1F–H · event-aligned averages around runs and whisks',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 1F–H. CC BY 4.0; cropped.',
                },
                { t: 'h', x: 'The reading skill: an event-aligned average' },
                {
                    t: 'ol',
                    items: [
                        'Mark every occurrence of an event, for example the moment a run starts or a whisk peaks.',
                        'Cut out the signal in a window around each occurrence and line the windows up so that the event sits at time 0.',
                        'Average across occurrences. What is consistent from event to event survives; what is random cancels out.',
                        'The shaded band is the 95% confidence interval of that average: the range in which the true average probably lies. A narrow band means the events agreed; a wide band means they varied.',
                    ],
                },
                { t: 'h', x: 'How to read it' },
                {
                    t: 'kv',
                    rows: [
                        ['Panel F · runs', 'Left half aligned to the onset of running (n = 111 runs), right half to its offset (n = 110). Vertical bar 5%, horizontal bar 1 s. Each trace is a percentage of the session maximum. Wheel movement here is absolute: direction is ignored. [[src|Fig. 1F legend]]'],
                        ['Panel G · brief whisks', 'Aligned to the peak of the whisk (n = 743 whisking events). Blue whisking is read on the 4% bar, but wheel and pupil on the 2% bar, so the heights are not directly comparable. Horizontal bar 0.5 s. A downward wheel deflection means a backward wheel movement. [[src|Fig. 1G legend]]'],
                        ['Panel H · a closer look', 'The dotted region of G, whisking only (vertical bar 0.3%, horizontal bar 0.5 s). The letters a and b mark two consecutive 500 ms segments before the event; the authors compare whisking between them. [[src|Fig. 1H legend]]'],
                    ],
                },
                { t: 'h', x: 'What it shows' },
                { t: 'p', x: '**Runs.** Whisking tended to begin before locomotion (median 470 ± 619 ms, p < 10⁻¹³), and so did pupil dilation (265 ± 700 ms, p < 10⁻¹²). Whisking outlasted running by 625 ± 1,340 ms (p < 10⁻¹⁴), and the pupil kept constricting for 1,950 ± 1,665 ms afterwards (p < 10⁻¹⁹): the wheel stops first, whisking fades next, the pupil recovers last. [[src|Results, Fig. 1F]]' },
                { t: 'p', x: '**Brief whisks.** At time zero whisking and the wheel deflection coincide: even when the mouse does not run, the wheel sensor picks up a small back-and-forth movement, which the authors read as a whole-body **twitch**. The pupil peaks about half a second later (540 ± 225 ms, p < 10⁻⁴⁰). Pupil dilation with a twitch was small, 5.3 ± 5.8%, against 26.8 ± 16.2% with locomotion (p < 10⁻⁵⁰). [[src|Results, Fig. 1G]]' },
                { t: 'p', x: '**A small dip first.** A slight pupil constriction precedes the dilation and is mirrored by a very small but significant drop in whisking between segments a and b (p < 10⁻¹²). [[src|Results, Fig. 1H]]' },
                {
                    t: 'deep',
                    title: 'How to read median ± spread and the p values here',
                    blocks: [
                        { t: 'p', x: 'The spreads are wide: 470 ± 619 ms means individual runs vary a great deal, and some probably have whisking after locomotion starts. The claim is about the typical event, tested with a paired rank test, not that every event follows the order. The tiny p values reflect hundreds of events, not a large effect on any one. [[src|Results]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'A brief spontaneous whisk is a whole-body twitch at time zero followed by a slower pupil dilation about half a second later, roughly a fifth the size of the dilation that comes with running. [[src|Results, Fig. 1G]]' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'In an average of 743 aligned events the whisking spike is still sharp, but the noise around it has faded. Why?', a: 'The events are lined up on the spike, so what is the same in every event (the spike) adds up, while fluctuations that differ from event to event average toward zero.' },
                { t: 'check', id: 'c3', q: 'What does the shaded band around a trace in panels F to H tell you?', a: 'The 95% confidence interval of the average: the range in which the true average probably lies. A narrow band means events agreed; a wide band means they varied.' },
            ],
        },
        {
            id: 'f1-scaling',
            n: '3.3',
            title: 'Bigger whisk, bigger twitch, bigger dilation',
            blocks: [
                { t: 'p', x: '**Asked:** if whisking, twitching and pupil dilation are all outward signs of one change in brain state, do they grow together? Panel I shows every event as one row; panel J averages the smallest and largest fifths. [[src|Results, Fig. 1I–J]]' },
                { t: 'check', id: 'c1', q: 'Predict: if the three signals share one cause, what should change in the wheel and pupil traces as you move from the smallest to the largest whisks?', a: 'Both should grow with whisk size: a larger twitch on the wheel and a larger pupil dilation.' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/fig1-ij.webp',
                    alt: 'Left: three side-by-side colour heatmaps titled whisking, wheel movement and pupil diameter. Each row is one whisking event, ordered from smallest at the top to largest at the bottom, with time relative to the whisking event in seconds along the bottom. A colour bar runs from dark blue at the minimum through green to yellow at the maximum. A thin bright blue vertical line at time zero is visible in the whisking panel and gets brighter toward the bottom; the wheel panel is mostly teal with a faint line at time zero; the pupil panel brightens after time zero, more so near the bottom. Black rectangles outline the top and bottom fifths of rows. Right: averaged traces for the smallest fifth above and the largest fifth below, blue whisking, yellow wheel and orange-red pupil, with shaded bands and scale bars of 2 and 4 percent and 1 second; the lower set has a taller whisking spike, a deeper wheel wiggle and a larger pupil hump.',
                    label: 'Figure 1I–J · events ordered by size',
                    cap: 'Zimmer-Harwood et al., J Neurosci 2026, Fig. 1I–J. CC BY 4.0; cropped.',
                },
                { t: 'h', x: 'The reading skill: a trial-ordered heatmap' },
                {
                    t: 'ul',
                    items: [
                        'Each **row** is one event (here one whisk; in Figure 2, one tone presentation). The same time axis runs along every row, with the event at 0.',
                        'The **colour** is the size of the signal at that moment, read off the colour bar: dark blue minimum, yellow maximum.',
                        'The rows are **sorted** by something chosen by the authors. If the sorting variable matters, a pattern appears as you scan from top to bottom.',
                        'It is the raw data before averaging: you see every event, including the ones that do not follow the average. [[src|Methods; Fig. 1I legend]]',
                    ],
                },
                { t: 'h', x: 'How to read it' },
                {
                    t: 'kv',
                    rows: [
                        ['Panel I · whisking', 'x axis: time relative to the whisking event, -0.5 to 0.5 s. Rows: 743 whisking events, smallest at the top, largest at the bottom. The bright vertical line at 0 is the whisk. [[src|Fig. 1I]]'],
                        ['Panel I · wheel movement', 'Same rows, same order, -0.5 to 0.5 s. The wheel panel is mostly teal, with a faint line at 0. The legend does not say why the baseline is mid-scale; a signed measure with direction kept would explain it. [[src|Fig. 1I]]'],
                        ['Panel I · pupil diameter', 'Same rows, same order, but the time axis runs -1 to 1 s, since the pupil is slower. Brightening after 0 is dilation. [[src|Fig. 1I]]'],
                        ['Black rectangles', 'Outline the smallest fifth (top) and largest fifth (bottom) of events, n = 148 each; these are averaged in J. [[src|Fig. 1 legend]]'],
                        ['Panel J · averages', 'Top row of traces: smallest fifth. Bottom row: largest fifth. Blue whisking and orange-red pupil on the 4% and 2% scale bars as marked, yellow wheel; horizontal bar 1 s; bands are 95% confidence intervals. [[src|Fig. 1J legend]]'],
                    ],
                },
                { t: 'h', x: 'What it shows' },
                { t: 'p', x: 'Larger whisking events came with larger body movements (R = 0.39, p < 10⁻²⁷, Pearson; supplementary figure on the wheel) and with greater pupil dilation (R = 0.25, p < 10⁻¹¹). In J the lower set of traces shows a taller whisk, a deeper wheel wiggle and a larger pupil hump than the upper. [[src|Results, Fig. 1I–J; Fig. S2A–B]]' },
                {
                    t: 'deep',
                    title: 'Quintiles and a legend quirk',
                    blocks: [
                        { t: 'p', x: 'A **quintile** is a fifth of the events, 148 of 743. In the figure the smallest events are drawn on top; the legend words the labels the other way round (it calls the smallest the bottom quintile), so follow the labels printed on the figure. [[src|Fig. 1 legend]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'Whisking, body movement and pupil dilation scale together event by event, which the authors read as three outward signs of one change in brain state. [[src|Results, Fig. 1I–J]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'Squaring R gives the share of variation one signal accounts for: R = 0.25 is about 6% of the variance in pupil dilation, R = 0.39 about 15%. A shared cause is the authors’ reading; the link to neuromodulator release is borrowed from Collins et al. (2023), not measured here. [[src|Guide’s arithmetic from the R values; Results]]' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'In a trial-ordered heatmap such as panel I, what do a row, the horizontal position and the colour each stand for?', a: 'A row is one event, horizontal position is time relative to the event (0 is the event), and colour is the size of the signal at that moment, from the colour bar.' },
                { t: 'check', id: 'c3', q: 'The pupil correlates with whisk size at R = 0.25. How much of the variation is that, and what does it leave open?', a: 'About 6% (R squared). Most of the variation in dilation is unexplained by whisk size, and the shared-cause explanation (the neuromodulator link) rests on earlier work rather than a measurement here.' },
            ],
        },
    ],
};
