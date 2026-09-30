/* =============================================================
   main.js — SSB entry (type="module"): feature detection, boot, errors.

   Graph mode (tree, search, panels) always boots; the 3D stage boots only
   where WebGL 2 exists, and scene.js (which pulls in three.js) is loaded
   with a dynamic import so a failure there degrades to graph mode instead
   of taking the page down. The variant lab (mode-lab.js, ui-lab.js) mounts
   once both exist. Nothing here throws to a blank page: a problem becomes
   a message in the place the missing piece would have been.

   window.__ssb is a read-only window for tests:
   { frames, selection, caps, hash, lab } (lab: mode-lab.js's hook).
   ============================================================= */
import { loadGraph } from './graph.js?v=b298c916';
import { createStore } from './state.js?v=f8c63408';
import { DIORAMAS, LAB_SPECS } from './dioramas/index.js?v=cae6c45e';
import { mountLab } from './mode-lab.js?v=fe0c3438';
import { mountLabControls } from './ui-lab.js?v=366f2db2';
import { mountTree } from './ui-tree.js?v=a65a733c';
import { mountSearch } from './ui-search.js?v=ac0317ba';
import { mountPanel } from './ui-panel.js?v=84e7f24e';

const $ = (id) => document.getElementById(id);

function detect() {
    let webgl2 = false;
    try {
        const gl = document.createElement('canvas').getContext('webgl2');
        webgl2 = !!gl;
        if (gl) {
            const lose = gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();   /* hand the probe context back */
        }
    } catch (e) { /* no WebGL */ }
    return { webgl2, decompression: typeof DecompressionStream === 'function' };
}

function problem(node, text) {
    node.textContent = '';
    const p = document.createElement('p');
    p.className = 'ssb-problem';
    p.textContent = text;
    node.append(p);
}

const caps = detect();
let store = null;
let stage = null;
let lab = null;
Object.defineProperty(window, '__ssb', {
    value: Object.freeze({
        get frames() { return stage ? stage.frames() : 0; },
        get selection() { return store ? store.get().selection : null; },
        get caps() { return caps; },
        get hash() { return store ? store.hash() : null; },
        get lab() { return lab ? lab.hook : null; },
    }),
});

/* ---------------- graph mode ---------------- */

async function bootGraph() {
    const panelBody = $('ssb-panel-body');
    let graph;
    try {
        graph = await loadGraph();
    } catch (e) {
        console.error(e);
        problem($('ssb-tree'), 'The knowledge graph could not be loaded.');
        problem(panelBody, 'The knowledge graph could not be loaded. Reload the page to try again.');
        return;
    }

    store = createStore({ has: graph.has, tierOf: graph.tierOf, hash: location.hash, labs: LAB_SPECS });
    mountTree({ root: $('ssb-tree'), graph, store });
    mountSearch({ input: $('ssb-search'), results: $('ssb-results'), tree: $('ssb-tree'), graph, store });
    mountPanel({
        panel: $('ssb-panel'), body: panelBody, handle: $('ssb-sheet-handle'), title: $('ssb-sheet-title'),
        live: $('ssb-live'), graph, store,
    });
    wireTier();
    wireNav();
    wireUrl();
    return graph;
}

/* Depth selector: 1 / 2 / 3. */
function wireTier() {
    const buttons = [...document.querySelectorAll('#ssb-tier button[data-tier]')];
    const mark = () => {
        const tier = store.get().tier;
        for (const b of buttons) {
            const on = Number(b.dataset.tier) === tier;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    };
    for (const b of buttons) b.addEventListener('click', () => store.setTier(b.dataset.tier));
    store.subscribe(mark);
    mark();
}

/* Phones: the list and search sit behind the "Structures" toggle. */
function wireNav() {
    const app = $('ssb-app');
    const toggle = $('ssb-nav-toggle');
    const set = (open) => {
        app.dataset.nav = open ? 'open' : 'closed';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) $('ssb-search').focus();
    };
    toggle.addEventListener('click', () => set(app.dataset.nav !== 'open'));
    $('ssb-nav-close').addEventListener('click', () => { set(false); toggle.focus(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !e.defaultPrevented && app.dataset.nav === 'open') set(false);
    });
    /* Picking something closes the sheet-over-stage so the stage and panel show. */
    $('ssb-nav').addEventListener('click', (e) => { if (e.target.closest('button[data-id]')) app.dataset.nav = 'closed'; });
    toggle.setAttribute('aria-expanded', 'false');
}

/* The hash is the shareable state (docs/ssb.md 7.3). Selecting pushes a
   history entry (Back returns to the last selection); a depth change, or a
   change that came from the URL itself, replaces. */
function wireUrl() {
    const write = (mode) => {
        const hash = store.hash();
        if (hash === location.hash || (!hash && !location.hash)) return;
        try { history[mode + 'State'](null, '', location.pathname + location.search + hash); } catch (e) { /* sandboxed: keep going */ }
    };
    write('replace');   /* drop anything junk from the address bar */
    /* A lab slider changes state many times a second; browsers rate-limit
       history writes, so those settle for a moment before replacing. */
    let settle = 0;
    store.subscribe((state, prev, meta) => {
        clearTimeout(settle);
        if (meta.source === 'slider' && state.selection === prev.selection) { settle = setTimeout(() => write('replace'), 250); return; }
        write(meta.source !== 'url' && state.selection !== prev.selection ? 'push' : 'replace');
    });
    const adopt = () => store.applyHash(location.hash);
    window.addEventListener('hashchange', adopt);
    window.addEventListener('popstate', adopt);
}

/* ---------------- 3D stage ---------------- */

async function bootStage() {
    const host = $('ssb-stage');
    const note = $('ssb-stage-note');
    const msg = $('ssb-stage-msg');
    const unavailable = (text) => {
        host.dataset.state = 'unavailable';
        msg.hidden = false;
        msg.textContent = text;
        note.textContent = 'Graph mode';
    };

    if (!caps.webgl2) {
        unavailable('The 3D view needs WebGL 2, which this browser does not offer. The structure list, search and panels work without it.');
        return;
    }
    try {
        const { createScene } = await import('./scene.js?v=58735015');
        stage = createScene({
            canvas: $('ssb-canvas'), host, labels: $('ssb-labels'),
            onLost: () => unavailable('The graphics context was lost. Reload the page to bring the 3D view back.'),
        });
        if (!caps.decompression) note.textContent += ' · no model-pack support in this browser';
        return stage;
    } catch (e) {
        console.error(e);
        unavailable('The 3D view could not start. The structure list, search and panels still work.');
        return null;
    }
}

/* ---------------- variant lab (needs both) ---------------- */

function bootLab(graph, stageHandle) {
    const stageSwitch = $('ssb-stage-mode');
    if (!graph || !stageHandle) {
        for (const b of stageSwitch.querySelectorAll('button')) b.title = 'The lab needs the 3D view, which is unavailable here.';
        return;
    }
    lab = mountLab({
        stage: stageHandle, store, graph, dioramas: DIORAMAS,
        hud: $('ssb-hud'), label: $('ssb-part-label'), truth: $('ssb-truth'), note: $('ssb-stage-note'),
    });
    mountLabControls({
        app: $('ssb-app'), root: $('ssb-lab'), dock: $('ssb-lab-dock'), dockBody: $('ssb-dock-body'), dockToggle: $('ssb-dock-toggle'),
        sheetHost: $('ssb-lab-sheet'), panel: $('ssb-panel'), handle: $('ssb-sheet-handle'), tabs: $('ssb-sheet-tabs'),
        title: $('ssb-sheet-title'), hud: $('ssb-hud'), stageHost: $('ssb-stage'),
        stageSwitch, graph, store, dioramas: DIORAMAS, views: lab,
    });
}

/* Graph mode never waits on the stage, and neither depends on the other;
   the lab waits for both. */
const graphReady = bootGraph().catch((e) => { console.error(e); problem($('ssb-panel-body'), 'Something went wrong starting the page.'); return null; });
const stageReady = bootStage().catch((e) => { console.error(e); return null; });
Promise.all([graphReady, stageReady]).then(([graph, stageHandle]) => bootLab(graph, stageHandle))
    .catch((e) => { console.error(e); });
