/* =============================================================
   mode-endoscope.js — the Endoscope stage: a first-person rigid scope on the
   reference specimen (docs/ssb.md 3, Endoscope; the math is scope.js).

   The scope is a camera pose over the Specimen stage, not a second scene:
   state.scope (the store, `#scope=`) says the pose, this module takes the
   camera (OrbitControls off), a spotlight at the tip with inverse-square
   falloff and a 70 degree circular field of view, and asks the specimen mode
   for the lining seen from inside (bone hidden, mucosa on: ST1). Leaving puts
   everything back: the camera, the lights, the layers.

   - Fulcrum: lm.naris.<side> from landmarks.json. It is provisional (E1:
     10 mm in front of the masked cavity) until the nose exists (ST6).
   - Input (canvas focused): drag looks around (horizontal yaw, vertical pitch),
     the wheel inserts and withdraws, arrow keys yaw and pitch, + / - or
     PageUp / PageDown depth, Q / E roll, L cycles the lens; Shift = x5.
     Every change goes through the store, so the URL, the sliders and the
     image agree. Nothing here animates: a pose change is a cut, which is also
     what prefers-reduced-motion asks for.
   - Collision (E3): the shaft is blocked by bone only (scope.js shaftClearance) against the CT
     display volume; a pose that would block is clamped to the last free depth, whoever asked
     (keys, sliders, a pasted link). The shaft is 4 mm (owner decision O4) or 2.7 mm, chosen in
     the controls and never in the hash. Without the volume the scope still moves, unblocked.
   - The proximity HUD (E3): each distance field in ct.json `sdf`, read at the tip, nearest
     first, plus the shaft length lying in mucosa. No fields, no HUD.
   - Station flights (E6) are not here.

   Imports no three.js: THREE comes from the stage. `hook` is the read-only
   test window (window.__ssb.scope).
   ============================================================= */
import { loadLandmarks } from './geo-specimen.js?v=222761d9';
import { sharedVolume, stamped, decode } from './volume.js?v=4943c913';
import { rasToScene, sceneToRas } from './frame.js?v=f554e767';
import { LENSES, POSE_DEFAULT, RANGES, SHAFT_RADII, clampPose, frameOf, hudRows, lightPostAngle, sdfSampler, shaftClearance, tipOf, verticalFov } from './scope.js?v=4ee7f38a';

const DRAG_DEG_PER_PX = 0.15;
const WHEEL_MM = 1;
const NEAR_MM = 0.4;
const SPOT = { intensity: 350, angle: 0.72, penumbra: 0.55, decay: 2 };
/* Automatic exposure, as a camera control unit does: the spotlight's intensity is K * D^2, D the median distance to
   the lining along the view and four rays 15 degrees off it, so a surface at the median range is lit the same at any
   distance. K is EXPOSURE_D0 as a range: the intensity SPOT.intensity would give at that D. Tuned against the Accept
   in tools/test-ssb.mjs (under 10 % of the field clipped, median luminance 40-200 at three poses) together with FILL;
   the clamp keeps a blind pose (no hit) and a mucosal contact legible. */
const EXPOSURE_D0 = 16;
const EXPOSURE = { K: SPOT.intensity / (EXPOSURE_D0 * EXPOSURE_D0), floorMm: 3, farMm: 150, offAxisDeg: 15, min: 10, max: 2000 };
const FILL = 0.5;                /* hemisphere fill left on in the scope: the lining beyond the light is dim, not black */
const KEY_STEP = { depth: 1, yaw: 2, pitch: 2, roll: 5 };

/* opts: { stage, store, graph, specimen }
     stage     scene.js's handle      store  the one store      graph  the knowledge graph
     specimen  mode-specimen.js's handle (ready, bone, mucosaOn, setBone, setMucosa, onChange) */
export function mountEndoscope({ stage, store, graph, specimen }) {
    const { THREE, camera, canvas } = stage;
    const subs = new Set();
    const fulcra = new Map();            /* side -> RAS [r, a, s] */
    let engaged = false;
    let saved = null;
    let spot = null;
    let stopFrames = null;
    let renders = 0;
    let exposed = null;                  /* the pose key the spotlight was last exposed for */
    let lastD = null;
    let lastMs = 0;
    const raycaster = new THREE.Raycaster();
    let ctAt = null;                     /* RAS -> CT display level, once the volume has loaded */
    let sdfFields = [];                  /* [{ id, name, at(ras) -> mm }] */
    let clampMm = 25;
    let shaft = '4';                     /* '4' | '2.7' (mm): the collision ring's radius, SHAFT_RADII */
    let hud = { rows: [], contactMm: 0, limited: false };
    let limitedNext = false;
    let lastPose = null;                 /* the pose to come back to when the Scope pill is pressed again */

    const emit = () => { for (const fn of [...subs]) { try { fn(); } catch (e) { console.error(e); } } };
    const pose = () => store.get().scope;
    const available = () => specimen.ready && fulcra.size > 0;

    loadLandmarks({ graph }).then((map) => {
        for (const side of ['R', 'L']) {
            const lm = map.get(`lm.naris.${side}`);
            if (lm) fulcra.set(side, lm.ras.slice());
        }
        sync();
    }).catch((e) => console.error(e));

    /* ---------------- the volume: collision and the HUD ---------------- */

    /* ct.json's `sdf` block -> [{ id, name, at }], skipping anything malformed (the HUD is optional). */
    async function loadFields(meta) {
        const sdf = meta ? meta.sdf : null;
        if (!sdf || !Array.isArray(sdf.dims) || sdf.dims.length !== 3 || !sdf.dims.every((n) => Number.isInteger(n) && n > 1 && n <= 512)
            || !Array.isArray(sdf.affine) || !(sdf.scale > 0) || !(sdf.clampMm > 0) || !sdf.fields || typeof sdf.fields !== 'object') return [];
        const count = sdf.dims[0] * sdf.dims[1] * sdf.dims[2];
        const out = [];
        for (const [id, f] of Object.entries(sdf.fields)) {
            if (!f || typeof f.file !== 'string' || !/^[A-Za-z0-9._-]+$/.test(f.file)) continue;
            try {
                const r = await fetch(stamped(`ssb/ct/${f.file}`));
                if (!r.ok) continue;
                const bytes = new Uint8Array(await decode(await r.arrayBuffer(), count));
                if (bytes.length === count) out.push({ id, name: graph.nameOf(id), at: sdfSampler(sdf, bytes) });
            } catch (e) { /* a missing field leaves its row out */ }
        }
        clampMm = sdf.clampMm;
        return out;
    }

    /* The volume and the fields load on the first engage, not at mount: a visitor who never opens the scope
       downloads none of it. Until they arrive the scope moves unblocked. */
    let volumeAsked = false;
    function loadCollision() {
        if (volumeAsked) return;
        volumeAsked = true;
        sharedVolume().then(async (vol) => {
            const fields = await loadFields(vol.meta).catch(() => []);
            ctAt = (p) => vol.sample(p[0], p[1], p[2]);
            sdfFields = fields;
            exposed = null;
            sync();
        }).catch((e) => { volumeAsked = false; console.error(e); });
    }

    /* Check the pose against the CT: clamp a blocked depth (true = the pose was changed, and sync runs again
       through the store) and refresh the HUD. */
    function enforce() {
        const p = pose();
        const f = p && fulcra.get(p.side);
        if (!p || !f || !ctAt) { hud = { rows: [], contactMm: 0, limited: false }; return false; }
        const c = shaftClearance(f, p, ctAt, SHAFT_RADII[shaft]);
        if (c.depth < p.depth - 1e-9) {
            limitedNext = true;                /* the pass the clamp triggers reports it */
            setPose({ depth: c.depth });
            return true;
        }
        const names = new Map(sdfFields.map((x) => [x.id, x.name]));
        hud = { rows: hudRows(sdfFields, tipOf(f, p)).map((r) => ({ ...r, name: names.get(r.id) })), contactMm: c.contactMm, limited: limitedNext };
        limitedNext = false;
        return false;
    }

    function setShaft(key) {
        if (!Object.prototype.hasOwnProperty.call(SHAFT_RADII, key) || key === shaft) return false;
        shaft = key;
        sync();
        return true;
    }

    /* ---------------- the camera ---------------- */

    /* `redraw` is false from inside a frame: the render that called us is the redraw (asking for another
       would keep the on-demand loop running forever). */
    function apply(redraw = true) {
        const p = pose();
        const f = p && fulcra.get(p.side);
        if (!p || !f) return;
        const fr = frameOf(p);
        const toScene = (v) => new THREE.Vector3(...rasToScene(v));
        const x = toScene(fr.right);
        const y = toScene(fr.up);
        const z = toScene(fr.v).negate();                  /* the camera looks down its own -Z */
        camera.position.set(...rasToScene(tipOf(f, p)));
        camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
        const w = canvas.clientWidth || 1;
        const h = canvas.clientHeight || 1;
        const fov = verticalFov(w, h);
        if (Math.abs(camera.fov - fov) > 1e-6 || camera.near !== NEAR_MM) {
            camera.fov = fov;
            camera.near = NEAR_MM;
            camera.updateProjectionMatrix();
        }
        camera.updateMatrixWorld(true);
        expose(p);
        if (redraw) stage.requestRender();
    }

    /* The distance from the tip to the lining ahead: the median hit over five rays against the visible air-space
       surfaces drawn as mucosa (the air spaces and the septal mucosa), floored at 3 mm; no hit at all reads as the far limit. Only when the
       pose changes: a frame that did not move the scope costs nothing. */
    function expose(p) {
        if (!spot) return;
        const t0 = performance.now();
        const key = `${p.side},${p.depth},${p.yaw},${p.pitch},${p.roll},${p.lens}`;
        if (key === exposed) return;
        exposed = key;
        const targets = [];
        stage.scene.updateMatrixWorld(true);
        stage.scene.traverse((o) => { if (o.isMesh && o.visible && o.userData && o.userData.drawn === 'mucosa') targets.push(o); });
        const q = camera.quaternion;
        const a = EXPOSURE.offAxisDeg * Math.PI / 180;
        const dirs = [[0, 0], [Math.sin(a), 0], [-Math.sin(a), 0], [0, Math.sin(a)], [0, -Math.sin(a)]]
            .map(([x, y]) => new THREE.Vector3(x, y, -Math.sqrt(1 - x * x - y * y)).applyQuaternion(q));
        raycaster.near = 0;
        raycaster.far = EXPOSURE.farMm;
        const hits = dirs.map((d) => {
            raycaster.set(camera.position, d);
            const h = raycaster.intersectObjects(targets, false);
            return h.length ? h[0].distance : EXPOSURE.farMm;
        }).sort((x, y) => x - y);
        lastD = Math.max(EXPOSURE.floorMm, hits[2]);
        lastMs = performance.now() - t0;
        spot.intensity = Math.min(EXPOSURE.max, Math.max(EXPOSURE.min, EXPOSURE.K * lastD * lastD));
    }

    function onFrame() {
        renders += 1;
        apply(false);
    }

    /* ---------------- taking over and giving back ---------------- */

    function engage() {
        engaged = true;
        const { lights, controls } = stage;
        saved = {
            pose: stage.pose(), fov: camera.fov, near: camera.near, enabled: controls.enabled,
            hemi: lights.hemi.intensity, head: lights.head.intensity, bone: specimen.bone, mucosa: specimen.mucosaOn,
        };
        stage.holdPose(saved.pose);
        controls.enabled = false;
        lights.hemi.intensity = FILL;
        lights.head.intensity = 0;
        if (!spot) {
            spot = new THREE.SpotLight(0xffffff, SPOT.intensity, 0, SPOT.angle, SPOT.penumbra, SPOT.decay);
            spot.target.position.set(0, 0, -1);
            camera.add(spot, spot.target);
        }
        spot.visible = true;
        exposed = null;
        specimen.setBone('hidden');
        specimen.setMucosa(true, { inside: true });
        if (!stopFrames) stopFrames = stage.onFrame(onFrame);
        apply();
        emit();
    }

    function disengage() {
        engaged = false;
        const { lights, controls } = stage;
        if (stopFrames) { stopFrames(); stopFrames = null; }
        if (spot) spot.visible = false;
        if (saved) {
            lights.hemi.intensity = saved.hemi;
            lights.head.intensity = saved.head;
            controls.enabled = saved.enabled;
            camera.fov = saved.fov;
            camera.near = saved.near;
            camera.updateProjectionMatrix();
            specimen.setBone(saved.bone);
            specimen.setMucosa(saved.mucosa, { inside: false });
            stage.setPose(saved.pose);        /* also releases the held pose */
            saved = null;
        }
        stage.holdPose(null);
        emit();
    }

    /* Engage when the store has a pose and the specimen and fulcrum are there. */
    function sync() {
        if (pose() && available() && enforce()) return;
        const want = !!pose() && available();
        if (want) loadCollision();
        if (want && !engaged) engage();
        else if (!want && engaged) disengage();
        else if (engaged) { apply(); emit(); }
        else emit();
    }

    store.subscribe((state, prev) => {
        if (state.scope) lastPose = state.scope;
        if (state.scope !== prev.scope) sync();
    });
    specimen.onChange(() => { exposed = null; sync(); });          /* the specimen loading, or a layer change, may make the scope available */

    /* ---------------- pose changes ---------------- */

    function setPose(patch) {
        const cur = pose();
        if (!cur) return false;
        return store.setScope({ ...cur, ...patch });
    }

    /* Add `delta` to a field: roll wraps, the others clamp (the store clamps too). */
    function nudge(key, delta) {
        const cur = pose();
        if (!cur || !Object.prototype.hasOwnProperty.call(RANGES, key)) return false;
        const v = key === 'roll' ? (((cur.roll + delta) % 360) + 360) % 360 : cur[key] + delta;
        return setPose({ [key]: v });
    }

    function cycleLens(step = 1) {
        const cur = pose();
        if (!cur) return false;
        const i = LENSES.indexOf(cur.lens);
        return setPose({ lens: LENSES[(i + step + LENSES.length) % LENSES.length] });
    }

    function enter(side) {
        const base = clampPose({ ...(lastPose || POSE_DEFAULT), ...(side ? { side } : {}) });
        return store.setScope(base);
    }

    function leave() { return store.setScope(null); }

    /* ---------------- input ---------------- */

    const sigma = () => (pose() && pose().side === 'L' ? -1 : 1);
    let drag = null;

    canvas.addEventListener('pointerdown', (e) => {
        if (!engaged || e.button !== 0) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!engaged || !drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        const cur = pose();
        if (!cur) return;
        /* look where the pointer goes: image-right is patient-left at yaw 0 for the right scope */
        setPose({ yaw: cur.yaw - sigma() * dx * DRAG_DEG_PER_PX, pitch: cur.pitch - dy * DRAG_DEG_PER_PX });
    });
    const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (e) => {
        if (!engaged) return;
        e.preventDefault();
        nudge('depth', e.deltaY < 0 ? WHEEL_MM : -WHEEL_MM);
    }, { passive: false });
    canvas.addEventListener('keydown', (e) => {
        if (!engaged || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.shiftKey ? 5 : 1;
        let did = true;
        switch (e.key) {
            case 'ArrowLeft': nudge('yaw', sigma() * KEY_STEP.yaw * k); break;      /* look left: toward +R for the right scope */
            case 'ArrowRight': nudge('yaw', -sigma() * KEY_STEP.yaw * k); break;
            case 'ArrowUp': nudge('pitch', KEY_STEP.pitch * k); break;
            case 'ArrowDown': nudge('pitch', -KEY_STEP.pitch * k); break;
            case '+': case '=': case 'PageUp': nudge('depth', KEY_STEP.depth * k); break;
            case '-': case '_': case 'PageDown': nudge('depth', -KEY_STEP.depth * k); break;
            case 'q': case 'Q': nudge('roll', -KEY_STEP.roll * k); break;
            case 'e': case 'E': nudge('roll', KEY_STEP.roll * k); break;
            case 'l': case 'L': cycleLens(e.shiftKey ? -1 : 1); break;
            default: did = false;
        }
        if (did) e.preventDefault();
    });

    /* ---------------- the test window ---------------- */

    const toRas = (v) => sceneToRas(v.toArray());
    const hook = Object.freeze({
        get active() { return !!pose(); },
        get engaged() { return engaged; },
        get available() { return available(); },
        get pose() { return pose() ? { ...pose() } : null; },
        get fulcrum() { const p = pose(); return p && fulcra.has(p.side) ? fulcra.get(p.side).slice() : null; },
        get tip() { const p = pose(); const f = p && fulcra.get(p.side); return f ? tipOf(f, p) : null; },
        get frame() { return pose() ? frameOf(pose()) : null; },
        get lightPost() { return pose() ? lightPostAngle(pose()) : null; },
        get renders() { return renders; },
        /* what the camera actually is, in RAS mm: position and the viewing and up directions */
        camera() {
            camera.updateMatrixWorld(true);
            const q = camera.quaternion;
            const dir = (x, y, z) => toRas(new THREE.Vector3(x, y, z).applyQuaternion(q));
            return { position: toRas(camera.position), view: dir(0, 0, -1), up: dir(0, 1, 0), fov: camera.fov, near: camera.near };
        },
        get shaft() { return { key: shaft, radius: SHAFT_RADII[shaft] }; },
        get collision() { return !!ctAt; },
        get hud() { return { rows: hud.rows.map((r) => ({ ...r })), contactMm: hud.contactMm, limited: hud.limited, clampMm }; },
        get exposure() { return { distance: lastD, intensity: spot ? spot.intensity : null, ms: lastMs }; },
        lights: () => ({ spot: spot ? { on: spot.visible, intensity: spot.intensity, decay: spot.decay, angle: spot.angle } : null,
            hemi: stage.lights.hemi.intensity, head: stage.lights.head.intensity }),
        controlsEnabled: () => stage.controls.enabled,
    });

    return {
        hook, enter, leave, setPose, nudge, cycleLens, setShaft,
        get shaft() { return shaft; },
        get hud() { return hook.hud; },
        LENSES, RANGES,
        get engaged() { return engaged; },
        get available() { return available(); },
        get pose() { return pose(); },
        get tip() { return hook.tip; },
        get ready() { return available(); },
        get lastPose() { return lastPose; },
        onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    };
}
