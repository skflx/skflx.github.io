/* =============================================================
   ui-specimen.js — Specimen stage controls: the view buttons, the bone
   envelope's three states, the air-space layers by region, the landmarks
   layer, the section plane, and the orientation widget.

   Everything is generated from mode-specimen.js (its VIEWS, the regions it
   finds in the loaded packs) and follows it back, so the controls always
   show the state the scene is in. Text reaches the DOM through textContent
   only. Where the controls live: on desktop a docked column at the stage's
   left edge — the canvas starts beside it, so the model is never covered —
   that collapses to a rail; on phones a panel over the foot of the stage,
   closed until asked for. `data-spec-dock` on the stage says which.

   buildOrient() is the R/L, A/P, S/I widget: three axes drawn from the
   camera's own rotation, so which way is the patient's right is always on
   screen, in the anatomical hues of the axis gizmo.
   ============================================================= */
import { rasToScene } from './frame.js?v=f554e767';
import { PLANES } from './volume.js?v=b4ad308f';
import { CT_PLANES } from './state.js?v=32a9e616';
import { STANDARD_NOTE, isStandardSpecimen } from './ui-ct.js?v=d9327e37';
import { DESIGNS, DESIGN_LABEL, PARAMS, PARAM_DEFAULTS } from './flap.js?v=09a0f730';

const SVG = 'http://www.w3.org/2000/svg';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

const svg = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
};

const fmt = (v) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1);

/* ---------------- orientation widget ---------------- */

const SIZE = 84;
const REACH = 28;
const AXES = [
    { key: 'r', ras: [1, 0, 0], plus: 'R', minus: 'L' },
    { key: 'a', ras: [0, 1, 0], plus: 'A', minus: 'P' },
    { key: 's', ras: [0, 0, 1], plus: 'S', minus: 'I' },
];

/* root: the empty #ssb-orient. Returns { update(quaternion), show(on) }. */
export function buildOrient(root) {
    root.textContent = '';
    const canvas = svg('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, width: SIZE, height: SIZE, focusable: 'false' });
    const parts = AXES.map((axis) => {
        const g = svg('g', { class: `ssb-orient-axis ssb-orient-${axis.key}` });
        const line = svg('line', { x1: SIZE / 2, y1: SIZE / 2, x2: SIZE / 2, y2: SIZE / 2 });
        const plus = svg('text', { class: 'ssb-orient-plus', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
        const minus = svg('text', { class: 'ssb-orient-minus', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
        plus.textContent = axis.plus;
        minus.textContent = axis.minus;
        g.append(line, plus, minus);
        canvas.append(g);
        return { axis, g, line, plus, minus, dir: rasToScene(axis.ras) };
    });
    root.append(canvas);
    root.hidden = true;

    return {
        show(on) { root.hidden = !on; },
        /* q: the camera's quaternion ({ x, y, z, w }): view space = q^-1 * world */
        update(q) {
            const c = SIZE / 2;
            for (const p of parts) {
                const [vx, vy, vz] = p.dir;
                /* rotate (vx, vy, vz) by the inverse of q */
                const ix = q.w * vx - q.y * vz + q.z * vy;
                const iy = q.w * vy - q.z * vx + q.x * vz;
                const iz = q.w * vz - q.x * vy + q.y * vx;
                const iw = q.x * vx + q.y * vy + q.z * vz;
                const x = ix * q.w + iw * q.x + iy * q.z - iz * q.y;
                const y = iy * q.w + iw * q.y + iz * q.x - ix * q.z;
                const z = iz * q.w + iw * q.z + ix * q.y - iy * q.x;
                /* screen: x right, y down; z > 0 points at the viewer */
                const ex = c + x * REACH;
                const ey = c - y * REACH;
                p.line.setAttribute('x2', ex.toFixed(1));
                p.line.setAttribute('y2', ey.toFixed(1));
                p.line.setAttribute('x1', (c - x * REACH * 0.55).toFixed(1));
                p.line.setAttribute('y1', (c + y * REACH * 0.55).toFixed(1));
                p.plus.setAttribute('x', (c + x * (REACH + 9)).toFixed(1));
                p.plus.setAttribute('y', (c - y * (REACH + 9)).toFixed(1));
                p.minus.setAttribute('x', (c - x * (REACH * 0.55 + 8)).toFixed(1));
                p.minus.setAttribute('y', (c + y * (REACH * 0.55 + 8)).toFixed(1));
                p.g.style.opacity = z >= 0 ? '1' : '0.55';       /* an axis pointing away is fainter */
                p.g.dataset.toward = z >= 0 ? 'plus' : 'minus';
            }
        },
    };
}

/* ---------------- controls ---------------- */

export function mountSpecimenControls({ dock, body, toggle, stageHost, specimen, store }) {
    const wide = matchMedia('(min-width: 960px)');
    let collapsed = !wide.matches;       /* phones: closed until asked for */
    const root = el('section', 'ssb-spec');
    root.id = 'ssb-spec';
    root.setAttribute('aria-label', 'Specimen layers and section');
    body.textContent = '';
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
        for (const b of container.querySelectorAll(`button[data-${attr.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}]`)) {
            const on = b.dataset[attr] === value;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    };

    /* ---- view ---- */
    const viewSec = section('View');
    const viewRow = row('View');
    for (const [key, v] of Object.entries(specimen.VIEWS)) viewRow.append(pill(v.label, { view: key }, v.title));
    viewSec.append(viewRow);

    /* ---- bone envelope ---- */
    const boneSec = section('Bone envelope');
    const boneRow = row('Bone envelope');
    const BONE = { solid: 'Solid', xray: 'X-ray', hidden: 'Hidden' };
    for (const mode of specimen.BONE_MODES) boneRow.append(pill(BONE[mode], { bone: mode }));
    boneSec.append(boneRow);

    /* ---- mucosal state (docs/ssb.md 5.9): the player loads it; a procedure forces decongested ---- */
    const muSec = section('Mucosal state');
    const muRow = row('Mucosal state');
    const MU = [
        ['dec', 'Decongested', 'Mucosa: decongested (calibrated, Xiao 2021)'],
        ['scan', 'As scanned', 'Mucosa: as scanned (the specimen\'s own; not decongested)'],
        ['cong', 'Congested', 'Mucosa: congested (physiological nasal cycle, NasalSeg)'],
    ];
    for (const [key, label] of MU) muRow.append(pill(label, { mu: key }));
    const muText = el('p', 'ssb-param-src');
    muText.setAttribute('role', 'status');
    muSec.append(muRow, muText);

    /* ---- air spaces by region ---- */
    const airSec = section('Air spaces and soft tissue');
    const airList = el('div', 'ssb-spec-checks');
    airSec.append(airList);

    /* ---- the nasoseptal flap overlay (flap.js; docs/ssb.md 5.7): a soft-tissue control, shown from the flap's own tier ---- */
    const flapSec = section('Nasoseptal flap');
    const flapDesigns = row('Flap design');
    flapDesigns.append(pill('Off', { flapDesign: 'off' }));
    for (const d of DESIGNS) flapDesigns.append(pill(DESIGN_LABEL[d], { flapDesign: d }));
    const flapSides = row('Flap side');
    for (const [sd, label] of [['R', 'Right'], ['L', 'Left']]) flapSides.append(pill(label, { flapSide: sd }));
    const flapSliders = new Map();
    for (const prm of PARAMS) {
        const box = el('div', 'ssb-param');
        const hd = el('div', 'ssb-param-head');
        const lb = el('label', 'ssb-param-label', prm.label);
        lb.htmlFor = `ssb-flap-${prm.hash}`;
        const val = el('output', 'ssb-param-value');
        val.htmlFor = lb.htmlFor;
        hd.append(lb, val);
        const rg = el('input', 'ssb-range');
        rg.type = 'range';
        rg.id = lb.htmlFor;
        rg.min = String(prm.min);
        rg.max = String(prm.max);
        rg.step = String(prm.step);
        rg.dataset.flapParam = prm.key;
        box.append(hd, rg);
        flapSliders.set(prm.key, { box, rg, val, prm });
    }
    const flapBadge = el('p', 'ssb-param-src ssb-flap-badge', 'schematic on specimen');
    const flapReadout = el('dl', 'ssb-flap-readout');
    flapReadout.setAttribute('aria-live', 'polite');
    const flapNotes = el('ul', 'ssb-flap-notes');
    const flapLit = el('p', 'ssb-param-src');
    flapSec.append(flapDesigns, flapSides, ...[...flapSliders.values()].map((x) => x.box), flapBadge, flapReadout, flapNotes, flapLit);

    /* ---- landmarks ---- */
    const lmSec = section('Landmarks');
    const lmLabel = el('label', 'ssb-ct-check');
    const lmBox = el('input');
    lmBox.type = 'checkbox';
    lmBox.id = 'ssb-spec-landmarks';
    lmLabel.append(lmBox, el('span', null, 'Show markers and labels'));
    const swLabel = el('label', 'ssb-ct-check');
    const swBox = el('input');
    swBox.type = 'checkbox';
    swBox.id = 'ssb-spec-sweeps';
    swLabel.append(swBox, el('span', null, 'Show vessels and nerves (partly inferred)'));
    const mucLabel = el('label', 'ssb-ct-check');
    const mucBox = el('input');
    mucBox.type = 'checkbox';
    mucBox.id = 'ssb-spec-mucosa';
    mucLabel.append(mucBox, el('span', null, 'Mucosa (air spaces drawn as their lining)'));
    const noseLabel = el('label', 'ssb-ct-check');
    const noseBox = el('input');
    noseBox.type = 'checkbox';
    noseBox.id = 'ssb-spec-nose';
    noseLabel.append(noseBox, el('span', null, 'Nose (the specimen\'s own skin; the face stays masked)'));
    airSec.append(mucLabel, noseLabel);
    lmSec.append(lmLabel, swLabel);

    /* ---- section ---- */
    const secSec = section('Section');
    const secRow = row('Section plane');
    secRow.append(pill('Off', { section: 'off' }));
    for (const plane of CT_PLANES) secRow.append(pill(PLANES[plane].title, { section: plane }));
    const slider = el('div', 'ssb-param ssb-spec-slider');
    const head = el('div', 'ssb-param-head');
    const lbl = el('label', 'ssb-param-label', 'Position');
    lbl.htmlFor = 'ssb-spec-section';
    const out = el('output', 'ssb-param-value');
    out.htmlFor = 'ssb-spec-section';
    head.append(lbl, out);
    const range = el('input', 'ssb-range');
    range.type = 'range';
    range.id = 'ssb-spec-section';
    range.step = '0.5';
    slider.append(head, range);
    const flipLabel = el('label', 'ssb-ct-check');
    const flipBox = el('input');
    flipBox.type = 'checkbox';
    flipBox.id = 'ssb-spec-flip';
    flipLabel.append(flipBox, el('span', null, 'Keep the other side'));
    const secNote = el('p', 'ssb-param-src', 'The cut position is the 3D cursor, the same point as the CT crosshair. Click a surface to move it.');
    secSec.append(secRow, slider, flipLabel, secNote);

    /* ---- what could not load ---- */
    const statusSec = section('Specimen');
    const statusText = el('p', 'ssb-param-src');
    statusSec.append(statusText);
    const standardNote = el('p', 'ssb-param-src', STANDARD_NOTE);
    standardNote.hidden = true;
    isStandardSpecimen().then((yes) => { standardNote.hidden = !yes; sync(); });
    statusSec.append(standardNote);

    /* ---- follow the mode ---- */
    const dt = (label, value) => { const a = el('dt', null, label); const b = el('dd', null, value); return [a, b]; };
    const cm2 = (v) => `${v.toFixed(2)} cm²`;
    function syncFlap() {
        const st = store.get();
        const f = st.flap;
        flapSec.hidden = !specimen.hasFlap || !(f || st.tier >= specimen.flapTier);
        mark(flapDesigns, 'flapDesign', f ? f.design : 'off');
        mark(flapSides, 'flapSide', f ? f.side : '');
        for (const b of flapSides.querySelectorAll('button')) b.disabled = !f;
        for (const { box, rg, val, prm } of flapSliders.values()) {
            box.hidden = !f || !prm.designs.includes(f.design);
            const v = f ? f.params[prm.key] : PARAM_DEFAULTS[prm.key];
            if (Number(rg.value) !== v) rg.value = String(v);
            val.textContent = `${v} mm`;
            rg.setAttribute('aria-valuetext', `${prm.label} ${v} mm`);
        }
        const now = specimen.flapReadout;
        const on = !!f;
        flapBadge.hidden = !on;
        flapReadout.hidden = !on;
        flapNotes.hidden = !on;
        flapLit.hidden = !on;
        flapReadout.textContent = '';
        flapNotes.textContent = '';
        flapLit.textContent = '';
        if (!on || !now) return;
        if (now.status !== 'ready') { flapNotes.append(el('li', null, now.text)); return; }
        const r = now.result;
        const rows = [dt('Area', now.design === 'rescue' ? '0 cm² (no flap is raised)' : cm2(now.areas.total))];
        if (now.areas.floor > 0) rows.push(dt('Septum', cm2(now.areas.septal)), dt('Nasal floor', cm2(now.areas.floor)));
        rows.push(dt('Pedicle height', `${r.pedicleHeight.toFixed(1)} mm`), dt('Length', `${r.length.toFixed(1)} mm`));
        for (const [a, b] of rows) flapReadout.append(a, b);
        if (r.approx > 0) flapNotes.append(el('li', null, `approximate: ${Math.round(r.approx * 100)}% of the outline lies on charted cells that are filled or unreliable`));
        for (const n of r.notes) flapNotes.append(el('li', null, n));
        flapLit.textContent = now.literature.length ? 'Literature: ' + now.literature.map((l) => `${l.name} ${l.value} ${l.unit}`.trim()).join('; ') : '';
    }

    let builtRegions = '';
    function sync() {
        mark(viewRow, 'view', specimen.view || '');
        mark(boneRow, 'bone', specimen.bone);
        const st = store.get();
        const forced = !!st.procedure;
        const mu = forced ? 'dec' : st.mu;
        mark(muRow, 'mu', mu);
        for (const b of muRow.querySelectorAll('button[data-mu]')) {
            b.disabled = forced;
            b.title = forced ? 'A procedure always plays on the decongested mucosa.' : '';
        }
        const line = MU.find((m) => m[0] === mu)[2] + (forced ? ' (procedure)' : '');
        muText.textContent = specimen.muNote && !forced ? `${line}. ${specimen.muNote}` : line;

        const regions = specimen.regions();
        const key = regions.map((r) => `${r.region}:${r.count}`).join('|');
        if (key !== builtRegions) {
            builtRegions = key;
            airList.textContent = '';
            airSec.hidden = regions.length === 0;
            for (const r of regions) {
                const label = el('label', 'ssb-ct-check');
                const box = el('input');
                box.type = 'checkbox';
                box.dataset.region = r.region;
                label.append(box, el('span', null, r.label));
                airList.append(label);
            }
        }
        for (const box of airList.querySelectorAll('input[data-region]')) {
            const r = regions.find((x) => x.region === box.dataset.region);
            if (r) box.checked = r.on;
        }
        mucBox.checked = specimen.mucosaOn;
        noseBox.checked = specimen.noseOn;
        noseBox.disabled = !specimen.hasNose;
        noseLabel.classList.toggle('is-off', !specimen.hasNose);
        airSec.hidden = regions.length === 0 && !specimen.hasNose;
        lmBox.checked = specimen.landmarksOn;
        lmBox.disabled = !specimen.hasLandmarks;
        lmLabel.classList.toggle('is-off', !specimen.hasLandmarks);
        swBox.checked = specimen.sweepsOn;
        swBox.disabled = !specimen.hasSweeps;
        swLabel.classList.toggle('is-off', !specimen.hasSweeps);

        syncFlap();
        const sec = specimen.section;
        mark(secRow, 'section', sec.axis || 'off');
        slider.hidden = !sec.axis;
        flipLabel.hidden = !sec.axis;
        secNote.hidden = !sec.axis;
        if (sec.axis) {
            const [lo, hi] = specimen.sectionRange(sec.axis);
            if (range.min !== String(Math.floor(lo))) range.min = String(Math.floor(lo));
            if (range.max !== String(Math.ceil(hi))) range.max = String(Math.ceil(hi));
            if (Number(range.value) !== sec.at) range.value = String(sec.at);
            const side = PLANES[sec.axis].sign;
            out.textContent = `${sec.at >= 0 ? side[0] : side[1]} ${fmt(Math.abs(sec.at))} mm`;
            range.setAttribute('aria-valuetext', out.textContent);
            flipBox.checked = sec.flip;
        }
        const note = specimen.problem;
        statusText.textContent = specimen.status === 'partial' ? note : '';
        statusText.hidden = !statusText.textContent;
        statusSec.hidden = statusText.hidden && standardNote.hidden;
        place();
    }

    /* ---- events ---- */
    root.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.view) specimen.setView(b.dataset.view);
        else if (b.dataset.bone) specimen.setBone(b.dataset.bone);
        else if (b.dataset.mu) store.setMu(b.dataset.mu);
        else if (b.dataset.section) specimen.setSection(b.dataset.section === 'off' ? null : b.dataset.section);
        else if (b.dataset.flapDesign) {
            const cur = store.get().flap;
            store.setFlap(b.dataset.flapDesign === 'off' ? null : { design: b.dataset.flapDesign, side: cur ? cur.side : 'R', params: cur ? cur.params : PARAM_DEFAULTS });
        } else if (b.dataset.flapSide) {
            const cur = store.get().flap;
            if (cur) store.setFlap({ ...cur, side: b.dataset.flapSide });
        }
    });
    root.addEventListener('input', (e) => {
        const key = e.target && e.target.dataset ? e.target.dataset.flapParam : null;
        const cur = store.get().flap;
        if (key && cur) store.setFlap({ ...cur, params: { ...cur.params, [key]: Number(e.target.value) } }, { source: 'slider' });
    });
    root.addEventListener('change', (e) => {
        const t = e.target;
        if (t === lmBox) specimen.setLandmarks(lmBox.checked);
        else if (t === mucBox) specimen.setMucosa(mucBox.checked);
        else if (t === noseBox) specimen.setNose(noseBox.checked);
        else if (t === swBox) specimen.setSweeps(swBox.checked);
        else if (t === flipBox) specimen.flipSection();
        else if (t.matches('input[data-region]')) specimen.setRegion(t.dataset.region, t.checked);
    });
    range.addEventListener('input', () => specimen.setSectionAt(Number(range.value)));

    /* ---- where the controls live ---- */
    function place() {
        /* no controls for a stage that is not there: another stage showing, or no specimen to control */
        const on = !store.get().lab && !store.get().ct && !['error', 'absent'].includes(specimen.status);
        dock.hidden = !on;
        if (on) stageHost.dataset.specDock = collapsed ? 'collapsed' : 'open';
        else delete stageHost.dataset.specDock;
        dock.dataset.collapsed = collapsed ? 'true' : 'false';
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        toggle.textContent = collapsed ? 'Layers' : 'Hide layers';
    }
    toggle.addEventListener('click', () => { collapsed = !collapsed; place(); });
    if (typeof wide.addEventListener === 'function') wide.addEventListener('change', () => { collapsed = !wide.matches; place(); });

    specimen.onChange(sync);
    store.subscribe((state, prev) => {
        if (state.lab !== prev.lab || state.ct !== prev.ct) place();
        if (state.mu !== prev.mu || state.procedure !== prev.procedure || state.flap !== prev.flap || state.tier !== prev.tier) sync();
    });
    sync();
    place();
}
