#!/usr/bin/env node
/* =============================================================
   sync-tokens.mjs — colours are written once, in tokens/theme.json.

   Regenerates, from tokens/theme.json:
     - the declarations between /* tokens:begin *\/ and /* tokens:end *\/
       in css/site.css (light, dark, and the prefers-color-scheme dark
       fallback) and css/oksat.css (the --ok-* mirror, light and dark);
     - the rect fill and circle stroke in images/favicon.svg.
   Everything outside those markers and fills is left byte-identical.
   Never hand-edit between the markers.

   Also gates WCAG 2.x contrast on the text pairs (AA, 4.5:1). A pair
   that already fails must be listed in theme.json `contrastExceptions`
   with its id; the colour is not changed here. An exception that now
   passes is also an error, so the list cannot rot.

   Usage:  node tools/sync-tokens.mjs           # rewrite stale blocks, print contrast
           node tools/sync-tokens.mjs --check   # write nothing; exit 1 if stale or failing

   Pure Node, zero dependencies. tools/check-data.mjs imports
   checkSync() and contrastGate() (its checkTokens).
   ============================================================= */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME_FILE = path.join(ROOT, 'tokens', 'theme.json');

/* Blocks per file, in file order. Each entry names the theme whose values fill it. */
const BLOCKS = {
  'css/site.css': ['light', 'dark', 'dark'],   // dark = the prefers-color-scheme fallback
  'css/oksat.css': ['light', 'dark'],
};
const FAVICON = 'images/favicon.svg';

const MARK = /^([ \t]*)\/\* tokens:begin \*\/\n[\s\S]*?^[ \t]*\/\* tokens:end \*\/\n/gm;

export function loadTheme() {
  return JSON.parse(fs.readFileSync(THEME_FILE, 'utf8'));
}

/* Hex literal, or a "theme.token" / "token" reference resolved in `theme`. */
function resolve(theme, value, where) {
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value.toUpperCase();
  const [name, key] = value.includes('.') ? value.split('.') : [null, value];
  const scope = name ? theme.themes[name] : theme.themes[where];
  if (!scope || !(key in scope)) throw new Error(`theme.json: "${value}" is neither a #hex nor a known token (${where})`);
  return scope[key].toUpperCase();
}

function validate(theme) {
  const names = Object.keys(theme.themes);
  if (names.join() !== 'light,dark') throw new Error('theme.json: themes must be exactly light, dark');
  const keys = (t) => Object.keys(theme.themes[t]).join();
  if (keys('light') !== keys('dark')) throw new Error('theme.json: light and dark define different tokens');
  for (const t of names) for (const [k, v] of Object.entries(theme.themes[t])) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(v)) throw new Error(`theme.json: ${t}.${k} is not a #hex colour`);
  }
  for (const t of names) if (!theme.oksat || !theme.oksat[t]) throw new Error(`theme.json: oksat.${t} missing`);
}

/* Replace the body of every marked block, in order. Count must match. */
function fillBlocks(text, bodies, label) {
  const found = [...text.matchAll(MARK)];
  if (found.length !== bodies.length) {
    throw new Error(`${label}: expected ${bodies.length} tokens:begin/end blocks, found ${found.length}`);
  }
  let out = '';
  let at = 0;
  found.forEach((m, i) => {
    const indent = m[1];
    out += text.slice(at, m.index);
    out += `${indent}/* tokens:begin */\n` + bodies[i].map((l) => `${indent}${l}\n`).join('') + `${indent}/* tokens:end */\n`;
    at = m.index + m[0].length;
  });
  return out + text.slice(at);
}

function faviconText(text, theme) {
  const bg = resolve(theme, theme.favicon.background, 'light');
  const mark = resolve(theme, theme.favicon.mark, 'dark');
  const rect = [...text.matchAll(/(<rect\b[^>]*?\bfill=")([^"]*)(")/g)];
  const circ = [...text.matchAll(/(<circle\b[^>]*?\bstroke=")([^"]*)(")/g)];
  if (rect.length !== 1 || circ.length !== 1) throw new Error(`${FAVICON}: expected one rect fill and one circle stroke`);
  return text
    .replace(/(<rect\b[^>]*?\bfill=")([^"]*)(")/, (w, a, old, c) => a + bg + c)
    .replace(/(<circle\b[^>]*?\bstroke=")([^"]*)(")/, (w, a, old, c) => a + mark + c);
}

/* Map of repo-relative path -> the complete new file text. */
export function generate(theme = loadTheme()) {
  validate(theme);
  const out = new Map();
  for (const [file, themesInOrder] of Object.entries(BLOCKS)) {
    const abs = path.join(ROOT, file);
    const bodies = themesInOrder.map((t) => {
      if (file.endsWith('site.css')) {
        return Object.keys(theme.themes[t]).map((k) => `--${k}: ${resolve(theme, k, t)};`);
      }
      return Object.entries(theme.oksat[t]).map(([k, v]) => `${k}: ${resolve(theme, v, t)};`);
    });
    out.set(file, fillBlocks(fs.readFileSync(abs, 'utf8'), bodies, file));
  }
  out.set(FAVICON, faviconText(fs.readFileSync(path.join(ROOT, FAVICON), 'utf8'), theme));
  return out;
}

/* Files whose text differs from what theme.json generates. */
export function checkSync(theme = loadTheme()) {
  const stale = [];
  for (const [file, want] of generate(theme)) {
    if (fs.readFileSync(path.join(ROOT, file), 'utf8') !== want) stale.push(file);
  }
  return stale;
}

/* ---- WCAG 2.x contrast ---- */
export function luminance(hex) {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = hex.slice(1).match(/../g).map((h) => lin(parseInt(h, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_ON_SURFACE = ['ink', 'ink-muted', 'ink-faint', 'signal', 'signal-2', 'ok', 'bad'];
const SURFACES = ['bg', 'surface'];

/* Every text pair: id "<theme> <fg> on <bg>", e.g. "dark signal-2 on surface". */
export function contrastPairs(theme = loadTheme()) {
  const pairs = [];
  for (const t of ['light', 'dark']) {
    for (const s of SURFACES) for (const fg of TEXT_ON_SURFACE) pairs.push({ id: `${t} ${fg} on ${s}`, fg, bg: s, t });
    pairs.push({ id: `${t} on-signal on signal`, fg: 'on-signal', bg: 'signal', t });
  }
  return pairs.map((p) => {
    const fg = theme.themes[p.t][p.fg];
    const bg = theme.themes[p.t][p.bg];
    const ratio = contrast(fg, bg);
    return { id: p.id, fg, bg, ratio };
  });
}

/* Returns the rows and the failures. A failing pair must be a documented exception;
   an exception that passes is also a failure (remove it from theme.json). */
export function contrastGate(theme = loadTheme()) {
  const exc = new Map((theme.contrastExceptions || []).map((e) => [e.id, e]));
  const rows = contrastPairs(theme).map((r) => {
    const pass = r.ratio >= 4.5;
    let status;
    if (pass && exc.has(r.id)) status = 'STALE EXCEPTION';
    else if (pass) status = 'pass';
    else if (exc.has(r.id)) status = 'EXCEPTION';
    else status = 'FAIL';
    return { ...r, status };
  });
  const known = new Set(rows.map((r) => r.id));
  for (const id of exc.keys()) if (!known.has(id)) rows.push({ id, fg: '-', bg: '-', ratio: NaN, status: 'UNKNOWN EXCEPTION' });
  const failures = rows.filter((r) => ['FAIL', 'STALE EXCEPTION', 'UNKNOWN EXCEPTION'].includes(r.status));
  return { rows, failures, exceptions: rows.filter((r) => r.status === 'EXCEPTION').length };
}

function printTable(rows) {
  const w = Math.max(...rows.map((r) => r.id.length));
  console.log(`${'pair'.padEnd(w)}  fg       bg       ratio   AA(4.5)`);
  for (const r of rows) {
    const ratio = Number.isNaN(r.ratio) ? '   -  ' : r.ratio.toFixed(2).padStart(6);
    console.log(`${r.id.padEnd(w)}  ${String(r.fg).padEnd(8)} ${String(r.bg).padEnd(8)} ${ratio}   ${r.status}`);
  }
}

function main() {
  const check = process.argv.includes('--check');
  const theme = loadTheme();
  const want = generate(theme);
  const stale = [];
  for (const [file, text] of want) {
    const abs = path.join(ROOT, file);
    if (fs.readFileSync(abs, 'utf8') === text) continue;
    stale.push(file);
    if (!check) fs.writeFileSync(abs, text);
  }
  if (check) {
    console.log(stale.length ? `out of date: ${stale.join(', ')}` : 'generated blocks and favicon match tokens/theme.json');
  } else {
    console.log(stale.length ? `rewrote: ${stale.join(', ')}` : 'nothing to rewrite; generated blocks and favicon already match');
  }
  const gate = contrastGate(theme);
  printTable(gate.rows);
  console.log(gate.failures.length ? `contrast FAILED: ${gate.failures.length} pair(s)` : `contrast OK (${gate.exceptions} documented exception(s))`);
  process.exit(stale.length && check || gate.failures.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
