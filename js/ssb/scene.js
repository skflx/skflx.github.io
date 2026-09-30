/* =============================================================
   scene.js — the 3D stage: renderer, camera, controls, lights, token
   tissue materials, picking, on-demand loop.

   Two stages share one renderer: the *specimen* stage (phase 1's
   placeholder — an RAS axis gizmo and a neutral 10 mm grid, since the
   reference specimen does not exist yet) and a *content* slot the variant
   lab fills with a diorama (setContent). No pixel of the placeholder makes
   an anatomical claim.

   - Coordinates: authored data is RAS millimetres; rasToScene() (frame.js,
     re-exported here) is the one conversion, at the one boundary
     (docs/ssb.md 4). 1 scene unit = 1 mm.
   - Materials come from the procedural tissue library (materials.js), by
     the `look` a part carries (kind + flags), coloured from CSS tokens
     (--ssb-* in css/ssb.css) read at boot and again whenever html[data-theme]
     changes. A hazard site is hatched in the shader, never marked by colour
     alone (docs/ssb.md 7.4). Quality is 'full' or 'lite': the #q= hash
     override, else chosen from device hints at boot.
   - Rendering is on demand: a frame is drawn only when something changed
     (orbit, resize, theme, content), except while an animation is running
     (setAnimating), e.g. the lab's flow particles.
   - Only this module (and the dioramas, which receive THREE as an
     argument) touch three.js. The import paths are versioned and
     deliberately unstamped (js/vendor/README.md).
   ============================================================= */
import * as THREE from '../vendor/three-0.186.1/build/three.module.js';
import { OrbitControls } from '../vendor/three-0.186.1/examples/jsm/controls/OrbitControls.js';
import { rasToScene } from './frame.js?v=f554e767';
import { createMaterials, detectQuality, token, KINDS } from './materials.js?v=84f05f95';

export { rasToScene };

const AXES = [
    { key: 'r', label: 'R', name: 'right', ras: [1, 0, 0] },
    { key: 'a', label: 'A', name: 'anterior', ras: [0, 1, 0] },
    { key: 's', label: 'S', name: 'superior', ras: [0, 0, 1] },
];
const AXIS_LENGTH = 50;   /* mm */
const GRID_HALF = 80;     /* mm */
const GRID_STEP = 10;     /* mm */
const GRID_MAJOR = 50;    /* mm */

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

/* opts: { canvas, host, labels, onLost, quality }
     canvas  the WebGL canvas; CSS sizes it (the whole stage, or the stage
             beside the lab's docked controls) and the renderer follows it
     host    the stage element
     labels  overlay element that receives the axis letters (DOM text, not sprites)
     onLost  called when the graphics context is lost
     quality 'full' | 'lite' (the #q= override), or null to choose from device hints
   Throws if WebGL 2 is unavailable (main.js catches and degrades to graph mode). */
export function createScene({ canvas, host, labels, onLost, quality = null }) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 1, 2000);
    const [cx, cy, cz] = rasToScene([130, 165, 105]);
    camera.position.set(cx, cy, cz);
    scene.add(camera);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false;      /* on-demand rendering: no inertia loop */
    controls.screenSpacePanning = true;
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controls.listenToKeyEvents(canvas);  /* arrow keys pan while the canvas has focus */
    controls.update();

    /* Lights for the content (the placeholder uses unlit materials): a soft
       ambient/hemisphere fill and a headlight that follows the camera. */
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8a80, 1.1);
    const head = new THREE.DirectionalLight(0xffffff, 1.9);
    head.position.set(0.25, 0.35, 1);
    camera.add(head);
    scene.add(hemi);

    /* ---- the specimen stage: placeholder content ---- */

    const specimen = new THREE.Group();
    const gridMinor = new THREE.LineSegments(gridGeometry(false), new THREE.LineBasicMaterial());
    const gridMajor = new THREE.LineSegments(gridGeometry(true), new THREE.LineBasicMaterial());
    specimen.add(gridMinor, gridMajor);

    const up = new THREE.Vector3(0, 1, 0);
    const axes = AXES.map((axis) => {
        const dir = new THREE.Vector3(...rasToScene(axis.ras));
        const material = new THREE.MeshBasicMaterial();
        const headLength = 7;
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, AXIS_LENGTH - headLength, 10), material);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(2, headLength, 16), material);
        shaft.position.copy(dir).multiplyScalar((AXIS_LENGTH - headLength) / 2);
        tip.position.copy(dir).multiplyScalar(AXIS_LENGTH - headLength / 2);
        shaft.quaternion.setFromUnitVectors(up, dir);
        tip.quaternion.copy(shaft.quaternion);
        specimen.add(shaft, tip);

        const el = document.createElement('span');
        el.className = 'ssb-axis-label';
        el.dataset.axis = axis.key;
        el.textContent = axis.label;
        labels.append(el);
        return { axis, material, el, tip: dir.clone().multiplyScalar(AXIS_LENGTH + 9) };
    });
    scene.add(specimen);
    const specimenView = { position: camera.position.clone(), target: controls.target.clone() };

    /* ---- the content slot ---- */

    const content = new THREE.Group();
    scene.add(content);

    /* ---- tissue materials (materials.js), cached by look ---- */

    const gl = renderer.getContext();
    let gpu = '';
    try {
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        if (info) gpu = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '');
    } catch (e) { /* masked: no hint */ }
    const detected = detectQuality({
        renderer: gpu,
        coarse: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
        shortSide: Math.min(window.screen ? window.screen.width : 0, window.screen ? window.screen.height : 0),
    });
    let requested = quality === 'lite' || quality === 'full' ? quality : null;
    const library = createMaterials(THREE, { pixelRatio, quality: requested || detected });

    /* look: { kind, tint?, space?, ghost?, translucent?, doubleSide?, cut? }; a slab with
       cut: true gets [cut faces, sides]. opts: { hazard, selected }. */
    const materialsFor = library.materialsFor;

    /* The #q= override (null: back to the device's choice). */
    function setQuality(q) {
        requested = q === 'lite' || q === 'full' ? q : null;
        if (library.setQuality(requested || detected)) requestRender();
    }

    /* A ghosted wall reads by its outline: hard edges as lines. */
    const edgeMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 });
    function outline(mesh) {
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 35), edgeMaterial);
        lines.userData.outline = true;
        return lines;
    }

    /* ---- tokens -> colours (boot + every theme change) ---- */

    const themeSubs = new Set();
    function refreshTheme() {
        renderer.setClearColor(new THREE.Color(token('--ssb-stage-bg', '#fafaf7')));
        gridMinor.material.color.set(token('--ssb-grid', '#d6d7d0'));
        gridMajor.material.color.set(token('--ssb-grid-major', '#b4b6ae'));
        for (const a of axes) a.material.color.set(token(`--ssb-axis-${a.axis.key}`, '#888888'));
        edgeMaterial.color.set(token('--ssb-bone-cut', '#b8a47a'));
        library.refresh();
        for (const fn of [...themeSubs]) { try { fn(); } catch (e) { console.error(e); } }
        requestRender();
    }

    /* ---- on-demand loop ---- */

    let frames = 0;
    let queued = false;
    let width = 0;
    let height = 0;
    let animating = false;
    const frameSubs = new Set();
    const probe = new THREE.Vector3();

    function resize() {
        const w = Math.max(1, Math.floor(canvas.clientWidth || host.clientWidth));
        const h = Math.max(1, Math.floor(canvas.clientHeight || host.clientHeight));
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
            a.el.style.visibility = specimen.visible && probe.z < 1 ? 'visible' : 'hidden';
        }
    }

    function render(now) {
        queued = false;
        resize();
        for (const fn of [...frameSubs]) { try { fn(now || performance.now()); } catch (e) { console.error(e); } }
        renderer.render(scene, camera);
        placeLabels();
        frames += 1;
        if (animating) requestRender();
    }

    function requestRender() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(render);
    }

    controls.addEventListener('change', requestRender);
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(requestRender);
        ro.observe(host);
        ro.observe(canvas);
    } else window.addEventListener('resize', requestRender);

    /* Follow html[data-theme]. */
    new MutationObserver(refreshTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (onLost) onLost(); });
    canvas.addEventListener('webglcontextrestored', requestRender);

    /* ---- content, framing, picking ---- */

    function disposeTree(obj) {
        obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    }

    /* Put `obj` in the content slot (null empties it) and show the
       specimen placeholder only when the slot is empty. */
    function setContent(obj) {
        for (const child of [...content.children]) { content.remove(child); disposeTree(child); }
        if (obj) content.add(obj);
        specimen.visible = !obj;
        requestRender();
    }

    /* Aim the camera at `obj` from RAS direction `view.dir` (up `view.up`),
       far enough that `focus` ({ center: RAS, radius } in the object's frame)
       or else its bounding sphere fits the canvas. Always a cut, never a
       flight — which also honours prefers-reduced-motion (docs/ssb.md 7.4). */
    function frame(obj, view, focus) {
        resize();
        const sphere = new THREE.Sphere();
        if (focus) {
            obj.updateMatrixWorld(true);
            sphere.center.set(...focus.center).applyMatrix4(obj.matrixWorld);
            sphere.radius = focus.radius;
        } else {
            new THREE.Box3().setFromObject(obj).getBoundingSphere(sphere);
        }
        const dir = new THREE.Vector3(...rasToScene(view.dir)).normalize();
        camera.up.set(...rasToScene(view.up || [0, 0, 1]));
        const vfov = (camera.fov * Math.PI) / 180;
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (width / height));
        const dist = (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * 1.02;
        controls.target.copy(sphere.center);
        camera.position.copy(sphere.center).addScaledVector(dir, dist);
        controls.minDistance = sphere.radius * 0.4;
        controls.update();
        requestRender();
    }

    function resetView() {
        camera.up.set(0, 1, 0);
        camera.position.copy(specimenView.position);
        controls.target.copy(specimenView.target);
        controls.minDistance = 30;
        controls.update();
        requestRender();
    }

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const tagged = (o) => { for (let p = o; p; p = p.parent) if (p.userData && p.userData.id) return p; return null; };

    /* Everything under a client point, as tagged parts, nearest first; solid
       parts before see-through ones (spaces, ghosted walls), so a cell inside
       a sinus is picked through the sinus. */
    function pick(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const seen = new Set();
        const parts = [];
        for (const hit of raycaster.intersectObject(content, true)) {
            if (hit.object.isLine || hit.object.isPoints) continue;
            const part = tagged(hit.object);
            if (!part || seen.has(part) || !hit.object.visible) continue;
            seen.add(part);
            const look = part.userData.look || {};
            parts.push({ part, distance: hit.distance, clear: !!(look.space || look.ghost || look.translucent) });
        }
        return parts.sort((a, b) => a.clear - b.clear || a.distance - b.distance).map((p) => p.part);
    }

    /* A scene point -> client coordinates (and whether it is in front). */
    function toClient(v) {
        const r = canvas.getBoundingClientRect();
        probe.copy(v).project(camera);
        return { x: r.left + (probe.x * 0.5 + 0.5) * r.width, y: r.top + (-probe.y * 0.5 + 0.5) * r.height, front: probe.z < 1 };
    }

    function setAnimating(on) {
        animating = !!on;
        if (animating) requestRender();
    }
    function onFrame(fn) { frameSubs.add(fn); return () => frameSubs.delete(fn); }
    function onTheme(fn) { themeSubs.add(fn); return () => themeSubs.delete(fn); }

    /* ---- the test window for materials (window.__ssb.materials) ---- */

    const probeScene = new THREE.Scene();
    probeScene.add(new THREE.HemisphereLight(0xffffff, 0x808080, 1.4));
    const probeLight = new THREE.DirectionalLight(0xffffff, 1.5);
    probeLight.position.set(0.3, 0.4, 1);
    probeScene.add(probeLight);
    const probeCamera = new THREE.PerspectiveCamera(30, 1, 1, 100);
    probeCamera.position.set(0, 0, 20);

    /* Draw a sphere in the kind's material into a 24 px target: the GL error
       state, the colour at its centre (a shader that compiled but draws
       nothing, or NaN, reads black), and over its middle the relative
       luminance range and the share of near-black pixels (a hatched kind has
       stripes, a plain one hardly any). */
    function probeKind(kind, hazard = false) {
        const target = new THREE.WebGLRenderTarget(24, 24);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), library.material({ kind }, { hazard }));
        probeScene.add(ball);
        while (gl.getError() !== gl.NO_ERROR) { /* drain */ }
        const before = renderer.getRenderTarget();
        renderer.setRenderTarget(target);
        renderer.render(probeScene, probeCamera);
        const px = new Uint8Array(24 * 24 * 4);
        renderer.readRenderTargetPixels(target, 0, 0, 24, 24, px);
        renderer.setRenderTarget(before);
        const glError = gl.getError();
        let lo = 255;
        let hi = 0;
        let dark = 0;
        for (let y = 6; y < 18; y++) {
            for (let x = 6; x < 18; x++) {
                const i = (y * 24 + x) * 4;
                const l = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
                lo = Math.min(lo, l);
                hi = Math.max(hi, l);
                if (l < 25) dark += 1;
            }
        }
        const c = (12 * 24 + 12) * 4;
        probeScene.remove(ball);
        ball.geometry.dispose();
        target.dispose();
        return { kind, hazard, glError, rgb: [px[c], px[c + 1], px[c + 2]], contrast: hi > 0 ? (hi - lo) / hi : 0, dark: dark / 144 };
    }

    const materialsHook = Object.freeze({
        kinds: KINDS,
        get quality() { return library.quality; },
        get requested() { return requested; },
        get detected() { return detected; },
        get materials() { return library.count; },
        get programs() { return renderer.info.programs.length; },
        programKeys: () => renderer.info.programs.map((p) => p.cacheKey),
        probe: probeKind,
    });

    refreshTheme();
    return {
        THREE, canvas, camera, frames: () => frames, requestRender, refreshTheme,
        materialsFor, setQuality, materialsHook, outline, setContent, frame, resetView, pick, toClient, setAnimating, onFrame, onTheme,
    };
}
