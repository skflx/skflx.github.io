/* =============================================================
   hypocalcemia-protocol.js — the source text of hypocalcemia.html,
   verbatim: "Postoperative Management of Hypocalcemia Protocol for
   OTO HNS Department" (OHSU), the .docx the owner supplied.

   Every item is the document's own wording, spelling and numbering.
   Three mechanical changes only: the Word arrow glyph (rendered "à")
   is written →, runs of spaces are single, and superscripts are plain
   ("3rd", "1st"). Nothing here is paraphrased: js/hypocalcemia.js
   cites these ids, and the page prints this text as the protocol.

   Shape: sections[] of { id, title, items[] }; an item is
   { id, n (the document's list label, or ''), text, kids[] }.
   `ref` is the short citation the plan prints; it is not source text.

   Items with `added: true` are NOT in the document: they are the owner's
   rules for what the protocol leaves open, placed in the section they
   belong to and shown on the page as "Owner rule". Every other item is
   the document's text.
   ============================================================= */
(function () {
    'use strict';

    window.__HYPOCA_SOURCE = {
        title: 'Postoperative Management of Hypocalcemia Protocol for OTO HNS Department',
        origin: 'OHSU Department of Otolaryngology – Head & Neck Surgery',
        sections: [
            { id: 'scope', title: '', items: [
                { id: 'scope', n: '', ref: 'Scope', text: 'NOTE: This protocol is NOT to be used for secondary HPT patients on dialysis and tertiary HPT patients.' },
            ] },

            { id: 'op', title: 'OUTPATIENT Same Day Discharge', items: [
                { id: 'op.lt15', n: '', ref: 'Outpatient · PTH < 15', text: 'IF PTH < 15, admit overnight as Observation status (NOT Inpatient)' },
                { id: 'op.gt20', n: '', ref: 'Outpatient · PTH > 20', text: 'If PTH > 20 No need for supplements.' },
                { id: 'op.mid', n: '', ref: 'Outpatient · PTH 15–20', text: 'Those with PTH 15 – 20 ng/ml - send home with 300 mg elemental (Tums Ex) every 8 hours and check calcium level for AM.', kids: [
                    { id: 'op.mid.1', n: '1.', ref: 'Outpatient · PTH 15–20 · 1', text: 'IF they live locally, they should come to OHSU (PPV 3rd floor or CHH), in which case an outpatient order for a calcium level for AM. (or BMP instead of plasma calcium in those whose preop GFR < 60 to both their renal function, electrolytes and calcium)should be placed in EPIC (can be created through the discharge order process or through a new ambulatory order encounter).' },
                    { id: 'op.mid.2', n: '2.', ref: 'Outpatient · PTH 15–20 · 2', text: 'If they do not live locally, give them an external outpatient order for serum calcium level. Discharge instructions should specifically instruct patient to go for blood draw in AM and to call their surgeon’s office and inform us of where the lab was done.' },
                    { id: 'op.mid.3', n: '3.', ref: 'Outpatient · PTH 15–20 · 3', text: 'If they are going to external lab, this needs to be signed out to Thyroid Parathyroid Center Nurse or MAs in Area 4 either via EPIC message or Outlook secure message to follow up on the results the next day.' },
                ] },
            ] },

            { id: 'ip', title: 'OVERNIGHT DAY PATIENTS OR INPATIENTS', items: [
                { id: 'ip.check', n: '', ref: 'Overnight', text: 'Check Intraop-PTH in recovery room' },
                { id: 'ip.gt20', n: '', ref: 'Overnight · PTH > 20', text: 'PTH > 20 → No need to order AM labs unless patient has a history of renal insufficiency, in which case a BMP should be ordered. If GFR or creatinine is not any worse than baseline, discharge without supplements' },
                { id: 'ip.mid', n: '', ref: 'Overnight · PTH 15–20', text: 'PTH 15 – 20 → Start calcium 300 mg elemental every 8 hours(Use Tums-EX – see General Principles #2 below) and a calcium level for AM. (or BMP instead of plasma calcium in those whose preop GFR < 60 to both their renal function, electrolytes and calcium)', kids: [
                    { id: 'ip.mid.1', n: '1.', ref: 'PTH 15–20 · 1', text: 'IF corrected calcium > 8.5 mg/dL, then discharge without any supplements' },
                    { id: 'ip.mid.2', n: '2.', ref: 'PTH 15–20 · 2', text: 'If calcium < 8.5 mg/dL (and GFR no worse than baseline if checked),', kids: [
                        { id: 'ip.mid.2a', n: 'a.', ref: 'PTH 15–20 · 2a', text: 'Discharge with calcium 300 mg elemental q8hr' },
                        { id: 'ip.mid.2b', n: 'b.', ref: 'PTH 15–20 · 2b', text: 'Have patient go to outpatient lab (OHSU or external) for repeat calcium the next morning (See General Rules #3 below)' },
                    ] },
                ] },
                { id: 'ip.low', n: '', ref: 'Overnight · PTH 10–15', text: 'PTH 10 – 15 → Start calcium 600 mg every 8 hours (not tid – select every 8 hours) with food. Order PTH (select Urgent) and plasma calcium (or BMP if preop GFR <60) for AM labs', kids: [
                    { id: 'ip.low.1', n: '1.', ref: 'PTH 10–15 · 1', text: 'If AM repeat PTH > 10, and corrected calcium > 8.5 mg/dL, discharge without supplements.' },
                    { id: 'ip.low.2', n: '2.', ref: 'PTH 10–15 · 2', text: 'If AM repeat > 10, and corrected calcium < or = 8.5 mg/dL,', kids: [
                        { id: 'ip.low.2a', n: 'a.', ref: 'PTH 10–15 · 2a', text: 'Discharge with calcium 600 mg q8 hr' },
                        { id: 'ip.low.2b', n: 'b.', ref: 'PTH 10–15 · 2b', text: 'Have patient go to outpatient lab (OHSU or external) for repeat calcium the next morning (See General Rules #3 below)' },
                    ] },
                    { id: 'ip.low.3', n: '3.', ref: 'PTH 10–15 · 3', text: 'If AM repeat PTH < 10, and corrected calcium > 8.5 mg/dL, start calcitriol 0.25 mcg bid and repeat calcium at 11:00 AM', kids: [
                        { id: 'ip.low.3a', n: 'a.', ref: 'PTH 10–15 · 3a', text: 'IF 11:00 AM corrected calcium > 8.5', kids: [
                            { id: 'ip.low.3a.i', n: 'i.', ref: 'PTH 10–15 · 3a.i', text: 'Discharge with calcium 600 mg elemental q8hr AND calcitriol 0.25 mcg bid.' },
                            { id: 'ip.low.3a.ii', n: 'ii.', ref: 'PTH 10–15 · 3a.ii', text: 'Have patient go to outpatient lab (OHSU or external) for repeat calcium the next morning (See General Rules #3 below)' },
                        ] },
                        { id: 'ip.low.3b', n: 'b.', ref: 'PTH 10–15 · 3b', text: 'If 11:00 AM corrected calcium < 8.5, Increase calcitriol to 0.5 mcg bid, and check calcium level at 5 pm.', kids: [
                            { id: 'ip.low.3b.i', n: 'i.', ref: 'PTH 10–15 · 3b.i', text: 'If 5 pm calcium is > 8.5,', kids: [
                                { id: 'ip.low.3b.i.1', n: '1.', ref: 'PTH 10–15 · 3b.i.1', text: 'discharge home with calcium 600 mg q8hr and calcitriol 0.5 mcg bid.' },
                                { id: 'ip.low.3b.i.2', n: '2.', ref: 'PTH 10–15 · 3b.i.2', text: 'Have patient go to outpatient lab (OHSU or external) for repeat calcium the next morning (See General Rules #3 below)' },
                            ] },
                            { id: 'ip.low.3b.ii', n: 'ii.', ref: 'PTH 10–15 · 3b.ii', text: 'IF 5 pm calcium < 8.5, give one extra dose of calcium 300 mg and continue to monitor with q 6 hr calcium checks.' },
                        ] },
                    ] },
                    { id: 'ip.low.crit', n: '', ref: 'PTH 10–15 · discharge criteria', text: 'Criteria for discharge the following AM is, patient must be asymptomatic, not exhibit clinical signs of hypocalcemia, and corrected calcium by the next morning must be > 7.8 mg/dL and trending up.' },
                    { id: 'ip.low.att', n: '', ref: 'PTH 10–15 · attending', text: 'Attending must be updated in the afternoon with the patient’s status.' },
                ] },
                { id: 'ip.renal', n: '', ref: 'Renal insufficiency note', text: 'NOTE: In those with renal insufficiency, an additional criterion for discharge is serum creatinine needs to be same or better than preop. If creatinine is worse, they will need to stay another day for IV hydration, and BMP needs to be repeated to ensure stability of creatinine before discharge.' },
                { id: 'ip.vlow', n: '', ref: 'Overnight · PTH < 10', text: 'PTH < 10', kids: [
                    { id: 'v.1', n: '1.', ref: 'PTH < 10 · 1', text: 'Start calcitriol 0.5 mcg bid and calcium supplement 900 mg elemental every 8 hours (not tid – select every 8 hours) with food. First dose to be administered evening of surgery.' },
                    { id: 'v.2', n: '2.', ref: 'PTH < 10 · 2', text: 'Order BMP and magnesium for the morning 5 am labs, and then plasma calcium every 6 hours starting at 11:00 am (when placing this order, it defaults to lab to be drawn at the time order is placed so you have to actually change the time to “tomorrow 11:00 am”. Do not forget to do this so that patient does not get unnecessary blood work the night of surgery). With very few exceptions, there is no need to get calcium level the day of the procedure with the exception of secondary/tertiary hyperparathyroid patients (see separate protocol for secondary and tertiary patients), or in those who complains of hypocalcemia symptoms (perioral, bilateral hands/feet numbness/tingling).' },
                    { id: 'v.dos', n: '', ref: 'PTH < 10 · evening-of-surgery note', text: 'NOTE: If the patient complains of symptoms of hypocalcemia the evening of surgery, assess the patient clinically to determine if they have hand or leg cramping/spasm. If the patient is exhibiting these signs, order 1 gm IV calcium and immediately draw a stat calcium (prior to IV calcium infusion).' },
                    { id: 'v.dos2', n: '', ref: 'PTH < 10 · evening-of-surgery note', text: 'If the patient does not have hand or leg cramping/spasm, and they have not received their evening oral dose that was ordered, have the nurse administer the oral supplementation immediately. IF they have already received it, give one additional 300 mg elemental of TUMS. Order a STAT calcium level and check on it.' },
                    { id: 'v.3', n: '3.', ref: 'PTH < 10 · 3', text: 'Order AM Magnesium level –Replace to keep it within normal range' },
                    { id: 'v.4', n: '4.', ref: 'PTH < 10 · 4', text: 'If 1st postop day AM corrected calcium is between 7 and 8 mg/dL and patient is symptomatic (perioral, bilateral hands/feet numbness/tingling) administer IV calcium gluconate 1 gm over 2 hours. If symptoms do not subside, give another gram.', kids: [
                        { id: 'v.4q6', n: '', ref: 'PTH < 10 · 4', text: 'Check calcium every 6 hours. Order Mg level for the following morning' },
                        { id: 'v.4a', n: 'a.', ref: 'PTH < 10 · 4a', text: 'If 11 am corrected calcium > 8, continue to monitor labs q6 hours' },
                        { id: 'v.4b', n: 'b.', ref: 'PTH < 10 · 4b', text: 'IF corrected calcium between 7 and 8 but slightly lower than prior calcium, as long as patient is NOT symptomatic, give an extra tablet of TUMS. Administer IV calcium ONLY IF SYMPTOMATIC and calcium < 7 mg/dL' },
                        { id: 'v.4c', n: 'c.', ref: 'PTH < 10 · 4c', text: 'Patient needs to be monitored for at least 12 hours after last dose of IV calcium after which he/she can be discharged with above dosage of calcium supplements if calcium is stable or trends up.' },
                    ] },
                    { id: 'v.5', n: '5.', ref: 'PTH < 10 · 5', text: 'If 1st postop day AM corrected calcium is between 7 and 8 mg/dL and patient IS NOT symptomatic, give an extra oral calcium of 300 mg elemental, check 11 am calcium', kids: [
                        { id: 'v.5a', n: 'a.', ref: 'PTH < 10 · 5a', text: 'IF 11 am calcium higher than AM calcium, may discharge home with 900 mg elemental calcium q 8 hr and calcitriol 0.5 mcg bid.' },
                        { id: 'v.5b', n: 'b.', ref: 'PTH < 10 · 5b', text: 'IF 11 am calcium is lower than 5 AM calcium, give an extra dose of calcium once and check a 5 pm calcium', kids: [
                            { id: 'v.5b.i', n: 'i.', ref: 'PTH < 10 · 5b.i', text: 'IF stable or improved from AM, may DC home with 900 mg elemental calcium q 8 hr and calcitriol 0.5 mcg bid.' },
                            { id: 'v.5b.ii', n: 'ii.', ref: 'PTH < 10 · 5b.ii', text: 'IF lower and asymptomatic, give one extra Tums and increase calcitriol to 0.75 mcg bid and continue to monitor calcium level every 6 hours until the next morning.' },
                            { id: 'v.5b.iii', n: 'iii.', ref: 'PTH < 10 · 5b.iii', text: 'IF lower and symptomatic, give 1 gm IV calcium, give one extra Tums and increase calcitriol to 1 mcg bid and continue to monitor every 6 hours until the next morning.' },
                        ] },
                    ] },
                    { id: 'v.6', n: '6.', ref: 'PTH < 10 · 6', text: 'IF 1st post op day AM corrected calcium is < 7 mg/dL, regardless of symptoms, administer one gram of IV calcium gluconate and increase calcitriol to 0.75 mcg bid and calcium to 900 mg q8hr.', kids: [
                        { id: 'v.6a', n: 'a.', ref: 'PTH < 10 · 6a', text: 'IF 11 AM corrected calcium is lower than 5 AM calcium, and patient IS NOT symptomatic, give extra tablet of TUMS, continue to monitor q 6 hours until the next morning. Add magnesium level to AM labs' },
                        { id: 'v.6b', n: 'b.', ref: 'PTH < 10 · 6b', text: 'If 11 AM corrected calcium is lower than 5 AM calcium, or patient is symptomatic, administer 1 gm IV calcium. Repeat same step if still symptomatic. Continue calcium checks every 6 hours and add magnesium level to AM labs.' },
                        { id: 'v.6c', n: 'c.', ref: 'PTH < 10 · 6c', text: 'IF 11 AM corrected calcium is higher than 5 AM calcium, keep on same oral regiment and check calcium q 6 until the next morning. Add magnesium level to AM labs' },
                    ] },
                    { id: 'x.ge8', added: true, n: '', ref: 'Owner rule · PTH < 10, 5 AM ≥ 8', text: 'If 1st postop day AM corrected calcium is 8 mg/dL or above, check the 11 AM calcium and follow its trend as in item 5: if the same or higher and asymptomatic, may discharge as in 5a; if lower, give an extra dose of calcium once and check a 5 pm calcium, then follow 5b.i–iii.' },
                    { id: 'x.eq', added: true, n: '', ref: 'Owner rule · equal values', text: 'An 11 AM calcium equal to the 5 AM calcium counts as stable (with "higher") when the patient has no symptoms.' },
                    { id: 'x.sx', added: true, n: '', ref: 'Owner rule · symptoms', text: 'Evaluate for symptoms of hypocalcemia at every calcium check. If symptoms are present, treat in an escalating fashion using clinical judgement.' },
                    { id: 'v.crit', n: '', ref: 'PTH < 10 · discharge criteria', text: 'Criteria for discharge the following AM is, patient must be asymptomatic, not exhibit clinical signs of hypocalcemia (i.e, EKG change), and corrected calcium by the next morning must be > 7.8 mg/dL and trending up. They should be discharged with whatever calcium and calcitriol dose they are taking in hospital, unless specified otherwise by attending surgeon.' },
                    { id: 'v.att', n: '', ref: 'PTH < 10 · attending', text: 'Attending must be updated in the afternoon with the patient’s status.' },
                ] },
            ] },

            { id: 'gen', title: 'GENERAL RULES:', items: [
                { id: 'g.1', n: '1)', ref: 'General Rules · 1', text: 'IF giving IV calcium, order remote telemetry monitoring' },
                { id: 'g.2', n: '2)', ref: 'General Rules · 2', text: 'For calcium carbonate supplements, order TUMS-EX, which is 750 mg tabs that provide 300 mg elemental calcium, rather than regular Tums that only provides 200 mg elemental' },
                { id: 'g.3', n: '3)', ref: 'General Rules · 3', text: 'Any patient being sent home with calcitriol and calcium need to have a calcium check as outpatient the next morning.', kids: [
                    { id: 'g.3.1', n: '1.', ref: 'General Rules · 3.1', text: 'IF they live locally, they should come to OHSU, either PPV 3rd floor or CHH, in which case an outpatient order should be placed in EPIC (can be created through the discharge order process or through a new ambulatory order encounter that can be created).' },
                    { id: 'g.3.2', n: '2.', ref: 'General Rules · 3.2', text: 'If they do not live locally, give them an external outpatient order for a serum calcium level. Discharge instructions should include specifically instruction for patient to go for blood draw in AM and to call their surgeon’s office and inform us of where the lab was done' },
                    { id: 'g.3.3', n: '3.', ref: 'General Rules · 3.3', text: 'If they are going to external lab, this needs to be signed out to Thyroid Parathyroid Center Nurse or MAs in Area 4 either via EPIC message (Thyroid Triage Pool) or Outlook secure message to follow up on the results the next day.' },
                ] },
                { id: 'x.cut', added: true, n: '', ref: 'Owner rule · cutoffs', text: 'A value exactly at a cutoff counts as exceeding it (PTH 10 as above 10; calcium 8.5 as above 8.5), except where the protocol writes the equality: "< or = 8.5" (PTH 10 – 15, item 2) and "PTH 15 – 20", which includes 20.' },
                { id: 'x.payne', added: true, n: '', ref: 'Owner rule · corrected calcium', text: 'Corrected calcium = measured calcium + 0.8 × (4.0 − albumin in g/dL) (Payne).' },
                { id: 'x.units', added: true, n: '', ref: 'Owner rule · units', text: 'PTH is in pg/mL.' },
            ] },
        ],
    };
})();
