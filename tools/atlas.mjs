#!/usr/bin/env node
/* =============================================================
   atlas.mjs — bake the atlas control points into inline SVG.

   tools/atlas/anatomy.json (schema: docs/atlas.md) holds
   every shape as control points. This tool turns them into
   Catmull-Rom curves written as cubic Béziers and bakes the SVG
   between the markers in atlas.html:

     <!-- atlas:svg --> … <!-- /atlas:svg -->

   Usage:
     node tools/atlas.mjs bake      # rewrite the block (stdout if atlas.html is absent)
     node tools/atlas.mjs check     # exit 1 on a schema error or a stale block
     node tools/atlas.mjs preview --out <png> [--theme dark] [--hover <group>]

   tools/check-data.mjs imports checkAtlas(). Output is
   deterministic (coordinates rounded to 0.1, fixed order) and
   carries no <text> or <title> (D6: no visible labels). Pure Node;
   only `preview` needs Playwright.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);
export const DATA = 'tools/atlas/anatomy.json';
export const PAGE = 'atlas.html';
const OPEN = '<!-- atlas:svg -->', CLOSE = '<!-- /atlas:svg -->';

export const TISSUES = ['bone', 'cutbone', 'soft', 'mucosa', 'cartilage', 'nerve', 'vessel', 'air', 'brainghost', 'skin'];
const SHADES = ['dome', 'pit'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/* OKSAT subspecialty keys, read from the manifest the page loads. */
function subspecialties() {
  try {
    const ctx = {};
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(rel('js/oksat/manifest.js'), 'utf8'), ctx);
    return Object.keys(ctx.OKSAT_SUBSPECIALTIES || {});
  } catch (e) { return null; }
}

/* A link may only be a same-site relative URL: no scheme, no
   protocol-relative host, nothing that could run script. */
const SAFE_HREF = /^(?!\/\/)[A-Za-z0-9._\-/]+(\?[A-Za-z0-9._\-=&]*)?(#[A-Za-z0-9._\-=&]*)?$/;

/* Returns a list of error strings; empty means valid. */
export function validate(data) {
  const errs = [];
  if (!data || typeof data !== 'object') return ['anatomy: not an object'];
  const vb = data.viewBox;
  if (!Array.isArray(vb) || vb.length !== 4 || !vb.every(isNum) || vb[2] <= 0 || vb[3] <= 0) errs.push('viewBox: want [x, y, w, h] with w, h > 0');
  const groups = data.groups && typeof data.groups === 'object' ? data.groups : null;
  if (!groups || !Object.keys(groups).length) errs.push('groups: missing or empty');
  const subs = subspecialties();
  for (const [id, g] of Object.entries(groups || {})) {
    const at = `group "${id}"`;
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) errs.push(`${at}: id must be lowercase [a-z0-9_-]`);
    if (!g || typeof g !== 'object') { errs.push(`${at}: not an object`); continue; }
    if (g.sub !== null && typeof g.sub !== 'string') errs.push(`${at}: sub must be a subspecialty key or null`);
    else if (g.sub !== null && subs && !subs.includes(g.sub)) errs.push(`${at}: unknown subspecialty "${g.sub}" (OKSAT_SUBSPECIALTIES)`);
    if (g.href !== null && (typeof g.href !== 'string' || !SAFE_HREF.test(g.href))) errs.push(`${at}: href must be null or a relative same-site URL`);
    if (typeof g.ariaLabel !== 'string' || !g.ariaLabel.trim()) errs.push(`${at}: ariaLabel missing`);
    if (typeof g.interactive !== 'boolean') errs.push(`${at}: interactive must be true or false`);
    if (g.href && g.interactive === false) errs.push(`${at}: a linked group must be interactive`);
  }
  if (!Array.isArray(data.shapes) || !data.shapes.length) { errs.push('shapes: missing or empty'); return errs; }
  const seen = new Set();
  data.shapes.forEach((s, i) => {
    const at = `shape "${s && s.id != null ? s.id : '#' + i}"`;
    if (!s || typeof s !== 'object') { errs.push(`${at}: not an object`); return; }
    if (typeof s.id !== 'string' || !s.id) errs.push(`${at}: id missing`);
    else if (seen.has(s.id)) errs.push(`${at}: duplicate id`);
    seen.add(s.id);
    if (!groups || !Object.prototype.hasOwnProperty.call(groups, s.group)) errs.push(`${at}: unknown group "${s.group}"`);
    if (!TISSUES.includes(s.tissue)) errs.push(`${at}: unknown tissue "${s.tissue}"`);
    if (!Array.isArray(s.points) || s.points.length < 3) errs.push(`${at}: needs at least 3 points`);
    else if (!s.points.every((p) => Array.isArray(p) && p.length === 2 && isNum(p[0]) && isNum(p[1]))) errs.push(`${at}: every point must be [x, y]`);
    if (typeof s.closed !== 'boolean') errs.push(`${at}: closed must be true or false`);
    if (!isNum(s.tension) || s.tension < 0 || s.tension > 1) errs.push(`${at}: tension must be 0..1`);
    if (!Number.isInteger(s.z)) errs.push(`${at}: z must be an integer`);
    if (s.shade !== undefined && !SHADES.includes(s.shade)) errs.push(`${at}: shade must be dome or pit`);
    if (s.dashed !== undefined && typeof s.dashed !== 'boolean') errs.push(`${at}: dashed must be true or false`);
  });
  return errs;
}

/* 0.1 precision, no trailing zeros, no "-0". */
function num(n) {
  const r = Math.round(n * 10) / 10;
  return String(Object.is(r, -0) ? 0 : r);
}
const pt = (p) => `${num(p[0])} ${num(p[1])}`;

/* Cardinal spline through the points as cubic Béziers: tension 0 is
   Catmull-Rom, 1 is straight segments. Open ends repeat the end
   point; closed shapes wrap and end with Z. */
export function pathD(points, closed, tension) {
  const n = points.length, k = (1 - tension) / 6;
  const P = (i) => closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pt(points[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? d + 'Z' : d;
}

/* Paint order: shapes by z (file order breaks ties). Each group is
   one element, so groups are placed by their lowest z (declaration
   order breaks ties) and their shapes by z inside them. */
export function toSVG(data) {
  const errs = validate(data);
  if (errs.length) throw new Error('atlas: ' + errs.join('\n       '));
  const ids = Object.keys(data.groups);
  const byGroup = new Map(ids.map((id) => [id, []]));
  data.shapes.forEach((s, i) => byGroup.get(s.group).push({ s, i }));
  const order = ids.filter((id) => byGroup.get(id).length)
    .map((id, gi) => ({ id, gi, z: Math.min(...byGroup.get(id).map((e) => e.s.z)) }))
    .sort((a, b) => a.z - b.z || ids.indexOf(a.id) - ids.indexOf(b.id));
  const lines = [`<svg class="at-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox.map(num).join(' ')}" focusable="false">`];
  for (const { id } of order) {
    const g = data.groups[id];
    const tag = g.href ? 'a' : 'g';
    let attrs = ` class="at-group" data-group="${esc(id)}"`;
    if (g.sub) attrs += ` data-sub="${esc(g.sub)}"`;
    if (g.href) attrs += ` href="${esc(g.href)}"`;
    if (g.interactive && !g.href) attrs += ` role="group" tabindex="0" aria-label="${esc(g.ariaLabel)}"`;
    else if (g.interactive) attrs += ` aria-label="${esc(g.ariaLabel)}"`;
    else attrs += ' aria-hidden="true"';
    lines.push(`  <${tag}${attrs}>`);
    const shapes = byGroup.get(id).slice().sort((a, b) => a.s.z - b.s.z || a.i - b.i);
    for (const { s } of shapes) {
      const cls = `at-shape at-${s.tissue}${s.dashed ? ' at-dashed' : ''}`;
      const shade = s.shade ? ` data-shade="${s.shade}"` : '';
      lines.push(`    <path class="${cls}" data-shape="${esc(s.id)}"${shade} d="${pathD(s.points, s.closed, s.tension)}"/>`);
    }
    lines.push(`  </${tag}>`);
  }
  lines.push('</svg>');
  return lines.join('\n');
}

export function loadData() {
  return JSON.parse(fs.readFileSync(rel(DATA), 'utf8'));
}

/* Replace the marked block; null if the page has no markers. */
function spliced(html, svg) {
  const a = html.indexOf(OPEN), b = html.indexOf(CLOSE);
  if (a < 0 || b < a) return null;
  return html.slice(0, a + OPEN.length) + '\n' + svg + '\n' + html.slice(b);
}

/* For check-data: { ok, errors[] }. A missing page is not an error
   until the page exists (2C); its markers are, once it does. */
export function checkAtlas() {
  let data;
  try { data = loadData(); } catch (e) { return { ok: false, errors: [`${DATA}: ${e.message}`] }; }
  const errors = validate(data).map((e) => `${DATA}: ${e}`);
  if (errors.length) return { ok: false, errors };
  if (!fs.existsSync(rel(PAGE))) return { ok: true, errors: [] };
  const html = fs.readFileSync(rel(PAGE), 'utf8');
  const next = spliced(html, toSVG(data));
  if (next === null) return { ok: false, errors: [`${PAGE}: missing ${OPEN} … ${CLOSE} markers`] };
  if (next !== html) return { ok: false, errors: [`${PAGE}: atlas bake is stale (run: node tools/atlas.mjs bake)`] };
  return { ok: true, errors: [] };
}

function bake() {
  const svg = toSVG(loadData());
  if (!fs.existsSync(rel(PAGE))) { process.stdout.write(svg + '\n'); return; }
  const html = fs.readFileSync(rel(PAGE), 'utf8');
  const next = spliced(html, svg);
  if (next === null) { console.error(`${PAGE}: missing ${OPEN} … ${CLOSE} markers`); process.exit(1); }
  if (next !== html) { fs.writeFileSync(rel(PAGE), next); console.log(`baked ${PAGE}`); }
  else console.log(`${PAGE} current`);
}

/* Preview: the bake on the site's tokens (plus css/atlas.css once it
   exists), screenshotted by Playwright. --hover lights one group the
   way the page does: .is-lit on it with --hue, .is-dim on the rest. */
const FALLBACK_CSS = `
.at-svg{display:block;width:100%;height:auto;background:var(--bg)}
.at-shape{fill:var(--wash);stroke:var(--ink-muted);stroke-width:1.5}
.at-bone,.at-cutbone{fill:var(--plate)}.at-skin,.at-brainghost{fill:none;stroke:var(--rule-strong)}
.at-nerve,.at-vessel{fill:none;stroke-width:3}.at-dashed{stroke-dasharray:8 6}
.at-group.is-lit .at-shape{stroke:var(--hue);stroke-width:3}.at-group.is-dim{opacity:.35}`;

async function preview(args) {
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const out = opt('--out');
  if (!out) { console.error('preview: --out <png> is required'); process.exit(2); }
  const theme = opt('--theme') === 'dark' ? 'dark' : 'light';
  const hover = opt('--hover');
  const data = loadData();
  if (hover && !Object.prototype.hasOwnProperty.call(data.groups, hover)) { console.error(`preview: unknown group "${hover}"`); process.exit(2); }
  const read = (p) => (fs.existsSync(rel(p)) ? fs.readFileSync(rel(p), 'utf8') : '');
  const css = read('css/site.css') + '\n' + (read('css/atlas.css') || FALLBACK_CSS);
  const html = `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><style>${css}</style></head>`
    + `<body style="margin:0;background:var(--bg)">${toSVG(data)}</body></html>`;
  let browser;
  try { browser = await (await import('./smoke-lib.mjs')).launchBrowser(); } catch (e) { console.error('preview needs Playwright (npm install): ' + e.message); process.exit(2); }
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: Math.round(1200 * data.viewBox[3] / data.viewBox[2]) } });
    await page.setContent(html);
    if (hover) {
      const hue = (() => {
        const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
        try { vm.runInContext(read('js/oksat/manifest.js'), ctx); } catch (e) { return null; }
        const sub = data.groups[hover].sub;
        return sub && ctx.OKSAT_SUBSPECIALTIES[sub] ? ctx.OKSAT_SUBSPECIALTIES[sub].hue : null;
      })();
      await page.evaluate(([id, h]) => {
        document.querySelectorAll('.at-group').forEach((g) => {
          const lit = g.getAttribute('data-group') === id;
          g.classList.toggle('is-lit', lit);
          g.classList.toggle('is-dim', !lit);
          if (lit && h) g.style.setProperty('--hue', h);
        });
      }, [hover, hue]);
    }
    await page.locator('svg.at-svg').screenshot({ path: path.resolve(out) });
    console.log(`wrote ${out}`);
  } finally { await browser.close(); }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === 'bake') bake();
    else if (cmd === 'check') {
      const r = checkAtlas();
      if (r.ok) console.log('atlas ok');
      else { r.errors.forEach((e) => console.error(e)); process.exit(1); }
    } else if (cmd === 'preview') await preview(args);
    else { console.error('usage: node tools/atlas.mjs bake | check | preview --out <png> [--theme dark] [--hover <group>]'); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
