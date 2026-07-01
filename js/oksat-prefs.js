/* =============================================================
   OKSAT preferences — font theme + day/night wiring.
   Font themes are pure CSS attribute switches ([data-font] in
   css/oksat.css); this module persists the choice (oksat:font),
   applies it on load, and renders the "Aa" picker in the topbar.
   The day/night toggle shares the site-wide sk_theme key.
   ============================================================= */
(function () {
  var FONT_KEY = 'oksat:font';
  var THEMES = [
    { id: 'manuscript',  name: 'Manuscript',  hint: 'Fraunces · Crimson Pro' },
    { id: 'clinical',    name: 'Clinical',    hint: 'Inter' },
    { id: 'atlas',       name: 'Atlas',       hint: 'IBM Plex · JetBrains' },
    { id: 'hyperlegible', name: 'Hyperlegible', hint: 'Atkinson' },
  ];

  function get(key, fb) { try { return localStorage.getItem(key) || fb; } catch (e) { return fb; } }
  function set(key, v) { try { localStorage.setItem(key, v); } catch (e) {} }

  function currentFont() {
    var f = get(FONT_KEY, 'manuscript');
    return THEMES.some(function (t) { return t.id === f; }) ? f : 'manuscript';
  }
  function applyFont(id) {
    document.documentElement.setAttribute('data-font', id);
    set(FONT_KEY, id);
  }
  applyFont(currentFont());

  /* ---- "Aa" popover picker. `host` must be position:relative-able. ---- */
  function mountFontPicker(host) {
    if (!host) return;
    host.style.position = 'relative';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ok-roundbtn';
    btn.setAttribute('aria-label', 'Choose font theme');
    btn.setAttribute('aria-haspopup', 'true');
    btn.textContent = 'Aa';
    host.appendChild(btn);

    var pop = null;
    function close() { if (pop) { pop.remove(); pop = null; document.removeEventListener('click', onDoc, true); } }
    function onDoc(e) { if (pop && !pop.contains(e.target) && e.target !== btn) close(); }
    function open() {
      pop = document.createElement('div');
      pop.className = 'ok-popover';
      pop.setAttribute('role', 'menu');
      var active = currentFont();
      THEMES.forEach(function (t) {
        var it = document.createElement('button');
        it.type = 'button';
        it.className = 'ok-popover-item' + (t.id === active ? ' active' : '');
        it.innerHTML = '<span class="name">' + t.name + '</span><span class="hint">' + t.hint + '</span>';
        it.querySelector('.name').style.fontFamily = 'var(--ok-font-display)';
        it.addEventListener('click', function () { applyFont(t.id); close(); });
        pop.appendChild(it);
      });
      host.appendChild(pop);
      document.addEventListener('click', onDoc, true);
    }
    btn.addEventListener('click', function () { pop ? close() : open(); });
  }

  /* ---- Day/night toggle (site-wide sk_theme key, set pre-paint by pages). ---- */
  function mountThemeToggle(btn) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      try { localStorage.setItem('sk_theme', cur); } catch (e) {}
      document.dispatchEvent(new CustomEvent('oksat:theme', { detail: cur }));
    });
  }

  window.OKSATPrefs = {
    THEMES: THEMES,
    currentFont: currentFont,
    applyFont: applyFont,
    mountFontPicker: mountFontPicker,
    mountThemeToggle: mountThemeToggle,
  };
})();
