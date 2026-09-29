#!/usr/bin/env node
/* =============================================================
   ascii3d.mjs — author, preview and bake the ASCII 3D figures.

   Runs the shipped engine (js/ascii3d.js) and every scene in
   js/diagrams/ inside a Node vm, so a terminal preview is the same
   frame the page draws. An agent can read the output as text; no
   browser or screenshot is needed to iterate on a figure.

   Usage:
     node tools/ascii3d.mjs list
     node tools/ascii3d.mjs render <id> [--yaw D] [--pitch D] [--dark]
                                        [--inks] [--turn N] [--color]
         --dark   shade as on a dark ground (emit) instead of paper
         --inks   also print the ink map (one letter per cell:
                  i ink, m muted, f faint, s signal, b science (blue),
                  g ok (green), r bad (red))
         --turn N print N frames spaced evenly around a full turn
         --color  ANSI colors (default when stdout is a terminal)
         --cols N, --rows N, --fit F   try a size or zoom without editing
         --live   also print the HUD line the live figure shows
     node tools/ascii3d.mjs bake            # rewrite baked frames in root *.html
     node tools/ascii3d.mjs bake --check    # report only; exit 1 if stale
     node tools/ascii3d.mjs new <id>        # scaffold js/diagrams/<id>.js

   Baked blocks: in a root page, the markers
     <!-- a3d:<id> --> … <!-- /a3d:<id> -->
   are replaced with the scene's first frame, shaded for paper (the
   no-JS theme), plus its aria-label. tools/check-data.mjs imports
   bakeAll() and fails on a stale block, like an asset stamp.

   Schema and workflow: docs/diagrams.md. Pure Node, zero deps.
   ============================================================= */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(ROOT, p);
export const SCENE_DIR = 'js/diagrams';

/* Load the engine + all scenes into a fresh sandbox. */
export function loadEngine() {
  const ctx = { console };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(rel('js/ascii3d.js'), 'utf8'), ctx, { filename: 'js/ascii3d.js' });
  const files = fs.existsSync(rel(SCENE_DIR)) ? fs.readdirSync(rel(SCENE_DIR)).filter((f) => f.endsWith('.js')).sort() : [];
  const fileOf = {};
  for (const f of files) {
    const before = new Set(ctx.ASCII3D.ids());
    vm.runInContext(fs.readFileSync(rel(`${SCENE_DIR}/${f}`), 'utf8'), ctx, { filename: `${SCENE_DIR}/${f}` });
    for (const id of ctx.ASCII3D.ids()) if (!before.has(id)) fileOf[id] = `${SCENE_DIR}/${f}`;
  }
  return { A3D: ctx.ASCII3D, fileOf };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The baked block for one scene: stage + grid, first frame, paper shading. */
export function bakedBlock(A3D, id) {
  const scene = A3D.get(id);
  const fr = A3D.frame(id, { mode: 'absorb' });
  const label = scene.alt ? ` aria-label="${esc(scene.alt)}"` : '';
  return `<div class="a3d-stage" role="img"${label}><pre class="a3d-grid" aria-hidden="true" style="--a3d-cols:${fr.cols}">`
    + A3D.toHTML(fr) + '</pre><div class="a3d-hud" aria-hidden="true"></div></div>';
}

const BLOCK = /(<!-- a3d:([a-z0-9-]+) -->)([\s\S]*?)(<!-- \/a3d:\2 -->)/g;

/* Every root page: { page, id, fresh, unknown }; write=true rewrites stale ones. */
export function bakeAll({ write = false } = {}) {
  const { A3D } = loadEngine();
  const results = [];
  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
  for (const page of pages) {
    const abs = rel(page);
    const html = fs.readFileSync(abs, 'utf8');
    let changed = false;
    const out = html.replace(BLOCK, (whole, open, id, body, close) => {
      if (!A3D.get(id)) { results.push({ page, id, fresh: false, unknown: true }); return whole; }
      const want = bakedBlock(A3D, id);
      const fresh = body === want;
      results.push({ page, id, fresh, unknown: false });
      if (!fresh) changed = true;
      return open + want + close;
    });
    if (write && changed) fs.writeFileSync(abs, out);
  }
  return results;
}

/* ---------- terminal output ---------- */
const LETTER = { ink: 'i', muted: 'm', faint: 'f', signal: 's', science: 'b', ok: 'g', bad: 'r', ghost: ' ' };
const ANSI = { ink: '', muted: '\x1b[37m', faint: '\x1b[90m', signal: '\x1b[31m', science: '\x1b[34m', ok: '\x1b[32m', bad: '\x1b[91m' };

function printFrame(A3D, fr, { color, inks }) {
  const text = color
    ? A3D.toRuns(fr).map((runs) => runs.map(([ink, s]) => (ANSI[ink] ? ANSI[ink] + s + '\x1b[0m' : s)).join('')).join('\n')
    : A3D.toText(fr);
  const ruler = '+' + '-'.repeat(fr.cols) + '+';
  console.log(ruler);
  for (const line of text.split('\n')) console.log('|' + line + ' '.repeat(Math.max(0, fr.cols - line.replace(/\x1b\[[0-9;]*m/g, '').length)) + '|');
  console.log(ruler);
  if (inks) {
    console.log('ink map:');
    for (let r = 0; r < fr.rows; r++) {
      let row = '';
      for (let c = 0; c < fr.cols; c++) {
        const k = r * fr.cols + c;
        row += fr.chars[k] === ' ' ? ' ' : LETTER[A3D.INKS[fr.inks[k]]];
      }
      console.log('|' + row + '|');
    }
  }
}

const TEMPLATE = (id) => `/* =============================================================
   ${id} — ASCII 3D figure (js/diagrams/${id}.js).
   What it shows, where it is used, and what is schematic.
   Preview: node tools/ascii3d.mjs render ${id} --inks
   Schema:  docs/diagrams.md
   ============================================================= */
(function () {
    'use strict';
    if (!window.ASCII3D) return;

    window.ASCII3D.define('${id}', {
        alt: 'Describe the figure for a screen reader: what it depicts and the one thing it shows.',
        cols: 64, rows: 22,
        camera: { yaw: 30, pitch: 20, fit: 0.85 },
        motion: { spin: 18 },
        parts: [
            { kind: 'torus', R: 1, r: 0.35, ink: 'ink' },
            { kind: 'line', points: [[-1.6, 0, 0], [1.6, 0, 0]], ink: 'faint' }
        ],
        labels: [
            { at: [1, 0.35, 0], text: 'label', ink: 'science' }
        ]
    });
})();
`;

/* ---------- CLI ---------- */
function main(argv) {
  const [cmd, ...rest] = argv;
  const flag = (n) => rest.includes(n);
  const opt = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };

  if (cmd === 'list') {
    const { A3D, fileOf } = loadEngine();
    for (const id of A3D.ids()) {
      const s = A3D.get(id);
      console.log(`${id.padEnd(16)} ${String(s.cols).padStart(3)}x${String(s.rows).padEnd(3)} ${fileOf[id] || ''}`);
    }
    return 0;
  }

  if (cmd === 'render') {
    const id = rest.find((a) => !a.startsWith('--') && !/^-?\d/.test(a));
    const { A3D } = loadEngine();
    if (!id || !A3D.get(id)) { console.error(`unknown scene "${id || ''}" — try: node tools/ascii3d.mjs list`); return 1; }
    const scene = A3D.get(id);
    /* try a size or zoom without editing the scene */
    if (opt('--cols')) scene.cols = Number(opt('--cols'));
    if (opt('--rows')) scene.rows = Number(opt('--rows'));
    if (opt('--fit')) scene.camera = Object.assign({}, scene.camera, { fit: Number(opt('--fit')) });
    const cam = scene.camera || {};
    const base = { yaw: Number(opt('--yaw', cam.yaw || 0)), pitch: Number(opt('--pitch', cam.pitch || 0)) };
    const mode = flag('--dark') ? 'emit' : 'absorb';
    const color = flag('--color') || (process.stdout.isTTY && !flag('--no-color'));
    const turn = Number(opt('--turn', 0));
    const views = turn > 0 ? Array.from({ length: turn }, (_, i) => ({ yaw: base.yaw + (360 * i) / turn, pitch: base.pitch })) : [base];
    for (const v of views) {
      console.log(`${id}  yaw ${v.yaw.toFixed(0)}  pitch ${v.pitch.toFixed(0)}  (${mode})`);
      const fr = A3D.frame(id, { yaw: v.yaw, pitch: v.pitch, mode });
      printFrame(A3D, fr, { color, inks: flag('--inks') });
      if (flag('--live')) console.log(' drag to turn' + ' '.repeat(Math.max(1, fr.cols - 12 - A3D.readout(fr.view).length)) + A3D.readout(fr.view));
    }
    return 0;
  }

  if (cmd === 'bake') {
    const check = flag('--check');
    const res = bakeAll({ write: !check });
    let bad = 0;
    for (const r of res) {
      if (r.unknown) { bad++; console.log(`unknown  ${r.page}: a3d:${r.id} has no scene`); }
      else if (!r.fresh) { bad++; console.log(`${check ? 'stale  ' : 'baked  '}  ${r.page}: a3d:${r.id}`); }
    }
    if (!bad) console.log(`all ${res.length} baked figure(s) current`);
    return check && bad ? 1 : res.some((r) => r.unknown) ? 1 : 0;
  }

  if (cmd === 'new') {
    const id = rest[0];
    if (!/^[a-z0-9-]+$/.test(id || '')) { console.error('usage: node tools/ascii3d.mjs new <kebab-id>'); return 1; }
    const file = rel(`${SCENE_DIR}/${id}.js`);
    if (fs.existsSync(file)) { console.error(`${SCENE_DIR}/${id}.js exists`); return 1; }
    fs.mkdirSync(rel(SCENE_DIR), { recursive: true });
    fs.writeFileSync(file, TEMPLATE(id));
    console.log(`wrote ${SCENE_DIR}/${id}.js — preview: node tools/ascii3d.mjs render ${id} --inks`);
    return 0;
  }

  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 30).join('\n'));
  return cmd ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
