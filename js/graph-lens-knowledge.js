/* =============================================================
   graph-lens-knowledge.js — the Knowledge manifestation.

   FULL PORT of kag.html into the js/graph-view.js lens contract.
   Reproduces KAG behavior: degree-sized type-colored graph, the
   subspecialty filter pills, the Explore/Self-Test mode toggle, the
   rich detail panel (Study & Practice OKSAT chips, connections,
   sources, Leitner box, accept-as-reviewed, flag-correction form +
   list), the Leitner self-test overlay, and the settings modal
   (import/export/reset + canonical KAGStore sync + corrections inbox).

   Persistence is preserved 1:1 with kag.html: every mutation writes
   through window.KAGStore.save(graph), which persists
   localStorage['kag-graph'] — the SAME key kag.html used via
   saveGraph. Leitner progress and corrections survive across the two
   pages and this lens.

   The engine (graph-view.js) OWNS: the Cytoscape instance, isolate,
   debounced search (we only declare searchFields), the ?node= deep
   link (api.focusNode), the panel shell, toast, theme re-skin, and
   the topbar/overlay/modal DOM. This lens supplies only what differs.
   ============================================================= */
(function () {
  'use strict';

  var TYPES = ['anatomy', 'pathology', 'procedure', 'nerve', 'vessel', 'drug', 'concept'];
  var LEITNER_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
  var TODAY = new Date().toISOString().split('T')[0];

  var LAYOUT = {
    name: 'cose-bilkent', animate: false, nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 120, nodeRepulsion: 8000, gravity: 0.25, numIter: 2500
  };

  /* Subspecialty vocabulary — canonicalized on OKSAT's keys; normSub
     folds any legacy KAG value so filters still match. */
  var SUB_LABELS = (window.OKSAT_SUBSPECIALTIES) || {};
  var SUBSPECIALTIES = Object.keys(SUB_LABELS).length ? Object.keys(SUB_LABELS)
    : ['otology', 'rhinology', 'laryngology', 'hn_onc', 'fprs', 'pediatrics', 'sleep', 'endocrine', 'fundamentals'];
  function normSub(x) {
    return (window.KAGStore && typeof window.KAGStore.normSub === 'function') ? window.KAGStore.normSub(x) : x;
  }

  function esc(s) { return window.GraphView.escHtml(s); }
  function todayISO() { return new Date().toISOString().split('T')[0]; }

  /* ---- module-level mutable state ---- */
  var graph = { nodes: [], edges: [] };
  var currentMode = 'explore';
  var activeSpecs = {};                // subspecialty -> true (multi-select)
  var _api = null;                     // stashed for the document keydown handler
  var _keyHandler = null;              // named ref so onUnmount can detach
  var _panelHandler = null;           // delegated panel-body click handler

  /* self-test state */
  var testQueue = [];
  var testIndex = 0;
  var testRevealed = false;

  function saveGraph() { if (window.KAGStore) window.KAGStore.save(graph); }
  function findNode(id) {
    for (var i = 0; i < graph.nodes.length; i++) { if (graph.nodes[i].id === id) return graph.nodes[i]; }
    return null;
  }
  function edgesOf(id) {
    return graph.edges.filter(function (e) { return e.source === id || e.target === id; });
  }

  /* ── Elements: degree-sizing + hasCorrections + de-dangled edges ── */
  function buildElements(g) {
    var deg = {};
    (g.edges || []).forEach(function (e) {
      deg[e.source] = (deg[e.source] || 0) + 1;
      deg[e.target] = (deg[e.target] || 0) + 1;
    });
    var maxDeg = Math.max.apply(null, Object.keys(deg).map(function (k) { return deg[k]; }).concat([1]));
    var nodes = (g.nodes || []).map(function (n) {
      var d = deg[n.id] || 0;
      return { data: Object.assign({}, n, {
        nodeSize: 20 + Math.round((d / maxDeg) * 40),
        hasCorrections: !!(n.corrections && n.corrections.length > 0)
      }) };
    });
    var ids = {};
    (g.nodes || []).forEach(function (n) { ids[n.id] = true; });
    var edges = (g.edges || []).filter(function (e) { return ids[e.source] && ids[e.target]; })
      .map(function (e) { return { data: Object.assign({}, e, { id: e.source + '->' + e.target + '_' + e.type }) }; });
    return nodes.concat(edges);
  }

  /* ── source(): fetch canonical file, merge local-wins, persist ── */
  function source(api) {
    _api = api;
    if (!window.KAGStore) { graph = { nodes: [], edges: [] }; return []; }
    return window.KAGStore.fetch().then(function (file) {
      graph = (file && file.nodes && file.edges) ? window.KAGStore.merge(file) : { nodes: [], edges: [] };
      saveGraph();
      return buildElements(graph);
    });
  }

  /* ── style(): node/edge colors only (base classes owned by engine) ── */
  function style(api) {
    var cv = api.cssVar;
    var base = [
      { selector: 'node', style: {
        'label': 'data(label)', 'font-size': '10px', 'font-family': 'IBM Plex Sans, sans-serif',
        'color': cv('--txt', '#E8EAF0'), 'text-valign': 'bottom', 'text-margin-y': 6,
        'width': 'data(nodeSize)', 'height': 'data(nodeSize)', 'text-max-width': 100,
        'text-wrap': 'ellipsis', 'border-width': 0, 'overlay-opacity': 0
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

  /* ── buildDetail(): FULL port of openNodePanel's HTML (kag 1219-1291).
     Returns the HTML string; interaction is wired via delegation on the
     shared panel body (see onMount). A hidden marker carries the node id
     so the delegated handlers know which node the panel is showing —
     works for onTap AND the engine's deep-link/connection focusNode. ── */
  function buildDetail(node, api) {
    var n = findNode(node.id());
    if (!n) return null;
    var edges = edgesOf(n.id);
    var html = '<span data-panel-node="' + esc(n.id) + '" style="display:none"></span>';
    html += '<div style="margin-bottom:0.75rem"><span class="badge badge-' + esc(n.type) + '">' + esc(n.type) + '</span>'
      + '<span class="badge badge-sub">' + esc(n.subspecialty) + '</span>'
      + (n.review === false
        ? '<span class="badge" style="background:rgba(214,172,99,0.22);color:#D6AC63">DRAFT</span>'
        : '<span class="badge" style="background:rgba(81,207,102,0.16);color:#51CF66">reviewed ✓</span>')
      + '</div>';
    html += '<div class="rp-section"><div class="rp-section-title">Clinical Detail</div><div class="rp-detail">' + esc(n.detail) + '</div></div>';

    // Study & Practice — KAG → OKSAT traversal (concepts, adaptive drills, modules)
    var ok = n.oksat || {};
    var okLinks = [];
    (ok.concepts || []).forEach(function (c) {
      if (c && c.module && c.concept) okLinks.push({ href: 'oksat-study.html?m=' + encodeURIComponent(c.module) + '&c=' + encodeURIComponent(c.concept), label: 'Practice · ' + c.concept });
    });
    (ok.topics || []).forEach(function (t) {
      if (t) okLinks.push({ href: 'oksat-adaptive.html?t=' + encodeURIComponent(t), label: 'Drill · ' + t });
    });
    (ok.modules || []).forEach(function (m) {
      if (m) okLinks.push({ href: 'oksat-study.html?m=' + encodeURIComponent(m), label: 'Module · ' + m });
    });
    if (okLinks.length) {
      html += '<div class="rp-section"><div class="rp-section-title">Study &amp; Practice</div>';
      okLinks.forEach(function (l) { html += '<a class="ok-link" href="' + l.href + '">' + esc(l.label) + ' ↗</a>'; });
      html += '</div>';
    }

    if (n.aliases && n.aliases.length) {
      html += '<div class="rp-section"><div class="rp-section-title">Also known as</div><div style="font-size:0.78rem;color:var(--txt2)">'
        + n.aliases.map(esc).join(' · ') + '</div></div>';
    }

    if (edges.length > 0) {
      html += '<div class="rp-section"><div class="rp-section-title">Connections (' + edges.length + ')</div>';
      edges.forEach(function (e) {
        var otherId = e.source === n.id ? e.target : e.source;
        var other = findNode(otherId);
        var dir = e.source === n.id ? '→' : '←';
        html += '<div class="rp-edge" data-node="' + esc(otherId) + '"><span class="rp-edge-type">' + dir + ' ' + esc(e.type)
          + '</span><span class="rp-edge-target">' + esc(other ? other.label : otherId) + '</span></div>';
      });
      html += '</div>';
    }

    if (n.sources && n.sources.length > 0) {
      html += '<div class="rp-section"><div class="rp-section-title">Sources</div>';
      n.sources.forEach(function (s) { html += '<span class="source-tag">' + esc(s) + '</span>'; });
      html += '</div>';
    }

    html += '<div class="rp-section"><div class="rp-section-title">Leitner Box</div><div style="font-size:0.8rem;color:var(--txt2)">Box '
      + (n.leitner ? n.leitner.box : 1) + ' · Next review: ' + (n.leitner ? n.leitner.nextReview : TODAY) + '</div></div>';

    if (n.review === false) {
      html += '<div class="rp-section"><button class="btn btn-sm btn-success" id="accept-review" style="width:100%">Accept as reviewed ✓</button></div>';
    }
    html += '<div class="rp-section"><div class="rp-section-title">Flag Correction</div>'
      + '<div class="corr-form"><textarea id="corr-text" placeholder="Describe the correction…"></textarea>'
      + '<input id="corr-source" placeholder="Source (optional)">'
      + '<button class="btn btn-warning btn-sm" style="margin-top:6px" id="corr-submit">Submit Correction</button></div></div>';

    if (n.corrections && n.corrections.length > 0) {
      html += '<div class="rp-section"><div class="rp-section-title">Corrections (' + n.corrections.length + ')</div>';
      n.corrections.forEach(function (c) {
        html += '<div class="corr-item"><div class="corr-text">' + esc(c.text) + '</div><div class="corr-meta">'
          + c.date + (c.source ? ' · ' + esc(c.source) : '') + (c.resolved ? ' · ✓ Resolved' : '') + '</div></div>';
      });
      html += '</div>';
    }
    return html;
  }

  /* Re-render the panel for a given node id (post-mutation refresh). */
  function renderNode(id, api) {
    var n = findNode(id);
    if (!n) return;
    var cyNode = api.cy.getElementById(id);
    var html = buildDetail(cyNode.length ? cyNode : { id: function () { return id; } }, api);
    api.panel.open(n.label, html);
  }

  function panelNodeId(api) {
    var m = api.els.panelBody && api.els.panelBody.querySelector('[data-panel-node]');
    return m ? m.getAttribute('data-panel-node') : null;
  }

  /* ── Delegated panel-body interactions (attached once in onMount) ── */
  function makePanelHandler(api) {
    return function (ev) {
      var t = ev.target;

      // Connection click → focus the other node (engine isolates/centers/reopens panel)
      var edgeEl = t.closest ? t.closest('.rp-edge') : null;
      if (edgeEl && edgeEl.getAttribute('data-node')) {
        api.focusNode(edgeEl.getAttribute('data-node'));
        return;
      }

      // Accept a DRAFT node as reviewed
      var acc = t.closest ? t.closest('#accept-review') : null;
      if (acc) {
        var aid = panelNodeId(api);
        var an = aid && findNode(aid);
        if (an) { an.review = true; saveGraph(); api.toast('Marked reviewed'); renderNode(aid, api); }
        return;
      }

      // Submit a correction
      var sub = t.closest ? t.closest('#corr-submit') : null;
      if (sub) {
        var body = api.els.panelBody;
        var txtEl = body.querySelector('#corr-text');
        var srcEl = body.querySelector('#corr-source');
        var text = txtEl ? txtEl.value.trim() : '';
        if (!text) return;
        var srcv = srcEl ? srcEl.value.trim() : '';
        var cid = panelNodeId(api);
        var cn = cid && findNode(cid);
        if (!cn) return;
        if (!cn.corrections) cn.corrections = [];
        cn.corrections.push({ text: text, source: srcv, date: TODAY, resolved: false });
        saveGraph();
        var cyNode = api.cy.getElementById(cid);
        if (cyNode.length) cyNode.data('hasCorrections', true);
        renderNode(cid, api);
        api.toast('Correction flagged');
        return;
      }
    };
  }

  /* ── Subspecialty filter (applyFilters, operating on api.cy) ── */
  function applyFilters(api) {
    var keys = Object.keys(activeSpecs);
    if (keys.length === 0) { api.cy.nodes().removeClass('faded'); return; }
    api.cy.nodes().forEach(function (n) {
      if (activeSpecs[normSub(n.data('subspecialty'))]) n.removeClass('faded');
      else n.addClass('faded');
    });
  }

  /* ── Bottom strip (updateBottomStrip + getDueCount) ── */
  function getDueCount() {
    var today = todayISO();
    return graph.nodes.filter(function (n) { return n.leitner && n.leitner.nextReview <= today; }).length;
  }
  function updateStrip(api) {
    var due = getDueCount();
    api.setStripLeft(due > 0 ? '<strong>' + due + '</strong> cards due for review' : 'No cards due');
    api.setStripRight(graph.nodes.length + ' nodes · ' + graph.edges.length + ' edges');
  }

  /* ── Mode toggle ── */
  function setMode(mode, api) {
    currentMode = mode;
    var btns = api.els.controls ? api.els.controls.querySelectorAll('.mode-btn') : [];
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-mode') === mode);
    if (mode === 'test') {
      startSelfTest(api);
    } else {
      if (api.els.testOverlay) api.els.testOverlay.classList.remove('active');
    }
  }

  /* ── Self-Test (Leitner) ── */
  function startSelfTest(api) {
    var today = todayISO();
    testQueue = graph.nodes.filter(function (n) { return n.leitner && n.leitner.nextReview <= today; })
      .sort(function (a, b) { return a.leitner.box - b.leitner.box; });
    testIndex = 0; testRevealed = false;
    if (testQueue.length === 0) {
      api.els.testCard.innerHTML = '<div class="test-done"><h2>All caught up!</h2><p>No cards due for review. Check back later.</p>'
        + '<button class="btn btn-secondary" id="test-exit">Back to Explore</button></div>';
      if (api.els.testOverlay) api.els.testOverlay.classList.add('active');
      var ex = api.els.testCard.querySelector('#test-exit');
      if (ex) ex.addEventListener('click', function () { setMode('explore', api); });
      return;
    }
    showTestCard(api);
    if (api.els.testOverlay) api.els.testOverlay.classList.add('active');
  }

  function showTestCard(api) {
    if (testIndex >= testQueue.length) {
      api.els.testCard.innerHTML = '<div class="test-done"><h2>Session Complete ✓</h2><p>Reviewed ' + testQueue.length
        + ' card' + (testQueue.length === 1 ? '' : 's') + '.</p><button class="btn btn-primary" id="test-exit2">Back to Explore</button></div>';
      var ex2 = api.els.testCard.querySelector('#test-exit2');
      if (ex2) ex2.addEventListener('click', function () { setMode('explore', api); });
      updateStrip(api);
      return;
    }
    testRevealed = false;
    var node = testQueue[testIndex];
    var edges = edgesOf(node.id);
    var connNodes = edges.map(function (e) {
      var oid = e.source === node.id ? e.target : e.source; return findNode(oid);
    }).filter(Boolean);

    var html = '<div class="test-progress"><div class="test-progress-bar"><div class="test-progress-fill" style="width:'
      + ((testIndex / testQueue.length) * 100) + '%"></div></div><div class="test-progress-text">'
      + (testIndex + 1) + '/' + testQueue.length + '</div></div>';
    html += '<div style="margin-bottom:0.5rem"><span class="badge badge-' + esc(node.type) + '">' + esc(node.type) + '</span>'
      + '<span class="badge badge-sub">' + esc(node.subspecialty) + '</span>'
      + '<span class="badge" style="background:var(--hover);color:var(--txt3)">Box ' + node.leitner.box + '</span></div>';
    if (edges.length > 0) {
      html += '<div class="test-edges">';
      edges.forEach(function (e) { html += '<span class="test-edge-tag">' + esc(e.type) + '</span>'; });
      html += '</div>';
    }
    if (connNodes.length > 0) {
      html += '<div class="test-hints">';
      connNodes.forEach(function (cn) { html += '<span class="test-hint">' + esc(cn.label) + '</span>'; });
      html += '</div>';
    }
    html += '<div style="font-size:0.78rem;color:var(--txt3);margin:0.5rem 0">What is this structure?</div>';
    html += '<input class="test-input" id="test-answer" placeholder="Type your answer…" autocomplete="off">';
    html += '<div><button class="btn btn-secondary" id="test-reveal-btn">Reveal (Enter)</button></div>';
    html += '<div id="test-reveal-area" class="test-reveal" style="display:none"></div>';
    html += '<div id="test-confidence" class="confidence-btns" style="display:none"></div>';
    api.els.testCard.innerHTML = html;

    var ansInput = api.els.testCard.querySelector('#test-answer');
    if (ansInput) {
      ansInput.focus();
      ansInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') revealAnswer(api); });
    }
    var rb = api.els.testCard.querySelector('#test-reveal-btn');
    if (rb) rb.addEventListener('click', function () { revealAnswer(api); });
  }

  function revealAnswer(api) {
    if (testRevealed) return;
    testRevealed = true;
    var node = testQueue[testIndex];
    var area = api.els.testCard.querySelector('#test-reveal-area');
    var conf = api.els.testCard.querySelector('#test-confidence');
    if (area) {
      area.style.display = '';
      area.innerHTML = '<div class="rp-label">' + esc(node.label) + '</div><div class="rp-detail">' + esc(node.detail) + '</div>';
    }
    if (conf) {
      conf.style.display = 'flex';
      conf.innerHTML = '<button class="conf-btn again" data-conf="again">Again<span class="key">1</span></button>'
        + '<button class="conf-btn hard" data-conf="hard">Hard<span class="key">2</span></button>'
        + '<button class="conf-btn good" data-conf="good">Good<span class="key">3</span></button>'
        + '<button class="conf-btn easy" data-conf="easy">Easy<span class="key">4</span></button>';
      var cbs = conf.querySelectorAll('.conf-btn');
      for (var i = 0; i < cbs.length; i++) {
        (function (b) { b.addEventListener('click', function () { scoreCard(b.getAttribute('data-conf'), api); }); })(cbs[i]);
      }
    }
    var ans = api.els.testCard.querySelector('#test-answer');
    if (ans) ans.blur();
  }

  function scoreCard(conf, api) {
    var node = testQueue[testIndex];
    var box = node.leitner.box;
    if (conf === 'again') box = 1;
    else if (conf === 'hard') { /* same box */ }
    else if (conf === 'good') box = Math.min(box + 1, 5);
    else if (conf === 'easy') box = Math.min(box + 2, 5);
    node.leitner.box = box;
    var interval = LEITNER_INTERVALS[box] || 1;
    var next = new Date();
    next.setDate(next.getDate() + (conf === 'hard' ? 1 : interval));
    node.leitner.nextReview = next.toISOString().split('T')[0];
    saveGraph();
    testIndex++;
    showTestCard(api);
  }

  /* Document-level keyboard shortcuts for self-test (attach/detach). */
  function makeKeyHandler(api) {
    return function (e) {
      if (currentMode !== 'test' || !(api.els.testOverlay && api.els.testOverlay.classList.contains('active'))) return;
      if (!testRevealed && e.key === 'Enter') { revealAnswer(api); return; }
      if (testRevealed) {
        if (e.key === '1') scoreCard('again', api);
        else if (e.key === '2') scoreCard('hard', api);
        else if (e.key === '3') scoreCard('good', api);
        else if (e.key === '4') scoreCard('easy', api);
      }
    };
  }

  /* ── Rebuild the cy graph in-place after import/reset ── */
  function rebuildCy(api) {
    api.cy.elements().remove();
    api.cy.add(buildElements(graph));
    api.cy.layout(Object.assign({}, LAYOUT)).run();
  }

  /* ── Settings modal (openSettings, kag 1416-1502) ── */
  function openSettings(api) {
    var body = api.els.settingsBody;
    var html = '<div class="modal-actions"><button class="btn btn-secondary" id="set-import">Import Graph JSON</button>'
      + '<button class="btn btn-secondary" id="set-export">Export Graph JSON</button>'
      + '<button class="btn btn-danger" id="set-reset">Discard local edits</button></div>';

    if (window.KAGStore) {
      html += '<div class="rp-section-title" style="margin-top:1rem">Canonical graph sync</div>';
      html += '<div class="modal-actions"><button class="btn btn-secondary" id="set-dl-merged">Download merged graph</button>'
        + '<button class="btn btn-secondary" id="set-push">Push via token</button></div>';
      html += '<div style="font-size:0.75rem;color:var(--txt3);margin-top:4px">Persists this browser\'s graph to <code>data/kag-graph.json</code>: commit the download, or push with a fine-grained GitHub token (used once, never stored).</div>';
    }

    var allCorr = [];
    graph.nodes.forEach(function (n) {
      (n.corrections || []).forEach(function (c, i) { if (!c.resolved) allCorr.push({ node: n, corr: c, idx: i }); });
    });
    html += '<div class="rp-section-title" style="margin-top:1rem">Corrections Inbox (' + allCorr.length + ')</div>';
    if (allCorr.length === 0) html += '<div style="font-size:0.8rem;color:var(--txt3)">No unresolved corrections</div>';
    allCorr.forEach(function (item) {
      html += '<div class="corr-item"><div class="corr-node">' + esc(item.node.label) + '</div>'
        + '<div class="corr-text">' + esc(item.corr.text) + '</div>'
        + '<div class="corr-meta">' + item.corr.date + (item.corr.source ? ' · ' + esc(item.corr.source) : '') + '</div>'
        + '<button class="btn btn-sm btn-success corr-resolve" data-node="' + esc(item.node.id) + '" data-idx="' + item.idx + '">Mark Resolved</button></div>';
    });

    body.innerHTML = html;
    api.els.settingsModal.classList.add('open');

    if (window.KAGStore) {
      var dlBtn = body.querySelector('#set-dl-merged');
      if (dlBtn) dlBtn.addEventListener('click', function () {
        window.KAGStore.download(graph); api.toast('Downloaded kag-graph.json — commit it to persist');
      });
      var pushBtn = body.querySelector('#set-push');
      if (pushBtn) pushBtn.addEventListener('click', function () {
        var token = prompt('Fine-grained GitHub token (used once, never stored):');
        if (!token) return;
        api.toast('Pushing to data/kag-graph.json…');
        window.KAGStore.push(graph, token)
          .then(function () { api.toast('Pushed to data/kag-graph.json'); })
          .catch(function (err) { api.toast('Push failed: ' + (err && err.message ? err.message : err)); });
      });
    }

    body.querySelector('#set-import').addEventListener('click', function () {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
      inp.addEventListener('change', function () {
        var file = inp.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var imported = JSON.parse(reader.result);
            if (!imported.nodes || !imported.edges) throw new Error('Invalid');
            var existIds = {};
            graph.nodes.forEach(function (n) { existIds[n.id] = true; });
            var addN = 0, addE = 0;
            imported.nodes.forEach(function (n) { if (!existIds[n.id]) { graph.nodes.push(n); existIds[n.id] = true; addN++; } });
            var existEdge = {};
            graph.edges.forEach(function (e) { existEdge[e.source + '|' + e.target + '|' + e.type] = true; });
            imported.edges.forEach(function (e) {
              var k = e.source + '|' + e.target + '|' + e.type;
              if (!existEdge[k] && existIds[e.source] && existIds[e.target]) { graph.edges.push(e); existEdge[k] = true; addE++; }
            });
            saveGraph(); rebuildCy(api); updateStrip(api);
            api.toast('Imported +' + addN + ' nodes, +' + addE + ' edges');
            api.els.settingsModal.classList.remove('open');
          } catch (e) { api.toast('Import failed: ' + e.message); }
        };
        reader.readAsText(file);
      });
      inp.click();
    });

    body.querySelector('#set-export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'kag-graph-' + TODAY + '.json'; a.click();
      URL.revokeObjectURL(url);
      api.toast('Exported graph JSON');
    });

    body.querySelector('#set-reset').addEventListener('click', function () {
      if (!confirm('Discard this browser\'s local edits and reload the canonical atlas (data/kag-graph.json)? This cannot be undone.')) return;
      try { localStorage.removeItem('kag-graph'); } catch (e) { /* no-op */ }
      var finish = function (g) {
        graph = g; saveGraph(); rebuildCy(api); updateStrip(api);
        api.toast('Reloaded canonical atlas'); api.els.settingsModal.classList.remove('open');
      };
      if (window.KAGStore && typeof window.KAGStore.fetch === 'function') {
        window.KAGStore.fetch().then(function (file) {
          finish((file && file.nodes && file.edges) ? window.KAGStore.merge(file) : { nodes: [], edges: [] });
        });
      } else {
        finish({ nodes: [], edges: [] });
      }
    });

    var resolves = body.querySelectorAll('.corr-resolve');
    for (var i = 0; i < resolves.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var node = findNode(btn.getAttribute('data-node'));
          var idx = btn.getAttribute('data-idx');
          if (node && node.corrections[idx]) node.corrections[idx].resolved = true;
          saveGraph(); openSettings(api); api.toast('Correction resolved');
        });
      })(resolves[i]);
    }
  }

  /* ── buildControls: subspecialty pills + mode toggle + gear + strip ── */
  function buildControls(el, api) {
    _api = api;
    activeSpecs = {};

    // (a) subspecialty filter pills
    SUBSPECIALTIES.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'pill';
      b.textContent = (SUB_LABELS[s] && SUB_LABELS[s].label) || s;
      b.setAttribute('data-spec', s);
      b.addEventListener('click', function () {
        if (activeSpecs[s]) { delete activeSpecs[s]; b.classList.remove('active'); }
        else { activeSpecs[s] = true; b.classList.add('active'); }
        applyFilters(api);
      });
      el.appendChild(b);
    });

    // (b) Explore / Self-Test mode toggle
    var toggle = document.createElement('div');
    toggle.className = 'mode-toggle';
    ['explore', 'test'].forEach(function (m) {
      var btn = document.createElement('button');
      btn.className = 'mode-btn' + (m === currentMode ? ' active' : '');
      btn.setAttribute('data-mode', m);
      btn.textContent = m === 'explore' ? 'Explore' : 'Self-Test';
      btn.addEventListener('click', function () { setMode(m, api); });
      toggle.appendChild(btn);
    });
    el.appendChild(toggle);

    // (c) settings gear
    var gear = document.createElement('button');
    gear.className = 'gear-btn';
    gear.type = 'button';
    gear.title = 'Settings';
    gear.textContent = '⚙';
    gear.addEventListener('click', function () { openSettings(api); });
    el.appendChild(gear);

    updateStrip(api);
  }

  /* ── Mount / unmount: attach & detach the shared shells ── */
  function onMount(api) {
    _api = api;
    currentMode = 'explore';

    // panel-body delegation (survives innerHTML swaps; deep-link safe)
    if (api.els.panelBody) {
      _panelHandler = makePanelHandler(api);
      api.els.panelBody.addEventListener('click', _panelHandler);
    }
    // self-test keyboard shortcuts
    _keyHandler = makeKeyHandler(api);
    document.addEventListener('keydown', _keyHandler);
  }

  function onUnmount(api) {
    // CRITICAL: the overlay/modal/panel-body DOM is shared across lenses.
    if (_keyHandler) { document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
    if (_panelHandler && api.els.panelBody) { api.els.panelBody.removeEventListener('click', _panelHandler); }
    _panelHandler = null;
    if (api.els.testOverlay) api.els.testOverlay.classList.remove('active');
    if (api.els.settingsModal) api.els.settingsModal.classList.remove('open');
    currentMode = 'explore';
    testQueue = []; testIndex = 0; testRevealed = false;
    activeSpecs = {};
  }

  window.GraphLenses = window.GraphLenses || {};
  window.GraphLenses.knowledge = {
    id: 'knowledge', label: 'Knowledge', title: 'Knowledge Atlas Graph',
    searchFields: ['label', 'detail'],
    source: source,
    style: style,
    layout: LAYOUT,
    onTap: function (node, api) {
      if (currentMode !== 'explore') return;   // no panel in Self-Test mode
      renderNode(node.id(), api);
    },
    onDblTap: function (node, api) {
      if (currentMode !== 'explore') return;
      api.isolate(node);
    },
    onBackgroundTap: function (api) { api.clearIsolate(); api.panel.close(); },
    buildDetail: buildDetail,
    buildControls: buildControls,
    onMount: onMount,
    onUnmount: onUnmount
  };
})();
