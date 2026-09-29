/* =============================================================
   ascii3d.js — ASCII 3D figures. A small software renderer that
   draws parametric geometry into a monospace character grid.

   Per frame: orbit camera -> perspective -> z-buffered triangle
   raster (interpolated normals, Blinn-Phong) -> luminance to a
   character ramp -> silhouette pass -> lines, points -> labels
   with leaders -> DOM (one <span> per ink run, built with
   textContent, so nothing ever reaches innerHTML).

   The core is DOM-free. tools/ascii3d.mjs runs this same file in
   Node to preview a scene in the terminal and to bake the static
   no-JS frame into each page, and tools/check-data.mjs fails when
   a baked frame is stale. The terminal shows what ships.

   Scenes: one file per figure in js/diagrams/<id>.js, each calling
   ASCII3D.define(id, scene). Load this file first, then the scene
   files; every [data-a3d] figure mounts on DOMContentLoaded. Pages
   that paint later (Airway) call ASCII3D.mountAll(root) after they
   render. Schema, inks and workflow: docs/diagrams.md.
   ============================================================= */
(function (root) {
    'use strict';

    /* Cell height over cell width. Must match .a3d-grid in
       css/ascii3d.css: line-height 1.1 over the mono face's 0.6em
       advance. Change both together or neither. */
    var CELL_ASPECT = 1.1 / 0.6;

    /* Inks are roles, not colors: css/ascii3d.css maps each to a
       token. `ghost` occludes but draws nothing (hidden-line fill). */
    var INKS = ['ink', 'muted', 'faint', 'signal', 'science', 'ok', 'bad', 'ghost'];
    var INK = {};
    INKS.forEach(function (n, i) { INK[n] = i; });
    var GHOST = INK.ghost;

    /* least ink -> most ink. No '-' '|' '/' '\\' '_': those glyphs mean contours. */
    var RAMP = '.:;=+*#@';
    var DEG = Math.PI / 180;
    var EMPTY = 0, SURF = 1, EDGE = 2, LINE = 3, POINT = 4, TEXT = 5;

    var scenes = {};

    /* ---------- vectors (plain arrays) ---------- */
    function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
    function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
    function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    function cross(a, b) {
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function len(a) { return Math.sqrt(dot(a, a)); }
    function norm(a) { var l = len(a); return l > 1e-12 ? scale(a, 1 / l) : [0, 0, 0]; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
    function range(spec, dflt) {       /* [a, b, n] or n -> {a, b, n} */
        if (typeof spec === 'number') return { a: dflt[0], b: dflt[1], n: spec };
        spec = spec || dflt;
        return { a: spec[0], b: spec[1], n: spec[2] || dflt[2] };
    }
    function steps(r) {                /* n+1 evenly spaced samples */
        var out = [];
        for (var i = 0; i <= r.n; i++) out.push(lerp(r.a, r.b, i / r.n));
        return out;
    }
    function inkOf(name) { return INK[name] != null ? INK[name] : INK.ink; }

    /* Per-part placement: scale, then rotate (X, Y, Z degrees), then
       translate. Normals take the rotation only (scale is uniform). */
    function placer(part) {
        var s = part.scale || 1, r = part.rotate, t = part.at || [0, 0, 0];
        var m = null;
        if (r) {
            var cx = Math.cos(r[0] * DEG), sx = Math.sin(r[0] * DEG);
            var cy = Math.cos(r[1] * DEG), sy = Math.sin(r[1] * DEG);
            var cz = Math.cos(r[2] * DEG), sz = Math.sin(r[2] * DEG);
            /* R = Rz * Ry * Rx */
            m = [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
                 sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
                 -sy, cy * sx, cy * cx];
        }
        function rot(p) {
            if (!m) return p;
            return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
                    m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
                    m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
        }
        return {
            point: function (p) { return add(rot(scale(p, s)), t); },
            normal: rot
        };
    }

    /* ---------- meshing: everything solid is a (u, v) grid ---------- */
    /* fn(u, v) -> [x, y, z]; us/vs are sample arrays. wrapU/wrapV mark
       closed directions (the seam is shared, not duplicated). */
    function gridMesh(fn, us, vs, wrapU, wrapV, part, inkFn) {
        var nu = us.length, nv = vs.length, i, j;
        var P = new Array(nu * nv), I = null;
        for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) P[i * nv + j] = fn(us[i], vs[j]);
        /* inkAt: color a region of one surface by meaning (per vertex) */
        if (inkFn) {
            I = new Uint8Array(nu * nv);
            for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) I[i * nv + j] = inkOf(inkFn(us[i], vs[j]));
        }
        function at(ii, jj) {
            if (wrapU) ii = (ii + nu) % nu; else ii = clamp(ii, 0, nu - 1);
            if (wrapV) jj = (jj + nv) % nv; else jj = clamp(jj, 0, nv - 1);
            return P[ii * nv + jj];
        }
        var N = new Array(nu * nv);
        for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
            var du = sub(at(i + 1, j), at(i - 1, j));
            var dv = sub(at(i, j + 1), at(i, j - 1));
            N[i * nv + j] = norm(cross(du, dv));
        }
        /* Degenerate normals (poles, collapsed edges): borrow a neighbor's. */
        for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
            var k = i * nv + j;
            if (len(N[k]) > 0.5) continue;
            for (var d = 1; d < Math.max(nu, nv) && len(N[k]) < 0.5; d++) {
                var cand = [[i, j + d], [i, j - d], [i + d, j], [i - d, j]];
                for (var c = 0; c < 4; c++) {
                    var ci = cand[c][0], cj = cand[c][1];
                    if (ci < 0 || cj < 0 || ci >= nu || cj >= nv) continue;
                    if (len(N[ci * nv + cj]) > 0.5) { N[k] = N[ci * nv + cj]; break; }
                }
            }
        }
        var pl = placer(part);
        for (i = 0; i < P.length; i++) { P[i] = pl.point(P[i]); N[i] = norm(pl.normal(N[i])); }
        var quads = [];
        var iu = wrapU ? nu : nu - 1, jv = wrapV ? nv : nv - 1;
        for (i = 0; i < iu; i++) for (j = 0; j < jv; j++) {
            var i2 = (i + 1) % nu, j2 = (j + 1) % nv;
            quads.push([i * nv + j, i2 * nv + j, i2 * nv + j2, i * nv + j2]);
        }
        return { P: P, N: N, I: I, quads: quads, ink: inkOf(part.ink) };
    }

    /* A rotation-minimizing frame along a sampled curve (parallel
       transport), so tubes do not twist or pinch at inflections. */
    function curveFrames(pts) {
        var n = pts.length, T = [], i;
        for (i = 0; i < n; i++) {
            T.push(norm(sub(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)])));
        }
        var ref = Math.abs(T[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        var Nn = [norm(cross(cross(T[0], ref), T[0]))];
        for (i = 1; i < n; i++) {
            var prev = Nn[i - 1];
            var proj = sub(prev, scale(T[i], dot(prev, T[i])));
            Nn.push(len(proj) > 1e-9 ? norm(proj) : prev);
        }
        var B = [];
        for (i = 0; i < n; i++) B.push(norm(cross(T[i], Nn[i])));
        return { T: T, N: Nn, B: B };
    }

    function sampleCurve(fn, spec) {
        var r = range(spec, [0, 1, 64]);
        return steps(r).map(function (t) { return { t: t, p: fn(t) }; });
    }

    /* Shapes compile to meshes, polylines or points. */
    var BUILD = {
        surface: function (p) {
            var us = steps(range(p.u, [0, 1, 24])), vs = steps(range(p.v, [0, 1, 24]));
            if (p.wrapU) us.pop();
            if (p.wrapV) vs.pop();
            return { mesh: gridMesh(p.fn, us, vs, !!p.wrapU, !!p.wrapV, p, p.inkAt) };
        },
        heightfield: function (p) {
            var xs = steps(range(p.x, [-1, 1, 32])), zs = steps(range(p.z, [-1, 1, 32]));
            return { mesh: gridMesh(function (x, z) { return [x, p.fn(x, z), z]; }, xs, zs, false, false, p, p.inkAt) };
        },
        sphere: function (p) {
            var rr = p.radii || [p.radius || 1, p.radius || 1, p.radius || 1];
            var c = p.center || [0, 0, 0], n = p.n || 24;
            var us = steps({ a: 0, b: 2 * Math.PI, n: n * 2 }); us.pop();
            var vs = steps({ a: -Math.PI / 2, b: Math.PI / 2, n: n });
            return {
                mesh: gridMesh(function (u, v) {
                    return [c[0] + rr[0] * Math.cos(v) * Math.cos(u), c[1] + rr[1] * Math.sin(v), c[2] + rr[2] * Math.cos(v) * Math.sin(u)];
                }, us, vs, true, false, p)
            };
        },
        /* Torus in the XZ plane (axis = Y) before `rotate`. `arc`
           [deg0, deg1] cuts it open (a C-shaped ring). `section`
           [w, h] gives an elliptical cross-section instead of `r`. */
        torus: function (p) {
            var R = p.R || 1, sec = p.section || [p.r || 0.25, p.r || 0.25];
            var c = p.center || [0, 0, 0];
            var arc = p.arc || [0, 360], closed = !p.arc;
            var us = steps({ a: arc[0] * DEG, b: arc[1] * DEG, n: p.n || 64 });
            if (closed) us.pop();
            var vs = steps({ a: 0, b: 2 * Math.PI, n: p.sides || 12 }); vs.pop();
            return {
                mesh: gridMesh(function (u, v) {
                    var rr = R + sec[0] * Math.cos(v);
                    return [c[0] + rr * Math.cos(u), c[1] + sec[1] * Math.sin(v), c[2] + rr * Math.sin(u)];
                }, us, vs, closed, true, p)
            };
        },
        /* Cylinder or cone frustum between two points; `caps` closes it. */
        cylinder: function (p) {
            var a = p.from || [0, 0, 0], b = p.to || [0, 1, 0];
            var r0 = p.radius != null ? p.radius : 0.5, r1 = p.radius2 != null ? p.radius2 : r0;
            var axis = sub(b, a), T = norm(axis);
            var ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
            var U = norm(cross(T, ref)), V = cross(T, U);
            var sides = p.sides || 24;
            var ths = steps({ a: 0, b: 2 * Math.PI, n: sides }); ths.pop();
            var hs = steps({ a: 0, b: 1, n: p.n || 8 });
            var out = { mesh: gridMesh(function (th, h) {
                var r = lerp(r0, r1, h);
                return add(add(a, scale(axis, h)), add(scale(U, r * Math.cos(th)), scale(V, r * Math.sin(th))));
            }, ths, hs, true, false, p) };
            if (p.caps) {
                out.extra = [0, 1].map(function (end) {
                    var o = end ? b : a, r = end ? r1 : r0;
                    return gridMesh(function (th, s) {
                        return add(o, add(scale(U, s * r * Math.cos(th)), scale(V, s * r * Math.sin(th))));
                    }, ths, steps({ a: 0, b: 1, n: 4 }), true, false, p);
                });
            }
            return out;
        },
        /* Tube along a curve: path(t) -> [x, y, z], radius a number or
           fn(t). The workhorse for ducts, nerves, vessels, arrays. */
        tube: function (p) {
            var samples = sampleCurve(p.path, p.t || [0, 1, p.n || 96]);
            var pts = samples.map(function (s) { return s.p; });
            var fr = curveFrames(pts);
            var sides = p.sides || 10;
            var vs = steps({ a: 0, b: 2 * Math.PI, n: sides }); vs.pop();
            var idx = samples.map(function (s, i) { return i; });
            var rad = typeof p.radius === 'function' ? p.radius : function () { return p.radius != null ? p.radius : 0.1; };
            return {
                mesh: gridMesh(function (i, v) {
                    var r = rad(samples[i].t);
                    return add(pts[i], add(scale(fr.N[i], r * Math.cos(v)), scale(fr.B[i], r * Math.sin(v))));
                }, idx, vs, false, true, p, p.inkAt && function (i) { return p.inkAt(samples[i].t); })
            };
        },
        /* Axis-aligned box (before rotate): six faces, or open ones
           listed in `open` (e.g. ['top'] for a tray). */
        box: function (p) {
            var c = p.center || [0, 0, 0], s = p.size || [1, 1, 1];
            var h = [s[0] / 2, s[1] / 2, s[2] / 2];
            var open = p.open || [];
            var faces = {
                top:    function (u, v) { return [c[0] + u * h[0], c[1] + h[1], c[2] + v * h[2]]; },
                bottom: function (u, v) { return [c[0] + v * h[0], c[1] - h[1], c[2] + u * h[2]]; },
                front:  function (u, v) { return [c[0] + v * h[0], c[1] + u * h[1], c[2] - h[2]]; },
                back:   function (u, v) { return [c[0] + u * h[0], c[1] + v * h[1], c[2] + h[2]]; },
                left:   function (u, v) { return [c[0] - h[0], c[1] + v * h[1], c[2] + u * h[2]]; },
                right:  function (u, v) { return [c[0] + h[0], c[1] + u * h[1], c[2] + v * h[2]]; }
            };
            var n = p.n || 6, st = steps({ a: -1, b: 1, n: n });
            var meshes = [];
            Object.keys(faces).forEach(function (f) {
                if (open.indexOf(f) === -1) meshes.push(gridMesh(faces[f], st, st, false, false, p));
            });
            return { mesh: meshes[0], extra: meshes.slice(1) };
        },
        /* Polyline through `points`, or a sampled `path(t)`. */
        line: function (p) {
            var pts = p.points || sampleCurve(p.path, p.t || [0, 1, p.n || 64]).map(function (s) { return s.p; });
            if (p.closed) pts = pts.concat([pts[0]]);
            var pl = placer(p);
            return {
                line: {
                    pts: pts.map(pl.point), ink: inkOf(p.ink), glyph: p.glyph || null,
                    dash: p.dash || null, hidden: p.hidden || 'hide'
                }
            };
        },
        points: function (p) {
            var pl = placer(p);
            return { points: { pts: p.points.map(pl.point), ink: inkOf(p.ink), glyph: p.glyph || 'o' } };
        }
    };

    /* ---------- compile: scene -> world-space geometry ---------- */
    function compile(scene) {
        if (scene.__compiled) return scene.__compiled;
        var meshes = [], lines = [], points = [];
        (scene.parts || []).forEach(function (part, i) {
            var b = BUILD[part.kind];
            if (!b) throw new Error('ascii3d: part ' + i + ' has unknown kind "' + part.kind + '"');
            var out = b(part);
            if (out.mesh) meshes.push(out.mesh);
            if (out.extra) meshes.push.apply(meshes, out.extra);
            if (out.line) lines.push(out.line);
            if (out.points) points.push(out.points);
        });
        /* Bounding sphere (AABB center) frames the auto camera. */
        var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        function grow(p) { for (var k = 0; k < 3; k++) { if (p[k] < lo[k]) lo[k] = p[k]; if (p[k] > hi[k]) hi[k] = p[k]; } }
        meshes.forEach(function (m) { m.P.forEach(grow); });
        lines.forEach(function (l) { l.pts.forEach(grow); });
        points.forEach(function (q) { q.pts.forEach(grow); });
        if (lo[0] === Infinity) { lo = [-1, -1, -1]; hi = [1, 1, 1]; }
        var center = scale(add(lo, hi), 0.5), radius = 1e-6;
        function reach(p) { radius = Math.max(radius, len(sub(p, center))); }
        meshes.forEach(function (m) { m.P.forEach(reach); });
        lines.forEach(function (l) { l.pts.forEach(reach); });
        points.forEach(function (q) { q.pts.forEach(reach); });
        var all = [];
        meshes.forEach(function (m) { all.push.apply(all, m.P); });
        lines.forEach(function (l) { all.push.apply(all, l.pts); });
        points.forEach(function (q) { all.push.apply(all, q.pts); });
        var compiled = { meshes: meshes, lines: lines, points: points, center: center, radius: radius, all: all, fits: {} };
        try { Object.defineProperty(scene, '__compiled', { value: compiled }); } catch (e) { /* frozen scene: recompile each time */ }
        return compiled;
    }

    /* ---------- camera ---------- */
    function defaults(scene) {
        var cam = scene.camera || {};
        return {
            cols: scene.cols || 64,
            rows: scene.rows || 24,
            yaw: cam.yaw || 0,
            pitch: cam.pitch || 0
        };
    }

    /* Orbit rotation: yaw about world Y, then pitch (positive looks
       down on the scene). View space: x right, y up, +z into screen. */
    function rotator(yawDeg, pitchDeg) {
        var yaw = yawDeg * DEG, pitch = pitchDeg * DEG;
        var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        return function (p) {
            var x = p[0] * cyw + p[2] * syw, z = -p[0] * syw + p[2] * cyw, y = p[1];
            return [x, y * cp + z * sp, -y * sp + z * cp];
        };
    }

    /* Framing. 'sphere' fits the bounding sphere, so a spinning part
       never leaves the grid. 'view' fits the geometry as seen from the
       scene's own camera angle (tight; for rocking or still figures),
       and centers it. Computed once per grid size, then fixed, so the
       figure does not breathe as it turns. */
    function framing(scene, c, cols, rows) {
        var key = cols + 'x' + rows;
        if (c.fits[key]) return c.fits[key];
        var cam = scene.camera || {};
        var d = defaults(scene);
        var persp = cam.persp || 3.2;          /* camera distance in scene radii */
        var dist = c.radius * persp;
        var target = cam.target || c.center;
        var mode = cam.frame || (scene.motion && scene.motion.spin ? 'sphere' : 'view');
        var fit = cam.fit || (mode === 'sphere' ? 0.9 : 0.82);
        var f, cx = cols / 2, cy = rows / 2;
        if (mode === 'sphere') {
            var ang = Math.asin(1 / persp);    /* half-angle the sphere subtends */
            f = Math.min(cols / 2, rows * CELL_ASPECT / 2) * fit / Math.tan(ang);
        } else {
            var rot = rotator(d.yaw, d.pitch);
            var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            c.all.forEach(function (p) {
                var q = rot(sub(p, target)), z = q[2] + dist;
                if (z <= 1e-6) return;
                var X = q[0] / z, Y = q[1] / z;
                if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
            });
            f = fit * Math.min(cols / Math.max(1e-6, x1 - x0), rows * CELL_ASPECT / Math.max(1e-6, y1 - y0));
            cx = cols / 2 - f * (x0 + x1) / 2;
            cy = rows / 2 + f * (y0 + y1) / 2 / CELL_ASPECT;
        }
        var off = cam.offset || [0, 0];
        c.fits[key] = { f: f, cx: cx + off[0], cy: cy + off[1], dist: dist, target: target };
        return c.fits[key];
    }

    /* view: { yaw, pitch } in degrees. Returns a projector. */
    function camera(scene, c, view, cols, rows) {
        var fr = framing(scene, c, cols, rows);
        var f = fr.f, cx = fr.cx, cy = fr.cy, dist = fr.dist, target = fr.target;
        var rotate = rotator(view.yaw, view.pitch);
        return {
            dist: dist, cx: cx,
            view: function (p) {                /* world -> view (camera at origin, +z into screen) */
                var q = rotate(sub(p, target));
                q[2] += dist;
                return q;
            },
            rotate: rotate,
            project: function (q) {             /* view -> [col, row] (float) */
                return [cx + f * q[0] / q[2], cy - f * q[1] / q[2] / CELL_ASPECT];
            }
        };
    }

    /* ---------- render ---------- */
    /* opts: { yaw, pitch, mode: 'absorb'|'emit', live: bool }.
       Returns { cols, rows, chars: [], inks: Uint8Array }. */
    function frame(sceneOrId, opts) {
        var scene = typeof sceneOrId === 'string' ? scenes[sceneOrId] : sceneOrId;
        if (!scene) throw new Error('ascii3d: unknown scene "' + sceneOrId + '"');
        opts = opts || {};
        var d = defaults(scene);
        var W = opts.cols || d.cols, H = opts.rows || d.rows, NC = W * H;
        var view = { yaw: opts.yaw != null ? opts.yaw : d.yaw, pitch: opts.pitch != null ? opts.pitch : d.pitch };
        var c = compile(scene);
        var cam = camera(scene, c, view, W, H);
        var mode = opts.mode === 'emit' ? 'emit' : 'absorb';
        var L = scene.light || {};
        var lightDir = norm(L.dir || [-0.5, 0.6, -0.62]);    /* view space, toward the light */
        var ambient = L.ambient != null ? L.ambient : 0.14;
        var diffuse = L.diffuse != null ? L.diffuse : 0.78;
        var specK = L.spec != null ? L.spec : 0.35;
        var shin = L.shininess || 18;
        var half = norm(add(lightDir, [0, 0, -1]));
        var fog = scene.fog != null ? scene.fog : 0.4;
        var ramp = scene.ramp || RAMP;
        var zNear = cam.dist - c.radius, zFar = cam.dist + c.radius;
        var bias = c.radius * 0.02;

        var depth = new Float32Array(NC).fill(Infinity);
        var lum = new Float32Array(NC);
        var kind = new Uint8Array(NC);
        var inks = new Uint8Array(NC);
        var chars = new Array(NC);
        for (var z0 = 0; z0 < NC; z0++) chars[z0] = ' ';

        function fogAt(z) { return fog * clamp((z - zNear) / (zFar - zNear), 0, 1); }
        var lx = lightDir[0], ly = lightDir[1], lz = lightDir[2], hx = half[0], hy = half[1], hz = half[2];
        function shade(nx, ny, nz) {
            var l = ambient + diffuse * Math.max(0, nx * lx + ny * ly + nz * lz)
                + specK * Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), shin);
            return l < 0 ? 0 : l > 1 ? 1 : l;
        }

        /* 1. Surfaces */
        c.meshes.forEach(function (m) {
            var n = m.P.length, VX = new Array(n), SC = new Array(n), NV = new Array(n);
            for (var i = 0; i < n; i++) {
                var q = cam.view(m.P[i]);
                VX[i] = q;
                SC[i] = q[2] > 1e-6 ? cam.project(q) : null;
                NV[i] = cam.rotate(m.N[i]);
            }
            m.quads.forEach(function (qd) {
                tri(qd[0], qd[1], qd[2]);
                tri(qd[0], qd[2], qd[3]);
            });
            function tri(a, b, cI) {
                var pa = SC[a], pb = SC[b], pc = SC[cI];
                if (!pa || !pb || !pc) return;
                /* only cell centers inside the bounds can be covered: most
                   triangles are smaller than a cell and exit here */
                var minC = Math.max(0, Math.ceil(Math.min(pa[0], pb[0], pc[0]) - 0.5));
                var maxC = Math.min(W - 1, Math.floor(Math.max(pa[0], pb[0], pc[0]) - 0.5));
                if (minC > maxC) return;
                var minR = Math.max(0, Math.ceil(Math.min(pa[1], pb[1], pc[1]) - 0.5));
                var maxR = Math.min(H - 1, Math.floor(Math.max(pa[1], pb[1], pc[1]) - 0.5));
                if (minR > maxR) return;
                var area = (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0]);
                if (Math.abs(area) < 1e-9) return;
                var A = VX[a], B = VX[b], C = VX[cI], nA = NV[a], nB = NV[b], nC = NV[cI];
                /* Two-sided: flip normals on faces turned away from the eye. */
                var ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
                var vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
                var flip = ((uy * vz - uz * vy) * A[0] + (uz * vx - ux * vz) * A[1] + (ux * vy - uy * vx) * A[2]) > 0 ? -1 : 1;
                var tInk = m.I ? m.I[a] : m.ink;
                for (var r = minR; r <= maxR; r++) for (var col = minC; col <= maxC; col++) {
                    var px = col + 0.5, py = r + 0.5;
                    var w0 = ((pb[0] - px) * (pc[1] - py) - (pb[1] - py) * (pc[0] - px)) / area;
                    var w1 = ((pc[0] - px) * (pa[1] - py) - (pc[1] - py) * (pa[0] - px)) / area;
                    var w2 = 1 - w0 - w1;
                    if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
                    var z = w0 * A[2] + w1 * B[2] + w2 * C[2];
                    var k = r * W + col;
                    if (z >= depth[k]) continue;
                    depth[k] = z;
                    kind[k] = SURF;
                    inks[k] = tInk;
                    if (tInk === GHOST) { lum[k] = 0; continue; }
                    var nx = (w0 * nA[0] + w1 * nB[0] + w2 * nC[0]) * flip;
                    var ny = (w0 * nA[1] + w1 * nB[1] + w2 * nC[1]) * flip;
                    var nz = (w0 * nA[2] + w1 * nB[2] + w2 * nC[2]) * flip;
                    var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                    lum[k] = shade(nx / nl, ny / nl, nz / nl);
                }
            }
        });

        /* 2. Surface cells -> ramp characters. Emit (light on dark):
           brighter = denser. Absorb (ink on paper): darker = denser.
           Fog thins distant cells toward the lightest glyph either way. */
        var steps_ = ramp.length - 1;
        for (var k = 0; k < NC; k++) {
            if (kind[k] !== SURF) continue;
            if (inks[k] === GHOST) { chars[k] = ' '; continue; }
            var dens = mode === 'emit' ? lum[k] : 1 - lum[k] * 0.92;
            dens *= 1 - fogAt(depth[k]);
            chars[k] = ramp.charAt(Math.round(clamp(dens, 0, 1) * steps_));
        }

        /* 3. Silhouettes: a surface cell beside empty space, or in
           front of a depth jump, becomes a contour glyph. */
        if (scene.outline !== false) {
            var jump = c.radius * (scene.edgeDepth || 0.18);
            var edgeGlyph = [];
            for (var r0 = 0; r0 < H; r0++) for (var c0 = 0; c0 < W; c0++) {
                var kk = r0 * W + c0;
                if (kind[kk] !== SURF || inks[kk] === GHOST) continue;
                var dz = depth[kk];
                var up = r0 > 0 && out(kk - W), dn = r0 < H - 1 && out(kk + W);
                var lf = c0 > 0 && out(kk - 1), rt = c0 < W - 1 && out(kk + 1);
                var g = null;
                if ((up || dn) && !(lf || rt)) g = '-';
                else if ((lf || rt) && !(up || dn)) g = '|';
                else if ((up && lf && !dn && !rt) || (dn && rt && !up && !lf)) g = '/';
                else if ((up && rt && !dn && !lf) || (dn && lf && !up && !rt)) g = '\\';
                if (g) edgeGlyph.push([kk, g]);
            }
            edgeGlyph.forEach(function (e) { chars[e[0]] = e[1]; kind[e[0]] = EDGE; });
        }
        function out(j) {
            if (kind[j] === EMPTY) return true;
            return depth[j] - dz > jump;
        }

        /* 4. Lines, depth-tested with a small bias so a line lying on a
           surface still shows. Glyphs follow the line through each cell:
           shallow runs pick '_' or '-' by where the line crosses the
           cell (a smooth `__--` instead of stair-steps), diagonals get
           one '/' or '\' per row, steep runs '|'. Each cell is claimed
           by the crossing of its center line, so joints never double. */
        c.lines.forEach(function (ln) {
            var run = 0;
            function plot(col, row, z, g) {
                if (col < 0 || row < 0 || col >= W || row >= H) return;
                var k2 = row * W + col;
                run++;
                if (ln.dash && (run % (ln.dash[0] + ln.dash[1])) >= ln.dash[0]) return;
                if (z - bias > depth[k2]) {
                    if (ln.hidden === 'dots' && kind[k2] !== TEXT) { chars[k2] = '.'; inks[k2] = INK.faint; }
                    return;
                }
                if (kind[k2] === TEXT) return;
                depth[k2] = Math.min(depth[k2], z);
                kind[k2] = LINE;
                chars[k2] = g;
                inks[k2] = ln.ink;
            }
            for (var i = 0; i + 1 < ln.pts.length; i++) {
                var qa = cam.view(ln.pts[i]), qb = cam.view(ln.pts[i + 1]);
                if (qa[2] <= 1e-6 || qb[2] <= 1e-6) continue;
                var sa = cam.project(qa), sb = cam.project(qb);
                var dx = sb[0] - sa[0], dy = sb[1] - sa[1];
                var adx = Math.abs(dx), ady = Math.abs(dy), t, cc, rr;
                if (adx >= 2 * ady && adx > 1e-9) {
                    /* shallow: one cell per column crossed */
                    var cA = Math.min(sa[0], sb[0]), cB = Math.max(sa[0], sb[0]);
                    for (cc = Math.ceil(cA - 0.5); cc + 0.5 < cB; cc++) {
                        t = (cc + 0.5 - sa[0]) / dx;
                        var y = sa[1] + dy * t, fr_ = y - Math.floor(y);
                        rr = Math.floor(y);
                        var zz = lerp(qa[2], qb[2], t);
                        if (ln.glyph) plot(cc, rr, zz, ln.glyph);
                        else if (fr_ < 0.3) plot(cc, rr - 1, zz, '_');
                        else if (fr_ < 0.72) plot(cc, rr, zz, '-');
                        else plot(cc, rr, zz, '_');
                    }
                } else if (ady > 1e-9) {
                    /* diagonal or steep: one cell per row crossed */
                    var g = ln.glyph || (adx * 2.2 < ady ? '|' : (dx > 0) === (dy < 0) ? '/' : '\\');
                    var rA = Math.min(sa[1], sb[1]), rB = Math.max(sa[1], sb[1]);
                    for (rr = Math.ceil(rA - 0.5); rr + 0.5 < rB; rr++) {
                        t = (rr + 0.5 - sa[1]) / dy;
                        plot(Math.floor(sa[0] + dx * t), rr, lerp(qa[2], qb[2], t), g);
                    }
                }
            }
        });

        /* 5. Points */
        c.points.forEach(function (pt) {
            pt.pts.forEach(function (p) {
                var q = cam.view(p);
                if (q[2] <= 1e-6) return;
                var s = cam.project(q), col = Math.floor(s[0]), row = Math.floor(s[1]);
                if (col < 0 || row < 0 || col >= W || row >= H) return;
                var k3 = row * W + col;
                if (q[2] - bias > depth[k3]) return;
                depth[k3] = q[2];
                kind[k3] = POINT;
                chars[k3] = pt.glyph;
                inks[k3] = pt.ink;
            });
        });

        /* 6. Labels: anchor mark, leader, text. Labels whose anchor is
           hidden behind geometry dim to faint (or vanish: hideOccluded). */
        var taken = new Uint8Array(NC);
        (scene.labels || []).forEach(function (lb) {
            var q = cam.view(lb.at);
            if (q[2] <= 1e-6) return;
            var s = cam.project(q), ac = Math.floor(s[0]), ar = Math.floor(s[1]);
            if (ac < 0 || ar < 0 || ac >= W || ar >= H) return;
            var hidden = q[2] - bias * 2 > depth[ar * W + ac];
            if (hidden && lb.hideOccluded) return;
            var ink = hidden ? INK.faint : inkOf(lb.ink || 'ink');
            /* no dx: the label points away from the figure's center */
            var side = lb.dx != null ? (lb.dx < 0 ? -1 : 1) : (s[0] >= cam.cx ? 1 : -1);
            var dyv = lb.dy || 0;
            /* align:'center' sets the text on the anchor column, no leader */
            var centered = lb.align === 'center';
            var lines = String(lb.text).split('\n');
            var wmax = lines.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
            /* Where can the text block go? Not over another label, and,
               unless clear:false, not over the drawing either: the leader
               stretches outward until the text sits on blank paper. Rows
               are nudged up/down if the aimed row is crowded. */
            function blocked(tr, tc, geometry) {
                for (var li = 0; li < lines.length; li++) {
                    for (var x = -1; x <= lines[li].length; x++) {
                        var cc = tc + x;
                        if (cc < 0 || cc >= W) continue;
                        var kb = (tr + li) * W + cc;
                        if (taken[kb]) return true;
                        if (geometry && kind[kb] !== EMPTY && !(kind[kb] === SURF && inks[kb] === GHOST && lb.overGhost)) return true;
                    }
                }
                return false;
            }
            var tries = [0, 1, -1, 2, -2, 3, -3], placed = null, fallback = null;
            for (var ti = 0; ti < tries.length && !placed; ti++) {
                var tr = ar + dyv + tries[ti];
                if (tr < 0 || tr + lines.length > H) continue;
                var reach = Math.max(Math.abs(lb.dx != null ? lb.dx : 3), Math.abs(tr - ar) + 1);
                for (var grow = 0; grow <= W && !placed; grow++) {
                    var tc = centered ? ac - Math.floor(wmax / 2) + (lb.dx || 0)
                        : side > 0 ? ac + reach + grow + 1 : ac - reach - grow - wmax;
                    if (tc < 0 || tc + wmax > W) {
                        tc = clamp(tc, 0, Math.max(0, W - wmax));
                        if (!fallback && !blocked(tr, tc, false)) fallback = [tr, tc];
                        break;
                    }
                    if (!fallback && !blocked(tr, tc, false)) fallback = [tr, tc];
                    if (lb.clear === false || centered) { if (!blocked(tr, tc, false)) placed = [tr, tc]; break; }
                    if (!blocked(tr, tc, true)) placed = [tr, tc];
                }
            }
            placed = placed || fallback;
            if (!placed) return;
            var trow = placed[0], tcol = placed[1];
            function put(col, row, ch, inkI) {
                if (col < 0 || row < 0 || col >= W || row >= H) return;
                var kx = row * W + col;
                chars[kx] = ch; inks[kx] = inkI; kind[kx] = TEXT; taken[kx] = 1;
            }
            if (lb.mark ? true : lb.mark !== false && !centered) put(ac, ar, lb.mark || '+', ink);
            if (lb.leader !== false && !centered) {
                /* diagonal toward the text row, then a run to the text */
                var rDir = trow > ar ? 1 : trow < ar ? -1 : 0;
                var cx0 = ac, cy0 = ar;
                while (cy0 !== trow) {
                    cx0 += side; cy0 += rDir;
                    if (cy0 !== trow) put(cx0, cy0, (side > 0) === (rDir < 0) ? '/' : '\\', ink);
                    else break;
                }
                var endC = side > 0 ? tcol - 1 : tcol + wmax;
                if (cy0 === trow && rDir !== 0) put(cx0, cy0, (side > 0) === (rDir < 0) ? '/' : '\\', ink);
                for (var hc = cx0 + side; side > 0 ? hc < endC : hc > endC; hc += side) put(hc, trow, '-', ink);
            }
            lines.forEach(function (l, li) {
                for (var x = 0; x < l.length; x++) put(tcol + x, trow + li, l.charAt(x), ink);
            });
        });

        /* 7. Chrome: registration corners and a live readout. */
        if (scene.frame) {
            var F = INK.faint;
            [[0, 0, 1, 1], [W - 1, 0, -1, 1], [0, H - 1, 1, -1], [W - 1, H - 1, -1, -1]].forEach(function (cn) {
                var fx = cn[0], fy = cn[1];
                chars[fy * W + fx] = '+'; inks[fy * W + fx] = F;
                for (var a = 1; a <= 2; a++) {
                    chars[fy * W + fx + cn[2] * a] = '-'; inks[fy * W + fx + cn[2] * a] = F;
                }
                chars[(fy + cn[3]) * W + fx] = '|'; inks[(fy + cn[3]) * W + fx] = F;
            });
        }
        return { cols: W, rows: H, chars: chars, inks: inks, view: view };
    }

    /* The live readout, e.g. 'yaw +028  pitch -018'. */
    function readout(view) { return 'yaw ' + pad3(view.yaw) + '  pitch ' + pad3(view.pitch); }

    function pad3(deg) {
        var d = Math.round(((deg % 360) + 540) % 360 - 180);
        var s = String(Math.abs(d));
        while (s.length < 3) s = '0' + s;
        return (d < 0 ? '-' : '+') + s;
    }

    /* ---------- serializers ---------- */
    function toText(fr) {
        var out = [];
        for (var r = 0; r < fr.rows; r++) out.push(fr.chars.slice(r * fr.cols, (r + 1) * fr.cols).join('').replace(/\s+$/, ''));
        return out.join('\n');
    }

    /* Rows of [inkName, text] runs; the default ink has name 'ink'. */
    function toRuns(fr) {
        var rows = [];
        for (var r = 0; r < fr.rows; r++) {
            var runs = [], cur = null, buf = '';
            for (var c = 0; c < fr.cols; c++) {
                var k = r * fr.cols + c, ch = fr.chars[k];
                /* a space has no color: it joins whatever run it is in */
                var ink = ch === ' ' ? (cur || 'ink') : INKS[fr.inks[k]];
                if (ink === 'ghost') ink = 'ink';
                if (ink !== cur) { if (cur !== null && buf) runs.push([cur, buf]); cur = ink; buf = ''; }
                buf += ch;
            }
            if (buf) runs.push([cur, buf.replace(/\s+$/, '')]);
            rows.push(runs.filter(function (x) { return x[1].length; }));
        }
        return rows;
    }

    function escapeHTML(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function toHTML(fr) {
        return toRuns(fr).map(function (runs) {
            return runs.map(function (run) {
                return run[0] === 'ink' ? escapeHTML(run[1]) : '<span class="a3d-' + run[0] + '">' + escapeHTML(run[1]) + '</span>';
            }).join('');
        }).join('\n');
    }

    /* ---------- public core ---------- */
    var api = {
        version: 1,
        CELL_ASPECT: CELL_ASPECT,
        INKS: INKS.slice(),
        define: function (id, scene) {
            if (!id || !scene) return;
            scene.id = id;
            scenes[id] = scene;
            if (api.onDefine) api.onDefine(id);
        },
        get: function (id) { return scenes[id] || null; },
        ids: function () { return Object.keys(scenes); },
        frame: frame,
        toText: toText,
        toRuns: toRuns,
        toHTML: toHTML,
        readout: readout
    };
    root.ASCII3D = api;

    /* =============================================================
       Browser: mount, animate, interact. Everything below is inert
       without a DOM (Node previews and bakes use the core only).
       ============================================================= */
    if (typeof document === 'undefined') return;

    var views = {};          /* last view per scene id, survives re-mounts */
    var mounted = [];
    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* no-op */ }

    /* Shade to suit the ground actually under the figure: light text
       means a dark stage (emit), dark text means paper (absorb). */
    function modeFor(el) {
        try {
            var m = getComputedStyle(el).color.match(/\d+(\.\d+)?/g);
            if (!m) return 'absorb';
            var lumi = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
            return lumi > 0.5 ? 'emit' : 'absorb';
        } catch (e) { return 'absorb'; }
    }

    function paint(pre, fr) {
        var frag = document.createDocumentFragment();
        toRuns(fr).forEach(function (runs, r) {
            if (r) frag.appendChild(document.createTextNode('\n'));
            runs.forEach(function (run) {
                if (run[0] === 'ink') { frag.appendChild(document.createTextNode(run[1])); return; }
                var sp = document.createElement('span');
                sp.className = 'a3d-' + run[0];
                sp.textContent = run[1];
                frag.appendChild(sp);
            });
        });
        pre.textContent = '';
        pre.appendChild(frag);
    }

    function mount(fig) {
        if (!fig || fig.__a3d) return fig && fig.__a3d;
        var id = fig.getAttribute('data-a3d');
        var scene = scenes[id];
        if (!scene) { console.error('ascii3d: no scene "' + id + '" (is js/diagrams/' + id + '.js loaded?)'); return null; }
        var d = defaults(scene);
        var stage = fig.querySelector('.a3d-stage');
        if (!stage) {
            stage = document.createElement('div');
            stage.className = 'a3d-stage';
            fig.insertBefore(stage, fig.firstChild);
        }
        stage.setAttribute('role', 'img');
        if (scene.alt && !stage.getAttribute('aria-label')) stage.setAttribute('aria-label', scene.alt);
        var pre = stage.querySelector('.a3d-grid');
        if (!pre) {
            pre = document.createElement('pre');
            pre.className = 'a3d-grid';
            pre.setAttribute('aria-hidden', 'true');
            stage.appendChild(pre);
        }
        /* HUD line under the grid: a hint and the current angle. Its own
           element, so it never collides with a label. A baked page ships
           it empty (a static frame cannot turn). */
        var hud = stage.querySelector('.a3d-hud');
        if (!hud) {
            hud = document.createElement('div');
            hud.className = 'a3d-hud';
            hud.setAttribute('aria-hidden', 'true');
            stage.appendChild(hud);
        }
        var hudHint = document.createElement('span'), hudAngle = document.createElement('span');
        /* Resolution follows the column: scene cols/rows are the full
           size; a narrow column renders fewer, larger cells so glyphs
           never drop below minFont px (labels stay readable). */
        var grid = [d.cols, d.rows];
        function fitGrid() {
            var w = stage.clientWidth || 0, minF = scene.minFont || 8;
            var cols = d.cols, rows = d.rows;
            if (w > 0 && w / (cols * 0.6) < minF) {
                cols = Math.max(24, Math.floor(w / (minF * 0.6)));
                rows = Math.max(8, Math.round(d.rows * cols / d.cols));
            }
            var changed = cols !== grid[0] || rows !== grid[1];
            grid = [cols, rows];
            pre.style.setProperty('--a3d-cols', String(cols));
            return changed;
        }
        fitGrid();

        var motion = scene.motion || {};
        var v = views[id] || (views[id] = { yaw: d.yaw, pitch: d.pitch, t: 0 });
        var st = {
            fig: fig, pre: pre, stage: stage, scene: scene, v: v,
            mode: modeFor(pre), visible: true, dragging: false, idleUntil: 0,
            raf: 0, last: 0, acc: 0, dirty: true
        };
        var interactive = scene.interactive !== false;
        var spins = !reduced && (motion.spin || motion.rock);

        function draw() {
            var yaw = v.yaw, pitch = v.pitch;
            if (motion.rock && !reduced) yaw = v.yaw + motion.rock * Math.sin(v.t * 2 * Math.PI / (motion.period || 10));
            try {
                var fr = frame(scene, { yaw: yaw, pitch: pitch, mode: st.mode, cols: grid[0], rows: grid[1] });
                paint(pre, fr);
                if (interactive && scene.readout !== false) hudAngle.textContent = readout(fr.view);
            }
            catch (e) { console.error(e); stop(); }
            st.dirty = false;
        }
        function tick(now) {
            st.raf = 0;
            if (!fig.isConnected) { stop(); return; }
            var dt = st.last ? Math.min(0.1, (now - st.last) / 1000) : 0;
            st.last = now;
            var playing = spins && st.visible && !st.dragging && now >= st.idleUntil && !document.hidden;
            if (playing) {
                if (motion.rock) v.t += dt;
                else v.yaw += (motion.spin || 0) * dt;
                st.acc += dt;
                st.dirty = st.dirty || st.acc >= 1 / (motion.fps || 24);
            }
            if (st.dirty) { st.acc = 0; draw(); }
            if (playing || st.dirty || now < st.idleUntil) schedule();
        }
        function schedule() { if (!st.raf) st.raf = requestAnimationFrame(tick); }
        function stop() {
            if (st.raf) cancelAnimationFrame(st.raf);
            st.raf = 0;
            if (!fig.isConnected) {
                try { if (st.io) st.io.disconnect(); if (st.ro) st.ro.disconnect(); } catch (e) { /* no-op */ }
                st.io = st.ro = null;
            }
        }
        function kick() { st.dirty = true; st.last = 0; schedule(); }
        function hold() { st.idleUntil = performance.now() + 2500; }

        if (interactive) {
            stage.tabIndex = 0;
            stage.classList.add('a3d-stage--live');
            if (scene.readout !== false) {
                hudHint.textContent = 'drag to turn';
                hud.textContent = '';
                hud.appendChild(hudHint);
                hud.appendChild(hudAngle);
            }
            var sx = 0, sy = 0, pid = null;
            stage.addEventListener('pointerdown', function (e) {
                if (e.button !== 0) return;
                pid = e.pointerId; sx = e.clientX; sy = e.clientY;
                st.dragging = true;
                try { stage.setPointerCapture(pid); } catch (err) { /* no-op */ }
            });
            stage.addEventListener('pointermove', function (e) {
                if (!st.dragging || e.pointerId !== pid) return;
                var px = Math.max(4, stage.clientWidth / grid[0]);
                v.yaw += (e.clientX - sx) / px * 3;
                if (e.pointerType === 'mouse') v.pitch = clamp(v.pitch + (e.clientY - sy) / px * 2, -85, 85);
                sx = e.clientX; sy = e.clientY;
                kick();
            });
            function release(e) {
                if (e.pointerId !== pid) return;
                st.dragging = false; pid = null; hold(); kick();
            }
            stage.addEventListener('pointerup', release);
            stage.addEventListener('pointercancel', release);
            stage.addEventListener('dblclick', function () { reset(); });
            stage.addEventListener('keydown', function (e) {
                var k = e.key, used = true;
                if (k === 'ArrowLeft') v.yaw -= 12;
                else if (k === 'ArrowRight') v.yaw += 12;
                else if (k === 'ArrowUp') v.pitch = clamp(v.pitch + 8, -85, 85);
                else if (k === 'ArrowDown') v.pitch = clamp(v.pitch - 8, -85, 85);
                else if (k === 'Home' || k === '0') reset();
                else used = false;
                if (used) { e.preventDefault(); hold(); kick(); }
            });
        }
        function reset() { v.yaw = d.yaw; v.pitch = d.pitch; v.t = 0; hold(); kick(); }

        if ('IntersectionObserver' in window) {
            try {
                st.io = new IntersectionObserver(function (es) {
                    st.visible = es[es.length - 1].isIntersecting;
                    if (st.visible) kick();
                });
                st.io.observe(stage);
            } catch (e) { /* always visible */ }
        }

        if ('ResizeObserver' in window) {
            try { st.ro = new ResizeObserver(function () { if (fitGrid()) kick(); }); st.ro.observe(stage); } catch (e) { /* fixed size */ }
        }

        /* data-a3d-shade exposes the chosen mode (tests, debugging) */
        st.refresh = function () { st.mode = modeFor(pre); fig.setAttribute('data-a3d-shade', st.mode); fitGrid(); kick(); };
        fig.setAttribute('data-a3d-shade', st.mode);
        fig.__a3d = st;
        fig.classList.add('is-live');
        mounted = mounted.filter(function (m) { return m.fig.isConnected; });
        mounted.push(st);
        draw();
        schedule();
        return st;
    }

    function mountAll(scope) {
        var list = (scope || document).querySelectorAll('[data-a3d]');
        for (var i = 0; i < list.length; i++) {
            try { mount(list[i]); } catch (e) { console.error(e); }
        }
    }

    api.mount = mount;
    api.mountAll = mountAll;
    /* A scene defined after the page parsed (a late script) mounts its
       figures then; during parsing, DOMContentLoaded does it. */
    api.onDefine = function (id) {
        if (document.readyState === 'loading') return;
        var list = document.querySelectorAll('[data-a3d]');
        for (var i = 0; i < list.length; i++) {
            if (list[i].getAttribute('data-a3d') === id) { try { mount(list[i]); } catch (e) { console.error(e); } }
        }
    };

    /* Re-shade on a theme flip (absorb <-> emit) and on tab return. */
    try {
        new MutationObserver(function () {
            mounted = mounted.filter(function (st) { return st.fig.isConnected; });
            mounted.forEach(function (st) { st.refresh(); });
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch (e) { /* no-op */ }
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) mounted.forEach(function (st) { if (st.fig.isConnected) st.refresh(); });
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mountAll(document); });
    else mountAll(document);
})(typeof window !== 'undefined' ? window : globalThis);
