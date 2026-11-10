/* =============================================================
   js/oksat/hub.js — oksat.html: the Interactive learning guides and the
   question-module list, each grouped by subspecialty, per-card
   completion meter, the one due-review banner, and the settings modal
   (local reset). Reads progress only through window.OKSATStore. External (not inline) so the page's CSP can
   forbid inline script.
   ============================================================= */
(function () {
  OKSATPrefs.mountThemeToggle(document.getElementById('theme-toggle'));
  OKSATPrefs.mountFontPicker(document.getElementById('font-picker'));

  /* `draft: true` lists the entry with a visible Draft badge (docs/decisions.md section 9). */
  function draftTag(x) { return x.draft === true ? ' <span class="module-draft">Draft: in progress</span>' : ''; }
  var today = new Date().toISOString().split('T')[0];
  var reviewer = OKSATStore.reviewer();
  /* `unlisted: true` keeps a module or guide reachable by its own URL but out of
     the hub: no card, and nothing it holds reaches the hub's counts or banner. */
  function listed(x) { return !!x && x.unlisted !== true; }
  var manifest = (window.OKSAT_MANIFEST || []).filter(listed);
  var subs = window.OKSAT_SUBSPECIALTIES || {};

  /* ---- per-module local state (answered count + cards due today) ---- */
  function stateFor(slug) {
    var progress = OKSATStore.load('oksat:progress:' + slug + ':' + reviewer, {}) || {};
    var srs = OKSATStore.load('oksat:srs:' + slug + ':' + reviewer, {}) || {};
    var items = srs.items || {};
    var due = Object.keys(items).filter(function (id) {
      var nr = items[id] && items[id].nextReview;
      return nr && nr <= today;
    }).length;
    return { answered: Object.keys(progress.answers || {}).length, due: due };
  }

  /* Manifest strings are committed data, but escape anyway: innerHTML
     should never be the thing that decides whether markup runs. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hue(h) { return /^#[0-9a-fA-F]{3,8}$/.test(h || '') ? h : 'transparent'; }

  /* ---- module card ---- */
  function moduleCard(m, st) {
    var subInfo = subs[m.subspecialty];
    var pct = m.count ? Math.round((st.answered / m.count) * 100) : 0;
    var a = document.createElement('a');
    a.className = 'module-card';
    a.href = 'oksat-study.html?m=' + encodeURIComponent(m.slug);
    a.innerHTML =
      '<div class="module-accent" style="background:' + hue(subInfo ? subInfo.hue : m.accent) + '"></div>' +
      '<div class="module-body">' +
        '<div class="module-label">' + esc(m.kicker) + ' · ' + esc(m.count) + ' questions' + draftTag(m) + '</div>' +
        '<div class="module-title">' + esc(m.title) + '</div>' +
        '<p class="module-desc">' + esc(m.desc) + '</p>' +
        (st.due > 0 ? '<div class="module-due">' + st.due + ' due for review</div>' : '') +
        (st.answered > 0
          ? '<div class="module-meter"><span class="bar"><span class="fill" style="width:' + pct + '%"></span></span>' +
            '<span>' + st.answered + ' / ' + m.count + '</span></div>'
          : '') +
      '</div>' +
      '<div class="module-arrow">' + (st.answered > 0 && st.answered < m.count ? 'Resume' : 'Launch') + ' &rarr;</div>';
    return a;
  }

  /* ---- Interactive learning: one card per guide, progress = sections marked done ---- */
  var guides = (window.OKSAT_GUIDES || []).filter(listed);
  function guideCard(g) {
    var subInfo = subs[g.subspecialty];
    var total = 0, mins = 0;
    g.chapters.forEach(function (c) { total += c.sections || 0; mins += c.min || 0; });
    var done = Object.keys(OKSATStore.getLearn(g.slug, reviewer).done).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    var chapters = g.chapters.filter(function (c) { return c.sections; }).length;
    var a = document.createElement('a');
    a.className = 'module-card';
    a.href = 'oksat-learn.html?g=' + encodeURIComponent(g.slug);
    a.innerHTML =
      '<div class="module-accent" style="background:' + hue(subInfo ? subInfo.hue : g.accent) + '"></div>' +
      '<div class="module-body">' +
        '<div class="module-label">' + esc(g.kicker) + ' · ' + chapters + ' chapters · ~' + Math.round(mins / 60 * 10) / 10 + ' h' + draftTag(g) + '</div>' +
        '<div class="module-title">' + esc(g.title) + '</div>' +
        '<p class="module-desc">' + esc(g.desc) + '</p>' +
        (done > 0
          ? '<div class="module-meter"><span class="bar"><span class="fill" style="width:' + pct + '%"></span></span>' +
            '<span>' + done + ' / ' + total + ' sections</span></div>'
          : '') +
      '</div>' +
      '<div class="module-arrow">' + (done > 0 && done < total ? 'Resume' : 'Open') + ' &rarr;</div>';
    return a;
  }
  var gwrap = document.getElementById('guides');
  Object.keys(subs).forEach(function (subKey) {
    var gs = guides.filter(function (g) { return g.subspecialty === subKey; });
    if (!gs.length) return;
    var head = document.createElement('div');
    head.className = 'hub-subhead';
    head.innerHTML = '<span class="tick" style="background:' + hue(subs[subKey].hue) + '"></span>' + esc(subs[subKey].label);
    gwrap.appendChild(head);
    gs.forEach(function (g) { gwrap.appendChild(guideCard(g)); });
  });

  /* ---- render, grouped by subspecialty in manifest order ---- */
  var wrap = document.getElementById('modules');
  var totalDue = 0;
  var dueModules = [];

  Object.keys(subs).forEach(function (subKey) {
    var mods = manifest.filter(function (m) { return m.subspecialty === subKey; });
    if (!mods.length) return;
    var subInfo = subs[subKey];
    var head = document.createElement('div');
    head.className = 'hub-subhead';
    head.innerHTML = '<span class="tick" style="background:' + hue(subInfo.hue) + '"></span>' + esc(subInfo.label);
    wrap.appendChild(head);
    mods.forEach(function (m) {
      var st = stateFor(m.slug);
      totalDue += st.due;
      if (st.due > 0) dueModules.push({ slug: m.slug, title: m.title, due: st.due });
      wrap.appendChild(moduleCard(m, st));
    });
  });

  /* Any module whose subspecialty key is missing from the ring still renders. */
  var placed = Object.keys(subs);
  manifest.filter(function (m) { return placed.indexOf(m.subspecialty) === -1; })
    .forEach(function (m) {
      var st = stateFor(m.slug);
      totalDue += st.due;
      if (st.due > 0) dueModules.push({ slug: m.slug, title: m.title, due: st.due });
      wrap.appendChild(moduleCard(m, st));
    });

  /* ---- review banner: every module with due items, most due first ---- */
  if (totalDue > 0) {
    dueModules.sort(function (a, b) { return b.due - a.due; });
    document.getElementById('review-count').textContent = String(totalDue);
    document.getElementById('review-word').textContent = totalDue === 1 ? 'question' : 'questions';
    var rvList = document.getElementById('review-list');
    dueModules.forEach(function (d) {
      var a = document.createElement('a');
      a.className = 'rv-link';
      a.href = 'oksat-study.html?m=' + encodeURIComponent(d.slug);
      a.textContent = d.title + ' · ' + d.due;
      rvList.appendChild(a);
    });
    document.getElementById('review-banner').hidden = false;
  }

  /* ---- weak concepts: lowest accuracy among concepts tried 3+ times and missed at
     least once. Read from stored mastery only (no module file is loaded here), so
     the concept shows by its id. ---- */
  var weak = [];
  manifest.forEach(function (m) {
    var cs = OKSATStore.getConceptMastery(m.slug, reviewer).concepts || {};
    Object.keys(cs).forEach(function (id) {
      var c = cs[id] || {};
      if ((c.seen || 0) >= 3 && (c.lapses || 0) > 0) {
        weak.push({ slug: m.slug, title: m.title, id: id, acc: (c.correct || 0) / c.seen, box: c.box || 1 });
      }
    });
  });
  weak.sort(function (a, b) { return a.acc - b.acc || a.box - b.box; });
  if (weak.length) {
    var weakList = document.getElementById('weak-list');
    weak.slice(0, 8).forEach(function (w) {
      var a = document.createElement('a');
      a.className = 'rv-link';
      a.href = 'oksat-study.html?m=' + encodeURIComponent(w.slug) + '&c=' + encodeURIComponent(w.id);
      a.textContent = w.title + ' · ' + w.id;
      weakList.appendChild(a);
    });
    document.getElementById('weak').hidden = false;
  }

  /* Ask the browser not to evict this site's storage; the answer does not matter. */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}

  /* ---- settings modal ---- */
  var overlay = document.getElementById('settings-overlay');
  function openSettings() { overlay.hidden = false; }
  function closeSettings() { overlay.hidden = true; }
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSettings(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeSettings();
  });

  var resetBtn = document.getElementById('reset-local');
  var resetStatus = document.getElementById('reset-status');
  var armed = false;
  resetBtn.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      resetBtn.textContent = 'Confirm reset';
      resetStatus.textContent = 'Click again to erase all local progress.';
      setTimeout(function () {
        if (!armed) return;
        armed = false;
        resetBtn.textContent = 'Reset…';
        resetStatus.textContent = '';
      }, 5000);
      return;
    }
    armed = false;
    resetBtn.textContent = 'Reset…';
    var n = OKSATStore.resetLocal(reviewer);
    resetStatus.textContent = n + ' local record' + (n === 1 ? '' : 's') + ' cleared. Reloading…';
    setTimeout(function () { location.reload(); }, 900);
  });

  /* ---- backup: every oksat:* key as one JSON file ---- */
  var backupStatus = document.getElementById('backup-status');
  function say(msg, bad) {
    backupStatus.textContent = msg;
    backupStatus.className = 'ok-status ' + (bad ? 'bad' : 'good');
  }
  document.getElementById('export-progress').addEventListener('click', function () {
    var out = {};
    OKSATStore.keysWithPrefix('oksat:').forEach(function (k) {
      try { out[k] = localStorage.getItem(k); } catch (e) {}
    });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
    a.download = 'oksat-progress-' + today + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    say(Object.keys(out).length + ' records exported.');
  });
  var importFile = document.getElementById('import-file');
  document.getElementById('import-progress').addEventListener('click', function () { importFile.click(); });
  importFile.addEventListener('change', function () {
    var f = importFile.files && importFile.files[0];
    importFile.value = '';
    if (!f) return;
    f.text().then(function (text) {
      var data = JSON.parse(text);
      var keys = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [];
      if (!keys.length || !keys.every(function (k) { return k.indexOf('oksat:') === 0 && typeof data[k] === 'string'; })) {
        throw new Error('bad shape');
      }
      if (!confirm('Replace local progress with ' + keys.length + ' records from this file?')) return;
      var n = 0;
      keys.forEach(function (k) { if (OKSATStore.setRaw(k, data[k])) n++; });
      say(n + ' records imported. Reloading…');
      setTimeout(function () { location.reload(); }, 900);
    }).catch(function () {
      say('Not an OKSAT progress file. Nothing was changed.', true);
    });
  });
})();
