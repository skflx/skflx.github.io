#!/usr/bin/env node
/* =============================================================
   smoke-pages.mjs — every shipped page boots with zero real
   console errors, plus a per-page readiness assertion.

   Real browser (headless Chromium via Playwright) because the graph
   pages need canvas — jsdom can't render Cytoscape. Each page gets a
   fresh context (clean localStorage) so tests are order-independent.

   "Real" console error = any console.error / pageerror / same-origin
   requestfailed NOT matched by tools/console-allowlist.json.

   Usage:
     node tools/smoke-pages.mjs                 # start own server
     node tools/smoke-pages.mjs --base <url>    # test an existing server
     node tools/smoke-pages.mjs --page oksat.html   # just one page
     node tools/smoke-pages.mjs --headed        # visible browser (debug)

   Prints PASS/FAIL per page; exits nonzero if any page failed.
   ============================================================= */
import { startServer, launchBrowser, collectErrors, driveReviewerModal } from './smoke-lib.mjs';

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
  { path: 'oksat.html', ready: (p) => wait(p, () => document.querySelectorAll('#modules .module-card, #modules a, #modules > *').length > 0) },
  { path: 'oksat-study.html?m=pediatrics', ready: oksatStudyReady },
  { path: 'oksat-adaptive.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  { path: 'oksat-generate.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  { path: 'graph.html?lens=knowledge', ready: graphReady },
  { path: 'graph.html?lens=structural', ready: graphReady },
  { path: 'graph.html?lens=study', ready: graphReady },
  { path: 'airway-jeopardy.html', ready: (p) => wait(p, () => !!window.AIRWAY_DATA && Array.isArray(window.AIRWAY_DATA.questions)) },
  { path: 'kag-extract.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  { path: 'cpt-search.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  { path: 'ascii-editor.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  // redirect stubs: assert only the forwarded destination + query.
  // isStub → the destination's own console health is tested by its own
  // entry above, so we don't count its errors against the stub.
  { path: 'kag.html?node=facial-nerve', isStub: true, ready: stub('graph.html', { lens: 'knowledge', node: 'facial-nerve' }) },
  { path: 'atlas.html?node=cochlea', isStub: true, ready: stub('graph.html', { lens: 'structural', node: 'cochlea' }) },
  { path: 'mcq.html', isStub: true, ready: stub('oksat.html', {}) },
  { path: 'mcq-study.html?m=pediatrics', isStub: true, ready: stub('oksat-study.html', { m: 'pediatrics' }) },
  { path: 'occ.html', isStub: true, ready: stubTo(/oksat\.html/) },
];

/* oksat-study.html loads the module data, then shows a blocking reviewer
   modal before mounting. Drive through it (proving manifest + engine +
   module script all loaded), then assert the module title rendered. */
async function oksatStudyReady(page) {
  // reviewer modal blocks mount; drive through it (proves manifest + engine
  // + module script loaded), then assert the module title rendered.
  await driveReviewerModal(page);
  await page.waitForFunction(() => /Pediatric/i.test(document.body.innerText)
    && document.querySelector('#root') && document.querySelector('#root').innerText.trim().length > 0,
    null, { timeout: 12000 });
  return true;
}

/* Cytoscape renders > 0 nodes. GraphView owns the instance; poll for a
   populated cy container (its canvas child exists once laid out). */
function graphReady(page) {
  return wait(page, () => {
    const cy = document.querySelector('#cy');
    if (!cy || !cy.querySelector('canvas')) return false;
    // the empty-state fallback is hidden via CSS (display:none), not the
    // [hidden] attribute — check actual visibility, not the attribute.
    const empty = document.querySelector('#cy-empty');
    const emptyShown = empty && empty.offsetParent !== null && getComputedStyle(empty).display !== 'none';
    return !emptyShown;
  }, 20000).catch(() => { throw new Error('graph did not render nodes'); });
}

/* Redirect stub landed on `dest` with each expected query param present. */
function stub(dest, params) {
  return async (page) => {
    await page.waitForFunction((d) => location.pathname.endsWith(d), dest, { timeout: 8000 });
    const url = new URL(page.url());
    if (!url.pathname.endsWith(dest)) throw new Error(`landed on ${url.pathname}, expected ${dest}`);
    for (const [k, v] of Object.entries(params)) {
      if (url.searchParams.get(k) !== v) throw new Error(`param ${k}=${url.searchParams.get(k)}, expected ${v}`);
    }
    return true;
  };
}
/* Looser stub: just assert final URL matches a regex. */
function stubTo(re) {
  return async (page) => {
    await page.waitForFunction((r) => new RegExp(r).test(location.href), re.source, { timeout: 8000 });
    if (!re.test(page.url())) throw new Error(`final url ${page.url()} did not match ${re}`);
    return true;
  };
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
      // Stub pages: only the redirect matters; the destination's console
      // health is asserted by the destination's own entry.
      if (!spec.isStub && errors.length) { verdict = 'FAIL'; reason = errors.slice(0, 3).map((e) => `${e.type}: ${e.text}`).join(' | '); }
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
