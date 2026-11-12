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
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { startServer, launchBrowser, collectErrors } from './smoke-lib.mjs';

/* A synthetic temporal-bone volume for OLSB's Real CT view, routed over tbone/** (nothing is written into the repo):
   40^3 voxels of 0.5 mm, frame origin -10 mm, a soft sphere in a bone shell in air, one landmark and one sweep. */
function tboneRoutes(requests) {
  const N = 40;
  const ct = Buffer.alloc(N * N * N);
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const r = Math.hypot(i - 19.5, j - 19.5, k - 19.5);
    ct[(k * N + j) * N + i] = r < 12 ? 110 : r < 16 ? 220 : 43;
  }
  const header = { version: 1, dtype: 'uint8', dims: [N, N, N], spacing: [0.5, 0.5, 0.5],
    affine: [[0.5, 0, 0, -10], [0, 0.5, 0, -10], [0, 0, 0.5, -10], [0, 0, 0, 1]],
    values: { kind: 'display' }, windows: { bone: { center: 128, width: 255 } }, specimen: 'synthetic' };
  const landmarks = { landmarks: [{ name: 'lscc', g: 'lscc', point_mm: [2, 1, 0] }, { name: 'nowhere', g: null, point_mm: [-3, -2, 0.2] }] };
  const sweeps = { status_meaning: { detected: 'd', labelled: 'l', inferred: 'i' }, sweeps: { 'facial-nerve': { family: 'facial-nerve', segments: [
    { name: 'labyrinthine', pts: [[-4, -4, 0], [-3, -3, 0], [-2, -2, 0], [-1, -1, 0]], radius: [0.5, 0.5, 0.5, 0.5], status: ['inferred', 'detected', 'labelled', 'detected'] }] } } };
  const files = { 'ct/ct.json': JSON.stringify(header), 'ct/ct.u8.gz': zlib.gzipSync(ct),
    'geometry/landmarks.json': JSON.stringify(landmarks), 'geometry/sweeps.json': JSON.stringify(sweeps) };
  return async (page) => {
    await page.route('**/tbone/**', (route) => {
      const u = new URL(route.request().url());
      requests.push(u.pathname);
      const body = files[u.pathname.replace(/^.*\/tbone\//, '')];
      return body ? route.fulfill({ status: 200, body, contentType: u.pathname.endsWith('.json') ? 'application/json' : 'application/octet-stream' })
        : route.fulfill({ status: 404, body: '' });
    });
  };
}
const tboneRequests = [];
const tboneSetup = tboneRoutes(tboneRequests);

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

/* Exported so tools/test-a11y.mjs walks the same pages in the same states. */
export const PAGES = [
  { path: 'index.html', ready: async (p) => {
    await wait(p, () => !!document.querySelector('.hero-name') && /PGY-\d/.test(document.getElementById('pgy-status').textContent));
    /* all five sections start folded; a head tap opens one */
    await wait(p, () => document.querySelectorAll('.block[data-fold]').length === 5
      && [...document.querySelectorAll('.block[data-fold] > .block-body')].every((b) => getComputedStyle(b).display === 'none'));
    await p.click('#about-h .block-toggle');
    await wait(p, () => getComputedStyle(document.getElementById('about-body')).display !== 'none');
    await p.click('.egg[data-egg="cochlea"]');       /* eggs start hidden */
    await figureReady(p, 'cochlea');
    await p.click('#research-h .block-toggle');
    await wait(p, () => document.querySelector('#research-h .block-toggle').getAttribute('aria-expanded') === 'true'
      && getComputedStyle(document.getElementById('research-body')).display !== 'none');
    await p.click('.egg[data-egg="fusion"]');
    return figureReady(p, 'fusion', { themeFlip: true });
  } },
  { path: 'Fusion.html', ready: (p) => wait(p, () => !!document.querySelector('.fusion-qr-svg')) },
  { path: 'oksat.html', ready: (p) => wait(p, () => document.querySelectorAll('#modules .module-card').length > 0
    && document.querySelectorAll('#guides .module-card').length > 0) },
  { path: 'oksat-study.html?m=pediatrics', ready: oksatStudyReady },
  /* Interactive learning: the chapter rail built and the start chapter rendered; a content chapter loads its
     data file, its modules (each in its own frame) and draws sections. Behavior is tools/test-oksat-learn.mjs. */
  { path: 'oksat-learn.html?g=ar-crs-aerd', ready: (p) => wait(p, () => document.querySelectorAll('.lr-nav').length === 13
      && document.querySelectorAll('.lr-chapter .lr-card').length > 0) },
  { path: 'oksat-learn.html?g=ar-crs-aerd&c=aerd', ready: (p) => wait(p, () => document.querySelectorAll('.lr-chapter .lr-sec').length === 6
      && document.querySelectorAll('.lr-drill-link').length > 0) },
  /* Regression, same class as ?m= below: ?g=, ?c= and the hash only select among known ids. */
  { path: 'oksat-learn.html?g=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>'),
    ready: (p) => wait(p, () => !!document.querySelector('.ok-notice') && !document.getElementById('pwn') && !window.__pwned) },
  { path: 'oksat-learn.html?g=ar-crs-aerd&c=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>') + '#' + encodeURIComponent('<b>'),
    ready: (p) => wait(p, () => document.querySelectorAll('.lr-nav').length === 13 && !document.getElementById('pwn') && !window.__pwned) },
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
    await p.click('.egg[data-egg="larynx"]');
    await figureReady(p, 'larynx');
    /* the app re-renders the whole screen on every change: the figure must come back */
    await p.click('[data-action="pick-mode"]:not(.active)');
    await p.click('.egg[data-egg="larynx"]');
    return figureReady(p, 'larynx');
  } },
  { path: 'cpt-search.html', ready: (p) => wait(p, () => document.body.innerText.trim().length > 0) },
  /* Search: the index is built (OKSAT modules loaded in frames, CPT table present); a query yields hits from both. */
  { path: 'search.html', ready: (p) => wait(p, () => document.documentElement.getAttribute('data-search') === 'ready') },
  /* PDF chapter splitter: both vendored libraries loaded and the page logic ran (it wires the theme toggle). */
  { path: 'pdf-chapter-splitter.html', ready: (p) => wait(p, () => !!window.PDFLib && !!window.JSZip && !!document.querySelector('.tool-title')) },
  /* Owner review (unlisted): the item list rendered from js/review-items.js. */
  { path: 'review.html', ready: (p) => wait(p, () => document.querySelectorAll('.rv-item').length > 0) },
  /* Atlas (unlisted): the head map drew; focusing a group lights it. */
  { path: 'atlas.html', ready: async (p) => {
    await wait(p, () => document.querySelectorAll('.at-svg .at-group').length > 0);
    await p.focus('.at-group[data-group="cn7"]');
    return wait(p, () => document.querySelector('.at-group[data-group="cn7"]').classList.contains('is-lit'));
  } },
  /* OLSB: the layered SVG drew and a hash step resolved (unlisted page). */
  { path: 'OLSB.html#p=mastoidectomy&s=6', ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready'
      && document.querySelectorAll('#olsb-svg .s').length > 20
      && /Facial recess/.test(document.getElementById('olsb-step-title').textContent)) },
  /* A cut-plane diorama: selecting a structure lists its neighbours. */
  { path: 'OLSB.html#d=axial&p=posterior&s=2', ready: async (p) => {
    await wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready'
      && /posterior wall/.test(document.getElementById('olsb-step-title').textContent));
    await p.click('#olsb-svg [data-id="sinustymp"]', { force: true });
    return wait(p, () => document.querySelectorAll('#olsb-info-rel .olsb-chip').length > 2
      && document.querySelectorAll('#olsb-svg .s.is-rel').length > 0);
  } },
  /* OLSB 3D model: the voxel volume built (in its worker), meshed, and a tour step resolved;
     a click on the model selects a structure and lists its neighbours. */
  { path: 'OLSB.html#m=3d&s=1', ready: async (p) => {
    await wait(p, () => document.documentElement.getAttribute('data-olsb3d') === 'ready'
      && Number(document.getElementById('olsb3d-stage').getAttribute('data-faces')) > 10000
      && /The block/.test(document.getElementById('olsb3d-step-title').textContent), 40000);
    await p.waitForTimeout(900);   /* the camera's flight to the step's view */
    await p.locator('#olsb3d-canvas').scrollIntoViewIfNeeded();
    const box = await p.locator('#olsb3d-canvas').boundingBox();
    await p.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
    return wait(p, () => !document.getElementById('olsb3d-info').hidden
      && document.getElementById('olsb3d-info-name').textContent.length > 2);
  } },
  /* Guide deep link: a selected structure (#m=3d&sel=<id>) shows in the info panel; a hostile sel is ignored. */
  { path: 'OLSB.html#m=3d&sel=lscc', ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb3d') === 'ready'
    && !document.getElementById('olsb3d-info').hidden, null, 40000) },
  { path: 'OLSB.html#m=3d&sel=' + encodeURIComponent('<img src=x onerror=window.__pwned=1>'), ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb3d') === 'ready'
    && !window.__pwned && !document.querySelector('#olsb3d-info img'), null, 40000) },
  /* OLSB Real CT: no tbone/ request until the view opens; then a slice draws and clicking a landmark selects its glossary id. */
  { path: 'OLSB.html#d=axial&p=posterior&s=1', setup: tboneSetup, ready: async (p) => {
    await wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready');
    await p.waitForTimeout(500);
    if (tboneRequests.length) throw new Error('tbone/ requested before the Real CT view opened: ' + tboneRequests[0]);
    await p.click('#olsb-mode [data-mode="ct"]');
    await wait(p, () => document.documentElement.getAttribute('data-olsb-ct') === 'ready'
      && Number(document.getElementById('olsb-ct-canvas').getAttribute('data-drawn')) > 1000);
    /* axial at z = 0: landmark lscc at x = 2, y = 1 -> pixel ((9.5 - 2) / 0.5, (9.5 - 1) / 0.5), centre at +0.5 */
    await p.locator('#olsb-ct-canvas').scrollIntoViewIfNeeded();
    const c = await p.evaluate(() => { const cv = document.getElementById('olsb-ct-canvas'); const r = cv.getBoundingClientRect();
      const k = Number(cv.getAttribute('data-k')); const f = r.width / cv.width;
      return { x: r.left + ((9.5 - 2) / 0.5 + 0.5) * k * f, y: r.top + ((9.5 - 1) / 0.5 + 0.5) * k * f }; });
    await p.mouse.click(c.x, c.y);
    await wait(p, () => document.getElementById('olsb-ct-info').getAttribute('data-id') === 'lscc'
      && /semicircular/i.test(document.getElementById('olsb-ct-info-name').textContent));
    if (!/m=ct/.test(await p.evaluate(() => location.hash))) throw new Error('hash not written');
    /* the model outline: built on the first toggle, drawn, carried in the hash, off again with M; the overlay never takes the click */
    await p.click('#olsb-ct-ov');
    await wait(p, () => { const o = document.getElementById('olsb-ct-overlay'); return !o.hidden && Number(o.getAttribute('data-outline')) > 0; }, null, 40000);
    if (!/ov=1/.test(await p.evaluate(() => location.hash))) throw new Error('ov not written to the hash');
    if (!(await p.evaluate(() => { const c = document.getElementById('olsb-ct-canvas'); c.scrollIntoView({ block: 'center' });
      const r = c.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === c
        && getComputedStyle(document.getElementById('olsb-ct-overlay')).pointerEvents === 'none'; }))) throw new Error('overlay takes pointer events');
    await p.keyboard.press('m');
    await wait(p, () => document.getElementById('olsb-ct-overlay').hidden && !/ov=1/.test(location.hash));
    return true;
  } },
  /* The hash selects plane and position (and untrusted junk falls back). */
  { path: 'OLSB.html#m=ct&pl=cor&at=1.5', setup: tboneSetup, ready: (p) => wait(p, () => {
    const c = document.getElementById('olsb-ct-canvas');
    return document.documentElement.getAttribute('data-olsb-ct') === 'ready' && c.getAttribute('data-plane') === 'coronal' && c.getAttribute('data-at') === '1.50';
  }) },
  { path: 'OLSB.html#m=ct&pl=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>') + '&at=NaN', setup: tboneSetup, ready: (p) => wait(p, () =>
    document.documentElement.getAttribute('data-olsb-ct') === 'ready' && document.getElementById('olsb-ct-canvas').getAttribute('data-plane') === 'axial'
      && !document.getElementById('pwn') && !window.__pwned) },
  /* Unreadable tbone/ data: a plain message in the CT status line, and the Diagrams mode stays usable. */
  { path: 'OLSB.html#m=ct', setup: (p) => p.route('**/tbone/**', (r) => r.fulfill({ contentType: 'application/json', body: '{broken' })), ready: async (p) => {
    await wait(p, () => !document.getElementById('olsb-ct-status').hidden && /could not be loaded/.test(document.getElementById('olsb-ct-status').textContent));
    await p.click('#olsb-mode [data-mode="2d"]');
    return wait(p, () => !document.getElementById('olsb2d').hidden);
  } },
  /* A plane in the hash that names an Object.prototype key (constructor) falls back to the axial plane, without error. */
  /* &ov=1 turns the model outline on at load (opacity from &ovo, clamped); junk in &ov stays off, junk &ovo falls back to 60. */
  { path: 'OLSB.html#m=ct&ov=1&ovo=40', setup: tboneSetup, ready: (p) => wait(p, () => {
    const o = document.getElementById('olsb-ct-overlay');
    return document.documentElement.getAttribute('data-olsb-ct') === 'ready' && !o.hidden && Number(o.getAttribute('data-outline')) > 0
      && o.style.opacity === '0.4' && document.getElementById('olsb-ct-ov').getAttribute('aria-pressed') === 'true';
  }, null, 40000) },
  { path: 'OLSB.html#m=ct&ov=1&ovo=999', setup: tboneSetup, ready: (p) => wait(p, () =>
    document.documentElement.getAttribute('data-olsb-ct') === 'ready' && document.getElementById('olsb-ct-overlay').style.opacity === '1', null, 40000) },
  { path: 'OLSB.html#m=ct&ov=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>') + '&ovo=abc', setup: tboneSetup, ready: (p) => wait(p, () =>
    document.documentElement.getAttribute('data-olsb-ct') === 'ready' && document.getElementById('olsb-ct-overlay').hidden
      && document.getElementById('olsb-ct-ovo').value === '60' && !document.getElementById('pwn') && !window.__pwned) },
  { path: 'OLSB.html#m=ct&pl=constructor', setup: tboneSetup, ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb-ct') === 'ready'
    && document.getElementById('olsb-ct-canvas').getAttribute('data-plane') === 'axial') },
  { path: 'OLSB.html#m=3d&st=' + encodeURIComponent('<img src=x id=pwn onerror=window.__pwned=1>') + '&cam=' + encodeURIComponent('<b>'),
    ready: (p) => wait(p, () => document.documentElement.getAttribute('data-olsb3d') === 'ready'
      && !document.getElementById('pwn') && !window.__pwned, 40000) },
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
      if (spec.setup) await spec.setup(page);
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

/* Run only when executed directly: test-a11y.mjs imports PAGES. */
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
