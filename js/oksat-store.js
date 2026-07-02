/* =============================================================
   OKSAT storage adapter — window.OKSATStore
   (OHNS Knowledge Self-Assessment Tool.)
   One fail-safe localStorage layer for all NEW persistence:
   session counting, concept mastery, confidence calibration,
   adaptive-topic state, and starred generated questions.

   Loaded as a plain <script> BEFORE the engine / dashboard /
   adaptive pages. Existing keys (oksat:progress:*, oksat:srs:*,
   oksat:reviewer, oksat:font, sk_theme, oksat:gemini-*) are NOT
   owned here — legacy helpers keep managing them. All keys are
   per-reviewer-namespaced; all reads/writes never throw.
   Schema: docs/oksat-next-iteration-plan.md §5.
   ============================================================= */
(function () {
  'use strict';

  var SESSION_GAP_MS = 30 * 60 * 1000; // >30 min idle starts a new session
  var STAR_CAP = 100;                  // hard cap on starred questions
  var RECENT_CAP = 10;                 // rolling window for adaptive difficulty

  /* ---- primitives (semantics mirror js/oksat-engine.js:78-84) ---- */
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

  /* Reviewer code → namespace. Same rule as the engine's normCode. */
  function norm(code) {
    return String(code || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
  }

  var today = function () { return new Date().toISOString().split('T')[0]; };
  var nowISO = function () { return new Date().toISOString(); };
  var clampBox = function (b) { return Math.max(1, Math.min(5, b | 0 || 1)); };

  /* ---- session counter (analytics only — never scheduling) ---- */
  function touchSession(reviewer) {
    var r = norm(reviewer);
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
  function getSession(reviewer) {
    return load('oksat:session:' + norm(reviewer), { v: 1, n: 0, last: 0 });
  }

  /* ---- concept mastery (derived layer; item SRS is untouched) ---- */
  function cmasteryKey(slug, reviewer) {
    return 'oksat:cmastery:' + slug + ':' + norm(reviewer);
  }
  function blankConcept() {
    return { box: 1, seen: 0, correct: 0, lapses: 0, boosted: 0, last: today() };
  }
  function recordConceptResult(slug, reviewer, conceptKeys, correct) {
    if (!slug || !Array.isArray(conceptKeys) || !conceptKeys.length) return;
    var key = cmasteryKey(slug, reviewer);
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
  function getConceptMastery(slug, reviewer) {
    return load(cmasteryKey(slug, reviewer), { v: 1, concepts: {} });
  }

  /* ---- confidence calibration (MCQ only; skip writes nothing) ---- */
  function recordConfidence(slug, reviewer, qId, tier, correct, conceptKeys, sessionN) {
    if (!slug || !qId || !tier) return;
    var key = 'oksat:conf:' + slug + ':' + norm(reviewer);
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
  function getConfidence(slug, reviewer) {
    return load('oksat:conf:' + slug + ':' + norm(reviewer), { v: 1, entries: {} });
  }

  /* ---- adaptive topic state (written by the adaptive page) ---- */
  function adaptiveKey(reviewer) { return 'oksat:adaptive:' + norm(reviewer); }
  function recordAdaptive(reviewer, topicId, correct) {
    if (!topicId) return;
    var key = adaptiveKey(reviewer);
    var rec = load(key, null) || { v: 1, topics: {} };
    if (!rec.topics) rec.topics = {};
    var t = rec.topics[topicId] || { level: 2, attempts: 0, correct: 0, recent: [] };
    t.attempts = (t.attempts || 0) + 1;
    if (correct) t.correct = (t.correct || 0) + 1;
    t.recent = (t.recent || []).concat(correct ? 1 : 0).slice(-RECENT_CAP);
    t.last = today();
    rec.topics[topicId] = t;
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
  }
  function getAdaptive(reviewer) {
    return load(adaptiveKey(reviewer), { v: 1, topics: {} });
  }
  function setAdaptiveLevel(reviewer, topicId, level) {
    if (!topicId) return;
    var key = adaptiveKey(reviewer);
    var rec = load(key, null) || { v: 1, topics: {} };
    if (!rec.topics) rec.topics = {};
    var t = rec.topics[topicId] || { level: 2, attempts: 0, correct: 0, recent: [] };
    t.level = Math.max(1, Math.min(5, level | 0 || 2));
    rec.topics[topicId] = t;
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
  }

  /* ---- starred generated questions (FIFO cap 100) ---- */
  function starKey(reviewer) { return 'oksat:starred:' + norm(reviewer); }
  function getStarred(reviewer) {
    return load(starKey(reviewer), { v: 1, items: [] });
  }
  function addStar(reviewer, item) {
    if (!item || !item.id) return { ok: false, reason: 'invalid' };
    var key = starKey(reviewer);
    var rec = load(key, null) || { v: 1, items: [] };
    if (!Array.isArray(rec.items)) rec.items = [];
    if (rec.items.some(function (x) { return x && x.id === item.id; })) return { ok: true, reason: 'exists' };
    if (rec.items.length >= STAR_CAP) return { ok: false, reason: 'cap' };
    var stored = Object.assign({}, item);
    if (!stored.savedAt) stored.savedAt = nowISO();
    rec.items.push(stored);
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
    return { ok: true };
  }
  function removeStar(reviewer, id) {
    var key = starKey(reviewer);
    var rec = load(key, null) || { v: 1, items: [] };
    if (!Array.isArray(rec.items)) rec.items = [];
    rec.items = rec.items.filter(function (x) { return !(x && x.id === id); });
    rec.v = 1;
    rec.updated = nowISO();
    save(key, rec);
    return { ok: true };
  }

  window.OKSATStore = {
    load: load, save: save, remove: remove, keysWithPrefix: keysWithPrefix, norm: norm,
    touchSession: touchSession, getSession: getSession,
    recordConceptResult: recordConceptResult, getConceptMastery: getConceptMastery,
    recordConfidence: recordConfidence, getConfidence: getConfidence,
    recordAdaptive: recordAdaptive, getAdaptive: getAdaptive, setAdaptiveLevel: setAdaptiveLevel,
    addStar: addStar, removeStar: removeStar, getStarred: getStarred,
    STAR_CAP: STAR_CAP, SESSION_GAP_MS: SESSION_GAP_MS,
  };
})();
