/* =============================================================
   mode-ct.js — the CT stage (docs/ssb.md 3, 5.6): three linked slice
   canvases (axial, coronal, sagittal) over the CPU-sampled volume.

   Needs no WebGL: a slice is resampled from the typed arrays (volume.js)
   into an offscreen canvas, windowed, scaled onto the view, then the label
   outlines and the crosshair are drawn on top. The crosshair is one RAS
   point in the store (state.ct.at, clamped to the volume's bounds); every
   view follows it, so moving it anywhere moves it everywhere.

   - Click or drag a view: move the crosshair in that plane (the view
     becomes the active plane). A click that does not drag also selects the
     graph entity under the crosshair, through the ordinary store path.
   - Wheel, arrow keys: scroll the active plane one voxel (PageUp/PageDown
     ten). Shift+arrows move the crosshair within the plane. 1/2/3 pick a
     plane, W cycles the window, O toggles the label outlines, Home recentres.
   - Window presets come from ct.json; a right-button, middle-button or Alt
     drag changes width (across) and level (up/down).
   - Hovering names the structure under the pointer (label table -> graph
     id -> graph name) and gives the approximate HU (volume.toHU).
   - Display is radiological (patient right on the image's left) with the
     orientation letters of each view; the stage is dark in both themes.

   The volume loads on first entry (docs/ssb.md 5.4). If ssb/ct/ct.json is
   absent, or cannot be read, the stage shows a message in its place.
   Outlines take their colour from the same --ssb-* tokens the 3D materials
   use (materials.js: a structure is one colour in 3D and on CT). Text from
   the volume reaches the DOM through textContent only.

   `hook` is the read-only test window (window.__ssb.ct).
   ============================================================= */
import { token, kindForGraph, kindToken, CELL_TINT } from './materials.js?v=d27e5b3d';
import { sharedVolume, PLANES } from './volume.js?v=180928b1';
import { CT_PLANES } from './state.js?v=2a74ae90';

const LITTLE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
const NEUTRAL_TOKEN = '--ssb-cell-ethmoid';
const DRAG_PX = 5;          /* a press that moves less than this is a click */
const WHEEL_PX = 80;        /* wheel travel per slice */
const VALUE_MAX = 255;      /* the volume is uint8 */
const MINUS = '−';

/* '#abc' | '#aabbcc' | 'rgb(r, g, b)' -> [r, g, b] (or null). */
function parseColor(text) {
    const s = String(text).trim();
    let m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
    m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(s);
    if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
/* RGB(A) -> the uint32 a little-endian ImageData buffer reads as that colour. */
const pack = (rgb, alpha = 255) => (LITTLE ? ((alpha << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0]) >>> 0
    : ((rgb[0] << 24) | (rgb[1] << 16) | (rgb[2] << 8) | alpha) >>> 0);

const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const sideText = (side) => (side === 'R' ? ' (right)' : side === 'L' ? ' (left)' : '');
const fixed = (v, n = 1) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(n);

/* dom: the skeleton ui-ct.js builds (views, caption, tip, letters, readout, msg, truth, live). */
export function mountCt({ store, graph, dom, loadFn = sharedVolume }) {
    const { root } = dom;
    const views = {};
    let vol = null;
    let status = 'idle';         /* idle | loading | ready | absent | error */
    let problem = '';
    let win = { name: '', center: 128, width: 255 };
    let overlay = true;
    let hover = null;            /* what is under the pointer while it rests on a view */
    let selected = new Set();    /* label indices of the selected graph entity */
    const renders = { axial: 0, coronal: 0, sagittal: 0 };
    const subs = new Set();
    const dirty = new Set();
    let queued = false;
    let palette = null;
    let announced = '';
    let announceTimer = 0;
    let generation = 0;          /* bumped when the palette is read again (invalidates cached outlines) */

    /* ---------------- names and colours ---------------- */

    /* A label index -> what to show for it. */
    function describeLabel(index) {
        if (!vol || !index) return { index: 0, label: null, graphId: null, name: '' };
        const d = vol.describe(index);
        if (!d) return { index, label: null, graphId: null, name: `Label ${index}` };
        const graphId = graph.has(d.id) ? d.id : null;
        return { index, label: d.name, graphId, name: (graphId ? graph.nameOf(graphId) : d.name) + sideText(d.side) };
    }

    /* The --ssb-* token a graph id is outlined with: its IFAC cell hue, else
       its tissue kind's token (materials.js), else the unclassified slate. */
    function tokenFor(graphId) {
        if (graphId && Object.prototype.hasOwnProperty.call(CELL_TINT, graphId)) return '--ssb-' + CELL_TINT[graphId];
        const e = graphId ? graph.get(graphId) : null;
        const kind = e ? kindForGraph(e.kind) : null;
        if (kind === 'air-cell') return NEUTRAL_TOKEN;
        const name = kind ? kindToken(kind) : null;
        return name ? '--ssb-' + name : NEUTRAL_TOKEN;
    }

    function readPalette() {
        const rgb = (name, fallback) => parseColor(token(name, fallback)) || parseColor(fallback);
        const neutral = rgb(NEUTRAL_TOKEN, '#8E9BA6');
        const colors = new Uint32Array(65536).fill(pack(neutral));
        const css = new Map();
        if (vol) {
            for (const index of vol.labelIndices()) {
                const d = vol.describe(index);
                const name = tokenFor(d && graph.has(d.id) ? d.id : null);
                const c = rgb(name, '#8E9BA6');
                colors[index] = pack(c);
                css.set(index, `rgb(${c[0]}, ${c[1]}, ${c[2]})`);
            }
        }
        const select = rgb('--ssb-select', '#FFB000');
        generation += 1;
        palette = {
            generation, colors, css, neutral: `rgb(${neutral[0]}, ${neutral[1]}, ${neutral[2]})`,
            bg: token('--ssb-ct-bg', '#0b0d0e'),
            cross: token('--ssb-ct-cross', '#FFB000'),
            selectFill: pack(select, 72),
        };
    }

    function readSelection() {
        selected = new Set();
        const sel = store.get().selection;
        if (!vol || !sel) return;
        for (const index of vol.labelIndices()) {
            const d = vol.describe(index);
            if (d && d.id === sel) selected.add(index);
        }
    }

    /* ---------------- the cursor and the window ---------------- */

    const active = () => (store.get().ct ? store.get().ct.plane : 'axial');
    const cursor = () => {
        const at = store.get().ct && store.get().ct.at;
        return vol ? vol.clampRAS(at || vol.center) : [0, 0, 0];
    };

    function moveTo(ras, plane = active(), source = 'cursor') {
        if (status !== 'ready') return false;
        return store.setCt({ plane, at: ras }, { source });
    }

    function setPlane(plane) {
        if (!CT_PLANES.includes(plane)) return false;
        const cur = store.get().ct;
        if (cur && cur.plane === plane) return false;
        return store.setCt({ plane, at: cur ? cur.at : null }, { source: 'ct' });
    }

    /* `steps` voxels along the normal of `plane`. */
    function scroll(steps, plane = active()) {
        if (status !== 'ready') return false;
        const n = PLANES[plane].normal;
        const at = cursor();
        at[n] += steps * vol.axisStep[n];
        return moveTo(at, plane);
    }

    /* `dx`, `dy` pixels within `plane`'s image. */
    function nudge(dx, dy, plane = active()) {
        if (status !== 'ready') return false;
        const p = PLANES[plane];
        const at = cursor();
        for (let n = 0; n < 3; n++) at[n] += (p.u[n] * dx + p.v[n] * dy) * vol.step;
        return moveTo(at, plane);
    }

    function setWindow({ center = win.center, width = win.width, name = null } = {}) {
        if (!finite(center) || !finite(width)) return false;
        const w = Math.min(VALUE_MAX, Math.max(1, Math.round(width)));
        const c = Math.min(VALUE_MAX, Math.max(0, Math.round(center)));
        let label = name;
        if (label === null) {
            label = '';
            if (vol) for (const [key, p] of Object.entries(vol.windows)) if (Math.round(p.center) === c && Math.round(p.width) === w) label = key;
        }
        if (w === win.width && c === win.center && label === win.name) return false;
        win = { name: label, center: c, width: w };
        markAll();
        emit();
        return true;
    }

    function setPreset(name) {
        const p = vol && Object.prototype.hasOwnProperty.call(vol.windows, name) ? vol.windows[name] : null;
        return p ? setWindow({ center: p.center, width: p.width, name }) : false;
    }

    function cycleWindow(dir = 1) {
        const names = vol ? Object.keys(vol.windows) : [];
        if (!names.length) return false;
        const at = names.indexOf(win.name);
        return setPreset(names[(at + dir + names.length) % names.length]);
    }

    function setOverlay(on) {
        const next = !!on && !!vol && vol.hasLabels;
        if (next === overlay) return false;
        overlay = next;
        markAll();
        emit();
        return true;
    }

    /* ---------------- what is under a point ---------------- */

    function describeAt(ras) {
        if (!vol) return null;
        const value = vol.sample(ras[0], ras[1], ras[2]);
        const index = vol.hasLabels ? vol.labelAt(ras[0], ras[1], ras[2]) : 0;
        const hu = vol.toHU(value);
        return { ...describeLabel(index), value, hu: hu === null ? null : Math.round(hu), ras: ras.map((v) => Math.round(v * 100) / 100) };
    }

    const huText = (hu) => (hu === null ? '' : `≈ ${hu < 0 ? MINUS : ''}${Math.abs(hu)} HU`);

    /* ---------------- geometry of a view ---------------- */

    /* client point -> RAS mm on `plane` (its normal coordinate is the slice's). */
    function rasFromClient(plane, clientX, clientY) {
        const v = views[plane];
        const L = v.layout;
        if (!L) return null;
        const rect = v.canvas.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return null;
        const x = (clientX - rect.left) * (v.canvas.width / rect.width);
        const y = (clientY - rect.top) * (v.canvas.height / rect.height);
        const px = (x - L.dx) / (L.dw / L.geom.width) - 0.5;
        const py = (y - L.dy) / (L.dh / L.geom.height) - 0.5;
        return vol.pixelToRAS(L.geom, px, py);
    }

    /* RAS mm -> client point on `plane`'s canvas. */
    function clientFromRas(plane, ras) {
        const v = views[plane];
        const L = v.layout;
        if (!L) return null;
        const rect = v.canvas.getBoundingClientRect();
        const [px, py] = vol.rasToPixel(L.geom, ras);
        const x = L.dx + (px + 0.5) * (L.dw / L.geom.width);
        const y = L.dy + (py + 0.5) * (L.dh / L.geom.height);
        return { x: rect.left + x * (rect.width / v.canvas.width), y: rect.top + y * (rect.height / v.canvas.height) };
    }

    /* ---------------- drawing ---------------- */

    function grayImage(v, sl, key) {
        if (v.gray && v.gray.key === key) return v.gray.canvas;
        const { width, height } = sl.geom;
        const canvas = v.gray ? v.gray.canvas : document.createElement('canvas');
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(width, height);
        const px = new Uint32Array(img.data.buffer);
        const lut = new Uint32Array(VALUE_MAX + 1);
        const lo = win.center - win.width / 2;
        for (let n = 0; n <= VALUE_MAX; n++) {
            const g = Math.round(255 * Math.min(1, Math.max(0, (n - lo) / win.width)));
            lut[n] = pack([g, g, g]);
        }
        const data = sl.ct;
        for (let n = 0; n < data.length; n++) {
            const val = data[n];
            px[n] = val === val ? lut[Math.min(VALUE_MAX, Math.max(0, Math.round(val)))] : 0;   /* NaN: outside the volume */
        }
        ctx.putImageData(img, 0, 0);
        v.gray = { key, canvas };
        return canvas;
    }

    /* Label outlines at display resolution: a labelled pixel with a
       different label within `t` pixels above, below, left or right. */
    function outlineImage(v, sl, dw, dh, t, key) {
        if (v.outline && v.outline.key === key) return v.outline.canvas;
        const { width: w, height: h } = sl.geom;
        const lab = sl.labels;
        const col = new Int32Array(dw);
        for (let x = 0; x < dw; x++) col[x] = Math.min(w - 1, Math.floor((x * w) / dw));
        const row = new Int32Array(dh);
        for (let y = 0; y < dh; y++) row[y] = Math.min(h - 1, Math.floor((y * h) / dh)) * w;
        const canvas = v.outline ? v.outline.canvas : document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(dw, dh);
        const px = new Uint32Array(img.data.buffer);
        const colors = palette.colors;
        const fill = palette.selectFill;
        for (let y = 0; y < dh; y++) {
            const ry = row[y];
            const up = y - t >= 0 ? row[y - t] : -1;
            const down = y + t < dh ? row[y + t] : -1;
            for (let x = 0; x < dw; x++) {
                const a = lab[ry + col[x]];
                if (!a) continue;
                const l = x - t >= 0 ? lab[ry + col[x - t]] : 0;
                const r = x + t < dw ? lab[ry + col[x + t]] : 0;
                const u = up >= 0 ? lab[up + col[x]] : 0;
                const d = down >= 0 ? lab[down + col[x]] : 0;
                if (l !== a || r !== a || u !== a || d !== a) px[y * dw + x] = colors[a];
                else if (selected.has(a)) px[y * dw + x] = fill;
            }
        }
        ctx.putImageData(img, 0, 0);
        v.outline = { key, canvas };
        return canvas;
    }

    function draw(plane) {
        const v = views[plane];
        if (status !== 'ready' || !vol || root.hidden) return;
        const rect = v.canvas.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const bw = Math.round(rect.width * dpr);
        const bh = Math.round(rect.height * dpr);
        if (v.canvas.width !== bw || v.canvas.height !== bh) { v.canvas.width = bw; v.canvas.height = bh; }

        const cur = cursor();
        const n = PLANES[plane].normal;
        const sliceKey = plane + cur[n].toFixed(3);
        if (!v.slice || v.slice.key !== sliceKey) v.slice = { key: sliceKey, slice: vol.slice(plane, cur[n]) };
        const sl = v.slice.slice;
        const g = sl.geom;

        const scale = Math.min(bw / g.width, bh / g.height);
        const dw = Math.max(1, Math.round(g.width * scale));
        const dh = Math.max(1, Math.round(g.height * scale));
        const dx = Math.floor((bw - dw) / 2);
        const dy = Math.floor((bh - dh) / 2);
        v.layout = { dx, dy, dw, dh, geom: g, dpr };

        const ctx = v.canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, bw, bh);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(grayImage(v, sl, `${sliceKey}|${win.center}|${win.width}`), 0, 0, g.width, g.height, dx, dy, dw, dh);

        if (overlay && vol.hasLabels) {
            const t = Math.max(1, Math.round(dpr));
            const key = `${sliceKey}|${dw}x${dh}|${t}|${[...selected].join(',')}|${palette.generation}`;
            ctx.drawImage(outlineImage(v, sl, dw, dh, t, key), dx, dy);
        }

        /* the crosshair: four arms around a small gap, inside the image */
        const [px, py] = vol.rasToPixel(g, cur);
        const cx = Math.round(dx + (px + 0.5) * (dw / g.width));
        const cy = Math.round(dy + (py + 0.5) * (dh / g.height));
        const t = Math.max(1, Math.round(dpr));
        const gap = Math.round(9 * dpr);
        ctx.fillStyle = palette.cross;
        const arm = (x, y, w, h) => { if (w > 0 && h > 0) ctx.fillRect(x, y, w, h); };
        arm(cx - Math.floor(t / 2), dy, t, cy - gap - dy);
        arm(cx - Math.floor(t / 2), cy + gap, t, dy + dh - (cy + gap));
        arm(dx, cy - Math.floor(t / 2), cx - gap - dx, t);
        arm(cx + gap, cy - Math.floor(t / 2), dx + dw - (cx + gap), t);

        v.cross = { cx, cy };
        renders[plane] += 1;
        chrome(plane, cur);
    }

    const markAll = () => { for (const p of CT_PLANES) dirty.add(p); schedule(); };
    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            for (const p of [...dirty]) { dirty.delete(p); draw(p); }
        });
    }

    /* ---------------- captions, labels, readout ---------------- */

    function chrome(plane, cur) {
        const info = PLANES[plane];
        const v = views[plane];
        const coord = cur[info.normal];
        const pos = `${coord >= 0 ? info.sign[0] : info.sign[1]} ${fixed(Math.abs(coord))} mm`;
        v.dom.caption.textContent = pos;
        v.canvas.setAttribute('aria-label', `${info.title} CT slice at ${pos}. Crosshair at R ${fixed(cur[0])}, A ${fixed(cur[1])}, S ${fixed(cur[2])} mm. `
            + 'Arrow keys scroll slices, Shift with arrows moves the crosshair.');
    }

    function readout() {
        const cur = cursor();
        const d = describeAt(cur);
        dom.readout.pos.textContent = `R ${fixed(cur[0])} · A ${fixed(cur[1])} · S ${fixed(cur[2])} mm`;
        dom.readout.what.textContent = [d.name || (vol.hasLabels ? 'Unlabelled' : ''), huText(d.hu)].filter(Boolean).join(' · ');
        /* the structure under the crosshair, spoken once the crosshair settles */
        clearTimeout(announceTimer);
        announceTimer = setTimeout(() => {
            const said = d.name || 'Unlabelled';
            if (said !== announced) { announced = said; dom.live.textContent = `Crosshair: ${said}`; }
        }, 400);
    }

    function showMessage() {
        const text = status === 'loading' ? 'Loading the CT volume…'
            : status === 'absent' ? 'There is no CT volume in this build yet (ssb/ct/ct.json was not found). The structure list, search and panels still work.'
                : status === 'error' ? `The CT volume could not be loaded. ${problem}` : '';
        dom.msg.textContent = text;
        dom.msg.hidden = !text;
    }

    function syncStage() {
        root.dataset.status = status;
        const act = active();
        for (const p of CT_PLANES) views[p].dom.view.dataset.active = p === act ? 'true' : 'false';
        showMessage();
        if (status === 'ready') {
            const h = vol.header;
            dom.truth.textContent = `Specimen CT · ${h.specimen || 'unnamed'} · n = 1 · ${h.values.kind === 'display' ? 'display values, not HU' : 'HU'}`;
            dom.truth.title = h.values.note || '';
            dom.truth.hidden = false;
        } else dom.truth.hidden = true;
    }

    /* ---------------- hover ---------------- */

    function showTip(plane, e) {
        const v = views[plane];
        const ras = rasFromClient(plane, e.clientX, e.clientY);
        const tip = v.dom.tip;
        if (!ras) { tip.hidden = true; hover = null; return; }
        const inside = ras.every((c, n) => c >= vol.bounds.min[n] - vol.axisStep[n] / 2 && c <= vol.bounds.max[n] + vol.axisStep[n] / 2);
        if (!inside) { tip.hidden = true; hover = null; return; }
        const d = describeAt(ras);
        hover = { plane, ...d };
        const text = [d.name, huText(d.hu)].filter(Boolean).join(' · ');
        if (!text) { tip.hidden = true; return; }
        tip.textContent = text;
        tip.hidden = false;
        const r = v.dom.view.getBoundingClientRect();
        let x = e.clientX - r.left + 14;
        const y = e.clientY - r.top + 16;
        if (x + tip.offsetWidth > r.width - 4) x = Math.max(4, e.clientX - r.left - tip.offsetWidth - 10);
        tip.style.transform = `translate(${x.toFixed(0)}px, ${Math.min(y, r.height - tip.offsetHeight - 4).toFixed(0)}px)`;
    }

    function hideTip(plane) {
        views[plane].dom.tip.hidden = true;
        if (hover && hover.plane === plane) hover = null;
    }

    /* ---------------- input ---------------- */

    function wireView(plane) {
        const v = views[plane];
        const canvas = v.canvas;
        let drag = null;

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('focus', () => setPlane(plane));
        canvas.addEventListener('pointerdown', (e) => {
            if (status !== 'ready') return;
            const windowing = e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey);
            if (e.button !== 0 && !windowing) return;
            e.preventDefault();
            canvas.focus({ preventScroll: true });
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer: keep going */ }
            hideTip(plane);
            drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, windowing, moved: false };
            if (!windowing) {
                const ras = rasFromClient(plane, e.clientX, e.clientY);
                if (ras) moveTo(ras, plane);
            }
        });
        canvas.addEventListener('pointermove', (e) => {
            if (status !== 'ready') return;
            if (!drag) { if (e.pointerType !== 'touch') showTip(plane, e); return; }
            if (e.pointerId !== drag.id) return;
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > DRAG_PX) drag.moved = true;
            if (drag.windowing) {
                const k = VALUE_MAX / 300;
                setWindow({ width: win.width + (e.clientX - drag.x) * k, center: win.center - (e.clientY - drag.y) * k, name: '' });
            } else {
                const ras = rasFromClient(plane, e.clientX, e.clientY);
                if (ras) moveTo(ras, plane);
            }
            drag.x = e.clientX;
            drag.y = e.clientY;
        });
        const end = (e) => {
            if (!drag || e.pointerId !== drag.id) return;
            const was = drag;
            drag = null;
            if (e.type === 'pointerup' && !was.windowing && !was.moved) selectUnderCrosshair();
        };
        canvas.addEventListener('pointerup', end);
        canvas.addEventListener('pointercancel', end);
        canvas.addEventListener('pointerleave', () => { if (!drag) hideTip(plane); });

        canvas.addEventListener('wheel', (e) => {
            if (status !== 'ready') return;
            e.preventDefault();
            v.wheel += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
            const steps = Math.trunc(Math.abs(v.wheel) / WHEEL_PX);
            if (!steps) return;
            const dir = v.wheel < 0 ? 1 : -1;                /* wheel up: toward S, A, R */
            v.wheel -= Math.sign(v.wheel) * steps * WHEEL_PX;
            scroll(dir * steps, plane);
        }, { passive: false });

        canvas.addEventListener('keydown', (e) => {
            if (status !== 'ready' || e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key;
            let handled = true;
            if (k === 'ArrowUp' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowLeft') {
                if (e.shiftKey) nudge(k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0, k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0, plane);
                else scroll(k === 'ArrowUp' || k === 'ArrowRight' ? 1 : -1, plane);
            } else if (k === 'PageUp') scroll(10, plane);
            else if (k === 'PageDown') scroll(-10, plane);
            else if (k === 'Home') moveTo(vol.center, plane);
            else if (k === '1' || k === '2' || k === '3') {
                const to = CT_PLANES[Number(k) - 1];
                setPlane(to);
                views[to].canvas.focus({ preventScroll: true });
            } else if (k === 'w' || k === 'W') cycleWindow(e.shiftKey ? -1 : 1);
            else if (k === 'o' || k === 'O') setOverlay(!overlay);
            else handled = false;
            if (handled) e.preventDefault();
        });
    }

    /* A click on a labelled voxel selects its graph entity (panel, tree and
       URL follow the store); a click on nothing leaves the selection alone. */
    function selectUnderCrosshair() {
        const d = describeAt(cursor());
        if (d && d.graphId) store.select(d.graphId, { source: 'scene' });
    }

    /* ---------------- loading ---------------- */

    async function start() {
        if (status === 'loading' || status === 'ready') return;
        status = 'loading';
        problem = '';
        syncStage();
        emit();
        try {
            vol = await loadFn();
        } catch (e) {
            vol = null;
            status = e && e.code === 'absent' ? 'absent' : 'error';
            problem = e && e.message ? String(e.message) : 'Unknown error.';
            if (status === 'error') console.error(e);
            syncStage();
            emit();
            return;
        }
        store.setCtBounds(vol.bounds);
        const names = Object.keys(vol.windows);
        const first = vol.windows.bone ? 'bone' : names[0];
        win = first ? { name: first, center: Math.round(vol.windows[first].center), width: Math.round(vol.windows[first].width) } : { name: '', center: 128, width: 255 };
        overlay = vol.hasLabels;
        readPalette();
        readSelection();
        status = 'ready';
        syncStage();
        readout();
        emit();
        markAll();
    }

    /* ---------------- follow the page ---------------- */

    store.subscribe((state, prev) => {
        if (state.ct !== prev.ct) {
            root.hidden = !state.ct;
            if (state.ct && !prev.ct) start();
            if (!state.ct || !prev.ct || state.ct.plane !== prev.ct.plane) syncStage();
            if (status === 'ready' && state.ct) { readout(); markAll(); }
            emit();
        }
        if (state.selection !== prev.selection && status === 'ready') {
            readSelection();
            if (state.ct) markAll();
        }
    });
    new MutationObserver(() => {
        if (status !== 'ready') return;
        readPalette();
        markAll();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    for (const p of CT_PLANES) {
        views[p] = { dom: dom.views[p], canvas: dom.views[p].canvas, layout: null, slice: null, gray: null, outline: null, cross: null, wheel: 0 };
        wireView(p);
        if (typeof ResizeObserver === 'function') new ResizeObserver(() => { dirty.add(p); schedule(); }).observe(dom.views[p].canvas);
    }
    if (typeof ResizeObserver !== 'function') window.addEventListener('resize', markAll);

    function emit() { for (const fn of [...subs]) { try { fn(); } catch (e) { console.error(e); } } }

    /* Distinct graph entities with a label in the volume, for a colour key. */
    function legend() {
        if (!vol || !palette) return [];
        const seen = new Map();
        for (const index of vol.labelIndices()) {
            const d = describeLabel(index);
            const key = d.graphId || d.label;
            if (!key || seen.has(key)) continue;
            const base = vol.describe(index);
            seen.set(key, { graphId: d.graphId, name: d.graphId ? graph.nameOf(d.graphId) : base.id, color: palette.css.get(index) || palette.neutral });
        }
        return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    root.hidden = !store.get().ct;
    syncStage();
    if (store.get().ct) start();

    /* ---------------- the test window ---------------- */

    const hook = Object.freeze({
        get status() { return status; },
        get plane() { return active(); },
        get cursor() { return vol ? cursor() : null; },
        get window() { return { ...win }; },
        get overlay() { return overlay; },
        get dims() { return vol ? vol.dims.slice() : null; },
        get spacing() { return vol ? vol.spacing.slice() : null; },
        get bounds() { return vol ? { min: vol.bounds.min.slice(), max: vol.bounds.max.slice() } : null; },
        get renders() { return { ...renders }; },
        get hover() { return hover ? { ...hover } : null; },
        get problem() { return problem; },
        get selectedLabels() { return [...selected]; },
        describeAt: (ras) => describeAt(ras),
        rasAt: (plane, x, y) => (status === 'ready' ? rasFromClient(plane, x, y) : null),
        clientOf: (plane, ras) => (status === 'ready' ? clientFromRas(plane, ras) : null),
        /* the canvas pixel (device) where the crosshair arms meet, and the image box */
        crosshair: (plane) => (views[plane].cross && views[plane].layout
            ? { ...views[plane].cross, box: { x: views[plane].layout.dx, y: views[plane].layout.dy, w: views[plane].layout.dw, h: views[plane].layout.dh } } : null),
        colorOf: (index) => (palette && palette.css.get(index)) || null,
        crossColor: () => (palette ? palette.cross : null),
    });

    return {
        hook, legend, setPlane, scroll, nudge, setWindow, setPreset, cycleWindow, setOverlay,
        get status() { return status; },
        get window() { return { ...win }; },
        get overlay() { return overlay; },
        get hasLabels() { return !!vol && vol.hasLabels; },
        get windows() { return vol ? Object.keys(vol.windows) : []; },
        get valueMax() { return VALUE_MAX; },
        onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    };
}
