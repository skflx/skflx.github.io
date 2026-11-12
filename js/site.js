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

    /* ---------- global command palette hotkey (Cmd-K / Ctrl-K) ----------
       Opens the palette (js/palette.js), which is fetched on the first press
       and not before. On search.html the page's own box takes the key. If the
       palette cannot load, the key goes to search.html, as before.
       Opt-out: a page sets data-no-hotkey on <html> or <body> to keep the
       shortcut off (game, tool, or page with its own text input). */
    var palette = { state: 'idle', ret: null };   /* idle | loading | ready | failed */

    /* palette.js is fetched here, not in the HTML: its ?v= is this constant, which tools/stamp-assets.mjs rewrites to palette.js's own hash */
    var PALETTE_V = '295a31d6'; /* stamp:js/palette.js */

    function paletteSrc() {
        return 'js/palette.js?v=' + PALETTE_V;
    }

    function openPalette(ret) {
        if (window.SKPalette) { window.SKPalette.open(ret); return; }
        palette.ret = ret;   /* the latest press wins while loading */
        if (palette.state === 'failed') { window.location.href = 'search.html'; return; }
        if (palette.state === 'loading') return;
        palette.state = 'loading';
        var s = document.createElement('script');
        s.src = paletteSrc();
        s.onload = function () {
            if (!window.SKPalette) { palette.state = 'failed'; window.location.href = 'search.html'; return; }
            palette.state = 'ready';
            var back = palette.ret;
            palette.ret = null;
            window.SKPalette.open(back);
        };
        s.onerror = function () { palette.state = 'failed'; window.location.href = 'search.html'; };
        document.body.appendChild(s);
    }

    window.addEventListener('keydown', function (e) {
        if (e.defaultPrevented || e.shiftKey || e.altKey) return;
        if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
        if (document.documentElement.hasAttribute('data-no-hotkey') || (document.body && document.body.hasAttribute('data-no-hotkey'))) return;
        var searchInput = document.getElementById('srch-input');
        var active = document.activeElement;
        if (active && active !== searchInput && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)) return;
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            return;
        }
        openPalette(active);
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
    else wire();
})();
