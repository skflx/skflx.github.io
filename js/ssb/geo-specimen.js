/* =============================================================
   geo-specimen.js — the reference specimen's geometry: model packs ->
   one scene graph, registry and materials' looks (docs/ssb.md 5.3, 7.1).

   ssb/models/packs.json lists the packs (core first, the region packs after
   it, whatever else the pipeline adds) and the nodes each carries; every
   pack is a gzipped glTF binary with KHR_mesh_quantization, positions in RAS
   mm, and node extras { id, side, name } (three.js strips the dots from node
   names, so the registry reads userData). The loader reads whatever
   packs.json lists, never a hard-coded list, so a pack that appears later
   needs no change here.

   - One root group carries the one rasToScene conversion (frame.js, as the
     dioramas do); every node sits under it with its own quantization
     transform.
   - Registry: "<graph id>.<side>" -> the mesh. A node whose id is not in the
     graph is skipped with a console.warn, never drawn: the graph is the one
     source of what exists (docs/ssb.md principle 1).
   - Each node carries its `look` (the materials.js vocabulary), chosen from
     its graph entity's `kind` through kindForGraph: air spaces and cells are
     plain tinted (cells by their categorical CELL_TINT hue), the bony
     envelope is bone, anything else draws as its own tissue. `group` says
     which layer owns it: bone | air | tissue.
   - Nothing here throws to a blank stage. A pack that cannot be fetched,
     decoded or parsed is recorded (problems, packs[name].error) and the
     others still load; status is ready | partial | error | absent.
   - The gzip is decoded with volume.js's decode(), which checks the magic
     bytes rather than trusting headers (docs/ssb.md 5.3).

   The only new three.js importer besides scene.js: one module instance, the
   same unstamped vendor URLs (js/vendor/README.md).
   ============================================================= */
import * as THREE from '../vendor/three-0.186.1/build/three.module.js';
import { GLTFLoader } from '../vendor/three-0.186.1/examples/jsm/loaders/GLTFLoader.js';
import { rasToScene } from './frame.js?v=f554e767';
import { decode, stamped, parseHeader, headerBounds } from './volume.js?v=3cbe3dc2';
import { kindForGraph, CELL_TINT } from './materials.js?v=d27e5b3d';

export const PACKS_FILE = 'ssb/models/packs.json';
export const LANDMARKS_FILE = 'ssb/geometry/landmarks.json';
export const SWEEPS_FILE = 'ssb/geometry/sweeps.json';
export const CT_HEADER_FILE = 'ssb/ct/ct.json';
/* The bony envelope of the region: its graph entity is a `region`, which has
   no material of its own, and it is the one region that is solid bone. */
export const ENVELOPE_ID = 's.skull-base-region';

const PACK_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
const PACK_FILE = /^[A-Za-z0-9._-]+\.glb\.gz$/;
const ID = /^[a-z]+\.[a-z0-9-]+$/;
const SIDES = ['R', 'L', 'M'];
const LIMIT_MM = 400;            /* a node farther than this from the origin is not a head */
const LIMIT_TRIANGLES = 600000;  /* all packs together (docs/ssb.md 5.4 budgets 400k on screen) */
const GLB_MAGIC = 0x46546c67;    /* 'glTF' */

export class SpecimenError extends Error {
    /* code: 'absent' (no packs.json), 'network', 'invalid', 'unsupported'. */
    constructor(code, message) {
        super(message);
        this.name = 'SpecimenError';
        this.code = code;
    }
}

const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/* ---------------- looks ---------------- */

/* A graph entity -> { look, group } for its surface. `look` is the
   materials.js vocabulary; `group` the layer that owns it.
   An air space (sinus, space, opening, and the nasal cavity and
   nasopharynx, which the graph calls regions) is see-through; a cell is an
   opaque block in its categorical hue; the envelope and every other bone is
   bone; any other tissue is drawn as itself. */
export function lookFor(id, entity) {
    if (id === ENVELOPE_ID) return { look: { kind: 'bone' }, group: 'bone' };
    const kind = entity ? kindForGraph(entity.kind) : null;
    if (kind === null || kind === 'space') return { look: { kind: 'space', space: true }, group: 'air' };
    if (kind === 'air-cell') return { look: { kind, tint: own(CELL_TINT, id) ? CELL_TINT[id] : 'cell-ethmoid' }, group: 'air' };
    if (kind === 'bone' || kind === 'bone-cut') return { look: { kind: 'bone' }, group: 'bone' };
    return { look: { kind }, group: 'tissue' };
}

/* ---------------- fetching ---------------- */

async function getJson(fetchFn, file, what) {
    let res;
    try { res = await fetchFn(stamped(file)); } catch (e) { throw new SpecimenError('network', `${what} could not be fetched.`); }
    if (res.status === 404) throw new SpecimenError('absent', `${file} was not found.`);
    if (!res.ok) throw new SpecimenError('network', `${what}: HTTP ${res.status}.`);
    try { return await res.json(); } catch (e) { throw new SpecimenError('invalid', `${what} is not valid JSON.`); }
}

/* One pack's bytes, decoded; throws SpecimenError. */
async function getPack(fetchFn, name, file) {
    let res;
    try { res = await fetchFn(stamped(`ssb/models/${file}`)); } catch (e) { throw new SpecimenError('network', `${name}: the file could not be fetched.`); }
    if (!res.ok) throw new SpecimenError(res.status === 404 ? 'absent' : 'network', `${name}: the file could not be fetched (HTTP ${res.status}).`);
    let raw;
    try { raw = await res.arrayBuffer(); } catch (e) { throw new SpecimenError('network', `${name}: the download was cut off.`); }
    let buf;
    try {
        buf = await decode(raw);
    } catch (e) {
        if (e && e.code === 'unsupported') throw new SpecimenError('unsupported', 'This browser cannot decompress the model packs (DecompressionStream is missing).');
        throw new SpecimenError('invalid', `${name}: the file is damaged (gzip could not be decoded).`);
    }
    if (buf.byteLength < 20 || new DataView(buf).getUint32(0, true) !== GLB_MAGIC) throw new SpecimenError('invalid', `${name}: the file is not a glTF binary.`);
    if (new DataView(buf).getUint32(8, true) !== buf.byteLength) throw new SpecimenError('invalid', `${name}: the file is cut short.`);
    return buf;
}

/* glTF bytes -> the loader's scene (a Promise; rejects with SpecimenError). */
function parseGlb(buf, name) {
    return new Promise((resolve, reject) => {
        try {
            new GLTFLoader().parse(buf, '', (gltf) => resolve(gltf.scene), (e) => reject(new SpecimenError('invalid', `${name}: the model could not be read (${e && e.message ? e.message : 'parse error'}).`)));
        } catch (e) {
            reject(new SpecimenError('invalid', `${name}: the model could not be read (${e && e.message ? e.message : 'parse error'}).`));
        }
    });
}

/* The packs packs.json lists, in order (core first), as [{ name, file, nodes }].
   Entries with a bad name or file are dropped. */
export function listPacks(doc) {
    const src = doc && typeof doc === 'object' && doc.packs && typeof doc.packs === 'object' ? doc.packs : null;
    if (!src) return [];
    const out = [];
    for (const [name, def] of Object.entries(src)) {
        if (!PACK_NAME.test(name) || !def || typeof def.file !== 'string' || !PACK_FILE.test(def.file)) continue;
        out.push({ name, file: def.file, nodes: def.nodes && typeof def.nodes === 'object' ? Object.keys(def.nodes) : [] });
    }
    return out.sort((a, b) => (a.name === 'core' ? -1 : 0) - (b.name === 'core' ? -1 : 0));
}

/* ---------------- the specimen ---------------- */

/* opts: { graph, fetchFn?, warn? }. The handle is the registry; load() fills it. */
export function createSpecimen({ graph, fetchFn = (url) => fetch(url), warn = (...a) => console.warn(...a) }) {
    const root = new THREE.Group();
    root.name = 'specimen';
    /* the one RAS -> scene conversion (a proper rotation, so winding survives) */
    const col = (v) => new THREE.Vector3(...rasToScene(v));
    root.applyMatrix4(new THREE.Matrix4().makeBasis(col([1, 0, 0]), col([0, 1, 0]), col([0, 0, 1])));

    const nodes = new Map();           /* "<id>.<side>" -> mesh */
    const packs = new Map();           /* name -> { name, file, state, error, nodes: [keys], expected: [keys] } */
    const problems = [];
    let status = 'idle';               /* idle | loading | ready | partial | error | absent */
    let triangles = 0;
    let disposed = false;

    const problem = (text) => { problems.push(text); warn('SSB specimen: ' + text); };

    /* Take the meshes of a parsed scene into the registry. */
    function adopt(scene, pack) {
        const added = [];
        const meshes = [];
        scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
        for (const mesh of meshes) {
            const u = mesh.userData || {};
            const id = typeof u.id === 'string' ? u.id : '';
            const side = typeof u.side === 'string' ? u.side : '';
            const label = `${pack.name}: node ${String(u.name || mesh.name || '?').slice(0, 60)}`;
            if (!ID.test(id) || !SIDES.includes(side)) { problem(`${label} has no valid id and side in its extras; skipped.`); continue; }
            if (!graph.has(id)) { problem(`${label} names ${id}, which is not in the knowledge graph; skipped.`); continue; }
            const key = `${id}.${side}`;
            if (nodes.has(key)) { problem(`${label} repeats ${key}; skipped.`); continue; }
            const g = mesh.geometry;
            const pos = g && g.attributes ? g.attributes.position : null;
            if (!pos || pos.count < 3) { problem(`${label} (${key}) has no vertices; skipped.`); continue; }
            const tris = g.index ? g.index.count / 3 : pos.count / 3;
            if (triangles + tris > LIMIT_TRIANGLES) { problem(`${label} (${key}) would pass the ${LIMIT_TRIANGLES} triangle limit; skipped.`); continue; }
            mesh.updateMatrix();
            g.computeBoundingBox();
            const box = g.boundingBox.clone().applyMatrix4(mesh.matrix);
            if (![...box.min.toArray(), ...box.max.toArray()].every((v) => finite(v) && Math.abs(v) <= LIMIT_MM)) {
                problem(`${label} (${key}) lies outside the head's ${LIMIT_MM} mm; skipped.`);
                continue;
            }
            const entity = graph.get(id);
            const { look, group } = lookFor(id, entity);
            mesh.parent.remove(mesh);
            mesh.name = key;
            mesh.material.dispose();
            mesh.material = new THREE.MeshBasicMaterial();      /* replaced by mode-specimen per state */
            mesh.userData = { id, side, key, pack: pack.name, look, group, region: entity && entity.region ? String(entity.region) : '', triangles: tris, envelope: id === ENVELOPE_ID };
            root.add(mesh);
            nodes.set(key, mesh);
            triangles += tris;
            added.push(key);
        }
        pack.nodes = added;
        const missing = pack.expected.filter((k) => !added.includes(k));
        if (missing.length) problem(`${pack.name}: packs.json lists ${missing.join(', ')}, which did not load.`);
        root.updateMatrixWorld(true);
        return added;
    }

    /* Fetch, decode and parse one pack's bytes into a scene. */
    async function readPack(pack, bytes) {
        return parseGlb(bytes, pack.name);
    }

    /* opts: { onPack(pack), idle() }
         onPack  called after each pack (loaded or failed) with its record
         idle    awaited after the first pack, before the others: the caller
                 lets the first frame paint (docs/ssb.md 5.4)
       Resolves with the status; never rejects. */
    async function load({ onPack = () => {}, idle = () => Promise.resolve() } = {}) {
        if (status !== 'idle') return status;
        status = 'loading';
        let list;
        try {
            list = listPacks(await getJson(fetchFn, PACKS_FILE, 'The pack list'));
        } catch (e) {
            status = e && e.code === 'absent' ? 'absent' : 'error';
            problem(e && e.message ? e.message : 'The pack list could not be read.');
            return status;
        }
        if (!list.length) { status = 'error'; problem('packs.json lists no usable pack.'); return status; }
        for (const p of list) packs.set(p.name, { name: p.name, file: p.file, state: 'pending', error: '', nodes: [], expected: p.nodes.map((k) => String(k)) });

        const take = async (p, bytesPromise) => {
            const pack = packs.get(p.name);
            pack.state = 'loading';
            try {
                const scene = await readPack(pack, await bytesPromise);
                if (disposed) return;
                adopt(scene, pack);
                pack.state = 'loaded';
            } catch (e) {
                pack.state = 'failed';
                pack.error = e && e.message ? String(e.message) : 'The pack could not be read.';
                problem(pack.error);
            }
            try { onPack(pack); } catch (e) { console.error(e); }
        };

        /* the first pack (core) alone, then a paint, then the rest fetched together */
        const [first, ...rest] = list;
        await take(first, getPack(fetchFn, first.name, first.file));
        if (disposed) return status;
        /* without the first pack (core: the envelope, the nasal cavity, the frame of everything else) there is no specimen to add to */
        if (packs.get(first.name).state === 'failed') { status = 'error'; return status; }
        await idle();
        if (disposed) return status;
        const fetching = rest.map((p) => getPack(fetchFn, p.name, p.file).catch((e) => Promise.reject(e)));
        for (let i = 0; i < rest.length; i++) {
            fetching[i].catch(() => {});                       /* handled in take(); no unhandled rejection while waiting on an earlier pack */
            await take(rest[i], fetching[i]);
            if (disposed) return status;
        }
        const states = [...packs.values()].map((p) => p.state);
        status = !nodes.size ? 'error' : states.every((s) => s === 'loaded') && !problems.length ? 'ready' : 'partial';
        return status;
    }

    /* The RAS box of the named nodes (or all): { min, max } in mm, or null. */
    function boundsOf(keys = null) {
        const box = new THREE.Box3();
        for (const [key, mesh] of nodes) if (!keys || keys.includes(key)) box.expandByObject(mesh);
        if (box.isEmpty()) return null;
        const a = box.min.toArray();
        const b = box.max.toArray();
        /* scene -> RAS: (x, y, z) -> (x, -z, y) */
        const lo = [a[0], -b[2], a[1]];
        const hi = [b[0], -a[2], b[1]];
        return { min: lo, max: hi };
    }

    function dispose() {
        disposed = true;
        for (const mesh of nodes.values()) {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material && typeof mesh.material.dispose === 'function') mesh.material.dispose();
        }
        root.clear();
        nodes.clear();
    }

    return {
        THREE, root, nodes, packs, problems, load, boundsOf, dispose,
        get status() { return status; },
        get triangles() { return triangles; },
        byId: (id) => [...nodes.values()].filter((m) => m.userData.id === id),
    };
}

/* ---------------- landmarks ---------------- */

/* { "<id>.<side>": [r, a, s] } -> Map("<id>.<side>" -> { id, side, ras }) for
   the entries whose id is in the graph and whose point is finite and near the
   head. Absent or unreadable: an empty map (the layer is then just empty). */
export async function loadLandmarks({ graph, fetchFn = (url) => fetch(url), warn = (...a) => console.warn(...a) }) {
    const out = new Map();
    let doc;
    try {
        const res = await fetchFn(stamped(LANDMARKS_FILE));
        if (!res.ok) return out;
        doc = await res.json();
    } catch (e) { return out; }
    if (!doc || typeof doc !== 'object') return out;
    for (const [key, ras] of Object.entries(doc)) {
        const m = /^([a-z]+\.[a-z0-9-]+)\.(R|L|M)$/.exec(key);
        if (!m || !Array.isArray(ras) || ras.length !== 3 || !ras.every((v) => finite(v) && Math.abs(v) <= LIMIT_MM)) continue;
        if (!graph.has(m[1])) { warn(`SSB specimen: landmark ${key} names ${m[1]}, which is not in the knowledge graph; skipped.`); continue; }
        out.set(key, { id: m[1], side: m[2], ras: ras.slice() });
    }
    return out;
}

/* ---------------- sweeps ---------------- */

/* { "<id>.<side>": { pts: [[r, a, s]...], radius: [mm...] } } -> Map("<id>.<side>"
   -> { id, side, pts, radius }) for the entries whose id is in the graph and
   whose points are finite, near the head and at least two. A radius list that
   does not match the points falls back to 0.5 mm. Absent or unreadable: an
   empty map (the layer is then just empty). */
export async function loadSweeps({ graph, fetchFn = (url) => fetch(url), warn = (...a) => console.warn(...a) }) {
    const out = new Map();
    let doc;
    try {
        const res = await fetchFn(stamped(SWEEPS_FILE));
        if (!res.ok) return out;
        doc = await res.json();
    } catch (e) { return out; }
    if (!doc || typeof doc !== 'object') return out;
    for (const [key, sw] of Object.entries(doc)) {
        const m = /^([a-z]+\.[a-z0-9-]+)\.(R|L|M)$/.exec(key);
        const pts = sw && sw.pts;
        if (!m || !Array.isArray(pts) || pts.length < 2 || pts.length > 400) continue;
        if (!pts.every((p) => Array.isArray(p) && p.length === 3 && p.every((v) => finite(v) && Math.abs(v) <= LIMIT_MM))) continue;
        if (!graph.has(m[1])) { warn(`SSB specimen: sweep ${key} names ${m[1]}, which is not in the knowledge graph; skipped.`); continue; }
        const r = Array.isArray(sw.radius) && sw.radius.length === pts.length && sw.radius.every((v) => finite(v) && v > 0 && v < 20) ? sw.radius.slice() : pts.map(() => 0.5);
        out.set(key, { id: m[1], side: m[2], pts: pts.map((p) => p.slice()), radius: r });
    }
    return out;
}

/* The CT volume's RAS box from its header alone, or null (absent, invalid):
   the 3D cursor clamps to it before the volume itself is downloaded. */
export async function loadCtBounds({ fetchFn = (url) => fetch(url) } = {}) {
    try {
        const res = await fetchFn(stamped(CT_HEADER_FILE));
        if (!res.ok) return null;
        return headerBounds(parseHeader(await res.json()));
    } catch (e) { return null; }
}
