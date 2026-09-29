/* =============================================================
   larynx — ASCII 3D figure on the Airway Rounds setup screen.
   The laryngeal skeleton and upper trachea, turning, so the facts
   a flat drawing hides become obvious: the cricoid is the one
   complete ring (a signet: low arch in front, tall lamina behind),
   the tracheal rings are C-shaped and open posteriorly, and the
   cricothyroid membrane, the emergency surgical airway, lies BELOW
   the vocal folds (dotted: seen through the thyroid lamina). It is
   the one signal-colored part.

   Schematic proportions (adult male reference), not a measured
   specimen. The anatomical claims are the owner's to vet. Units cm;
   y up, anterior = -z, x lateral; the cricoid lumen sits on the
   y axis.
   Preview: node tools/ascii3d.mjs render larynx --turn 4 --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    var PI = Math.PI;
    var RAD = PI / 180;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }
    function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }

    /* ---------- dimensions (cm) ---------- */

    /* Cricoid: complete signet ring, lumen 1.5 transverse x 1.8 AP. */
    var CRICOID = {
        lumenA: 0.75, lumenB: 0.90,          // lumen half-widths (x, z)
        archWall: 0.30, laminaWall: 0.50,
        archH: 0.60, sideRise: 0.30,         // arch height, extra height at the sides
        laminaH: 2.30,
        shoulderFlat: 20, shoulderEnd: 85,   // deg from the posterior midline
        wallSpread: 100,                     // deg over which the wall thickens
        jointTh: 40, jointY: 1.0             // cricothyroid joint, ellipse angle and height
    };

    /* Share of the section perimeter: outer wall, top rim, inner wall, bottom rim.
       Cricoid and tracheal rings are both built from it (v = 20 samples land
       on the corners). */
    var SECTION = [0.35, 0.15, 0.35, 0.15];
    var SECTION_SAMPLES = 20;

    var MEMBRANE = { height: 1.0, halfArc: 60 };   // ~1.0 tall, ~2.4 wide along the arch

    /* Thyroid: two laminae meeting at ~90 degrees, 3.6 long from the angle. */
    var THYROID = {
        halfAngle: 45, endAngle: 20, length: 3.6,  // plan-view heading, deg from sagittal
        zAngle: -1.75,                             // where the anterior angle sits
        topLat: 4.30, topDrop: 0.25,               // upper border, angle -> posterior
        notchDepth: 0.90, notchHalf: 0.16,         // notch, as a fraction of lamina length
        botMid: CRICOID.archH + MEMBRANE.height, botDrop: 0.15,
        gapTop: 3.8, gapBottom: 2.6,               // between the posterior borders
        bulge: 0.10, thick: 0.25,
        cornuUp: [0.08, 1.35, 0.54],               // superior cornu offset (1.5 long)
        cornuR: [0.13, 0.08],
        inferiorR: [0.11, 0.08],
        oblique: { from: [0.3, 0.92], to: [0.62, 0.1], out: 0.14 }   // [t, v] on the lamina
    };

    var COMMISSURE_ABOVE_THYROID_BASE = 1.0;

    /* Arytenoid: pyramid on the cricoid's upper shoulder. */
    var ARYTENOID = {
        th: 57, radius: 0.5, height: 1.7,
        vocalDir: [-0.17, -0.98],             // vocal process: anterior, a little medial
        processLift: 0.3, embed: 0.1,
        apexShift: [-0.2, 0.28],              // apex leans posteromedially (x medial is negative)
        cornicRadius: 0.11,
        outline: [0.73, 0.27],                // base = rounded triangle: r = a + b cos(3 angle)
        taper: 0.8
    };

    var HYOID = {
        halfWidth: 1.25, midY: 5.0, height: 1.0, thick: 0.4,
        frontZ: -2.05, curve: 0.45,           // body bows forward at the middle
        tipX: 2.1, tipY: 5.4, tipZ: 1.25,     // greater cornu tip (4.2 apart)
        cornuR: [0.17, 0.08],
        taper: 0.6                            // ends of the body lose height
    };

    var EPIGLOTTIS = {
        baseY: 3.3, baseZ: -1.5, rise: 3.3,   // petiole just under the notch
        lean: 0.95, bend: 0.7,                // leans back, upper part curves forward
        width: 1.0, petiole: 0.12, curl: 0.3,
        lobe: 0.72,                           // v where the broad upper part is widest
        thick: 0.15
    };

    var TRACHEA = {
        lumenA: 0.90, lumenB: 0.80, wall: 0.12, cz: 0.10,
        ringH: 0.40, ringGap: 0.20, gapBelowCricoid: 0.30, rings: 5,
        arc: 290, gapCenter: 90                // cartilage arc; gap centered posteriorly
    };

    /* ---------- cricoid ---------- */

    /* Angle from the posterior midline, deg (0 back, 90 side, 180 front). */
    function fromBack(th) { return Math.atan2(Math.abs(Math.cos(th)), Math.sin(th)) / RAD; }

    function cricHeight(th) {
        var d = fromBack(th);
        var side = Math.sin(d * RAD);
        var base = CRICOID.archH + CRICOID.sideRise * side * side;
        return lerp(base, CRICOID.laminaH,
            smooth((CRICOID.shoulderEnd - d) / (CRICOID.shoulderEnd - CRICOID.shoulderFlat)));
    }
    function cricWall(th) {
        return lerp(CRICOID.archWall, CRICOID.laminaWall,
            smooth((CRICOID.wallSpread - fromBack(th)) / CRICOID.wallSpread));
    }
    function cricRadii(th, f) {   // f: 0 lumen wall -> 1 outer wall
        var w = f * cricWall(th);
        return [CRICOID.lumenA + w, CRICOID.lumenB + w];
    }
    function cricPoint(th, f, y) {
        var r = cricRadii(th, f);
        return [r[0] * Math.cos(th), y, r[1] * Math.sin(th)];
    }

    /* A rectangular-section band swept around an ellipse. v walks the
       section: outer wall (up), top rim (in), inner wall (down), bottom
       rim (out), so the ring is a real solid with square edges. */
    function sectionBand(seg, radii, top, bottom, cz) {
        var e1 = seg[0], e2 = e1 + seg[1], e3 = e2 + seg[2];
        return function (th, v) {
            var yt = top(th), yb = bottom(th), f, y;
            if (v < e1) { f = 1; y = lerp(yb, yt, v / e1); }
            else if (v < e2) { f = 1 - (v - e1) / seg[1]; y = yt; }
            else if (v < e3) { f = 0; y = lerp(yt, yb, (v - e2) / seg[2]); }
            else { f = (v - e3) / seg[3]; y = yb; }
            var i = radii(th, 0), o = radii(th, 1);
            return [lerp(i[0], o[0], f) * Math.cos(th), y, lerp(i[1], o[1], f) * Math.sin(th) + cz];
        };
    }
    var cricoid = sectionBand(SECTION, cricRadii, cricHeight,
        function () { return 0; }, 0);

    /* ---------- thyroid ---------- */

    var THY_TURN = (THYROID.halfAngle - THYROID.endAngle) * RAD;

    /* Plan view of a lamina's outer border at fraction t from the angle:
       heading swings from halfAngle toward the sagittal line, so each
       lamina bows outward. Returns [x, z] for the right lamina. */
    function thyPlan(t) {
        var p0 = THYROID.halfAngle * RAD, ph = p0 - THY_TURN * t;
        return [
            THYROID.length * (Math.cos(ph) - Math.cos(p0)) / THY_TURN,
            THYROID.zAngle + THYROID.length * (Math.sin(p0) - Math.sin(ph)) / THY_TURN
        ];
    }
    function thyHeading(t) { return THYROID.halfAngle * RAD - THY_TURN * t; }
    function thyShrink(t) { return lerp(1, THYROID.gapBottom / THYROID.gapTop, t); }
    function thyTopY(t) {
        var notch = Math.max(0, 1 - t / THYROID.notchHalf);
        return THYROID.topLat - THYROID.topDrop * t - THYROID.notchDepth * Math.pow(notch, 1.3);
    }
    function thyBotY(t) { return THYROID.botMid - THYROID.botDrop * t; }
    function thyBotX(t) { return thyPlan(t)[0] * thyShrink(t); }

    /* One lamina; sign +1 right, -1 left. out pushes off the sheet
       along its outward normal (for lines drawn on the surface). */
    function thyPoint(sign, t, v, out) {
        var p = thyPlan(t), ph = thyHeading(t);
        var x = lerp(p[0] * thyShrink(t), p[0], v)
            + THYROID.bulge * Math.sin(PI * t) * Math.sin(PI * v);
        return [
            sign * (x + (out || 0) * Math.cos(ph)),
            lerp(thyBotY(t), thyTopY(t), v),
            p[1] - (out || 0) * Math.sin(ph)
        ];
    }
    function lamina(sign) {
        return function (t, v) { return thyPoint(sign, t, v, 0); };
    }

    function obliqueLine(sign) {
        var o = THYROID.oblique;
        return [thyPoint(sign, o.from[0], o.from[1], o.out), thyPoint(sign, o.to[0], o.to[1], o.out)];
    }

    /* Cricothyroid membrane: cricoid arch upper border -> thyroid lower
       border, spanning the arch out to +/- halfArc from the midline. */
    var MEMBRANE_X = (CRICOID.lumenA + CRICOID.archWall) * Math.sin(MEMBRANE.halfArc * RAD);
    function solveThyT(x) {
        var lo = 0, hi = 1;
        for (var i = 0; i < 30; i++) {
            var mid = (lo + hi) / 2;
            if (thyBotX(mid) < x) lo = mid; else hi = mid;
        }
        return lo;
    }
    var MEMBRANE_T = solveThyT(MEMBRANE_X);
    function membrane(u, v) {
        var sign = u < 0 ? -1 : 1, t = Math.abs(u) * MEMBRANE_T;
        var x = sign * thyBotX(t), p = thyPlan(t);
        var a = CRICOID.lumenA + CRICOID.archWall, b = CRICOID.lumenB + CRICOID.archWall;
        var c = clamp01(Math.abs(x) / a);
        var th = Math.atan2(-Math.sqrt(1 - c * c), sign * c);     // front half of the arch
        return [
            x,
            lerp(cricHeight(th), thyBotY(t), v),
            lerp(-b * Math.sqrt(1 - c * c), p[1], v)
        ];
    }

    /* ---------- arytenoids, vocal folds ---------- */

    var VOCAL_ANGLE = Math.atan2(ARYTENOID.vocalDir[1], ARYTENOID.vocalDir[0]);
    function aryBase() {
        var th = ARYTENOID.th * RAD;
        return cricPoint(th, 0.5, cricHeight(th) - ARYTENOID.embed);
    }
    /* u: angle around the base (a rounded triangle whose corners are the
       vocal, muscular and medial-posterior angles), v: 0 base -> 1 apex. */
    function arytenoid(sign) {
        var c = aryBase();
        return function (u, v) {
            var r = ARYTENOID.radius * (ARYTENOID.outline[0] + ARYTENOID.outline[1] * Math.cos(3 * (u - VOCAL_ANGLE)))
                * Math.pow(1 - v, ARYTENOID.taper);
            var lift = ARYTENOID.processLift * Math.pow(Math.max(0, Math.cos(u - VOCAL_ANGLE)), 3) * (1 - v);
            var lean = v * v;
            return [
                sign * (c[0] + r * Math.cos(u) + ARYTENOID.apexShift[0] * lean),
                c[1] + v * ARYTENOID.height + lift,
                c[2] + r * Math.sin(u) + ARYTENOID.apexShift[1] * lean
            ];
        };
    }
    function vocalProcess(sign) { return arytenoid(sign)(VOCAL_ANGLE, 0); }
    function apex(sign) { return arytenoid(sign)(0, 1); }

    var COMMISSURE = [0, THYROID.botMid + COMMISSURE_ABOVE_THYROID_BASE,
        THYROID.zAngle + THYROID.thick / 2 / Math.sin(THYROID.halfAngle * RAD)];   // inner apex

    /* ---------- epiglottis ---------- */

    function epiglottis(u, v) {
        var lobe = EPIGLOTTIS.lobe;
        var w = v < lobe
            ? lerp(EPIGLOTTIS.petiole, EPIGLOTTIS.width, smooth(v / lobe))
            : EPIGLOTTIS.width * Math.sqrt(Math.max(0, 1 - Math.pow((v - lobe) / (1 - lobe), 2)));
        return [
            u * w,
            EPIGLOTTIS.baseY + EPIGLOTTIS.rise * v,
            EPIGLOTTIS.baseZ + EPIGLOTTIS.lean * v - EPIGLOTTIS.bend * v * v
                + EPIGLOTTIS.curl * u * u * (w / EPIGLOTTIS.width)
        ];
    }

    /* ---------- hyoid ---------- */

    function hyoidBody(u, v) {
        var h = HYOID.height * Math.sqrt(1 - HYOID.taper * Math.pow(Math.abs(u), 6));
        return [
            u * HYOID.halfWidth,
            HYOID.midY + (v - 0.5) * h,
            HYOID.frontZ + HYOID.curve * u * u
        ];
    }
    function hyoidCornu(sign) {
        var end = hyoidBody(1, 0.5);
        return function (t) {
            return [
                sign * (lerp(end[0] - 0.1, HYOID.tipX, t) + 0.12 * Math.sin(PI * t)),
                lerp(end[1], HYOID.tipY, t),
                lerp(end[2], HYOID.tipZ, t)
            ];
        };
    }

    /* ---------- trachea ---------- */

    function tracheaRadii(th, f) {
        var w = f * TRACHEA.wall;
        return [TRACHEA.lumenA + w, TRACHEA.lumenB + w];
    }
    function ringTop(k) { return -TRACHEA.gapBelowCricoid - k * (TRACHEA.ringH + TRACHEA.ringGap); }
    var TRACHEA_BOTTOM = ringTop(TRACHEA.rings - 1) - TRACHEA.ringH;
    var TRACHEA_ARC = [
        (TRACHEA.gapCenter + (360 - TRACHEA.arc) / 2) * RAD,
        (TRACHEA.gapCenter + (360 - TRACHEA.arc) / 2 + TRACHEA.arc) * RAD
    ];

    /* ---------- assemble ---------- */

    var parts = [
        { kind: 'surface', fn: epiglottis, u: [-1, 1, 12], v: [0, 1, 18], thick: EPIGLOTTIS.thick, ink: 'muted' },

        /* hyoid: body plus the two greater cornua */
        { kind: 'surface', fn: hyoidBody, u: [-1, 1, 20], v: [0, 1, 6], thick: HYOID.thick, ink: 'muted' },
        { kind: 'tube', path: hyoidCornu(1), t: [0, 1, 12], radius: function (t) { return lerp(HYOID.cornuR[0], HYOID.cornuR[1], t); }, sides: 6, ink: 'muted' },
        { kind: 'tube', path: hyoidCornu(-1), t: [0, 1, 12], radius: function (t) { return lerp(HYOID.cornuR[0], HYOID.cornuR[1], t); }, sides: 6, ink: 'muted' },

        /* thyroid: two laminae, oblique lines, superior and inferior cornua */
        { kind: 'surface', fn: lamina(1), u: [0, 1, 36], v: [0, 1, 10], thick: THYROID.thick, ink: 'ink' },
        { kind: 'surface', fn: lamina(-1), u: [0, 1, 36], v: [0, 1, 10], thick: THYROID.thick, ink: 'ink' },
        { kind: 'line', ink: 'faint', points: obliqueLine(1) },
        { kind: 'line', ink: 'faint', points: obliqueLine(-1) },

        /* cricoid: the one complete ring */
        { kind: 'surface', fn: cricoid, u: [0, 2 * PI, 72], v: [0, 1, SECTION_SAMPLES], wrapU: true, wrapV: true, ink: 'ink' },

        /* cricothyroid membrane, the emergency airway: the one signal part */
        { kind: 'surface', fn: membrane, u: [-1, 1, 16], v: [0, 1, 6], ink: 'signal' },

        /* arytenoids (with a corniculate cartilage on each apex) and vocal folds */
        { kind: 'surface', fn: arytenoid(1), u: [0, 2 * PI, 24], v: [0, 1, 12], wrapU: true, ink: 'ink' },
        { kind: 'surface', fn: arytenoid(-1), u: [0, 2 * PI, 24], v: [0, 1, 12], wrapU: true, ink: 'ink' },
        { kind: 'sphere', center: apex(1), radius: ARYTENOID.cornicRadius, n: 8, ink: 'ink' },
        { kind: 'sphere', center: apex(-1), radius: ARYTENOID.cornicRadius, n: 8, ink: 'ink' },
        { kind: 'line', ink: 'muted', hidden: 'dots', points: [vocalProcess(-1), COMMISSURE, vocalProcess(1)] }
    ];

    /* thyroid cornua */
    [1, -1].forEach(function (sign) {
        var post = thyPoint(sign, 1, 1, 0), heel = thyPoint(sign, 1, 0, 0);
        var joint = cricPoint(CRICOID.jointTh * RAD, 1, CRICOID.jointY);
        parts.push({
            kind: 'cylinder', ink: 'ink', sides: 6, n: 3, caps: true,
            from: post, radius: THYROID.cornuR[0], radius2: THYROID.cornuR[1],
            to: [post[0] + sign * THYROID.cornuUp[0], post[1] + THYROID.cornuUp[1], post[2] + THYROID.cornuUp[2]]
        });
        parts.push({
            kind: 'cylinder', ink: 'ink', sides: 6, n: 3, caps: true,
            from: heel, radius: THYROID.inferiorR[0], radius2: THYROID.inferiorR[1],
            to: [sign * joint[0], joint[1], joint[2]]
        });
    });

    /* tracheal rings: C-shaped, gap centered posteriorly */
    for (var k = 0; k < TRACHEA.rings; k++) {
        (function (yTop) {
            parts.push({
                kind: 'surface', ink: 'ink', u: [TRACHEA_ARC[0], TRACHEA_ARC[1], 48], v: [0, 1, SECTION_SAMPLES], wrapV: true,
                fn: sectionBand(SECTION, tracheaRadii,
                    function () { return yTop; },
                    function () { return yTop - TRACHEA.ringH; }, TRACHEA.cz)
            });
        })(ringTop(k));
    }
    /* trachealis: the flat membranous wall closing each C */
    parts.push({
        kind: 'surface', ink: 'faint', u: [-1, 1, 6], v: [0, 1, 10],
        fn: function (u, v) {
            var end = tracheaEnd();
            return [u * end[0], lerp(0, TRACHEA_BOTTOM, v), end[1]];
        }
    });
    function tracheaEnd() {   // where a C's ends meet the flat wall: [x, z]
        var th = TRACHEA_ARC[0], r = tracheaRadii(th, 0.5);
        return [Math.abs(r[0] * Math.cos(th)), r[1] * Math.sin(th) + TRACHEA.cz];
    }

    /* label anchors, each on the part it names */
    var mark = {
        epiglottis: epiglottis(0.75, 0.85),
        hyoid: hyoidBody(0.9, 0.35),
        thyroid: thyPoint(1, 0.5, 0.55, 0.1),
        folds: [0.2, COMMISSURE[1] - 0.12, -0.4],
        membrane: membrane(0.4, 0.5),
        cricoid: cricPoint(20 * RAD, 1, 0.3),
        trachea: [TRACHEA.lumenA + TRACHEA.wall, ringTop(2) - TRACHEA.ringH / 2, TRACHEA.cz]
    };

    window.ASCII3D.define('larynx', {
        alt: 'The laryngeal skeleton and upper trachea, turning. The hyoid and epiglottis sit above the thyroid cartilage, whose two laminae meet at the front. Inside it the vocal folds run from the arytenoids to the front of the thyroid, seen dotted through the cartilage. Below the vocal folds, between the thyroid cartilage and the cricoid, the highlighted cricothyroid membrane is the site of an emergency surgical airway. The cricoid is the one complete ring, a signet with a low arch in front and a tall plate behind; the tracheal rings below it are C-shaped, open at the back.',
        cols: 72, rows: 44,
        camera: { frame: 'turntable', yaw: 35, pitch: 12, fit: 0.95 },
        motion: { spin: 20 },
        crease: 55,
        parts: parts,
        labels: [
            { at: mark.epiglottis, text: 'epiglottis', ink: 'muted' },
            { at: mark.hyoid, text: 'hyoid', ink: 'muted' },
            { at: mark.thyroid, text: 'thyroid' },
            { at: mark.folds, text: 'vocal folds', ink: 'muted' },
            { at: mark.membrane, text: 'cricothyroid\nmembrane', ink: 'signal' },
            { at: mark.cricoid, text: 'cricoid' },
            { at: mark.trachea, text: 'trachea' }
        ]
    });
})();
