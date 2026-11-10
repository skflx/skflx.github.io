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


/* OLSB real-CT mode, on a SYNTHETIC volume routed by Playwright (nothing under tbone/ is read or written): a 32 x 24 x 20
   grid at 1 mm, one landmark on the middle axial slice (glossary id mastoidcells), one unmapped, one centreline. */
function syntheticTbone(page) {
  page.tbone = [];
  const dims = [32, 24, 20];
  const header = { version: 1, dims, spacing: [1, 1, 1], dtype: 'uint8', values: { kind: 'display', note: 'synthetic' },
    affine: [[1, 0, 0, -16], [0, 1, 0, -12], [0, 0, 1, -10], [0, 0, 0, 1]], windows: { bone: { center: 128, width: 255 } }, specimen: 'synthetic' };
  const data = Buffer.alloc(dims[0] * dims[1] * dims[2]);
  for (let n = 0; n < data.length; n++) data[n] = (n * 37 + (n >> 5) * 11) & 255;
  const landmarks = { landmarks: [
    { id: 'a', name: 'mastoid-cells', g: 'mastoidcells', how: 'head', plane: 'axial', point_mm: [0, 0, -1] },
    { id: 'b', name: 'unmapped-thing', g: null, how: 'shaft-end', plane: 'axial', point_mm: [4, 3, -1] },
    { id: 'c', name: 'far-away', g: 'mastoidcells', how: 'head', plane: 'axial', point_mm: [0, 0, 8] } ] };
  const pts = [-6, -3, 0, 3, 6].map((x) => [x, 2, -1]);
  const sweeps = { sweeps: { s: { segments: [{ name: 's', pts, status: ['detected', 'detected', 'labelled', 'inferred', 'inferred'] }] } } };
  page.on('request', (r) => { if (/\/tbone\//.test(r.url())) page.tbone.push(r.url()); });
  return page.route('**/tbone/**', (route) => {
    const u = route.request().url();
    if (/ct\.json/.test(u)) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(header) });
    if (/ct\.u8\.gz/.test(u)) return route.fulfill({ contentType: 'application/octet-stream', body: data });
    if (/landmarks\.json/.test(u)) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(landmarks) });
    if (/sweeps\.json/.test(u)) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(sweeps) });
    return route.fulfill({ status: 404, body: 'no' });
  });
}
const ctReady = (p) => wait(p, () => document.getElementById('olsbct').getAttribute('data-ct') === 'ready');
const ctDrew = (p) => p.evaluate(() => {
  const c = document.getElementById('olsbct-canvas');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let n = 4; n < d.length; n += 4) if (d[n] !== d[0]) return true;
  return false;
});

const PAGES = [
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
  /* OLSB real-CT mode (synthetic volume): nothing from tbone/ is fetched until the mode is entered; then a slice draws
     and a landmark click selects its glossary id. */
  { path: 'OLSB.html#d=axial&p=posterior&s=2', setup: syntheticTbone, ready: async (p) => {
    await wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready');
    await p.waitForTimeout(500);
    if (p.tbone.length) throw new Error('tbone/ was requested before the CT mode was entered: ' + p.tbone[0]);
    await p.click('#olsb-mode [data-mode="ct"]');
    await ctReady(p);
    if (!(await ctDrew(p))) throw new Error('the CT canvas is one flat colour');
    await wait(p, () => document.querySelectorAll('#olsbct-marks button[data-g="mastoidcells"]').length === 1
      && document.querySelectorAll('#olsbct-marks .ct-lm').length === 2 && document.querySelectorAll('#olsbct-lines polyline').length > 0);
    await p.focus('#olsbct-marks button[data-g="mastoidcells"]');
    await wait(p, () => !document.getElementById('olsbct-tip').hidden && document.getElementById('olsbct-tip').textContent.length > 2);
    await p.keyboard.press('Enter');
    await wait(p, () => !document.getElementById('olsbct-info').hidden
      && document.getElementById('olsbct-info-name').textContent === window.OLSB.glossary.mastoidcells.name);
    await p.keyboard.press('ArrowUp');          /* one slice up: the landmark (1 mm away) is still in the band, the far one is not */
    await wait(p, () => /slice 11 of 20/.test(document.getElementById('olsbct-readout').textContent));
    await p.click('#olsbct-planes [data-plane="sa"]');
    await wait(p, () => document.querySelector('#olsbct-planes [data-plane="sa"]').getAttribute('aria-pressed') === 'true'
      && /Sagittal slice 16 of 32/.test(document.getElementById('olsbct-readout').textContent)
      && /^#m=ct&p=sa&i=15$/.test(location.hash));
    if (!(await p.evaluate(() => /Temporal bone CT derived from the Interactive CT Temporal Bone Atlas/.test(document.getElementById('olsbct-attribution').textContent)))) throw new Error('attribution line missing');
    return true;
  } },
  /* A bad plane or slice in the hash falls back to the middle axial slice. */
  { path: 'OLSB.html#m=ct&p=zz&i=999', setup: syntheticTbone, ready: async (p) => {
    await ctReady(p);
    return wait(p, () => /Axial slice 10 of 20/.test(document.getElementById('olsbct-readout').textContent) && document.getElementById('olsb3d').hidden);
  } },
  /* Unreadable tbone/ data: a plain message, and the other modes stay usable. */
  { path: 'OLSB.html#m=ct', setup: (p) => p.route('**/tbone/**', (r) => r.fulfill({ contentType: 'application/json', body: '{broken' })), ready: async (p) => {
    await wait(p, () => !document.getElementById('olsbct-status').hidden && /could not be loaded/.test(document.getElementById('olsbct-status').textContent));
    await p.click('#olsb-mode [data-mode="2d"]');
    return wait(p, () => document.documentElement.getAttribute('data-olsb') === 'ready' && !document.getElementById('olsb2d').hidden);
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

main().catch((e) => { console.error(e); process.exit(1); });
