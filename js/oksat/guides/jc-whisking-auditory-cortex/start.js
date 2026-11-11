/* =============================================================
   Auditory cortex: spontaneous vs sound-evoked movements
   OKSAT · Interactive learning · jc-whisking-auditory-cortex · chapter 0
   Guide data (docs/authoring-oksat-guide.md). Draft: the owner verifies.
   Plan: plans/2026-11-10-jc-whisking-auditory-cortex.md.
   ============================================================= */

window.__OKSAT_CHAPTER = {
    id: 'start',
    review: 'draft',
    title: 'Auditory cortex distinguishes spontaneous from sound-evoked movements',
    kicker: 'Start here',
    lede: 'A journal club walk through one basic-science paper, figure by figure. The same whisker movement can start on its own or be triggered by a tone, and many auditory cortex neurons respond differently to the two. The guide teaches the methods well enough to explain each step to the room.',
    src: 'Zimmer-Harwood et al., J Neurosci 2026;46(26):e1874252026',
    intro: [
        {
            t: 'cards',
            cols: 1,
            items: [
                {
                    h: 'Zimmer-Harwood et al. 2026',
                    blocks: [
                        { t: 'p', x: '**Zimmer-Harwood P, Picard S, King AJ, Dahmen JC. Auditory Cortex Distinguishes between Spontaneous and Sound-Evoked Movements. J Neurosci. 2026;46(26):e1874252026.** DOI 10.1523/JNEUROSCI.1874-25.2026. Open access under CC BY 4.0. The only source for this guide.' },
                    ],
                },
            ],
        },
        {
            t: 'call',
            k: 'trap',
            label: 'Currency check',
            blocks: [
                { t: 'p', x: 'Checked 2026-11. One paper, in mice, basic science: it carries no clinical recommendation. The figures are the paper\'s own, cropped, under CC BY 4.0. The supplemental figures were not read, so anything that rests on one is marked as such. Appraisal notes and discussant\'s notes are the guide\'s, not the authors\'. Content is draft; the owner verifies.' },
            ],
        },
        { t: 'h', x: 'How to use it' },
        {
            t: 'ul',
            items: [
                'Read the 30-second version at the top of each chapter first.',
                'Each figure section shows the figure, tells you how to read it panel by panel, states the one conclusion it licenses, then asks you to retrieve it. Try the prompts before you open the answers.',
                'Chapters 1 and 2 give the background and the methods. The last chapter is the appraisal: what the paper shows, what it does not, and what to ask.',
            ],
        },
        { t: 'h', x: 'The paper in six claims' },
        {
            t: 'table',
            head: ['Claim', 'Where shown'],
            rows: [
                ['1. Brief whisks outside running come with a whole-body twitch and a later pupil dilation that scales with the whisk.', 'Fig. 1 [[src|Results]]'],
                ['2. Pure tones in the sensitive band trigger near-identical whisks, down to 50 dB SPL, without habituation.', 'Fig. 2 [[src|Results]]'],
                ['3. About 6% of layer 2/3 excitatory auditory cortex neurons are modulated around spontaneous whisks.', 'Figs. 3 and 4 [[src|Results]]'],
                ['4. Many of those do not respond, or respond differently, when the whisk is sound-triggered. 175 of 399 distinguish the two.', 'Figs. 4 and 5 [[src|Results]]'],
                ['5. Whisking, unlike locomotion, does not change sound-evoked responses.', 'Fig. 6 [[src|Results]]'],
                ['6. The cause and context of a movement, not the movement alone, set its cortical signature.', 'Discussion [[src|Discussion]]'],
            ],
        },
    ],
};
