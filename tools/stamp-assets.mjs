#!/usr/bin/env node
/* =============================================================
   stamp-assets.mjs — cache-busting for same-origin CSS/JS.

   GitHub Pages (and its CDN) cache every file for ~10 minutes, each
   URL on its own clock. Right after a deploy a browser can pair the
   new HTML with the old stylesheet — the 2026-09 redesign showed up
   on phones as new markup under the pre-redesign css/onepager.css.
   Stamping each reference with a hash of the file's bytes
   (`css/site.css?v=1a2b3c4d`) makes every changed file a URL no
   cache has seen, so HTML and assets always arrive as one release.

   Not a build step: it rewrites the committed HTML in place, and the
   stamps are committed. `tools/check-data.mjs` fails on a stale or
   missing stamp, so an edited CSS/JS file cannot ship unstamped.

   Covers <link href> and <script src> pointing into css/ or js/ in
   every root *.html. Fonts, images and the module files that
   js/oksat-viewer.js injects at runtime are not stamped.

   Usage:  node tools/stamp-assets.mjs           # rewrite stale stamps
           node tools/stamp-assets.mjs --check   # report only; exit 1 if stale

   Pure Node, zero dependencies.
   ============================================================= */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* <link … href="css/x.css[?v=…]"> and <script … src="js/x.js[?v=…]">.
   Groups: 1 = tag up to the opening quote, 2 = path, 3 = old query. */
const REF = /(<(?:link|script)\b[^>]*?\b(?:href|src)=")((?:css|js)\/[^"?#]+\.(?:css|js))(\?[^"]*)?"/g;

export function hashOf(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 8);
}

/* Returns { html, stale } — html with every reference stamped, and the
   references whose stamp was missing or wrong. A missing file is left
   as-is (check-data.mjs reports it separately). */
export function stampHtml(html) {
  const stale = [];
  const out = html.replace(REF, (whole, head, file, query) => {
    if (!fs.existsSync(path.join(ROOT, file))) return whole;
    const want = '?v=' + hashOf(file);
    if (query !== want) stale.push(`${file}${query || ''} -> ${file}${want}`);
    return `${head}${file}${want}"`;
  });
  return { html: out, stale };
}

export function rootPages() {
  return fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let staleCount = 0;
  for (const page of rootPages()) {
    const abs = path.join(ROOT, page);
    const { html, stale } = stampHtml(fs.readFileSync(abs, 'utf8'));
    staleCount += stale.length;
    for (const s of stale) console.log(`${check ? 'stale ' : 'stamped'}  ${page}: ${s}`);
    if (!check && stale.length) fs.writeFileSync(abs, html);
  }
  if (!staleCount) console.log('all asset stamps current');
  process.exit(check && staleCount ? 1 : 0);
}
