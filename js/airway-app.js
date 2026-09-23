/* =============================================================
   airway-app.js — airway-jeopardy.html UI: setup, Rounds, Jeopardy
   board, quick quiz, browse. Game rules live in js/airway-engine.js,
   the bank in js/airway-questions.js. Same-origin and CDN-free by
   design; every data string reaching innerHTML goes through esc().
   ============================================================= */
(function () {
  'use strict';

  var DATA = window.AIRWAY_DATA;
  var ENGINE = window.AirwayEngine;
  var QUESTIONS = DATA.questions;
  var TOPICS = DATA.topics;
  var DIFF = ENGINE.DIFF;
  var DIFF_KEYS = ['easy', 'medium', 'hard'];

  var root = document.getElementById('aw-app');

  // ─── Color maps (inline-style driven — keeps CSS structural-only) ───

  var TOPIC_COLORS = {
    basics:        { bg: 'rgba(30,58,138,.45)',  text: '#93c5fd', border: '#1d4ed8' },
    emergencies:   { bg: 'rgba(127,29,29,.45)',   text: '#fca5a5', border: '#b91c1c' },
    valves:        { bg: 'rgba(76,29,149,.45)',   text: '#c4b5fd', border: '#6d28d9' },
    complications: { bg: 'rgba(120,53,15,.45)',   text: '#fcd34d', border: '#b45309' },
    daily:         { bg: 'rgba(19,78,74,.45)',    text: '#5eead4', border: '#0f766e' },
  };

  var DIFF_COLORS = {
    easy:   { bg: 'rgba(6,78,59,.55)',   text: '#6ee7b7', border: '#047857', pip: '#34d399' },
    medium: { bg: 'rgba(113,63,18,.55)', text: '#fde047', border: '#a16207', pip: '#facc15' },
    hard:   { bg: 'rgba(127,29,29,.55)', text: '#fca5a5', border: '#b91c1c', pip: '#f87171' },
  };

  var TEAM_COLORS = {
    cyan:    { bg: '#06b6d4', text: '#22d3ee', border: '#06b6d4', dim: 'rgba(8,51,68,.55)' },
    rose:    { bg: '#f43f5e', text: '#fb7185', border: '#f43f5e', dim: 'rgba(76,5,25,.55)' },
    amber:   { bg: '#f59e0b', text: '#fbbf24', border: '#f59e0b', dim: 'rgba(69,26,3,.55)' },
    emerald: { bg: '#10b981', text: '#34d399', border: '#10b981', dim: 'rgba(2,44,34,.55)' },
    violet:  { bg: '#8b5cf6', text: '#a78bfa', border: '#8b5cf6', dim: 'rgba(46,16,101,.55)' },
    orange:  { bg: '#f97316', text: '#fb923c', border: '#f97316', dim: 'rgba(67,20,7,.55)' },
  };

  var MODES = [
    { id: 'rounds', icon: '01', title: 'Rounds',         desc: 'Buzz-in team quiz with a steal mechanic.' },
    { id: 'board',  icon: '02', title: 'Jeopardy Board', desc: 'Classic board — pick a topic and a value.' },
    { id: 'quiz',   icon: '03', title: 'Quick Quiz',      desc: 'Solo self-study, multiple choice.' },
    { id: 'browse', icon: '04', title: 'Browse',          desc: 'The full question bank, searchable.' },
  ];


  // ─── Helpers ──────────────────────────────────────────────────────

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function topicById(id) { return TOPICS.filter(function (t) { return t.id === id; })[0]; }

  function topicBadge(topicId) {
    var t = topicById(topicId);
    var c = TOPIC_COLORS[topicId];
    if (!t || !c) return '';
    return '<span class="aw-badge" style="--b-bg:' + c.bg + ';--b-text:' + c.text + ';--b-border:' + c.border + '">' + esc(t.short) + '</span>';
  }

  function pipsHtml(difficulty) {
    var cfg = DIFF[difficulty];
    var c = DIFF_COLORS[difficulty];
    var out = '<span class="aw-pips" style="--pip-color:' + c.pip + '">';
    for (var i = 0; i < 3; i++) out += '<span class="aw-pip' + (i < cfg.pips ? ' on' : '') + '"></span>';
    out += '</span>';
    return out;
  }

  function diffBadge(difficulty) {
    var cfg = DIFF[difficulty];
    var c = DIFF_COLORS[difficulty];
    return '<span class="aw-badge" style="--b-bg:' + c.bg + ';--b-text:' + c.text + ';--b-border:' + c.border + '">' +
      pipsHtml(difficulty) + '<span>' + esc(cfg.label) + '</span></span>';
  }

  function fmtDate() { return new Date().toLocaleDateString(); }

  // ─── State ────────────────────────────────────────────────────────

  function defaultTeams() {
    return [
      ENGINE.makeTeam('Team 1', 'cyan', 't0'),
      ENGINE.makeTeam('Team 2', 'rose', 't1'),
      ENGINE.makeTeam('Team 3', 'amber', 't2'),
    ];
  }

  var S = {
    screen: 'setup',
    mode: 'rounds',
    filters: {
      topics: new Set(TOPICS.map(function (t) { return t.id; })),
      difficulties: new Set(DIFF_KEYS),
    },
    teams: defaultTeams(),
    endCondition: { type: 'count', value: 15 },
    quizCount: 10,
    rounds: null,
    board: null,
    quiz: null,
    browse: { search: '', topic: 'all', difficulty: 'all', sort: 'topic', expandedId: null },
  };

  function poolFor(filters) {
    return QUESTIONS.filter(function (q) {
      return filters.topics.has(q.topic) && filters.difficulties.has(q.difficulty);
    });
  }

  // ─── Render dispatch + focus-preserving update ───────────────────

  var screens = {
    setup: renderSetup,
    rounds: renderRoundsGame,
    'rounds-results': renderRoundsResults,
    board: renderBoardGame,
    'board-results': renderBoardResults,
    quiz: renderQuizGame,
    'quiz-results': renderQuizResults,
    browse: renderBrowse,
  };

  function render() {
    root.innerHTML = '<div class="aw">' + screens[S.screen]() + '</div>';
  }

  function update() {
    var active = document.activeElement;
    var id = active && active.id;
    var start = active && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    var end = active && typeof active.selectionEnd === 'number' ? active.selectionEnd : null;
    render();
    if (id) {
      var el = document.getElementById(id);
      if (el) {
        el.focus();
        if (start !== null && el.setSelectionRange) {
          try { el.setSelectionRange(start, end); } catch (e) { /* no-op */ }
        }
      }
    }
  }

  // ─── SETUP SCREEN ─────────────────────────────────────────────────

  function renderModeGrid() {
    return '<div class="aw-mode-grid">' + MODES.map(function (m) {
      return '<button type="button" class="aw-mode-card' + (S.mode === m.id ? ' active' : '') + '" data-action="pick-mode" data-mode="' + m.id + '">' +
        '<span class="aw-mode-icon">' + m.icon + '</span>' +
        '<span class="aw-mode-title">' + esc(m.title) + '</span>' +
        '<span class="aw-mode-desc">' + esc(m.desc) + '</span>' +
        '</button>';
    }).join('') + '</div>';
  }

  function renderFilters(poolSize) {
    var topicChips = TOPICS.map(function (t) {
      var on = S.filters.topics.has(t.id);
      var c = TOPIC_COLORS[t.id];
      var style = on ? ' style="--chip-bg:' + c.bg + ';--chip-text:' + c.text + ';--chip-border:' + c.border + '"' : '';
      return '<button type="button" class="aw-chip' + (on ? ' active' : '') + '"' + style + ' data-action="toggle-topic" data-id="' + t.id + '">' + esc(t.short) + '</button>';
    }).join('');

    var diffCards = DIFF_KEYS.map(function (key) {
      var on = S.filters.difficulties.has(key);
      var c = DIFF_COLORS[key];
      var cfg = DIFF[key];
      var style = on ? ' style="--chip-bg:' + c.bg + ';--chip-text:' + c.text + ';--chip-border:' + c.border + ';--pip-color:' + c.pip + '"' : ' style="--pip-color:' + c.pip + '"';
      return '<button type="button" class="aw-diff-card' + (on ? ' active' : '') + '"' + style + ' data-action="toggle-diff" data-id="' + key + '">' +
        pipsHtml(key) + '<span>' + esc(cfg.label) + '</span><span class="aw-pts">' + cfg.pts + ' pts</span></button>';
    }).join('');

    return (
      '<div class="aw-section"><p class="aw-label">Topics</p><div class="aw-chip-row">' + topicChips + '</div></div>' +
      '<div class="aw-section"><p class="aw-label">Difficulty</p><div class="aw-diff-grid">' + diffCards + '</div>' +
      '<p class="aw-count-note">' + poolSize + ' question' + (poolSize === 1 ? '' : 's') + ' match filters</p></div>'
    );
  }

  function renderTeamEditor(teams) {
    var rows = teams.map(function (team, idx) {
      var c = TEAM_COLORS[team.color];
      return '<div class="aw-team-row" style="--team-border:' + c.border + ';--team-bg:' + c.bg + '">' +
        '<span class="aw-team-swatch"></span>' +
        '<input class="aw-team-input" id="team-name-' + team.id + '" data-bind="team-name" data-id="' + team.id + '" value="' + esc(team.name) + '" placeholder="Team ' + (idx + 1) + '" maxlength="20">' +
        (teams.length > 2 ? '<button type="button" class="aw-team-remove" data-action="team-remove" data-id="' + team.id + '">✕</button>' : '') +
        '</div>';
    }).join('');
    var addBtn = teams.length < 6 ? '<button type="button" class="aw-add-team" data-action="team-add">+ Add team</button>' : '';
    return '<div class="aw-section"><p class="aw-label">Teams</p>' + rows + addBtn + '</div>';
  }

  function renderHistory() {
    var h = ENGINE.history.load();
    if (h.length === 0) return '';
    var modeLabels = { rounds: 'Rounds', board: 'Board', quiz: 'Quiz' };
    var rows = h.slice(0, 5).map(function (s) {
      var detail = (s.teams || []).map(function (t) { return t.name + ' ' + t.score; }).join(' · ');
      return '<div class="aw-history-row">' +
        '<span class="aw-history-mode">' + esc(modeLabels[s.mode] || s.mode || '') + '</span>' +
        '<span class="aw-history-date">' + esc(s.date) + '</span>' +
        '<span class="aw-history-winner">Winner: ' + esc(s.winner) + '</span>' +
        '<span class="aw-history-detail">' + esc(detail) + '</span>' +
        '</div>';
    }).join('');
    return '<div class="aw-section"><p class="aw-label">Recent Sessions</p>' + rows + '</div>';
  }

  function renderSetup() {
    var poolSize = poolFor(S.filters).length;
    var body = '';

    body += '<div class="aw-hero">' +
      '<div class="aw-eyebrow"><span>ENT · H&amp;N Nursing</span></div>' +
      '<h1 class="aw-h1">Airway Rounds</h1>' +
      '<p class="aw-sub">Rounds · Jeopardy Board · Quick Quiz · Browse</p>' +
      '</div>';

    body += '<div class="aw-section">' + renderModeGrid() + '</div>';
    body += renderFilters(poolSize);

    if (S.mode === 'rounds') {
      body += renderTeamEditor(S.teams);

      var countOpts = [5, 10, 15, 20, 25, 30, 40, 60].filter(function (n) { return n <= poolSize; });
      if (poolSize > 0 && countOpts.indexOf(poolSize) === -1) countOpts.push(poolSize);
      countOpts.sort(function (a, b) { return a - b; });

      body += '<div class="aw-section"><p class="aw-label">Game Ends When…</p><div class="aw-end-row">' +
        ['all', 'count', 'score'].map(function (type) {
          var labels = { all: 'All ' + poolSize + ' Qs', count: 'Play N Qs', score: 'First to X pts' };
          var on = S.endCondition.type === type;
          return '<button type="button" class="aw-btn' + (on ? ' aw-btn-primary' : '') + '" data-action="set-end-type" data-type="' + type + '">' + labels[type] + '</button>';
        }).join('') + '</div>';

      if (S.endCondition.type === 'count') {
        body += '<select class="aw-select" data-bind="end-count">' +
          countOpts.map(function (n) { return '<option value="' + n + '"' + (n === S.endCondition.value ? ' selected' : '') + '>' + n + ' questions</option>'; }).join('') +
          '</select>';
      } else if (S.endCondition.type === 'score') {
        body += '<select class="aw-select" data-bind="end-score">' +
          [200, 300, 400, 500, 750, 1000].map(function (n) { return '<option value="' + n + '"' + (n === S.endCondition.value ? ' selected' : '') + '>First to ' + n + ' points</option>'; }).join('') +
          '</select>';
      }
      body += '</div>';

      body += '<div class="aw-section"><div class="aw-howto">' +
        '<p style="margin:0 0 0.4rem;color:#ECEBE6;font-weight:700;">How to play</p>' +
        '<p>Host reads the question aloud. A team buzzes in — tap their button, then mark Correct or Wrong.</p>' +
        '<p>Wrong answer opens a <strong style="color:#fbbf24">steal window</strong> for the other teams at half points, no penalty on a miss.</p>' +
        '<p>3 correct in a row earns a <strong style="color:#fde047">+50 streak bonus</strong>.</p>' +
        '</div></div>';

      var canStart = poolSize > 0;
      body += '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="start-rounds"' + (canStart ? '' : ' disabled') + '>' +
        (canStart ? 'Start Game →' : 'No questions match filters') + '</button>';
    }

    if (S.mode === 'board') {
      body += renderTeamEditor(S.teams);
      var topicCount = S.filters.topics.size;
      body += '<div class="aw-section"><div class="aw-howto">' +
        '<p style="margin:0 0 0.4rem;color:#ECEBE6;font-weight:700;">How to play</p>' +
        '<p>Each selected topic becomes a column of 5 clues (100–500 pts). Teams take turns picking a cell.</p>' +
        '<p>Correct keeps control. Wrong opens a steal to the other teams at <strong style="color:#fbbf24">full value</strong>, no penalty on a miss.</p>' +
        '<p>Board clears out → results.</p>' +
        '</div></div>';
      var canStartBoard = topicCount >= 2 && poolSize > 0;
      body += '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="start-board"' + (canStartBoard ? '' : ' disabled') + '>' +
        (topicCount < 2 ? 'Select at least 2 topics' : (poolSize === 0 ? 'No questions match filters' : 'Build Board →')) + '</button>';
    }

    if (S.mode === 'quiz') {
      var quizOpts = [10, 20, 40].filter(function (n) { return n <= poolSize; });
      if (poolSize > 0) quizOpts.push(poolSize);
      quizOpts = quizOpts.filter(function (n, i) { return quizOpts.indexOf(n) === i; }).sort(function (a, b) { return a - b; });
      body += '<div class="aw-section"><p class="aw-label">How Many Questions</p><div class="aw-chip-row">' +
        quizOpts.map(function (n) {
          var on = S.quizCount === n;
          var label = n === poolSize ? 'All (' + n + ')' : String(n);
          return '<button type="button" class="aw-chip' + (on ? ' active' : '') + '" style="' + (on ? '--chip-bg:rgba(255,107,66,.12);--chip-text:#FF6B42;--chip-border:#9E3F24' : '') + '" data-action="set-quiz-count" data-n="' + n + '">' + label + '</button>';
        }).join('') + '</div></div>';
      body += '<div class="aw-section"><div class="aw-howto"><p>Solo self-study. Answer, see the full explanation + pearl, move on. Results show your % and a review of anything missed.</p></div></div>';
      var canStartQuiz = poolSize > 0;
      body += '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="start-quiz"' + (canStartQuiz ? '' : ' disabled') + '>' +
        (canStartQuiz ? 'Start Quiz →' : 'No questions match filters') + '</button>';
    }

    if (S.mode === 'browse') {
      body += '<div class="aw-section"><div class="aw-howto"><p>Every question in the bank — filter, sort, and search. Tap a row to see the answer and pearl.</p></div></div>';
      body += '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="start-browse">Browse Questions →</button>';
    }

    body += renderHistory();

    return '<div class="aw-wrap">' + body + '</div>';
  }

  // ─── SHARED IN-GAME CHROME ────────────────────────────────────────

  function topline(rightHtml) {
    return '<div class="aw-topline"><button type="button" class="aw-menu-link" data-action="go-setup">‹ Menu</button>' +
      '<div class="aw-topline-right">' + (rightHtml || '') + '</div></div>';
  }

  function scoreboard(teams, activeTeamId, extraRight) {
    var tiles = teams.map(function (t) {
      var c = TEAM_COLORS[t.color];
      var active = t.id === activeTeamId;
      return '<div class="aw-team-tile' + (active ? ' active' : '') + '" style="--team-border:' + c.border + ';--team-bg:' + c.bg + ';--team-text:' + c.text + ';--team-dim:' + c.dim + '">' +
        '<span class="aw-team-tile-name">' + (t.streak >= 3 ? '▲ ' : '') + esc(t.name) + '</span>' +
        '<span class="aw-team-tile-score">' + t.score + '</span></div>';
    }).join('');
    return '<div class="aw-scoreboard"><div class="aw-scoreboard-inner"><div class="aw-team-tiles">' + tiles + '</div>' + (extraRight || '') + '</div></div>';
  }

  // ─── ROUNDS MODE ──────────────────────────────────────────────────

  function startRounds() {
    var pool = ENGINE.buildPool(QUESTIONS, S.filters);
    if (pool.length === 0) return;
    var sliced = ENGINE.rounds.slicePool(pool, S.endCondition);
    S.rounds = {
      teams: S.teams.map(function (t) { return ENGINE.makeTeam(t.name, t.color, t.id); }),
      pool: sliced,
      queueIdx: 0,
      activeQ: sliced[0],
      qPhase: 'idle',
      activeTeamId: null,
      wrongTeamIds: [],
      revealed: false,
    };
    S.screen = 'rounds';
    update();
  }

  function renderRoundsGame() {
    var r = S.rounds;
    if (!r || !r.activeQ) return '<div class="aw-wrap">No active question.</div>';
    var q = r.activeQ;
    var diff = DIFF[q.difficulty];
    var buzzedTeam = r.activeTeamId ? r.teams.filter(function (t) { return t.id === r.activeTeamId; })[0] : null;
    var availForSteal = ENGINE.rounds.availableStealers(r.teams, r.wrongTeamIds);
    var isLast = r.queueIdx + 1 >= r.pool.length;
    var scoreHit = S.endCondition.type === 'score' && r.teams.some(function (t) { return t.score >= S.endCondition.value; });
    var shouldEnd = isLast || scoreHit;
    var streakBonusPreview = buzzedTeam ? ENGINE.rounds.streakBonus(buzzedTeam.streak) : 0;

    var html = topline('<span>Q ' + (r.queueIdx + 1) + ' / ' + r.pool.length + '</span><button type="button" class="aw-end-now" data-action="r-end-now">End game</button>');
    html += scoreboard(r.teams, r.activeTeamId);

    html += '<div class="aw-game-body"><div class="aw-card">';
    html += '<div class="aw-card-head"><div class="aw-badges">' + topicBadge(q.topic) + diffBadge(q.difficulty) + '<span class="aw-badge" style="--b-bg:transparent;--b-text:#7E838C;--b-border:#2C2F35">' + diff.pts + ' pts</span></div>';
    if (r.qPhase === 'steal') html += '<span class="aw-steal-flag">⇄ Steal · ' + diff.steal + ' pts</span>';
    html += '</div>';

    html += '<div class="aw-qbody"><p class="aw-qtext">' + esc(q.q) + '</p>';
    if (!r.revealed) {
      html += '<button type="button" class="aw-reveal-btn" data-action="r-reveal">Reveal Answer ↓</button>';
    } else {
      html += '<div class="aw-answer-block"><div class="aw-answer-box">' + esc(q.a) + '</div>' +
        '<div class="aw-pearl-box"><span class="aw-pearl-tag">Pearl</span><p class="aw-pearl-text">' + esc(q.pearl) + '</p></div></div>';
    }
    html += '</div></div>';

    html += '<div class="aw-panel">';
    if (r.qPhase === 'idle') {
      html += '<p class="aw-panel-hint">Who buzzed in?</p><div class="aw-buzz-grid" style="grid-template-columns:repeat(' + Math.min(r.teams.length, 3) + ',1fr)">' +
        r.teams.map(function (t) {
          var c = TEAM_COLORS[t.color];
          return '<button type="button" class="aw-buzz-btn" style="--team-bg:' + c.bg + '" data-action="r-buzz" data-id="' + t.id + '">' + esc(t.name) + '</button>';
        }).join('') + '</div>' +
        '<button type="button" class="aw-btn aw-btn-ghost aw-btn-block" data-action="r-skip">Skip — no one answered</button>';
    } else if (r.qPhase === 'buzzed' && buzzedTeam) {
      var bc = TEAM_COLORS[buzzedTeam.color];
      html += '<p class="aw-verdict-name" style="--team-text:' + bc.text + '"><strong>' + esc(buzzedTeam.name) + '</strong> answered — correct?</p>' +
        '<div class="aw-verdict-grid">' +
        '<button type="button" class="aw-verdict-btn aw-verdict-correct" data-action="r-correct">✓ Correct<span class="aw-btn-sub">+' + diff.pts + ' pts' + (streakBonusPreview ? ' · +50 streak' : '') + '</span></button>' +
        '<button type="button" class="aw-verdict-btn aw-verdict-wrong" data-action="r-wrong">✗ Wrong' + (diff.penalty < 0 ? '<span class="aw-btn-sub">' + diff.penalty + ' pts</span>' : '') + '</button>' +
        '</div>';
    } else if (r.qPhase === 'steal' && !r.activeTeamId) {
      html += '<p class="aw-panel-hint" style="color:#fbbf24;font-weight:700;">⇄ Steal for ' + diff.steal + ' pts — who goes?</p>' +
        '<div class="aw-buzz-grid" style="grid-template-columns:repeat(' + Math.min(availForSteal.length, 3) + ',1fr)">' +
        availForSteal.map(function (t) {
          var c = TEAM_COLORS[t.color];
          return '<button type="button" class="aw-steal-btn" style="--team-border:' + c.border + ';--team-dim:' + c.dim + ';--team-text:' + c.text + '" data-action="r-steal-buzz" data-id="' + t.id + '">' + esc(t.name) + '</button>';
        }).join('') + '</div>' +
        '<button type="button" class="aw-btn aw-btn-ghost aw-btn-block" data-action="r-close-steal">No steal</button>';
    } else if (r.qPhase === 'steal_buzzed' && buzzedTeam) {
      var sc = TEAM_COLORS[buzzedTeam.color];
      html += '<p class="aw-verdict-name" style="--team-text:' + sc.text + '"><strong>' + esc(buzzedTeam.name) + '</strong> steals — correct?</p>' +
        '<div class="aw-verdict-grid">' +
        '<button type="button" class="aw-verdict-btn aw-verdict-correct" data-action="r-steal-correct">✓ Correct<span class="aw-btn-sub">+' + diff.steal + ' pts</span></button>' +
        '<button type="button" class="aw-verdict-btn aw-verdict-wrong" data-action="r-steal-wrong">✗ Wrong<span class="aw-btn-sub">no penalty</span></button>' +
        '</div>';
    } else if (r.qPhase === 'done') {
      html += '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="' + (shouldEnd ? 'r-end-now' : 'r-next') + '">' + (shouldEnd ? 'See Results →' : 'Next Question →') + '</button>';
    }
    html += '</div></div>';
    return html;
  }

  function roundsAction(name, el) {
    var r = S.rounds;
    if (!r) return;
    var diff = DIFF[r.activeQ.difficulty];

    if (name === 'r-reveal') { r.revealed = true; }
    else if (name === 'r-buzz') { r.activeTeamId = el.dataset.id; r.qPhase = 'buzzed'; }
    else if (name === 'r-correct') {
      r.teams = r.teams.map(function (t) { return t.id === r.activeTeamId ? ENGINE.rounds.markCorrect(t, r.activeQ.difficulty) : t; });
      r.qPhase = 'done'; r.revealed = true;
    } else if (name === 'r-wrong') {
      r.teams = r.teams.map(function (t) { return t.id === r.activeTeamId ? ENGINE.rounds.markWrong(t, r.activeQ.difficulty) : t; });
      r.wrongTeamIds = r.wrongTeamIds.concat([r.activeTeamId]);
      if (ENGINE.rounds.canSteal(r.teams, r.wrongTeamIds)) { r.qPhase = 'steal'; r.activeTeamId = null; }
      else { r.qPhase = 'done'; r.activeTeamId = null; r.revealed = true; }
    } else if (name === 'r-steal-buzz') { r.activeTeamId = el.dataset.id; r.qPhase = 'steal_buzzed'; }
    else if (name === 'r-steal-correct') {
      r.teams = r.teams.map(function (t) { return t.id === r.activeTeamId ? ENGINE.rounds.markStealCorrect(t, r.activeQ.difficulty) : t; });
      r.qPhase = 'done'; r.revealed = true;
    } else if (name === 'r-steal-wrong' || name === 'r-close-steal') { r.qPhase = 'done'; r.activeTeamId = null; r.revealed = true; }
    else if (name === 'r-skip') { r.qPhase = 'done'; r.revealed = true; }
    else if (name === 'r-next') {
      var next = r.queueIdx + 1;
      if (next >= r.pool.length) { finishRounds(); return; }
      r.queueIdx = next; r.activeQ = r.pool[next]; r.activeTeamId = null; r.wrongTeamIds = []; r.revealed = false; r.qPhase = 'idle';
    } else if (name === 'r-end-now') { finishRounds(); return; }
    update();
  }

  function finishRounds() {
    var r = S.rounds;
    var sorted = r.teams.slice().sort(function (a, b) { return b.score - a.score; });
    var isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;
    ENGINE.history.save({
      date: fmtDate(),
      winner: isTie ? 'Tie' : sorted[0].name,
      teams: sorted.map(function (t) { return { name: t.name, score: t.score }; }),
      mode: 'rounds',
    });
    S.screen = 'rounds-results';
    update();
  }

  function renderRoundsResults() {
    var r = S.rounds;
    var sorted = r.teams.slice().sort(function (a, b) { return b.score - a.score; });
    var isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;
    var topStreaker = r.teams.slice().sort(function (a, b) { return b.streak - a.streak; })[0];

    var html = '<div class="aw-wrap">';
    html += '<div class="aw-result-hero"><div class="aw-result-emoji">' + (isTie ? 'Tie' : 'Winner') + '</div>' +
      '<h1 class="aw-result-title">' + (isTie ? "It's a Tie!" : esc(sorted[0].name) + ' Wins!') + '</h1>' +
      '<p class="aw-result-sub">' + r.queueIdx + (r.qPhase === 'done' || r.pool.length ? 1 : 0) + ' rounds · ' + fmtDate() + '</p></div>';

    html += sorted.map(function (team, idx) {
      var c = TEAM_COLORS[team.color];
      var isFirst = idx === 0 && !isTie;
      return '<div class="aw-leaderboard-row' + (isFirst ? ' first' : '') + '" style="--team-border:' + c.border + ';--team-dim:' + c.dim + ';--team-text:' + c.text + '">' +
        '<span class="aw-medal">' + (idx + 1) + '</span>' +
        '<span class="aw-lb-name">' + esc(team.name) + '</span>' +
        '<div class="aw-lb-score-wrap"><div class="aw-lb-score">' + team.score + '</div>' +
        '<div class="aw-lb-stats">' + team.correct + '✓' + (team.wrong > 0 ? ' ' + team.wrong + '✗' : '') + (team.steals > 0 ? ' ' + team.steals + '⇄' : '') + '</div></div></div>';
    }).join('');

    if (topStreaker && topStreaker.streak >= 3) {
      html += '<div class="aw-streak-banner">▲ ' + esc(topStreaker.name) + ' ended on a ' + topStreaker.streak + '-question streak!</div>';
    }

    html += '<div class="aw-result-actions">' +
      '<button type="button" class="aw-btn aw-btn-primary aw-btn-lg" data-action="r-play-again">Play Again</button>' +
      '<button type="button" class="aw-btn aw-btn-ghost aw-btn-lg" data-action="go-setup">Menu</button>' +
      '</div></div>';
    return html;
  }

  // ─── JEOPARDY BOARD MODE ──────────────────────────────────────────

  function startBoard() {
    var pool = ENGINE.buildPool(QUESTIONS, S.filters);
    var topicIds = TOPICS.map(function (t) { return t.id; }).filter(function (id) { return S.filters.topics.has(id); });
    if (topicIds.length < 2 || pool.length === 0) return;
    S.board = {
      teams: S.teams.map(function (t) { return ENGINE.makeTeam(t.name, t.color, t.id); }),
      columns: ENGINE.board.build(topicIds, pool),
      controlIndex: 0,
      modal: null,
    };
    S.screen = 'board';
    update();
  }

  function renderBoardGame() {
    var b = S.board;
    if (!b) return '<div class="aw-wrap">No board.</div>';
    var control = b.teams[b.controlIndex];
    var c = TEAM_COLORS[control.color];

    var html = topline('<button type="button" class="aw-end-now" data-action="b-end-now">End game</button>');
    html += scoreboard(b.teams, control.id);

    html += '<div class="aw-game-body">';
    html += '<div class="aw-turn-flag" style="--team-border:' + c.border + ';--team-dim:' + c.dim + ';--team-text:' + c.text + '">▸ ' + esc(control.name) + "'s turn to pick</div>";

    html += '<div class="aw-board-scroll"><div class="aw-board">';
    html += b.columns.map(function (col, colIdx) {
      var tc = TOPIC_COLORS[col.topic];
      var topic = topicById(col.topic);
      var cellsHtml = col.cells.map(function (cell, cellIdx) {
        if (!cell.question) return '<div class="aw-board-cell aw-board-cell--empty">—</div>';
        if (cell.done) return '<div class="aw-board-cell aw-board-cell--done">✓</div>';
        return '<button type="button" class="aw-board-cell" data-action="b-cell" data-col="' + colIdx + '" data-cell="' + cellIdx + '">' + cell.value + '</button>';
      }).join('');
      return '<div class="aw-board-col"><div class="aw-board-col-header" style="--b-bg:' + tc.bg + ';--b-text:' + tc.text + ';--b-border:' + tc.border + '">' + esc(topic.short) + '</div>' + cellsHtml + '</div>';
    }).join('');
    html += '</div></div>';

    if (b.modal) html += renderBoardModal(b);

    html += '</div>';
    return html;
  }

  function renderBoardModal(b) {
    var m = b.modal;
    var q = m.cell.question;
    var diff = DIFF[q.difficulty];
    var answeringTeam = b.teams.filter(function (t) { return t.id === m.answeringTeamId; })[0];
    var atc = answeringTeam ? TEAM_COLORS[answeringTeam.color] : null;

    var html = '<div class="aw-modal-backdrop"><div class="aw-modal"><div class="aw-card">';
    html += '<div class="aw-card-head"><div class="aw-badges">' + topicBadge(q.topic) + diffBadge(q.difficulty) +
      '<span class="aw-badge" style="--b-bg:transparent;--b-text:#FF6B42;--b-border:#9E3F24">' + m.cell.value + ' pts</span></div>' +
      (m.phase === 'steal-pick' || m.phase === 'steal-verdict' ? '<span class="aw-steal-flag">⇄ Steal · ' + m.cell.value + ' pts</span>' : '') + '</div>';

    html += '<div class="aw-qbody"><p class="aw-qtext">' + esc(q.q) + '</p>';
    if (!m.revealed) {
      html += '<button type="button" class="aw-reveal-btn" data-action="b-reveal">Reveal Answer ↓</button>';
    } else {
      html += '<div class="aw-answer-block"><div class="aw-answer-box">' + esc(q.a) + '</div>' +
        '<div class="aw-pearl-box"><span class="aw-pearl-tag">Pearl</span><p class="aw-pearl-text">' + esc(q.pearl) + '</p></div></div>';
    }
    html += '</div></div>';

    html += '<div class="aw-panel" style="margin-top:0.9rem;">';
    if (m.phase === 'await-verdict') {
      if (!m.revealed) {
        html += '<p class="aw-panel-hint">Reveal the answer, then judge ' + esc(answeringTeam.name) + '.</p>';
      } else {
        html += '<p class="aw-verdict-name" style="--team-text:' + atc.text + '"><strong>' + esc(answeringTeam.name) + '</strong> answered — correct?</p>' +
          '<div class="aw-verdict-grid">' +
          '<button type="button" class="aw-verdict-btn aw-verdict-correct" data-action="b-correct">✓ Correct<span class="aw-btn-sub">+' + m.cell.value + ' pts</span></button>' +
          '<button type="button" class="aw-verdict-btn aw-verdict-wrong" data-action="b-wrong">✗ Wrong<span class="aw-btn-sub">−' + m.cell.value + ' pts</span></button>' +
          '</div>';
      }
    } else if (m.phase === 'steal-pick') {
      var stealers = ENGINE.board.availableStealers(b.teams, m.pickerId, m.excludedIds);
      html += '<p class="aw-panel-hint" style="color:#fbbf24;font-weight:700;">⇄ Steal for ' + m.cell.value + ' pts — who goes?</p>' +
        '<div class="aw-buzz-grid" style="grid-template-columns:repeat(' + Math.min(stealers.length, 3) + ',1fr)">' +
        stealers.map(function (t) {
          var stc = TEAM_COLORS[t.color];
          return '<button type="button" class="aw-steal-btn" style="--team-border:' + stc.border + ';--team-dim:' + stc.dim + ';--team-text:' + stc.text + '" data-action="b-steal" data-id="' + t.id + '">' + esc(t.name) + '</button>';
        }).join('') + '</div>' +
        '<button type="button" class="aw-btn aw-btn-ghost aw-btn-block" data-action="b-no-steal">No steal</button>';
    } else if (m.phase === 'steal-verdict') {
      html += '<p class="aw-verdict-name" style="--team-text:' + atc.text + '"><strong>' + esc(answeringTeam.name) + '</strong> steals — correct?</p>' +
        '<div class="aw-verdict-grid">' +
        '<button type="button" class="aw-verdict-btn aw-verdict-correct" data-action="b-steal-correct">✓ Correct<span class="aw-btn-sub">+' + m.cell.value + ' pts</span></button>' +
        '<button type="button" class="aw-verdict-btn aw-verdict-wrong" data-action="b-steal-wrong">✗ Wrong<span class="aw-btn-sub">no penalty</span></button>' +
        '</div>';
    } else if (m.phase === 'done') {
      var outcomeText = m.outcome.type === 'correct' ? esc(answeringTeamNameFromOutcome(b, m)) + ' scored ' + m.cell.value + ' pts and keeps control.'
        : m.outcome.type === 'steal-correct' ? esc(m.outcome.teamName) + ' stole it for ' + m.cell.value + ' pts and takes control.'
        : 'No steal — control rotates to ' + esc(b.teams[ENGINE.board.nextControlIndex(b.teams.length, m.pickerIndex)].name) + '.';
      html += '<p class="aw-panel-hint">' + outcomeText + '</p>' +
        '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="b-continue">Back to Board →</button>';
    }
    html += '</div></div></div>';
    return html;
  }

  function answeringTeamNameFromOutcome(b, m) {
    var t = b.teams.filter(function (t2) { return t2.id === m.pickerId; })[0];
    return t ? t.name : '';
  }

  function boardAction(name, el) {
    var b = S.board;
    if (!b) return;

    if (name === 'b-cell') {
      var colIdx = +el.dataset.col, cellIdx = +el.dataset.cell;
      var cell = b.columns[colIdx].cells[cellIdx];
      if (!cell.question || cell.done) return;
      b.modal = {
        colIdx: colIdx, cellIdx: cellIdx, cell: cell, revealed: false, phase: 'await-verdict',
        pickerIndex: b.controlIndex, pickerId: b.teams[b.controlIndex].id,
        answeringTeamId: b.teams[b.controlIndex].id, excludedIds: [], outcome: null,
      };
    } else if (name === 'b-reveal') { b.modal.revealed = true; }
    else if (name === 'b-correct') {
      var m = b.modal;
      b.teams = b.teams.map(function (t) { return t.id === m.answeringTeamId ? ENGINE.board.markCorrect(t, m.cell.value) : t; });
      m.cell.done = true;
      m.phase = 'done'; m.outcome = { type: 'correct' };
    } else if (name === 'b-wrong') {
      var m2 = b.modal;
      b.teams = b.teams.map(function (t) { return t.id === m2.answeringTeamId ? ENGINE.board.markWrong(t, m2.cell.value) : t; });
      m2.excludedIds = m2.excludedIds.concat([m2.answeringTeamId]);
      var stealers = ENGINE.board.availableStealers(b.teams, m2.pickerId, m2.excludedIds);
      if (stealers.length > 0) { m2.phase = 'steal-pick'; }
      else { closeCellNoSteal(b, m2); }
    } else if (name === 'b-steal') {
      b.modal.answeringTeamId = el.dataset.id; b.modal.phase = 'steal-verdict';
    } else if (name === 'b-steal-correct') {
      var m3 = b.modal;
      var stealTeam = b.teams.filter(function (t) { return t.id === m3.answeringTeamId; })[0];
      b.teams = b.teams.map(function (t) { return t.id === m3.answeringTeamId ? ENGINE.board.markStealCorrect(t, m3.cell.value) : t; });
      m3.cell.done = true;
      b.controlIndex = b.teams.findIndex(function (t) { return t.id === m3.answeringTeamId; });
      m3.phase = 'done'; m3.outcome = { type: 'steal-correct', teamName: stealTeam.name };
    } else if (name === 'b-steal-wrong') {
      var m4 = b.modal;
      m4.excludedIds = m4.excludedIds.concat([m4.answeringTeamId]);
      var remain = ENGINE.board.availableStealers(b.teams, m4.pickerId, m4.excludedIds);
      if (remain.length > 0) { m4.phase = 'steal-pick'; }
      else { closeCellNoSteal(b, m4); }
    } else if (name === 'b-no-steal') { closeCellNoSteal(b, b.modal); }
    else if (name === 'b-continue') {
      b.modal = null;
      if (ENGINE.board.isExhausted(b.columns)) { finishBoard(); return; }
    } else if (name === 'b-end-now') { finishBoard(); return; }
    update();
  }

  function closeCellNoSteal(b, m) {
    m.cell.done = true;
    b.controlIndex = ENGINE.board.nextControlIndex(b.teams.length, m.pickerIndex);
    m.phase = 'done'; m.outcome = { type: 'no-steal' };
  }

  function finishBoard() {
    var b = S.board;
    var sorted = b.teams.slice().sort(function (a, b2) { return b2.score - a.score; });
    var isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;
    ENGINE.history.save({
      date: fmtDate(),
      winner: isTie ? 'Tie' : sorted[0].name,
      teams: sorted.map(function (t) { return { name: t.name, score: t.score }; }),
      mode: 'board',
    });
    S.screen = 'board-results';
    update();
  }

  function renderBoardResults() {
    var b = S.board;
    var sorted = b.teams.slice().sort(function (a, b2) { return b2.score - a.score; });
    var isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;

    var html = '<div class="aw-wrap">';
    html += '<div class="aw-result-hero"><div class="aw-result-emoji">' + (isTie ? 'Tie' : 'Winner') + '</div>' +
      '<h1 class="aw-result-title">' + (isTie ? "It's a Tie!" : esc(sorted[0].name) + ' Wins!') + '</h1>' +
      '<p class="aw-result-sub">Jeopardy Board · ' + fmtDate() + '</p></div>';

    html += sorted.map(function (team, idx) {
      var c = TEAM_COLORS[team.color];
      var isFirst = idx === 0 && !isTie;
      return '<div class="aw-leaderboard-row' + (isFirst ? ' first' : '') + '" style="--team-border:' + c.border + ';--team-dim:' + c.dim + ';--team-text:' + c.text + '">' +
        '<span class="aw-medal">' + (idx + 1) + '</span>' +
        '<span class="aw-lb-name">' + esc(team.name) + '</span>' +
        '<div class="aw-lb-score-wrap"><div class="aw-lb-score">' + team.score + '</div>' +
        '<div class="aw-lb-stats">' + team.correct + '✓' + (team.wrong > 0 ? ' ' + team.wrong + '✗' : '') + (team.steals > 0 ? ' ' + team.steals + '⇄' : '') + '</div></div></div>';
    }).join('');

    html += '<div class="aw-result-actions">' +
      '<button type="button" class="aw-btn aw-btn-primary aw-btn-lg" data-action="b-play-again">Play Again</button>' +
      '<button type="button" class="aw-btn aw-btn-ghost aw-btn-lg" data-action="go-setup">Menu</button>' +
      '</div></div>';
    return html;
  }

  // ─── QUICK QUIZ MODE ──────────────────────────────────────────────

  function startQuiz() {
    var pool = ENGINE.buildPool(QUESTIONS, S.filters);
    if (pool.length === 0) return;
    var sliced = pool.slice(0, Math.min(S.quizCount, pool.length));
    S.quiz = {
      pool: sliced,
      idx: 0,
      choices: ENGINE.quiz.buildChoices(sliced[0]),
      answered: false,
      selectedIdx: null,
      records: [],
    };
    S.screen = 'quiz';
    update();
  }

  function renderQuizGame() {
    var qz = S.quiz;
    if (!qz) return '<div class="aw-wrap">No active quiz.</div>';
    var q = qz.pool[qz.idx];

    var html = topline('<span>Q ' + (qz.idx + 1) + ' / ' + qz.pool.length + '</span>');
    html += '<div class="aw-game-body">';
    html += '<div class="aw-quiz-topline"><span>' + topicBadge(q.topic) + ' ' + diffBadge(q.difficulty) + '</span><span class="aw-quiz-score">' + qz.records.filter(function (r) { return r.correct; }).length + ' / ' + qz.records.length + ' correct</span></div>';

    html += '<div class="aw-card"><div class="aw-qbody"><p class="aw-qtext">' + esc(q.q) + '</p>';
    html += '<div class="aw-choice-list" style="width:100%;">' + qz.choices.map(function (choice, idx) {
      var cls = 'aw-choice';
      if (qz.answered) {
        if (choice.correct) cls += ' correct';
        else if (idx === qz.selectedIdx) cls += ' wrong';
        else cls += ' dim';
      }
      return '<button type="button" class="' + cls + '" data-action="q-choice" data-idx="' + idx + '"' + (qz.answered ? ' disabled' : '') + '>' + esc(choice.text) + '</button>';
    }).join('') + '</div>';

    if (qz.answered) {
      html += '<div class="aw-answer-block" style="margin-top:0.4rem;"><div class="aw-answer-box">' + esc(q.a) + '</div>' +
        '<div class="aw-pearl-box"><span class="aw-pearl-tag">Pearl</span><p class="aw-pearl-text">' + esc(q.pearl) + '</p></div></div>';
    }
    html += '</div></div>';

    if (qz.answered) {
      var isLast = qz.idx + 1 >= qz.pool.length;
      html += '<button type="button" class="aw-btn aw-btn-primary aw-btn-block aw-btn-lg" data-action="q-next">' + (isLast ? 'See Results →' : 'Next Question →') + '</button>';
    }
    html += '</div>';
    return html;
  }

  function quizAction(name, el) {
    var qz = S.quiz;
    if (!qz) return;
    var q = qz.pool[qz.idx];

    if (name === 'q-choice' && !qz.answered) {
      var idx = +el.dataset.idx;
      qz.answered = true;
      qz.selectedIdx = idx;
      qz.records.push({ question: q, correct: !!qz.choices[idx].correct });
    } else if (name === 'q-next') {
      var next = qz.idx + 1;
      if (next >= qz.pool.length) { finishQuiz(); return; }
      qz.idx = next;
      qz.choices = ENGINE.quiz.buildChoices(qz.pool[next]);
      qz.answered = false;
      qz.selectedIdx = null;
    }
    update();
  }

  function finishQuiz() {
    var qz = S.quiz;
    var summary = ENGINE.quiz.summarize(qz.records);
    qz.summary = summary;
    ENGINE.history.save({
      date: fmtDate(),
      winner: 'You',
      teams: [{ name: 'You', score: summary.right }],
      mode: 'quiz',
    });
    S.screen = 'quiz-results';
    update();
  }

  function renderQuizResults() {
    var qz = S.quiz;
    var s = qz.summary;
    var html = '<div class="aw-wrap">';
    html += '<div class="aw-result-hero"><div class="aw-pct-hero">' + s.pct + '%</div>' +
      '<p class="aw-result-sub">' + s.right + ' / ' + s.total + ' correct · ' + fmtDate() + '</p></div>';

    html += '<div class="aw-section"><p class="aw-label">By Topic</p>';
    TOPICS.forEach(function (t) {
      var bt = s.byTopic[t.id];
      if (!bt) return;
      var pct = bt.total ? Math.round((bt.correct / bt.total) * 100) : 0;
      html += '<div class="aw-bar-row"><span class="aw-bar-label">' + esc(t.short) + '</span>' +
        '<span class="aw-bar-track"><span class="aw-bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="aw-bar-frac">' + bt.correct + '/' + bt.total + '</span></div>';
    });
    html += '</div>';

    if (s.missed.length > 0) {
      html += '<div class="aw-section"><p class="aw-label">Review Missed (' + s.missed.length + ')</p>';
      html += s.missed.map(function (q) {
        var open = S.browse.expandedId === q.id;
        return '<div class="aw-browse-row" data-action="q-review-toggle" data-id="' + q.id + '">' +
          topicBadge(q.topic) + ' ' + diffBadge(q.difficulty) +
          '<p class="aw-browse-q">' + esc(q.q) + '</p>' +
          (open ? '<div class="aw-browse-expand"><div class="aw-answer-box">' + esc(q.a) + '</div><div class="aw-pearl-box"><span class="aw-pearl-tag">Pearl</span><p class="aw-pearl-text">' + esc(q.pearl) + '</p></div></div>' : '') +
          '</div>';
      }).join('');
      html += '</div>';
    }

    html += '<div class="aw-result-actions">' +
      '<button type="button" class="aw-btn aw-btn-primary aw-btn-lg" data-action="q-play-again">Play Again</button>' +
      '<button type="button" class="aw-btn aw-btn-ghost aw-btn-lg" data-action="go-setup">Menu</button>' +
      '</div></div>';
    return html;
  }

  // ─── BROWSE MODE ──────────────────────────────────────────────────

  function renderBrowse() {
    var b = S.browse;
    var diffOrder = { easy: 0, medium: 1, hard: 2 };
    var topicOrder = {};
    TOPICS.forEach(function (t, i) { topicOrder[t.id] = i; });

    var list = QUESTIONS.filter(function (q) {
      if (b.topic !== 'all' && q.topic !== b.topic) return false;
      if (b.difficulty !== 'all' && q.difficulty !== b.difficulty) return false;
      if (b.search) {
        var hay = (q.q + ' ' + q.a + ' ' + q.pearl).toLowerCase();
        if (hay.indexOf(b.search.toLowerCase()) === -1) return false;
      }
      return true;
    });

    list.sort(function (x, y) {
      if (b.sort === 'difficulty') {
        return diffOrder[x.difficulty] - diffOrder[y.difficulty] || topicOrder[x.topic] - topicOrder[y.topic];
      }
      return topicOrder[x.topic] - topicOrder[y.topic] || diffOrder[x.difficulty] - diffOrder[y.difficulty];
    });

    var html = topline('<span>' + QUESTIONS.length + ' total</span>');
    html += '<div class="aw-wrap aw-wrap--wide">';
    html += '<div class="aw-hero" style="margin-bottom:1.1rem;"><h1 class="aw-h1" style="font-size:1.6rem;">Question Bank</h1></div>';

    html += '<div class="aw-browse-controls">';
    html += '<select class="aw-select" data-bind="br-topic"><option value="all"' + (b.topic === 'all' ? ' selected' : '') + '>All topics</option>' +
      TOPICS.map(function (t) { return '<option value="' + t.id + '"' + (b.topic === t.id ? ' selected' : '') + '>' + esc(t.short) + '</option>'; }).join('') + '</select>';
    html += '<select class="aw-select" data-bind="br-diff"><option value="all"' + (b.difficulty === 'all' ? ' selected' : '') + '>All difficulty</option>' +
      DIFF_KEYS.map(function (k) { return '<option value="' + k + '"' + (b.difficulty === k ? ' selected' : '') + '>' + DIFF[k].label + '</option>'; }).join('') + '</select>';
    html += '<select class="aw-select" data-bind="br-sort"><option value="topic"' + (b.sort === 'topic' ? ' selected' : '') + '>Sort: Topic</option>' +
      '<option value="difficulty"' + (b.sort === 'difficulty' ? ' selected' : '') + '>Sort: Difficulty</option></select>';
    html += '<input type="search" class="aw-search" id="browse-search" data-bind="br-search" placeholder="Search questions…" value="' + esc(b.search) + '">';
    html += '</div>';

    html += '<p class="aw-browse-count">' + list.length + ' question' + (list.length === 1 ? '' : 's') + '</p>';

    if (list.length === 0) {
      html += '<p class="aw-empty-note">No questions match these filters.</p>';
    } else {
      html += list.map(function (q) {
        var open = b.expandedId === q.id;
        return '<div class="aw-browse-row" data-action="br-toggle" data-id="' + q.id + '">' +
          topicBadge(q.topic) + ' ' + diffBadge(q.difficulty) +
          '<p class="aw-browse-q">' + esc(q.q) + '</p>' +
          (open ? '<div class="aw-browse-expand"><div class="aw-answer-box">' + esc(q.a) + '</div><div class="aw-pearl-box"><span class="aw-pearl-tag">Pearl</span><p class="aw-pearl-text">' + esc(q.pearl) + '</p></div></div>' : '') +
          '</div>';
      }).join('');
    }
    html += '</div>';
    return html;
  }

  // ─── EVENT DELEGATION ─────────────────────────────────────────────

  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var name = el.dataset.action;

    if (name === 'pick-mode') { S.mode = el.dataset.mode; update(); return; }
    if (name === 'toggle-topic') {
      var id = el.dataset.id;
      if (S.filters.topics.has(id)) { if (S.filters.topics.size > 1) S.filters.topics.delete(id); }
      else S.filters.topics.add(id);
      update(); return;
    }
    if (name === 'toggle-diff') {
      var dId = el.dataset.id;
      if (S.filters.difficulties.has(dId)) { if (S.filters.difficulties.size > 1) S.filters.difficulties.delete(dId); }
      else S.filters.difficulties.add(dId);
      update(); return;
    }
    if (name === 'team-add') {
      if (S.teams.length < 6) { var idx = S.teams.length; S.teams.push(ENGINE.makeTeam('Team ' + (idx + 1), ENGINE.TEAM_COLORS[idx], 't' + idx)); }
      update(); return;
    }
    if (name === 'team-remove') {
      if (S.teams.length > 2) S.teams = S.teams.filter(function (t) { return t.id !== el.dataset.id; });
      update(); return;
    }
    if (name === 'set-end-type') {
      var type = el.dataset.type;
      var value = type === 'count' ? 15 : type === 'score' ? 300 : 0;
      S.endCondition = { type: type, value: value };
      update(); return;
    }
    if (name === 'set-quiz-count') { S.quizCount = +el.dataset.n; update(); return; }
    if (name === 'start-rounds') { startRounds(); return; }
    if (name === 'start-board') { startBoard(); return; }
    if (name === 'start-quiz') { startQuiz(); return; }
    if (name === 'start-browse') { S.screen = 'browse'; update(); return; }
    if (name === 'go-setup') { S.screen = 'setup'; update(); return; }

    if (name === 'r-play-again') { startRounds(); return; }
    if (name === 'b-play-again') { startBoard(); return; }
    if (name === 'q-play-again') { startQuiz(); return; }

    if (name === 'br-toggle') {
      S.browse.expandedId = S.browse.expandedId === el.dataset.id ? null : el.dataset.id;
      update(); return;
    }
    if (name === 'q-review-toggle') {
      S.browse.expandedId = S.browse.expandedId === el.dataset.id ? null : el.dataset.id;
      update(); return;
    }

    if (name.indexOf('r-') === 0) { roundsAction(name, el); return; }
    if (name.indexOf('b-') === 0) { boardAction(name, el); return; }
    if (name.indexOf('q-') === 0) { quizAction(name, el); return; }
  });

  root.addEventListener('input', function (e) {
    var bind = e.target.dataset && e.target.dataset.bind;
    if (!bind) return;
    if (bind === 'team-name') {
      var id = e.target.dataset.id;
      S.teams = S.teams.map(function (t) { return t.id === id ? Object.assign({}, t, { name: e.target.value }) : t; });
      update();
    } else if (bind === 'br-search') {
      S.browse.search = e.target.value;
      update();
    }
  });

  root.addEventListener('change', function (e) {
    var bind = e.target.dataset && e.target.dataset.bind;
    if (!bind) return;
    if (bind === 'end-count') { S.endCondition = { type: 'count', value: +e.target.value }; update(); }
    else if (bind === 'end-score') { S.endCondition = { type: 'score', value: +e.target.value }; update(); }
    else if (bind === 'br-topic') { S.browse.topic = e.target.value; update(); }
    else if (bind === 'br-diff') { S.browse.difficulty = e.target.value; update(); }
    else if (bind === 'br-sort') { S.browse.sort = e.target.value; update(); }
  });

  // ─── INIT ─────────────────────────────────────────────────────────

  render();
})();
