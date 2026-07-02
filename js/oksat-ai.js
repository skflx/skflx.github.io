/* =============================================================
   OKSAT AI — Gemini key management + question generation.
   The Google AI Studio API key is stored ONLY in this browser's
   localStorage (oksat:gemini-key) — never in the repo, never in
   data/oksat-db.json, never sent anywhere except to Google's API.
   Same trust model as the KAG extractor's key handling.

   The house style below is part of the program on purpose: every
   generation call carries it as the system instruction, so output
   lands in the exact voice and structure the study modules use.
   ============================================================= */
(function () {
  var KEY = 'oksat:gemini-key';
  var MODEL_KEY = 'oksat:gemini-model';
  var MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

  /* ---------------------------------------------------------
     THE HOUSE STYLE — how OKSAT questions are written.
     ADDING TO THIS BLOCK CHANGES EVERY FUTURE GENERATED MODULE.
     --------------------------------------------------------- */
  var HOUSE_STYLE = [
    'You write board-style self-assessment items for an Otolaryngology-Head & Neck',
    'Surgery resident (OTE / ABOto written level). Items must TEACH, not merely test.',
    '',
    'PRINCIPLES',
    '1. Mechanism → application → pearl. Every item tests a RELATIONSHIP (why/what',
    '   happens next/what breaks if), never an isolated fact.',
    '2. Stress-test framing: each item exposes one precise failure mode — an adjacent',
    '   structure confusion, a classification threshold, a look-alike diagnosis, a',
    '   next-step-in-management trap. Name that failure mode to yourself before',
    '   writing the distractors, then build the distractors from it.',
    '3. Never telegraph the answer in the stem (no length cues, no grammar cues, no',
    '   "always/never"). All distractors must be plausible to someone with partial',
    '   knowledge, and each must be wrong for a stateable reason. For every mcq, also',
    '   emit "distractorNotes": an object mapping each INCORRECT option id to one',
    '   sentence naming why that distractor tempts a partial-knowledge reader and the',
    '   precise reason it is wrong.',
    '4. Anatomy is asked as spatial relationships first ("immediately deep to…",',
    '   "crossing between X and Y"), labels second.',
    '5. Spell out every acronym at first use in each item, e.g. "superior',
    '   semicircular canal dehiscence (SSCD)".',
    '6. Prefer clinical vignettes: age, presentation, the load-bearing findings,',
    '   then the decision point. Keep stems lean — no decorative history.',
    '7. Mix item types: multiple-choice ("mcq", 4-5 options) for discrimination;',
    '   free-response ("recall") for synthesis, thresholds, plans, and decision',
    '   trees the learner should produce unprompted.',
    '8. Explanations do the teaching:',
    '   - "brief": 1-3 sentences — why the right answer is right, mechanism first.',
    '   - "detailed": the full lesson — mechanism, clinical application, why each',
    '     distractor fails (name them), adjacent traps, and end with ONE high-yield',
    '     retention pearl.',
    '9. If the source text identifies its origin (chapter, guideline, recommendation',
    '   number), cite it in "reference"; otherwise omit the field.',
    '10. Original wording only. Never reproduce copyrighted passages; restate.',
    '11. Ground every item in the supplied source text. If the source is thin on a',
    '    point, stay within standard board knowledge — do not invent thresholds.',
    '',
    'TAXONOMY',
    'Derive 4-8 DOMAINS (thematic groups) and 1-3 concept tags per item. Concepts',
    'are reused across items so related questions interlink — prefer reusing an',
    'existing tag over minting a near-duplicate.',
    '',
    'OUTPUT — return ONLY valid JSON (no markdown fences, no prose) shaped exactly:',
    '{',
    '  "meta": { "title": "Two\\nLines", "subtitle": "…", "kicker": "Self-Assessment · <Topic>" },',
    '  "DOMAINS": { "<key>": { "label": "…" } },',
    '  "CONCEPTS": { "<key>": { "label": "…", "domain": "<DOMAINS key>" } },',
    '  "ITEMS": [',
    '    { "id": "q1", "type": "mcq", "section": "…", "difficulty": "easy|medium|hard",',
    '      "stem": "…", "options": [ { "id": "a", "text": "…" } ], "correct": "a",',
    '      "brief": "…", "detailed": "…", "reference": "…",',
    '      "distractorNotes": { "b": "why b tempts and why it is wrong" },',
    '      "concepts": ["<key>"] },',
    '    { "id": "q2", "type": "recall", "stem": "…", "answer": "…",',
    '      "brief": "…", "detailed": "…", "concepts": ["<key>"] }',
    '  ]',
    '}',
    'Rules: ids are q1..qN in order; every "correct" matches an option id; every',
    'concept tag exists in CONCEPTS; every CONCEPTS.domain exists in DOMAINS;',
    '"\\n" inside strings may be used for short lists inside stems/answers.',
  ].join('\n');

  function getKey() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function setKey(k) {
    try { k ? localStorage.setItem(KEY, k.trim()) : localStorage.removeItem(KEY); } catch (e) {}
  }
  function getModel() {
    try { var m = localStorage.getItem(MODEL_KEY); return MODELS.indexOf(m) !== -1 ? m : MODELS[0]; }
    catch (e) { return MODELS[0]; }
  }
  function setModel(m) { try { localStorage.setItem(MODEL_KEY, m); } catch (e) {} }

  function endpoint(model, key) {
    return 'https://generativelanguage.googleapis.com/v1beta/models/' + model +
      ':generateContent?key=' + encodeURIComponent(key);
  }

  /* Cheap connectivity probe — one tiny generation. */
  function testKey(key) {
    return fetch(endpoint('gemini-2.0-flash', key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the single word: ok' }] }] }),
    }).then(function (r) {
      if (r.ok) return true;
      return r.json().catch(function () { return {}; }).then(function (j) {
        throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
      });
    });
  }

  /* Strip accidental ```json fences, then parse. */
  function parseJSON(text) {
    var t = String(text || '').trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '');
    return JSON.parse(t);
  }

  /* One full module generation. Returns the parsed module object. */
  function generateModule(opts) {
    var key = getKey();
    if (!key) return Promise.reject(new Error('No Gemini API key attached — add one in Settings.'));
    var model = opts.model || getModel();

    var user = [
      'Generate a complete OKSAT study module from the source text below.',
      '',
      'Module title: ' + (opts.title || 'Untitled module'),
      'Subspecialty context: ' + (opts.subspecialty || 'general otolaryngology'),
      'Item count: ' + (opts.count || 20),
      'Item mix: ' + (opts.mix || 'about 70% mcq / 30% recall'),
      'Difficulty focus: ' + (opts.difficulty || 'mixed — foundational recall through attending-level traps'),
      opts.notes ? 'Author notes: ' + opts.notes : '',
      '',
      '--- SOURCE TEXT START ---',
      opts.source || '',
      '--- SOURCE TEXT END ---',
    ].join('\n');

    var body = {
      systemInstruction: { parts: [{ text: HOUSE_STYLE }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.65,
        maxOutputTokens: 32768,
      },
    };

    function call(nudge) {
      var b = nudge
        ? Object.assign({}, body, { contents: [{ role: 'user', parts: [{ text: user + '\n\nReturn ONLY raw JSON matching the schema. No fences, no commentary.' }] }] })
        : body;
      return fetch(endpoint(model, key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
      }).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error((j.error && j.error.message) || ('Gemini HTTP ' + r.status));
        });
        return r.json();
      }).then(function (data) {
        var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
        var text = parts.map(function (p) { return p.text || ''; }).join('');
        if (!text) throw new Error('Empty response from Gemini.');
        return parseJSON(text);
      });
    }

    // One retry with a "raw JSON only" nudge before surfacing the error.
    return call(false).catch(function () { return call(true); });
  }

  /* Validate a generated module against what the engine expects.
     Returns { ok, errors: [...], warnings: [...] }. */
  function validateModule(mod) {
    var errors = [], warnings = [];
    if (!mod || typeof mod !== 'object') return { ok: false, errors: ['Not an object.'], warnings: [] };
    var items = mod.ITEMS;
    if (!Array.isArray(items) || !items.length) errors.push('ITEMS must be a non-empty array.');
    var domains = mod.DOMAINS || {}, concepts = mod.CONCEPTS || {};
    Object.keys(concepts).forEach(function (c) {
      if (!domains[concepts[c].domain]) errors.push('Concept "' + c + '" points at missing domain "' + concepts[c].domain + '".');
    });
    var seen = {};
    (items || []).forEach(function (q, i) {
      var tag = 'Item ' + (q.id || '#' + (i + 1));
      if (!q.id) errors.push(tag + ': missing id.');
      else if (seen[q.id]) errors.push(tag + ': duplicate id.');
      seen[q.id] = 1;
      var type = q.type || 'mcq';
      validateItem(q).errors.forEach(function (m) { errors.push(tag + ': ' + m); });
      if (type === 'mcq' && (!q.distractorNotes || typeof q.distractorNotes !== 'object' || !Object.keys(q.distractorNotes).length)) {
        warnings.push(tag + ': no distractorNotes (per-distractor teaching).');
      }
      if (!q.brief) warnings.push(tag + ': no brief explanation.');
      (q.concepts || []).forEach(function (c) {
        if (!concepts[c]) warnings.push(tag + ': concept "' + c + '" not in CONCEPTS.');
      });
    });
    return { ok: !errors.length, errors: errors, warnings: warnings };
  }

  /* ---------------------------------------------------------
     RUNTIME SINGLE-ITEM GENERATION (Phase 4)
     The adaptive page (oksat-adaptive.html) generates one question
     at a time. Same house style + transport as the Forge, but a
     single-object schema, a difficulty target, an AVOID list, and
     optional grounding excerpts from a built module.
     --------------------------------------------------------- */

  /* Per-item structural checks, shared with validateModule (bare messages). */
  function validateItem(q) {
    if (!q || typeof q !== 'object') return { ok: false, errors: ['not an object.'] };
    var errors = [];
    if (!q.stem) errors.push('missing stem.');
    var type = q.type || 'mcq';
    if (type === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length < 3) errors.push('needs ≥3 options.');
      else if (!q.options.some(function (o) { return o.id === q.correct; })) errors.push('"correct" matches no option id.');
    } else if (type === 'recall') {
      if (!q.answer) errors.push('recall item missing answer.');
    } else errors.push('unknown type "' + type + '".');
    return { ok: !errors.length, errors: errors };
  }

  var SINGLE_ITEM_STYLE = [
    '',
    'SINGLE-ITEM MODE',
    'You are generating ONE item, not a module. Return ONLY one JSON object — no',
    'markdown fences, no prose — shaped exactly:',
    '{',
    '  "type": "mcq" | "recall",',
    '  "stem": "…",',
    '  "options": [ { "id": "a", "text": "…" } ],   // mcq only, 4-5 options',
    '  "correct": "a",                               // mcq only, matches an option id',
    '  "answer": "…",                                // recall only',
    '  "brief": "…",',
    '  "detailed": "…",',
    '  "distractorNotes": { "b": "why b tempts and why it is wrong" },  // mcq: every incorrect option',
    '  "difficulty": "easy" | "medium" | "hard"',
    '}',
    'No "id", no "concepts", no "meta" — the caller assigns those. Obey every',
    'house-style PRINCIPLE above. Do NOT repeat any stem listed under AVOID.',
  ].join('\n');

  var LEVEL_PHRASE = {
    1: 'foundational recall',
    2: 'applied recall',
    3: 'clinical application',
    4: 'multi-step reasoning / adjacent-structure discrimination',
    5: 'attending-level edge case / decision-tree trap',
  };

  /* One generation may be in flight at a time (the adaptive UI also
     disables Next, but this guarantees it at the source). */
  var itemInFlight = false;

  function callGemini(model, key, sysText, userText, cfg) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 45000) : null;
    var body = { contents: [{ role: 'user', parts: [{ text: userText }] }], generationConfig: cfg };
    if (sysText) body.systemInstruction = { parts: [{ text: sysText }] };
    return fetch(endpoint(model, key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
        throw new Error((j.error && j.error.message) || ('Gemini HTTP ' + r.status));
      });
      return r.json();
    }, function (err) {
      if (timer) clearTimeout(timer);
      if (err && err.name === 'AbortError') throw new Error('Timed out — try again.');
      throw new Error('Network error — check your connection.');
    }).then(function (data) {
      var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      var text = parts.map(function (p) { return p.text || ''; }).join('');
      if (!text) throw new Error('Empty response from Gemini.');
      return text;
    });
  }

  /* Generate ONE raw item. opts = { topic:{id,label,subspecialty,difficultyBand},
     level:1-5, type:'mcq'|'recall'|'auto', avoidStems:[], grounding:string|null, model? }. */
  function generateItem(opts) {
    opts = opts || {};
    var key = getKey();
    if (!key) return Promise.reject(new Error('No Gemini API key attached — add one in Settings.'));
    if (itemInFlight) return Promise.reject(new Error('A question is already being generated.'));
    var model = opts.model || getModel();
    var topic = opts.topic || {};
    var level = Math.max(1, Math.min(5, opts.level || 3));
    var sub = (window.OKSAT_SUBSPECIALTIES || {})[topic.subspecialty];
    var typeLine = opts.type === 'mcq' ? 'multiple-choice (mcq)'
      : opts.type === 'recall' ? 'free-response (recall)'
      : 'your choice — mcq or recall, whichever best tests this point';
    var avoid = (opts.avoidStems || []).filter(Boolean).slice(0, 8)
      .map(function (s) { return '- ' + String(s).slice(0, 120); });

    var user = [
      'Generate ONE board-style OKSAT self-assessment item.',
      'Topic: ' + (topic.label || 'general otolaryngology') + (sub ? '  (subspecialty: ' + sub.label + ')' : ''),
      'Target difficulty: level ' + level + '/5 — ' + (LEVEL_PHRASE[level] || 'clinical application') + '.',
      'Item type: ' + typeLine + '.',
      avoid.length ? ('AVOID repeating any of these stems already asked this session:\n' + avoid.join('\n')) : '',
      opts.grounding ? ('\n--- REFERENCE EXCERPTS (ground the item in these; restate, do not copy) ---\n' + opts.grounding) : '',
    ].filter(Boolean).join('\n');

    var sys = HOUSE_STYLE + '\n\n' + SINGLE_ITEM_STYLE;
    var cfg = { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 4096 };

    function attempt(nudge) {
      var u = nudge ? user + '\n\nReturn ONLY the raw JSON object. No fences, no commentary.' : user;
      return callGemini(model, key, sys, u, cfg).then(parseJSON);
    }

    itemInFlight = true;
    // One retry with a "raw JSON only" nudge on parse/format failure.
    return attempt(false).catch(function () { return attempt(true); })
      .then(function (v) { itemInFlight = false; return v; },
            function (e) { itemInFlight = false; throw e; });
  }

  /* Raw generated object → engine item shape. Returns { ok, item?, error? }.
     Generated ids carry a 'gen:' prefix so nothing downstream mistakes them
     for a module's stable q-ids (they must never enter oksat:srs:*). */
  function normalizeGeneratedItem(raw, topic, seq) {
    try {
      if (!raw || typeof raw !== 'object') return { ok: false, error: 'Not an object.' };
      topic = topic || {};
      var type = raw.type === 'recall' ? 'recall' : 'mcq';
      var item = {
        id: 'gen:' + (topic.id || 'topic') + ':' + Date.now() + ':' + (seq || 0),
        type: type,
        stem: String(raw.stem || '').trim(),
        brief: raw.brief ? String(raw.brief) : '',
        detailed: raw.detailed ? String(raw.detailed) : '',
        concepts: [topic.id].filter(Boolean),
        section: topic.label || undefined,
        topicId: topic.id,
        generated: true,
      };
      if (raw.difficulty) item.difficulty = raw.difficulty;
      if (type === 'mcq') {
        var letters = ['a', 'b', 'c', 'd', 'e', 'f'];
        var src = Array.isArray(raw.options) ? raw.options : [];
        var idMap = {}, options = [];
        src.forEach(function (o, i) {
          if (options.length >= letters.length) return;
          var text = String((o && (o.text != null ? o.text : o)) || '').trim();
          if (!text) return;
          var newId = letters[options.length];
          var oldId = (o && o.id != null) ? String(o.id) : letters[i];
          idMap[oldId] = newId; idMap[oldId.toLowerCase()] = newId;
          options.push({ id: newId, text: text });
        });
        item.options = options;
        var oldCorrect = raw.correct != null ? String(raw.correct) : '';
        item.correct = idMap[oldCorrect] || idMap[oldCorrect.toLowerCase()] || '';
        if (raw.distractorNotes && typeof raw.distractorNotes === 'object') {
          var dn = {};
          Object.keys(raw.distractorNotes).forEach(function (k) {
            var nk = idMap[k] || idMap[String(k).toLowerCase()];
            if (nk && nk !== item.correct) dn[nk] = String(raw.distractorNotes[k]);
          });
          if (Object.keys(dn).length) item.distractorNotes = dn;
        }
      } else {
        item.answer = String(raw.answer || '').trim();
      }
      var v = validateItem(item);
      if (!v.ok) return { ok: false, error: v.errors.join(' ') };
      return { ok: true, item: item };
    } catch (e) {
      return { ok: false, error: (e && e.message) || 'normalization failed.' };
    }
  }

  /* Grade a free-text answer. Resolves { verdict, feedback }; may reject
     (caller falls back to self-grading). */
  function gradeFreeResponse(q) {
    q = q || {};
    var key = getKey();
    if (!key) return Promise.reject(new Error('No Gemini API key attached.'));
    var prompt = [
      'Grade a resident\'s free-text answer against the model answer.',
      'Be strict on load-bearing facts, lenient on wording, synonyms, and order.',
      'Return ONLY JSON: {"verdict":"correct"|"partial"|"incorrect","feedback":"1-2 sentences"}.',
      '',
      'QUESTION: ' + (q.stem || ''),
      'MODEL ANSWER: ' + (q.modelAnswer || ''),
      'RESIDENT ANSWER: ' + (q.userAnswer || ''),
    ].join('\n');
    return callGemini(getModel(), key, null, prompt, {
      responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 512,
    }).then(parseJSON).then(function (o) {
      var verdict = /^(correct|partial|incorrect)$/.test(o.verdict) ? o.verdict : 'partial';
      return { verdict: verdict, feedback: String(o.feedback || '') };
    });
  }

  window.OKSATAI = {
    MODELS: MODELS,
    HOUSE_STYLE: HOUSE_STYLE,
    getKey: getKey,
    setKey: setKey,
    hasKey: function () { return !!getKey(); },
    getModel: getModel,
    setModel: setModel,
    testKey: testKey,
    generateModule: generateModule,
    validateModule: validateModule,
    validateItem: validateItem,
    generateItem: generateItem,
    normalizeGeneratedItem: normalizeGeneratedItem,
    gradeFreeResponse: gradeFreeResponse,
  };
})();
