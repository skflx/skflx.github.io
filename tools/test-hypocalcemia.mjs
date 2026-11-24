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
const { evaluate, corrected } = ctx.window.HypoCa;
const SRC = ctx.window.__HYPOCA_SOURCE;

let fails = 0, passes = 0;
function check(cond, name, detail) {
    if (cond) { passes++; return; }
    fails++;
    console.log(`  FAIL ${name}${detail ? '\n       ' + detail : ''}`);
}

/* Every source id, and the walk that collects them. */
const IDS = new Set();
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

console.log('hypocalcemia: PTH 15 overnight is in two tiers');
expect('PTH 15 overnight', { setting: 'ip', pth: '15' }, 'gap', ['ip.mid', 'ip.low']);
expect('PTH 15 overnight, chose 15–20', { setting: 'ip', pth: '15', tier15: 'mid' }, 'wait', ['ip.mid']);
check(run({ setting: 'ip', pth: '20' }).R.tier === 'mid', 'PTH 20 is in 15–20');
check(run({ setting: 'ip', pth: '10' }).R.tier === 'low', 'PTH 10 is in 10–15');

console.log('hypocalcemia: overnight PTH 15–20');
const mid = { setting: 'ip', pth: '17' };
expect('AM Ca 9', { ...mid, amCa: '9' }, 'dc', ['ip.mid.1']);
expect('AM Ca 8.0', { ...mid, amCa: '8.0', lab: 'local' }, 'dc', ['ip.mid.2a', 'ip.mid.2b', 'g.3.1']);
expect('AM Ca exactly 8.5', { ...mid, amCa: '8.5' }, 'gap');
expect('AM Ca 8.2 + albumin 3.0 → 9.0', { ...mid, amCa: '8.2', alb: '3.0' }, 'dc', ['ip.mid.1']);
expect('albumin implausible blocks', { ...mid, amCa: '8.2', alb: '30' }, 'wait');
expect('GFR < 60: BMP, Cr worse holds', { ...mid, gfr: 'yes', amCa: '9', cr: 'worse' }, 'stay', ['ip.renal']);

console.log('hypocalcemia: overnight PTH 10–15');
const low = { setting: 'ip', pth: '12' };
expect('awaiting AM', low, 'wait', ['ip.low', 'ip.low.att']);
expect('AM PTH 14, Ca 9', { ...low, amPth: '14', amCa: '9' }, 'dc', ['ip.low.1']);
expect('AM PTH 14, Ca 8.5 (≤ 8.5 is written)', { ...low, amPth: '14', amCa: '8.5' }, 'dc', ['ip.low.2a', 'ip.low.2b']);
expect('AM PTH exactly 10', { ...low, amPth: '10', amCa: '9' }, 'gap');
expect('AM PTH 6, Ca 8.2: no item', { ...low, amPth: '6', amCa: '8.2' }, 'gap', ['ip.low.3']);
expect('AM PTH 6, Ca 9 → 11 AM', { ...low, amPth: '6', amCa: '9' }, 'wait', ['ip.low.3']);
expect('11 AM 9', { ...low, amPth: '6', amCa: '9', ca11: '9' }, 'dc', ['ip.low.3a.i', 'ip.low.3a.ii']);
expect('11 AM exactly 8.5', { ...low, amPth: '6', amCa: '9', ca11: '8.5' }, 'gap');
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
expect('5 AM 8.4: no item', { ...v, amCa: '8.4' }, 'gap', ['v.crit']);
expect('5 AM 7.5 needs symptoms', { ...v, amCa: '7.5' }, 'wait');

/* item 4: 7–8 symptomatic */
const i4 = { ...v, amCa: '7.5', amSx: 'yes' };
expect('4: IV over 2 h', i4, 'wait', ['v.4', 'v.4q6'], hasIv);
expect('4a: 11 AM 8.3', { ...i4, ca11: '8.3', sx11: 'no' }, 'stay', ['v.4a', 'v.4c']);
expect('4b: 11 AM 7.3 lower, asymptomatic', { ...i4, ca11: '7.3', sx11: 'no' }, 'stay', ['v.4b', 'v.4c']);
expect('4: 11 AM 7.6 not lower, asymptomatic', { ...i4, ca11: '7.6', sx11: 'no' }, 'stay', ['v.4b']);
expect('4 vs 4b: 11 AM 7.6 still symptomatic', { ...i4, ca11: '7.6', sx11: 'yes' }, 'gap', ['v.4', 'v.4b']);
expect('4b: 11 AM 6.8 symptomatic', { ...i4, ca11: '6.8', sx11: 'yes' }, 'stay', ['v.4b']);
expect('4b: 11 AM 6.8 asymptomatic', { ...i4, ca11: '6.8', sx11: 'no' }, 'gap', ['v.4b']);

/* item 5: 7–8 asymptomatic */
const i5 = { ...v, amCa: '7.5', amSx: 'no' };
expect('5: extra oral', i5, 'wait', ['v.5'], noIv);
expect('5a: 11 AM higher', { ...i5, ca11: '7.9', lab: 'ext' }, 'dc', ['v.5a', 'g.3.2', 'g.3.3']);
expect('5: 11 AM equal', { ...i5, ca11: '7.5' }, 'gap');
expect('5b: 11 AM lower', { ...i5, ca11: '7.2' }, 'wait', ['v.5b']);
expect('5b.i: 5 PM stable', { ...i5, ca11: '7.2', ca17: '7.5' }, 'dc', ['v.5b.i']);
expect('5b.ii: 5 PM lower, asymptomatic', { ...i5, ca11: '7.2', ca17: '7.1', sx17: 'no' }, 'stay', ['v.5b.ii', 'v.crit'], noIv);
expect('5b.iii: 5 PM lower, symptomatic', { ...i5, ca11: '7.2', ca17: '7.1', sx17: 'yes' }, 'stay', ['v.5b.iii', 'v.crit'], hasIv);
expect('5a with Cr worse holds', { ...i5, gfr: 'yes', cr: 'worse', ca11: '7.9' }, 'stay', ['ip.renal']);

/* item 6: < 7 */
const i6 = { ...v, amCa: '6.6' };
expect('6: IV regardless', i6, 'wait', ['v.6'], hasIv);
expect('6b: symptomatic', { ...i6, ca11: '7.0', sx11: 'yes' }, 'stay', ['v.6b', 'v.crit']);
expect('6a vs 6b: lower, asymptomatic', { ...i6, ca11: '6.4', sx11: 'no' }, 'gap', ['v.6a', 'v.6b']);
expect('6c: higher, asymptomatic', { ...i6, ca11: '7.0', sx11: 'no' }, 'stay', ['v.6c', 'v.crit']);
expect('6: equal', { ...i6, ca11: '6.6', sx11: 'no' }, 'gap');

/* Telemetry is added once, however many IV steps. */
const many = run({ ...i4, ca11: '6.8', sx11: 'yes', dos: 'sx', cramp: 'yes' });
check(many.R.steps.filter((s) => s.src.includes('g.1')).length === 1, 'telemetry step appears once');

console.log(`\nhypocalcemia: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
