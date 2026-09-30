/* =============================================================
   ui-lab.js — variant lab controls: stage switch, diorama picker, preset
   buttons, parameter sliders.

   Everything is generated from the diorama modules' PARAMS and PRESETS;
   preset buttons are labelled with the classification's own class labels
   from the graph. Controls write the store (state.js clamps again), and
   follow it back, so a pasted #lab= link, Back/Forward and a preset all
   land in the same place. Text reaches the DOM through textContent only.

   Where the controls live: on desktop a docked column at the stage's left
   edge — the canvas starts beside it, so the model is never covered — that
   collapses to a rail; on phones the bottom sheet, which gains Controls /
   Details tabs in lab mode (a click on a part switches it to Details).
   View buttons cut the camera to the diorama's standard views.
   ============================================================= */

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

const fmt = (v) => String(Number(Number(v).toFixed(2)));

const VIEW_LABEL = { sagittal: ['Sagittal', 'Sagittal'], coronal: ['Coronal', 'Coronal'], axial: ['Axial', 'Axial'], oblique: ['¾', 'Three-quarter'] };

export function mountLabControls({ app, root, dock, dockBody, dockToggle, sheetHost, panel, handle, tabs, title, hud, stageHost, stageSwitch,
    graph, store, dioramas, views }) {
    const names = Object.keys(dioramas);
    const remembered = {};          /* per diorama: last parameters, for switching back */
    const wide = matchMedia('(min-width: 960px)');
    let builtFor = null;
    let lastLab = null;
    let collapsed = false;

    /* ---- helpers ---- */

    function ref(id, text) {
        if (!graph.has(id)) return el('span', null, text || id);
        const b = el('button', 'ssb-ref', text || graph.nameOf(id));
        b.type = 'button';
        b.dataset.ref = id;
        return b;
    }
    const shortName = (cls) => {
        const c = graph.get(cls);
        if (!c) return cls;
        if (c.eponym) return String(c.eponym);
        const paren = String(c.name).match(/\(([^)]+)\)\s*$/);
        return paren ? paren[1] : String(c.name).split(' ')[0];
    };
    const classLabel = (cls, code) => {
        const c = graph.get(cls);
        const hit = c && Array.isArray(c.classes) ? c.classes.find((x) => String(x.code) === String(code)) : null;
        return hit ? String(hit.label) : '';
    };
    const lab = () => store.get().lab;
    const set = (patch, meta) => {
        const cur = lab();
        if (cur) store.setLab({ name: cur.name, params: { ...cur.params, ...patch } }, meta);
    };

    /* ---- build the controls for one diorama ---- */

    function build(name) {
        const mod = dioramas[name];
        root.textContent = '';
        builtFor = name;

        const head = el('div', 'ssb-lab-sec');
        head.append(el('h2', 'site-kicker ssb-lab-kicker', 'Diorama'));
        const pick = el('div', 'ssb-lab-pick');
        pick.setAttribute('role', 'group');
        pick.setAttribute('aria-label', 'Diorama');
        for (const n of names) {
            const b = el('button', 'site-pill', dioramas[n].TITLE);
            b.type = 'button';
            b.dataset.lab = n;
            pick.append(b);
        }
        head.append(pick);
        root.append(head);

        const viewSec = el('div', 'ssb-lab-sec');
        viewSec.append(el('h2', 'site-kicker ssb-lab-kicker', 'View'));
        const row = el('div', 'ssb-view-row');
        row.setAttribute('role', 'group');
        row.setAttribute('aria-label', 'View');
        for (const key of Object.keys(mod.VIEWS)) {
            const [text, spoken] = VIEW_LABEL[key] || [key, key];
            const b = el('button', 'site-pill', text);
            b.type = 'button';
            b.dataset.camera = key;
            if (spoken !== text) b.setAttribute('aria-label', spoken);
            row.append(b);
        }
        viewSec.append(row);
        root.append(viewSec);
        markView();

        const presets = el('div', 'ssb-lab-sec');
        presets.append(el('h2', 'site-kicker ssb-lab-kicker', 'Presets'));
        for (const [cls, classes] of Object.entries(mod.PRESETS)) {
            const group = el('div', 'ssb-preset-group');
            group.setAttribute('role', 'group');
            group.setAttribute('aria-label', shortName(cls) + ' presets');
            const title = el('p', 'ssb-preset-title');
            title.append(ref(cls, shortName(cls)));
            group.append(title);
            const row = el('div', 'ssb-preset-row');
            for (const code of Object.keys(classes)) {
                const b = el('button', 'site-pill ssb-preset');
                b.type = 'button';
                b.dataset.cls = cls;
                b.dataset.code = code;
                b.append(el('span', 'ssb-code', code));
                const text = classLabel(cls, code);
                if (text) b.append(el('span', 'ssb-preset-label', text));
                row.append(b);
            }
            group.append(row);
            presets.append(group);
        }
        root.append(presets);

        const params = el('div', 'ssb-lab-sec');
        params.append(el('h2', 'site-kicker ssb-lab-kicker', 'Parameters'));
        for (const p of mod.PARAMS) params.append(paramRow(name, p));
        root.append(params);
    }

    function paramRow(name, p) {
        const id = `ssb-p-${name}-${p.key}`;
        const row = el('div', 'ssb-param');
        row.dataset.key = p.key;
        if (p.requires) row.classList.add('ssb-param-sub');

        if (p.type === 'toggle') {
            row.classList.add('ssb-param-toggle');
            const lbl = el('label', 'ssb-param-label', p.label);
            lbl.htmlFor = id;
            const box = el('input');
            box.type = 'checkbox';
            box.id = id;
            box.dataset.key = p.key;
            row.append(box, lbl);
            if (p.from && graph.has(p.from)) {
                const info = ref(p.from, 'info');
                info.classList.add('ssb-param-info');
                info.setAttribute('aria-label', 'Open ' + graph.nameOf(p.from));
                row.append(info);
            }
            return row;
        }
        if (p.type === 'choice') {
            row.classList.add('ssb-param-choice');
            const head = el('p', 'ssb-param-label', p.label);
            head.id = id;
            const group = el('div', 'ssb-choice');
            group.setAttribute('role', 'group');
            group.setAttribute('aria-labelledby', id);
            for (const o of p.options) {
                const b = el('button', 'site-pill');
                b.type = 'button';
                b.dataset.key = p.key;
                b.dataset.value = String(o.value);
                b.append(el('span', 'ssb-code', o.code));
                const text = p.from ? classLabel(p.from, o.code) : '';
                if (text) b.append(el('span', 'ssb-preset-label', text));
                group.append(b);
            }
            row.append(head, group);
            if (p.from) {
                const src = el('p', 'ssb-param-src');
                src.append(ref(p.from, shortName(p.from)));
                row.append(src);
            }
            return row;
        }
        const head = el('div', 'ssb-param-head');
        const lbl = el('label', 'ssb-param-label', p.label);
        lbl.htmlFor = id;
        const out = el('output', 'ssb-param-value');
        out.htmlFor = id;
        head.append(lbl, out);
        const input = el('input', 'ssb-range');
        input.type = 'range';
        input.id = id;
        input.min = String(p.min);
        input.max = String(p.max);
        input.step = String(p.step);
        input.dataset.key = p.key;
        row.append(head, input);
        if (p.from && !p.requires) {
            const src = el('p', 'ssb-param-src');
            src.append('range from ', ref(p.from, graph.typeOf(p.from) === 'classifications' ? shortName(p.from) : graph.nameOf(p.from)));
            row.append(src);
        }
        return row;
    }

    /* ---- follow the store ---- */

    function sync() {
        const cur = lab();
        app.dataset.stage = cur ? 'lab' : 'specimen';
        for (const b of stageSwitch.querySelectorAll('button[data-stage]')) {
            const on = (b.dataset.stage === 'lab') === !!cur;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
        root.hidden = !cur;
        if (!cur) { place(); return; }
        remembered[cur.name] = cur.params;
        if (builtFor !== cur.name) build(cur.name);
        const mod = dioramas[cur.name];
        for (const b of root.querySelectorAll('button[data-lab]')) {
            const on = b.dataset.lab === cur.name;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
        for (const b of root.querySelectorAll('button[data-cls]')) {
            const preset = mod.PRESETS[b.dataset.cls][b.dataset.code];
            const on = Object.keys(preset).every((k) => cur.params[k] === preset[k]);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
        for (const p of mod.PARAMS) {
            const v = cur.params[p.key];
            const row = root.querySelector(`.ssb-param[data-key="${p.key}"]`);
            if (!row) continue;
            const off = p.requires ? cur.params[p.requires] !== 1 : false;
            row.classList.toggle('is-off', off);
            if (p.type === 'toggle') {
                row.querySelector('input').checked = v === 1;
            } else if (p.type === 'choice') {
                for (const b of row.querySelectorAll('button[data-value]')) {
                    const on = Number(b.dataset.value) === v;
                    b.setAttribute('aria-pressed', on ? 'true' : 'false');
                    b.classList.toggle('active', on);
                }
            } else {
                const input = row.querySelector('input');
                if (Number(input.value) !== v) input.value = String(v);
                input.disabled = off;
                const text = `${fmt(v)}${p.unit === '°' ? '°' : p.unit ? ' ' + p.unit : ''}`;
                row.querySelector('output').textContent = text;
                input.setAttribute('aria-valuetext', text);
            }
        }
        place();
    }

    /* ---- where the controls live ---- */

    function place() {
        const cur = lab();
        const desk = wide.matches;
        const host = desk ? dockBody : sheetHost;
        if (root.parentElement !== host) host.append(root);
        /* The readout heads the open dock on desktop (on the stage when the
           dock is a rail). On phones it overlays the stage, or heads the open
           controls sheet (the stage is too short then to carry it). */
        const inSheet = !desk && panel.dataset.sheet === 'open' && panel.dataset.view === 'controls';
        const hudHost = desk ? (collapsed ? stageHost : dockBody) : inSheet ? sheetHost : stageHost;
        if (hud.parentElement !== hudHost) {
            if (hudHost === stageHost) hudHost.append(hud);
            else hudHost.prepend(hud);
        }
        dock.hidden = !(cur && desk);
        if (cur && desk) stageHost.dataset.dock = collapsed ? 'collapsed' : 'open';
        else delete stageHost.dataset.dock;
        tabs.hidden = !(cur && !desk);
        if (!cur && panel.dataset.view !== 'details') setView('details');
    }

    function setCollapsed(on) {
        collapsed = on;
        dock.dataset.collapsed = on ? 'true' : 'false';
        dockToggle.setAttribute('aria-expanded', on ? 'false' : 'true');
        dockToggle.textContent = on ? 'Lab controls' : 'Hide controls';
        place();
    }

    function markView() {
        for (const b of root.querySelectorAll('button[data-camera]')) {
            const on = b.dataset.camera === views.view;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    }

    /* The sheet handle names what the open sheet shows (ui-panel names the
       details; this names the controls). */
    function titleSheet() {
        if (!wide.matches && lab() && panel.dataset.view === 'controls') title.textContent = 'Lab controls';
        else if (title.textContent === 'Lab controls') title.textContent = store.get().selection ? graph.nameOf(store.get().selection) : 'Details';
    }

    function setView(view) {
        panel.dataset.view = view;
        titleSheet();
        for (const b of tabs.querySelectorAll('button[data-view]')) {
            const on = b.dataset.view === view;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    }

    /* ---- events ---- */

    root.addEventListener('input', (e) => {
        const t = e.target;
        /* 'slider': many changes a second; the URL follows once it settles */
        if (t.matches('input[type="range"][data-key]')) set({ [t.dataset.key]: Number(t.value) }, { source: 'slider' });
    });
    root.addEventListener('change', (e) => {
        const t = e.target;
        if (t.matches('input[type="checkbox"][data-key]')) set({ [t.dataset.key]: t.checked ? 1 : 0 });
    });
    root.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const cur = lab();
        if (b.dataset.ref) { store.select(b.dataset.ref, { source: 'panel' }); return; }
        if (b.dataset.camera) { views.setView(b.dataset.camera); return; }
        if (b.dataset.lab && cur && b.dataset.lab !== cur.name) {
            const n = b.dataset.lab;
            store.setLab({ name: n, params: remembered[n] || {} });
        } else if (b.dataset.cls && cur) {
            set(dioramas[cur.name].PRESETS[b.dataset.cls][b.dataset.code]);
        } else if (b.dataset.key && b.dataset.value !== undefined) {
            set({ [b.dataset.key]: Number(b.dataset.value) });
        }
    });

    stageSwitch.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-stage]');
        if (!b || b.disabled) return;
        if (b.dataset.stage === 'specimen') { store.setLab(null); return; }
        if (lab()) return;
        const name = lastLab || names[0];
        store.setLab({ name, params: remembered[name] || {} });
        if (!wide.matches) {
            setView('controls');
            panel.dataset.sheet = 'open';
            handle.setAttribute('aria-expanded', 'true');
        }
    });

    tabs.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-view]');
        if (b) setView(b.dataset.view);
    });

    store.subscribe((state, prev) => {
        if (state.lab) lastLab = state.lab.name;
        if (state.lab !== prev.lab) sync();
        if (state.selection !== prev.selection && state.selection && state.lab && !wide.matches) setView('details');
        titleSheet();
    });
    const onWide = () => { place(); titleSheet(); };
    new MutationObserver(() => place()).observe(panel, { attributes: true, attributeFilter: ['data-sheet', 'data-view'] });
    dockToggle.addEventListener('click', () => setCollapsed(!collapsed));
    views.onView(markView);
    if (typeof wide.addEventListener === 'function') wide.addEventListener('change', onWide);

    for (const b of stageSwitch.querySelectorAll('button[data-stage]')) b.disabled = false;
    setView(lab() && !wide.matches && !store.get().selection ? 'controls' : 'details');
    sync();
}
