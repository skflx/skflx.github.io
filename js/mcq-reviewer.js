/* =============================================================
   MCQ reviewer codes — shared across mcq.html and mcq-study.html.
   Multiple residents share one browser, so progress + spaced
   repetition are namespaced per reviewer code (e.g. "kafle",
   "terry"): keys become mcq:progress:<slug>:<code> and
   mcq:srs:<slug>:<code> (the engine appends the suffix).

   This module owns the *identity*, not the storage:
     • a registry of known codes (mcq:reviewers)
     • the active code (mcq:reviewer)
     • a small on-brand prompt with a typo failsafe — entering an
       unknown code asks you to confirm (and suggests the closest
       existing one), so "kaffle" doesn't silently fork "kafle".
   Theme-reactive: the modal uses the same CSS variables as mcq.css.
   ============================================================= */
(function () {
  var REVIEWER_KEY = 'mcq:reviewer';
  var REGISTRY_KEY = 'mcq:reviewers';

  function norm(c) {
    return String(c || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function loadJSON(key, fb) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
    catch (e) { return fb; }
  }
  function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function list() { var a = loadJSON(REGISTRY_KEY, []); return Array.isArray(a) ? a : []; }
  function current() { try { return norm(localStorage.getItem(REVIEWER_KEY) || ''); } catch (e) { return ''; } }

  function setActive(code) {
    var c = norm(code);
    if (!c) return '';
    var a = list();
    if (a.indexOf(c) === -1) { a.push(c); a.sort(); saveJSON(REGISTRY_KEY, a); }
    try { localStorage.setItem(REVIEWER_KEY, c); } catch (e) {}
    return c;
  }

  /* Levenshtein distance — for "did you mean?" typo suggestions. */
  function lev(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      for (j = 0; j <= n; j++) prev[j] = cur[j];
    }
    return prev[n];
  }
  function closest(code) {
    var c = norm(code), best = null, bestD = 99;
    list().forEach(function (x) {
      if (x === c) return;
      var d = lev(c, x);
      if (d < bestD) { bestD = d; best = x; }
    });
    if (best && bestD <= 2 && Math.abs(best.length - c.length) <= 2) return best;
    return null;
  }

  /* ---- The modal. Resolves to the chosen (and now-active) code. ---- */
  function ask(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;' +
        'justify-content:center;padding:1.25rem;background:rgba(0,0,0,0.45);' +
        'backdrop-filter:blur(2px);';

      var card = document.createElement('div');
      card.style.cssText =
        'width:100%;max-width:24rem;border-radius:16px;padding:1.5rem;' +
        'background:var(--mcq-surface,#fff);border:1px solid var(--mcq-border,#ddd);' +
        'color:var(--mcq-text,#222);box-shadow:0 20px 60px rgba(0,0,0,0.25);' +
        "font-family:'Crimson Pro',Georgia,serif;";
      overlay.appendChild(card);

      function close(val) {
        window.removeEventListener('keydown', onKey, true);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(val);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); /* require a choice */ } }
      window.addEventListener('keydown', onKey, true);

      function btn(label, primary) {
        var b = document.createElement('button');
        b.textContent = label;
        b.style.cssText =
          'cursor:pointer;border-radius:10px;padding:0.6rem 0.9rem;font-size:0.9rem;' +
          "font-family:'Fraunces',Georgia,serif;font-weight:500;letter-spacing:0.01em;" +
          (primary
            ? 'background:var(--mcq-accent,#2C5454);color:#fff;border:1px solid var(--mcq-accent,#2C5454);'
            : 'background:transparent;color:var(--mcq-text,#222);border:1px solid var(--mcq-border,#ccc);');
        return b;
      }

      /* --- Step 1: enter a code --- */
      function renderEntry(prefill) {
        card.innerHTML = '';
        var kicker = document.createElement('div');
        kicker.textContent = (opts.title || 'Who is reviewing?');
        kicker.style.cssText =
          "font-family:'Fraunces',Georgia,serif;font-size:1.25rem;margin-bottom:0.35rem;";
        var sub = document.createElement('p');
        sub.textContent = 'Enter your code so your progress and review schedule stay yours (e.g. kafle, terry).';
        sub.style.cssText = 'margin:0 0 1rem;font-size:0.92rem;line-height:1.5;color:var(--mcq-text-muted,#666);';

        var input = document.createElement('input');
        input.type = 'text';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.value = prefill != null ? prefill : current();
        input.placeholder = 'your code';
        input.style.cssText =
          'width:100%;box-sizing:border-box;padding:0.7rem 0.85rem;border-radius:10px;' +
          'font-size:1rem;background:var(--mcq-bg,#faf8f5);color:var(--mcq-text,#222);' +
          'border:1px solid var(--mcq-border,#ccc);outline:none;';

        var known = list();
        var hint = document.createElement('div');
        hint.style.cssText = 'min-height:1.1rem;margin:0.5rem 0 0.25rem;font-size:0.8rem;color:var(--mcq-text-faint,#999);';
        hint.textContent = known.length ? ('Known: ' + known.join(', ')) : 'No reviewers yet — your code creates the first.';

        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:0.5rem;margin-top:1rem;';
        var go = btn('Continue', true);
        go.style.flex = '1';
        row.appendChild(go);

        function submit() {
          var c = norm(input.value);
          if (!c) { hint.textContent = 'Please enter a code (letters/numbers).'; hint.style.color = 'var(--mcq-incorrect,#b00)'; input.focus(); return; }
          if (known.indexOf(c) !== -1) { close(setActive(c)); return; }
          renderConfirm(c);
        }
        go.addEventListener('click', submit);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });

        card.appendChild(kicker);
        card.appendChild(sub);
        card.appendChild(input);
        card.appendChild(hint);
        card.appendChild(row);
        setTimeout(function () { input.focus(); input.select(); }, 30);
      }

      /* --- Step 2: confirm an unknown code (typo failsafe) --- */
      function renderConfirm(code) {
        card.innerHTML = '';
        var suggestion = closest(code);

        var head = document.createElement('div');
        head.textContent = 'New reviewer?';
        head.style.cssText = "font-family:'Fraunces',Georgia,serif;font-size:1.2rem;margin-bottom:0.4rem;";

        var msg = document.createElement('p');
        msg.style.cssText = 'margin:0 0 1rem;font-size:0.95rem;line-height:1.5;color:var(--mcq-text-muted,#666);';
        msg.innerHTML = 'There is no reviewer <strong>“' + code + '”</strong> yet.' +
          (suggestion ? ' Did you mean <strong>“' + suggestion + '”</strong>?' : ' Create it as a new reviewer?');

        var col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';

        if (suggestion) {
          var useSug = btn('Use “' + suggestion + '”', true);
          useSug.addEventListener('click', function () { close(setActive(suggestion)); });
          col.appendChild(useSug);
        }
        var createBtn = btn('Create “' + code + '”', !suggestion);
        createBtn.addEventListener('click', function () { close(setActive(code)); });
        col.appendChild(createBtn);

        var back = btn('Edit', false);
        back.addEventListener('click', function () { renderEntry(code); });
        col.appendChild(back);

        card.appendChild(head);
        card.appendChild(msg);
        card.appendChild(col);
      }

      renderEntry(opts.prefill);
      document.body.appendChild(overlay);
    });
  }

  window.MCQReviewer = {
    norm: norm,
    list: list,
    current: current,
    setActive: setActive,
    closest: closest,
    ask: ask,
  };
})();
