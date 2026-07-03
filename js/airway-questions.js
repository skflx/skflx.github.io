/* =============================================================
   airway-questions.js — data only for "Airway Rounds" quiz game.

   AUTO-POPULATED SAMPLE — full ~200-question bank is generated
   separately and will replace the `questions` array below; keep
   the AIRWAY_DATA shape (topics stay fixed, questions get large:
   ~40 per topic — 14 easy / 14 medium / 12 hard each). The UI in
   airway-jeopardy.html and the logic in airway-engine.js must not
   assume a fixed question count — always derive counts, board
   columns, and browse lists from this array at runtime.

   Shape:
     window.AIRWAY_DATA = {
       topics: [ { id, short, label }, ... ],
       questions: [
         { id, topic, difficulty: 'easy'|'medium'|'hard',
           q, a, pearl, choices: [correct, distractor, distractor, distractor] },
         ...
       ]
     };

   choices[0] is ALWAYS the correct choice — shuffle at render time,
   never re-sort or memoize a shuffled copy back into this array.
   ============================================================= */

window.AIRWAY_DATA = {
  topics: [
    { id: 'basics',        short: 'Basics',        label: 'Trach & Laryngectomy Basics' },
    { id: 'emergencies',   short: 'Emergencies',   label: 'Airway Emergencies' },
    { id: 'valves',        short: 'Valves',        label: 'Valves, Cuffs & Suctioning' },
    { id: 'complications', short: 'Complications', label: 'Surgical Complications' },
    { id: 'daily',         short: 'Daily Care',    label: 'Daily Care & Prevention' },
  ],

  questions: [
    // ── BASICS ──
    {
      id: 'ba-01', topic: 'basics', difficulty: 'easy',
      q: 'Before touching any neck airway patient, what is THE single question you must answer?',
      a: 'Is this a partial neck breather (tracheostomy) or a total neck breather (total laryngectomy)? Everything — where you give oxygen, where you bag, whether the mouth works — flows from this distinction.',
      pearl: 'Get the answer at the START of shift, not during the desat.',
      choices: [
        'Is this a partial neck breather (trach) or a total neck breather (laryngectomy)?',
        'What size trach tube is currently in place?',
        'Is the cuff currently up or down?',
        'When was the stoma last suctioned?',
      ],
    },
    {
      id: 'ba-02', topic: 'basics', difficulty: 'medium',
      q: 'Anatomically, why does mouth-to-mouth or face-mask ventilation fail completely on a total laryngectomy patient?',
      a: 'The larynx was surgically removed and the trachea permanently redirected to the skin as a permanent end stoma. The mouth and nose now lead only to the esophagus — there is zero connection to the lungs.',
      pearl: 'Laryngectomy = one route, the stoma, forever.',
      choices: [
        'The larynx is removed and the trachea is permanently rerouted to a neck stoma — mouth/nose only lead to the esophagus',
        'The vocal cords are surgically fused shut',
        'The epiglottis is fixed in the closed position after surgery',
        'The cuff on a laryngectomy tube cannot be deflated',
      ],
    },

    // ── EMERGENCIES ──
    {
      id: 'em-01', topic: 'emergencies', difficulty: 'easy',
      q: 'What are the TWO failure modes behind nearly every tracheostomy emergency?',
      a: 'Obstruction (usually a mucus plug, sometimes blood/clot) and displacement (tube out of the trachea — fully out or into a false passage in pretracheal tissue). Most floor events are obstruction.',
      pearl: '"It\'s plugged or it\'s moved" covers almost everything.',
      choices: [
        'Obstruction (mucus plug) and displacement (tube out of the trachea)',
        'Infection and bleeding',
        'Cuff failure and inadequate humidity',
        'Speaking valve malfunction and stoma stenosis',
      ],
    },
    {
      id: 'em-02', topic: 'emergencies', difficulty: 'medium',
      q: 'After removing the speaking valve, this is the NEXT intervention — NOT suctioning. Name it and explain why it comes before the catheter.',
      a: 'Remove the inner cannula. A plugged inner cannula comes out WITH the plug, instantly clearing the most common obstruction. It also lets you assess true tube patency before passing a suction catheter.',
      pearl: 'Inner cannula out BEFORE you chase the plug with a catheter.',
      choices: [
        'Remove the inner cannula',
        'Deflate the cuff',
        'Change out the entire trach tube',
        'Apply high-flow oxygen to the face',
      ],
    },

    // ── VALVES ──
    {
      id: 'va-01', topic: 'valves', difficulty: 'easy',
      q: 'Before placing ANY speaking valve on a trach patient, what must be true about the cuff?',
      a: 'The cuff must be fully deflated (down). With the cuff inflated, exhaled air has no exit path through the upper airway — breath stacking and suffocation follow.',
      pearl: 'Valve + inflated cuff = a closed system. Cuff down, every time, no exceptions.',
      choices: [
        'The cuff must be fully deflated',
        'The cuff must be fully inflated',
        'The cuff pressure must read exactly 25 cmH₂O',
        'The inner cannula must be removed',
      ],
    },
    {
      id: 'va-02', topic: 'valves', difficulty: 'medium',
      q: 'Does an inflated cuff prevent aspiration? Give a complete answer.',
      a: 'No. It reduces GROSS aspiration and enables positive-pressure ventilation, but it does NOT prevent microaspiration of secretions that track past the cuff. "Cuff up" is not aspiration insurance.',
      pearl: "Cuff up ≠ aspiration-proof. It's a speed bump, not a wall.",
      choices: [
        'No — it reduces gross aspiration but does not stop microaspiration past the cuff',
        'Yes — a fully inflated cuff makes aspiration impossible',
        'Only when combined with a speaking valve',
        'Only in laryngectomy patients, not tracheostomy patients',
      ],
    },

    // ── COMPLICATIONS ──
    {
      id: 'co-01', topic: 'complications', difficulty: 'easy',
      q: 'Name the FIRST subtle signs of an expanding neck hematoma — the ones that appear BEFORE stridor.',
      a: 'Neck tightness or swelling, voice change, difficulty swallowing, and anxiety or restlessness. Stridor is a LATE sign.',
      pearl: "By the time you hear stridor, you're already behind. Restlessness + tight neck is the call.",
      choices: [
        'Neck tightness/swelling, voice change, trouble swallowing, restlessness',
        'Stridor and cyanosis',
        'Fever and an elevated white count',
        'Bradycardia and hypotension',
      ],
    },
    {
      id: 'co-02', topic: 'complications', difficulty: 'medium',
      q: 'A neck drain turns milky/creamy. Name the complication, its anatomical source, and the dietary trigger that worsens output.',
      a: 'Chyle leak — injury to the thoracic duct or lymphatics (classically left neck, level IV, after neck dissection). High-fat diet increases chyle flow and drain output.',
      pearl: 'Milky drain = chyle. Report it AND the diet — fatty meals make it worse.',
      choices: [
        'Chyle leak — thoracic duct/lymphatic injury, worsened by a high-fat diet',
        'Wound infection with purulent drainage',
        'Venous flap congestion draining through the incision',
        'A CSF leak from an unrecognized dural injury',
      ],
    },

    // ── DAILY CARE ──
    {
      id: 'da-01', topic: 'daily', difficulty: 'easy',
      q: 'Why must a trach or laryngectomy patient have active humidification, and what happens overnight without it?',
      a: 'The stoma bypasses the upper airway that normally warms, humidifies, and filters inhaled air. Without it: mucosal drying → impaired ciliary clearance → inspissated secretions → mucus plugging. Overnight desaturations are often the first sign of a brewing plug.',
      pearl: 'Humidification is plug prevention. Skipping it manufactures an airway emergency overnight.',
      choices: [
        'The stoma bypasses the nose/upper airway that normally warms, humidifies, and filters air',
        'It prevents the speaking valve from sticking shut',
        'It keeps cuff pressure stable overnight',
        'It is only needed for laryngectomy patients, not tracheostomy patients',
      ],
    },
    {
      id: 'da-02', topic: 'daily', difficulty: 'medium',
      q: 'HME vs trach collar — what does each do mechanically?',
      a: "HME (Swedish nose): passively traps the patient's exhaled heat and moisture and returns it on the next breath — passive recycling. Trach collar/mask: actively delivers externally humidified oxygen from an external source.",
      pearl: "HME recycles the patient's moisture; the collar supplies it. Both beat dry gas.",
      choices: [
        "HME passively recycles the patient's own exhaled heat/moisture; a collar actively delivers external humidified oxygen",
        'Both actively deliver humidified oxygen from a compressor',
        'HME filters bacteria; the collar filters viruses only',
        'The collar is for laryngectomy patients only; the HME is for tracheostomy patients only',
      ],
    },
  ],
};
