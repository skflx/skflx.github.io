#!/usr/bin/env node
/* =============================================================
   smoke-pages.mjs — every shipped page boots with zero real
   console errors, plus a per-page readiness assertion.

   Real browser (headless Chromium via Playwright) because the study
   viewer renders through React + htm (vendored) — a DOM shim can't stand in.
   Each page gets a fresh context (clean localStorage) so tests are
   order-independent.

   "Real" console error = any console.error / pageerror / same-origin
   requestfailed NOT matched by tools/console-allowlist.json.

   Usage:
     node tools/smoke-pages.mjs                 # start own server
     node tools/smoke-pages.mjs --base <url>    # test an existing server
     node tools/smoke-pages.mjs --page oksat.html   # just one page
     node tools/smoke-pages.mjs --headed        # visible browser (debug)

   Prints PASS/FAIL per page; exits nonzero if any page failed.
   ============================================================= */
import { startServer, launchBrowser, collectErrors } from './smoke-lib.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', null);
const ONLY = opt('--page', null);
const HEADED = args.includes('--headed');
// --offline aborts every non-localhost request (fonts, any CDN). Use it
// against a fully self-contained/vendored build for hermetic, fast runs;
// it will (correctly) break pages that still depend on CDN scripts.
const OFFLINE = args.includes('--offline');

/* Each page: path + an async readiness check(page) that resolves truthy
   when the page has rendered its core content. Checks poll internally. */
const wait = (page, fn, arg = null, timeout = 12000) => page.waitForFunction(fn, arg, { timeout }).then(() => true);

const PAGES = [
  { path: 'index.html', ready: async (p) => {
    await wait(p, () => !!document.querySelector('.hero-name') && /PGY-\d/.test(document.getElementById('pgy-status').textContent));
    return figureReady(p, 'fusion', { themeFlip: true });
  } },
  { path: 'oksat.html', ready: async (p) => {
    await wait(p, () => document.querySelectorAll('#modules .module-card').length > 0);
    return figureReady(p, 'leitner');
  } },
  { path: 'oksat-study.html?m=pediatrics', ready: oksatStudyReady },
  /* Regression: ?m= once reached innerHTML (reflected DOM XSS). It must
     render as text in the not-found notice, never as markup. */
  { path: 'oksat-study.html?m=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>'),
    ready: (p) => wait(p, () => !!document.querySelector('.ok-notice')
      && !document.getElementById('pwn') && !window.__pwned
      && /<img/.test(document.querySelector('.ok-notice').textContent)) },
  /* SSB: the tree is built from the graph and the WebGL stage has drawn a
     frame (window.__ssb is the read-only test window, js/ssb/main.js). */
  { path: 'ssb.html', ready: (p) => wait(p, () => document.querySelectorAll('#ssb-tree button[data-id]').length > 0
      && !!window.__ssb && window.__ssb.frames > 0) },
  /* The Specimen stage (the default one): every pack listed in packs.json is
     loaded and drawn under SwiftShader; behaviour is tools/test-ssb.mjs. */
  { path: 'ssb.html', ready: (p) => wait(p, () => !!window.__ssb && !!window.__ssb.specimen && window.__ssb.specimen.status === 'ready'
      && window.__ssb.specimen.renders > 0 && window.__ssb.specimen.nodes().length > 0, 40000) },
  /* Regression, same class as the OKSAT one above: the hash is untrusted. A
     payload in #s= must not become an element, must not run, and must not
     select anything (ids are matched against the graph index). */
  { path: 'ssb.html#s=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>'),
    ready: (p) => wait(p, () => document.querySelectorAll('#ssb-tree button[data-id]').length > 0
      && !!window.__ssb && window.__ssb.selection === null
      && !document.getElementById('pwn') && !window.__pwned
      && !document.querySelector('#ssb-panel-body [data-entity]')) },
  /* SSB variant lab: a diorama builds (behaviour is tools/test-ssb.mjs). */
  { path: 'ssb.html#lab=frontal-recess', ready: (p) => wait(p, () => !!window.__ssb && !!window.__ssb.lab
      && window.__ssb.lab.builds > 0 && window.__ssb.frames > 0, 20000) },
  { path: 'airway-jeopardy.html', ready: async (p) => {
    await wait(p, () => !!window.AIRWAY_DATA && Array.isArray(window.AIRWAY_DATA.questions));
    await figureReady(p, 'larynx');
    /* the app re-renders the whole screen on every change: the figure must come back */
    await p.click('[data-action="pick-mode"]:not(.active)');
    return figureReady(p, 'larynx');
  } },
  { path: 'cpt-search.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  /* OLSB: the layered SVG drew and a hash step resolved (unlisted page). */
  { path: 'OLSB.html#p=mastoidectomy&s=6', ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready'
      && document.querySelectorAll('#olsb-svg .s').length > 20
      && /Facial recess/.test(document.getElementById('olsb-step-title').textContent)) },
  /* Regression class as above: the hash is untrusted and only selects data. */
  { path: 'OLSB.html#p=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>'),
    ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready'
      && !document.getElementById('pwn') && !window.__pwned) },
];

/* An ASCII 3D figure (js/ascii3d.js) mounted and drew. With themeFlip,
   flipping html[data-theme] must re-shade it (paper -> dark ground). */
async function figureReady(page, id, { themeFlip = false } = {}) {
  const sel = `[data-a3d="${id}"].is-live .a3d-grid`;
  await wait(page, (s) => { const g = document.querySelector(s); return !!g && g.textContent.trim().length > 40; }, sel);
  if (!themeFlip) return true;
  const fig = `[data-a3d="${id}"]`;
  const before = await page.$eval(fig, (f) => f.getAttribute('data-a3d-shade'));
  await page.evaluate(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  await page.waitForFunction(([s, b]) => { const a = document.querySelector(s).getAttribute('data-a3d-shade'); return !!a && a !== b; }, [fig, before], { timeout: 5000 });
  return true;
}

/* oksat-study.html loads the module data, then mounts immediately —
   there is no reviewer prompt any more. Assert the module actually
   rendered (proves manifest + engine + module script all loaded). */
async function oksatStudyReady(page) {
  await page.waitForFunction(() => /Pediatric/i.test(document.body.innerText)
    && document.querySelector('#root') && document.querySelector('#root').innerText.trim().length > 0,
    null, { timeout: 12000 });
  return true;
}

async function main() {
  let server = null;
  let base = BASE;
  if (!base) { server = await startServer(); base = server.origin; }

  const browser = await launchBrowser({ headed: HEADED });
  const pages = ONLY ? PAGES.filter((p) => p.path.startsWith(ONLY)) : PAGES;
  let failed = 0;

  for (const spec of pages) {
    const context = await browser.newContext();
    const page = await context.newPage();
    if (OFFLINE) {
      await page.route('**/*', (route) => {
        const u = route.request().url();
        if (u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost')) return route.continue();
        return route.abort();
      });
    }
    const errors = collectErrors(page);
    let verdict = 'PASS';
    let reason = '';
    try {
      await page.goto(base + '/' + spec.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await spec.ready(page);
      // settle so late-boot errors surface
      await page.waitForTimeout(400);
      if (errors.length) { verdict = 'FAIL'; reason = errors.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '); }
    } catch (e) {
      verdict = 'FAIL';
      reason = (e.message || String(e)).split('\n')[0];
      if (errors.length) reason += ` [+console: ${errors[0].text}]`;
    }
    if (verdict === 'FAIL') failed++;
    console.log(`  ${verdict}  ${spec.path}${reason ? '  — ' + reason : ''}`);
    await context.close();
  }

  await browser.close();
  if (server) await server.close();
  console.log(`\n${failed ? 'FAILED' : 'OK'} — ${pages.length - failed}/${pages.length} pages passed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
