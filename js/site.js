/* =============================================================
   site.js — shared site chrome behaviour for skflx.MD tools.
   Day/night toggle wired to the same localStorage key OKSAT uses
   ('sk_theme') and the html[data-theme] attribute that css/site.css
   (and css/oksat.css) key off. Loaded as a plain <script> on every
   tool page; no dependencies, no build step. Binds every element
   with class .site-theme-toggle. Defensive throughout.
   ============================================================= */
(function () {
  'use strict';

  function applyTheme(t) {
    try { document.documentElement.setAttribute('data-theme', t); } catch (e) { /* no-op */ }
  }

  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    try { t = localStorage.getItem('sk_theme'); } catch (e) { t = null; }
    if (t) return t;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function toggle() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('sk_theme', next); } catch (e) { /* no-op */ }
    try { document.dispatchEvent(new CustomEvent('oksat:theme', { detail: { theme: next } })); } catch (e) { /* no-op */ }
  }

  function wire() {
    // Make sure the root carries an explicit theme so the first toggle is never a no-op.
    if (!document.documentElement.getAttribute('data-theme')) applyTheme(currentTheme());
    var btns = document.querySelectorAll('.site-theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].__siteWired) continue;
      btns[i].__siteWired = true;
      btns[i].addEventListener('click', toggle);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.SiteChrome = {
    toggle: toggle,
    setTheme: function (t) { applyTheme(t); try { localStorage.setItem('sk_theme', t); } catch (e) { /* no-op */ } },
    currentTheme: currentTheme,
  };
})();
