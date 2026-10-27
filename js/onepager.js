/* =============================================================
   skflx.MD — one-pager behavior
   - Residency year: advances itself every July 1
   - Section nav: marks the section currently in view
   - Folding sections: Tools, Work, Research and Off hours start
     closed and open from their heads; a link or deep link to one
     (#work, #research…) opens it first
   Theme toggle lives in js/site.js; the initial theme is applied
   pre-paint by js/theme-boot.js.
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

    /* Folding: css/onepager.css hides a closed .block[data-fold]'s
       .block-body pre-paint, keyed on the (scripting) media query. A
       browser without that query shows every section open, so its head
       buttons go back to plain text there. */
    function setOpen(block, open) {
        block.classList.toggle('is-open', open);
        var b = block.querySelector('.block-toggle');
        if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openFor(hash) {
        if (!hash || hash.charAt(0) !== '#' || hash.length < 2) return;
        var el = null;
        try { el = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return; }
        var block = el && el.closest ? el.closest('.block[data-fold]') : null;
        if (block && !block.classList.contains('is-open')) setOpen(block, true);
    }

    function wireFolds() {
        if (!(window.matchMedia && window.matchMedia('(scripting: enabled)').matches)) {
            document.querySelectorAll('.block-toggle').forEach(function (b) {
                b.replaceWith(document.createTextNode(b.textContent));
            });
            return;
        }
        document.querySelectorAll('.block[data-fold]').forEach(function (block) {
            var b = block.querySelector('.block-toggle');
            if (!b) return;
            b.addEventListener('click', function () {
                var open = !block.classList.contains('is-open');
                setOpen(block, open);
                /* closing from deep inside a long section: bring its head back */
                if (!open && block.getBoundingClientRect().top < 0) block.scrollIntoView();
            });
        });
        /* capture, so the section is open before the browser scrolls to it */
        document.addEventListener('click', function (e) {
            var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
            if (a) openFor(a.getAttribute('href'));
        }, true);
        window.addEventListener('hashchange', function () { openFor(location.hash); });
        if (location.hash) {
            openFor(location.hash);
            var target = document.getElementById(location.hash.slice(1));
            if (target) target.scrollIntoView();
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateResidencyYear();
        try { wireFolds(); } catch (e) {
            /* never leave content shut behind a dead button */
            document.querySelectorAll('.block[data-fold]').forEach(function (b) { b.classList.add('is-open'); });
        }
        try { watchSections(); } catch (e) { /* cosmetic only */ }
    });
})();
