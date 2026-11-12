/* =============================================================
   ct.js — OLSB "Real CT" view (plan 2026-11-09-ear-truth-concordance, E2).

   The reference temporal bone (tbone/, one normal right ear, UW atlas) as axial / coronal / sagittal slices on a
   canvas, with the traced landmarks and sweeps drawn over it, coded detected / labelled / inferred. Names come
   from OLSB.glossary and reach the DOM as textContent. Nothing in tbone/ is requested until the view is entered.

   Generic functions of js/ssb/volume.js only (loadVolume, PLANES, slice and RAS maths); nothing is changed there.
   The hash (#m=ct[&pl=ax|cor|sag][&at=<mm>][&ov=1[&ovo=0-100]]) only ever selects data.

   The 'Model outline' toggle (key M) draws the outline of OLSB's procedural volume (js/olsb/volume.js, same frame)
   over the slice. The model is built only when first turned on: in a short-lived worker from the volume.js script,
   else on this thread. A failed build turns the toggle back off without a message.
   ============================================================= */
import { loadVolume, stamped, PLANES } from '../ssb/volume.js?v=4837556e';

const ROOT = 'tbone';
const O = window.OLSB || { glossary: {} };
const G = O.glossary || {};
const $ = (id) => document.getElementById(id);
const PL = { ax: 'axial', cor: 'coronal', sag: 'sagittal' };
const PL_KEY = { axial: 'ax', coronal: 'cor', sagittal: 'sag' };
const LANDMARK_TOL = 0.6;     /* mm from the slice plane */
const SWEEP_TOL = 0.75;
const HIT_CSS_PX = 8;         /* click radius, CSS px (converted to canvas px per click) */
const LIST_MAX = 80;
const OV_DEFAULT = 60;        /* model outline opacity, percent */

/* sweep family -> glossary id (only where one exists); facial nerve segments by name */
const SWEEP_G = {
    iac: 'iac', 'facial-nerve': 'fn', gspn: 'gspn', 'petrous-ica': 'ica', 'sigmoid-sinus': 'sigmoid',
    lscc: 'lscc', pscc: 'pscc', sscc: 'ssc', eac: 'eac', 'basal-turn': 'cochlea',
};
const FN_SEG_G = { meatal: 'fn-meatal', labyrinthine: 'fn-lab' };
/* sweep family -> token of the structure's tissue colour */
const SWEEP_TONE = {
    'facial-nerve': '--olsb-nerve', gspn: '--olsb-nerve', 'sigmoid-sinus': '--olsb-vein', 'jugular-bulb': '--olsb-vein', 'petrous-ica': '--olsb-artery',
};

let vol = null, marks = [], sweeps = [], meaning = {};
let loading = null, ready = false;
let plane = 'axial', at = 0, k = 3, sel = null;
let show = { marks: true, sweeps: true };
let hits = [], onSlice = [];
let canvas, ctx, buf, bufCtx;
let ov = false, ovo = OV_DEFAULT, model = null, modelBuild = null;
let ovCanvas = null, ovCtx = null, ovProbe = null, ovBtn = null, ovWrap = null, ovSlider = null;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const human = (s) => String(s).replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
/* a colour token from css/olsb.css or css/site.css; 'transparent' if the token is missing (the page then still draws) */
const tone = (name) => {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'transparent'; } catch (e) { return 'transparent'; }
};
/* every canvas colour, read once per draw from the --olsb-ct-* tokens (both themes) */
const palette = () => ({
    ground: tone('--olsb-stage3d'), accent: tone('--signal'), halo: tone('--olsb-ct-halo'), ring: tone('--olsb-ct-ring'),
    dotEdge: tone('--olsb-ct-dot-edge'), letter: tone('--olsb-ct-letter'), letterEdge: tone('--olsb-ct-letter-edge'),
});

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

/* ---------- hash ---------- */
function readHash() {
    let h = '';
    try { h = location.hash.slice(1); } catch (e) { /* no-op */ }
    const get = (key) => {
        const m = new RegExp('(?:^|&)' + key + '=([^&]*)').exec(h);
        try { return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; }
    };
    return { m: get('m'), pl: get('pl'), at: get('at'), ov: get('ov'), ovo: get('ovo') };
}
function writeHash() {
    let h = `#m=ct&pl=${PL_KEY[plane]}&at=${at.toFixed(1)}`;
    if (ov) h += `&ov=1&ovo=${ovo}`;
    try { history.replaceState(null, '', h); } catch (e) { /* no-op */ }
}
function parseOvo(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : OV_DEFAULT;
}

/* ---------- names ---------- */
function landmarkItem(L) {
    const g = L.g && G[L.g] ? L.g : null;
    return { key: 'l:' + (g || L.name), kind: 'landmark', id: g, name: g ? G[g].name : human(L.name), status: 'labelled', mm: L.point_mm };
}
function sweepGlossary(family, seg) {
    if (family === 'facial-nerve' && FN_SEG_G[seg] && G[FN_SEG_G[seg]]) return FN_SEG_G[seg];
    const g = SWEEP_G[family];
    return g && G[g] ? g : null;
}

/* ---------- model outline ---------- */
/* The coarse level of OLSB's volume (0.3 mm, the whole specimen) as { lab, nx, ny, nz, vox, o, labels }. */
function buildInWorker(V) {
    return new Promise((resolve, reject) => {
        const tag = document.querySelector('script[src*="js/olsb/volume.js"]');
        if (!tag || typeof Worker !== 'function') { reject(new Error('no worker')); return; }
        const w = new Worker(tag.src);
        const finish = (fn, v) => { try { w.terminate(); } catch (e) { /* no-op */ } fn(v); };
        w.onmessage = (e) => {
            const m = e.data || {};
            if (m.error) finish(reject, new Error(m.error));
            else if (m.lab) finish(resolve, m);
        };
        w.onerror = (e) => { try { e.preventDefault(); } catch (x) { /* no-op */ } finish(reject, new Error('worker failed')); };
        w.postMessage({ id: 1, type: 'build', level: 'coarse' });
    });
}
function buildHere(V) {
    /* a short wait first, so the progress line paints before the build blocks the thread */
    return new Promise((resolve) => setTimeout(() => resolve(V.build(V.LEVELS.coarse)), 30));
}
function ensureModel() {
    if (model) return Promise.resolve(model);
    if (modelBuild) return modelBuild;
    const V = O.volume;
    if (!V || typeof V.build !== 'function' || !V.LEVELS || !V.LEVELS.coarse || !Array.isArray(V.LABELS)) return Promise.reject(new Error('no model'));
    status('Building the model outline…');
    modelBuild = buildInWorker(V).catch(() => buildHere(V)).then((m) => {
        if (!m || !m.lab || m.lab.length !== m.nx * m.ny * m.nz) throw new Error('bad model');
        model = { lab: m.lab, nx: m.nx, ny: m.ny, nz: m.nz, vox: m.vox, o: m.o, labels: V.LABELS };
        return model;
    }).finally(() => { modelBuild = null; status(null); });
    return modelBuild;
}
/* one colour token as RGB bytes, read through a 1 x 1 canvas (any CSS colour format); grey if the token is missing */
function toneBytes(name) {
    const c = tone('--olsb-' + name);
    if (!ovProbe || c === 'transparent') return [128, 128, 128];
    ovProbe.fillStyle = '#808080';
    try { ovProbe.fillStyle = c; } catch (e) { /* keep grey */ }
    ovProbe.clearRect(0, 0, 1, 1);
    ovProbe.fillRect(0, 0, 1, 1);
    const d = ovProbe.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
}
/* The outline: a 1 px line where the model's label changes between a voxel and its right or lower neighbour
   (sampled at canvas resolution), in the tissue colour of the labelled side. Empty space is not drawn. */
function drawOverlay(g, kk) {
    const M = model;
    if (!M || !ovCanvas) return;
    const W = canvas.width, H = canvas.height;
    ovCanvas.width = W; ovCanvas.height = H;
    const lbl = new Uint8Array(W * H);
    const { origin, u, v, step } = g;
    const vx = M.vox, o = M.o;
    for (let cy = 0; cy < H; cy++) {
        const gy = (cy + 0.5) / kk - 0.5;
        for (let cx = 0; cx < W; cx++) {
            const gx = (cx + 0.5) / kk - 0.5;
            const i = Math.floor((origin[0] + (u[0] * gx + v[0] * gy) * step - o[0]) / vx);
            const j = Math.floor((origin[1] + (u[1] * gx + v[1] * gy) * step - o[1]) / vx);
            const q = Math.floor((origin[2] + (u[2] * gx + v[2] * gy) * step - o[2]) / vx);
            if (i < 0 || j < 0 || q < 0 || i >= M.nx || j >= M.ny || q >= M.nz) continue;
            lbl[cy * W + cx] = M.lab[i + M.nx * (j + M.ny * q)];
        }
    }
    const img = ovCtx.createImageData(W, H);
    const d = img.data, colours = new Map();
    const colourOf = (code) => {
        let c = colours.get(code);
        if (!c) {
            const L = M.labels[code];
            c = toneBytes(L ? L.tone : 'bone');
            colours.set(code, c);
        }
        return c;
    };
    let n = 0;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const p = y * W + x, a = lbl[p];
            const r = x + 1 < W ? lbl[p + 1] : a, dn = y + 1 < H ? lbl[p + W] : a;
            let code = 0;
            if (r !== a) code = a || r;
            else if (dn !== a) code = a || dn;
            if (!code) continue;
            const c = colourOf(code);
            d[p * 4] = c[0]; d[p * 4 + 1] = c[1]; d[p * 4 + 2] = c[2]; d[p * 4 + 3] = 255;
            n++;
        }
    }
    ovCtx.putImageData(img, 0, 0);
    ovCanvas.setAttribute('data-outline', String(n));
}
function syncOv() {
    if (ovBtn) ovBtn.setAttribute('aria-pressed', String(ov));
    if (ovWrap) ovWrap.hidden = !ov;
    if (ovCanvas) { ovCanvas.hidden = !ov; ovCanvas.style.opacity = String(ovo / 100); }
    if (ovSlider) ovSlider.value = String(ovo);
}
function setOv(on, write) {
    ov = !!on;
    syncOv();
    if (ov) {
        ensureModel().then(() => { if (ov) draw(); }, () => {
            /* degrade silently: the toggle goes back to off and the page carries on */
            ov = false; syncOv(); draw(); writeHash();
        });
    }
    draw();
    if (write) writeHash();
}

/* ---------- drawing ---------- */
function windowed(v, lo, w) {
    return clamp(Math.round(((v - lo) / w) * 255), 0, 255);
}

function draw() {
    const root = $('olsb-ct');
    if (!ready || !root || root.hidden) return;
    const C = palette();
    const s = vol.slice(plane, at, { labels: false });
    const g = s.geom;
    const { width: w, height: h } = g;
    k = Math.max(1, Math.round(640 / w));
    canvas.width = w * k; canvas.height = h * k;
    buf.width = w; buf.height = h;
    const img = bufCtx.createImageData(w, h);
    const win = vol.windows.bone || { center: 128, width: 255 };
    const lo = win.center - win.width / 2;
    bufCtx.fillStyle = C.ground; bufCtx.fillRect(0, 0, w, h);
    const bg = bufCtx.getImageData(0, 0, 1, 1).data;
    let lit = 0;
    for (let n = 0; n < w * h; n++) {
        const v = s.ct[n];
        const o = n * 4;
        if (!(v > 0)) { img.data[o] = bg[0]; img.data[o + 1] = bg[1]; img.data[o + 2] = bg[2]; }
        else { const c = windowed(v, lo, win.width); img.data[o] = c; img.data[o + 1] = c; img.data[o + 2] = c; lit++; }
        img.data[o + 3] = 255;
    }
    bufCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buf, 0, 0, w * k, h * k);
    canvas.setAttribute('data-drawn', String(lit));
    canvas.setAttribute('data-plane', plane);
    canvas.setAttribute('data-at', at.toFixed(2));
    canvas.setAttribute('data-k', String(k));
    if (ov) drawOverlay(g, k);

    const toCanvas = (p) => { const q = vol.rasToPixel(g, p); return [(q[0] + 0.5) * k, (q[1] + 0.5) * k]; };
    const nrm = PLANES[plane].normal;
    hits = [];
    onSlice = [];
    const accent = C.accent;
    const halo = (draw1) => { ctx.save(); ctx.lineWidth = 4.5; ctx.strokeStyle = C.halo; draw1(); ctx.restore(); };

    if (show.sweeps) {
        for (const fam of sweeps) {
            const color = tone(SWEEP_TONE[fam.family] || '--olsb-cast');
            for (const seg of fam.segments) {
                const id = sweepGlossary(fam.family, seg.name);
                const name = id ? (fam.segments.length > 1 && id === SWEEP_G[fam.family] ? `${G[id].name}: ${seg.name.replace(/-/g, ' ')}` : G[id].name)
                    : (fam.segments.length > 1 ? `${human(fam.family)}: ${seg.name.replace(/-/g, ' ')}` : human(fam.family));
                const key = 's:' + fam.family + ':' + seg.name;
                const dist = seg.pts.map((p) => p[nrm] - at);
                const near = dist.map((v) => Math.abs(v) <= SWEEP_TOL);
                let any = false, firstStatus = null;
                for (let n = 0; n < seg.pts.length; n++) {
                    if (!near[n]) continue;
                    any = true;
                    if (firstStatus === null) firstStatus = seg.status[n];
                    const c = toCanvas(seg.pts[n]);
                    hits.push({ x: c[0], y: c[1], key, kind: 'sweep', id, name, status: seg.status[n], mm: seg.pts[n] });
                }
                /* a centreline that crosses the plane between two points outside the band (no segment is drawn there)
                   gets a dot at the interpolated crossing, so a steep run is not lost */
                const dots = [];
                for (let n = 1; n < seg.pts.length; n++) {
                    if ((near[n] && near[n - 1]) || !(dist[n - 1] * dist[n] < 0)) continue;
                    const t = dist[n - 1] / (dist[n - 1] - dist[n]);
                    const p = seg.pts[n - 1].map((v, j) => v + (seg.pts[n][j] - v) * t);
                    const status = seg.status[t < 0.5 ? n - 1 : n];
                    const c = toCanvas(p);
                    dots.push({ c, status });
                    any = true;
                    if (firstStatus === null) firstStatus = status;
                    hits.push({ x: c[0], y: c[1], key, kind: 'sweep', id, name, status, mm: p });
                }
                if (!any) continue;
                onSlice.push({ key, kind: 'sweep', id, name, status: firstStatus });
                const isSel = sel === key;
                const stroke = (a, b, status) => {
                    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
                    ctx.setLineDash(status === 'inferred' ? [5, 4] : []);
                    ctx.stroke();
                };
                for (let n = 1; n < seg.pts.length; n++) {
                    if (!near[n] || !near[n - 1]) continue;
                    const a = toCanvas(seg.pts[n - 1]), b = toCanvas(seg.pts[n]);
                    const status = seg.status[n] === 'inferred' || seg.status[n - 1] === 'inferred' ? 'inferred'
                        : seg.status[n] === 'labelled' || seg.status[n - 1] === 'labelled' ? 'labelled' : 'detected';
                    halo(() => stroke(a, b, status));
                    ctx.lineWidth = isSel ? 3.5 : 2.2; ctx.strokeStyle = isSel ? accent : color;
                    stroke(a, b, status);
                }
                ctx.setLineDash([]);
                for (let n = 0; n < seg.pts.length; n++) {
                    if (!near[n] || seg.status[n] !== 'labelled') continue;
                    const c = toCanvas(seg.pts[n]);
                    ctx.beginPath(); ctx.arc(c[0], c[1], 3.4, 0, 6.2832);
                    ctx.fillStyle = isSel ? accent : color; ctx.fill();
                    ctx.lineWidth = 1.2; ctx.strokeStyle = C.dotEdge; ctx.stroke();
                }
                for (const d of dots) {
                    ctx.beginPath(); ctx.arc(d.c[0], d.c[1], 2.8, 0, 6.2832);
                    ctx.fillStyle = isSel ? accent : color; ctx.fill();
                    ctx.lineWidth = 1; ctx.strokeStyle = C.dotEdge; ctx.stroke();
                }
            }
        }
    }
    if (show.marks) {
        for (const L of marks) {
            if (Math.abs(L.point_mm[nrm] - at) > LANDMARK_TOL) continue;
            const it = landmarkItem(L);
            const c = toCanvas(L.point_mm);
            hits.push({ x: c[0], y: c[1], ...it });
            if (!onSlice.some((o) => o.key === it.key)) onSlice.push({ key: it.key, kind: 'landmark', id: it.id, name: it.name, status: 'labelled' });
            const isSel = sel === it.key;
            ctx.beginPath(); ctx.arc(c[0], c[1], isSel ? 7 : 5, 0, 6.2832);
            ctx.lineWidth = 4; ctx.strokeStyle = C.halo; ctx.stroke();
            ctx.lineWidth = 2; ctx.strokeStyle = isSel ? accent : C.ring; ctx.stroke();
        }
    }
    /* orientation letters */
    const letters = PLANES[plane].letters;
    ctx.font = `600 ${Math.round(k * 5)}px ui-monospace, monospace`;
    ctx.fillStyle = C.letter; ctx.strokeStyle = C.letterEdge; ctx.lineWidth = 3;
    const put = (t, x, y, ax, ay) => { ctx.textAlign = ax; ctx.textBaseline = ay; ctx.strokeText(t, x, y); ctx.fillText(t, x, y); };
    put(letters.left, 6, canvas.height / 2, 'left', 'middle');
    put(letters.right, canvas.width - 6, canvas.height / 2, 'right', 'middle');
    put(letters.top, canvas.width / 2, 6, 'center', 'top');
    put(letters.bottom, canvas.width / 2, canvas.height - 6, 'center', 'bottom');

    renderList();
    renderPos();
}

/* ---------- panels ---------- */
function renderPos() {
    const P = PLANES[plane];
    const text = `${P.title} · ${['x', 'y', 'z'][P.normal]} = ${at >= 0 ? '+' : ''}${at.toFixed(1)} mm from the centre of the oval window`;
    $('olsb-ct-pos').textContent = text;
    $('olsb-ct-slider').setAttribute('aria-valuetext', text);
    $('olsb-ct-slider').value = String(Math.round((at - vol.bounds.min[P.normal]) / vol.axisStep[P.normal]));
    document.querySelectorAll('#olsb-ct-planes [data-pl]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-pl') === PL_KEY[plane])));
}

function renderList() {
    const box = $('olsb-ct-list');
    box.textContent = '';
    const items = onSlice.slice().sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind < b.kind ? 1 : -1));
    $('olsb-ct-count').textContent = items.length ? `${items.length} on this slice` : 'Nothing traced on this slice';
    for (const it of items.slice(0, LIST_MAX)) {
        const b = el('button', 'olsb-chip' + (sel === it.key ? ' active' : ''), it.name);
        b.type = 'button';
        b.setAttribute('data-key', it.key);
        b.title = it.kind === 'sweep' ? `Centreline · ${it.status}` : 'Landmark · labelled';
        b.addEventListener('click', () => select(it.key));
        box.appendChild(b);
    }
}

function select(key) {
    sel = sel === key ? null : key;
    const info = $('olsb-ct-info');
    const hit = sel && (hits.find((h) => h.key === sel) || onSlice.find((o) => o.key === sel));
    info.hidden = !hit;
    info.removeAttribute('data-id');
    if (hit) {
        const gl = hit.id ? G[hit.id] : null;
        if (hit.id) info.setAttribute('data-id', hit.id);
        $('olsb-ct-info-kind').textContent = hit.kind === 'sweep' ? `Centreline · ${hit.status}` : 'Landmark · placed from a UW label';
        $('olsb-ct-info-name').textContent = hit.name;
        $('olsb-ct-info-note').textContent = gl && gl.note ? gl.note : (hit.id ? '' : 'No glossary entry for this structure yet.');
        const m = hit.mm;
        $('olsb-ct-info-mm').textContent = m ? `At (${m.map((v) => v.toFixed(1)).join(', ')}) mm, frame of the oval window` : '';
        $('olsb-ct-info-status').textContent = hit.kind === 'sweep' && meaning[hit.status] ? `${hit.status}: ${meaning[hit.status]}` : '';
    }
    draw();
}

/* ---------- interaction ---------- */
function setAt(v, write) {
    const n = PLANES[plane].normal;
    at = clamp(v, vol.bounds.min[n], vol.bounds.max[n]);
    draw();
    if (write) writeHash();
}
function setPlane(p, write) {
    plane = p;
    const n = PLANES[p].normal;
    at = clamp(at, vol.bounds.min[n], vol.bounds.max[n]);
    sel = null; $('olsb-ct-info').hidden = true;
    configureSlider();
    draw();
    if (write) writeHash();
}
function configureSlider() {
    const n = PLANES[plane].normal;
    const sl = $('olsb-ct-slider');
    sl.min = '0';
    sl.max = String(Math.round((vol.bounds.max[n] - vol.bounds.min[n]) / vol.axisStep[n]));
    sl.step = '1';
}
function onCanvasClick(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const scale = canvas.width / r.width;   /* canvas px per CSS px */
    let best = null, bd = HIT_CSS_PX * scale;
    for (const h of hits) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d <= bd) { bd = d; best = h; }
    }
    if (best) select(best.key);
    else { sel = null; $('olsb-ct-info').hidden = true; draw(); }
}

function wire() {
    canvas = $('olsb-ct-canvas');
    ctx = canvas.getContext('2d');
    buf = document.createElement('canvas');
    bufCtx = buf.getContext('2d');
    canvas.addEventListener('click', onCanvasClick);
    ovCanvas = $('olsb-ct-overlay');
    ovCtx = ovCanvas.getContext('2d');
    ovProbe = document.createElement('canvas').getContext('2d');
    ovBtn = $('olsb-ct-ov');
    ovWrap = $('olsb-ct-ovo-wrap');
    ovSlider = $('olsb-ct-ovo');
    ovBtn.addEventListener('click', () => setOv(!ov, true));
    ovSlider.addEventListener('input', (e) => {
        ovo = parseOvo(e.target.value);
        syncOv();
        if (ov) writeHash();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'm' && e.key !== 'M') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        const root = $('olsb-ct');
        if (!ready || !root || root.hidden) return;
        e.preventDefault();
        setOv(!ov, true);
    });
    $('olsb-ct-pos').setAttribute('aria-live', 'polite');
    canvas.addEventListener('keydown', (e) => {
        const n = PLANES[plane].normal;
        const d = { ArrowUp: 1, ArrowRight: 1, PageUp: 10, ArrowDown: -1, ArrowLeft: -1, PageDown: -10 }[e.key];
        if (!d) return;
        e.preventDefault();
        setAt(at + d * vol.axisStep[n], true);
    });
    $('olsb-ct-slider').addEventListener('input', (e) => {
        const n = PLANES[plane].normal;
        setAt(vol.bounds.min[n] + Number(e.target.value) * vol.axisStep[n], true);
    });
    document.querySelectorAll('#olsb-ct-planes [data-pl]').forEach((b) => b.addEventListener('click', () => setPlane(PL[b.getAttribute('data-pl')], true)));
    document.querySelectorAll('#olsb-ct-show [data-show]').forEach((b) => b.addEventListener('click', () => {
        const key = b.getAttribute('data-show');
        show[key] = !show[key];
        b.setAttribute('aria-pressed', String(show[key]));
        draw();
    }));
    $('olsb-ct-info-close').addEventListener('click', () => { sel = null; $('olsb-ct-info').hidden = true; draw(); });
    try {
        new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch (e) { /* no-op */ }
}

/* ---------- load ---------- */
async function json(file) {
    const r = await fetch(stamped(file));
    if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
    return r.json();
}
function status(msg) {
    const s = $('olsb-ct-status');
    s.textContent = msg || '';
    s.hidden = !msg;
}

function load() {
    if (loading) return loading;
    status('Loading the CT…');
    loading = Promise.all([
        loadVolume({ root: ROOT }),
        json(`${ROOT}/geometry/landmarks.json`),
        json(`${ROOT}/geometry/sweeps.json`),
    ]).then(([v, lm, sw]) => {
        vol = v;
        marks = Array.isArray(lm.landmarks) ? lm.landmarks.filter((L) => Array.isArray(L.point_mm) && L.point_mm.length === 3 && L.point_mm.every(Number.isFinite)) : [];
        meaning = sw.status_meaning && typeof sw.status_meaning === 'object' ? sw.status_meaning : {};
        sweeps = Object.values(sw.sweeps || {}).map((f) => ({
            family: String(f.family),
            segments: (f.segments || []).filter((s) => Array.isArray(s.pts) && Array.isArray(s.status) && s.pts.length === s.status.length),
        }));
        wire();
        const h = readHash();
        plane = Object.prototype.hasOwnProperty.call(PL, h.pl) ? PL[h.pl] : 'axial';
        at = h.at != null && Number.isFinite(parseFloat(h.at)) ? parseFloat(h.at) : 0;
        const n = PLANES[plane].normal;
        at = clamp(at, vol.bounds.min[n], vol.bounds.max[n]);
        configureSlider();
        ready = true;
        status(null);
        ovo = parseOvo(h.ovo);
        ov = h.ov === '1';
        syncOv();
        draw();
        document.documentElement.setAttribute('data-olsb-ct', 'ready');
        if (ov) setOv(true, false);
    }).catch((e) => {
        loading = null;
        status('The CT could not be loaded: ' + (e && e.message ? e.message : 'unknown error'));
    });
    return loading;
}

function enter() {
    load().then(() => { if (ready) { const h = readHash(); if (h.m !== 'ct') writeHash(); draw(); } });
}

document.addEventListener('olsb:mode', (e) => { if (e.detail === 'ct') enter(); });
const main = document.querySelector('main.olsb');
if (main && main.getAttribute('data-mode') === 'ct') enter();
