/* =============================================================
   MCQ study engine — StudyViewer
   React (UMD) + htm (no in-browser Babel). Mount via window.mountMCQ.
   Colors resolve to CSS custom properties (css/mcq.css), so the whole
   UI follows the site-wide light/dark theme. Tolerant of sparse module
   data — see docs/authoring-mcq.md for the schema.
   ============================================================= */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const html = htm.bind(React.createElement);

  /* Palette → CSS variables (theme-reactive) */
  const C = {
    bg: 'var(--mcq-bg)', surface: 'var(--mcq-surface)', border: 'var(--mcq-border)',
    borderSoft: 'var(--mcq-border-soft)', text: 'var(--mcq-text)', textMuted: 'var(--mcq-text-muted)',
    textFaint: 'var(--mcq-text-faint)', accent: 'var(--mcq-accent)', accentSoft: 'var(--mcq-accent-soft)',
    ochre: 'var(--mcq-ochre)', correct: 'var(--mcq-correct)', correctBg: 'var(--mcq-correct-bg)',
    incorrect: 'var(--mcq-incorrect)', incorrectBg: 'var(--mcq-incorrect-bg)',
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
  const BookOpen = makeIcon(['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z']);
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
  const RotateCcw = makeIcon(['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']);

  /* ---- Spaced repetition (Leitner; mirrors kag.html) ---- */
  const LEITNER_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
  const today = () => new Date().toISOString().split('T')[0];
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  /* ---- Storage (namespaced, fail-safe) ---- */
  const load = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  };

  /* =========================================================
     STUDY VIEWER
     ========================================================= */
  function StudyViewer({ module, entry }) {
    const meta = module.meta || {};
    const DOMAINS = module.DOMAINS || {};
    const CONCEPTS = module.CONCEPTS || {};
    const slug = (entry && entry.slug) || meta.id || 'module';
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

    const PROGRESS_KEY = 'mcq:progress:' + slug;
    const SRS_KEY = 'mcq:srs:' + slug;

    const [view, setView] = useState('home');
    const [currentId, setCurrentId] = useState(ITEMS[0]?.id);
    const [conceptFilter, setConceptFilter] = useState(null);
    const [reviewMode, setReviewMode] = useState(false);
    const [answers, setAnswers] = useState(() => load(PROGRESS_KEY, {}).answers || {});
    const [firstCorrect, setFirstCorrect] = useState(() => load(PROGRESS_KEY, {}).firstCorrect || {});
    const [srs, setSrs] = useState(() => load(SRS_KEY, { v: 1, items: {} }));
    const [showDetailed, setShowDetailed] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [domainFilter, setDomainFilter] = useState(null);
    const cardRef = useRef(null);

    // Persist progress + SRS.
    useEffect(() => { save(PROGRESS_KEY, { v: 1, answers, firstCorrect, updated: new Date().toISOString() }); }, [answers, firstCorrect]);
    useEffect(() => { save(SRS_KEY, { ...srs, updated: new Date().toISOString() }); }, [srs]);

    const dueIds = useMemo(() => {
      const t = today();
      return ITEMS.filter((q) => { const s = srs.items[q.id]; return s && s.nextReview && s.nextReview <= t; }).map((q) => q.id);
    }, [srs, ITEMS]);

    const filteredItems = useMemo(() => {
      let pool = ITEMS;
      if (reviewMode) { const set = new Set(dueIds); pool = pool.filter((q) => set.has(q.id)); }
      if (conceptFilter) pool = pool.filter((q) => q.concepts.includes(conceptFilter));
      return pool;
    }, [conceptFilter, reviewMode, dueIds, ITEMS]);

    const currentItem = useMemo(() => ITEMS.find((q) => q.id === currentId) || ITEMS[0], [currentId, ITEMS]);
    const currentIdx = filteredItems.findIndex((q) => q.id === currentId);
    const totalAnswered = Object.keys(answers).length;
    const totalCorrect = Object.values(firstCorrect).filter(Boolean).length;

    const recordAnswer = (qId, value, correct) => {
      if (answers[qId]) return;
      setAnswers((prev) => ({ ...prev, [qId]: value }));
      setFirstCorrect((prev) => ({ ...prev, [qId]: correct }));
      setSrs((prev) => {
        const cur = prev.items[qId] || { box: 1 };
        const box = correct ? Math.min(cur.box + 1, 5) : 1;
        return { ...prev, items: { ...prev.items, [qId]: { box, nextReview: addDays(today(), LEITNER_INTERVALS[box]) } } };
      });
    };

    const handleSelect = (optionId) => recordAnswer(currentId, optionId, optionId === currentItem.correct);
    const handleGrade = (gotIt) => recordAnswer(currentId, gotIt ? 'got' : 'missed', gotIt);

    const goToItem = (qId) => {
      setCurrentId(qId); setShowDetailed(false); setRevealed(false); setView('item');
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
    const handleConceptClick = (conceptId) => {
      setReviewMode(false);
      setConceptFilter(conceptId);
      const first = ITEMS.find((q) => q.concepts.includes(conceptId));
      if (first) goToItem(first.id);
    };
    const startReview = () => {
      if (!dueIds.length) return;
      setConceptFilter(null); setReviewMode(true);
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

    // Keyboard navigation (item view only). Ref keeps the latest logic.
    const kbRef = useRef();
    kbRef.current = (e) => {
      if (view !== 'item' || !currentItem) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tgt = e.target;
      if (tgt && tgt.matches && tgt.matches('input, textarea, select, [contenteditable]')) return;
      const answered = !!answers[currentId];
      const isRecall = currentItem.type === 'recall';
      const key = e.key;

      if (key === 'ArrowLeft') { e.preventDefault(); handlePrev(); return; }
      if (key === 'ArrowRight') { e.preventDefault(); handleNext(); return; }
      if (key === 'h' || key === 'Escape') {
        e.preventDefault();
        if (key === 'Escape' && conceptFilter) { setConceptFilter(null); return; }
        setView('home'); return;
      }
      if (key === 'r') { e.preventDefault(); handleRandom(); return; }
      if (key === 'd' && answered && currentItem.detailed) { e.preventDefault(); setShowDetailed((v) => !v); return; }

      // Option selection: numbers or the literal option ids (mcq, unanswered).
      if (!isRecall && !answered && currentItem.options.length) {
        let opt = null;
        if (/^[1-9]$/.test(key)) opt = currentItem.options[parseInt(key, 10) - 1];
        else opt = currentItem.options.find((o) => String(o.id).toLowerCase() === key.toLowerCase());
        if (opt) { e.preventDefault(); handleSelect(opt.id); return; }
      }
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        if (isRecall && !revealed && !answered) { setRevealed(true); return; }
        if (answered || (isRecall && revealed)) handleNext();
        return;
      }
    };
    useEffect(() => {
      const h = (e) => kbRef.current && kbRef.current(e);
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
    }, []);

    return html`
      <div className="mcq-root" ref=${cardRef}>
        <div className="mcq-wrap">
          ${view === 'home'
            ? html`<${HomeView}
                meta=${meta} DOMAINS=${DOMAINS} CONCEPTS=${CONCEPTS} ITEMS=${ITEMS}
                hasTaxonomy=${hasTaxonomy}
                domainFilter=${domainFilter} setDomainFilter=${setDomainFilter}
                totalAnswered=${totalAnswered} totalCorrect=${totalCorrect}
                firstCorrect=${firstCorrect} answers=${answers}
                dueCount=${dueIds.length} onReview=${startReview}
                onStart=${() => { setReviewMode(false); setConceptFilter(null); ITEMS[0] && goToItem(ITEMS[0].id); }}
                onJump=${goToItem}
                onConceptClick=${handleConceptClick} />`
            : html`<${ItemView}
                DOMAINS=${DOMAINS} CONCEPTS=${CONCEPTS} ITEMS=${ITEMS}
                item=${currentItem} answer=${answers[currentId]} isCorrect=${firstCorrect[currentId]}
                onSelect=${handleSelect} revealed=${revealed} onReveal=${() => setRevealed(true)} onGrade=${handleGrade}
                showDetailed=${showDetailed} setShowDetailed=${setShowDetailed}
                onNext=${handleNext} onPrev=${handlePrev} onRandom=${handleRandom} onHome=${() => setView('home')}
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
  function HomeView({ meta, DOMAINS, CONCEPTS, ITEMS, hasTaxonomy, totalAnswered, totalCorrect, onStart, onJump, onConceptClick, answers, firstCorrect, domainFilter, setDomainFilter, dueCount, onReview }) {
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
          correct: ITEMS.filter((q) => q.concepts.includes(cId) && firstCorrect[q.id]).length,
        };
      });
      return counts;
    }, [answers, firstCorrect, CONCEPTS, ITEMS]);

    const progressPct = ITEMS.length ? (totalAnswered / ITEMS.length) * 100 : 0;
    const titleLines = (meta.title || 'Study').split('\n');

    return html`
      <div className="fade-up">
        <div style=${{ marginBottom: '2rem' }}>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: C.ochre }}>
            <div style=${{ height: '1px', flex: 1, backgroundColor: C.border }}></div>
            <span className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 500 }}>${meta.kicker || 'MCQ'}</span>
            <div style=${{ height: '1px', flex: 1, backgroundColor: C.border }}></div>
          </div>
          <h1 className="display-font" style=${{ fontSize: 'clamp(2.2rem,7vw,3rem)', fontWeight: 300, lineHeight: 1.12, color: C.text, fontVariationSettings: "'opsz' 144, 'wght' 400, 'SOFT' 50" }}>
            ${titleLines.map((line, i) => html`<${React.Fragment} key=${i}>${i > 0 ? html`<br/>` : null}${i === 0 ? line : html`<em style=${{ fontVariationSettings: "'opsz' 144, 'wght' 350, 'SOFT' 100" }}>${line}</em>`}</${React.Fragment}>`)}
          </h1>
          ${meta.subtitle ? html`<p style=${{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: 1.6, color: C.textMuted }}>${meta.subtitle}</p>` : null}
        </div>

        <div className="mcq-card" style=${{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style=${{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="display-font" style=${{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted }}>Progress</div>
            <div className="display-font" style=${{ fontSize: '1.5rem' }}>
              <span style=${{ color: C.accent }}>${totalAnswered}</span><span style=${{ color: C.textFaint }}> / ${ITEMS.length}</span>
            </div>
          </div>
          <div role="progressbar" aria-valuenow=${totalAnswered} aria-valuemin=${0} aria-valuemax=${ITEMS.length} aria-label="Questions answered"
               style=${{ height: '6px', width: '100%', borderRadius: '999px', overflow: 'hidden', backgroundColor: C.borderSoft }}>
            <div style=${{ height: '100%', width: progressPct + '%', backgroundColor: C.accent, transition: 'width 0.5s' }}></div>
          </div>
          ${totalAnswered > 0 ? html`
            <div style=${{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: C.textMuted }}>
              <${Check} size=${14} style=${{ color: C.correct }} />
              <span><span className="display-font" style=${{ color: C.correct, fontWeight: 500 }}>${totalCorrect}</span> correct on first attempt</span>
              <span style=${{ marginLeft: 'auto', fontSize: '0.78rem', color: C.textFaint }}>${Math.round((totalCorrect / Math.max(totalAnswered, 1)) * 100)}%</span>
            </div>` : null}
        </div>

        <div style=${{ marginBottom: dueCount > 0 ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="mcq-actions">
            <div style=${{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="mcq-btn mcq-btn--primary mcq-btn--flex" onClick=${onStart}>
                <${BookOpen} size=${16} />
                <span className="display-font" style=${{ letterSpacing: '0.02em', fontWeight: 500 }}>${totalAnswered > 0 ? 'Continue' : 'Begin'}</span>
              </button>
              <button className="mcq-btn" onClick=${() => { const r = ITEMS[Math.floor(Math.random() * ITEMS.length)]; if (r) onJump(r.id); }}>
                <${Shuffle} size=${16} />
                <span className="display-font" style=${{ letterSpacing: '0.02em', fontWeight: 500 }}>Random</span>
              </button>
            </div>
          </div>
          ${dueCount > 0 ? html`
            <button className="mcq-btn mcq-btn--block" onClick=${onReview} style=${{ borderColor: C.ochre, color: C.ochre }}>
              <${RotateCcw} size=${15} />
              <span className="display-font" style=${{ letterSpacing: '0.02em', fontWeight: 500 }}>Review due · ${dueCount}</span>
            </button>` : null}
        </div>
        ${dueCount > 0 ? html`<div style=${{ marginBottom: '2.5rem' }}></div>` : null}

        ${hasTaxonomy ? html`
          <div style=${{ marginBottom: '1.5rem' }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <${Layers} size=${14} style=${{ color: C.ochre }} />
              <span className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 500 }}>Explore by Domain</span>
            </div>
            <div style=${{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              ${Object.entries(DOMAINS).map(([dId, d]) => {
                const domainConcepts = conceptsByDomain[dId] || [];
                const expanded = domainFilter === dId;
                const ids = new Set();
                domainConcepts.forEach((c) => ITEMS.forEach((q) => { if (q.concepts.includes(c.id)) ids.add(q.id); }));
                const domainAnswered = [...ids].filter((id) => answers[id]).length;
                return html`
                  <div key=${dId} className="mcq-card" style=${{ overflow: 'hidden' }}>
                    <button onClick=${() => setDomainFilter(expanded ? null : dId)} aria-expanded=${expanded}
                            style=${{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', background: 'none', border: 'none', color: C.text }}>
                      <div style=${{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style=${{ width: '4px', height: '2.25rem', borderRadius: '999px', backgroundColor: d.color }}></div>
                        <div>
                          <div className="display-font" style=${{ fontSize: '1rem', letterSpacing: '0.01em', fontWeight: 500 }}>${d.label}</div>
                          <div style=${{ fontSize: '0.75rem', marginTop: '0.1rem', color: C.textFaint }}>
                            ${domainConcepts.length} concepts · ${ids.size} questions${domainAnswered > 0 ? ' · ' + domainAnswered + ' answered' : ''}
                          </div>
                        </div>
                      </div>
                      <${ChevronDown} size=${18} style=${{ color: C.textFaint, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    ${expanded ? html`
                      <div className="fade-up" style=${{ padding: '0.25rem 1rem 1rem' }}>
                        <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          ${domainConcepts.map((c) => {
                            const ct = conceptCounts[c.id] || { total: 0, answered: 0 };
                            const complete = ct.total > 0 && ct.answered === ct.total;
                            return html`
                              <button key=${c.id} className="mcq-chip" onClick=${() => onConceptClick(c.id)} style=${{ backgroundColor: d.hex, color: d.color }}>
                                ${c.label}
                                <span style=${{ color: C.textFaint, fontWeight: 400 }}>${ct.answered}/${ct.total}</span>
                                ${complete ? html`<${Check} size=${10} style=${{ color: C.correct }} />` : null}
                              </button>`;
                          })}
                        </div>
                      </div>` : null}
                  </div>`;
              })}
            </div>
          </div>` : null}

        <div style=${{ marginTop: '3rem', textAlign: 'center' }}>
          <div className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.textFaint }}>·  ·  ·</div>
        </div>
      </div>`;
  }

  /* =========================================================
     ITEM VIEW
     ========================================================= */
  function ItemView({ DOMAINS, CONCEPTS, ITEMS, item, answer, isCorrect, onSelect, revealed, onReveal, onGrade, showDetailed, setShowDetailed, onNext, onPrev, onRandom, onHome, currentIdx, total, globalTotal, conceptFilter, setConceptFilter, reviewMode, exitReview, filteredItems, relatedItems, onConceptClick, onRelatedClick, answeredSet, firstCorrect }) {
    if (!item) {
      return html`
        <div className="fade-up" style=${{ textAlign: 'center', padding: '3rem 0', color: C.textMuted }}>
          <p style=${{ marginBottom: '1.25rem' }}>Nothing to review right now — every due item is cleared.</p>
          <button className="mcq-btn" onClick=${() => { exitReview(); onHome(); }}><${Home} size=${14} /><span className="display-font">Menu</span></button>
        </div>`;
    }
    const answered = !!answer;
    const isRecall = item.type === 'recall';
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
            ${reviewMode ? html`<span style=${{ color: C.ochre }}>Review</span>` : null}
            ${item.difficulty ? html`<span style=${{ color: C.ochre }}>${item.difficulty}</span>` : null}
            ${conceptFilter ? html`<span>Filter · ${filterConcept ? filterConcept.label : conceptFilter}</span>` : html`<span>Question ${currentIdx + 1} of ${total}</span>`}
          </div>
        </div>

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
              return html`<button key=${cId} className="mcq-chip" onClick=${() => onConceptClick(cId)} style=${{ backgroundColor: d.hex, color: d.color }}>${c.label}</button>`;
            })}
          </div>` : null}

        <div className="mcq-card" style=${{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <p className="display-font" style=${{ fontSize: 'clamp(1.15rem,3.2vw,1.4rem)', lineHeight: 1.35, color: C.text, fontVariationSettings: "'opsz' 100, 'wght' 400" }}>${item.stem}</p>

          ${!isRecall ? html`
            <div role="radiogroup" aria-label="Answer options" style=${{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              ${item.options.length ? item.options.map((opt) => {
                const isSelected = answer === opt.id;
                const isCorrectOption = opt.id === item.correct;
                const showAsCorrect = answered && isCorrectOption;
                const showAsIncorrect = answered && isSelected && !isCorrectOption;
                let bg = C.surface, bd = C.border, tc = C.text, lc = C.borderSoft;
                if (showAsCorrect) { bg = C.correctBg; bd = C.correct; lc = C.correct; }
                else if (showAsIncorrect) { bg = C.incorrectBg; bd = C.incorrect; lc = C.incorrect; }
                else if (answered) { bg = C.bg; tc = C.textMuted; }
                return html`
                  <button key=${opt.id} role="radio" aria-checked=${isSelected} onClick=${() => onSelect(opt.id)} disabled=${answered}
                          style=${{ width: '100%', textAlign: 'left', padding: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: bg, border: '1px solid ' + bd, borderLeft: '3px solid ' + lc, color: tc, cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <div className="display-font" style=${{ fontSize: '0.85rem', flexShrink: 0, width: '1.25rem', color: showAsCorrect ? C.correct : showAsIncorrect ? C.incorrect : C.ochre, fontWeight: 600 }}>${String(opt.id).toUpperCase()}</div>
                    <div style=${{ flex: 1, lineHeight: 1.4, fontSize: '15px' }}>${opt.text}</div>
                    ${showAsCorrect ? html`<${Check} size=${16} style=${{ color: C.correct, flexShrink: 0, marginTop: '2px' }} />` : null}
                    ${showAsIncorrect ? html`<${X} size=${16} style=${{ color: C.incorrect, flexShrink: 0, marginTop: '2px' }} />` : null}
                  </button>`;
              }) : html`<p style=${{ color: C.textFaint, fontStyle: 'italic', fontSize: '0.9rem' }}>No options provided for this question.</p>`}
            </div>` : null}

          ${isRecall ? html`
            <div style=${{ marginTop: '1.5rem' }}>
              ${!revealed && !answered ? html`
                <button className="mcq-btn mcq-btn--primary mcq-btn--block" onClick=${onReveal}>
                  <${Eye} size=${15} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Reveal answer</span>
                </button>` : html`
                <div className="fade-up">
                  <div className="display-font" style=${{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', color: C.ochre, fontWeight: 600 }}>Answer</div>
                  <div style=${{ padding: '1rem', borderRadius: '10px', lineHeight: 1.6, backgroundColor: C.bg, border: '1px solid ' + C.borderSoft, borderLeft: '3px solid ' + C.ochre, color: C.text, fontSize: '16px' }}>${item.answer || ''}</div>
                  ${!answered ? html`
                    <div style=${{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button className="mcq-btn mcq-btn--flex" onClick=${() => onGrade(false)} style=${{ backgroundColor: C.incorrectBg, borderColor: C.incorrect, color: C.incorrect }}><${X} size=${15} /><span className="display-font" style=${{ fontWeight: 600, fontSize: '0.9rem' }}>Missed</span></button>
                      <button className="mcq-btn mcq-btn--flex" onClick=${() => onGrade(true)} style=${{ backgroundColor: C.correctBg, borderColor: C.correct, color: C.correct }}><${Check} size=${15} /><span className="display-font" style=${{ fontWeight: 600, fontSize: '0.9rem' }}>Got it</span></button>
                    </div>` : null}
                </div>`}
            </div>` : null}
        </div>

        ${answered ? html`
          <div className="fade-up" aria-live="polite" style=${{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style=${{ padding: '1.25rem', borderRadius: '14px', backgroundColor: isCorrect ? C.correctBg : C.incorrectBg, border: '1px solid ' + (isCorrect ? C.correct : C.incorrect) }}>
              <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                ${isCorrect
                  ? html`<${React.Fragment}><${Check} size=${16} style=${{ color: C.correct }} /><span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.correct, fontWeight: 600 }}>${isRecall ? 'Got It' : 'Correct'}</span></${React.Fragment}>`
                  : html`<${React.Fragment}><${X} size=${16} style=${{ color: C.incorrect }} /><span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.incorrect, fontWeight: 600 }}>${isRecall ? 'Missed' : 'Not Quite'}</span>${!isRecall ? html`<span style=${{ fontSize: '0.75rem', marginLeft: '0.25rem', color: C.textMuted }}>· Answer: ${item.correct ? String(item.correct).toUpperCase() : '—'}</span>` : null}</${React.Fragment}>`}
              </div>
              <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '15.5px' }}>${item.brief || ''}</p>
              ${item.reference ? html`<p className="ui-font" style=${{ marginTop: '0.6rem', fontSize: '0.72rem', color: C.textFaint }}>${item.reference}</p>` : null}
            </div>

            ${item.detailed ? html`
              <button className="mcq-btn mcq-btn--block" onClick=${() => setShowDetailed(!showDetailed)} style=${{ justifyContent: 'space-between' }}>
                <span style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><${Sparkles} size=${14} style=${{ color: C.ochre }} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>${showDetailed ? 'Hide detailed explanation' : 'Read detailed explanation'}</span></span>
                <${ChevronDown} size=${16} style=${{ color: C.textMuted, transform: showDetailed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>` : null}
            ${item.detailed && showDetailed ? html`
              <div className="mcq-card fade-up" style=${{ padding: '1.25rem' }}>
                <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '16px' }}>${item.detailed}</p>
              </div>` : null}

            ${relatedItems.length ? html`
              <div className="mcq-card" style=${{ padding: '1.25rem' }}>
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
                          ${isAns ? (wc ? html`<${Check} size=${11} style=${{ color: C.correct }} />` : html`<${X} size=${11} style=${{ color: C.incorrect }} />`) : null}
                        </div>
                        <div style=${{ flex: 1, lineHeight: 1.4, fontSize: '14.5px' }}>${q.stem}</div>
                        <${ArrowRight} size=${14} style=${{ color: C.textFaint, flexShrink: 0, marginTop: '0.25rem' }} />
                      </button>`;
                  })}
                </div>
              </div>` : null}
          </div>` : null}

        <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="mcq-btn mcq-btn--flex" onClick=${onPrev}><${ChevronLeft} size=${16} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Prev</span></button>
          <button className="mcq-btn" onClick=${onRandom} title="Random" aria-label="Random question"><${Shuffle} size=${16} style=${{ color: C.textMuted }} /></button>
          <button className="mcq-btn mcq-btn--primary mcq-btn--flex" onClick=${onNext}><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>${answered ? 'Next' : 'Skip'}</span><${ChevronRight} size=${16} /></button>
        </div>

        <div className="mcq-dotrow" aria-hidden="true">
          ${Array.from({ length: total }, (_, i) => {
            const q = filteredItems[i];
            if (!q) return null;
            const isCurrent = i === currentIdx;
            const isAns = answeredSet.includes(q.id);
            const wc = firstCorrect[q.id];
            let dot = C.borderSoft;
            if (isAns) dot = wc ? C.correct : C.incorrect;
            return html`<div key=${q.id} className="mcq-dot" style=${{ width: isCurrent ? '18px' : '5px', backgroundColor: isCurrent ? C.accent : dot, opacity: isCurrent ? 1 : isAns ? 0.7 : 0.4 }}></div>`;
          })}
        </div>
      </div>`;
  }

  /* ---- Mount ---- */
  window.mountMCQ = function (rootEl, module, entry) {
    ReactDOM.createRoot(rootEl).render(html`<${StudyViewer} module=${module} entry=${entry} />`);
  };
})();
