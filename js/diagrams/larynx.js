/* =============================================================
   larynx — ASCII 3D figure on the Airway Rounds setup screen.
   The laryngeal skeleton and upper trachea, turning, so the two
   facts a flat drawing hides become obvious: the cricoid is the
   one complete ring (a signet: low arch in front, tall lamina
   behind), and the tracheal rings are C-shaped, open posteriorly.
   The cricothyroid membrane, the emergency surgical airway, is
   the one signal-colored part.

   Schematic proportions, not a measured specimen. Units ~cm;
   y up, anterior = -z.
   Preview: node tools/ascii3d.mjs render larynx --turn 4 --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    var PI = Math.PI;

    /* Thyroid lamina, s = 0 at the midline angle -> 1 at the posterior
       border. Laminae meet at ~85 degrees; the notch dips at s = 0. */
    function thyTop(s) { return 2.72 - 0.5 * Math.exp(-Math.pow(s / 0.12, 2)); }
    function thyBot(s) { return 1.1 - 0.35 * s; }
    function lamina(sign) {
        return function (s, v) {
            var y = thyBot(s) + v * (thyTop(s) - thyBot(s));
            return [sign * (0.06 + s * 1.38 + 0.1 * Math.sin(PI * s)), y, -1.25 + s * 1.5];
        };
    }

    /* Cricoid: complete ring whose top rises from the arch (front)
       to the lamina (back). p = 0 anterior, 1 posterior. */
    function cricTop(th) { var p = (Math.sin(th) + 1) / 2; return 0.55 + 1.45 * Math.pow(p, 2.5); }
    function cricoid(th, v) {
        return [0.98 * Math.cos(th), v * cricTop(th), 0.9 * Math.sin(th) + 0.12];
    }

    /* Cricothyroid membrane: cricoid arch top -> thyroid inferior border. */
    function ctm(s, v) {
        var x = s * 0.5;
        var z0 = 0.12 - 0.9 * Math.sqrt(1 - Math.pow(x / 0.98, 2));
        var sl = Math.min(1, Math.max(0, (Math.abs(x) - 0.06) / 1.38));
        var y0 = 0.56, y1 = thyBot(sl), z1 = -1.25 + 1.5 * sl;
        return [x, y0 + v * (y1 - y0), z0 + v * (z1 - z0)];
    }

    /* Epiglottis: a leaf from the petiole (inside the thyroid angle)
       up behind the hyoid, edges curling back. */
    function epiglottis(u, v) {
        var w = 0.13 + 0.6 * Math.sin(PI * Math.pow(v, 0.8) * 0.9);
        return [u * w, 1.95 + 2.05 * v, -0.8 + 0.85 * v + 0.28 * u * u + 0.25 * v * v];
    }

    var parts = [
        { kind: 'surface', fn: epiglottis, u: [-1, 1, 10], v: [0, 1, 16], ink: 'muted' },
        /* hyoid: U-shaped bar, open behind */
        { kind: 'torus', center: [0, 3.15, 0.05], R: 1.45, section: [0.14, 0.2], arc: [140, 400], n: 48, sides: 8, ink: 'muted' },
        { kind: 'surface', fn: lamina(1), u: [0, 1, 18], v: [0, 1, 10], ink: 'ink' },
        { kind: 'surface', fn: lamina(-1), u: [0, 1, 18], v: [0, 1, 10], ink: 'ink' },
        { kind: 'cylinder', from: [1.52, 2.72, 0.25], to: [1.3, 3.3, 0.7], radius: 0.07, sides: 6, n: 3, ink: 'ink' },
        { kind: 'cylinder', from: [-1.52, 2.72, 0.25], to: [-1.3, 3.3, 0.7], radius: 0.07, sides: 6, n: 3, ink: 'ink' },
        { kind: 'cylinder', from: [1.52, 0.75, 0.25], to: [1.02, 0.32, 0.42], radius: 0.08, sides: 6, n: 3, ink: 'ink' },
        { kind: 'cylinder', from: [-1.52, 0.75, 0.25], to: [-1.02, 0.32, 0.42], radius: 0.08, sides: 6, n: 3, ink: 'ink' },
        { kind: 'surface', fn: cricoid, u: [0, 2 * PI, 48], v: [0, 1, 6], wrapU: true, ink: 'ink' },
        { kind: 'surface', fn: ctm, u: [-1, 1, 8], v: [0, 1, 4], ink: 'signal' }
    ];

    /* Tracheal rings: C-shaped bands, gap centered posteriorly (th = 90). */
    for (var k = 0; k < 3; k++) {
        (function (y) {
            parts.push({
                kind: 'surface', ink: 'ink', u: [120 * PI / 180, 420 * PI / 180, 40], v: [0, 1, 2],
                fn: function (th, v) { return [0.88 * Math.cos(th), y - v * 0.34, 0.8 * Math.sin(th) + 0.12]; }
            });
        })(-0.45 - k * 0.6);
    }
    /* trachealis: the membranous posterior wall closing each C */
    parts.push({
        kind: 'surface', ink: 'faint', u: [60 * PI / 180, 120 * PI / 180, 6], v: [-0.45, -1.99, 6],
        fn: function (th, y) { return [0.88 * Math.cos(th), y, 0.8 * Math.sin(th) + 0.12]; }
    });

    window.ASCII3D.define('larynx', {
        alt: 'The larynx and upper trachea, turning: epiglottis, hyoid, the thyroid cartilage, the cricoid as the only complete ring, C-shaped tracheal rings open at the back, and the cricothyroid membrane between thyroid and cricoid highlighted as the site of an emergency surgical airway.',
        cols: 72, rows: 34,
        camera: { yaw: 35, pitch: 12, fit: 0.95 },
        motion: { spin: 20 },
        parts: parts,
        labels: [
            { at: [0, 4.0, 0.35], text: 'epiglottis', ink: 'muted' },
            { at: [-1.02, 3.15, -1.0], text: 'hyoid', ink: 'muted' },
            { at: [0.75, 1.9, -0.52], text: 'thyroid\ncartilage' },
            { at: [0, 0.83, -1.02], text: 'cricothyroid\nmembrane', ink: 'signal' },
            { at: [0.98, 0.3, 0.12], text: 'cricoid: the one\ncomplete ring' },
            { at: [-0.62, -1.9, -0.45], text: 'tracheal rings,\nopen behind' }
        ]
    });
})();
