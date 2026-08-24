/* =============================================================
   oksat-atlas.js — compatibility shim.

   The OKSAT hub graph is now the STUDY lens of the unified graph
   engine (js/graph-view.js + js/graph-lens-study.js). Its former
   rendering code (buildElements / styleFor / paintCompletion / the
   Cytoscape mount) lived here and in kag.html and atlas.html — that
   triplication is gone; the study lens owns it once.

   This file remains only so existing callers keep working:
   - window.OKSATAtlas.loadModules() — used by js/oksat-adaptive.js and
     js/oksat-dashboard.js (pages that do NOT load the graph engine), so
     it stays SELF-CONTAINED here.
   - window.OKSATAtlas.mount(container, opts) — used by oksat.html's
     Atlas tab; it now DELEGATES to GraphView + the study lens. oksat.html
     lazy-loads graph-view.js + graph-lens-study.js before calling mount.
   ============================================================= */
(function () {
  'use strict';

  var moduleCache = {}; // slug → { meta, DOMAINS, CONCEPTS, ITEMS }

  /* Modules register via window.__MCQ_MODULE. They are plain scripts with
     top-level consts, which would collide if injected as <script> tags on
     one page — so fetch the source and run each in its own function scope.
     Kept here (not delegated to the study lens) because oksat-adaptive.html
     and the dashboard load this file WITHOUT the graph engine. */
  function loadModules() {
    var entries = window.OKSAT_MANIFEST || [];
    var chain = Promise.resolve();
    entries.forEach(function (entry) {
      chain = chain.then(function () {
        if (moduleCache[entry.slug]) return;
        return fetch(entry.data)
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(function (src) {
            new Function(src)(); // sets window.__MCQ_MODULE in its own scope
            if (window.__MCQ_MODULE) moduleCache[entry.slug] = window.__MCQ_MODULE;
          })
          .catch(function () {}) // skip a broken module, keep going
          .then(function () {
            try { delete window.__MCQ_MODULE; } catch (e) { window.__MCQ_MODULE = undefined; }
          });
      });
    });
    return chain.then(function () { return moduleCache; });
  }

  /* Delegate the visual mount to the unified engine + study lens. The api is
     created once and reused: re-mounts (e.g. reviewer change) just re-run
     setContext + setLens, which rebuilds the elements — no destroy needed. */
  var _api = null;
  var _searchWired = false;

  function mount(container, opts) {
    opts = opts || {};
    if (!(window.GraphView && window.GraphLenses && window.GraphLenses.study)) {
      return Promise.resolve(null);
    }
    var study = window.GraphLenses.study;
    if (typeof study.setContext === 'function') {
      study.setContext({ reviewer: opts.reviewer, completion: opts.completion });
    }
    if (!_api) {
      _api = window.GraphView.create(container, { els: { searchInput: opts.searchInput } });
    }
    if (opts.searchInput && !_searchWired) {
      _searchWired = true;
      opts.searchInput.addEventListener('input', function () { _api.search(this.value); });
    }
    return _api.setLens(study).then(function () { return _api.cy; });
  }

  window.OKSATAtlas = { mount: mount, modules: moduleCache, loadModules: loadModules };
})();
