/* =============================================================
   graph-lens-study.js — the Study (OKSAT) manifestation.

   Full port of the former js/oksat-atlas.js Atlas into the unified
   graph engine's lens contract (see js/graph-view.js). The engine
   owns the single Cytoscape instance, layout run, isolate, debounced
   search, deep-link, hover spotlight, theme re-skin, toast, and panel
   shell. This lens supplies only what differs: the OKSAT element
   source (subspecialty → module → domain → concept hierarchy, gap
   topics, dashed concept-cluster edges, the KAG crossover hub, and
   ghost concept↔kag edges), the node/edge styling, completion fills,
   the layout params, and tap/cxttap navigation.

   Standalone-safe: graph.html does NOT load oksat-db/store/reviewer/
   engine; every optional global is guarded and the lens degrades to a
   partial/empty graph rather than throwing. Module completion (`pct`)
   comes from an injected `completion` map (Phase C via setContext),
   defaulting to 0; per-concept fills come from conceptProgress, which
   reads localStorage and works standalone.

   loadModules() and setContext() are re-exported on the lens object so
   the Phase-C compat shim in js/oksat-atlas.js (OKSATAtlas.loadModules,
   used by oksat-adaptive.html) keeps working.
   ============================================================= */
(function () {
  'use strict';

  /* Subspecialty markers are theme-dependent (light + dark solves), and
     Cytoscape stores a concrete colour in element data — it cannot resolve
     a CSS var(). So resolve here, and re-derive on the theme flip below. */
  var NEUTRAL = { light: '#7C8794', dark: '#626D79' };   /* = --ok-text-faint */
  function curTheme() {
    try {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    } catch (e) { return 'dark'; }
  }
  function HUE(sub) {
    var t = curTheme();
    if (!sub) return NEUTRAL[t];
    return (t === 'dark' && sub.hueDark) ? sub.hueDark : (sub.hue || NEUTRAL[t]);
  }

  var moduleCache = {};      // slug → { meta, DOMAINS, CONCEPTS, ITEMS }
  var _reviewer = 'guest';   // injected by Phase C (oksat.html) via setContext
  var _completion = {};      // slug → { answered, total }, injected via setContext

  /* Modules register via window.__MCQ_MODULE. They are plain scripts with
     top-level consts (meta, ITEMS, …), which would collide if several were
     injected as <script> tags on one page — so fetch the source and run each
     inside its own function scope instead. */
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
          .catch(function () {}) // skip a broken module, keep the graph
          .then(function () {
            try { delete window.__MCQ_MODULE; } catch (e) { window.__MCQ_MODULE = undefined; }
          });
      });
    });
    return chain.then(function () { return moduleCache; });
  }

  /* ---- color helpers ---- */
  function hexToRgb(hex) {
    hex = String(hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.replace(/./g, function (c) { return c + c; });
    var n = parseInt(hex, 16);
    if (isNaN(n)) return { r: 128, g: 128, b: 128 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function mix(hexA, hexB, t) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    var f = function (x, y) { return Math.round(x + (y - x) * t); };
    return 'rgb(' + f(a.r, b.r) + ',' + f(a.g, b.g) + ',' + f(a.b, b.b) + ')';
  }

  /* Palette mapped onto graph.css tokens (the old --ok-* tokens do not
     exist on graph.html). Read via api.cssVar with sensible fallbacks. */
  function palette(api) {
    var cv = (api && api.cssVar) || function (n, fb) { return fb; };
    return {
      surface: cv('--surface', '#161920'),
      text: cv('--txt', '#E8EAF0'),
      faint: cv('--txt3', '#5C6370'),
      border: cv('--border', '#2A2D3A'),
      sage: cv('--success', '#51CF66'),
      ochre: cv('--ok-ochre', '#E0A33F')
    };
  }

  /* Per-concept answered counts, from this browser's progress record. */
  function conceptProgress(slug, mod, reviewer) {
    var rec = null;
    try { rec = JSON.parse(localStorage.getItem('oksat:progress:' + slug + ':' + reviewer) || 'null'); }
    catch (e) {}
    var answers = (rec && rec.answers) || {};
    var out = {}; // concept → { answered, total }
    (mod.ITEMS || mod.QUESTIONS || []).forEach(function (q) {
      (q.concepts || []).forEach(function (c) {
        var o = out[c] || (out[c] = { answered: 0, total: 0 });
        o.total++;
        if (answers[q.id]) o.answered++;
      });
    });
    return out;
  }

  /* ---- build cytoscape elements ---- */
  function buildElements(reviewer, completion, kagIndex) {
    kagIndex = kagIndex || {};
    completion = completion || {};
    var subs = window.OKSAT_SUBSPECIALTIES || {};
    var els = [];
    var usedSubs = {};

    (window.OKSAT_MANIFEST || []).forEach(function (entry) {
      var mod = moduleCache[entry.slug];
      if (!mod) return;
      var sub = subs[entry.subspecialty] || null;
      var subKeyOf = entry.subspecialty || '';
      var subId = 's:' + (subKeyOf || 'other');
      if (!usedSubs[subId]) {
        usedSubs[subId] = true;
        els.push({ data: { id: subId, kind: 'sub', label: (sub && sub.label) || 'OHNS', hue: HUE(sub), subKey: subKeyOf } });
      }

      var comp = completion[entry.slug];
      var pct = comp && comp.total ? comp.answered / comp.total : 0;
      var mId = 'm:' + entry.slug;
      els.push({
        data: {
          id: mId, kind: 'module', label: entry.title, hue: HUE(sub), subKey: subKeyOf,
          slug: entry.slug, count: entry.count, pct: pct,
          done: pct >= 0.999,
          sub: (comp ? comp.answered : 0) + ' / ' + entry.count,
        },
      });
      els.push({ data: { id: 'e:' + subId + ':' + mId, source: subId, target: mId, kind: 'trunk' } });

      var DOMAINS = mod.DOMAINS || {};
      var CONCEPTS = mod.CONCEPTS || {};
      var cprog = conceptProgress(entry.slug, mod, reviewer);

      Object.keys(DOMAINS).forEach(function (dKey) {
        var d = DOMAINS[dKey];
        var dId = 'd:' + entry.slug + ':' + dKey;
        els.push({ data: { id: dId, kind: 'domain', label: d.label, hue: d.color || HUE(sub),
          subKey: d.color ? '' : subKeyOf, slug: entry.slug } });
        els.push({ data: { id: 'e:' + mId + ':' + dId, source: mId, target: dId, kind: 'branch' } });
      });
      Object.keys(CONCEPTS).forEach(function (cKey) {
        var c = CONCEPTS[cKey];
        var dId = 'd:' + entry.slug + ':' + c.domain;
        var d = DOMAINS[c.domain];
        var p = cprog[cKey] || { answered: 0, total: 0 };
        var cId = 'c:' + entry.slug + ':' + cKey;
        els.push({
          data: {
            id: cId, kind: 'concept', label: c.label,
            hue: (d && d.color) || HUE(sub),
            subKey: (d && d.color) ? '' : subKeyOf,
            slug: entry.slug, concept: cKey,
            pct: p.total ? p.answered / p.total : 0,
            done: p.total > 0 && p.answered === p.total,
            kagNode: (kagIndex[entry.slug + ':' + cKey] || [])[0] || null,
          },
        });
        els.push({ data: { id: 'e:' + dId + ':' + cId, source: (d ? dId : mId), target: cId, kind: 'twig' } });
      });
    });

    /* Gap topics — taxonomy entries with no module yet. Faint dashed nodes on
       their subspecialty hub; tapping one opens adaptive practice. */
    var tax = (window.OKSAT_TAXONOMY && window.OKSAT_TAXONOMY.topics) || [];
    tax.forEach(function (t) {
      if (t.moduleId) return; // built topics already render as modules
      var sub = subs[t.subspecialty] || null;
      var subKeyOf = t.subspecialty || '';
      var subId = 's:' + (subKeyOf || 'other');
      if (!usedSubs[subId]) {
        usedSubs[subId] = true;
        els.push({ data: { id: subId, kind: 'sub', label: (sub && sub.label) || 'OHNS', hue: HUE(sub), subKey: subKeyOf } });
      }
      var gId = 'g:' + t.id;
      els.push({ data: { id: gId, kind: 'gap', label: t.label, hue: HUE(sub), subKey: subKeyOf, topic: t.id } });
      els.push({ data: { id: 'e:' + subId + ':' + gId, source: subId, target: gId, kind: 'branch' } });
    });

    /* Cross-module concept clusters — dashed hops between concept nodes that
       already exist in the graph (both members must have rendered). */
    var graph = (window.OKSAT_CONCEPT_GRAPH && window.OKSAT_CONCEPT_GRAPH.clusters) || {};
    var present = {};
    els.forEach(function (e) { if (e.data && e.data.kind === 'concept') present[e.data.id] = true; });
    Object.keys(graph).forEach(function (cid) {
      var members = (graph[cid] && graph[cid].members) || [];
      for (var i = 0; i < members.length; i++) {
        for (var j = i + 1; j < members.length; j++) {
          var a = 'c:' + members[i].module + ':' + members[i].concept;
          var b = 'c:' + members[j].module + ':' + members[j].concept;
          if (present[a] && present[b]) {
            els.push({ data: { id: 'e:cl:' + cid + ':' + i + ':' + j, source: a, target: b, kind: 'cluster' } });
          }
        }
      }
    });

    /* The sibling graph — Knowledge Atlas Graph, one dashed hop away. */
    els.push({ data: { id: 'kag', kind: 'kag', label: 'Knowledge Atlas Graph ↗', hue: '#4FB3E8' } });
    Object.keys(usedSubs).forEach(function (subId) {
      els.push({ data: { id: 'e:kag:' + subId, source: 'kag', target: subId, kind: 'ghost' } });
    });

    /* Concept ↔ KAG: a dashed hop from any concept node that has a matching
       Knowledge Atlas Graph term (OKSAT → KAG traversal; right-click opens it). */
    els.slice().forEach(function (el) {
      if (el.data && el.data.kind === 'concept' && el.data.kagNode) {
        els.push({ data: { id: 'e:kagc:' + el.data.id, source: el.data.id, target: 'kag', kind: 'ghost' } });
      }
    });
    return els;
  }

  /* ---- lens hooks ---- */

  function source(api) {
    return loadModules().then(function () {
      var kagIndex = {};
      if (window.KAGStore && typeof window.KAGStore.fetch === 'function') {
        return window.KAGStore.fetch().then(function (kg) {
          try { if (kg) kagIndex = window.KAGStore.reverseConcept(kg); } catch (e) {}
          return buildElements(_reviewer, _completion, kagIndex);
        });
      }
      return buildElements(_reviewer, _completion, kagIndex);
    });
  }

  function style(api) {
    var p = palette(api);
    return [
      { selector: 'node', style: {
        'font-family': 'IBM Plex Sans, system-ui, sans-serif',
        'color': p.text, 'text-wrap': 'wrap', 'text-max-width': '110px',
        'text-valign': 'bottom', 'text-margin-y': 5,
        'border-width': 1.5, 'border-color': p.border,
        'transition-property': 'opacity', 'transition-duration': '150ms',
      } },
      { selector: 'node[kind = "sub"]', style: {
        'width': 34, 'height': 34, 'font-size': 11, 'font-weight': 600,
        'background-color': p.surface, 'border-width': 3,
        'border-color': 'data(hue)', 'label': 'data(label)',
      } },
      { selector: 'node[kind = "module"]', style: {
        'width': 'mapData(count, 20, 60, 26, 44)', 'height': 'mapData(count, 20, 60, 26, 44)',
        'font-size': 10.5, 'font-weight': 600, 'label': 'data(label)',
        'background-color': p.surface, 'border-width': 2, 'border-color': 'data(hue)',
      } },
      { selector: 'node[kind = "domain"]', style: {
        'width': 14, 'height': 14, 'font-size': 8.5,
        'background-color': p.surface, 'border-color': 'data(hue)', 'border-width': 1.5,
        'label': 'data(label)', 'min-zoomed-font-size': 7, 'color': p.faint,
      } },
      { selector: 'node[kind = "concept"]', style: {
        'width': 8, 'height': 8, 'font-size': 7.5,
        'background-color': p.surface, 'border-color': p.border, 'border-width': 1,
        'label': 'data(label)', 'min-zoomed-font-size': 8, 'color': p.faint,
      } },
      { selector: 'node[kind = "kag"]', style: {
        'width': 30, 'height': 30, 'font-size': 10.5, 'font-weight': 600,
        'background-color': p.surface, 'border-width': 2, 'border-style': 'dashed',
        'border-color': 'data(hue)', 'label': 'data(label)',
      } },
      { selector: 'node[kind = "gap"]', style: {
        'width': 11, 'height': 11, 'font-size': 8.5,
        'background-color': p.surface, 'border-color': 'data(hue)', 'border-width': 1.5,
        'border-style': 'dashed', 'label': 'data(label)', 'min-zoomed-font-size': 7,
        'color': p.faint, 'opacity': 0.8,
      } },
      { selector: 'node.done', style: { 'border-color': p.sage, 'border-width': 3 } },
      { selector: 'edge', style: { 'curve-style': 'haystack', 'haystack-radius': 0.3, 'line-color': p.border, 'width': 1, 'opacity': 0.8 } },
      { selector: 'edge[kind = "trunk"]', style: { 'width': 2 } },
      { selector: 'edge[kind = "ghost"]', style: { 'line-style': 'dashed', 'opacity': 0.35 } },
      { selector: 'edge[kind = "cluster"]', style: { 'line-style': 'dashed', 'line-color': p.ochre, 'opacity': 0.3, 'curve-style': 'bezier' } },
    ];
  }

  /* Apply completion fills (data-driven colors need explicit values). */
  function paintCompletion(cy, api) {
    if (!cy) return;
    var surface = palette(api).surface;
    cy.nodes('[kind = "module"], [kind = "concept"]').forEach(function (n) {
      var pct = n.data('pct') || 0;
      // Keep a visible floor once anything is answered, so "just started" reads.
      var t = pct <= 0 ? 0 : 0.25 + 0.75 * pct;
      n.style('background-color', mix(surface, n.data('hue'), t));
      n.toggleClass('done', !!n.data('done'));
    });
  }

  window.GraphLenses = window.GraphLenses || {};
  window.GraphLenses.study = {
    id: 'study', label: 'Study', title: 'OKSAT Study Map',
    hoverSpotlight: true,
    searchFields: ['label'],
    source: source,
    style: style,
    layout: {
      name: 'cose-bilkent', animate: 'end', animationDuration: 600,
      nodeRepulsion: 5200, idealEdgeLength: 62, gravity: 0.28,
      numIter: 2500, tile: false, nodeDimensionsIncludeLabels: false,
    },

    /* Traversal: modules launch, concepts deep-link, gaps go adaptive,
       KAG crosses over to the Knowledge lens; anything else fits its hood. */
    onTap: function (node, api) {
      var kind = node.data('kind');
      if (kind === 'module') {
        window.location.href = 'oksat-study.html?m=' + encodeURIComponent(node.data('slug'));
      } else if (kind === 'concept') {
        window.location.href = 'oksat-study.html?m=' + encodeURIComponent(node.data('slug')) +
          '&c=' + encodeURIComponent(node.data('concept'));
      } else if (kind === 'gap') {
        window.location.href = 'oksat-adaptive.html?t=' + encodeURIComponent(node.data('topic'));
      } else if (kind === 'kag') {
        window.location.href = 'graph.html?lens=knowledge';
      } else {
        api.cy.animate({ fit: { eles: node.closedNeighborhood(), padding: 60 }, duration: 350 });
      }
    },

    /* Right-click / long-press a concept with a matching Atlas term opens it
       in the Knowledge lens (OKSAT → KAG, node-level). Tap still studies. */
    onCxtTap: function (node, api) {
      if (node.data('kind') === 'concept' && node.data('kagNode')) {
        window.location.href = 'graph.html?lens=knowledge&node=' + encodeURIComponent(node.data('kagNode'));
      }
    },

    onBackgroundTap: function (api) { api.clearIsolate(); },

    buildDetail: function () { return null; }, // Study navigates instead of opening a panel

    buildControls: function (el, api) {
      var mods = api.cy.nodes('[kind = "module"]').length;
      var concepts = api.cy.nodes('[kind = "concept"]').length;
      api.setStripLeft(mods + ' modules · ' + concepts + ' concepts');
    },

    /* cy has elements by onMount — paint the data-driven completion fills. */
    onMount: function (api) { paintCompletion(api.cy, api); },

    /* On day/night flip the engine reapplies base + our style(), so the
       explicit background-color fills must be repainted. */
    onThemeChange: function (api) {
      /* Marker hues live in element data, so a theme flip has to re-derive
         them before the completion fills are repainted over the top. */
      try {
        var subs = window.OKSAT_SUBSPECIALTIES || {};
        api.cy.nodes().forEach(function (n) {
          var k = n.data('subKey');
          if (k && subs[k]) n.data('hue', HUE(subs[k]));
        });
      } catch (e) {}
      paintCompletion(api.cy, api);
    }
  };

  /* Re-export for the Phase-C compat shim in js/oksat-atlas.js:
     OKSATAtlas.loadModules (oksat-adaptive.html depends on it). */
  window.GraphLenses.study.loadModules = loadModules;

  /* Phase C (oksat.html) injects the signed-in reviewer + module-level
     completion here; standalone graph.html leaves the defaults. */
  window.GraphLenses.study.setContext = function (ctx) {
    ctx = ctx || {};
    _reviewer = ctx.reviewer || 'guest';
    _completion = ctx.completion || {};
  };
})();
