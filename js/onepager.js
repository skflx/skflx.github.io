/* =============================================================
   skflx.MD — one-pager behavior
   - Style switch (matte / personality) + persistence
   - Day/night theme toggle + persistence
   - Residency year: advances itself every July 1
   - Deep-link: open the matching <details> when the URL has a hash
   Accordion open/close itself is native <details> — no JS needed.
   Storage keys are shared with the rest of the site: sk_style, sk_theme.
   ============================================================= */
(function () {
    var root = document.documentElement;
    var STYLES = ['matte', 'personality'];

    /* Residency: started July 1, 2024; OHNS is a five-year program, so the
       label stops climbing at PGY-5 rather than inventing a PGY-6. The HTML
       carries the current year as a static fallback for no-JS readers —
       keep the two in step if this ever needs editing by hand. */
    var RESIDENCY_START_YEAR = 2024;
    var FINAL_PGY = 5;

    function currentPGY(now) {
        now = now || new Date();
        /* The academic year turns over on July 1 (month index 6). */
        var academicYear = now.getFullYear() - (now.getMonth() < 6 ? 1 : 0);
        var level = academicYear - RESIDENCY_START_YEAR + 1;
        return Math.max(1, Math.min(FINAL_PGY, level));
    }

    function updateResidencyYear() {
        var el = document.getElementById('pgy-status');
        if (el) el.textContent = 'PGY-' + currentPGY();
    }

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
        updateResidencyYear();

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
