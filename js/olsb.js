/* =============================================================
   olsb.js — OLSB page: draws the dioramas registered in window.OLSB
   (js/olsb-glossary.js, then one js/olsb-<diorama>.js each) as layered
   inline SVG, walks their tours, and answers "what is next to this?".

   State: diorama, tour, step, visible layers, TM state, viewport,
   see-through, all names, selection, quiz. A step sets everything but the
   selection; the controls override it until the next step. Selecting a
   structure lights its neighbours (glossary `rel`, plus every reverse) and
   lists where else it is drawn. The hash (#d=&p=&s=) is matched against
   the data, never rendered. Strings reach the DOM through textContent.
   ============================================================= */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var O = window.OLSB;
    var BASE_W = 760;
    var DIRS = { sup: 'Superior', inf: 'Inferior', ant: 'Anterior', post: 'Posterior', med: 'Medial', lat: 'Lateral' };
    var OPP = { sup: 'inf', inf: 'sup', ant: 'post', post: 'ant', med: 'lat', lat: 'med' };

    var st = {
        d: 0, p: 0, s: 0,
        layers: {}, tm: 'intact', view: null,
        ghost: false, names: false, sel: null, custom: false,
        quiz: null      /* { target, right, asked, flash: {id, ok}, reveal } */
    };
    var els = {};
    var svg, labelLayer, quizTimer = null;
    var REL = {};

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
    function dio() { return O.dioramas[st.d]; }
    function tour() { return dio().tours[st.p]; }
    function step() { return tour().steps[st.s]; }
    function gl(id) { return O.glossary[id] || {}; }
    function nameOf(id) { return gl(id).name || id; }
    function labelOf(def) { return def.label || nameOf(def.id); }
    function layerName(id) {
        var L = dio().layers;
        for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i].name;
        return '';
    }
    function viewBox(id) {
        var V = dio().views;
        for (var i = 0; i < V.length; i++) if (V[i].id === id) return V[i].box;
        return V[0].box;
    }
    function dioramasWith(id) {
        var out = [];
        O.dioramas.forEach(function (d, i) {
            for (var j = 0; j < d.structures.length; j++) {
                var s = d.structures[j];
                if (s.id === id && !s.inert) { out.push(i); return; }
            }
        });
        return out;
    }

    /* Every relation and its reverse, deduplicated. */
    function buildRelations() {
        function add(a, dir, b) {
            if (a === b) return;
            REL[a] = REL[a] || {};
            REL[a][dir] = REL[a][dir] || [];
            if (REL[a][dir].indexOf(b) < 0) REL[a][dir].push(b);
        }
        Object.keys(O.glossary).forEach(function (id) {
            var r = O.glossary[id].rel || {};
            Object.keys(r).forEach(function (dir) {
                if (!OPP[dir]) return;
                r[dir].forEach(function (other) {
                    if (!O.glossary[other]) return;
                    add(id, dir, other);
                    add(other, OPP[dir], id);
                });
            });
        });
    }

    /* ---------- build one diorama's drawing ---------- */
    function buildSvg() {
        svg.textContent = '';
        els = {};
        var defs = sv('defs', {});
        var mk = sv('marker', { id: 'olsb-arrow', viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
        mk.appendChild(sv('path', { d: 'M 0 0 L 10 5 L 0 10 Z', 'class': 'arrowhead' }));
        defs.appendChild(mk);
        svg.appendChild(defs);

        dio().structures.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (def) {
            var g = sv('g', { 'class': 's L-' + def.layer + (def.inert ? ' inert' : '') + (def.bg ? ' bg' : ''), 'data-id': def.id });
            var shape = sv('path', { d: def.d, 'class': 'k-' + def.kind + (def.line ? ' ln' : '') + (def.hair ? ' hair' : '') });
            if (def.evenodd) shape.setAttribute('fill-rule', 'evenodd');
            if (def.w) shape.setAttribute('stroke-width', def.w);
            if (def.arrow) shape.setAttribute('marker-end', 'url(#olsb-arrow)');
            g.appendChild(shape);
            if (!def.inert) {
                if (def.line) g.appendChild(sv('path', { d: def.d, 'class': 'hit' }));
                var t = sv('title', {});
                t.textContent = nameOf(def.id);
                g.appendChild(t);
                g.addEventListener('click', function (e) { e.stopPropagation(); pick(def.id); });
            }
            svg.appendChild(g);
            els[def.id] = { def: def, g: g, shape: shape, label: null };
        });

        labelLayer = sv('g', { 'class': 'labels', 'aria-hidden': 'true' });
        svg.appendChild(labelLayer);
        dio().structures.forEach(function (def) {
            if (def.inert || !def.at) return;
            var lg = sv('g', { 'class': 'lbl' });
            var dot = sv('circle', { cx: def.at[0], cy: def.at[1], r: 3 });
            var txt = sv('text', {});
            lg.appendChild(dot);
            lg.appendChild(txt);
            labelLayer.appendChild(lg);
            els[def.id].label = { g: lg, dot: dot, txt: txt };
        });
        var b = dio().views[0].box;
        svg.style.aspectRatio = b[2] + ' / ' + b[3];
        $('olsb-orient').textContent = dio().orient;
        svg.setAttribute('aria-label', dio().name + ': ' + dio().sub);
    }

    /* ---------- apply state to the drawing ---------- */
    function visible(def) {
        if (def.layer === 'base') return true;
        if (!st.layers[def.layer]) return false;
        if (def.tm && def.tm.indexOf(st.tm) < 0) return false;
        if (def.needs) for (var i = 0; i < def.needs.length; i++) if (!st.layers[def.needs[i]]) return false;
        return true;
    }

    function relatedTo(id) {
        var out = {};
        var r = REL[id] || {};
        Object.keys(r).forEach(function (dir) { r[dir].forEach(function (o) { if (!out[o]) out[o] = dir; }); });
        return out;
    }

    function render() {
        var s = step(), q = st.quiz;
        var focus = {};
        (st.custom || q ? [] : s.focus || []).forEach(function (id) { focus[id] = true; });
        var hasFocus = Object.keys(focus).length > 0;
        var rel = st.sel && !q ? relatedTo(st.sel) : {};
        var hasRel = Object.keys(rel).length > 0;

        var vb = viewBox(st.view);
        svg.setAttribute('viewBox', vb.join(' '));
        var px = svg.getBoundingClientRect().width || BASE_W;
        /* labels keep a near-constant on-screen size: user units per CSS pixel */
        var k = vb[2] / Math.max(px, 1) * Math.max(0.8, Math.min(1, px / BASE_W + 0.25));
        svg.classList.toggle('is-ghost', st.ghost);
        svg.classList.toggle('has-focus', hasFocus || hasRel);

        Object.keys(els).forEach(function (id) {
            var e = els[id], def = e.def;
            var vis = visible(def);
            e.g.style.display = vis ? '' : 'none';
            var d = def.d;
            if (def.dDrilled && st.layers.mastoid) d = def.dDrilled;
            if (def.dByTm && def.dByTm[st.tm]) d = def.dByTm[st.tm];
            if (e.shape.getAttribute('d') !== d) e.shape.setAttribute('d', d);
            var isSel = st.sel === id && !q;
            var lit = hasRel ? (isSel || !!rel[id]) : !!focus[id];
            e.g.classList.toggle('is-focus', lit);
            e.g.classList.toggle('is-sel', isSel);
            e.g.classList.toggle('is-rel', !!rel[id]);
            e.g.classList.toggle('q-ok', !!(q && q.flash && q.flash.id === id && q.flash.ok));
            e.g.classList.toggle('q-bad', !!(q && q.flash && q.flash.id === id && !q.flash.ok));
            e.g.classList.toggle('q-target', !!(q && q.reveal && q.target === id));

            if (!e.label) return;
            var show;
            if (q) show = vis && (q.reveal && q.target === id || (q.flash && q.flash.id === id));
            else show = vis && (st.names || isSel || (hasRel ? !!rel[id] : !!focus[id]));
            e.label.g.style.display = show ? '' : 'none';
            if (!show) return;
            var text = labelOf(def);
            if (!q && rel[id]) text += ' · ' + DIRS[rel[id]].toLowerCase();
            if (e.label.txt.textContent !== text) e.label.txt.textContent = text;
            var x = def.at[0], y = def.at[1], off = 7 * k, fs = 11.5 * k;
            e.label.dot.setAttribute('r', (lit ? 3.4 : 2.4) * k);
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
            e.label.g.classList.toggle('is-strong', lit);
        });

        renderControls();
        renderStep();
        renderQuiz();
        renderInView();
        renderInfo();
    }

    /* ---------- side panel and controls ---------- */
    function pills(box, items, current, onPick) {
        box.textContent = '';
        items.forEach(function (it, i) {
            var b = el('button', 'site-pill' + (i === current ? ' active' : ''), it);
            b.type = 'button';
            b.setAttribute('aria-pressed', i === current ? 'true' : 'false');
            b.addEventListener('click', function () { onPick(i); });
            box.appendChild(b);
        });
    }

    function renderTabs() {
        pills($('olsb-dioramas'), O.dioramas.map(function (d) { return d.short; }), st.d, function (i) { goDiorama(i); });
        $('olsb-dio-sub').textContent = dio().sub;
        pills($('olsb-procs'), dio().tours.map(function (t) { return t.name; }), st.p, function (i) { goStep(i, 0); });
    }

    function renderStep() {
        var t = tour(), s = step(), terms = t.terms || ['Do', 'Note'];
        $('olsb-proc-sub').textContent = t.sub;
        $('olsb-step-n').textContent = 'Step ' + (st.s + 1) + ' of ' + t.steps.length + (st.custom ? ' · custom view' : '');
        $('olsb-step-title').textContent = s.title;
        $('olsb-term-a').textContent = terms[0];
        $('olsb-term-b').textContent = terms[1];
        $('olsb-step-act').textContent = s.act;
        $('olsb-step-hazard').textContent = s.hazard;
        $('olsb-prev').disabled = st.s === 0;
        $('olsb-next').disabled = st.s === t.steps.length - 1;

        var list = $('olsb-steps');
        list.textContent = '';
        t.steps.forEach(function (x, i) {
            var li = el('li');
            var b = el('button', 'olsb-steplink', x.title);
            b.type = 'button';
            if (i === st.s) b.setAttribute('aria-current', 'step');
            b.addEventListener('click', function () { goStep(st.p, i); });
            li.appendChild(b);
            list.appendChild(li);
        });
    }

    function buildControls() {
        var box = $('olsb-layers');
        while (box.children.length > 1) box.removeChild(box.lastChild);
        dio().layers.forEach(function (L) {
            var lab = el('label', 'olsb-toggle');
            var c = el('input');
            c.type = 'checkbox';
            c.id = 'olsb-layer-' + L.id;
            c.addEventListener('change', function () {
                st.layers[L.id] = c.checked;
                st.custom = true;
                if (st.sel && els[st.sel] && !visible(els[st.sel].def)) st.sel = null;
                if (st.quiz) nextQuestion();
                render();
            });
            lab.appendChild(c);
            var first = dio().structures.filter(function (x) { return x.layer === L.id && !x.inert; })[0];
            lab.appendChild(el('span', 'olsb-swatch sw-' + (L.sw || (first ? first.kind : 'none'))));
            lab.appendChild(el('span', null, L.name));
            lab.title = L.desc;
            box.appendChild(lab);
        });
        var vbox = $('olsb-views');
        vbox.textContent = '';
        dio().views.forEach(function (v) {
            var b = el('button', 'site-pill', v.name);
            b.type = 'button';
            b.setAttribute('data-view', v.id);
            b.addEventListener('click', function () { st.view = v.id; render(); });
            vbox.appendChild(b);
        });
        vbox.hidden = dio().views.length < 2;
        $('olsb-tm-row').hidden = !dio().tmStates;
    }

    function renderControls() {
        dio().layers.forEach(function (L) {
            var c = $('olsb-layer-' + L.id);
            if (c) c.checked = !!st.layers[L.id];
        });
        $('olsb-ghost').checked = st.ghost;
        $('olsb-names').checked = st.names;
        var on = function (sel, attr, val) {
            var b = document.querySelectorAll(sel);
            for (var i = 0; i < b.length; i++) {
                var a = b[i].getAttribute(attr) === val;
                b[i].classList.toggle('active', a);
                b[i].setAttribute('aria-pressed', a ? 'true' : 'false');
            }
        };
        on('[data-view]', 'data-view', st.view);
        on('[data-tm]', 'data-tm', st.tm);
        var qb = $('olsb-quiz-toggle');
        qb.classList.toggle('active', !!st.quiz);
        qb.setAttribute('aria-pressed', st.quiz ? 'true' : 'false');
    }

    function renderInView() {
        var box = $('olsb-inview');
        box.textContent = '';
        dio().layers.forEach(function (L) {
            if (!st.layers[L.id]) return;
            var items = dio().structures.filter(function (d) { return d.layer === L.id && !d.inert && visible(d); });
            if (!items.length) return;
            var grp = el('div', 'olsb-inview-grp');
            grp.appendChild(el('p', 'site-kicker', L.name));
            items.forEach(function (d) {
                var b = el('button', 'olsb-chip' + (st.sel === d.id ? ' active' : ''), nameOf(d.id));
                b.type = 'button';
                b.addEventListener('click', function () { pick(st.sel === d.id ? null : d.id); });
                grp.appendChild(b);
            });
            box.appendChild(grp);
        });
        $('olsb-inview-wrap').hidden = !!st.quiz;
    }

    function chip(id, extra, onClick) {
        var b = el('button', 'olsb-chip', nameOf(id) + (extra || ''));
        b.type = 'button';
        b.addEventListener('click', onClick);
        return b;
    }

    function renderInfo() {
        var box = $('olsb-info');
        var e = st.sel && els[st.sel];
        box.hidden = !e || !!st.quiz;
        if (box.hidden) return;
        var id = st.sel;
        var ln = layerName(e.def.layer);
        $('olsb-info-layer').textContent = dio().short + (ln && ln !== dio().short ? ' \u00b7 ' + ln : '');
        $('olsb-info-name').textContent = nameOf(id);
        $('olsb-info-note').textContent = gl(id).note || '';

        var relBox = $('olsb-info-rel');
        relBox.textContent = '';
        var r = REL[id] || {};
        ['sup', 'inf', 'ant', 'post', 'lat', 'med'].forEach(function (dir) {
            if (!r[dir]) return;
            var row = el('div', 'olsb-rel-row');
            row.appendChild(el('span', 'olsb-rel-dir', DIRS[dir]));
            var list = el('span', 'olsb-rel-list');
            r[dir].forEach(function (o) {
                var here = !!els[o] && !els[o].def.inert;
                var where = dioramasWith(o);
                var extra = here ? '' : (where.length ? ' → ' + O.dioramas[where[0]].short : '');
                var b = chip(o, extra, function () { jumpTo(o); });
                if (!here && !where.length) b.disabled = true;
                if (here && !visible(els[o].def)) b.classList.add('is-hidden');
                list.appendChild(b);
            });
            row.appendChild(list);
            relBox.appendChild(row);
        });
        $('olsb-info-rel-wrap').hidden = !relBox.children.length;

        var also = $('olsb-info-also');
        also.textContent = '';
        dioramasWith(id).forEach(function (i) {
            if (i === st.d) return;
            var b = el('button', 'olsb-chip', O.dioramas[i].name);
            b.type = 'button';
            b.addEventListener('click', function () { jumpTo(id, i); });
            also.appendChild(b);
        });
        $('olsb-info-also-wrap').hidden = !also.children.length;
    }

    /* ---------- quiz: find the named structure ---------- */
    function quizPool() {
        return dio().structures.filter(function (d) { return !d.inert && !d.bg && d.at && visible(d) && d.id !== (st.quiz && st.quiz.target); });
    }
    function nextQuestion() {
        clearTimeout(quizTimer);
        var pool = quizPool();
        var q = st.quiz;
        q.flash = null; q.reveal = false;
        q.target = pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
    }
    function toggleQuiz() {
        clearTimeout(quizTimer);
        if (st.quiz) { st.quiz = null; }
        else { st.quiz = { target: null, right: 0, asked: 0, flash: null, reveal: false }; st.sel = null; nextQuestion(); }
        render();
    }
    function answer(id) {
        var q = st.quiz;
        if (!q || !q.target || q.reveal || (q.flash && q.flash.ok)) return;
        q.asked++;
        var ok = id === q.target;
        if (ok) q.right++;
        q.flash = { id: id, ok: ok };
        q.reveal = !ok;
        render();
        quizTimer = setTimeout(function () { if (st.quiz === q) { nextQuestion(); render(); } }, ok ? 800 : 1800);
    }
    function renderQuiz() {
        var q = st.quiz;
        $('olsb-quiz').hidden = !q;
        $('olsb-stepcard').hidden = !!q;
        if (!q) return;
        $('olsb-quiz-prompt').textContent = q.target ? nameOf(q.target) : 'Turn on a layer to be quizzed';
        $('olsb-quiz-score').textContent = q.right + ' / ' + q.asked;
        var f = $('olsb-quiz-feedback');
        f.textContent = !q.flash ? 'Tap it on the diagram.' : (q.flash.ok ? 'Yes.' : 'That is ' + nameOf(q.flash.id) + '; the answer is shown.');
        f.className = 'olsb-quiz-fb' + (q.flash ? (q.flash.ok ? ' ok' : ' bad') : '');
    }

    /* ---------- actions ---------- */
    function applyStep() {
        var s = step();
        st.layers = {};
        (s.layers || []).forEach(function (id) { st.layers[id] = true; });
        st.tm = s.tm || 'intact';
        st.view = s.view || dio().views[0].id;
        st.ghost = !!s.ghost;
        st.custom = false;
        if (st.sel && (!els[st.sel] || !visible(els[st.sel].def))) st.sel = null;
        if (st.quiz) nextQuestion();
    }

    function goStep(p, s) {
        var tabs = p !== st.p;
        st.p = p; st.s = s;
        applyStep();
        if (tabs) renderTabs();
        writeHash();
        render();
    }

    /* The first step that focuses `id`, else the first that shows it. */
    function stepShowing(id) {
        var shows = null, T = dio().tours;
        for (var p = 0; p < T.length; p++) {
            for (var s = 0; s < T[p].steps.length; s++) {
                if ((T[p].steps[s].focus || []).indexOf(id) >= 0) return [p, s];
                if (!shows) {
                    st.p = p; st.s = s; applyStep();
                    if (els[id] && visible(els[id].def)) shows = [p, s];
                }
            }
        }
        return shows || [0, 0];
    }

    function goDiorama(i, keepSel) {
        var sel = keepSel ? st.sel : null;
        st.d = i; st.p = 0; st.s = 0; st.sel = null;
        buildSvg();
        buildControls();
        if (sel && els[sel]) { var at = stepShowing(sel); st.p = at[0]; st.s = at[1]; }
        applyStep();
        st.sel = sel && els[sel] ? sel : null;
        renderTabs();
        writeHash();
        render();
    }

    /* Show `id`: in diorama `di` if given, else here if drawn, else the
       first diorama that draws it; switch its layer on if it is off. */
    function jumpTo(id, di) {
        if (di == null) di = els[id] && !els[id].def.inert ? st.d : dioramasWith(id)[0];
        if (di == null) return;
        if (di !== st.d) { st.sel = id; goDiorama(di, true); }
        var e = els[id];
        if (!e) return;
        if (!visible(e.def)) {
            st.layers[e.def.layer] = true;
            (e.def.needs || []).forEach(function (l) { st.layers[l] = true; });
            st.custom = true;
        }
        st.sel = id;
        render();
    }

    function pick(id) {
        if (st.quiz) { if (id) answer(id); return; }
        st.sel = id && els[id] ? id : null;
        render();
    }

    function writeHash() {
        try { history.replaceState(null, '', '#d=' + dio().id + '&p=' + tour().id + '&s=' + (st.s + 1)); } catch (e) { /* no-op */ }
    }

    function readHash() {
        var h = '';
        try { h = location.hash.slice(1); } catch (e) { return; }
        var md = /(?:^|&)d=([a-z-]+)/.exec(h), mp = /(?:^|&)p=([a-z-]+)/.exec(h), ms = /(?:^|&)s=(\d{1,2})(?:&|$)/.exec(h);
        st.d = 0;
        O.dioramas.forEach(function (d, i) { if (md && d.id === md[1]) st.d = i; });
        if (!md && mp) {   /* older links: #p=<tour> alone */
            O.dioramas.forEach(function (d, i) { d.tours.forEach(function (t) { if (t.id === mp[1]) st.d = i; }); });
        }
        var tours = O.dioramas[st.d].tours;
        st.p = 0;
        tours.forEach(function (t, i) { if (mp && t.id === mp[1]) st.p = i; });
        var s = ms ? parseInt(ms[1], 10) - 1 : 0;
        st.s = s >= 0 && s < tours[st.p].steps.length ? s : 0;
    }

    function wire() {
        $('olsb-ghost').addEventListener('change', function (e) { st.ghost = e.target.checked; st.custom = true; render(); });
        $('olsb-names').addEventListener('change', function (e) { st.names = e.target.checked; render(); });
        var tbtns = document.querySelectorAll('[data-tm]');
        for (var j = 0; j < tbtns.length; j++) {
            tbtns[j].addEventListener('click', function (e) {
                var t = e.currentTarget.getAttribute('data-tm');
                if ((dio().tmStates || []).indexOf(t) >= 0) { st.tm = t; st.custom = true; render(); }
            });
        }
        $('olsb-prev').addEventListener('click', function () { if (st.s > 0) goStep(st.p, st.s - 1); });
        $('olsb-next').addEventListener('click', function () { if (st.s < tour().steps.length - 1) goStep(st.p, st.s + 1); });
        $('olsb-info-close').addEventListener('click', function () { pick(null); });
        $('olsb-reset').addEventListener('click', function () { goStep(st.p, st.s); });
        $('olsb-quiz-toggle').addEventListener('click', toggleQuiz);
        $('olsb-quiz-skip').addEventListener('click', function () { if (st.quiz) { st.quiz.asked++; nextQuestion(); render(); } });
        $('olsb-quiz-stop').addEventListener('click', toggleQuiz);
        svg.addEventListener('click', function () { if (!st.quiz) pick(null); });
        document.addEventListener('keydown', function (e) {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            var t = e.target && e.target.tagName;
            if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
            if (e.key === 'ArrowRight' && st.s < tour().steps.length - 1) { goStep(st.p, st.s + 1); e.preventDefault(); }
            else if (e.key === 'ArrowLeft' && st.s > 0) { goStep(st.p, st.s - 1); e.preventDefault(); }
            else if (e.key === 'Escape') { if (st.quiz) toggleQuiz(); else if (st.sel) pick(null); }
        });
        var rt = null;
        window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 120); });
    }

    function boot() {
        svg = $('olsb-svg');
        if (!O || !O.dioramas || !O.dioramas.length || !svg) return;
        try {
            buildRelations();
            wire();
            readHash();
            buildSvg();
            buildControls();
            applyStep();
            renderTabs();
            render();
            document.documentElement.setAttribute('data-olsb', 'ready');
        } catch (e) {
            var p = $('olsb-problem');
            if (p) { p.hidden = false; p.textContent = 'The diagram failed to draw: ' + (e && e.message ? e.message : 'unknown error'); }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
