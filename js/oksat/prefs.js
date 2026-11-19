/* =============================================================
   OKSAT preferences — font theme + day/night wiring.
   Font themes are pure CSS attribute switches ([data-font] in
   css/oksat.css); this module persists an explicit choice
   (oksat:typeface), applies it, and renders the "Aa" picker in the
   topbar. js/theme-boot.js applies the stored choice pre-paint.
   Only an explicit pick is written, so a future change of default
   reaches everyone who never chose. The day/night toggle shares the
   site-wide sk_theme key.
   ============================================================= */
(function () {
  var FONT_KEY = 'oksat:typeface';
  var DEFAULT = 'instrument';
  var THEMES = [
    { id: 'instrument',  name: 'Instrument',  hint: 'Archivo · Plex Mono' },
    { id: 'clinical',    name: 'Clinical',    hint: 'Inter' },
    { id: 'atlas',       name: 'Atlas',       hint: 'IBM Plex · JetBrains' },
    { id: 'hyperlegible', name: 'Hyperlegible', hint: 'Atkinson' },
  ];

  function get(key, fb) { try { return localStorage.getItem(key) || fb; } catch (e) { return fb; } }
  function set(key, v) { try { localStorage.setItem(key, v); } catch (e) {} }

  function currentFont() {
    var f = get(FONT_KEY, DEFAULT);
    return THEMES.some(function (t) { return t.id === f; }) ? f : DEFAULT;
  }
  function showFont(id) { document.documentElement.setAttribute('data-font', id); }
  function applyFont(id) { showFont(id); set(FONT_KEY, id); }
  showFont(currentFont());

  /* ---- "Aa" popover: type themes, plus any page actions in `extra`
     ([{ id, label, hint, onClick }]: the hub's progress and backup dialog),
     so display and data settings share one control. `host` must be
     position:relative-able. ---- */
  function mountFontPicker(host, extra) {
    if (!host) return;
    host.style.position = 'relative';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ok-roundbtn';
    btn.setAttribute('aria-label', extra && extra.length ? 'Type and settings' : 'Choose font theme');
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Aa';
    host.appendChild(btn);

    var pop = null;
    function close() { if (pop) { pop.remove(); pop = null; btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', onDoc, true); } }
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
      (extra || []).forEach(function (x) {
        var it = document.createElement('button');
        it.type = 'button';
        it.className = 'ok-popover-item ok-popover-item--action';
        if (x.id) it.id = x.id;
        var n = document.createElement('span');
        n.className = 'name';
        n.textContent = x.label;
        it.appendChild(n);
        if (x.hint) {
          var hn = document.createElement('span');
          hn.className = 'hint';
          hn.textContent = x.hint;
          it.appendChild(hn);
        }
        it.addEventListener('click', function () { close(); x.onClick(); });
        pop.appendChild(it);
      });
      btn.setAttribute('aria-expanded', 'true');
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
      btn.setAttribute('aria-pressed', cur === 'dark' ? 'true' : 'false');
      try { localStorage.setItem('sk_theme', cur); } catch (e) {}
    });
    btn.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
  }

  /* ---- Top bar: the current page as the last crumb, and the sk.oto map link.
     Text only (textContent); `href` comes from OKSAT_SKOTO, never the URL. ---- */
  function setCrumb(text) {
    var li = document.getElementById('ok-crumb-here');
    if (!li || !text) return;
    li.textContent = String(text).replace(/\s*\n\s*/g, ' ');
    li.title = li.textContent;
    li.hidden = false;
  }
  function mountSkoto(subspecialty) {
    var sk = window.OKSAT_SKOTO, bar = document.querySelector('.ok-topbar-actions');
    if (!(sk && sk.live === true && sk.maps && sk.maps[subspecialty] && bar)) return;
    var a = document.createElement('a');
    a.className = 'ok-topbar-link ok-skoto';
    a.textContent = 'sk.oto map ↗';
    a.setAttribute('aria-label', 'Read the map in sk.oto (opens in a new tab)');
    a.href = sk.base + sk.maps[subspecialty];
    a.target = '_blank';
    a.rel = 'noopener';
    bar.insertBefore(a, bar.firstChild);
  }

  window.OKSATPrefs = {
    setCrumb: setCrumb,
    mountSkoto: mountSkoto,
    THEMES: THEMES,
    currentFont: currentFont,
    applyFont: applyFont,
    mountFontPicker: mountFontPicker,
    mountThemeToggle: mountThemeToggle,
  };
})();
