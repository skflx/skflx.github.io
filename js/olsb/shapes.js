/* =============================================================
   js/olsb/shapes.js — OLSB shape library, loaded after the glossary and
   before the dioramas.

   Anatomical outlines authored once, in millimetres, in a local frame,
   then placed in a diorama with place(path, x, y, pxPerMm, deg, flipX).
   Sizes follow standard textbook dimensions (malleus about 8 mm long,
   incus long process about 5 mm, stapes 3.3 mm high with a 3 x 1.4 mm
   footplate, cochlea about 9 mm across the base and 5 mm high); the
   outlines themselves are drawn, not traced. Owner to verify
   (docs/decisions.md section 7).

   Local frames: x anterior (or medial, for the coronal shapes), y down
   (SVG). Paths use absolute M/L/C/Z only, so they transform pointwise.
   ============================================================= */
(function () {
    'use strict';

    /* Transform an absolute M/L/C/Z path: scale s, rotate deg, mirror x, then translate. */
    function place(path, x0, y0, s, deg, flipX) {
        var a = (deg || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
        var nums = [], out = [], toks = path.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
        function flush() {
            for (var i = 0; i + 1 < nums.length; i += 2) {
                var px = nums[i] * s * (flipX ? -1 : 1), py = nums[i + 1] * s;
                out.push((x0 + px * c - py * sn).toFixed(1), (y0 + px * sn + py * c).toFixed(1));
            }
            nums = [];
        }
        toks.forEach(function (t) {
            if (/[MLCZ]/.test(t)) { flush(); out.push(t); }
            else nums.push(parseFloat(t));
        });
        flush();
        return out.join(' ');
    }

    /* An ellipse as four cubic arcs (so it transforms like any other path). */
    function ellC(cx, cy, rx, ry) {
        var k = 0.5523, ox = rx * k, oy = ry * k;
        return 'M ' + (cx - rx) + ' ' + cy
            + ' C ' + (cx - rx) + ' ' + (cy - oy) + ' ' + (cx - ox) + ' ' + (cy - ry) + ' ' + cx + ' ' + (cy - ry)
            + ' C ' + (cx + ox) + ' ' + (cy - ry) + ' ' + (cx + rx) + ' ' + (cy - oy) + ' ' + (cx + rx) + ' ' + cy
            + ' C ' + (cx + rx) + ' ' + (cy + oy) + ' ' + (cx + ox) + ' ' + (cy + ry) + ' ' + cx + ' ' + (cy + ry)
            + ' C ' + (cx - ox) + ' ' + (cy + ry) + ' ' + (cx - rx) + ' ' + (cy + oy) + ' ' + (cx - rx) + ' ' + cy + ' Z';
    }

    /* ---- ossicles, lateral view of a right ear (x anterior, y down) ---- */
    /* Malleus: origin at the lateral process. Head about 2.4 x 3 mm,
       manubrium about 4.3 mm from lateral process to the spatulate umbo tip. */
    var MALLEUS_LAT = 'M -1.3 -3.4 C -1.3 -4.8 1.0 -5.0 1.1 -3.6 C 1.2 -2.9 0.8 -2.4 0.5 -2.1 '
        + 'L 2.2 -1.6 L 2.2 -1.3 L 0.5 -1.5 L 0.45 -0.4 C 0.9 -0.4 0.9 0.3 0.45 0.4 '
        + 'L 0.95 3.9 C 1.0 4.4 0.5 4.5 0.45 4.1 L -0.1 0.6 C -0.5 0.4 -0.5 -0.3 -0.1 -0.5 '
        + 'L -0.25 -2.1 C -1.0 -2.4 -1.3 -2.8 -1.3 -3.4 Z';
    /* Incus: origin at the centre of the body. Short process about 3 mm
       posteriorly; long process about 5 mm down to the lenticular process. */
    var INCUS_LAT = 'M 1.2 -1.4 C 1.4 -0.6 1.3 0.6 0.9 1.2 L 0.7 2.2 C 0.8 3.5 0.9 4.6 0.8 5.4 '
        + 'C 0.9 5.8 0.4 6.0 0.2 5.7 C 0.2 4.8 0.1 3.4 -0.2 2.0 C -0.6 1.3 -1.0 0.8 -1.4 0.6 '
        + 'L -4.3 0.15 L -4.3 -0.2 L -1.5 -0.8 C -1.3 -1.6 -0.2 -2.0 1.2 -1.4 Z';
    /* Stapes seen end-on from lateral: footplate 3 x 1.4 mm, the crura as a
       ring around the obturator foramen, the head in the middle. */
    var STAPES_END = ellC(0, 0, 1.5, 0.7) + ' ' + ellC(0, 0, 1.05, 0.42) + ' ' + ellC(0, 0, 0.42, 0.32);

    /* ---- ossicles in coronal section (x medial, y down; right ear seen from front) ---- */
    /* Malleus: origin at the lateral process; the head sits about 0.9 mm medial. */
    var MALLEUS_COR = 'M -0.1 -4.2 C -0.3 -5.6 2.2 -5.7 2.1 -4.1 C 2.0 -3.0 1.2 -2.4 0.9 -1.8 '
        + 'L 0.4 -0.4 C 0.3 0 0.3 0.2 0.35 0.4 L 0.95 4.2 C 1.0 4.6 0.5 4.7 0.45 4.4 '
        + 'L -0.25 0.5 C -0.85 0.4 -1.05 0 -0.85 -0.35 L -0.35 -0.5 L 0.15 -1.8 '
        + 'C -0.1 -2.4 -0.1 -3.0 -0.1 -4.2 Z';
    /* Stapes in profile: origin at the footplate centre, crura running
       laterally (-x) 3.3 mm to the head. */
    var STAPES_SIDE = 'M 0 -1.5 L 0 1.5 L -0.3 1.5 L -0.3 -1.5 Z '
        + 'M -0.3 -1.3 C -1.5 -1.2 -2.3 -0.6 -2.6 -0.3 L -3.3 -0.35 L -3.3 0.35 L -2.6 0.3 '
        + 'C -2.3 0.6 -1.5 1.2 -0.3 1.3 L -0.3 0.9 C -1.3 0.8 -2.0 0.4 -2.3 0.1 L -2.3 -0.1 '
        + 'C -2.0 -0.4 -1.3 -0.8 -0.3 -0.9 Z';

    /* ---- cochlea, mid-modiolar section: base on y = 0, apex at y = -5.3 ---- */
    var COCHLEA_CAPSULE = 'M -4.6 0 C -4.9 -2.6 -2.6 -5.1 0 -5.4 C 2.6 -5.1 4.9 -2.6 4.6 0 '
        + 'C 3 0.5 -3 0.5 -4.6 0 Z';
    var COCHLEA_TURNS = [
        [-3.2, -1.2, 1.15, 0.95], [3.2, -1.2, 1.15, 0.95],     /* basal turn */
        [-2.0, -2.95, 0.85, 0.72], [2.0, -2.95, 0.85, 0.72],   /* middle turn */
        [-0.85, -4.2, 0.55, 0.48], [0.85, -4.2, 0.55, 0.48]    /* apical turn */
    ];
    function cochleaLumens() { return COCHLEA_TURNS.map(function (t) { return ellC(t[0], t[1], t[2], t[3]); }).join(' '); }
    /* Osseous spiral lamina: a shelf from the modiolus halfway across each turn. */
    function cochleaLamina() {
        return COCHLEA_TURNS.map(function (t) {
            var inner = t[0] < 0 ? t[0] + t[2] : t[0] - t[2], mid = t[0];
            return 'M ' + inner + ' ' + t[1] + ' L ' + mid + ' ' + t[1];
        }).join(' ');
    }
    var MODIOLUS = 'M -0.5 0.2 L -0.35 -3.9 L 0.35 -3.9 L 0.5 0.2 Z';

    /* ---- pneumatization: irregular cells packed into a box, deterministic ---- */
    function rng(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function aircells(x, y, w, h, n, rmin, rmax, seed) {
        var r = rng(seed || 1), placed = [], out = [], tries = 0;
        while (placed.length < n && tries < n * 60) {
            tries++;
            var rad = rmin + (rmax - rmin) * Math.pow(r(), 1.6);
            var cx = x + rad + r() * (w - 2 * rad), cy = y + rad + r() * (h - 2 * rad), ok = true;
            for (var i = 0; i < placed.length; i++) {
                var p = placed[i], dx = p[0] - cx, dy = p[1] - cy;
                if (dx * dx + dy * dy < Math.pow(p[2] + rad + Math.max(1.5, rad * 0.18), 2)) { ok = false; break; }
            }
            if (!ok) continue;
            placed.push([cx, cy, rad]);
            var k = 6 + Math.floor(r() * 3), rot = r() * Math.PI * 2, pts = [];
            for (var j = 0; j < k; j++) {
                var a = rot + j / k * Math.PI * 2, rr = rad * (0.78 + r() * 0.26);
                pts.push((cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1));
            }
            out.push('M ' + pts.join(' L ') + ' Z');
        }
        return out.join(' ');
    }

    window.OLSB.shapes = {
        place: place,
        ellC: ellC,
        aircells: aircells,
        malleusLat: function (x, y, s, deg) { return place(MALLEUS_LAT, x, y, s, deg); },
        incusLat: function (x, y, s, deg) { return place(INCUS_LAT, x, y, s, deg); },
        stapesEnd: function (x, y, s, deg) { return place(STAPES_END, x, y, s, deg); },
        malleusCor: function (x, y, s, deg) { return place(MALLEUS_COR, x, y, s, deg); },
        stapesSide: function (x, y, s, deg) { return place(STAPES_SIDE, x, y, s, deg); },
        cochleaCapsule: function (x, y, s, deg) { return place(COCHLEA_CAPSULE, x, y, s, deg); },
        cochleaLumens: function (x, y, s, deg) { return place(cochleaLumens(), x, y, s, deg); },
        cochleaLamina: function (x, y, s, deg) { return place(cochleaLamina() + ' ' + MODIOLUS, x, y, s, deg); }
    };
})();
