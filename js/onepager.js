/* =============================================================
   skflx.MD — one-pager behavior
   - Style switch (matte / personality) + persistence
   - Day/night theme toggle + persistence
   - Deep-link: open the matching <details> when the URL has a hash
   Accordion open/close itself is native <details> — no JS needed.
   Storage keys are shared with the rest of the site: sk_style, sk_theme.
   ============================================================= */
(function () {
    var root = document.documentElement;
    var STYLES = ['matte', 'personality'];

    function setStyle(style) {
        if (STYLES.indexOf(style) === -1) style = 'matte';
        root.setAttribute('data-style', style);
        try { localStorage.setItem('sk_style', style); } catch (e) {}
        syncStyleButtons(style);
    }

    function setTheme(theme) {
        theme = theme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('sk_theme', theme); } catch (e) {}
    }

    function syncStyleButtons(style) {
        document.querySelectorAll('[data-set-style]').forEach(function (btn) {
            btn.setAttribute('aria-pressed', btn.getAttribute('data-set-style') === style ? 'true' : 'false');
        });
    }

    function openFromHash() {
        var id = (location.hash || '').replace('#', '');
        if (!id) return;
        var el = document.getElementById(id);
        if (el && el.tagName.toLowerCase() === 'details') {
            el.open = true;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        syncStyleButtons(root.getAttribute('data-style') || 'matte');

        document.querySelectorAll('[data-set-style]').forEach(function (btn) {
            btn.addEventListener('click', function () { setStyle(btn.getAttribute('data-set-style')); });
        });

        var themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', function () {
                setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
            });
        }

        openFromHash();
    });

    window.addEventListener('hashchange', openFromHash);
})();
