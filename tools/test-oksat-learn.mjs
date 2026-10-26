#!/usr/bin/env node
/* =============================================================
   test-oksat-learn.mjs — behavior tests for the Interactive learning
   viewer (oksat-learn.html + js/oksat-learn.js) and its hub segment.

   Drives the AR · CRS · AERD guide in headless Chromium. Pins:
     - storage: oksat:learn:<slug>:<reviewer> = { v:1, done:{'<chapter>/<section>':1},
       checks:{'<chapter>/<section>:<id>': grade 0-3}, practice:{'<module>:<item>':{a|g, ok}},
       ui:{mode:'scroll'|'step', core:bool, last:<view>} }
     - predict-then-reveal: the typed answer is echoed back and never stored
     - the checkers evaluate their declared rules
     - module questions render inline by reference and lock on the first answer
     - drill links carry the module and concept, with a live count
     - step / scroll, core-only, deep links, flashcards and the pearl wall
     - untrusted input (?g=, ?c=, the hash) is only ever matched against known ids
     - the hub shows the guide card and its progress
     - lexicon terms (js/oksat-terms.js) are marked; hover, focus and tap show the full name

   Usage:  node tools/test-oksat-learn.mjs [--base <url>] [--headed]
   Exits nonzero on any failed case.
   ============================================================= */
import { startServer, launchBrowser, collectErrors } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const HEADED = args.includes('--headed');
const REVIEWER = 'smoke';
const SLUG = 'ar-crs-aerd';
const KEY = `oksat:learn:${SLUG}:${REVIEWER}`;

let failures = 0;
const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail });
  if (!cond) failures++;
}
const ls = (page, key) => page.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, key);

async function open(browser, base, url, seed) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(`try{localStorage.setItem('oksat:reviewer','${REVIEWER}');}catch(e){}`);
  if (seed) await context.addInitScript(seed);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(base + '/' + url, { waitUntil: 'domcontentloaded' });
  return { context, page, errors };
}
const chapterReady = (page) => page.waitForFunction(() => document.querySelector('.lr-chapter .lr-sec, .lr-chapter .lr-card'), null, { timeout: 12000 });

async function main() {
  let server = null;
  let base = BASE;
  if (!base) { server = await startServer(); base = server.origin; }
  const browser = await launchBrowser({ headed: HEADED });

  /* ---- 1: chapter renders; predict-then-reveal; grade; done; persistence ---- */
  {
    const { context, page, errors } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=science`);
    await chapterReady(page);
    const n = await page.$$eval('.lr-chapter .lr-sec', (e) => e.length);
    const rail = await page.$$eval('.lr-nav', (e) => e.length);
    check('1a: science chapter renders its 10 sections', n === 10, `sections=${n}`);
    check('1b: rail lists 11 chapters plus flashcards and pearls', rail === 13, `rail=${rail}`);
    check('1c: the 30-second summary renders with inline bold as <strong>', await page.$eval('.lr-tldr strong', (e) => e.textContent.length > 0));
    check('1d: no raw ** or [[ ]] markup reaches the page', await page.evaluate(() => !/\*\*|\[\[|\]\]/.test(document.querySelector('.lr-chapter').textContent)));

    await page.fill('#sci-1 .lr-q-input', 'my private guess');
    await page.click('#sci-1 .lr-reveal');
    check('1e: reveal echoes the typed answer and shows the model answer', await page.$eval('#sci-1 .lr-q-answer', (e) => !e.hidden && /my private guess/.test(e.textContent) && /Model answer/.test(e.textContent)));
    await page.keyboard.press('4');                                 // "Knew it cold"
    await page.waitForTimeout(200);
    let rec = await ls(page, KEY);
    check('1f: key 4 grades the prompt (stored as 3)', rec && rec.checks && rec.checks['science/sci-1:c1'] === 3, JSON.stringify(rec && rec.checks));
    check('1g: the typed answer is never stored', !JSON.stringify(rec).includes('my private guess'));
    check('1h: the section hint counts graded prompts', await page.$eval('#sci-1 .lr-hint', (e) => /1 of 2 prompts graded/.test(e.textContent)));

    await page.click('#sci-1 .lr-mark');
    rec = await ls(page, KEY);
    check('1i: Mark section done is stored', rec.done['science/sci-1'] === 1, JSON.stringify(rec.done));
    check('1j: the rail and the section dot reflect it', await page.evaluate(() => /10%/.test(document.querySelector('.lr-nav[data-view="science"] .lr-nav-pct').textContent) && document.querySelector('.lr-dot[data-sec="sci-1"]').classList.contains('is-done')));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await chapterReady(page);
    check('1k: progress survives a reload', await page.evaluate(() => document.querySelector('#sci-1 .lr-mark').getAttribute('aria-pressed') === 'true' && document.querySelector('#sci-1 .lr-q').classList.contains('is-graded')));
    await page.waitForFunction(() => [...document.querySelectorAll('#sci-1 .lr-drill-link')].every((l) => /\(\d+\)$/.test(l.textContent)), null, { timeout: 12000 });
    check('1l: drill links from two different modules both load (each module in its own frame)', (await page.$$eval('#sci-1 .lr-drill-link', (e) => e.length)) === 2);
    check('1m: no console errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  /* ---- 2: core-only and step mode, both persisted ---- */
  {
    const { context, page } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=science`);
    await chapterReady(page);
    const vis = () => page.$$eval('.lr-deep--go', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
    const before = await vis();
    await page.click('.lr-core');
    const after = await vis();
    check('2a: Core only hides every "Go deeper" block', before > 0 && after === 0, `before=${before} after=${after}`);
    check('2b: the choice persists', (await ls(page, KEY)).ui.core === true);

    await page.click('.lr-mode[data-mode="step"]');
    await page.waitForTimeout(150);
    const shown = () => page.$$eval('.lr-chapter .lr-sec', (e) => e.filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.id));
    check('2c: Step shows exactly one section', (await shown()).join() === 'sci-1', (await shown()).join());
    await page.click('.lr-stepbar [data-step="1"]');
    check('2d: Next advances one section', (await shown()).join() === 'sci-2', (await shown()).join());
    await page.keyboard.press('ArrowRight');
    check('2e: the arrow key advances too', (await shown()).join() === 'sci-3', (await shown()).join());
    await page.keyboard.press('ArrowLeft');
    check('2f: and goes back', (await shown()).join() === 'sci-2', (await shown()).join());
    check('2g: mode persists', (await ls(page, KEY)).ui.mode === 'step');
    await page.click('.lr-mode[data-mode="scroll"]');
    check('2h: Scroll shows every section again', (await shown()).length === 10);
    await context.close();
  }

  /* ---- 3: checkers evaluate their rules ---- */
  {
    const { context, page } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=ars`);
    await chapterReady(page);
    const out = () => page.$eval('#rs-2 .lr-tool-out', (e) => e.textContent);
    check('3a: ABRS with none ticked advises against antibiotics', /0 of 5 present\. Fewer than 3/.test(await out()), await out());
    await page.check('#tool-abrs-0'); await page.check('#tool-abrs-2'); await page.check('#tool-abrs-4');
    check('3b: three criteria make ABRS likely', /3 of 5 present\. ABRS likely/.test(await out()), await out());
    await page.goto(base + `/oksat-learn.html?g=${SLUG}&c=crs`, { waitUntil: 'domcontentloaded' });
    await chapterReady(page);
    const essOut = () => page.$eval('#crs-5 .lr-tool-out', (e) => e.textContent);
    await page.check('#tool-ess-0'); await page.check('#tool-ess-1'); await page.check('#tool-ess-2');
    check('3c: ESS with three of four reads "1 criterion missing" (singular)', /^1 criterion missing/.test(await essOut()), await essOut());
    await page.check('#tool-ess-3');
    check('3d: all four make ESS appropriate', /appropriate option/.test(await essOut()), await essOut());
    await context.close();
  }
  {
    const { context, page } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=biologics`);
    await chapterReady(page);
    const bio = () => page.$eval('#bi-3 .lr-tool:nth-of-type(1) .lr-tool-out', (e) => e.textContent).catch(() => '');
    const tools = await page.$$eval('#bi-3 .lr-tool', (e) => e.length);
    check('3e: biologics chapter has both the eligibility and response tools', tools === 2, `tools=${tools}`);
    const outs = () => page.$$eval('#bi-3 .lr-tool-out', (e) => e.map((x) => x.textContent));
    await page.check('#tool-bio-0'); await page.check('#tool-bio-1'); await page.check('#tool-bio-2');
    check('3f: three criteria without the prerequisite is not eligible', /Prerequisite missing/.test((await outs())[0]), (await outs())[0]);
    await page.check('#tool-bio-pre');
    check('3g: with the prerequisite, three criteria are indicated', /indicated per EPOS 2020/.test((await outs())[0]), (await outs())[0]);
    for (let i = 0; i < 3; i++) await page.check(`#tool-resp-${i}`);
    check('3h: three response domains grade as moderate', /Moderate response \(3\/5\)/.test((await outs())[1]), (await outs())[1]);
    void bio;
    await context.close();
  }

  /* ---- 4: module questions inline, drill links ---- */
  {
    const { context, page, errors } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=ars`);
    await chapterReady(page);
    await page.waitForSelector('#rs-4 .lr-item .lr-reveal', { timeout: 10000 });
    check('4a: module questions load into the section by reference', (await page.$$eval('#rs-4 .lr-item', (e) => e.length)) === 2);
    await page.click('#rs-4 .lr-item:first-of-type .lr-reveal');
    check('4b: Show the choices opens the radiogroup', await page.$eval('#rs-4 .lr-item .lr-options', (e) => !e.hidden && e.querySelectorAll('button').length === 4));
    await page.click('#rs-4 .lr-item .lr-option:nth-child(2)');       // a deliberate wrong pick (correct is stage 3)
    await page.waitForTimeout(150);
    const state = await page.$eval('#rs-4 .lr-item', (e) => ({
      locked: [...e.querySelectorAll('.lr-option')].every((b) => b.disabled),
      right: e.querySelectorAll('.lr-option.is-right').length, wrong: e.querySelectorAll('.lr-option.is-wrong').length,
      verdict: e.querySelector('.lr-verdict').textContent,
    }));
    check('4c: the answer locks and marks right and wrong', state.locked && state.right === 1 && state.wrong === 1 && /Not quite/.test(state.verdict), JSON.stringify(state));
    const rec = await ls(page, KEY);
    check('4d: the attempt is stored under the module reference', rec.practice['crs-ars:q8'] && rec.practice['crs-ars:q8'].a === 'b' && rec.practice['crs-ars:q8'].ok === false, JSON.stringify(rec.practice));
    const modRec = await ls(page, `oksat:progress:crs-ars:${REVIEWER}`);
    check('4e: the module\'s own progress and SRS are untouched', modRec === null && (await ls(page, `oksat:srs:crs-ars:${REVIEWER}`)) === null);
    const links = await page.$$eval('#rs-4 .lr-drill-link', (a) => a.map((x) => ({ href: x.getAttribute('href'), t: x.textContent })));
    check('4f: drill links point at the module and concept', links.some((l) => l.href === 'oksat-study.html?m=crs-ars&c=chandler'), JSON.stringify(links));
    check('4g: drill links show a live question count', links.every((l) => /\(\d+\)$/.test(l.t)), JSON.stringify(links));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await chapterReady(page);
    await page.waitForSelector('#rs-4 .lr-item .lr-option', { timeout: 10000 });
    check('4h: a locked answer restores locked after reload', await page.$eval('#rs-4 .lr-item', (e) => [...e.querySelectorAll('.lr-option')].every((b) => b.disabled) && !!e.querySelector('.lr-verdict')));
    check('4i: no console errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  /* ---- 5: deep links ---- */
  {
    const { context, page } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=aerd#ae-3`);
    await chapterReady(page);
    await page.waitForTimeout(900);
    const top = await page.$eval('#ae-3', (e) => e.getBoundingClientRect().top);
    check('5a: a section deep link scrolls to the section', top < 200 && top > -50, `top=${top}`);
    await context.close();
    const s = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=aerd#ae-3`, `try{localStorage.setItem('${KEY}',JSON.stringify({v:1,ui:{mode:'step'}}));}catch(e){}`);
    await chapterReady(s.page);
    await s.page.waitForTimeout(300);
    const shown = await s.page.$$eval('.lr-chapter .lr-sec', (e) => e.filter((x) => getComputedStyle(x).display !== 'none').map((x) => x.id));
    check('5b: in Step mode a deep link opens that section', shown.join() === 'ae-3', shown.join());
    await s.context.close();
  }

  /* ---- 6: flashcards and pearls ---- */
  {
    const { context, page, errors } = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=deck`);
    await page.waitForSelector('.lr-deck .lr-q', { timeout: 20000 });
    const label = await page.$eval('.lr-stage .lr-label', (e) => e.textContent);
    check('6a: the deck loads every chapter\'s prompts', /\/ 82$/.test(label), label);
    await page.click('.lr-stage .lr-reveal');
    await page.keyboard.press('3');
    await page.waitForTimeout(200);
    const rec = await ls(page, KEY);
    check('6b: grading a card writes the same record as the section prompt', rec && Object.keys(rec.checks).length === 1 && Object.values(rec.checks)[0] === 2, JSON.stringify(rec && rec.checks));
    await page.click('.lr-seg .lr-chipbtn:nth-child(3)');             // Weak
    check('6c: the Weak filter holds nothing above "partially"', await page.$eval('.lr-stage', (e) => /No weak cards/.test(e.textContent)));
    await page.goto(base + `/oksat-learn.html?g=${SLUG}&c=pearls`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.lr-pearls .lr-pearl', { timeout: 20000 });
    check('6d: the pearl wall collects pearls from every chapter', (await page.$$eval('.lr-pearl', (e) => e.length)) >= 14);
    check('6e: no console errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  /* ---- 7: untrusted input ---- */
  {
    const payload = encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>');
    const a = await open(browser, base, `oksat-learn.html?g=${payload}`);
    await a.page.waitForSelector('.ok-notice', { timeout: 8000 });
    check('7a: an unknown ?g= is shown as text, never markup', await a.page.evaluate(() => !document.getElementById('pwn') && !window.__pwned && /<img/.test(document.querySelector('.ok-notice').textContent)));
    await a.context.close();
    const b = await open(browser, base, `oksat-learn.html?g=${SLUG}&c=${payload}#${payload}`);
    await chapterReady(b.page);
    await b.page.waitForTimeout(300);
    check('7b: a hostile ?c= and hash fall back safely', await b.page.evaluate(() => !document.getElementById('pwn') && !window.__pwned && document.querySelector('.lr-nav[aria-current="page"]').dataset.view === 'start'));
    await b.context.close();
  }

  /* ---- 8: hub ---- */
  {
    const seed = `try{localStorage.setItem('${KEY}',JSON.stringify({v:1,done:{'science/sci-1':1,'science/sci-2':1}}));}catch(e){}`;
    const { context, page, errors } = await open(browser, base, 'oksat.html', seed);
    await page.waitForSelector('#guides .module-card', { timeout: 8000 });
    const t = await page.$eval('#guides .module-card', (e) => e.textContent);
    check('8a: the hub lists the guide under Interactive learning', /Allergic Rhinitis, CRS & AERD/.test(t) && /10 chapters/.test(t), t.slice(0, 120));
    check('8b: its meter counts sections marked done', /2 \/ 54 sections/.test(t) && /Resume/.test(t), t.slice(-80));
    check('8c: the question modules are still listed', (await page.$$eval('#modules .module-card', (e) => e.length)) >= 15);
    check('8d: no console errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  /* ---- 9: terms: every lexicon abbreviation is marked; hover, tap and keys show its full name ---- */
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844, hasTouch: true, isMobile: true }]) {
    const tag = vp.isMobile ? 'phone' : 'desktop';
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile });
    await context.addInitScript(`try{localStorage.setItem('oksat:reviewer','${REVIEWER}');}catch(e){}`);
    const page = await context.newPage();
    const errors = collectErrors(page);
    await page.goto(base + `/oksat-learn.html?g=${SLUG}&c=ars`, { waitUntil: 'domcontentloaded' });
    await chapterReady(page);
    const tip = () => page.$eval('#lr-tip', (e) => (e.hidden ? null : e.textContent));
    const unmarked = await page.evaluate(() => {
      const w = document.createTreeWalker(document.querySelector('.lr-chapter'), NodeFilter.SHOW_TEXT);
      const miss = [];
      for (let n; (n = w.nextNode());) {
        if (n.parentElement.closest('.lr-term, .lr-src, .lr-ev, a, button, summary, .lr-meta, .lr-kicker, .lr-sn, .lr-dots')) continue;
        window.OKSATTerms.scan(n.data).hits.forEach((x) => miss.push(x.key));
      }
      return miss;
    });
    check(`9a (${tag}): every lexicon term in the chapter text is marked`, unmarked.length === 0 && (await page.$$eval('.lr-chapter .lr-term', (e) => e.length)) > 20, unmarked.slice(0, 5).join(', '));
    const sel = '#rs-2 .lr-tool-opt .lr-term';
    if (!vp.isMobile) {
      await page.hover('.lr-chapter .lr-term[data-term="ABRS"]');
      check('9b: hover shows the full name', /ABRS acute bacterial rhinosinusitis/.test(await tip() || ''), await tip());
      await page.mouse.move(5, 500);
      check('9c: moving away hides it', (await tip()) === null);
      await page.focus('.lr-chapter .lr-term[data-term="ARS"]');
      check('9d: focus shows it; the term is described by the tip', /acute rhinosinusitis/.test(await tip() || '') && await page.$eval('.lr-chapter .lr-term[data-term="ARS"]', (e) => e.getAttribute('aria-describedby') === 'lr-tip'));
      await page.keyboard.press('Escape');
      check('9e: Escape closes it', (await tip()) === null);
    } else {
      await page.tap('.lr-chapter .lr-term[data-term="ABRS"]');
      check('9b (phone): a tap pins the full name', /acute bacterial rhinosinusitis/.test(await tip() || ''), await tip());
      const box = await page.$eval('#lr-tip', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.right]; });
      check('9c (phone): the tip stays inside the 16px gutters', box[0] >= 15 && box[1] <= 390 - 15, JSON.stringify(box));
      await page.tap('.lr-chapter .lr-p');
      check('9d (phone): a tap elsewhere closes it', (await tip()) === null);
    }
    if (await page.$(sel)) {
      const id = await page.$eval(sel, (e) => e.closest('label').querySelector('input').id);
      await page.click(sel);
      check(`9f (${tag}): a term inside a checker label opens the tip without ticking the box`, !(await page.$eval('#' + id, (e) => e.checked)) && (await tip()) !== null);
    }
    check(`9g (${tag}): no console errors`, errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  await browser.close();
  if (server) await server.close();

  console.log('=== OKSAT interactive learning behavior tests ===');
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + (r.detail || '')}`);
  console.log(`\n${failures ? 'FAILED' : 'OK'} — ${results.length - failures}/${results.length} checks passed.`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
