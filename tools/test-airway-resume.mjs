#!/usr/bin/env node
/* =============================================================
   test-airway-resume.mjs — behaviour of the saved games in
   airway-jeopardy.html (js/airway/app.js, key sk_airway_games).

   Pins: each tab keeps its own unfinished game under its tab id
   (sk_airway_tab, per tab); two tabs in one browser never overwrite
   each other; the setup banner lists every usable save (under 24 h)
   and never resumes one silently; Resume restores teams, scores, the
   question position and the quiz tally exactly and touches no other
   entry; Start fresh and End game clear only this tab's entry; the
   map keeps at most 5 saves; with storage throwing, the game still
   plays. Also checks zero external requests.

   Runs the whole suite at two sizes: desktop 1280x800, and phone
   390x844 (isMobile, deviceScaleFactor 2), where the banner and game
   screens must not scroll sideways and every Resume / Start fresh
   button is at least 44x44 CSS px.

   Drives the real page in headless Chromium. Fixture-free: it plays
   the shipped question bank.

   Usage:  node tools/test-airway-resume.mjs [--headed] [--shot=<png path>]
   --shot saves the phone-width banner (two tabs listed) as a PNG.
   Exits nonzero on any failed case.
   ============================================================= */
import { startServer, launchBrowser } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const HEADED = args.includes('--headed');
const SHOT = (args.find((a) => a.startsWith('--shot=')) || '').slice('--shot='.length) || null;
const SAVES = 'sk_airway_games';
const TABKEY = 'sk_airway_tab';
const PAGE = '/airway-jeopardy.html';

const SIZES = [
  { name: 'desktop 1280x800', ctx: { viewport: { width: 1280, height: 800 } } },
  { name: 'phone 390x844', ctx: { viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 } },
];

let failures = 0;
const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  if (!cond) failures++;
}

/* ---- storage probes (read through the page, as the player sees it) ---- */
const getRaw = (page, key) => page.evaluate((k) => { try { return localStorage.getItem(k); } catch (e) { return 'THREW'; } }, key);
const setRaw = (page, key, v) => page.evaluate(([k, val]) => { localStorage.setItem(k, val); }, [key, v]);
const tabIdOf = (page) => page.evaluate((k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, TABKEY);
async function saves(page) {
  const raw = await getRaw(page, SAVES);
  return raw && raw !== 'THREW' ? JSON.parse(raw) : null;
}
async function setSaves(page, map) { await setRaw(page, SAVES, JSON.stringify(map)); }
async function own(page) {
  const m = await saves(page);
  const id = await tabIdOf(page);
  return m && id && m[id] ? m[id] : null;
}

/* ---- the game, as the player sees it ---- */
const scores = (page) => page.$$eval('.aw-team-tile', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
/* 'Team 1 300' -> 300 (the first question's difficulty is random) */
const pts = (tile) => Number(String(tile).split(' ').pop());
const hasBanner = (page) => page.$('.aw-resume').then((el) => !!el);
const bannerRows = (page) => page.$$eval('.aw-resume-row', (rs) => rs.map((r) => ({ text: r.innerText.replace(/\s+/g, ' ').trim(), mine: r.classList.contains('is-this-tab') })));
const question = (page) => page.$eval('.aw-qtext', (e) => e.textContent).catch(() => null);
const counter = (page) => page.$eval('.aw-topline-right span', (e) => e.textContent).catch(() => null);
const snapshot = async (page) => ({ scores: await scores(page), q: await question(page), c: await counter(page) });
async function resumeOwn(page) {
  const id = await tabIdOf(page);
  await page.click(`[data-action="resume-game"][data-id="${id}"]`);
}

async function openPage(context, origin) {
  const page = await context.newPage();
  const externals = [];
  const errors = [];
  page.on('request', (r) => { if (!r.url().startsWith(origin)) externals.push(r.url()); });
  page.on('pageerror', (e) => errors.push(String(e && e.message)));
  await page.goto(origin + PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('.aw-hero'), null, { timeout: 15000 });
  return { page, externals, errors };
}
async function reloadPage(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.aw-hero');
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

/* Layout at the current viewport: no sideways scroll, and when a banner
   is shown, each Resume / Start fresh button is at least 44x44 CSS px. */
async function layout(page) {
  const fits = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  const boxes = await page.$$eval('.aw-resume [data-action]', (els) => els.map((e) => {
    const r = e.getBoundingClientRect();
    return { action: e.dataset.action, w: Math.round(r.width), h: Math.round(r.height) };
  }));
  return { fits: fits.sw <= fits.iw, scroll: fits, boxes, small: boxes.filter((b) => b.w < 44 || b.h < 44) };
}

async function runSize(browser, origin, size) {
  const T = (name, cond, detail) => check(`[${size.name}] ${name}`, cond, detail);
  const phone = size.name.startsWith('phone');

  /* 1. A live game is saved under this tab; a reload offers it without resuming. */
  let a = await (async () => {
    const context = await browser.newContext(size.ctx);
    const p = await openPage(context, origin);
    return { context, ...p };
  })();
  const tabA = await tabIdOf(a.page);
  await playRounds(a.page);
  const before = await snapshot(a.page);
  const ownA = await own(a.page);
  T('rounds: a live game is saved under this tab', !!ownA && ownA.state.screen === 'rounds' && /^Rounds, round \d+, teams /.test(ownA.label), JSON.stringify(ownA && ownA.label));
  T('tab: the id is 6 lowercase letters or digits', /^[a-z0-9]{6}$/.test(tabA || ''), String(tabA));
  T('rounds: the first correct answer is scored (Team 1 above 0)', pts(before.scores[0]) > 0, JSON.stringify(before.scores));

  await reloadPage(a.page);
  T('reload: the saved game is offered on the setup screen', await hasBanner(a.page));
  T('reload: the game is NOT resumed silently', !(await a.page.$('[data-action="r-buzz"]')));
  const rows1 = await bannerRows(a.page);
  T('reload: this tab\'s entry is listed and marked', rows1.length === 1 && rows1[0].mine && rows1[0].text.includes('Tab ' + tabA) && rows1[0].text.includes('this tab'), JSON.stringify(rows1));
  const lay1 = await layout(a.page);
  T('banner: no sideways scroll', lay1.fits, JSON.stringify(lay1.scroll));
  T('banner: Resume / Start fresh are at least 44x44', lay1.boxes.length === 2 && lay1.small.length === 0, JSON.stringify(lay1.boxes));

  /* Resume restores teams, scores and question position exactly. */
  await resumeOwn(a.page);
  await a.page.waitForSelector('[data-action="r-buzz"]');
  const after = await snapshot(a.page);
  T('resume: team scores identical to before the reload', JSON.stringify(after.scores) === JSON.stringify(before.scores), JSON.stringify({ before: before.scores, after: after.scores }));
  T('resume: same question and position (consumed questions kept)', after.q === before.q && after.c === before.c, JSON.stringify({ before, after }));
  T('resume: the game keeps running (buzz, verdict and next work)', (await a.page.$('[data-action="r-buzz"]')) !== null);
  const lay2 = await layout(a.page);
  T('rounds game: no sideways scroll', lay2.fits, JSON.stringify(lay2.scroll));
  T('zero external requests (rounds page)', a.externals.length === 0, a.externals.join(' '));
  T('no page errors during the rounds run', a.errors.length === 0, a.errors.join(' | '));
  await a.context.close();

  /* 2. Two tabs in one browser context: separate tab ids, both listed,
     Resume on tab B restores B exactly and leaves A's entry alone. */
  const ctx = await browser.newContext(size.ctx);
  const A = await openPage(ctx, origin);
  const tabA2 = await tabIdOf(A.page);
  await playRounds(A.page);
  const B = await openPage(ctx, origin);
  const tabB = await tabIdOf(B.page);
  await playRounds(B.page);
  /* B goes one question further, so its scores differ from A's. */
  await B.page.click('[data-action="r-buzz"][data-id="t1"]');
  await B.page.click('[data-action="r-correct"]');
  await B.page.click('[data-action="r-next"]');
  await B.page.waitForSelector('[data-action="r-buzz"]');
  const bBefore = await snapshot(B.page);
  const aEntryBefore = JSON.stringify((await saves(B.page))[tabA2]);

  T('two tabs: each tab gets its own id', !!tabA2 && !!tabB && tabA2 !== tabB, `${tabA2} / ${tabB}`);
  await reloadPage(B.page);
  const rows2 = await bannerRows(B.page);
  T('two tabs: both saves are listed', rows2.length === 2 && rows2.some((r) => r.text.includes('Tab ' + tabA2)) && rows2.some((r) => r.text.includes('Tab ' + tabB)), JSON.stringify(rows2));
  T('two tabs: only this tab (B) is marked', rows2.filter((r) => r.mine).length === 1 && rows2.some((r) => r.mine && r.text.includes('Tab ' + tabB)), JSON.stringify(rows2));
  const lay3 = await layout(B.page);
  T('two tabs banner: no sideways scroll', lay3.fits, JSON.stringify(lay3.scroll));
  T('two tabs banner: Resume / Start fresh are at least 44x44', lay3.boxes.length === 3 && lay3.small.length === 0, JSON.stringify(lay3.boxes));
  if (phone && SHOT) {
    await B.page.screenshot({ path: SHOT, fullPage: true });
    console.log(`  shot  ${SHOT}`);
  }

  await resumeOwn(B.page);
  await B.page.waitForSelector('[data-action="r-buzz"]');
  const bAfter = await snapshot(B.page);
  T('two tabs: resume on tab B restores B\'s scores and question exactly', JSON.stringify(bAfter) === JSON.stringify(bBefore), JSON.stringify({ bBefore, bAfter }));
  T('two tabs: resume leaves tab A\'s entry byte-identical', JSON.stringify((await saves(B.page))[tabA2]) === aEntryBefore);

  /* Start fresh in tab A clears only A; B's entry is still listed. */
  await reloadPage(A.page);
  const rowsA = await bannerRows(A.page);
  T('two tabs: tab A lists both saves and marks itself', rowsA.length === 2 && rowsA.some((r) => r.mine && r.text.includes('Tab ' + tabA2)), JSON.stringify(rowsA));
  await A.page.click('[data-action="resume-discard"]');
  const mA = await saves(A.page);
  T('start fresh (tab A): removes only tab A\'s entry', !!mA && !(tabA2 in mA) && (tabB in mA), JSON.stringify(mA && Object.keys(mA)));
  const rowsA2 = await bannerRows(A.page);
  T('start fresh (tab A): the other tab\'s save is still listed', rowsA2.length === 1 && rowsA2[0].text.includes('Tab ' + tabB), JSON.stringify(rowsA2));
  T('two tabs: no page errors', A.errors.length === 0 && B.errors.length === 0, [...A.errors, ...B.errors].join(' | '));
  T('zero external requests (two tabs)', A.externals.length === 0 && B.externals.length === 0, [...A.externals, ...B.externals].join(' '));
  await ctx.close();

  /* 3. Start fresh clears this tab's save (single tab). */
  a = await (async () => { const context = await browser.newContext(size.ctx); return { context, ...(await openPage(context, origin)) }; })();
  await playRounds(a.page);
  await reloadPage(a.page);
  await a.page.click('[data-action="resume-discard"]');
  T('start fresh: this tab\'s save is removed', (await own(a.page)) === null);
  T('start fresh: the offer goes away', !(await hasBanner(a.page)));
  await reloadPage(a.page);
  T('start fresh: nothing offered after a reload', !(await hasBanner(a.page)));
  await a.context.close();

  /* 4. End game clears this tab's save (rounds ends to results). */
  a = await (async () => { const context = await browser.newContext(size.ctx); return { context, ...(await openPage(context, origin)) }; })();
  await playRounds(a.page);
  await a.page.click('[data-action="r-end-now"]');
  await a.page.waitForSelector('.aw-result-hero');
  T('end game: this tab\'s save is cleared when the game ends', (await own(a.page)) === null);
  await a.context.close();

  /* 5. Quick Quiz: tally survives, and End game clears it. */
  a = await (async () => { const context = await browser.newContext(size.ctx); return { context, ...(await openPage(context, origin)) }; })();
  await a.page.click('[data-action="pick-mode"][data-mode="quiz"]');
  await a.page.click('[data-action="start-quiz"]');
  await a.page.waitForSelector('[data-action="q-choice"]');
  await a.page.click('[data-action="q-choice"][data-idx="0"]');
  const quizTally = await a.page.$eval('.aw-quiz-score', (e) => e.textContent).catch(() => null);
  await reloadPage(a.page);
  await resumeOwn(a.page);
  await a.page.waitForSelector('[data-action="q-choice"], [data-action="q-next"]');
  const quizResumed = await a.page.$eval('.aw-quiz-score', (e) => e.textContent).catch(() => null);
  T('quiz: resume restores the correct / answered tally', quizTally !== null && quizTally === quizResumed, JSON.stringify({ quizTally, quizResumed }));
  const layQ = await layout(a.page);
  T('quiz game: no sideways scroll', layQ.fits, JSON.stringify(layQ.scroll));
  await a.page.click('[data-action="q-end-now"]');
  await a.page.waitForSelector('.aw-hero');
  T('quiz: End game returns to the menu and clears this tab\'s save', (await own(a.page)) === null);
  await a.context.close();

  /* 5b. Jeopardy Board: a settled cell stays settled; an open question
     (modal) comes back open with its verdict buttons. */
  a = await (async () => { const context = await browser.newContext(size.ctx); return { context, ...(await openPage(context, origin)) }; })();
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
  await reloadPage(a.page);
  await resumeOwn(a.page);
  await a.page.waitForSelector('[data-action="b-reveal"], [data-action="b-correct"]');
  const boardAfter = { scores: await scores(a.page), cells: await a.page.$$eval('[data-action="b-cell"]', (els) => els.length) };
  T('board: resume restores the scores and the settled cells', JSON.stringify(boardAfter.scores) === JSON.stringify(boardBefore.scores) && boardAfter.cells === boardBefore.cells, JSON.stringify({ boardBefore, boardAfter }));
  T('board: the open question comes back open', (await a.page.$('[data-action="b-reveal"], [data-action="b-correct"]')) !== null);
  const layB = await layout(a.page);
  T('board game: no sideways scroll', layB.fits, JSON.stringify(layB.scroll));
  await a.page.click('[data-action="b-reveal"]').catch(() => {});
  await a.page.click('[data-action="b-correct"]');
  await a.page.click('[data-action="b-continue"]');
  await a.page.click('[data-action="b-end-now"]');
  await a.page.waitForSelector('.aw-result-hero');
  T('board: End game clears this tab\'s save', (await own(a.page)) === null);
  await a.context.close();

  /* 6. A save older than 24 h is dropped at boot, not offered. */
  a = await (async () => { const context = await browser.newContext(size.ctx); return { context, ...(await openPage(context, origin)) }; })();
  await playRounds(a.page);
  const stale = await saves(a.page);
  const staleId = await tabIdOf(a.page);
  stale[staleId].savedAt = Date.now() - 25 * 60 * 60 * 1000;
  await setSaves(a.page, stale);
  await reloadPage(a.page);
  T('expiry: a save older than 24 h is not offered', !(await hasBanner(a.page)));
  T('expiry: and is removed from storage', !((await saves(a.page)) || {})[staleId]);
  await a.context.close();

  /* 7. The map keeps at most 5 saves: the oldest by savedAt is dropped. */
  a = await (async () => { const context = await browser.newContext(size.ctx); return { context, ...(await openPage(context, origin)) }; })();
  await a.page.evaluate(([k]) => {
    var now = Date.now(), m = {};
    for (var i = 0; i < 5; i++) m['zz0' + i + 'aa'] = { savedAt: now - (i + 1) * 3600e3, label: 'filler', state: { v: 1, screen: 'rounds', mode: 'rounds', game: {} } };
    localStorage.setItem(k, JSON.stringify(m));
  }, [SAVES]);
  await reloadPage(a.page);
  await playRounds(a.page);
  const capped = await saves(a.page);
  const capId = await tabIdOf(a.page);
  T('cap: at most 5 saves are kept', !!capped && Object.keys(capped).length === 5, JSON.stringify(capped && Object.keys(capped)));
  T('cap: this tab\'s save is kept and the oldest (zz04aa) is dropped', !!capped && !!capped[capId] && !('zz04aa' in capped), JSON.stringify(capped && Object.keys(capped)));
  await a.context.close();

  /* 8. Storage that throws: the game still plays, nothing breaks. */
  const throwingLocal = `(function(){ var T=function(){ throw new Error('blocked'); };
    try { Object.defineProperty(window,'localStorage',{get:T,configurable:true}); } catch(e){} })();`;
  a = await (async () => { const context = await browser.newContext(size.ctx); await context.addInitScript(throwingLocal); return { context, ...(await openPage(context, origin)) }; })();
  await playRounds(a.page);
  const throwScores = await scores(a.page);
  T('storage throws: the game still plays and scores', pts(throwScores[0]) > 0, JSON.stringify(throwScores));
  T('storage throws: no page errors', a.errors.length === 0, a.errors.join(' | '));
  T('storage throws: no offer is shown', !(await hasBanner(a.page)));
  await a.context.close();

  /* 9b. sessionStorage throws: no tab id can be kept, the game still plays. */
  const throwingSession = `(function(){ var T=function(){ throw new Error('blocked'); };
    try { Object.defineProperty(window,'sessionStorage',{get:T,configurable:true}); } catch(e){} })();`;
  a = await (async () => { const context = await browser.newContext(size.ctx); await context.addInitScript(throwingSession); return { context, ...(await openPage(context, origin)) }; })();
  await playRounds(a.page);
  const sessScores = await scores(a.page);
  T('sessionStorage throws: the game still plays and scores', pts(sessScores[0]) > 0, JSON.stringify(sessScores));
  T('sessionStorage throws: no page errors', a.errors.length === 0, a.errors.join(' | '));
  await a.context.close();
}

async function main() {
  const server = await startServer();
  const origin = server.origin;
  const browser = await launchBrowser({ headed: HEADED });
  try {
    for (const size of SIZES) await runSize(browser, origin, size);
  } finally {
    await browser.close();
    server.close();
  }

  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  [${r.detail}]`}`);
  console.log(failures ? `\nFAILED — ${failures} of ${results.length} checks failed` : `\nOK — ${results.length}/${results.length} checks passed`);
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
