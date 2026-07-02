/* =============================================================
   OKSAT concept graph — cross-module concept clusters
   (OHNS Knowledge Self-Assessment Tool.)

   Purpose: link semantically-related concept KEYS that live in
   different MCQ modules, so mastery earned on one concept can
   inform (never overwrite) sibling concepts elsewhere. Each
   cluster names a shared clinical theme and lists its members as
   {module, concept, weight}, where `module` is a manifest slug
   (see oksat-manifest.js) and `concept` is a literal key from that
   module's CONCEPTS map. `weight` (0..1) is how strongly a member
   represents the cluster's theme (central = 1.0, tangential ≈ 0.3).

   Exposes:
     window.OKSAT_CONCEPT_GRAPH — the data
     window.OKSATGraph          — pure, defensive helpers:
       clustersFor(slug, key), siblings(slug, key),
       propagate(slug, keys, reviewer), audit()

   Mastery records live in localStorage under
   `oksat:cmastery:<slug>:<reviewer>` as
   { v, concepts: { <key>: { box, seen, correct, lapses, boosted,
   last } }, updated }. This file prefers window.OKSATStore.load /
   .save when present and falls back to guarded localStorage JSON.

   Loaded as a plain <script> after oksat-store.js (no build step,
   no imports). All helpers are defensive and never throw.
   ============================================================= */

(function () {
  'use strict';

  // The five real module slugs from the manifest. Used by audit()
  // for shape validation (a member pointing at an unknown module is
  // structurally bad). Deep concept-key validation cannot happen
  // here — it requires each module's CONCEPTS map to be loaded — so
  // audit() only checks shape; see the console helper note below.
  var KNOWN_SLUGS = [
    'pediatrics',
    'ta-tubes',
    'vestibular-schwannoma',
    'facial-reanimation',
    'dtc-risk-stratification',
  ];

  window.OKSAT_CONCEPT_GRAPH = {
    version: 1,
    clusters: {

      'facial-nerve': {
        label: 'Facial Nerve — anatomy, grading & outcomes',
        members: [
          { module: 'facial-reanimation', concept: 'nerve-segments', weight: 1.0 },
          { module: 'facial-reanimation', concept: 'house-brackmann', weight: 0.8 },
          { module: 'facial-reanimation', concept: 'acute-repair', weight: 0.6 },
          { module: 'facial-reanimation', concept: 'case-acoustic', weight: 0.9 },
          { module: 'facial-reanimation', concept: 'corneal', weight: 0.4 },
          { module: 'vestibular-schwannoma', concept: 'facial-nerve', weight: 1.0 },
          { module: 'vestibular-schwannoma', concept: 'rehabilitation', weight: 0.5 },
        ],
      },

      'pediatric-ear-otitis-media': {
        label: 'Pediatric Ear — OME, tubes & middle ear',
        members: [
          { module: 'ta-tubes', concept: 'OME', weight: 1.0 },
          { module: 'ta-tubes', concept: 'eustachian-tube', weight: 0.9 },
          { module: 'ta-tubes', concept: 'tubes', weight: 0.9 },
          { module: 'ta-tubes', concept: 'myringotomy', weight: 0.7 },
          { module: 'ta-tubes', concept: 'tympanometry', weight: 0.7 },
          { module: 'ta-tubes', concept: 'middle-ear', weight: 0.8 },
          { module: 'pediatrics', concept: 'middle-ear', weight: 0.7 },
          { module: 'pediatrics', concept: 'CHL', weight: 0.6 },
        ],
      },

      'hearing-loss-workup': {
        label: 'Hearing Loss — audiometry & workup',
        members: [
          { module: 'pediatrics', concept: 'audiology', weight: 1.0 },
          { module: 'pediatrics', concept: 'acquired-SNHL', weight: 0.8 },
          { module: 'pediatrics', concept: 'workup', weight: 0.7 },
          { module: 'pediatrics', concept: 'ANSD', weight: 0.6 },
          { module: 'vestibular-schwannoma', concept: 'audiology', weight: 1.0 },
          { module: 'vestibular-schwannoma', concept: 'hearing-natural-history', weight: 0.7 },
          { module: 'vestibular-schwannoma', concept: 'presentation', weight: 0.5 },
        ],
      },

      'nodal-disease-neck': {
        label: 'Nodal Disease — neck levels & management',
        members: [
          { module: 'dtc-risk-stratification', concept: 'nodal-class', weight: 1.0 },
          { module: 'dtc-risk-stratification', concept: 'nodal-risk', weight: 0.9 },
          { module: 'dtc-risk-stratification', concept: 'nodal-completion', weight: 0.8 },
          { module: 'ta-tubes', concept: 'nodal-anatomy', weight: 0.9 },
          { module: 'ta-tubes', concept: 'node-dissection', weight: 0.8 },
          { module: 'ta-tubes', concept: 'node-malignancy', weight: 0.7 },
          { module: 'ta-tubes', concept: 'spinal-accessory', weight: 0.4 },
        ],
      },

      'cpa-skull-base-imaging': {
        label: 'CPA / Skull Base — anatomy & imaging',
        members: [
          { module: 'vestibular-schwannoma', concept: 'CPA', weight: 1.0 },
          { module: 'vestibular-schwannoma', concept: 'IAC', weight: 0.9 },
          { module: 'vestibular-schwannoma', concept: 'MRI', weight: 0.8 },
          { module: 'vestibular-schwannoma', concept: 'surrounding-anatomy', weight: 0.7 },
          { module: 'pediatrics', concept: 'imaging', weight: 0.5 },
          { module: 'ta-tubes', concept: 'imaging', weight: 0.5 },
        ],
      },

      'tumor-staging-risk': {
        label: 'Tumor Staging, Size & Histopathology',
        members: [
          { module: 'dtc-risk-stratification', concept: 't-category', weight: 1.0 },
          { module: 'dtc-risk-stratification', concept: 'ata-tiers', weight: 0.9 },
          { module: 'dtc-risk-stratification', concept: 'downstaging', weight: 0.7 },
          { module: 'dtc-risk-stratification', concept: 'subtype', weight: 0.7 },
          { module: 'vestibular-schwannoma', concept: 'tumor-size', weight: 0.6 },
          { module: 'vestibular-schwannoma', concept: 'Koos', weight: 0.6 },
          { module: 'vestibular-schwannoma', concept: 'tumor-growth', weight: 0.5 },
          { module: 'vestibular-schwannoma', concept: 'histopathology', weight: 0.5 },
        ],
      },

      'implantable-hearing-rehab': {
        label: 'Implantable Hearing Rehabilitation',
        members: [
          { module: 'pediatrics', concept: 'CI', weight: 1.0 },
          { module: 'pediatrics', concept: 'surgical', weight: 0.5 },
          { module: 'pediatrics', concept: 'treatment', weight: 0.5 },
          { module: 'ta-tubes', concept: 'cochlear-implant', weight: 0.9 },
          { module: 'vestibular-schwannoma', concept: 'rehabilitation', weight: 0.5 },
        ],
      },

      'pharyngeal-arch-embryology': {
        label: 'Pharyngeal / Branchial Arch Embryology',
        members: [
          { module: 'pediatrics', concept: 'embryology', weight: 1.0 },
          { module: 'pediatrics', concept: 'first-arch', weight: 0.9 },
          { module: 'pediatrics', concept: 'external-ear', weight: 0.5 },
          { module: 'ta-tubes', concept: 'embryology', weight: 0.9 },
          { module: 'facial-reanimation', concept: 'pharyngeal-arch', weight: 0.8 },
        ],
      },

    },
  };

  // ---- storage helpers (prefer OKSATStore, fall back to localStorage) ----

  function cmasteryKey(slug, reviewer) {
    return 'oksat:cmastery:' + slug + ':' + reviewer;
  }

  function loadRecord(slug, reviewer) {
    var key = cmasteryKey(slug, reviewer);
    try {
      if (window.OKSATStore && typeof window.OKSATStore.load === 'function') {
        var v = window.OKSATStore.load(key);
        if (v && typeof v === 'object') return v;
        if (typeof v === 'string') {
          try { return JSON.parse(v); } catch (e) { return null; }
        }
        return null;
      }
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveRecord(slug, reviewer, record) {
    var key = cmasteryKey(slug, reviewer);
    try {
      if (window.OKSATStore && typeof window.OKSATStore.save === 'function') {
        window.OKSATStore.save(key, record);
        return true;
      }
      window.localStorage.setItem(key, JSON.stringify(record));
      return true;
    } catch (e) {
      return false;
    }
  }

  function todayISO() {
    try {
      return new Date().toISOString().slice(0, 10);
    } catch (e) {
      return '';
    }
  }

  function boxOf(record, conceptKey) {
    try {
      var c = record && record.concepts && record.concepts[conceptKey];
      if (c && typeof c.box === 'number' && isFinite(c.box)) return c.box;
    } catch (e) { /* fall through */ }
    return 1;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  // ---- graph helpers ----

  function isMember(m) {
    return m && typeof m.module === 'string' && typeof m.concept === 'string';
  }

  function eachCluster(fn) {
    var g = window.OKSAT_CONCEPT_GRAPH;
    if (!g || !g.clusters) return;
    var ids = Object.keys(g.clusters);
    for (var i = 0; i < ids.length; i++) {
      var cluster = g.clusters[ids[i]];
      if (!cluster || !Array.isArray(cluster.members)) continue;
      fn(ids[i], cluster);
    }
  }

  var OKSATGraph = {

    // Cluster ids whose members include exactly (slug, conceptKey).
    clustersFor: function (slug, conceptKey) {
      var out = [];
      try {
        eachCluster(function (id, cluster) {
          for (var i = 0; i < cluster.members.length; i++) {
            var m = cluster.members[i];
            if (isMember(m) && m.module === slug && m.concept === conceptKey) {
              out.push(id);
              return;
            }
          }
        });
      } catch (e) { /* no-op */ }
      return out;
    },

    // All OTHER members (different module OR different concept) across
    // every cluster containing (slug, conceptKey). Bad-shape members skipped.
    siblings: function (slug, conceptKey) {
      var out = [];
      try {
        eachCluster(function (id, cluster) {
          var contains = false;
          for (var i = 0; i < cluster.members.length; i++) {
            var m = cluster.members[i];
            if (isMember(m) && m.module === slug && m.concept === conceptKey) {
              contains = true;
              break;
            }
          }
          if (!contains) return;
          for (var j = 0; j < cluster.members.length; j++) {
            var s = cluster.members[j];
            if (!isMember(s)) continue;
            if (s.module === slug && s.concept === conceptKey) continue;
            out.push({
              module: s.module,
              concept: s.concept,
              weight: typeof s.weight === 'number' ? s.weight : 0,
              clusterId: id,
            });
          }
        });
      } catch (e) { /* no-op */ }
      return out;
    },

    // Boost sibling concept boxes from mastered source concepts.
    // Never lowers a box, never touches the source, no-ops on error.
    propagate: function (slug, conceptKeys, reviewer) {
      try {
        if (!slug || !reviewer || !Array.isArray(conceptKeys)) return;
        var sourceRecord = loadRecord(slug, reviewer);
        var today = todayISO();
        // cache of sibling-module records so multiple boosts to the
        // same module accumulate before a single save.
        var recordCache = {};

        function getCached(mod) {
          if (!recordCache[mod]) {
            var rec = loadRecord(mod, reviewer);
            if (!rec || typeof rec !== 'object') rec = { v: 1, concepts: {}, updated: '' };
            if (!rec.concepts || typeof rec.concepts !== 'object') rec.concepts = {};
            recordCache[mod] = { rec: rec, dirty: false };
          }
          return recordCache[mod];
        }

        for (var i = 0; i < conceptKeys.length; i++) {
          var srcKey = conceptKeys[i];
          if (typeof srcKey !== 'string') continue;
          var sourceBox = boxOf(sourceRecord, srcKey);
          var sibs = OKSATGraph.siblings(slug, srcKey);

          for (var j = 0; j < sibs.length; j++) {
            var sib = sibs[j];
            if (sib.module === slug) {
              // same-module siblings: allowed to boost too, but never
              // the source concept itself (siblings() already excludes it).
            }
            var entry = getCached(sib.module);
            var rec = entry.rec;
            var current = boxOf(rec, sib.concept);
            var proposed = Math.round(sourceBox * sib.weight);
            var next = clamp(
              Math.max(current, Math.min(proposed, current + 1)),
              1,
              5
            );
            if (next <= current) continue;

            var c = rec.concepts[sib.concept];
            if (!c || typeof c !== 'object') {
              c = { box: 1, seen: 0, correct: 0, lapses: 0, boosted: 0, last: today };
              rec.concepts[sib.concept] = c;
            }
            c.box = next;
            c.boosted = (typeof c.boosted === 'number' ? c.boosted : 0) + 1;
            c.last = today;
            entry.dirty = true;
          }
        }

        var mods = Object.keys(recordCache);
        for (var k = 0; k < mods.length; k++) {
          var e = recordCache[mods[k]];
          if (!e.dirty) continue;
          try { e.rec.updated = new Date().toISOString(); } catch (err) { /* keep prior */ }
          saveRecord(mods[k], reviewer, e.rec);
        }
      } catch (e) {
        // no-op: propagation must never throw into the caller.
      }
    },

    // Shape-only audit: flags members that are structurally invalid
    // (missing module/concept strings, or an unknown module slug).
    // NOTE: this does NOT verify that a concept key actually exists in
    // the target module's CONCEPTS map — that requires the modules to
    // be loaded. Run such a deep check from the console after modules
    // load; this returns only structural problems.
    audit: function () {
      var bad = [];
      try {
        eachCluster(function (id, cluster) {
          for (var i = 0; i < cluster.members.length; i++) {
            var m = cluster.members[i];
            var okShape = isMember(m);
            var okSlug = okShape && KNOWN_SLUGS.indexOf(m.module) !== -1;
            if (!okShape || !okSlug) {
              bad.push({
                clusterId: id,
                module: m && m.module,
                concept: m && m.concept,
              });
            }
          }
        });
      } catch (e) { /* no-op */ }
      return bad;
    },

  };

  window.OKSATGraph = OKSATGraph;
})();
