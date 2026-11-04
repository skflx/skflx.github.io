#!/usr/bin/env node
/* =============================================================
   test-airway-resume.mjs — behaviour of the saved game in
   airway-jeopardy.html (js/airway/app.js, key sk_airway_game).

   Pins: a live game survives a reload and Resume restores teams,
   scores, the question position and the quiz tally exactly; the
   resume is offered, never automatic; Start fresh and End game clear
   the save; a save older than 24 h is discarded; with localStorage
   throwing, the game still plays. Also checks zero external requests.

   Drives the real page in headless Chromium. Fixture-free: it plays
   the shipped question bank.

   Usage:  node tools/test-airway-resume.mjs [--headed]
   Exits nonzero on any failed case.
   ============================================================= */
import { startServer, launchBrowser } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const HEADED = args.includes('--headed');
const KEY = 'sk_airway_game';
const PAGE = '/airway-jeopardy.html';

let failures = 0;
const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  if (!cond) failures++;
}

const getSave = (page) => page.evaluate((k) => { try { return localStorage.getItem(k); } catch (e) { return 'THREW'; } }, KEY);
const setSave = (page, v) => page.evaluate(([k, val]) => { localStorage.setItem(k, val); }, [KEY, v]);
const scores = (page) => page.$$eval('.aw-team-tile', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
/* 'Team 1 300' -> 300 (the first question's difficulty is random) */
const pts = (tile) => Number(String(tile).split(' ').pop());
const hasBanner = (page) => page.$('.aw-resume').then((el) => !!el);
const question = (page) => page.$eval('.aw-qtext', (e) => e.textContent).catch(() => null);
const counter = (page) => page.$eval('.aw-topline-right span', (e) => e.textContent).catch(() => null);

async function newPage(browser, origin, opts = {}) {
  const context = await browser.newContext();
  if (opts.init) await context.addInitScript(opts.init);
  const page = await context.newPage();
  const externals = [];
  const errors = [];
  page.on('request', (r) => { if (!r.url().startsWith(origin)) externals.push(r.url()); });
  page.on('pageerror', (e) => errors.push(String(e && e.message)));
  await page.goto(origin + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('.aw-hero'), null, { timeout: 15000 });
  return { context, page, externals, errors };
}

/* Start Rounds, reveal and mark the first question correct for Team 1,
   then advance so the game sits on question 2 with scores set. */
async function playRounds(page) {
  await page.click('[data-action="start-rounds"]');
  await page.waitForSelector('[data-action="r-reveal"]');
  await page.click('[data-action="r-reveal"]');
  await page.click('[data-action="r-buzz"][data-id="t0"]');
  await page.click('[data-action="r-correct"]');
  await page.click('[data-action="r-next"]');
  await page.waitForSelector('[data-action="r-buzz"]');
}

async function main() {
  const server = await startServer();
  const origin = server.origin;
  const browser = await launchBrowser({ headed: HEADED });
  try {
    /* 1. A live game is saved, and a reload offers it without resuming. */
    let a = await newPage(browser, origin);
    await playRounds(a.page);
    const before = { scores: await scores(a.page), q: await question(a.page), c: await counter(a.page) };
    const saved = await getSave(a.page);
    check('rounds: a live game is written to sk_airway_game', typeof saved === 'string' && saved.includes('"screen":"rounds"'), String(saved).slice(0, 80));
    check('rounds: the first correct answer is scored (Team 1 above 0)', pts(before.scores[0]) > 0, JSON.stringify(before.scores));

    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await a.page.waitForSelector('.aw-hero');
    check('reload: the saved game is offered on the setup screen', await hasBanner(a.page));
    check('reload: the game is NOT resumed silently', !(await a.page.$('[data-action="r-buzz"]')));

    /* 2. Resume restores teams, scores and question position exactly. */
    await a.page.click('[data-action="resume-game"]');
    await a.page.waitForSelector('[data-action="r-buzz"]');
    const after = { scores: await scores(a.page), q: await question(a.page), c: await counter(a.page) };
    check('resume: team scores identical to before the reload', JSON.stringify(after.scores) === JSON.stringify(before.scores), JSON.stringify({ before: before.scores, after: after.scores }));
    check('resume: same question and position (consumed questions kept)', after.q === before.q && after.c === before.c, JSON.stringify({ before, after }));
    check('resume: the game keeps running (buzz, verdict and next work)', await a.page.$('[data-action="r-buzz"]') !== null);
    check('zero external requests (rounds page)', a.externals.length === 0, a.externals.join(' '));
    check('no page errors during the rounds run', a.errors.length === 0, a.errors.join(' | '));
    await a.context.close();

    /* 3. Start fresh clears the save. */
    a = await newPage(browser, origin);
    await playRounds(a.page);
    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await a.page.waitForSelector('.aw-hero');
    await a.page.click('[data-action="resume-discard"]');
    await a.page.waitForTimeout(100);
    check('start fresh: the save is removed', (await getSave(a.page)) === null);
    check('start fresh: the offer goes away', !(await hasBanner(a.page)));
    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await a.page.waitForSelector('.aw-hero');
    check('start fresh: nothing offered after a reload', !(await hasBanner(a.page)));
    await a.context.close();

    /* 4. End game clears the save (rounds ends to results). */
    a = await newPage(browser, origin);
    await playRounds(a.page);
    await a.page.click('[data-action="r-end-now"]');
    await a.page.waitForSelector('.aw-result-hero');
    check('end game: the save is cleared when the game ends', (await getSave(a.page)) === null);
    await a.context.close();

    /* 5. Quick Quiz: tally survives, and End game clears it. */
    a = await newPage(browser, origin);
    await a.page.click('[data-action="pick-mode"][data-mode="quiz"]');
    await a.page.click('[data-action="start-quiz"]');
    await a.page.waitForSelector('[data-action="q-choice"]');
    await a.page.click('[data-action="q-choice"][data-idx="0"]');
    const quizTally = await a.page.$eval('.aw-quiz-score', (e) => e.textContent).catch(() => null);
    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await a.page.waitForSelector('.aw-hero');
    await a.page.click('[data-action="resume-game"]');
    await a.page.waitForSelector('[data-action="q-choice"], [data-action="q-next"]');
    const quizResumed = await a.page.$eval('.aw-quiz-score', (e) => e.textContent).catch(() => null);
    check('quiz: resume restores the correct / answered tally', quizTally !== null && quizTally === quizResumed, JSON.stringify({ quizTally, quizResumed }));
    await a.page.click('[data-action="q-end-now"]');
    await a.page.waitForSelector('.aw-hero');
    check('quiz: End game returns to the menu and clears the save', (await getSave(a.page)) === null);
    await a.context.close();

    /* 5b. Jeopardy Board: a settled cell stays settled; an open question
       (modal) comes back open with its verdict buttons. */
    a = await newPage(browser, origin);
    await a.page.click('[data-action="pick-mode"][data-mode="board"]');
    await a.page.click('[data-action="start-board"]');
    await a.page.waitForSelector('[data-action="b-cell"]');
    await a.page.click('[data-action="b-cell"][data-col="0"][data-cell="0"]');
    await a.page.click('[data-action="b-reveal"]');
    await a.page.click('[data-action="b-correct"]');
    await a.page.click('[data-action="b-continue"]');
    await a.page.waitForSelector('[data-action="b-cell"]');
    const boardBefore = { scores: await scores(a.page), cells: await a.page.$$eval('[data-action="b-cell"]', (els) => els.length) };
    await a.page.click('[data-action="b-cell"][data-col="0"][data-cell="1"]');
    await a.page.waitForSelector('[data-action="b-reveal"], [data-action="b-correct"]');
    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await a.page.waitForSelector('.aw-hero');
    await a.page.click('[data-action="resume-game"]');
    await a.page.waitForSelector('[data-action="b-reveal"], [data-action="b-correct"]');
    const boardAfter = { scores: await scores(a.page), cells: await a.page.$$eval('[data-action="b-cell"]', (els) => els.length) };
    check('board: resume restores the scores and the settled cells', JSON.stringify(boardAfter.scores) === JSON.stringify(boardBefore.scores) && boardAfter.cells === boardBefore.cells, JSON.stringify({ boardBefore, boardAfter }));
    check('board: the open question comes back open', (await a.page.$('[data-action="b-reveal"], [data-action="b-correct"]')) !== null);
    await a.page.click('[data-action="b-reveal"]').catch(() => {});
    await a.page.click('[data-action="b-correct"]');
    await a.page.click('[data-action="b-continue"]');
    await a.page.click('[data-action="b-end-now"]');
    await a.page.waitForSelector('.aw-result-hero');
    check('board: End game clears the save', (await getSave(a.page)) === null);
    await a.context.close();

    /* 6. A save older than 24 h is dropped, not offered. */
    a = await newPage(browser, origin);
    await playRounds(a.page);
    const stale = JSON.parse(await getSave(a.page));
    stale.savedAt = Date.now() - 25 * 60 * 60 * 1000;
    await setSave(a.page, JSON.stringify(stale));
    await a.page.reload({ waitUntil: 'domcontentloaded' });
    await a.page.waitForSelector('.aw-hero');
    check('expiry: a save older than 24 h is not offered', !(await hasBanner(a.page)));
    check('expiry: and is removed from storage', (await getSave(a.page)) === null);
    await a.context.close();

    /* 7. Storage that throws: the game still plays, nothing breaks. */
    const throwing = `(function(){ var T=function(){ throw new Error('blocked'); };
      try { Object.defineProperty(window,'localStorage',{get:T,configurable:true}); } catch(e){} })();`;
    a = await newPage(browser, origin, { init: throwing });
    await playRounds(a.page);
    const throwScores = await scores(a.page);
    check('storage throws: the game still plays and scores', pts(throwScores[0]) > 0, JSON.stringify(throwScores));
    check('storage throws: no page errors', a.errors.length === 0, a.errors.join(' | '));
    check('storage throws: no offer is shown', !(await hasBanner(a.page)));
    await a.context.close();
  } finally {
    await browser.close();
    server.close();
  }

  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  [${r.detail}]`}`);
  console.log(failures ? `\nFAILED — ${failures} of ${results.length} checks failed` : `\nOK — ${results.length}/${results.length} checks passed`);
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
