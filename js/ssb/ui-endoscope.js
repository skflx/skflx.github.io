/* =============================================================
   ui-endoscope.js — the Endoscope stage's DOM: the field-of-view overlay
   (circular vignette, light-post indicator, pose readout) and the controls
   (side, lens, depth / yaw / pitch / roll sliders), which live in the
   Specimen dock's body and show only while the scope does.

   Everything is written with textContent / attributes / properties; the URL
   never reaches markup. State flows one way: the store's pose -> sync();
   the controls only ever call endo.setPose / endo.enter.
   ============================================================= */
import { LENSES, RANGES, SIDES, lightPostAngle, frameOf } from './scope.js?v=4ee7f38a';

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
    const fulcrumNote = el('p', 'ssb-param-src', 'The pivot is the vestibule centroid (lm.naris) measured on the unmasked CT; the face stays masked until the nose is modelled. Bone stops the shaft; mucosa does not.');
    const keys = el('p', 'ssb-param-src', 'Canvas focused: drag or arrow keys look around, wheel or + / − insert and withdraw, Q / E roll, L changes the lens, Shift for larger steps.');
    const status = el('p', 'ssb-param-src ssb-scope-status');
    const hudSec = section('Proximity');
    const hudList = el('div', 'ssb-scope-hud');
    hudList.setAttribute('role', 'status');
    hudList.setAttribute('aria-live', 'off');
    hudSec.append(hudList);
    poseSec.append(tipOut, fulcrumNote, keys, status);

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
            if (r.mm <= NEAR_MM) { line.dataset.near = 'true'; line.style.setProperty('color', 'var(--signal)'); }
            hudList.append(line);
        }
        const contact = el('p', 'ssb-param-src ssb-scope-hud-contact', `Mucosal contact: ${fmt(h.contactMm)} mm of shaft`);
        hudList.append(contact);
        if (h.limited) hudList.append(el('p', 'ssb-param-src ssb-scope-hud-limit', 'Bone limits the depth.'));
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
        if (b.dataset.shaft) endo.setShaft(b.dataset.shaft);
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
    store.subscribe((state, prev) => { if (state.scope !== prev.scope) { sync(); pillState(); } });
    sync();
    pillState();
}
