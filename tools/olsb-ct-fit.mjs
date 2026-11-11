#!/usr/bin/env node
/* How well OLSB's bone envelope follows the UW temporal bone CT (tbone/ct), and a tuner for it.
   Node, DOM-free, reads only the repo. Builds the coarse volume of js/olsb/volume.js (as
   tools/tbone-pipeline/olsb-centroids.mjs does) and compares it voxel by voxel with the CT.
     node tools/olsb-ct-fit.mjs            report (human lines, then one JSON line)
     node tools/olsb-ct-fit.mjs --json     the JSON line only
     node tools/olsb-ct-fit.mjs --tune [--out fit.json] [--rounds 2]
   --tune: coordinate descent over volume.js FIT (each bounded to +-4 mm / +-25 %), objective = bone Dice minus a
   penalty for any glossary id whose median distance to its UW landmarks (as check-data's olsb truth) leaves its limit.
   It writes the chosen values to a JSON; paste them into FIT at the top of volume.js yourself.
   CT values are 8-bit display levels (air ~43, soft ~110, bone 200-255), not HU. Bone/not-bone threshold: Otsu over
   the voxels that are not air (value >= AIR_MAX) in the compared region, i.e. a split between soft tissue and bone.
   Region compared: CT voxels with source > 0 inside the model's specimen block (REGION_C / REGION_R below: the rounded block
   volume.js first cut round the ear, kept fixed while tuning) that lie in the coarse grid. Model bone = layer 'bone' labels (not 'air'); the rest of the region is not-bone. */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AIR_MAX = 80, POCKET_MAX = 75;          /* display levels: air ~43, soft ~110 */
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

/* ---- model ---- */
const html = fs.readFileSync(path.join(repo, 'OLSB.html'), 'utf8');
const files = [...html.matchAll(/<script\b(?![^>]*type="module")[^>]*\bsrc="(js\/olsb\/(?!main\.)[a-z]+\.js)/g)].map((m) => m[1]);
const win = {};
for (const f of files) new Function('window', fs.readFileSync(path.join(repo, f), 'utf8') + '\n;return window;')(win);
const V = win.OLSB.volume;
const FIT = V.FIT || null;
const DEF = FIT ? JSON.parse(JSON.stringify(FIT)) : {};

/* ---- CT ---- */
const hdr = JSON.parse(fs.readFileSync(path.join(repo, 'tbone/ct/ct.json'), 'utf8'));
const ct = zlib.gunzipSync(fs.readFileSync(path.join(repo, 'tbone/ct/ct.u8.gz')));
const src = zlib.gunzipSync(fs.readFileSync(path.join(repo, 'tbone/ct/source.u8.gz')));
const [cnx, cny, cnz] = hdr.dims, cs = hdr.spacing[0], co = [hdr.affine[0][3], hdr.affine[1][3], hdr.affine[2][3]];
function ctAt(x, y, z) {      /* nearest voxel; -1 when outside or no data */
    const i = Math.round((x - co[0]) / cs), j = Math.round((y - co[1]) / cs), k = Math.round((z - co[2]) / cs);
    if (i < 0 || j < 0 || k < 0 || i >= cnx || j >= cny || k >= cnz) return -1;
    const n = i + cnx * (j + cny * k);
    return src[n] ? ct[n] : -1;
}

/* fixed (the block as first drawn), so tuning the block cannot change what is compared */
const REGION_C = [2.5, -3.5, -4.6], REGION_R = [18, 21, 15.9];
function inSpec(x, y, z) {
    const c = REGION_C, r = REGION_R;
    const a = (x - c[0]) / r[0], b = (y - c[1]) / r[1], d = (z - c[2]) / r[2];
    return a * a * a * a + b * b * b * b + d * d * d * d <= 1;
}

/* the CT side (fixed unless the parameters move the specimen block, which they do not) */
const GRID = (() => { const v = V.build(V.LEVELS.coarse); return { nx: v.nx, ny: v.ny, nz: v.nz, p: v.p }; })();
const ctv = new Int16Array(GRID.nx * GRID.ny * GRID.nz).fill(-1);
const pos = new Float32Array(ctv.length * 3);
for (let i = 0; i < ctv.length; i++) {
    const p = GRID.p(i % GRID.nx, ((i / GRID.nx) | 0) % GRID.ny, (i / (GRID.nx * GRID.ny)) | 0);
    pos[3 * i] = p[0]; pos[3 * i + 1] = p[1]; pos[3 * i + 2] = p[2];
    ctv[i] = ctAt(p[0], p[1], p[2]);
}
function otsu(vals) {
    const h = new Float64Array(256); let n = 0;
    for (const v of vals) { h[v]++; n++; }
    let sum = 0; for (let t = 0; t < 256; t++) sum += t * h[t];
    let wb = 0, sb = 0, best = -1, thr = 0;
    for (let t = 0; t < 256; t++) {
        wb += h[t]; if (!wb) continue; const wf = n - wb; if (!wf) break;
        sb += t * h[t]; const mb = sb / wb, mf = (sum - sb) / wf, bv = wb * wf * (mb - mf) * (mb - mf);
        if (bv > best) { best = bv; thr = t; }
    }
    return thr;    /* bone is value > thr */
}
const region = new Uint8Array(ctv.length);
let thr;
{
    const vals = [];
    for (let i = 0; i < ctv.length; i++) if (ctv[i] >= 0 && inSpec(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2])) { region[i] = 1; if (ctv[i] >= AIR_MAX) vals.push(ctv[i]); }
    thr = otsu(vals);
}

/* ---- truth distances (check-data's olsb truth, minimal copy) ---- */
const TRUTH_CLASS = {
    compact: ['stapes', 'incus', 'malleus', 'tm', 'rw', 'promontory', 'stapedius', 'tensor', 'pyramid', 'recess', 'sinustymp', 'prussak', 'fn-tymp', 'fn-lab', 'geniculate'],
    labyrinth: ['cochlea', 'vestibule', 'lscc', 'pscc', 'ssc', 'iac'],
    extended: ['fn', 'eac', 'annulus', 'scutum', 'epitympanum', 'hypotympanum', 'tegment', 'aditus', 'antrum', 'mastoidcells', 'sigmoid', 'jb', 'ica', 'et', 'tip'],
};
const TRUTH_BASE = { compact: 2.5, labyrinth: 2.5, extended: 3.5 };
const lm = JSON.parse(fs.readFileSync(path.join(repo, 'tbone/geometry/landmarks.json'), 'utf8')).landmarks;
const clsOf = {}; for (const [c, ids] of Object.entries(TRUTH_CLASS)) for (const id of ids) clsOf[id] = c;
const med = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const byLm = {};
for (const l of lm) if (l.g && clsOf[l.g]) (byLm[l.g] ||= []).push(l.point_mm);
function truthRows(vol) {
    const { nx, ny, lab } = vol, pts = {};
    for (let i = 0; i < lab.length; i++) {
        if (!lab[i]) continue;
        const id = V.LABELS[lab[i]].id;
        if (!byLm[id]) continue;
        (pts[id] ||= []).push(vol.p(i % nx, ((i / nx) | 0) % ny, (i / (nx * ny)) | 0));
    }
    const zero = vol.vox * Math.sqrt(3) / 2, rows = [];
    for (const id of Object.keys(byLm)) {
        if (!pts[id]) continue;
        const d = byLm[id].map((t) => { let b = Infinity; for (const q of pts[id]) { const e = (q[0] - t[0]) ** 2 + (q[1] - t[1]) ** 2 + (q[2] - t[2]) ** 2; if (e < b) b = e; } b = Math.sqrt(b); return b < zero ? 0 : b; });
        const c = [0, 1, 2].map((k) => med(byLm[id].map((t) => t[k])));
        rows.push({ id, med: med(d), lim: TRUTH_BASE[clsOf[id]] + 0.1 * Math.hypot(...c) });
    }
    return rows;
}

/* ---- metrics ---- */
function measure() {
    const vol = V.build(V.LEVELS.coarse), { lab } = vol, L = V.LABELS;
    const kind = new Uint8Array(L.length);       /* 1 bone, 2 cell air, 3 structure (inner/nerves/vessels/canal/ossicles/muscles), 4 other air, 5 brain/dura */
    L.forEach((l, c) => { if (!l) return; kind[c] = l.layer === 'bone' ? 1 : (l.id === 'mastoidcells' || l.id === 'hypocells') ? 2 : l.air ? 4 : (l.layer === 'brain' || l.layer === 'dura') ? 5 : 3; });
    let tp = 0, fp = 0, fn = 0, tn = 0;
    const sum = [0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0], mb = [0, 0, 0, 0], cb = [0, 0, 0, 0];
    let ctp = 0, cfp = 0, cfn = 0;
    for (let i = 0; i < lab.length; i++) {
        if (!region[i]) continue;
        const k = lab[i] ? kind[lab[i]] : 0, bone = k === 1, cbone = ctv[i] > thr;
        if (bone && cbone) tp++; else if (bone) fp++; else if (cbone) fn++; else tn++;
        sum[k] += ctv[i]; cnt[k]++;
        if (bone) { mb[0]++; mb[1] += pos[3 * i]; mb[2] += pos[3 * i + 1]; mb[3] += pos[3 * i + 2]; }
        if (cbone) { cb[0]++; cb[1] += pos[3 * i]; cb[2] += pos[3 * i + 1]; cb[3] += pos[3 * i + 2]; }
        /* air-cell zone: voxels the model calls bone or cell air; compare cells with low-density CT pockets */
        if (k === 1 || k === 2) { const cell = k === 2, pocket = ctv[i] < POCKET_MAX; if (cell && pocket) ctp++; else if (cell) cfp++; else if (pocket) cfn++; }
    }
    if (process.env.OLSB_FIT_DEBUG === '1') {
        const f = (n) => n / region.reduce((a, b) => a + b, 0);
        const bins = {};
        for (let i = 0; i < lab.length; i++) { if (!region[i]) continue; const b = kind[lab[i]] === 1, c = ctv[i] > thr; if (b === c) continue; const key = (b ? 'FP' : 'FN') + ' ' + [0, 1, 2].map((a) => Math.floor(pos[3 * i + a] / 5) * 5).join(','); bins[key] = (bins[key] || 0) + 1; }
        console.log(Object.entries(bins).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ' ' + v).join('\n'));
        console.log('  debug: model bone', f(tp + fp).toFixed(3), 'CT bone', f(tp + fn).toFixed(3), 'fp', f(fp).toFixed(3), 'fn', f(fn).toFixed(3));
    }
    const mean = (k) => (cnt[k] ? sum[k] / cnt[k] : NaN);
    const dice = 2 * tp / (2 * tp + fp + fn), iou = tp / (tp + fp + fn);
    const r = (x, n = 3) => +x.toFixed(n);
    const rows = truthRows(vol);
    const over = rows.filter((x) => x.med > x.lim);
    return {
        vol, thr, dice: r(dice), iou: r(iou), voxels: lab.length,
        meanCtBone: r(mean(1), 1), meanCtAir: r(mean(0) * 0 + (sum[0] + sum[4]) / Math.max(1, cnt[0] + cnt[4]), 1), meanCtCells: r(mean(2), 1),
        meanCtStructure: r(mean(3), 1), meanCtDura: r(mean(5), 1),
        centroidOffsetMm: [1, 2, 3].map((a) => r(mb[a] / mb[0] - cb[a] / cb[0], 2)),
        cellDice: r(2 * ctp / (2 * ctp + cfp + cfn)),
        truth: rows, truthOver: over.map((x) => x.id)
    };
}

function report(m) {
    const o = V.build ? null : null; void o;
    console.log(`olsb-ct-fit: CT bone threshold ${m.thr} (Otsu over non-air voxels), compared region ${region.reduce((a, b) => a + b, 0)} voxels, coarse grid ${m.voxels}`);
    console.log(`  bone: Dice ${m.dice}  IoU ${m.iou}  centroid offset model-CT (mm x y z) ${m.centroidOffsetMm.join(' ')}`);
    console.log(`  mean CT level under model: bone ${m.meanCtBone}, air (empty + cavities) ${m.meanCtAir}, mastoid cells ${m.meanCtCells}, structure lumens ${m.meanCtStructure}, dura/brain ${m.meanCtDura}`);
    console.log(`  air-cell zone Dice (model cells vs CT pockets < ${POCKET_MAX} inside model bone+cells): ${m.cellDice}`);
    console.log(`  truth: ${m.truth.length} ids, beyond limit: ${m.truthOver.join(', ') || 'none'}`);
    console.log(JSON.stringify({ thr: m.thr, dice: m.dice, iou: m.iou, meanCtBone: m.meanCtBone, meanCtAir: m.meanCtAir, meanCtCells: m.meanCtCells, meanCtStructure: m.meanCtStructure,
        centroidOffsetMm: m.centroidOffsetMm, cellDice: m.cellDice, voxels: m.voxels, truthOver: m.truthOver }));
}

/* ---- tuner ---- */
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => Array.isArray(v) ? v.map((x, i) => [`${p}${k}.${i}`, x]) : typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]);
function setParam(name, v) { const [k, i] = name.split('.'); if (i == null) FIT[k] = v; else FIT[k][+i] = v; }
function score(base) {
    const m = measure();
    /* objective: bone Dice, minus a penalty for ids that were within their limit at the start and now are not (or are further out) */
    let pen = 0;
    if (process.env.OLSB_FIT_NOPEN !== '1') for (const r of m.truth) { const b = base[r.id]; if (r.med > r.lim && !(b && b.med > b.lim && r.med <= b.med + 0.05)) pen += 0.2 + 0.1 * (r.med - r.lim); }
    return { m, s: m.dice - pen };
}
if (flag('--tune')) {
    if (!FIT || !FIT.TUNE) { console.error('volume.js has no FIT.TUNE list; nothing to tune'); process.exit(1); }
    const base = {}; const m0 = measure(); for (const r of m0.truth) base[r.id] = r;
    const names = FIT.TUNE;
    const start = Object.fromEntries(flat(DEF));
    let cur = score(base), bestVals = Object.fromEntries(names.map((n) => [n, start[n]]));
    console.error(`start dice ${cur.m.dice} score ${cur.s.toFixed(4)}`);
    const rounds = +opt('--rounds', 2);
    for (let rd = 0; rd < rounds; rd++) {
        for (const n of names) {
            const x0 = start[n], span = Math.min(4, Math.abs(x0) * 0.25 || 4), step = span / +opt('--div', 4) / (rd + 1);
            for (const dir of [1, -1]) {
                for (;;) {
                    const x2 = bestVals[n] + dir * step;
                    if (Math.abs(x2 - x0) > span + 1e-9) break;
                    setParam(n, x2);
                    const t = score(base);
                    if (t.s > cur.s + 1e-4) { cur = t; bestVals[n] = x2; console.error(`  ${n} -> ${x2.toFixed(3)} dice ${t.m.dice} score ${t.s.toFixed(4)}`); } else break;
                }
                setParam(n, bestVals[n]);
            }
        }
    }
    const out = opt('--out', 'olsb-fit.json');
    fs.writeFileSync(out, JSON.stringify(bestVals, null, 1) + '\n');
    console.error(`wrote ${out}`);
    report(measure());
} else {
    const m = measure();
    if (flag('--json')) console.log(JSON.stringify({ thr: m.thr, dice: m.dice, iou: m.iou, meanCtBone: m.meanCtBone, meanCtAir: m.meanCtAir, centroidOffsetMm: m.centroidOffsetMm, cellDice: m.cellDice, voxels: m.voxels, truthOver: m.truthOver }));
    else report(m);
    if (process.env.OLSB_FIT_TRUTH === '1') for (const r of m.truth) console.log(`${r.id} ${r.med.toFixed(2)} / ${r.lim.toFixed(2)}`);
}
