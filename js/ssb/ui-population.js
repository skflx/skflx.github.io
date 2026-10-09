/* =============================================================
   ui-population.js — the "Population (NasalSeg)" section in the Specimen
   dock (WP POP2a, docs/ssb.md 5.10): what 88 clear adults look like for the
   structures NasalSeg labels, and where the standard specimen and the
   as-scanned head sit among them.

   Every figure comes from population.js, i.e. from the data file; this
   module only formats. A missing or malformed file leaves the section
   hidden (no error). Text reaches the DOM through textContent only. The
   section is a <details>: closed until asked for, opened by selecting one
   of the structures it covers.
   ============================================================= */
import { loadPopulation, FIVE } from './population.js?v=42f220b7';

const SVG = 'http://www.w3.org/2000/svg';
const MINUS = '−';

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

export const mm2 = (v) => String(Math.round(v));
export const ml = (v) => v.toFixed(1);
export const pct = (v) => String(Math.round(v));
export const ratio = (v) => v.toFixed(2);
const signed = (v) => (v < 0 ? MINUS : '') + Math.abs(v).toFixed(1);
const range = (b, f) => `${f(b.p25)}–${f(b.p75)}`;

/* ---- the chart ---- */
const W = 260;
const H = 132;
const PAD = { l: 34, r: 8, t: 8, b: 28 };

export function buildChart(model) {
    const { x, more, less, standard } = model.profile;
    const top = Math.max(...more.p75, ...less.p75, ...standard);
    const ymax = Math.ceil(top / 50) * 50;
    const px = (f) => PAD.l + ((f - x[0]) / (x[x.length - 1] - x[0])) * (W - PAD.l - PAD.r);
    const py = (v) => H - PAD.b - (v / ymax) * (H - PAD.t - PAD.b);
    const line = (a) => a.map((v, i) => `${px(x[i]).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
    const band = (s) => `${line(s.p75)} ${[...s.p25].map((v, i) => `${px(x[i]).toFixed(1)},${py(v).toFixed(1)}`).reverse().join(' ')}`;

    const root = svg('svg', { class: 'ssb-pop-chart', viewBox: `0 0 ${W} ${H}`, role: 'img', focusable: 'false' });
    root.setAttribute('aria-label', 'Cross-section along the nasal cavity');
    const title = svg('title');
    title.textContent = `Median cross-section along the nasal cavity, ${model.n} clear adults`;
    root.append(title);

    for (let v = 0; v <= ymax; v += 50) {
        root.append(svg('line', { class: 'ssb-pop-grid', x1: PAD.l, x2: W - PAD.r, y1: py(v), y2: py(v) }));
        const t = svg('text', { class: 'ssb-pop-tick', x: PAD.l - 4, y: py(v), 'text-anchor': 'end', 'dominant-baseline': 'central' });
        t.textContent = String(v);
        root.append(t);
    }
    for (const f of [x[0], (x[0] + x[x.length - 1]) / 2, x[x.length - 1]]) {
        const t = svg('text', { class: 'ssb-pop-tick', x: px(f), y: H - PAD.b + 11, 'text-anchor': 'middle' });
        t.textContent = f.toFixed(1);
        root.append(t);
    }
    const xl = svg('text', { class: 'ssb-pop-axis', x: (PAD.l + W - PAD.r) / 2, y: H - 3, 'text-anchor': 'middle' });
    xl.textContent = 'fraction of cavity length (front to back)';
    const yl = svg('text', { class: 'ssb-pop-axis', transform: `translate(8 ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`, 'text-anchor': 'middle' });
    yl.textContent = 'cross-section (mm²)';
    root.append(xl, yl);

    root.append(svg('polygon', { class: 'ssb-pop-band ssb-pop-band-less', points: band(less) }));
    root.append(svg('polygon', { class: 'ssb-pop-band ssb-pop-band-more', points: band(more) }));
    const lessLine = svg('polyline', { class: 'ssb-pop-line ssb-pop-less', points: line(less.median) });
    const moreLine = svg('polyline', { class: 'ssb-pop-line ssb-pop-more', points: line(more.median) });
    const stdLine = svg('polyline', { class: 'ssb-pop-line ssb-pop-std', points: line(standard) });
    root.append(lessLine, moreLine, stdLine);
    for (let i = 0; i < x.length; i++) root.append(svg('circle', { class: 'ssb-pop-pt', cx: px(x[i]), cy: py(standard[i]), r: 1.8 }));
    return root;
}

/* The chart's text alternative: its medians, one row per fraction. */
export function chartAlt(model) {
    const { x, more, less, standard } = model.profile;
    return x.map((f, i) => `At ${f.toFixed(1)} of the length: less congested side median ${mm2(less.median[i])} mm², more congested side ${mm2(more.median[i])} mm², standard specimen ${mm2(standard[i])} mm².`).join(' ');
}

/* ---- the section ---- */

/* body: the Specimen dock's body. Returns { ready } resolving to true when the section was built. */
export function mountPopulation({ body, store, fetchFn, specimen = null }) {
    const root = el('details', 'ssb-pop');
    root.id = 'ssb-pop';
    root.hidden = true;
    body.append(root);

    return loadPopulation(fetchFn).then((model) => {
        if (!model) return false;      /* no file, or not the shape: no section, no message */
        const sum = el('summary', 'site-kicker ssb-lab-kicker', 'Population (NasalSeg)');
        const content = el('div', 'ssb-pop-body');
        root.append(sum, content);

        const conv = el('p', 'ssb-param-src', `CT, ${model.n} clear adults, air below ${MINUS}${Math.abs(Math.round(model.thresholdHu))} HU, 10–90 % of the cavity length. One scanner, one centre; “clear” rests on two slices per sinus.`);
        conv.dataset.pop = 'convention';

        const cav = el('div', 'ssb-pop-block');
        cav.dataset.pop = 'cavity';
        const c = model.cavity;
        cav.append(el('h3', 'ssb-pop-h', 'Nasal cavity'));
        const cavRows = [
            ['Mean cross-section, both sides', `${mm2(c.twoSide.p50)} mm² (IQR ${range(c.twoSide, mm2)})`],
            ['Standard specimen, section', `${mm2(c.standard.twoSide)} mm², percentile ${pct(c.standard.twoSidePct)}`],
            ['As-scanned head, section', `${mm2(c.asScanned.twoSide)} mm², percentile ${pct(c.asScanned.twoSidePct)}`],
            ['Smaller / larger side', `${ratio(c.ratio.p50)} (IQR ${range(c.ratio, ratio)})`],
            ['Standard specimen, ratio', `${ratio(c.standard.ratio)}, percentile ${pct(c.standard.ratioPct)} (one side mirrored, so symmetric by construction)`],
            ['As-scanned head, ratio', `${ratio(c.asScanned.ratio)}, percentile ${pct(c.asScanned.ratioPct)}`],
        ];
        const dl = el('dl', 'ssb-pop-dl');
        for (const [k, v] of cavRows) { dl.append(el('dt', null, k), el('dd', null, v)); }
        const chart = buildChart(model);
        const key = el('ul', 'ssb-pop-key');
        for (const [cls, text] of [['ssb-pop-less', 'Less congested side, median and IQR'], ['ssb-pop-more', 'More congested side'], ['ssb-pop-std', 'Standard specimen']]) {
            const li = el('li', null, text);
            li.dataset.swatch = cls;
            key.append(li);
        }
        const alt = el('p', 'ssb-pop-alt visually-hidden', chartAlt(model));
        alt.id = 'ssb-pop-alt';
        chart.setAttribute('aria-describedby', alt.id);
        cav.append(dl, chart, key, alt);

        const mx = el('div', 'ssb-pop-block');
        mx.dataset.pop = 'maxillary';
        const m = model.maxillary;
        mx.append(el('h3', 'ssb-pop-h', 'Maxillary sinus'));
        const mxl = el('dl', 'ssb-pop-dl');
        for (const [k, v] of [
            ['Volume, right', `${ml(m.R.p50)} mL (IQR ${range(m.R, ml)})`],
            ['Volume, left', `${ml(m.L.p50)} mL (IQR ${range(m.L, ml)})`],
            ['As-scanned head', `right ${ml(m.head.R)} mL, left ${ml(m.head.L)} mL`],
            ['Asymmetry index (R−L)', `${signed(m.head.ai)} %, |AI| at percentile ${pct(m.head.aiPct)}`],
        ]) mxl.append(el('dt', null, k), el('dd', null, v));
        mx.append(mxl);

        /* The population sinus (POP2b): offered only when the file carries its numbers and the specimen can load the pack. */
        const ms = model.meanShape;
        if (ms && specimen && specimen.hasPopulation) {
            const row = el('label', 'ssb-ct-check');
            const box = el('input');
            box.type = 'checkbox';
            box.id = 'ssb-pop-ghost';
            row.append(box, el('span', null, `Show the population sinus (NasalSeg, majority of ${ms.n} aligned CTs)`));
            const cap = el('p', 'ssb-param-src', `An aligned majority, not any one person’s sinus: the region at least half of the ${ms.n} aligned clear scans’ sinuses occupy (rigid fit on four label centroids, median residual ${ms.rmsMedianMm.toFixed(1)} mm). Volume right ${ml(ms.R.majorityMl)} mL, left ${ml(ms.L.majorityMl)} mL, beside the medians at our air threshold, ${ml(ms.R.medianMl)} and ${ml(ms.L.medianMl)} mL (the volumes above are as NasalSeg labelled them). A majority keeps only what most sinuses share, so it is smaller than the median sinus.`);
            cap.dataset.pop = 'ghost-caption';
            mx.append(row, cap);
            box.addEventListener('change', () => { specimen.setPopulation(box.checked); });
            if (typeof specimen.onChange === 'function') specimen.onChange(() => { box.checked = specimen.populationOn; });
        }

        const np = el('div', 'ssb-pop-block');
        np.dataset.pop = 'nasopharynx';
        np.append(el('h3', 'ssb-pop-h', 'Nasopharynx'));
        np.append(el('p', 'ssb-param-src', Number.isInteger(model.nasopharynx.truncated) && Number.isInteger(model.nasopharynx.unique)
            ? `Not measured: the archive’s crop cuts it in ${model.nasopharynx.truncated} of ${model.nasopharynx.unique} distinct scans.`
            : 'Not measured: the archive’s crop cuts it in most scans.'));

        content.append(conv, cav, mx, np);

        const blocks = { 's.nasal-cavity': cav, 's.maxillary-sinus': mx, 's.nasopharynx': np };
        const show = (id) => {
            for (const [k, node] of Object.entries(blocks)) node.hidden = !!id && k !== id;
        };
        const sync = (opened) => {
            const sel = store.get().selection;
            const hit = FIVE.includes(sel) ? sel : null;
            show(hit);
            if (hit && opened) root.open = true;
        };
        sync(true);
        store.subscribe((state, prev) => { if (state.selection !== prev.selection) sync(true); });
        root.hidden = false;
        return true;
    }).catch(() => false);
}
