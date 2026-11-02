#!/usr/bin/env node
/* =============================================================
   test-oksat-learn.mjs — behavior tests for the Interactive learning
   viewer (oksat-learn.html + js/oksat/learn.js) and its hub segment.

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
     - unlisted: true entries get no hub card and no hub count, yet still open at their own URL
     - lexicon terms (js/oksat/terms.js) are marked; hover, focus and tap show the full name
     - anatomy blocks (hotspot, layers, neighbors, sequence) on a route-served fixture guide
       (fx-anat); nothing is written into the repo (plans/2026-11-02-ear-anatomy-guide.md 4.2.6)

   Usage:  node tools/test-oksat-learn.mjs [--base <url>] [--headed]
   Exits nonzero on any failed case.
   ============================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launchBrowser, collectErrors, ROOT } from './smoke-lib.mjs';

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

/* ---- fixture for section 10: a route-served guide; nothing is written into the repo ---- */
const FX_SLUG = 'fx-anat';
const FX_KEY = `oksat:learn:${FX_SLUG}:${REVIEWER}`;
const GLOSS = (() => {
  const win = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'js/olsb/glossary.js'), 'utf8'))(win);
  return win.OLSB.glossary;
})();
const NAME = (g) => GLOSS[g].name;
const NAME_TO_G = Object.fromEntries(Object.keys(GLOSS).map((g) => [GLOSS[g].name, g]));
const gradeFrom3 = (right) => (right === 3 ? 3 : right / 3 >= 0.75 ? 2 : right / 3 >= 0.5 ? 1 : 0);
const svgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">${inner}</svg>`;
const region = (g, x, y) => `<g data-g="${g}"><rect x="${x}" y="${y}" width="50" height="40" fill="#b9c4d8" stroke="#333"/></g>`;
const FX_SVGS = {
  'hs1.svg': svgWrap(region('antrum', 10, 10) + region('tegmen', 75, 10) + region('aditus', 140, 10) + '<text data-label="lbl" x="10" y="110" font-size="10">labels</text>'),
  'hs2.svg': svgWrap(region('lscc', 10, 10) + region('mcfdura', 75, 10) + region('tegment', 140, 10)),
  'evil.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" onload="window.__pwned=1">'
    + '<script>window.__pwned=1</script><foreignObject width="10" height="10"><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject>'
    + '<g data-g="antrum" onclick="window.__pwned=1"><rect x="10" y="10" width="50" height="40" fill="#b9c4d8"/></g>'
    + region('tegmen', 75, 10) + region('aditus', 140, 10) + '</svg>',
  'base.svg': svgWrap('<rect x="5" y="5" width="190" height="110" fill="#eee"/>'),
  'l0.svg': svgWrap('<rect x="20" y="20" width="60" height="60" fill="#c33" opacity="0.6"/>'),
  'l1.svg': svgWrap('<rect x="120" y="20" width="60" height="60" fill="#36c" opacity="0.6"/>'),
};
const SEQ_ITEMS = ['CN VIII', 'Ventral cochlear nucleus', 'Superior olivary complex (both sides)', 'Facial motor nucleus', 'Stapedius'];
const LAYERS = [{ id: 'l0', label: 'Layer zero', src: 'images/oksat/fx-anat/l0.svg' }, { id: 'l1', label: 'Layer one', src: 'images/oksat/fx-anat/l1.svg' }];
const hs = (id, frames, extra) => ({ t: 'hotspot', id, alt: 'Fixture ear figure', label: 'Fixture hotspot', modes: ['explore', 'find'], frames, ...extra });
const FX_SECTIONS = [
  { id: 'hs-s1', n: '1', title: 'Hotspot: explore and find', blocks: [hs('hs1', [{ src: 'images/oksat/fx-anat/hs1.svg', cap: 'Frame one', regions: [{ g: 'antrum' }, { g: 'tegmen' }, { g: 'aditus' }] }])] },
  { id: 'hs-s2', n: '2', title: 'Hotspot: two frames', blocks: [hs('hs2', [
    { src: 'images/oksat/fx-anat/hs1.svg', cap: 'Frame one cap', regions: [{ g: 'antrum' }, { g: 'tegmen' }, { g: 'aditus' }] },
    { src: 'images/oksat/fx-anat/hs2.svg', cap: 'Frame two cap', regions: [{ g: 'lscc' }, { g: 'mcfdura' }, { g: 'tegment' }] },
  ])] },
  { id: 'hs-s3', n: '3', title: 'Hotspot: scrubbed SVG', blocks: [hs('hs3', [{ src: 'images/oksat/fx-anat/evil.svg', cap: 'Hostile', regions: [{ g: 'antrum' }, { g: 'tegmen' }, { g: 'aditus' }] }])] },
  { id: 'hs-s4', n: '4', title: 'Hotspot: degrade', blocks: [hs('hs4', [{ src: 'images/oksat/fx-anat/missing.svg', cap: 'Degrade cap', regions: [{ g: 'antrum' }, { g: 'tegmen' }, { g: 'aditus' }] }], { alt: 'Degrade fallback alt' })] },
  { id: 'lay-s', n: '5', title: 'Layers', blocks: [
    { t: 'layers', id: 'lay1', alt: 'Layers base', base: 'images/oksat/fx-anat/base.svg', mode: 'toggle', layers: LAYERS, on: [], cap: 'Toggle cap' },
    { t: 'layers', id: 'lay2', alt: 'Layers base', base: 'images/oksat/fx-anat/base.svg', mode: 'step', cumulative: false, layers: LAYERS },
    { t: 'layers', id: 'lay3', alt: 'Layers base', base: 'images/oksat/fx-anat/base.svg', mode: 'step', cumulative: true, layers: LAYERS },
  ] },
  { id: 'nb-s', n: '6', title: 'Neighbors', blocks: [{ t: 'neighbors', id: 'nb1', g: 'antrum', label: 'Neighbours of the antrum' }] },
  { id: 'sq-s', n: '7', title: 'Sequence', blocks: [
    { t: 'sequence', id: 'sq1', q: 'Order the stapedial reflex arc.', items: SEQ_ITEMS },
    { t: 'sequence', id: 'sq2', q: 'Second arc, left as shuffled.', items: ['A one', 'B two', 'C three'] },
  ] },
  { id: 'tl-s', n: '8', title: 'Tally', blocks: [
    { t: 'check', id: 'tc1', q: 'Predict the answer.', a: 'The answer.' },
    { t: 'neighbors', id: 'tn1', g: 'antrum' },
    { t: 'sequence', id: 'tq1', q: 'Order these.', items: ['A one', 'B two', 'C three'] },
  ] },
];
const FX_CHAPTER = { id: 'anat', kicker: 'Fixture', title: 'Anatomy blocks fixture', lede: 'Served by route interception.', sections: FX_SECTIONS };
const FX_GUIDE = {
  slug: FX_SLUG, title: 'Fixture anatomy', kicker: 'Fixture', subspecialty: 'fundamentals', accent: '#2445B0', desc: 'Test fixture.',
  chapters: [{ id: 'anat', short: 'Fixture', min: 5, sections: FX_SECTIONS.length, data: 'js/oksat/guides/fx-anat/anat.js' }],
};

async function openFx(browser, base, url) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(`try{localStorage.setItem('oksat:reviewer','${REVIEWER}');}catch(e){}`);
  await context.route(/\/js\/oksat\/manifest\.js(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    const body = (await res.text()) + `\nwindow.OKSAT_GUIDES.push(${JSON.stringify(FX_GUIDE)});`;
    await route.fulfill({ status: 200, contentType: 'application/javascript', body });
  });
  await context.route(/\/js\/oksat\/guides\/fx-anat\/anat\.js(\?.*)?$/, (route) => route.fulfill({
    status: 200, contentType: 'application/javascript', body: `window.__OKSAT_CHAPTER = ${JSON.stringify(FX_CHAPTER)};`,
  }));
  await context.route(/\/images\/oksat\/fx-anat\/[^/?]+(\?.*)?$/, (route) => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop());
    const svg = FX_SVGS[name];
    if (!svg) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg });
  });
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(base + '/' + url, { waitUntil: 'domcontentloaded' });
  return { context, page, errors };
}
const dlRow = (page, sec, label) => page.evaluate(([s, l]) => {
  const dl = document.querySelector(`#${s} .lr-hs-nbs`);
  const dt = dl && [...dl.querySelectorAll('dt')].find((t) => t.textContent === l);
  if (!dt) return null;
  const dd = dt.nextElementSibling;
  return { buttons: [...dd.querySelectorAll('button')].map((b) => b.textContent), text: dd.textContent };
}, [sec, label]);
const seqTexts = (page, i) => page.evaluate((n) => [...document.querySelectorAll('#sq-s .lr-seq')[n].querySelectorAll('.lr-seq-row .lr-seq-text')].map((e) => e.textContent), i);
const gradeOf = (rec, k) => (rec && rec.checks ? rec.checks[k] : undefined);

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
    const sel = '#bi-3 .lr-tool-opt .lr-term';
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
    await page.goto(base + `/oksat-learn.html?g=${SLUG}&c=biologics`, { waitUntil: 'domcontentloaded' });
    await chapterReady(page);
    const id = await page.$eval(sel, (e) => e.closest('label').querySelector('input').id).catch(() => null);
    if (id) await page.click(sel);
    check(`9f (${tag}): a term inside a checker label opens the tip without ticking the box`, id && !(await page.$eval('#' + id, (e) => e.checked)) && (await tip()) !== null, `checker term ${id}`);
    check(`9g (${tag}): no console errors`, errors.length === 0, JSON.stringify(errors.slice(0, 2)));
    await context.close();
  }

  /* ---- 10: unlisted entries: no hub card or count, still reachable by URL ----
     The real manifest is served with two synthetic entries appended by a route
     (nothing is written into the repo). The probe guide reuses a real chapter file. */
  {
    const UNL_GUIDE = 'unlisted-probe-guide';
    const UNL_MOD = 'unlisted-probe-module';
    const probe = [
      `window.OKSAT_GUIDES.push({ slug: '${UNL_GUIDE}', title: 'Unlisted probe guide', kicker: 'Probe', subspecialty: 'rhinology', accent: '#6E4A6B', desc: 'Probe.', unlisted: true,`,
      `  chapters: [{ id: 'start', short: 'Start here', data: 'js/oksat/guides/ar-crs-aerd/start.js' },`,
      `    { id: 'science', k: 1, short: 'Science', min: 5, sections: 10, data: 'js/oksat/guides/ar-crs-aerd/science.js' }] });`,
      `window.OKSAT_MANIFEST.push({ slug: '${UNL_MOD}', title: 'Unlisted probe module', kicker: 'Probe', subspecialty: 'rhinology', count: 62, accent: '#6E4A6B', desc: 'Probe.', data: 'js/oksat/modules/crs-ars.js', unlisted: true });`,
    ].join('\n');
    const routed = async (url, seed) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.route((u) => u.pathname.endsWith('/js/oksat/manifest.js'), async (route) => {
        const r = await route.fetch();
        await route.fulfill({ response: r, body: (await r.text()) + '\n' + probe });
      });
      await context.addInitScript(`try{localStorage.setItem('oksat:reviewer','${REVIEWER}');}catch(e){}`);
      if (seed) await context.addInitScript(seed);
      const page = await context.newPage();
      const errors = collectErrors(page);
      await page.goto(base + '/' + url, { waitUntil: 'domcontentloaded' });
      return { context, page, errors };
    };
    /* 3 due items on the unlisted module, 1 on the listed crs-ars: the banner must count only the 1 */
    const seed = [
      `try{localStorage.setItem('oksat:srs:${UNL_MOD}:${REVIEWER}',JSON.stringify({items:{p1:{nextReview:'2000-01-01'},p2:{nextReview:'2000-01-01'},p3:{nextReview:'2000-01-01'}}}));}catch(e){}`,
      `try{localStorage.setItem('oksat:srs:crs-ars:${REVIEWER}',JSON.stringify({items:{c1:{nextReview:'2000-01-01'}}}));}catch(e){}`,
    ].join('');

    const hub = await routed('oksat.html', seed);
    await hub.page.waitForSelector('#guides .module-card', { timeout: 8000 });
    await hub.page.waitForSelector('#modules .module-card', { timeout: 8000 });
    const hrefs = await hub.page.$$eval('#guides a.module-card, #modules a.module-card', (as) => as.map((a) => a.getAttribute('href')));
    check('10a: an unlisted guide and an unlisted module get no hub card', !hrefs.some((h) => h.includes(UNL_GUIDE) || h.includes(UNL_MOD)), JSON.stringify(hrefs));
    check('10b: listed guide and module still get their cards', hrefs.includes('oksat-learn.html?g=ar-crs-aerd') && hrefs.includes('oksat-study.html?m=crs-ars'), JSON.stringify(hrefs));
    const modCards = await hub.page.$$eval('#modules a.module-card', (a) => a.length);
    const manifestLen = await hub.page.evaluate(() => window.OKSAT_MANIFEST.length);
    check('10c: the module cards are exactly the listed modules', modCards === manifestLen - 1, `cards=${modCards} manifest=${manifestLen}`);
    const dueCount = await hub.page.textContent('#review-count');
    const dueWhere = await hub.page.textContent('#review-where');
    const crsTitle = await hub.page.evaluate(() => window.OKSAT_MANIFEST.find((m) => m.slug === 'crs-ars').title);
    check('10d: the due-review banner counts only the listed module (1, not 4)', dueCount === '1' && dueWhere === 'in ' + crsTitle && !(await hub.page.$eval('#review-banner', (e) => e.hidden)), `count=${dueCount} where=${dueWhere}`);
    check('10e: no console errors on the hub', hub.errors.length === 0, JSON.stringify(hub.errors.slice(0, 2)));
    await hub.context.close();

    const g = await routed(`oksat-learn.html?g=${UNL_GUIDE}&c=science`);
    await chapterReady(g.page);
    check('10f: the unlisted guide still boots at its own URL', (await g.page.$$eval('.lr-chapter .lr-sec', (e) => e.length)) === 10 && !(await g.page.$('.ok-notice')));
    check('10g: no console errors on the unlisted guide', g.errors.length === 0, JSON.stringify(g.errors.slice(0, 2)));
    await g.context.close();

    const m = await routed(`oksat-study.html?m=${UNL_MOD}`);
    await m.page.waitForTimeout(1500);
    check('10h: the unlisted module still opens at its own URL', (await m.page.title()).startsWith('Unlisted probe module') && !(await m.page.$('.ok-notice')), await m.page.title());
    check('10i: no console errors on the unlisted module', m.errors.length === 0, JSON.stringify(m.errors.slice(0, 2)));
    await m.context.close();
  }

  /* ---- 10: anatomy blocks (hotspot, layers, neighbors, sequence) on the fixture guide ---- */
  {
    const { context, page, errors } = await openFx(browser, base, `oksat-learn.html?g=${FX_SLUG}&c=anat`);
    await chapterReady(page);
    await page.waitForSelector('#hs-s1 .lr-hs-stage svg', { timeout: 12000 });

    /* T1: explore names the region and lists its neighbours by direction, reverses included */
    await page.click('#hs-s1 [data-g="antrum"]');
    check('10-T1a: explore fills the panel with the glossary name', (await page.textContent('#hs-s1 .lr-hs-name')) === NAME('antrum'), await page.textContent('#hs-s1 .lr-hs-panel'));
    const sup = await dlRow(page, 'hs-s1', 'Superior');
    check('10-T1b: Superior lists the in-frame neighbour as a button', !!sup && sup.buttons.includes(NAME('tegmen')), JSON.stringify(sup));
    const ant = await dlRow(page, 'hs-s1', 'Anterior');
    check('10-T1c: Anterior lists aditus as a button', !!ant && ant.buttons.includes(NAME('aditus')), JSON.stringify(ant));
    await page.click('#hs-s1 [data-g="tegmen"]');
    const inf = await dlRow(page, 'hs-s1', 'Inferior');
    check('10-T1d: a reverse relation shows (tegmen lies inferior to antrum, so tegmen lists antrum below)', !!inf && inf.buttons.includes(NAME('antrum')), JSON.stringify(inf));

    /* T6: keyboard — focus a region and press Enter */
    await page.focus('#hs-s1 [data-g="aditus"]');
    await page.keyboard.press('Enter');
    check('10-T6a: Enter on a focused region selects it and fills the panel', (await page.textContent('#hs-s1 .lr-hs-name')) === NAME('aditus'));
    check('10-T6b: regions are in the tab order with role=button', await page.$eval('#hs-s1 [data-g="aditus"]', (e) => e.getAttribute('tabindex') === '0' && e.getAttribute('role') === 'button'));

    /* T2: find — first target right, the other two wrong: 1 / 3, graded 0 */
    await page.click('#hs-s1 button[data-mode="find"]');
    for (let k = 0; k < 3; k++) {
      const target = NAME_TO_G[(await page.textContent('#hs-s1 .lr-hs-prompt')).replace(/^Tap: /, '')];
      const choice = k === 0 ? target : ['antrum', 'tegmen', 'aditus'].find((g) => g !== target);
      await page.click(`#hs-s1 [data-g="${choice}"]`);
    }
    check('10-T2a: find ends with n / N', (await page.textContent('#hs-s1 .lr-hs-score')) === '1 / 3', await page.textContent('#hs-s1 .lr-hs-panel'));
    let rec = await ls(page, FX_KEY);
    check('10-T2b: the round stores its grade at the check key (0 for 1 of 3)', gradeOf(rec, 'anat/hs-s1:hs1') === 0, JSON.stringify(rec && rec.checks));
    check('10-T2c: hits and misses are marked on the figure', await page.evaluate(() => document.querySelectorAll('#hs-s1 .is-hit').length === 1 && document.querySelectorAll('#hs-s1 .is-miss').length === 2));

    /* T3: two frames; changing frame advances the stepper and restarts the find round */
    await page.click('#hs-s2 button[data-mode="find"]');
    const first = NAME_TO_G[(await page.textContent('#hs-s2 .lr-hs-prompt')).replace(/^Tap: /, '')];
    await page.click(`#hs-s2 [data-g="${first}"]`);
    await page.click('#hs-s2 button[aria-label="Next frame"]');
    check('10-T3a: next frame shows its cap', (await page.textContent('#hs-s2 .lr-cap')).includes('Frame two cap'), await page.textContent('#hs-s2 .lr-cap'));
    check('10-T3b: the stepper reads 2 / 2', (await page.textContent('#hs-s2 .lr-hs-count')) === '2 / 2');
    check('10-T3c: the find round restarts on the new frame', (await page.textContent('#hs-s2 .lr-hs-hint')).includes('Target 1 of 3') && (await page.$$eval('#hs-s2 .is-hit, #hs-s2 .is-miss', (e) => e.length)) === 0);

    /* T4: the SVG sanitizer */
    await page.waitForSelector('#hs-s3 [data-g="antrum"]', { timeout: 12000 });
    check('10-T4a: an SVG with script and onload does not run', (await page.evaluate(() => window.__pwned)) === undefined);
    const bad = await page.evaluate(() => {
      const root = document.querySelector('#hs-s3 .lr-hs-stage');
      const els = root ? [root, ...root.querySelectorAll('*')] : [];
      return els.filter((e) => e.localName.toLowerCase() === 'foreignobject' || e.localName.toLowerCase() === 'script' || [...e.attributes].some((a) => /^on/i.test(a.name))).length;
    });
    check('10-T4b: no on* attribute, foreignObject or script reaches the DOM', bad === 0, String(bad));

    /* T7: layers, toggle and step */
    await page.waitForSelector('#lay-s .lr-layers-l', { state: 'attached', timeout: 10000 });
    const lay = (i) => page.locator('#lay-s .lr-layers').nth(i);
    const hidden = (i) => page.evaluate((n) => [...document.querySelectorAll('#lay-s .lr-layers')[n].querySelectorAll('.lr-layers-l')].map((im) => im.hidden), i);
    check('10-T7a: layers start with every toggled layer off', JSON.stringify(await hidden(0)) === '[true,true]', JSON.stringify(await hidden(0)));
    await lay(0).locator('.lr-chipbtn', { hasText: 'Layer zero' }).click();
    check('10-T7b: a chip shows its layer', JSON.stringify(await hidden(0)) === '[false,true]', JSON.stringify(await hidden(0)));
    await lay(0).locator('.lr-chipbtn', { hasText: 'Layer zero' }).click();
    check('10-T7c: the chip hides it again', JSON.stringify(await hidden(0)) === '[true,true]', JSON.stringify(await hidden(0)));
    await lay(1).locator('input[type=range]').focus();
    await page.keyboard.press('ArrowRight');
    check('10-T7d: step at 1 shows layer 1 only', JSON.stringify(await hidden(1)) === '[true,false]', JSON.stringify(await hidden(1)));
    await lay(2).locator('input[type=range]').focus();
    await page.keyboard.press('ArrowRight');
    check('10-T7e: step at 1 with cumulative shows layers 0 to 1', JSON.stringify(await hidden(2)) === '[false,false]', JSON.stringify(await hidden(2)));

    /* T8: neighbors reveal and grade */
    await page.waitForSelector('#nb-s .lr-nbwrap .lr-reveal', { timeout: 10000 });
    await page.click('#nb-s .lr-nbwrap .lr-reveal');
    const outs = await page.$$eval('#nb-s .lr-nb-out', (els) => els.map((e) => ({ dir: e.querySelector('.lr-label').textContent, names: e.querySelector(':scope > p:last-of-type').textContent })));
    check('10-T8a: Superior reveals the tegmen name', outs.some((o) => o.dir === 'Superior' && o.names === NAME('tegmen')), JSON.stringify(outs));
    check('10-T8b: Anterior reveals the aditus name', outs.some((o) => o.dir === 'Anterior' && o.names.split(', ').includes(NAME('aditus'))), JSON.stringify(outs));
    await page.keyboard.press('4');
    await page.waitForTimeout(150);
    rec = await ls(page, FX_KEY);
    check('10-T8c: Knew it cold is stored as 3', gradeOf(rec, 'anat/nb-s:nb1') === 3, JSON.stringify(rec && rec.checks));

    /* T9: sequence — the shuffle differs, the move buttons reach the order, check, then an unchanged block */
    await page.waitForSelector('#sq-s .lr-seq', { timeout: 10000 });
    const initial = await seqTexts(page, 0);
    check('10-T9a: the shuffle differs from the authored order', JSON.stringify(initial) !== JSON.stringify(SEQ_ITEMS), JSON.stringify(initial));
    const seq1 = page.locator('#sq-s .lr-seq').nth(0);
    for (let pos = 0; pos < SEQ_ITEMS.length; pos++) {
      const cur = await seqTexts(page, 0);
      for (let k = cur.indexOf(SEQ_ITEMS[pos]); k > pos; k--) {
        await seq1.getByRole('button', { name: 'Move up: ' + cur[k], exact: true }).click();
        cur[k] = cur[k - 1]; cur[k - 1] = SEQ_ITEMS[pos];
      }
    }
    check('10-T9b: the move buttons reach the authored order', JSON.stringify(await seqTexts(page, 0)) === JSON.stringify(SEQ_ITEMS));
    await seq1.getByRole('button', { name: 'Check order' }).click();
    await page.waitForTimeout(100);
    rec = await ls(page, FX_KEY);
    check('10-T9c: a correct order is stored as 3', gradeOf(rec, 'anat/sq-s:sq1') === 3, JSON.stringify(rec && rec.checks));
    await page.locator('#sq-s .lr-seq').nth(1).getByRole('button', { name: 'Check order' }).click();
    const right = await page.$$eval('#sq-s .lr-seq', (els) => els[1].querySelectorAll('.is-right').length);
    const expect2 = gradeFrom3(right);
    rec = await ls(page, FX_KEY);
    check('10-T9d: an unchanged order is graded by the positions rule (below 3)', gradeOf(rec, 'anat/sq-s:sq2') === expect2 && expect2 < 3, `right=${right} stored=${gradeOf(rec, 'anat/sq-s:sq2')} expect=${expect2}`);

    /* T10: the tally counts the check and the two graded blocks */
    check('10-T10a: a section with a check, neighbors and sequence counts 3', /^0 of 3 prompts graded/.test(await page.textContent('#tl-s .lr-hint')), await page.textContent('#tl-s .lr-hint'));
    await page.click('#tl-s .lr-q .lr-reveal');
    await page.keyboard.press('2');
    await page.waitForTimeout(100);
    check('10-T10b: grading one makes it 1 of 3', /^1 of 3 prompts graded/.test(await page.textContent('#tl-s .lr-hint')), await page.textContent('#tl-s .lr-hint'));

    /* The only errors allowed are the browser's own 404 lines for hs-s4's deliberately missing SVG (T5). */
    const other = errors.filter((e) => !/status of 404 \(Not Found\)$/.test(e.text));
    check('10-T-err: no console errors on the fixture guide beyond the deliberate missing.svg 404s', other.length === 0, JSON.stringify(other.slice(0, 3)));
    await context.close();
  }

  /* T5: a missing SVG degrades to a plain figure with the block alt */
  {
    const { context, page } = await openFx(browser, base, `oksat-learn.html?g=${FX_SLUG}&c=anat`);
    await chapterReady(page);
    await page.waitForSelector('#hs-s4 .lr-figure img', { state: 'attached', timeout: 12000 });
    check('10-T5a: a missing SVG renders as a plain figure with the block alt', (await page.$eval('#hs-s4 .lr-figure img', (e) => e.alt)) === 'Degrade fallback alt');
    check('10-T5b: the degraded block has no interactive stage', (await page.$$eval('#hs-s4 .lr-hs-stage', (e) => e.length)) === 0);
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
