/* =============================================================
   skflx.MD — one-pager behavior
   - Day/night theme toggle + persistence (sk_theme)
   - Deep-link: open the matching <details> when the URL has a hash
   Accordion open/close itself is native <details> — no JS needed.

   The visitor-selectable style switcher (matte / personality) was
   retired when the site moved to a single Lightbox identity; the
   sk_style key is no longer read or written, and is cleaned up
   below so old visitors don't carry a dead entry forever.
   ============================================================= */
(function () {
    var root = document.documentElement;

    function setTheme(theme) {
        theme = theme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('sk_theme', theme); } catch (e) {}
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

    /* One-time cleanup of the retired style key. Fail-safe: a storage
       error here must never stop the page booting. */
    try { localStorage.removeItem('sk_style'); } catch (e) {}
    root.removeAttribute('data-style');

    document.addEventListener('DOMContentLoaded', function () {
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
