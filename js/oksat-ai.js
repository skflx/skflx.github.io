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
    '   knowledge, and each must be wrong for a stateable reason.',
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
    '      "brief": "…", "detailed": "…", "reference": "…", "concepts": ["<key>"] },',
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
      if (!q.stem) errors.push(tag + ': missing stem.');
      var type = q.type || 'mcq';
      if (type === 'mcq') {
        if (!Array.isArray(q.options) || q.options.length < 3) errors.push(tag + ': needs ≥3 options.');
        else if (!q.options.some(function (o) { return o.id === q.correct; })) errors.push(tag + ': "correct" matches no option id.');
      } else if (type === 'recall') {
        if (!q.answer) errors.push(tag + ': recall item missing answer.');
      } else errors.push(tag + ': unknown type "' + type + '".');
      if (!q.brief) warnings.push(tag + ': no brief explanation.');
      (q.concepts || []).forEach(function (c) {
        if (!concepts[c]) warnings.push(tag + ': concept "' + c + '" not in CONCEPTS.');
      });
    });
    return { ok: !errors.length, errors: errors, warnings: warnings };
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
  };
})();
