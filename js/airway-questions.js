/* =============================================================
   airway-questions.js — data only for "Airway Rounds" quiz game.

   Question bank: 200 questions, 40 per topic
   (14 easy / 14 medium / 12 hard each).
   Generated from the original vetted bank + NTSP / ATS / AACN /
   StatPearls-verified nursing tracheostomy & laryngectomy guidance.

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
    {
      "id": "ba-01",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What does it mean to call a tracheostomy patient a \"partial neck breather\"?",
      "a": "Their upper airway (nose, mouth, throat) is still anatomically connected to their lungs, so air can potentially move through both the neck stoma and the natural airway, even though they breathe primarily through the tube.",
      "pearl": "Partial neck breather = the old route is still there, even if it isn't being used right now.",
      "choices": [
        "Upper airway still connects to the lungs",
        "Upper airway is permanently sealed off",
        "They breathe only through the mouth",
        "They have no tracheostomy tube in place"
      ]
    },
    {
      "id": "ba-02",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What does it mean to call a total laryngectomy patient a \"total neck breather\"?",
      "a": "The larynx and the connection between the upper airway and the trachea have been surgically removed, so 100% of their breathing happens through the neck stoma — there is no other way in or out of the lungs.",
      "pearl": "Total neck breather = the stoma is not an option among options, it is the only option.",
      "choices": [
        "100% of breathing occurs through the stoma",
        "They still breathe partly through the nose",
        "Their trach tube can be removed at will",
        "Their mouth is their main airway"
      ]
    },
    {
      "id": "ba-03",
      "topic": "basics",
      "difficulty": "easy",
      "q": "A tracheostomy (partial neck breather) patient desaturates. Which route(s) can you use to give oxygen?",
      "a": "Both the face and the stoma are viable routes — apply oxygen to whichever is accessible, or both, since the upper airway is still connected to the lungs.",
      "pearl": "Trach patient desats: two routes in play, face and stoma.",
      "choices": [
        "Face and stoma, either or both",
        "Stoma only, never the face",
        "Face only, never the stoma",
        "Neither — bag immediately instead"
      ]
    },
    {
      "id": "ba-04",
      "topic": "basics",
      "difficulty": "easy",
      "q": "A total laryngectomy patient desaturates. Which route MUST you use to deliver oxygen?",
      "a": "The stoma only. There is no connection between the mouth/nose and the lungs, so the stoma is the sole entry point for air.",
      "pearl": "For a laryngectomy, the stoma isn't the preferred route — it's the only route.",
      "choices": [
        "Stoma only",
        "Face mask only",
        "Nasal cannula only",
        "Either face or stoma"
      ]
    },
    {
      "id": "ba-05",
      "topic": "basics",
      "difficulty": "easy",
      "q": "Before touching any neck-airway patient, what is the single question you must answer first?",
      "a": "Is this a partial neck breather (tracheostomy) or a total neck breather (total laryngectomy)? Every decision about oxygen and ventilation routes depends on the answer.",
      "pearl": "Ask it at the start of shift, not during the desat.",
      "choices": [
        "Is this patient a tracheostomy or a laryngectomy?",
        "What size is the trach tube?",
        "When was the tube last changed?",
        "Is the cuff currently inflated?"
      ]
    },
    {
      "id": "ba-06",
      "topic": "basics",
      "difficulty": "easy",
      "q": "You are unsure whether a crashing neck-airway patient is a tracheostomy or a laryngectomy. What is the single safest immediate action for oxygen delivery?",
      "a": "Apply oxygen to both the face and the stoma at the same time. Covering both routes is never wrong when the airway type is unknown, and it buys time to confirm the surgical history.",
      "pearl": "When in doubt, oxygenate both — you cannot harm a patient by also covering the stoma.",
      "choices": [
        "Apply oxygen to both the face and the stoma",
        "Apply oxygen to the face only until confirmed",
        "Apply oxygen to the stoma only until confirmed",
        "Withhold oxygen until the chart is checked"
      ]
    },
    {
      "id": "ba-07",
      "topic": "basics",
      "difficulty": "easy",
      "q": "During a total laryngectomy, what does the surgeon do with the trachea?",
      "a": "The trachea is divided and the cut end is sutured directly to the skin of the neck, creating a permanent stoma that is the patient's only airway.",
      "pearl": "The trachea doesn't just poke through the skin after a laryngectomy — it's sewn to it, permanently.",
      "choices": [
        "Sutures the tracheal stump to the neck skin as a permanent stoma",
        "Leaves the trachea connected to the pharynx as before",
        "Removes the trachea entirely",
        "Connects the trachea to the esophagus"
      ]
    },
    {
      "id": "ba-08",
      "topic": "basics",
      "difficulty": "easy",
      "q": "After a total laryngectomy, where do the mouth and nose now lead?",
      "a": "Only to the esophagus. Swallowed food and saliva still pass through the mouth and throat into the esophagus, but there is no longer any connection to the airway.",
      "pearl": "Post-laryngectomy, the mouth is a one-way street to the stomach — the airway exit is gone.",
      "choices": [
        "The esophagus only",
        "The trachea, as before surgery",
        "Both the trachea and esophagus",
        "Nowhere — the pathway is sealed shut"
      ]
    },
    {
      "id": "ba-09",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What is the outer cannula of a tracheostomy tube?",
      "a": "The main, outer tube that sits in the stoma and trachea for the entire time the tracheostomy is in place — it is the structural airway conduit that everything else (inner cannula, cuff) fits inside or around.",
      "pearl": "The outer cannula is the tube that never comes out between tube changes.",
      "choices": [
        "The main tube that stays in the trachea at all times",
        "A removable liner that can be taken out and cleaned",
        "The rigid guide used only during insertion",
        "The balloon that seals the airway"
      ]
    },
    {
      "id": "ba-10",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What is the inner cannula of a tracheostomy tube?",
      "a": "A removable liner that sits inside the outer cannula and can be taken out for cleaning or replacement, letting the airway be cleared of secretions without removing the whole tube.",
      "pearl": "Inner cannula out, plug out — without ever disturbing the outer tube.",
      "choices": [
        "A removable liner that can be taken out and cleaned",
        "The main tube that stays in the trachea at all times",
        "The balloon that seals the airway",
        "The plate that sits against the neck skin"
      ]
    },
    {
      "id": "ba-11",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What is the obturator used for on a tracheostomy tube?",
      "a": "A smooth, rounded rigid guide inserted inside the outer cannula only during tube insertion, to give the tip a blunt, atraumatic leading edge as it passes into the trachea.",
      "pearl": "The obturator's whole job is to make the tip smooth going in — then it comes right back out.",
      "choices": [
        "A smooth guide used to insert the tube atraumatically",
        "A balloon that seals the trachea around the tube",
        "The strap that secures the tube to the neck",
        "A removable liner used for daily cleaning"
      ]
    },
    {
      "id": "ba-12",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What does the cuff of a tracheostomy tube do when inflated?",
      "a": "It forms a seal against the tracheal wall around the outer cannula, which allows positive-pressure ventilation and reduces (but does not eliminate) gross aspiration around the tube.",
      "pearl": "Cuff up seals the trachea around the tube — not a perfect seal, but a real one.",
      "choices": [
        "Seals against the tracheal wall around the tube",
        "Filters and humidifies inhaled air",
        "Holds the tube against the neck skin",
        "Guides the tube in during insertion"
      ]
    },
    {
      "id": "ba-13",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What is the pilot balloon for on a cuffed tracheostomy tube?",
      "a": "It is the small external balloon connected by a thin tube to the cuff — inflating or deflating the pilot balloon inflates or deflates the cuff, and its feel gives an external clue to whether the cuff still holds air.",
      "pearl": "The pilot balloon is your window into a cuff you can't see.",
      "choices": [
        "An external indicator and control point for the cuff",
        "The main airway tube itself",
        "A humidification filter",
        "A rigid guide used during insertion"
      ]
    },
    {
      "id": "ba-14",
      "topic": "basics",
      "difficulty": "easy",
      "q": "What does an HME (heat and moisture exchanger) do for a tracheostomy or laryngectomy patient?",
      "a": "It passively captures the warmth and moisture in the patient's exhaled breath and returns it on the next inhalation, warming, humidifying, and filtering the air that would otherwise bypass the nose entirely.",
      "pearl": "The HME recycles the breath the patient just gave it.",
      "choices": [
        "Warms, humidifies, and filters inhaled air by recycling exhaled breath",
        "Delivers supplemental oxygen at a fixed concentration",
        "Suctions secretions automatically between nursing visits",
        "Inflates the cuff to a preset pressure"
      ]
    },
    {
      "id": "ba-15",
      "topic": "basics",
      "difficulty": "medium",
      "q": "What is the flange (or faceplate) of a tracheostomy tube?",
      "a": "The flat plate that sits against the neck skin where the tube exits the stoma — it's where the securing ties or straps attach to hold the tube in place.",
      "pearl": "The flange is the anchor point where the tube meets the outside world.",
      "choices": [
        "The flat plate against the neck skin that anchors the ties",
        "The removable inner liner",
        "The balloon that seals the trachea",
        "The rigid insertion guide"
      ]
    },
    {
      "id": "ba-16",
      "topic": "basics",
      "difficulty": "medium",
      "q": "What is the job of the tracheostomy ties (or straps)?",
      "a": "They secure the flange (and therefore the whole tube) around the patient's neck, preventing accidental displacement or complete decannulation.",
      "pearl": "Ties are the last line of defense against a tube ending up on the pillow instead of the trachea.",
      "choices": [
        "Secure the tube in place to prevent accidental displacement",
        "Seal the airway during ventilation",
        "Filter and humidify inhaled air",
        "Guide the tube in during insertion"
      ]
    },
    {
      "id": "ba-17",
      "topic": "basics",
      "difficulty": "medium",
      "q": "In one anatomical sentence, why does oxygen applied to the face do nothing for a total laryngectomy patient?",
      "a": "The airway was surgically disconnected from the mouth and nose during laryngectomy, so oxygen at the face has no path down to the lungs — it just flows over a dead-end passage to the esophagus.",
      "pearl": "Face O2 on a laryngectomy patient has nowhere to go — the road was torn out.",
      "choices": [
        "No anatomical path from mouth/nose to the lungs exists",
        "The oxygen concentration is too low at the face",
        "Laryngectomy patients cannot tolerate nasal cannulas",
        "Their lungs no longer require external oxygen"
      ]
    },
    {
      "id": "ba-18",
      "topic": "basics",
      "difficulty": "medium",
      "q": "During resuscitation of a laryngectomy patient, where do you seal the bag-mask to ventilate them?",
      "a": "Directly over the stoma, using an appropriately sized mask (often a pediatric mask) sealed against the neck — never over the face, since the mouth and nose no longer connect to the lungs.",
      "pearl": "Laryngectomy code: the stoma is the face of the airway now.",
      "choices": [
        "Over the stoma",
        "Over the mouth and nose",
        "Over the mouth only, nose occluded",
        "Split — half the breaths to each route"
      ]
    },
    {
      "id": "ba-19",
      "topic": "basics",
      "difficulty": "medium",
      "q": "Why is confirming \"trach vs. laryngectomy\" at the start of shift better than trying to work it out during a crisis?",
      "a": "An emergency leaves no time for chart review or investigation — knowing the answer in advance means the correct oxygen and ventilation route is already decided before a desaturation ever happens.",
      "pearl": "The best time to answer the airway question is before you need the answer.",
      "choices": [
        "It removes the need to think under pressure during an emergency",
        "It is required only for billing purposes",
        "It only matters for the speech therapy consult",
        "It has no real urgency since both routes always work"
      ]
    },
    {
      "id": "ba-20",
      "topic": "basics",
      "difficulty": "medium",
      "q": "At the bedside, what visual clue can suggest a patient is a total laryngectomy rather than a tracheostomy, and why must you still confirm it another way?",
      "a": "A stoma with no tube in place and a mature, skin-lined opening can suggest laryngectomy, since many laryngectomy stomas stay open without a tube — but some laryngectomy patients do wear a tube or button, and some tracheostomy patients are between tube changes, so the visual alone is not reliable enough to act on without confirming via chart, signage, or handoff.",
      "pearl": "A tubeless stoma is a clue, not a diagnosis — confirm it, don't guess it.",
      "choices": [
        "A tubeless, mature stoma suggests it, but must still be confirmed",
        "A visible trach tube always means laryngectomy",
        "Stoma color reliably distinguishes the two",
        "There is no visual clue — imaging is required"
      ]
    },
    {
      "id": "ba-21",
      "topic": "basics",
      "difficulty": "medium",
      "q": "What is the basic difference between a cuffed and an uncuffed tracheostomy tube?",
      "a": "A cuffed tube has an inflatable balloon around the outer cannula that can seal the trachea for positive-pressure ventilation; an uncuffed tube has no balloon and always allows some airflow around the tube.",
      "pearl": "Cuff present = sealable airway; cuff absent = always some leak around the tube.",
      "choices": [
        "Cuffed has a sealing balloon; uncuffed does not",
        "Cuffed is smaller in diameter than uncuffed",
        "Uncuffed tubes are only used for laryngectomy patients",
        "Cuffed tubes have no inner cannula"
      ]
    },
    {
      "id": "ba-22",
      "topic": "basics",
      "difficulty": "medium",
      "q": "Why would a patient be maintained on an uncuffed tracheostomy tube rather than a cuffed one?",
      "a": "Uncuffed tubes are typically used for stable patients who don't need positive-pressure ventilation and who benefit from airflow around the tube up through the vocal cords for speech and more effective coughing.",
      "pearl": "No cuff needed once the patient no longer needs a sealed airway.",
      "choices": [
        "When the patient no longer requires a sealed, ventilator airway",
        "When the patient is acutely unstable and needs a ventilator",
        "When the tract is still immature and healing",
        "When the patient cannot tolerate any air leak"
      ]
    },
    {
      "id": "ba-23",
      "topic": "basics",
      "difficulty": "medium",
      "q": "What makes a tracheostomy tube \"fenestrated\"?",
      "a": "It has an opening (or openings) cut into the back wall of the outer cannula, positioned to allow air to flow upward through the natural airway and vocal cords, which supports speech and easier weaning.",
      "pearl": "Fenestration is a deliberate window cut into the tube to let air travel the old route again.",
      "choices": [
        "It has openings in the outer cannula that redirect air upward",
        "It has an extra-long outer cannula for a thick neck",
        "It has a second inflatable cuff for a tighter seal",
        "It has no inner cannula at all"
      ]
    },
    {
      "id": "ba-24",
      "topic": "basics",
      "difficulty": "medium",
      "q": "Why is the obturator removed immediately after tube insertion rather than left in place?",
      "a": "The obturator fills and blocks the lumen of the outer cannula so the tube can be guided in atraumatically — it must come out right after placement so air can actually pass through the tube, and it is then kept at the bedside for emergency reinsertion.",
      "pearl": "Leave the obturator in and you've built a beautifully smooth airway... to nowhere.",
      "choices": [
        "It blocks the tube's lumen and must come out for air to pass",
        "It dissolves naturally once the tube is seated",
        "It is only used for laryngectomy tubes, not tracheostomy tubes",
        "It automatically converts into the inner cannula"
      ]
    },
    {
      "id": "ba-25",
      "topic": "basics",
      "difficulty": "medium",
      "q": "Why should a spare inner cannula always be available at a tracheostomy patient's bedside?",
      "a": "The inner cannula is the part most likely to become obstructed by secretions, so having a spare allows a fouled one to be swapped out immediately for a clean one without disturbing or removing the outer cannula.",
      "pearl": "A spare inner cannula turns a plugging emergency into a thirty-second swap.",
      "choices": [
        "A fouled inner cannula can be swapped for a clean spare instantly",
        "The inner cannula must be replaced every hour by protocol",
        "It is a backup outer cannula in case of displacement",
        "It provides a second cuff in case the first fails"
      ]
    },
    {
      "id": "ba-26",
      "topic": "basics",
      "difficulty": "medium",
      "q": "What is a TEP (tracheoesophageal puncture) voice prosthesis?",
      "a": "A small one-way valve device placed in a surgically created puncture between the trachea and esophagus in a laryngectomy patient, allowing air from the lungs to shunt into the esophagus to produce voice.",
      "pearl": "The TEP is a purpose-built shortcut for air to make sound after the larynx is gone.",
      "choices": [
        "A one-way valve in a surgical tract between trachea and esophagus, used for voice",
        "A filter that sits inside the HME to trap secretions",
        "A balloon used to test cuff pressure",
        "A spare tube kept at bedside for emergency reinsertion"
      ]
    },
    {
      "id": "ba-27",
      "topic": "basics",
      "difficulty": "medium",
      "q": "Why does the HME become non-negotiable specifically for a total laryngectomy patient, more so than for many tracheostomy patients?",
      "a": "With the entire upper airway permanently bypassed and no alternate route ever available, the HME is the laryngectomy patient's only source of warming, humidification, and filtration for every breath they take, for life.",
      "pearl": "For a laryngectomy patient, the HME isn't an accessory — it's the replacement nose.",
      "choices": [
        "It is the only source of airway humidification available to them, permanently",
        "It also functions as their speaking valve",
        "It replaces the need for any suctioning at all",
        "It is only needed during the first postoperative week"
      ]
    },
    {
      "id": "ba-28",
      "topic": "basics",
      "difficulty": "medium",
      "q": "Why does clear bedside signage identifying a patient as \"tracheostomy\" or \"laryngectomy\" matter so much on an OHNS ward?",
      "a": "Signage lets any responder — even one who has never met the patient before — immediately know the correct oxygen and ventilation route in an emergency, without wasting time on a chart lookup while the patient is desaturating.",
      "pearl": "Good signage answers the airway question before a stranger ever has to ask it.",
      "choices": [
        "It lets any responder immediately know the correct airway route",
        "It is only required for billing and documentation compliance",
        "It replaces the need for staff handoff communication",
        "It is optional once the patient is off telemetry"
      ]
    },
    {
      "id": "ba-29",
      "topic": "basics",
      "difficulty": "hard",
      "q": "A tracheostomy patient's cuff is inflated. Can air still move through their natural upper airway during that time?",
      "a": "No — an inflated cuff seals the trachea around the tube, blocking airflow up past the tube toward the mouth and nose, even though the anatomical connection still physically exists. The moment the cuff is deflated, that route reopens.",
      "pearl": "Cuff up temporarily blocks the partial neck breather's second route; it doesn't erase it like laryngectomy surgery does.",
      "choices": [
        "No, the inflated cuff blocks that route until deflated",
        "Yes, air always moves freely regardless of cuff status",
        "No, because the connection was surgically removed",
        "Yes, but only if a fenestrated tube is in place"
      ]
    },
    {
      "id": "ba-30",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Why is \"partial vs total neck breather\" a more clinically useful framing than simply asking \"does this patient have a trach\"?",
      "a": "Both a tracheostomy and a laryngectomy patient can have a tube in the neck, so the presence of a tube alone doesn't tell you whether the upper airway still connects to the lungs. The partial/total distinction is what actually determines safe oxygen and ventilation routes.",
      "pearl": "A tube in the neck tells you almost nothing on its own — the underlying anatomy is what matters.",
      "choices": [
        "A neck tube looks the same in both, but the underlying airway anatomy differs",
        "Laryngectomy patients never have a tube in the stoma",
        "Tracheostomy patients never have a visible stoma",
        "The distinction only matters for speech, not oxygenation"
      ]
    },
    {
      "id": "ba-31",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Does a total laryngectomy stoma require a tracheostomy tube to stay open?",
      "a": "Not necessarily — because the trachea is sutured directly to the skin, many mature laryngectomy stomas stay open on their own without a tube, unlike a tracheostomy tract which typically relies on a tube (or a period of healing) to stay patent.",
      "pearl": "A laryngectomy stoma is a permanent opening by design, not a tube-dependent hole.",
      "choices": [
        "No — it can stay open on its own once mature",
        "Yes — the stoma collapses instantly without a tube",
        "Yes — but only for the first year",
        "No — it heals shut without a tube"
      ]
    },
    {
      "id": "ba-32",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Before surgery, the pharynx is a shared pathway for both air and food. What changes about that shared pathway after a total laryngectomy?",
      "a": "The shared pathway is eliminated — the airway and swallowing tract are permanently and completely separated, so air can no longer travel through the mouth/throat and food can no longer enter the airway.",
      "pearl": "Laryngectomy doesn't narrow the crossroads between breathing and swallowing — it removes the intersection entirely.",
      "choices": [
        "Air and food pathways are permanently separated",
        "The pathways merge even more closely",
        "Only the food pathway is affected",
        "Only the air pathway is affected, food is unchanged"
      ]
    },
    {
      "id": "ba-33",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Why is a total laryngectomy stoma considered permanent in a way a tracheostomy stoma is not?",
      "a": "A tracheostomy is typically a reversible, tube-dependent opening created for temporary or long-term support that can potentially be decannulated and allowed to heal closed; a laryngectomy stoma is the surgically reconstructed permanent endpoint of the airway with no upper airway route left to return to.",
      "pearl": "A trach can potentially be closed one day; a laryngectomy stoma is the only airway there will ever be.",
      "choices": [
        "A trach can potentially be decannulated; laryngectomy leaves no airway to return to",
        "Both are equally reversible with time",
        "A laryngectomy stoma always requires a tube; a trach never does",
        "Tracheostomy patients cannot ever be decannulated either"
      ]
    },
    {
      "id": "ba-34",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Anatomically, why can a laryngectomy patient safely eat and drink through the mouth despite being unable to breathe through it?",
      "a": "The surgery removes the larynx and separates the airway from the pharynx/esophagus entirely, so the swallowing pathway from mouth to esophagus remains fully intact even though the breathing pathway from mouth to trachea has been eliminated.",
      "pearl": "Losing the ability to breathe through the mouth doesn't cost the ability to swallow through it — the two pathways were surgically split apart, not both closed.",
      "choices": [
        "The swallowing pathway stays intact while only the airway connection is severed",
        "Laryngectomy patients cannot actually eat by mouth",
        "Food travels through the stoma alongside air",
        "The esophagus is rerouted through the stoma"
      ]
    },
    {
      "id": "ba-35",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Why is an unfenestrated inner cannula used during suctioning or ventilation of a patient with a fenestrated outer cannula?",
      "a": "An unfenestrated inner cannula blocks the fenestration opening, which prevents a suction catheter from passing through the opening into surrounding tissue and prevents ventilation gas from escaping through the fenestration instead of reaching the lungs.",
      "pearl": "Fenestrated tube, unfenestrated inner cannula for suction and ventilation — match the liner to the moment.",
      "choices": [
        "It blocks the fenestration so suction and ventilation stay in the airway, not tissue",
        "It seals the cuff more tightly during ventilation",
        "It prevents the outer cannula from being displaced",
        "It is required only for pediatric-sized tubes"
      ]
    },
    {
      "id": "ba-36",
      "topic": "basics",
      "difficulty": "hard",
      "q": "What is an adjustable-flange tracheostomy tube designed for?",
      "a": "It has a flange that can slide along the shaft of the tube and be locked at a custom position, used for patients with an increased distance between the skin and trachea (for example from obesity or significant neck swelling) where a standard-length tube would not seat properly.",
      "pearl": "Thick neck, deep trachea — the adjustable flange tube meets it where it is.",
      "choices": [
        "A sliding, lockable flange for patients with increased neck-to-trachea distance",
        "A flange with a built-in speaking valve",
        "A flange that automatically adjusts cuff pressure",
        "A flange used only for pediatric patients"
      ]
    },
    {
      "id": "ba-37",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Besides supporting speech and weaning, what is a specific downside associated with fenestrated tracheostomy tubes?",
      "a": "The fenestration opening in the tube wall is a recognized risk factor for granulation tissue formation at that site, an added complication that non-fenestrated tubes don't carry.",
      "pearl": "Fenestrated tubes buy speech at the cost of a new granulation-tissue risk.",
      "choices": [
        "Increased risk of granulation tissue at the fenestration site",
        "Increased risk of cuff rupture",
        "Increased risk of accidental decannulation",
        "Inability to ever be suctioned"
      ]
    },
    {
      "id": "ba-38",
      "topic": "basics",
      "difficulty": "hard",
      "q": "Why must a patient's TEP voice prosthesis never be removed, reinserted, or otherwise manipulated by staff who aren't specifically trained in TEP care?",
      "a": "The device sits in a delicate surgical tract between the trachea and esophagus; mishandling it can damage the valve or the puncture site, or let the prosthesis migrate into the airway or esophagus. Assessment and exchange require a specialist (SLP/ENT) trained specifically in TEP management.",
      "pearl": "See a small valve in the stoma wall? That's their voice — leave it to the specialist.",
      "choices": [
        "Mishandling can damage the valve, injure the tract, or displace the device",
        "It is glued in place and cannot physically be removed",
        "It only needs replacement once a year by any RN",
        "Removing it briefly has no clinical consequence"
      ]
    },
    {
      "id": "ba-39",
      "topic": "basics",
      "difficulty": "hard",
      "q": "In basic physiological terms, how does a TEP prosthesis actually let a laryngectomy patient produce voice?",
      "a": "Occluding the stoma (with a finger or a hands-free valve) redirects exhaled lung air through the one-way TEP valve into the esophagus, where the air vibrates tissue at the top of the esophagus to generate sound that is then shaped into speech by the mouth.",
      "pearl": "Occlude the stoma, air detours through the TEP into the esophagus, and that vibration becomes voice.",
      "choices": [
        "Occluded stoma redirects lung air through the valve into the esophagus to vibrate tissue",
        "The valve vibrates directly to generate sound on its own",
        "Air from the esophagus is pushed up through the valve into the trachea",
        "The prosthesis produces an electronic tone independent of airflow"
      ]
    },
    {
      "id": "ba-40",
      "topic": "basics",
      "difficulty": "hard",
      "q": "On a ward using the National Tracheostomy Safety Project's colored emergency algorithms, what do the GREEN and RED bedhead signs each identify?",
      "a": "GREEN identifies a tracheostomy patient with a potentially patent upper airway, where face/mouth oxygenation may still work; RED identifies a laryngectomy neck-only breather with no connection between the upper airway and the lungs, where only the stoma route applies. Matching the correct color to the correct patient is a life-or-death signage detail.",
      "pearl": "Green: patent upper airway, trach. Red: neck-only breather, laryngectomy, stoma or nothing.",
      "choices": [
        "Green = patent upper airway (trach); red = neck-only breather (laryngectomy)",
        "Green = laryngectomy; red = tracheostomy",
        "Yellow = trach; red = laryngectomy",
        "The colors indicate tube size only"
      ]
    },
    {
      "id": "em-01",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "What are the two failure modes behind almost every tracheostomy emergency?",
      "a": "Obstruction (mucus plug, or clot) and displacement (tube out of the trachea, including into a false passage). Together they explain nearly every floor emergency.",
      "pearl": "It's plugged or it's moved — covers almost everything.",
      "choices": [
        "Obstruction and displacement",
        "Infection and bleeding",
        "Cuff rupture and stoma infection",
        "Aspiration and pneumothorax"
      ]
    },
    {
      "id": "em-02",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "Which of the two failure modes — obstruction or displacement — is the more common cause of tracheostomy emergencies on a general floor?",
      "a": "Obstruction, usually from a mucus plug. Displacement is less common but more immediately catastrophic when it happens.",
      "pearl": "Plugs are common; displacement is rarer but scarier.",
      "choices": [
        "Obstruction (mucus plug)",
        "Displacement",
        "They are exactly equal in frequency",
        "Neither — infection is most common"
      ]
    },
    {
      "id": "em-03",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "Before you touch the valve, cannula, or catheter on a distressed trach patient, what should already be happening in parallel?",
      "a": "Someone is calling for help while oxygen is applied to both the face and the stoma. Escalation runs alongside your troubleshooting, not after it.",
      "pearl": "Call while you work — never call after you're done trying.",
      "choices": [
        "Calling for help and applying O2 to face and stoma",
        "Documenting vital signs in the chart",
        "Paging pharmacy for a nebulizer",
        "Waiting for the physician to arrive before any O2"
      ]
    },
    {
      "id": "em-04",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "In the stepwise emergency response, what is the very first item physically removed from a distressed trach patient's tube?",
      "a": "The speaking valve or cap. A one-way valve on top of an obstruction traps every breath in, so it must come off before anything else.",
      "pearl": "Valve off first — always.",
      "choices": [
        "The speaking valve or cap",
        "The inner cannula",
        "The trach ties",
        "The oxygen tubing"
      ]
    },
    {
      "id": "em-05",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "After the speaking valve or cap is removed, what comes next?",
      "a": "The inner cannula is removed. A plugged inner cannula often carries the obstruction out with it and is the fastest possible fix.",
      "pearl": "Valve off, then inner cannula out.",
      "choices": [
        "Removing the inner cannula",
        "Passing a suction catheter",
        "Deflating the cuff",
        "Calling the family"
      ]
    },
    {
      "id": "em-06",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "After the inner cannula is out, what is the next step before anyone escalates further?",
      "a": "Attempt to pass a suction catheter through the tube. This clears remaining secretions and tests whether the tube itself is open.",
      "pearl": "Cannula out, then catheter down.",
      "choices": [
        "Passing a suction catheter",
        "Reinserting a new outer tube",
        "Applying a speaking valve",
        "Sending for a chest X-ray"
      ]
    },
    {
      "id": "em-07",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "If a suction catheter passes freely well beyond the tip of the tracheostomy tube, what has this confirmed?",
      "a": "The tube itself is patent — open and unobstructed. Continuing distress after this point points toward a different problem, not tube blockage.",
      "pearl": "Catheter goes in clean? The tube isn't the problem.",
      "choices": [
        "The tube is patent",
        "The patient no longer needs oxygen",
        "The cuff is properly inflated",
        "The tract is mature"
      ]
    },
    {
      "id": "em-08",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "In the NTSP emergency algorithms, which color is used for tracheostomy patients?",
      "a": "Green — signifying a patient who may still have a patent upper airway as a backup route.",
      "pearl": "Green trach, red laryngectomy — know your color before the crisis.",
      "choices": [
        "Green",
        "Red",
        "Yellow",
        "Blue"
      ]
    },
    {
      "id": "em-09",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "In the NTSP emergency algorithms, which color is used for laryngectomy patients?",
      "a": "Red — signifying a patient with no upper airway connection, where the stoma is the only route.",
      "pearl": "Red means stoma-only, no exceptions.",
      "choices": [
        "Red",
        "Green",
        "Orange",
        "Purple"
      ]
    },
    {
      "id": "em-10",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "In the NTSP Green algorithm, where do you look, listen, and feel for airflow when assessing a distressed tracheostomy patient?",
      "a": "At both the mouth and the tracheostomy. Either could turn out to be the working route, so both are checked.",
      "pearl": "Two possible airways, so check both.",
      "choices": [
        "Both the mouth and the tracheostomy",
        "The mouth only",
        "The tracheostomy only",
        "The nose only"
      ]
    },
    {
      "id": "em-11",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "In the NTSP Red algorithm, where do you look, listen, and feel for airflow when assessing a distressed laryngectomy patient?",
      "a": "At the stoma only. The mouth is never assessed as a route, because there is no anatomical connection to the lungs.",
      "pearl": "For a laryngectomy, the mouth isn't even in the exam.",
      "choices": [
        "The stoma only",
        "The mouth only",
        "Both the mouth and the stoma",
        "The nose only"
      ]
    },
    {
      "id": "em-12",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "Roughly how many days after placement is a tracheostomy still considered 'fresh' and at highest risk if it dislodges?",
      "a": "The first 5 to 7 days. The tract has not yet matured into a stable, re-enterable channel.",
      "pearl": "Under a week old = handle with extreme caution.",
      "choices": [
        "5 to 7 days",
        "24 hours",
        "One month",
        "One year"
      ]
    },
    {
      "id": "em-13",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "Can a dislodged fresh (under 5–7 day old) tracheostomy tube be safely pushed back in blindly at the bedside?",
      "a": "No — never. The immature tract can easily divert the tube into pretracheal soft tissue instead of the trachea.",
      "pearl": "Blind reinsertion of a fresh trach is forbidden, full stop.",
      "choices": [
        "No, never attempt blind reinsertion",
        "Yes, if done within one minute",
        "Yes, if the patient is calm",
        "Only if the RN has done it before"
      ]
    },
    {
      "id": "em-14",
      "topic": "emergencies",
      "difficulty": "easy",
      "q": "A tracheostomy patient (not a laryngectomy) fully self-decannulates and is distressed. Besides the stoma, what other route can be used to oxygenate them?",
      "a": "The mouth and nose — a tracheostomy patient's upper airway is still intact and connects to the lungs, unlike a laryngectomy patient.",
      "pearl": "For a trach, the mouth is still a real rescue route.",
      "choices": [
        "The mouth and nose",
        "There is no other route",
        "IV oxygen administration",
        "Subcutaneous oxygen injection"
      ]
    },
    {
      "id": "em-15",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why must the speaking valve or cap come off BEFORE anything else in a distressed trach patient, rather than going straight to suctioning?",
      "a": "A one-way valve lets air in but not out; combined with any obstruction, the patient can inhale but cannot exhale, causing rapid breath-stacking. It must be removed before you do anything else that assumes the patient can breathe out.",
      "pearl": "Trapped air kills faster than a plug — valve off first.",
      "choices": [
        "A one-way valve traps air in if the patient can't exhale",
        "It makes suctioning more comfortable",
        "It has to be cleaned between uses",
        "It interferes with the pulse oximeter"
      ]
    },
    {
      "id": "em-16",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why is the inner cannula removed before a suction catheter is passed, rather than suctioning through it?",
      "a": "The inner cannula itself is the most common site of obstruction, and pulling it out often removes the plug instantly — faster than trying to suction past it. It also lets you confirm the true tube is open before chasing the plug with a catheter.",
      "pearl": "Don't suction through the plug — remove it.",
      "choices": [
        "Removing it often clears the plug instantly and confirms true patency",
        "It reduces the risk of infection",
        "It is required before any oxygen can be given",
        "It lets the cuff be deflated safely"
      ]
    },
    {
      "id": "em-17",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why does 'call for help' happen at the same time as your troubleshooting steps, rather than after you've finished trying to fix things yourself?",
      "a": "A blocked or displaced airway can become unsalvageable in minutes; waiting until your own steps fail before calling wastes time you cannot get back. Escalation and troubleshooting run in parallel.",
      "pearl": "Calling early is free; calling late is not.",
      "choices": [
        "Delay in a true airway emergency is irreversible",
        "It's hospital policy to always call first",
        "It reduces the nurse's legal liability",
        "It's only required for laryngectomy patients"
      ]
    },
    {
      "id": "em-18",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "You've removed the valve and inner cannula and passed a catheter with no obstruction found, but the chest still doesn't move with bagging via the tube. What should you now suspect?",
      "a": "Displacement or a false passage rather than obstruction. Once the tube itself is confirmed patent and secretion-free, a still-unventilated patient points to the tube not actually being in the trachea.",
      "pearl": "Patent tube + no ventilation = think displacement, not plug.",
      "choices": [
        "Displacement or a false passage",
        "A simple mucus plug further down",
        "Cuff over-inflation",
        "Normal post-suction coughing"
      ]
    },
    {
      "id": "em-19",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why does the NTSP Green algorithm direct oxygen to BOTH the face and the tracheostomy when a trach patient is breathing spontaneously but distressed, instead of picking just one?",
      "a": "Either route could turn out to be the one that's actually working, and you often don't know which until you've assessed further. Covering both costs nothing and cannot make things worse.",
      "pearl": "When both routes might work, use both.",
      "choices": [
        "Either route may be the working one, and covering both is harmless",
        "It roughly doubles the oxygen concentration delivered",
        "Stoma oxygen alone is never sufficient",
        "Face oxygen prevents the stoma from drying out"
      ]
    },
    {
      "id": "em-20",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why does the NTSP Red algorithm never direct initial oxygenation effort at the face, not even briefly, for a laryngectomy patient?",
      "a": "There is zero anatomical connection between the mouth/nose and the lungs after laryngectomy, so any time spent on face oxygenation delivers nothing while the true emergency at the stoma goes unaddressed.",
      "pearl": "Face O2 on a laryngectomy patient isn't neutral — it's stolen time.",
      "choices": [
        "It delivers no oxygen and wastes critical time",
        "It can trigger a vasovagal response",
        "It dries out the laryngectomy stoma",
        "It is only skipped in pediatric laryngectomy patients"
      ]
    },
    {
      "id": "em-21",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Physiologically, what tissue does a tracheostomy tube enter when it creates a 'false passage,' and why can't you ventilate through it?",
      "a": "The pretracheal soft tissue of the neck, not the tracheal lumen. Air bagged through a tube sitting in this tissue plane goes into the neck, not the lungs, so no gas exchange occurs no matter how well you bag.",
      "pearl": "A false passage isn't a bad airway — it isn't an airway at all.",
      "choices": [
        "Pretracheal soft tissue, which has no connection to the lungs",
        "The esophagus, causing gastric distension",
        "The pleural space, causing a pneumothorax",
        "The thyroid gland"
      ]
    },
    {
      "id": "em-22",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "A nurse pushes a popped-out fresh trach back in and it slides in with no resistance at all — does this prove correct placement?",
      "a": "No. Pretracheal soft tissue in an immature tract can accept the tube just as easily as the true tracheal opening. Ease of insertion is not proof of placement; placement must be confirmed with signs like capnography, chest rise, and breath sounds.",
      "pearl": "Easy insertion proves nothing — a false passage can feel just as smooth.",
      "choices": [
        "No — a false passage can accept the tube just as easily",
        "Yes, resistance-free insertion always means correct placement",
        "Yes, but only in patients over 65",
        "No, but only if the patient is coughing"
      ]
    },
    {
      "id": "em-23",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why is a mature tracheostomy tract (fully healed, more than about a week old) safe for a trained clinician to reinsert into, when a fresh one is not?",
      "a": "A mature tract is epithelialized and holds its shape as a defined channel back to the trachea. A fresh tract has no such stable lining and can collapse or divert into surrounding tissue when probed.",
      "pearl": "A mature tract is a hallway; a fresh tract is just a bruise.",
      "choices": [
        "A mature tract is epithelialized and holds a stable channel",
        "A mature tract has a wider diameter tube",
        "A mature tract no longer needs a cuff",
        "A mature tract cannot develop mucus plugs"
      ]
    },
    {
      "id": "em-24",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "A fresh (day-2) tracheostomy dislodges. What should the bedside RN actually do, and what should they deliberately avoid doing themselves?",
      "a": "Oxygenate (mouth/nose, occluding the stoma) and escalate to ENT immediately. The RN should NOT attempt to reinsert the tube, no matter how confident or experienced they are — that decision belongs to the surgical team.",
      "pearl": "Your job is oxygenate and escalate — not reinsert.",
      "choices": [
        "Oxygenate via mouth/nose and escalate — do not reinsert",
        "Attempt reinsertion once, then call if it fails",
        "Wait at bedside for the tube to be resupplied",
        "Apply a new speaking valve to stabilize breathing"
      ]
    },
    {
      "id": "em-25",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "What practical purpose do stay (maturation) sutures serve during a fresh tracheostomy airway emergency?",
      "a": "They let the surgical team retract the tract open and directly visualize or re-cannulate the airway in a controlled way. Their presence signals that airway recovery is a trained surgical maneuver, not a bedside nursing task.",
      "pearl": "Stay sutures are the surgeon's rope back into the airway.",
      "choices": [
        "They let the surgical team retract the tract open in a controlled way",
        "They hold the speaking valve in place",
        "They prevent the cuff from over-inflating",
        "They mark which side is the patient's left"
      ]
    },
    {
      "id": "em-26",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "A trach patient with the tube still in place and patent goes into cardiopulmonary arrest. What is the fastest ventilation route?",
      "a": "Bag-valve ventilation directly through the existing tracheostomy tube. The hardware is already in place and connected to the trachea — there is no reason to go to the face first.",
      "pearl": "If the tube's already in and working, ventilate through it.",
      "choices": [
        "Bag-valve ventilation directly through the existing tube",
        "Mouth-to-mouth at the face only",
        "Wait for anesthesia to intubate orally",
        "Remove the tube and bag the stoma with a face mask"
      ]
    },
    {
      "id": "em-27",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "Why might a standard adult face mask fail to ventilate a laryngectomy stoma, requiring a pediatric mask or LMA instead?",
      "a": "A standard adult face mask is shaped and sized for the face and cannot form an airtight seal over the smaller, differently contoured stoma opening. A pediatric mask or LMA is small enough to seal against it.",
      "pearl": "Wrong-shaped seal, no ventilation — size the mask to the stoma.",
      "choices": [
        "It cannot form an airtight seal over the smaller stoma",
        "It delivers too much oxygen concentration",
        "It is not compatible with bag-valve devices",
        "It triggers gagging in laryngectomy patients"
      ]
    },
    {
      "id": "em-28",
      "topic": "emergencies",
      "difficulty": "medium",
      "q": "When a bedside assessment of tube patency is equivocal, how does capnography help confirm what's really happening?",
      "a": "A CO2 waveform confirms that gas is actually moving into and out of the lungs through that route. Its absence flags non-ventilation or displacement even when the chest appears to be moving with bagging.",
      "pearl": "The chest can lie; the waveform doesn't.",
      "choices": [
        "It confirms real gas exchange even when the chest looks like it's moving",
        "It measures the patient's hemoglobin level",
        "It confirms the cuff pressure is correct",
        "It replaces the need for suctioning"
      ]
    },
    {
      "id": "em-29",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "Beyond simply 'not working,' why is forcing a dislodged fresh trach back into a false passage actively dangerous rather than just ineffective?",
      "a": "Positive-pressure ventilation into pretracheal tissue can cause surgical (subcutaneous) emphysema and pneumomediastinum, and the tube being 'in' gives false reassurance that delays the real fix — obstruction of the true airway remains unaddressed while precious time is spent believing the airway is secured.",
      "pearl": "A false passage doesn't just fail to help — it actively lies to you while the clock runs.",
      "choices": [
        "It can cause surgical emphysema and gives false reassurance that delays the real fix",
        "It always causes immediate cardiac arrest",
        "It permanently destroys the tracheostomy stoma",
        "It has no additional danger beyond simple obstruction"
      ]
    },
    {
      "id": "em-30",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "During bag-valve ventilation through a suspected malpositioned tube, what physical exam finding on the neck should immediately raise suspicion for a false passage?",
      "a": "Crepitus or visible swelling from subcutaneous (surgical) emphysema around the neck — air being pushed into soft tissue rather than the trachea, with the chest failing to rise appropriately.",
      "pearl": "A crackling, puffy neck during bagging means the air went into tissue, not lungs.",
      "choices": [
        "Crepitus / subcutaneous emphysema around the neck",
        "Bilateral wheeze on auscultation",
        "Jugular venous distension only",
        "Warm, dry skin at the stoma"
      ]
    },
    {
      "id": "em-31",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "How do suction catheter behavior and capnography together help you tell obstruction from displacement when the presentation looks similar?",
      "a": "In obstruction, the catheter typically meets resistance and won't pass, but once cleared, a capnography waveform returns. In displacement into a false passage, the catheter may pass with little resistance into soft tissue, yet no capnography waveform returns despite bagging — because no air is reaching the lungs either way.",
      "pearl": "Resistance tells you about the plug; the waveform tells you about the airway.",
      "choices": [
        "Catheter resistance suggests obstruction; a missing CO2 waveform despite bagging suggests displacement",
        "Catheter resistance always means displacement",
        "Capnography cannot distinguish the two situations",
        "A waveform confirms obstruction, not displacement"
      ]
    },
    {
      "id": "em-32",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "Why is 'the suction catheter will not pass beyond the tube tip' treated as a signal to escalate immediately rather than simply suction more?",
      "a": "A catheter that cannot pass indicates the lumen of the tube itself is occluded, not just secretions sitting at the opening — repeated shallow suctioning attempts will not fix a blocked lumen and only delay the tube exchange or ENT intervention that's actually needed.",
      "pearl": "If the catheter won't go in, more suctioning isn't the answer — escalation is.",
      "choices": [
        "It signals the tube's lumen itself is blocked, needing exchange or ENT, not more suctioning",
        "It means the patient needs a larger suction catheter",
        "It means the cuff needs to be inflated further",
        "It is expected and requires no action"
      ]
    },
    {
      "id": "em-33",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "Why is a 'false passage' specifically a tracheostomy hazard, and less of a concern for a well-healed (mature) laryngectomy stoma?",
      "a": "A laryngectomy stoma is the trachea itself sutured directly to the skin as a permanent end-stoma, with no intervening layer of strap muscle or soft tissue to divert into. A tracheostomy tube, by contrast, must traverse pretracheal soft tissue before reaching the trachea, and that tissue plane is exactly what a misdirected tube can enter.",
      "pearl": "A laryngectomy stoma IS the trachea; a tracheostomy tube has to find its way there.",
      "choices": [
        "A laryngectomy stoma is the trachea sewn directly to skin, with no soft-tissue tract to divert into",
        "Laryngectomy stomas cannot become obstructed",
        "Laryngectomy tubes are never removed after placement",
        "Laryngectomy stomas have a protective cartilage ring"
      ]
    },
    {
      "id": "em-34",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "A trach patient's tube truly cannot be made to work despite full troubleshooting, but the upper airway is intact. What is the fallback ventilation strategy, and why is occluding the stoma essential to it?",
      "a": "Ventilate at the mouth with bag-mask, oral airway adjuncts, or a supraglottic device, while manually occluding the stoma. If the stoma is left open, it acts as a parallel leak that bleeds off the pressure and volume you're trying to deliver through the mouth.",
      "pearl": "An open stoma during face ventilation just lets your breath escape out the side door.",
      "choices": [
        "Ventilate at the mouth while occluding the stoma to stop the leak",
        "Ventilate at the mouth without touching the stoma",
        "Abandon ventilation and wait for ENT to arrive",
        "Ventilate at the stoma using a standard adult face mask"
      ]
    },
    {
      "id": "em-35",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "Why does the NTSP Green algorithm trigger immediate CPR for an apneic, pulseless trach patient rather than working through the tube-troubleshooting sequence first?",
      "a": "A pulseless, non-breathing patient needs chest compressions and rescue breaths without delay — spending time on a stepwise obstruction workup on an arrested patient wastes the compression-free interval that determines survival. Troubleshooting the tube happens alongside or after compressions start, not before.",
      "pearl": "Pulseless and not breathing means compressions now, not step-by-step troubleshooting.",
      "choices": [
        "A pulseless, apneic patient needs compressions immediately, not a stepwise workup first",
        "The troubleshooting steps are contraindicated in arrest",
        "CPR is only started after the inner cannula is removed",
        "Compressions are deferred until the tube is confirmed patent"
      ]
    },
    {
      "id": "em-36",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "A trach patient has thickening secretions and rising suction frequency but is not yet desaturating or distressed. Does this call for the full emergency response sequence (valve off, cannula out, escalate)?",
      "a": "No — this is evolving partial obstruction best managed with increased suctioning, humidification, and close monitoring. The full emergency sequence is reserved for acute distress, desaturation, or inability to clear the airway; treating every early warning sign as a code delays recognizing when it truly becomes one.",
      "pearl": "Rising suction needs are a warning to watch closely, not yet a call for the full crash sequence.",
      "choices": [
        "No — manage with closer monitoring and humidification unless red-flag signs appear",
        "Yes — every increase in suction frequency requires the full emergency sequence",
        "No — nothing needs to change until the patient arrests",
        "Yes — but only the inner cannula step is required"
      ]
    },
    {
      "id": "em-37",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "Why does the NTSP deliberately use two separate algorithms (Green and Red) instead of one universal airway emergency algorithm for all neck-breathing patients?",
      "a": "The correct first action is opposite for the two populations — directing effort to the face helps a tracheostomy patient but wastes critical time on a laryngectomy patient with no airway connection there. A single universal algorithm would necessarily get one of the two populations wrong.",
      "pearl": "One algorithm can't serve two airways that work in opposite ways.",
      "choices": [
        "The correct first action is opposite for the two populations",
        "Laryngectomy patients don't need an algorithm at all",
        "Green and Red algorithms are actually identical in content",
        "The color coding is only for hospital coding/billing purposes"
      ]
    },
    {
      "id": "em-38",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "A 'tubed' laryngectomy patient's small stoma tube falls out. Is the rescue response the same as for a displaced tracheostomy — occlude the stoma and ventilate at the face?",
      "a": "No. A laryngectomy patient has no connection between the mouth/nose and the lungs at all, so occluding the stoma and bagging the face accomplishes nothing. Ventilation must be delivered directly at the open stoma, using a pediatric mask or LMA sealed over it if bag-mask ventilation is needed.",
      "pearl": "For a laryngectomy, the stoma is never the thing you cover — it's the thing you ventilate.",
      "choices": [
        "No — ventilate directly at the stoma; face ventilation is useless",
        "Yes — the response is identical for both populations",
        "Yes, but only if the patient is hemodynamically stable",
        "No — laryngectomy patients cannot be bag-mask ventilated at all"
      ]
    },
    {
      "id": "em-39",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "Why does a delayed recognition of displacement tend to be more immediately lethal, minute-for-minute, than a delayed recognition of obstruction?",
      "a": "Obstruction usually evolves gradually with warning signs — thickening secretions, rising suction needs — giving time to intervene before it's complete. Displacement or false passage can produce zero ventilation abruptly with little or no gradual warning, so any delay in recognizing it costs oxygenation immediately rather than incrementally.",
      "pearl": "Obstruction creeps up on you; displacement drops the floor out.",
      "choices": [
        "Displacement can cause abrupt total loss of ventilation with little warning, unlike gradual obstruction",
        "Obstruction is always more lethal than displacement",
        "Displacement only occurs in patients already on a ventilator",
        "Both carry identical time pressure in every case"
      ]
    },
    {
      "id": "em-40",
      "topic": "emergencies",
      "difficulty": "hard",
      "q": "In the Green algorithm, name two specific devices used to deliver oxygen or ventilation directly at the tracheostomy opening itself (not the face).",
      "a": "A Waters circuit or a bag-valve-mask connected directly to the tube, or a pediatric face mask sealed over the stoma. Any of these lets you oxygenate or ventilate through the tracheostomy route specifically.",
      "pearl": "Know your stoma-side hardware before you need it at 3am.",
      "choices": [
        "A Waters circuit or bag-valve-mask on the tube, or a pediatric mask over the stoma",
        "A standard adult face mask sealed to the neck",
        "A nasal cannula taped over the stoma",
        "An oral Guedel airway inserted into the stoma"
      ]
    },
    {
      "id": "va-01",
      "topic": "valves",
      "difficulty": "easy",
      "q": "Mechanically, how does a speaking valve (Passy-Muir type) work?",
      "a": "It is a one-way valve: it opens to let air IN through the tracheostomy tube on inhalation, then closes at the start of exhalation, forcing exhaled air around the tube and up through the vocal cords.",
      "pearl": "In through the valve, out around the tube — one direction only.",
      "choices": [
        "Opens on inhale, closes on exhale",
        "Opens on exhale, closes on inhale",
        "Stays open in both directions",
        "Stays closed in both directions"
      ]
    },
    {
      "id": "va-02",
      "topic": "valves",
      "difficulty": "medium",
      "q": "With a speaking valve in place, where does exhaled air actually go?",
      "a": "It cannot exit through the closed valve, so it is redirected around the tracheostomy tube, up through the larynx, past the vocal cords, and out the mouth and nose — this is what restores the patient's voice.",
      "pearl": "The detour around the tube through the cords is exactly what gives the patient their voice back.",
      "choices": [
        "Around the tube, up through the vocal cords",
        "Back out through the valve itself",
        "Through the inner cannula only",
        "Directly out the stoma around the tube, bypassing the cords"
      ]
    },
    {
      "id": "va-03",
      "topic": "valves",
      "difficulty": "easy",
      "q": "Before placing a speaking valve on a tracheostomy patient, what is the one absolute prerequisite regarding the cuff?",
      "a": "The cuff must be fully deflated. An inflated cuff blocks the exhalation pathway around the tube, turning the one-way valve into a closed system.",
      "pearl": "Cuff down, every time, no exceptions — before the valve goes on.",
      "choices": [
        "Cuff fully deflated",
        "Cuff inflated to 20 cmH2O",
        "Cuff partially deflated",
        "Cuff status doesn't matter for valve use"
      ]
    },
    {
      "id": "va-04",
      "topic": "valves",
      "difficulty": "medium",
      "q": "A patient's cuff was confirmed deflated for a valve trial this morning. That afternoon a different nurse wants to reapply the same valve. What must happen first?",
      "a": "Cuff deflation must be reconfirmed at that moment, not assumed from an earlier check. Cuffs can be reinflated between trials (e.g., for repositioning or feeding), so each valve application requires its own fresh verification.",
      "pearl": "Every valve placement gets its own cuff check — 'it was down this morning' is not good enough.",
      "choices": [
        "Reconfirm cuff deflation right before this application",
        "Trust the morning documentation",
        "Ask the patient if they feel short of breath first",
        "Only recheck if the patient looks distressed"
      ]
    },
    {
      "id": "va-05",
      "topic": "valves",
      "difficulty": "hard",
      "q": "The cuff syringe shows only 2 mL still in the pilot balloon — 'basically down.' Is it safe to place the speaking valve?",
      "a": "No. The cuff must be fully deflated, not just mostly. Even a small residual volume can partially occlude the exhalation pathway around the tube, and the degree of obstruction is unpredictable — 'close enough' is not a safe standard.",
      "pearl": "'Almost down' is still up. Full deflation only.",
      "choices": [
        "No — it must be fully deflated, not partially",
        "Yes — a few mL of residual air is negligible",
        "Yes, as long as pressure reads under 20 cmH2O",
        "It only matters if the patient reports discomfort"
      ]
    },
    {
      "id": "va-06",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Walk through the exact physiological sequence that makes a speaking valve dangerous if the cuff is left inflated.",
      "a": "The one-way valve still allows air IN on inhalation, but the inflated cuff seals off the only exhalation route around the tube. The patient keeps inhaling with no way to exhale, air stacks breath over breath, intrathoracic pressure rises, and ventilation and venous return progressively fail.",
      "pearl": "Can inhale, can't exhale — that mismatch is what stacks the breath and stops the heart.",
      "choices": [
        "Air keeps entering but cannot exit, causing breath stacking",
        "The cuff pops and the tube falls out",
        "The valve fails to open on inhalation",
        "Oxygen delivery through the valve is blocked"
      ]
    },
    {
      "id": "va-07",
      "topic": "valves",
      "difficulty": "easy",
      "q": "True or false: a standard tracheostomy speaking valve can be used on a total laryngectomy patient.",
      "a": "False. A total laryngectomy patient has no upper airway connection left to exhale through, so a one-way speaking valve has nowhere for exhaled air to go and must never be used.",
      "pearl": "No upper airway exit, no speaking valve — ever, on a laryngectomy.",
      "choices": [
        "False — there is no upper airway exit for exhaled air",
        "True — it works the same as in a tracheostomy patient",
        "True — but only if the cuff is inflated",
        "False — but only because it isn't tolerated well"
      ]
    },
    {
      "id": "va-08",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Anatomically, why exactly does a one-way speaking valve have no safe exit for exhaled air after a total laryngectomy?",
      "a": "Total laryngectomy permanently separates the airway from the pharynx and mouth; the trachea ends at the neck as a blind-ending stoma. There is no glottis, no upper airway, and no alternate path — a one-way valve would trap every exhaled breath with literally nowhere for it to go.",
      "pearl": "In a laryngectomy, the stoma isn't one of two routes — it's the ONLY route, in and out. A one-way valve breaks that instantly.",
      "choices": [
        "The trachea is a blind-ending stoma with no route to the upper airway",
        "The vocal cords are removed but the trachea still connects to the pharynx",
        "The cuff cannot be deflated after laryngectomy",
        "The stoma is too small for exhaled air to pass"
      ]
    },
    {
      "id": "va-09",
      "topic": "valves",
      "difficulty": "easy",
      "q": "Name signs that a patient is NOT tolerating a speaking valve.",
      "a": "Respiratory distress, oxygen desaturation, rising work of breathing, and anxiety or agitation are all signs of valve intolerance — any of these should prompt action, not reassurance.",
      "pearl": "Distress on a valve is data, not drama — act on it.",
      "choices": [
        "Distress, desaturation, rising work of breathing",
        "Improved voice volume",
        "Slightly dry mouth",
        "Mild fatigue after a long conversation"
      ]
    },
    {
      "id": "va-10",
      "topic": "valves",
      "difficulty": "easy",
      "q": "A patient becomes distressed and desaturates while wearing a speaking valve. What is the very first thing you do?",
      "a": "Remove the speaking valve immediately. Troubleshooting or reassurance with the valve still in place delays the one intervention that instantly relieves a one-way-valve problem.",
      "pearl": "Valve off first. Everything else comes after.",
      "choices": [
        "Remove the speaking valve immediately",
        "Increase supplemental oxygen and observe",
        "Reassure the patient and wait it out",
        "Reposition the patient before removing anything"
      ]
    },
    {
      "id": "va-11",
      "topic": "valves",
      "difficulty": "medium",
      "q": "How does capping a tracheostomy tube differ mechanically from placing a speaking valve on it?",
      "a": "A cap fully occludes the tube in both directions — all breathing, inhale and exhale, must happen around the tube. A speaking valve is one-way — inhalation still passes through the tube; only exhalation is forced around it.",
      "pearl": "Valve: air in through the tube. Cap: no air through the tube at all, in or out.",
      "choices": [
        "A cap blocks both directions; a valve only redirects exhalation",
        "A cap and a valve are functionally identical",
        "A cap allows exhalation through the tube; a valve blocks it",
        "A cap is only used with the cuff inflated"
      ]
    },
    {
      "id": "va-12",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Beyond a deflated cuff, what must be confirmed about the patient's airway before trialing a cap, given that capping is a bigger step than a speaking valve?",
      "a": "The patient must be able to move their full tidal volume around the tube and through the upper airway with the tube completely occluded — tolerating zero airflow through the tube itself. This is a higher bar than a valve trial, since a valve still permits inhalation through the tube; capping tests true readiness for decannulation.",
      "pearl": "A valve is a bridge; a cap is closer to the finish line — the patient has to prove they don't need the tube for airflow at all.",
      "choices": [
        "Full tidal volume must move around the tube with zero flow through it",
        "Only that the patient can tolerate the valve for one hour",
        "That the tube is one size smaller than standard",
        "That the patient is on room air already"
      ]
    },
    {
      "id": "va-13",
      "topic": "valves",
      "difficulty": "easy",
      "q": "What is one core purpose of an inflated tracheostomy cuff?",
      "a": "It seals the airway around the tube so positive-pressure ventilation can be delivered effectively, without air leaking back up around the tube.",
      "pearl": "No seal, no reliable positive-pressure breath.",
      "choices": [
        "Enables effective positive-pressure ventilation",
        "Improves the patient's voice",
        "Prevents all aspiration completely",
        "Keeps the inner cannula from clogging"
      ]
    },
    {
      "id": "va-14",
      "topic": "valves",
      "difficulty": "easy",
      "q": "Besides enabling positive-pressure ventilation, what is the other main purpose of an inflated cuff?",
      "a": "It reduces gross aspiration — it blocks large volumes of oral or gastric contents from tracking down into the lungs.",
      "pearl": "The cuff is a barrier against big spills, not a perfect seal.",
      "choices": [
        "Reduces gross aspiration",
        "Eliminates all aspiration risk",
        "Prevents mucus plugging",
        "Improves humidification"
      ]
    },
    {
      "id": "va-15",
      "topic": "valves",
      "difficulty": "medium",
      "q": "A patient's cuff is inflated to the correct pressure. Is aspiration now prevented?",
      "a": "No. The cuff reduces gross aspiration but does not stop microaspiration — small amounts of secretions still track past the cuff regardless of correct inflation. 'Cuff up' is not aspiration insurance.",
      "pearl": "Cuff up ≠ aspiration-proof. It's a speed bump, not a wall.",
      "choices": [
        "No — microaspiration still occurs past the cuff",
        "Yes — a properly inflated cuff is a complete seal",
        "Yes, but only for gastric contents",
        "No — inflation increases aspiration risk"
      ]
    },
    {
      "id": "va-16",
      "topic": "valves",
      "difficulty": "easy",
      "q": "What is the target tracheostomy cuff pressure range?",
      "a": "20 to 30 cmH2O. Below this range risks leak and aspiration; above it risks tracheal mucosal injury.",
      "pearl": "20 to 30 — the number to know cold.",
      "choices": [
        "20–30 cmH2O",
        "5–10 cmH2O",
        "40–60 cmH2O",
        "60–80 cmH2O"
      ]
    },
    {
      "id": "va-17",
      "topic": "valves",
      "difficulty": "easy",
      "q": "What device should be used to accurately measure and set tracheostomy cuff pressure?",
      "a": "A cuff pressure manometer. It gives an objective reading in cmH2O rather than relying on syringe volume or feel.",
      "pearl": "If you're guessing the pressure, you're guessing wrong — use the manometer.",
      "choices": [
        "A cuff pressure manometer",
        "A pulse oximeter",
        "A 10 mL syringe alone",
        "A stethoscope over the trachea"
      ]
    },
    {
      "id": "va-18",
      "topic": "valves",
      "difficulty": "medium",
      "q": "What happens to the trachea if the cuff is left overinflated for a prolonged period?",
      "a": "Cuff pressure above the mucosal capillary perfusion pressure causes ischemia of the tracheal wall, which over time can progress to ulceration, necrosis, and tracheal stenosis.",
      "pearl": "Overinflation doesn't just hurt — it can scar the airway shut months later.",
      "choices": [
        "Mucosal ischemia that can progress to tracheal stenosis",
        "Immediate cuff rupture",
        "Improved seal with no downside",
        "Increased risk of accidental decannulation"
      ]
    },
    {
      "id": "va-19",
      "topic": "valves",
      "difficulty": "medium",
      "q": "What are the risks of an underinflated tracheostomy cuff?",
      "a": "An air leak around the tube, which reduces the effectiveness of positive-pressure ventilation, and increased risk of secretions and oral or gastric contents leaking past the cuff into the lower airway.",
      "pearl": "Too little air up top means leak up top and aspiration down below.",
      "choices": [
        "Air leak and increased aspiration risk",
        "Tracheal mucosal ischemia",
        "Tracheal stenosis",
        "Improved voice quality"
      ]
    },
    {
      "id": "va-20",
      "topic": "valves",
      "difficulty": "medium",
      "q": "How often should tracheostomy cuff pressure be checked, and why not just at insertion?",
      "a": "Routinely — at least every shift, and after any event that could change it (repositioning, coughing, cuff manipulation). Cuff pressure drifts over time from a single insertion measurement, so a one-time check does not guarantee it stays in range.",
      "pearl": "Cuff pressure isn't 'set and forget' — it drifts, so recheck it.",
      "choices": [
        "Routinely each shift and after any pressure-altering event",
        "Only once, at initial insertion",
        "Only if the patient complains of pain",
        "Only when the tube is changed"
      ]
    },
    {
      "id": "va-21",
      "topic": "valves",
      "difficulty": "hard",
      "q": "No manometer is available and the cuff needs to be set. What is the minimal-leak/minimal-occlusion technique, and why use it?",
      "a": "Inflate the cuff slowly during a positive-pressure breath until the leak just disappears, or back off slightly until a slight audible leak returns, rather than inflating to a fixed syringe volume. It gets the cuff to the lowest pressure that still achieves an adequate seal, reducing the risk of unnoticed overinflation when pressure cannot be directly measured.",
      "pearl": "Without a manometer, aim for 'just enough seal,' not 'as much air as fits.'",
      "choices": [
        "Inflate only until the air leak just disappears, no further",
        "Inflate to the maximum the pilot balloon allows",
        "Inflate to a fixed 10 mL regardless of leak",
        "Skip cuff inflation until a manometer is found"
      ]
    },
    {
      "id": "va-22",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Why is it unsafe to inflate a tracheostomy cuff to 'the usual 5 mL' by habit, without checking pressure?",
      "a": "The pressure generated by a given volume of air varies with tube size, cuff compliance, and individual tracheal anatomy — the same 5 mL can be dangerously low in one patient and dangerously high in another. Volume is not a reliable proxy for pressure; only a direct pressure check is.",
      "pearl": "Volume in the syringe tells you nothing about pressure on the mucosa — measure, don't assume.",
      "choices": [
        "Volume-to-pressure varies by tube and trachea, so a fixed volume is unreliable",
        "5 mL is always too little for any adult trachea",
        "Syringe inflation cannot reach therapeutic pressure",
        "Cuffs lose air only through the pilot balloon, not the trachea"
      ]
    },
    {
      "id": "va-23",
      "topic": "valves",
      "difficulty": "easy",
      "q": "What should trigger a decision to suction a tracheostomy patient?",
      "a": "Patient signs: audible or rattly secretions, visible secretions at the tube, desaturation, rising work of breathing, or an ineffective cough.",
      "pearl": "Suction the patient's signs, not the wall clock.",
      "choices": [
        "Audible secretions, desaturation, rising work of breathing",
        "A fixed two-hour interval",
        "The start of every shift regardless of symptoms",
        "Whenever the family requests it"
      ]
    },
    {
      "id": "va-24",
      "topic": "valves",
      "difficulty": "easy",
      "q": "Which of the following is NOT a valid reason to suction a tracheostomy patient?",
      "a": "A fixed clock-based schedule (e.g., 'every 2 hours no matter what'). Suctioning should be driven by patient signs and symptoms, not routine timing — unnecessary suctioning causes trauma without benefit.",
      "pearl": "'It's just time' is never the indication — the patient's signs are.",
      "choices": [
        "A fixed clock-based schedule",
        "Audible rattly secretions",
        "Desaturation with visible secretions",
        "Rising work of breathing"
      ]
    },
    {
      "id": "va-25",
      "topic": "valves",
      "difficulty": "easy",
      "q": "What should be done immediately before suctioning a tracheostomy patient who is on supplemental oxygen?",
      "a": "Pre-oxygenate the patient briefly with a higher FiO2 before passing the catheter, to build a reserve against the drop in oxygenation that suctioning causes.",
      "pearl": "Load up on oxygen before you take any away.",
      "choices": [
        "Pre-oxygenate before the catheter goes in",
        "Lower the FiO2 to reduce fire risk",
        "Withhold oxygen until after suctioning",
        "Suction first, then apply oxygen if needed"
      ]
    },
    {
      "id": "va-26",
      "topic": "valves",
      "difficulty": "easy",
      "q": "During a suction pass, when should suction pressure actually be applied?",
      "a": "Only on withdrawal of the catheter — never while inserting it. Applying suction on the way in causes unnecessary mucosal trauma and hypoxia without added benefit.",
      "pearl": "In clean, out suctioning — never the reverse.",
      "choices": [
        "On withdrawal only",
        "On insertion only",
        "Continuously, insertion and withdrawal",
        "Only after the catheter reaches resistance"
      ]
    },
    {
      "id": "va-27",
      "topic": "valves",
      "difficulty": "medium",
      "q": "How do you determine the correct suction catheter size for a given tracheostomy tube?",
      "a": "The catheter's outer diameter should be no more than half the internal diameter of the tracheostomy tube. Too large a catheter creates excessive vacuum and can collapse alveoli; too small fails to clear secretions effectively.",
      "pearl": "Half the tube's ID, no more — bigger isn't better, it's atelectasis.",
      "choices": [
        "No more than half the tube's internal diameter",
        "Equal to the tube's internal diameter",
        "Twice the tube's internal diameter",
        "Catheter size doesn't need to match the tube"
      ]
    },
    {
      "id": "va-28",
      "topic": "valves",
      "difficulty": "medium",
      "q": "What is the recommended insertion depth for routine tracheostomy suctioning?",
      "a": "Shallow — insert only to a premeasured length (the length of the tube plus adapter), not advanced until resistance or a cough is met at the carina. Routine deep insertion increases mucosal trauma without improving secretion clearance.",
      "pearl": "Measure and stop — don't go hunting for the carina.",
      "choices": [
        "Shallow, to a premeasured length only",
        "Deep, until resistance is felt at the carina",
        "As deep as the catheter will physically go",
        "Depth doesn't matter if suction is brief"
      ]
    },
    {
      "id": "va-29",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Older teaching described inserting the suction catheter until resistance or cough at the carina ('deep suctioning'). Why has routine shallow suctioning replaced this as standard practice?",
      "a": "Deep suctioning increases mucosal trauma, bleeding, hypoxia, and vagal stimulation (bradycardia) without evidence of better secretion clearance than shallow, premeasured-depth suctioning. The added injury isn't offset by added benefit, so shallow is now the default; deep suctioning is reserved for specific indicated situations only.",
      "pearl": "Going deeper doesn't clear more mucus — it just injures more airway.",
      "choices": [
        "It causes more trauma and vagal stimulation with no added clearance benefit",
        "It is faster to perform than shallow suctioning",
        "It requires a smaller catheter than shallow suctioning",
        "It eliminates the need for pre-oxygenation"
      ]
    },
    {
      "id": "va-30",
      "topic": "valves",
      "difficulty": "medium",
      "q": "What suction pressure range is used for adult tracheostomy suctioning?",
      "a": "Approximately 80 to 120 mmHg. Pressures above this range risk mucosal trauma and hypoxia without clearing secretions any faster.",
      "pearl": "80 to 120 — more pressure isn't a shortcut, it's an injury.",
      "choices": [
        "80–120 mmHg",
        "20–40 mmHg",
        "150–200 mmHg",
        "250–300 mmHg"
      ]
    },
    {
      "id": "va-31",
      "topic": "valves",
      "difficulty": "medium",
      "q": "How long should a single suction pass (catheter in the airway) last, at most?",
      "a": "No more than about 10 to 15 seconds total. Longer passes significantly increase the risk of hypoxia.",
      "pearl": "If you're still counting past 15, you've already gone too long.",
      "choices": [
        "10–15 seconds",
        "60 seconds",
        "2–3 seconds",
        "There is no time limit as long as sats are monitored"
      ]
    },
    {
      "id": "va-32",
      "topic": "valves",
      "difficulty": "medium",
      "q": "If a second suction pass is needed, how long should you wait before repeating it?",
      "a": "Allow roughly 20 to 30 seconds of rest, ideally until the patient's oxygen saturation returns toward baseline, before passing the catheter again.",
      "pearl": "Let the sat come back up before you go back in.",
      "choices": [
        "About 20–30 seconds, until sats recover",
        "Immediately, back to back",
        "A full 10 minutes minimum every time",
        "Only if the patient asks for a break"
      ]
    },
    {
      "id": "va-33",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Explain the mechanism by which suctioning can cause sudden bradycardia.",
      "a": "The suction catheter mechanically stimulates vagal afferent nerve endings in the posterior pharynx, trachea, and carina; this triggers a vagal reflex that slows the heart rate, sometimes abruptly and significantly.",
      "pearl": "The catheter tickles the vagus nerve, and the heart answers by slowing down.",
      "choices": [
        "Catheter stimulation of vagal nerve endings triggers a reflex slowdown",
        "Suction pressure directly compresses the carotid artery",
        "Hypoxia alone always causes bradycardia within seconds",
        "The cuff pushes on the vagus nerve during suctioning"
      ]
    },
    {
      "id": "va-34",
      "topic": "valves",
      "difficulty": "medium",
      "q": "A patient's heart rate drops sharply while the suction catheter is still in the airway. What do you do immediately?",
      "a": "Stop suctioning and withdraw the catheter right away, then reassess heart rate and oxygenation before considering another pass. Continuing to suction through a vagal bradycardic response worsens it.",
      "pearl": "Heart rate drops mid-pass — the catheter comes out, not stays in.",
      "choices": [
        "Stop suctioning and withdraw the catheter immediately",
        "Continue suctioning to finish clearing secretions faster",
        "Increase suction pressure to clear secretions quicker",
        "Reposition the patient before withdrawing the catheter"
      ]
    },
    {
      "id": "va-35",
      "topic": "valves",
      "difficulty": "hard",
      "q": "How can suctioning trigger bronchospasm?",
      "a": "The catheter mechanically irritates the airway mucosa, which can provoke reflex bronchoconstriction — narrowing the airway and increasing work of breathing, sometimes audibly wheezy, immediately during or after the pass.",
      "pearl": "An irritated airway can slam its own door shut — that's bronchospasm.",
      "choices": [
        "Mechanical airway irritation triggers reflex bronchoconstriction",
        "Suction pressure directly inflates the bronchi",
        "It only occurs with oversized catheters",
        "It is caused exclusively by inadequate humidification"
      ]
    },
    {
      "id": "va-36",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Beyond simply 'interrupting a breath,' what makes suctioning itself a direct cause of hypoxia?",
      "a": "The suction catheter withdraws air, and the oxygen entrained in it, from the airway right along with the secretions, effectively removing volume from the lung during the pass — on top of interrupting ventilation, it actively pulls oxygen out of the airway.",
      "pearl": "Suction doesn't just pause a breath — it pulls oxygen out with the mucus.",
      "choices": [
        "The catheter withdraws entrained air and oxygen along with secretions",
        "Suctioning triggers hyperventilation that lowers CO2",
        "Suctioning always requires disconnecting oxygen for 5 minutes",
        "Hypoxia only occurs if the catheter is inserted too shallow"
      ]
    },
    {
      "id": "va-37",
      "topic": "valves",
      "difficulty": "hard",
      "q": "Why does applying suction pressure during catheter insertion cause more mucosal trauma than applying it only on withdrawal?",
      "a": "With suction on during insertion, the catheter tip can grab and drag against the tracheal mucosa continuously as it advances instead of passing in freely; combined with resistance from tube angulation, this shears and traumatizes the lining. Suctioning on withdrawal only lets the catheter advance freely and removes secretions in one controlled motion.",
      "pearl": "Suction during insertion drags the catheter against raw mucosa the whole way in.",
      "choices": [
        "The catheter drags against and shears the mucosa as it advances",
        "It causes the catheter to insert too shallow",
        "It increases catheter diameter mid-pass",
        "It has no additional effect on trauma, only on hypoxia"
      ]
    },
    {
      "id": "va-38",
      "topic": "valves",
      "difficulty": "easy",
      "q": "In the acute inpatient ENT/ICU setting, what is the default technique for open tracheostomy suctioning?",
      "a": "Sterile technique — sterile gloves and a sterile catheter for each pass, to limit introducing new organisms into the lower airway.",
      "pearl": "Inpatient open suctioning is sterile by default.",
      "choices": [
        "Sterile technique",
        "Clean technique",
        "No gloves required if hands are washed",
        "Technique doesn't matter for a single pass"
      ]
    },
    {
      "id": "va-39",
      "topic": "valves",
      "difficulty": "medium",
      "q": "When is clean (rather than sterile) suctioning technique appropriate?",
      "a": "For stable, chronic tracheostomy patients in the home or long-term care setting, where the risk profile and infection-control context differ from acute inpatient care. Always follow unit or agency protocol rather than improvising the technique tier.",
      "pearl": "Clean technique belongs at home with a stable trach — not on the acute inpatient floor.",
      "choices": [
        "Stable, chronic patients in home/long-term care settings",
        "Any patient after the first 24 hours post-op",
        "Whenever sterile supplies are unavailable",
        "Only for pediatric tracheostomy patients"
      ]
    },
    {
      "id": "va-40",
      "topic": "valves",
      "difficulty": "hard",
      "q": "A patient who was suctioned every 2 hours now needs it every 30 minutes. Before charting 'increased secretions,' what should you check first, and why?",
      "a": "Check humidification. Inadequate humidification dries and thickens secretions, dramatically raising suction demand and plug risk — correcting humidity often resolves the sudden increase in frequency without the patient actually being 'more secretory.'",
      "pearl": "Rising suction frequency → check the humidifier before you accept 'they're just secretory.'",
      "choices": [
        "Humidification adequacy",
        "Whether the patient wants a valve trial",
        "The cuff pressure trend",
        "The patient's oral intake"
      ]
    },
    {
      "id": "co-01",
      "topic": "complications",
      "difficulty": "easy",
      "q": "A post-op neck patient feels their neck getting tight and their voice change. What complication must you suspect immediately?",
      "a": "An expanding neck hematoma. Neck tightness, voice change, dysphagia, and restlessness are the earliest signs — they appear well before stridor.",
      "pearl": "Tight neck + voice change = hematoma until proven otherwise.",
      "choices": [
        "Expanding neck hematoma",
        "Normal post-op swelling",
        "Anxiety attack",
        "Allergic reaction"
      ]
    },
    {
      "id": "co-02",
      "topic": "complications",
      "difficulty": "easy",
      "q": "Where does stridor fall in the timeline of an expanding neck hematoma — early warning or late sign?",
      "a": "Stridor is a LATE sign. By the time stridor is audible, the airway is already critically narrowed; waiting for it means missing the window to act early.",
      "pearl": "If you're waiting for stridor to act, you've already waited too long.",
      "choices": [
        "A late sign, after tightness and voice change",
        "The earliest possible sign",
        "Only seen in laryngectomy patients",
        "A reassuring sign that swelling has stabilized"
      ]
    },
    {
      "id": "co-03",
      "topic": "complications",
      "difficulty": "medium",
      "q": "A neck hematoma is expanding and the patient looks worse. Why is a bedside surgeon exam the right first move instead of ordering a stat CT?",
      "a": "Expanding hematoma airway compromise is a clinical, bedside diagnosis — it can progress to obstruction in minutes. Sending the patient to CT delays the one thing that fixes it: the surgeon evacuating the clot.",
      "pearl": "Don't send a crashing neck to CT — bring the surgeon to the bedside.",
      "choices": [
        "CT delays definitive bedside decompression",
        "CT cannot see neck hematomas",
        "CT requires general anesthesia",
        "CT is contraindicated after neck surgery"
      ]
    },
    {
      "id": "co-04",
      "topic": "complications",
      "difficulty": "medium",
      "q": "An expanding neck hematoma is threatening the airway. Name the three things the bedside RN should be doing at once.",
      "a": "Call the surgeon/ENT and rapid response immediately; bring the airway cart to the bedside; and prepare for possible bedside wound opening (removing clips/sutures to evacuate the clot) since that may happen before the OR.",
      "pearl": "Call, cart, and be ready to open the wound at the bedside — don't wait for the OR.",
      "choices": [
        "Call for help, bring airway cart, prep bedside wound opening",
        "Call for help, order a CT, and wait",
        "Reassure the patient and recheck vitals in 30 minutes",
        "Apply ice and elevate the head of bed only"
      ]
    },
    {
      "id": "co-05",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Explain, physiologically, why an expanding neck hematoma can compromise the airway far faster than the external swelling suggests.",
      "a": "Bleeding trapped in the closed fascial spaces of the neck raises pressure on the venous and lymphatic drainage before it visibly bulges the skin. That congestion causes laryngeal and pharyngeal mucosal edema out of proportion to what you can see or palpate.",
      "pearl": "The airway swells on the inside long before the neck looks big on the outside.",
      "choices": [
        "Venous/lymphatic congestion causes internal laryngeal edema",
        "The hematoma directly punctures the trachea",
        "Blood pools only in subcutaneous fat, sparing the airway",
        "Swelling is always proportional to visible neck size"
      ]
    },
    {
      "id": "co-06",
      "topic": "complications",
      "difficulty": "easy",
      "q": "On free flap checks, a dusky, blue, congested appearance points to which type of vascular compromise?",
      "a": "Venous compromise — the outflow is blocked. It is more common than arterial failure and tends to show up earlier.",
      "pearl": "Dusky and congested = venous until proven otherwise.",
      "choices": [
        "Venous compromise",
        "Arterial compromise",
        "Normal healing flap",
        "Lymphedema"
      ]
    },
    {
      "id": "co-07",
      "topic": "complications",
      "difficulty": "easy",
      "q": "On free flap checks, a pale, cool flap with no Doppler signal points to which type of vascular compromise?",
      "a": "Arterial compromise — the inflow is blocked. It is less common than venous failure but is just as much a surgical emergency.",
      "pearl": "Pale, cool, silent Doppler = arterial — call it in immediately.",
      "choices": [
        "Arterial compromise",
        "Venous compromise",
        "Expected flap edema",
        "Dehydration"
      ]
    },
    {
      "id": "co-08",
      "topic": "complications",
      "difficulty": "easy",
      "q": "How often should a fresh free flap be checked in the early post-op period?",
      "a": "Hourly. Flap checks are frequent and non-negotiable in the first 24–72 hours because the salvage window for a failing flap is measured in hours, not days.",
      "pearl": "Hourly checks because time is tissue.",
      "choices": [
        "Every hour",
        "Once per shift",
        "Every 4 hours",
        "Only if the patient reports pain"
      ]
    },
    {
      "id": "co-09",
      "topic": "complications",
      "difficulty": "medium",
      "q": "Compare capillary refill and pinprick bleeding for venous versus arterial free flap compromise.",
      "a": "Venous compromise: brisk, dark capillary refill and rapid dark blood on pinprick (outflow is backed up). Arterial compromise: slow or absent refill and no bleeding at all on pinprick (no inflow to bleed from).",
      "pearl": "Fast and dark = venous backup. Absent and dry = arterial starvation.",
      "choices": [
        "Venous is brisk/dark, arterial is slow/absent",
        "Both look identical on pinprick testing",
        "Arterial bleeds faster and darker than venous",
        "Capillary refill cannot distinguish the two"
      ]
    },
    {
      "id": "co-10",
      "topic": "complications",
      "difficulty": "medium",
      "q": "A flap looks dusky on your routine check. Why is 'watch it for another hour and recheck' the wrong response?",
      "a": "Venous congestion has a narrow surgical salvage window — every hour of delay increases the odds of irreversible tissue death and flap loss. Call immediately instead of monitoring a known problem.",
      "pearl": "Dusky flap → call now, not 'watch and see.'",
      "choices": [
        "The salvage window closes with each hour of delay",
        "Dusky flaps usually self-resolve overnight",
        "Only pale flaps require urgent action",
        "Rechecking hourly is the correct next step"
      ]
    },
    {
      "id": "co-11",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why is venous compromise both more common AND earlier-presenting than arterial compromise in free flaps?",
      "a": "Veins are thin-walled, low-pressure, and easily kinked, compressed, or thrombosed by positioning, swelling, or a tight closure — so outflow fails first and more often. Arteries are thicker-walled and higher-pressure, so inflow failure is rarer and often follows established venous congestion.",
      "pearl": "Thin-walled veins fold before thick-walled arteries — that's why venous problems come first and come often.",
      "choices": [
        "Thin-walled veins are more easily compressed/kinked than arteries",
        "Arteries have no protective vasospasm reflex",
        "Veins carry oxygenated blood, making them more fragile",
        "Arterial thrombosis always precedes venous thrombosis"
      ]
    },
    {
      "id": "co-12",
      "topic": "complications",
      "difficulty": "easy",
      "q": "A neck drain suddenly turns milky or creamy after a neck dissection. What complication does this indicate?",
      "a": "A chyle leak — injury to the thoracic duct or a lymphatic channel. Report it immediately rather than assuming it's just a change in wound drainage.",
      "pearl": "Milky drain = chyle, not just 'different' drainage.",
      "choices": [
        "Chyle leak",
        "Wound infection",
        "Normal serous drainage",
        "Chylothorax has already occurred"
      ]
    },
    {
      "id": "co-13",
      "topic": "complications",
      "difficulty": "easy",
      "q": "A chyle leak is classically associated with which side and level of the neck?",
      "a": "The left neck, level IV — where the thoracic duct empties into the venous system near the junction of the internal jugular and subclavian veins.",
      "pearl": "Left neck, level IV — that's thoracic duct territory.",
      "choices": [
        "Left neck, level IV",
        "Right neck, level II",
        "Either side, level I",
        "Midline, level VI"
      ]
    },
    {
      "id": "co-14",
      "topic": "complications",
      "difficulty": "easy",
      "q": "What dietary factor makes a chyle leak's drain output worse?",
      "a": "A high-fat meal or diet. Dietary fat increases lymphatic (chyle) flow through the thoracic duct, which increases leak volume.",
      "pearl": "Fatty food feeds the leak — report the diet along with the drain output.",
      "choices": [
        "High-fat food intake",
        "High-protein food intake",
        "Caffeine intake",
        "Low-fluid intake"
      ]
    },
    {
      "id": "co-15",
      "topic": "complications",
      "difficulty": "medium",
      "q": "Beyond reporting a milky drain, what dietary management concept helps reduce chyle leak output?",
      "a": "A low-fat or medium-chain-triglyceride (MCT) diet, or NPO status with TPN for higher-output leaks, reduces flow through the thoracic duct and lets the leak seal. Follow the specific order — don't just restrict fat on your own initiative.",
      "pearl": "Starve the leak of fat, and it often starves itself shut.",
      "choices": [
        "Low-fat/MCT diet or NPO to reduce thoracic duct flow",
        "Encourage a high-calorie, high-fat diet to promote healing",
        "Increase oral fluids to flush the leak",
        "No dietary change is ever needed"
      ]
    },
    {
      "id": "co-16",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Physiologically, why does a low-fat or MCT-based diet specifically reduce chyle leak output?",
      "a": "Long-chain dietary fats are absorbed into intestinal lymphatics and travel via the thoracic duct, directly increasing chyle flow and leak volume. Medium-chain triglycerides are absorbed straight into the portal blood instead, largely bypassing the lymphatic route.",
      "pearl": "Long-chain fat travels by lymph; MCT skips the lymph route entirely — that's why the diet works.",
      "choices": [
        "MCTs bypass the lymphatic absorption route long-chain fats use",
        "All dietary fats are absorbed identically via the bloodstream",
        "MCTs increase thoracic duct pressure to seal the leak",
        "Fat restriction works by reducing overall drain suction"
      ]
    },
    {
      "id": "co-17",
      "topic": "complications",
      "difficulty": "easy",
      "q": "In a radiated neck, a small wound bleed stops on its own. Is this reassuring?",
      "a": "No. A self-limited bleed in a previously radiated or high-risk neck is treated as a sentinel (herald) bleed — a warning sign, not a resolved problem.",
      "pearl": "'It stopped' is a warning, not good news, in a radiated neck.",
      "choices": [
        "No — it is a sentinel bleed warning sign",
        "Yes — stopped bleeding means it resolved",
        "Only concerning if it happens twice",
        "Only concerning if the patient is hypotensive"
      ]
    },
    {
      "id": "co-18",
      "topic": "complications",
      "difficulty": "medium",
      "q": "A sentinel bleed occurs in a radiated neck. What should the RN ensure is ready at the bedside while awaiting surgical/IR evaluation?",
      "a": "Suction, gloves, and direct-pressure supplies at the bedside, plus urgent escalation to surgery or interventional radiology. The goal is to be ready for a much larger bleed, not just to document the small one.",
      "pearl": "Prep for the big bleed while you're still dealing with the small one.",
      "choices": [
        "Suction, gloves, and direct-pressure supplies at bedside",
        "Nothing extra — routine documentation is sufficient",
        "A CT scan ordered for the next morning",
        "Discontinue anticoagulation and reassess in 24 hours"
      ]
    },
    {
      "id": "co-19",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why does a sentinel bleed in a radiated, previously operated neck raise concern specifically for carotid blowout?",
      "a": "Radiation causes endarteritis and progressive breakdown of the arterial wall, and prior surgery or a fistula can expose the carotid directly. A small bleed in this setting can be the first crack in that weakened vessel wall before catastrophic rupture.",
      "pearl": "Radiation doesn't just scar skin — it weakens the artery wall underneath it.",
      "choices": [
        "Radiation-damaged vessel wall is starting to fail",
        "Sentinel bleeds are unrelated to vessel integrity",
        "It indicates a new, unrelated wound infection",
        "It only matters if the patient is anticoagulated"
      ]
    },
    {
      "id": "co-20",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why does carotid blowout carry such high mortality even with modern endovascular treatment available?",
      "a": "Once acute rupture occurs, hemorrhage can be massive and sudden, and the exposed, radiation-damaged vessel is a poor surgical field. Reported mortality remains roughly 40–60% even with contemporary embolization and stenting, which is why a sentinel bleed must be treated as the last warning, not the crisis itself.",
      "pearl": "By the time it's an acute blowout, you're fighting from behind — act on the sentinel bleed instead.",
      "choices": [
        "Rupture is sudden/massive in a hostile, damaged vessel bed",
        "Modern treatments have made blowout rarely fatal",
        "Mortality is high only if untreated for days",
        "Endovascular stenting eliminates the risk entirely"
      ]
    },
    {
      "id": "co-21",
      "topic": "complications",
      "difficulty": "easy",
      "q": "You notice a tracheostomy tube pulsating with the heartbeat. What must you suspect?",
      "a": "A tracheo-innominate artery fistula — the tube is eroding into the innominate artery. This is a rare but life-threatening emergency requiring an immediate call for help.",
      "pearl": "A pulsating trach tube is not a curiosity — it's a warning of a fistula into the artery.",
      "choices": [
        "Tracheo-innominate artery fistula",
        "Normal tube movement with breathing",
        "A sign the cuff needs more air",
        "A sign of tube displacement only"
      ]
    },
    {
      "id": "co-22",
      "topic": "complications",
      "difficulty": "easy",
      "q": "A trach patient suddenly has brisk, bright-red bleeding from the tube. What is the first thing you do?",
      "a": "Call for help immediately — this is treated as a tracheo-innominate artery fistula until proven otherwise, a surgical emergency that can be fatal within minutes.",
      "pearl": "Bright red, brisk, and from the tube — call now, don't wait to characterize it further.",
      "choices": [
        "Call for help immediately",
        "Suction and reassess in 15 minutes",
        "Apply a dressing to the stoma and wait",
        "Document and notify at next rounds"
      ]
    },
    {
      "id": "co-23",
      "topic": "complications",
      "difficulty": "medium",
      "q": "In what time window after tracheostomy does a tracheo-innominate artery fistula most commonly occur?",
      "a": "Typically after the first 48 hours, with the highest risk in roughly the first 1–3 weeks post-tracheostomy, though it can occur later. This is why a 'day one' bleed is more likely something else, while a pulsatile or brisk bleed in week 1–2 is treated as TIF until proven otherwise.",
      "pearl": "First 48 hours, think something else. First few weeks, think TIF.",
      "choices": [
        "Typically after 48 hours, peaking around 1–3 weeks",
        "Almost always within the first 24 hours",
        "Only after 6 months or more",
        "Timing has no relationship to risk"
      ]
    },
    {
      "id": "co-24",
      "topic": "complications",
      "difficulty": "medium",
      "q": "A tracheo-innominate fistula is suspected and actively bleeding. What is the FIRST temporizing maneuver at the bedside?",
      "a": "Hyperinflate the tracheostomy cuff to tamponade the bleeding vessel against the tracheal wall. This controls bleeding in the majority of cases while the team prepares for the OR.",
      "pearl": "Cuff up, hard, first — it's tamponade, not just an airway seal.",
      "choices": [
        "Hyperinflate the tracheostomy cuff",
        "Deflate the cuff to relieve pressure",
        "Remove the tube entirely and pack the stoma",
        "Give antifibrinolytic medication IV first"
      ]
    },
    {
      "id": "co-25",
      "topic": "complications",
      "difficulty": "medium",
      "q": "Cuff hyperinflation fails to control a tracheo-innominate fistula bleed. What temporizing maneuver comes next?",
      "a": "Digital pressure — a gloved finger is inserted through the stoma and used to compress the artery anteriorly against the sternum/manubrium — while preparations for emergency surgery continue.",
      "pearl": "If the cuff can't hold it, a finger through the stoma can.",
      "choices": [
        "Digital pressure through the stoma against the sternum",
        "Packing the mouth with gauze",
        "High-dose IV vasopressors alone",
        "Elevating the head of bed and waiting"
      ]
    },
    {
      "id": "co-26",
      "topic": "complications",
      "difficulty": "medium",
      "q": "Once a tracheo-innominate fistula is bleeding and temporized, what is the definitive next step?",
      "a": "Immediate transport to the OR for surgical control and repair (typically ligation of the innominate artery). Cuff hyperinflation and digital pressure only buy time — they are not the treatment.",
      "pearl": "Temporizing measures buy minutes. The OR is the only fix.",
      "choices": [
        "Immediate OR for surgical control",
        "Observation on the unit with frequent vitals",
        "Interventional radiology embolization as first-line, always",
        "Discharge planning once bleeding stops"
      ]
    },
    {
      "id": "co-27",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Physiologically, why does a pulsating tracheostomy tube signal an innominate artery fistula?",
      "a": "The tube tip or cuff has eroded through the tracheal wall into the adjacent innominate artery. The artery's pulsation is transmitted directly through the eroded tract into the tube itself.",
      "pearl": "A pulsating tube means the tube and the artery are no longer separated by tissue.",
      "choices": [
        "The tube has eroded into direct contact with the artery",
        "The heart rate is simply visible through the chest wall",
        "It reflects a hyperdynamic cardiac state, not local erosion",
        "It is caused by excessive cuff pressure alone, with no erosion"
      ]
    },
    {
      "id": "co-28",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why does hyperinflating the cuff work as an effective temporizing measure for a tracheo-innominate fistula?",
      "a": "The overinflated cuff mechanically compresses the eroded artery against the posterior tracheal wall, tamponading the bleeding vessel directly at the fistula site — controlling hemorrhage in the majority of cases until surgery.",
      "pearl": "The cuff becomes a compression device, not just a seal, when it's pressed against a bleeding artery.",
      "choices": [
        "The cuff tamponades the artery against the tracheal wall",
        "The cuff reduces cardiac output and thus bleeding pressure",
        "The cuff seals the airway so blood cannot be seen",
        "The cuff triggers local vasoconstriction of the vessel"
      ]
    },
    {
      "id": "co-29",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why must an oral endotracheal tube be secured with its cuff distal to the fistula site during tracheo-innominate fistula management?",
      "a": "It protects the lower airway from blood pooling in the trachea above — with a secure distal airway and cuff seal, blood from the fistula site is kept from flooding the tracheobronchial tree and causing the patient to drown in their own hemorrhage.",
      "pearl": "Secure the airway below the bleed so the lungs don't fill with it.",
      "choices": [
        "It seals off the airway below the bleed from aspirated blood",
        "It provides better oxygen delivery than the tracheostomy tube",
        "It reduces the pressure needed for cuff hyperinflation",
        "It allows suction to reach the innominate artery directly"
      ]
    },
    {
      "id": "co-30",
      "topic": "complications",
      "difficulty": "easy",
      "q": "A laryngectomy patient has clear-to-thin fluid appearing in the neck drain or wound that increases with oral intake. What complication does this suggest?",
      "a": "A pharyngocutaneous fistula — a leak of saliva from the reconstructed pharynx through the wound. It should be reported, not dismissed as normal drainage.",
      "pearl": "Drainage that tracks with swallowing is saliva, not serum — think fistula.",
      "choices": [
        "Pharyngocutaneous fistula",
        "Normal post-op serosanguinous drainage",
        "Chyle leak",
        "Wound seroma"
      ]
    },
    {
      "id": "co-31",
      "topic": "complications",
      "difficulty": "easy",
      "q": "Why is strict NPO status critical for a patient with a suspected pharyngocutaneous fistula?",
      "a": "Oral intake sends saliva and food directly through the leak site, contaminating the wound and preventing it from healing. Keeping the patient NPO removes that ongoing insult so the fistula can close.",
      "pearl": "Every swallow feeds the fistula — NPO lets it heal.",
      "choices": [
        "Oral intake continually contaminates and reopens the leak",
        "NPO prevents aspiration only, unrelated to the fistula",
        "It has no bearing on healing, only comfort",
        "It is required only if the patient is febrile"
      ]
    },
    {
      "id": "co-32",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why are pharyngocutaneous fistulas more common and slower to heal in patients who received prior radiation?",
      "a": "Radiation causes chronic microvascular damage and endarteritis obliterans, reducing blood supply to the pharyngeal closure. Poorly perfused tissue is both more likely to break down under tension or infection and heals far more slowly once it does.",
      "pearl": "Radiated tissue doesn't just scar — it starves for blood supply, and that's why it breaks down and stays open.",
      "choices": [
        "Radiation impairs local blood supply, slowing healing",
        "Radiation has no effect on wound healing rates",
        "Fistulas are unrelated to prior treatment history",
        "Radiation only affects skin, not deeper tissue"
      ]
    },
    {
      "id": "co-33",
      "topic": "complications",
      "difficulty": "easy",
      "q": "You palpate crackling under the skin around a fresh tracheostomy site. What is this finding called?",
      "a": "Subcutaneous emphysema — air has tracked into the soft tissues around the stoma. It should be reported and the extent monitored, since it can signal a more serious air leak.",
      "pearl": "Crackly skin around a fresh trach = air where air shouldn't be — report it.",
      "choices": [
        "Subcutaneous emphysema",
        "Normal post-op swelling",
        "Wound infection",
        "An expected finding requiring no action"
      ]
    },
    {
      "id": "co-34",
      "topic": "complications",
      "difficulty": "medium",
      "q": "Why is new or worsening subcutaneous emphysema after a tracheostomy a red flag rather than a benign finding?",
      "a": "It signals that air is escaping outside the trachea, which can indicate tracheal wall injury or a false passage — and it can herald or accompany a pneumothorax. Track its extent and escalate if it is spreading.",
      "pearl": "Spreading crepitus after a trach means air is going somewhere it shouldn't — find out where.",
      "choices": [
        "It can signal tracheal injury or an accompanying pneumothorax",
        "It always resolves spontaneously and needs no monitoring",
        "It only ever indicates cuff over-inflation",
        "It confirms tube displacement into the esophagus"
      ]
    },
    {
      "id": "co-35",
      "topic": "complications",
      "difficulty": "medium",
      "q": "What is the anatomical mechanism by which a tracheostomy insertion can cause a pneumothorax?",
      "a": "The pleural apex, especially on the right, sits close to the lower neck/upper chest and can be inadvertently injured during tube insertion — particularly with a low or difficult tracheostomy — allowing air into the pleural space.",
      "pearl": "The lung's apex is closer to the neck than you'd think — that's the pneumothorax risk during trach insertion.",
      "choices": [
        "Injury to the nearby pleural apex during insertion",
        "Air always enters through the inner cannula opening",
        "It results only from excessive suctioning pressure",
        "It occurs solely from HME obstruction"
      ]
    },
    {
      "id": "co-36",
      "topic": "complications",
      "difficulty": "hard",
      "q": "A trach patient develops rapidly spreading subcutaneous emphysema along with new hypotension and tachycardia. What must you rule out urgently, and why can't you rely on subcutaneous emphysema extent alone?",
      "a": "Tension pneumothorax. Subcutaneous emphysema severity does not reliably correlate with pleural involvement — hemodynamic instability alongside it demands immediate clinical assessment and imaging/decompression, not just tracking the crepitus.",
      "pearl": "Crepitus tells you air escaped; vitals tell you if it's collapsing a lung — trust the vitals.",
      "choices": [
        "Tension pneumothorax — vitals, not crepitus extent, are the alarm",
        "Nothing further — subcutaneous emphysema is self-limited",
        "Anaphylaxis, since crepitus mimics angioedema",
        "Sepsis, since emphysema indicates infection"
      ]
    },
    {
      "id": "co-37",
      "topic": "complications",
      "difficulty": "medium",
      "q": "A chronic trach patient develops increasing resistance passing the suction catheter and occasional blood-tinged secretions weeks after placement. What is a likely cause?",
      "a": "Granulation tissue forming at the stoma or tube tip. It's a common reaction to chronic tube irritation and should be reported to ENT for evaluation, since it can bleed and progressively narrow the airway.",
      "pearl": "New resistance plus new blood in a chronic trach — think granulation tissue, not just 'thicker secretions.'",
      "choices": [
        "Granulation tissue at the stoma or tube tip",
        "A brand-new mucus plug only",
        "Normal tract maturation with no action needed",
        "Tube size has simply become too small by design"
      ]
    },
    {
      "id": "co-38",
      "topic": "complications",
      "difficulty": "hard",
      "q": "A patient decannulated months ago now has progressive shortness of breath and noisy breathing on exertion. What late complication should be suspected, and what causes it?",
      "a": "Late tracheal stenosis — chronic irritation and granulation tissue at the stoma or cuff site heals with fibrotic, cicatricial scarring that narrows the tracheal lumen over weeks to months, sometimes not becoming symptomatic until well after decannulation.",
      "pearl": "Tracheal stenosis is a slow burn — it can show up long after the trach is gone.",
      "choices": [
        "Late tracheal stenosis from cicatricial scarring at the stoma/cuff site",
        "Recurrent pneumonia unrelated to the prior trach",
        "Vocal cord paralysis from the original surgery",
        "Anxiety-related dyspnea with no anatomic cause"
      ]
    },
    {
      "id": "co-39",
      "topic": "complications",
      "difficulty": "medium",
      "q": "What wound findings in a previously radiated neck should lower your threshold to notify the surgical team right away?",
      "a": "Increasing redness, purulent drainage, wound edge separation, exposed vessel or hardware, or a foul odor. In radiated tissue these findings progress faster and are more dangerous than in unradiated skin, so report early rather than waiting to 'see how it looks tomorrow.'",
      "pearl": "In a radiated neck, a wound problem today is a bigger problem tomorrow — report it now.",
      "choices": [
        "Redness, purulent drainage, edge separation, exposed vessel/hardware",
        "Only frank pus counts as reportable",
        "Mild serous drainage on day one always needs urgent report",
        "Only fever qualifies as a reportable wound sign"
      ]
    },
    {
      "id": "co-40",
      "topic": "complications",
      "difficulty": "hard",
      "q": "Why does radiated neck tissue carry a much higher baseline risk of wound dehiscence and infection than non-radiated tissue?",
      "a": "Radiation causes endarteritis obliterans and progressive microvascular fibrosis, reducing blood flow and oxygen delivery to the tissue. Poorly perfused tissue heals poorly, resists infection less effectively, and is more prone to breaking down under normal wound tension.",
      "pearl": "Radiation leaves tissue looking healed on the surface while starving it of blood underneath — that's why it fails.",
      "choices": [
        "Radiation-induced microvascular damage impairs perfusion and healing",
        "Radiated tissue has increased blood supply, raising bleeding risk",
        "Radiation only affects the tumor bed, not surrounding tissue",
        "Radiated skin is thicker and heals faster than normal skin"
      ]
    },
    {
      "id": "da-01",
      "topic": "daily",
      "difficulty": "easy",
      "q": "Why must a tracheostomy or laryngectomy patient receive active humidification of inspired air?",
      "a": "The stoma bypasses the nose and upper airway, which normally warm, humidify, and filter every breath. Without a humidification source, that job simply doesn't happen, so mucosal drying and thickened secretions follow.",
      "pearl": "The stoma has no nose behind it — you have to supply what the nose used to do.",
      "choices": [
        "The stoma bypasses the nose's warming/humidifying/filtering function",
        "It prevents the cuff from deflating overnight",
        "It keeps the speaking valve from sticking",
        "It replaces the need for suctioning entirely"
      ]
    },
    {
      "id": "da-02",
      "topic": "daily",
      "difficulty": "easy",
      "q": "How does a Heat and Moisture Exchanger (HME, 'Swedish nose') humidify a patient's breathing?",
      "a": "It passively traps the patient's own exhaled heat and moisture in a filter medium, then returns it on the next inhaled breath — no external water or power source is used.",
      "pearl": "The HME doesn't add moisture — it recycles the moisture already there.",
      "choices": [
        "Passively recycles the patient's own exhaled heat and moisture",
        "Actively pumps heated water vapor from a reservoir",
        "Filters air through a cooling mist",
        "Delivers nebulized saline on a timer"
      ]
    },
    {
      "id": "da-03",
      "topic": "daily",
      "difficulty": "easy",
      "q": "What does a trach collar (humidified mask) do that an HME does not?",
      "a": "It actively delivers externally humidified oxygen or air from a separate humidification/oxygen source, rather than relying on the patient's own exhaled moisture.",
      "pearl": "HME recycles; the collar supplies — from an outside source.",
      "choices": [
        "Actively delivers externally humidified gas from an outside source",
        "Passively warms air using body heat alone",
        "Filters bacteria without adding any moisture",
        "Only works when the cuff is inflated"
      ]
    },
    {
      "id": "da-04",
      "topic": "daily",
      "difficulty": "easy",
      "q": "What is one of the earliest bedside signs that a trach patient's secretions are becoming dangerously thick?",
      "a": "Secretions that turn thick, tenacious, or crusty are an early warning sign of inadequate humidification and impending mucus plug — well before a full obstruction occurs.",
      "pearl": "Crusty secretions today are a plug rehearsing for tomorrow.",
      "choices": [
        "Secretions become thick, tenacious, or crusty",
        "Secretions become thinner and more watery",
        "The patient's voice suddenly improves",
        "The stoma dressing stays perfectly dry"
      ]
    },
    {
      "id": "da-05",
      "topic": "daily",
      "difficulty": "easy",
      "q": "A trach patient who was suctioned every 2 hours now needs suctioning every 30 minutes. What does this rising frequency signal?",
      "a": "Rising suction frequency is an early warning sign that secretions are thickening and the airway is trending toward a mucus plug — it should prompt assessment, not just more suctioning.",
      "pearl": "More suctioning isn't just 'more secretory' — it's a trend line pointing at a plug.",
      "choices": [
        "An early warning sign of a developing mucus plug",
        "A normal, expected daily fluctuation",
        "Proof the inner cannula needs replacing with a larger one",
        "A sign the cuff pressure is too low"
      ]
    },
    {
      "id": "da-06",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Suction frequency is climbing and secretions are thickening — what should you check FIRST, before assuming the patient is just 'more secretory'?",
      "a": "Check the humidification source and delivery — HME in place and patent, or trach collar actually running and connected. Correcting inadequate humidification often resolves the rising suction demand on its own.",
      "pearl": "Before you blame the patient's secretions, blame the humidifier.",
      "choices": [
        "Whether humidification is actually in place and working",
        "Whether the patient's family has visited today",
        "Whether the speaking valve is the correct color",
        "Whether the patient prefers oral care first"
      ]
    },
    {
      "id": "da-07",
      "topic": "daily",
      "difficulty": "hard",
      "q": "A trach patient on a passive HME has secretions that are already thick and increasingly hard to clear despite the HME being in place. What is the correct next humidification step, and why?",
      "a": "Switch to active heated humidification (trach collar) rather than relying on the HME. A passive HME can only recycle the moisture the patient already exhales — it cannot add extra water to rescue an airway that is already drying out, while a heated humidifier actively adds it.",
      "pearl": "An HME can't out-humidify a deficit it didn't cause — once secretions are thick, go active.",
      "choices": [
        "Switch to active heated humidification — the HME can't add extra moisture",
        "Increase suction frequency and leave the HME in place",
        "Add a second HME in series for double filtration",
        "Switch to a smaller inner cannula to widen the lumen"
      ]
    },
    {
      "id": "da-08",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Why can pulse oximetry stay reassuringly normal even as a mucus plug is silently developing overnight?",
      "a": "SpO2 typically only falls once airway narrowing becomes severe — a partially occluding plug can progress for hours behind a normal saturation, especially with supplemental oxygen buffering the drop. Secretion character and work of breathing are earlier signals than the number on the monitor.",
      "pearl": "A normal sat number doesn't mean a normal airway — it means not yet a critical one.",
      "choices": [
        "SpO2 only drops once narrowing is severe, lagging behind the true process",
        "SpO2 always falls immediately with any secretion buildup",
        "Pulse oximeters cannot function on trach patients",
        "SpO2 rises falsely high when secretions thicken"
      ]
    },
    {
      "id": "da-09",
      "topic": "daily",
      "difficulty": "easy",
      "q": "How often must the suction apparatus and catheters at a trach patient's bedside be verified to be working?",
      "a": "At the start of every shift — a suction unit that isn't tested until the emergency starts is not a functioning safety device.",
      "pearl": "Untested suction at the bedside is a decoration, not a rescue tool.",
      "choices": [
        "At the start of every shift",
        "Once on admission only",
        "Only after the physician orders it",
        "Whenever the patient requests it"
      ]
    },
    {
      "id": "da-10",
      "topic": "daily",
      "difficulty": "easy",
      "q": "What two spare tracheostomy tubes must be kept at every trach patient's bedside?",
      "a": "One spare tube of the SAME size as the patient's current tube, and one spare tube ONE SIZE SMALLER — both checked and present at every shift start.",
      "pearl": "Same size and one smaller — both, every time, no exceptions.",
      "choices": [
        "Same size AND one size smaller",
        "Same size and one size larger",
        "Only the same size, doubled up",
        "Any size, as long as one is present"
      ]
    },
    {
      "id": "da-11",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Why keep a spare tube one size SMALLER at the bedside, not just a same-size spare?",
      "a": "If the tract has narrowed, tightened, or become edematous, the same-size tube may not pass. The smaller tube is more likely to re-enter the airway and secure it, buying time even when the same size fails.",
      "pearl": "If the same size won't go, the smaller one is what saves the airway.",
      "choices": [
        "A tightened or edematous tract may not accept the same size",
        "It is more comfortable for the patient long-term",
        "Smaller tubes require less frequent cleaning",
        "It matches the pediatric emergency cart standard"
      ]
    },
    {
      "id": "da-12",
      "topic": "daily",
      "difficulty": "easy",
      "q": "After a trach tube is inserted, where must the obturator be kept?",
      "a": "At the bedside, immediately visible and reachable (many units tape it to the bedhead or keep it in the emergency box). If the tube comes out, the obturator is needed to guide atraumatic emergency reinsertion.",
      "pearl": "The obturator lives at the bedhead, not in a drawer — you need it in seconds, not minutes.",
      "choices": [
        "At the bedside, visible and immediately reachable",
        "Discarded — it is single-use only",
        "Sent home with the family for the next change",
        "In the medication room with the trach supplies"
      ]
    },
    {
      "id": "da-13",
      "topic": "daily",
      "difficulty": "easy",
      "q": "What is the 10 mL syringe at the bedside used for?",
      "a": "Inflating and deflating the tracheostomy tube's cuff via the pilot balloon — it must be immediately available any time cuff management is needed, including emergencies.",
      "pearl": "No syringe, no cuff control — keep it at the bedside, not in a drawer down the hall.",
      "choices": [
        "Inflating and deflating the cuff via the pilot balloon",
        "Instilling saline into the inner cannula only",
        "Measuring the patient's tidal volume",
        "Irrigating the stoma wound"
      ]
    },
    {
      "id": "da-14",
      "topic": "daily",
      "difficulty": "easy",
      "q": "Why must spare inner cannulas be kept at the bedside?",
      "a": "A plugged or damaged inner cannula must be swapped immediately for a clean one to restore a patent airway — without a spare on hand, the nurse has no fast way to clear that obstruction.",
      "pearl": "A dirty inner cannula is a fixable problem only if a clean one is already in the room.",
      "choices": [
        "To allow immediate swap if the current one plugs or is damaged",
        "To use as a backup obturator",
        "To practice cleaning technique on",
        "To replace the outer cannula if it cracks"
      ]
    },
    {
      "id": "da-15",
      "topic": "daily",
      "difficulty": "easy",
      "q": "Why must a bag-valve-mask (BVM) and oxygen source be kept at every trach/laryngectomy bedside?",
      "a": "If the patient stops breathing effectively, the BVM allows immediate manual ventilation — via face and/or stoma for a trach, stoma only for a laryngectomy — while help arrives.",
      "pearl": "You can't bag a patient with equipment that's still in the supply room.",
      "choices": [
        "To allow immediate manual ventilation if breathing fails",
        "To provide passive humidification overnight",
        "To measure cuff pressure at the bedside",
        "To store extra tracheostomy ties"
      ]
    },
    {
      "id": "da-16",
      "topic": "daily",
      "difficulty": "easy",
      "q": "Why must bedside signage clearly state whether a patient is a tracheostomy or a total laryngectomy?",
      "a": "The two require opposite emergency actions — where oxygen goes, whether the mouth is a viable airway, and whether bag-mask ventilation via the face can work at all. Anyone entering the room in a crisis must be able to tell instantly.",
      "pearl": "Wrong airway assumption, wrong first move — the sign prevents that guess entirely.",
      "choices": [
        "The two conditions require opposite emergency airway management",
        "It satisfies an infection control requirement",
        "It tells visitors where the call bell is",
        "It documents the surgeon's name for billing"
      ]
    },
    {
      "id": "da-17",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Why is a posted, visible emergency airway algorithm considered essential bedside equipment, not just a suction catheter and spare tube?",
      "a": "In a real airway crisis, stress narrows thinking and steps get skipped or reordered. A visible algorithm gives any responder — including staff unfamiliar with this specific patient — an immediate, correct sequence to follow without relying on memory alone.",
      "pearl": "In a crisis, don't make anyone recall the steps — post them on the wall.",
      "choices": [
        "It gives responders a correct sequence without relying on memory under stress",
        "It replaces the need for staff training entirely",
        "It is required only for laryngectomy patients",
        "It substitutes for having a spare tube at bedside"
      ]
    },
    {
      "id": "da-18",
      "topic": "daily",
      "difficulty": "medium",
      "q": "How often should the inner cannula be removed and inspected at minimum, even if the patient looks comfortable?",
      "a": "At least once per shift (roughly every 8–12 hours) — more often if secretions are thick or copious. Waiting for visible distress means checking too late.",
      "pearl": "Inspect the inner cannula on a schedule — don't wait for it to announce itself with a desat.",
      "choices": [
        "At least once per shift, more often with thick secretions",
        "Only when the patient reports difficulty breathing",
        "Once every 72 hours regardless of secretions",
        "Only during the admission assessment"
      ]
    },
    {
      "id": "da-19",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Beyond routine hygiene, what specific airway risk does a scheduled inner cannula check catch that waiting for symptoms would miss?",
      "a": "It catches a PARTIALLY occluding plug while the cannula can still simply be swapped for a clean one — before it progresses to a fully obstructed airway and a crashing patient. Scheduled checks intercept the problem mid-progression, not at its endpoint.",
      "pearl": "Find the plug at 50% occlusion, not at 100% — that's what the schedule is for.",
      "choices": [
        "It catches partial occlusion before it becomes a full obstruction",
        "It confirms the outer cannula size is still correct",
        "It verifies the patient's swallow function",
        "It checks whether the cuff pressure is in range"
      ]
    },
    {
      "id": "da-20",
      "topic": "daily",
      "difficulty": "medium",
      "q": "How should peristomal skin be cleaned, and what common antiseptic should be avoided?",
      "a": "Clean daily (or more often if soiled) with normal saline; avoid hydrogen peroxide, which is cytotoxic to healing and granulating tissue and can delay stoma healing.",
      "pearl": "Saline heals; peroxide on a healing stoma just slows the healing down.",
      "choices": [
        "Normal saline daily or more; avoid hydrogen peroxide",
        "Straight hydrogen peroxide, applied twice daily",
        "Alcohol-based antiseptic wipes, applied once weekly",
        "Tap water only, applied hourly"
      ]
    },
    {
      "id": "da-21",
      "topic": "daily",
      "difficulty": "medium",
      "q": "What kind of dressing belongs at a fresh stoma, and what should NOT be used?",
      "a": "A non-fraying, absorbent split or foam trach dressing designed for the purpose. Plain cut gauze should be avoided — its loose fibers can shed and be inhaled directly into the airway.",
      "pearl": "Cut gauze sheds fibers; a stoma is the last place you want loose fibers headed.",
      "choices": [
        "A non-fraying absorbent trach dressing, not cut gauze",
        "Plain cut gauze folded into quarters",
        "A transparent film dressing sealed airtight",
        "No dressing at all, ever"
      ]
    },
    {
      "id": "da-22",
      "topic": "daily",
      "difficulty": "medium",
      "q": "What causes moisture-associated skin damage (MASD) around a stoma?",
      "a": "Prolonged exposure of the peristomal skin to trapped secretions, moisture, or friction — from mucus, a saturated dressing, or a tight flange/tie rubbing the skin — breaks down the skin over time.",
      "pearl": "Skin breakdown at the stoma is rarely dramatic — it's slow, wet, and preventable.",
      "choices": [
        "Trapped moisture and secretions breaking down the skin over time",
        "A single episode of forceful suctioning",
        "Allergy to the tracheostomy tube material alone",
        "Excessive humidification of inspired air"
      ]
    },
    {
      "id": "da-23",
      "topic": "daily",
      "difficulty": "easy",
      "q": "How do you check that trach ties are snug enough, but not too tight?",
      "a": "You should be able to fit one to two fingers between the tie and the patient's neck — snug enough to prevent the tube slipping out, loose enough to avoid pressure injury.",
      "pearl": "One to two fingers, every check — not a guess, a measurement.",
      "choices": [
        "One to two fingers should fit between the tie and the neck",
        "The tie should be loose enough to slide the whole tube through",
        "The tie should leave a visible gap of several inches",
        "The tie should be tight enough to blanch the skin"
      ]
    },
    {
      "id": "da-24",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Why does trach tie snugness matter in BOTH directions — too tight and too loose?",
      "a": "Too tight causes pressure injury and skin breakdown at the neck; too loose lets the tube shift or slip out, risking accidental decannulation — especially dangerous if the tract is still immature.",
      "pearl": "Too tight hurts the skin. Too loose loses the airway. Aim for the middle, every shift.",
      "choices": [
        "Too tight injures skin; too loose risks accidental decannulation",
        "Too tight is fine as long as the cuff is inflated",
        "Snugness only matters for laryngectomy patients",
        "Snugness only matters during the first 24 hours"
      ]
    },
    {
      "id": "da-25",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Why is a trach tie or tube change always a two-person task?",
      "a": "One person holds and stabilizes the tube in the stoma while the second person changes the ties or tube — this prevents accidental dislodgement or complete decannulation during the moment the securement is open.",
      "pearl": "One pair of hands holds the airway; the other pair does the work.",
      "choices": [
        "One person stabilizes the tube while the other changes it",
        "It is faster with two people, but not for safety",
        "Regulations require two signatures on the chart",
        "It allows one person to document while the other works"
      ]
    },
    {
      "id": "da-26",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Who performs the FIRST tracheostomy tube change after surgery, and roughly when?",
      "a": "The surgeon or surgical/ENT team performs the first tube change, not the bedside nurse routinely — and only once the tract has had time to mature (commonly around 5–7 days), not on a fixed calendar regardless of healing.",
      "pearl": "The first change belongs to the team that made the hole — after the tract is ready, not before.",
      "choices": [
        "The surgeon/ENT team, after the tract has matured",
        "Any RN, on postoperative day one",
        "The respiratory therapist, immediately after surgery",
        "The patient's family, once trained at bedside"
      ]
    },
    {
      "id": "da-27",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Physiologically, why is changing a tracheostomy tube before the tract has matured dangerous?",
      "a": "The tract from skin to trachea hasn't yet epithelialized into a stable channel. Removing the tube too early risks the replacement tube tracking into a false passage in the soft tissue instead of the trachea, causing subcutaneous emphysema, loss of the airway, or worse.",
      "pearl": "An immature tract has no muscle memory — force a tube in and it can go anywhere but the trachea.",
      "choices": [
        "The immature tract can let the new tube create a false passage",
        "The cuff cannot be inflated correctly until day 7",
        "The stoma bleeds excessively at any point before day 5",
        "Early changes always trigger a vasovagal reaction"
      ]
    },
    {
      "id": "da-28",
      "topic": "daily",
      "difficulty": "easy",
      "q": "On your shift check the pilot balloon feels completely flat. What does that tell you?",
      "a": "The cuff has lost its air — from deliberate deflation, a leak, or a ruptured cuff or valve. Verify whether the cuff should be inflated, check pressure with a manometer, and escalate if the cuff will not hold air, since a failed cuff means lost ventilation seal and aspiration protection.",
      "pearl": "Flat pilot balloon = flat cuff. Find out why before the next feed or vent breath.",
      "choices": [
        "The cuff is deflated or has lost air — investigate why",
        "This is normal and needs no action",
        "The inner cannula is blocked",
        "The tube is in a false passage"
      ]
    },
    {
      "id": "da-29",
      "topic": "daily",
      "difficulty": "hard",
      "q": "What goes wrong physiologically if cuff pressure runs too HIGH versus too LOW?",
      "a": "Too high (roughly above 30 cmH2O) compresses tracheal mucosal capillaries, risking ischemia, tracheomalacia, or fistula over time. Too low (below about 20 cmH2O) fails to seal the airway, allowing secretions to microaspirate past the cuff.",
      "pearl": "Too high erodes the trachea from inside; too low lets secretions sneak past — the safe zone sits between them.",
      "choices": [
        "High pressure causes tracheal ischemia; low pressure allows microaspiration",
        "High pressure only affects comfort, not tissue",
        "Low pressure always causes immediate decannulation",
        "Cuff pressure has no effect on the trachea itself"
      ]
    },
    {
      "id": "da-30",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Why is having the call bell within reach a core airway SAFETY requirement for a trach patient, not just a comfort measure?",
      "a": "A trach or laryngectomy patient often cannot call out verbally for help — if the call bell is out of reach, they have no way to summon a nurse when something goes wrong.",
      "pearl": "No voice, no reach, no help — the call bell is their only alarm.",
      "choices": [
        "The patient often cannot call out verbally for help",
        "It reduces the frequency of routine nursing rounds",
        "It is only required for pediatric trach patients",
        "It allows the patient to adjust their own oxygen flow"
      ]
    },
    {
      "id": "da-31",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Besides a call bell, what else must be available so a trach patient can communicate distress or needs?",
      "a": "Writing materials, a whiteboard, a picture/letter board, or an established yes/no signal system — some reliable, patient-specific way to communicate beyond speech, since the trach or valve status may take their voice away.",
      "pearl": "If they can't speak, give them another way to be heard — before they need it, not during the crisis.",
      "choices": [
        "Writing tools, picture boards, or an established yes/no system",
        "A television remote control",
        "A second call bell mounted on the wall only",
        "Nothing extra — the call bell alone is sufficient"
      ]
    },
    {
      "id": "da-32",
      "topic": "daily",
      "difficulty": "medium",
      "q": "How does an inflated tracheostomy cuff make swallowing less safe?",
      "a": "The inflated cuff can compress the esophagus and blunts normal laryngeal elevation during a swallow, impairing the mechanics that protect the airway and increasing aspiration risk.",
      "pearl": "An inflated cuff protects the lungs from big aspirations while quietly making swallowing itself harder.",
      "choices": [
        "It compresses the esophagus and blunts laryngeal elevation",
        "It has no effect on swallowing mechanics",
        "It only affects the ability to speak, not to swallow",
        "It improves swallowing by stabilizing the larynx"
      ]
    },
    {
      "id": "da-33",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Why can a trach patient aspirate SILENTLY even with the cuff inflated, with no coughing or choking to alert the nurse?",
      "a": "The tracheostomy blunts laryngeal sensation and disrupts the normal subglottic pressure and cough reflex that would normally signal and clear aspirated material. Material can cross the airway without triggering the protective cough response at all.",
      "pearl": "No cough doesn't mean no aspiration — the trach can silence the alarm along with the voice.",
      "choices": [
        "The trach blunts laryngeal sensation and the protective cough reflex",
        "The cuff physically blocks all aspirated material from being felt",
        "Silent aspiration is a myth in tracheostomy patients",
        "It only happens when the cuff is fully deflated"
      ]
    },
    {
      "id": "da-34",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Why must a new trach patient have a formal swallow evaluation before starting an oral diet, rather than a nurse simply judging by cuff status alone?",
      "a": "Aspiration with a trach can be silent — cuff position and a comfortable appearance don't rule it out. A speech-language pathologist's formal assessment evaluates the actual swallow mechanics and airway protection, catching risk that bedside impression would miss.",
      "pearl": "Cuff status tells you about the airway seal, not whether the swallow itself is safe — that needs a formal look.",
      "choices": [
        "Because aspiration can be silent and needs formal mechanical assessment",
        "Because diet orders legally require a dietitian consult only",
        "Because cuff status alone always predicts swallow safety",
        "Because trach patients are never allowed oral intake"
      ]
    },
    {
      "id": "da-35",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Why is delirium in a patient with a FRESH tracheostomy a specifically higher-stakes danger than delirium in a patient with a mature trach?",
      "a": "A delirious, agitated patient can self-decannulate by pulling at the tube. With a fresh, immature tract, that dislodgement can't be safely fixed by blind bedside reinsertion — the tube can track into a false passage in the soft tissue, losing the airway entirely.",
      "pearl": "Delirium plus a fresh trach stacks two dangers: the pull, and the fact that putting it back isn't simple.",
      "choices": [
        "Self-decannulation into an immature tract risks a false passage on reinsertion",
        "Delirium has no bearing on tracheostomy safety at any stage",
        "Fresh trachs are structurally weaker and more likely to crack",
        "Mature trachs are more prone to self-decannulation, not fresh ones"
      ]
    },
    {
      "id": "da-36",
      "topic": "daily",
      "difficulty": "hard",
      "q": "For a delirious patient with a fresh trach at risk of self-decannulation, what should the nurse prioritize FIRST — restraints, or something else?",
      "a": "Identify and treat the underlying cause of delirium (pain, hypoxia, infection, medications, sleep deprivation) while also securing the trach ties properly and considering a sitter — restraints are a last resort, not the first move, and don't address why the patient is trying to pull at the tube.",
      "pearl": "Treat the delirium, don't just tie down the hands — find out why they're reaching for the tube.",
      "choices": [
        "Identify and treat the underlying cause of the delirium first",
        "Apply bilateral wrist restraints immediately, before any assessment",
        "Sedate to unresponsiveness to guarantee no movement",
        "Remove the trach tube preemptively until delirium resolves"
      ]
    },
    {
      "id": "da-37",
      "topic": "daily",
      "difficulty": "medium",
      "q": "Name the patient features that should lower your escalation threshold even when vital signs look reassuring.",
      "a": "Prior neck radiation, a bulky tumor, and fresh post-operative or free-flap status. These patients can decompensate fast and atypically, so normal-looking vitals should not override a nurse's concern in this group.",
      "pearl": "Radiation, bulky tumor, fresh flap — normal vitals don't get the final word here.",
      "choices": [
        "Prior neck radiation, bulky tumor, and fresh post-op/flap status",
        "Advanced age alone, regardless of surgical history",
        "Any patient on routine oral antibiotics",
        "Any patient discharged within the last month"
      ]
    },
    {
      "id": "da-38",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Physiologically, why do radiation, a bulky tumor, or a fresh flap all push a patient toward the SAME kind of danger — atypical, fast decompensation?",
      "a": "Each distorts or fragilizes the anatomy in a different way — radiation causes fibrosis and impaired healing, a bulky tumor narrows and distorts the airway, a fresh flap has a delicate, freshly reconstructed tissue and vascular supply. In all three, small changes can escalate quickly and don't follow the gradual, textbook decline that reassures on paper.",
      "pearl": "Different mechanisms, same lesson: in these necks, small changes escalate fast — don't wait for the textbook decline.",
      "choices": [
        "Each distorts or fragilizes neck anatomy, enabling fast, atypical decline",
        "All three conditions directly lower baseline oxygen saturation",
        "All three prevent cuff inflation from working correctly",
        "All three are contraindications to any bedside suctioning"
      ]
    },
    {
      "id": "da-39",
      "topic": "daily",
      "difficulty": "hard",
      "q": "A trach patient is being sent to CT for a 20-minute scan. Why must the full bedside emergency kit go with them, not just a portable oxygen tank?",
      "a": "Obstruction or dislodgement risk doesn't pause during transport — if a plug or decannulation happens in the elevator or scanner, the equipment cached at the bedside can't help. Suction, spare tube, obturator, and BVM must physically travel with the patient wherever they go.",
      "pearl": "The emergency doesn't wait for the patient to get back to the room — the kit has to travel too.",
      "choices": [
        "Airway emergencies can happen in transit, where bedside equipment can't reach",
        "CT scanners already contain trach emergency equipment",
        "It is only required for laryngectomy patients, not trach patients",
        "Portable oxygen alone fully covers any airway emergency"
      ]
    },
    {
      "id": "da-40",
      "topic": "daily",
      "difficulty": "hard",
      "q": "Before discharging a trach patient home, why is a family member's verbal understanding of the teaching not enough on its own?",
      "a": "A trach is a device-dependent airway — a caregiver who can only recite the steps hasn't proven they can act under pressure. Discharge teaching should be competency-based: the caregiver demonstrates suctioning, a tie change, and the emergency response, not just describes them (teach-back).",
      "pearl": "Telling isn't training — make them show you, not just tell you.",
      "choices": [
        "Caregivers must demonstrate the skills, not just describe them",
        "Verbal understanding is sufficient if documented in the chart",
        "Only the patient, never family, needs to be taught",
        "Discharge teaching is optional if home health is arranged"
      ]
    }
  ],
};
