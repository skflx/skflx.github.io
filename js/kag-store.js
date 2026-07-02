/* =============================================================
   KAG store — data/kag-graph.json (the canonical KAG database)

   This file mirrors js/oksat-db.js. GitHub Pages is static, so the
   JSON file *is* the database. The Knowledge-Assembly Graph shape is
   { version, updated, status, sources, nodes:[...], edges:[...] };
   it holds concept nodes, their leitner progress and corrections,
   and the edges between them — progress data only, NEVER any secret.

   Read path:  fetched (cache-busted) on load, then merged with this
               browser's localStorage['kag-graph'] so LOCAL WINS on
               conflicts (the user's leitner boxes and corrections
               are preserved); the file only ADDS nodes/edges the
               local copy is missing.
   Write path: persisted two ways, exactly like oksat-db.js —
     1) download the merged file and commit it, or
     2) push directly via the GitHub Contents API with a
        fine-grained token pasted at sync time. The token lives in
        a local variable for that request only and is NEVER
        persisted (not localStorage, not the DB file, not the repo).

   Loaded as a plain <script> (no build step, no imports). Every
   helper is defensive: storage reads/writes are wrapped in
   try/catch and fail safe; fetch() never throws or rejects.
   ============================================================= */
(function () {
  'use strict';

  var DB_PATH = 'data/kag-graph.json';
  var REPO = { owner: 'skflx', repo: 'skflx.github.io', branch: 'master' };
  var LOCAL_KEY = 'kag-graph';

  // legacy KAG subspecialty -> canonical OKSAT key
  var SUB_MAP = {
    'head-neck-onc': 'hn_onc',
    'peds-ent': 'pediatrics',
    'facial-plastics': 'fprs',
    'skull-base': 'otology',
  };

  function todayISO() { return new Date().toISOString().split('T')[0]; }

  /* ---- read the server file (never throws; null on any failure) ---- */
  var cached = null;
  function fetchGraph() {
    if (cached) return Promise.resolve(cached);
    return fetch(DB_PATH + '?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (g) {
        if (!g || typeof g !== 'object') return null;
        cached = g; return g;
      })
      .catch(function () { return null; });
  }

  /* ---- what this browser has saved (guarded localStorage) ---- */
  function readLocal() {
    try {
      var raw = window.localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      var g = JSON.parse(raw);
      return (g && typeof g === 'object') ? g : null;
    } catch (e) {
      return null;
    }
  }

  function save(graph) {
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(graph));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---- pure merge: LOCAL WINS, file only ADDS missing nodes/edges ---- */
  function edgeKey(e) {
    return (e && e.source) + '|' + (e && e.target) + '|' + (e && e.type);
  }

  function merge(fileGraph) {
    var local = readLocal();
    if (!local) {
      // deep-ish copy is fine
      try { return fileGraph ? JSON.parse(JSON.stringify(fileGraph)) : fileGraph; }
      catch (e) { return fileGraph; }
    }
    if (!fileGraph) return local;

    var localNodes = (local && local.nodes) || [];
    var localEdges = (local && local.edges) || [];
    var fileNodes = (fileGraph && fileGraph.nodes) || [];
    var fileEdges = (fileGraph && fileGraph.edges) || [];

    var mergedNodes = localNodes.slice();
    var haveIds = {};
    var i, n;
    for (i = 0; i < localNodes.length; i++) {
      n = localNodes[i];
      if (n && n.id != null) haveIds[n.id] = true;
    }
    for (i = 0; i < fileNodes.length; i++) {
      n = fileNodes[i];
      if (n && n.id != null && !haveIds[n.id]) {
        mergedNodes.push(n);
        haveIds[n.id] = true;
      }
    }

    var mergedEdges = localEdges.slice();
    var haveEdges = {};
    var e;
    for (i = 0; i < localEdges.length; i++) {
      e = localEdges[i];
      if (e) haveEdges[edgeKey(e)] = true;
    }
    for (i = 0; i < fileEdges.length; i++) {
      e = fileEdges[i];
      if (e) {
        var k = edgeKey(e);
        if (!haveEdges[k]) { mergedEdges.push(e); haveEdges[k] = true; }
      }
    }

    return {
      version: (fileGraph && fileGraph.version) || (local && local.version) || 2,
      updated: (fileGraph && fileGraph.updated) || '',
      status: fileGraph && fileGraph.status,
      sources: (fileGraph && fileGraph.sources) || [],
      nodes: mergedNodes,
      edges: mergedEdges,
    };
  }

  function load(fileGraph) { return merge(fileGraph); }

  /* ---- pure subspecialty normalizer (no mutation) ---- */
  function normSub(x) {
    if (SUB_MAP.hasOwnProperty(x)) return SUB_MAP[x];
    return x;
  }

  /* ---- "<module>:<concept>" -> [node id, ...] ---- */
  function reverseConcept(graph) {
    var out = {};
    try {
      var nodes = (graph && graph.nodes) || [];
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!node || node.id == null) continue;
        var oksat = node.oksat;
        var concepts = oksat && oksat.concepts;
        if (!concepts || !concepts.length) continue;
        for (var j = 0; j < concepts.length; j++) {
          var c = concepts[j];
          if (!c || c.module == null || c.concept == null) continue;
          var key = c.module + ':' + c.concept;
          if (!out[key]) out[key] = [];
          out[key].push(node.id);
        }
      }
    } catch (e) { /* no-op */ }
    return out;
  }

  /* ---- shape-only audit (never throws) ---- */
  function audit(graph) {
    var problems = [];
    try {
      var nodes = (graph && graph.nodes) || [];
      var edges = (graph && graph.edges) || [];
      var known = {};
      var seen = {};
      var i, n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (!n || n.id == null) continue;
        if (seen[n.id]) problems.push({ kind: 'dupe-id', id: n.id });
        seen[n.id] = true;
        known[n.id] = true;
      }
      for (i = 0; i < edges.length; i++) {
        var e = edges[i];
        if (!e) continue;
        if (!known[e.source] || !known[e.target]) {
          problems.push({ kind: 'dangling-edge', edge: e });
        }
      }
    } catch (err) { /* no-op */ }
    return problems;
  }

  /* ---- write path 1: download the merged file to commit ---- */
  function download(graph) {
    var blob = new Blob([JSON.stringify(graph, null, 2) + '\n'], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kag-graph.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  /* ---- write path 2: GitHub Contents API (token used once, in memory only) ---- */
  function push(graph, token) {
    var api = 'https://api.github.com/repos/' + REPO.owner + '/' + REPO.repo + '/contents/' + DB_PATH;
    var headers = {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    return fetch(api + '?ref=' + REPO.branch, { headers: headers })
      .then(function (r) {
        if (r.status === 404) return { sha: undefined };
        if (!r.ok) throw new Error('Could not read current file (HTTP ' + r.status + ')');
        return r.json();
      })
      .then(function (cur) {
        var body = {
          message: 'Sync KAG graph (' + todayISO() + ')',
          content: btoa(unescape(encodeURIComponent(JSON.stringify(graph, null, 2) + '\n'))),
          branch: REPO.branch,
        };
        if (cur.sha) body.sha = cur.sha;
        return fetch(api, { method: 'PUT', headers: headers, body: JSON.stringify(body) });
      })
      .then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error('Push failed (HTTP ' + r.status + ')' + (j.message ? ': ' + j.message : ''));
        });
        return r.json();
      });
  }

  window.KAGStore = {
    DB_PATH: DB_PATH,
    fetch: fetchGraph,
    readLocal: readLocal,
    save: save,
    merge: merge,
    load: load,
    normSub: normSub,
    reverseConcept: reverseConcept,
    audit: audit,
    download: download,
    push: push,
  };
})();
