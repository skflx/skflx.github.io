/* =============================================================
   cochlea — Fig. 1 on the one-pager (index.html, 01 About).
   The owner's cochlea and implant, turning: a MED-EL FLEX28 on the
   lateral wall of scala tympani, and the spiral ganglion it is meant
   to drive, which sits in Rosenthal's canal inside the modiolus and
   stops near 1.75 turns. The array is far from the cells, and its
   deepest contact lies past the end of the canal.

   Fitted to the owner's preoperative OTOPLAN measurements:
   A 8.7 mm, B 6.1 mm, H 3.1 mm, lateral-wall CDL 30.2 mm from the
   round window (32.7 mm with the hook). The lateral wall is an
   elliptic basal turn (A x B) that becomes circular over the first
   turn and shrinks exponentially; its size, ellipticity and shrink
   are solved below so that A, B and the CDL come out exactly.
   ASSUMED, not measured: 2.6 turns; the rise profile; the canal
   width; the ganglion radius; the array sitting on the lateral wall
   with its deepest channel 28.0 mm in (full insertion), so the
   contact angles are model estimates, not post-op CT. Ganglion
   extent: Stakhovskaya et al. 2007, JARO 8:220.
   Preview: node tools/ascii3d.mjs render cochlea --turn 4 --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    var TAU = 2 * Math.PI, DEG = 180 / Math.PI;

    /* ---------- the owner's measurements (mm) ---------- */
    var A = 8.7, B = 6.1, H = 3.1, CDL = 30.2;
    var TURNS = 2.6, THMAX = TURNS * TAU;

    /* ---------- the array: MED-EL FLEX28 ---------- */
    var DEEPEST = 28.0, PITCH = 2.1, NCH = 12;

    /* ---------- assumed ---------- */
    var CANAL = [0.85, 0.4];          /* canal half-width, base -> apex */
    var SG_END = 1.75 * TAU;          /* Rosenthal's canal ends */
    var SG_FRAC = 0.42;               /* ganglion radius, share of the lateral wall's */
    var RISE = H - CANAL[0] - CANAL[1];   /* centerline rise, so the envelope is H */

    function lerp(a, b, t) { return a + (b - a) * t; }
    function canal(th) { return lerp(CANAL[0], CANAL[1], th / THMAX); }
    function rise(th) { return RISE * Math.pow(th / THMAX, 1.3); }

    /* lateral wall radius at th (0 = round window): ellipse a x qa, round
       by one turn, shrinking as exp(-k th) */
    var S = { a: 4.4, q: 0.8, k: 0.16 };
    function wallR(th) {
        var b = S.a * (S.q + (1 - S.q) * Math.min(1, th / TAU));
        return S.a * b / Math.hypot(b * Math.cos(th), S.a * Math.sin(th)) * Math.exp(-S.k * th);
    }
    function at(th, r, dy) {
        return [r * Math.cos(th), rise(th) + (dy || 0), -r * Math.sin(th)];
    }
    function lateral(th) { return at(th, wallR(th)); }
    function arcTable(n) {
        var t = [[0, 0]], s = 0, p = lateral(0);
        for (var i = 1; i <= n; i++) {
            var th = THMAX * i / n, q = lateral(th);
            s += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
            t.push([s, th]); p = q;
        }
        return t;
    }
    for (var it = 0; it < 60; it++) {
        S.a *= A / (wallR(0) + wallR(Math.PI));
        S.q *= Math.pow(B / (wallR(Math.PI / 2) + wallR(1.5 * Math.PI)), 0.7);
        var L = arcTable(600);
        S.k *= Math.sqrt(L[L.length - 1][0] / CDL);
    }
    var ARC = arcTable(1500);
    /* angle at a distance (mm) along the lateral wall from the round window */
    function thAt(mm) {
        for (var i = 1; i < ARC.length; i++) {
            if (ARC[i][0] >= mm) {
                var f = (mm - ARC[i - 1][0]) / (ARC[i][0] - ARC[i - 1][0]);
                return lerp(ARC[i - 1][1], ARC[i][1], f);
            }
        }
        return THMAX;
    }

    /* the canal wall: around-the-canal angle phi (0 lateral, 90 roof) */
    function wall(th, phi) {
        var r = wallR(th) - canal(th), p = phi / DEG, c = canal(th);
        return at(th, r + Math.cos(p) * c, Math.sin(p) * c * 0.85);
    }
    /* the array rides the lateral wall of scala tympani, low in the canal */
    function arrayAt(th) { return at(th, wallR(th) - 0.3 * canal(th), -0.35 * canal(th)); }
    var thTip = thAt(DEEPEST);
    var contacts = [], angles = [];
    for (var k = 0; k < NCH; k++) {
        var th = thAt(DEEPEST - k * PITCH);
        contacts.push(arrayAt(th));
        angles.push(Math.round(th * DEG));
    }
    /* the lead leaves through the round window, toward the facial recess */
    function arrayPath(t) {
        var th = lerp(-0.6, thTip, t);
        if (th >= 0) return arrayAt(th);
        var p = arrayAt(0), d = -th / 0.6;
        return [p[0] + d * 0.5, p[1] - d * 0.4, p[2] + d * 1.8];
    }
    /* a label anchor just above the array, so the tube does not hide it */
    function above(p) { return [p[0], p[1] + 0.45, p[2]]; }
    function ganglion(th) { return at(th, wallR(th) * SG_FRAC, -0.15); }

    var parts = [
        /* the bony canal, seen through: its lateral and modiolar walls */
        { kind: 'line', ink: 'faint', hidden: 'dots', path: function (t) { return wall(t * THMAX, 0); }, t: [0, 1, 420] },
        { kind: 'line', ink: 'faint', hidden: 'hide', path: function (t) { return wall(t * THMAX, 180); }, t: [0, 1, 420] },
        /* the cochlear nerve leaves the modiolus for the internal auditory canal */
        { kind: 'cylinder', from: [0, -0.6, 0], to: [0, -3.0, 0.4], radius: 0.95, ink: 'muted', sides: 14 },
        /* spiral ganglion in Rosenthal's canal, inside the modiolus (bone not drawn) */
        { kind: 'tube', ink: 'ink', path: function (t) { return ganglion(t * SG_END); }, t: [0, 1, 140], radius: 0.32, sides: 8 },
        /* the implant */
        { kind: 'tube', ink: 'signal', path: arrayPath, t: [0, 1, 240], sides: 6,
          radius: function (t) { return lerp(0.4, 0.25, t); } },
        { kind: 'points', ink: 'signal', glyph: 'o', points: contacts }
    ];

    window.ASCII3D.define('cochlea', {
        alt: 'The owner\'s cochlea, fitted to its CT measurements, with the FLEX28 implant along the outer wall of scala tympani. The spiral ganglion, the nerve cells the implant drives, lies in the central modiolus and ends at about 1.75 turns; the deepest contact sits past its end, near ' + angles[0] + ' degrees.',
        cols: 88, rows: 30,
        camera: { yaw: 60, pitch: 40, fit: 0.94, frame: 'view' },
        motion: { rock: 18, period: 16 },
        parts: parts,
        labels: [
            { at: above(contacts[0]), text: 'deepest contact\n~' + angles[0] + ' deg', ink: 'signal', dx: 6 },
            { at: arrayPath(0.02), text: 'FLEX28 via\nround window', ink: 'signal', dx: 4, dy: 2 },
            { at: above(ganglion(SG_END)), text: 'spiral ganglion\nends ~630 deg', ink: 'ink', dx: 6, dy: 2 },
            { at: [0, -2.6, 0.4], text: 'cochlear nerve', ink: 'muted', dx: 6 }
        ]
    });
})();
