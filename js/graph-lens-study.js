/* =============================================================
   graph-lens-study.js — the Study (OKSAT) manifestation.

   PHASE A STUB. Registers the Study lens against the
   js/graph-view.js contract with a placeholder graph so the switcher
   and engine are verifiable now. Phase B replaces the body with the
   full port of js/oksat-atlas.js: loadModules() + the
   subspecialty→module→domain→concept hierarchy, gap-topic nodes,
   dashed concept-cluster edges from OKSAT_CONCEPT_GRAPH, completion
   fills (paintCompletion), the `kag` crossover hub, and tap/cxttap
   navigation. It will also re-export loadModules so the compat shim
   in js/oksat-atlas.js (used by oksat-adaptive.html) keeps working.
   The lens object shape is the frozen contract.
   ============================================================= */
(function () {
  'use strict';

  function source(api) {
    // Placeholder until Phase B ports the OKSAT hierarchy builder.
    return [
      { data: { id: 'study-root', label: 'Study map', kind: 'sub' } },
      { data: { id: 'study-note', label: 'OKSAT hierarchy loads in Phase B', kind: 'concept' } },
      { data: { id: 'study-kag', label: 'Knowledge Atlas Graph ↗', kind: 'kag' } },
      { data: { id: 'e-root-note', source: 'study-root', target: 'study-note' } },
      { data: { id: 'e-root-kag', source: 'study-root', target: 'study-kag' } }
    ];
  }

  function style(api) {
    var cv = api.cssVar;
    return [
      { selector: 'node', style: {
        'label': 'data(label)', 'font-size': '10px', 'font-family': 'IBM Plex Sans, sans-serif',
        'color': cv('--txt', '#E8EAF0'), 'text-valign': 'bottom', 'text-margin-y': 6,
        'background-color': cv('--surface', '#161920'), 'border-width': 2,
        'border-color': cv('--accent', '#4A9EFF'), 'text-max-width': 120, 'text-wrap': 'wrap'
      } },
      { selector: 'node[kind="kag"]', style: { 'border-style': 'dashed' } },
      { selector: 'edge', style: { 'line-color': cv('--border', '#2A2D3A'), 'width': 1.2, 'curve-style': 'bezier' } }
    ];
  }

  window.GraphLenses = window.GraphLenses || {};
  window.GraphLenses.study = {
    id: 'study', label: 'Study', title: 'OKSAT Study Map',
    hoverSpotlight: true,
    searchFields: ['label'],
    source: source, style: style,
    layout: { name: 'cose-bilkent', animate: 'end', animationDuration: 500, idealEdgeLength: 70, nodeRepulsion: 5200, gravity: 0.28, numIter: 1500 },
    onTap: function (node, api) {
      if (node.id() === 'study-kag') window.location.href = 'graph.html?lens=knowledge';
    },
    onBackgroundTap: function (api) { api.clearIsolate(); },
    buildDetail: function () { return null; }, // Study navigates instead of opening a panel
    buildControls: function (el, api) { api.setStripLeft('Study lens — full build in Phase B'); }
  };
})();
