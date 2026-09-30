/* =============================================================
   scene.js — the 3D stage: renderer, camera, controls, on-demand loop.

   Phase 1 draws placeholder content only, so the stage visibly renders and
   the whole path (WebGL2, tokens, theme, resize, orbit) is proven before any
   anatomy exists: an RAS axis gizmo (R, A, S labelled) and a neutral 10 mm
   grid in the axial plane. No pixel here makes an anatomical claim.

   - Coordinates: authored data is RAS millimetres; rasToScene() is the one
     conversion, at the one boundary (docs/ssb.md 4). 1 scene unit = 1 mm.
   - Materials come from CSS tokens (--ssb-* in css/ssb.css). Computed values
     are read at boot and again whenever html[data-theme] changes.
   - Rendering is on demand: a frame is drawn only when something changed
     (orbit, resize, theme). No continuous loop, no damping.
   - Only this module (and later geo-*, dioramas) imports three.js. The
     import paths are versioned and deliberately unstamped
     (js/vendor/README.md).
   ============================================================= */
import * as THREE from '../vendor/three-0.186.1/build/three.module.js';
import { OrbitControls } from '../vendor/three-0.186.1/examples/jsm/controls/OrbitControls.js';

/* RAS mm -> three.js scene (Y up, right-handed). */
export function rasToScene(p) {
    return [p[0], p[2], -p[1]];
}

const AXES = [
    { key: 'r', label: 'R', name: 'right', ras: [1, 0, 0] },
    { key: 'a', label: 'A', name: 'anterior', ras: [0, 1, 0] },
    { key: 's', label: 'S', name: 'superior', ras: [0, 0, 1] },
];
const AXIS_LENGTH = 50;   /* mm */
const GRID_HALF = 80;     /* mm */
const GRID_STEP = 10;     /* mm */
const GRID_MAJOR = 50;    /* mm */

/* A computed --ssb-* token as a colour string three.js can parse, else the fallback. */
function token(name, fallback) {
    let value = '';
    try { value = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (e) { /* no-op */ }
    return /^#[0-9a-f]{3,8}$/i.test(value) || /^rgba?\(/i.test(value) ? value : fallback;
}

/* Grid lines in the scene's XZ plane (the RAS axial plane, z = 0). */
function gridGeometry(major) {
    const pts = [];
    for (let v = -GRID_HALF; v <= GRID_HALF; v += GRID_STEP) {
        if ((v % GRID_MAJOR === 0) !== major) continue;
        pts.push(v, 0, -GRID_HALF, v, 0, GRID_HALF, -GRID_HALF, 0, v, GRID_HALF, 0, v);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
}

/* opts: { canvas, host, labels, onLost }
     canvas  the WebGL canvas (CSS sizes it to fill `host`)
     host    the element whose size the canvas follows
     labels  overlay element that receives the axis letters (DOM text, not sprites)
     onLost  called when the graphics context is lost
   Throws if WebGL 2 is unavailable (main.js catches and degrades to graph mode). */
export function createScene({ canvas, host, labels, onLost }) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 1, 2000);
    const [cx, cy, cz] = rasToScene([130, 165, 105]);
    camera.position.set(cx, cy, cz);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;      /* on-demand rendering: no inertia loop */
    controls.screenSpacePanning = true;
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controls.listenToKeyEvents(canvas);  /* arrow keys pan while the canvas has focus */
    controls.update();

    /* ---- placeholder content ---- */

    const gridMinor = new THREE.LineSegments(gridGeometry(false), new THREE.LineBasicMaterial());
    const gridMajor = new THREE.LineSegments(gridGeometry(true), new THREE.LineBasicMaterial());
    scene.add(gridMinor, gridMajor);

    const up = new THREE.Vector3(0, 1, 0);
    const axes = AXES.map((axis) => {
        const dir = new THREE.Vector3(...rasToScene(axis.ras));
        const material = new THREE.MeshBasicMaterial();
        const headLength = 7;
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, AXIS_LENGTH - headLength, 10), material);
        const head = new THREE.Mesh(new THREE.ConeGeometry(2, headLength, 16), material);
        shaft.position.copy(dir).multiplyScalar((AXIS_LENGTH - headLength) / 2);
        head.position.copy(dir).multiplyScalar(AXIS_LENGTH - headLength / 2);
        shaft.quaternion.setFromUnitVectors(up, dir);
        head.quaternion.copy(shaft.quaternion);
        scene.add(shaft, head);

        const el = document.createElement('span');
        el.className = 'ssb-axis-label';
        el.dataset.axis = axis.key;
        el.textContent = axis.label;
        labels.append(el);
        return { axis, material, el, tip: dir.clone().multiplyScalar(AXIS_LENGTH + 9) };
    });

    /* ---- tokens -> materials (boot + every theme change) ---- */

    function refreshTheme() {
        renderer.setClearColor(new THREE.Color(token('--ssb-stage-bg', '#fafaf7')));
        gridMinor.material.color.set(token('--ssb-grid', '#d6d7d0'));
        gridMajor.material.color.set(token('--ssb-grid-major', '#b4b6ae'));
        for (const a of axes) a.material.color.set(token(`--ssb-axis-${a.axis.key}`, '#888888'));
        requestRender();
    }

    /* ---- on-demand loop ---- */

    let frames = 0;
    let queued = false;
    let width = 0;
    let height = 0;
    const probe = new THREE.Vector3();

    function resize() {
        const w = Math.max(1, Math.floor(host.clientWidth));
        const h = Math.max(1, Math.floor(host.clientHeight));
        if (w === width && h === height) return;
        width = w;
        height = h;
        renderer.setSize(w, h, false);   /* CSS owns the canvas box */
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    /* Axis letters ride on the projected tips of the axes. */
    function placeLabels() {
        for (const a of axes) {
            probe.copy(a.tip).project(camera);
            const x = (probe.x * 0.5 + 0.5) * width;
            const y = (-probe.y * 0.5 + 0.5) * height;
            a.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
            a.el.style.visibility = probe.z < 1 ? 'visible' : 'hidden';
        }
    }

    function render() {
        queued = false;
        resize();
        renderer.render(scene, camera);
        placeLabels();
        frames += 1;
    }

    function requestRender() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(render);
    }

    controls.addEventListener('change', requestRender);
    if (typeof ResizeObserver === 'function') new ResizeObserver(requestRender).observe(host);
    else window.addEventListener('resize', requestRender);

    /* Follow html[data-theme]. */
    new MutationObserver(refreshTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (onLost) onLost(); });
    canvas.addEventListener('webglcontextrestored', requestRender);

    refreshTheme();
    return { frames: () => frames, requestRender, refreshTheme };
}
