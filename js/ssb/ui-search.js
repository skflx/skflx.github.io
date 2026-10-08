/* =============================================================
   ui-search.js — search box + result list.

   Matches name, synonyms, eponym and superseded terms (graph.search), at or
   below the current depth. While a query is present the results replace the
   tree. Enter opens the best match; Down moves into the list; Escape clears.
   Everything reaches the DOM through textContent.
   ============================================================= */
import { TYPE_LABEL, REGION_LABEL } from './graph.js?v=fb5e1ade';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function mountSearch({ input, results, tree, graph, store }) {
    function render() {
        const query = input.value.trim();
        results.hidden = !query;
        tree.hidden = !!query;
        results.textContent = '';
        if (!query) return;

        const { selection, tier } = store.get();
        const { hits, hidden } = graph.search(query, { tier });
        /* role=status: a polite live region, so the count is announced. */
        const status = el('p', 'ssb-results-note', hits.length
            ? `${hits.length}${hits.length >= 60 ? '+' : ''} match${hits.length === 1 ? '' : 'es'}`
            : `No matches for “${query}”.`);
        status.setAttribute('role', 'status');
        results.append(status);

        if (hits.length) {
            const ul = el('ul', 'ssb-results-list');
            for (const h of hits) {
                const li = el('li');
                const b = el('button', 'ssb-leaf ssb-hit');
                b.type = 'button';
                b.dataset.id = h.id;
                if (h.id === selection) b.setAttribute('aria-current', 'true');
                const e = graph.get(h.id);
                const meta = [TYPE_LABEL[h.type], e && e.region ? REGION_LABEL[e.region] : null, 'T' + h.tier]
                    .filter(Boolean).join(' · ');
                b.append(el('span', 'ssb-leaf-name', h.name), el('span', 'ssb-hit-meta', meta));
                li.append(b);
                ul.append(li);
            }
            results.append(ul);
        }
        if (hidden) results.append(el('p', 'ssb-results-note', `${hidden} more at a higher depth.`));
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const first = results.querySelector('button[data-id]');
            if (first) { store.select(first.dataset.id, { source: 'search' }); e.preventDefault(); }
        } else if (e.key === 'ArrowDown') {
            const first = results.querySelector('button[data-id]');
            if (first) { first.focus(); e.preventDefault(); }
        } else if (e.key === 'Escape' && input.value) {
            input.value = '';
            render();
            e.preventDefault();
        }
    });

    results.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-id]');
        if (b) store.select(b.dataset.id, { source: 'search' });
    });
    results.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') return;
        const rows = [...results.querySelectorAll('button[data-id]')];
        const i = rows.indexOf(document.activeElement);
        if (e.key === 'Escape') { input.focus(); e.preventDefault(); return; }
        if (i < 0) return;
        const next = e.key === 'ArrowDown' ? rows[i + 1] : (rows[i - 1] || input);
        if (next) { next.focus(); e.preventDefault(); }
    });

    /* Depth changes what may match (rebuild); a selection change only moves
       the mark, so a focused result keeps focus. */
    store.subscribe((state, prev) => {
        if (!input.value.trim()) return;
        if (state.tier !== prev.tier) { render(); return; }
        for (const b of results.querySelectorAll('button[data-id]')) {
            if (b.dataset.id === state.selection) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
        }
    });
}
