/* =============================================================
   fusion — Fig. 2 on the one-pager (index.html, 04 Research).
   Binaural pitch fusion in two bimodal listeners, side by side.
   Each panel is a hidden-line waterfall of twelve curves, one per
   electrode of a twelve-channel array (apex in front, base behind):
   the chance that a tone in the hearing-aid ear is heard as one
   sound with that electrode. The fused span (P >= .5) is blue; its
   width is the fusion range. Left, a listener at the narrow end of
   the bimodal range; right, one at the broad end, where most of
   the tone axis fuses with any electrode.

   SCHEMATIC, NOT DATA. Widths are set to the range reported for
   bimodal CI users, 1-4 octaves (Reiss et al. 2014, JARO 15:235);
   curve centers, their spacing and the per-electrode jitter are
   invented. The caption in index.html says so. Owner review:
   docs/decisions.md §7.
   Preview: node tools/ascii3d.mjs render fusion --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    var N = 12;                 /* channels */
    var OCT = 5;                /* tone axis: 125 Hz to 4 kHz, in octaves */
    var DZ = 0.5;               /* electrode spacing, front (apex) -> back (base) */
    var LIFT = 0.36;            /* each curve's baseline steps up: a ridgeline */
    var H = 1.15;               /* height of P(fused) = 1 */
    var GAP = 1.6;              /* space between the panels, octaves */

    /* the two listeners: fusion range (P >= .5) in octaves, and an
       invented electrode-to-electrode wobble so neither looks ideal */
    var LISTENERS = [
        { x0: 0, range: 1.0, wobble: 0.15, title: 'narrow fusion\n~1 octave' },
        { x0: OCT + GAP, range: 3.6, wobble: 0.5, title: 'broad fusion\n~3.5 octaves' }
    ];

    function center(e) { return 0.9 + e * 0.27; }                 /* octaves above 125 Hz */
    function jitter(e) { return Math.sin(e * 2.3 + 0.7); }        /* fixed, -1..1 */
    function half(L, e) { return (L.range + L.wobble * jitter(e)) / 2; }
    function P(L, e, x) { return 1 / (1 + Math.pow((x - center(e)) / half(L, e), 4)); }

    var parts = [], labels = [];
    LISTENERS.forEach(function (L) {
        for (var e = 0; e < N; e++) {
            /* an opaque curtain under each curve hides the curves behind it */
            parts.push({
                kind: 'surface', ink: 'ghost',
                fn: (function (e) { return function (u, v) { return [L.x0 + u, e * LIFT + v * H * P(L, e, u), e * DZ]; }; })(e),
                u: [0, OCT, 80], v: [-0.6, 1, 2]
            });
            /* the curve, split where its ink changes */
            var run = [], cls = null;
            for (var i = 0; i <= 120; i++) {
                var x = OCT * i / 120, pr = P(L, e, x), k = pr >= 0.5 ? 'science' : 'ink';
                var pt = [L.x0 + x, e * LIFT + H * pr + 0.02, e * DZ - 0.01];
                if (k !== cls && run.length) {
                    run.push(pt);
                    parts.push({ kind: 'line', points: run, ink: cls });
                    run = [];
                }
                cls = k;
                run.push(pt);
            }
            if (run.length > 1) parts.push({ kind: 'line', points: run, ink: cls });
        }
        /* tone axis, octave ticks */
        var ticks = [];
        for (var o = 0; o <= OCT; o++) ticks.push([L.x0 + o, 0, -0.45]);
        parts.push({ kind: 'line', points: [[L.x0, 0, -0.45], [L.x0 + OCT, 0, -0.45]], ink: 'faint' });
        parts.push({ kind: 'points', points: ticks, glyph: '+', ink: 'faint' });
        labels.push({ at: [L.x0 + OCT / 2, (N - 1) * LIFT + H, (N - 1) * DZ], text: L.title, ink: L.range > 2 ? 'science' : 'ink', align: 'center', dy: -4, mark: false });
        labels.push({ at: [L.x0, 0, -0.45], text: '125 Hz', ink: 'faint', align: 'center', dy: 1, mark: false });
        labels.push({ at: [L.x0 + OCT, 0, -0.45], text: '4 kHz', ink: 'faint', align: 'center', dy: 1, mark: false });
    });
    /* the array: one contact per curve, down the left edge */
    var contacts = [];
    for (var c = 0; c < N; c++) contacts.push([-0.35, c * LIFT, c * DZ]);
    parts.push({ kind: 'points', points: contacts, glyph: 'o', ink: 'signal' });
    labels.push(
        { at: contacts[0], text: 'E1 apex', ink: 'signal', dx: -2, mark: false },
        { at: contacts[N - 1], text: 'E12 base', ink: 'signal', dx: -2, mark: false }
    );

    window.ASCII3D.define('fusion', {
        alt: 'Schematic of binaural pitch fusion in two bimodal cochlear-implant listeners. Each panel has twelve curves, one per electrode from apex to base, showing how often a tone in the hearing-aid ear fuses with that electrode into one sound. In the left listener each fused span is about an octave wide; in the right listener it is about three and a half octaves, so most tones fuse with any electrode.',
        cols: 96, rows: 28,
        outline: false,
        camera: { yaw: 0, pitch: 12, fit: 0.86, persp: 4.5, offset: [3, 1] },
        motion: { rock: 8, period: 16 },
        parts: parts,
        labels: labels
    });
})();
