/* =============================================================
   olsb-3d.js — OLSB 3D model: draws js/olsb-volume.js as voxels with
   three.js (vendored), and lets you walk through it.

   An ES module, loaded after the classic OLSB scripts (it reads
   window.OLSB). It owns the page's mode switch (3D model | Diagrams):
   the 2D diagrams stay the no-WebGL fallback and keep their own hash.

   Two grids (OLSB.volume.LEVELS): the whole specimen at 0.3 mm, then the
   tympanic cavity and labyrinth at 0.1 mm, which replaces the coarse
   voxels inside its box. Both are built, and carved into drill states,
   in a Web Worker running js/olsb-volume.js itself (main thread if a
   worker cannot start).

   Surfaces come from js/olsb-mesh.js (in the worker): smooth surface nets
   on the shown voxels, or blocks. This module lights them (a soft sky and a
   lamp riding on the camera), colours them from the --olsb-* tokens (the
   selection tinted, the rest stepped back), and swaps them in when they
   arrive. Hidden layers, the cut plane and the drill state only change
   which voxels are shown, so a section is just its cut faces. Picking walks
   the ray through the grids (no mesh raycast).

   Hash: #m=3d[&st=][&s=tour step | &L=layers&cut=&cam=], matched against
   the data, never rendered. Strings reach the DOM through textContent.
   ============================================================= */
import * as THREE from './vendor/three-0.186.1/build/three.module.js';

const O = window.OLSB;
const V = O && O.volume;
const $ = (id) => document.getElementById(id);
const DIRS = { sup: 'Superior', inf: 'Inferior', ant: 'Anterior', post: 'Posterior', med: 'Medial', lat: 'Lateral' };
const OPP = { sup: 'inf', inf: 'sup', ant: 'post', post: 'ant', med: 'lat', lat: 'med' };
const DEFAULT_LAYERS = ['bone', 'canal', 'ossicles', 'nerves', 'muscles', 'inner', 'vessels', 'dura'];

/* model mm (x lat, y ant, z sup) -> three (X = ant, Y = sup, Z = lat): a cyclic swap, still right-handed */
const toW = (p) => new THREE.Vector3(p[1], p[2], p[0]);
const toM = (v) => [v.z, v.x, v.y];

const st = {
    state: 'intact', layers: new Set(DEFAULT_LAYERS),
    ghost: false, names: false, pixels: false, blocks: false, fly: false, isolate: false, detail: true,
    cut: { axis: 'none', pos: 0.5, flip: false },
    sel: null, focus: [], tour: 0, step: -1, moved: false
};
/* One per grid: metadata from the build, label arrays per drill state, what is shown, its meshes. */
const lv = { coarse: null, fine: null, micro: null };
let renderer, scene, camera, canvas, stage, needs = true, tween = null, built = false, worker = null;
let matSolid, matGhost;
const cam = { target: new THREE.Vector3(), pos: new THREE.Vector3() };
let TONES = {};
const REL = {};

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}
const gl = (id) => O.glossary[id] || {};
const nameOf = (id) => gl(id).name || id;
const labelOf = (code) => V.LABELS[code];
/* Grids from coarse to fine; a finer one, when drawn, replaces the coarser voxels inside its box. */
const ORDER = ['coarse', 'fine', 'micro'];
const on = (n) => !!(lv[n] && lv[n].lab && (n === 'coarse' || st.detail));
const active = () => ORDER.filter(on);
const finerBox = (n) => { const f = ORDER[ORDER.indexOf(n) + 1]; return f && on(f) ? lv[f].box : null; };
const fineOn = () => on('fine');

/* ---------- mode switch ---------- */
function setMode(m, write) {
    const main = document.querySelector('main.olsb');
    main.setAttribute('data-mode', m);
    document.querySelectorAll('#olsb-mode [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)));
    $('olsb3d').hidden = m !== '3d';
    $('olsb2d').hidden = m === '3d';
    if (m === '3d') {
        if (!built) boot3d();
        else { resize(); needs = true; }
        if (write) writeHash();
    } else if (write) {
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* no-op */ }
    }
}

/* ---------- tokens ---------- */
function readTones() {
    const cs = getComputedStyle(document.documentElement);
    const col = (name, fb) => {
        const c = new THREE.Color();
        try { c.setStyle((cs.getPropertyValue(name) || '').trim() || fb); } catch (e) { c.setStyle(fb); }
        return c.convertSRGBToLinear();
    };
    TONES = {};
    ['bone', 'bone-dark', 'plate', 'otic', 'zone', 'skin', 'tm', 'tm-edge', 'ossicle', 'nerve', 'muscle',
        'perilymph', 'artery', 'vein', 'dura', 'brain', 'cast', 'cast-2', 'cut', 'stage3d'].forEach((t) => { TONES[t] = col('--olsb-' + t, '#888'); });
    TONES.signal = col('--signal', '#c00');
}

/* ---------- relations (the rule of js/olsb.js: every rel and its reverse) ---------- */
function buildRelations() {
    const add = (a, dir, b) => {
        if (a === b) return;
        REL[a] = REL[a] || {};
        REL[a][dir] = REL[a][dir] || [];
        if (!REL[a][dir].includes(b)) REL[a][dir].push(b);
    };
    Object.keys(O.glossary).forEach((id) => {
        const r = O.glossary[id].rel || {};
        Object.keys(r).forEach((dir) => {
            if (OPP[dir]) r[dir].forEach((o) => { if (O.glossary[o]) { add(id, dir, o); add(o, OPP[dir], id); } });
        });
    });
}
const relIds = (id) => { const r = REL[id] || {}; return [].concat(...Object.keys(r).map((d) => r[d])); };
const codesOf = (id) => V.LABELS.filter((l) => l && l.id === id).map((l) => l.code);
const inBox = (p, b) => p[0] > b[0] && p[1] > b[1] && p[2] > b[2] && p[0] < b[3] && p[1] < b[4] && p[2] < b[5];
/* The best anchor for a structure: the fine grid's when it lies inside it. */
function anchorOf(id) {
    let best = null;
    codesOf(id).forEach((c) => {
        const a = lv.coarse && lv.coarse.anchors[c];
        if (a && (!best || a.n > best.n)) best = a;
    });
    if (best && fineOn() && inBox(best.centroid, V.LEVELS.fine.box)) {
        const f = codesOf(id).map((c) => lv.fine.anchors[c]).filter(Boolean).sort((x, y) => y.n - x.n)[0];
        if (f) return f;
    }
    return best;
}
const inModel = (id) => !!anchorOf(id);

/* ---------- building and carving (worker, or here) ---------- */
function startWorker() {
    const tag = document.querySelector('script[src*="olsb-volume.js"]');
    try {
        if (!tag || typeof Worker !== 'function') return null;
        const w = new Worker(tag.src);
        const waiting = new Map();
        let seq = 0;
        w.onmessage = (e) => {
            const m = e.data || {}, x = waiting.get(m.id);
            if (!x) return;
            waiting.delete(m.id);
            if (m.error) x.reject(new Error(m.error)); else x.resolve(m);
        };
        w.onerror = (e) => { e.preventDefault(); waiting.forEach((x) => x.reject(new Error('worker failed'))); waiting.clear(); worker = null; };
        return {
            ask: (msg) => new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject }); w.postMessage(Object.assign({ id }, msg)); })
        };
    } catch (e) { return null; }
}
const local = {};
function ask(msg) {
    if (worker) return worker.ask(msg).catch(() => { worker = null; return ask(msg); });
    return new Promise((resolve) => setTimeout(() => {
        if (msg.type === 'build') {
            const v = local[msg.level] = V.build(V.LEVELS[msg.level]);
            resolve({ nx: v.nx, ny: v.ny, nz: v.nz, vox: v.vox, o: v.o, anchors: v.anchors, lab: new Uint8Array(v.lab), dep: v.dep });
        } else resolve({ lab: V.carve(local[msg.level], msg.state) });
    }, 20));
}
function levelFrom(name, m) {
    const box = [m.o[0], m.o[1], m.o[2], m.o[0] + m.nx * m.vox, m.o[1] + m.ny * m.vox, m.o[2] + m.nz * m.vox];
    return { name, nx: m.nx, ny: m.ny, nz: m.nz, vox: m.vox, o: m.o, box, anchors: m.anchors, dep: m.dep, labs: { intact: m.lab }, lab: null, shown: null, meshes: [], quads: [] };
}
async function buildLevel(name) {
    lv[name] = levelFrom(name, await ask({ type: 'build', level: name }));
}
async function labsFor(state) {
    const names = ORDER.filter((n) => lv[n] && (n === 'coarse' || st.detail));
    await Promise.all(names.map(async (n) => {
        const L = lv[n];
        if (L.labs[state]) return;
        const lab = (await ask({ type: 'carve', level: n, state })).lab;
        /* the worker may have moved on to a new detail cube: keep only labels that fit this one */
        if (lab.length === L.nx * L.ny * L.nz && lv[n] === L) L.labs[state] = lab;
    }));
}

/* The detail cube: when you look closely at something inside the fine box, the worker builds
   the 8 mm round it at 0.05 mm and it replaces the fine voxels there. Only with a worker. */
let microBusy = false, microAgain = false;
function microBox(t) {
    const F = V.LEVELS.fine, s = V.LEVELS.micro.size, b = [0, 0, 0, 0, 0, 0];
    for (let a = 0; a < 3; a++) {
        let lo = Math.min(F.box[a + 3] - s, Math.max(F.box[a], t[a] - s / 2));
        lo = F.box[a] + Math.round((lo - F.box[a]) / F.vox) * F.vox;
        b[a] = +lo.toFixed(4);
        b[a + 3] = +(lo + s).toFixed(4);
    }
    return b;
}
async function updateMicro() {
    if (!worker || !st.detail || !on('fine')) return;
    if (microBusy) { microAgain = true; return; }
    const t = toM(cam.target);
    if (cam.pos.distanceTo(cam.target) > 18 || !inBox(t, V.LEVELS.fine.box)) return;
    const M = lv.micro, c = M && [0, 1, 2].map((a) => (M.box[a] + M.box[a + 3]) / 2);
    if (M && Math.hypot(t[0] - c[0], t[1] - c[1], t[2] - c[2]) < 2.5) return;
    microBusy = true;
    stage.setAttribute('data-micro', 'building');
    try {
        const L = levelFrom('micro', await ask({ type: 'build', level: 'micro', box: microBox(t) }));
        while (!L.labs[st.state]) {
            const want = st.state, lab = (await ask({ type: 'carve', level: 'micro', state: want })).lab;
            L.labs[want] = lab;
        }
        if (lv.micro) lv.micro.meshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); });
        lv.micro = L;
        useState();
        remesh();
        placeTags();
        stage.setAttribute('data-micro', 'ready');
    } catch (e) {
        stage.setAttribute('data-micro', 'failed');
    }
    microBusy = false;
    if (microAgain) { microAgain = false; updateMicro(); }
}

/* ---------- visibility ---------- */
/* 0 hidden, 1 solid, 2 ghost (see-through bone) */
function visTable() {
    const t = new Uint8Array(256);
    const iso = st.isolate && st.sel ? new Set([st.sel].concat(relIds(st.sel))) : null;
    V.LABELS.forEach((l) => {
        if (!l || l.drilled) return;
        let v = st.layers.has(l.layer) ? 1 : 0;
        if (l.air && !st.layers.has('air')) v = 0;
        if (v && st.ghost && l.layer === 'bone') v = 2;
        if (iso && v === 1 && !iso.has(l.id)) v = l.layer === 'bone' ? 2 : 0;
        t[l.code] = v;
    });
    return t;
}
/* shown value at a model point (mm), from whichever drawn grid covers it */
function shownAt(x, y, z) {
    const act = active();
    for (let a = act.length - 1; a >= 0; a--) {
        const L = lv[act[a]];
        const i = Math.floor((x - L.o[0]) / L.vox), j = Math.floor((y - L.o[1]) / L.vox), k = Math.floor((z - L.o[2]) / L.vox);
        if (L.shown && i >= 0 && j >= 0 && k >= 0 && i < L.nx && j < L.ny && k < L.nz) return L.shown[i + L.nx * (j + L.ny * k)];
    }
    return 0;
}

/* ---------- surfaces (js/olsb-mesh.js, in the worker when there is one) ---------- */
/* Colours from the tokens. The selection is tinted with the act signal; with a selection,
   whatever is neither it, its neighbours nor bone steps back. A step's focus only names. */
function colorize() {
    const sel = st.sel, rel = new Set(sel ? relIds(sel) : []);
    const base = new Array(256).fill(null), tmp = new THREE.Color();
    V.LABELS.forEach((l) => {
        if (!l) return;
        tmp.copy(TONES[l.tone] || TONES.bone);
        if (l.tone === 'zone') tmp.lerpColors(TONES.bone, TONES.zone, 0.38);
        if (l.id === sel) tmp.lerp(TONES.signal, 0.42);
        else if (sel && !rel.has(l.id) && l.layer !== 'bone') tmp.lerp(TONES.stage3d, 0.55);
        base[l.code] = [tmp.r, tmp.g, tmp.b];
    });
    const cut = [TONES.cut.r, TONES.cut.g, TONES.cut.b];
    ORDER.forEach((n) => {
        const L = lv[n];
        if (!L) return;
        L.meshes.forEach((mesh, m) => {
            const b = L.quads[m];
            const qc = (q) => (b.drilled[q] && labelOf(b.lab[q]).layer === 'bone' ? cut : base[b.lab[q]]);
            /* smooth surfaces: each vertex takes the mean colour of the quads meeting at its
               corner, so a boundary between two tissues is a soft line, not a staircase */
            let acc = null;
            if (b.vc) {
                acc = new Float32Array(b.ncorner * 4);
                for (let q = 0; q < b.n; q++) {
                    const c = qc(q);
                    for (let k = 0; k < 4; k++) { const a = b.vc[q * 4 + k] * 4; acc[a] += c[0]; acc[a + 1] += c[1]; acc[a + 2] += c[2]; acc[a + 3]++; }
                }
            }
            const mix = [0, 0, 0];
            for (let q = 0; q < b.n; q++) {
                const cq = qc(q);
                for (let k = 0; k < 4; k++) {
                    let c = cq;
                    if (acc) { const a = b.vc[q * 4 + k] * 4, w = acc[a + 3]; mix[0] = acc[a] / w; mix[1] = acc[a + 1] / w; mix[2] = acc[a + 2] / w; c = mix; }
                    const s = b.shade[q * 4 + k] / 255, bb = q * 12 + k * 3;
                    /* the attribute holds the square root of linear colour, so 8 bits keep the dark steps */
                    b.col[bb] = Math.round(255 * Math.sqrt(Math.min(1, c[0] * s)));
                    b.col[bb + 1] = Math.round(255 * Math.sqrt(Math.min(1, c[1] * s)));
                    b.col[bb + 2] = Math.round(255 * Math.sqrt(Math.min(1, c[2] * s)));
                }
            }
            mesh.geometry.attributes.color.needsUpdate = true;
        });
    });
    needs = true;
}

/* Lit surfaces: vertex colours arrive as square roots of linear colour (8 bits keep the dark
   steps) and are squared back before lighting. Soft and slightly sheened, like wet specimen. */
function material(ghost) {
    const m = ghost
        ? new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, roughness: 0.9 })
        : new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.58, metalness: 0 });
    m.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.rgb *= diffuseColor.rgb;');
    };
    return m;
}

/* Ask for new surfaces; the old ones stay on screen until they arrive, and only the latest
   request is installed. The page keeps its own shown arrays for picking and walking. */
let meshSeq = 0;
function remesh() {
    if (!lv.coarse || !lv.coarse.lab) return;
    const t0 = performance.now(), seq = ++meshSeq;
    const act = active(), vt = visTable();
    const opts = { vt, cut: { axis: st.cut.axis, pos: st.cut.pos, flip: st.cut.flip }, cutBox: V.LEVELS.coarse.box, blocks: st.blocks, cav: V.codes.cavity };
    act.forEach((n) => O.mesh.computeShown(lv[n], vt, opts.cut, opts.cutBox));
    const job = worker
        ? ask({ type: 'mesh', state: st.state, levels: act, opts })
        : new Promise((resolve) => setTimeout(() => resolve({ meshes: O.mesh.meshAll(act.map((n) => lv[n]), opts) }), 0));
    stage.setAttribute('data-meshing', 'busy');
    job.then((res) => {
        if (seq !== meshSeq) return;
        install(res.meshes, act);
        stage.setAttribute('data-meshing', 'idle');
        stage.setAttribute('data-remesh-ms', String(Math.round(performance.now() - t0)));
    }).catch(() => { if (seq === meshSeq) stage.setAttribute('data-meshing', 'failed'); });
}
function install(meshes, act) {
    let faces = 0;
    ORDER.forEach((n) => {
        const L = lv[n];
        if (!L) return;
        L.meshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); });
        L.meshes = [];
        L.quads = [];
        if (!act.includes(n) || !meshes[n]) return;
        L.quads = meshes[n];
        L.quads.forEach((b, m) => {
            b.col = new Uint8Array(b.n * 12);
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(b.pos, 3));
            g.setAttribute('normal', new THREE.BufferAttribute(b.nrm, 3, true));
            g.setAttribute('color', new THREE.BufferAttribute(b.col, 3, true));
            g.setIndex(new THREE.BufferAttribute(b.idx, 1));
            const mesh = new THREE.Mesh(g, m ? matGhost : matSolid);
            mesh.position.copy(toW(L.o));
            mesh.scale.setScalar(L.vox);
            mesh.frustumCulled = false;
            mesh.renderOrder = m;
            scene.add(mesh);
            L.meshes.push(mesh);
            faces += b.n;
        });
    });
    colorize();
    placeTags();
    stage.setAttribute('data-faces', String(faces));
}

/* ---------- picking: walk the ray through the grids ---------- */
function pickRay(ndcX, ndcY) {
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    return march(toM(rc.ray.origin), toM(rc.ray.direction));
}
/* First solid voxel along o + t d (t < maxT), over every drawn grid. */
function march(o, d, maxT) {
    let best = null;
    active().forEach((n) => {
        const h = marchGrid(lv[n], o, d, maxT, finerBox(n));
        if (h && (!best || h.t < best.t)) best = h;
    });
    return best;
}
function marchGrid(L, o, d, maxT, skipBox) {
    const v = L.vox, nx = L.nx, ny = L.ny, nz = L.nz, dims = [nx, ny, nz];
    const lo = L.o, hi = [lo[0] + nx * v, lo[1] + ny * v, lo[2] + nz * v];
    let t0 = 0, t1 = maxT == null ? 1e9 : maxT;
    for (let a = 0; a < 3; a++) {
        if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo[a] || o[a] > hi[a]) return null; continue; }
        let ta = (lo[a] - o[a]) / d[a], tb = (hi[a] - o[a]) / d[a];
        if (ta > tb) { const x = ta; ta = tb; tb = x; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    }
    if (t0 > t1) return null;
    const p = [0, 1, 2].map((a) => o[a] + d[a] * (t0 + 1e-5));
    const c = [0, 1, 2].map((a) => Math.min(dims[a] - 1, Math.max(0, Math.floor((p[a] - lo[a]) / v))));
    const step = d.map((x) => (x > 0 ? 1 : -1));
    const tMax = [0, 1, 2].map((a) => d[a] === 0 ? 1e9 : t0 + ((lo[a] + (c[a] + (step[a] > 0 ? 1 : 0)) * v) - p[a]) / d[a]);
    const tDel = d.map((x) => (x === 0 ? 1e9 : Math.abs(v / x)));
    let t = t0;
    for (let n = 0; n < 4000; n++) {
        const idx = c[0] + nx * (c[1] + ny * c[2]);
        if (L.shown[idx] === 1) {
            const q = [lo[0] + (c[0] + 0.5) * v, lo[1] + (c[1] + 0.5) * v, lo[2] + (c[2] + 0.5) * v];
            if (!skipBox || !inBox(q, skipBox)) return { code: L.lab[idx], t, p: [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t] };
        }
        const a = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2);
        t = tMax[a];
        if (t > t1) return null;
        c[a] += step[a];
        if (c[a] < 0 || c[a] >= dims[a]) return null;
        tMax[a] += tDel[a];
    }
    return null;
}

/* ---------- camera: orbit about a target, or fly; keys walk in both ---------- */
const FOV = 42;
function setView(id, animate) {
    const vw = V.VIEWS.find((x) => x.id === id) || V.VIEWS[0];
    stage.classList.toggle('is-scope', !!vw.scope);
    flyTo(toW(vw.eye), toW(vw.target), animate, vw.fov || FOV);
}
function flyTo(pos, target, animate, fov) {
    const f1 = fov || camera.fov;
    if (!animate) { tween = null; cam.pos.copy(pos); cam.target.copy(target); camera.fov = f1; applyCam(); return; }
    tween = { t0: performance.now(), dur: 750, p0: cam.pos.clone(), q0: cam.target.clone(), p1: pos.clone(), q1: target.clone(), f0: camera.fov, f1 };
    needs = true;
}
function applyCam() {
    camera.position.copy(cam.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(cam.target);
    camera.near = Math.max(0.01, Math.min(0.5, cam.pos.distanceTo(cam.target) * 0.004));
    camera.updateProjectionMatrix();
    needs = true;
}
/* Turn `moving` (the eye or the target) about `center` on a sphere. */
function turn(center, moveEye, dx, dy, k) {
    const moving = moveEye ? cam.pos : cam.target;
    const off = moving.clone().sub(center);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta -= dx * k;
    sph.phi = Math.min(Math.PI - 0.03, Math.max(0.03, sph.phi - dy * k));
    off.setFromSpherical(sph);
    moving.copy(center).add(off);
    applyCam();
}
/* orbit: the eye goes round the target; fly: the target goes round the eye (turn your head) */
const orbit = (dx, dy) => turn(cam.target.clone(), true, dx, dy, 0.008);
const lookAround = (dx, dy) => turn(cam.pos.clone(), false, dx, -dy, 0.005);
function pan(dx, dy) {
    const k = cam.pos.distanceTo(cam.target) * 0.0018;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    const mv = right.multiplyScalar(-dx * k).add(up.multiplyScalar(dy * k));
    cam.pos.add(mv); cam.target.add(mv);
    applyCam();
}
function dolly(f) {
    const off = cam.pos.clone().sub(cam.target);
    if (st.fly) {
        const mv = off.clone().setLength((f - 1) * 8);       /* f < 1 (wheel up): forward */
        cam.pos.add(mv); cam.target.add(mv);
    } else {
        off.setLength(Math.min(400, Math.max(1.2, off.length() * f)));
        cam.pos.copy(cam.target).add(off);
    }
    applyCam();
}
const keys = new Set();
function walk(dt) {
    if (!keys.size) return false;
    const fwd = cam.target.clone().sub(cam.pos).normalize(), right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    const mv = new THREE.Vector3();
    if (keys.has('w') || keys.has('arrowup')) mv.add(fwd);
    if (keys.has('s') || keys.has('arrowdown')) mv.sub(fwd);
    if (keys.has('d')) mv.add(right);
    if (keys.has('a')) mv.sub(right);
    if (keys.has('e') || keys.has(' ')) mv.y += 1;
    if (keys.has('q') || keys.has('c')) mv.y -= 1;
    if (keys.has('arrowleft')) lookAround(-220 * dt, 0);
    if (keys.has('arrowright')) lookAround(220 * dt, 0);
    if (mv.lengthSq()) {
        /* Walk like a game camera: speed follows the free space ahead (slow in the 2 mm middle
           ear, quick in the open), and you stop at a wall instead of passing into it. */
        const eye = toM(cam.pos), dir = toM(mv.clone().normalize());
        const inside = shownAt(eye[0], eye[1], eye[2]) === 1;
        const hit = inside ? null : march(eye, dir, 60);
        const clear = hit ? hit.t : 60;
        const speed = Math.min(30, Math.max(0.5, clear * 1.6)) * (keys.has('shift') ? 3 : 1);
        const stepLen = Math.min(speed * dt, inside ? 1e9 : Math.max(0, clear - 0.5));
        if (stepLen > 0) { mv.setLength(stepLen); cam.pos.add(mv); cam.target.add(mv); applyCam(); }
    }
    return true;
}

function wireInput() {
    const ptrs = new Map();
    let drag = null, pinch0 = 0, moved = 0, lastTap = 0;
    const ndc = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; };
    canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture(e.pointerId);
        ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        drag = { btn: e.button, shift: e.shiftKey };
        moved = 0;
        tween = null;
        if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch0 = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); }
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!ptrs.has(e.pointerId)) { hover(e); return; }
        const prev = ptrs.get(e.pointerId);
        ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
        moved += Math.abs(dx) + Math.abs(dy);
        if (ptrs.size === 2) {
            const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
            if (pinch0 && d) dolly(pinch0 / d);
            pinch0 = d;
            pan(dx / 2, dy / 2);
            return;
        }
        if (drag.btn === 2 || drag.btn === 1 || drag.shift) pan(dx, dy);
        else if (st.fly) lookAround(dx, dy);
        else orbit(dx, dy);
    });
    const up = (e) => {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.delete(e.pointerId);
        if (ptrs.size < 2) pinch0 = 0;
        if (moved >= 6) settle();
        else if (ptrs.size === 0 && drag && drag.btn === 0) {
            const now = performance.now(), hit = pickRay(...ndc(e));
            if (now - lastTap < 320 && hit) { focusOn(hit.p); lastTap = 0; }
            else { lastTap = now; select(hit ? labelOf(hit.code).id : null); }
        }
        drag = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); tween = null; dolly(Math.exp(e.deltaY * 0.0012)); settle(); }, { passive: false });
    canvas.addEventListener('pointerleave', () => { $('olsb3d-hover').hidden = true; });
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'q', 'e', 'c', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
            keys.add(k); tween = null; e.preventDefault(); needs = true;
        } else if (k === 'f') toggle('fly');
        else if (k === 'escape') select(null);
    });
    canvas.addEventListener('keyup', (e) => { keys.delete(e.key.toLowerCase()); settle(); });
    canvas.addEventListener('blur', () => keys.clear());
}
let settleT = null;
function settle() {
    clearTimeout(settleT);
    settleT = setTimeout(() => { st.moved = true; writeHash(); updateMicro(); }, 400);
}
function focusOn(pm) {
    const t = toW(pm), off = cam.pos.clone().sub(cam.target);
    off.setLength(Math.min(off.length(), 16));
    flyTo(t.clone().add(off), t, true);
}
let hoverT = 0;
function hover(e) {
    const now = performance.now();
    if (now - hoverT < 50 || !lv.coarse || !lv.coarse.shown) return;
    hoverT = now;
    const r = canvas.getBoundingClientRect();
    const hit = pickRay(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const tip = $('olsb3d-hover');
    if (!hit) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.textContent = nameOf(labelOf(hit.code).id);
    tip.style.left = (e.clientX - r.left + 14) + 'px';
    tip.style.top = (e.clientY - r.top + 10) + 'px';
}

/* ---------- names in the scene ---------- */
function tagIds() {
    const ids = new Set(st.focus);
    if (st.sel) { ids.add(st.sel); relIds(st.sel).forEach((x) => ids.add(x)); }
    if (st.names) V.LABELS.forEach((l) => { if (l && st.layers.has(l.layer) && !l.air && l.id !== 'tbone') ids.add(l.id); });
    return [...ids].filter(inModel);
}
function placeTags() {
    const box = $('olsb3d-tags');
    box.textContent = '';
    if (!lv.coarse || !lv.coarse.shown) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, eye = toM(camera.position);
    const placed = [];
    const rank = (id) => (id === st.sel ? 2 : st.focus.includes(id) ? 1 : 0);
    tagIds().sort((a, b) => rank(b) - rank(a)).forEach((id) => {
        const a = anchorOf(id).at;
        const v = toW(a).project(camera);
        if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return;
        /* behind something shown? then it is drawn faint */
        const d = [a[0] - eye[0], a[1] - eye[1], a[2] - eye[2]], len = Math.hypot(d[0], d[1], d[2]);
        const hit = march(eye, d.map((x) => x / len), len - 0.4);
        const behind = hit && labelOf(hit.code).id !== id;
        const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
        if (placed.some((p) => Math.abs(p[0] - x) < 80 && Math.abs(p[1] - y) < 16)) return;
        placed.push([x, y]);
        const t = el('span', 'olsb3d-tag' + (id === st.sel ? ' is-sel' : st.focus.includes(id) ? ' is-focus' : '') + (behind ? ' is-behind' : ''), nameOf(id));
        t.style.left = x + 'px';
        t.style.top = y + 'px';
        box.appendChild(t);
    });
}

/* ---------- compass ---------- */
function drawCompass() {
    const c = $('olsb3d-compass'), ctx = c.getContext('2d'), s = c.width, mid = s / 2;
    ctx.clearRect(0, 0, s, s);
    const q = camera.quaternion.clone().invert();
    [['Sup', [0, 0, 1]], ['Ant', [0, 1, 0]], ['Lat', [1, 0, 0]]].forEach(([n, m]) => {
        const v = toW(m).applyQuaternion(q);
        ctx.strokeStyle = ctx.fillStyle = n === 'Lat' ? '#8EA7FF' : '#D8D4CA';
        ctx.lineWidth = s / 36;
        ctx.globalAlpha = v.z < -0.2 ? 0.45 : 1;
        ctx.beginPath(); ctx.moveTo(mid, mid); ctx.lineTo(mid + v.x * mid * 0.6, mid - v.y * mid * 0.6); ctx.stroke();
        ctx.font = `600 ${s / 6.5}px ui-monospace, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n, mid + v.x * mid * 0.82, mid - v.y * mid * 0.82);
    });
    ctx.globalAlpha = 1;
}

/* ---------- panel ---------- */
function select(id) {
    st.sel = id && id !== 'tbone' ? id : null;
    if (st.isolate) remesh(); else colorize();
    renderInfo();
    placeTags();
}
function chip(id, onClick) {
    const b = el('button', 'olsb-chip', nameOf(id));
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
}
function renderInfo() {
    const box = $('olsb3d-info');
    box.hidden = !st.sel;
    if (!st.sel) return;
    const id = st.sel, l = labelOf(codesOf(id)[0]);
    const layer = l && V.LAYERS.find((x) => x.id === l.layer);
    $('olsb3d-info-layer').textContent = '3D model' + (layer ? ' · ' + layer.name : '');
    $('olsb3d-info-name').textContent = nameOf(id);
    $('olsb3d-info-note').textContent = gl(id).note || '';
    const relBox = $('olsb3d-info-rel');
    relBox.textContent = '';
    const r = REL[id] || {};
    ['sup', 'inf', 'ant', 'post', 'lat', 'med'].forEach((dir) => {
        if (!r[dir]) return;
        const row = el('div', 'olsb-rel-row');
        row.appendChild(el('span', 'olsb-rel-dir', DIRS[dir]));
        const list = el('span', 'olsb-rel-list');
        r[dir].forEach((o) => {
            const b = chip(o, () => { select(o); flyToId(o); });
            if (!inModel(o)) b.disabled = true;
            list.appendChild(b);
        });
        row.appendChild(list);
        relBox.appendChild(row);
    });
    $('olsb3d-info-rel-wrap').hidden = !relBox.children.length;
}
function flyToId(id) { const a = anchorOf(id); if (a) focusOn(a.at); }

function pills(box, items, isOn, onPick) {
    box.textContent = '';
    items.forEach((it) => {
        const b = el('button', 'site-pill', it.name);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(!!isOn(it)));
        if (it.desc) b.title = it.desc;
        b.addEventListener('click', () => onPick(it));
        box.appendChild(b);
    });
}
const CUTS = [{ id: 'none', name: 'None' }, { id: 'ax', name: 'Axial' }, { id: 'cor', name: 'Coronal' }, { id: 'sag', name: 'Sagittal' }];
function renderControls() {
    pills($('olsb3d-states'), V.STATES, (s) => s.id === st.state, (s) => { st.moved = true; setState(s.id); });
    const lb = $('olsb3d-layers');
    lb.textContent = '';
    lb.appendChild(el('span', 'site-kicker', 'Layers'));
    V.LAYERS.forEach((L) => {
        const b = el('button', 'site-pill olsb3d-layer');
        b.type = 'button';
        b.appendChild(el('span', 'olsb-swatch olsb3d-sw-' + L.id));
        b.appendChild(document.createTextNode(L.name));
        b.setAttribute('aria-pressed', String(st.layers.has(L.id)));
        b.addEventListener('click', () => {
            if (st.layers.has(L.id)) st.layers.delete(L.id); else st.layers.add(L.id);
            st.moved = true;
            renderControls(); remesh(); placeTags(); writeHash();
        });
        lb.appendChild(b);
    });
    pills($('olsb3d-views'), V.VIEWS, () => false, (v) => { st.moved = true; setView(v.id, true); settle(); });
    ['ghost', 'names', 'fly', 'pixels', 'blocks', 'isolate', 'detail'].forEach((k) => { const b = $('olsb3d-' + k); if (b) b.setAttribute('aria-pressed', String(!!st[k])); });
    pills($('olsb3d-cut'), CUTS, (c) => c.id === st.cut.axis, (c) => {
        st.cut.axis = c.id; st.moved = true;
        renderControls(); remesh(); faceCut(); placeTags(); writeHash();
    });
    $('olsb3d-cutpos').disabled = st.cut.axis === 'none';
    $('olsb3d-cutflip').disabled = st.cut.axis === 'none';
    const s = V.STATES.find((x) => x.id === st.state);
    $('olsb3d-state-desc').textContent = s && s.desc ? s.desc : 'The intact bone. Pick a drill state to open it.';
}
/* Swing the camera round to look at the cut face (from the side that is kept). */
function faceCut() {
    const ax = st.cut.axis;
    if (ax === 'none') return;
    const B = V.LEVELS.coarse.box, i = { sag: 0, cor: 1, ax: 2 }[ax];
    const t = [0, -3, -2];
    t[i] = B[i] + (B[i + 3] - B[i]) * st.cut.pos;
    const dir = [0, 0, 0];
    dir[i] = st.cut.flip ? -1 : 1;
    const side = ax === 'ax' ? [0.3, -0.25, 0] : ax === 'cor' ? [0.35, 0, 0.25] : [0, -0.3, 0.25];
    flyTo(toW(t.map((x, a) => x + (dir[a] + side[a]) * 60)), toW(t), true);
}
function toggle(k) {
    st[k] = !st[k];
    renderControls();
    if (k === 'ghost' || k === 'isolate' || k === 'blocks') remesh();
    if (k === 'detail') {
        if (st.detail && !lv.fine) loadFine();
        else labsFor(st.state).then(() => { useState(); remesh(); placeTags(); });
    }
    if (k === 'pixels') resize();
    placeTags();
    needs = true;
}

let stateToken = 0;
async function setState(id) {
    if (!V.STATES.some((s) => s.id === id)) id = 'intact';
    st.state = id;
    renderControls();
    const token = ++stateToken;
    const busy = setTimeout(() => status('Drilling…'), 150);
    await labsFor(id);
    clearTimeout(busy);
    if (token !== stateToken) return;
    status(null);
    useState();
    remesh();
    placeTags();
    writeHash();
    updateMicro();
}
function useState() {
    ORDER.forEach((n) => { if (lv[n]) lv[n].lab = lv[n].labs[st.state] || null; });
}
function status(text) {
    const s = $('olsb3d-status');
    s.hidden = !text;
    if (text) s.textContent = text;
}

/* ---------- the tour ---------- */
const tour = () => V.TOURS[st.tour];
function goStep(s) {
    const sp = tour().steps[s];
    st.step = s;
    st.moved = false;
    st.layers = new Set(sp.layers);
    st.focus = sp.focus || [];
    st.sel = null;
    st.cut.axis = 'none';
    st.ghost = false;
    st.isolate = false;
    setState(sp.state || 'intact');
    setView(sp.view, true);
    renderStep();
    renderInfo();
}
function renderStep() {
    const T = tour(), s = st.step;
    $('olsb3d-tour-sub').textContent = T.sub;
    const list = $('olsb3d-steps');
    list.textContent = '';
    T.steps.forEach((sp, i) => {
        const li = el('li'), b = el('button', 'olsb-steplink', sp.title);
        b.type = 'button';
        if (i === s) b.setAttribute('aria-current', 'step');
        b.addEventListener('click', () => goStep(i));
        li.appendChild(b);
        list.appendChild(li);
    });
    $('olsb3d-stepcard').hidden = s < 0;
    $('olsb3d-start').hidden = s >= 0;
    if (s < 0) return;
    const sp = T.steps[s];
    $('olsb3d-step-n').textContent = 'Step ' + (s + 1) + ' of ' + T.steps.length;
    $('olsb3d-step-title').textContent = sp.title;
    $('olsb3d-term-a').textContent = T.terms[0];
    $('olsb3d-term-b').textContent = T.terms[1];
    $('olsb3d-step-act').textContent = sp.act;
    $('olsb3d-step-hazard').textContent = sp.hazard;
    $('olsb3d-prev').disabled = s === 0;
    $('olsb3d-next').disabled = s === T.steps.length - 1;
}

/* ---------- hash ---------- */
function writeHash() {
    let h = '#m=3d';
    if (st.state !== 'intact') h += '&st=' + st.state;
    if (st.step >= 0 && !st.moved) h += '&s=' + (st.step + 1);
    else {
        h += '&L=' + V.LAYERS.filter((L) => st.layers.has(L.id)).map((L) => L.id).join('.');
        if (st.cut.axis !== 'none') h += '&cut=' + st.cut.axis + '.' + Math.round(st.cut.pos * 100) + (st.cut.flip ? '.f' : '');
        if (camera) h += '&cam=' + toM(cam.pos).concat(toM(cam.target)).map((x) => x.toFixed(1)).join(',');
    }
    try { history.replaceState(null, '', h); } catch (e) { /* no-op */ }
}
function readHash() {
    let h = '';
    try { h = location.hash.slice(1); } catch (e) { /* no-op */ }
    const get = (k) => {
        const m = new RegExp('(?:^|&)' + k + '=([^&]*)').exec(h);
        try { return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; }
    };
    return { m: get('m'), d: get('d'), p: get('p'), st: get('st'), s: get('s'), L: get('L'), cut: get('cut'), cam: get('cam') };
}
function applyHash() {
    const h = readHash();
    const s = h.s ? parseInt(h.s, 10) - 1 : -1;
    if (s >= 0 && s < tour().steps.length) { goStep(s); return; }
    if (h.L != null) st.layers = new Set(h.L.split('.').filter((x) => V.LAYERS.some((L) => L.id === x)));
    const cut = /^(ax|cor|sag)\.(\d{1,2})(\.f)?$/.exec(h.cut || '');
    if (cut) st.cut = { axis: cut[1], pos: Math.min(98, Math.max(2, +cut[2])) / 100, flip: !!cut[3] };
    $('olsb3d-cutpos').value = String(Math.round(st.cut.pos * 100));
    const c = (h.cam || '').split(',').map(Number);
    if (c.length === 6 && c.every((x) => Number.isFinite(x) && Math.abs(x) < 500)) flyTo(toW(c.slice(0, 3)), toW(c.slice(3)), false);
    else setView('surgeon', false);
    if (h.L != null || h.cam) st.moved = true;
    setState(h.st || 'intact');
    renderStep();
}

/* ---------- loop ---------- */
function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(st.pixels ? Math.max(0.2, dpr * 0.25) : Math.min(2, dpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    canvas.classList.toggle('is-pixels', st.pixels);
    needs = true;
}
let lastT = performance.now(), tagsAt = 0;
function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (tween) {
        const k = Math.min(1, (now - tween.t0) / tween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        cam.pos.lerpVectors(tween.p0, tween.p1, e);
        cam.target.lerpVectors(tween.q0, tween.q1, e);
        camera.fov = tween.f0 + (tween.f1 - tween.f0) * e;
        applyCam();
        if (k >= 1) { tween = null; updateMicro(); }
    }
    if (walk(dt)) needs = true;
    if (needs && !$('olsb3d').hidden) {
        renderer.render(scene, camera);
        drawCompass();
        needs = false;
        tagsAt = now;
    }
    if (tagsAt && now - tagsAt > 90) { placeTags(); tagsAt = 0; }
    requestAnimationFrame(frame);
}

/* ---------- boot ---------- */
function wireControls() {
    ['ghost', 'names', 'fly', 'pixels', 'blocks', 'isolate', 'detail'].forEach((k) => { const b = $('olsb3d-' + k); if (b) b.addEventListener('click', () => toggle(k)); });
    let ct = null;
    $('olsb3d-cutpos').addEventListener('input', (e) => {
        st.cut.pos = Number(e.target.value) / 100;
        clearTimeout(ct);
        ct = setTimeout(() => { remesh(); placeTags(); writeHash(); }, 60);
    });
    $('olsb3d-cutflip').addEventListener('click', () => { st.cut.flip = !st.cut.flip; remesh(); faceCut(); placeTags(); writeHash(); });
    $('olsb3d-prev').addEventListener('click', () => { if (st.step > 0) goStep(st.step - 1); });
    $('olsb3d-next').addEventListener('click', () => { if (st.step < tour().steps.length - 1) goStep(st.step + 1); });
    $('olsb3d-start').addEventListener('click', () => goStep(0));
    $('olsb3d-info-close').addEventListener('click', () => select(null));
    $('olsb3d-info-fly').addEventListener('click', () => { if (st.sel) flyToId(st.sel); });
    window.addEventListener('resize', () => { if (renderer) resize(); });
    new MutationObserver(() => {
        if (!renderer) return;
        readTones();
        colorize();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

async function loadFine() {
    const b = $('olsb3d-detail');
    b.disabled = true;
    try {
        await buildLevel('fine');
        await labsFor(st.state);
        useState();
        remesh();
        placeTags();
        stage.setAttribute('data-fine', 'ready');
        updateMicro();
    } catch (e) {
        st.detail = false;
        renderControls();
    }
    b.disabled = false;
}

async function boot3d() {
    built = true;
    stage = $('olsb3d-stage');
    canvas = $('olsb3d-canvas');
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
        status('This browser could not start WebGL, so the 3D model cannot be drawn. The diagrams still work.');
        return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    readTones();
    /* the stage's own graded background shows through (css/olsb.css) */
    renderer.setClearColor(0x000000, 0);
    matSolid = material(false);
    matGhost = material(true);
    camera = new THREE.PerspectiveCamera(42, 1, 0.05, 600);
    /* Light: a soft sky over a dark ground, and a lamp riding on the camera, a little above
       and to the left, the way a microscope or endoscope lights the field. */
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2a221c, 1.15));
    const lamp = new THREE.DirectionalLight(0xffffff, 2.1);
    lamp.position.set(-0.35, 0.6, 1);
    lamp.target.position.set(0, 0, -1);
    camera.add(lamp, lamp.target);
    scene.add(camera);
    /* a small device keeps to the coarse grid unless asked */
    st.detail = (navigator.deviceMemory || 8) >= 4 && Math.min(screen.width, screen.height) >= 600;
    resize();
    wireInput();
    wireControls();
    buildRelations();
    status('Building the temporal bone…');
    worker = startWorker();
    if (worker) {
        const tag = document.querySelector('script[src*="olsb-mesh.js"]');
        try { await worker.ask({ type: 'init', meshUrl: tag.src }); } catch (e) { worker = null; }
    }
    try {
        const t0 = performance.now();
        await buildLevel('coarse');
        applyHash();
        await labsFor(st.state);
        useState();
        remesh();
        status(null);
        stage.setAttribute('data-ms', String(Math.round(performance.now() - t0)));
        document.documentElement.setAttribute('data-olsb3d', 'ready');
        requestAnimationFrame(frame);
        if (st.detail) loadFine();
    } catch (e) {
        status('The 3D model failed to build: ' + (e && e.message ? e.message : 'unknown error'));
    }
}

function init() {
    if (!V || !$('olsb3d')) return;
    document.querySelectorAll('#olsb-mode [data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.getAttribute('data-mode'), true)));
    $('olsb-mode').hidden = false;
    const h = readHash();
    setMode(h.m === '3d' || (!h.d && !h.p) ? '3d' : '2d', false);
}
init();
