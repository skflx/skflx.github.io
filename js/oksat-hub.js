/* =============================================================
   oksat-hub.js — oksat.html: module list grouped by subspecialty,
   per-module completion meter, the one due-review banner, and the
   settings modal (local reset). Reads progress only through
   window.OKSATStore. External (not inline) so the page's CSP can
   forbid inline script.
   ============================================================= */
(function () {
  OKSATPrefs.mountThemeToggle(document.getElementById('theme-toggle'));
  OKSATPrefs.mountFontPicker(document.getElementById('font-picker'));

  var today = new Date().toISOString().split('T')[0];
  var reviewer = OKSATStore.reviewer();
  var manifest = window.OKSAT_MANIFEST || [];
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
        '<div class="module-label">' + esc(m.kicker) + ' · ' + esc(m.count) + ' questions</div>' +
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

  /* ---- review banner: jump straight to the module with the most due ---- */
  if (totalDue > 0) {
    dueModules.sort(function (a, b) { return b.due - a.due; });
    var top = dueModules[0];
    document.getElementById('review-count').textContent = String(totalDue);
    document.getElementById('review-word').textContent = totalDue === 1 ? 'question' : 'questions';
    document.getElementById('review-where').textContent = dueModules.length === 1
      ? 'in ' + top.title
      : 'across ' + dueModules.length + ' modules — most in ' + top.title;
    document.getElementById('review-go').href = 'oksat-study.html?m=' + encodeURIComponent(top.slug);
    document.getElementById('review-banner').hidden = false;
  }

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
})();
