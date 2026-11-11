// Dumps OLSB's coarse label volume (as tools/check-data.mjs checkOlsb() builds it) for openear-review.py.
//   node tools/tbone-pipeline/olsb-labels.mjs . > tools/tbone-pipeline/incoming/olsb-labels.json
// Voxel (i,j,k) centre = o + vox*(i,j,k) mm, x fastest; ids[code] is the glossary id of each label code.
import fs from 'fs';
import path from 'path';
const repo = process.argv[2];
const html = fs.readFileSync(path.join(repo, 'OLSB.html'), 'utf8');
const files = [...html.matchAll(/<script\b(?![^>]*type="module")[^>]*\bsrc="(js\/olsb\/(?!main\.)[a-z]+\.js)/g)].map((m) => m[1]);
const win = {};
for (const f of files) new Function('window', fs.readFileSync(path.join(repo, f), 'utf8') + '\n;return window;')(win);
const V = win.OLSB.volume;
const vol = V.build(V.LEVELS.coarse);
console.log(JSON.stringify({
    vox: vol.vox, o: vol.o, dims: [vol.nx, vol.ny, vol.nz],
    ids: V.LABELS.map((l) => (l ? l.id : null)),
    lab_b64: Buffer.from(vol.lab).toString('base64'),
}));
