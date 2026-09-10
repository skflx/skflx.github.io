#!/usr/bin/env node
/* =============================================================
   test-oksat-engine.mjs — behavior tests for js/oksat-engine.js,
   the highest-regression-risk code in the repo (5 modules depend on
   it; ItemView is closure-private by design — never export it).

   Drives oksat-study.html?m=pediatrics in headless Chromium. Needs a
   real browser + the page's CDN (React/htm) — same constraint as the
   smoke harness; in CI the CDN is reachable.

   ---- Engine contract this pins (read js/oksat-engine.js to confirm) ----
   Storage keys, namespace normalized lowercase-alnum and resolved by
   OKSATStore.reviewer() from localStorage 'oksat:reviewer' (default
   'guest' — there is no prompt):
     oksat:progress:<slug>:<reviewer> = { v:1, answers:{qId:optId},
                                          firstCorrect:{qId:bool}, updated }
     oksat:srs:<slug>:<reviewer>      = { v:1, items:{qId:{box,nextReview}}, updated }
   An MCQ option button renders the option id uppercased in a fixed-width
   leading cell; the button is disabled once answered (first-attempt lock,
   recordAnswer() early-returns if answers[qId] exists).
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

/* Click "Begin", landing on the first item's options. */
async function begin(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Begin|Continue/.test(b.textContent)), null, { timeout: 8000 });
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Begin|Continue/.test(x.textContent)); b && b.click(); });
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
    // press '1' selects option 1 (id 'a') and locks it
    await page.keyboard.press('1');
    await page.waitForTimeout(300);
    const prog = await ls(page, PROGRESS);
    const id0 = prog && prog.answers && Object.keys(prog.answers)[0];
    check('3a: key "1" selects option a', id0 && prog.answers[id0] === 'a', `answers=${JSON.stringify(prog && prog.answers)}`);
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
    // seed a legacy key BEFORE any script runs; oksat-store.js should copy it to oksat:*
    const seed = `try{localStorage.setItem('mcq:legacyprobe','hello');}catch(e){}`;
    const { context, page } = await openStudy(browser, base, seed);
    const migrated = await page.evaluate(() => { try { return localStorage.getItem('oksat:legacyprobe'); } catch (e) { return null; } });
    check('4: legacy mcq:* migrated to oksat:*', migrated === 'hello', `oksat:legacyprobe=${migrated}`);
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
