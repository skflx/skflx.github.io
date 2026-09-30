/* =============================================================
   scene.js — the 3D stage: renderer, camera, controls, lights, token
   materials, picking, on-demand loop.

   Two stages share one renderer: the *specimen* stage (phase 1's
   placeholder — an RAS axis gizmo and a neutral 10 mm grid, since the
   reference specimen does not exist yet) and a *content* slot the variant
   lab fills with a diorama (setContent). No pixel of the placeholder makes
   an anatomical claim.

   - Coordinates: authored data is RAS millimetres; rasToScene() (frame.js,
     re-exported here) is the one conversion, at the one boundary
     (docs/ssb.md 4). 1 scene unit = 1 mm.
   - Materials come from CSS tokens (--ssb-* in css/ssb.css), by the `look`
     a part carries (tint + flags). Computed values are read at boot and
     again whenever html[data-theme] changes. A hazard site is hatched in
     the shader, never marked by colour alone (docs/ssb.md 7.4).
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

/* Fallbacks when a token is missing (they mirror css/ssb.css, light theme). */
const TINT_FALLBACK = {
    bone: '#dccfae', 'bone-cut': '#b8a47a', space: '#7fa6c9', orbit: '#e3cf8f', dura: '#8f969e',
    artery: '#c0392b', mucosa: '#d98a82', flow: '#159ec4', 'flow-particle': '#e8fbff',
    'cell-ethmoid': '#8e9ba6', 'cell-anc': '#2f9e7a', 'cell-sac': '#6db24f', 'cell-safc': '#b1b53a',
    'cell-sbc': '#8267d0', 'cell-sbfc': '#b0509f', 'cell-soec': '#c98a2e', 'cell-fsc': '#3f6fc9',
};

/* A computed --ssb-* token as a colour string three.js can parse, else the fallback. */
export function token(name, fallback) {
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
     canvas  the WebGL canvas; CSS sizes it (the whole stage, or the stage
             beside the lab's docked controls) and the renderer follows it
     host    the stage element
     labels  overlay element that receives the axis letters (DOM text, not sprites)
     onLost  called when the graphics context is lost
   Throws if WebGL 2 is unavailable (main.js catches and degrades to graph mode). */
export function createScene({ canvas, host, labels, onLost }) {
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

    /* ---- token materials, cached by look ---- */

    const hatchColor = { value: new THREE.Color() };
    const hatchScale = { value: 9 * pixelRatio };
    const selectColor = new THREE.Color();
    const materials = new Map();

    function paint(entry) {
        const { mat, tint, selected } = entry;
        mat.color.set(token('--ssb-' + tint, TINT_FALLBACK[tint] || '#999999'));
        if (tint === 'flow' || tint === 'flow-particle') {
            mat.emissive.copy(mat.color);
            mat.emissiveIntensity = tint === 'flow' ? 0.35 : 0.8;
        } else {
            mat.emissive.copy(selected ? selectColor : new THREE.Color(0x000000));
            mat.emissiveIntensity = selected ? 0.55 : 1;
        }
    }

    /* look: { tint, space?, ghost?, translucent?, doubleSide? }; hazard: hatched;
       selected: emissive highlight. One material per combination. */
    function material(look, { hazard = false, selected = false } = {}) {
        const tint = look.tint || 'bone';
        const key = [tint, look.space ? 's' : '', look.ghost ? 'g' : '', look.translucent ? 't' : '', look.doubleSide ? 'd' : '',
            hazard ? 'h' : '', selected ? 'x' : ''].join('|');
        if (materials.has(key)) return materials.get(key).mat;
        const mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 });
        if (look.space || look.ghost || look.translucent) {
            mat.transparent = true;
            mat.depthWrite = false;
            mat.opacity = look.space ? 0.16 : look.ghost ? 0.1 : 0.55;
            mat.side = THREE.DoubleSide;
        }
        if (look.doubleSide) mat.side = THREE.DoubleSide;
        if (hazard) {
            mat.onBeforeCompile = (shader) => {
                shader.uniforms.uHatch = hatchColor;
                shader.uniforms.uHatchScale = hatchScale;
                shader.fragmentShader = 'uniform vec3 uHatch;\nuniform float uHatchScale;\n' + shader.fragmentShader.replace(
                    '#include <color_fragment>',
                    '#include <color_fragment>\n\tfloat ssbHatch = step(0.55, fract((gl_FragCoord.x + gl_FragCoord.y) / uHatchScale));\n'
                    + '\tdiffuseColor.rgb = mix(diffuseColor.rgb, uHatch, ssbHatch * 0.9);',
                );
            };
            mat.customProgramCacheKey = () => 'ssb-hatch';
        }
        const entry = { mat, tint, selected };
        paint(entry);
        materials.set(key, entry);
        return mat;
    }

    /* A ghosted wall reads by its outline: hard edges as lines. */
    const edgeMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 });
    function outline(mesh) {
        const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 35), edgeMaterial);
        lines.userData.outline = true;
        return lines;
    }

    /* Materials for a part mesh: [cut faces, sides] for a slab with cut: true. */
    function materialsFor(look, opts) {
        if (look.cut) return [material({ ...look, tint: 'bone-cut' }, opts), material(look, opts)];
        return material(look, opts);
    }

    /* ---- tokens -> colours (boot + every theme change) ---- */

    const themeSubs = new Set();
    function refreshTheme() {
        renderer.setClearColor(new THREE.Color(token('--ssb-stage-bg', '#fafaf7')));
        gridMinor.material.color.set(token('--ssb-grid', '#d6d7d0'));
        gridMajor.material.color.set(token('--ssb-grid-major', '#b4b6ae'));
        for (const a of axes) a.material.color.set(token(`--ssb-axis-${a.axis.key}`, '#888888'));
        hatchColor.value.set(token('--ssb-hazard', '#231815'));
        edgeMaterial.color.set(token('--ssb-bone-cut', '#b8a47a'));
        selectColor.set(token('--ssb-select', '#ffb000'));
        for (const entry of materials.values()) paint(entry);
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

    refreshTheme();
    return {
        THREE, canvas, camera, frames: () => frames, requestRender, refreshTheme,
        materialsFor, outline, setContent, frame, resetView, pick, toClient, setAnimating, onFrame, onTheme,
    };
}
