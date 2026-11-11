/* =============================================================
   Question and background
   OKSAT · Interactive learning · jc-whisking-auditory-cortex · chapter 1
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   Plan: plans/2026-11-10-jc-whisking-auditory-cortex.md.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'question',
    review: 'draft',
    title: 'Question and background',
    kicker: '1 · Question and background',
    lede: 'Why a sound-processing area of the brain also carries signals about movement and arousal, the two ways a movement could get there, and the single question this paper asks.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    tldr: [
        'Auditory cortex does not only encode sound. Its activity also follows brain state: arousal, pupil size and body movement.',
        'Two broad routes could carry a movement into auditory cortex: an arousal-linked chemical signal (acetylcholine, noradrenaline) and a copy of the motor command (efference copy, or corollary discharge).',
        'The link runs both ways: movements make sound, and sounds make movement.',
        'The paper uses brief whisking bouts outside running as a marker of a chemical arousal spike, and asks whether auditory cortex neurons treat a spontaneous whisk and a tone-triggered whisk alike.',
    ],
    sections: [
        {
            id: 'bg-1',
            n: '1.1',
            title: 'Auditory cortex carries more than sound',
            blocks: [
                { t: 'p', x: 'The textbook picture of auditory cortex is a sound analyser. The paper opens by saying that picture is incomplete: its activity also reflects **brain state**, meaning arousal, motivation, emotion and homeostatic needs, together with movement signals [[src|Introduction, p. 1]].' },
                { t: 'p', x: 'Brain states cannot be seen directly, so the field uses outside readouts. In mice, arousal fluctuations appear as cortex-wide changes in excitation, and two things you can film track them: **pupil diameter** and **body movement** [[src|Introduction, p. 1]]. A camera on the eye is a cheap arousal meter.' },
                {
                    t: 'kv',
                    rows: [
                        ['Acetylcholine', 'A **neuromodulator**: it does not carry a message itself but turns the gain on how neurons respond. Reaches the cortex from the basal forebrain. Cortical release tracks pupil size and behavioural engagement (locomotion, licking, whisking) [[src|Introduction, p. 1]].'],
                        ['Noradrenaline', 'The second neuromodulator, reaching the cortex from the locus coeruleus. It tracks the same signals as acetylcholine. Activating the locus coeruleus can itself promote locomotion [[src|Introduction, p. 1]].'],
                        ['Locomotion route', 'Activating the mesencephalic locomotor region increases locomotion and, through its projection to the basal forebrain, cortical gain [[src|Introduction, p. 2]].'],
                    ],
                },
                { t: 'p', x: 'The consequence for an auditory experiment: if a neuron changes its firing when a mouse moves or becomes aroused, you cannot read that change as a response to the sound without knowing what the animal was doing.' },
                { t: 'check', id: 'c1', q: 'Why would an experiment on auditory cortex film the mouse\'s pupil and whiskers?', a: 'They are outside readouts of arousal and brain state, which change cortical activity on their own. Without them, a change in a neuron\'s firing cannot be attributed to sound as opposed to movement or state.' },
                { t: 'check', id: 'c2', q: 'Name the two neuromodulators the paper focuses on and where each reaches the cortex from.', a: 'Acetylcholine, from the basal forebrain; noradrenaline, from the locus coeruleus. Both project broadly to cortex and both track pupil size and movement or engagement.' },
            ],
        },
        {
            id: 'bg-2',
            n: '1.2',
            title: 'Two reasons a movement shows up in auditory cortex',
            blocks: [
                { t: 'p', x: 'Suppose you record in auditory cortex and see a signal that follows a whisker movement. The paper lays out two candidate explanations, and they are not mutually exclusive [[src|Introduction, p. 1–2]].' },
                {
                    t: 'cards',
                    cols: 2,
                    items: [
                        {
                            h: 'Route 1: arousal-linked neuromodulation',
                            blocks: [
                                { t: 'p', x: 'The movement is a **symptom** of a brain-state change. Acetylcholine and noradrenaline rise, which changes both the movement and cortical activity. The movement itself carries no instruction; it just marks that the neuromodulators rose.' },
                            ],
                        },
                        {
                            h: 'Route 2: efference copy',
                            blocks: [
                                { t: 'p', x: 'The movement is a **cause**: when the motor system issues a command it also sends a copy to sensory areas (**efference copy**, also called **corollary discharge**). The copy lets the brain predict the sound its own movement will make and suppress it, so self-generated sound stands apart from external sound.' },
                                { t: 'p', x: 'Secondary motor cortex projections have been linked to suppression of auditory cortex during movement. Movement-related inputs are reported as early as the cochlear nucleus in the brainstem [[src|Introduction, p. 2]].' },
                            ],
                        },
                    ],
                },
                {
                    t: 'call',
                    k: 'mech',
                    label: 'The loop runs both ways',
                    blocks: [
                        { t: 'p', x: 'Movements make sound, so a movement signal may be needed to label a sound as self-made. But **sounds also make movement**. A loud sound elicits a startle or flight response. Weaker, broad-spectrum sounds can trigger subtler facial movements [[src|Introduction, p. 2]]. A movement seen alongside auditory activity can therefore be the effect of a sound as easily as its cause.' },
                    ],
                },
                { t: 'check', id: 'c1', q: 'In your own words, how does the arousal route differ from the efference copy route in what the movement signal means?', a: 'Arousal route: the movement is a marker of a shared brain-state change driven by neuromodulators. Efference copy route: the movement command itself is copied to sensory cortex so self-generated sound can be predicted and suppressed.' },
                { t: 'check', id: 'c2', q: 'Why does the fact that sounds can trigger movements complicate interpreting movement-related signals in auditory cortex?', a: 'Auditory activity that coincides with a movement could reflect the sound that caused the movement rather than the movement or the arousal. Cause and effect cannot be assumed to run from movement to cortex.' },
                { t: 'check', id: 'c3', q: 'What does an efference copy let the brain do with the sound its own movement makes?', a: 'Predict it and suppress the response to it, so self-generated sounds are distinguished from external ones and unexpected sounds (errors) stand out.' },
            ],
        },
        {
            id: 'bg-3',
            n: '1.3',
            title: 'The question and the design in one view',
            blocks: [
                { t: 'p', x: 'The authors use one behaviour as their marker: brief **whisking bouts** that happen outside periods of running. They describe these as reliable markers of cholinergic and noradrenergic input to cortex, a spike in neuromodulatory activity [[src|Introduction, p. 2]].' },
                { t: 'check', id: 'c1', q: 'Predict before reading on. Suppose the whisk-related signal in an auditory cortex neuron were purely a copy of the motor command. What should happen when a tone triggers an identical whisk, compared with a whisk that starts on its own?', a: 'The simplest expectation is the same neuronal response in both cases, because the motor command and its copy are the same whatever started the whisk. A neuron that responds differently argues that the signal is not just a copy of the command.' },
                { t: 'p', x: 'The paper asks exactly this, and the way it frames the answer is what makes it interesting: **near-identical whisks, triggered two different ways, are compared within each neuron.** The design is a five-step funnel.' },
                {
                    t: 'steps',
                    items: [
                        { n: '1', x: 'Film the head-fixed mouse: whiskers, pupil and a running wheel. No imaging yet. Establish what whisking events look like and what they are linked to.' },
                        { n: '2', x: 'Play pure tones of many frequencies and levels. Find which ones reliably trigger a whisk.' },
                        { n: '3', x: 'Record the activity of auditory cortex neurons with two-photon calcium imaging, in which a pulsed infrared laser makes neurons that carry a fluorescent calcium sensor light up, and their brightness rises when they fire (details in 2.4).' },
                        { n: '4', x: 'Label every whisking event as spontaneous (no relevant tone before it) or sound-triggered (an effective loud tone just before it).' },
                        { n: '5', x: 'Ask, neuron by neuron, whether the response to a spontaneous whisk matches the response to a sound-triggered one.' },
                    ],
                    label: 'Study design',
                    cap: 'Schematic summary of the order of the experiments.',
                },
                {
                    t: 'deep',
                    title: 'Why whisking outside running?',
                    blocks: [
                        { t: 'p', x: 'Running changes many things at once: the whole body moves, sensory flow changes, and arousal is high. Brief whisks that occur without running are a cleaner marker of a short arousal spike. The authors therefore exclude all running periods and the 10 s after them from the whisking events they analyse [[src|Methods, Data analysis]].' },
                    ],
                },
                { t: 'check', id: 'c2', q: 'Why is the comparison between spontaneous and sound-triggered whisks made within each neuron rather than on the population average?', a: 'The question is whether the same neuron treats the two kinds of event alike. A population average could hide neurons that rise for one event type and fall or stay flat for the other.' },
                { t: 'check', id: 'c3', q: 'What has to be roughly equal between the two kinds of whisk for the comparison to be fair, and why does it matter?', a: 'The movement itself (its size and form). If sound-triggered whisks were much bigger or smaller, a neuronal difference could simply reflect movement amplitude rather than the context or cause of the movement.' },
            ],
        },
    ],
};
