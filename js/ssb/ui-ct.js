/* =============================================================
   ui-ct.js — CT stage controls and skeleton: the three view frames, the
   plane switcher (phones show one plane at a time), window presets and
   level/width sliders, the label-outline toggle, the crosshair readout,
   a colour key, and the stage switch's CT button.

   buildCtDom() makes the skeleton mode-ct.js draws into (a canvas, four
   orientation letters, a caption and a hover tip per view); mountCtControls()
   fills the info cell and follows mode-ct's state. Text reaches the DOM
   through textContent only.

   The CT button works without WebGL: CT is CPU-drawn and is the documented
   fallback (docs/ssb.md 7.5).
   ============================================================= */
import { PLANES, stamped } from './volume.js?v=61915bb8';
import { CT_PLANES } from './state.js?v=2a74ae90';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

/* The standard-specimen note (docs/ssb.md 5.1, O6): shown wherever the volume is shown, when ct.json has
   a `standard` block. Resolves false when the header is absent or unreadable. */
export const STANDARD_NOTE = 'Standardized specimen: one head\u2019s right half, mirrored, with the septum centred \u2014 symmetric by construction, not a real head.';
let standardAnswer = null;
export function isStandardSpecimen() {
    if (!standardAnswer) {
        standardAnswer = Promise.resolve()
            .then(() => fetch(stamped('ssb/ct/ct.json')))
            .then((res) => (res.ok ? res.json() : null))
            .then((meta) => !!(meta && typeof meta === 'object' && meta.standard))
            .catch(() => false);
    }
    return standardAnswer;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* Build the skeleton inside `root` (#ssb-ct, empty). */
export function buildCtDom(root) {
    root.textContent = '';
    root.classList.add('ssb-ct');
    const grid = el('div', 'ssb-ct-grid');
    const views = {};
    for (const plane of CT_PLANES) {
        const info = PLANES[plane];
        const view = el('figure', 'ssb-ct-view');
        view.dataset.plane = plane;
        view.dataset.active = 'false';
        const canvas = el('canvas', 'ssb-ct-canvas');
        canvas.tabIndex = 0;
        canvas.setAttribute('aria-label', `${info.title} CT slice`);
        view.append(canvas);
        for (const edge of ['left', 'right', 'top', 'bottom']) {
            const letter = el('span', 'ssb-ct-o', info.letters[edge]);
            letter.dataset.edge = edge;
            letter.dataset.letter = info.letters[edge];
            letter.setAttribute('aria-hidden', 'true');
            view.append(letter);
        }
        const caption = el('figcaption', 'ssb-ct-cap');
        const position = el('span', 'ssb-ct-pos');
        caption.append(el('span', 'ssb-ct-name', info.title), position);
        const tip = el('span', 'ssb-ct-tip');
        tip.hidden = true;
        tip.setAttribute('aria-hidden', 'true');
        view.append(caption, tip);
        grid.append(view);
        views[plane] = { view, canvas, caption: position, tip };
    }

    const info = el('section', 'ssb-ct-info');
    info.setAttribute('aria-label', 'CT controls');
    const readout = { pos: el('span', 'ssb-ct-readout-pos'), what: el('span', 'ssb-ct-readout-what') };
    grid.append(info);

    const msg = el('p', 'ssb-ct-msg');
    msg.setAttribute('role', 'status');
    msg.hidden = true;
    const live = el('p', 'visually-hidden');
    live.setAttribute('aria-live', 'polite');
    /* The truth badge (docs/ssb.md principle 2): a strip under the views, always visible. */
    const truth = el('span', 'ssb-truth ssb-ct-truth');
    truth.hidden = true;
    root.append(grid, truth, msg, live);
    return { root, grid, views, info, readout, msg, truth, live };
}

export function mountCtControls({ dom, ct, store, graph, stageSwitch }) {
    const { info } = dom;
    let builtFor = false;

    const section = (key, title) => {
        const sec = el('div', `ssb-ct-sec ssb-ct-sec-${key}`);
        sec.append(el('h2', 'site-kicker ssb-ct-kicker', title));
        info.append(sec);
        return sec;
    };

    /* ---- plane switcher (shown on phones, where one plane fills the stage) ---- */
    const planes = section('planes', 'Plane');
    const planeRow = el('div', 'ssb-ct-row');
    planeRow.setAttribute('role', 'group');
    planeRow.setAttribute('aria-label', 'Plane');
    for (const plane of CT_PLANES) {
        const b = el('button', 'site-pill', PLANES[plane].title);
        b.type = 'button';
        b.dataset.plane = plane;
        planeRow.append(b);
    }
    planes.append(planeRow);

    /* ---- crosshair readout ---- */
    const cross = section('cursor', 'Crosshair');
    const readout = el('p', 'ssb-ct-readout');
    readout.append(dom.readout.pos, el('br'), dom.readout.what);
    cross.append(readout);

    /* ---- window ---- */
    const win = section('window', 'Window');
    const presetRow = el('div', 'ssb-ct-row');
    presetRow.setAttribute('role', 'group');
    presetRow.setAttribute('aria-label', 'Window preset');
    const sliders = el('details', 'ssb-ct-sliders');
    sliders.append(el('summary', null, 'Level and width'));
    sliders.open = typeof matchMedia === 'function' && matchMedia('(min-width: 960px)').matches;   /* phones: folded away */
    const slider = (key, label) => {
        const id = `ssb-ct-${key}`;
        const row = el('div', 'ssb-ct-slider');
        const lbl = el('label', 'ssb-ct-slider-label', label);
        lbl.htmlFor = id;
        const out = el('output', 'ssb-ct-slider-value');
        out.htmlFor = id;
        const input = el('input', 'ssb-range');
        input.type = 'range';
        input.id = id;
        input.dataset.key = key;
        input.min = key === 'width' ? '1' : '0';
        input.max = String(ct.valueMax);
        input.step = '1';
        row.append(lbl, input, out);
        return { row, input, out };
    };
    const level = slider('center', 'Level');
    const width = slider('width', 'Width');
    sliders.append(level.row, width.row);
    win.append(presetRow, sliders);

    /* ---- label outlines ---- */
    const labels = section('labels', 'Labels');
    const toggle = el('label', 'ssb-ct-check');
    const box = el('input');
    box.type = 'checkbox';
    box.id = 'ssb-ct-overlay';
    toggle.append(box, el('span', null, 'Outline labelled structures'));
    const legend = el('details', 'ssb-ct-legend');
    const legendSummary = el('summary', null, 'Colour key');
    const legendList = el('ul', 'ssb-ct-legend-list');
    legend.append(legendSummary, legendList);
    labels.append(toggle, legend);

    /* ---- standard specimen ---- */
    const standard = section('standard', 'Specimen');
    standard.append(el('p', 'ssb-param-src', STANDARD_NOTE));
    standard.hidden = true;
    isStandardSpecimen().then((yes) => { standard.hidden = !yes; });

    /* ---- keys ---- */
    const keys = section('keys', 'Keys');
    keys.append(el('p', 'ssb-ct-keys',
        'Arrows or wheel scroll the slice (PgUp/PgDn: ten). Shift+arrows move the crosshair. '
        + '1 2 3 pick the plane, W cycles the window, O toggles outlines. Right-drag sets window and level.'));

    /* ---- build what needs the volume ---- */
    function buildVolumePart() {
        if (builtFor || ct.status !== 'ready') return;
        builtFor = true;
        presetRow.textContent = '';
        for (const name of ct.windows) {
            const b = el('button', 'site-pill', cap(name));
            b.type = 'button';
            b.dataset.preset = name;
            presetRow.append(b);
        }
        legendList.textContent = '';
        const entries = ct.legend();
        legend.hidden = entries.length === 0;
        legendSummary.textContent = `Colour key (${entries.length})`;
        for (const entry of entries) {
            const li = el('li');
            const swatch = el('span', 'ssb-ct-swatch');
            swatch.style.background = entry.color;
            swatch.setAttribute('aria-hidden', 'true');
            if (entry.graphId) {
                const b = el('button', 'ssb-ct-legend-item', entry.name);
                b.type = 'button';
                b.dataset.ref = entry.graphId;
                li.append(swatch, b);
            } else li.append(swatch, el('span', 'ssb-ct-legend-item', entry.name));
            legendList.append(li);
        }
    }

    /* ---- follow mode-ct and the store ---- */
    function sync() {
        const ready = ct.status === 'ready';
        info.hidden = !ready;
        dom.grid.dataset.ready = ready ? 'true' : 'false';
        if (!ready) return;
        buildVolumePart();
        const plane = store.get().ct ? store.get().ct.plane : 'axial';
        for (const b of planeRow.querySelectorAll('button[data-plane]')) {
            const on = b.dataset.plane === plane;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
        const w = ct.window;
        for (const b of presetRow.querySelectorAll('button[data-preset]')) {
            const on = b.dataset.preset === w.name;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
        if (Number(level.input.value) !== w.center) level.input.value = String(w.center);
        if (Number(width.input.value) !== w.width) width.input.value = String(w.width);
        level.out.textContent = String(w.center);
        width.out.textContent = String(w.width);
        box.checked = ct.overlay;
        box.disabled = !ct.hasLabels;
        toggle.classList.toggle('is-off', !ct.hasLabels);
    }

    planeRow.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-plane]');
        if (b) ct.setPlane(b.dataset.plane);
    });
    presetRow.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-preset]');
        if (b) ct.setPreset(b.dataset.preset);
    });
    sliders.addEventListener('input', (e) => {
        const t = e.target;
        if (t.matches('input[data-key]')) ct.setWindow({ [t.dataset.key]: Number(t.value), name: null });
    });
    box.addEventListener('change', () => ct.setOverlay(box.checked));
    legendList.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-ref]');
        if (b && graph.has(b.dataset.ref)) store.select(b.dataset.ref, { source: 'panel' });
    });

    const button = stageSwitch.querySelector('button[data-stage="ct"]');
    if (button) {
        button.disabled = false;
        button.addEventListener('click', () => { if (!store.get().ct) store.setCt({ plane: 'axial', at: null }); });
    }

    ct.onChange(sync);
    store.subscribe((state, prev) => { if (state.ct !== prev.ct) sync(); });
    sync();
}
