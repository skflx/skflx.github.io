/* =============================================================
   graph-lens-knowledge.js — the Knowledge manifestation.

   PHASE A STUB. This registers the Knowledge lens against the
   js/graph-view.js contract and already renders the REAL graph
   (data/kag-graph.json via KAGStore) with type colors, a basic
   detail panel, isolate, and search — enough to verify the engine
   end-to-end. Phase B replaces the body of this file with the full
   port of kag.html: the Leitner SELF-TEST overlay, the corrections
   form + inbox, accept-review, and the KAGStore sync/settings modal.
   The lens object's shape (id/source/style/layout/handlers/
   buildDetail) is the frozen contract and will not change.
   ============================================================= */
(function () {
  'use strict';

  var TYPES = ['anatomy', 'pathology', 'procedure', 'nerve', 'vessel', 'drug', 'concept'];

  function esc(s) { return window.GraphView.escHtml(s); }

  /* Degree-sized nodes + de-dangled edges (shared shape with kag.html). */
  function buildElements(graph) {
    var deg = {};
    (graph.edges || []).forEach(function (e) {
      deg[e.source] = (deg[e.source] || 0) + 1;
      deg[e.target] = (deg[e.target] || 0) + 1;
    });
    var maxDeg = Math.max.apply(null, Object.keys(deg).map(function (k) { return deg[k]; }).concat([1]));
    var nodes = (graph.nodes || []).map(function (n) {
      var d = deg[n.id] || 0;
      return { data: Object.assign({}, n, {
        nodeSize: 20 + Math.round((d / maxDeg) * 40),
        hasCorrections: !!(n.corrections && n.corrections.length)
      }) };
    });
    var ids = {};
    (graph.nodes || []).forEach(function (n) { ids[n.id] = true; });
    var edges = (graph.edges || []).filter(function (e) { return ids[e.source] && ids[e.target]; })
      .map(function (e) { return { data: Object.assign({}, e, { id: e.source + '->' + e.target + '_' + e.type }) }; });
    return nodes.concat(edges);
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
      { selector: 'node[?hasCorrections]', style: { 'border-width': 3, 'border-color': cv('--warning', '#FFD43B') } },
      { selector: 'edge', style: {
        'line-color': cv('--border', '#333842'), 'target-arrow-color': cv('--border', '#333842'),
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'width': 1.5,
        'label': 'data(type)', 'font-size': '8px', 'font-family': 'JetBrains Mono, monospace',
        'color': cv('--txt3', '#5C6370'), 'text-rotation': 'autorotate', 'text-margin-y': -8, 'arrow-scale': 0.8
      } }
    ];
    TYPES.forEach(function (t) {
      base.push({ selector: 'node[type="' + t + '"]', style: { 'background-color': cv('--node-' + t, '#868E96') } });
    });
    return base;
  }

  /* Basic detail panel (Phase B adds corrections/accept-review/leitner box). */
  function buildDetail(node, api) {
    var n = _graph.nodes.filter(function (x) { return x.id === node.id(); })[0];
    if (!n) return null;
    var edges = _graph.edges.filter(function (e) { return e.source === n.id || e.target === n.id; });
    var html = '<div style="margin-bottom:.75rem"><span class="badge badge-' + n.type + '">' + esc(n.type) +
      '</span><span class="badge badge-sub">' + esc(n.subspecialty) + '</span>' +
      (n.review === false ? '<span class="badge" style="background:rgba(214,172,99,.22);color:#D6AC63">DRAFT</span>' : '') + '</div>';
    html += '<div class="rp-section"><div class="rp-section-title">Clinical Detail</div><div class="rp-detail">' + esc(n.detail) + '</div></div>';
    var ok = n.oksat || {}, chips = [];
    (ok.concepts || []).forEach(function (c) { if (c && c.module && c.concept) chips.push({ href: 'oksat-study.html?m=' + encodeURIComponent(c.module) + '&c=' + encodeURIComponent(c.concept), label: 'Practice · ' + c.concept }); });
    (ok.topics || []).forEach(function (t) { if (t) chips.push({ href: 'oksat-adaptive.html?t=' + encodeURIComponent(t), label: 'Drill · ' + t }); });
    if (chips.length) {
      html += '<div class="rp-section"><div class="rp-section-title">Study &amp; Practice</div>';
      chips.forEach(function (l) { html += '<a class="ok-link" href="' + l.href + '">' + esc(l.label) + ' ↗</a>'; });
      html += '</div>';
    }
    if (edges.length) {
      html += '<div class="rp-section"><div class="rp-section-title">Connections (' + edges.length + ')</div>';
      edges.forEach(function (e) {
        var oid = e.source === n.id ? e.target : e.source;
        var o = _graph.nodes.filter(function (x) { return x.id === oid; })[0];
        var dir = e.source === n.id ? '→' : '←';
        html += '<div class="rp-edge"><span class="rp-edge-type">' + dir + ' ' + esc(e.type) + '</span><span class="rp-edge-target">' + esc(o ? o.label : oid) + '</span></div>';
      });
      html += '</div>';
    }
    return html;
  }

  window.GraphLenses = window.GraphLenses || {};
  window.GraphLenses.knowledge = {
    id: 'knowledge', label: 'Knowledge', title: 'Knowledge Atlas Graph',
    searchFields: ['label', 'detail'],
    source: source, style: style,
    layout: { name: 'cose-bilkent', animate: false, nodeDimensionsIncludeLabels: true, idealEdgeLength: 120, nodeRepulsion: 8000, gravity: 0.25, numIter: 2500 },
    onTap: function (node, api) { var h = buildDetail(node, api); if (h != null) api.panel.open(node.data('label'), h); },
    onDblTap: function (node, api) { api.isolate(node); },
    onBackgroundTap: function (api) { api.clearIsolate(); api.panel.close(); },
    buildDetail: buildDetail,
    buildControls: function (el, api) {
      api.setStripLeft(_graph.nodes.length + ' nodes · ' + _graph.edges.length + ' edges');
    }
  };
})();
