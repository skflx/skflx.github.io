/* =============================================================
   site.js — shared chrome behaviour for skflx.MD pages.
   Binds every .site-theme-toggle to the sk_theme key and the
   html[data-theme] attribute css/site.css keys off. The initial
   theme is applied pre-paint by js/theme-boot.js. No
   dependencies, no build step, defensive throughout.
   ============================================================= */
(function () {
    'use strict';
    var root = document.documentElement;

    function currentTheme() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function setTheme(t) {
        t = t === 'dark' ? 'dark' : 'light';
        try { root.setAttribute('data-theme', t); } catch (e) { /* no-op */ }
        try { localStorage.setItem('sk_theme', t); } catch (e) { /* no-op */ }
        syncButtons();
    }

    function syncButtons() {
        var dark = currentTheme() === 'dark';
        var btns = document.querySelectorAll('.site-theme-toggle');
        for (var i = 0; i < btns.length; i++) {
            btns[i].setAttribute('aria-pressed', dark ? 'true' : 'false');
            btns[i].setAttribute('title', dark ? 'Switch to day' : 'Switch to night');
        }
    }

    function wire() {
        if (!root.getAttribute('data-theme')) root.setAttribute('data-theme', 'light');
        var btns = document.querySelectorAll('.site-theme-toggle');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].__siteWired) continue;
            btns[i].__siteWired = true;
            btns[i].addEventListener('click', function () {
                setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
            });
        }
        syncButtons();
    }

    /* ---------- global search hotkey (Cmd-K / Ctrl-K) ---------- */
    window.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            var active = document.activeElement;
            var searchInput = document.getElementById('srch-input');
            if (active && active !== searchInput && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                return;
            }
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            } else {
                window.location.href = 'search.html';
            }
        }
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
    else wire();
})();
