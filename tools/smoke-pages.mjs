#!/usr/bin/env node
/* =============================================================
   smoke-pages.mjs — every shipped page boots with zero real
   console errors, plus a per-page readiness assertion.

   Real browser (headless Chromium via Playwright) because the study
   viewer renders through React + htm from a CDN — jsdom can't stand in.
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
const wait = (page, fn, timeout = 12000) => page.waitForFunction(fn, null, { timeout }).then(() => true);

const PAGES = [
  { path: 'index.html', ready: (p) => wait(p, () => !!document.querySelector('details.section')) },
  { path: 'oksat.html', ready: (p) => wait(p, () => document.querySelectorAll('#modules .module-card').length > 0) },
  { path: 'oksat-study.html?m=pediatrics', ready: oksatStudyReady },
  { path: 'airway-jeopardy.html', ready: (p) => wait(p, () => !!window.AIRWAY_DATA && Array.isArray(window.AIRWAY_DATA.questions)) },
  { path: 'cpt-search.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
];

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
