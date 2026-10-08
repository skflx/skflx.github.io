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
     the scope landing on what the state opened (WP P4) on a step the reader takes (a flight through the store, `endo.flyTo`) and on a
     `#p=…&step=n` link that carries no `scope=` (a jump): the views of a state are its own byState poses, then those of every state
     whose units its own include (a pose posed for A is free wherever A's cuts are all made), nearest first, then the intact ones;
     the landing is the step's own station when the state's own poses have one for it, else the state's own first view (what it
     opened), else the nearest inherited one, else the intact pose of the step's station, else the pose is kept and a note says so.
     A link with `scope=` keeps it.

   ssb/states/index.json loads on first use (a procedure shown, a Play press, a `#p=` hash) and never at boot, and only when
   stamps.js lists it (a build without states asks for nothing, so no 404 reaches the console). Missing or
   malformed: Play is disabled with one line of reason and nothing throws. `step` n is 0..N: 0 is the start (the entry state),
   n >= 1 the state after step n; N is the highest step the index lists. A step the index does not list takes the nearest lower
   listed one (a step that removes nothing is the same state).

   The index shape this reads (P1b writes it; docs/ssb.md 5.8): { version: 1, base, states: { <key>: { units, usedBy, patch,
   lining, hides, remnants, measured } }, procedures: { "<p-id>": { "<step>": <key> } } (also flat "<p-id>#<step>"),
   corridors: { "<key>": { name, procedures: [p-id], positions: { "<p-id>#<step>": <key> } } } }.

   The mucosal state (WP DC1, docs/ssb.md 5.9) rides on the same machinery: `mu=dec|cong` (state.mu) is a state of the index
   with no units (index.mucosa: { dec: { state }, cong: { state } }), loaded as any state is, handed to the endoscope and
   the specimen, and ended by `mu=scan`. A procedure always plays decongested (every dissection state is built on it, and
   step 0 of a procedure with no entry state is the decongested state itself), whatever state.mu says; when the procedure
   ends, state.mu comes back.

   Imports no three.js. `hook` is the read-only test window (window.__ssb.procedure).
   ============================================================= */
import { sharedVolume, stamped, parsePatch, applyPatch } from './volume.js?v=6e4dc1a5';
import { STAMPS } from './stamps.js?v=f63ce9c8';

export const INDEX_FILE = 'ssb/states/index.json';
const KEY = /^[0-9a-f]{10}$/;
const PATCH_FILE = /^[A-Za-z0-9._-]+\.ssbp\.gz$/;
const LINING_FILE = /^lining-[0-9a-f]{10}\.glb\.gz$/;          /* a state's pack, under ssb/models/ */
const BASE = /^[0-9a-f]{10}$/;
const KEEP_STATES = 3;

const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const ids = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []).filter((x) => typeof x === 'string');
/* The index's `remnants` ({ "<wall node>": "<id>.<side>@<cut>" }) -> the graph ids of the walls the state cuts (a mucosal remnant is not a cut). */
const cutIds = (v) => (v && typeof v === 'object' && !Array.isArray(v)
    ? [...new Set(Object.entries(v).filter(([w, r]) => typeof w === 'string' && typeof r === 'string' && /@/.test(r) && !/@(?:decongested|congested|scanned)$/.test(r)).map(([w]) => w.replace(/\.(?:R|L|M)$/, '')))]
    : []);

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
        else if (v && typeof v === 'object' && !Array.isArray(v)) {
            const steps = v.steps && typeof v.steps === 'object' && !Array.isArray(v.steps) ? v.steps : v;      /* P1b: { entry, steps } */
            for (const [n, key] of Object.entries(steps)) put(k, n, key);
        }
    }
    return out;
}

/* A corridor's positions: P1b writes an ordered list [{ procedure, step, state }]; a map like stepMap's is also read. */
function positionList(src) {
    const out = [];
    if (Array.isArray(src)) {
        for (const p of src.slice(0, 200)) {
            if (!p || typeof p !== 'object') continue;
            const step = Number(p.step);
            if (/^p\.[a-z0-9-]+$/.test(p.procedure) && Number.isInteger(step) && step >= 0 && step <= 99 && typeof p.state === 'string' && KEY.test(p.state)) out.push([`${p.procedure}#${step}`, p.state]);
        }
        return out;
    }
    return [...stepMap(src)];
}

/* ssb/states/index.json -> { states: Map(key -> { patch, hasLining, hides, remnants, units, usedBy }), steps: Map("<p-id>#<n>" -> key|null),
   corridors: Map(key -> { name, procedures, positions: Map }) }. Anything malformed is dropped; a document that is not an index
   is empty. */
export function parseIndex(doc) {
    const out = { base: '', states: new Map(), steps: new Map(), entries: new Map(), corridors: new Map(), mucosa: {} };
    if (!doc || typeof doc !== 'object' || doc.version !== 1) return out;
    if (typeof doc.base === 'string' && BASE.test(doc.base)) out.base = doc.base;
    if (doc.states && typeof doc.states === 'object') {
        for (const [key, s] of Object.entries(doc.states)) {
            if (!KEY.test(key) || !s || typeof s !== 'object') continue;
            const patch = typeof s.patch === 'string' && PATCH_FILE.test(s.patch) ? s.patch : `${key}.ssbp.gz`;
            const lining = typeof s.lining === 'string' && LINING_FILE.test(s.lining) ? s.lining : '';
            out.states.set(key, { patch, lining, hasLining: !!lining, hides: ids(s.hides), remnants: ids(s.remnants), cuts: cutIds(s.remnants), units: ids(s.units), usedBy: ids(s.usedBy) });
        }
    }
    if (doc.mucosa && typeof doc.mucosa === 'object') {
        for (const mode of ['dec', 'cong']) {
            const m = doc.mucosa[mode];
            if (m && typeof m.state === 'string' && out.states.has(m.state)) out.mucosa[mode] = m.state;
        }
    }
    out.steps = stepMap(doc.procedures);
    if (doc.procedures && typeof doc.procedures === 'object') {                     /* P1b: the state before step 0 (the entry chain) */
        for (const [id, v] of Object.entries(doc.procedures)) {
            if (/^p\.[a-z0-9-]+$/.test(id) && v && typeof v.entry === 'string' && KEY.test(v.entry)) out.entries.set(id, v.entry);
        }
    }
    for (const [k, v] of [...out.steps]) if (typeof v === 'string' && !out.states.has(v)) out.steps.delete(k);          /* a key no state has */
    if (doc.corridors && typeof doc.corridors === 'object') {
        for (const [key, c] of Object.entries(doc.corridors)) {
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || !c || typeof c !== 'object') continue;
            const order = positionList(c.positions).filter(([, v]) => out.states.has(v));
            const positions = new Map(order);
            out.corridors.set(key, { name: typeof c.name === 'string' ? c.name.slice(0, 120) : key, procedures: ids(c.procedures).filter((i) => /^p\./.test(i)), positions, order });
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
    if (corridor && corridor.procedures.includes(id)) {
        /* In a corridor the state accumulates in its own order: the last position at or before (this procedure, this step). */
        const at = corridor.procedures.indexOf(id);
        let key = null;
        for (const [k, v] of corridor.order) {
            const m = /^(.+)#(\d+)$/.exec(k);
            const i = m ? corridor.procedures.indexOf(m[1]) : -1;
            if (i >= 0 && (i < at || (i === at && Number(m[2]) <= step))) key = v;
        }
        return key;
    }
    for (let n = step; n >= 0; n--) {
        if (index.steps.has(`${id}#${n}`)) return index.steps.get(`${id}#${n}`);
    }
    return index.entries && index.entries.has(id) ? index.entries.get(id) : null;     /* before its first cut: the entry chain's state */
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
    let flyNext = false;                  /* the next state to show came from a step the reader took: land on its view (a flight) */
    let jumpNext = false;                 /* ... came from a #p= link with no scope key: land on its view at once */
    let muShown = null;                   /* 'dec' | 'cong' on show (no procedure), else null */
    let pinned = false;                   /* CT is showing the outline of a state whose procedure has ended */
    const patches = new Map();            /* key -> parsed patch, most recent last (KEEP_STATES) */
    const packsLoaded = [];               /* state keys whose pack is on the specimen, most recent last */

    const emit = () => { for (const fn of [...subs]) { try { fn(); } catch (e) { console.error(e); } } };
    const procedure = () => store.get().procedure;
    const stepsOf = (id) => { const e = graph.get(id); return e && Array.isArray(e.steps) ? e.steps : []; };
    const stationOf = (id, step) => { const s = step >= 1 ? stepsOf(id)[step - 1] : null; return s && typeof s.station === 'string' ? s.station : ''; };

    /* The state keys whose byState poses are free in `key`: itself, then each state whose units are a proper subset of its own,
       the one with the most units first (the mucosal states carry none and are left out). */
    function chainOf(key) {
        const info = key && index ? index.states.get(key) : null;
        if (!info) return [];
        const mine = new Set(info.units);
        const sub = [];
        for (const [k, s] of index.states) {
            if (k === key || !s.units.length || s.units.length >= mine.size || !s.units.every((u) => mine.has(u))) continue;
            sub.push([k, s.units.length]);
        }
        sub.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
        return [key, ...sub.map(([k]) => k)];
    }

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
        const patch = await parsePatch(await res.arrayBuffer(), base, index.base);
        patches.set(key, patch);
        while (patches.size > KEEP_STATES) patches.delete(patches.keys().next().value);
        return patch;
    }

    /* A step's `see` and its hazards' `at`, minus the walls the state cuts: only a thin rim of a cut wall is left, and drawn through
       the lining (emphasis is, by design) it reads as a detached slab; the opened cavity shows the cut itself (WP P4, CP-3). */
    function emphasisFor(id, step, key) {
        if (step < 1) return { see: [], hazard: [] };
        const s = stepsOf(id)[step - 1];
        if (!s) return { see: [], hazard: [] };
        const cut = new Set(key && index && index.states.has(key) ? index.states.get(key).cuts : []);
        const hazard = [];
        for (const h of ids(s.risk)) { const e = graph.get(h); if (e) hazard.push(...ids(e.at)); }
        return { see: ids(s.see).filter((x) => !cut.has(x)), hazard: hazard.filter((x) => !cut.has(x)) };
    }

    function release({ keepCt = false } = {}) {
        seq += 1;
        shown = null;
        derived = null;
        note = '';
        busy = false;
        flyNext = false;
        jumpNext = false;
        muShown = null;
        if (endo) { endo.setStateVolume(null); endo.setViews([], ''); }
        specimen.setState(null);
        specimen.setEmphasis({});
        if (ct && !keepCt) { ct.setCarved(null); pinned = false; }
        emit();
    }

    /* The specimen's packs are fetched when its stage first shows: a state's pack waits for that. */
    const specimenReady = () => (specimen.ready ? Promise.resolve() : new Promise((resolve) => {
        const off = specimen.onChange(() => { if (specimen.ready) { off(); resolve(); } });
    }));

    /* The mucosal state alone (no procedure): the same hand-overs as a state of the procedure, without a step. */
    async function applyMu() {
        if (procedure()) return;
        const mode = store.get().mu;
        if (mode === 'scan') {
            if (muShown || derived) { muShown = null; release(); }
            specimen.setMuNote('');
            return;
        }
        await ensure();
        const mine = ++seq;
        if (procedure() || store.get().mu !== mode) return;
        const key = status === 'ready' && index.mucosa[mode];
        if (!key) {
            specimen.setMuNote(status === 'ready' ? 'This mucosal state is not built.' : reason);
            store.setMu('scan');
            return;
        }
        busy = true;
        specimen.setMuNote('Loading the mucosal state…');
        emit();
        let vol = null;
        try {
            const base = await sharedVolume();
            if (mine !== seq) return;
            vol = applyPatch(base, await patchFor(key, base));
            await specimenReady();
            await specimen.loadState(key, index.states.get(key).lining);
        } catch (e) {
            console.error(e);
        }
        if (mine !== seq) return;
        busy = false;
        if (!vol) {
            specimen.setMuNote('The mucosal state could not be loaded; the specimen is shown as scanned.');
            store.setMu('scan');
            return;
        }
        derived = vol;
        shown = null;
        muShown = mode;
        specimen.setMuNote('');
        if (endo) endo.setStateVolume(vol, key);
        specimen.setState({ key, hides: index.states.get(key).hides });
        const at = packsLoaded.indexOf(key);
        if (at >= 0) packsLoaded.splice(at, 1);
        packsLoaded.push(key);
        while (packsLoaded.length > KEEP_STATES) specimen.unloadState(packsLoaded.shift());
        emit();
    }

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
        const key = stateKeyFor(index, now.id, step, cor) || index.mucosa.dec || null;       /* step 0 of an intact start: the decongested state */
        busy = true;
        emit();
        let vol = null;
        let problem = '';
        try {
            if (key) {                                  /* a state that cannot be loaded leaves the intact specimen */
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
            try { await specimenReady(); await specimen.loadState(key, index.states.get(key).lining); } catch (e) { console.error(e); }
            if (mine !== seq) return;
        }
        derived = vol;
        shown = { id: now.id, step, cor, key: vol ? key : null };
        note = problem;
        busy = false;
        if (endo) {
            endo.setStateVolume(vol, vol ? key : null);
            endo.setViews(vol ? chainOf(key) : [], stationOf(now.id, step));
        }
        if (ct) { ct.setCarved(vol ? vol.carvedAt : null); pinned = false; }
        specimen.setState(vol && key ? { key, hides: index.states.get(key).hides } : null);
        specimen.setEmphasis(emphasisFor(now.id, step, vol ? key : null));
        if (vol && key) {
            const at = packsLoaded.indexOf(key);
            if (at >= 0) packsLoaded.splice(at, 1);
            packsLoaded.push(key);
            while (packsLoaded.length > KEEP_STATES) specimen.unloadState(packsLoaded.shift());
        }
        if (jumpNext) {                                         /* a link: its hashchange listener (above) runs after the page's own, in the same task as this store change; wait it out */
            await new Promise((resolve) => setTimeout(resolve, 0));
            if (mine !== seq) return;
        }
        const jump = jumpNext && linkBare;
        const land = flyNext || jump;
        flyNext = false;
        jumpNext = false;
        linkBare = false;
        if (land && (vol || step >= 1)) {            /* step 0 of the intact specimen has no station and no state: nothing to land on */
            emit();
            if (endo && (endo.stationsState === 'idle' || endo.stationsState === 'loading')) await endo.whenStations();
            if (mine !== seq) return;
            landOn(now.id, step, vol ? key : null, jump);
        }
        emit();
    }

    /* Where the scope lands on a state: see the header. `key` is the state on show (null: the intact specimen, whose only views are
       the intact stations). A state with views never leaves the reader on a pose from another state's corridor. */
    function landOn(id, step, key, jump) {
        if (!endo) return;
        const chain = key ? chainOf(key) : [];
        const want = stationOf(id, step);
        const p = endo.pose;
        const views = endo.viewsOf(chain);
        const mine = (v) => !p || v.side === 'M' || v.side === p.side;
        const first = (list) => list.find(mine) || list[0] || null;
        let hit = want ? endo.stationFor(want, chain.slice(0, 1)) : null;          /* the step's station, in the state's own table */
        if (hit && hit.from === null) hit = null;
        if (!hit) {
            const v = first(views.filter((x) => x.from === chain[0])) || first(views);      /* what the state opened, else the nearest inherited */
            if (v) hit = { key: v.key, from: v.from };
        }
        if (!hit && want) hit = endo.stationFor(want, null);                       /* the intact pose: free in every state */
        if (!hit) { if (want) note = 'No pose for this state; the scope stays where it is.'; return; }
        endo.flyTo(hit.key, hit.from ? chain : null, { jump });
    }

    /* ---------------- following the store ---------------- */

    /* A link that opens on a step with no `scope=` lands on the state's view at once. The page rewrites the address bar to the
       canonical hash (with the pose) in its own subscriber, before this one runs, so what the link said is read from the
       hashchange event's newURL (which the rewrite does not touch; the listener runs a task after the store change, which the
       landing waits for) and the page's first hash from the navigation entry. */
    const bare = (hash) => !/(?:^#|&)scope=/.test(hash || '');
    const firstHash = () => {
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            const at = nav && typeof nav.name === 'string' ? nav.name.indexOf('#') : -1;
            if (at >= 0) return nav.name.slice(at);
        } catch (e) { /* no navigation timing: the live hash */ }
        try { return location.hash; } catch (e) { return ''; }
    };
    let linkBare = false;                                                              /* the last hashchange's hash carried no scope= */
    try {
        window.addEventListener('hashchange', (e) => {
            const url = e && typeof e.newURL === 'string' ? e.newURL : '';
            linkBare = bare(url.indexOf('#') >= 0 ? url.slice(url.indexOf('#')) : '');
        });
    } catch (e) { /* no window: no links */ }

    store.subscribe((state, prev, meta) => {
        if (meta && meta.source === 'url' && state.procedure && state.procedure !== prev.procedure) jumpNext = true;
        if (state.procedure === prev.procedure) {
            if (pinned && !state.ct) { if (ct) ct.setCarved(null); pinned = false; emit(); }
            if (state.mu !== prev.mu && !state.procedure) applyMu();                  /* a procedure plays decongested whatever mu says */
            return;
        }
        if (!state.procedure) {
            const toCt = !!state.ct && !!derived;
            release({ keepCt: toCt });
            pinned = toCt;
            if (state.mu !== 'scan') applyMu();                                       /* the reader's mucosal state comes back */
            return;
        }
        if (!prev.procedure) { shown = null; note = ''; muShown = null; specimen.setMuNote(''); }
        apply();
    });
    if (store.get().procedure) { jumpNext = true; linkBare = bare(firstHash()); apply(); }
    else if (store.get().mu !== 'scan') applyMu();

    /* ---------------- what the reader does ---------------- */

    function play(id, cor = null) {
        if (!canPlay(id)) { ensure().then(emit); return false; }
        flyNext = false;
        jumpNext = false;
        return store.setProcedure({ id, step: 0, cor }, { source: 'procedure' }, endo ? endo.lastPose : null);
    }

    function setStep(n) {
        const proc = procedure();
        if (!proc || !index) return false;
        const step = Math.min(stepCount(index, proc.id), Math.max(0, Math.round(Number(n))));
        if (!Number.isFinite(step) || step === proc.step) return false;
        flyNext = true;
        jumpNext = false;
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
        jumpNext = false;
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
        get mucosa() { return shown ? 'dec' : muShown; },                       /* the mucosal state on show: a procedure's is always decongested */
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
