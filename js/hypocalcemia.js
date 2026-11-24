/* =============================================================
   hypocalcemia.js — hypocalcemia.html: the OHSU OTO-HNS postop
   hypocalcemia protocol as a step-by-step plan.

   Two halves in one IIFE:
   1. evaluate(state): DOM-free. Walks the protocol (the verbatim text
      is js/hypocalcemia-protocol.js) and returns the questions to ask,
      the plan steps (each citing source ids) and a disposition. Where
      the protocol is silent or contradicts itself, it says so (kind
      'gap') and never picks a branch. tools/test-hypocalcemia.mjs runs
      it in Node.
   2. The page: builds every question once, shows the ones evaluate()
      asks for, renders the plan and the protocol text, and copies the
      plan as plain text. Nothing is stored: a reload is a clean slate.

   Two owner rules sit on top of the text: corrected calcium is Payne
   (Ca + 0.8 × (4.0 − albumin)), which the protocol names without a
   formula; and a value exactly at a cutoff counts as exceeding it
   (PTH 10 as above 10, calcium 8.5 as above 8.5), except where the
   text writes the equality itself ("< or = 8.5", PTH 10–15 item 2).
   ============================================================= */
(function () {
    'use strict';

    /* ---------------- 1. Engine ---------------- */

    /* Plausible ranges: outside them a value is treated as a typo, not used. */
    var RANGE = {
        pth: [0, 3000], amPth: [0, 3000],
        alb: [1, 6],
        amCa: [3, 16], ca11: [3, 16], ca17: [3, 16],
    };

    var WHEN = [
        ['rr', 'Recovery room'],
        ['eve', 'Evening of surgery'],
        ['am', 'POD 1 · morning'],
        ['h11', 'POD 1 · 11:00 AM'],
        ['pm', 'POD 1 · afternoon'],
        ['h17', 'POD 1 · 5:00 PM'],
        ['dc', 'Discharge'],
        ['pod2', 'Next morning · before discharge'],
        ['next', 'Morning after discharge'],
    ];

    function round2(n) { return Math.round(n * 100) / 100; }

    function parseNum(raw) {
        if (raw === null || raw === undefined) return null;
        var t = String(raw).trim().replace(',', '.');
        if (t === '') return null;
        if (!/^\d*\.?\d+$/.test(t)) return NaN;
        return parseFloat(t);
    }

    /* Payne. alb null → the value is taken as already corrected. */
    function corrected(ca, alb) {
        if (ca === null) return null;
        if (alb === null) return round2(ca);
        return round2(ca + 0.8 * (4.0 - alb));
    }

    /* Recovery-room tier. A value at a cutoff counts as exceeding it (owner):
       10 is 10–15, 15 is 15–20, 20 is > 20. */
    function tierOf(p) {
        if (p < 10) return 'lt10';
        if (p < 15) return 'low';
        if (p < 20) return 'mid';
        return 'gt20';
    }

    var TIER_LABEL = { lt10: '< 10', low: '10 – 15', mid: '15 – 20', gt20: '> 20' };

    function evaluate(s) {
        var R = { ask: {}, steps: [], dispo: null, invalid: {} };
        var ivDone = false;

        function ask(k, o) { R.ask[k] = o || {}; }
        function step(when, kind, text, src) { R.steps.push({ when: when, kind: kind, text: text, src: src || [] }); }
        function done(kind, text) { R.dispo = { kind: kind, text: text }; return R; }
        function iv(when, text, src) {
            step(when, 'iv', text, src);
            if (!ivDone) { ivDone = true; step(when, 'iv', 'Order remote telemetry monitoring while giving IV calcium.', ['g.1']); }
        }
        function val(k) {
            var n = parseNum(s[k]);
            if (n === null) return null;
            var r = RANGE[k];
            if (isNaN(n) || (r && (n < r[0] || n > r[1]))) { R.invalid[k] = true; return null; }
            return n;
        }
        var albRaw = parseNum(s.alb);
        var alb = val('alb');
        var albBad = albRaw !== null && alb === null;
        function cc(k) { var v = val(k); return (v === null || albBad) ? null : corrected(v, alb); }
        function waitCa(label) { return done('wait', albBad ? 'Check the albumin value (g/dL)' : 'Enter the ' + label + ' calcium'); }
        var gfr = s.gfr === 'yes';

        /* Renal criterion (ip.renal) before any overnight discharge. */
        function blocked() {
            if (!gfr) return false;
            ask('cr');
            if (!s.cr) {
                step('dc', 'do', 'Before discharge, creatinine must be the same as or better than preop (preop GFR below 60).', ['ip.renal']);
                done('wait', 'Discharge waits on creatinine vs preop');
                return true;
            }
            if (s.cr === 'worse') {
                step('dc', 'stay', 'Creatinine worse than preop: stay another day for IV hydration, and repeat the BMP to confirm creatinine is stable before discharge.', ['ip.renal']);
                done('stay', 'Stay another day: IV hydration, repeat BMP');
                return true;
            }
            step('dc', 'note', 'Creatinine the same as or better than preop: the renal criterion is met.', ['ip.renal']);
            return false;
        }

        /* General Rules #3: next-morning outpatient calcium. */
        function outLab(src) {
            ask('lab');
            src = (src || []).concat('g.3');
            if (!s.lab) { step('next', 'do', 'Outpatient calcium check tomorrow morning. Choose where (OHSU or an external lab) for the orders.', src); return; }
            if (s.lab === 'local') {
                step('next', 'do', 'Outpatient calcium tomorrow morning at OHSU (PPV 3rd floor or CHH). Place the order in EPIC, through the discharge order process or a new ambulatory order encounter.', src.concat('g.3.1'));
                return;
            }
            step('next', 'do', 'External outpatient order for serum calcium. Discharge instructions: blood draw in the morning, then call the surgeon’s office to say where the lab was done.', src.concat('g.3.2'));
            step('next', 'do', 'Sign out to the Thyroid Parathyroid Center nurse or MAs in Area 4 (EPIC message to the Thyroid Triage Pool, or Outlook secure message) to follow up the result the next day.', ['g.3.3']);
        }

        /* Outpatient PTH 15–20 has its own lab wording (op.mid.1–3). */
        function opLab() {
            ask('lab');
            if (!s.lab) { step('next', 'do', 'Calcium level tomorrow morning. Choose where (OHSU or an external lab) for the orders.', ['op.mid']); return; }
            if (s.lab === 'local') {
                step('next', 'do', 'Outpatient order in EPIC for ' + (gfr ? 'a BMP instead of plasma calcium (preop GFR below 60: renal function, electrolytes and calcium)' : 'a calcium level') + ' tomorrow morning at OHSU (PPV 3rd floor or CHH), through the discharge order process or a new ambulatory order encounter.', ['op.mid.1']);
                return;
            }
            step('next', 'do', 'External outpatient order for serum calcium. Discharge instructions: blood draw in the morning, then call the surgeon’s office to say where the lab was done.', ['op.mid.2']);
            step('next', 'do', 'Sign out to the Thyroid Parathyroid Center nurse or MAs in Area 4 (EPIC message or Outlook secure message) to follow up the result the next day.', ['op.mid.3']);
        }

        function gap(when, text, src) { step(when, 'gap', text, src); }

        function renalCrit() {
            if (gfr) step('pod2', 'do', 'Renal insufficiency: creatinine must also be the same as or better than preop. If worse, another day of IV hydration and a repeat BMP.', ['ip.renal']);
        }
        function critLow() {
            step('pod2', 'do', 'Discharge the following morning only if asymptomatic, with no clinical signs of hypocalcemia, and corrected calcium above 7.8 mg/dL and trending up.', ['ip.low.crit']);
            renalCrit();
        }
        function critVlow() {
            step('pod2', 'do', 'Discharge the following morning only if asymptomatic, with no clinical signs of hypocalcemia (e.g. EKG change), and corrected calcium above 7.8 mg/dL and trending up. Discharge on the in-hospital calcium and calcitriol doses unless the attending says otherwise.', ['v.crit']);
            renalCrit();
        }

        /* ---- scope ---- */
        ask('excluded');
        if (s.excluded === 'yes') {
            step('rr', 'stop', 'Do not use this protocol for secondary hyperparathyroidism on dialysis or tertiary hyperparathyroidism. They have a separate protocol.', ['scope', 'v.2']);
            return done('stop', 'This protocol does not apply');
        }
        ask('setting');
        if (!s.setting) return done('wait', 'Choose the setting');
        ask('gfr');
        ask('pth');
        ask('tier');

        var pth = val('pth');
        var tier = pth !== null ? tierOf(pth) : (TIER_LABEL[s.tier] ? s.tier : null);
        if (!tier) return done('wait', R.invalid.pth ? 'Check the PTH value' : 'Enter the recovery-room PTH');
        R.tier = tier;


        /* ---- outpatient, same-day discharge ---- */
        if (s.setting === 'op') {
            if (tier === 'gt20') {
                step('rr', 'dc', 'Discharge home today. No calcium supplements.', ['op.gt20']);
                return done('dc', 'Discharge home, no supplements');
            }
            if (tier === 'mid') {
                step('rr', 'dc', 'Discharge home today on calcium carbonate 300 mg elemental every 8 hours (TUMS-EX, 1 tablet).', ['op.mid', 'g.2']);
                opLab();
                return done('dc', 'Discharge home on calcium 300 mg q8h; calcium tomorrow AM');
            }
            step('rr', 'stay', 'PTH below 15: admit overnight as Observation status, not Inpatient. The overnight orders for this PTH follow.', ['op.lt15', 'ip.check']);
        }

        /* ---- overnight or inpatient ---- */
        if (tier === 'gt20') {
            if (gfr) {
                step('am', 'do', 'AM BMP (history of renal insufficiency).', ['ip.gt20']);
                if (blocked()) return R;
            } else {
                step('am', 'note', 'No AM labs needed.', ['ip.gt20']);
            }
            step('dc', 'dc', 'Discharge without supplements.', ['ip.gt20']);
            return done('dc', 'Discharge, no supplements');
        }

        if (tier === 'mid') {
            step('rr', 'do', 'Start calcium carbonate 300 mg elemental every 8 hours (TUMS-EX, 1 tablet).', ['ip.mid', 'g.2']);
            step('am', 'do', gfr ? 'AM BMP instead of plasma calcium (preop GFR below 60: renal function, electrolytes and calcium).' : 'AM calcium level.', ['ip.mid']);
            ask('alb'); ask('amCa', { label: 'POD 1 AM calcium' });
            var c = cc('amCa');
            if (c === null) return waitCa('AM');
            if (c >= 8.5) {
                if (blocked()) return R;
                step('dc', 'dc', 'Discharge without any supplements.', ['ip.mid.1']);
                return done('dc', 'Discharge, no supplements');
            }
            if (blocked()) return R;
            step('dc', 'dc', 'Discharge on calcium 300 mg elemental every 8 hours (TUMS-EX, 1 tablet).', ['ip.mid.2', 'ip.mid.2a']);
            outLab(['ip.mid.2b']);
            return done('dc', 'Discharge on calcium 300 mg q8h; calcium tomorrow AM');
        }

        if (tier === 'low') {
            step('rr', 'do', 'Start calcium carbonate 600 mg elemental every 8 hours with food (TUMS-EX, 2 tablets). Order "every 8 hours", not TID.', ['ip.low', 'g.2']);
            step('am', 'do', 'AM labs: PTH (select Urgent) and ' + (gfr ? 'BMP (preop GFR below 60).' : 'plasma calcium.'), ['ip.low']);
            step('pm', 'do', 'Update the attending in the afternoon with the patient’s status.', ['ip.low.att']);
            ask('alb'); ask('amPth'); ask('amCa', { label: 'POD 1 AM calcium' });
            var p2 = val('amPth');
            var c1 = cc('amCa');
            if (p2 === null) return done('wait', R.invalid.amPth ? 'Check the AM PTH value' : 'Enter the AM PTH');
            if (c1 === null) return waitCa('AM');
            if (p2 >= 10) {
                /* "< or = 8.5" is written here, so 8.5 stays on the supplement side. */
                if (c1 > 8.5) {
                    if (blocked()) return R;
                    step('dc', 'dc', 'Discharge without supplements.', ['ip.low.1']);
                    return done('dc', 'Discharge, no supplements');
                }
                if (blocked()) return R;
                step('dc', 'dc', 'Discharge on calcium 600 mg elemental every 8 hours (TUMS-EX, 2 tablets).', ['ip.low.2', 'ip.low.2a']);
                outLab(['ip.low.2b']);
                return done('dc', 'Discharge on calcium 600 mg q8h; calcium tomorrow AM');
            }
            if (c1 < 8.5) {
                gap('am', 'AM PTH below 10 with corrected calcium below 8.5: the protocol has no item for this combination. Not specified; decide with the attending.', ['ip.low.3']);
                return done('gap', 'Not specified: AM PTH < 10 with calcium < 8.5');
            }
            step('am', 'do', 'Start calcitriol 0.25 mcg BID. Repeat calcium at 11:00 AM.', ['ip.low.3']);
            ask('ca11');
            var c11 = cc('ca11');
            if (c11 === null) return waitCa('11:00 AM');
            if (c11 >= 8.5) {
                if (blocked()) return R;
                step('dc', 'dc', 'Discharge on calcium 600 mg elemental every 8 hours and calcitriol 0.25 mcg BID.', ['ip.low.3a', 'ip.low.3a.i']);
                outLab(['ip.low.3a.ii']);
                return done('dc', 'Discharge on calcium 600 mg q8h and calcitriol 0.25 mcg BID');
            }
            step('h11', 'do', 'Increase calcitriol to 0.5 mcg BID. Check calcium at 5:00 PM.', ['ip.low.3b']);
            ask('ca17');
            var c17 = cc('ca17');
            if (c17 === null) return waitCa('5:00 PM');
            if (c17 >= 8.5) {
                if (blocked()) return R;
                step('dc', 'dc', 'Discharge home on calcium 600 mg every 8 hours and calcitriol 0.5 mcg BID.', ['ip.low.3b.i', 'ip.low.3b.i.1']);
                outLab(['ip.low.3b.i.2']);
                return done('dc', 'Discharge on calcium 600 mg q8h and calcitriol 0.5 mcg BID');
            }
            step('h17', 'stay', 'Give one extra dose of calcium 300 mg. Keep in hospital with calcium checks every 6 hours.', ['ip.low.3b.ii']);
            critLow();
            return done('stay', 'Stay overnight: extra calcium 300 mg, calcium q6h');
        }

        /* tier === 'lt10' */
        step('eve', 'do', 'Start calcitriol 0.5 mcg BID and calcium carbonate 900 mg elemental every 8 hours with food (TUMS-EX, 3 tablets). Order "every 8 hours", not TID. First dose this evening.', ['v.1', 'g.2']);
        step('eve', 'do', 'Order BMP and magnesium for POD 1 5:00 AM. Replace magnesium to keep it in the normal range.', ['v.2', 'v.3']);
        step('eve', 'do', 'Order plasma calcium every 6 hours from POD 1 11:00 AM. The order defaults to now: change the time to "tomorrow 11:00 am".', ['v.2']);
        step('eve', 'note', 'No calcium level tonight unless the patient has hypocalcemia symptoms (perioral, bilateral hands/feet numbness or tingling).', ['v.2']);
        step('pm', 'do', 'Update the attending in the afternoon with the patient’s status.', ['v.att']);

        ask('dos');
        if (s.dos === 'sx') {
            ask('cramp');
            if (s.cramp === 'yes') {
                iv('eve', 'Hand or leg cramping or spasm: order 1 g IV calcium, and draw a STAT calcium immediately, before the infusion.', ['v.dos']);
            } else if (s.cramp === 'no') {
                ask('dose');
                if (s.dose === 'not') step('eve', 'do', 'No cramping, evening dose not yet given: have the nurse give the ordered oral supplement now. Order a STAT calcium and check it.', ['v.dos2']);
                else if (s.dose === 'given') step('eve', 'do', 'No cramping, evening dose already given: one additional 300 mg elemental TUMS. Order a STAT calcium and check it.', ['v.dos2', 'g.2']);
                else step('eve', 'do', 'No cramping: was the ordered evening oral dose given?', ['v.dos2']);
            } else {
                step('eve', 'do', 'Symptoms this evening: assess clinically for hand or leg cramping or spasm.', ['v.dos']);
            }
        }

        ask('alb'); ask('amCa', { label: 'POD 1 5:00 AM calcium' });
        var a = cc('amCa');
        if (a === null) return waitCa('5:00 AM');

        if (a >= 8) {
            gap('am', '5:00 AM corrected calcium 8 or above (a value at 8 counts as above): the protocol has no item for this (items 4–6 cover 7–8 and below 7). Not specified; the standing orders continue. Decide with the attending.', ['v.4', 'v.5', 'v.6']);
            step('pod2', 'note', 'For reference, the PTH < 10 discharge criteria: asymptomatic, no clinical signs of hypocalcemia (e.g. EKG change), corrected calcium above 7.8 mg/dL and trending up; discharge on the in-hospital doses unless the attending says otherwise.', ['v.crit']);
            return done('gap', 'Not specified: 5:00 AM calcium 8 or above');
        }

        var hint11 = { hint: 'Compared with 5:00 AM: ' + a };
        if (a < 7) {
            iv('am', 'Below 7, regardless of symptoms: give 1 g IV calcium gluconate.', ['v.6']);
            step('am', 'do', 'Increase calcitriol to 0.75 mcg BID and calcium to 900 mg elemental every 8 hours.', ['v.6']);
            ask('ca11', hint11); ask('sx11');
            var b = cc('ca11');
            if (b === null) return waitCa('11:00 AM');
            if (!s.sx11) return done('wait', 'Symptomatic at 11:00 AM?');
            if (s.sx11 === 'yes') {
                iv('h11', 'Symptomatic: give 1 g IV calcium. Repeat if still symptomatic.', ['v.6b']);
                step('h11', 'do', 'Calcium every 6 hours; add magnesium to the AM labs.', ['v.6b']);
                critVlow();
                return done('stay', 'Stay overnight: IV calcium, calcium q6h');
            }
            if (b < a) {
                gap('h11', 'Lower than 5:00 AM and asymptomatic: the protocol gives two actions. Item 6a: an extra TUMS tablet. Item 6b: 1 g IV calcium. Not resolved by the protocol; decide with the attending.', ['v.6a', 'v.6b']);
                step('h11', 'do', 'Under either item: calcium every 6 hours until the next morning; add magnesium to the AM labs.', ['v.6a', 'v.6b']);
                critVlow();
                return done('gap', 'Conflict: items 6a and 6b');
            }
            if (b === a) {
                gap('h11', '11:00 AM calcium equal to 5:00 AM: the protocol gives "lower" and "higher" only. Not specified; decide with the attending.', ['v.6a', 'v.6b', 'v.6c']);
                return done('gap', 'Not specified: 11:00 AM equal to 5:00 AM');
            }
            step('h11', 'do', 'Higher than 5:00 AM: keep the same oral regimen. Calcium every 6 hours until the next morning; add magnesium to the AM labs.', ['v.6c']);
            critVlow();
            return done('stay', 'Stay overnight: same oral regimen, calcium q6h');
        }

        /* 7 ≤ a ≤ 8 */
        ask('amSx');
        if (!s.amSx) return done('wait', 'Symptomatic at 5:00 AM?');

        if (s.amSx === 'yes') {
            iv('am', 'Symptomatic: give IV calcium gluconate 1 g over 2 hours. If symptoms do not subside, give another gram.', ['v.4']);
            step('am', 'do', 'Calcium every 6 hours. Magnesium level the following morning.', ['v.4q6']);
            ask('ca11', hint11); ask('sx11');
            var d = cc('ca11');
            if (d === null) return waitCa('11:00 AM');
            if (!s.sx11) return done('wait', 'Symptomatic at 11:00 AM?');
            var unresolved = false;
            if (d >= 8) {
                step('h11', 'do', '8 or above: continue labs every 6 hours.', ['v.4a']);
            } else if (d >= 7) {
                if (s.sx11 === 'yes') {
                    unresolved = true;
                    gap('h11', 'Still symptomatic at 7–8: item 4 says give another gram of IV calcium if symptoms do not subside; item 4b says IV calcium only if symptomatic and below 7. Not resolved by the protocol; decide with the attending.', ['v.4', 'v.4b']);
                } else if (d < a) {
                    step('h11', 'do', 'Asymptomatic and lower than 5:00 AM: give an extra TUMS tablet.', ['v.4b', 'g.2']);
                } else {
                    step('h11', 'note', 'Asymptomatic and not lower than 5:00 AM: no extra dose is given; IV calcium only if symptomatic and below 7. Calcium every 6 hours continues.', ['v.4b', 'v.4q6']);
                }
            } else if (s.sx11 === 'yes') {
                iv('h11', 'Symptomatic and below 7: give IV calcium.', ['v.4b']);
            } else {
                unresolved = true;
                gap('h11', 'Below 7 but asymptomatic: item 4b gives IV calcium only if symptomatic and names no other step. Not specified; decide with the attending.', ['v.4b']);
            }
            step('pod2', 'do', 'Monitor for at least 12 hours after the last IV calcium dose, then discharge on the same calcium doses if calcium is stable or trending up.', ['v.4c']);
            renalCrit();
            return unresolved ? done('gap', 'Not resolved by the protocol at 11:00 AM')
                : done('stay', 'Stay: at least 12 h after the last IV calcium');
        }

        step('am', 'do', 'Asymptomatic: give an extra oral calcium 300 mg elemental (TUMS-EX, 1 tablet). Check calcium at 11:00 AM.', ['v.5', 'g.2']);
        ask('ca11', hint11);
        var e = cc('ca11');
        if (e === null) return waitCa('11:00 AM');
        if (e > a) {
            if (blocked()) return R;
            step('dc', 'dc', 'Higher than 5:00 AM: may discharge home on calcium 900 mg elemental every 8 hours and calcitriol 0.5 mcg BID.', ['v.5a']);
            outLab(['v.5a']);
            return done('dc', 'Discharge on calcium 900 mg q8h and calcitriol 0.5 mcg BID');
        }
        if (e === a) {
            gap('h11', '11:00 AM calcium equal to 5:00 AM: the protocol gives "higher" and "lower" only. Not specified; decide with the attending.', ['v.5a', 'v.5b']);
            return done('gap', 'Not specified: 11:00 AM equal to 5:00 AM');
        }
        step('h11', 'do', 'Lower than 5:00 AM: give an extra dose of calcium once. Check calcium at 5:00 PM.', ['v.5b']);
        ask('ca17', { hint: 'Compared with 5:00 AM: ' + a });
        var f = cc('ca17');
        if (f === null) return waitCa('5:00 PM');
        if (f >= a) {
            if (blocked()) return R;
            step('dc', 'dc', 'Stable or improved from the morning: may discharge home on calcium 900 mg elemental every 8 hours and calcitriol 0.5 mcg BID.', ['v.5b.i']);
            outLab(['v.5b.i']);
            return done('dc', 'Discharge on calcium 900 mg q8h and calcitriol 0.5 mcg BID');
        }
        ask('sx17');
        if (!s.sx17) return done('wait', 'Symptomatic at 5:00 PM?');
        if (s.sx17 === 'yes') {
            iv('h17', 'Lower and symptomatic: give 1 g IV calcium.', ['v.5b.iii']);
            step('h17', 'do', 'One extra TUMS; increase calcitriol to 1 mcg BID. Calcium every 6 hours until the next morning.', ['v.5b.iii', 'g.2']);
            critVlow();
            return done('stay', 'Stay overnight: IV calcium, calcitriol 1 mcg BID');
        }
        step('h17', 'do', 'Lower and asymptomatic: one extra TUMS; increase calcitriol to 0.75 mcg BID. Calcium every 6 hours until the next morning.', ['v.5b.ii', 'g.2']);
        critVlow();
        return done('stay', 'Stay overnight: calcitriol 0.75 mcg BID, calcium q6h');
    }

    var api = { evaluate: evaluate, corrected: corrected, tierOf: tierOf, parseNum: parseNum, WHEN: WHEN, RANGE: RANGE };
    try { window.HypoCa = api; } catch (e) { /* not a browser */ }

    /* ---------------- 2. Page ---------------- */

    var doc;
    try { doc = window.document; } catch (e) { return; }
    var root = doc && doc.getElementById('hc');
    if (!root) return;

    var SRC = window.__HYPOCA_SOURCE || { sections: [] };
    var BY_ID = {};
    (function index(items) {
        items.forEach(function (it) { BY_ID[it.id] = it; if (it.kids) index(it.kids); });
    })([].concat.apply([], SRC.sections.map(function (sec) { return sec.items; })));

    var YN = [['no', 'No'], ['yes', 'Yes']];
    /* Every question, in page order. group = the heading it sits under. */
    var QUESTIONS = [
        { k: 'excluded', g: 'pt', type: 'radio', label: 'Secondary HPT on dialysis, or tertiary HPT?', opts: YN },
        { k: 'setting', g: 'pt', type: 'radio', label: 'Setting', opts: [['op', 'Outpatient, same-day discharge'], ['ip', 'Overnight or inpatient']] },
        { k: 'gfr', g: 'pt', type: 'radio', label: 'Preop GFR below 60 (renal insufficiency)?', opts: YN },
        { k: 'pth', g: 'rr', type: 'num', label: 'Intraop PTH, recovery room', unit: 'pg/mL' },
        { k: 'tier', g: 'rr', type: 'radio', label: 'or choose the tier', opts: [['lt10', '< 10'], ['low', '10 – 15'], ['mid', '15 – 20'], ['gt20', '> 20']] },
        { k: 'dos', g: 'eve', type: 'radio', label: 'Hypocalcemia symptoms?', hint: 'Perioral, or bilateral hands/feet numbness or tingling', opts: [['none', 'None'], ['sx', 'Symptoms']] },
        { k: 'cramp', g: 'eve', type: 'radio', label: 'Hand or leg cramping or spasm?', opts: YN },
        { k: 'dose', g: 'eve', type: 'radio', label: 'Ordered evening oral dose given?', opts: [['not', 'Not yet'], ['given', 'Given']] },
        { k: 'alb', g: 'am', type: 'num', label: 'Albumin (optional)', unit: 'g/dL', hint: 'Corrects every calcium below: Ca + 0.8 × (4.0 − albumin). Leave blank to enter corrected values.' },
        { k: 'amPth', g: 'am', type: 'num', label: 'AM PTH (urgent)', unit: 'pg/mL' },
        { k: 'amCa', g: 'am', type: 'ca', label: 'POD 1 AM calcium', unit: 'mg/dL' },
        { k: 'amSx', g: 'am', type: 'radio', label: 'Symptomatic at 5:00 AM?', opts: YN },
        { k: 'ca11', g: 'h11', type: 'ca', label: '11:00 AM calcium', unit: 'mg/dL' },
        { k: 'sx11', g: 'h11', type: 'radio', label: 'Symptomatic at 11:00 AM?', opts: YN },
        { k: 'ca17', g: 'h17', type: 'ca', label: '5:00 PM calcium', unit: 'mg/dL' },
        { k: 'sx17', g: 'h17', type: 'radio', label: 'Symptomatic at 5:00 PM?', opts: YN },
        { k: 'cr', g: 'dc', type: 'radio', label: 'Creatinine vs preop', opts: [['same', 'Same or better'], ['worse', 'Worse']] },
        { k: 'lab', g: 'dc', type: 'radio', label: 'Tomorrow-morning lab', opts: [['local', 'OHSU (lives locally)'], ['ext', 'External lab']] },
    ];
    var GROUPS = [
        ['pt', 'Patient'], ['rr', 'Recovery room'], ['eve', 'Evening of surgery'],
        ['am', 'POD 1 · morning'], ['h11', 'POD 1 · 11:00 AM'], ['h17', 'POD 1 · 5:00 PM'], ['dc', 'Discharge'],
    ];
    var DEFAULTS = { excluded: 'no', gfr: 'no', dos: 'none' };

    var state = {};
    function reset() {
        state = {};
        QUESTIONS.forEach(function (q) { state[q.k] = DEFAULTS[q.k] || (q.type === 'radio' ? null : ''); });
    }
    reset();

    function el(tag, cls, text) {
        var n = doc.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null) n.textContent = text;
        return n;
    }

    /* ---- build the questions once (focus survives every re-render) ---- */
    var form = doc.getElementById('hc-form');
    var nodes = {}, groupNodes = {};
    GROUPS.forEach(function (g) {
        var sec = el('section', 'hc-group');
        sec.setAttribute('aria-labelledby', 'hc-g-' + g[0]);
        var h = el('h2', 'site-kicker hc-group-h', g[1]);
        h.id = 'hc-g-' + g[0];
        sec.appendChild(h);
        groupNodes[g[0]] = sec;
        form.appendChild(sec);
    });

    QUESTIONS.forEach(function (q) {
        var wrap, input = null, out = null, hint = null;
        if (q.type === 'radio') {
            wrap = el('fieldset', 'hc-q hc-q-radio');
            wrap.appendChild(el('legend', 'hc-label', q.label));
            if (q.hint) wrap.appendChild(el('p', 'hc-hint', q.hint));
            var seg = el('div', 'hc-seg');
            q.opts.forEach(function (o) {
                var lab = el('label', 'hc-opt');
                var r = doc.createElement('input');
                r.type = 'radio'; r.name = 'hc-' + q.k; r.value = o[0];
                r.addEventListener('change', function () { onRadio(q.k, o[0]); });
                lab.appendChild(r);
                lab.appendChild(el('span', null, o[1]));
                seg.appendChild(lab);
            });
            wrap.appendChild(seg);
        } else {
            wrap = el('div', 'hc-q hc-q-num');
            var id = 'hc-in-' + q.k;
            var l = el('label', 'hc-label', q.label);
            l.htmlFor = id;
            wrap.appendChild(l);
            var row = el('div', 'hc-num-row');
            input = doc.createElement('input');
            input.id = id; input.type = 'text'; input.inputMode = 'decimal';
            input.autocomplete = 'off'; input.spellcheck = false;
            input.addEventListener('input', function () { onNum(q.k, input.value); });
            row.appendChild(input);
            row.appendChild(el('span', 'hc-unit', q.unit));
            out = el('output', 'hc-out');
            out.htmlFor = id;
            row.appendChild(out);
            wrap.appendChild(row);
            hint = el('p', 'hc-hint', q.hint || '');
            wrap.appendChild(hint);
        }
        wrap.hidden = true;
        groupNodes[q.g].appendChild(wrap);
        nodes[q.k] = { q: q, wrap: wrap, input: input, out: out, hint: hint };
    });

    function onRadio(k, v) {
        state[k] = v;
        if (k === 'tier') { state.pth = ''; if (nodes.pth.input) nodes.pth.input.value = ''; }
        render();
    }
    function onNum(k, v) {
        state[k] = v;
        if (k === 'pth') { state.tier = null; }
        render();
    }

    /* ---- protocol text, built once; cited items are marked per render ---- */
    var srcHost = doc.getElementById('hc-source-body');
    var srcNodes = {};
    function buildItems(items, depth) {
        var ul = el('ul', 'hc-src-list' + (depth ? ' hc-src-sub' : ''));
        items.forEach(function (it) {
            var li = el('li', 'hc-src-item');
            li.id = 'src-' + it.id;
            li.tabIndex = -1;
            var p = el('p', 'hc-src-text');
            if (it.n) p.appendChild(el('span', 'hc-src-n', it.n));
            p.appendChild(doc.createTextNode(it.text));
            li.appendChild(p);
            if (it.kids) li.appendChild(buildItems(it.kids, depth + 1));
            ul.appendChild(li);
            srcNodes[it.id] = li;
        });
        return ul;
    }
    if (srcHost) {
        SRC.sections.forEach(function (sec) {
            var s = el('section', 'hc-src-sec');
            if (sec.title) s.appendChild(el('h3', 'hc-src-h', sec.title));
            s.appendChild(buildItems(sec.items, 0));
            srcHost.appendChild(s);
        });
    }

    /* ---- render ---- */
    var planHost = doc.getElementById('hc-plan-body');
    var dispoHost = doc.getElementById('hc-dispo');
    var dock = doc.getElementById('hc-dock');
    var dockText = doc.getElementById('hc-dock-text');
    var quotesBox = doc.getElementById('hc-quotes');
    var last = null;

    var DISPO_KICKER = { wait: 'Next', dc: 'Discharge', stay: 'In hospital', gap: 'Not specified by the protocol', stop: 'Stop' };
    var KIND_LABEL = { iv: 'IV calcium', gap: 'Not specified', stop: 'Stop', dc: 'Discharge', stay: 'Stay' };

    function fmt(n) { return String(round2(n)); }

    function render() {
        var R = evaluate(state);
        last = R;

        /* questions */
        QUESTIONS.forEach(function (q) {
            var n = nodes[q.k];
            var a = R.ask[q.k];
            n.wrap.hidden = !a;
            if (!a) return;
            if (q.type === 'radio') {
                var cur = state[q.k];
                if (q.k === 'tier' && !cur && R.tier) cur = R.tier;
                n.wrap.querySelectorAll('input').forEach(function (r) { r.checked = r.value === cur; });
                return;
            }
            var label = n.wrap.querySelector('.hc-label');
            label.textContent = (a.label || q.label);
            var bad = !!R.invalid[q.k];
            n.input.setAttribute('aria-invalid', bad ? 'true' : 'false');
            var hintText = a.hint || q.hint || '';
            if (bad) hintText = 'Not a plausible value in ' + q.unit + '.';
            n.hint.textContent = hintText;
            n.hint.hidden = !hintText;
            n.hint.classList.toggle('is-bad', bad);
            n.out.textContent = '';
            if (q.type === 'ca') {
                var v = parseNum(state[q.k]);
                var alb = parseNum(state.alb);
                var albOk = alb !== null && !isNaN(alb) && alb >= RANGE.alb[0] && alb <= RANGE.alb[1];
                if (v !== null && !bad) {
                    if (albOk) n.out.textContent = 'corrected ' + fmt(corrected(v, alb));
                    else if (alb === null) n.out.textContent = 'used as corrected';
                }
            }
        });
        GROUPS.forEach(function (g) {
            var sec = groupNodes[g[0]];
            sec.hidden = !sec.querySelector('.hc-q:not([hidden])');
        });

        /* disposition */
        dispoHost.textContent = '';
        dispoHost.className = 'hc-dispo is-' + R.dispo.kind;
        dispoHost.appendChild(el('p', 'site-kicker hc-dispo-k', DISPO_KICKER[R.dispo.kind] || ''));
        dispoHost.appendChild(el('p', 'hc-dispo-t', R.dispo.text));
        if (dock) {
            ['wait', 'dc', 'stay', 'gap', 'stop'].forEach(function (k) { dock.classList.toggle('is-' + k, k === R.dispo.kind); });
            dockText.textContent = R.dispo.text;
        }

        /* plan */
        var showQuotes = !quotesBox || quotesBox.checked;
        planHost.textContent = '';
        var steps = R.steps.map(function (st, i) { return { st: st, i: i }; });
        var order = {};
        WHEN.forEach(function (w, i) { order[w[0]] = i; });
        steps.sort(function (x, y) { return (order[x.st.when] - order[y.st.when]) || (x.i - y.i); });
        var quoted = {}, cited = {};
        var curWhen = null, ol = null;
        steps.forEach(function (o) {
            var st = o.st;
            if (st.when !== curWhen) {
                curWhen = st.when;
                var label = WHEN[order[st.when]][1];
                planHost.appendChild(el('h3', 'site-kicker hc-when', label));
                ol = el('ol', 'hc-steps');
                planHost.appendChild(ol);
            }
            var li = el('li', 'hc-step is-' + st.kind);
            if (KIND_LABEL[st.kind]) li.appendChild(el('span', 'hc-step-k', KIND_LABEL[st.kind]));
            li.appendChild(el('p', 'hc-step-t', st.text));
            var refs = el('p', 'hc-refs');
            st.src.forEach(function (id, j) {
                var it = BY_ID[id];
                if (!it) return;
                cited[id] = true;
                if (showQuotes && !quoted[id]) {
                    quoted[id] = true;
                    var bq = el('blockquote', 'hc-quote');
                    bq.appendChild(el('p', null, (it.n ? it.n + ' ' : '') + it.text));
                    li.appendChild(bq);
                }
                var a = el('a', 'hc-ref', it.ref);
                a.href = '#src-' + id;
                a.setAttribute('data-src', id);
                if (j) refs.appendChild(doc.createTextNode(' · '));
                refs.appendChild(a);
            });
            if (refs.childNodes.length) li.appendChild(refs);
            ol.appendChild(li);
        });
        if (!steps.length) planHost.appendChild(el('p', 'hc-empty', 'Answer the questions; the plan builds here, each step with the protocol text it comes from.'));

        Object.keys(srcNodes).forEach(function (id) { srcNodes[id].classList.toggle('is-cited', !!cited[id]); });
    }

    /* ---- plain-text plan ---- */
    function planText() {
        var R = last || evaluate(state);
        var lines = ['Postop hypocalcemia: ' + (SRC.origin || 'OHSU') + ' protocol', ''];
        QUESTIONS.forEach(function (q) {
            if (!R.ask[q.k]) return;
            var v = state[q.k];
            if (q.k === 'tier' && !v) return;
            if (v === null || v === '') return;
            var label = (R.ask[q.k].label || q.label).replace(/^or choose the tier$/, 'PTH tier');
            if (q.type === 'radio') {
                var opt = q.opts.filter(function (o) { return o[0] === v; })[0];
                lines.push(label + ': ' + (opt ? opt[1] : v));
            } else {
                var line = label + ': ' + String(v).trim() + ' ' + q.unit;
                if (q.type === 'ca') {
                    var c = parseNum(v), alb = parseNum(state.alb);
                    if (c !== null && !isNaN(c) && alb !== null && !isNaN(alb)) line += ' (corrected ' + fmt(corrected(c, alb)) + ')';
                }
                lines.push(line);
            }
        });
        lines.push('', (DISPO_KICKER[R.dispo.kind] || '') + ': ' + R.dispo.text);
        var order = {};
        WHEN.forEach(function (w, i) { order[w[0]] = i; });
        var steps = R.steps.map(function (st, i) { return { st: st, i: i }; })
            .sort(function (x, y) { return (order[x.st.when] - order[y.st.when]) || (x.i - y.i); });
        var cur = null;
        steps.forEach(function (o) {
            if (o.st.when !== cur) { cur = o.st.when; lines.push('', WHEN[order[cur]][1]); }
            var refs = o.st.src.map(function (id) { return BY_ID[id] ? BY_ID[id].ref : null; }).filter(Boolean);
            var tag = o.st.kind === 'gap' ? '[NOT SPECIFIED] ' : (o.st.kind === 'iv' ? '[IV] ' : '');
            lines.push('- ' + tag + o.st.text + (refs.length ? ' [' + refs.join('; ') + ']' : ''));
        });
        lines.push('', 'Corrected Ca = Ca + 0.8 × (4.0 − albumin), Payne; the protocol does not name a formula.');
        return lines.join('\n');
    }

    var copyBtn = doc.getElementById('hc-copy');
    var status = doc.getElementById('hc-status');
    function say(t) { if (status) { status.textContent = t; setTimeout(function () { if (status.textContent === t) status.textContent = ''; }, 2500); } }
    function fallbackCopy(text) {
        var ta = el('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.className = 'visually-hidden';
        doc.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
        doc.body.removeChild(ta);
        say(ok ? 'Plan copied.' : 'Copy failed: select the plan and copy it.');
    }
    if (copyBtn) copyBtn.addEventListener('click', function () {
        var text = planText();
        try {
            navigator.clipboard.writeText(text).then(function () { say('Plan copied.'); }, function () { fallbackCopy(text); });
        } catch (e) { fallbackCopy(text); }
    });

    var resetBtn = doc.getElementById('hc-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
        reset();
        QUESTIONS.forEach(function (q) { if (nodes[q.k].input) nodes[q.k].input.value = ''; });
        render();
        say('Cleared.');
        try { (nodes.setting.wrap.querySelector('input') || form).focus(); } catch (e) { /* no-op */ }
    });

    if (quotesBox) quotesBox.addEventListener('change', render);

    /* A citation jumps to its item in the protocol text and marks it. */
    root.addEventListener('click', function (ev) {
        var a = ev.target.closest && ev.target.closest('a[data-src]');
        if (!a) return;
        var li = srcNodes[a.getAttribute('data-src')];
        if (!li) return;
        ev.preventDefault();
        var det = doc.getElementById('hc-source');
        if (det && det.tagName === 'DETAILS') det.open = true;
        li.classList.remove('is-hit');
        void li.offsetWidth;
        li.classList.add('is-hit');
        try { li.scrollIntoView({ block: 'center' }); li.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
    });

    /* Phone dock: hidden while the plan itself is on screen. */
    try {
        var planEl = doc.getElementById('hc-plan');
        if (dock && planEl && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                dock.classList.toggle('is-away', es[0].isIntersecting);
            }).observe(planEl);
        }
    } catch (e) { /* no-op: the dock just stays */ }

    root.setAttribute('data-ready', '1');
    render();
})();
