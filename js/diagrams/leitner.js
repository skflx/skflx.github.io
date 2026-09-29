/* =============================================================
   leitner — ASCII 3D figure on the OKSAT hub (oksat.html).
   The five Leitner boxes and the moves between them, as the
   engine actually schedules them (js/oksat-engine.js): a correct
   answer moves a card up one box, a cold recall two, a miss sends
   it back to box 1; each box has its own review interval.

   INTERVALS must equal LEITNER_INTERVALS in js/oksat-engine.js;
   tools/check-data.mjs fails if they drift apart.
   Preview: node tools/ascii3d.mjs render leitner --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    var INTERVALS = [1, 3, 7, 14, 30];     /* days, boxes 1-5 */
    var GAP = 2.2, BW = 1.6, BD = 1.6;

    /* Each box is a block whose height grows with the square root of
       its interval, so the schedule reads as a staircase. */
    function bx(k) { return (k - 2) * GAP; }          /* k = 0..4 */
    function bh(k) { return 0.55 * Math.sqrt(INTERVALS[k]); }
    function hop(k0, k1, lift, z) {
        var y0 = bh(k0) + 0.15, y1 = bh(k1) + 0.15;
        return function (t) {
            return [bx(k0) + (bx(k1) - bx(k0)) * t, y0 + (y1 - y0) * t + lift * Math.sin(Math.PI * t), z];
        };
    }

    var parts = [], labels = [];
    INTERVALS.forEach(function (days, k) {
        parts.push({ kind: 'box', center: [bx(k), bh(k) / 2, 0], size: [BW, bh(k), BD], n: 4, ink: 'ink' });
        labels.push({ at: [bx(k), 0, -BD / 2], text: 'box ' + (k + 1) + '\n' + days + (days === 1 ? ' day' : ' days'), ink: 'ink', align: 'center', dy: 1 });
    });

    /* the three moves open to a card in box 2 */
    parts.push({ kind: 'line', path: hop(1, 2, 0.8, 0), t: [0, 1, 32], ink: 'ok' });
    parts.push({ kind: 'line', path: hop(1, 3, 1.5, 0), t: [0, 1, 48], ink: 'ok' });
    parts.push({ kind: 'line', path: hop(1, 0, 0.9, 0), t: [0, 1, 32], ink: 'bad' });
    parts.push({ kind: 'points', points: [[bx(2), bh(2) + 0.15, 0], [bx(3), bh(3) + 0.15, 0]], glyph: 'v', ink: 'ok' });
    parts.push({ kind: 'points', points: [[bx(0), bh(0) + 0.15, 0]], glyph: 'v', ink: 'bad' });
    labels.push({ at: hop(1, 2, 0.8, 0)(0.5), text: '+1 correct', ink: 'ok', align: 'center', dy: -1 });
    labels.push({ at: hop(1, 3, 1.5, 0)(0.5), text: '+2 knew it cold', ink: 'ok', align: 'center', dy: -1 });
    labels.push({ at: hop(1, 0, 0.9, 0)(0.5), text: 'miss: back to 1', ink: 'bad', align: 'center', dy: -1 });

    window.ASCII3D.define('leitner', {
        alt: 'Five Leitner boxes as a rising staircase, reviewed after 1, 3, 7, 14 and 30 days. From box 2, a correct answer moves a card up one box, knowing it cold moves it up two, and a miss sends it back to box 1.',
        cols: 64, rows: 22,
        camera: { yaw: -28, pitch: 24, fit: 0.9, persp: 6 },
        motion: { rock: 12, period: 16 },
        light: { dir: [-0.6, 0.7, -0.4] },     /* raking, so the three faces of a block differ */
        intervals: INTERVALS,
        parts: parts,
        labels: labels
    });
})();
