/* =============================================================
   state.js — the one SSB store, its URL-hash codec, and ssb:* storage.

   Everything else subscribes to this store. It imports nothing: the graph
   is injected (`has`, `tierOf`), which keeps the module graph one-way
   (docs/ssb.md 7.1).

   The URL hash is the shareable state (`#s=s.uncinate-process&tier=2`) and
   is untrusted input (docs/security.md rule 4): parsing is whitelist-only,
   ids must exist in the graph index, numbers are parsed and clamped,
   unknown keys are ignored, and nothing here ever produces markup.

   Storage is `ssb:prefs` (tier), guarded: a blocked or full localStorage is
   a no-op, never an exception (docs/decisions.md section 3).
   ============================================================= */

export const TIER_MIN = 1;
export const TIER_MAX = 3;
export const TIER_DEFAULT = 1;
export const PREFS_KEY = 'ssb:prefs';
const HASH_MAX = 2048;

/* Any input -> an integer tier in [1, 3], or null when it is not a number. */
export function clampTier(value) {
    if (typeof value === 'string' && value.trim() === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.min(TIER_MAX, Math.max(TIER_MIN, Math.round(n)));
}

/* '#s=<id>&tier=<n>' -> { selection?, tier? }. Only whitelisted keys, only
   valid values; anything else is dropped. `has(id)` is the graph's index
   lookup. */
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
    return out;
}

/* State -> the canonical hash ('' when there is nothing to share). */
export function formatHash(state) {
    const parts = [];
    if (state.selection) parts.push('s=' + encodeURIComponent(state.selection));
    if (state.selection || state.tier !== TIER_DEFAULT) parts.push('tier=' + state.tier);
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

/* state = { tier, selection }. Invariant: the selected entity's tier is
   never above `tier` (selecting a deeper entity raises the depth; lowering
   the depth below the selection closes it).
   Subscribers get (state, previous, meta); meta.source names the origin
   ('url', 'tree', 'search', 'panel', 'tier') so the URL sync can tell a
   hash-driven change from a click. */
export function createStore({ has, tierOf, hash = '', prefs = loadPrefs() }) {
    const fromUrl = parseHash(hash, has);
    const selection = fromUrl.selection || null;
    let state = Object.freeze({
        selection,
        tier: Math.max(fromUrl.tier || prefs.tier || TIER_DEFAULT, selection ? tierOf(selection) : TIER_MIN),
    });
    const subs = new Set();

    function set(patch, meta = {}) {
        const prev = state;
        const next = { ...prev, ...patch };
        if (next.tier === prev.tier && next.selection === prev.selection) return false;
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
        /* Adopt a location.hash (Back/Forward, a pasted link, a hand edit). */
        applyHash(next) {
            const p = parseHash(next, has);
            const selection = p.selection || null;
            const tier = Math.max(p.tier || state.tier, selection ? tierOf(selection) : TIER_MIN);
            return set({ selection, tier }, { source: 'url' });
        },
    };
}
