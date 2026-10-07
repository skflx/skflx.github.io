/* =============================================================
   ui-tree.js — the structure tree: a real DOM list, keyboard navigable.

   Structures are grouped by region, then kind; every other entity type is a
   flat group under "Everything else", so every fact in the graph is
   reachable here as well as through search and links (docs/ssb.md 7.5).
   Entities above the current depth (tier) are left out. Groups are native
   <details>; selecting an entity opens its ancestors and marks it
   aria-current.
   ============================================================= */
import { OTHER_GROUPS, REGION_LABEL, REGION_ORDER, KIND_LABEL, KIND_ORDER } from './graph.js?v=1c2395c0';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

const byName = (a, b) => String(a.name).localeCompare(String(b.name));

export function mountTree({ root, graph, store }) {
    const open = new Set();   /* group keys the reader has opened */

    function leaf(entity) {
        const li = el('li');
        const b = el('button', 'ssb-leaf');
        b.type = 'button';
        b.dataset.id = entity.id;
        b.append(el('span', 'ssb-leaf-name', String(entity.name)));
        if (entity.tier > 1) b.append(el('span', 'ssb-tier-tag', 'T' + entity.tier));
        li.append(b);
        return li;
    }

    function group(key, label, count, items) {
        const li = el('li');
        const d = el('details', 'ssb-group');
        d.dataset.key = key;
        d.open = open.has(key);
        const sum = el('summary');
        sum.append(el('span', 'ssb-group-name', label), el('span', 'ssb-count', String(count)));
        const ul = el('ul', 'ssb-tree-list');
        ul.append(...items);
        d.append(sum, ul);
        d.addEventListener('toggle', () => { if (d.open) open.add(key); else open.delete(key); });
        li.append(d);
        return li;
    }

    function render() {
        const { tier } = store.get();
        const shown = (e) => (Number(e.tier) || 1) <= tier;
        root.textContent = '';

        /* Structures: region > kind > structure. */
        const regions = new Map();
        for (const e of graph.byType.structures.filter(shown)) {
            const r = regions.get(e.region) || new Map();
            r.set(e.kind, [...(r.get(e.kind) || []), e]);
            regions.set(e.region, r);
        }
        const rank = (order, v) => (order.includes(v) ? order.indexOf(v) : order.length);
        const regionItems = [...regions.keys()].sort((a, b) => rank(REGION_ORDER, a) - rank(REGION_ORDER, b)).map((region) => {
            const kinds = regions.get(region);
            let total = 0;
            const kindItems = [...kinds.keys()].sort((a, b) => rank(KIND_ORDER, a) - rank(KIND_ORDER, b)).map((kind) => {
                const list = kinds.get(kind).sort(byName);
                total += list.length;
                return group(`s:${region}:${kind}`, KIND_LABEL[kind] || String(kind), list.length, list.map(leaf));
            });
            return group(`s:${region}`, REGION_LABEL[region] || String(region), total, kindItems);
        });

        /* Everything else: one flat group per type. */
        const otherItems = OTHER_GROUPS.map(([type, label]) => {
            const list = graph.byType[type].filter(shown).sort(byName);
            return list.length ? group(`o:${type}`, label, list.length, list.map(leaf)) : null;
        }).filter(Boolean);

        if (!regionItems.length && !otherItems.length) {
            root.append(el('p', 'ssb-empty', 'Nothing at this depth.'));
            return;
        }
        if (regionItems.length) {
            root.append(el('h2', 'site-kicker ssb-tree-heading', 'Structures by region'));
            const ul = el('ul', 'ssb-tree-list');
            ul.append(...regionItems);
            root.append(ul);
        }
        if (otherItems.length) {
            root.append(el('h2', 'site-kicker ssb-tree-heading', 'Everything else'));
            const ul = el('ul', 'ssb-tree-list');
            ul.append(...otherItems);
            root.append(ul);
        }
        markSelection(false);
    }

    /* Highlight the selected leaf; open its groups and bring it into view. */
    function markSelection(reveal) {
        const { selection } = store.get();
        let target = null;
        for (const b of root.querySelectorAll('button[aria-current]')) b.removeAttribute('aria-current');
        for (const b of root.querySelectorAll('button[data-id]')) {
            if (b.dataset.id === selection) { target = b; break; }
        }
        if (!target) return;
        target.setAttribute('aria-current', 'true');
        if (!reveal) return;
        for (let d = target.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) {
            d.open = true;
            open.add(d.dataset.key);
        }
        target.scrollIntoView({ block: 'nearest' });
    }

    root.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-id]');
        if (b) store.select(b.dataset.id, { source: 'tree' });
    });

    /* A row is reachable when every group above it is open (a summary is
       reachable when the groups above its own group are). */
    function reachable(row) {
        let from = row.tagName === 'SUMMARY' ? row.parentElement.parentElement : row.parentElement;
        for (let d = from && from.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) {
            if (!d.open) return false;
        }
        return true;
    }

    /* Up/Down walk the reachable rows; Right/Left open/close a group. */
    root.addEventListener('keydown', (e) => {
        const cur = document.activeElement;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const rows = [...root.querySelectorAll('summary, button.ssb-leaf')].filter(reachable);
            const i = rows.indexOf(cur);
            if (i < 0) return;
            const next = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
            if (next) { next.focus(); e.preventDefault(); }
        } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && cur && cur.tagName === 'SUMMARY') {
            cur.parentElement.open = e.key === 'ArrowRight';
            e.preventDefault();
        }
    });

    store.subscribe((state, prev) => {
        if (state.tier !== prev.tier) render();
        if (state.selection !== prev.selection) markSelection(true);
    });

    render();
    markSelection(true);
}
