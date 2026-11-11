// Builds the OLSB coarse volume exactly as tools/check-data.mjs checkOlsb() does and prints per-id centroids (mm).
import fs from 'fs';
import path from 'path';
const repo = process.argv[2];
const html = fs.readFileSync(path.join(repo, 'OLSB.html'), 'utf8');
const files = [...html.matchAll(/<script\b(?![^>]*type="module")[^>]*\bsrc="(js\/olsb\/(?!main\.)[a-z]+\.js)/g)].map((m) => m[1]);
const win = {};
for (const f of files) new Function('window', fs.readFileSync(path.join(repo, f), 'utf8') + '\n;return window;')(win);
const V = win.OLSB.volume;
const vol = V.build(V.LEVELS.coarse);
const { nx, ny, lab } = vol;
const sum = {}, cnt = {};
for (let i = 0; i < lab.length; i++) {
    if (!lab[i]) continue;
    const id = V.LABELS[lab[i]].id;
    const x = i % nx, y = ((i / nx) | 0) % ny, z = (i / (nx * ny)) | 0;
    const p = vol.p(x, y, z);
    const s = (sum[id] ||= [0, 0, 0]);
    s[0] += p[0]; s[1] += p[1]; s[2] += p[2];
    cnt[id] = (cnt[id] || 0) + 1;
}
const out = {};
for (const id of Object.keys(sum).sort()) out[id] = sum[id].map((v) => +(v / cnt[id]).toFixed(4));
console.log(JSON.stringify(out, null, 1));
