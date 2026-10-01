/* =============================================================
   mode-lab.js — the variant lab stage (docs/ssb.md 3, 6).

   Follows state.lab: builds the named diorama with its parameters into the
   stage's content slot (rebuilding at most once per frame while a slider
   moves), assigns token materials by each part's look, hatches hazard
   sites, highlights the parts of the selected entity, and runs the flow
   particles unless the reader prefers reduced motion.

   A click on the stage picks the part under the cursor and selects its
   graph entity through the ordinary store path (the tree, panel and URL
   follow); clicking the same spot again steps to the next part under it.
   Views (sagittal / coronal / axial / oblique, from each diorama's VIEWS)
   are camera cuts, never flights; a new diorama opens on its default view,
   and a parameter change keeps the reader's camera.
   The HUD states the classification of the current parameters and names
   every hazard that is hatched — hazards are never colour alone.

   Imports nothing that pulls in three.js: THREE comes from the stage.
   `hook` is the read-only test window (window.__ssb.lab).
   ============================================================= */
import { sceneToRas } from './frame.js?v=f554e767';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function mountLab({ stage, store, graph, dioramas, hud, label, truth, note }) {
    const { THREE } = stage;
    let current = null;          /* { name, params, group } */
    let view = null;             /* the current view key */
    let builds = 0;
    const viewSubs = new Set();
    let queued = false;
    let stopAnim = null;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');

    /* ---- names from the graph ---- */

    const classLabel = (cls, code) => {
        const c = graph.get(cls);
        const hit = c && Array.isArray(c.classes) ? c.classes.find((x) => String(x.code) === String(code)) : null;
        return hit ? String(hit.label) : '';
    };
    const shortName = (cls) => {
        const c = graph.get(cls);
        if (!c) return cls;
        if (c.eponym) return String(c.eponym);
        const paren = String(c.name).match(/\(([^)]+)\)\s*$/);
        return paren ? paren[1] : String(c.name).split(' ')[0];
    };
    const names = { classLabel, shortName, name: (id) => graph.nameOf(id) };

    /* ---- build ---- */

    const partsOf = (group) => {
        const out = [];
        group.traverse((o) => { if (o.userData && o.userData.id && o.name) out.push(o); });
        return out;
    };

    function paint() {
        if (!current) return;
        const sel = store.get().selection;
        for (const part of partsOf(current.group)) {
            const look = part.userData.look || {};
            const opts = { hazard: Array.isArray(part.userData.hazards) && part.userData.hazards.length > 0, selected: part.userData.id === sel };
            part.traverse((o) => {
                if (!o.isMesh) return;
                if (o !== part && o.userData.id) return;           /* a nested part paints itself */
                /* cut faces exist only on extruded slabs (group 0 = caps, 1 = sides) */
                const cut = !!look.cut && o.geometry.type === 'ExtrudeGeometry';
                o.material = stage.materialsFor(cut === !!look.cut ? look : { ...look, cut }, opts);
            });
        }
        stage.requestRender();
    }

    function animate() {
        if (stopAnim) { stopAnim(); stopAnim = null; }
        const movers = [];
        if (current) current.group.traverse((o) => { if (typeof o.userData.animate === 'function') movers.push(o.userData.animate); });
        const on = movers.length > 0 && !reduce.matches;
        if (on) stopAnim = stage.onFrame((now) => { for (const fn of movers) fn(now / 1000); });
        stage.setAnimating(on);
    }

    function rebuild() {
        queued = false;
        const lab = store.get().lab;
        if (!lab) {
            if (current) {
                current = null;
                stage.setContent(null);
                stage.resetView();
            }
            animate();
            renderHud();
            setTruth();
            return;
        }
        const mod = dioramas[lab.name];
        const fresh = !current || current.name !== lab.name;
        let group;
        try {
            group = mod.build(THREE, lab.params);
        } catch (e) {
            console.error(e);
            return;
        }
        for (const part of partsOf(group)) {
            if (!(part.userData.look || {}).ghost) continue;
            const meshes = [];
            part.traverse((o) => { if (o.isMesh && !o.geometry.parameters?.path) meshes.push(o); });   /* not tubes */
            for (const m of meshes) m.add(stage.outline(m));
        }
        current = { name: lab.name, params: lab.params, group };
        stage.setContent(group);
        group.updateMatrixWorld(true);     /* so boxes read back before the next frame are right */
        if (fresh) setView(mod.VIEW_DEFAULT);
        paint();
        animate();
        renderHud();
        setTruth();
        builds += 1;
    }

    /* Cut the camera to one of the diorama's standard views. */
    function setView(key) {
        if (!current) return false;
        const views = dioramas[current.name].VIEWS;
        if (!views[key]) return false;
        view = key;
        stage.frame(current.group, views[key], current.group.userData.focus);
        for (const fn of [...viewSubs]) fn(key);
        return true;
    }

    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(rebuild);
    }

    /* ---- HUD: classification + hazards, as text ---- */

    function refButton(id, text) {
        if (!graph.has(id)) return document.createTextNode(text || id);
        const b = el('button', 'ssb-ref', text || graph.nameOf(id));
        b.type = 'button';
        b.dataset.ref = id;
        return b;
    }

    function renderHud() {
        hud.textContent = '';
        if (!current) { hud.hidden = true; return; }
        hud.hidden = false;
        const mod = dioramas[current.name];
        const lines = typeof mod.readout === 'function' ? mod.readout(current.params, current.group.userData, names) : [];
        const hazards = new Map();
        for (const part of partsOf(current.group)) {
            for (const h of part.userData.hazards || []) {
                if (!hazards.has(h)) hazards.set(h, new Set());
                hazards.get(h).add(part.userData.id);
            }
        }
        for (const [h, at] of hazards) {
            lines.push([{ hatch: true }, 'Hazard: ', { ref: h }, ` (${[...at].map((id) => graph.nameOf(id)).join(', ')})`]);
        }
        for (const line of lines) {
            const p = el('p', 'ssb-hud-line');
            for (const seg of line) {
                if (typeof seg === 'string') p.append(seg);
                else if (seg.hatch) p.append(el('span', 'ssb-hatch-key'));
                else if (seg.ref) p.append(refButton(seg.ref, seg.text));
                else if (seg.strong) p.append(el('strong', null, seg.strong));
            }
            hud.append(p);
        }
    }

    hud.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ref]');
        if (b) store.select(b.dataset.ref, { source: 'scene' });
    });

    function setTruth() {
        truth.hidden = !current;
        note.hidden = !!current;
        if (current) truth.textContent = `Diorama · ${dioramas[current.name].TITLE} · schematic — idealized`;
    }

    /* ---- picking ---- */

    const canvas = stage.canvas;
    let down = null;
    let last = null;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: e.timeStamp }; });
    canvas.addEventListener('click', (e) => {
        if (!current || !down) return;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;     /* that was an orbit drag */
        const hits = stage.pick(e.clientX, e.clientY);
        if (!hits.length) return;
        const again = last && Math.hypot(e.clientX - last.x, e.clientY - last.y) <= 3;
        const index = again ? (last.index + 1) % hits.length : 0;
        last = { x: e.clientX, y: e.clientY, index };
        store.select(hits[index].userData.id, { source: 'scene' });
    });

    /* ---- selection: highlight + one label ---- */

    const box = new THREE.Box3();
    const centre = new THREE.Vector3();
    stage.onFrame(() => {
        const sel = store.get().selection;
        const target = current && sel ? partsOf(current.group).find((p) => p.userData.id === sel) : null;
        if (!target) { label.hidden = true; return; }
        box.setFromObject(target).getCenter(centre);
        const r = label.parentElement.getBoundingClientRect();
        const c = stage.toClient(centre);
        label.hidden = !c.front;
        label.textContent = graph.nameOf(sel);
        label.style.transform = `translate(${(c.x - r.left).toFixed(1)}px, ${(c.y - r.top).toFixed(1)}px) translate(-50%, calc(-100% - 10px))`;
    });

    store.subscribe((state, prev) => {
        if (state.lab !== prev.lab) schedule();
        else if (state.selection !== prev.selection) paint();
    });
    const motion = () => animate();
    if (typeof reduce.addEventListener === 'function') reduce.addEventListener('change', motion);
    stage.onTheme(() => renderHud());
    schedule();

    /* ---- the test window ---- */

    const rasBox = (obj) => {
        box.setFromObject(obj);
        const a = sceneToRas([box.min.x, box.min.y, box.min.z]);
        const b = sceneToRas([box.max.x, box.max.y, box.max.z]);
        return { min: a.map((v, i) => Math.min(v, b[i])), max: a.map((v, i) => Math.max(v, b[i])) };
    };
    const hook = Object.freeze({
        get builds() { return builds; },
        get name() { return current ? current.name : null; },
        get params() { return current ? { ...current.params } : null; },
        get presets() { return current ? dioramas[current.name].PRESETS : null; },
        get derived() { return current ? current.group.userData.derived || null : null; },
        get pathway() { return current && current.group.userData.pathway ? current.group.userData.pathway : null; },
        get animating() { return !!stopAnim; },
        get view() { return current ? view : null; },
        /* every named part: name, graph id, hazards, RAS bounding box */
        parts() {
            return current ? partsOf(current.group).map((p) => ({
                name: p.name, id: p.userData.id, hazards: p.userData.hazards || [], box: rasBox(p),
            })) : [];
        },
        /* a client point where a click picks the named part first, or null */
        screenOf(name) {
            if (!current) return null;
            const part = partsOf(current.group).find((p) => p.name === name);
            if (!part) return null;
            const v = new THREE.Vector3();
            const pts = [];
            part.traverse((o) => {
                if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
                const pos = o.geometry.attributes.position;
                const stride = Math.max(1, Math.floor(pos.count / 400));
                for (let i = 0; i < pos.count; i += stride) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).clone());
            });
            box.setFromObject(part).getCenter(centre);
            pts.unshift(centre.clone());
            const r = stage.canvas.getBoundingClientRect();
            for (const p of pts) {
                /* nudge toward the centre so a silhouette vertex is not a miss */
                const q = p.clone().lerp(centre, 0.08);
                const c = stage.toClient(q);
                if (!c.front || c.x < r.left + 2 || c.y < r.top + 2 || c.x > r.right - 2 || c.y > r.bottom - 2) continue;
                const top = document.elementFromPoint(c.x, c.y);
                if (top !== stage.canvas) continue;
                const hits = stage.pick(c.x, c.y);
                if (hits.length && hits[0] === part) return { x: c.x, y: c.y };
            }
            return null;
        },
    });

    return {
        hook,
        setView,
        get view() { return current ? view : null; },
        onView(fn) { viewSubs.add(fn); return () => viewSubs.delete(fn); },
    };
}
