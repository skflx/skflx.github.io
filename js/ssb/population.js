/* =============================================================
   population.js — NasalSeg's population facts about the five structures it
   labels, read from ssb/anatomy/population/nasalseg.json (docs/ssb.md 5.10).

   Pure: loadPopulation() fetches and hands the parsed document to
   readPopulation(), which returns a flat model of exactly the numbers the
   panel shows, or null if the file is missing or not the shape it needs.
   Nothing is computed that the file does not hold, except unit conversion
   (cm2 -> mm2) and the mean of the standard specimen's two sides, which the
   pipeline wrote as near-identical mirrors.

   Convention (CP-POP1): the "restricted" rows, at the 10-90 % span of the
   cavity's length. They compare at our air threshold, cavity plus
   vestibule; the "labelled" rows follow NasalSeg's own boundaries and are
   never shown.
   ============================================================= */
import { STAMPS } from './stamps.js?v=496032ff';

export const FILE = 'ssb/anatomy/population/nasalseg.json';
export const SPAN = '10-90';
export const FIVE = ['s.nasal-cavity', 's.maxillary-sinus', 's.nasopharynx'];   /* the graph ids the five labels fall under */

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const get = (o, ...path) => path.reduce((x, k) => (x !== null && typeof x === 'object' && own(x, k) ? x[k] : undefined), o);
const MM2 = 100;      /* the file's cross-sections are cm2 */

/* { p25, p50, p75 } of a summary block, or null. */
function iqr(block) {
    if (!block || ![block.p25, block.p50, block.p75].every(num)) return null;
    return { p25: block.p25, p50: block.p50, p75: block.p75 };
}

/* The profile series for one congestion class: fractions and three equal-length cm2 arrays -> mm2. */
function series(block, x) {
    if (!block) return null;
    const out = {};
    for (const [key, src] of [['p25', 'p25Cm2'], ['median', 'medianCm2'], ['p75', 'p75Cm2']]) {
        const a = block[src];
        if (!Array.isArray(a) || a.length !== x.length || !a.every(num)) return null;
        out[key] = a.map((v) => v * MM2);
    }
    return out;
}

/* The head's cavity numbers at the span, or null. */
function headCavity(placement, measures) {
    const at = get(placement, 'restricted', SPAN);
    if (!at || !num(at.twoSideMeanCm2) || !num(at.twoSideMeanPercentile) || !num(at.smallerOverLarger) || !num(at.smallerOverLargerPercentile)) return null;
    const L = get(measures, 'restricted', 'L', 'profileCm2');
    const R = get(measures, 'restricted', 'R', 'profileCm2');
    return {
        twoSide: at.twoSideMeanCm2 * MM2, twoSidePct: at.twoSideMeanPercentile,
        ratio: at.smallerOverLarger, ratioPct: at.smallerOverLargerPercentile,
        profile: Array.isArray(L) && Array.isArray(R) && L.length === R.length && L.every(num) && R.every(num) ? L.map((v, i) => ((v + R[i]) / 2) * MM2) : null,
    };
}

/* The population sinus's numbers (POP2b, written by nasalseg/meanshape.py), or null: the toggle is then not offered. */
function readMeanShape(doc) {
    const ms = get(doc, 'meanShape');
    if (!ms || !Number.isInteger(ms.n) || ms.n < 1) return null;
    const rms = get(ms, 'alignRmsMm', 'median');
    const side = (k) => {
        const v = get(ms, 'sides', k);
        return v && num(v.majorityVolumeMl) && num(v.medianVolumeMl) && num(v.gapPercent) ? { majorityMl: v.majorityVolumeMl, medianMl: v.medianVolumeMl, gapPercent: v.gapPercent } : null;
    };
    const R = side('R');
    const L = side('L');
    return num(rms) && R && L ? { n: ms.n, rmsMedianMm: rms, R, L } : null;
}

/* doc (parsed JSON) -> model, or null when anything the panel needs is absent or malformed. */
export function readPopulation(doc) {
    try {
        const n = get(doc, 'summary', 'clearCount');
        const hu = get(doc, 'profiles', 'airThreshold', 'hu');
        const sum = get(doc, 'profiles', 'summary', 'restricted', SPAN);
        const head = get(doc, 'profiles', 'headA');
        if (!Number.isInteger(n) || n < 1 || !num(hu) || !sum || !head) return null;

        const x = get(sum, 'profileByClass', 'lessCongested', 'atFractionOfLength');
        if (!Array.isArray(x) || x.length < 2 || !x.every(num)) return null;
        const less = series(get(sum, 'profileByClass', 'lessCongested'), x);
        const more = series(get(sum, 'profileByClass', 'moreCongested'), x);
        const twoSide = iqr(sum.twoSideMeanCm2);
        const ratio = iqr(sum.smallerOverLarger);
        const std = headCavity(get(head, 'placement', 'standard'), get(head, 'measures', 'standard'));
        const scan = headCavity(get(head, 'placement', 'asScanned'), get(head, 'measures', 'asScanned'));
        if (!less || !more || !twoSide || !ratio || !std || !scan || !std.profile || std.profile.length !== x.length) return null;

        const mxL = iqr(get(doc, 'summary', 'clear', 'maxillary', 'mlL'));
        const mxR = iqr(get(doc, 'summary', 'clear', 'maxillary', 'mlR'));
        const vL = get(doc, 'headA', 'maxillary.L');
        const vR = get(doc, 'headA', 'maxillary.R');
        const ai = get(doc, 'headA', 'AI', 'maxillary');
        const aiPct = get(doc, 'headA', 'percentileAbsAI_clear', 'maxillary');
        if (!mxL || !mxR || !num(vL) || !num(vR) || !num(ai) || !num(aiPct)) return null;

        return {
            n, thresholdHu: hu, meanShape: readMeanShape(doc),
            cavity: {
                twoSide: { ...twoSide, p25: twoSide.p25 * MM2, p50: twoSide.p50 * MM2, p75: twoSide.p75 * MM2 },
                ratio,
                standard: { twoSide: std.twoSide, twoSidePct: std.twoSidePct, ratio: std.ratio, ratioPct: std.ratioPct },
                asScanned: { twoSide: scan.twoSide, twoSidePct: scan.twoSidePct, ratio: scan.ratio, ratioPct: scan.ratioPct },
            },
            profile: { x, more, less, standard: std.profile },
            maxillary: { L: mxL, R: mxR, head: { L: vL, R: vR, ai, aiPct } },
            nasopharynx: { truncated: get(doc, 'checks', 'nasopharynxTruncated'), unique: get(doc, 'checks', 'unique') },
        };
    } catch (e) {
        return null;
    }
}

/* Fetch the file (only if stamped, like every ssb/ data file) -> model, or null. Never throws. */
export async function loadPopulation(fetchFn = (typeof fetch === 'function' ? fetch : null)) {
    try {
        if (!fetchFn || !own(STAMPS, FILE)) return null;
        const res = await fetchFn(`${FILE}?v=${STAMPS[FILE]}`);
        if (!res || !res.ok) return null;
        return readPopulation(await res.json());
    } catch (e) {
        return null;
    }
}
