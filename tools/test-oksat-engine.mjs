#!/usr/bin/env node
/* =============================================================
   test-oksat-engine.mjs — behavior tests for js/oksat/engine.js,
   the highest-regression-risk code in the repo (5 modules depend on
   it; ItemView is closure-private by design — never export it).

   Drives oksat-study.html?m=pediatrics in headless Chromium. Needs a
   real browser + the page's CDN (React/htm) — same constraint as the
   smoke harness; in CI the CDN is reachable.

   ---- Engine contract this pins (read js/oksat/engine.js to confirm) ----
   Storage keys, namespace normalized lowercase-alnum and resolved by
   OKSATStore.reviewer() from localStorage 'oksat:reviewer' (default
   'guest' — there is no prompt):
     oksat:progress:<slug>:<reviewer> = { v:1, answers:{qId:optId},
                                          firstCorrect:{qId:bool}, updated }
     oksat:srs:<slug>:<reviewer>      = { v:1, items:{qId:{box,nextReview}}, updated }
   An MCQ item opens on a recall gate (stem + "Reveal answer" / "Show the
   choices"): the options are hidden until the learner opens them. Pressing
   "Show the choices" (or `c`) reveals the radiogroup; picking an option locks
   it and tags progress mode 'mcq'. The recall path ("Reveal answer", or space)
   shows the answer and a 1–4 self-grade that tags mode 'recall'.
   An MCQ option button renders the option id uppercased in a fixed-width
   leading cell; the button is disabled once answered (first-attempt lock:
   answers/firstCorrect/modes are written once and never overwritten).
   Review: an answered item whose srs nextReview <= today opens fresh at the
   gate; one review attempt per due date moves only srs (box, nextReview).
   Navigation: "Continue" opens the first open item (unanswered or due);
   "Next unanswered" (or `u`) walks open items forward; the jump slider
   (input.ok-jump-range, 1-based) jumps when released.
   pediatrics q1: correct='b' (used to pick a deliberate wrong answer).

   Usage:  node tools/test-oksat-engine.mjs [--base <url>] [--headed]
   Exits nonzero on any failed case.
   ============================================================= */
import { startServer, launchBrowser } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const REVIEWER = 'smoke';                       // normalizes to 'smoke'
const SLUG = 'pediatrics';
const PROGRESS = `oksat:progress:${SLUG}:${REVIEWER}`;
const SRS = `oksat:srs:${SLUG}:${REVIEWER}`;

let failures = 0;
const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  if (!cond) failures++;
}

const ls = (page, key) => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, key);

/* Open the study page in the REVIEWER namespace with a clean context.
   The namespace is seeded directly — the page reads it from storage and
   mounts without prompting. */
async function openStudy(browser, base, seed) {
  const context = await browser.newContext();
  await context.addInitScript(`try{localStorage.setItem('oksat:reviewer','${REVIEWER}');}catch(e){}`);
  if (seed) await context.addInitScript(seed);
  const page = await context.newPage();
  await page.goto(base + `/oksat-study.html?m=${SLUG}`, { waitUntil: 'domcontentloaded' });
  await mounted(page);
  return { context, page };
}

/* Resolves once the engine has rendered into #root. */
const mounted = (page) => page.waitForFunction(
  () => document.querySelector('#root') && document.querySelector('#root').innerText.trim().length > 0,
  null, { timeout: 12000 });

/* Click "Begin", landing on the first item's recall gate. */
async function begin(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Begin|Continue/.test(b.textContent)), null, { timeout: 8000 });
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Begin|Continue/.test(x.textContent)); b && b.click(); });
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Show the choices/.test(b.textContent)), null, { timeout: 8000 });
}

/* From the recall gate, open the MCQ choices so the radiogroup renders. */
async function openChoices(page) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Show the choices/.test(x.textContent)); b && b.click(); });
  await page.waitForFunction(() => document.querySelector('[role="radiogroup"]'), null, { timeout: 8000 });
}

/* The MCQ option buttons inside the current radiogroup. */
const optionButtons = 'button[role="radio"]';

async function main() {
  let server = null;
  let base = BASE;
  if (!base) { server = await startServer(); base = server.origin; }
  const browser = await launchBrowser({ headed: HEADED });

  /* ---- Case 1: first-attempt lock ---- */
  {
    const { context, page } = await openStudy(browser, base);
    await begin(page);
    await openChoices(page);
    // pick a deliberately WRONG option: q1 correct is 'b', click option 1 ('a')
    const btns = await page.$$(optionButtons);
    await btns[0].click();
    await page.waitForTimeout(300);
    const prog1 = await ls(page, PROGRESS);
    const firstAnsweredId = prog1 && prog1.answers && Object.keys(prog1.answers)[0];
    const recorded = firstAnsweredId ? prog1.answers[firstAnsweredId] : null;
    check('1a: wrong answer recorded + item locked', recorded === 'a', `recorded=${JSON.stringify(recorded)}`);
    // options now disabled → clicking another must not change the record
    await page.$$eval(optionButtons, (bs) => bs.forEach((b) => { if (b.textContent.trim().startsWith('C')) b.click(); }));
    await page.waitForTimeout(200);
    const prog2 = await ls(page, PROGRESS);
    check('1b: locked answer unchanged after 2nd click', prog2.answers[firstAnsweredId] === 'a', `now=${prog2.answers[firstAnsweredId]}`);
    // reload → still locked to original
    await page.reload({ waitUntil: 'domcontentloaded' });
    await mounted(page);
    await page.waitForTimeout(500);
    const prog3 = await ls(page, PROGRESS);
    check('1c: lock survives reload', prog3 && prog3.answers[firstAnsweredId] === 'a', `after reload=${prog3 && prog3.answers[firstAnsweredId]}`);
    await context.close();
  }

  /* ---- Case 2: SRS write ---- */
  {
    const { context, page } = await openStudy(browser, base);
    await begin(page);
    await openChoices(page);
    await (await page.$$(optionButtons))[0].click();
    await page.waitForTimeout(300);
    const srs = await ls(page, SRS);
    const items = srs && srs.items ? Object.values(srs.items) : [];
    const one = items[0];
    check('2a: SRS entry written', !!one, `srs=${JSON.stringify(srs)}`);
    check('2b: Leitner box in 1..5', one && one.box >= 1 && one.box <= 5, `box=${one && one.box}`);
    check('2c: nextReview is a date', one && /^\d{4}-\d{2}-\d{2}$/.test(one.nextReview), `nextReview=${one && one.nextReview}`);
    await context.close();
  }

  /* ---- Case 3: keyboard ---- */
  {
    const { context, page } = await openStudy(browser, base);
    await begin(page);
    // 'c' opens the choices from the recall gate, then '1' selects option 'a'
    await page.keyboard.press('c');
    await page.waitForFunction(() => document.querySelector('[role="radiogroup"]'), null, { timeout: 8000 });
    await page.keyboard.press('1');
    await page.waitForTimeout(300);
    const prog = await ls(page, PROGRESS);
    const id0 = prog && prog.answers && Object.keys(prog.answers)[0];
    check('3a: key "c" opens choices, "1" selects option a', id0 && prog.answers[id0] === 'a', `answers=${JSON.stringify(prog && prog.answers)}`);
    check('3a2: mcq answer tagged mode "mcq"', prog && prog.modes && prog.modes[id0] === 'mcq', `modes=${JSON.stringify(prog && prog.modes)}`);
    // '→' advances to a different item
    const before = await page.evaluate(() => document.body.innerText);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => document.body.innerText);
    check('3b: ArrowRight advances item', before !== after, 'page text unchanged after ArrowRight');
    // 'h' goes home (Begin/Continue button reappears)
    await page.keyboard.press('h');
    await page.waitForTimeout(400);
    const home = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Begin|Continue/.test(b.textContent)));
    check('3c: key "h" returns home', home, 'no Begin/Continue after h');
    await context.close();
  }

  /* ---- Case 4: legacy mcq:* migration ---- */
  {
    // seed a legacy key BEFORE any script runs; js/oksat/store.js should copy it to oksat:*
    const seed = `try{localStorage.setItem('mcq:legacyprobe','hello');}catch(e){}`;
    const { context, page } = await openStudy(browser, base, seed);
    const migrated = await page.evaluate(() => { try { return localStorage.getItem('oksat:legacyprobe'); } catch (e) { return null; } });
    check('4: legacy mcq:* migrated to oksat:*', migrated === 'hello', `oksat:legacyprobe=${migrated}`);
    await context.close();
  }

  /* ---- Case 5: recall path (answer before choices) ---- */
  {
    const { context, page } = await openStudy(browser, base);
    await begin(page);
    // space reveals the answer without ever opening the choices
    await page.keyboard.press(' ');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Knew it cold/.test(b.textContent)), null, { timeout: 8000 });
    const noOptions = await page.evaluate(() => !document.querySelector('[role="radiogroup"]'));
    check('5a: recall path reveals answer without choices', noOptions, 'radiogroup appeared on recall path');
    // '4' self-grades "Knew it cold" → correct, mode 'recall', Leitner +2 (box 1→3)
    await page.keyboard.press('4');
    await page.waitForTimeout(300);
    const prog = await ls(page, PROGRESS);
    const srs = await ls(page, SRS);
    const id0 = prog && prog.answers && Object.keys(prog.answers)[0];
    check('5b: recall grade recorded as correct', id0 && prog.firstCorrect[id0] === true, `firstCorrect=${JSON.stringify(prog && prog.firstCorrect)}`);
    check('5c: recall answer tagged mode "recall"', id0 && prog.modes && prog.modes[id0] === 'recall', `modes=${JSON.stringify(prog && prog.modes)}`);
    check('5d: "knew it cold" jumps Leitner box to 3', id0 && srs.items[id0] && srs.items[id0].box === 3, `box=${id0 && srs.items[id0] && srs.items[id0].box}`);
    await context.close();
  }

  /* ---- Case 6: review attempt on a due item ---- */
  {
    // q1 answered wrong long ago, due since 2020: review must open it fresh,
    // accept a new answer, move the Leitner box, and leave the first attempt alone.
    const seed = `try{localStorage.setItem('${PROGRESS}',JSON.stringify({v:1,answers:{q1:'a'},firstCorrect:{q1:false},modes:{q1:'mcq'}}));` +
      `localStorage.setItem('${SRS}',JSON.stringify({v:1,items:{q1:{box:1,nextReview:'2020-01-01'}}}));}catch(e){}`;
    const { context, page } = await openStudy(browser, base, seed);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Review due/.test(b.textContent)), null, { timeout: 8000 });
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Review due/.test(x.textContent)); b && b.click(); });
    await page.waitForTimeout(400);
    const atGate = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Show the choices/.test(b.textContent)) && !document.querySelector('[role="radiogroup"]'));
    check('6a: due item opens at the gate, old answer hidden', atGate, 'no fresh recall gate on the due item');
    await openChoices(page);
    const anyLocked = await page.$$eval(optionButtons, (bs) => bs.some((b) => b.disabled));
    check('6b: review options are answerable (not locked)', !anyLocked, 'options disabled on a due item');
    await page.$$eval(optionButtons, (bs) => { const b = bs.find((x) => x.textContent.trim().startsWith('B')); b && b.click(); });
    await page.waitForTimeout(300);
    const prog = await ls(page, PROGRESS);
    const srs = await ls(page, SRS);
    const t = new Date().toISOString().split('T')[0];
    check('6c: first attempt unchanged by review', prog.answers.q1 === 'a' && prog.firstCorrect.q1 === false, `progress=${JSON.stringify(prog)}`);
    check('6d: correct review moves box 1→2, next review in the future', srs.items.q1.box === 2 && srs.items.q1.nextReview > t, `srs=${JSON.stringify(srs.items.q1)}`);
    await page.$$eval(optionButtons, (bs) => { const b = bs.find((x) => x.textContent.trim().startsWith('A')); b && b.click(); });
    await page.waitForTimeout(200);
    const srs2 = await ls(page, SRS);
    check('6e: one review attempt per due date', srs2.items.q1.box === 2, `box after 2nd click=${srs2.items.q1.box}`);
    await context.close();
  }

  /* ---- Case 7: navigation (Continue, next unanswered, jump slider) ---- */
  {
    const future = '2099-01-01';
    const seed = `try{localStorage.setItem('${PROGRESS}',JSON.stringify({v:1,answers:{q1:'b',q2:'a',q4:'a'},firstCorrect:{q1:true,q2:false,q4:false},modes:{q1:'mcq',q2:'mcq',q4:'mcq'}}));` +
      `localStorage.setItem('${SRS}',JSON.stringify({v:1,items:{q1:{box:2,nextReview:'${future}'},q2:{box:1,nextReview:'${future}'},q4:{box:1,nextReview:'${future}'}}}));}catch(e){}`;
    const { context, page } = await openStudy(browser, base, seed);
    const qnum = () => page.evaluate(() => { const m = document.body.innerText.match(/Question (\d+) of/i); return m ? +m[1] : null; });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Continue/.test(b.textContent)), null, { timeout: 8000 });
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Continue/.test(x.textContent)); b && b.click(); });
    await page.waitForTimeout(400);
    check('7a: Continue opens the first unanswered item', (await qnum()) === 3, `landed on Q${await qnum()}`);
    await page.keyboard.press('u');
    await page.waitForTimeout(400);
    check('7b: "u" skips answered items to the next unanswered', (await qnum()) === 5, `landed on Q${await qnum()}`);
    const label = await page.evaluate(() => { const b = document.querySelector('.ok-next-open'); return b ? b.textContent : ''; });
    check('7c: next-unanswered button counts what is left', /Next unanswered · \d+ left/.test(label), `label=${label}`);
    await page.evaluate(() => {
      const r = document.querySelector('input.ok-jump-range');
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(r, '10'); r.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(200);
    const preview = await page.evaluate(() => document.querySelector('.ok-jump-preview').textContent);
    check('7d: dragging previews without jumping', (await qnum()) === 5 && /^Q10 of/.test(preview), `at Q${await qnum()}, preview=${preview}`);
    await page.evaluate(() => document.querySelector('input.ok-jump-range').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    await page.waitForTimeout(400);
    check('7e: releasing the slider jumps to that question', (await qnum()) === 10, `landed on Q${await qnum()}`);
    await context.close();
  }

  /* ---- Case 8: hub due banner lists every module with due items ---- */
  const hubSeed = (extra) => `try{localStorage.setItem('oksat:reviewer','${REVIEWER}');` +
    `localStorage.setItem('${SRS}',JSON.stringify({items:{a:{nextReview:'2020-01-01'},b:{nextReview:'2020-01-01'}}}));` +
    `localStorage.setItem('oksat:srs:ta-tubes:${REVIEWER}',JSON.stringify({items:{c:{nextReview:'2020-01-01'}}}));${extra || ''}}catch(e){}`;
  {
    const context = await browser.newContext();
    await context.addInitScript(hubSeed());
    const page = await context.newPage();
    await page.goto(base + '/oksat.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#review-list a', { timeout: 8000 });
    const links = await page.$$eval('#review-list a', (as) => as.map((a) => [a.textContent, a.getAttribute('href')]));
    check('8a: banner links every module with due items, most due first',
      links.length === 2 && /· 2$/.test(links[0][0]) && links[0][1] === `oksat-study.html?m=${SLUG}` && /· 1$/.test(links[1][0]) && links[1][1] === 'oksat-study.html?m=ta-tubes',
      JSON.stringify(links));
    await context.close();
  }

  /* ---- Case 9: weak-concepts list (3+ attempts, at least one miss, lowest accuracy first) ---- */
  {
    const cm = (c) => `localStorage.setItem('oksat:cmastery:${SLUG}:${REVIEWER}',JSON.stringify({v:1,concepts:${JSON.stringify(c)}}));`;
    const seed = hubSeed(cm({
      shaky: { box: 1, seen: 4, correct: 1, lapses: 3 },
      mid: { box: 2, seen: 3, correct: 2, lapses: 1 },
      solid: { box: 5, seen: 5, correct: 5, lapses: 0 },
      few: { box: 1, seen: 2, correct: 0, lapses: 2 },
    }));
    const context = await browser.newContext();
    await context.addInitScript(seed);
    const page = await context.newPage();
    await page.goto(base + '/oksat.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#weak-list a', { timeout: 8000 });
    const links = await page.$$eval('#weak-list a', (as) => as.map((a) => [a.textContent, a.getAttribute('href')]));
    check('9a: weak list shows only 3+ attempt, missed concepts, worst first',
      links.length === 2 && /· shaky$/.test(links[0][0]) && /· mid$/.test(links[1][0]) &&
      links[0][1] === `oksat-study.html?m=${SLUG}&c=shaky`, JSON.stringify(links));
    await context.close();
    const ctx2 = await browser.newContext();
    await ctx2.addInitScript(`try{localStorage.setItem('oksat:reviewer','${REVIEWER}');}catch(e){}`);
    const p2 = await ctx2.newPage();
    await p2.goto(base + '/oksat.html', { waitUntil: 'domcontentloaded' });
    await p2.waitForSelector('#modules .module-card', { timeout: 8000 });
    check('9b: weak list hidden with no data', await p2.$eval('#weak', (e) => e.hidden), 'visible without data');
    await ctx2.close();
  }

  /* ---- Case 10: export / clear / import round trip; malformed import writes nothing ---- */
  {
    const prog = JSON.stringify({ v: 1, answers: { q1: 'a' }, firstCorrect: { q1: false }, modes: { q1: 'mcq' } });
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addInitScript(`try{if(!sessionStorage.getItem('seeded')){localStorage.setItem('oksat:reviewer','${REVIEWER}');localStorage.setItem('${PROGRESS}',${JSON.stringify(prog)});sessionStorage.setItem('seeded','1');}}catch(e){}`);
    const page = await context.newPage();
    page.on('dialog', (d) => d.accept());
    await page.goto(base + '/oksat.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#modules .module-card', { timeout: 8000 });
    await page.click('#settings-btn');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-progress')]);
    const fs = await import('node:fs');
    const path = await dl.path();
    const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
    check('10a: export holds the progress record', exported[PROGRESS] === prog, JSON.stringify(Object.keys(exported)));
    await page.evaluate(() => localStorage.clear());
    await page.setInputFiles('#import-file', path);
    await page.waitForFunction((k) => localStorage.getItem(k), PROGRESS, { timeout: 5000 }).catch(() => {});
    check('10b: import restores the progress', await page.evaluate((k) => localStorage.getItem(k), PROGRESS) === prog, 'progress not restored');
    await page.waitForTimeout(1800); // the import reloads the hub
    await page.waitForSelector('#modules .module-card', { timeout: 8000 });
    await page.evaluate(() => localStorage.clear());
    await page.click('#settings-btn');
    const bad = [{ 'sk_theme': 'x' }, { 'oksat:x': 5 }, [1], 'nope'];
    for (const [i, b] of bad.entries()) {
      const f = `${path}.bad${i}.json`;
      fs.writeFileSync(f, JSON.stringify(b));
      await page.setInputFiles('#import-file', f);
      await page.waitForFunction(() => /Not an OKSAT/.test(document.querySelector('#backup-status').textContent), null, { timeout: 5000 }).catch(() => {});
      const st = await page.textContent('#backup-status');
      check(`10c${i}: malformed import rejected`, /Not an OKSAT/.test(st), st);
      await page.evaluate(() => { document.querySelector('#backup-status').textContent = ''; });
      fs.unlinkSync(f);
    }
    check('10d: malformed imports wrote nothing', await page.evaluate(() => localStorage.length) === 0, 'storage was written');
    await context.close();
  }

  await browser.close();
  if (server) await server.close();

  console.log('=== OKSAT engine behavior tests ===');
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + (r.detail || '')}`);
  console.log(`\n${failures ? 'FAILED' : 'OK'} — ${results.length - failures}/${results.length} checks passed.`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
