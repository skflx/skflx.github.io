/* =============================================================
   state.js — the one SSB store, its URL-hash codec, and ssb:* storage.

   Everything else subscribes to this store. It imports only scope.js and flap.js (pure
   math, no imports of their own: the `#scope=` codec, the flap overlay's parameters): the graph is injected
   (`has`, `tierOf`), which keeps the module graph one-way (docs/ssb.md 7.1).

   The URL hash is the shareable state (`#s=s.uncinate-process&tier=2`,
   `#lab=ethmoid-roof&keros=12&q=lite`, `#ct=cor&at=12.5,31,48`) and is
   untrusted input (docs/security.md rule 4): parsing is whitelist-only, ids
   must exist in the graph index, a diorama name must be in the injected
   registry and its keys in that diorama's PARAMS, a CT plane is one of
   three names and its crosshair is three finite numbers clamped to the
   volume's bounds, an endoscope pose is six fields with a whitelisted side
   and lens and clamped numbers, or a station link `t.<id>[.<side>]` that only
   names a lookup key (scope.js), numbers are parsed, clamped and snapped to the step,
   unknown keys are ignored, and nothing here ever produces markup.

   The anatomy state (`anat=`, `v=`, `dz=`, docs/realistic-anatomy.md 6.4) is whitelisted against a registry built from
   ssb/anatomy/index.json (buildAnatomyRegistry): an id the index or the graph does not list, a side or preset the entity
   does not offer, a base it is not built on, or a pair the registry does not allow drops the whole anatomy key, never
   a part of it. The index loads after the store exists, so a link's anatomy waits as `pending` (shape-checked only, and
   still written back to the address bar) until setAnatomyRegistry resolves it.

   Storage is `ssb:prefs` (tier), guarded: a blocked or full localStorage is
   a no-op, never an exception (docs/decisions.md section 3).
   ============================================================= */

import { parseScope, parseStationLink, formatScope, clampPose, samePose, POSE_DEFAULT } from './scope.js?v=c2522180';
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


/* ---------------- anatomy state (docs/realistic-anatomy.md 2.1, 6.3, 6.4) ---------------- */

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

/* ---------------- procedure player ---------------- */

/* The procedure hash `p=<p-id>&step=<n>[&cor=<corridor>]` (docs/ssb.md 7.3). The store only knows the shape and the
   graph; whether the id is in ssb/states/index.json, how many steps it has and which corridors list it are the
   player's to check once the index has loaded (mode-procedure.js), which clamps `step` and drops an unknown `cor`. */
export const STEP_MAX = 99;
const PROCEDURE_ID = /^p\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CORRIDOR_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* Any input -> an integer step in [0, STEP_MAX], or null when it is not a number. */
export function clampStep(value) {
    if (typeof value === 'string' && value.trim() === '') return null;
    if (value === null || value === undefined || typeof value === 'boolean') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.min(STEP_MAX, Math.max(0, Math.round(n)));
}

/* { id, step, cor } -> the same whitelisted (id must match the p-id shape and be in the graph, `has`), or null. */
export function normalizeProcedure(proc, has) {
    if (!proc || typeof proc.id !== 'string' || !PROCEDURE_ID.test(proc.id) || !has(proc.id)) return null;
    const cor = typeof proc.cor === 'string' && proc.cor.length <= 48 && CORRIDOR_KEY.test(proc.cor) ? proc.cor : null;
    return { id: proc.id, step: clampStep(proc.step) ?? 0, cor };
}

function sameProcedure(a, b) {
    if (a === b) return true;
    return !!a && !!b && a.id === b.id && a.step === b.step && a.cor === b.cor;
}

/* '#s=<id>&tier=<n>&lab=<name>&<key>=<v>&ct=<plane>&at=<r,a,s>&scope=<pose>&q=<full|lite>'
   -> { selection?, tier?, lab?, ct?, scope?, station?, cursor?, quality? } (a lab wins over
   a ct, a ct over a scope; `at` without a plane is the specimen's 3D cursor,
   `cursor`; `scope=t.<id>` is a station link, `station`, kept as text until the
   endoscope has read the station table and calls resolveStation).
   `anat`/`v`/`dz` -> `anatomy`: resolved against the registry (the 4th argument; the whole key is dropped if any part is
   not allowed), or, before the index has loaded (none given), kept as `{ ..., pending: true }` after a shape check.
   Only whitelisted keys, only valid values; anything else is dropped.
   `has(id)` is the graph's index lookup; `labs` maps a diorama name to its
   { params: PARAMS, presets: PRESETS }. A classification id naming a preset
   (`c.keros=III`) is applied first, then explicit parameters over it. */
export function parseHash(hash, has, labs = {}, registry = null) {
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
    const scopeText = out.lab || plane ? null : params.get('scope');
    const procedure = out.lab || plane ? null : normalizeProcedure({ id: params.get('p'), step: params.get('step'), cor: params.get('cor') }, has);
    if (procedure) out.procedure = procedure;
    const scope = parseScope(scopeText);
    if (scope) out.scope = scope;
    else if (parseStationLink(scopeText)) out.station = scopeText;
    if (plane) out.ct = { plane, at };
    else if (at && !out.lab && params.get('ct') === null) out.cursor = at;     /* a bad `ct` still ignores the whole stage */
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
    const flap = out.lab || plane ? null : parseFlap(params);      /* an overlay on the specimen: a lab or CT link ignores it */
    if (flap) out.flap = flap;
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
    if (state.procedure && !state.lab && !state.ct) {
        parts.push('p=' + state.procedure.id, 'step=' + state.procedure.step);
        if (state.procedure.cor) parts.push('cor=' + state.procedure.cor);
    }
    if (state.ct && !state.lab && clampCtPlane(state.ct.plane)) {
        parts.push('ct=' + CT_CODE[state.ct.plane]);
        if (state.ct.at) parts.push('at=' + atText(state.ct.at));
    } else if (!state.lab && state.scope) parts.push('scope=' + formatScope(state.scope));      /* the link is the pose alone: the shared cursor (`at`) is deliberately not written, so a reload opens CT at the volume centre */
    else if (!state.lab && state.station && parseStationLink(state.station)) parts.push('scope=' + state.station);      /* a link not yet resolved to a pose survives a rewrite of the address bar */
    else if (!state.lab && state.cursor) parts.push('at=' + atText(state.cursor));
    if (state.flap && !state.lab && !state.ct) {
        const f = normalizeFlap(state.flap);
        if (f) {
            parts.push(`flap=${f.design}.${f.side}`);
            for (const p of PARAMS) if (p.designs.includes(f.design) && f.params[p.key] !== p.default) parts.push(p.hash + '=' + num(f.params[p.key]));
        }
    }
    parts.push(...formatAnatomy(state.anatomy));        /* orthogonal to the stage: it rides along with any of them */
    if (clampMu(state.mu) && state.mu !== MU_DEFAULT && !state.procedure) parts.push('mu=' + state.mu);      /* a procedure forces decongested: nothing to share */
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

/* state = { tier, selection, lab, ct, scope, station, cursor, quality, procedure, mu, flap, anatomy, anatomyIndex }. Invariant: the
   selected entity's tier is never above `tier` (selecting a deeper entity
   raises the depth; lowering the depth below the selection closes it). The
   stage is one of four: the specimen (lab, ct and scope all null), the variant lab
   (`lab`: { name, params } with every parameter present and clamped,
   normalizeLab), CT (`ct`: { plane, at }, normalizeCt), or the endoscope
   (`scope`: a whole pose, scope.js, shown on the specimen); entering one
   leaves the others. `station` is a station link (`t.<id>[.<side>]`) waiting for
   the endoscope to turn it into a pose (resolveStation); it is never set with a
   scope pose, a lab or CT.
   `cursor` is the one 3D cursor in RAS mm, shared by CT and the specimen: the
   CT crosshair is `ct.at`, which the store keeps equal to `cursor` while the
   CT stage shows, and `cursor` is what survives in the specimen stage (where
   `ct` is null) so a click on a 3D surface can land the CT crosshair there.
   `procedure` ({ id, step, cor }, normalizeProcedure) is the procedure player (mode-procedure.js): not a fifth stage but
   the scope stage with a dissection state behind it, so it implies a scope pose (the default one when none is given) and
   ends with the scope, the lab or CT. `quality` is the rendering override from the hash ('full' | 'lite'), null
   for the device's choice. `mu` is the mucosal state ('dec' | 'scan' | 'cong', default 'scan'), independent of the stage: the
   procedure player (mode-procedure.js) loads its patch and lining, and a procedure overrides it with decongested. `flap` ({ design, side, params }, normalizeFlap) is the nasoseptal flap overlay on the specimen (flap.js), independent of the stage. The cursor is clamped to the volume's bounds,
   `anatomy` ({ base, variants, conditions }, resolveAnatomy; ANATOMY_DEFAULT is the standard head) is the layer stack
   over the volume and the packs, independent of the stage; while the index has not loaded it is `pending` (shape-checked,
   not yet whitelisted) and every consumer treats it as the standard head. `anatomyIndex` is the registry
   (buildAnatomyRegistry) once setAnatomyRegistry has been called, else null; the UI reads what can be picked from it.
   The cursor is clamped to the volume's bounds,
   which only the loaded volume knows: setCtBounds() hands them in and
   re-clamps, and until then the limit is a sanity range.
   Subscribers get (state, previous, meta); meta.source names the origin
   ('url', 'tree', 'search', 'panel', 'tier', 'scene', 'lab', 'slider', 'ct', 'scope',
   'cursor', 'ct-bounds') so the URL sync can tell a hash-driven change from
   a click, and a slider or crosshair drag from a deliberate step. */
export function createStore({ has, tierOf, hash = '', prefs = loadPrefs(), labs = {}, anatomyDoc = null }) {
    let registry = anatomyDoc ? buildAnatomyRegistry(anatomyDoc, has) : null;
    const fromUrl = parseHash(hash, has, labs, registry);
    const selection = fromUrl.selection || null;
    let ctBounds = null;
    const ct0 = fromUrl.ct ? normalizeCt(fromUrl.ct, ctBounds) : null;
    const procedure0 = ct0 ? null : fromUrl.procedure || null;
    let state = Object.freeze({
        selection,
        tier: Math.max(fromUrl.tier || prefs.tier || TIER_DEFAULT, selection ? tierOf(selection) : TIER_MIN),
        lab: fromUrl.lab || null,
        ct: ct0,
        scope: ct0 ? null : fromUrl.scope || (procedure0 && !fromUrl.station ? clampPose(POSE_DEFAULT) : null),
        station: ct0 || fromUrl.scope ? null : fromUrl.station || null,
        cursor: ct0 ? ct0.at : clampAt(fromUrl.cursor, ctBounds),
        quality: fromUrl.quality || null,
        procedure: procedure0,
        mu: fromUrl.mu || MU_DEFAULT,
        flap: fromUrl.flap || null,
        anatomy: fromUrl.anatomy || ANATOMY_DEFAULT,
        anatomyIndex: registry,
    });
    const subs = new Set();

    function set(patch, meta = {}) {
        const prev = state;
        const next = { ...prev, ...patch };
        if (next.tier === prev.tier && next.selection === prev.selection && sameLab(next.lab, prev.lab) && sameCt(next.ct, prev.ct)
            && samePose(next.scope, prev.scope) && next.station === prev.station && sameAt(next.cursor, prev.cursor) && next.quality === prev.quality
            && sameProcedure(next.procedure, prev.procedure) && next.mu === prev.mu && sameFlap(next.flap, prev.flap)
            && sameAnatomy(next.anatomy, prev.anatomy) && next.anatomyIndex === prev.anatomyIndex) return false;
        if (sameAnatomy(next.anatomy, prev.anatomy)) next.anatomy = prev.anatomy;
        if (sameProcedure(next.procedure, prev.procedure)) next.procedure = prev.procedure;
        if (sameLab(next.lab, prev.lab)) next.lab = prev.lab;
        if (sameFlap(next.flap, prev.flap)) next.flap = prev.flap;
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
            return next ? set({ lab: next, ct: null, scope: null, station: null, procedure: null }, meta) : false;
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
            return set({ ct: { plane: next.plane, at }, cursor: at, lab: null, scope: null, station: null, procedure: null }, meta);
        },
        /* Enter or change the endoscope ({ side, depth, yaw, pitch, roll, lens },
           clamped here too), or leave it (null, back to the specimen). Entering
           leaves the lab and CT. */
        setScope(pose, meta = { source: 'scope' }) {
            if (pose === null) return set({ scope: null, procedure: null }, meta);
            const next = clampPose(pose);
            return next ? set({ scope: next, lab: null, ct: null, station: null }, meta) : false;
        },
        /* Start, change or end (null) the procedure player. Starting puts the scope on `pose` (a whole pose; else the pose it
           has, else the default) and leaves the lab and CT; the step is only bounded by STEP_MAX here (the player knows the
           procedure's steps and clamps through this same method). */
        setProcedure(proc, meta = { source: 'procedure' }, pose = null) {
            if (proc === null) return set({ procedure: null }, meta);
            const next = normalizeProcedure(proc, has);
            if (!next) return false;
            const start = (pose ? clampPose(pose) : null) || state.scope || (state.station ? null : clampPose(POSE_DEFAULT));
            return set({ procedure: next, scope: start, station: start ? null : state.station, lab: null, ct: null }, meta);
        },
        /* Turn a pending station link into its pose (a whole pose) or drop it (null: an unknown station, or no
           table). The one writer of `station` besides the hash. */
        resolveStation(pose, meta = { source: 'url' }) {
            if (!state.station) return false;
            const next = (pose ? clampPose(pose) : null) || (state.procedure ? clampPose(POSE_DEFAULT) : null);      /* a procedure always has a pose */
            return set({ station: null, scope: next, lab: null, ct: null }, meta);
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
        /* The mucosal state (decongested | as scanned | congested): any other value is ignored. Never changes the stage. */
        setMu(mu, meta = { source: 'mu' }) {
            const next = clampMu(mu);
            return next ? set({ mu: next }, meta) : false;
        },
        /* The nasoseptal flap overlay ({ design, side, params }, whitelisted and clamped here too), or off (null). Never
           changes the stage. */
        setFlap(flap, meta = { source: 'flap' }) {
            if (flap === null) return set({ flap: null }, meta);
            const next = normalizeFlap(flap);
            return next ? set({ flap: next }, meta) : false;
        },
        /* The anatomy stack ({ base, variants, conditions }), or null for the standard head. Whitelisted against the
           registry here too: anything the registry does not allow is refused (false) and the state is left as it was.
           Never changes the stage. */
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
        leaveStage(meta = { source: 'stage' }) { return set({ lab: null, ct: null, scope: null, station: null, procedure: null }, meta); },
        /* Adopt a location.hash (Back/Forward, a pasted link, a hand edit). */
        applyHash(next) {
            const p = parseHash(next, has, labs, registry);
            const selection = p.selection || null;
            const tier = Math.max(p.tier || state.tier, selection ? tierOf(selection) : TIER_MIN);
            const ct = p.ct ? normalizeCt(p.ct, ctBounds) : null;
            const cursor = ct ? ct.at : clampAt(p.cursor, ctBounds);
            const procedure = ct ? null : p.procedure || null;
            const scope = ct ? null : p.scope || (procedure && !p.station ? state.scope || clampPose(POSE_DEFAULT) : null);
            return set({ selection, tier, lab: p.lab || null, ct, scope, station: ct || p.scope ? null : p.station || null, cursor, quality: p.quality || null, procedure, mu: p.mu || MU_DEFAULT, flap: p.flap || null, anatomy: p.anatomy || ANATOMY_DEFAULT }, { source: 'url' });
        },
        /* The canonical hash for the current state. */
        hash: () => formatHash(state, labs),
    };
}
