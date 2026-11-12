/* =============================================================
   palette.js — the Cmd/Ctrl-K command palette: one native
   <dialog id="cmd-k-palette"> over the site's pages, OKSAT guides
   and modules, the CPT table and the sk.oto wiki notes.

   Loaded by js/site.js on the first hotkey press, never before, and
   it fetches nothing until then: the OKSAT manifest, the CPT table
   and the wiki index each load on the first open, and only once.
   The wiki index is ~7.6 MB, so it is read with force-cache and
   kept as {slug, title, tags} only. A failed load degrades silently.

   Every piece of data reaches the DOM through textContent. Each href
   is built here from known parts and checked against a fixed set of
   bases before it is used.
   ============================================================= */
(function () {
    'use strict';

    var WIKI_BASE = 'https://skflx.github.io/ohns-wiki-skflx/';
    /* The index sits on the page's own origin (the wiki is published on the same host). A cross-origin
       fetch would be refused by the pages' connect-src (default-src 'self'). */
    var WIKI_INDEX = 'ohns-wiki-skflx/static/contentIndex.json';
    var CAP = 8;                         /* rows per group */
    var GROUP_ORDER = ['pages', 'oksat', 'cpt', 'wiki'];
    var GROUP_TITLE = {
        pages: 'Site pages',
        oksat: 'OKSAT guides and modules',
        cpt: 'CPT codes',
        wiki: 'Wiki notes',
    };
    var PAGE_HREF = /^(index|oksat|search|cpt-search|pdf-chapter-splitter|airway-jeopardy)\.html(#cpt-\d+)?$/;
    var OKSAT_HREF = /^oksat-(study|learn)\.html\?[gm]=[A-Za-z0-9._-]+$/;

    var PAGES = [
        { title: 'skflx.MD', href: 'index.html', tags: 'home one-pager about research tools' },
        { title: 'OKSAT study hub', href: 'oksat.html', tags: 'oksat ohns self assessment modules guides questions' },
        { title: 'Search', href: 'search.html', tags: 'search find modules cpt codes' },
        { title: 'CPT code search', href: 'cpt-search.html', tags: 'cpt codes procedures coding' },
        { title: 'PDF chapter splitter', href: 'pdf-chapter-splitter.html', tags: 'pdf chapters split textbook zip' },
        { title: 'Airway Rounds', href: 'airway-jeopardy.html', tags: 'airway quiz jeopardy game larynx rounds' },
    ];

    /* ---------- hrefs: only the known shapes pass ---------- */
    function safeHref(h) {
        if (typeof h !== 'string') return null;
        if (h.indexOf(WIKI_BASE) === 0) return /^[A-Za-z0-9._~%\/-]+$/.test(h.slice(WIKI_BASE.length)) ? h : null;
        if (PAGE_HREF.test(h) || OKSAT_HREF.test(h)) return h;
        return null;
    }

    /* ---------- item model: { group, title, sub, href, tl, words, tg } ---------- */
    function makeItem(group, title, sub, href, tags) {
        var h = safeHref(href);
        if (!h) return null;
        var t = String(title || '').replace(/\s+/g, ' ').trim();
        if (!t) return null;
        var tl = t.toLowerCase();
        return {
            group: group,
            title: t,
            sub: String(sub || ''),
            href: h,
            tl: tl,
            words: tl.split(/[^\p{L}\p{N}]+/u).filter(Boolean),
            tg: String(tags || '').toLowerCase(),
        };
    }

    var data = { pages: [], oksat: [], cpt: [], wiki: [] };
    PAGES.forEach(function (p) {
        var it = makeItem('pages', p.title, 'Site page', p.href, p.tags);
        if (it) data.pages.push(it);
    });

    /* ---------- lazy corpora ---------- */
    var loadStarted = false;
    var wikiState = 'idle';   /* idle | loading | ready | failed */

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = function () { reject(new Error(src)); };
            document.body.appendChild(s);
        });
    }

    function buildOksat() {
        var manifest = window.OKSAT_MANIFEST;
        var guides = window.OKSAT_GUIDES;
        var subs = window.OKSAT_SUBSPECIALTIES || {};
        var out = [];
        function subLabel(key) { return subs[key] && subs[key].label ? String(subs[key].label) : ''; }
        if (Array.isArray(guides)) guides.forEach(function (g) {
            if (!g || !g.slug) return;
            var it = makeItem('oksat', g.title, 'OKSAT guide', 'oksat-learn.html?g=' + encodeURIComponent(g.slug), subLabel(g.subspecialty) + ' ' + (g.kicker || ''));
            if (it) out.push(it);
        });
        if (Array.isArray(manifest)) manifest.forEach(function (m) {
            if (!m || !m.slug) return;
            var it = makeItem('oksat', m.title, 'OKSAT module', 'oksat-study.html?m=' + encodeURIComponent(m.slug), subLabel(m.subspecialty) + ' ' + (m.kicker || ''));
            if (it) out.push(it);
        });
        data.oksat = out;
    }

    function loadOksat() {
        var ready = Array.isArray(window.OKSAT_MANIFEST) ? Promise.resolve() : loadScript('js/oksat/manifest.js');
        return ready.then(buildOksat).catch(function () { data.oksat = []; });
    }

    function buildCpt() {
        if (!Array.isArray(window.CPT_DB)) return;
        var out = [];
        window.CPT_DB.forEach(function (r, i) {
            if (!r || !r.code) return;
            /* cpt-search.js gives each row id cpt-<index> (the same convention search.js uses) */
            var it = makeItem('cpt', String(r.code) + ' ' + String(r.desc || ''), 'CPT · ' + String(r.area || ''),
                'cpt-search.html#cpt-' + i, [r.code, r.area, r.type, r.ki].join(' '));
            if (it) out.push(it);
        });
        data.cpt = out;
    }

    function loadCpt() {
        var ready = Array.isArray(window.CPT_DB) ? Promise.resolve() : loadScript('js/cpt-data.js');
        return ready.then(buildCpt).catch(function () { data.cpt = []; });
    }

    function loadWiki() {
        wikiState = 'loading';
        refresh();
        var url = location.origin + '/' + WIKI_INDEX;
        return fetch(url, { cache: 'force-cache', credentials: 'omit' })
            .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
            .then(function (j) {
                var out = [];
                Object.keys(j).forEach(function (k) {
                    var n = j[k];
                    if (!n || typeof n.title !== 'string') return;
                    var slug = typeof n.slug === 'string' ? n.slug : k;
                    var it = makeItem('wiki', n.title, 'Wiki note', WIKI_BASE + encodeURI(slug),
                        Array.isArray(n.tags) ? n.tags.join(' ') : '');
                    if (it) out.push(it);
                });
                data.wiki = out;
                wikiState = 'ready';
                refresh();
            })
            .catch(function () {
                data.wiki = [];
                wikiState = 'failed';
                refresh();
            });
    }

    /* ---------- the dialog ---------- */
    var dlg, input, status, list, returnEl = null;
    var flat = [];      /* items in display order */
    var active = -1;

    function build() {
        dlg = document.createElement('dialog');
        dlg.id = 'cmd-k-palette';
        dlg.className = 'cmdk';
        dlg.setAttribute('aria-labelledby', 'cmdk-title');

        var panel = document.createElement('div');
        panel.className = 'cmdk-panel';

        var title = document.createElement('h2');
        title.id = 'cmdk-title';
        title.className = 'cmdk-title site-kicker';
        title.textContent = 'Find a page, guide, code or note';

        input = document.createElement('input');
        input.id = 'cmdk-input';
        input.className = 'cmdk-input';
        input.type = 'text';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'true');
        input.setAttribute('aria-controls', 'cmdk-list');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-describedby', 'cmdk-status');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        input.setAttribute('enterkeyhint', 'go');
        input.placeholder = 'thyroid, 31540, a guide…';

        status = document.createElement('p');
        status.id = 'cmdk-status';
        status.className = 'cmdk-status';
        status.setAttribute('aria-live', 'polite');

        list = document.createElement('ul');
        list.id = 'cmdk-list';
        list.className = 'cmdk-list';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-labelledby', 'cmdk-title');

        var foot = document.createElement('p');
        foot.className = 'cmdk-foot';
        foot.textContent = 'Up and Down move · Enter opens · Esc closes';

        panel.append(title, input, status, list, foot);
        dlg.appendChild(panel);
        document.body.appendChild(dlg);

        input.addEventListener('input', render);
        input.addEventListener('keydown', onKey);
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        dlg.addEventListener('close', function () {
            var back = returnEl;
            returnEl = null;
            if (back && back.isConnected && typeof back.focus === 'function') back.focus();
        });
    }

    /* ---------- matching: every token must hit; title beats tags ---------- */
    function rank(items, toks) {
        var out = [];
        items.forEach(function (it, i) {
            var s = 0;
            for (var t = 0; t < toks.length; t++) {
                var k = toks[t];
                if (it.words.some(function (w) { return w.indexOf(k) === 0; })) s += 3;
                else if (it.tl.indexOf(k) !== -1) s += 2;
                else if (it.tg.indexOf(k) !== -1) s += 1;
                else return;
            }
            out.push({ it: it, s: s, i: i });
        });
        out.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
        return out;
    }

    function optionEl(it, idx) {
        var li = document.createElement('li');
        li.id = 'cmdk-o-' + idx;
        li.className = 'cmdk-opt';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        var t = document.createElement('span');
        t.className = 'cmdk-title-text';
        t.textContent = it.title;
        var s = document.createElement('span');
        s.className = 'cmdk-sub';
        s.textContent = it.sub;
        li.append(t, s);
        li.addEventListener('mousemove', function () { setActive(idx); });
        li.addEventListener('click', function () { go(it.href); });
        return li;
    }

    function setActive(i) {
        if (i < 0 || i >= flat.length) return;
        active = i;
        var opts = list.querySelectorAll('[role="option"]');
        for (var k = 0; k < opts.length; k++) opts[k].setAttribute('aria-selected', k === i ? 'true' : 'false');
        var cur = document.getElementById('cmdk-o-' + i);
        if (cur) {
            input.setAttribute('aria-activedescendant', cur.id);
            if (typeof cur.scrollIntoView === 'function') cur.scrollIntoView({ block: 'nearest' });
        }
    }

    function render() {
        var toks = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        list.replaceChildren();
        flat = [];
        var total = 0;
        var groups = toks.length ? GROUP_ORDER : ['pages'];
        groups.forEach(function (g) {
            var ranked = toks.length
                ? rank(data[g], toks)
                : data[g].map(function (it, i) { return { it: it, s: 0, i: i }; });
            if (!ranked.length) return;
            total += ranked.length;
            var head = document.createElement('li');
            head.className = 'cmdk-group';
            head.setAttribute('role', 'presentation');
            head.textContent = GROUP_TITLE[g] + ' · ' + ranked.length;
            list.appendChild(head);
            ranked.slice(0, CAP).forEach(function (r) {
                var idx = flat.length;
                flat.push(r.it);
                list.appendChild(optionEl(r.it, idx));
            });
        });

        var msg;
        if (!toks.length) msg = 'Type to find a page, guide, module, CPT code or wiki note.';
        else msg = total === 0 ? 'No matches.' : total + (total === 1 ? ' match' : ' matches');
        if (wikiState === 'loading') msg = 'Loading wiki index… ' + msg;
        status.textContent = msg;

        active = -1;
        if (flat.length) setActive(0);
        else input.removeAttribute('aria-activedescendant');
    }

    function refresh() {
        if (dlg && dlg.open) render();
    }

    function go(href) {
        window.location.href = href;
    }

    function onKey(e) {
        if (e.isComposing) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            dlg.close();
            return;
        }
        if (e.key === 'ArrowDown') {
            if (flat.length) { e.preventDefault(); setActive((active + 1) % flat.length); }
        } else if (e.key === 'ArrowUp') {
            if (flat.length) { e.preventDefault(); setActive(active <= 0 ? flat.length - 1 : active - 1); }
        } else if (e.key === 'Enter') {
            if (flat[active]) { e.preventDefault(); go(flat[active].href); }
        }
    }

    /* ---------- open: the one entry point site.js calls ---------- */
    function open(ret) {
        if (!dlg) build();
        if (dlg.open) return;
        if (typeof dlg.showModal !== 'function') { go('search.html'); return; }
        returnEl = ret || null;
        input.value = '';
        render();
        dlg.showModal();
        input.focus();
        if (!loadStarted) {
            loadStarted = true;
            loadOksat().then(refresh);
            loadCpt().then(refresh);
            loadWiki();
        }
    }

    window.SKPalette = { open: open };
})();
