#!/usr/bin/env node
/* =============================================================
   ssb-frames.mjs — export every CT slice of the SSB specimen as a labelled
   PNG, with a manifest, from the page's own CT stage (what you see is what
   the viewer draws: label outlines, UW arrow tips by state).

     node tools/ssb-frames.mjs                 # all three planes
     node tools/ssb-frames.mjs --plane cor     # one plane (ax | cor | sag)
     node tools/ssb-frames.mjs --every 4       # every 4th slice
     node tools/ssb-frames.mjs --baseline      # also (re)write the committed baseline

   Output goes to tools/ssb-pipeline/incoming/frames/ (gitignored, never
   served): <plane>/<index>.png and frames.json (per frame: the slice's RAS
   position, the structures in it, its UW tips and their states).

   The baseline (tools/ssb-pipeline/uw/frames-baseline.json, committed) holds
   only per-frame tip counts. Every run prints its totals beside it, and the
   frames whose agreement changed, so a relabel shows as a measured change.
   The formal per-structure score with confidence intervals stays
   tools/ssb-pipeline/uw/score.py; the per-frame counts here use its rule
   (tol 1 voxel) on the served, right-half tips.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { startServer, launchBrowser, ROOT } from './smoke-lib.mjs';

const CODES = { ax: 'axial', cor: 'coronal', sag: 'sagittal' };
const NORMAL = { axial: 2, coronal: 1, sagittal: 0 };
const OUT = path.join(ROOT, 'tools/ssb-pipeline/incoming/frames');
const BASELINE = path.join(ROOT, 'tools/ssb-pipeline/uw/frames-baseline.json');

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const only = opt('--plane');
if (only && !CODES[only]) { console.error('--plane takes ax, cor or sag'); process.exit(2); }
const every = Math.max(1, Number(opt('--every')) || 1);
const writeBaseline = args.includes('--baseline');
const codes = only ? [only] : Object.keys(CODES);

const server = await startServer();
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const frames = [];
try {
    await page.goto(`${server.origin}/ssb.html#ct=ax`);
    await page.waitForFunction(() => window.__ssb.ct && window.__ssb.ct.status === 'ready', null, { timeout: 120000 });
    const { bounds, spacing } = await page.evaluate(() => ({ bounds: window.__ssb.ct.bounds, spacing: window.__ssb.ct.spacing }));
    for (const code of codes) {
        const plane = CODES[code];
        const n = NORMAL[plane];
        fs.mkdirSync(path.join(OUT, plane), { recursive: true });
        const count = Math.round((bounds.max[n] - bounds.min[n]) / spacing[n]) + 1;
        for (let index = 0; index < count; index += every) {
            /* the crosshair sits in the image's corner, out of the way */
            const at = bounds.min.slice();
            at[n] = Math.round((bounds.min[n] + index * spacing[n]) * 1000) / 1000;
            const before = await page.evaluate((p) => window.__ssb.ct.renders[p], plane);
            await page.evaluate(([c, a]) => { location.hash = `ct=${c}&at=${a.join(',')}`; }, [code, at]);
            await page.waitForFunction(([p, b]) => window.__ssb.ct.renders[p] > b, [plane, before]);
            const file = `${plane}/${String(index).padStart(3, '0')}.png`;
            await page.locator(`.ssb-ct-view[data-plane="${plane}"]`).screenshot({ path: path.join(OUT, file) });
            const info = await page.evaluate((p) => ({ structures: window.__ssb.ct.structuresOn(p), tips: window.__ssb.ct.tipsOn(p) }), plane);
            const tally = { hit: 0, miss: 0, unlabelled: 0 };
            for (const t of info.tips) tally[t.state] += 1;
            frames.push({
                plane, index, at: at[n], file,
                structures: info.structures.map((s) => ({ id: s.graphId, name: s.name, voxels: s.voxels })),
                tips: info.tips.map((t) => ({ term: t.term, state: t.state })), ...tally,
            });
        }
        console.log(`${plane}: ${frames.filter((f) => f.plane === plane).length} frames`);
    }
} finally {
    await browser.close();
    await server.close();
}
if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }

const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
const totals = (rows) => ({ frames: rows.length, hit: sum(rows, 'hit'), miss: sum(rows, 'miss'), unlabelled: sum(rows, 'unlabelled') });
fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ version: 1, every, totals: totals(frames), frames }, null, 1) + '\n');
console.log(`wrote ${path.relative(ROOT, OUT)}/: ${frames.length} PNGs + frames.json`);

const key = (f) => `${f.plane}/${f.index}`;
const now = totals(frames);
const pct = (t) => (t.hit + t.miss ? ((100 * t.hit) / (t.hit + t.miss)).toFixed(1) + '%' : 'n/a');
console.log(`tips on shown frames: ${now.hit} agree, ${now.miss} disagree (${pct(now)}), ${now.unlabelled} not segmented`);
if (fs.existsSync(BASELINE)) {
    const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
    const old = new Map(base.frames.map((r) => [`${r[0]}/${r[1]}`, { hit: r[2], miss: r[3], unlabelled: r[4] }]));
    const shared = frames.filter((f) => old.has(key(f)));
    const was = totals(shared.map((f) => old.get(key(f))));
    console.log(`baseline on the same frames: ${was.hit} agree, ${was.miss} disagree (${pct(was)}), ${was.unlabelled} not segmented`);
    const changed = shared.filter((f) => old.get(key(f)).hit !== f.hit || old.get(key(f)).miss !== f.miss);
    for (const f of changed.slice(0, 20)) console.log(`  ${key(f)}: agree ${old.get(key(f)).hit} -> ${f.hit}, disagree ${old.get(key(f)).miss} -> ${f.miss}`);
    if (changed.length > 20) console.log(`  ... ${changed.length - 20} more`);
}
if (writeBaseline) {
    if (every !== 1 || only) { console.error('--baseline needs every frame of every plane (no --every, no --plane)'); process.exit(2); }
    fs.writeFileSync(BASELINE, JSON.stringify({
        version: 1, note: 'per-frame UW tip agreement of the served labels: [plane, index, hit, miss, unlabelled] (tools/ssb-frames.mjs)',
        totals: now, frames: frames.map((f) => [f.plane, f.index, f.hit, f.miss, f.unlabelled]),
    }) + '\n');
    console.log(`wrote ${path.relative(ROOT, BASELINE)}`);
}
