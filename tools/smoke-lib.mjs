/* =============================================================
   smoke-lib.mjs — shared helpers for the browser-driven dev tools
   (tools/smoke-pages.mjs, tools/test-oksat-engine.mjs, tools/repro.mjs).

   Provides: a dependency-free static file server (Node http only), a
   robust Chromium launcher that works both in this sandbox (pinned
   /opt/pw-browsers build) and in CI (npx playwright install chromium),
   and a console-error collector keyed off tools/console-allowlist.json.

   Playwright is a devDependency; nothing shipped imports this.
   ============================================================= */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
};

/* Start a static server rooted at `root` (default repo root). Resolves
   { origin, close } once listening. Zero dependencies. */
export function startServer(root = ROOT, port = 0) {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      // Browsers auto-request /favicon.ico; the site ships none. Answer 204
      // so it isn't a spurious 404 in every page's console.
      if (urlPath === '/favicon.ico') { res.writeHead(204).end(); return; }
      let filePath = path.join(root, urlPath);
      if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
      // contain within root
      if (!path.resolve(filePath).startsWith(path.resolve(root))) { res.writeHead(403).end(); return; }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const origin = `http://127.0.0.1:${server.address().port}`;
      resolve({ origin, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

/* Resolve a Chromium executable. Order:
   1. $PW_CHROMIUM_PATH (explicit override)
   2. a pinned chromium build under /opt/pw-browsers (this sandbox)
   3. undefined -> let Playwright use its own downloaded build (CI). */
export function chromiumExecutable() {
  if (process.env.PW_CHROMIUM_PATH && fs.existsSync(process.env.PW_CHROMIUM_PATH)) return process.env.PW_CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = fs.readdirSync(base).filter((d) => d.startsWith('chromium-') && !d.includes('headless')).sort().pop();
    if (dir) {
      const exe = path.join(base, dir, 'chrome-linux', 'chrome');
      if (fs.existsSync(exe)) return exe;
    }
  } catch (e) { /* fall through */ }
  return undefined;
}

/* Launch Chromium via Playwright, resolving the executable. Pass
   { headed:true } for a visible window (debugging). */
export async function launchBrowser(opts = {}) {
  const { chromium } = await import('playwright');
  const executablePath = chromiumExecutable();
  const launch = { headless: !opts.headed };
  if (executablePath) launch.executablePath = executablePath;
  return chromium.launch(launch);
}

/* oksat-study.html blocks on a "Who is reviewing?" modal before it mounts.
   Fill it with `code` and click through (a new code adds a confirm step).
   Resolves once the modal is gone. Shared by smoke + engine tests. */
export async function driveReviewerModal(page, code = 'smoke') {
  await page.waitForSelector('[role="dialog"] input', { timeout: 12000 });
  await page.fill('[role="dialog"] input', code);
  for (let i = 0; i < 3; i++) {
    if (!(await page.$('[role="dialog"]'))) break;
    await page.click('[role="dialog"] button');
    await page.waitForTimeout(250);
  }
}

/* Load the console-error allowlist (array of regex source strings). */
export function loadAllowlist() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'tools/console-allowlist.json'), 'utf8');
    return JSON.parse(raw).map((s) => new RegExp(s));
  } catch (e) { return []; }
}

/* Attach console/pageerror collectors to a page. Returns an array that
   fills with { type, text } for messages NOT matched by the allowlist. */
export function collectErrors(page, allow = loadAllowlist()) {
  const errors = [];
  const keep = (type, text) => { if (!allow.some((re) => re.test(text))) errors.push({ type, text }); };
  page.on('console', (msg) => { if (msg.type() === 'error') keep('console.error', msg.text()); });
  page.on('pageerror', (err) => keep('pageerror', err.message));
  page.on('requestfailed', (req) => {
    // ignore aborted external font/CDN requests when offline-testing; report same-origin failures
    const u = req.url();
    if (u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost')) keep('requestfailed', u + ' — ' + (req.failure()?.errorText || ''));
  });
  return errors;
}
