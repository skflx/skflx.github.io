/* =============================================================
   js/olsb/ct.js — OLSB's CT mode: slices of the real UW temporal bone
   volume (tbone/, plan 2026-11-09-ear-truth-concordance, WP E2).

   Imported lazily by js/olsb/3d.js the first time the mode is entered; only
   then are tbone/ct/* and tbone/geometry/* fetched. The volume is read
   with the generic functions of js/ssb/volume.js (loadVolume with root
   'tbone', slicing, PLANES); nothing in js/ssb is changed. No WebGL: a
   2D canvas, an SVG overlay and real buttons.

   Over the slice: every UW label tip (tbone/geometry/landmarks.json) within
   BAND_MM of it, and the traced centrelines (sweeps.json) where they cross
   it. Names and notes come from js/olsb/glossary.js (window.OLSB.glossary);
   positions only from the data files. Landmark tips are all UW labels, so
   they are rings; the data's `how` field says whether the tip was found at
   the arrowhead (ring) or only from the shaft's end (dashed ring). Sweep
   points carry their own `status`: detected (filled), labelled (ring),
   inferred (dashed). Strings from the data reach the DOM through
   textContent or setAttribute; the hash only selects among known values.
   One specimen, a screen capture: gross position and topology only.
   ============================================================= */
import { loadVolume, stamped, PLANES } from '../ssb/volume.js?v=4807787a';

const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const PLANE_KEY = { ax: 'axial', co: 'coronal', sa: 'sagittal' };
const KEY_OF = { axial: 'ax', coronal: 'co', sagittal: 'sa' };
const AXIS = ['x', 'y', 'z'];
const STATUS = ['detected', 'labelled', 'inferred'];
const DIRS = [['sup', 'Superior'], ['inf', 'Inferior'], ['ant', 'Anterior'], ['post', 'Posterior'], ['lat', 'Lateral'], ['med', 'Medial']];
/* a marker or centreline shows when it lies this close to the slice plane (mm): about three voxels, as UW's own
   label tips scatter by 1.5-2.5 mm between planes (tbone/README.md) */
const BAND_MM = 1;

const O = window.OLSB || {};
const gl = (id) => (O.glossary && O.glossary[id]) || null;
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const point3 = (p) => Array.isArray(p) && p.length === 3 && p.every(finite);

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}
function svg(tag, attrs) {
    const n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach((k) => n.setAttribute(k, String(attrs[k])));
    return n;
}

async function getJSON(file) {
    try {
        const r = await fetch(stamped(file));
        return r.ok ? await r.json() : null;
    } catch (e) { return null; }
}

function cleanLandmarks(doc) {
    const list = doc && Array.isArray(doc.landmarks) ? doc.landmarks : [];
    return list.filter((l) => l && point3(l.point_mm)).map((l) => ({
        p: l.point_mm, g: typeof l.g === 'string' && gl(l.g) ? l.g : null,
        name: typeof l.name === 'string' ? l.name : '', shaft: l.how === 'shaft-end'
    }));
}
function cleanSweeps(doc) {
    const out = [];
    const all = doc && doc.sweeps && typeof doc.sweeps === 'object' ? Object.values(doc.sweeps) : [];
    all.forEach((s) => {
        ((s && s.segments) || []).forEach((sg) => {
            if (!sg || !Array.isArray(sg.pts) || !sg.pts.every(point3)) return;
            const status = Array.isArray(sg.status) ? sg.status : [];
            out.push({ pts: sg.pts, st: sg.pts.map((_, i) => (STATUS.includes(status[i]) ? status[i] : 'inferred')) });
        });
    });
    return out;
}

let vol = null, lms = [], sweeps = [], booted = null;
const st = { plane: 'axial', idx: 0, sel: null };
let frame, canvas, marks, lines, tip, slider, readout, raf = 0;

const count = (plane) => vol.dims[PLANES[plane].normal];
const atOf = (plane, i) => { const n = PLANES[plane].normal; return vol.bounds.min[n] + i * vol.axisStep[n]; };
const middle = (plane) => Math.floor((count(plane) - 1) / 2);

function readHash() {
    let h = '';
    try { h = location.hash.slice(1); } catch (e) { /* no-op */ }
    const get = (k) => { const m = new RegExp('(?:^|&)' + k + '=([^&]*)').exec(h); return m ? m[1] : null; };
    const plane = PLANE_KEY[get('p')] || 'axial';
    const i = /^\d{1,4}$/.test(get('i') || '') ? parseInt(get('i'), 10) : -1;
    return { plane, idx: i >= 0 && i < count(plane) ? i : middle(plane) };
}
function writeHash() {
    try { history.replaceState(null, '', '#m=ct&p=' + KEY_OF[st.plane] + '&i=' + st.idx); } catch (e) { /* no-op */ }
}

/* ---------- drawing ---------- */
function showTip(text, x, y) {
    tip.textContent = text;
    tip.style.left = x + '%';
    tip.style.top = y + '%';
    tip.hidden = false;
}

function drawImage(s) {
    const { width, height } = s.geom;
    canvas.width = width;
    canvas.height = height;
    frame.style.aspectRatio = width + ' / ' + height;
    const w = vol.windows.bone || { center: 128, width: 255 };
    const lo = w.center - w.width / 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(width, height);
    for (let n = 0; n < s.ct.length; n++) {
        const v = s.ct[n];
        const g = Number.isNaN(v) ? 0 : Math.max(0, Math.min(255, ((v - lo) / w.width) * 255));
        img.data[n * 4] = img.data[n * 4 + 1] = img.data[n * 4 + 2] = g;
        img.data[n * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
}

function drawOverlay(s) {
    const { width, height } = s.geom;
    const n = PLANES[st.plane].normal;
    const at = s.geom.at;
    const px = (p) => { const q = vol.rasToPixel(s.geom, p); return [q[0] + 0.5, q[1] + 0.5]; };
    marks.textContent = '';
    lines.textContent = '';
    lines.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    tip.hidden = true;

    /* centrelines: runs of one status inside the band, and a dot where a line crosses the plane */
    sweeps.forEach((sw) => {
        const d = sw.pts.map((p) => p[n] - at);
        let run = [], rs = null;
        const flush = () => {
            if (run.length > 1) lines.appendChild(svg('polyline', { points: run.map((p) => px(p).join(',')).join(' '), class: 'ct-line ct-' + rs }));
            run = [];
            rs = null;
        };
        for (let i = 0; i < sw.pts.length; i++) {
            const inside = Math.abs(d[i]) <= BAND_MM;
            if (inside) {
                if (rs !== null && sw.st[i] !== rs) { run.push(sw.pts[i]); flush(); }
                if (rs === null) rs = sw.st[i];
                run.push(sw.pts[i]);
            } else flush();
            if (i > 0 && !inside && Math.abs(d[i - 1]) > BAND_MM && d[i] * d[i - 1] < 0) {
                const t = d[i - 1] / (d[i - 1] - d[i]);
                const c = px(sw.pts[i - 1].map((v, k) => v + (sw.pts[i][k] - v) * t));
                lines.appendChild(svg('circle', { cx: c[0], cy: c[1], r: 1.6, class: 'ct-dot ct-' + sw.st[t < 0.5 ? i - 1 : i] }));
            }
        }
        flush();
    });

    /* UW label tips */
    let shown = 0;
    lms.forEach((l) => {
        if (Math.abs(l.p[n] - at) > BAND_MM) return;
        shown += 1;
        const [x, y] = px(l.p);
        const gx = (x / width) * 100, gy = (y / height) * 100;
        const name = l.g ? gl(l.g).name || l.g : l.name;
        const m = el(l.g ? 'button' : 'span', 'ct-lm' + (l.shaft ? ' ct-shaft' : '') + (l.g ? '' : ' ct-plain'));
        m.style.left = gx + '%';
        m.style.top = gy + '%';
        if (l.g) {
            m.type = 'button';
            m.setAttribute('data-g', l.g);
            m.setAttribute('aria-label', name);
            m.setAttribute('aria-pressed', String(st.sel === l.g));
            m.addEventListener('click', () => select(l.g));
            m.addEventListener('focus', () => showTip(name, gx, gy));
            m.addEventListener('blur', () => { tip.hidden = true; });
        } else m.setAttribute('aria-hidden', 'true');
        m.addEventListener('mouseenter', () => showTip(name, gx, gy));
        m.addEventListener('mouseleave', () => { tip.hidden = true; });
        if (l.g && l.g === st.sel) m.classList.add('is-sel');
        marks.appendChild(m);
    });
    return shown;
}

function render() {
    raf = 0;
    const count_ = count(st.plane);
    st.idx = Math.max(0, Math.min(count_ - 1, st.idx));
    const at = atOf(st.plane, st.idx);
    const s = vol.slice(st.plane, at, { labels: false });
    drawImage(s);
    const shown = drawOverlay(s);
    const L = PLANES[st.plane].letters;
    ['left', 'right', 'top', 'bottom'].forEach((k) => { $('olsbct-ori-' + k).textContent = L[k]; });
    slider.max = String(count_ - 1);
    slider.value = String(st.idx);
    const axis = AXIS[PLANES[st.plane].normal];
    const text = PLANES[st.plane].title + ' slice ' + (st.idx + 1) + ' of ' + count_ + ' · ' + axis + ' = ' + (s.geom.at >= 0 ? '+' : '') + s.geom.at.toFixed(1) + ' mm from the oval window · ' + shown + (shown === 1 ? ' label tip' : ' label tips');
    readout.textContent = text;
    slider.setAttribute('aria-valuetext', text);
    writeHash();
}
const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };

function step(d) {
    st.idx = Math.max(0, Math.min(count(st.plane) - 1, st.idx + d));
    schedule();
}
function setPlane(plane) {
    if (!PLANES[plane] || plane === st.plane) return;
    st.plane = plane;
    st.idx = middle(plane);
    syncPlanes();
    schedule();
}
function syncPlanes() {
    document.querySelectorAll('#olsbct-planes [data-plane]').forEach((b) => b.setAttribute('aria-pressed', String(PLANE_KEY[b.getAttribute('data-plane')] === st.plane)));
}

/* ---------- selection (info card) ---------- */
function select(id) {
    st.sel = id && gl(id) ? id : null;
    document.querySelectorAll('#olsbct-marks [data-g]').forEach((b) => {
        const on = b.getAttribute('data-g') === st.sel;
        b.classList.toggle('is-sel', on);
        b.setAttribute('aria-pressed', String(on));
    });
    const box = $('olsbct-info');
    box.hidden = !st.sel;
    if (!st.sel) return;
    const g = gl(st.sel);
    $('olsbct-info-name').textContent = g.name || st.sel;
    $('olsbct-info-note').textContent = g.note || '';
    const rel = $('olsbct-info-rel');
    rel.textContent = '';
    DIRS.forEach(([dir, label]) => {
        const ids = ((g.rel || {})[dir] || []).filter((o) => gl(o));
        if (!ids.length) return;
        const row = el('div', 'olsb-rel-row');
        row.appendChild(el('span', 'olsb-rel-dir', label));
        row.appendChild(el('span', 'olsb-rel-list', ids.map((o) => gl(o).name || o).join(', ')));
        rel.appendChild(row);
    });
    $('olsbct-info-rel-wrap').hidden = !rel.children.length;
}

/* ---------- boot ---------- */
function status(text) {
    const s = $('olsbct-status');
    s.hidden = !text;
    if (text) s.textContent = text;
}

let wired = false;
function wire() {
    if (wired) return;
    wired = true;
    frame = $('olsbct-frame');
    canvas = $('olsbct-canvas');
    marks = $('olsbct-marks');
    lines = $('olsbct-lines');
    tip = $('olsbct-tip');
    slider = $('olsbct-slice');
    readout = $('olsbct-readout');
    document.querySelectorAll('#olsbct-planes [data-plane]').forEach((b) => b.addEventListener('click', () => setPlane(PLANE_KEY[b.getAttribute('data-plane')])));
    slider.addEventListener('input', () => { st.idx = parseInt(slider.value, 10) || 0; schedule(); });
    /* the image and its markers: Up / Down one slice, PageUp / PageDown ten */
    frame.addEventListener('keydown', (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const d = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
        if (d) { step(d); e.preventDefault(); } else if (e.key === 'Escape') select(null);
    });
    $('olsbct-info-close').addEventListener('click', () => select(null));
}

async function boot() {
    wire();
    status('Loading the CT slices…');
    try {
        const [v, lmDoc, swDoc] = await Promise.all([
            loadVolume({ root: 'tbone' }),
            getJSON('tbone/geometry/landmarks.json'),
            getJSON('tbone/geometry/sweeps.json')
        ]);
        vol = v;
        lms = cleanLandmarks(lmDoc);
        sweeps = cleanSweeps(swDoc);
    } catch (e) {
        status('The CT slices could not be loaded' + (e && e.message ? ': ' + e.message : '.') + ' The other modes still work.');
        throw e;
    }
    const h = readHash();
    st.plane = h.plane;
    st.idx = h.idx;
    syncPlanes();
    status(null);
    $('olsbct-controls').hidden = false;
    render();
    $('olsbct').setAttribute('data-ct', 'ready');
}

/* Called on every entry to the mode; loads once, and retries after a failure. */
export function mountCT() {
    if (!booted) booted = boot().catch((e) => { booted = null; });
    else if (vol) { schedule(); }
    return booted;
}
