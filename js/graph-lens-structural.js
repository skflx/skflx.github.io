/* =============================================================
   graph-lens-structural.js — the Structural manifestation.

   PHASE A STUB. Registers the Structural lens against the
   js/graph-view.js contract and already renders the REAL structural
   subset of data/kag-graph.json (nodes with `structure` set), colored
   by structure class, with a basic panel — enough to verify the
   engine. Phase B replaces the body with the full port of atlas.html:
   the region navigator, the structure toggles/legend, grouped
   relationship lists, and "Open in KAG" → graph.html?lens=knowledge.
   The lens object shape is the frozen contract.
   ============================================================= */
(function () {
  'use strict';

  var STRUCTURES = ['bone', 'cartilage', 'ligament', 'fascia', 'joint', 'foramen', 'space', 'membrane', 'muscle'];

  function esc(s) { return window.GraphView.escHtml(s); }

  function buildElements(graph) {
    var keep = {};
    var nodes = (graph.nodes || []).filter(function (n) { return STRUCTURES.indexOf(n.structure) !== -1; });
    nodes.forEach(function (n) { keep[n.id] = true; });
    var deg = {};
    (graph.edges || []).forEach(function (e) {
      if (keep[e.source] && keep[e.target]) { deg[e.source] = (deg[e.source] || 0) + 1; deg[e.target] = (deg[e.target] || 0) + 1; }
    });
    var maxDeg = Math.max.apply(null, Object.keys(deg).map(function (k) { return deg[k]; }).concat([1]));
    var els = nodes.map(function (n) {
      var d = deg[n.id] || 0;
      return { data: Object.assign({}, n, { nodeSize: 18 + Math.round((d / maxDeg) * 38) }) };
    });
    (graph.edges || []).forEach(function (e) {
      if (keep[e.source] && keep[e.target]) els.push({ data: Object.assign({}, e, { id: e.source + '->' + e.target + '_' + e.type }) });
    });
    return els;
  }

  var _graph = { nodes: [], edges: [] };

  function source(api) {
    if (!window.KAGStore) return [];
    return window.KAGStore.fetch().then(function (file) {
      _graph = (file && file.nodes && file.edges) ? window.KAGStore.merge(file) : { nodes: [], edges: [] };
      return buildElements(_graph);
    });
  }

  function style(api) {
    var cv = api.cssVar;
    var base = [
      { selector: 'node', style: {
        'label': 'data(label)', 'font-size': '10px', 'font-family': 'IBM Plex Sans, sans-serif',
        'color': cv('--txt', '#E8EAF0'), 'text-valign': 'bottom', 'text-margin-y': 6,
        'width': 'data(nodeSize)', 'height': 'data(nodeSize)', 'text-max-width': 100,
        'text-wrap': 'ellipsis', 'border-width': 0
      } },
      { selector: 'edge', style: {
        'line-color': cv('--border', '#333842'), 'curve-style': 'bezier', 'width': 1.4,
        'label': 'data(type)', 'font-size': '8px', 'font-family': 'JetBrains Mono, monospace',
        'color': cv('--txt3', '#5C6370'), 'text-rotation': 'autorotate', 'text-margin-y': -8
      } }
    ];
    STRUCTURES.forEach(function (s) {
      base.push({ selector: 'node[structure="' + s + '"]', style: { 'background-color': cv('--struct-' + s, '#9CA3B0') } });
    });
    return base;
  }

  function buildDetail(node, api) {
    var n = _graph.nodes.filter(function (x) { return x.id === node.id(); })[0];
    if (!n) return null;
    var html = '<div style="margin-bottom:.75rem">' +
      '<span class="badge badge-sub">' + esc(n.structure) + '</span>' +
      (n.region ? '<span class="badge badge-sub">' + esc(n.region) + '</span>' : '') +
      (n.laterality ? '<span class="badge badge-sub">' + esc(n.laterality) + '</span>' : '') + '</div>';
    html += '<div class="rp-section"><div class="rp-detail">' + esc(n.detail) + '</div></div>';
    html += '<div class="rp-section"><a class="ok-link" href="graph.html?lens=knowledge&node=' + encodeURIComponent(n.id) + '">Open in Knowledge ↗</a></div>';
    return html;
  }

  window.GraphLenses = window.GraphLenses || {};
  window.GraphLenses.structural = {
    id: 'structural', label: 'Structural', title: 'Structural Anatomy Atlas',
    searchFields: ['label', 'detail'],
    source: source, style: style,
    layout: { name: 'cose-bilkent', animate: false, nodeDimensionsIncludeLabels: true, idealEdgeLength: 120, nodeRepulsion: 8000, gravity: 0.25, numIter: 2500 },
    onTap: function (node, api) { var h = buildDetail(node, api); if (h != null) api.panel.open(node.data('label'), h); },
    onDblTap: function (node, api) { api.isolate(node); },
    onBackgroundTap: function (api) { api.clearIsolate(); api.panel.close(); },
    buildDetail: buildDetail,
    buildControls: function (el, api) {
      var structural = _graph.nodes.filter(function (n) { return STRUCTURES.indexOf(n.structure) !== -1; }).length;
      api.setStripLeft(structural + ' structures');
    }
  };
})();
