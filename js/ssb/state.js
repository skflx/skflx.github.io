/* =============================================================
   state.js — the one SSB store, its URL-hash codec, and ssb:* storage.

   Everything else subscribes to this store. It imports nothing: the graph
   is injected (`has`, `tierOf`), which keeps the module graph one-way
   (docs/ssb.md 7.1).

   The URL hash is the shareable state (`#s=s.uncinate-process&tier=2`,
   `#lab=ethmoid-roof&keros=12&q=lite`) and is untrusted input (docs/security.md
   rule 4): parsing is whitelist-only, ids must exist in the graph index, a
   diorama name must be in the injected registry and its keys in that
   diorama's PARAMS, numbers are parsed, clamped and snapped to the step,
   unknown keys are ignored, and nothing here ever produces markup.

   Storage is `ssb:prefs` (tier), guarded: a blocked or full localStorage is
   a no-op, never an exception (docs/decisions.md section 3).
   ============================================================= */

export const TIER_MIN = 1;
export const TIER_MAX = 3;
export const TIER_DEFAULT = 1;
export const PREFS_KEY = 'ssb:prefs';
const HASH_MAX = 2048;

/* Rendering quality (`q=` in the hash): an exact, case-sensitive whitelist.
   Anything else is ignored, so the device's own choice stands (materials.js). */
export const QUALITIES = Object.freeze(['full', 'lite']);
export function clampQuality(value) {
    return typeof value === 'string' && QUALITIES.includes(value) ? value : null;
}

/* Any input -> an integer tier in [1, 3], or null when it is not a number. */
export function clampTier(value) {
    if (typeof value === 'string' && value.trim() === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.min(TIER_MAX, Math.max(TIER_MIN, Math.round(n)));
}

/* ---------------- variant lab parameters ---------------- */

const own = (o, k) => o !== null && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

/* One diorama PARAMS entry + any input -> an allowed value, or null when the
   input is not a finite number. Ranges clamp to [min, max] and snap to the
   step; a param with `options` snaps to the nearest option value. */
export function clampParam(p, raw) {
    if (raw === null || raw === undefined || typeof raw === 'boolean') return null;
    if (typeof raw === 'string' && raw.trim() === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (Array.isArray(p.options) && p.options.length) {
        let best = p.options[0].value;
        for (const o of p.options) if (Math.abs(o.value - n) < Math.abs(best - n)) best = o.value;
        return best;
    }
    let v = Math.min(p.max, Math.max(p.min, n));
    if (p.step > 0) v = Math.min(p.max, Math.max(p.min, p.min + Math.round((v - p.min) / p.step) * p.step));
    return Number(v.toFixed(6));
}

/* Every key of a diorama's PARAMS at its default. */
export function labDefaults(params) {
    const out = {};
    for (const p of params) out[p.key] = p.default;
    return out;
}

/* { name, params } -> the same with every value whitelisted and clamped, or
   null when the diorama is unknown. Missing keys take their defaults. */
export function normalizeLab(lab, labs) {
    if (!lab || typeof lab.name !== 'string' || !own(labs, lab.name)) return null;
    const spec = labs[lab.name];
    const params = labDefaults(spec.params);
    for (const p of spec.params) {
        const v = own(lab.params, p.key) ? clampParam(p, lab.params[p.key]) : null;
        if (v !== null) params[p.key] = v;
    }
    return { name: lab.name, params };
}

function sameLab(a, b) {
    if (a === b) return true;
    if (!a || !b || a.name !== b.name) return false;
    const keys = Object.keys(a.params);
    return keys.length === Object.keys(b.params).length && keys.every((k) => a.params[k] === b.params[k]);
}

/* '#s=<id>&tier=<n>&lab=<name>&<key>=<v>&q=<full|lite>' -> { selection?, tier?, lab?, quality? }.
   Only whitelisted keys, only valid values; anything else is dropped.
   `has(id)` is the graph's index lookup; `labs` maps a diorama name to its
   { params: PARAMS, presets: PRESETS }. A classification id naming a preset
   (`c.keros=III`) is applied first, then explicit parameters over it. */
export function parseHash(hash, has, labs = {}) {
    const out = {};
    if (typeof hash !== 'string' || hash.length > HASH_MAX) return out;
    let params;
    try { params = new URLSearchParams(hash.replace(/^#/, '')); } catch (e) { return out; }
    const s = params.get('s');
    if (s !== null && has(s)) out.selection = s;
    const t = params.get('tier');
    if (t !== null) {
        const tier = clampTier(t);
        if (tier !== null) out.tier = tier;
    }
    const name = params.get('lab');
    if (name !== null && own(labs, name)) {
        const spec = labs[name];
        const values = {};
        for (const [cid, classes] of Object.entries(spec.presets || {})) {
            const code = params.get(cid);
            if (code !== null && own(classes, code)) Object.assign(values, classes[code]);
        }
        for (const p of spec.params) {
            const raw = params.get(p.key);
            if (raw !== null) values[p.key] = raw;
        }
        out.lab = normalizeLab({ name, params: values }, labs);
    }
    const quality = clampQuality(params.get('q'));
    if (quality) out.quality = quality;
    return out;
}

const num = (v) => String(Number(Number(v).toFixed(3)));

/* State -> the canonical hash ('' when there is nothing to share). A lab
   writes its name and every parameter that differs from its default; a
   quality override is written last. */
export function formatHash(state, labs = {}) {
    const parts = [];
    if (state.selection) parts.push('s=' + encodeURIComponent(state.selection));
    if (state.selection || state.tier !== TIER_DEFAULT) parts.push('tier=' + state.tier);
    if (state.lab && own(labs, state.lab.name)) {
        parts.push('lab=' + state.lab.name);
        for (const p of labs[state.lab.name].params) {
            const v = state.lab.params[p.key];
            if (v !== undefined && v !== p.default) parts.push(p.key + '=' + num(v));
        }
    }
    if (clampQuality(state.quality)) parts.push('q=' + state.quality);
    return parts.length ? '#' + parts.join('&') : '';
}

/* ---------------- guarded storage ---------------- */

function store() {
    try { return window.localStorage; } catch (e) { return null; }
}

export function loadPrefs() {
    try {
        const raw = store().getItem(PREFS_KEY);
        const p = raw ? JSON.parse(raw) : null;
        const tier = p && clampTier(p.tier);
        return tier ? { tier } : {};
    } catch (e) { return {}; }
}

export function savePrefs(prefs) {
    try { store().setItem(PREFS_KEY, JSON.stringify({ v: 1, tier: prefs.tier })); } catch (e) { /* no-op */ }
}

/* ---------------- the store ---------------- */

/* state = { tier, selection, lab, quality }. Invariant: the selected entity's
   tier is never above `tier` (selecting a deeper entity raises the depth;
   lowering the depth below the selection closes it). `lab` is the variant-lab
   stage: null on the specimen stage, else { name, params } with every
   parameter present and clamped (normalizeLab). `quality` is the rendering
   override from the hash ('full' | 'lite'), null for the device's choice.
   Subscribers get (state, previous, meta); meta.source names the origin
   ('url', 'tree', 'search', 'panel', 'tier', 'scene', 'lab', 'slider') so
   the URL sync can tell a hash-driven change from a click, and a slider
   drag from a deliberate step. */
export function createStore({ has, tierOf, hash = '', prefs = loadPrefs(), labs = {} }) {
    const fromUrl = parseHash(hash, has, labs);
    const selection = fromUrl.selection || null;
    let state = Object.freeze({
        selection,
        tier: Math.max(fromUrl.tier || prefs.tier || TIER_DEFAULT, selection ? tierOf(selection) : TIER_MIN),
        lab: fromUrl.lab || null,
        quality: fromUrl.quality || null,
    });
    const subs = new Set();

    function set(patch, meta = {}) {
        const prev = state;
        const next = { ...prev, ...patch };
        if (next.tier === prev.tier && next.selection === prev.selection && sameLab(next.lab, prev.lab) && next.quality === prev.quality) return false;
        if (sameLab(next.lab, prev.lab)) next.lab = prev.lab;
        state = Object.freeze(next);
        for (const fn of [...subs]) {
            try { fn(state, prev, meta); } catch (e) { console.error(e); }
        }
        return true;
    }

    return {
        get: () => state,
        subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
        select(id, meta) {
            if (id === null) return set({ selection: null }, meta);
            if (!has(id)) return false;
            return set({ selection: id, tier: Math.max(state.tier, tierOf(id)) }, meta);
        },
        setTier(value, meta = { source: 'tier' }) {
            const tier = clampTier(value);
            if (tier === null || tier === state.tier) return false;
            savePrefs({ tier });
            const closes = state.selection && tierOf(state.selection) > tier;
            return set(closes ? { tier, selection: null } : { tier }, meta);
        },
        /* Enter or change the variant lab ({ name, params }), or leave it
           (null). Parameters are whitelisted and clamped here too, so a UI
           bug cannot put an out-of-range value in the state or the URL. */
        setLab(lab, meta = { source: 'lab' }) {
            if (lab === null) return set({ lab: null }, meta);
            const next = normalizeLab(lab, labs);
            return next ? set({ lab: next }, meta) : false;
        },
        /* Adopt a location.hash (Back/Forward, a pasted link, a hand edit). */
        applyHash(next) {
            const p = parseHash(next, has, labs);
            const selection = p.selection || null;
            const tier = Math.max(p.tier || state.tier, selection ? tierOf(selection) : TIER_MIN);
            return set({ selection, tier, lab: p.lab || null, quality: p.quality || null }, { source: 'url' });
        },
        /* The canonical hash for the current state. */
        hash: () => formatHash(state, labs),
    };
}
