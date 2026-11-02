/* =============================================================
   fig3d/loader.js — wakes a [data-fig3d] figure when it scrolls
   into view. A baked poster (images/figures/<id>-{light,dark}.webp)
   shows until then, and stays if WebGL or the renderer is
   unavailable: this module never reports a failure. Contract:
   plans/2026-10-28-figures-eggs-atlas.md section 4.3.
   Needs js/ascii3d.js and the figure's scene script on the page.
   ============================================================= */
(function () {
    var figs;
    try { figs = Array.prototype.slice.call(document.querySelectorAll('[data-fig3d]')); } catch (e) { return; }
    if (!figs.length) return;

    /* The poster follows html[data-theme] as well as the OS: the dark
       <source> applies when the theme is dark, never when it is light. */
    function syncPosters() {
        try {
            var theme = document.documentElement.getAttribute('data-theme');
            if (theme !== 'dark' && theme !== 'light') return;
            figs.forEach(function (f) {
                Array.prototype.forEach.call(f.querySelectorAll('.fig3d-poster source'), function (s) {
                    s.media = theme === 'dark' ? 'all' : 'not all';
                });
            });
        } catch (e) { /* no-op */ }
    }
    syncPosters();
    try {
        new MutationObserver(syncPosters).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch (e) { /* no-op */ }

    function webgl() {
        try {
            var c = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
        } catch (e) { return false; }
    }
    if (!webgl()) return;

    var renderer = null;
    function start(fig) {
        if (!renderer) {
            renderer = import('./render.js?v=07db1bf2').catch(function () { return null; });
        }
        renderer.then(function (mod) {
            try { if (mod && mod.mount) mod.mount(fig); } catch (e) { /* the poster stays */ }
        });
    }

    if (!('IntersectionObserver' in window)) { figs.forEach(start); return; }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            start(en.target);
        });
    }, { rootMargin: '200px' });
    figs.forEach(function (f) { io.observe(f); });
})();
