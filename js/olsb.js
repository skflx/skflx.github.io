/* =============================================================
   olsb.js — OLSB page: draws js/olsb-anatomy.js as layered inline SVG
   and walks the procedure steps over it.

   State: procedure, step, visible layers, TM state, viewport, see-through,
   all names, selection. A step sets everything but the selection; the
   layer and view controls override it until the next step. The hash
   (#p=<procedure>&s=<n>) is matched against the data, never rendered.
   Every string reaches the DOM through textContent. Guarded IIFE.
   ============================================================= */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var D = window.OLSB_DATA;
    var BASE_W = 760;   /* field viewport width (user units) */

    var st = {
        p: 0, s: 0,
        layers: {}, tm: 'intact', view: 'field',
        ghost: false, names: false, sel: null, custom: false
    };
    var els = {};       /* id -> { def, g, shape, label } */
    var svg, labelLayer;

    function $(id) { return document.getElementById(id); }
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function sv(tag, attrs) {
        var n = document.createElementNS(NS, tag);
        for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
        return n;
    }
    function layerName(id) {
        for (var i = 0; i < D.layers.length; i++) if (D.layers[i].id === id) return D.layers[i].name;
        return '';
    }
    function proc() { return D.procedures[st.p]; }
    function step() { return proc().steps[st.s]; }

    /* ---------- build the drawing once ---------- */
    function buildSvg() {
        svg = $('olsb-svg');
        var defs = D.structures.slice().sort(function (a, b) { return a.z - b.z; });
        var layerGroups = {};
        defs.forEach(function (def) {
            if (!layerGroups[def.layer]) layerGroups[def.layer] = null;
            var g = sv('g', { 'class': 's L-' + def.layer + (def.inert ? ' inert' : '') + (def.bg ? ' bg' : ''), 'data-id': def.id });
            var shape = sv('path', { d: def.d, 'class': 'k-' + def.kind + (def.line ? ' ln' : '') + (def.hair ? ' hair' : '') });
            if (def.evenodd) shape.setAttribute('fill-rule', 'evenodd');
            if (def.w) shape.setAttribute('stroke-width', def.w);
            g.appendChild(shape);
            if (!def.inert && def.name) {
                /* a wide invisible stroke so thin lines can be tapped */
                if (def.line) g.appendChild(sv('path', { d: def.d, 'class': 'hit' }));
                var t = sv('title', {});
                t.textContent = def.name;
                g.appendChild(t);
                g.setAttribute('tabindex', '-1');
                g.addEventListener('click', function (e) { e.stopPropagation(); select(def.id); });
            }
            svg.appendChild(g);
            els[def.id] = { def: def, g: g, shape: shape, label: null };
        });

        labelLayer = sv('g', { 'class': 'labels', 'aria-hidden': 'true' });
        svg.appendChild(labelLayer);
        D.structures.forEach(function (def) {
            if (def.inert || !def.name || !def.at) return;
            var lg = sv('g', { 'class': 'lbl' });
            var dot = sv('circle', { cx: def.at[0], cy: def.at[1], r: 3 });
            var txt = sv('text', {});
            txt.textContent = def.name;
            lg.appendChild(dot);
            lg.appendChild(txt);
            labelLayer.appendChild(lg);
            els[def.id].label = { g: lg, dot: dot, txt: txt };
        });
        svg.addEventListener('click', function () { select(null); });
    }

    /* ---------- apply state to the drawing ---------- */
    function visible(def) {
        if (def.layer === 'base') return true;
        if (!st.layers[def.layer]) return false;
        if (def.tm && def.tm.indexOf(st.tm) < 0) return false;
        if (def.needs) for (var i = 0; i < def.needs.length; i++) if (!st.layers[def.needs[i]]) return false;
        return true;
    }

    function render() {
        var s = step();
        var focus = {};
        (st.custom ? [] : s.focus || []).forEach(function (id) { focus[id] = true; });
        var hasFocus = Object.keys(focus).length > 0;

        var vb = D.views[st.view] || D.views.field;
        svg.setAttribute('viewBox', vb.join(' '));
        /* labels hold a constant on-screen size: user units per CSS pixel */
        var px = svg.getBoundingClientRect().width || BASE_W;
        var k = vb[2] / Math.max(px, 1) * Math.max(0.8, Math.min(1, px / BASE_W + 0.25));
        svg.classList.toggle('is-ghost', st.ghost);
        svg.classList.toggle('has-focus', hasFocus);

        Object.keys(els).forEach(function (id) {
            var e = els[id], def = e.def;
            var vis = visible(def);
            e.g.style.display = vis ? '' : 'none';
            var d = def.d;
            if (def.dDrilled && st.layers.mastoid) d = def.dDrilled;
            if (def.dByTm && def.dByTm[st.tm]) d = def.dByTm[st.tm];
            if (e.shape.getAttribute('d') !== d) e.shape.setAttribute('d', d);
            e.g.classList.toggle('is-focus', !!focus[id]);
            e.g.classList.toggle('is-sel', st.sel === id);

            if (!e.label) return;
            var show = vis && (st.names || focus[id] || st.sel === id);
            e.label.g.style.display = show ? '' : 'none';
            if (!show) return;
            var x = def.at[0], y = def.at[1], off = 7 * k, fs = 11.5 * k;
            e.label.dot.setAttribute('r', (focus[id] || st.sel === id ? 3.4 : 2.4) * k);
            e.label.txt.setAttribute('font-size', fs);
            e.label.txt.setAttribute('stroke-width', 3.2 * k);
            var tx = x, ty = y, anchor = 'start', base = 'middle';
            if (def.lab === 'l') { tx = x - off; anchor = 'end'; }
            else if (def.lab === 't') { ty = y - off; anchor = 'middle'; base = 'auto'; }
            else if (def.lab === 'b') { ty = y + off + fs * 0.75; anchor = 'middle'; base = 'auto'; }
            else { tx = x + off; }
            e.label.txt.setAttribute('x', tx);
            e.label.txt.setAttribute('y', ty);
            e.label.txt.setAttribute('text-anchor', anchor);
            e.label.txt.setAttribute('dominant-baseline', base);
            e.label.g.classList.toggle('is-strong', !!focus[id] || st.sel === id);
        });

        renderControls();
        renderStep();
        renderInView();
        renderInfo();
    }

    /* ---------- side panel ---------- */
    function renderTabs() {
        var box = $('olsb-procs');
        box.textContent = '';
        D.procedures.forEach(function (p, i) {
            var b = el('button', 'site-pill' + (i === st.p ? ' active' : ''), p.name);
            b.type = 'button';
            b.setAttribute('aria-pressed', i === st.p ? 'true' : 'false');
            b.addEventListener('click', function () { goStep(i, 0); });
            box.appendChild(b);
        });
    }

    function renderStep() {
        var p = proc(), s = step();
        $('olsb-proc-sub').textContent = p.sub;
        $('olsb-step-n').textContent = 'Step ' + (st.s + 1) + ' of ' + p.steps.length + (st.custom ? ' · custom view' : '');
        $('olsb-step-title').textContent = s.title;
        $('olsb-step-act').textContent = s.act;
        $('olsb-step-hazard').textContent = s.hazard;
        $('olsb-prev').disabled = st.s === 0;
        $('olsb-next').disabled = st.s === p.steps.length - 1;

        var list = $('olsb-steps');
        list.textContent = '';
        p.steps.forEach(function (x, i) {
            var li = el('li');
            var b = el('button', 'olsb-steplink', x.title);
            b.type = 'button';
            if (i === st.s) b.setAttribute('aria-current', 'step');
            b.addEventListener('click', function () { goStep(st.p, i); });
            li.appendChild(b);
            list.appendChild(li);
        });
    }

    function renderControls() {
        D.layers.forEach(function (L) {
            var c = $('olsb-layer-' + L.id);
            if (c) c.checked = !!st.layers[L.id];
        });
        $('olsb-ghost').checked = st.ghost;
        $('olsb-names').checked = st.names;
        var vbtns = document.querySelectorAll('[data-view]');
        for (var i = 0; i < vbtns.length; i++) {
            var on = vbtns[i].getAttribute('data-view') === st.view;
            vbtns[i].classList.toggle('active', on);
            vbtns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        var tbtns = document.querySelectorAll('[data-tm]');
        for (var j = 0; j < tbtns.length; j++) {
            var ton = tbtns[j].getAttribute('data-tm') === st.tm;
            tbtns[j].classList.toggle('active', ton);
            tbtns[j].setAttribute('aria-pressed', ton ? 'true' : 'false');
        }
    }

    function renderInView() {
        var box = $('olsb-inview');
        box.textContent = '';
        D.layers.forEach(function (L) {
            if (!st.layers[L.id]) return;
            var items = D.structures.filter(function (d) { return d.layer === L.id && !d.inert && d.name && visible(d); });
            if (!items.length) return;
            var grp = el('div', 'olsb-inview-grp');
            grp.appendChild(el('p', 'site-kicker', L.name));
            items.forEach(function (d) {
                var b = el('button', 'olsb-chip' + (st.sel === d.id ? ' active' : ''), d.name);
                b.type = 'button';
                b.addEventListener('click', function () { select(st.sel === d.id ? null : d.id); });
                grp.appendChild(b);
            });
            box.appendChild(grp);
        });
    }

    function renderInfo() {
        var box = $('olsb-info');
        var e = st.sel && els[st.sel];
        box.hidden = !e;
        if (!e) return;
        $('olsb-info-layer').textContent = layerName(e.def.layer);
        $('olsb-info-name').textContent = e.def.name;
        $('olsb-info-note').textContent = e.def.note || '';
    }

    /* ---------- actions ---------- */
    function applyStep() {
        var s = step();
        st.layers = {};
        (s.layers || []).forEach(function (id) { st.layers[id] = true; });
        st.tm = s.tm || 'intact';
        st.view = s.view || 'field';
        st.ghost = !!s.ghost;
        st.custom = false;
        if (st.sel && !visible(els[st.sel].def)) st.sel = null;
    }

    function goStep(p, s) {
        var tabsChanged = p !== st.p;
        st.p = p; st.s = s;
        applyStep();
        if (tabsChanged) renderTabs();
        writeHash();
        render();
    }

    function select(id) {
        st.sel = id && els[id] ? id : null;
        render();
    }

    function writeHash() {
        try { history.replaceState(null, '', '#p=' + proc().id + '&s=' + (st.s + 1)); } catch (e) { /* no-op */ }
    }

    function readHash() {
        var h = '';
        try { h = location.hash.slice(1); } catch (e) { return; }
        var m = /(?:^|&)p=([a-z-]+)/.exec(h), n = /(?:^|&)s=(\d{1,2})(?:&|$)/.exec(h);
        if (!m) return;
        for (var i = 0; i < D.procedures.length; i++) {
            if (D.procedures[i].id !== m[1]) continue;
            st.p = i;
            var s = n ? parseInt(n[1], 10) - 1 : 0;
            st.s = s >= 0 && s < D.procedures[i].steps.length ? s : 0;
            return;
        }
    }

    function wireControls() {
        var box = $('olsb-layers');
        D.layers.forEach(function (L) {
            var lab = el('label', 'olsb-toggle');
            var c = el('input');
            c.type = 'checkbox';
            c.id = 'olsb-layer-' + L.id;
            c.addEventListener('change', function () {
                st.layers[L.id] = c.checked;
                st.custom = true;
                if (st.sel && !visible(els[st.sel].def)) st.sel = null;
                render();
            });
            lab.appendChild(c);
            lab.appendChild(el('span', 'olsb-swatch L-' + L.id));
            lab.appendChild(el('span', null, L.name));
            lab.title = L.desc;
            box.appendChild(lab);
        });
        $('olsb-ghost').addEventListener('change', function (e) { st.ghost = e.target.checked; st.custom = true; render(); });
        $('olsb-names').addEventListener('change', function (e) { st.names = e.target.checked; render(); });
        var vbtns = document.querySelectorAll('[data-view]');
        for (var i = 0; i < vbtns.length; i++) {
            vbtns[i].addEventListener('click', function (e) {
                var v = e.currentTarget.getAttribute('data-view');
                if (D.views[v]) { st.view = v; render(); }
            });
        }
        var tbtns = document.querySelectorAll('[data-tm]');
        for (var j = 0; j < tbtns.length; j++) {
            tbtns[j].addEventListener('click', function (e) {
                var t = e.currentTarget.getAttribute('data-tm');
                if (D.tmStates.indexOf(t) >= 0) { st.tm = t; st.custom = true; render(); }
            });
        }
        $('olsb-prev').addEventListener('click', function () { if (st.s > 0) goStep(st.p, st.s - 1); });
        $('olsb-next').addEventListener('click', function () { if (st.s < proc().steps.length - 1) goStep(st.p, st.s + 1); });
        $('olsb-info-close').addEventListener('click', function () { select(null); });
        $('olsb-reset').addEventListener('click', function () { goStep(st.p, st.s); });
        document.addEventListener('keydown', function (e) {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            var t = e.target && e.target.tagName;
            if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
            if (e.key === 'ArrowRight' && st.s < proc().steps.length - 1) { goStep(st.p, st.s + 1); e.preventDefault(); }
            else if (e.key === 'ArrowLeft' && st.s > 0) { goStep(st.p, st.s - 1); e.preventDefault(); }
            else if (e.key === 'Escape' && st.sel) { select(null); }
        });
    }

    function boot() {
        if (!D || !D.structures || !$('olsb-svg')) return;
        try {
            buildSvg();
            wireControls();
            readHash();
            applyStep();
            renderTabs();
            render();
            document.documentElement.setAttribute('data-olsb', 'ready');
            var rt = null;
            window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 120); });
        } catch (e) {
            var p = $('olsb-problem');
            if (p) { p.hidden = false; p.textContent = 'The diagram failed to draw: ' + (e && e.message ? e.message : 'unknown error'); }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
