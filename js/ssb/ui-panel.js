/* =============================================================
   ui-panel.js — the info panel: renders the selected entity by type.

   Plain fields go in through textContent; the two content fields that may
   carry [[id]] / *em* / **strong** go through graph.renderText, which
   escapes first (docs/ssb.md 7.6). A [[id]] link inside the panel selects
   that entity. The pearls shown follow the depth (tier) setting.

   On phones the panel is a bottom sheet (ssb.css): the handle button
   toggles data-sheet; on desktop that attribute is inert.
   ============================================================= */
import { renderText, TYPE_LABEL, REGION_LABEL, KIND_LABEL } from './graph.js?v=b298c916';

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

const asList = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []);
const words = (s) => String(s).replace(/-/g, ' ');

export function mountPanel({ panel, body, handle, title, live, graph, store }) {
    /* ---- small builders ---- */

    const rich = (tag, cls, text) => {
        const node = el(tag, cls);
        node.innerHTML = renderText(text, graph);
        return node;
    };

    /* A link button for an entity id (sources show their id, as their cite is long). */
    function ref(id) {
        if (!graph.has(id)) return document.createTextNode(String(id));
        const b = el('button', 'ssb-ref', graph.typeOf(id) === 'sources' ? id : graph.nameOf(id));
        b.type = 'button';
        b.dataset.ref = id;
        return b;
    }

    function refs(ids, sep = ', ') {
        const span = el('span');
        asList(ids).forEach((id, i) => {
            if (i) span.append(sep);
            span.append(ref(id));
        });
        return span;
    }

    function section(label, ...content) {
        const s = el('section', 'ssb-sec');
        s.append(el('h3', 'site-kicker ssb-label', label), ...content);
        return s;
    }

    const textSec = (label, text) => (text ? section(label, rich('p', 'ssb-text', text)) : null);
    function linkSec(label, ids) {
        if (!asList(ids).length) return null;
        const p = el('p', 'ssb-text');
        p.append(refs(ids));
        return section(label, p);
    }

    function listSec(label, items, render, cls = 'ssb-list') {
        if (!items || !items.length) return null;
        const ul = el('ul', cls);
        for (const item of items) {
            const li = el('li');
            li.append(render(item));
            ul.append(li);
        }
        return section(label, ul);
    }

    /* pearls: shown down to the reader's depth, with a count of the rest. */
    function pearlsSec(pearls, tier) {
        const all = Array.isArray(pearls) ? pearls : [];
        const shown = all.filter((p) => (Number(p.tier) || 1) <= tier);
        const more = all.length - shown.length;
        if (!shown.length && !more) return null;
        const sec = listSec('Pearls', shown, (p) => {
            const frag = document.createDocumentFragment();
            if (p.tier > 1) frag.append(el('span', 'ssb-tier-tag', 'T' + p.tier), ' ');
            frag.append(rich('span', 'ssb-text', p.text));
            return frag;
        }) || section('Pearls');
        if (more) sec.append(el('p', 'ssb-note', `${more} more at a higher depth.`));
        return sec;
    }

    /* ---- per-type bodies: each returns an array of sections (nulls are skipped) ---- */

    function classSec(e) {
        const p = el('p', 'ssb-text');
        p.append(ref(e.class), e.code ? ` · code ${e.code}` : '');
        return section('Classification', p);
    }

    const BODY = {
        structures(e, st) {
            return [
                textSec('What it is', e.what),
                textSec('Why it matters', e.why),
                linkSec('Part of', e.partOf),
                listSec('Relations', e.rel, (r) => {
                    const frag = document.createDocumentFragment();
                    frag.append(el('span', 'ssb-rel', words(r.r)), ' ', ref(r.to));
                    if (r.note) frag.append(' — ', rich('span', 'ssb-text', r.note));
                    return frag;
                }),
                textSec('On CT', e.ct),
                textSec('Endoscopically', e.endo),
                e.reliability ? section('Reliability as a landmark', el('p', 'ssb-text', e.reliability)) : null,
                pearlsSec(e.pearls, st.tier),
            ];
        },
        landmarks: (e) => [textSec('Where it is', e.locate), linkSec('Belongs to', e.of)],
        variants(e) {
            return [
                textSec('Definition', e.def),
                textSec('Why it matters', e.why),
                linkSec('Variant of', e.of),
                e.class ? classSec(e) : null,
                listSec('Prevalence', e.prev, (v) => {
                    const frag = document.createDocumentFragment();
                    const line = [`${v.value} ${v.unit}`, v.method, v.conf ? `confidence ${v.conf}` : null, v.n ? `n = ${v.n}` : null]
                        .filter(Boolean).join(' · ');
                    frag.append(el('strong', null, line));
                    if (v.population) frag.append(el('div', 'ssb-note', v.population));
                    if (v.note) frag.append(rich('div', 'ssb-note', v.note));
                    if (v.src) frag.append(el('div', 'ssb-note', 'Source: '), ref(v.src));
                    return frag;
                }),
            ];
        },
        classifications(e) {
            return [
                textSec('Basis', e.basis),
                linkSec('Classifies', e.of),
                listSec('Classes', e.classes, (c) => {
                    const frag = document.createDocumentFragment();
                    frag.append(el('span', 'ssb-code', String(c.code)), ' ', el('strong', null, String(c.label)));
                    if (c.criterion) frag.append(rich('div', 'ssb-text', c.criterion));
                    if (c.why) frag.append(rich('div', 'ssb-note', c.why));
                    return frag;
                }),
                textSec('Caveats', e.caveats),
            ];
        },
        measurements(e) {
            const v = e.value || {};
            const parts = [];
            if (v.mean !== undefined) parts.push(`mean ${v.mean}${v.sd !== undefined ? ` ± ${v.sd}` : ''}`);
            if (v.median !== undefined) parts.push(`median ${v.median}`);
            if (Array.isArray(v.range)) parts.push(`range ${v.range[0]}–${v.range[1]}`);
            const meta = [e.method, e.conf ? `confidence ${e.conf}` : null, e.n ? `n = ${e.n}` : null, e.population]
                .filter(Boolean).join(' · ');
            return [
                textSec('What it measures', e.what),
                section('Value', el('p', 'ssb-text', `${parts.join('; ')} ${e.unit}`.trim()), el('p', 'ssb-note', meta)),
                linkSec('From', e.from),
                linkSec('To', e.to),
                textSec('Note', e.note),
            ];
        },
        hazards(e) {
            return [
                linkSec('At risk', e.at),
                linkSec('During', e.during),
                textSec('Where and when', e.site),
                textSec('Mechanism', e.mechanism),
                textSec('Consequence', e.consequence),
                textSec('Prevent', e.prevent),
                textSec('Recognize', e.recognize),
                textSec('Rescue', e.rescue),
            ];
        },
        principles: (e) => [textSec('The rule', e.rule), textSec('Why', e.why), textSec('When it fails', e.caveat)],
        procedures(e) {
            return [
                listSec('Indications', e.indications, (t) => rich('span', 'ssb-text', t)),
                textSec('Corridor', e.corridor),
                listSec('Preoperative CT review', e.preop, (c) => {
                    const frag = document.createDocumentFragment();
                    frag.append(rich('strong', null, c.check));
                    if (c.why) frag.append(rich('div', 'ssb-note', c.why));
                    return frag;
                }),
                listSec('Steps', e.steps, (s) => {
                    const frag = document.createDocumentFragment();
                    frag.append(rich('div', 'ssb-text', s.do));
                    if (s.think) {
                        const d = el('div', 'ssb-step-line');
                        d.append(el('span', 'ssb-rel', 'think'), ' ', rich('span', 'ssb-text', s.think));
                        frag.append(d);
                    }
                    for (const [label, ids] of [['see', s.see], ['risk', s.risk], ['removes', s.removes], ['station', s.station ? [s.station] : []]]) {
                        if (!asList(ids).length) continue;
                        const d = el('div', 'ssb-step-line');
                        d.append(el('span', 'ssb-rel', label), ' ', refs(ids));
                        frag.append(d);
                    }
                    return frag;
                }, 'ssb-list ssb-steps'),
                listSec('Endpoints', asList(e.endpoints), (t) => rich('span', 'ssb-text', t)),
                listSec('Pitfalls', asList(e.pitfalls), (t) => rich('span', 'ssb-text', t)),
            ];
        },
        stations(e) {
            const scope = e.scope === null || e.scope === undefined ? 'overview' : `${e.scope}° scope`;
            return [
                section('View', el('p', 'ssb-text', `${e.side}, ${scope}`)),
                textSec('Where the scope is', e.where),
                linkSec('Shows', e.shows),
                textSec('Purpose', e.purpose),
            ];
        },
        pathways(e) {
            const p = el('p', 'ssb-text');
            [e.from, ...asList(e.via), e.to].forEach((id, i) => { if (i) p.append(' → '); p.append(ref(id)); });
            return [section(`Path (${e.kind})`, p), textSec('Note', e.note)];
        },
        conditions(e, st) {
            const img = e.imaging || {};
            return [
                textSec('What it is', e.what),
                textSec('What it changes at the table', e.why),
                linkSec('Involves', e.involves),
                textSec('CT', img.ct),
                textSec('MRI', img.mri),
                textSec('Endoscopically', e.endo),
                listSec('Red flags', asList(e.redFlags), (t) => rich('span', 'ssb-text', t)),
                linkSec('Staging and grading', e.class),
                linkSec('Complications', e.complications),
                linkSec('Managed by', e.managedBy),
                linkSec('Imaging mimics', e.mimics),
                pearlsSec(e.pearls, st.tier),
            ];
        },
        sources(e) {
            const anchors = sourceAnchors(e, 'ssb-text');
            return [
                section('Citation', el('p', 'ssb-text', e.cite), el('p', 'ssb-note', `${e.type} · ${checked(e)}`)),
                anchors ? section('Find it', anchors) : null,
            ];
        },
    };

    const checked = (s) => (s.verified ? 'citation checked against the record' : 'citation not yet checked');

    /* DOI / PMID / URL as anchors in one paragraph; every href is set as a
       property from a validated value, never concatenated into markup. */
    function sourceAnchors(s, cls) {
        const links = [];
        if (typeof s.doi === 'string' && /^10\.\d{4,9}\/\S+$/.test(s.doi)) links.push(['DOI', 'https://doi.org/' + s.doi]);
        if (s.pmid !== undefined && /^\d+$/.test(String(s.pmid))) links.push(['PubMed', 'https://pubmed.ncbi.nlm.nih.gov/' + s.pmid + '/']);
        if (typeof s.url === 'string' && /^https?:\/\//i.test(s.url) && !links.some(([, href]) => href === s.url)) links.push(['Link', s.url]);
        if (!links.length) return null;
        const p = el('p', cls);
        links.forEach(([label, href], i) => {
            if (i) p.append(' · ');
            const a = el('a', null, label);
            a.href = href;
            a.target = '_blank';
            a.rel = 'noopener';
            p.append(a);
        });
        return p;
    }

    /* Every entity that cites gets its sources listed. */
    function sourcesSec(e) {
        if (!Array.isArray(e.src) || !e.src.length) return null;
        return listSec('Sources', e.src, (id) => {
            const s = graph.get(id);
            const frag = document.createDocumentFragment();
            if (!s) { frag.append(String(id)); return frag; }
            frag.append(el('span', 'ssb-text', s.cite));
            frag.append(el('div', 'ssb-note', `${s.type} · ${checked(s)} · ${id}`));
            const anchors = sourceAnchors(s, 'ssb-note');
            if (anchors) frag.append(anchors);
            return frag;
        });
    }

    /* ---- header ---- */

    function head(e, type) {
        const header = el('header', 'ssb-entity-head');
        const extra = type === 'structures' ? [REGION_LABEL[e.region] || e.region, KIND_LABEL[e.kind] || e.kind]
            : type === 'conditions' ? [words(e.category || '')] : [];
        header.append(
            el('p', 'site-kicker', [TYPE_LABEL[type], ...extra].filter(Boolean).join(' · ')),
            el('h2', 'ssb-title', String(e.name || e.cite || e.id)),
        );
        const badges = el('p', 'ssb-badges');
        if (type !== 'sources') {
            const verified = e.review === 'verified';
            badges.append(
                el('span', verified ? 'ssb-badge ssb-badge-ok' : 'ssb-badge ssb-badge-draft', verified ? 'Verified' : 'Draft · unverified'),
                el('span', 'ssb-badge', 'Tier ' + (Number(e.tier) || 1)),
            );
            header.append(badges);
        }
        const aka = [];
        if (asList(e.syn).length) aka.push(['Also called', asList(e.syn).join(', ')]);
        if (e.eponym) aka.push(['Eponym', String(e.eponym)]);
        if (asList(e.deprecated).length) aka.push(['Superseded terms', asList(e.deprecated).join(', ')]);
        for (const [label, value] of aka) {
            const p = el('p', 'ssb-aka');
            p.append(el('span', 'ssb-rel', label), ' ' + value);
            header.append(p);
        }
        return header;
    }

    /* ---- render ---- */

    let shownId = null;

    function render() {
        const st = store.get();
        const id = st.selection;
        const keepScroll = id !== null && id === shownId;
        const scroll = body.scrollTop;
        body.textContent = '';
        shownId = id;

        if (!id) {
            body.append(el('p', 'ssb-empty', 'Select a structure in the list, or search. Links inside a description open the thing they name.'));
            title.textContent = 'Details';
            handle.setAttribute('aria-expanded', 'false');
            panel.dataset.sheet = 'closed';
            return;
        }
        const e = graph.get(id);
        const type = graph.typeOf(id);
        const art = el('article', 'ssb-entity');
        art.dataset.entity = id;
        art.append(head(e, type));
        for (const sec of [...(BODY[type] ? BODY[type](e, st) : []), type === 'sources' ? null : sourcesSec(e)]) {
            if (sec) art.append(sec);
        }
        body.append(art);
        body.scrollTop = keepScroll ? scroll : 0;
        title.textContent = String(e.name || e.cite || id);
    }

    body.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-ref]');
        if (b) store.select(b.dataset.ref, { source: 'panel' });
    });

    handle.addEventListener('click', () => {
        const open = panel.dataset.sheet !== 'open';
        panel.dataset.sheet = open ? 'open' : 'closed';
        handle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    store.subscribe((state, prev) => {
        render();
        if (state.selection !== prev.selection && state.selection) {
            panel.dataset.sheet = 'open';
            handle.setAttribute('aria-expanded', 'true');
            live.textContent = 'Selected: ' + graph.nameOf(state.selection);
        }
    });

    render();
    if (store.get().selection) {
        panel.dataset.sheet = 'open';
        handle.setAttribute('aria-expanded', 'true');
    }
}
