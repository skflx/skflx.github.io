#!/usr/bin/env node
/* test-hypocalcemia.mjs — the decision logic of hypocalcemia.html, in Node.
   Loads js/hypocalcemia-protocol.js and js/hypocalcemia.js in a vm (the
   engine half is DOM-free; the page half returns without a document) and
   walks every branch of the protocol: disposition, the source ids each
   step cites, and the "not specified" answers where the protocol is silent
   or contradicts itself. Deps-free; run: node tools/test-hypocalcemia.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['js/hypocalcemia-protocol.js', 'js/hypocalcemia.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { evaluate, corrected, tierOf } = ctx.window.HypoCa;
const SRC = ctx.window.__HYPOCA_SOURCE;

let fails = 0, passes = 0;
function check(cond, name, detail) {
    if (cond) { passes++; return; }
    fails++;
    console.log(`  FAIL ${name}${detail ? '\n       ' + detail : ''}`);
}

/* Every source id, and the walk that collects them. */
const IDS = new Set();
/* Owner rules are marked, ids x.*; every other item is the document's text. */
(function walk(items) { for (const it of items) { check(!!it.added === it.id.startsWith('x.'), `owner-rule marking matches id: ${it.id}`); if (it.kids) walk(it.kids); } })(
    SRC.sections.flatMap((s) => s.items));
(function walk(items) { for (const it of items) { check(!IDS.has(it.id), `source id unique: ${it.id}`); IDS.add(it.id); if (it.kids) walk(it.kids); } })(
    SRC.sections.flatMap((s) => s.items));

const base = { excluded: 'no', gfr: 'no', dos: 'none' };
function run(over) {
    const R = evaluate(Object.assign({}, base, over));
    const cites = R.steps.flatMap((s) => s.src);
    for (const id of cites) check(IDS.has(id), `cited id exists: ${id}`);
    return { R, kind: R.dispo.kind, text: R.dispo.text, cites: new Set(cites), kinds: R.steps.map((s) => s.kind), asks: Object.keys(R.ask) };
}
function expect(name, over, kind, mustCite = [], extra) {
    const r = run(over);
    check(r.kind === kind, `${name}: disposition ${kind}`, `got ${r.kind} "${r.text}"`);
    for (const id of mustCite) check(r.cites.has(id), `${name}: cites ${id}`, `cites ${[...r.cites].join(', ')}`);
    if (extra) extra(r, name);
    return r;
}
const hasIv = (r, name) => {
    check(r.kinds.includes('iv'), `${name}: IV step`);
    check(r.cites.has('g.1'), `${name}: telemetry (General Rule 1)`);
};
const noIv = (r, name) => check(!r.kinds.includes('iv') && !r.cites.has('g.1'), `${name}: no IV calcium`);

console.log('hypocalcemia: corrected calcium');
check(corrected(7.6, 3.2) === 8.24, 'Payne 7.6 + 0.8 × (4 − 3.2) = 8.24', String(corrected(7.6, 3.2)));
check(corrected(8, null) === 8, 'no albumin: the value is taken as corrected');
check(corrected(8.9, 4.5) === 8.5, 'albumin above 4 corrects downward');

console.log('hypocalcemia: scope and setting');
expect('excluded', { excluded: 'yes' }, 'stop', ['scope']);
expect('no setting', {}, 'wait');
expect('no PTH', { setting: 'ip' }, 'wait');
check(run({ setting: 'ip', pth: 'abc' }).R.invalid.pth, 'non-numeric PTH is flagged invalid');

console.log('hypocalcemia: outpatient');
expect('op PTH 25', { setting: 'op', pth: '25' }, 'dc', ['op.gt20']);
expect('op PTH 15 (unambiguous: < 15 admits)', { setting: 'op', pth: '15' }, 'dc', ['op.mid', 'g.2']);
expect('op PTH 18 local', { setting: 'op', pth: '18', lab: 'local' }, 'dc', ['op.mid.1']);
expect('op PTH 18 external', { setting: 'op', pth: '18', lab: 'ext' }, 'dc', ['op.mid.2', 'op.mid.3']);
expect('op PTH 12 admits obs, then 10–15 orders', { setting: 'op', pth: '12' }, 'wait', ['op.lt15', 'ip.low']);
expect('op tier < 10 admits obs, then < 10 orders', { setting: 'op', tier: 'lt10' }, 'wait', ['op.lt15', 'v.1']);

console.log('hypocalcemia: overnight PTH > 20');
expect('PTH 30', { setting: 'ip', pth: '30' }, 'dc', ['ip.gt20']);
expect('PTH 30, GFR < 60, Cr unknown', { setting: 'ip', pth: '30', gfr: 'yes' }, 'wait', ['ip.renal']);
expect('PTH 30, GFR < 60, Cr worse', { setting: 'ip', pth: '30', gfr: 'yes', cr: 'worse' }, 'stay', ['ip.renal']);
expect('PTH 30, GFR < 60, Cr same', { setting: 'ip', pth: '30', gfr: 'yes', cr: 'same' }, 'dc', ['ip.gt20', 'ip.renal']);

console.log('hypocalcemia: a value at a cutoff counts as exceeding it (owner)');
for (const [p, t] of [[9, 'lt10'], [9.9, 'lt10'], [10, 'low'], [14.9, 'low'], [15, 'mid'], [19.9, 'mid'], [20, 'mid'], [20.1, 'gt20']]) {
    check(tierOf(p) === t, `recovery-room PTH ${p} → ${t}`, tierOf(p));
}
expect('overnight PTH 15 → 15–20', { setting: 'ip', pth: '15' }, 'wait', ['ip.mid']);
expect('overnight PTH 20 stays 15–20 (written inclusive)', { setting: 'ip', pth: '20' }, 'wait', ['ip.mid']);
expect('outpatient PTH 20 stays 15–20', { setting: 'op', pth: '20' }, 'dc', ['op.mid']);

console.log('hypocalcemia: overnight PTH 15–20');
const mid = { setting: 'ip', pth: '17' };
expect('AM Ca 9', { ...mid, amCa: '9' }, 'dc', ['ip.mid.1']);
expect('AM Ca 8.0', { ...mid, amCa: '8.0', lab: 'local' }, 'dc', ['ip.mid.2a', 'ip.mid.2b', 'g.3.1']);
expect('AM Ca exactly 8.5 counts as > 8.5', { ...mid, amCa: '8.5' }, 'dc', ['ip.mid.1']);
expect('AM Ca 8.2 + albumin 3.0 → 9.0', { ...mid, amCa: '8.2', alb: '3.0' }, 'dc', ['ip.mid.1']);
expect('albumin implausible blocks', { ...mid, amCa: '8.2', alb: '30' }, 'wait');
expect('GFR < 60: BMP, Cr worse holds', { ...mid, gfr: 'yes', amCa: '9', cr: 'worse' }, 'stay', ['ip.renal']);

console.log('hypocalcemia: overnight PTH 10–15');
const low = { setting: 'ip', pth: '12' };
expect('awaiting AM', low, 'wait', ['ip.low', 'ip.low.att']);
expect('AM PTH 14, Ca 9', { ...low, amPth: '14', amCa: '9' }, 'dc', ['ip.low.1']);
expect('AM PTH 14, Ca 8.5 (≤ 8.5 is written)', { ...low, amPth: '14', amCa: '8.5' }, 'dc', ['ip.low.2a', 'ip.low.2b']);
expect('AM PTH exactly 10 counts as > 10', { ...low, amPth: '10', amCa: '9' }, 'dc', ['ip.low.1']);
expect('AM PTH 10, Ca 8.2', { ...low, amPth: '10', amCa: '8.2' }, 'dc', ['ip.low.2a']);
expect('AM PTH 6, Ca exactly 8.5 counts as > 8.5', { ...low, amPth: '6', amCa: '8.5' }, 'wait', ['ip.low.3']);
expect('AM PTH 6, Ca 8.2 → PTH < 10 pathway (owner)', { ...low, amPth: '6', amCa: '8.2' }, 'wait', ['x.low', 'v.1', 'x.ge8']);
expect('AM PTH 6, Ca 8.2, 11 AM higher', { ...low, amPth: '6', amCa: '8.2', ca11: '8.4', sx11: 'no' }, 'dc', ['x.low', 'v.5a']);
expect('AM PTH 6, Ca 7.5 asks symptoms', { ...low, amPth: '6', amCa: '7.5' }, 'wait', ['x.low']);
check(run({ ...low, amPth: '6', amCa: '7.5' }).asks.includes('amSx'), 'AM PTH 6, Ca 7.5 asks AM symptoms');
expect('AM PTH 6, Ca 6.8 → item 6', { ...low, amPth: '6', amCa: '6.8' }, 'wait', ['x.low', 'v.6'], hasIv);
expect('AM PTH 6, Ca 9 → 11 AM', { ...low, amPth: '6', amCa: '9' }, 'wait', ['ip.low.3']);
expect('11 AM 9', { ...low, amPth: '6', amCa: '9', ca11: '9' }, 'dc', ['ip.low.3a.i', 'ip.low.3a.ii']);
expect('11 AM exactly 8.5 counts as > 8.5', { ...low, amPth: '6', amCa: '9', ca11: '8.5' }, 'dc', ['ip.low.3a.i']);
expect('5 PM exactly 8.5 counts as > 8.5', { ...low, amPth: '6', amCa: '9', ca11: '8.2', ca17: '8.5' }, 'dc', ['ip.low.3b.i.1']);
expect('11 AM 8.2 → 5 PM', { ...low, amPth: '6', amCa: '9', ca11: '8.2' }, 'wait', ['ip.low.3b']);
expect('5 PM 8.8', { ...low, amPth: '6', amCa: '9', ca11: '8.2', ca17: '8.8' }, 'dc', ['ip.low.3b.i.1', 'ip.low.3b.i.2']);
expect('5 PM 8.1', { ...low, amPth: '6', amCa: '9', ca11: '8.2', ca17: '8.1' }, 'stay', ['ip.low.3b.ii', 'ip.low.crit']);
expect('5 PM 8.1, GFR < 60', { ...low, gfr: 'yes', amPth: '6', amCa: '9', ca11: '8.2', ca17: '8.1' }, 'stay', ['ip.renal']);

console.log('hypocalcemia: overnight PTH < 10');
const v = { setting: 'ip', pth: '6' };
expect('standing orders', v, 'wait', ['v.1', 'v.2', 'v.3', 'v.att', 'g.2'], noIv);
expect('evening cramping', { ...v, dos: 'sx', cramp: 'yes' }, 'wait', ['v.dos'], hasIv);
expect('evening sx, dose not given', { ...v, dos: 'sx', cramp: 'no', dose: 'not' }, 'wait', ['v.dos2'], noIv);
expect('evening sx, dose given', { ...v, dos: 'sx', cramp: 'no', dose: 'given' }, 'wait', ['v.dos2'], noIv);
/* 5 AM 8 or above (owner rule x.ge8): the 11 AM trend, as item 5 */
const g8 = { ...v, amCa: '8.4' };
expect('≥8: asks 11 AM calcium and symptoms', g8, 'wait', ['x.ge8'], noIv);
check(['ca11', 'sx11'].every((k) => run(g8).asks.includes(k)), '≥8 asks the 11 AM calcium and symptoms');
expect('≥8: 11 AM higher', { ...g8, ca11: '8.6', sx11: 'no' }, 'dc', ['v.5a', 'x.ge8']);
expect('≥8: 11 AM equal, asymptomatic', { ...g8, ca11: '8.4', sx11: 'no' }, 'dc', ['v.5a', 'x.eq']);
expect('≥8: 11 AM symptomatic', { ...g8, ca11: '8.6', sx11: 'yes' }, 'stay', ['x.sx'], noIv);
expect('≥8: 11 AM lower → 5 PM', { ...g8, ca11: '8.1', sx11: 'no' }, 'wait', ['v.5b', 'x.ge8']);
expect('≥8: 5 PM stable', { ...g8, ca11: '8.1', sx11: 'no', ca17: '8.4', sx17: 'no' }, 'dc', ['v.5b.i']);
expect('≥8: 5 PM lower, asymptomatic', { ...g8, ca11: '8.1', sx11: 'no', ca17: '8.0', sx17: 'no' }, 'stay', ['v.5b.ii'], noIv);
expect('≥8: 5 PM lower, symptomatic', { ...g8, ca11: '8.1', sx11: 'no', ca17: '8.0', sx17: 'yes' }, 'stay', ['v.5b.iii'], hasIv);
expect('5 AM exactly 8 counts as above 8', { ...v, amCa: '8' }, 'wait', ['x.ge8']);
expect('5 AM exactly 7 is in 7–8', { ...v, amCa: '7', amSx: 'no' }, 'wait', ['v.5']);
expect('5 AM 7.5 needs symptoms', { ...v, amCa: '7.5' }, 'wait');

/* item 4: 7–8 symptomatic */
const i4 = { ...v, amCa: '7.5', amSx: 'yes' };
expect('4: IV over 2 h', i4, 'wait', ['v.4', 'v.4q6'], hasIv);
expect('4a: 11 AM 8.3', { ...i4, ca11: '8.3', sx11: 'no' }, 'stay', ['v.4a', 'v.4c']);
expect('4a: 11 AM exactly 8', { ...i4, ca11: '8', sx11: 'no' }, 'stay', ['v.4a']);
expect('4b: 11 AM 7.3 lower, asymptomatic', { ...i4, ca11: '7.3', sx11: 'no' }, 'stay', ['v.4b', 'v.4c']);
expect('4: 11 AM 7.6 not lower, asymptomatic', { ...i4, ca11: '7.6', sx11: 'no' }, 'stay', ['v.4b']);
expect('4: 11 AM 7.6 still symptomatic → escalate (owner)', { ...i4, ca11: '7.6', sx11: 'yes' }, 'stay', ['x.sx', 'v.4', 'v.4b']);
expect('4a: 11 AM 8.3 but symptomatic → escalate', { ...i4, ca11: '8.3', sx11: 'yes' }, 'stay', ['v.4a', 'x.sx']);
expect('4b: 11 AM 6.8 symptomatic', { ...i4, ca11: '6.8', sx11: 'yes' }, 'stay', ['v.4b']);
expect('4: 11 AM 6.8 asymptomatic → as item 6 (owner)', { ...i4, ca11: '6.8', sx11: 'no' }, 'stay', ['x.4lt7', 'v.6', 'v.4c'], hasIv);

/* item 5: 7–8 asymptomatic */
const i5 = { ...v, amCa: '7.5', amSx: 'no' };
expect('5: extra oral', i5, 'wait', ['v.5'], noIv);
expect('5a: 11 AM higher', { ...i5, ca11: '7.9', sx11: 'no', lab: 'ext' }, 'dc', ['v.5a', 'g.3.2', 'g.3.3']);
expect('5: 11 AM equal, asymptomatic → 5a (owner)', { ...i5, ca11: '7.5', sx11: 'no' }, 'dc', ['v.5a', 'x.eq']);
expect('5: 11 AM symptomatic → escalate', { ...i5, ca11: '7.9', sx11: 'yes' }, 'stay', ['x.sx']);
expect('5: asks 11 AM symptoms', { ...i5, ca11: '7.9' }, 'wait');
expect('5b: 11 AM lower', { ...i5, ca11: '7.2', sx11: 'no' }, 'wait', ['v.5b']);
expect('5b.i: 5 PM stable', { ...i5, ca11: '7.2', sx11: 'no', ca17: '7.5', sx17: 'no' }, 'dc', ['v.5b.i']);
expect('5b.ii: 5 PM lower, asymptomatic', { ...i5, ca11: '7.2', sx11: 'no', ca17: '7.1', sx17: 'no' }, 'stay', ['v.5b.ii', 'v.crit'], noIv);
expect('5b.iii: 5 PM lower, symptomatic', { ...i5, ca11: '7.2', sx11: 'no', ca17: '7.1', sx17: 'yes' }, 'stay', ['v.5b.iii', 'v.crit'], hasIv);
expect('5a with Cr worse holds', { ...i5, gfr: 'yes', cr: 'worse', ca11: '7.9', sx11: 'no' }, 'stay', ['ip.renal']);

/* item 6: < 7 */
const i6 = { ...v, amCa: '6.6' };
expect('6: IV regardless', i6, 'wait', ['v.6'], hasIv);
expect('6b: symptomatic', { ...i6, ca11: '7.0', sx11: 'yes' }, 'stay', ['v.6b', 'v.crit']);
expect('6b over 6a: lower, asymptomatic (owner)', { ...i6, ca11: '6.4', sx11: 'no' }, 'stay', ['x.6b', 'v.6b', 'v.crit'], hasIv);
expect('6c: higher, asymptomatic', { ...i6, ca11: '7.0', sx11: 'no' }, 'stay', ['v.6c', 'v.crit']);
expect('6: equal, asymptomatic → 6c (owner)', { ...i6, ca11: '6.6', sx11: 'no' }, 'stay', ['v.6c', 'x.eq']);
expect('5b.i: 5 PM stable but symptomatic → escalate', { ...i5, ca11: '7.2', sx11: 'no', ca17: '7.5', sx17: 'yes' }, 'stay', ['x.sx']);

console.log('hypocalcemia: sweep: every input combination reaches a known disposition');
{
    const KINDS = new Set(['wait', 'dc', 'stay', 'stop']);
    const vals = ['6.5', '7', '7.5', '8', '8.4', '8.5', '9'];
    let n = 0, bad = 0;
    for (const setting of ['op', 'ip']) for (const pth of ['6', '10', '12', '15', '17', '20', '25']) for (const gfr of ['no', 'yes'])
    for (const amPth of ['6', '10', '12']) for (const amCa of vals) for (const amSx of ['no', 'yes']) for (const ca11 of vals)
    for (const sx11 of ['no', 'yes']) for (const ca17 of vals) for (const sx17 of ['no', 'yes']) {
        n++;
        let R;
        try { R = evaluate({ excluded: 'no', dos: 'none', setting, pth, gfr, cr: 'same', amPth, amCa, amSx, ca11, sx11, ca17, sx17, lab: 'local' }); } catch (e) { R = null; }
        if (!R || !R.dispo || !KINDS.has(R.dispo.kind) || R.dispo.kind === 'wait') bad++;
    }
    check(bad === 0, `all ${n} complete input combinations reach dc, stay or stop`, `${bad} did not`);
}

/* Telemetry is added once, however many IV steps. */
const many = run({ ...i4, ca11: '6.8', sx11: 'yes', dos: 'sx', cramp: 'yes' });
check(many.R.steps.filter((s) => s.src.includes('g.1')).length === 1, 'telemetry step appears once');

console.log(`\nhypocalcemia: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
