/* =============================================================
   graph-lens-structural.js — the Structural manifestation.

   FULL PORT of atlas.html's inline IIFE into the js/graph-view.js
   lens contract. The engine owns the single Cytoscape instance,
   tap/dbltap/background binding, neighborhood isolate, debounced
   search (we only declare searchFields), the ?node= deep-link,
   theme re-skin, the toast, and the right-panel shell. This lens
   supplies only what is structural:

     • the structural vocabulary (structure classes, regions, edge
       headings) ported verbatim from atlas.html:606-644;
     • the structural SUBSET of data/kag-graph.json (nodes whose
       `structure` is in the currently-active set + de-dangled edges);
     • structure-colored nodes via the --struct-* CSS tokens;
     • a topbar Region navigator (multi-select pills that FADE
       non-matching nodes — never a rebuild) and Structure toggles
       that double as a colored legend (toggling REBUILDS the subset);
     • a full detail panel with grouped relationships, OKSAT practice
       chips, and an "Open in Knowledge" link that now points at
       graph.html?lens=knowledge&node=<id> (replacing the old
       kag.html?node= link).

   Registers on window.GraphLenses.structural. Plain IIFE, no build
   step, every optional global guarded.
   ============================================================= */
(function () {
  'use strict';

  /* ── Structural vocabulary (ported from atlas.html:606-644) ── */
  // Only nodes whose `structure` is one of these are ever shown.
  var STRUCTURES = ['bone', 'cartilage', 'ligament', 'fascia', 'joint', 'foramen', 'space', 'membrane', 'muscle'];
  var STRUCTURE_LABELS = {
    bone: 'Bone', cartilage: 'Cartilage', ligament: 'Ligament', fascia: 'Fascia',
    joint: 'Joint', foramen: 'Foramen', space: 'Space', membrane: 'Membrane', muscle: 'Muscle'
  };
  // Fallback hues (the real colors come from --struct-* CSS tokens).
  var STRUCTURE_FALLBACK = {
    bone: '#E8C170', cartilage: '#6BC5D2', ligament: '#C58BE0', fascia: '#8FBF7F',
    joint: '#FF9F68', foramen: '#7FA6FF', space: '#9CA3B0', membrane: '#E58FB0', muscle: '#F07070'
  };
  // Default-ON structure classes (others toggleable but hidden at boot).
  var DEFAULT_ON = ['bone', 'cartilage', 'ligament', 'fascia', 'joint'];

  // Canonical region order (only those actually present get a pill).
  var REGION_ORDER = ['temporal-bone', 'skull-base', 'facial-skeleton', 'nasal-sinus',
    'larynx', 'neck', 'oral-pharynx', 'cervical-spine-hyoid', 'external-ear'];
  var REGION_LABELS = {
    'temporal-bone': 'Temporal bone', 'skull-base': 'Skull base',
    'facial-skeleton': 'Facial skeleton', 'nasal-sinus': 'Nasal / sinus',
    'larynx': 'Larynx', 'neck': 'Neck', 'oral-pharynx': 'Oral / pharynx',
    'cervical-spine-hyoid': 'Cervical spine / hyoid', 'external-ear': 'External ear'
  };

  // Structural edge vocabulary + friendly headings (unknown types -> "Related").
  var STRUCT_EDGE_TYPES = ['articulates_with', 'attaches_to', 'part_of', 'bounded_by',
    'continuous_with', 'passes_through', 'transmits', 'suspends', 'forms'];
  var EDGE_HEADINGS = {
    articulates_with: 'Articulates with', attaches_to: 'Attaches to', part_of: 'Part of',
    bounded_by: 'Bounded by', continuous_with: 'Continuous with', transmits: 'Transmits',
    passes_through: 'Passes through', suspends: 'Suspends', forms: 'Forms'
  };
  var HEADING_ORDER = ['part_of', 'articulates_with', 'attaches_to', 'bounded_by',
    'continuous_with', 'forms', 'suspends', 'passes_through', 'transmits', 'Related'];

  var LAYOUT = {
    name: 'cose-bilkent', animate: false, nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 120, nodeRepulsion: 8000, gravity: 0.25, numIter: 2500
  };

  function esc(s) { return window.GraphView.escHtml(s); }
  function inSet(set, v) { return set.indexOf(v) !== -1; }

  /* ── Module-level state ── */
  var graph = { nodes: [], edges: [] };   // full merged graph (nodes + edges)
  var activeStructures = DEFAULT_ON.slice();  // which classes are shown
  var activeRegions = [];                     // empty = All
  var presentStructures = [];                 // structure classes that have nodes
  var presentRegions = [];                    // regions that have nodes
  // topbar control refs (so we can re-render struct pills after a reveal)
  var _structWrap = null, _regionWrap = null, _regionAllBtn = null;

  /* ── Build the structural cytoscape subset (atlas.html:674-693) ── */
  // Keep structural nodes whose `structure` is in `active`; keep edges whose
  // BOTH endpoints are kept; degree-size the survivors.
  function buildElements(g, active) {
    var nodes = (g.nodes || []).filter(function (n) {
      return n && n.structure && inSet(STRUCTURES, n.structure) && inSet(active, n.structure);
    });
    var keep = {};
    nodes.forEach(function (n) { keep[n.id] = true; });
    var shownEdges = (g.edges || []).filter(function (e) { return e && keep[e.source] && keep[e.target]; });
    var deg = {};
    shownEdges.forEach(function (e) {
      deg[e.source] = (deg[e.source] || 0) + 1;
      deg[e.target] = (deg[e.target] || 0) + 1;
    });
    var maxDeg = Math.max.apply(null, Object.keys(deg).map(function (k) { return deg[k]; }).concat([1]));
    var els = nodes.map(function (n) {
      var d = deg[n.id] || 0;
      return { data: Object.assign({}, n, { nodeSize: 20 + Math.round((d / maxDeg) * 40) }) };
    });
    shownEdges.forEach(function (e) {
      els.push({ data: Object.assign({}, e, { id: e.source + '->' + e.target + '_' + e.type }) });
    });
    return els;
  }

  /* All structural nodes regardless of the active toggle set. */
  function structuralNodes(g) {
    return (g.nodes || []).filter(function (n) { return n && n.structure && inSet(STRUCTURES, n.structure); });
  }

  /* ── source(): fetch + merge, then reset toggles to defaults and
        return the structural subset for the currently-active set. ── */
  function source(api) {
    if (!window.KAGStore) { graph = { nodes: [], edges: [] }; return []; }
    return window.KAGStore.fetch().then(function (file) {
      graph = (file && file.nodes && file.edges) ? window.KAGStore.merge(file) : { nodes: [], edges: [] };

      var sn = structuralNodes(graph);
      // present sets, in canonical order
      var presS = {}; sn.forEach(function (n) { presS[n.structure] = true; });
      presentStructures = STRUCTURES.filter(function (k) { return presS[k]; });
      var presR = {}; sn.forEach(function (n) { if (n.region) presR[n.region] = true; });
      presentRegions = REGION_ORDER.filter(function (r) { return presR[r]; });
      // extra (non-canonical) regions still get a pill, appended
      Object.keys(presR).forEach(function (r) { if (presentRegions.indexOf(r) === -1) presentRegions.push(r); });

      // reset toggles to defaults ∩ present; if that's empty, show everything present
      activeStructures = DEFAULT_ON.filter(function (k) { return presS[k]; });
      if (activeStructures.length === 0) activeStructures = presentStructures.slice();
      activeRegions = [];

      return buildElements(graph, activeStructures);
    });
  }

  /* ── style(): structure-colored nodes via --struct-* tokens.
        Base interaction classes (.faded/.highlighted/:selected) are
        owned by the engine and NOT redefined here. ── */
  function style(api) {
    var cv = api.cssVar;
    var base = [
      { selector: 'node', style: {
        'label': 'data(label)', 'font-size': '10px', 'font-family': 'IBM Plex Sans, sans-serif',
        'color': cv('--txt', '#E8EAF0'), 'text-valign': 'bottom', 'text-margin-y': 6,
        'width': 'data(nodeSize)', 'height': 'data(nodeSize)', 'text-max-width': 100,
        'text-wrap': 'ellipsis', 'border-width': 0, 'overlay-opacity': 0,
        'background-color': cv('--struct-space', '#9CA3B0')
      } },
      { selector: 'edge', style: {
        'line-color': cv('--border', '#333842'), 'target-arrow-color': cv('--border', '#333842'),
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'width': 1.5,
        'label': 'data(type)', 'font-size': '8px', 'font-family': 'JetBrains Mono, monospace',
        'color': cv('--txt3', '#5C6370'), 'text-rotation': 'autorotate', 'text-margin-y': -8, 'arrow-scale': 0.8
      } }
    ];
    STRUCTURES.forEach(function (k) {
      base.push({
        selector: 'node[structure="' + k + '"]',
        style: { 'background-color': cv('--struct-' + k, STRUCTURE_FALLBACK[k]) }
      });
    });
    return base;
  }

  /* ── Region navigator — multi-select FADE (never a rebuild) ──
        Ported from atlas.html:755-787, operating on api.cy's .faded. ── */
  function applyRegionFilter(api) {
    if (!api.cy) return;
    if (activeRegions.length === 0) { api.cy.nodes().removeClass('faded'); return; }
    api.cy.nodes().forEach(function (n) {
      if (inSet(activeRegions, n.data('region'))) n.removeClass('faded');
      else n.addClass('faded');
    });
  }

  function renderRegionPills(api) {
    if (!_regionWrap) return;
    _regionWrap.innerHTML = '';
    var allBtn = document.createElement('button');
    allBtn.className = 'pill' + (activeRegions.length === 0 ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', function () {
      activeRegions = [];
      _regionWrap.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
      allBtn.classList.add('active');
      applyRegionFilter(api);
    });
    _regionWrap.appendChild(allBtn);
    _regionAllBtn = allBtn;

    presentRegions.forEach(function (r) {
      var b = document.createElement('button');
      b.className = 'pill' + (inSet(activeRegions, r) ? ' active' : '');
      b.textContent = REGION_LABELS[r] || r;
      b.addEventListener('click', function () {
        var i = activeRegions.indexOf(r);
        if (i !== -1) { activeRegions.splice(i, 1); b.classList.remove('active'); }
        else { activeRegions.push(r); b.classList.add('active'); }
        allBtn.classList.toggle('active', activeRegions.length === 0);
        applyRegionFilter(api);
      });
      _regionWrap.appendChild(b);
    });
  }

  /* ── Structure toggles that double as a legend ──
        Ported from atlas.html:790-806. Toggling REBUILDS the subset. ── */
  function renderStructPills(api) {
    if (!_structWrap) return;
    _structWrap.innerHTML = '';
    presentStructures.forEach(function (k) {
      var on = inSet(activeStructures, k);
      var color = api.cssVar('--struct-' + k, STRUCTURE_FALLBACK[k]);
      var b = document.createElement('button');
      b.className = 'pill' + (on ? ' active' : '');
      if (!on) b.style.opacity = '0.45';
      b.innerHTML = '<span class="swatch" style="background:' + color + '"></span>' + esc(STRUCTURE_LABELS[k] || k);
      b.addEventListener('click', function () {
        var i = activeStructures.indexOf(k);
        if (i !== -1) { activeStructures.splice(i, 1); b.classList.remove('active'); b.style.opacity = '0.45'; }
        else { activeStructures.push(k); b.classList.add('active'); b.style.opacity = ''; }
        rebuild(api);
      });
      _structWrap.appendChild(b);
    });
  }

  /* Run the structural layout with the engine's cose-bilkent → cose fallback. */
  function runLayout(api) {
    var lo = Object.assign({}, LAYOUT);
    if (typeof cytoscape === 'function') {
      try { cytoscape('layout', 'cose-bilkent'); } catch (e) { lo.name = 'cose'; }
    }
    api.cy.layout(lo).run();
  }

  /* Rebuild the cytoscape subset from the active structure set. */
  function rebuild(api) {
    api.cy.elements().remove();
    api.cy.add(buildElements(graph, activeStructures));
    runLayout(api);
    applyRegionFilter(api);
    updateStrip(api);
  }

  function updateStrip(api) {
    var nc = api.cy.nodes().length, ec = api.cy.edges().length;
    api.setStripLeft(nc + ' structures · ' + ec + ' relationships');
    api.setStripRight(structuralNodes(graph).length + ' structural nodes');
  }

  /* ── buildControls(): region navigator + structure legend/toggles ── */
  function buildControls(el, api) {
    el.innerHTML = '';
    _regionWrap = document.createElement('div');
    _regionWrap.className = 'pills';
    _structWrap = document.createElement('div');
    _structWrap.className = 'pills';
    el.appendChild(_regionWrap);
    el.appendChild(_structWrap);
    renderRegionPills(api);
    renderStructPills(api);
    updateStrip(api);
  }

  /* ── Detail panel — FULL port of atlas.html:832-917 ── */
  function buildDetail(node, api) {
    var id = node.id();
    var n = null, i;
    for (i = 0; i < (graph.nodes || []).length; i++) { if (graph.nodes[i].id === id) { n = graph.nodes[i]; break; } }
    if (!n) return null;

    var color = api.cssVar('--struct-' + n.structure, STRUCTURE_FALLBACK[n.structure] || '#9CA3B0');
    var sLabel = STRUCTURE_LABELS[n.structure] || n.structure;

    var html = '<div style="margin-bottom:0.75rem">';
    html += '<span class="badge" style="background:' + color + ';color:#12141a">' + esc(sLabel) + '</span>';
    if (n.region) html += '<span class="badge badge-sub">' + esc(REGION_LABELS[n.region] || n.region) + '</span>';
    if (n.laterality) html += '<span class="badge badge-sub">' + esc(n.laterality) + '</span>';
    html += '</div>';

    if (n.aliases && n.aliases.length) {
      html += '<div class="rp-section"><div class="rp-section-title">Also known as</div>' +
        '<div style="font-size:0.78rem;color:var(--txt2)">' + n.aliases.map(esc).join(' · ') + '</div></div>';
    }

    if (n.detail) {
      html += '<div class="rp-section"><div class="rp-section-title">Clinical Detail</div>' +
        '<div class="rp-detail">' + esc(n.detail) + '</div></div>';
    }

    // Full-graph indexes so relationships to NON-structural targets (a nerve a
    // foramen transmits, a vessel it supplies) are never hidden.
    var allById = {};
    (graph.nodes || []).forEach(function (x) { if (x && x.id) allById[x.id] = x; });
    var structById = {};
    structuralNodes(graph).forEach(function (x) { structById[x.id] = true; });

    var groups = {};
    (graph.edges || []).forEach(function (e) {
      if (!e || (e.source !== id && e.target !== id)) return;
      var outgoing = e.source === id;
      var otherId = outgoing ? e.target : e.source;
      var other = allById[otherId];
      if (!other) return;
      var heading = EDGE_HEADINGS[e.type] ? e.type : 'Related';
      (groups[heading] = groups[heading] || []).push({
        otherId: otherId, outgoing: outgoing, direction: e.direction || '',
        label: other.label || otherId, structural: !!structById[otherId]
      });
    });
    var orderedKeys = HEADING_ORDER.filter(function (k) { return groups[k]; });
    Object.keys(groups).forEach(function (k) { if (orderedKeys.indexOf(k) === -1) orderedKeys.push(k); });
    orderedKeys.forEach(function (k) {
      var title = EDGE_HEADINGS[k] || 'Related';
      html += '<div class="rp-section"><div class="rp-section-title">' + esc(title) + '</div>';
      groups[k].forEach(function (item) {
        var arrow = item.outgoing ? '→' : '←';
        var dir = item.direction ? '<span class="rp-edge-type">' + esc(item.direction) + '</span>' : '';
        if (item.structural) {
          // structural target → clickable, focus stays in THIS lens
          html += '<div class="rp-edge" data-node="' + esc(item.otherId) + '">' + dir +
            '<span class="rp-edge-target">' + arrow + ' ' + esc(item.label) + '</span></div>';
        } else {
          // non-structural target → link out to the Knowledge lens
          html += '<a class="rp-edge" style="text-decoration:none" href="graph.html?lens=knowledge&node=' +
            encodeURIComponent(item.otherId) + '">' + dir +
            '<span class="rp-edge-target">' + arrow + ' ' + esc(item.label) + ' ↗</span></a>';
        }
      });
      html += '</div>';
    });

    // OKSAT practice chips + Open in Knowledge (replaces the old kag.html link)
    var ok = n.oksat || {};
    var chips = [];
    (ok.concepts || []).forEach(function (c) {
      if (c && c.module && c.concept) chips.push({
        href: 'oksat-study.html?m=' + encodeURIComponent(c.module) + '&c=' + encodeURIComponent(c.concept),
        label: 'Practice · ' + c.concept
      });
    });
    (ok.modules || []).forEach(function (m) {
      if (m) chips.push({ href: 'oksat-study.html?m=' + encodeURIComponent(m), label: 'Module · ' + m });
    });
    html += '<div class="rp-section"><div class="rp-section-title">Study &amp; open</div>';
    chips.forEach(function (l) { html += '<a class="ok-link" href="' + l.href + '">' + esc(l.label) + ' ↗</a>'; });
    html += '<a class="ok-link" href="graph.html?lens=knowledge&node=' + encodeURIComponent(n.id) + '">Open in Knowledge ↗</a>';
    html += '</div>';

    if (n.sources && n.sources.length) {
      html += '<div class="rp-section"><div class="rp-section-title">Sources</div>';
      n.sources.forEach(function (s) { html += '<span class="source-tag">' + esc(s) + '</span>'; });
      html += '</div>';
    }

    return html;
  }

  /* Reveal a structural node whose class is currently toggled off, then focus.
     Preserves atlas.html focusNode's reveal-hidden behavior (atlas:923-930). */
  function revealAndFocus(api, id) {
    var n = api.cy.getElementById(id);
    if (!n || n.empty()) {
      var isStruct = false, i;
      for (i = 0; i < (graph.nodes || []).length; i++) {
        if (graph.nodes[i].id === id && graph.nodes[i].structure && inSet(STRUCTURES, graph.nodes[i].structure)) {
          if (!inSet(activeStructures, graph.nodes[i].structure)) activeStructures.push(graph.nodes[i].structure);
          isStruct = true; break;
        }
      }
      if (isStruct) { rebuild(api); renderStructPills(api); }
    }
    api.focusNode(id);
  }

  /* Delegated click on the (engine-owned, stable) panel body so chained
     navigation works whether the panel was opened by onTap OR the engine's
     own focusNode reopen. Attached in onMount, detached in onUnmount. */
  var _panelClick = null;

  window.GraphLenses = window.GraphLenses || {};
  window.GraphLenses.structural = {
    id: 'structural', label: 'Structural', title: 'Structural Anatomy Atlas',
    searchFields: ['label', 'detail', 'aliases'],
    source: source, style: style, layout: LAYOUT,

    onTap: function (node, api) {
      var h = buildDetail(node, api);
      if (h != null) api.panel.open(node.data('label'), h);
    },
    onDblTap: function (node, api) { api.isolate(node); },
    onBackgroundTap: function (api) {
      api.clearIsolate();
      api.panel.close();
      // clear any region fade + reset the navigator to "All"
      activeRegions = [];
      if (_regionWrap) {
        _regionWrap.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        if (_regionAllBtn) _regionAllBtn.classList.add('active');
      }
    },
    buildDetail: buildDetail,
    buildControls: buildControls,

    onMount: function (api) {
      var body = api.els && api.els.panelBody;
      if (body) {
        _panelClick = function (ev) {
          var el = ev.target;
          while (el && el !== body && !el.getAttribute) el = el.parentNode;
          while (el && el !== body) {
            if (el.getAttribute && el.hasAttribute('data-node')) {
              ev.preventDefault();
              revealAndFocus(api, el.getAttribute('data-node'));
              return;
            }
            el = el.parentNode;
          }
        };
        body.addEventListener('click', _panelClick);
      }
    },
    onUnmount: function (api) {
      var body = api.els && api.els.panelBody;
      if (body && _panelClick) body.removeEventListener('click', _panelClick);
      _panelClick = null;
      _structWrap = null; _regionWrap = null; _regionAllBtn = null;
    }
  };
})();
