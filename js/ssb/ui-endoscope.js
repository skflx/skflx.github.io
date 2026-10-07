/* =============================================================
   ui-endoscope.js — the Endoscope stage's DOM: the field-of-view overlay
   (circular vignette, light-post indicator, pose readout) and the controls
   (side, lens, depth / yaw / pitch / roll sliders, the station list), which live in the
   Specimen dock's body and show only while the scope does.

   Everything is written with textContent / attributes / properties; the URL
   never reaches markup. State flows one way: the store's pose -> sync();
   the controls only ever call endo.setPose / endo.enter.
   ============================================================= */
import { LENSES, RANGES, SIDES, lightPostAngle, frameOf, samePose } from './scope.js?v=844c8624';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

const fmt = (v) => String(Number(Number(v).toFixed(1)));

/* The overlay on the stage: a vignette whose clear circle is the 70 degree field of view,
   the light-post indicator on its rim, and a one-line readout. Created hidden. */
export function buildScopeOverlay(stageHost) {
    const root = el('div', 'ssb-scope');
    root.id = 'ssb-scope';
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    const mask = el('div', 'ssb-scope-mask');
    const post = el('span', 'ssb-scope-post');
    post.title = 'Light post';
    const readout = el('p', 'ssb-scope-readout');
    root.append(mask, post, readout);
    stageHost.append(root);
    return { root, post, readout };
}

export function mountEndoscopeControls({ body, stageHost, endo, store, stageSwitch }) {
    const overlay = buildScopeOverlay(stageHost);
    const root = el('section', 'ssb-scope-controls');
    root.id = 'ssb-scope-controls';
    root.setAttribute('aria-label', 'Endoscope controls');
    root.hidden = true;
    body.append(root);

    const section = (title) => {
        const sec = el('div', 'ssb-lab-sec');
        sec.append(el('h2', 'site-kicker ssb-lab-kicker', title));
        root.append(sec);
        return sec;
    };
    const row = (label) => {
        const r = el('div', 'ssb-view-row');
        r.setAttribute('role', 'group');
        r.setAttribute('aria-label', label);
        return r;
    };
    const pill = (text, data, title) => {
        const b = el('button', 'site-pill', text);
        b.type = 'button';
        for (const [k, v] of Object.entries(data)) b.dataset[k] = v;
        if (title) { b.title = title; b.setAttribute('aria-label', title); }
        return b;
    };
    const mark = (container, attr, value) => {
        for (const b of container.querySelectorAll(`button[data-${attr}]`)) {
            const on = b.dataset[attr] === String(value);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    };

    /* ---- the scope: side and lens ---- */
    const poseSec = section('Endoscope');
    const sideRow = row('Nostril');
    for (const s of SIDES) sideRow.append(pill(s === 'R' ? 'Right' : 'Left', { side: s }, s === 'R' ? 'Right nostril' : 'Left nostril'));
    const lensRow = row('Lens angle');
    for (const l of LENSES) lensRow.append(pill(`${l}°`, { lens: String(l) }, `${l} degree lens`));
    const shaftRow = row('Scope diameter');
    shaftRow.append(pill('4 mm', { shaft: '4' }, '4 mm telescope'), pill('2.7 mm', { shaft: '2.7' }, '2.7 mm telescope'));
    poseSec.append(sideRow, lensRow, shaftRow);

    /* ---- sliders ---- */
    const SLIDERS = [
        { key: 'depth', label: 'Insertion depth', unit: 'mm' },
        { key: 'yaw', label: 'Yaw (about the nostril)', unit: '°' },
        { key: 'pitch', label: 'Pitch', unit: '°' },
        { key: 'roll', label: 'Roll (the lens about the shaft)', unit: '°' },
    ];
    const sliders = new Map();
    for (const s of SLIDERS) {
        const wrap = el('div', 'ssb-param ssb-scope-slider');
        const head = el('div', 'ssb-param-head');
        const lbl = el('label', 'ssb-param-label', s.label);
        const id = `ssb-scope-${s.key}`;
        lbl.htmlFor = id;
        const out = el('output', 'ssb-param-value');
        out.htmlFor = id;
        head.append(lbl, out);
        const range = el('input', 'ssb-range');
        range.type = 'range';
        range.id = id;
        range.min = String(RANGES[s.key].min);
        range.max = String(RANGES[s.key].max);
        range.step = String(RANGES[s.key].step);
        range.addEventListener('input', () => endo.setPose({ [s.key]: Number(range.value) }));
        wrap.append(head, range);
        poseSec.append(wrap);
        sliders.set(s.key, { range, out, unit: s.unit });
    }

    const tipOut = el('p', 'ssb-param-src ssb-scope-tip');
    const fulcrumNote = el('p', 'ssb-param-src', 'The pivot is the vestibule centroid (lm.naris) measured on the unmasked CT, inside the specimen\'s own nose (the rest of the face stays masked). Bone stops the shaft; mucosa does not.');
    const keys = el('p', 'ssb-param-src', 'Canvas focused: drag or arrow keys look around, wheel or + / − insert and withdraw, Q / E roll, L changes the lens, Shift for larger steps.');
    const status = el('p', 'ssb-param-src ssb-scope-status');
    const hudSec = section('Proximity');
    const hudList = el('div', 'ssb-scope-hud');
    hudList.setAttribute('role', 'status');
    hudList.setAttribute('aria-live', 'off');
    hudSec.append(hudList);
    poseSec.append(tipOut, fulcrumNote, keys, status);

    /* ---- stations (E6): the covered ones for this nostril (and the midline ones), at or above the page's tier ---- */
    const stationSec = section('Stations');
    stationSec.hidden = true;
    const stationList = el('div', 'ssb-scope-stations');
    stationList.setAttribute('role', 'group');
    stationList.setAttribute('aria-label', 'Endoscope stations');
    stationSec.append(stationList, el('p', 'ssb-param-src', 'Each station is a stored pose on the reference specimen; picking one flies the scope there (a cut with reduced motion). The pose stays free: change the nostril, lens or angles from there.'));
    let stationKey = '';
    function renderStations() {
        const p = endo.pose;
        const tier = store.get().tier;
        const shown = p ? endo.stations.filter((s) => (s.side === 'M' || s.side === p.side) && s.tier <= tier) : [];
        stationSec.hidden = !shown.length;
        const key = shown.map((s) => s.key).join('|');
        if (key !== stationKey) {
            stationKey = key;
            stationList.replaceChildren();
            for (const s of shown) {
                const b = el('button', 'site-pill ssb-scope-station');
                b.type = 'button';
                b.dataset.station = s.key;
                b.append(el('span', 'ssb-scope-station-name', s.name.replace(/,\s*\d+°$/, '')), el('span', 'ssb-scope-station-lens', `${s.pose.lens}°`));
                b.title = `${s.name}: fly the scope here`;
                stationList.append(b);
            }
        }
        const here = new Map(endo.stations.map((s) => [s.key, s.pose]));
        for (const b of stationList.querySelectorAll('button[data-station]')) {
            const on = !!p && !endo.flying && samePose(here.get(b.dataset.station), p);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    }

    /* ---- CT along the scope (E4): the oblique slice through the tip, spanned by the view and the camera's up ---- */
    const ctSec = section('CT along the scope');
    ctSec.hidden = true;
    const inset = el('canvas', 'ssb-scope-inset');
    inset.id = 'ssb-scope-inset';
    inset.setAttribute('role', 'img');
    inset.setAttribute('aria-label', 'Oblique CT slice through the scope tip: the viewing direction runs left to right, the camera up runs upward, and the shaft is drawn in the signal colour.');
    ctSec.append(inset, el('p', 'ssb-param-src', 'The tip is at the centre; the scope looks to the right. Slice through the tip along the view and the camera\'s up; the 3D cursor and the CT stage follow the tip.'));
    const g2d = (() => { try { return inset.getContext('2d'); } catch (e) { return null; } })();
    function paintInset() {
        const d = endo.inset;
        ctSec.hidden = !d || !g2d;
        if (!d || !g2d) return;
        if (inset.width !== d.width) { inset.width = d.width; inset.height = d.height; }
        const img = g2d.createImageData(d.width, d.height);
        for (let i = 0; i < d.ct.length; i++) {
            const v = d.ct[i];
            const g = v === v ? Math.max(0, Math.min(255, Math.round(v))) : 24;      /* NaN: outside the volume */
            img.data[4 * i] = img.data[4 * i + 1] = img.data[4 * i + 2] = g;
            img.data[4 * i + 3] = 255;
        }
        g2d.putImageData(img, 0, 0);
        const css = getComputedStyle(root);
        g2d.strokeStyle = css.getPropertyValue('--signal').trim() || '#d33';
        g2d.lineWidth = 2;
        /* the shaft stops 4 px short of the tip and a ring marks it, so the centre pixel stays the CT's */
        const [x0, y0, x1, y1] = d.shaft;
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        g2d.beginPath();
        g2d.moveTo(x0, y0);
        g2d.lineTo(x1 - (x1 - x0) / len * 4, y1 - (y1 - y0) / len * 4);
        g2d.stroke();
        g2d.beginPath();
        g2d.arc(x1, y1, 4, 0, 2 * Math.PI);
        g2d.stroke();
    }
    endo.onInset(paintInset);

    /* ---- the proximity HUD: nearest structure first, within 3 mm in the signal colour ---- */
    const NEAR_MM = 3;
    function renderHud() {
        const h = endo.hud;
        hudSec.hidden = !h.rows.length;
        hudList.replaceChildren();
        if (!h.rows.length) return;
        for (const r of h.rows) {
            const line = el('p', 'ssb-param-src ssb-scope-hud-row');
            const far = r.mm >= h.clampMm - 0.05;
            line.textContent = `${r.name}: ${far ? '>' : ''}${fmt(far ? h.clampMm : r.mm)} mm`;
            line.dataset.id = r.id;
            if (r.mm <= NEAR_MM) { line.dataset.near = 'true'; line.classList.add('ssb-scope-hud-near'); }
            hudList.append(line);
        }
        const contact = el('p', 'ssb-param-src ssb-scope-hud-contact', `Mucosal contact: ${fmt(h.contactMm)} mm of shaft`);
        hudList.append(contact);
        if (h.limited) hudList.append(el('p', 'ssb-param-src ssb-scope-hud-limit', h.limitedBy === 'septum' ? 'The septum or bone limits the depth.' : 'Bone limits the depth.'));
    }

    /* ---- follow the pose ---- */
    function sync() {
        const p = endo.pose;
        root.hidden = !p;
        overlay.root.hidden = !p || !endo.engaged;
        if (!p) return;
        mark(sideRow, 'side', p.side);
        mark(lensRow, 'lens', p.lens);
        mark(shaftRow, 'shaft', endo.shaft);
        renderHud();
        renderStations();
        for (const [key, s] of sliders) {
            if (Number(s.range.value) !== p[key]) s.range.value = String(p[key]);
            s.out.textContent = `${fmt(p[key])} ${s.unit}`;
            s.range.setAttribute('aria-valuetext', s.out.textContent);
        }
        const tip = endo.tip;
        tipOut.textContent = tip ? `Tip: R ${fmt(tip[0])}, A ${fmt(tip[1])}, S ${fmt(tip[2])} mm` : '';
        status.textContent = endo.engaged ? '' : 'Waiting for the reference specimen…';
        const fr = frameOf(p);
        overlay.post.style.setProperty('--post-x', fr.post[0].toFixed(4));
        overlay.post.style.setProperty('--post-y', fr.post[1].toFixed(4));
        overlay.post.dataset.angle = String(Math.round(lightPostAngle(p)));
        overlay.readout.textContent = `${p.side === 'R' ? 'Right' : 'Left'} nostril · ${p.lens}° · depth ${fmt(p.depth)} mm`;
    }

    root.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || !endo.pose) return;
        if (b.dataset.station) endo.flyTo(b.dataset.station);
        else if (b.dataset.shaft) endo.setShaft(b.dataset.shaft);
        else if (b.dataset.side) endo.setPose({ side: b.dataset.side });
        else if (b.dataset.lens) endo.setPose({ lens: Number(b.dataset.lens) });
    });

    /* ---- the stage pill ---- */
    const button = stageSwitch.querySelector('button[data-stage="scope"]');
    function pillState() {
        if (!button) return;
        button.disabled = !endo.available && !endo.pose;
        button.title = button.disabled ? 'The endoscope needs the reference specimen, which has not loaded.' : 'Endoscope: first-person view through a rigid scope';
    }
    if (button) button.addEventListener('click', () => { if (!store.get().scope) endo.enter(); });

    endo.onChange(() => { sync(); pillState(); });
    store.subscribe((state, prev) => { if (state.scope !== prev.scope) { sync(); pillState(); } else if (state.tier !== prev.tier) renderStations(); });
    sync();
    pillState();
}
