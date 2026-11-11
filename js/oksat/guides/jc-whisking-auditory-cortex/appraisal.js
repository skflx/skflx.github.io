/* =============================================================
   Conclusions and appraisal
   OKSAT · Interactive learning · JC · whisking and auditory cortex · chapter 6
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'appraisal',
    review: 'draft',
    title: 'Conclusions and appraisal',
    kicker: '6 · Conclusions and appraisal',
    lede: 'What the authors conclude, what they say could explain it, and, kept apart in marked callouts, how far this guide thinks each conclusion can be trusted.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    tldr: [
        'The authors claim six things: whisks outside running come with a twitch and a later pupil dilation; pure tones trigger the same whisks; a subset of auditory cortex neurons track spontaneous whisks; many of those respond differently to sound-triggered whisks; whisking, unlike locomotion, does not change sound responses; so the cause and context of a movement matter.',
        'The Discussion offers three candidate drivers for the difference: arousal-related neuromodulation, corollary discharge from motor cortex, and direct acoustic drive in some neurons. The paper measures none of them directly.',
        'Sound-triggered whisks are defined by an 80 dB tone, so whisk context and loud-tone presence are confounded unless each neuron is compared on whisk-free loud tones.',
        'Appraisal notes in this chapter are the guide\'s own and sit only in callouts labelled Appraisal or Discussant\'s note.',
    ],
    sections: [
        {
            id: 'ap-claims',
            n: '6.1',
            title: 'The six conclusions',
            blocks: [
                { t: 'p', x: 'This section lists what the authors conclude, each with the figure that carries it and the evidence behind it. The wording follows the paper\'s Results and Discussion. [[src|Discussion]]' },
                { t: 'check', id: 'c1', q: 'Predict first. Say the paper\'s central claim in one sentence, before you read the table.', a: 'Many auditory cortex neurons that are modulated by spontaneous whisking do not respond, or respond differently, when near-identical whisking is triggered by sound, so the context and underlying driver of a movement decide whether and how it modulates auditory cortex.' },
                {
                    t: 'table',
                    wide: true,
                    head: ['Claim', 'Figure', 'Evidence behind it'],
                    rows: [
                        ['Claim 1. Brief whisks outside locomotion come with a whole-body twitch and a later pupil dilation that scales with whisk size.', 'Fig. 1', '743 whisking events; pupil peaks 540 ± 225 ms after the whisk; dilation 5.3 ± 5.8% with a twitch against 26.8 ± 16.2% with locomotion. [[src|Results, Fig. 1]]'],
                        ['Claim 2. Pure tones in the sensitive band trigger near-identical whisks, down to 50 dB SPL, without habituation.', 'Fig. 2', 'Effective band about 3 to 20 kHz; no change across a session (p = 0.79). [[src|Results, Fig. 2]]'],
                        ['Claim 3. About 6% of layer 2/3 excitatory auditory cortex neurons are modulated around spontaneous whisks.', 'Figs. 3 and 4', '399 of 6,359 neurons across 14 sessions in three mice. [[src|Results, Fig. 4]]'],
                        ['Claim 4. Many of those do not respond, or respond differently, when the whisk is sound-triggered.', 'Figs. 4 and 5', 'En cell 160 neurons; 175 of 399 separable by the ROC test. [[src|Results, Figs. 4, 5]]'],
                        ['Claim 5. Whisking, unlike locomotion, does not change sound-evoked responses.', 'Fig. 6', 'Locomotion 0.17 against 0.34 ΔF/F, p = 0.002; whisking 0.31 against 0.28, p = 0.14. [[src|Results, Fig. 6]]'],
                        ['Claim 6. So the cause and context of a movement, not the movement alone, set its signature in auditory cortex.', 'Figs. 4 to 6', 'The authors\' inference from Claims 3 to 5 together; no single figure manipulates cause directly. [[src|Discussion]]'],
                    ],
                },
                {
                    t: 'call',
                    k: 'pearl',
                    label: 'Conclusion',
                    blocks: [
                        { t: 'p', x: 'The paper\'s chain runs from behaviour (Claims 1 and 2), to a subset of neurons (Claim 3), to the difference between spontaneous and sound-triggered whisks (Claim 4), to a control (Claim 5), to the general lesson (Claim 6).' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'Which figures carry Claim 4, and what two numbers best summarise it?', a: 'Figs. 4 and 5: 160 neurons are excited by spontaneous but not significantly modulated by sound-triggered whisking, and 175 of 399 neurons are separable by the ROC test.' },
                { t: 'check', id: 'c3', q: 'What contrast makes Claim 5 informative rather than just a null?', a: 'Locomotion suppressed sound-evoked responses (0.17 against 0.34 ΔF/F, p = 0.002) while whisking did not (0.31 against 0.28, p = 0.14), measured in the same way on matching tones.' },
            ],
        },
        {
            id: 'ap-mechanisms',
            n: '6.2',
            title: 'What could drive the difference',
            blocks: [
                { t: 'p', x: 'The authors\' Discussion proposes three candidate drivers for the contrast between spontaneous and sound-triggered whisks. Each card lists the authors\' reasons for it and what the paper does not tell you. [[src|Discussion]]' },
                {
                    t: 'cards',
                    cols: 1,
                    items: [
                        {
                            h: 'Arousal-related neuromodulation',
                            blocks: [
                                { t: 'p', x: '**For (the authors):** whisking and pupil diameter are tightly coupled, and spontaneous whisker twitches are reported to signal spikes of cholinergic and noradrenergic input to cortex. That input is a global, uniform signal during spontaneous events, whereas sound-driven cholinergic input to auditory cortex is tuned and heterogeneous; within the basal forebrain, rostral activity tracks pupil more closely and caudal activity tracks tones more. [[src|Discussion]]' },
                                { t: 'p', x: '**What the paper cannot tell:** no neuromodulator was measured. Pupil dilation stands in for it. [[src|Discussion]]' },
                            ],
                        },
                        {
                            h: 'Corollary discharge',
                            blocks: [
                                { t: 'p', x: '**For (the authors):** copies of motor commands could reach auditory cortex, which receives direct input from secondary motor cortex. Whisker movements engage different motor cortex populations depending on what initiates them, so the movement signal auditory neurons receive would differ between spontaneous and sound-triggered whisks. [[src|Discussion]]' },
                                { t: 'p', x: '**What the paper cannot tell:** no motor cortex activity was recorded, so a motor-command signal is inferred, not seen. [[src|Discussion]]' },
                            ],
                        },
                        {
                            h: 'Direct acoustic drive in some neurons',
                            blocks: [
                                { t: 'p', x: '**For (the authors):** 54 of 399 neurons responded to tones that did not cause whisking, and some neurons\' tuning to sound frequency matches their tuning to the whisking-triggering sound. Where tuning matches closely, the authors call the most parsimonious explanation that the same driver is responsible. Against it: most neurons were not directly responsive, and activity after sound-triggered whisks lagged sound-driven responses (Fig. S5, not reproduced here). [[src|Results; Discussion]]' },
                                { t: 'p', x: '**What the paper cannot tell:** the authors say ambiguity remains where a neuron shows no differences and its tuning matches the whisking tuning closely. [[src|Results]]' },
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal',
                    blocks: [
                        { t: 'p', x: 'The guide\'s note, not the authors\': the paper measures none of these three drivers directly, so the mechanism section is a set of candidates built from other studies. The authors themselves list as future work whether the decoupling arises subcortically, whether it holds for other kinds of sound, and how much neuromodulation accounts for it. [[src|Discussion]]' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'Name the three candidate drivers and one observation the authors use for each.', a: 'Arousal-related neuromodulation: whisking and pupil are tightly coupled and twitches signal a cholinergic and noradrenergic spike. Corollary discharge: auditory cortex receives input from secondary motor cortex. Direct acoustic drive: some neurons respond to tones that did not cause whisking.' },
                { t: 'check', id: 'c2', q: 'How do the authors use the idea of neuromodulatory input to argue that spontaneous and sound-triggered whisks may differ?', a: 'Spontaneous arousal events give a global, uniform signal, whereas sound-driven cholinergic input to auditory cortex is tuned and heterogeneous, so the downstream effects need not be the same.' },
            ],
        },
        {
            id: 'ap-limits',
            n: '6.3',
            title: 'The guide\'s own appraisal',
            blocks: [
                { t: 'p', x: 'Everything in this section is the guide\'s critique, not the authors\' claim, and it sits in the callouts below. Most items draw only on facts stated in the paper. [[src|Methods; Results]]' },
                { t: 'check', id: 'c1', q: 'Predict first. Sound-triggered events are defined as whisks within 1 s of an 80 dB tone. What comparison would separate "whisk context" from "loud tone present"?', a: 'Compare each neuron on whisk-free loud tones, that is, 80 dB tones that did not trigger a whisk, against its response when a loud tone is followed by a whisk.' },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal: how many animals',
                    blocks: [
                        { t: 'p', x: 'Three mice contribute 14 sessions and 6,359 neurons, and the statistics treat neurons as the unit. Whisk-related proportions range 0.5 to 13% across A1 sessions, so animal and session effects could be large. [[src|Results]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal: unequal event counts',
                    blocks: [
                        { t: 'p', x: 'There are 2,209 spontaneous and 1,001 sound-triggered events. "Not significant" with about half the events is a weaker statement than "no response", which matters for the En and Sn categories. [[src|Fig. 4C legend]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal: the 80 dB confound',
                    blocks: [
                        { t: 'p', x: 'Sound-triggered whisks are defined by the presence of a loud tone, so the comparison cannot by itself separate the whisk context from the tone. The control that is reported uses tones that did not trigger whisking, which are quieter or off-band (54 of 399 neurons responded). A comparison on whisk-free loud tones, neuron by neuron, would close this gap. [[src|Results]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal: the indicator and the setting',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                'Calcium fluorescence low-pass filters spiking, so timing differences between event types are coarse.',
                                'Behaviour was characterised in moderate light on a polystyrene wheel; neurons were imaged in the dark and for some sessions with the mouse in a clear acrylic tube. The two are not the same condition. [[src|Methods; Results]]',
                                'The mice have a C57BL/6 background, a strain prone to age-related hearing loss, which the authors themselves raise in the Discussion. [[src|Discussion]]',
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal: the supplement',
                    blocks: [
                        { t: 'p', x: 'Several key controls live in supplementary figures that this guide has not read: pupil dilation and twitching with sound-triggered whisking (Fig. S4), the lag of post-whisk activity behind sound-driven responses (Fig. S5), and the tuning comparisons (Fig. S6). The claims that rest on them are repeated here as the authors report them. [[src|Results]]' },
                    ],
                },
                {
                    t: 'call',
                    k: 'trap',
                    label: 'Appraisal: what would change my mind',
                    blocks: [
                        {
                            t: 'ul',
                            items: [
                                'Neuromodulator axon imaging or sensors during both event types, to test the arousal account directly.',
                                'Controls in anaesthetised animals, or with motor output silenced, to split acoustic from non-acoustic drive.',
                            ],
                        },
                    ],
                },
                { t: 'check', id: 'c2', q: 'Why does "not significant" in the sound-triggered column not prove that those neurons do not respond to sound-triggered whisking?', a: 'It is an absence of evidence: with about half as many sound-triggered events as spontaneous ones, the test is weaker, so a response could be present but not detected.' },
                { t: 'check', id: 'c3', q: 'Name two controls the paper cites that sit in the supplement.', a: 'Any two of: pupil dilation and twitching with sound-triggered whisking (Fig. S4), timing of post-whisk activity against sound-driven responses (Fig. S5), tuning and response-profile comparisons (Fig. S6).' },
            ],
        },
        {
            id: 'ap-use',
            n: '6.4',
            title: 'Why it matters and what to ask',
            blocks: [
                { t: 'p', x: 'The authors draw a practical lesson for anyone who plays sounds to awake animals. Moderate sounds reliably trigger movement, so a neural response to a tone may include movement and arousal signals. They recommend presenting low-intensity, short-duration sounds and avoiding frequencies to which mice are particularly sensitive, and, where the question allows, running control experiments in anaesthetised animals to separate acoustic from non-acoustic drive. [[src|Discussion]]' },
                { t: 'p', x: 'This refines earlier reassurance. The recent characterisation by Clayton et al. 2024 concluded that narrowband sounds such as pure tones pose no problem below 90 dB SPL. These authors found that pure tones in the most sensitive part of the hearing range elicited whisking on almost every trial at 80 dB SPL, and measurable, narrowly tuned whisks at levels as low as 50 dB SPL. They suggest the difference lies in tone duration: 200 ms here against 50 ms. [[src|Discussion]]' },
                {
                    t: 'call',
                    k: 'hook',
                    label: 'Discussant\'s note',
                    blocks: [
                        { t: 'p', x: 'For an otology audience: sound-evoked activity in an awake animal can include movement and arousal. Pupil dilation as an arousal readout is the same signal used in human listening-effort pupillometry. None of this is tested in humans here.' },
                    ],
                },
                {
                    t: 'h',
                    x: 'Questions for the room',
                },
                {
                    t: 'ul',
                    items: [
                        'Which single control would most convince you that the difference lies in the whisk\'s cause, not in the tone?',
                        'What measurement would separate corollary discharge from neuromodulation?',
                        'How would you design a whisk-free loud-tone comparison for each neuron?',
                        'Which of the findings you rely on sit in the supplement, and have you checked them?',
                        'What would you need to know before reading a human pupillometry result in the light of this paper?',
                    ],
                },
                { t: 'check', id: 'c1', q: 'What stimulus advice do the authors give to avoid movement confounds in awake-animal studies?', a: 'Present low-intensity, short-duration sounds, avoid frequencies to which the animal is particularly sensitive, and where the question allows, run control experiments in anaesthetised animals.' },
                { t: 'check', id: 'c2', q: 'What does this paper add to the earlier reassurance that pure tones are safe below 90 dB SPL, and what explanation do the authors offer?', a: 'It found reliable whisking at 80 dB SPL and measurable whisking at 50 dB SPL, so the reassurance may need refinement. The authors suggest longer tones (200 ms against 50 ms) as the likely reason.' },
            ],
        },
    ],
};
