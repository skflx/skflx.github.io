/* =============================================================
   search.js — search.html: one box over the OKSAT question
   modules and the CPT table. The index is built in memory on every
   load (nothing persisted); hits are in match order, grouped by
   corpus. Every piece of data reaches the DOM through textContent.

   Module files declare top-level `const`s, so each loads in its own
   hidden same-origin frame, is copied out as plain strings, and the
   frame is discarded (the same pattern as js/oksat/learn.js).
   ============================================================= */
(function () {
    'use strict';

    var DEBOUNCE = 150;   /* ms after the last keystroke */
    var CAP = 60;         /* rows drawn per group; the count still shows the total */

    var input = document.getElementById('srch-input');
    var statusEl = document.getElementById('srch-status');
    var errorsEl = document.getElementById('srch-errors');
    var resultsEl = document.getElementById('srch-results');
    if (!input || !statusEl || !errorsEl || !resultsEl) return;

    var GROUPS = [
        { id: 'oksat', title: 'OKSAT question modules' },
        { id: 'cpt', title: 'CPT codes' },
    ];

    var index = [];          /* { group, label, href, fields: [{ name, text }] } */
    var ready = false;       /* true once every OKSAT module has loaded or failed */
    var timer = null;

    /* ---------- errors (inline, one line each) ---------- */
    function notice(msg) {
        var p = document.createElement('p');
        p.className = 'srch-error';
        p.setAttribute('role', 'alert');
        p.textContent = msg;
        errorsEl.appendChild(p);
    }

    /* ---------- CPT corpus: window.CPT_DB from js/cpt-data.js ---------- */
    function buildCpt() {
        if (!Array.isArray(window.CPT_DB)) {
            notice('The CPT table did not load, so CPT codes are not searched.');
            return [];
        }
        return window.CPT_DB.map(function (r) {
            return {
                group: 'cpt',
                label: 'CPT ' + String(r.code || ''),
                href: 'cpt-search.html',
                fields: [
                    { name: 'code', text: String(r.code || '') },
                    { name: 'procedure', text: String(r.desc || '') },
                    { name: 'area', text: String(r.area || '') },
                    { name: 'type', text: String(r.type || '') },
                    { name: 'category', text: String(r.ki || '') },
                ],
            };
        });
    }

    /* ---------- OKSAT corpus: module data read from a throwaway frame ---------- */
    function studyHref(slug, concept) {
        return 'oksat-study.html?m=' + encodeURIComponent(slug) + (concept ? '&c=' + encodeURIComponent(concept) : '');
    }

    function oksatEntries(entry, mod) {
        var out = [];
        var concepts = mod.CONCEPTS || {};
        Object.keys(concepts).forEach(function (id) {
            var c = concepts[id];
            if (!c || !c.label) return;
            out.push({
                group: 'oksat', label: String(entry.title), href: studyHref(entry.slug, id),
                fields: [{ name: 'concept', text: String(c.label) }],
            });
        });
        (mod.ITEMS || []).forEach(function (it) {
            if (!it || !it.stem) return;
            var concept = Array.isArray(it.concepts) && it.concepts.length ? String(it.concepts[0]) : null;
            out.push({
                group: 'oksat', label: String(entry.title), href: studyHref(entry.slug, concept),
                fields: [{ name: 'question', text: String(it.stem) }],
            });
        });
        return out;
    }

    function loadModule(entry) {
        return new Promise(function (resolve, reject) {
            var f = document.createElement('iframe');
            f.hidden = true;
            f.tabIndex = -1;
            f.setAttribute('aria-hidden', 'true');
            document.body.appendChild(f);
            function finish(fn, v) { f.remove(); fn(v); }
            var s = f.contentDocument.createElement('script');
            s.src = entry.data;
            s.onload = function () {
                var mod = null;
                try { mod = f.contentWindow.__MCQ_MODULE; } catch (e) { mod = null; }
                if (!mod) { finish(reject, new Error('no data')); return; }
                try { finish(resolve, oksatEntries(entry, mod)); } catch (e) { finish(reject, e); }
            };
            s.onerror = function () { finish(reject, new Error('could not load')); };
            f.contentDocument.body.appendChild(s);
        });
    }

    function loadOksat() {
        var manifest = window.OKSAT_MANIFEST;
        if (!Array.isArray(manifest)) {
            notice('The OKSAT question modules did not load, so they are not searched.');
            return Promise.resolve([]);
        }
        return Promise.all(manifest.map(function (entry) {
            return loadModule(entry).catch(function () {
                notice('“' + String(entry.title) + '” did not load, so it is not searched.');
                return [];
            });
        })).then(function (lists) {
            return [].concat.apply([], lists);
        });
    }

    /* ---------- matching: substring, case-insensitive, first matching field ---------- */
    function matches(q) {
        var hits = [];
        index.forEach(function (e) {
            for (var i = 0; i < e.fields.length; i++) {
                if (e.fields[i].text.toLowerCase().indexOf(q) !== -1) {
                    hits.push({ entry: e, field: e.fields[i] });
                    return;
                }
            }
        });
        return hits;
    }

    function hitLinks() {
        return Array.prototype.slice.call(resultsEl.querySelectorAll('a.srch-hit'));
    }

    function hitRow(h) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.className = 'srch-hit';
        a.href = h.entry.href;
        var label = document.createElement('span');
        label.className = 'srch-label';
        label.textContent = h.entry.label;
        var field = document.createElement('span');
        field.className = 'srch-field';
        field.textContent = h.field.name;
        var text = document.createElement('span');
        text.className = 'srch-text';
        text.textContent = h.field.text;
        a.append(label, field, text);
        li.appendChild(a);
        return li;
    }

    function run() {
        var raw = input.value.trim();
        var q = raw.toLowerCase();
        resultsEl.replaceChildren();
        if (!q) {
            statusEl.textContent = ready ? 'Type to search the question modules and the CPT table.' : 'Loading the index…';
            return;
        }
        var hits = matches(q);
        GROUPS.forEach(function (g) {
            var mine = hits.filter(function (h) { return h.entry.group === g.id; });
            if (!mine.length) return;
            var sec = document.createElement('section');
            sec.className = 'srch-group';
            var h2 = document.createElement('h2');
            h2.className = 'site-kicker';
            h2.textContent = g.title + ' · ' + mine.length;
            var ol = document.createElement('ol');
            mine.slice(0, CAP).forEach(function (h) { ol.appendChild(hitRow(h)); });
            sec.append(h2, ol);
            if (mine.length > CAP) {
                var more = document.createElement('p');
                more.className = 'srch-more';
                more.textContent = 'Showing the first ' + CAP + ' of ' + mine.length + '; narrow the search to see the rest.';
                sec.appendChild(more);
            }
            resultsEl.appendChild(sec);
        });
        var msg = hits.length + (hits.length === 1 ? ' match' : ' matches') + ' for “' + raw + '”';
        if (!ready) msg += ' · still loading the question modules';
        statusEl.textContent = msg;
    }

    /* ---------- keyboard: Down from the box enters the results; Up/Down move; Enter opens ---------- */
    input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(run, DEBOUNCE);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
            var links = hitLinks();
            if (links.length) { e.preventDefault(); links[0].focus(); }
        } else if (e.key === 'Enter') {
            clearTimeout(timer);
            run();
            var first = hitLinks()[0];
            if (first) { e.preventDefault(); first.click(); }
        }
    });

    resultsEl.addEventListener('keydown', function (e) {
        var links = hitLinks();
        var i = links.indexOf(document.activeElement);
        if (i === -1) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (i < links.length - 1) links[i + 1].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (i > 0) links[i - 1].focus(); else input.focus();
        }
    });

    /* ---------- boot: CPT is synchronous, OKSAT modules load in parallel frames ---------- */
    var cptIndex = buildCpt();
    index = cptIndex;

    loadOksat().then(function (oksat) {
        index = oksat.concat(cptIndex);
        ready = true;
        document.documentElement.setAttribute('data-search', 'ready');
        run();
    });

    input.focus();
})();
