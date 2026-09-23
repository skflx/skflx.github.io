/* =============================================================
   theme-boot.js — pre-paint theme, loaded synchronously in <head>
   on every page so the first frame is already in the right theme.
   Reads sk_theme (falls back to prefers-color-scheme). On OKSAT
   pages (html carries data-font) it also applies the stored
   typeface (oksat:typeface). External rather than inline so the
   pages' Content-Security-Policy can forbid inline script.
   ============================================================= */
(function () {
    var root = document.documentElement;
    var theme = 'light';
    try {
        var t = localStorage.getItem('sk_theme');
        if (t === 'dark' || t === 'light') theme = t;
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
    } catch (e) { /* storage blocked: keep light */ }
    root.setAttribute('data-theme', theme);

    if (root.hasAttribute('data-font')) {
        try {
            var f = localStorage.getItem('oksat:typeface');
            if (f) root.setAttribute('data-font', f);
        } catch (e) { /* keep the page default */ }
    }
})();
