/* =============================================================
   OKSAT Dashboard — the reviewer's study telemetry.
   (OHNS Knowledge Self-Assessment Tool.)

   One read-only panel stack for a single reviewer: what has been
   answered, where accuracy sags, which concepts are weakest, how
   much of the taxonomy is covered, and whether confidence is
   calibrated. Every panel degrades to a friendly empty state for a
   brand-new reviewer — no data, no Gemini key, no network beyond
   module content (via OKSATAtlas.loadModules, with a self-contained
   fallback) is required.

   Charts are hand-rolled inline SVG / flex whose fills reference the
   site's --ok-* custom properties, so a day/night theme flip recolors
   everything with zero JS. Colors are never hard-coded here; the only
   literal color values used are subspecialty `hue` values, which are
   data read from OKSAT_SUBSPECIALTIES. Following the dataviz method,
   every colored mark also carries a text label or a title= tooltip —
   identity and magnitude are never color-alone.

   Loaded as a plain <script> after oksat-store.js / oksat-manifest.js
   / oksat-taxonomy.js (no build step, no imports). Assigns
   window.OKSATDashboard = { mount, refresh }.
   ============================================================= */
(function () {
  'use strict';

  var HEAD = 'font-size:0.72rem;letter-spacing:0.25em;text-transform:uppercase;color:var(--ok-text-muted);margin:0 0 0.9rem';
  var CARD = 'padding:1.25rem 1.4rem;margin-bottom:1.1rem';
  var TIERS = ['hi', 'md', 'lo'];
  var TIER_LABEL = { hi: 'High', md: 'Medium', lo: 'Low' };

  var lastContainer = null;
  var lastOpts = null;

  /* ---- fail-safe storage (prefer the shared adapter) ---- */
  function norm(code) {
    if (window.OKSATStore && typeof window.OKSATStore.norm === 'function') return window.OKSATStore.norm(code);
    return String(code || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
  }
  function load(key, fb) {
    if (window.OKSATStore && typeof window.OKSATStore.load === 'function') return window.OKSATStore.load(key, fb);
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fb; } catch (e) { return fb; }
  }
  function keysWithPrefix(prefix) {
    if (window.OKSATStore && typeof window.OKSATStore.keysWithPrefix === 'function') return window.OKSATStore.keysWithPrefix(prefix);
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) out.push(k);
      }
    } catch (e) {}
    return out;
  }
  var today = function () { return new Date().toISOString().split('T')[0]; };

  /* ---- tiny helpers ---- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pct(n, d) { return d > 0 ? Math.round((n / d) * 100) : 0; }
  function heading(text) { return '<div class="ui-font" style="' + HEAD + '">' + esc(text) + '</div>'; }
  function card(inner) { return '<div class="ok-card" style="' + CARD + '">' + inner + '</div>'; }
  function note(text) { return '<p class="ok-note" style="margin:0">' + esc(text) + '</p>'; }

  /* ---- module content: shared loader, else self-contained fallback ---- */
  function loadModules() {
    try {
      if (window.OKSATAtlas && typeof window.OKSATAtlas.loadModules === 'function') {
        var p = window.OKSATAtlas.loadModules();
        if (p && typeof p.then === 'function') {
          return p.then(function (m) { return m || {}; }).catch(function () { return fallbackLoad(); });
        }
      }
    } catch (e) {}
    return fallbackLoad();
  }
  function fallbackLoad() {
    var entries = window.OKSAT_MANIFEST || [];
    var cache = {};
    var chain = Promise.resolve();
    entries.forEach(function (entry) {
      chain = chain.then(function () {
        if (!entry || !entry.data) return;
        return fetch(entry.data)
          .then(function (r) { return r.text(); })
          .then(function (src) {
            try { new Function(src)(); var m = window.__MCQ_MODULE; if (m) cache[entry.slug] = m; } catch (e) {}
            try { delete window.__MCQ_MODULE; } catch (e2) { window.__MCQ_MODULE = undefined; }
          })
          .catch(function () {});
      });
    });
    return chain.then(function () { return cache; });
  }

  /* ---- per-module rollup from legacy progress + item SRS ---- */
  function collect(reviewer) {
    var manifest = window.OKSAT_MANIFEST || [];
    var td = today();
    var perModule = {};
    manifest.forEach(function (entry) {
      var prog = load('oksat:progress:' + entry.slug + ':' + reviewer, null) || {};
      var answers = prog.answers || {};
      var firstCorrect = prog.firstCorrect || {};
      var answered = Object.keys(answers).length;
      var first = 0;
      Object.keys(firstCorrect).forEach(function (q) { if (firstCorrect[q]) first++; });
      var srs = load('oksat:srs:' + entry.slug + ':' + reviewer, null) || {};
      var items = srs.items || {};
      var due = 0;
      Object.keys(items).forEach(function (q) {
        var it = items[q];
        if (it && it.nextReview && it.nextReview <= td) due++;
      });
      perModule[entry.slug] = {
        answered: answered, first: first, due: due,
        sub: entry.subspecialty, title: entry.title,
      };
    });
    return perModule;
  }

  /* ---- horizontal magnitude bar (SVG; theme-reactive fills) ---- */
  function bar(percent, titleText) {
    var w = Math.max(0, Math.min(100, percent));
    return '' +
      '<svg width="100%" height="10" viewBox="0 0 100 10" preserveAspectRatio="none" ' +
      'style="flex:1;display:block" role="img" aria-label="' + esc(titleText) + '">' +
      '<rect x="0" y="0" width="100" height="10" rx="4" fill="var(--ok-border-soft)"></rect>' +
      '<rect x="0" y="0" width="' + w + '" height="10" rx="4" fill="var(--ok-accent)">' +
      '<title>' + esc(titleText) + '</title></rect>' +
      '</svg>';
  }

  /* ---- 5-dot spaced-repetition box indicator ---- */
  function boxDots(box) {
    var b = Math.max(1, Math.min(5, box | 0 || 1));
    var out = '<span title="Box ' + b + ' of 5" style="flex-shrink:0;white-space:nowrap">';
    for (var i = 1; i <= 5; i++) {
      out += '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:2px;' +
        'background:' + (i <= b ? 'var(--ok-accent)' : 'var(--ok-border)') + '"></span>';
    }
    return out + '</span>';
  }

  /* ============================================================
     Panel 1 — Overview stat row
     ============================================================ */
  function panelOverview(reviewer, perModule) {
    var answered = 0, first = 0, due = 0;
    Object.keys(perModule).forEach(function (slug) {
      answered += perModule[slug].answered;
      first += perModule[slug].first;
      due += perModule[slug].due;
    });
    var sessions = 0;
    try {
      var s = (window.OKSATStore && window.OKSATStore.getSession)
        ? window.OKSATStore.getSession(reviewer)
        : load('oksat:session:' + reviewer, { n: 0 });
      sessions = (s && s.n) || 0;
    } catch (e) {}

    var tiles = [
      { n: answered, label: 'Questions answered' },
      { n: pct(first, answered) + '%', label: 'First-attempt accuracy' },
      { n: due, label: 'Due today' },
      { n: sessions, label: 'Study sessions' },
    ];
    var inner = heading('Overview');
    inner += '<div style="display:flex;flex-wrap:wrap;gap:1.75rem">';
    tiles.forEach(function (t) {
      inner += '<div style="min-width:4.5rem">' +
        '<div class="display-font" style="font-size:2rem;line-height:1;color:var(--ok-accent)">' + esc(t.n) + '</div>' +
        '<div class="ui-font" style="font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ok-text-muted);margin-top:0.35rem">' +
        esc(t.label) + '</div></div>';
    });
    inner += '</div>';
    if (!answered) inner += '<p class="ok-note" style="margin:0.9rem 0 0">Answer a few questions to populate your dashboard.</p>';
    return card(inner);
  }

  /* ============================================================
     Panel 2 — Accuracy by subspecialty
     ============================================================ */
  function panelAccuracy(perModule) {
    var subs = window.OKSAT_SUBSPECIALTIES || {};
    var roll = {}; // subKey -> { answered, first }
    Object.keys(perModule).forEach(function (slug) {
      var m = perModule[slug];
      var r = roll[m.sub] || (roll[m.sub] = { answered: 0, first: 0 });
      r.answered += m.answered;
      r.first += m.first;
    });
    var totalAnswered = 0;
    Object.keys(roll).forEach(function (k) { totalAnswered += roll[k].answered; });

    var inner = heading('Accuracy by subspecialty');
    if (!totalAnswered) return card(inner + note('No questions answered yet.'));

    Object.keys(subs).forEach(function (key) {
      var sub = subs[key];
      var r = roll[key] || { answered: 0, first: 0 };
      var hue = sub.hue || 'var(--ok-text-faint)';
      var labelCell = '<div class="ui-font" style="width:8.5rem;flex-shrink:0;font-size:0.76rem;line-height:1.25;color:var(--ok-text)">' +
        esc(sub.label) + '</div>';
      var tick = '<div style="width:3px;align-self:stretch;min-height:1.1rem;background:' + esc(hue) + ';border-radius:2px;flex-shrink:0" title="' + esc(sub.label) + '"></div>';
      inner += '<div style="display:flex;align-items:center;gap:0.6rem;margin:0.45rem 0">';
      if (r.answered >= 1) {
        var p = pct(r.first, r.answered);
        var t = sub.label + ': ' + r.first + '/' + r.answered + ' correct on first attempt (' + p + '%)';
        inner += labelCell + tick + bar(p, t) +
          '<div style="width:6.5rem;flex-shrink:0;text-align:right;font-size:0.74rem;color:var(--ok-text-muted)">' +
          r.first + '/' + r.answered + ' &middot; ' + p + '%</div>';
      } else {
        inner += labelCell + tick +
          '<div style="flex:1;font-size:0.74rem;color:var(--ok-text-faint)">untouched</div>';
      }
      inner += '</div>';
    });
    return card(inner);
  }

  /* ============================================================
     Panel 3 — Weak concepts
     ============================================================ */
  function panelWeakConcepts(reviewer, modules) {
    var titles = {};
    (window.OKSAT_MANIFEST || []).forEach(function (e) { titles[e.slug] = e.title; });

    var ranked = [];   // seen >= 2, sorted weakest
    var linked = [];   // propagated-only (boosted > 0, seen === 0)
    keysWithPrefix('oksat:cmastery:').forEach(function (key) {
      var parts = key.split(':'); // oksat:cmastery:<slug>:<reviewer>
      if (parts.length !== 4 || parts[3] !== reviewer) return;
      var slug = parts[2];
      var rec = load(key, null);
      var concepts = (rec && rec.concepts) || {};
      Object.keys(concepts).forEach(function (cKey) {
        var c = concepts[cKey] || {};
        var seen = c.seen || 0;
        var correct = c.correct || 0;
        var box = c.box || 1;
        var row = {
          slug: slug, key: cKey, box: box, seen: seen, correct: correct,
          boosted: c.boosted || 0, acc: seen ? correct / seen : 0,
        };
        if (seen >= 2) ranked.push(row);
        else if ((c.boosted || 0) > 0 && seen === 0) linked.push(row);
      });
    });

    ranked.sort(function (a, b) { return (a.box - b.box) || (a.acc - b.acc); });
    var rows = ranked.slice(0, 10).concat(linked).slice(0, 10);

    var inner = heading('Weak concepts');
    if (!rows.length) return card(inner + note('No concept mastery recorded yet — practice a module to build this list.'));

    rows.forEach(function (row) {
      var mod = modules[row.slug] || {};
      var CONCEPTS = mod.CONCEPTS || {};
      var label = (CONCEPTS[row.key] && CONCEPTS[row.key].label) || row.key;
      var modTitle = titles[row.slug] || row.slug;
      var isLinked = row.seen === 0 && row.boosted > 0;

      var left = '<div style="min-width:0">' +
        '<div style="font-size:0.86rem;color:var(--ok-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(label) + '</div>' +
        '<div class="ui-font" style="font-size:0.7rem;color:var(--ok-text-muted)">' + esc(modTitle) + '</div>' +
        '</div>';
      var right = '<div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0">' +
        boxDots(row.box) +
        (isLinked
          ? '<span class="ui-font" style="font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ok-text-faint)">linked</span>'
          : '<span style="font-size:0.74rem;color:var(--ok-text-muted)">' + row.correct + '/' + row.seen + '</span>') +
        '</div>';
      var rowStyle = 'display:flex;align-items:center;justify-content:space-between;gap:0.75rem;padding:0.5rem 0;border-top:1px solid var(--ok-border-soft)';

      if (isLinked) {
        inner += '<div style="' + rowStyle + ';opacity:0.7" ' +
          'title="' + esc(label) + ' — linked via propagation, not yet practiced directly">' + left + right + '</div>';
      } else {
        var href = 'oksat-study.html?m=' + encodeURIComponent(row.slug) + '&c=' + encodeURIComponent(row.key);
        inner += '<a href="' + href + '" style="' + rowStyle + ';text-decoration:none;color:inherit" ' +
          'title="' + esc(label) + ' — ' + row.correct + '/' + row.seen + ' correct, box ' + Math.max(1, Math.min(5, row.box | 0 || 1)) + '">' +
          left + right + '</a>';
      }
    });
    return card(inner);
  }

  /* ============================================================
     Panel 4 — Coverage map
     ============================================================ */
  function panelCoverage(reviewer, perModule) {
    var tax = window.OKSAT_TAXONOMY || {};
    var topics = (tax && tax.topics) || [];
    var subs = window.OKSAT_SUBSPECIALTIES || {};

    var inner = heading('Coverage map');
    if (!topics.length) return card(inner + note('No taxonomy loaded.'));

    var adaptive = {};
    try {
      var adapt = (window.OKSATStore && window.OKSATStore.getAdaptive)
        ? window.OKSATStore.getAdaptive(reviewer)
        : load('oksat:adaptive:' + reviewer, { topics: {} });
      adaptive = (adapt && adapt.topics) || {};
    } catch (e) {}

    // group topics by subspecialty, preserving the subspecialty ring order
    var groups = {};
    topics.forEach(function (t) {
      (groups[t.subspecialty] || (groups[t.subspecialty] = [])).push(t);
    });
    var order = Object.keys(subs).filter(function (k) { return groups[k]; });
    Object.keys(groups).forEach(function (k) { if (order.indexOf(k) === -1) order.push(k); });

    order.forEach(function (key) {
      var sub = subs[key] || { label: key, hue: 'var(--ok-text-faint)' };
      var hue = sub.hue || 'var(--ok-text-faint)';
      inner += '<div style="margin-top:0.75rem">' +
        '<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.35rem">' +
        '<div style="width:3px;height:0.85rem;background:' + esc(hue) + ';border-radius:2px" title="' + esc(sub.label) + '"></div>' +
        '<div class="ui-font" style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--ok-text-muted)">' + esc(sub.label) + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(1.4rem,1.4rem));gap:4px;justify-content:start">';

      groups[key].forEach(function (t) {
        var built = !!t.moduleId;
        var cellStyle = 'width:1.4rem;height:1.4rem;border-radius:4px;box-sizing:border-box;display:block';
        var touched, state;
        if (built) {
          var m = perModule[t.moduleId];
          touched = !!(m && m.answered > 0);
          cellStyle += touched
            ? ';background:' + hue
            : ';background:transparent;border:1px solid ' + hue;
          state = 'built, ' + (touched ? 'touched' : 'untouched');
        } else {
          var ad = adaptive[t.id];
          touched = !!(ad && ad.attempts > 0);
          cellStyle += touched
            ? ';background:var(--ok-ochre)'
            : ';background:var(--ok-bg);border:1px dashed var(--ok-border)';
          state = 'gap, ' + (touched ? 'started' : 'untouched');
        }
        var title = esc(t.label + ' — ' + state);
        if (built) {
          inner += '<a href="oksat-study.html?m=' + encodeURIComponent(t.moduleId) + '" ' +
            'style="' + cellStyle + '" title="' + title + '"></a>';
        } else {
          // adaptive page not yet live — render non-linked, tagged for later wiring
          inner += '<div data-topic="' + esc(t.id) + '" style="' + cellStyle + ';cursor:default" title="' + title + '"></div>';
        }
      });
      inner += '</div></div>';
    });

    // legend — tiny colored swatches, each with a text label
    var swatch = function (style, label) {
      return '<span style="display:inline-flex;align-items:center;gap:0.3rem">' +
        '<span style="width:0.85rem;height:0.85rem;border-radius:3px;box-sizing:border-box;' + style + '"></span>' +
        esc(label) + '</span>';
    };
    inner += '<div class="ui-font" style="display:flex;flex-wrap:wrap;gap:0.9rem;margin-top:0.9rem;font-size:0.7rem;color:var(--ok-text-muted)">' +
      swatch('background:var(--ok-accent)', 'Built · done') +
      swatch('background:transparent;border:1px solid var(--ok-accent)', 'Built · open') +
      swatch('background:var(--ok-ochre)', 'Gap · started') +
      swatch('background:var(--ok-bg);border:1px dashed var(--ok-border)', 'Gap · untouched') +
      '</div>';
    return card(inner);
  }

  /* ============================================================
     Panel 5 — Confidence calibration
     ============================================================ */
  function panelCalibration(reviewer, modules) {
    var conceptLabels = {};
    Object.keys(modules).forEach(function (slug) {
      var C = (modules[slug] && modules[slug].CONCEPTS) || {};
      Object.keys(C).forEach(function (k) { if (!conceptLabels[k]) conceptLabels[k] = C[k].label; });
    });

    var tierStats = { hi: { n: 0, ok: 0 }, md: { n: 0, ok: 0 }, lo: { n: 0, ok: 0 } };
    var perConcept = {}; // key -> { hi:{n,ok}, md:{n,ok}, lo:{n,ok} }
    var total = 0;

    keysWithPrefix('oksat:conf:').forEach(function (key) {
      var parts = key.split(':'); // oksat:conf:<slug>:<reviewer>
      if (parts.length !== 4 || parts[3] !== reviewer) return;
      var rec = load(key, null);
      var entries = (rec && rec.entries) || {};
      Object.keys(entries).forEach(function (qId) {
        var e = entries[qId] || {};
        var tier = e.c;
        if (!tierStats[tier]) return;
        total++;
        tierStats[tier].n++;
        if (e.ok) tierStats[tier].ok++;
        (e.concepts || []).forEach(function (cKey) {
          var pc = perConcept[cKey] || (perConcept[cKey] = { hi: { n: 0, ok: 0 }, md: { n: 0, ok: 0 }, lo: { n: 0, ok: 0 } });
          pc[tier].n++;
          if (e.ok) pc[tier].ok++;
        });
      });
    });

    var inner = heading('Confidence calibration');
    if (!total) return card(inner + note('No confidence ratings recorded yet — rate a few answers to calibrate.'));

    // stacked bars per tier
    TIERS.forEach(function (tier) {
      var s = tierStats[tier];
      if (!s.n) return;
      var wrong = s.n - s.ok;
      var okW = pct(s.ok, s.n);
      var wrongW = 100 - okW;
      var accStr = okW + '% correct';
      var title = TIER_LABEL[tier] + ' confidence: ' + s.ok + ' correct / ' + wrong + ' incorrect (' + accStr + ', n=' + s.n + ')';
      inner += '<div style="display:flex;align-items:center;gap:0.6rem;margin:0.45rem 0">' +
        '<div class="ui-font" style="width:4.5rem;flex-shrink:0;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ok-text-muted)">' + esc(TIER_LABEL[tier]) + '</div>' +
        '<div title="' + esc(title) + '" style="flex:1;display:flex;height:12px;border-radius:4px;overflow:hidden;background:var(--ok-border-soft)">' +
        '<div style="width:' + okW + '%;background:var(--ok-correct)"></div>' +
        '<div style="width:2px;background:var(--ok-surface)"></div>' +
        '<div style="width:' + wrongW + '%;background:var(--ok-incorrect)"></div>' +
        '</div>' +
        '<div style="width:7rem;flex-shrink:0;text-align:right;font-size:0.72rem;color:var(--ok-text-muted)">' +
        s.ok + '&nbsp;/&nbsp;' + wrong + ' &middot; ' + okW + '%</div>' +
        '</div>';
    });
    // legend
    var sw = function (v, label) {
      return '<span style="display:inline-flex;align-items:center;gap:0.3rem">' +
        '<span style="width:0.75rem;height:0.75rem;border-radius:3px;background:' + v + '"></span>' + label + '</span>';
    };
    inner += '<div class="ui-font" style="display:flex;gap:0.9rem;margin-top:0.5rem;font-size:0.7rem;color:var(--ok-text-muted)">' +
      sw('var(--ok-correct)', 'correct') + sw('var(--ok-incorrect)', 'incorrect') + '</div>';

    // per-concept mis-calibration flags
    var over = [], under = [];
    Object.keys(perConcept).forEach(function (cKey) {
      var pc = perConcept[cKey];
      var label = conceptLabels[cKey] || cKey;
      if (pc.hi.n >= 4 && (pc.hi.ok / pc.hi.n) < 0.75) {
        over.push({ label: label, n: pc.hi.n, p: pct(pc.hi.ok, pc.hi.n) });
      }
      var mlN = pc.md.n + pc.lo.n;
      var mlOk = pc.md.ok + pc.lo.ok;
      if (mlN >= 4 && (mlOk / mlN) > 0.75) {
        under.push({ label: label, n: mlN, p: pct(mlOk, mlN) });
      }
    });

    if (over.length || under.length) {
      inner += '<div style="margin-top:0.9rem;border-top:1px solid var(--ok-border-soft);padding-top:0.7rem">';
      var flag = function (item, color, tag) {
        return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0;font-size:0.8rem;color:var(--ok-text)">' +
          '<span style="width:0.55rem;height:0.55rem;border-radius:50%;background:' + color + ';flex-shrink:0" title="' + tag + '"></span>' +
          '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(item.label) + '</span>' +
          '<span class="ui-font" style="font-size:0.68rem;letter-spacing:0.06em;text-transform:uppercase;color:' + color + '">' + tag + '</span>' +
          '<span style="font-size:0.72rem;color:var(--ok-text-muted);flex-shrink:0">' + item.p + '% &middot; n=' + item.n + '</span>' +
          '</div>';
      };
      over.forEach(function (i) { inner += flag(i, 'var(--ok-incorrect)', 'overconfident'); });
      under.forEach(function (i) { inner += flag(i, 'var(--ok-ochre)', 'underconfident'); });
      inner += '</div>';
    } else {
      inner += '<p class="ok-note" style="margin:0.8rem 0 0">Not enough per-concept ratings yet to flag miscalibration.</p>';
    }
    return card(inner);
  }

  /* ============================================================
     Render + public API
     ============================================================ */
  function render(container, opts, modules) {
    var reviewer = norm(opts && opts.reviewer);
    modules = modules || {};
    var perModule = collect(reviewer);
    var html = '';
    try { html += panelOverview(reviewer, perModule); } catch (e) {}
    try { html += panelAccuracy(perModule); } catch (e) {}
    try { html += panelWeakConcepts(reviewer, modules); } catch (e) {}
    try { html += panelCoverage(reviewer, perModule); } catch (e) {}
    try { html += panelCalibration(reviewer, modules); } catch (e) {}
    container.innerHTML = html;
  }

  function mount(container, opts) {
    if (!container) return;
    lastContainer = container;
    lastOpts = opts || {};
    container.innerHTML = '<p class="ok-note" style="margin:0">Charting…</p>';
    loadModules().then(function (modules) {
      if (lastContainer !== container) return; // superseded by a newer mount
      render(container, lastOpts, modules);
    }).catch(function () {
      render(container, lastOpts, {});
    });
  }

  function refresh() {
    if (lastContainer && lastOpts) mount(lastContainer, lastOpts);
  }

  window.OKSATDashboard = { mount: mount, refresh: refresh };
})();
