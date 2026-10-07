/* =============================================================
   graph.js — SSB knowledge graph: load, index, search, render text.

   Fetches every ssb/content/*.json that js/ssb/stamps.js lists (each URL
   carries ?v=<hash>, so a content change is a URL no cache has seen),
   indexes entities by id, answers name/synonym/eponym search, and turns a
   content string into markup. Schema: docs/authoring-ssb.md.

   Imports stamps.js only (docs/ssb.md 7.1). Everything here is pure data
   and strings; the DOM is never touched.
   ============================================================= */
import { STAMPS } from './stamps.js?v=9c6e673d';

/* Collection key -> id prefix (docs/authoring-ssb.md section 3). */
export const COLLECTIONS = {
    structures: 's', landmarks: 'lm', variants: 'v', classifications: 'c',
    measurements: 'm', hazards: 'h', principles: 'pr', procedures: 'p',
    stations: 't', pathways: 'pw', conditions: 'dz', sources: 'src',
};
const TYPE_BY_PREFIX = Object.fromEntries(Object.entries(COLLECTIONS).map(([k, v]) => [v, k]));

export const TYPE_LABEL = {
    structures: 'Structure', landmarks: 'Landmark', variants: 'Variant', classifications: 'Classification',
    measurements: 'Measurement', hazards: 'Hazard', principles: 'Principle', procedures: 'Procedure',
    stations: 'Station', pathways: 'Pathway', conditions: 'Condition', sources: 'Source',
};
/* Non-structure collections as tree groups, in reading order. */
export const OTHER_GROUPS = [
    ['procedures', 'Procedures'], ['conditions', 'Conditions'], ['hazards', 'Hazards'],
    ['variants', 'Variants'], ['classifications', 'Classifications'], ['principles', 'Principles'],
    ['landmarks', 'Landmarks'], ['measurements', 'Measurements'], ['stations', 'Stations'],
    ['pathways', 'Pathways'],
];

export const REGION_LABEL = {
    'nasal-cavity': 'Nasal cavity', septum: 'Septum', 'lateral-wall': 'Lateral nasal wall',
    maxillary: 'Maxillary sinus', lacrimal: 'Lacrimal system', nasopharynx: 'Nasopharynx',
    ppf: 'Pterygopalatine fossa', itf: 'Infratemporal fossa', ethmoid: 'Ethmoid', frontal: 'Frontal',
    olfactory: 'Olfactory region', orbit: 'Orbit', acf: 'Anterior cranial fossa', sphenoid: 'Sphenoid',
    sellar: 'Sella', parasellar: 'Parasellar region', suprasellar: 'Suprasellar region', clival: 'Clivus',
    petrous: 'Petrous apex', cvj: 'Craniovertebral junction',
};
export const REGION_ORDER = Object.keys(REGION_LABEL);

export const KIND_LABEL = {
    bone: 'Bone', 'bone-part': 'Bone parts', cell: 'Cells', sinus: 'Sinuses', space: 'Spaces',
    opening: 'Openings', mucosa: 'Mucosa', cartilage: 'Cartilage', artery: 'Arteries', vein: 'Veins',
    'venous-sinus': 'Venous sinuses', nerve: 'Nerves', ganglion: 'Ganglia', dura: 'Dura', brain: 'Brain',
    muscle: 'Muscles', tendon: 'Tendons', fat: 'Fat', gland: 'Glands', duct: 'Ducts',
    ligament: 'Ligaments', region: 'Regions',
};
export const KIND_ORDER = Object.keys(KIND_LABEL);

/* ---------------- loading ---------------- */

export async function loadGraph(fetchFn = (url) => fetch(url)) {
    const files = Object.keys(STAMPS).filter((f) => /^ssb\/content\/[^/]+\.json$/.test(f)).sort();
    if (!files.length) throw new Error('No content files are listed in stamps.js.');
    const docs = await Promise.all(files.map(async (file) => {
        const res = await fetchFn(`${file}?v=${STAMPS[file]}`);
        if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
        return res.json();
    }));
    return buildGraph(docs);
}

/* Index parsed content documents. Tolerant on purpose: the validator
   (tools/ssb-content.mjs) owns correctness; a malformed entry here is
   skipped, never thrown on. */
export function buildGraph(docs) {
    const index = new Map();
    const byType = {};
    for (const key of Object.keys(COLLECTIONS)) byType[key] = [];

    for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;
        for (const key of Object.keys(COLLECTIONS)) {
            if (!Array.isArray(doc[key])) continue;
            for (const entity of doc[key]) {
                if (!entity || typeof entity.id !== 'string' || index.has(entity.id)) continue;
                index.set(entity.id, { type: key, entity });
                byType[key].push(entity);
            }
        }
    }

    const tierOf = (id) => {
        const hit = index.get(id);
        const t = hit && Number(hit.entity.tier);
        return t >= 1 && t <= 3 ? t : 1;
    };

    /* Search index: every named entity, with the normalized strings it can be found by. */
    const searchable = [];
    for (const key of Object.keys(COLLECTIONS)) {
        if (key === 'sources') continue;
        for (const e of byType[key]) {
            if (typeof e.name !== 'string') continue;
            const terms = [e.name, ...strings(e.syn), ...strings(e.eponym), ...strings(e.deprecated)].map(norm);
            searchable.push({ id: e.id, type: key, tier: tierOf(e.id), name: e.name, terms });
        }
    }

    const graph = {
        index,
        byType,
        has: (id) => typeof id === 'string' && index.has(id),
        get: (id) => (index.has(id) ? index.get(id).entity : null),
        typeOf: (id) => (index.has(id) ? index.get(id).type : null),
        tierOf,
        nameOf: (id) => {
            const e = graph.get(id);
            return e ? String(e.name || e.cite || id) : String(id);
        },
        /* { hits, hidden }: hits at or below `tier`, best first; hidden counts
           the matches above it. */
        search(query, { tier = 3, limit = 60 } = {}) {
            const q = norm(query).trim();
            if (!q) return { hits: [], hidden: 0 };
            const tokens = q.split(/\s+/);
            const scored = [];
            for (const s of searchable) {
                let best = Infinity;
                s.terms.forEach((term, i) => {
                    const v = termScore(term, q, tokens);
                    if (v !== null) best = Math.min(best, v + (i ? 0.5 : 0));
                });
                if (best < Infinity) scored.push({ s, best });
            }
            const typeRank = Object.keys(COLLECTIONS);
            scored.sort((a, b) => a.best - b.best || a.s.tier - b.s.tier
                || typeRank.indexOf(a.s.type) - typeRank.indexOf(b.s.type) || a.s.name.localeCompare(b.s.name));
            const visible = scored.filter((x) => x.s.tier <= tier);
            return {
                hits: visible.slice(0, limit).map((x) => x.s),
                hidden: scored.length - visible.length,
            };
        },
    };
    return graph;
}

function strings(v) {
    if (typeof v === 'string') return [v];
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}

/* Lowercase, accent-free, for matching. */
function norm(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* 0 exact, 1 prefix, 2 every token found and the first at a word start,
   3 every token found anywhere; null = no match. */
function termScore(term, q, tokens) {
    if (term === q) return 0;
    if (term.startsWith(q)) return 1;
    if (!tokens.every((t) => term.includes(t))) return null;
    return new RegExp('(^|[^a-z0-9])' + tokens[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(term) ? 2 : 3;
}

/* ---------------- text ---------------- */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
}

const REF = /\[\[([a-z]+\.[a-z0-9-]+)(?:\|([^\]]*))?\]\]/g;

/* **strong** then *em* on text that is already escaped. */
function inline(escaped) {
    return escaped
        .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\s](?:[^*]*[^*\s])?)\*/g, '<em>$1</em>');
}

/* Content string -> markup (docs/ssb.md 7.6). Escape first; only then the
   two allowed inline forms. [[id]] / [[id|label]] become link buttons for
   ids that exist (the id charset is [a-z0-9.-], so it is safe in the
   attribute); an unknown id is plain text. Emphasis never spans a link. */
export function renderText(text, graph) {
    const src = esc(text);
    let out = '';
    let last = 0;
    for (const m of src.matchAll(REF)) {
        out += inline(src.slice(last, m.index));
        last = m.index + m[0].length;
        const id = m[1];
        const label = m[2] !== undefined && m[2] !== '' ? m[2] : null;
        if (graph && graph.has(id)) {
            out += `<button type="button" class="ssb-ref" data-ref="${id}">${label !== null ? label : esc(graph.nameOf(id))}</button>`;
        } else {
            out += label !== null ? label : esc(id);
        }
    }
    return out + inline(src.slice(last));
}
