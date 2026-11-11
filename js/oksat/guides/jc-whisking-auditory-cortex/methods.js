/* =============================================================
   Methods, process by process
   OKSAT · Interactive learning · jc-whisking-auditory-cortex · chapter 2
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   Plan: plans/2026-11-10-jc-whisking-auditory-cortex.md.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'methods',
    review: 'draft',
    title: 'Methods, process by process',
    kicker: '2 · Methods',
    lede: 'How the animals were prepared, how whiskers and pupils were tracked, how sounds were played, how neurons were imaged, and how each whisking event was labelled and tested. Each technique is defined in one sentence the first time it appears.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    tldr: [
        'Head-fixed mice with a glass window over the right auditory cortex stand on a running wheel or sit in a tube, in a sound-attenuated chamber. Neurons are imaged in layers 2/3.',
        'Whiskers and pupil are filmed and tracked with a trained neural network (DeepLabCut). Whisking events are peaks outside running and the 10 s after it.',
        'Sounds are 200 ms pure tones, 2 to 64 kHz, at 40, 60 and 80 dB SPL.',
        'Two-photon calcium imaging reads neuron activity as ΔF/F, the change in brightness of a calcium sensor relative to baseline, after subtracting the surrounding neuropil signal.',
        'A whisking event is spontaneous if no whisk-triggering tone precedes it, and sound-triggered if an effective 80 dB tone just preceded it. Neurons are tested around each type, and the two are compared with an ROC analysis.',
    ],
    sections: [
        {
            id: 'm-1',
            n: '2.1',
            title: 'Animals and preparation',
            blocks: [
                { t: 'p', x: 'All mice were about 3 months old [[src|Methods, Animals]]. Imaging data came from mouse lines that express a calcium sensor called **GCaMP6** in excitatory neurons that carry the CaMKIIα marker. GCaMP is a fluorescent protein that gets brighter when it binds calcium, and calcium floods into a neuron when it fires [[src|Methods, Animals; Results]]. The recorded neurons were in cortical layers 2/3, 150 to 250 µm below the brain surface [[src|Methods, Calcium imaging]].' },
                {
                    t: 'steps',
                    items: [
                        { n: '1', x: 'Under isoflurane anaesthesia, a flap of skin was removed and a steel head post cemented to the skull. Mice that were only watched for behaviour got this alone.' },
                        { n: '2', x: 'For imaging, a 4 mm craniotomy was made over the right auditory cortex and a 4 mm glass coverslip, glued to a small steel cylinder, was set in place. The cylinder lets the glass press on the brain gently to limit movement during recording.' },
                        { n: '3', x: 'At least 1 week of recovery before any recording.' },
                    ],
                    label: 'Preparation',
                    cap: 'Order from the paper\'s methods; [[src|Methods, Surgeries]].',
                },
                { t: 'p', x: 'Recording conditions: the head is fixed, and the mouse either stands on a freely rotating polystyrene wheel coated in foam to quiet its footsteps, or sits in a clear acrylic tube. Everything happened in a sound-attenuated chamber. Sessions with no imaging were moderately lit, to avoid permanent dilation of the pupil. Imaging was done in the dark [[src|Methods, Whisker, pupil and locomotion recording; Results]].' },
                { t: 'p', x: 'Which mice fed which figure: Fig. 1 came from three male mice, the right side of Fig. 2A from two female mice, and the rest from three male mice [[src|Methods, Animals]].' },
                {
                    t: 'figure',
                    src: 'images/oksat/jc-whisking-auditory-cortex/movie1.webp',
                    alt: 'A still from the paper\'s Movie 1. Top left, a mouse face with whiskers; top right, a close-up of one eye with the pupil dark in the centre. Below, three traces over time: whisker movement in blue with sharp spikes, pupil diameter in red-orange rising slowly after each spike, and wheel movement in yellow as small marks.',
                    label: 'Figure · what the cameras see',
                    cap: 'Face camera, eye camera and the matching whisking, pupil and wheel traces. Played at half speed in the original. Zimmer-Harwood et al., J Neurosci 2026, Movie 1 (still). CC BY 4.0; cropped.',
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Keep',
                    blocks: [
                        { t: 'p', x: 'The window and tube allow behaviour and neurons to be recorded together in a head-fixed animal, at the price of a constrained, artificial situation.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'What is a calcium indicator such as GCaMP, and why does a brighter signal mean a neuron fired?', a: 'A fluorescent protein that gets brighter when it binds calcium. Calcium flows into a neuron when it fires, so brightness rises with activity.' },
                { t: 'check', id: 'c2', q: 'Why were recordings without imaging done in a moderately lit room rather than in the dark?', a: 'To avoid permanent dilation of the pupil, since the pupil is one of the readouts being measured.' },
            ],
        },
        {
            id: 'm-2',
            n: '2.2',
            title: 'Tracking behaviour',
            blocks: [
                { t: 'p', x: 'A high-speed camera recorded the whiskers at 200 frames per second (30 in the remaining data) with a down-facing camera lit by infrared illuminators. A second camera recorded the pupil. The wheel\'s speed came from an optical sensor [[src|Methods, Whisker, pupil and locomotion recording]].' },
                { t: 'p', x: 'The tracking itself uses **DeepLabCut**, a program that trains a neural network on a few hand-marked frames and then marks the same body parts automatically in every frame. It followed 4 points on the rim of the pupil and the tips of 1 to 3 whiskers [[src|Methods, Data analysis]].' },
                {
                    t: 'kv',
                    rows: [
                        ['Whisker trace', 'Frame-to-frame change in tip position, averaged over the tracked whiskers. A burst of movement gives a spike [[src|Methods, Data analysis]].'],
                        ['Pupil diameter', 'The average of two distances between pairs of points on the rim, one pair horizontal and one vertical [[src|Methods, Data analysis]].'],
                        ['Locomotion', 'Wheel speed above 3 cm/s [[src|Methods, Data analysis]].'],
                        ['Units', 'Pupil, whisker and wheel traces are plotted as a percentage of the maximum seen in the same session, so they can share one scale [[src|Methods, Data analysis]].'],
                    ],
                },
                { t: 'check', id: 'c1', q: 'Predict first. Why might it be enough to track just one whisker?', a: 'If all the whiskers move together, one tip represents them all. The authors report a median correlation of 0.96 across simultaneously tracked whiskers, so tracking one is sufficient.' },
                { t: 'p', x: 'The check above is answered in the paper: whiskers moved together with a median Pearson correlation of 0.96 ± 0.05 (interquartile range, the spread of the middle half of the values) [[src|Results, Fig. 1D]].' },
                {
                    t: 'h',
                    x: 'Finding a whisking event',
                },
                {
                    t: 'ol',
                    items: [
                        'Smooth the whisker trace with a Gaussian window 100 ms wide.',
                        'Find peaks in the smoothed trace with Matlab\'s findpeaks function.',
                        'Discard peaks during locomotion and in the 10 s after it ends.',
                        'Discard peaks within 2 s of another whisking event.',
                    ],
                },
                { t: 'p', x: 'Those rules are from [[src|Methods, Data analysis]]. What is left are brief, isolated whisks that happen without running.' },
                {
                    t: 'deep',
                    title: 'Why the 10 s and 2 s exclusions?',
                    blocks: [
                        { t: 'p', x: 'The 10 s buffer keeps the slow aftermath of running, such as the pupil that stays dilated for seconds, from being mistaken for a whisking event [[src|Methods, Data analysis]]. The 2 s rule makes each event distinct, so one event\'s response does not overlap the next. The paper does not give a separate rationale; this is the guide\'s reading of the rules.' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'List the filters a whisker peak must pass to count as a whisking event.', a: 'A peak in the 100 ms Gaussian-smoothed trace; not during locomotion or in the 10 s after it; not within 2 s of another whisking event.' },
                { t: 'check', id: 'c3', q: 'Why are the pupil, whisker and wheel traces all expressed as a percentage of the session maximum?', a: 'Because the raw units differ (pixels, speed, diameter), a per-session percentage puts the three on one comparable scale and normalises across animals and sessions.' },
            ],
        },
        {
            id: 'm-3',
            n: '2.3',
            title: 'Playing the sounds',
            blocks: [
                { t: 'p', x: 'The main stimulus is a **pure tone**, a single frequency with no other components. Each lasted 200 ms with 10 ms ramps at the start and end so there is no click. Frequencies ran from 2 to 64 kHz in 1/3-octave steps, at 40, 60 and 80 dB SPL, in random order with a new tone every 1.5 s [[src|Methods, Sound presentation]].' },
                {
                    t: 'kv',
                    rows: [
                        ['Octave steps', 'An octave is a doubling of frequency. In 1/3-octave steps, three equal steps (on a log scale) make one doubling.'],
                        ['dB SPL', 'Sound pressure level, a logarithmic scale of sound pressure. Larger is louder.'],
                        ['Second dataset', 'The right-hand data in Fig. 2A used 2 to 32 kHz in 1/6-octave steps at 40, 50 and 60 dB SPL every 1 s [[src|Methods, Sound presentation]].'],
                    ],
                },
                { t: 'p', x: 'The sounds came from a free-field electrostatic speaker placed about 10 cm in front of the head, calibrated for a flat response within ±2 dB across the frequencies used [[src|Methods, Sound presentation]].' },
                { t: 'p', x: 'A different stimulus was used only to find the auditory areas. Amplitude-modulated tones, 500 ms long and modulated at 10 Hz, were played at 55 or 65 dB SPL at four frequencies, two low (4.00 and 5.04 kHz) and two high (25.4 and 32.0 kHz). **Widefield imaging**, which records the whole cortical surface at low resolution, then identified the cortical subfields before two-photon imaging [[src|Methods, Sound presentation; Calcium imaging]].' },
                { t: 'check', id: 'c1', q: 'Why were the tones ramped on and off over 10 ms rather than switched on abruptly?', a: 'An abrupt onset or offset adds a broadband click to the tone. Ramps keep the stimulus a clean single frequency.' },
                { t: 'check', id: 'c2', q: 'What purpose did the amplitude-modulated tones serve, and what did the pure tones serve?', a: 'Modulated tones with widefield imaging identified auditory cortical subfields (A1 and the anterior auditory field). The pure tones were the experimental stimuli for the behaviour and for the neurons.' },
            ],
        },
        {
            id: 'm-4',
            n: '2.4',
            title: 'Imaging and the signal',
            blocks: [
                { t: 'p', x: '**Two-photon calcium imaging** uses a pulsed infrared laser. A fluorescent molecule is excited only at the focus, where two photons arrive together, so the laser can reach into tissue and record single cells. Here, the laser was tuned to 940 nm and scanned 512 × 512 pixel frames over a 600 × 600 µm field about 30 times a second [[src|Methods, Calcium imaging]].' },
                { t: 'p', x: 'Frames were collected through a 20× objective by a **resonant scanner**, a mirror that oscillates at 8 kHz, which is fast but makes a sound. The sound at the mouse\'s head was below 40 dB SPL [[src|Methods, Calcium imaging]]. Recordings were made in the primary auditory cortex (A1) and the anterior auditory field (AAF), two cortical subfields identified by widefield imaging [[src|Methods; Results]].' },
                {
                    t: 'h',
                    x: 'From pixels to a neuron\'s trace',
                },
                {
                    t: 'steps',
                    items: [
                        { n: '1', x: 'Registration: correct each frame for brain movement, using the Python package suite2p.' },
                        { n: '2', x: 'Segmentation: suite2p outlines individual neurons from the correlated brightness of pixels.' },
                        { n: '3', x: 'Neuropil correction: **neuropil** is the fluorescence from the tangle of dendrites and axons around every cell body, which bleeds into the cell\'s signal. The paper uses a coefficient of 0.7 for it, the usual way being to subtract that fraction of the neighbouring neuropil trace.' },
                        { n: '4', x: 'Normalisation: **ΔF/F** is the change in fluorescence divided by a baseline, F₀. A value of 1 means the neuron is twice as bright as baseline. F₀ was the median of the whole trace after dropping the values below the 10th and above the 70th percentile.' },
                    ],
                    label: 'Signal pipeline',
                    cap: 'Steps after [[src|Methods, Calcium imaging]]. Beyond the 0.7 coefficient and the F₀ rule, the descriptions of steps 2 and 3 are general practice, not stated in the paper.',
                },
                {
                    t: 'deep',
                    title: 'Why a median baseline?',
                    blocks: [
                        { t: 'p', x: 'Neurons are active only part of the time, so the median is dominated by quiet frames and sits near the resting brightness. Leaving out the brightest and dimmest values makes F₀ ignore bursts of activity [[src|Methods, Calcium imaging]]. That is the idea behind the choice; the paper states the rule, not the reasoning.' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'Two things to weigh, neither stated as a limitation by the authors. First, calcium indicators smooth spikes in time: ΔF/F rises quickly but decays slowly, so timing claims within a fraction of a second are coarse. Second, the 8 kHz scanner tone sits inside the band that best drove whisking in this study (about 3 to 20 kHz), although its level, below 40 dB SPL, is under the 50 dB at which tone-triggered whisking was first measurable [[src|Methods; Results, Fig. 2A]].' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'In one sentence each, what do two-photon imaging and ΔF/F do?', a: 'Two-photon imaging uses a pulsed infrared laser to excite a fluorescent calcium sensor in single neurons deep in tissue. ΔF/F is a neuron\'s fluorescence change expressed relative to its baseline brightness.' },
                { t: 'check', id: 'c2', q: 'What is neuropil, and why is its signal subtracted?', a: 'The mesh of dendrites and axons around cell bodies. Its fluorescence contaminates each cell\'s signal, so a fraction of it (a 0.7 coefficient here) is subtracted to isolate the cell\'s own activity.' },
                { t: 'check', id: 'c3', q: 'Why might timing conclusions from calcium imaging be coarse?', a: 'The indicator\'s fluorescence decays slowly compared with the spikes that cause it, so exact spike times blur and fast sequences are not resolved.' },
            ],
        },
        {
            id: 'm-5',
            n: '2.5',
            title: 'Classifying events and the statistics',
            blocks: [
                { t: 'check', id: 'c1', q: 'Predict first. Every 1.5 s a tone plays and some of them make the mouse whisk. How would you decide which whisking events are spontaneous and which are sound-triggered?', a: 'Spontaneous events should not follow a tone that is known to cause whisking. Sound-triggered events should follow such a tone closely. Events that fit neither should be left out because their cause is ambiguous.' },
                { t: 'p', x: 'The authors reasoned the same way, and added a stringency rule for the sound-triggered group. Each event gets one of three labels [[src|Methods, Data analysis]].' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Spontaneous',
                            blocks: [
                                { t: 'p', x: 'The event did not occur within 1 s after the onset of a tone whose frequency-level combination causes a significant increase in whisking. Significance is p < 0.05 on a **Wilcoxon signed rank test**, a rank-based paired test, here comparing mean whisker movement 500 ms before onset with 300 ms after [[src|Methods, Data analysis]].' },
                            ],
                        },
                        {
                            h: 'Sound-triggered',
                            blocks: [
                                { t: 'p', x: 'The event occurred within 1 s of an 80 dB SPL tone at a frequency that reliably triggers whisking (p < 0.001, only 80 dB SPL tones). These tone-and-level combinations are called "above-threshold trials" [[src|Methods, Data analysis]].' },
                            ],
                        },
                    ],
                },
                { t: 'p', x: 'Events that fall in neither category are discarded. The aim is that spontaneous events cannot be a hidden effect of tones, and that sound-triggered events are the clearest cases [[src|Methods, Data analysis]]. The rule itself is drawn in Fig. 3C, which appears in the neurons chapter.' },
                {
                    t: 'h',
                    x: 'Testing the neurons',
                },
                {
                    t: 'ul',
                    items: [
                        '**Modulated?** A neuron counts as modulated if its fluorescence differs across the 70 frames around the events (20 before, 50 after) with p < 0.001 on a **Kruskal-Wallis test**, a rank-based test of whether several groups differ, with each frame as a group [[src|Methods, Data analysis]].',
                        '**ROC analysis.** For each time point, a **receiver operating characteristic (ROC)** curve is built from the neuron\'s activity around spontaneous events against that around sound-triggered ones. The **area under the curve (AUC)** summarises how well activity separates the two groups; 0.5 is no separation. A time point counts if its AUC exceeds the AUC of 100 shuffled-label controls by more than 3 standard deviations [[src|Methods, Data analysis]].',
                    ],
                },
                {
                    t: 'sequence',
                    id: 's1',
                    q: 'Put the analysis pipeline in order, from raw video to the per-neuron comparison.',
                    items: [
                        'Track whiskers and pupil in the video',
                        'Find whisking events outside locomotion',
                        'Find tone combinations that trigger whisking',
                        'Label each event spontaneous, sound-triggered or discard',
                        'Test each neuron around each event type',
                        'Run the ROC analysis per neuron',
                    ],
                },
                {
                    t: 'deep',
                    title: 'Why shuffle labels in the ROC control?',
                    blocks: [
                        { t: 'p', x: 'With a finite number of events, AUC wanders away from 0.5 by chance. The control reassigns the spontaneous and sound-triggered labels at random, 100 times, to see how far AUC wanders when the labels mean nothing, then asks whether the real AUC lies beyond that spread by 3 standard deviations [[src|Methods, Data analysis]].' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'Tones played every 1.5 s, so a "spontaneous" event still happens among tones. The definition guarantees only that no whisk-triggering tone came in the second before it. The label means "not followed a whisk-triggering tone", not "occurred in silence".' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'State the rule that makes a whisking event sound-triggered.', a: 'It occurred within 1 s of the onset of an 80 dB SPL tone whose frequency reliably triggers whisking (p < 0.001, "above-threshold trials").' },
                { t: 'check', id: 'c3', q: 'An AUC of 0.5 for one neuron means what, and what would a clear difference between event types look like?', a: 'A value of 0.5 means that its activity does not separate spontaneous from sound-triggered events. A clear difference gives an AUC well away from 0.5 that exceeds the shuffled-control spread.' },
            ],
        },
    ],
};
