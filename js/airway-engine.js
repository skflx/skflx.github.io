/* =============================================================
   airway-engine.js — pure game logic for "Airway Rounds", the
   Jeopardy-style board game, and Quick Quiz mode. UI-agnostic:
   no DOM access, no localStorage reads outside history.load/save,
   no globals besides window.AirwayEngine. Consumes plain data
   (window.AIRWAY_DATA question objects) passed in by the caller —
   never reaches into window.AIRWAY_DATA itself, so it scales
   automatically when the ~200-question bank replaces the sample.
   ============================================================= */
(function () {
  'use strict';

  // ─── CONSTANTS ────────────────────────────────────────────────────────

  var DIFF = {
    easy:   { label: 'Intern',    pips: 1, pts: 100, penalty:    0, steal:  50 },
    medium: { label: 'Resident',  pips: 2, pts: 200, penalty:  -50, steal: 100 },
    hard:   { label: 'Attending', pips: 3, pts: 400, penalty: -100, steal: 200 },
  };

  var DIFF_ORDER = ['easy', 'medium', 'hard'];

  var TEAM_COLORS = ['cyan', 'rose', 'amber', 'emerald', 'violet', 'orange'];

  // Jeopardy board: 5 cells per topic column, each mapped to a value and
  // the difficulty bucket it draws from. 100/200 both draw 'easy',
  // 300/400 both draw 'medium', 500 draws 'hard'.
  var BOARD_ROWS = [
    { value: 100, difficulty: 'easy' },
    { value: 200, difficulty: 'easy' },
    { value: 300, difficulty: 'medium' },
    { value: 400, difficulty: 'medium' },
    { value: 500, difficulty: 'hard' },
  ];

  var HISTORY_KEY = 'airway-rounds-history';
  var HISTORY_MAX = 10;

  // ─── HELPERS ──────────────────────────────────────────────────────────

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // filters: { topics: Set<string>, difficulties: Set<string> }
  function buildPool(questions, filters) {
    return shuffle(questions.filter(function (q) {
      return filters.topics.has(q.topic) && filters.difficulties.has(q.difficulty);
    }));
  }

  function makeTeam(name, color, id) {
    return { id: id, name: name, color: color, score: 0, streak: 0, correct: 0, wrong: 0, steals: 0 };
  }

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }

  // ─── ROUNDS MODE ──────────────────────────────────────────────────────
  // correct: +pts, streak++, every 3rd consecutive correct adds +50 bonus.
  // wrong: penalty, streak reset, opens a steal window to teams that
  // haven't already missed this question (steal = half pts, no penalty
  // on a failed steal). skip leaves scores untouched.

  var rounds = {
    streakBonus: function (currentStreak) {
      var newStreak = currentStreak + 1;
      return (newStreak > 0 && newStreak % 3 === 0) ? 50 : 0;
    },

    markCorrect: function (team, difficulty) {
      var cfg = DIFF[difficulty];
      var newStreak = team.streak + 1;
      var bonus = (newStreak % 3 === 0) ? 50 : 0;
      return assign({}, team, {
        score: team.score + cfg.pts + bonus,
        streak: newStreak,
        correct: team.correct + 1,
      });
    },

    markWrong: function (team, difficulty) {
      var cfg = DIFF[difficulty];
      return assign({}, team, {
        score: team.score + cfg.penalty,
        streak: 0,
        wrong: team.wrong + 1,
      });
    },

    markStealCorrect: function (team, difficulty) {
      var cfg = DIFF[difficulty];
      return assign({}, team, {
        score: team.score + cfg.steal,
        steals: team.steals + 1,
      });
    },

    // Steal attempts never carry a scoring penalty on a miss.
    markStealWrong: function (team) {
      return assign({}, team);
    },

    availableStealers: function (teams, wrongTeamIds) {
      return teams.filter(function (t) { return wrongTeamIds.indexOf(t.id) === -1; });
    },

    canSteal: function (teams, wrongTeamIds) {
      return rounds.availableStealers(teams, wrongTeamIds).length > 0;
    },

    slicePool: function (pool, endCondition) {
      if (endCondition.type === 'count') {
        return pool.slice(0, Math.min(endCondition.value, pool.length));
      }
      return pool;
    },

    // True once the current question is the last in the pool, or (for
    // 'score' end conditions) once any team has reached the target.
    isFinalQuestion: function (endCondition, teams, queueIdx, poolLength) {
      if (endCondition.type === 'score' && teams.some(function (t) { return t.score >= endCondition.value; })) {
        return true;
      }
      return queueIdx + 1 >= poolLength;
    },
  };

  // ─── JEOPARDY BOARD MODE ──────────────────────────────────────────────
  // Board play: teams take turns picking a cell. Correct = +value, picker
  // keeps control. Wrong = -value, steal opens to the other teams in turn
  // order at FULL value (no penalty on a missed steal). Whoever steals
  // correctly takes control. If nobody steals, control rotates to the
  // next team after the original picker.

  var board = {
    // topicIds: array of 2-5 topic ids in board-column order.
    // pool: pre-filtered question array (already respects the setup filters).
    build: function (topicIds, pool) {
      var byTopicDiff = {};
      topicIds.forEach(function (tid) {
        byTopicDiff[tid] = { easy: [], medium: [], hard: [] };
      });
      pool.forEach(function (q) {
        if (byTopicDiff[q.topic] && byTopicDiff[q.topic][q.difficulty]) {
          byTopicDiff[q.topic][q.difficulty].push(q);
        }
      });

      var used = {};
      function draw(tid, difficulty) {
        var order = [difficulty].concat(DIFF_ORDER.filter(function (d) { return d !== difficulty; }));
        for (var i = 0; i < order.length; i++) {
          var bucket = byTopicDiff[tid][order[i]];
          if (!bucket) continue;
          for (var j = 0; j < bucket.length; j++) {
            if (!used[bucket[j].id]) { used[bucket[j].id] = true; return bucket[j]; }
          }
        }
        return null;
      }

      return topicIds.map(function (tid) {
        var cells = BOARD_ROWS.map(function (row, idx) {
          return {
            id: tid + '-' + idx,
            topic: tid,
            value: row.value,
            difficulty: row.difficulty,
            question: draw(tid, row.difficulty),
            done: false,
          };
        });
        return { topic: tid, cells: cells };
      });
    },

    markCorrect: function (team, value) {
      return assign({}, team, { score: team.score + value, correct: team.correct + 1 });
    },

    markWrong: function (team, value) {
      return assign({}, team, { score: team.score - value, wrong: team.wrong + 1 });
    },

    markStealCorrect: function (team, value) {
      return assign({}, team, { score: team.score + value, steals: team.steals + 1 });
    },

    availableStealers: function (teams, excludeId, wrongTeamIds) {
      return teams.filter(function (t) {
        return t.id !== excludeId && wrongTeamIds.indexOf(t.id) === -1;
      });
    },

    nextControlIndex: function (teamCount, currentIndex) {
      return (currentIndex + 1) % teamCount;
    },

    isExhausted: function (columns) {
      return columns.every(function (col) {
        return col.cells.every(function (c) { return c.done || !c.question; });
      });
    },

    remainingCells: function (columns) {
      var n = 0;
      columns.forEach(function (col) {
        col.cells.forEach(function (c) { if (!c.done && c.question) n++; });
      });
      return n;
    },
  };

  // ─── QUICK QUIZ MODE ──────────────────────────────────────────────────
  // Solo MCQ. Per-question correct/incorrect tracking, final % and a
  // per-topic breakdown.

  var quiz = {
    // Returns [{ text, correct }] in randomized order.
    buildChoices: function (question) {
      return shuffle(question.choices.map(function (text, idx) {
        return { text: text, correct: idx === 0 };
      }));
    },

    // records: [{ question, correct }]
    summarize: function (records) {
      var total = records.length;
      var right = records.filter(function (r) { return r.correct; }).length;
      var pct = total ? Math.round((right / total) * 100) : 0;

      var byTopic = {};
      records.forEach(function (r) {
        var t = r.question.topic;
        if (!byTopic[t]) byTopic[t] = { total: 0, correct: 0 };
        byTopic[t].total++;
        if (r.correct) byTopic[t].correct++;
      });

      var missed = records.filter(function (r) { return !r.correct; }).map(function (r) { return r.question; });

      return { total: total, right: right, pct: pct, byTopic: byTopic, missed: missed };
    },
  };

  // ─── SESSION HISTORY ──────────────────────────────────────────────────
  // Shared key across all modes: 'airway-rounds-history'. Shape:
  // { date, winner, teams: [{ name, score }], mode }

  var history = {
    load: function () {
      try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
      catch (e) { return []; }
    },
    save: function (session) {
      try {
        var h = history.load();
        h.unshift(session);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, HISTORY_MAX)));
      } catch (e) { /* no-op: private browsing / quota */ }
    },
  };

  // ─── EXPORT ───────────────────────────────────────────────────────────

  window.AirwayEngine = {
    DIFF: DIFF,
    DIFF_ORDER: DIFF_ORDER,
    TEAM_COLORS: TEAM_COLORS,
    BOARD_ROWS: BOARD_ROWS,
    HISTORY_KEY: HISTORY_KEY,
    shuffle: shuffle,
    buildPool: buildPool,
    makeTeam: makeTeam,
    rounds: rounds,
    board: board,
    quiz: quiz,
    history: history,
  };
})();
