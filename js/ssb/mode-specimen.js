/* =============================================================
   mode-specimen.js — the Specimen stage: Explore mode on the reference
   specimen (docs/ssb.md 3, 5.3, 7).

   Mounts on the Specimen pill. It loads the model packs on first entry
   (geo-specimen.js: core first, the region packs after the first paint),
   installs them in the scene's specimen slot, and follows the store:

   - Frame: the packs are in RAS mm and sit under one rasToScene root, so the
     specimen is seen as the patient is: in an anterior view the viewer's
     left is the patient's RIGHT (scene +x). The default view is the
     anterior-oblique from the patient's right-front and above. The
     orientation widget (R/L, A/P, S/I) always says which way is which.
   - Layers: the bone envelope (solid / X-ray ghost / hidden; X-ray by
     default so the air spaces read through it), the air spaces by region,
     the landmarks. Depth (tier) filters labels only, never orientation
     geometry: every landmark marker is drawn, a label is drawn for the few
     whose tier the reader has reached.
   - Picking: a click raycasts, keeps every hit, and clicking the same spot
     again steps to the next one (dense anatomy is layered). The pick goes
     through the store (panel, tree and URL follow); a tree or search
     selection highlights the mesh (its other side dimmed) and flies to it
     (a cut under prefers-reduced-motion). An entry with no geometry leaves
     the camera alone and the panel says so (annotate()).
   - Cursor: a click on a surface moves the shared 3D cursor (store.cursor =
     the CT crosshair, docs/ssb.md 7.3), so the CT stage opens there; the
     cursor shows as a crosshair in the specimen.
   - Section: one axis-aligned clip plane (axial / coronal / sagittal), its
     position the cursor's coordinate on that axis, so the slider and the CT
     crosshair are one thing. With the bone solid the cut shows as a cut: a
     flat face in the cut-bone colour, drawn with the stencil buffer on the
     bone envelope (a closed surface whose cavities are the air spaces).

   Imports no three.js directly: THREE comes from the stage; geo-specimen.js
   is the importer. main.js loads this module with a dynamic import, so a
   failure to load three.js degrades to graph mode, never to a blank page.
   `hook` is the read-only test window (window.__ssb.specimen).
   ============================================================= */
import { createSpecimen, loadLandmarks, loadSweeps, loadCtBounds } from './geo-specimen.js?v=f9460974';
import { rasToScene, sceneToRas } from './frame.js?v=f554e767';
import { token } from './materials.js?v=b121b3b4';
import { PLANES } from './volume.js?v=22fefdc5';
import { CT_PLANES } from './state.js?v=a96d143a';
import { REGION_LABEL } from './graph.js?v=63a57e25';

export const PROVENANCE = 'Reference specimen · UW CT atlas · draft';

/* Camera views, as RAS directions from the specimen toward the camera. The
   default is the anterior-oblique from the patient's right-front and a little
   above. The superior view sits slightly behind the vertical so that the
   camera's +Y up (which OrbitControls fixes) puts anterior at the top. */
export const VIEWS = Object.freeze({
    oblique: Object.freeze({ label: '¾', title: 'Right three-quarter', dir: [0.62, 0.62, 0.45] }),
    anterior: Object.freeze({ label: 'Front', title: 'Anterior', dir: [0, 1, 0] }),
    right: Object.freeze({ label: 'Right', title: 'Patient right', dir: [1, 0, 0] }),
    left: Object.freeze({ label: 'Left', title: 'Patient left', dir: [-1, 0, 0] }),
    superior: Object.freeze({ label: 'Top', title: 'Superior', dir: [0, -0.06, 1] }),
});
export const VIEW_DEFAULT = 'oblique';
export const BONE_MODES = Object.freeze(['solid', 'xray', 'hidden']);

const FLIGHT_MS = 450;
const DRAG_PX = 5;            /* a press that moves less than this is a click */
const AGAIN_PX = 3;           /* a second click this close to the last steps deeper */
const LABELS_MAX = 8;         /* landmark labels at once */
const MARKER_MM = 1.15;
const CURSOR_ARM = 5;         /* mm */
const SECTION_EPS = 0.05;     /* mm: keeps what lies exactly on the plane (the cursor) */
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

/* opts: { stage, store, graph, dom: { note, msg, labels }, orient?, panel? }
     stage   scene.js's handle      store   the one store      graph  the knowledge graph
     note    the provenance badge   msg     the stage's message
     labels  the overlay for DOM labels
     orient  { update(quaternion), show(on) } — the R/L, A/P, S/I widget (ui-specimen.js)
     panel   { refresh() } — the info panel's geometry note, redone when it may have changed */
export function mountSpecimen({ stage, store, graph, dom, orient = null, panel = null }) {
    const { THREE } = stage;
    const reduce = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const subs = new Set();

    let specimen = null;
    let status = 'idle';            /* idle | loading | ready | partial | error | absent */
    let problem = '';
    let installed = false;
    let landmarks = new Map();      /* "<id>.<side>" -> { id, side, ras } */
    let ctBounds = null;
    let primaryKey = null;          /* the node of the selected id that is drawn at full strength */
    let focusKey = null;            /* the node a click picked */
    let view = null;
    let saved = null;               /* the camera when the stage was left */
    let pendingFrame = null;        /* a selection from the URL whose pack had not arrived */
    let renders = 0;
    let stopFrames = null;
    let wasActive = false;
    let started = false;
    let framed = false;             /* the default view has been applied */
    const layers = { bone: 'xray', hidden: new Set(), landmarks: false, sweeps: false, mucosa: false, nose: true };
    let inside = false;             /* the camera is within the air spaces' box: the mucosa is then drawn as the lining seen from within */
    let liningAsked = false;        /* the deferred lining pack has been requested (ST1c): the first look from within asks once */
    let insideForced = false;       /* the endoscope sets this: its tip may sit outside the box (the fulcrum is in front of the masked cavity), but it always looks from within */
    let airBox = null;              /* the union box of the air nodes, cached until a pack arrives */
    const section = { axis: null, flip: false };
    let muNote = '';                /* the player's one line about the mucosal state (loading, could not load), shown by the layer controls */
    let dissect = null;             /* the procedure player's state (P2): { key, hides: Set of base node keys } while a dissected state is shown */
    let emphasis = { see: new Set(), hazard: new Set() };     /* graph ids the player marks: a step's `see` structures, and the `at` structures of its `risk` hazards (hatched) */

    const active = () => { const s = store.get(); return !s.lab && !s.ct; };
    const emit = () => { for (const fn of [...subs]) { try { fn(); } catch (e) { console.error(e); } } };

    /* ---------------- scene furniture: markers, cursor ---------------- */

    const markerRoot = new THREE.Group();     /* RAS mm, under the specimen root */
    markerRoot.name = 'landmarks';
    const markers = new Map();                /* key -> { object, lm } */
    const markerGeometry = new THREE.SphereGeometry(MARKER_MM, 14, 10);
    const markerFront = new THREE.MeshBasicMaterial();
    const markerBehind = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.3, depthFunc: THREE.GreaterDepth, depthWrite: false });

    const sweepRoot = new THREE.Group();      /* vessels and nerves as tubes, RAS mm */
    sweepRoot.name = 'sweeps';
    const sweepList = new Map();              /* key -> { object, sw } */
    const sweepFront = new THREE.MeshBasicMaterial();
    const sweepArtery = new THREE.MeshBasicMaterial();
    const sweepMaterials = [sweepFront, sweepArtery];
    let sweeps = new Map();

    const cursorMarker = new THREE.Group();   /* a crosshair that shows through everything */
    cursorMarker.name = 'cursor';
    cursorMarker.visible = false;
    cursorMarker.renderOrder = 30;
    const cursorLineMaterial = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
    const cursorDotMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
    {
        const g = CURSOR_ARM;
        const gap = 1.6;
        const pts = [];
        for (let n = 0; n < 3; n++) {
            for (const s of [-1, 1]) {
                const a = [0, 0, 0];
                const b = [0, 0, 0];
                a[n] = s * gap;
                b[n] = s * g;
                pts.push(...a, ...b);
            }
        }
        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        const lines = new THREE.LineSegments(lg, cursorLineMaterial);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), cursorDotMaterial);
        for (const o of [lines, dot]) o.renderOrder = 30;
        cursorMarker.add(lines, dot);
    }

    function colours() {
        const landmark = token('--ssb-landmark', '#2445B0');
        markerFront.color.set(landmark);
        markerBehind.color.set(landmark);
        sweepFront.color.set(token('--ssb-sweep-nerve', '#444444'));
        sweepArtery.color.set(token('--ssb-sweep-artery', '#C0392B'));
        const cross = token('--ssb-ct-cross', '#FFB000');
        cursorLineMaterial.color.set(cross);
        cursorDotMaterial.color.set(cross);
    }

    function buildMarkers() {
        for (const [key, lm] of landmarks) {
            if (markers.has(key)) continue;
            const group = new THREE.Group();
            group.name = key;
            group.userData = { id: lm.id, side: lm.side, key, marker: true };
            group.position.set(...lm.ras);
            const front = new THREE.Mesh(markerGeometry, markerFront);
            const behind = new THREE.Mesh(markerGeometry, markerBehind);
            behind.renderOrder = 20;
            group.add(front, behind);
            group.visible = false;
            behind.visible = false;       /* the see-through trace of a hidden marker is for the selection only */
            markerRoot.add(group);
            markers.set(key, { object: group, behind, lm });
        }
    }

    function buildSweeps() {
        for (const [key, sw] of sweeps) {
            if (sweepList.has(key)) continue;
            const curve = new THREE.CatmullRomCurve3(sw.pts.map((p) => new THREE.Vector3(...p)));
            const segs = Math.min(200, sw.pts.length * 4);
            const radius = Math.max(0.2, sw.radius.reduce((a, b) => a + b, 0) / sw.radius.length);
            const geometry = new THREE.TubeGeometry(curve, segs, radius, 8, false);
            const artery = /artery/.test(sw.id);
            const mesh = new THREE.Mesh(geometry, artery ? sweepArtery : sweepFront);
            mesh.name = key;
            mesh.userData = { id: sw.id, side: sw.side, key, sweep: true };
            mesh.visible = false;
            sweepRoot.add(mesh);
            sweepList.set(key, { object: mesh, sw });
        }
    }

    /* ---------------- looks, layers, selection ---------------- */

    const nodes = () => (specimen ? specimen.nodes : new Map());
    /* the lining on show: the base's, or the dissected state's own when it carries one */
    const stateLined = () => !!dissect && !!specimen && [...specimen.nodes.values()].some((m) => m.userData.lining && m.userData.state === dissect.key);
    const hasLining = () => !!specimen && [...specimen.nodes.values()].some((m) => m.userData.lining && !m.userData.state);
    const regionOf = (mesh) => mesh.userData.region || 'other';

    const centreCache = new Map();
    /* A node's centre in RAS mm (its bounding box's). */
    function centreOf(key) {
        if (centreCache.has(key)) return centreCache.get(key);
        const mesh = nodes().get(key);
        if (!mesh) return null;
        const b = specimen.boundsOf([key]);
        const c = b ? [0, 1, 2].map((n) => (b.min[n] + b.max[n]) / 2) : null;
        centreCache.set(key, c);
        return c;
    }

    /* The side of the selected id that is drawn at full strength: the one a
       click picked, else the one nearest the camera. */
    function choosePrimary() {
        primaryKey = null;
        const sel = store.get().selection;
        if (!specimen || !sel) return;
        const mine = specimen.byId(sel).map((m) => m.userData.key);
        if (!mine.length) return;
        if (focusKey && mine.includes(focusKey)) { primaryKey = focusKey; return; }
        const cam = new THREE.Vector3().copy(stage.camera.position);
        let best = Infinity;
        for (const key of mine) {
            const c = centreOf(key);
            if (!c) continue;
            const d = cam.distanceTo(new THREE.Vector3(...rasToScene(c)));
            if (d < best) { best = d; primaryKey = key; }
        }
    }

    /* Materials, visibility and draw order of every node from the layers and
       the selection. A selected structure is drawn firm and on top of what
       hides it (the selection must always be seen); its other side is a
       dimmer partner. */
    function paint() {
        if (!specimen) return;
        const sel = store.get().selection;
        /* from within, the open lining (ST1b: one surface, its openings open) is drawn in place of the per-compartment shells */
        const within = layers.mucosa && (inside || insideForced);
        const ownLining = stateLined();
        const openLining = within && (ownLining || hasLining());
        const replaced = new Set();     /* base walls a dissected state replaces by their remnants */
        if (dissect) for (const m of specimen.nodes.values()) if (m.userData.state === dissect.key && m.userData.remnant) replaced.add(`${m.userData.id}.${m.userData.side}`);
        /* the lining is fetched the first time the mucosa is seen from within; until it arrives the air shells are drawn as before */
        if (within && !liningAsked) {
            liningAsked = true;
            specimen.loadLining().then(() => paint());
        }
        for (const [key, mesh] of specimen.nodes) {
            const u = mesh.userData;
            const isSel = !!sel && u.id === sel;
            const primary = isSel && key === primaryKey;
            const partner = isSel && !primary;
            let look = u.look;
            if (u.state && !(dissect && dissect.key === u.state)) { mesh.visible = false; continue; }          /* another state's pack, not on show */
            if (!u.state && dissect && (dissect.hides.has(key) || replaced.has(`${u.id}.${u.side}`))) { mesh.visible = false; continue; }
            if (u.group === 'lining') {
                u.drawn = look.kind;
                mesh.material = stage.materialsFor(look, { selected: false, partner: false });
                mesh.renderOrder = 0;
                mesh.visible = openLining && (u.state ? true : !ownLining) && !layers.hidden.has(regionOf(mesh));
                continue;
            }
            const seen = emphasis.see.has(u.id);
            const hazardous = emphasis.hazard.has(u.id);
            if (u.group === 'bone') {
                if (layers.bone === 'xray') look = { ...look, xray: true };
            } else if (layers.mucosa && u.group === 'air') {
                /* the lining: opaque from within, a translucent shell from outside (as X-ray ghosts the bone) */
                const lining = u.liningKind || 'mucosa';      /* the vestibule is lined with skin (ST6) */
                look = inside || insideForced ? { kind: lining, doubleSide: true } : { kind: lining, translucent: true, doubleSide: true, opacity: 0.4 };
            }
            if (u.group !== 'bone' && isSel) {
                look = { ...look, space: false, translucent: true, onTop: true, ...(partner ? { opacity: 0.3 } : {}) };
            }
            if ((seen || hazardous) && !isSel) look = { ...look, xray: false, space: false, translucent: true, onTop: true, opacity: 0.55 };
            u.drawn = look.kind;
            mesh.material = stage.materialsFor(look, { selected: primary, partner, hazard: hazardous });
            u.hazard = hazardous;
            u.emphasis = hazardous ? 'hazard' : seen ? 'see' : '';
            mesh.renderOrder = isSel || seen || hazardous ? 5 : 0;
            mesh.visible = isSel || seen || hazardous || (u.group === 'bone' ? layers.bone !== 'hidden' : u.group === 'nose' ? layers.nose : !(openLining && u.group === 'air') && !layers.hidden.has(regionOf(mesh)));
        }
        for (const [, m] of markers) {
            const mine = !!sel && m.lm.id === sel;
            m.object.visible = layers.landmarks || mine;
            m.behind.visible = mine;
        }
        for (const [, m] of sweepList) m.object.visible = layers.sweeps || (!!sel && m.sw.id === sel);
        stage.requestRender();
    }

    /* ---------------- camera ---------------- */

    function sphereOf(keys = null, grow = 1) {
        const b = specimen ? specimen.boundsOf(keys) : null;
        if (!b) return null;
        const center = [0, 1, 2].map((n) => (b.min[n] + b.max[n]) / 2);
        const radius = Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) / 2;
        return { center, radius: radius * grow };
    }

    const flightMs = () => (reduce.matches ? 0 : FLIGHT_MS);

    function setView(key, ms = flightMs()) {
        if (!own(VIEWS, key)) return false;
        const s = sphereOf(null, 0.8);
        if (!s) return false;
        view = key;
        framed = true;
        stage.look(s, { dir: VIEWS[key].dir, ms });
        emit();
        return true;
    }

    /* Fly to the selected id's geometry, keeping the way the camera looks. An
       entry with no geometry leaves the camera alone. */
    function frameSelection(ms = flightMs()) {
        const sel = store.get().selection;
        if (!specimen || !sel) return false;
        const keys = specimen.byId(sel).map((m) => m.userData.key);
        const s = keys.length ? sphereOf(keys, 1.25) : null;
        if (!s) return false;
        s.radius = Math.max(s.radius, 9);
        stage.look(s, { ms });
        return true;
    }

    /* "Reset", while the specimen is the stage that owns the camera. */
    function home() {
        if (saved) stage.setPose(saved);
        else setView(VIEW_DEFAULT, 0);
    }

    /* ---------------- the cursor and the section ---------------- */

    const cursor = () => store.get().cursor;

    function syncCursor() {
        const c = cursor();
        cursorMarker.visible = !!c;
        if (c) cursorMarker.position.set(...c);
        stage.requestRender();
    }

    /* Is a RAS point on the cut-away side of the section? (Its label goes with it.) */
    function clipped(ras) {
        if (!section.axis) return false;
        const n = PLANES[section.axis].normal;
        const at = sectionAt();
        return section.flip ? ras[n] < at - SECTION_EPS : ras[n] > at + SECTION_EPS;
    }

    /* The section's range on `axis` in mm: the CT volume's, else the specimen's. */
    function sectionRange(axis) {
        const n = PLANES[axis].normal;
        const b = ctBounds || (specimen && specimen.boundsOf());
        return b ? [b.min[n], b.max[n]] : [-100, 100];
    }

    function sectionAt() {
        if (!section.axis) return null;
        const n = PLANES[section.axis].normal;
        const c = cursor();
        if (c) return c[n];
        const [lo, hi] = sectionRange(section.axis);
        return (lo + hi) / 2;
    }

    /* Keep the smaller coordinate (<= at), or the larger one when flipped: the
       reader looks at the cut face from the side that was taken away. */
    function applySection() {
        if (!installed || !active() || !section.axis) { stage.setClip([]); syncCap(); return; }
        const n = PLANES[section.axis].normal;
        const at = sectionAt();
        const dir = [0, 0, 0];
        dir[n] = section.flip ? 1 : -1;
        const normal = new THREE.Vector3(...rasToScene(dir));
        stage.setClip([new THREE.Plane(normal, section.flip ? -at + SECTION_EPS : at + SECTION_EPS)]);
        syncCap();
    }

    /* ---- the section's solid cap (stencil) ----
       Two passes over the envelope count its faces behind the plane (back faces
       +1, front faces -1; fragments the clip removed never reach the stencil),
       so a pixel is left non-zero exactly where the plane cuts bone; a third
       pass draws the plane's face where the stencil is non-zero, in the cut-bone
       material. None of it writes colour or depth until that last pass, and the
       three objects have no raycast, so a click never meets them. */
    const Z = new THREE.Vector3(0, 0, 1);
    const cap = { back: null, front: null, plane: null };

    function buildCap() {
        if (cap.plane) return true;
        const env = specimen ? [...specimen.nodes.values()].find((m) => m.userData.envelope) : null;
        if (!env) return false;
        const counting = (side, op) => new THREE.MeshBasicMaterial({
            side, colorWrite: false, depthWrite: false, depthTest: false, stencilWrite: true,
            stencilFunc: THREE.AlwaysStencilFunc, stencilFail: op, stencilZFail: op, stencilZPass: op,
        });
        cap.back = new THREE.Mesh(env.geometry, counting(THREE.BackSide, THREE.IncrementWrapStencilOp));
        cap.front = new THREE.Mesh(env.geometry, counting(THREE.FrontSide, THREE.DecrementWrapStencilOp));
        const face = stage.materialsFor({ kind: 'bone-cut', doubleSide: true });    /* its own cache entry: the lab's slabs use another */
        face.stencilWrite = true;
        face.stencilRef = 0;
        face.stencilFunc = THREE.NotEqualStencilFunc;
        face.stencilFail = face.stencilZFail = face.stencilZPass = THREE.ReplaceStencilOp;
        cap.plane = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), face);
        [cap.back, cap.front, cap.plane].forEach((m, i) => { m.renderOrder = 10 + i; m.raycast = () => {}; m.visible = false; });
        env.add(cap.back, cap.front);          /* the envelope's own transform */
        specimen.root.add(cap.plane);          /* RAS mm, like everything under the root */
        return true;
    }

    function syncCap() {
        const want = !!(installed && active() && section.axis && layers.bone === 'solid' && buildCap());
        if (!cap.plane) return;
        for (const m of [cap.back, cap.front, cap.plane]) m.visible = want;
        if (!want) { stage.requestRender(); return; }
        const n = PLANES[section.axis].normal;
        const sign = section.flip ? -1 : 1;                 /* the face looks toward the side that was cut away */
        const toward = [0, 0, 0];
        toward[n] = sign;
        cap.plane.quaternion.setFromUnitVectors(Z, new THREE.Vector3(...toward));
        const b = specimen.boundsOf();
        const at = [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2);
        at[n] = sectionAt() + sign * (SECTION_EPS - 0.01);   /* a hair inside what is kept, so the clip does not eat it */
        cap.plane.position.set(...at);
        stage.requestRender();
    }

    function setSection(axis) {
        const next = axis !== null && CT_PLANES.includes(axis) ? axis : null;
        if (next === section.axis) return false;
        section.axis = next;
        if (next && !cursor()) {
            /* the section needs a position: the cursor starts at the middle of the range */
            const b = ctBounds || (specimen && specimen.boundsOf());
            if (b) store.setCursor([0, 1, 2].map((n) => (b.min[n] + b.max[n]) / 2), { source: 'slider' });
        }
        applySection();
        emit();
        return true;
    }

    /* The slider: moving the section moves the shared cursor along that axis. */
    function setSectionAt(mm) {
        if (!section.axis || !Number.isFinite(mm)) return false;
        const n = PLANES[section.axis].normal;
        const c = (cursor() || [0, 0, 0]).slice();
        if (!cursor()) {
            const b = ctBounds || (specimen && specimen.boundsOf());
            if (b) for (let k = 0; k < 3; k++) c[k] = (b.min[k] + b.max[k]) / 2;
        }
        c[n] = mm;
        return store.setCursor(c, { source: 'slider' });
    }

    function flipSection() {
        section.flip = !section.flip;
        applySection();
        emit();
    }

    /* ---------------- layers ---------------- */

    function setBone(mode) {
        if (!BONE_MODES.includes(mode) || mode === layers.bone) return false;
        layers.bone = mode;
        paint();
        syncCap();
        emit();
        return true;
    }

    function setRegion(region, on) {
        const had = !layers.hidden.has(region);
        if (!!on === had) return false;
        if (on) layers.hidden.delete(region); else layers.hidden.add(region);
        paint();
        emit();
        return true;
    }

    /* opts.inside: true makes the lining opaque whatever the camera's position (the scope), false releases it. */
    function setMucosa(on, opts = {}) {
        const force = opts.inside === undefined ? insideForced : !!opts.inside;
        if (!!on === layers.mucosa && force === insideForced) return false;
        layers.mucosa = !!on;
        insideForced = force;
        paint();
        emit();
        return true;
    }

    /* The procedure player's dissected state (docs/ssb.md 5.8), or null for the intact specimen: `hides` are base node keys
       the state removes entirely; its pack's remnants replace the walls they cut partly and its lining replaces the base
       lining. The pack itself is geo-specimen's (loadState); this only says which one is on show. */
    function setState(next) {
        const key = next && typeof next.key === 'string' ? next.key : null;
        const hides = new Set(next && Array.isArray(next.hides) ? next.hides.filter((k) => typeof k === 'string') : []);
        if (!key && !dissect) return false;
        if (dissect && key === dissect.key && hides.size === dissect.hides.size && [...hides].every((k) => dissect.hides.has(k))) { paint(); return false; }
        dissect = key ? { key, hides } : null;
        paint();
        emit();
        return true;
    }

    /* The mucosal state's status line (mode-procedure.js): '' clears it. */
    function setMuNote(text) {
        const next = typeof text === 'string' ? text.slice(0, 160) : '';
        if (next === muNote) return false;
        muNote = next;
        emit();
        return true;
    }

    /* A state's pack (geo-specimen loadState / unloadState): repaint when it arrives or goes. `file` is the pack the state
       index names (ssb/models/lining-<key>.glb.gz), for a state packs.json does not list. */
    function loadState(key, file = '') {
        return specimen ? specimen.loadState(key, file).then((added) => { paint(); emit(); return added; }) : Promise.resolve([]);
    }
    function unloadState(key) {
        const gone = specimen ? specimen.unloadState(key) : false;
        if (gone) paint();
        return gone;
    }

    /* Mark structures by graph id: `see` (a step's structures, drawn through what hides them) and `hazard` (the `at` of its
       risk hazards, drawn the same and hatched). Empty lists clear. */
    function setEmphasis({ see = [], hazard = [] } = {}) {
        const next = { see: new Set(see.filter((i) => typeof i === 'string')), hazard: new Set(hazard.filter((i) => typeof i === 'string')) };
        const same = (a, b) => a.size === b.size && [...a].every((i) => b.has(i));
        if (same(next.see, emphasis.see) && same(next.hazard, emphasis.hazard)) return false;
        emphasis = next;
        paint();
        emit();
        return true;
    }

    /* Is the camera inside the box of the air spaces? Re-paints when it crosses. */
    function checkInside() {
        if (!specimen || !layers.mucosa) return;
        if (!airBox) {
            const keys = [...specimen.nodes].filter(([, m]) => m.userData.group === 'air').map(([k]) => k);
            airBox = keys.length ? specimen.boundsOf(keys) : null;
        }
        const b = airBox;
        const c = sceneToRas(stage.camera.position.toArray());
        const now = !!b && [0, 1, 2].every((n) => c[n] >= b.min[n] && c[n] <= b.max[n]);
        if (now !== inside) { inside = now; paint(); }
    }

    /* The external nose (ST6): the skin of the specimen's own nose, drawn by default. */
    function setNose(on) {
        if (!!on === layers.nose) return false;
        layers.nose = !!on;
        paint();
        emit();
        return true;
    }

    function setLandmarks(on) {
        if (!!on === layers.landmarks) return false;
        layers.landmarks = !!on;
        paint();
        emit();
        return true;
    }

    function setSweeps(on) {
        if (!!on === layers.sweeps) return false;
        layers.sweeps = !!on;
        paint();
        emit();
        return true;
    }

    /* The regions of the air spaces and tissue on screen, with what they hold. */
    function regions() {
        const out = new Map();
        for (const mesh of nodes().values()) {
            if (mesh.userData.group === 'bone' || mesh.userData.group === 'nose' || mesh.userData.lining) continue;
            const r = regionOf(mesh);
            if (!out.has(r)) out.set(r, { region: r, label: own(REGION_LABEL, r) ? REGION_LABEL[r] : r, count: 0, on: !layers.hidden.has(r) });
            out.get(r).count += 1;
        }
        return [...out.values()].sort((a, b) => a.label.localeCompare(b.label));
    }

    /* ---------------- loading ---------------- */

    function showStatus() {
        const failed = specimen ? [...specimen.packs.values()].filter((p) => p.state === 'failed') : [];
        let text = '';
        if (status === 'loading' && !installed) text = 'Loading the reference specimen…';
        else if (status === 'absent') text = 'The reference specimen is not in this build yet (ssb/models/packs.json was not found). The structure list, search, panels and CT still work.';
        else if (status === 'error') text = `The reference specimen could not be loaded. ${problem} The structure list, search, panels and CT still work.`;
        dom.msg.hidden = !text || !active();
        dom.msg.textContent = text;
        const partial = status === 'partial' && failed.length > 0;
        dom.note.textContent = partial ? `${PROVENANCE} · ${failed.length} of ${specimen.packs.size} packs could not be loaded` : PROVENANCE;
        dom.note.title = partial ? failed.map((p) => p.error).join(' ') : '';
    }

    function install() {
        if (installed || !specimen) return;
        specimen.root.add(markerRoot, sweepRoot, cursorMarker);
        buildSweeps();
        installed = true;
        stage.setSpecimen(specimen.root);
        stage.setHome(home);
        stage.showSpecimen(active());
        if (orient && active()) orient.show(true);
        specimen.root.updateMatrixWorld(true);
        if (active()) setView(VIEW_DEFAULT, 0);
        syncCursor();
    }

    function onPack(pack) {
        airBox = null;
        if (pack.state === 'loaded' && !installed) install();
        if (installed) {
            buildMarkers();
            choosePrimary();
            paint();
            if (pendingFrame && store.get().selection === pendingFrame && specimen.byId(pendingFrame).length && active()) {
                pendingFrame = null;
                frameSelection(0);
            }
            applySection();
        }
        showStatus();
        if (panel) panel.refresh();
        emit();
    }

    async function start() {
        if (started) return;
        started = true;
        status = 'loading';
        specimen = createSpecimen({ graph });
        pendingFrame = store.get().selection;
        showStatus();
        /* the CT header and the landmarks are small; neither blocks the packs */
        loadCtBounds().then((b) => {
            if (!b) return;
            ctBounds = b;
            store.setCtBounds(b);
            applySection();
            emit();
        });
        loadLandmarks({ graph }).then((l) => {
            landmarks = l;
            if (installed) { buildMarkers(); paint(); }
            emit();
        });
        loadSweeps({ graph }).then((w) => {
            sweeps = w;
            if (installed) { buildSweeps(); paint(); }
            emit();
        });
        const paintTwice = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        let result = 'error';
        try {
            result = await specimen.load({ onPack, idle: paintTwice });
        } catch (e) {
            console.error(e);
            problem = 'An unexpected error stopped the load.';
        }
        status = result;
        if (!problem && specimen.problems.length) problem = specimen.problems[0];
        if (status === 'error' && specimen.problems.length) problem = specimen.problems.join(' ');
        pendingFrame = null;
        showStatus();
        if (panel) panel.refresh();
        emit();
    }

    /* ---------------- entering and leaving the stage ---------------- */

    function enter() {
        wasActive = true;
        if (!started) start();
        if (installed) {
            stage.showSpecimen(true);
            if (saved) stage.setPose(saved);
            else if (!framed) setView(VIEW_DEFAULT, 0);
            applySection();
        }
        if (!stopFrames) stopFrames = stage.onFrame(onFrame);
        if (orient) orient.show(installed);
        showStatus();
        choosePrimary();
        paint();
        syncCursor();
        if (panel) panel.refresh();
        emit();
    }

    function leave() {
        wasActive = false;
        if (installed) {
            saved = stage.pose();
            stage.showSpecimen(false);
        }
        stage.setClip([]);
        if (stopFrames) { stopFrames(); stopFrames = null; }
        if (orient) orient.show(false);
        clearLabels();
        dom.msg.hidden = true;
        if (panel) panel.refresh();
        emit();
    }

    /* ---------------- picking ---------------- */

    /* Everything under a client point, nearest first (a landmark marker, which
       is small, ahead of what lies behind it): [{ key, id, point (RAS), marker, object }]. */
    function collectHits(x, y) {
        if (!installed) return [];
        const hits = stage.pickHits(x, y, specimen.root);
        const out = hits.map((h) => ({
            key: h.part.userData.lining ? `${h.part.userData.id}.${h.part.userData.side}` : h.part.userData.key, id: h.part.userData.id, marker: !!h.part.userData.marker,
            point: sceneToRas(h.point.toArray()), distance: h.distance,
        }));
        /* what the section cut away is not there to be picked */
        return out.filter((h) => !clipped(h.point)).sort((a, b) => (b.marker - a.marker) || (a.distance - b.distance));
    }

    const canvas = stage.canvas;
    let down = null;
    let last = null;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('click', (e) => {
        if (!active() || !installed || !down) return;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_PX) return;     /* that was an orbit drag */
        const hits = collectHits(e.clientX, e.clientY);
        if (!hits.length) return;
        const again = last && Math.hypot(e.clientX - last.x, e.clientY - last.y) <= AGAIN_PX;
        const index = again ? (last.index + 1) % hits.length : 0;
        last = { x: e.clientX, y: e.clientY, index };
        const hit = hits[index];
        focusKey = hit.marker ? null : hit.key;
        const changed = store.get().selection !== hit.id;
        store.select(hit.id, { source: 'scene' });
        if (!changed) { choosePrimary(); paint(); }
        /* the click's surface point is the 3D cursor, and so the CT crosshair */
        store.setCursor(hit.point, { source: 'cursor' });
    });

    /* ---------------- labels: DOM overlay, few at a time ---------------- */

    const labelEls = [];
    let shownLabels = [];

    function labelEl(n) {
        while (labelEls.length <= n) {
            const node = el('span', 'ssb-part-label ssb-spec-label');
            node.hidden = true;
            dom.labels.append(node);
            labelEls.push(node);
        }
        return labelEls[n];
    }

    function clearLabels() {
        for (const node of labelEls) node.hidden = true;
        shownLabels = [];
    }

    const probe = new THREE.Vector3();
    /* Place a label at a RAS point; returns its box in client px, or null when
       the point is behind the camera or off the canvas. */
    function place(node, text, ras, rect, lift) {
        probe.set(...rasToScene(ras));
        const c = stage.toClient(probe);
        const cr = canvas.getBoundingClientRect();
        if (!c.front || c.x < cr.left || c.x > cr.right || c.y < cr.top || c.y > cr.bottom) return null;
        if (node.textContent !== text) node.textContent = text;
        node.hidden = false;
        node.style.transform = `translate(${(c.x - rect.left).toFixed(1)}px, ${(c.y - rect.top).toFixed(1)}px) translate(-50%, calc(-100% - ${lift}px))`;
        const w = node.offsetWidth;
        const h = node.offsetHeight;
        return { x: c.x - w / 2, y: c.y - h - lift, w, h, text, client: { x: c.x, y: c.y } };
    }

    const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

    /* The selection's label always; landmark labels (when the layer is on) for
       the markers whose tier the reader has reached, nearest the camera first,
       skipping any that would sit on another. */
    const sideName = (lm, how) => graph.nameOf(lm.id) + (lm.side === 'M' ? '' : how === 'long' ? ` (${lm.side === 'R' ? 'right' : 'left'})` : ` (${lm.side})`);

    function placeLabels() {
        if (!installed) { clearLabels(); return; }
        const state = store.get();
        const rect = dom.labels.getBoundingClientRect();
        const done = [];
        let n = 0;
        const accept = (text, ras, lift, id) => {
            const node = labelEl(n);
            if (clipped(ras)) { node.hidden = true; return; }
            const box = n < LABELS_MAX ? place(node, text, ras, rect, lift) : null;
            if (box && !done.some((d) => overlap(d, box))) { box.id = id; done.push(box); n += 1; } else node.hidden = true;
        };
        const sel = state.selection;
        if (sel) {
            const mine = primaryKey ? centreOf(primaryKey) : null;
            if (mine) accept(graph.nameOf(sel), mine, 8, sel);
            else for (const m of markers.values()) if (m.lm.id === sel) accept(sideName(m.lm, 'long'), m.lm.ras, 8, sel);
        }
        if (layers.landmarks) {
            const cam = stage.camera.position;
            const cands = [...markers.values()]
                .filter((m) => m.lm.id !== sel && graph.tierOf(m.lm.id) <= state.tier)
                .map((m) => ({ m, d: cam.distanceTo(probe.set(...rasToScene(m.lm.ras))), t: graph.tierOf(m.lm.id) }))
                .sort((a, b) => a.t - b.t || a.d - b.d);
            for (const { m } of cands) {
                if (n >= LABELS_MAX) break;
                accept(sideName(m.lm, 'short'), m.lm.ras, 6, m.lm.id);
            }
        }
        for (let i = n; i < labelEls.length; i++) labelEls[i].hidden = true;
        shownLabels = done.map((b) => ({ text: b.text, id: b.id, x: Math.round(b.client.x), y: Math.round(b.client.y) }));
    }

    function onFrame() {
        renders += 1;
        stage.camera.updateMatrixWorld();
        if (orient) orient.update(stage.camera.quaternion);
        checkInside();
        placeLabels();
    }

    /* ---------------- follow the store ---------------- */

    store.subscribe((state, prev, meta) => {
        const now = !state.lab && !state.ct;
        if (now !== wasActive) { if (now) enter(); else leave(); }
        if (state.selection !== prev.selection) {
            if (meta.source !== 'scene') focusKey = null;
            choosePrimary();
            paint();
            if (now && meta.source !== 'scene' && !state.scope) frameSelection();      /* the scope owns the camera */
            emit();
        }
        if (state.cursor !== prev.cursor) {
            syncCursor();
            if (section.axis) applySection();
            emit();
        }
        if (state.tier !== prev.tier && now) stage.requestRender();
    });
    stage.onTheme(() => { colours(); stage.requestRender(); });
    colours();
    /* Everything this stage made on the GPU side, given back (the page going away, or a caller that is done). */
    function dispose() {
        for (const m of sweepList.values()) m.object.geometry.dispose();
        if (cap.plane) { cap.back.material.dispose(); cap.front.material.dispose(); cap.plane.geometry.dispose(); }
        for (const o of [markerGeometry, markerFront, markerBehind, ...sweepMaterials, cursorLineMaterial, cursorDotMaterial]) o.dispose();
        if (specimen) specimen.dispose();
    }
    window.addEventListener('pagehide', dispose);

    if (active()) enter(); else { wasActive = false; showStatus(); }

    /* ---------------- the panel's note ---------------- */

    /* A line for the info panel when the selected entry has no geometry in the
       specimen (ui-panel.js calls this for every entry it renders); null when
       there is nothing to say. */
    function annotate(id) {
        if (!active() || !installed || !specimen || graph.typeOf(id) === 'sources') return null;
        if (specimen.byId(id).length) return null;
        const pending = [...specimen.packs.values()].some((p) => p.state === 'pending' || p.state === 'loading');
        const marked = [...landmarks.values()].some((l) => l.id === id);
        const text = pending ? 'The reference specimen is still loading; this entry has no geometry so far.'
            : marked ? 'The reference specimen has no surface for this entry; it is shown as a point marker only.'
                : 'The reference specimen has no geometry for this entry.';
        const p = el('p', 'ssb-geo-note', text);
        p.setAttribute('role', 'note');
        p.dataset.geo = 'none';
        return p;
    }

    /* ---------------- the test window ---------------- */

    const rasBox = (key) => specimen.boundsOf([key]);
    const hook = Object.freeze({
        get status() { return status; },
        get problem() { return problem; },
        get problems() { return specimen ? specimen.problems.slice() : []; },
        get active() { return active(); },
        get installed() { return installed; },
        get renders() { return renders; },
        get bone() { return layers.bone; },
        get hiddenRegions() { return [...layers.hidden]; },
        get landmarksOn() { return layers.landmarks; },
        get sweepsOn() { return layers.sweeps; },
        get mucosaOn() { return layers.mucosa; },
        get noseOn() { return layers.nose; },
        get mucosaInside() { return inside; },
        get stateKey() { return dissect ? dissect.key : null; },
        get emphasis() { return { see: [...emphasis.see], hazard: [...emphasis.hazard] }; },
        get sweeps() { return [...sweepList].filter(([, m]) => m.object.visible).map(([key]) => key); },
        get section() { return { axis: section.axis, flip: section.flip, at: sectionAt() }; },
        get cap() { return { shown: !!cap.plane && cap.plane.visible, plane: cap.plane ? cap.plane.position.toArray() : null }; },
        get view() { return view; },
        get ctBounds() { return ctBounds ? { min: ctBounds.min.slice(), max: ctBounds.max.slice() } : null; },
        get cursor() { return cursor(); },
        get cursorMarker() { return cursorMarker.visible ? cursorMarker.position.toArray() : null; },
        get primary() { return primaryKey; },
        get labels() { return shownLabels.slice(); },
        get triangles() { return specimen ? specimen.triangles : 0; },
        get packs() {
            return specimen ? Object.fromEntries([...specimen.packs].map(([k, p]) => [k, { state: p.state, nodes: p.nodes.slice(), expected: p.expected.slice(), error: p.error }])) : {};
        },
        get landmarks() { return [...landmarks].map(([key, l]) => ({ key, id: l.id, side: l.side, ras: l.ras.slice() })); },
        get markers() { return [...markers].filter(([, m]) => m.object.visible).map(([key]) => key); },
        info: () => stage.info(),
        /* every node: key, id, side, pack, layer group, region, visible, RAS box, triangles */
        nodes: () => (specimen ? [...specimen.nodes].map(([key, m]) => ({
            key, id: m.userData.id, side: m.userData.side, pack: m.userData.pack, group: m.userData.group, liningKind: m.userData.liningKind, region: m.userData.region,
            visible: m.visible, look: m.userData.look, drawn: m.userData.drawn || m.userData.look.kind, triangles: m.userData.triangles, box: rasBox(key),
            material: m.material.type, transparent: !!m.material.transparent, depthWrite: m.material.depthWrite,
            lining: !!m.userData.lining, state: m.userData.state || '', remnant: !!m.userData.remnant,
            hazard: !!m.userData.hazard, emphasis: m.userData.emphasis || '',
            highlight: !m.userData.lining && store.get().selection === m.userData.id ? (key === primaryKey ? 'primary' : 'partner') : null,
            emissive: m.material.emissiveIntensity,
        })) : []),
        /* the mean of a node's vertices, in RAS mm (the world transform applied) */
        centroid(key) {
            const m = nodes().get(key);
            if (!m) return null;
            m.updateWorldMatrix(true, false);
            const pos = m.geometry.attributes.position;
            const v = new THREE.Vector3();
            const sum = [0, 0, 0];
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
                const r = sceneToRas(v.toArray());
                sum[0] += r[0]; sum[1] += r[1]; sum[2] += r[2];
            }
            return sum.map((s) => s / pos.count);
        },
        /* a node's vertices nearest a RAS point: { distance, vertex } (RAS mm) */
        nearest(key, ras) {
            const m = nodes().get(key);
            if (!m) return null;
            m.updateWorldMatrix(true, false);
            const pos = m.geometry.attributes.position;
            const v = new THREE.Vector3();
            const target = new THREE.Vector3(...rasToScene(ras));
            let best = Infinity;
            let at = null;
            for (let i = 0; i < pos.count; i++) {
                const d = v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).distanceToSquared(target);
                if (d < best) { best = d; at = v.toArray(); }
            }
            return { distance: Math.sqrt(best), vertex: sceneToRas(at) };
        },
        /* the camera: position, target and the viewing direction, in RAS mm */
        camera() {
            const p = stage.pose();
            const pos = sceneToRas(p.position);
            const tgt = sceneToRas(p.target);
            const d = Math.hypot(...pos.map((v, n) => v - tgt[n])) || 1;
            return { position: pos, target: tgt, distance: p.distance, toCamera: pos.map((v, n) => (v - tgt[n]) / d), flying: stage.info().flying };
        },
        /* RAS mm -> client px, and whether it is in front of the camera */
        project(ras) {
            stage.camera.updateMatrixWorld();
            return stage.toClient(new THREE.Vector3(...rasToScene(ras)));
        },
        hits: (x, y) => collectHits(x, y).map((h) => ({ key: h.key, id: h.id, marker: h.marker, point: h.point, distance: h.distance })),
        /* a client point where a click picks `key` first, or null */
        screenOf(key) {
            const m = nodes().get(key) || (markers.get(key) && markers.get(key).object);
            if (!m || !installed) return null;
            const pts = [];
            const v = new THREE.Vector3();
            m.updateWorldMatrix(true, false);
            if (m.geometry && m.geometry.attributes.position) {
                const pos = m.geometry.attributes.position;
                const stride = Math.max(1, Math.floor(pos.count / 600));
                for (let i = 0; i < pos.count; i += stride) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
            } else pts.push(new THREE.Vector3().setFromMatrixPosition(m.matrixWorld));
            const centre = specimen.boundsOf([key]);
            if (centre) pts.unshift(new THREE.Vector3(...rasToScene([0, 1, 2].map((n) => (centre.min[n] + centre.max[n]) / 2))));
            stage.camera.updateMatrixWorld();
            const r = canvas.getBoundingClientRect();
            for (const p of pts) {
                const c = stage.toClient(p);
                if (!c.front || c.x < r.left + 2 || c.y < r.top + 2 || c.x > r.right - 2 || c.y > r.bottom - 2) continue;
                if (document.elementFromPoint(c.x, c.y) !== canvas) continue;
                const hits = collectHits(c.x, c.y);
                if (hits.length && hits[0].key === key) return { x: c.x, y: c.y };
            }
            return null;
        },
    });

    return {
        hook, annotate, setState, setMuNote, setEmphasis, loadState, unloadState, setView, setBone, setRegion, setMucosa, setNose, setLandmarks, setSweeps, setSection, setSectionAt, flipSection, regions, sectionRange, frameSelection,
        VIEWS, BONE_MODES,
        get status() { return status; },
        get problem() { return problem; },
        get muNote() { return muNote; },
        get view() { return view; },
        get bone() { return layers.bone; },
        get landmarksOn() { return layers.landmarks; },
        get section() { return { axis: section.axis, flip: section.flip, at: sectionAt() }; },
        get ready() { return installed; },
        get hasLandmarks() { return landmarks.size > 0; },
        get sweepsOn() { return layers.sweeps; },
        get mucosaOn() { return layers.mucosa; },
        get noseOn() { return layers.nose; },
        get stateKey() { return dissect ? dissect.key : null; },
        get hasNose() { return !!specimen && [...specimen.nodes.values()].some((m) => m.userData.group === 'nose'); },
        get hasSweeps() { return sweeps.size > 0; },
        onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
        dispose,
    };
}
