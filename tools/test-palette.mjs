#!/usr/bin/env node
/* =============================================================
   test-palette.mjs — the Cmd/Ctrl-K command palette (js/palette.js,
   loaded by js/site.js), in a real browser.

   The wiki index is route-stubbed with three synthetic notes, so the
   test never reads the live 7.6 MB file. Nothing here touches the
   network beyond the local server and those stubs.

   Desktop 1280x800 (index.html):
     - nothing is fetched before the first Cmd/Ctrl-K: no palette.js,
       no contentIndex.json
     - Ctrl+K opens #cmd-k-palette, focus lands in the box
     - the empty box lists the six site pages only
     - typing filters; a wiki query lists the stubbed note
     - a second open does not fetch the wiki index again
     - Esc closes and focus returns to the element that had it
     - Enter opens the top hit: a wiki note, an OKSAT module, a CPT row
   Opt-out pages (cpt-search, airway-jeopardy, pdf-chapter-splitter)
   do not open the palette; search.html keeps its own box.
   Wiki index fails: the palette still opens and serves the site
   pages, OKSAT and CPT; no wiki group; no console error beyond the
   aborted request itself.
   Phone 390x844 (isMobile): no horizontal overflow with the palette
   open, the dialog fits the viewport, the options are 44 px tall.

   Usage:
     node tools/test-palette.mjs                  # start own server
     node tools/test-palette.mjs --base <url>     # existing server
     node tools/test-palette.mjs --shots <dir>    # also save screenshots

   Prints PASS/FAIL per check; exits nonzero on any failure.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { startServer, launchBrowser, collectErrors, loadAllowlist } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const SHOTS = opt('--shots', null);

let failures = 0;
const check = (ok, name, detail = '') => {
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const WIKI_PATH = '**/ohns-wiki-skflx/static/contentIndex.json';
const WIKI_BASE = 'https://skflx.github.io/ohns-wiki-skflx/';
const STUB = {
    'test/alpha-note': { slug: 'test/alpha-note', title: 'Zyglomatic fold reference note', tags: ['test', 'zebra'] },
    'test/beta-note': { slug: 'test/beta-note', title: 'Beta note about cochlear implant fitting', tags: ['test', 'implant'] },
    'test/gamma-note': { slug: 'test/gamma-note', title: 'Gamma note on the nasal septum', tags: ['test', 'septum'] },
};
/* Chromium logs an aborted fetch as "Failed to load resource"; the collector also reports the
   aborted URL itself. Only those two are expected in the failing-wiki case. */
const WIKI_FAIL_ALLOW = [...loadAllowlist(), /Failed to load resource/, /contentIndex\.json/];

const OPTS = '#cmd-k-palette #cmdk-list [role="option"]';
const optTitles = (p) => p.$$eval(OPTS, (els) => els.map((el) => el.querySelector('.cmdk-title-text').textContent));
const statusText = (p) => p.textContent('#cmdk-status');
const isOpen = (p) => p.evaluate(() => { const d = document.getElementById('cmd-k-palette'); return !!(d && d.open); });
const wikiSettled = (p) => p.waitForFunction(() => {
    const s = document.getElementById('cmdk-status');
    return !!s && !s.textContent.includes('Loading wiki');
}, null, { timeout: 15000 });
/* the OKSAT and CPT corpora arrive as their own scripts; wait until both are in */
const corporaIn = (p) => p.waitForFunction(() => Array.isArray(window.OKSAT_MANIFEST) && Array.isArray(window.CPT_DB), null, { timeout: 15000 });

/* Open a fresh page and track what it fetches. */
async function openPage(browser, { path: pagePath, viewport, mobile = false, wiki = 'ok' }) {
    const ctx = await browser.newContext({
        viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1,
    });
    const p = await ctx.newPage();
    const counts = { wiki: 0, palette: 0 };
    p.on('request', (r) => {
        if (r.url().includes('contentIndex.json')) counts.wiki++;
        if (r.url().includes('/js/palette.js')) counts.palette++;
    });
    await p.route(WIKI_PATH, (route) => (wiki === 'fail' ? route.abort() : route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(STUB),
    })));
    await p.route(WIKI_BASE + '**', (route) => route.fulfill({
        status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title><p>stub note</p>',
    }));
    return { ctx, p, counts, errs: collectErrors(p, wiki === 'fail' ? WIKI_FAIL_ALLOW : undefined) };
}

async function openPalette(p) {
    await p.keyboard.press('Control+k');
    await p.waitForSelector('#cmd-k-palette[open]', { timeout: 10000 });
}

const server = BASE ? null : await startServer();
const base = BASE || server.origin;
const browser = await launchBrowser();
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

try {
    /* ---------- desktop 1280x800: open, filter, lazy, focus ---------- */
    console.log('desktop 1280x800 · index.html');
    {
        const { ctx, p, counts, errs } = await openPage(browser, { path: '/index.html', viewport: { width: 1280, height: 800 } });
        await p.goto(base + '/index.html');
        await p.waitForSelector('.hero-name');
        await p.waitForTimeout(300);
        check(counts.wiki === 0 && counts.palette === 0 && (await p.evaluate(() => !window.SKPalette)),
            'nothing fetched before the first Cmd/Ctrl-K', `wiki=${counts.wiki} palette.js=${counts.palette}`);

        await p.focus('.site-theme-toggle');
        await openPalette(p);
        check(await isOpen(p), 'Ctrl+K opens #cmd-k-palette');
        const focusId = await p.evaluate(() => document.activeElement && document.activeElement.id);
        check(focusId === 'cmdk-input', 'focus lands in the palette box', `active=${focusId}`);
        check(counts.wiki === 1 && counts.palette === 1, 'the first open fetches palette.js and the wiki index once',
            `wiki=${counts.wiki} palette.js=${counts.palette}`);

        await corporaIn(p);
        await wikiSettled(p);
        const pagesOnly = await optTitles(p);
        check(pagesOnly.length === 6, 'empty box lists the six site pages', `${pagesOnly.length}: ${pagesOnly.join(' | ')}`);
        check(!(await p.$$eval('#cmdk-list .cmdk-group', (gs) => gs.map((g) => g.textContent))).some((t) => /Wiki|OKSAT|CPT/.test(t)),
            'empty box shows the Site pages group only');

        await p.fill('#cmdk-input', 'zebra');
        await p.waitForTimeout(150);
        const zebra = await optTitles(p);
        check(zebra.length === 1 && zebra[0] === STUB['test/alpha-note'].title,
            'a wiki tag query filters to the stubbed note', `${zebra.length}: ${zebra.join(' | ')}`);
        check((await statusText(p)) === '1 match', 'status reports the match count', await statusText(p));

        await p.fill('#cmdk-input', 'note');
        await p.waitForTimeout(150);
        const notes = await p.$$eval('#cmdk-list .cmdk-group', (gs) => gs.map((g) => g.textContent));
        check(notes.some((t) => t === 'Wiki notes · 3'), 'a title query groups the three wiki notes', notes.join(' | '));

        await p.fill('#cmdk-input', 'zyglo');
        await p.waitForTimeout(150);
        const selected = await p.getAttribute(`${OPTS}[aria-selected="true"]`, 'id');
        check(selected === 'cmdk-o-0', 'the first hit is active by default, so Enter works at once', `active=${selected}`);

        await p.keyboard.press('Escape');
        await p.waitForFunction(() => !document.getElementById('cmd-k-palette').open);
        const back = await p.evaluate(() => document.activeElement && document.activeElement.className);
        check(back && back.includes('site-theme-toggle'), 'Esc closes and focus returns to the element that had it', `active=${back}`);

        await openPalette(p);
        await p.waitForTimeout(300);
        check(counts.wiki === 1, 'a second open does not fetch the wiki index again', `wiki=${counts.wiki}`);
        await p.keyboard.press('Escape');
        await p.waitForFunction(() => !document.getElementById('cmd-k-palette').open);

        check(errs.length === 0, 'desktop: no console or page errors', errs.map((e) => e.text).join(' | '));
        await ctx.close();
    }

    /* ---------- Enter navigates to the expected href ---------- */
    console.log('enter navigates');
    const enterCases = [
        { name: 'wiki note', query: 'zyglo', want: WIKI_BASE + 'test/alpha-note', wait: 'wiki' },
        { name: 'OKSAT module', query: 'otoplasty', want: /\/oksat-study\.html\?m=otoplasty$/ },
        { name: 'CPT row', query: '31540', want: /\/cpt-search\.html#cpt-6$/ },
    ];
    for (const c of enterCases) {
        const { ctx, p, errs } = await openPage(browser, { path: '/index.html', viewport: { width: 1280, height: 800 } });
        await p.goto(base + '/index.html');
        await p.waitForSelector('.hero-name');
        await openPalette(p);
        await corporaIn(p);
        await wikiSettled(p);
        await p.fill('#cmdk-input', c.query);
        await p.waitForFunction(() => document.querySelectorAll('#cmdk-list [role="option"]').length > 0, null, { timeout: 10000 });
        await p.keyboard.press('Enter');
        const want = c.want;
        if (typeof want === 'string') {
            await p.waitForFunction((w) => location.href === w, want, { timeout: 10000 }).catch(() => {});
            check(p.url() === want, `Enter on "${c.query}" opens the ${c.name}`, p.url());
        } else {
            await p.waitForURL(want, { timeout: 10000 }).catch(() => {});
            check(want.test(p.url()), `Enter on "${c.query}" opens the ${c.name}`, p.url());
        }
        check(errs.length === 0, `${c.name}: no console or page errors`, errs.map((e) => e.text).join(' | '));
        await ctx.close();
    }

    /* ---------- opt-out pages and search.html ---------- */
    console.log('opt-out');
    for (const pg of ['/cpt-search.html', '/airway-jeopardy.html', '/pdf-chapter-splitter.html']) {
        const { ctx, p, counts } = await openPage(browser, { path: pg, viewport: { width: 1280, height: 800 } });
        await p.goto(base + pg);
        await p.waitForLoadState('load');
        await p.waitForTimeout(300);
        await p.keyboard.press('Control+k');
        await p.waitForTimeout(400);
        const dialog = await p.evaluate(() => !!document.getElementById('cmd-k-palette'));
        check(!dialog && counts.palette === 0, `${pg} keeps Cmd/Ctrl-K off`, `dialog=${dialog} palette.js=${counts.palette}`);
        await ctx.close();
    }
    {
        const { ctx, p } = await openPage(browser, { path: '/search.html', viewport: { width: 1280, height: 800 } });
        await p.goto(base + '/search.html');
        await p.waitForSelector('#srch-input');
        await p.keyboard.press('Control+k');
        await p.waitForTimeout(200);
        const focus = await p.evaluate(() => document.activeElement && document.activeElement.id);
        const dialog = await p.evaluate(() => !!document.getElementById('cmd-k-palette'));
        check(focus === 'srch-input' && !dialog, 'search.html: Cmd/Ctrl-K focuses its own box and opens no palette', `active=${focus}`);
        await ctx.close();
    }

    /* ---------- wiki index fails: still usable ---------- */
    console.log('wiki fetch failing');
    {
        const { ctx, p, errs } = await openPage(browser, { path: '/index.html', viewport: { width: 1280, height: 800 }, wiki: 'fail' });
        await p.goto(base + '/index.html');
        await p.waitForSelector('.hero-name');
        await openPalette(p);
        await corporaIn(p);
        await wikiSettled(p);
        await p.waitForTimeout(300);
        check(await isOpen(p), 'the palette still opens when the wiki index fails');
        const pages = await optTitles(p);
        check(pages.length === 6, 'site pages still list with the wiki index failed', `${pages.length}`);
        await p.fill('#cmdk-input', 'otoplasty');
        await p.waitForFunction(() => document.querySelectorAll('#cmdk-list [role="option"]').length > 0, null, { timeout: 10000 });
        const hits = await optTitles(p);
        check(hits.some((t) => t.startsWith('Otoplasty')), 'OKSAT still searches with the wiki index failed', hits.join(' | '));
        await p.fill('#cmdk-input', 'zebra');
        await p.waitForTimeout(200);
        check((await optTitles(p)).length === 0 && (await statusText(p)) === 'No matches.', 'the stubbed wiki note is absent; the status says no matches');
        check(errs.length === 0, 'wiki failing: no console errors beyond the aborted request', errs.map((e) => e.text).join(' | '));
        await ctx.close();
    }

    /* ---------- phone 390x844 ---------- */
    console.log('phone 390x844');
    {
        const { ctx, p, errs } = await openPage(browser, { path: '/index.html', viewport: { width: 390, height: 844 }, mobile: true });
        await p.goto(base + '/index.html');
        await p.waitForSelector('.hero-name');
        await openPalette(p);
        await corporaIn(p);
        await wikiSettled(p);
        await p.fill('#cmdk-input', 'zebra');
        await p.waitForTimeout(200);
        const m = await p.evaluate(() => {
            const d = document.getElementById('cmd-k-palette').getBoundingClientRect();
            const o = document.querySelector('#cmdk-list [role="option"]');
            const input = document.getElementById('cmdk-input').getBoundingClientRect();
            return {
                sw: document.documentElement.scrollWidth, iw: window.innerWidth,
                dl: d.left, dr: d.right, dt: d.top, db: d.bottom, ih: window.innerHeight,
                optH: o ? o.getBoundingClientRect().height : 0, inputH: input.height,
            };
        });
        check(m.sw <= m.iw, 'phone: no horizontal page scroll with the palette open', `scrollWidth=${m.sw} innerWidth=${m.iw}`);
        check(m.dl >= 0 && m.dr <= m.iw && m.dt >= 0 && m.db <= m.ih, 'phone: the dialog fits the viewport',
            `l=${Math.round(m.dl)} r=${Math.round(m.dr)} t=${Math.round(m.dt)} b=${Math.round(m.db)}`);
        check(m.optH >= 44 && m.inputH >= 44, 'phone: the box and each option are at least 44 px tall', `option=${Math.round(m.optH)} input=${Math.round(m.inputH)}`);
        if (SHOTS) {
            await p.screenshot({ path: path.join(SHOTS, 'palette-phone.png') });
            console.log(`  INFO  screenshot saved to ${path.join(SHOTS, 'palette-phone.png')}`);
        }
        check(errs.length === 0, 'phone: no console or page errors', errs.map((e) => e.text).join(' | '));
        await ctx.close();
    }

    /* ---------- desktop screenshots: light and dark ---------- */
    if (SHOTS) {
        for (const theme of ['light', 'dark']) {
            const { ctx, p } = await openPage(browser, { path: '/index.html', viewport: { width: 1280, height: 800 } });
            await p.goto(base + '/index.html');
            await p.waitForSelector('.hero-name');
            await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
            await openPalette(p);
            await corporaIn(p);
            await wikiSettled(p);
            await p.fill('#cmdk-input', 'zebra');
            await p.waitForTimeout(200);
            await p.fill('#cmdk-input', 'o');
            await p.waitForTimeout(200);
            const file = path.join(SHOTS, `palette-${theme}.png`);
            await p.screenshot({ path: file });
            console.log(`  INFO  screenshot saved to ${file}`);
            await ctx.close();
        }
    }
} finally {
    await browser.close();
    if (server) await server.close();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall palette checks passed');
process.exit(failures ? 1 : 0);
