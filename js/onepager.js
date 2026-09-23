/* =============================================================
   skflx.MD — one-pager behavior
   - Residency year: advances itself every July 1
   - Section nav: marks the section currently in view
   Theme toggle lives in js/site.js; the initial theme is applied
   pre-paint by js/theme-boot.js. Hash deep-links (#about, #work…)
   are plain anchors and need no script.
   ============================================================= */
(function () {
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

    /* Scroll-spy: the nav link for the section nearest the top of the
       viewport gets aria-current. Purely cosmetic — skipped if the
       browser lacks IntersectionObserver. */
    function watchSections() {
        if (!('IntersectionObserver' in window)) return;
        var links = {};
        document.querySelectorAll('.op-nav a[href^="#"]').forEach(function (a) {
            links[a.getAttribute('href').slice(1)] = a;
        });
        var visible = {};
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
            var current = null;
            Object.keys(links).forEach(function (id) { if (!current && visible[id]) current = id; });
            Object.keys(links).forEach(function (id) {
                if (id === current) links[id].setAttribute('aria-current', 'true');
                else links[id].removeAttribute('aria-current');
            });
        }, { rootMargin: '-80px 0px -55% 0px' });
        Object.keys(links).forEach(function (id) {
            var sec = document.getElementById(id);
            if (sec) io.observe(sec);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateResidencyYear();
        try { watchSections(); } catch (e) { /* cosmetic only */ }
    });
})();
