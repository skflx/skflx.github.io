/* =============================================================
   state.js — the one SSB store, its URL-hash codec, and ssb:* storage.

   Everything else subscribes to this store. It imports only scope.js (pure
   math, no imports of its own: the `#scope=` codec): the graph is injected
   (`has`, `tierOf`), which keeps the module graph one-way (docs/ssb.md 7.1).

   The URL hash is the shareable state (`#s=s.uncinate-process&tier=2`,
   `#lab=ethmoid-roof&keros=12&q=lite`, `#ct=cor&at=12.5,31,48`) and is
   untrusted input (docs/security.md rule 4): parsing is whitelist-only, ids
   must exist in the graph index, a diorama name must be in the injected
   registry and its keys in that diorama's PARAMS, a CT plane is one of
   three names and its crosshair is three finite numbers clamped to the
   volume's bounds, an endoscope pose is six fields with a whitelisted side
   and lens and clamped numbers (scope.js), numbers are parsed, clamped and snapped to the step,
   unknown keys are ignored, and nothing here ever produces markup.

   Storage is `ssb:prefs` (tier), guarded: a blocked or full localStorage is
   a no-op, never an exception (docs/decisions.md section 3).
   ============================================================= */

import { parseScope, formatScope, clampPose, samePose } from './scope.js?v=4ee7f38a';

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

/* '#s=<id>&tier=<n>&lab=<name>&<key>=<v>&ct=<plane>&at=<r,a,s>&scope=<pose>&q=<full|lite>'
   -> { selection?, tier?, lab?, ct?, scope?, cursor?, quality? } (a lab wins over
   a ct, a ct over a scope; `at` without a plane is the specimen's 3D cursor,
   `cursor`).
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
    const plane = out.lab ? null : clampCtPlane(params.get('ct'));
    const at = parseCtAt(params.get('at'));
    const scope = out.lab || plane ? null : parseScope(params.get('scope'));
    if (scope) out.scope = scope;
    if (plane) out.ct = { plane, at };
    else if (at && !out.lab && params.get('ct') === null) out.cursor = at;     /* a bad `ct` still ignores the whole stage */
    const quality = clampQuality(params.get('q'));
    if (quality) out.quality = quality;
    return out;
}

const num = (v) => String(Number(Number(v).toFixed(3)));
const atText = (at) => at.map((v) => String(Number(Number(v).toFixed(2)))).join(',');

/* State -> the canonical hash ('' when there is nothing to share). A lab
   writes its name and every parameter that differs from its default; the CT
   stage its plane and crosshair; the specimen its 3D cursor alone (`at=`);
   a quality override is written last. */
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
    if (state.ct && !state.lab && clampCtPlane(state.ct.plane)) {
        parts.push('ct=' + CT_CODE[state.ct.plane]);
        if (state.ct.at) parts.push('at=' + atText(state.ct.at));
    } else if (!state.lab && state.scope) parts.push('scope=' + formatScope(state.scope));      /* the link is the pose alone: the shared cursor (`at`) is deliberately not written, so a reload opens CT at the volume centre */
    else if (!state.lab && state.cursor) parts.push('at=' + atText(state.cursor));
    if (clampQuality(state.quality)) parts.push('q=' + state.quality);
    return parts.length ? '#' + parts.join('&') : '';
}

/* ---------------- CT ---------------- */

/* The CT stage: a plane (the one that scrolls and is shown on phones) and the
   crosshair in RAS mm. `at` is null until the reader moves it (the viewer
   then sits at the volume's centre). */
export const CT_PLANES = Object.freeze(['axial', 'coronal', 'sagittal']);
const CT_CODE = Object.freeze({ axial: 'ax', coronal: 'cor', sagittal: 'sag' });
export const CT_SANE = 1000;   /* mm: the limit until the volume's own bounds are known */

/* 'ax' | 'cor' | 'sag' (or the full name), exactly -> the plane name, else null. */
export function clampCtPlane(value) {
    if (typeof value !== 'string') return null;
    for (const [plane, code] of Object.entries(CT_CODE)) if (value === code || value === plane) return plane;
    return null;
}

/* 'r,a,s' -> [r, a, s] (three finite numbers), or null when it is anything else. */
export function parseCtAt(raw) {
    if (typeof raw !== 'string' || raw.length > 96) return null;
    const parts = raw.split(',');
    if (parts.length !== 3) return null;
    const at = [];
    for (const part of parts) {
        if (part.trim() === '') return null;
        const n = Number(part);
        if (!Number.isFinite(n)) return null;
        at.push(n);
    }
    return at;
}

/* bounds: { min: [r, a, s], max: [r, a, s] } or null (then +/- CT_SANE). */
function ctLimits(bounds) {
    const ok = bounds && [bounds.min, bounds.max].every((b) => Array.isArray(b) && b.length === 3 && b.every(Number.isFinite));
    return ok ? bounds : { min: [-CT_SANE, -CT_SANE, -CT_SANE], max: [CT_SANE, CT_SANE, CT_SANE] };
}

/* A point -> the same clamped to the bounds (rounded to 0.001 mm; the hash
   carries two decimals), or null when it is not three finite numbers. */
export function clampAt(at, bounds = null) {
    if (!Array.isArray(at) || at.length !== 3 || !at.every(Number.isFinite)) return null;
    const { min, max } = ctLimits(bounds);
    return at.map((v, n) => Math.round(Math.min(max[n], Math.max(min[n], v)) * 1000) / 1000);
}

/* { plane, at } -> the same with the plane whitelisted and `at` clamped to the
   bounds, or null when the plane is not one of the three. */
export function normalizeCt(ct, bounds = null) {
    const plane = ct && clampCtPlane(ct.plane);
    return plane ? { plane, at: clampAt(ct.at, bounds) } : null;
}

function sameAt(a, b) {
    if (a === b) return true;
    return !!a && !!b && a.every((v, n) => v === b[n]);
}

function sameCt(a, b) {
    if (a === b) return true;
    if (!a || !b || a.plane !== b.plane) return false;
    return sameAt(a.at, b.at);
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

/* state = { tier, selection, lab, ct, scope, cursor, quality }. Invariant: the
   selected entity's tier is never above `tier` (selecting a deeper entity
   raises the depth; lowering the depth below the selection closes it). The
   stage is one of four: the specimen (lab, ct and scope all null), the variant lab
   (`lab`: { name, params } with every parameter present and clamped,
   normalizeLab), CT (`ct`: { plane, at }, normalizeCt), or the endoscope
   (`scope`: a whole pose, scope.js, shown on the specimen); entering one
   leaves the others.
   `cursor` is the one 3D cursor in RAS mm, shared by CT and the specimen: the
   CT crosshair is `ct.at`, which the store keeps equal to `cursor` while the
   CT stage shows, and `cursor` is what survives in the specimen stage (where
   `ct` is null) so a click on a 3D surface can land the CT crosshair there.
   `quality` is the rendering override from the hash ('full' | 'lite'), null
   for the device's choice. The cursor is clamped to the volume's bounds,
   which only the loaded volume knows: setCtBounds() hands them in and
   re-clamps, and until then the limit is a sanity range.
   Subscribers get (state, previous, meta); meta.source names the origin
   ('url', 'tree', 'search', 'panel', 'tier', 'scene', 'lab', 'slider', 'ct', 'scope',
   'cursor', 'ct-bounds') so the URL sync can tell a hash-driven change from
   a click, and a slider or crosshair drag from a deliberate step. */
export function createStore({ has, tierOf, hash = '', prefs = loadPrefs(), labs = {} }) {
    const fromUrl = parseHash(hash, has, labs);
    const selection = fromUrl.selection || null;
    let ctBounds = null;
    const ct0 = fromUrl.ct ? normalizeCt(fromUrl.ct, ctBounds) : null;
    let state = Object.freeze({
        selection,
        tier: Math.max(fromUrl.tier || prefs.tier || TIER_DEFAULT, selection ? tierOf(selection) : TIER_MIN),
        lab: fromUrl.lab || null,
        ct: ct0,
        scope: ct0 ? null : fromUrl.scope || null,
        cursor: ct0 ? ct0.at : clampAt(fromUrl.cursor, ctBounds),
        quality: fromUrl.quality || null,
    });
    const subs = new Set();

    function set(patch, meta = {}) {
        const prev = state;
        const next = { ...prev, ...patch };
        if (next.tier === prev.tier && next.selection === prev.selection && sameLab(next.lab, prev.lab) && sameCt(next.ct, prev.ct)
            && samePose(next.scope, prev.scope) && sameAt(next.cursor, prev.cursor) && next.quality === prev.quality) return false;
        if (sameLab(next.lab, prev.lab)) next.lab = prev.lab;
        if (sameCt(next.ct, prev.ct)) next.ct = prev.ct;
        if (samePose(next.scope, prev.scope)) next.scope = prev.scope;
        if (sameAt(next.cursor, prev.cursor)) next.cursor = prev.cursor;
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
           bug cannot put an out-of-range value in the state or the URL.
           Entering the lab leaves CT. */
        setLab(lab, meta = { source: 'lab' }) {
            if (lab === null) return set({ lab: null }, meta);
            const next = normalizeLab(lab, labs);
            return next ? set({ lab: next, ct: null, scope: null }, meta) : false;
        },
        /* Enter or change the CT stage ({ plane, at }), or leave it (null):
           the plane is whitelisted and the crosshair clamped to the bounds;
           entering without one (`at: null`) keeps the 3D cursor. Entering CT
           leaves the lab. */
        setCt(ct, meta = { source: 'ct' }) {
            if (ct === null) return set({ ct: null }, meta);
            const next = normalizeCt(ct, ctBounds);
            if (!next) return false;
            const at = next.at || state.cursor;
            return set({ ct: { plane: next.plane, at }, cursor: at, lab: null, scope: null }, meta);
        },
        /* Enter or change the endoscope ({ side, depth, yaw, pitch, roll, lens },
           clamped here too), or leave it (null, back to the specimen). Entering
           leaves the lab and CT. */
        setScope(pose, meta = { source: 'scope' }) {
            if (pose === null) return set({ scope: null }, meta);
            const next = clampPose(pose);
            return next ? set({ scope: next, lab: null, ct: null }, meta) : false;
        },
        /* Move the 3D cursor (RAS mm, clamped), or clear it (null). In the CT
           stage this is the crosshair; elsewhere it is remembered for the
           next visit. Never changes the stage. */
        setCursor(at, meta = { source: 'cursor' }) {
            const p = at === null ? null : clampAt(at, ctBounds);
            if (at !== null && !p) return false;
            return set(state.ct ? { cursor: p, ct: { plane: state.ct.plane, at: p } } : { cursor: p }, meta);
        },
        /* The loaded volume's RAS box ({ min, max }): later cursors clamp to
           it, and the current one is re-clamped now. */
        setCtBounds(bounds) {
            ctBounds = bounds && ctLimits(bounds) === bounds ? bounds : null;
            const cursor = clampAt(state.cursor, ctBounds);
            return set(state.ct ? { cursor, ct: { plane: state.ct.plane, at: cursor } } : { cursor }, { source: 'ct-bounds' });
        },
        /* Back to the specimen stage. */
        leaveStage(meta = { source: 'stage' }) { return set({ lab: null, ct: null, scope: null }, meta); },
        /* Adopt a location.hash (Back/Forward, a pasted link, a hand edit). */
        applyHash(next) {
            const p = parseHash(next, has, labs);
            const selection = p.selection || null;
            const tier = Math.max(p.tier || state.tier, selection ? tierOf(selection) : TIER_MIN);
            const ct = p.ct ? normalizeCt(p.ct, ctBounds) : null;
            const cursor = ct ? ct.at : clampAt(p.cursor, ctBounds);
            return set({ selection, tier, lab: p.lab || null, ct, scope: ct ? null : p.scope || null, cursor, quality: p.quality || null }, { source: 'url' });
        },
        /* The canonical hash for the current state. */
        hash: () => formatHash(state, labs),
    };
}
