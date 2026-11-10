/* =============================================================
   js/oksat/viewer.js — oksat-study.html boot: resolve ?m=<slug>
   against the manifest, load that module's data file, hand it to
   the engine (js/oksat/engine.js). External so the page's CSP can
   forbid inline script.

   ?m= is attacker-controllable (anyone can send a link), so it
   never reaches markup: only a manifest match selects a data file,
   and error notices are built with textContent.
   ============================================================= */
(function () {
    OKSATPrefs.mountThemeToggle(document.getElementById('theme-toggle'));
    OKSATPrefs.mountFontPicker(document.getElementById('font-picker'));

    var root = document.getElementById('root');
    function notice(title, body) {
        var box = document.createElement('div');
        box.className = 'ok-notice';
        var h = document.createElement('h1');
        h.textContent = title;
        var p = document.createElement('p');
        p.textContent = body;
        var a = document.createElement('a');
        a.href = 'oksat.html';
        a.textContent = '← Back to the self-assessment hub';
        box.appendChild(h); box.appendChild(p); box.appendChild(a);
        root.replaceChildren(box);
    }

    var slug = null;
    try { slug = new URLSearchParams(location.search).get('m'); } catch (e) { /* no-op */ }
    var manifest = window.OKSAT_MANIFEST || [];
    var entry = manifest.filter(function (m) { return m.slug === slug; })[0];
    if (!entry) { notice('Module not found', 'No study module matches “' + (slug || '') + '”.'); return; }

    var sk = window.OKSAT_SKOTO, bar = document.querySelector('.ok-topbar-actions');
    if (sk && sk.live === true && sk.maps && sk.maps[entry.subspecialty] && bar) {
        var a = document.createElement('a');
        a.className = 'ok-back';
        a.textContent = 'Read the map in sk.oto';
        a.href = sk.base + sk.maps[entry.subspecialty];
        a.target = '_blank';
        a.rel = 'noopener';
        a.style.marginRight = '0.5rem';
        bar.insertBefore(a, bar.firstChild);
    }
    document.title = entry.title + ' · OKSAT | skflx.MD';
    var s = document.createElement('script');
    s.src = entry.data;
    s.onload = function () {
        var mod = window.__MCQ_MODULE;
        try { delete window.__MCQ_MODULE; } catch (e) { window.__MCQ_MODULE = undefined; }
        if (!mod) { notice('Module failed to load', 'The data for “' + entry.title + '” did not register correctly.'); return; }
        if (entry.draft === true && root.parentNode) {
            var d = document.createElement('p');
            d.className = 'ok-draft-note';
            d.textContent = 'Draft: this module is still being built and checked. Questions may change and are not yet verified by the owner; not a clinical reference.';
            root.parentNode.insertBefore(d, root);
        }
        window.mountOKSAT(root, mod, entry, OKSATStore.reviewer());
    };
    s.onerror = function () { notice('Module failed to load', 'Could not fetch the data file for “' + entry.title + '”.'); };
    document.body.appendChild(s);
})();
