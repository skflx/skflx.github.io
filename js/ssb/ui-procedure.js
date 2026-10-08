/* =============================================================
   ui-procedure.js — the procedure player's DOM (WP P2): the step list with each step's `do`, `see` and `risk`, the `think`
   kept behind "Think first" until the reader reveals it (a recall prompt), Previous / Next and the `[` `]` keys, a corridor
   picker, and the badge saying what the specimen on screen is. It lives in the Specimen dock's body beside the scope
   controls and shows only while a procedure plays.

   Everything is written with textContent / attributes / properties, except the content strings that may carry [[id]] /
   *em* / **strong**, which go through graph.renderText (it escapes first, docs/ssb.md 7.6). The URL (`#p=`, `step`, `cor`)
   only ever selects an entry the store has whitelisted, and reaches the page as text.
   ============================================================= */
import { renderText } from './graph.js?v=fb5e1ade';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

const asList = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []);
const BADGE_DISSECTED = 'Specimen, dissected — rule-based cut';
const BADGE_INTACT = 'Specimen, intact';

export function mountProcedureControls({ body, player, store, graph }) {
    const root = el('section', 'ssb-proc');
    root.id = 'ssb-proc';
    root.setAttribute('aria-label', 'Procedure');
    root.hidden = true;
    body.append(root);

    const rich = (tag, cls, text) => {
        const node = el(tag, cls);
        node.innerHTML = renderText(text, graph);
        return node;
    };
    const ref = (id) => {
        if (!graph.has(id)) return document.createTextNode(String(id));
        const b = el('button', 'ssb-ref', graph.nameOf(id));
        b.type = 'button';
        b.dataset.ref = id;
        return b;
    };
    const refs = (ids) => {
        const span = el('span');
        asList(ids).forEach((id, i) => { if (i) span.append(', '); span.append(ref(id)); });
        return span;
    };

    const kicker = el('h2', 'site-kicker ssb-lab-kicker', 'Procedure');
    const title = el('p', 'ssb-proc-title');
    const badge = el('p', 'ssb-param-src ssb-proc-badge');
    badge.setAttribute('role', 'status');
    const where = el('p', 'ssb-param-src ssb-proc-where');
    where.setAttribute('aria-live', 'polite');
    const note = el('p', 'ssb-param-src ssb-proc-note');

    const nav = el('div', 'ssb-view-row ssb-proc-nav');
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Step');
    const prev = el('button', 'site-pill', 'Previous');
    prev.type = 'button';
    prev.dataset.act = 'prev';
    prev.title = 'Previous step ([)';
    const next = el('button', 'site-pill', 'Next');
    next.type = 'button';
    next.dataset.act = 'next';
    next.title = 'Next step (])';
    const stop = el('button', 'site-pill', 'Stop');
    stop.type = 'button';
    stop.dataset.act = 'stop';
    stop.title = 'Leave the procedure; the scope stays';
    nav.append(prev, next, stop);

    const corRow = el('div', 'ssb-view-row ssb-proc-cor');
    corRow.setAttribute('role', 'group');
    corRow.setAttribute('aria-label', 'Corridor');

    const list = el('ol', 'ssb-list ssb-proc-steps');
    const keys = el('p', 'ssb-param-src', 'Keys: [ and ] step, T reveals the think prompt.');
    root.append(kicker, title, badge, where, corRow, nav, list, note, keys);

    let revealed = '';                       /* "<id>#<step>" whose think is open */
    let built = '';                          /* "<id>|<N>": the list on screen */

    const stepKey = (proc) => `${proc.id}#${proc.step}`;

    function buildList(proc, N) {
        list.replaceChildren();
        const steps = player.stepsOf(proc.id);
        const start = el('li', 'ssb-proc-step');
        start.dataset.step = '0';
        const startBtn = el('button', 'ssb-proc-go', 'Start: before step 1');
        startBtn.type = 'button';
        startBtn.dataset.go = '0';
        start.append(startBtn);
        list.append(start);
        for (let n = 1; n <= N; n++) {
            const s = steps[n - 1];
            const li = el('li', 'ssb-proc-step');
            li.dataset.step = String(n);
            const go = el('button', 'ssb-proc-go', `Step ${n}`);
            go.type = 'button';
            go.dataset.go = String(n);
            li.append(go);
            if (s && s.do) li.append(rich('div', 'ssb-text ssb-proc-do', s.do));
            list.append(li);
        }
    }

    function fillCurrent(proc) {
        for (const li of list.children) {
            const n = Number(li.dataset.step);
            const on = n === proc.step;
            li.classList.toggle('active', on);
            const go = li.querySelector('.ssb-proc-go');
            if (on) go.setAttribute('aria-current', 'step'); else go.removeAttribute('aria-current');
            li.querySelector('.ssb-proc-more')?.remove();
            if (!on || n < 1) continue;
            const s = player.stepsOf(proc.id)[n - 1];
            if (!s) continue;
            const more = el('div', 'ssb-proc-more');
            for (const [label, ids] of [['see', s.see], ['risk', s.risk]]) {
                if (!asList(ids).length) continue;
                const d = el('div', 'ssb-step-line');
                d.append(el('span', 'ssb-rel', label), ' ', refs(ids));
                more.append(d);
            }
            if (s.think) {
                const open = revealed === stepKey(proc);
                const toggle = el('button', 'site-pill ssb-proc-think-toggle', open ? 'Hide think' : 'Think first');
                toggle.type = 'button';
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                toggle.dataset.act = 'think';
                const text = rich('p', 'ssb-text ssb-proc-think', s.think);
                text.hidden = !open;
                more.append(toggle, text);
            }
            li.append(more);
        }
    }

    function sync() {
        const proc = store.get().procedure;
        root.hidden = !proc;
        if (!proc) { revealed = ''; built = ''; return; }
        const N = player.stepCount(proc.id);
        const sig = `${proc.id}|${N}`;
        if (sig !== built) { built = sig; buildList(proc, N); }
        title.textContent = graph.nameOf(proc.id);
        const shown = player.shown;
        badge.textContent = shown && shown.key ? BADGE_DISSECTED : BADGE_INTACT;
        badge.dataset.state = shown && shown.key ? 'dissected' : 'intact';
        where.textContent = N ? `Step ${proc.step} of ${N}${player.busy ? ' · loading the state…' : ''}` : 'Loading the dissection states…';
        note.textContent = player.note;
        note.hidden = !player.note;
        prev.disabled = proc.step <= 0;
        next.disabled = N === 0 || proc.step >= N;
        const cors = player.corridorsFor(proc.id);
        corRow.hidden = cors.length === 0;
        corRow.replaceChildren();
        if (cors.length) {
            const own = el('button', 'site-pill', 'Own entry');
            own.type = 'button';
            own.dataset.cor = '';
            own.title = 'The state this procedure starts from on its own';
            corRow.append(own);
            for (const c of cors) {
                const b = el('button', 'site-pill', c.name);
                b.type = 'button';
                b.dataset.cor = c.key;
                b.title = `Accumulate the earlier steps of ${c.name}`;
                corRow.append(b);
            }
            for (const b of corRow.querySelectorAll('button')) {
                const on = b.dataset.cor === (proc.cor || '');
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
                b.classList.toggle('active', on);
            }
        }
        fillCurrent(proc);
    }

    root.addEventListener('click', (e) => {
        const r = e.target.closest('[data-ref]');
        if (r) { store.select(r.dataset.ref, { source: 'panel' }); return; }
        const go = e.target.closest('[data-go]');
        if (go) { player.setStep(Number(go.dataset.go)); return; }
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.act === 'prev') player.prev();
        else if (b.dataset.act === 'next') player.next();
        else if (b.dataset.act === 'stop') player.stop();
        else if (b.dataset.act === 'think') toggleThink();
        else if (b.dataset.cor !== undefined) player.setCorridor(b.dataset.cor || null);
    });

    function toggleThink() {
        const proc = store.get().procedure;
        if (!proc) return false;
        const k = stepKey(proc);
        revealed = revealed === k ? '' : k;
        fillCurrent(proc);
        return true;
    }

    /* [ and ] step; T reveals the think prompt. Not while typing, and never with a modifier. */
    document.addEventListener('keydown', (e) => {
        if (!store.get().procedure || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
        if (e.key === '[') { e.preventDefault(); player.prev(); }
        else if (e.key === ']') { e.preventDefault(); player.next(); }
        else if (e.key === 't' || e.key === 'T') { if (toggleThink()) e.preventDefault(); }
    });

    store.subscribe((state, prev2) => {
        if (state.procedure !== prev2.procedure) {
            if (!state.procedure || !prev2.procedure || state.procedure.id !== prev2.procedure.id || state.procedure.step !== prev2.procedure.step) revealed = '';
            sync();
        }
    });
    player.onChange(sync);
    sync();
    return { sync, toggleThink };
}
