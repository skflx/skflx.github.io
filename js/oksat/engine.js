/* =============================================================
   OKSAT study engine — StudyViewer
   (OHNS Knowledge Self-Assessment Tool; formerly the MCQ engine.)
   React (UMD) + htm (no in-browser Babel). Mount via window.mountOKSAT.
   Colors resolve to CSS custom properties (css/oksat.css), so the whole
   UI follows the site-wide light/dark theme. Tolerant of sparse module
   data — see docs/authoring-oksat.md for the schema.
   ============================================================= */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const html = htm.bind(React.createElement);

  /* Palette → CSS variables (theme-reactive) */
  const C = {
    bg: 'var(--ok-bg)', surface: 'var(--ok-surface)', border: 'var(--ok-border)',
    borderSoft: 'var(--ok-border-soft)', text: 'var(--ok-text)', textMuted: 'var(--ok-text-muted)',
    textFaint: 'var(--ok-text-faint)', accent: 'var(--ok-accent)', accentSoft: 'var(--ok-accent-soft)',
    ochre: 'var(--ok-ochre)', correct: 'var(--ok-correct)', correctBg: 'var(--ok-correct-bg)',
    incorrect: 'var(--ok-incorrect)', incorrectBg: 'var(--ok-incorrect-bg)',
  };

  /* ---- Icons (lucide geometry) ---- */
  const makeIcon = (paths) => ({ size = 24, style, className }) =>
    React.createElement('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round',
      strokeLinejoin: 'round', style, className, 'aria-hidden': true,
    }, paths.map((d, i) => React.createElement('path', { key: i, d })));

  const ChevronLeft = makeIcon(['m15 18-6-6 6-6']);
  const ChevronRight = makeIcon(['m9 18 6-6-6-6']);
  const Check = makeIcon(['M20 6 9 17l-5-5']);
  const X = makeIcon(['M18 6 6 18', 'm6 6 12 12']);
  const ChevronDown = makeIcon(['m6 9 6 6 6-6']);
  const Sparkles = makeIcon(['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z', 'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3']);
  const ArrowRight = makeIcon(['M5 12h14', 'm12 5 7 7-7 7']);
  const Layers = makeIcon(['M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z', 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12', 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17']);
  const Filter = makeIcon(['M22 3H2l8 9.46V19l4 2v-8.54L22 3z']);
  const Home = makeIcon(['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10']);
  const Shuffle = makeIcon(['M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22', 'm18 2 4 4-4 4', 'M2 6h1.9c1.5 0 2.9.9 3.6 2.2', 'M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8', 'm18 14 4 4-4 4']);
  const Eye = makeIcon(['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z']);

  /* ---- Spaced repetition (Leitner) ---- */
  const LEITNER_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
  // How long a pick waits, undoable, before it locks as the first attempt.
  const LOCK_MS = 1500;
  const today = OKSATStore.today;
  const addDays = OKSATStore.addDays;

  /* Recall (free-response) self-grade tiers → Leitner movement.
     `box` is a number (absolute) or fn(currentBox)→box; `correct`
     feeds the "first attempt" accuracy stat: true a pass, false a miss, null a
     partial (neither: half credit in concept mastery, and the box holds).
     Keyboard 1–4 maps to order. */
  const RECALL_GRADES = [
    { id: 'unknown', label: "Didn't know", correct: false, color: 'incorrect', box: 1 },
    { id: 'guessed', label: 'Guessed', correct: false, color: 'ochre', box: 1 },
    { id: 'partial', label: 'Got it partially', correct: null, color: 'accent', box: (cur) => cur },
    { id: 'cold', label: 'Knew it cold', correct: true, color: 'correct', box: (cur) => Math.min(cur + 2, 5) },
  ];

  /* Render free-text fields, honoring `\n` as a line break (module data
     may carry lists / mini-tables). Single-line strings pass through. */
  const renderText = (s) => {
    const str = s == null ? '' : String(s);
    if (str.indexOf('\n') === -1) return str;
    return str.split('\n').map((ln, i) =>
      React.createElement(React.Fragment, { key: i }, i ? React.createElement('br') : null, ln));
  };

  /* Storage: the one adapter (js/oksat/store.js, loaded before this file;
     viewer.js already needs it to resolve the reviewer). */
  const load = OKSATStore.load;
  const save = OKSATStore.save;

  /* =========================================================
     STUDY VIEWER
     ========================================================= */
  function StudyViewer({ module, entry, code }) {
    const meta = module.meta || {};
    const DOMAINS = module.DOMAINS || {};
    const CONCEPTS = module.CONCEPTS || {};
    const slug = (entry && entry.slug) || meta.id || 'module';
    const reviewer = OKSATStore.norm(code);
    const hasTaxonomy = Object.keys(DOMAINS).length > 0 && Object.keys(CONCEPTS).length > 0;

    // Normalize once: guarantee concepts[] and options[] on every item.
    const ITEMS = useMemo(() => {
      const raw = module.ITEMS ?? module.QUESTIONS ?? [];
      return raw.map((it) => ({
        ...it,
        type: it.type || 'mcq',
        concepts: Array.isArray(it.concepts) ? it.concepts : [],
        options: Array.isArray(it.options) ? it.options : [],
      }));
    }, [module]);

    const PROGRESS_KEY = 'oksat:progress:' + slug + ':' + reviewer;
    const SRS_KEY = 'oksat:srs:' + slug + ':' + reviewer;

    // Deep link: ?c=<concept> opens the viewer pre-filtered to that concept.
    const initialConcept = useMemo(() => {
      try {
        const c = new URLSearchParams(window.location.search).get('c');
        return c && CONCEPTS[c] && ITEMS.some((q) => q.concepts.includes(c)) ? c : null;
      } catch (e) { return null; }
    }, []);
    const [view, setView] = useState(initialConcept ? 'item' : 'home');
    const [keysOpen, setKeysOpen] = useState(false);
    const [currentId, setCurrentId] = useState(() => initialConcept
      ? (ITEMS.find((q) => q.concepts.includes(initialConcept)) || ITEMS[0])?.id
      : ITEMS[0]?.id);
    const [conceptFilter, setConceptFilter] = useState(initialConcept);
    const [reviewMode, setReviewMode] = useState(false);
    // Review queue: the due ids frozen when a review starts, so answering an
    // item (which moves it out of "due") does not pull it from under the learner.
    const [reviewQueue, setReviewQueue] = useState([]);
    // Review attempts this session (qId → { value, correct, mode }). A due item
    // opens fresh, at the gate, and can be answered once per review; the first
    // attempt in `answers`/`firstCorrect` stays the locked, honest record.
    const [reviewAnswers, setReviewAnswers] = useState({});
    const [answers, setAnswers] = useState(() => load(PROGRESS_KEY, {}).answers || {});
    // A self-graded partial is null (neither pass nor miss). Progress written
    // before that stored it as true; read those back as partial.
    const [firstCorrect, setFirstCorrect] = useState(() => {
      const p = load(PROGRESS_KEY, {}), fc = { ...(p.firstCorrect || {}) }, md = p.modes || {};
      Object.keys(p.answers || {}).forEach((q) => { if (p.answers[q] === 'partial' && md[q] !== 'mcq') fc[q] = null; });
      return fc;
    });
    const [modes, setModes] = useState(() => load(PROGRESS_KEY, {}).modes || {});
    const [srs, setSrs] = useState(() => load(SRS_KEY, { v: 1, items: {} }));
    const [showDetailed, setShowDetailed] = useState(false);
    const [revealed, setRevealed] = useState(false);   // recall path: answer shown, no choices
    const [choicesShown, setChoicesShown] = useState(false); // MCQ path: options revealed
    const [domainFilter, setDomainFilter] = useState(null);
    // A pick or self-grade waits LOCK_MS before it becomes the record, with no
    // feedback shown, so a slipped key or thumb can be undone (Esc) or changed.
    // Space/Enter, leaving the item, or hiding the page commits it at once.
    const [pending, setPending] = useState(null); // { qId, value, correct, box, mode }
    const pendingRef = useRef(null);
    pendingRef.current = pending;
    const cardRef = useRef(null);

    // Persist progress + SRS. `modes` records how each item was settled —
    // 'recall' (answered from memory, choices never shown) or 'mcq' (picked
    // from the options) — so "knew it cold" and "got it with the choices"
    // stay distinguishable. Absent on progress written before this existed.
    const progMountedRef = useRef(false);
    const srsMountedRef = useRef(false);
    useEffect(() => {
      if (!progMountedRef.current) { progMountedRef.current = true; return; }
      save(PROGRESS_KEY, { v: 1, answers, firstCorrect, modes, updated: new Date().toISOString() });
    }, [answers, firstCorrect, modes]);
    useEffect(() => {
      if (!srsMountedRef.current) { srsMountedRef.current = true; return; }
      save(SRS_KEY, { ...srs, updated: new Date().toISOString() });
    }, [srs]);

    const dueIds = useMemo(() => {
      const t = today();
      return ITEMS.filter((q) => { const s = srs.items[q.id]; return s && s.nextReview && s.nextReview <= t; }).map((q) => q.id);
    }, [srs, ITEMS]);

    const filteredItems = useMemo(() => {
      let pool = ITEMS;
      if (reviewMode) { const set = new Set(reviewQueue); pool = pool.filter((q) => set.has(q.id)); }
      if (conceptFilter) pool = pool.filter((q) => q.concepts.includes(conceptFilter));
      return pool;
    }, [conceptFilter, reviewMode, reviewQueue, ITEMS]);

    // An answered item whose review date has come is open for a fresh attempt.
    const isDue = (qId) => { const s = srs.items[qId]; return !!(answers[qId] && s && s.nextReview && s.nextReview <= today()); };
    // The attempt to draw for an item: this session's review, else nothing if
    // it is due (fresh gate), else the locked first attempt.
    const shownAttempt = (qId) => {
      if (reviewAnswers[qId]) return reviewAnswers[qId];
      if (isDue(qId)) return null;
      return answers[qId] ? { value: answers[qId], correct: firstCorrect[qId], mode: modes[qId] } : null;
    };

    const currentItem = useMemo(() => ITEMS.find((q) => q.id === currentId) || ITEMS[0], [currentId, ITEMS]);
    const currentIdx = filteredItems.findIndex((q) => q.id === currentId);
    const totalAnswered = Object.keys(answers).length;
    const totalCorrect = Object.values(firstCorrect).filter((v) => v === true).length;
    const totalPartial = Object.keys(answers).filter((q) => firstCorrect[q] === null).length;

    const recordAnswer = (qId, value, correct, nextBox, mode) => {
      if (answers[qId]) {
        // Review attempt: once per due date; moves only the Leitner box.
        if (reviewAnswers[qId] || !isDue(qId)) return;
        setReviewAnswers((prev) => ({ ...prev, [qId]: { value, correct, mode } }));
      } else {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
        setFirstCorrect((prev) => ({ ...prev, [qId]: correct }));
        if (mode) setModes((prev) => ({ ...prev, [qId]: mode }));
      }
      setSrs((prev) => {
        const cur = prev.items[qId] || { box: 1 };
        let box;
        if (typeof nextBox === 'function') box = nextBox(cur.box);
        else if (typeof nextBox === 'number') box = nextBox;
        else box = correct ? Math.min(cur.box + 1, 5) : 1;
        box = Math.max(1, Math.min(box, 5));
        return { ...prev, items: { ...prev.items, [qId]: { box, nextReview: addDays(today(), LEITNER_INTERVALS[box]) } } };
      });
      // Derived concept-mastery layer (read by the hub's weak-concepts list).
      // Item-level SRS above is the scheduler; this is purely analytic.
      const it = ITEMS.find((q) => q.id === qId);
      if (it && it.concepts.length) OKSATStore.recordConceptResult(slug, reviewer, it.concepts, correct);
    };

    // Commit the waiting pick now (timer, Space/Enter, navigation, page hide).
    const commitPending = () => {
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      setPending(null);
      recordAnswer(p.qId, p.value, p.correct, p.box, p.mode);
    };
    const commitRef = useRef(commitPending);
    commitRef.current = commitPending;
    const undoPending = () => { pendingRef.current = null; setPending(null); };
    useEffect(() => {
      if (!pending) return undefined;
      const t = setTimeout(() => commitRef.current(), LOCK_MS);
      return () => clearTimeout(t);
    }, [pending]);
    useEffect(() => {
      const flush = () => commitRef.current();
      const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
      window.addEventListener('pagehide', flush);
      document.addEventListener('visibilitychange', onVis);
      return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); };
    }, []);
    // Picking again before the lock replaces the pick and restarts the wait.
    const propose = (value, correct, box, mode) => {
      if (shownAttempt(currentId)) return;
      setPending({ qId: currentId, value, correct, box, mode });
    };

    // MCQ path: the learner opened the choices and picked one.
    const handleSelect = (optionId) => propose(optionId, optionId === currentItem.correct, undefined, 'mcq');
    // Recall path: answered from memory, then self-graded (both recall-type
    // items and MCQ items settled without ever opening the choices).
    const handleGrade = (grade) => propose(grade.id, grade.correct, grade.box, 'recall');
    const showChoices = () => setChoicesShown(true);

    const goToItem = (qId) => {
      commitPending();
      setCurrentId(qId); setShowDetailed(false); setRevealed(false); setChoicesShown(false); setView('item');
      setTimeout(() => cardRef.current?.scrollTo?.(0, 0), 50);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
      if (!filteredItems.length) return;
      const idx = filteredItems.findIndex((q) => q.id === currentId);
      goToItem(filteredItems[(idx + 1) % filteredItems.length].id);
    };
    const handlePrev = () => {
      if (!filteredItems.length) return;
      const idx = filteredItems.findIndex((q) => q.id === currentId);
      goToItem(filteredItems[(idx - 1 + filteredItems.length) % filteredItems.length].id);
    };
    const handleRandom = () => {
      const pool = filteredItems.filter((q) => q.id !== currentId);
      if (!pool.length) return;
      goToItem(pool[Math.floor(Math.random() * pool.length)].id);
    };
    // Open = unanswered, or due for review (nothing to draw yet). "Next
    // unanswered" walks these forward from the current item, wrapping.
    const isOpen = (qId) => !shownAttempt(qId);
    const openCount = filteredItems.filter((q) => isOpen(q.id)).length;
    const handleNextOpen = () => {
      const n = filteredItems.length;
      for (let k = 1; k <= n; k++) {
        const q = filteredItems[(Math.max(currentIdx, -1) + k + n) % n];
        if (q && q.id !== currentId && isOpen(q.id)) { goToItem(q.id); return; }
      }
    };
    const jumpToIdx = (idx) => { const q = filteredItems[idx]; if (q && q.id !== currentId) goToItem(q.id); };
    // Status for the jump slider's preview.
    const statusOf = (qId) => {
      const a = shownAttempt(qId);
      if (a) {
        const g = a.mode === 'recall' ? RECALL_GRADES.find((x) => x.id === a.value) : null;
        if (g) return g.label.toLowerCase();
        return a.correct ? 'correct' : 'missed';
      }
      return isDue(qId) ? 'due for review' : 'unanswered';
    };
    const handleConceptClick = (conceptId) => {
      setReviewMode(false);
      setConceptFilter(conceptId);
      const first = ITEMS.find((q) => q.concepts.includes(conceptId));
      if (first) goToItem(first.id);
    };
    const startReview = () => {
      if (!dueIds.length) return;
      setConceptFilter(null); setReviewQueue(dueIds); setReviewMode(true);
      goToItem(dueIds[0]);
    };

    const relatedItems = useMemo(() => {
      if (!currentItem || !currentItem.concepts.length) return [];
      return ITEMS
        .filter((q) => q.id !== currentItem.id)
        .map((q) => ({ q, overlap: q.concepts.filter((c) => currentItem.concepts.includes(c)).length }))
        .filter((x) => x.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 3)
        .map((x) => x.q);
    }, [currentItem, ITEMS]);

    const startModule = () => { setReviewMode(false); setConceptFilter(null); const first = ITEMS.find((q) => isOpen(q.id)) || ITEMS[0]; first && goToItem(first.id); };
    const randomFromHome = () => { const r = ITEMS[Math.floor(Math.random() * ITEMS.length)]; if (r) goToItem(r.id); };

    // Keyboard navigation (item view; space and r on the landing). Ref keeps the latest logic.
    const kbRef = useRef();
    kbRef.current = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tgt = e.target;
      if (tgt && tgt.matches && tgt.matches('input, textarea, select, [contenteditable]')) return;
      // Module landing: Enter begins (or continues), r opens a random question. Space stays page scroll.
      if (view === 'home') {
        if (tgt && tgt.closest && tgt.closest('button, a, summary')) return;
        if (e.key === 'Enter') { e.preventDefault(); startModule(); return; }
        if (e.key === 'r') { e.preventDefault(); randomFromHome(); return; }
        return;
      }
      if (view !== 'item' || !currentItem) return;
      if (e.key === '?') { e.preventDefault(); setKeysOpen((v) => !v); return; }
      if (e.key === 'Escape' && keysOpen) { e.preventDefault(); setKeysOpen(false); return; }
      const answered = !!shownAttempt(currentId);
      const isRecall = currentItem.type === 'recall';
      const key = e.key;

      // A pick is waiting to lock: Esc or Backspace undoes it, Space/Enter locks it now.
      const p = pendingRef.current;
      if (p && p.qId === currentId) {
        if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); undoPending(); return; }
        if (key === ' ' || key === 'Enter') { e.preventDefault(); commitPending(); return; }
      }

      if (key === 'ArrowLeft') { e.preventDefault(); handlePrev(); return; }
      if (key === 'ArrowRight') { e.preventDefault(); handleNext(); return; }
      if (key === 'h' || key === 'Escape') {
        e.preventDefault();
        if (key === 'Escape' && conceptFilter) { setConceptFilter(null); return; }
        commitPending(); setView('home'); return;
      }
      if (key === 'r') { e.preventDefault(); handleRandom(); return; }
      if (key === 'u') { e.preventDefault(); handleNextOpen(); return; }
      if (key === 'd' && answered && currentItem.detailed) { e.preventDefault(); setShowDetailed((v) => !v); return; }

      // Recall gate (mcq, unanswered, nothing opened yet): `c` opens the
      // choices; space/enter (below) reveals the answer for a memory attempt.
      if (!isRecall && !answered && !revealed && !choicesShown && (key === 'c' || key === 'C')) {
        e.preventDefault(); showChoices(); return;
      }
      // Option selection: numbers or the literal option ids — only once the
      // choices are open (mcq path).
      if (!isRecall && choicesShown && !answered && currentItem.options.length) {
        let opt = null;
        if (/^[1-9]$/.test(key)) opt = currentItem.options[parseInt(key, 10) - 1];
        else opt = currentItem.options.find((o) => String(o.id).toLowerCase() === key.toLowerCase());
        if (opt) { e.preventDefault(); handleSelect(opt.id); return; }
      }
      // Recall self-grade: 1–4 once the answer is revealed (recall-type items
      // and the mcq recall path both land here).
      if (revealed && !choicesShown && !answered && /^[1-4]$/.test(key)) {
        e.preventDefault(); handleGrade(RECALL_GRADES[parseInt(key, 10) - 1]); return;
      }
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        if (!revealed && !choicesShown && !answered) { setRevealed(true); return; } // reveal for recall
        if (answered) handleNext();
        return;
      }
    };
    useEffect(() => {
      const h = (e) => kbRef.current && kbRef.current(e);
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, []);

    return html`
      <div className="ok-root" ref=${cardRef}>
        <div className="ok-wrap">
          ${view === 'home'
            ? html`<${HomeView}
                meta=${meta} DOMAINS=${DOMAINS} CONCEPTS=${CONCEPTS} ITEMS=${ITEMS}
                hasTaxonomy=${hasTaxonomy}
                domainFilter=${domainFilter} setDomainFilter=${setDomainFilter}
                totalAnswered=${totalAnswered} totalCorrect=${totalCorrect} totalPartial=${totalPartial}
                resumeIdx=${ITEMS.findIndex((q) => isOpen(q.id))}
                firstCorrect=${firstCorrect} answers=${answers}
                dueCount=${dueIds.length} onReview=${startReview}
                onStart=${startModule}
                onRandom=${randomFromHome}
                onConceptClick=${handleConceptClick} />`
            : html`<${ItemView}
                DOMAINS=${DOMAINS} CONCEPTS=${CONCEPTS} ITEMS=${ITEMS}
                item=${currentItem} answer=${shownAttempt(currentId)?.value} isCorrect=${shownAttempt(currentId)?.correct} mode=${shownAttempt(currentId)?.mode}
                retake=${!!reviewAnswers[currentId] || isDue(currentId)}
                onSelect=${handleSelect} revealed=${revealed} onReveal=${() => setRevealed(true)} onGrade=${handleGrade}
                choicesShown=${choicesShown} onShowChoices=${showChoices}
                showDetailed=${showDetailed} setShowDetailed=${setShowDetailed}
                onNext=${handleNext} onPrev=${handlePrev} onRandom=${handleRandom} onHome=${() => { commitPending(); setView('home'); }}
                keysOpen=${keysOpen} onKeys=${() => setKeysOpen((v) => !v)}
                pendingValue=${pending && pending.qId === currentId ? pending.value : null} onUndo=${undoPending}
                openCount=${openCount} onNextOpen=${handleNextOpen} onJumpIdx=${jumpToIdx} statusOf=${statusOf}
                currentIdx=${currentIdx} total=${filteredItems.length} globalTotal=${ITEMS.length}
                conceptFilter=${conceptFilter} setConceptFilter=${setConceptFilter}
                reviewMode=${reviewMode} exitReview=${() => setReviewMode(false)}
                filteredItems=${filteredItems}
                relatedItems=${relatedItems} onConceptClick=${handleConceptClick} onRelatedClick=${goToItem}
                answeredSet=${Object.keys(answers)} firstCorrect=${firstCorrect} />`}
        </div>
      </div>`;
  }

  /* =========================================================
     HOME VIEW
     ========================================================= */
  function HomeView({ meta, DOMAINS, CONCEPTS, ITEMS, hasTaxonomy, totalAnswered, totalCorrect, totalPartial, resumeIdx, onStart, onRandom, onConceptClick, answers, firstCorrect, domainFilter, setDomainFilter, dueCount, onReview }) {
    const conceptsByDomain = useMemo(() => {
      const groups = {};
      Object.entries(CONCEPTS).forEach(([id, c]) => { (groups[c.domain] = groups[c.domain] || []).push({ id, ...c }); });
      return groups;
    }, [CONCEPTS]);

    const conceptCounts = useMemo(() => {
      const counts = {};
      Object.keys(CONCEPTS).forEach((cId) => {
        counts[cId] = {
          total: ITEMS.filter((q) => q.concepts.includes(cId)).length,
          answered: ITEMS.filter((q) => q.concepts.includes(cId) && answers[q.id]).length,
        };
      });
      return counts;
    }, [answers, CONCEPTS, ITEMS]);

    const started = totalAnswered > 0;
    const progressPct = ITEMS.length ? (totalAnswered / ITEMS.length) * 100 : 0;
    const title = String(meta.title || 'Study').replace(/\s*\n\s*/g, ' ');
    const nDomains = hasTaxonomy ? Object.keys(DOMAINS).length : 0;
    const nConcepts = hasTaxonomy ? Object.keys(CONCEPTS).length : 0;
    /* one facts line, mono: what the module holds, then where you are in it */
    const facts = [ITEMS.length + ' questions'];
    if (nDomains) facts.push(nDomains + ' domains');
    if (nConcepts) facts.push(nConcepts + ' concepts');
    facts.push(started ? totalAnswered + ' / ' + ITEMS.length + ' answered · ' + totalCorrect + ' right first time' + (totalPartial ? ' · ' + totalPartial + ' partial' : '') : 'not started');
    const startLabel = started ? (resumeIdx >= 0 ? 'Continue at Q' + (resumeIdx + 1) : 'Continue') : 'Begin';

    return html`
      <div className="fade-up ok-home">
        <header className="ok-home-head">
          <p className="ok-home-kicker">${meta.kicker || 'Self-Assessment'}</p>
          <h1 className="ok-home-title">${title}</h1>
          ${meta.subtitle ? html`<p className="ok-home-sub">${meta.subtitle}</p>` : null}
          <p className="ok-home-facts">${facts.map((f, i) => html`<span key=${i}>${f}</span>`)}</p>
          ${started ? html`
            <div className="ok-home-meter" role="progressbar" aria-valuenow=${totalAnswered} aria-valuemin=${0} aria-valuemax=${ITEMS.length} aria-label="Questions answered">
              <span style=${{ width: progressPct + '%' }}></span>
            </div>` : null}
        </header>

        <div className="ok-home-actions">
          <button className="ok-btn ok-btn--primary" onClick=${onStart}>
            <span>${startLabel}</span><kbd className="ok-kbd ok-kbd--inv">enter</kbd>
          </button>
          <button className="ok-btn" onClick=${onRandom}>
            <span>Random</span><kbd className="ok-kbd">r</kbd>
          </button>
          ${dueCount > 0 ? html`
            <button className="ok-btn ok-home-due" onClick=${onReview}>
              <span>Review due · ${dueCount}</span>
            </button>` : null}
        </div>

        ${hasTaxonomy ? html`
          <section className="ok-home-domains" aria-labelledby="ok-domains-h">
            <h2 className="ok-home-label" id="ok-domains-h">Domains</h2>
            <ul className="ok-domains">
              ${Object.entries(DOMAINS).map(([dId, d]) => {
                const domainConcepts = conceptsByDomain[dId] || [];
                const expanded = domainFilter === dId;
                const ids = new Set();
                domainConcepts.forEach((c) => ITEMS.forEach((q) => { if (q.concepts.includes(c.id)) ids.add(q.id); }));
                const domainAnswered = [...ids].filter((id) => answers[id]).length;
                return html`
                  <li key=${dId} className="ok-domain">
                    <button className="ok-domain-row" onClick=${() => setDomainFilter(expanded ? null : dId)} aria-expanded=${expanded}>
                      <span className="ok-domain-tick" style=${{ backgroundColor: d.color }}></span>
                      <span className="ok-domain-name">${d.label}</span>
                      <span className="ok-domain-meta">${domainConcepts.length} concept${domainConcepts.length === 1 ? '' : 's'} · ${ids.size} q${domainAnswered > 0 ? ' · ' + domainAnswered + ' done' : ''}</span>
                      <${ChevronDown} size=${16} className="ok-domain-chev" style=${{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    ${expanded ? html`
                      <div className="fade-up ok-domain-body">
                        ${domainConcepts.map((c) => {
                          const ct = conceptCounts[c.id] || { total: 0, answered: 0 };
                          const complete = ct.total > 0 && ct.answered === ct.total;
                          return html`
                            <button key=${c.id} className="ok-chip" onClick=${() => onConceptClick(c.id)} style=${{ backgroundColor: d.hex, color: d.color }}>
                              ${c.label}
                              <span style=${{ color: C.textFaint, fontWeight: 400 }}>${ct.answered}/${ct.total}</span>
                              ${complete ? html`<${Check} size=${10} style=${{ color: C.correct }} />` : null}
                            </button>`;
                        })}
                      </div>` : null}
                  </li>`;
              })}
            </ul>
          </section>` : null}
      </div>`;
  }

  /* =========================================================
     ITEM VIEW
     ========================================================= */
  /* The keyboard sheet: every key the item view answers to (principle 6), opened by "?" */
  const KEYS = [
    ['Space · Enter', 'reveal the answer; once answered, next'],
    ['c', 'show the choices'],
    ['1–9 · a–d', 'pick a choice (once the choices are open)'],
    ['1–4', 'grade a revealed answer, Didn\u2019t know → Knew it cold'],
    ['Esc · Backspace', 'undo a pick before it locks'],
    ['← →', 'previous · next'],
    ['u', 'next unanswered or due'],
    ['r', 'random question'],
    ['d', 'detailed explanation'],
    ['h · Esc', 'back to the module menu'],
    ['?', 'show or hide this list'],
  ];
  function KeySheet() {
    return html`
      <div className="ok-keys fade-up" id="ok-keys">
        <dl>
          ${KEYS.map(([k, v]) => html`<${React.Fragment} key=${k}><dt><kbd className="ok-kbd">${k}</kbd></dt><dd>${v}</dd></${React.Fragment}>`)}
        </dl>
      </div>`;
  }

  function ItemView({ keysOpen, onKeys, DOMAINS, CONCEPTS, ITEMS, item, answer, isCorrect, mode, retake, pendingValue, onUndo, openCount, onNextOpen, onJumpIdx, statusOf, onSelect, revealed, onReveal, onGrade, choicesShown, onShowChoices, showDetailed, setShowDetailed, onNext, onPrev, onRandom, onHome, currentIdx, total, globalTotal, conceptFilter, setConceptFilter, reviewMode, exitReview, filteredItems, relatedItems, onConceptClick, onRelatedClick, answeredSet, firstCorrect }) {
    // Jump slider: the index being previewed while dragging (null = idle).
    // The jump commits on release so the page does not scroll mid-drag.
    const [scrub, setScrub] = useState(null);
    if (!item) {
      return html`
        <div className="fade-up" style=${{ textAlign: 'center', padding: '3rem 0', color: C.textMuted }}>
          <p style=${{ marginBottom: '1.25rem' }}>Nothing to review right now — every due item is cleared.</p>
          <button className="ok-btn" onClick=${() => { exitReview(); onHome(); }}><${Home} size=${14} /><span className="display-font">Menu</span></button>
        </div>`;
    }
    const answered = !!answer;
    const isRecall = item.type === 'recall';
    // How the answer was settled. `mode` is absent on items answered before
    // recall-first shipped, so fall back to the item type: a locked recall-type
    // item was self-graded, a locked mcq item was a picked option.
    const answeredViaRecall = answered && (mode ? mode === 'recall' : isRecall);
    const recallGrade = answeredViaRecall ? RECALL_GRADES.find((g) => g.id === answer) : null;
    const passLike = recallGrade ? recallGrade.correct : isCorrect;
    // Feedback colour: the grade's own (partial = accent, guessed = ochre), else pass/miss.
    const fbColor = recallGrade ? C[recallGrade.color] : (isCorrect ? C.correct : C.incorrect);
    const fbTint = recallGrade
      ? (recallGrade.color === 'correct' ? C.correctBg : recallGrade.color === 'incorrect' ? C.incorrectBg : C.surface)
      : (isCorrect ? C.correctBg : C.incorrectBg);
    const pendingLabel = pendingValue == null ? '' : (RECALL_GRADES.find((g) => g.id === pendingValue) || {}).label || String(pendingValue).toUpperCase();
    const lockBar = pendingValue == null ? null : html`
      <div className="ok-lockbar fade-up" role="status" aria-live="polite">
        <span className="ui-font">Locking <b>${pendingLabel}</b> as your first attempt</span>
        <button type="button" className="ok-btn ok-btn--sm" onClick=${onUndo}>Undo <span className="ok-kbd">Esc</span></button>
        <span className="ok-lockbar-timer" style=${{ animationDuration: LOCK_MS + 'ms' }}></span>
      </div>`;
    // The recall path reveals the plain answer: a recall item's `answer` field,
    // or the correct option's text for an mcq item.
    const correctOption = item.options.find((o) => o.id === item.correct);
    const revealAnswerText = isRecall ? item.answer : (correctOption ? correctOption.text : '');
    // Show the options block when the learner opened the choices, or when a
    // past mcq answer needs its locked state drawn.
    const showOptions = !isRecall && (choicesShown || (answered && !answeredViaRecall));
    // Show the plain-answer + self-grade block on the recall path.
    const showRecallBlock = revealed || (answered && answeredViaRecall);
    // The recall gate (mcq only): stem is up, nothing opened yet.
    const atGate = !isRecall && !answered && !revealed && !choicesShown;
    const filterConcept = conceptFilter ? CONCEPTS[conceptFilter] : null;
    const filterDomain = filterConcept ? DOMAINS[filterConcept.domain] : null;
    const bannerStyle = filterDomain
      ? { backgroundColor: filterDomain.hex, color: filterDomain.color }
      : { backgroundColor: C.borderSoft, color: C.textMuted };

    return html`
      <div className="fade-up">
        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button onClick=${onHome} style=${{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'none', border: 'none', color: C.textMuted }}>
            <${Home} size=${14} /><span className="display-font" style=${{ letterSpacing: '0.01em', fontWeight: 500 }}>Menu</span>
          </button>
          <div className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textFaint, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            ${reviewMode || retake ? html`<span style=${{ color: C.ochre }}>Review</span>` : null}
            ${item.difficulty ? html`<span style=${{ color: C.ochre }}>${item.difficulty}</span>` : null}
            ${conceptFilter ? html`<span>Filter · ${filterConcept ? filterConcept.label : conceptFilter}</span>` : html`<span>Question ${currentIdx + 1} of ${total}</span>`}
            <button className="ok-keys-btn" onClick=${onKeys} aria-expanded=${!!keysOpen} aria-controls="ok-keys" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">?</button>
          </div>
        </div>
        ${keysOpen ? html`<${KeySheet} />` : null}

        ${conceptFilter ? html`
          <div className="fade-up" style=${{ marginBottom: '1rem', padding: '0.5rem 0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', ...bannerStyle }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <${Filter} size=${12} />
              <span className="ui-font" style=${{ fontWeight: 500 }}>Showing ${total} of ${globalTotal}${filterConcept ? ' · ' + filterConcept.label : ''}</span>
            </div>
            <button onClick=${() => setConceptFilter(null)} aria-label="Clear filter" style=${{ background: 'none', border: 'none', color: 'inherit' }}><${X} size=${14} /></button>
          </div>` : null}

        ${item.section ? html`<div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.textFaint, marginBottom: '0.5rem' }}>${item.section}</div>` : null}

        ${item.concepts.length ? html`
          <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
            ${item.concepts.map((cId) => {
              const c = CONCEPTS[cId]; if (!c) return null;
              const d = DOMAINS[c.domain]; if (!d) return null;
              return html`<button key=${cId} className="ok-chip" onClick=${() => onConceptClick(cId)} style=${{ backgroundColor: d.hex, color: d.color }}>${c.label}</button>`;
            })}
          </div>` : null}

        <div className="ok-card" style=${{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <p className="display-font" style=${{ fontSize: 'clamp(1.15rem,3.2vw,1.4rem)', lineHeight: 1.35, color: C.text }}>${renderText(item.stem)}</p>
          ${item.image ? html`<div style=${{ marginTop: '1rem' }}><img src=${item.image} alt=${item.imageAlt || ''} style=${{ maxWidth: '100%', borderRadius: '10px', border: '1px solid ' + C.borderSoft }} /></div>` : null}

          ${atGate ? html`
            <div className="fade-up" style=${{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p className="ui-font" style=${{ fontSize: '0.82rem', lineHeight: 1.5, color: C.textMuted }}>Work out your answer from memory first, then reveal it — or open the choices if you'd rather pick.</p>
              <button className="ok-btn ok-btn--primary ok-btn--block" onClick=${onReveal}>
                <${Eye} size=${15} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Reveal answer</span>
              </button>
              <button className="ok-btn ok-btn--block" onClick=${onShowChoices}>
                <${Layers} size=${15} style=${{ color: C.ochre }} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Show the choices</span>
              </button>
            </div>` : null}

          ${isRecall && !revealed && !answered ? html`
            <div style=${{ marginTop: '1.5rem' }}>
              <button className="ok-btn ok-btn--primary ok-btn--block" onClick=${onReveal}>
                <${Eye} size=${15} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Reveal answer</span>
              </button>
            </div>` : null}

          ${showRecallBlock ? html`
            <div className="fade-up" style=${{ marginTop: '1.5rem' }}>
              <div className="display-font" style=${{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', color: C.accent, fontWeight: 600 }}>Answer</div>
              <div style=${{ padding: '1rem', borderRadius: '10px', lineHeight: 1.6, backgroundColor: C.bg, border: '1px solid ' + C.borderSoft, borderLeft: '3px solid ' + C.accent, color: C.text, fontSize: '16px' }}>${renderText(revealAnswerText)}</div>
              ${!answered ? html`
                <div style=${{ marginTop: '0.85rem' }}>
                  <div className="display-font" style=${{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textFaint, marginBottom: '0.45rem' }}>Did you know it?</div>
                  <div className="ok-grades">
                    ${RECALL_GRADES.map((g, i) => {
                      const picked = pendingValue === g.id;
                      return html`
                      <button key=${g.id} className="ok-btn ok-grade" aria-pressed=${picked} onClick=${() => onGrade(g)} style=${{ borderColor: C[g.color], color: picked ? C.surface : C[g.color], backgroundColor: picked ? C[g.color] : undefined, opacity: pendingValue != null && !picked ? 0.55 : 1 }}>
                        <span className="display-font" style=${{ fontSize: '0.7rem', opacity: 0.6 }}>${i + 1}</span>
                        <span className="display-font" style=${{ fontWeight: 600, fontSize: '0.85rem' }}>${g.label}</span>
                      </button>`;
                    })}
                  </div>
                  ${lockBar}
                </div>` : null}
            </div>` : null}

          ${showOptions ? html`
            <div role="radiogroup" aria-label="Answer options" style=${{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              ${item.options.length ? item.options.map((opt) => {
                const isPending = !answered && pendingValue === opt.id;
                const isSelected = answer === opt.id || isPending;
                const isCorrectOption = opt.id === item.correct;
                const showAsCorrect = answered && isCorrectOption;
                const showAsIncorrect = answered && isSelected && !isCorrectOption;
                let bg = C.surface, bd = C.border, tc = C.text, lc = C.borderSoft;
                if (showAsCorrect) { bg = C.correctBg; bd = C.correct; lc = C.correct; }
                else if (showAsIncorrect) { bg = C.incorrectBg; bd = C.incorrect; lc = C.incorrect; }
                else if (answered) { bg = C.bg; tc = C.textMuted; }
                else if (isPending) { bd = C.accent; lc = C.accent; }
                return html`
                  <button key=${opt.id} role="radio" aria-checked=${isSelected} onClick=${() => onSelect(opt.id)} disabled=${answered}
                          style=${{ width: '100%', textAlign: 'left', padding: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: bg, border: '1px solid ' + bd, borderLeft: '3px solid ' + lc, color: tc, cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <div className="display-font" style=${{ fontSize: '0.85rem', flexShrink: 0, width: '1.25rem', color: showAsCorrect ? C.correct : showAsIncorrect ? C.incorrect : isPending ? C.accent : C.textMuted, fontWeight: 600 }}>${String(opt.id).toUpperCase()}</div>
                    <div style=${{ flex: 1, lineHeight: 1.4, fontSize: '15px' }}>${opt.text}</div>
                    ${showAsCorrect ? html`<${Check} size=${16} style=${{ color: C.correct, flexShrink: 0, marginTop: '2px' }} />` : null}
                    ${showAsIncorrect ? html`<${X} size=${16} style=${{ color: C.incorrect, flexShrink: 0, marginTop: '2px' }} />` : null}
                  </button>`;
              }) : html`<p style=${{ color: C.textFaint, fontStyle: 'italic', fontSize: '0.9rem' }}>No options provided for this question.</p>`}
              ${lockBar}
            </div>` : null}
        </div>

        ${answered ? html`
          <div className="fade-up" aria-live="polite" style=${{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style=${{ padding: '1.25rem', borderRadius: '4px', backgroundColor: fbTint, border: '1px solid ' + C.borderSoft, borderLeft: '3px solid ' + fbColor }}>
              <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                ${recallGrade
                  ? html`<${React.Fragment}>${recallGrade.correct === null ? null : html`<${passLike ? Check : X} size=${16} style=${{ color: C[recallGrade.color] }} />`}<span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C[recallGrade.color], fontWeight: 600 }}>${recallGrade.label}</span></${React.Fragment}>`
                  : isCorrect
                  ? html`<${React.Fragment}><${Check} size=${16} style=${{ color: C.correct }} /><span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.correct, fontWeight: 600 }}>Correct</span><span style=${{ fontSize: '0.75rem', marginLeft: '0.25rem', color: C.textMuted }}>· with the choices</span></${React.Fragment}>`
                  : html`<${React.Fragment}><${X} size=${16} style=${{ color: C.incorrect }} /><span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.incorrect, fontWeight: 600 }}>Not Quite</span><span style=${{ fontSize: '0.75rem', marginLeft: '0.25rem', color: C.textMuted }}>· Answer: ${item.correct ? String(item.correct).toUpperCase() : '—'}</span></${React.Fragment}>`}
              </div>
              ${!answeredViaRecall && !isCorrect && item.distractorNotes && answer && item.distractorNotes[answer] ? html`
                <div style=${{ marginBottom: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '10px', backgroundColor: C.bg, border: '1px solid ' + C.borderSoft, borderLeft: '3px solid ' + C.incorrect }}>
                  <div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.incorrect, fontWeight: 600, marginBottom: '0.3rem' }}>Your distractor · ${String(answer).toUpperCase()}</div>
                  <p style=${{ lineHeight: 1.55, color: C.text, fontSize: '14.5px' }}>${renderText(item.distractorNotes[answer])}</p>
                </div>` : null}
              <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '15.5px' }}>${renderText(item.brief)}</p>
              ${item.reference ? html`<p className="ui-font" style=${{ marginTop: '0.6rem', fontSize: '0.72rem', color: C.textFaint }}>${item.reference}</p>` : null}
            </div>

            ${item.detailed ? html`
              <button className="ok-btn ok-btn--block" onClick=${() => setShowDetailed(!showDetailed)} style=${{ justifyContent: 'space-between' }}>
                <span style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><${Sparkles} size=${14} style=${{ color: C.ochre }} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>${showDetailed ? 'Hide detailed explanation' : 'Read detailed explanation'}</span></span>
                <${ChevronDown} size=${16} style=${{ color: C.textMuted, transform: showDetailed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>` : null}
            ${item.detailed && showDetailed ? html`
              <div className="ok-card fade-up" style=${{ padding: '1.25rem' }}>
                <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '16px' }}>${renderText(item.detailed)}</p>
                ${item.explanationImage ? html`<div style=${{ marginTop: '0.75rem' }}><img src=${item.explanationImage} alt=${item.explanationImageAlt || ''} style=${{ maxWidth: '100%', borderRadius: '10px', border: '1px solid ' + C.borderSoft }} /></div>` : null}
              </div>` : null}

            ${relatedItems.length ? html`
              <div className="ok-card" style=${{ padding: '1.25rem' }}>
                <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <${Layers} size=${14} style=${{ color: C.ochre }} /><span className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 500 }}>Explore Related</span>
                </div>
                <div style=${{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  ${relatedItems.map((q) => {
                    const isAns = answeredSet.includes(q.id);
                    const wc = firstCorrect[q.id];
                    return html`
                      <button key=${q.id} onClick=${() => onRelatedClick(q.id)} style=${{ width: '100%', textAlign: 'left', padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: C.bg, border: '1px solid ' + C.borderSoft, color: C.text }}>
                        <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flexShrink: 0, marginTop: '0.1rem' }}>
                          <div className="display-font" style=${{ fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600 }}>${String(q.id).replace(/^q/i, 'Q')}</div>
                          ${isAns ? (wc === true ? html`<${Check} size=${11} style=${{ color: C.correct }} />` : wc === null ? html`<span aria-label="partial" style=${{ width: '7px', height: '7px', borderRadius: '50%', border: '1.5px solid ' + C.accent }}></span>` : html`<${X} size=${11} style=${{ color: C.incorrect }} />`) : null}
                        </div>
                        <div style=${{ flex: 1, lineHeight: 1.4, fontSize: '14.5px' }}>${q.stem}</div>
                        <${ArrowRight} size=${14} style=${{ color: C.textFaint, flexShrink: 0, marginTop: '0.25rem' }} />
                      </button>`;
                  })}
                </div>
              </div>` : null}
          </div>` : null}

        <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="ok-btn ok-btn--flex" onClick=${onPrev}><${ChevronLeft} size=${16} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Prev</span></button>
          <button className="ok-btn" onClick=${onRandom} title="Random" aria-label="Random question"><${Shuffle} size=${16} style=${{ color: C.textMuted }} /></button>
          <button className="ok-btn ok-btn--primary ok-btn--flex" onClick=${onNext}><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>${answered ? 'Next' : 'Skip'}</span><${ChevronRight} size=${16} /></button>
        </div>
        ${(() => {
          const others = openCount - (answered ? 0 : 1);
          const label = others > 0 ? `Next unanswered · ${openCount} left` : (openCount ? 'This is the last unanswered' : 'All answered');
          return html`<button className="ok-btn ok-btn--block ok-next-open" onClick=${onNextOpen} disabled=${others < 1} title="Next unanswered (u)"><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.88rem' }}>${label}</span></button>`;
        })()}
        ${total > 1 ? (() => {
          const idx = scrub != null ? scrub : Math.max(currentIdx, 0);
          const q = filteredItems[idx];
          const preview = q ? `Q${idx + 1} of ${total}${q.section ? ' · ' + q.section : ''} · ${statusOf(q.id)}` : '';
          const commit = () => { if (scrub != null) { const i = scrub; setScrub(null); onJumpIdx(i); } };
          return html`
            <div className="ok-jump">
              <div className="ok-jump-head"><span className="display-font">Jump to</span><span className="ok-jump-preview">${preview}</span></div>
              <input type="range" className="ok-jump-range" min="1" max=${total} step="1" value=${idx + 1}
                aria-label="Jump to question" aria-valuetext=${preview}
                onChange=${(e) => setScrub(Number(e.target.value) - 1)}
                onPointerUp=${commit} onKeyUp=${commit} onTouchEnd=${commit} onBlur=${commit} />
            </div>`;
        })() : null}

        <div className="ok-dotrow" aria-hidden="true">
          ${Array.from({ length: total }, (_, i) => {
            const q = filteredItems[i];
            if (!q) return null;
            const isCurrent = i === currentIdx;
            const isAns = answeredSet.includes(q.id);
            const wc = firstCorrect[q.id];
            let dot = C.borderSoft;
            if (isAns) dot = wc === true ? C.correct : wc === null ? C.accent : C.incorrect;
            return html`<div key=${q.id} className="ok-dot" style=${{ width: isCurrent ? '18px' : '5px', backgroundColor: isCurrent ? C.accent : dot, opacity: isCurrent ? 1 : isAns ? 0.7 : 0.4 }}></div>`;
          })}
        </div>
      </div>`;
  }

  /* ---- Mount ---- */
  window.mountOKSAT = function (rootEl, module, entry, code) {
    ReactDOM.createRoot(rootEl).render(html`<${StudyViewer} module=${module} entry=${entry} code=${code} />`);
  };
})();
