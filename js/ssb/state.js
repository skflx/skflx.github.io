/* =============================================================
   state.js — the one SSB store, its URL-hash codec, and ssb:* storage.

   Everything else subscribes to this store. It imports only scope.js and flap.js (pure
   math, no imports of their own: the `#scope=` codec, the flap overlay's parameters): the graph is injected
   (`has`, `tierOf`), which keeps the module graph one-way (docs/ssb.md 7.1).
   The variant lab, the CT stage and the procedure player were removed (SSB phase 1): their keys (`lab=`, `ct=`,
   `p=`, `step=`, `cor=`, `pop=`) are unknown now and ignored like any other.

   The URL hash is the shareable state (`#s=s.uncinate-process&tier=2`,
   `#scope=t.frontal-recess-70.R&q=lite`) and is
   untrusted input (docs/security.md rule 4): parsing is whitelist-only, ids
   must exist in the graph index, the 3D cursor is three finite numbers clamped to the
   volume's bounds, an endoscope pose is six fields with a whitelisted side
   and lens and clamped numbers, or a station link `t.<id>[.<side>]` that only
   names a lookup key (scope.js), numbers are parsed and clamped,
   unknown keys are ignored, and nothing here ever produces markup.

   The anatomy state (`anat=`, `v=`, `dz=`, docs/ssb.md §14, R6.4) is whitelisted against a registry built from
   ssb/anatomy/index.json (buildAnatomyRegistry): an id the index or the graph does not list, a side or preset the entity
   does not offer, a base it is not built on, or a pair the registry does not allow drops the whole anatomy key, never
   a part of it. The index loads after the store exists, so a link's anatomy waits as `pending` (shape-checked only, and
   still written back to the address bar) until setAnatomyRegistry resolves it.

   Storage is `ssb:prefs` (tier), guarded: a blocked or full localStorage is
   a no-op, never an exception (docs/decisions.md section 3).
   ============================================================= */

import { parseScope, parseStationLink, formatScope, clampPose, samePose } from './scope.js?v=c2522180';
import { DESIGNS, SIDES, PARAMS, PARAM_DEFAULTS } from './flap.js?v=09a0f730';

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

/* The mucosal state (`mu=` in the hash, docs/ssb.md 5.9): decongested, as scanned (the default) or congested. An exact,
   case-sensitive whitelist, like the quality. A procedure always plays decongested, whatever this says. */
export const MU_MODES = Object.freeze(['dec', 'scan', 'cong']);
export const MU_DEFAULT = 'scan';
export function clampMu(value) {
    return typeof value === 'string' && MU_MODES.includes(value) ? value : null;
}


/* ---------------- anatomy state (docs/ssb.md §14, R2.1, 6.3, 6.4) ---------------- */

/* `anat=standard|scanned|scanned-b` + `v=<v-id>.<R|L>[:<preset>],…` + `dz=<dz-id>.<R|L|M>[:<preset>],…`. The base is a layer
   under the variants, the variants under the conditions, applied in that order. `standard` (the mirrored reference
   head) is always valid; every other base, and every variant or condition, exists only if ssb/anatomy/index.json lists it. */
export const ANAT_BASES = Object.freeze(['standard', 'scanned', 'scanned-b']);
export const ANAT_STANDARD = 'standard';
export const ANATOMY_DEFAULT = Object.freeze({ base: ANAT_STANDARD, variants: Object.freeze([]), conditions: Object.freeze([]) });
export const ANAT_LIST_MAX = 8;
export const ANAT_SIDES = Object.freeze(['R', 'L', 'M']);
const ANAT_TOKEN = '[a-z0-9]+(?:-[a-z0-9]+)*';
const ANAT_ID = { v: new RegExp(`^v\\.${ANAT_TOKEN}$`), dz: new RegExp(`^dz\\.${ANAT_TOKEN}$`) };
const ANAT_PRESET = new RegExp(`^${ANAT_TOKEN}$`);
const ANAT_REF = new RegExp(`^((?:v|dz)\\.${ANAT_TOKEN})\\.(R|L|M)(?::(${ANAT_TOKEN}))?$`);
const ANAT_TEXT_MAX = 512;

/* ssb/anatomy/index.json + the graph's `has` -> the registry the whitelist reads:
   { bases: Set (non-standard, listed), defaultBase, variants: Map(id -> entity), conditions: Map, compat: Set('a|b') }.
   An entity is { id, sides, presets, default, bases, region, boxes: { R?: { min, max } } } (boxes in RAS mm, the patch's
   extent). Entries with a bad id, an id the graph lacks, no side or no preset are dropped, never repaired. Pure. */
export function buildAnatomyRegistry(doc, has = () => true) {
    const reg = { bases: new Set(), defaultBase: ANAT_STANDARD, variants: new Map(), conditions: new Map(), compat: new Set() };
    if (!doc || typeof doc !== 'object' || doc.version !== 1) return reg;
    if (doc.bases && typeof doc.bases === 'object') {
        for (const name of Object.keys(doc.bases)) if (name !== ANAT_STANDARD && ANAT_BASES.includes(name)) reg.bases.add(name);
    }
    if (reg.bases.has('scanned')) reg.defaultBase = 'scanned';       /* owner RA-O3: variants and pathology sit on the real, asymmetric head by default */
    const point = (a) => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite);
    const collect = (src, prefix, into) => {
        if (!src || typeof src !== 'object') return;
        for (const [id, def] of Object.entries(src)) {
            if (!ANAT_ID[prefix].test(id) || !has(id) || !def || typeof def !== 'object') continue;
            const sides = Array.isArray(def.sides) ? [...new Set(def.sides.filter((x) => ANAT_SIDES.includes(x)))] : [];
            const presets = Array.isArray(def.presets) ? [...new Set(def.presets.filter((x) => typeof x === 'string' && ANAT_PRESET.test(x) && x.length <= 40))] : [];
            if (!sides.length || !presets.length) continue;
            const fallback = reg.bases.size ? [ANAT_STANDARD, ...reg.bases] : [ANAT_STANDARD];
            const bases = Array.isArray(def.bases) ? def.bases.filter((b) => b === ANAT_STANDARD || reg.bases.has(b)) : fallback;
            const boxes = {};
            if (def.boxes && typeof def.boxes === 'object') {
                for (const side of sides) {
                    const b = own(def.boxes, side) ? def.boxes[side] : null;
                    if (b && point(b.min) && point(b.max) && b.min.every((v, n) => v <= b.max[n])) boxes[side] = { min: b.min.slice(), max: b.max.slice() };
                }
            }
            into.set(id, {
                id, sides, presets, bases,
                default: typeof def.default === 'string' && presets.includes(def.default) ? def.default : presets[0],
                region: typeof def.region === 'string' && ANAT_PRESET.test(def.region) ? def.region : '',
                boxes,
            });
        }
    };
    collect(doc.variants, 'v', reg.variants);
    collect(doc.conditions, 'dz', reg.conditions);
    if (Array.isArray(doc.compat)) {
        for (const pair of doc.compat) {
            if (!Array.isArray(pair) || pair.length !== 2 || !pair.every((r) => typeof r === 'string' && ANAT_REF.test(r))) continue;
            reg.compat.add([pair[0], pair[1]].sort().join('|'));
        }
    }
    return reg;
}

/* Does the registry list anything to pick (a non-standard base, a variant or a condition)? */
export const anatomyListed = (reg) => !!reg && (reg.bases.size > 0 || reg.variants.size > 0 || reg.conditions.size > 0);

/* 'a.R:typical,b.L' -> [{ id, side, preset|null }], or null when anything is not a well-formed ref of that kind. */
function parseAnatomyRefs(text, kind) {
    if (text === null || text === '') return [];
    if (typeof text !== 'string' || text.length > ANAT_TEXT_MAX) return null;
    const out = [];
    for (const part of text.split(',')) {
        const m = ANAT_REF.exec(part);
        if (!m || !ANAT_ID[kind].test(m[1])) return null;
        out.push({ id: m[1], side: m[2], preset: m[3] || null });
    }
    return out.length <= ANAT_LIST_MAX ? out : null;
}

/* URLSearchParams -> the anatomy as the link wrote it, shape-checked only: { base: string|null, variants, conditions },
   `undefined` when the link has no anatomy key, `null` when it has one that is not well formed. */
function parseAnatomyRaw(params) {
    const anat = params.get('anat');
    const v = params.get('v');
    const dz = params.get('dz');
    if (anat === null && v === null && dz === null) return undefined;
    if (anat !== null && !ANAT_BASES.includes(anat)) return null;
    const variants = parseAnatomyRefs(v, 'v');
    const conditions = parseAnatomyRefs(dz, 'dz');
    if (!variants || !conditions) return null;
    return { base: anat, variants, conditions };
}

const refKey = (r) => `${r.id}.${r.side}`;
function boxesOverlap(a, b) {
    return a && b && [0, 1, 2].every((n) => a.min[n] <= b.max[n] && b.min[n] <= a.max[n]);
}

/* The compatibility rules of 6.3 for an ordered list of resolved refs: no ref twice; one condition (v1); one variant per
   side per region (when the index names a region); and two different refs only when the pipeline built and tested the
   pair (`compat`) or the index gives both an extent and the extents do not overlap. */
function compatible(refs, reg) {
    const seen = new Set();
    const conditions = refs.filter((r) => r.entity.id.startsWith('dz.'));
    if (conditions.length > 1) return false;
    for (const r of refs) {
        const key = refKey(r);
        if (seen.has(key)) return false;
        seen.add(key);
    }
    for (let i = 0; i < refs.length; i++) {
        for (let j = i + 1; j < refs.length; j++) {
            const a = refs[i];
            const b = refs[j];
            if (reg.compat.has([refKey(a), refKey(b)].sort().join('|'))) continue;
            const ea = a.entity.boxes[a.side];
            const eb = b.entity.boxes[b.side];
            if (!ea || !eb || boxesOverlap(ea, eb)) return false;
            if (a.entity.region && a.entity.region === b.entity.region && a.side === b.side) return false;
        }
    }
    return true;
}

/* { base, variants, conditions } (a link's raw form, or a canonical one) + the registry -> the canonical anatomy
   { base, variants: [{ id, side, preset }], conditions }, every preset explicit, or null when ANY part is not allowed. */
export function resolveAnatomy(raw, reg) {
    if (!raw || typeof raw !== 'object' || !reg) return null;
    const entries = (raw.variants || []).length + (raw.conditions || []).length;
    const base = typeof raw.base === 'string' ? raw.base : entries ? reg.defaultBase : ANAT_STANDARD;
    if (base !== ANAT_STANDARD && !reg.bases.has(base)) return null;
    const refs = [];
    const take = (list, map) => {
        const out = [];
        for (const r of list || []) {
            if (!r || typeof r.id !== 'string' || !map.has(r.id)) return null;
            const entity = map.get(r.id);
            const preset = r.preset === null || r.preset === undefined ? entity.default : r.preset;
            if (!ANAT_SIDES.includes(r.side) || !entity.sides.includes(r.side) || !entity.presets.includes(preset) || !entity.bases.includes(base)) return null;
            out.push({ id: r.id, side: r.side, preset });
            refs.push({ id: r.id, side: r.side, entity });
        }
        return out;
    };
    const variants = take(raw.variants, reg.variants);
    const conditions = take(raw.conditions, reg.conditions);
    if (!variants || !conditions || variants.length > ANAT_LIST_MAX || !compatible(refs, reg)) return null;
    if (base === ANAT_STANDARD && !variants.length && !conditions.length) return ANATOMY_DEFAULT;
    return { base, variants, conditions };
}

export function sameAnatomy(a, b) {
    if (a === b) return true;
    if (!a || !b || a.base !== b.base || !!a.pending !== !!b.pending) return false;
    const same = (x, y) => x.length === y.length && x.every((r, n) => r.id === y[n].id && r.side === y[n].side && r.preset === y[n].preset);
    return same(a.variants, b.variants) && same(a.conditions, b.conditions);
}

/* Is the anatomy anything but the plain standard head (and resolved, so a pending link counts as the standard head)? */
export const anatomyIsDefault = (a) => !a || a.pending === true || (a.base === ANAT_STANDARD && !a.variants.length && !a.conditions.length);

/* The hash text of an anatomy, canonical: the base, then the variants, then the conditions, each ref with its preset
   (a link may leave a preset out; the canonical form never does, so it parses back to itself without a registry).
   A pending anatomy (not yet resolved against the index) writes back what the link said. */
export function formatAnatomy(a) {
    if (!a || (a.base === ANAT_STANDARD && !a.variants.length && !a.conditions.length && !a.pending)) return [];
    const ref = (r) => `${r.id}.${r.side}${r.preset ? ':' + r.preset : ''}`;
    const parts = [];
    if (a.base && ANAT_BASES.includes(a.base)) parts.push('anat=' + a.base);
    if (a.variants.length) parts.push('v=' + a.variants.map(ref).join(','));
    if (a.conditions.length) parts.push('dz=' + a.conditions.map(ref).join(','));
    return parts;
}


/* ---------------- parameters (flap overlay) ---------------- */

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

/* ---------------- flap overlay ---------------- */

/* The nasoseptal flap overlay (`flap=<design>.<side>&top=&ant=&fw=&win=`, flap.js, docs/ssb.md 5.7): { design, side, params }
   with every parameter present and clamped. It is an overlay on the specimen, not a stage, so it rides along with any
   stage and is written to the hash only on the specimen and the scope. */
export function normalizeFlap(flap) {
    if (!flap || typeof flap.design !== 'string' || !DESIGNS.includes(flap.design)) return null;
    const side = SIDES.includes(flap.side) ? flap.side : 'R';
    const params = { ...PARAM_DEFAULTS };
    for (const p of PARAMS) {
        const v = own(flap.params, p.key) ? clampParam(p, flap.params[p.key]) : null;
        if (v !== null) params[p.key] = v;
    }
    return { design: flap.design, side, params };
}

function sameFlap(a, b) {
    if (a === b) return true;
    if (!a || !b || a.design !== b.design || a.side !== b.side) return false;
    return PARAMS.every((p) => a.params[p.key] === b.params[p.key]);
}

const FLAP_VALUE = /^([a-z]+)(?:\.([RL]))?$/;
function parseFlap(params) {
    const raw = params.get('flap');
    const m = typeof raw === 'string' && raw.length <= 16 ? FLAP_VALUE.exec(raw) : null;
    if (!m || !DESIGNS.includes(m[1])) return null;
    const values = {};
    for (const p of PARAMS) {
        const v = params.get(p.hash);
        if (v !== null) values[p.key] = v;
    }
    return normalizeFlap({ design: m[1], side: m[2] || 'R', params: values });
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
/* '#s=<id>&tier=<n>&scope=<pose>&at=<r,a,s>&q=<full|lite>&mu=<dec|scan|cong>&anat…&flap…'
   -> { selection?, tier?, scope?, station?, cursor?, quality?, mu?, anatomy?, flap? } (`scope=t.<id>` is a station
   link, `station`, kept as text until the endoscope has read the station table and calls resolveStation; `at` is
   the 3D cursor, `cursor`). Unknown keys (including the removed `lab=`, `ct=`, `p=`) are ignored.
   `anat`/`v`/`dz` -> `anatomy`: resolved against the registry (the 4th argument; the whole key is dropped if any part is
   not allowed), or, before the index has loaded (none given), kept as `{ ..., pending: true }` after a shape check.
   Only whitelisted keys, only valid values; anything else is dropped. `has(id)` is the graph's index lookup. */
export function parseHash(hash, has, registry = null) {
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
    const quality = clampQuality(params.get('q'));
    if (quality) out.quality = quality;
    const mu = clampMu(params.get('mu'));
    if (mu) out.mu = mu;
    const anatomy = parseAnatomyRaw(params);
    if (anatomy) {
        if (registry) {
            const resolved = resolveAnatomy(anatomy, registry);
            if (resolved) out.anatomy = resolved;
        } else out.anatomy = { base: anatomy.base, variants: anatomy.variants, conditions: anatomy.conditions, pending: true };
    }
    const flap = parseFlap(params);
    if (flap) out.flap = flap;
    return out;
}

const num = (v) => String(Number(Number(v).toFixed(3)));
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
    if (state.flap) {
        const f = normalizeFlap(state.flap);
        if (f) {
            parts.push(`flap=${f.design}.${f.side}`);
            for (const p of PARAMS) if (p.designs.includes(f.design) && f.params[p.key] !== p.default) parts.push(p.hash + '=' + num(f.params[p.key]));
        }
    }
    parts.push(...formatAnatomy(state.anatomy));        /* orthogonal to the stage: it rides along with any of them */
    if (clampMu(state.mu) && state.mu !== MU_DEFAULT) parts.push('mu=' + state.mu);
    if (clampQuality(state.quality)) parts.push('q=' + state.quality);
    return parts.length ? '#' + parts.join('&') : '';
}

/* ---------------- the store ---------------- */

/* state = { tier, selection, scope, station, cursor, quality, mu, flap, anatomy, anatomyIndex }. Invariant: the
   selected entity's tier is never above `tier` (selecting a deeper entity
   raises the depth; lowering the depth below the selection closes it). The
   stage is the specimen, or the endoscope (`scope`: a whole pose, scope.js, shown on the specimen).
   `station` is a station link (`t.<id>[.<side>]`) waiting for the endoscope to turn it into a pose (resolveStation);
   it is never set with a scope pose.
   `cursor` is the one 3D cursor in RAS mm, clamped to the volume's bounds (setCtBounds hands them in; until then a
   sanity range). `quality` is the rendering override from the hash ('full' | 'lite'), null for the device's choice.
   `mu` is the mucosal state ('dec' | 'scan' | 'cong', default 'scan'). `flap` ({ design, side, params }, normalizeFlap)
   is the nasoseptal flap overlay on the specimen (flap.js). `anatomy` ({ base, variants, conditions }, resolveAnatomy;
   ANATOMY_DEFAULT is the standard head) is the layer stack over the volume, independent of the stage; while the index
   has not loaded it is `pending` (shape-checked, not yet whitelisted). `anatomyIndex` is the registry
   (buildAnatomyRegistry) once setAnatomyRegistry has been called, else null.
   Subscribers get (state, previous, meta); meta.source names the origin
   ('url', 'tree', 'search', 'panel', 'tier', 'scene', 'slider', 'scope', 'cursor', 'ct-bounds', …) so the URL sync can tell
   a hash-driven change from a click, and a slider drag from a deliberate step. */
export function createStore({ has, tierOf, hash = '', prefs = loadPrefs(), anatomyDoc = null }) {
    let registry = anatomyDoc ? buildAnatomyRegistry(anatomyDoc, has) : null;
    const fromUrl = parseHash(hash, has, registry);
    const selection = fromUrl.selection || null;
    let ctBounds = null;
    let state = Object.freeze({
        selection,
        tier: Math.max(fromUrl.tier || prefs.tier || TIER_DEFAULT, selection ? tierOf(selection) : TIER_MIN),
        scope: fromUrl.scope || null,
        station: fromUrl.scope ? null : fromUrl.station || null,
        cursor: clampAt(fromUrl.cursor, ctBounds),
        quality: fromUrl.quality || null,
        mu: fromUrl.mu || MU_DEFAULT,
        flap: fromUrl.flap || null,
        anatomy: fromUrl.anatomy || ANATOMY_DEFAULT,
        anatomyIndex: registry,
    });
    const subs = new Set();

    function set(patch, meta = {}) {
        const prev = state;
        const next = { ...prev, ...patch };
        /* The endoscope reads the standard head's volume only, so a non-standard base never rides with it: the later
           choice wins. Picking a base leaves the scope; entering the scope goes back to the standard head. */
        if (next.anatomy && !next.anatomy.pending && next.anatomy.base !== ANAT_STANDARD && (next.scope || next.station)) {
            if (own(patch, 'anatomy') && !sameAnatomy(next.anatomy, prev.anatomy)) Object.assign(next, { scope: null, station: null });
            else next.anatomy = ANATOMY_DEFAULT;
        }
        if (next.tier === prev.tier && next.selection === prev.selection
            && samePose(next.scope, prev.scope) && next.station === prev.station && sameAt(next.cursor, prev.cursor) && next.quality === prev.quality
            && next.mu === prev.mu && sameFlap(next.flap, prev.flap)
            && sameAnatomy(next.anatomy, prev.anatomy) && next.anatomyIndex === prev.anatomyIndex) return false;
        if (sameAnatomy(next.anatomy, prev.anatomy)) next.anatomy = prev.anatomy;
        if (sameFlap(next.flap, prev.flap)) next.flap = prev.flap;
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
        /* The loaded volume's RAS box ({ min, max }): later cursors clamp to it, and the current one is re-clamped now. */
        setCtBounds(bounds) {
            ctBounds = bounds && ctLimits(bounds) === bounds ? bounds : null;
            return set({ cursor: clampAt(state.cursor, ctBounds) }, { source: 'ct-bounds' });
        },
        /* The mucosal state (decongested | as scanned | congested): any other value is ignored. Never changes the stage. */
        setMu(mu, meta = { source: 'mu' }) {
            const next = clampMu(mu);
            return next ? set({ mu: next }, meta) : false;
        },
        /* The nasoseptal flap overlay ({ design, side, params }, whitelisted and clamped here too), or off (null). */
        setFlap(flap, meta = { source: 'flap' }) {
            if (flap === null) return set({ flap: null }, meta);
            const next = normalizeFlap(flap);
            return next ? set({ flap: next }, meta) : false;
        },
        /* The anatomy stack ({ base, variants, conditions }), or null for the standard head. Whitelisted against the
           registry here too: anything the registry does not allow is refused (false) and the state is left as it was. */
        setAnatomy(anatomy, meta = { source: 'anatomy' }) {
            if (anatomy === null) return set({ anatomy: ANATOMY_DEFAULT }, meta);
            const next = registry ? resolveAnatomy(anatomy, registry) : null;
            return next ? set({ anatomy: next }, meta) : false;
        },
        /* Hand in ssb/anatomy/index.json's parsed body (or null: the page has none). Builds the registry, then resolves
           the anatomy the link carried: allowed -> canonical, otherwise the key is dropped and the hash rewritten. */
        setAnatomyRegistry(doc, meta = { source: 'anatomy' }) {
            registry = buildAnatomyRegistry(doc, has);
            const a = state.anatomy;
            const resolved = resolveAnatomy(a, registry);
            return set({ anatomyIndex: registry, anatomy: resolved || ANATOMY_DEFAULT }, meta);
        },
        /* Back to the specimen stage. */
        leaveStage(meta = { source: 'stage' }) { return set({ scope: null, station: null }, meta); },
        /* Adopt a location.hash (Back/Forward, a pasted link, a hand edit). */
        applyHash(next) {
            const p = parseHash(next, has, registry);
            const selection = p.selection || null;
            const tier = Math.max(p.tier || state.tier, selection ? tierOf(selection) : TIER_MIN);
            return set({
                selection, tier, scope: p.scope || null, station: p.scope ? null : p.station || null,
                cursor: clampAt(p.cursor, ctBounds), quality: p.quality || null, mu: p.mu || MU_DEFAULT,
                flap: p.flap || null, anatomy: p.anatomy || ANATOMY_DEFAULT,
            }, { source: 'url' });
        },
        /* The canonical hash for the current state. */
        hash: () => formatHash(state),
    };
}
