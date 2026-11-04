/* =============================================================
   cpt-search.js — cpt-search.html: the otolaryngology CPT table,
   fuzzy scoring, click-to-copy, and a local search history
   (localStorage cpt-history / cpt-analytics — this browser only).
   Every string that reaches innerHTML goes through esc().
   ============================================================= */
(function () {
    'use strict';

    /* ── Database ─────────────────────────────────── */
    var DB = window.CPT_DB || []; /* the table lives in js/cpt-data.js */

    /* ── Badge colours (bg / text / border) ────── */

    /* ── Fuzzy scoring ────────────────────────────── */
    function score(term, item) {
        var t = term.toLowerCase();
        var c = item.code.toLowerCase();
        var d = item.desc.toLowerCase();
        var a = item.area.toLowerCase();
        var tp = item.type.toLowerCase();
        var k = item.ki.toLowerCase();
        var s = 0;

        if (c === t)            s += 1000;
        else if (c.startsWith(t)) s += 500;
        else if (c.includes(t)) s += 100;

        if (k === t)            s += 800;
        else if (k.includes(t)) s += 400;

        if (d.includes(t))      s += 100;
        d.split(' ').forEach(function(w) {
            if (w.startsWith(t)) s += 50;
            else if (w.includes(t)) s += 20;
        });

        if (a.includes(t))  s += 30;
        if (tp.includes(t)) s += 30;

        // fuzzy subsequence
        var fi = 0;
        for (var i = 0; i < d.length && fi < t.length; i++) {
            if (d[i] === t[fi]) fi++;
        }
        if (fi === t.length) s += 10;

        return s;
    }

    /* ── localStorage helpers ─────────────────────── */
    function lsGet(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
    }

    /* ── State ────────────────────────────────────── */
    var history   = lsGet('cpt-history')   || [];
    var analytics = lsGet('cpt-analytics') || {};
    var debounce  = null;
    var copied    = null;

    /* ── DOM refs ─────────────────────────────────── */
    var input      = document.getElementById('cpt-input');
    var clearBtn   = document.getElementById('cpt-clear');
    var histPanel  = document.getElementById('cpt-history');
    var histRecent = document.getElementById('hist-recent');
    var histTop    = document.getElementById('hist-top');
    var resultsEl  = document.getElementById('cpt-results');
    var stateEl    = document.getElementById('cpt-state');
    var countEl    = document.getElementById('cpt-count');

    /* ── Render helpers ───────────────────────────── */
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }


    function renderHistPanel() {
        var top = Object.entries(analytics)
            .sort(function(a,b){ return b[1]-a[1]; })
            .slice(0,5)
            .map(function(e){ return { term:e[0], count:e[1] }; });

        var showRecent = history.length > 0;
        var showTop    = top.length > 0;

        if (!showRecent && !showTop) { histPanel.classList.add('hidden'); return; }

        document.getElementById('hist-recent-wrap').style.display = showRecent ? '' : 'none';
        document.getElementById('hist-top-wrap').style.display    = showTop    ? '' : 'none';

        histRecent.innerHTML = history.slice(0,5).map(function(h) {
            return '<button class="history-item" data-term="'+esc(h.term)+'">'
                 + '<span>'+esc(h.term)+'</span>'
                 + (h.code ? '<span class="badge-code">'+esc(h.code)+'</span>' : '')
                 + '</button>';
        }).join('');

        histTop.innerHTML = top.map(function(t) {
            return '<button class="history-item" data-term="'+esc(t.term)+'">'
                 + '<span>'+esc(t.term)+'</span>'
                 + '<span class="badge-count">'+t.count+'×</span>'
                 + '</button>';
        }).join('');

        histPanel.classList.remove('hidden');
    }

    function renderResults(term) {
        if (!term.trim()) {
            resultsEl.innerHTML = '';
            countEl.style.display = 'none';
            stateEl.style.display = '';
            return;
        }

        var scored = DB
            .map(function(item, i) { return Object.assign({}, item, { _s: score(term, item), _i: i }); })
            .filter(function(item) { return item._s > 0; })
            .sort(function(a,b) { return b._s - a._s; })
            .slice(0, 20);

        stateEl.style.display = 'none';
        histPanel.classList.add('hidden');

        if (scored.length === 0) {
            countEl.style.display = 'none';
            resultsEl.innerHTML =
                '<div class="state-box">'
                + '<p>No codes found for &ldquo;'+esc(term)+'&rdquo;</p>'
                + '<p class="hint">Try a different keyword, code number, or category abbreviation</p>'
                + '</div>';
            return;
        }

        countEl.textContent = scored.length + ' result' + (scored.length === 1 ? '' : 's');
        countEl.style.display = '';

        resultsEl.innerHTML = scored.map(function(item) {
            var isCopied = copied === item.code;
            return '<div class="result-card" id="cpt-'+item._i+'" data-code="'+esc(item.code)+'" data-desc="'+esc(item.desc)+'">'
                 + '<div class="card-left">'
                 + '<div class="card-code">'+esc(item.code)+'</div>'
                 + '<span class="ki-badge">'+esc(item.ki)+'</span>'
                 + '</div>'
                 + '<div class="card-body">'
                 + '<p class="card-desc">'+esc(item.desc)+'</p>'
                 + '<div class="card-tags">'
                 + '<span class="tag">'+esc(item.area)+'</span>'
                 + '<span class="tag">'+esc(item.type)+'</span>'
                 + '</div>'
                 + '</div>'
                 + '<button class="copy-btn'+(isCopied?' copied':'')+'" data-code="'+esc(item.code)+'" data-desc="'+esc(item.desc)+'" aria-label="Copy CPT code">'
                 + (isCopied ? 'Copied' : 'Copy')
                 + '</button>'
                 + '</div>';
        }).join('');
    }

    /* ── Copy to clipboard ────────────────────────── */
    function copyCode(code, desc) {
        navigator.clipboard.writeText(code).catch(function() {
            // fallback for older browsers
            var ta = document.createElement('textarea');
            ta.value = code;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });

        copied = code;
        saveSearch(input.value.trim(), code);
        renderResults(input.value.trim());

        setTimeout(function() {
            if (copied === code) {
                copied = null;
                renderResults(input.value.trim());
            }
        }, 2000);
    }

    /* ── Save search analytics ────────────────────── */
    function saveSearch(term, code) {
        if (!term) return;
        history = [{ term: term, code: code || null }].concat(history.slice(0, 19));
        analytics[term] = (analytics[term] || 0) + 1;
        lsSet('cpt-history',   history);
        lsSet('cpt-analytics', analytics);
    }

    /* ── Event handlers ───────────────────────────── */
    input.addEventListener('input', function() {
        var val = input.value;
        clearBtn.style.display = val ? '' : 'none';
        clearTimeout(debounce);
        debounce = setTimeout(function() { renderResults(val); }, 60);
    });

    input.addEventListener('focus', function() {
        if (!input.value) {
            renderHistPanel();
        }
    });

    document.addEventListener('click', function(e) {
        // History item
        var hi = e.target.closest('.history-item');
        if (hi) {
            input.value = hi.dataset.term;
            clearBtn.style.display = '';
            histPanel.classList.add('hidden');
            renderResults(input.value);
            input.focus();
            return;
        }

        // Copy button (stop propagation to card)
        var cb = e.target.closest('.copy-btn');
        if (cb) {
            e.stopPropagation();
            copyCode(cb.dataset.code, cb.dataset.desc);
            return;
        }

        // Card click → copy
        var card = e.target.closest('.result-card');
        if (card) {
            copyCode(card.dataset.code, card.dataset.desc);
            return;
        }

        // Example pills
        var pill = e.target.closest('.pill');
        if (pill) {
            input.value = pill.dataset.q;
            clearBtn.style.display = '';
            stateEl.style.display = 'none';
            renderResults(input.value);
            input.focus();
            return;
        }

        // Click outside → hide history
        if (!histPanel.contains(e.target) && e.target !== input) {
            histPanel.classList.add('hidden');
        }
    });

    clearBtn.addEventListener('click', function() {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsEl.innerHTML = '';
        countEl.style.display = 'none';
        stateEl.style.display = '';
        histPanel.classList.add('hidden');
        input.focus();
    });

    /* ── Deep link: cpt-search.html#cpt-<n> (from site search) ──
       Shows the row's code as the query so the row is drawn, then brings
       it into view with a brief highlight. */
    function openHashRow() {
        var m = /^#cpt-(\d+)$/.exec(location.hash || '');
        if (!m || !DB[m[1]]) return;
        var code = DB[m[1]].code;
        input.value = code;
        clearBtn.style.display = '';
        stateEl.style.display = 'none';
        renderResults(code);
        var row = document.getElementById('cpt-' + m[1]);
        if (!row) return;
        row.scrollIntoView({ block: 'center' });
        row.classList.add('is-hit');
    }

    /* ── Init ─────────────────────────────────────── */
    input.focus();
    openHashRow();
}());
