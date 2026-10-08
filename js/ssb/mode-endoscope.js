/* =============================================================
   mode-endoscope.js — the Endoscope stage: a first-person rigid scope on the
   reference specimen (docs/ssb.md 3, Endoscope; the math is scope.js).

   The scope is a camera pose over the Specimen stage, not a second scene:
   state.scope (the store, `#scope=`) says the pose, this module takes the
   camera (OrbitControls off), a spotlight at the tip with inverse-square
   falloff and a 70 degree circular field of view, and asks the specimen mode
   for the lining seen from inside (bone hidden, mucosa on: ST1). Leaving puts
   everything back: the camera, the lights, the layers.

   - Fulcrum: lm.naris.<side> from landmarks.json: the vestibule centroid at
     the alar-rim band, inside the specimen's own nose (E1b, ST6).
   - Input (canvas focused): drag looks around (horizontal yaw, vertical pitch),
     the wheel inserts and withdraws, arrow keys yaw and pitch, + / - or
     PageUp / PageDown depth, Q / E roll, L cycles the lens; Shift = x5.
     Every change goes through the store, so the URL, the sliders and the
     image agree. A pose change is a cut; only a station flight (E6) moves the
     pose over time, and under prefers-reduced-motion that is a cut too.
   - Collision (E3, E3b): the shaft is blocked by bone (scope.js shaftClearance) against the CT
     display volume, and by the midline (R = 0, the standard specimen's septum) except in the nasopharynx,
     behind and below lm.choanal-arch.M; a pose that would block is clamped to the last free depth, whoever asked
     (keys, sliders, a pasted link). The shaft is 4 mm (owner decision O4) or 2.7 mm, chosen in
     the controls and never in the hash. Without the volume the scope still moves, unblocked.
   - The proximity HUD (E3): each distance field in ct.json `sdf`, read at the tip, nearest
     first, plus the shaft length lying in mucosa. No fields, no HUD.
   - CT along the scope (E4): on each animation frame that follows a pose change the shared 3D cursor
     (state.cursor) goes to the tip T, and a small inset shows the oblique CT slice through T spanned by the
     view direction and the camera's up, with the shaft drawn on it. It exists once the volume has loaded.
   - Exposure runs on settle (100 ms without a pose change, and on engage), not on every moving frame.
   - Station flights (E6): ssb/geometry/stations.json (Opus's poses, never edited here) loads with the scope, or
     sooner when `#scope=t.<id>[.<side>]` is pending in the store; the list in the controls and the link both end at
     a station's stored pose. A flight interpolates depth, yaw, pitch and roll (shortest way round) over FLIGHT_MS
     through the store, one pose per animation frame, so collision, the HUD, the URL and the CT inset follow as for
     any pose change; the lens switches at the end, and a different nostril from the first step. A pose that would
     block mid-flight is clamped as usual (a station's own pose is free by construction). Any other pose change,
     a pointer press, the wheel or a key cancels the flight where it is.

   - Procedure states (P2, docs/ssb.md 5.8): the procedure player hands in a derived volume (`setStateVolume`, volume.js
     applyPatch) and collision, the tip's label and the exposure read it instead of the base; the CT inset and the CT
     stage keep reading the base image. A station for a procedure step is looked up in `byState[<state key>]` first, then
     in the intact table (`stationFor`, `flyTo(key, stateKey)`).

   - A station may carry `shaft: "2.7"` (stations.json; the olfactory cleft, the inferior meatus): flying to it, or opening
     its link, puts the 2.7 mm telescope on and `shaftWhy` says which station did; choosing a diameter by hand clears it.

   Imports no three.js: THREE comes from the stage. `hook` is the read-only
   test window (window.__ssb.scope).
   ============================================================= */
import { loadLandmarks } from './geo-specimen.js?v=2f804465';
import { sharedVolume, stamped, decode } from './volume.js?v=870c5777';
import { rasToScene, sceneToRas } from './frame.js?v=f554e767';
import { ARCH_DEFAULT, LENSES, POSE_DEFAULT, RANGES, SHAFT_RADII, clampPose, flightPose, frameOf, hudRows, lightPostAngle, parseStationLink, parseStations, resolveStation, samePose, sdfSampler, shaftClearance, tipOf, verticalFov } from './scope.js?v=c518cfe8';

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
const SETTLE_MS = 100;            /* the pose must rest this long before the exposure is measured */
const INSET = { size: 129, pixel: 0.5 };   /* odd, so the centre pixel is T; 0.5 mm: a 64 mm square */
const KEY_STEP = { depth: 1, yaw: 2, pitch: 2, roll: 5 };
const STATIONS_FILE = 'ssb/geometry/stations.json';
const FLIGHT_MS = 600;
const INTERNAL = Object.freeze({ source: 'scope', internal: true });     /* a pose change the mode itself makes (a flight step, a collision clamp): it must not cancel the flight */

/* opts: { stage, store, graph, specimen }
     stage     scene.js's handle      store  the one store      graph  the knowledge graph
     specimen  mode-specimen.js's handle (ready, bone, mucosaOn, setBone, setMucosa, onChange) */
export function mountEndoscope({ stage, store, graph, specimen }) {
    const { THREE, camera, canvas } = stage;
    const subs = new Set();
    const fulcra = new Map();            /* side -> RAS [r, a, s] */
    let arch = ARCH_DEFAULT;             /* lm.choanal-arch.M's { a, s }: the midline rule's nasopharynx corner */
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
    let shaftWhy = null;                 /* { station, shaft } while a station that needs the 2.7 mm telescope put it on, else null */
    let hud = { rows: [], contactMm: 0, limited: false, limitedBy: null };
    let limitedNext = null;              /* what the last clamp was by ('bone' | 'septum'), reported by the pass it triggers */
    let ctVol = null;                    /* the shared volume, once loaded */
    let stateVol = null;                 /* a dissected state's volume (P2): what collision and the tip's label read; the base stays the CT image */
    let stateKey = null;
    let byState = new Map();             /* state key -> Map("t.<id>.<side>" -> { id, side, pose }) from stations.json `byState` */
    let insetData = null;                /* { ct, width, height, pixel, shaft: [x0, y0, x1, y1], center } for the UI */
    const insetSubs = new Set();
    let selfMove = false;
    let followed = null;                 /* the pose key the cursor and the inset were last placed for */
    let settleTimer = null;
    let pendingKey = null;
    let exposeRuns = 0;
    let lastPose = null;                 /* the pose to come back to when the Scope pill is pressed again */
    let stations = new Map();            /* "t.<id>.<side>" -> { id, side, pose }, once ssb/geometry/stations.json has loaded */
    let stationsState = 'idle';          /* 'idle' | 'loading' | 'ready' | 'failed' (missing or malformed: no list, links ignored) */
    let stationsAsked = null;
    let flight = null;                   /* { from, to, t0, raf } while a station flight runs */
    const reduce = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    const emit = () => { for (const fn of [...subs]) { try { fn(); } catch (e) { console.error(e); } } };
    const pose = () => store.get().scope;
    const available = () => specimen.ready && fulcra.size > 0;

    loadLandmarks({ graph }).then((map) => {
        for (const side of ['R', 'L']) {
            const lm = map.get(`lm.naris.${side}`);
            if (lm) fulcra.set(side, lm.ras.slice());
        }
        const ca = map.get('lm.choanal-arch.M');
        if (ca && Number.isFinite(ca.ras[1]) && Number.isFinite(ca.ras[2])) arch = { a: ca.ras[1], s: ca.ras[2] };
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
            ctAt = (p) => (stateVol || vol).sample(p[0], p[1], p[2]);
            ctVol = vol;
            followed = null;
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
        if (!p || !f || !ctAt) { hud = { rows: [], contactMm: 0, limited: false, limitedBy: null }; return false; }
        const c = shaftClearance(f, p, ctAt, SHAFT_RADII[shaft], arch);
        if (c.depth < p.depth - 1e-9) {
            limitedNext = c.by;                /* the pass the clamp triggers reports it */
            store.setScope({ ...p, depth: c.depth }, INTERNAL);
            return true;
        }
        const names = new Map(sdfFields.map((x) => [x.id, x.name]));
        hud = { rows: hudRows(sdfFields, tipOf(f, p)).map((r) => ({ ...r, name: names.get(r.id) })), contactMm: c.contactMm, limited: !!limitedNext, limitedBy: limitedNext };
        limitedNext = null;
        return false;
    }

    /* The procedure player's dissected volume (or null: the base again). Re-runs the collision check, since a pose that
       was blocked by bone that is now air is free, and one that was free may not be (a step back). */
    function setStateVolume(vol, key = null) {
        if (vol === stateVol && key === stateKey) return;
        stateVol = vol;
        stateKey = vol ? key : null;
        exposed = null;
        sync();
    }

    function applyShaft(key) {
        if (!Object.prototype.hasOwnProperty.call(SHAFT_RADII, key) || key === shaft) return false;
        shaft = key;
        sync();
        return true;
    }

    /* The user's choice: it also ends a station's reason for the 2.7 mm telescope. */
    function setShaft(key) {
        const changed = applyShaft(key);
        if (changed && shaftWhy) { shaftWhy = null; emit(); }
        return changed;
    }

    /* ---------------- stations (E6) ---------------- */

    /* Loaded with the scope (and sooner for a pending station link), once per page. A missing, unreadable or malformed
       file leaves an empty table: no list, and a pending link is dropped, never an error. */
    function loadStations() {
        if (stationsAsked) return stationsAsked;
        stationsState = 'loading';
        stationsAsked = fetch(stamped(STATIONS_FILE)).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((doc) => {
            stations = parseStations(doc);
            byState = new Map();
            const states = doc && doc.byState && typeof doc.byState === 'object' && !Array.isArray(doc.byState) ? doc.byState : {};
            for (const [key, table] of Object.entries(states)) if (/^[0-9a-f]{10}$/.test(key)) byState.set(key, parseStations({ stations: table }));
            stationsState = stations.size ? 'ready' : 'failed';
            resolvePending();
            emit();
        });
        return stationsAsked;
    }

    /* A `#scope=t.<id>` link waiting in the store -> its pose (a cut), or dropped when the station is unknown. */
    function resolvePending() {
        const link = store.get().station;
        if (!link || (stationsState !== 'ready' && stationsState !== 'failed')) return;
        const hit = resolveStation(stations, parseStationLink(link));
        if (hit) needShaft(hit.shaft, `${hit.id}.${hit.side}`);
        store.resolveStation(hit ? hit.pose : null);
    }

    const listStations = () => [...stations].map(([key, s]) => ({ key, id: s.id, side: s.side, name: graph.nameOf(s.id), tier: graph.tierOf(s.id), pose: { ...s.pose }, shaft: s.shaft }));

    /* A station that is free only for the 2.7 mm telescope puts it on, and says so (`shaftWhy`); a station that is not
       leaves the shaft as the user has it and drops the reason. */
    function needShaft(wanted, key) {
        if (!wanted) { shaftWhy = null; return; }
        shaftWhy = { station: key, shaft: wanted };
        if (!applyShaft(wanted)) emit();
    }

    function cancelFlight() {
        if (!flight) return false;
        cancelAnimationFrame(flight.raf);
        flight = null;
        emit();
        return true;
    }

    /* A procedure step's station (`t.<id>`, no side) for the pose's nostril (else the midline) in a dissected state: the
       state's own table first, then the intact one. Returns { key, pose, state } (state: true when it came from byState) or null. */
    function stationFor(id, key = null) {
        const p = pose();
        const link = parseStationLink(id);
        if (!link) return null;
        for (const [table, own] of [[key ? byState.get(key) : null, true], [stations, false]]) {
            if (!table) continue;
            const hit = resolveStation(table, { id: link.id, side: link.side || (p ? p.side : 'R') }) || resolveStation(table, { id: link.id, side: 'M' });
            if (hit) return { key: `${hit.id}.${hit.side}`, pose: { ...hit.pose }, state: own };
        }
        return null;
    }

    /* Fly the scope to station `key` ("t.<id>.<side>"), in the dissected state `inState` when one is given and carries its
       own pose for it: false for an unknown key. */
    function flyTo(key, inState = null) {
        const own = inState ? byState.get(inState) : null;
        const st = (own && own.get(key)) || stations.get(key);
        if (!st) return false;
        const cur = pose();
        const to = clampPose(st.pose);
        cancelFlight();
        needShaft(st.shaft, key);
        if (!cur || reduce.matches) return store.setScope(to, INTERNAL) || samePose(cur, to);
        if (samePose(cur, to)) return true;
        const f = { from: { ...cur }, to, t0: performance.now(), raf: 0 };
        flight = f;
        const step = () => {
            if (flight !== f) return;
            const k = Math.min(1, (performance.now() - f.t0) / FLIGHT_MS);
            store.setScope(flightPose(f.from, f.to, k * k * (3 - 2 * k)), INTERNAL);
            if (flight !== f) return;                  /* something cancelled it from inside the change */
            if (k >= 1) { flight = null; emit(); return; }
            f.raf = requestAnimationFrame(step);
        };
        f.raf = requestAnimationFrame(step);
        emit();
        return true;
    }

    /* ---------------- the camera ---------------- */

    /* `redraw` is false from inside a frame: the render that called us is the redraw (asking for another
       would keep the on-demand loop running forever). */
    function apply(redraw = true, now = false) {
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
        if (now) expose(p);
        else scheduleExpose(p);
        if (redraw) stage.requestRender();
    }

    /* Exposure on settle: a pose change restarts the clock (and a held drag keeps it running), and the measurement (one raycast burst) happens once the
       pose has rested, so dragging costs none. A pose already measured is left alone. */
    function scheduleExpose(p) {
        const key = poseKey(p);
        if (key === exposed || key === pendingKey) return;
        pendingKey = key;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
            settleTimer = null;
            pendingKey = null;
            const q = pose();
            if (!q || !engaged || !spot) return;
            if (drag) { scheduleExpose(q); return; }          /* frames can outlast the clock on a slow GPU: a held pointer is not settled */
            expose(q);
            stage.requestRender();
        }, SETTLE_MS);
    }

    const poseKey = (p) => `${p.side},${p.depth},${p.yaw},${p.pitch},${p.roll},${p.lens}`;

    /* The distance from the tip to the lining ahead: the median hit over five rays against the visible air-space
       surfaces drawn as mucosa (the air spaces and the septal mucosa), floored at 3 mm; no hit at all reads as the far limit. Only when the
       pose changes: a frame that did not move the scope costs nothing. */
    function expose(p) {
        if (!spot) return;
        const t0 = performance.now();
        const key = poseKey(p);
        if (key === exposed) return;
        exposed = key;
        exposeRuns += 1;
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
        follow();
    }

    /* ---------------- CT along the scope ---------------- */

    /* Once per pose change, on an animation frame: the cursor goes to the tip and the inset is resampled. Never
       from inside a store notification (the frame loop is outside it). */
    function follow() {
        const p = pose();
        const f = p && fulcra.get(p.side);
        if (!p || !f || !ctVol) return;
        const key = poseKey(p);
        if (key === followed) return;
        followed = key;
        const T = tipOf(f, p);
        selfMove = true;                 /* the specimen's own change notice for this cursor must not reset the scope */
        try { store.setCursor(T); } finally { selfMove = false; }
        const fr = frameOf(p);
        const n = INSET.size;
        const half = (n - 1) / 2 * INSET.pixel;
        const down = fr.up.map((x) => -x);                 /* image y grows downward */
        const origin = T.map((x, i) => x - fr.v[i] * half - down[i] * half);
        try {
            const sl = ctVol.obliqueSlice({ origin, u: fr.v, v: down, width: n, height: n, pixel: INSET.pixel, ct: true, labels: false });
            const at = (P) => {
                const d = P.map((x, i) => x - T[i]);
                return [(n - 1) / 2 + (d[0] * fr.v[0] + d[1] * fr.v[1] + d[2] * fr.v[2]) / INSET.pixel,
                    (n - 1) / 2 - (d[0] * fr.up[0] + d[1] * fr.up[1] + d[2] * fr.up[2]) / INSET.pixel];
            };
            const a = at(f);
            const b = at(T);
            insetData = { ct: sl.ct, width: n, height: n, pixel: INSET.pixel, shaft: [a[0], a[1], b[0], b[1]], center: sl.ct[((n - 1) / 2) * n + (n - 1) / 2] };
        } catch (e) { insetData = null; console.error(e); }
        for (const fn of [...insetSubs]) { try { fn(); } catch (e) { console.error(e); } }
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
        apply(true, true);
        emit();
    }

    function disengage() {
        engaged = false;
        drag = null;
        cancelFlight();
        clearTimeout(settleTimer);
        settleTimer = null;
        pendingKey = null;
        followed = null;
        insetData = null;
        for (const fn of [...insetSubs]) { try { fn(); } catch (e) { console.error(e); } }
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
        if (want) { loadCollision(); loadStations(); }
        if (want && !engaged) engage();
        else if (!want && engaged) disengage();
        else if (engaged) { apply(); emit(); }
        else emit();
    }

    store.subscribe((state, prev, meta) => {
        if (state.scope) lastPose = state.scope;
        if (flight && state.scope !== prev.scope && !(meta && meta.internal)) cancelFlight();
        if (state.scope !== prev.scope) sync();
        if (state.station && state.station !== prev.station) {
            if (stationsState === 'ready' || stationsState === 'failed') Promise.resolve().then(resolvePending);     /* not inside this notification */
            else loadStations();
        }
    });
    if (store.get().station) loadStations();
    specimen.onChange(() => { if (selfMove) return; exposed = null; sync(); });          /* the specimen loading, or a layer change, may make the scope available */

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
        cancelFlight();
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* a release outside the canvas is then missed: the drag ends on the next pointerdown */ }
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
        cancelFlight();
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
        if (did) { e.preventDefault(); cancelFlight(); }
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
        get shaftWhy() { return shaftWhy ? { ...shaftWhy } : null; },
        get collision() { return !!ctAt; },
        get stateKey() { return stateKey; },
        /* the label under the tip in the volume the scope reads (the dissected one when a state is on) */
        get tipLabel() {
            const p = pose();
            const f = p && fulcra.get(p.side);
            const vol = stateVol || ctVol;
            if (!f || !vol) return null;
            const t = tipOf(f, p);
            const index = vol.labelAt(t[0], t[1], t[2]);
            const d = index ? vol.describe(index) : null;
            return { index, name: d ? d.name : null };
        },
        get byState() { return [...byState].map(([k, m]) => [k, [...m.keys()]]); },
        stationFor,
        get hud() { return { rows: hud.rows.map((r) => ({ ...r })), contactMm: hud.contactMm, limited: hud.limited, limitedBy: hud.limitedBy, clampMm }; },
        get cursor() { const c = store.get().cursor; return c ? c.slice() : null; },
        get exposeRuns() { return exposeRuns; },
        get flying() { return !!flight; },
        get stations() { return listStations(); },
        get stationsState() { return stationsState; },
        get inset() { return insetData ? { width: insetData.width, height: insetData.height, pixel: insetData.pixel, shaft: insetData.shaft.slice(), center: insetData.center } : null; },
        sampleAt: (ras) => (ctAt ? ctAt(ras) : null),
        get exposure() { return { distance: lastD, intensity: spot ? spot.intensity : null, ms: lastMs }; },
        lights: () => ({ spot: spot ? { on: spot.visible, intensity: spot.intensity, decay: spot.decay, angle: spot.angle } : null,
            hemi: stage.lights.hemi.intensity, head: stage.lights.head.intensity }),
        controlsEnabled: () => stage.controls.enabled,
    });

    return {
        hook, enter, leave, setPose, nudge, cycleLens, setShaft, flyTo, setStateVolume, stationFor,
        get flying() { return !!flight; },
        get stations() { return listStations(); },
        get shaft() { return shaft; },
        get shaftWhy() { return shaftWhy ? { ...shaftWhy } : null; },
        get hud() { return hook.hud; },
        LENSES, RANGES,
        get engaged() { return engaged; },
        get available() { return available(); },
        get pose() { return pose(); },
        get tip() { return hook.tip; },
        get ready() { return available(); },
        get lastPose() { return lastPose; },
        get inset() { return insetData; },
        onInset(fn) { insetSubs.add(fn); return () => insetSubs.delete(fn); },
        onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    };
}
