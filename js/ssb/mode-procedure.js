/* =============================================================
   mode-procedure.js — the procedure player (WP P2, docs/ssb.md 5.8, 7.3).

   A procedure plays step by step in the scope on its dissected state. The player is not a stage of its own: it is the
   scope stage (state.scope) with `state.procedure = { id, step, cor }` behind it, and it owns four hand-overs:

   - the volume the scope reads: ssb/states/<key>.ssbp.gz applied to the shared base volume (volume.js applyPatch) and handed
     to the endoscope (collision, the tip's label); the base stays untouched for the CT image;
   - the lining the specimen draws: the state's pack (packs.json "state": <key>, loaded by key, the last three kept) swaps in
     for the base lining, with `hides` and the walls' remnants;
   - the CT stage: the carved voxels as an outline over the base image (mode-ct.js setCarved), which stays up if the reader
     goes from the procedure to CT (the procedure then ends, as the scope does) until CT is left;
   - the step: its `see` structures and the `at` of its `risk` hazards drawn through what hides them (hazards hatched), and
     its station flown to (through the store, `endo.flyTo`) on a step the reader takes: the state's own pose first, else the
     intact one, else the pose is kept and a note says so.

   ssb/states/index.json loads on first use (a procedure shown, a Play press, a `#p=` hash) and never at boot, and only when
   stamps.js lists it (a build without states asks for nothing, so no 404 reaches the console). Missing or
   malformed: Play is disabled with one line of reason and nothing throws. `step` n is 0..N: 0 is the start (the entry state),
   n >= 1 the state after step n; N is the highest step the index lists. A step the index does not list takes the nearest lower
   listed one (a step that removes nothing is the same state).

   The index shape this reads (P1b writes it; docs/ssb.md 5.8): { version: 1, base, states: { <key>: { units, usedBy, patch,
   lining, hides, remnants, measured } }, procedures: { "<p-id>": { "<step>": <key> } } (also flat "<p-id>#<step>"),
   corridors: { "<key>": { name, procedures: [p-id], positions: { "<p-id>#<step>": <key> } } } }.

   Imports no three.js. `hook` is the read-only test window (window.__ssb.procedure).
   ============================================================= */
import { sharedVolume, stamped, parsePatch, applyPatch } from './volume.js?v=1a9f4d75';
import { STAMPS } from './stamps.js?v=66a84c3b';

export const INDEX_FILE = 'ssb/states/index.json';
const KEY = /^[0-9a-f]{10}$/;
const PATCH_FILE = /^[A-Za-z0-9._-]+\.ssbp\.gz$/;
const KEEP_STATES = 3;

const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const ids = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []).filter((x) => typeof x === 'string');

/* Fold { "<p-id>": { "<n>": key } } and { "<p-id>#<n>": key } into Map("<p-id>#<n>" -> key | null). */
function stepMap(src) {
    const out = new Map();
    if (!src || typeof src !== 'object' || Array.isArray(src)) return out;
    const put = (id, n, key) => {
        const step = Number(n);
        if (!/^p\.[a-z0-9-]+$/.test(id) || !Number.isInteger(step) || step < 0 || step > 99) return;
        if (key === null || (typeof key === 'string' && KEY.test(key))) out.set(`${id}#${step}`, key);
    };
    for (const [k, v] of Object.entries(src)) {
        const flat = /^(p\.[a-z0-9-]+)#(\d+)$/.exec(k);
        if (flat) put(flat[1], flat[2], v);
        else if (v && typeof v === 'object' && !Array.isArray(v)) for (const [n, key] of Object.entries(v)) put(k, n, key);
    }
    return out;
}

/* ssb/states/index.json -> { states: Map(key -> { patch, hasLining, hides, remnants, units, usedBy }), steps: Map("<p-id>#<n>" -> key|null),
   corridors: Map(key -> { name, procedures, positions: Map }) }. Anything malformed is dropped; a document that is not an index
   is empty. */
export function parseIndex(doc) {
    const out = { states: new Map(), steps: new Map(), corridors: new Map() };
    if (!doc || typeof doc !== 'object' || doc.version !== 1) return out;
    if (doc.states && typeof doc.states === 'object') {
        for (const [key, s] of Object.entries(doc.states)) {
            if (!KEY.test(key) || !s || typeof s !== 'object') continue;
            const patch = typeof s.patch === 'string' && PATCH_FILE.test(s.patch) ? s.patch : `${key}.ssbp.gz`;
            out.states.set(key, { patch, hasLining: typeof s.lining === 'string' && s.lining !== '', hides: ids(s.hides), remnants: ids(s.remnants), units: ids(s.units), usedBy: ids(s.usedBy) });
        }
    }
    out.steps = stepMap(doc.procedures);
    for (const [k, v] of [...out.steps]) if (typeof v === 'string' && !out.states.has(v)) out.steps.delete(k);          /* a key no state has */
    if (doc.corridors && typeof doc.corridors === 'object') {
        for (const [key, c] of Object.entries(doc.corridors)) {
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || !c || typeof c !== 'object') continue;
            const positions = stepMap(c.positions);
            for (const [k, v] of [...positions]) if (typeof v === 'string' && !out.states.has(v)) positions.delete(k);
            out.corridors.set(key, { name: typeof c.name === 'string' ? c.name.slice(0, 120) : key, procedures: ids(c.procedures).filter((i) => /^p\./.test(i)), positions });
        }
    }
    return out;
}

/* The highest step the index lists for a procedure (0 when it lists none). */
export function stepCount(index, id) {
    let max = 0;
    for (const k of index.steps.keys()) {
        const m = /^(.+)#(\d+)$/.exec(k);
        if (m && m[1] === id) max = Math.max(max, Number(m[2]));
    }
    return max;
}

/* (procedure, step, corridor) -> the state key, or null for the intact specimen. In a corridor its own position wins; else the
   nearest listed step at or below `step`. */
export function stateKeyFor(index, id, step, cor = null) {
    const corridor = cor ? index.corridors.get(cor) : null;
    for (let n = step; n >= 0; n--) {
        if (corridor && corridor.positions.has(`${id}#${n}`)) return corridor.positions.get(`${id}#${n}`);
        if (index.steps.has(`${id}#${n}`)) return index.steps.get(`${id}#${n}`);
    }
    return null;
}

/* opts: { store, graph, specimen, endo, ct, fetchFn? } (endo and ct may be null: the player then only drives what exists). */
export function mountProcedure({ store, graph, specimen, endo, ct = null, fetchFn = (url) => fetch(url) }) {
    const subs = new Set();
    let index = null;
    let status = 'idle';                  /* idle | loading | ready | absent | failed */
    let reason = '';
    let asking = null;
    let seq = 0;
    let shown = null;                     /* { id, step, cor, key } on show */
    let derived = null;                   /* the volume of the state on show (null: the intact specimen) */
    let note = '';
    let busy = false;
    let flyNext = false;                  /* the next state to show came from a step the reader took: fly to its station */
    let pinned = false;                   /* CT is showing the outline of a state whose procedure has ended */
    const patches = new Map();            /* key -> parsed patch, most recent last (KEEP_STATES) */
    const packsLoaded = [];               /* state keys whose pack is on the specimen, most recent last */

    const emit = () => { for (const fn of [...subs]) { try { fn(); } catch (e) { console.error(e); } } };
    const procedure = () => store.get().procedure;
    const stepsOf = (id) => { const e = graph.get(id); return e && Array.isArray(e.steps) ? e.steps : []; };

    /* ---------------- the index ---------------- */

    function ensure() {
        if (asking) return asking;
        status = 'loading';
        asking = (async () => {
            try {
                /* stamps.js lists what is on disk: no index there means no states are built, and the page need not ask (a 404 is a
                   console error, and none is expected on a build without states) */
                if (!own(STAMPS, INDEX_FILE)) { status = 'absent'; reason = 'No dissection states are built yet (ssb/states/index.json is not there).'; return; }
                const res = await fetchFn(stamped(INDEX_FILE));
                if (res.status === 404) { status = 'absent'; reason = 'No dissection states are built yet (ssb/states/index.json is not there).'; return; }
                if (!res.ok) { status = 'failed'; reason = `The dissection states could not be fetched (HTTP ${res.status}).`; return; }
                const doc = await res.json();
                const parsed = parseIndex(doc);
                if (!parsed.states.size || !parsed.steps.size) { status = 'failed'; reason = 'The dissection state index is empty or not in a format this page reads.'; return; }
                index = parsed;
                status = 'ready';
                reason = '';
            } catch (e) {
                status = 'failed';
                reason = 'The dissection states could not be read.';
            } finally {
                emit();
            }
        })();
        return asking;
    }

    const canPlay = (id) => status === 'ready' && !!index && stepCount(index, id) > 0;
    const corridorsFor = (id) => (index ? [...index.corridors].filter(([, c]) => c.procedures.includes(id)).map(([key, c]) => ({ key, name: c.name })) : []);

    /* ---------------- states ---------------- */

    async function patchFor(key, base) {
        if (patches.has(key)) { const p = patches.get(key); patches.delete(key); patches.set(key, p); return p; }
        const info = index.states.get(key);
        const res = await fetchFn(stamped(`ssb/states/${info.patch}`));
        if (!res.ok) throw new Error(`${info.patch}: HTTP ${res.status}`);
        const patch = await parsePatch(await res.arrayBuffer(), base);
        patches.set(key, patch);
        while (patches.size > KEEP_STATES) patches.delete(patches.keys().next().value);
        return patch;
    }

    function emphasisFor(id, step) {
        if (step < 1) return { see: [], hazard: [] };
        const s = stepsOf(id)[step - 1];
        if (!s) return { see: [], hazard: [] };
        const hazard = [];
        for (const h of ids(s.risk)) { const e = graph.get(h); if (e) hazard.push(...ids(e.at)); }
        return { see: ids(s.see), hazard };
    }

    function release({ keepCt = false } = {}) {
        seq += 1;
        shown = null;
        derived = null;
        note = '';
        busy = false;
        flyNext = false;
        if (endo) endo.setStateVolume(null);
        specimen.setState(null);
        specimen.setEmphasis({});
        if (ct && !keepCt) { ct.setCarved(null); pinned = false; }
        emit();
    }

    /* The specimen's packs are fetched when its stage first shows: a state's pack waits for that. */
    const specimenReady = () => (specimen.ready ? Promise.resolve() : new Promise((resolve) => {
        const off = specimen.onChange(() => { if (specimen.ready) { off(); resolve(); } });
    }));

    /* Bring the store's procedure on show: validate against the index, load the state, hand it over. */
    async function apply() {
        const proc = procedure();
        if (!proc) return;
        await ensure();
        const mine = ++seq;
        if (status !== 'ready') { store.setProcedure(null); return; }
        const now = procedure();
        if (!now || now.id !== proc.id) return;
        if (!canPlay(now.id)) { store.setProcedure(null); return; }                 /* an id the index does not list: ignored */
        const cor = now.cor && index.corridors.has(now.cor) && index.corridors.get(now.cor).procedures.includes(now.id) ? now.cor : null;
        const step = Math.min(now.step, stepCount(index, now.id));
        if (cor !== now.cor || step !== now.step) { store.setProcedure({ id: now.id, step, cor }); return; }      /* the store re-enters apply with the clean value */
        const key = stateKeyFor(index, now.id, step, cor);
        busy = true;
        emit();
        let vol = null;
        let problem = '';
        try {
            if (key) {
                const base = await sharedVolume();
                if (mine !== seq) return;
                vol = applyPatch(base, await patchFor(key, base));
            }
        } catch (e) {
            problem = 'This state could not be loaded; the specimen is shown intact.';
            console.error(e);
        }
        if (mine !== seq) return;
        if (key) {
            try { await specimenReady(); await specimen.loadState(key); } catch (e) { console.error(e); }
            if (mine !== seq) return;
        }
        derived = vol;
        shown = { id: now.id, step, cor, key: vol ? key : null };
        note = problem;
        busy = false;
        if (endo) endo.setStateVolume(vol, vol ? key : null);
        if (ct) { ct.setCarved(vol ? vol.carvedAt : null); pinned = false; }
        specimen.setState(vol && key ? { key, hides: index.states.get(key).hides } : null);
        specimen.setEmphasis(emphasisFor(now.id, step));
        if (vol && key) {
            const at = packsLoaded.indexOf(key);
            if (at >= 0) packsLoaded.splice(at, 1);
            packsLoaded.push(key);
            while (packsLoaded.length > KEEP_STATES) specimen.unloadState(packsLoaded.shift());
        }
        if (flyNext) { flyNext = false; fly(now.id, step, key); }
        emit();
    }

    /* The step's station: the state's own pose, else the intact one, else the pose stays and the note says so. */
    function fly(id, step, key) {
        if (!endo || step < 1) return;
        const s = stepsOf(id)[step - 1];
        if (!s || !s.station) return;
        const hit = endo.stationFor(s.station, key);
        if (!hit) { note = 'No pose for this state; the scope stays where it is.'; return; }
        endo.flyTo(hit.key, hit.state ? key : null);
    }

    /* ---------------- following the store ---------------- */

    store.subscribe((state, prev) => {
        if (state.procedure === prev.procedure) {
            if (pinned && !state.ct) { if (ct) ct.setCarved(null); pinned = false; emit(); }
            return;
        }
        if (!state.procedure) {
            const toCt = !!state.ct && !!derived;
            release({ keepCt: toCt });
            pinned = toCt;
            return;
        }
        if (!prev.procedure) { shown = null; note = ''; }
        apply();
    });
    if (store.get().procedure) apply();

    /* ---------------- what the reader does ---------------- */

    function play(id, cor = null) {
        if (!canPlay(id)) { ensure().then(emit); return false; }
        flyNext = false;
        return store.setProcedure({ id, step: 0, cor }, { source: 'procedure' }, endo ? endo.lastPose : null);
    }

    function setStep(n) {
        const proc = procedure();
        if (!proc || !index) return false;
        const step = Math.min(stepCount(index, proc.id), Math.max(0, Math.round(Number(n))));
        if (!Number.isFinite(step) || step === proc.step) return false;
        flyNext = true;
        const ok = store.setProcedure({ ...proc, step });
        if (!ok) flyNext = false;
        return ok;
    }

    const move = (d) => { const proc = procedure(); return proc ? setStep(proc.step + d) : false; };

    function setCorridor(cor) {
        const proc = procedure();
        if (!proc || !index) return false;
        const next = cor && index.corridors.has(cor) && index.corridors.get(cor).procedures.includes(proc.id) ? cor : null;
        flyNext = false;
        return store.setProcedure({ ...proc, cor: next });
    }

    const stop = () => store.setProcedure(null);

    const sample = (ras) => (derived ? derived.sample(ras[0], ras[1], ras[2]) : null);
    const hook = Object.freeze({
        get status() { return status; },
        get reason() { return reason; },
        get busy() { return busy; },
        get shown() { return shown ? { ...shown } : null; },
        get note() { return note; },
        get stateKey() { return shown ? shown.key : null; },
        get carvedVoxels() { return derived ? derived.carvedVoxels : 0; },
        get pinned() { return pinned; },
        get states() { return index ? [...index.states.keys()] : []; },
        get packs() { return packsLoaded.slice(); },
        get patches() { return [...patches.keys()]; },
        carvedAt: (ras) => (derived ? derived.carvedAt(ras[0], ras[1], ras[2]) : false),
        sampleAt: sample,
        labelAt: (ras) => (derived ? derived.labelAt(ras[0], ras[1], ras[2]) : null),
        keyFor: (id, step, cor = null) => (index ? stateKeyFor(index, id, step, cor) : null),
        steps: (id) => (index ? stepCount(index, id) : 0),
    });

    return {
        hook, ensure, canPlay, corridorsFor, play, setStep, setCorridor, stop,
        next: () => move(1), prev: () => move(-1),
        get status() { return status; },
        get reason() { return reason; },
        get busy() { return busy; },
        get note() { return note; },
        get shown() { return shown; },
        get current() { return procedure(); },
        stepCount: (id) => (index ? stepCount(index, id) : 0),
        stepsOf,
        onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    };
}
