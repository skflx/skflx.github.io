#!/usr/bin/env node
/* =============================================================
   test-search.mjs — search.html and the CPT deep link, in a real
   browser. Fixture-free: it reads the shipped OKSAT manifest and
   CPT table as they are.

   Desktop 1280x800:
     - a module-title query returns that module's hit (href ?m=<slug>)
     - a CPT query returns CPT hits whose href ends #cpt-<n>
     - following that href lands with the row inside the viewport
   Phone 390x844 (isMobile, dsf 2):
     - search.html and a deep-linked cpt-search.html#cpt-<n> do not
       overflow the page horizontally
     - the search field and result links are at least 44x44 CSS px

   Usage:
     node tools/test-search.mjs                  # start own server
     node tools/test-search.mjs --base <url>     # existing server
     node tools/test-search.mjs --shot <png>     # also save the phone screenshot

   Prints PASS/FAIL per check; exits nonzero on any failure.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { startServer, launchBrowser, collectErrors, ROOT } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const SHOT = opt('--shot', null);

let failures = 0;
const check = (ok, name, detail = '') => {
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

/* The pediatrics module's manifest title, read from its source so the test follows renames. */
const manifestSrc = fs.readFileSync(path.join(ROOT, 'js/oksat/manifest.js'), 'utf8');
const ped = manifestSrc.match(/slug:\s*'pediatrics',\s*title:\s*'([^']+)'/);
const MODULE_TITLE = ped ? ped[1] : 'Pediatric Hearing Loss';

const ready = (p) => p.waitForFunction(() => document.documentElement.getAttribute('data-search') === 'ready', null, { timeout: 15000 });

/* Type a query and wait out search.js's 150 ms debounce. */
async function typeQuery(p, q) {
    await p.fill('#srch-input', q);
    await p.waitForTimeout(400);
}

const server = BASE ? null : await startServer();
const base = BASE || server.origin;
const browser = await launchBrowser();

try {
    /* ---------- desktop 1280x800 ---------- */
    console.log('desktop 1280x800');
    {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const p = await ctx.newPage();
        const errs = collectErrors(p);
        await p.goto(base + '/search.html');
        await ready(p);

        await typeQuery(p, MODULE_TITLE);
        const modHref = await p.evaluate(() => {
            const a = [...document.querySelectorAll('a.srch-hit')].find((x) => x.querySelector('.srch-field')?.textContent === 'module');
            return a ? a.getAttribute('href') : null;
        });
        check(modHref === 'oksat-study.html?m=pediatrics', 'module-title query returns the module hit', `href=${modHref}`);

        const n = await p.evaluate(() => window.CPT_DB.findIndex((r) => r.code === '31540'));
        await typeQuery(p, '31540');
        const cptHrefs = await p.$$eval('a.srch-hit', (as) => as.map((a) => a.getAttribute('href')).filter((h) => h.startsWith('cpt-search.html#')));
        check(cptHrefs.length > 0 && cptHrefs.every((h) => /^cpt-search\.html#cpt-\d+$/.test(h)), 'CPT query returns CPT hits with #cpt-<n> hrefs', `${cptHrefs.length} hits`);
        check(cptHrefs.includes(`cpt-search.html#cpt-${n}`), `hit for 31540 links to #cpt-${n}`);

        await p.click(`a.srch-hit[href="cpt-search.html#cpt-${n}"]`);
        await p.waitForURL(/cpt-search\.html#cpt-\d+$/);
        await p.waitForSelector(`#cpt-${n}`, { timeout: 8000 });
        await p.waitForTimeout(400);
        const rect = await p.evaluate((i) => {
            const el = document.getElementById('cpt-' + i);
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, vh: innerHeight, hit: el.classList.contains('is-hit') };
        }, n);
        check(rect.top >= 0 && rect.bottom <= rect.vh, 'deep link lands with the row inside the viewport', `top=${Math.round(rect.top)} bottom=${Math.round(rect.bottom)} vh=${rect.vh}`);
        check(rect.hit, 'the landed row carries the highlight class');
        check(errs.length === 0, 'desktop: no console or page errors', errs.map((e) => e.text).join(' | '));
        await ctx.close();
    }

    /* ---------- phone 390x844, isMobile, dsf 2 ---------- */
    console.log('phone 390x844');
    {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
        const p = await ctx.newPage();
        const errs = collectErrors(p);
        await p.goto(base + '/search.html');
        await ready(p);
        await typeQuery(p, 'laryngo');
        const count = await p.$$eval('a.srch-hit', (as) => as.length);
        check(count > 0, 'search.html: results render at 390 wide', `${count} hits`);

        const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        check(ov.sw <= ov.iw, 'search.html: no horizontal page scroll', `scrollWidth=${ov.sw} innerWidth=${ov.iw}`);

        const boxes = await p.$$eval('#srch-input, a.srch-hit', (els) => els.map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.id || el.getAttribute('href'), w: r.width, h: r.height };
        }));
        const small = boxes.filter((b) => b.w < 44 || b.h < 44);
        check(boxes.length > 1 && small.length === 0, 'search field and result links are at least 44x44 CSS px',
            small.length ? `${small.length} small, first: ${small[0].id} ${Math.round(small[0].w)}x${Math.round(small[0].h)}` : `${boxes.length - 1} links checked`);

        if (SHOT) {
            await p.evaluate(() => window.scrollTo(0, 0));
            await p.screenshot({ path: SHOT });
            console.log(`  INFO  screenshot saved to ${SHOT}`);
        }

        const n = await p.evaluate(() => window.CPT_DB.findIndex((r) => r.code === '31540'));
        await p.goto(base + '/cpt-search.html#cpt-' + n);
        await p.waitForSelector('.result-card.is-hit', { timeout: 8000 });
        await p.waitForTimeout(400);
        const cpt = await p.evaluate(() => {
            const row = document.querySelector('.result-card.is-hit').getBoundingClientRect();
            const box = document.getElementById('cpt-results');
            return {
                sw: document.documentElement.scrollWidth, iw: window.innerWidth,
                boxSw: box.scrollWidth, boxCw: box.clientWidth,
                top: row.top, bottom: row.bottom, vh: innerHeight,
            };
        });
        check(cpt.sw <= cpt.iw, 'cpt-search.html#cpt-<n>: no horizontal page scroll', `scrollWidth=${cpt.sw} innerWidth=${cpt.iw}; results box scroll ${cpt.boxSw}/${cpt.boxCw}`);
        check(cpt.top >= 0 && cpt.bottom <= cpt.vh, 'cpt deep link at 390: row inside the viewport', `top=${Math.round(cpt.top)} bottom=${Math.round(cpt.bottom)}`);
        check(errs.length === 0, 'phone: no console or page errors', errs.map((e) => e.text).join(' | '));
        await ctx.close();
    }
} finally {
    await browser.close();
    if (server) await server.close();
}

console.log(failures ? `\nFAILED: ${failures} check(s)` : '\nOK — all search checks passed');
process.exit(failures ? 1 : 0);
