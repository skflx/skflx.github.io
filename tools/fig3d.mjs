#!/usr/bin/env node
/* =============================================================
   fig3d.mjs — bake and check the posters of the lit 3D figures.

   A figure is a scene in js/diagrams/<id>.js with a `fig3d` hook
   (plans/2026-10-28-figures-eggs-atlas.md section 4.3). Its poster is
   what shows before three.js loads, without WebGL, and without JS:
     images/figures/<id>-light.webp   images/figures/<id>-dark.webp

   Usage:
     node tools/fig3d.mjs check                 # exit 1 if a poster is missing
     node tools/fig3d.mjs bake [id ...]         # screenshot posters (Playwright)
     node tools/fig3d.mjs shot <id> --out f.png [--theme dark]   # one PNG, no conversion

   `bake` renders each scene with js/fig3d/render.js in headless Chromium
   (software WebGL), still (reduced motion), then converts the PNG to
   webp with cwebp, or python3 + Pillow. Posters are generated: rerun
   this, never edit them.
   ============================================================= */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadEngine } from './ascii3d.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'images/figures';
const WIDTH = 1200;

/* ids of every scene that declares a fig3d hook */
export function figureIds() {
  const { A3D } = loadEngine();
  return A3D.ids().filter((id) => A3D.get(id).fig3d);
}
export const posterPaths = (id) => ['light', 'dark'].map((t) => `${OUT}/${id}-${t}.webp`);

export function checkPosters() {
  const missing = [];
  for (const id of figureIds()) for (const p of posterPaths(id)) if (!fs.existsSync(path.join(ROOT, p))) missing.push(p);
  return { ok: missing.length === 0, missing };
}

function toWebp(png, out) {
  let r = spawnSync('cwebp', ['-quiet', '-q', '88', png, '-o', out]);
  if (r.status === 0) return;
  r = spawnSync('python3', ['-I', '-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).save(sys.argv[2],"WEBP",quality=88,method=6)', png, out]);
  if (r.status !== 0) throw new Error('no webp encoder: install cwebp, or python3 with Pillow');
}

const HARNESS = (id, theme) => `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8">
<link rel="stylesheet" href="/css/site.css"><link rel="stylesheet" href="/css/fig3d.css">
<style>body{margin:0;background:var(--bg)}#f{width:${WIDTH}px}</style></head><body>
<figure class="fig3d" id="f" data-fig3d="${id}"><div class="fig3d-controls"></div><p class="fig3d-hud"></p></figure>
<script src="/js/ascii3d.js"></script>${fs.readdirSync(path.join(ROOT, 'js/diagrams')).filter((f) => f.endsWith('.js'))
  .map((f) => `<script src="/js/diagrams/${f}"></script>`).join('')}</body></html>`;

async function shoot(browser, base, id, theme, png) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH + 40, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/__fig3d__.html', (route) => route.fulfill({ contentType: 'text/html', body: HARNESS(id, theme) }));
  await page.goto(`${base}/__fig3d__.html`);
  await page.evaluate(async () => { const m = await import('/js/fig3d/render.js'); m.mount(document.getElementById('f')); });
  await page.waitForSelector('#f[data-fig3d-ready]', { timeout: 15000 });
  await page.waitForTimeout(300);
  await page.locator('#f .fig3d-stage').screenshot({ path: png, omitBackground: false });
  await ctx.close();
  if (errors.length) throw new Error(`${id} (${theme}): ${errors.join(' | ')}`);
}

async function withBrowser(fn) {
  const { startServer, launchBrowser } = await import('./smoke-lib.mjs');
  const server = await startServer();
  const browser = await launchBrowser();
  try { await fn(browser, server.origin); } finally { await browser.close(); await server.close(); }
}

const [cmd, ...args] = process.argv.slice(2);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    if (cmd === 'check') {
      const r = checkPosters();
      if (r.ok) console.log('fig3d posters ok');
      else { r.missing.forEach((m) => console.error('missing poster: ' + m + '  (node tools/fig3d.mjs bake)')); process.exit(1); }
    } else if (cmd === 'bake') {
      const ids = args.length ? args : figureIds();
      fs.mkdirSync(path.join(ROOT, OUT), { recursive: true });
      await withBrowser(async (browser, base) => {
        for (const id of ids) for (const theme of ['light', 'dark']) {
          const png = path.join(os.tmpdir(), `fig3d-${id}-${theme}-${process.pid}.png`);
          await shoot(browser, base, id, theme, png);
          toWebp(png, path.join(ROOT, `${OUT}/${id}-${theme}.webp`));
          fs.unlinkSync(png);
          console.log(`baked ${OUT}/${id}-${theme}.webp`);
        }
      });
    } else if (cmd === 'shot') {
      const id = args[0];
      const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
      const out = opt('--out');
      if (!id || !out) { console.error('usage: node tools/fig3d.mjs shot <id> --out <png> [--theme dark]'); process.exit(2); }
      await withBrowser((browser, base) => shoot(browser, base, id, opt('--theme') === 'dark' ? 'dark' : 'light', path.resolve(out)));
      console.log(`wrote ${out}`);
    } else {
      console.error('usage: node tools/fig3d.mjs check | bake [id ...] | shot <id> --out <png> [--theme dark]');
      process.exit(2);
    }
  } catch (e) { console.error(e.message); process.exit(1); }
}
