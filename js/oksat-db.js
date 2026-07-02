/* =============================================================
   OKSAT server database — data/oksat-db.json
   Per-reviewer, per-module completion with dated entries, stored
   as a plain JSON file in the repo (GitHub Pages is static, so the
   file *is* the database). Contains progress data only — never API
   keys, tokens, or anything secret.

   Read path:  fetched (cache-busted) on hub load; merged with this
               browser's localStorage so the freshest record wins.
   Write path: the Sync panel rewrites it two ways —
     1) download the merged file and commit it, or
     2) push directly via the GitHub Contents API with a
        fine-grained token pasted at sync time. The token lives in
        a local variable for that request only and is NEVER
        persisted (not localStorage, not the DB file, not the repo).
   ============================================================= */
(function () {
  var DB_PATH = 'data/oksat-db.json';
  var REPO = { owner: 'skflx', repo: 'skflx.github.io', branch: 'master' };
  var LOG_CAP = 400; // dated entries kept per reviewer

  function todayISO() { return new Date().toISOString().split('T')[0]; }

  function emptyDB() {
    return { version: 2, updated: new Date().toISOString(), reviewers: {} };
  }

  /* ---- read the server file (never throws; falls back to empty) ---- */
  var cached = null;
  function fetchDB() {
    if (cached) return Promise.resolve(cached);
    return fetch(DB_PATH + '?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (db) {
        if (!db || typeof db !== 'object' || !db.reviewers) db = emptyDB();
        cached = db; return db;
      })
      .catch(function () { cached = emptyDB(); return cached; });
  }

  /* ---- what this browser knows about `code` ---- (`code` is already normalized)
     v2 adds calibration (confidence tiers) and adaptive-topic aggregates —
     progress only, still no secrets. */
  function localSnapshot(code) {
    var out = {
      modules: {},
      calibration: { hi: { n: 0, c: 0 }, md: { n: 0, c: 0 }, lo: { n: 0, c: 0 } },
      adaptive: { topics: {} },
    };
    (window.OKSAT_MANIFEST || []).forEach(function (m) {
      var rec = null;
      try { rec = JSON.parse(localStorage.getItem('oksat:progress:' + m.slug + ':' + code) || 'null'); }
      catch (e) { rec = null; }
      if (!rec || !rec.answers) return;
      var answered = Object.keys(rec.answers).length;
      if (!answered) return;
      var correct = Object.keys(rec.firstCorrect || {}).filter(function (k) { return rec.firstCorrect[k]; }).length;
      out.modules[m.slug] = {
        answered: answered,
        correct: correct,
        total: m.count,
        updated: (rec.updated || new Date().toISOString()).split('T')[0],
      };
    });
    // Confidence calibration: fold every oksat:conf:*:<code> record into tier tallies.
    try {
      var suffix = ':' + code;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf('oksat:conf:') !== 0) continue;
        if (k.lastIndexOf(suffix) !== k.length - suffix.length) continue;
        var cr = JSON.parse(localStorage.getItem(k) || 'null');
        var entries = (cr && cr.entries) || {};
        Object.keys(entries).forEach(function (qid) {
          var e = entries[qid], tier = e && e.c;
          if (tier === 'hi' || tier === 'md' || tier === 'lo') {
            out.calibration[tier].n++;
            if (e.ok) out.calibration[tier].c++;
          }
        });
      }
    } catch (e) {}
    // Adaptive topic aggregates.
    try {
      var ad = JSON.parse(localStorage.getItem('oksat:adaptive:' + code) || 'null');
      var topics = (ad && ad.topics) || {};
      Object.keys(topics).forEach(function (id) {
        var t = topics[id] || {};
        out.adaptive.topics[id] = { attempts: t.attempts || 0, correct: t.correct || 0, updated: t.last || '' };
      });
    } catch (e) {}
    return out;
  }

  /* Progress only grows: more answered wins; ties go to the later date. */
  function better(a, b) {
    if (!a) return b; if (!b) return a;
    if ((b.answered || 0) !== (a.answered || 0)) return (b.answered || 0) > (a.answered || 0) ? b : a;
    return (b.updated || '') > (a.updated || '') ? b : a;
  }

  /* Server ∪ local view of one reviewer's completion (for the Atlas). */
  function completionFor(db, code) {
    var server = (db && db.reviewers && db.reviewers[code] && db.reviewers[code].modules) || {};
    var local = localSnapshot(code).modules;
    var out = {};
    (window.OKSAT_MANIFEST || []).forEach(function (m) {
      var rec = better(server[m.slug], local[m.slug]);
      if (rec) out[m.slug] = { answered: rec.answered, correct: rec.correct, total: rec.total || m.count, updated: rec.updated };
    });
    return out;
  }

  function reviewerList(db) {
    var set = {};
    Object.keys((db && db.reviewers) || {}).forEach(function (c) { set[c] = 1; });
    try { (JSON.parse(localStorage.getItem('oksat:reviewers') || '[]') || []).forEach(function (c) { set[c] = 1; }); }
    catch (e) {}
    return Object.keys(set).sort();
  }

  /* ---- rebuild the DB with this browser's knowledge folded in ---- */
  function buildMerged(db, code) {
    var next = JSON.parse(JSON.stringify(db || emptyDB()));
    if (!next.reviewers) next.reviewers = {};
    var codes = code ? [code] : reviewerList(next);
    codes.forEach(function (c) {
      var snap = localSnapshot(c);
      var local = snap.modules;
      var calN = snap.calibration.hi.n + snap.calibration.md.n + snap.calibration.lo.n;
      var hasLocal = Object.keys(local).length || calN || Object.keys(snap.adaptive.topics).length;
      if (!hasLocal && !next.reviewers[c]) return;
      var rv = next.reviewers[c] || (next.reviewers[c] = { modules: {}, log: [] });
      if (!rv.modules) rv.modules = {};
      if (!rv.log) rv.log = [];
      Object.keys(local).forEach(function (slug) {
        var merged = better(rv.modules[slug], local[slug]);
        var changed = !rv.modules[slug] || rv.modules[slug].answered !== merged.answered || rv.modules[slug].correct !== merged.correct;
        rv.modules[slug] = merged;
        if (changed) {
          rv.log.push({ date: todayISO(), slug: slug, answered: merged.answered, correct: merged.correct });
          if (rv.log.length > LOG_CAP) rv.log = rv.log.slice(rv.log.length - LOG_CAP);
        }
      });
      // v2: calibration — tier-wise, whichever record has seen more wins (monotone).
      if (calN) {
        var sc = rv.calibration || (rv.calibration = { hi: { n: 0, c: 0 }, md: { n: 0, c: 0 }, lo: { n: 0, c: 0 } });
        ['hi', 'md', 'lo'].forEach(function (tier) {
          var loc = snap.calibration[tier] || { n: 0, c: 0 };
          var srv = sc[tier] || { n: 0, c: 0 };
          if ((loc.n || 0) > (srv.n || 0)) sc[tier] = { n: loc.n, c: loc.c };
        });
      }
      // v2: adaptive — per topic, more attempts wins; tie → later date.
      var localTopics = snap.adaptive.topics;
      if (Object.keys(localTopics).length) {
        var ra = rv.adaptive || (rv.adaptive = { topics: {} });
        if (!ra.topics) ra.topics = {};
        Object.keys(localTopics).forEach(function (id) {
          var loc = localTopics[id], srv = ra.topics[id];
          var win = !srv || (loc.attempts || 0) > (srv.attempts || 0) ||
            ((loc.attempts || 0) === (srv.attempts || 0) && (loc.updated || '') > (srv.updated || ''));
          if (win) ra.topics[id] = { attempts: loc.attempts, correct: loc.correct, updated: loc.updated };
        });
      }
    });
    next.version = 2;
    next.updated = new Date().toISOString();
    return next;
  }

  /* ---- write path 1: download the merged file to commit ---- */
  function download(db) {
    var blob = new Blob([JSON.stringify(db, null, 2) + '\n'], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'oksat-db.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  /* ---- write path 2: GitHub Contents API (token used once, in memory only) ---- */
  function push(db, token) {
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
          message: 'Sync OKSAT completion database (' + todayISO() + ')',
          content: btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2) + '\n'))),
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

  window.OKSATDB = {
    fetch: fetchDB,
    localSnapshot: localSnapshot,
    completionFor: completionFor,
    reviewerList: reviewerList,
    buildMerged: buildMerged,
    download: download,
    push: push,
  };
})();
