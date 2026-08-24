/* =============================================================
   graph-view.js — the ONE Cytoscape engine for the unified graph.

   Before this, kag.html, atlas.html, and js/oksat-atlas.js each
   re-implemented Cytoscape init, the cose-bilkent layout object, the
   node/edge style base, neighborhood-isolate spotlight, hover
   spotlight, debounced search, the ?node= deep-link, and escHtml.
   That triplication is gone: this module owns all of it once, and
   the graph "manifests differently" by swapping a LENS.

   A lens is a plain object (see js/graph-lens-*.js) that supplies
   only what differs between manifestations — element source, colors,
   layout params, tap semantics, filter controls, and panel content.
   The engine owns everything shared. Plain <script>, no build step,
   exposes window.GraphView, guards every optional hook.

   ---- Lens contract -------------------------------------------------
   lens = {
     id, label,                       // 'knowledge' | 'structural' | 'study'
     title,                           // optional topbar subtitle
     hoverSpotlight,                  // bool — dim-others-on-hover (study style)
     searchFields,                    // e.g. ['label','detail'] (default ['label'])
     source(api)      -> Promise<cytoscapeElements[]> | cytoscapeElements[],
     style(api)       -> cytoscapeStyleArray,   // node/edge colors only
     layout,                          // cose-bilkent params (name auto-falls-back to 'cose')
     onTap(node, api), onDblTap(node, api), onCxtTap(node, api), onBackgroundTap(api),
     buildDetail(node, api) -> htmlString | null,   // null => lens navigates instead of opening a panel
     buildControls(controlsEl, api),  // pills / toggles / mode buttons in the topbar slot
     onMount(api), onUnmount(api),     // attach/detach self-test overlay, settings modal, etc.
     onThemeChange(api)                // optional — re-run completion fills etc. on day/night flip
   }

   ---- Engine api (passed to every lens hook) ------------------------
   api = {
     cy, container, els{...DOM refs...},
     setLens(lens) -> Promise, currentLens() -> lens,
     focusNode(id), isolate(node), clearIsolate(),
     search(query),
     toast(msg), escHtml(s), cssVar(name, fallback),
     panel: { open(label, html) -> body, close(), isOpen() },
     setEmpty(msgOrNull),             // show/hide the #cy-empty fallback
     setStripLeft(html), setStripRight(html)   // bottom-strip text
   }
   ============================================================= */
(function () {
  'use strict';

  function cssVar(name, fb) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fb;
    } catch (e) { return fb; }
  }

  function escHtml(s) {
    return (s == null ? '' : String(s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Shared interaction classes every lens can rely on. Colors are read
     from CSS vars at build time (Cytoscape can't resolve var()). */
  function baseStyle() {
    var warning = cssVar('--warning', '#FFD43B');
    var accent = cssVar('--accent', '#4A9EFF');
    var txt = cssVar('--txt', '#E8EAF0');
    return [
      { selector: '.faded', style: { 'opacity': 0.12 } },
      { selector: '.dim', style: { 'opacity': 0.12 } },
      { selector: '.spot', style: { 'opacity': 1 } },
      { selector: '.highlighted', style: { 'border-width': 3, 'border-color': warning, 'z-index': 10 } },
      { selector: '.hit', style: { 'border-width': 3, 'border-color': accent, 'z-index': 10 } },
      { selector: ':selected', style: { 'border-width': 3, 'border-color': txt } }
    ];
  }

  function create(container, opts) {
    opts = opts || {};
    var els = opts.els || {};
    var cy = null;
    var currentLens = null;
    var searchTimer = null;

    /* ---- toast ---- */
    function toast(msg) {
      var t = els.toast;
      if (!t) return;
      t.textContent = msg;
      t.className = 'toast show';
      clearTimeout(t._t);
      t._t = setTimeout(function () { t.className = 'toast'; }, 2200);
    }

    /* ---- right detail panel shell ---- */
    var panel = {
      open: function (label, html) {
        if (!els.panel) return null;
        if (els.panelLabel) els.panelLabel.textContent = label || '';
        if (els.panelBody) els.panelBody.innerHTML = html || '';
        els.panel.classList.add('open');
        return els.panelBody;
      },
      close: function () { if (els.panel) els.panel.classList.remove('open'); },
      isOpen: function () { return !!(els.panel && els.panel.classList.contains('open')); }
    };

    /* ---- empty-state fallback ---- */
    function setEmpty(msg) {
      if (!els.empty) return;
      if (msg) { els.empty.textContent = msg; els.empty.classList.add('show'); }
      else els.empty.classList.remove('show');
    }

    /* ---- bottom strip ---- */
    function setStripLeft(html) { if (els.stripLeft) els.stripLeft.innerHTML = html || ''; }
    function setStripRight(html) { if (els.stripRight) els.stripRight.innerHTML = html || ''; }

    /* ---- neighborhood isolate (shared; replaces 3 copies) ---- */
    function isolate(node) {
      if (!cy || !node || !node.length) return;
      var hood = node.neighborhood().add(node);
      cy.elements().addClass('faded');
      hood.removeClass('faded');
    }
    function clearIsolate() { if (cy) cy.elements().removeClass('faded highlighted hit dim spot'); }

    /* ---- deep-link focus (shared; replaces kag/atlas focusNode) ---- */
    function focusNode(id) {
      if (!cy) return;
      var n = cy.getElementById(id);
      if (!n || n.empty()) { toast('Unknown node: ' + id); return; }
      isolate(n);
      var detail = currentLens && currentLens.buildDetail && currentLens.buildDetail(n, api);
      if (detail != null) panel.open(n.data('label') || id, detail);
      setTimeout(function () {
        cy.animate({ fit: { eles: n.neighborhood().add(n), padding: 80 } }, { duration: 400 });
      }, 60);
    }

    /* ---- debounced search (shared) ---- */
    function search(q) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { runSearch(q); }, 180);
    }
    function runSearch(q) {
      if (!cy) return;
      q = (q || '').trim().toLowerCase();
      cy.nodes().removeClass('highlighted faded');
      if (!q) return;
      var fields = (currentLens && currentLens.searchFields) || ['label'];
      cy.nodes().forEach(function (n) {
        var hit = false;
        for (var i = 0; i < fields.length; i++) {
          var v = n.data(fields[i]);
          if (v && String(v).toLowerCase().indexOf(q) !== -1) { hit = true; break; }
        }
        if (hit) n.addClass('highlighted'); else n.addClass('faded');
      });
    }

    /* ---- api handed to every lens hook ---- */
    var api = {
      cy: null, container: container, els: els,
      setLens: setLens, currentLens: function () { return currentLens; },
      focusNode: focusNode, isolate: isolate, clearIsolate: clearIsolate,
      search: search, toast: toast, escHtml: escHtml, cssVar: cssVar,
      panel: panel, setEmpty: setEmpty,
      setStripLeft: setStripLeft, setStripRight: setStripRight
    };

    /* ---- cytoscape instance (created once, reused across lenses) ---- */
    function ensureCy() {
      if (cy) return;
      cy = cytoscape({
        container: container, elements: [], style: baseStyle(),
        wheelSensitivity: 0.28, minZoom: 0.15, maxZoom: 4, pixelRatio: 'auto'
      });
      api.cy = cy;

      /* Handlers are bound ONCE; they read currentLens dynamically, so a
         lens swap needs no rebind. Each delegates to the active lens. */
      cy.on('tap', 'node', function (e) {
        if (currentLens && currentLens.onTap) currentLens.onTap(e.target, api);
      });
      cy.on('dbltap', 'node', function (e) {
        if (currentLens && currentLens.onDblTap) currentLens.onDblTap(e.target, api);
      });
      cy.on('cxttap', 'node', function (e) {
        if (currentLens && currentLens.onCxtTap) currentLens.onCxtTap(e.target, api);
      });
      cy.on('tap', function (e) {
        if (e.target !== cy) return;
        if (currentLens && currentLens.onBackgroundTap) currentLens.onBackgroundTap(api);
        else { clearIsolate(); panel.close(); }
      });
      /* Obsidian-style hover spotlight, opt-in per lens. */
      cy.on('mouseover', 'node', function (e) {
        if (!currentLens || !currentLens.hoverSpotlight) return;
        var hood = e.target.closedNeighborhood();
        cy.elements().addClass('dim');
        hood.removeClass('dim').addClass('spot');
      });
      cy.on('mouseout', 'node', function () {
        if (!currentLens || !currentLens.hoverSpotlight) return;
        cy.elements().removeClass('dim spot');
      });

      /* Re-skin on day/night flip: reapply base+lens style and let the
         lens repaint anything data-driven (e.g. completion fills). */
      document.addEventListener('oksat:theme', function () {
        if (!currentLens) return;
        applyStyle(currentLens);
        if (currentLens.onThemeChange) currentLens.onThemeChange(api);
      });
    }

    function layoutFor(lens) {
      var lo = Object.assign({}, lens.layout || { name: 'cose-bilkent' });
      if (lo.name === 'cose-bilkent') {
        try { cytoscape('layout', 'cose-bilkent'); }
        catch (e) { lo.name = 'cose'; } // graceful fallback if the extension didn't load
      }
      return lo;
    }

    function applyStyle(lens) {
      var extra = (lens.style && lens.style(api)) || [];
      cy.style().fromJson(baseStyle().concat(extra)).update();
    }

    /* ---- the lens lifecycle ---- */
    function setLens(lens) {
      if (!lens) return Promise.resolve();
      ensureCy();
      // tear down the previous lens
      if (currentLens && currentLens.onUnmount) {
        try { currentLens.onUnmount(api); } catch (e) { /* no-op */ }
      }
      panel.close();
      clearIsolate();
      if (els.searchInput) els.searchInput.value = '';
      if (els.controls) els.controls.innerHTML = '';
      setStripLeft(''); setStripRight('');
      setEmpty(null);

      currentLens = lens;
      if (els.title) els.title.textContent = lens.title || lens.label || '';

      return Promise.resolve(lens.source ? lens.source(api) : [])
        .then(function (elements) {
          elements = elements || [];
          cy.elements().remove();
          if (elements.length) cy.add(elements);
          applyStyle(lens);
          if (elements.length) {
            cy.layout(layoutFor(lens)).run();
            setEmpty(null);
          } else {
            setEmpty('Nothing to show in this view yet.');
          }
          if (lens.buildControls && els.controls) {
            try { lens.buildControls(els.controls, api); } catch (e) { /* no-op */ }
          }
          if (lens.onMount) { try { lens.onMount(api); } catch (e) { /* no-op */ } }
          return api;
        })
        .catch(function (err) {
          setEmpty('This view failed to load.');
          try { console.warn('[GraphView] lens "' + lens.id + '" failed:', err); } catch (e) {}
          return api;
        });
    }

    ensureCy();
    return api;
  }

  window.GraphView = { create: create, escHtml: escHtml, cssVar: cssVar };
})();
