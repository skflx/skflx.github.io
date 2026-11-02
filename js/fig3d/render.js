/* =============================================================
   fig3d/render.js — draws an ASCII 3D scene (js/diagrams/<id>.js) as
   a lit, matte three.js figure. Loaded lazily by loader.js; contract:
   plans/2026-10-28-figures-eggs-atlas.md section 4.3.

   Geometry is the scene's own: ASCII3D.compile(id, {view:'3d'}), so
   the ASCII egg and this figure can never disagree. Colours come from
   the page's CSS tokens (--ink, --signal, --signal-2, ...), re-read
   on a data-theme flip. Parts with the ink 'ghost' are not drawn.
   A mesh with a per-vertex `R` (0..1) is coloured along a --signal-2
   ramp (0 pale, 1 full).

   Scene hooks (scene.fig3d, all optional):
     controls:  [{ key, type: 'range'|'toggle', min, max, log, value,
                   options, label }]   range: a slider (log = geometric);
                   toggle: a checkbox, or, with `options`, one button each
     highlight(state) -> { [partIndex]: 'lit' | 'dim' }
     readout(state, pick) -> string   pick = { part, index } after a
                   click or tap on a pickable part, else undefined
     pickable:  [partIndex]
   The renderer re-applies them on every control change or pick.

   Camera and drag match the ASCII engine (yaw about Y, then pitch;
   the engine's view space has +z into the screen, so z is mirrored
   into three's right-handed space). No zoom, no OrbitControls.
   ============================================================= */
import * as THREE from '../vendor/three-0.186.1/build/three.module.js';

var INKS = ['ink', 'muted', 'faint', 'signal', 'science', 'ok', 'bad', 'ghost'];
var TOKENS = {
    ink: ['--ink', '#121418'], muted: ['--ink-muted', '#4A4F57'], faint: ['--ink-faint', '#646973'],
    signal: ['--signal', '#B8371A'], science: ['--signal-2', '#2445B0'],
    ok: ['--ok', '#1F7A52'], bad: ['--bad', '#B0243A']
};
var DEG = Math.PI / 180;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* no-op */ }

/* ---------- colour: any CSS colour -> sRGB bytes, via a canvas ---------- */
var probe = null;
function rgbOf(css, fallback) {
    try {
        if (!probe) probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        probe.canvas.width = probe.canvas.height = 1;
        probe.fillStyle = fallback || '#808080';
        probe.fillStyle = css;
        probe.clearRect(0, 0, 1, 1);
        probe.fillRect(0, 0, 1, 1);
        var d = probe.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
    } catch (e) { return [128, 128, 128]; }
}
function palette(el) {
    var cs = getComputedStyle(el), p = {};
    function tok(name, fb) { var v = cs.getPropertyValue(name).trim(); return rgbOf(v || fb, fb); }
    Object.keys(TOKENS).forEach(function (k) { p[k] = tok(TOKENS[k][0], TOKENS[k][1]); });
    p.bg = tok('--bg', '#F1F1EC');
    return p;
}
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function toColor(rgb) { return new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace); }

/* ---------- view: the ASCII engine's rotation, in three's frame ---------- */
/* engine rows (x' = ..., y'' = ..., z'' = ...); conjugated by the z mirror */
function rotation(yawDeg, pitchDeg) {
    var yw = yawDeg * DEG, pt = pitchDeg * DEG;
    var cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt);
    var m = [cy, 0, sy, -sy * sp, cp, cy * sp, -sy * cp, -sp, cy * cp];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) if ((r === 2) !== (c === 2)) m[r * 3 + c] = -m[r * 3 + c];
    return new THREE.Matrix4().set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1);
}

/* Which scene part made each line and each points record: compile()
   keeps meshes' `part` but pushes lines and points in part order. */
function partsOf(scene, kind) {
    var out = [];
    (scene.parts || []).forEach(function (p, i) {
        if (p.view && p.view !== '3d') return;
        if (p.kind === kind) out.push(i);
    });
    return out;
}

export function mount(fig) {
    if (!fig || fig.__fig3d) return fig && fig.__fig3d;
    var A = window.ASCII3D;
    var id = fig.getAttribute('data-fig3d');
    var scene = A && A.get(id);
    if (!scene) return null;                       /* the poster stays */
    var hooks = scene.fig3d || {};

    var stage = fig.querySelector('.fig3d-stage');
    var poster = fig.querySelector('.fig3d-poster');
    if (!stage) {
        stage = document.createElement('div');
        stage.className = 'fig3d-stage';
        if (poster && poster.parentNode === fig) fig.insertBefore(stage, poster), stage.appendChild(poster);
        else fig.insertBefore(stage, fig.firstChild);
    }
    var aspect = hooks.aspect || (scene.cols ? (scene.cols * 0.6) / ((scene.rows || 24) * 1.1) : 1.6);
    stage.style.setProperty('--fig3d-aspect', String(aspect));

    var renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return null; }                   /* no WebGL: the poster stays */
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var canvas = renderer.domElement;
    canvas.className = 'fig3d-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', scene.alt || id);
    canvas.tabIndex = 0;
    stage.appendChild(canvas);

    var c = A.compile(scene, { view: '3d' });
    var cam0 = scene.camera || {};
    var view = { yaw: cam0.yaw || 0, pitch: cam0.pitch || 0, t: 0 };
    var motion = scene.motion || {};

    var three = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 1000);
    var dist = (c.radius || 1) / Math.sin(14 * DEG) / (cam0.fit || 0.94);
    camera.position.set(0, 0, dist);
    camera.far = dist + c.radius * 4;
    camera.near = Math.max(0.01, dist - c.radius * 4);
    camera.updateProjectionMatrix();
    three.add(camera);
    /* matte: a hemisphere fill and a key light that rides on the camera,
       so the lighting stays put on screen while the figure turns */
    var hemi = new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.35);
    three.add(hemi);
    var key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(-0.6, 0.9, 1.2);
    camera.add(key);

    var group = new THREE.Group();
    group.matrixAutoUpdate = false;
    three.add(group);

    var objects = [];              /* { part, obj, kind, base, mat } */
    var state = {}, pickState;
    var linePart = partsOf(scene, 'line'), pointPart = partsOf(scene, 'points');

    function P3(p) { return [p[0] - c.center[0], p[1] - c.center[1], -(p[2] - c.center[2])]; }

    function clear() {
        objects.forEach(function (o) {
            group.remove(o.obj);
            if (o.obj.geometry) o.obj.geometry.dispose();
            if (o.mat) o.mat.dispose();
        });
        objects = [];
    }

    function build() {
        clear();
        var pal = palette(fig);
        var pale = mix(pal.science, pal.bg, 0.78);

        c.meshes.forEach(function (m) {
            if (m.ink === INKS.indexOf('ghost') && !m.I) return;
            var n = m.P.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
            for (var i = 0; i < n; i++) {
                var p = P3(m.P[i]), q = m.N[i];
                pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
                nor[i * 3] = q[0]; nor[i * 3 + 1] = q[1]; nor[i * 3 + 2] = -q[2];
                var rgb = m.R ? mix(pale, pal.science, m.R[i]) : pal[INKS[m.I ? m.I[i] : m.ink]] || pal.ink;
                var cc = toColor(rgb);
                col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
            }
            var idx = [];
            m.quads.forEach(function (q4) {
                /* the z mirror reverses winding: emit the triangles back to front */
                idx.push(q4[0], q4[2], q4[1], q4[0], q4[3], q4[2]);
            });
            var g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
            g.setAttribute('color', new THREE.BufferAttribute(col, 3));
            g.setIndex(idx);
            var mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
            var mesh = new THREE.Mesh(g, mat);
            group.add(mesh);
            objects.push({ part: m.part, obj: mesh, kind: 'mesh', mat: mat });
        });

        c.lines.forEach(function (l, k) {
            if (l.ink === INKS.indexOf('ghost')) return;
            var pts = l.pts.map(function (p) { var q = P3(p); return new THREE.Vector3(q[0], q[1], q[2]); });
            var g = new THREE.BufferGeometry().setFromPoints(pts);
            var mat = new THREE.LineBasicMaterial({ color: toColor(pal[INKS[l.ink]] || pal.ink) });
            var line = new THREE.Line(g, mat);
            group.add(line);
            objects.push({ part: linePart[k], obj: line, kind: 'line', mat: mat });
        });

        c.points.forEach(function (pt, k) {
            if (pt.ink === INKS.indexOf('ghost')) return;
            var r = c.radius * 0.018;
            var mat = new THREE.MeshStandardMaterial({ color: toColor(pal[INKS[pt.ink]] || pal.ink), roughness: 1, metalness: 0 });
            var inst = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 14, 10), mat, pt.pts.length);
            var mtx = new THREE.Matrix4();
            pt.pts.forEach(function (p, i) { var q = P3(p); mtx.makeTranslation(q[0], q[1], q[2]); inst.setMatrixAt(i, mtx); });
            inst.instanceMatrix.needsUpdate = true;
            group.add(inst);
            objects.push({ part: pointPart[k], obj: inst, kind: 'points', mat: mat });
        });

        var lite = pal.bg[0] + pal.bg[1] + pal.bg[2] < 384;       /* a dark ground */
        hemi.color.set(lite ? 0xcfd3dc : 0xffffff);
        hemi.groundColor.set(lite ? 0x30323a : 0x8a8a8a);
        applyHighlight();
        draw();
    }

    /* ---------- hooks ---------- */
    var hud = fig.querySelector('.fig3d-hud');
    var controlsEl = fig.querySelector('.fig3d-controls');

    function say(text) { if (hud) hud.textContent = text || ''; }

    function applyHighlight() {
        var map = null;
        try { map = typeof hooks.highlight === 'function' ? hooks.highlight(state) : null; } catch (e) { map = null; }
        objects.forEach(function (o) {
            var mode = map && o.part != null ? map[o.part] : null;
            var dim = mode === 'dim', lit = mode === 'lit';
            o.mat.transparent = dim;
            o.mat.opacity = dim ? 0.2 : 1;
            o.mat.depthWrite = !dim;
            if (o.mat.emissive) {
                o.mat.emissive.set(lit ? 0xffffff : 0x000000);
                o.mat.emissiveIntensity = lit ? 0.22 : 0;
            }
            o.mat.needsUpdate = true;
        });
    }

    function readout() {
        try { if (typeof hooks.readout === 'function') say(hooks.readout(state, pickState)); } catch (e) { /* no-op */ }
    }

    function changed() { applyHighlight(); readout(); draw(); }

    function buildControls() {
        if (!controlsEl || !hooks.controls || !hooks.controls.length) return;
        controlsEl.textContent = '';
        hooks.controls.forEach(function (ctl) {
            var label = document.createElement('label');
            var name = document.createElement('span');
            name.textContent = ctl.label || ctl.key;
            if (ctl.type === 'range') {
                var input = document.createElement('input');
                input.type = 'range'; input.min = '0'; input.max = '1000';
                var toT = function (v) { return ctl.log ? Math.log(v / ctl.min) / Math.log(ctl.max / ctl.min) : (v - ctl.min) / (ctl.max - ctl.min); };
                var fromT = function (t) { return ctl.log ? ctl.min * Math.pow(ctl.max / ctl.min, t) : ctl.min + (ctl.max - ctl.min) * t; };
                state[ctl.key] = ctl.value != null ? ctl.value : ctl.min;
                input.value = String(Math.round(1000 * toT(state[ctl.key])));
                input.setAttribute('aria-label', name.textContent);
                input.addEventListener('input', function () { state[ctl.key] = fromT(input.value / 1000); changed(); });
                label.appendChild(name); label.appendChild(input);
                controlsEl.appendChild(label);
            } else if (ctl.options && ctl.options.length) {
                state[ctl.key] = ctl.value != null ? ctl.value : ctl.options[0];
                var btns = [];
                var group = document.createElement('span');
                group.setAttribute('role', 'group'); group.setAttribute('aria-label', name.textContent);
                ctl.options.forEach(function (opt) {
                    var b = document.createElement('button');
                    b.type = 'button'; b.textContent = String(opt);
                    b.addEventListener('click', function () {
                        state[ctl.key] = opt;
                        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
                        changed();
                    });
                    btns.push(b); group.appendChild(b);
                });
                btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(ctl.options[i] === state[ctl.key])); });
                var wrap = document.createElement('span'); wrap.className = 'fig3d-opts';
                wrap.appendChild(name); wrap.appendChild(document.createTextNode(' ')); wrap.appendChild(group);
                controlsEl.appendChild(wrap);
            } else {
                var box = document.createElement('input');
                box.type = 'checkbox';
                state[ctl.key] = !!ctl.value;
                box.checked = state[ctl.key];
                box.addEventListener('change', function () { state[ctl.key] = box.checked; changed(); });
                label.appendChild(box); label.appendChild(name);
                controlsEl.appendChild(label);
            }
        });
    }

    /* ---------- drawing ---------- */
    var raf = 0, dirty = true, visible = true, last = 0, idleUntil = 0, dragging = false;

    function size() {
        var w = stage.clientWidth || 0;
        if (!w) return;
        var h = Math.round(w / aspect);
        renderer.setSize(w, h, false);
        dirty = true;
    }

    function draw() {
        dirty = true;
        if (!raf) raf = requestAnimationFrame(tick);
    }

    function render() {
        var yaw = view.yaw;
        if (motion.rock && !reduced) yaw += motion.rock * Math.sin(view.t * 2 * Math.PI / (motion.period || 10));
        group.matrix.copy(rotation(yaw, view.pitch));
        group.matrixWorldNeedsUpdate = true;
        renderer.render(three, camera);
        dirty = false;
    }

    function tick(now) {
        raf = 0;
        if (!fig.isConnected) return;
        var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
        last = now;
        var rocking = !!motion.rock && !reduced && visible && !dragging && now >= idleUntil && !document.hidden;
        if (rocking) { view.t += dt; dirty = true; }
        if (dirty && visible && !document.hidden) render();
        if (rocking || dragging || now < idleUntil) raf = requestAnimationFrame(tick);
        else last = 0;
    }
    function hold() { idleUntil = performance.now() + 2500; }

    /* ---------- interaction ---------- */
    var pid = null, sx = 0, sy = 0, moved = 0;
    canvas.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        pid = e.pointerId; sx = e.clientX; sy = e.clientY; moved = 0; dragging = true;
        try { canvas.setPointerCapture(pid); } catch (err) { /* no-op */ }
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!dragging || e.pointerId !== pid) return;
        var px = Math.max(4, canvas.clientWidth / 88);
        view.yaw += (e.clientX - sx) / px * 3;
        if (e.pointerType === 'mouse') view.pitch = Math.max(-85, Math.min(85, view.pitch + (e.clientY - sy) / px * 2));
        moved += Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy);
        sx = e.clientX; sy = e.clientY;
        hold(); draw();
    });
    function release(e) {
        if (e.pointerId !== pid) return;
        dragging = false; pid = null; hold(); draw();
        if (e.type === 'pointerup' && moved < 6) pick(e);
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('keydown', function (e) {
        var k = e.key, used = true;
        if (k === 'ArrowLeft') view.yaw -= 12;
        else if (k === 'ArrowRight') view.yaw += 12;
        else if (k === 'ArrowUp') view.pitch = Math.min(85, view.pitch + 8);
        else if (k === 'ArrowDown') view.pitch = Math.max(-85, view.pitch - 8);
        else if (k === 'Home' || k === '0') { view.yaw = cam0.yaw || 0; view.pitch = cam0.pitch || 0; view.t = 0; }
        else used = false;
        if (used) { e.preventDefault(); hold(); draw(); }
    });

    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function pick(e) {
        if (!hooks.pickable || !hooks.pickable.length) return;
        var r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        camera.updateMatrixWorld(); group.updateMatrixWorld(true);
        ray.setFromCamera(ndc, camera);
        var targets = objects.filter(function (o) { return o.kind !== 'line' && hooks.pickable.indexOf(o.part) !== -1; });
        var hits = ray.intersectObjects(targets.map(function (o) { return o.obj; }), false);
        if (!hits.length) { pickState = undefined; readout(); return; }
        var h = hits[0], o = targets.filter(function (x) { return x.obj === h.object; })[0];
        pickState = { part: o.part, index: h.instanceId != null ? h.instanceId : h.faceIndex };
        readout(); applyHighlight(); draw();
    }

    /* ---------- life ---------- */
    try {
        new IntersectionObserver(function (es) {
            visible = es[es.length - 1].isIntersecting;
            if (visible) draw();
        }).observe(stage);
    } catch (e) { /* always visible */ }
    try { new ResizeObserver(function () { size(); draw(); }).observe(stage); } catch (e) { /* fixed size */ }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) draw(); });
    try {
        new MutationObserver(function () { if (fig.isConnected) build(); })
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (fig.isConnected) build(); });
    } catch (e) { /* no-op */ }

    buildControls();
    size();
    build();
    readout();
    fig.__fig3d = { rebuild: build, state: state, view: view };
    fig.setAttribute('data-fig3d-ready', '');
    return fig.__fig3d;
}
