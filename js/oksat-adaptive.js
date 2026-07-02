/* =============================================================
   OKSAT adaptive practice — window.mountOKSATAdaptive
   (OHNS Knowledge Self-Assessment Tool.)
   Runtime, one-at-a-time question generation via Gemini
   (window.OKSATAI), rendered with the study engine's look.
   React (UMD) + htm (no in-browser Babel, no build step).

   Depends on window globals — all guarded defensively:
     OKSATAI       — generateItem / normalizeGeneratedItem /
                     gradeFreeResponse / hasKey / getModel
     OKSAT_TAXONOMY, OKSAT_SUBSPECIALTIES
     OKSATStore    — adaptive state, confidence, stars, sessions
     OKSATAtlas    — loadModules() for hybrid grounding (optional)

   Adaptive state lives ONLY in oksat:adaptive:* (transient
   generated items never touch oksat:srs:* / oksat:progress:*).
   ============================================================= */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const html = htm.bind(React.createElement);

  /* Palette → CSS variables (theme-reactive; verbatim from oksat-engine.js) */
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

  const Home = makeIcon(['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10']);
  const Check = makeIcon(['M20 6 9 17l-5-5']);
  const X = makeIcon(['M18 6 6 18', 'm6 6 12 12']);
  const ChevronRight = makeIcon(['m9 18 6-6-6-6']);
  const ChevronDown = makeIcon(['m6 9 6 6 6-6']);
  const Sparkles = makeIcon(['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z', 'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3']);
  const RotateCcw = makeIcon(['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']);
  const ArrowRight = makeIcon(['M5 12h14', 'm12 5 7 7-7 7']);
  const Layers = makeIcon(['M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z', 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12', 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17']);
  const Zap = makeIcon(['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']);
  const Target = makeIcon(['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z']);
  const Shuffle = makeIcon(['M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22', 'm18 2 4 4-4 4', 'M2 6h1.9c1.5 0 2.9.9 3.6 2.2', 'M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8', 'm18 14 4 4-4 4']);

  /* Render free-text fields, honoring `\n` as a line break. */
  const renderText = (s) => {
    const str = s == null ? '' : String(s);
    if (str.indexOf('\n') === -1) return str;
    return str.split('\n').map((ln, i) =>
      React.createElement(React.Fragment, { key: i }, i ? React.createElement('br') : null, ln));
  };

  /* Reviewer code → storage namespace (mirrors the engine). */
  const normCode = (c) => String(c || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';

  /* Difficulty band → starting level. */
  const BAND_LEVEL = { foundational: 1, core: 2, advanced: 3 };

  /* Recall self-grade tiers (fallback when gradeFreeResponse rejects). */
  const RECALL_GRADES = [
    { id: 'unknown', label: "Didn't know", correct: false, color: 'incorrect' },
    { id: 'guessed', label: 'Guessed', correct: false, color: 'ochre' },
    { id: 'partial', label: 'Got it partially', correct: true, color: 'accent' },
    { id: 'cold', label: 'Knew it cold', correct: true, color: 'correct' },
  ];

  /* =========================================================
     CONFIDENCE PROMPT (mcq, post-answer; skippable; 3s auto-skip)
     Mirrors the study engine's ConfidencePrompt.
     ========================================================= */
  const CONF_TIERS = [
    { id: 'hi', label: 'Confident', color: 'correct' },
    { id: 'md', label: 'Unsure', color: 'ochre' },
    { id: 'lo', label: 'Guessing', color: 'incorrect' },
  ];
  function ConfidencePrompt({ onPick, onSkip }) {
    useEffect(() => {
      const t = setTimeout(() => { onSkip(); }, 3000);
      return () => clearTimeout(t);
    }, []);
    return html`
      <div className="ok-confrow fade-up" role="group" aria-label="How confident were you?">
        <span className="ui-font ok-confrow__label">How sure?</span>
        ${CONF_TIERS.map((t, i) => html`
          <button key=${t.id} type="button" className="ok-confrow__pill" onClick=${() => onPick(t.id)}
                  style=${{ borderColor: C[t.color], color: C[t.color] }}>
            <span className="ok-confrow__num">${i + 1}</span>${t.label}
          </button>`)}
        <button type="button" className="ok-confrow__skip ui-font" onClick=${onSkip}>skip</button>
      </div>`;
  }

  /* =========================================================
     LOADING SKELETON — visible even without the .ok-skel CSS.
     ========================================================= */
  function LoadingCard() {
    const base = { background: C.borderSoft, borderRadius: '10px' };
    return html`
      <div className="ok-card fade-up" style=${{ padding: '1.5rem' }} aria-busy="true" aria-label="Generating question">
        <div className="ok-skel ok-skel--line" style=${{ ...base, height: '1.4rem', width: '90%', borderRadius: '6px', marginBottom: '0.6rem' }}></div>
        <div className="ok-skel ok-skel--line" style=${{ ...base, height: '1.4rem', width: '62%', borderRadius: '6px', marginBottom: '1.6rem' }}></div>
        ${[0, 1, 2, 3].map((i) => html`
          <div key=${i} className="ok-skel ok-skel--line" style=${{ ...base, height: '2.75rem', width: '100%', marginBottom: '0.5rem' }}></div>`)}
      </div>`;
  }

  /* =========================================================
     ERROR VIEW — generic card + Retry.
     ========================================================= */
  function ErrorView({ message, onRetry, onMenu }) {
    return html`
      <div className="ok-card fade-up" style=${{ padding: '1.5rem' }}>
        <div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.incorrect, fontWeight: 600, marginBottom: '0.6rem' }}>Generation failed</div>
        <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '15px', marginBottom: '1.25rem' }}>${renderText(message || 'Something went wrong while generating a question.')}</p>
        <div style=${{ display: 'flex', gap: '0.5rem' }}>
          <button className="ok-btn ok-btn--primary ok-btn--flex" onClick=${onRetry}>
            <${RotateCcw} size=${15} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Retry</span>
          </button>
          <button className="ok-btn" onClick=${onMenu}>
            <${Home} size=${14} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Menu</span>
          </button>
        </div>
      </div>`;
  }

  /* =========================================================
     SETUP VIEW — mode picker.
     ========================================================= */
  function SetupView({ onStartTopic, onStartMode, onStarred, starCount }) {
    const taxonomy = window.OKSAT_TAXONOMY || { topics: [] };
    const subs = window.OKSAT_SUBSPECIALTIES || {};
    const topics = Array.isArray(taxonomy.topics) ? taxonomy.topics : [];
    const [sel, setSel] = useState(topics[0] ? topics[0].id : '');

    const grouped = useMemo(() => {
      const g = {};
      topics.forEach((t) => { (g[t.subspecialty] = g[t.subspecialty] || []).push(t); });
      return g;
    }, [topics]);

    const modeCards = [
      { id: 'gap', icon: Layers, title: 'Gap filler', desc: 'Weighted-random topic the site has no module for yet — priority and low practice float to the top.' },
      { id: 'mixed', icon: Shuffle, title: 'Mixed review', desc: 'Alternates a weak concept from a built module (grounded in its explanations) with a gap topic.' },
      { id: 'stress', icon: Zap, title: 'Stress test', desc: 'Forces level 4+ and biases toward free-response synthesis. For when you want to be humbled.' },
    ];

    return html`
      <div className="fade-up">
        <div style=${{ marginBottom: '2rem' }}>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: C.ochre }}>
            <div style=${{ height: '1px', flex: 1, backgroundColor: C.border }}></div>
            <span className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 500 }}>OKSAT · Adaptive Practice</span>
            <div style=${{ height: '1px', flex: 1, backgroundColor: C.border }}></div>
          </div>
          <h1 className="display-font" style=${{ fontSize: 'clamp(2.2rem,7vw,3rem)', fontWeight: 300, lineHeight: 1.12, color: C.text, fontVariationSettings: "'opsz' 144, 'wght' 400, 'SOFT' 50" }}>
            Generate as you<br/><em style=${{ fontVariationSettings: "'opsz' 144, 'wght' 350, 'SOFT' 100" }}>go</em>
          </h1>
          <p style=${{ marginTop: '0.75rem', fontSize: '1rem', lineHeight: 1.6, color: C.textMuted }}>
            One board-style item at a time, written live by Gemini and adapted to how you answer. Nothing here is pre-baked.
          </p>
        </div>

        ${starCount > 0 ? html`
          <button className="ok-btn ok-btn--block" onClick=${onStarred} style=${{ marginBottom: '1.5rem', borderColor: C.ochre, color: C.ochre, justifyContent: 'center' }}>
            <span style=${{ color: C.ochre }}>★</span>
            <span className="display-font" style=${{ fontWeight: 500 }}>Starred · ${starCount}</span>
          </button>` : null}

        <div className="ok-card" style=${{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <${Target} size=${16} style=${{ color: C.accent }} />
            <span className="display-font" style=${{ fontSize: '1rem', fontWeight: 500 }}>Topic drill</span>
          </div>
          <p style=${{ fontSize: '0.9rem', lineHeight: 1.55, color: C.textMuted, marginBottom: '0.85rem' }}>
            Lock onto one topic and let difficulty climb or ease as you go.
          </p>
          <select value=${sel} onChange=${(e) => setSel(e.target.value)}
                  style=${{ width: '100%', padding: '0.7rem 0.75rem', borderRadius: '10px', border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: '15px', marginBottom: '0.85rem' }}>
            ${Object.keys(grouped).map((subKey) => html`
              <optgroup key=${subKey} label=${(subs[subKey] && subs[subKey].label) || subKey}>
                ${grouped[subKey].map((t) => html`
                  <option key=${t.id} value=${t.id}>${t.label}${t.moduleId ? '' : ' · adaptive'}</option>`)}
              </optgroup>`)}
          </select>
          <button className="ok-btn ok-btn--primary ok-btn--block" onClick=${() => sel && onStartTopic(sel)} disabled=${!sel} style=${{ justifyContent: 'center' }}>
            <span className="display-font" style=${{ fontWeight: 500 }}>Start topic drill</span><${ChevronRight} size=${16} />
          </button>
        </div>

        <div style=${{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          ${modeCards.map((m) => html`
            <button key=${m.id} className="ok-card" onClick=${() => onStartMode(m.id)}
                    style=${{ padding: '1.1rem 1.25rem', textAlign: 'left', cursor: 'pointer', border: '1px solid ' + C.border, background: C.surface, color: C.text }}>
              <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <${m.icon} size=${16} style=${{ color: C.ochre }} />
                <span className="display-font" style=${{ fontSize: '1rem', fontWeight: 500 }}>${m.title}</span>
                <${ChevronRight} size=${16} style=${{ color: C.textFaint, marginLeft: 'auto' }} />
              </div>
              <p style=${{ fontSize: '0.88rem', lineHeight: 1.5, color: C.textMuted }}>${m.desc}</p>
            </button>`)}
        </div>

        <div style=${{ marginTop: '2.5rem', textAlign: 'center' }}>
          <div className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.textFaint }}>·  ·  ·</div>
        </div>
      </div>`;
  }

  /* =========================================================
     STARRED VIEW
     ========================================================= */
  function StarredView({ reviewer, onBack, onChanged }) {
    const [items, setItems] = useState(() => {
      try { return (OKSATStore.getStarred(reviewer).items || []).slice(); } catch (e) { return []; }
    });
    const unstar = (id) => {
      try { OKSATStore.removeStar(reviewer, id); } catch (e) {}
      setItems((prev) => prev.filter((x) => x && x.id !== id));
      if (onChanged) onChanged();
    };
    return html`
      <div className="fade-up">
        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <button onClick=${onBack} style=${{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
            <${Home} size=${14} /><span className="display-font" style=${{ fontWeight: 500 }}>Back</span>
          </button>
          <span className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textFaint }}>Starred · ${items.length}</span>
        </div>

        ${items.length === 0 ? html`
          <div className="ok-card" style=${{ padding: '2rem', textAlign: 'center', color: C.textMuted }}>
            <p>No starred questions yet. Tap the star on any answered item to keep it.</p>
          </div>` : html`
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
            ${items.map((it) => html`
              <div key=${it.id} className="ok-card" style=${{ padding: '0.9rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style=${{ flex: 1 }}>
                  ${it.section ? html`<span className="ok-chip" style=${{ backgroundColor: C.accentSoft, color: C.accent, marginBottom: '0.4rem', display: 'inline-flex' }}>${it.section}</span>` : null}
                  <div style=${{ fontSize: '14.5px', lineHeight: 1.45, color: C.text }}>
                    ${String(it.stem || '').slice(0, 160)}${String(it.stem || '').length > 160 ? '…' : ''}
                  </div>
                </div>
                <button onClick=${() => unstar(it.id)} aria-label="Remove star" title="Remove"
                        style=${{ background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', flexShrink: 0 }}>
                  <${X} size=${16} />
                </button>
              </div>`)}
          </div>`}

        <button className="ok-btn ok-btn--block" onClick=${() => { window.location.href = 'oksat-generate.html?from=starred'; }} style=${{ justifyContent: 'center', borderColor: C.ochre, color: C.ochre }}>
          <${ArrowRight} size=${15} /><span className="display-font" style=${{ fontWeight: 500 }}>Export as module draft</span>
        </button>
      </div>`;
  }

  /* =========================================================
     QUIZ ITEM — one normalized item; owns its answer/grade/star
     state, remounted per item via React key.
     ========================================================= */
  function QuizItem({ item, reviewer, sessionN, onResult, onNext, onStarChange }) {
    const isRecall = item.type === 'recall';

    // mcq state
    const [chosenId, setChosenId] = useState(null);
    const [confPending, setConfPending] = useState(false);
    // recall state
    const [userAnswer, setUserAnswer] = useState('');
    const [grading, setGrading] = useState(false);
    const [selfMode, setSelfMode] = useState(false);
    const [verdict, setVerdict] = useState(null); // { verdict, feedback }
    // shared
    const [answered, setAnswered] = useState(false);
    const [showDetailed, setShowDetailed] = useState(false);
    const [starred, setStarred] = useState(() => {
      try { return (OKSATStore.getStarred(reviewer).items || []).some((x) => x && x.id === item.id); } catch (e) { return false; }
    });
    const [starMsg, setStarMsg] = useState('');

    const finalize = (correct) => { try { onResult(!!correct); } catch (e) {} };

    /* ---- mcq answering ---- */
    const selectOption = (optId) => {
      if (answered) return;
      const correct = optId === item.correct;
      setChosenId(optId);
      setAnswered(true);
      setConfPending(true);
      finalize(correct);
    };
    const recordConf = (tier) => {
      try {
        OKSATStore.recordConfidence('adaptive', reviewer, item.id, tier, chosenId === item.correct, item.concepts || [], sessionN);
      } catch (e) {}
      setConfPending(false);
    };

    /* ---- recall answering ---- */
    const submitRecall = () => {
      if (!userAnswer.trim() || grading || answered) return;
      if (!window.OKSATAI || typeof OKSATAI.gradeFreeResponse !== 'function') {
        setSelfMode(true);
        return;
      }
      setGrading(true);
      OKSATAI.gradeFreeResponse({ stem: item.stem, modelAnswer: item.answer, userAnswer })
        .then((res) => {
          const v = (res && res.verdict) || 'partial';
          setVerdict({ verdict: v, feedback: (res && res.feedback) || '' });
          setAnswered(true);
          setGrading(false);
          finalize(v !== 'incorrect');
        })
        .catch(() => {
          // Fall back to reveal + self-grade. Never dead-end.
          setGrading(false);
          setSelfMode(true);
        });
    };
    const selfGrade = (g) => {
      if (answered) return;
      setVerdict({ verdict: g.correct ? 'correct' : 'incorrect', feedback: '' });
      setAnswered(true);
      finalize(g.correct);
    };

    /* ---- star toggle ---- */
    const toggleStar = () => {
      setStarMsg('');
      try {
        if (starred) { OKSATStore.removeStar(reviewer, item.id); setStarred(false); }
        else {
          const r = OKSATStore.addStar(reviewer, item);
          if (r && r.ok) setStarred(true);
          else if (r && r.reason === 'cap') setStarMsg('Starred set full (100)');
        }
      } catch (e) {}
      if (onStarChange) onStarChange();
    };

    const mcqCorrect = chosenId === item.correct;
    const recallVerdict = verdict ? verdict.verdict : null;
    const verdictColor = recallVerdict === 'correct' ? C.correct : recallVerdict === 'partial' ? C.ochre : C.incorrect;
    const verdictBg = recallVerdict === 'correct' ? C.correctBg : recallVerdict === 'partial' ? C.accentSoft : C.incorrectBg;

    const StarButton = () => html`
      <div style=${{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button onClick=${toggleStar} aria-label=${starred ? 'Unstar' : 'Star'} title=${starred ? 'Starred' : 'Star this question'}
                style=${{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, color: C.ochre }}>
          ${starred ? '★' : '☆'}
        </button>
        ${starMsg ? html`<span className="ui-font" style=${{ fontSize: '0.72rem', color: C.incorrect }}>${starMsg}</span>` : null}
      </div>`;

    return html`
      <div className="fade-up">
        ${item.section ? html`<div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.textFaint, marginBottom: '0.5rem' }}>${item.section}</div>` : null}

        <div className="ok-card" style=${{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <p className="display-font" style=${{ fontSize: 'clamp(1.15rem,3.2vw,1.4rem)', lineHeight: 1.35, color: C.text, fontVariationSettings: "'opsz' 100, 'wght' 400" }}>${renderText(item.stem)}</p>

          ${!isRecall ? html`
            <div role="radiogroup" aria-label="Answer options" style=${{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              ${(item.options || []).map((opt) => {
                const isSelected = chosenId === opt.id;
                const isCorrectOption = opt.id === item.correct;
                const showAsCorrect = answered && isCorrectOption;
                const showAsIncorrect = answered && isSelected && !isCorrectOption;
                let bg = C.surface, bd = C.border, tc = C.text, lc = C.borderSoft;
                if (showAsCorrect) { bg = C.correctBg; bd = C.correct; lc = C.correct; }
                else if (showAsIncorrect) { bg = C.incorrectBg; bd = C.incorrect; lc = C.incorrect; }
                else if (answered) { bg = C.bg; tc = C.textMuted; }
                return html`
                  <button key=${opt.id} role="radio" aria-checked=${isSelected} onClick=${() => selectOption(opt.id)} disabled=${answered}
                          style=${{ width: '100%', textAlign: 'left', padding: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: bg, border: '1px solid ' + bd, borderLeft: '3px solid ' + lc, color: tc, cursor: answered ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                    <div className="display-font" style=${{ fontSize: '0.85rem', flexShrink: 0, width: '1.25rem', color: showAsCorrect ? C.correct : showAsIncorrect ? C.incorrect : C.ochre, fontWeight: 600 }}>${String(opt.id).toUpperCase()}</div>
                    <div style=${{ flex: 1, lineHeight: 1.4, fontSize: '15px' }}>${opt.text}</div>
                    ${showAsCorrect ? html`<${Check} size=${16} style=${{ color: C.correct, flexShrink: 0, marginTop: '2px' }} />` : null}
                    ${showAsIncorrect ? html`<${X} size=${16} style=${{ color: C.incorrect, flexShrink: 0, marginTop: '2px' }} />` : null}
                  </button>`;
              })}
            </div>` : null}

          ${isRecall ? html`
            <div style=${{ marginTop: '1.5rem' }}>
              ${!answered && !selfMode ? html`
                <textarea value=${userAnswer} onChange=${(e) => setUserAnswer(e.target.value)} disabled=${grading}
                          placeholder="Type your answer — synthesis, thresholds, or a plan."
                          rows=${4}
                          style=${{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid ' + C.border, background: C.bg, color: C.text, fontSize: '15px', lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' }}></textarea>
                <button className="ok-btn ok-btn--primary ok-btn--block" onClick=${submitRecall} disabled=${grading || !userAnswer.trim()} style=${{ marginTop: '0.75rem', justifyContent: 'center' }}>
                  ${grading
                    ? html`<span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Grading…</span>`
                    : html`<${Sparkles} size=${15} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Submit for grading</span>`}
                </button>` : null}

              ${selfMode && !answered ? html`
                <div className="fade-up">
                  <div className="display-font" style=${{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem', color: C.ochre, fontWeight: 600 }}>Model answer</div>
                  <div style=${{ padding: '1rem', borderRadius: '10px', lineHeight: 1.6, backgroundColor: C.bg, border: '1px solid ' + C.borderSoft, borderLeft: '3px solid ' + C.ochre, color: C.text, fontSize: '16px' }}>${renderText(item.answer)}</div>
                  <div style=${{ marginTop: '0.85rem' }}>
                    <div className="display-font" style=${{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textFaint, marginBottom: '0.45rem' }}>Auto-grading was unavailable — grade yourself.</div>
                    <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      ${RECALL_GRADES.map((g, i) => html`
                        <button key=${g.id} className="ok-btn" onClick=${() => selfGrade(g)} style=${{ justifyContent: 'flex-start', gap: '0.5rem', borderColor: C[g.color], color: C[g.color] }}>
                          <span className="display-font" style=${{ fontSize: '0.7rem', opacity: 0.6 }}>${i + 1}</span>
                          <span className="display-font" style=${{ fontWeight: 600, fontSize: '0.85rem' }}>${g.label}</span>
                        </button>`)}
                    </div>
                  </div>
                </div>` : null}
            </div>` : null}
        </div>

        ${answered ? html`
          <div className="fade-up" aria-live="polite" style=${{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            ${!isRecall && confPending ? html`<${ConfidencePrompt} onPick=${recordConf} onSkip=${() => setConfPending(false)} />` : null}

            ${!isRecall ? html`
              <div style=${{ padding: '1.25rem', borderRadius: '14px', backgroundColor: mcqCorrect ? C.correctBg : C.incorrectBg, border: '1px solid ' + (mcqCorrect ? C.correct : C.incorrect) }}>
                <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <${mcqCorrect ? Check : X} size=${16} style=${{ color: mcqCorrect ? C.correct : C.incorrect }} />
                  <span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: mcqCorrect ? C.correct : C.incorrect, fontWeight: 600 }}>${mcqCorrect ? 'Correct' : 'Not Quite'}</span>
                  ${!mcqCorrect ? html`<span style=${{ fontSize: '0.75rem', marginLeft: '0.25rem', color: C.textMuted }}>· Answer: ${item.correct ? String(item.correct).toUpperCase() : '—'}</span>` : null}
                </div>
                ${!mcqCorrect && item.distractorNotes && chosenId && item.distractorNotes[chosenId] ? html`
                  <div style=${{ marginBottom: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '10px', backgroundColor: C.bg, border: '1px solid ' + C.borderSoft, borderLeft: '3px solid ' + C.incorrect }}>
                    <div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.incorrect, fontWeight: 600, marginBottom: '0.3rem' }}>Your distractor · ${String(chosenId).toUpperCase()}</div>
                    <p style=${{ lineHeight: 1.55, color: C.text, fontSize: '14.5px' }}>${renderText(item.distractorNotes[chosenId])}</p>
                  </div>` : null}
                ${item.brief ? html`<p style=${{ lineHeight: 1.6, color: C.text, fontSize: '15.5px' }}>${renderText(item.brief)}</p>` : null}
              </div>` : html`
              <div style=${{ padding: '1.25rem', borderRadius: '14px', backgroundColor: verdictBg, border: '1px solid ' + verdictColor }}>
                <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <${recallVerdict === 'incorrect' ? X : Check} size=${16} style=${{ color: verdictColor }} />
                  <span className="display-font" style=${{ fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: verdictColor, fontWeight: 600 }}>${recallVerdict === 'correct' ? 'Correct' : recallVerdict === 'partial' ? 'Partial' : 'Incorrect'}</span>
                </div>
                ${verdict && verdict.feedback ? html`<p style=${{ lineHeight: 1.6, color: C.text, fontSize: '15.5px', marginBottom: '0.75rem' }}>${renderText(verdict.feedback)}</p>` : null}
                <div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textFaint, marginBottom: '0.3rem' }}>Model answer</div>
                <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '15.5px' }}>${renderText(item.answer)}</p>
                ${item.brief ? html`<p style=${{ lineHeight: 1.6, color: C.textMuted, fontSize: '14.5px', marginTop: '0.6rem' }}>${renderText(item.brief)}</p>` : null}
              </div>`}

            ${item.detailed ? html`
              <button className="ok-btn ok-btn--block" onClick=${() => setShowDetailed(!showDetailed)} style=${{ justifyContent: 'space-between' }}>
                <span style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><${Sparkles} size=${14} style=${{ color: C.ochre }} /><span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>${showDetailed ? 'Hide detailed explanation' : 'Read detailed explanation'}</span></span>
                <${ChevronDown} size=${16} style=${{ color: C.textMuted, transform: showDetailed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>` : null}
            ${item.detailed && showDetailed ? html`
              <div className="ok-card fade-up" style=${{ padding: '1.25rem' }}>
                <p style=${{ lineHeight: 1.6, color: C.text, fontSize: '16px' }}>${renderText(item.detailed)}</p>
              </div>` : null}

            <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <${StarButton} />
              <button className="ok-btn ok-btn--primary" onClick=${onNext}>
                <span className="display-font" style=${{ fontWeight: 500, fontSize: '0.9rem' }}>Next</span><${ChevronRight} size=${16} />
              </button>
            </div>
          </div>` : null}
      </div>`;
  }

  /* =========================================================
     ROOT — AdaptiveQuiz
     ========================================================= */
  function AdaptiveQuiz({ topicId, mode, code }) {
    const reviewer = normCode(code);
    const hasKey = !!(window.OKSATAI && typeof OKSATAI.hasKey === 'function' && OKSATAI.hasKey());

    const [view, setView] = useState('setup'); // 'setup' | 'quiz' | 'starred'
    const [topic, setTopic] = useState(null);   // { id, label, subspecialty, difficultyBand }
    const [level, setLevel] = useState(2);
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [starCount, setStarCount] = useState(() => {
      try { return (OKSATStore.getStarred(reviewer).items || []).length; } catch (e) { return 0; }
    });

    const modeRef = useRef(mode || 'gap');
    const lockedRef = useRef(topicId || null);
    const seqRef = useRef(0);
    const avoidRef = useRef([]);
    const mixedTurnRef = useRef(0);
    const sessionRef = useRef(0);
    const busyRef = useRef(false);

    const refreshStars = () => {
      try { setStarCount((OKSATStore.getStarred(reviewer).items || []).length); } catch (e) {}
    };

    /* ---- level helpers (seed from difficulty band on first sight) ---- */
    const findTopic = (id) => {
      const topics = (window.OKSAT_TAXONOMY && window.OKSAT_TAXONOMY.topics) || [];
      return topics.find((t) => t.id === id) || null;
    };
    const topicObj = (t) => ({ id: t.id, label: t.label, subspecialty: t.subspecialty, difficultyBand: t.difficultyBand || 'core' });
    const levelForTopic = (id, band) => {
      const base = BAND_LEVEL[band] || 2;
      try {
        const rec = (OKSATStore.getAdaptive(reviewer).topics || {})[id];
        if (rec && rec.level) return rec.level;
        OKSATStore.setAdaptiveLevel(reviewer, id, base); // seed band level pre-attempt
      } catch (e) {}
      return base;
    };

    /* ---- controller: record + adapt ---- */
    const adjustLevel = (tid) => {
      try {
        const rec = (OKSATStore.getAdaptive(reviewer).topics || {})[tid];
        if (!rec) return;
        const recent = (rec.recent || []).slice(-6);
        const n = recent.length;
        const acc = n ? recent.reduce((a, b) => a + b, 0) / n : 0;
        let lvl = rec.level || 2;
        if (n >= 4 && acc >= 0.8) lvl = Math.min(lvl + 1, 5);
        else if (n >= 3 && acc <= 0.4) lvl = Math.max(lvl - 1, 1);
        OKSATStore.setAdaptiveLevel(reviewer, tid, lvl);
      } catch (e) {}
    };
    const recordResult = (tid, correct) => {
      try { OKSATStore.recordAdaptive(reviewer, tid, correct); OKSATStore.touchSession(reviewer); } catch (e) {}
    };
    const onResult = (correct) => {
      const tid = topic && topic.id;
      if (!tid) return;
      recordResult(tid, correct);
      adjustLevel(tid);
      try { const a = (OKSATStore.getAdaptive(reviewer).topics || {})[tid]; if (a && a.level) setLevel(a.level); } catch (e) {}
    };

    /* ---- controller: grounding (optional; guarded) ---- */
    const buildGrounding = async (slug, targetConcept) => {
      try {
        if (!window.OKSATAtlas || typeof OKSATAtlas.loadModules !== 'function') return null;
        const mods = await OKSATAtlas.loadModules();
        const mod = mods && mods[slug];
        if (!mod || !Array.isArray(mod.ITEMS)) return null;
        const CONCEPTS = mod.CONCEPTS || {};
        let pool = mod.ITEMS.filter((it) => Array.isArray(it.concepts) && targetConcept && it.concepts.includes(targetConcept));
        if (!pool.length) pool = mod.ITEMS; // weakest-first fallback: use what we have
        let out = '';
        for (let i = 0; i < pool.length; i++) {
          const it = pool[i];
          const body = it.detailed || it.brief || '';
          if (!body) continue;
          const cId = (it.concepts && it.concepts[0]) || null;
          const label = (cId && CONCEPTS[cId] && CONCEPTS[cId].label) || '';
          out += (label ? '[' + label + '] ' : '') + body + '\n\n';
          if (out.length > 6000) break;
        }
        out = out.slice(0, 6000).trim();
        return out || null;
      } catch (e) { return null; }
    };

    /* ---- controller: pick a weak BUILT-module concept for mixed review ---- */
    const tryBuiltTarget = async () => {
      try {
        if (!window.OKSATAtlas || typeof OKSATAtlas.loadModules !== 'function') return null;
        const mods = await OKSATAtlas.loadModules();
        if (!mods) return null;
        const slugs = Object.keys(mods);
        if (!slugs.length) return null;
        let best = null;
        slugs.forEach((slug) => {
          const mod = mods[slug];
          if (!mod || !mod.CONCEPTS) return;
          let cm = {};
          try { cm = (OKSATStore.getConceptMastery(slug, reviewer).concepts) || {}; } catch (e) {}
          Object.keys(mod.CONCEPTS).forEach((cId) => {
            const box = cm[cId] ? cm[cId].box : 1;
            if (!best || box < best.box) best = { slug, cId, box, mod };
          });
        });
        if (!best) return null;
        const grounding = await buildGrounding(best.slug, best.cId);
        const entry = (window.OKSAT_MANIFEST || []).find((m) => m.slug === best.slug) || {};
        const clabel = (best.mod.CONCEPTS[best.cId] && best.mod.CONCEPTS[best.cId].label) || best.cId;
        const t = {
          id: best.slug,
          label: (entry.title || best.slug) + ' · ' + clabel,
          subspecialty: entry.subspecialty || 'fundamentals',
          difficultyBand: 'core',
        };
        return { topic: t, level: levelForTopic(best.slug, 'core'), type: 'auto', grounding: grounding };
      } catch (e) { return null; }
    };

    /* ---- controller: weighted-random GAP topic ---- */
    const pickGapTopic = () => {
      const topics = ((window.OKSAT_TAXONOMY && window.OKSAT_TAXONOMY.topics) || []).filter((t) => !t.moduleId);
      if (!topics.length) return null;
      let adaptive = {};
      try { adaptive = OKSATStore.getAdaptive(reviewer).topics || {}; } catch (e) {}
      let total = 0;
      const weighted = topics.map((t) => {
        const attempts = (adaptive[t.id] && adaptive[t.id].attempts) || 0;
        const w = Math.max((4 - (t.priority || 2)) * (1 + 1 / (attempts + 1)), 0.05);
        total += w;
        return { t, w };
      });
      let r = Math.random() * total;
      for (let i = 0; i < weighted.length; i++) { r -= weighted[i].w; if (r <= 0) return weighted[i].t; }
      return weighted[weighted.length - 1].t;
    };

    /* ---- controller: resolve next target for the active mode ---- */
    const resolveTarget = async (m) => {
      if (m === 'topic') {
        const t = findTopic(lockedRef.current) || ((window.OKSAT_TAXONOMY && window.OKSAT_TAXONOMY.topics) || [])[0];
        if (!t) throw new Error('No topic available.');
        return { topic: topicObj(t), level: levelForTopic(t.id, t.difficultyBand), type: 'auto', grounding: null };
      }
      if (m === 'stress') {
        const t = pickGapTopic() || findTopic(lockedRef.current) || ((window.OKSAT_TAXONOMY && window.OKSAT_TAXONOMY.topics) || [])[0];
        if (!t) throw new Error('No topic available.');
        const base = levelForTopic(t.id, t.difficultyBand);
        return { topic: topicObj(t), level: Math.max(base, 4), type: Math.random() < 0.5 ? 'recall' : 'mcq', grounding: null };
      }
      if (m === 'mixed') {
        const builtTurn = (mixedTurnRef.current % 2) === 0;
        mixedTurnRef.current += 1;
        if (builtTurn) {
          const built = await tryBuiltTarget();
          if (built) return built;
        }
        // odd turn, or built unavailable → gap
      }
      // gap (default) + mixed fallback
      const t = pickGapTopic();
      if (!t) throw new Error('No adaptive topics available.');
      return { topic: topicObj(t), level: levelForTopic(t.id, t.difficultyBand), type: 'auto', grounding: null };
    };

    /* ---- controller: generate → normalize (single attempt) ---- */
    const genAndNormalize = async (tgt, avoid, seq) => {
      try {
        if (!window.OKSATAI || typeof OKSATAI.generateItem !== 'function') {
          return { ok: false, error: 'The generator (OKSATAI) is not loaded.' };
        }
        const raw = await OKSATAI.generateItem({
          topic: tgt.topic,
          level: tgt.level,
          type: tgt.type,
          avoidStems: avoid,
          grounding: tgt.grounding || null,
          model: (typeof OKSATAI.getModel === 'function') ? OKSATAI.getModel() : undefined,
        });
        const res = OKSATAI.normalizeGeneratedItem(raw, tgt.topic, seq);
        if (res && res.ok && res.item) return { ok: true, item: res.item };
        return { ok: false, error: (res && res.error) || 'The generated item failed validation.' };
      } catch (e) {
        const msg = (e && e.message) || 'Generation failed.';
        if (/already being generated/i.test(msg)) return { ok: false, error: msg, dup: true };
        return { ok: false, error: msg };
      }
    };

    /* ---- controller: advance to the next item ---- */
    const advance = async () => {
      if (busyRef.current) return; // guard against double-fire
      busyRef.current = true;
      setError(null);
      setItem(null);
      setLoading(true);
      try {
        const tgt = await resolveTarget(modeRef.current);
        setTopic(tgt.topic);
        setLevel(tgt.level);
        const seq = ++seqRef.current;
        const avoid = avoidRef.current.slice(-8);

        let norm = await genAndNormalize(tgt, avoid, seq);
        if (!norm.ok && !norm.dup) norm = await genAndNormalize(tgt, avoid, seq); // retry once

        if (norm.ok) {
          setItem(norm.item);
          avoidRef.current = avoidRef.current.concat(String(norm.item.stem || '').slice(0, 120)).slice(-8);
        } else {
          setError(norm.dup
            ? 'A question is already being generated — tap Retry in a moment.'
            : (norm.error || 'Could not generate a question.'));
        }
      } catch (e) {
        setError((e && e.message) || 'Something went wrong.');
      } finally {
        setLoading(false);
        busyRef.current = false;
      }
    };

    /* ---- session starters ---- */
    const beginSession = (m, lockedId) => {
      modeRef.current = m;
      lockedRef.current = lockedId || null;
      seqRef.current = 0;
      avoidRef.current = [];
      mixedTurnRef.current = 0;
      try { sessionRef.current = OKSATStore.touchSession(reviewer); } catch (e) { sessionRef.current = 0; }
      setView('quiz');
      advance();
    };

    /* ---- deep-link start: opts.topicId locks Topic drill ---- */
    useEffect(() => {
      if (hasKey && topicId) beginSession('topic', topicId);
      // eslint-disable-next-line
    }, []);

    /* ================= render ================= */

    // 1) No-key gate.
    if (!hasKey) {
      return html`
        <div className="ok-root"><div className="ok-wrap">
          <div className="ok-card fade-up" style=${{ padding: '1.75rem' }}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <${Sparkles} size=${18} style=${{ color: C.ochre }} />
              <span className="display-font" style=${{ fontSize: '1.05rem', fontWeight: 500, color: C.text }}>Adaptive practice needs a key</span>
            </div>
            <p style=${{ lineHeight: 1.65, color: C.textMuted, fontSize: '15px', marginBottom: '1.25rem' }}>
              Adaptive practice generates questions with Gemini. Attach a key in the hub's Settings.
            </p>
            <a href="oksat.html" className="ok-btn ok-btn--primary" style=${{ textDecoration: 'none', justifyContent: 'center', display: 'inline-flex' }}>
              <span className="display-font" style=${{ fontWeight: 500 }}>Open the hub</span><${ChevronRight} size=${16} />
            </a>
          </div>
        </div></div>`;
    }

    // 4) Starred view.
    if (view === 'starred') {
      return html`
        <div className="ok-root"><div className="ok-wrap">
          <${StarredView} reviewer=${reviewer} onBack=${() => setView(item || topic ? 'quiz' : 'setup')} onChanged=${refreshStars} />
        </div></div>`;
    }

    // 2) Setup view.
    if (view === 'setup') {
      return html`
        <div className="ok-root"><div className="ok-wrap">
          <${SetupView}
            starCount=${starCount}
            onStarred=${() => setView('starred')}
            onStartTopic=${(id) => beginSession('topic', id)}
            onStartMode=${(m) => beginSession(m, null)} />
        </div></div>`;
    }

    // 3) Quiz view (header persists across loading / error / item).
    const modeLabels = { topic: 'Topic drill', gap: 'Gap filler', mixed: 'Mixed review', stress: 'Stress test' };
    return html`
      <div className="ok-root"><div className="ok-wrap">
        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick=${() => setView('setup')} style=${{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}>
            <${Home} size=${14} /><span className="display-font" style=${{ fontWeight: 500 }}>Menu</span>
          </button>
          <div style=${{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button onClick=${() => setView('starred')} style=${{ background: 'none', border: 'none', color: C.ochre, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }} title="Starred questions">
              <span>★</span><span className="display-font" style=${{ fontWeight: 500 }}>${starCount}</span>
            </button>
            <span className="display-font" style=${{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint }}>Level ${level}/5</span>
          </div>
        </div>

        <div className="ui-font" style=${{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.ochre, marginBottom: '1rem' }}>
          ${modeLabels[modeRef.current] || 'Adaptive'}${topic && topic.label ? ' · ' + topic.label : ''}
        </div>

        ${loading
          ? html`<${LoadingCard} />`
          : error
          ? html`<${ErrorView} message=${error} onRetry=${advance} onMenu=${() => setView('setup')} />`
          : item
          ? html`<${QuizItem} key=${item.id}
              item=${item} reviewer=${reviewer} sessionN=${sessionRef.current}
              onResult=${onResult} onNext=${advance} onStarChange=${refreshStars} />`
          : html`<${LoadingCard} />`}
      </div></div>`;
  }

  /* ---- Mount ---- */
  window.mountOKSATAdaptive = function (rootEl, opts) {
    const o = opts || {};
    ReactDOM.createRoot(rootEl).render(html`<${AdaptiveQuiz} topicId=${o.topicId} mode=${o.mode} code=${o.code} />`);
  };
})();
