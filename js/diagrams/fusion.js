/* =============================================================
   fusion — Fig. 2 on the one-pager (index.html, 04 Research).
   Binaural pitch fusion as a shaded surface ribbed by twelve
   curves, one fusion function per electrode of a twelve-channel
   array (the FLEX28 of Fig. 1): the chance that a tone in the
   hearing-aid ear is heard as one sound with that electrode. The
   fused region (P >= .5) is blue; its width is the fusion range.

   SCHEMATIC, NOT DATA. Curve centers follow electrode order
   (apex = low pitch) and every width is invented; the caption in
   index.html says so. Owner review: docs/decisions.md §7.
   Preview: node tools/ascii3d.mjs render fusion --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    var N = 12;                 /* channels */
    var X0 = 0, X1 = 10;        /* tone axis, low -> high (log frequency) */
    var DZ = 0.8;               /* electrode spacing, front (apex) -> back (base) */
    var H = 2.6;                /* height of P(fused) = 1 */
    var WIDTH = 1.35;           /* half-width at P = 0.5 */

    function center(e) { return 1.6 + e * 0.62; }
    function P(e, x) { return 1 / (1 + Math.pow((x - center(e)) / WIDTH, 4)); }

    /* ink by meaning: fused (P >= .5) blue; near-zero floor faint */
    function inkFor(p) { return p >= 0.5 ? 'science' : p < 0.1 ? 'faint' : 'ink'; }

    var parts = [
        /* the fusion surface, electrodes interpolated between curves */
        {
            kind: 'heightfield', x: [X0, X1, 60], z: [0, (N - 1) * DZ, 44],
            fn: function (x, z) { return H * P(z / DZ, x); },
            inkAt: function (x, z) { return inkFor(P(z / DZ, x)); }
        }
    ];
    /* one rib per electrode: the measured curve, split where its ink changes */
    for (var e = 0; e < N; e++) {
        var run = [], cls = null;
        for (var i = 0; i <= 80; i++) {
            var x = X0 + (X1 - X0) * i / 80, pr = P(e, x), k = inkFor(pr);
            var pt = [x, H * pr + 0.02, e * DZ];
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
    /* the array: one contact per curve, down the left edge */
    var contacts = [];
    for (var c = 0; c < N; c++) contacts.push([X0 - 0.7, 0, c * DZ]);
    parts.push({ kind: 'points', points: contacts, glyph: 'o', ink: 'signal' });
    /* tone axis */
    parts.push({ kind: 'line', points: [[X0, 0, -0.6], [X1, 0, -0.6]], ink: 'faint' });

    window.ASCII3D.define('fusion', {
        alt: 'Schematic waterfall plot of binaural pitch fusion: twelve curves, one per cochlear-implant electrode from apex to base, each showing how often a tone in the hearing-aid ear fuses with that electrode into one sound. Each fused span is broad, and it moves to higher tones from apex to base.',
        cols: 96, rows: 30,
        camera: { yaw: 28, pitch: 32, fit: 0.84, offset: [2, 0] },
        motion: { rock: 16, period: 14 },
                parts: parts,
        labels: [
            { at: [X0 - 0.7, 0, 0], text: 'E1 apex', ink: 'signal', dx: -3, mark: false },
            { at: [X0 - 0.7, 0, (N - 1) * DZ], text: 'E12 base', ink: 'signal', dx: -3, mark: false },
            { at: [X1, 0, -0.6], text: 'tone, HA ear\nlow -> high', ink: 'faint', dx: 2, mark: false },
            { at: [center(8) + WIDTH * 0.6, H * P(8, center(8) + WIDTH * 0.6), 8 * DZ], text: 'fused:\nthe fusion range', ink: 'science', dx: 4, dy: -2 }
        ]
    });
})();
