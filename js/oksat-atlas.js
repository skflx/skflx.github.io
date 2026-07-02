/* =============================================================
   OKSAT Atlas — the graph view of the hub.
   Every module, domain, and concept becomes a linked node
   (Obsidian-graph style, same Cytoscape + cose-bilkent stack as
   kag.html). Modules cluster around subspecialty hubs; tapping a
   module launches it, tapping a concept deep-links the viewer to
   that concept (?m=<slug>&c=<key>). Node fill encodes completion
   for the viewed reviewer: surface → domain hue by % answered,
   with a sage ring at 100%.
   ============================================================= */
(function () {
  var moduleCache = {}; // slug → { meta, DOMAINS, CONCEPTS, ITEMS }

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
  function cssVar(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
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
  function buildElements(reviewer, completion) {
    var subs = window.OKSAT_SUBSPECIALTIES || {};
    var els = [];
    var usedSubs = {};

    (window.OKSAT_MANIFEST || []).forEach(function (entry) {
      var mod = moduleCache[entry.slug];
      if (!mod) return;
      var sub = subs[entry.subspecialty] || { label: 'OHNS', hue: '#55606A' };
      var subId = 's:' + (entry.subspecialty || 'other');
      if (!usedSubs[subId]) {
        usedSubs[subId] = true;
        els.push({ data: { id: subId, kind: 'sub', label: sub.label, hue: sub.hue } });
      }

      var comp = completion[entry.slug];
      var pct = comp && comp.total ? comp.answered / comp.total : 0;
      var mId = 'm:' + entry.slug;
      els.push({
        data: {
          id: mId, kind: 'module', label: entry.title, hue: sub.hue,
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
        els.push({ data: { id: dId, kind: 'domain', label: d.label, hue: d.color || sub.hue, slug: entry.slug } });
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
            hue: (d && d.color) || sub.hue,
            slug: entry.slug, concept: cKey,
            pct: p.total ? p.answered / p.total : 0,
            done: p.total > 0 && p.answered === p.total,
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
      var sub = subs[t.subspecialty] || { label: 'OHNS', hue: '#55606A' };
      var subId = 's:' + (t.subspecialty || 'other');
      if (!usedSubs[subId]) {
        usedSubs[subId] = true;
        els.push({ data: { id: subId, kind: 'sub', label: sub.label, hue: sub.hue } });
      }
      var gId = 'g:' + t.id;
      els.push({ data: { id: gId, kind: 'gap', label: t.label, hue: sub.hue, topic: t.id } });
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
    els.push({ data: { id: 'kag', kind: 'kag', label: 'Knowledge Atlas Graph ↗', hue: '#4A9EFF' } });
    Object.keys(usedSubs).forEach(function (subId) {
      els.push({ data: { id: 'e:kag:' + subId, source: 'kag', target: subId, kind: 'ghost' } });
    });
    return els;
  }

  function styleFor() {
    var surface = cssVar('--ok-surface', '#fff');
    var text = cssVar('--ok-text', '#2A241D');
    var faint = cssVar('--ok-text-faint', '#8A7C66');
    var border = cssVar('--ok-border', '#E8DFD0');
    var sage = cssVar('--ok-correct', '#4F7042');
    return [
      { selector: 'node', style: {
        'font-family': cssVar('--ok-font-ui', 'system-ui'),
        'color': text, 'text-wrap': 'wrap', 'text-max-width': '110px',
        'text-valign': 'bottom', 'text-margin-y': 5,
        'border-width': 1.5, 'border-color': border,
        'transition-property': 'opacity', 'transition-duration': '150ms',
      } },
      { selector: 'node[kind = "sub"]', style: {
        'width': 34, 'height': 34, 'font-size': 11, 'font-weight': 600,
        'background-color': surface, 'border-width': 3,
        'border-color': 'data(hue)', 'label': 'data(label)',
      } },
      { selector: 'node[kind = "module"]', style: {
        'width': 'mapData(count, 20, 60, 26, 44)', 'height': 'mapData(count, 20, 60, 26, 44)',
        'font-size': 10.5, 'font-weight': 600, 'label': 'data(label)',
        'background-color': surface, 'border-width': 2, 'border-color': 'data(hue)',
      } },
      { selector: 'node[kind = "domain"]', style: {
        'width': 14, 'height': 14, 'font-size': 8.5,
        'background-color': surface, 'border-color': 'data(hue)', 'border-width': 1.5,
        'label': 'data(label)', 'min-zoomed-font-size': 7, 'color': faint,
      } },
      { selector: 'node[kind = "concept"]', style: {
        'width': 8, 'height': 8, 'font-size': 7.5,
        'background-color': surface, 'border-color': border, 'border-width': 1,
        'label': 'data(label)', 'min-zoomed-font-size': 8, 'color': faint,
      } },
      { selector: 'node[kind = "kag"]', style: {
        'width': 30, 'height': 30, 'font-size': 10.5, 'font-weight': 600,
        'background-color': surface, 'border-width': 2, 'border-style': 'dashed',
        'border-color': 'data(hue)', 'label': 'data(label)',
      } },
      { selector: 'node[kind = "gap"]', style: {
        'width': 11, 'height': 11, 'font-size': 8.5,
        'background-color': surface, 'border-color': 'data(hue)', 'border-width': 1.5,
        'border-style': 'dashed', 'label': 'data(label)', 'min-zoomed-font-size': 7,
        'color': faint, 'opacity': 0.8,
      } },
      { selector: 'node.done', style: { 'border-color': sage, 'border-width': 3 } },
      { selector: 'edge', style: { 'curve-style': 'haystack', 'haystack-radius': 0.3, 'line-color': border, 'width': 1, 'opacity': 0.8 } },
      { selector: 'edge[kind = "trunk"]', style: { 'width': 2 } },
      { selector: 'edge[kind = "ghost"]', style: { 'line-style': 'dashed', 'opacity': 0.35 } },
      { selector: 'edge[kind = "cluster"]', style: { 'line-style': 'dashed', 'line-color': cssVar('--ok-ochre', '#9C7A45'), 'opacity': 0.3, 'curve-style': 'bezier' } },
      { selector: '.dim', style: { 'opacity': 0.12 } },
      { selector: '.spot', style: { 'opacity': 1 } },
      { selector: 'node.hit', style: { 'border-color': cssVar('--ok-ochre', '#9C7A45'), 'border-width': 3 } },
    ];
  }

  /* Apply completion fills (data-driven colors need explicit values). */
  function paintCompletion(cy) {
    var surface = cssVar('--ok-surface', '#fff');
    cy.nodes('[kind = "module"], [kind = "concept"]').forEach(function (n) {
      var pct = n.data('pct') || 0;
      // Keep a visible floor once anything is answered, so "just started" reads.
      var t = pct <= 0 ? 0 : 0.25 + 0.75 * pct;
      n.style('background-color', mix(surface, n.data('hue'), t));
      n.toggleClass('done', !!n.data('done'));
    });
  }

  function mount(container, opts) {
    opts = opts || {};
    var reviewer = opts.reviewer || 'guest';
    var completion = opts.completion || {};

    return loadModules().then(function () {
      var layoutName = 'cose-bilkent';
      try { cytoscape('layout', 'cose-bilkent'); } catch (e) { layoutName = 'cose'; }
      var cy = cytoscape({
        container: container,
        elements: buildElements(reviewer, completion),
        style: styleFor(),
        layout: {
          name: layoutName, animate: 'end', animationDuration: 600,
          nodeRepulsion: layoutName === 'cose' ? 400000 : 5200,
          idealEdgeLength: layoutName === 'cose' ? function () { return 62; } : 62,
          gravity: layoutName === 'cose' ? 40 : 0.28,
          numIter: 2500, tile: false, nodeDimensionsIncludeLabels: false,
        },
        wheelSensitivity: 0.25, minZoom: 0.18, maxZoom: 3.2, pixelRatio: 'auto',
      });
      paintCompletion(cy);

      /* Obsidian-style neighborhood spotlight on hover. */
      cy.on('mouseover', 'node', function (e) {
        var hood = e.target.closedNeighborhood();
        cy.elements().addClass('dim');
        hood.removeClass('dim').addClass('spot');
      });
      cy.on('mouseout', 'node', function () { cy.elements().removeClass('dim spot'); });

      /* Traversal: modules launch, concepts deep-link, KAG crosses over. */
      cy.on('tap', 'node', function (e) {
        var n = e.target, kind = n.data('kind');
        if (kind === 'module') {
          window.location.href = 'oksat-study.html?m=' + encodeURIComponent(n.data('slug'));
        } else if (kind === 'concept') {
          window.location.href = 'oksat-study.html?m=' + encodeURIComponent(n.data('slug')) +
            '&c=' + encodeURIComponent(n.data('concept'));
        } else if (kind === 'gap') {
          window.location.href = 'oksat-adaptive.html?t=' + encodeURIComponent(n.data('topic'));
        } else if (kind === 'kag') {
          window.location.href = 'kag.html';
        } else {
          cy.animate({ fit: { eles: n.closedNeighborhood(), padding: 60 }, duration: 350 });
        }
      });

      /* Search: highlight matches; Enter zooms to them. */
      if (opts.searchInput) {
        opts.searchInput.addEventListener('input', function () {
          var q = this.value.trim().toLowerCase();
          cy.nodes().removeClass('hit');
          if (!q) { cy.elements().removeClass('dim'); return; }
          var hits = cy.nodes().filter(function (n) {
            return String(n.data('label') || '').toLowerCase().indexOf(q) !== -1;
          });
          cy.elements().addClass('dim');
          hits.removeClass('dim').addClass('hit');
        });
        opts.searchInput.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var hits = cy.nodes('.hit');
          if (hits.length) cy.animate({ fit: { eles: hits, padding: 70 }, duration: 350 });
        });
      }

      /* Re-skin when day/night flips. */
      document.addEventListener('oksat:theme', function () {
        cy.style().fromJson(styleFor()).update();
        paintCompletion(cy);
      });

      return cy;
    });
  }

  window.OKSATAtlas = { mount: mount, modules: moduleCache, loadModules: loadModules };
})();
