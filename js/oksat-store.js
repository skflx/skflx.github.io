/* =============================================================
   OKSAT storage adapter — window.OKSATStore
   (OHNS Knowledge Self-Assessment Tool.)
   One fail-safe localStorage layer: identity resolution, session
   counting, concept mastery, and confidence calibration.

   Loaded as a plain <script> BEFORE the engine. Progress and SRS
   keys (oksat:progress:*, oksat:srs:*) are owned by the engine;
   oksat:font / sk_theme by oksat-prefs.js. All reads and writes
   here are guarded and never throw.

   ---- Identity ----
   Keys stay namespaced `...:<code>` because that is the shape the
   existing on-disk data already has. The multi-reviewer UI is gone
   (single user, no prompt), so the code is now resolved silently
   from the stored `oksat:reviewer` value and falls back to the
   engine's historical default, 'guest'. Same key, same data — the
   modal is what disappeared, not the namespace.
   ============================================================= */
(function () {
  'use strict';

  var SESSION_GAP_MS = 30 * 60 * 1000; // >30 min idle starts a new session

  /* ---- primitives ---- */
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch (e) { return false; }
  }
  function keysWithPrefix(prefix) {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) out.push(k);
      }
    } catch (e) {}
    return out;
  }

  /* Reviewer code → namespace. Same rule the engine has always used. */
  function norm(code) {
    return String(code || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
  }

  /* One-time rename migration (mcq:* → oksat:*), kept because a browser
     that has not opened the site since the rename still holds the old
     keys. Never overwrites an existing oksat:* key; runs once per browser. */
  (function migrateLegacyKeys() {
    try {
      if (localStorage.getItem('oksat:migrated')) return;
      keysWithPrefix('mcq:').forEach(function (k) {
        var nk = 'oksat:' + k.slice(4);
        if (localStorage.getItem(nk) == null) localStorage.setItem(nk, localStorage.getItem(k));
      });
      localStorage.setItem('oksat:migrated', new Date().toISOString());
    } catch (e) { /* storage unavailable — nothing to migrate */ }
  })();

  /* The active namespace. Reads whatever code this browser already
     wrote, so progress from the multi-reviewer era keeps resolving. */
  function reviewer() {
    try { return norm(localStorage.getItem('oksat:reviewer')); }
    catch (e) { return 'guest'; }
  }

  var today = function () { return new Date().toISOString().split('T')[0]; };
  var nowISO = function () { return new Date().toISOString(); };
  var clampBox = function (b) { return Math.max(1, Math.min(5, b | 0 || 1)); };

  /* ---- session counter (analytics only — never scheduling) ---- */
  function touchSession(who) {
    var r = norm(who);
    var key = 'oksat:session:' + r;
    var rec = load(key, null) || { v: 1, n: 0, last: 0 };
    var now = Date.now();
    if (!rec.n || (now - (rec.last || 0)) > SESSION_GAP_MS) rec.n = (rec.n || 0) + 1;
    rec.last = now;
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
    return rec.n;
  }
  function getSession(who) {
    return load('oksat:session:' + norm(who), { v: 1, n: 0, last: 0 });
  }

  /* ---- concept mastery (derived layer; item SRS is untouched) ---- */
  function cmasteryKey(slug, who) {
    return 'oksat:cmastery:' + slug + ':' + norm(who);
  }
  function blankConcept() {
    return { box: 1, seen: 0, correct: 0, lapses: 0, boosted: 0, last: today() };
  }
  function recordConceptResult(slug, who, conceptKeys, correct) {
    if (!slug || !Array.isArray(conceptKeys) || !conceptKeys.length) return;
    var key = cmasteryKey(slug, who);
    var rec = load(key, null) || { v: 1, concepts: {} };
    if (!rec.concepts) rec.concepts = {};
    for (var i = 0; i < conceptKeys.length; i++) {
      var c = conceptKeys[i];
      var cur = rec.concepts[c] || blankConcept();
      cur.seen = (cur.seen || 0) + 1;
      if (correct) { cur.correct = (cur.correct || 0) + 1; cur.box = clampBox((cur.box || 1) + 1); }
      else { cur.lapses = (cur.lapses || 0) + 1; cur.box = clampBox((cur.box || 1) - 1); }
      cur.last = today();
      rec.concepts[c] = cur;
    }
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
  }
  function getConceptMastery(slug, who) {
    return load(cmasteryKey(slug, who), { v: 1, concepts: {} });
  }

  /* ---- confidence calibration (MCQ only; skip writes nothing) ---- */
  function recordConfidence(slug, who, qId, tier, correct, conceptKeys, sessionN) {
    if (!slug || !qId || !tier) return;
    var key = 'oksat:conf:' + slug + ':' + norm(who);
    var rec = load(key, null) || { v: 1, entries: {} };
    if (!rec.entries) rec.entries = {};
    rec.entries[qId] = {
      c: tier,                                   // 'hi' | 'md' | 'lo'
      ok: !!correct,
      concepts: Array.isArray(conceptKeys) ? conceptKeys : [],
      s: sessionN || 0,
      t: today(),
    };
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
  }
  function getConfidence(slug, who) {
    return load('oksat:conf:' + slug + ':' + norm(who), { v: 1, entries: {} });
  }

  /* ---- wipe every local trace for one namespace ---- */
  function resetLocal(who) {
    var r = norm(who);
    var n = 0;
    ['oksat:progress:', 'oksat:srs:', 'oksat:cmastery:', 'oksat:conf:', 'oksat:session:']
      .forEach(function (prefix) {
        keysWithPrefix(prefix).forEach(function (k) {
          /* every key in these families ends in ':<code>' */
          if (k.slice(-(r.length + 1)) === ':' + r && remove(k)) n++;
        });
      });
    return n;
  }

  window.OKSATStore = {
    load: load, save: save, remove: remove, keysWithPrefix: keysWithPrefix, norm: norm,
    reviewer: reviewer, resetLocal: resetLocal,
    touchSession: touchSession, getSession: getSession,
    recordConceptResult: recordConceptResult, getConceptMastery: getConceptMastery,
    recordConfidence: recordConfidence, getConfidence: getConfidence,
    SESSION_GAP_MS: SESSION_GAP_MS,
  };
})();
