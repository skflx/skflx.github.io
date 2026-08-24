/* =============================================================
   oksat-atlas.js — module loader shim.

   Exposes window.OKSATAtlas.loadModules() — used by oksat-adaptive.js
   and oksat-dashboard.js to load all MCQ module scripts without the
   graph engine. Self-contained; no KAG or graph dependencies.
   ============================================================= */
(function () {
  'use strict';

  var moduleCache = {}; // slug → { meta, DOMAINS, CONCEPTS, ITEMS }

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
          .catch(function () {})
          .then(function () {
            try { delete window.__MCQ_MODULE; } catch (e) { window.__MCQ_MODULE = undefined; }
          });
      });
    });
    return chain.then(function () { return moduleCache; });
  }

  window.OKSATAtlas = { modules: moduleCache, loadModules: loadModules };
})();
