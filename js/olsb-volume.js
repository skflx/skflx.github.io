/* =============================================================
   olsb-volume.js — OLSB 3D model: a right temporal bone as a labelled
   voxel volume, built in the browser (and in Node, by the checks).

   DOM-free on purpose: js/olsb-3d.js draws it, tools/check-data.mjs
   builds it to check its labels against the glossary and its geometry
   against the glossary's directional relations.

   Frame (mm, a RIGHT ear): x lateral, y anterior, z superior; origin at
   the centre of the oval window. Every structure is placed from
   standard adult dimensions and relations (canal lengths, ossicle
   sizes, the canals' mutual planes, the facial nerve's segments), then
   rasterized at VOX mm: later paints overwrite earlier ones, so the
   order of build() is the anatomy's priority (air carves bone, the otic
   capsule and fallopian canal carve air back, lumens and nerves win).
   Surgical states carve the built volume (carve()), keeping protective
   margins round the hazards the way the drill would.

   Geometry is a schematic reconstruction, not a scan: positions are
   about right, shapes are idealized. Draft content: medical correctness
   is the owner's to verify (docs/decisions.md section 7).
   ============================================================= */
(function () {
    'use strict';

    /* A page script, a Web Worker (js/olsb-3d.js starts this file as one) or Node. */
    var root = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis;
    var O = root.OLSB || (root.OLSB = {});

    /* ---------- vectors ---------- */
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function len(a) { return Math.sqrt(dot(a, a)); }
    function nrm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    /* ---------- labels ----------
       [id (glossary key), layer, tone (--olsb-<tone>), flags]
       flags: 'air' is drawn only as a cast (Air layer); 'cut' marks bone
       the drill may take. Code 0 is empty space. */
    var LAYERS = [
        { id: 'bone', name: 'Bone' },
        { id: 'canal', name: 'Canal & drum' },
        { id: 'ossicles', name: 'Ossicles' },
        { id: 'nerves', name: 'Nerves' },
        { id: 'muscles', name: 'Muscles' },
        { id: 'inner', name: 'Inner ear' },
        { id: 'vessels', name: 'Vessels' },
        { id: 'dura', name: 'Dura' },
        { id: 'brain', name: 'Brain' },
        { id: 'air', name: 'Air (cast)' }
    ];
    var LABELS = [null,
        ['tbone', 'bone', 'bone', 'cut'], ['cortex', 'bone', 'bone', 'cut'], ['pcw', 'bone', 'bone', 'cut'],
        ['scutum', 'bone', 'bone', 'cut'], ['tegmen', 'bone', 'plate'], ['tegment', 'bone', 'plate'],
        ['sigplate', 'bone', 'plate'], ['fcanal', 'bone', 'bone-dark'], ['oticcap', 'bone', 'otic'],
        ['oticcap', 'bone', 'otic', 'cochlear'], ['promontory', 'bone', 'otic', 'cochlear'], ['macewen', 'bone', 'zone', 'cut'], ['henle', 'bone', 'bone', 'cut'],
        ['templine', 'bone', 'bone', 'cut'], ['zygroot', 'bone', 'bone', 'cut'], ['pyramid', 'bone', 'bone-dark'],
        ['cochleariform', 'bone', 'bone-dark'], ['tip', 'bone', 'bone', 'cut'],
        ['eac', 'canal', 'skin'], ['tm', 'canal', 'tm'], ['flaccida', 'canal', 'tm'], ['annulus', 'canal', 'tm-edge'],
        ['malleus', 'ossicles', 'ossicle'], ['incus', 'ossicles', 'ossicle'], ['stapes', 'ossicles', 'ossicle'],
        ['fn-meatal', 'nerves', 'nerve'], ['fn-lab', 'nerves', 'nerve'], ['geniculate', 'nerves', 'nerve'],
        ['fn-tymp', 'nerves', 'nerve'], ['genu2', 'nerves', 'nerve'], ['fn', 'nerves', 'nerve'],
        ['chorda', 'nerves', 'nerve'], ['gspn', 'nerves', 'nerve'], ['cn8', 'nerves', 'nerve'],
        ['tensor', 'muscles', 'muscle'], ['stapedius', 'muscles', 'muscle'],
        ['cochlea', 'inner', 'perilymph'], ['vestibule', 'inner', 'perilymph'], ['lscc', 'inner', 'perilymph'],
        ['ssc', 'inner', 'perilymph'], ['pscc', 'inner', 'perilymph'], ['rw', 'inner', 'tm'], ['els', 'inner', 'perilymph'],
        ['ica', 'vessels', 'artery'], ['sigmoid', 'vessels', 'vein'], ['jb', 'vessels', 'vein'],
        ['mcfdura', 'dura', 'dura'], ['pfdura', 'dura', 'dura'], ['iac', 'dura', 'dura'],
        ['temporallobe', 'brain', 'brain'], ['cerebellum', 'brain', 'brain'],
        ['epitympanum', 'air', 'cast', 'air'], ['mesotympanum', 'air', 'cast', 'air'], ['hypotympanum', 'air', 'cast-2', 'air'],
        ['protympanum', 'air', 'cast-2', 'air'], ['retrotympanum', 'air', 'cast-2', 'air'], ['prussak', 'air', 'cast-2', 'air'],
        ['et', 'air', 'cast', 'air'], ['aditus', 'air', 'cast-2', 'air'], ['antrum', 'air', 'cast', 'air'],
        ['mastoidcells', 'air', 'cast-2', 'air'], ['hypocells', 'air', 'cast', 'air'], ['recess', 'air', 'cast', 'air'],
        ['sinustymp', 'air', 'cast', 'air'], ['cavity', 'air', 'cut', 'air drilled']
    ].map(function (r, i) {
        if (!r) return null;
        var f = r[3] || '';
        return { code: i, id: r[0], layer: r[1], tone: r[2], air: /\bair\b/.test(f), cut: /\bcut\b/.test(f),
            cochlear: /\bcochlear\b/.test(f), drilled: /\bdrilled\b/.test(f) };
    });
    var C = {};   /* first code for each id (the cochlear capsule is LABELS by flag) */
    LABELS.forEach(function (l) { if (l && !(l.id in C)) C[l.id] = l.code; });
    var C_COCHCAP = LABELS.filter(function (l) { return l && l.cochlear; })[0].code;

    /* ---------- the anatomy (mm) ---------- */
    /* Lateral surface of the skull: flat over the mastoid, curving in at the tip. */
    function cortexX(y, z) {
        var dy = (y + 11) / 8, dz = (z + 3) / 9;
        return 11.9 + 1.5 * Math.exp(-dy * dy - dz * dz) - (z < -8 ? 0.09 * (z + 8) * (z + 8) : 0) - (y > 9 ? 0.25 * (y - 9) : 0)
            + 0.08 * Math.sin(0.9 * y + 1.3) * Math.sin(0.7 * z);
    }
    /* The specimen: a rounded block cut out of the skull around the ear. */
    var SPEC_C = [0, -3.5, -3], SPEC_R = [15.5, 21, 14.6];
    function inSpecimen(x, y, z) {
        var a = (x - SPEC_C[0]) / SPEC_R[0], b = (y - SPEC_C[1]) / SPEC_R[1], c = (z - SPEC_C[2]) / SPEC_R[2];
        return a * a * a * a + b * b * b * b + c * c * c * c <= 1;
    }
    /* Middle fossa floor: high over the attic, lower anteromedially, a bump over the superior canal. */
    function floorZ(x, y) {
        var dx = x + 2.4, dy = y + 0.8;
        return 8.8 + 0.1 * x - 0.22 * Math.max(0, y - 3) + 0.12 * Math.max(0, -y - 14)
            + 0.55 * Math.exp(-(dx * dx + dy * dy) / 5);
    }
    /* Skull base underside; the mastoid tip hangs below it posterolaterally. */
    function baseZ(x, y) {
        var t = clamp((x - 3) / 4, 0, 1), dy = (y + 12) / 6;
        return -12.5 - 7 * Math.exp(-dy * dy) * t;
    }
    /* Posterior face of the petrous bone: a plane parallel to the posterior canal. */
    var PF_N = nrm([-0.63, -0.78, 0]), PF_A = [-15, 1.5, 0];
    function pfSide(p) { return dot(PF_N, sub(p, PF_A)); }

    /* External canal: elliptical, axis tilting anteroinferiorly as it goes medially. */
    var EAC_C = [0.5, -0.3], EAC_R = [3.3, 4.0];
    function eacAxis(x) { return [EAC_C[0] + 0.03 * (x - 6), EAC_C[1] + 0.04 * (x - 6)]; }
    function eacRho(x, y, z) { var a = eacAxis(x), dy = (y - a[0]) / EAC_R[0], dz = (z - a[1]) / EAC_R[1]; return Math.sqrt(dy * dy + dz * dz); }
    /* Tympanic membrane: oblique (top lateral, front medial), tented in to the umbo. */
    var ANN_C = [0.45, -0.5], ANN_R = [3.7, 4.4], UMBO = [0.25, -1.0];
    function tmFlat(y, z) { return 5.3 + 0.6 * z - 0.25 * y; }
    function tmX(y, z) {
        var dy = y - UMBO[0], dz = z - UMBO[1], r = Math.sqrt(dy * dy + dz * dz) / 4.3;
        return tmFlat(y, z) - 1.4 * Math.max(0, 1 - r) * Math.max(0, 1 - r * 0.3);
    }
    function annRho(y, z) { var dy = (y - ANN_C[0]) / ANN_R[0], dz = (z - ANN_C[1]) / ANN_R[1]; return Math.sqrt(dy * dy + dz * dz); }

    /* Facial nerve, segment by segment (centre line, mm). */
    var FN = {
        meatal: [[-16.5, 2.0, 0.8], [-10, 1.9, 0.8], [-5.8, 1.9, 1.0]],
        lab: [[-5.8, 1.9, 1.0], [-4.3, 2.5, 2.4], [-2.6, 3.2, 3.0], [-1.4, 3.6, 3.1]],
        tymp: [[-1.4, 3.6, 3.1], [-0.1, 2.7, 2.4], [0.8, 1.0, 1.65], [1.1, -1.5, 1.5], [1.2, -3.0, 1.35]],
        genu2: [[1.2, -3.0, 1.35], [1.35, -4.4, 0.7], [1.5, -5.2, -0.8]],
        mastoid: [[1.5, -5.2, -0.8], [1.8, -5.6, -4], [2.2, -5.9, -9], [2.6, -6.1, -16]]
    };
    var GENICULATE = [-1.4, 3.6, 3.1];
    var CHORDA = [[2.2, -5.9, -8.5], [3.4, -5.4, -4.0], [4.6, -4.6, -0.5], [5.5, -3.7, 1.8], [5.35, -1.5, 3.1],
        [5.3, 0.8, 3.4], [5.6, 3.4, 3.1], [6.0, 5.2, 2.6], [6.6, 8.0, 1.5]];
    var SIGMOID = [[4.6, -25.5, 7.4, 3.6], [5.2, -21.5, 3.5, 3.8], [4.6, -18.5, -1.5, 3.8], [2.8, -14.5, -6.0, 3.5],
        [-0.8, -10.5, -9.0, 3.1], [-1.0, -5.5, -10.6, 3.0]];
    var JB = [-1.0, -3.0, -10.6], JB_R = 3.0;
    var ICA = [[-2.0, 7.4, -19, 2.3], [-2.2, 7.6, -9, 2.3], [-2.8, 8.2, -6.2, 2.3], [-5.2, 10.4, -5.6, 2.3],
        [-12.5, 16, -5.2, 2.3], [-17, 19.5, -5, 2.3]];
    var ET = [[2.6, 4.6, -1.0, 1.6], [1.5, 8, -1.8, 1.35], [-0.8, 12, -3.4, 1.1], [-3.5, 16.5, -5.2, 1.0], [-6, 20, -6.8, 1.0]];
    var TENSOR = [[0.3, 2.7, 0.6, 0.7], [-0.9, 6, -0.4, 0.8], [-3.6, 11.5, -1.8, 0.8], [-6, 16, -3.2, 0.7]];
    var IAC_AX = [[-5.6, 1.4, -0.1], [-16.5, 1.7, -0.3]], IAC_R = 2.0;
    var VESTIBULE = { c: [-2.0, -0.7, 0.4], r: [1.3, 2.1, 1.6] };
    /* Canals: centre, plane normal, radius, two vestibular ends (the first ampullated). */
    var SCC = {
        lscc: { c: [-0.5, -2.6, 3.3], n: nrm([0, -0.5, 0.87]), R: 2.6, a: [-1.3, 0.6, 1.7], b: [-1.8, -2.4, 1.3] },
        ssc: { c: [-2.4, -0.8, 3.9], n: nrm([-0.78, 0.63, 0]), R: 2.7, a: [-1.8, 0.9, 1.9], b: [-3.0, -1.9, 1.9] },
        pscc: { c: [-1.9, -3.7, 0.2], n: nrm([-0.63, -0.78, 0]), R: 2.6, a: [-2.3, -2.3, -0.9], b: [-3.0, -1.9, 1.9] }
    };
    /* Cochlea: base centre, axis toward the apex (anterolateral, inferior), the round window it hooks to. */
    var COCH = { B: [-3.9, 1.9, -2.4], a: nrm([0.52, 0.78, -0.35]), W: [0.3, -1.3, -2.9], turns: 2.6 };

    /* Ossicles. The malleus handle follows the drum, just medial to it. */
    var LATPROC = [0.9, 3.3];
    function onTm(y, z, inset) { return [tmX(y, z) - inset, y, z]; }

    /* ---------- grid and painting ---------- */
    var LEVELS = {
        coarse: { vox: 0.3, box: [-16, -25, -18, 16, 18, 12] },
        fine: { vox: 0.1, box: [-7.6, -10, -5.4, 8.6, 5.9, 9.3] },
        /* a cube of this many mm, rebuilt round wherever you look closely inside the fine box */
        micro: { vox: 0.05, size: 8 }
    };
    function Grid(vox, box) {
        this.vox = vox;
        this.o = [box[0], box[1], box[2]];
        this.nx = Math.round((box[3] - box[0]) / vox);
        this.ny = Math.round((box[4] - box[1]) / vox);
        this.nz = Math.round((box[5] - box[2]) / vox);
        this.lab = new Uint8Array(this.nx * this.ny * this.nz);
        /* Sub-voxel depth: how far (in voxels, 0-1 as 0-255) a voxel's centre lies inside the
           shape that gave it its label, or outside the skull for empty space. The viewer puts
           surfaces where these meet, not on voxel faces. 255 = a voxel or more, or unknown. */
        this.dep = new Uint8Array(this.nx * this.ny * this.nz).fill(255);
    }
    Grid.prototype.p = function (i, j, k) {
        var v = this.vox, o = this.o;
        return [o[0] + (i + 0.5) * v, o[1] + (j + 0.5) * v, o[2] + (k + 0.5) * v];
    };
    /* Visit every voxel in an mm box: fn(x, y, z, index). */
    Grid.prototype.each = function (b, fn) {
        var v = this.vox, o = this.o, nx = this.nx, ny = this.ny;
        var i0 = Math.max(0, Math.floor((b[0] - o[0]) / v)), i1 = Math.min(nx - 1, Math.ceil((b[3] - o[0]) / v));
        var j0 = Math.max(0, Math.floor((b[1] - o[1]) / v)), j1 = Math.min(ny - 1, Math.ceil((b[4] - o[1]) / v));
        var k0 = Math.max(0, Math.floor((b[2] - o[2]) / v)), k1 = Math.min(this.nz - 1, Math.ceil((b[5] - o[2]) / v));
        for (var k = k0; k <= k1; k++) {
            var z = o[2] + (k + 0.5) * v;
            for (var j = j0; j <= j1; j++) {
                var y = o[1] + (j + 0.5) * v, row = nx * (j + ny * k);
                for (var i = i0; i <= i1; i++) fn(o[0] + (i + 0.5) * v, y, z, row + i);
            }
        }
    };
    Grid.prototype.all = function (fn) {
        var o = this.o, v = this.vox;
        this.each([o[0], o[1], o[2], o[0] + this.nx * v, o[1] + this.ny * v, o[2] + this.nz * v], fn);
    };

    /* Distance from p to segment ab, and the parameter along it. */
    function segDist(p, a, b) {
        var ab = sub(b, a), t = clamp(dot(sub(p, a), ab) / (dot(ab, ab) || 1), 0, 1);
        return { d: len(sub(p, add(a, mul(ab, t)))), t: t };
    }
    /* Catmull-Rom through [x,y,z,(r)] points, n samples per span. */
    function spline(pts, n) {
        var out = [];
        for (var s = 0; s < pts.length - 1; s++) {
            var p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(pts.length - 1, s + 2)];
            for (var i = 0; i < n; i++) {
                var t = i / n, t2 = t * t, t3 = t2 * t, q = [];
                for (var c = 0; c < p1.length; c++) {
                    q.push(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2
                        + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3));
                }
                out.push(q);
            }
        }
        out.push(pts[pts.length - 1].slice());
        return out;
    }
    /* Minimum distance from p to a polyline, minus its (interpolated) radius. */
    function tubeDist(p, line, r) {
        var best = 1e9;
        for (var s = 0; s < line.length - 1; s++) {
            var a = line[s], b = line[s + 1], q = segDist(p, a, b);
            var ra = r != null ? r : a[3], rb = r != null ? r : b[3];
            var d = q.d - (ra + (rb - ra) * q.t);
            if (d < best) best = d;
        }
        return best;
    }
    function lineBox(line, pad) {
        var b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
        line.forEach(function (p) {
            var r = (p[3] || 0) + pad;
            for (var c = 0; c < 3; c++) { b[c] = Math.min(b[c], p[c] - r); b[c + 3] = Math.max(b[c + 3], p[c] + r); }
        });
        return b;
    }

    /* ---------- build ---------- */
    function build(opts) {
        opts = opts || {};
        var vox = opts.vox || LEVELS.coarse.vox;
        var g = new Grid(vox, opts.box || LEVELS.coarse.box);
        var lab = g.lab, dep = g.dep, minR = vox * 0.62, DQ = 255 / vox;
        function D(i, mm) { var q = Math.round(mm * DQ); dep[i] = q < 0 ? 0 : q > 255 ? 255 : q; }
        /* paint inside a shape (a union of same-label shapes keeps the deepest), or note that a
           voxel just outside it now has that shape's surface within mm of its centre */
        function IN(i, code, mm) {
            var q = Math.round(mm * DQ); q = q < 0 ? 0 : q > 255 ? 255 : q;
            if (lab[i] === code) { if (q > dep[i]) dep[i] = q; } else { lab[i] = code; dep[i] = q; }
        }
        function OUT(i, code, mm) {
            if (lab[i] === code || mm >= vox) return;
            var q = Math.round(mm * DQ);
            if (q < dep[i]) dep[i] = q < 0 ? 0 : q;
        }

        /* paint a tube (pts with radius, or r) with grow mm extra; only over codes allowed by `over` (null: any) */
        function tube(pts, code, r, grow, over, n) {
            var line = spline(pts, n || 6);
            if (r != null) line = line.map(function (q) { return [q[0], q[1], q[2], r]; });
            line = line.map(function (q) { return [q[0], q[1], q[2], Math.max(minR, q[3]) + (grow || 0)]; });
            for (var s = 0; s < line.length - 1; s++) {
                var a = line[s], b = line[s + 1];
                g.each(lineBox([a, b], vox), function (x, y, z, i) {
                    var q = segDist([x, y, z], a, b);
                    var r = a[3] + (b[3] - a[3]) * q.t;
                    if (q.d > r) { OUT(i, code, q.d - r); return; }
                    if (over && !over[lab[i]]) return;
                    IN(i, code, r - q.d);
                });
            }
            return line;
        }
        /* paint an ellipsoid (optionally in a basis u,v,w and with superellipse power) */
        function blob(c, r, code, over, pw, basis) {
            var m = Math.max(r[0], r[1], r[2]) + vox, mr = Math.min(r[0], r[1], r[2]);
            pw = pw || 2;
            g.each([c[0] - m, c[1] - m, c[2] - m, c[0] + m, c[1] + m, c[2] + m], function (x, y, z, i) {
                var d = [x - c[0], y - c[1], z - c[2]];
                if (basis) d = [dot(d, basis[0]), dot(d, basis[1]), dot(d, basis[2])];
                var s = Math.pow(Math.abs(d[0] / r[0]), pw) + Math.pow(Math.abs(d[1] / r[1]), pw) + Math.pow(Math.abs(d[2] / r[2]), pw);
                var e = (Math.pow(s, 1 / pw) - 1) * mr;     /* approximate signed distance */
                if (e > 0) { OUT(i, code, e); return; }
                if (over && !over[lab[i]]) return;
                IN(i, code, -e);
            });
        }
        function mask(codes) { var m = new Uint8Array(256); codes.forEach(function (c) { m[c] = 1; }); return m; }
        var BONY = mask([C.tbone, C.cortex, C.pcw, C.scutum, C.mastoidcells, C.hypocells, C.tegmen, C.tegment, C.henle, C.macewen, C.templine, C.zygroot, C.tip]);
        var AIRY = mask([C.mastoidcells, C.hypocells, C.epitympanum, C.mesotympanum, C.hypotympanum, C.protympanum,
            C.retrotympanum, C.prussak, C.et, C.aditus, C.antrum, C.recess, C.sinustymp]);
        var NOT_CRANIAL = mask(LABELS.filter(function (l) { return l && l.id !== 'mcfdura' && l.id !== 'pfdura' && l.layer !== 'brain'; })
            .map(function (l) { return l.code; }).concat([0]));
        NOT_CRANIAL[0] = 0;

        /* 1. Regions: empty outside the skull, cranial cavities, bone. */
        var sigLine = spline(SIGMOID, 6);
        g.all(function (x, y, z, i) {
            var cx = cortexX(y, z), fz = floorZ(x, y), bz = baseZ(x, y), p = [x, y, z];
            /* depth to the nearest region surface: cortex, skull base, specimen cut, dura */
            var sa = (x - SPEC_C[0]) / SPEC_R[0], sb = (y - SPEC_C[1]) / SPEC_R[1], sc = (z - SPEC_C[2]) / SPEC_R[2];
            var spec = Math.abs(Math.pow(sa * sa * sa * sa + sb * sb * sb * sb + sc * sc * sc * sc, 0.25) - 1) * 14.6;
            var dd = Math.min(Math.abs(x - cx), Math.abs(z - bz), spec);
            if (x < cx - 1.6) dd = Math.min(dd, Math.abs(z - fz), Math.abs(z - fz - 0.7));
            if (x < 3.5) dd = Math.min(dd, Math.abs(pfSide(p)), Math.abs(pfSide(p) - 0.7));
            D(i, dd);
            if (x > cx || z < bz || !inSpecimen(x, y, z)) return;          /* outside */
            if (y > 7.5 && z < 2.5 && x > 2.5) return;                     /* glenoid fossa (TMJ) */
            if (x < cx - 1.6 && z > fz) { lab[i] = z > fz + 0.7 ? C.temporallobe : C.mcfdura; return; }
            var pf = pfSide(p);
            if (pf > 0 && x < 3.5 && z <= fz) { lab[i] = pf > 0.7 ? C.cerebellum : C.pfdura; return; }
            if (x > cx - 0.7) { lab[i] = C.cortex; return; }
            lab[i] = z > baseZ(x, y) + 0 && y < -5 && x > 3 && z < -12.5 ? C.tip : C.tbone;
        });

        /* 2. Mastoid air cells: a jittered Voronoi foam with thin septa, inside the mastoid. */
        var pneu = opts.pneu == null ? 1 : opts.pneu;
        function hash(a, b, c, s) {
            var h = (a * 374761393 + b * 668265263 + c * 2147483647 + s * 1274126177) | 0;
            h = Math.imul(h ^ (h >>> 13), 1274126177);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        }
        /* Seeds are a function of the cell's integer coordinates, so both grids grow the same foam. */
        function cells(box, cell, septum, keep, code, seed) {
            var g0 = [0, 1, 2].map(function (c) { return Math.floor(box[c] / cell) - 1; });
            var gn = [0, 1, 2].map(function (c) { return Math.floor(box[c + 3] / cell) + 2 - g0[c]; });
            var nC = gn[0] * gn[1] * gn[2], SX = new Float32Array(nC), SY = new Float32Array(nC), SZ = new Float32Array(nC), SS = new Float32Array(nC);
            for (var c3 = 0; c3 < gn[2]; c3++) for (var c2 = 0; c2 < gn[1]; c2++) for (var c1 = 0; c1 < gn[0]; c1++) {
                var a = c1 + g0[0], b = c2 + g0[1], c = c3 + g0[2], ci = c1 + gn[0] * (c2 + gn[1] * c3);
                SX[ci] = (a + 0.15 + 0.7 * hash(a, b, c, seed)) * cell;
                SY[ci] = (b + 0.15 + 0.7 * hash(a, b, c, seed + 1)) * cell;
                SZ[ci] = (c + 0.15 + 0.7 * hash(a, b, c, seed + 2)) * cell;
                SS[ci] = hash(a, b, c, seed + 3);
            }
            var nd = new Float64Array(5), ni = new Int32Array(5);
            g.each(box, function (x, y, z, i) {
                if (lab[i] !== C.tbone && lab[i] !== C.tip) return;
                if (!keep(x, y, z)) return;
                var gx = Math.floor(x / cell) - g0[0], gy = Math.floor(y / cell) - g0[1], gz = Math.floor(z / cell) - g0[2], n = 0;
                for (var iz = -1; iz <= 1; iz++) for (var iy = -1; iy <= 1; iy++) for (var ix = -1; ix <= 1; ix++) {
                    var ci = (gx + ix) + gn[0] * ((gy + iy) + gn[1] * (gz + iz));
                    var dx = x - SX[ci], dy = y - SY[ci], dz = z - SZ[ci], d2 = dx * dx + dy * dy + dz * dz;
                    var k = n < 5 ? n : 5;
                    while (k > 0 && nd[k - 1] > d2) k--;
                    if (k < 5) {
                        for (var m = Math.min(n, 4); m > k; m--) { nd[m] = nd[m - 1]; ni[m] = ni[m - 1]; }
                        nd[k] = d2; ni[k] = ci;
                        if (n < 5) n++;
                    }
                }
                var a0 = ni[0];
                if (SS[a0] > pneu * 0.92) return;                          /* a solid (unpneumatized) cell */
                var best = 1e9;
                for (var kk = 1; kk < 5; kk++) {
                    var b0 = ni[kk], ux = SX[b0] - SX[a0], uy = SY[b0] - SY[a0], uz = SZ[b0] - SZ[a0], ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
                    var t = ((x - (SX[a0] + SX[b0]) / 2) * ux + (y - (SY[a0] + SY[b0]) / 2) * uy + (z - (SZ[a0] + SZ[b0]) / 2) * uz) / ul;
                    if (-t < best) best = -t;
                }
                if (best > septum / 2) IN(i, code, best - septum / 2); else OUT(i, code, septum / 2 - best);
            });
        }
        if (pneu > 0) {
            cells([-1.5, -24.5, -20, 13, -4.6, 10], 2.7, 0.42, function (x, y, z) {
                if (x > cortexX(y, z) - 1.1 || z > floorZ(x, y) - 0.9 || z < baseZ(x, y) + 0.9) return false;
                if (pfSide([x, y, z]) > -0.8) return false;
                return eacRho(x, y, z) > 1.45 && !(x < 1 && y > -6 && z < -6);
            }, C.mastoidcells, 11);
            cells([-1.6, -3.5, -9.6, 3.2, 3.6, -7.2], 1.3, 0.3, function () { return true; }, C.hypocells, 23);
        }

        /* 3. Air spaces of the ear, then the bone that bounds them. */
        var EAC_SKIN = 0.35;
        g.each([2, -4.5, -6, 16, 6, 5.5], function (x, y, z, i) {
            if (x > cortexX(y, z)) return;
            var rho = eacRho(x, y, z);
            var t = tmX(y, z);
            if (rho > 1 || x < t - 0.3) return;
            if (annRho(y, z) <= 1 ? x <= t + 0.25 : x <= tmFlat(y, z) + 0.25) return;
            var mr = Math.min(EAC_R[0], EAC_R[1]), skinAt = 1 - EAC_SKIN / mr;
            var tmEnd = x - (annRho(y, z) <= 1 ? t : tmFlat(y, z)) - 0.25;
            lab[i] = rho > skinAt ? C.eac : 0;
            D(i, Math.min(rho > skinAt ? Math.min((rho - skinAt) * mr, (1 - rho) * mr) : (skinAt - rho) * mr, tmEnd));
        });
        /* Posterior canal wall: the bone behind the canal, lateral to the drum. */
        g.each([2, -8, -6, 14, 1, 5], function (x, y, z, i) {
            if (!BONY[lab[i]] || lab[i] === C.mastoidcells) return;
            var a = eacAxis(x);
            if (eacRho(x, y, z) < 1.75 && y < a[0] - 1.2 && x > tmFlat(y, z) - 1.2) lab[i] = C.pcw;
        });

        /* The tympanic cavity, compartment by compartment. */
        function under(x, y, z) { return z < floorZ(x, y) - 0.8; }
        g.each([-1.6, -4.6, -7.2, 7.6, 5.4, 8.4], function (x, y, z, i) {
            if (!under(x, y, z) || lab[i] === C.eac || lab[i] === 0 || lab[i] === C.mcfdura) return;
            var code = 0, s, dd = 9;
            if (z > 3.6) {
                s = Math.pow(Math.abs((x - 3.2) / 4.0), 4) + Math.pow(Math.abs((y - 0.2) / 4.6), 4) + Math.pow(Math.abs((z - 5.9) / 2.5), 4);
                if (s <= 1 && x < 7.2) { code = C.epitympanum; dd = Math.min((1 - Math.pow(s, 0.25)) * 2.5, 7.2 - x, floorZ(x, y) - 0.8 - z); }
                if (code && x > 5.9 && z < 4.7 && y > 0 && y < 1.8) code = C.prussak;
            } else if (z < -4.6) {
                s = Math.pow(Math.abs((x - 1.0) / 2.5), 4) + Math.pow(Math.abs((y - 0.4) / 3.6), 4) + Math.pow(Math.abs((z + 5.1) / 1.9), 4);
                if (s <= 1 && x < tmX(y, z) - 0.25) { code = C.hypotympanum; dd = Math.min((1 - Math.pow(s, 0.25)) * 1.9, tmX(y, z) - 0.25 - x); }
            } else if (y > -3.9 && y < 4.4 && x > -1.0) {
                var xl = annRho(y, z) <= 1.06 ? tmX(y, z) - 0.25 : 3.4;
                if (x < xl) { code = y > 3.1 ? C.protympanum : y < -3.0 ? C.retrotympanum : C.mesotympanum; dd = Math.min(xl - x, x + 1.0, y + 3.9, 4.4 - y); }
            }
            if (code) IN(i, code, dd);
        });
        tube([[4.1, -3.9, 6.3, 1.4], [3.6, -5.6, 5.7, 1.4], [3.2, -6.4, 5.4, 1.5]], C.aditus, null, 0, BONY);
        blob([3.0, -8.6, 5.0], [3.0, 3.3, 2.5], C.antrum, BONY);
        tube(ET, C.et, null, 0, BONY);
        blob([3.2, -4.0, 0.4], [0.9, 0.75, 1.7], C.recess, BONY);
        blob([0.5, -4.0, -1.7], [0.9, 1.25, 1.1], C.sinustymp, BONY);

        /* Scutum: the bone lateral to the attic, above the drum. */
        g.each([5.5, -3.6, 3.2, 9.6, 4.4, 8.6], function (x, y, z, i) {
            if (BONY[lab[i]] && !AIRY[lab[i]] && lab[i] !== C.pcw && eacRho(x, y, z) > 0.98) lab[i] = C.scutum;
        });
        /* Plates over the dura: the tegmen (mastoideum behind, tympani over the cavity). */
        g.all(function (x, y, z, i) {
            if (!BONY[lab[i]] || AIRY[lab[i]]) return;
            var f = floorZ(x, y);
            if (z > f - 0.8 && z <= f && x < cortexX(y, z) - 1.6) lab[i] = y < -4.2 ? C.tegmen : C.tegment;
        });

        /* 4. Bone that keeps its shape inside the air: canals, capsule, ridges. */
        var fnAll = [FN.meatal, FN.lab, FN.tymp, FN.genu2, FN.mastoid];
        var notInnerAir = mask(LABELS.filter(function (l) { return l && l.layer !== 'brain' && l.layer !== 'dura'; }).map(function (l) { return l.code; }));
        notInnerAir[0] = 0; notInnerAir[C.eac] = 0;
        var fnLines = fnAll.map(function (s) { return tube(s, C.fcanal, 0.75, 0.45, notInnerAir); });
        tube(TENSOR, C.tbone, null, 0.45, notInnerAir);
        tube(ICA, C.tbone, null, 0.7, notInnerAir);
        tube(SIGMOID, C.sigplate, null, 0.75, notInnerAir);
        blob(JB, [JB_R + 0.75, JB_R + 0.75, JB_R + 0.75], C.sigplate, notInnerAir);
        tube(IAC_AX, C.tbone, IAC_R, 0.8, notInnerAir);
        blob([0.6, 2.5, 0.7], [0.55, 0.6, 0.5], C.cochleariform, notInnerAir);
        tube([[0.3, -4.5, -0.4], [1.3, -3.3, 0.25]], C.pyramid, 0.45, 0, notInnerAir);

        /* Otic capsule: every lumen of the labyrinth, grown by about 0.9 mm. */
        var sccLines = {};
        Object.keys(SCC).forEach(function (k) { sccLines[k] = canalLine(SCC[k]); });
        var coch = cochleaLine();
        var CAP = 0.85;
        blob(VESTIBULE.c, VESTIBULE.r.map(function (r) { return r + CAP; }), C.oticcap, notInnerAir);
        Object.keys(sccLines).forEach(function (k) { tube(sccLines[k], C.oticcap, 0.45, CAP, notInnerAir, 1); });
        tube(coch.line, C_COCHCAP, null, 0.8, notInnerAir, 1);
        tube([COCH.B, coch.apex], C_COCHCAP, 1.0, 0.4, notInnerAir);

        /* 5. Lumens. */
        blob(VESTIBULE.c, VESTIBULE.r, C.vestibule);
        Object.keys(sccLines).forEach(function (k) {
            tube(sccLines[k], C[k], 0.45, 0, null, 1);
            blob(sccLines[k][1].slice(0, 3), [0.85, 0.85, 0.85], C[k]);    /* ampulla */
        });
        paintCochlea(coch);
        /* The promontory: the cochlear capsule where it faces the cavity. */
        g.each([-1.6, -3, -5, 2, 4.5, 2], function (x, y, z, i) { if (lab[i] === C_COCHCAP && x > -1.05) lab[i] = C.promontory; });
        /* Round window: niche from the promontory, membrane over the scala tympani. */
        var start = coch.line[0], out = nrm([1, -0.55, -0.45]);
        var rwm = add(start, mul(out, 0.8));
        tube([add(rwm, mul(out, 0.35)).concat(0.8), add(rwm, mul(out, 2.6)).concat(0.95)], C.mesotympanum, null, 0, mask([C.oticcap, C_COCHCAP, C.tbone]));
        tube([rwm.concat(0.75), add(rwm, mul(out, 0.3)).concat(0.75)], C.rw, null, 0, null);
        /* Endolymphatic duct and sac (on the posterior fossa dura, below Donaldson's line). */
        var sacC = [-5.2, -7.6, -2.6], sacP = add(sacC, mul(PF_N, 0.4 - pfSide(sacC)));
        tube([[-3.0, -1.6, 0.0], [-3.9, -4.5, -0.7], sacP], C.els, 0.25, 0, null);
        var su = nrm(cross([0, 0, 1], PF_N));
        blob(sacP, [3.2, 2.6, 0.55], C.els, null, 2, [su, [0, 0, 1], PF_N]);

        /* IAC: dural sleeve, then its nerves. */
        tube(IAC_AX, C.iac, IAC_R, 0, null);
        tube([[-16.5, 1.3, -0.8, 1.15], [-6.4, 1.1, -0.7, 1.1], COCH.B.concat(0.5)], C.cn8, null, 0, null);

        /* 6. Drum and canal: membrane, pars flaccida, annulus. */
        g.each([1.5, -4, -5.5, 8.5, 5.5, 5.5], function (x, y, z, i) {
            var r = annRho(y, z), t = tmX(y, z);
            var fy = (y - 0.7) / 1.5, fz = (z - 4.2) / 0.9, inFlac = fy * fy + fz * fz <= 1 && z > 3.4;
            if (r > 1.06 && !inFlac) return;
            var d = Math.abs(x - t);
            if (r > 0.93 && r <= 1.06 && d < 0.45 && !inFlac) IN(i, C.annulus, 0.45 - d);
            else if (d < 0.27) IN(i, inFlac ? C.flaccida : C.tm, 0.27 - d);
            else OUT(i, C.tm, d - 0.27);
        });

        /* 7. Ossicles. */
        var lp = onTm(LATPROC[0], LATPROC[1], 0.35), umbo = onTm(UMBO[0], UMBO[1], 0.3);
        var man = [];
        for (var s = 0; s <= 8; s++) {
            var t = s / 8, yy = lp[1] + (umbo[1] - lp[1]) * t, zz = lp[2] + (umbo[2] - lp[2]) * t;
            man.push(onTm(yy, zz, 0.42).concat(0.42 - 0.08 * t));
        }
        tube(man, C.malleus, null, 0, null, 2);
        blob(add(umbo, [-0.1, 0, 0]), [0.35, 0.55, 0.45], C.malleus);
        blob(lp, [0.4, 0.45, 0.45], C.malleus);
        tube([lp.concat(0.45), [5.6, 1.2, 4.6, 0.5], [5.1, 1.35, 5.6, 0.7]], C.malleus);
        blob([4.95, 1.4, 6.5], [1.05, 1.2, 1.35], C.malleus);
        tube([[4.9, 1.6, 5.5, 0.25], [5.2, 3.6, 5.0, 0.2]], C.malleus);           /* anterior process */
        blob([4.6, -0.9, 5.9], [1.05, 1.35, 1.6], C.incus);
        tube([[4.5, -1.8, 6.2, 0.7], [4.2, -3.4, 6.2, 0.5], [4.0, -4.6, 6.1, 0.3]], C.incus);   /* short process */
        tube([[4.6, -1.1, 4.7, 0.5], [4.2, -0.9, 3.0, 0.42], [3.5, -0.55, 1.1, 0.4], [3.05, -0.3, 0.65, 0.38]], C.incus);
        blob([2.95, -0.2, 0.5], [0.4, 0.4, 0.4], C.incus);                        /* lenticular process */
        blob([-0.3, 0, 0], [0.33, 1.5, 0.7], C.stapes);                           /* footplate */
        tube([[0, 1.2, 0.05, 0.2], [1.4, 0.75, 0.25, 0.2], [2.45, 0.12, 0.4, 0.22]], C.stapes, null, 0, null, 3);
        tube([[0, -1.2, -0.05, 0.2], [1.4, -0.75, 0.2, 0.2], [2.45, -0.12, 0.4, 0.22]], C.stapes, null, 0, null, 3);
        blob([2.6, 0, 0.42], [0.42, 0.42, 0.4], C.stapes);
        /* Tendons: tensor to the malleus neck, stapedius from the pyramid to the stapes. */
        tube([[0.7, 2.5, 0.8, 0.2], [5.3, 1.1, 3.6, 0.2]], C.tensor);
        tube([[1.3, -3.3, 0.25, 0.18], [2.4, -0.4, 0.45, 0.18]], C.stapedius);

        /* 8. Nerves, muscles, vessels. */
        tube(FN.meatal, C['fn-meatal'], 0.75);
        tube(FN.lab, C['fn-lab'], 0.7);
        blob(GENICULATE, [1.0, 1.1, 0.9], C.geniculate);
        tube(FN.tymp, C['fn-tymp'], 0.75);
        tube(FN.genu2, C.genu2, 0.75);
        tube(FN.mastoid, C.fn, 0.8);
        var gspn = [GENICULATE, [-2.8, 6.0], [-6.5, 10.5], [-10.5, 15]].map(function (p, i) {
            return i ? [p[0], p[1], floorZ(p[0], p[1]) - 0.85] : p;
        });
        tube(gspn, C.gspn, 0.35);
        var chordaLine = tube(CHORDA, C.chorda, 0.3);
        tube(TENSOR, C.tensor);
        tube([[0.85, -4.25, -1.2, 0.5], [1.15, -4.5, -5.0, 0.42]], C.stapedius);
        tube(ICA, C.ica);
        tube(SIGMOID, C.sigmoid);
        blob(JB, [JB_R, JB_R, JB_R], C.jb);
        tube([JB.concat(3.0), [-0.8, -3.0, -19, 3.4]], C.jb);

        /* 9. Surface marks on the cortex. */
        g.each([10, -14, -2, 16, 18, 10], function (x, y, z, i) {
            if (lab[i] !== C.cortex) return;
            var u = y + 3.6, w = z - 1.6;    /* Macewen's triangle: behind and above the meatus */
            if (u < 0 && w > 0 && z < 7.0 && w > -u * 0.72) lab[i] = C.macewen;
        });
        /* The temporal line (supramastoid crest): a low ridge along the top of the triangle. */
        var crest = [];
        for (var cy = 3; cy >= -15; cy -= 1.5) crest.push([cortexX(cy, 7.3) - 0.35, cy, 7.3 + 0.012 * (cy + 3) * (cy + 3) * -0.4, 0.75]);
        tube(crest, C.templine, null, 0, mask([0, C.cortex, C.macewen]));
        blob([12.9, -3.3, 2.4], [0.9, 0.7, 0.8], C.henle, mask([0, C.cortex, C.macewen]));
        tube([[cortexX(3.6, 4.6) - 0.6, 3.6, 4.6, 1.1], [cortexX(10, 4.1) - 0.5, 10, 4.1, 1.3], [cortexX(16, 3.6) - 0.5, 16, 3.6, 1.3]], C.zygroot, null, 0, mask([0, C.cortex, C.tbone]));

        /* Anchors for names: the voxel of each label nearest its centroid. */
        var anchors = anchorsOf(g);

        return {
            nx: g.nx, ny: g.ny, nz: g.nz, vox: vox, o: g.o, lab: lab, dep: dep,
            labels: LABELS, layers: LAYERS, codes: C, anchors: anchors,
            lines: { fn: fnLines, chorda: chordaLine, sigmoid: sigLine, ssc: sccLines.ssc },
            p: function (i, j, k) { return g.p(i, j, k); }
        };

        /* --- the labyrinth's shapes --- */
        function canalLine(sc) {
            var u = nrm(sub(sub(sc.a, sc.c), mul(sc.n, dot(sub(sc.a, sc.c), sc.n)))), w = cross(sc.n, u);
            function ang(p) { var d = sub(p, sc.c); return Math.atan2(dot(d, w), dot(d, u)); }
            var t0 = ang(sc.a), t1 = ang(sc.b), span = t1 - t0;
            while (span <= 0) span += 2 * Math.PI;
            if (span < Math.PI) span -= 2 * Math.PI;          /* the long way round: the gap faces the vestibule */
            var pts = [sc.a.slice()], n = 40;
            for (var i = 0; i <= n; i++) {
                var t = t0 + span * (i / n);
                pts.push(add(sc.c, add(mul(u, sc.R * Math.cos(t)), mul(w, sc.R * Math.sin(t)))));
            }
            pts.push(sc.b.slice());
            return pts.map(function (p) { return [p[0], p[1], p[2]]; });
        }
        function cochleaLine() {
            var a = COCH.a, dW = sub(COCH.W, COCH.B), e1 = nrm(sub(dW, mul(a, dot(dW, a)))), e2 = cross(a, e1);
            if (e2[2] < 0) e2 = mul(e2, -1);                 /* basal turn climbs from the window under the promontory */
            var line = [], n = 160, th = COCH.turns * 2 * Math.PI;
            for (var i = 0; i <= n; i++) {
                var t = i / n, rho = 3.55 * (1 - 0.7 * Math.pow(t, 0.85)), h = 3.4 * Math.pow(t, 0.8);
                var q = add(COCH.B, add(mul(a, h), add(mul(e1, rho * Math.cos(t * th)), mul(e2, rho * Math.sin(t * th)))));
                line.push([q[0], q[1], q[2], 0.95 - 0.45 * t]);
            }
            return { line: line, e1: e1, e2: e2, apex: add(COCH.B, mul(a, 3.6)) };
        }
        /* Scalae with the osseous spiral lamina between them (capsule bone), and the cochlear nerve in the modiolus. */
        function paintCochlea(co) {
            var line = co.line;
            g.each(lineBox(line, 0.05), function (x, y, z, i) {
                var p = [x, y, z], best = 1e9, bi = 0, s;
                for (s = 0; s < line.length; s += 6) {
                    var d0 = len(sub(p, line[s])) - line[s][3];
                    if (d0 < best) { best = d0; bi = s; }
                }
                var from = Math.max(0, bi - 7), to = Math.min(line.length - 1, bi + 7);
                for (s = from; s <= to; s++) {
                    var d = len(sub(p, line[s])) - line[s][3];
                    if (d < best) { best = d; bi = s; }
                }
                if (best > 0) { OUT(i, C.cochlea, best); return; }
                var c = line[bi], off = dot(sub(p, c), COCH.a);
                var rad = sub(sub(c, COCH.B), mul(COCH.a, dot(sub(c, COCH.B), COCH.a)));
                var inward = -dot(sub(p, c), nrm(rad));
                var lam = Math.abs(off) < 0.17 && inward > -0.1 && bi > 4;
                IN(i, lam ? C_COCHCAP : C.cochlea, lam ? 0.17 - Math.abs(off) : -best);
            });
            tube([COCH.B.concat(0.45), add(COCH.B, mul(COCH.a, 2.2)).concat(0.3)], C.cn8);
        }
    }

    function anchorsOf(g) {
        var n = LABELS.length, sx = new Float64Array(n), sy = new Float64Array(n), sz = new Float64Array(n), cnt = new Float64Array(n);
        var lab = g.lab, nx = g.nx, ny = g.ny, nz = g.nz, i, j, k, idx, c;
        for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
            c = lab[i + nx * (j + ny * k)];
            if (!c) continue;
            sx[c] += i; sy[c] += j; sz[c] += k; cnt[c]++;
        }
        var best = {}, bd = new Float64Array(n).fill(1e18);
        for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
            idx = i + nx * (j + ny * k); c = lab[idx];
            if (!c) continue;
            var dx = i - sx[c] / cnt[c], dy = j - sy[c] / cnt[c], dz = k - sz[c] / cnt[c], d = dx * dx + dy * dy + dz * dz;
            if (d < bd[c]) { bd[c] = d; best[c] = [i, j, k]; }
        }
        var out = {};
        for (c = 1; c < n; c++) {
            if (!cnt[c]) continue;
            out[c] = { centroid: g.p(sx[c] / cnt[c], sy[c] / cnt[c], sz[c] / cnt[c]), at: g.p.apply(g, best[c]), n: cnt[c] };
        }
        return out;
    }

    /* ---------- surgical states: carve a copy of the volume ---------- */
    var STATES = [
        { id: 'intact', name: 'Intact' },
        { id: 'flap', name: 'Flap up', desc: 'Tympanomeatal flap elevated: drum and posterior canal skin lifted off the ossicles.' },
        { id: 'cortical', name: 'Mastoidectomy', desc: 'Cortical (canal wall up) mastoidectomy: tegmen, sigmoid, posterior canal wall, LSCC and the facial nerve skeletonized, never exposed.' },
        { id: 'recess', name: 'Facial recess', desc: 'Posterior tympanotomy: between the chorda and the facial nerve, below the incus buttress, into the middle ear.' },
        { id: 'cwd', name: 'Canal wall down', desc: 'Posterior and superior canal wall taken down to the facial ridge; the mastoid and canal become one cavity.' },
        { id: 'translab', name: 'Translabyrinthine', desc: 'Labyrinthectomy and the internal auditory canal skeletonized behind the facial nerve.' },
        { id: 'mcf', name: 'Middle fossa', desc: 'From above, the temporal lobe retracted: the IAC unroofed between the superior canal (blue-lined, behind) and the cochlea (in front), the geniculate and GSPN anterolateral.' }
    ];
    var STEPS = { intact: [], flap: ['flap'], cortical: ['cortical'], recess: ['cortical', 'recess'],
        cwd: ['flap', 'cortical', 'recess', 'cwd'], translab: ['cortical', 'translab'], mcf: ['mcf'] };

    function carve(vol, stateId) {
        var lab = new Uint8Array(vol.lab), steps = STEPS[stateId] || [];
        if (!steps.length) return lab;
        var nx = vol.nx, ny = vol.ny, v = vol.vox, o = vol.o;
        var fnL = vol.lines.fn, ch = vol.lines.chorda;
        var CAV = C.cavity;
        var nearFn = nearLines(fnL), nearCh = nearLines([ch]);
        function each(b, f) {
            var i0 = Math.max(0, Math.floor((b[0] - o[0]) / v)), i1 = Math.min(nx - 1, Math.ceil((b[3] - o[0]) / v));
            var j0 = Math.max(0, Math.floor((b[1] - o[1]) / v)), j1 = Math.min(ny - 1, Math.ceil((b[4] - o[1]) / v));
            var k0 = Math.max(0, Math.floor((b[2] - o[2]) / v)), k1 = Math.min(vol.nz - 1, Math.ceil((b[5] - o[2]) / v));
            for (var k = k0; k <= k1; k++) for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
                f(o[0] + (i + 0.5) * v, o[1] + (j + 0.5) * v, o[2] + (k + 0.5) * v, i + nx * (j + ny * k));
            }
        }
        var cut = new Uint8Array(256);
        LABELS.forEach(function (l) { if (l && l.cut) cut[l.code] = 1; });
        cut[C.mastoidcells] = 1; cut[C.hypocells] = 0;

        steps.forEach(function (st) {
            if (st === 'flap') {
                each([2, -5, -6, 9, 6, 6], function (x, y, z, i) {
                    var c = lab[i];
                    if (c === C.tm || c === C.flaccida || (c === C.annulus && y < 1.5)) lab[i] = 0;
                    if (c === C.eac && y < eacAxis(x)[0] + 0.5 && x < 10.5) lab[i] = 0;
                });
            }
            if (st === 'cortical') {
                each([-1.2, -25, -16, 14, -3.4, 10], function (x, y, z, i) {
                    if (!cut[lab[i]] || lab[i] === C.pcw) return;
                    if (z > floorZ(x, y) - 0.8 || pfSide([x, y, z]) > -0.6) return;
                    /* saucerize: widest at the cortex, narrowing to the antrum and the deep landmarks */
                    var depth = cortexX(y, z) - x, ry = (y + 9.5) / 11.5, rz = (z - 0.5) / 11, r2 = ry * ry + rz * rz;
                    if (r2 >= 1 || depth > 15.5 * Math.pow(1 - r2, 0.55)) return;
                    if (z < baseZ(x, y) + 2.2) return;
                    var p = [x, y, z];
                    if (nearFn(p, 1.3) || nearCh(p, 0.6)) return;
                    lab[i] = CAV;
                });
                /* Koerner's septum and the antrum's lateral wall go with it; open the antrum into the cavity. */
                each([-1, -12.5, 1.5, 7, -4.2, 8.5], function (x, y, z, i) { if (lab[i] === C.antrum) lab[i] = CAV; });
            }
            if (st === 'recess') {
                each([1.5, -6.6, -4.5, 6.5, -3.0, 3.4], function (x, y, z, i) {
                    var c = lab[i];
                    if (!(cut[c] || c === C.fcanal || c === C.recess || c === C.retrotympanum)) return;
                    var p = [x, y, z];
                    if (nearFn(p, 1.15) || nearCh(p, 0.45)) return;
                    var xf = xAtZ(fnL[4], z, fnL[3]), xc = xAtZ(ch, z);
                    if (xf == null || xc == null || x < xf || x > xc) return;
                    lab[i] = CAV;
                });
            }
            if (st === 'cwd') {
                each([1.4, -13, -5.5, 14, 3.4, 9.5], function (x, y, z, i) {
                    var c = lab[i];
                    if (!(cut[c] || c === C.fcanal || c === C.eac)) return;
                    if (z > floorZ(x, y) - 0.8) return;
                    var a = eacAxis(x), p = [x, y, z];
                    var post = y < a[0] - 0.6, roof = z > a[1] + 2.6 && y < 3.2;
                    if (!post && !roof) return;
                    if (x < 3.6 && !roof) return;                          /* keep the medial wall and the facial ridge */
                    if (nearFn(p, 1.5) || nearCh(p, 0.5)) return;
                    lab[i] = CAV;
                });
            }
            if (st === 'translab') {
                var notCoch = function (c) { return c !== C_COCHCAP && c !== C.cochlea; };
                each([-11, -12, -7, 2.5, 1.9, 8.6], function (x, y, z, i) {
                    var c = lab[i];
                    var take = cut[c] || c === C.oticcap || c === C.vestibule || c === C.lscc || c === C.ssc || c === C.pscc
                        || c === C.tbone || c === C.els || c === C.cavity;
                    if (!take || !notCoch(c)) return;
                    var p = [x, y, z];
                    if (z > floorZ(x, y) - 0.8 || pfSide(p) > -0.5) return;
                    if (y > 1.2 || nearFn(p, 1.2)) return;
                    var iacT = segDist(p, IAC_AX[0], IAC_AX[1]);
                    if (x < -6 && iacT.d > IAC_R + 3.2) return;            /* skeletonize the IAC, no wider */
                    if (iacT.d < IAC_R + 0.25) return;
                    if (len(sub(p, JB)) < JB_R + 1.0) return;
                    if (z < -6.5) return;
                    lab[i] = CAV;
                });
            }
            if (st === 'mcf') {
                var ssc = vol.lines.ssc;
                each([5, -9, 6, 14, 13, 12], function (x, y, z, i) {         /* the craniotomy: squama above the floor */
                    if (cut[lab[i]] && z > floorZ(x, y) - 0.6) lab[i] = CAV;
                });
                each([-16, -6, -1.2, 4, 12, 12], function (x, y, z, i) {
                    var c = lab[i];
                    /* a round window in the floor, bevelled wider toward the craniotomy */
                    var fx = (x + 7) / 7.5, fy = (y - 2.6) / 5.8, widen = 1 + Math.max(0, z - 2) * 0.045;
                    if (fx * fx + fy * fy > widen * widen) return;
                    if (!(cut[c] || c === C.tegmen || c === C.tegment || c === C.mcfdura || c === C.temporallobe || c === C.oticcap)) return;
                    var p = [x, y, z];
                    if (c === C.oticcap && tubeDist(p, ssc, 0.45) < 0.3) return;   /* blue-line the superior canal */
                    if (c !== C.mcfdura && c !== C.temporallobe) {
                        if (nearFn(p, 0.9)) return;
                        if (len(sub(p, COCH.B)) < 6.4 && z < 2.2) return;           /* stay off the cochlea */
                        var iac = segDist(p, IAC_AX[0], IAC_AX[1]);
                        if (iac.d < IAC_R + 0.3) return;
                        if (z < IAC_AX[0][2] + 0.4 + (iac.d < IAC_R + 2.5 ? 0 : 1.5)) return;
                        if (y < -4 && x > -3) return;
                    }
                    lab[i] = CAV;
                });
            }
        });
        return lab;
    }
    /* Is p within m mm of any centre line? Segment boxes first, no allocation. */
    function nearLines(lines) {
        var seg = [];
        lines.forEach(function (l) { for (var i = 0; i < l.length - 1; i++) seg.push(l[i].slice(0, 3).concat(l[i + 1].slice(0, 3))); });
        return function (p, m) {
            var x = p[0], y = p[1], z = p[2];
            for (var i = 0; i < seg.length; i++) {
                var q = seg[i];
                if (x < Math.min(q[0], q[3]) - m || x > Math.max(q[0], q[3]) + m || y < Math.min(q[1], q[4]) - m || y > Math.max(q[1], q[4]) + m
                    || z < Math.min(q[2], q[5]) - m || z > Math.max(q[2], q[5]) + m) continue;
                var ux = q[3] - q[0], uy = q[4] - q[1], uz = q[5] - q[2], uu = ux * ux + uy * uy + uz * uz || 1;
                var t = ((x - q[0]) * ux + (y - q[1]) * uy + (z - q[2]) * uz) / uu;
                t = t < 0 ? 0 : t > 1 ? 1 : t;
                var dx = x - q[0] - ux * t, dy = y - q[1] - uy * t, dz = z - q[2] - uz * t;
                if (dx * dx + dy * dy + dz * dz < m * m) return true;
            }
            return false;
        };
    }
    /* x of a near-vertical centre line at height z (null if out of its range). */
    function xAtZ(line, z, alt) {
        var all = alt ? alt.concat(line) : line;
        for (var s = 0; s < all.length - 1; s++) {
            var a = all[s], b = all[s + 1];
            if ((z - a[2]) * (z - b[2]) <= 0 && a[2] !== b[2]) return a[0] + (b[0] - a[0]) * (z - a[2]) / (b[2] - a[2]);
        }
        return null;
    }

    /* ---------- views and the guided tour ----------
       Camera poses in model mm: eye and target; fov in degrees (default 42; a microscope is
       narrow, an endoscope wide), scope: drawn in a round endoscope frame. */
    var VIEWS = [
        { id: 'surgeon', name: 'Surgeon', eye: [62, -34, 30], target: [3, -6, -1] },
        { id: 'canal', name: 'Down the canal', eye: [17, 2.6, 2.4], target: [0.6, -1.0, -0.6], fov: 34 },
        { id: 'mastoid', name: 'Into the mastoid', eye: [30, -30, 15], target: [0, -5, 0] },
        { id: 'endo', name: 'Endoscope at the drum', eye: [7.0, 2.2, -1.2], target: [0.2, -2.6, 0.2], fov: 78, scope: true },
        { id: 'inside', name: 'In the middle ear', eye: [2.4, 3.5, -0.9], target: [0.4, -3.6, 0.2], fov: 84, scope: true },
        { id: 'above', name: 'From above', eye: [-3, -7, 34], target: [-4, 1, 0] },
        { id: 'behind', name: 'From behind', eye: [26, -64, 16], target: [0, -4, -1] },
        { id: 'front', name: 'From in front', eye: [30, 60, 10], target: [0, 0, -1] },
        { id: 'below', name: 'From below', eye: [24, -10, -62], target: [0, -2, -2] },
        { id: 'medial', name: 'From medial', eye: [-62, -24, 14], target: [-2, -3, 0] }
    ];

    var T = ['See', 'Why it matters'];
    var TOURS = [{
        id: 'flight', name: 'Through the temporal bone', sub: 'From the cortex to the IAC, one drill state at a time', terms: T,
        steps: [
            { title: 'The block', view: 'surgeon', state: 'intact', layers: ['bone', 'canal'], focus: ['macewen', 'henle', 'templine', 'zygroot', 'cortex'],
              act: 'A right temporal bone cut as a block, seen as the surgeon sees it: anterior to the right, superior up. Macewen\'s triangle sits behind and above the meatus, under the temporal line.',
              hazard: 'The antrum lies 12-15 mm deep to Macewen\'s triangle: the triangle is where the cortical mastoidectomy starts.' },
            { title: 'Through the bone', view: 'surgeon', state: 'intact', layers: ['ossicles', 'nerves', 'inner', 'vessels'], focus: ['fn', 'sigmoid', 'lscc', 'ica', 'jb', 'cochlea'],
              act: 'Bone hidden: the facial nerve runs from the IAC through the temporal bone to the stylomastoid foramen; the sigmoid sinus curves down behind, the carotid rises in front.',
              hazard: 'Every mastoid operation is a corridor between these: dura above, sigmoid behind, nerve and labyrinth deep.' },
            { title: 'Cortical mastoidectomy', view: 'surgeon', state: 'cortical', layers: ['bone', 'canal', 'ossicles', 'nerves', 'inner', 'vessels', 'dura'], focus: ['tegmen', 'sigplate', 'pcw', 'lscc', 'antrum'],
              act: 'The cells cleared to the plates: tegmen above, sigmoid plate behind, the thin posterior canal wall in front, the antrum opened onto the lateral canal.',
              hazard: 'The LSCC in the antrum floor is the depth marker: the facial nerve\'s second genu runs just inferior and medial to it.' },
            { title: 'The facial recess', view: 'mastoid', state: 'recess', layers: ['bone', 'canal', 'ossicles', 'nerves', 'inner', 'vessels'], focus: ['recess', 'chorda', 'fn', 'incus', 'rw'],
              act: 'The posterior tympanotomy between the chorda (lateral) and the mastoid facial nerve (medial), below the incus buttress: a window into the middle ear onto the stapes and round window.',
              hazard: 'Its width is the gap between two nerves: thin bone kept over the facial nerve, the chorda kept if you can.' },
            { title: 'Through the canal', view: 'canal', state: 'flap', layers: ['bone', 'canal', 'ossicles', 'nerves', 'inner', 'muscles'], focus: ['chorda', 'incus', 'stapes', 'promontory', 'rw', 'fn-tymp'],
              act: 'The transcanal view with the tympanomeatal flap up: the chorda crossing under the posterior canal wall, the long process of the incus down to the stapes, the promontory and, behind it, the round window niche.',
              hazard: 'The facial nerve\'s tympanic segment runs just above the stapes, often dehiscent; the chorda is the first thing at risk when the scutum is curetted.' },
            { title: 'The medial wall', view: 'endo', state: 'flap', layers: ['bone', 'ossicles', 'nerves', 'inner', 'muscles'], focus: ['fn-tymp', 'stapes', 'promontory', 'pyramid', 'cochleariform', 'rw'],
              act: 'An endoscope at the anterior annulus, looking back along the medial wall: the facial nerve\'s ridge over the oval window, the promontory below it, the round window niche behind, the pyramid giving off the stapedius tendon, the cochleariform process sending the tensor tendon across to the malleus.',
              hazard: 'The middle ear is about 2 mm wide at the umbo. Walk in with W and S and turn with the arrow keys, or press F to fly.' },
            { title: 'Canal wall down', view: 'mastoid', state: 'cwd', layers: ['bone', 'canal', 'ossicles', 'nerves', 'inner', 'vessels', 'dura'], focus: ['fn', 'genu2', 'lscc', 'scutum', 'malleus'],
              act: 'Posterior and superior canal wall lowered to the facial ridge; the attic, antrum and mastoid open into the canal as one cavity.',
              hazard: 'Lower the ridge until it is level with the nerve, never past it: a high ridge traps disease, a low one exposes the nerve.' },
            { title: 'Translabyrinthine', view: 'mastoid', state: 'translab', layers: ['bone', 'ossicles', 'nerves', 'inner', 'vessels', 'dura'], focus: ['iac', 'fn-meatal', 'cn8', 'pfdura', 'cochlea'],
              act: 'The canals and vestibule drilled out behind the nerve: the internal auditory canal opens with the facial nerve in its anterosuperior quadrant.',
              hazard: 'Hearing is sacrificed; the facial nerve runs the whole length of the exposure, fallopian canal laterally and in the IAC medially.' },
            { title: 'Middle fossa', view: 'above', state: 'mcf', layers: ['bone', 'ossicles', 'nerves', 'inner', 'vessels'], focus: ['ssc', 'gspn', 'geniculate', 'iac', 'cochlea'],
              act: 'From above with the temporal lobe retracted: the IAC unroofed, the superior canal blue-lined behind it, the geniculate ganglion and GSPN in front, the cochlea in the angle between the GSPN and the IAC.',
              hazard: 'The cochlea lies a few millimetres anterior to the IAC fundus, under the angle the GSPN makes with the IAC: drilling there opens it.' }
        ]
    }];

    /* Three grids: the whole specimen; the tympanic cavity and labyrinth at a third of the
       voxel size; and a movable detail cube at half that again. Each sits on the boundaries of
       the grid it refines, so the meshes meet edge to edge. */
    O.volume = { build: build, carve: carve, LEVELS: LEVELS, LABELS: LABELS, LAYERS: LAYERS, STATES: STATES, VIEWS: VIEWS, TOURS: TOURS, codes: C };

    /* As a Web Worker: build a level (the micro level with the box it is asked for), carve its
       states, and mesh them (with js/olsb-mesh.js, whose stamped URL the page sends first).
       It keeps every level's labels per state; replies echo the request id and carry copies
       (or the meshes) as transferable buffers. */
    if (typeof window === 'undefined' && typeof importScripts === 'function') {
        var vols = {}, shownBuf = {};
        var copy = function (a) { return new Uint8Array(a); };
        self.onmessage = function (e) {
            var m = e.data || {}, out;
            try {
                if (m.type === 'init') {
                    importScripts(m.meshUrl);
                    self.postMessage({ id: m.id });
                } else if (m.type === 'build') {
                    var lv = LEVELS[m.level];
                    var v = vols[m.level] = build({ vox: lv.vox, box: m.box || lv.box });
                    v.labs = { intact: v.lab };
                    out = copy(v.lab);
                    var dp = copy(v.dep);
                    self.postMessage({ id: m.id, nx: v.nx, ny: v.ny, nz: v.nz, vox: v.vox, o: v.o, anchors: v.anchors, lab: out, dep: dp }, [out.buffer, dp.buffer]);
                } else if (m.type === 'carve') {
                    var V0 = vols[m.level];
                    if (!V0.labs[m.state]) V0.labs[m.state] = carve(V0, m.state);
                    out = copy(V0.labs[m.state]);
                    self.postMessage({ id: m.id, lab: out }, [out.buffer]);
                } else if (m.type === 'mesh') {
                    var levels = m.levels.map(function (n) {
                        var W = vols[n], lab = W.labs[m.state] || (W.labs[m.state] = carve(W, m.state));
                        var box = [W.o[0], W.o[1], W.o[2], W.o[0] + W.nx * W.vox, W.o[1] + W.ny * W.vox, W.o[2] + W.nz * W.vox];
                        return { name: n, nx: W.nx, ny: W.ny, nz: W.nz, vox: W.vox, o: W.o, box: box, lab: lab, dep: W.dep, shown: shownBuf[n] };
                    });
                    var res = O.mesh.meshAll(levels, m.opts), list = [], meta = {};
                    levels.forEach(function (L) {
                        shownBuf[L.name] = L.shown;
                        meta[L.name] = { o: L.o, vox: L.vox, box: L.box };
                        res[L.name].forEach(function (b) {
                            ['pos', 'nrm', 'shade', 'lab', 'drilled', 'idx', 'vc'].forEach(function (k) { if (b[k]) list.push(b[k].buffer); });
                        });
                    });
                    self.postMessage({ id: m.id, meshes: res, meta: meta }, list);
                }
            } catch (err) {
                self.postMessage({ id: m.id, error: String(err && err.message || err) });
            }
        };
    }
})();
