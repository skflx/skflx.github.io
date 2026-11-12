/* =============================================================
   state.js — the one SSB store, its URL-hash codec, and ssb:* storage.

   Everything else subscribes to this store. It imports only scope.js (pure
   math, no imports of its own: the `#scope=` codec): the graph is injected
   (`has`, `tierOf`), which keeps the module graph one-way (docs/ssb.md 6.1).
   Keys removed in earlier phases (`lab=`, `ct=`, `p=`, `step=`, `cor=`, `pop=`)
   and the phase 2 ones (`mu=`, `flap=`, `anat=`, `v=`, `dz=`) are unknown now
   and ignored like any other.

   The URL hash is the shareable state (`#s=s.uncinate-process&tier=2`,
   `#scope=t.frontal-recess-70.R&q=lite`) and is untrusted input
   (docs/security.md rule 4): parsing is whitelist-only, ids must exist in the
   graph index, the 3D cursor is three finite numbers clamped to the volume's
   bounds, an endoscope pose is six fields with a whitelisted side and lens and
   clamped numbers, or a station link `t.<id>[.<side>]` that only names a lookup
   key (scope.js). Numbers are parsed and clamped, unknown keys are ignored, and
   nothing here ever produces markup.

   Storage is `ssb:prefs` (tier), guarded: a blocked or full localStorage is
   a no-op, never an exception (docs/decisions.md section 3).
   ============================================================= */

import { parseScope, parseStationLink, formatScope, clampPose, samePose } from './scope.js?v=c2522180';

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

/* ---------------- CT (the cursor only) ---------------- */

/* The three section planes (the Specimen's section control). */
export const CT_PLANES = Object.freeze(['axial', 'coronal', 'sagittal']);
export const CT_SANE = 1000;   /* mm: the limit until the volume's own bounds are known */

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

function sameAt(a, b) {
    if (a === b) return true;
    return !!a && !!b && a.every((v, n) => v === b[n]);
}

/* ---------------- the Specimen camera ---------------- */

const CAM_MAX = 2000;   /* mm: a camera or target farther than this from the origin is not a view of the head */

/* 'px,py,pz,tx,ty,tz' (RAS mm: the camera position, then its target) -> the six numbers rounded to 0.1 mm, or null
   when it is anything else or the two points are not a sane distance apart. */
export function parseCam(raw) {
    if (typeof raw !== 'string' || raw.length > 128) return null;
    const parts = raw.split(',');
    if (parts.length !== 6) return null;
    const v = parts.map((x) => (x.trim() === '' ? NaN : Number(x)));
    if (!v.every((n) => Number.isFinite(n) && Math.abs(n) <= CAM_MAX)) return null;
    const d = Math.hypot(v[0] - v[3], v[1] - v[4], v[2] - v[5]);
    if (!(d >= 5 && d <= CAM_MAX)) return null;
    return v.map((n) => Math.round(n * 10) / 10);
}

/* Six numbers (RAS mm) -> the hash text. */
export function camText(cam) {
    return cam.map((v) => String(Number(Number(v).toFixed(1)))).join(',');
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

/* '#s=<id>&tier=<n>&scope=<pose>&at=<r,a,s>&q=<full|lite>'
   -> { selection?, tier?, scope?, station?, cursor?, quality? } (`scope=t.<id>` is a station
   link, `station`, kept as text until the endoscope has read the station table and calls resolveStation; `at` is
   the 3D cursor, `cursor`). Unknown keys are ignored. `has(id)` is the graph's index lookup. */
export function parseHash(hash, has) {
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
    const scopeText = params.get('scope');
    const scope = parseScope(scopeText);
    if (scope) out.scope = scope;
    else if (parseStationLink(scopeText)) out.station = scopeText;
    const at = parseCtAt(params.get('at'));
    if (at) out.cursor = at;
    const cam = parseCam(params.get('cam'));
    if (cam) out.camera = cam;
    const quality = clampQuality(params.get('q'));
    if (quality) out.quality = quality;
    return out;
}

const atText = (at) => at.map((v) => String(Number(Number(v).toFixed(2)))).join(',');

/* State -> the canonical hash ('' when there is nothing to share). The endoscope writes its pose alone (the shared
   cursor, `at`, is deliberately not written then, so a reload opens the specimen at its default cut); the specimen its
   3D cursor alone (`at=`). */
export function formatHash(state) {
    const parts = [];
    if (state.selection) parts.push('s=' + encodeURIComponent(state.selection));
    if (state.selection || state.tier !== TIER_DEFAULT) parts.push('tier=' + state.tier);
    if (state.scope) parts.push('scope=' + formatScope(state.scope));
    else if (state.station && parseStationLink(state.station)) parts.push('scope=' + state.station);      /* a link not yet resolved to a pose survives a rewrite of the address bar */
    else if (state.cursor) parts.push('at=' + atText(state.cursor));
    if (state.camera && !state.scope && !state.station) parts.push('cam=' + camText(state.camera));
    if (clampQuality(state.quality)) parts.push('q=' + state.quality);
    return parts.length ? '#' + parts.join('&') : '';
}

/* ---------------- the store ---------------- */

/* state = { tier, selection, scope, station, cursor, camera, quality }. Invariant: the
   selected entity's tier is never above `tier` (selecting a deeper entity
   raises the depth; lowering the depth below the selection closes it). The
   stage is the specimen, or the endoscope (`scope`: a whole pose, scope.js, shown on the specimen).
   `station` is a station link (`t.<id>[.<side>]`) waiting for the endoscope to turn it into a pose (resolveStation);
   it is never set with a scope pose.
   `cursor` is the one 3D cursor in RAS mm, clamped to the volume's bounds (setCtBounds hands them in; until then a
   sanity range). `quality` is the rendering override from the hash ('full' | 'lite'), null for the device's choice.
   Subscribers get (state, previous, meta); meta.source names the origin
   ('url', 'tree', 'search', 'panel', 'tier', 'scene', 'scope', 'cursor', 'ct-bounds', …) so the URL sync can tell
   a hash-driven change from a click. */
export function createStore({ has, tierOf, hash = '', prefs = loadPrefs() }) {
    const fromUrl = parseHash(hash, has);
    const selection = fromUrl.selection || null;
    let ctBounds = null;
    let state = Object.freeze({
        selection,
        tier: Math.max(fromUrl.tier || prefs.tier || TIER_DEFAULT, selection ? tierOf(selection) : TIER_MIN),
        scope: fromUrl.scope || null,
        station: fromUrl.scope ? null : fromUrl.station || null,
        cursor: clampAt(fromUrl.cursor, ctBounds),
        camera: fromUrl.camera || null,
        quality: fromUrl.quality || null,
    });
    const subs = new Set();

    function set(patch, meta = {}) {
        const prev = state;
        const next = { ...prev, ...patch };
        if (next.tier === prev.tier && next.selection === prev.selection
            && samePose(next.scope, prev.scope) && next.station === prev.station && sameAt(next.cursor, prev.cursor) && sameAt(next.camera, prev.camera) && next.quality === prev.quality) return false;
        if (samePose(next.scope, prev.scope)) next.scope = prev.scope;
        if (sameAt(next.cursor, prev.cursor)) next.cursor = prev.cursor;
        if (sameAt(next.camera, prev.camera)) next.camera = prev.camera;
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
        /* Enter or change the endoscope (a whole pose, clamped here too), or leave it (null, back to the specimen). */
        setScope(pose, meta = { source: 'scope' }) {
            if (pose === null) return set({ scope: null }, meta);
            const next = clampPose(pose);
            return next ? set({ scope: next, station: null }, meta) : false;
        },
        /* Turn a pending station link into its pose (a whole pose) or drop it (null: an unknown station, or no
           table). The one writer of `station` besides the hash. */
        resolveStation(pose, meta = { source: 'url' }) {
            if (!state.station) return false;
            return set({ station: null, scope: pose ? clampPose(pose) : null }, meta);
        },
        /* Move the 3D cursor (RAS mm, clamped), or clear it (null). Never changes the stage. */
        setCursor(at, meta = { source: 'cursor' }) {
            const p = at === null ? null : clampAt(at, ctBounds);
            if (at !== null && !p) return false;
            return set({ cursor: p }, meta);
        },
        /* The Specimen's camera (RAS mm: position, then target), or null for the default view. Never changes the stage. */
        setCamera(cam, meta = { source: 'camera' }) {
            const c = cam === null ? null : parseCam(camText(cam));
            if (cam !== null && !c) return false;
            return set({ camera: c }, meta);
        },
        /* The loaded volume's RAS box ({ min, max }): later cursors clamp to it, and the current one is re-clamped now. */
        setCtBounds(bounds) {
            ctBounds = bounds && ctLimits(bounds) === bounds ? bounds : null;
            return set({ cursor: clampAt(state.cursor, ctBounds) }, { source: 'ct-bounds' });
        },
        /* Back to the specimen stage. */
        leaveStage(meta = { source: 'stage' }) { return set({ scope: null, station: null }, meta); },
        /* Adopt a location.hash (Back/Forward, a pasted link, a hand edit). */
        applyHash(next) {
            const p = parseHash(next, has);
            const selection = p.selection || null;
            const tier = Math.max(p.tier || state.tier, selection ? tierOf(selection) : TIER_MIN);
            return set({
                selection, tier, scope: p.scope || null, station: p.scope ? null : p.station || null,
                cursor: clampAt(p.cursor, ctBounds), camera: p.camera || null, quality: p.quality || null,
            }, { source: 'url' });
        },
        /* The canonical hash for the current state. */
        hash: () => formatHash(state),
    };
}
