/* =============================================================
   main.js — SSB entry (type="module"): feature detection, boot, errors.

   Graph mode (tree, search, panels) always boots; the 3D stage boots only
   where WebGL 2 exists, and scene.js (which pulls in three.js) is loaded
   with a dynamic import so a failure there degrades to graph mode instead
   of taking the page down. The variant lab (mode-lab.js, ui-lab.js) mounts
   once both exist, and so does the Specimen stage (mode-specimen.js,
   ui-specimen.js), also by dynamic import because geo-specimen.js pulls in
   three.js and its glTF loader. The CT stage (mode-ct.js, ui-ct.js) needs only the graph:
   it is drawn on 2D canvases from typed arrays, so it works with no WebGL
   at all (the documented fallback, docs/ssb.md 7.5). Nothing here throws to
   a blank page: a problem becomes a message in the place the missing piece
   would have been.

   The Endoscope stage (mode-endoscope.js, ui-endoscope.js) is a pose over the
   specimen (scope.js is its math, state.scope its state) and mounts with it.

   window.__ssb is a read-only window for tests:
   { frames, selection, caps, hash, lab, ct, specimen, scope, materials } (lab, ct,
   specimen, scope: the stages' hooks; materials: scene.js's hook on the
   tissue-material library).
   ============================================================= */
import { loadGraph } from './graph.js?v=a5e5391b';
import { createStore, parseHash } from './state.js?v=82ca4b88';
import { DIORAMAS, LAB_SPECS } from './dioramas/index.js?v=c2c1fadc';
import { mountLab } from './mode-lab.js?v=fe0c3438';
import { mountLabControls } from './ui-lab.js?v=e3714361';
import { mountCt } from './mode-ct.js?v=c5cee30a';
import { buildCtDom, mountCtControls } from './ui-ct.js?v=f4ef660c';
import { mountTree } from './ui-tree.js?v=f9bd540b';
import { mountSearch } from './ui-search.js?v=11fc32d4';
import { mountPanel } from './ui-panel.js?v=ef5bfbd3';

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
let ct = null;
let specimen = null;
let endo = null;
let panelApi = null;
Object.defineProperty(window, '__ssb', {
    value: Object.freeze({
        get frames() { return stage ? stage.frames() : 0; },
        get selection() { return store ? store.get().selection : null; },
        get caps() { return caps; },
        get hash() { return store ? store.hash() : null; },
        get lab() { return lab ? lab.hook : null; },
        get ct() { return ct ? ct.hook : null; },
        get specimen() { return specimen ? specimen.hook : null; },
        get scope() { return endo ? endo.hook : null; },
        get materials() { return stage ? stage.materialsHook : null; },
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
    panelApi = mountPanel({
        panel: $('ssb-panel'), body: panelBody, handle: $('ssb-sheet-handle'), title: $('ssb-sheet-title'),
        live: $('ssb-live'), graph, store,
        annotate: (id) => (specimen ? specimen.annotate(id) : null),     /* "no geometry for this entry" */
    });
    wireTier();
    wireNav();
    wireUrl();
    wireQuality();
    wireStages();
    bootCt(graph);
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
    /* A lab slider or a CT crosshair drag changes state many times a second;
       browsers rate-limit history writes, so those settle for a moment before
       replacing. */
    let settle = 0;
    store.subscribe((state, prev, meta) => {
        clearTimeout(settle);
        if ((meta.source === 'slider' || meta.source === 'cursor' || meta.source === 'scope') && state.selection === prev.selection) { settle = setTimeout(() => write('replace'), 250); return; }
        write(meta.source !== 'url' && state.selection !== prev.selection ? 'push' : 'replace');
    });
    const adopt = () => store.applyHash(location.hash);
    window.addEventListener('hashchange', adopt);
    window.addEventListener('popstate', adopt);
}

/* The #q= override follows the store (a hand edit or Back/Forward re-applies
   it); null means the device's own choice (docs/ssb.md 7.4). The stage may
   not exist yet: bootStage reads the same key straight from the hash. */
function wireQuality() {
    let seen = store.get().quality;
    store.subscribe((state) => {
        if (state.quality === seen) return;
        seen = state.quality;
        if (stage) stage.setQuality(state.quality);
    });
}

/* The stage switch: the four stages are exclusive (specimen, lab, CT, scope).
   Which one is showing follows the store (`data-stage` on the app, the
   pressed pill); the lab's own button is handled in ui-lab.js and the CT
   button in ui-ct.js. Leaving for the specimen works without a 3D view too,
   where it shows the "needs WebGL" message. */
function wireStages() {
    const app = $('ssb-app');
    const stageSwitch = $('ssb-stage-mode');
    const mark = () => {
        const { lab: inLab, ct: inCt, scope: inScope } = store.get();
        const stage = inLab ? 'lab' : inCt ? 'ct' : inScope ? 'scope' : 'specimen';
        app.dataset.stage = stage;
        for (const b of stageSwitch.querySelectorAll('button[data-stage]')) {
            const on = b.dataset.stage === stage;
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('active', on);
        }
    };
    store.subscribe(mark);
    mark();
    const specimen = stageSwitch.querySelector('button[data-stage="specimen"]');
    specimen.disabled = false;
    specimen.addEventListener('click', () => store.leaveStage());
}

/* ---------------- CT (needs only the graph) ---------------- */

function bootCt(graph) {
    try {
        const dom = buildCtDom($('ssb-ct'));
        ct = mountCt({ store, graph, dom });
        mountCtControls({ dom, ct, store, graph, stageSwitch: $('ssb-stage-mode') });
    } catch (e) {
        console.error(e);
        const button = $('ssb-stage-mode').querySelector('button[data-stage="ct"]');
        if (button) button.title = 'The CT stage could not start.';
    }
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
        const { createScene } = await import('./scene.js?v=02ca29d5');
        stage = createScene({
            canvas: $('ssb-canvas'), host, labels: $('ssb-labels'),
            quality: parseHash(location.hash, () => false).quality || null,
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
        const button = stageSwitch.querySelector('button[data-stage="lab"]');
        if (button) button.title = 'The lab needs the 3D view, which is unavailable here.';
        return;
    }
    lab = mountLab({
        stage: stageHandle, store, graph, dioramas: DIORAMAS,
        hud: $('ssb-hud'), label: $('ssb-part-label'), truth: $('ssb-truth'), note: $('ssb-stage-note'),
    });
    mountLabControls({
        root: $('ssb-lab'), dock: $('ssb-lab-dock'), dockBody: $('ssb-dock-body'), dockToggle: $('ssb-dock-toggle'),
        sheetHost: $('ssb-lab-sheet'), panel: $('ssb-panel'), handle: $('ssb-sheet-handle'), tabs: $('ssb-sheet-tabs'),
        title: $('ssb-sheet-title'), hud: $('ssb-hud'), stageHost: $('ssb-stage'),
        stageSwitch, graph, store, dioramas: DIORAMAS, views: lab,
    });
}

/* ---------------- the Specimen stage (needs both) ---------------- */

async function bootSpecimen(graph, stageHandle) {
    if (!graph || !stageHandle) return;
    try {
        const [{ mountSpecimen }, { mountSpecimenControls, buildOrient }] = await Promise.all([import('./mode-specimen.js?v=f9b218de'), import('./ui-specimen.js?v=d1052f97')]);
        specimen = mountSpecimen({
            stage: stageHandle, store, graph,
            dom: { note: $('ssb-stage-note'), msg: $('ssb-stage-msg'), labels: $('ssb-labels') },
            orient: buildOrient($('ssb-orient')), panel: panelApi,
        });
        mountSpecimenControls({
            dock: $('ssb-spec-dock'), body: $('ssb-spec-body'), toggle: $('ssb-spec-toggle'), stageHost: $('ssb-stage'), specimen, store,
        });
        await bootEndoscope(graph, stageHandle);
    } catch (e) {
        console.error(e);
        specimen = null;
        const msg = $('ssb-stage-msg');
        msg.hidden = false;
        msg.textContent = 'The reference specimen could not start. The structure list, search, panels, the lab and CT still work.';
    }
}

/* The endoscope rides on the specimen (its dock, its meshes), so it mounts right after it; a failure
   here leaves the specimen, the lab and CT working and the Scope pill disabled. */
async function bootEndoscope(graph, stageHandle) {
    try {
        const [{ mountEndoscope }, { mountEndoscopeControls }] = await Promise.all([import('./mode-endoscope.js?v=56e65aaa'), import('./ui-endoscope.js?v=dc20be92')]);
        endo = mountEndoscope({ stage: stageHandle, store, graph, specimen });
        mountEndoscopeControls({ body: $('ssb-spec-body'), stageHost: $('ssb-stage'), endo, store, stageSwitch: $('ssb-stage-mode') });
    } catch (e) {
        console.error(e);
        endo = null;
        const button = $('ssb-stage-mode').querySelector('button[data-stage="scope"]');
        if (button) button.title = 'The endoscope could not start.';
    }
}

/* Graph mode never waits on the stage, and neither depends on the other;
   the lab and the specimen wait for both. */
const graphReady = bootGraph().catch((e) => { console.error(e); problem($('ssb-panel-body'), 'Something went wrong starting the page.'); return null; });
const stageReady = bootStage().catch((e) => { console.error(e); return null; });
Promise.all([graphReady, stageReady]).then(([graph, stageHandle]) => {
    bootLab(graph, stageHandle);
    return bootSpecimen(graph, stageHandle);
}).catch((e) => { console.error(e); });
