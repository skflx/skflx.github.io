/* =============================================================
   review.js — owner review list (review.html).
   Renders window.__REVIEW_ITEMS (js/review-items.js) with DOM calls
   only: every data string goes in through textContent or setAttribute.
   Ticks persist per item in localStorage `sk_review:<id>`; storage is
   guarded, so the page works without it (the ticks then last one visit).
   Keys: j / k move between visible items, space ticks, o opens the
   first link of the current item in a new tab.
   ============================================================= */
(function () {
    'use strict';

    var STORE = 'sk_review:';
    var ORIGIN = 'https://skflx.github.io/';
    var ITEMS = Array.isArray(window.__REVIEW_ITEMS) ? window.__REVIEW_ITEMS : [];
    var checked = {};
    var groups = [];
    var list = document.getElementById('rv-list');
    var filter = document.getElementById('rv-filter');
    var count = document.getElementById('rv-count');
    var status = document.getElementById('rv-status');
    var report = document.getElementById('rv-report');
    var copyBtn = document.getElementById('rv-copy');
    if (!list) return;

    function readTick(id) {
        try { return window.localStorage.getItem(STORE + id) === '1'; } catch (e) { return false; }
    }
    function writeTick(id, on) {
        try {
            if (on) window.localStorage.setItem(STORE + id, '1');
            else window.localStorage.removeItem(STORE + id);
        } catch (e) { /* storage blocked: the tick still works for this visit */ }
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null && text !== '') n.textContent = text;
        return n;
    }

    /* Rendered in group order; items keep their file order inside a group. */
    ITEMS.forEach(function (it) {
        if (groups.indexOf(it.group) < 0) groups.push(it.group);
    });
    ITEMS.forEach(function (it) { checked[it.id] = readTick(it.id); });

    groups.forEach(function (group, gi) {
        var section = el('section', 'rv-group');
        section.setAttribute('data-g', String(gi));
        section.appendChild(el('h2', 'rv-group-title', group));
        var ol = el('ol', 'rv-items');
        ITEMS.forEach(function (it) {
            if (it.group !== group) return;
            var li = el('li', 'rv-item');
            li.setAttribute('data-id', it.id);
            var label = el('label', 'rv-check');
            var box = document.createElement('input');
            box.type = 'checkbox';
            box.id = 'rv-' + it.id;
            box.checked = !!checked[it.id];
            box.addEventListener('change', function () {
                checked[it.id] = box.checked;
                writeTick(it.id, box.checked);
                li.classList.toggle('is-done', box.checked);
                updateCount();
            });
            label.appendChild(box);
            var body = el('div', 'rv-body');
            var title = el('p', 'rv-title');
            title.appendChild(el('span', 'rv-name', it.title));
            if (it.issue) title.appendChild(el('span', 'rv-issue', it.issue));
            body.appendChild(title);
            body.appendChild(el('p', 'rv-look', it.look));
            if (it.links && it.links.length) {
                var ul = el('ul', 'rv-links');
                it.links.forEach(function (l) {
                    var a = el('a', null, l.label);
                    a.setAttribute('href', l.href);
                    ul.appendChild(el('li', null, null)).appendChild(a);
                });
                body.appendChild(ul);
            }
            if (it.note) body.appendChild(el('p', 'rv-note', it.note));
            li.appendChild(label);
            li.appendChild(body);
            if (checked[it.id]) li.classList.add('is-done');
            ol.appendChild(li);
        });
        section.appendChild(ol);
        list.appendChild(section);
    });

    if (!ITEMS.length) list.appendChild(el('p', 'rv-empty', 'No review items yet.'));

    if (filter) {
        var all = document.createElement('option');
        all.value = '';
        all.textContent = 'All groups';
        filter.appendChild(all);
        groups.forEach(function (group, gi) {
            var opt = document.createElement('option');
            opt.value = String(gi);
            opt.textContent = group;
            filter.appendChild(opt);
        });
        filter.addEventListener('change', applyFilter);
    }

    function applyFilter() {
        var v = filter ? filter.value : '';
        list.querySelectorAll('.rv-group').forEach(function (s) {
            s.hidden = v !== '' && s.getAttribute('data-g') !== v;
        });
    }

    function updateCount() {
        var done = ITEMS.filter(function (it) { return checked[it.id]; }).length;
        if (count) count.textContent = done + ' of ' + ITEMS.length + ' checked';
    }
    updateCount();

    /* ---- keyboard: j / k move, space ticks (native on the checkbox), o opens ---- */
    function visibleItems() {
        return Array.prototype.filter.call(list.querySelectorAll('.rv-item'), function (li) {
            return !li.parentNode.parentNode.hidden;
        });
    }
    function currentItem() {
        var a = document.activeElement;
        return a && a.closest ? a.closest('.rv-item') : null;
    }
    function move(dir) {
        var items = visibleItems();
        if (!items.length) return;
        var i = items.indexOf(currentItem());
        var next = i < 0 ? (dir > 0 ? 0 : items.length - 1) : Math.min(items.length - 1, Math.max(0, i + dir));
        var box = items[next].querySelector('input');
        if (box) box.focus();
        items[next].scrollIntoView({ block: 'nearest' });
        if (status) status.textContent = '';
    }
    function openFirst() {
        var li = currentItem();
        if (!li) { if (status) status.textContent = 'Move to an item with j or k first.'; return; }
        var a = li.querySelector('.rv-links a');
        if (!a) { if (status) status.textContent = 'This item has no link.'; return; }
        window.open(a.href, '_blank', 'noopener');
    }
    document.addEventListener('keydown', function (e) {
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        var tag = t && t.tagName;
        if (tag === 'SELECT' || tag === 'TEXTAREA' || (tag === 'INPUT' && t.type !== 'checkbox')) return;
        if (e.key === 'j') { e.preventDefault(); move(1); }
        else if (e.key === 'k') { e.preventDefault(); move(-1); }
        else if (e.key === 'o') { e.preventDefault(); openFirst(); }
    });

    /* ---- copy report: Markdown of every item and its full URLs ---- */
    function buildReport() {
        var done = ITEMS.filter(function (it) { return checked[it.id]; }).length;
        var lines = ['# Owner review: skflx.github.io', '', done + ' of ' + ITEMS.length + ' checked.'];
        var last = null;
        ITEMS.forEach(function (it) {
            if (it.group !== last) { lines.push('', '## ' + it.group); last = it.group; }
            lines.push('- [' + (checked[it.id] ? 'x' : ' ') + '] ' + it.title + (it.issue ? ' (' + it.issue + ')' : ''));
            lines.push('  - ' + it.look);
            (it.links || []).forEach(function (l) {
                lines.push('  - ' + l.label + ': ' + new URL(l.href, ORIGIN).href);
            });
            if (it.note) lines.push('  - Note: ' + it.note);
        });
        return lines.join('\n') + '\n';
    }
    function say(msg) { if (status) status.textContent = msg; }
    function fallbackCopy(text) {
        if (!report) { say('Copy failed.'); return; }
        report.value = text;
        report.hidden = false;
        report.focus();
        report.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        say(ok ? 'Report copied. Paste it into the issue.'
            : 'Copy is blocked here: the report is in the box below, select it and copy.');
    }
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            var text = buildReport();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(
                    function () { say('Report copied. Paste it into the issue.'); },
                    function () { fallbackCopy(text); });
            } else {
                fallbackCopy(text);
            }
        });
    }
}());
